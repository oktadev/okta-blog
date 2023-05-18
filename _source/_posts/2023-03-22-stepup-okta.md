---
layout: blog_post
title: "Step-Up Authentication Examples With Okta"
author: indranil-jha
by: advocate
communities: [security,mobile]
description: "Understand Step Up Authentication in Okta's Workforce Identity Cloud"
tags: []
tweets:
- ""
- ""
- ""
image: blog/step-up-okta/stepup.jpg
type: awareness
---

# Step-up Authentication with Okta Workforce Identity Cloud

Step-up authentication in an application is a pattern of allowing access to non-critical resources using a basic level of authentication, and requiring additional authentication for critical resources. This offers a balance between frictionless user experience and security in an application.

There are several methodologies to provide the functionality as discussed [here](/blog/2023/03/08/step-up-auth). 

In this article we will explore few ways [Okta Workforce Identity Cloud (WIC)](https://www.okta.com/workforce-identity/) can support step-up authentication in an application.


## Modern Application using OpenID Connect (OIDC)

### Using ACR values

WIC supports the `acr_values` (Authentication Context Class Reference values) parameter as defined in [OIDC specification](https://openid.net/specs/openid-connect-core-1_0.html#AuthorizationEndpoint) to provide the step-up authentication functionality.  

**Scenario**

* An application is using **OIDC** for authentication- It can be a web application, single page application (SPA) or native mobile application.

* A basic assurance level for a user session must be maintained after user initially authenticates to the application.

* When the user accesses a sensitive resource, she should be prompted for step-up authentication using additional authentication factors.

* Once step-up is successful, the user session should move to a higher assurance level for a specified duration of time.  

* Next time the sensitive resource is accessed within the stipulated period, no more challenges should be presented, ensuring a relatively frictionless user experience.


**Solution**

* With **OIDC**, the above behavior is achievable using `acr_values` and `max_age` parameters of the `/authorize` endpoint. 

* WIC has in-built support for these parameters. The behavior is available in both [redirect](https://developer.okta.com/docs/concepts/redirect-vs-embedded/#redirect-authentication) and [embedded deployment models](https://developer.okta.com/docs/concepts/redirect-vs-embedded/#embedded-authentication), and is supported by both [Org](https://developer.okta.com/docs/concepts/auth-servers/#org-authorization-server) and [Custom](https://developer.okta.com/docs/concepts/auth-servers/#custom-authorization-server) authorization servers.

* The following diagram describes how WIC processes `acr_values` during `/authorize` call:


{% img blog/step-up-okta/1-step-up-authentication-acr-flow.jpg alt:"ACR flow diagram" width:"800" %}

* Currently WIC supports a pre-defined [list](https://developer.okta.com/docs/guides/step-up-authentication/main/#predefined-parameter-values) of `acr_values`. These values are mapped to assurance levels supported in WIC [authentication policies](https://help.okta.com/oie/en-us/Content/Topics/identity-engine/policies/about-app-sign-on-policies.htm).

* The non-Okta-specific defined values such as `phr` and `phrh` are taken from [this](https://openid.net/specs/openid-connect-eap-acr-values-1_0.html#OpenID.PAPE) OIDC spec. 

* [This guide](https://developer.okta.com/docs/guides/step-up-authentication/main/) explains the capability in more detail.

* **Limitation**: Currently it is not possible to define custom `acr_values` 


**Implementation**

Authentication API example, requesting step-up authentication. Note the `acr_values` and `max_age` parameters in the API:

```
https://${yourOktaDomain}/oauth2/default/v1/authorize?client_id={clientId}
&response_type=code
&scope=openid
&redirect_uri=https://${yourOktaDomain}/authorization-code/callback
&state=296bc9a0-a2a2-4a57-be1a-d0e2fd9bb601
&acr_values=urn:okta:loa:2fa:any
&max_age=30
```

[Okta Auth JS SDK](https://github.com/okta/okta-auth-js) equivalent of the above API: 

```
oktaAuth.signInWithRedirect(
{acrValues: urn:okta:loa:2fa:any, maxAge: 0}
);  
```

Refer to this [sample app](https://github.com/indranilokg/WIC/tree/main/Step%20Up%20Authentication) for a complete working example.


### Re-authenticate (only)

**Scenario**

* An application is using **OIDC** for authentication- It can be a web application, single page application (SPA) or native mobile application.

* Every time the user accesses a sensitive area of an application, she needs to be prompted for re-authentication.

**Solution**

**OIDC** supports such a scenario [implicitly](https://openid.net/specs/openid-connect-core-1_0.html). 

* The application will initiate a new OIDC authorization request with WIC. 

* The request will have the value for the `prompt` parameter **login**. 

* WIC will then force re-authentication (even if there is an existing session).


**Implementation**

Authentication API example, requesting re-authentication. Note the `prompt` parameter in the API:

```
https://${yourOktaDomain}/oauth2/default/v1/authorize?client_id={clientId}
&response_type=code
&scope=openid
&redirect_uri=https://${yourOktaDomain}/authorization-code/callback
&state=296bc9a0-a2a2-4a57-be1a-d0e2fd9bb601
&prompt=login
```

[Okta Auth JS SDK](https://github.com/okta/okta-auth-js) equivalent of the above API:

```
oktaAuth.signInWithRedirect({prompt: "login"}); 
``` 

Refer to this [sample app](https://github.com/indranilokg/WIC/tree/main/Step%20Up%20Authentication) for a complete working example.

## Factor API

What about applications that don't use OIDC? 

**Scenario**

* A web, desktop, or native application is not using OIDC to integrate with WIC.

* A secure middleware/business layer is available to the application, such as in 3-tiered web applications.

**Solution**

* WIC supports standalone authenticator/factor operations through the [factor API](https://developer.okta.com/docs/reference/api/factors/). Applications can leverage those factor APIs to implement step-up authentication. 

* A secure middleware/business layer is needed for server-side processing. This is because the factor APIs are privileged and need to use a static [Okta API token](https://help.okta.com/en-us/Content/Topics/Security/API.htm). The API tokens used need to be properly protected. [Here](https://developer.okta.com/books/api-security/api-keys/) are some guidelines on API token security.

**Implementation**

* Grab the Okta User ID

Typically, the user id is available from the ID token issued during authentication process (`sub` claim), or through [user management API](https://developer.okta.com/docs/reference/api/users/#list-users) 

``` 
{
    "family_name": "Silverman",
    "given_name": "Indranil",
    "locale": "en-US",
    "name": "Jha",
    "preferred_username": "myemail@myemaildomain.com",
    "sub": "00u9vme99nxudvxZA0h7",
    "updated_at": 1490198843,
    "zoneinfo": "America/Los_Angeles"
}
``` 
``` 
curl -v -X GET \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-H "Authorization: SSWS ${api_token}" \
"https://${yourOktaDomain}/api/v1/users?search=profile.login+eq+%22login%40example.com%22"
``` 

* Find the Factor ID for the enrolled user

The Factor ID is available from the [factor management API](https://developer.okta.com/docs/reference/api/factors/#list-enrolled-factors)

``` 
curl -v -X GET \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-H "Authorization: SSWS ${api_token}" \
"https://${yourOktaDomain}/api/v1/users/00u15s1KDETTQMQYABRL/factors"
``` 

* Example: Issue an SMS Factor challenge

``` 
curl -v -X POST \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-H "Authorization: SSWS ${api_token}" \
-d '{
}' "https://${yourOktaDomain}/api/v1/users/00u15s1KDETTQMQYABRL/factors/smsszf1YNUtGWTx4j0g3/verify"
```

* Example: Verify an SMS Factor challenge

```
curl -v -X POST \
-H "Accept: application/json" \
-H "Content-Type: application/json" \
-H "Authorization: SSWS ${api_token}" \
-d '{
  "passCode": "123456"
}' "https://${yourOktaDomain}/api/v1/users/00u15s1KDETTQMQYABRL/factors/smsszf1YNUtGWTx4j0g3/verify"
```



## Okta Access Gateway

**Scenario**

* Legacy web application supporting header based authentication 

* The application is integrated with WIC leveraging [Okta Access Gateway(OAG)](https://www.okta.com/products/access-gateway/) Web Access Management (WAM) solution

**Solution**

* OAG can enforce step-up authentication for sensitive resources by cleverly crafting the [advanced policies](https://help.okta.com/oag/en-us/Content/Topics/Access-Gateway/advanced-oag-policy-development.htm)


## Transactional MFA

Transactional MFA is a close cousin of step-up authentication. In some step-up cases, transactional MFA can be used instead.

**Scenario**

* User authenticates to the application. 

* At some point the user tries to access a sensitive resource.

* User receives a push notification in her mobile to approve the transaction. 

* Once approved, the access is granted to the resource.

**Solution**

Okta supports the above transactional MFA scenario using [OIDC Client-Initiated Backchannel Authentication Flow (CIBA)](https://developer.okta.com/docs/guides/configure-ciba/main/)

We will look at CIBA based scenario in more detail in a later article.


## In summary

Whether you application is using modern protocols such as OpenID Connect or built from legacy technologies, Okta's Workforce Identity Cloud can help you prompt users to step-up their authentication only when necessary for accessing sensitive resources. 

Use your [Okta Developer Account](https://developer.okta.com/signup/) to test different step-up authentication flows and determine which is best for your application!
