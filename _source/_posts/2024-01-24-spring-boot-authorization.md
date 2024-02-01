---
layout: blog_post
title: "Add Security and Authorization to a Java Spring Boot API"
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

The recommended strategy is to design for security from the start. For learning purposes, let's assume you have built an API that must be secured, so only authorized users can perform requests to its endpoints.

## Authentication and Authorization on the Web

touch on applicatons, clients of the identity provider
token concepts

## Authorization in a Spring Boot API

create auth0 account


You don't need to create a client application for your API if not using opaque tokens.

Register the API within your tenant, using Auth0 CLI:

```shell
auth0 apis create \
  --name "Menu API" \
  --identifier https://menu-api.okta.com \
  --scopes "create:items,udpate:items,delete:items" \
  --token-lifetime 86400 \
  --offline-access=false \
  --signing-alg "RS256"
```
Add the `okta-spring-boot-starter` dependency:

```groovy
// build.gradle
dependencies {
    ...
    implementation 'com.okta.spring:okta-spring-boot-starter:3.0.6'
    ...
}
```
As the `menu-api` is configured as an OAuth resource server, add the following properties:

```properties
// application.properties
okta.oauth2.issuer=${OKTA_OAUTH2_ISSUER}
okta.oauth2.audience=${OKTA_OAUTH2_AUDIENCE}
```

Create a `.env` file in the API root with the following content:

```shell
# .env
export OKTA_OAUTH2_ISSUER=https://<your-auth0-domain>/
export OKTA_OAUTH2_AUDIENCE=https://menu-api.okta.com
```

Set the value of `your-auth0-domain` to the active tenant returned by the command:

```shell
auth0 tenants list
```

Test the API authorization with HTTPie:

```shell
http :8080/api/menu/items
```
You will get HTTP response code `401`, because the request requires bearer authentication. Using Auth0 CLI, get an access token:

```shell
auth0 test token -a https://<your-auth0-domain>/api/v2/ -s openid
```
Select the **CLI Login Testing** client. You will also be prompted to open a browser window and log in with a user credential.

With HTTPie, send a request to the API server using a bearer access token:

```shell
ACCESS_TOKEN=<auth0-access-token>
```

```shell
http :8080/api/menu/items Authorization:"Bearer $ACCESS_TOKEN"
```
The request will not be authorized yet, because _This aud claim is not equal to the configured audience_. If the audience is not specified in the`auth0 test token` command, the default value is `https://dev-avup2laz.us.auth0.com/api/v2`, which is the Auth0Provider management API audience.

> NOTE: The Okta Spring Boot Starter autoconfigures the issuer and audience validation from the resource server properties for JWT authorization.

Request a test token again, this time with the required audience:
```shell
auth0 test token -a https://<your-auth0-domain>/api/v2/ -s openid -a https://menu-api.okta.com
```
Try the API request again and you should get a JSON response listing the menu items:

```
[
    {
        "description": "Tasty",
        "id": 1,
        "imageUrl": "https://cdn.auth0.com/blog/whatabyte/burger-sm.png",
        "name": "Burger",
        "price": 599.0
    },
    {
        "description": "Cheesy",
        "id": 2,
        "imageUrl": "https://cdn.auth0.com/blog/whatabyte/pizza-sm.png",
        "name": "Pizza",
        "price": 299.0
    },
    {
        "description": "Informative",
        "id": 3,
        "imageUrl": "https://cdn.auth0.com/blog/whatabyte/tea-sm.png",
        "name": "Tea",
        "price": 199.0
    }
]
```

## Authentication from a Single-Page Application (SPA)

It would be so much fun testing the API with a client application. Good fortune is on your side, because you can use the [WHATABYTE Dashboard](https://dashboard.whatabyte.app/home), a live demo client where you can configure Auth0 authentication and send requests to your local API server.

For the Auth0 authentication, you need to register the live client as a Single-Page Application to Auth0. You can do it with the Auth0 CLI:

```shell
auth0 apps create \
  --name "WHATABYTE Demo Client" \
  --description "Single-Page Application Dashboard for menu items CRUD" \
  --type spa \
  --callbacks https://dashboard.whatabyte.app/home \
  --logout-urls https://dashboard.whatabyte.app/home \
  --origins https://dashboard.whatabyte.app \
  --web-origins https://dashboard.whatabyte.app
```

Go to the [WHATABYTE Dashboard](https://dashboard.whatabyte.app/home), and set _API Server Base URL_ to http://localhost:8080. Toggle on **Enable Authentication Features** and set the following values:

- Auth0 Domain: <your-auth0-domain>
- Auth0 Client ID: <client-id>
- Auth0 Callback URL: https://dashboard.whatabyte.app/home
- Auth0 API Audience: https://menu-api.okta.com

Click **Save**.

For the API server to accept requests from the dashboard, you must tweak the CORS configuration, enabling the dashboard URL as an allowed origin for requests.

In the API project, add a `SecurityConfig` class at the root package:

```java
// src/main/java/com/example/menu/SecurityConfig.java
package com.example.menu;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

import static org.springframework.security.config.Customizer.withDefaults;

@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain configure(HttpSecurity http) throws Exception {
        return http
                .oauth2ResourceServer(oauth2ResourceServer -> oauth2ResourceServer.jwt(withDefaults()))
                .build();
    }

}
```

Modify `ItemController` adding the `@CrossOrigin` annotation:

```java
// src/main/java/com/example/menu/web/ItemController.java
...

@RestController
@RequestMapping("/api/menu/items")
@CrossOrigin(origins = "https://dashboard.whatabyte.app")
public class ItemController {

...
```

Restart the server API. In the dashboard, click the **Sign in** button. The client will redirect you to the [Auth0 Universal Login](https://auth0.com/docs/authenticate/login/auth0-universal-login) page. Sign in with the user you just created. In the left menu, choose **Menu**, and the menu items will display.

On the top right corner, click **Add Item**, and a pre-populated form will display. Click on **Save** and verify the user request is authorized in the server.



## Role-Based Access Control (RBAC)

auth0 flows
auth0 permissions, user management
server security
test server security relaxing the client
