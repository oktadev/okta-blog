---
layout: blog_post
title: The Rails Guide to Securing an API
author: andrew-van-beek
by: internal-contributor
communities: [ruby]
description: "Learn how to easily secure your Ruby On Rails API with Okta."
tags: [ruby, rails, auth, api, security]
tweets:
- "Easily add authentication to your @rails APIs using @oktadev <3"
- "Need a simpler way secure your @rails APIs? Try @oktadev! We just published an article on this very topic"
- "Wire your @rails APIs more securely by using @oktadev. Check out this guide!"
image: blog/rubyonrails6/railstrain.png
type: conversion
---

In this tutorial we are going down a different track then our last [Ruby Post](/blog/2020/09/25/easy-auth-ruby-on-rails-6-login) (bad pun intended). Instead diving into building a very simple API that, of course, we will secure with access tokens minted by our very own Okta OAuth server. We’ll make requests to this API via Postman to keep things nice and simple. Now let’s get chugging along. (OK, that’s the last pun for a bit.)

Prerequisites for this blog post include:

- Postman or PostmanCanary
- A text editor (I am using [VS Code](https://code.visualstudio.com/) in my examples)
- [Rails 6](https://github.com/rails/rails)
- An [Okta Developer Account](https://developer.okta.com/) (free forever, to handle your OAuth needs)

Now let's get started!
