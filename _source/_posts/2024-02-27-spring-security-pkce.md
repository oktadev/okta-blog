---
layout: blog_post
title:  "Proof Key for Code Exchange (PKCE) in Web Applications with Spring Security"
author: jimena-garbarino
by: advocate|contractor
communities: [security,java]
description: "Implementing OpenID Connect authentication in Java Web Applications with Okta Spring Boot Starter and Spring Security support for Authorization Code Flow with PKCE "
tags: []
tweets:
- ""
- ""
- ""
image:
type: awareness|conversion
---


> **This tutorial was created with the following tools and services**:
> - [Java OpenJDK 17](https://jdk.java.net/java-se-ri/17)
> - [Auth0 account](https://auth0.com/signup)
> - [Auth0 CLI 1.4.0](https://github.com/auth0/auth0-cli#installation)

{% include toc.md %}

## Authorization Code Flow and PKCE

- what is code flow
- what is PKCE
- what standard history
- show code flow
- show code flow with pkce
- who is using it


## Spring Security for Authorization Code Flow

You can experiment with the code flow configuration using the [Spring Web Application code sample](https://github.com/auth0-developer-hub/web-app_spring_java_hello-world) from Auth0 developer resources.

Clone the repository and checkout the branch `basic-authentication`:

```shell
git clone https://github.com/auth0-developer-hub/web-app_spring_java_hello-world.git \
  && cd web-app_spring_java_hello-world \
  && git checkout basic-authentication
```

Install the Spring MVC project dependencies using Gradle:

```shell
./gradlew dependencies --write-locks
```

If you inspect the contents of `build.gradle`, you will find the Okta Spring Boot Starter dependency is included.

The Okta Spring Boot Starter simplifies the process of adding authentication into your Spring Boot application by auto-configuring the necessary classes and adhering to best practices, eliminating the need for you to do it manually. It leverages the OAuth 2.0 and OpenID Connect protocols for user authentication.

Sign up at [Auth0](https://auth0.com/signup) and install the [Auth0 CLI](https://github.com/auth0/auth0-cli). Then in the command line run:

```shell
auth0 login
```

The command output will display a device confirmation code and open a browser session to activate the device.

Using the Auth0 CLI, register the web application as an authentication client for Auht0:

```shell
auth0 apps create \
  --name "Spring MVC" \
  --description "Spring Boot Webapp" \
  --type regular \
  --callbacks http://localhost:4040/login/oauth2/code/okta \
  --logout-urls http://localhost:4040 \
  --reveal-secrets
```

Notice the output contains your Auth0 domain, clientId and clientSecret. Create a `.env` file under the root project directory:

```shell
touch .env
```

Populate the `.env` with the following environment variables and values from the previous `auth0 apps create` command output:

```shell
PORT=4040
OKTA_OAUTH2_ISSUER=https://<your-auth0-domain>/
OKTA_OAUTH2_CLIENT_ID=<auth0-client-id>
OKTA_OAUTH2_CLIENT_SECRET=<auth0-client-secret>
```

The Okta Spring Boot Starter will detect the presence of the above properties and auto-configure the Spring Security filter chain for OpenID Connect authentication.

Enable security and web logs in `application.yml` for analyzing the authentication flow:

```properties
logging:
  level:
    org.springframework.security: DEBUG
    org.springframework.web: DEBUG  
```

Run the application with:

```shell
./gradlew bootRun
```

In your browser, open a private navigation window and go to http://localhost:4040/. Upon clicking the "Log In" button, Spring MVC redirects you to the Auth0 Universal Login page. If you check the application logs, you will see Spring Security redirects to your Auth0 '/authorize' endpoint:

```
Redirecting to https://.../authorize?response_type=code&client_id=3SgEFDZfV2402hKmNhc0eIN10Z7tem1R&scope=profile%20email%20openid&state=dHFcoTw2Cbp-xI-irC4g1d85_HLO-Z4D_pJ_HDzBoRU%3D&redirect_uri=http://localhost:4040/login/oauth2/code/okta&nonce=yoPukRMzZ7lnMLsdJZFN7UdvQiLp7jZeDapOW2S3tq0&code_challenge=E98I6uDhdIMOZOwnZh2C1UpA25LablpviBVPCSPs508&code_challenge_method=S256
```










## Enabling PKCE

- remove secret
- inspect logs

## Learn more about PKCE and Spring Boot
