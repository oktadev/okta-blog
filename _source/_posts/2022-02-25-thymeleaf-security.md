---
layout: blog_post
title: "Security when using Thymeleaf templates with Spring Webflux"
author: jimena-garbarino
by: contractor
communities: [security,java]
description: ""
tags: [thymeleaf, security, method-security, oidc, webflux, spring, spring-boot, spring-security, csrf, authorization]
tweets:
- ""
- ""
- ""
image:
type: conversion
---

- Introduction

- Tools

- Index
- What is Thymeleaf
- Goals

# Create a Spring Boot Webflux application with Thymeleaf

Create a simple monolithic Spring Boot reactive application, that will use Thymeleaf for page templates.
You can use [Spring Initializr](https://start.spring.io/), from its web UI, or download the starter app with the following HTTPie line:

```shell
https -d start.spring.io/starter.zip bootVersion==2.6.4 \
  baseDir==thymeleaf-security \
  groupId==com.okta.developer.thymeleaf-security \
  artifactId==thymeleaf-security \
  name==thymeleaf-security \
  packageName==com.okta.developer.demo \
  javaVersion==11 \
  dependencies==webflux,okta,thymeleaf
```

Extract the Maven project, and some additional dependencies. `thymeleaf-extras-springsecurity5` dependency is required to include security conditionals in the templates, and
`spring-security-test` has mock login features that will help when writing controller tests.

```xml
<dependency>
  <groupId>org.thymeleaf.extras</groupId>
  <artifactId>thymeleaf-extras-springsecurity5</artifactId>
  <version>3.0.4.RELEASE</version>
</dependency>
<dependency>
  <groupId>org.springframework.security</groupId>
  <artifactId>spring-security-test</artifactId>
  <scope>test</scope>
</dependency>
```

{% include setup/cli.md type="web" framework="Okta Spring Boot Starter" %}



The Okta configuration is now in `application.properties`. Rename it to `application.yml` and add the following additional properties:

```yml
spring:
  security:
    oauth2:
      client:
        provider:
          okta:
            user-name-attribute: email

okta:
  oauth2:
    issuer: https://{yourOktaDomain}/oauth2/default
    client-id: {clientId}
    client-secret: {clientSecret}
    scopes:
      - email
      - openid
```


Create a `src/main/resources/templates` folder for the templates you are going to create. Create the `home.html` template with the following content:

```html
<html xmlns:th="http://www.thymeleaf.org">
<head>
    <title>User Details</title>
    <!--/*/ <th:block th:include="head :: head"/> /*/-->
</head>
  <body id="samples">
  <div th:replace="menu :: menu"></div>

    <div id="content" class="container">
      <h2>Okta Hosted Login + Spring Boot Example</h2>

      <div th:unless="${#authorization.expression('isAuthenticated()')}" class="text fw-light fs-6 lh-1">
        <p>Hello!</p>
        <p>If you're viewing this page then you have successfully configured and started this example server.</p>
        <p>This example shows you how to use the <a href="https://github.com/okta/okta-spring-boot">Okta Spring Boot Starter</a> to add the <a href="https://developer.okta.com/authentication-guide/implementing-authentication/auth-code.html">Authorization Code Flow</a> to your application.</p>
        <p>When you click the login button below, you will be redirected to the login page on your Okta org.  After you authenticate, you will be returned to this application.</p>
      </div>

      <div th:if="${#authorization.expression('isAuthenticated()')}" class="text fw-light fs-6 lh-1">
        <p>Welcome home, <span th:text="${#authentication.principal.name}">Joe Coder</span>!</p>
        <p>You have successfully authenticated against your Okta org, and have been redirected back to this application.</p>
      </div>

      <form th:unless="${#authorization.expression('isAuthenticated()')}" method="get" th:action="@{/oauth2/authorization/okta}">
        <button id="login-button" class="btn btn-primary" type="submit">Sign In</button>
      </form>

    </div>
  </body>
  <!--/*/ <th:block th:include="footer :: footer"/> /*/-->
</html>
```

In the template above, the commented out `<th:block/>` allows to include a header and a footer fragments defined in `header.html` and `footer.html`. They contain the Bootstrap dependencies for the templates styling. There is also a menu fragment that will replace the `<div th:replace ...` element.
Conditionals  `th:if` and `th:unless` are used to evaluate the authentication status. If the visitor is not authenticated, the **Sign In** button will be displayed. Otherwise, a greeting by username will be displayed.

Add the `head.html` template:

```html
<html xmlns:th="http://www.thymeleaf.org">
<head th:fragment="head">
    <meta charset="utf-8"/>
    <meta http-equiv="X-UA-Compatible" content="IE=edge"/>
    <meta name="viewport" content="width=device-width, initial-scale=1"/>


    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-1BmE4kWBq78iYhFldvKuhfTAU6auU8tT94WrHftjDbrCEXSU1oBoqyl2QvZ6jIW3" crossorigin="anonymous">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.8.1/font/bootstrap-icons.css">
</head>
<body>
    <p>Nothing to see here, move along.</p>
</body>
</html>
```

`footer.html` template:

```html
<html xmlns:th="http://www.thymeleaf.org">
<head>
</head>
<body>
<p>Nothing to see here, move along.</p>
</body>
<footer th:fragment="footer">
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js" integrity="sha384-ka7Sk0Gln4gmtz2MlQnikT1wXgYsOg+OMhuP+IlRH9sENBO0LRn5q+8nbTov4+1p" crossorigin="anonymous"></script>
</footer>
</html>
```

`menu.html` template for the menu fragment:

```html
<html xmlns:th="http://www.thymeleaf.org">

<body id="samples">
<nav class="navbar border mb-4 navbar-expand-lg navbar-light bg-light" th:fragment="menu">
    <div class="container-fluid">
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse"
                data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent"
                aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarSupportedContent">
            <ul class="navbar-nav me-auto mb-2 mb-lg-0">
                <li class="nav-item"><a class="nav-link" th:href="@{/}">Home</a></li>
            </ul>
            <form class="d-flex" method="post" th:action="@{/logout}"
                  th:if="${#authorization.expression('isAuthenticated()')}">
                <input class="form-control me-2" type="hidden" th:name="${_csrf.parameterName}"
                       th:value="${_csrf.token}"/>
                <button id="logout-button" type="submit" class="btn btn-danger">Logout</button>
            </form>
        </div>
    </div>
</nav>
</body>
</html>
```

A Controller is required to access the `home` page. Add a `HomeController` class under `src/main/java` in the `com.okta.developer.demo` package, with the following content:

```java
package com.okta.developer.demo;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.reactive.result.view.Rendering;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.stream.Collectors;

@Controller
public class HomeController {

    private static Logger logger = LoggerFactory.getLogger(HomeController.class);

    @GetMapping("/")
    public Mono<Rendering> home(Authentication authentication) {
        List<String> authorities = authentication.getAuthorities()
                .stream()
                .map(scope -> scope.toString())
                .collect(Collectors.toList());
        return Mono.just(Rendering.view("home").modelAttribute("authorities", authorities).build());
    }
}
```

The controller will render the `home` view, and will set the authorities as model attribute, for security checks that will be added soon.
The default Okta starter autoconfiguration will request authentication to access any page, so to customize the security, add a `SecurityConfiguration` class in the same package as before.

```java
package com.okta.developer.demo;

import org.springframework.context.annotation.Bean;
import org.springframework.security.config.annotation.method.configuration.EnableReactiveMethodSecurity;
import org.springframework.security.config.annotation.web.reactive.EnableWebFluxSecurity;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.security.web.server.authentication.logout.RedirectServerLogoutSuccessHandler;
import org.springframework.security.web.server.authentication.logout.ServerLogoutSuccessHandler;

import java.net.URI;

@EnableWebFluxSecurity
@EnableReactiveMethodSecurity
public class SecurityConfiguration {

    @Bean
    public ServerLogoutSuccessHandler logoutSuccessHandler(){
        RedirectServerLogoutSuccessHandler handler = new RedirectServerLogoutSuccessHandler();
        handler.setLogoutSuccessUrl(URI.create("/"));
        return handler;
    }

    @Bean
    public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http) {
        http
                .authorizeExchange().pathMatchers("/").permitAll().and().anonymous()
                .and().authorizeExchange().anyExchange().authenticated()
                .and().oauth2Client()
                .and().oauth2Login()
                .and().logout().logoutSuccessHandler(logoutSuccessHandler());


        return http.build();
    }
}
```

In the configuration above, access to the home `/` page is allowed to all with anonymous authentication, which is required for the authentication test in the Thymeleaf `home` template to work. An authentication object must be in the security context.

Run the application with Maven:

```shell
./mvnw spring-boot:run
```

Go to http://localhost:8080 and you should see the home page and a **Sign In** button. Click the button and sign-in with your Okta credentials. After signing in, you should be redirected back to the home page and see the content for authenticated users.


{% img blog/thymeleaf-security/home-authenticated.png alt:"Home Page Authenticated" width:"800" %}{: .center-image }


# Protect content areas with roles

Let's add a `userProfile.html` template that will display the claims contained in the id token returned from Okta, and also the authorities that spring security derives from the token.

```html
<html xmlns:th="http://www.thymeleaf.org">
<head>
    <title>User Details</title>
    <!--/*/ <th:block th:include="head :: head"/> /*/-->
</head>
<body id="samples">
  <div th:replace="menu :: menu"></div>

    <div id="content" class="container">

      <div>
        <h2>My Profile</h2>
        <p>Hello, <span th:text="${#authentication.principal.attributes['name']}">Joe Coder</span>. Below is the information that was read with your <a href="https://developer.okta.com/docs/api/resources/oidc.html#get-user-information">Access Token</a>.
        </p>
        <p>This route is protected with the annotation <code>@PreAuthorize("hasAuthority('SCOPE_profile')")</code>, which will ensure that this page cannot be accessed until you have authenticated, and have the scope <code>profile</code>.</p>
      </div>


      <table class="table table-striped">
        <thead>
          <tr>
            <th>Claim</th>
            <th>Value</th>
          </tr>
        </thead>
        <tbody>
          <tr th:each="item : ${details}">
                <td th:text="${item.key}">Key</td>
                <td th:id="${'claim-' + item.key}" th:text="${item.value}">Value</td>
            </tr>
        </tbody>
      </table>

      <table class="table table-striped">
        <thead>
        <tr>
          <th>Spring Security Authorities</th>
        </tr>
        </thead>
        <tbody>
        <tr th:each="scope : ${#authentication.authorities}">
          <td><code th:text="${scope}">Authority</code></td>
        </tr>
        </tbody>
      </table>

    </div>
  </body>
<!--/*/ <th:block th:include="footer :: footer"/> /*/-->
</html>
```

Add the route mapping in the `HomeController`:

```java
@GetMapping("/profile")
@PreAuthorize("hasAuthority('SCOPE_profile')")
public Mono<Rendering> userDetails(OAuth2AuthenticationToken authentication) {
    return Mono.just(Rendering.view("userProfile").modelAttribute("details", authentication.getPrincipal().getAttributes())
            .build());
}
```

The annotation `@PreAuthorize` allows to define an authorization predicate that can be written in SpEL (Spring Expression Language), and will be checked before the method execution. Only users with the authority `SCOPE_PROFILE` can display the `userProfile` page.

Add a link in the `home` page for the `userProfile` page, below the "You successfully ..." paragraph:

```html
<p>You have successfully authenticated against your Okta org, and have been redirected back to this application.</p>
<p th:if="${#lists.contains(authorities, 'SCOPE_profile')}">Visit the <a th:href="@{/profile}">My Profile</a> page in this application to view the information retrieved with your OAuth Access Token.</p>
```

Run the application again. After signing in, you still won't see the new link, and if you go to http://localhost:8080/profile, you will get HTTP ERROR 403, which means forbidden. This is because in `application.yml`, as part of the Okta configuration, only `email` and `openid` scopes are requested, and `profile` scope is not returned in the id token claims. Add the missing scope in the yml, restart, and the `userProfile` view should be displayed:






- Add profile page


- Add quiz form
- Require quiz scope in app
- Add quiz scope in okta
- verify CSRF
- Add junit for CSRF
- Controller method security
- Add 403 page
- Learn more
