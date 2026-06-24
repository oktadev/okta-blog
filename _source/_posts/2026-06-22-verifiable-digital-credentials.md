---
layout: blog_post
title: "How Verifiable Digital Credentials Are Reshaping Trust Architecture"
author: akanksha-bhasin
by: advocate
communities: [security,mobile,javascript]
description: "Verifiable Digital Credentials are reshaping trust. Learn the Issuer-Holder-Verifier model, SD-JWT VC, mdoc, OpenID4VP, and how to build the verifier side."
tags: [security,identity,mobile]
image: blog/verifiable-digital-credentials/verifiable-digital-credentials-social-image.jpg
type: awareness
---

The identity stack is getting a new layer, and it's already in your users' pockets. Mobile driver's licenses are live in dozens of U.S. states. The EU is mandating digital identity wallets for hundreds of millions of citizens. Apple Wallet and Google Wallet already hold government-issued credentials. Yet most development teams are not building for it.

The layer is called Verifiable Digital Credentials. The issuer infrastructure is already live, with wallets deployed and standards stable. The industry's verifier-side adoption is still catching up, and that's where we're focusing our engineering work right now.

For years, when applications needed to verify a user's age, license, or employment status, the default methods were document uploads, third-party verification APIs, and centralized storage of personally identifiable information (PII). It worked. But it accumulated cost at every step: data your infrastructure had to protect, compliance obligations that grew with every sensitive record, manual review queues that created friction, and third-party vendors holding your users' identity data on your behalf.

{% img blog/verifiable-digital-credentials/image0.jpg alt:"Comparison diagram showing two models side by side: traditional document collection on the left with centralized PII storage, and the VDC model on the right with a trusted issuer, user wallet, and direct claim verification" width:"800" %}{: .center-image }

VDCs replace that model. A trusted authority, such as a DMV, a university, or an employer, issues a cryptographically signed credential. The user holds it in a wallet. Your application requests the specific proof it needs. The credential validates itself. You record the outcome and move on. No document stored. No PII beyond what the transaction required. No third party in the middle.

The technical foundation relies on the **Issuer-Holder-Verifier trust triangle**: the Issuer signs the credential, the Holder stores it in a digital wallet, and the Verifier, your application, requests exactly the proof it needs. This model enables selective disclosure, where a verifier can confirm a person meets an age threshold without ever seeing their date of birth, home address, or a photo of their physical ID. By moving from document collection to claim validation, you eliminate manual review queues and dramatically reduce the personal data your infrastructure is obligated to protect.

{% img blog/verifiable-digital-credentials/image1.jpg alt:"Triangle diagram showing the Issuer-Holder-Verifier trust model: the Issuer signs and sends a credential to the Holder's digital wallet, the Holder presents proof to the Verifier, and the Verifier validates the credential without seeing underlying PII" width:"800" %}{: .center-image }

This is not an incremental improvement on document uploads. It is a different architecture for how applications establish trust, one in which data collection is scoped to exactly what the transaction requires, and verification outcomes are separable from the identity artifacts that produced them.

The timing matters. The standards are mature. The wallets are deployed at scale. The trust ecosystems are live. What the ecosystem needs now is verifier-side applications that implement these flows well. That gap, between where the issuer infrastructure is and where verifier-side development is, is the opportunity in front of engineering teams right now.

**Table of Contents**{: .hide }
* Table of Contents
{% include toc.md %}

## Authentication proves identity. Credentials prove claims.

The most important distinction in the VDC space is also the most commonly missed.

Authentication answers one question: is this user the legitimate owner of this account? Verification answers a completely different question: can this person prove a specific attribute about themselves, their age, their license, their employment status, or their eligibility?

These are not the same problem. We have spent the last decade perfecting the art of logging users in (OpenID Connect, passkeys, strong MFA), but stretching your auth layer to carry verification responsibilities it was never designed for produces login flows that collect far more than they need to, and systems that are harder to evolve as both concerns grow independently.

The right architecture keeps them separate: authentication establishes the session, and VDC-based verification handles moments when a higher-trust signal is required.

{% img blog/verifiable-digital-credentials/image2.jpg alt:"Diagram showing two separate flows: authentication on the left establishes a user session via login, while VDC-based verification on the right handles specific high-trust claim checks as a distinct step" width:"800" %}{: .center-image }

In practice, those moments cluster around a recognizable set of product checkpoints: age gating for regulated goods, step-up verification before sensitive account actions, professional license checks, workforce credential validation, and high-value transactions. These are the natural insertion points for VDC-based verification. Not a replacement for your auth stack, but an additional layer, deployed precisely where the cost of a trust failure is highest.

## The VDC standards stack: What you need to know before you build

VDCs are not a single specification. They are a layered ecosystem of interoperable standards, and understanding each layer is foundational to making good architectural decisions. The stack has three layers.

{% img blog/verifiable-digital-credentials/image3.jpg alt:"Layered stack diagram showing three VDC standards layers from bottom to top: credential formats (SD-JWT VC and mdoc), protocols (OpenID4VCI for issuance and OpenID4VP for presentation), and the W3C Digital Credentials API as the browser runtime layer" width:"800" %}{: .center-image }

