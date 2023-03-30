---
layout: blog_post
title: "How Authentication and Authorization Work for SPAs"
author: alisa-duncan
by: advocate
communities: [security, javascript]
description: "Authentication and authorization in public clients like single-page applications can be complicated! In this post, we'll walk through the Authorization Code flow with Proof Key for Code Exchange extension to better understand how it works and what do with the auth tokens you get back from the process."
tags: ["react", "angular", "vue", "oauth", "oidc"]
tweets:
- "Let's demystify authentication and authorization in single-page applications with this step-by-step explanation!"
image: blog/spa-auth-tokens/social.jpg
type: awareness
---

Adding authentication to public clients such as Single Page Applications (SPA) and JavaScript applications can be a source of confusion. Identity Providers like Okta try to help you via multiple support systems. Still, it can feel like a lot of work. Especially since you're responsible for way more than authentication alone in the applications you work on!

As part of authentication, your client application makes multiple calls to an Authorization server, and you get back several strings, which are tokens. Let's demystify what's going on behind the scenes and closely examine what those tokens are and how you use them within your client application.

{% include toc.md %}

## Authentication and Authorization using OAuth 2.0 + OpenID Connect (OIDC)
OAuth 2.0 with OIDC is the best practice for adding authentication and authorization to your software applications. Authentication verifies the identity of who you claim to be, and authorization verifies you have access to data you want to see or actions you want to perform. It is lightweight with less effort to set up and use than Security Assertion Markup Language (SAML), an alternate authentication and authorization mechanism that pre-existing systems may use. For newer systems, you'll want to use OAuth 2.0 + OIDC.

{% img blog/spa-auth-tokens/oauth-oidc-logos.jpg alt:"OAuth and OpenID Connect logos" width:"600" %}{: .center-image }

OAuth 2.0 handles authorization to resources, such as when your front-end application gets data from a backend API by making an HTTP request. OAuth 2.0 standards have the flexibility to support authorization across your entire application system through different flows and grant types. For example, different OAuth 2.0 flows support JavaScript-based front-end applications, for your APIs and back-end services to communicate, and even for IOT devices in your home automation system. OpenID Connect (OIDC) is an identity layer on OAuth 2.0 that provides standardized identity information.

## OAuth 2.0 + OIDC for JavaScript clients and SPA
SPAs and other JavaScript front-ends are public clients, meaning they can't maintain secret information for authorization, such as a Client Secret, a super secret value that traditional server-rendered web applications use for authorization. In both application types, we should use a flow called Authorization Code and an extension to the flow called Proof Key for Code Exchange (PKCE).

Let's see how this flow works step by step by following what happens when a cute dinosaur named Sunny prepares to sign in to the "Rawr" app.

{% img blog/spa-auth-tokens/flow-1-sign-in-start.jpg alt:"Sunny, a cute smiley dinosaur, is ready to sign in to the Rawr app" width:"800" %}{: .center-image }

The client application starts the process and generates a random, long string — the code verifier. Then it creates a code challenge from the code verifier. This step is part of the PKCE extension.

{% img blog/spa-auth-tokens/flow-2-client-pkce.jpg alt:"The client application processing the sign-in to create a code verifier and code challenge" width:"800" %}{: .center-image }

The client application holds on to the code verifier. It then makes an authorization code request to your authorization server, in this case, represented by Okta. The authorization code request includes the code challenge along with some critical pieces of information, such as
* Client ID
* Scopes, including at least the following:
  *  `openid` required for specifying the app uses OIDC in verifying the user's identity
  *  `profile` for accessing the user's profile information, such as their name
  *  `offline_access` to request a Refresh Token as part of this call
* Redirect URI for the callback location within the client application when sign-in is complete
* A random alphanumeric string for preventing Cross-Site Request Forgery (CSRF)

{% img blog/spa-auth-tokens/flow-3-authorization-code-request.jpg alt:"The client application making an authorization code request to the authorization server, Okta, with the information mentioned above" width:"800" %}{: .center-image }

The authorization server redirects the user, Sunny, to a web page it hosts to sign in and provide authorization consent.

