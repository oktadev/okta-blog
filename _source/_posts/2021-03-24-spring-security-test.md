---
layout: blog_post
title: ""
author: jimena-garbarino
by: contractor
communities: [security,java]
description: ""
tags: []
tweets:
- ""
- ""
- ""
image:
type: awareness
---




--- introduction
Comments about the bootifulpodcast
Comments about RequestPostProcessor
Comments about mocking limitations on audience, expiration, issuer

Prerequisites:
- [HTTPie](https://httpie.io/)
- [Java 11+](https://openjdk.java.net/install/index.html)
- [Okta CLI](https://cli.okta.com/)

# Testing OIDC Login Webflux Gateway
Create discovery
Create gateway x
Test oidclogin x
Test no auth x
Document autoconfiguration boot test features
Document security test features x

Let's start by building and testing a Webflux API Gateway with Okta OIDC login enabled. With HTTPie and Spring Initializr create and download a Spring Boot maven project:

```shell
http -d https://start.spring.io/starter.zip type==maven-project \
  language==java \
  bootVersion==2.3.9.RELEASE \
  baseDir==api-gateway \
  groupId==com.okta.developer \
  artifactId==api-gateway \
  name==api-gateway \
  packageName==com.okta.developer.gateway \
  javaVersion==11 \
  dependencies==cloud-eureka,cloud-gateway,webflux,okta,cloud-security,lombok
```
```shell
unzip api-gateway.zip
```

With OktaCLI, register for a free developer account:

```shell
okta register
```
Provide the required information. Once you complete the registration, create a client application with the following command:

```shell
okta apps create
```
You will be prompted to select the following options:

- Type of Application: Web
- Type of Application: Okta Spring Boot Starter
- Redirect URI: Default
- Post Logout Redirect URI: Default

The OktaCLI will create the client application and configure the issuer, clientId and clientSecret in `src/main/resources/application.properties`.

Rename `application.properties` to `application.yml`, and reformat to yaml syntax:

```yml
okta:
  oauth2:
    issuer: https://{yourOktaDomain}/oauth2/default
    client-id: {clientId}
    client-secret: {clientSecret}
```

Add Spring Security Test dependency to the `pom.xml`:

```xml
<dependency>
  <groupId>org.springframework.security</groupId>
  <artifactId>spring-security-test</artifactId>
  <version>5.4.5</version>
  <scope>test</scope>
</dependency>
```
Create a `UserData` class and `UserDataController` to expose the OIDC idToken and accessToken, to use in later tests.

```java
package com.okta.developer.gateway.controller;

import lombok.Data;

@Data
public class UserData {

    private String userName;
    private String idToken;
    private String accessToken;
}
```

```java
package com.okta.developer.gateway.controller;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.annotation.RegisteredOAuth2AuthorizedClient;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
public class UserDataController {

    @RequestMapping("/userdata")
    @ResponseBody
    public UserData greeting(@AuthenticationPrincipal OidcUser oidcUser,
                             @RegisteredOAuth2AuthorizedClient("okta") OAuth2AuthorizedClient client) {

        UserData userData = new UserData();
        userData.setUserName(oidcUser.getFullName());
        userData.setIdToken(oidcUser.getIdToken().getTokenValue());
        userData.setAccessToken(client.getAccessToken().getTokenValue());
        return userData;
    }
}
```

Add `SecurityConfiguration` enabling OIDC Login and JWT authentication:

```java
package com.okta.developer.gateway.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;

@Configuration
@EnableWebFluxSecurity
public class SecurityConfiguration {

    @Bean
    public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http) {
        http.csrf().disable()
                .authorizeExchange()
                .anyExchange()
                .authenticated()
                .and().oauth2Login()
                .and().oauth2ResourceServer().jwt();
        return http.build();
    }
}
```

Important Note: For this tutorial CSRF security is disabled.

Create the first security tests with `WebTestClient` and `mockOidcLogin()`:

```java
package com.okta.developer.gateway.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.AutoConfigureWebTestClient;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.reactive.server.WebTestClient;

import static org.springframework.security.test.web.reactive.server.SecurityMockServerConfigurers.mockOidcLogin;

@SpringBootTest
@AutoConfigureWebTestClient
public class UserDataControllerTest {

    @Autowired
    private WebTestClient client;

    @Test
    public void get_noAuth_returnsRedirectLogin(){
        this.client.get().uri("/userdata")
                .exchange()
                .expectStatus().is3xxRedirection();
    }

    @Test
    public void get_withOidcLogin_returnsOk(){
        this.client.mutateWith(mockOidcLogin().idToken(token -> token.claim("name", "Mock User")))
                .get().uri("/userdata")
                .exchange()
                .expectStatus().isOk()
                .expectBody()
                .jsonPath("$.userName").isNotEmpty()
                .jsonPath("$.idToken").isNotEmpty()
                .jsonPath("$.accessToken").isNotEmpty();
    }
}
```
By default, `@SpringBootTest` loads the web `ApplicationContext` and provides a mock web environment.

With `@AutoConfigureWebTestClient`, Spring Boot initializes a `WebTestClient`, that can be injected to the test classes. `@WebFluxTest` also configures a `WebTestClient`, but the test is limited to a single controller, and _collaborators need to be mocked_.

The test `get_noAuth_returnsRedirectLogin` verifies that the server will redirect to the OIDC Login flow if no authentication is present.

The test `get_withOidcLogin_returnsOk` configures the mock request with an OidcUser, using `mockOidcLogin()`. The mock OidcUser.idToken is modified adding the `name` claim, because `UserDataController` expects it for populating the response.`mockOidcLogin()` belongs to a set of `SecurityMockServerConfigurers` that ship with Spring Security Test 5.4.5, as part of the new Reactive Test Support features.



# Testing JWT Servlet Resource Server

JWT validation
Create service
Configure flappoodle with MongoDB sample data
Document mongosh
Configure auhtorities
Test no auth
Test GET
Test POST

** Manual WebTestClient configuration to check audience validation**

# Testing OpaqueToken Webflux Resource Server

Difference with JWT validation
Create service
Document how to find introspection uri
Configure auhtorities
Configure flappoodle with MongoDB sample data
Spring DATA Rest not supported in Webflux
Authorities extraction -> rebuild token
Test no auth
Test GET
Test POST

# On Mocking

Why test passes with different authentication than configured (oidcLogin, jwt, opaque)
Expiration not validated
Audience not validated
Issuer not validated




Live example


# Learn More
