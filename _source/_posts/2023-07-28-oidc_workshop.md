---
layout: blog_post
title: "Enterprise-Ready Workshop: OpenID Connect"
author: [aaron-parecki, edunham]
by: advocate
communities: [security,javascript]
description: "Add OpenID Connect support to a sample app, and build the skills to make your production applications more appealing to enterprise customers!"
tags: [enterprise-ready-workshops, react, express, oidc]
tweets:
- ""
- ""
- ""
image: blog/oidc_workshop/social.jpg
type: awareness
---
This workshop is part of our Enterprise Readiness Workshop series. 

In this workshop, you will enhance a sample application to let users access it using their organization's identity provider. When any enterprise customer considers buying your software to enhance their employees' productivity, their IT and security teams want to make sure employees can access your app securely. As a developer, you'd prefer not to rebuild large portions of your authentication flow for every new customer. Fortunately, the OpenID Connect standard solves both of these problems! By adding OpenID Connect (OIDC) support to your app, you can meet the identity security needs of every enterprise organization that uses an OIDC-compatible identity provider. 

|Posts in the enterprise-ready workshop series|
| --- |
| 1. [How to get Going with the Enterprise-Ready Identity for SaaS Apps Workshops](blog/2023/07/27/enterprise-ready-getting-started) |
| 2. **Enterprise-Ready Workshop: OpenID Connect** |
| 3. [Enterprise-Ready Workshop: SCIM](/blog/2023/07/28/scim-workshop) |
| 4. [Enterprise-Ready Workshop: Terraform](/blog/2023/07/28/terraform-workshop) |

Today, we'll walk through adding OIDC to our Todo sample application. 

For an in-depth walkthrough of developing and troubleshooting the code in this workshop, follow along on with the video: 
{% youtube -gwgEAa4TkU %}

{% include toc.md %}

**Before you begin** 

Follow the [getting started guide](/blog/2023/07/27/enterprise-ready-getting-started) to set up the Todo app and its dependencies. Make sure you can run the app locally and view the login page in your browser. Launch Prisma Studio to examine the database, as well. 

