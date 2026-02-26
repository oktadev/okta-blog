---
layout: blog_post
title: "Integrate Your Universal Logout Endpoint with Okta"
author: semona-igama
by: advocate
communities: [devops,security,mobile,.net,java,javascript,go,php,python,ruby]
description: "Learn how to integrate your Global Token or Universal Logout Endpoint with Okta as your Identity Provider."
tags: [enterprise-ready-workshops, express, oidc, universal-logout]
tweets:
- ""
- ""
- ""
image: blog/universal-logout/universal-logout-2.jpeg
type: awareness
---

This blog post builds upon the concepts introduced in [Universal Logout Part 1](https://developer.okta.com/blog/2024/04/30/express-universal-logout#create-the-required-token-revocation-endpoint). Here, we will delve into configuring universal logout specifically through the Identity Provider, with a focus on Okta.

Quick recap from Universal Logout Part 1 lab: 
- You created a Global Token Revocation endpoint
- You secured this endpoint with an API key, which you have associated with an org and a user
- You can end a user's session tied to their user ID 
- Your app can redirect the user back to the login when they now longer have a session

Goals for Universal Logout Part 2 lab:
- Substitute API tokens for Private key JWT authorization
- Validate Private key JWT with Okta JWT Verifier library
- Integrate with Okta and test ending a user's session through the Admin dashboard

## Allow only authorized access to the endpoint
We recommend OAuth 2.0 authorization to secure your Global Token Revocation (GTR) endpoint instead of API tokens. Static API tokens are problematic as they are long-lived and must be manually invalidated. For more details, see this blog on [Why You Should Migrate to OAuth 2.0 From Static API Tokens](https://developer.okta.com/blog/2023/09/25/oauth-api-tokens).

### Private key JWT Authorization

Using the Authorization method with a Private key JWT, we need to verify that the tokens from Okta are valid. Okta has a library that can handle this for us, so let's install the [Okta JWT Verifier library](https://www.npmjs.com/package/@okta/jwt-verifier).

`npm install --save @okta/jwt-verifier`

Import the Okta JWT Verifier library from the okta/jwt-verifier package at the top of the `apps/api/src/main.ts` file, removing the Bearer Auth strategy and BearerStrategy variable.

```javascript
// Bearer Auth - Universal Logout
import passportBearer from 'passport-http-bearer';

...

// Bearer Auth - Universal Logout
const BearerStrategy = passportBearer.Strategy;
```

It should look like this now:

```javascript
import express from 'express';
import { PrismaClient, Todo, User } from '@prisma/client';
import passportLocal from 'passport-local';
import passportOIDC from 'passport-openidconnect';
import passport from 'passport';
import session from 'express-session';
import { universalLogoutRoute } from './universalLogout';
import morgan from 'morgan';
import { store } from './sessionsStore';

// Signed JWT Verifier for Universal Logout
import OktaJwtVerifier from '@okta/jwt-verifier';

interface IUser {
  id: number;
}
const prisma = new PrismaClient();
const LocalStrategy = passportLocal.Strategy;
const OpenIDConnectStrategy = passportOIDC.Strategy;
```

Then, instantiate the Okta JWT Verifier under your UL section. You'll need to include the issuer, the authorization server from which we expect the signed JWT to originate, and the public keys endpoint so the library can cryptographically match the signed token with the keys published at this endpoint. Using Okta as the IdP, you can find the issuer and keys endpoint information at the Okta Org Authorization Server's metadata endpoint.


```javascript
///////////////////////////////////////////////////////
// Universal Logout Route

// Signed Jwt Validation
const oktaJwtVerifier = new OktaJwtVerifier({
  issuer: 'https://{yourOktaDomain}.com',
  jwksUri: 'https://{yourOktaDomain}.com/oauth2/v1/keys',
});
```

Next, we'll need to create a custom middleware called `tokenValidator` to get the signed JWT from the POST request body and validate it with the Okta JWT Verifier. The signed JWT method takes in two parameters: the JWT and expectedAud, which is your UL endpoint. 

> **Note:** The example expectedAud below uses a base URL provided by the localtunnel service that we will implement under the Test the token revocation endpoint section so be sure to substitute that base URL with your own. 

```javascript
///////////////////////////////////////////////////////
// Universal Logout Route

// Signed Jwt Validation
const oktaJwtVerifier = new OktaJwtVerifier({
  issuer: 'https://{yourOktaDomain}.com',
  jwksUri: 'https://{yourOktaDomain}.com/oauth2/v1/keys',
});

const tokenValidator = async function (req, res, next) {
  const authHeaders = req.headers.authorization;
  if (!authHeaders) {
    return res.sendStatus(401);
  }
  const parts = authHeaders.split(' ');
  const jwt = parts[1];
  const expectedAud =
    'https://{base-URL-provided-by-local-tunnel}/global-token-revocation';

  try {
    const verifiedJwt = await oktaJwtVerifier.verifyAccessToken(
      jwt,
      expectedAud
    );
    console.log(verifiedJwt.claims);
  } catch (err) {
    return res.sendStatus(401);
  }
  const issuer = jwt.iss;
  const org = await prisma.org.findFirst({
    where: {
      issuer: issuer,
    },
  });

  req.org = org;
  next();
};

app.use(morgan('combined'));
app.use('/', tokenValidator, universalLogoutRoute);
```

Finally, note the last line of code passes the `tokenValidator` to be executed for all requests starting with the path `/`.

> **Recap:** Your `apps/api/src/main.ts` file should now look like this, eliminating any reference to API Key token authorization:

```javascript
import express from 'express';
import { PrismaClient, Todo, User } from '@prisma/client';
import passportLocal from 'passport-local';
import passportOIDC from 'passport-openidconnect';
import passport from 'passport';
import session from 'express-session';
import { universalLogoutRoute } from './universalLogout';
import morgan from 'morgan';
import { store } from './sessionsStore';

// Signed JWT Verifier for Universal Logout
import OktaJwtVerifier from '@okta/jwt-verifier';
interface IUser {
  id: number;
}
const prisma = new PrismaClient();
const LocalStrategy = passportLocal.Strategy;
const OpenIDConnectStrategy = passportOIDC.Strategy;
const app = express();
app.use(express.json())
app.use(session({
  resave: false,
  saveUninitialized: false,
  secret: 'top secret',
  cookie: {
    http: false,
    sameSite: 'lax'
  },
  store
}));
app.use(passport.initialize());
app.use(passport.session());
app.use('/api/todos', (req, res, next) => {
  if (req.isUnauthenticated()) {
    return res.sendStatus(401);
  }
  next();
});
app.use('/api/users', (req, res, next) => {
  if (req.isUnauthenticated()) {
    return res.sendStatus(401);
  }
  next();
});
passport.use(new LocalStrategy(async (username, password, done) => {
    const user = await prisma.user.findFirst({
      where: {
        AND: {
          email: username,
          password
        }
      }
    });
    return done(null, user);
  }
));
passport.serializeUser( async (user: IUser, done) => {
  done(null, user.id);
});
passport.deserializeUser( async (id: number, done) => {
  const user: User = await prisma.user.findUnique({
    where: {
     id
    }
  });
  done(null, user);
});
app.post('/api/signin', passport.authenticate('local'), async (req, res) => {
  res.json({
    name: req.user['name']
  })
});
app.post('/api/signout', async (req, res, next) => {
  req.logout((err) => {
    if (err) { return next(err)};
    res.sendStatus(204);
  });
});
app.get('/api/users/me', async (req, res) => {
  const user: User = await prisma.user.findUnique({
    where: {
      id: req.user['id']
    }
  });
  delete user.password;
  res.json({...user});
});
app.get('/api/todos', async ( req, res) => {
  const todos: Todo[] = await prisma.todo.findMany({
    where: {
      userId: req.user['id']
    }
  });
  res.json({todos});
});
app.post('/api/todos', async (req, res) => {
  const { task } = req.body;
  const id = req.user['id'];
  const todo: Todo = await prisma.todo.create({
    data: {
      task,
      completed: false,
      user: { connect: {id}},
      org: { connect: {id: req.user['orgId']}}
    }
  })
  res.json(todo);
});
app.put('/api/todos/:id', async (req, res) => {
  const id  = parseInt(req.params.id);
  const { task, completed } = req.body;
  let completedAt = null;
  if (completed) {
    completedAt = new Date().toISOString();
  }
  const todo: Todo = await prisma.todo.update({
    where: { id },
    data: { task, completed, completedAt }
  });
  res.json(todo);
});
app.delete('/api/todos/:id', async (req, res) => {
  const id  = parseInt(req.params.id);
  await prisma.todo.delete({
    where: { id }
  });
  res.sendStatus(204);
});
const port = process.env.PORT || 3333;
const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`);
});
server.on('error', console.error);
////////////////////////////////////////////
// OpenID Connect Routes Below
function getDomainFromEmail(email) {
  let domain;
  try {
    domain = email.split('@')[1];
  } catch(e) {
    return null;
  }
  return domain;
}
app.post('/api/openid/check', async (req, res, next) => {
  const { username } = req.body;
  const domain = getDomainFromEmail(username);
  if(domain) {
    var org = await prisma.org.findFirst({
      where: {
        domain: domain
      }
    });
    if(!org) {
      org = await prisma.org.findFirst({
        where: {
          User: {
            some: {
              email: username
            }
          }
        }
      })
    }
    if(org && org.issuer) {
      return res.json({ org_id: org.id });
    }
  }
  res.json({ org_id: null });
});
function createStrategy(org) {
  return new OpenIDConnectStrategy({
    issuer: org.issuer,
    authorizationURL: org.authorization_endpoint,
    tokenURL: org.token_endpoint,
    userInfoURL: org.userinfo_endpoint,
    clientID: org.client_id,
    clientSecret: org.client_secret,
    scope: 'profile email',
    callbackURL: 'http://localhost:3333/openid/callback/'+org.id
  },
  async function verify(issuer, profile, cb) {
    // Passport.js runs this verify function after successfully completing
    // the OIDC flow, and gives this app a chance to do something with
    // the response from the OIDC server, like create users on the fly.
    var user = await prisma.user.findFirst({
      where: {
        orgId: org.id,
        externalId: profile.id,
      }
    })
    if(!user) {
      user = await prisma.user.findFirst({
        where: {
          orgId: org.id,
          email: profile.emails[0].value,
        }
      })
      if(user) {
        await prisma.user.update({
          where: {id: user.id},
          data: {externalId: profile.id}
        })
      }
    }
    if(!user) {
      user = await prisma.user.create({
        data: {
          org: {connect: {id: org.id}},
          externalId: profile.id,
          email: profile.emails[0].value,
          name: profile.displayName,
        }
      })
    }
    return cb(null, user);
  })
}
async function orgFromId(id) {
  const org = await prisma.org.findFirst({
    where: {
      id: parseInt(id)
    }
  })
  return org
}
// The frontend then redirects here to have the backend start the OIDC flow.
// (You should probably use random IDs, not auto-increment integers
// to avoid revealing how many enterprise customers you have.)
app.get('/openid/start/:id', async (req, res, next) => {
  const org = await orgFromId(req.params.id);
  if(!org) {
    return res.sendStatus(404);
  }
  const strategy = createStrategy(org);
  if(!strategy) {
    return res.sendStatus(404);
  }
  passport.authenticate(strategy)(req, res, next);
});
app.get('/openid/callback/:id', async (req, res, next) => {
  const org = await orgFromId(req.params.id);
  if(!org) {
    return res.sendStatus(404);
  }
  const strategy = createStrategy(org);
  if(!strategy) {
    return res.sendStatus(404);
  }
  passport.authenticate(strategy, {
    successRedirect: 'http://localhost:3000/'
  })(req, res, next);
});
///////////////////////////////////////////////////////
// Universal Logout Route
// Signed Jwt Validation
const oktaJwtVerifier = new OktaJwtVerifier({
  issuer: 'https://{yourOktaDomain}.com',
  jwksUri: 'https://{yourOktaDomain}.com/oauth2/v1/keys',
});
const tokenValidator = async function (req, res, next) {
  const authHeaders = req.headers.authorization;
  if (!authHeaders) {
    return res.sendStatus(401);
  }
  const parts = authHeaders.split(' ');
  const jwt = parts[1];
  const expectedAud =
    'https://noble-heterogenetic-clemmie.ngrok-free.dev/global-token-revocation';
  try {
    const verifiedJwt = await oktaJwtVerifier.verifyAccessToken(
      jwt,
      expectedAud
    );
    console.log(verifiedJwt.claims);
    
    const issuer = verifiedJwt.claims.iss; // Get issuer from verified claims
    const org = await prisma.org.findFirst({
      where: {
        issuer: issuer,
      },
    });
    req.org = org;
    next();
  } catch (err) {
    console.l;
    return res.sendStatus(401);
  }
};

