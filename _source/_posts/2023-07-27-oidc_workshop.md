---
layout: blog_post
title: "OIDC Workshop"
author: [edunham, aaron-parecki]
by: advocate
communities: [security,javascript]
description: "Add OpenID Connect support to a sample app, and build the skills to make your production applications more appealing to enterprise customers!"
tags: [oidc, workshop]
tweets:
- ""
- ""
- ""
image: blog/oidc_workshop/social.jpg
type: awareness
---
# OIDC Workshop

In this workshop, you will enhance a sample application to allow users to access it using their organization's identity provider. When any enterprise customer considers buying your software to enhance their employees' productivity, their IT and security teams want to ensure they can access your app securely. As a developer, you'd prefer not to rebuild large portions of your authentication flow for every new customer. Fortunately, the OpenID Connect standard solves both of these problems! By adding OpenID Connect (OIDC) support to your app, you can meet the identity security needs of every customer that uses an OIDC-compatible identity provider. 

Today, we'll walk through adding OIDC to our Todo sample application. 

## Before You Begin: 

Follow the steps at [link](TODO FIXME) to set up the Todo app and its dependencies. Make sure you can run the app to load its login page. Launch Prisma studio to browse the database, as well. 

You will also need a free Okta Developer Account, to test the setup steps your customer will follow when integrating their OpenID Connect server with your application. 

## The Problem

The Todo app currently only supports password login, but your enterprise customers' IT departments don't want their users managing one-off passwords. You would also like to use customer data, such as which user accounts belong to which organizations, to enhance your app's features. 

Since you value flexibility and maintainability, you want to use a passport library to enhance your application so it supports arbitrary OpenID Connect servers. 

Introducing these features will require adding logic to the application's backend to handle user accounts and org memberships appropriately, and frontend code to authenticate users with their organization's identity provider when appropriate while supporting password authentication for users who aren't signing in via OIDC. 

# Database Changes

The sample application defines the relationship between Todo items and users in the file `schema.prisma`. Prisma will use this file to create SQLite tables for you. 

With OIDC support, the app will need to store information about organizations in its database, as well as tracking the relationships between those organizations and the user accounts and Todo items. 

## Add Organizations

To support OpenID Connect, the app needs to know about more than just users and Todo items. We need a new model, called the `org`, which represents an organization that users can belong to. 

The org's ID will be an auto-increment field for demonstration purposes, although using sequential identifiers in production could pose a security risk. 

The org will be identified by its email domain, which is a string field. 

Since your app will have many customers with different identity providers, you'll store each org's OpenID configuration in the database. This will require columns for: 
Authorization endpoint, a URL where the app will redirect users from the org so they can log in
Token endpoint, location on the OIDC server where the app can get an ID token
User info endpoint, where the app can retrieve the user's profile info like name and email
Client ID and client secret, which are the credentials that the app can use to authenticate to the org's OIDC server
API Key, for future use, if you add API access to the app for users in this org
Issuer, an identifier representing the OIDC server for the org

Here's how organization support looks in `Schema.prisma`:
```
model Org {
  id        Int     @id @default(autoincrement())
  domain    String  @unique
  issuer                 String @default("")
  authorization_endpoint String @default("")
  token_endpoint         String @default("")
  userinfo_endpoint      String @default("")
  client_id              String @default("")
  client_secret          String @default("")
  apikey                 String
  Todo     Todo[]
  User     User[]
}
```

## Enhance Users

The sample application already manages rudimentary user accounts, but with OIDC support, users will belong to organizations. The user model in `schema.prisma` needs a relationship to an organization, which is implemented with the `org` and `orgID` fields. 

Previously, the sample app treated a user's email address as their unique identifier. This can cause problems if the user's organization changes its domain name, or if the user's email address changes when they change their name. Instead, with OIDC support, a unique identifier for each user can be supplied by their identity provider. This identifier is called `subject` in the OIDC protocol, and is guaranteed to be a unique and stable identifier for that user on that server. It's possible for multiple OIDC servers to issue the same `subject` ID, but the combination of server ID and subject ID is globally unique for the user it refers to.

