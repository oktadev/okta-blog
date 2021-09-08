---
layout: blog_post
title: "Never Build MFA Again: A Developer's Guide to Transactional MFA"
author: jefferson-haw
by: internal-contributor
communities: [security]
description: "Learn how to implement transactional MFA in your applications."
tags: [transactional-mfa, mfa]
tweets:
- "Ever needed an extra layer of security arouns particularly sensitive parts of your application? Check this out!"
- "What is 'Transactional MFA' and what is it used for? Find out here!"
- "Learn how to implement Transactional MFA in your web applications!"
image: blog/featured/okta-node-bottle-headphones.jpg
type: conversion
---

Two Factor Authentication (2FA) or Multi-Factor Authentication (MFA) has been widely deployed over the last decade to end users but is, for the most part, only used during the login process. Using 2FA/MFA is a secure way of verifying who the user is before allowing them to access the desired application.

In just the last few years, however, applications have started adopting more sophisticated uses of 2FA/MFA. A good example would be the way current banking applications are requiring their customers to use 2FA/MFA before allowing them to perform security-sensitive operations, like making a bank deposit or withdrawing money. Requiring a user to verify themselves via 2FA/MFA before initiating a sensitive operation helps reduce risk and ensures that the correct person (not an attacker) is actually the one initiating the sensitive operation. This usage of 2FA/MFA is what is called "transactional" as it's occurring outside of the traditional authentication context.

In this post, I will walk you through building a simple transactional MFA application using Okta so that you'll never need to build MFA again!

## What You Will Need

Through the rest of this guide you'll be using Okta's free developer service to manage the authentication layer of the app you'll be building. In order to follow along, you'll need to create a free [Okta developer account](/signup/).

When you sign up for Okta, you'll be given your own unique Org URL. My demo org is `phdemo.oktapreview.com` which you'll see referenced through the rest of this post.

> widget
/ˈwij-it/
COMPUTING
an application, or a component of an interface that enables a user to perform a function or access a service. -Oxford dictionary

