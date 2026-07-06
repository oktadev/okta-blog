---
layout: blog_post
title: "How to Build and List Secure Cross App Access (XAA) Connections on Okta Integration Network (OIN)"
author: gagan-sikri
by: advocate
communities: [security, javascript, python, .net, java, go]
description: "Learn how ISVs can build Cross App Access (XAA) connections and list them on the Okta Integration Network (OIN)."
tags: [xaa, cross-app-access, oin, isv, sso, oauth]
tweets:
  - ""
  - ""
  - ""
  - ""
type: conversion
---

AI agents have evolved from novelties into active participants in enterprise workflows. They now operate across systems, reading data, executing actions, and calling APIs on behalf of users.

This evolution creates a new security hurdle for enterprises. Software and agents need to connect without relying on static API keys, scattered OAuth consent, or unmanaged integrations. Cross App Access (XAA) addresses this by bringing these connections under the enterprise identity layer.

**Table of Contents**{: .hide }
* Table of Contents
{:toc}

## What is Cross App Access (XAA)?

Cross App Access (XAA) is an identity framework that secures token-based communication when software or AI agents request data from external ecosystems, and those apps have an established trust relationship with an Identity Provider (IdP). It replaces insecure, long-lived API keys or hardcoded secrets with a pattern for real-time identity propagation between different application vendors.

Watch the video below to see Cross App Access (XAA) in action:

{% youtube 3VLzeT1EGrg %}

A concrete way to think about it: consider an employee using an AI assistant to prepare for a meeting. The assistant might need to pull tasks from one application, notes from another, and account details from a third. Without XAA, every connection might require separate user permissions, distinct API keys, or custom administrative work.

XAA allows enterprises to centrally determine which apps connect, which scopes they request, and which users gain access. This streamlines the user experience while giving the enterprise the control it requires.

## Why Cross App Access (XAA) matters for ISVs and their customers

Every time an AI agent or application accesses another system without a proper identity handshake, customers face security and compliance risks. XAA eliminates this gap, providing IT teams with the visibility and audit trails they need to govern cross-app identity flows.

For ISVs, XAA adoption simplifies the integration process in enterprise environments where security and visibility remain top priorities. It demonstrates trust to buyers, showing that your application fits into a secure, modern ecosystem. As enterprises increase their expectations for secure integrations, XAA readiness becomes a powerful competitive differentiator.

At a high level, XAA involves three distinct roles:

