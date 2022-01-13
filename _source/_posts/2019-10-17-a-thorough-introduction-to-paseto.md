---
disqus_thread_id: 7679004555
discourse_topic_id: 17156
discourse_comment_url: https://devforum.okta.com/t/17156
layout: blog_post
title: "A Thorough Introduction to PASETO"
author: randall-degges
by: advocate
communities: [security]
description: "An in-depth look at the successor to JSON Web Tokens: PASETO."
tags: [security, json-web-tokens, jwts, paseto, cryptography]
tweets:
- "Using JSON Web Tokens in your applications? If so, you'll definitely enjoy reading our new article on PASETO tokens!"
- "JSON Web Tokens vs PASETO -- @rdegges breaks it down for you in his recent article."
- "PASETO is a new type of token that aims to replace JSON Web Tokens. @rdegges did a great writeup on it. Be sure to check it out."
image: blog/a-thorough-introduction-to-paseto/an-introduction-to-paseto.png
type: awareness
---

Today I'm going to introduce you to one of my favorite pieces of security technology released in the last several years: **PASETO** (*platform-agnostic security tokens*). PASETO is a relatively new protocol, designed by [Scott Arciszewski](https://paragonie.com/) in early 2018 that is quickly gaining adoption in the security community.

While PASETO is still a young technology, I thought it'd be interesting to take an in-depth look at it, since it's both incredibly useful and solves a lot of security problems with the JOSE family of specifications (*including JSON Web Tokens*) that many people are familiar with.

If you're interested in learning more about PASETO, read on!

## What is PASETO?

