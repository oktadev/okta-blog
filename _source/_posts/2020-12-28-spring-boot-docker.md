---
layout: blog_post
title: "How to Docker with Spring Boot"
author: ruslan-zaharov
by: contractor
communities: [java,devops]
description: "This quick and easy tutorial shows you how to build Docker images with Spring Boot's built-in Buildpacks support."
tags: [java, spring-boot, docker, buildpacks]
tweets:
- "Want to create a @docker image for your @kotlin-based @springboot app? This quick tutorial will show you how!"
- "Spring Boot 2.3.0+ has built-in support for creating Docker images with @buildpacks_io. It's pretty sweet!"
- "Want to build @docker images for your Spring Boot apps? Learn how in this quick tutorial. 👇"
image: blog/spring-boot-docker/spring-boot-docker.png
type: conversion
changelog:
- 2021-09-22: Updated to use Spring Boot 2.5.4. Changes to this post can be viewed in [oktadev/okta-blog#893](https://github.com/oktadev/okta-blog/pull/893); example app changes are in [oktadev/okta-spring-boot-docker-buildpacks-example#4](https://github.com/oktadev/okta-spring-boot-docker-buildpacks-example/pull/4)
- 2020-12-31: Updated post to add Heroku instructions, since it requires another buildpack. Thanks for the idea, Maurizio! See the code changes in the [example on GitHub](https://github.com/oktadev/okta-spring-boot-docker-buildpacks-example/pull/2). Changes to this post can be viewed in [oktadev/okta-blog#514](https://github.com/oktadev/okta-blog/pull/514).
---

Those of you reading this have certainly heard of Docker. After years of hype, it has become the somewhat standard technology for everyday DevOps operations. It greatly helped to simplify deployments and testing by creating efficient, immutable images of the applications which are working in their own silo. More efficient placement of applications has made this technology central for cloud applications which is why it has gotten so much attention in recent years.

Docker has enabled a new, unified way of application deployment. The basic idea is simple: instead of preparing a target environment on each machine, bring it as a part of your application in the form of a container. This means no conflicting library versions or overlapping network ports. Built images are immutable - your application works the same way locally, on your teammate's computer, or in the cloud. Also, it's possible to run multiple instances of the container on the same machine, and that helps to increase the density of deployment, bringing down costs.

In this tutorial, you will build and run a simple web application into the Docker-compatible image using [Cloud Native Buildpacks support][buildpacks-in-2.3.0], introduced in Spring Boot 2.3.0.

**Prerequisites**:

* [Java 11+][java11]
* Unix-like shell
* [Docker][install-docker] installed
* [Okta CLI][okta-cli] installed

**Table of Contents**{: .hide }
* Table of Contents
{:toc}

If you'd rather watch a video of this tutorial, check out the screencast below from our [YouTube channel](https://youtu.be/ChYIhEEOfrk).

<div style="text-align: center; margin-bottom: 1.25rem">
<iframe width="700" height="394" style="max-width: 100%" frameborder="0" src="https://www.youtube.com/embed/ChYIhEEOfrk"  allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</div>

## Bootstrap a Secure Spring Boot Application

Start by creating a Spring Boot application using [Spring Boot Initializr](https://start.spring.io/).
This can be done via the web interface or using a handy curl command:

```sh
curl https://start.spring.io/starter.tgz -d dependencies=web,okta \
   -d bootVersion=2.5.4 \
   -d groupId=com.okta \
   -d artifactId=demospringboot \
   -d type=gradle-project \
   -d language=kotlin \
   -d baseDir=springboot-docker-demo | tar -xzvf -
```

This command requests that Spring Boot Initializr generate an application that uses the Gradle build system and Kotlin programming language. It also configures dependencies on Spring Web and Okta. The created project is automatically unpacked to the `springboot-docker-demo` directory.

Update your main application class to allow unauthenticated access in `WebSecurityConfigurerAdapter`. While in there, add a controller that welcomes the user. It's safe to put everything in a single file `src/main/kotlin/com/okta/demospringboot/DemoApplication.kt`:

```kotlin
package com.okta.demospringboot

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication
import org.springframework.security.config.annotation.web.builders.HttpSecurity
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter
import org.springframework.context.annotation.Configuration
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController
import java.security.Principal

@SpringBootApplication
class DemoApplication

fun main(args: Array<String>) {
    runApplication<DemoApplication>(*args)
}

@Configuration
class OktaOAuth2WebSecurityConfigurerAdapter: WebSecurityConfigurerAdapter() {
    override fun configure(http: HttpSecurity) {
        http.authorizeRequests().anyRequest().permitAll()
    }
}

@RestController
class WebController {
    @RequestMapping("/")
    fun home(user: Principal?) = "Welcome, ${user?.name ?: "guest"}!"
}
```

### Run Your Spring Boot Application

Start your application in the project folder via the command line:

```
./gradlew bootRun
```

Then, open a browser at `http://localhost:8080`. Your web application greets the guest user:

{% img blog/spring-boot-docker/welcome-guest.png alt:"Webpage displaying welcome guest" width:"710" %}{: .center-image }

## Build a Spring Boot Docker Image

Since version 2.3.0, Spring Boot has supported [Cloud Native Buildpacks][buildpacks]. It has become straightforward to deploy a web service to the popular clouds using Buildpacks due to the mass adoption of this technology.

Build your application and send the image to the local Docker daemon:

```sh
./gradlew bootBuildImage --imageName=springbootdemo
```

Next, start your containerized web application with Docker:

```sh
docker run -it -p8080:8080 springbootdemo
```

As expected, your web application will be available on `http://localhost:8080`.

## Secure Your Spring Boot Application in Docker

User management is never an easy task and, most certainly, is not the main objective of your application. Okta is an identity provider that helps you to take care of routine work such as implementing OAuth 2.0, social login, and SSO (Single Sign-On). It's very developer-friendly, and it has excellent integration with different frameworks, including Spring Boot.

{% include setup/cli.md type="web" 
   loginRedirectUri="http://localhost:8080/login/oauth2/code/okta"
   logoutRedirectUri="http://localhost:8080" %}
   
You'll need to run `source .okta.env` to set these values as environment variables. If you're on Windows, rename the file to `.okta.bat` and change `export` to `set`. These parameters need to be injected into the application to enable OAuth flows for authentication and authorization.

**⚠️ NOTE: Make sure you _never_ check in credentials to your source control system. ⚠️**

### Configure Spring Security to Lock Down Access

Previously, your webpage was accessible for everyone. To allow access for authorized users only, update the Spring Security configuration in `src/main/kotlin/com/okta/demospringboot/DemoApplication.kt`:

```kotlin
@Configuration
class OktaOAuth2WebSecurityConfigurerAdapter: WebSecurityConfigurerAdapter() {
    override fun configure(http: HttpSecurity) {
        http.authorizeRequests().anyRequest().authenticated();
    }
}
```

That's it. The Okta Spring Boot Starter takes care of the rest!

Rebuild the application again:

```sh
./gradlew bootBuildImage --imageName=springbootdemo
```

The `--imageName` parameter allows specifying an image name. Without it, the name would be something like `appName:0.0.1-SNAPSHOT`.

### Start Spring Boot Application in Docker

When your application starts, the Okta module reads environment variables to configure security in your application. Start your application with your values set:

```sh
docker run -it -p8080:8080 \
    -e OKTA_OAUTH2_ISSUER="https://dev-xxxxxx.okta.com/oauth2/default" \
    -e OKTA_OAUTH2_CLIENT_SECRET="yyyyyyyyyyyyyyyyyyy" \
    -e OKTA_OAUTH2_CLIENT_ID="zzzzzzzzzzzzzzzz" \
    springbootdemo
```

The argument `-e` allows to set an environment variable for the application running _inside_ your container and `-p` maps container's ports to `localhost` ports.

Now, head over to `http://localhost:8080`, and you'll be asked to log in using Okta's standard form. Enter your login credentials and, upon successful sign-in, your web browser will be redirected to the main page, displaying a welcoming message.

{% img blog/spring-boot-docker/browser-welcomes-logged-in-user-via-okta.png alt:"Webpage displaying 'welcome username'" width:"744" %}{: .center-image }

**TIP:** If you want to print the user's name, use `@AuthenticatedPrincipal` and `OidcUser`:

```kotlin
fun home(@AuthenticationPrincipal user: OidcUser?) = "Welcome, ${user?.fullName ?: "guest"}!"
```

Congratulations, you have created a simple Spring Boot application contextualized with Docker and secured with Spring Security + Okta.

### Bonus - Use a dotenv File

While providing a few environment variables in the command-line might be acceptable, it's not very convenient and can leave unwanted traces of the secrets in your terminal history. Docker supports dotenv file format, which makes it easier to set multiple environment parameters.

1. Create a `.env` file in the root of the project and set desirable environment variables:
   ```sh
   OKTA_OAUTH2_ISSUER=https://{yourOktaDomain}/oauth2/default
   OKTA_OAUTH2_CLIENT_SECRET={yourClientSecret}
   OKTA_OAUTH2_CLIENT_ID={yourClientId}
   ```

2. Always be extra careful with credentials - avoid leaking them to the version control system even for the pet project. Add `.env` to `.gitignore`.
   ```sh
   echo ".env" >> .gitignore
   ```

3. Run Docker providing your `.env` file via `--env-file` argument
   ```sh
   docker run -it -p8080:8080 --env-file .env springbootdemo
   ```
   Looks much cleaner, doesn't it?

## Deploy Spring Boot + Docker to Heroku

If you'd like to deploy your dockerized Spring Boot app to Heroku, you'll need to use [Heroku Buildpacks](https://jkutner.github.io/2020/05/19/spring-boot-buildpacks.html). This is because the Paketo buildpacks refuse to allocate heap on containers smaller than 1GB of RAM. A free Heroku dyno has 512MB.

First, you'll need to add the following to `src/main/resources/application.properties` so Spring Boot uses Heroku's `PORT` environment variable.

```properties
server.port=${PORT:8080}
```

Then, build your image with `--builder heroku/spring-boot-buildpacks`:

```bash
./gradlew bootBuildImage --imageName=springbootdemo --builder heroku/spring-boot-buildpacks
```

Install the [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli) and create an app on Heroku:

```bash
heroku create
```

Log in to Heroku's container registry and push your app:

```bash
heroku container:login
docker tag springbootdemo registry.heroku.com/<your-app-name>/web
docker push registry.heroku.com/<your-app-name>/web
```

Set your Okta app settings as environment variables:

```bash
heroku config:set \
  OKTA_OAUTH2_ISSUER="https://{yourOktaDomain}/oauth2/default" \
  OKTA_OAUTH2_CLIENT_ID="{clientId}" \
  OKTA_OAUTH2_CLIENT_SECRET="{clientSecret}"
```

Next, release your container and tail the logs.

```bash
heroku container:release web
heroku logs --tail
```

You'll need to update your Okta OIDC app to have your Heroku app's redirect URIs as well.

- Login redirect URI: `https://<your-app-name>.herokuapp.com/login/oauth2/code/okta`
- Logout redirect URI: `https://<your-app-name>.herokuapp.com`

Run `heroku open` to open your app and sign in.

## Learn More About Docker, Spring Boot, and Buildpacks

In this brief tutorial, you created a secure Spring Boot application and packaged it with Docker. You configured Okta as an OAuth 2.0 provider, built an image into your local Docker daemon, and learned how to run your app in Docker. This bootstrap project is a great starting point for your next cloud-native project.

You can find the source code for this example [on GitHub](https://github.com/oktadev/okta-spring-boot-docker-buildpacks-example).

See other relevant tutorials:

* [Deploy a Secure Spring Boot App to Heroku][spring-boot-heroku]
* [OAuth 2.0 Java Guide: Secure Your App in 5 Minutes][java-oauth2]
* [Angular + Docker with a Big Hug from Spring Boot][angular-spring-docker]
* [A Quick Guide to OAuth 2.0 with Spring Security][oauth2-spring-security-guide]

Follow us for more great content and updates from our team! You can find us on [Twitter](https://twitter.com/oktadev), [Facebook](https://www.facebook.com/oktadevelopers), subscribe to our [YouTube Channel](https://youtube.com/c/oktadev) or start the conversation below!

[install-docker]: https://docs.docker.com/get-docker/
[java11]: https://adoptopenjdk.net/
[okta-cli]: https://github.com/okta/okta-cli
[okta-signup]: https://developer.okta.com/signup/
[oci]: https://opencontainers.org/
[buildpacks]: https://buildpacks.io/
[buildpacks-in-2.3.0]: https://spring.io/blog/2020/01/27/creating-docker-images-with-spring-boot-2-3-0-m1
[java-oauth2]: /blog/2019/10/30/java-oauth2
[angular-spring-docker]: /blog/2020/06/17/angular-docker-spring-boot
[oauth2-spring-security-guide]: /blog/2019/03/12/oauth2-spring-security-guide
[spring-boot-heroku]: /blog/2020/08/31/spring-boot-heroku
