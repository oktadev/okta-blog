---
layout: blog_post
title: "Secure Authentication with a Push Notification in Your iOS Device"
author: darko-spasovski
by: contractor
communities: [mobile]
description: "Build native iOS authentication with Okta DirectAuth and push notifications. Secure, phishing-resistant MFA without browser redirects."
tags: []
image: blog/okta-ios-directauth/social.jpg
type: conversion
github: https://github.com/oktadev/okta-ios-swift-directauth-example
---

Building secure and seamless sign-in experiences is a core challenge for today's iOS developers. Users expect authentication that feels instant, yet protects them with strong safeguards like multi-factor authentication (MFA). With Okta's DirectAuth and push notification support, you can achieve both – delivering native, phishing-resistant MFA flows without ever leaving your app.

In this post, we'll walk you through how to:
  1. Set up your Okta developer account
  2. Configure your Okta org for DirectAuth and push notification factor
  3. Enable your iOS app to drive DirectAuth flows natively
  4. Create an AuthService with the support of DirectAuth
  5. Build a fully working SwiftUI demo leveraging the AuthService

Note: This guide assumes you're comfortable developing in Xcode using Swift and have basic familiarity with Okta's identity flows.

If you want to skip the tutorial and run the project, you can [follow the instructions in the project's README](https://github.com/oktadev/okta-ios-swift-directauth-example).  

**Table of Contents**{: .hide }
* Table of Contents
{% include toc.md %}

## Use Okta DirectAuth with push notification factor

The first step in implementing Direct Authentication with push-based MFA is setting up your Okta org and enabling the Push Notification factor. DirectAuth allows your app to handle authentication entirely within its own native UI – no browser redirection required – while still leveraging Okta's secure OAuth 2.0 and OpenID Connect (OIDC) standards under the hood.

This means your app can seamlessly verify credentials, obtain tokens, and trigger a push notification challenge without switching contexts or relying on the `SafariViewController`.

Before you begin, you'll need an Okta Integrator Free Plan account. To get one, sign up for an [Integrator account](https://developer.okta.com/login). Once you have an account, sign in to your [Integrator account](https://developer.okta.com/login). Next, in the Admin Console:

  1. Go to **Applications** > **Applications**
  2. Select **Create App Integration**
  3. Select **OIDC - OpenID Connect** as the sign-in method
  4. Select **Native Application** as the application type, then select **Next**
  5. Enter an app integration name
  6. Configure the redirect URIs:
     * **Redirect URI**: `com.okta.{yourOktaDomain}:/callback`
     * **Post Logout Redirect URI**: `com.okta.{yourOktaDomain}:/` (where `{yourOktaDomain}.okta.com` is your Okta domain name). Your domain name is reversed to provide a unique scheme to open your app on a device.
  7. Select **Advanced v**.
     * Select the **OOB** and **MFA OOB** grant types.
  8. In the **Controlled access** section, select the appropriate access level
  9. Select **Save**

NOTE: When using a custom authorization server, you need to set up authorization policies. Complete these additional steps:

  1. In the Admin Console, go to **Security** > **API** > **Authorization Servers**
  2. Select your custom authorization server (`default`)
  3. On the Access Policies tab, ensure you have at least one policy:
     * If no policies exist, select **Add New Access Policy**
     * Give it a name like "Default Policy"
     * Set **Assign** to "All clients"
     * Click **Create Policy**
  4. For your policy, ensure you have at least one rule:
     * Select **Add Rule** if no rules exist
     * Give it a name like "Default Rule"
     * Set **Grant type** is to "Authorization Code"
     * Select **Advanced** and enable "MFA OOB"
     * Set **User is** to "Any user assigned the app"
     * Set **Scopes requested** to "Any scopes"
     * Select **Create Rule**

For more details, see the [Custom Authorization Server](https://developer.okta.com/docs/concepts/auth-servers/#custom-authorization-server) documentation.

<details>
   <summary>Where are my new app's credentials?</summary>
  <div markdown="1">
   Creating an OIDC Native App manually in the Admin Console configures your Okta Org with the application settings.

After creating the app, you can find the configuration details on the app's **General** tab:
  * **Client ID**: Found in the **Client Credentials** section
  * **Issuer**: Found in the **Issuer URI** field for the authorization server that appears by selecting **Security** > **API** from the navigation pane.
  
  ```
  Issuer:    https://dev-133337.okta.com/oauth2/default
  Client ID: 0oab8eb55Kb9jdMIr5d6
  ```

**NOTE**: You can also use the [Okta CLI Client](https://github.com/okta/okta-cli-client) or [Okta PowerShell Module](https://github.com/okta/okta-powershell-cli) to automate this process. See this guide for more information about setting up your app.
</div>
</details>

## Prefer phishing-resistant authentication factors

When implementing DirectAuth with push notifications, security remains your top priority. Every new Okta Integrator Free Plan account requires admins to configure multi-factor authentication (MFA) using Okta Verify by default. We'll keep these default settings for this tutorial, as they already support Okta Verify Push, the recommended factor for a native and secure authentication experience.

Push notifications through Okta Verify provide strong, phishing-resistant protection by requiring the user to approve sign-in attempts directly from a trusted device. Combined with biometric verification (Face ID or Touch ID) or device PIN enforcement, Okta Verify Push ensures that only the legitimate user can complete the authentication flow – even if credentials are compromised.

By default, push factor isn't enabled in the Integrator Free org. Let's enable it now.

Navigate to **Security** > **Authenticators**. Find **Okta Verify** and select **Actions** > **Edit**. In the **Okta Verify** modal, find **Verification options** and select **Push notification (Android and iOS only)**. Select **Save**.

## Set up your iOS project with Okta's mobile SDKs

Before integrating Okta DirectAuth and Push Notification MFA, make sure your development environment meets the following requirements:

  * Xcode 15.0 or later – This guide assumes you're comfortable developing iOS apps in Swift using Xcode.
  * Swift 5+ – All examples use modern Swift language features.
  * Swift Package Manager (SPM) – Dependency manager handled through SPM, which is built into Xcode.

Once your environment is ready, create a new iOS project in Xcode and prepare it for integration with Okta's mobile libraries.

## Authenticate your iOS app using Okta DirectAuth

If you are starting from scratch, create a new iOS app:
  1. Open Xcode
  2. Go to **File** > **New** > **Project**
  3. Select **iOS App** and select **Next**
  4. Enter the name of the project, such as "okta-mfa-direct-auth"
  5. Set the Interface to SwiftUI
  6. Select **Next** and save your project locally

To integrate Okta's Direct Authentication SDK into your iOS app, we'll use Swift Package Manager (SPM) – the recommended and modern way to manage dependencies in Xcode.

Follow these steps:

  1. Open your project in Xcode (or create a new one if needed)
  2. Go to **File** > **Add Package Dependencies**
  3. In the search field at the top-right, enter: `https://github.com/okta/okta-mobile-swift` and press <kbd>Return</kbd>. Xcode will automatically fetch the available packages.
  4. Select the **latest version** (recommended) or specify a compatible version with your setup
  5. When prompted to choose which products to add, ensure that you select your app target next to **OktaDirectAuth** and **AuthFoundation**
  6. Select **Add Package**

These packages provide all the tools you need to implement native authentication flows using OAuth 2.0 and OpenID Connect (OIDC) with DirectAuth, including secure token handling and MFA challenge management – without relying on a browser session.

Once the integration is complete, you'll see **OktaMobileSwift** and its dependencies listed under your project's **Package Dependencies** section in Xcode.

## Add the OIDC configuration to your iOS app

The cleanest and most scalable way to manage configuration is to use a property list file for Okta stored in your app bundle.

Create the property list for your OIDC and app config by following these steps:
  1. Right-click on the root folder of the project
  2. Select **New File from Template** (**New File** in legacy Xcode versions)
  3. Ensure you have iOS selected on the top picker
  4. Select **Property List template** and select **Next**
  5. Name the template `Okta` and select Create to create an `Okta.plist` file

You can edit the file in XML format by right-clicking and selecting **Open As** > **Source Code**. Copy and paste the following code into the file.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>scopes</key>
    <string>openid profile offline_access</string>
    <key>redirectUri</key>
    <string>com.okta.{yourOktaDomain}:/callback</string>
    <key>clientId</key>
    <string>{yourClientID}</string>
    <key>issuer</key>
    <string>{yourOktaDomain}/oauth2/default</string>
    <key>logoutRedirectUri</key>
    <string>com.okta.{yourOktaDomain}:/</string>
</dict>
</plist>
```

Replace `{yourOktaDomain}` and `{yourClientID}` with the values from your Okta org.

If you use something like this in your code, you can directly access the `DirectAuth` shared instance, which is already initialized and ready to handle authentication requests.

## Add authentication in your iOS app without a browser redirect using Okta DirectAuth

Now that you've added the SDK and property list file, let's implement the main authentication logic for your app.

We'll build a dedicated service called `AuthService`, responsible for logging users in and out, refreshing tokens, and managing session state.

This service will rely on OktaDirectAuth for native authentication and `AuthFoundation` for secure token handling.

To set it up, create a new folder named `Auth` under your project's folder structure, then add a new Swift file called `AuthService.swift`.

Here, you'll define your authentication protocol and a concrete class that integrates directly with the Okta SDK – making it easy to use across your SwiftUI or UIKit views.

```swift
import AuthFoundation
import OktaDirectAuth
import Observation
import Foundation

protocol AuthServicing {
  // The accessToken of the logged in user
  var accessToken: String? { get }

  // State for driving SwiftUI
  var state: AuthService.State { get }

  // Sign in (Password + Okta Verify Push)
  func signIn(username: String, password: String) async throws

  // Sign out & revoke tokens
  func signOut() async

  // Refresh access token if possible (returns updated token if refreshed)
  func refreshTokenIfNeeded() async throws

  // Getting the userInfo out of the Credential
  func userInfo() async throws -> UserInfo?
}
```

With this added, you will get an error that `AuthService` can't be found. That's because we haven't created the class yet. Below this code, add the following declarations of the `AuthService` class:

```swift
@Observable
final class AuthService: AuthServicing {

}
```

After doing so, we next need to confirm the `AuthService` class to the `AuthServicing` protocol and also create the `State` enum, which will hold all the states of our Authentication process.

To do that, first let's create the `State` enum inside the `AuthService` class like this:

```swift
@Observable
final class AuthService: AuthServicing {
  enum State: Equatable {
    case idle
    case authenticating
    case waitingForPush
    case authorized(Token)
    case failed(errorMessage: String)
  }
}
```

The new code resolved the two errors about the `AuthService` and the `State` enum. We only have one error to fix, which is confirming the class to the protocol.

We will start implementing the functions top to bottom. Let's first add the two variables from the protocol, accessToken and state. After the definition of the enum, we will add the properties:

```swift
@Observable
final class AuthService: AuthServicing {
  enum State: Equatable {
    case idle
    case authenticating
    case waitingForPush
    case authorized(Token)
    case failed(errorMessage: String)
  }

  private(set) var state: State = .idle

  var accessToken: String? {
    return nil
  }
}
```

For now, we will leave the `accessToken` getter with a return value of `nil`, as we are not using the token yet. We'll add the implementation later.

Next, we'll add a private property to hold a reference to the `DirectAuthenticationFlow` instance.

This object manages the entire DirectAuth process, including credential verification, MFA challenges, and token issuance. The object must persist across authentication steps.

Insert the following variable between the existing `state` and `accessToken` properties:

```swift
private(set) var state: State = .idle
@ObservationIgnored private let flow: DirectAuthenticationFlow?

var accessToken: String? {
  return nil
}
```

To allocate the flow variable, we will need to implement an initializer for the `AuthService` class. Inside, we'll allocate the flow using the `PropertyListConfiguration` that we introduced earlier. Just after the `accessToken` getter, add the following function:

```swift
// MARK: Init

init() {
  // Prefer PropertyListConfiguration if Okta.plist exists; otherwise fall back
  if let configuration = try? OAuth2Client.PropertyListConfiguration() {
      self.flow = try? DirectAuthenticationFlow(client: OAuth2Client(configuration))
  } else {
      self.flow = try? DirectAuthenticationFlow()
  }
}
```

This will try to fetch the Okta.plist file from the project's folder, and if not found, will fall back to the default initializer of `the DirectAuthenticationFlow`. We have now successfully allocated the `DirectAuthenticationFlow`, and we can proceed with implementing the next functions of the protocol.

Moving down to the first function in the protocol, which is the `signIn(username: String, password: String)`.

The `signIn` method below performs the full authentication flow using Okta DirectAuth and Auth Foundation.
It authenticates a user with their username and password, handles MFA challenges (in this case, Okta Verify Push), and securely stores the resulting token for future API calls. Add the following code just under the Init that we just added.

```swift
// MARK: AuthServicing
func signIn(username: String, password: String) {
  Task { @MainActor in
    // 1️⃣ Start the Sign-In Process
    // Update UI state and begin the DirectAuth flow with username/password.
    state = .authenticating
    do {
      let result = try await flow?.start(username, with: .password(password))

      switch result {
        // 2️⃣ Handle Successful Authentication
        // Okta validated credentials, return access/refresh/ID tokens.
      case .success(let token):
        let newCred = try Credential.store(token)
        Credential.default = newCred
        state = .authorized(token)

        // 3️⃣ Handle MFA with Push Notification
        // Okta requires MFA, wait for push approval via Okta Verify.
      case .mfaRequired:
        state = .waitingForPush
        let status = try await flow?.resume(with: .oob(channel: .push))
        if case let .success(token) = status {
          Credential.default = try Credential.store(token)
          state = .authorized(token)
        }
      default:
        break
      }
    } catch {
      // 4️⃣ Handle Errors Gracefully
      // Update state with a descriptive error message for the UI.
      state = .failed(errorMessage: error.localizedDescription)
    }
  }
}
```

Let's break down what's happening step by step:

**1. Start the sign-in process**
   
When the function is called, it launches a new asynchronous Task and sets the UI state to .authenticating.
It then initiates the DirectAuth flow using the provided username and password:

```swift
let result = try await flow?.start(username, with: .password(password))
```

This sends the user's credentials to Okta's Direct Authentication API and waits for a response.

**2. Handle successful authentication**
   
If Okta validates the credentials and no additional verification is needed, the result will be `.success(token)`.

The returned Token object contains access, refresh, and ID tokens.

We securely persist the credentials using AuthFoundation:

```swift
let newCred = try Credential.store(token)
Credential.default = newCred
state = .authorized(token)
```

This marks the user as authenticated and updates the app state, allowing your UI to transition to the signed-in experience.

**3. Handle MFA with push notification**
   
If Okta determines that an MFA challenge is required, the result will be .mfaRequired.
The app updates its state to .waitingForPush, prompting the user to approve the login on their Okta Verify app:

```swift
state = .waitingForPush
let status = try await flow?.resume(with: .oob(channel: .push))
```

The `.oob(channel: .push)` parameter resumes the authentication flow by waiting for the push approval event from Okta Verify.

Once the user approves, Okta returns a new token:

```swift
if case let .success(token) = status {
    Credential.default = try Credential.store(token)
    state = .authorized(token)
}
```

**4. Handle errors**

If any step fails (e.g., invalid credentials, network issues, or push timeout), the catch block updates the UI to show an error message:

```swift
state = .failed(errorMessage: error.localizedDescription)
```

The error function allows your app to display user-friendly error states while preserving robust error handling for debugging.

### Secure, native sign-in in iOS

This function demonstrates a complete native sign-in experience with Okta DirectAuth, no web views, no redirects.

It authenticates the user, manages token storage securely, and handles push-based MFA all within your app's Swift layer – making the authentication flow fast, secure, and frictionless.

The following diagram illustrates how the authentication flow works under the hood when using Okta DirectAuth with push notification authentication factor:

{% img blog/okta-ios-directauth/diagram.svg alt:"Flowchart showing the sequence of steps for authentication flow" width:"800" %}

{% comment %}
Tweak the diagram on https://mermaid.live/ with the following content
flowchart TD
    A["User
    (enters creds)"] --> B("iOS App (Swift)
    AuthService.signIn()")
    B --> C("Okta DirectAuth API
    Validates credentials")
    C --> D{"MFA Required?"}
    D -->|No| E[Tokens]
    D -->|Yes| F["Okta Verify Push Notification
    (user approves sign-in)"]
    F --> G["iOS App resumes flow
    flow.resume(.oob(push))"]
    G -->H["Token issued and stored
    Credential.store(token)"]
    H -->I[fa:fa-circle-check User authenticated]
{% endcomment %}

### Sign-out users when using DirectAuth

Next from the protocol functions is the sign-out method. This method provides a clean and secure way to log the user out of the app.

It revokes the user's active tokens from Okta and resets the local authentication state, ensuring that no stale credentials remain on the device. Add the following code right below the `signIn` method:

```swift
func signOut() async {
  if let credential = Credential.default {
    try? await credential.revoke()
  }
  Credential.default = nil
  state = .idle
}
```

Let's look at what each step does:
**1. Check for an existing credential**
   
```swift
if let credential = Credential.default {
```

The method first checks if a stored credential (token) exists in memory.
`Credential.default` represents the current authenticated session created earlier during sign-in.

**2. Revoke the tokens from Okta**
   
```swift
try? await credential.revoke()
```

This line tells Okta to invalidate the access and refresh tokens associated with that credential.
Calling `revoke()` ensures that the user's session terminates locally and in the authorization server, preventing further API access with those tokens.

The `try?` operator is used to safely ignore any errors (e.g., network failure during logout), since token revocation is a best-effort operation.

**3. Clear local credential data**

```swift
Credential.default = nil
```

After revoking the tokens, the app clears the local credential object.

This removes any sensitive authentication data from memory, ensuring that no valid tokens remain on the device.

**4. Reset the authentication state**
   
```swift
state = .idle
```

Finally, the app updates its internal state back to `.idle`, which tells the UI that the user is now logged out and ready to start a new session.

You can use this state to trigger a transition back to the login screen or turn off authenticated features.

The protocol confirmation is almost complete, and we only have two functions remaining to implement.

### Refresh access tokens securely

Access tokens issued by Okta have a limited lifetime to reduce the risk of misuse if compromised. OAuth clients that can't maintain secrets, like mobile apps, require short access token lifetimes for security. 

To maintain a seamless user experience, your app should refresh tokens automatically before they expire.
The `refreshTokenIfNeeded()` method handles this process securely using `AuthFoundation`'s built-in token management APIs.

Let's walk through what it does. Add the following code right after the `signOut` method:

```swift
func refreshTokenIfNeeded() async throws {
  guard let credential = Credential.default else { return }
  try await credential.refresh()
}
```

**1. Check for an existing credential**

```swift   
guard let credential = Credential.default else { return }
```

Before attempting a token refresh, the method checks whether a valid credential exists.
If no credential is stored (e.g., the user hasn't signed in yet or has logged out), the method exits early.

**2. Refresh the token**

```swift
try await credential.refresh()
```

This line tells Okta to exchange the refresh token for a new access token and ID token.

The `refresh()` method automatically updates the `Credential` object with the new tokens and securely persists them using `AuthFoundation`.

If the refresh token has expired or is invalid, this call throws an error – allowing your app to detect the issue and prompt the user to sign in again.

## Display the authenticated user's information

Lastly, let's look at the `userInfo()` function. After authenticating, your app can access the user's profile information – such as their name, email, or user ID – from Okta using a standard OIDC endpoint.

The `userInfo()` method retrieves this data from the ID token or by calling the authorization server's `/userinfo` endpoint. The ID token doesn't necessarily include all of the profile information though, as the ID token is intentionally lightweight.

Here's how it works. Add the following code after the end of `refreshTokenIfNeeded()`:

```swift
func userInfo() async throws -> UserInfo? {
  if let userInfo = Credential.default?.userInfo {
    return userInfo
  } else {
    do {
      guard let userInfo = try await Credential.default?.userInfo() else {
        return nil
      }
      return userInfo
    } catch {
      return nil
    }
  }
}
```

**1. Return the cached user info** 

```swift
if let userInfo = Credential.default?.userInfo {
  return userInfo
}
```

If the user's profile information has already been fetched and stored in memory, the method returns it immediately.

This avoids unnecessary network calls, providing a fast and responsive experience.

**2. Fetch user info**

```swift
guard let userInfo = try await Credential.default?.userInfo() else {
  return nil
}
```

If the cached data isn't available, the method fetches it directly from Okta using the `UserInfo` endpoint.

This endpoint returns standard OpenID Connect claims such as:

```
sub (the user's unique ID)
name
email
preferred_username
etc...
```

The `AuthFoundation` SDK handles the request and parsing for you, returning a `UserInfo` object.

**3. Handle errors gracefully**
   
```swift
catch {
  return nil
}
```

If the request fails (for example, due to a network issue or expired token), the function returns `nil`.
This prevents your app from crashing and allows you to handle the error by displaying a default user state or prompting re-authentication.

With this implemented, you've resolved all the errors and should be able to build the app. 🎉

## Build the SwiftUI views to display authenticated state

Now that we've built the `AuthService` to handle sign-in, sign-out, token management, and user info retrieval, let's see how to integrate it into your app's UI.

To maintain consistency in your architecture, rename the default `ContentView` to `AuthView` and update all references accordingly.

This clarifies the purpose of the view – it will serve as the primary authentication interface.
Then, create a `Views` folder under your project's folder, drag and drop the `AuthView` into the newly created folder, and create a new file named `AuthViewModel.swift` in the same folder.

The `AuthViewModel` will encapsulate all authentication-related state and actions, acting as the communication layer between your view and the underlying `AuthService`.

Add the following code in `AuthViewModel.swift`:

```swift
import Foundation
import Observation
import AuthFoundation

/// The `AuthViewModel` acts as the bridge between your app's UI and the authentication layer (`AuthService`).
/// It coordinates user actions such as signing in, signing out, refreshing tokens, and fetching user profile data.
/// This class uses Swift's `@Observable` macro so that your SwiftUI views can automatically react to state changes.
@Observable
final class AuthViewModel {
  // MARK: - Dependencies

  /// The authentication service responsible for handling DirectAuth sign-in,
  /// push-based MFA, token management, and user info retrieval.
  private let authService: AuthServicing

  // MARK: - UI State Properties

  /// Stores the user's token, which can be used for secure communication
  /// with backend services that validate the user's identity.
  var accessToken: String?

  /// Represents a loading statex. Set to `true` when background operations are running
  /// (such as sign-in, sign-out, or token refresh) to display a progress indicator.
  var isLoading: Bool = false

  /// Holds any human-readable error messages that should be displayed in the UI
  /// (for example, invalid credentials or network errors).
  var errorMessage: String?

  /// The username and password properties are bound to text fields in the UI.
  /// As the user types, these values update automatically thanks to SwiftUI's reactive data binding.
  /// The view model then uses them to perform DirectAuth sign-in when the user submits the form.
  var username: String = ""
  var password: String = ""

  /// Exposes the current authentication state (idle, authenticating, waitingForPush, authorized, failed)
  /// as defined by the `AuthService.State` enum. The view can use this to display the correct UI.
  var state: AuthService.State {
    authService.state
  }

  // MARK: - Initialization

  /// Initializes the view model with a default instance of `AuthService`.
  /// You can inject a mock `AuthServicing` implementation for testing.
  init(authService: AuthServicing = AuthService()) {
    self.authService = authService
  }

  // MARK: - Authentication Actions

  /// Attempts to authenticate the user with the provided credentials.
  /// This triggers the full DirectAuth flow -- including password verification,
  /// push notification MFA (if required), and secure token storage via AuthFoundation.
  @MainActor
  func signIn() async {
    setLoading(true)
    defer { setLoading(false) }

    do {
      try await authService.signIn(username: username, password: password)
      accessToken = authService.accessToken
    } catch {
      errorMessage = error.localizedDescription
    }
  }

  /// Signs the user out by revoking active tokens, clearing local credentials,
  /// and resetting the app's authentication state.
  @MainActor
  func signOut() async {
    setLoading(true)
    defer { setLoading(false) }

    await authService.signOut()
  }

  // MARK: - Token Handling

  /// Refreshes the user's access token using their refresh token.
  /// This allows the app to maintain a valid session without requiring
  /// the user to log in again after the access token expires.
  @MainActor
  func refreshToken() async {
    setLoading(true)
    defer { setLoading(false) }

    do {
      try await authService.refreshTokenIfNeeded()
      accessToken = authService.accessToken
    } catch {
      errorMessage = error.localizedDescription
    }
  }

  // MARK: - User Info Retrieval

  /// Fetches the authenticated user's profile information from Okta.
  /// Returns a `UserInfo` object containing standard OIDC claims (such as `name`, `email`, and `sub`).
  /// If fetching fails (e.g., due to expired tokens or network issues), it returns `nil`.
  @MainActor
  func fetchUserInfo() async -> UserInfo? {
    do {
      let userInfo = try await authService.userInfo()
      return userInfo
    } catch {
      errorMessage = error.localizedDescription
      return nil
    }
  }

  // MARK: - UI Helpers

  /// Updates the `isLoading` property. This is used to show or hide
  /// a loading spinner in your SwiftUI view while background work is in progress.
  private func setLoading(_ value: Bool) {
    isLoading = value
  }
}
```

With the view model in place, the next step is to bind it to your SwiftUI view.
The `AuthView` will observe the `AuthViewModel`, updating automatically as the authentication state changes.

It will show the user's ID token when authenticated and provide controls for signing in, signing out, and refreshing the token.

Open `AuthView.swift`, remove the existing template code, and insert the following implementation:

```swift
import SwiftUI
import AuthFoundation

/// A simple wrapper for `UserInfo` used to present user profile data in a full-screen modal.
/// Conforms to `Identifiable` so it can be used with `.fullScreenCover(item:)`.
struct UserInfoModel: Identifiable {
  let id = UUID()
  let user: UserInfo
}

/// The main SwiftUI view for managing the authentication experience.
/// This view observes the `AuthViewModel`, displays different UI states
/// based on the current authentication flow, and provides controls for
/// signing in, signing out, refreshing tokens, and viewing user or token information.
struct AuthView: View {

  // MARK: - View Model

  /// The view model that manages all authentication logic and state transitions.
  /// It uses `@Observable` from Swift's Observation framework, so changes here
  /// automatically trigger UI updates.
  @State private var viewModel = AuthViewModel()

  // MARK: - State and Presentation

  /// Holds the currently fetched user information (if available).
  /// When this value is set, the `UserInfoView` is displayed as a full-screen sheet.
  @State private var userInfo: UserInfoModel?

  /// Controls whether the Token Info screen is presented as a full-screen modal.
  @State private var showTokenInfo = false

  // MARK: - View Body

  var body: some View {
    VStack {
      // Render the UI based on the current authentication state.
      // Each case corresponds to a different phase of the DirectAuth flow.
      switch viewModel.state {
      case .idle, .failed:
        loginForm
      case .authenticating:
        ProgressView("Signing in...")
      case .waitingForPush:
        // Waiting for Okta Verify push approval
        WaitingForPushView {
          Task { await viewModel.signOut() }
        }
      case .authorized:
        successView
      }
    }
    .padding()
  }
}

// MARK: - Login Form View
private extension AuthView {
  /// The initial sign-in form displayed when the user is not authenticated.
  /// Captures username and password input and triggers the DirectAuth sign-in flow.
  private var loginForm: some View {
    VStack(spacing: 16) {
      Text("Okta DirectAuth (Password + Okta Verify Push)")
        .font(.headline)

      // Email input field (bound to view model's username property)
      TextField("Email", text: $viewModel.username)
        .keyboardType(.emailAddress)
        .textContentType(.username)
        .textInputAutocapitalization(.never)
        .autocorrectionDisabled()

      // Secure password input field
      SecureField("Password", text: $viewModel.password)
        .textContentType(.password)

      // Triggers authentication via DirectAuth and Push MFA
      Button("Sign In") {
        Task { await viewModel.signIn() }
      }
      .buttonStyle(.borderedProminent)
      .disabled(viewModel.username.isEmpty || viewModel.password.isEmpty)

      // Display error message if sign-in fails
      if case .failed(let message) = viewModel.state {
        Text(message)
          .foregroundColor(.red)
          .font(.footnote)
      }
    }
  }
}

// MARK: - Authorized State View
private extension AuthView {
  /// Displayed once the user has successfully signed in and completed MFA.
  /// Shows the user's ID token and provides actions for token refresh, user info,
  /// token details, and sign-out.
  private var successView: some View {
    VStack(spacing: 16) {
      Text("Signed in 🎉")
        .font(.title2)
        .bold()

      // Scrollable ID token display (for demo purposes)
      ScrollView {
        Text(Credential.default?.token.idToken?.rawValue ?? "(no id token)")
          .font(.footnote)
          .textSelection(.enabled)
          .padding()
          .background(.thinMaterial)
          .cornerRadius(8)
      }
      .frame(maxHeight: 220)

      // Authenticated user actions
      signoutButton
    }
    .padding()
  }
}

// MARK: - Action Buttons
private extension AuthView {
  /// Signs the user out, revoking tokens and returning to the login form.
  var signoutButton: some View {
    Button("Sign Out") {
      Task { await viewModel.signOut() }
    }
    .font(.system(size: 14))
  }
}
```

With this added, you will receive an error stating that `WaitingForPushView` can't be found in scope. To fix this, we need to add that view next. Add a new empty Swift file in the `Views` folder and name it `WaitingForPushView`. When complete, add the following implementation inside:

```swift
import SwiftUI

struct WaitingForPushView: View {
  let onCancel: () -> Void

  var body: some View {
    VStack(spacing: 16) {
      ProgressView()
      Text("Approve the Okta Verify push on your device.")
        .multilineTextAlignment(.center)

      Button("Cancel", action: onCancel)
    }
    .padding()
  }
}
```

Now you can run the application on a simulator, and it should present you with the option to log in first with a username and password. After selecting **SignIn**, it will redirect to the "Waiting for push notification" screen and remain active until you acknowledge the request from the Okta Verify App. If you're logged in, you'll see the access token and a sign-out button.

### Read ID token info

Once your app authenticates a user with Okta DirectAuth, the resulting credentials are securely stored in the device's keychain through `AuthFoundation`.

These credentials include access, ID, and (optionally) refresh tokens – all essential for securely calling APIs or verifying user identity.

In this section, we'll create a skeleton `TokenInfoView` that reads the current tokens from `Credential.default` and displays them in a developer-friendly format.

This view helps visualize the credential in the store and to inspect the scope. And it helps verify that the authentication flow works.

Create a new Swift file in the `Views` folder and name it `TokenInfoView`. Add the following code:

```swift
import SwiftUI
import AuthFoundation

/// Displays detailed information about the tokens stored in the current
/// `Credential.default` instance. This view is helpful for debugging and
/// validating your DirectAuth flow -- confirming that tokens are correctly
/// issued, stored, and refreshed.
///
/// ⚠️ **Important:** Avoid showing full token strings in production apps.
/// Tokens should be treated as sensitive secrets.
struct TokenInfoView: View {

  /// Retrieves the current credential object managed by `AuthFoundation`.
  /// If the user is signed in, this will contain their access, ID, and refresh tokens.
  private var credential: Credential? { Credential.default }

  /// Used to dismiss the current view when the close button is tapped.
  @Environment(\.dismiss) var dismiss

  var body: some View {
    ScrollView {
        VStack(alignment: .leading, spacing: 20) {

          // MARK: - Close Button
          // Dismisses the token info view when tapped.
          Button {
            dismiss()
          } label: {
            Image(systemName: "xmark.circle.fill")
              .resizable()
              .foregroundStyle(.black)
              .frame(width: 40, height: 40)
              .padding(.leading, 10)
          }

          // MARK: - Token Display
          // Displays the token information as formatted monospaced text.
          // If no credential is available, a "No token found" message is shown.
          Text(credential?.toString() ?? "No token found")
            .font(.system(.body, design: .monospaced))
            .padding()
            .frame(maxWidth: .infinity, alignment: .leading)
        }
    }
    .background(Color(.systemGroupedBackground))
    .navigationTitle("Token Info")
    .navigationBarTitleDisplayMode(.inline)
  }
}

// MARK: - Credential Display Helper

extension Credential {
  /// Returns a formatted string representation of the stored token values.
  /// Includes access, ID, and refresh tokens as well as their associated scopes.
  ///
  /// - Returns: A multi-line string suitable for debugging and display in `TokenInfoView`.
  func toString() -> String {
    var result = ""

    result.append("Token type: \(token.tokenType)")
    result.append("\n\n")

    result.append("Access Token: \(token.accessToken)")
    result.append("\n\n")

    result.append("Scopes: \(token.scope?.joined(separator: ",") ?? "No scopes found")")
    result.append("\n\n")

    if let idToken = token.idToken {
      result.append("ID Token: \(idToken.rawValue)")
      result.append("\n\n")
    }

    if let refreshToken = token.refreshToken {
      result.append("Refresh Token: \(refreshToken)")
      result.append("\n\n")
    }

    return result
  }
}
```

To view this on screen, we need to instruct SwiftUI to present it. We added the `State` variable in the `AuthView` for this purpose - it's named `showTokenInfo`. Next, we need to add a button to present the `TokenInfoView`. Go to the `AuthView.swift` and scroll down to the last private extension where it says "Action Buttons" and add the following button:

```swift
/// Opens the full-screen view showing token info.
var tokenInfoButton: some View {
  Button("Token Info") {
    showTokenInfo = true
  }
  .disabled(viewModel.isLoading)
}
```

Now that this is in place, we need to tell SwiftUI that we want to present `TokenInfoView` whenever the `showTokenInfo` boolean is true. In the `AuthView`, find the body and add this code at the end below the `.padding()`:

```swift
// Show Token Info full screen
.fullScreenCover(isPresented: $showTokenInfo) {
  TokenInfoView()
}
```

If you build and run the app, you'll no longer see the **Token Info** button when logged in. To keep the button visible, we also need to reference the `tokenInfoButton` in the `successView`. In the `AuthView` file, scroll down to "Authorized State View" (`successView`) and reference the button just above the `signoutButton` like this:

```swift
private var successView: some View {
  VStack(spacing: 16) {
    Text("Signed in 🎉")
      .font(.title2)
      .bold()

    // Scrollable ID token display (for demo purposes)
    ScrollView {
      Text(Credential.default?.token.idToken?.rawValue ?? "(no id token)")
        .font(.footnote)
        .textSelection(.enabled)
        .padding()
        .background(.thinMaterial)
        .cornerRadius(8)
    }
    .frame(maxHeight: 220)

    // Authenticated user actions
    tokenInfoButton // this is added
    signoutButton
  }
  .padding()
}
```

Try building and running the app. You should now see the **Token Info** button after logging in. Tapping the button should open the Token Info View.

## View the authenticated user's profile info

Once your app authenticates a user with Okta DirectAuth, it can use the stored credentials to request profile information from the `UserInfo` endpoint securely.

This endpoint returns standard OpenID Connect (OIDC) claims, including the user's name, email address, and unique identifier (`sub`).

In this section, you'll add a **User Info** button to your authenticated view and implement a corresponding `UserInfoView` that displays these profile details.

This is a quick and powerful way to confirm the validity of the access token and that your app can retrieve user data after sign-in.

Create a new empty Swift file in the `Views` folder and name it `UserInfoView`. Then add the following code:

```swift
import SwiftUI
import AuthFoundation

/// A view that displays the authenticated user's profile information
/// retrieved from Okta's **UserInfo** endpoint.
///
/// The `UserInfo` object is provided by **AuthFoundation** and contains
/// standard OpenID Connect (OIDC) claims such as `name`, `preferred_username`,
/// and `sub` (subject identifier). This view is shown after the user has
/// successfully authenticated, allowing you to confirm that your access token
/// can retrieve user data.
struct UserInfoView: View {

  /// The user information returned by the Okta UserInfo endpoint.
  let userInfo: UserInfo

  /// Used to dismiss the view when the close button is tapped.
  @Environment(\.dismiss) var dismiss

  var body: some View {
    ScrollView {
      VStack(alignment: .leading, spacing: 20) {

          // MARK: - Close Button
          // Dismisses the full-screen user info view.
          Button {
            dismiss()
          } label: {
            Image(systemName: "xmark.circle.fill")
              .resizable()
              .foregroundStyle(.black)
              .frame(width: 40, height: 40)
              .padding(.leading, 10)
          }

          // MARK: - User Information Text
          // Displays formatted user claims (name, username, subject, etc.)
          Text(formattedData)
            .font(.system(size: 14))
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding()
        }
    }
    .background(Color(.systemBackground))
    .navigationTitle("User Info")
    .navigationBarTitleDisplayMode(.inline)
  }

  // MARK: - Data Formatting

  /// Builds a simple multi-line string of readable user information.
  /// Extracts common OIDC claims and formats them for display.
  private var formattedData: String {
    var result = ""

    // User's full name
    result.append("Name: " + (userInfo.name ?? "No name set"))
    result.append("\n\n")

    // Preferred username (email or login identifier)
    result.append("Username: " + (userInfo.preferredUsername ?? "No username set"))
    result.append("\n\n")

    // Subject identifier (unique Okta user ID)
    result.append("User ID: " + (userInfo.subject ?? "No ID found"))
    result.append("\n\n")

    // Last updated timestamp (if available)
    if let updatedAt = userInfo.updatedAt {
      let dateFormatter = DateFormatter()
      dateFormatter.dateStyle = .medium
      dateFormatter.timeStyle = .short
      let formattedDate = dateFormatter.string(for: updatedAt)
      result.append("Updated at: " + (formattedDate ?? ""))
    }

    return result
  }
}
```

Once again, to display this in our app, we need to add a new button to show the new view. To do that, open the `AuthView.swift`, scroll down to the last private extension where it says "Action Buttons", and add the following button just below the `tokenInfoButton`:

```swift
/// Loads user info and presents it full screen.
@MainActor
var userInfoButton: some View {
  Button("User Info") {
    Task {
      if let user = await viewModel.fetchUserInfo() {
        userInfo = UserInfoModel(user: user)
      }
    }
  }
  .font(.system(size: 14))
  .disabled(viewModel.isLoading)
}
```

Next, we need to add the button to the `successView` like we did with the `tokenInfoButton`. Then, we will use the `userInfo` property in the `AuthView`, which we added at the start. Navigate to the `AuthView.swift` file and find the `successView` in the "Authorized State View" mark and reference the `userInfoButton` after the `tokenInfoButton` like this:

```swift
private var successView: some View {
  VStack(spacing: 16) {
    Text("Signed in 🎉")
      .font(.title2)
      .bold()

    // Scrollable ID token display (for demo purposes)
    ScrollView {
      Text(Credential.default?.token.idToken?.rawValue ?? "(no id token)")
        .font(.footnote)
        .textSelection(.enabled)
        .padding()
        .background(.thinMaterial)
        .cornerRadius(8)
    }
    .frame(maxHeight: 220)

    // Authenticated user actions
    tokenInfoButton
    userInfoButton // this is added
    signoutButton
  }
  .padding()
}
```

We need to tell SwiftUI that we want to open a new `UserInfoView` whenever the value on the `userInfo` property changes. To do so, open the `AuthView` and find the body variable, add the following code after the last closing bracket:

```swift
// Show User Info full screen
.fullScreenCover(item: $userInfo) { info in
  UserInfoView(userInfo: info.user)
}
```

The body of your `AuthView` should look like this now:

```swift
var body: some View {
  VStack {
    // Render the UI based on the current authentication state.
    // Each case corresponds to a different phase of the DirectAuth flow.
    switch viewModel.state {
    case .idle, .failed:
      loginForm
    case .authenticating:
      ProgressView("Signing in...")
    case .waitingForPush:
      // Waiting for Okta Verify push approval
      WaitingForPushView {
        Task { await viewModel.signOut() }
      }
    case .authorized:
      successView
    }

    if viewModel.isLoading {
      ProgressView()
    }
  }
  .padding()
  // Show Token Info full screen
  .fullScreenCover(isPresented: $showTokenInfo) {
    TokenInfoView()
  }
  // Show User Info full screen
  .fullScreenCover(item: $userInfo) { info in
    UserInfoView(userInfo: info.user)
  }
}
```

### Keeping tokens refreshed and maintaining user sessions

Access tokens have a limited lifetime to ensure your app's security. When a token expires, the user shouldn't have to sign-in again – instead, your app can request a new access token using the refresh token stored in the credential.

In this section, you'll add support for token refresh, allowing users to stay authenticated without repeating the entire sign-in and MFA flow.

You'll add an action in the UI that calls the `refreshTokenIfNeeded()` method from your `AuthService`, which silently exchanges the refresh token for a new set of valid tokens. We're making this call manually, but you can watch for upcoming expiry and refresh the token before it happens preemptively. While we don't show it here, you should use **Refresh Token Rotation** to ensure refresh tokens are also short-lived as a security measure. 

First, we need to add the `refreshTokenButton`, which we'll add to the `AuthView`. Open the `AuthView`, scroll down to the last private extension in the "Action Buttons" mark, and add the following button at the end of the extension:

```swift
/// Refresh Token if needed
var refreshTokenButton: some View {
  Button("Refresh Token") {
    Task { await viewModel.refreshToken() }
  }
  .font(.system(size: 14))
  .disabled(viewModel.isLoading)
}
```

Next, we need to reference the button somewhere in our view. We will do that inside the `successView`, like we did with the other buttons. Find the `successView` and add the button. Your `successView` should look like this:

```swift
private var successView: some View {
  VStack(spacing: 16) {
    Text("Signed in 🎉")
        .font(.title2)
        .bold()

    // Scrollable ID token display (for demo purposes)
    ScrollView {
      Text(Credential.default?.token.idToken?.rawValue ?? "(no id token)")
        .font(.footnote)
        .textSelection(.enabled)
        .padding()
        .background(.thinMaterial)
        .cornerRadius(8)
    }
    .frame(maxHeight: 220)

    // Authenticated user actions
    tokenInfoButton
    userInfoButton
    refreshTokenButton // this is added
    signoutButton
  }
  .padding()
}
```

Now, if you run the app and tap the `refreshTokenButton`, you should see your token change in the token preview label.

One thing that we didn't implement and left with a default implementation to return `nil` is the `accessToken` property on the `AuthService`. Navigate to the `AuthService`, find the `accessToken` property, and replace the code so it looks like this:

```swift
var accessToken: String? {
  switch state {
  case .authorized(let token):
    return token.accessToken
  default:
    return nil
  }
}
```

Currently, if you restart the app, you'll get a prompt to log in each time. This is not a good user experience, and the user should remain logged in. We can add this feature by adding code in the `AuthService` initializer. Open your `AuthService` class and replace the `init` function with the following:

```swift
init() {
  // Prefer PropertyListConfiguration if Okta.plist exists; otherwise fall back
  if let configuration = try? OAuth2Client.PropertyListConfiguration() {
    self.flow = try? DirectAuthenticationFlow(client: OAuth2Client(configuration))
  } else {
    self.flow = try? DirectAuthenticationFlow()
  }

  // Added
  if let token = Credential.default?.token {
    state = .authorized(token)
  }
}
```
## Build your own secure native sign-in iOS app

You've now built a fully native authentication flow on iOS using Okta DirectAuth with push notification MFA – no browser redirects required. You can check your work against [the GitHub repo](https://github.com/oktadev/okta-ios-swift-directauth-example) for this project.

Your app securely signs users in, handles multi-factor verification through Okta Verify, retrieves user profile details, displays token information, and refreshes tokens to maintain an active session.
By combining `AuthFoundation` and `OktaDirectAuth`, you've implemented a modern, phishing-resistant authentication system that balances strong security with a seamless user experience – all directly within your SwiftUI app.

If you found this post interesting, you may want to check out these resources:
* [How to Build a Secure iOS App with MFA](/blog/2025/08/20/ios-mfa)
* [Introducing the New Okta Mobile SDKs](/blog/2022/08/30/introducing-the-new-okta-mobile-sdks)
* [A History of the Mobile SSO (Single Sign-On) Experience in iOS](/blog/2022/01/13/mobile-sso)

Follow OktaDev on [Twitter](https://twitter.com/oktadev) and subscribe to our [YouTube channel](https://www.youtube.com/c/OktaDev/) to learn about secure authentication and other exciting content. We also want to hear from you about topics you want to see and questions you may have. Leave us a comment below!