The [Okta Sign-In Widget](https://github.com/okta/okta-signin-widget) is a handy tool that covers all of your authentication and authorization use cases in securing your web application and mobile application. As Okta would say, NEVER BUILD AUTH AGAIN.

Did you know that outside of the standard authentication scenarios, a developer can actually leverage the Okta Sign-In Widget in other places as well? I'm talking about use cases like providing Transactional 2FA/MFA over certain flows where you would want to verify the user before executing a sensitive transaction or allowing the user access a secured section of your web application.

{% img blog/transactional-mfa/mfa-sequence-diagram.png alt:"MFA Sequence Diagram" width:"800" %}{: .center-image }

>For this project, you'll need to prepare a few dependencies:
>1. Any IDE to access Node.js files. I'm using [Visual Studio Code](https://code.visualstudio.com/)
>2. Node.js and NPM
>3. A free [Okta Developer](https://developer.okta.com/) account
>4. An existing [Node.js Express Okta project](https://github.com/okta/samples-nodejs-express-4/tree/master/okta-hosted-login) where you will inject your on-demand MFA.

## Enable a Factor in Okta

>Caution: If you are using the Developer Console, you need to first switch to the Admin Console (Classic UI). If you see Developer Console in the top left of the page, click it and select Classic UI to switch.

Before you configure an app in Okta to use multifactor, you must have at least one factor enabled. To do this, browse to: **Security > Multifactor**.

Select **Okta Verify** and switch the dropdown from **Inactive** to **Active**. Click **Edit** and check the `Enable Push Notification` and `Require TouchId for Okta Verify` checkboxes. Click **Save**.

{% img blog/transactional-mfa/okta-verify.png alt:"Okta Verify" width:"800" %}{: .center-image }

## Create a Custom SAML Application in Okta

In this example, you will be using a new early-access feature called [Step-up authentication with Okta Session](https://developer.okta.com/docs/reference/api/authn/#step-up-authentication-with-okta-session). This is a new feature that allows you to get a `stateToken` from Okta and use it as a parameter within the Okta Sign-In widget so that you can bootstrap the Okta Sign-In widget to do MFA automatically. If you don't have this feature enabled, I would suggest creating a support ticket to have this feature enabled on your Okta tenant.

To do this, you will need to create a custom SAML application.

Click **Applications** > **Applications**. Next, click **Add Application** > **Create New App** > **SAML 2.0**. Click **Create**.

{% img blog/transactional-mfa/create-new-application.png alt:"Create New Application" width:"800" %}{: .center-image }

Enter an **App name** value (I'm using `MFA as a Service`), then click **Next**.

{% img blog/transactional-mfa/create-saml-integration-one.png alt:"Create SAML Integration Step One" width:"800" %}{: .center-image }

Enter placeholder (`http://localhost:8080`) data on the **Single sign on URL** and **Audience URI** here as you actually will not use this data during the flow. This is required so that you can create the custom SAML application. Once done, click **Next**.

{% img blog/transactional-mfa/create-saml-integration-two.png alt:"Create SAML Integration Step Two" width:"800" %}{: .center-image }

In the last screen, you can select either radio button and click **Finish**.

You will be redirected to the **Application Sign On Policy Tab**. Scroll down and look for **App Sign-On Policy** and click **Add Rule**. This will allow you to create a sign on rule to challenge MFA every time. Enter a name, and under **Actions**, select **Prompt for Factor** and select **Every Sign On**. Click **Save**.

{% img blog/transactional-mfa/app-sign-on-rule.png alt:"App Sign On Rule" width:"800" %}{: .center-image }

Click the **General** Tab and scroll down until you see the **App Embed Link** section and click **Edit**. Enter the URL where you will host a separate widget that will do MFA as a service. In this example, I've created a basic Node.js web application and hosted it under `http://localhost:<port>`. Click **Save**. I will be using port 3000 for this blog post.

{% img blog/transactional-mfa/app-embed-link.png alt:"App Embed Link" width:"800" %}{: .center-image }

Click **Save**.

Take note of the embed link URL above which will be used later to trigger the transactional MFA process.

## Create a Node.js Express Application in Okta

For the remaining steps, you will need to switch back to the Dev UI Console, then click **Applications > Add Application**. Next, click **Web > Next**.

This will create an OpenID Connect application representing your Node.js application within Okta.

{% img blog/transactional-mfa/web-app.png alt:"Create Node Application" width:"800" %}{: .center-image }

You'll be presented with a screen to configure your Okta OpenID Connect application where you can change the name to "Node.js Express Application". As for the **Login redirect URIs** field, this will be the URL where you want to redirect the user to your authenticated page. You can leave the default: `http://localhost:8080/authorization-code/callback`.

Click **Done** when you're finished.

Note the *Client ID* and *Client Secret* by scrolling down below as you will need these to complete the Node.js Express OIDC configuration.

In this example, just use the default Authorization server which is already enabled by default within your Okta tenant. Navigate to: **API > Authorization Servers**.

{% img blog/transactional-mfa/default-auth-server.png alt:"Default Auth Server" width:"800" %}{: .center-image }

I will be using the [Node.js Express](https://github.com/okta/samples-nodejs-express-4/tree/master/okta-hosted-login) sample app as the sample application where the widget is used for authentication purposes.

To run this application, you first need to clone this repo and then enter into this directory:

```sh
git clone https://github.com/okta/samples-nodejs-express-4.git
cd samples-nodejs-express-4/
```

Then install dependencies:

```sh
npm install
```

Now you need to gather the following information from the Okta Developer Console:

- Client ID and Client Secret - This can be found on the "General" tab of your application that you created earlier.
- Issuer - This is the URL of the authorization server that will perform authentication. All developer accounts have a "default" authorization server. The issuer is a combination of your Org URL (found in the upper right of the console home page) and `/oauth2/default`. For example, `https://dev-1234.okta.com/oauth2/default`.

These values must exist as environment variables. They can be exported in the shell, or saved in a file named `testenv`, at the root of the repository.

```properties
ISSUER=https://yourOktaDomain.com/oauth2/default
CLIENT_ID=123xxxxx123
CLIENT_SECRET=AbcxxxxAbc
```

With variables set, start the app server:

```sh
npm run okta-hosted-login-server
```

Now navigate to `http://localhost:8080` in your browser.
If you see a homepage that prompts you to log in, then things are working! Clicking the login button will redirect you to the Okta hosted sign-in page.
You can log in with the same account that you created when signing up for your developer account at Okta, or you can use a known username and password from your Okta Directory.

Edit the `common/views/profile.mustache` view so that you can inject a new HTML link that can be used to trigger the transactional MFA process. Look for the `</body>` section in the bottom part of the file and inject the following code before it:

{% raw %}
```html
    {{>server-config}}
    <a href="<embedded SAML link url from the top of the post>">Transact with MFA</a>
  </div>
</body>
```
{% endraw %}

## Setup a Separate Widget to do MFA as a Service

Instead of using the same web application, I've decided to create a separate Node.js application to represent my MFA as a service widget such that later on, if there are any other applications who need to use this capability, then it can be extended for other usages as well. You would need to do the same steps mentioned above.

The redirect uri should be set back to this mini-application: `http://localhost:3000`

{% img blog/transactional-mfa/mfa-app.png alt:"Default Auth Server" width:"800" %}{: .center-image }

Take note of the Client ID only.

You'll need to assign users to this application. Click the **Assignments** tab. Click **Assign > Assign to Groups**. Click **Assign** next to `Everyone`. Click **Done**.

Create a sample html project via npm using the following commands:

```sh
npm install -g create-html-project
create-html-project my-project-name
```

In the `app/index.html` which is auto-generated as a boilerplate during the create html project process, paste the following code:

```html
<html>
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width,initial-scale=1, maximum-scale=1, minimum-scale=1">
      <meta name="description" content="">
      <meta name="keywords" content="">
      <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <title>Website Title</title>
      <link rel="icon" type="image/png" sizes="16x16" href="">
      <link rel="stylesheet" href="style/style.css">
  </head>
  <body>
    <h1>Welcome to HTML Boilerplate</h1>
    <script src="script/main.js" defer="defer"></script>
    <script src="https://global.oktacdn.com/okta-signin-widget/3.2.0/js/okta-sign-in.min.js" type="text/javascript"></script>

    <link href="https://global.oktacdn.com/okta-signin-widget/3.2.0/css/okta-sign-in.min.css" type="text/css" rel="stylesheet"/> 
    <div id="widget-container"></div>

    <script nonce="okt@dev">
      var config = {
        baseUrl: 'https://dev-431282.okta.com',
        clientId: '0oa24ghg5BmyzkXaf4x6',
        redirectUri: 'http://localhost:3000',
        authParams: {
          issuer: 'https://dev-431282.okta.com/oauth2/default',
          pkce: true,
          display: 'page',
          scopes: ['openid', 'email', 'profile'],
        }
      };
      var str = window.location.search.substr(1);
      if (str) {
        config.stateToken = str.replace("stateToken=", "");
      }
      var signIn = new OktaSignIn(config);
      // detect redirect
      if (window.location.href.indexOf('#')) {
        signIn.authClient.token.parseFromUrl().then(function(tokens) {
          window.location.replace("https://i.ytimg.com/vi/jwg8LvOv6QQ/maxresdefault.jpg");
        });
      } else {
        // error
      }

      signIn.renderEl({
        el: '#widget-container'
      });
    </script>
  </body>
</html>
```

**NOTE**: You'll need to replace the `baseUrl`, `clientId`, and `issuer` above with the values from your own Okta org.

What's going on here is that the first time through, there will be a `stateToken` and the step-up MFA will be triggered. Once you've satisfied the factor requirement (such as acknowledging the push notification in Okta Verify), you're redirected back to this same page by virtue of the `redirectUri` defined above. The redirect includes the authorization code set by okta. The redirect is detected and the authorization code flow + pkce is completed by the widget:

```javascript
if (window.location.href.indexOf('#')) {
  signIn.authClient.token.parseFromUrl().then(function(tokens) {
    window.location.replace("https://i.ytimg.com/vi/jwg8LvOv6QQ/maxresdefault.jpg");
  });
} else {
  // error
}
```

## Set Up a Trusted Origin Entry for Your MFA Widget

Click **API** and then **Trusted Origins**. Next, click **Add Origin** and then **Save**.

{% img blog/transactional-mfa/okta-add-origin.png alt:"Okta Add Origin" width:"800" %}{: .center-image }

## Test Out Transactional MFA

Run the projects and try to access the hosted login page project via `http://localhost:8080`. Click **Login** and you will be redirected to `https://<subdomain>.okta.com`. Once authenticated, you should be redirected back to the `localhost:8080` authenticated page. Click the **My Profile** link on the side. 

{% img blog/transactional-mfa/my-profile-page.png alt:"My Profile Page" width:"800" %}{: .center-image }

Click **Transact with MFA**, you should be redirected to the separate MFA widget application you have created which will bootstrap the `stateToken` into the widget thus allowing you to challenge MFA automatically without the need to authenticate again.

{% img blog/transactional-mfa/mfa-challenge-screen.png alt:"MFA Challenge Screen" width:"800" %}{: .center-image }

After completing the MFA verification, the MFA widget will redirect you to the success page.

## Learn More About MFA and Okta

As you can see, the Okta Sign-In Widget can be extended to support outside the standard authentication scenarios. This allows you to reduce your development time in creating MFA or 2FA screens for your web application. The Okta Sign-In Widget also supports MFA enrollment as part of the capability which is also by default provided with the bootstrapping process above. I would like to end this with a modified note on Okta's developer home page which shows:

If you'd like to see similar content from our blog, check out these posts:

* [Use Okta Token Hooks to Supercharge OpenID Connect](/blog/2019/12/23/extend-oidc-okta-token-hooks)
* [Multi-Factor Authentication Sucks](/blog/2019/12/19/multi-factor-authentication-sucks)
* [Protecting Your APIs with OAuth](https://www.youtube.com/watch?v=8c1SOuO4mPc)

We'd love to hear from you in the comments below or follow us on [Twitter](https://twitter.com/oktadev) and subscribe to our [YouTube Channel](https://youtube.com/c/oktadev)!
