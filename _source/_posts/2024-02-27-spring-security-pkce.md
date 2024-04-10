---
layout: blog_post
title:  "Proof Key for Code Exchange (PKCE) in Web Applications with Spring Security"
author: jimena-garbarino
by: contractor
communities: [security,java]
description: "Implementing OpenID Connect authentication in Java Web Applications with Okta Spring Boot Starter and Spring Security support for Authorization Code Flow with PKCE "
tags: []
tweets:
- ""
- ""
- ""
image:
type: awareness
---

OAuth 2.0 and OpenID Connect are the authentication and authorization _de facto_ standards for online web applications. In this post you will learn how to enable the extension Proof Key for Code Exchange (PKCE) in a Spring Boot confidential client, adhering to the [OAuth 2.0 Security Best Current Practice (BCP)](https://oauth.net/2/oauth-best-practice/).

> **This tutorial was created with the following tools and services**:
> - [Java OpenJDK 17](https://jdk.java.net/java-se-ri/17)
> - [Auth0 account](https://auth0.com/signup)
> - [Auth0 CLI 1.4.0](https://github.com/auth0/auth0-cli#installation)

If you'd rather skip the step-by-step and prefer running a sample application, follow the [README](https://github.com/indiepopart/spring-web-pkce) instructions in the Github repository.

{% include toc.md %}

## Authorization Code Flow and PKCE

[OAuth 2.0](https://www.rfc-editor.org/rfc/rfc6749.html) is a standard designed to authorize a website or application to access resources hosted by third-party services on behalf of a user. For web and mobile applications, [OpenID Connect 1.0](https://openid.net/specs/openid-connect-core-1_0.html) (OIDC) was born in 2014, a simple identity layer on top of OAuth 2.0, now widely adopted as part of the Identity and Access Management strategy of many identity providers and identity clients on the internet.

The OpenID Connect core specification defines the following roles:

1. End-User: Human participant
2. Authorization Server: The server issuing access tokens to the client after successfully authenticating the resource owner and obtaining authorization.
3. Client: An application making protected resource requests on behalf of the resource owner (the end-user) and with its authorization.

From the OpenID Connect specification, the authentication using Authorization Code Flow has the following steps:

{% img blog/spring-security-pkce/auth0-authorization-code.png alt:"Authorization Code Grant" width:"800" %}{: .center-image }

1. Client prepares an authentication request and sends the request to the Authorization Server.
2. Authorization Server prompts for the End-User authentication and obtains End-User consent/authorization.
3. The End-User authenticates and gives consent
4. Authorization Server sends the End-User back to the Client with an Authorization Code.
5. Client requests a response using the Authorization Code at the Token Endpoint.
6. Client receives a response that contains an ID Token and Access Token in the response body.

The diagram is a simplified sequence of the Authorization Code Flow, where the User Agent (the browser) redirections are not shown.

When calling the Token Endpoint, the client application must authenticate itself. The protocol provides several ways for [client authentication](https://openid.net/specs/openid-connect-core-1_0.html#ClientAuthentication):

- `client_secret_basic`: The client was assigned a secret (confidential client) and authenticates using HTTP basic authentication scheme.
- `client_secret_post`: The client was assigned a secret and authenticates by including the client credentials in the request body.
- `client_secret_jwt`: The client was assigned a secret and authenticates using a JWT signed with part of the secret as a shared key.
- `private_key_jwt`: The client has registered a public key and authenticates using a JWT signed with the private key.
- `none`: The client does not authenticate itself at the Token Endpoint, because it is a public client.

As browser and mobile applications _cannot_ hold credentials securely and therefore cannot identify themselves using a client secret, [PKCE](https://www.rfc-editor.org/rfc/rfc7636) was created for extending the OAuth 2.0 Authorization Code Flow, adding a dynamically created cryptographically random key called "code verifier". This extension was created to mitigate the [authorization code interception attack](https://www.rfc-editor.org/rfc/rfc7636#section-1).

The modified flow has the following steps:

{% img blog/spring-security-pkce/auth0-authorization-code-pkce.png alt:"Authorization Code Grant" width:"850" %}{: .center-image }

1. The Client creates and records a secret named the "code_verifier" and derives a transformed version referred to as the "code_challenge", which is sent in the OAuth 2.0 Authorization Request along with the transformation method.
2. The Authorization Endpoint responds as usual but records the "code_challenge" and the transformation method.
3. The Client then sends the authorization code in the Access Token Request as usual but includes the "code_verifier" secret generated in the first step.
4. The Authorization Server transforms "code_verifier" and compares it to the recorded "code_challenge". Access is denied if they are not equal.

The [OAuth 2.0 Security BCP](https://www.ietf.org/archive/id/draft-ietf-oauth-security-topics-24.html) states that PKCE should be enabled for all types of clients, public and confidential (browser-based applications, mobile applications, native applications, and secure server applications) for added security.

## Spring Security for Authorization Code Flow

You can experiment with how to configure the authorization code flow configuration by creating a simple Spring Boot web application, following the step-by-step guide in the following sections.


### Create a simple Spring Boot application

With Spring Initializr and curl, create Spring Boot project:

```shell
curl -v "https://start.spring.io/starter.zip?\
bootVersion=3.2.3&\
language=java&\
packaging=jar&\
javaVersion=17&\
type=gradle-project&\
dependencies=web,okta,thymeleaf&\
groupId=com.example&\
artifactId=spring-web&\
packageName=com.example.demo" \
--output spring-web.zip
```

Then extract the content:

```shell
unzip spring-web.zip -d spring-web
```

If you inspect the contents of `build.gradle`, you will find the Okta Spring Boot Starter dependency is included. The Okta Spring Boot Starter simplifies the process of adding authentication into your Spring Boot application by auto-configuring the necessary classes and adhering to best practices, eliminating the need for you to do it manually. It leverages the OAuth 2.0 and OpenID Connect protocols for user authentication.

Add the following additional dependencies to `build.gradle`:

```groovy
// build.gradle
dependencies {
    ...
    implementation 'me.paulschwarz:spring-dotenv:4.0.0'
    ...
}    
```

Create the `index.html` template at `src/main/resources/templates` with the following content:

```html
<!-- src/main/resources/templates/index.html -->
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Spring Boot + PKCE Demo</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-T3c6CoIi6uLrA9TneNEoa7RxnatzjcDSCmG1MXxSR1GAsXEV/Dwwykc2MPK8M2HN" crossorigin="anonymous">
    <link rel="stylesheet" href="styles.css">
</head>
<body>

<th:block th:replace="~{fragments/navigation.html}" />


<div class="container my-5">
    <h1>Hello, world!</h1>
    <div class="col-lg-8 px-0">
        <p class="fs-5">You've successfully loaded up the Bootstrap starter example. It includes <a href="https://getbootstrap.com/">Bootstrap 5</a> via the <a href="https://www.jsdelivr.com/package/npm/bootstrap">jsDelivr CDN</a> and includes an additional CSS and JS file for your own code.</p>
        <p>Feel free to download or copy-and-paste any parts of this example.</p>

        <hr class="col-1 my-4">

        <a href="https://getbootstrap.com" class="btn btn-primary">Read the Bootstrap docs</a>
        <a href="https://github.com/twbs/examples" class="btn btn-secondary">View on GitHub</a>
    </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js" integrity="sha384-C6RzsynM9kWDrMNeT87bh95OGNyZPhcTNXj1NW7RuBCsyN/o0jlpcV8Qyq46cDfL" crossorigin="anonymous"></script>
<script src="main.js"></script>
</body>
</html>
```

Create the fragment `navigation.html` at `src/main/resources/templates/fragments`:

```html
<!-- src/main/resources/templates/fragments/navigation.html -->
<nav class="navbar navbar-expand-lg navbar-dark bg-dark">
    <div class="container">
        <a class="navbar-brand" href="#">Navbar</a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
            <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navbarSupportedContent">
            <ul class="navbar-nav me-auto mb-2 mb-lg-0">
                <li class="nav-item">
                    <a class="nav-link active" aria-current="page" href="#">Home</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="#">Link</a>
                </li>
            </ul>
            <ul class="navbar-nav d-flex mb-2 mb-lg-0">
                <li class="nav-item dropdown">
                    <a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                        [[${username}]]
                    </a>
                    <ul class="dropdown-menu" aria-labelledby="navbarDropdown">
                        <li><a class="dropdown-item" th:href="@{/profile}">Profile</a></li>
                        <li>
                            <form method="post" th:action="@{/logout}">
                                <input type="hidden" th:name="${_csrf.parameterName}" th:value="${_csrf.token}"/>
                                <button id="logout" class="dropdown-item" type="submit">Logout</button>
                            </form>
                        </li>
                    </ul>
                </li>
            </ul>
        </div>
    </div>
</nav>
```

Create the `HomeController.java` in the `com.example.demo.web` package:

```java
// src/main/java/com/example/demo/web/HomeController.java
package com.example.demo.web;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class HomeController {

    @GetMapping("/")
    public String index(@AuthenticationPrincipal OidcUser oidcUser, Model model) {
        model.addAttribute("username", oidcUser.getEmail());
        return "index";
    }
}
```

Add a `profile.html` template:

```html
<!-- src/main/resources/templates/profile.html -->
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Bootstrap demo</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-T3c6CoIi6uLrA9TneNEoa7RxnatzjcDSCmG1MXxSR1GAsXEV/Dwwykc2MPK8M2HN" crossorigin="anonymous">
    <link rel="stylesheet" href="styles.css">
</head>
<body>

<th:block th:replace="~{fragments/navigation.html}" />


<div class="container my-5">
    <h1>[[${username}]]</h1>
    <div class="col-lg-8 px-0">
        <p class="fs-5">Here are your user's attributes:</p>
        <table class="table table-striped">
            <thead>
            <tr>
                <th>Claim</th>
                <th>Value</th>
            </tr>
            </thead>
            <tbody>
            <tr th:each="item : ${claims}">
                <td th:text="${item.key}">Key</td>
                <td th:id="${'claim-' + item.key}" th:text="${item.value}">Value</td>
            </tr>
            </tbody>
        </table>
    </div>
</div>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js" integrity="sha384-C6RzsynM9kWDrMNeT87bh95OGNyZPhcTNXj1NW7RuBCsyN/o0jlpcV8Qyq46cDfL" crossorigin="anonymous"></script>
<script src="main.js"></script>
</body>
</html>
```

Add the `/profile` handler in the `HomeController` class:

```java
// src/main/java/com/example/demo/web/HomeController.java
...

@GetMapping("/profile")
public String profile(@AuthenticationPrincipal OidcUser oidcUser, Model model) {
    model.addAttribute("username", oidcUser.getEmail());
    model.addAttribute("claims", oidcUser.getClaims());
    return "profile";
}

...
```

### Configure Authentication Code Flow with PKCE at Auth0

> Auth0 supports [OAuth 2.0 Security Best Current Practice](https://oauth.net/2/oauth-best-practice/), and you can register the application as a Regular Web Application (confidential client), and the Auth0 authorization server will honor the PKCE flow.

Sign up at [Auth0](https://a0.to/blog_signup) and install the [Auth0 CLI](https://github.com/auth0/auth0-cli). Then in the command line run:

```shell
auth0 login
```

The command output will display a device confirmation code and open a browser session to activate the device.

Using the Auth0 CLI, register the web application as an authentication client for Auht0:

```shell
auth0 apps create \
  --name "Spring MVC" \
  --description "Spring Boot Webapp" \
  --type regular \
  --callbacks http://localhost:4040/login/oauth2/code/okta \
  --logout-urls http://localhost:4040 \
  --reveal-secrets
```

Notice the output contains your Auth0 domain, clientId, and clientSecret.

Rename `application.properties` to `application.yml` and add the following values:

```yml
# src/main/resources/application.yml
server:
  port: ${PORT}

okta:
  oauth2:
    issuer: ${OKTA_OAUTH2_ISSUER}
    client-id: ${OKTA_OAUTH2_CLIENT_ID}
    client-secret: ${OKTA_OAUTH2_CLIENT_SECRET}

logging:
  level:
    org.springframework.security: DEBUG
    org.springframework.web: DEBUG
```

The Okta Spring Boot Starter will detect the presence of the properties above and auto-configure the Spring Security filter chain for OpenID Connect authentication. The configuration also enables security and web logs for analyzing the authentication flow.

Create a `.env` file under the root project directory:

```shell
touch .env
```

Populate the `.env` with the following environment variables and values from the previous `auth0 apps create` command output:

```shell
PORT=4040
OKTA_OAUTH2_ISSUER=https://<your-auth0-domain>/
OKTA_OAUTH2_CLIENT_ID=<client-id>
OKTA_OAUTH2_CLIENT_SECRET=<client-secret>
```

> The default client authentication method (how the application identifies itself when calling the token endpoint) in Auth0, when you register a regular web application, is `client_secret_post`, but it supports `client_secret_basic` as well. The default client authentication method in Spring Security for confidential clients is `client_secret_basic` if the provider supports it (available in the provider configuration metadata).

Run the application with:

```shell
./gradlew bootRun
```

In your browser, open a private window and go to [**http://localhost:4040/**](localhost:8080). Upon clicking the "Log In" button, Spring MVC redirects you to the Auth0 Universal Login page. If you check the application logs, you will see Spring Security redirects to your Auth0 '/authorize' endpoint:

```
Redirecting to https://dev-avup2laz.us.auth0.com/authorize?response_type=code&client_id=3SgEFDZfV2402hKmNhc0eIN10Z7tem1R&scope=profile%20email%20openid&state=qw8rMCn7N6hv7V4Wx8z5-ejsV8Av8Ypx9KBm5jL6tN4%3D&redirect_uri=http://localhost:4040/login/oauth2/code/okta&nonce=3aiFDmu7aOktibpACDUYuUh4HxLpBAMnVw79EcHDapk&code_challenge=andLN4-6Lu2mtHoPp1Pteu2v87oK_RmzmFLgPaHaY0s&code_challenge_method=S256
```

As you can see, the last two query parameters in the request to `/authorize` endpoint are _code_challenge_ and _code_challenge_method_.

> [Spring Security](https://docs.spring.io/spring-security/reference/servlet/oauth2/client/authorization-grants.html#_obtaining_authorization) will automatically enable PKCE when `client-secret` is omitted or empty, and `client-authentication-method` is none. A client without a secret is assumed to be a public client.

> Since version 2.1.6, the Okta Starter enables PKCE by default for confidential clients. With the Okta Starter default auto-configuration, PKCE is enabled automatically even if the client-secret is set through the Okta Starter configuration properties.

In the browser window, continue with the sign-in flow, and give consent to the application to access your user information:

{% img blog/spring-security-pkce/auth0-consent.png alt:"Auth0 Consent Page" width:"400" %}{: .center-image }

After the approval, Auth0 will redirect the browser to the `index.html` page. At the top right, the navigation has a user drop-down menu, with **Profile** and **Logout** options. If you click on **Profile**, it will display the ID Token claims. If you click on **Logout**, it will end the local session and redirect to a _logged out_ page generated by Spring Security.

{% img blog/spring-security-pkce/home-page.png alt:"Application Home Page" width:"800" %}{: .center-image }

### Configure the logout

Modify the logout flow with the following configuration:

```yml
# src/main/resources/application.yml
...
okta:
  oauth2:
    ...
    post-logout-redirect-uri: "{baseUrl}"
...    
```

Spring security will resolve `{baseUrl}` placeholder to the application base URL at request time.

Make sure [End Session Endpoint Discovery](https://auth0.com/docs/authenticate/login/logout/log-users-out-of-auth0#enable-endpoint-discovery) is enabled in your Auth0 tenant. If enabled, Spring Security will logout the user at the provider with [RP-Initated Logout](https://auth0.com/docs/authenticate/login/logout/log-users-out-of-auth0). In the Auth0 dashboard, choose the **Settings** option from the left menu, and then click the **Advanced** tab.

{% img blog/spring-security-pkce/auth0-end-session-discovery.png alt:"Auth0 End Session Endpoint Discovery toggle option" width:"600" %}{: .center-image }

Restart the application. Now the **Logout** link will end the session at Auth0, and the browser will redirect to the Universal Login page.

### Enable PKCE for confidential clients with custom HttpSecurity

You can customize the OIDC login by defining your own web security, adding a custom `LogoutSuccessHandler` for making the application redirect to the base URL after the logout.

> If the default security configuration is customized with `HttpSecurity.oauth2Login()`, you can re-enable PKCE for confidential clients with [`OAuth2AuthorizationRequestCustomizers.withPkce()`](https://docs.spring.io/spring-security/reference/servlet/oauth2/client/authorization-grants.html#_obtaining_authorization) or with the utility method `Okta.configureOAuth2WithPkce()`

The Okta Starter auto-configuration is conditional to the application not defining its own web security, so when customizing with `HttpSecurity.oauth2Login()`, PKCE is not enabled by default for confidential clients (clients with a secret), and you must enable it explicitly.

```java
// src/main/java/com/example/demo/config/SecurityConfiguration.java
package com.example.demo.config;

import com.okta.spring.boot.oauth.Okta;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.oauth2.client.oidc.web.logout.OidcClientInitiatedLogoutSuccessHandler;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.logout.LogoutSuccessHandler;

@Configuration
public class SecurityConfiguration {

    private final ClientRegistrationRepository clientRegistrationRepository;

    public SecurityConfiguration(ClientRegistrationRepository clientRegistrationRepository) {
        this.clientRegistrationRepository = clientRegistrationRepository;
    }

    private LogoutSuccessHandler logoutSuccessHandler() {
        OidcClientInitiatedLogoutSuccessHandler logoutSuccessHandler = new OidcClientInitiatedLogoutSuccessHandler(this.clientRegistrationRepository);
        logoutSuccessHandler.setPostLogoutRedirectUri("{baseUrl}");

        return logoutSuccessHandler;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.authorizeHttpRequests(authorize ->
                authorize.anyRequest().authenticated())
                .logout(logout -> logout.logoutSuccessHandler(logoutSuccessHandler()));
        Okta.configureOAuth2WithPkce(http, clientRegistrationRepository);
        return http.build();
    }
}
```

## Learn more about PKCE and Spring Boot

I hope this post helped you to gain a basic understanding on authentication with OpenID Connect Authorization Code Flow with PKCE, and how to enable the PKCE security best practice in Spring Boot applications using the Okta Spring Boot Starter.

You can find the code shown in this tutorial on [GitHub](https://github.com/indiepopart/spring-web-pkce).

If you liked this post, you might enjoy these related posts:

- [Deploy Secure Spring Boot Microservices on Amazon EKS Using Terraform and Kubernetes](https://auth0.com/blog/terraform-eks-java-microservices/)
- [Get started with Spring Boot and Auth0](https://auth0.com/blog/get-started-with-okta-spring-boot-starter/)
- [Build a Beautiful CRUD App with Spring Boot and Angular](https://auth0.com/blog/spring-boot-angular-crud/)
- [Get Started with Jetty, Java, and OAuth](https://auth0.com/blog/java-jetty-oauth/)

Check out the Spring Boot resources in our Developer Center:

- [Authorization in Spring Boot](https://developer.auth0.com/resources/labs/authorization/spring-resource-server)
- [Authentication in Spring Boot](https://developer.auth0.com/resources/labs/authentication/spring)
- [Role Based Access Control in Spring Boot](https://developer.auth0.com/resources/labs/authorization/rbac-in-spring-boot)
- [Build and Secure Spring Boot Microservices](https://developer.auth0.com/resources/labs/authorization/securing-spring-boot-microservices)
- [Spring MVC Code Sample: Basic Authentication](https://developer.auth0.com/resources/code-samples/web-app/spring/basic-authentication)

Please follow us on Twitter [@oktadev](https://twitter.com/oktadev) and subscribe to our [YouTube channel](https://www.youtube.com/oktadev) for more Spring Boot and microservices knowledge.

You can also sign up for our [developer newsletter](https://a0.to/nl-signup/java) to stay updated on everything Identity and Security.
