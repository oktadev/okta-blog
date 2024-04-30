---
layout: blog_post
title: "Fine Grained Authorization (FGA) in a Spring Boot API"
author: jimena-garbarino
by: contractor
communities: [security,java]
description: "How to add Fine Grained Authorization (FGA) to a Spring Boot API using the OpenFGA Spring Boot starter"
tags: []
tweets:
- ""
- ""
- ""
image:
type: awareness
---

- INTRO

> **This tutorial was created with the following tools and services**:
> - [Java OpenJDK 21](https://jdk.java.net/java-se-ri/21)
> - [Auth0 account](https://auth0.com/signup)
> - [Auth0 CLI 1.4.0](https://github.com/auth0/auth0-cli#installation)
> - [Docker 24.0.7](https://docs.docker.com/desktop/)
> - [OpenFGA Server 1.5.1](https://hub.docker.com/r/openfga/openfga)
> - [FGA CLI v0.2.7](https://openfga.dev/docs/getting-started/cli)

{% include toc.md %}

## Add security with Auth0 and Okta Spring Boot starter

- ADD OKTA SPRING BOOT STARTER
- AUTH0 CONFIGURATION
- AUTH0 TEST TOKEN
- CURL TESTS

## Design an authorization model

- MODEL DESCRIPTION
- MODEL CONVERSION FROM DSL TO JSON

## Add fine grained authorization (FGA) with OpenFGA

- ADD OPENFGA SPRING BOOT STARTER
- SERVICE LAYER
- OPENFGA SERVER INITIALIZER
- INTEGRATION TESTING WITH TESTCONTAINERS

## Running the Spring Boot API

- DOCKER COMPOSE FOR OPENFGA
- AUTH0 TEST TOKEN
- CURL TESTS

## Learn more about fine grained authorization with OpenFGA and Spring Boot

- RECAP CLOSING


If you liked this post, you might enjoy these related posts:

- [Deploy Secure Spring Boot Microservices on Amazon EKS Using Terraform and Kubernetes](https://auth0.com/blog/terraform-eks-java-microservices/)
- [Get started with Spring Boot and Auth0](https://auth0.com/blog/get-started-with-okta-spring-boot-starter/)
- [Build a Beautiful CRUD App with Spring Boot and Angular](https://auth0.com/blog/spring-boot-angular-crud/)
- [Get Started with Jetty, Java, and OAuth](https://auth0.com/blog/java-jetty-oauth/)

Check out the Spring Boot resources in our Developer Center:

- [Authorization in Spring Boot](https://developer.auth0.com/resources/labs/authorization/spring-resource-server)
- [Authentication in Spring Boot](https://developer.auth0.com/resources/labs/authentication/spring)
- [Role Based Access Control in Spring Boot](https://developer.auth0.com/resources/labs/authorization/rbac-in-spring-boot)
- [Build and Secure Spring Boot Microservices](https://developer.auth0.com/resources/labs/authorization/securing-spring-boot-microservices)
- [Spring MVC Code Sample: Basic Authentication](https://developer.auth0.com/resources/code-samples/web-app/spring/basic-authentication)

Please follow us on Twitter [@oktadev](https://twitter.com/oktadev) and subscribe to our [YouTube channel](https://www.youtube.com/oktadev) for more Spring Boot and microservices knowledge.

You can also sign up for our [developer newsletter](https://a0.to/nl-signup/java) to stay updated on everything Identity and Security.
