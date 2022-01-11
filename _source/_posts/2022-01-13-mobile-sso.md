---
layout: blog_post
title: How to Create a Seamless Mobile SSO (Single Sign-On) Experience in iOS
author: huan-liu
by: internal-contributor
communities: [mobile]
description: "learn platform constraint on iOS platform and how to build great SSO experience around those constraints"
tags: [ios, sso, mobile-sso, mobile]
tweets:
- ""
- ""
image: ""
type: conversion
---

On an iPhone, when we log in to an app, we click a login button, and a website pops up to verify our credentials. Once verified, the website then redirects back to the app, and you are logged in. This familiar Single Sign-On (SSO) pattern is frequently referred to as the *redirect flow* for authentication. The use of a web browser for auth in this example was considered [a "Best Current Practice"](https://www.rfc-editor.org/rfc/rfc8252.txt) for security and usability reasons.

However, in 2017, a new prompt appeared in the login flow, before you were taken to the website. The following screenshot came from an iOS app preparing to log you in with Facebook. The interface prompt informs you that a specific app, the Call of Duty game from Activision in this example, wants to use a specific website to sign you in, and it warns you about information sharing. 

{% img blog/mobile-sso/ASWebAuthenticationSession-prompt-from-cod.jpeg alt:"app login prompt when authenticating with ASWebAuthenticationSession" width:"800" %}{: .center-image }

There are a couple of problems with this prompt:

* **Problem 1** (Where did this prompt come from?) : Many people consider this a bad user experience because the prompt looks out of place, and the wording is confusing and might alarm end users. 

* **Problem 2** (Ambiguous UI message): If you implement logout functionality through the same flow, the prompt still says "Sign In", even though the user may have already clicked a "Logout" button. This too is confusing to the end user, as shown in the following screenshot. This problem is reported as [a bug on the AppAuth library](https://github.com/openid/AppAuth-iOS/issues/255), although it was designed as a security and privacy feature.


{% img blog/mobile-sso/ASWebAuthenticationSession-on-logout.jpeg alt:"permission prompt when logging out with ASWebAuthenticationSession" width:"300" %}{: .center-image }


In this article, I'll go into more detail on aspects of the iOS platform limitations. I'll explain why this prompt is shown and how to get around it to build a more seamless user experience. 

Specifically, this article will:

* explain the evolution of iOS over time, and how and why this prompt was introduced. 
* describe various ways you can invoke a standalone or embedded browser on iOS, and explain the cookie-sharing behaviors.
* discuss several ways to eliminate the confusing user experience issues we've identified above.

## A brief history of iOS evolution

The browser options available for authentication  on an iOS device have changed significantly over the years, as Apple continues to add capabilities to enhance user privacy.  To understand the behavior of the browser options provided on iOS, some historical context is  helpful. 

### Authentication prior to iOS 9

Before the release of iOS 9 in 2015,  there were only two ways to authenticate through a web browser, and neither one was optimal. 

* **`UIWebView`**. This approach shows web content in a `UIView`. The mobile app can intercept interactions with the `UIView`, hence it is not secure.

* **Redirect to an external browser**. The mobile app can open a webpage in a separate browser app, and the browser app can redirect back to the mobile app after authentication. However,app switching is not a good experience for mobile users. In addition, the redirect back can fail if another app has registered the same URL scheme first.

### Authentication in iOS 9 (2015)

In 2015, Apple introduced [`SFSafariViewController`](https://developer.apple.com/documentation/safariservices/sfsafariviewcontroller), which displays an embedded Safari browser in the app. As an in-app browser tab, this interface lets the user stay in the app. Once the user interaction with the website is no longer needed, the browser tab can be closed and dismissed.  

This solution was groundbreaking, because it is secure (the native app can neither peek into the embedded browser, nor alter its state) and it provides a better user experience by avoiding app switching. 

`SFSafariViewController` shares cookies with the standalone Safari browser. This gives developers a way to implementSSO (Single Sign-On) with shared cookies..

### iOS 11 changes (2017)

Apple changed `SFSafariViewController` behavior to address privacy concerns with the release of iOS 11 in 2017. `SFSafariViewController` no longer shares cookies with the standalone Safari browser. Thus, a website can no longer determine that the user on `SFSafariViewController` is the same user on Safari, even though the view controller and the browser are open on the same device. 

Apple understood that  the `SFSafariViewController` behavior change would break SSO, since single sign-on relies on the ability to share cookies. Instead, Apple had to introduce `SFAuthenticationSession` as a workaround, where `SFAuthenticationSession` would share a persistent cookie with Safari. 

### Iterative changes in iOS12 (2018)

In 2018, Apple deprecated `SFAuthenticationSession`, but introduced [`ASWebAuthenticationSession`](https://developer.apple.com/documentation/authenticationservices/aswebauthenticationsession) as a revised solution. 

Both `SFAuthenticationSession` and `ASWebAuthenticationSession` are designed specifically for OAuth 2.0 authentication, not for showing general web content. To avoid abuse, when `SFAuthenticationSession` or `ASWebAuthenticationSession` are used, Apple always displays the prompt we saw earlier., The prompt is designed explicitly for user sign-in, and indicates that cookies are shared. 

{% img blog/mobile-sso/ASWebAuthenticationSession-prompt.jpeg alt:"permission prompt about information sharing" width:"600" %}{: .center-image }

Apple does not know whether an `ASWebAuthenticationSession` is invoked  for sign in, sign out, or general web browsing. This is why the prompt text is generic. It only states that your app is trying to *Sign In*, regardless of the actual use case, which results in the ambiguity described earlier in  **Problem 2**. 

### iOS 13 changes (2019)

In 2019, Apple introduced `prefersEphemeralWebBrowserSession` as an option for `ASWebAuthenticationSession`. If this option is set to true, `ASWebAuthenticationSession` does not show the prompt above, and as a consequence, it does not share cookies with Safari. This gives developers a choice. Either they gain  a better user experience without no confusing prompt and no SSO, or they get  SSO, along with the annoying prompt. 
## `SFAuthenticationSession` or `ASWebAuthenticationSession` behavior
The various browser options offer differing levels of cookie sharing in order to limit websites'  ability to track a user. 

The cookie-sharing behavior is not well documented in Apple's documentation. The  [`SFSafariViewController` doc](https://developer.apple.com/documentation/safariservices/sfsafariviewcontroller) mentions that, "In iOS 9 and 10, it shares cookies and other website data with Safari ... If you would like to share data between your app and Safari in iOS 11 and later, ... use `ASWebAuthenticationSession` instead."

A few third-party websites extend Apple's documentation to highlight that persistent cookies are shared between an embedded browser and Safari. Unfortunately, it is rarely known that session cookies can also be shared between different embedded browsers. If your application just needs SSO between your mobile apps, you do not have to use a persistent cookie; a session cookie is sufficient. 

The following table summarizes the complete sharing behavior in iOS 11 or later. I've omitted `SFAuthenticationSession` for brevity because it is deprecated, but it behaves the same as `ASWebAuthenticationSession`. I've also omitted the `prefersEphemeralWebBrowserSession` option for `ASWebAuthenticationSession` because when it is set, cookies are not shared at all. 
 
<div markdown="1" class="scrollable">

|   | APP1 + SFSafariViewController | App1 + ASWebAuthenticationSession | App2 + SFSafariViewController | App2 + ASWebAuthenticationSession | Safari | Other browsers (e.g., Chrome) |
|-----|-----|-----|-----|-----|-----|-----|
| Session cookie    |   | Yes |   |  Yes |     |   |
| Persistent cookie |   | Yes |   |  Yes | Yes |   | 

</div>

In the following iOS cookie behavior demo video, you can see how the session cookie and the persistent cookie are shared. The session cookie sharing behavior is not intuitive. Even when App1 is closed (which should clear all session cookies), opening App 2 would make it possible to see App1's session cookie. 

<div style="text-align: center; margin-bottom: 1.25rem">
  <iframe width="700" height="394" style="max-width: 100%" src="https://www.youtube.com/embed/mDytgEU0bO8" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</div>

It is worth noting that in iOS 14 and later you can specify another browser, such as Chrome, as the default. This does not affect the sharing behavior. `SFSafariViewController` and `ASWebAuthenticationSession` always use Safari under the hood, so they will never share cookies with browsers other than Safari, even if they are set as the default. The term *system browser*, often used in online articles, is synonymous with Safari. 


## Solution: how to remove the extra prompt

Now that we've reviewed the evolution of iOS browser behavior , and explored the rationale for the changes, let's look at solutions to improve the user experience. 

### Solution to problem 2

Solving problem 2 only – eliminating the ambiguity of the prompt message – is straightforward: Use the browser for sign-in only; do not use the browser to sign out. You can sign out your application directly by revoking the access token and the refresh token. Okta provides a [revoke API](https://developer.okta.com/docs/guides/revoke-tokens/main/) that you can call directly. 

Revoking a token works as a solution  if you are ok with signing the user out of the native app only. The user may still have a login session in the browser, and if the native app wants to login again, the browser will not ask the user for credentials before granting an access token. 

This is the recommended approach if your web session may be supporting many different native apps. For example, [FB logout](https://developers.facebook.com/docs/unity/reference/current/FB.Logout/) specifically recommends not to log out of the web session. 

However, if you  require a stronger privacy and security posture, for instance for a banking app, keeping the web session alive may not be an option. 

### Solutions to problem 1

There are two potential approaches to solve problem 1.  Both solutions use browser components that do not show a prompt. Both have the drawback that no cookie can be shared, so SSO will not work. If your app requires SSO, you'll have to find a new way to share login sessions. Fortunately, Okta recently introduced [Native SSO](https://developer.okta.com/docs/guides/configure-native-sso/main/), which allows native apps to implement single sign-on without cookies. See our [blog on SSO between mobile and desktop apps](/blog/2021/11/12/native-sso) for a full example. The following code shows how to remove the prompt, and it assumes your app either does not require SSO or uses Native SSO. 

First, you can use the `prefersEphemeralWebBrowserSession` option for `ASWebAuthenticationSession`. If you are using the [Okta OIDC iOS](https://github.com/okta/okta-oidc-ios) library, you can configure the `noSSO` option as follows:

```swift
let configuration = OktaOidcConfig(with: {YourOidcConfiguration})
if #available(iOS 13.0, *) {
    configuration?.noSSO = true
}
```

Under the hook, the `noSSO` option sets the `prefersEphemeralWebBrowserSession` flag. Note that this flag is only available in iOS 13 and above. 

Second, if you desire to support older iOS versions, you could use `SFSafariViewController` as the browser to present the login session. The following demonstrates how to launch `SFSafariViewController` if you are using the [AppAuth iOS](https://github.com/openid/AppAuth-iOS) library. 

AppAuth iOS supports a concept of *external user agent*, where you can use any browser to present the sign-in webpage. By default, if you invoke `OIDAuthState.authStateByPresentingAuthorizationRequest:presentingViewController:callback:`, it will invoke a default user agent. But you can plug in any external user agent, as long as it conforms to the `OIDExternalUserAgent` protocol. There is already an implementation of using [`SFSafariViewController` as an external agent](https://gist.github.com/ugenlik/2a543f351e9b9425800b48266760dc85). You can download it and plug it into your project. Then, when you invoke the browser, call 
`OIDAuthState.authStateByPresentingAuthorizationRequest:presentingViewController:callback:`, and pass the external user agent `OIDExternalUserAgentIOSSafariViewController`, as shown in the following snippet. 

```swift
let appDelegate = UIApplication.shared.delegate as! AppDelegate
let externalAgent = OIDExternalUserAgentIOSSafariViewController(presentingViewController: self)

appDelegate.currentAuthorizationFlow =
        OIDAuthState.authState(byPresenting: request, externalUserAgent: externalAgent) { authState, error in
    if let authState = authState {
        self.authState = authState
        print("Got authorization tokens. Access token: " +
                  "\(authState.lastTokenResponse?.accessToken ?? "nil")")
    } else {
        print("Authorization error: \(error?.localizedDescription ?? "Unknown error")")
        self.authState = nil
    }
}
```

## Summary 

Understanding iOS and Android platform-level constraints is a prerequisite for developing great mobile experiences. I hope this article will help you understand the browser options available on iOS and their cookie sharing behaviors. 

At Okta, we are adamant about optimizing end-user experience. Every extra click needs to be eliminated if possible, and every extraneous prompt should be avoided. We develop solutions such as Native SSO to help you overcome mobile constraints. I hope our solution helps you improve the experiences you are building for your end users. We'd love to hear more about your needs and how we can build solutions together. Feel free to add your questions and suggestions about this solution or future topics in the comments below.

If you enjoyed reading this article, you can keep up with our content for developers by following us on [Twitter](https://twitter.com/oktadev) and subscribing to our [YouTube](https://www.youtube.com/c/oktadev) channel. 
