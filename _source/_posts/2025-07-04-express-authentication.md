---
layout: blog_post
title: "How to Build a Secure Expense Dashboard with Express and Okta"
author: akanksha-bhasin 
by: advocate
communities: [security,javascript,go,python,mobile,java]
description: "Build a secure expense dashboard using Express, Okta, and Passport with custom claims"
tags: [okta, express, node, passport, oidc, oauth, javascript]
image: blog/express-okta-authentication/express-okta-authentication-social-image.jpeg
type: awareness
---


Every web application needs authentication, but building it yourself is risky and time-consuming. Instead of starting from scratch, you can integrate Okta to manage user identity and use Passport with Express to simplify and secure the login flow. In this tutorial, you'll build a secure, passwordless, role-based expense dashboard where users can view their expenses tailored to their team.

Check out the complete source code on Github and get started without setting it up from scratch. 

**Table of Contents**{: .hide }
* Table of Contents
{:toc}

## Why use Okta for authentication 

Building an authentication system and handling credentials, sessions, and tokens is highly insecure and expose your application to serious vulnerabilities.

Okta provides a secure, scalable, and standards-based solution using OpenID Connect (OIDC) and OAuth 2.0. It also integrates seamlessly with Node.js and Passport, supports passwordless login FIDO2 (WebAuthn), and allows you to customise ID tokens with team-specific claims.

With Okta, you can easily implement modern authentication features and focus on your application logic without worrying about authentication infrastructure.

##  Team-based expense dashboard using Express and Okta 

For any growing organization, tracking expenses by team isn't just helpful, it's essential. Let's build an expense dashboard where users log in with Okta and view spending data. Whether in Finance, Marketing or Support, each team sees a scoped view of expenses tied to their role. The users get clear visibility into what's being spent, by whom, and why.

Managers get transparency into their team's spending. At the same time, admins maintain a secure, centralized overview across all teams to track budgets, spending patterns, and ensure accountability, all without the headache of building authentication and security from scratch.

Along the way, you'll use OpenID Connect (OIDC), configure a custom authorization server, define custom claims for team-based access view, enforce role-based access directly from ID tokens, and integrate all the components into an Express application.

### Prerequisites 

* Node.js installed (v22+ recommended)

