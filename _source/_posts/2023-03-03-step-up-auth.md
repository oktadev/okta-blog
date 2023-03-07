---
layout: blog_post
title: "Step-up Authentication in Modern Applications"
author: indranil-jha
by: advocate
communities: [security]
description: "Understand and apply the principles of step-up authentication"
tags: []
tweets:
- ""
- ""
- ""
image: blog/step-up-auth/stepup.png
type: awareness
---

 Step-up authentication in an application is a pattern of allowing access to non-critical resources using basic level of authentication, and requiring additional authentications for critical resources.

In this article, we will explore the whys and hows of step-up authentication in modern applications that include Single Page Applications (SPA) and native mobile applications.

Federation protocols such as **OpenID Connect (OIDC)** are getting increasingly popular for modern applications to enhance security by trusting an appropriate identity provider. Here we will focus primarily on the **OIDC** standard and how it can be leveraged to provide the step-up functions in an idiomatic way.

### Why an application needs step-up authentication

> "Freedom, security, convenience -- choose two." - Dan Geer

Step-up authentication is useful in balancing between frictionless user experience and security.

In general, not all aspects of an application are equally critical. Prioritizing convenience over security for authentication to relatively non-critical resources can ensure a smoother user experience. When the user tries to access sensitive resources, additional scrutiny will ensure integrity and confidentiality. 

For example, while doing a fund transfer, user probably won't mind multi-factor authentication challenge; while they can otherwise browse the application for just checking balances and viewing offers without much friction.

Listed below are some real world scenarios where an application will typically challenge user with additional verification:

-   Update profile information

-   Forgot password

-   Purchase merchandise

-   Deposit checks

-   Transfer funds

-   Withdraw money from account

-   Making payments (Accounts Payable)

-   Update accounting information

-   Adjust payroll

-   Access salary data

-   Approve purchase orders

-   Access customer data

-   Update contracts

-   Add new person to the insurance

-   Access premium news articles

In general, actions that change data or reveal secret information will require a higher level of verification than the default for other operations.

### How did legacy applications handle this?

Traditionally applications have handled step-up authentication by building the functionality inside the application. The implementations waste engineering effort by missing an opportunity to reuse well-tested code, incur ongoing maintenance burden, and are prone to security loopholes.

Legacy access management solutions (*Siteminder*, *Oracle Access Manager*) mostly leverage agent-based reverse proxy architecture, and provide the step-up function by allowing to specify access policies based on HTTP URL paths. This architecture does not work well with modern SPA and mobile applications, since their application resources are not inherently URL based.

### Federation and step-up

