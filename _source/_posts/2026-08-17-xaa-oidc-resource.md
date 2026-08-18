---
layout: blog_post
title: "Add Cross App Access to Your OIDC Resource Application"
author: [sohail-pathan]
by: advocate
communities: [javascript,security,python,.net,java,go]
description: "Learn how to secure app-to-app connections using Cross App Access (XAA) with OIDC SSO for OIDC-based resource apps."
tags: [xaa, oidc, sso, cross-app-access]
tweets:
  - ""
  - ""
  - ""
  - ""
image: blog/xaa-oidc-resource/social.jpg
type: awareness
---

If you currently federate enterprise customers using OpenID Connect (OIDC) and want to allow applications to access your API on behalf of those users, this Cross App Access (XAA) guide is for you.

The [Identity Assertion Authorization Grant specification](https://datatracker.ietf.org/doc/draft-ietf-oauth-identity-assertion-authz-grant/), the basis of XAA, was designed with OIDC in mind. Your authorization server already trusts the customer's IdP for single sign-on (SSO), and XAA reuses that same trust for API access. This guide details what you need to support, how to validate the grant, and how to resolve the user at your resource authorization server.

**Table of Contents**{: .hide }
* Table of Contents
{:toc}

## How XAA in OIDC works

When an agent (like one running in Claude) needs API access, it presents an **Identity Assertion Authorization Grant (ID-JAG)**. The ID-JAG is a short-lived JSON Web Token (JWT) issued by the customer's Identity Provider (IdP) for your authorization server. Your resource server accepts the token, identifies the user, and issues your own access token, all while leaving the customer's existing OIDC integration untouched.

The sequence diagram shown below describes the OIDC XAA flow. Notice that the OIDC SSO flow stays the same; the only change is the section highlighted with the comment "Your Resource Authorization Server (AS): redeem and resolve". You'll make a `POST` request to your resource's authorization server with the ID-JAG, resolve the subject, and return an access token that you'll use for resource requests.

{% img blog/xaa-oidc-resource/xaa-oidc-sequence-diagram.svg alt:"Sequence diagram showing OIDC SSO between the user and Okta IdP, a token exchange producing an ID-JAG, and the resource authorization server redeeming the ID-JAG and resolving the subject before issuing an access token used to call the API." width:"800" %}{: .center-image }

{% comment %}
Tweak the diagram on https://mermaid.live/ with the following content
%%{init: {'themeVariables': {'fontSize': '18px'}}}%%
sequenceDiagram
    participant U as User (alice@atko.com)
    participant C as Client (AI Agent)
    participant IDP as Okta IdP
    participant RAS as Your Resource AS
    participant RS as Your API

    U->>IDP: OIDC SSO
    IDP-->>C: ID Token + Refresh Token
    C->>IDP: Token Exchange (subject_token_type=refresh_token, requested_token_type=id-jag)
    IDP-->>C: ID-JAG (aud=your AS, sub=your subject namespace)

    rect rgb(240,180,41)
    Note over C,RAS: Your Resource AS: redeem and resolve
    C->>RAS: POST /token with ID-JAG assertion
    RAS->>RAS: Validate and resolve the subject
    RAS-->>C: Your access token
    end

    C->>RS: API call with access token
    RS-->>C: Resource
{% endcomment %}

> ⚠️ **Note**
>
> You are not participating in the client's SSO here. The only artifact crossing from the IdP to your domain is the ID-JAG. Everything upstream, including authentication, ID token issuance, and the token exchange, happens without you. Your responsibility is to validate the ID-JAG, redeem it for an access token, and resolve the user from the claims.

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
  "aud": "https://auth.chat.example",
  "client_id": "0oa8claudeMcpAtYourAS",
  "email": "alice@atko.com",
  "scope": "chat:read chat:write",
  "jti": "id-jag-7f3c9a21b8",
  ...
}
```

Focus on these key claims noted in the decoded ID-JAG payload:

* **`iss` + `sub`**: Together, these are the primary key for user resolution. Neither one is unique on its own
* **`aud`**: Indicates the issuer identifier for your resource authorization server
* **`client_id`**: This is the client's ID at your resource authorization server, which might differ from its ID at the IdP
* **`email`**: Recommended by the specification for just-in-time provisioning if the user has not yet signed in
* **`jti`**: This is the unique ID for the ID-JAG JWT that prevents replay attacks within the validity window

Two optional claims matter if you run a multi-tenant service: the `tenant` claim scopes the subject when the IdP itself is multi-tenant, and `aud_sub` carries the identifier that the IdP believes *you* already have for this user.

## XAA implementation checklist for OIDC-federated applications

To fully support Cross App Access, implement these four steps in sequence:

- [Mapping user identity from `iss` and `sub`](#mapping-user-identity-from-iss-and-sub)
- [Validating the ID-JAG and resolving the user](#validating-the-id-jag-and-resolving-the-user)
- [Issuing the access token](#issuing-the-access-token)
- [Updating authorization server metadata](#updating-authorization-server-metadata)

### Mapping user identity from `iss` and `sub`

You already resolve users from the `sub` claim during SSO, so the ID-JAG uses the identifier you know. The `sub` claim alone is not the key, though.

A `sub` value is only unique when scoped with the issuer. Resolve on `iss` + `sub` together. If the IdP is multi-tenant, the scope is `iss` + `tenant` + `sub`, and you'll need the `tenant` claim to disambiguate. Two customers on the same multi-tenant IdP can otherwise collide.

> ⚠️ **Note**
>
> If your IdP connection issues pairwise subject identifiers, the same human has a different `sub` at every relying party. The `sub` in the ID-JAG must be the identifier the IdP would put in an ID token issued to *you*, not the one it issued to the requesting app. This is the IdP's responsibility under the specification, but it's the failure you'll see first: a valid, correctly signed ID-JAG that resolves to no local user. Test against a pairwise connection before you ship.

If the user hasn't signed in to your app yet, there's no local record to resolve. Use the `email` claim, or `aud_sub` when the IdP supplies it, to provision just in time. Treat `email` as a linking hint rather than a primary key. Email addresses get reassigned when employees leave, and `iss` + `sub` does not.

### Validating the ID-JAG and resolving the user

The client posts the ID-JAG as a JWT authorization grant and authenticates with its credentials at your server. Below is an example HTTP request for requesting an `access_token`:

```http
POST /oauth2/v1/token HTTP/1.1
Host: chat.example
Authorization: Basic <base64(client_id:client_secret)>
Content-Type: application/x-www-form-urlencoded
grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer
&assertion=eyJ0eXAiOiJvYXV0aC1pZC1qYWcrand0...
```

Before processing, you must bind the ID-JAG's `iss` to a registered IdP connection to prevent forgery.

If you verify the signature before checking the issuer binding, an attacker could stand up their own IdP, sign a token, and present a `sub` belonging to one of your users.

Always resolve the connection from the `iss` first, then verify the signature against that connection's key. You'll compare this using the JSON Web Key Set (JWKS) metadata.

<!-- TODO: add idjag-validation-order.jpeg to _source/_assets/img/blog/xaa-oidc-resource/, then uncomment below -->
{% comment %}
{% img blog/xaa-oidc-resource/idjag-validation-order.jpeg alt:"ID-JAG validation order" width:"800" %}{: .center-image }
{% endcomment %}

Below is the pseudocode for implementing the validation and resolving a user:

```python
connections = {
  "https://atko.okta.com": {
    jwks:        "https://atko.okta.com/oauth2/v1/keys",
    multiTenant: false,
    allowJit:    true,
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

    user  = resolveSubject(payload, conn)
    scope = applyScopePolicy(user, payload.scope)
    return issueAccessToken(user, scope)

resolveSubject(payload, conn):
    require payload.sub
    if conn.multiTenant: require payload.tenant

    user = lookup_user_by_federated_id(payload.iss, payload.tenant, payload.sub)
    if user is none and conn.allowJit:
        user = provision_user(payload.iss, payload.tenant, payload.sub, payload.email)

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
> The ID-JAG replaces the need for a refresh token. On access token expiry, the client resubmits the same ID-JAG to your token endpoint, and you mint a new access token against it. Only once the ID-JAG itself expires does the client return to the IdP for a new one.

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

Publish the profile identifier and nothing more. Don't list the issuers you trust in public metadata, since that discloses your customer relationships. If clients need to check whether you accept a given issuer, put that check behind client authentication.

## Making cross-application requests from your OIDC app securely

With these four steps complete, you've configured your OIDC application for Cross App Access. Agents can now authorize requests against your API using the federation you already run.

You can now use Okta to make cross-application requests with your OIDC app.

## Configure your XAA OIDC Resource app in Okta

To test your OIDC resource app with XAA, you'll need the following:

- Values from your app (we'll walk through the values needed below)
- An Okta Integrator Free Plan account. [Sign up for a new account](https://developer.okta.com/signup/) to test out the XAA feature
- [xaa.dev](https://xaa.dev/developer/test-resource-app?tab=oidc) for testing your resource app

> Cross App Access is an early access feature in Okta. New Integrator Free Plan account types include XAA support. If you have a paid Okta org plan and the following options are missing, contact your representative.


Navigate to [xaa.dev](https://xaa.dev/developer/test-resource-app?tab=oidc). Enter any valid formatted email address to establish a session, then press continue. You'll need the **Sign-in redirect URI** for the hosted requesting app.

In **Your IdP's issuer URL**, enter the issuer URL of your IdP. Eg. https://integrator-xxxxxx.okta.com.  Once you paste the issuer URL, you will get the Sign-in redirect URI. Eg, `https://auth.resource.xaa.dev/api/federated-sso/callback/resapp-oidc-xxxxxxx`

Keep this site open in your browser; you'll return to it throughout the setup.

### Create the OIDC resource app in Okta

Before you begin this step, you'll need an Okta Integrator Free Plan account. [Sign up for a new account](https://developer.okta.com/signup/) to test out the XAA features.

You'll need Okta applications representing your resource and requesting apps. If you don't have Okta OIDC applications representing your requesting and resource apps, you'll need to create them. Create Okta OIDC applications by following these instructions.

  1. Navigate to **Applications and Resources > Applications**
  2. Select **Create App Integration**, choose the **Classic experience** tab
  3. Under **Sign-in method**, select **OIDC - OpenID Connect**
  4. Choose **Web Application** as the application type, and press **Next**

In **New Web App Integration**:

  1. **App integration name**: Enter a descriptive name for the app, for example, "Resource App"
  2. **Grant type**: keep **Authorization Code**
  3. **Sign-in redirect URIs**: Use the callback URL of your hosted resource app
  4. **Assignments**: keep the **Skip group assignments for now** option
  5. Press **Save** to create the app

After creating the app, you'll see more configuration options for your Okta OIDC app. You'll make changes in more than one tab.

**General configuration**

Select the **General** tab, you will see the **Client ID** and **Client secret**. Use these credentials in your hosted resource app.

**Resource Server extra configuration**

Navigate to the **Resource Server** tab. Next to **Cross App Access (XAA)**, select **Edit**, then choose **Enable** to grant access to the app through XAA, and configure:

  1. **Issuer URL**: Use your resource authorization server issuer URL. This value becomes the `aud` claim in the ID-JAG and cannot change without deleting and resetting the connection.
  2. **Audience/tenant ID**: This is optional and not needed for this walkthrough

**Assignments configuration**

Navigate to the **Assignments** tab and make the following configuration changes:

  1. Select **Assign > Assign to People**
  2. Search for your test user and select **Assign**
  3. Press **Save and Go Back**, then select **Done**


### Create an OIDC requester app for testing

Create another Okta OIDC application in the Okta Admin screen by following these instructions.

  1. Navigate to **Applications and Resources > Applications**
  2. Select **Create App Integration**, choose the **Classic experience** tab
  3. Under **Sign-in method**, select **OIDC - OpenID Connect**
  4. Choose **Web Application** as the application type, and press **Next**

In **New Web App Integration**:

  1. **App integration name**: Enter a descriptive name for the app, for example, "Requesting App"
  2. **Grant type**: keep **Authorization Code**, and select **Refresh Token** — you'll need it to request the ID-JAG
  3. **Sign-in redirect URIs**: Use the generated callback URL from xaa.dev for your requesting app, eg. `https://auth.resource.xaa.dev/api/federated-sso/callback/resapp-oidc-xxxxxxx`
  5. **Assignments**: keep the **Skip group assignments for now** option
  6. Press **Save** to create the app

**General configuration**

Select the **General** tab and copy the **Client ID** and **Client secret**. Paste both into the requesting app fields at [xaa.dev](https://xaa.dev/developer/test-resource?tab=oidc) and save.

**Assignments configuration**

Navigate to the **Assignments** tab and make the following configuration changes:

  1. Select **Assign > Assign to People**
  2. Search for your test user and select **Assign**
  3. Press **Save and Go Back**, then select **Done**

### Register and configure the AI Agent in Okta

With your Okta OIDC requesting app and the resource app configured, register a new AI Agent in Okta. During registration, you'll link your requesting app under **User access and authentication**, register the agent's own OAuth client, and then connect the resource app as a **Resource Connection**.

**Register the AI Agent and link your requesting app**

In the Okta **Admin Console**:

  1. Navigate to **Directory > AI Agents**
  2. Select **Register AI Agent > Register Manually**
  3. Under **Profile**, enter a **Name** (e.g., "Agent") and an optional description, then press **Next**
  4. Under **User access and authentication > Allow users to access this agent**, select **Select an existing app**, then choose the Okta OIDC requesting app you created earlier (e.g., "Requesting App"). This app acts as the requesting app for the XAA flow: your users sign in to the agentic app through it, and the agent then acts on their behalf. Press **Next**.
  5. Under "**Add owners**", select "Assign individual owners", and then choose the test user as the owner then press **Save**.

**Connect the resource app**

  1. Select the **Resource connections** tab
  2. Select **+ Add resource connection**. Under **Resource**, select **Application** 
  3. Under **Application**, select **App configured for AI Agent access** 
  4. In **Application instance** dropdown, choose your **Resource App for Testing - XAA** instance, then select **Enable**
  6. **AI agent's client ID registered in this app**: paste the **Client ID** at the **Resource Authorization Server**
  7. **Scopes**: Select **Allow any scope**
  8. Select **Add** to confirm

**Activate the AI Agent**

Activating the linked requesting app usually activates the AI Agent. If the agent's status is **STAGED**, go to the AI Agent page and select **Actions > Activate**. Wait for the "AI agent activated successfully" message before continuing.

Once the AI Agent is active, the configuration is complete. Except the Machine access, all checkmarks on the agent configuration page must be green.

## Verify your Okta XAA setup on xaa.dev

Open the AI Agent you created, then go to **Client registration** tab: You'll see the agent uses the same credentials as the linked requesting app. We will use this client ID and secret to request an ID-JAG from the IdP.

In xaa.dev, enter the following values:

1. **Client ID**: Use the values from the AI Agent's client registration tab. 
2. **Client Secret**: Use the values from the AI Agent's client registration tab.
3. **Resource AS issuer (ID-JAG audience)**: Use the issuer URL of your resource authorization server. 
4. **Scopes**: Enter the scopes you want to request for the access token. For example, `chat:read chat:write`.
5. Press **Save** to store the values.

By this point, you'll have every value from the checklist and your one-time Okta setup in place (AI Agent, owner, delegation, and resource connection), so we'll add the values from Okta and the apps to walk through the flow step by step, one button per step.

The screenshot below shows the OIDC configuration values step on xaa.dev.

<!-- TODO: add xaadev-sso.jpg to _source/_assets/img/blog/xaa-oidc-resource/, then uncomment below -->
{% comment %}
{% img blog/xaa-oidc-resource/xaadev-sso.jpg alt:"Register and test an OIDC resource app form values to establish an OIDC client." width:"800" %}{: .center-image }
{% endcomment %}

### Configure OIDC SSO

Press **Start OIDC login at your IdP** and complete the login in the pop-up.

When it closes, the step turns green and shows a **✓ Auto-discovered SSO** endpoint, confirming that the tester resolved the real authorization and token endpoints from your org's discovery document and returned an ID token and a refresh token.

<!-- TODO: add xaadev-oidc-sso-response.jpg to _source/_assets/img/blog/xaa-oidc-resource/, then uncomment below -->
{% comment %}
{% img blog/xaa-oidc-resource/xaadev-oidc-sso-response.jpg alt:"OIDC authorization code request to initiate login through your IdP." width:"800" %}{: .center-image }
{% endcomment %}

### Verify the refresh token exchange for an ID-JAG token

Press **Exchange refresh token for ID-JAG**. The tester posts the refresh token from sign-in to your IdP's token endpoint and returns a decoded ID-JAG. Take a second to review it: `aud` should equal your resource authorization issuer, and `sub` should be the identifier for the user who logged in. A 200 OK indicates that the step succeeded.

### Redeem the ID-JAG for an access token at the resource authorization server

* Fill in your Resource AS token endpoint
* Client ID and client secret of the resource app from the Resource Authorization Server

Press **Redeem** (`grant_type=jwt-bearer`). If the request succeeds, you'll receive a `200 OK` response with an access token. Inspect the token in the **Token** tab to verify that the `iss`, `aud`, and `scope` claims match the values configured in your resource authorization server. This validation confirms that the authorization server accepted the ID-JAG and issued its own access token.

<!-- TODO: add redeem-id-jag.jpg to _source/_assets/img/blog/xaa-oidc-resource/, then uncomment below -->
{% comment %}
{% img blog/xaa-oidc-resource/redeem-id-jag.jpg alt:"Redeem-ID-JAG at your Resource Authorization Server screen, showing a successful execution with a 200 OK code." width:"800" %}{: .center-image }
{% endcomment %}

### Call the resource API with the access token

Select the request method and enter your API URL (xaa.dev adds the `Authorization: Bearer` header automatically, but you can add any other headers or a request body as needed), then press **Send GET Request**. A 200 response from your endpoint is the final proof: your API accepts the access token generated by the ID-JAG exchange.

### Prove the XAA connection end-to-end

A green **Conformance passed** panel appears. Select **Export conformance log (JSON)** to download the test results. The export includes the signed ID-JAG, the access token returned by your resource authorization server, and the API response.

You can share this file with your IdP as proof that the Cross App Access integration works successfully.

<!-- TODO: add xaadev-conformance.jpg to _source/_assets/img/blog/xaa-oidc-resource/, then uncomment below -->
{% comment %}
{% img blog/xaa-oidc-resource/xaadev-conformance.jpg alt:"Conformance passed. Export your proof. A button allows exporting a conformance log in JSON format." width:"800" %}{: .center-image }
{% endcomment %}

## Takeaways for implementors who also have SAML apps

If some of your enterprise customers federate over SAML instead, here's what changes when you extend XAA to those connections:

* The subject arrives in a `sub_id` claim using the `saml-nameid` format, rather than in `sub`
* Match on every `saml-nameid` member (`issuer` + `NameID` + `sp_name_qualifier`), rather than on `iss` and `sub`
* Everything else, including token issuance rules and redemption checks, remains as is

## Learn more about Cross App Access, OIDC, and OAuth 2.0

If this guide helped you implement Cross App Access with OIDC, explore these resources:

- 📘 [Cross App Access Documentation](https://help.okta.com/oie/en-us/content/topics/apps/apps-cross-app-access.htm): Official guides for configuring and managing Cross App Access in production.
- 🎙️ [Developer Podcast on MCP and Cross App Access](https://www.youtube.com/watch?v=qKs4k5Y1x_s): Hear the backstory, use cases, and why this matters for developers.
- 📋 [How to Build and List Secure Cross App Access (XAA) Connections on Okta Integration Network (OIN)](/blog/2026/07/06/submit-oin-xaa)

**Identity 101:**

- [What's the Difference Between OAuth, OpenID Connect, and SAML?](https://www.okta.com/identity-101/whats-the-difference-between-oauth-openid-connect-and-saml/)
- [What are SAML, OAuth, and OIDC?](https://www.okta.com/en-in/identity-101/saml-vs-oauth/)
- [Why You Should Migrate to OAuth 2.0 From Static API Tokens](https://www.okta.com/identity-101/why-you-should-migrate-to-oauth-2-0-from-static-api-tokens/)
- [How to Get Going with the On-Demand SaaS Apps Workshops](/blog/2023/07/27/enterprise-ready-getting-started)

Follow us on [LinkedIn](https://www.linkedin.com/company/oktadev) and [X](https://x.com/oktadev), and subscribe to our [YouTube](https://www.youtube.com/c/OktaDev/) channel. Leave a comment below if you have any questions\!
