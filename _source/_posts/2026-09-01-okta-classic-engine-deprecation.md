---
layout: blog_post
title: "Classic Engine Feature EOL: SSR, Desktop SSO, Mobile Device Trust"
author: vanshika
by: advocate
communities: [security, devops]
tags: []
description: "Okta Classic Engine's Self-Service Registration, Desktop SSO, and Mobile Device Trust reach end of support – upgrade to Identity Engine now."
image: blog/okta-classic-engine-deprecation/social.jpg
type: awareness
---
Starting March 5, 2027, Okta ends support for a few capabilities on Classic Engine. Identity and security requirements continue to evolve. Organizations expect authentication experiences that are more secure, flexible, and adaptable to changing users, devices, and applications. Okta invests in Okta Identity Engine, the modern foundation for passwordless authentication, device assurance, phishing-resistant multifactor authentication, and adaptive security policies.

By moving to Okta Identity Engine, you access an environment aligned with modern security practices that is stronger, more capable, and built to support how you protect access.

## What's changing

Here's the full list of affected capabilities:

- Self-Service Registration
- Desktop Single Sign-On (Integrated Windows Authentication, or IWA)
- Mobile Device Trust

Once support ends, Okta turns off these capabilities on Classic Engine, and you lose access to them unless you upgrade to Okta Identity Engine first. Okta no longer addresses bugs, security vulnerabilities, or broken flows associated with them after that date. Each capability moves to a modern, more secure approach within Identity Engine, where it continues to benefit from ongoing innovation.

## Why upgrade to Okta Identity Engine

Identity Engine gives you authentication capabilities Classic Engine doesn't have, including passwordless authentication, device assurance, and a modernized policy framework built on a newer authentication pipeline. The upgrade itself is free, you get all these capabilities at no additional licensing cost as part of your existing Okta subscription.

Identity Engine accelerates three core use cases:

- **Passwordless**: Secure, phishing-resistant authentication that removes passwords from your sign-in flow
- **Zero trust**: Identity and access management that goes beyond the recommendations in the NIST Authenticator Assurance Level (AAL) guidelines
- **Device assurance**: Fine-grained controls that verify device posture before granting access

## Okta Identity Engine elevates identity capabilities

Self-Service Registration allows end users to create their own accounts without administrator involvement. In Identity Engine, you use the Profile Enrollment Policy, which provides the same user self-service experience while enhancing security and modern account management.

Desktop Single Sign-On (SSO), specifically IWA, provides silent desktop authentication through on-premises infrastructure. Migrate to Agentless Desktop Single Sign-On (ADSSO) for modern desktop authentication without agents, or to Okta FastPass for passwordless platform authentication. Consult your Okta account team to determine which option fits your authentication and device management strategy.

Mobile Device Trust restricts app access to managed devices through Workspace ONE. In Identity Engine, migrate to management attestation with Okta Verify instead, which verifies that Okta Verify manages and trusts the mobile device before allowing access, providing enhanced device assurance beyond the previous Mobile Device Trust feature.

For step-by-step guidance on replacing these Classic Engine auth flows, see [Replace Classic Engine authentication flows with Okta Identity Engine](https://developer.okta.com/docs/journeys/OCI-replace-ce-auth-flows/main/).

## Planning your migration to Okta Identity Engine

Every organization's environment differs, so your timeline and steps depend on your current configuration and feature usage. Reach out to your account executive for help and clarification on scheduling your upgrade.

## Key timeline

Self-Service Registration, Desktop SSO (IWA), and Mobile Device Trust sunset on Classic Engine according to the timeline below.

| Milestone | Audience | Date(s) |
| --- | --- | --- |
| Initial notice | Internal | August 3, 2026 |
| Initial notice | Customer | August 5, 2026 |
| Reminders | Internal | October 7, 2026; January 11 and February 15, 2027 |
| Reminders | Customer | September 7, October 7, and November 9, 2026; January 11, February 15, and March 1, 2027 |
| End of support | Customer | March 5, 2027 |

Mark your calendar: March 5, 2027, is the hard deadline. Upgrade before then to avoid losing access to Self-Service Registration, Desktop SSO (IWA), and Mobile Device Trust on Classic Engine.

## Best practices after your Okta Identity Engine upgrade

Not every Classic Engine feature carries over to Identity Engine. Identity Engine fully supports most features, and in most cases, a comparable feature is available. Your Okta field and upgrade teams tell you which features are unsupported and provide steps to migrate to the replacement feature.

Okta's upgrade team selects organizations for upgrade based on each organization's configuration and feature usage, so Okta upgrades some organizations earlier than others. Okta eventually upgrades every organization to Identity Engine. If you want to upgrade sooner, contact your account executive.

If you have questions about any part of this transition, contact Okta Support or your account team.

## Plan your migration now!

Schedule testing in a non-production environment before planning your production upgrade during an appropriate maintenance window. Contact Okta Support or your account team with any questions. You have until March 5, 2027, to complete your upgrade, so start your assessment now to make sure you land on the best upgrade window for your organization.

## Resources

If you'd like to learn more about identity and the concepts covered in this post, explore these official Okta resources:
- [Introducing Okta Journeys: A Better Way for Developers to Learn Identity](/blog/2026/07/07/okta-journeys-for-developers)
- [Replace Classic Engine authentication flows with Okta Identity Engine](https://developer.okta.com/docs/journeys/OCI-replace-ce-auth-flows/main/)

Remember to follow us on [LinkedIn](https://www.linkedin.com/company/oktadev) and subscribe to our [YouTube](https://www.youtube.com/c/oktadev) for more exciting content. Let us know how your Identity Engine upgrade goes in the comments below, we'd love to hear about it.