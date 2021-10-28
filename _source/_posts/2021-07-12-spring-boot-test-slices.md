---
disqus_thread_id: 8643871123
discourse_topic_id: 17390
discourse_comment_url: https://devforum.okta.com/t/17390
layout: blog_post
title: "Faster Spring Boot Testing with Test Slices"
author: ruslan-zaharov
by: contractor
communities: [java]
description: "Spring Boot Test Slices allow you to test a specific part of your application in isolation without loading the whole Spring context."
tags: [spring, spring-boot, testing, spring-testing, unit-testing, integration-testing, java]
tweets:
- "Unit tests are the most valuable when they are stable, fast, and reproducible. Speed your @springboot tests up with the tips in this tutorial!"
- "In this tutorial, you'll learn about Spring Boot testing capabilities to optimize integration tests."
- "Are you using @SpringBootTest? You can do better, and make your tests execute faster!"
image: blog/spring-boot-test-slices/spring-boot-test-slices.png
type: conversion
---

We know unit testing is a vital part of the software development process. We also know us developers love to debate techniques, frameworks, strategies, and how different layers and components need testing. Unit tests are the most valuable when they are stable, fast, and reproducible.

Spring Boot is known to reduce boilerplate code and make development extremely efficient, but it can come with a cost when it comes down to the testing. Without prior optimization, tests can run for a considerable time—most of it is wasted on unnecessary initialization of the application, significantly delaying the feedback loop.

In this tutorial, you'll learn about Spring Boot testing capabilities to optimize integration tests.

**Table of Contents**{: .hide }
* Table of Contents
{:toc}

## Write Tests with the `@SpringBootTest` Annotation

The `@SpringBootTest` annotation automagically spins up your application with **all dependencies** instrumenting it for use in tests. It can replace dependencies and provide customized properties for the application context. This annotation is a great tool and an easy way to get your application ready for testing.

### When to Avoid `@SpringBootTest` Annotation

Say you want to test an HTTP layer (controller, authentification, `@ControllerAdvice`, etc.) At first, it might look like the `@SpringBootTest` annotation would be an appropriate choice here - it bootstraps the **whole** application the same way as it would be running otherwise. I've seen this is a default option for most of the Spring Boot integration tests.

While it works, there are several downsides:

1. Integration tests with `@SpringBootTest` can take a very long time to start—most of it related to database initialization, the configuration of remote sources, and other IO (input/output).
2. Although you intend to check the HTTP layer, all other components are created, even not in use. That causes unnecessary dependencies, causes **flakiness**, and could be challenging to run on the CI pipeline due to a restricted environment.
3. External test data becomes a hard dependency, and it must be either provisioned before the application starts or shared. In many cases, such a setup can cause many nuances that make it hard to work with.

### Where Can `@SpringBootTest` Be a Good Fit?

End-to-end tests would be the best place for the tests with `@SpringBootTest`, assuming the whole application is a black box.
Test Slices is a solution for the slowly running tests. Most of the unit tests don't require complete application bootstrap but rather some slices (layers of the application):

* Most MVC layers
* Database / repositories
* Whole application

## Spring Boot Test Slices Overview

In this tutorial, you will use Spring Boot Test Slices to test components that require complex Spring Context and therefore aren't easy to construct manually. I focus on the three most vital parts of any Spring Boot-based service: **Controller**, **Service**, **Repository**. Most of the applications have authentication functionality in the real world, and its testing could be very complex, especially without `@SpringBootTest` annotation.

**Prerequisites:**

