---
layout: blog_post
title: "Java REST API Showdown: Which is the Best Framework on the Market?"
author: daniel-pereira
description: "A Quick Guide to creating REST APIs with popular Java frameworks: Micronaut, Quarkus, and Spring Boot."
tags: [java, rest, api, spring boot, quarkus, micronaut]
tweets:
- "Learn how to create REST APIs with @micronautfw, @QuarkusIO, and @springboot."
- "We created a guide for how to create REST APIs with leading Java frameworks: Micronaut, Quarkus, and Spring Boot."
- "REST APIs are still popular! Learn how to do it in 2019 with @micronautfw, @QuarkusIO, and @springboot."
image: blog/featured/okta-java-short-skew.jpg
---

Developing services, including REST APIs, in Java, wasn't always something easy or productive, but then Spring came along and change the landscape. Many years have passed since then, and new frameworks emerged in the community.

One of these frameworks was Micronaut. It's developed by OCI, the same company behind Grails, and their goal is to help to create microservices and serverless applications.

There is also Quarkus, another framework that gained popularity during this year. Quarkus,  a framework developed by RedHat, promises to deliver fast startup and less memory usage, which are two problems that are common when developing REST services in Java.

In these times, there is a very important question to ask: how easy it is to create a service in these three frameworks?

In this tutorial, you'll create a secure REST application in each of the frameworks we're comparing. By the end of this tutorial, you'll be able to see how they differ from one another, and which one best suits your needs.

## Pre-requisites for Your Java REST API

