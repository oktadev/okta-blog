---
layout: blog_post
title: "From Meh to Wow: Customize Your Okta Sign-In Experience"
author: nesh-popovic
by: internal-contributor
communities: [javascript]
description: "Tutorial on customizing your Okta Hosted Sign-In Widget to the next level."
tags: [sign-in-custom-domain, custom-domain, okta-hosted-sign-in-widget]
tweets:
- ""
- ""
- ""
image: blog/okta-hosted-sign-in-widget/sign-in-widget-social-image.jpeg
type: conversion
github: https://github.com/oktadev/okta-js-sign-in-widget-customization-example
---
The Okta Sign-In Widget is a powerful tool that allows developers to integrate Okta authentication into their web applications seamlessly. But did you know you can also customize the widget's look and feel to match your application's design, even if hosted on Okta? Whether you want to modify colors, add custom branding, or adjust the layout, Okta provides flexibility to make the widget fit your brand's identity.

In this guide, we'll transform the Okta Hosted Sign-In Widget using standard Javascript and CSS and its built-in functionality. If you want to jump to the completed project, you can find it in the [okta-js-sign-in-widget-customization-example](https://github.com/oktadev/okta-js-sign-in-widget-customization-example) GitHub repository.

{:toc}

**Before**
{% img blog/okta-hosted-sign-in-widget/okta-hosted-sign-in-widget-before.gif alt:"animated gif of default static Okta Hosted Sign-In Widget" %}{: .center-image }

Our goal:

**After**
{% img blog/okta-hosted-sign-in-widget/okta-hosted-sign-in-widget-after.gif  alt:"animated gif of customized Okta Hosted Sign-In Widget with sliding window effect for new signups" width:"800" %}{: .center-image }


## Okta Sign-In Widget basics
Before diving into customization, let's go over a few basics. "Okta Hosted Sign-In Widget" means that when the user needs to authenticate, you redirect them from your application to Okta, and the sign-in screen that the user is presented with is hosted by Okta or on a custom domain. Hence, you can customize the widget and tailor code within Okta's Admin Console, which makes it very convenient for your developers.

