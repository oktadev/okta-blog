---
layout: blog_post
title: "Java Microservices with Spring Boot and Spring Cloud"
author: matt-raible
by: advocate
communities: java
description: "This tutorial shows you how to build a microservices architecture with Spring Boot and Spring Cloud."
tags: [java, microservices, spring-boot, spring-cloud, spring-cloud-config, jhipster]
image: blog/java-microservices/java-microservices.png
type: conversion
github: https://github.com/oktadev/auth0-java-microservices-examples/tree/main/spring-boot-gateway-webflux
---

<!-- For Auth0: 

path: java-microservices-spring-boot-spring-cloud
layout: 'post'
title: Java Microservices with Spring Boot and Spring Cloud
description: This tutorial shows you how to build a microservices architecture with Spring Boot and Spring Cloud.
metaTitle: Java Microservices with Spring Boot and Spring Cloud
metaDescription: This tutorial shows you how to build a microservices architecture with Spring Boot and Spring Cloud.
heroImage: https://developer.okta.com/assets-jekyll/blog/java-microservices/java-microservices-01568db38a22ed4c956c02810fb88f859e486ea9b46b2339325db6588d888089.png
dateCreated: '2023-08-17T00:00'
authors:
  - path: "matt-raible"
    name: "Matt Raible"
    avatar: https://images.ctfassets.net/23aumh6u8s0i/1ciaQDb4CM5f7DxRX8gqUG/9d23ca769683d021a01d4702a2e4ffad/matt-raible.jpeg
    jobTitle: "Developer Advocate"
type: Core Team Member
category:
  - Developers
  - Tutorial
  - Java
  - Spring Boot
  - Microservices
tags:
  - java
  - spring-boot
  - spring-cloud
  - microservices
postsRelated:
  - terraform-eks-java-microservices
  - micro-frontends-for-java-microservices
  - jimenas-post-on-keycloak
-->

Adopting a microservices architecture provides unique opportunities to add failover and resiliency to your systems so your components can gracefully handle load spikes and errors. Microservices make change less expensive, too. They can also be a good idea when you have a large team working on a single product. You can break up your project into components that can function independently. Once components can operate independently, they can be built, tested, and deployed separately. This gives an organization and its teams the agility to develop and deploy quickly.

Java is an excellent language with a vast open source ecosystem for developing a microservice architecture. In fact, some of the biggest names in our industry use Java and contribute to its ecosystem. Have you ever heard of Netflix, Amazon, or Google? What about eBay, Twitter, and LinkedIn? Yes, web-scale companies handling incredible traffic are doing it with Java.

Implementing a microservices architecture in Java isn't for everyone. For that matter, implementing microservices, in general, isn't often needed. Most companies do it to scale their people, not their systems. Even Martin Fowler's original blog post on [Microservices](https://martinfowler.com/articles/microservices.html) recommends against it:

> One reasonable argument we've heard is that you shouldn't start with a microservices architecture. Instead begin with a monolith, keep it modular, and split it into microservices once the monolith becomes a problem.

The Java ecosystem has some well-established patterns for developing microservice architectures. If you're familiar with Spring, you'll feel right at home developing with Spring Boot and Spring Cloud. Since that's one of the quickest ways to get started, I figured I'd walk you through a quick example.

This example contains a microservice with a REST API that returns a list of cool cars. It uses Netflix Eureka for service discovery, WebClient for remote communication, and Spring Cloud Gateway to route requests to the microservice. It integrates Spring Security and OAuth 2.0, so only authenticated users can access the API gateway and microservice. It also uses Resilience4j to add fault tolerance to the gateway.

{% img blog/spring-boot-microservices/spring-cloud-gateway-with-cars.png alt:"Spring Boot Microservices" %}{: .center-image }

**Table of Contents**{: .hide }
* Table of Contents
{:toc}

## Create Java Microservices with Spring Boot and Spring Cloud

I like to show developers how to build everything from scratch. Today, I'm going to take a different approach. First, I'll show you how to get the completed example working. Then, I'll explain how I created everything and the trials and tribulations I encountered along the way.

