---
layout: blog_post
title: "Spring Cloud Gateway OAuth2 Patterns"
author: jimena-garbarino
by: contractor
communities: [java]
description: ""
tags: [spring gateway, oidc, java, spring, spring boot, spring cloud gateway]
tweets:
- ""
- ""
- ""
image:
type: awareness|conversion
---

Spring Cloud Gateway is the Reactive API Gateway of the Spring Ecosystem, built on Spring Boot, WebFlux and Project Reactor. Its job is to proxy and route requests to services, and provide cross cutting concerns such as security, monitoring and resilience. As Reactive models gain popularity, there is a chance that your microservices architecture becomes a mix of Spring MVC blocking applications and Spring WebFlux non-blocking applications.

In this tutorial you will use Spring Cloud Gateway for routing to traditional Servlet API microservices, and you will learn the required configuration for three common OAuth2 patterns, using Okta as authorization server:

- Spring Cloud Gateway OpenID Connect Authentication
- Cart Microservice Authorization by Token Relay
- Pricing Microservice Client Credentials Grant

**Prerequisites**: [Java 8](https://adoptopenjdk.net/)+, cURL


## Pattern 1: Authentication with Authorization Code Flow

OpenID Connect defines a mechanism for End-User authentication based on the OAuth2 authorization code flow. In this pattern, the Authorization Server returns an Authorization Code to the application, which can then exchange it for an ID Token and an Access Token directly. The Authorization Server authenticates the application with a ClientId and ClientSecret before the exchange happens. As you can see in the diagram below, OpenID and OAuth2 patterns make extensive use of HTTP redirections, some of which have been omitted for clarity.

{% img blog/spring-gateway/authorization-code-flow.png alt:"Okta OAuth Code Flow" width:"600" %}{: .center-image }


For testing this OAuth2 pattern, let's create the API Gateway with service discovery.
First, create a base folder for all the projects:

```shell
mkdir oauth2-patterns
cd oauth2-patterns
```
With Spring Initializr, create an Eureka server:

```
curl https://start.spring.io/starter.zip -d dependencies=cloud-eureka-server \
-d groupId=com.okta.developer \
-d artifactId=discovery-service  \
-d name="Eureka Service" \
-d description="Discovery service" \
-d packageName=com.okta.developer.discovery \
-d javaVersion=11 \
-o eureka.zip
```

Unzip the file:
```
unzip eureka.zip -d eureka
cd eureka
```
Edit the `pom.xml` and add the following dependency:
```xml
<dependency>
  <groupId>org.glassfish.jaxb</groupId>
  <artifactId>jaxb-runtime</artifactId>
</dependency>
```
Edit `EurekaServiceApplication` to add `@EnableEurekaServer` annotation:

```java
package com.okta.developer.discovery;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.server.EnableEurekaServer;

@SpringBootApplication
@EnableEurekaServer
public class EurekaServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(EurekaServiceApplication.class, args);
    }

}
```


Rename `src/main/resources/application.properties` to `application.yml` and add the following content:

```yml
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

Go to http://localhost:8761 and you should see the Eureka home.
Now let's create an API Gateway with Spring Cloud Gateway, using Spring Initializr again.

```shell
curl https://start.spring.io/starter.zip \
-d dependencies=cloud-eureka,cloud-gateway,webflux,okta,cloud-security,thymeleaf \
-d groupId=com.okta.developer \
-d artifactId=api-gateway  \
-d name="Spring Cloud Gateway Application" \
-d description="Demo project of a Spring Cloud Gateway application and OAuth flows" \
-d packageName=com.okta.developer.gateway \
-d javaVersion=11 \
-o api-gateway.zip
```
Unzip the project:

```
unzip api-gateway.zip
cd api-gateway
```
Edit `SpringCloudGatewayApplication` to add `@EnableEurekaClient` annotation.

```java
package com.okta.developer.gateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.EnableEurekaClient;

@SpringBootApplication
@EnableEurekaClient
public class SpringCloudGatewayApplication {

    public static void main(String[] args) {
        SpringApplication.run(SpringCloudGatewayApplication.class, args);
    }
}
```

Add a package `controller` and the controller `src/main/java/com.okta.developer.gateway.controller.GreetingController`. The controller will allow to test the login without having configured any routes yet.

```java
package com.okta.developer.gateway.controller;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.annotation.RegisteredOAuth2AuthorizedClient;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class GreetingController {


    @RequestMapping("/greeting")
    public String greeting(@AuthenticationPrincipal OidcUser oidcUser, Model model,
                           @RegisteredOAuth2AuthorizedClient("okta") OAuth2AuthorizedClient client) {
        model.addAttribute("username", oidcUser.getEmail());
        model.addAttribute("idToken", oidcUser.getIdToken());
        model.addAttribute("accessToken", client.getAccessToken());

        return "greeting";
    }
}
```

Add a greeting template `src/main/resources/templates/greeting.html`:

```html
<!DOCTYPE HTML>
<html xmlns:th="https://www.thymeleaf.org">
<head>
    <title>Greeting</title>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
</head>
<body>

<h1><p th:text="'Hello, ' + ${username} + '!'" /></h1>
<p th:text="'idToken: ' + ${idToken.tokenValue}" /><br/>
<p th:text="'accessToken: ' + ${accessToken.tokenValue}" /><br>
</body>
</html>
```

Rename `src/main/resources/application.properties` to `application.yml` and add the following properties:

```yml
spring:
  application:
    name: gateway
  cloud:
    gateway:
      discovery:
        locator:
          enabled: true
logging:
  level:
    org.springframework.cloud.gateway: DEBUG
    reactor.netty: DEBUG
```

Add `src/main/java/com.okta.developer.gateway.OktaOAuth2WebSecurity` to make the API Gateway a resource server with login enabled:

```java
package com.okta.developer.gateway;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;

@Configuration
@EnableWebFluxSecurity
public class OktaOAuth2WebSecurity {

    @Bean
    public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http)
    {
         http.authorizeExchange()
                .anyExchange()
                .authenticated()
                .and().oauth2Login()
                .and().csrf().disable()
                .oauth2ResourceServer()
                .jwt();
        return http.build();
    }
}
```
For this example, csrf is disabled.

Now we need to create an authorization client in Okta. Log in to your Okta Developer account (or [sign up](https://developer.okta.com/signup/) if you don't have an account).

1. From the **Applications** page, choose **Add Application**.
2. On the Create New Application page, select **Web**.
3. Name your app _Api Gateway_, add `http://localhost:8080/login/oauth2/code/okta` as a Login redirect URI, select **Refresh Token** (in addition to **Authorization Code**), and click **Done**.

