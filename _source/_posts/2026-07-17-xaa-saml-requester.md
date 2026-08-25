---
layout: blog_post
title: "Enable Your SAML Requesting App for Cross App Access"
author: [alisa-duncan, aasawari, semona-igama, akanksha-bhasin]
by: advocate
communities: [javascript,python,.net,java,go]
description: "Secure app-to-app connections using Cross App Access (XAA) with SAML SSO for SAML-based enterprise apps."
tags: [xaa, saml, sso, cross-app-access]
tweets:
  - ""
  - ""
  - ""
  - ""
image: blog/xaa-saml-requester/social.jpg
type: awareness
---

If you currently federate enterprise customers using Security Assertion Markup Language (SAML) and want to connect with third-party applications without migrating to OpenID Connect (OIDC), this Cross App Access (XAA) guide is for you.

The [Identity Assertion Authorization Grant specification](https://datatracker.ietf.org/doc/draft-ietf-oauth-identity-assertion-authz-grant/), the basis of XAA, was originally designed with OIDC in mind. To use it in SAML applications, you must accommodate specific security and uniqueness requirements. This guide details what you need to support and how to make resource requests to a third-party app using XAA.

**Table of Contents**{: .hide }
* Table of Contents
{:toc}

## How XAA in SAML works

When an agent (like one running in Claude) needs API access, it presents an **Identity Assertion Authorization Grant (ID-JAG)**. The ID-JAG is a short-lived JSON Web Token (JWT) issued by the Identity Provider (IdP) for your app's user. You exchange the ID-JAG token for an access token to the resource application you're connecting with.

The sequence diagram shown below describes the SAML XAA flow and how your application fits in. You'll handle the flow in two parts: where your application requests the `ID-JAG` from the IdP using a refresh token, and where your app requests the access token from the `ID-JAG` from the third-party resource app's authorization server.


{% img blog/xaa-saml-requester/xaa-saml-sequence-diagram.svg alt:"Sequence diagram showing SAML SSO between the user and Okta IdP, two OAuth token exchanges producing a refresh token and then an ID-JAG, and then requests an access token from the ID-JAG to call the API." width:"800" %}{: .center-image }

{% comment %}
Tweak the diagram on https://mermaid.live/ with the following content
%%{init: {'themeVariables': {'fontSize': '18px'}}}%%
sequenceDiagram
    participant U as User (alice@atko.com)
    participant C as Client (Your SAML App)
    participant IDP as Okta IdP
    participant RAS as Resource App Authz Server
    participant RS as Resource App API

    U->>IDP: SAML SSO

    rect rgb(180, 225, 235)
    Note over C,IDP: Your client requests ID-JAG
    C->>IDP: Refresh Token Request (subject_token_type=saml2, requested_token_type=refresh_token)
    IDP-->>C: Refresh Token

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


## XAA implementation checklist for SAML-federated applications

Follow the guide in this section to support XAA in your SAML application when your app connects to a third-party resource application. The XAA flow places the burden of token validation onto the IdP and the resource app's authorization server. The initial SSO step remains the same; however, you'll add three requests before getting an access token to make the resource API call.

Once the user completes signing in, you'll:

  1. Request an OAuth refresh token from Okta
  2. Request the ID-JAG token from Okta
  3. Request the OAuth access token from the third-party resource app's OAuth authorization server

### Request the refresh token 

Your SAML application makes the initial SSO handshake and handles the `SAMLResponse` as usual. The ACS handler verifies the incoming payload and its digital signature, then extracts the underlying XML assertion. This assertion serves as the required credential for the subsequent exchange.

Immediately after validating the SAML response, in the same ACS request before redirecting the user onward, you'll perform the first exchange. Base64-encode the assertion you extracted, then exchange it for a refresh token using Okta's token endpoint. This exchange follows the [OAuth 2.0 Token Exchange (RFC 8693)](https://datatracker.ietf.org/doc/html/rfc8693) mechanism.

This step requires a credential in the request. Because you're making a sensitive resource request, Okta requires a JWT signed with an asymmetric key pair as the credential – a private key JWT.

Follow the instructions in the [Build a JWT for Client Authentication](https://developer.okta.com/docs/guides/build-self-signed-jwt/js/main/) for your tech stack. The signed JWT becomes a client assertion in the request. 

The refresh token HTTP request looks like this:

```http
POST /oauth2/v1/token HTTP/1.1
Host: your-okta-domain.okta.com
Content-Type: application/x-www-form-urlencoded

grant_type=urn:ietf:params:oauth:grant-type:token-exchange&
subject_token=<base64url-encoded SAML assertion XML>&
subject_token_type=urn:ietf:params:oauth:token-type:saml2&
requested_token_type=urn:ietf:params:oauth:token-type:refresh_token&
scope=openid+offline_access&
client_id=<your_client_id>&
client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer&
client_assertion=<your signed JWT>
```

The IdP (Okta) responds with the refresh token. The refresh token is opaque and long-lived. Persist the refresh token for the session; never persist or use the SAML assertion past this exchange. 

### Request the ID-JAG token 

With the refresh token in hand, you have the credentials to request the ID-JAG token when your application needs resources from a third-party app. This exchange uses the same OAuth token exchange mechanism as the first step. You make the `POST` request to the same endpoint, Okta IdP, using the refresh token, and request the ID-JAG token type. 

This request also requires a signed JWT as it's requesting a sensitive resource.

The HTTP request looks like this:

```http
POST /oauth2/v1/token HTTP/1.1
Host: your-okta-domain.okta.com
Content-Type: application/x-www-form-urlencoded

grant_type=urn:ietf:params:oauth:grant-type:token-exchange&
subject_token=<the refresh_token from prior step>&
subject_token_type=urn:ietf:params:oauth:token-type:refresh_token&
requested_token_type=urn:ietf:params:oauth:token-type:id-jag&
audience=<the resource app's authorization server issuer URI>&
resource=<the resource app's API base URL>&
scope=<the resource app's required scopes>&
client_id=<your_client_id>&
client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer&
client_assertion=<your signed JWT>
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

The response payload contains the `access_token` property, whose value is the access token. Use the access token to make the API resource request by using the value in the `Authorization` header. For example:

```http
Authorization: Bearer <access_token>
```

### Handle token expiration

ID-JAG tokens have a short timeline by design. When it expires, request a shiny new ID-JAG from the refresh token. Refresh tokens also have a lifespan. If the IdP rejects the refresh token due to expiration (you'll see an `invalid_grant` error), then you need to obtain a new refresh token by having the user sign in via SSO again. 

## Making cross-application requests from your SAML app securely

With these steps complete, your SAML application is configured for Cross App Access. Agents can now authorize requests against your API while maintaining your existing production federation, eliminating the need for protocol migration.

You can now use Okta to make cross-application requests with your SAML app.

## Configure your XAA SAML Requesting App in Okta

Let's configure your SAML requester application in Okta. Before you begin, you'll need:

- Values from your app (we'll walk through the values needed below)
- An Okta Integrator Free Plan account. [Sign up for a new account](https://developer.okta.com/signup/) to test out the XAA feature 
- [xaa.dev](https://xaa.dev/) for testing your requesting app

> Cross App Access is an early access feature in Okta. New Integrator Free Plan account types include XAA support. If you have a paid Okta org plan and the following options are missing, contact your representative.

Sign in to your Integrator Free Plan org and open the **Admin Console**.

[Create a custom SAML app integration](https://developer.okta.com/docs/guides/create-an-app-integration/saml2/main/#create-a-custom-app-integration) representing your requesting app, using these values:

In **General Settings**:
- **App name**: "Requesting App"

In **Configure SAML**:
- **Single sign-on URL**: the ACS URL of your requester app, e.g., "https://requester-app-uri/saml/acs"
- **Audience URI (SP Entity ID)**: the SP Entity of your requester, e.g., "https://requester-app-uri/saml/metadata"
- **Name ID format**: select **EmailAddress**
- **Application username**: select **Email**
- **Update application username on**: select **Create and update**

After creating the app, you'll see more configuration options for your Okta SAML 2.0 requesting app. You'll make changes in more than one tab.

**Sign On configuration**

On the **Sign On** tab, [retrieve your SAML setup details](https://developer.okta.com/docs/guides/create-an-app-integration/saml2/main/#create-a-custom-app-integration): under **View SAML setup instructions**, copy the **Identity Provider Single Sign-On URL** and **Identity Provider Issuer**, and download the X.509 certificate as `idp-cert.pem`. You'll need all three in your requesting app setup.

**Assignments configuration**

[Assign your test user](https://help.okta.com/oie/en-us/content/topics/provisioning/lcm/lcm-assign-app-user.htm) to the app on the **Assignments** tab.

Now that we have the requesting app registered, it's time to [create a custom SAML app integration](https://developer.okta.com/docs/guides/create-an-app-integration/saml2/main/#create-a-custom-app-integration) representing the resource app, using these values:

In **General Settings**:
- **App name**: "Resource App for Testing"

In **Configure SAML**:
- **Single sign-on URL**: "https://idp.xaa.dev/saml-resource/acs"
- **Audience URI (SP Entity ID)**: "https://idp.xaa.dev/saml-resource/metadata"
- **Name ID format**: select **EmailAddress**
- **Application username**: select **Email**
- **Update application username on**: select **Create and update**

> ⚠️ **Note**
>
> Please note that we're providing these for setup; they don't constitute a working SSO connection to the resource app. Also, don't assume the `NameID` is an email address; it is whatever the customer's SSO emits. Your matching set must remain consistent across your deployment.

After creating the app, you'll see more configuration options for your Okta SAML 2.0 app. You'll make changes in the resource server tab.

**Resource Server extra configuration**

[Enable Cross App Access (XAA)](https://developer.okta.com/docs/guides/xaa-agent-to-app/main/#enable-xaa-on-a-custom-app-integration) on the resource app integration from the **Resource Server** tab, and configure:

   1. **Issuer URL**: https://auth.resource.xaa.dev

**Assignments configuration**

[Assign your test user](https://help.okta.com/oie/en-us/content/topics/provisioning/lcm/lcm-assign-app-user.htm) to the app on the **Assignments** tab.

The next step is to set up  [xaa.dev](https://xaa.dev/) for the resource app.

Go to [Test your requesting app](https://xaa.dev/developer/test-requesting-app?tab=saml) and use these values:

- **IdP issuer URL**: your Okta Integrator account ID (i.e., https://your-okta-domain.okta.com)
- **Test user identifier**: your email, e.g., name1234...@okta.com
- **SAML IdP entityID**: from the requesting app's **Sign On** tab > **SAML Setup** > **View SAML setup instructions**, the **Identity Provider Issuer** value (i.e., http://www.okta.com/<app-id>)

After all values are entered, click **Register**.


### Register and configure the AI Agent in Okta

With your Okta SAML 2.0 requesting app and the resource app configured, register a new AI Agent in Okta. The AI Agent configuration defines the relationship between the Okta SAML 2.0 requesting app you created and the resource application, which in this case is xaa.dev. You configure credentials, link your requesting app during registration, and connect the resource app as a Resource Connection.

In the Okta **Admin Console**, [register the AI Agent and link your requesting app](https://developer.okta.com/docs/guides/xaa-agent-to-app/main/#register-ai-agent-user-access-and-authentication):

1. Navigate to **Directory > AI Agents**
2. Select **Register AI Agent > Register Manually**
3. Under **Profile**, enter a **Name**, e.g., "Agent", and an optional description, then press **Next**
4. Under **User access and authentication > Allow users to access this agent**, select **Select an existing app**, then choose the Okta SAML requesting app you created earlier (e.g., "Requesting App"). This app acts as the requesting app for the XAA flow: your users sign in to the agentic app through it, and the agent then acts on their behalf. Press **Next**.

Select the AI Agent you just created to open its configuration. Configure the agent across the following tabs:

1. On the **Client registration** tab, [choose a client registration method](https://developer.okta.com/docs/guides/xaa-agent-to-app/main/#register-ai-agent-user-access-and-authentication):
   1. Select the **Public/private key** section
   1. In the **Define where keys are managed** section, choose **Okta**
   1. Under the **Add and manage keys** section, select **Add public key**, then **Generate new key**. Under **PEM**, copy the private key into the **Private key (PKCS8 PEM or private JWK)** field in your requesting app
   1. Copy the **KEY ID** and add it back to your requesting app
   1. In the **Provide Client ID to AI agent builder or developer** step, copy the **Client ID**, and add it back to your requesting app
   1. Under **Activate for your AI agent**, select **Activate**, then **Enable**
1. On the **User access** tab
   1. In the **App used for access configuration**, select **Select an existing SAML app**, then your **SAML Application**, e.g., "Requesting App"
1. On the **Resource connections** tab, [add a resource connection to the AI Agent](https://developer.okta.com/docs/guides/xaa-agent-to-app/main/#configure-the-xaa-connection). Use these values:
   1. **Application instance**: your resource app (e.g., "Resource App for Testing")
   1. **AI agent's client ID registered in this app**: the **Client ID** from xaa.dev (it should look similar to `byora...`)
   1. **Scopes**: **Allow any scope**
1. [Activate the AI Agent](https://developer.okta.com/docs/guides/xaa-agent-to-app/main/#activate-the-ai-agent): activating the linked requesting app integration usually activates the AI Agent. If the agent's status is **STAGED**, go to the **Actions** drop-down menu at the top and select **Activate**.

Once the AI Agent is active, the configuration is complete. All checkmarks on the agent configuration page must be green.

### Test the SAML 2.0 app 

At this stage, you are all set to run the requesting app and verify the complete XAA flow it is supposed to perform. 

### Validate the XAA connection end-to-end

Once the flow is complete in the SAML 2.0 application, return to [xaa.dev](https://xaa.dev/). In the **Live verification** tab, a green **Conformance passed** panel appears. This confirms all steps:

1. Auth Server Accepted your ID-JAG
2. Access token was issued 
3. Resource Server accepted your access token
4. API call to the /api/todos/ was a success. 

At this stage, the JSON conformance log will have the complete details of the XAA flow. 

## Learn more about Cross App Access, SAML, and OAuth 2.0

If this guide helped you implement Cross App Access with SAML, explore these resources:

- 📘 [Cross App Access Documentation](https://help.okta.com/oie/en-us/content/topics/apps/apps-cross-app-access.htm): Official guides for configuring and managing Cross App Access in production  
- 🎙️ [Developer Podcast on MCP and Cross App Access](https://www.youtube.com/watch?v=qKs4k5Y1x_s): Hear the backstory, use cases, and why this matters for developers
- 📋 [How to Build and List Secure Cross App Access (XAA) Connections on Okta Integration Network (OIN)](/blog/2026/07/06/submit-oin-xaa)

**Identity 101:**

- [What's the Difference Between OAuth, OpenID Connect, and SAML?](https://www.okta.com/identity-101/whats-the-difference-between-oauth-openid-connect-and-saml/)  
- [What are SAML, OAuth, and OIDC?](https://www.okta.com/en-in/identity-101/saml-vs-oauth/)  
- [Why You Should Migrate to OAuth 2.0 From Static API Tokens](https://www.okta.com/identity-101/why-you-should-migrate-to-oauth-2-0-from-static-api-tokens/)  
- [How to Get Going with the On-Demand SaaS Apps Workshops](/blog/2023/07/27/enterprise-ready-getting-started)

Follow us on [LinkedIn](https://www.linkedin.com/company/oktadev) and [X](https://x.com/oktadev), and subscribe to our [YouTube](https://www.youtube.com/c/OktaDev/) channel. Leave a comment below if you have any questions\!