* [Okta Integrator Free Plan org](https://developer.okta.com/signup/)

## Create your Express project and install dependencies

Open your terminal, create a new project folder, and install the necessary packages:

`mkdir express-project-okta && cd express-project-okta`  

Initialize a new Node.js project:

`npm init -y`

Install the required packages:

`npm install express passport openid-client@5 jsonwebtoken express-session dotenv ejs express-ejs-layouts`

Now, install the development dependencies:

`npm install --save-dev nodemon`

**What do these dependencies do?** 

These installed packages become your Express project's dependencies.

* **`express`**: Handles routing and HTTP middleware for your Node.js web app

* **`passport`**: Provides a flexible authentication framework

* **`openid-client`**: A server-side OpenID Relying Party implementation for Node.js runtime, including PKCE support

* **`jsonwebtoken`**:  Enables decoding JSON Web Tokens (JWT) to extract user claims

* **`express-session`**: Manages user sessions on the server

* **`dotenv`**: Loads environment variables from a `.env` file

* **`ejs`**: Enables dynamic HTML rendering using embedded JavaScript templates

* **`express-ejs-layouts`**: Adds layout support to EJS, helping manage common layout structures across views

## Create your .env file

Create a `.env` file in the root directory with placeholders for your Okta configuration.

> **Important Notes:** 
> * We will use a **Custom Authorization Server** to fetch custom claims from Okta.   
> * Write team names, e.g., Finance, Marketing, and Support. Make sure all are comma-separated, and if it's a two-word team name, you can add a space in between too. 

```
OKTA_ISSUER=https://{yourOktaDomain}/oauth2/default 
OKTA_CLIENT_ID={yourClientId}
OKTA_CLIENT_SECRET={clientSecret}
APP_BASE_URL=http://localhost:3000
POST_LOGOUT_URL=http://localhost:3000
ALL_TEAMS_NAME=TeamName1,TeamName2,Team Name3
```

You'll get these values from your Okta Admin Console in the next step.

## Create the Okta OIDC application

1. Sign up for a free [Integrator Free Plan](https://developer.okta.com/signup/). If you already have an account, [login](https://developer.okta.com/login/) to the [Okta Developer Console](https://developer.okta.com/signup/). 

2. Navigate to **Applications** \> **Create App Integration**.

3. Choose:
   * **Sign-in method:** OIDC \- OpenID Connect

   * **Application type:** Web Application

4. Click **Next**.  
                             
5. Fill in:
   * **App integration name:** (e.g., `My Web App`)

   * **Sign-in redirect URIs:** `http://localhost:3000/authorization-code/callback`

   * **Sign-out redirect URIs:** `http://localhost:3000`

   * **Assignments:** Allow everyone in your organization to access.

6. After creating the app, click the edit button under Client Credentials and enable **Require PKCE as additional verification**.


7. Copy the **Client ID**, **Client Secret**, and **Okta Domain** and add them to your `.env` file.

## Set up passwordless login using FIDO2 with Okta

Add the **FIDO2 (WebAuthn)** authenticator in Okta to enable passwordless login and follow the [Okta documentation](https://help.okta.com/oie/en-us/content/topics/identity-engine/authenticators/configure-webauthn.htm) for complete enrollment and policy configuration instructions.

>  **Note:** When logging in for the first time, make sure you, as the admin, and all assigned users enroll in FIDO authentication. To simplify this process, you can create a user group containing all team members and assign it to the Web App. Then include the group in your enrollment policy, which you can customize as needed.

## Set up access policies in the Authorization Server

You'll need to create an access policy and a corresponding rule in your Authorization Server. Refer to Okta's [documentation](https://developer.okta.com/docs/guides/configure-access-policy/main/) for complete instructions on configuring access policies.

## Set up custom claims for department information

The most interesting part is to create and include custom attributes from the user profile, as Okta claims in your tokens. For example, you'll add the user's **`department`** information as a claim and display it as a team name on the expense dashboard.

>  **Warning:** Avoid overloading ID tokens with too many custom claims. Keep ID tokens compact and efficient. Including unnecessary or excessive data can bloat the token and lead to network performance issues.

1. **Add custom attributes to the Okta user profile**   
   1. Create the custom **`department`** attribute in your Okta user profile. Navigate to **Directory \> Profile Editor**. Click the application's user profile that you created earlier. (For eg. *My Web App User* in our case)   
   2. Click **Add attribute**, mention **Data type** as **`string`**, **Display name** as **`department`** and **Variable name** as **`department`**, and click Save.  

2. **Map the Custom Attribute to Your Application**  
   Next, **map** this new **`department`** attribute from the Okta user profile to your specific application's user profile.  
   1. Under the Attributes section, click **Mappings.** Select **Okta User to \[Your App Name\].**   
   2. Locate the department string, enter **user.department** as the value, click the arrow dropdown, select **Apply mapping on user create and update**, and then click Save Mappings.

3. **Assign Departments to Users**   
   1. Go to **Directory** \> **People**   
   2. Select a user from the list and click **Profile**.   
   3. Set the **department** attribute field to the user's team (e.g., **`Finance`**,  **`Marketing`**,  **`Support`**) and **`all`** if the user is an admin.  
   **Note:** Ensure you update the department for all user profiles associated with different teams. Also, replace the placeholder team names in the .env file with the team names you want. 

4. **Configuring Custom Claim in the ID Token**   
1. Navigate to **Security \> API \> Authorization Servers**. Create a custom claim and configure the claim with the following details:   
   1. **Name**: **`department`**  
   2. **Include in token type**: Select **`ID Token`** and select **`Always`**.  
   3. **Value type**: Select **`Expression`** from the dropdown.  
   4. **Value**: Enter **`appuser.department`** in the field.  
      **Note:** Since you mapped the Okta User Profile to the App User Profile in the mapping section, use **`appuser.department`** as the expression.  
   5. **Include in**: Select **`The following scopes`** and enter the **`department`** in the blank field below. Click Save.  
2. **Optional Step for Testing:** Under the authorization servers, click default. Under Token preview, proceed with the following steps:   
   1. **OAuth/OIDC client** \- Enter your app name (In our case, My Web App)  
      2. **Select Grant type** as Authorization Code  
      3. Enter your email in the **User** field  
      4. Select **scopes** as **openid** and **department**
      5. Click **Preview Token** to view the department claim. If it's visible, the setup is correct, and the claim will be included in the ID token.  
 

## Building the Express app 

Create an `index.js` file in your project root. This serves as the main entry point for your application. Use it to initialize the Express app, configure session handling, set up [Passport](https://www.passportjs.org/) to use OIDC, and set up the routes. 

```javascript
import express from 'express';
import session from 'express-session';
import passport from 'passport'; 
import routes from './routes.js';
import expressLayouts from 'express-ejs-layouts';

const app = express();

app.set('view engine', 'ejs');
app.use(expressLayouts); 
app.set('layout', 'layout');
app.use(express.urlencoded({ extended: false }));

app.use(session({
  secret: "your-hardcoded-secret",
  resave: false,
  saveUninitialized: true,
}));

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (obj, done) {
  done(null, obj);
});

app.use('/', routes);

app.listen(3000, () => {
  console.log('Server listening on http://localhost:3000');
});
```

### Create an auth file to handle authentication

The authentication logic is kept in a separate file, `auth.js`, to keep your server organized and maintainable. This file manages OpenID Connect authentication with [openid-client](https://www.passportjs.org/packages/openid-client), including PKCE support. It sets up the OIDC client, handles login and logout, processes callbacks, and provides middleware to protect routes.


```javascript
import { Issuer, generators } from "openid-client";
import jwt from "jsonwebtoken";
import "dotenv/config";

const ALL_TEAMS_NAME = process.env.ALL_TEAMS_NAME;

export function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
}

let client = null;
async function getOidcClient() {
  if (!client) {
    try {
      const issuer = await Issuer.discover(process.env.OKTA_ISSUER);

      client = new issuer.Client({
        client_id: process.env.OKTA_CLIENT_ID,
        client_secret: process.env.OKTA_CLIENT_SECRET,
        redirect_uris: [`${process.env.APP_BASE_URL}/authorization-code/callback`],
        response_types: ["code"],

      });

      console.log("OIDC client initialized successfully.");
    } catch (error) {
      console.error("Failed to discover OIDC issuer:", error);
      throw error;
    }
  }

  return client;
}

export async function login(req, res) {
  try {
    const client = await getOidcClient();

    const code_verifier = generators.codeVerifier();
    const state = generators.state();
    req.session.pkce = { code_verifier, state };
    req.session.save();

    const authUrl = client.authorizationUrl({
      scope: "openid profile email offline_access department",
      state: state,
      code_challenge: generators.codeChallenge(code_verifier),
      code_challenge_method: "S256",
    });

    res.redirect(authUrl);
  } catch (error) {
    res.status(500).send("OIDC client is not configured correctly.");
  }
}

export async function authCallback(req, res, next) {
  try {
    const client = await getOidcClient();
    const { pkce } = req.session;

    if (!pkce || !pkce.code_verifier || !pkce.state) {
      throw new Error("Login session expired or invalid. Please try logging in again.");
    }

    const params = client.callbackParams(req);

    const tokenSet = await client.callback(
      `${process.env.APP_BASE_URL}/authorization-code/callback`,
      params,
      {
        code_verifier: pkce.code_verifier,
        state: pkce.state,
      }
    );

    const userInfo = await client.userinfo(tokenSet.access_token);

    const decodedIdToken = jwt.decode(tokenSet.id_token);
    const departmentVal = decodedIdToken.department;

    const departmentObject =
      departmentVal === "all"
        ? ALL_TEAMS_NAME.split(",").map((teamName) => ({
            id: teamName.trim().toLowerCase().split(" ").join("-"),
            label: teamName,
          }))
        : [
            {
              id: departmentVal.split(" ").join("-").toLowerCase(),
              label: departmentVal.charAt(0).toUpperCase() + departmentVal.slice(1),
            },
          ];

    const userProfile = {
      profile: {
        ...userInfo,
        idToken: tokenSet.id_token,
        teams: departmentObject,
        department: departmentVal,
      },
    };

    delete req.session.pkce;

    req.logIn(userProfile, (err) => {
      if (err) {
        return next(err);
      }

      return res.redirect("/dashboard");
    });
  } catch (error) {
    console.error("Authentication error:", error.message);
    return res.status(500).send(`Authentication failed: ${error.message}`);
  }
}

export function logout(req, res) {
  const id_token = req.user?.profile?.idToken;

  req.logout(() => {
    req.session.destroy(() => {
      const logoutUrl = `${process.env.OKTA_ISSUER}/v1/logout?id_token_hint=${id_token}&post_logout_redirect_uri=${process.env.POST_LOGOUT_URL}`;
      res.redirect(logoutUrl);
    });
  });
}
```

### Set up the routes file 

Now things start to come together and feel like a real app. This is where we define all the important routes, from login and logout to viewing your profile, the expense dashboard, and individual team pages. The `routes.js` file handles the core logic for these endpoints, including checking if a user is authenticated before letting them access protected pages.

It acts as the traffic controller of our app, directing users to the right pages and ensuring that only logged-in users can view sensitive information like the expense dashboard or group details. This structure keeps our app organized and secure, and lays the foundation for a smooth user experience.

```javascript
import express from "express";
import "dotenv/config";

import { authCallback, ensureAuthenticated, login, logout } from "./auth.js";
import { expensesByTeam } from "./expensesData.js";

const router = express.Router();

router.get("/", (req, res) => {
  res.render("home", { title: "Home", user: req.user });
});

router.get("/login", login);

router.get("/authorization-code/callback", authCallback);

router.get("/profile", ensureAuthenticated, (req, res) => {
  res.render("profile", { title: "Profile", user: req.user });
});

router.get("/dashboard", ensureAuthenticated, (req, res) => {
  const teams = req.user?.profile?.teams || [];

  res.render("dashboard", {
    title: "Dashboard",
    user: req.user,
    teams,
  });
});

router.get("/teams/:id", ensureAuthenticated, (req, res) => {
  const teamId = req.params.id;
  const teams = req.user?.profile?.teams || [];

  const team = teams.find((team) => team.id === teamId);
  if (!team) {
    return res.status(404).send("Team not found");
  }

  const expenses = expensesByTeam[teamId];
  const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  res.render("expenses", {
    title: team.name,
    user: req.user,
    team,
    expenses,
    total,
  });
});

router.get("/logout", logout);

export default router;

```

### Add views in the app

Now it's time to give the app a user interface. We'll use EJS templates to build pages that respond dynamically to who's logged in and what data they see. The app uses `ejs` templates to render the pages, plus `express-ejs-layouts` for common layout structures.

Create a folder named `views`, then add the following EJS files:

**home.ejs** 

```javascript
<% if (user) { %>
<h1>Welcome, <%= user.profile.name || 'User' %>!</h1>
<% } else { %>
<h1>Welcome</h1>
<% } %>

<p class="lead">Log your expenses and manage your team's spending on the dashboard.</p>

<% if (user) { %>
<a href="/dashboard" class="btn btn-primary">Go to Dashboard</a>
<% } else { %>
<a href="/login" class="btn btn-success">Login</a>
<% } %>

```

**profile.ejs**

```javascript
<h1>Profile</h1>
<p><h6 style="display: inline-block; margin: 0;">Name:</h6> <%= user.profile.name %></p>
<p><h6 style="display: inline-block; margin: 0;">Email:</h6> <%= user.profile.email %></p>


```

**layout.ejs**

```javascript
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title><%= typeof title !== 'undefined' ? title : 'Enterprise Expense Splitter' %></title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet" />
    <style>
    html, body {
        height: 100%;
        margin: 0;
      }
      body {
        display: flex;
        flex-direction: column;
      }
      .content {
        flex: 1;
      }
    </style>
  </head>
  <body>
    <nav class="navbar navbar-expand-lg navbar-dark bg-primary mb-4">
      <div class="container">
        <a class="navbar-brand" href="/dashboard">Expense Dashboard</a>
        <div>
          <% if (user) { %>
          <a href="/dashboard" class="btn btn-light btn-sm me-2">Dashboard</a>
          <a href="/profile" class="btn btn-light btn-sm me-2">Profile</a>
          <a href="/logout" class="btn btn-danger btn-sm">Logout</a>
          <% } else { %>
          <a href="/login" class="btn btn-success btn-sm">Login</a>
          <% } %>
        </div>
      </div>
    </nav>

  <main class="container content">
    <%- body %>
  </main>

  <footer class="text-center mt-5 mb-3 text-muted">
    &copy; Okta Inc. Expense Dashboard
  </footer>
  </body>
</html>


```

**dashboard.ejs**

```javascript
<h1>Dashboard</h1>
<p>Welcome, <%= user.profile.name || 'User' %></p>

<h3>Your Teams</h3>
<% if (teams && teams.length > 0) { %>
<ul class="list-group">
  <% teams.forEach(team => { %>
  <li class="list-group-item d-flex justify-content-between align-items-center">
    <%= team.label %>
    <a href="/teams/<%= team.id %>" class="btn btn-primary btn-sm">View</a>
  </li>
  <% }) %>
</ul>
<% } else { %>
<p>You are not part of any teams yet.</p>
<% } %>

```

**expenses.ejs**
  
This is the EJS template used to render the team expenses view. It receives the team info and expense data from the server and displays it in a tabular format.

```javascript
<h1><%= team.label %></h1>
<div>Welcome to the <h6 style="display: inline-block; margin: 0;"><%= team.label %></h6> team page.</div>
<br/>
<% if (expenses && expenses.length > 0) { %>
<h3>Expenses</h3>
<table class="table table-bordered">
  <thead>
    <tr>
      <th>Name</th>
      <th>Item</th>
      <th>Amount ($)</th>
    </tr>
  </thead>
  <tbody>
      <% expenses.forEach(exp => { %>
    <tr>
      <td><%= exp.name %></td>
      <td><%= exp.item %></td>
      <td><%= exp.amount %></td>
    </tr>
    <% }) %>
  </tbody>
</table>
<div class="alert alert-info"><h6 style="display: inline-block; margin: 0;">Total:</h6> $<%= total %></div>
<% } else { %>
<p>No expenses found for this team.</p>
<% } %>

```

### Create the expense data file 

Create an `expensedata.js` file that serves as a data module for your project. This file dynamically generates sample expense data for each team based on environment variables. It automatically produces dummy expenses for all teams configured for testing in your web app.

```javascript
import 'dotenv/config';

const teams = (process.env.ALL_TEAMS_NAME || '').split(',').map((name) => name.trim().toLowerCase().split(' ').join('-'));

const sampleNames = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley'];

const getRandomAmount = () => Math.floor(Math.random() * 2000) + 300;

const sampleItems = [
  'Product Launch Campaign',
  'Internet',
  'Conference Travel',
  'Team Lunch',
  'Event Booth',
  'Promotional Material',
  'Recruitment Drive',
  'Payroll Processing',
  'Financial Audit',
  'Compliance Training',
];

const generateDummyExpenses = (count = 4) => {
  const expenses = [];
  for (let i = 0; i < count; i++) {
    const name = sampleNames[Math.floor(Math.random() * sampleNames.length)];
    const item = sampleItems[Math.floor(Math.random() * sampleItems.length)];
    expenses.push({
      name,
      item,
      amount: getRandomAmount(),
    });
  }
  return expenses;
};

export const expensesByTeam = teams.reduce((acc, team) => {
  acc[team] = generateDummyExpenses();
  return acc;
}, {});
```

## Run the app

In your terminal, start the server:

`npm start`

Open your browser and navigate to [http://localhost:3000](http://localhost:3000).

Click **Login**, and authenticate with your Okta account. If everything is configured correctly, you'll see your profile and have the option to log out.

> **Note:** If you currently use your Developer Console as an admin, you already have a session for your org; you will be automatically logged into your application.. To test other user accounts, use an incognito tab to test the flow from a blank slate.

#### Admin view:   

{% img blog/express-okta-authentication/admin-view.jpeg alt:"User View Dashboard." width:"800" %}{: .center-image }

#### User view: 

{% img blog/express-okta-authentication/user-view.jpeg alt:"User View Dashboard." width:"800" %}{: .center-image }

#### Expenses view: 

{% img blog/express-okta-authentication/expenses.jpeg alt:"User View Dashboard." width:"800" %}{: .center-image }


Here's a quick rundown of the features I used in this project to build a secure expense dashboard:

* **OpenID Connect (OIDC)** is an identity and authentication layer built on OAuth 2.0.

* **Authorization Code Flow with PKCE**, which is the most secure flow for server-side web apps.

* **Custom claim in the tokens**, fetching departments (e.g. Marketing, Finance, and Support Teams).

And that's it\! You've now built a secure Expense Dashboard and connected your Express application to Okta using OpenID Connect (OIDC) and Passport, layered in FIDO2 (WebAuthn) for modern, passwordless login using passkeys and flexible, team-specific authorization with custom claims. 

**If you'd like to explore the full project and skip setting it up from scratch, check out the complete source code on GitHub.**

## Learn more

To explore further, check out these official Okta resources to learn more about the key concepts. 

* [Authentication vs Authorization](https://www.okta.com/identity-101/authentication-vs-authorization/)  
     
* [OAuth 2.0 and OpenID Connect overview](https://developer.okta.com/docs/concepts/oauth-openid)

* [Authorization Servers in Okta](https://developer.okta.com/docs/concepts/auth-servers) 

* [Sign users into a Node \+ Express app](https://developer.okta.com/docs/guides/sign-into-web-app-redirect/node-express/main) 

Follow us on [Twitter](https://twitter.com/oktadev) and subscribe to our [YouTube](https://www.youtube.com/c/oktadev) channel to see more content like this. If you have any questions, please comment below! 