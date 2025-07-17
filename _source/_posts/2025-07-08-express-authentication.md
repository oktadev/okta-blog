---
layout: blog_post
title: "Secure Your Express App with Okta and OAuth 2.0 Authentication"
author: akanksha-bhasin 
by: advocate
communities: [javascript]
description: "Build a secure expense dashboard using Express, Passport, and Okta using OIDC and OAuth 2.0 PKCE"
tags: [express, node, passport, oidc, oauth, pkce, javascript, authentication]
image: blog/express-okta-authentication/express-okta-authentication-social-image.jpeg
type: conversion
github: https://github.com/oktadev/okta-express-expense-dashboard-example
---

Every web application needs authentication, but building it yourself is risky and time-consuming. Instead of starting from scratch, you can integrate Okta to manage user identity and use Passport with Express to simplify and secure the login flow. In this tutorial, you'll build a secure, passwordless, role-based expense dashboard where users can view their expenses tailored to their team.

Check out the complete source code on [GitHub](https://github.com/oktadev/okta-express-expense-dashboard-example) and get started without setting it up from scratch. 

**Table of Contents**{: .hide }
* Table of Contents
{:toc}

## Why use Okta for authentication 

Building an authentication system and handling credentials, sessions, and tokens is highly insecure and exposes your application to serious vulnerabilities.

Okta provides a secure, scalable, and standards-based solution using OpenID Connect (OIDC) and OAuth 2.0. It also integrates seamlessly with Express and Passport, supports passwordless login using FIDO2 and WebAuthn, and allows you to customise ID tokens with team-specific claims.

### Why Use PKCE in OAuth 2.0
To further strengthen security, this project uses PKCE (Proof Key for Code Exchange), defined in [RFC 7636](https://www.rfc-editor.org/rfc/rfc7636). PKCE is a security extension to the Authorization Code flow. Developers initially designed PKCE for mobile apps, but experts now recommend it for all OAuth clients, including web apps. It helps prevent CSRF and authorization code injection attacks and makes it useful for every type of OAuth client, even web apps that use client authentication. As OAuth 2.0 has steadily evolved, security best practices have also advanced. [RFC 9700: Best Current Practice for OAuth 2.0 Security](https://www.rfc-editor.org/rfc/rfc9700.html) captures the consensus on the most effective and secure implementation strategies. Additionally, the upcoming OAuth 2.1 draft requires PKCE for all authorization code flows, reinforcing it as a baseline security standard.

With Okta, you can implement modern authentication features and focus on your application logic without worrying about authentication infrastructure.

##  Team-based expense dashboard using Express, Passport, and OAuth 2.0

For any growing organization, tracking expenses by team isn't just helpful, it's essential. Let's build an expense dashboard where users log in with Okta and view spending data. Whether in Finance, Marketing, or Support, each team sees a scoped view of expenses tied to their role. The users get clear visibility into what's being spent, by whom, and why.

Managers get transparency into their team's spending. At the same time, admins maintain a secure, centralized overview across all teams to track budgets and spending patterns and ensure accountability, all without the headache of building authentication and security from scratch.

You'll also use OpenID Connect (OIDC) through Passport and the openid-client library. Then, you'll map each user's email from the ID token to a team. The dashboard displays expenses by team, so each user sees only their department's spending.



**Prerequisites**

* Node.js installed (v22+ recommended)

* [Okta Integrator Free Plan org](https://developer.okta.com/signup/)

## Create your Express project and install dependencies

Create a new project folder named 'express-project-okta`, and open a terminal window in the project folder.

Initialize a new Node.js project:

```sh
npm init -y
```

Install the required packages:

```sh
npm install express@5.1 passport@0.7 openid-client@6.6 express-session@1.18 ejs@3.1 express-ejs-layouts@2.5 dotenv
```


Now, install the development dependencies:

```sh
npm install --save-dev nodemon
``` 

**What do these dependencies do?** 

These installed packages become your Express project's dependencies.

* **`express`**: Handles routing and HTTP middleware for your Node.js web app

* **`passport`**: Provides a flexible authentication framework

* **`openid-client`**: A server-side OpenID Relying Party implementation for Node.js runtime, including PKCE support

* **`express-session`**: Manages user sessions on the server

* **`dotenv`**: Loads environment variables from a `.env` file

* **`ejs`**: Enables dynamic HTML rendering using embedded JavaScript templates

* **`express-ejs-layouts`**: Adds layout support to EJS, helping manage common layout structures across views

## Configure environment variables for OIDC authentication

Create a `.env` file in the root directory with placeholders for your Okta configuration.

```
OKTA_ISSUER=https://{yourOktaDomain}/oauth2/default 
OKTA_CLIENT_ID={yourClientId}
OKTA_CLIENT_SECRET={clientSecret}
APP_BASE_URL=http://localhost:3000
POST_LOGOUT_URL=http://localhost:3000
```

In the next step, you'll get these values from your Okta Admin Console.

## Create the Okta OIDC application

1. Sign up for a free [Integrator Free Plan](https://developer.okta.com/signup/). If you already have an account, [login](https://developer.okta.com/login/) to the [Okta Developer Console](https://developer.okta.com/signup/). 

2. In the Okta Admin Console, navigate to **Applications** \> **Create App Integration**.

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

## Set up passwordless login using FIDO2 and WebAuthn with Okta 

Add the **FIDO2 (WebAuthn)** authenticator in Okta to enable passwordless login and follow the [Okta documentation](https://help.okta.com/oie/en-us/content/topics/identity-engine/authenticators/configure-webauthn.htm) for complete enrollment and policy configuration instructions.

>  **Note:** When logging in for the first time, make sure you, as the admin, and all assigned users enroll in FIDO authentication. To simplify this process, you can create a user group containing all team members and assign it to the Web App. Then include the group in your enrollment policy, which you can customize as needed.
 

## Building the Express app 

Create an `index.js` file in your project root. It serves as the main entry point for your application. Use it to initialize the Express app, configure session handling, set up [Passport](https://www.passportjs.org/) to use OIDC, and set up the routes. 

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

### Define team mapping and sample expenses 

Create a `utils.js` file to serve as a data module for your project. This file includes a user-to-team mapping and has dummy expense data for each team, covering all teams configured for testing in your web app.

The application determines the user's team context from the email claim in the ID token and filters the expense list accordingly, so the dashboard displays only that team's data.

To customize the data, open utils.js and update the following objects:

ALL_TEAMS_NAME - an array listing all teams in your organization

userTeamMap - maps each user's email (or "admin" for full access) to a specific team

dummyExpenseData - contains sample expense data for each team


```javascript
export const ALL_TEAMS_NAME = ["finance", "hr", "legal", "marketing", "dev advocacy"];

export const userTeamMap = {
  "hermoine.granger@company.com": "admin",
  "grace.li@company.com": "legal",
  "frank.wilson+@company.com": "dev advocacy",
  "carol.lee@company.com": "finance",
  "alice.johnson@company.com": "marketing",
  "sarah.connor@company.com": "hr",
};

export const dummyExpenseData = {
  finance: [
    {
      name: "Alice Johnson",
      item: "Product Launch Campaign",
      amount: 1200,
    },
    {
      name: "Bob Smith",
      item: "Promotional Material",
      amount: 450,
    },
    {
      name: "Carol Lee",
      item: "Team Lunch",
      amount: 180,
    },
    {
      name: "David Kim",
      item: "Event Booth",
      amount: 950,
    },
  ],
  hr: [
    {
      name: "Eve Martinez",
      item: "Internet",
      amount: 300,
    },
    {
      name: "Frank Wilson",
      item: "Compliance Training",
      amount: 600,
    },
    {
      name: "Grace Li",
      item: "Conference Travel",
      amount: 1500,
    },
    {
      name: "Henry Zhang",
      item: "Team Offsite",
      amount: 1000,
    },
  ],
  marketing: [
    {
      name: "Alice Johnson",
      item: "Payroll Processing",
      amount: 750,
    },
    {
      name: "Carol Lee",
      item: "Compliance Training",
      amount: 400,
    },
    {
      name: "Eve Martinez",
      item: "Team Lunch",
      amount: 200,
    },
    {
      name: "Frank Wilson",
      item: "Team Offsite",
      amount: 850,
    },
  ],
  legal: [
    {
      name: "Grace Li",
      item: "Event Booth",
      amount: 1100,
    },
    {
      name: "David Kim",
      item: "Product Launch Campaign",
      amount: 1300,
    },
    {
      name: "Bob Smith",
      item: "Conference Travel",
      amount: 1250,
    },
    {
      name: "Henry Zhang",
      item: "Team Lunch",
      amount: 170,
    },
  ],
  "dev-advocacy": [
    {
      name: "Eve Martinez",
      item: "Internet",
      amount: 280,
    },
    {
      name: "Frank Wilson",
      item: "Payroll Processing",
      amount: 720,
    },
    {
      name: "Grace Li",
      item: "Compliance Training",
      amount: 500,
    },
    {
      name: "Alice Johnson",
      item: "Team Offsite",
      amount: 950,
    },
  ],
};
```

### Create an auth file to handle authentication

The authentication logic is kept in a separate file, `auth.js`, to keep your server organized and maintainable. This file manages OpenID Connect authentication with [openid-client](https://www.passportjs.org/packages/openid-client), including PKCE support. It sets up the OIDC client, handles login and logout, processes callbacks, and provides middleware to protect routes.


```javascript
import * as client from "openid-client";
import "dotenv/config";

import { userTeamMap, ALL_TEAMS_NAME } from './utils.js';

export function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
}

function getCallbackUrlWithParams(req) {
  const host = req.headers["x-forwarded-host"] || req.headers.host || "localhost";
  const protocol = req.headers["x-forwarded-proto"] || req.protocol;
  const currentUrl = new URL(`${protocol}://${host}${req.originalUrl}`);
  return currentUrl;
}

function getModifiedTeam(team) {
  if (!team?.trim()) return [];

  const toPascalCase = (str) =>
    str
      .trim()
      .split(/\s+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');

  const toKebabCase = (str) => str.trim().toLowerCase().split(' ').join('-');

  if (team === 'admin') {
    return ALL_TEAMS_NAME.map((element) => ({
      id: toKebabCase(element),
      label: toPascalCase(element),
    }));
  }

  return [
    {
      id: toKebabCase(team),
      label: toPascalCase(team),
    },
  ];
}

async function getClientConfig() {
  return await client.discovery(new URL(process.env.OKTA_ISSUER), process.env.OKTA_CLIENT_ID, process.env.OKTA_CLIENT_SECRET);
}

export async function login(req, res) {
  try {
    const openIdClientConfig = await getClientConfig();

    const code_verifier = client.randomPKCECodeVerifier();
    const code_challenge = await client.calculatePKCECodeChallenge(code_verifier);
    const state = client.randomState();

    req.session.pkce = { code_verifier, state };
    req.session.save(); 

    const authUrl = client.buildAuthorizationUrl(openIdClientConfig, {
      scope: "openid profile email offline_access",
      state,
      code_challenge,
      code_challenge_method: "S256",
      redirect_uri: `${process.env.APP_BASE_URL}/authorization-code/callback`,
    });

    res.redirect(authUrl);
  } catch (error) {
    res.status(500).send("Something failed during the authorization request");
  }
}

export async function authCallback(req, res, next) {
  try {
    const openIdClientConfig = await getClientConfig();

    const { pkce } = req.session;

    if (!pkce || !pkce.code_verifier || !pkce.state) {
      throw new Error("Login session expired or invalid. Please try logging in again.");
    }

    const tokenSet = await client.authorizationCodeGrant(openIdClientConfig, getCallbackUrlWithParams(req), {
      pkceCodeVerifier: pkce.code_verifier,
      expectedState: pkce.state,
    });

    const { name, email } = tokenSet.claims();
    const teams = getModifiedTeam(userTeamMap[email]);

    const userProfile = {
      name,
      email,
      teams,
      idToken: tokenSet.id_token,
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

export async function logout(req, res) {
  try {
    const openIdClientConfig = await getClientConfig();

    const id_token_hint = req.user?.idToken;

    const logoutUrl = client.buildEndSessionUrl(openIdClientConfig, {
      id_token_hint,
      post_logout_redirect_uri: process.env.POST_LOGOUT_URL,
    });

    req.logout((err) => {
      if (err) return next(err);

      req.session.destroy((err) => {
        if (err) return next(err);
        res.redirect(logoutUrl);
      });
    });
  } catch (error) {
    res.status(500).send('Something went wrong during logout.');
  }
}
```

### Set up the routes file 

Now things start to come together and feel like a real app. The `routes.js` file defines all the essential routes, from login and logout to viewing your profile, the expense dashboard, and individual team pages. The app handles each endpoint's core logic and checks a user's authentication status before granting access to protected pages.

It acts as our app's traffic controller, directing users to the right pages and ensuring that only logged-in users can view sensitive information like the expense dashboard or group details. This structure keeps our app organized and secure and lays the foundation for a smooth user experience.

```javascript
import express from "express";
import "dotenv/config";

import { authCallback, ensureAuthenticated, login, logout } from "./auth.js";
import { dummyExpenseData } from './utils.js';

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
  const team = req.user?.teams || [];

  res.render("dashboard", {
    title: "Dashboard",
    user: req.user,
    team,
  });
});

router.get("/team/:id", ensureAuthenticated, (req, res) => {
  const teamId = req.params.id;
  const teamList = req.user?.teams || [];

  const team = teamList.find((team) => team.id === teamId);
  if (!team) {
    return res.status(404).send("Team not found");
  }

  const expenses = dummyExpenseData[teamId];
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

Now it's time to give the app a user interface. You'll use EJS templates to build pages that respond dynamically to who's logged in and what data they see. The app uses `ejs` templates to render the pages, plus `express-ejs-layouts` for common layout structures.

Create a folder named `views`, then add the following EJS files:

**home.ejs** 

```javascript
<% if (user) { %>
<h1>Welcome, <%= user.name || 'User' %>!</h1>
<% } else { %>
<h1>Welcome</h1>
<% } %>

<p class="lead">Log your expenses and manage your team/'s spending on the dashboard.</p>

<% if (user) { %>
<a href="/dashboard" class="btn btn-primary">Go to Dashboard</a>
<% } else { %>
<a href="/login" class="btn btn-success">Login</a>
<% } %>

```

**profile.ejs**

```javascript
<h1>Profile</h1>
<p><h6 style="display: inline-block; margin: 0;">Name:</h6> <%= user.name %></p>
<p><h6 style="display: inline-block; margin: 0;">Email:</h6> <%= user.email %></p>
```

**layout.ejs**

```javascript
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title><%= typeof title !== 'undefined' ? title : 'Expense Dashboard' %></title>
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
      .team-heading {
        display: inline-block;
        font-weight: 600;
        color: #2c3e50; 
        margin-bottom: 1rem;
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
<p>Welcome, <%= user.name || 'User' %></p>

<h3>Your Teams</h3>
<% if (team && team.length > 0) { %>
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
  
The EJS template renders the team info and expenses data in a tabular format.

```javascript
<h1><%= team.label %></h1>
<div>Welcome to the <p class="team-heading"><%= team.label %></p> team page.</div>
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

## Run the app

In your terminal, start the server:

`npm start`

Open your browser and navigate to [http://localhost:3000](http://localhost:3000).

Click **Login** and authenticate with your Okta account. The app then displays your Expense Dashboard, Profile, and a Log out option.

> **Note:** When you're signed in to the Developer Console as an admin, Okta keeps your org session active and automatically logs you into the app. To test other user accounts, use an incognito tab to test the flow from a blank slate.

#### Admin view:   

{% img blog/express-okta-authentication/admin-view.jpeg alt:"User View Dashboard." width:"1000" %}{: .center-image }

#### User view: 

{% img blog/express-okta-authentication/user-view.jpeg alt:"User View Dashboard." width:"1000" %}{: .center-image }

#### Expenses view: 

{% img blog/express-okta-authentication/expenses.jpeg alt:"User View Dashboard." width:"1000" %}{: .center-image }

## Recap and learn more

Here's a quick rundown of the features I used in this project to build a secure expense dashboard:

* **OpenID Connect (OIDC)** is an identity and authentication layer built on OAuth 2.0.

* **Authorization Code Flow with PKCE**, is the most secure flow for server-side web apps.


And that's it\! You've now built a secure Expense Dashboard and connected your Express application to Okta using OpenID Connect (OIDC) and Passport, layered in FIDO2 (WebAuthn) for modern, passwordless login using passkeys and flexible, team-specific authorization with custom claims. 

If you'd like to explore the whole project and skip setting it up from scratch, check out the complete source code on [GitHub](https://github.com/oktadev/okta-express-expense-dashboard-example).

To explore further, check out these official Okta resources to learn more about the key concepts. 

* [Authentication vs Authorization](https://www.okta.com/identity-101/authentication-vs-authorization/)  
     
* [OAuth 2.0 and OpenID Connect overview](https://developer.okta.com/docs/concepts/oauth-openid)

* [Implement Authorization Code with PKCE](https://developer.okta.com/docs/guides/implement-grant-type/authcodepkce/main)

* [Authorization Servers in Okta](https://developer.okta.com/docs/concepts/auth-servers) 

Follow us on [LinkedIn](https://www.linkedin.com/company/oktadev), [Twitter](https://twitter.com/oktadev), and subscribe to our [YouTube](https://www.youtube.com/c/oktadev) channel to see more content like this. If you have any questions, please comment below!