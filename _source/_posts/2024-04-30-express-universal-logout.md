---
layout: blog_post
title: "Build and Integrate Universal Logout with Okta"
author: semona-igama
by: advocate
communities: [devops,security,mobile,.net,java,javascript,go,php,python,ruby]
description: "Learn how to build a Universal Logout endpoint, secure it with OAuth 2.0 Private Key JWT, and integrate it with Okta so an admin can instantly sign a user out across all apps."
tags: [enterprise-ready-workshops, express, oidc, universal-logout]
tweets:
- ""
- ""
- ""
image: blog/express-universal-logout/social.jpg
type: awareness
github: https://github.com/oktadev/okta-enterprise-ready-workshops/tree/ul-workshop-complete
changelog:
  - 2026-07-10 => Updated to include OAuth 2.0 Private Key JWT authorization, Okta Admin Console integration for initiating Universal Logout end-to-end, and an optional OIN submission guide. The original post covered building the Global Token Revocation endpoint and securing it with an API key.
---

**Update**: This post was updated in July 2026 to include OAuth 2.0 Private Key JWT authorization, Okta Admin Console integration for initiating Universal Logout end-to-end, and an optional OIN submission guide. The original post covered building the Global Token Revocation endpoint and securing it with an API key.

Your enterprise customers expect you to safeguard them from security incidents, especially when it comes to compromised user accounts. Perhaps a user has signed in from a known stolen device or from outside an allowed IP zone. If a hacker is masquerading as one of your customers' employees, potentially accessing sensitive company data, you must end their session and sign them out of your app immediately.

If you build SaaS applications for enterprise customers who leverage Identity Providers (IdPs), workflows, and threat-detection tools, then adding Universal Logout to your app is the solution to ending suspicious user sessions ASAP.

In this tutorial, you'll build a secure Universal Logout API endpoint, test it by sending a request to end a user's active session, upgrade the authentication to OAuth 2.0 Private Key JWT, and finally integrate with Okta so an admin can initiate logout directly from the Okta Admin Console.

|Posts in the on-demand workshop series|
| --- |
| 1. [How to Get Going with the On-Demand SaaS Apps Workshops](/blog/2023/07/27/enterprise-ready-getting-started) |
| 2. [Enterprise-Ready Workshop: Authenticate with OpenID Connect](/blog/2023/07/28/oidc_workshop) |
| 3. [Enterprise-Ready Workshop: Manage Users with SCIM](/blog/2023/07/28/scim-workshop) |
| 4. [Enterprise Maturity Workshop: Terraform](/blog/2023/07/28/terraform-workshop) |
| 5. [Enterprise Maturity Workshop: Automate with no-code Okta Workflows](/blog/2023/09/15/workflows-workshop) |
| 6. **Build and Integrate Universal Logout with Okta** |

