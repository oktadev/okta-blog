---
layout: blog_post
title: "It's Time to Evolve Authentication Security"
author: alisa-duncan
by: advocate
communities: [devops,security,mobile,.net,java,javascript,go,php,python,ruby]
description: ""
tags: [identity, mfa, phishing-resistant, passwordless, passkey, webauthn, fido2]
tweets:
- ""
- ""
- ""
image:
type: awareness
---

Identity-based attacks have become prevalent, and successful attacks are impactful. Attackers use increasingly sophisticated ways to breach privileged systems, so we must defend our accounts by elevating our identity security methods. Okta is committed to leading the industry in combating identity-based attacks through initiatives like the [Secure Identity Commitment](https://www.okta.com/secure-identity-commitment/). Here are actionable steps you can take to protect your applications.

**Table of Contents**{: .hide }
* Table of Contents
{% include toc.md %}

## Identity assurance is the goal

When we think about authentication, we think of gaining access to sensitive resources. We want some level of barrier so the data isn't publicly available. It's not enough to merely add a barrier, though. Wouldn't it be more useful to have assurances that the user's credentials are uniquely theirs and that no one can impersonate them? It's more than a fence around the data; we also have assurances that the user accessing the data is who they say they are. It sounds great in theory.

We want to balance security requirements with our users' comfort in an ideal world. Increased security requirements may increase user friction points. The more friction points a user encounters, the lower their satisfaction, engagement, and app usage – the balance point changes depending on the app user and the data sensitivity. For example, requirements may differ for public applications catering to consumers (B2C) versus internal applications used within an organization's workforce.

Let's navigate this balancing act together so you can find the right path for your needs.

## Demystifying authentication factors

Before we dive into possible solutions, let's review the three authentication factor categories:

<table>
<tr>
    <td>{% img blog/authentication-identity-security/factor-knowledge.jpg alt:"Icon of someone thinking" width:"100" %}</td>
    <td markdown="span">
      **Something you know** <br/>
      Knowledge factors include passwords and PINs
    </td>
</tr>
<tr>
    <td>{% img blog/authentication-identity-security/factor-possession.jpg alt:"Icon showing devices such as computer, tablet, and phone" width:"100" %}</td>
    <td markdown="span">
    **Something you have**<br/>
    Possession factors include devices such as smart cards, security keys, phones, and tablets
    </td>
</tr>
<tr>
    <td>{% img blog/authentication-identity-security/factor-inherence.jpg alt:"Icon of a hand with fingerprint" width:"100" %}</td>
    <td markdown="span">
    **Something you are**<br/>
    Inference factors include biometrics such as fingerprints and facial recognition
    </td>
</tr>
</table>

Authentication relies on one or more factor categories to establish identity assurances before granting users access to applications.

## Embrace phishing-resistant authentication

The best-in-class, more secure, and recommended authentication methods are phishing-resistant. Phishing-resistant authentication is more difficult to hack and mitigates unauthorized access due to intercepting PINs and sign-in links.  
Phishing-resistant authentication relies on biometrics and specialized devices or equipment to prevent an attacker from accessing your application.

Phishing-resistant factors include the following forms.

<h3 class="no_toc">Smart cards and PIV cards</h3>

Large enterprises, regulated industries, and government entities widely use smart cards and PIV cards. These organizations may issue smart cards for attaching personal profiles to shared workstation access, as seen in banks or hospitals. Organizations may issue cards to their workforce even when the employee uses an issued laptop as an extra security measure.

**Pros**: Secure, can be uniquely tied to the user, and well utilized in industries

**Cons**: Requires a physical device that can be lost or stolen, not scalable to use for public and consumer security due to hardware requirements and convenience

<h3 class="no_toc">Security keys and hardware devices</h3>

Hardware security keys are another elevated security mechanism organizations use for their workforce. Security keys can have differing levels of security, from the older and less secure Time-based One-Time Password (TOTP) keys, Near Field Communication (NFC) keys that require a secondary device such as a phone, and keys requiring biometrics. For the highest level of security, you'll want to use keys and hardware with biometric capabilities. Security keys work by storing the credentials on hardware, which requires registering the key on each device you use. While keys that plug into computers may be familiar, biometric-capable hardware, such as a laptop, and capable software can also be a phishing-resistant authentication factor. Okta FastPass on a biometric-capable computer is an example of a phishing-resistant hardware device.

**Pros**: Biometric-based hardware devices are highly secure.

**Cons**: It may require a physical device, you need to register the key on each device you use, and it isn't scalable for public and consumer security due to hardware requirements and convenience. Device manufacturers can make them small and lightweight for convenience, alleviating concerns about relying on bulky equipment. But what happens if the user loses or damages this device? How long would it take before they have access to the system again?

<h3 class="no_toc">FIDO2 with WebAuthn and Passkeys</h3>

FIDO2 and WebAuthn combined are a strong authentication factor that utilizes biometrics on capable devices and new capabilities in web frameworks to increase user security reliably. This factor requires a biometric-capable device meeting FIDO standards, such as a phone or a laptop, and capable software. The [World Wide Web Consortium spec for web authentication](https://www.w3.org/TR/webauthn-2/) (WebAuthn) means JavaScript-based web apps can support phishing-resistant authentication right in the browser. The difference between phishing-resistant hardware factors, such as security keys or Okta FastPass on biometric devices and Passkeys, is discoverability and the ability to port credentials. Instead of storing credentials on the hardware, discoverable FIDO authentication stores credentials outside software, such as in the iCloud Keychain or Android Keystore. The credential storage makes authenticating on the same site across different devices within the same ecosystem possible without re-registering.

**Pros**: Biometric-based FIDO authentication is secure, scales for public and consumer users, and there is no need to carry a security key or card

**Cons**: Each app must support this authentication method, and consumers must own capable devices

For the highest levels of identity security, use phishing-resistant factors.

<h3 class="no_toc">Phishing-resistant factors decision tree</h3>

We recommend phishing-resistant factors at Okta as they offer the best application protection. You have identity assurances built in, along with authentication security. Consider this decision tree for your authentication needs:

{% img blog/authentication-identity-security/phr-decision-tree.svg alt:"Decision tree for phishing-resistant factors. If the target user type are consumers, choose passkeys. For workforce users, if the user base require shared kiosks or hardware, elect hardware keys or smart cards. In all other cases, use FIDO2 with WebAuthn." width:"800" %}{: .center-image }

{% comment %}
Tweak the diagram on https://mermaid.live/ with the following content
sequenceDiagram
    participant C as Client
    participant A as Authorization Server
    C-->>+A: Redirect to sign-in page for user challenge
    A-->>-C: Redirect to client with authorization code
    C->C: Generate public/private key and DPoP proof 
    C->>+A: Request token sending DPoP proof and code 
    A->>-C: Token bound to proof
{% endcomment %}

## Avoid weak authentication methods

We no longer live in a world where passwords alone are good enough to secure sensitive resources. Studies have shown that over [80% of data breaches result from compromised credentials](https://www.verizon.com/business/resources/reports/dbir/). We must elevate authentication methods by avoiding weak credentials and preferring more substantial forms. Look towards industry leaders in cybersecurity, including companies such as Okta, nonprofit foundations such as OWASP, and government standards such as [NIST](https://pages.nist.gov/800-63-4/) and [NCSC](https://www.ncsc.gov.uk/collection/10-steps/identity-and-access-management), to guide you towards strong factors and away from weak ones. In particular, be wary of legacy factors.

<h3 class="no_toc">Avoid security questions as a factor</h3>

Cybersecurity organizations do not recommend security questions, as they are neither secure nor reliable. Security questions are vulnerable to social engineering attacks. It's best to avoid this method.

<h3 class="no_toc">SMS one-time codes are unsafe</h3>

Attackers can access those messages through SIM-swapping and interception attacks. NIST proposes deprecating SMS as an authentication factor, so consider alternate authentication methods.

<h3 class="no_toc">Email Time-based One-Time Passwords (TOTP) have similar security issues as SMS</h3>

Using email for TOTP presents similar security issues as SMS codes. Attackers can intercept email. Emails may mistakenly get flagged as spam. Email delivery delays can result in configuring longer time validity periods, causing lower security.

<h3 class="no_toc">Avoid password antipatterns</h3>

Passwords must evolve by allowing longer character lengths and character variety. Avoid antipatterns such as complexity requirements and forced password resets. Enforce strong passwords by checking them against compromised password databases. Password managers can offset user risks by recommending unique, strong passwords for each site and applying the stored passwords. Still, password managers aren't failproof, and users may use insecure passwords for the password manager themselves.

These factors do offer a weak barrier to sensitive resources, but a key element is missing: identity assurance. The weak authentication factors lack the safeguards to ensure the users making the authentication challenge are who they say they are. 

## Elevate authentication security with Multi-factor Authentication (MFA)

Passwords alone require caution, but a combination of passwords and other factors elevates identity security. A single legacy authentication factor is rarely secure enough to protect any resource; it isn't safe enough to access your users and Okta configuration. 

Adding factors such as authenticator apps supporting TOTP and push authentication increases the barriers to sensitive data. Raising the barriers helps protect your application by requiring more effort for impersonators trying to hack accounts. However, using the weakest authentication factors combined isn't as strong as phishing-resistant.

<h3 class="no_toc">Combine strong authentication factors</h3>

The best way to ensure authentication security and reasonable identity assurances is to combine moderate to high authentication factors. Doing so supports good security with secure fallback systems. For example, if you can't use phishing-resistant authentication in a consumer scenario, layer a password with push authentication. Allow the consumer to opt into Passkeys while supporting MFA. For workforce scenarios, issue hardware keys as a backup factor in addition to Okta FastPass. 

Okta's authentication policy builder can help you create strong authentication requirements to access Okta services and applications protected by Okta's sign-in while tailoring session lifetimes to your needs.

**It's time we evolve our application's authentication security and favor phishing-resistant factors.**

## Customize authentication requirements dynamically

Identity security isn't a one-size-fits-all solution. FIDO2 with WebAuthn factors such as Okta FastPass for workforce use cases and Passkeys for consumer use cases can be the standard methodology.

<h3 class="no_toc">Consider Adaptive MFA for conditional authentication requirements</h3>

Complex use cases call for more tailoring. Your needs may change depending on use factors such as geographic location, IP addresses, device attributes, and threat detection. Identity Providers offer solutions that help you tailor authentication security. For example, Okta supports features such as [Adaptive MFA](https://www.okta.com/identity-101/adaptive-authentication/), which adjusts authentication requirements depending on context, and [Identity Threat Protection](https://help.okta.com/oie/en-us/content/topics/itp/overview.htm), which continuously monitors threats and can react by terminating authenticated sessions. If your industry requires the highest levels of identity security or your application contains highly sensitive resources, look to these options.

<h3 class="no_toc">Verify identity for sensitive resource requests</h3>

Identity assurances don't have to happen only at application entry. When sensitive actions and data require elevated authentication, consider using the [Step Up Authentication Challenge](https://auth0.com/blog/what-is-step-up-authentication-when-to-use-it/) to protect resources. The Step Up Authentication Challenge is an OAuth standard for requiring secure factors or recent authentication when performing actions within the application.

Third-party interactions may require identity assurances. While we primarily think about authenticating as a solo activity, think about the case where someone calls into a help center for support. The help center agent needs to verify identity remotely, and we don't want to rely only on weak methods such as passwords or pins. Consider using [Client-Initiated Back-channel Authentication (CIBA)](/blog/2025/07/31/okta-ciba) for your application in cases like this.

What do all these recommendations mean for developers working on these applications? How can we take advantage of identity security best practices?

## Build secure apps by applying identity security concepts

We developers have a tough job. We must ensure our applications meet compliance requirements and guard against security threats, all while delivering product features. Authentication is foundational, but not your entire product line. It's an expectation that doesn't drive product innovations for your app, but detrimental when implemented incorrectly.

<h3 class="no_toc">Use an Identity Provider (IDP) that supports OAuth 2.1 and OpenID Connect (OIDC)</h3>

To best protect your application and free yourself from getting into the weeds of implementing authentication, delegate it to your Identity Provider (IdP) whenever possible. When you delegate authentication to an IdP like Okta, you can access industry-recognized best practices, such as using OAuth 2.1 and OpenID Connect (OIDC) standards with user redirect for the authentication challenge. Redirecting the user to the Okta-hosted Sign-in Widget frees you from managing authentication methods manually. It allows you to leverage the Sign-in Widget user challenge with the Okta Identity Engine (OIE) for phishing-resistant authentication factors. Using the Okta Identity Engine means your app accesses the latest and greatest features for secure identity management.

<h3 class="no_toc">Delegate authentication to your Identity Provider (IDP)</h3>

When you redirect the user to Okta for sign-in, you make authentication Okta's problem. And that's great because it provides you with the most security and the least amount of work. Your Okta administrator can configure authentication policies and add business rules to those authentication user challenges. You don't have to worry about how to implement WebAuthn in your app, ensuring you have all the user controls to handle push notifications, or track sign-in context to adapt authentication factors. It's all handled. All you need to know is whether the user completed authentication challenges, and then you can return to delivering features.

If your application's use case demands a custom look and feel, you can customize the Okta-hosted Sign-In Widget's styles. When you combine a custom-branded Sign-In Widget with a custom domain, your users may never know they leave your site. We are continuing to build out capabilities in this area so you can deliver both secure identity and branding requirements. Be on the lookout for content in this area utilizing Okta SDK's capabilities.

<h3 class="no_toc">Use a vetted and well-maintained OIDC client library</h3>

A vetted, well-maintained OIDC client library increases implementation speed, lowers developer effort, and, most importantly, is crucial for authentication security. Because OAuth 2.1 and OIDC are open standards, writing your code to handle the required transactions is tempting. Resist the temptation for the sake of your application security and the efforts for the continued maintenance that good authentication libraries require. It's too easy to introduce developer error in something like the Proof-Key for Code Exchange (PKCE) verification steps or to miss something in the token verification, for example. [Many more subtle errors can adversely affect your application](https://salt.security/blog/traveling-with-oauth-account-takeover-on-booking-com). Resist the temptation. 

The standards can also change over time, such as adding new protection mechanisms or introducing breaking changes. Writing custom implementation means changes and maintenance become your responsibility, and you [can't presume prior spec knowledge is good enough, as specs can change](https://darutk.medium.com/oauth-oidc-mistakes-7f3bb909518b). Resist the temptation and take this responsibility off your plate.

Ideally, use a vetted, well-maintained OIDC client library that is [OIDC-certified](https://openid.net/developers/certified-openid-connect-implementations/) or the [Okta SDKs](https://developer.okta.com/code/). Okta's SDKs not only securely handle the OAuth handshake and token storage for you, but you'll also get built-in support for the latest advancements in OAuth specs, such as Step Up Authentication Challenge, CIBA, and more.

## Join the identity security evolution

Protect your workforce and customers by elevating authentication factors using phishing-resistant factors. Allow Okta to work for you by configuring strong authentication policies. Enable dynamic authentication factors and threat detection in your Okta org to mitigate data breaches and strengthen your reputation.
In your software applications, leverage Okta SDKs to redirect users to the Okta-hosted Sign-in Widget to quickly gain access to the more secure authentication factors efficiently and seamlessly. Then, build more safety in your apps by adding the Step Up Authentication Challenge to maintain identity security. Staying updated with the latest security best practices and thoughtfully integrating OAuth specs are essential to secure identity management. 

## Learn more about phishing-resistant authentication, identity security, and protecting your applications

I hope you feel inspired to join the secure identity evolution. If you found this post interesting, you may enjoy the following:

 * [How to Secure the SaaS Apps of the Future](https://sec.okta.com/articles/appsofthefuture/)
 * [Introducing CIBA for Secure Transaction Verification](/blog/2025/07/31/okta-ciba)
 * [Add Step-up Authentication Using Angular and NestJS](/blog/2024/03/12/stepup-authentication)
 * [Why You Should Migrate to OAuth 2.0 From Static API Tokens](/blog/2023/09/25/oauth-api-tokens)

Remember to follow us on [LinkedIn](https://www.linkedin.com/company/oktadev) and subscribe to our [YouTube](https://www.youtube.com/c/oktadev) for more exciting content. We also want to hear from you about topics you want to see and questions you may have. Leave us a comment below!
