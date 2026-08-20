---
layout: blog_post
title: "Add Cross App Access to Your OIDC Requesting Application"
author: [sohail-pathan]
by: advocate
communities: [javascript,python,.net,java,go]
description: "Secure app-to-app connections using Cross App Access (XAA) with OIDC SSO for OIDC-federated enterprise apps."
tags: [xaa, oidc, sso, cross-app-access]
tweets:
  - ""
  - ""
  - ""
  - ""
image: blog/xaa-oidc-requesting/social.jpg
type: awareness
---

If you currently federate enterprise customers using OpenID Connect (OIDC) and want to connect with third-party applications, this Cross App Access (XAA) guide is for you.

The [Identity Assertion Authorization Grant specification](https://datatracker.ietf.org/doc/draft-ietf-oauth-identity-assertion-authz-grant/), the basis of XAA, was designed with OIDC in mind. Your app already holds an ID token after sign-in, but it's the refresh token from that same sign-in that you exchange to reach a third-party app. This guide details what you need to support and how to make resource requests to a third-party app using XAA.

**Table of Contents**{: .hide }
* Table of Contents
{:toc}

## How XAA in OIDC works

When an agent (like one running in Claude) needs API access, it presents an **Identity Assertion Authorization Grant (ID-JAG)**. The ID-JAG is a short-lived JSON Web Token (JWT) issued by the Identity Provider (IdP) for your app's user. You exchange the ID-JAG token for an access token to the resource application you're connecting with.

The sequence diagram shown below describes the OIDC XAA flow and how your application fits in. You'll handle the flow in two parts: where your application requests the `ID-JAG` from the IdP using the refresh token, and where your app requests the access token from the `ID-JAG` from the third-party resource app's authorization server.

{% img blog/xaa-oidc-requesting/xaa-oidc-sequence-diagram.svg alt:"Sequence diagram showing OIDC sign-in between the user and Okta IdP, a token exchange producing an ID-JAG, and then requests an access token from the ID-JAG to call the API." width:"800" %}{: .center-image }

{% comment %}
Tweak the diagram on https://mermaid.live/ with the following content
%%{init: {'themeVariables': {'fontSize': '18px'}}}%%
sequenceDiagram
    participant U as User (alice@atko.com)
    participant C as Client (Your OIDC App)
    participant IDP as Okta IdP
    participant RAS as Resource App Authz Server
    participant RS as Resource App API
    U->>IDP: OIDC sign-in (authorization code flow)
    IDP-->>C: ID token + Refresh token

    rect rgb(180, 225, 235)
    Note over C,IDP: Your client requests ID-JAG
    C->>IDP: ID-JAG Request (subject_token_type=refresh_token, requested_token_type=id-jag)
    IDP-->>C: ID-JAG
    end

    rect rgb(188, 217, 162)
    Note over C,RS: Your client requests access token
    C->>RAS: Request access token POST /token with ID-JAG assertion
    RAS-->>C: Access token
    end

    C->>RS: API call with access token
    RS-->>C: API Response
{% endcomment %}

## XAA implementation checklist for OIDC-federated applications

Follow the guide in this section to support XAA in your OIDC application when your app connects to a third-party resource application. The XAA flow places the burden of token validation onto the IdP and the resource app's authorization server. The initial sign-in step remains the same; however, you'll add two requests before getting an access token to make the resource API call.

Once the user completes signing in, you'll:

  1. Request the ID-JAG token from Okta using the refresh token
  2. Request the OAuth access token from the third-party resource app's OAuth authorization server
  3. Use the access token to make the API request to the resource app

### Request the ID-JAG token

Your OIDC application runs the authorization code flow as usual, requesting the `offline_access` scope, and receives an ID token and a refresh token at the callback. The ID token is still there for your app's own session, but it's the refresh token that's the credential for the exchange, so hold on to it for the session.

When your application needs resources from a third-party app, exchange the refresh token for an ID-JAG at Okta's `/token` endpoint. This exchange follows the [OAuth 2.0 Token Exchange (RFC 8693)](https://datatracker.ietf.org/doc/html/rfc8693) mechanism. Authenticate the request with the client credentials from your OIDC app using `client_secret_post`.

```http
POST /oauth2/v1/token HTTP/1.1
Host: your-okta-domain.okta.com
Content-Type: application/x-www-form-urlencoded

grant_type=urn:ietf:params:oauth:grant-type:token-exchange&
subject_token=<the refresh token from sign-in>&
subject_token_type=urn:ietf:params:oauth:token-type:refresh_token&
requested_token_type=urn:ietf:params:oauth:token-type:id-jag&
audience=<the resource app's authorization server issuer URI>&
resource=<the resource app's API base URL>&
scope=<the resource app's required scopes>&
client_id=<your_client_id>&
client_secret=<your_client_secret>
```

The IdP responds with a short-lived, signed JSON Web Token (JWT), the ID-JAG, as the value in the `access_token` property within the payload.

### Request the access token

Redeem the ID-JAG at the resource app's authorization server's token endpoint. The resource app's authorization server handles the redemption request, not the IdP. This request uses the [JWT Profile for OAuth 2.0 Client Authentication and Authorization Grants (RFC 7523)](https://datatracker.ietf.org/doc/html/rfc7523). The ID-JAG is the assertion now, and you include the scopes required for the resource request. The scope matches the scopes requested in the ID-JAG request. The HTTP request looks something like:

```http
POST /token HTTP/1.1
Host: the-resource-server.example.com
Content-Type: application/x-www-form-urlencoded
Authorization: Basic <base64(resource_as_client_id:resource_as_client_secret)>

grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&
assertion=<ID-JAG token>&
scope=todos.read
```

In the example HTTP request, the `Authorization` header uses the `Basic` scheme as a demo. Use the authorization scheme required by the resource application.

The response payload contains the `access_token` property, whose value is the access token. 


### Call the resource API

Use the access token to make the API resource request by using the value in the `Authorization` header. For example:

```http
GET /api/todos/ HTTP/1.1
Host: the-resource-server.example.com
Authorization: Bearer <access_token>
Accept: application/json
```

### Handle token expiration

ID-JAG tokens have a short timeline by design. When it expires, request a new ID-JAG using the same refresh token — refresh tokens are long-lived, so you don't need to send the user through sign-in again for every ID-JAG. Refresh tokens eventually expire or get revoked, too. If the IdP rejects it (you'll see an `invalid_grant` error), send the user through sign-in again to get a fresh one.