>**Note**: You can follow along with this blog to build Universal Logout or check out the finished code on the [ul-workshop-complete](https://github.com/oktadev/okta-enterprise-ready-workshops/tree/ul-workshop-complete) branch of our Oktadev GitHub repository.

{% include toc.md %}

## Get the sample app up and running

**Prerequisites**
- [Enterprise-Ready OIDC Workshop](/blog/2023/07/28/oidc_workshop) - [oidc-workshop-complete](https://github.com/oktadev/okta-enterprise-ready-workshops/tree/oidc-workshop-complete)
- Code Editor (I used [Visual Studio Code](https://code.visualstudio.com/download))
- [Okta Integrator Free Plan account](https://developer.okta.com/signup/)
- [Node.js](https://nodejs.org/en) v18 or greater

Run `node -v` and ensure you have Node version 18 or newer. Follow [these setup instructions](/blog/2023/07/27/enterprise-ready-getting-started) to install and run the Todo sample app.

>**Note**: If you have already completed the [Enterprise Ready OIDC Workshop](/blog/2023/07/28/oidc_workshop) and can successfully run the Todo app with OIDC-SSO configured with Okta, add a task, and sign a user out, please skip to the **Build a Universal Logout endpoint and secure it** section. If you haven't, please read on.

We'll build the Universal Logout (UL) endpoint on [the sample app](https://github.com/oktadev/okta-enterprise-ready-workshops/) with OIDC support. After cloning the repo, check out the oidc-workshop-complete branch with `git checkout oidc-workshop-complete`.

>**Troubleshooting tips**: Ensure you can run the Todo application before you begin. We'll be adding some code and testing along the way.

### Create an Okta Integrator Free Plan account
If you don't already have an Okta account, you can sign up for one here under [Integrator](https://developer.okta.com/signup/). You'll also need to create an [OpenID Connect (OIDC) application](https://developer.okta.com/docs/guides/implement-grant-type/authcode/main/#set-up-your-app), which you can do by following the instructions listed here under Setup your app. Set the Sign-in redirect URI as `http://localhost:3333/openid/callback/1`. Note down your **client_id** and **client_secret**; you'll need them in the next steps.

### Add configuration to authenticate with OIDC

You can view the user table locally using Prisma Studio. To do this, go to the root of this workshop folder in your terminal and run `npx prisma studio`. Your browser will open a new page that shows all users in your database.

While viewing your database locally, you'll also see an org table. By clicking the **Add record** button, you can manually enter the following information to seed your database with an org linked to an Okta authorization server, enabling OIDC-SSO login. Add the **client_id** and **client_secret** from the previous step, then click the **Save change** button to save your changes.

- id # = 1
- domain = whiterabbit.fake
- issuer = https://${yourOktaDomain}
- authorization_endpoint = https://${yourOktaDomain}/oauth2/v1/authorize
- token_endpoint = https://${yourOktaDomain}/oauth2/v1/token
- userinfo_endpoint = https://${yourOktaDomain}/oauth2/v1/userinfo
- client_id = ${ClientId}
- client_secret = ${ClientSecret}
- apikey = 131313

>**Note**: You can also get these OIDC-related endpoints by visiting this metadata URL `https://{yourOktaOrg}/.well-known/openid-configuration` provided by the [Okta Org authorization server](https://developer.okta.com/docs/concepts/auth-servers/#discovery-endpoints-org-authorization-servers).

### Create a test user

To test whether UL works for our app, we'll create a user in Okta and forcibly sign them out.
Open the Admin Console for your org, and go to **Directory** > **People**. Click **Add Person** and create a person with the following properties:

- User type: User
- First name: Trinity
- Last name: Anderson
- Username: trinity@whiterabbit.fake
- Activation: Activate now
- Enable the option **I will set password** > Enter a password of your choosing and click **Save**

Refresh the page, then click Trinity Anderson's profile. Click the **Assign Application** button and assign Trinity to the UL OIDC App.

### Migrate the test user

Now that you have a user in Okta, let's migrate Trinity to the correct Todo App org according to her company domain. Run the following command, then check the Prisma database to see if Trinity is in the whiterabbit.fake domain (org #1).

```shell
npm run oidc-migrate whiterabbit.fake
```

Finally, test that the user can sign in to the app.

## Build a Universal Logout endpoint and secure it

Now that we have the app set up, we'll extend it to include a UL endpoint. In this section, we'll test the endpoint, secure it, sign a user out, and finally end their session.

## Create the required token revocation endpoint

Create a file called `universalLogout.ts` under the `apps/api/src` folder and, at the top of the file, import `Router` from Express. From here, create a route called `universalLogoutRoute` and export it.

```ts
import { Router } from 'express';
export const universalLogoutRoute = Router();
```

Let's add the UL route to this file as well:

```ts
import { Router } from 'express';
export const universalLogoutRoute = Router();

universalLogoutRoute.post('/global-token-revocation', async (req, res) => {
// Build logic for your route here.
 });
```

Moving along, import `universalLogoutRoute` from `universalLogout.ts` at the top of `apps/api/src/main.ts`.

```ts
import { universalLogoutRoute } from './universalLogout';
```

The `apps/api/src/main.ts` file will now look like this:

```ts
import express from 'express';
import { PrismaClient, Todo, User } from '@prisma/client';
import passportLocal from 'passport-local';
import passport from 'passport';
import session from 'express-session';
import { universalLogoutRoute } from './universalLogout';
```

Add your UL route at the end of the OIDC-related code section:

```ts
///////////////////////////////////////////////////////
// Universal Logout Route

app.use('/', universalLogoutRoute);
```

Let's circle back to `apps/api/src/universalLogout.ts` and add more requirements to set up our UL endpoint. Include the Prisma client to access our database of users, so at the top of the file, add `import { PrismaClient } from '@prisma/client'`:

```ts
import { Router } from 'express';
export const universalLogoutRoute = Router();
import { PrismaClient } from '@prisma/client';
```

We'll need to instantiate a Prisma client and define a TypeScript interface to ensure the request coming to our endpoint is the data type we expect. As per the [Global Token Revocation Specification](https://datatracker.ietf.org/doc/html/draft-parecki-oauth-global-token-revocation#name-revocation-request), we expect an external request to end a user's session based on the email used for SSO with their IdP. The request will look like the following:

```http
POST /global-token-revocation
Host: example.com
Content-Type: application/json
Authorization: Bearer f5641763544a7b24b08e4f74045

{
  "sub_id": {
    "format": "email",
    "email": "user@example.com"
  }
}
```

Add the following code to find a user in the database by email.

```ts
const prisma = new PrismaClient();

interface IRequestSchema {
  'sub_id': {format:string; email: string};
}

universalLogoutRoute.post('/global-token-revocation', async (req, res) => {
  // 204 When the request is successful
  const httpStatus = 204;

  // 400 If the request is malformed
  if (!req.body) {
    res.status(400);
  }

  // Find the user
  const newRequest:IRequestSchema = req.body;
  const { email } = newRequest.sub_id;
  const user = await prisma.user.findFirst({
    where: {
      email: email
    },
  });

  // 404 User not found
  if (!user) {
    res.sendStatus(404);
  }

  return res.sendStatus(httpStatus);
});

universalLogoutRoute.use((err,req,res,next) => {
  if(err){
    return res.sendStatus(404)
  }
})
```

The `apps/api/src/universalLogout.ts` file now looks like the following:

```ts
import { Router } from 'express';
export const universalLogoutRoute = Router();
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

interface IRequestSchema {
  'sub_id': {format:string; email: string};
}
universalLogoutRoute.post('/global-token-revocation', async (req, res) => {
  // 204 When the request is successful
  const httpStatus = 204;

  // 400 If the request is malformed
  if (!req.body) {
    res.status(400);
  }

  // Find the user
  const newRequest:IRequestSchema = req.body;
  const { email } = newRequest.sub_id;
  const user = await prisma.user.findFirst({
    where: {
      email: email
    },
  });
  
  // 404 User not found
  if (!user) {
    res.sendStatus(404);
  }

  return res.sendStatus(httpStatus);

});

universalLogoutRoute.use((err,req,res,next) => {
  if(err){
    return res.sendStatus(404)
  }
})
```

>**Checkpoint**: Now is an excellent time to test our code.

### Test the token revocation endpoint

Before we proceed, let's make sure the token revocation endpoint works. We'll use [cURL](https://curl.se/docs/httpscripting.html) to send requests to the endpoint and [Morgan](https://www.npmjs.com/package/morgan), an HTTP logger middleware, to see the response codes it returns.

In a new terminal, install Morgan with the following command:

```shell
npm install morgan
```

Then, import Morgan at the top of the `apps/api/src/main.ts` file:

```ts
import express from 'express';
import { PrismaClient, Todo, User } from '@prisma/client';
import passportLocal from 'passport-local';
import passportOIDC from 'passport-openidconnect';
import passport from 'passport';
import session from 'express-session';
import { universalLogoutRoute } from './universal-logout';
import morgan from 'morgan';
```

Add the following line to your UL Route section in `apps/api/src/main.ts`. It instructs the server to use Morgan:

```ts
app.use(morgan('combined'))
```

The UL Route section will now look like this:

```ts
///////////////////////////////////////////////////////
// Universal Logout Route

app.use(morgan('combined'));

app.use('/', universalLogoutRoute);
```

On a new terminal window, let's test a request through cURL. Paste the following code in the terminal:

```
curl --request POST \
  --url http://localhost:3333/global-token-revocation \
  --header 'Content-Type: application/json' \
  --data '{
  "sub_id": {
    "format": "email",
    "email": "trinity@whiterabbit.fake"
  }
}'
```

This request will result in a 204 response confirming that a user named Trinity exists in our database. Sure, we got a successful response, but what is wrong here? This endpoint isn't secure — we've made it accessible to anyone. Let's fix this by adding authentication to protect this endpoint and establish trust between our server and any external service making an API request to this route.

## Allow only authorized access to the endpoint

Static API tokens are problematic as they are long-lived and must be manually invalidated. We recommend OAuth 2.0 authorization to secure your Global Token Revocation (GTR) endpoint. For more details, see this blog on [Why You Should Migrate to OAuth 2.0 From Static API Tokens](/blog/2023/09/25/oauth-api-tokens).

We'll start by securing the endpoint with an API key as a quick baseline, then upgrade to OAuth 2.0 Private Key JWT — the method Okta uses when initiating Universal Logout.

### Secure with an API key

To protect the UL endpoint, add the [passportBearer library](https://www.passportjs.org/packages/passport-http-bearer/).

In your terminal, run the following commands:

```shell
npm install passport-http-bearer
npm install @types/passport-http-bearer -D
```

Then import `passportBearer` at the top of `apps/api/src/main.ts`:

```ts
import express from 'express';
import { PrismaClient, Todo, User } from '@prisma/client';
import passportLocal from 'passport-local';
import passportOIDC from 'passport-openidconnect';
import passport from 'passport';
import session from 'express-session';
import { universalLogoutRoute } from './universal-logout';
import morgan from 'morgan';

// Bearer Auth - Universal Logout
import passportBearer from 'passport-http-bearer';
```

In addition, create a token auth strategy called BearerStrategy in `apps/api/src/main.ts` and list it at the top of the file after the other token auth strategies.

```ts
import express from 'express';
import { PrismaClient, Todo, User } from '@prisma/client';
import passportLocal from 'passport-local';
import passportOIDC from 'passport-openidconnect';
import passport from 'passport';
import session from 'express-session';
import { universalLogoutRoute } from './universal-logout';
import morgan from 'morgan';

// Bearer Auth - Universal Logout
import passportBearer from 'passport-http-bearer';

interface IUser {
 id: number;
}

const prisma = new PrismaClient();
const LocalStrategy = passportLocal.Strategy;
const OpenIDConnectStrategy = passportOIDC.Strategy;

// Bearer Auth - Universal Logout
const BearerStrategy = passportBearer.Strategy;
```

Lastly, add the token auth strategy to your UL-related code (just below the OIDC-related code). Notice how we're setting the Passport.js auth strategy to relate the API key to an existing org in our database. From here, we'll have context on which org the incoming request is referring to. You can read more about this in the [Passport.js documentation](https://www.passportjs.org/concepts/authentication/http-bearer/).

```ts
// Bearer Auth Strategy
passport.use(new BearerStrategy(
 async (apikey, done) => {
   const org = await prisma.org.findFirst({
     where: {
       apikey: apikey
     }
   });
   return done(null, org);
 }
));
```

Update the UL endpoint by adding `passport.authenticate('bearer', { session: false })`. The complete code will look like this:

>**Note**: The [Passport Library](https://www.passportjs.org/packages/passport-http-bearer/) offers the option to set the token authentication session to false. We'll set it to false since we won't need a session in our use case.

```ts
///////////////////////////////////////////////////////
// Universal Logout Route

// Bearer Auth Strategy
passport.use(new BearerStrategy(
 async (apikey, done) => {
   const org = await prisma.org.findFirst({
     where: {
       apikey: apikey
     }
   });
   return done(null, org);
 }
));

app.use(morgan('combined'))

app.use('/', passport.authenticate('bearer', { session: false }), universalLogoutRoute);
```

>**Checkpoint**: Now test the same cURL command again:

```http
curl --request POST \
  --url http://localhost:3333/global-token-revocation \
  --header 'Content-Type: application/json' \
  --data '{
  "sub_id": {
    "format": "email",
    "email": "trinity@whiterabbit.fake"
  }
}'
```

You'll get a **401 Unauthorized** response, indicating that the provided authorization was invalid. This error is valid because we didn't send a token to our authorization headers. Let's fix that! We know from our database that the API key is 131313. You can confirm this by opening another terminal and running `npx prisma studio`. A new window will open with a UI showing you the tables in your database; inspect the org table to see the column apikey for org 1. With that, go ahead and add this missing info to your cURL request.

It's crucial to authenticate with the correct API key, as it specifies the org the user is associated with. We'll also need to incorporate this information into the code. Thanks to the Passport.js library and the auth strategy we configured in `apps/api/src/main.ts`, we have the org the request is about, stored in `req['user']`. Try adding `console.log(req['user'])` to see what I mean. Furthermore, we can access the org context with `req['user']['id']`. We'll need this to find the exact user within a specific org, which is beneficial if your app handles multitenancy. Add the following code to `apps/api/src/universalLogout.ts`:

```ts
universalLogoutRoute.post('/global-token-revocation', async (req, res) => {
  // 204 When the request is successful
  const httpStatus = 204;

  // 400 If the request is malformed
  if (!req.body) {
    res.status(400);
  }
  
  // Find the user by email linked to the org id associated with the API key provided
  const domainOrgId = req['user']['id']
  const newRequest:IRequestSchema = req.body;
  const { email } = newRequest.sub_id;
  const user = await prisma.user.findFirst({
    where: {
      email: email,
      org: { id: domainOrgId } ,
    },
  });

  // 404 User not found 
  if (!user) {
    res.sendStatus(404);
  }

  return res.sendStatus(httpStatus);
});

universalLogoutRoute.use((err,req,res,next) => {
  if(err){
    return res.sendStatus(404)
  }
})
```

Now let's do another test to make sure the authentication piece we added is working. We'll need to modify our cURL request to include an Authorization header with a `Bearer 131313`. This test should result in a 204 response.

```http
curl --request POST \
  --url http://localhost:3333/global-token-revocation \
  --header 'Authorization: Bearer 131313' \
  --header 'Content-Type: application/json' \
  --data '{
  "sub_id": {
    "format": "email",
    "email": "trinity@whiterabbit.fake"
  }
}'
```

## Implement the forced sign-out for a user

Now that we have the target user of a specific org, let's figure out how to target their application session and end it.

### End a user's session

In Express, we'll need to access a user's session from the express-session library's session store. Create a file called `sessionStore.ts` under the `apps/api/src` folder and a variable called `store`. Notice we created a separate file to reference `store` in multiple files — we'll need it in both `apps/api/src/main.ts` and `apps/api/src/universalLogout.ts`.

```ts
import {MemoryStore} from 'express-session';
export const store = new MemoryStore();
```

Import `store` from the `sessionsStore` file at the top of `apps/api/src/main.ts`.

```ts
import { store } from './sessionsStore';
```

The top of the `apps/api/src/main.ts` file now looks like this:

```ts
import express from 'express';
import { PrismaClient, Todo, User } from '@prisma/client';
import passportLocal from 'passport-local';
import passportOIDC from 'passport-openidconnect';
import passport from 'passport';
import session from 'express-session';
import { universalLogoutRoute } from './universalLogout';
import morgan from 'morgan';

// Signed JWT Verifier for Universal Logout
import OktaJwtVerifier from '@okta/jwt-verifier';
import { store } from './sessionsStore';
```

Now add `store` within your session configuration:

```ts
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
```

Notice how the user session is configured in `apps/api/src/main.ts` using Passport.js' serialization and deserialization functions. We can instruct Passport.js to reference a specific user's session using their `user.id`. You can read more about how this works in the [Passport.js documentation](https://www.passportjs.org/concepts/authentication/sessions/).

```ts
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
```

Next, import `store` at the top of `apps/api/src/universalLogout.ts`:

```ts
import { Router } from 'express';
export const universalLogoutRoute = Router();
import { PrismaClient } from '@prisma/client';
import { store } from './sessionsStore';
```

So far, we know the user's email from the request to the UL endpoint and have associated the user with an org via the validated JWT. Now that we have the user object, we can associate the user's ID with the session object. Add the following code to find and terminate a user's session.

```ts
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
```

>**Checkpoint**: Now is an excellent time to test our code.

Let's sign in to the Todo app with Trinity's credentials — email: trinity@whiterabbit.fake and the temporary password: Zion123$. Okta will redirect you and prompt you to update the password. When you redirect back to the Todo app, you'll have an active session; you can test this by adding a task. Let's test ending this session by sending a cURL request.

```http
curl --request POST \
  --url http://localhost:3333/global-token-revocation \
  --header 'Authorization: Bearer 131313' \
  --header 'Content-Type: application/json' \
  --data '{
  "sub_id": {
    "format": "email",
    "email": "trinity@whiterabbit.fake"
  }
}'
```

Check that you get a 204 response, then try adding another Todo task. You won't be able to add another task, and if you open the dev tools and inspect the console tab, you'll see a **401 Unauthorized** error.

We successfully ended the user's session, but the user can still see the webpage's contents. Let's ensure we fully sign them out by refreshing the browser and redirecting them to the main sign-in page — forcing the user to reauthenticate.

### Sign a user out of the Todo app

Open `apps/todo-app/src/app/components/todolist.tsx` and find `onNewTask`, the function that creates tasks. Add the following code to catch a 401 error and redirect the user back to the sign-in page.

```ts
if (!res.ok)
{if (res.status === 401) {
  // Redirect user back to the sign-in page
  window.location.href = '/';
  } else {
  // Handle other errors
  throw new Error('Error occurred while fetching data');
}}
```

The `onNewTask` function will now look like this:

```ts
import { useEffect, useState } from 'react';
import { useAuthState } from './authState';

interface ITodo {
  id: number;
  task: string;
  completed: boolean;
}

export const Todos = () => {
  const [todoList, setTodoList] = useState<ITodo[]>([]);
  const [newTask, setNewTask] = useState<string>('');
  const { authState } = useAuthState();

  const API_BASE_URL = '/api/todos';

  const onNewTask = () => { 
    const apiCall = async () => {
      try {
        const res = await fetch(API_BASE_URL, {
          method: 'POST',
          credentials: 'same-origin',
          mode: 'same-origin',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ task: newTask })
        });

        if (!res.ok){if (res.status === 401) {
        // Redirect user back to the sign in page
        window.location.href = '/';
        } else {
          // Handle other errors
          throw new Error('Error occurred while fetching data');
        }}

        const todo = await res.json();
        setTodoList([...todoList, todo]);
        setNewTask('');
      } catch (error: unknown) {
        console.error(error);
      }
    };
    apiCall();
  };

```

>**Checkpoint**: Let's retest, ending Trinity's session, and watch what happens when you attempt to add a new task to the Todo app.

>**Improve your code**: Notice the code above only handles a 401 response from the server when adding a new task. How might you handle 401 errors globally? You can use fetch or [Axios Interceptor](https://axios-http.com/docs/interceptors). The completed workshop code handles this using fetch; check it out here [Universal Logout Workshop Complete](https://github.com/oktadev/okta-enterprise-ready-workshops/blob/ul-workshop-complete/apps/todo-app/src/app/components/useTodoApi.tsx).

### Revoke a user's tokens

This web application architecture uses cookie-based sessions instead of session tokens to authenticate to backend resources. However, for mobile apps and single-page applications, you'll need to revoke refresh tokens on the front end. As per the [spec](https://datatracker.ietf.org/doc/html/draft-parecki-oauth-global-token-revocation#name-revocation-expectations), written by [Aaron Parecki](https://aaronparecki.com/), a successful sign-out will require revoking a user's refresh token.

## Test with Okta

Now that the app has a secure, working UL endpoint, let's connect it to Okta and test end-to-end.

### Upgrade to Private Key JWT authorization

Now that the endpoint is secured with a basic API key, let's upgrade to OAuth 2.0 Private Key JWT — the authentication method Okta uses when it initiates Universal Logout. Using a signed JWT means Okta cryptographically proves its identity on every request, removing the risks associated with long-lived static tokens.

Install the [Okta JWT Verifier library](https://www.npmjs.com/package/@okta/jwt-verifier):

`npm install --save @okta/jwt-verifier`

Import the Okta JWT Verifier library at the top of `apps/api/src/main.ts`, removing the Bearer Auth strategy and BearerStrategy variable you added in the previous section:

```ts
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

Then, instantiate the Okta JWT Verifier under your UL section. You'll need to include the issuer — the authorization server from which we expect the signed JWT to originate — and the public keys endpoint so the library can cryptographically match the signed token with the published keys. You can find the issuer and keys endpoint at the Okta Org Authorization Server's metadata endpoint.

```javascript
///////////////////////////////////////////////////////
// Universal Logout Route

// Signed Jwt Validation
const oktaJwtVerifier = new OktaJwtVerifier({
  issuer: 'https://{yourOktaDomain}',
  jwksUri: 'https://{yourOktaDomain}/oauth2/v1/keys',
});
```

Next, create a custom middleware called `tokenValidator` to get the signed JWT from the POST request body and validate it with the Okta JWT Verifier. The `verifyAccessToken` method takes the JWT and `expectedAud`, which is your UL endpoint.

> **Note:** The example `expectedAud` below uses a base URL provided by the localtunnel service that we will implement in the **Test with Okta** section — substitute that base URL with your own.

```javascript
///////////////////////////////////////////////////////
// Universal Logout Route
// Signed Jwt Validation
const oktaJwtVerifier = new OktaJwtVerifier({
  issuer: 'https://{yourOktaDomain}',
  jwksUri: 'https://{yourOktaDomain}/oauth2/v1/keys',
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
    console.log(err);
    return res.sendStatus(401);
  }
};

app.use(morgan('combined'));
app.use('/', tokenValidator, universalLogoutRoute);
```

Before proceeding, remove the old Bearer Auth Strategy code at the bottom. This authentication method has been replaced by the JWT validation approach above.

Note that the last line of code passes `tokenValidator` to all requests starting with the path `/`.

> **Recap:** Your `apps/api/src/main.ts` file should now look like this, with no remaining references to API key token authorization:

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
  issuer: 'https://{yourOktaDomain}',
  jwksUri: 'https://{yourOktaDomain}/oauth2/v1/keys',
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

We'll also need to make some changes to `apps/api/src/universalLogout.ts`. From the `tokenValidator`, we now know the org context for the Private Key JWT (previously, we used the user ID to determine the domain org id associated with the API token). We'll use the org id to find the specific user linked to the request.

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

### Expose a public endpoint

One way to give your app a public URL is to host it on a cloud instance with a DNS server that you control. For development purposes, you can use Ngrok or Localtunnel to expose the app running on your computer to the public.

We'll use Localtunnel in this demonstration. Start the API with the following command on your terminal:

`npm run serve-api`

In another terminal, start the tunnel using the following command:

`npx localtunnel --port 3333`

It will ask for permission to install the npm package; say yes. When you start Localtunnel, it will print a URL to your terminal, such as `http://unique-url-for-squirrels`. You will need that URL in the next step.

> **Troubleshooting tip:** Localtunnel is known to have timeout issues (408 response errors). For a more stable proxy option, you can try [ngrok](https://ngrok.com/). Similarly, you can run the following commands to obtain a proxy URL after installing and retrieving your auth key from your ngrok dashboard.

```
ngrok config add-authtoken {your-authtoken-from-your-dashboard}
ngrok http 3333
```

### Provide your revocation endpoint to Okta

Log in to your Okta dashboard, and under your UL App, go to the **General** tab. Within the General tab, look for the **Logout > Global token revocation endpoint** section, enable the **Okta system or admin initiates logout** option, and add your logout endpoint URL using your proxy URL, for example, `https://easy-states-create.loca.lt/global-token-revocation`. Set **Subject format** to Email Identifier and **Auth method** to "Private key JWT." This setup means Okta will send a request to the Todo app, identifying the user with the email used for SSO, and authenticate the user with the secure OAuth method Private Key JWT.

In addition, update the `expectedAud` in `apps/api/src/main.ts` to match the base URL provided by Localtunnel:

```javascript
const expectedAud =
  'https://{base-URL-provided-by-local-tunnel}/global-token-revocation';
```

### End a user's session through Okta

Be sure your test user — for example, `trinity@whiterabbit.fake` — is signed in to the Todo App. From the Admin Console, go to **Directory** > **People** and find the user whose session you want to end. Click on their profile, click **More Actions**, then **Clear User Sessions**. Check the option **"Clear 'keep me signed in', and include Logout enabled apps and Okta API tokens."** You'll receive a "Sessions cleared and tokens revoked" response.

Now navigate to the Todo app and try to add a new task. Confirm that the user can't add a new task and is redirected to the login page to sign in again. If so, you have successfully implemented Universal Logout with Okta!

## Optional: Submit your app to the Okta Integration Network

Once you've successfully implemented and tested Universal Logout with the Private Key JWT authorization method, the final step in making your application Enterprise-Ready is submitting it to the [Okta Integration Network (OIN)](https://www.okta.com/integrations/). The OIN is Okta's catalog of pre-built integrations, making it easy for mutual customers to adopt your application.

### OIN Submission for Universal Logout

**Preparation:**
- Ensure your UL endpoint (`/global-token-revocation`) is public-facing, highly available, and secured using OAuth 2.0 Private Key JWT as implemented with the Okta JWT Verifier library.
- Confirm that your endpoint correctly receives and processes the revocation request from Okta, responding with a `204 No Content` on success or an appropriate error code (e.g., `400` or `404`).

**Submit:**
- Navigate to the OIN Submission Portal (linked from your Okta Developer Console) to begin the submission process.
- Provide the **Global Token Revocation Endpoint URL** (e.g., `https://your-app-domain.com/global-token-revocation`).
- Specify the **Authentication Method** as "Private key JWT".
- Confirm the **Subject format** (e.g., "Email Identifier") that Okta uses to identify the user in the request body (`sub_id`).

Okta's OIN team will review your implementation to ensure it meets all security and functional requirements. A successful OIN submission lists your SaaS application in the Okta Integration Network, signaling to enterprise customers that your app supports Universal Logout for enhanced security and compliance.

## Continue adding more features to your SaaS app!

Now that you have an OIDC app with a fully integrated UL endpoint, you can continue your Enterprise-Ready journey by adding user lifecycle management through [System for Cross-domain Identity Management (SCIM)](https://datatracker.ietf.org/doc/html/rfc7644).

- [Enterprise-Ready Workshop: Manage users with SCIM](/blog/2023/07/28/scim-workshop)

You can further manage your users and groups using Terraform or Workflows:

|Posts in the on-demand workshop series|
| --- |
| 1. [How to Get Going with the On-Demand SaaS Apps Workshops](/blog/2023/07/27/enterprise-ready-getting-started) |
| 2. [Enterprise-Ready Workshop: Authenticate with OpenID Connect](/blog/2023/07/28/oidc_workshop) |
| 3. [Enterprise-Ready Workshop: Manage Users with SCIM](/blog/2023/07/28/scim-workshop) |
| 4. [Enterprise Maturity Workshop: Terraform](/blog/2023/07/28/terraform-workshop) |
| 5. [Enterprise Maturity Workshop: Automate with no-code Okta Workflows](/blog/2023/09/15/workflows-workshop) |
| 6. **Build and Integrate Universal Logout with Okta** |

Follow us on [Twitter](https://twitter.com/oktadev) and subscribe to our [YouTube](https://www.youtube.com/c/oktadev) channel. If you have any questions or would like to share which tutorial you'd like to see next, please comment below!

## Resources
- [Build Universal Logout for your App](https://developer.okta.com/docs/guides/oin-universal-logout-overview/)
- [Global Token Revocation](https://datatracker.ietf.org/doc/html/draft-parecki-oauth-global-token-revocation)
