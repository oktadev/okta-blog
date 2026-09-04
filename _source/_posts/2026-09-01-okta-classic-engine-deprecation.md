---
layout: blog_post
title: "Okta Classic Engine End of Support: What You Need to Know"
author: vanshika
by: advocate
communities: [security, devops]
description: "Okta Classic Engine's Self-Service Registration, Desktop SSO, and Mobile Device Trust reach end of support – upgrade to Identity Engine now."
tags: [okta, identity, security, advocacy]
image: blog/okta-classic-engine-deprecation/social.jpg
type: awareness
---
Starting March 5, 2027, Okta ends support for a few capabilities on Classic Engine. Identity and security requirements continue to evolve. Organizations expect authentication experiences that are more secure, flexible, and adaptable to changing users, devices, and applications. Okta invests in Okta Identity Engine, the modern foundation for passwordless authentication, device assurance, phishing-resistant multifactor authentication, and adaptive security policies.

By moving to Okta Identity Engine, you access an environment aligned with modern security practices that is stronger, more capable, and built to support how you protect access.

## Okta Classic Engine end of life: what's changing

Here's the full list of affected capabilities:

- Self-Service Registration
- Desktop Single Sign-On (Integrated Windows Authentication, or IWA)
- Mobile Device Trust

Once support ends, Okta turns off these capabilities on Classic Engine, and you lose access to them unless you upgrade to Okta Identity Engine first. Okta no longer addresses bugs, security vulnerabilities, or broken flows associated with them after that date. Each capability moves to a modern, more secure approach within Identity Engine, where it continues to benefit from ongoing innovation.

## Why upgrade to Okta Identity Engine

Identity Engine gives you authentication capabilities Classic Engine doesn't have, including passwordless authentication, device assurance, and a modernized policy framework built on a newer authentication pipeline. The upgrade itself is free — you get all these capabilities at no additional licensing cost as part of your existing Okta subscription.

Identity Engine accelerates three core use cases:

- **Passwordless**: Secure, phishing-resistant authentication that removes passwords from your sign-in flow
- **Zero trust**: Identity and access management that goes beyond the recommendations in the NIST Authenticator Assurance Level (AAL) guidelines
- **Device assurance**: Fine-grained controls that verify device posture before granting access

## Affected capabilities and modern replacements

Self-Service Registration allows end users to create their own accounts without administrator involvement. In Identity Engine, you use the Profile Enrollment Policy, which provides the same user self-service experience while enhancing security and modern account management.

Desktop Single Sign-On (SSO), specifically IWA, provides silent desktop authentication through on-premises infrastructure. Migrate to Agentless Desktop Single Sign-On (ADSSO) for modern desktop authentication without agents, or to Okta FastPass for passwordless platform authentication. Consult your Okta account team to determine which option fits your authentication and device management strategy.

Mobile Device Trust restricts app access to managed devices through Workspace ONE. In Identity Engine, migrate to management attestation with Okta Verify instead, which verifies that Okta Verify manages and trusts the mobile device before allowing access — providing enhanced device assurance beyond the previous Mobile Device Trust feature.

## Planning your migration to Okta Identity Engine

Before scheduling your upgrade, identify which of the three affected capabilities your organization currently uses. Then navigate to **Dashboard** > **OIE Upgrade Hub** to schedule your upgrade. Contact support directly from there if you run into any issues.

If you don't see these self-service upgrade options in your dashboard, there may be some tasks that you need to complete before your org is eligible to upgrade. See [Complete your eligibility tasks](https://help.okta.com/oie/en-us/content/topics/identity-engine-upgrade/pre-upgrade-checklist.htm).

Most customers complete their upgrade in under a day. The effort depends on the number of integrations, custom policies, user volume, device configurations, and development and test environments. Organizations with few integrations and minimal custom policies finish in under a day. Those with multiple integrations and some custom policies require one to three days.

Here's what the Admin Console dashboard looks like before and after the upgrade — notice the new **Applications** and **Security** navigation items and the upgrade-complete confirmation:

{% img blog/okta-classic-engine-deprecation/oci-before.jpg alt:"Okta Admin Console before the Identity Engine upgrade" width:"800" %}{: .center-image }

{% img blog/okta-classic-engine-deprecation/oci-after.jpg alt:"Okta Admin Console after the Identity Engine upgrade" width:"800" %}{: .center-image }

## Self-service Okta Identity Engine (OIE) upgrade

