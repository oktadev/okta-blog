---
layout: blog_post
title: "Identity Broker case study: How to prevent tenant isolation vulnerabilities with Okta's Account Auto-Link"
author: ntrojanowska
by: advocate
communities: [security]
description: "Discover how misconfigured Account Auto-Link in Okta can break Software-as-a-Service tenant isolation and learn how to configure Okta as an Identity Broker in a secure way."
tags: []
image: blog/identity-broker-case-study/cover.jpg
type: awareness
canonical: https://www.securing.pl/en/identity-broker-case-study-how-to-prevent-tenant-isolation-vulnerabilities-with-oktas-account-auto-link/
---

During a recent pentest, I analyzed a multitenant Software-as-a-Service application that used Okta as its Identity Broker. Because of a misconfiguration, I was able to pivot from one tenant's perspective and gain access to every other tenant's data, which completely undermined the intended isolation. **The root cause? Misconfigured Okta's Account Auto-Linking settings**.

When I look at this issue now, it seems deceptively simple. In reality, it highlights how subtle misconfigurations in Identity Broker setups, especially in multitenant environments, can have far-reaching consequences. This kind of vulnerability is easy to overlook during a pentest because it requires a deep understanding of how identity federation interacts with tenant isolation. It's a reminder that even small configuration choices can critically impact security. I hope that sharing this case might help others spot similar issues, whether they are configuring an Identity Broker for the first time or reviewing existing setups.

**Table of Contents**{: .hide }
* Table of Contents
{% include toc.md %}

# What is an Identity Broker? 

