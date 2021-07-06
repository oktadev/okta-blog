---
layout: blog_post
title: "What Apple's App Tracking Changes Mean for Developers"
author: aaron-parecki
by: advocate
communities: [security]
description: "Everything you need to know about Apple's new restrictions on cross-app tracking in iOS 14.5"
tags: [apple, oauth, oidc]
tweets:
- "Everything you need to know about Apple's new restrictions on cross-app tracking in iOS 14.5"
- "What changed with cross-app tracking in iOS 14.5? Find out here 🍎"
image: blog/apple-app-tracking/alex-bachor-fWsT3PpoE-A-unsplash.jpg
type: awareness
---

You know how you will see an ad on Instagram for something that you just searched for hours earlier? This is in no small part due to a special API for iOS that allows app developers to track your behavior across apps, even those by different developers. Well, all of this is changing with the rollout of iOS 14.5, so let's take a look at what exactly is changing and what this means for app developers.

When Apple first launched Sign in with Apple in 2019, one of my favorite parts about it was the privacy-first stance they took on access to user data. Unlike most other social login providers, Sign in with Apple gives the user the option of hiding their name and email address from the app if they wish. With the release of iOS 14.5, Apple is taking user privacy one step further and letting users opt out of targeted advertising. This is part of Apple's new App Tracking Transparency framework. Let's break down what it is, how it works, and what this means for app developers.

## What Is Apple's Identifier for Advertisers?

First, let's take a look at how Apple's Identifier for Advertisers worked before this change. For the last several generations of iOS, Apple has provided an API that gives developers a unique ID corresponding to a particular iOS device. This identifier is known as the "Advertising Identifier," or "Identifier For Advertisers " (IDFA).

While the IDFA is just a random string and doesn't contain any personal or identifying information itself, it is tied to a specific device and any app that reads it will get the same value, making it possible to link user information across apps by different developers. The classic use of this is in retargeting campaigns in advertising networks, so that a user who uses a certain app can receive related ads when inside other apps.

It has been possible for a user to disable this feature for quite some time, although the process to disable it wasn't obvious, and so relatively few people actually did opt out of personalized ads. However that has all changed with the release of iOS 14.5.

## What Changed in iOS 14.5

As of iOS 14.5, apps now have to explicitly request access to the advertising ID, and in doing so, will trigger an OS-level prompt asking the user if it's okay for the app to track their activity across other apps. Similar to the location tracking prompt, the app developer gets to add a sentence that will be displayed in the prompt in order to explain to the user why they are asking for this access.

{% img blog/apple-app-tracking/swarm-tracking.png alt:"App Tracking prompt in Swarm" width:"400" %}{: .center-image }

There is a fantastic gallery of these prompts from a wide variety of apps being collected at <https://www.attprompts.com>

The options presented to the user are "Ask App Not to Track" and "Allow." App developers and advertisers are worried that most users will not choose "Allow," blocking advertisers’  access to this advertising ID. If the user doesn't allow this permission, when the app goes to read the advertising ID, it will get a string of zeros.

So what does it mean if an app developer isn't able to access the user's advertising ID anymore? Without the IDFA, and without any sort of login mechanism, developers of two different apps have no way to know that the same user is using both apps, or that both apps are installed on the same device. Because of that, ad networks used within apps can't track user's activity across different apps, only within a single app. This means the inability to show users "personalized" ads based on information learned about them from outside the app.

## Limiting All Forms of Cross-App Tracking

While returning all zeros as the advertising ID is a technical limitation Apple can put in place, Apple actually has taken this one step further and put guidelines in place in their App Store review process that prevent apps from attempting any kind of cross-app tracking for advertising purposes. This means if a user selects "Ask App Not to Track," not only will the advertising ID be unavailable, the app is not allowed to do any sort of tracking with any other information for advertising purposes either.

There are plenty of techniques available to try to identify users in order to track them outside of the application, including everything from device fingerprinting to using social login, or really any sort of login. For example, if your app asked the user to log in with Twitter, and a completely different app asked the user to also log in with Twitter, both apps could share the user's Twitter ID with an ad network to link the user between the two apps. This would also be possible with traditional login just asking for an email address and password, since both apps can share the user's email address with the tracking service. However, this kind of cross-app tracking is explicitly prohibited by Apple's new rules when used for advertising purposes.

## What This Means for Your Applications

So what does this mean for your own applications? Will you have to show this prompt to the user if you are just asking them to log in? Not exactly!

Apple's rules around the advertising ID and cross-app tracking are specifically written to address the advertising use case. If you are tracking users across apps for the purposes of advertising, then you do need to prompt the user and respect their decision if they choose "Ask App Not to Track". However, this doesn't affect non-advertising use cases—for example, asking users to log in so they can save their work. While this technically could be used for cross-app tracking, just providing a login feature doesn't necessarily mean you'll be required to show the app tracking prompt, as long as you aren't tracking the user in order to show them ads. And yes, this is definitely a judgment call more than a technical limitation, and whether your app complies with the rules will ultimately be judged by Apple during the App Store review process.

One thing to pay attention to as you're developing your apps is which third-party libraries you're including. It's quite possible that some third-party libraries have code that will do some form of cross-app tracking even if you don't do anything special with the SDK. For example, if you have included the Facebook SDK in your app to use Facebook login, you'll want to make sure that you update it to the latest version before publishing an update of your app. Prior versions of the SDK included had no way of opting out of the cross-app tracking that the SDK performed. Facebook introduced a new "Limited Data Mode" in the SDK which avoids cross-app tracking. From their [announcement post](https://developers.facebook.com/blog/post/2021/01/19/facebook-login-updates-new-limited-data-mode/):

<blockquote>
When using the limited version of Facebook Login, the fact that a person used Facebook Login with this iOS app will not be used to personalize or measure advertising effectiveness
</blockquote>

This introduction of the new "Limited Data Mode" gives your app a way to continue to use Facebook login while not breaking Apple's rules around cross-app tracking.

Since we've seen some examples of how social login features can either intentionally or inadvertently be tracking users across apps, you might be wondering what this means if you're using Okta's own iOS SDKs. Okta's SDKs support signing in with an Okta account as well as [Sign In with Apple](https://developer.okta.com/blog/2019/06/04/what-the-heck-is-sign-in-with-apple) and other social login providers. The good news is Okta has never shared user identifiers with anyone else, so you don't need to worry about accidentally breaking Apple's rules by including the Okta SDK!

To read more about Apple's rules around user privacy, visit the official [Apple FAQ here](https://developer.apple.com/app-store/user-privacy-and-data-use/).

To get started using Sign In with Apple with Okta today, check out our guide for [adding an external identity provider](https://developer.okta.com/docs/guides/add-an-external-idp/apple/create-an-app-at-idp/).
