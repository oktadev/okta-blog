---
disqus_thread_id: 6300284588
discourse_topic_id: 16766
discourse_comment_url: https://devforum.okta.com/t/16766
layout: blog_post
title: "Use OpenID Connect to Build a Simple Node.js Website"
author: randall-degges
by: advocate
communities: [javascript]
description: "In this article you'll learn how to use OpenID Connect to build a simple Node.js website with Express.js. You'll also learn how to log users into your website using Okta."
tags: [javascript, oidc, openid, nodejs, expressjs]
tweets:
    - "Learn how to use OpenID Connect to build a simple Node website 🛠"
    - "Come see how to build a simple Node website using OpenID Connect!"
type: conversion
image: blog/use-openid-connect-to-build-a-simple-node-website/openid-node-social.jpg
github: https://github.com/oktadev/okta-express-example
changelog:
  - 2022-01-20: Updated dependencies, code, and the cover image. See this post's changes in [okta-blog#1043](https://github.com/oktadev/okta-blog/pull/1043) and the example app changes in [okta-express-example#3](https://github.com/oktadev/okta-express-example/pull/3).
---


If you've ever spent time trying to figure out the best way to handle user
authentication for your Node app and been confused: you're not alone. Over the
last few years, authentication practices have changed quite a bit.

Today I'm going to show you how to use OpenID Connect to build an extremely
simple Node.js website (using Express.js) that allows you to manage your users,
log them in, and log them out.

Websites used to require users to register with a
username/password and log in with those same credentials. This method was simple but
caused many security problems because developers would need to write the
code to authenticate the user directly, store their credentials, manage their
data, etc. It also required developers to build custom authorization schemes to track what permissions their users had to perform certain
operations.

A while later, OAuth came into fashion with a new idea: let a user have one
account with a large OAuth provider (Google, Facebook, etc.) and allow users to log in to your service via their OAuth account with that provider. This method had some excellent
benefits: developers no longer needed to worry about storing passwords and managing
credentials. The downside was that OAuth is a flexible protocol and doesn't lay
out rules around authorization, data management, etc. This means that developers
using pure OAuth must write a lot of custom security code themselves,
which causes problems.

