---
layout: blog_post
title: "How to Instantly Sign a User Out across All Your Apps"
author: semona-igama
by: advocate
communities: [devops,security,mobile,.net,java,javascript,go,php,python,ruby]
description: "Sign users out across all apps with a universal logout endpoint."
tags: [enterprise-ready-workshops, express, oidc, universal-logout]
tweets:
- ""
- ""
- ""
image: blog/express-universal-logout/social.jpg
type: awareness
github: https://github.com/oktadev/okta-enterprise-ready-workshops/tree/ul-workshop-complete
---

Your enterprise customers expect you to safeguard them from common security incidents, especially when it comes to compromised user accounts. Perhaps a user has signed in from a known stolen device or another country outside the list of allowed IP zones. If a hacker is masquerading as one of your customer's employees, potentially accessing sensitive company data, you must end their session and sign them out of your app immediately. 

Bottom line, if you build SaaS applications for enterprise-level customers who leverage Identity Providers (IdPs), workflows, and threat-detection tools, then adding Universal Logout to your app is the solution to ending suspicious user sessions ASAP.

|Posts in the on-demand workshop series|
| --- |
| 1. [How to Get Going with the On-Demand SaaS Apps Workshops](/blog/2023/07/27/enterprise-ready-getting-started) |
| 2. [Enterprise-Ready Workshop: Authenticate with OpenID Connect](/blog/2023/07/28/oidc_workshop) |
| 3. [Enterprise-Ready Workshop: Manage Users with SCIM](/blog/2023/07/28/scim-workshop) |
| 4. [Enterprise Maturity Workshop: Terraform](/blog/2023/07/28/terraform-workshop) |
| 5. [Enterprise Maturity Workshop: Automate with no-code Okta Workflows](/blog/2023/09/15/workflows-workshop) |
| 6. **How to Instantly Sign a User Out across All Your App** |

In this tutorial, you'll learn to add a secure Universal Logout API endpoint to a web app, test it by sending a request to end a user's active session, and finally handle signing them out of the app. However, we will not cover initiating user sign-out through an IdP, i.e. Okta, as this feature is soon to come.