* Requesting app: the requesting app acts on behalf of the user but does not mint the identity assertion itself. Instead, it receives an ID token or Security Assertion Markup Language (SAML) assertion from the identity provider and exchanges that assertion for an Identity Assertion Authorization Grant (ID-JAG), a JSON Web Token (JWT).
* Resource app: the resource app owns the API or data. It validates the incoming ID-JAG and issues a scoped access token if the request is valid.
* Identity Provider: the identity provider, such as [Okta](https://okta.com), authenticates the subject, evaluates access policies, and generates the necessary ID-JAG.

## Prerequisites for supporting Cross App Access (XAA) in your app

Before you start building, ensure you have these prerequisites in place:

* Defined app role: determine if your app will function as a requesting app, a resource app, or both.
* Authorization server support: if your app acts as a resource app, your authorization server must validate the ID-JAG and issue a scoped access token for the protected resource.
* Scopes and protected resources: if you are building a resource app, clearly define the APIs and scopes available to requesting apps.
* Okta Integrator Free Plan org: use this org to build, test, and submit your integration. You can sign up [here](/signup/). After signing up, email [developers@okta.com](mailto:developers@okta.com) to enable the XAA feature for your org.
* Single sign-on (SSO) integration: XAA relies on the trust your existing SSO already establishes. Ensure your app supports OpenID Connect (OIDC) or SAML SSO with Okta.
* Tested workflows: you must demonstrate that XAA works with Okta as the IdP before requesting XAA enablement for your Okta Integration Network (OIN) integration.

## Implementation and testing guide for Cross App Access (XAA) with Okta as IdP

To begin development, select the guide corresponding to your application's authentication protocol:

* If your app uses SAML for SSO, follow our [SAML implementation guide](/blog/2026/07/03/cross-app-access-saml).
* If your app uses OIDC for SSO, refer to the [OIDC implementation guide](/blog/2025/09/03/cross-app-access).

To verify your configuration, demonstrate a successful token exchange:

* Requesting apps: provide evidence that you successfully obtained an ID token via OIDC SSO and used it to mint an ID-JAG.
* Resource apps: show that your app received an ID-JAG and successfully exchanged it for a scoped access token.

Completing these tests is a hard requirement for approval; please ensure they are successful before submitting your integration.

## Getting listed in the Okta Integration Network (OIN)

Listing your integration on the [Okta Integration Network (OIN)](https://www.okta.com/integrations/) helps customers discover and trust it. Because XAA relies on trust that your existing single sign-on (SSO) configuration already establishes, you must list an OIDC or SAML SSO integration on the OIN before proceeding.

If your app is not yet listed, prioritize that submission. Submit your SSO app through the [OIN Wizard](/docs/guides/submit-oin-app/openidconnect/main/). This [documentation](/docs/guides/okta-integration-network/) walks you through everything you need to get your integration listed, from app metadata to SSO configuration. Once you submit your SSO app for review, you can begin the XAA enablement request in parallel.

XAA submissions currently require a manual step: you need to contact Okta directly to indicate that your submission includes XAA support. When your app successfully passes token exchange tests, email the Okta team at [oin@okta.com](mailto:oin@okta.com) to request XAA enablement. To speed up the review and avoid additional rounds of configuration, include the completed questionnaire below in your email.

Use this subject line: `Request to enable XAA support for <App Name> on OIN`

### XAA enablement questionnaire

General app details:

* App Name:
* Okta Integrator Org domain:
* SSO Mode: OIDC / SAML
* XAA App Role: Requesting app / Resource app / Both
* Existing OIN App Link, if already published
* Submission Type: new OIN submission / update to an existing OIN app

Requesting app details: *fill this out if your app acts as a requesting app.*

* Resource Registration Pairs: for each resource app you connect with, provide:
  * Resource app name
  * Authorization Server Issuer URL
  * Registered Client ID
* Supported Scopes: list the scopes your app requests from resource apps.
* Client ID Metadata Documents (CIMD) Support:
  * If yes, please provide the CIMD URL
  * No
  * Planned future support

Resource app details: *fill this out if your app acts as a resource app.*

* Global Issuer URL: the endpoint that processes ID-JAG token exchange requests
* Protected Resource Identifiers: URLs of the APIs your app exposes (e.g., `https://api.yourdomain.com/v1`)
* Supported OAuth Scopes: scopes allowed for XAA token exchange (e.g., openid, read, write)
* CIMD Support:
  * If yes, please provide the CIMD URL
  * No
  * Planned future support
* Well-Known Host Endpoints: specify whether you host either of the following:
  * `.well-known/oauth-authorization-server`
  * `.well-known/oauth-protected-resources`

Testing details:

* If you're a requesting app: confirm that you generated successful token exchange logs. The Okta operations team can verify these via internal telemetry parameters. To help the team validate quickly, also include:
  * Test org
  * App name
  * Test user or test account used
  * Resource app tested against
  * Scopes requested
* If you're a resource app: attach a screenshot or a short video showing successful ID-JAG validation and scoped access token exchange logs directly from your authorization server. These cannot be verified externally, so the evidence needs to come from you. Please include:
  * Resource endpoint tested
  * Scopes granted
  * Token exchange result

### What happens next after you submit your OIN and XAA request?

Once you submit your request, the Okta team reviews your SSO submission, XAA metadata, and testing evidence. If your app is already on the OIN, we will update the existing listing after approval. For new integrations, we complete the standard SSO review before publishing your app with XAA support. If the team needs further clarification or additional testing evidence, we will contact you directly.

## Need help with your Cross App Access (XAA) submission?

Please reach out to [developers@okta.com](mailto:developers@okta.com) for help. You can also find answers and connect with peers in our [developer community](https://devforum.okta.com/).

XAA advances how apps and agents interact securely. By supporting this standard and listing your integration on the OIN, you help enterprise customers adopt AI-driven automation with better governance, stronger identity control, and increased confidence.

## Learn more about Cross App Access and the Okta Integration Network

If this guide helped you plan your OIN and XAA submission, explore these resources next:

- 📘 [Cross App Access documentation](https://help.okta.com/oie/en-us/content/topics/apps/apps-cross-app-access.htm): official guides for configuring and managing Cross App Access in production.
- 📄 [Okta Integration Network documentation](/docs/guides/okta-integration-network/): everything you need to get your SSO integration listed on the OIN.
- 🔐 [Enabling Cross App Access for SAML-based enterprise apps](/blog/2026/07/03/cross-app-access-saml): the implementation guide for SAML SSO apps.
- 🔑 [Build secure agent-to-app connections with Cross App Access (XAA)](/blog/2025/09/03/cross-app-access): the implementation guide for OIDC SSO apps.
- 🎙️ [Developer podcast on MCP and Cross App Access](https://www.youtube.com/watch?v=qKs4k5Y1x_s): hear the backstory, use cases, and why this matters for developers.

Follow us on [LinkedIn](https://www.linkedin.com/company/oktadev) and [X](https://x.com/oktadev), and subscribe to our [YouTube](https://www.youtube.com/c/OktaDev/) channel. Leave a comment below if you have any questions!