- [Java 11](https://adoptopenjdk.net/)+
- [Okta CLI 0.8.0+](https://cli.okta.com)
- [Docker & Docker-Compose (for development environment)](https://docs.docker.com/get-docker/)

Start with cloning this repo: [oktadev/okta-spring-boot-slices-example](https://github.com/oktadev/okta-spring-boot-slices-example)

```
git clone https://github.com/oktadev/okta-spring-boot-slices-example.git
cd okta-spring-boot-slices-example
```

This example application is a Spring Boot service that counts page visits of different users. It uses **Okta** configured with **Spring Security** to distinguish between users and secure your service. For database storage, I use **PostgreSQL** with **Spring JPA**, **Mustache** for templating, and the project is done in **Kotlin** programming language.

## Test the Spring Boot Controller Layer

As with any genuine web service, this application depends on external services which need provisioning before the application starts.

### Add Authentication with OpenID Connect

{% include setup/cli.md type="web" framework="Okta Spring Boot Starter" %}

At this step, your application has configuration done, and the properties file contains credentials.

**⚠️ You should never commit your credentials to your version control system.**

### Start PostgreSQL Database with Docker Compose

Since the application is dependent on PostgreSQL, you need to have it running. I've prepared a Docker Compose file for development purposes—it's an easy way to spin up a local database instance.

In the project's root directory, run:

```shell
docker-compose -f docker-compose.devenv.yml up
```

Open another terminal window and start the app.

```shell
./gradlew bootRun
```

Open `http://localhost:8080` in your favorite browser and should see something like this:

{% img blog/spring-boot-test-slices/spring-boot-slices-visitor-counter-page.png alt:"Demo application which counts visits" width:"813" %}{: .center-image }

### Run Test Suite with Gradle

To run all tests execute in the project's root directory:

```shell
./gradlew clean test
```

This command displays outcome:

```text
> Task :test
 
 ViewersServiceIntegrationTest
 
   ✔ insertOrIncrementViews creates a new visitor record when need()
   ✔ insertOrIncrementViews increments counter for existing visitor()
 
 ViewersRepositoryIntegrationTest
 
   ✔ insert two visitors and find all()
   ✔ incrementVisit adds single visit()
   ✔ compute average amount of visits per user()
 
 VisitCounterControllerIntegrationTest
 
   ✔ signin redirect works()
   ✔ greet authenticated user()
   ✔ renders provided data from the viewersService visiting as a guest()
   ✔ greet guest()
 
 9 passing (11.3s)
 
 
BUILD SUCCESSFUL in 26s
```

### Test Controllers with `@WebMvcTest`

In a Spring MVC application, controllers often guard the HTTP layer. For instance, it is responsible for parsing request parameters from URL, headers, and body, performing deserialization where needed, selecting the right handler, and performing routing.

When used with Spring Security, it can perform user authorization seamlessly.
Take a look at `src/main/kotlin/com/example/okta/testslices/controller/VisitCounterController.kt`.

```kotlin
package com.example.okta.testslices.controller

import com.example.okta.testslices.service.ViewersService
import org.springframework.security.core.AuthenticatedPrincipal
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.stereotype.Controller
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.servlet.ModelAndView
import org.springframework.web.servlet.view.RedirectView

@Controller
class VisitCounterController(
    private val viewersService: ViewersService
) {

    @GetMapping("/")
    fun index(@AuthenticationPrincipal user: AuthenticatedPrincipal?): ModelAndView { 
        val myUsername = user?.name ?: "guest" // ❶

        viewersService.insertOrIncrementViews(myUsername) // ❷

        return ModelAndView( // ❸
            "index",
            mapOf(
                "avgVisitsPerUser" to viewersService.averagesViewsPerUser().toInt(),
                "username" to myUsername,
                "visitors" to viewersService.allViewers(),
                "isGuest" to user?.name.isNullOrBlank()
            )
        )
    }

    @GetMapping("/signin")
    fun loginRedirector(): RedirectView =
        RedirectView("/oauth2/authorization/okta")
}
```

The `index()` method:

1. Gets user login if a user is signed in
2. Counts current visit of the user
3. Retrieves data for rendering from the services

The second endpoint `loginRedirector` simply provides a convenience method that redirects the user to start OAuth 2.0 flow for the identity provider - in my application, it's Okta.

### Test Controllers with `MockMvc`

The corresponding test is located in the `src/test/kotlin/.../controller/VisitCounterControllerIntegrationTest.kt` file. Note, I added `Integration` to the name of the file and class to indicate that it isn't a simple unit test to set expectations right.

```kotlin
package com.example.okta.testslices.controller

import com.example.okta.testslices.entity.ViewerModel
import com.example.okta.testslices.service.ViewersService
import org.hamcrest.Matchers.containsStringIgnoringCase
import org.hamcrest.Matchers.stringContainsInOrder
import org.junit.jupiter.api.Test
import org.mockito.Mockito.*
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest
import org.springframework.boot.test.mock.mockito.MockBean
import org.springframework.http.MediaType.TEXT_HTML
import org.springframework.security.oauth2.core.user.OAuth2User
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.oauth2Login
import org.springframework.test.web.servlet.MockMvc
import org.springframework.test.web.servlet.get

@WebMvcTest(VisitCounterController::class)
internal class VisitCounterControllerIntegrationTest {
    @Autowired
    private lateinit var mockMvc: MockMvc

    @MockBean
    private lateinit var viewersService: ViewersService
    // your tests here
}
```

This test injects a mock of the service the controller depends on - `ViewersService` using annotation `@MockBean`. You should always provide dependencies for your controller; otherwise, it can't be instantiated.

Look at the simple test for URL handling redirection to the specific authorization page.

```kotlin
@Test
fun `signin redirect works`() {
    // when
    mockMvc.get("/signin") {
        accept = TEXT_HTML
    }.andExpect {
        // then
        status { is3xxRedirection() }
        status { redirectedUrlPattern("**/oauth2/**") }
    }
}
```

Spring Boot provides neat Kotlin DSL extensions making it easy to write and read tests. From the example above, it's pretty clear what is being tested in this test.

### Test User Authentication

The application renders the main page differently depending on if the user is logged in. In the following two tests, it verifies that the correct user name is used on the page.

```kotlin
@Test
fun `greet guest`() {
    // when
    mockMvc.get("/") {
        accept = TEXT_HTML
    }.andExpect {
        // then
        status { isOk() }
        content {
            string(containsStringIgnoringCase("G'day, guest"))
        }
    }
}

@Test
fun `greet authenticated user`() {
    // given
    val oauth2User = mock(OAuth2User::class.java).also {
        doReturn("Nikolay").`when`(it).name
    }

    // when
    mockMvc.get("/") {
        accept = TEXT_HTML
        with(oauth2Login().oauth2User(oauth2User))
    }.andExpect {
        // then
        status { isOk() }
        content {
            string(containsStringIgnoringCase("G'day, Nikolay"))
        }
    }
}
```

Note how easy it is to inject `OAuth2User` with the `oauth2Login()` helper function available from the `spring-security-test` dependency.

## Test Rendered Data from the Mocked Service

The `ViewersService` returns user and statistics data which is rendered in the template. The test below validates that data is mapped correctly.

```kotlin
@Test
fun `renders provided data from the viewersService visiting as a guest`() {
    // given
    `when`(viewersService.averagesViewsPerUser()).thenReturn(42.0)
    `when`(viewersService.allViewers()).thenReturn(
        listOf(
            ViewerModel(1, "Olga", 100),
            ViewerModel(2, "Ketty", 200),
        )
    )

    // when
    mockMvc.get("/") {
        accept = TEXT_HTML
    }.andExpect {
        // then
        status { isOk() }
        content {
            contentTypeCompatibleWith(TEXT_HTML)
            string(containsStringIgnoringCase("G'day, guest"))
            string(containsStringIgnoringCase("there are 42 visits per user"))

            string(containsStringIgnoringCase("Ketty: 200"))
            string(containsStringIgnoringCase("Olga: 100"))
            string(stringContainsInOrder("Olga", "Ketty"))
        }
    }
}
```

## Test Your Database Layer with `@DataJpaTest`

Often, the database layer is done with Spring Data JPA, which I use in my sample project. Here each visit of the user is recorded in the database. That makes it possible to count the total number of visits overall.

This example uses Spring JPA + PostgreSQL. Truthfully, a specific database doesn't make much difference as layers of abstractions hide an actual implementation. The database layer contains a single repository definition:

```kotlin
package com.example.okta.testslices.repository

import com.example.okta.testslices.entity.ViewerModel
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository

@Repository
interface ViewersRepository : JpaRepository<ViewerModel, Long> {
    fun findByUsername(username: String): ViewerModel?

    @Modifying(clearAutomatically = true)
    @Query("UPDATE ViewerModel SET visits = visits + 1 WHERE username = ?1")
    fun incrementVisit(username: String)

    @Query("SELECT AVG(visits) FROM ViewerModel")
    fun averageViewsPerUser(): Double
}
```

This is very much a standard repository with few automagically generated queries.

### Test Spring Boot Database Layer Example

It's easy to substitute an actual database with pre-configured in-memory H2 database using `@DataJpaTest` annotation, and that would work for most cases as long as vendor-specific features aren't in use.

You'd need two database dependencies—H2 driver for test runtime and fully fledged PostgreSQL driver for default runtime. For that reason `build.gradle.kts` contains these two lines:

```groovy
runtimeOnly("org.postgresql:postgresql")
testRuntimeOnly("com.h2database:h2")
```

That would be sufficient for Spring Boot to discover database dependencies. Note that you **don't override** beans manually to provide an additional configuration, as it would be necessary with `@SpringBootTest` annotation. `@DataJpaTest` along with `@AutoConfigureTestDatabase` automatically prepare the context for the repository component and configure the H2 database engine to mimic an actual PostgreSQL instance.

Look at the database level test which is verifying behaviour of the SQL queries in the repository.

```kotlin
package com.example.okta.testslices.repository

import com.example.okta.testslices.entity.ViewerModel
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase.Replace.*
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest

@DataJpaTest
@AutoConfigureTestDatabase(replace = ANY)
class ViewersRepositoryIntegrationTest {
    @Autowired
    private lateinit var viewersRepository: ViewersRepository

    @Test
    fun `insert two visitors and find all`() {
        // given
        viewersRepository.saveAll(
            listOf(
                ViewerModel(0, "Ann", 99),
                ViewerModel(0, "Bob", 99)
            )
        )
        viewersRepository.flush()

        // when
        val students = viewersRepository.findAll()

        // then
        assertThat(students)
            .hasSize(2)
            .extracting<String>(ViewerModel::username)
            .containsOnly("Ann", "Bob")
    }

    @Test
    fun `compute average amount of visits per user`() {
        // given
        viewersRepository.saveAll(
            listOf(
                ViewerModel(0, "Pedro", 200),
                ViewerModel(0, "Pearl", 100),
                ViewerModel(0, "Ponyo", 300)
            )
        )
        viewersRepository.flush()

        // when
        val viewers = viewersRepository.averageViewsPerUser()

        // then
        assertThat(viewers).isEqualTo(200.0)
    }

    @Test
    fun `incrementVisit adds single visit`() {
        // given
        viewersRepository.save(ViewerModel(0, "Maya", 1000))

        // when
        viewersRepository.incrementVisit("Maya")

        // then
        assertThat(viewersRepository.findByUsername("Maya"))
            .extracting<Int> { it?.visits }
            .isEqualTo(1001)
    }
}
```

### Integration Test for the Service Layer

In most instances, service components dependencies are reasonably easy to mock to verify business logic flow. However, having an **integration** test for the service layer would add extra peace of mind and can help when dealing with complex logic.

Next, look at the integration test implementation for `ViewersService`, which depends solely on the `ViewersRepository`. In this setup, `ViewersService` is actually being tested against the actual database instance.

```kotlin
package com.example.okta.testslices.service

import com.example.okta.testslices.entity.ViewerModel
import com.example.okta.testslices.repository.ViewersRepository
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase.Replace.ANY
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest
import org.springframework.context.annotation.ComponentScan
import org.springframework.context.annotation.FilterType.ASSIGNABLE_TYPE

@DataJpaTest(
    includeFilters = [
        ComponentScan.Filter(ViewersService::class, type = ASSIGNABLE_TYPE)
    ]
)
@AutoConfigureTestDatabase(replace = ANY)
internal class ViewersServiceIntegrationTest {
    @Autowired
    private lateinit var viewersService: ViewersService

    @Autowired
    private lateinit var viewersRepository: ViewersRepository

    @Test
    fun `insertOrIncrementViews creates a new visitor record when need`() {
        // when
        viewersService.insertOrIncrementViews("Jafari")

        // then
        assertThat(viewersService.allViewers())
            .hasSize(1)
            .first()
            .satisfies {
                assertThat(it.username).isEqualTo("Jafari")
                assertThat(it.visits).isEqualTo(1)
            }
    }

    @Test
    fun `insertOrIncrementViews increments counter for existing visitor`() {
        // given
        viewersRepository.save(ViewerModel(0, "Karzi", 100))

        // when
        viewersService.insertOrIncrementViews("Karzi")

        // then
        assertThat(viewersService.allViewers())
            .hasSize(1)
            .first()
            .satisfies {
                assertThat(it.username).isEqualTo("Karzi")
                assertThat(it.visits).isEqualTo(101)
            }
    }
}
```

The test itself is pretty straightforward; the only caveat is to configure context. That's done with:

```kotlin
@DataJpaTest(
 includeFilters = [
     ComponentScan.Filter(ViewersService::class, type = ASSIGNABLE_TYPE)
 ]
)
@AutoConfigureTestDatabase(replace = ANY)
```

In this example, `@DataJpaTest` is instructed to instantiate an additional component, `ViewersService`.

## Learn More About Spring Boot, Spring Security, and Testing

In this article, you learned the challenges with integration tests and how to address these problems using Spring Boot Test Slices. You've learned the foundations of efficient integration tests implementation using test slices annotations such as `@DataJpaData` and `@WebMvcTest`, including authentication with OpenID Connect. Test slices annotations are particular to what they test, and that help to keep code less coupled and easy to maintain.

You can find the source code used in this post on GitHub in the [okta-spring-boot-test-slices-example](https://github.com/oktadev/okta-spring-boot-test-slices-example) repository.

You might like these other posts too:

* [An Illustrated Guide to OAuth and OpenID Connect](/blog/2019/10/21/illustrated-guide-to-oauth-and-oidc)
* [Spring Documentation: auto-configured Spring MVC Tests](https://docs.spring.io/spring-boot/docs/2.1.5.RELEASE/reference/html/boot-features-testing.html#boot-features-testing-spring-boot-applications-testing-autoconfigured-mvc-tests)
* [Better Testing with Spring Security Test](/blog/2021/05/19/spring-security-testing)
* [Test Your Spring Boot Applications with JUnit 5](/blog/2019/03/28/test-java-spring-boot-junit5)
* [How to GraphQL in Java](/blog/2020/01/31/java-graphql)

If you have any questions, please ask them in the comments below. Want to learn more Spring Boot tips and tricks? Follow us on [Twitter](https://twitter.com/oktadev) and subscribe to our [YouTube](https://www.youtube.com/c/oktadev) channel.