Additionally, step-up authentication becomes tricky when [federation protocols](https://www.okta.com/identity-101/what-is-federated-identity/) such as **OIDC** and [**SAML**](https://www.okta.com/blog/2020/09/what-is-saml/) are used, since the standard federation protocols, unlike legacy reverse proxy solutions, do not track every user interaction with an application.

The applications then need to initiate the step-up scenarios by themselves. Fortunately, **OIDC** has specifications to help applications build such scenarios and co-ordinate with identity provider for seamless step-up service in a declarative policy driven fashion.

### Wait! Do you just want to re-authenticate?

Sometimes, a user is authenticated to a sufficient level when they first logged in, but the compromise for convenience is to allow long-lived sessions. In this case, re-authentication may be a more appropriate solution than step-up authentication. **OIDC** supports such scenario [implicitly](https://openid.net/specs/openid-connect-core-1_0.html).

In this case, the application will initiate a new authorization request with the identity provider. The request will have the value for the prompt parameter **login**. Then the authentication server will force re-authentication, even if there is an existing active session.

```
GET /authorize? 
	response_type=code 
	&scope=openid%20profile%20email 
	&client_id=****** &state=af0ifjsldkj 
	&redirect_uri=https%3A%2F%2Fclient.example.org%2Fcb 
	&prompt=login HTTP/1.1 
Host: server.example.com
```

### Elevate the session authentication level

Every time the user tries to access a sensitive area of an application, prompting for re-authentication introduces friction in user experience. To properly strike a balance between smooth user experience and security considerations, the technique of **session elevation** can be adopted.

The idea is to maintain a basic assurance level for a user session after user initially authenticates to the application. 

-   When the user accesses a sensitive resource, she is prompted for step-up authentication using additional authentication factors. 

-   Once step-up is successful, the user session is moved to a higher assurance level for a specified duration of time. 

-   Next time she accesses the sensitive area within the stipulated period, since her session is already at the elevated level, no more authentication challenge is presented, ensuring a relatively frictionless user experience.

With **OIDC**, this behavior is achievable using the `acr_values` and `max_age` parameters of the authentication request.

The following diagram steps through the sequence of access-

{% img blog/step-up-auth/request-timing.png  alt:"timing of authentication and re-authentication" width:"800" %}


-   The acr_values parameter will have the assurance level requested for a session. 

    -   If there is an existing session with a lower level of assurance, the authentication server will prompt the user for additional factors needed to satisfy the requested level of assurance. 

    -   If the session is already at the requested level or higher, the authentication server will proceed without any additional user challenge.

-   The max_age parameter will keep the session elevated only for the stipulated duration. This is useful in scenario such as allowing access to sensitive resources, for say next 30 minutes, before it goes back to the previous assurance level.

```
GET /authorize? 
	response_type=code 
	&prompt=login 
	&scope=openid%20profile%20email 
	&client_id=****** 
	&state=af0ifjsldkj 
	&redirect_uri=https%3A%2F%2Fclient.example.org%2Fcb 
	&acr_values=phr 
	&max_age=30 HTTP/1.1 
Host: server.example.com\
```

#### How Okta can help

##### Okta Customer Identity Cloud (CIC)

-   Okta CIC comes with a flexible and extensible authentication engine, which can easily inspect `acr_values` in the authentication request and initiate step-up authentication. 

-   CIC recommends using the `acr_values` as defined in [this](https://openid.net/specs/openid-provider-authentication-policy-extension-1_0.html) OIDC spec. See [this example](http://schemas.openid.net/pape/policies/2007/06/multi-factor) for more detail.

-   CIC can be configured to provide [step-up authentication](https://auth0.com/docs/secure/multi-factor-authentication/step-up-authentication) for both [web applications](https://auth0.com/docs/secure/multi-factor-authentication/step-up-authentication/configure-step-up-authentication-for-web-apps) and [API](https://auth0.com/docs/secure/multi-factor-authentication/step-up-authentication/configure-step-up-authentication-for-apis)

##### Okta Workforce Identity Cloud (WIC)

-   WIC Authorization server has inbuilt support for step-up authentication. 

-   Currently, WIC supports a pre-defined [list](https://developer.okta.com/docs/guides/step-up-authentication/main/#predefined-parameter-values) of acr_values. 

-   The non-okta-specific defined values such as phr and phrh are taken from [this](https://openid.net/specs/openid-connect-eap-acr-values-1_0.html#OpenID.PAPE) OIDC spec. 

-   [This guide](https://developer.okta.com/docs/guides/step-up-authentication/main/) explains the capability in more detail.

### How about transactional MFA?

Transactional MFA is a close cousin of step-up authentication. In some step-up cases, transactional MFA can be used instead.

Consider the scenario- 

-   User authenticates to the application

-   At some point the user tries to access a sensitive resource

-   User receives a push notification or email link in her mobile to approve the transaction

-   Once approved, the access is granted to the resource

Recent standards like [OIDC CIBA](https://openid.net/specs/openid-client-initiated-backchannel-authentication-core-1_0.html) allows this kind of out-of-band transactional MFA and might in some cases meet the need to step-up authentication. 

One important difference is, while **CIBA** can be used to provide MFA during sensitive transaction, it typically does not affect any provider specific session. Also, **CIBA** is inherently out-of-band, and has its own niche uses. 

### Additional resources

Okta CIC Blog: ​[![](https://cdn.auth0.com/website/auth0_favicon.svg)What Is Step-Up Authentication? When To Use It Over MFA or Adaptive Auth?](https://auth0.com/blog/what-is-step-up-authentication-when-to-use-it)
