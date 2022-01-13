---
disqus_thread_id: 7845961409
discourse_topic_id: 17209
discourse_comment_url: https://devforum.okta.com/t/17209
layout: blog_post
title: "How to GraphQL in Java"
author: thiago-negri
by: contractor
communities: [java]
description: "This tutorial shows how to build and test a GraphQL API with Java and JUnit 5."
tags: [java, graphql, junit, junit5, spring-boot]
tweets:
- "Learn how to build a @GraphQL API with @Java in this concise tutorial."
- "A quick guide to building a GraphQL API with @java and @springboot."
- "Want @java + @graphql? You're in luck! @springboot makes it easy to build and test."
image: blog/java-graphql/java-graphql.png
type: conversion
---

REST APIs are hard to design so they serve multiple clients well. As each client has their own needs in terms of data searching, filtering and which fields they want, a traditional REST API will provide a single version of an entity and the client has the responsibility of navigating through multiple endpoints and correlate the data on their side to build the data they want.

GraphQL was developed by Facebook to overcome the shortcomings they found with REST APIs. It's a query language for APIs and a runtime for fulfilling those queries with your existing data. By providing a complete and understandable description of the data in your API, clients can leverage that and have the power to ask for exactly what they need. By exposing the schema, it makes it easier to evolve APIs over time. Clients can still navigate the schema the way they need even if you add more fields and relations to it.

In this tutorial, I'll show you how to use Java and Spring Boot to build a GraphQL API. I'll also show how to test your GraphQL API using Java's most popular testing library: JUnit 5.

If you'd prefer to watch a video, you can [watch this tutorial as a screencast](https://youtu.be/y_OjfgZa58k).
<div style="text-align: center; margin-bottom: 1.25rem">
<iframe width="700" height="394" style="max-width: 100%" src="https://www.youtube.com/embed/y_OjfgZa58k" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</div>

## Create a GraphQL API with Java and Spring Boot

Let's start with an initialized app by going to [Spring Initializr](https://start.spring.io/) and defining your app data as follows:

- Project: **Maven Project**
- Language: **Java**
- Spring Boot: **2.2.2**
- Project Metadata:
    - Group: **com.oktadeveloper**
    - Artifact: **graphqldemo**
- Dependencies:
    - Add **Spring Web**
    - Add **Spring Data JPA**
    - Add **H2 Database**

