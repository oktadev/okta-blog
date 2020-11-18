---
layout: blog_post
title: Spring Cloud Config
author: joe-cavazos
by: contractor
communities: [java]
description: "This tutorial shows how to use Spring Cloud config to manage configuration properties for multiple Spring Boot applications from a single source."
tags: [java, spring-boot, oauth2, spring-cloud, spring-cloud-config]
tweets:
- ""
- ""
- ""
image:
type: conversion
---

The microservice architecture pattern, in which business functionality is distributed among many small atomic applications as opposed to one or two monolithic chunks, is very powerful and in wide use across large and small tech companies. Each piece has a narrow, well-defined task and communicates with other services via a shared channel (usually REST APIs).

The benefits of adopting a microservice architecture include:

- Easier maintenance and development of applications: developers and teams can focus on just one application resulting in more rapid development and reduced risk of unintentionally introducing bugs in the larger project.
- Improved fault tolerance: in a well-designed microservice architecture, one service's failure will not crash the entire project.
- Flexibility: each service can be written in a language and framework that is appropriate to its mission, and each can be allocated the most appropriate hardware/infrastructure.

Spring Boot is a very popular framework for creating microservices quickly and easily. Due to its popularity, it is also extremely well-supported with plenty of technical guides and examples online.

It's easy to create several, dozens, or even hundreds of microservices for your project with Spring Boot. One speed bump with this approach, however, is the configuration of all these services. Typically in Spring Boot configuration is bundled with the application. This works fine for small, monolithic applications, but when dealing with dozens of services and potentially hundreds of configuration files, managing all of them can be a headache.

This is where **Spring Cloud Config**, a framework integrated with Spring Boot, is useful. A dedicated "config server" is brought online from which each microservice can download its configuration data. This dramatically simplifies the management of many microservices by centralizing their configuration in one location and provides the ability to "live" refresh a microservice's configuration without redeploying the service. As a bonus, Spring Cloud Config provides out-of-the-box support for storing/reading configuration from Git repositories, giving you a full audit history of changes in one location.

In this tutorial, you will:

- Create a central configuration server using Spring Boot.
- Create two separate microservices/applications using Spring Boot, which read their configuration from the server.
- Secure the applications using OAuth 2.0 and Okta.
- Demonstrate how to (securely) refresh a service's configuration without redeploying.

Let's get started!

