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
image: blog/xaa-dev-playground/social.jpg
type: awareness
---

AI agents are quickly becoming part of everyday enterprise development. They summarize emails, coordinate calendars, query internal systems, and automate workflows across tools.

But once an AI agent needs to access an enterprise application *on behalf of a user*, things get complicated.

How do you securely let an AI-powered app act for a user without exposing credentials, spamming consent prompts, or losing administrative control?

This is the problem **Cross App Access (XAA)** is designed to solve.

Today, we're introducing **[xaa.dev](https://xaa.dev)** – a free, open playground that lets you explore Cross App Access end-to-end. **No local setup. No infrastructure to provision.** Just a working environment where you can see the protocol in action.

{% img blog/xaa-dev-playground/xaa-dev-homepage.jpg alt:"xaa.dev playground homepage showing the Cross App Access flow" width:"800" %}{: .center-image }

> **Note:** xaa.dev is currently in beta. We're actively developing new features for the next release – your feedback helps shape what comes next.

## What is Cross App Access?

Cross App Access refers to a typical enterprise pattern: **one application accesses another application's resources on behalf of a user.**

For example:

- An internal AI assistant fetching updates from a project management system
- A workflow engine booking meetings through a calendar API
- An agent querying internal data sources to complete a task

Traditionally, OAuth consent flows handle this. That approach works well for consumer apps, but it creates friction in enterprise environments where:

- Applications are centrally managed
- IT teams need visibility into trust relationships
- Access must be revocable without user involvement

Cross App Access shifts responsibility from end users to the enterprise identity layer.

Instead of prompting users for consent, the **Identity Provider (IdP)** issues a signed identity assertion called an **ID-JAG (Identity JWT Authorization Grant)**. This assertion cryptographically represents the user and the requesting application. Resource applications trust the IdP's assertion and issue access accordingly.

The result:

- No interactive consent screens
- Clear, auditable trust boundaries
- Complete administrative control over app-to-app access

For a deeper dive into why this matters for enterprise AI, read more about Cross App Access in this post:

{% excerpt /blog/2025/06/23/enterprise-ai %}

## The problem: testing XAA is hard

XAA is built on an emerging OAuth extension called the [Identity Assertion JWT Authorization Grant](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-identity-assertion-authz-grant) – an IETF draft that Okta has been actively contributing to. It's powerful, but it's also new – and new protocols need experimentation.

Here's the challenge: to test XAA locally, you'd need to spin up:

- An Identity Provider (IdP)
- An Authorization Server for the resource application
- The resource API itself
- A requesting application (the agent or client app)

That's hours (or days) of configuration before you can even see a single token exchange. Most developers give up before getting to the interesting part.

**xaa.dev changes that.**

We pre-configured all the components so you can focus on understanding the flow, not debugging dev environments. Go from zero to a working XAA token exchange in under 60 seconds.

**[Launch the playground](https://xaa.dev)** – it's free and requires no signup.

## What you can do on xaa.dev

The playground gives you hands-on access to every role in the Cross App Access flow:

### Requesting App
Step into the shoes of an AI agent or client application. Authenticate a user, request an ID-JAG from the IdP, and exchange it for an access token at the resource server.

### Resource App
See the other side of the transaction. Watch how a resource server validates the identity assertion, verifies the trust relationship, and issues scoped access tokens.

### Identity Provider
We've built a simulated IdP with pre-configured test users. Log in, see how ID-JAGs are minted, and inspect the cryptographic claims that make XAA secure.

### Resource MCP Server
Connect your AI agents using the Model Context Protocol (MCP). The playground provides a ready-to-use MCP server that acts as a resource application – letting you test how AI agents can securely access protected resources through the Cross App Access flow.

### Bring your own Requesting App
The built-in Requesting App is great for learning, but the real power comes when you test with your own application – whether it's a traditional app or an MCP client. [Register a client](https://xaa.dev/developer/register) on the playground, grab the configuration, and integrate it into your local app. This lets you validate your XAA implementation against a working IdP and Resource App – without spinning up your own infrastructure. The [playground documentation](https://xaa.dev/docs) walks you through the setup step-by-step.

## How to get started

Getting started with xaa.dev takes less than a minute:

**Step 1: Open the playground**

Visit [xaa.dev](https://xaa.dev) – no account required.

**Step 2: Explore the components**

The playground has three components – Requesting App, Resource App, and Identity Provider – each with its own URL. Visit any component to see its configuration and understand how it participates in the XAA flow.

**Step 3: Follow the guided flow**

Walk through the four steps of the XAA flow: User Authentication (SSO), Token Exchange, Access Token Request, and Access Resource. Inspect the requests and responses at each step to see exactly how XAA works under the hood.

That's it. No Docker containers, no environment variables, no CORS headaches.

Watch this walkthrough video of the playground if you'd like a guided tour:

{% youtube WjQXgvlC9RA %}
 

## Why we built this

XAA is built on an emerging IETF specification – the Identity Assertion JWT Authorization Grant. As enterprise AI adoption accelerates, there's a clear need: developers want to understand XAA, but the barrier to entry is too high.

xaa.dev lowers the barrier. It helps you:

- **Learn faster** – See the protocol in action before writing any code
- **Build confidently** – Understand exactly what tokens to expect and validate
- **Experiment safely** – Test edge cases without affecting production systems

## Inspect the XAA flow

XAA is how enterprise applications will securely connect in an AI-first world. Whether you're building agents, integrating SaaS tools, or just curious about modern OAuth patterns, xaa.dev gives you a risk-free environment to learn.

**[Try it now](https://xaa.dev)**

## Learn more

Ready to go deeper? Check out these resources:

- [Checkout Cross App Access Integration in Okta ](https://www.okta.com/integrations/cross-app-access/) – Securing AI-driven access together
- [Build Secure Agent-to-App Connections with Cross App Access](/blog/2025/09/03/cross-app-access) – Hands-on implementation guide
- [Identity Assertion JWT Authorization Grant (IETF Draft)](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-identity-assertion-authz-grant) – The specification behind XAA

Have questions or feedback? Reach out to us on [Twitter](https://twitter.com/oktadev), join the conversation on the [Okta Developer Forums](https://devforum.okta.com/), or drop a comment below. We're actively improving xaa.dev based on developer input – your feedback shapes what we build next.

Follow us on [Twitter](https://twitter.com/oktadev) and subscribe to our [YouTube channel](https://youtube.com/oktadev) for more content on identity, security, and building with Okta.