You can start by cloning the [@oktadev/auth0-java-microservices-examples](https://github.com/oktadev/auth0-java-microservices-examples) repository.

```shell
git clone https://github.com/oktadev/auth0-java-microservices-examples.git
cd auth0-java-microservices-examples/spring-boot-gateway-webflux
```

In the `spring-boot-gateway-webflux` directory, there are three projects:

* **discovery-service**: a Netflix Eureka server used for service discovery.
* **car-service**: a simple Car Service that uses Spring Data REST to serve up a REST API of cars.
* **api-gateway**: an API gateway with a `/cool-cars` endpoint that talks to the car service and filters out cars that aren't cool (in my opinion, of course).

### Run a Secure Spring Boot Microservice Architecture

To run the example, you must [install the Auth0 CLI](https://github.com/auth0/auth0-cli#installation) and create an Auth0 account. If you don't have an Auth0 account, [sign up for free](https://auth0.com/signup). I recommend using [SDKMAN!](https://sdkman.io) to install Java 17+.

First, start the discovery service:

```shell
cd discovery-service
./gradlew bootRun
```

Before it starts, you'll need to configure the API gateway to use your Auth0 account.

Open a terminal and run `auth0 login` to configure the Auth0 CLI to get an API key for your tenant. Then, run `auth0 apps create` to register an OpenID Connect (OIDC) app with the appropriate URLs:

```shell
auth0 apps create \
  --name "Kick-Ass Cars" \
  --description "Microservices for Cool Cars" \
  --type regular \
  --callbacks http://localhost:8080/login/oauth2/code/okta \
  --logout-urls http://localhost:8080 \
  --reveal-secrets
```

Copy `api-gateway/.env.example` to `.env` and edit to contain the values from the command above.

```dotenv
OKTA_OAUTH2_ISSUER=https://<your-auth0-domain>/
OKTA_OAUTH2_CLIENT_ID=
OKTA_OAUTH2_CLIENT_SECRET=
OKTA_OAUTH2_AUDIENCE=https://<your-auth0-domain>/api/v2/
```

At startup, these properties will be read using [spring-dotenv](https://github.com/paulschwarz/spring-dotenv).

Run `./gradlew bootRun` to start the API gateway, or use your IDE to run it.

Copy `car-service/.env.example` to `.env` and update its values.

```dotenv
OKTA_OAUTH2_ISSUER=https://<your-auth0-domain>/
OKTA_OAUTH2_AUDIENCE=https://<your-auth0-domain>/api/v2/
```

Start it with `./gradlew bootRun` and open `http://localhost:8080` in your favorite browser. You'll be redirected to Auth0 to log in.

{% img blog/spring-boot-microservices/auth0-login.png alt:"Auth0 Login" %}{: .center-image }

After authenticating, you'll see your name in lights! ✨

{% img blog/spring-boot-microservices/name-in-lights.png alt:"Your name in lights" %}{: .center-image }

You can navigate to the following URLs in your browser for different results:

- `http://localhost:8080/print-token`: prints access token to the console
- `http://localhost:8080/cool-cars`: returns a list of cool cars
- `http://localhost:8080/home`: proxies request to the car service and prints JWT claims to the console

You can see the access token's contents by copying/pasting it into [jwt.io](https://jwt.io). You can also access the car service directly using it.

```shell
TOKEN=<access-token>
http :8090/cars Authorization:"Bearer $TOKEN"
```

{% img blog/spring-boot-microservices/car-service-with-token.png alt:"Car Service with HTTPie and access token" %}{: .center-image }

Pretty cool, eh? 😎

## My Developer Story with Spring Boot and Spring Cloud

A few years ago, I created an [example similar to this one](http://developer.okta.com/blog/2019/05/22/java-microservices-spring-boot-spring-cloud) with Spring Boot 2.2. It used Feign for remote connectivity, Zuul for routing, Hystrix for failover, and Spring Security for OAuth. The September 2023 version of Spring Cloud has [Spring Cloud OpenFeign](https://spring.io/projects/spring-cloud-openfeign) for remote connectivity, [Spring Cloud Gateway](https://spring.io/projects/spring-cloud-gateway) for routing, and [Resilience4j](https://resilience4j.readme.io/) for fault tolerance.

Okta also now has an [Okta Spring Boot starter](https://github.com/okta/okta-spring-boot). I didn't use it in my first experiment, but I'm a big fan of it after the last few years! It dramatically simplifies configuration and makes securing your apps with OAuth 2.0 and OIDC easy. It's a thin wrapper around Spring Security's resource server, OAuth client, and OIDC features. Not only that, but it works with Okta Workforce Identity, Okta Customer Identity (aka Auth0), and even Keycloak.

I created all of these applications using [start.spring.io](https://start.spring.io)'s REST API and [HTTPie](https://httpie.org).

```shell
https start.spring.io/starter.zip bootVersion==3.1.3 \
  artifactId==discovery-service name==eureka-service \
  dependencies==cloud-eureka-server baseDir==discovery-service | tar -xzvf -

https start.spring.io/starter.zip bootVersion==3.1.3 \
  artifactId==car-service name==car-service baseDir==car-service \
  dependencies==actuator,cloud-eureka,data-jpa,data-rest,postgresql,web,validation,devtools,docker-compose,okta | tar -xzvf -

https start.spring.io/starter.zip bootVersion==3.1.3 \
  artifactId==api-gateway name==api-gateway baseDir==api-gateway \
  dependencies==cloud-eureka,cloud-feign,data-rest,web,okta | tar -xzvf -
```` 

You might notice the `api-gateway` project doesn't have `cloud-gateway` as a dependency. That's because I started without it and didn't add it until I needed to proxy requests by path.

After creating these three projects, I ran `chmod +x gradlew` in each directory to make the Gradle wrapper executable.

## Service Discovery with Netflix Eureka

The `discovery-service` is configured the same as you would most Eureka servers. It has an `@EnableEurekaServer` annotation on its main class and properties that set its port and turn off discovery.

```properties
server.port=8761
eureka.client.register-with-eureka=false
```

The `car-service` and `api-gateway` projects are configured similarly. Both have a unique name defined, and `car-service` is configured to run on port `8090` so it doesn't conflict with `8080`.

`car-service/src/main/resources/application.properties`
```properties
server.port=8090
spring.application.name=car-service
```

`api-gateway/src/main/resources/application.properties`
```properties
spring.application.name=api-gateway
```

`@EnableDiscoveryClient` annotates the main class in both projects.

## Build a Java Microservice with Spring Data REST

The `car-service` provides a REST API that lets you CRUD (Create, Read, Update, and Delete) cars. It creates a default set of cars when the application loads using an `ApplicationRunner` bean.

`car-service/src/main/java/com/example/carservice/CarServiceApplication.java`
```java
package com.example.carservice;

import com.example.carservice.data.Car;
import com.example.carservice.data.CarRepository;
import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.context.annotation.Bean;

import java.util.stream.Stream;

@EnableDiscoveryClient
@SpringBootApplication
public class CarServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(CarServiceApplication.class, args);
    }

    @Bean
    ApplicationRunner init(CarRepository repository) {
        repository.deleteAll();
        return args -> {
            Stream.of("Ferrari", "Jaguar", "Porsche", "Lamborghini", "Bugatti",
                "AMC Gremlin", "Triumph Stag", "Ford Pinto", "Yugo GV").forEach(name -> {
                repository.save(new Car(name));
            });
            repository.findAll().forEach(System.out::println);
        };
    }
}
```

The `CarRepository` interface makes persisting and fetching cars from the database easy.

```java
package com.example.carservice.data;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;

@RepositoryRestResource
public interface CarRepository extends JpaRepository<Car, Long> {
}
```

The `Car` class is a simple JPA entity with an `id` and `name` property. Spring Boot will see PostgreSQL on its classpath and autoconfigure connectivity. A `docker-compose.yml` file exists in the root directory to start a PostgreSQL instance.

```yaml
version: '3.1'
services:
  postgresql:
    image: postgres:15
    environment:
      - POSTGRES_USER=oktadev
      - POSTGRES_PASSWORD=auth0
      - POSTGRES_HOST_AUTH_METHOD=trust
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U $${POSTGRES_USER}']
      interval: 5s
      timeout: 5s
      retries: 10
    # If you want to expose these ports outside your dev PC,
    # remove the "127.0.0.1:" prefix
    ports:
      - 127.0.0.1:5432:5432
```

Spring Boot added [Docker Compose support](https://spring.io/blog/2023/06/21/docker-compose-support-in-spring-boot-3-1) in version 3.1. This means that if you add the following dependency to your `build.gradle`, it'll look for a `docker-compose.yml` (or `compose.yml`) file in the root directory and start it when you run `./gradlew bootRun`.

```groovy
developmentOnly 'org.springframework.boot:spring-boot-docker-compose'
```

Finally, the `application.properties` has a setting to create the database automatically.

```properties
spring.jpa.hibernate.ddl-auto=update
```

## Connect to Java Microservices with Spring Cloud OpenFeign

Next, I configured OpenFeign in the `api-gateway` project to connect to the car service and its `/cars` endpoint. Then, I mapped a `Car` record to the JSON that's returned. I exposed it as a `/cool-cars` endpoint.

```java 
package com.example.apigateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.client.discovery.EnableDiscoveryClient;
import org.springframework.cloud.openfeign.EnableFeignClients;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.hateoas.CollectionModel;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Collection;
import java.util.stream.Collectors;

@EnableFeignClients
@EnableDiscoveryClient
@SpringBootApplication
public class ApiGatewayApplication {

    public static void main(String[] args) {
        SpringApplication.run(ApiGatewayApplication.class, args);
    }
}

record Car(String name) {
}

@FeignClient("car-service")
interface CarClient {

    @GetMapping("/cars")
    CollectionModel<Car> readCars();
}

@RestController
class CoolCarController {

    private final CarClient carClient;

    public CoolCarController(CarClient carClient) {
        this.carClient = carClient;
    }

    @GetMapping("/cool-cars")
    public Collection<Car> coolCars() {
        return carClient.readCars()
                .getContent()
                .stream()
                .filter(this::isCool)
                .collect(Collectors.toList());
    }

    private boolean isCool(Car car) {
        return !car.name().equals("AMC Gremlin") &&
                !car.name().equals("Triumph Stag") &&
                !car.name().equals("Ford Pinto") &&
                !car.name().equals("Yugo GV");
    }
}
```

This worked great, but I still wanted to proxy `/home` to the downstream car service.

## Add Routing with Spring Cloud Gateway

I immediately discovered that adding `spring-cloud-starter-gateway` as a dependency caused issues. First, I had Spring MVC in my classpath, and Spring Cloud Gateway uses WebFlux. WebFlux recommends using WebClient over Feign and Resilience4J over Hystrix. I decided to switch to WebClient and Resilience4J.

I had to remove the following dependencies from my original `api-gateway` project.

```groovy
implementation 'org.springframework.boot:spring-boot-starter-data-rest'
implementation 'org.springframework.boot:spring-boot-starter-web'
implementation 'org.springframework.cloud:spring-cloud-starter-openfeign'
```

And add Spring Cloud Gateway with Resilience4j dependencies:

```groovy
implementation 'org.springframework.cloud:spring-cloud-starter-circuitbreaker-reactor-resilience4j'
implementation 'org.springframework.cloud:spring-cloud-starter-gateway'
```

Then, I moved `CoolCarController` to its own class and re-implemented it with WebClient.

```java
package com.example.apigateway.web;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.client.circuitbreaker.ReactiveCircuitBreaker;
import org.springframework.cloud.client.circuitbreaker.ReactiveCircuitBreakerFactory;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;

@RestController
class CoolCarController {

    Logger log = LoggerFactory.getLogger(CoolCarController.class);

    private final WebClient.Builder webClientBuilder;
    private final ReactiveCircuitBreaker circuitBreaker;

    public CoolCarController(WebClient.Builder webClientBuilder,
                             ReactiveCircuitBreakerFactory circuitBreakerFactory) {
        this.webClientBuilder = webClientBuilder;
        this.circuitBreaker = circuitBreakerFactory.create("circuit-breaker");
    }

    record Car(String name) {
    }

    @GetMapping("/cool-cars")
    public Flux<Car> coolCars() {
        return circuitBreaker.run(
            webClientBuilder.build()
                .get().uri("http://car-service/cars")
                .retrieve().bodyToFlux(Car.class)
                .filter(this::isCool),
            throwable -> {
                log.warn("Error making request to car service", throwable);
                return Flux.empty();
            });
    }

    private boolean isCool(Car car) {
        return !car.name().equals("AMC Gremlin") &&
            !car.name().equals("Triumph Stag") &&
            !car.name().equals("Ford Pinto") &&
            !car.name().equals("Yugo GV");
    }
}
```

In the `car-service` project, I had to switch from using Spring Data REST to handling it with a `@RestController` and `@GetMapping` annotation. I removed the `@RepositoryRestResource` annotation from `CarRepository` and added a `CarController` class.

```java
package com.example.carservice.web;

import com.example.carservice.data.Car;
import com.example.carservice.data.CarRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
class CarController {

    private final CarRepository repository;

    public CarController(CarRepository repository) {
        this.repository = repository;
    }

    @GetMapping("/cars")
    public List<Car> getCars() {
        return repository.findAll();
    }
}
```

To proxy `/home` to the downstream microservice, I added a `api-gateway/src/main/resources/application.yml` file to configure Spring Cloud Gateway to enable service discovery and specify routes.

```yaml
spring:
  cloud:
    gateway:
      discovery:
        locator:
          enabled: true
      routes:
        - id: car-service
          uri: lb://car-service
          predicates:
            - Path=/home/**
```

At this point, I could access the car service directly at `http://localhost:8090/cars` and through the gateway at `http://localhost:8080/home`.

## Secure Spring Boot Microservices with OAuth 2.0 and OIDC

To configure the Okta Spring Boot starter, there are a few properties in the `api-gateway` project's `application.properties` file.

```properties
okta.oauth2.issuer=${OKTA_OAUTH2_ISSUER}
okta.oauth2.client-id=${OKTA_OAUTH2_CLIENT_ID}
okta.oauth2.client-secret=${OKTA_OAUTH2_CLIENT_SECRET}
okta.oauth2.audience=${OKTA_OAUTH2_AUDIENCE}
```

The `car-service` is configured as an OAuth resource server and has the following properties in its `application.properties` file.

```properties
okta.oauth2.issuer=${OKTA_OAUTH2_ISSUER}
okta.oauth2.audience=${OKTA_OAUTH2_AUDIENCE}
```

The variables are read from the `.env` file in each project's root directory.

### Fetch an Access Token as a JWT

When I first got things working, I was able to log in to the gateway, but when I tried to connect to the downstream microservice, it said the JWT was invalid. For this reason, I added a `/print-token` endpoint to the gateway that prints the access token to the console.

```java
package com.example.apigateway.web;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.annotation.RegisteredOAuth2AuthorizedClient;
import org.springframework.security.oauth2.core.OAuth2AccessToken;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
class HomeController {

    @GetMapping("/")
    public String howdy(@AuthenticationPrincipal OidcUser user) {
        return "Hello, " + user.getFullName();
    }

    @GetMapping("/print-token")
    public String printAccessToken(@RegisteredOAuth2AuthorizedClient("okta")
                                   OAuth2AuthorizedClient authorizedClient) {

        OAuth2AccessToken accessToken = authorizedClient.getAccessToken();

        System.out.println("Access Token Value: " + accessToken.getTokenValue());
        System.out.println("Token Type: " + accessToken.getTokenType().getValue());
        System.out.println("Expires At: " + accessToken.getExpiresAt());

        return "Access token printed";
    }
}
```

Using jwt.io, I verified that it wasn't a valid JWT. I thought about trying to implement Spring Security's [opaque token support](http://developer.okta.com/blog/2020/08/07/spring-boot-remote-vs-local-tokens), but discovered Auth0 [doesn't have an `/instropection` endpoint](https://community.auth0.com/t/introspection-endpoint-for-opaque-tokens-or-more-flexible-rules-to-get-clear-jwt-access-token/63866). This makes it impossible to use opaque tokens with Auth0.

The good news is I figured out a workaround! If you pass a valid `audience` parameter to Auth0, you'll get a JWT for the access token. I logged an [issue to improve the Okta Spring Boot starter](https://github.com/okta/okta-spring-boot/issues/596) and added a `SecurityConfiguration` class to solve the problem in the meantime.

```java
package com.example.apigateway.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.oauth2.client.registration.ReactiveClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.server.DefaultServerOAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.client.web.server.ServerOAuth2AuthorizationRequestResolver;
import org.springframework.security.oauth2.core.endpoint.OAuth2AuthorizationRequest;
import org.springframework.security.web.server.SecurityWebFilterChain;

import java.util.function.Consumer;

@Configuration
public class SecurityConfiguration {

    @Value("${okta.oauth2.audience:}")
    private String audience;

    private final ReactiveClientRegistrationRepository clientRegistrationRepository;

    public SecurityConfiguration(ReactiveClientRegistrationRepository clientRegistrationRepository) {
        this.clientRegistrationRepository = clientRegistrationRepository;
    }

    @Bean
    public SecurityWebFilterChain filterChain(ServerHttpSecurity http) throws Exception {
        http
            .authorizeExchange(authz -> authz
                .anyExchange().authenticated()
            )
            .oauth2Login(oauth2 -> oauth2
                .authorizationRequestResolver(
                    authorizationRequestResolver(this.clientRegistrationRepository)
                )
            );
        return http.build();
    }

    private ServerOAuth2AuthorizationRequestResolver authorizationRequestResolver(
        ReactiveClientRegistrationRepository clientRegistrationRepository) {

        DefaultServerOAuth2AuthorizationRequestResolver authorizationRequestResolver =
            new DefaultServerOAuth2AuthorizationRequestResolver(
                clientRegistrationRepository);
        authorizationRequestResolver.setAuthorizationRequestCustomizer(
            authorizationRequestCustomizer());

        return authorizationRequestResolver;
    }

    private Consumer<OAuth2AuthorizationRequest.Builder> authorizationRequestCustomizer() {
        return customizer -> customizer
            .additionalParameters(params -> params.put("audience", audience));
    }
}
```

I was able to get the OpenFeign client to work by adding a couple of properties to enable OAuth:

```properties
spring.cloud.openfeign.oauth2.enabled=true
spring.cloud.openfeign.oauth2.clientRegistrationId=okta
```

To make Spring Cloud Gateway pass the access token downstream, I added `TokenRelay` to its default filters in `application.yml`:

```yaml
spring:
  cloud:
    gateway:
      discovery:
        locator:
          enabled: true
      default-filters:
        - TokenRelay
      routes: ...
```

I added a `WebClientConfiguration` class to configure `WebClient` to include the access token with its requests.

```java
package com.example.apigateway.config;

import org.springframework.cloud.client.loadbalancer.LoadBalanced;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.client.registration.ReactiveClientRegistrationRepository;
import org.springframework.security.oauth2.client.web.reactive.function.client.ServerOAuth2AuthorizedClientExchangeFilterFunction;
import org.springframework.security.oauth2.client.web.server.ServerOAuth2AuthorizedClientRepository;
import org.springframework.web.reactive.function.client.WebClient;

@Configuration
public class WebClientConfiguration {

    @Bean
    @LoadBalanced
    public WebClient.Builder webClientBuilder(ReactiveClientRegistrationRepository clientRegistrations,
                                              ServerOAuth2AuthorizedClientRepository authorizedClients) {
        var oauth = new ServerOAuth2AuthorizedClientExchangeFilterFunction(clientRegistrations, authorizedClients);
        oauth.setDefaultClientRegistrationId("okta");
        return WebClient
            .builder()
            .filter(oauth);
    }

}
```

## Spring Boot Microservices and Refresh Tokens

In my previous example, I couldn't get refresh tokens to work. I was able to get them to work this time! I changed the default scopes in `api-gateway` to request a refresh token using the `offline_access` scope.

`.env`
```dotenv
OKTA_OAUTH2_AUDIENCE=https://fast-expiring-api
OKTA_OAUTH2_SCOPES=openid,profile,email,offline_access
```

`src/main/resources/application.properties`
```properties
okta.oauth2.scopes=${OKTA_OAUTH2_SCOPES}
```

Then, I created an API in Auth0 called `fast-expiring-api` and set the TTL to 30 seconds.

```shell
auth0 apis create --name fast-expiring --identifier https://fast-expiring-api \
  --token-lifetime 30 --offline-access --no-input
```

If you do the same, you can restart the API gateway and go to `http://localhost:8080/print-token` to see your access token. You can copy the expired time to [timestamp-converter.com](https://www.timestamp-converter.com/) to see when it expires in your local timezone. Wait 30 seconds and refresh the page. You'll see a request for a new token and an updated `Expires At` timestamp in your terminal.

## The Okta Spring Boot starter and Keycloak

If you find yourself in a situation where you don't have an internet connection, it can be handy to run Keycloak locally in a Docker container. Since the Okta Spring Boot starter is a thin wrapper around Spring Security, it works with Keycloak, too.

In my experience, Spring Security's OAuth support works with any OAuth 2.0-compliant server. The Okta Spring Boot starter does validate the issuer to ensure it's an Okta URL, so you must use Spring Security's properties instead of the `okta.oauth2.*` properties when using Keycloak.

An easy way to get a pre-configured Keycloak instance is to use [JHipster](https://www.jhipster.tech)'s `jhipster-sample-app-oauth2` application. It gets updated with every JHipster release. You can clone it with the following command:

```shell
git clone https://github.com/jhipster/jhipster-sample-app-oauth2.git --depth=1
cd jhipster-sample-app-oauth2
```

Then, start its Keycloak instance:

```shell
docker-compose -f src/main/docker/keycloak.yml up -d
```

You can configure the `api-gateway` to use Keycloak by removing the `okta.oauth2.*` properties and using Spring Security's in `application.properties`:

```properties
spring.security.oauth2.client.provider.okta.issuer-uri=http://localhost:9080/realms/jhipster
spring.security.oauth2.client.registration.okta.client-id=web_app
spring.security.oauth2.client.registration.okta.client-secret=web_app
spring.security.oauth2.client.registration.okta.scope=openid,profile,email,offline_access
```

The `car-service` requires similar changes in its `application.properties` file:

```properties
spring.security.oauth2.resourceserver.jwt.issuer-uri=http://localhost:9080/realms/jhipster
spring.security.oauth2.resourceserver.jwt.audiences=account
```

Restart both apps, open `http://localhost:8080`, and you'll be able to log in with Keycloak.

{% img blog/spring-boot-microservices/keycloak-login.png alt:"Spring Boot Microservices with Keycloak" %}{: .center-image }

Use `admin`/`admin` for credentials, and you can access `http://localhost:8080/cool-cars` as you did before.

{% img blog/spring-boot-microservices/cool-cars.png alt:"Results from /cool-cars endpoint" %}{: .center-image }

## Have fun with Spring Boot and Spring Cloud!

I hope you liked this tour of how to build Java microservice architectures with Spring Boot and Spring Cloud. You learned how to build everything with minimal code and then configure it to be secure with Spring Security, OAuth 2.0, and Auth0 by Okta.

You can find all the code shown in this tutorial on GitHub in the [@oktadev/auth0-java-microservices-examples repository](https://github.com/oktadev/auth0-java-microservices-examples/tree/main/spring-boot-gateway-webflux). The OpenFeign example with Spring MVC is in the `mvc` branch and the Keycloak example is in the `keycloak` branch.

If you liked this post, you might enjoy these related posts:

- [Deploy Secure Spring Boot Microservices on Amazon EKS Using Terraform and Kubernetes](https://auth0.com/blog/terraform-eks-java-microservices/)
- [Get started with Spring Boot and Auth0](https://auth0.com/blog/get-started-with-okta-spring-boot-starter/)
- [Build a Beautiful CRUD App with Spring Boot and Angular](https://auth0.com/blog/spring-boot-angular-crud/)
- [Get Started with Jetty, Java, and OAuth](https://auth0.com/blog/java-jetty-oauth/)

Please follow us [on Twitter @oktadev](https://twitter.com/oktadev) and subscribe to [our YouTube channel](https://www.youtube.com/oktadev) for more Spring Boot and microservices knowledge.

You can also sign up for our [developer newsletter](https://a0.to/nl-signup/java) to stay updated on everything Identity and Security.
