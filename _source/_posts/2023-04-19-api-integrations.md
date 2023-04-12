---
layout: blog_post
title: "Selecting the Best Authorization for Your API Integrations"
author: [alisa-duncan, edunham]
by: advocate
communities: [security]
description: "API calls require authorization. How do you select the best authorization mechanism? This post lists out the different authorization options and answers which mechanism is the best!"
tags: [apis, integrations, oauth]
tweets:
- "Call your APIs securely using best authorization mechanisms. Read on to find out more!"
image: blog/api-integrations/social.jpg
type: awareness
---

Integrating with an API lets you power up your code by knowing what the API knows and doing what the API can do. The catch is that most APIs can't and shouldn't let just anybody access your important resources. Just as humans log in to access resources, programs accessing APIs must obtain proper authorization. 

Your application can use three types of authorization mechanisms when calling Okta APIs from your Okta integration, each with its pros and cons:
  1. API Tokens
  2. OAuth
  3. API Integration Services

Let's better understand the three types, how they work, and when to use them.

{% include toc.md %}

## API Tokens

If you've connected with APIs before, you've probably copied a token and pasted it into the Authorization header of your HTTP request. Token authorization has several notable drawbacks for authorizing, including when connecting to Okta APIs. 

You can create API tokens from the Okta Admin Console. The Admin Console only shows you the token value upon creation, so you'll need to capture the value and securely persist it in a credentials manager. When you use the API token, you'll add it to the Authorization header of the call using the proprietary `SSWS` scheme. 

```http
GET /api/v1/groups?limit=10 HTTP/1.1
Authorization: SSWS api_token
Accept: application/json
Host: dev-1234567.okta.com
```

When an Okta user creates an API token, it has all of the user's permissions, which are rarely the best choice for an automated workflow. The user represented by the token becomes a single point of failure:
  * The automation may break if their permissions are reduced, or the user leaves the organization.
  * If the user's permissions are increased, the automation may silently gain the ability to cause unexpected problems if it has a bug.

All Okta API tokens automatically expire after being unused for 30 days to mitigate the security risks of old tokens falling into the wrong hands. A user can revoke tokens at any time from the Admin Console, and deleting no longer needed tokens is a good idea.

**Considerations for using API tokens**

It can be tempting to create a service account in Okta and use an API token from the service account, but this approach only moves the underlying problem rather than solving it. Managing access to the service account is complex, and mistakes can cause problems wherever the service account has access. Additionally, if the service account's token accidentally becomes publicized, anyone who gets the token can impersonate the service account. 

**When to use API tokens**

Due to these constraints, API tokens are never the preferred authorization method for Okta's APIs. If you're ever in a situation where you "have to" use API tokens in production because OAuth or a service integration won't work, we'd love to hear about it! Let us know in the comments below, or discuss the challenges with your Okta representative. 

## OAuth Client Credentials