**Prerequisites to this tutorial**
This guide assumes you already have:
- A Single Sign-On (SSO) application that redirects to Okta for authentication.
- A customized Okta Hosted Sign-In Widget with a [custom domain](https://help.okta.com/en-us/content/topics/settings/settings-configure-custom-url.htm) enabled to make the necessary edits that I will demonstrate in this tutorial.
- This tutorial uses the Sign-In Widget **version ^7**.
- [Self-Service Registration (SSR)](https://support.okta.com/help/s/article/sign-up-link-missing-from-okta-login-page-during-sp-initiated-login?language=en_US) enabled to handle user self-registration.

If you don't have the above setup just yet, you can test one of our [samples](https://github.com/okta-samples) with a free Developer Edition Account under [Sign up free for Developer Edition](https://developer.okta.com/signup/). 

>**Note:** You must use your work email address to sign up for a free developer account.

Within the samples, please refer to the ones labeled **Okta Hosted Login** or **Redirect Model**. For example, here is one in [React](https://github.com/okta-samples/okta-react-sample) and [Angular](https://github.com/okta-samples/okta-angular-quickstart). Each sample readme should have directions on creating an SSO application within Okta. Still, for more info, you can always refer to this page on [creating app integrations](https://help.okta.com/en-us/content/topics/apps/apps_app_integration_wizard_oidc.htm.). One last note, be sure you are using the correct authorization server for SSO and that is the [Okta Org Authorization Server](https://developer.okta.com/docs/concepts/auth-servers/#org-authorization-server). 

For even more examples of how to get started with the  Sign-In Widget, check out this post, which walks you through the basic customizations and setting up a custom domain.

{% excerpt /blog/2023/01/12/signin-custom-domain %}

## Customizing colors and branding on the Okta Sign-In Widget
One of the easiest and basic ways to personalize the Okta Sign-In Widget is through the **Customizations** > **Brands** > **[your custom brand]** > **Theme** tab; here, you can modify the logo, colors, and background. 

## Understanding the Okta Sign-In Widget structure
We're not here to change the button color or simply slap a logo on the widget; we're here to learn how to slice and dice that widget so it dazzles and provides a better user experience. 🙂

We will accomplish this by utilizing standard Javascript and CSS.
If you use the Okta Hosted Sign-In Widget, you will find it under **Customizations** > **Brands** > **[your custom brand]** > **Pages** > **Sign-in** page. Click the **Configure** button and toggle the **Code editor** to **ON**. At this point, you should see some code appear like the one below:

{% raw %}
```html
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<html>
   <head>
      <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta name="robots" content="noindex,nofollow" />
      <!-- Styles generated from theme -->
      <link href="{{themedStylesUrl}}" rel="stylesheet" type="text/css">
      <!-- Favicon from theme -->
      <link rel="shortcut icon" href="{{faviconUrl}}" type="image/x-icon"/>
      <title>{{pageTitle}}</title>
      {{{SignInWidgetResources}}}
      <style nonce="{{nonceValue}}">
         #login-bg-image-id {
         background-image: {{bgImageUrl}}
         }
      </style>
   </head>
   <body>
      <div id="login-bg-image-id" class="login-bg-image tb--background"></div>
      <div id="okta-login-container"></div>
      <!--
         "OktaUtil" defines a global OktaUtil object
         that contains methods used to complete the Okta login flow.
         -->
      {{{OktaUtil}}}
      <script type="text/javascript" nonce="{{nonceValue}}">
         // "config" object contains default widget configuration
         // with any custom overrides defined in your admin settings.
         var config = OktaUtil.getSignInWidgetConfig();
         
         // Render the Okta Sign-In Widget
         var oktaSignIn = new OktaSignIn(config);
         
         oktaSignIn.renderEl({ el: '#okta-login-container' },
             OktaUtil.completeLogin,
             function(error) {
                 // Logs errors that occur when configuring the widget.
                 // Remove or replace this with your own custom error handler.
                 console.log(error.message, error);
             }
         );
      </script>
   </body>
</html>
```
{% endraw %}

Let's make a note of a few key things:
- `OktaUtil` is a global object that contains all of the widget methods and settings
- `var config = OktaUtil.getSignInWidgetConfig();` gets us all the widget configurations so we can start modifying them 
- `var oktaSignIn = new OktaSignIn(config);` initializes the widget with the config values

## Add custom CSS and third-party libraries to the Okta Sign-In Widget
If you want more fine-grained control over the widget's appearance, Okta allows you to inject your own CSS styles and use other libraries (e.g., Bootstrap, jQuery, etc.). You can override specific elements or apply custom styles across the widget. To apply your own CSS, you can either do the inline styling or point to a CSS file (which needs to be accessible from the web). Let's dive in! 

Within the `<head>` section and below the following code,

{% raw %}
```html
<!-- Favicon from theme -->
<link rel="shortcut icon" href="{{faviconUrl}}" type="image/x-icon"/>
```
{% endraw %}

insert the following code that points to the Font Awesome library, which is hosted on my AWS S3 bucket (you can use your own Font Awesome or any other library, but you would need to modify the code accordingly).

```css
<link rel="stylesheet" type="text/css" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.14.0/css/all.min.css">
```

Next, let's add some general styles to achieve the desired look. Within the `<style>...</style>` block,

{% raw %}
```html
<title>{{pageTitle}}</title>
{{{SignInWidgetResources}}}
<style nonce="{{nonceValue}}">
   #login-bg-image-id {
   background-image: {{bgImageUrl}}
   }
</style>
```
{% endraw %}

add the following code,

```css
/********* custom css ************/
@import url('https://fonts.googleapis.com/css?family=Montserrat:400,800');

* {
	box-sizing: border-box;
}

body {
	background: linear-gradient(-135deg, #ffffff, #4158d0);
	display: flex;
	justify-content: center;
	align-items: center;
	flex-direction: column;
	font-family: 'Montserrat', sans-serif;
	height: 100vh;
	margin: -20px 0 50px;
}

h1 {
	font-weight: bold;
	margin: 0;
	text-align: center;
	padding: 20px;
}

h2 {
	text-align: center;
}

p {
	font-size: 14px;
	font-weight: 100;
	line-height: 20px;
	letter-spacing: 0.5px;
	margin: 20px 0 30px;
}

span {
	font-size: 12px;
}

a {
	color: #333;
	font-size: 14px;
	text-decoration: none;
	margin: 15px 0;
}

button {
	border-radius: 20px;
	border: 1px solid #c850c0;
	background-color: #c850c0;
	color: #FFFFFF;
	font-size: 12px;
	font-weight: bold;
	padding: 12px 45px;
	letter-spacing: 1px;
	text-transform: uppercase;
	transition: transform 80ms ease-in;
}

button:active {
	transform: scale(0.95);
}

button:focus {
	outline: none;
}

button.ghost {
	background-color: transparent;
	border-color: #FFFFFF;
}

form {
	background-color: #FFFFFF;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-direction: column;
	padding: 0 50px;
	height: 100%;
	text-align: center;
}

input {
	background-color: #eee;
	border: none;
	padding: 12px 15px;
	margin: 8px 0;
	width: 100%;
}

.container {
	background-color: #fff;
	border-radius: 10px;
	box-shadow: 0 14px 28px rgba(0, 0, 0, 0.25),
		0 10px 10px rgba(0, 0, 0, 0.22);
	position: relative;
	overflow: hidden;
	width: 768px;
	max-width: 100%;
	min-height: 550px;
}

.form-container {
	position: absolute;
	top: 0;
	height: 100%;
	transition: all 0.6s ease-in-out;
}

.sign-in-container {
	left: 0;
	width: 50%;
	z-index: 2;
}

.container.right-panel-active .sign-in-container {
	transform: translateX(100%);
}

.sign-up-container {
	left: 0;
	width: 50%;
	opacity: 0;
	z-index: 1;
}

.container.right-panel-active .sign-up-container {
	transform: translateX(100%);
	opacity: 1;
	z-index: 5;
	animation: show 0.6s;
}

@keyframes show {

	0%,
	49.99% {
		opacity: 0;
		z-index: 1;
	}

	50%,
	100% {
		opacity: 1;
		z-index: 5;
	}
}

.overlay-container {
	position: absolute;
	top: 0;
	left: 50%;
	width: 50%;
	height: 100%;
	overflow: hidden;
	transition: transform 0.6s ease-in-out;
	z-index: 100;
}

.container.right-panel-active .overlay-container {
	transform: translateX(-100%);
}

.overlay {
	background: #c850c0;
	background: -webkit-linear-gradient(to right, #4158d0, #c850c0);
	background: linear-gradient(to right, #4158d0, #c850c0);
	background-repeat: no-repeat;
	background-size: cover;
	background-position: 0 0;
	color: #FFFFFF;
	position: relative;
	left: -100%;
	height: 100%;
	width: 200%;
	transform: translateX(0);
	transition: transform 0.6s ease-in-out;
}

.container.right-panel-active .overlay {
	transform: translateX(50%);
}

.overlay-panel {
	position: absolute;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-direction: column;
	padding: 0 40px;
	text-align: center;
	top: 0;
	height: 100%;
	width: 50%;
	transform: translateX(0);
	transition: transform 0.6s ease-in-out;
}

.overlay-left {
	transform: translateX(-20%);
}

.container.right-panel-active .overlay-left {
	transform: translateX(0);
}

.overlay-right {
	right: 0;
	transform: translateX(0);
}

.container.right-panel-active .overlay-right {
	transform: translateX(20%);
}

footer {
	background-color: #222;
	color: #fff;
	font-size: 14px;
	bottom: 0;
	position: fixed;
	left: 0;
	right: 0;
	text-align: center;
	z-index: 999;
}

footer p {
	margin: 10px 0;
}

footer i {
	color: red;
}

footer a {
	color: #3c97bf;
	text-decoration: none;
}

/* end custom css */
```

Lastly, we will modify the widget CSS to our desired style. I will not explain each here, but it is just a CSS juggling act. Please note that I am not a CSS expert, so the following styles can probably be used more efficiently. 🙂

Still, within the `<style>...</style>` section, and just below the code above, insert the following code:

```css
/* modified Okta css */
#okta-sign-in {
	border-radius: 10px;
	background: #ffffff;
	width: 100%;
	margin: 20px auto 8px;
}

#okta-sign-in .auth-header {
	padding: 0px;
}

#okta-sign-in .auth-content {
	padding: 20px 22px 20px;
}

#okta-sign-in.no-beacon .auth-content {
	padding-top: 5px;
}

#okta-sign-in .siw-main-view .siw-main-body .o-form-content {
	width: 100%;
}

#okta-sign-in .focused-input,
#okta-sign-in .link.help:focus,
okta-form-input-field:focus {
	box-shadow: none;
}

#okta-sign-in .o-form .input-fix,
#okta-sign-in .o-form .textarea-fix {
	border: none;
}

#okta-sign-in .o-form .input-fix input[type="text"],
#okta-sign-in .o-form .input-fix input[type="textbox"],
#okta-sign-in .o-form .input-fix input[type="number"],
#okta-sign-in .o-form .input-fix input[type="password"] {
	font-size: 15px;
	line-height: 1.5;
	color: #666;
	display: block;
	width: 100%;
	background: #f7f7f7;
	height: 50px;
	border-radius: 5px;
	/*padding: 0 30px 0 68px;*/
	box-shadow: none;
}

#okta-sign-in .focused-input {
	box-shadow: none;
}

#okta-sign-in .o-form-button-bar {
	width: 100%;
	display: flex;
	flex-wrap: wrap;
	justify-content: center;
	padding-top: 13px;
	border: none;
}

#okta-sign-in.auth-container.main-container {
	background-color: #ffffff;
	border: none;
	border-color: none;
	color: #000;
	box-shadow: none;
}

#okta-sign-in .auth-divider .auth-divider-text {
	color: #000;
}

#okta-sign-in.auth-container .okta-form-input-field {
	background-color: transparent;
}

#okta-sign-in.auth-container .button-primary,
#okta-sign-in.auth-container input[type=button],
#okta-sign-in.auth-container input[type=submit] {
	font-family: Montserrat-Bold;
	font-size: 15px;
	line-height: 1.5;
	color: #ffffff !important;
	text-transform: uppercase;
	text-align: center;
	width: 100%;
	height: 50px;
	border-radius: 25px;
	display: flex;
	justify-content: center;
	align-items: center;
	transition: all .4s background: #c850c0 !important;
	border: #c850c0 1px solid !important;
	border-bottom-color: #c850c0;
	box-shadow: none;
	width: 80%;
}

#okta-sign-in.auth-container h2,
#okta-sign-in.auth-container h3 {
	color: #000;
	font-size: x-large;
	font-weight: bold;
	font-family: 'Montserrat', sans-serif;
}

#okta-sign-in.auth-container .okta-form-label {
	color: #000;
}

#okta-sign-in.auth-container.main-container .o-form .o-form-input .o-form-control .input-icon-divider {
	height: 50px;
}

#okta-sign-in .registration-container .content-container {
	text-align: center;
}

#okta-sign-in .enroll-sms .enroll-sms-phone {
	width: auto;
}

#okta-sign-in .siw-main-footer .footer-info {
	border-top: none;
	display: flex;
	margin-top: 0rem;
	padding-top: 0rem;
}

#okta-sign-in .o-form .o-form-label,
#okta-sign-in .o-form input,
#okta-sign-in .o-form label,
#okta-sign-in .o-form textarea {
	text-align: left;
}

#okta-sign-in .siw-main-view .siw-main-body .o-form-content .o-form-label label {
	font-size: medium;
}

#okta-sign-in .siw-main-view .siw-main-body .o-form-content .o-form-label .o-form-explain {
	color: #c250c1;
}

#okta-sign-in .sign-in-with-idp .social-container {
	margin: 20px 0;
}

#okta-sign-in .sign-in-with-idp .social-container a {
	border: 1px solid #DDDDDD;
	border-radius: 50%;
	display: inline-flex;
	justify-content: center;
	align-items: center;
	margin: 0 5px;
	height: 40px;
	width: 40px;
}

#okta-sign-in .sign-in-with-idp .social-container i {
	-moz-osx-font-smoothing: grayscale;
	-webkit-font-smoothing: antialiased;
	display: inline-block;
	font-style: normal;
	font-variant: normal;
	text-rendering: auto;
	line-height: 1;
	font-family: "Font Awesome 5 Brands";
	font-weight: 400;
}
```

## Changing the layout of the Okta Sign-In Widget
We must modify the page's core HTML to make the widget layout horizontal and achieve the desired effect. Replace the default widget code:

{% raw %}
```html
<div id="login-bg-image-id" class="login-bg-image tb--background"></div>
<div id="okta-login-container"></div>
```
{% endraw %}

With the following code:

{% raw %}
```html
<!-- custom login -->
<div class="container" id="container">
   <div class="form-container sign-up-container">
      <div id="okta-signup-container"></div>
   </div>
   <div class="form-container sign-in-container">
      <div id="okta-login-container"></div>
   </div>
   <div class="overlay-container">
      <div class="overlay">
         <div class="overlay-panel overlay-left">
            <h1>Already have an account?</h1>
            <p>Please use the button below</p>
            <button class="ghost" id="signIn">Sign In</button>
         </div>
         <div class="overlay-panel overlay-right" id="reg-overlay">
            <h1>No account yet?</h1>
            <p>Click below to start your journey with us</p>
            <button class="ghost" id="signUp">Sign Up</button>
         </div>
         <div class="overlay-panel overlay-right" id="admin-overlay" style="display: none">
            <h1>Hello Admin</h1>
            <p>This login is for Admins only</p>
            <p>Not an Admin? Go to the application you are trying to access</p>
         </div>
      </div>
   </div>
</div>
<!-- end custom login -->
```
{% endraw %}

## Enhancing the experience with Okta Custom Sign-In Widget
Now, let's get into the meat and potatoes. We first need to hide some unwanted pieces of the widget (logo, header, links, etc.). Then, we must apply CSS to the existing HTML objects by replacing the classes (e.g., making the social button round). Easier said than done!

To manipulate the pieces of the widget, we need to know what those HTML elements are, and to find out, you can utilize the developer tools of the browser you are using. After figuring out what CSS classes and objects I needed to modify, I created the following code. So, replace the widget's default `<script>` section with the code below. I commented on almost every line; there is A LOT, but it'll make this step straightforward. There is one **IMPORTANT** piece of information to note. It is in the comments, but I will call it out here.

>**IMPORTANT**: Setting the Routing Rule in the admin interface for external IdPs will break this code, so instead, set the identity providers here in the config object.

Additionally, I've included some extra code to showcase how you can style or manipulate the widget based on the client id, making per-application customizations possible.

Below the OktaUtil object,

{% raw %}
```html
<!--
   "OktaUtil" defines a global OktaUtil object
   that contains methods used to complete the Okta login flow.
   -->
{{{OktaUtil}}}
```
{% endraw %}

Add the following code:

{% raw %}
```html
 <!-- Let's add a reference to jQuery for easy object manipulation. You do not have to do this; you can use vanila JS instead -->
<script src="https://code.jquery.com/jquery-3.7.1.min.js" integrity="sha256-/JqT3SQfawRcv/BIHPThkBvs0OEvtFFmqPF/lYI/Cxo=" crossorigin="anonymous"></script>
<script type="text/javascript" nonce="{{nonceValue}}">
   /***** 
   FOR IMPORTANT DETAILS ABOUT MODIFYING THE WIDGET IF YOU ARE USING THE V3, 
   PLEASE SEE THE FOLLOWING LINK: https://developer.okta.com/docs/guides/custom-widget-gen3/main/
   *****/
   
   //If you are interested in seeing what all is in the settings object log it here and use your browser's dev tools to look at it
   console.log("OKTAUTIL object: ", OktaUtil);
   
   // get request context - this allows us to get access to any data that was passed in the /authorize request...see BONUS CODE section later on for a sample code
   var requestContext = OktaUtil.getRequestContext();
   console.log("REQUEST CONTEXT: ",requestContext);
   
   // "config" object contains default widget configuration
   // with any custom overrides defined in your admin settings.
   var config = OktaUtil.getSignInWidgetConfig();
   console.log("CONFIG object: ", config);
   
   /****** BONUS CODE *******/
   /****** 
    * Did you know you can change the widget (styling, features, behavior, etc) based on the application? 
    * See the below code on how to do just that 
    * *******/
   
   // Per-application customization... let's get the client id from the request context 
   function getClientId() {
       if (!OktaUtil) return undefined;
       if (requestContext && requestContext.app && requestContext.app.value.id) {
           return requestContext.app.value.id;
       }
   }
   
   const clientid = getClientId();
   console.log("Client id from the request: ", clientid);
   
   // if client id matches the app that I want to have a customized appearance for then use it here
   if(clientid == '[YOUR SPECIAL APP CLIENT ID'){
   //disable registration
       config.features.registration = false;
   
   // you could also change the logo for example
   // config.logo = "[URL LINK TO YOUR LOGO]"; 
   }
   /****** END BONUS CODE ******/
   
   // You can either create a Routing Rule to enable external IdPs, or you can set the identity providers here in the config object
   // I have mine set up in the Okta Admin console via Routing Rule, but here is the code if you'd like to set them here
   // To learn how to set up external IdPs in your Okta tenant, visit this link: 
   // https://developer.okta.com/docs/guides/identity-providers/#social-logins
   
   config.idps = [
           {type: 'Google', id: '[ID OF YOUR GOOGLE IDP FROM OKTA]'},
           {type: 'Microsoft', id: '[ID OF YOUR MICROSOFT IDP FROM OKTA]'}
       ];
   
   // display the social buttons first, before the username/password form
   config.idpDisplay ="PRIMARY";
   
   // enable registration
   config.features.registration = true;
   
   // Initialize the Okta Sign-In Widget object
   var oktaSignIn = new OktaSignIn(config);
   
   // Render the Okta Sign-In Widget
   oktaSignIn.renderEl({ el: '#okta-login-container' },
       OktaUtil.completeLogin,
       function(error) {
           // Logs errors that occur when configuring the widget.
           // Remove or replace this with your custom error handler if desired.
           console.log(error.message, error);
       }
   );
   
   // Initialize another Okta widget object and bootstrap into the Signup part... 
   //This is needed so we can flip between login and registration, as only one instance can be rendered at a time.
   var oktaSignUp = new OktaSignIn({
           issuer: config.baseUrl,
           flow: 'signup'
       }
   );
   
   // WHEN THE WIDGET IS FULLY RENDERED START MANIPULATING ITS OBJECTS
   oktaSignIn.on('afterRender', function (context) {
       manipulateObjects();
   });
   
   // Make the panels move left-right to show/hide the login and reg forms
   const signUpButton = document.getElementById('signUp');
   const signInButton = document.getElementById('signIn');
   const container = document.getElementById('container');
   
   signUpButton.addEventListener('click', () => {
       console.log("Switch to sign up");
       oktaSignIn.remove();
       oktaSignUp.renderEl({ el: '#okta-signup-container' });
       container.classList.add("right-panel-active");
   });
   signInButton.addEventListener('click', () => {
       console.log("Switch to sign in");
       oktaSignUp.remove();
       oktaSignIn = new OktaSignIn(config);
       oktaSignIn.renderEl({ el: '#okta-login-container' });
       container.classList.remove("right-panel-active");
   });
   
   // This is where we manipulate the widget via Javascript
   function manipulateObjects() {
       //console.log("Trying to manipulate the widget...");
   
   // Depending on the config, footer contains links for sign-up, "Forgot password", "Back to Sign in" and possibly 
       // other self-service options. We'll hide the sign-up option since we're dealing with it separately, but we will leave the rest.
       // If you did want to hide it entirely, you can use the following code, you can either hide the entire footer or just the pieces of it
       // $("div.siw-main-footer").css("display","none"); 
       $("div.auth-footer div.signup-info").css("display","none");
   
   // Same for the header; let's hide it
       $("div.okta-sign-in-header").css("display","none");
   
   // We want to add the placeholder for the username, which is in the email format for my Okta tenant
       $("input[name='identifier']").attr('placeholder', 'Email');
       $("input[name='userProfile.email']").attr('placeholder', 'Email');
   
       /******* TRANSFORM SOCIAL BUTTONS **************/
   // We need the social buttons to look completely different from the default ones, we will make use of the FontAwesome library for icons
       $("#okta-login-container div.okta-idps-container").wrapAll('<div class="social-container">');
   
   // Modify the google button
       $("a[data-se='social-auth-google-button']").html('<i class="fab fa-google-plus-g"></i>');
       $("a[data-se='social-auth-google-button']").removeClass();
       $("a[data-se='social-auth-google-button']").addClass('social');
   
   // Modify the microsoft button
       $("a[data-se='social-auth-microsoft-button']").html('<i class="fab fa-microsoft"></i>');
       $("a[data-se='social-auth-microsoft-button']").removeClass();
       $("a[data-se='social-auth-microsoft-button']").addClass('social');
       /********* END TRANSFORM SOCIAL BUTTONS ************/
   
       //If a user is trying to access the Okta dashboard or came here by other means, hide the reg form and social buttons. Please remember that this merely hides the reg form via frontend (js/css). If the user is     crafty, they could still access the form
       if(clientid == ["CLIENT ID OF YOUR OKTA DASHBOARD APP"]){
     // Hide the registration panel
           $("#reg-overlay").css("display","none");
     // Display the text if this is an Admin user trying to access the dashboard 
           $("#admin-overlay").css("display","flex");
     // Hide the social buttons container
     $("#okta-login-container div.sign-in-with-idp").css("display","none");
       }
   
       //console.log("Finished manipulating the widget");
   };
</script>
```
{% endraw %}

Feel free to preview your work by clicking the **Save to draft** button and then the **Preview** button at the top, but just know there is one last step before we can see the final result.

## Content Security Policy to allow trusted external resources
The remaining task is to customize the default Content Security Policy (CSP) to allow trusted external resources and prevent violations. This will enable us to use external resources, such as the Font Awesome library, Google Fonts, and jQuery. You must add the URLs in the CSP if you use additional libraries or resources.

>**SECURE BEST PRACTICE**: 
- ✅ Remember to use trusted, well-maintained libraries, and pin specific versions you've used for future reference and troubleshooting issues. 
- ✅ Ensure the libraries you use for DOM manipulation are safe from XSS and appropriately sanitize inputs (if this applies to you). We have several blog posts on this topic if you search for [XSS](https://developer.okta.com/search/#q=xss&f:@commonoktasource=[Developer%20blog]) in our content collection. 
- ✅ And lastly, it never hurts to get a security review when dealing with code affecting authentication.

CSP is located under the **Settings** tab on the **Sign-in page** section, **Customizations** > **Brands** > **[your custom brand]** > **Pages** > **Sign-in page** > **Settings**. Un the **Content Security Policy** section, click on the **edit** button and add the following **Trusted external resources**:
- https://code.jquery.com
- https://cdnjs.cloudflare.com
- https://fonts.googleapis.com

And that should be all! After you've added the necessary CSP information and have previewed your sign-in page, you can now click the **Publish** button under the **Page Design** tab to see your changes live. If you copied/pasted everything correctly, you should now have a sign-in widget that looks and functions like the one showcased at the beginning of this tutorial. 

## Troubleshooting your Okta Hosted Sign-In Widget
Before publishing live to production, test it on your preview or developer org first. To target specific elements/attributes, refer to this [Okta doc on modifying CSS](https://developer.okta.com/docs/guides/custom-widget/main/#modify-the-css).

## More ways to customize your sign-in page
The manipulation and styling were only done for login and registration. You can check out the completed code in the [okta-js-sign-in-widget-customization-example](https://github.com/oktadev/okta-js-sign-in-widget-customization-example) GitHub repository. As bonus practice, I suggest you try to modify the MFA screens. To recap what I have demonstrated, customizing the Okta Sign-In Widget allows you to make authentication an integrated part of your app's user experience. From simple color changes to more complex UI tweaks, Okta's flexibility allows you to maintain your brand's visual identity while ensuring a secure and seamless login process.

Check out the [Okta Sign-In Widget Guide](https://developer.okta.com/docs/guides/embedded-siw/main/) for more detailed documentation and advanced options. Happy customizing!

For more examples of customizing the Okta Sign-In Widget, check out these blogs and resources:
- [A Secure and Themed Sign-in Page](blog/2023/01/12/signin-custom-domain#set-up-the-angular-micro-frontend-site-and-add-okta)
- [i18n in Java 11, Spring Boot, and JavaScript](blog/2019/02/25/java-i18n-internationalization-localization)
- [Style the Sign-In page](https://developer.okta.com/docs/guides/custom-widget/main/#modify-the-css)
- [Awesome Login CSS Customization! (feat. Amy Kapers)](https://www.youtube.com/watch?v=Q__ugprsOWo)

And to learn more content on ways you can customize your app's login experience, follow us @OktaDev on [X](https://twitter.com/oktadev) and subscribe to our [YouTube channel](https://www.youtube.com/c/OktaDev/)! We also want to hear from you about topics you want to see and questions you may have, so please leave us a comment below!
