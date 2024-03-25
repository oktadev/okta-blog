---
layout: blog_post
title: "How to Instantly Log Users Out across All Your Apps"
author:
by: advocate|contractor
communities: [devops,security,mobile,.net,java,javascript,go,php,python,ruby]
description: ""
tags: []
tweets:
- ""
- ""
- ""
image:
type: awareness|conversion
---

An Identity Provider (IdP) can respond to identity threats and employee termination events. However, it cannot revoke the user's existing sessions, refresh token, and log the user immediately. Universal Application Logout enables an IdP or security incident management tool to request an app to: 1) log a user out and 2) end their existing sessions and tokens. 

This is different from IDP-initiated Single Logout as it is a server-to-server protocol where as for example SAML IdP-initiated single logout relies on the user's browser to deliver the logout request to the Service Provider (SPs).

In this tutorial, we will set up the UAL endpoint on our Todo app created by our Enterprise Workshop Series. 

{% include toc.md %}

Inline reference to code 


## Set up the Sample React and Express Application
Follow these setup instructions to install and run the Todo sample app. Run `node -v` and make sure you have Node version 18 or newer.
We will build the UAL backend endpoint on the sample app that already has OIDC support implemented, so git checkout oidc-workshop-complete.
Migrate existing users 

## Folder Setup
Create a new file called universal-logout.ts under apps/api/src add the following import and export at the top of the file to allow the UAL route built on this file to be exported to the apps/api/src/main.ts file. 


import { Router } from 'express';
export const ualRoute = Router();

Now in the apps/api/src/main.ts file, at the top, import the UAL route



```
import { ualRoute } from './universal-logout';
```
 
The file should now look like this:

```
import express from 'express';
import { PrismaClient, Todo, User } from '@prisma/client';
import passportLocal from 'passport-local';
import passport from 'passport';
import session from 'express-session';
import { ualRoute } from './universal-logout';
```

## Testing tools
Before we build the UAL endpoint, we'll need a few tools to ensure we are on the right track. One tool is Morgan which will confirm the response code associated with requests to the UAL endpoint, and we'll use hopscotch or curl requests to the endpoint.

Install Morgan in your terminal with the following code:


```shell
npm install morgan
```

## Authenticating to the UAL endpoint
To protect the UAL endpoint, we will need to add the passportBearer library. 

In your terminal run:

```shell
npm install passport-http-bearer
npm install @types/passport-http-bearer -D
```

Then import passportBearer at the top of apps/api/src/main.ts. It should look like this:

```ts
import express from 'express';
import { PrismaClient, Todo, User } from '@prisma/client';
import passportLocal from 'passport-local';
import passportOIDC from 'passport-openidconnect';
import passport from 'passport';
import session from 'express-session';
import { ualRoute } from './universal-logout';
import morgan from 'morgan';
```

// Bearer Auth - UAL
import passportBearer from 'passport-http-bearer';


In addition, create a token auth strategy called BearerStrategy in apps/api/src/main.ts. List it at the top of apps/api/src/main.ts with the other token auth strategies.


```ts
import express from 'express';
import { PrismaClient, Todo, User } from '@prisma/client';
import passportLocal from 'passport-local';
import passportOIDC from 'passport-openidconnect';
import passport from 'passport';
import session from 'express-session';
import { ualRoute } from './universal-logout';
import morgan from 'morgan';
```

// Bearer Auth - UAL
import passportBearer from 'passport-http-bearer';


```ts
interface IUser {
 id: number;
}

const prisma = new PrismaClient();
const LocalStrategy = passportLocal.Strategy;
const OpenIDConnectStrategy = passportOIDC.Strategy;
```

// Bearer Auth - UAL
const BearerStrategy = passportBearer.Strategy;

Lastly, to use the token auth strategy, add it to your UAL-related code (just below the OIDC-related code) and add the following parameter to the UAL endpoint `passport.authenticate('bearer')` which would look like this:

```ts
///////////////////////////////////////////////////////
// Universal App Logout Routes


// Bearer Auth
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


// // https://github.com/expressjs/morgan
app.use(morgan('combined'))




app.use('/', passport.authenticate('bearer'), ualRoute);

```

In the universal-logout.ts file add the following code:


```ts
ualRoute.post('/ual', async (req, res) => {


console.log("hello")


 });
```

## Test UAL Authentication locally using a tunnel
Now let's test UAL authentication. One way to give your app a public URL or IP would be to host it on a cloud instance with DNS that you control. For development purposes, you can use Ngrok or Localtunnel to provide a public address to the app running on your own computer.
Since some firewalls restrict Ngrok traffic, we'll use Localtunnel in this demonstration. To run the tunnel, you'll start the api with the following command on your terminal:

```shell
npm run serve-api
```

In another terminal, start the tunnel using the following command:

```shell
npx localtunnel --port 3333
```

It will ask for permission to install the npm package; say yes. And when you start localtunnel, it will print a URL to your terminal, such as http://unique-url-for-squirrels. You will need that URL when we make a call to the UAL endpoint. 
Using hopscotch make a POST call to https://stale-radios-happen.loca.lt/api/ual do not pass any value under the Authorize tab and send the request. You should get a 401 Unauthorized: Authentication provided was invalid.


401 malformed example
app.use('/api', passport.authenticate('bearer'), ualRoute);


User session
In express we'll need to access user session in store. 

import { store } from './sessionsStore';


Add it to session:

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


We can access the user through store. We'll then need to get the user. 

Notice how session is set up it is through serialization and deserialization:

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







npm install react-query

https://www.passportjs.org/packages/passport-http-bearer/
turn session to false

Setup Okta Dev Account


## Keep experimenting with SCIM

This tutorial provides the fundamental steps to create your .NET SCIM server to manage user lifecycle with an identity provider such as Okta. You can get the complete sample code for this project from [the GitHub repository](https://github.com/oktadev/okta-net-scim-example). Now, you can extend resources supported by adding groups. Or update the SCIM model to add more attributes you may need.

You can go even further and create an application that authenticates users using the same identity provider to provide Single Sign On to users already provisioned through your .NET SCIM server. 

- [Enterprise-Ready Workshop: Manage users with SCIM](/blog/2023/07/28/scim-workshop)
- [Enterprise-Ready Workshop: Authenticate with OpenID Connect](/blog/2023/07/28/oidc_workshop)

You can further manage your users and groups using Terraform or Workflows:
- [Enterprise Maturity Workshop: Terraform](/blog/2023/07/28/terraform-workshop)
- [Enterprise Ready Workshop: Automate with no-code Okta Workflows](/blog/2023/09/15/workflows-workshop)

Excited to learn more about creating secure .NET apps? Follow us on [Twitter](https://twitter.com/oktadev) and subscribe to our [YouTube](https://www.youtube.com/c/oktadev) channel. If you have any questions or you want to share what tutorial you'd like to see next, please comment below!