---
layout: blog_post
title: How to Build a Basic Shopping App with Node.js and MinIO
author: deepa-mahalingam
by: internal-contributor
communities: [javascript]
description: ""
tags: [sign-in-widget, okta, node, minio]
type: conversion
image: 
github: 
tweets:
---

These days, a lot of e-commerce solutions are built with Node.js. Typically, e-commerce applications have many images and video assets managed in object storage. As the number of products in an e-commerce store increases, so does the size of the object storage. We’ll build our Node.js application with a Kubernetes-friendly object storage service called MinIO to scale with demand. Finally, we’ll secure this scalable application with the Okta Sign-in Widget.

This tutorial will guide you through the code to build a simple Node.js Shopping App with the Okta's Sign-In Widget for authentication and a [MinIO Server](https://min.io/) to host the store's assets. We will use Express as our application framework and Handlebars as the view engine. We will use the [Minio Javascript Client SDK](https://docs.minio.io/docs/javascript-client-quickstart-guide) to fetch the application's image assets from the Minio Server.

![BRU_app](https://github.com/deepamahalingam-okta/okta_commerce/blob/main/docs/screenshots/BRU_app.png?raw=true)

{% include toc.md %}

**Prerequisites**

* [Node.js](https://nodejs.org/en/)
* [MinIO Client (mc)](https://docs.minio.io/docs/minio-client-quickstart-guide)
* [Minio Server](https://docs.min.io/)
* [Okta CLI](https://cli.okta.com/)

If you'd like to skip the tutorial and just check out the fully built project, you can go [view it on GitHub]().

## Build your application with Express
 
First, create a new directory for your `okta_commerce` application and navigate into it.

```sh
mkdir okta_commerce
cd okta_commerce
```

Use the following command to create a `package.json` file for your application.

```sh
npm init -y
```

Now install the following dependencies in the `okta_commerce` directory.

```sh
npm i express@4
npm i express-handlebars@6
npm i express-session@1
npm i minio@7
npm i @okta/oidc-middleware@4
npm i @okta/okta-signin-widget@5
```

## Set Up Authentication With Okta

Dealing with user authentication in web apps can be a massive pain for every developer. This is where Okta shines: it helps you secure your web applications with minimal effort. 

{% include setup/cli.md type="spa" loginRedirectUri="http://localhost:3000/callback" logoutRedirectUri="http://localhost:3000/" %}

Configure your Okta tenant so that Security > Profile Enrollment > Self-Service Registration is enabled for your application.

Configure your Okta tenant so that Security > Authenticators > Password has a rule that allows for password unlock for your application.


## Set Up MinIO Object Storage

There are three steps when setting up the assets. 

### Create the bucket on MinIO play server

We've created a public minio server https://play.minio.io:9000 for developers to use as a sandbox. Minio Client `mc` is  preconfigured to use the play server.  

Make a bucket called `okta-commerce` on play.minio.io using the following command: 

```sh
mc mb play/okta-commerce
```

More details on the `mc mb` command can be found [here](https://docs.minio.io/docs/minio-client-complete-guide#mb).


### Set up bucket policy on MinIO play server

Store product image assets can be set to public readwrite. Use `mc policy` command to set the access policy on this bucket to "both". 

```sh
mc policy set public play/okta-commerce
```

More details on the `mc policy` command can be found [here](https://docs.minio.io/docs/minio-client-complete-guide#policy).


### Copy store’s assets to MinIO bucket

Upload store product pictures into this bucket.  Use `mc cp`  command to do this. 

```sh
mc cp ~/Downloads/Product-1.jpg play/okta-commerce/
mc cp ~/Downloads/Product-2.jpg play/okta-commerce/
mc cp ~/Downloads/Product-3.jpg play/okta-commerce/
mc cp ~/Downloads/Product-4.jpg play/okta-commerce/
```

More details on the `mc cp` command can be found [here](https://docs.minio.io/docs/minio-client-complete-guide#cp).


## Access the MinIO assets programmatically

There are two steps in programmatically accessing your assets inside your JavaScript application.

### Pointing to Minio Server with Keys

In the `main-store.js` [file](https://github.com/deepamahalingam-okta/okta_commerce/blob/main/main-store.js), require minio and instantiate a `minioClient` object with the play server's endpoint, port and access keys. Access & Secret keys to the play server are open to public use.

```js
var Minio = require('minio');
var minioClient = new Minio.Client({
      endPoint: 'play.minio.io',
     port: 9000,
     accessKey: 'Q3AM3UQ867SPQQA43P2F',
     secretKey: 'zuf+tfteSlswRu7BJ86wekitnifILbZam1KYY3TG'
});
```

**NOTE** : when running minio server locally also add ``secure: false,`` in above code.


### Call listObjects from MinIO server to your app

Set up a route for '/' in the `minio-store.js` [file](https://github.com/deepamahalingam-okta/okta_commerce/blob/main/main-store.js). Set up and create [handlebar files](https://github.com/deepamahalingam-okta/okta_commerce/tree/main/views) including the layouts folder and main.handlebars file as shown in [this](https://github.com/deepamahalingam-okta/okta_commerce) repo.

Using the [listObjects]( https://docs.minio.io/docs/javascript-client-api-reference#listObjects) method, get a list of all the files from the minio-store bucket. listObjects returns product urls which are pushed into an array variable called assets. Pass the assets array to `home.handlebars` view.


```js
var minioBucket = 'okta-commerce'

app.get('/', function(req, res){
  var assets = [];
  var objectsStream = minioClient.listObjects(minioBucket, '', true)
  objectsStream.on('data', function(obj) {
    console.log(obj);
    // Lets construct the URL with our object name.
    var publicUrl = minioClient.protocol + '//' + minioClient.host + ':' + minioClient.port + '/' + minioBucket + '/' + obj.name
    assets.push(publicUrl);
  });
  objectsStream.on('error', function(e) {
    console.log(e);
  });
  objectsStream.on('end', function(e) {
    console.log(assets);
    // Pass our assets array to our home.handlebars template.
    res.render('home', { url: assets });
  });
});
```

## Create Views

Loop through `assets_url` in `home.handlebars` to render the thumbnails of product images. For simplicity in this example we do not use a database to store rows of product information. But you may store the image url from this array into your products schema if needed.

```js
<!-- Page Features -->
<div class="row text-center">
    {{#each url}}
     <div class="col-md-3 col-sm-6 hero-feature">
          <div class="thumbnail">
               <img src="{{this}}" max-height=200 max-width=200 alt="">
               <div class="caption">
                     <h3>Product Name</h3>
                     <p>Lorem ipsum dolor sit amet, consectetur adipisicing elit.</p>
                     <p> <a href="#" class="btn btn-primary">Buy Now!</a> <a href="#" class="btn btn-default">More Info</a> </p>
                </div>
           </div>
      </div>
  {{/each}}   
 </div>
```
## Set up Okta Tenant

Create a Web Application and have your base URL and clientID handy.
Configure the Okta tenant so that Security->Profile Enrollment -> Self-Service Registration is enabled for your application.

![SSPR](https://github.com/deepamahalingam-okta/okta_commerce/blob/main/docs/screenshots/SSPR.png?raw=true)

Configure the Okta tenant so that Security->Authenticators->Password has a rule that allows for password unlock for your application.

![Unlock](https://github.com/deepamahalingam-okta/okta_commerce/blob/main/docs/screenshots/Unlock.png?raw=true)

## Embed Okta Sign-In Widget

The app needs several entry points such as login, register, forgot-password and unlock. 

### login.handlebars

Express the configuration of the sign-in widget in each of these handlebars with the appropriate `flow:<entry point>` option. The flow parameter is not needed for the login flow since its the default flow for the sign in widget. 

```js
   <script>             
      signInWidgetConfig = {
          // Enable or disable widget functionality with the following options. Some of these features require additional configuration in your Okta admin settings. Detailed information can be found here: https://github.com/okta/okta-signin-widget#okta-sign-in-widget

          // Look and feel changes:
          logo: '//okta.com', // Try changing "okta.com" to other domains, like: "workday.com", "splunk.com", or "delmonte.com"

          language: 'en',   // Try: [fr, de, es, ja, zh-CN] Full list: https://github.com/okta/okta-signin-widget#language-and-text
          i18n: {
          //Overrides default text when using English. Override other languages by adding additional sections.
          'en': {
              'primaryauth.title': 'Sign In',   // Changes the sign in text
              'primaryauth.submit': 'Sign In',  // Changes the sign in button
              // More e.g. [primaryauth.username.placeholder,  primaryauth.password.placeholder, needhelp, etc.].
              // Full list here: https://github.com/okta/okta-signin-widget/blob/master/packages/@okta/i18n/dist/properties/login.properties
          }
          },
          // Changes to widget functionality
          signOutLink: 'http://localhost:3000/logout',
          features: {
            rememberMe: true,            // Setting to false will remove the checkbox to save 
            router: true,                       // Leave this set to true for the API demo
          },
          baseUrl: 'http://localhost:3000',
          flow: 'login',
          el: '#okta-login-container',
          clientId: ‘YOUR_CLIENT_ID',
          redirectUri: 'http://localhost:3000/callback',
          authParams: {
          issuer: 'https://YOUR_OKTA_ORG_URL/oauth2/default',
          responseType: ['code'],
          useInteractionCodeFlow: true,
          pkce: true,
          // responseType: ['id_token', 'token'],
          scopes: ['openid', 'email', 'profile'],
          },
      };

      var oSignIn = new OktaSignIn(signInWidgetConfig); 
      oSignIn.showSignInAndRedirect({
          el: '#okta-login-container'
      }).catch(function(error) {
          // This function is invoked with errors the widget cannot recover from:
          // Known errors: CONFIG_ERROR, UNSUPPORTED_BROWSER_ERROR
          alert('Catch unknown errors here which widget does not support');
      });
                        
```

![BRU_Login](https://github.com/deepamahalingam-okta/okta_commerce/blob/main/docs/screenshots/BRU_Login.png?raw=true)

### register.handlebars

Specify `flow: 'signup'` to initialize the sign-in widget flows to start from the register or signup screens.
```js
  <div id="okta-register-container">
  </div>
  <script>   
    const signInWidgetConfig = {
        flow: 'signup',
        baseUrl:’YOUR_OKTA_ORG_URL’',
        useInteractionCodeFlow: true,
        clientId: 'YOUR_CLIENT_ID',
        redirectUri: 'http://localhost:3000/callback',
        authParams: {
            clientId: 'YOUR_CLIENT_ID',
            pkce: true,
        },
    };
    var fSignIn = new OktaSignIn(signInWidgetConfig); 
    fSignIn.showSignInAndRedirect({
        el: '#okta-register-container'
    }).catch(function(error) {
        // This function is invoked with errors the widget cannot recover from:
        // Known errors: CONFIG_ERROR, UNSUPPORTED_BROWSER_ERROR
        alert('Catch unknown errors here which widget does not support');
    });
  </script>
```

![BRU_Regiter](https://github.com/deepamahalingam-okta/okta_commerce/blob/main/docs/screenshots/BRU_Register.png?raw=true)

### forgot-password.handlebar

Specify `flow: 'resetPassword'` to initialize the sign-in widget flows to start from the forgot-password screens.

```js
  <div id="okta-fp-container">
  </div>
  <script>     
    const signInWidgetConfig = {
        flow: 'resetPassword',
        baseUrl: '{yourOktaDomain}',
        useInteractionCodeFlow: true,
        clientId: '{yourOktaClientId}',
        redirectUri: 'http://localhost:3000/callback',
        authParams: {
            clientId: ’{yourOktaClientId}’,
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

![BRU_Reset](https://github.com/deepamahalingam-okta/okta_commerce/blob/main/docs/screenshots/BRU_Reset.png?raw=true)

### unlock.handlebars

Specify `flow: 'unlockAccount'` to initialize the sign-in widget flows to start from the unlock screens.

```js
   <div id="okta-unlock-container">
   </div>
   <script>
    const signInWidgetConfig = {
        flow: 'unlockAccount',
        baseUrl: '{yourOktaDomain}',
        useInteractionCodeFlow: true,
        clientId: {yourOktaClientId}'',
        redirectUri: 'http://localhost:3000/callback',
        authParams: {
            clientId: '{yourOktaClientId}’,
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

![BRU_Unlock](https://github.com/deepamahalingam-okta/okta_commerce/blob/main/docs/screenshots/BRU_Unlock.png?raw=true)

## 7. Run The App

Do the following steps to start the app server.

```sh
node main-store.js
```

To see the app, open a browser window and visit http://localhost:3000

![BRU_app](https://github.com/deepamahalingam-okta/okta_commerce/blob/main/docs/screenshots/BRU_app.png?raw=true)

## Conclusion

We have set up an e-commerce app with node.js, express.js and minio and secured access to the store with the customer hosted Okta Sign-In Widget all within a few minutes. We have also learnt how to use the `flow` parameter to bootstrap Okta’s Sign-In Widget for different pages within your application. Hope you enjoyed this tutorial. Let us know if you have any questions.


