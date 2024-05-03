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

This guide will teach you how to secure a Spring document API with Okta and integrate Fine Grained Authorization (FGA) to the document operations.

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

Start by doing a checkout of the document API repository, which already implements basic request handling:

```shell
git clone https://github.com/indiepopart/spring-api-fga.git
```

The repository contains two project folders, `start` and `final`. The bare bones document API is a Gradle project in the `start` folder, open it with your favorite IDE.

Sign up at [Auth0](https://auth0.com/signup) and install the [Auth0 CLI](https://github.com/auth0/auth0-cli). Then in the command line run:

```shell
auth0 login
```

The command output will display a device confirmation code and open a browser session to activate the device.

You don't need to create a client application at Auth0 for your API if not using opaque tokens. But you must register the API within your tenant, you can do it using Auth0 CLI:

```shell
auth0 apis create \
  --name "Document API" \
  --identifier https://document-api.okta.com \
  --offline-access=false
```

Leave scopes empty. Add the `okta-spring-boot-starter` dependency:

```groovy
// build.gradle
dependencies {
    ...
    implementation 'com.okta.spring:okta-spring-boot-starter:3.0.6'
    ...
}
```
As the `document-api` must be configured as an OAuth2 resource server, add the following properties:

```yml
# application.yml
okta:
  oauth2:
    issuer: https://<your-auth0-domain>/
    audience: https://document-api.okta.com
```

You can find your Auth0 domain with the following Auth0 CLI command:

```shell
auth0 tenants list
```

Run the API with:

```shell
./gradlew bootRun
```

Test the API authorization with curl:

```shell
curl -i localhost:8080/file
```
You will get HTTP response code `401` because the request requires bearer authentication. Using Auth0 CLI, get an access token:

```shell
auth0 test token -a https://document-api.okta.com -s openid
```
Select any available client when prompted. You also will be prompted to open a browser window and log in with a user credential. You can sign up as a new user using an email and password or using the Google social login.

With curl, send a request to the API server using a bearer access token:

```shell
ACCESS_TOKEN=<auth0-access-token>
```

```shell
curl -i --header "Authorization: Bearer $ACCESS_TOKEN" localhost:8080/file
```

You should get a JSON response listing the menu items:

```json
[
   {
      "id":1,
      "parentId":null,
      "ownerId":"test-user",
      "name":"planning-v0",
      "description":"Planning doc",
      "createdTime":"2024-05-03T11:48:35.617694826",
      "modifiedTime":"2024-05-03T11:48:35.617694826",
      "quotaBytesUsed":null,
      "version":null,
      "originalFilename":null,
      "fileExtension":".doc"
   },
   {
      "id":2,
      "parentId":null,
      "ownerId":"test-user",
      "name":"image-1",
      "description":"Some image",
      "createdTime":"2024-05-03T11:48:35.617694826",
      "modifiedTime":"2024-05-03T11:48:35.617694826",
      "quotaBytesUsed":null,
      "version":null,
      "originalFilename":null,
      "fileExtension":".jpg"
   },
   {
      "id":3,
      "parentId":null,
      "ownerId":"test-user",
      "name":"meeting-notes",
      "description":"Some text file",
      "createdTime":"2024-05-03T11:48:35.617694826",
      "modifiedTime":"2024-05-03T11:48:35.617694826",
      "quotaBytesUsed":null,
      "version":null,
      "originalFilename":null,
      "fileExtension":".txt"
   }
]
```

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

You can find the code shown in this tutorial on [GitHub](https://github.com/oktadev/spring-api-fga). If you'd rather skip the step-by-step and prefer running a sample application, follow the [README](https://github.com/oktadev/spring-api-fga) instructions in the same repository.

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