This tutorial uses [Maven 3+](https://maven.apache.org). Make sure it is installed and available to use before continuing. You can certainly also use Gradle, but YMMV.

You're going to build apps that authenticate requests using OAuth 2.0, secured by an Okta application. Don't have an Okta account? Don't worry, it takes less than a minute to create a new one. Not only that, but Okta supports standards like JWT, OAuth 2.0, and OIDC. We provide support for well-known frameworks like Java EE, Spring Boot, and Spring Security. Heck, we even have a [Maven plugin](https://github.com/oktadeveloper/okta-maven-plugin) that automates everything for you. 

There's no need to reinvent the wheel!
### Create an Okta Account for User Management

Open your terminal, and execute the following command:

```bash
mvn com.okta:okta-maven-plugin:setup
```

You will be asked to input the following information:

* First Name
* Last Name
* Email
* Company

Once you've answered the questions, you'll receive an email to activate your brand new account. With the account activated, you're ready to go!

The Maven plugin already creates an application for you with auth code flow and Spring Security's redirect URI for Okta.

{% img blog/java-rest-api/okta-maven-app.png alt:"Okta Maven-generated application" width:"700" %}{: .center-image }

To remember it better, you can create the same app manually:

* Go to the [Okta's developer homepage](https://developer.okta.com/) and log in to your account.
* Click on **Applications** > **Add Application** > **Web** > **Next**.

You'll see the following screen:

{% img blog/java-rest-api/okta-new-app.png alt:"Okta new application" width:"700" %}{: .center-image }

Before you continue, make the following changes in the application:

* Name: `my-app`
* Login redirect URIs:
  * `http://localhost:8080/login/oauth2/code/okta`
  * `https://oidcdebugger.com/debug`
* Grant type allowed
  * Client Credentials
  * Authorization Code

The fields not mentioned above can keep their default values.

After you finish it, click **Done**. Your app is ready! The next step is to learn how to generate a valid token using it.

### Generate Tokens Using OpenID Connect Debugger

Your requests will be validated using a token. To generate this token, you will use OpenID Connect Debugger. This website will provide you an easy way to generate credentials for the users on your Okta application.

Go to the https://oidcdebugger.com/ and fill in the following information:

* Authorize URI: `https://{yourOktaDomain}/oauth2/default/v1/authorize`
* Redirect URI: `https://oidcdebugger.com/debug`
* Client ID: `{yourOktaClientId}`
* Scope: `openid`
* State: `dev`
* Nonce: (keep the default value)
* Response type: `token`

You can find the value for `{yourOktaDomain}` in the right upper corner of your account's homepage:

{% img blog/java-rest-api/okta-homepage.png alt:"Okta Homepage" width:"800" %}{: .center-image }

To find your Okta Client ID follow the steps below:

* Go to **Applications**
* Select **my-app**
* Click **General**

The Client ID will be available in the **Client Credentials** section:

{% img blog/java-rest-api/client-credentials.png alt:"Client Credentials" width:"700" %}{: .center-image }

After you complete all the fields, click **Send Request**. You'll be redirected to your Okta login page.

Once you have successfully authenticated, you'll be redirected to OIDC Debugger again, where you can see the generated token:

{% img blog/java-rest-api/generated-token.png alt:"Generated Token" width:"800" %}{: .center-image }

You'll use this token in the header of the requests you'll make in the services you're going to build.

Now that you have an Okta account and you know how to generate tokens using your Okta application, let's start comparing the frameworks!

## Build a Java REST API with Micronaut

The first step to start developing your Micronaut service is to download [SDKMAN!](https://sdkman.io/). SDKMAN! is a tool for managing parallel versions of multiple SDKs, which you'll use to install the Micronaut client.

You can download SDKMAN! by running the following command:

```bash
curl -s https://get.sdkman.io | bash
```

Now, you can install Micronaut itself. Just run the following command in the terminal:

```bash
sdk install micronaut
```

After the command finishes executing, you'll have the latest Micronaut version available on your computer.

You're ready to start developing the application!

### Develop Your Java Service

Go to the directory you want to create your application in and execute the following command:

```bash
mn create-app com.okta.rest.micronaut --build maven
```

This command will create a project with the basic structure of a Micronaut project. By default Micronaut uses Gradle, but since you're using `--build maven` it will use Maven instead.

The next step is to add the security libraries inside the project. Go to the `pom.xml` file and add the following dependencies:

```xml
<dependency>
    <groupId>io.micronaut.configuration</groupId>
    <artifactId>micronaut-security-oauth2</artifactId>
</dependency>
<dependency>
    <groupId>io.micronaut</groupId>
    <artifactId>micronaut-security</artifactId>
</dependency>
<dependency>
    <groupId>io.micronaut</groupId>
    <artifactId>micronaut-security-jwt</artifactId>
</dependency>
```

These dependencies will enable security inside your project. Now that you have all the dependencies in place, you can start creating your endpoint.

Go to `src/main/java/com/okta/rest/controller` and create the following class:

```java
import io.micronaut.http.MediaType;
import io.micronaut.http.annotation.Controller;
import io.micronaut.http.annotation.Get;
import io.micronaut.http.annotation.Produces;
import io.micronaut.security.annotation.Secured;
import io.micronaut.security.authentication.Authentication;
import io.micronaut.security.rules.SecurityRule;

@Controller("/hello")
public class HelloController {

    @Get
    @Secured(SecurityRule.IS_AUTHENTICATED)
    @Produces(MediaType.TEXT_PLAIN)
    public String hello(Authentication authentication) {
        return "Hello, " + authentication.getName() + "!";
    }

}
```

The `@Controller` annotation indicates to Micronaut that this component will receive requests in the `/hello` path.

The class has only one method, named `hello()`. The `@Get` annotation shows that the method will receive HTTP GET requests. You need `@Produces` because Micronaut's default return type is a JSON object. Since you're returning simple text you need to explicitly define this information in the method.

The last annotation is `@Secured`. It simply tells Micronaut that this method is only accessible to authenticated users.

You now have a controller that is secured, but you still didn't define the security configuration. Let's configure Micronaut to connect to your Okta application.

Go to `resources/application.yml` and add the following code:

```yml
micronaut:
  application:
    name: micronaut
  security:
    enabled: true
    oauth2:
      enabled: true
      clients:
        okta:
          openid:
            issuer: https://{yourOktaDomain}/oauth2/default
    token:
      jwt:
        enabled: true
        cookie:
          enabled: true
        signatures:
          jwks:
            okta:
              url: https://{yourOktaDomain}/oauth2/default/v1/keys
```


Replace `{yourOktaDomain}` with the value from your Okta account.

The configuration above enables security using OAuth 2.0. You declare that your OAuth 2.0 client comes from Okta, by specifying the issuer from your Okta account.

You're also enabling the use of JSON web tokens, or JWTs. Since you want to read the information from Okta, you must declare where you can find your JWKS (JSON Web Key Set) to validate JWT signatures.

It's time to test your service! Start your application by executing the following command:

```bash
./mvnw exec:exec
```

With your app running, execute the following command:

```bash
curl -X GET -I http://localhost:8080/hello
```

The command above will produce a result similar to this one:

```bash
HTTP/1.1 401 Unauthorized
Date: Tue, 8 Jan 2019 15:47:36 GMT
transfer-encoding: chunked
connection: close
```

As you can see, the request didn't go through. To make it work, you need to pass in the OAuth 2.0 access token retrieved by the OIDC Debugger.

Execute the command below, changing `<TOKEN>` for the token you obtained on OIDC Debugger:

```bash
curl -X GET http://localhost:8080/hello \
  -H 'Authorization: Bearer <TOKEN>'
```

Now it works as expected! This time you're receiving the greeting message as a response:

```bash
Hello, daniel.pereira@gmail.com!
```

Great! Now let's see how you create the same app using Quarkus.

## Build a Java REST API with Quarkus

To develop your application using Quarkus you only need Maven installed, there is no other dependency needed.

Let's start creating your app! Go to the directory you want it to be created in and execute the following command:

```bash
mvn io.quarkus:quarkus-maven-plugin:1.1.Final:create \
    -DprojectGroupId=com.okta.rest \
    -DprojectArtifactId=quarkus \
    -DclassName="com.okta.rest.quarkus.HelloResource" \
    -Dpath="/hello" \
    -Dextensions="jwt"
```

The command above creates a project using the Quarkus Maven plugin. It will create a resource named `HelloResource`, which is going to receive requests on the `/hello` path. You're also adding the JWT extension from Quarkus on the project.

Once you create the project, go to `src/java/com/okta/rest/quarkus` and make the following changes:

```java
import io.quarkus.security.Authenticated;

import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.SecurityContext;
import java.security.Principal;

@Path("/hello")
public class HelloResource {

    @GET
    @Path("/")
    @Authenticated
    @Produces(MediaType.TEXT_PLAIN)
    public String hello(@Context SecurityContext context) {
        Principal userPrincipal = context.getUserPrincipal();
        return "Hello, " + userPrincipal.getName() + "!";
    }
}
```

The class above will behave the same way as the one you created in Micronaut. It reads the user's information based on the token that was generated in the request and returns a greeting message to the user that is found.

You still haven't configured Quarkus with your issuer and keys from Okta, so let's do that.

Go to `resources/application.properties` and add the following code:

```properties
mp.jwt.verify.publickey.location=https://{yourOktaDomain}/oauth2/default/v1/keys
mp.jwt.verify.issuer=https://{yourOktaDomain}/oauth2/default
```

Done! The Quarkus version of your application is ready to be tested. Go to your project folder and execute the following command:

```bash
./mvnw compile quarkus:dev
```

The command above will start your application.

The first step is to make sure you receive a `401 - Unauthorized` when you don't use the correct credentials.

Execute the following command in the terminal:

```bash
curl -X GET -I http://localhost:8080/hello
```

As expected, the result is an HTTP 401 response:

```bash
HTTP/1.1 401 Unauthorized
www-authenticate: Bearer {token}
Content-Length: 0
```

If you execute passing the token obtained by the OIDC Debugger it should return the greeting message.

Execute the following command:

```bash
curl -X GET http://localhost:8080/hello \
  -H 'Authorization: Bearer <TOKEN>'
```

It worked like a charm! In my case, the result was:

```bash
Hello, daniel.pereira@email.com!
```

Two down, one to go! Now that you were able to implement the app on Micronaut and Quarkus, let's finish by creating the same app using Spring Boot.

## Build a Java REST API with Spring Boot

Spring Boot doesn't have any prerequisites to start creating your app, so let's start by creating the project!

Open your terminal and execute the following command:

```bash
curl https://start.spring.io/starter.zip -d language=java \
 -d dependencies=web,okta \
 -d packageName=com.okta.rest \
 -d name=spring-boot \
 -d type=maven-project \
 -o spring-boot.zip
```

The command above will create a `.zip` file with a Spring Boot application that uses Maven. You can extract the file into the directory you want to work on.

The last step is to implement the controller that will receive the requests.

Go to `src/main/java/okta/rest/springboot/controller` and create the following class:

```java
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

@RestController
public class HelloController {

    @GetMapping("/hello")
    public String hello(@AuthenticationPrincipal Principal principal) {
        return "Hello, " + principal.getName() + "!";
    }

}
```

The configuration here is very similar to the other frameworks. You annotate the class with `@RestController` to let Spring know that you'll receive requests on the class. `@GetMapping` will receive HTTP GET requests on the `/hello` path. To retrieve the authenticated user you use the `@AuthenticationPrincipal` annotation.

Different from the other frameworks, you don't need to specify that this endpoint is authenticated since Spring already controls this information from its configurations.

The last step is to add the issuer information, allowing Spring to know how to reach your Okta application.

Go to `resources/applications.properties` and add the following configuration:

```properties
okta.oauth2.issuer=https://dev-919283.okta.com/oauth2/default
```

Let's test it! Open a terminal and execute the command below:

```bash
curl -X GET -I http://localhost:8080/hello
```

The response is an HTTP 401 error, since you didn't include the token:

```bash
HTTP/1.1 401
Set-Cookie: JSESSIONID=316DCFD55C302A8D69EFD865411DFA77; Path=/; HttpOnly
WWW-Authenticate: Bearer
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Cache-Control: no-cache, no-store, max-age=0, must-revalidate
Pragma: no-cache
Expires: 0
X-Frame-Options: DENY
Content-Length: 0
Date: Mon, 09 Dec 2019 13:01:35 GMT
```

Test it again, now passing the token:

```bash
curl -X GET http://localhost:8080/hello \
  -H 'Authorization: Bearer <TOKEN>'
```

It worked! As it happens with the other services, the result of my executing is the following one:

```bash
Hello, daniel.pereira@email.com!
```

That's it! You implemented a basic Java REST API  in all three frameworks!

## Final Thoughts on REST APIs With Java: Micronaut, Quarkus, and Spring Boot

When it comes to developing your REST API, all three frameworks did the job well. With only a couple of classes, you were able to develop a secure application using Okta and OAuth 2.0.

Spring has been around for many years, it's widely popular, and has many features around its ecosystem. Personally, I still believe it is the best option available when programming in Java.

Micronaut and Quarkus are growing in popularity and gaining momentum inside the Java community. If you're facing performance issues, or maybe if you're aching for a change, you might give one of them a try and see how it goes.

In the end, you'll be able to be productive when developing a secure application, regardless of the choice you make.

Want to take a look at the source code? You can find it on [GitHub at okta-java-rest-api-comparison-example](https://github.com/oktadeveloper/okta-java-rest-api-comparison-example).

Do you want to learn more about Java, REST APIs, and secure applications? Here are some other posts from our blog that you might find useful:

* [OAuth 2.0 Java Guide: Secure Your App in 5 Minutes](https://developer.okta.com/blog/2019/10/30/java-oauth2)
* [Java Microservices with Spring Boot and Spring Cloud](https://developer.okta.com/blog/2019/05/22/java-microservices-spring-boot-spring-cloud)
* [How to Develop a Quarkus App with Java and OIDC Authentication](https://developer.okta.com/blog/2019/09/30/java-quarkus-oidc)
* [Simple Authentication with Spring Security](https://developer.okta.com/blog/2019/05/31/spring-security-authentication)

For more posts like this one, follow [@oktadev on Twitter](https://twitter.com/oktadev). We also regularly publish screencasts to [our YouTube channel](https://youtube.com/c/oktadev)!