OAuth has a standard flow for machine-to-machine communication called Client Credentials, the preferred way for processes without user input to communicate to Okta APIs. Using OAuth mechanisms enables you to use a well-known standardized format with fantastic support in libraries, frameworks, and languages of your choice. You can create an API Services application in the Okta Admin Console or use the [Okta CLI](https://cli.okta.com/).

If you haven't used OAuth Client Credentials before, a quick overview is as follows:
  1. You'll create the Okta API Services application and configure the Okta API Scopes you want this application to have. When you make the Okta application, you'll receive a Client ID and a Client Secret to add to your Okta configuration in your program.
  2. Your program calls the authorization server's token endpoint to exchange the Client ID and Client Secret for an access token. The access token contains the Okta API Scopes allowed. There may be [Okta SDKs](https://developer.okta.com/code/) that help support this token call for you, depending on your language and framework.
  > **Note**
  > If you have a custom authorization server, such as when you use a developer preview org, then you'll have to send a signed JSON Web Token (JWT) using a JSON Web Key Set (JWKS). Read more about how to do this on the [Implement OAuth for Okta](https://developer.okta.com/docs/guides/implement-oauth-for-okta-serviceapp/main/) developer documentation.
  3. When you use the access token to call Okta APIs, you'll add the token to the Authorization header using the `Bearer` scheme.

```http
GET /api/v1/groups?limit=10 HTTP/1.1
Authorization: Bearer access_token
Accept: application/json
Host: dev-1234567.okta.com
```

**Considerations with using OAuth for integrations**

The preferred method is using OAuth to call Okta APIs from private integrations or internal processes. It's more secure, and using widely available standards makes the calling process require less manual code. You'll configure the scopes you want the process to access, which aren't tied to a specific user. But it is a 2-step process to make the API call as first you'll need to get the access token.

But, if you're planning on creating an Okta integration publicly available on the [Okta Integration Network (OIN)](https://developer.okta.com/docs/guides/okta-integration-network/), you'll want to a better mechanism for making your integration application more discoverable to potential customers. When you have a public integration, you delegate scope configuration to the consumer. There's a temptation to either allow too much access or, conversely, limit access, causing frustrations that your integration needs fixes to work as intended.  

**When to use OAuth authorization for integrations**

You should use OAuth as the preferred authorization mechanism. Use OAuth when you are creating an internal integration process.

## API Integration Services

API Integration Services have all of the advantages of OAuth authorization, with the added ability for discoverability for public integrations! You'll use the standard OAuth Client Credentials flow, which means you can use libraries that support it for your framework/language. Plus, you'll define the scopes you need to ensure you have the ones required for running your integration and provide transparent assurance to consumers on the permissions you require and those you don't require. When they understand the access levels, consumers may feel comfortable adding integrations to their organization.

You'll create the machine-to-machine process, test it locally, and then submit the integration to the OIN for public consumption. Okta customer administrators will see all available API Service Integrations in the Okta Admin Console. They can find the integration they want to add, review the requested scopes, and authorize it. They receive a Client ID and Client Secret that they provide to you, the integration provider, along with the Okta Domain so you can make the calls to retrieve the access token.

**Considerations with using API Integration Services**

You'll use standard OAuth flows, so you'll have a secure authorization mechanism, but it is a 2-step process to get the access token. You'll also need to define the scopes you need beforehand, which will help customers feel more comfortable using your integration.

**When to use API Integration Services**

Use API Integration Services when you create machine-to-machine integration for general use within the OIN. You'll have security, discoverability, and clarity for the users when you use this approach.

## Decide which API authorization mechanism to use

When calling Okta APIs, we recommend using API Integration Services first, then OAuth, and finally API Tokens as shown in the following flowchart:

{% img blog/api-integrations/flowchart.jpg alt:"If you are building a public integration, use API Services Integration, otherwise use OAuth. Lastly use an API Token if there are no other options." width:"800" %}{: .center-image }

## Learn more about connecting to Okta APIs using OAuth Client Credentials

API tokens are the simplest, but this simplicity makes them too limited for production applications' security and reliability needs. OAuth client credentials require more understanding to set up but scale indefinitely for internal use. And for code intended for use outside your organization, API Service Integrations built on top of OAuth maximize flexibility and control.

If you found this post interesting, you might find these resources useful:

* [Secure Your .NET 6 Web API](/blog/2022/04/20/dotnet-6-web-api)
* [How to Use Client Credentials Flow with Spring Security](/blog/2021/05/05/client-credentials-spring-security)
* [Implement authorization by grant type](https://developer.okta.com/docs/guides/implement-grant-type/clientcreds/main/)
* [Build an API service integration](https://developer.okta.com/docs/guides/build-api-integration/main/)

Don't forget to follow us on [Twitter](https://twitter.com/oktadev) and subscribe to our [YouTube channel](https://www.youtube.com/c/OktaDev/) for more great content. We'd also love to hear from you! Please comment below if you have any questions or want to share what topic you'd like to see next. Also, feel free to share your experience connecting to Okta APIs. We want to ensure our developers have the necessary resources and good experience integrating with Okta!