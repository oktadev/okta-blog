---
disqus_thread_id: 6674984077
discourse_topic_id: 16872
discourse_comment_url: https://devforum.okta.com/t/16872
layout: blog_post
title: "Build Secure Node Authentication with Passport.js and OpenID Connect"
author: lee-brandt
by: advocate
communities: [javascript]
description: "This post demonstrates how to set up OpenID Connect authentication in Node with Passport.js."
tags: [nodejs, node, passportjs, passport-dot-js, authentication, openid-connect, oidc]
tweets:
 - "Checkout @nodejs authentication using @passportjs and OpenID Connect from @leebrandt!"
 - "Learn how to get OpenID Connect authentication into your @nodejs apps easier with @passportjs! <3"
 - "Make it easy to get authentication into your @nodejs apps with @passportjs and OpenID Connect!"
type: conversion
github: https://github.com/oktadev/okta-node-passport-oidc-example
changelog:
  - 2022-01-04: Updated all the dependencies and the associated code. See this post's changes in [okta-blog#1015](https://github.com/oktadev/okta-blog/pull/1015). A repository with accompanying code has been added [here](https://github.com/oktadev/okta-node-passport-oidc-example).
---

Building local or social login in Node can be simple with Passport.js. There are over 500 strategies already built that make it easy to wire up identity providers. But what do you do if your identity provider doesn't already have a pre-built strategy? Do you have to build all that stuff yourself? Absolutely not! You can use generic strategies for Passport.js that make it easy to use your provider of choice without writing all the plumbing yourself. In this tutorial, we'll walk through how to use my identity provider of choice (Okta) with the generic `passport-openidconnect` package to build secure Node authentication and user management!

Before we get started, let me tell you what Okta is and why I think Okta is a no-brainer choice for your next Node project.

{% include toc.md %}

## What is Okta?

Okta is a cloud service that allows developers to create, edit, and securely store user accounts and user account data and connect them with multiple applications. Our API enables you to:

