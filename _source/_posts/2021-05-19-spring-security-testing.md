---
disqus_thread_id: 8532957484
discourse_topic_id: 17375
discourse_comment_url: https://devforum.okta.com/t/17375
layout: blog_post
title: "Better Testing with Spring Security Test"
author: jimena-garbarino
by: contractor
communities: [java]
description: "Simplify testing your apps secured with Spring Security by using Spring Security Test."
tags: [spring-security, testing, junit, webtestclient, mockmvc]
tweets:
- "Learn how to test your @SpringSecurity configuration using Spring Security Test."
- "Testing your Spring application's that are secured with Spring Security is a whole lot easier with Spring Security Test!"
- "Test your @java and @springsecurity apps that use JWT and OAuth. 👇"
image: blog/spring-security-test/spring-security-testing.png
type: conversion
changelog:
- 2022-02-15: Updated to use Spring Boot 2.6.3 and Spring Security 5.6.1. See the changes to this post in [okta-blog#1081](https://github.com/oktadev/okta-blog/pull/1081). You can see the updates to the example app in [okta-spring-security-test-example#3](https://github.com/oktadev/okta-spring-security-test-example/pull/3).
---

Integration testing in modern Spring Boot microservices has become easier since the release of Spring Framework 5 and Spring Security 5. Spring Framework's `WebTestClient` for reactive web, and `MockMvc` for servlet web, allow for testing controllers in a lightweight fashion without running a server. Both frameworks leverage Spring Test mock implementations of requests and responses, allowing you to verify most of the application functionality using targeted tests.

With Spring Security 5, security test support provides new request mutators that avoid simulating a grant flow or building an access token when verifying method security in web testing.

In this tutorial, you will explore security mocking with `SecurityMockServerConfigurers` and `SecurityMockMvcRequestPostProcessors`, as well as authorization tests for the following patterns:

- Reactive WebFlux gateway with OIDC authentication
- Servlet MVC REST API with JWT authorization
- Reactive WebFlux REST API with OpaqueToken authorization

**Prerequisites**:

- [HTTPie](https://httpie.io/)
- [Java 11+](https://openjdk.java.net/install/index.html)
- [Okta CLI](https://cli.okta.com)

**Table of Contents**{: .hide }
* Table of Contents
{:toc}

## Test a WebFlux Gateway with `mockOidcLogin()`

Let's start by building and testing a Webflux API Gateway with Okta OIDC login enabled. With HTTPie and Spring Initializr, create and download a Spring Boot Maven project:

```shell
http -d https://start.spring.io/starter.zip type==maven-project \
  language==java \
  bootVersion==2.6.3 \
  baseDir==api-gateway \
  groupId==com.okta.developer \
  artifactId==api-gateway \
  name==api-gateway \
  packageName==com.okta.developer.gateway \
  javaVersion==11 \
  dependencies==cloud-eureka,cloud-gateway,webflux,okta,lombok

unzip api-gateway.zip

cd api-gateway
```

{% include setup/cli.md type="web" framework="Okta Spring Boot Starter" %}

Rename `src/main/resources/application.properties` to `application.yml`, and reformat to YAML syntax (making sure to remove any `\` escape characters in your Okta issuer):

```yaml
spring:
  application:
    name: gateway
  cloud:
    gateway:
      discovery:
        locator:
          enabled: true
okta:
  oauth2:
    issuer: https://{yourOktaDomain}/oauth2/default
    client-id: {clientId}
    client-secret: {clientSecret}
    scopes: openid, profile, email

eureka:
  client:
    service-url:
      defaultZone: ${SERVICE_URL_DEFAULT_ZONE}
```

Add the Spring Security Test dependency to the `pom.xml`:

```xml
<dependency>
    <groupId>org.springframework.security</groupId>
    <artifactId>spring-security-test</artifactId>
    <scope>test</scope>
</dependency>
```

Create the package `com.okta.developer.gateway.controller` under `src/main/java`. Then create a `UserData` class and `UserDataController` to expose the OIDC ID token and access token, to use in later tests.

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

Create the package `com.okta.developer.gateway.security` under `src/main/java`. Add `SecurityConfiguration`, enabling OIDC Login and JWT authentication:

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

**NOTE**: For this tutorial, CSRF security is disabled.

Before adding the tests, disable the Eureka Client to avoid exceptions that will arise because no Eureka Server is available. Create the file `src/test/resources/application-test.yml` with the following content:

```yaml
eureka:
  client:
    register-with-eureka: false
    fetch-registry: false
```
Update the class `ApiGatewayApplicationTests` to activate the `test` profile:

```java
package com.okta.developer.gateway;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class ApiGatewayApplicationTests {

    @Test
    void contextLoads() {
    }

}
```

Create the `com.okta.developer.gateway.controller` package under `src/test/java`. Add the first security tests with `WebTestClient` and `mockOidcLogin()`:

```java
package com.okta.developer.gateway.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.AutoConfigureWebTestClient;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.reactive.server.WebTestClient;

import static org.springframework.security.test.web.reactive.server.SecurityMockServerConfigurers.mockOidcLogin;

@SpringBootTest
@AutoConfigureWebTestClient
@ActiveProfiles("test")
public class UserDataControllerTest {

    @Autowired
    private WebTestClient client;

    @Test
    public void get_noAuth_returnsRedirectLogin() {
        this.client.get().uri("/userdata")
            .exchange()
            .expectStatus().is3xxRedirection();
    }

    @Test
    public void get_withOidcLogin_returnsOk() {
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

With `@AutoConfigureWebTestClient`, Spring Boot initializes a `WebTestClient` that can be injected into the test classes. The alternative for mock web testing is `@WebFluxTest`, which also configures a `WebTestClient`, but the test is limited to a single controller, and _collaborators need to be mocked_.

The test `get_noAuth_returnsRedirectLogin()` verifies that the server will redirect to the OIDC Login flow if no authentication is present.

The test `get_withOidcLogin_returnsOk()` configures the mock request with an `OidcUser`, using `mockOidcLogin()`. The mock `OidcUser.idToken` is modified by adding the `name` claim because `UserDataController` expects it for populating the response. `mockOidcLogin()` belongs to a set of `SecurityMockServerConfigurers` that ship with Spring Security Test 5 as part of the reactive test support features.

Run the tests with:

```shell
./mvnw test
```

## Test an MVC Resource Server with `jwt()` Mocking and Testcontainers

Now, let's create a JWT microservice for lodge listings using Spring Data REST. On application load, a sample dataset will be seeded to the embedded MongoDB instance initialized by [Testcontainers](https://www.testcontainers.org/). JWT access tokens are decoded, verified, and validated locally by Spring Security in the microservice.

```shell
http --download https://start.spring.io/starter.zip \
  type==maven-project \
  language==java \
  bootVersion==2.6.3 \
  baseDir==listings \
  groupId==com.okta.developer \
  artifactId==listings \
  name==listings \
  packageName==com.okta.developer.listings \
  javaVersion==11 \
  dependencies==okta,lombok,web,data-mongodb,data-rest,cloud-eureka

unzip listings.zip
```

Again, add the `spring-security-test` dependency and Testcontainers' [MongoDB Module](https://www.testcontainers.org/modules/databases/mongodb/) to the `pom.xml`:

```xml
<dependency>
    <groupId>org.springframework.security</groupId>
    <artifactId>spring-security-test</artifactId>
    <scope>test</scope>
</dependency>
<dependency>
    <groupId>org.testcontainers</groupId>
    <artifactId>mongodb</artifactId>
    <version>1.16.3</version>
    <scope>test</scope>
</dependency>
```

Rename `application.properties` to `application.yml` and set the following content:

```yaml
server:
  port: 8081

spring:
  application:
    name: listing
  data:
    mongodb:
      port: 27017
      database: airbnb
okta:
  oauth2:
    issuer: https://{yourOktaDomain}/oauth2/default

eureka:
  client:
    service-url:
      defaultZone: ${SERVICE_URL_DEFAULT_ZONE}
```

Make sure to replace `{yourOktaDomain}` with your Okta domain.

Create the `com.okta.developer.listings.model` package under `src/main/java`. Add a model class `AirbnbListing`:

```java
package com.okta.developer.listings.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

@Document(collection = "listingsAndReviews")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class AirbnbListing {
    
    @Id
    private String id;
    private String name;
    private String summary;
    @Field(name = "property_type")
    private String propertyType;
    @Field(name = "room_type")
    private String roomType;
    @Field(name = "bed_type")
    private String bedType;
    @Field(name = "cancellation_policy")
    private String cancellationPolicy;

}
```

Create the package `com.okta.developer.listings.repository` under `src/main/java`. Add a `AirbnbListingRepository` repository:

```java
package com.okta.developer.listings.repository;

import com.okta.developer.listings.model.AirbnbListing;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;
import org.springframework.security.access.prepost.PreAuthorize;

@RepositoryRestResource(collectionResourceRel = "listingsAndReviews", path="listing")
public interface AirbnbListingRepository extends MongoRepository<AirbnbListing, String> {

    @Override
    @PreAuthorize("hasAuthority('listing_admin')")
    AirbnbListing save(AirbnbListing s);

}
```

The annotation `@RepositoryRestResource` directs Spring MVC to create RESTful endpoints at the specified path. The `save()` operation is overridden to configure authorization, requiring the authority `listing_admin`.

Create the package `com.okta.developer.listings.config` under `src/main/java`. Add a `RestConfiguration` class for tweaking the Spring Data REST responses:

```java
package com.okta.developer.listings.config;

import com.okta.developer.listings.model.AirbnbListing;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.rest.core.config.RepositoryRestConfiguration;

import javax.annotation.PostConstruct;

@Configuration
public class RestConfiguration {

    @Autowired
    private RepositoryRestConfiguration repositoryRestConfiguration;

    @PostConstruct
    public void setUp(){
        this.repositoryRestConfiguration.setReturnBodyOnCreate(true);
        this.repositoryRestConfiguration.exposeIdsFor(AirbnbListing.class);
    }
}
```

Create the package `com.okta.developer.listings.security`. Add `SecurityConfiguration` to require JWT authentication for all requests:

```java
package com.okta.developer.listings.security;

import com.okta.spring.boot.oauth.Okta;
import org.springframework.security.config.annotation.method.configuration.EnableGlobalMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;

@EnableWebSecurity
@EnableGlobalMethodSecurity(prePostEnabled = true)
public class SecurityConfiguration extends WebSecurityConfigurerAdapter {

    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http.authorizeRequests()
            .anyRequest()
            .authenticated()
            .and()
            .oauth2ResourceServer().jwt();
        
        Okta.configureResourceServer401ResponseBody(http);
    }
}
```

Update `ListingsApplicationTests` to enable the `test` profile that disables the Eureka client:

```java
package com.okta.developer.listings;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class ListingsApplicationTests {

    @Test
    void contextLoads() {
    }

}
```

Create `src/test/resources/application-test.yml` with the following content:

```yaml
spring:
  cloud:
    discovery:
      enabled: false
```

Now, create `AirbnbListingMvcTest` under `src/test/java` to verify the authorization.

```java
package com.okta.developer.listings;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.okta.developer.listings.model.AirbnbListing;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.MongoDBContainer;
import org.testcontainers.utility.DockerImageName;

import java.util.List;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class AirbnbListingMvcTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private static final MongoDBContainer mongoDBContainer =
        new MongoDBContainer(DockerImageName.parse("mongo:bionic"))
            .withExposedPorts(27017)
            .withEnv("MONGO_INIT_DATABASE", "airbnb");

    @BeforeAll
    public static void setUp() {
        mongoDBContainer.setPortBindings(List.of("27017:27017"));
        mongoDBContainer.start();
    }

    @Test
    public void collectionGet_noAuth_returnsUnauthorized() throws Exception {
        this.mockMvc.perform(get("/listing")).andExpect(status().isUnauthorized());
    }

    @Test
    public void collectionGet_withValidJwtToken_returnsOk() throws Exception {
        this.mockMvc.perform(get("/listing").with(jwt())).andExpect(status().isOk());
    }

    @Test
    public void save_withMissingAuthorities_returnsForbidden() throws Exception {
        AirbnbListing listing = new AirbnbListing();
        listing.setName("test");
        String json = objectMapper.writeValueAsString(listing);
        this.mockMvc.perform(post("/listing").content(json).with(jwt()))
            .andExpect(status().isForbidden());
    }

    @Test
    public void save_withValidJwtToken_returnsCreated() throws Exception {
        AirbnbListing listing = new AirbnbListing();
        listing.setName("test");
        String json = objectMapper.writeValueAsString(listing);
        this.mockMvc.perform(post("/listing").content(json).with(jwt()
                .authorities(new SimpleGrantedAuthority("listing_admin"))))
            .andDo(print())
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").isNotEmpty());
    }

    @AfterAll
    public static void tearDown() {
        mongoDBContainer.stop();
    }

}
```

The test `collectionGet_noAuth_returnsUnauthorized()` verifies that if no JWT token is present in the request, the service will return 404 Unauthorized.

The test `collectionGet_withValidJwtToken_returnsOk()` verifies that with valid JWT authentication, the `/listing` GET returns 200 Ok.

The test `save_withMissingAuhtorities_returnsForbidden()` verifies that if the JWT lacks the `listing_admin` authority, the save operation is denied with 403 Forbidden.

The test `save_withValidJwtToken_returnsCreated()` mocks a JWT with the required authority, verifies the save operation succeeds, and returns 201 Created.

Try the tests with:

```shell
./mvnw test
```

**NOTE:** If you see _MongoSocketReadException: Prematurely reached end of stream_ in the test logs, you can ignore that for now. It might be because the MongoDB Testcontainer shuts down before the context.

## Test a WebFlux Resource Server with `mockOpaqueToken()`

The OpaqueToken is validated remotely with a request to the authorization server. Create a reactive microservice with OpaqueToken authentication.

```shell
http --download https://start.spring.io/starter.zip \
  type==maven-project \
  language==java \
  bootVersion==2.6.3 \
  baseDir==theaters \
  groupId==com.okta.developer \
  artifactId==theaters \
  name==theaters \
  packageName==com.okta.developer.theaters \
  javaVersion==11 \
  dependencies==lombok,devtools,data-mongodb-reactive,webflux,oauth2-resource-server,cloud-eureka

unzip theaters.zip
```

Add the Nimbus `oauth2-oidc-sdk` dependency to the `pom.xml`, required for token introspection, and add the  `spring-security-test` dependency. 

```xml
<dependency>
    <groupId>com.nimbusds</groupId>
    <artifactId>oauth2-oidc-sdk</artifactId>
    <version>9.25</version>
    <scope>runtime</scope>
</dependency>
<dependency>
    <groupId>org.springframework.security</groupId>
    <artifactId>spring-security-test</artifactId>
    <scope>test</scope>
</dependency>
<dependency>
    <groupId>org.testcontainers</groupId>
    <artifactId>mongodb</artifactId>
    <version>1.16.3</version>
    <scope>test</scope>
</dependency>
```

Token introspection involves a call to the authorization server, so create an OIDC app with the Okta CLI, as illustrated for the `api-gateway`.

```shell
cd theaters
```

{% include setup/cli.md type="web" framework="Okta Spring Boot Starter" install="false" %}

Rename `application.properties` to `application.yml` and set the following content:

```yaml
server:
  port: 8082

spring:
  application:
    name: theater
  data:
    mongodb:
      port: 27017
      database: airbnb
  security:
    oauth2:
      resourceserver:
        opaque-token:
          introspection-uri: https://{yourOktaDomain}/oauth2/default/v1/introspect
          client-secret: {yourClientSecret}
          client-id: {yourClientId}
eureka:
  client:
    service-url:
      defaultZone: ${SERVICE_URL_DEFAULT_ZONE}
```

Create the `com.okta.developer.theaters.model` package under `src/main/java`. Add the model class `Location` to map some of the fields in the dataset:

```java
package com.okta.developer.theaters.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.mongodb.core.geo.GeoJsonPoint;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class Location {

    private GeoJsonPoint geo;
}
```

Add the `Theater` model class:

```java
package com.okta.developer.theaters.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document("theaters")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Theater {

    @Id
    private String id;
    private Location location;

}
```

Create the package `com.okta.developer.theaters.repository`. Add the interface `TheaterRepository`:

```java
package com.okta.developer.theaters.repository;

import com.okta.developer.theaters.model.Theater;
import org.springframework.data.mongodb.repository.ReactiveMongoRepository;

public interface TheaterRepository extends ReactiveMongoRepository<Theater, String> {
}
```

Create a `TheatersController` in `com.okta.developer.theaters.controller` package:

```java
package com.okta.developer.theaters.controller;

import com.okta.developer.theaters.repository.TheaterRepository;
import com.okta.developer.theaters.model.Theater;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

@RestController
public class TheaterController {

    private TheaterRepository theaterRepository;

    public TheaterController(TheaterRepository theaterRepository){
        this.theaterRepository = theaterRepository;
    }

    @GetMapping("/theater")
    public Flux<Theater> getAllTheaters(){
        return theaterRepository.findAll();
    }

    @PostMapping("/theater")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAuthority('theater_admin')")
    public Mono<Theater> saveTheater(@RequestBody Theater theater){
        return theaterRepository.save(theater);
    }

}
```

The POST `/theater` endpoint requires `theater_admin` authority to proceed with the persistence.

Create package `com.okta.developer.theaters.security`. Add a custom `JwtOpaqueTokenIntrospector` to parse authorities from the `groups` claim in the access token.

```java
package com.okta.developer.theaters.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.security.oauth2.resource.OAuth2ResourceServerProperties;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.core.DefaultOAuth2AuthenticatedPrincipal;
import org.springframework.security.oauth2.core.OAuth2AuthenticatedPrincipal;
import org.springframework.security.oauth2.server.resource.introspection.NimbusReactiveOpaqueTokenIntrospector;
import org.springframework.security.oauth2.server.resource.introspection.ReactiveOpaqueTokenIntrospector;
import reactor.core.publisher.Mono;

import javax.annotation.PostConstruct;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

public class JwtOpaqueTokenIntrospector implements ReactiveOpaqueTokenIntrospector {

    @Autowired
    private OAuth2ResourceServerProperties oAuth2;
    private ReactiveOpaqueTokenIntrospector delegate;

    @PostConstruct
    private void setUp() {
        delegate =
            new NimbusReactiveOpaqueTokenIntrospector(
                oAuth2.getOpaquetoken().getIntrospectionUri(),
                oAuth2.getOpaquetoken().getClientId(),
                oAuth2.getOpaquetoken().getClientSecret());
    }

    public Mono<OAuth2AuthenticatedPrincipal> introspect(String token) {
        return this.delegate.introspect(token)
            .flatMap(principal -> enhance(principal));
    }

    private Mono<OAuth2AuthenticatedPrincipal> enhance(OAuth2AuthenticatedPrincipal principal) {
        Collection<GrantedAuthority> authorities = extractAuthorities(principal);
        OAuth2AuthenticatedPrincipal enhanced = 
            new DefaultOAuth2AuthenticatedPrincipal(principal.getAttributes(), authorities);
        return Mono.just(enhanced);
    }

    private Collection<GrantedAuthority> extractAuthorities(OAuth2AuthenticatedPrincipal principal) {
        Collection<GrantedAuthority> authorities = new ArrayList<>();
        authorities.addAll(principal.getAuthorities());

        List<String> groups = principal.getAttribute("groups");
        if (groups != null) {
            groups.stream()
                .map(SimpleGrantedAuthority::new)
                .forEach(authorities::add);
        }

        return authorities;
    }
}
```

Add a `SecurityConfiguration` class to configure opaque token authentication.

```java
package com.okta.developer.theaters.security;

import org.springframework.context.annotation.Bean;
import org.springframework.security.config.annotation.method.configuration.EnableReactiveMethodSecurity;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.oauth2.server.resource.introspection.ReactiveOpaqueTokenIntrospector;
import org.springframework.security.web.server.SecurityWebFilterChain;

@EnableWebFluxSecurity
@EnableReactiveMethodSecurity
public class SecurityConfiguration {

    @Bean
    public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http) {
        return http.csrf().disable()
            .authorizeExchange()
            .anyExchange().authenticated()
            .and()
            .oauth2ResourceServer()
            .opaqueToken().and().and().build();
    }

    @Bean
    public ReactiveOpaqueTokenIntrospector introspector() {
        return new JwtOpaqueTokenIntrospector();
    }
}
```

Update `TheatersApplicationTests` to disable the Eureka client and to use Testcontainers for MongoDB:

```java
package com.okta.developer.theaters;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.testcontainers.containers.MongoDBContainer;
import org.testcontainers.utility.DockerImageName;

import java.util.List;

@SpringBootTest
@ActiveProfiles("test")
class TheatersApplicationTests {

    private static final MongoDBContainer mongoDBContainer = 
        new MongoDBContainer(DockerImageName.parse("mongo:bionic"))
            .withExposedPorts(27017)
            .withEnv("MONGO_INIT_DATABASE", "airbnb");

    @BeforeAll
    public static void setUp() {
        mongoDBContainer.setPortBindings(List.of("27017:27017"));
        mongoDBContainer.start();
    }
    
    @Test
    void contextLoads() {
    }

    @AfterAll
    public static void tearDown() {
        mongoDBContainer.stop();
    }
}
```

Create `src/test/resources/application-test.yml` with the following content:

```yaml
spring:
  cloud:
    discovery:
      enabled: false
```

Create the package `com.okta.developer.theaters.controller` under `src/test/java`. Now, create `TheaterControllerTest` to verify the endpoints' authorization.

```java
package com.okta.developer.theaters.controller;

import com.okta.developer.theaters.model.Location;
import com.okta.developer.theaters.model.Theater;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.AutoConfigureWebTestClient;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.reactive.server.WebTestClient;
import org.testcontainers.containers.MongoDBContainer;
import org.testcontainers.utility.DockerImageName;

import java.util.List;

import static org.springframework.security.test.web.reactive.server.SecurityMockServerConfigurers.mockOpaqueToken;
import static org.springframework.web.reactive.function.BodyInserters.fromValue;

@SpringBootTest
@AutoConfigureWebTestClient
@ActiveProfiles("test")
public class TheaterControllerTest {

    @Autowired
    private WebTestClient client;

    private static final MongoDBContainer mongoDBContainer =
        new MongoDBContainer(DockerImageName.parse("mongo:bionic"))
            .withExposedPorts(27017)
            .withEnv("MONGO_INIT_DATABASE", "airbnb");

    @BeforeAll
    public static void setUp() {
        mongoDBContainer.setPortBindings(List.of("27017:27017"));
        mongoDBContainer.start();
    }

    @Test
    public void collectionGet_noAuth_returnsUnauthorized() throws Exception {
        this.client.get().uri("/theater").exchange().expectStatus().isUnauthorized();
    }

    @Test
    public void collectionGet_withValidOpaqueToken_returnsOk() throws Exception {
        this.client.mutateWith(mockOpaqueToken())
            .get().uri("/theater").exchange().expectStatus().isOk();
    }

    @Test
    public void post_withMissingAuthorities_returnsForbidden() throws Exception {
        Theater theater = new Theater();
        theater.setId("123");
        theater.setLocation(new Location());
        this.client.mutateWith(mockOpaqueToken())
            .post().uri("/theater").body(fromValue(theater))
            .exchange().expectStatus().isForbidden();
    }

    @Test
    public void post_withValidOpaqueToken_returnsCreated() throws Exception {
        Theater theater = new Theater();
        theater.setLocation(new Location());
        this.client.mutateWith(
                mockOpaqueToken().authorities(new SimpleGrantedAuthority("theater_admin")))
            .post().uri("/theater").body(fromValue(theater))
            .exchange()
            .expectStatus().isCreated()
            .expectBody().jsonPath("$.id").isNotEmpty();
    }

    @AfterAll
    public static void tearDown() {
        mongoDBContainer.stop();
    }
}
```

The test `collectionGet_noAuth_returnsUnauthorized()` verifies that access is denied if there is no token in the request.

The test `collectionGet_withValidOpaqueToken_returnsOk()` sets a mock opaque token in the request, so the controller must return 200 OK.

The test `post_withMissingAuthorities_returnsFodbidden()` verifies that without the required authorities, the controller rejects the request with 403 Forbidden.

The test `post_withValidOpaqueToken_returnsCreated()` verifies that if `theater_admin` authority is present in the token, the create request will pass, returning the new `theater` in the response body.

Again, try the tests with:

```shell
./mvnw test
```

## On Mocking Features in Spring Security Test

Spring Security Test documentation indicates that when testing with `WebTestClient` and `mockOpaqueToken()` (or any other configurer), the request will pass correctly through any authentication API, and the mock authentication object will be available for the authorization mechanism to verify. The same applies for `MockMvc`. That is likely why an invalid audience, expiration, or issuer in the token attributes is ignored in this kind of test.

For example, the following `AirbnbListingMvcTest` test will pass:

```java
@Test
public void collectionGet_withInvalidJWtToken_returnsOk() throws Exception {
    this.mockMvc.perform(get("/listing").with(jwt()
    .jwt(jwt -> jwt.claim("exp", Instant.MIN)
            .claim("iss", "invalid")
            .claim("aud", "invalid")))).andExpect(status().isOk());
}
```

In the same way, if the `WebTestClient` or `MockMvc` mocks a different type of authentication than expected, the test might pass as long as the controller injects a compatible authentication type. The test will pass depending on which method the test is expecting to be in the `SecurityContextHolder`. For example, the `listings` service expects JWT authentication, but the following `AirbnbListingMvcTest` test will pass:

```java
@Test
public void collectionGet_withOpaqueToken_returnsOk() throws Exception {
    this.mockMvc.perform(get("/listing").with(opaqueToken())).andExpect(status().isOk());
}
```

## Verify Authorization and Audience Validation

Let's run an end-to-end test using HTTPie to verify both the authorization and that the audience is enforced in both services.

First, create a Eureka server:

```shell
http --download https://start.spring.io/starter.zip \
  type==maven-project \
  language==java \
  bootVersion==2.6.3 \
  baseDir==eureka \
  groupId==com.okta.developer \
  artifactId==eureka \
  name==eureka \
  packageName==com.okta.developer.eureka \
  javaVersion==11 \
  dependencies==cloud-eureka-server

unzip eureka.zip
```

Edit `EurekaApplication` to add `@EnableEurekaServer` annotation:

```java
package com.okta.developer.eureka;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.server.EnableEurekaServer;

@SpringBootApplication
@EnableEurekaServer
public class EurekaApplication {

    public static void main(String[] args) {
        SpringApplication.run(EurekaApplication.class, args);
    }

}
```

Rename `src/main/resources/application.properties` to `application.yml` and add the following content:

```yaml
server:
  port: 8761

eureka:
  instance:
    hostname: localhost
  client:
    registerWithEureka: false
    fetchRegistry: false
    serviceUrl:
      defaultZone: http://${eureka.instance.hostname}:${server.port}/eureka/
```

Configure `theater` and `listing` routes in the `api-gateway` project. Edit `ApiGatewayApplication` to add a `RouteLocator` bean:

```java
package com.okta.developer.gateway;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.gateway.filter.factory.TokenRelayGatewayFilterFactory;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class ApiGatewayApplication {

    @Autowired
    private TokenRelayGatewayFilterFactory filterFactory;

    public static void main(String[] args) {
        SpringApplication.run(ApiGatewayApplication.class, args);
    }

    @Bean
    public RouteLocator routeLocator(RouteLocatorBuilder builder) {
        return builder.routes()
            .route("listing", r -> r.path("/listing/**")
                .filters(f -> f.filter(filterFactory.apply()))
                .uri("lb://listing"))
            .route("theater", r -> r.path("/theater/**")
                .filters(f -> f.filter(filterFactory.apply()))
                .uri("lb://theater"))
            .build();
    }
}
```

Create a `docker` folder at the root level (same level as the api-gateway, theaters, and listings), where all services are contained. Add a `docker-compose.yml` file with the following content:

```yaml
version: "3.8"

services:
  mongo:
    image: mongo:bionic
    hostname: mongo
    environment:
      - MONGO_INIT_DATABASE=airbnb
    ports:
      - "27017:27017"
    volumes:
      - ./initdb.sh:/docker-entrypoint-initdb.d/initdb.sh
      - /{mongoDataPath}:/db-dump
  api-gateway:
    image: api-gateway:0.0.1-SNAPSHOT
    ports:
      - "8080:8080"
    depends_on:
      - eureka
    environment:
      - SERVICE_URL_DEFAULT_ZONE=http://eureka:8761/eureka
  listings:
    image: listings:0.0.1-SNAPSHOT
    ports:
      - "8081:8081"
    depends_on:
      - mongo
      - eureka
    environment:
      - SERVICE_URL_DEFAULT_ZONE=http://eureka:8761/eureka
      - SPRING_DATA_MONGODB_HOST=mongo
  eureka:
    image: eureka:0.0.1-SNAPSHOT
    hostname: eureka
    ports:
      - "8761:8761"
    environment:
      - EUREKA_INSTANCE_HOSTNAME=eureka
  theaters:
    image: theaters:0.0.1-SNAPSHOT
    ports:
      - "8082:8082"
    depends_on:
      - mongo
      - eureka
    environment:
      - SERVICE_URL_DEFAULT_ZONE=http://eureka:8761/eureka
      - SPRING_DATA_MONGODB_HOST=mongo
```

Get the MongoDB dump files `theaters.bson`, `theaters.metadata.json` from [GitHub](https://github.com/huynhsamha/quick-mongo-atlas-datasets/tree/master/dump/sample_mflix). 

```shell
http -d https://github.com/huynhsamha/quick-mongo-atlas-datasets/blob/master/dump/sample_mflix/theaters.bson?raw=true
http -d https://github.com/huynhsamha/quick-mongo-atlas-datasets/blob/master/dump/sample_mflix/theaters.metadata.json?raw=true
```

Also get `listingsAndReviews.bson` and `listingsAndreviews.metadata.json` from [GitHub](https://github.com/huynhsamha/quick-mongo-atlas-datasets/tree/master/dump/sample_airbnb).

```shell
http -d https://github.com/huynhsamha/quick-mongo-atlas-datasets/blob/master/dump/sample_airbnb/listingsAndReviews.bson?raw=true
http -d https://github.com/huynhsamha/quick-mongo-atlas-datasets/blob/master/dump/sample_airbnb/listingsAndReviews.metadata.json?raw=true
```

Place the files in some location and update `{mongoDataPath}` to use it in the `docker-compose.yml` file.

Create a file `docker/initdb.sh` with the following script:

```shell
mongorestore -d airbnb /db-dump
```

Build each service image with:

```shell
./mvnw spring-boot:build-image
```

Run the services with Docker Compose:

```shell
cd docker
docker compose up
```

Go to `http://localhost:8761`, and you should see the Eureka home. (Wait for all services to register.)

{% img blog/spring-security-test/eureka-services.png alt:"Eureka Instances Registered" width:"800" %}{: .center-image }

Go to `http://localhost:8080/userdata` after the Okta login, and you should see an output similar to this:

```json
{
   "userName":"...",
   "idToken":"...",
   "accessToken":"..."
}
```

Test the `api-gateway` endpoints `http://localhost:8080/theater` and `http://localhost:8080/listing` with your browser.

Now, let's test authorization with a POST to the `/listing` endpoint. Copy the `accessToken` value from the `/userdata` output and set it as an environment variable:

```shell
ACCESS_TOKEN={accessToken}

http POST http://localhost:8080/listing name=test "Authorization:Bearer ${ACCESS_TOKEN}"
```

You will see the following response:
```
HTTP/1.1 403 Forbidden
WWW-Authenticate: Bearer error="insufficient_scope", 
 error_description="The request requires higher privileges than provided by the access token.", 
 error_uri="https://tools.ietf.org/html/rfc6750#section-3.1"
```

This is because the `listings` service expects `listing_admin` authority to accept the POST request. The Okta Spring Boot Starter will automatically assign the content of the `groups` claim as authorities. Login to the Okta Admin Console (running `okta login` will get you the URL), create a `listing_admin` group (**Directory** > **Groups**), and assign your user to it.

Then, add the `groups` claim to the access token. Go to **Security** > **API**. Select the `default` authorization server. Go to **Claims**, and add a claim. Set the following values:

- Name: `groups`
- Include in token type: `Access Token`
- Value type: `Groups`
- Filter: Matches regex (set filter value to `.*`)

Open an incognito window, and request the `/userdata` endpoint, to repeat the sign-in and obtain a new access token with the `groups` claim. Repeat the HTTPie POST request, and now your access token should be accepted!

_If it doesn't work, you can use [token.dev](https://token.dev) to view the contents of your access token._

Stop the services with CTRL-C and change the expected audience in the `listings` project's `application.yml`:

```yaml
okta:
  oauth2:
    issuer: https://{yourOktaDomain}/oauth2/default
    audience: api://custom
```

Rebuild the `listings` service image.

```shell
cd listings
./mvnw spring-boot:build-image -DskipTests
```

Restart the services and repeat the HTTPie POST request:

```shell
http POST http://localhost:8080/listing name=test "Authorization:Bearer ${ACCESS_TOKEN}"
```

You will see the following response:

```
HTTP/1.1 401 Unauthorized
WWW-Authenticate: Bearer error="invalid_token", 
 error_description="An error occurred while attempting to decode the Jwt: This aud claim is not equal to the configured audience",
 error_uri="https://tools.ietf.org/html/rfc6750#section-3.1"
```

You can verify the same in the `theaters` service.

## Learn More About Spring Security and OAuth

I hope you enjoyed this tutorial and understand more about `SecurityMockServerConfigurers` in reactive test support and `SecurityMockMvcRequestPostProcessors` in the MockMvc test support (available since Spring Security 5). You can see how useful these can be for integration testing, as well as the limitations of request and response mocking.

You can find all the code from this tutorial on GitHub, in the [okta-spring-security-test-example](https://github.com/oktadev/okta-spring-security-test-example) repository.

Check out the links below to learn more about Spring Security and OAuth 2.0 patterns:

- [Spring Security's SecurityMockMvcRequestPostProcessors documentation](https://docs.spring.io/spring-security/site/docs/5.6.1/reference/html5/#test-mockmvc-smmrpp)
- [Spring Security's WebTestClientSupport documentation](https://docs.spring.io/spring-security/site/docs/5.6.1/reference/html5/#test-webtestclient)
- [OAuth 2.0 Patterns with Spring Cloud Gateway](/blog/2020/08/14/spring-gateway-patterns)
- [JWT vs Opaque Access Tokens: Use Both With Spring Boot](/blog/2020/08/07/spring-boot-remote-vs-local-tokens)
- [Security Patterns for Microservice Architectures](/blog/2020/03/23/microservice-security-patterns)

If you'd like to see more information like this, consider following us [on Twitter](https://twitter.com/oktadev) and subscribing to our [YouTube channel](https://www.youtube.com/oktadev). We've also been streaming [on Twitch](https://twitch.tv/oktadev) a bit lately.
