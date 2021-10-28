---
disqus_thread_id: 8453104297
discourse_topic_id: 16803
discourse_comment_url: https://devforum.okta.com/t/16803
layout: blog_post
title: 'Use Kong Gateway to Centralize Authentication'
author: micah-silverman
by: advocate
communities: [java]
description: "You know that sci-fi movie trope in which you have a centralized hub that jumps you to other places in the galaxy? It's the same with Kong (and other API gateways)."
tags: [kong, api-gateway, api, gateway, spring, spring-boot]
type: conversion
---

A customer once asked me: "Hey – Can Okta integrate with Kong?" Spoiler alert: You totally *can* integrate Kong with Okta using its [OpenID Connect](https://github.com/nokia/kong-oidc) plugin.

Still stuck wondering what an API gateway even is? Here's a metaphor that works for me: You know that sci-fi movie trope in which you have a centralized hub that "jumps" you to other places in the galaxy? In that kind of system all the screening and security happens at the hub. It's the same with Kong (and other API gateways).

In the case of the OIDC plugin, only Kong speaks directly to Okta using the [Authorization Code flow](https://tools.ietf.org/html/rfc6749#section-4.1). It then passes the contents of the [ID Token](http://openid.net/specs/openid-connect-core-1_0.html#CodeIDToken) to an internal service using an HTTP header called `x-userinfo`. Your app just needs to know what to do with this HTTP header. It doesn't have to do anything with OIDC itself.

This is easier to understand with some diagrams. Here's what an architecture might look like without an API Gateway:

{% img blog/use-kong-gateway-to-centralize-authentication/NoKong.png alt:"No Kong" width:"700" %}{: .center-image }

While you may have a load balancer sitting in front of everything acting as a "traffic cop", each of your services has to know how to "speak" OIDC.

Here's another diagram with an API Gateway in the mix:

{% img blog/use-kong-gateway-to-centralize-authentication/WithKong.png alt:"With Kong" width:"700" %}{: .center-image }

In this case, *only* the Kong API gateway is interacting with Okta. Kong then passes the `x-userinfo` header along after the user authenticates. This enables your services to be a lot leaner – no OIDC stack needed.

I created a screencast based on [this working example](https://github.com/oktadeveloper/okta-kong-origin-example).

<div style="text-align: center; margin-bottom: 1.25rem">
  <iframe width="700" height="394" style="max-width: 100%" src="https://www.youtube.com/embed/G7hF017s1X8" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</div>

In this demo, I use [Docker](https://www.docker.com/) to create a container for Kong and another for a [Spring Boot](https://projects.spring.io/spring-boot/) app that understands the `x-userinfo` HTTP header.

The slides used in the screencast [can be found on GitHub](https://github.com/dogeared/centralize-auth-with-kong-and-okta).
