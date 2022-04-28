---
type: awareness
github: https://github.com/oktadev/okta-dotnet6-webapi-example
layout: blog_post
title: "GDPR and application security"
author: olabayo-balogun
by: contractor
communities: [security]
description: "Learn more about GDPR rules and how they apply to your organization. Make sure your application contains the needed features to ensure high-level security."
tags: [best-practices, security, privacy, gdpr]
tweets:
  - "GDPR rules can be long and esoteric, but it's important to know how to stay in compliance with the policy. Not only will you avoid fines for violations, but users will be more willing to trust your application. In other words: compliance is worth the work."
  - "As the internet has grown, so too has the need to protect users from privacy invasions, fraud, and other types of abuse. If your organization or application is subject to GDPR rules, you'll need to know how to get and stay in compliance."
image: blog/gdpr-and-app-security/gdpr-cover.jpg
---

As the internet has grown, so has the need to protect users from privacy invasions, fraud, or other types of abuse by attackers. The European Union's solution is the General Data Protection Regulation, or [GDPR](https://gdpr.eu/). First put into effect in 2018, the policy applies not only to the organizations in the EU but to any organization that uses or collects data from people in the EU.

If your organization is subject to GDPR, you'll need to know how to stay in compliance. This article will break down the details of this policy so that you understand its potential effects on your application.

{% include toc.md %}
## What to know about GDPR