You will also need a free [Okta Developer Account](https://developer.okta.com/login/), to test the setup steps your customer will follow when integrating their OpenID Connect server with your application. 

## Why use OpenID Connect (OIDC) to authenticate users

The Todo app currently only supports password login, but your enterprise customers' IT departments don't want their users managing one-off passwords. You would also like to use customer data, such as which user accounts belong to which organizations, to enhance your app's features. 

Since you value flexibility and maintainability, you want to use a library to let your app integrate with arbitrary OpenID Connect servers. 

Introducing these features will require adding logic to the application's backend to handle user accounts and org memberships appropriately, and frontend code to authenticate users with their organization's identity provider when appropriate while supporting password authentication for users who aren't signing in via OIDC. To use these features of your app, you will set it up with an OIDC integration in your Okta Developer Account.

## Support OIDC in the Prisma database schema

The sample application defines the relationship between Todo items and users in the file `schema.prisma`. Prisma uses this file to create SQLite tables for you. 

With OIDC support, the app will need to store information about organizations in its database, as well as tracking the relationships between those organizations and the user accounts and Todo items. 

## Add multi-tenant OIDC configurations

To support OpenID Connect, the app needs to know about more than just users and Todo items. It needs a new model, called the `org`, which represents an organization that users can belong to. 

The `org`'s ID will be an auto-increment field for demonstration purposes, although using sequential identifiers in production could leak information about how many customers you have.

The `org` is identified by its email domain, which is a `string` field. 

Since your app will have many customers with different identity providers, you'll store each org's OpenID configuration in the database. This will require columns for: 

- Authorization endpoint, a URL where the app will redirect users from the org so they can log in
- Token endpoint, location on the OIDC server where the app can get an ID token
- User info endpoint, where the app can retrieve the user's profile info like name and email
- Client ID and client secret, which are the credentials that the app can use to authenticate to the org's OIDC server
- API Key, for future use, if you add API access to the app for users in this org
- Issuer, an identifier representing the OIDC server for the org

Note that to keep things simple for demonstration purposes, we are storing the client secret and API key in plain text in the database. In production, you should use some sort of encrypted key store to manage these credentials.
Here's how organization support looks in `schema.prisma`:

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

### Enhance the `User` model for multi-tenant OIDC

The sample application already manages rudimentary user accounts, but with OIDC support, users will belong to organizations. The user model in `schema.prisma` needs a relationship to an organization, which is implemented with the `org` and `orgID` fields. 

Previously, the sample app treated a user's email address as their unique identifier. This can cause problems if the user's organization changes its domain name, or if the user's email address changes when they change their name. Instead, with OIDC support, a unique identifier for each user can be supplied by their identity provider. This identifier is called `sub` (short for "subject") in the OIDC protocol, and is guaranteed to be a unique and stable identifier for that user on that server. It's possible for multiple OIDC servers to issue the same `sub` ID, since this is not a globally unique value, so the combination of server and subject uniquely identifies a single user.

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

### Track orgs for Todo items

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

### Run the Prisma database migration

After saving these changes to `schema.prisma`, open a terminal and run `npx prisma generate` to generate the new schema, and `npx prisma db push` to apply it. 

After completing this migration, you can explore the new database structure in Prisma. Users belong to organizations, and tasks can be associated with orgs. 

## Update the React application to support multi-tenant OIDC organizations

If a user is able to log in via OpenID Connect, what changes will the frontend need around the login experience? Right now, every user is prompted for their username and password at the login page. But OIDC users won't have a password for this app, and should not entrust their login credentials to your web form! 

To handle both OIDC and non-OIDC users, the app should first prompt for the user's email address, and check whether they should be redirected to their organization's identity provider. If a user doesn't belong to an org, they should instead enter their password to log in. You can now modify the sample app's frontend code to support this behavior. 

### Hide the password field

The first change in `src/app/components/signin.tsx` is hiding the password field when the page is first loaded. Find the `div` containing the password, give it an identifier, and set it to be hidden by default: 

```html
<div id="password-field" className="mb-6" hidden>
```

### Submit the email address to server

The sample app grays out the Sign In button if the email address or password field is empty. With OIDC, the user will submit their email address first, and then follow an appropriate login flow based on the results of the app backend looking up that email. 

Find the line of `signin.tsx` where the Sign In button checks for both username and password and change it to check for only the username: 

```tsx
disabled = {!username}
```

### Validate the user's organization

The `signIn` function in `signin.tsx` will need to check whether a user belongs to an organization. If the user belongs to an org, the app's frontend should redirect them to the backend to complete their login flow with their identity provider. This redirect ensures that malicious software affecting the user's browser or device has no chance to intercept or inspect the OIDC exchange between your app's backend and the user's identity provider. 

This logic expects the backend to return a numeric organization ID when it runs the `onUsernameEnteredFn` function to look up the username. If the user isn't in an org, that function will return `null` and the user will continue to password authentication. 

```ts
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
Don't change the sample app's logic for when the Sign In button submits both a username and a password, because users without OIDC will still provide both to log in.

Since the `onUsernameEnteredFn` will be implemented in the `authState` component, make sure to import it to the Signin function in `signin.tsx`, along with the `onAuthenticateFn`: 

```ts
  const { onAuthenticateFn, onUsernameEnteredFn } = useAuthState();
```

The `onUsernameEnteredFn` code doesn't exist yet, but you'll write it in the next step!

## Start the OpenID flow for authentication

To complete the frontend changes, implement the `onUsernameEnteredFn` in `authState.tsx`. This will be similar to `onAuthenticateFn`, which is already provided in the sample code. 

Declare `onUsernameEnteredFn` in the `AuthContextType` Type: 

```ts
  onUsernameEnteredFn: (username: string) => Promise<number|null>;
```

Add it to the `defaultAuthContext`: 

```ts
  onUsernameEnteredFn: async () => null,
```

Implement `onUsernameEnteredFn` by modifying a copy of `onAuthenticateFn` in `authState.tsx`. Instead of using the `/api/signin` endpoint on the app's backend, you'll use the `/api/openid/check` endpoint:  

```ts
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

And finally, make sure that `onUsernameEnteredFn` is included in the provider context returned from `onRevokeAuthFn`: 

{% raw %}
```jsx
  return <AuthContext.Provider value={{ authState, onAuthenticateFn, onUsernameEnteredFn, onRevokeAuthFn, userIsAuthenticatedFn }}>{children}</AuthContext.Provider>;
```
{% endraw %}

From the perspective of the app's frontend, these are all the changes that matter. Supporting OIDC will not change how the frontend communicates with the backend through sessions. 

The frontend is now ready to use the backend's `/api/openid/check` endpoint to investigate whether a user belongs to an OIDC org, and then redirect the browser to the org's custom `/api/openid/start/${org_id}` endpoint to initiate the login flow if an org is found! Your next step is to add these endpoints to the application's backend. 

## Update the Express API to support OIDC

The application's backend will use a library to handle most of the OIDC authentication process. After authenticating, the user will be redirected back to the app just as they are when logging in with a password.

### Install the Passport OIDC Library

Since the sample app is already using Passport for password authentication, the Passport OIDC library will offer seamless integration with the OpenID Connect provider.

In your project, run `npm install --save passport-openidconnect` to install the library.  This will update `package.json` automatically to specify the installed version: 

```
    "passport-openidconnect": "^0.1.1",
```

### Add helper functions

Add the following helper functions to `apps/api/src/main.ts` to simplify your upcoming work. 

`orgFromId` will take an integer org ID and return the database record for the organization that the ID references:

```ts
async function orgFromId(id) {
  const org = await prisma.org.findFirst({
    where: {
      id: parseInt(id)
    }
  })
  return org
}
```

`getDomainFromEmail` will parse a domain from an email address, by returning everything after the `@`: 

```ts
function getDomainFromEmail(email) {
  let domain;
  try {
    domain = email.split('@')[1];
  } catch(e) {
    return null;
  }
  return domain;
}
```

## Add route to check the OpenID org

The `/api/openid/check` endpoint will return the numeric ID of the org that a user's email domain belongs to, or `null` if the user isn't part of an org. The user's full email address will arrive at the endpoint in the request body, so the helper function `getDomainFromEmail` will return the domain, before it's used to look up the corresponsding org in the database. Add this code to `main.ts`: 

```ts
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

If the user belongs to an org and the database knows the `issuer` (the OIDC server) for that org, the org's ID will be returned. Otherwise, a `null` result will indicate that the user is not part of an org that the app knows about. 

Note that if the user's domain isn't assigned to an org, this code will also search the entire database for any org containing a user with the specified email address. This helps handle edge cases where a user kept their old domain after a subsidiary was acquired by your customer, or has a mismatched domain for other reasons. 

### Loosen the cookie policy for the OIDC redirect authentication flow

When users are redirected to the OIDC identity provider and back, their session cookies should stay with them. This behavior would be prohibited by a strict cookie policy. In `main.ts`, change the session cookie policy from `sameSite: 'strict'` to `sameSite: 'lax'`. 

### Use the Passport OIDC library

The [Passport OIDC Docs](https://www.passportjs.org/packages/passport-openidconnect/) show an example of using the library with a single OIDC provider. Since the sample app will support many customers with different OIDC providers, it will need to create a `Strategy` based on values retrieved from the database instead of relying on hardcoded information. 

To create a `Strategy` for each organization, write the `createStrategy` function to look up the necessary values and generate a `passport-openidconnect` strategy from them. Just as in the `passport-openidconnect` docs, the `Strategy` will also have a `verify` function to run after the OIDC flow completes. Add logic to this `verify` function to store missing data about the logged-in user in the Todo app's database. This `createStrategy` function, and the `verify` function within it, can be added to `main.ts` for now. 

Later, you will create a `Strategy` for each org when you need to use it, and discard the `Strategy` afterwards. As long as the org's information in the database remains unchanged, the `Strategy` for that org will be always be the same whenever it's recreated. 

```ts
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

What path will this code follow if the user existed in the database but needed to be updated? What path will it follow if this is the user's first time logging into the Todo app?

Now that the Passport OIDC library is configured to interface with the database and update it as necessary whenever a user logs in, it's time to implement the endpoints which will initiate OIDC auth by calling the `passport.authenticate` function. 

### Enable the OpenID flow

The frontend will redirect the browser to the backend's `/openid/start/${org_id}` endpoint to initiate the OpenID login flow when a user belongs to an org. 

When that endpoint is hit, it will identify the org and create an appropriate strategy for it. It will then handle any errors that might result, and call `passport.authenticate` to use the OpenID configuration passed from the database through the newly created `Strategy` and authenticate the user. 

```ts
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

For passport to authenticate the user, it will redirect them to their identity provider so that they can log in. After the OpenID server authenticates the user, it redirects them back to the application's `callback` url. 

To recap, redirecting the user to the backend's `/openid/start/` endpoint with an org's ID will use passport to redirect the user to their org's OpenID server. The user will prove their identity to their org's OpenID server, and that server will redirect the user to the app's backend, at which point Passport will start a session to the Todo app. Only the app's backend will see the information from the OIDC server, so frontend tampering cannot intercept the user's session. 

Once the OpenID server has authenticated the user, it will redirect them to the Todo app backend's `callback` URL. Your next step is to implement the `/openid/callback/${org_id}` endpoint.

### Receive callback after authentication

When the OIDC server redirects to the `callback` URL on the application's backend, Passport will redirect the user back to the app. First, though, the backend should validate that the ID of the request corresponds to a real org in the database, and make the OIDC strategy for that org so Passport can continue to use it. 

Use code like this to implement the `callback` route in `main.ts`: 

```ts
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

What kinds of problem is this code anticipating? Where will the user be sent if their authentication is successful? 

## Connect to the Identity Provider

Now the app is ready for customers to connect their identity providers! This workshop will use an Okta Developer Account as the OIDC provider, to simulate a customer using Okta to connect with your app. 

In a production setting, you would have your customers provide you with information about their identity providers. But in this workshop, you're pretending to be your own customer, so you'll gather the OIDC provider information in this step.

Visit [developer.okta.com](developer.okta.com) and log in to your Developer Account, or sign up if you don't have an account yet. Open the admin console if you're redirected to your user account dashboard. 

## Create an authorization server

In the Okta Admin Console, navigate to **Applications** under the "Applications" heading in the left sidebar. Click the **Create App Integration** button, because your sample app isn't published to the app catalog. (If your app's audience includes a lot of Okta customers, publishing to the [Okta Integration Network](https://www.okta.com/okta-integration-network/) can simplify their onboarding process.) 

In the "Create a new app integration" dialog box, select the **OIDC - OpenID Connect** sign-in method, specify that the application is a "Web Application" in the "Application Type" options that appear, and use the "Next" button to continue. 

Give this app integration a useful name like "Todo app", and make sure that **Authorization Code** box is selected under "Client acting on behalf of a user" in the Grant type field. 

Find the ID used for this customer in your app by checking the database. For this workshop, the first customer has ID 1, so the sign-in redirect URI is `http://localhost:3333/openid/callback/1`. 

Finally, under Assignments, select "Allow everyone in your organization to access". Saving these changes using the Save button at the bottom of the page will take you to the app's General settings tab, which provides a Client ID and Client Secret. 

### Add org configuration to the database

Using Prisma Studio to edit your app's database, fill out the `client_id` and `client_secret` for the org with ID 1, using the values from Okta. 

In the "Security" section of the sidebar in the Okta Admin Console, navigate to **API**. This page lists the Issuer URI for the Okta organization, which goes into the app's database for that org as its `issuer`. 

Click the name of the default authorization server in the Okta Admin Console, and visit the Metadata URI. This URI will be of the form `your-dev-account-id.okta.com/oauth2/default/.well-known/oauth-authorization-server`. From this authorization server metadata, copy the `authorization_endpoint` to the `authorization_endpoint` field in your app's database. Copy the `token_endpoint` to the corresponding field in the database as well. 

To find the `userinfo_endpoint`, replace the string `oauth-authorization-server` in the metadata URL with `openid-configuration`, and copy the `userinfo_endpoint` from the resulting page to the database. 

After this step, your database should contain the `client_id` and `client_secret` unique to the OIDC app that you made in Okta. All endpoint fields will start with the Okta organization's domain. 

Check that each value is in the right database field. The subdomain of each URL will have your Okta dev account's ID in it, and: 
- The `userinfo_endpoint` ends with `/oauth2/default/v1/userinfo`
- The `token_endpoint` ends with `/oauth2/default/v1/token`
- The `authorization_endpoint` ends with `/oauth2/default/v1/authorize`

Save the database changes in Prisma, and the first customer's OpenID configuration is ready to go! 

## Use OIDC authentication in the application

Now, when a user whose email domain is associated with an OIDC org tries to sign in to your app, they'll be redirected to that org's login page! If the user is already logged in to their Okta org in the browser session where they load the Todo app, the authentication and redirect process may happen too quickly to see. Be sure to log out of your Okta org if you want to be prompted for its credentials when accessing the Todo app via the OIDC flow. 

The first time an OIDC user logs into the app, their user record is created in the database automatically. 

Create some user accounts in your Okta Admin Console, and try logging into the Todo app as those users! Use Prisma to see how each user's database record is created the first time they log in. 

## Learn more about enterprise ready identity SaaS apps 

The OIDC support that you added to the sample app today allows information flow from customer identity providers into your application. You can explore the OpenID standards to learn more about what other information you can gather when someone logs into your app with OIDC. What app features might you be able to use that data for? 

OIDC offers a one-way stream of information: Your application can't change a user's records in the upstream identity provider. To support this two-way flow of information between your app and the IDP, you can use SCIM, the System for Cross-Domain Identity Management. Our SCIM workshop builds on the OIDC support implemented in this workshop! 

To set up users and groups in your Okta Developer Account, try our Terraform workshop! 

|Posts in the enterprise-ready workshop series|
| --- |
| 1. [How to get Going with the Enterprise-Ready Identity for SaaS Apps Workshops](blog/2023/07/27/enterprise-ready-getting-started) |
| 2. **Enterprise-Ready Workshop: OpenID Connect** |
| 3. [Enterprise-Ready Workshop: SCIM](/blog/2023/07/28/scim-workshop) |
| 4. [Enterprise-Ready Workshop: Terraform](/blog/2023/07/28/terraform-workshop) |

When gathering requirements from enterprise customers, pay attention to their security and interoperability needs surrounding workforce identity. Ask whether their identity administrators prefer OIDC, or allowing employees to manage passwords for every service! 

Have you added OIDC support to an application? What parts of the process did you find most challenging? Did you get positive feedback from your customers about it? Share your story in the comments below!
