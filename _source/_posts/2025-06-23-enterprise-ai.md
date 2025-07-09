---
layout: blog_post
title: "Integrate Your Enterprise AI Tools with Cross-App Access"
author: [semona-igama]
by: advocate
communities: [devops,security,mobile,.net,java,javascript,go,php,python,ruby]
description: "Manage user and non-human identities, including AI in the enterprise with Cross App Access"
tags: [enterprise-ai, enterprise-ready, mcp, sso, oauth]
tweets:
- ""
- ""
- ""
image: blog/enterprise-ai/enterprise-ai-social-image.jpg
type: awareness
changelog:
- 2025-07-08: Changed the resource parameter to audience in the token exchange request per spec update (https://www.ietf.org/archive/id/draft-ietf-oauth-identity-chaining-05.html#name-token-exchange)
---
SaaS apps not only have to meet the rigorous demands of managing users at an enterprise level but must also be **secure and resilient by design**.

In ["An Open Letter to Third-party Suppliers"](https://www.jpmorgan.com/technology/technology-blog/open-letter-to-our-suppliers), Patrick Opet, Chief Information Security Officer of JPMorgan Chase, writes:

> *"Modern integration patterns, however, dismantle these essential boundaries, relying heavily on modern identity protocols (e.g., OAuth) to create direct, often unchecked interactions between third-party services and firms' sensitive internal resources."*

Modern identity secure standards can help with user lifecycle maintenance of SaaS apps, e.g., provisioning and deactivating employees, and everything else in between. These solutions include adhering to protocols that facilitate single sign-on (SSO), user lifecycle management, entitlements, and full session logout across all applications. On top of managing user and non-human identities, e.g., service apps, adding AI access to work applications will bring unprecedented complexity. We don't have a way to manage these AI tools, but there is a standard solution that aims to solve this problem. First, let's go over how AI is currently set up to integrate across work applications.

## OAuth for Enterprise AI
More AI tools are using protocols like Model Context Protocol (MCP) to connect their AI learning models to make external requests to relevant data and apps within the enterprise. With growing demand and popularity for adopting AI in the workplace, how can we safely integrate AI into the enterprise?

Solution: There is no need to reinvent how we authenticate and authorize AI to protected resources. With recent updates to the [MCP authorization spec](https://modelcontextprotocol.io/specification/2025-06-18/basic/authorization), we can continue to rely on OAuth and authorization servers from external providers like Auth0, separate from MCP servers, to authenticate/authorize non-human identities, including AI.

## Enterprise AI connecting to external apps
Right now, app-to-app connections require interactive user consent and happen invisibly to the enterprise IdP. Naturally, AI-to-app connections follow the same setup, which is not ideal because we need a way to move the connections between the applications, including non-human identities, into the IdP, where they can be visible and managed by the enterprise admin. How can we make this possible?

Solution: By combining new and in-progress OAuth extensions called ["Identity and Authorization Chaining Across Domains"](https://datatracker.ietf.org/doc/draft-ietf-oauth-identity-chaining/) and ["Identity Assertion Authorization Grant"](https://datatracker.ietf.org/doc/draft-parecki-oauth-identity-assertion-authz-grant/), which we'll refer to as "Cross-App Access" for short. These extensions enable the enterprise IdP to sit in the middle of the OAuth exchange between the two apps or AI-to-app.

## A brief intro to Cross-App Access
In this example, we'll use Agent0 (a hypothetical MCP client) as the Enterprise AI application trying to connect to a resource application called Todo0 and its (hypothetical) MCP server. We'll start with a high-level overview of the flow and later go over the detailed protocol.

First, the user logs in to Agent0 through the IdP as normal. This results in Agent0 getting either an ID token or SAML assertion from the IdP, which tells Agent0 who the user is. (This works the same for SAML assertions or ID tokens, so we'll use ID tokens in the example from here out.) This is no different than what the user would do today when signing in to Agent0.

{% img blog/enterprise-ai/agent0-auth-okta.jpeg alt:"A diagram flow of cross-app auth to Okta." width:"800" %}{: .center-image }

Then, instead of prompting the user to connect to Todo0, Agent0 takes the ID token back to the IdP in a request that says, "Agent0 is requesting access to this user's Todo0 account."
The IdP validates the ID token, sees that it was issued to Agent0, and verifies that the admin has allowed Agent0 to access Todo0 on behalf of the given user. Assuming everything checks out, the IdP issues a new token back to Agent0.

{% img blog/enterprise-ai/cross-domain-jwt.jpeg alt:"A diagram flow of cross-app jwt returned." width:"800" %}{: .center-image }

Agent0 takes the intermediate token from the IdP to Todo0, saying, "Hi, I would like an access token for the Todo0 MCP server. The IdP gave me this token with the details of the user to issue the access token for." Todo0 validates the token the same way it would have validated an ID token. (Remember, Todo0 is already configured for SSO to the IdP for this customer as well, so it already has a way to validate these tokens.) Todo0 is able to issue an access token giving Agent0 access to this user's resources in its MCP server.

{% img blog/enterprise-ai/jwt-validation.jpeg alt:"A diagram flow of cross-app jwt return." width:"800" %}{: .center-image }

This solves the two big problems:

The exchange happens entirely without user interaction, so the user never sees prompts or OAuth consent screens.

Since the IdP sits between the exchange, the enterprise admin can configure the policies to determine which applications are allowed to use this direct connection.
The other nice side effect of this is that since no user interaction is required, the first time a new user logs in to Agent0, all their enterprise apps will be automatically connected without them having to click any buttons!

## OAuth's Cross-App Access protocol
Now let's look at what this looks like in the actual protocol. This is based on the adopted in-progress OAuth specification ["Identity and Authorization Chaining Across Domains"](https://datatracker.ietf.org/doc/draft-ietf-oauth-identity-chaining/). This spec is actually a combination of two RFCs: [Token Exchange (RFC 8693)](https://www.rfc-editor.org/rfc/rfc8693) and [JWT Profile for Authorization Grants (RFC 7523)](https://www.rfc-editor.org/rfc/rfc7523). Both RFCs, as well as the "Identity and Authorization Chaining Across Domains" spec, are very flexible. While this means it is possible to apply this to many different use cases, it does mean we need to be a bit more specific in how to use it for this use case. For that purpose, Aaron Parecki has co-authored a profile of the Identity Chaining draft called ["Identity Assertion Authorization Grant"](https://datatracker.ietf.org/doc/draft-parecki-oauth-identity-assertion-authz-grant/) to fill in the missing pieces for the specific use case detailed here.

Let's go through it step by step. For this example, we'll use the following entities:
- Agent0 - the "Requesting Application", which is attempting to access Todo0
- Todo0 - the "Resource Application", which has the resources being accessed through MCP
- Okta - the enterprise identity provider that users at the example company can use to sign in to both apps

{% img blog/enterprise-ai/full-sequence-diagram.jpeg alt:"A diagram flow of cross-app jwt return." width:"800" %}{: .center-image }

### Single Sign-On
First, Agent0 gets the user to sign in using a standard OpenID Connect (or SAML) flow in order to obtain an ID token. There isn't anything unique to this spec regarding this first stage, so we will skip the details of the OpenID Connect flow, and we'll start with the ID token as the input to the next step.

### Token exchange
Agent0, the requesting application, then makes a Token Exchange request (RFC 8693) to the IdP's token endpoint with the following parameters:

- requested_token_type: The value `urn:ietf:params:oauth:token-type:id-jag` indicates that an ID Assertion JWT is being requested.
- audience: The Issuer URL of the Resource Application's authorization server.
- subject_token: The identity assertion (e.g., the OpenID Connect ID Token or SAML assertion) for the target end-user.
- subject_token_type: Either `urn:ietf:params:oauth:token-type:id_token` or `urn:ietf:params:oauth:token-type:saml2` as defined by RFC 8693.

This request will also include the client credentials that Agent0 would use in a traditional OAuth token request, which could be a client secret or a JWT Bearer Assertion.

```http
POST /oauth2/token HTTP/1.1
Host: acme.okta.com
Content-Type: application/x-www-form-urlencoded
grant_type=urn:ietf:params:oauth:grant-type:token-exchange
&requested_token_type=urn:ietf:params:oauth:token-type:id-jag
&audience=https://auth.todo0.com/
&subject_token=eyJraWQiOiJzMTZ0cVNtODhwREo4VGZCXzdrSEtQ...
&subject_token_type=urn:ietf:params:oauth:token-type:id_token
&client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer
&client_assertion=eyJhbGciOiJSUzI1NiIsImtpZCI6IjIyIn0...
```

### ID assertion validation and policy evaluation
At this point, the IdP evaluates the request and decides whether to issue the requested "ID Assertion JWT." The request will be evaluated based on the validity of the arguments and the customer's configured policy.

For example, the IdP validates that the ID token in this request was issued to the same client that matches the provided client authentication. It evaluates that the user still exists and is active, and that the user is assigned the Resource Application. Other policies can be evaluated at the discretion of the IdP, just as it can during a single sign-on flow.
If the IdP agrees that the requesting app should be authorized to access the given user's data in the resource app's MCP server, it will respond with a Token Exchange response to issue the token:

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store

{
  "issued_token_type": "urn:ietf:params:oauth:token-type:id-jag",
  "access_token": "eyJhbGciOiJIUzI1NiIsI...",
  "token_type": "N_A",
  "expires_in": 300
}
```

The claims in the issued JWT are defined in the "Identity Assertion Authorization Grant." The JWT is signed using the same key that the IdP uses to sign ID tokens. This is a critical aspect that makes this work, since again, we assumed that both apps would already be configured for SSO to the IdP and would already be aware of the signing key for that purpose.

At this point, Agent0 is ready to request a token for the Resource App's MCP server.

### Access token request
The JWT received in the previous request can now be used as a "JWT Authorization Grant" as described by RFC 7523. To do this, Agent0 makes a request to the MCP authorization server's 
- token endpoint with the following parameters:
- grant_type: urn:ietf:params:oauth:grant-type:jwt-bearer
assertion: The Identity Assertion Authorization Grant JWT obtained in the previous token exchange step

For example:

```http
POST /oauth2/token HTTP/1.1
Host: auth.todo0.com
Authorization: Basic yZS1yYW5kb20tc2VjcmV0v3JOkF0XG5Qx2

grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer
assertion=eyJhbGciOiJIUzI1NiIsI...
```

Todo0's authorization server can now evaluate this request to determine whether to issue an access token. The authorization server can validate the JWT by checking the issuer (iss) in the JWT to determine which enterprise IdP the token is from and then checking the signature using the public key discovered at that server. Other claims must also be validated, as described in [Section 6.1](https://www.ietf.org/archive/id/draft-parecki-oauth-identity-assertion-authz-grant-03.html#section-6.1) of the Identity Assertion Authorization Grant.
Assuming all the validations pass, Todo0 is ready to issue an access token to Agent0 in the token response:

```http
HTTP/1.1 200 OK
Content-Type: application/json
Cache-Control: no-store

{
  "token_type": "Bearer",
  "access_token": "2YotnFZFEjr1zCsicMWpAA",
  "expires_in": 86400
}
```

This token response is the same format that Todo0's authorization server would respond to a traditional OAuth flow. That's another key aspect of this design that makes it scalable. We don't need the resource app to use any particular access token format, since only that server is responsible for validating those tokens.
Now that Agent0 has the access token, it can request the (hypothetical) Todo0 MCP server using the bearer token the same way it would have received the token using the traditional redirect-based OAuth flow.

> *"Note: Eventually, we'll need to define the specific behavior of when to return a refresh token in this token response. The goal is to ensure the client goes through the IdP often enough for the IdP to enforce its access policies. A refresh token could potentially undermine that if the refresh token lifetime is too long. It follows that ultimately, the IdP should enforce the refresh token lifetime, so we will need to define a way for the IdP to communicate to the authorization server whether and how long to issue refresh tokens. This would enable the authorization server to make its own decision on access token lifetime, while still respecting the enterprise IdP policy.*

## Cross-App Access sequence diagram
Here's the flow again, this time as a sequence diagram.

{% img blog/enterprise-ai/cross-app-access-sequence-diagram.jpeg alt:"Cross-app access sequence diagram" width:"800" %}{: .center-image }

- The client initiates a login request
- The user's browser is redirected to the IdP
- The user logs in at the IdP
- The IdP returns an OAuth authorization code to the user's browser
- The user's browser delivers the authorization code to the client
- The client exchanges the authorization code for an ID token at the IdP
- The IdP returns an ID token to the client
- At this point, the user is logged in to the MCP client. Everything up until this point has been a standard OpenID Connect flow.
- The client makes a direct Token Exchange request to the IdP to exchange the ID token for a cross-domain "ID Assertion JWT"
- The IdP validates the request and checks the internal policy
- The IdP returns the ID-JAG to the client
- The client makes a token request using the ID-JAG to the MCP authorization server
- The authorization server validates the token using the signing key it also uses for its OpenID Connect flow with the IdP
- The authorization server returns an access token
- The client makes a request with the access token to the MCP server
- The MCP server returns the response

## Next steps
So, with stringent expectations set for buying SaaS apps, this also applies to AI tools accessing these SaaS apps now more than ever. Cross-App Access aims to help manage ALL identity access, including AI, especially in the workplace. You can read more about how Cross-App Access plays a key role in securing AI agents on this [blog by Okta's Chief Product Officer Arnab Bose](https://www.okta.com/newsroom/articles/understanding-the-ai-agent-identity-challenge/). And for a more detailed step-by-step explanation of the flow, see [Appendix A.3](https://www.ietf.org/archive/id/draft-parecki-oauth-identity-assertion-authz-grant-04.html#appendix-A.3) of the Identity Assertion Authorization Grant. Interested in integrating your Cross App Access with Okta? You can apply to our [early access offering](https://www.okta.com/saas-security/sign-up/)!

Follow us on OktaDev on [X](https://twitter.com/oktadev) and subscribe to our [YouTube channel](https://www.youtube.com/c/OktaDev/) to learn about additional enterprise-ready AI resources as soon as they're available. We also want to hear from you about topics you want to see and questions you may have. Leave us a comment below!