You may also follow [this link](https://start.spring.io/#!type=maven-project&language=java&platformVersion=2.2.2.RELEASE&packaging=jar&jvmVersion=1.8&groupId=com.oktadeveloper&artifactId=graphqldemo&name=graphqldemo&description=Demo%20project%20for%20Spring%20Boot&packageName=com.oktadeveloper.graphqldemo&dependencies=web,data-jpa,h2), it will take you to a pre-configured Spring Initializr page.

{% img blog/java-graphql/start.spring.io.png alt:"Screen shot of start.spring.io" width:"800" %}{: .center-image }

Expand the downloaded package and add [GraphQL SPQR](https://github.com/leangen/graphql-spqr) as a dependency to your `pom.xml`:

```xml
<dependency>
    <groupId>io.leangen.graphql</groupId>
    <artifactId>graphql-spqr-spring-boot-starter</artifactId>
    <version>0.0.4</version>
</dependency>
```

Then create a `Food` entity class:

```java
package com.oktadeveloper.graphqldemo;

import io.leangen.graphql.annotations.GraphQLQuery;

import javax.persistence.Id;
import javax.persistence.GeneratedValue;
import javax.persistence.Entity;

@Entity
public class Food {

    @Id @GeneratedValue
    @GraphQLQuery(name = "id", description = "A food's id")
    private Long id;

    @GraphQLQuery(name = "name", description = "A food's name")
    private String name;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    @Override
    public String toString() {
        return "Food{" +
            "id=" + id +
            ", name='" + name + '\'' +
            '}';
    }

}
```

Notice that you are already using GraphQL SPQR (GraphQL Schema Publisher & Query Resolver, pronounced like *speaker*) annotations (i.e. `@GraphQLQuery`) on the entity. This is how it will know to expose those entities in the API.

Create the respective repository:

```java
package com.oktadeveloper.graphqldemo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
interface FoodRepository extends JpaRepository<Food, Long> {
}
```

In GraphQL you can either define a query which will only load data, or define a mutation which will also change the underlying data that feeds the API. For this sample app, you will define the basic read, save and delete functionality for food entities. For that, create a service class:

```java
package com.oktadeveloper.graphqldemo;

import io.leangen.graphql.annotations.GraphQLArgument;
import io.leangen.graphql.annotations.GraphQLContext;
import io.leangen.graphql.annotations.GraphQLMutation;
import io.leangen.graphql.annotations.GraphQLQuery;
import io.leangen.graphql.spqr.spring.annotations.GraphQLApi;
import org.springframework.stereotype.Service;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

@Service
@GraphQLApi
public class FoodService {

    private final FoodRepository foodRepository;

    public FoodService(FoodRepository foodRepository) {
        this.foodRepository = foodRepository;
    }

    @GraphQLQuery(name = "foods") // READ ALL
    public List<Food> getFoods() {
        return foodRepository.findAll();
    }

    @GraphQLQuery(name = "food") // READ BY ID
    public Optional<Food> getFoodById(@GraphQLArgument(name = "id") Long id) {
        return foodRepository.findById(id);
    }

    @GraphQLMutation(name = "saveFood") // CREATE
    public Food saveFood(@GraphQLArgument(name = "food") Food food) {
        return foodRepository.save(food);
    }

    @GraphQLMutation(name = "deleteFood") // DELETE
    public void deleteFood(@GraphQLArgument(name = "id") Long id) {
        foodRepository.deleteById(id);
    }

    @GraphQLQuery(name = "isGood") // Calculated property of Food
    public boolean isGood(@GraphQLContext Food food) {
        return !Arrays.asList("Avocado", "Spam").contains(food.getName());
    }

}
```

Notice that you are also able to define calculated properties to entities. In the above class, you declared the method `isGood()` as a property that can be queried for each food. You will see ahead that you can read it just like you read the food's `id` and `name` fields.

To initialize the app with sample data, add an `ApplicationRunner` bean definition in `GraphqldemoApplication`:

```java
@Bean
ApplicationRunner init(FoodService foodService) {
    return args -> {
        Stream.of("Pizza", "Spam", "Eggs", "Avocado").forEach(name -> {
            Food food = new Food();
            food.setName(name);
            foodService.saveFood(food);
        });
        foodService.getFoods().forEach(System.out::println);
    };
}
```

Also, add the following line to `application.properties` to enable the web UI to test the GraphQL API:

```properties
graphql.spqr.gui.enabled=true
```

## Run Your Java GraphQL API

Run the project with `./mvnw spring-boot:run`. Head over to `http://localhost:8080/gui` and you should see a web UI to test your GraphQL API. Run a sample query by typing on the left-side panel:

```gql
{
  foods {
    id
    name
    isGood
  }
}
```

Click the play button and you should see a result similar to this:

```json
{
  "data": {
    "foods": [
      {
        "id": 1,
        "name": "Pizza",
        "isGood": true
      },
      {
        "id": 2,
        "name": "Spam",
        "isGood": false
      },
      {
        "id": 3,
        "name": "Eggs",
        "isGood": true
      },
      {
        "id": 4,
        "name": "Avocado",
        "isGood": false
      }
    ]
  }
}
```

You can also find a specific food by ID using a query like the following:

```gql
{ food(id: 1) { name } }
```

And seeing that result:

```json
{
  "data": {
    "food": {
      "name": "Pizza"
    }
  }
}
```

Notice that you are able to manipulate the response. On that last query, you asked only for the `name` of the food and the API didn't return the `id` nor the `isGood` property.

Create a new food by running the `saveFood()` mutation:

```
mutation {
  saveFood(food: { name: "Pasta" }) {
    id
    isGood
  }
}
```

And you will see a result like:

```json
{
  "data": {
    "saveFood": {
      "id": 5,
      "isGood": true
    }
  }
}
```

If you query all the foods again you should see the newly added "Pasta" there.

## Test Your Java GraphQL API with JUnit 5

You can write tests for your API with JUnit 5 and Spring Mock MVC. To do this, you can call your API via HTTP, wrap the query in a JSON object with a single property called `"query"`, and the response should be similar to what you were seeing in the web UI. For example, the following class tests that you can retrieve all registered foods:

```java
package com.oktadeveloper.graphqldemo;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class GraphqldemoApplicationTests {

    @Autowired
    MockMvc mockMvc;

    @Test
    void listFoods() throws Exception {
        String expectedResponse = "{\"data\":{\"foods\":[" +
                "{\"id\":1,\"name\":\"Pizza\",\"isGood\":true}," +
                "{\"id\":2,\"name\":\"Spam\",\"isGood\":false}," +
                "{\"id\":3,\"name\":\"Eggs\",\"isGood\":true}," +
                "{\"id\":4,\"name\":\"Avocado\",\"isGood\":false}" +
                "]}}";

        mockMvc.perform(MockMvcRequestBuilders.post("/graphql")
                .content("{\"query\":\"{ foods { id name isGood } }\"}")
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().json(expectedResponse))
                .andReturn();
    }

}
```

You can replace `src/test/java/com/.../GraphqldemoApplicationTests.java` with the code above and run `./mvnw test` to see it in action.

```
[INFO] Results:
[INFO] 
[INFO] Tests run: 1, Failures: 0, Errors: 0, Skipped: 0
[INFO] 
[INFO] ------------------------------------------------------------------------
[INFO] BUILD SUCCESS
[INFO] ------------------------------------------------------------------------
```

For a client to use your GraphQL API, it just needs to call it as a standard HTTP API: send a POST request with the query or mutation and parse the result as JSON.

## Secure Your Java GraphQL API

{% img blog/java-graphql/secure-java-graphql.jpg alt:"Secure Java GraphQL API" width:"800" %}{: .center-image }

So far, your API is open to whoever has its endpoint URI. Let's change that by adding proper security.

Okta offers a very handy Maven plugin to set up your app's security quickly and easily. First, add Okta as a dependency in `pom.xml`. While you're at it, add Spring Security's testing library.

```xml
<dependency>
    <groupId>com.okta.spring</groupId>
    <artifactId>okta-spring-boot-starter</artifactId>
    <version>1.3.0</version>
</dependency>
<dependency>
    <groupId>org.springframework.security</groupId>
    <artifactId>spring-security-test</artifactId>
    <scope>test</scope>
</dependency>
```

{% include setup/maven.md %}

If you start your app again, you'll notice that you can't run GraphQL queries anymore. That's because you're not authenticated.

To authenticate and see your access token (required to use the API), create a very simple controller that displays the access token. Add the following class to your project:

```java
package com.oktadeveloper.graphqldemo;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClient;
import org.springframework.security.oauth2.client.OAuth2AuthorizedClientService;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;

@RestController
class MyAccessTokenController {

    @Autowired
    private OAuth2AuthorizedClientService clientService;

    @RequestMapping("/my-access-token")
    String home(Principal user) {
        OAuth2AuthenticationToken token = (OAuth2AuthenticationToken) user;
        String authorizedClientRegistrationId = token.getAuthorizedClientRegistrationId();
        String name = user.getName();
        OAuth2AuthorizedClient client = clientService.loadAuthorizedClient(authorizedClientRegistrationId, name);
        return "token: " + client.getAccessToken().getTokenValue();
    }

}
```

Start your app again and go to `http://localhost:8080/my-access-token`. If you are not authenticated, it will present you with a login form. After authenticating, you will see your token displayed on the web page. Copy the token value as you will use it next.

If you want to use the web UI (`http://localhost:8080/gui`), click on **HTTP HEADERS** at the bottom left and add the following, replacing `<your_access_token>` with the actual value of your access token that you got in the previous step:

```json
{ "Authorization": "Bearer <your_access_token>" }
```

If you are calling the API directly through HTTP, simply add the `Authorization` header with value `Bearer <your_access_token>`. You can click the `Copy CURL` button in the top right of the web UI to see an example.

```bash
curl 'http://localhost:8080/graphql' -H 'Accept-Encoding: gzip, deflate, br' -H 'Content-Type: application/json' -H 'Accept: application/json' -H 'Connection: keep-alive' -H 'DNT: 1' -H 'Origin: http://localhost:8080' -H 'Authorization: Bearer <your_access_token>' --data-binary '{"query":"{\n  foods {\n    id\n    name\n  }\n}"}' --compressed
```

Or you can use [HTTPie](https://httpie.org/):

```bash
http POST http://localhost:8080/graphql query='{foods{id,name}}' 'Authorization: <your_access_token>'
```

Now you have a fully secured GraphQL API!

If you try running your tests (`./mvnw test`), you will notice they are failing because the API will now answer with **403 Forbidden** instead of **200 OK**:

```bash
$ ./mvnw test
...
[INFO] Results:
[INFO]
[ERROR] Failures:
[ERROR]   GraphqldemoApplicationTests.listFoods:34 Status expected:<200> but was:<403>
[INFO]
[ERROR] Tests run: 1, Failures: 1, Errors: 0, Skipped: 0
...
```

That happens because your tests are not security-aware. To fix that, you need to add the method call `.with(SecurityMockMvcRequestPostProcessors.jwt())` to each of your `mockMvc.perform()` chains, for example:

```java
mockMvc.perform(MockMvcRequestBuilders.post("/graphql")
        .with(SecurityMockMvcRequestPostProcessors.jwt()) // <- ADD THIS LINE
        .content("{\"query\":\"{ foods { id name isGood } }\"}")
        .contentType(MediaType.APPLICATION_JSON)
        .accept(MediaType.APPLICATION_JSON))
        .andExpect(status().isOk())
        .andExpect(content().json(expectedResponse))
        .andReturn();
```

Both `MockMvcRequestBuilders.post()` and `SecurityMockMvcRequestPostProcessors.jwt()` can be static imports, so you can make this code a bit easier to read. Add the imports:

```java
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
```

Then remove the class names from the test:

```java
mockMvc.perform(post("/graphql")
        .with(jwt())
        ...
```


The `jwt()` method instructs the test to inject a JWT authentication and act accordingly as if a user is authenticated.

Below is a full test class that verifies the GraphQL API you wrote works as expected::

```java
package com.oktadeveloper.graphqldemo;

import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class GraphqldemoApplicationTests {

    @Autowired
    MockMvc mockMvc;

    @Test
    @Order(0)
    void listFoods() throws Exception {

        String expectedResponse = "{\"data\":{\"foods\":[" +
                "{\"id\":1,\"name\":\"Pizza\",\"isGood\":true}," +
                "{\"id\":2,\"name\":\"Spam\",\"isGood\":false}," +
                "{\"id\":3,\"name\":\"Eggs\",\"isGood\":true}," +
                "{\"id\":4,\"name\":\"Avocado\",\"isGood\":false}" +
                "]}}";

        mockMvc.perform(post("/graphql")
                .with(jwt())
                .content("{\"query\":\"{ foods { id name isGood } }\"}")
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().json(expectedResponse))
                .andReturn();
    }

    @Test
    @Order(1)
    void addAndRemoveFood() throws Exception {
        String expectedResponseBefore = "{\"data\":{\"foods\":[" +
                "{\"id\":1,\"name\":\"Pizza\"}," +
                "{\"id\":2,\"name\":\"Spam\"}," +
                "{\"id\":3,\"name\":\"Eggs\"}," +
                "{\"id\":4,\"name\":\"Avocado\"}" +
                "]}}";
        String expectedResponseAfter = "{\"data\":{\"foods\":[" +
                "{\"id\":1,\"name\":\"Pizza\"}," +
                "{\"id\":2,\"name\":\"Spam\"}," +
                "{\"id\":3,\"name\":\"Eggs\"}," +
                "{\"id\":4,\"name\":\"Avocado\"}," +
                "{\"id\":5,\"name\":\"Pasta\"}" +
                "]}}";

        // List foods, expect 'New Food' to not be there
        mockMvc.perform(post("/graphql")
                .with(jwt())
                .content("{\"query\":\"{ foods { id name } }\"}")
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().json(expectedResponseBefore))
                .andReturn();

        // Add 'New Food'
        mockMvc.perform(post("/graphql")
                .with(jwt())
                .content("{\"query\":\"mutation { saveFood(food: { name: \\\"Pasta\\\" }) { id name } }\"}")
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().json("{\"data\":{\"saveFood\":{\"id\":5,\"name\":\"Pasta\"}}}"))
                .andReturn();

        // List foods, expect 'New Food' to be there
        mockMvc.perform(post("/graphql")
                .with(jwt())
                .content("{\"query\":\"{ foods { id name } }\"}")
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().json(expectedResponseAfter))
                .andReturn();

        // Remove 'New Food'
        mockMvc.perform(post("/graphql")
                .with(jwt())
                .content("{\"query\":\"mutation { deleteFood(id: 5) }\"}")
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andReturn();

        // List foods, expect 'New Food' to not be there
        mockMvc.perform(post("/graphql")
                .with(jwt())
                .content("{\"query\":\"{ foods { id name } }\"}")
                .contentType(MediaType.APPLICATION_JSON)
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(content().json(expectedResponseBefore))
                .andReturn();
    }

}
```
## Further Reading on GraphQL and Java

In this tutorial, you learned how to create your GraphQL API in Java with Spring Boot. But you are not limited to Spring Boot for that. You can use the [GraphQL SPQR](https://github.com/leangen/graphql-spqr) in pretty much any Java environment, even with [Micronaut](https://github.com/micronaut-projects/micronaut-graphql).

If you are using Quarkus and natively compiling your code, GraphQL SPQR wouldn't work as it depends on reflection. But on that environment (and others) you could use the less-magic [GraphQL Java](https://github.com/graphql-java/graphql-java), it's a bit more verbose as you need to manually declare your schema, but it gets the job done as well as GraphQL SPQR. And don't worry, we have a tutorial for GraphQL Java as well: 

* [Build a Secure API with Spring Boot and GraphQL](/blog/2018/08/16/secure-api-spring-boot-graphql)

If you want to keep reading about Java, Security, and Spring, here are some other links for you:

- [Build a Java REST API with Java EE and OIDC](/blog/2018/09/12/secure-java-ee-rest-api)
- [Java + Spring Tutorials](/blog/2019/05/24/java-spring-tutorials)
- [10 Myths About Java in 2019](/blog/2019/07/15/java-myths-2019)
- [Use React and Spring Boot to Build a Simple CRUD App](/blog/2018/07/19/simple-crud-react-and-spring-boot)

The source code for this post is available on GitHub in the [oktadeveloper/okta-graphql-java-example](https://github.com/oktadeveloper/okta-graphql-java-example) repository.

If you have any questions about this post, please add a comment below. For more awesome content, follow [@oktadev](https://twitter.com/oktadev) on Twitter, like us [on Facebook](https://www.facebook.com/oktadevelopers/), or subscribe to [our YouTube channel](https://www.youtube.com/c/oktadev).
