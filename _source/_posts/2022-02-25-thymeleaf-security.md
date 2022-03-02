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
      - profile
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
        <p>Welcome home, <span th:text="${#authentication.principal.attributes['name']}">Joe Coder</span>!</p>
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

A Controller is required to access the `home` page.





- Create spring-boot application
- Thymeleaf fragments
- Add okta
- Add home page
- Thymeleaf security
- Add profile page


- Add quiz form
- Require quiz scope in app
- Add quiz scope in okta
- verify CSRF
- Add junit for CSRF
- Controller method security
- Add 403 page
- Learn more
