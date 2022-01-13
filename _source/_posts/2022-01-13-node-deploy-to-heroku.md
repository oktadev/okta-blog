---
layout: blog_post
title: ""
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

## Introduction

Heroku is a platform as a service that supports many languages.  Initially, it was developed to support Ruby sites but now supports an array of languages including javascript with Node.js.  Heroku also has docker support so you can deploy just about anything to it.  

However, in this tutorial, you will learn how to build a small application using the `express` framework for Node.js.  You will then secure that application using Okta by creating an application in Okta for web applications and integrating the Okta OIDC middleware with your application.  Finally, you will learn how to deploy the application to Heroku, update your Okta application for your Heroku site, and how to set the environment variables for your app in Heroku.

To continue you will need:

- [Visual Studio Code](https://code.visualstudio.com/)
- [Node.Js](https://nodejs.org/en/)
- An [Okta Developer Account](https://developer.okta.com/) (free forever, to handle your OAuth needs)
- A [Heroku Account](https://signup.heroku.com/)
- A [Git Repository](https://git-scm.com/book/en/v2/Git-Basics-Getting-a-Git-Repository)

Of course, if you want to just see the code feel free [to view it on github](https://github.com/nickolasfisher/Okta_Heroku).

## Create your Okta Application

{% include setup/cli.md type="web" framework="node"
   loginRedirectUri="http://localhost:3000/authorization-code/callback" signup="false" %}

## Create your Express Application

Now it's time to turn your attention to writing your application.   YOu will quickly scaffold your application by using the `express application generator` with the npx command `npx express-generator`.  Open the folder where your application will live and run the command `npx express-generator`.  

### Install your Dependencies

Next, run the command to install the default dependencies from express-generator.

```console
npm i
```

Finally, you will need to install the custom dependencies as well.  

First, you will add `dotenv` to house your sensitive and environment-specific information.  

```console
npm dotenv@10.0.0
```

Next, you will want to add bootstrap.  YOu will use the bootstrap libraries in your `jade` templates once you begin writing the front end.  Bootstrap is a simple UI framework that has many samples to get you developing HTML pages quickly.

```console
npm bootstrap@5.1.3
```

You will need the `okta oidc-middleware` to help secure your application.  `express-session` is required when using the oidc-middleware so you will need to install that as well.

```console
npm install --save express-session
npm install --save @okta/oidc-middleware
```

### Write your Server Code

The express-generator package does a great job of scaffolding a simple Node.js application.  For this tutorial, you can leave most of the application the way it is.  You will need to make a few changes though.  

First, add a new file called .env to the root of your application and add the following values.  These values can be found in `.okta.env`.

```dotenv
OKTA_OAUTH2_ISSUER={yourOktaDomain}/oauth2/default
OKTA_OAUTH2_CLIENT_SECRET={yourClientSecret}
OKTA_OAUTH2_CLIENT_ID={yourClientId}
APP_BASEURL=http://localhost:3000
```

Next, open `app.js` and replace the code there with the following.

```javascript
require("dotenv").config();

var createError = require("http-errors");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");

const session = require("express-session");
const { ExpressOIDC } = require("@okta/oidc-middleware");

var app = express();

// session support is required to use ExpressOIDC
app.use(
  session({
    secret: "this should be secure",
    resave: true,
    saveUninitialized: false,
  })
);

const oidc = new ExpressOIDC({
  issuer: process.env.OKTA_OAUTH2_ISSUER,
  client_id: process.env.OKTA_OAUTH2_CLIENT_ID,
  client_secret: process.env.OKTA_OAUTH2_CLIENT_SECRET,
  appBaseUrl: process.env.APP_BASEURL,
  redirect_uri: `${process.env.APP_BASEURL}/authorization-code/callback`,
  scope: "openid profile",
});

// ExpressOIDC attaches handlers for the /login and /authorization-code/callback routes
app.use(oidc.router);

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "jade");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use(express.static(__dirname + "/node_modules/bootstrap/dist"));

app.use("/", indexRouter);
app.use("/users", usersRouter.userRoutes({ oidc: oidc }));

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

module.exports = app;
```

Most of this code is boilerplate from the express-generator but the notable addition is the configuration for the Okta oidc.  First, you need to enable `dotenv` at the top of this file.  Next, you configure the `express-session` and add it to your application.  Finally, you can configure your Okta oidc middleware using the variables from `.env`.   

Next, open your `routes/index.js` file and replace the code with the following.

```javascript
var express = require("express");
var router = express.Router();

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { loggedIn: req.isAuthenticated() });
});

module.exports = router;
```

Here are you added a property for the `index.jade` template to use called `loggedIn`.  This property will help the view decide if it should display a `login` or `logout` button.  The rest of the home page will be static so there is no need for a more sophisticated model.

Finally, open your `routes/users.js` file and replace the code there with the code below.

```javascript
var express = require("express");
var router = express.Router();

function userRoutes(options) {
  const oidc = options.oidc;

  router.get("/", oidc.ensureAuthenticated(), function (req, res, next) {
    res.render("users/index", {
      loggedIn: true,
      title: "Express",
      user: req.userContext.userinfo,
    });
  });

  return router;
}

module.exports.userRoutes = userRoutes;
```

This file is where the magic from the Okta oidc middleware shines.  In your route definition, you are passing in the `oidc.ensureAuthenticated` middleware.  This function will reroute unauthenticated users to the login route you defined in your `app.js` file.  Because you didn't explicitly set this parameter it will direct the user to `/login` and trigger the authentication flow.  The model is passed to the view here also contains some information about the user that you will display to the user when they land on this page.  

### Write some Client Code

Now you can write some client code.  By default, the express-generator sets up some views using `jade`.  Jade is a templating engine for Node.js.  The language incorporates some conditionals and flow controls to make templating HTML from your model easier.  The syntax is fairly simple to learn and there are many HTML to jade converters out there.

Open the `layout.jade` file that was generated with your project and replace the code with the following.

```jade
doctype html
html
  head
    title= title
    link(rel='stylesheet' href='/stylesheets/style.css')
    link(rel='stylesheet' href='css/bootstrap.min.css')
    script(language='javascript' src='js/bootstrap.min.js')

  body
    .container
      header.d-flex.flex-wrap.justify-content-center.py-3.mb-4.border-bottom
        h5.d-flex.align-items-center.mb-3.mb-md-0.me-md-auto.text-dark.text-decoration-none 
          a(href="/") Home
        ul.nav.nav-pills
          if loggedIn
            li.nav-item 
              a(href="users").nav-link Profile
          li.nav-item
            if loggedIn
              form(action="logout" method="post")
                button(type="submit").nav-link.active Logout
            else 
              a(href="Users").nav-link.active Login

      block content
```

As you can see the HTML elements are used, the classes are chained with a `.` between them, and attributes are bounded by parentheses.  This simple layout takes the `loggedIn` value from the server and determines if it should display a `login` or `logout` button.  It also conditionally shows a tab for the `Profile` page if the user is logged in. 

You can add the profile page by creating a new folder called `users` in your `views` folder and adding a new file called `index.jade`.  Add the following code to it.

```jade
extends ../layout

block content
  h1 Welcome #{user.name}
  P locale: #{user.locale}
  p UserName: #{user.preferred_username}
```

The page here displays the user information that was retrieved from Okta when the user logged in.

Finally, replace the code in `views/index.jade` with the following.

```jade
extends layout

block content

  .container-fluid.py-5.bg-dark.text-white-50
    h1.display-5.fw-bold  Deploy a Node.JS Application to Heroku
    p.col-md-8.fs-4
        | A tutorial on how to deploy a 
        a(href="https://nodejs.org/en/" target="_blank") node.js 
        | application to 
        a(href="https://dashboard.heroku.com/apps"  target="_blank") Heroku
        | .  Secured by 
        a(href="https://www.okta.com/"  target="_blank") Okta
        | .  Written by 
        a(href="https://profile.fishbowlllc.com/"  target="_blank") Nik Fisher.
  p
    | This repository shows you how to use Okta in a Node.js application and how to deploy the application to Heroku. Please read 
    a(href='https://developer.okta.com/blog/2021/xyz') Deploy a NodeJs application to Heroku
    |  to see how it was created.
  p
    strong Prerequisites:
  ul
    li
      a(href='https://nodejs.org/en/') Node.js
    li
      a(href='https://signup.heroku.com/') Heroku Account
    li
      a(href='') A github repository
    li
      a(href='https://cli.okta.com') Okta CLI
  blockquote
    p
      a(href='https://developer.okta.com/') Okta
      |  has Authentication and User Management APIs that reduce development time with instant-on, scalable user infrastructure. Okta's intuitive API and expert support make it easy for developers to authenticate, manage and secure users and roles in any application.
  ul
    li
      a(href='#getting-started') Getting Started
    li
      a(href='#links') Links
    li
      a(href='#help') Help
    li
      a(href='#license') License
  h2#getting-started Getting Started
  p To run this example locally, run the following commands:
  pre.
  h3#create-an-oidc-application-in-okta Create an OIDC Application in Okta
  p
    | Create a free developer account with the following command using the 
    a(href='https://cli.okta.com') Okta CLI
    | :
  pre.
  p
    | If you already have a developer account, use 
    code okta login
    |  to integrate it with the Okta CLI.
  p
    | Provide the required information. Once you register, create a client application in Okta with the following command:
  pre.
  p You will be prompted to select the following options:
  ul
    li
      | Type of Application: 
      strong 1: Web
    li
      | Framework of Application: 
      strong Other
    li
      | Redirect URI: 
      code https://localhost:3000/authorization-code/callback
    li
      | Post Logout Redirect URI: 
      code https://localhost:3000
  p
    | The application configuration will be printed to 
    code .okta.env
    | .
  pre.
  p Create a new file in your project folder called .env.  Copy the values to there
  pre.
  p
    | Use 
    code npm run start
    |  to run the application.
  h3#publish-to-heroku Publish to Heroku
  p Push the code to your GitHub repository.  
  p
    | Navigate to your 
    a(href='https://dashboard.heroku.com/apps') Heroku dashboard
    | .
  p
    | Click on 
    strong New
    |  and then 
    strong Create new app
  p
    | Give you app a distinct name and then click 
    strong Create app
  p
    | In the app page, under 
    em Deploy
    | , select 
    em Deployment Method
    strong Github
  p Connect your github account to Heroku.
  p
    | Click 
    strong Enable Automatic Deploys
  p
    | Click 
    strong Deploy Branch
    |  under 
    em Manual Deploy
    |  for your first time deploy
  p
    | Under the 
    em Settings
    |  tab, find the 
    em Domains
    |  section.  Make note of your domain here.
  p
    | Under 
    em Config Vars
    |  click 
    strong Reveal Config Vars
    |  and add the values for 
    code APP_BASEURL
    | , which will be the URL you just noted.
  p
    code OKTA_OAUTH2_CLIENT_ID
    |  = {yourClientId}
    code OKTA_OAUTH2_CLIENT_SECRET
    |  = {yourClientSecret}
    code OKTA_OAUTH2_ISSUER
    |  = {yourOktaDomain}/oauth2/default
  h3#finish-okta-setup Finish Okta Setup
  p Navigate back to your Okta dashboard
  p
    | Find the application you created for this project and click 
    strong Edit
    |  under 
    em General Settings
  p
    | Under 
    em Login
    | , find the setting for 
    em Sign-in redirect URIs
    |  and add the value for your app's base domain + 
    code /authorization-code/callback
    | .  For example, mine looks like this:  
    code https://okta-heroku-webapp-nfisher.herokuapp.com/authorization-code/callback
  p
    | Under signout redirect, add a value for your applications domain.  Again, mine looks like this:  
    code https://okta-heroku-webapp-nfisher.herokuapp.com
  p
    | Navigate to your application, you should see the home page.  Try to login and see your profile then log out.
  h2#links Links
  p This example uses the following open source libraries from Okta:
  ul
    li
      a(href='https://developer.okta.com/code/nodejs/') Okta with NodeJs
    li
      a(href='https://www.npmjs.com/package/@okta/oidc-middleware') Okta OIDC Middleware
    li
      a(href='https://github.com/okta/okta-cli') Okta CLI
  h2#help Help
  p
    | Please post any questions as comments on the 
    a(href='https://developer.okta.com/blog/2021/xyz') blog post
    | , or visit our 
    a(href='https://devforum.okta.com/') Okta Developer Forums
    | .
  h2#license License
  p
    | Apache 2.0, see 
    a(href='LICENSE') LICENSE
    | .
```

As mentioned before, this is static page will a ReadMe on how to deploy this application to Heroku.  And that's your next step, deploying the application.  But before you move on to that, run the command `npm run start` and navigate to `localhost:3000` to view your application and ensure it is working locally.

{% img
blog/node-deploy-to-heroku/HomePage.PNG
alt:"You Home Page"
width:"100%" %}

## Deploy to Heroku

First, make sure all your code is running and checked into your GitHub repository.  Next, navigate to your [Heroku Dashboard](https://dashboard.heroku.com/apps).  If this is your first time using Heroku you shouldn't have any apps configured yet.  Click on **New** and then **Create New App**.  Name your app `okta-heroku-webapp-{yourUserName}` or another unique name you feel is appropriate.  Press **Create App**.

On the application page for your newly created application find the *Deployment Method* section on the *Deploy* tab.  Click on **GitHub** and connect your Heroku account to your GitHub account.  

Next, in the *Connect to GitHub* section, find the repository you created for this tutorial and press **Connect**.  

{% img
blog/node-deploy-to-heroku/Connect to Github.PNG
alt:"Connect Heroku to Github"
width:"100%" %}

You can enable automatic deploys under *Automatic deploys*.  You can also configure this to wait for CI to pass before the application is deployed.  Then you can configure the CI from your GitHub account.  This step isn't strictly necessary for this tutorial but it is nice to see how this fits into the CI pipeline.

{% img
blog/node-deploy-to-heroku/Enable Automatic Deploys.PNG
alt:"Enable Automatic Deploys"
width:"100%" %}

Finally, under *Manual Deploy* choose the branch you wish to deploy and click **Deploy Branch**.  Wait a moment and you should receive a message from Heroku saying `Your app was successfully deployed.`  

Click the view button to be taken to your application.  At this point, your application won't be running because it isn't configured correctly.  Make note of the URL of your site and makes a few changes.

### Configure your Environment Variables

In your Heroku application click on **Settings**.  Find the section named `Config Vars` and click on **Reveal Config Vars**.  Here you will add the same key and value pairs from your `.env` file you used locally.  You can see mine below with the values blurred out.

{% img
blog/node-deploy-to-heroku/configure environment variables.PNG
alt:"Configure your Environment Variables"
width:"100%" %}

### Configure your Okta Application

Next, you will need to configure your Okta application to accept the new URL from Heroku.  Navigate to your application in the Okta admin dashboard and find the *General Settings* tab.  Click **Edit**.  Under the *Login* section add a value for *Sign-in redirect URIs* that matches your URI from your development settings, but replace *localhost:3000* with the URL from your Heroku application.  For example, my URI would be `https://okta-heroku-webapp-nfisher.herokuapp.com/authorization-code/callback`.  

Next, add a similar value for your *Sign-out redirects URIs* that should just be your application's home page from Heroku.  

Now return to your application.  You should be able to log in and see your application running as expected.

## Conclusions

Heroku is a great way to quickly and easily (and free, to start) deploy a quick application that slides into your existing CI process.  Together with Express and Okta you can quickly build secure web applications and deploy them to a modern platform.

In this tutorial, you learned how to build an express application with the express-generator toolchain.  You then secured that application with Okta.  Next, you learned how to create an application on Heroku, connect it to your GitHub repository and deploy your application from GitHub to Heroku.  Finally, you learned how to configure Heroku and Okta to work with each other.  

## Learn More

[Node.js Login with Express and OIDC](https://developer.okta.com/blog/2020/06/16/nodejs-login)

[Heroku + Docker with Secure React in 10 Minutes](https://developer.okta.com/blog/2020/06/24/heroku-docker-react)

[Deploy a Secure Spring Boot App to Heroku](https://developer.okta.com/blog/2020/08/31/spring-boot-heroku)