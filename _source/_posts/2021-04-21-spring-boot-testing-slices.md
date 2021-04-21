
---
layout: blog_post
title: "Spring Boot Testing Slices"
author: ruslan-zaharov
by: contractor
communities: [java]
description: ""
tags: []
tweets:
- ""
- ""
- ""
image:
type: conversion
---
 
Unit testing is a vital part of the software development process. Debates on techniques, frameworks, strategies and methods of how different layers and components need testing never stops. Unit tests serve a great deal when they are stable and fast.
 
Spring Boot is known to reduce boilerplate and make developer extremely efficient, but it comes with a cost. Without prior optimization, tests can run for a considerable time - most of it is wasted on the initialization of the application, significantly delaying the feedback loop.
 
**Table of Contents**{: .hide }
* Table of Contents
{:toc}
 
## Why avoid `@SpringBootTest` annotation
 
Say you want to test an HTTP layer (controller, authentification, @ControllerAdvice, etc.) At first glance, it might look like the `@SpringBootTest` annotation would be an appropriate choice here - it bootstraps the **whole** application the same way as it would be running otherwise. I've seen this is a default option for most of the Spring Boot integration tests.
 
While it works, there are several downsides in the long run:
 
1) Integration tests with `@SpringBootTest` can take a very long time to start - most of it related to database initialization, the configuration of remote sources and other IO.
2) Although you intend to check the HTTP layer, all other components are created, even not in use. That creates an additional dependency, causes flakiness and could be challenging when run on the CI pipeline due to a restricted environment.
3) External test data becomes a hard dependency, and it must be either provisioned before the application starts or shared. In many cases, such setup can cause many nuances.
 
### Where can `@SpringBootTest` be a good fit?
 
End-to-end tests would be the best place for the tests with `@SpringBootTest` assuming the whole application is a black box.
 
Testing Slices is a solution for the slowly running tests. Most of the unit tests don't require complete application bootstrap but rather some slices (layers of the application):
 
MVC layers - most
Database / repositories
Whole application
 
 
## Spring Boot Test Slices example
 
In this tutorial, you learn about some Spring Boot testing capabilities for integration tests. To set expectations right - you will test components that require complex Spring Context and therefore aren't easy to construct manually. I focus on the three most vital parts of any Spring Boot - based service: **Controller**, **Service**, **Repository**. Most of the applications have authentication functionality in the real world, and testing of it could be unapparent, especially without `@SpringBootTest` annotation.
 
**Prerequisites:**
 
- [Java 11](https://adoptopenjdk.net/)+
- [Okta CLI 0.8.0+](https://cli.okta.com)
- [Docker & Docker-Compose(for development environment)](https://docs.docker.com/get-docker/)
 
Start with cloning repository [ruXlab/okta-spring-boot-slices](https://github.com/ruXlab/okta-spring-boot-slices)
 
```
git clone https://github.com/ruXlab/okta-spring-boot-slices
cd okta-spring-boot-slices
```
 
This demo application is a Spring Boot service that counts page visits of different users. **Okta** configured with **Spring Security** helps to distinguish users and secure your service. For database storage, I use **PostgreSQL** with **Spring JPA**, **mustache** for templating, and the project is done in **Kotlin** programming language.
 
 
### Add Authentication with OpenID Connect
 
{% include setup/cli.md type="web" framework="Okta Spring Boot Starter" %}
 
 
At this step, your application has configuration done, and the properties file contains credentials.
 
‼ You should never commit your credentials to the version control system.
 
 
**Start local database**
 
Since the application is dependent on PostgreSQL, you'd need to have it running. I've prepared a docker-compose file for development purposes - that would be the easiest way to spin up a local database instance.
 
In command line run:
 
```
docker-compose -f docker-compose.devenv.yml up
```
 
**Start Application**
```
./gradlew bootRun
```
 
Open **http://localhost:8080** in your favorite browser and should see something like this:
 
 
//// IMAGE
 
 
## Test Controller with `@WebMvcTest`
 
In Spring MVC service, the Controller often takes the place of the guardian of the HTTP layer. For instance, it is responsible for parsing request parameters from URL, headers and body, performing deserialization where needed, selecting the right handler, and performing routing.
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
   fun index(
       @AuthenticationPrincipal user: AuthenticatedPrincipal? // ❶
   ): ModelAndView {
       val myUsername = user?.name ?: "guest" // ❷
 
       viewersService.insertOrIncrementViews(myUsername) // ❸
 
       return ModelAndView( // ❹
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
   fun loginRedirector(): RedirectView = // ❺
       RedirectView("/oauth2/authorization/okta")
}
```
 
 
The `index` endpoint:
- ❶ gets user login if a user is signed in
- ❷ retrieves data from the service and
- ❸ counts current visit of the user
- ❹ retrieves data for rendering from the services
- ❺ conveniences method
 
**Test for the controller**
 
The corresponding test is located in the `src/test/kotlin/com/example/okta/testslices/controller/VisitCounterControllerIntegrationTest.kt`. Note, I added `Integration` to the name of the file and class to indicate that it isn't a simple unit test to set expectation right.
 
 
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
 
Inject mock of service controller depends on - `ViewersService`
 
Start with the simple one for URL handling redirection to the specific authorization page.
 
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
 
Spring Boot provides neat Kotlin DSL extensions making it's really easy to write and read tests. From the example above, it's pretty clear what is being tested in this test.
 
 
**Test user authentication**
 
The application renders the main page differently depending on the user logged in. In the following two tests, you'd verify that the correct user name is used on the page.
 
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
 
Note how easy it is to inject OAuth2 User with `oauth2Login()` helper function available from the `spring-security-test` dependency.
 
**Test render of the data returned from the service**
 
The `ViewersService` is returning some data which is rendered in the template. Test below is validating that data is mapped correctly.
 
```kotlin
@Test
fun `renders provided data from the viewersService`() {
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
 
## Testing Database Layer with @DataJpaTest
 
User's visits should be recorded in the database. In my example, I use Spring JPA + PostgreSQL, and the whole database layer contains only repository definition:
 
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
 
This is very much a standard Repository with few automagically generated queries.
 
### Test Database Layer example
 
It's easy to substitute an actual database with pre-configured in-memory H2 using `@DataJpaTest`, and that would work for most cases as long as vendor-specific features aren't in use.
 
You'd need two database dependencies - H2 driver for test runtime and fully fledged PostgreSQL driver for default runtime. For that reason `build.gradle.kts` contains these two lines:
 
```groovy
   runtimeOnly("org.postgresql:postgresql")
   testRuntimeOnly("com.h2database:h2")
```
 
That would be sufficient for Spring Boot to discover database dependencies. Note that you don't override beans manually to provide an additional configuration as it is done with `@SpringBootTest` annotation. `@DataJpaTest` along with `@AutoConfigureTestDatabase` automagically prepare context and configure the H2 database engine to mimic an actual PostgreSQL.
 
 
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
 
## Integration test for the Service layer
 
In most instances, Service components dependencies are reasonably easy to mock to verify business logic flow. Nevertheless, having an **integration** test for the Service layer would add extra peace of mind and can help when dealing with complex logic.
 
Next, you'd implement an integration test for `ViewersService`, which depends solely on the database `ViewersRepository`.
 
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
 
Now, you learned how to write more complex tests using Spring Boot test slices to mock across different component layers.
 
 
## Conclusion
 
// TBD
 
