---
layout: blog_post
title:  "Proof Key for Code Exchange (PKCE) in Web Applications with Spring Security"
author: jimena-garbarino
by: advocate|contractor
communities: [security,java]
description: "Implementing OpenID Connect authentication in Java Web Applications with Okta Spring Boot Starter and Spring Security support for Authorization Code Flow with PKCE "
tags: []
tweets:
- ""
- ""
- ""
image:
type: awareness|conversion
---


> **This tutorial was created with the following tools and services**:
> - [Java OpenJDK 17](https://jdk.java.net/java-se-ri/17)
> - [Auth0 account](https://auth0.com/signup)
> - [Auth0 CLI 1.4.0](https://github.com/auth0/auth0-cli#installation)

{% include toc.md %}

## Authorization Code Flow and PKCE

- what is code flow
- what is PKCE
- what standard history
- show code flow
- show code flow with pkce
- who is using it


## Spring Security for Authorization Code Flow

You can experiment on how to configure the authorization code flow configuration using the [Spring Web Application code sample](https://github.com/auth0-developer-hub/web-app_spring_java_hello-world) from Auth0 developer resources.

Clone the repository and checkout the branch `basic-authentication`:

```shell
git clone https://github.com/auth0-developer-hub/web-app_spring_java_hello-world.git \
  && cd web-app_spring_java_hello-world \
  && git checkout basic-authentication
```

Install the Spring MVC project dependencies using Gradle:

```shell
./gradlew dependencies --write-locks
```

If you inspect the contents of `build.gradle`, you will find the Okta Spring Boot Starter dependency is included.

The Okta Spring Boot Starter simplifies the process of adding authentication into your Spring Boot application by auto-configuring the necessary classes and adhering to best practices, eliminating the need for you to do it manually. It leverages the OAuth 2.0 and OpenID Connect protocols for user authentication.

Sign up at [Auth0](https://auth0.com/signup) and install the [Auth0 CLI](https://github.com/auth0/auth0-cli). Then in the command line run:

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

Notice the output contains your Auth0 domain, clientId and clientSecret. Create a `.env` file under the root project directory:

```shell
touch .env
```

Populate the `.env` with the following environment variables and values from the previous `auth0 apps create` command output:

```shell
PORT=4040
OKTA_OAUTH2_ISSUER=https://<your-auth0-domain>/
OKTA_OAUTH2_CLIENT_ID=<auth0-client-id>
OKTA_OAUTH2_CLIENT_SECRET=<auth0-client-secret>
```

The Okta Spring Boot Starter will detect the presence of the above properties and auto-configure the Spring Security filter chain for OpenID Connect authentication.

Enable security and web logs in `application.yml` for analyzing the authentication flow:

```properties
logging:
  level:
    org.springframework.security: DEBUG
    org.springframework.web: DEBUG  
```

Run the application with:

```shell
./gradlew bootRun
```

In your browser, open a private navigation window and go to http://localhost:4040/. Upon clicking the "Log In" button, Spring MVC redirects you to the Auth0 Universal Login page. If you check the application logs, you will see Spring Security redirects to your Auth0 '/authorize' endpoint:

```
Redirecting to https://***.auth0.com/authorize?response_type=code&client_id=3SgEFDZfV2402hKmNhc0eIN10Z7tem1R&scope=profile%20email%20openid&state=cgnIgFiRk0leuILid3kKTaPgADtO3LcqFllYfbaeUN8%3D&redirect_uri=http://localhost:4040/login/oauth2/code/okta&nonce=rxNwGCoeUN-qephca3rREIP1J8Z0YKq4A5imajmsxMc
```


## Enabling PKCE

Enabling PKCE in a Spring Boot web application that has the Okta Starter as dependency is as simple as omitting the client secret in the starter configuration. Since version 2.1.6, the Okta Starter enables PKCE by default, and the underlying [Spring Security](https://docs.spring.io/spring-security/reference/servlet/oauth2/client/authorization-grants.html#_obtaining_authorization) integration will automatically enable PKCE when `client-secret` is omitted or empty, and `client-authentication-method` is none (which is set as default by the Okta Starter auto-configuration).

Edit the `application.yml` file, and adjust the starter configuration to this:

```yml
okta:
  oauth2:
    issuer: ${OKTA_OAUTH2_ISSUER}
    client-id: ${OKTA_OAUTH2_CLIENT_ID}
```    

Restart the applications, and navigate again to go to http://localhost:4040/. Upon the login redirection to Auth0, you will see new URL parameters in the request logs:

 ```
 Redirecting to https://dev-avup2laz.us.auth0.com/authorize?response_type=code&client_id=3SgEFDZfV2402hKmNhc0eIN10Z7tem1R&scope=profile%20email%20openid&state=qw8rMCn7N6hv7V4Wx8z5-ejsV8Av8Ypx9KBm5jL6tN4%3D&redirect_uri=http://localhost:4040/login/oauth2/code/okta&nonce=3aiFDmu7aOktibpACDUYuUh4HxLpBAMnVw79EcHDapk&code_challenge=andLN4-6Lu2mtHoPp1Pteu2v87oK_RmzmFLgPaHaY0s&code_challenge_method=S256
 ```

 As you can new last two query parameters in the request to `/authorize` endpoint are _code_challenge_ and _code_challenge_ method.

## Learn more about PKCE and Spring Boot

I hope this post helped you to gain a basic understanding on authentication with OpenID Connect Authorization Code Flow with PKCE, and how to enable the PKCE security best practice in Spring Boot applications using the Okta Spring Boot Starter.

You can find the code shown in this tutorial on GitHub, in the [Auth0 Developer Hub](https://github.com/auth0-developer-hub/web-app_spring_java_hello-world) repository.

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