app.use(morgan('combined'));
app.use('/', tokenValidator, universalLogoutRoute);
```

We'll also need to make some changes to the `apps/api/src/universalLogout.ts` file. From the tokenValidator we now know the org context related to the Private key JWT (previsouly we used user ID to figure out the domain org id associated to the API Token). We'll use the org id info to find the specific user linked to the request. 


```javascript
 // Find the user by email associated with the org id from the validated signed JWT
  const domainOrg = req['org']
  const newRequest: IRequestSchema = req.body;
  const { email } = newRequest.sub_id
  const user = await prisma.user.findFirst({
    where: {
      email: email,
      org: { id: domainOrg.id } ,
    },
  });
  
 ...
```

The complete `apps/api/src/universalLogout.ts` file will be:

```javascript
import { Router } from 'express';
export const universalLogoutRoute = Router();
import { PrismaClient } from '@prisma/client';
import { store } from './sessionsStore';
const prisma = new PrismaClient();
interface IRequestSchema {
  'sub_id': {format:string; email: string};
}
universalLogoutRoute.post('/global-token-revocation', async (req, res) => {
  // 204 When the request is successful
  const httpStatus = 204;
  // 400 If the request is malformed
  if (!req.body) {
    return res.status(400);
  }
  // Find the user by email associated with the org id from the validated signed JWT
  const domainOrg = req['org']
  const newRequest:IRequestSchema = req.body;
  const { email } = newRequest.sub_id;
  const user = await prisma.user.findFirst({
    where: {
      email: email,
      org: { id: domainOrg.id } ,
    },
  });
  // 404 User not found
  if (!user) {
    return res.sendStatus(404);
  }
  // End user session
  const storedSession = store.sessions;
  const userId = user.id;
  const sids = [];
  Object.keys(storedSession).forEach((key) => {
    const sess = JSON.parse(storedSession[key]);
    if (sess.passport.user === userId) {
      sids.push(key);
    }
  });
  sids.map((sid) => store.destroy(sid));
  console.log('User session deleted')
  return res.sendStatus(httpStatus);
});
universalLogoutRoute.use((err,req,res,next) => {
  if(err){
    return res.sendStatus(404)
  }
})
```

>**Checkpoint:** We'll test this functionality when we connect with Okta.

Moving right along, now that we have the target user of a specific org. Let's figure out how to target their application session and end it.

## Test with Okta

Now that the app has a secure, working UL endpoint. In this section, we'll test the endpoint with Okta.

### Test the endpoint

Now, let's test UL authentication. One way to give your app a public URL or IP is to host it on a cloud instance with a DNS server that you control. For development purposes, you can use Ngrok or Localtunnel to provide a public address to the app running on your computer.

We’ll use Localtunnel in this demonstration. To run the tunnel, you’ll start the API with the following command on your terminal:

`npm run serve-api`

In another terminal, start the tunnel using the following command:

`npx localtunnel --port 3333`

It will ask for permission to install the npm package; say yes. When you start Localtunnel, it will print a URL to your terminal, such as http://unique-url-for-squirrels. You will need that URL when we call the UL endpoint.

> **Troubleshooting tip:** Localtunnel is know to have timeout issues i.e. 408 response errors. For a more stable proxy option you can try [ngrok](https://ngrok.com/). Similarly, you can peform the following commands to obtain a proxy url after you install and get your auth key through your ngrok dashboard. 

```
ngrok config add-authtoken {your-authtoken-from-your-dashboard}
ngrok http 3333
```

### Provide revocation endpoint info to the Okta

Log in to your Okta dashboard, and under your UL App, go to the General tab. Within the General tab, look for the Logout > Global token revocation endpoint section enable the Okta system or admin initiates logout option and add your Logout endpoint URL with your proxy URL, for example, "https://easy-states-create.loca.lt/global-token-revocation", with Subject format set to Email Identifier, and Auth method set to "Private key JWT." Meaning Okta will send a request identifying the user with the email used to SSO into the Todo app. It will authenticate to the endpoint with the secure OAuth method Private key JWT.

In addition, we'll need to update the expectedAud to match the base URL provided by the Localtunnel service, so be sure to substitute that base URL with your own in the `apps/api/src/main.ts` file. 

```javascript
///////////////////////////////////////////////////////
// Universal Logout Route

