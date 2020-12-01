---
layout: blog_post
title: "Five Open Source Projects We're Thankful For In 2020"
author: lee-brandt
by: advocate
communities: [devops]
description: "A list of five open source projects that the Okta Developer Relations team is thankful for."
tags: [oss]
tweets:
- "Here are five open source projects that we're thankful for."
- "Happy Thanksgiving! Here are some open source projects to be thankful for."
- "For Thanksgiving 2020, we're listing five open source projects that we are thankful for."
image: blog/featured/okta-angular-headphones.jpg
type: awareness
---

As developers, we love open source projects. It can be an easy way to get functionality into your application without having to write it yourself. Plus, it feels good to send a pull request to fix a bug or add a feature. This year for Thanksgiving, the team thought we would list some of the open source projects that we are thankful for.

## JHipster

[JHipster](https://www.jhipster.tech/) is a library for generating and deploying modern web applications and microservice architectures. While it was started as a Java API + Angular front-end application generator, it has since become a "super-generator" by being able to generate Spring Boot, Micronaut, Quarkus, Node.js, and .NET with front ends in Angular, React, or Vue (among others). Definitely worth giving a look if you're starting a new application and you want to get it started off on the right foot with some hard-learned best practices.

## Oh My Zsh

Despite tendencies to shy away from command line work, developers may still find themselves spending a lot of time in a terminal shell. [Oh My Zsh](https://ohmyz.sh/) has become one of the most popular libraries for configuring the [Zsh](http://zsh.sourceforge.net/). It brings a LOT of extras, like customizing your command prompt and adding pre-packaged alias commands. I tend to use the git command aliases (like `gco` for `git checkout`) quite a bit.

## HTTPie

This command-line HTTP client surpasses others by supporting things like JSON, syntax highlighting, and plugins. It may not be the sexiest project on our list, but it has almost 50k stars on GitHub (as of this post) and lots of watchers and forks. If you find yourself using `curl` or `wget` commands a lot, you'll love [HTTPie](https://httpie.io/). 

## JPaseto

We all know that [JWT]() has become a widely-adopted standard for sending security claims, but the JWT spec is also pretty loose on what cryptographic algorithm to use— even allowing for none at all. PASETOs, on the other hand, are more cryptographically resilient and easier to deploy because they are always symmetrically encrypted with a shared secret key. There aren't a lot of libraries for creating and verifying PASETO tokens like there are for JWTs. JPaseto is a JVM-based library for creating and verifying PASETO tokens. 

## PList Watch

The dark horse from our list, [PList Watch](https://github.com/catilac/plistwatch),  is a library that watches for preference changes on macOS and has a running log of the commands you could run on a Mac to set the preference that changed recently. Running the command looks something like this:

{% img blog/open-source-thankful/plist-run.png alt:"plist Running" width:"700" %}{: .center-image }

## What are YOU Thankful For?

What are YOUR favorite open source projects? It could be a command-line tool, a programming library, or an application that you think helps you with your development efforts. Leave a comment below. Also, check out some of our other great posts:

* [Build a secure GraphQL API with Node.js](/blog/2020/11/18/build-a-graphql-nodejs-api)
* [A Quick Guide to Security with Vaadin Fusion and Spring Boot](/blog/2020/11/09/vaadin-spring-boot)
* [Protecting a Laravel API with JWT](/blog/2020/11/04/protecting-a-laravel-api-with-jwt)

And don't forget to follow us on [Twitter](https://twitter.com/oktadev) and subscribe to our [YouTube](https://www.youtube.com/c/oktadev) channel for more great developer content!
