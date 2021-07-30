---
layout: blog_post
title: "How to Prevent Reactive Java Applications from Stalling"
author: jimena-garbarino
by: contractor
communities: [java]
description: "Reactor Schedulers for Spring Reactive Java Applications"
tags: []
tweets:
- ""
- ""
- ""
image:
type: awareness
---
Project Reactor is a Java framework from Pivotal that implements the [Reactive Streams](https://www.reactive-streams.org/) specification, an initiative to provide a standard for asynchronous stream processing with non-blocking backpressure for the JVM and JavaScript runtimes. It is the foundation of the reactive stack in the Spring ecosystem and WebFlux applications.
In this post some core Reactor concepts are summarized, to introduce the Scheduler abstraction and its utility to encapsulate blocking code and prevent java reactive applications from stalling.

**Prerequisites:**

- [HTTPie](https://httpie.io/)
- [Java 11+](https://openjdk.java.net/install/index.html)
- [Okta CLI](https://cli.okta.com)


**Table of Contents**{: .hide }
* Table of Contents
{:toc}


# Reactor Execution Model

Reactor is an API for doing asynchronous programming, where you describe your data processing as a flow of operators, composing a data processing pipeline.

{% img blog/reactive-java/project-reactor.png alt:"Project Reactor Logo" width:"300" %}{: .center-image }


Using the assembly line analogy, the initial data flow from a source, the `Publisher`, goes through transformation steps and eventually the result is pushed to a consumer, the `Subscriber`. A `Publisher`, produces data, and a  `Subscriber`, listens to it. Reactor also supports flow control via backpressure, so a `Subscriber` can signal the volume it can consume.


#### Nothing Happens Until You Subscribe

In general, when you instantiate a `Publisher` (a `Flux` or a `Mono`) you are describing an asynchronous processing pipeline. When combining operators, no processing happens, you are describing the intent. This is called **assembly time**. Only when you `subscribe` you are triggering the data flow through that pipeline. The `subscribe` call emits a signal back to the source, and the source starts emitting data that flows through the pipeline. This is called **execution time** or **subscription time**.

A **cold publisher** generates data for each subscription. Then, if you subscribe twice, it will generate the data twice. All the examples that follow below will instantiate cold publishers. On the other hand, a **hot publisher** starts emitting data immediately or on the first subscription. Late subscribers receive data emitted after they subscribe. For the hot family of publishers, something does indeed happen before you subscribe.

#### Operators `map` and `flatMap`

Operators are like workstations in an assembly line. They allow describing transformations or intermediary steps along the processing chain. Each operator is a decorator, it wraps the previous `Publisher` into a new instance. To avoid mistakes, **the preferred way of using operators is to chain the calls**. Apply the next operator to the last operator's result. Some operators are instance methods and others are static methods.

`map` and `flatMap` are instance method **operators**. You might be familiar with the concept of these operations, from functional programming, or Java Streams. In the reactive world, they have their own semantics.

The **map** method transforms the emitted items by applying a **synchronous function** to each item, in a 1-to-1 basis. Check the example below:

```java
public class MapTest {

    private static Logger logger = LoggerFactory.getLogger(OperatorsTest.class);

    @Test
    public void mapTest() throws InterruptedException {
        Flux.range(1, 5)
                .map(v -> transform(v))
                .subscribe(y -> logger.info(y));

        Thread.sleep(5000);
    }

    private String transform(Integer i){
        return  String.format("%03d", i);
    }
}
```

Note: You can find this test and all the code in this tutorial in [Github](https://github.com/indiepopart/reactive-java-demo)

In the code above, a flux is created from a range of integers from 1 to 5, and the map operator is passed a transformation function that formats with leading zeros. Notice the return type of the transform method is not a publisher and the transformation is synchronous, meaning it is a simple method call. The transformation function must not introduce latency.


The `flatMap` method transforms the emitted items **asynchronously** into **Publishers**, then flatten these inner publishers into a single `Flux` through merging, and the items can interleave. This operator does not necessarily preserve original ordering. The mapper function passed to `flatMap` transforms the input sequence into N sequences. **This operator is suitable for running an asynchronous task for each item.**

In the example below, a list of words is mapped to its phonetic through the Dictionary API, using flatMap.

```java
@SpringBootTest
public class FlatMapTest {

    private static Logger logger = LoggerFactory.getLogger(FlatMapTest.class);

    public static class Word {

        private String word;
        private List<Phonetic> phonetics;

        public String getWord() {
            return word;
        }

        public void setWord(String word) {
            this.word = word;
        }

        public List<Phonetic> getPhonetics() {
            return phonetics;
        }

        public void setPhonetics(List<Phonetic> phonetics) {
            this.phonetics = phonetics;
        }
    }

    public static class Phonetic {

        private String text;
        private String audio;


        public String getText() {
            return text;
        }

        public void setText(String text) {
            this.text = text;
        }

        public String getAudio() {
            return audio;
        }

        public void setAudio(String audio) {
            this.audio = audio;
        }
    }

    @Configuration
    public static class FlatMapTestConfig {

        @Bean
        public WebClient webClient(){

            WebClient webClient = WebClient.builder()
                    .baseUrl("https://api.dictionaryapi.dev/api/v2/entries/en_US")
                    .build();

            return webClient;
        }
    }

    @Autowired
    private WebClient webClient;

    @Test
    public void flatMapTest() throws InterruptedException {

        List<String> words = new ArrayList<>();
        words.add("car");
        words.add("key");
        words.add("ballon");
        Flux.fromStream(words.stream())
                .flatMap(w -> getPhonetic(w))
                .subscribe(y -> logger.info(y));

        Thread.sleep(5000);
    }


    private  Mono<String> getPhonetic(String word){
        Mono<String> response = webClient.get()
                .uri("/" + word).retrieve().bodyToMono(Word[].class)
                .map(r -> r[0].getPhonetics().get(0).getText());

        return response;

    }

}
```
There is a rich vocabulary of operators for `Flux` and `Mono` you can find in the reference documentation. There is also a handy guide for choosing the right operator: ["Which operator do I need?"](https://projectreactor.io/docs/core/release/reference/#which-operator).

# Reactor Schedulers for Switching the Thread

Project Reactor provides the tools for fine-tuning the asynchronous processing in terms of threads and execution context.
The `Scheduler` is an abstraction on top of the `ExecutionService`, which allows submitting a task immediately, after a delay or at a fixed time rate. Various default schedulers are provided, and they will be exampled below. The execution context is defined by the `Scheduler` selection.

Schedulers are selected through `subscribeOn` and `publishOn` operators, they switch the execution context. `subscribeOn` changes the thread where the source actually starts generating data. It changes the root of the chain, affecting the preceding operators, _upstream_ in the chain; and also affects subsequent operators.`publishOn` switches the context for the subsequent operators in the pipeline description, _downstream_ in the chain, overriding the scheduler assigned with `subscribeOn` if that was the case.


The scheduler examples ahead will use `TestUtils.debug` for logging the thread name, function and element:

```java
public class TestUtils {

    public static Logger logger = LoggerFactory.getLogger(TestUtils.class);

    public static <T> T debug(T el, String function) {
        logger.info("element "+ el + " [" + function + "]");
        return el;
    }
}
```
#### No execution context

`Schedulers.immediate()` can be seen as the no-op scheduler, the pipeline executes in the current thread.

```java
@Test
public void immediateTest() throws InterruptedException {
    Flux.range(1, 5)
            .map(v -> debug(v, "map"))
            .subscribeOn(Schedulers.immediate())
            .subscribe(w -> debug(w,"subscribe"));


    Thread.sleep(5000);
}
```

The test above will log something similar to:

```
2021-07-29 09:36:05.905 - INFO [main] - element "1" [map]
2021-07-29 09:36:05.906 - INFO [main] - element "1" [subscribe]
2021-07-29 09:36:05.906 - INFO [main] - element "2" [map]
2021-07-29 09:36:05.906 - INFO [main] - element "2" [subscribe]
2021-07-29 09:36:05.906 - INFO [main] - element "3" [map]
2021-07-29 09:36:05.907 - INFO [main] - element "3" [subscribe]
2021-07-29 09:36:05.907 - INFO [main] - element "4" [map]
2021-07-29 09:36:05.907 - INFO [main] - element "4" [subscribe]
2021-07-29 09:36:05.907 - INFO [main] - element "5" [map]
2021-07-29 09:36:05.907 - INFO [main] - element "5" [subscribe]
```
Everything executes in the _main_ thread.

#### Single reusable thread

```java
@Test
public void singleTest() throws InterruptedException {

    Flux.range(1, 5)
            .map(v -> debug(v, "map"))
            .publishOn(Schedulers.single())
            .subscribe(w -> debug(w,"subscribe"));


    Thread.sleep(5000);
}
```
When running the test above, you will see a log similar to this:

```
2021-07-13 23:19:16.456 - INFO [main] - element 1 [map]
2021-07-13 23:19:16.457 - INFO [main] - element 2 [map]
2021-07-13 23:19:16.457 - INFO [main] - element 3 [map]
2021-07-13 23:19:16.457 - INFO [main] - element 4 [map]
2021-07-13 23:19:16.457 - INFO [main] - element 5 [map]
2021-07-13 23:19:16.457 - INFO [single-1] - element 1 [subscribe]
2021-07-13 23:19:16.465 - INFO [single-1] - element 2 [subscribe]
2021-07-13 23:19:16.465 - INFO [single-1] - element 3 [subscribe]
2021-07-13 23:19:16.466 - INFO [single-1] - element 4 [subscribe]
2021-07-13 23:19:16.466 - INFO [single-1] - element 5 [subscribe]
```

As you can see, the `map` function executes in the _main_ thread, and the consumer code passed to `subscribe` executes in the _single-1_ thread. Everything after the `publishOn` will execute in the passed scheduler.

#### Bounded elastic thread pool

A better choice for I/O blocking work, for example, reading a file, or making a blocking network call, is a bounded elastic thread pool. **It is provided to help with legacy blocking code if it cannot be avoided.**

```java

@Test
public void boundedElasticTest() throws InterruptedException {

    List<String> words = new ArrayList<>();
    words.add("a.txt");
    words.add("b.txt");
    words.add("c.txt");
    Flux flux = Flux.fromArray(words.toArray(new String[0]))
            .publishOn(Schedulers.boundedElastic())
            .map(w -> scanFile(debug(w, "map")));

    flux.subscribe(y -> debug(y, "subscribe1"));
    flux.subscribe(y -> debug(y, "subscribe2"));

    Thread.sleep(5000);
}


public String scanFile(String filename){

    InputStream stream = getClass().getClassLoader().getResourceAsStream(filename);
    Scanner scanner = new Scanner(stream);
    String line = scanner.nextLine();
    scanner.close();

    return line;
}

```

The test above should log something similar to this:

```
2021-07-15 00:41:51.443 - INFO [boundedElastic-1] - element "a.txt" [map]
2021-07-15 00:41:51.443 - INFO [boundedElastic-2] - element "a.txt" [map]
2021-07-15 00:41:51.446 - INFO [boundedElastic-2] - element "A line in file a.txt" [subscribe2]
2021-07-15 00:41:51.447 - INFO [boundedElastic-2] - element "b.txt" [map]
2021-07-15 00:41:51.447 - INFO [boundedElastic-2] - element "A line in file b.txt" [subscribe2]
2021-07-15 00:41:51.447 - INFO [boundedElastic-2] - element "c.txt" [map]
2021-07-15 00:41:51.448 - INFO [boundedElastic-2] - element "A line in file c.txt" [subscribe2]
2021-07-15 00:41:51.448 - INFO [boundedElastic-1] - element "A line in file a.txt" [subscribe1]
2021-07-15 00:41:51.449 - INFO [boundedElastic-1] - element "b.txt" [map]
2021-07-15 00:41:51.451 - INFO [boundedElastic-1] - element "A line in file b.txt" [subscribe1]
2021-07-15 00:41:51.452 - INFO [boundedElastic-1] - element "c.txt" [map]
2021-07-15 00:41:51.453 - INFO [boundedElastic-1] - element "A line in file c.txt" [subscribe1]
```
As you can see in the code above, the flux is subscribed twice. As the `publishOn` is invoked before any operator, everything will execute in the context of a bounded elastic thread. Also, notice how the execution from both subscriptions can interleave.

What might be confusing is that each subscription is assigned one bounded elastic thread for the whole execution. So in this case, "subscription1" executed in _boundedElastic-1_ and "subscription2" executed in _boundedElastic-2_. All operations for a given subscription execute in the same thread.

The way the `Flux` was instantiated above produced a **Cold Publisher**, a publisher that generates data anew for each subscription. That's why both subscriptions above process all the values.

#### Fixed pool of workers

`Schedulers.parallel()` provides a pool of workers tuned for parallel work, as many workers as CPU cores.

```java
@Test
public void parallelTest() throws InterruptedException {

    Flux flux = Flux.range(1, 5)
            .publishOn(Schedulers.parallel())
            .map(v -> debug(v, "map"));

    for (int i = 0; i < 5; i++) {
        flux.subscribe(w -> debug(w,"subscribe"));
    }


    Thread.sleep(5000);
}
```

The test above will log something similar to the following lines:

```
2021-07-15 22:57:33.435 - INFO [parallel-2] - element "1" [map]
2021-07-15 22:57:33.435 - INFO [parallel-2] - element "1" [subscribe2]
2021-07-15 22:57:33.435 - INFO [parallel-1] - element "1" [map]
2021-07-15 22:57:33.435 - INFO [parallel-2] - element "2" [map]
2021-07-15 22:57:33.435 - INFO [parallel-2] - element "2" [subscribe2]
2021-07-15 22:57:33.435 - INFO [parallel-1] - element "1" [subscribe1]
2021-07-15 22:57:33.435 - INFO [parallel-1] - element "2" [map]
2021-07-15 22:57:33.436 - INFO [parallel-1] - element "2" [subscribe1]
2021-07-15 22:57:33.436 - INFO [parallel-2] - element "3" [map]
2021-07-15 22:57:33.436 - INFO [parallel-1] - element "3" [map]
2021-07-15 22:57:33.436 - INFO [parallel-2] - element "3" [subscribe2]
2021-07-15 22:57:33.436 - INFO [parallel-1] - element "3" [subscribe1]
2021-07-15 22:57:33.436 - INFO [parallel-1] - element "4" [map]
2021-07-15 22:57:33.436 - INFO [parallel-2] - element "4" [map]
2021-07-15 22:57:33.436 - INFO [parallel-1] - element "4" [subscribe1]
2021-07-15 22:57:33.436 - INFO [parallel-2] - element "4" [subscribe2]
2021-07-15 22:57:33.436 - INFO [parallel-1] - element "5" [map]
2021-07-15 22:57:33.436 - INFO [parallel-2] - element "5" [map]
2021-07-15 22:57:33.436 - INFO [parallel-1] - element "5" [subscribe1]
2021-07-15 22:57:33.436 - INFO [parallel-2] - element "5" [subscribe2]
2021-07-15 22:57:33.438 - INFO [parallel-3] - element "1" [map]
2021-07-15 22:57:33.438 - INFO [parallel-3] - element "1" [subscribe3]
2021-07-15 22:57:33.439 - INFO [parallel-3] - element "2" [map]
2021-07-15 22:57:33.439 - INFO [parallel-3] - element "2" [subscribe3]
2021-07-15 22:57:33.439 - INFO [parallel-3] - element "3" [map]
2021-07-15 22:57:33.439 - INFO [parallel-3] - element "3" [subscribe3]
2021-07-15 22:57:33.441 - INFO [parallel-4] - element "1" [map]
2021-07-15 22:57:33.441 - INFO [parallel-3] - element "4" [map]
2021-07-15 22:57:33.442 - INFO [parallel-4] - element "1" [subscribe4]
2021-07-15 22:57:33.445 - INFO [parallel-1] - element "1" [map]
2021-07-15 22:57:33.445 - INFO [parallel-4] - element "2" [map]
2021-07-15 22:57:33.445 - INFO [parallel-4] - element "2" [subscribe4]
2021-07-15 22:57:33.445 - INFO [parallel-1] - element "1" [subscribe5]
2021-07-15 22:57:33.445 - INFO [parallel-4] - element "3" [map]
2021-07-15 22:57:33.445 - INFO [parallel-4] - element "3" [subscribe4]
2021-07-15 22:57:33.445 - INFO [parallel-1] - element "2" [map]
2021-07-15 22:57:33.445 - INFO [parallel-4] - element "4" [map]
2021-07-15 22:57:33.445 - INFO [parallel-1] - element "2" [subscribe5]
2021-07-15 22:57:33.445 - INFO [parallel-4] - element "4" [subscribe4]
2021-07-15 22:57:33.445 - INFO [parallel-1] - element "3" [map]
2021-07-15 22:57:33.445 - INFO [parallel-4] - element "5" [map]
2021-07-15 22:57:33.445 - INFO [parallel-4] - element "5" [subscribe4]
2021-07-15 22:57:33.445 - INFO [parallel-1] - element "3" [subscribe5]
2021-07-15 22:57:33.442 - INFO [parallel-3] - element "4" [subscribe3]
2021-07-15 22:57:33.450 - INFO [parallel-3] - element "5" [map]
2021-07-15 22:57:33.450 - INFO [parallel-3] - element "5" [subscribe3]
2021-07-15 22:57:33.450 - INFO [parallel-1] - element "4" [map]
2021-07-15 22:57:33.450 - INFO [parallel-1] - element "4" [subscribe5]
2021-07-15 22:57:33.450 - INFO [parallel-1] - element "5" [map]
2021-07-15 22:57:33.450 - INFO [parallel-1] - element "5" [subscribe5]
```

As you can see, different subscription executions interleave, and as I am testing with only four CPU cores, four workers seem to be available: _parallel-1_, _parallel-2_, _parallel-3_, and _parallel-4_. The `subscription5` operations, execute in _parallel-1_.

Again, as you can observe, all operations for a given subscription are executed in the same thread.

#### Using both `publishOn` and `subscribeOn`

As the `subscribe` call accepts a consumer, when the `publishOn` and `subscribeOn` operators are used, it might be confusing at first understanding that the consumer will execute in the context selected by `publishOn`, as it defines the scheduler for downstream processing, which includes the consumer execution. Check the following example:

```java
@Test
public void subscribeOnWithPublishOnTest() throws InterruptedException {
    Flux.range(1, 3)
            .map(v -> debug(v, "map1"))
            .publishOn(Schedulers.parallel())
            .map(v -> debug(v * 100, "map2"))
            .subscribeOn(Schedulers.boundedElastic())
            .subscribe(w -> debug(w,"subscribe"));

    Thread.sleep(5000);
}
```

The log should look like the following lines:

```
2021-07-29 08:40:30.583 - INFO [boundedElastic-1] - element "1" [map1]
2021-07-29 08:40:30.584 - INFO [parallel-1] - element "100" [map2]
2021-07-29 08:40:30.585 - INFO [parallel-1] - element "100" [subscribe]
2021-07-29 08:40:30.585 - INFO [boundedElastic-1] - element "2" [map1]
2021-07-29 08:40:30.585 - INFO [parallel-1] - element "200" [map2]
2021-07-29 08:40:30.585 - INFO [parallel-1] - element "200" [subscribe]
...
```

As you can see, the first `map` operator executes in the _boundedElastic-1_ thread, and the second `map` operator and the `subscribe` consumer execute in the _parallel-1_ thread. Notice that the `subscribeOn` operator is invoked after `publishOn`, but it affects the root of the chain and the operators preceding `publishOn` anyways.

A probably simplified [marble diagam](https://projectreactor.io/docs/core/release/reference/#howtoReadMarbles) for the example above may look like:

{% img blog/reactive-java/marble-diagram.png alt:"Marble Diagram" width:"800" %}{: .center-image }


# Reactive Java Spring Services

In Spring WebFlux, it is assumed applications don't block, so non-blocking servers use a small fixed-size thread pool to handle requests, named **event loop** workers.

In an ideal reactive scenario, all the architecture components are non-blocking, so there is no need to worry about the event loop freezing up (**reactor meltdown**). But sometimes, you will have to deal with legacy blocking code, or blocking libraries.


So now, let's experiment with Reactor Schedulers in a Reactive Java application. Create a secured webflux REST service with an endpoint to return a random integer. The implementation will call Java `SecureRandom` blocking code. Start by downloading a Spring Boot maven project using [Spring Initializr](https://start.spring.io/). You can do it with the following `HTTPie` line:

```shell
http -d https://start.spring.io/starter.zip type==maven-project \
  language==java \
  bootVersion==2.5.3 \
  baseDir==reactive-service \
  groupId==com.okta.developer.reactive \
  artifactId==reactive-service \
  name==reactive-service \
  packageName==com.okta.developer.reactive \
  javaVersion==11 \
  dependencies==webflux,okta
```
Unzip the project:

```shell
unzip reactor-service.zip
cd reactive-service
```

{% include setup/cli.md type="web" framework="Okta Spring Boot Starter" %}


Create the package `com.okta.developer.reactive.service`, and add the `SecureRandomService` interface:

```java
package com.okta.developer.reactive.service;

import reactor.core.publisher.Mono;

public interface SecureRandomService {

    Mono<Integer> getRandomInt();
}
```

And the implementation `SecureRandomServiceImpl`:

```java
package com.okta.developer.reactive.service;

import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.security.SecureRandom;

@Service
public class SecureRandomServiceImpl implements SecureRandomService {

    private SecureRandom secureRandom;

    public SecureRandomServiceImpl() {
        secureRandom = new SecureRandom();
    }

    @Override
    public Mono<Integer> getRandomInt() {
        return Mono.just(secureRandom.nextInt());
    }
}
```

Think for a moment about the `getRandomInt` implementation. It is hard to resist the temptation of just wrapping whatever in a publisher. `Mono.just(T data)` creates a `Mono` that will emit the specified item. But the item is **captured at instantiation time**. This means the blocking code will be invoked on assembly time, and it might be in the context of an event loop thread.

For now, let's move forward and create the package `com.okta.developer.reactive.controller`, and add a `SecureRandom` class for the data:

```java
package com.okta.developer.reactive.controller;

public class SecureRandom {

    private String value;

    public String getValue() {
        return value;
    }

    public void setValue(String value) {
        this.value = value;
    }

    public SecureRandom(Integer value){
        this.value = value.toString();
    }
}
```
Create the `SecureRandomController` class:

```java
package com.okta.developer.reactive.controller;

import com.okta.developer.reactive.service.SecureRandomService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Mono;

@RestController
public class SecureRandomController {

    @Autowired
    private SecureRandomService secureRandomService;


    @GetMapping("/random")
    public Mono<SecureRandom> getSecureRandom(){
        return secureRandomService.getRandomInt().map(i -> new SecureRandom(i));
    }
}
```

Add `spring-security-test` dependency to the pom:

```xml
<dependency>
    <groupId>org.springframework.security</groupId>
    <artifactId>spring-security-test</artifactId>
    <version>5.4.5</version>
    <scope>test</scope>
</dependency>
```


Add a `SecureRandomControllerTest`:
```java
package com.okta.developer.reactive.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.AutoConfigureWebTestClient;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.reactive.server.WebTestClient;

import static org.springframework.security.test.web.reactive.server.SecurityMockServerConfigurers.mockOidcLogin;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureWebTestClient
@ActiveProfiles("test")
public class SecureRandomControllerTest {

    @Autowired
    private WebTestClient webTestClient;


    @Test
    public void testGetSecureRandom() {


        webTestClient.mutateWith(mockOidcLogin())
            .get()
            .uri("/random")
            .exchange()
            .expectStatus().isOk();
    }
}
```


Run with:
```shell
./mvnw test -Dtest=SecureRandomControllerTest
```
The test should pass, but **how can you make sure the REST call won't freeze up the service's event loop?** With [BlockHound](https://github.com/reactor/BlockHound), a Java agent to detect blocking calls from non-blocking threads. Blockhound has built-in integration with Project Reactor and supports the JUnit platform.

Add the Blockhound dependency to the `pom.xml`:

```xml
<dependency>
    <groupId>io.projectreactor.tools</groupId>
    <artifactId>blockhound-junit-platform</artifactId>
    <version>RELEASE</version>
    <scope>test</scope>
</dependency>
```


It has been reported that when [`spring-security` is enabled, BlockHound does not detect](https://github.com/reactor/BlockHound/issues/173) blocking calls.

Disable security for the test profile. Add the file `src/test/resources/application-test.yml` with the following content:

```
spring:
  autoconfigure:
    exclude:
      - org.springframework.boot.autoconfigure.security.oauth2.client.reactive.ReactiveOAuth2ClientAutoConfiguration
      - org.springframework.boot.autoconfigure.security.oauth2.resource.reactive.ReactiveOAuth2ResourceServerAutoConfiguration
      - org.springframework.boot.autoconfigure.security.reactive.ReactiveSecurityAutoConfiguration
```

Run the test again, and you should the following error:

```
reactor.blockhound.BlockingOperationError: Blocking call! java.io.FileInputStream#readBytes
	at java.base/java.io.FileInputStream.readBytes(FileInputStream.java) ~[na:na]
	Suppressed: reactor.core.publisher.FluxOnAssembly$OnAssemblyException:
Error has been observed at the following site(s):
	|_ checkpoint ⇢ HTTP GET "/random" [ExceptionHandlingWebHandler]
Stack trace:
		at java.base/java.io.FileInputStream.readBytes(FileInputStream.java) ~[na:na]
		at java.base/java.io.FileInputStream.read(FileInputStream.java:279) ~[na:na]
		at java.base/java.io.FilterInputStream.read(FilterInputStream.java:133) ~[na:na]
		at java.base/sun.security.provider.NativePRNG$RandomIO.readFully(NativePRNG.java:424) ~[na:na]
		at java.base/sun.security.provider.NativePRNG$RandomIO.ensureBufferValid(NativePRNG.java:526) ~[na:na]
		at java.base/sun.security.provider.NativePRNG$RandomIO.implNextBytes(NativePRNG.java:545) ~[na:na]
		at java.base/sun.security.provider.NativePRNG.engineNextBytes(NativePRNG.java:220) ~[na:na]
		at java.base/java.security.SecureRandom.nextBytes(SecureRandom.java:741) ~[na:na]
		at java.base/java.security.SecureRandom.next(SecureRandom.java:798) ~[na:na]
```

As the log above shows, `SecureRandom.next` produces a call to `FileInputStream#readBytes`, which is blocking.
The `SecureRandomService` returns a `Mono` publisher, but it is an **Impostor Reactive Service**!

```java
return Mono.just(secureRandom.nextInt());
```

The implementation above has logic upfront, first the calculation `secureRandom.nextInt` and then the assembly.
What is the right way to wrap a blocking call? **Make the work happen in another scheduler.**


# Encapsulation of Blocking Calls

Blocking encapsulation needs to happen down into the service, as explained in the [Reactor documentation](https://projectreactor.io/docs/core/release/reference/#faq.wrap-blocking). This means the scheduler assignment must also happen inside the implementation.

Create the class `SecureRandomReactiveImpl`.

```java
package com.okta.developer.reactive.service;

import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.security.SecureRandom;

@Service
@Primary
public class SecureRandomReactiveImpl implements SecureRandomService {

    private SecureRandom secureRandom;

    public SecureRandomReactiveImpl() {
        secureRandom = new SecureRandom();
    }

    @Override
    public Mono<Integer> getRandomInt() {
        return Mono.fromCallable(secureRandom::nextInt)
                .subscribeOn(Schedulers.boundedElastic());
    }
}
```

Run the test again and the BlockHound exception should not happen. Avoid the logic upfront and just assembly the pipeline, everything should be fine.


Finally, let's do an end-to-end test. Run the application with maven:

```shell
./mvnw spring-boot:run
```

Go to [http://localhost:8080/random](http://localhost:8080/random) and you should see the Okta sign in page:

{% img blog/reactive-java/okta-login.png alt:"Okta Login Page" width:"800" %}{: .center-image }

Sign in with your Okta account and you should see a response similar to this:

```json
{
value: "-611020335"
}
```



# Learn More

I hope you enjoyed this post, and get a better understanding of Reactor Schedulers and on how to encapsulate blocking code the right way, to avoid freezing the event loop in your reactive java application. There are important Reactor topics that could not be covered in this post, like error handling, work-stealing and `StepVerifier`. To continue learning, check out the links below:

- [Avoiding Reactor Meltdown](https://www.youtube.com/watch?v=xCu73WVg8Ps)
- [Secure Reactive Microservices with Spring Cloud Gateway](https://developer.okta.com/blog/2019/08/28/reactive-microservices-spring-cloud-gateway)
- [Build a Reactive App with Spring Boot and MongoDB](https://developer.okta.com/blog/2019/02/21/reactive-with-spring-boot-mongodb)
- [Reactive Java Microservices with Spring Boot and JHipster](https://developer.okta.com/blog/2021/01/20/reactive-java-microservices)
- [Reactor 3 Reference Guide](https://projectreactor.io/docs/core/release/reference/)