With a relationship to the user's `org`, and an `externalID` from their organization, the user model will look like this: 

```
model User {
  id       Int    @id @default(autoincrement())
  email    String
  password String?
  name String
  Todo     Todo[]
  org       Org?    @relation(fields: [orgId], references: [id])
  orgId     Int?
  externalId String?
  @@unique([orgId, externalId])
}

```
## Track orgs for Todo items

To associate Todo items with organizations as well as users, each item will need to be able to track its `org` and `orgId`. This looks almost identical to how its `user` and `userId` are stored: 

```
model Todo {
  id        Int     @id @default(autoincrement())
  task      String
  completed Boolean @default(false)
  createdAt DateTime @default(now())
  completedAt DateTime?
  user      User?   @relation(fields: [userId], references: [id])
  userId    Int
  org       Org?    @relation(fields: [orgId], references: [id])
  orgId     Int?
}
```

## Migrate Database

After saving these changes to `schema.prisma`, open a terminal and run `npx prisma generate` to generate the new schema, and `npx prisma db push` to apply it. 

After completing this migration, you can explore the new database structure in Prisma. Users belong to organizations, and tasks can be associated with orgs. 

# Frontend Changes

If a user is able to log in via OpenID Connect, what changes will the frontend need around the login experience? Right now, every user is prompted for their username and password at the login page. But OIDC users won't have a password for this app, and should not entrust their login credentials to your web form! 

To handle both OIDC and non-OIDC users, the app should first prompt for the user's email address, and check whether they should be redirected to their organization's identity provider. If a user doesn't belong to an org, they should instead enter their password to log in. 

## Hide password field

The first change in `src/app/components/signin.tsx` is hiding the password field at first. Find the `div` containing the password, give it an identifier, and set it to be hidden by default: 

```
<div id="password-field" className="mb-6" hidden>
```

## Submit email address to server

The sample app grays out the Sign In button if the email address or password field is empty. With OIDC, the user will submit their email address first, and then follow an appropriate login flow based on the results of the app backend looking up that email. 

Find the line where the Sign In button checks for both username and password and change it to check for only the username: 

```
disabled = {!username}
```

## Check org membership

The `signIn` function will need to check whether a user belongs to an organization. If the user is in an org, the app's frontend should redirect them to the backend to complete their login flow with their identity provider. This redirect ensures that malicious software affecting the user's browser or device has no chance to intercept or inspect the OIDC exchange between your app's backend and the user's identity provider. 

This logic expects the backend to return a numeric organization ID when it runs the `onUsernameEnteredFn` function to look up the username. If the user isn't in an org, that function will return `null` and the user will continue to password authentication. 

```
  const onAuthenticate = async () => { 
    const signIn = async () => {

      // When the user enters just their email, but no password, check if the email is part of an org
      if (username && !password) {
        const org_id = await onUsernameEnteredFn(username);
        if(org_id) {
          window.location.assign(`http://localhost:3333/openid/start/${org_id}`)
          return;
        } else {
          document.getElementById('password-field')?.removeAttribute('hidden');
          return;
        }
      }
```
Keep the following logic for when the Sign In button submits both a username and a password, because users without OIDC will provide both to log in.

Since the `onUsernameEnteredFn` will be implemented in the `authState` component, make sure to import it as well as the `onAuthenticateFn`: 

```
  const { onAuthenticateFn, onUsernameEnteredFn } = useAuthState();
```

The `onUsernameEnteredFn` code doesn't exist yet, but you'll write it in the next step!

## Start OpenID Flow

To complete the frontend changes, implement the `onUsernameEnteredFn` in `authState.tsx`. This will be similar to `onAuthenticateFn`, which is already provided in the sample code. 

Declare `onUsernameEnteredFn` in the `AuthContextType` Type: 

```
  onUsernameEnteredFn: (username: string) => Promise<number|null>;
```

Add it to the `defaultAuthContext`: 

```
  onUsernameEnteredFn: async () => null,
