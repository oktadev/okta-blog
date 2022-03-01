---
layout: blog_post
title: Build a Basic Shopping App with Node.js and MinIO
author: deepa-mahalingam
by: internal-contributor
communities: [javascript]
description: "A tutorial that shows you how to build a basic shopping app with Node.js and MinIO."
tags: [sign-in-widget, okta, node, minio]
type: conversion
image: blog/shopping-app-with-node-minio/cover-image.jpg
github: https://github.com/oktadev/okta-express-minio-app-example
tweets:
- "Learn how to build a basic shopping app with @nodejs and @Minio 🍿"
---

Node.js has become the staple for e-commerce applications. Typically, e-commerce apps have many images and video assets managed in object storage. As the number of products in an online store increases, so does the size of the object storage. We'll build our Node.js application with a Kubernetes-friendly object storage service, [MinIO](https://min.io/), to scale with demand.  And we'll secure this application using the [Okta Sign-In Widget](https://github.com/okta/okta-signin-widget).

This tutorial will guide you through the code to build a simple Node.js shopping app with the Okta Sign-In Widget for authentication and a [MinIO Server](https://min.io/) to host the store's assets. We will use Express as our application framework and Handlebars as the view engine. The [MinIO Javascript Client SDK](https://docs.minio.io/docs/javascript-client-quickstart-guide) will fetch the application's image assets from the MinIO Server.

{% img
blog/shopping-app-with-node-minio/home.png
alt:"The example application"
width:"800" %}{: .center-image }


{% include toc.md %}

**Prerequisites**

This tutorial uses the following technologies but doesn't require any prior experience:

* [Node.js](https://nodejs.org/en/) v16.14.0
* [MinIO Client (mc)](https://docs.minio.io/docs/minio-client-quickstart-guide)
* [Minio Server](https://docs.min.io/)
* [Okta CLI](https://cli.okta.com/) v0.10.0

If you'd like to skip the tutorial and just check out the fully built project, you can go [view it on GitHub](https://github.com/oktadev/okta-express-minio-app-example).

## Scaffold your application
 
Create a new directory for your application and navigate into it.

```sh
mkdir okta-express-minio-app-example
cd okta-express-minio-app-example
```

Use the following command to create a `package.json` file for your app:

```sh
npm init -y
```

We need the `express` package for building our application, `express-handlebars` as the template engine, and `minio` for programmatically accessing object storage. We need the `@okta/okta-signin-widget` package for authenticating users. So that you can continue to build this shopping app beyond the basics after this tutorial, we've added `@okta/oidc-middleware` and `express-session`.

Run the following command to install these dependencies:

```sh
npm i express@4
npm i express-handlebars@6
npm i express-session@1
npm i minio@7
npm i @okta/oidc-middleware@4
npm i @okta/okta-signin-widget@5
```

## Set up authentication with Okta

Dealing with user authentication in web apps can be a massive pain for every developer. This is where Okta shines: it helps you secure your web applications with minimal effort. 

{% include setup/cli.md type="spa" loginRedirectUri="http://localhost:3000/callback" logoutRedirectUri="http://localhost:3000/" %}

Open the application that you just created in the Okta Admin Dashboard. In the *General Settings* section, click on the *Edit*. Check *Interaction Code* as the *Grant Type* and click on the *Save* button.

Configure the Okta tenant so that *Security* > *Profile Enrollment* > *Self-Service Registration* is enabled for your application.

{% img
blog/shopping-app-with-node-minio/SSPR.png
alt:"SSPR"
width:"800" %}{: .center-image }

Configure the Okta tenant so that *Security* > *Authenticators* > *Password* has a rule that allows for password unlock for your application.

{% img
blog/shopping-app-with-node-minio/Unlock.png
alt:"Unlock"
width:"800" %}{: .center-image }

Add a new folder called `public` in the project directory and inside it create a folder called `js`. Create a new file in the `js` folder named `okta-config.js`. Add the following code to it:

```js
const credentials = {
  domain: 'https://{yourOktaDomain}',
  clientId: '{clientId}'
};
```

**NOTE**: Make sure to replace the placeholder values with your actual Okta credentials.


## Setup MinIO object storage

There are three steps when setting up the assets. 

**Create the bucket on MinIO play server:** We've created a public MinIO server https://play.minio.io:9000 for developers to use as a sandbox. MinIO Client `mc` is  preconfigured to use the play server.  

[Make a bucket](https://docs.minio.io/docs/minio-client-complete-guide#mb) called `okta-commerce` on play.minio.io using the following command: 

```sh
mc mb play/okta-commerce
```

**Set up bucket policy on MinIO play server:** Store product image assets can be set to public readwrite. Use `mc policy` command to set the [access policy](https://docs.minio.io/docs/minio-client-complete-guide#policy) on this bucket to "both". 

```sh
mc policy set public play/okta-commerce
```

**Copy store's assets to MinIO bucket:** [Upload](https://docs.minio.io/docs/minio-client-complete-guide#cp) store product pictures into this bucket. You can use these pictures:

{% img
blog/shopping-app-with-node-minio/coffee-1.jpg
alt:"Sample Image 1"
width:"50%" %}{% img
blog/shopping-app-with-node-minio/coffee-2.jpg
alt:"Sample Image 2"
width:"50%" %}
{% img
blog/shopping-app-with-node-minio/coffee-3.jpg
alt:"Sample Image 3"
width:"50%" %}{% img
blog/shopping-app-with-node-minio/coffee-4.jpg
alt:"Sample Image 4"
width:"50%" %}

Use the `mc cp` command: 

```sh
mc cp ~/Downloads/coffee-1.jpg play/okta-commerce/
mc cp ~/Downloads/coffee-2.jpg play/okta-commerce/
mc cp ~/Downloads/coffee-3.jpg play/okta-commerce/
mc cp ~/Downloads/coffee-4.jpg play/okta-commerce/
```

**NOTE**: You might need to update the commands above depending on where you have downloaded the images.

## Build your application with Express

We need to create the Express server to run our application. Create a new file called `index.js` in the project root and add the following code to it:

```js
var express = require('express');
var app = express();
var session = require('express-session');
var assets = require('./services/minio-handler');

// Set up handlebars view engine
var handlebars = require('express-handlebars').create({
  defaultLayout: 'main'
});

app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

app.use(express.static(__dirname + '/public'));
app.use(session({
  secret: 'look the other way while I type this',
  resave: true,
  saveUninitialized: false
}));

// Routes for the app
app.get('/', function(req, res){
  const { userContext } = req;
  res.render('home', { url: assets, userContext });
});

app.get('/login', function(req, res){
  const { userContext } = req;
  res.render('login', { url: assets, userContext });
});

app.get('/logout', function(req, res){
  res.render('login', { url: assets });
});

app.get('/forgot-password', function(req, res){
  res.render('forgot-password', { url: assets });
});

app.get('/unlock', function(req, res){
  res.render('unlock', { url: assets });
});

app.get('/register', function(req, res){
  res.render('register', { url: assets });
});

app.get('/callback', function(req, res){
  // exchange code (req.query.code) for tokens
  res.render('home', { url: assets });
});

app.set('port', process.env.PORT || 3000);

// Start the app
app.listen(app.get('port'), function(){
  console.log('App started on http://localhost:' + app.get('port'));
  console.log('Press ctrl + c to terminate');
});
```

Here we have defined the different routes for the different functionalities of the app: home, login, logout, forgot password, unlock, register, and callback. 

You can add further functionality to the callback route to exchange code for tokens and store the details for the logged in users using `express-session`.


## Access MinIO assets programmatically

There are two steps in programmatically accessing your assets inside your JavaScript application. Create a new folder called `services` and add a new file called `minio-handler.js`. Add the following code to it:

```js
var Minio = require('minio');

// Instantiate a minioClient Object with an endPoint, port & keys.
// This minio server runs locally. 
var minioClient = new Minio.Client({
  endPoint: 'play.minio.io',
  port: 9000,
  accessKey: 'Q3AM3UQ867SPQQA43P2F',
  secretKey: 'zuf+tfteSlswRu7BJ86wekitnifILbZam1KYY3TG',
  useSSL: true
});
  
var minioBucket = 'okta-commerce'

var assets = [];
var objectsStream = minioClient.listObjects(minioBucket, '', true)
objectsStream.on('data', function(obj) {
  var publicUrl = minioClient.protocol + '//' + minioClient.host + ':' + minioClient.port + '/' + minioBucket + '/' + obj.name
  assets.push(publicUrl);
});
objectsStream.on('error', function(e) {
  console.log(e);
});
objectsStream.on('end', function(e) {
  return assets
});

module.exports = assets;
```

In the `services/minio-handler.js` file, we import `minio` and instantiate a `minioClient` object with the play server's endpoint, port and access keys. Access & Secret keys to the play server are open to public use.

We use the [listObjects]( https://docs.minio.io/docs/javascript-client-api-reference#listObjects) method to get a list of all the files from the minio-store bucket. `listObjects` returns product URLs which are pushed into an array called `assets`. We will export this array so that it can be imported into the different routes of the application defined in the `index.js` file.

**NOTE**: If you are running a MinIO server locally, add `secure: false,` to the code above.


## Create views for the application

Let us create the views for the different pages using handlebar templates. Create a folder called `views` in the project root. 

### Layout page

Add a folder called `layouts` and add a file named `main.handlebars` inside it:

{% raw %}
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <link rel="icon" href="/img/favicon.png" type="image/png">
    <link rel="shortcut icon" href="/img/favicon.ico" type="img/x-icon">

    <title>Okta MinIO Shopping Example</title>

    <!-- Bootstrap Core CSS -->
    <link href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.6/css/bootstrap.min.css" rel="stylesheet">
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/font-awesome/4.6.1/css/font-awesome.min.css">

    <!-- Latest CDN production Javascript and CSS -->
    <script src="https://global.oktacdn.com/okta-signin-widget/5.14.0/js/okta-sign-in.min.js" type="text/javascript"></script>
    <link href="https://global.oktacdn.com/okta-signin-widget/5.14.0/css/okta-sign-in.min.css" type="text/css" rel="stylesheet" />

    <script src="https://code.jquery.com/jquery-3.1.1.min.js"></script>
    <!-- Custom CSS -->
    <link href="css/miniostore.css" rel="stylesheet">
  </head>

  <body>
    <nav class="navbar navbar-default navbar-fixed-top" role="navigation">
      <div class="container">
        <div class="navbar-header">
          <button type="button" class="navbar-toggle" data-toggle="collapse" data-target="#bs-example-navbar-collapse-1">
            <span class="sr-only">Toggle navigation</span>
            <span class="icon-bar"></span>
            <span class="icon-bar"></span>
            <span class="icon-bar"></span>
          </button>
          <a class="navbar-brand" href="/">
            <i class="fa fa-tint fa-lg" style="color: #f14621;"></i>
          </a>
        </div>
        <div class="collapse navbar-collapse" id="bs-example-navbar-collapse-1">
          <ul class="nav navbar-nav">
            <li>
              <a href="/login"> Atko Store </a>
            </li>
            <li>
              {{#if userContext}}
                <form method="POST" action="/logout">
                  <button type="submit" class="btn btn-link nav-item nav-link" style="margin-top:6.5px; color:white;">Log Out</button>
                </form>
              {{else}}
                <a class="nav-item nav-link" href="/register">Register</a>
              {{/if}}
            </li>
            <li>
              <a class="nav-item nav-link" href="/forgot-password">Forgot Password</a>
            </li>
            <li>
              <a class="nav-item nav-link" href="/unlock">Unlock</a>
            </li>
          </ul>
        </div>
      </div>
      </div>
    </nav>
    <div class="container">
      <header class="jumbotron hero-spacer">
        <h1>Atko Coffee Store </h1>
        <p>Authenticate with Okta Sign-In Widget. Store your assets in a Minio Server or Amazon S3 and retrieve them inside your Node.js e-commerce application.</p>
      </header>
      <hr>
      {{{body}}}
      <hr>
  </body>
</html>
```
{% endraw %}

Here we have imported the Okta Sign-in Widget as well as Bootstrap for styling the content on our pages. We have also used conditional logic to check if the user has logged in and show the Login and Logout buttons accordingly.

In the `views` folder, create the following files:

### Home page

Create a file called `home.handlebars`and add the following code to it:

{% raw %}
```html
{{#if userContext}}
<h1 class="text-center">Hi {{userContext.userinfo.given_name}}!</h1>
<div class="d-flex justify-content-center"></div>
{{/if}}

<div class="row">
<div class="col-lg-12">
  <h3>Latest Products</h3>
</div>
</div>

<div class="row text-center">
{{#each url}}
  <div class="col-md-3 col-sm-6 hero-feature">
    <div class="thumbnail">
      <img src="{{this}}" max-height=200 max-width=200 alt="">
      <div class="caption">
        <h3>Product Name</h3>
        <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit.</p>
        <p>
          <a href="#" class="btn btn-primary">Buy Now!</a> <a href="#" class="btn btn-default">More Info</a>
        </p>
      </div>
    </div>
  </div>
{{/each}}
</div>
```
{% endraw %}

{% img
blog/shopping-app-with-node-minio/home.png
alt:"Home page"
width:"800" %}{: .center-image }

The app needs several entry points such as login, register, forgot-password and unlock. We will specify the configuration of the sign-in widget in each of these handlebars with the appropriate `flow:<entry point>` option. The `flow` config option is new in the sign-in widget and it's currently in beta.


### Login page

Create a file called `Login.handlebars`and add the following code to it:

{% raw %}
```html
{{#if userContext}}
<h1 class="text-center">Hi {{userContext.userinfo.given_name}}!</h1>
<div class="d-flex justify-content-center"></div>

<!-- Title -->
<div class="row">
  <div class="col-lg-12">
    <h3>Latest Products</h3>
  </div>
</div>
<!-- /.row -->

<!-- Page Features -->
<div class="row text-center">
  {{#each url}}
    <div class="col-md-3 col-sm-6 hero-feature">
      <div class="thumbnail">
        <img src="{{this}}" max-height=200 max-width=200 alt="">
        <div class="caption">
          <h3>Product Name</h3>
          <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit.</p>
          <p>
            <a href="#" class="btn btn-primary">Buy Now!</a> <a href="#" class="btn btn-default">More Info</a>
          </p>
        </div>
      </div>
    </div>
  {{/each}}

</div>
<!-- /.row -->
{{else}}

<h1 class="text-center">Please Log In</h1>
<div id="okta-login-container">
</div>
<script src="../js/okta-config.js"></script>
<script>
  signInWidgetConfig = {
    language: 'en',
    i18n: {
      'en': {
        'primaryauth.title': 'Sign In',
        'primaryauth.submit': 'Sign In',
      }
    },
    signOutLink: window.location.origin + '/logout',
    features: {
      registration: true,
      rememberMe: true,
      router: true,
    },
    baseUrl: window.location.origin,
    flow: 'login',
    el: '#okta-login-container',
    clientId: credentials.clientId,
    redirectUri: window.location.origin + '/callback',
    authParams: {
      issuer: credentials.domain + '/oauth2/default',
      responseType: ['code'],
      useInteractionCodeFlow: true,
      scopes: ['openid', 'email', 'profile'],
    },
  };
  var oSignIn = new OktaSignIn(signInWidgetConfig);
  oSignIn.showSignInAndRedirect({
    el: '#okta-login-container'
  }).catch(function(error) {
    alert('Catch unknown errors here which widget does not support');
  });
</script>
{{/if}}
```
{% endraw %}

The flow parameter is not needed for the login flow since its the default flow for the sign in widget.

{% img
blog/shopping-app-with-node-minio/login.png
alt:"Login page"
width:"800" %}{: .center-image }

### Register page

Create a file called `register.handlebars`and add the following code to it:

{% raw %}
```html
<h1 class="text-center">Please Register</h1>
<div id="okta-register-container">
</div>
<script src="../js/okta-config.js"></script>
<script>
  const signInWidgetConfig = {
    flow: 'signup',
    baseUrl: credentials.domain,
    useInteractionCodeFlow: true,
    clientId: credentials.clientId,
    redirectUri: window.location.origin + '/callback',
    authParams: {
      clientId: credentials.clientId,
      pkce: true,
    },
  };
  var fSignIn = new OktaSignIn(signInWidgetConfig);
  fSignIn.showSignInAndRedirect({
    el: '#okta-register-container'
  }).catch(function(error) {
    alert('Catch unknown errors here which widget does not support');
  });
</script>
```
{% endraw %}

Here, we specify `flow: 'signup'` to initialize the sign-in widget flows to start from the register or signup screens.

{% img
blog/shopping-app-with-node-minio/register.png
alt:"Register page"
width:"800" %}{: .center-image }

### Unlock page

Create a file called `unlock.handlebars`and add the following code to it:

{% raw %}
```html
<h1 class="text-center">Unlock Account</h1>
<div id="okta-unlock-container">
</div>
<script src="../js/okta-config.js"></script>
<script>
  const signInWidgetConfig = {
    flow: 'unlockAccount',
    baseUrl: credentials.domain,
    useInteractionCodeFlow: true,
    clientId: credentials.clientId,
    redirectUri: window.location.origin + '/callback',
    authParams: {
      clientId: credentials.clientId,
      pkce: true,
    },
  };
  var fSignIn = new OktaSignIn(signInWidgetConfig);
  fSignIn.showSignInAndRedirect({
    el: '#okta-unlock-container'
  }).catch(function(error) {
    // This function is invoked with errors the widget cannot recover from:
    // Known errors: CONFIG_ERROR, UNSUPPORTED_BROWSER_ERROR
    alert('Catch unknown errors here which widget does not support');
  });
</script>
```
{% endraw %}

Here, we specify `flow: 'unlockAccount'` to initialize the sign-in widget flows to start from the unlock screens.

{% img
blog/shopping-app-with-node-minio/unlock-account.png
alt:"Unlock page"
width:"800" %}{: .center-image }

### Forgot password page

Create a file called `forgot-password.handlebars` and add the following code to it:

{% raw %}
```html
<h1 class="text-center">Reset Your Password</h1>
<div id="okta-fp-container">
</div>
<script src="../js/okta-config.js"></script>
<script>
  const signInWidgetConfig = {
    flow: 'resetPassword',
    baseUrl: credentials.domain,
    useInteractionCodeFlow: true,
    clientId: credentials.clientId,
    redirectUri: window.location.origin + '/callback',
    authParams: {
      clientId: credentials.clientId,
      pkce: true,
    },
  };
  var fSignIn = new OktaSignIn(signInWidgetConfig);
  fSignIn.showSignInAndRedirect({
    el: '#okta-fp-container'
  }).catch(function(error) {
    // This function is invoked with errors the widget cannot recover from:
    // Known errors: CONFIG_ERROR, UNSUPPORTED_BROWSER_ERROR
    alert('Catch unknown errors here which widget does not support');
  });
</script>
```
{% endraw %}

Here, we specify `flow: 'resetPassword'` to initialize the sign-in widget flows to start from the forgot-password screens.

{% img
blog/shopping-app-with-node-minio/forgot-password.png
alt:"Forgot password page"
width:"800" %}{: .center-image }


## Style your application

In the `public` folder create a new folder named `css`. Inside the `css` folder, create a new file called `miniostore.css`. Add the following code to it:

```css
body {
  padding-left: 30px;
  padding-top: 70px;
}
	
/* navbar */
.navbar-default {
  background-color: #496572;
  border-color: #496572;
}
/* title */
.navbar-default .navbar-brand {
  color: white;
}
.navbar-default .navbar-brand:hover,
.navbar-default .navbar-brand:focus {
  color: #5E5E5E;
}
/* link */
.navbar-default .navbar-nav > li > a {
  color: white;
}
.navbar-default .navbar-nav > li > a:hover,
.navbar-default .navbar-nav > li > a:focus {
  color: #333;
}
.navbar-default .navbar-nav > .active > a, 
.navbar-default .navbar-nav > .active > a:hover, 
.navbar-default .navbar-nav > .active > a:focus {
  color: #555;
  background-color: #E7E7E7;
}
.navbar-default .navbar-nav > .open > a, 
.navbar-default .navbar-nav > .open > a:hover, 
.navbar-default .navbar-nav > .open > a:focus {
  color: #555;
  background-color: #D5D5D5;
}
/* caret */
.navbar-default .navbar-nav > .dropdown > a .caret {
  border-top-color: #777;
  border-bottom-color: #777;
}
.navbar-default .navbar-nav > .dropdown > a:hover .caret,
.navbar-default .navbar-nav > .dropdown > a:focus .caret {
  border-top-color: #333;
  border-bottom-color: #333;
}
.navbar-default .navbar-nav > .open > a .caret, 
.navbar-default .navbar-nav > .open > a:hover .caret, 
.navbar-default .navbar-nav > .open > a:focus .caret {
  border-top-color: #555;
  border-bottom-color: #555;
}
/* mobile version */
.navbar-default .navbar-toggle {
  border-color: #DDD;
}
.navbar-default .navbar-toggle:hover,
.navbar-default .navbar-toggle:focus {
  background-color: #DDD;
}
.navbar-default .navbar-toggle .icon-bar {
  background-color: #CCC;
}
@media (max-width: 767px) {
  .navbar-default .navbar-nav .open .dropdown-menu > li > a {
    color: #777;
  }
  .navbar-default .navbar-nav .open .dropdown-menu > li > a:hover,
  .navbar-default .navbar-nav .open .dropdown-menu > li > a:focus {
    color: #333;
  }
}	
```

## Run your application

Run the following command to start the app server:

```sh
node index.js
```

To see the app, open a browser window and visit `http://localhost:3000`. Now log in to your application.


## Do more with Node and MinIO

We have set up a basic e-commerce app with Node.js, Express, and MinIO. We secured access to the store with the Okta Sign-In Widget. We also learned how to use the `flow` parameter to bootstrap Okta's Sign-In Widget for different pages within your application.

If you'd like to learn more about building web apps with Node.js, you might want to check out these other great posts and resources:

- [Build Secure Node Authentication with Passport.js and OpenID Connect](/blog/2018/05/18/node-authentication-with-passport-and-oidc)
- [Build with MinIO JS SDK](https://github.com/minio/minio-js)
- [Build User Registration with Node, React, and Okta](/blog/2018/02/06/build-user-registration-with-node-react-and-okta)
- [Simple Node Authentication](/blog/2018/04/24/simple-node-authentication)
- [Build a Basic CRUD App with Vue.js and Node](/blog/2018/02/15/build-crud-app-vuejs-node)

If you're interested in learning more about how the underlying authentication components work (OpenID Connect), you may be interested in our [OpenID Connect primer series](/blog/2017/07/25/oidc-primer-part-1), which explains everything you need to know about OpenID Connect as a developer.

Finally, please [follow us on Twitter](https://twitter.com/OktaDev) to find more great resources like this, request other topics to write about, and follow along with our new open-source libraries and projects!

And if you have any questions, please leave a comment below!