// Signed Jwt Validation
const oktaJwtVerifier = new OktaJwtVerifier({
  issuer: 'https://{yourOktaDomain}.com',
  jwksUri: 'https://{yourOktaDomain}.com/oauth2/v1/keys',
});

const tokenValidator = async function (req, res, next) {
  const authHeaders = req.headers.authorization;
  if (!authHeaders) {
    return res.sendStatus(401);
  }
  const parts = authHeaders.split(' ');
  const jwt = parts[1];
  const expectedAud =
    'https://{base-URL-provided-by-local-tunnel}/global-token-revocation';
  try {
    const verifiedJwt = await oktaJwtVerifier.verifyAccessToken(
      jwt,
      expectedAud
    );
    console.log(verifiedJwt.claims);
    
    const issuer = verifiedJwt.claims.iss; // Get issuer from verified claims
    const org = await prisma.org.findFirst({
      where: {
        issuer: issuer,
      },
    });
    req.org = org;
    next();
  } catch (err) {
    return res.sendStatus(401);
  }
};

app.use(morgan('combined'));
app.use('/', tokenValidator, universalLogoutRoute);
```

### End a user's session through Okta

Be sure your test user for example "trinity@whiterabbit.fake" is logged in to the Todo App. From the Admin Console, go to Directory > People, and find the user you want whose session you want to delete. For example, let's end the user session for "trinity@whiterabbit.fake". To do this, click on their profile, click  More Actions, and then Clear User Sessions. Check the option "Clear "keep me signed in", and include Logout enabled apps and Okta API tokens." You'll receive a Sessions cleared and tokens revoked response.

Now, navigate to the Todo app and add a new task. Confirm that the user can't add a new task and is redirected to the login page to sign in again. If so, you have successfully implemented Universal Logout with Okta!


## Optional: Submit your SaaS app with Okta's Integration Network

Once you've successfully implemented and tested Universal Logout (UL) with Okta using the Private key JWT authorization method, as detailed in the previous sections, the final step in making your application "Enterprise-Ready" is submitting it to the Okta Integration Network (OIN). The OIN is Okta's catalog of pre-built integrations, making it easy for mutual customers to adopt your application.

### OIN Submission for Universal Logout 🚀
Submitting your application for inclusion in the OIN involves providing Okta with the necessary configuration details, including the fully secured and verified Global Token Revocation (GTR) endpoint.

Preparation and Review:
- Ensure your UL endpoint (/global-token-revocation in this example) is public-facing, highly available, and secured using the OAuth 2.0 Private key JWT method as implemented with the Okta JWT Verifier library.
- Confirm that your endpoint is configured to correctly receive and process the revocation request from Okta, responding with a 204 No Content on success or an appropriate error code (e.g., 400 or 404).

Access the OIN Submission Process:
- Navigate to the Okta developer documentation or the specific OIN Submission Portal (often linked from your Okta Developer Console) to begin the application submission process.
- You will typically be guided through a submission form where you provide details about your application's functionality and security protocols.

Provide UL Configuration Details:
- During the submission, you will be asked to supply the Global Token Revocation Endpoint URL. This is the public URL (e.g., https://your-app-domain.com/global-token-revocation).
- Specify the Authentication Method for this endpoint, which, based on this tutorial, is "Private key JWT".
-  Confirm the expected Subject format (e.g., "Email Identifier") that Okta will use to identify the user whose session needs to be revoked in the request body (sub_id).

Security and Trust Establishment:
- Okta's OIN team will review your implementation to ensure it meets all security and functional requirements for Universal Logout.
- The OAuth 2.0 Private key JWT method ensures a high level of security by requiring Okta to sign the revocation request, which your application then cryptographically verifies using the jwksUri you configured with the OktaJwtVerifier.

A successful OIN submission allows your SaaS application to be listed in the Okta Integration Network, signaling to Enterprise customers that your app supports essential features like Universal Logout for enhanced security and compliance.

## Continue adding more features to your SaaS app!
This tutorial provides the fundamental steps to creating a UL endpoint to end a user's session or tokens through Okta as the Identity Provider. Now that you have an OIDC app with a UL endpoint, you can continue your Enterprise-Ready journey by adding user lifecycle management through [System for Cross-domain Identity Management (SCIM)](https://datatracker.ietf.org/doc/html/rfc7644). Take a look at our blog on [Enterprise-Ready Workshop: Manage users with SCIM](/blog/2023/07/28/scim-workshop) to find out more information.

You can further manage your users and groups using Terraform or Workflows:

|Posts in the on-demand workshop series|
| --- |
| 1. [How to Get Going with the On-Demand SaaS Apps Workshops](/blog/2023/07/27/enterprise-ready-getting-started) |
| 2. [Enterprise-Ready Workshop: Authenticate with OpenID Connect](/blog/2023/07/28/oidc_workshop) |
| 3. [Enterprise-Ready Workshop: Manage Users with SCIM](/blog/2023/07/28/scim-workshop) |
| 4. [Enterprise Maturity Workshop: Terraform](/blog/2023/07/28/terraform-workshop) |
| 5. [Enterprise Maturity Workshop: Automate with no-code Okta Workflows](/blog/2023/09/15/workflows-workshop) |

Follow us on Twitter and subscribe to our YouTube channel. If you have any questions or want to share what tutorial you'd like to see next, please comment below!

## Resources
- [Build Universal Logout for your App](https://developer.okta.com/docs/guides/oin-universal-logout-overview/)
- [Global Token Revocation](https://datatracker.ietf.org/doc/html/draft-parecki-oauth-global-token-revocation)