**Credential Formats** - defines what the credential is and how selective disclosure works. Two formats matter:

**SD-JWT VC** - selective disclosure built on JSON Web Tokens (JWTs) and developed in the IETF. This is the natural entry point for web and backend teams already working with JWT-based auth. The claims structure is familiar, and selective disclosure is native to the format. The right choice for enterprise credentials, age gating, employment and license verification.

**mdoc (ISO 18013-5/7)** - the format behind mobile driver's licenses and government-issued digital IDs. A more tightly governed interoperability environment, stricter format expectations, and more prescribed wallet behavior. If your use case touches government-issued identity, this is your lane.

**Protocols** - define how credentials move between issuers, wallets, and verifiers. Two specs from the OpenID for Verifiable Credentials family handle both sides of the lifecycle:

**OpenID4VCI** governs issuance - how a wallet obtains a credential from an issuer. The issuer-side handshake. **OpenID4VP** governs presentation - how a wallet delivers proof of a claim to your application. It is credential-format-agnostic, supports redirect-based flows today, and supports the Digital Credentials API for web-native UX, where supported.

**The W3C Digital Credentials API** - the runtime layer that makes this usable in a browser. Its role is directly analogous to what WebAuthn does for passkeys: it standardizes how browsers invoke credential wallets, provides users proper consent context, and eliminates the custom URL scheme and deep-link hacks that make wallet invocation brittle today.

In simple terms: the **Digital Credentials API invokes the wallet**, **OpenID4VCI and OpenID4VP manage the protocol flow**, and **SD-JWT VC or mdoc define the credential format**. These layers are complementary, not interchangeable.

## Identity verification is more than a valid signature

Verifying digital credentials requires more than cryptographic signature validation. A credential can have a mathematically valid signature and still be unacceptable in your application's context. What determines acceptability is ecosystem trust.

Two concepts are non-negotiable in any verifier-side implementation:

**Trust List** - the curated set of issuers and signing keys your verifier accepts as authoritative. Think of it as conceptually equivalent to a browser's root CA store. If the issuer is not on your trust list, the credential is invalid in your context regardless of signature validity.

**Trust Framework** - the policy and governance rules defining who can participate in the ecosystem and under what conditions. This is the legal and business contract behind the cryptography.

In the U.S. mDL ecosystem, for example, state DMVs publish their signing keys through the AAMVA Digital Trust Service, which serves as a trust anchor for Issuing Authority Certificate Authorities (IACAs). Your verification flow must integrate with that trust source and handle key rotation as issuers update their infrastructure. Build the trust framework integration as a first-class architectural requirement during implementation.

## Progressing beyond the Digital Credentials API to production VDC verification

The browser rollout of native APIs is still progressing. Developers should not architect a flow that requires the Digital Credentials API as a hard dependency today. The most resilient path is to build on redirect-based OpenID4VP as your baseline; it works universally without specific browser dependencies, and then layer in the Digital Credentials API as a progressive enhancement to provide a first-class UX where supported.

The broader trends driving VDC adoption are not speculative. Government credential infrastructure is becoming a dependency layer on which developers can build. Data minimization is shifting from best practice to legal requirement as privacy regulations tighten globally. The auth and verification layers are separating permanently as both mature independently. Managed verification platforms are closing the tooling gap by abstracting away format handling, protocol flows, and trust-source integrations, so teams do not have to build every layer from scratch.

The practical path for engineering teams is incremental. Start with one verification moment in your product where the current approach creates measurable friction or accumulates unnecessary data liability. Define the minimum claim that moment actually requires. Keep it separate from your auth layer. Build something bounded. Learn from it. Expand.

The identity stack is getting a new layer. The developers who understand the formats, protocols, trust model, and browser reality are the ones who will architect what comes next. That window is open now, and the gap between where issuer infrastructure is and where verifier-side development is leaves real ground to gain for teams that move early.

The question for every senior engineer reading this is not whether VDCs are coming. They are already here. The question is whether your architecture is ready to meet them. [Explore the VDC platform today](https://oktacredentials.dev/).

## Learn more about Verifiable Digital Credentials

If you'd like to explore the standards and ecosystem behind verifiable digital credentials in more detail, these resources are a good starting point.

* [What Are Verifiable Digital Credentials?](https://www.okta.com/identity-101/what-are-verifiable-digital-credentials/)    
* [Getting Started VDC Guide](https://oktacredentials.dev/)   
* [OpenID for Verifiable Credentials - Overview](https://openid.net/sg/openid4vc/)  
* [W3C Digital Credentials API](https://www.w3.org/TR/digital-credentials/)

Follow us on [LinkedIn](https://www.linkedin.com/company/oktadev), [Twitter](https://twitter.com/oktadev), and subscribe to our [YouTube](https://www.youtube.com/c/oktadev) channel to see more content like this. If you have any questions, please comment below!