## Making cross-application requests from your OIDC app securely

With these steps complete, you've configured your OIDC application for Cross App Access. Agents can now authorize requests against your API while maintaining your existing production federation.

You can now use Okta to make cross-application requests with your OIDC app.

## Configure your XAA OIDC requesting app in Okta

Let's configure your OIDC requester application in Okta. Before you begin, you'll need:

- Values from your app (we'll walk through the values needed below)
- An Okta Integrator Free Plan account. [Sign up for a new account](https://developer.okta.com/signup/) to test out the XAA feature
- [xaa.dev](https://xaa.dev/) for testing your requesting app

> Cross App Access is an early access feature in Okta. New Integrator Free Plan account types include XAA support. If you have a paid Okta org plan and the following options are missing, contact your representative.

### Register the requesting app in Okta

Use the following steps to create an Okta app integration for your requesting app:

Sign in to your Integrator Free Plan org and open the **Admin Console**:

  1. Navigate to **Applications and Resources > Applications**
  2. Select **Create App Integration**, choose the **Classic experience** tab
  3. Under **Sign-in method**, select **OIDC - OpenID Connect**
  4. Choose **Web Application** as the application type, and press **Next**

In **New Web App Integration**:

  1. **App integration name**: Enter a descriptive name for the app, for example, "Requesting App"
  2. **Grant type**: keep **Authorization Code**, and select **Refresh Token** under **Core Grants** — you'll need it to request the ID-JAG
  3. **Sign-in redirect URIs**: Use the callback URL of your requesting app, e.g., "https://requester-app-uri/callback"
  4. **Sign-out redirect URIs**: Use the sign-out URL of your requesting app
  5. **Assignments**: select the **Skip group assignments for now** option
  6. Press **Save** to create the app

After creating the app, copy the **Client ID** and **Client secret** from the **General** tab and add them to your requesting app. Your app uses these same credentials for sign-in and for the ID-JAG token exchange.

**Assignments configuration**

Navigate to the **Assignments** tab and make the following configuration changes:

  1. Select **Assign > Assign to People**
  2. Search for your test user and select **Assign**
  3. Press **Save and Go Back**, then select **Done**

Now that we have the requesting app registered, it's time to register a resource app on the Okta platform. You'll also need an Okta application representing the resource app.

### Register the resource app in Okta

  1. Navigate to **Applications and Resources > Applications**
  2. Select **Create App Integration**, choose the **Classic experience** tab
  3. Under **Sign-in method**, select **OIDC - OpenID Connect**
  4. Choose **Web Application** as the application type, and press **Next**

In **New Web App Integration**:

  1. **App integration name**: Enter a descriptive name for the app, for example, "Resource App for Testing"
  2. **Sign-in redirect URIs**: Add https://idp.xaa.dev/oidc-resource/callback
  3. **Sign-out redirect URIs**: Remove the default value; it's not needed for this walkthrough
  4. **Assignments**: select the **Skip group assignments for now** option
  5. Press **Save** to create the app

> ⚠️ **Note:** Please note that we're providing these for setup; they don't constitute a working single sign-on (SSO) connection to the resource app. Also, don't assume the `sub` claim is an email address; it is whatever the customer's IdP emits. Your matching set must remain consistent across your deployment.

After creating the app, you'll see more configuration options for your Okta OIDC app. You'll make changes in the resource server tab.

**Resource Server extra configuration**

Navigate to the **Resource Server** tab. Next to **Cross App Access (XAA)**, select **Edit**, then choose **Enable** to grant access to the app through XAA, and configure:

  1. **Issuer URL**: Use https://auth.resource.xaa.dev
  2. **Audience/tenant ID**: This is optional and not needed for this walkthrough

Select **Save**.

> ⚠️ **Note:** Use Audience/tenant ID when you have multiple tenants in your organization.

{% img blog/xaa-oidc-requesting/resource-app-config.jpg alt:"Resource Server tab showing Cross-app access (XAA) enabled with Issuer URL configured." width:"1200" %}{: .center-image }

**Assignments configuration**

Navigate to the **Assignments** tab and make the following configuration changes:

  1. Select **Assign > Assign to People**
  2. Search for your test user and select **Assign**
  3. Press **Save and Go Back**, then select **Done**

The next step is to set up [xaa.dev](https://xaa.dev/) for the resource app.

Go to [Test your requesting app](https://xaa.dev/developer/test-requesting-app?tab=oidc). Add your **IdP issuer URL** as your Okta Integrator account ID (i.e., https://your-okta-domain.okta.com). Put your email into the **Test user identifier**, for example, name1234...@okta.com. After you enter all values, click **Register**.

### Register and configure the AI Agent in Okta

With your Okta OIDC requesting app and the resource app configured, register a new AI Agent in Okta. During registration, you'll link your requesting app under **User access and authentication**, register the agent's own OAuth client, and then connect the resource app as a **Resource Connection**.

**Register the AI Agent and link your requesting app**

In the Okta **Admin Console**:

  1. Navigate to **Directory > AI Agents**
  2. Select **Register AI Agent > Register Manually**
  3. Under **Profile**, enter a **Name** (e.g., "Agent") and an optional description, then press **Next**
  4. Under **User access and authentication > Allow users to access this agent**, select **Select an existing app**, then choose the Okta OIDC requesting app you created earlier (e.g., "Requesting App"). This app acts as the requesting app for the XAA flow: your users sign in to the agentic app through it, and the agent then acts on their behalf. Press **Next**.
  5. Under "**Add owners**", select "Assign individual owners", and then choose the test user as the owner then press **Save**.

Open the AI Agent you created, then go to **Client registration** tab: You'll see the agent uses the same credentials as the linked requesting app. We will use this client ID and secret to request an ID-JAG from the IdP.

**Connect the resource app**

  1. Select the **Resource connections** tab
  2. Select **+ Add resource connection**. Under **Resource**, select **Application** 
  3. Under **Application**, select **App configured for AI Agent access** 
  4. In **Application instance** dropdown, choose your **Resource App for Testing - XAA** instance. 
  5. **AI agent's client ID registered in this app**: paste the **Client ID** from xaa.dev (it should look similar to `byora...`)
  6. **Scopes**: Select **Allow any scope**
  7. Select **Add** to confirm

**Activate the AI Agent**

Activating the linked requesting app usually activates the AI Agent. If the agent's status is **STAGED**, go to the AI Agent page and select **Actions > Activate**. Wait for the "AI agent activated successfully" message before continuing.

Once the AI Agent is active, the configuration is complete. Except the Machine access, all checkmarks on the agent configuration page must be green.

{% img blog/xaa-oidc-requesting/ai-agent-completion.jpg alt:"AI Agent configuration page showing all required sections completed with green checkmarks except Machine access." width:"1200" %}{: .center-image }

### Validate the XAA connection end-to-end

Once the Okta setup is complete, return to [xaa.dev](https://xaa.dev/developer/test-requesting-app?tab=oidc). 

Now you should run the XAA flow from your requesting app. In the **Live verification** tab, a green **Conformance passed** panel appears. This confirms all steps:

  1. Auth Server accepted your ID-JAG
  2. An access token was issued
  3. Resource Server accepted your access token
  4. The API call to /api/todos/ was successful

At this stage, the JSON conformance log has the complete details of the XAA flow. You can either download the log or have a URL to share with your IdP.

## Learn more about Cross App Access, SAML, and OAuth 2.0

If this guide helped you implement Cross App Access with OIDC, explore these resources:

- 📘 [Cross App Access Documentation](https://help.okta.com/oie/en-us/content/topics/apps/apps-cross-app-access.htm): Official guides for configuring and managing Cross App Access in production
- 🎙️ [Developer Podcast on MCP and Cross App Access](https://www.youtube.com/watch?v=qKs4k5Y1x_s): Hear the backstory, use cases, and why this matters for developers
- 📋 [How to Build and List Secure Cross App Access (XAA) Connections on Okta Integration Network (OIN)](/blog/2026/07/06/submit-oin-xaa)

**Identity 101:**

- [What's the Difference Between OAuth, OpenID Connect, and SAML?](https://www.okta.com/identity-101/whats-the-difference-between-oauth-openid-connect-and-saml/)
- [What are SAML, OAuth, and OIDC?](https://www.okta.com/en-in/identity-101/saml-vs-oauth/)
- [Why You Should Migrate to OAuth 2.0 From Static API Tokens](https://www.okta.com/identity-101/why-you-should-migrate-to-oauth-2-0-from-static-api-tokens/)
- [How to Get Going with the On-Demand SaaS Apps Workshops](/blog/2023/07/27/enterprise-ready-getting-started)

Follow us on [LinkedIn](https://www.linkedin.com/company/oktadev) and [X](https://x.com/oktadev), and subscribe to our [YouTube](https://www.youtube.com/c/OktaDev/) channel. Leave a comment below if you have any questions\!