{% img blog/spa-auth-tokens/flow-4-authorization-code-redirect.jpg alt:"The client application redirects to Okta hosted sign-in screen, and Sunny authenticates and grant consent" width:"800" %}{: .center-image }

Yay! Sign-in success! The authorization server returns an authorization code to the client application. 

{% img blog/spa-auth-tokens/flow-5-authorization-code-response.jpg alt:"The authorization server redirects back to the client application and returns an authorization code" width:"800" %}{: .center-image }

Now that there's an authorization code, the client application makes a request to the token endpoint of the authorization server and sends the authorization code and the code verifier. 

{% img blog/spa-auth-tokens/flow-6-token-request.jpg alt:"The client making a token request and sending the information listed above in the payload" width:"800" %}{: .center-image }

To process the token endpoint request the authorization server ensures the authorization code is still valid and that the code verifier matches the code challenge sent in the authorization request. This step is part of the PKCE extension.

{% img blog/spa-auth-tokens/flow-7-token-pkce.jpg alt:"The authorization server verifying the authorization code and the code verifier" width:"800" %}{: .center-image }

Yay! Success! The authorization server returns three tokens:
1. Access token
2. ID token
3. Refresh token

{% img blog/spa-auth-tokens/flow-8-token-response.jpg alt:"The authorization server responds to the token request with three tokens" width:"800" %}{: .center-image }

Now that Sunny successfully signed in, they can continue their rawring lessons!

{% img blog/spa-auth-tokens/flow-9-signed-in.jpg alt:"A happy dinosaur getting ready to start a lesson in how to rawr" width:"800" %}{: .center-image }


Now that you have these three tokens let's better understand what each one is for.

## Auth tokens in OAuth 2.0 + OIDC
These three tokens provide crucial information about your identity, access to resources, and the ability to stay authenticated securely.

### ID token
The ID token is about the user, so information about Sunny in this case. This authentication token is returned from the OpenID Connect layer. It contains standardized identity information such as email, name, and issuing party, called claims. The ID token may include extra claims for information critical to Sunny's identity, such as their dinosaur family, which is a Smileasaur of course.

### Access token
The access token is a key that grants access to data or to perform an action. This authorization token is returned from the OAuth layer. The token has metadata about the token itself, such as the issuing party, information about requested scopes made in the original request, and the expiration time. Access tokens are intentionally short-lived for public clients and are a safety mechanism since it guards access to resources, and it's dangerous if it falls into the wrong hands!

### Refresh token
The Refresh token allows us to exchange it for new, shiny tokens. This optional `offline_access` scope we added in the original authorization code request allows the access token to be short-lived but does not require Sunny to authenticate to get a new token repeatedly. Refresh tokens can be longer-lived than access tokens, but for public clients, the lifetime of Refresh tokens should also be short. We want to make sure bad actors can't get a hold of a Refresh token to gain access to an access token! For public clients like SPA, it's a best practice also to use **Refresh Token rotation**, which improves security by rotating refresh tokens after each use.

While each step of this OAuth flow to get the tokens is critical to ensure a secure authentication and authorization process, let's inspect the two requests in more detail. 

## Create an OAuth 2.0 + OIDC Compliant Authorization server

We'll start by setting up an authorization server in Okta and use the [OpenID Connect Debugger](https://oidcdebugger.com/) tool to inspect the Network requests. This authorization server is OAuth 2.0 and OIDC compliant so we can use it within applications that conform to those specs.

{% include setup/cli.md type="spa" loginRedirectUri="https://oidcdebugger.com/debug" %}

Make a note of the `Issuer` and `Client ID`. In the upcoming steps, you'll need those values to configure Okta in your SPA client.

## View the well-known endpoint for OIDC Discovery

Authorization servers have standard, public endpoints for discovery by clients. Let's take a peek at the OIDC discovery document.

The OpenID Connect specification requires a standardized mechanism for client discovery. You can find it at `{Issuer}/.well-known/openid-configuration`. Open up a browser tab to the OIDC discovery endpoint. It is also JSON formatted data that looks something like this:

