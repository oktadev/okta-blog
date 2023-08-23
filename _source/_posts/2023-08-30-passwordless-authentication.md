---
layout: blog_post
title: "We're Living in a Passwordless World"
author: alisa-duncan
by: advocate
communities: [security,mobile,javascript]
description: "From passwords to passwordless — learn about how to elevate your authentication security."
tags: ["passkey", "authentication", "fido"]
tweets:
- ""
- ""
- ""
image: blog/passwordless-authentication/social.jpg
type: awareness
---

Passwords? Bah! Who wants to remember all those letter, number, and special character combinations? Password managers and password manager browser extensions can help us, but what if we stopped using passwords entirely? What if we stopped using authentication factors, such as SMS one-time passwords (OTP), that pose risks where malicious actors can access sensitive authentication information (phishing)? What if authentication was so seamless that we could use built-in device hardware capabilities instead?

Seamless, easy-to-use authentication is the future many dream of, including a group called the [Fast Identity Online (FIDO) Alliance](https://fidoalliance.org/). The FIDO Alliance is a group of organizations that focuses on providing open and free authentication standards utilizing more secure technologies. And we've heard of the [World Wide Web Consortium (W3C)](https://www.w3.org/) as a group that builds web standards. How do these two groups intersect when it comes to authentication security? Let's better understand the collaboration and what it means for us.

{% include toc.md %}

## Authentication factors

Passwords were the default authentication mechanism for years, but passwords are notoriously insecure and [cause most data breaches](https://www.okta.com/resources/whitepaper/protecting-against-data-breaches/). Research shows that >80% of breaches stem from stolen or weak passwords. So it's time for something more secure.

Passwords are one way to authenticate, but there are other options. Authentication factors break down into the following categories:

<table>
<tr>
    <td>{% img blog/passwordless-authentication/factor-knowledge.jpg alt:"Icon of someone thinking" width:"100" %}</td>
    <td markdown="span">
      **Something you know** <br/>
      Knowledge factors include passwords and PINs
    </td>
</tr>
<tr>
    <td>{% img blog/passwordless-authentication/factor-possession.jpg alt:"Icon showing devices such as computer, tablet, and phone" width:"100" %}</td>
    <td markdown="span">
    **Something you have**<br/>
    Possession factors include devices such as smart cards, security keys, phones, and tablets
    </td>
</tr>
<tr>
    <td>{% img blog/passwordless-authentication/factor-inherence.jpg alt:"Icon of a hand with fingerprint" width:"100" %}</td>
    <td markdown="span">
    **Something you are**<br/>
    Inference factors include biometrics such as fingerprints and facial recognition
    </td>
</tr>
</table>

Because of the security risks associated with passwords, the security community recommended adding additional authentication factors to mitigate the concerns about using passwords alone. Unfortunately, there were still security risks and barriers associated with past recommendations. So that we understand how we get to yet a new recommended method for authentication, let's recap a few of the previous advice and why they weren't the perfect solutions:

<table>
<tr>
    <td>{% img blog/passwordless-authentication/warning.jpg alt:"Warning icon" width:"100" %}</td>
    <td markdown="span">
      **Any two-factor authentication (2FA) and multi-factor authentication (MFA)** <br/>
      Both 2FA and MFA can still be insecure. For example, legacy knowledge-based authentication factors such as security questions are weak, insecure, and prone to social engineering. SMS OTP, a possession-based factor, is vulnerable to SIM swapping hacks and is phishable.
    </td>
</tr>
<tr>
    <td>{% img blog/passwordless-authentication/warning.jpg alt:"Warning icon" width:"100" %}</td>
    <td markdown="span">
    **Time-based one-time passwords (TOTP)**<br/>
    TOTP are the codes you get through software authenticators, such as Okta Verify or Google Authenticator, valid for a short time. While TOTP improves SMS OTP, it can be vulnerable to meddler-in-the-middle (MITM) attacks, displays the code in plaintext and expects the user to transcribe the value accurately and quickly to authenticate.
    </td>
</tr>
<tr>
    <td>{% img blog/passwordless-authentication/confused.jpg alt:"Icon of a person confused" width:"100" %}</td>
    <td markdown="span">
    **Smart cards conforming to FIDO's Universal 2nd Factor (U2F) standard, such as security keys**<br/>
    Smart cards are a very secure and less human error-prone option because they use a locally stored cryptographically secure key and utilize Bluetooth, USB, or Near Field Communication (NFC) instead of the internet or phone line to transmit the authentication code on behalf of the user. While U2F may be an option for work accounts, users found it cumbersome for personal use.
    </td>
</tr>
</table>

What we want is a robust, phishing-resistant, easy-to-use authentication mechanism.

## Phishing-resistant authentication

Phishing-resistant authentication factors include local biometric factors and secure possession-based factors. Using cryptographically unique credentials for each website and new browser capabilities that streamlines secure authentication is the winning combination!  

Using FIDO and W3C's combined forces brings us to a new authentication standard called FIDO2. FIDO2 retained the cryptographically secure authentication key from the previous U2F method. They introduced a new protocol to an existing standard for devices to interoperate with web browsers called [Client to Authenticator Protocol (CTAP2)](https://fidoalliance.org/specs/fido-v2.0-ps-20190130/fido-client-to-authenticator-protocol-v2.0-ps-20190130.html). Devices supporting CTAP2 include those with built-in biometric readers such as phones, and external devices such as smart keys. An example of a device with built-in hardware authenticators includes laptops with fingerprint sensors or cameras for facial recognition. External devices include security keys, phones, and watches with Bluetooth, USB, or NFC communication capability.

{% img blog/passwordless-authentication/ctap.jpg alt:"Graphic of device icons such as phone, laptop, smart card, and smart key along with forms of communication (Bluetooth, USB, and NFC)" width:"800" %}{: .center-image }

W3C introduced a new web standard for web authentication called [WebAuthn](https://www.w3.org/TR/webauthn-2/). A new browser API, the Web Authentication API, extends from the Credential Management API. The Web Authentication API supports secure authentication credentials using asymmetric encryption (where you have a public and private key) instead of passwords. All modern browsers have full or partial WebAuthn capabilities. You can check which browsers and versions support WebAuthn on [caniuse.com](https://caniuse.com/?search=webauthn). The screen capture shows browser support at the time of publishing. 

{% img blog/passwordless-authentication/webauthn-caniuse.jpg alt:"WebAuthn support across browsers showing Internet Explorer and Opera Mini having no support, Firefox desktop and mobile has partial support, and remaining browsers including Chrome, Edge, Safari on desktop and mobile having support." width:"800" %}{: .center-image }

FIDO's Client to Authenticator Protocol complements WebAuthn to create a seamless, easy-to-use, secure authentication experience. 

{% img blog/passwordless-authentication/webauthn-ctap.jpg alt:"Icons representing WebAuthn in the browser and CTAP devices with a heart in between" width:"800" %}{: .center-image }

A new term for this authentication mechanism without passwords is often called "passwordless." And the combination of WebAuthn and CTAP2 hardware devices to enable passwordless authentication is called a "passkey." What a great name!

## FIDO2 authentication with WebAuthn and CTAP
 
So how does this work? At a high level, your FIDO2 authentication flow utilizes each of the three factors:
1. Something you know, a PIN to unlock the device
2. Something you have, the authenticator device, which may be a security key or a capable phone
3. Something you are, biometric data such as fingerprint or facial recognition

Before we authenticate, we need an account with compliant credentials, so let's start with the registration process. We'll use a public demo site demonstrating how passkeys work as we step through what's going on in the registration and authentication process. Follow along at [webauthn.io](https://webauthn.io/).

There are a couple of components at play. From the user's perspective, they interact with a website and a device like their phone. From a technology perspective, there's WebAuthn and CTAP2. I'll show screenshots of the user perspective underlying network calls and describe the hand-off between WebAuthn and CTAP2.

## Registering a user for passkeys

The user opens their favorite site in the browser. In the FIDO2 world, the site that makes the WebAuthn calls is the _Relying Party_, and the browser is the _Client_. If your site uses a single-page application frontend, the relying party includes both the frontend and backend server. 

{% img blog/passwordless-authentication/webauthnio.jpg alt:"webauthn.io site showing a user name field an buttons to register or authenticate" width:"800" %}{: .center-image }

The web app for the site displays a form to gather user information, an email address, or a user name. The user enters the required information and presses **Register**. The web app recognizes the browser as FIDO2 capable and asks if the user wants to sign in using a passkey instead of a password. Of course, the user says, "Yes!"

{% img blog/passwordless-authentication/webauthnio-register.jpg alt:"webauthn.io site showing a user name entered in the form and a modal from the browser asking to create a passkey" width:"800" %}{: .center-image }

The web app calls the server with credential request options, such as the username and registration-related data. You can open debugging capabilities in your browser and watch the network requests. Here, we see the payload for the call, which includes the username.

{% img blog/passwordless-authentication/webauthnio-register-payload.jpg alt:"webauthn.io payload to register a user includes the username along with registration metadata configurable in advanced settings, such as encryption algorithm" width:"800" %}{: .center-image }

The server responds with information about the relying party, a user ID, and a cryptographically random value for the registration process called a "challenge." 

{% img blog/passwordless-authentication/webauthnio-register-response.jpg alt:"webauthn.io response includes relying party id, user name and id, and the challenge" width:"800" %}{: .center-image }

The user selects a device for the passkey, like a phone or tablet. The web app uses WebAuthn to generate a new credential, sending the response information from the server, including the challenge. The credential call from the browser to the authenticator is possible via CTAP2.

The authenticator takes over, prompting the user for consent and biometric information. The authenticator generates a public/private key set for the website. The authenticator signs the public key with an attestation certificate for the device hardware. Signing the key with the attestation certificate proves the keyset is from a specific device. The authenticator returns the public key in the WebAuthn credential response.

{% img blog/passwordless-authentication/webauthnio-ctap.jpg alt:"webauthn.io site with a modal to create a passkey showing a QR code" width:"800" %}{: .center-image }

The web app calls the server with the public key and the user ID to store the user's credentials.

{% img blog/passwordless-authentication/webauthnio-register-success-payload.jpg alt:"webauthn.io site network call payload to complete registration" width:"800" %}{: .center-image }

The server verifies the key for completeness and integrity, such as ensuring the certificate's validity, the website origin is accurate, and that the challenge value matches the original response. Once verified, the server persists this info, matching your username with the public key so it has the information needed to authenticate you for the passkey later.

{% img blog/passwordless-authentication/webauthnio-register-success-response.jpg alt:"webauthn.io site network call response to complete the registration" width:"800" %}{: .center-image }

The user is now registered to use FIDO2 authentication mechanisms in the future. Before diving into user authentication, let's relook at registration. The above scenario demonstrates a user registration process for a new user account. But you can extend the method to pre-existing accounts on your favorite site. Let's say you already have an existing account on your favorite e-commerce site. You open the site and log in with your username and password. After authenticating, the web app recognizes the browser as FIDO2 capable and asks if you want to convert your authentication experience away from passwords. Of course, you'll want to say, "Yes, passkeys, please!" The rest of the steps are the same.

## Authenticating a user with passkeys

We can see what user authentication looks like with an account for the site set up and the initial passkey created.

The user opens their favorite website (the Relying Party) in their browser (the Client) and initiates signing in by entering their username and pressing **Authenticate**. They'll see a prompt from the client to complete authentication using the passkey they created during registration.

{% img blog/passwordless-authentication/webauthnio-authn.jpg alt:"webauthn.io site authenticate user prompt from the browser" width:"800" %}{: .center-image }

But we want to see what's going on under the covers, so let's look at the network call. The web app calls the server with the username from the user entry. 

{% img blog/passwordless-authentication/webauthnio-authn-request.jpg alt:"webauthn.io site network call request to authenticate user" width:"800" %}{: .center-image }

The server remembers you're using passkeys! 🎉 The server responds with a challenge and additional information required for authentication, such as Relying Party and user credentials or authenticator information.

{% img blog/passwordless-authentication/webauthnio-authn-response.jpg alt:"webauthn.io site network call response to authenticate user" width:"800" %}{: .center-image }

The website uses WebAuthn to get credentials, which causes the browser to pass the challenge to the authenticator. The authenticator verifies it has credentials for the site and can sign the challenge using the keyset registered, a process called "assertion." The authenticator requests user consent via biometric verification or a PIN and returns the signed assertion. The browser presents the user with an authentication challenge through the browser, which we see in the screenshots above of the authentication flow. The user grants consent using the passkey.

{% img blog/passwordless-authentication/webauthnio-authn-ctap.jpg alt:"webauthn.io site authentication authenticator grant" width:"800" %}{: .center-image }

The web app sends the signed assertion to the server for validation. The server validates the public key used matches what it has on hand for the user, the challenge matches the one from the initiate request, and the Relying Party information is correct. We can see the request call payload for server verification. 

{% img blog/passwordless-authentication/webauthnio-authn-success.jpg alt:"webauthn.io site authentication success response" width:"800" %}{: .center-image }

Authentication success!

## Passkeys everywhere

A great thing about this mechanism is that it works across all compatible browsers and devices, making authentication a truly seamless experience. Let's say you first created a passkey for your favorite site on your phone and your phone's fingerprint scanner. Later, when you open the site on your laptop using another compatible browser, you'll see a prompt to create a new passkey for the laptop using biometric hardware built into your laptop automatically. Suppose you utilize devices within a vendor's ecosystem. In that case, your passkeys can migrate between devices, allowing you to authenticate with the device hardware without creating a separate passkey for each device, making authentication even more seamless.

## Web Authentication API

But let's be honest. There are a lot of steps documented in this post and many screenshots for the registration and authentication process. So you may be thinking, "Whoa, there are a lot of steps! It has to be complicated to use, right"? Quite the opposite! The user experience is seamless, although there's communication between the different parties behind the scenes. From the user's perspective, as you can see in the screenshots, it looks like a touch of a fingerprint on a device or a scan of a face... and that's it! No passwords are required! But we're developers, so what does it look like for us?

From a developer perspective, you can use the [Web Authentication API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API) directly. There are two methods you use:

```js
navigator.credentials.create({options});

navigator.credentials.get({options});
```

You'll need to pass in options for each call, including the Relying Party info, challenge, etc. If you want to use something other than Web Authentication APIs directly, you can find a library for your favorite tech stack on [webauthn.io](https://webauthn.io/).

## Using passkeys with Identity Providers

We're entering a whole new world of authentication. Authentication security is critical. You don't want to dedicate development time and resources to add new, excellent security-minded features like passkeys, and you certainly don't want to spend time maintaining and monitoring. And you'll still need to handle user identity and access management. So, while the landscape may look different, you still want to use a reputable Identity Provider that supports FIDO2.

Okta has passkey support, including in your Developer Edition org. The great news is many reputable Identity Providers support this. So, if you redirect to Okta for sign-in, your application can take advantage of secure phishing-resistant FIDO2 authentication with only some configuration changes within the Okta Admin Console. You can try out using passkeys as part of the authentication experience yourself on Okta by following the [instructions on the Okta Help Center](https://help.okta.com/oie/en-us/Content/Topics/identity-engine/authenticators/configure-webauthn.htm).

## Learn more about WebAuthn, Client to Authenticator Protocol (CTAP), passwordless authentication, and passkeys

This post laid out the landscape of the new passwordless world, why there was a need for this new authentication mechanism, and how it works behind the scenes. If you found this post intriguing and want to learn more, you may find these links useful:

* [Phishing-Resistant Authenticators with Megha Rastogi: Okta Workforce Identity Developer Podcast](https://youtu.be/PiY5HDp0ABI)
* [Building a WebAuthn Application with Java](/blog/2022/04/26/webauthn-java)
* [Our Take on Passkeys blogpost by Auth0](https://auth0.com/blog/our-take-on-passkeys/)
* [Passkeys in Action video by the FIDO Alliance](https://youtu.be/SWocv4BhCNg)

Don't forget to follow us on [Twitter](https://twitter.com/oktadev) and subscribe to our [YouTube channel](https://www.youtube.com/c/OktaDev/) for more great content. We'd also love to hear from you! Please comment below if you have questions or want to share your WebAuthn experience. Also, let us know what topics you'd like to see us cover next.