```
Implement the function by modifying a copy of `onAuthenticateFn`. Now, instead of using the `/api/signin` endpoint on the app's backend, you'll use the `/api/openid/check` endpoint:  

```
  const onUsernameEnteredFn = async (username: string) => {
    const url = `/api/openid/check`;
    try {
        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ username })
        });

        const {org_id} = await res.json();

        return org_id;
      } catch (error: unknown) {
        console.error(error);
      }

    return null;
  }
```

And finally, make sure it's included in the provider context returned from `onRevokeAuthFn`: 

```
  return <AuthContext.Provider value={{ authState, onAuthenticateFn, onUsernameEnteredFn, onRevokeAuthFn, userIsAuthenticatedFn }}>{children}</AuthContext.Provider>;
```

From the perspective of the app's frontend, these are all the changes that matter. Supporting OIDC will not change how the frontend communicates with the backend through sessions. 

# Backend Changes

The application's backend will use a library to handle most of the OIDC authentication process. After authenticating, the user will be redirected back to the app just as they are when logging in with a password.

## Install Passport OIDC Library

Since the sample app is using Passport for authentication, the Passport OIDC library will offer seamless integration. 

In your project, run `npm install --save passport-openidconnect` to install the library.  This will update `package.json` automatically to specify the installed version: 

```
    "passport-openidconnect": "^0.1.1",
```

## Add Helper Functions

Add the following helper functions to `main.ts` to simplify your upcoming work. 

`orgFromId` will take an integer org ID and return the first database result for what organization that ID references:

```
async function orgFromId(id) {
  const org = await prisma.org.findFirst({
    where: {
      id: parseInt(id)
    }
  })
  return org
}
```
`getDomainFromEmail` will parse the domain from an email address, by returning everything after the `@`: 

``function getDomainFromEmail(email) {
  let domain;
  try {
    domain = email.split('@')[1];
  } catch(e) {
    return null;
  }
  return domain;
}
```

## Add OpenID Org Check Route

The `api/openid/check` endpoint will return the org that a user's email domain belongs to, if it's part of an org. The user's full email address will arrive at the endpoint in the request body, so the helper function `getDomainFromEmail` will return the domain, before it's used to look up the corresponsding org in the database. Add this code to `main.ts`: 

```
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
```
If the user belongs to an org and the database knows the issuer, or OIDC server, for that org, the org's ID will be returned. Otherwise, a `null` result will indicate that the user is not part of an org that the app knows about. 

Note that if the user's domain isn't assigned to an org, the route will also search the entire database for any org containing a user with the specified email address. This helps handle edge cases where a user kept their old domain after a subsidiary was acquired by your customer, or has a mismatched domain for other reasons. 

## Loosen Cookie Policy

When users are redirected to the OIDC identity provider and back, their session cookies should stay with them. This behavior would be prohibited by a strict cookie policy. In `main.ts`, change the session cookie policy from `sameSite: 'strict'` to `sameSite: 'lax'`. 

## Use Passport Library

