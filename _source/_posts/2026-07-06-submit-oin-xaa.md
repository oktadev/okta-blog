---
layout: blog_post
title: "Build, Test, and Publish a Cross App Access App in the Okta Integration Network"
author: [gagan-sikri, alex-silk]
by: advocate
communities: [javascript, python, .net, java, go]
description: "Build Cross App Access into your app or MCP server, test it with Okta's developer tools, and publish it free to the Okta Integration Network."
tags: [xaa, cross-app-access, oin, isv, sso, oauth, mcp]
image: blog/submit-oin-xaa/social.jpg
tweets:
  - ""
  - ""
  - ""
  - ""
type: awareness
changelog:
  - 2026-09-19: Rewrote the guide around the self-service OIN Wizard submission flow for Cross App Access, added Model Context Protocol (MCP) role guidance, and removed the manual XAA enablement questionnaire that the wizard replaces. Changes to this article can be viewed in [oktadev/okta-blog#1715](https://github.com/oktadev/okta-blog/pull/1715).
  - 2026-08-24: Added the OIDC resource and requesting app implementation guides, and removed the superseded OIDC guide link. Changes to this article can be viewed in [oktadev/okta-blog#1701](https://github.com/oktadev/okta-blog/pull/1701).
---

Cross App Access (XAA) lets your application request data from another vendor's API on behalf of a signed-in enterprise user, without static API keys and without a separate consent prompt for every connection. If enterprises buy your software, supporting XAA turns your integration into something their IT team can govern centrally.

This guide walks through building XAA support into your app or Model Context Protocol (MCP) server, testing the token exchange with Okta's developer tools, and publishing the result to the Okta Integration Network (OIN). Listing on the OIN costs nothing.

**Table of Contents**{: .hide }
* Table of Contents
{:toc}

## What you'll build, test, and publish

This guide covers two stages:

1. ***Build and test*** XAA support in your app or MCP server
2. ***Publish*** your XAA app or MCP server in the OIN. Listing is 100% free!

Complete both and your application [appears in the Okta Integration Network](https://www.okta.com/integrations/?filters=okta%3Aoin%2Ffunctionalities%2Fcross-app-access) as an application that supports **Single Sign-On (SSO)** and **Cross App Access (XAA)**. XAA depends on SSO, so your OIN listing must cover both integrations.

## Understanding XAA and your app's use case

[Cross App Access](https://developer.okta.com/docs/concepts/xaa/) (XAA) provides a low-friction mechanism for an app to establish secure connections with a third-party resource server. The third-party resource server resides in a separate domain that's protected by an external authorization server.

{% img blog/submit-oin-xaa/xaa-roles-diagram.jpg alt:"A user reaches the requesting app through single sign-on. The requesting app requests an ID-JAG from the Okta identity provider and receives one, then asks the resource app's authorization server for an access token using that ID-JAG. The authorization server validates the ID-JAG against the identity provider and returns an access token, which the requesting app uses to consume the resource app's MCP server or APIs." width:"800" %}{: .center-image }

At a high level, XAA involves three distinct roles:

1. **Requesting app**: a requesting app is a client service acting on behalf of an employee. It receives an ID token or Security Assertion Markup Language (SAML) assertion from the identity provider and exchanges that assertion for an Identity Assertion Authorization Grant (ID-JAG), a JSON Web Token (JWT).
2. **Resource app**: a resource app owns the API or data. It validates the incoming ID-JAG and issues a scoped access token if the request is valid.
3. **Identity Provider** (for example, Okta): authenticates the subject, evaluates access policies, and generates and validates the ID-JAG.

### Prerequisites for supporting Cross App Access (XAA) in your app

Before you start building XAA, ensure you have these prerequisites in place:

1. [Register for an Okta Integrator Free Plan org](https://developer.okta.com/signup/)
   * Use this production-grade org to build, test, and publish your integration to the OIN
2. Determine the use case your app or MCP server supports
   * Your application's **XAA role(s)** and **SSO protocol(s)** determine the steps you complete to build, test, and publish:
     1. **XAA role**: determine whether your app functions as a requesting app, a resource app, or both
        * If you support XAA for [Enterprise-Managed Authorization](https://modelcontextprotocol.io/extensions/auth/enterprise-managed-authorization) (that is, MCP use cases):
          * MCP servers supporting XAA are a resource app use case
          * MCP clients supporting XAA are a requesting app use case
     2. **SSO protocol**: your app needs to support OpenID Connect (OIDC), SAML, or both
        * Whichever protocol most of your customers use determines which guide you select in the following section

## 1. Build and test XAA

In this section, you **build** XAA into your app and **test** the XAA flow with the developer tools Okta provides.

Select the guide matching your use case, combining the primary SSO protocol your customers use with your XAA role:

* If your app supports SAML SSO:
  * If your XAA use case is a resource app, follow our [SAML resource app implementation guide](/blog/2026/07/03/cross-app-access-saml)
  * If your XAA use case is a requesting app, follow our [SAML requesting app implementation guide](/blog/2026/07/17/xaa-saml-requester)
* If your app supports OIDC SSO:
  * If your XAA use case is a resource app, follow our [OIDC resource app implementation guide](/blog/2026/08/24/xaa-oidc-resource)
  * If your XAA use case is a requesting app, follow our [OIDC requesting app implementation guide](/blog/2026/08/21/xaa-oidc-requesting)

If you are an Auth0 customer, refer to the [Auth0 documentation](https://auth0.com/docs/ai-agents-mcp/cross-app-access) to enable Cross App Access in your Auth0-powered application.

## 2. Publish your SSO with XAA integration to the Okta Integration Network

Submit your integration from the same Okta Integrator Free Plan org you built in. [Follow the OIN Wizard instructions](https://developer.okta.com/docs/guides/submit-oin-app/scrossapp/main/) for an SSO with XAA submission.

Our OIN Operations team reviews your submission and contacts you about its status or any issues. Expect about one business week for initial review, with publication to the OIN following shortly after. Track progress on the **Your OIN Integrations** dashboard in your org.

## Need help with your Cross App Access (XAA) submission?

Please reach out to [developers@okta.com](mailto:developers@okta.com) for help. You can also find answers and connect with peers in Okta's [developer community](https://devforum.okta.com/).

## Learn more about Cross App Access and the Okta Integration Network

If this guide helped you plan your OIN and XAA submission, explore these resources next:

- 📘 [Cross App Access documentation](https://help.okta.com/oie/en-us/content/topics/apps/apps-cross-app-access.htm): official guides for configuring and managing Cross App Access in production.
- 📄 [Okta Integration Network documentation](https://developer.okta.com/docs/guides/okta-integration-network/): everything you need to get your integration listed on the OIN.
- 🔐 [Enabling Cross App Access for SAML-Based Resource Apps](/blog/2026/07/03/cross-app-access-saml): the implementation guide for SAML SSO resource apps.
- 🔐 [Enable Your SAML Requesting App for Cross App Access](/blog/2026/07/17/xaa-saml-requester): the implementation guide for SAML SSO requesting apps.
- 🔑 [Add Cross App Access to Your OIDC Resource Application](/blog/2026/08/24/xaa-oidc-resource): the implementation guide for OIDC SSO resource apps.
- 🔑 [Add Cross App Access to Your OIDC Requesting Application](/blog/2026/08/21/xaa-oidc-requesting): the implementation guide for OIDC SSO requesting apps.
- 🎙️ [Developer podcast on MCP and Cross App Access](https://www.youtube.com/watch?v=qKs4k5Y1x_s): hear the backstory, use cases, and why this matters for developers.

Follow us on [LinkedIn](https://www.linkedin.com/company/oktadev) and [X](https://x.com/oktadev), and subscribe to our [YouTube](https://www.youtube.com/c/OktaDev/) channel. Leave a comment below if you have any questions!
