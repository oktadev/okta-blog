---
layout: blog_post
title: "Approaches to keep sending OTP over SMS... for now"
author: maurice-sharp
by: contractor
communities: [devops,.net]
description: "Learn how to make the best telephony choices for your application"
tags: [devops]
tweets:
- ""
image: blog/telephony/social.jpg
type: conversion
---

> SMS has long played an important role as a universally applicable method of verifying a user's identity via one-time passcodes. And over the last decade, SMS and voice-based Multifactor Authentication has prevented untold attempts to compromise user accounts
> 
> But it's time to move on."
> 
> <cite>Ben King, VP Customer Trust: [BYO Telephony and the future of SMS at Okta](https://sec.okta.com/articles/2023/08/byo-telephony-and-future-sms-okta)</cite>

## SMS/Voice is too SIMple

The one-time passcode (OTP) you send using SMS or Voice may not go to the phone you want. SIM swapping–stealing someone else's phone number–lets bad actors receive the message or call with the code. They're one step closer to breaking into your system. And if all it takes is an account name and OTP, they may succeed. And it's not just SIM hacking; other issues include:

* No phishing resistance

* No control of the channel for sending secrets

* No way to link a user to their device

* Longer login times than other methods

Okta [recommended moving away](https://www.okta.com/blog/2020/05/why-you-should-ditch-sms-as-an-auth-factor/) from [SMS/Voice authentication](https://www.okta.com/blog/2020/05/why-you-should-ditch-sms-as-an-auth-factor/) some time ago. There are many other factors you can use for authentication, including:

* Generating codes in an authenticator app such as Okta Verify, Authy, Google Authenticator, or 1Password.

* FIDO2.0 (WebAuthn) which, in addition to phones, can use hardware keys and on-device authenticators.

Soon, [Okta will](https://support.okta.com/help/s/article/bring-your-own-telephony-required-for-sms-and-voice?language=en_US)[ require you to bring your own telephony provider](https://support.okta.com/help/s/article/bring-your-own-telephony-required-for-sms-and-voice?language=en_US) to keep sending those codes. If you need time to move to a different method of verifying identity, you must configure your own provider for SMS/Voice.

{% include toc.md %}


## Hooked on telephony

You can send the OTP in the SMS/Voice flow using the [telephony inline hook](https://help.okta.com/oie/en-us/content/topics/telephony/telephony-inline-hook.htm). Okta uses the code or URL in the hook to send the OTP, though, as you'll see, the hook may not be called every time (and that's a good thing). When your hook fails to send the message or takes too long to update the status, Okta takes over sending the message. However, the number of those messages is heavily rate-limited.

The code or URL you provide may simply send the message and communicate the outcome to Okta. The code or server may be more complex, managing geo-specific vendors, failure, failover to another provider, and hacking. No matter how simple or complex the code, there are three main approaches:

1. Implement the code and use your own telephony provider or providers.

2. Outsource the implementation and use your own telephony provider or providers.

3. Use a managed service that manages the process for you.

Some of the main things to consider when choosing an approach are the regions for messages, the expected traffic, the desired reliability, branding requirements, protection from hacking, and your resources.

### Which regions?

Two things can identify a region. First are any regulations for sending messages. Those regulations can be set by collectives, such as the European Union, countries, or even sub-parts of a country. Second is the area covered by the telco sending the message. 

Sending messages to more than one region may have at least two impacts. First, check that your desired vendor or vendors cover those regions.

Second, the features and regulations for traffic may differ from region to region. Some of the differences include:

* Limitations on the types of entities that can send messages by SMS. This typically requires proof of identity and business registration.

* Registration of a sender ID for your business. For example, messages without a valid sender ID are automatically marked as "Likely-SCAM" in Singapore.

* Using *short codes*, which are special telephone numbers designed for high traffic. This can add significant cost.

* Supported formats, such as ASCII and Unicode.

* Character length limits for messages. Note that each Unicode item counts as two characters.

Check that your vendor supports the regulations in your desired regions.

### How many messages?

Telephony vendors or service providers need to know the volume of messages. And not just the average volume, but any peaks, such as a time when a majority of people are trying to sign on to your network.

The service cost is the most obvious related to volume issues, but there are two others. First is the impact on the rate limits used to prevent spam texts. These limits can prevent messages from being sent, especially during peak volume; vendors may be able to increase limits.

The second impact, the reputation score, also limits the volume of messages. The lower the reputation score, the fewer messages you can send. The goal is to prevent bad actors from sending lots of spam. Newer and smaller companies start with a lower score. The score increases over time as you send messages without hitting rate limits.

Some telephony vendors or service providers can work around this limit. For example, a service provider may use their reputation or send it from a pool of phone numbers.

### How reliable?

Delivering the OTP to a phone requires several steps, and any of them can fail. The more steps, the more code between the OTP and the requestor, and the more chances of failure.

Most telephony and other service providers provide a service level agreement (SLA). Availability (or uptime) is the most common measurement: the percentage of time a service can receive your request and send the message. But there are other things to consider: delivery time, knowing if it's delivered or not, and round-trip time (total time from request to notification of outcome).

That last number is important as there's a time limit of three seconds from Okta calling the hook to receiving a success (or failure) result. After that, the default is that Okta sends the message using its providers. However, those sends are heavily rate-limited.

### From you or Okta?

Implementing the code for the hook yourself or using a consultant gives you the most control over message content. Services may offer partial or complete content customization.

You can [customize the SMS messages](https://help.okta.com/oie/en-us/content/topics/settings/settings_sms.htm) sent by the Okta failover mechanism, though not the voice calls.

### How secure?

Okta still rate-limits calls to the telephony hook to prevent spam or toll fraud. But that's not the only security issue.

Whether you implement the hook yourself or use a service, the endpoints and calls must be protected from attacks. That includes protecting any API keys and preventing unauthorized access and use.

There are also accounts with the provider or service that must be secured. 

### How many people?

No matter the other concerns you identified, processes will change and update, and new things will need to be done.

New message flows and failovers require updating existing support processes for SMS/Voice users. This may include working with your chosen telephony or service vendor. You may also need to add more frequent log monitoring to detect when the failover rate limit prevents Okta from sending messages.

Vendors need management. Projects for implementing the chosen approach need planning and project management. The resources for the implementation phase vary significantly. 

Implementing custom code is similar to adding a somewhat complex feature to your product: it requires product management/specification, design, engineering, testing, and project management. Outsourcing the implementation can reduce the technical resources but adds vendor management.

Moving to a service provider minimizes the technical requirements, though there's still vendor management and monitoring.

## Designing a DIY hook

The first step in implementing a telephony hook is finding a vendor. There are at least three essential criteria:

* Send messages to the desired regions

* Meet reliability requirements, especially when handling failover

* Allow the desired volume of messages

That last point is because some vendors limit the volume for smaller or unknown companies.

The server you write for the telephony hook uses the information received from Okta to construct a message request to your vendor. The status of the message also needs to be communicated back to Okta. Sometimes, this requires translating the data from the telephony provider into the JSON format expected by Okta.

### Handling failover to Okta

Another case you must handle is a failover to Okta. Failover happens when something goes wrong with your telephony hook. Okta takes over sending the message, but the number of messages is heavily rate-limited. The only way to determine if the message was sent is by searching the logs to see when sends started failing. Your messages may never arrive.

There are two triggers for failover: your telephony hook returns a "failed" status to Okta, or a three-second timeout passes. 

You can prevent failover by always returning a successful result or requesting Okta to disable failover for your organization. However, doing so means that you must handle failed message sends. That requires more complex server code and possibly multiple vendors.

## Vendors

The kind of vendors you need depends on your approach. Below are a few possibilities. Some are [recommendations from Okta](https://www.okta.com/okta-telecommunication-services/), and others are suggestions. No matter what, make sure that the vendor meets your criteria.

### Telephony providers

Here are some vendors you can use to implement the hook in-house or with a consultant.

* [AWS Pinpoint](https://aws.amazon.com/pinpoint/)

* [Telesign](https://www.telesign.com/okta-telesign)

* [Twillio](https://pages.twilio.com/Twilio-Messaging-Okta.html)

* [Vonage](https://www.vonage.com/communications-apis/campaigns/okta/)

### Consultants

Many consulting companies can implement the hook for you. Another option is to use [Okta professional services](https://www.okta.com/services/professional-services/).

### Services

Some services deliver the SMS for you. That can include handling unavailable telephony vendors, resends, and other issues. Adding a service usually requires only adding a URL for the telephony hook.

Services include:

* [BeyondID](https://beyondid.com/solutions/sms-for-okta/)

* [Credenti](https://credenti.com/products-sms-gateway-for-okta-customers/)

* [Twilio Verify](https://www.twilio.com/docs/verify/api)

## What's next? 

If you rely on SMS for authentication, start thinking about how to replace it. In the meantime, use what you've learned in this post to keep your solutions as secure as possible. 

For more content like this, follow Okta Developer on [Twitter](https://twitter.com/oktadev) and subscribe to our [YouTube](https://www.youtube.com/c/oktadev) channel. If you have any questions about migrating away from SMS, please comment below!