The [Passport OIDC Docs](https://www.passportjs.org/packages/passport-openidconnect/) show an example of using the library with a single OIDC provider. Since the sample app will support many customers with different OIDC providers, it will need to create a strategy based on values looked up in the database instead of hardcoded. 

To create a strategy for each organization, write the `createStrategy` function to look up the required values and make a `passport-openidconnect` strategy from them. Just as in the `passport-openidconnect` docs, the strategy will also have a `verify` function to run after the OIDC flow completes. Add logic to this `verify` function to store missing data about the logged-in user in the Todo app's database. This `createStrategy` function, and the `verify` function within it, can be added to `main.ts` for now. 

Later, you will create a strategy for each org when you need to use it, and discard the strategy afterwards. As long as the org's information in the database remains unchanged, the strategy for that org will be always be the same whenever it's recreated. 

```
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
```


## Start the OpenID Flow

First, identify the org and create an appropriate strategy for it. Handle any errors that might result, and then simply call `passport.authenticate` to use the OpenID configuration passed from the database through the newly created `strategy` and authenticate the user. 

```
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
```

When passport authenticates the user, it will redirect them to their identity provider so that they can log in. After the OpenID server authenticates the user, it redirects them back to the application's `callback` url. 

## Receive callback after authentication

When the OIDC server redirects to the `callback` URL on the application's backend, Passport will redirect the user back to the app. First, though, the backend should validate that the ID of the request corresponds to a real org in the database, and make the OIDC strategy for that org so Passport can continue to use it. 

Use code like this to implement the `callback` route in `main.ts`: 

```
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
```

# Connect to Identity Provider

Now the app is ready for customers to connect their identity providers! This workshop will use an Okta Developer Account as the OIDC provider, to simulate a customer using Okta to connect with your app. 

In a production setting, you would have your customers provide you with the information about their identity providers. But in this workshop, you're pretending to be your own customer, so you'll find the OIDC provider information in this step.

Visit [developer.okta.com](developer.okta.com) and log in to your Developer Account, or sign up if you don't have an account yet. Open the admin console if you're redirected to your user account dashboard. 

## Create App Integration

In the Okta admin console, navigate to "Applications" under the "Applications" heading in the left sidebar. Click the "Create App Integration" button, because your sample app isn't published to the app catalog. If you'll be having a lot of Okta users sign up for your app, publishing it to the catalog can simplify their onboarding process. 

In the "Create a new app integration" dialogue box, select the "OIDC - OpenID Connect" sign-in method, specify that the application is a "Web Application" in the "Application Type" options that appear, and use the "Next" button to continue. 

Give this app integration a useful name like 'Todo app', and make sure that 'Authorization Code' box is selected under "Client acting on behalf of a user" in the Grant type field. 

Find the ID used for this customer in your app by checking the database. For this workshop, the first customer has ID 1, so the sign-in redirect URI is `http://localhost:3333/openid/callback/1`. 

Finally, under Assignments, select "Allow everyone in your organization to access". Saving these changes using the Save button at the bottom of the page will take you to the app's General settings tab, which provides a Client ID and Client Secret. 

## Add Org to Database

Using Prisma Studio to edit your app's database, fill out the `client_id` and `client_secret` for the org with ID 1, using the values from Okta. 

In the Security tab of the sidebar in the Okta Admin Console, find the API settings. This page lists the Issuer URI for the Okta organization, which goes into the app's database for that org as its `issuer`. 

Click the name of the default authorizatio server in the Okta Admin Console, and visit the Metadata URI. This URI will be of the form `your-devaccount-id.okta.com/oauth2/default/.well-known/oauth-authorization-server`. From this authorization server metadata, copy the `authorization_endpoint` to the `authorization_endpoint` field in your app's database. Copy the `token_endpoint` to the corresponding field in the database as well. 

To find the `userinfo_endpoint`, replace the string `oauth-authorization-server` in the metadata URL with `openid-configuration`, and copy the `userinfo_endpoint` from there to the database. 

After this step, your database should contain the `client_id` and `client_secret` unique to the OIDC app that you made in Okta. All endpoint fields will start with the Okta organization's domain. The `userinfo_endpoint` will end with `/oauth2/default/v1/userinfo`; the `token_endpoint` will end with `/oauth2/default/v1/token`; the `authorization_endpoint` will end with `/oauth2/default/v1/authorize`. 

Save the database changes in Prisma, and the first customer's OpenID configuration is ready to go! 

# Use OIDC

Now, when a user whose email domain is associated with an OIDC org tries to sign in to your app, they'll be redirected to that org's login page! If the user is already logged in to their Okta org in the browser session where they load the Todo app, the authentication and redirect process may happen too quickly to see. Be sure to log out of your Okta org if you want to be prompted for its credentials when accessing the Todo app via the OIDC flow. 

The first time an OIDC user logs into the app, their user record is created in the database automatically. 

# What Next? 

Follow OktaDev on Twitter and subscribe on YouTube to learn more!
