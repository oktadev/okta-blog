---
layout: blog_post
title: "Easy Access to Third-Party OAuth2 Protected Resources with Spring WebClient"
author: jimena-garbarino
by: contractor
communities: [java]
description: "Simplify third-party oauth2 services integration with Spring WebClient."
tags: [spring-webclient, integration-testing, webtestclient, testing, oauth2, mockwebserver]
tweets:
- ""
- ""
- ""
image:
type: conversion
---


-- introduction
-- Josh's Bootiful podcast and interview with Sam Brannen
-- Spring WebClient testing" and how powerful it is.



Provide the right hooks. Spring 5.3 MockMvc WebTestClient, testing application context or connecting to a server.
Is the test framework version for the reactive client.
Point to a real service. Supports both. Normal webtestclient, and mockmvc api, step verifier do assertions as with mock mvc.
Against application context.
Preferring that over mockmvc.
Reactive, don't use mockmvc anymore, static imports.
The new one is a fluent API.


-- Talk about WebClient
-- Talk about WebTestClient
-- Difference between WebClient and WebTestClient

WebTestClient since Spring Framework 5.0.
WebClient since Spring Framework 5.0.


In this tutorial, you will learn about:
- Secure the application with Okta OIDC Login
- Access a third-party OAuth2 protected service with Spring WebClient
- Integration testing for code that uses WebClient
- Security mocks in WebTestClient for authentication and the third-party authorization

**Prerequisites**:

- [HTTPie](https://httpie.io/)
- [Java 11+](https://openjdk.java.net/install/index.html)
- [Okta CLI](https://cli.okta.com)

**Table of Contents**{: .hide }
* Table of Contents
{:toc}


## Create a Secured Microservice with Okta Authentication


## Access an OAuth2 Third-Party Service with Spring WebClient

-- Explain defaultRegistrationId and defaultAuthorizedClient
-- Explain filter using request attributes and integration testing webtestclient attributes


## Spring WebClient Testing with MockWebServer

To test code that uses the WebClient, Spring Framework documentation recommends [OkHttp MockWebServer](https://github.com/square/okhttp#mockwebserver), in the WebClient chapter. This recommendation should also be included in the Integration Testing chapter, as only clients that use RestTemplate internally are mentioned.

-- Explain different approaches for integration testing when third party is involved.


Independent of how your user authenticates, you may have other client registrations that are in play for the request you are testing.

## Learn More
