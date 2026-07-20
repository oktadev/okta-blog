---
layout: blog_post
title: "Enable Your SAML Requesting App for Cross App Access"
author: [alisa-duncan, aasawari, semona-igama]
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
client_secret=<your_client_secret>
```

The IdP (Okta) responds with the refresh token. The refresh token is opaque and long-lived. Persist the refresh token for the session; never persist or use the SAML assertion past this exchange. 

### Request the refresh token 

With the refresh token in hand, you have the credentials to request the ID-JAG token when your application needs resources from a third-party app. This exchange uses the same OAuth token exchange mechanism as the first step. You make the `POST` request to the same endpoint, Okta IdP, use the refresh token as your credential, and request the ID-JAG token type.

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

Enable AI Agent Identity Assertion:
  1. Navigate to **Settings > Features > Early Access**
  2. Find **AI Agent Identity Assertion** and **Agent to Agent Connections**, and enable both

You'll need an Okta application representing your requesting app. 

Navigate to **Applications > Applications**

In the **Create a new app integration** model, select **SAML 2.0** and press **Next**.

In **General Settings**:
  1. **App name**: Enter a descriptive name for the app, for example, "Requesting App".
  2. Press **Next** to continue

In **Configure SAML**:
  1. **Single sign-on URL**: Use the ACS URL of your requestor app, e.g., "https://requester-app-uri/saml/acs"
  2. **Audience URI (SP Entity ID)**: Use the SP Entity of your requestor, e.g., "https://requester-app-uri/saml/metadata"
  3. **Name ID format**: select **EmailAddress**
  4. **Application username**: select **Email**
  5. **Update application username on**: select **Create and update**
  6. Press **Next** to continue

Press **Finish** to create the Okta SAML 2.0 application.

After creating the app, you'll see more configuration options for your Okta SAML 2.0 requesting app. You'll make changes in more than one tab.

**Sign On configuration**

Select the **Sign On** tab. To the right, locate the **View SAML setup instructions** under the header **SAML Setup**, open the saml-doc file, and copy the **Identity Provider Single Sign-On URL** and **Identity Provider Issuer**. You will need these values in your requesting app setup. On the same page, make sure you download the X.509 certificate and add it back to your requester app as idp-cert.pem.

**Assignments configuration**

Navigate to the **Assignments** tab and make the following configuration changes:
  1. Select **Assign > Assign to People** 
  2. Search for your test user and select **Assign** 
  3. Press **Save and Go Back**, then select **Done**

Now that we have the requesting app registered, it's time to register a resource app on the Okta platform. You'll also need an Okta application representing the resource app.

Navigate to **Applications > Applications**

In the **Create a new app integration** model, select **SAML 2.0** and press **Next**.

In **General Settings**:
  1. **App name**: Enter a descriptive name for the app, for example, "Resource App for Testing".
  2. Press **Next** to continue

In **Configure SAML**:
  1. Add https://idp.xaa.dev/saml-resource/acs for **Single sign-on URL**
  2. Add https://idp.xaa.dev/saml-resource/metadata for **Audience URI (SP Entity ID)**
  3. **Name ID format**: select **EmailAddress**
  4. **Application username**: select **Email**
  5. **Update application username on**: select **Create and update**
  6. Press **Next** to continue

> ⚠️ **Note**
> Please note that we're providing these for setup; they don't constitute a working SSO connection to the resource app. Also, don't assume the `NameID` is an email address; it is whatever the customer's SSO emits. Your matching set must remain consistent across your deployment.

Press **Finish** to create the Okta SAML 2.0 application.

After creating the app, you'll see more configuration options for your Okta SAML 2.0 app. You'll make changes in the resource server tab.  

**Resource Server extra configuration**

Navigate to the **Resource Server** tab and make the following configuration changes:

   1. Select **Enable XAA**
   2. **Issuer URL**: Add this value to your **Issuer URL**: https://auth.resource.xaa.dev

**Assignments configuration**

Navigate to the **Assignments** tab and make the following configuration changes:
  1. Select **Assign > Assign to People** 
  2. Search for your test user and select **Assign** 
  3. Press **Save and Go Back**, then select **Done**

The next step is to set up  [xaa.dev](https://xaa.dev/) for the resource app.

Go to [Test your requesting app](https://xaa.dev/developer/test-requesting-app?tab=saml)
Add your **IdP issuer URL** as your Okta Integrator account ID (i.e., https://your-okta-domain.okta.com)
Put your email into the **Test user identifier** example, name1234...@okta.com
Finally, select **My ID-JAG is SAML-derived** and add your **SAML IdP entityID** from the requesting app you created under the **Sign On** tab > **SAML Setup** > **View SAML setup instructions**, open the saml-doc file, and find the **Identity Provider Issuer** value (i.e., http://www.okta.com/<app-id>)
After all values are entered, click on the **Register** 


### Register and configure the AI Agent in Okta

With your Okta SAML 2.0 requesting app and the resource app configured, register a new AI Agent in Okta. The AI Agent configuration defines the relationship between the Okta SAML 2.0-requesting app you have and the resource application, which in this case is xaa.dev. You'll configure credentials, add your requesting app as a delegated caller, and connect the resource app as a Resource Connection.

In the Okta **Admin Console**:

1. Navigate to **Directory > AI Agents**
2. Select **Register AI Agent > Register Manually**
3. Enter a **Name**, e.g., "Agent" 
4. Select Register

Select the AI Agent you just created to open its configuration. Configure the agent across the following tabs:

1. On the **Owners** tab
   1. Select **Assign individual owners**
   2. Search for and add yourself as an owner
   3. Press **Save**

2. On the **Credentials** tab (select the agent you've just created to see this tab)
   1. Copy the **AI agent ID** and add the value as the **Client ID** for your requesting app. 
   2. Back in Okta, select the **Add Public Key**, and then press **Generate new key**. Okta generates a key pair and displays the private key. Under **PEM**, press **Copy to clipboard**, then store the key securely on your end. You'll paste this private key into the **Private key (PKCS8 PEM or private JWK)** field in your requesting app, then save.
  3. Also copy the kid and add it back to your requesting app

3. On the **Delegations** tab
   1. Select **Add Caller**
   2. Search for the newly created Okta SAML requesting app
   3. Select **Add Caller** to confirm

4. On the **Resource Connections** tab
   1. Select **Add Resource Connection**. Under the **Resource** section, select **Application** as the **resource type**. 
      1. Under the **Application** section, choose your **App configured for AI Agent access** instance as the Resource app. (In this case, it should be the "Resources App") from the dropdown menu and paste the **Client ID** from xaa.dev. (It should look something similar to `byora...`)
   2. Under **Scope Condition**, select **Allow all** 
   3. Select **Add** to confirm

The final step is to activate the AI agent. Go to Actions and select **Activate**

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