As I discussed in my [previous article](https://www.securing.pl/en/which-iam-saas-architecture-is-for-you-exploring-iam-architectures-in-software-as-a-service-solutions/), there are several architectural patterns for implementing authentication and Single Sign-On (SSO) in multitenant applications. One effective approach is to use an intermediary Identity Provider, also known as an Identity Broker. In other words, an **Identity Broker is a service that acts as a bridge between an application and multiple external Identity Providers**, allowing users to authenticate through various sources while presenting a unified interface to the application. 

This architecture simplifies identity management by removing the need to implement and maintain multiple user management mechanisms or support both SAML and OpenID Connect protocols directly. Instead, you only need to establish a single SSO integration with the Identity Broker and leverage its federation capabilities and documentation to connect external IdPs as needed.

Our customer decided to use **Okta as an Identity Broker** for their SaaS platform. Then they set up Single Sign-On integrations for each tenant that required a seamless login experience, enabling users to authenticate using their corporate Identity Providers.

{% img blog/identity-broker-case-study/diagram1.png alt:"Okta as Identity Broker" width:"800" %}{: .center-image }

From the end user's perspective, the integration works as follows:

{% img blog/identity-broker-case-study/diagram2.png alt:"Okta as Identity Broker from end user's perspective" width:"800" %}{: .center-image }

# Can I trust an external Identity Provider?

As mentioned earlier, tenants often request integration with their own Identity Providers to enable a seamless login experience for their corporate users. But this raises an important question: **to what extent can you trust these external IdPs**?

Broadly speaking, Identity Providers fall into two categories:

* **Social Identity Providers**: These allow users to authenticate using personal accounts across various platforms. Examples include Google, Facebook, Apple, LinkedIn, GitHub, and others.

* **Corporate Identity Providers**: These are established and managed by organizations to authenticate their employees. Common examples include Azure Entra ID, Google Cloud Identity, Keycloak, Okta, AD FS, and custom enterprise implementations.

With major **social Identity Providers**, you can generally trust the identity information returned via OpenID Connect. These providers (such as Google or Apple) have well-established security practices and consistent implementations of the protocol. However, it's important to remember that anyone can create a web application and present themselves as an Identity Provider, so caution is essential when onboarding new integrations.

Even among reputable providers, **there can be subtle differences in how claims are structured or delivered**, despite using the same standard. That said, these variations are usually manageable and not the primary concern at this stage.

With **corporate Identity Providers**, the situation is more complex. These systems are highly configurable to meet diverse organizational IAM requirements. Typically, administrators have full control over the claims delivered in both OIDC and SAML integrations, which means the information passed during authentication doesn't necessarily have to be a verified email or a domain-bound identity. In fact, it can be **anything the administrator chooses to include**.

Let me share an interesting insight from the IAM world from the penetration testing perspective. When I perform a Single Sign-On pentest and I need to use my own Identity Provider, I usually choose Azure Entra ID, since it is also popular among our clients. Here is a standard Attributes & Claims configuration for SAML: 

{% img blog/identity-broker-case-study/scr1.png alt:"Entra ID: Attributes & Claims" width:"800" %}{: .center-image }

However, I often configure Azure Entra ID to include the following attributes instead:

{% img blog/identity-broker-case-study/scr2.png alt:"Entra ID: Attributes & Claims - modified" width:"800" %}{: .center-image }

See anything unusual? That's right – **instead of a User Principal Name, which has to contain a verified domain, I deliberately include a claim that's not subject to any validation, e.g. user.city**. This attribute can carry any value I choose:

{% img blog/identity-broker-case-study/scr3.png alt:"Entra ID: Setting user.city to charlie@example.com" width:"700" %}{: .center-image }

It doesn't have to include a verified domain. In fact, it doesn't even need to be an email address at all.

{% img blog/identity-broker-case-study/scr4.png alt:"Entra ID: Setting user.city to a malicious input" width:"700" %}{: .center-image }

And then we get the following SAML Response:

{% raw %}
```
<Subject>
      <NameID Format="urn:oasis:names:tc:SAML:1.1:nameid-format:unspecified">{{7*7}}</NameID>
</Subject>
```
{% endraw %}

Of course, the same outcome can be achieved using different Identity Providers, a custom implementation, or simply by manually signing assertions with a SAML certificate. However, what I find particularly compelling about this method is that it demonstrates how a trusted Identity Provider can still be leveraged to inject untrusted values into SAML authentication.

On the other hand, I haven't found any way to manipulate the email claim delivered by Azure Entra ID in OpenID Connect integrations. However, this isn't a universal rule. With other Identity Providers, such as Okta, it's entirely possible to deliver custom claims in OIDC responses. That means you can include any attribute you want, regardless of whether it's verified or meaningful from a security standpoint.

{% img blog/identity-broker-case-study/scr5.png alt:"Okta: Web App User Profile Mappings" width:"800" %}{: .center-image }

To sum up: In a shared, multitenant environment, we must be extremely cautious when integrating with external Identity Providers. **Trust boundaries should be clearly defined and strictly enforced** to prevent misconfigurations or abuse.

Fortunately, **Okta provides the flexibility and control needed to implement these boundaries effectively**... as long as it's configured properly. We'll return to the specifics of that configuration shortly.

# Identity Broker vs Multi-Factor Authentication

By default, my Okta environment enforced Multi-Factor Authentication (MFA) for every authentication attempt, including Single Sign-On logins originating from external Identity Providers. Below is the original authentication policy configuration:

{% img blog/identity-broker-case-study/scr6.png alt:"Okta: Default Authentication Policy configuration" width:"800" %}{: .center-image }

However, when using Okta as an Identity Broker for a SaaS platform, this default behavior can lead to poor user experience. Tenants typically already enforce MFA within their own IdPs, and requiring an additional MFA step just to access the application may introduce unnecessary friction. As a result, **MFA enforcement is often disabled for logins coming from external IdPs**, relying instead on the tenant's own security controls.

# Case study: Misconfigured Okta Identity Broker in a multi-tenant environment

Now let's return to our customer's case. I asked them to share a screenshot of any configuration they had set up for their tenants. Here's the configuration they sent me, available under Security > Identity Providers in the Okta admin console:

{% img blog/identity-broker-case-study/scr7.png alt:"Okta: Vulnerable External Identity Provider configuration" width:"800" %}{: .center-image }

The settings that are **crucial for enforcing tenant isolation** in this configuration are:
* ***Filter***: A regex that defines which users are allowed to authenticate through a specific Identity Provider.
* ***Account link policy***: Controls if Okta should automatically link incoming identities to existing Okta users. 
* ***Auto-Link filters***: Specifies conditions under which Okta should automatically link an external identity to an internal user account.

The combined configuration enforced by these three controls is what ultimately determines the tenant isolation. In this case, that configuration failed entirely, resulting in **a complete lack of isolation and leaving the system wide open to cross-tenant access and identity confusion**.

# Exploitation of improper tenant isolation in Identity Broker setups 

The attack scenario unfolds as follows: **The attacker is a legitimate administrator of a tenant** within the SaaS application who has requested to integrate their corporate Identity Provider using a SAML or OIDC federation.

{% img blog/identity-broker-case-study/diagram3.png alt:"Okta as Identity Broker for a multi-tenant application" width:"800" %}{: .center-image }

The goal of the attack is to impersonate a user from a different organization by taking advantage of the lack of tenant isolation in the Identity Broker configuration.

{% img blog/identity-broker-case-study/diagram-attack1.png alt:"Misconfigured Identity Broker" width:"800" %}{: .center-image }

First, I need to enumerate the tenants of the SaaS application and update my user's email in my IdP to impersonate the victim's identity:

{% img blog/identity-broker-case-study/scr8.png alt:"Entra ID: Impersonating a different user" width:"700" %}{: .center-image }

And now I can simply... log in to Victim's tenant as victim@victim-tenant.com, since Okta MFA was disabled. 

# Privilege escalation to Okta Super Admin
It's important to note that other tenants might not be the only possible targets. Let's pivot and attempt privilege escalation to an Okta Super Admin, enabling lateral movement across environments.

{% img blog/identity-broker-case-study/diagram-attack2.png alt:"Impersonating Okta Super Administrator" width:"800" %}{: .center-image }

The key question is: was MFA disabled solely for SaaS application logins, or was it disabled globally, perhaps to allow administrators seamless access to the Okta Admin Console via their corporate SSO, without additional friction?

**In my case, this misconfiguration allowed me to achieve full privilege escalation to an Okta administrator.**

# Bypassing tenant isolation despite Okta MFA enforcement

But what if Okta MFA wasn't disabled? We still have two more options to explore.
* **First-time logins**: In a default Okta environment, Multi-Factor Authentication is required for all logins, unless the user is signing in for the first time and hasn't yet configured a second factor. This is a common setup to support onboarding workflows. If we can find such account and impersonate it, we can still achieve cross-tenant access.
* **New accounts**: If Just-in-Time (JIT) provisioning is enabled, a new user account will be created when the SSO login doesn't match any existing users in Okta, and it also won't have any MFA in place. In that case, we might also be able to automatically access a different tenant's environment, depending on the email domain we use during login.

# Attack results by Okta configuration

To check whether the attack works under different configurations, I've prepared a graph that breaks down the attack results based on different options used in Okta setup.

{% img blog/identity-broker-case-study/attack-graph.jpg alt:"Attack results by Okta configuration" width:"900" %}{: .center-image }

# Okta as Identity Broker: Secure configuration

Now let's talk about mitigations. I'll focus on setups that use automatic account linking. We'll revisit the External Identity Provider settings mentioned earlier, and also look at possible Authentication Policy configurations.

## External Identity Provider: Filter

The first way to enforce tenant isolation when configuring an external Identity Provider is by setting up a filter. This filter is a regular expression that defines which users are allowed to authenticate through a specific IdP. Filter configuration is available for both SAML and OIDC integrations in Okta. I strongly recommend always enabling it.

{% img blog/identity-broker-case-study/scr9.png alt:"Okta External Identity Provider: Filter" width:"600" %}{: .center-image }

## External Identity Provider: Auto-Link filters – Include specific groups

Another way to restrict which accounts can authenticate through an external IdP is by enabling Auto-Link filters for specific groups. New users can be added to groups manually or assigned to groups automatically based on dynamic rules. Example rule in Okta Expression Language: 

```
String.substringAfter(user.login, "@") == "securing.pl"
```

Please note that using basic conditions in group rules is not sufficient, as the only available operators are "equals", "starts with", and "contains". These options do not allow you to verify how a user's email address ends, which is necessary for enforcing domain-based access controls:

{% img blog/identity-broker-case-study/scr10.png alt:"Okta Groups Dynamic Rules" width:"800" %}{: .center-image }

Auto-Link filters can be enabled also for all types of integrations, not only SAML and OIDC. For Defense-in-Depth, I would advise to enable Auto-Link filters as well if you choose to enable account auto-linking in a multi-tenant environment.

## Authentication Policy (MFA)

If you need to disable Multi-Factor Authentication, make sure to do it only for a specific application where it's absolutely necessary. Never disable MFA for access to the Okta Admin Console, as doing so exposes your entire identity infrastructure to unnecessary risk. Admin access should always be protected with strong MFA policies.

## Accounts in multiple organizations

Keep in mind that if your SaaS application allows user accounts to be associated with multiple organizations, logging in via one tenant's Single Sign-On will grant access to all organizations the user is linked to, which again breaks the intended tenant isolation. To mitigate this, **consider enforcing a strict one-organization-per-user model**. This approach aligns well with linking each external Identity Providers to a specific company domain, which I recommended earlier in this article.

# Takeaways
This issue is not limited to Okta. If you are using an Identity Broker in a multi-tenant SaaS environment, make sure to verify how company IdPs are integrated to control which users can authenticate and what resources they can access. Always review your IdP's account linking behavior carefully to avoid accidental privilege escalation or tenant boundary violations.

# References
- [Okta Developer: Multi-tenant solutions](/docs/concepts/multi-tenancy/)

- [Okta Developer: External Identity Providers](/docs/concepts/identity-providers/)

- [Okta Developer: Okta Expression Language overview guide](/reference/okta-expression-language/)

- [Okta: How to Configure SAML 2.0 for Okta Org2Org Application](https://saml-doc.okta.com/SAML_Docs/Configure-SAML-2.0-for-Org2Org.html)