**Prerequisites**
* [Java 11](https://adoptopenjdk.net)

**Table of Contents**{: .hide }
* Table of Contents
{:toc}

## Create a Spring Cloud Config Server

First you will create a Spring Boot application that behaves as the configuration server. This application will provide configuration settings to your microservices.

Go to the [Spring initializr](https://start.spring.io/):

Select the following options:

- **Project**: `Maven Project`
- **Language**: `Java`
- **Spring Boot**: `2.3.6` (**Important: this option is not selected by default**)

Under **Project Metadata** fill in the following information:

- **Group**: `com.okta.dev.springcloudconfig`
- **Artifact**: `config-server`
- **Name**: `cloud-config-server`
- **Description**: Configuration Server
- **Package**: `com.okta.dev.springcloudconfig.config-server`
- **Packaging**: `Jar`
- **Java**: `11`

Select the following dependencies:

- **Spring Security**
- **Spring Web**
- **Config Server**

Click **Generate** to download the project files. Unzip the file and import the project files into your favorite IDE.

{% img blog/spring-cloud-config-okta/07_2.png alt:"Config Server Initializr" width:"800" %}{: .center-image }

Open the project in your IDE and create a file at `/src/main/resources/application.properties` with the following key-value pairs:

```properties
server.port=8888
spring.cloud.config.server.native.search-locations=/path/to/config/folder
spring.security.user.name=configUser
spring.security.user.password=configPass
```

The property `spring.cloud.config.server.native.search-locations` is the location where you store your configuration files. **Replace the value with a folder on your filesystem where these files will be saved.**

Normally your configuration files would be stored in a remote location, for example, a GitHub repository or an Amazon S3 bucket. For instructions on how to store your config files in a git repository, see [this section](https://cloud.spring.io/spring-cloud-config/reference/html/#_git_backend) in the Spring Cloud Config documentation. To keep this tutorial simple, you will use the "native" filesystem option above.

Open your application's main class and add the `@EnableConfigServer` annotation:
```java
import org.springframework.cloud.config.server.EnableConfigServer;

@EnableConfigServer
@SpringBootApplication
public class CloudConfigServerApplication { ... 
}
```

Next, create the configuration files which will be used by your microservices. Create or open the directory specified above for `spring.cloud.config.server.native.search-locations` and add the following files:

`service-one.yml`
```yaml
server:
  port: 8001

okta:
  oauth2:
    issuer: https://YOUR_DOMAIN.okta.com/oauth2/default
    clientId: YOUR_CLIENT_ID
    clientSecret: YOUR_CLIENT_SECRET
```

`service-one-profile1.yml`
```yaml
hello:
  message: "Service One Profile One"
```

`service-one-profile2.yml`
```yaml
hello:
  message: "Service One Profile Two"
```

`service-two.yml`
```yaml
server:
  port: 8002

okta:
  oauth2:
    issuer: https://YOUR_DOMAIN.okta.com/oauth2/default
    clientId: YOUR_CLIENT_ID
    clientSecret: YOUR_CLIENT_SECRET
```

`service-two-profile1.yml`
```yaml
hello:
  message: "Service Two Profile One"
```

`service-two-profile2.yml`
```yaml
hello:
  message: "Service Two Profile Two"
```

* Replace `YOUR_DOMAIN` with your Okta account's domain. It should look something like `dev-0123456`, e.g. `https://dev-0123456.okta.com/oauth2/default`,
* Replace `YOUR_CLIENT_ID` with the value of `Client ID` noted earlier under `My Application > General > Client Credentials`.
* Replace `YOUR_CLIENT_SECRET` with the value of `Client Secret` noted earlier under `My Application > General > Client Credentials`.

Let's take a moment to discuss the naming convention for the configuration files. The filenames are important and must be in a certain pattern for your microservices to pick them up:

```text
/{application}/{profile}[/{label}]
/{application}-{profile}.yml
/{label}/{application}-{profile}.yml
/{application}-{profile}.properties
/{label}/{application}-{profile}.properties
```

Where:
- `{application}` is the name of your microservice specified via your microservice's `spring.application.name` property. In this case, `service-one` and `service-two`.
- `{profile}` matches the list of profiles your microservice is running via the `spring.profiles.active` property. In this case, `profile1` and `profile2`.
- `{label}` is an additional descriptor usually corresponding to a version control branch, e.g. `dev` or `stg`. It can be manually set via the `spring.cloud.config.label` property in the microservice's `bootstrap.properties` file or set on the command line (`-Dspring.cloud.config.label`).

In this tutorial, you have two sets of configuration files: one set for Service One (`service-one.yml`) and one for Service Two (`service-two.yml`).

Enter your config server's project directory and run the application:

```shell script
cd /path/to/my/config-server
./mvnw spring-boot:run -Dspring-boot.run.profiles=native
```

The `native` profile tells the application to server configuration files from the filesystem directory you populated above.

## Create an OpenID Connect Application in Okta

Sign up for a free developer account at <https://developer.okta.com/signup>. This will be used to secure our microservices using OAuth 2.0 and OpenID Connect (OIDC). After signing up, log in to your Okta account at `https://your-okta-domain.okta.com`.

Click **Applications** in the top nav menu.

{% img blog/spring-cloud-config-okta/01.png alt:"Click the Applications button" width:"800" %}{: .center-image }

Click **Add Application**.

{% img blog/spring-cloud-config-okta/02.png alt:"Click Add Application" width:"800" %}{: .center-image }

Select **Web** and click **Next**.

{% img blog/spring-cloud-config-okta/03.png alt:"Select Web and click Next" width:"800" %}{: .center-image }

In **Application Settings** fill in the following values:

- **Name**: `My Spring Cloud App` (or another name of your choosing)
- **Base URIs**: `http://localhost:8001` and `http://localhost:8002`
- **Login Redirect URIs**: `http://localhost:8001/login/oauth2/code/okta` and `http://localhost:8002/login/oauth2/code/okta`
- **Logout Redirect URIs**: `http://localhost:8001` and `http://localhost:8002`
- **Group Assignments**: `Everyone` (should be selected by default)
- **Client acting on behalf of a user**: `Authorization Code`

{% img blog/spring-cloud-config-okta/04_2.png alt:"Application settings" width:"800" %}{: .center-image }

Click **Done**.

{% img blog/spring-cloud-config-okta/05.png alt:"Click Done" width:"800" %}{: .center-image }

Take note of the values for **Client ID** and **Client secret**. These will be necessary for securing your microservices with OAuth2.

{% img blog/spring-cloud-config-okta/06.png alt:"Client ID and Secret" width:"800" %}{: .center-image }

## Create Spring Boot Microservice #1

Let's create the first of your two microservices.

Open the [Spring Initializr](https://start.spring.io/).

Select the following options:

- **Project**: `Maven Project`
- **Language**: `Java`
- **Spring Boot**: `2.3.6` (**Important: this option is not selected by default**)

Under **Project Metadata** fill in the following information:

- **Group**: `com.okta.dev.springcloudconfig`
- **Artifact**: `service-one`
- **Name**: `service-one`
- **Description**: Microservice One
- **Package**: `com.okta.dev.springcloudconfig.service-one`
- **Packaging**: `Jar`
- **Java**: `11`

Select the following dependencies:

- **Spring Security**
- **Spring Web**
- **Okta**
- **Config Client**
- **Spring Boot Actuator**

Click **Generate** and import the project files into your favorite IDE.

{% img blog/spring-cloud-config-okta/08_2.png alt:"Service One Initializr" width:"800" %}{: .center-image }

Open the project in your IDE and create a file at `/src/main/resources/bootstrap.properties` with the following key-value pairs:

```properties
spring.application.name=service-one
spring.cloud.config.uri=http://localhost:8888
spring.cloud.config.username=configUser
spring.cloud.config.password=configPass
```

* `spring.application.name` is the name of this microservice and must match the `{application}` parameter in the filename convention described above.
* `spring.cloud.config.uri` is the location of the config server currently running.
* `spring.cloud.config.username` and `spring.cloud.config.password` are used by your microservice to authenticate with the config server while retrieving configuration files. The values must match the values of `spring.security.user.name` and `spring.security.user.password` defined in your config server's `application.properties`.

To secure your microservice using Okta and OAuth 2.0, open your microservice's main class and add the following configuration class:

```java
@Configuration
public static class ApplicationSecurityConfig extends WebSecurityConfigurerAdapter {
    
    @Override
    public void configure(HttpSecurity http) throws Exception {
        http
                .authorizeRequests()
                .anyRequest().authenticated()
                .and()
                .oauth2Login();
    }
}
```

Next, add a basic REST controller, which will respond with a message defined in your service's configuration file (hosted on the config server):

```java
@RestController
@RequestMapping("/secure")
public static class SecureController {
    
    @Value("${hello.message}")
    private String helloMessage;

    @GetMapping
    public String secure(Principal principal) {
        return helloMessage;
    }
}
```

The resulting application class should now look like this:

```java
package com.okta.cloudconfigserviceone;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.context.config.annotation.RefreshScope;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.security.Principal;

@SpringBootApplication
public class CloudConfigServiceOneApplication {

    public static void main(String[] args) {
        SpringApplication.run(CloudConfigServiceOneApplication.class, args);
    }

    @Configuration
    public static class ApplicationSecurityConfig extends WebSecurityConfigurerAdapter {
        @Override
        public void configure(HttpSecurity http) throws Exception {
            http
                    .authorizeRequests()
                    .anyRequest().authenticated()
                    .and()
                    .oauth2Login();
        }
    }

    @RestController
    @RequestMapping("/secure")
    public static class SecureController {

        @Value("${hello.message}")
        private String helloMessage;

        @GetMapping
        public String secure(Principal principal) {
            return helloMessage;
        }
    }
}
```

Enter your config server's project directory and run the application with `profile1` set:

```shell script
cd /path/to/my/service-one
./mvnw spring-boot:run -Dspring-boot.run.profiles=profile1
```

Open a browser and navigate to `http://localhost:8001/secure`. You should be redirected to Okta for authentication. After successfully authenticating, you should see the following message:

```text
Service One Profile One
```

This is the same message defined in the `service-one-profile.yml` file you created earlier. Neat!

Next, you will switch your microservice's active profile to `profile2` and observe a different message. Stop your application and re-run with `profile2` active:

```shell script
./mvnw spring-boot:run -Dspring-boot.run.profiles=profile2
```

Navigate to `http://localhost:8001/secure`. You should now see the message defined in `service-one-profile2.yml`:

```text
Service One Profile Two
```

## Refresh the Configuration in Your Spring Cloud Config Server

Spring Cloud Config provides the ability to "live" reload your service's configuration without stopping or re-deploying. To demonstrate this, first, stop `service-one` and add the `@RefreshScope` annotation to your REST controller:

```java
@RefreshScope
@RestController
@RequestMapping("/secure")
public static class SecureController {

    @Value("${hello.message}")
    private String helloMessage;

    @GetMapping
    public String secure(Principal principal) {
        return helloMessage;
    }
}
```

When this annotation is applied to a Spring component (i.e., a `@Component`, `@Service`, `@RestController`, etc.), the component is re-created when a configuration refresh occurs, in this case giving an updated value for `${hello.message}`.

You can refresh an application's configuration by including the **Spring Boot Actuator** dependency, exposing the `/actuator/refresh` endpoint, and sending an empty `POST` request.

The **Spring Boot Actuator** has already been included in your microservice's dependencies. Edit your configuration files to expose the `refresh` endpoint:

`service-one.yml`
```yaml
server:
  port: 8001

okta:
  oauth2:
    issuer: https://YOUR_DOMAIN.okta.com/oauth2/default
    clientId: YOUR_CLIENT_ID
    clientSecret: YOUR_CLIENT_SECRET

management:
  endpoints:
    web:
      exposure:
        include: "refresh"
```

`service-two.yml`
```yaml
server:
  port: 8002

okta:
  oauth2:
    issuer: https://YOUR_DOMAIN.okta.com/oauth2/default
    clientId: YOUR_CLIENT_ID
    clientSecret: YOUR_CLIENT_SECRET

management:
  endpoints:
    web:
      exposure:
        include: "refresh"
```

Next, add a security class inside your main application class to secure the endpoint with basic authentication:

```java
@Configuration
public static class ActuatorSecurityConfig extends WebSecurityConfigurerAdapter {
    @Override
    public void configure(HttpSecurity http) throws Exception {
        http
                .csrf().disable()
                .antMatcher("/actuator/*")
                .authorizeRequests()
                .antMatchers("/actuator/*").authenticated()
                .and()
                .httpBasic();
    }

    @Override
    protected void configure(AuthenticationManagerBuilder auth) throws Exception {
        auth.inMemoryAuthentication()
                .withUser("serviceOneUser")
                .password("{noop}serviceOnePassword")
                .roles("USER");
    }
}
```

Almost finished! Since your application is already authenticated with OIDC  using Okta, you need to make these two security configuration classes play nicely with each other. Add the `@Order` annotations to both so `ActuatorSecurityConfig` takes precedence. This will allow you to refresh the configuration via `/actuator/refresh` without triggering the OAuth 2.0 flow.

Your application class should now look like this:

```java
package com.okta.cloudconfigserviceone;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.context.config.annotation.RefreshScope;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.http.HttpServletRequest;
import java.security.Principal;

@SpringBootApplication
public class CloudConfigServiceOneApplication {

    public static void main(String[] args) {
        SpringApplication.run(CloudConfigServiceOneApplication.class, args);
    }

    @Order(1)
    @Configuration
    public static class ActuatorSecurityConfig extends WebSecurityConfigurerAdapter {
        @Override
        public void configure(HttpSecurity http) throws Exception {
            http
                    .csrf().disable()
                    .antMatcher("/actuator/*")
                    .authorizeRequests()
                    .antMatchers("/actuator/*").authenticated()
                    .and()
                    .httpBasic();
        }

        @Override
        protected void configure(AuthenticationManagerBuilder auth) throws Exception {
            auth.inMemoryAuthentication()
                    .withUser("serviceOneUser")
                    .password("{noop}serviceOnePassword")
                    .roles("USER");
        }
    }

    @Order(2)
    @Configuration
    public static class ApplicationSecurityConfig extends WebSecurityConfigurerAdapter {
        @Override
        public void configure(HttpSecurity http) throws Exception {
            http
                    .authorizeRequests()
                    .anyRequest().authenticated()
                    .and()
                    .oauth2Login();
        }
    }

    @RefreshScope
    @RestController
    @RequestMapping("/secure")
    public static class SecureController {

        @Value("${hello.message}")
        private String helloMessage;

        @GetMapping
        public String secure(Principal principal) {
            return helloMessage;
        }
    }
}
```

Start your application using `profile1`:

```shell script
./mvnw spring-boot:run -Dspring-boot.run.profiles=profile1
```

Navigate to `http://localhost:8001/secure` and note the message still says `Service One Profile One`.

Open your configuration file at `/path/to/config/folder/service-one-profile1.yml` and edit the message:

`service-one-profile1.yml`
```yaml
hello:
  message: "Things have changed"
```

Save the file and refresh the page at `http://localhost:8001/secure`. Note that the message has not changed yet and still says `Service One Profile One`. To have your application receive the updated configuration, you must call the `/actuator/refresh` endpoint:

```shell
curl -u serviceOneUser:serviceOnePassword -X POST http://localhost:8001/actuator/refresh
```

Refresh the page at `http://localhost:8001/secure`, and you should see the updated message!

## Create Spring Boot Microservice #2

Next, you will create a second Spring Boot application, acting as a second microservice, which will also have its configuration provided by your configuration server.

Open the [Spring initializr](https://start.spring.io/).

Select the following options:

- **Project**: `Maven Project`
- **Language**: `Java`
- **Spring Boot**: `2.3.6` (**Important: this option is not selected by default**)

Under **Project Metadata** fill in the following information:

- **Group**: `com.okta.dev.springcloudconfig`
- **Artifact**: `service-two`
- **Name**: `service-two`
- **Description**: Microservice One
- **Package**: `com.okta.dev.springcloudconfig.service-two`
- **Packaging**: `Jar`
- **Java**: `11`

Select the following dependencies (the same list as `service-one`):

- **Spring Security**
- **Spring Web**
- **Okta**
- **Config Client**
- **Spring Boot Actuator**

Click **Generate** and import the project files into your favorite IDE.

Open the project in your IDE and create a file at `/src/main/resources/bootstrap.properties` with the following properties:

```properties
spring.application.name=service-two
spring.cloud.config.uri=http://localhost:8888
spring.cloud.config.username=configUser
spring.cloud.config.password=configPass
```

Note the value for `spring.application.name` is different.

Make the same changes to your main application class as above:

```java
package com.okta.cloudconfigservicetwo;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.context.config.annotation.RefreshScope;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import org.springframework.security.config.annotation.authentication.builders.AuthenticationManagerBuilder;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.http.HttpServletRequest;
import java.security.Principal;

@SpringBootApplication
public class CloudConfigServiceTwoApplication {

    public static void main(String[] args) {
        SpringApplication.run(CloudConfigServiceTwoApplication.class, args);
    }

    @Order(1)
    @Configuration
    public static class ActuatorSecurityConfig extends WebSecurityConfigurerAdapter {
        @Override
        public void configure(HttpSecurity http) throws Exception {
            http
                    .csrf().disable()
                    .antMatcher("/actuator/*")
                    .authorizeRequests()
                    .antMatchers("/actuator/*").authenticated()
                    .and()
                    .httpBasic();
        }

        @Override
        protected void configure(AuthenticationManagerBuilder auth) throws Exception {
            auth.inMemoryAuthentication()
                    .withUser("serviceTwoUser")
                    .password("{noop}serviceTwoPassword")
                    .roles("USER");
        }
    }

    @Order(2)
    @Configuration
    public static class ApplicationSecurityConfig extends WebSecurityConfigurerAdapter {
        @Override
        public void configure(HttpSecurity http) throws Exception {
            http
                    .authorizeRequests()
                    .anyRequest().authenticated()
                    .and()
                    .oauth2Login();
        }
    }

    @RefreshScope
    @RestController
    @RequestMapping("/secure")
    public static class SecureController {

        @Value("${hello.message}")
        private String helloMessage;

        @GetMapping
        public String secure(Principal principal) {
            return helloMessage;
        }
    }
}
```

Note the different credentials for the in-memory user: `serviceTwoUser / serviceTwoPassword`.

Run the application:

```shell script
cd /path/to/my/service-two
./mvnw spring-boot:run -Dspring-boot.run.profiles=profile1
```

Navigate to `http://localhost:8002/secure` and authenticate with Okta. When you are redirected back to your application you will see the welcome message for `service-two`:

```text
Service Two Profile One
```

You're done! You've created two microservices, secured by Okta and OAuth 2.0, which receive their configuration settings from a shared Spring Cloud Config server. Very cool! 😎

## Learn more about Spring Cloud Config and Microservices

The source code for this example is [on GitHub](https://github.com/cavazosjoe/okta-spring-cloud-config).

For in-depth examples and use cases not covered in this tutorial, see Spring's official documentation for Spring Cloud Config [here](https://cloud.spring.io/spring-cloud-config/reference/html/).

Check out these other articles on integrating Spring Boot with Okta:

- [A Quick Guide to OAuth 2.0 with Spring Security](https://developer.okta.com/blog/2019/03/12/oauth2-spring-security-guide)
- [Easy Single Sign-On with Spring Boot and OAuth 2.0](https://developer.okta.com/blog/2019/05/02/spring-boot-single-sign-on-oauth-2)
- [Use PKCE with OAuth 2.0 and Spring Boot for Better Security](https://developer.okta.com/blog/2020/01/23/pkce-oauth2-spring-boot)
- [Spring Security SAML and Database Authentication](https://developer.okta.com/blog/2020/10/14/spring-security-saml-database-authentication)

Please provide comments, questions, and any feedback in the comments section below.

Follow us on social media ([Twitter](https://twitter.com/oktadev), [Facebook](https://www.facebook.com/oktadevelopers), [LinkedIn](https://www.linkedin.com/company/oktadev/)) to know when we've posted more articles like this, and please [subscribe](https://youtube.com/c/oktadev?sub_confirmation=1) to our [YouTube channel](https://youtube.com/c/oktadev) for tutorials and screencasts!

_We're also streaming on Twitch, [follow us](https://www.twitch.tv/oktadev) to be notified when we're live._