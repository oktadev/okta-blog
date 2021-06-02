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

Let's build a simple microservice that returns the total count of a Github code search by keyword. The third-party service in this example is [Github REST API](https://docs.github.com/en/rest).
Start by creating a microservice application using Spring Initializr and HTTPie. In a terminal window, request a Spring Boot Maven project with `webflux` for reactive, `okta` for security and `lombok`:

```shell
http -d https://start.spring.io/starter.zip type==maven-project \
  language==java \
  bootVersion==2.4.5 \
  baseDir==search-service \
  groupId==com.okta.developer \
  artifactId==search-service \
  name==search-service \
  packageName==com.okta.developer.search \
  javaVersion==11 \
  dependencies==webflux,okta,lombok
```

Unzip the project:

```shell
unzip search-service.zip
cd search-service
```

{% include setup/cli.md type="web" framework="Okta Spring Boot Starter" %}


Rename `application.properties` to `application.yml`, the following properties must be set:

```yml
okta:
  oauth2:
    issuer: https://{yourOktaDomain}/oauth2/default
    client-secret: {clientSecret}
    client-id: {clientId}
    scopes: openid, profile, email
```



Create the package `com.okta.developer.search.controller` and add a `SearchCount` class for the `totalCount` result:


```java
package com.okta.developer.search.service;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SearchCount {

    @JsonProperty("total_count")
    private Integer totalCount;
}
```

Then add a `SearchController` class:

```java
package com.okta.developer.search.controller;

import com.okta.developer.search.service.SearchCount;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.annotation.RegisteredOAuth2AuthorizedClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import static org.springframework.security.oauth2.client.web.reactive.function.client.ServerOAuth2AuthorizedClientExchangeFilterFunction.oauth2AuthorizedClient;

@RestController
public class SearchController {

    @Value("${service.github}")
    private String apiUrl;

    @Autowired
    private WebClient webClient;


    @GetMapping(value = "/totalCount/{keyword}")
    public Mono<SearchCount> getSearchCountAuthorized(@PathVariable String keyword,
                                                      @RegisteredOAuth2AuthorizedClient( "github")OAuth2AuthorizedClient authorizedClient){
        return this.webClient.get().uri(apiUrl, uriBuilder -> uriBuilder
                .path("/search/code")
                .queryParam("q", keyword).build())
                .attributes(oauth2AuthorizedClient(authorizedClient))
                .retrieve()
                .bodyToMono(SearchCount.class);
    }

}
```

Independent of how the user authenticates, in this case using Okta, another client registration is in play for the search request.
The `SearchController` requires a `github` authorized client, to be set as an attribute in the WebClient. With this parameter, Spring Security will resolve the access token for accessing the Github REST Api. Notice the controller autowires a `WebClient` instance that will be configured in the next section, along with the Github client registration.



## Access an OAuth2 Third-Party Service with Spring WebClient



For the `WebClient` to handle the Github grant flow, it must inclue the `ServerOAuth2AuthorizedClientExchangeFilterFunction`. Declare the `WebClient` bean in the `SearchServiceApplication` class:


```java
@Bean
public WebClient webClient(ReactiveClientRegistrationRepository clientRegistrations,
               ServerOAuth2AuthorizedClientRepository authorizedClients)  {
  ServerOAuth2AuthorizedClientExchangeFilterFunction oauth =
      new ServerOAuth2AuthorizedClientExchangeFilterFunction(clientRegistrations, authorizedClients);


  return WebClient.builder()
      .filter(oauth)
      .build();
}
```
The `ServerOAuth2AuthorizedClientExchangeFilterFunction` support to important features:

- **setDefaultOAuth2AuthorizedClient**: explicitly opt into using the oauth2Login to provide an access token implicitly. For this use case, the `WebClient` is used to access a third-party service, so the tokens obtained from Okta are not valid for accessing Github.
- **setDefaultClientRegistrationId**: set a default ClientRegistration.registrationId. This could be a useful option, the `WebClient` would be already initialized with the required Github client registration. But later, the integration test will not pick up the mock client registration, and a grant flow will be triggered to production Github. That's the reason why instead of using this feature, the `WebClient` is passed the Github authorized client when invoked (in the `SearchController`).





## Spring WebClient Testing with MockWebServer

To test code that uses the WebClient, Spring Framework documentation recommends [OkHttp MockWebServer](https://github.com/square/okhttp#mockwebserver), in the WebClient chapter. This recommendation should also be included in the Integration Testing chapter, as only clients that use RestTemplate internally are mentioned.

-- Explain different approaches for integration testing when third party is involved.


Independent of how your user authenticates, you may have other client registrations that are in play for the request you are testing.

## Learn More
