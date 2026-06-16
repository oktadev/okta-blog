---
layout: blog_post
title: "Okta Developer Connect San Francisco 2026 Recap"
author: akanksha-bhasin
by: advocate
communities: [security, javascript, devops]
description: "A recap of Okta Developer Connect San Francisco 2026: Cross App Access, Okta for AI Agents, and identity patterns for securing enterprise AI agents."
tags: [okta, identity, ai, xaa, oauth, cross-app-access, agentic-ai, enterprise-ai]
image: blog/okta-developer-connect-sf-recap/odc-sf-social-image.jpg
type: awareness
---

"Building an agent is only half the battle. Governing it is where we get stuck."

That question came up in nearly every conversation we had with engineering managers leading up to **[Okta Developer Connect San Francisco](https://luma.com/v2tmx6bf?tk=D5BfTm)**. The second edition of our flagship developer event series brought more than 100 developers, architects, founders, platform engineers, and security leaders to Okta HQ on April 30 for an afternoon of technical sessions, hands-on labs, and community conversations on one theme: securing identity in the age of AI.

## Unlocking AI in the enterprise: Okta for AI Agents is GA

The opening keynote made a point most enterprise teams are now grappling with. Identity has always been a security control. With AI agents in the picture, identity also becomes the governance layer for a class of workloads that didn't exist a year ago: non-human, autonomous, and increasingly trusted to act on behalf of users.

The keynote also marked the **[general availability of Okta for AI Agents](https://www.okta.com/blog/ai/okta-for-ai-agents-general-availability)**. The announcement framed the problem in terms that every security leader recognizes: once an agent ships, three questions arise almost immediately, and the product answers each.

**Where are my agents?** Discovery and onboarding work across frameworks, clouds, and SaaS environments, with shadow AI detection for the agents nobody officially registers.

**What can they connect to?** Protection rests on short-lived credentials, scoped tokens, vaulted secrets, and access controls that extend to Model Context Protocol (MCP) servers.

**What can they do?** Governance covers the full lifecycle: access requests, certification, audit logs that stream to Security Information and Event Management (SIEM) platforms, and a kill switch that deactivates an agent that goes off-script.

For the developers and architects in the room, the announcement set the tone for the rest of the day. Every session that followed answered one of those three questions in some way. You can dig deeper on the **[Okta for AI Agents product page](https://www.okta.com/products/govern-ai-agent-identity/)** or in the **[documentation](https://help.okta.com/oie/en-us/content/topics/ai-agents/ai-agents-home.htm)**.

## Why this conversation matters now

Across the sessions and the AI Interview activation we ran throughout the event, one theme kept coming up: agents are arriving in production faster than most teams can govern them.

Developers told us they have shifted from writing every line of code to reviewing, guiding, and orchestrating AI-generated work. Engineering teams are connecting agents to internal APIs, retrieval-augmented generation (RAG) pipelines, MCP servers, and third-party tools. Security and IAM leaders are watching it happen and asking how to apply the principles they already trust (least privilege, scoped access, auditability) to identities they didn't anticipate when they built those controls.

**A few patterns stood out from those conversations.**

**Agents are outpacing governance.** Many teams ship an agent in days. Wrapping it in policy, access reviews, and lifecycle controls takes weeks or months. The gap between "it works" and "it's safe to leave running" is where most of the risk lives.

**Static credentials are the new shadow IT.** Hardcoded keys, long-lived tokens, and shared service accounts are how a lot of agents reach data today. They make the demo work. They also make incidents harder to scope when something goes wrong.

**RAG has a permissions problem.** Retrieval-augmented generation is now the default pattern for enterprise AI. The hard part is making sure an agent retrieving documents on behalf of a user only sees what that user can access at the data layer, and not just the prompt.

**Non-human identity is a real category.** Teams that already invested in human identity governance now realize they need an equivalent practice for agents, bots, and workloads. Naming them, owning them, and decommissioning them are no longer optional.

{% img blog/okta-developer-connect-sf-recap/speakers-odc-sf.jpg alt:"speakers-odc-sf" width:"800" %}{: .center-image }

## Cross App Access and the protocol behind it

Cross App Access (XAA) drew one of the most-attended sessions of the day, and for good reason. As agents move between applications, the consent model designed for users clicking buttons doesn't hold up. Repeated prompts get fatigue clicks. Unmanaged app-to-app connections become invisible to security teams. Long-lived tokens leak.

XAA introduces a model in which the enterprise identity provider mediates access between applications based on policy, rather than relying on per-user consent or app-to-app integrations. The session grounded the protocol in the OAuth context most developers already know, which made the new pieces (identity assertion and token exchange across app boundaries) easier to place.

For developers, the practical takeaway is clear. If you're building an application that needs to act on behalf of a user inside another application, the question is no longer "how do I get a token?" It's "how does my organization want to govern this access, and how does my app respect that policy?"

A hands-on walkthrough of **[xaa.dev](https://xaa.dev)** gave attendees a chance to step through the Cross App Access flow on their own laptops. Watching identity assertion and token exchange move across a requesting app, an identity provider, and a resource app turned an otherwise dense protocol into something concrete. It gave the room a working mental model to take back to their own architectures.

## Securing AI agents with Auth0

A dedicated session walked through the identity patterns developers can adopt today when building AI applications. The framing stayed deliberately practical, organized around the four risks that show up most often when an agent starts touching real data: authenticating the user the agent acts for so context stays in the chain; using a Token Vault so agents don't handle long-lived third-party credentials directly; asynchronous authorization so users can approve sensitive actions out of band; and fine-grained authorization so an agent only retrieves the data and triggers the actions a user can access.

The session landed because these patterns map naturally to OAuth concepts most developers already know. The work isn't learning a new identity model from scratch. It's applying delegation, scoped tokens, and policy-driven authorization to a new kind of caller, one that doesn't have a browser, doesn't click "allow," and doesn't stop to think before acting. Explore the patterns and SDKs in **[Auth0 for AI Agents](https://auth0.com/ai)**.

## The panel: What teams are actually asking about AI agents

The panel pulled the conversation out of theory and into the questions teams are wrestling with right now. An opening icebreaker about what an unsecured personal AI agent might buy if it went rogue set the tone: practical, direct, and sometimes intentionally playful.

When applications already have their own access controls, does identity get the final say, or does the application remain the real gatekeeper? How do you stop MCP servers from quietly becoming a backdoor into enterprise data? Which authentication mistakes do developers most often make when they build their first agent? How do teams move from identity as an audit log they review after the fact to identity as a guardrail that enforces decisions in real time?

The panel didn't offer easy answers, and that was the point. Securing AI agents isn't a feature you add at the end of a build. It's a set of decisions about delegation, consent, and least privilege you need to make early, before you connect the agent to anything that matters.

For developers, the practical takeaway is clear. If you're building an application that needs to act on behalf of a user inside another application, the question is no longer "how do I get a token?" It's "how does my organization want to govern this access, and how does my app respect that policy?"

## What this means for builders

A few takeaways from the day are worth carrying forward: 

**Treat agents as identities, not features.** The moment an agent can act on data or trigger workflows, it needs the same lifecycle treatment as a user account: ownership, scope, review, and revocation. Naming it after the application isn't enough.

**Design the consent model before the integration.** It's much easier to decide who can delegate what, and how that delegation expires, before you connect an agent to a calendar, a CRM, or a document store. Once the integration goes live, every change becomes a migration.

**Push authorization closer to the data.** Fine-grained authorization works best at the layer where decisions actually happen: the database, the vector store, the API. Token-level scopes alone don't stop a RAG pipeline from surfacing documents outside the user's permissions.

**Plan for the agent you haven't built yet.** Most teams plan to deploy more agents next year than they did this year. The patterns that feel optional today - discovery, governance, scoped credentials become foundational the moment you have a fleet to manage.

## Community, Conversations, and the AI interview activation

Beyond the sessions, the energy in the room was the hardest part to put on a slide. Attendees stayed for the hands-on lab, joined the AI Interview activation, asked sharp questions during the panel, and kept the conversation going with Okta and Auth0 engineers, product leaders, and developer advocates well past the formal close.

The AI Interview activation in particular created a useful feedback loop. Developers told us how AI is reshaping their day, not in marketing terms, but in the specifics of how they review pull requests, find documentation, and decide when to trust an AI-generated answer. Those conversations are already shaping what we build and what we write next.

{% img blog/okta-developer-connect-sf-recap/community-networking.jpg alt:"community" width:"800" %}{: .center-image }

## What comes next

Okta Developer Connect started as a forum for the conversations that are harder to have on a webinar, the ones where developers and architects can push back, ask the awkward question, and leave with something they can actually use. The San Francisco edition continued that mission with a sharper focus on AI agents, OAuth, Cross App Access, and the identity patterns shaping the next generation of applications.

If a single thread ran through the day, it was this: the teams that treat identity as part of the agent, not a wrapper around it, ship at the speed the business asks for, without trading away the controls that keep them safe.

Thank you to everyone who joined us in San Francisco, asked the harder questions, and shared what you're building. We're looking forward to the next edition.

Stay tuned for upcoming Okta Developer Connect events, and follow OktaDev on [LinkedIn](https://www.linkedin.com/company/oktadev), [X](https://x.com/oktadev), and [YouTube](https://www.youtube.com/c/OktaDev/) for new tutorials, videos, and announcements.