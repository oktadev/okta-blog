---
layout: blog_post
title: "Introducing the New Okta Mobile SDKs"
author: mike-nachbaur
by: internal-contributor
communities: [mobile]
description: "Announcing Okta's new, modular, streamlined mobile SDKs! Add auth in a couple lines💥"
tags: [mobile, swift, sdk, device-flow, oidc]
---

For years the Okta OIDC SDK was the primary tool mobile developers used to integrate their apps with Okta, but as with all things in life, entropy takes its toll. Over time, as platforms and languages change, or new features become available, a refactor is required. Today we're proud to announce that the Okta Mobile SDKs for Swift and Kotlin are now available!

Recent advances at Okta, such as support for Device Single Sign On (SSO), the Device Authorization Grant (used in most streaming smart TV apps, or devices without an interface), and most especially the Okta Identity Engine (OIE), have proved difficult to integrate into the aging OIDC SDK. We realized it was time for something new. As a result, for the past few months, we've been hard at work developing our next-generation SDK targeting native and mobile environments across Apple and Android platforms.

These SDKs take a whole new approach to authentication that goes beyond simple browser-based sign in (also known as the OAuth 2.0 _authorization code flow_). We took a modular approach to assembling the SDK; you choose to include only the components needed to build your applications. This architecture enables leaner builds and puts more power and flexibility into your hands. It also opens the doors to integration with other SDKs, such as the Okta Identity Engine (OIE) using the Okta Identity Experience (IDX) SDK.

## Why replace our current SDKs?

First, I'd like to explain why we chose to replace our current mobile SDKs. We didn't make this decision lightly, several reasons made it the best choice:

* Okta OIDC for iOS and Android is built upon an aging code base, which was difficult to maintain, and didn't follow modern mobile best practices. 
* The OIDC libraries are focused on web-based authentication, which introduces overhead when native sign-in is used.
* Targeting mobile and desktop applications limits the possibility of extending to other platforms, such as smart watches, TVs, or app extensions.
* The OIDC libraries assume that only one set of tokens will be used at a time. This assumption prevents developers from supporting multiple users within an app, or multiple tokens for different app extensions or security scopes.

These are some of the key reasons why we chose to make a fresh start, focusing on convenience and ease of use. Our goal is to unblock advanced use cases that were previously impossible.

Now that you've seen our rationale for refactoring, let's take a look at the architecture and philosophy behind the new Okta Mobile SDK.

## Welcome to the new Okta Mobile SDK

We had several goals when designing the new SDK:

* Improve the developer experience and streamline the developer onboarding process
* Eliminate technical debt
* Move from a monolithic architecture to a modular one
* Unlock advanced features and scenarios with flexible extension points
* Support new Okta platform features

These goals helped shape the architecture for our SDKs, from the high-level capabilities down to the naming of individual functions.

