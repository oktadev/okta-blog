---
layout: blog_post
title: "Enabling Cross App Access for SAML-Based Enterprise Apps"
author: sohail-pathan
by: advocate
communities: [javascript,security,python,.net,java,go]
description: "Learn how to secure agent-to-app connections using Cross App Access (XAA) with SAML SSO for SAML-based enterprise apps."
tags: [xaa, saml, sso, cross-app-access]
tweets:
  - ""
  - ""
  - ""
  - ""
image: blog/cross-app-access-saml/social.jpg
type: awareness
---

If you currently federate enterprise customers using Security Assertion Markup Langage (SAML) and want to allow AI agents to access your API without migrating to OpenID Connect (OIDC), this Cross App Access (XAA) guide is for you.

The [Identity Assertion Authorization Grant specification](https://datatracker.ietf.org/doc/draft-ietf-oauth-identity-assertion-authz-grant/), the basis of XAA, was originally designed with OIDC in mind. To use it in SAML applications, you must accommodate specific security and uniqueness requirements. This guide details what you need to support and how to verify SAML-derived claims at your resource authorization server.

**Table of Contents**{: .hide }
* Table of Contents
{:toc}

## How XAA in SAML works

When an agent (like one running in Claude) needs API access, it presents an **Identity Assertion Authorization Grant (ID-JAG)**. The ID-JAG is a short-lived JSON Web Token (JWT) issued by the customer's Identity Provider (IdP) for your authorization server. Your resource server accepts the token, identifies the user, and issues your own access token, all while leaving the customer's existing SAML integration untouched.

The sequence diagram shown below describes the SAML XAA flow. Notice that the SAML SSO flow stays the same; the only change is the section highlighted with the comment "Your Resource Authorization Server (AS): redeem and resolve". You'll make a `POST` request to your resource's authorization server with the ID-JAG, resolve the `NameID` to return an access token that you'll use for resource requests.

{% img blog/cross-app-access-saml/xaa-saml-sequence-diagram.svg alt:"Sequence diagram showing SAML SSO between the user and Okta IdP, two OAuth token exchanges producing a refresh token and then an ID-JAG, and the resource authorization server redeeming the ID-JAG and resolving the SAML NameID before issuing an access token used to call the API." width:"800" %}{: .center-image }

{% comment %}
Tweak the diagram on https://mermaid.live/ with the following content
%%{init: {'themeVariables': {'fontSize': '18px'}}}%%
sequenceDiagram
    participant U as User (alice@atko.com)
    participant C as Client (AI Agent)
    participant IDP as Okta IdP
    participant RAS as Your Resource AS
    participant RS as Your API

    U->>IDP: SAML SSO
    C->>IDP: Token Exchange #1 (subject_token_type=saml2, requested_token_type=refresh_token)
    IDP-->>C: Refresh Token
    C->>IDP: Token Exchange #2 (subject_token_type=refresh_token, requested_token_type=id-jag)
    IDP-->>C: ID-JAG (aud=your AS, sub_id=saml-nameid)

    rect rgb(240,180,41)
    Note over C,RAS: Your Resource AS: redeem and resolve
    C->>RAS: POST /token with ID-JAG assertion
    RAS->>RAS: Validate and resolve SAML NameID
    RAS-->>C: Your access token
    end

    C->>RS: API call with access token
    RS-->>C: Resource
{% endcomment %}

> ⚠️ **Note**
>
> You are not processing SAML here. The only artifact crossing from the IdP to your domain is the ID-JAG. All SAML-related tasks, such as SSO, assertion handling, and subject derivation, happen upstream. Your responsibility is to validate the ID-JAG, redeem it for an access token, and resolve the user from the claims.

## Analyzing the ID-JAG claims

When you decode the ID-JAG, you'll see claims in the header and payload that impact how you process the access request:

```json
// header
{
  "typ": "oauth-id-jag+jwt",
  ...
}

// payload
{
  "iss": "https://atko.okta.com",
  "sub": "00u1a2b3c4D5e6F7g8h9",
  "sub_id": {
    "format": "saml-nameid",
    "issuer": "http://www.okta.com/exk1fcia8zMValiD0h8",
    "nameid": "alice@atko.com",
    "nameid_format": "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress",
    "sp_name_qualifier": "https://chat.example/saml/metadata"
  },
  "aud": "https://auth.chat.example",
  "client_id": "0oa8claudeMcpAtYourAS",
  "email": "alice@atko.com",
  "scope": "chat:read chat:write",
  "jti": "id-jag-7f3c9a21b8",
  ...
}
```
Focus on these key claims noted in the decoded ID-JAG payload:

* **`sub_id`**: This is the primary field for user resolution  
* **`aud`**: Indicates the endpoint URL for the resource authorization server  
* **`client_id`**: This is the client's ID at your resource authorization server, which might differ from its ID at the IdP   
* **`email`**: Recommended by the specification for just-in-time provisioning if the user has not yet signed in  
* **`jti`**: This is the unique ID for the ID-JAG JWT that prevents replay attacks within the validity window 

## XAA implementation checklist for SAML-federated applications

To fully support Cross App Access, implement these five steps in sequence:

1. [Match the full `NameID` value to resolve user identity](#mapping-user-identity-in-the-saml-nameid-attribute)  
2. [Validate ID-JAG claims and bind the issuer](#validating-the-id-jag-and-resolving-the-user)  
3. [Issue an access token from your authorization server](#issuing-the-access-token)  
4. [Update your discovery document to include XAA support](#updating-authorization-server-metadata)  
5. [Configure your Okta tenant](#configuring-your-okta-org-for-cross-app-access)

### Mapping user identity in the SAML `NameID` attribute

Unlike OIDC apps, which typically resolve users from the `sub` claim, SAML-federated apps do not have a corresponding `sub` claim in their SAML assertion. Consequently, they often lack a direct way to map users without using the `sub_id` field.

You must compare every member of the `saml-nameid` identifier used as a subject key for a given SAML issuer. Do not resolve based on the `NameID` alone unless your local policy permits it.

The `NameID` field alone doesn't uniquely identify a user, since two organizations could each have an employee named Alex Chen. This problem is analogous to resolving user uniqueness in multi-tenant applications.

Resolve on `NameID` + `sp_name_qualifier` together; the combination of both fields provides the unique user identity required.

> ⚠️ **Note**
>
> Don't assume the `NameID` is an email address; it is whatever the customer's SSO emits. Your matching set must remain consistent across your deployment.

### Validating the ID-JAG and resolving the user

The client posts the ID-JAG as a JWT authorization grant and authenticates with its credentials at your server. Below is an example HTTP request for requesting an `access_token`

```http
POST /oauth2/v1/token HTTP/1.1
Host: chat.example
Authorization: Basic <base64(client_id:client_secret)>
Content-Type: application/x-www-form-urlencoded
grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer
&assertion=eyJ0eXAiOiJvYXV0aC1pZC1qYWcrand0...
```

Before processing, you must bind the ID-JAG's `iss` to a registered SAML connection to prevent forgery.

If you verify the signature before checking the issuer binding, an attacker could potentially create their own IdP, sign a token, and use your customer's SAML issuer as the `sub_id`. 

Always resolve the connection from the `iss` first, then verify the signature against that connection's key. You'll compare this using the JSON Web Key Set (JWKS) metadata.  

{% img blog/cross-app-access-saml/idjag-validation-order.jpeg alt:"ID-JAG validation order" width:"800" %}{: .center-image }

Below is the pseudocode for implementing the validation and resolving a user:

```python
connections = {
  "https://atko.okta.com": {
    jwks:            "https://atko.okta.com/oauth2/v1/keys",
    samlIssuer:      "http://www.okta.com/exk1fcia8zMValiD0h8",
    spNameQualifier: "https://chat.example/saml/metadata",
  },
}

redeem(idJag, authenticatedClient):
    // 1. Bind iss to a connection before trusting the signature.
    iss  = unverified_issuer(idJag)
    conn = connections[iss]
    if conn is none: reject "invalid_grant"

    // 2. Verify signature against the specific issuers JWKS.
    payload = verify_jwt(idJag, jwks = conn.jwks)
    if payload is invalid: reject "invalid_grant"

    // 3-5. Perform remaining checks.
    require payload.typ       == "oauth-id-jag+jwt"
    require payload.aud       == "resource_authorization_server_url"
    require payload.client_id == authenticatedClient.id

    user  = resolveSamlSubject(payload.sub_id, conn)
    scope = applyScopePolicy(user, payload.scope)
    return issueAccessToken(user, scope)

resolveSamlSubject(subId, conn):
    require subId and subId.format == "saml-nameid"
    require subId.issuer == conn.samlIssuer
    require subId.sp_name_qualifier == conn.spNameQualifier

    user = lookup_user_by_saml_nameid(subId.issuer, subId.nameid, subId.sp_name_qualifier)
    if user is none: reject "invalid_grant"
    return user
```

### Issuing the access token

Once you resolve the user, issue an `access_token` scoped according to your local policy. Below is an example of an `access_token` returned after successfully validating the ID-JAG and resolving the user.

```http
HTTP/1.1 200 OK
Content-Type: application/json;charset=UTF-8
Cache-Control: no-store

{
  "token_type": "Bearer",
  "access_token": "2YotnFZFEjr1zCsicMWpAA",
  "expires_in": 86400,
  "scope": "chat:read chat:write"
}
```

> ⚠️ **Note**
>
> Do not issue a refresh token. If your authorization server issues a refresh token, the client has durable access to your resource server, and the IdP cannot revoke access.
>
> The ID-JAG replaces the need for a refresh token. On access token expiry, the client resubmits the same ID-JAG to your token endpoint, and you mint a new access token against it. Only once the ID-JAG itself expires does the client request a new ID-JAG from the IdP using its own refresh token.

### Updating authorization server metadata

Clients locate your XAA support via your authorization server metadata (`/.well-known/oauth-authorization-server`). Ensure you include the supported fields:

```json
{
  "issuer": "https://chat.example",
  "token_endpoint": "https://auth.chat.example/oauth2/v1/token",
  "grant_types_supported": [
    "urn:ietf:params:oauth:grant-type:jwt-bearer"
  ],
  "authorization_grant_profiles_supported": [
    "urn:ietf:params:oauth:grant-profile:id-jag"
  ]
}
```

### Configuring your Okta org for Cross App Access

Cross App Access is an early access feature in Okta. Integrator Free Plan account types include XAA support. If the following options are missing in your Okta org, contact your representative.

* **Enable XAA:** 

  1. In your Okta org, open the Admin Console, then navigate to **Applications** > **Applications**, then go to the **Resource Server** tab. 

  2. Select the **Enable XAA** checkbox and enter your resource authorization server issuer URL. This value becomes the `aud` claim in the ID-JAG and cannot be changed without deleting and resetting the connection.  

  {% img blog/cross-app-access-saml/enable-xaa-resource-server.jpeg alt:"Enable XAA in Okta" width:"800" %}{: .center-image }

* **Set the `NameID`:**   

  1. In your SAML app's **General > SAML Settings**, set **Name ID Format** to match your existing identifier 

  2. Ensure **Sign On > Application username format** resolves to that same identifier (e.g., Email, Active Directory (AD) attribute)

  {% img blog/cross-app-access-saml/saml-nameid-settings.jpeg alt:"Set NameID in Okta" width:"800" %}{: .center-image }

## Making cross-application requests from your SAML app securely

With these five steps complete, your SAML application is configured for Cross App Access. Agents can now authorize requests against your API while maintaining your existing production federation, eliminating the need for protocol migration.

## Takeaways for implementors who have both OIDC and SAML apps

If you have already implemented XAA in your OIDC apps, here's a quick checklist to convert your SAML apps:

* The subject comes from `sub_id` in `saml-nameid` format, rather than `sub`  
* Match on every `saml-nameid` member (`issuer` + `NameID` + `sp_name_qualifier`), rather than just `iss` and `sub`  
* Everything else, including token issuance rules and redemption checks, remains as is

## Learn more about Cross App Access, SAML, and OAuth 2.0

If this guide helped you implement Cross App Access with SAML, explore these resources:

- 📘 [Cross App Access Documentation](https://help.okta.com/oie/en-us/content/topics/apps/apps-cross-app-access.htm): Official guides for configuring and managing Cross App Access in production.  
- 🎙️ [Developer Podcast on MCP and Cross App Access](https://www.youtube.com/watch?v=qKs4k5Y1x_s): Hear the backstory, use cases, and why this matters for developers.

**Identity 101:**

- [What's the Difference Between OAuth, OpenID Connect, and SAML?](https://www.okta.com/identity-101/whats-the-difference-between-oauth-openid-connect-and-saml/)  
- [What are SAML, OAuth, and OIDC?](https://www.okta.com/en-in/identity-101/saml-vs-oauth/)  
- [Why You Should Migrate to OAuth 2.0 From Static API Tokens](https://www.okta.com/identity-101/why-you-should-migrate-to-oauth-2-0-from-static-api-tokens/)  
- [How to Get Going with the On-Demand SaaS Apps Workshops](/blog/2023/07/27/enterprise-ready-getting-started)

Follow us on [LinkedIn](https://www.linkedin.com/company/oktadev) and [X](https://x.com/oktadev), and subscribe to our [YouTube](https://www.youtube.com/c/OktaDev/) channel. Leave a comment below if you have any questions\!