Copy the issuer (found under **API** > **Authorization Servers**), client ID, and client secret.

Start the gateway with:
```shell
OKTA_OAUTH2_ISSUER={yourOktaIssuer} \
OKTA_OAUTH2_CLIENT_ID={yourOktaClientId} \
OKTA_OAUTH2_CLIENT_SECRET={yourOktaClientSecret} \
./mvnw spring-boot:run
```

Go to http://localhost:8080/greeting. The gateway will redirect to Okta login page:

{% img blog/spring-gateway/okta-login.png alt:"Okta login form" width:"500" %}{: .center-image }

After the login, the idToken and accessToken will be displayed in the browser.

```
idToken: eyJraWQiOiIwYVM4bk4tM241emZYRDJfMU1yYUhzYURUZ0trVWZ4aWNaQXZDc0Fwb2lzIiwiYWxnIjoiUlMyNTYifQ.eyJzdWIiOiIwMHUxaDcwc2YwdHJSc2JMUzM1NyIsIm5hbWUiOiJKaW1lbmEgR2FyYmFyaW5vIiwiZW1haWwiOiJqaW1lbmFAdG9wdGFsLmNvbSIsInZlciI6MSwiaXNzIjoiaHR0cHM6Ly9kZXYtNjQwNDI5Lm9rdGEuY29tL29hdXRoMi9kZWZhdWx0IiwiYXVkIjoiMG9hNGc1ZzYzYWZTa01qZ3QzNTciLCJpYXQiOjE1OTM0NTUxMjEsImV4cCI6MTU5MzQ1ODcyMSwianRpIjoiSUQuWTZHdVFsWElSeU03U1FNNFRmN2tLdUV0MnlySW84U0l5eUVoMFVfaEpvUSIsImFtciI6WyJwd2QiXSwiaWRwIjoiMDBvMWg3MHNidmRMRjlpczYzNTciLCJub25jZSI6IlphUjZCT25OcGJ5X1dZSUQyRkNjeDJCUzR5ZExsNjJWcldVdEFaWDYwZmciLCJwcmVmZXJyZWRfdXNlcm5hbWUiOiJqaW1lbmFAdG9wdGFsLmNvbSIsImF1dGhfdGltZSI6MTU5MzQ1MzUzNSwiYXRfaGFzaCI6ImYtUU9KdWVqUzF1MHNRaDJ4ZWJQUlEifQ.QNgw3EuOXdi-Pq8ZoNmWGTYlOU-Wz608ieAXEEWmk5KgRbdCJdQGBH35ALc_fO-2CLmDamoI2tbOWdz79vcmDfOv-tlztXBS-At3M20ZPRSF39mHVs0vHKqmNIgdo5E6Dw0Yl_vqWdIZukEj6zjSVOpR1znHqWf0Bln_C7w9S9OOE8Z7yclHE7R5fzPVSEdT_1TpW9MRlcQKEmmTrskhsSem1wXEOceE7qlhebw-NhAGOnZD0Vr6WklRjaIMZ5zI-pKioJI9ysN7bByJJ9O9DpmsSswNfDtlIVqq-DbUu15Vze-D4pHTkO8GbYC1xh7YUxuN39viK8nBzxiBEwqx2w


accessToken: eyJraWQiOiIwYVM4bk4tM241emZYRDJfMU1yYUhzYURUZ0trVWZ4aWNaQXZDc0Fwb2lzIiwiYWxnIjoiUlMyNTYifQ.eyJ2ZXIiOjEsImp0aSI6IkFULnAxbElmR0ZpU3drM29kTjZZdEI3VmxBV1A2NllEWGpsNjlkYmJqY0VnN2suZDFBNzVkcitzWTE3MFZzeUFkKzNEQnhkbTlFT080QXdQUjNkVStkdXFpRT0iLCJpc3MiOiJodHRwczovL2Rldi02NDA0Mjkub2t0YS5jb20vb2F1dGgyL2RlZmF1bHQiLCJhdWQiOiJhcGk6Ly9kZWZhdWx0IiwiaWF0IjoxNTkzNDU1MTIxLCJleHAiOjE1OTM0NTg3MjEsImNpZCI6IjBvYTRnNWc2M2FmU2tNamd0MzU3IiwidWlkIjoiMDB1MWg3MHNmMHRyUnNiTFMzNTciLCJzY3AiOlsicHJvZmlsZSIsIm9mZmxpbmVfYWNjZXNzIiwiZW1haWwiLCJwaG9uZSIsIm9wZW5pZCIsImFkZHJlc3MiXSwic3ViIjoiamltZW5hQHRvcHRhbC5jb20ifQ.biSKfFmBupiu7b8vViyVrqRDprxj70bb3xhcFujRV37xknnF2gxgyX3iteEbHVdQpCbnJrLMZ6mqKDxhhnPnOMfgZWXGKYk92PzJ6EoNF99Ui7-3ynZMx3glwYHiLERHZsGkHX88jhYD8IP-5QUQ7phXD8sALp-Di2AvpJVTRam3NmiEZe8hnkUwGNMq7jsPPL953ldvF38fjMMEG6ReHu7wW4yQnVYHskpLHQnZdRNiOxq8QgJ-V6MpWzKSdEI5QCwoOpervMPTvNi0UfSUIMjdvNnCqGCwXZwg6UdCYUyVLRIz9nOzh4yMCEdWD4DHDe6ggiY4rhCI8g2DOpjJWQ

```