>**Note**: You can follow along with this blog to build a Universal Logout or check out the finished code on the [ul-workshop-complete](https://github.com/oktadev/okta-enterprise-ready-workshops/tree/ul-workshop-complete) branch of our Oktadev GitHub repository.

{% include toc.md %}

## Get the sample app up and running

**Prerequisites**
- [Enterprise-Ready OIDC Workshop](/blog/2023/07/28/oidc_workshop) - [oidc-workshop-complete](https://github.com/oktadev/okta-enterprise-ready-workshops/tree/oidc-workshop-complete)
- Code Editor (I used [Visual Studio Code](https://code.visualstudio.com/download)) 
- [Okta Integrator Free Plan account](https://developer.okta.com/signup/)
- [Node.js](https://nodejs.org/en) v18 or greater

Run `node -v` and ensure you have Node version 18 or newer. Follow [these setup instructions](/blog/2023/07/27/enterprise-ready-getting-started) to install and run the Todo sample app.  

>**Note**: If you have already completed the [Enterprise Ready OIDC Workshop](/blog/2023/07/28/oidc_workshop) and can successfully run the Todo app with OIDC-SSO configured with Okta, add a task, and sign a user out, please skip to the **Build a Universal Logout endpoint section and secure it**. If you haven't, please read on.
We'll build the Universal Logout (UL) endpoint on [the sample app](https://github.com/oktadev/okta-enterprise-ready-workshops/) with OIDC support implemented. After cloning the repo, check out the oidc-workshop-complete branch with git checkout **oidc-workshop-complete**. 

>**Troubleshooting tips**: Ensure you can run the Todo application before you begin. We'll be adding some code and testing along the way. 

### Create an Okta Integrator Free Plan account
If you don't already have an Okta account, you can sign up for one here under [Integrator](https://developer.okta.com/signup/). You'll also need to create an [OpenID Connect (OIDC) application](https://developer.okta.com/docs/guides/implement-grant-type/authcode/main/#set-up-your-app), which you can do by following the instructions listed here under Setup your app. Set the Sign-in redirect URI as `http://localhost:3333/openid/callback/1`. Note down your ***client_id** and **client_secret**; you'll need it in the next steps.

### Add configuration to authenticate with OIDC

You can view the user table locally using Prisma Studio. To do this, go to the root of this workshop folder in your terminal and run `npx prisma studio`. Your browser will open a new web page where you can see all the users in your database.  

While viewing your database locally, you'll also see an org table. By clicking the **Add record** button, you can manually input the following info to seed your database with an org linked to an Okta authorization server, allowing OIDC-SSO login. Add the **client_id** and **client_secret** from the previous step, then click the **Save change** button to save your changes.

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

To test whether UL works for our app, we'll create a user on Okta whose account we'll forcibly sign out. 
Open the Admin Console for your org, and go to **Directory** > **People**. Click **Add Person** and create a person with the following properties:

- User type: User
- First name: Trinity
- Last name: Anderson
- Username: trinity@whiterabbit.fake
- Activation: Activate now
- Enable the option **I will set password** > Enter a password of your choosing and click **Save**

Refresh the page and click on Trinity Anderson's profile. Click the **Assign Application** button and assign Trinity to the UL OIDC App. 

### Migrate the test user

Now that you have a user in Okta. Let's migrate Trinity to the correct Todo App org according to her company domain. Run the following command and then check the Prisma database to see if Trinity is linked to the whiterabbit.fake domain (org #1).

```shell
​npm run oidc-migrate whiterabbit.fake
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

Moving along, import `UniversalLogoutRoute` from `universalLogout.ts` at the top of `apps/api/src/main.ts`.

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

Let's circle back to the `apps/api/src/universalLogout.ts` file and add more requirements to set up our UL endpoint. Let's include the Prisma client to access our database of users, so at the top of the file, add the line `import { PrismaClient } from '@prisma/client;`:

```ts
import { Router } from 'express';
export const universalLogoutRoute = Router();
import { PrismaClient } from '@prisma/client';
```

We'll need to instantiate a Prisma client and define a TypeScript interface to ensure the request coming to our endpoint is the data type we expect. As per the [Global Token Revocation Specification](https://datatracker.ietf.org/doc/html/draft-parecki-oauth-global-token-revocation#name-revocation-request), we are expecting an external request to end a user's session based on the email used to SSO with their IdP. The request will look like the following:

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
The apps/api/src/universalLogout.ts file now looks like the following:

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

Before we proceed, let's make sure the token revocation endpoint works. We'll use [cURL](https://curl.se/docs/httpscripting.html) to send requests to the endpoint and [Morgan](https://www.npmjs.com/package/morgan), an HTTP logger middleware to see the response codes it returns.

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

This request will result in a 204 response confirming that a user named Trinity exists in our database. Sure, we got a successful response, but what is wrong here? This endpoint isn't secure. We've made it available for anyone to access. Let's fix this by adding authentication to protect this endpoint and establish trust between our server and any external service making a request to this route.

## Allow only authorized access to the endpoint

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

Lastly, add the token auth strategy to your UL-related code (just below the OIDC-related code). Notice how we're setting the Passport.js auth strategy to relate the API key to an existing org in our database. From here, we'll be able to have context about which org the incoming request is referring to. You can read more about this in the [Passport.js documentation](https://www.passportjs.org/concepts/authentication/http-bearer/).

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

Update the UL endpoint by adding the following arguments `passport.authenticate('bearer', { session: false })`. The complete code will look like this:

>**Note**: The [Passport Library](https://www.passportjs.org/packages/passport-http-bearer/) offers the option of setting the token authentication token session to false. We'll set it to false since we won't need a session in our use case.

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

You'll get a **401 Unauthorized** response, meaning the authorization provided was invalid. This error is valid because we didn't send a token to our authorization headers. Let's fix that! We know from our database that the API key to our database is 131313. You can confirm this by opening another terminal and running `npx prisma studio`. A new window will open with a UI showing you the tables in your database; inspect the org table to see the column apikey for org 1. With that, go ahead and add this missing info to your cURL request. 

It's crucial to authenticate with the correct API key as it specifies the org with which the user is associated. We'll also need to incorporate this information into the code. How might you do that? Thanks to the Passport.js library and how we configured the auth strategy in the `apps/api/src/main.ts`, we have information about the org the request is about, which is stored in `req['user']`. Try adding `console.log(req['user'])` to see what I mean. Furthermore, we can now access the org context with `req['user']['id']`. We'll need this to find the exact user within a specific org, and it will be beneficial if your app handles multitenancy. Add the following code to `apps/api/src/universalLogout.ts`: 

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
So now let's do another test to make sure the authentication piece we added is working. We'll need to modify our cURL request to include an Authorization header with a `Bearer 131313`. This should result in a 204 response. 

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

Moving right along, now that we have the target user of a specific org. Let's figure out how to target their application session and end it.

## Implement the forced sign-out for a user

In this section, we'll work towards ending a user's session and signing them out of the app.

### End a user's session

In Express, we'll need to access a user's session in the session store from the express-session library. Create a file called sessionStore.ts under the `apps/api/src` folder and a variable called store. Notice we created a separate file to reference `store` in multiple files. For example, we'll need it in the `apps/api/src/main.ts` file and the `apps/api/src/universalLogout.ts` file. 

```ts
import {MemoryStore} from 'express-session';
export const store = new MemoryStore();
```

For now, import `store` from the `session/Store` file at the top of the `apps/api/src/main.ts`. 

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

// Bearer Auth - Universal Logout
import passportBearer from 'passport-http-bearer';
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

Notice how the user session is configured in the `apps/api/src/main.ts` file with the Passport.js library's serialization and deserialization functions. We can instruct the Passport.js library to reference a specific user's session with their `user.id`. If you're curious, you can read more about how this works in the [Passport.js documentation](https://www.passportjs.org/concepts/authentication/sessions/). 

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

So far, we know the user's email from the request to the UL endpoint and have associated the user with an org with the provided API key. Now that we have the user object, we can associate the user's user ID with the session object. Add the following code to find and terminate a user's session.

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

The complete `apps/api/src/universalLogout.ts` file will look like this:

```ts
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

>**Checkpoint**: Now will be an excellent time to test our code. 

Let's sign in to the Todo app with Trinity's credentials email: trinity@whiterabbit.fake and the temporary password: Zion123$. Okta will redirect you and prompt you to update the password. When you redirect back to the Todo app, you'll have an active session; you can test this by adding a task. Let's test ending this session by sending a cURL request.

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

Check that you get a 204 response, and then try to add another Todo task to see what happens. You won't be able to add another task, and if you open the dev tools and inspect the console tab, you'll see a **401 Unauthorized** error. 

We accomplished our goal of ending a user's session, but the user can still see the contents of the webpage. Let's ensure we fully sign them out by refreshing the browser and redirecting them to the main sign-in page—forcing the user to reauthenticate.

### Sign a user out of the Todo app

Open `apps/todo-app/src/app/components/todolist.tsx` and find 'onNewTask', the function that creates tasks. Add the following code to catch a 401 error and redirect the user back to the sign-in page.

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
This web application architecture uses cookie-based sessions instead of session tokens to authenticate to the backend resources. However, in the case of mobile apps and single-page applications, you'll need to revoke refresh tokens on the front end. As per the [spec](https://datatracker.ietf.org/doc/html/draft-parecki-oauth-global-token-revocation#name-revocation-expectations), written by [Aaron Parecki](https://aaronparecki.com/) a successful sign-out will require revoking a user's refresh token. 

## Initiate Universal Logout through Okta 
This tutorial provides the fundamental steps to creating a UL endpoint to end a user's session or tokens. UL is currently available [Early Access in Okta Preview orgs](https://help.okta.com/oie/en-us/content/topics/itp/universal-logout.htm). Once generally available a secondary blog will be posted with complete instructions on how to initiate sign-out end-to-end with Okta. Stay tuned! For now, you can find the completed project [ul-workshop-complete](https://github.com/oktadev/okta-enterprise-ready-workshops/tree/ul-workshop-complete) on our Oktadev GitHub repository. 

## Continue adding more features to your SaaS app!
Now that you have an OIDC app with a UL endpoint, you can continue your Enterprise-Ready journey by adding user lifecycle management through System for Cross-domain Identity Management [(SCIM)](https://datatracker.ietf.org/doc/html/rfc7644).

- [Enterprise-Ready Workshop: Manage users with SCIM](/blog/2023/07/28/scim-workshop)

You can further manage your users and groups using Terraform or Workflows:

|Posts in the on-demand workshop series|
| --- |
| 1. [How to Get Going with the On-Demand SaaS Apps Workshops](/blog/2023/07/27/enterprise-ready-getting-started) |
| 2. [Enterprise-Ready Workshop: Authenticate with OpenID Connect](/blog/2023/07/28/oidc_workshop) |
| 3. [Enterprise-Ready Workshop: Manage Users with SCIM](/blog/2023/07/28/scim-workshop) |
| 4. [Enterprise Maturity Workshop: Terraform](/blog/2023/07/28/terraform-workshop) |
| 5. [Enterprise Maturity Workshop: Automate with no-code Okta Workflows](/blog/2023/09/15/workflows-workshop) |
| 6. **How to Instantly Sign a User Out across All Your App** |

Follow us on [Twitter](https://twitter.com/oktadev) and subscribe to our [YouTube](https://www.youtube.com/c/oktadev) channel. If you have any questions about Universal Logout, please comment below! 