Okta provides in-app tooling that lets you [self-service](https://help.okta.com/oie/en-us/content/topics/identity-engine-upgrade/self-service/self-service-process.htm) your upgrade scheduling and remediation from Classic Engine to Identity Engine. The self-service upgrade gives you a flexible upgrade window, unlocks new Identity Engine capabilities and use cases, and guides you through prerequisites and recommendations along the way.

The self-service upgrade runs in two steps:

1. **Check eligibility**: Log in as a super admin and work through your eligibility checklist. Each item shows green once you resolve it. You must resolve items marked as blockers before you proceed; items marked as warnings require you to confirm you understand the impact before you continue.
2. **Schedule the upgrade**: Once your organization is eligible, choose the date and time that works best for you. The upgrade itself typically completes in a few seconds to a few minutes.

If you revert a change on your eligibility checklist after you address it but before your scheduled upgrade date, the upgrade doesn't proceed. Once your upgrade completes, you receive a confirmation email that your organization now runs on Identity Engine with passwordless, flexible, scalable, and zero-trust identity capabilities.

## Preparing for your scheduled upgrade

Admins receive an email four to six weeks before their scheduled Identity Engine upgrade. During this window, Okta recommends the following guidance to ensure a successful upgrade.

Avoid these changes in the four to six weeks preceding your upgrade:

- Adding new functionality to your organization
- Changing app sign-on rules or Okta sign-on policies
- Changing your multifactor authentication (MFA) enrollment process
- Enabling new factors such as SMS, Voice, or a custom OTP factor

These actions don't impact your upgrade and remain safe to perform:

- Adding, editing, or removing users, groups, applications, or group rules
- Any other routine user management task

Create an Identity Engine free trial organization to compare Classic Engine and Identity Engine side by side. Send a message to your end users and admins to prepare them for the upgrade.

## Key timeline


| Milestone | Audience | Date(s) |
| --- | --- | --- |
| Initial notice | Internal | August 3, 2026 |
| Initial notice | Customer | August 5, 2026 |
| Reminders | Internal | October 7, 2026; January 11 and February 15, 2027 |
| Reminders | Customer | September 7, October 7, and November 9, 2026; January 11, February 15, and March 1, 2027 |
| End of support | Customer | March 5, 2027 |


Mark your calendar: March 5, 2027, is the hard deadline. Upgrade before then to avoid losing access to Self-Service Registration, Desktop SSO (IWA), and Mobile Device Trust on Classic Engine.


## Rolling back to Classic Engine


Immediately after you upgrade to Identity Engine, test and validate your critical functionality and make any configuration changes needed to confirm the upgrade succeeded. You have seven days after your upgrade to resolve any issues you find. If you can't resolve an issue in that window, Okta makes its best effort to roll your organization back to Classic Engine.


Some post-upgrade differences don't require a [rollback](https://help.okta.com/oie/en-us/content/topics/identity-engine-upgrade/rollback.htm) – expected, intentional feature and functionality changes are part of the upgrade, documented in the [list of these changes](https://help.okta.com/oie/en-us/content/topics/identity-engine-upgrade/features.htm). Test your custom code and critical use cases in a non-production environment first, since code that doesn't align with your expected use case is a common source of post-upgrade issues. Okta documents rollback-eligible issues, test plans, and configuration action items to acknowledge separately.


If you need to roll back, contact Okta Support and open a P1 (highest-severity) case. Okta's rollback process includes identifying the scope of impact, attempting a reconfiguration, capturing insights, unblocking your organization, and performing the rollback if the reconfiguration doesn't resolve the issue.


Identity Engine rollbacks carry cost and risk, so Okta limits them to production organizations with a significant issue following the upgrade. Some large or complex customers choose not to upgrade production without first testing a rollback in a preview environment; this rollback testing requires approval, and Okta doesn't guarantee it. When an Identity Engine upgrade impacts your organization, Okta's upgrade team generally attempts a fall-forward fix before considering a rollback.


## Best practices after your upgrade


Not every Classic Engine feature carries over to Identity Engine. Identity Engine fully supports most features, and in most cases, a comparable feature is available. Your Okta field and upgrade teams tell you which features are unsupported and provide steps to migrate to the replacement feature.


Okta's upgrade team selects organizations for upgrade based on each organization's configuration and feature usage, so Okta upgrades some organizations earlier than others. Okta eventually upgrades every organization to Identity Engine. If you want to upgrade sooner, contact your account executive.

If you have questions about any part of this transition, contact Okta Support or your account team.


## Plan your migration now!


Schedule testing in a non-production environment before planning your production upgrade during an appropriate maintenance window. Contact Okta Support or your account team with any questions. You have until March 5, 2027, to complete your upgrade, so start your assessment now to make sure you land on the best upgrade window for your organization.

If you want to dig deeper into identity, check out [Introducing Okta Journeys: A Better Way for Developers to Learn Identity](/blog/2026/07/07/okta-journeys-for-developers).

Remember to follow us on [LinkedIn](https://www.linkedin.com/company/oktadev) and subscribe to our [YouTube](https://www.youtube.com/c/oktadev) for more exciting content. Let us know how your Identity Engine upgrade goes in the comments below – we'd love to hear about it.