## Pattern 2: Token Relay to Service

A Token Relay happens when an OAuth2 consumer, for example the API Gateway, acts as a Client and forwards the accessToken to the routed service.

{% img blog/spring-gateway/token-relay.png alt:"Token Relay Flow" width:"600" %}{: .center-image }

Let's create a cart service.

```shell
curl https://start.spring.io/starter.zip -d dependencies=web,data-jpa,h2,cloud-eureka,okta,security \
-d groupId=com.okta.developer \
-d artifactId=cart-service  \
-d name="Cart Service" \
-d description="Demo cart microservice" \
-d packageName=com.okta.developer.cartservice \
-d javaVersion=11 \
-o cart-service.zip
```
Unzip the file:

```shell
unzip cart-service.zip -d cart-service
cd cart-service
```
Edit `pom.xml` and add [Jackson Datatype Money](https://github.com/zalando/jackson-datatype-money) dependency. For this tutorial, we will use [JavaMoney](https://javamoney.github.io/ri.html) for currency. We are also going to need oauth2-autoconfigure for later.

```xml
<dependency>
  <groupId>org.zalando</groupId>
  <artifactId>jackson-datatype-money</artifactId>
  <version>1.1.1</version>
</dependency>
<dependency>
  <groupId>org.springframework.security.oauth.boot</groupId>
  <artifactId>spring-security-oauth2-autoconfigure</artifactId>
</dependency>
```

Create the `Cart` and `LineItem` model classes under `src/main/java/com.okta.developer.cartservice.model` package:

```java
package com.okta.developer.cartservice.model;


import javax.money.MonetaryAmount;
import javax.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
public class Cart {

    @Id
    @GeneratedValue(strategy= GenerationType.AUTO)
    private Integer id;

    private String customerId;
    @Convert(converter=MonetaryAmountConverter.class)
    private MonetaryAmount total;

    @OneToMany(cascade = CascadeType.ALL)
    private List<LineItem> lineItems = new ArrayList<>();

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }

    public String getCustomerId() {
        return customerId;
    }

    public void setCustomerId(String customerId) {
        this.customerId = customerId;
    }

    public List<LineItem> getLineItems() {
        return lineItems;
    }

    public void setLineItems(List<LineItem> lineItems) {
        this.lineItems = lineItems;
    }

    public MonetaryAmount getTotal() {
        return total;
    }

    public void setTotal(MonetaryAmount total) {
        this.total = total;
    }

    public void addLineItem(LineItem lineItem) {
        this.lineItems.add(lineItem);
    }
}
```

```java
package com.okta.developer.cartservice.model;

import javax.money.MonetaryAmount;
import javax.persistence.*;

@Entity
public class LineItem {

    @Id
    @GeneratedValue(strategy= GenerationType.AUTO)
    private Integer id;


    private String productName;
    private Integer quantity;
    @Convert(converter=MonetaryAmountConverter.class)
    private MonetaryAmount price;


    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public MonetaryAmount getPrice() {
        return price;
    }

    public void setPrice(MonetaryAmount price) {
        this.price = price;
    }

    public Integer getId() {
        return id;
    }

    public void setId(Integer id) {
        this.id = id;
    }
}
```

Add a `CartRepository` under `src/main/java/com.okta.developer.cartservice.repository`:

```java
package com.okta.developer.cartservice.repository;

import com.okta.developer.cartservice.model.Cart;
import org.springframework.data.repository.CrudRepository;

public interface CartRepository extends CrudRepository<Cart, Integer> {
}
```

Add a `MonetaryAmountConverter` for mapping the `MonetaryAmount` type to the database, under `src/main/java/com.okta.developer.cartservice.model`:

```java
package com.okta.developer.cartservice.model;

import javax.money.CurrencyUnit;
import javax.money.Monetary;
import javax.money.MonetaryAmount;
import javax.persistence.AttributeConverter;
import java.math.BigDecimal;

public class MonetaryAmountConverter implements AttributeConverter<MonetaryAmount, BigDecimal> {

    private final CurrencyUnit USD = Monetary.getCurrency("USD");


    @Override
    public BigDecimal convertToDatabaseColumn(MonetaryAmount monetaryAmount) {
        if (monetaryAmount == null){
            return null;
        }
        return monetaryAmount.getNumber().numberValue(BigDecimal.class);
    }

    @Override
    public MonetaryAmount convertToEntityAttribute(BigDecimal bigDecimal) {
        if (bigDecimal == null){
            return null;
        }
        return Monetary.getDefaultAmountFactory()
                .setCurrency(USD)
                .setNumber(bigDecimal.doubleValue())
                .create();
    }
}
```

Add a `CartController` under `src/main/java/com.okta.developer.cartservice.controller`:

```java
package com.okta.developer.cartservice.controller;

import com.okta.developer.cartservice.model.Cart;
import com.okta.developer.cartservice.repository.CartRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
public class CartController {


    @Autowired
    private CartRepository repository;

    @GetMapping("/cart/{id}")
    public Cart getCart(@PathVariable Integer id){
        return repository.findById(id).orElseThrow(() -> new CartNotFoundException("Cart not found:" + id));
    }

    @PostMapping("/cart")
    public Cart saveCart(@RequestBody  Cart cart){

        Cart saved = repository.save(cart);
        return saved;
    }
}
```

Create the `CartNotFoundException` under `src/main/java/com.okta.developer.cartservice.controller` for mapping the API 404:

```java
package com.okta.developer.cartservice.controller;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.NOT_FOUND)
public class CartNotFoundException extends RuntimeException {

    public CartNotFoundException(String message) {
        super(message);
    }
}
```

Configure the Jackson Money Datatype module. Add a `WebConfig` class under `src/main/java/com.okta.developer.cartservice`:

```java
package com.okta.developer.cartservice;


import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.zalando.jackson.datatype.money.MoneyModule;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Bean
    public MoneyModule moneyModule(){
        return new MoneyModule().withDefaultFormatting();
    }
}
```
Edit `CartServiceApplication` and add `@EnableEurekaClient`:

```java
package com.okta.developer.cartservice;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.EnableEurekaClient;

@SpringBootApplication
@EnableEurekaClient
public class CartServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(CartServiceApplication.class, args);
    }

}
```
Rename `src/main/resources/application.propeties` to `application.yml` and add the following values:

```yml
server:
  port: 8081

spring:
  application:
    name: cart

okta:
  oauth2:
    issuer: {yourOktaIssuer}
    audience: api://default
```

Start the `cart-service`:

```shell
./mvnw spring-boot:run
```



Go to the `api-gateway` and add a route for the cart service, edit `SpringCloudGatewayApplication`:

```java
package com.okta.developer.gateway;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.gateway.route.RouteLocator;
import org.springframework.cloud.gateway.route.builder.RouteLocatorBuilder;
import org.springframework.cloud.netflix.eureka.EnableEurekaClient;
import org.springframework.cloud.security.oauth2.gateway.TokenRelayGatewayFilterFactory;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
@EnableEurekaClient
public class SpringCloudGatewayApplication {

    public static void main(String[] args) {
        SpringApplication.run(SpringCloudGatewayApplication.class, args);
    }


    @Bean
    public RouteLocator routeLocator(RouteLocatorBuilder builder, TokenRelayGatewayFilterFactory filterFactory) {
        return builder.routes()
                .route("cart", r -> r.path("/cart/**")
                        .filters(f -> f.filter(filterFactory.apply()))
                        .uri("lb://cart"))
                .build();
    }

}
```

`TokenRelayGatewayFilterFactory` will find the accessToken from the registered OAuth2 client and include it in the outbound cart request.

Restart the gateway with:
```shell
OKTA_OAUTH2_ISSUER={yourOktaIssuer} \
OKTA_OAUTH2_CLIENT_ID={yourOktaClientId} \
OKTA_OAUTH2_CLIENT_SECRET={yourOktaClientSecret} \
./mvnw spring-boot:run
```

Got to http://localhost:8080/greeting and copy the **accessToken**. Then use the accessToken to make requests to the cart API through the gateway.

```shell
curl \
  -d '{"customerId": "uijoon@mail.com", "lineItems": [{ "productName": "jeans", "quantity": 1}]}' \
  -H "Authorization: Bearer {accessToken}" \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json' \
  http://localhost:8080/cart
```
```shell
curl \
  -H 'Accept: application/json' \
  -H "Authorization: Bearer {accessToken}" \
  http://localhost:8080/cart/1
```

## Pattern 3: Service to Service Client Credentials Grant

In this authorization pattern, the application requests an accessToken using only its client credentials. This flow is suitable for machine-to-machine (M2M) or service-to-service authorizations.


{% img blog/spring-gateway/credentials-grant.png alt:"Credentials Grant Flow" width:"800" %}{: .center-image }


For service to service authorization, create a `pricing` Spring Boot service with Spring Initializr:

```shell
curl https://start.spring.io/starter.zip -d dependencies=web,cloud-eureka,okta,security,lombok \
-d groupId=com.okta.developer \
-d artifactId=pricing-service  \
-d name="Pricing Service" \
-d description="Demo pricing microservice" \
-d packageName=com.okta.developer.pricing \
-d javaVersion=11 \
-o pricing-service.zip
```
Unzip the file:

```shell
unzip pricing-service.zip -d pricing-service
cd pricing-service
```


Edit `pom.xml` and add Jackson Datatype Money dependency again.

```xml
<dependency>
  <groupId>org.zalando</groupId>
  <artifactId>jackson-datatype-money</artifactId>
  <version>1.1.1</version>
</dependency>
```

Create the `Cart` and `LineItem` model classes under `src/main/java/com.okta.developer.pricing.model` package:

```java
package com.okta.developer.pricing.model;

import lombok.Data;
import javax.money.MonetaryAmount;
import java.util.ArrayList;
import java.util.List;

@Data
public class Cart {

    private Integer id;
    private String customerId;
    private List<LineItem> lineItems = new ArrayList<>();
    private MonetaryAmount total;

    public void addLineItem(LineItem lineItem){
        this.lineItems.add(lineItem);
    }
}
```

```java
package com.okta.developer.pricing.model;

import lombok.Data;
import javax.money.MonetaryAmount;

@Data
public class LineItem {

    private Integer id;
    private Integer quantity;
    private MonetaryAmount price;
    private String productName;

    public LineItem(){
    }

    public LineItem(Integer id, Integer quantity) {
        this.id = id;
        this.quantity = quantity;
    }
}
```

Create the `src/main/java/com.okta.developer.pricing.service` package. Create a `PricingService` interface and a `BasePricingService` implementation to calculate prices for the `LineItem`.

```java
package com.okta.developer.pricing.service;

import com.okta.developer.pricing.model.Cart;

public interface PricingService {

    Cart price(Cart cart);
}
```
```java
package com.okta.developer.pricing.service;

import com.okta.developer.pricing.model.Cart;
import com.okta.developer.pricing.model.LineItem;
import org.springframework.stereotype.Service;

import javax.money.CurrencyUnit;
import javax.money.Monetary;
import javax.money.MonetaryAmount;
import java.math.BigDecimal;
import java.math.RoundingMode;


@Service
public class BasePricingService implements PricingService {

    private final CurrencyUnit USD = Monetary.getCurrency("USD");

    @Override
    public Cart price(Cart cart) {


        MonetaryAmount total = Monetary.getDefaultAmountFactory()
                .setCurrency(USD)
                .setNumber(0)
                .create();

        for (LineItem li : cart.getLineItems()) {
            BigDecimal bigDecimal = new BigDecimal(Math.random() * 100)
                    .setScale(2, RoundingMode.HALF_UP);

            MonetaryAmount amount = Monetary.getDefaultAmountFactory()
                    .setCurrency(USD)
                    .setNumber(bigDecimal)
                    .create();
            li.setPrice(amount);
            total = total.add(amount.multiply(li.getQuantity()));
        }

        cart.setTotal(total);
        return cart;
    }
}
```
Create the `PricingController` under the package `src/main/java/com.okta.developer.pricing.controller`:

```java
package com.okta.developer.pricing.controller;

import com.okta.developer.pricing.model.Cart;
import com.okta.developer.pricing.service.PricingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class PricingController {

    @Autowired
    private PricingService pricingService;

    @PostMapping("/pricing/price")
    public Cart price(@RequestBody Cart cart){

        Cart priced = pricingService.price(cart);
        return priced;
    }

}
```

Configure the Jackson Money Module in a `src/main/java/com.okta.developer.pricing.WebConfig` class:

```java
package com.okta.developer.pricing;


import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.zalando.jackson.datatype.money.MoneyModule;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Bean
    public MoneyModule moneyModule(){
        return new MoneyModule().withDefaultFormatting();
    }

}
```

Add `@EnableEurekaClient` to `PricingServiceApplication`:

```java
package com.okta.developer.pricing;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.EnableEurekaClient;

@SpringBootApplication
@EnableEurekaClient
public class PricingServiceApplication {

    public static void main(String[] args) {
        SpringApplication.run(PricingServiceApplication.class, args);
    }
}
```

Rename `src/main/resources/application.properties` to `application.yml` and add the following:

```yml
server:
  port: 8082

spring:
  application:
    name: pricing

okta:
  oauth2:
    issuer: {yourOktaIssuer}
    audience: api://default
```

Start the service:

```shell
./mvnw spring-boot:run
```
Let's try the pricing API without an accessToken:

```shell
curl -v\
  -d '{"customerId": "uijoon@mail.com", "lineItems": [{ "productName": "jeans", "quantity": 1}]}' \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json' \
  http://localhost:8082/pricing/price
```
With the `-v` verbose flag, you should see the request is rejected with 401.

Now we are going to configure `cart-service` to use the client credentials grant flow to request pricing.

First create a new authorization client in Okta.

1. From the **Applications** page, choose **Add Application**.
2. On the Create New Application page, select **Service**.
3. Name your app _Cart Service_ and click **Done**.

Copy the new client ID, and client secret.
Edit `com.okta.developer.cartservice.WebConfig` to add a `RestTemplate` for calling the pricing API.

```java
package com.okta.developer.cartservice;


import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.cloud.client.loadbalancer.LoadBalanced;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.security.oauth2.client.OAuth2RestTemplate;
import org.springframework.security.oauth2.client.token.grant.client.ClientCredentialsResourceDetails;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.zalando.jackson.datatype.money.MoneyModule;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Autowired
    private ObjectMapper objectMapper;

    @Bean
    public MoneyModule moneyModule(){
        return new MoneyModule().withDefaultFormatting();
    }

    @Bean
    @LoadBalanced
    @Lazy
    protected RestTemplate restTemplate() {
        RestTemplate restTemplate =  new OAuth2RestTemplate(oAuthDetails());
        MappingJackson2HttpMessageConverter converter = new MappingJackson2HttpMessageConverter();
        converter.setObjectMapper(objectMapper);
        restTemplate.getMessageConverters().add(0, converter);
        return restTemplate;
    }

    @Bean
    @ConfigurationProperties("pricing.oauth2.client")
    protected ClientCredentialsResourceDetails oAuthDetails() {
        return new ClientCredentialsResourceDetails();
    }
}
```

Edit the cart-service `application.yml` and add the following:

```yml
pricing:
  oauth2:
    client:
      grantType: client_credentials
      accessTokenUri: {yourOktaIssuer}/v1/token
      scope: pricing
```

Add the `PricingService` under `src/main/java/com.okta.developer.cartservice.service` package:

```java
package com.okta.developer.cartservice.service;

import com.okta.developer.cartservice.model.Cart;
import com.okta.developer.cartservice.model.LineItem;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
public class PricingService {

    @Autowired
    private RestTemplate restTemplate;

    public Cart price(Cart cart){
        try {
            HttpEntity httpEntity = new HttpEntity(cart);
            ResponseEntity<Cart> response = restTemplate
                    .exchange("http://pricing/pricing/price", HttpMethod.POST, httpEntity,
                            Cart.class);

            Cart priced = response.getBody();

            for (int i = 0; i < priced.getLineItems().size(); i++) {
                LineItem pricedLineItem = priced.getLineItems().get(i);
                LineItem lineItem = cart.getLineItems().get(i);
                lineItem.setPrice(pricedLineItem.getPrice());
            }

            cart.setTotal(priced.getTotal());


            return cart;
        } catch (Exception e){
            throw new PricingException(e);
        }
    }
}
```

```java
package com.okta.developer.cartservice.service;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

@ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
public class PricingException extends RuntimeException {

    public PricingException(Exception e) {
        super(e);
    }
}
```

Modify the `CartController` to request pricing when creating a cart:

```java
package com.okta.developer.cartservice.controller;

import com.okta.developer.cartservice.model.Cart;
import com.okta.developer.cartservice.repository.CartRepository;
import com.okta.developer.cartservice.service.PricingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
public class CartController {


    @Autowired
    private CartRepository repository;

    @Autowired
    private PricingService pricingService;


    @GetMapping("/cart/{id}")
    public Cart getCart(@PathVariable Integer id){
        return repository.findById(id).orElseThrow(() -> new CartNotFoundException("Cart not found:" + id));
    }

    @PostMapping("/cart")
    public Cart saveCart(@RequestBody  Cart cart){

        Cart priced = pricingService.price(cart);
        Cart saved = repository.save(priced);
        return saved;
    }
}
```

Restart the cart-service:

```shell
PRICING_OAUTH2_CLIENT_CLIENTID={serviceClientId} \
PRICING_OAUTH2_CLIENT_CLIENTSECRET={serviceClientSecret} \
./mvnw spring-boot:run
```

Create a cart trough the API Gateway again, make sure to have a valid accessToken from http://localhost:8080/greeting:

```shell
curl \
  -d '{"customerId": "uijoon@mail.com", "lineItems": [{ "productName": "jeans", "quantity": 1}]}' \
  -H "Authorization: Bearer {accessToken}" \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json' \
  http://localhost:8080/cart
```
You should get a priced cart as response:

```json
{
   "id":1,
   "customerId":"uijoon@mail.com",
   "total":{
      "amount":86.20,
      "currency":"USD",
      "formatted":"USD86.20"
   },
   "lineItems":[
      {
         "id":2,
         "productName":"jeans",
         "quantity":1,
         "price":{
            "amount":86.20,
            "currency":"USD",
            "formatted":"USD86.20"
         }
      }
   ]
}
```      
If you see the System Log in Okta Dashboard, you will find an entry indicating the Cart Service requested an access token:

{% img blog/spring-gateway/client-credential-activity.png alt:"Client Credentials Activity" width:"900" %}{: .center-image }

## Learn More

In this tutorial you learned how to create an API Gateway with Spring Cloud Gateway, and how configure three common OAuth2 patterns using Okta Spring Boot Starter and Spring Security: code flow, token relay and client credentials grant. You can find all the code at [Github](https://github.com/indiepopart/spring-cloud-gateway)
To continue learning about Spring Cloud Gateway features and OAuth2 authorization patterns, check also the following links:

- [Secure Reactive Microservices with Spring Cloud Gateway](https://developer.okta.com/blog/2019/08/28/reactive-microservices-spring-cloud-gateway)
- [Secure Legacy Apps with Spring Cloud Gateway](https://developer.okta.com/blog/2020/01/08/secure-legacy-spring-cloud-gateway)
- [Secure Server-to-Server Communication with Spring Boot and OAuth 2.0](https://developer.okta.com/blog/2018/04/02/client-creds-with-spring-boot)
- [Secure Service-to-Service Spring Microservices with HTTPS and OAuth 2.0](https://developer.okta.com/blog/2019/03/07/spring-microservices-https-oauth2)
- [Use Okta Token Hooks to Supercharge OpenID Connect](https://developer.okta.com/blog/2019/12/23/extend-oidc-okta-token-hooks)
- [Building a Gateway](https://spring.io/guides/gs/gateway/)