Then, [OpenID Connect](http://openid.net/connect/) (OIDC) has
come onto the scene. It's a protocol built on top of OAuth that provides
everything you could ever want: simplified user authentication, simplified
authorization, and lots of nice management to tie them all together. OIDC has
been gaining popularity in the development community.

Without further ado, let's build something together! I'll show you how to
use the [oidc-middleware](https://www.npmjs.com/package/@okta/oidc-middleware#customizing-routes) package to make adding user authentication and authorization to your Node
apps simple.

{% include toc.md %}

**Prerequisites**

This tutorial uses the following technologies but doesn't require any prior experience:
- [Node.js](https://nodejs.org/en/)
- [Okta CLI](https://cli.okta.com/)


## Initialize authentication with Okta

Dealing with user authentication in web apps can be a massive pain for every developer. This is where Okta shines: it helps you secure your web applications with minimal effort. 

{% include setup/cli.md type="web" loginRedirectUri="http://localhost:3000/authorization-code/callback" logoutRedirectUri="http://localhost:3000/" %}

**NOTE**: If you'd like to skip the following sections and get straight into the
code, you can visit the [GitHub
repo](https://github.com/oktadeveloper/okta-express-example) for this
application directly.


## Build the Express.js App

Next, you'll build a simple Express.js app without any 
login capabilities. It will be straightforward (but that's the point!).

### Create the Application Skeleton

Create a new folder somewhere on your computer and enter it to get started.
Then create a `server.js` file and insert the following code:

```javascript
"use strict";

const express = require("express");

let app = express();

// App settings
app.set("view engine", "pug");

// App middleware
app.use("/static", express.static("static"));

// App routes
app.get("/", (req, res) => {
  res.render("index");
});

app.get("/dashboard", (req, res) => {
  res.render("dashboard");
});

app.get("/logout", (req, res) => {
  res.redirect("/");
});

app.listen(3000);
```

This is a basic Express.js application:

- It creates an Express application
- It configures Express to serve static files (CSS, images, etc.)
- It contains three routes: a home page route, a dashboard route, and a logout
  route. The home page route shows an HTML template (that we'll create in
  a moment). The dashboard route shows a dashboard template. And the logout
  route redirects the user back to the home page.
- On the very last line of the file, Express will start up a local web server on
  port 3000 so you can view the website locally.

Next, you'll need to create a new directory called `views`, and inside it,
create a `base.pug` template with the following contents:

```jade
doctype html
html(lang="en")
  head
    meta(charset="utf-8")
    meta(name="viewport", content="width=device-width, initial-scale=1, shrink-to-fit=no")

    link(rel="stylesheet", href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css", integrity="sha384-1BmE4kWBq78iYhFldvKuhfTAU6auU8tT94WrHftjDbrCEXSU1oBoqyl2QvZ6jIW3", crossorigin="anonymous")
    link(rel="stylesheet", href="/static/css/style.css")

  body
    .container
      block body

    script(src="https://code.jquery.com/jquery-3.6.0.slim.min.js", integrity="sha256-u7e5khyithlIdTpu22PHhENmPcRdFiHRjhAuHcs05RI=", crossorigin="anonymous")
    script(src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js", integrity="sha384-ka7Sk0Gln4gmtz2MlQnikT1wXgYsOg+OMhuP+IlRH9sENBO0LRn5q+8nbTov4+1p", crossorigin="anonymous")
```

This is a simple [pug](https://pugjs.org/api/getting-started.html) template that
contains nothing more than some very basic HTML formatting, and
[Bootstrap](http://getbootstrap.com/). If you aren't already familiar with pug,
you may want to read through this [excellent beginner's
tutorial](https://www.sitepoint.com/jade-tutorial-for-beginners/).

**NOTE**: pug used to be named `jade`. This is useful to know if you're looking
for resources online.

Next, you'll want to create the HTML template that renders the site's home page. Create the file `views/index.pug` and include the following code:

```jade
extends base.pug

block body
  h1.text-center Welcome to the Example App!

  .jumbotron
    p.
      Thanks for checking out this super simple Okta sample app.  If you login
      below, you'll be taken to an admin panel that is only accessible for
      authenticated users.

    p.
      Please #[a(href="/login") login] to continue.
```

This is your basic home page template.

Now, let's create a dashboard page. This page will be what the user sees after
logging into the website. Create the file `views/dashboard.pug` and include the
following:

```jade
extends base.pug

block body
  h1.text-center User Dashboard

  .jumbotron
    ul
      li Your Email Address is: #{user.preferred_username}
      li Your First Name is: #{user.given_name}
      li Your Last Name is: #{user.family_name}

    p.
      If you'd like to logout, please #[a(href="/logout") click here].
```

Next, let's add a bit of CSS to make things look nice. Create a new folder to store your static assets (CSS, images, etc.):

```console
mkdir -p static/css
```

Now create the file `static/css/style.css` and include the following:

```css
h1 {
  margin-top: 2em;
}

.jumbotron {
  margin-top: 2em;
  padding: 2rem 1rem;
  margin-bottom: 2rem;
  background-color: #e9ecef;
  border-radius: .3rem;
}
```

Now, if you want to run this simple website, you can do so by installing the
required dependencies, then starting up your Node server on the command line:

```console
npm install express@4 pug@3
node server.js
```

Once the server is running, you can view the site by visiting
`http://localhost:3000` in your browser.

Remember how I said this would be a simple website? I wasn't lying! Here's what
your new website's homepage will look like:

{% img blog/use-openid-connect-to-build-a-simple-node-website/app-home.png alt:"Application Homepage" width:"700" %}{: .center-image }

By now, you should have a working website with no authentication. So let's take
it one step further in the next section and add OIDC.

### Add OpenID Connect to Your Website

To get started, you'll need to install two new Node.js libraries:

- [express-session](https://github.com/expressjs/session), which will manage user
sessions for your website
- [oidc-middleware](https://github.com/okta/okta-oidc-middleware), which will handle all
of the OIDC implementation details for your website

To install these libraries, run the following command:

```console
npm install express-session@1 @okta/oidc-middleware@4
```

Next, you'll need to import these libraries in your `server.js` from before:

```javascript
const express = require("express");
const session = require("express-session");
const { ExpressOIDC } = require("@okta/oidc-middleware");
```

Now that the libraries have been imported, you can initialize the session
middleware and the OIDC middleware:

```javascript
// App middleware
app.use("/static", express.static("static"));

app.use(session({
  cookie: { httpOnly: true },
  secret: "can you look the other way while I type this"
}));

let oidc = new ExpressOIDC({
  issuer: "https://{yourOktaDomain}/oauth2/default",
  client_id: "{clientId}",
  client_secret: "{clientSecret}",
  appBaseUrl: "http://localhost:3000",
  routes: {
    loginCallback: {
      afterCallback: "/dashboard"
    }
  },
  scope: 'openid profile'
});
```

The session middleware contains a number [of
options](https://github.com/expressjs/session), but the only ones we'll need for
now are the following two:

- `cookie.httponly`: this option tells the browser that JavaScript code should
  not be allowed to access the session data. JavaScript on clients is a
  dangerous thing. Ensuring your cookies that contain identity information are
  safe is always of utmost importance.
- `secret`: this option should be a long random string you create. It
  should be the same across all your webservers but never shared publicly or
  stored in a public place. This value is used to ensure your user's identity
  information is protected cryptographically inside of cookies.

The OIDC middleware also contains a number [of
options](https://www.npmjs.com/package/@okta/oidc-middleware#new-expressoidcconfig).
I'll walk you through them briefly:

- `issuer`: this should be your Org URL value (that you wrote down earlier) with
  `/oauth2/default` appended. This is the OAuth2 endpoint that's used for
  handling authorization.
- `client_id/client_secret`: these values are what you wrote down earlier after
  creating your Okta Application.
- `appBaseUrl`: the base scheme, host, and port (if not 80/443) of your app, not including any path (e.g. http://localhost:3000, not http://localhost:3000/ )
- `routes.loginCallback.afterCallback`: this option tells Okta where to redirect a
  user once they've been signed into your website. In this case, you'll want to
  redirect them to the dashboard page.
- `scope`: the OpenID Connect protocol has a lot of standard scopes that
  determine what data about your user is returned to you once the user has been
  signed in. The values here provide basic user information for your website. To
  view a complete list of available scopes, check out [this
  page](/docs/api/resources/oidc#scope-dependent-claims-not-always-returned).

Now that you've configured OIDC for your website, it's time to hook up the
routes:


```javascript
// App routes
app.use(oidc.router);

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/dashboard", oidc.ensureAuthenticated(), (req, res) => {
  console.log(req.userContext.userinfo);
  res.render("dashboard", { user: req.userContext.userinfo });
});

app.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/");
});
```

The first thing that's happening above is that you're using the built-in OIDC
routes that ship with the oidc-middleware library. This library provides routes
to handle authenticating the user correctly (behind the scenes) and many
other things. I'll show you how these work soon.

You'll also notice that your dashboard route is now using a new Node.js
middleware: `oidc.ensureAuthenticated()`. This middleware will do the following:

- If a user tries to visit `/dashboard` and is not logged in, they will be
  redirected to Okta to log in before being allowed to visit the page
- If a user tries to visit `/dashboard` and they *are* logged in, they will be
  allowed to view the page with no problems

You'll also notice that you're now able to access
the logged-in user's personal information via `req.userContext.userinfo` inside the dashboard route. The
oidc-middleware library makes this object available to you whenever a user is
logged in. You'll notice that this object shows the following information:

```javascript
{ 
  sub: '00uc5nynm5RZivEun0h7',
  name: 'Randall Degges',
  locale: 'en-US',
  preferred_username: 'r@rdegges.com',
  given_name: 'Randall',
  family_name: 'Degges',
  zoneinfo: 'America/Los_Angeles',
  updated_at: 1507772025 
}
```

The data that's returned about each logged-in user can be modified by including
more (or fewer) scopes (as mentioned previously).

In the code above, you'll also notice an actual logout
implementation. The oidc-middleware library includes a new method
`req.logout()`, which wipes all session data and logs the user out of your
application.


### Modify the Server Start

Now that you've got your code in place, there's only one tiny piece of code left
to change: the code that starts your web server.

Usually, when your Node application starts running, via the `app.listen()`
method, the website is immediately online. However, now that you're using OIDC,
you don't want that behavior.

To set up the OIDC rules and policies, the oidc-middleware library
performs its setup routines asynchronously. If your site was to go
online immediately, it could cause errors when users try to view protected pages, etc.

To get around this, you'll want to modify your server start code like so:

```javascript
oidc.on("ready", () => {
  app.listen(3000);
});

oidc.on("error", err => {
  console.error(err);
});
```

By listening for the events that the oidc-middleware library provides, you can
safely start your Node server as soon as the OIDC setup has finished, thereby
solving any timing problems, you might have run into otherwise.


## Test It Out

Now that your application has been built, why not try it out? If you visit
`http://localhost:3000` and click through the prompts,
you'll see how everything fits together:

Once you click login, you'll be redirected to `/login` The oidc-middleware will
intercept that `/login` request, and redirect the user to Okta's hosted sign-in
page where they'll be prompted for their email address and password. The user
will then enter their credentials and log in. They will then be redirected back
to your local website, where the oidc-middleware library will again intercept
the request, create a session for the user, and log them in. Finally, they will
be redirected to the dashboard page (`/dashboard`), where your route code will
run and echo their basic information back to them.

Here's what each of the pages looks like in the flow:

{% img blog/use-openid-connect-to-build-a-simple-node-website/app-home.png alt:"Application Homepage" width:"700" %}{: .center-image }

Then, once you click "login", you'll be taken to the login page:

{% img blog/use-openid-connect-to-build-a-simple-node-website/app-login.png alt:"Application Login Page" width:"700" %}{: .center-image }

Finally, once you've logged in, you'll be taken to the dashboard page where you
can view your user information:

{% img blog/use-openid-connect-to-build-a-simple-node-website/app-dashboard.png alt:"Application Dashboard" width:"700" %}{: .center-image }


## Resources

Now that you've built your first Node.js site using OIDC to handle
authentication using our [oidc-middleware
library](https://github.com/okta/okta-oidc-middleware), you might want to learn more
about OIDC.

One of my good friends and co-workers [Micah
Silverman](https://twitter.com/afitnerd) recently published a three part primer
to OIDC which I strongly recommend you read if you're interested in learning
more about OIDC. You can [check it out
here](/blog/2017/07/25/oidc-primer-part-1).

You can also [follow me](https://twitter.com/rdegges) and
[Okta](https://twitter.com/oktadev) on Twitter to see more of what I'm working
on, and ask any auth-related questions you might have.