* [Authenticate](https://developer.okta.com/docs/concepts/authentication/) and [authorize](https://developer.okta.com/books/api-security/authz/) your users
* Store data about your users
* Perform password-based and [social login](https://developer.okta.com/docs/guides/social-login/)
* Secure your application with [multi-factor authentication](https://developer.okta.com/docs/guides/mfa/ga/main/)
* And much more! Check out our [product documentation](https://developer.okta.com)

In short: we make [user account management](https://developer.okta.com/product/user-management/) a lot easier, more secure, and more scalable than what you're probably used to.

Sound amazing? [Register for a free developer account](https://developer.okta.com/signup/), and when you're done, come on back so we can learn more about building secure authentication in Node.

Now, let's dive in!

**Prerequisites**

This tutorial uses the following technologies but doesn't require any prior experience:
- [Node.js](https://nodejs.org/en/)
- [Okta CLI](https://cli.okta.com/)

If you'd like to skip the tutorial and just check out the fully built project, you can go [view it on GitHub](https://github.com/oktadev/okta-node-passport-oidc-example).

## Use Express to Scaffold the Base Node Authentication Project

Start by installing the [Express application generator](https://expressjs.com/en/starter/generator.html) if you don't already have it installed.

```bash
npm install express-generator -g
```

Then use the `express` command to scaffold a base Node and Express application.

```bash
express -e --git okta-node-passport-oidc-example
```

The generator will quickly create a new app in the **passport-oidc-example** folder. It uses the Embedded JavaScript syntax for the view templates and will generate a base **.gitignore** file. There will be instructions at the bottom of the output telling you how to proceed.

```bash
change directory:
  $ cd okta-node-passport-oidc-example

install dependencies:
  $ npm install

run the app:
  $ DEBUG=okta-node-passport-oidc-example:* npm start
```

Go ahead and change into the new directory and install the dependencies. I use [Visual Studio Code](https://code.visualstudio.com/) for my Node development which has excellent support for writing and debugging Node applications. It works on all platforms and is completely free. Running the application with a debugger attached is as easy as hitting the `F5` key!

Once VS Code is installed, you can open the project from the command line using the `code` command.

```bash
code .
```

Now, run the app by hitting the `F5` key, and it will start the Node debugger in the output window. Open a browser to http://localhost:3000 and make sure your base application is running.

{% img blog/node-passport/express-app-init.png alt:"The initial application running." width:"800" %}{: .center-image }

## Add Passport.js to the Node Application

First of all, you'll need to install these three npm packages:

* passport
* passport-openidconnect
* express-session

```bash
npm install passport@0.5.2 passport-openidconnect@0.1.1 express-session@1.17.2
```

Once those are installed, open the `app.js` file in the root folder of the application and add these three dependencies to the requirements so that the top section of the file looks like this:

```js
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var session = require('express-session');
var passport = require('passport');
var { Strategy } = require('passport-openidconnect');
```

## Configure Express to Use Passport.js

Passport relies on `express-session` to store the user information once the user has logged in. To configure it, right below the line that reads:

```js
app.use(express.static(path.join(__dirname, 'public')));
```

add the following configuration.

```js
app.use(session({
  secret: 'MyVoiceIsMyPassportVerifyMe',
  resave: false,
  saveUninitialized: true
}));
```

Below that, add the following configuration that tells Express to use Passport for sessions.

```js
app.use(passport.initialize());
app.use(passport.session());
```

## Create an Okta Application to Support Node Authentication

 {% include setup/cli.md type="web" loginRedirectUri="http://localhost:3000/authorization-code/callback" logoutRedirectUri="http://localhost:3000/" %}


## Configure Passport.js for OpenID Connect

Now you'll configure Passport.js to use Okta as your Identity Provider (IdP). To do this, tell passport to use the `Strategy` created in the requirements, right below the Passport.js configuration from the last section.

```js
// set up passport
passport.use('oidc', new Strategy({
  issuer: '{OKTA_OAUTH2_ISSUER}',
  authorizationURL: 'https://{OKTA_DOMAIN}/oauth2/default/v1/authorize',
  tokenURL: 'https://{OKTA_DOMAIN}/oauth2/default/v1/token',
  userInfoURL: 'https://{OKTA_DOMAIN}/oauth2/default/v1/userinfo',
  clientID: '{OKTA_OAUTH2_CLIENT_ID}',
  clientSecret: '{OKTA_OAUTH2_CLIENT_SECRET}',
  callbackURL: 'http://localhost:3000/authorization-code/callback',
  scope: 'openid profile'
}, (issuer, profile, done) => {
  return done(null, profile);
}));
```

Be sure to replace the placeholder variables with your actual Okta information.

- Replace `{OKTA_OAUTH2_ISSUER}` with your Org's OAuth2 Issuer URL.
- Replace `{OKTA_OAUTH2_CLIENT_ID}` with the Client ID of your application.
- Replace `{OKTA_OAUTH2_CLIENT_SECRET}` with the Client secret of your application.
- Replace `{OKTA_DOMAIN}` with your Org's Okta domain. It is the same as your OAuth2 Issuer URL without the `https://` and `/oauth2/default` segments.

The code above sets the name of the strategy as 'oidc' and set all the URLs that the strategy needs to know to pull off the authorization code flow for OpenID Connect. 

The last argument is a function that pushes the profile object returned from the authentication call into `req.user` so that you can use it in the route handlers. You could manipulate the object you pass in to have other information or save/update the user in your database.

You'll also need to tell Passport.js how to serialize the user information into a session. To do this, you'll add the following methods right below the configuration you just set up.

```js
passport.serializeUser((user, next) => {
  next(null, user);
});

passport.deserializeUser((obj, next) => {
  next(null, obj);
});
```

## Call Passport.js

The last thing that Passport.js needs is two endpoints in your application: one that kicks off the login flow and one that handles the callback from the OpenID Connect provider. You can put these two routes below the `app.use()` method for the index and user routers.

```js
app.use('/login', passport.authenticate('oidc'));

app.use('/authorization-code/callback',
  passport.authenticate('oidc', { failureRedirect: '/error' }),
  (req, res) => {
    res.redirect('/profile');
  }
);
```

Now you could run this application and navigate to the login route, and it would take you through the login flow and back to your homepage. But there's nothing that gives visual proof that the login succeeded and a user object available on the request parameter.

To do that, create a profile page that shows the logged-in user's name. Start by adding the profile route to your `app.js` file.

```js
app.use('/profile', (req, res) => {
  res.render('profile', { title: 'Express', user: req.user });
});
```

Then in the **views** folder, add a **profile.ejs** file.

```html
<!DOCTYPE html>
<html>
  <head>
    <title><%= title %></title>
    <link rel='stylesheet' href='/stylesheets/style.css' />
  </head>
  <body>
    <h1><%= title %></h1>
    <p>Welcome <%= user.displayName %>!</p>
  </body>
</html>
```

Then, to make things a bit easier, add a login link to the home page (`index.ejs` file).

```html
<!DOCTYPE html>
<html>
  <head>
    <title><%= title %></title>
    <link rel='stylesheet' href='/stylesheets/style.css' />
  </head>
  <body>
    <h1><%= title %></h1>
    <p>Welcome to <%= title %></p>
    <a href="/login">Log In</a>
  </body>
</html>
```

When you run the application, you can click the **Log In** link, start the login flow, and see the profile page with the user's name displayed!

There is still a problem with the application. Anyone could go to the profile route and cause an error to happen. If there is no user in the request session, there is nothing to pass and nothing to display in the view.

Add the following middleware function to `app.js` to ensure that only logged-in users can get to the profile page.

```js
function ensureLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }

  res.redirect('/login')
}
```

This function checks the request's `isAuthenticated()` method and passes the request on to the next handler if the user is logged in. If not, it redirects the user to the login page and kicks off the login process.

Now add that middleware to the routes you need to be protected. In this case, just the profile route for now.

```js
app.use('/profile', ensureLoggedIn, (req, res) => {
  res.render('profile', { title: 'Express', user: req.user });
});
```

Now, if you manually try to go to the profile page, you will be routed to the login flow and then back to the profile page once you're logged in. But there is still something missing.

## Log Out of the Passport.js Session

The last thing we need to implement is killing the login session and redirecting the user back to the homepage. First, create a route to handle the logout route. Right below the authorization callback route, add a new route.

```js
app.get('/logout', (req, res) => {
  req.logout();
  req.session.destroy();
  res.redirect('/');
});
```

It's just that simple. This route handler calls the `logout()` method on the incoming request, destroys the session, and redirects the user to the homepage.

That's all the basics of getting Passport.js to handle an OpenID Connect authentication provider that doesn't already have a specific strategy in the Passport.js library! You can find the source code for the example created in this tutorial [on GitHub](https://github.com/oktadev/okta-node-passport-oidc-example).

## Learn More About Node, Authentication, and Okta

Can't get enough of Node? Check out our [quickstarts for Node](https://developer.okta.com/code/nodejs/) and other excellent posts from the Okta Developer blog, like our post on [simple Node authentication](https://developer.okta.com/blog/2018/04/24/simple-node-authentication), and my post on [user registration with Node and React](https://developer.okta.com/blog/2018/02/06/build-user-registration-with-node-react-and-okta).

As always, feel free to ping us on Twitter [@oktadev](https://twitter.com/oktadev) or leave comments below, and don't forget to check out our [YouTube channel](https://www.youtube.com/channel/UC5AMiWqFVFxF1q9Ya1FuZ_Q)!
