---
disqus_thread_id: 7762556532
discourse_topic_id: 17183
discourse_comment_url: https://devforum.okta.com/t/17183
layout: blog_post
title: "OAuth 2.1: How Many RFCs Does it Take to Change a Lightbulb?"
author: lee-mcgovern
by: external-contributor
communities: [security]
description: "The OAuth 2.0 specificiation is a maze of documentation that developers need to understand when getting started on the topic. OAuth 2.1 can help fix this!"
tags: [oauth, oauth2, rfc, spec]
tweets:
- "OAuth 2.1: How Many RFCs Does it Take to Change a Lightbulb?"
- "The OAuth working group is rolling the latest recommendations and best practices into a new spec: OAuth 2.1"
- "Here comes #OAuth 2.1!"
image: blog/oauth-2-1-how-many-rfcs/oauth-maze.png
type: awareness
---

The OAuth working group agreed last month in Singapore ([IETF 106](https://oauth.net/events/2019-11-ietf106/)) that work will begin to update the current OAuth 2.0 Framework to a potential version 2.1 encompassing all the latest recommendations and best practices around the specification. This is in part due to the maze of documentation that developers need to understand when getting started on the topic to choose the correct flow and implement the best security posture for their application landscape.

{% img blog/oauth-2-1-how-many-rfcs/oauth-maze.png alt:"OAuth maze" width:"100%" %}{: .center-image }

By consolidating the most recent [Best Current Practice](https://oauth.net/2/oauth-best-practice/) (which is in a last call review stage) into a new 2.1 version of the framework it is hoped that developers have a single place where they can refer to digest the latest documentation and spend more time coding the underlying application. Although there is still some debate about the exact form of the new consolidated specification, it is a positive step for the development community that there is a commitment now to work towards some simplification.

## What's Changing in OAuth 2.1?

The biggest changes since the original RFC6749 specification was published in 2012 are that [implicit flow](/blog/2019/05/01/is-the-oauth-implicit-flow-dead) and resource owner password flow are now deprecated. Other flows introduced later such as Authorization Code Flow with PKCE (RFC7636) are now replacing the initial recommendations for certain use cases and additional security countermeasures to protect against CSRF type attacks and redirect based flows recommendations have offered a solution to avoid incidents such as the [Azure account takeover vulnerability](https://threatpost.com/microsoft-oauth-flaw-azure-takeover/150737/).

Okta has already implemented the proof key code exchange recommendations for single page apps as well as only allowing explicit pre-registered redirect URIs.

{% img blog/oauth-2-1-how-many-rfcs/okta-pkce.png alt:"Screenshot showing PKCE support for single page apps" width:"600" %}{: .center-image }

You can learn more about the specifics of the OAuth 2.1 proposal by reading Aaron Parecki's post [It's Time for OAuth 2.1](https://aaronparecki.com/2019/12/12/21/its-time-for-oauth-2-dot-1).

## Will there be an OAuth 3.0?

There is also work beginning on a potential [OAuth 3.0](https://oauth.net/3/) specification by several people in the OAuth working group. While it's likely that these RFCs wouldn't be available in the short term and the implementation by authorization server vendors such as Okta would occur at some point in the future, it is interesting to stay up to date on what kinds of rich authorization data models could be used by developers and underlying applications in the future.

## Learn More about OAuth

If you'd like to learn more about OAuth, check out these other resources from our blog!
* [Is the OAuth 2.0 Implicit Flow Dead?](/blog/2019/05/01/is-the-oauth-implicit-flow-dead)
* [What's Going On with the OAuth 2.0 Implicit Flow?](https://www.youtube.com/watch?v=CHzERullHe8) (video)
* [7 Ways an OAuth Access Token is like a Hotel Key Card](/blog/2019/06/05/seven-ways-an-oauth-access-token-is-like-a-hotel-key-card)
* [Why OAuth API Keys and Secrets Aren't Safe in Mobile Apps](/blog/2019/01/22/oauth-api-keys-arent-safe-in-mobile-apps)
* [Implement the OAuth 2.0 Authorization Code with PKCE flow](/blog/2019/08/22/okta-authjs-pkce/)

Like what you learned today? Follow us on [Twitter](https://twitter.com/oktadev) and subscribe to our [YouTube channel](https://www.youtube.com/oktadev) for more awesome content!