Note: Since I'm predominately a Swift engineer I'll be using examples from the [Okta Mobile SDK for Swift](https://github.com/okta/okta-mobile-swift), though everything discussed here also works within our [Okta Mobile Kotlin SDK](https://github.com/okta/okta-mobile-kotlin).

### A walk through the new developer experience

> _"Make the easy things easy, and the hard things possible" – Larry Wall_

The main feature of this SDK is a streamlined developer experience, above and beyond all else. We focused on the ergonomics of the APIs a developer would use, making sure they make sense, and are consistent with other similar types.

We set ourselves a "1-line-to-integrate" goal for all of our primary scenarios. This means that you should be able to sign in or out with a single line of code. Additionally, the code you write shouldn't be throw-away. Simple solutions should be able to grow into more complex ones, without requiring a completely different approach.

This is further improved by modularizing the SDK into smaller libraries that complement one another. Simple high-level APIs make certain features easy to use, yet still expose lower-level details that let you customize or control the SDK's behavior.

### Modularized architecture

Many of the original problems we faced with maintaining the OIDC SDKs stemmed from their monolithic architecture. This also prevented us from properly being able to integrate Okta IDX into applications, since there was no convenient way to store tokens created from IDX within the OIDC SDK.

As a result, we broke the new SDK into three libraries, each building upon one another: AuthFoundation, OktaOAuth2, and WebAuthenticationUI. 

{% img blog/introducing-the-new-okta-mobile-sdks/mobile-sdk-components.png alt:"Diagram illustrating the relationships between the dependent SDKs." width:"500" %}{: .center-image }

This structure gives us several advantages:

* By having clear lines of separation, it forces us to establish clean API contracts between dependent classes.
* Applications only need to import the libraries necessary to get their job done, keeping runtime app sizes leaner.
* Additional SDKs (such as Okta IDX) now have a foundation to build upon, and can enable different tools to work together.

Each library has its own areas of responsibility:

#### AuthFoundation

This library is the lowest-level and provides common features required for all authentication-related operations.

* Generic OAuth 2 API client interface
* Token storage & validation
* JWT parsing & validation
* Keychain/Keystore support
* Conveniences and utilities needed by other SDKs

#### OktaOAuth2

This library implements all the primary OAuth 2 flows supported by Okta, including:

* [Authorization Code Flow](https://developer.okta.com/docs/guides/implement-grant-type/authcodepkce/main/#request-for-tokens) (used by web-based OIDC)
* [Resource Owner Password Flow](https://developer.okta.com/docs/guides/implement-grant-type/ropassword/main/#about-the-resource-owner-password-grant) (simple username/password)
* [Token Exchange Flow](https://developer.okta.com/docs/guides/configure-native-sso/main/) (used to implement Device SSO)
* [Device Authorization Flow](https://developer.okta.com/docs/guides/device-authorization-grant/main/) (used for devices without a browser and/or keyboard)
* Session Token Flow (used to integrate with Okta's classic Native Authentication SDK)

In addition to these flows, the OktaOAuth2 library includes all the utilities and delegate protocols/interfaces necessary to customize each flow's behavior.

#### WebAuthenticationUI

When your app uses web-based OIDC authentication, this library coordinates with the system's browser to ensure a safe and secure embedded authentication experience. Since it is built upon the [AuthorizationCodeFlow](https://okta.github.io/okta-mobile-swift/development/oktaoauth2/documentation/oktaoauth2/authorizationcodeflow) class from OktaOAuth2, those lower-level classes are exposed to you, allowing extensive customization of the process if your application has specific requirements.

By separating this logic into its own library, your app can choose not to include this library if you use a non-web authentication process, removing unnecessary overhead.

#### OktaIdx

When your app uses the Okta Identity Engine (OIE) to natively authenticate your users, the IDX SDK (included separately in the [okta-idx-swift](https://github.com/okta/okta-idx-swift) and [okta-idx-android](https://github.com/okta/okta-idx-android) repositories) now properly integrates within this SDK using AuthFoundation. The Okta IDX SDK also follows similar patterns as OktaOAuth2, by providing the [InteractionCodeFlow](https://okta.github.io/okta-idx-swift/development/oktaidx/documentation/oktaidx/interactioncodeflow) class.

### Flexible extension points

The customizations and low-level capabilities described above are examples of the extension points we proactively built into the SDK. For many key decisions within the SDK, these steps are customizable either through the use of delegation, or via wholesale replacement of the SDK defaults.

You can override everything, from the way ID token validation occurs to how tokens are securely stored, or your app can accept the out-of-the-box defaults.

### Support for new Okta features

As Okta continues to innovate, introducing new features and capabilities, our mobile SDKs need to update to take advantage of them. By refactoring these SDKs, we aim to make it as easy as possible for you to adopt new features, which has been our primary motivation. Let's take a look at a few of the more exciting features we now support.

Many platform features center around support for new authentication flows. Classic web-based sign-in, through OIDC, is implemented using the OAuth2 Authorization Code Flow. Instead of locking this functionality away, we've exposed it, along with our new flows. We tried our best to follow similar patterns for all [authentication flows](https://okta.github.io/okta-mobile-swift/development/oktaoauth2/documentation/oktaoauth2/introductiontoauthenticationflows), to reduce a lot of the guesswork necessary to get a feature to work.

## Benefits of the new Okta Mobile SDK

As mentioned above, our aim has been to do more than build parity functionality with the legacy OIDC SDKs. We wanted to unlock amazing new capabilities while simultaneously simplifying your developer experience. So let's take a look at a few of the improvements we've made.

### Simplified web-based authentication

Signing in with a web browser using OIDC should be a straightforward process, and it is the easiest way to get started using Okta in a mobile application. And yet, we felt we could make it even easier.

Just like within Okta OIDC, the [WebAuthenticationUI](https://okta.github.io/okta-mobile-swift/development/webauthenticationui/documentation/webauthenticationui) library is capable of using a configuration file named Okta.plist to define your client settings. From there, you can sign into your application using a single line of code.

```swift
// Sign in using the default configuration
let token = try await WebAuthentication.shared?.signIn(from: view.window)

// Save the user's token
let credential = try Credential.store(token)
```

The [shared property](https://okta.github.io/okta-mobile-swift/development/webauthenticationui/documentation/webauthenticationui/webauthentication/shared) simplifies how to create a [WebAuthentication](https://okta.github.io/okta-mobile-swift/development/webauthenticationui/documentation/webauthenticationui/webauthentication) instance, but if you want direct control of the configuration, you can simply create one in code.

```swift
let auth = WebAuthentication(
    issuer: URL(string: "https://dev-133337.okta.com"),
    clientId: "0oa1234567890abcdefg",
    scopes: "openid profile email offline_access",
    redirectUri: URL(string: "myapp://login"),
    logoutRedirectUri: URL(string: "myapp://logout"),
    additionalParameters: ["idp": idpName])

// Sign in using the above configuration
let token = try await auth.signIn(from: view.window)

// Save the user's tokens
let credential = try Credential.store(token)
```

Depending on your application's needs, there are many ways to configure your client. Feel free to check out the [documentation on Configuring Your Client](https://okta.github.io/okta-mobile-swift/development/webauthenticationui/documentation/webauthenticationui/configuringyourclient) for more information.

### Device Authorization Grant

This is an OAuth 2 flow meant for use with headless devices, kiosks, or for clients that have limited text input. The prime example for this is a tvOS application running on the Apple TV. In this flow, a user is presented with a code they enter on a different device (a mobile phone, laptop computer, etc.) and finish logging in on the second device. 

{% img blog/introducing-the-new-okta-mobile-sdks/device-authorization-tvos-screenshot.png alt:"Screenshot of a sample tvOS application showing a QR code to authenticate using the device authorization grant." width:"500" %}{: .center-image }

The above screenshot comes directly from the [DeviceAuthSignIn sample](https://github.com/okta/okta-mobile-swift/tree/master/Samples/DeviceAuthSignIn) in the [okta-mobile-swift GitHub repository](https://github.com/okta/okta-mobile-swift). 

To implement this in your own application, simply use the [DeviceAuthorizationFlow](https://okta.github.io/okta-mobile-swift/development/oktaoauth2/documentation/oktaoauth2/deviceauthorizationflow) from the [OktaOAuth2 library](https://okta.github.io/okta-mobile-swift/development/oktaoauth2/documentation/oktaoauth2/), and try the following code:

```swift
// Uses the client configuration in an Okta.plist
// configuration file
let flow = DeviceAuthorizationFlow()

// Get the code to display to the user
let context = try await flow.start()
showCodeToUser(context)

// Poll the server, waiting for a successful login
let token = try await flow.resume(with: context)

// Save the user's tokens
let credential = try Credential.store(token)
```

All the details for how authentication occurs, including the polling process, error handling, and other considerations, are handled for you.

### Device SSO (aka Token Exchange Flow)

We're excited about the ability to perform single sign-on across a suite of apps on the same device, or across separate app extensions within the same app. We've [discussed this feature before on the Okta developer blog](/blog/2021/11/12/native-sso), but the amount of code necessary to implement device SSO had been prohibitive to developers who wanted to try this feature.

So with the new [TokenExchangeFlow](https://okta.github.io/okta-mobile-swift/development/oktaoauth2/documentation/oktaoauth2/tokenexchangeflow) we've drastically simplified the process, reducing it to just a single line of code.

```swift
// Create the flow, using the Okta.plist configuration
let flow = TokenExchangeFlow()

// Exchange the ID and Device tokens for access tokens.
let token = try await flow.start(with: [
    .actor(type: .deviceSecret, value: deviceToken),
    .subject(type: .idToken, value: idToken)
])

// Save the user's token
let credential = try Credential.store(token)
```

Once you've authenticated a user with the `device_sso` scope, Okta will return both an ID Token and Device Secret in the token response. If you save this in a secure location accessible to all your apps (for example, in a Keychain within a shared App Group), you can supply those strings to the TokenExchangeFlow class.

### Improved token storage and biometric support

Like the Okta OIDC SDK, the new Swift SDK uses the Apple Keychain to securely store tokens. With the new [Credential.store](https://okta.github.io/okta-mobile-swift/development/authfoundation/documentation/authfoundation/credential/store(_:tags:security:)) function however, more options are available to you at the time you store a token. Security settings or developer-assigned tags can optionally be supplied to customize how those tokens will be stored.

```swift
// Accept defaults
try Credential.store(token)

// Assign tags to later retrieve specific tokens
try Credential.store(token, tags: ["tag": "value"])

// Share the token between an app's extensions
try Credential.store(token, security: [
    .accessGroup("com.myapp.access-group")
])

// Secure the token with biometrics, and require
// the device to be unlocked
try Credential.store(token, security: [
    .accessibility(.unlocked),
    .accessControl(.biometryAny)
])
```

The tags option can be used to help manage the tokens stored in the keychain, which helps when your app works with multiple tokens or accounts. This is a feature I'm very excited about, due to the advanced use cases it unlocks. Let's dig into that in the next section.

#### Supporting multiple tokens / users

We now support storing multiple tokens or user accounts in a single application. This is a big improvement over the legacy Okta OIDC SDK, which made the assumption that an app would only ever have a single user at a time. Storing multiple tokens helps you create more sophisticated apps, such as:

* Multi-user applications that allow users to quick switch between profiles
* Applications that utilize app extensions, or widgets that wish to use separate tokens for each extension, for security reasons
* Apps that use separate tokens with different scopes for escalated access

For a host of reasons, the AuthFoundation library now supports the storage and use of multiple tokens simultaneously, while still supporting traditional single-user applications via the Credential.default property.

```swift
// Retrieve the credential created when storing a token
let credential = try Credential.store(token)

// Load the default credential
let credential = Credential.default

// Load a credential with a unique ID
let credential = try Credential.with(id: savedTokenId)

// Find all credentials matching a given tag
let credentials = try Credential.find(where: { metadata in
    metadata.tags["purpose"] == "background"
})

// Find all credentials containing ID token claims
let credentials = try Credential.find(where: { metadata in
    metadata.subject == userId
})
```

#### Simplified Keychain handling

Since secure token storage makes extensive use of the Apple Keychain, the AuthFoundation library provides a convenient [Keychain helper](https://okta.github.io/okta-mobile-swift/development/authfoundation/documentation/authfoundation/keychain) to simplify keychain operations. We made it public to simplify the way shared secrets can be stored and still remain accessible to your other apps or extensions. For example, when saving the device secret necessary to implement TokenExchangeFlow, you can use the Keychain utility to save these secrets in a way that's accessible to your other applications.

```swift
if let deviceSecret = credential.token.deviceSecret,
   let idToken = credential.token.idToken
{
    try Keychain.Item(account: "ssoSecret",
                      accessGroup: "com.myapp.shared",
                      value: deviceSecret).save()
    try Keychain.Item(account: "ssoToken",
                      accessGroup: "com.myapp.shared",
                      value: idToken).save()
}
```

Later, retrieving these values can be an equally straightforward operation.

```swift
if let secretData = try? Keychain.Search(account: "ssoSecret").get(),
   let secretToken = try? Keychain.Search(account: "ssoToken").get(),
   let ssoSecret = String(data: secretData, encoding: .utf8),
   let ssoToken = String(data: secretData, encoding: .utf8)
{
    // Exchange the tokens using TokenExchangeFlow
}
```

#### Outgoing request authorization

Ultimately, developers use the Okta Mobile SDK in order to securely access resources on a server somewhere. Your users authenticate using their credentials, and your application can use the resulting tokens to perform network requests on their behalf.

Since this is such a common operation, we decided to improve the developer experience by streamlining the process.

```swift
let url = URL(string: "https://api.example.com/notes")!
var request = URLRequest(url: url)
request.httpMethod = "POST"
request.httpBody = jsonBody

// Add appropriate HTTP authorization headers,
// automatically refreshing the token if needed.
await credential.authorize(&request)

let (data, response) = try await URLSession.shared
    .data(for: request)
```

When using the Swift Concurrency [Credential.authorize()](https://okta.github.io/okta-mobile-swift/development/authfoundation/documentation/authfoundation/credential/authorize(_:)) async function, this will automatically refresh the credential's access token if it's expired, and add the appropriate HTTP authorization header to the request object. If you're not using Swift Concurrency, the same thing can be accomplished with the [refreshIfNeeded(graceInterval:completion:)](https://okta.github.io/okta-mobile-swift/development/authfoundation/documentation/authfoundation/credential/refreshifneeded(graceinterval:completion:)) and [authorize(request:)](https://okta.github.io/okta-mobile-swift/development/authfoundation/documentation/authfoundation/credential/authorize(request:)) functions.

## Get started using the Okta Mobile SDK

The goal of these updates is to make it easier to build safer apps, while using native platform features to their fullest. To help you get started, here are a few suggestions of how you can take advantage of the new features in this SDK.

* Support multiple users in your application, with fast switching between accounts.
* Add app extensions to your app, using Device SSO to create unique tokens for each extension.
* Use Device SSO to sign your user in across a suite of apps.
* Create different tokens for your user with different scopes, one of which is stored behind biometrics, to support escalated permissions within your app (e.g. requiring Face ID to perform a bank transaction).
* Build Apple TV or command-line applications that can use the Device Authorization grant to support convenient MFA sign-in securely.
* Streamline your workflow to simplify authorizing network requests to your own server APIs, while keeping your tokens refreshed.

Check out the repositories on GitHub to get started. These repos have several [sample applications](https://github.com/okta/okta-mobile-swift/tree/master/Samples) that demonstrate the features outlined in this article. The README and API documentation referenced from the repositories is a great way to learn more about these new features. 

* [Okta Mobile SDK for Swift](https://github.com/okta/okta-mobile-swift)
  * [AuthFoundation API Documentation](https://okta.github.io/okta-mobile-swift/development/authfoundation/documentation/authfoundation)
  * [OktaOAuth2 API Documentation](https://okta.github.io/okta-mobile-swift/development/oktaoauth2/documentation/oktaoauth2/)
  * [WebAuthenticationUI API Documentation](https://okta.github.io/okta-mobile-swift/development/webauthenticationui/documentation/webauthenticationui/)
* [Okta Mobile SDK for Kotlin](https://github.com/okta/okta-mobile-kotlin)
  * [API Documentation](https://okta.github.io/okta-mobile-kotlin/index.html)

You can also review the [Quick Start guide for iOS](https://developer.okta.com/docs/guides/sign-into-mobile-app-redirect/ios/main/) or for [Android](https://developer.okta.com/docs/guides/sign-into-mobile-app-redirect/android/main/) to see how to sign users into your application using the new SDKs.

If you have questions, or want to share your thoughts on this new SDK, please let us know in the comments below.

