---
layout: blog_post
title: "Introducing the Implicit Flow Detector"
author: micah-silverman
by: advocate
communities: [security, oauth, oidc, openid connect, oauth2]
description: ""
tags: [security, tokens, flows, oauth2, oidc]
tweets:
- ""
- "🔒"
- ""
image: blog/introducing-implicit-flow-detector/implicit-flow-detector.png
type: awareness
---

{% img blog/introducing-implicit-flow-detector/implicit-flow-detector.png alt:"implicit flow detector" width:"400" %}

OpenID Connect (OIDC) and OAuth 2.0 are the best current standards for securing authentication and authorization in web-based applications. But, OAuth 2.0 (on which OpenID Connect is built), has been around for quite a while. Developments in browser technologies as well as security service providers have outpaced the standards. As a result, certain ways of using the standards are no longer recommended.

The good news is that extensions to these standards provide a much more secure way to still get the benefit without the security risks.

In this post, I get into some of the mechanics of OAuth 2.0, a bit about the standards process, and ways to mitigate your risk.

The TL;DR is the [Implicit Flow Detector](https://implicitdetector.io/) is a browser extension that alerts you when the websites you navigate to are using a deprecated part of OIDC and OAuth 2.0.

{% img blog/introducing-implicit-flow-detector/implicit-detected.png alt:"implicit flow detector" %}

## A Ridiculously Short Overview of OAuth 2.0 and OpenID Connect

For a more in-depth look at OAuth 2.0 and OIDC how it works, check out these posts:

* ref 1
* ref 2
* ref 3

The "big deal" of OAuth 2.0 is that it provides a mechanism where you can allow a third-party access to your data without ever having to give that third-party your password for the service that holds that data.

For example, imagine you want to give Yelp access to your Google Contacts so you can connect with your friends on Yelp. In "the bad old days", you'd supply Yelp with your email address and password for your gmail account and Yelp would essentially masquerade as you using those credentials and read your contacts.

This was like using a sledge hammer on a finishing nail. Ideally, I want (a) Yelp to have read-only access to my contacts and (b) to be able to revoke that access at any time.

Once Yelp has my password, they can read and write my contacts, send email as me, access my google docs, etc. I can't really revoke access, short of changing my password.

OAuth addresses this by providing a mechanism to coordinate interactions between the parties involved: Myself, Yelp, Google and the Google Contacts API. A rough overview of one such interaction is: 

* I go to Yelp and tell it to get my Google Contacts. 
* Yelp sends me to Google (which is where my password id supposed to go). 
* Google sends a digital assertion back to Yelp (called an access token). 
* Yelp uses the access token to call an endpoint of the Contacts API. 
* The Contacts API inspects the access token to make sure it's valid, not expired and that the request Yelp is making is allowed by me. 
* The Contacts API returns my contacts to Yelp. 

Yelp gets my contacts without ever seeing my Google password.

OAuth refers to these types of interactions as a `flow`.

The OAuth `access token` is called a **bearer token**. That means that whatever entity is in possession of it can use it without their identity being verified. This is a lot like how we interact with hotels. The hotel room door lock mechanism is concerned with verifying that the key is not expired and is intended for it. But, the lock doesn't verify who you are. If I hand the key to my wife, she can open the door just as well as I can. **Because access tokens are bearer tokens, it's vitally important that they not be leaked**.

Whereas OAuth 2.0 is concerned with authorizing applications to interact with APIs on my behalf, OIDC is concerned with authentication and single-signon. It's a thin layer that rides on top of OAuth 2.0. While OAuth 2.0 was intended to be a standard for authorization, many companies started using it for concerns of authentication in a proprietary way. This led to confusion and a derth of custom one-off implementations. OIDC wrangled all that back into a standard.

OIDC uses the same flows as OAuth 2.0 since it builds on top of it.

## OAuth 2.0 Flows

The primary OAuth 2.0 flows are:

| Flow | Purpose |
|------|---------|
| Authorization Code | Server-based web apps (Spring Boot, .NET, Node.js, etc) |
| Client Credentials | non-user based interactions (microservices architecture) |
| Implicit Flow | **(deprecated)** Browser based / Single Page web apps (React, Vue.js, Angular, jQuery, etc.) |
| Resource Owner Password Credentials | **(deprecated)** First-party applications (credentials are not passed outside of primary domain) |

Because of limitations with what Javascript could do in the browser and limitations of OAuth providers, the Implicit Flow used to be the only way to use OAuth for browser based apps.

Without getting into the weeds of how the Implicit flow works, the main problem is that the access token is passed back to the application via the user's browser address bar. This is a particularly vulnerable part of the flow as it's easy to scrape via malicious browser extensions or javascript running on the page.

The Authorization Code flow does not ever pass access tokens via the browser address bar. However, it requires the use of a shared secret between the service (like Google) and the application (like Yelp). It's not safe to store a secret in a javascript browser application, like Angular or Vue.js. That's why in the past, the only option was the Implicit flow.

## Authorization Code Flow + PKCE to the Rescue

Part of the OAuth 2.0 specification includes the ability to add extensions without having to redefine the whole specification. Ideally, these extensions are themselves standards. One such extension called [Proof Key for Code Exchange](https://tools.ietf.org/html/rfc7636) (PKCE - pronouned "pixie") was originally created for mobile apps and is now suitable for use in all browsers for JavaScript and Single-Page Apps (SPA).

In summary, the important part of PKCE for browser apps is that it allows the use of the Authorization Code flow by providing a mechanism to have a dynamic secret created in the JavaScript app (like, a Yelp Anuglar app) that is verifiable by the service (like Google) and not subject to leaking or discovery by browser extensions or other malicious JavaScript. This extension with OAuth is called the Authorization Code + PKCE flow and is the recommended replacement for the Implicit flow.

## OAuth 2.0 Service Providers are in a Pickle

Providers like [Okta](https://developer.okta.com) and Google make it super easy to use the PKCE flow and even to update existing Implicit flow apps to use this more secure flow. All OAuth 2.0 providers discourage the use of the Implicit flow.

With Okta, for instance, you simply need to make sure you're using the latest version of the [Okta SignIn Widget](https://github.com/okta/okta-signin-widget#usage-examples) and to **remove** existing Implicit flow configuration. PKCE is now the default, so removing configuration will automatically switch to that flow.

However, Okta and other providers still support the Implicit flow. If it's so insecure, why would a company like Okta still support it? There are both business reasons and practical, standards based reasons.

Providers want to ensure that they won't break customers' existing code. If they were to suddenly turn off the Implicit flow altogether, many existing applications would stop working.

Also, the way the standards process works, it takes time to relase a new version. As a result, the OAuth Working Group release Security Best Current Practice (BCP) documents from time-to-time. These are important guidelines for how to handle the changing landscape of Internet technology in between releases of a standard. In 2019, two such BCP's were released that (among other things) say: don't use the Implicit flow, use the Authorization Code + PKCE flow instead.

But, it puts providers like Okta, Google and others in a bit of a gray area in implementing these recommendations. Okta chose to address the issue by:

1. Making PKCE the default
2. Updating documentation to address the concerns of using the Implicit flow
3. Making it easy to switch Implicit flow apps

The OAuth 2.1 specification was recently adopted by the OAuth Working Group and will take some time to be released. It seeks to consolidate a number of OAuth 2.0 extensions into the specification (including PKCE) and to completely eliminate the Implicit flow, among other outdated flows.

When OAuth 2.1 is release and Okta becomes fully OAuth 2.1 compliant, the Implicit flow will no longer be an option. But, this is at least months and likely a year or more away.

As developers and security professionals, we need to be vigilant and employ best practices.

## Introducing the Implicit Flow Detector

The [Implicit Flow Detector](https://implicitdetector.io/) is a browser extension (available for Google Chrome and its variants as well as Firefox) that alerts you when the websites you navigate to are using a deprecated part of OAuth 2.0.

It provides a list of websites that are using the Implicit flow and even shows you the tokens it has captured.

{% img blog/introducing-implicit-flow-detector/implicit-detected.png alt:"implicit flow detector" %}

While the Implicit Flow Detector extension stops there, a malicious browser extension *could* make use of the captured tokens to gain access to your data and, in some cases, even make changes to that data.

At Okta, we're encouraging saavy consumers, developers and security professionals to make use of this browser extension by alerting website administrators when you encounter sites that are using the Implicit flow.

Also, you shouldn't just take our word for the benign nature of this extension. It's an [open-source Github project](https://github.com/oktadeveloper/okta-implicit-flow-detector) you can inspect for yourself. We welcome issues and pull requests submitted through Github.

If you'd like to see it in action, you can browse to: [https://okta-oidc-fun.herokuapp.com](https://okta-oidc-fun.herokuapp.com), where we've purposefully left the Implicit flow enabled for testing and learning purposes.

Take a deeper look at OpenID Connect and OAuth 2.0 with these posts:

* ref 1
* ref 2
* ref 3

If you enjoyed this blog post and want to see more like it, follow [@oktadev](https://twitter.com/oktadev) on Twitter, subscribe to [our YouTube channel](https://youtube.com/c/oktadev), or follow us on [LinkedIn](https://www.linkedin.com/company/oktadev/). As always, please leave your questions and comments below. We love to hear from you!