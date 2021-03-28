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

# Mock Test in a Webflux Gateway
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

With `@AutoConfigureWebTestClient`, Spring Boot initializes a `WebTestClient`, that can be injected to the test classes. The alternative for mock web testing is`@WebFluxTest`, it also configures a `WebTestClient`, but the test is limited to a single controller, and _collaborators need to be mocked_.

The test `get_noAuth_returnsRedirectLogin` verifies that the server will redirect to the OIDC Login flow if no authentication is present.

The test `get_withOidcLogin_returnsOk` configures the mock request with an OidcUser, using `mockOidcLogin()`. The mock OidcUser.idToken is modified adding the `name` claim, because `UserDataController` expects it for populating the response.`mockOidcLogin()` belongs to a set of `SecurityMockServerConfigurers` that ship with Spring Security Test 5.4.5, as part of the new Reactive Test Support features.

Run the tests with:

```shell
./mvnw test
```






# Mock Test for a JWT Servlet Resource Server

JWT validation

Now, let's create a MongoDB microservice for lodge listings, using Spring Data Rest. On application load, a sample dataset will be seeded to the embedded MongoDB instance initialized by Flapdoodle.

```shell
http --download https://start.spring.io/starter.zip \
  type==maven-project \
  language==java \
  bootVersion==2.4.3.RELEASE \
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
Again, add the `spring-security-test` dependency to the `pom.xml`, and remove the `test` scope in flappdoodle dependency:

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

```yml
server:
  port: 8081

spring:
  application:
    name: listings
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

Get the MongoDB dump files `listingsAndReviews.bson`, `listingsAndreviews.metadata.json` from [Github](https://github.com/huynhsamha/quick-mongo-atlas-datasets/tree/master/dump/sample_airbnb). Place the files in the location specified in the porperty `mongo-dump`, in the `application.yml`.

Add a model class `AirbnbListing`:

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

Add the listing repository `AirbnbListingRepository`:


```java
package com.okta.developer.listings.repository;

import com.okta.developer.listings.model.AirbnbListing;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;
import org.springframework.security.access.prepost.PreAuthorize;

@RepositoryRestResource(collectionResourceRel = "airbnb", path="listings")
public interface AirbnbListingRepository extends MongoRepository<AirbnbListing, String> {

    @Override
    @PreAuthorize("hasAuthority('listing_admin')")
    AirbnbListing save(AirbnbListing s);

}
```
The annotation `@RepositoryRestResource` directs Spring MVC to create the RESTful endpoints at the specified `path`.
The `save` operation is overridden to configure authorization, requiring the authority `listing_admin`.


Add a `RestConfiguration` class for tweaking the Spring Data Rest responses:

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

Add `SecurityConfiguration` to require JWT authentication for all requests:

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

```yml
spring:
  cloud:
    discovery:
      enabled: false
```


Create `src/test/resources/application-exclude.yml` with the following content:

```yml
spring:
  autoconfigure:
    exclude: org.springframework.boot.autoconfigure.mongo.embedded.EmbeddedMongoAutoConfiguration
```

Now, create `AirbnbListingMvcTest` to verify the authorization.

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
        this.mockMvc.perform(get("/listings")).andExpect(status().isUnauthorized());
    }

    @Test
    public void collectionGet_withValidJwtToken_returnsOk() throws Exception {
        this.mockMvc.perform(get("/listings").with(jwt())).andExpect(status().isOk());
    }

    @Test
    public void save_withMissingAuhtorities_returnsForbidden() throws Exception {
        AirbnbListing listing = new AirbnbListing();
        listing.setName("test");
        String json = objectMapper.writeValueAsString(listing);
        this.mockMvc.perform(post("/listings").content(json).with(jwt()))
                .andExpect(satus().isForbidden());
    }

    @Test
    public void save_withValidJwtToken_returnsCreated() throws Exception {
        AirbnbListing listing = new AirbnbListing();
        listing.setName("test");
        String json = objectMapper.writeValueAsString(listing);
        this.mockMvc.perform(post("/listings").content(json).with(jwt().authorities(new SimpleGrantedAuthority("listing_admin"))))
                .andDo(print())
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNotEmpty());

    }
}
```

The test `collectionGet_noAuth_returnsUnauthorized` verifies that if no JWT token is present in the request, the service will return 404 Unauthorized.

The test `collectionGet_withValidJwtToken_returnsOk` verifies that with valid JWT authentication, the `/listings` GET returns 200 Ok.

The test `save_withMissingAuhtorities_returnsForbidden` verifies that if the JWT lacks the `listing_admin` authority, the save operation is denied with 403 Forbidden.

The test `save_withValidJwtToken_returnsCreated` mocks a JWT with the required authority, and verifies the save operation succeeds and returns 201 Created.

Try the tests with:

```shell
./mvnw test
```

Document mongosh

** Manual WebTestClient configuration to check audience validation**

# Mock Test for an OpaqueToken Webflux Resource Server

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
