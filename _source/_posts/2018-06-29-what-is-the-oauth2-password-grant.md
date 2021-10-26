---
disqus_thread_id: 6761331762
discourse_topic_id: 16891
discourse_comment_url: https://devforum.okta.com/t/16891
layout: blog_post
title: "What is the OAuth 2.0 Password Grant Type?"
author: aaron-parecki
by: advocate
communities: [security]
description: "The Password Grant Type is a way to get an OAuth access token given a username and password."
tags: [oauth, what-is-oauth]
tweets:
- "What is the #oauth2 Password Grant Type? Read @aaronpk's article here:"
- "Ever wondered what the #oauth2 Password Grant Type is for? We've got you covered."
- "What the heck is the OAuth Password Grant Type?"
- "Thinking about using the OAuth Password Grant Type? Read this first:"
type: awareness
---

The OAuth 2.0 Password Grant Type is a way to get an access token given a username and password. It's typically used only by a service's own mobile apps and is not usually made available to third party developers.

<div style="padding: 18px; border: 1px #007dc1 solid; background: #dbeffb; border-radius: 6px;">
Update: The password grant type is prohibited in the latest <a href="https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics-13#section-3.4">OAuth 2.0 Security Best Current Practice</a>. Please see <a href="https://oauth.net/2/grant-types/password/">oauth.net</a> for additional information.
</div>

This post is the third in a series where we explore frequently used OAuth 2.0 grant types. Previously we covered the [Authorization Code](/blog/2018/04/10/oauth-authorization-code-grant-type) and [Implicit](/blog/2018/05/24/what-is-the-oauth2-implicit-grant-type) grant type. If you want to back up a bit and learn more about OAuth 2.0 before we get started, check out [What the Heck is OAuth?](/blog/2017/06/21/what-the-heck-is-oauth).

## What is an OAuth 2.0 Grant Type?

In OAuth 2.0, the term "grant type" refers to the way an application gets an access token. OAuth 2.0 defines several grant types, including the Password grant. OAuth 2.0 extensions can also define new grant types.

Each grant type is designed for a particular use case, whether that's a web app, a mobile or desktop app, or server-to-server applications.

## The OAuth 2.0 Password Grant

The Password grant is one of the simplest OAuth grants and involves only one step: the application presents a traditional username and password login form to collect the user's credentials and makes a POST request to the server to exchange the password for an access token. The POST request that the application makes looks like the example below.

```http
POST /oauth/token HTTP/1.1
Host: authorization-server.com
Content-type: application/x-www-form-urlencoded

grant_type=password
&username=exampleuser
&password=1234luggage
&client_id=xxxxxxxxxx
```

The POST parameters in this request are explained below.

* `grant_type=password` - This tells the server we're using the Password grant type
* `username=` - The user's username that they entered in the application
* `password=` - The user's password that they entered in the application
* `client_id=` - The public identifier of the application that the developer obtained during registration
* `client_secret=` - (optional) - If the application is a "confidential client" (not a mobile or JavaScript app), then the secret is included as well.
* `scope=` - (optional) - If the application is requesting a token with limited scope, it should provide the requested scopes here.

The server replies with an access token in the same format as the other grant types.

```json
{
  "access_token": "MTQ0NjOkZmQ5OTM5NDE9ZTZjNGZmZjI3",
  "token_type": "bearer",
  "expires_in": 3600,
  "scope": "create"
}
```

## When to use the Password Grant Type?

The Password grant requires that the application collect the user's password. This is of course the exact problem that OAuth was created to avoid in the first place. So why is the Password grant included as part of OAuth?

The original reason the Password grant was added to OAuth was to allow pre-OAuth applications to upgrade to OAuth without any user interaction. 
When HTTP Basic Auth was commonly used, the way that worked was the browser would ask for the user's password and store it internally, then present it to the web server on every request. There are many limitations with this approach, which is why it hasn't been commonly in use in over a decade. The theory with the Password grant was to allow browsers to upgrade to OAuth seamlessly by exchanging the user's password for an access token, then continuing to use the access token in the future.
In practice, this is not what happened, and many app developers misinterpreted the Password grant as an acceptable way to use OAuth from mobile apps. Today, the <a href="https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics-13#section-3.4">OAuth 2.0 Security Best Current Practice</a> effectively removes the Password grant from OAuth.

## Learn More About OAuth and Okta

You can learn more about OAuth 2.0 on [OAuth.com](https://www.oauth.com/oauth2-servers/access-tokens/password-grant/), or check out any of these resources to get started building!

* [What is the OAuth 2.0 Authorization Code Grant Type?](/blog/2018/04/10/oauth-authorization-code-grant-type)
* [Token Authentication in ASP.NET Core 2.0 - A Complete Guide](/blog/2018/03/23/token-authentication-aspnetcore-complete-guide)
* [Secure your SPA with Spring Boot and OAuth](/blog/2017/10/27/secure-spa-spring-boot-oauth)
* [Build Secure Node Authentication with Passport.js and OpenID Connect](/blog/2018/05/18/node-authentication-with-passport-and-oidc)

Check out [Okta's OIDC/OAuth 2.0 API](/docs/reference/api/oidc/) for specific information on how we support OAuth. And as always, follow us on Twitter [@oktadev](https://twitter.com/oktadev) for more great content.

**PS**: If you're interested in other interesting security articles, please check out our new [security site](https://sec.okta.com/)!
