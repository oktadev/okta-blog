---
layout: blog_post
title: "Better Testing with Spring Security Test"
author: jimena-garbarino
by: contractor
communities: [security,java]
description: "Simplify your Web Testing with Spring Security Test"
tags: []
tweets:
- ""
- ""
- ""
image:
type: conversion
---

Integration testing in modern Spring Boot microservices has become easier since the release Spring Framework 5 and Spring Security 5.
Spring Framework `WebTestClient` for reactive web, and `MockMvc` for servlet web, allow testing controllers without running a server, in a lightweight fashion. Both frameworks leverage Spring Test mock implementations of requests and responses, allowing to verify most of the functionality of the application using targeted tests. With Spring Security 5, security test support provides new request mutators that allow avoiding simulating a grant flow or building an access token when verifying method security in web testing.

In this tutorial you will explore security mocking with `SecurityMockServerConfigurers` and `SecurityMockMvcRequestPostProcessors`, and authorization tests for the following patterns:
- Reactive WebFlux gateway with OIDC authentication
- Servlet MVC REST Api with JWT authorization
- Reactive WebFlux REST Api with OpaqueToken authorization

**Prerequisites**:
- [HTTPie](https://httpie.io/)
- [Java 11+](https://openjdk.java.net/install/index.html)
- [Okta CLI](https://cli.okta.com/)


**Table of Contents**{: .hide }
* Table of Contents
{:toc}

# Testing a WebFlux Gateway with `mockOidcLogin()`

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
```shell
cd api-gateway
```

{% include setup/cli.md type="web" framework="Okta Spring Boot Starter" %}

Rename `src/main/resources/application.properties` to `application.yml`, and reformat to yaml syntax (making sure to remove any `\` escape characters):

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

Create the package `com.okta.developer.gateway.security` under `src/main/java`. Add `SecurityConfiguration` enabling OIDC Login and JWT authentication:

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

Create the package `com.okta.developer.gateway.controller` under `src/test/java`. Add the first security tests with `WebTestClient` and `mockOidcLogin()`:

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

With `@AutoConfigureWebTestClient`, Spring Boot initializes a `WebTestClient`, that can be injected to the test classes. The alternative for mock web testing is`@WebFluxTest`, it also configures a `WebTestClient`, but the test is limited to a single controller, and _collaborators need to be mocked_.

The test `get_noAuth_returnsRedirectLogin` verifies that the server will redirect to the OIDC Login flow if no authentication is present.

The test `get_withOidcLogin_returnsOk` configures the mock request with an `OidcUser`, using `mockOidcLogin()`. The mock `OidcUser.idToken` is modified by adding the `name` claim, because `UserDataController` expects it for populating the response.`mockOidcLogin()` belongs to a set of `SecurityMockServerConfigurers` that ship with Spring Security Test 5, as part of the Reactive Test Support features.

Run the tests with:

```shell
./mvnw test
```

# Testing an MVC Resource Server with `jwt()` Mocking

Now, let's create a JWT microservice for lodge listings, using Spring Data Rest. On application load, a sample dataset will be seeded to the embedded MongoDB instance initialized by Flapdoodle. JWT access tokens are decoded, verified and validated locally by Spring Security in the microservice.

```shell
http --download https://start.spring.io/starter.zip \
  type==maven-project \
  language==java \
  bootVersion==2.4.5.RELEASE \
  baseDir==listings \
  groupId==com.okta.developer \
  artifactId==listings \
  name==listings \
  packageName==com.okta.developer.listings \
  javaVersion==11 \
  dependencies==okta,lombok,flapdoodle-mongo,web,data-mongodb,data-rest,cloud-eureka
```
```shell
unzip listings.zip
```
Again, add the `spring-security-test` dependency to the `pom.xml`, and remove the `test` scope in flappdoodle dependency, to make the seed dataset available when running the server:

```xml
<dependency>
  <groupId>org.springframework.security</groupId>
  <artifactId>spring-security-test</artifactId>
  <version>5.4.5</version>
  <scope>test</scope>
</dependency>
<dependency>
  <groupId>de.flapdoodle.embed</groupId>
  <artifactId>de.flapdoodle.embed.mongo</artifactId>
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

mongo-dump: /home/indiepopart/mongodb/listingsAndReviews.bson
```

Create a `MongoDBSeeder` class:

```java
package com.okta.developer.listings;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import de.flapdoodle.embed.mongo.MongoRestoreExecutable;
import de.flapdoodle.embed.mongo.MongoRestoreProcess;
import de.flapdoodle.embed.mongo.MongoRestoreStarter;
import de.flapdoodle.embed.mongo.config.IMongoRestoreConfig;
import de.flapdoodle.embed.mongo.config.MongoRestoreConfigBuilder;
import de.flapdoodle.embed.mongo.config.Net;
import de.flapdoodle.embed.mongo.distribution.Version;
import de.flapdoodle.embed.process.runtime.Network;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.context.event.ContextRefreshedEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.IOException;

@Component
@Profile("seed")
public class MongoDBSeeder {

    private static Logger logger = LoggerFactory.getLogger(MongoDBSeeder.class);

    @Value("${mongo-dump}")
    private String mongoDump;

    @Value("${spring.data.mongodb.port}")
    private int mongoPort;

    @Autowired
    private MongoClient mongoClient;

    @EventListener
    public void seed(ContextRefreshedEvent event) {
        for (String name : mongoClient.listDatabaseNames()) {
            logger.info("DB: {}", name);
        }

        restore();

        for (String name : mongoClient.listDatabaseNames()) {
            logger.info("DB: {}", name);
            if ("airbnb".equalsIgnoreCase(name)){
                MongoDatabase db = mongoClient.getDatabase(name);
                for (String collection : db.listCollectionNames()) {
                    logger.info("Collection: {}", collection);
                    MongoCollection mongoCollection = db.getCollection(collection);
                    logger.info("Documents count {}", mongoCollection.countDocuments());
                }
            }
        }
    }


    public void restore() {
        try {

            File file = new File(mongoDump);
            if (!file.exists()) {
                throw new RuntimeException("File does not exist");
            }
            String name =  file.getAbsolutePath();


            IMongoRestoreConfig mongoconfig= new MongoRestoreConfigBuilder()
                    .version(Version.Main.PRODUCTION)
                    .net(new Net(mongoPort, Network.localhostIsIPv6()))
                    .db("airbnb")
                    .collection("airbnb")
                    .dropCollection(true)
                    .dir(name)
                    .build();

            MongoRestoreExecutable mongoRestoreExecutable = MongoRestoreStarter.getDefaultInstance().prepare(mongoconfig);
            MongoRestoreProcess mongoRestore = mongoRestoreExecutable.start();
            mongoRestore.stop();
        } catch (IOException e) {
            logger.error("Unable to restore mongodb", e);
        }
    }

}
```

Get the MongoDB dump files `listingsAndReviews.bson`, `listingsAndreviews.metadata.json` from [Github](https://github.com/huynhsamha/quick-mongo-atlas-datasets/tree/master/dump/sample_airbnb). Place the files in the location specified in the property `mongo-dump`, in the `application.yml`.

Create the package `com.okta.developer.listings.model` under `src/main/java`. Add a model class `AirbnbListing`:

```java
package com.okta.developer.listings.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

@Document(collection = "airbnb")
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

Create the package `com.okta.developer.listings.repository` under `src/main/java`. Add the listing repository `AirbnbListingRepository`:


```java
package com.okta.developer.listings.repository;

import com.okta.developer.listings.model.AirbnbListing;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;
import org.springframework.security.access.prepost.PreAuthorize;

@RepositoryRestResource(collectionResourceRel = "airbnb", path="listing")
public interface AirbnbListingRepository extends MongoRepository<AirbnbListing, String> {

    @Override
    @PreAuthorize("hasAuthority('listing_admin')")
    AirbnbListing save(AirbnbListing s);

}
```
The annotation `@RepositoryRestResource` directs Spring MVC to create the RESTful endpoints at the specified `path`.
The `save` operation is overridden to configure authorization, requiring the authority `listing_admin`.


Create the package `com.okta.developer.listings.config` under `src/main/java`. Add a `RestConfiguration` class for tweaking the Spring Data Rest responses:

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
import com.okta.spring.boot.oauth.config.OktaOAuth2Properties;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.config.annotation.method.configuration.EnableGlobalMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;

@EnableWebSecurity
@EnableGlobalMethodSecurity(prePostEnabled = true)
public class SecurityConfiguration extends WebSecurityConfigurerAdapter {

    @Autowired
    private OktaOAuth2Properties oktaOAuth2Properties;


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

Update `ListingsApplicationTests` to disable eurkea client and the embedded MongoDB:

```java
package com.okta.developer.listings;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles({"test", "exclude"})
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


Create `src/test/resources/application-exclude.yml` with the following content:

```yaml
spring:
  autoconfigure:
    exclude: org.springframework.boot.autoconfigure.mongo.embedded.EmbeddedMongoAutoConfiguration
```

Now, create `AirbnbListingMvcTest` under `src/test/java` to verify the authorization.

```java
package com.okta.developer.listings;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.okta.developer.listings.model.AirbnbListing;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles({"test", "seed"})
public class AirbnbListingMvcTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    public void collectionGet_noAuth_returnsUnauthorized() throws Exception {
        this.mockMvc.perform(get("/listing")).andExpect(status().isUnauthorized());
    }

    @Test
    public void collectionGet_withValidJwtToken_returnsOk() throws Exception {
        this.mockMvc.perform(get("/listing").with(jwt())).andExpect(status().isOk());
    }

    @Test
    public void save_withMissingAuhtorities_returnsForbidden() throws Exception {
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
        this.mockMvc.perform(post("/listing").content(json).with(jwt().authorities(new SimpleGrantedAuthority("listing_admin"))))
                .andDo(print())
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty());

    }
}
```

The test `collectionGet_noAuth_returnsUnauthorized` verifies that if no JWT token is present in the request, the service will return 404 Unauthorized.

The test `collectionGet_withValidJwtToken_returnsOk` verifies that with valid JWT authentication, the `/listing` GET returns 200 Ok.

The test `save_withMissingAuhtorities_returnsForbidden` verifies that if the JWT lacks the `listing_admin` authority, the save operation is denied with 403 Forbidden.

The test `save_withValidJwtToken_returnsCreated` mocks a JWT with the required authority and verifies the save operation succeeds and returns 201 Created.

Try the tests with:

```shell
./mvnw test
```

# Testing a WebFlux Resource Server with `mockOpaqueToken()`

The OpaqueToken is validated remotely with a request to the authorization server. Let's create a reactive microservice with OpaqueToken authentication.

```shell
http --download https://start.spring.io/starter.zip \
  type==maven-project \
  language==java \
  bootVersion==2.4.5.RELEASE \
  baseDir==theaters \
  groupId==com.okta.developer \
  artifactId==theaters \
  name==theaters \
  packageName==com.okta.developer.theaters \
  javaVersion==11 \
  dependencies==lombok,devtools,data-mongodb-reactive,webflux,flapdoodle-mongo,oauth2-resource-server,cloud-eureka
```

```shell
unzip theaters.zip
```

Add `com.nimbusds` dependency to the `pom.xml`, required for token introspection. Add also `spring-security-test` dependency. Remove the `test` scope in flapdoodle:
```xml
<dependency>
  <groupId>com.nimbusds</groupId>
  <artifactId>oauth2-oidc-sdk</artifactId>
  <version>8.19</version>
  <scope>runtime</scope>
</dependency>
<dependency>
  <groupId>org.springframework.security</groupId>
  <artifactId>spring-security-test</artifactId>
  <version>5.4.5</version>
  <scope>test</scope>
</dependency>
<dependency>
  <groupId>de.flapdoodle.embed</groupId>
  <artifactId>de.flapdoodle.embed.mongo</artifactId>
</dependency>
```

Token introspection involves a call to the authorization server, so create a client app with OktaCLI, as illustrated for the `api-gateway`.

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
      port: 27018
      database: theaters
  security:
    oauth2:
      resourceserver:
        opaque-token:
          introspection-uri: https://{yourOktaDomain}/oauth2/default/v1/introspect
          client-secret: {yourClientSecret}
          client-id: {yourClientId}

mongo-dump: /home/indiepopart/mongodb/theaters.bson
```
Create the reactive version of the `MongoDBSeeder` class:

```java
package com.okta.developer.theaters;

import com.mongodb.reactivestreams.client.MongoClient;
import com.mongodb.reactivestreams.client.MongoCollection;
import com.mongodb.reactivestreams.client.MongoDatabase;
import de.flapdoodle.embed.mongo.MongoRestoreExecutable;
import de.flapdoodle.embed.mongo.MongoRestoreProcess;
import de.flapdoodle.embed.mongo.MongoRestoreStarter;
import de.flapdoodle.embed.mongo.config.IMongoRestoreConfig;
import de.flapdoodle.embed.mongo.config.MongoRestoreConfigBuilder;
import de.flapdoodle.embed.mongo.config.Net;
import de.flapdoodle.embed.mongo.distribution.Version;
import de.flapdoodle.embed.process.runtime.Network;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.context.event.ContextRefreshedEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.io.File;
import java.io.IOException;

@Component
@Profile("seed")
public class MongoDBSeeder {

    private static Logger logger = LoggerFactory.getLogger(MongoDBSeeder.class);

    @Value("${mongo-dump}")
    private String mongoDump;

    @Value("${spring.data.mongodb.port}")
    private int mongoPort;

    @Autowired
    private MongoClient mongoClient;

    @EventListener
    public void seed(ContextRefreshedEvent event) {

        Flux<String> databaseNames = Flux.from(mongoClient.listDatabaseNames());
        databaseNames.subscribe(name -> {
            logger.info("DB: {}", name);
        });

        restore();

        databaseNames = Flux.from(mongoClient.listDatabaseNames());
        databaseNames.subscribe(database -> {
            logger.info("DB: {}", database);
            if ("theaters".equalsIgnoreCase(database)) {
                MongoDatabase db = mongoClient.getDatabase(database);

                Flux<String> collectionNames = Flux.from(db.listCollectionNames());
                collectionNames.subscribe(collection -> {
                    logger.info("Collection: {}", collection);
                    MongoCollection mongoCollection = db.getCollection(collection);
                    Mono<Long> count = Mono.from(mongoCollection.countDocuments());
                    count.subscribe(c -> {
                        logger.info("Documents count {}", c);
                    });
                });
            }
        });
    }

    public void restore() {
        try {
            File file = new File(mongoDump);
            if (!file.exists()) {
                throw new RuntimeException("File does not exist");
            }
            String name = file.getAbsolutePath();


            IMongoRestoreConfig mongoconfig = new MongoRestoreConfigBuilder()
                .version(Version.Main.PRODUCTION)
                .net(new Net(mongoPort, Network.localhostIsIPv6()))
                .db("theaters")
                .collection("theaters")
                .dropCollection(true)
                .dir(name)
                .build();

            MongoRestoreExecutable mongoRestoreExecutable = MongoRestoreStarter.getDefaultInstance().prepare(mongoconfig);
            MongoRestoreProcess mongoRestore = mongoRestoreExecutable.start();
            mongoRestore.stop();
        } catch (IOException e) {
            logger.error("Unable to restore mongodb", e);
        }
    }
}
```

Get the MongoDB dump files `theaters.bson`, `theaters.metadata.json` from [Github](https://github.com/huynhsamha/quick-mongo-atlas-datasets/tree/master/dump/sample_mflix). Place the files in the location specified in the property `mongo-dump`, in the `application.yml`.

Create the package `com.okta.developer.theaters.model` under `src/main/java`. Add the model class `Location` to map some of the fields in the dataset:

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

As Spring Data Rest does not support WebFlux, create a `TheatersController` in `com.okta.developer.theaters.controller` package:

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
            new NimbusReactiveOpaqueTokenIntrospector(oAuth2.getOpaquetoken().getIntrospectionUri(),
                oAuth2.getOpaquetoken().getClientId(),
                oAuth2.getOpaquetoken().getClientSecret());
    }

    public Mono<OAuth2AuthenticatedPrincipal> introspect(String token) {
        return this.delegate.introspect(token)
            .flatMap(principal -> enhance(principal));
    }

    private Mono<OAuth2AuthenticatedPrincipal> enhance(OAuth2AuthenticatedPrincipal principal) {
        Collection<GrantedAuthority> authorities = extractAuthorities(principal);
        OAuth2AuthenticatedPrincipal enhanced = new DefaultOAuth2AuthenticatedPrincipal(principal.getAttributes(), authorities);
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
Add `SecurityConfiguration` class, to configure `opakeToken` for authentication.

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


Update `TheatersApplicationTests` to disable eurkea client and the embedded MongoDB:

```java
package com.okta.developer.theaters;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles({"test", "exclude"})
class TheatersApplicationTests {

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

Create `src/test/resources/application-exclude.yml` with the following content:

```yaml
spring:
  autoconfigure:
    exclude: org.springframework.boot.autoconfigure.mongo.embedded.EmbeddedMongoAutoConfiguration
```

Create the package `com.okta.developer.theaters.controller` under `src/test/java`. Now, create `TheaterControllerTest` to verify the endpoints authoization.

```java
package com.okta.developer.theaters.controller;

import com.okta.developer.theaters.model.Location;
import com.okta.developer.theaters.model.Theater;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.AutoConfigureWebTestClient;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.reactive.server.WebTestClient;

import static org.springframework.security.test.web.reactive.server.SecurityMockServerConfigurers.mockOpaqueToken;
import static org.springframework.web.reactive.function.BodyInserters.fromValue;

@SpringBootTest
@AutoConfigureWebTestClient
@ActiveProfiles({"test", "seed"})
public class TheaterControllerTest {
    
    @Autowired
    private WebTestClient client;
    
    @Test
    public void collectionGet_noAuth_returnsUnauthorized() throws Exception {
        this.client.get().uri("/theater").exchange().expectStatus().isUnauthorized();
    }

    @Test
    public void collectionGet_withValidOpaqueToken_returnsOk() throws Exception {
        this.client.mutateWith(mockOpaqueToken()).get().uri("/theater").exchange().expectStatus().isOk();
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
        this.client.mutateWith(mockOpaqueToken().authorities(new SimpleGrantedAuthority("theater_admin")))
                .post().uri("/theater").body(fromValue(theater))
                .exchange()
                .expectStatus().isCreated()
                .expectBody().jsonPath("$.id").isNotEmpty();
    }
}
```

The test `collectionGet_noAuth_returnsUnauthorized` verifies the access is denied if there is no token in the request.

The test `collectionGet_withValidOpaqueToken_returnsOk` sets a mock opaqueToken in the request, so the controller must return 200 Ok.

The test `post_withMissingAuthorities_returnsFodbidden` verifies that without the required authorities, the controller rejects the request with 403 Forbidden.

The test `post_withValidOpaqueToken_returnsCreated` verifies that if `theater_admin` authority is present in the token, the create request will pass, returning the new `theater` in the response body.


Again, try the tests with:

```shell
./mvnw test
```

# On Mocking Features in Spring Security Test

Spring Security Test documentation indicates that when testing with `WebTestClient` and `mockOpaqueToken()` (or any other configurer), the request will pass correctly through any authentication API, and the mock authentication object will be available for the authorization mechanism to verify. The same applies for `MockMvc`. That is probably the reason why an invalid audience, expiration or issuer in the token attributes is ignored in this kind of test.
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

In the same way, if the `WebTestClient` or `MockMvc` mocks a different type of authentication than the expected, the test might pass as long as the controller injects an compatible authentication type. The test will pass depending on what the method under test is expecting to be in the `SecurityContextHolder`. For example, the `listings` service expects Jwt authentication, but the following `AirbnbListingMvcTest` test will pass:

```java
@Test
public void collectionGet_withOpaqueToken_returnsOk() throws Exception {
    this.mockMvc.perform(get("/listing").with(opaqueToken())).andExpect(status().isOk());
}
```

# Verify Authorization and Audience Validation

Let's run an end-to-end test using HTTPie, to verify the authorization, and also that the audience is enforced in both services.

First, create an eureka server:
```shell
http --download https://start.spring.io/starter.zip \
  type==maven-project \
  language==java \
  bootVersion==2.4.5.RELEASE \
  baseDir==eureka \
  groupId==com.okta.developer \
  artifactId==eureka \
  name==eureka \
  packageName==com.okta.developer.eureka \
  javaVersion==11 \
  dependencies==cloud-eureka-server
```

```shell
unzip eureka.zip
```

Edit `EurekaServiceApplication` to add `@EnableEurekaServer` annotation:

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
Start the service:

```shell
./mvnw spring-boot:run
```
Go to `http://localhost:8761` and you should see the Eureka home.

Configure `theater` and `listing` routes in the `api-gateway`. Edit `ApiGatewayApplication` to add the `RouteLocator` bean:

```java
package com.okta.developer.gateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.cloud.security.oauth2.gateway.TokenRelayGatewayFilterFactory;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class ApiGatewayApplication {

    public static void main(String[] args) {
        SpringApplication.run(ApiGatewayApplication.class, args);
    }

    @Bean
    public RouteLocator routeLocator(RouteLocatorBuilder builder, TokenRelayGatewayFilterFactory filterFactory) {
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

Run the `api-gateway`:
```shell
./mvnw spring-boot:run
```

Go to `http://localhost:8080/userdata`, after the Okta login, you should see an output similar to this:
```json
{
   "userName":"...",
   "idToken":"...",
   "accessToken":"..."
}
```

Run the `theaters` and `listings` microservices with:
```shell
./mvnw spring-boot:run -Dspring-boot.run.profiles=seed
```
After both services register to the eureka server, you can test the `api-gateway` endpoints `http://localhost:8080/theater` and `http://localhost:8080/listing`.


Now, let's test authorization with a POST to the `/listing` endpoint.
Copy the `accessToken` value from the `/userdata` output and set it as an environment variable:

```shell
ACCESS_TOKEN={accessToken}
```
```shell
http POST http://localhost:8080/listing name=test "Authorization:Bearer ${ACCESS_TOKEN}"
```
You will see the following response:
```
HTTP/1.1 403 Forbidden
WWW-Authenticate: Bearer error="insufficient_scope", error_description="The request requires higher privileges than provided by the access token.", error_uri="https://tools.ietf.org/html/rfc6750#section-3.1"
```

This is because the `listings` service expects `listing_admin` authority to accept the POST request. The Okta Spring Boot Starter will automatically assign the content of the `groups` claim as authorities. Login to the Okta dashboard, and create `listing_admin` group, and assign your user to it.

Then, add the `groups` claim to the access token. Run `okta login` and open the resulting URL in your browser. Sign in to the Okta Admin Consoel and go to **Security** > **API**. Choose the `default` authorization server. Go to **Claims** and add a claim. Set the following values:

- Name: `groups`
- Include in token type: `Access Token`
- Value type: `Groups`
- Filter: Matches regex (set filter value to `.*`)

Open an incognito window, and request `/userdata` endpoint, to repeat the login and obtain a new access token with the `groups` claim. Repeat the HTTPie POST request, and now it should be accepted!

Stop the `listings` service and change the expected audience in `application.yml`:

```yaml
okta:
  oauth2:
    issuer: https://{yourOktaDomain}/oauth2/default
    audience: api://custom
```

Restart the service and repeat the HTTPie POST request:

```shell
http POST http://localhost:8080/listing name=test "Authorization:Bearer ${ACCESS_TOKEN}"
```

You will see the following response:

```
HTTP/1.1 401 Unauthorized
WWW-Authenticate: Bearer error="invalid_token", error_description="An error occurred while attempting to decode the Jwt: This aud claim is not equal to the configured audience", error_uri="https://tools.ietf.org/html/rfc6750#section-3.1"
```

You can verify the same in the `theaters` service.

# Learn More About Spring Security

I hope you enjoyed this tutorial and understand more about `SecurityMockServerConfigurers` in reactive test support , and `SecurityMockMvcRequestPostProcessors` in MockMvc test support, available since Spring Security 5, how useful they can be for integration testing, and what are the limitations of request and response mocking. 

You can find all the code of this tutorial on GitHub, in the [okta-spring-security-test-example](https://github.com/oktadeveloper/okta-spring-security-test-example) repository.

Check out the links below to learn more about Spring Security 5 and Okta authentication patterns:

- [SecurityMockMvcRequestPostProcessors](https://docs.spring.io/spring-security/site/docs/5.4.5/reference/html5/#test-mockmvc-smmrpp)
- [WebTestClientSupport](https://docs.spring.io/spring-security/site/docs/5.4.5/reference/html5/#test-webtestclient)
- [Security Patterns for Microservice Architectures](/blog/2020/03/23/microservice-security-patterns)
- [OAuth 2.0 Patterns with Spring Cloud Gateway](/blog/2020/08/14/spring-gateway-patterns)
- [JWT vs Opaque Access Tokens: Use Both With Spring Boot](/blog/2020/08/07/spring-boot-remote-vs-local-tokens)

// todo: call to action to follow us
