---
disqus_thread_id: 7631649390
discourse_topic_id: 17137
discourse_comment_url: https://devforum.okta.com/t/17137
layout: blog_post
title: "Why Public Key Cryptography Matters"
author: william-dawson
by: internal-contributor
communities: [security]
description: "A quick look at public key cryptography, why it is important, and how it works."
tags: [security, cryptography]
tweets:
- "How does public key cryptography work? Check out our short article on the subject!"
- "Interested in #security? Read our short writeup on public key crypto:"
- "Public key cryptography is really useful. If you'd like to learn more about it, read our writeup on the subject:"
image: blog/why-public-key-cryptography-matters/public-key-encryption.png
type: awareness
---

40 years old and as relevant today as when it was first invented, public key cryptography is the unsung hero of modern cybersecurity. Most people take unknowing advantage of it many times a day. So what is it, and how does it work?

Let's start by reviewing the concept of symmetric encryption, which allows you to encrypt information using a shared secret key. It's not a modern idea—even Julius Caesar used it to code his messages!

Symmetric encryption allows two or more parties to securely exchange information with one another so long as all parties can securely share the same secret key (used to encrypt and decrypt the information). While this is a great approach for sharing information with a trusted partner who shares the key, what about communicating securely with someone you've never met, or who isn't in the same physical location as you are? How can you safely share an encryption key without it potentially being intercepted (not by enemies of Rome, but by online attackers)?

Asymmetric encryption, or public key cryptography, solves this problem by using two keys: one public and one private. Messages encrypted with the public key can only be decrypted with the private key and vice versa.

The keys are generated using an algorithm patented by the founders of RSA in 1977, which employs mathematical "trapdoor" functions. These functions can easily take several inputs to compute a result, but it is computationally difficult to reverse the math and find those inputs from a given result.

## Public Key Cryptography in Action

Let's say Alice wants to send a message to Bob. An attacker, Tom, is listening. Alice uses Bob's public key to encrypt her message (creating an encrypted message known as ciphertext) and sends it to him. Bob can then use his private key to decrypt the ciphertext (encrypted message), turning it back into the plaintext message.

{% img blog/why-public-key-cryptography-matters/public-key-encryption.png alt:"public key encryption" width:"800" %}{: .center-image }

Because they're public, Tom has access to both the ciphertext and Bob's public key. However, Tom doesn't know what Bob's secret key is because Bob keeps it a secret. Furthermore, the trapdoor function used to generate Bob's keys makes it computationally infeasible for Tom to determine Bob's private key (and subsequently, decrypt the message) given the information he has.

We just saw Alice successfully deliver a message that only Bob can read, but what if Bob needs to verify that it was Alice that sent the message instead of Tom? That's where the next piece of magic happens. Let's redo the transaction.

This time, Alice encrypts a message for Bob, but she does it using two keys: Bob's public key  and her own private key (more on this later). When Bob gets the message, he has to decrypt it using both his own private key and Alice's public key.

{% img blog/why-public-key-cryptography-matters/public-key-encryption-with-signing.png alt:"public key encryption with signing" width:"800" %}{: .center-image }

Because only Alice's private key could have encrypted a message that can be decrypted by her public key, and because Alice keeps her private key private, Bob knows that this message couldn't have come from anyone else. This is called a digital signature. When Alice uses her private key in addition to Bob's public key, she's creating a digital signature. By encrypting a message to Bob using both her private key and Bob's public key, Alice can generate a ciphertext for Bob that is both confidential **and** trusted.

## The Benefits of Public Key Cryptography

Public key cryptography has three main benefits:

- **Confidentiality**: Only Bob can read Alice's message.
- **Authenticity**: Alice can digitally "sign" her message, so Bob knows that only Alice could have sent it. He also knows Tom couldn't have tampered with the message in transit.
- **Non-repudiation**: Alice can't deny she wrote (or at least saw) the message contents later on.

These benefits have uncovered many applications for public key cryptography, from PGP and HTTPS to OIDC and WebAuthN. It's also used for secure shell certificates—enabling admins to connect to servers everywhere without remembering their passwords. At Okta, we use it in our own systems to verify encrypted sessions for our users.

## Challenges of Public Key Cryptography

There are some concerns that come with the continued use of public key encryption, including the administration of certificates. The digital keys used to encrypt and sign messages are packaged into digital certificates, which are issued by certificate authorities (CAs) — trusted hubs for verifying identities. This ecosystem is known as public key infrastructure (PKI).

Unfortunately, PKI has historically had its issues. For instance, Dutch CA DigitNotar went out of business after someone hacked its infrastructure and issued fraudulent certificates in 2011.

Another danger to public key cryptography is mathematic in nature. Trapdoor functions rely, in part, on the difficulty of factoring large prime numbers, which are used to create the keys. If someone found a way to easily find large prime numbers and then used that solution to solve the prime factorization problem, it would be catastrophic for public key cryptography.

For the time being, this isn't a short-term problem, but researchers are actively working on quantum computing, which will enable computers to accomplish that work by brute force. These machines promise to solve large math problems by testing every iteration of a problem concurrently rather than consecutively. The National Institute of Standards and Technology (NIST) is [already preparing for this](https://www.nist.gov/news-events/news/2019/01/nist-reveals-26-algorithms-advancing-post-quantum-crypto-semifinals), and will hopefully have a solution before the problem fully manifests.

Public key cryptography can be difficult to understand and implement from scratch, but, thankfully for developers, there are many libraries available to handle the heavy lifting. The famous [Networking and Cryptography Library (NaCl)](https://nacl.cr.yp.to/) provides an API called the [Box API](https://nacl.cr.yp.to/box.html) which makes handling public-key cryptography simple. You can find implementations of NaCl in all major programming languages. If you intend to implement public-key cryptography, please use either the NaCl or [libsodium](https://libsodium.gitbook.io/doc/) libraries as they are well vetted, thoroughly tested, actively maintained, and widely used.

## Learn More About Cryptography and App Security

For more history on the fascinating world of public key cryptography, Stephen Levy's book [Crypto](https://www.goodreads.com/book/show/984428.Crypto) is well worth a read. For a deeper, developer-focused dive into some of the technologies surrounding public key cryptography, consider these Okta developer resources:

* [Transport Layer Security](/books/api-security/tls/)
* [What the Heck is OAuth?](/blog/2017/06/21/what-the-heck-is-oauth)
* [Why JWTs Suck as Session Tokens](/blog/2017/08/17/why-jwts-suck-as-session-tokens)

Finally, be sure to follow us on [Twitter](https://twitter.com/oktadev), [YouTube](https://www.youtube.com/c/oktadev), and [Facebook](https://www.facebook.com/oktadevelopers/) if you'd like to see when we publish more articles like this. And please tell us what you'd like to us to write about next!

And, if you're in the mood to read through some other security articles, our new [security site](https://sec.okta.com/) has a bunch.
