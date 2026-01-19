---
layout: blog_post
title: "Introducing xaa.dev: A Playground for Cross App Access"
author: sohail-pathan
by: advocate
communities: [javascript,security]
description: "Explore Cross App Access end-to-end with xaa.dev – a free, open playground that lets you test the XAA protocol without any local setup or infrastructure."
tags: [xaa, cross-app-access, enterprise-ai, agentic-ai, oauth]
tweets:
- "Curious about Cross App Access (XAA)? Try xaa.dev – a free playground to explore secure app-to-app authentication for enterprise AI agents."
- "No local setup. No infrastructure. Just xaa.dev – the fastest way to understand Cross App Access and ID-JAG tokens."
- "Building AI agents that need enterprise app access? Learn how XAA works at xaa.dev – our new interactive playground."
image:
type: awareness
---

AI agents are quickly becoming part of everyday enterprise development. They summarize emails, coordinate calendars, query internal systems, and automate workflows across tools.

But once an AI agent needs to access an enterprise application *on behalf of a user*, things get complicated.

How do you securely let an AI-powered app act for a user – without exposing credentials, spamming consent prompts, or losing administrative control?

This is the problem **Cross App Access (XAA)** is designed to solve.

Today, we're introducing **[xaa.dev](https://xaa.dev)** – a free, open playground that lets you explore Cross App Access end-to-end. **No local setup. No infrastructure to provision.** Just a working environment where you can see the protocol in action.

## What is Cross App Access?

Cross App Access refers to a typical enterprise pattern: one **application accesses another application's resources on behalf of a user.**

For example:

- An internal AI assistant fetching updates from a project management system
- A workflow engine booking meetings through a calendar API
- An agent querying internal data sources to complete a task

Traditionally, OAuth consent flows handle this. That approach works well for consumer apps, but it creates friction in enterprise environments where:

- Applications are centrally managed
- IT teams need visibility into trust relationships
- Access must be revocable without user involvement

Cross App Access shifts responsibility from end users to the enterprise identity layer.

Instead of prompting users for consent, the **Identity Provider (IdP)** issues a signed identity assertion – called an **ID-JAG (Identity JWT Authorization Grant)**. This assertion cryptographically represents the user and the requesting application. Resource applications trust the IdP's assertion and issue access accordingly.

The result:

- No interactive consent screens
- Clear, auditable trust boundaries
- Complete administrative control over app-to-app access

For a deeper dive into why this matters for enterprise AI, read [Integrate Your Enterprise AI Tools with Cross App Access](/blog/2025/06/23/enterprise-ai).

## Why we built xaa.dev

XAA is built on an emerging OAuth extension called the [Identity Assertion JWT Authorization Grant](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-identity-assertion-authz-grant). It's powerful, but it's also new – and new protocols need experimentation.

The problem? To test XAA locally, you'd need to spin up:

- An Identity Provider (IdP)
- An Authorization Server for the resource application
- The resource API itself
- A requesting application (the agent or client app)

That's a lot of moving pieces just to better understand the token flow.

xaa.dev eliminates that friction. We pre-configured all the components so you can focus on understanding the flow, not debugging dev environments. **It's free, it's open, and you can start testing in seconds.**

## What you can do on xaa.dev

The playground lets you explore every role in the Cross App Access flow:

- **Requesting App** – Step into the shoes of an AI agent or client application. Authenticate a user, obtain an ID-JAG, and exchange it for an access token.
- **Resource App** – See the other side. Watch how a resource server validates the identity assertion and issues scoped access tokens.
- **Identity Provider** – We've built a simulated IdP with pre-configured test users. Log in, see how tokens are minted, and inspect the claims.
- **Token Debugger** – Decode and inspect JWTs in real-time. See exactly what's in your ID tokens, ID-JAGs, and access tokens.

## Try it now

XAA is how enterprise applications will securely connect in an AI-first world. Whether you're building agents, integrating SaaS tools, or just curious about modern OAuth patterns, [xaa.dev](https://xaa.dev) gives you a risk-free environment to learn.

**[Go to xaa.dev](https://xaa.dev)**

Have feedback or ideas? We'd love to hear from you. xaa.dev is built by the Okta Developer Advocacy team, and we're actively improving it based on developer input.

## Learn more about Cross App Access

If you want to dive deeper into Cross App Access, check out these resources:

- [Integrate Your Enterprise AI Tools with Cross App Access](/blog/2025/06/23/enterprise-ai)
- [Build Secure Agent-to-App Connections with Cross App Access](/blog/2025/09/03/cross-app-access)
- [Identity Assertion JWT Authorization Grant (IETF Draft)](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-identity-assertion-authz-grant)

Follow us on [Twitter](https://twitter.com/oktadev) and subscribe to our [YouTube channel](https://youtube.com/oktadev) for more content on identity, security, and building with Okta. If you have questions, leave a comment below or visit the [Okta Developer Forums](https://devforum.okta.com/).
