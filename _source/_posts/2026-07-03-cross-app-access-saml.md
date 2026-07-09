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
changelog:
  - 2026-07-09: Added the steps to set up the requestor and in Okta and generate a conformance report.
---

If you currently federate enterprise customers using Security Assertion Markup Language (SAML) and want to allow AI agents to access your API without migrating to OpenID Connect (OIDC), this Cross App Access (XAA) guide is for you.

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

- [How XAA in SAML works](#how-xaa-in-saml-works)
- [Analyzing the ID-JAG claims](#analyzing-the-id-jag-claims)
- [XAA implementation checklist for SAML-federated applications](#xaa-implementation-checklist-for-saml-federated-applications)
  - [Mapping user identity in the SAML `NameID` attribute](#mapping-user-identity-in-the-saml-nameid-attribute)
  - [Validating the ID-JAG and resolving the user](#validating-the-id-jag-and-resolving-the-user)
  - [Issuing the access token](#issuing-the-access-token)
  - [Updating authorization server metadata](#updating-authorization-server-metadata)
- [Making cross-application requests from your SAML app securely](#making-cross-application-requests-from-your-saml-app-securely)
- [Configure your XAA SAML App in Okta](#configure-your-xaa-saml-app-in-okta)
  - [Create the SAML 2.0 app in Okta](#create-the-saml-20-app-in-okta)
  - [Register and configure the AI Agent in Okta](#register-and-configure-the-ai-agent-in-okta)
- [Verify your Okta XAA setup on xaa.dev](#verify-your-okta-xaa-setup-on-xaadev)
  - [Configure SAML SSO](#configure-saml-sso)
  - [Confirm the SAML Assertion exchange for a refresh token](#confirm-the-saml-assertion-exchange-for-a-refresh-token)
  - [Verify the refresh token exchange for an ID-JAG token](#verify-the-refresh-token-exchange-for-an-id-jag-token)
  - [Redeem the ID-JAG for an access token at the resource authorization server](#redeem-the-id-jag-for-an-access-token-at-the-resource-authorization-server)
  - [Call the resource API with the access token](#call-the-resource-api-with-the-access-token)
  - [Prove the XAA connection end-to-end](#prove-the-xaa-connection-end-to-end)
- [Takeaways for implementors who have both OIDC and SAML apps](#takeaways-for-implementors-who-have-both-oidc-and-saml-apps)
- [Learn more about Cross App Access, SAML, and OAuth 2.0](#learn-more-about-cross-app-access-saml-and-oauth-20)

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

## Making cross-application requests from your SAML app securely

With these five steps complete, your SAML application is configured for Cross App Access. Agents can now authorize requests against your API while maintaining your existing production federation, eliminating the need for protocol migration.

You can now use Okta to make cross-application requests with your SAML app.

## Configure your XAA SAML App in Okta

Let's test your SAML application in Okta. Before you begin, you'll need some configuration values from the xaa.dev site.

Navigate to [https://xaa.dev/developer/test-resource?tab=saml-okta](https://xaa.dev/developer/test-resource?tab=saml-okta). You'll need two values, the **Single Sign-On URL** – this is the Assertion Consumer Service (ACS) URL – and the **Audience URI (SP Entity ID)**.

Keep this site open in your browser; you'll return to it throughout the setup.

### Create the SAML 2.0 app in Okta

Before you begin this step, you'll need an Okta Integrator Free Plan account. [Sign up for a new account](https://developer.okta.com/signup/) to test out the XAA features. 

Cross App Access is an early access feature in Okta. New Integrator Free Plan account types include XAA support. If you have a paid Okta org plan and the following options are missing, contact your representative.

Sign in to your Integrator Free Plan org and open the **Admin Console**.

Enable AI Agent Identity Assertion:
  1. Navigate to **Settings > Features > Early Access**
  2. Find **AI Agent Identity Assertion** and **Agent to Agent Connections**, and enable both

You'll need an Okta application representing your requesting and resource apps.

If you don't have Okta SAML 2.0 applications representing your requesting and resource apps, you'll need to create them. Create Okta SAML 2.0 applications by following these instructions. 

Navigate to **Applications > Applications**.

Select **Create App Integration**. In the **Create a new app integration** modal, select **SAML 2.0** and press **Next**.

In **General Settings**:
  1. **App name**: Enter a descriptive name for the app, for example, "Test Requesting App" or "Resource App"
  2. Press **Next** to continue

In **Configure SAML**:
  1. **Single sign-on URL**: Use the ACS URL of your requestor or resource app, e.g., "https://idp.xaa.dev/saml-requester/acs"
  2. **Audience URI (SP Entity ID)**: Use the SP Entity of your requestor or resource app, e.g., "https://idp.xaa.dev/saml-requester/metadata"
  3. **Name ID format**: select **EmailAddress**
  4. **Application username**: select **Email**
  5. **Update application username on**: select **Create and update**
  6. Press **Next** to continue

Press **Finish** to create the Okta SAML 2.0 application.

After creating the app, you'll see more configuration options for your Okta SAML 2.0 app. You'll make changes in more than one tab.

**Sign On configuration**

Select the **Sign On** tab. Locate the Metadata URL field and press Copy to save it to your clipboard. You'll paste this URL to the SAML app metadata URL field in [xaa.dev](https://xaa.dev/developer/test-resource?tab=saml-okta) and save.

Your SSO endpoint and Token endpoint are automatically configured.

**Assignments configuration**

Navigate to the **Assignments** tab and make the following configuration changes:
  1. Select **Assign > Assign to People** 
  2. Search for your test user and select **Assign** 
  3. Press **Save and Go Back**, then select **Done**

> **Note**
> 
> If you don't have a SAML 2.0 application representing the resource app, you will need to create one with the same steps above. However, there's an extra configuration step for resource apps to enable XAA. Ensure your resource apps have XAA enabled. Don't set the configuration for requesting apps.

**Resource Server extra configuration**

Navigate to the **Resource Server** tab and make the following configuration changes:

   1. Select **Enable XAA**
   2. **Issuer URL**: Use your resource authorization server issuer URL. This value becomes the `aud` claim in the ID-JAG and cannot change without deleting and resetting the connection.

### Register and configure the AI Agent in Okta

With your Okta SAML 2.0 requesting app configured, register a new AI Agent in Okta. The AI Agent configuration represents the relationship between the Okta SAML 2.0 app you created and your MCP Resource Application. You'll configure credentials, add your requesting app as a delegated caller, and connect your MCP resource app as a Resource Connection.

In the Okta **Admin Console**:

1. Navigate to **Directory > AI Agents**
2. Select **Register AI Agent > Register Manually**
3. Enter a **Name**, e.g., "Requesting Agent" 
4. Select Register

Select the AI Agent you just created to open its configuration. Configure the agent across the following tabs:

1. On the **Owners** tab
   1. Select **Assign individual owners**
   1. Search for and add yourself as an owner
   1. Press **Save**
1. On the **Credentials** tab (select on the **Requesting Agent** to see this tab)
   1. Copy the **AI agent ID**
   1. Open the [xaa.dev](xaa.dev) site to add the**AI agent ID** value as the **Client ID** and save
   1. Back in Okta, select the **Add Public Key**, and then press **Generate new key**. Okta generates a key pair and displays the private key. Under **PEM**, press **Copy to clipboard** and store the key safely. You'll paste this private key into the **Private key (PKCS8 PEM or private JWK)** field in [xaa.dev](xaa.dev) and save.
1. On the **Delegations** tab
   1. Select **Add Caller**
   1. Search for the newly created Okta SAML requesting app
   1. Select **Add Caller** to confirm
1. On the **Resource Connections** tab
   1. Select **Add Resource Connection**. Under the **Resource** section, select **Application** as the **resource type**. 
      1. Under the **Application** section, choose your **Application** instance – MCP (Resource App) – from the dropdown menu and paste the **Client ID** at the **Resource Authorization Server**.
   2. Under **Scope Condition**, select **Allow all**
1. Activate the agent
   1. Select the three dots (the kebab menu), to display options
  2. In the drop-down menu, select **Activate**

Confirm the AI Agent configuration is complete. All checkmarks on the agent configuration page must be green.

## Verify your Okta XAA setup on xaa.dev

Before we get to the next section, make sure you have the resource app URL in the resource authorization issuer (ID-JAG audience).  By this point, you'll have every value from the checklist and your one-time Okta setup in place (AI Agent, credentials, owner, delegation, and resource connection), so we'll add the values from Okta and the apps to walk through the flow step by step, one button per step. 

The screenshot below shows the SAML configuration values step on xaa.dev. 

{% img blog/cross-app-access-saml/xaadev-sso.jpg alt:"Register and test a SAML resource app form values to establish a SAML client." width:"800" %}{: .center-image }

### Configure SAML SSO

Press **Start SAML login at your IdP** and complete the login in the pop-up. 

When it closes, the step turns green and shows a **✓ Auto-discovered SSO** endpoint, confirming that the tester resolved the real `.../sso/saml` endpoint from your metadata and returned a signed SAML assertion.

{% img blog/cross-app-access-saml/xaadev-saml-sso-response.jpg alt:"SAML SSO code request to initiate login through your IdP." width:"800" %}{: .center-image }

### Confirm the SAML Assertion exchange for a refresh token

Press **Exchange assertion for refresh token**. The tester posts the signed assertion to your IdP's token endpoint, using `private_key_jwt` authentication. A 200 means the identity provider accepted the assertion, and you now hold an opaque refresh token.

### Verify the refresh token exchange for an ID-JAG token

Press **Exchange refresh token for ID-JAG**. This action returns a decoded ID-JAG. Take a second to review it: `aud` should equal your Resource authorization issuer, and `sub_id` should contain the SAML NameID of the user who logged in. The Resource authorization server then validates this token. A 200 OK indicates that the step succeeded. 


### Redeem the ID-JAG for an access token at the resource authorization server

* Fill in your Resource AS token endpoint 
* Client ID and client secret of the resource app from the Resource Authorization Server 

Press **Redeem** (`grant_type=jwt-bearer`). If the request succeeds, you'll receive a `200 OK` response with an access token. Inspect the token in the **Token** tab to verify that the`iss`, `aud`, and `scope` claims match the values configured in your resource authorization server. This validation confirms that the authorization server accepted the ID-JAG and issued its own access token.

{% img blog/cross-app-access-saml/redeem-id-jag.jpg alt:"Redeem-ID-JAG at your Resource Authorization Server screen, showing a successful execution with a 200 OK code." width:"800" %}{: .center-image }

### Call the resource API with the access token

Select the request method and enter your API URL (The `Authorization: Bearer` header is added automatically, but you can add any other headers or a request body as needed), then press **Send GET Request**. A 200 response from your endpoint is the final proof: your API accepts the access token generated by the ID-JAG exchange.

### Prove the XAA connection end-to-end

A green **Conformance passed** panel appears. Select **Export conformance log (JSON)** to download the test results. The export includes the signed ID-JAG, the access token returned by your resource authorization server, and the API response. 

You can share this file with your IdP as proof that the Cross App Access integration works successfully.

{% img blog/cross-app-access-saml/xaadev-conformance.jpg alt:"Conformance passed. Export your proof. A button allows exporting a conformance log in JSON format." width:"800" %}{: .center-image }

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