GDPR, which officially took effect on May 25, 2018, primarily encourages organizations to properly handle user data and privacy. Those not in compliance can face fines, in some cases [large ones](https://gdpr.eu/the-gdpr-meets-its-first-challenge-facebook/).

### GDPR requirements

GDPR compliance imposes multiple requirements on your organization. Here is what you must include in your application:

- Enhanced application security.
- Facilities for users to exercise their data privacy rights.
- Quick data purge at a user's request.
- Users given access to data collected from or about them.
- Consent from users about what data is obtained and how it's used.
- Processing of user data in a way that doesn't compromise the user.

### GDPR penalties

The penalties for breaching GDPR are capped at whichever sum is higher: [$22.8 million USD or four percent of global revenue](https://gdpr.eu/what-is-gdpr/). In the past three years, this has resulted in more than [$1.4 billion USD](https://www.tessian.com/blog/biggest-gdpr-fines-2020/) in fines levied against tech giants, hotels, governmental agencies, and violators in other sectors.

## How GDPR affects application security

If you're responsible for managing your application's security, GDPR can feel like a threat. There is a lot of work involved, and mistakes can lead to costly fines. If you use it properly, though, following GDPR can help your application. Here are some of the benefits it can offer:

### Bigger security budget

Prior to GDPR, many organizations viewed cybersecurity as an expense rather than an investment. This attitude was reflected in understaffing and decreased purchasing power for critical cybersecurity features. The result was easily exploited digital infrastructure.

Because GDPR demands that organizations increase data security and backs up those demands with fines, managers of organizations would rather devote more of their budget to cybersecurity than risk losing profit to a security breach.

### More security integrations

Applications that help with [automation testing](https://www.globalapptesting.com/blog/what-is-automation-testing), [automated breach and attack simulation](https://www.xmcyber.com/what-is-breach-and-attack-simulation/), [virtual private networks (VPNs)](https://www.kaspersky.com/resource-center/definitions/what-is-a-vpn), and [virtual private clouds (VPCs)](https://www.ibm.com/cloud/learn/vpc) are more likely to be added to an organization's security strategy. Such additions help shore up the defenses of digital infrastructure; VPCs and VPNs also offer a sandbox environment for employees to experiment with security features.

### Faster response to breaches

Previously, user data theft wasn't always handled as promptly as it should have been. GDPR enforcement requires organizations to communicate quickly about security breaches, which helps protect affected users and keeps other stakeholders well-informed. This can reduce the fallout of data theft.

## How to comply with GDPR

The [GDPR checklist](https://gdpr.eu/checklist/) provides a snapshot of actions you and your organization need to take to be compliant. They include:

- Employ a [data protection officer](https://www.shrm.org/resourcesandtools/legal-and-compliance/employment-law/pages/global-gdpr-data-protection-officer.aspx).
- Invest in [staff training](https://seersco.com/articles/gdpr-training-for-staff/).
- Ensure that third-party organizations you [transfer data](https://gdpr.eu/article-44-transfer-of-personal-data/) to are compliant as well.
- Stay updated on [which countries](https://gdpr-info.eu/issues/third-countries/#:~:text=The%20third%20countries%20which%20ensure,these%20countries%20is%20expressly%20permitted.) are cleared for data transfers.

### GDPR in your application

The following are questions you need to answer in order to keep your application in GDPR compliance:

**Data collection**

- Is there a good reason for collecting this data?
- Has the collection of non-necessary data been minimized?
- Does the user consent to the collection of this data?

**Data accuracy**

- Have you taken reasonable steps to keep data accurate?
- Can users edit and update potentially inaccurate information?

**Data breach**

- If a data breach has occurred, have you informed supervisors within seventy-two hours of the breach?
- Have you carried out a data protection impact assessment before adopting new technology that interacts with user data?

**Data protection**

- Have you taken adequate measures to prevent the compromise of user data?
- Are your cybersecurity policies and measures up to date?
- Is personally identifiable information (PII) of users properly encrypted to prevent abuse by malignant actors?

**Data rights**

- Do users have the ability to request copies of their data?
- Do users have the ability to object to certain uses of their data?
- Can you delete a user's data immediately if they request it? Does this include removing their data from your backups?

**Data transfer**

- Is the data transfer process handled in a way that doesn't compromise data?
- Does the receiver have enough security installations in place to protect data?
- Does the receiver comply with the human rights charter?
- Is the receiver allowed to obtain data from entities bound by GDPR laws?

## Common GDPR features

Following are examples of features that you can implement in your application to ensure GDPR compliance:

### Frontend cookie consent

Users must be able to choose whether or not to accept cookies. GDPR emphasizes that users should be able to reject cookies easily. Some organizations make it [difficult to do this](https://www.zdnet.com/article/cookie-consent-most-websites-break-law-by-making-it-hard-to-reject-all-tracking/), but such underhanded tactics can result in heavy fines.

A rule of thumb is to display the **Decline** button right next to the **Accept** button (and in the same font size) rather than offering a "Settings" or "Manage Cookies" link that makes it harder for users to refuse cookies and subtly bullies them into accepting the cookies on your platform. There are a ton of [resources](https://betterprogramming.pub/implement-a-cookie-consent-notification-within-5-minutes-82c845c55487) online that can help you implement GDPR-friendly frontend cookies. Compare your options so that you can adopt one that suits your organization best.

### Data mapping

[Data mapping](https://en.wikipedia.org/wiki/Data_mapping), or connecting information from multiple data sets, requires a top-down analysis of all of an organization's databases and what information they hold. This can be a big task, but it ensures transparency and accountability. Data mapping is required for the next steps.

Data mapping can be manual, semi-automated, or automated. You should determine which approach works best for you, depending on the size of your company, your budget, the quality of your data management team, and the amount of data you work with. Deciding how to [implement data mapping](https://blog.hubspot.com/marketing/data-mapping) will require some understanding of your databases, as well as knowing which duplicated columns can be optimized to reduce redundancy.

### Data purge functionality

Previously, even after users requested that their data be deleted, organizations could remove it from public access and keep it somewhere hidden; however, the GDPR mandates that "officially" deleted data must be deleted everywhere. Organizations must ensure that they monitor data to delete it properly from all resources as needed.

Data purge functionality [implementation](https://success.outsystems.com/Documentation/Best_Practices/Architecture/Data_Purging) will likely require some modification to your database schema so that you can identify data to mark for deletion, per user requests, and data to purge due to staleness. A `LastUpdatedDate` and `IsDeleted` column in your data table can be useful in identifying either type of data.

### Refactoring DB schemas

Data purge functionality may involve refactoring [database (DB) schemas](https://en.wikipedia.org/wiki/Database_schema) to add columns noting when a resource was created or whether it was deleted. These columns can be used to automate data purges based on whether the data has been held longer than needed, for instance.

Further DB schema analysis may also be required to ensure that more data isn't being collected than absolutely necessary.

## Compliance is worth the work

GDPR rules can be long and esoteric, but it's important for your organization to understand how to stay in compliance with the policy. Not only will you avoid fines for violations, but users will be more willing to trust your application. Ensuring better data privacy helps all stakeholders.

If necessary, remember you can seek help from a GDPR officer to ensure compliance. Doing this work upfront can save your organization from more costly consequences later on.

Check out these posts and whitepapers from Okta for more information about GDPR:

- [Starting Your General Data Protection Regulation (GDPR) Journey with Okta](/whitepaper/starting-your-general-data-protection-regulation-journey-with-okta/)
- [GDPR, Privacy and Consent Management: How Okta Can Support Your CIAM Requirements](/blog/2019/01/gdpr-privacy-and-consent-management-how-okta-can-support-your-ciam-requirements/)
- [CCPA vs. GDPR: Similarities and Differences Explained](/blog/2021/04/ccpa-vs-gdpr/)

If you have any questions about this post, please add a comment below. For more interesting content, follow [@oktadev](https://twitter.com/oktadev) on Twitter, connect with us on [LinkedIn](https://www.linkedin.com/company/oktadev/), and subscribe to our [YouTube](https://www.youtube.com/oktadev) channel.

_Cover image credit: Photo of security cameras by Lianhao Qu via [Unsplash](https://unsplash.com/photos/LfaN1gswV5c)._
