---
disqus_thread_id: 8135519511
discourse_topic_id: 17268
discourse_comment_url: https://devforum.okta.com/t/17268
layout: blog_post
title: "Introducing JPaseto: Security Tokens For Java"
author: brian-demers
by: advocate
communities: [security,java]
description: "JPaseto is a PASETO security token library for Java, learn more in this post."
tags: [java, paseto, security-tokens, security, tokens]
tweets:
- "PASETO, like JWT but better, get started with PASETO with #Java with JPaseto‼️"
- "JPaseto is a new security token library for #Java and JVM languages🔒"
- "If you like JWTs, you will love PASETO ❤️ #Java developers check out JPaseto ⬇️"
image: blog/introducing-jpaseto/jpaseto-social.png
type: awareness
---

PASETO is a new security token format designed to be easy to use and free from the issues inherent with JSON Web Token (JWT) related specifications. Platform Agnostic SEcurity TOkens (PASETO) is a draft RFC spec created by [Scott Arciszewski](https://paragonie.com/). PASETO reduces the scope of the JavaScript Object Signing and Encryption (JOSE) family of specs (which JWT is a part of), while still providing the functions that secure applications need.  

> PASETO is everything you love about JOSE (JWT, JWE, JWS) without any of the many design deficits that plague the JOSE standards.

Today, I'm going to introduce you to [JPaseto](https://github.com/paseto-toolkit/jpaseto), a new Java developer library we've built that makes it easy to work with PASETOs in your own applications.

Before we get into that, however, let's talk about JWTs.

# What's wrong with JWTs?

The simple answer to this question is "nothing." It is *technically* possible to build and use JWTs correctly. However, due to the complexities of the JWT spec, it's easy to misuse them, which results in the large number of JWT vulnerabilities we've seen lately. While many of these vulnerabilities are specific to a given JWT implementation, part of the fault lies with the JWT specification itself.
 
JWTs aim to support a wide range of cryptographic algorithms, including no cryptography at all! Think about that for a minute; one of the core features of a JWT security token is the ability to disable said security.

Some of the most common JWT exploits we see are authentication bypass attacks, where an attacker is able to edit or forge a JWT and disable the token's cryptographic verification. The creator of the PASETO spec goes into more detail on the various cryptographic and spec-related issues in the JWT spec in his [well-known post](https://paragonie.com/blog/2018/03/paseto-platform-agnostic-security-tokens-is-secure-alternative-jose-standards-jwt-etc).

You can browse through a list of JWT vulnerabilities in the [NIST CVE database](https://nvd.nist.gov/vuln/search/results?form_type=Advanced&results_type=overview&query=jwt&search_type=all) if you're interested in seeing various other JWT-related issues.

Why is this so important? JWTs have become a critical part of web authentication. They're used in nearly every modern web application to secure user sessions. Their widespread adoption paired with their inherent security issues has caused a perfect storm of widespread vulnerabilities.

# Enter PASETO: A Secure Alternative to JWTs

PASETOs were designed to improve upon the design of JWTs, making them more cryptographically resilient and far simpler to use.

The [PASETO spec](https://paseto.io/) defines two types of tokens: local and public. Local tokens are always symmetrically encrypted with a shared secret key which means no one can view the contents of a local PASETO unless they have the correct secret key. Public tokens are readable by anyone and are validated with a public key. There is no "none" option; you cannot have a security token without security!

Similar to JWTs, a PASETO token is a set of dot-separated base64url encoded data formatted as:

```txt
version.purpose.payload.footer
```

* version: Allows for incremental improvements the token format, (current versions are "v1" and "v2")
  * v1: Uses strong cryptographic primitives that are more widely available today
  * v2: Uses newer and stronger cryptographic primitives, but are supported by fewer cryptographic libraries
* purpose: A short string describing the token format "local" or "public"
  * local: The payload of the token is encrypted and is only viewable by parties that have the shared-key
  * public: The payload is NOT encrypted, it is signed and verified with a public key
* payload: Encoded data with a format specific to the version and purpose of the token
* footer (optional): Unencrypted JSON, typically used to store the ID of a public key used to validate the token.

All PASETO tokens formats are tamper proof and the entire message is authenticated, meaning if you change anything in the token, validation fails.

# JPaseto: A PASETO Library for Java/JVM Developers

At Okta, we developed an open-source Java-based PASETO library named [JPaseto](https://github.com/paseto-toolkit/jpaseto) to make getting started with PASETO even easier. We took everything we loved and learned from the popular [JJWT](https://github.com/jwtk/jjwt/) project and put it into JPaseto (JJWT is the most popular JWT library for Java developers).

From a high-level perspective, JJWT and JPaseto have the same feature set (the ability to create and verify tokens); however, JPaseto has less than half the lines of code.  

**NOTE**: If you need to parse JWTs, I'd still recommend the JJWT library, as it does protect you from types of exploits that have been in the news lately. 

We take the quality and security of JPaseto very seriously, and the library has been through a [comprehensive security audit](https://paragonie.com/audit/OiT6VlbQ7n6Y6Qz6) by the same group of cryptographers that wrote the PASETO specification.

JPaseto is available on [Maven Central](https://search.maven.org/search?q=jpaseto) and can be used in any JVM based project (Java, Kotlin, Groovy, etc) by including the following dependencies:

```groovy
compile 'dev.paseto:jpaseto-api:0.5.0'
runtime 'dev.paseto:jpaseto-impl:0.5.0',
        'dev.paseto:jpaseto-jackson:0.5.0',
        'dev.paseto:jpaseto-bouncy-castle:0.5.0'
```

**NOTE**: If you are not using Jackson or Bouncy Castle in your project, see the project's [readme](https://github.com/paseto-toolkit/jpaseto#installation) for other options.

Here's what token creation looks like using a fluid builder pattern:

```java
String token = Pasetos.V2.PUBLIC.builder()
                .setPrivateKey(privateKey)
                .setKeyId("my-kid")
                .setIssuer("https://my-service.example.com")
                .setAudience("blog-post")
                .claim("custom-claim", "a-value")
                .claim("1d20", new Random().nextInt(10) + 1)
                .compact();
```

If this looks familiar to you, that's because the PASETO specification has the same set of "registered" claims as the JWT spec and, of course, because it's JSON, you can add any additional claims.

Parsing a token is also similar. First, create a reusable parser:

```java
PasetoParser parser = Pasetos.parserBuilder()
                .setPublicKey(publicKey)
                .requireAudience("blog-post") // optional
                .build();
```

Finally, parse the token string. All of the validation is handled for you:

```java
Paseto paseto = parser.parse(token);

// get the custom claim from the token
int diceRole = paseto.claims.get("1d20");
```

# What's Next for PASETO?

Software bugs are inevitable; it's a fact of life in the software world. The more complex the code, the more likely there is an issue. This is doubly so with security. The JWT spec attempts to cover more use-cases than it should. This leads to complex code which, of course, leads to bugs and, in a security world, that means vulnerabilities. 

As security professionals, it falls on to us to help improve the security posture for everyone. PASETO isn't going to replace JWTs right away—JWT is a core part of the OpenID Connect specification after all. But...one of our goals at Okta is to help build the future of security, which is why we've invested in building out tools to support the PASETO specification.

If you're using PASETOs in any projects, we'd love to hear about it!

# Learn More About PASETO

This post has given you an introduction to the PASETO specification and demonstrated how easy and intuitive the JPaseto library is to use. If you want to learn more about security tokens in Java, check out some of our other posts below!

* [JPaseto GitHub Project](https://github.com/paseto-toolkit/jpaseto)
* [A Thorough Introduction to PASETO](/blog/2019/10/17/a-thorough-introduction-to-paseto)
* [Tutorial: Create and Verify JWTs in Java](/blog/2020/02/14/paseto-security-tokens-java)
* [Simple Token Authentication for Java Apps](/blog/2018/10/16/token-auth-for-java)

For more posts like this one, follow [@oktadev](https://twitter.com/oktadev) on Twitter and [LinkedIn](https://www.linkedin.com/company/oktadev/), or subscribe to [our YouTube channel](https://www.youtube.com/c/oktadev).