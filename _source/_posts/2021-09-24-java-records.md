---
layout: blog_post
title: "Java Records: A WebFlux and Spring Data Example"
author: jimena-garbarino
by: contractor
communities: [java]
description: "Java Records support in Spring WebFlux Microservices and Spring Data MongoDB Access"
tags: [java-records, java, api, mongodb, rest, microservices]
tweets:
- ""
- ""
- ""
image:
type: conversion
---
When defining classes for a simple aggregation of values, developers had to write constructors, accessors, `equals()`, `hashCode()` and `toString()`, an error-prone ceremony that has low value and deviates the focus from modeling immutable data. With the motivation of simplifying the writing of data carrier classes, Java Records were introduced as a first preview in JDK 14. The second preview came in JDK 15 and the finalized feature came in JDK 16. A summary of the history is available in the [JDK Enhancement Proposal JEP 395](https://openjdk.java.net/jeps/395). While code generators can be used to reduce boilerplate code, the goals of the `record` proposals rather focus on its semantics. In this post let's explore Java Records features and advantages, and apply them for building a REST API and querying a Database.

{% img blog/java-records/openjdk-logo.png alt:"OpenJDK Logo" width:"300" %}{: .center-image }


**Prerequisites**:

- [HTTPie](https://httpie.io/)
- [Java 14+](https://openjdk.java.net/install/index.html)
- [Okta CLI](https://cli.okta.com)

**Table of Contents**{: .hide }
* Table of Contents
{:toc}

# The Record Keyword

The `record` is a new type of declaration, a restricted form of class that acts as a transparent carrier for immutable data. So let's start the exploration by defining a simple data type `EndOfGame` as a `record`:

```java
import java.time.LocalDate;
import java.time.LocalTime;

public record EndOfGame(String id, LocalDate date,  LocalTime timeOfDay, String mentalState,
                        Integer damageTaken, Integer damageToPlayers, Integer damageToStructures) {
}
```
As you can see in the example above, the `record` has a name, `EndOfGame` in the example above. What looks like a constructor signature is the _state description_ or _header_ declaring the _components_ of the `record`.

The following members are acquired automatically with the declaration:

- A private final field and a public read accessor for each component of the state description
- A public _canonical_ constructor with the same signature as the state description, which initializes each field from the corresponding argument
- Implementation of `equals()`, `hashCode()` and `toString()`

The code fragments from `EndOfGameTest` class below verify the automatic members are indeed available.

```java
private EndOfGame getTestEndOfGame(){

    return new EndOfGame("1", LocalDate.of(2018, 12, 12),
            LocalTime.of(15, 15), 1,
            "sober", "10%", 1,1,
            10, 10,10);
}
```
The automatic canonical constructor is used for creating a sample `EndOfGame`.

```java
@Test
public void equalsTest(){
    EndOfGame eog1 = getTestEndOfGame();
    EndOfGame eog2 = getTestEndOfGame();

    assertTrue(eog1.equals(eog2));
    assertEquals(eog1, eog2);
    assertEquals(eog1.hashCode(), eog2.hashCode());
}
```

In the test above, `eog1` has the same state than `eog2`, so `eog1.equals(eog2)` is `true`. This also implies both instances have the same `hashCode`.

A `toString()` test can illustrate what the string representation looks like:

```text
EndOfGame[id=1, date=2018-12-12, timeOfDay=15:15, mentalState=sober, damageTaken=10, damageToPlayers=10, damageToStructures=10]
```

Automatic read accessors have the same name and return type than the component. Note there is no `get*` prefix in the read accessor name, same name as the component:

```java
assertEquals("sober", eog.mentalState());
```


# Java Record Restrictions and Rules


## Inheritance, Extensibility, Immutability

A `record` is implicitly final, and cannot be abstract. You cannot enhance it later by extension, as the compiler will output the following error:

```
Cannot inherit from final 'com.okta.developer.records.EndOfGame'
```

A `record` cannot extend any class, not even its implicit superclass `Record`. But it can implement interfaces. Using the `extends` with records clause will cause the following error:

```
No extends clause allowed for record
```

A `record` will not have write accessors and the implicitly declared fields are final, and not modifiable via reflection. Moreover, a `record` cannot declare instance fields outside the `record` _header_. Records embody an _immutable by default_ policy, usually applied to data carrier classes.

```
Instance field is not allowed in record
Cannot assign a value to final variable 'id'
```

Read accessors can be declared explicitly, but should never silently alter the Record state. **Review Record semantics before making explicit declarations of automatic members.**

A record without any constructor declaration will be given a canonical constructor with the same signature as the header, which will assign all the private fields from the arguments. The canonical constructor can be declared explicitly in the standard syntax, or in a compact form:

```java
public EndOfGame {
    Objects.requireNonNull(id);
    Objects.requireNonNull(date);
    Objects.requireNonNull(timeOfDay);
    Objects.requireNonNull(mentalState);
    Objects.requireNonNull(damageTaken);
    Objects.requireNonNull(damageToPlayers);
    Objects.requireNonNull(damageToStructures);
}
```

In the compact form, the parameters are implicit, the private fields cannot be assigned inside the body and are automatically assigned **at the end**. Its purpose is to allow focusing on validation, making defensive copies of mutable values, or some other value processing.

## Serialization, Encoding, Mapping

Record instances can extend `Serializable`, but the serialization and deserialization processes cannot be customized. Serialization and deserialization methods like `writeObject`,  `readObject` can be implemented, but will be ignored.

As `spring-web` module provides Jackson JSON encoders and decoders, and Java Record support was added to Jackson in release 2.12, records can be used for REST API request and response mapping.

Records cannot be used with JPA/Hiberante. Spring Data modules that do not use the object mapping of the underlying data store (like JPA) do support Record, as persistence construction detection works as with other classes. For Spring Data MongoDB, the general recommendation is to _stick to immutable objects_, because they are straightforward to materialize by calling the constructor. It is also recommended to provide an all-args constructor, allowing to skip property population for optimal performance. Java Record semantics align with these guidelines.


# Using Java Record with Spring WebFlux and Spring Data

While searching for a dataset for this tutorial, I came across a collection of 88 end game statistics of a single player, for a popular game. As the author included the mental state in the data, I decided to use Java Records for building a basic average query and finding out if the performance was significantly different when sober than when high.

Let's jump ahead and build the a secured REST Api using the `EndOfGame` record, Spring Boot, [MongoDB](https://www.mongodb.com/community) and Okta authentication. With the help of [Spring Initializr](https://start.spring.io/) create a WebFlux application, from the web UI or with [HTTPie](https://httpie.io/):

```shell
http -d https://start.spring.io/starter.zip type==maven-project \
  language==java \
  bootVersion==2.5.5 \
  baseDir==java-records \
  groupId==com.okta.developer.records \
  artifactId==records-demo \
  name==java-records \
  packageName==com.okta.developer.records \
  javaVersion==17 \
  dependencies==webflux,okta,data-mongodb-reactive
```

**Note**: Although Java Records are available since release 14, the Spring Initializr Web UI only allows to select Java Long Term Support (LTS) releases.

Extract the maven project, and edit `pom.xml` to add two more required dependencies for this tutorial, [MongoDB Testcontainers Module](https://www.testcontainers.org/modules/databases/mongodb/) for testing database access and `spring-security-test`:

```xml
<dependency>
    <groupId>org.testcontainers</groupId>
    <artifactId>mongodb</artifactId>
    <version>1.15.3</version>
    <scope>test</scope>
</dependency>
<dependency>
    <groupId>org.springframework.security</groupId>
    <artifactId>spring-security-test</artifactId>
    <version>5.5.1</version>
    <scope>test</scope>
</dependency>
```

{% include setup/cli.md type="web" framework="Okta Spring Boot Starter" %}

Rename `application.properties` to `application.yml`, and add the following content:

```yml
okta:
  oauth2:
    issuer: https://{yourOktaDomain}/oauth2/default
    client-secret: {clientSecret}
    client-id: {clientId}

spring:
  data:
    mongodb:
      port: 27017
      database: fortnite

logging:
  level:
    org.springframework.data.mongodb: TRACE
```


Add the `EndOfGame` record under the package `com.okta.developer.records.domain`. Annotate the `record` with `@Document(collection = "stats")` to let MongoDB map `EndOfGame` to the `stats` collection. As you can see, a record class can be annotated. The class should look like this:

```java
package com.okta.developer.records.domain;

import org.springframework.data.mongodb.core.mapping.Document;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Objects;

@Document(collection = "stats")
public record EndOfGame(String id, LocalDate date,  LocalTime timeOfDay,
                        String mentalState, Integer damageTaken,
                        Integer damageToPlayers, Integer damageToStructures) {

    public EndOfGame {
        Objects.requireNonNull(id);
        Objects.requireNonNull(date);
        Objects.requireNonNull(timeOfDay);
        Objects.requireNonNull(mentalState);
        Objects.requireNonNull(damageTaken);
        Objects.requireNonNull(damageToPlayers);
        Objects.requireNonNull(damageToStructures);
    }

}
```



Add a new record for the mental state query `MentalStateDamage`:

```java
package com.okta.developer.records.domain;

public record MentalStateDamage(String mentalState,
                                Double damageToPlayers,
                                Double damageToStructures,
                                Double damageTaken) {
}
```

Create the package `com.okta.developer.records.repository` and add `MentalStateStatsRepostory` interface:

```java
package com.okta.developer.records.repository;

import com.okta.developer.records.domain.MentalStateDamage;
import reactor.core.publisher.Flux;

public interface MentalStateStatsRepository {

    Flux<MentalStateDamage> queryMentalStateAverageDamage();

}
```

Add the implementation `MentalStateStatsRepostoryImpl` to retrieve the average damage in each category, for each mental state:

```java
package com.okta.developer.records.repository;

import com.okta.developer.records.domain.EndOfGame;
import com.okta.developer.records.domain.MentalStateDamage;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.aggregation.Aggregation;
import reactor.core.publisher.Flux;

import static org.springframework.data.mongodb.core.aggregation.Aggregation.*;

public class MentalStateStatsRepositoryImpl implements MentalStateStatsRepository {


    private final ReactiveMongoTemplate mongoTemplate;

    @Autowired
    public MentalStateStatsRepositoryImpl(ReactiveMongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @Override
    public Flux<MentalStateDamage> queryMentalStateAverageDamage() {
        Aggregation aggregation = newAggregation(
                group("mentalState")
                        .first("mentalState").as("mentalState")
                        .avg("damageToPlayers").as("damageToPlayers")
                        .avg("damageTaken").as("damageTaken")
                        .avg("damageToStructures").as("damageToStructures"),
                project("mentalState", "damageToPlayers", "damageTaken", "damageToStructures")
                );
        return mongoTemplate.aggregate(aggregation, EndOfGame.class, MentalStateDamage.class);
    }

}
```

Create the `SatsRepository` interface, extending the `MentalStateStatsRepository`:

```java
  package com.okta.developer.records.repository;

  import com.okta.developer.records.domain.EndOfGame;
  import org.springframework.data.repository.reactive.ReactiveSortingRepository;

  public interface StatsRepository extends ReactiveSortingRepository<EndOfGame, Long>, MentalStateStatsRepository {

  }
```

The sample dataset, after the import, will create strings for the date and time values, with a custom format. Create the following converters to map `String` to `LocalDate` and `LocalTime`:

```java
package com.okta.developer.records.repository;

import org.springframework.core.convert.converter.Converter;

import java.time.LocalDate;


public class LocalDateConverter implements Converter<String, LocalDate> {
    @Override
    public LocalDate convert(String s) {
        return LocalDate.parse(s);
    }
}
```
```java
package com.okta.developer.records.repository;


import org.springframework.core.convert.converter.Converter;

import java.time.LocalTime;

public class LocalTimeConverter implements Converter<String, LocalTime> {
    @Override
    public LocalTime convert(String s) {
        return LocalTime.parse(s);
    }
}
```

Add the class `MongoConfiguration` in the package `com.okta.developer.records.configuration`, to register the converters:

```java
package com.okta.developer.records.configuration;

import com.okta.developer.records.repository.LocalDateConverter;
import com.okta.developer.records.repository.LocalTimeConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.config.AbstractReactiveMongoConfiguration;
import org.springframework.data.mongodb.core.convert.MongoCustomConversions;

@Configuration
public class MongoConfiguration extends AbstractReactiveMongoConfiguration {

    @Value("${spring.data.mongodb.database}")
    private String databaseName;

    @Override
    protected String getDatabaseName() {
        return databaseName;
    }

    @Override
    protected void configureConverters(MongoCustomConversions.MongoConverterConfigurationAdapter adapter) {
        adapter.registerConverter(new LocalDateConverter());
        adapter.registerConverter(new LocalTimeConverter());
    }
}
```
Add the `StatsController` under the `com.okta.developer.records.controller` package:

```java
package com.okta.developer.records.controller;

import com.okta.developer.records.domain.EndOfGame;
import com.okta.developer.records.domain.MentalStateDamage;
import com.okta.developer.records.repository.StatsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;

@RestController
public class StatsController {

    @Autowired
    private StatsRepository statsRepository;

    @GetMapping("/endOfGame")
    public Flux<EndOfGame> getAllEndOfGame(){
        return statsRepository.findAll();
    }

    @GetMapping("/mentalStateAverageDamage")
    public Flux<MentalStateDamage> getMentalStateAverageDamage(){
        return statsRepository.queryMentalStateAverageDamage();
    }

}
```

The controller enables the `/endOfGame` endpoint to get all entries, and the `/mentalStateAverageDamage` endpoint, that returns the damage in each category, in an average by mental state.

Download the test dataset from [Github](https://github.com/indiepopart/java-records/blob/main/src/test/resources/stats.json), and copy it to `src/test/resouces/stats.json`.

Create the class `StatsControllerTest` in the package `com.okta.developer.records.controller` under the test folder, to verify the endpoints basic functionality with the help of Testcontainers:


```java
package com.okta.developer.records.controller;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.AutoConfigureWebTestClient;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.reactive.server.WebTestClient;
import org.testcontainers.containers.Container;
import org.testcontainers.containers.MongoDBContainer;
import org.testcontainers.utility.DockerImageName;
import org.testcontainers.utility.MountableFile;

import java.io.IOException;
import java.util.List;

import static org.springframework.security.test.web.reactive.server.SecurityMockServerConfigurers.mockOidcLogin;

@SpringBootTest
@AutoConfigureWebTestClient
public class StatsControllerTest {

    private static Logger logger = LoggerFactory.getLogger(StatsControllerTest.class);

    @Autowired
    private WebTestClient webTestClient;

    private static final MongoDBContainer mongoDBContainer = new MongoDBContainer(DockerImageName.parse("mongo:bionic"))
            .withExposedPorts(27017)
            .withCopyFileToContainer(MountableFile.forClasspathResource("stats.json"),
                    "/stats.json")
            .withEnv("MONGO_INIT_DATABASE", "fortnite");

    @BeforeAll
    public static void setUp() throws IOException, InterruptedException {
        mongoDBContainer.setPortBindings(List.of("27017:27017"));
        mongoDBContainer.start();

        Container.ExecResult result = mongoDBContainer.execInContainer("mongoimport",
                "--verbose", "--db=fortnite", "--collection=stats", "--file=/stats.json", "--jsonArray");
        logger.info(result.getStdout());
        logger.info(result.getStderr());
        logger.info("exit code={}", result.getExitCode());
    }

    @Test
    public void testGet_noAuth_returnsNotAuthorized(){

        webTestClient
                .get().uri("/endofgame")
                .exchange()
                .expectStatus().is3xxRedirection();
    }

    @Test
    public void testGet_withOidcLogin_returnsOk(){

        webTestClient.mutateWith(mockOidcLogin())
                .get().uri("/endOfGame")
                .exchange()
                .expectStatus().is2xxSuccessful()
                .expectBody()
                    .jsonPath("$.length()").isNumber()
                    .jsonPath("$.length()").isEqualTo("87")
                    .jsonPath("$[0].mentalState").isNotEmpty()
                    .jsonPath("$[0].damageTaken").isNumber()
                    .jsonPath("$[0].damageToPlayers").isNumber()
                    .jsonPath("$[0].damageToStructures").isNumber()
                    .jsonPath("$[0].date").isNotEmpty()
                    .jsonPath("$[0].timeOfDay").isNotEmpty()
                    .consumeWith(response -> logger.info(response.toString()));

    }

    @Test
    public void testGetMentalStateAverageDamage_withOidcLogin_returnsOk(){
        webTestClient
                .mutateWith(mockOidcLogin())
                .get().uri("/mentalStateAverageDamage")
                .exchange()
                .expectStatus().is2xxSuccessful()
                .expectBody()
                .jsonPath("$.length()").isEqualTo("2")
                .consumeWith(response -> logger.info(response.toString()));
    }

    @AfterAll
    public static void tearDown(){
        mongoDBContainer.stop();
    }
}
```

In the `setUp()` above, the `mongoimport` tool is executed in the test container, initializing the `stats` collection with the sample dataset. If the import runs successfully, the following line should appear in the test logs:

```text
87 document(s) imported successfully. 0 document(s) failed to import.
```
Also, you can inspect the response in the logs for the average damage test:

```json
[
   {
      "mentalState":"sober",
      "damageToPlayers":604.3777777777777,
      "damageToStructures":3373.511111111111,
      "damageTaken":246.46666666666667
   },
   {
      "mentalState":"high",
      "damageToPlayers":557.547619047619,
      "damageToStructures":2953.8571428571427,
      "damageTaken":241.71428571428572
   }
]
```
For this single player dataset, the damage taken or inflicted was not orders of magnitude different when sober than when high.


# Java Records Advantages and Disadvantages

While Java Record is more concise for declaring data carrier classes, the "war on boilerplate" is a non-goal of the construct, neither is to add features like properties or annotation-driven code generation, like [Project Lombok](https://projectlombok.org/) does. Records semantics provide benefits when modeling an immutable state data type. No hidden state is allowed, as no instance fields can be defined outside the header, hence the transparent claim. Compiler generated `equals()` and `hasCode()` avoid error-prone coding. Serialization and deserialization into JSON is straightforward thanks to its canonical constructor.
If you need to be able to alter the state or to define a hierarchy, it is not possible with records.


# Learn More

I hope you enjoyed this tutorial and learned more about Java Record semantics, its benefits and limitations. Before choosing this feature, make sure to find out if your favorite frameworks provide support for it. Fortunately, at this moment Spring Boot support for Java Records was recently added in 2.5.x releases through Jackson 2.12.x. I was not able to find comments about records in Spring Data documentation. To continue learning about Java Records, Okta Security and Spring WebFlux check out the links below:

- [java.lang.Record](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/lang/Record.html)
- [Reactive Java Microservices with Spring Boot and JHipster](https://developer.okta.com/blog/2021/01/20/reactive-java-microservices)
- [R2DBC and Spring for Non-Blocking Database Access](https://developer.okta.com/blog/2021/05/12/spring-boot-r2dbc)
- [A Quick Guide to Spring Cloud Stream](https://developer.okta.com/blog/2020/04/15/spring-cloud-stream)
- [How to Use Client Credentials Flow with Spring Security](https://developer.okta.com/blog/2021/05/05/client-credentials-spring-security)


You can find all the tutorial code in [Github](https://github.com/indiepopart/java-records.git)
