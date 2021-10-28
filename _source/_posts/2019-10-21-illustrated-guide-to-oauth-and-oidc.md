---
disqus_thread_id: 7685782586
discourse_topic_id: 17152
discourse_comment_url: https://devforum.okta.com/t/17152
layout: blog_post
title: "An Illustrated Guide to OAuth and OpenID Connect"
author: david-neal
by: advocate
communities: [security]
description: "An illustrated guide to explain OAuth and OpenID Connect!"
tags: [oauth, oidc, openid-connect, security, authorization, authentication]
tweets:
- "Want to learn about OAuth and OpenID Connect? Try this entertaining illustrated guide from @reverentgeek! #OAuth #OIDC #SSO #security"
- "What is OAuth 2.0 and OpenID Connect? Check out this entertaining illustrated guide from @reverentgeek! #OAuth #OIDC #SSO #security"
- "🤩 An introduction to OAuth 2.0 and OpenID Connect that's actually fun to read?! 🤩 #OAuth #OIDC #SSO #security"
image: blog/illustrated-guide-to-oauth-and-oidc/illustrated-guide-to-oauth-and-oidc.jpg
type: awareness
---

In the "stone age" days of the Internet, sharing information between services was easy. You simply gave your username and password for one service to another so they could login to your account and grab whatever information they wanted!

{% img blog/illustrated-guide-to-oauth-and-oidc/shady-budget-planner.jpg alt:"Shady Budget Planner" width:"800" %}{: .center-image }

Yikes! You should never be required to share your username and password, your _credentials_, to another service. There's no guarantee that an organization will keep your credentials safe, or guarantee their service won't access more of your personal information than necessary. It might sound crazy, but some applications still try to get away with this!

Today we have an agreed-upon standard to securely allow one service to access data from another. Unfortunately, these standards use a lot of jargon and terminology that make them more difficult to understand. The goal of this post is to explain how these standards work using simplified illustrations.

You can think of this post as the worst children's book ever. You're welcome.

{% img blog/illustrated-guide-to-oauth-and-oidc/illustrated-guide-to-oauth-and-oidc-post.jpg alt:"The Illustrated Guide to OAuth and OpenID Connect" width:"600" %}{: .center-image }