{% img blog/spa-auth-tokens/well-known-oidc.jpg alt:"Example OIDC well-known discovery document" width:"800" %}{: .center-image }

In the discovery response, we have the endpoints for the authorization and token requests which we'll use in the following steps. We also have a user info endpoint to query for user information and endpoints to validate the ID token. If you find the property for `claims_supported`, you'll see the claims cover various identifying information about the user. 

## Debug the Authorization Code and Token requests 

We can see this OAuth flow using the [OpenID Connect Debugger](https://oidcdebugger.com/) tool. Open the site on a browser with good developer debugging capabilities. You'll see something like this:

{% img blog/spa-auth-tokens/oidc-debugger.jpg alt:"OIDC Debugger site showing form fields" width:"800" %}{: .center-image }

Some fields are pre-populated, which is helpful. Add the other key information needed:
* **Authorize URI (required)** - the authorize endpoint from the discovery doc
* **Client ID (required)** - the Client ID value from Okta CLI
* **Scope (required)** - `openid` is already added for us. Add `profile` and `offline_access` with spaces in between. The form field should look like `openid profile offline_access`.
* **Response type (required)** - select "Use PKCE?" to unlock a few new fields, but everything is auto-populated. The debugger discovers the token endpoint automatically for us. 😎

Open debugging tools in your browser to watch for redirection and network requests. You'll want to make sure you're preserving logs between page refreshes. 

At the bottom of the page, you'll see how the authorization code request is formed. Press **Send Request** to start the flow.

First, you'll authenticate using Okta if you still need to sign in by redirecting to an Okta-hosted sign-in page. Redirecting to the Identity Provider's hosted sign-in page is the best practice for security, so it's also a common practice you'll see across Identity Providers. Completing sign-in redirects you back to the OIDC debugger with a success message. You'll see the authorization code automatically exchanged for tokens.

{% img blog/spa-auth-tokens/oidc-debugger-success.jpg alt:"Authorization code and tokens returned in the OIDC Debugger upon successful sign-in" width:"800" %}{: .center-image }

The token format for ID tokens is JSON Web Token (JWT). The access token from Okta is also a JWT. JWT is an open standard (RFC 7519) that allows systems to exchange information in JSON format securely. They are compact and safe from modifications, but our tokens contain public information. Don't worry! They are secure, just not confidential. 

You can copy the access token or ID token value from the response and read the contents using a [JWT debugger](https://jwt.io/). 

{% img blog/spa-auth-tokens/jwt-inspection.jpg alt:"JWT inspection in the JWT debugger" width:"800" %}{: .center-image }

So this is cool, but what do we do with the tokens in our SPA? Let's bring these concepts into our front-end application.

## Add authentication to your SPA

First, we need an Okta OIDC application supporting our SPA's redirect URI. We could edit the existing OIDC Debugger application we created previously, or we can use a handy Okta CLI command to set everything up for us and to scaffold out a sample application in our preferred framework.

Use the following command in the terminal to get going quickly. There's a separate command for each Angular, React, and Vue.

**Angular**
```console
okta start angular
```

**React**
```console
okta start react
```

**Vue**
```console
okta start vue
```

Follow the instructions in the terminal to start the application. You should be able to sign in and sign out. Additionally, you can watch network requests for the calls it makes.

We don't have a refresh token by default. You can enable that in the Okta Admin Console. Navigate to the [Okta Developer site](https://developer.okta.com/) and sign in to your Okta organization. In the Admin Console, navigate to **Applications** > **Applications** and select the Okta application for the SPA you created. Edit the settings to enable **Refresh Token**. It automatically adds Refresh Token rotation. Save your changes.

If you still need to, open the SPA code in your favorite IDE. Depending on your framework, navigate to the `config.js` or `app.config.ts` file. You'll see the OIDC config and property for `scopes` where you will add `offline_access`. Your OIDC config looks something like this:

```json
{
    clientId: CLIENT_ID,
    issuer: ISSUER,
    redirectUri: window.location.origin + '/login/callback',
    scopes: ['openid', 'profile', 'email', 'offline_access']
}
```

Now try rerunning the SPA. If you inspect the network request, you'll see the refresh token too. You can see the tokens by looking at the contents of your Local Storage too.

## Use auth tokens in SPAs

Now that we have these tokens in our SPA, what do we do with them? Let a trusted OIDC library, such as the Okta SDKs, handle all the token requests and refresh them for us. Behind the scenes, the OIDC library is hard at work exchanging tokens.

{% img blog/spa-auth-tokens/refresh-token.jpg alt:"Refresh token call to the authorization server and returning new tokens" width:"800" %}{: .center-image }

We're primarily interested in the contents of the ID token and using the access token.

### How to use the access token
The access token gives us access to resources. That means we use access tokens in outgoing API requests that our application needs, like for Sunny to get their next rawring lesson.

{% img blog/spa-auth-tokens/access-token.jpg alt:"Sunny starting up a new lesson makes a call to the Rawr site's /lesson endpoint passing in the access token" width:"800" %}{: .center-image }

You'll send the access token as a Bearer token in the HTTP call's Authorization header. So in the case of Sunny, the outgoing HTTP call looks like this.

```http
GET /lessons
Authorization: Bearer access_token_value
```

You'll want to ensure you're not adding the access token to calls outside your system by maintaining an allowlist of origins that should include the token.

A great way to manage adding the Authorization header and the logic to verify the call matches the allowlist of origins is using an interceptor. Interceptors sit between your application and outgoing (or incoming) HTTP requests. Angular includes the concept of interceptors within the framework, and if you use Axios in Vue or React apps, you can configure interceptors there.

### How to use the ID token
Since the ID token contains user identity information, you can use it to start populating your user store and for supporting identifiers you need immediately, such as their name.

{% img blog/spa-auth-tokens/id-token.jpg alt:"Sunny looking at his profile in the Rawr app where they see their name, dinosaur family, and their avatar" width:"800" %}{: .center-image }

The Okta SDK automatically decodes the ID token so that we can use the claims without decoding the payload ourselves. But before we jump right into using the claims, the Okta SDK first validates the token signature, which helps ensure the token's integrity and that it hasn't been altered. Let's take a quick peek under the covers at what happens during this validation process.

Since this token is a JWT, we can rely on standard validation for JWTs for the validity of the token itself. Next, it will validate some claims in the payload, including:
 * `iss` - the issuer, which should match the original request. In the OIDC Debugger tool, we passed this in as the "Authorize URI"
 * `aud` - the audience, which should match the client ID of your Okta application
 * `nonce` - an arbitrary one-time value that should match the original request. In the OIDC Debugger tool, it was pre-populated for us.
 * `exp` and `iat` - the expiry time and issued at times, respectively. Only non-expired tokens with an expected issue time here, please!

Once you have the access token, you can also make a request to the OIDC Discovery document's User Info endpoint, which may contain more information about the user than what is available in your ID token. You may also need to add any user information and user settings from API calls within your system into your user store since the SPAs we write have complex user information.

## Learn more about OAuth, OIDC, tokens, and authentication best practices
Hopefully, this gives insight into how authentication and authorization with OAuth 2.0 + OpenID Connect work for public clients like SPAs and how each token fits into the landscape.

If you liked this post, you might want to check out the following:
* [The Identity of OAuth Public Clients](/blog/2022/06/01/oauth-public-client-identity)
* [Is the OAuth 2.0 Implicit Flow Dead?](/blog/2019/05/01/is-the-oauth-implicit-flow-dead)
* [The Things to Keep in Mind about Auth](/blog/2021/10/29/things-to-keep-in-mind-about-auth)
* [Quick JavaScript Authentication with OktaDev Schematics](blog/2022/10/14/quick-javascript-authentication)

Remember to follow us on [Twitter](https://twitter.com/oktadev) and subscribe to our [YouTube channel](https://www.youtube.com/c/OktaDev/) for more exciting content. We also want to hear about what tutorials you want to see. Leave us a comment below.