[PASETO](https://paseto.io) is a new specification (*currently a draft RFC*) that allows you to create secure and stateless tokens that can be safely shared over the web.

Essentially, PASETO allows you to take JSON data and condense it into a single *token* you can easily share over the internet in a safe, tamperproof way. This is useful in a number of different circumstances.

If you've heard of JSON Web Tokens (JWTs) before, PASETOs are very similar. In fact, PASETO was developed as a simpler, more secure alternative to JWTs. The PASETO format is very similar to the JWT format, and the use cases are similar.

I like to think of PASETO as "JSON Web Tokens: The Good Parts". Sound familiar?

{% img "blog/a-thorough-introduction-to-paseto/json-web-tokens-the-good-parts.jpg" alt:"JSON Web Tokens: The Good Parts" width:"800" %}{: .center-image }

## PASETO Token Structure

PASETOs are really nothing more than simple, base64 encoded strings. Here's an example of what one looks like.

```
v2.local.sIgVm0es9uswZliPdyXOOi99czPbpl41KOUu45e62BvCaL5H3kHNibrbRZkM1-wW091ARzNexLY8g0GZA0-WCNsgs8GZLClEk5TJbgQjf__yExZRh2qMnqxfVr_KS9WoqKVlU-WrAG6TRUXZo43OSJQkeNBnB8Gq4rN2A8HYeA3ms20up80dgz2rpY79F9ILvPrAIzxNkDSE51vAxv50BTShuel3F3hXgReHsDv2PJCnMBnMyE_AfePxJ6WJ1obXSIUpSsOQX6wjwdQdOIcXZ853c-NPYMVU-abXJhhLVvvHyNZPi1wcEvjt.eyJraWQiOiAiMTIzNDUifQ
```

This PASETO was created from the following blob of JSON data.

```json
{
  "exp": "2019-10-09T13:59:13-07:00",
  "id": "59e5d078-8783-4c64-bed2-3c759e47b477",
  "name": "Randall Degges",
  "permissions": [
    "download:file-a.mp4",
    "download:file-b.mp4",
    "download:file-c.mp4"
  ]
}
```

The PASETO is broken up into three (*sometimes four*) sections that are period delimited.

The first section of the PASETO is the **protocol version** (`v2`). This tells you what version of the PASETO standard is being used. At the time of writing, there are two versions of the PASETO standard.

The second section of the PASETO is the **purpose** (`local`). PASETO only defines two *purposes* for tokens: `local` or `public`. I'll expand on these later. For now, just know that the `local` purpose is the one I'm demonstrating here.

The third section of the PASETO defines the actual token contents, also known as the **payload**:

```
sIgVm0es9uswZliPdyXOOi99czPbpl41KOUu45e62BvCaL5H3kHNibrbRZkM1-wW091ARzNexLY8g0GZA0-WCNsgs8GZLClEk5TJbgQjf__yExZRh2qMnqxfVr_KS9WoqKVlU-WrAG6TRUXZo43OSJQkeNBnB8Gq4rN2A8HYeA3ms20up80dgz2rpY79F9ILvPrAIzxNkDSE51vAxv50BTShuel3F3hXgReHsDv2PJCnMBnMyE_AfePxJ6WJ1obXSIUpSsOQX6wjwdQdOIcXZ853c-NPYMVU-abXJhhLVvvHyNZPi1wcEvjt
```

The payload is really nothing more than an encrypted blob of JSON data that you specify when the token is created. If you have the right key, you can decrypt it and view the original JSON data.

Finally, there's an optional fourth section of the PASETO called the **footer** (`eyJraWQiOiAiMTIzNDUifQ`). The footer can be used to store additional metadata, unencrypted. This is useful for scenarios where you may need to handle things like key rotation, etc. But we'll save that explanation for later.

If you put it all together, a PASETO has the following format.

```
version.purpose.payload.optional_footer
```

## How Do PASETOs Work?

Now that you know how PASETOs are composed, let's take a look at how PASETOs actually *work*.

As I mentioned above, you can use PASETOs for two different purposes: symmetric (*aka local*) and asymmetric (*aka public*). I'll explain how each type of PASETO works below, as they both function differently.

### How Local (Symmetric) PASETOs Work

Local PASETOs are always created and encrypted using a secret key (*think of this as a long password*).

A PASETO developer library will take JSON data you want to securely transmit and encrypt it using your secret key. The local PASETO can then be decrypted later using the same secret key you used to create it.

{% img "blog/a-thorough-introduction-to-paseto/create-local-paseto.png" alt:"How local PASETOs are created" width:"800" %}{: .center-image }

If anyone gets hold of the local PASETO token, they can't extract anything useful from it without having that secret key. As long as you keep your secret key safe, your PASETO is safe, even if it's shared publicly.

The way local PASETOs are created is relatively simple:

- A secure random function generates a random byte string
- The [blake2b](https://en.wikipedia.org/wiki/BLAKE_(hash_function)#BLAKE2) cryptographic hashing algorithm uses the random byte string as input to create a [nonce](https://en.wikipedia.org/wiki/Cryptographic_nonce). blake2b was chosen because it is much faster than other cryptographic hashing functions while remaining at *least* as secure as SHA-3 (*as well as being simple to use*). 
- The PASETO header (`v2.local`) is combined with the nonce and the footer (*if present*) to make a pre-authentication string
- The payload of the token (*all your JSON data*) is then encrypted using [XChaCha20-Poly1305](https://libsodium.gitbook.io/doc/secret-key_cryptography/aead/chacha20-poly1305/xchacha20-poly1305_construction) (*authenticated encryption*), using your secret key along with the pre-authentication string to ensure the integrity of your PASETO
- Finally, a token string is created of the form `v2.local.payload.optional_footer`

Once the token string has been created in step 5, you can safely share the token over any medium you want (publicly or privately over the internet) without any fear.

Because the token is encrypted, there won't be any way for attackers to see any of your payload data without your secret key. And because the token is authenticated, no attacker can modify your token without you knowing about it -- if you receive a modified token, when you attempt to *decrypt* it, you'll get an error due to failed authentication.

If you'd like to read the precise formula for minting a local PASETO, check out [the RFC](https://paseto.io/rfc/), which explains the process in great detail.

## How Public (Asymmetric) PASETOs Work

Public PASETOs are perfect for environments where you can't safely share a secret key with all parties involved in a transaction.

Public PASETOs are not encrypted (*since it is assumed you can't safely share a secret key between all parties that will be interacting with the PASETO*), but *are* digitally signed. This means that if an attacker gets a hold of your public PASETO, they'll be able to see all the data it contains but *won't* be able to modify it without you knowing about it thanks to the digital signatures PASETOs use.

If you attempt to verify a public PASETO that has been maliciously modified, you'll receive an error.

{% img "blog/a-thorough-introduction-to-paseto/create-public-paseto.png" alt:"How public PASETOs are created" width:"800" %}{: .center-image }

Here is how a public PASETO is created:

1. [libsodium](https://libsodium.gitbook.io/doc/) (*a highly recommended cryptography toolkit with a simple API*) is used to create a public/private key pair
2. The PASETO header (`v2.public`) is combined with the payload contents and footer into a pre-authentication string
3. This string is digitally signed by the private key using [Ed25519](https://ed25519.cr.yp.to/), a fast and secure public-key signature system
4. This is all packaged together into the PASETO string format: `v2.public.<signed string>.footer`

Once you've got the token string, you can safely share it with third parties without worrying about whether or not attackers will be able to modify it.

Once your token has been created, you can also share your public key with any parties who would like to validate this token. Anyone who has a copy of your public key (*which you can share freely*) will be able to verify the validity of this token.

### How PASETO Claims Work

Much like JSON Web Tokens, PASETOs may also contain *claims*. Claims, in short, are just JSON keys.

For example, let's say you create a PASETO from the following JSON blob.

```json
{
  "eyeColor": "brown",
  "height": "6'0",
  "weight": "220lbs"
}
```

In this example, `eyeColor`, `height`, and `weight` are *claims* in your token.

The PASETO standard defines several reserved claims that you cannot use for any purpose other than their official purposes. These claims are as follows (*this is taken directly from the [PASETO RFC](https://paseto.io/rfc/)*).

```
+-----+------------+--------+-------------------------------------+
| Key |    Name    |  Type  |               Example               |
+-----+------------+--------+-------------------------------------+
| iss |   Issuer   | string |       {"iss":"paragonie.com"}       |
| sub |  Subject   | string |            {"sub":"test"}           |
| aud |  Audience  | string |       {"aud":"pie-hosted.com"}      |
| exp | Expiration | DtTime | {"exp":"2039-01-01T00:00:00+00:00"} |
| nbf | Not Before | DtTime | {"nbf":"2038-04-01T00:00:00+00:00"} |
| iat | Issued At  | DtTime | {"iat":"2038-03-17T00:00:00+00:00"} |
| jti |  Token ID  | string |  {"jti":"87IFSGFgPNtQNNuw0AtuLttP"} |
| kid |   Key-ID   | string |    {"kid":"stored-in-the-footer"}   |
+-----+------------+--------+-------------------------------------+
```

These claims have special purposes and PASETO implementations allow you to use them to accomplish useful feats.

For example, when creating a PASETO, you can choose how long the PASETO will remain valid. When you do this, implementations will compute both an *Issued At* time as well as an *Expiration* time and assign those values to the `iat` and `exp` claims in your token, respectively.

This allows you to define how long a token should remain valid in a straightforward way.

> **NOTE**: When creating tokens, always consider the security model of your application before choosing an expiration time. Tokens should only be valid for a short time window to prevent potential abuse. **The longer a token is allowed to remain valid, the more opportunity for abuse you have.**

## What Problems Do PASETOs Solve?

PASETOs are designed as single-use tokens, meant to be used to securely transmit JSON data over the web. If you have some JSON data you need to securely transmit over insecure channels, PASETO should be able to help you.

Because PASETOs solve two different problems, I'll outline each in subsections below.

### Problems Local PASETOs Solve

As mentioned earlier, you should use local PASETOs in scenarios in which you can safely store a shared secret key.

For example, let's say you're building a web application that allows users to purchase and download video files. Your web application might consist of two separate services: a website that powers user and purchase flows, and a download service that allows users to download files they've paid for.

In this scenario, both your website and download service run on a server-side backend that can safely store a shared secret key (*maybe in environment variables or other isolated, private locations*).

When a user purchases a video file, your website will generate a local PASETO token that includes details about the user's purchase:

- The purchase ID
- The video file that was purchased
- The timestamp
- Etc.

The website will then redirect the user's browser to the download service with the PASETO in a URL parameter (e.g., `https://download.example.com?token=v2.local.xxx?file=video1.mp4`). The download service will then receive this request, parse the `token` parameter out of the URL, and decrypt the local PASETO. The download service will then be able to validate the purchase ID and allow the user to download the file specified in query string parameters, assuming the PASETO allows it.

{% img "blog/a-thorough-introduction-to-paseto/how-to-use-local-pasetos.gif" alt:"How to use local PASETOs" width:"800" %}{: .center-image }

This system works because both of the services touching the PASETO can safely share a secret key.

### Problems Public PASETOs Solve

The ideal use case for public PASETOs is to transmit JSON data in such a way that other people can tell the JSON data was created by you. As it turns out, this is a problem that's particularly relevant in the web authentication world.

Let's say you're building and securing a website using a protocol like [OpenID Connect](/blog/2017/07/25/oidc-primer-part-1). In this scenario, you have:

- A user
- A website that a user wants to log into
- An authorization server that controls user logins and permissions

The way authentication might work using public PASETOs in this flow is as follows.

1. A user visits the website and clicks login
2. The user is redirected to the authorization server to log in (`https://id.example.com/login`)
3. The user enters their credentials into a web form to authenticate
4. The authorization server validates the user's credentials and creates a public PASETO using a private key that only the authorization server has access to. This PASETO will include a claim that provides a user identifier.
5. The authorization server then redirects the user to the website with the public PASETO as a URL parameter (`https://example.com/dashboard?token=v2.public.xxx`)
6. The website receives the user's request for the dashboard page and parses the PASETO out of the `token` URL parameter
7. The website validates the PASETO and then creates a long-lived session for the user using secure cookies and standard server-side session management flows
8. The user is now authenticated into the website using a PASETO to make the authentication flow possible

{% img "blog/a-thorough-introduction-to-paseto/how-to-use-public-pasetos.gif" alt:"How to use public PASETOs" width:"800" %}{: .center-image }

In this example, please note that the PASETO above is **only being used once**: to inform the website that the user has successfully authenticated via the authorization server. The other thing to note is that this flow only works because the website will have access to the authorization server's **public key**. This public key is *required* in order for the website to verify the validity of the PASETO sent to it by the authorization server.

When the user's session expires and the user needs to re-authenticate, the website will then redirect the user back to the authorization server to be re-authenticated.

### An Important Use Case PASETOs Do Not Solve

While PASETOs are useful in a number of different situations, I wanted to explicitly call out one use case that PASETOs are specifically designed *not* to solve.

**PASETOs are *not* designed to be reusable tokens.**

PASETOs should only be used once as they have no built-in mechanism for preventing [replay attacks](https://en.wikipedia.org/wiki/Replay_attack). If an attacker is able to get a hold of a valid PASETO and can use it to make valid requests multiple times then you aren't using PASETOs correctly.

In particular, this means that you should *not* use PASETOs as long-lived access tokens in web authentication flows.

For example, many developers rely on token-based authentication flows that work something like this:

- A user sends their username and password to a website
- The website validates the user's credentials
- The website generates a JSON Web Token that contains the user's information and expires in one day
- The user then stores the JWT in the browser
- When the user makes subsequent requests to the website, the user sends this JWT to the website to identify itself
- The website parses out the JWT, validates it locally (makes sure it hasn't been tampered with and isn't expired), then allows the request to be completed

In this flow, the website uses the JWT as identity proof for the user **multiple times** (*it's used every time the user needs to make another request to the website*).

This is a scenario in which you would *not* want to use a PASETO, as there is no way to prevent an attacker who has the PASETO (*or JWT for that matter*) from using it themselves to impersonate the user or cause other security issues.

Many developers implement the authentication pattern above as a way to speed up their applications by removing the need to perform server-side session management, but this comes at great risk for abuse.

## How Should You Use PASETOs?

To get started using PASETOs in your applications, take a look at [the PASETO website](https://paseto.io), which lists various open-source libraries you can use to work with the PASETO standard.

The reference implementation is built in PHP, but you can currently choose from 15 available libraries. I've written some examples showing you how to create and verify PASETOs in Python below using the [pypaseto](https://github.com/rlittlefield/pypaseto) library.

I've specifically chosen to show examples in Python because Python code is universally readable and easy to understand. It's essentially just executable pseudocode! =) These examples should give you a basic idea of how to work with PASETOs and use them in your applications.

{% img "blog/a-thorough-introduction-to-paseto/python-is-pseudocode.jpg" alt:"Python is pseudocode" width:"400" %}{: .center-image }

### How to Use Local PASETOs

To start, let's take a look at how you can create a local PASETO. Please note that I'm generating the secret key below using a *secure* random number generator based on [`/dev/urandom`](https://unix.stackexchange.com/questions/324209/when-to-use-dev-random-vs-dev-urandom).

```python
import json
import secrets
import uuid

import paseto


# Create a secure + random encryption key
key = secrets.token_bytes(32)

# Amount of time (in seconds) this token should be valid for
ttl = 60 * 5

# JSON data to securely transmit
data = {
    'id': str(uuid.uuid4()),
    'name': 'Randall Degges',
    'permissions': [
        'download:file-a.mp4',
        'download:file-b.mp4',
        'download:file-c.mp4'
    ]
}

# Create a new PASETO.
#
# `token` can be safely shared in URL params over the internet safely as
# it is a base64 encoded string. The `token` value is encrypted.
token = paseto.create(
    key=key,
    purpose='local',
    claims=data,
    footer={
        'kid': '12345'
    },
    exp_seconds=ttl
)

print(f'''
Token Data
~~~~~~~~~~

{json.dumps(data, indent=2)}

PASETO
~~~~~~

{token.decode("utf-8")}
''')
```

If you were to run the code sample above, you'd see the following output.

```console
Token Data
~~~~~~~~~~

{
  "id": "b4c0a96c-554d-4222-ac74-63b97c854b9f",
  "name": "Randall Degges",
  "permissions": [
    "download:file-a.mp4",
    "download:file-b.mp4",
    "download:file-c.mp4"
  ],
  "exp": "2019-10-10T09:08:50-07:00"
}

PASETO
~~~~~~

v2.local.vB7daJlQOL5sY8mQa_FWb6ZYbkNi8yeRqI-DCFNEPTYEu7ItQHMMM5jzD_fw-G7l-AXJRBj3E9jxx9-JS5eG436WGUn03zYp2nuV3PVqppEyRP9LoZ1TTBREhR182NRcNYqUkM8FfazWegWcLc1gSzFXx0Kge4U7XHtAlliTrR8p09hH6qVpqAsgMdp00ao66JX_mxlEjkL3y784CoAK-gyy_ZZ1WzAvYAjQApl859RxnB9uLMpb-VURmetmrw9sC_Iw27to46ulTcMxx_KoSBem9eSG5M4bvNQC5YFeDLIM2HXDf35YIo50.eyJraWQiOiAiMTIzNDUifQ
```

The resulting PASETO string contains the JSON data, encrypted, and will only be valid for five minutes. If I were to attempt to validate this PASETO six minutes after creating it, the process would fail as the expiration time has passed.

Now that I've created this PASETO, let's take a look at how it can be decrypted back into its original JSON form.

```python
# Given a PASETO token and the secret key from before, we can decrypt it and
# transform the PASETO string back into a token object
parsed = paseto.parse(
    key=key,
    purpose='local',
    token=token
)

# Convert the token object into a human-friendly form for printing
token_string = json.dumps(parsed['message'], indent=2)

# Display the PASETO token in JSON format
print(f'''
Expanded PASETO
~~~~~~~~~~~~~~~

{token_string}

PASETO Footer
~~~~~~~~~~~~~

{json.dumps(parsed['footer'], indent=2)}
''')
```

If you run the code above, you should see the following output.

```
Expanded PASETO
~~~~~~~~~~~~~~~

{
  "id": "a8589a9b-2458-4a45-8bc4-be6db41f3659",
  "name": "Randall Degges",
  "permissions": [
    "download:file-a.mp4",
    "download:file-b.mp4",
    "download:file-c.mp4"
  ],
  "exp": "2019-10-10T09:19:40-07:00"
}

PASETO Footer
~~~~~~~~~~~~~

{
  "kid": "12345"
}
```

In this case, the PASETO decryption worked great, as the correct secret key was used and the expiration time hadn't yet passed.

If you try to decrypt an expired PASETO, you'll receive an exception like the following.

```python
Traceback (most recent call last):
  File "test.py", line 60, in <module>
    token=token
  File "/home/rdegges/.pyenv/versions/paseto/lib/python3.7/site-packages/paseto.py", line 314, in parse
    raise PasetoTokenExpired('token expired')
paseto.PasetoTokenExpired: token expired
```

Similarly, if you try to decrypt a PASETO using an invalid key, you'll receive an error.

### How to Use Public PASETOs

Now that you've seen how to work with local PASETOs, let's take a look at public PASETOs and how to work with them.

Here's a small example app that creates a new public/private key pair, then mints a new PASETO using the private key. Note, the public/private key pair is being generated using [libsodium](https://github.com/stef/pysodium).

```python
import json
import secrets
import uuid

import paseto
import pysodium


# Create a secure public/private keypair using libsodium
#
# - `pk` is the public key
# - `sk` is the secret (private) key
pk, sk = pysodium.crypto_sign_keypair()

# Amount of time (in seconds) this token should be valid for
ttl = 60 * 5

# JSON data to securely transmit
data = {
    'id': str(uuid.uuid4()),
    'name': 'Randall Degges'
}

# Create a new PASETO.
#
# `token` can be safely shared in URL params over over the internet safely as
# it is a base64 encoded string. The `token` value is NOT encrypted here, but it
# is cryptographically signed.
token = paseto.create(
    key=sk,
    purpose='public',
    claims=data,
    footer={
        'kid': '12345'
    },
    exp_seconds=ttl
)

print(f'''
Token Data
~~~~~~~~~~

{json.dumps(data, indent=2)}

PASETO
~~~~~~

{token.decode("utf-8")}
''')
```

If you run this program, you'll see the following output.

```
Token Data
~~~~~~~~~~

{
  "id": "410df296-89d5-4380-8423-6f2d73040744",
  "name": "Randall Degges",
  "exp": "2019-10-10T11:03:24-07:00"
}

PASETO
~~~~~~

v2.public.eyJpZCI6ICI0MTBkZjI5Ni04OWQ1LTQzODAtODQyMy02ZjJkNzMwNDA3NDQiLCAibmFtZSI6ICJSYW5kYWxsIERlZ2dlcyIsICJleHAiOiAiMjAxOS0xMC0xMFQxMTowMzoyNC0wNzowMCJ9xe6hZBYn8IZoJmgL9k1VjTcl7Dz4T-lo2FvIxeFXQNtNY3QAyCaa5XW-29n-9nV-beU6z7P-YF97lPFvnPfnDA.eyJraWQiOiAiMTIzNDUifQ
```

Notice that this time, the PASETO header is `v2.public`. This lets you easily identify the type of PASETO you're working with.

Now that you've generated a public PASETO, how do you verify the data it contains? Let's take a look!

```python
# Given a PASETO token and the public key from before, we can validate that this
# token was generated by the owner of the secret key and that the data it
# contains hasn't been tampered with.
parsed = paseto.parse(
    key=pk,
    purpose='public',
    token=token
)

# Convert the token object into a human-friendly form for printing
token_string = json.dumps(parsed['message'], indent=2)

# Display the PASETO token in JSON format
print(f'''
Expanded PASETO
~~~~~~~~~~~~~~~

{token_string}

PASETO Footer
~~~~~~~~~~~~~

{json.dumps(parsed['footer'], indent=2)}
''')
```

If you run the program above, you will see the following output.

```
Expanded PASETO
~~~~~~~~~~~~~~~

{
  "id": "c4454652-95a1-4639-804c-2f7615a4c027",
  "name": "Randall Degges",
  "exp": "2019-10-10T11:04:35-07:00"
}

PASETO Footer
~~~~~~~~~~~~~

{
  "kid": "12345"
}
```

As you can see, creating and validating public PASETOs isn't difficult.

The main thing to keep in mind when working with public PASETOs is that all the data you put into the public PASETO will be visible to *everyone*, including attackers. Public PASETOs are *not* encrypted, only signed.

Because of this, you should never store sensitive information in a PASETO that you wouldn't feel comfortable showing up on the front page of Reddit. =)

## Why Are PASETOs Better Than JSON Web Tokens?

{% img "blog/a-thorough-introduction-to-paseto/confused-stick-figure.jpg" alt:"Confused stick figure" width:"200" %}{: .center-image }

At this point, you may be wondering why, if PASETOs are so similar to JSON Web Tokens (JWTs), do they even exist?

As I mentioned near the start of this article, PASETOs were actually designed to work around various issues in the JWT specification. In particular, the cryptography and security communities have lambasted JWTs for:

- [Being widely misused](http://cryto.net/~joepie91/blog/2016/06/13/stop-using-jwt-for-sessions/) in ways that impact web security
- Forcing implementations to [strictly adhere](https://tools.ietf.org/html/rfc7515#section-4.1.1) to processing the `alg` header. This allows attackers to modify the `alg` value and change the signature verification method to something different than what was originally intended, thereby making token forging a real possibility.
- Allowing [poor cryptography choices](https://paragonie.com/blog/2017/03/jwt-json-web-tokens-is-bad-standard-that-everyone-should-avoid) in the JSON Web Encryption specification (JWE) that allow attackers to attack encrypted tokens in a variety of ways.

To sum it up at a high level, the JOSE specifications (which include JWT, JWE, JSON Web Signatures, etc.) are extremely flexible specifications that force developers to make lots of low-level security and cryptography choices that can cause catastrophic security issues.

The PASETO specification and implementations were [designed to address](https://paragonie.com/blog/2018/03/paseto-platform-agnostic-security-tokens-is-secure-alternative-jose-standards-jwt-etc) each of these criticisms.

PASETO takes a developer-first approach to security tokens by consolidating developer choices down to two purposes: do you need a symmetric or asymmetric security model? Based on what you choose, PASETO picks the best possible choices for authenticated encryption and digital signatures to ensure your tokens stay secure and aren't subject to cryptographic vulnerabilities.

The PASETO specification also clearly defines how PASETOs *should* and *should not* be used in an effort to reduce misuse of PASETO tokens in ways people currently misuse JWTs.

Overall, I'm a huge fan of PASETO technology and see a lot of potential in its adoption and usage. At Okta, we're currently working on some PASETO-focused projects that we hope to release in the coming months to help make PASETO technology more widespread. While we do still use JSON Web Tokens in our product, we're also working on open standards to help make JSON Web Token usage safer. Our hope isthat by tackling the problem from all angles we'll be able to improve token security on the web for everyone.

Have any thoughts, comments, or suggestions? Please leave a comment below or hit us up on [Twitter](https://twitter.com/oktadev)! And, if you'd like to read some of our other security-focused content, please check out some of these pieces.

- [The Hardest Thing About Data Encryption](/blog/2019/07/25/the-hardest-thing-about-data-encryption)
- [Why Public Key Cryptography Matters](/blog/2019/09/12/why-public-key-cryptography-matters)

Or visit our new [security site](https://sec.okta.com/) where we're publishing lots of in-depth security articles.