By the way, this content is also available as a [video](https://www.youtube.com/watch?v=t18YB3xDfXI)!

<div style="text-align: center; margin-bottom: 1.25rem">
<iframe width="700" height="394" style="max-width: 100%" src="https://www.youtube.com/embed/t18YB3xDfXI" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</div>

## Ladies and Gentlemen, Introducing OAuth 2.0

[OAuth 2.0](https://oauth.net/2/) is a security standard where you give one application permission to access _your data_ in another application. The steps to grant permission, or _consent_, are often referred to as _authorization_ or even _delegated authorization_. You authorize one application to access your data, or use features in another application on your behalf, without giving them your password. Sweet!

As an example, let's say you've discovered a web site named "Terrible Pun of the Day" and create an account to have it send an awful pun joke as a text message every day to your phone. You love it so much, you want to share this site with everyone you've ever met online. Who wouldn't want to read a bad pun every day, am I right?

{% img blog/illustrated-guide-to-oauth-and-oidc/terrible-pun-of-the-day.jpg alt:"Terrible Pun of the Day" width:"600" %}{: .center-image }

However, writing an email to every person in your contacts list sounds like a lot of work. And, if you're like me, you'll go to great lengths to avoid anything that smells like work. Good thing "Terrible Pun of the Day" has a feature to invite your friends! You can grant "Terrible Pun of the Day" access to your email contacts and send out emails for you! OAuth for the win!

{% img blog/illustrated-guide-to-oauth-and-oidc/authorize-tpotd-contacts.jpg alt:"Authorize Terrible Pun of the Day to Access Your Contacts" width:"800" %}

1. Pick your email provider
1. Redirect to your email provider and login if needed
1. Give "Terrible Pun of the Day" permission to access to your contacts
1. Redirect back to "Terrible Pun of the Day"

> In case you change your mind, applications that use OAuth to grant access also provide a way to revoke access. Should you decide later you no longer want your contacts shared, you can go to your email provider and remove "Terrible Pun of the Day" as an authorized application.

### Let the OAuth Flow

You've just stepped through what is commonly referred to as an OAuth _flow_. The OAuth flow in this example is made of visible steps to _grant consent_, as well as some invisible steps where the two services agree on a secure way of exchanging information. The previous "Terrible Pun of the Day" example uses the most common OAuth 2.0 flow, known as the "authorization code" flow.

Before we dive into more details on what OAuth is doing, let's map some of the OAuth terminologies.

<table>
<tr>
    <td>{% img blog/illustrated-guide-to-oauth-and-oidc/resource-owner.jpg alt:"Resource Owner" width:"200" %}</td>
    <td markdown="span">**Resource Owner**: You! You are the owner of your identity, your data, and any actions that can be performed with your accounts.</td>
</tr>
<tr>
    <td>{% img blog/illustrated-guide-to-oauth-and-oidc/client.jpg alt:"Client" width:"200" %}</td>
    <td markdown="span">**Client**: The application (e.g. "Terrible Pun of the Day") that wants to access data or perform actions on behalf of the **Resource Owner**.</td>
</tr>
<tr>
    <td>{% img blog/illustrated-guide-to-oauth-and-oidc/authorization-server.jpg alt:"Authorization Server" width:"200" %}</td>
    <td markdown="span">**Authorization Server**: The application that knows the **Resource Owner**, where the **Resource Owner** already has an account.</td>
</tr>
<tr>
    <td>{% img blog/illustrated-guide-to-oauth-and-oidc/resource-server.jpg alt:"Resource Server" width:"200" %}</td>
    <td markdown="span">**Resource Server**: The Application Programming Interface (API) or service the **Client** wants to use on behalf of the **Resource Owner**.</td>
</tr>
<tr>
    <td>{% img blog/illustrated-guide-to-oauth-and-oidc/redirect-uri.jpg alt:"Redirect URI" width:"200" %}</td>
    <td markdown="span">**Redirect URI**: The URL the **Authorization Server** will redirect the **Resource Owner** back to after granting permission to the **Client**. This is sometimes referred to as the "Callback URL."</td>
</tr>
<tr>
    <td>{% img blog/illustrated-guide-to-oauth-and-oidc/response-type.jpg alt:"Response Type" width:"200" %}</td>
    <td markdown="span">**Response Type**: The type of information the **Client** expects to receive. The most common Response Type is `code`, where the **Client** expects an **Authorization Code**.</td>
</tr>
<tr>
    <td>{% img blog/illustrated-guide-to-oauth-and-oidc/scope.jpg alt:"Scope" width:"200" %}</td>
    <td markdown="span">**Scope**: These are the granular permissions the **Client** wants, such as access to data or to perform actions.</td>
</tr>
<tr>
    <td>{% img blog/illustrated-guide-to-oauth-and-oidc/consent.jpg alt:"Consent" width:"200" %}</td>
    <td markdown="span">**Consent**: The **Authorization Server** takes the **Scopes** the **Client** is requesting, and verifies with the **Resource Owner** whether or not they want to give the **Client** permission.</td>
</tr>
<tr>
    <td>{% img blog/illustrated-guide-to-oauth-and-oidc/client-id.jpg alt:"Client ID" width:"200" %}</td>
    <td markdown="span">**Client ID**: This ID is used to identify the **Client** with the **Authorization Server**.</td>
</tr>
<tr>
    <td>{% img blog/illustrated-guide-to-oauth-and-oidc/client-secret.jpg alt:"Client Secret" width:"200" %}</td>
    <td markdown="span">**Client Secret**: This is a secret password that only the **Client** and **Authorization Server** know. This allows them to securely share information privately behind the scenes.</td>
</tr>
<tr>
    <td>{% img blog/illustrated-guide-to-oauth-and-oidc/authorization-code.jpg alt:"Authorization Code" width:"200" %}</td>
    <td markdown="span">**Authorization Code**: A short-lived temporary code the **Client** gives the **Authorization Server** in exchange for an **Access Token**.</td>
</tr>
<tr>
    <td>{% img blog/illustrated-guide-to-oauth-and-oidc/access-token.jpg alt:"Access Token" width:"200" %}</td>
    <td markdown="span">**Access Token**: The key the client will use to communicate with the **Resource Server**. This is like a badge or key card that gives the **Client** permission to request data or perform actions with the **Resource Server** on your behalf.</td>
</tr>
</table>

> Note: Sometimes the "Authorization Server" and the "Resource Server" are the same server. However, there are cases where they will _not_ be the same server or even part of the same organization. For example, the "Authorization Server" might be a third-party service the "Resource Server" trusts.

Now that we have some of the OAuth 2.0 vocabulary handy, let's revisit the example with a closer look at what's going on throughout the OAuth flow.

{% img blog/illustrated-guide-to-oauth-and-oidc/tpotd-authorization-code-flow.jpg alt:"Terrible Pun of the Day Authorization Code Flow" width:"800" %}

1. You, the **Resource Owner**, want to allow "Terrible Pun of the Day," the **Client**, to access your contacts so they can send invitations to all your friends.
1. The **Client** redirects your browser to the **Authorization Server** and includes with the request the **Client ID**, **Redirect URI**, **Response Type**, and one or more **Scopes** it needs.
1. The **Authorization Server** verifies who you are, and if necessary prompts for a login.
1. The **Authorization Server** presents you with a **Consent** form based on the **Scopes** requested by the **Client**. You grant (or deny) permission.
1. The **Authorization Server** redirects back to **Client** using the **Redirect URI** along with an **Authorization Code**.
1. The **Client** contacts the **Authorization Server** directly (does not use the **Resource Owner**'s browser) and securely sends its **Client ID**, **Client Secret**, and the **Authorization Code**.
1. The **Authorization Server** verifies the data and responds with an **Access Token**.
1. The **Client** can now use the **Access Token** to send requests to the **Resource Server** for your contacts.

### Client ID and Secret

Long before you gave "Terrible Pun of the Day" permission to access your contacts, the Client and the Authorization Server established a working relationship. The Authorization Server generated a Client ID and Client Secret, sometimes called the App ID and App Secret, and gave them to the Client to use for all future OAuth exchanges.

{% img blog/illustrated-guide-to-oauth-and-oidc/client-auth-server-id-secret.jpg alt:"Client receives the Client ID and Client Secret from the Authorization Server" width:"600" %}{: .center-image }

As the name implies, the Client Secret must be kept secret so that only the Client and Authorization Server know what it is. This is how the Authorization Server can verify the Client.

## That's Not All Folks... Please Welcome OpenID Connect

OAuth 2.0 is designed only for _authorization_, for granting access to data and features from one application to another. [OpenID Connect](https://openid.net/connect/) (OIDC) is a thin layer that sits on top of OAuth 2.0 that adds login and profile information about the person who is logged in. Establishing a login session is often referred to as _authentication_, and information about the person logged in (i.e. the **Resource Owner**) is called _identity_. When an Authorization Server supports OIDC, it is sometimes called an _identity provider_, since it _provides_ information about the **Resource Owner** back to the **Client**.

OpenID Connect enables scenarios where one login can be used across multiple applications, also known as _single sign-on_ (SSO). For example, an application could support SSO with social networking services such as Facebook or Twitter so that users can choose to leverage a login they already have and are comfortable using.

{% img blog/illustrated-guide-to-oauth-and-oidc/fleamail-sso.jpg alt:"FleaMail SSO" width:"800" %}

The OpenID Connect flow looks the same as OAuth. The only differences are, in the initial request, a specific scope of `openid` is used, and in the final exchange the **Client** receives both an **Access Token** and an **ID Token**.

{% img blog/illustrated-guide-to-oauth-and-oidc/tpotd-oidc-example.jpg alt:"Terrible Pun of the Day OIDC Example" width:"800" %}

As with the OAuth flow, the OpenID Connect **Access Token** is a value the **Client** doesn't understand. As far as the **Client** is concerned, the **Access Token** is just a string of gibberish to pass with any request to the **Resource Server**, and the **Resource Server** knows if the token is valid. The **ID Token**, however, is very different.

### Jot This Down: An ID Token is a JWT

An **ID Token** is a specifically formatted string of characters known as a JSON Web Token, or JWT. JWTs are sometimes pronounced "jots." A JWT may look like gibberish to you and me, but the **Client** can extract information embedded in the JWT such as your ID, name, when you logged in, the **ID Token** expiration, and if anything has tried to tamper with the JWT. The data inside the **ID Token** are called _claims_.

{% img blog/illustrated-guide-to-oauth-and-oidc/tpotd-examining-id-token.jpg alt:"Terrible Pun of the Day Examines an ID Token" width:"800" %}

With OIDC, there's also a standard way the **Client** can request additional _identity_ information from the **Authorization Server**, such as their email address, using the **Access Token**.

## Learn More About OAuth and OIDC

That's OAuth and OIDC in a nutshell! Ready to dig deeper? Here are some additional resources to help you learn more about OAuth 2.0 and OpenID Connect!

* [What the Heck is OAuth?](/blog/2017/06/21/what-the-heck-is-oauth)
* [Nobody Cares About OAuth or OpenID Connect](/blog/2019/01/23/nobody-cares-about-oauth-or-openid-connect)
* [Implement the OAuth 2.0 Authorization Code with PKCE Flow](/blog/2019/08/22/okta-authjs-pkce)
* [What is the OAuth 2.0 Grant Type?](/blog/2018/06/29/what-is-the-oauth2-password-grant)
* [OAuth 2.0 From the Command Line](/blog/2018/07/16/oauth-2-command-line)
* [Build a Secure Node.js App with SQL Server](/blog/2019/03/11/node-sql-server)

As always, feel free to leave comments below. To make sure you stay up to date with our latest developer guides and tips follow us on [Twitter](https://twitter.com/oktadev) and subscribe to our [YouTube Channel](https://www.youtube.com/c/oktadev)!
