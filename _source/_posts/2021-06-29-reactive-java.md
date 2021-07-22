---
layout: blog_post
title: "How To Not Mess Up When Doing Reactor"
author: jimena-garbarino
by: contractor
communities: [java]
description: "Reactor Schedulers for Better Reactive Java Applications"
tags: []
tweets:
- ""
- ""
- ""
image:
type: awareness
---


_introduction to Reactor_

{% img blog/reactive-java/project-reactor.png alt:"Project Reactor Logo" width:"300" %}{: .center-image }

- [HTTPie](https://httpie.io/)
- [Java 11+](https://openjdk.java.net/install/index.html)
- [Okta CLI](https://cli.okta.com)


**Table of Contents**{: .hide }
* Table of Contents
{:toc}


# Quick Look at Reactor Execution Model

## Operators map and flatMap

**map** and **flatMap** are **operators**. The data as a flow can go through transformations or intermediary steps by applying operators.

The **map** method transforms the emitted items by applying a **synchronous function** to each item, in a 1-to-1 basis. Check the example below:

```java
package com.okta.developer;

import org.junit.jupiter.api.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import reactor.core.publisher.Flux;


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

In the code above, a flux is created from a range of integers from 1 to 5, and the map operator is passed a transformation function that formats with leading zeros. Notice the return type of the transform method is not a publisher and the transformation is synchronous, meaning it is a simple method call. The transformation function must not introduce latency.


The **flatMap** method transforms the emitted items **asynchronously** into **Publishers**, then flatten these inner publishers into a single **Flux** through merging, which allow them to interleave. This operator does not necessarily preserve original ordering. The mapper function passed to flatMap transforms the input sequence into N sequences. This operator is suitable for running an asynchronous task for each item.

In the example below, a list of words is mapped to its phonetic through the Dictionary API, using flatMap.

```java
package com.okta.developer;


import org.junit.jupiter.api.Test;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.ArrayList;
import java.util.List;

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


## Nothing Happens Until You Subscribe

In general.
When you instantiate a Flux you are describing a processing pipeline.
When you subscribe you are triggering the data flow through that pipeline.

Hot publisher, generates data for each subscription. If you subscribe twice, it will generate the data twice.

## Reactor schedulers and Work Stealing
Notion of execution context.
Notion of a clock.
Intermediate operators.



_Create spring boot application with spring initializr_


Create the class `TestUtils` with a handy function for logging the thread name, function and element:

```java
package com.okta.developer;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class TestUtils {

    public static Logger logger = LoggerFactory.getLogger(TestUtils.class);

    public static <T> T debug(T el, String function) {
        logger.info("element "+ el + " [" + function + "]");
        return el;
    }
}
```



__No execution context__:

__Single reusable thread__:

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

__Bounded elastic thread pool__:

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
As you can see in the code above, the flux is subscribed twice. As the `publishOn` is invoked before any operator, everything will execute in the context of a bounded elastic thread. Also notice how execution from both subscription can interleave.

What might be confusing is that each subscription is assigned one bounded elastic thread for the whole execution. So in this case, _subscription1_ executed in `boundedElastic-1` and _subscription2_ executed in `boundedElastic-2`. All operations for a given subscription execute in the same thread.

The way the `Flux` was instantiated above produced a **Cold Publisher**, a publisher that generates data anew for each subscription. That's why both subscriptions above process all the values.

__Fixed pool of workers__:

A pool of workers tuned for parallel work, as many workers as CPU cores.

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

_Downstream and Upstream_


# Reactive Spring Web Flux REST Service

In an ideal reactive scenario, all the architecture components are non-blocking, so there is no need to worry about the event loop freezing up (**reactor meltdown**).
But sometimes, you will have to deal with legacy blocking code, or blocking libraries. So now, to continue the experiment with Reactor schedulers, create a REST service with an endpoint to return a random integer. The implementation will call Java SecureRandom blocking code.

Start by creating the package `com.okta.developer.reactor.controller`, and add a `SecureRandom` class for the data:

```java
package com.okta.developer.reactor.controller;

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
Add the `SecureRandomService` interface under the package `com.okta.developer.reactor.service`:

```java
package com.okta.developer.reactor.service;

import reactor.core.publisher.Mono;

public interface SecureRandomService {

    Mono<Integer> getRandomInt();
}
```

And the implementation:

```java
package com.okta.developer.reactor.service;

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

Think for a moment about the `getRandomInt` implementation. It is hard to resist the temptation of just wrapping whatever in a publisher. `Mono.just(T data)` creates an `Mono` that will emit the specified item. The item is **captured at instantiation time**. This means the blocking code will be invoked on assembly time, and it might be in the context of an event loop thread.

For now, let's move forward and create the `SecureRandomController` class:

```java
package com.okta.developer.reactor.controller;


import com.okta.developer.reactor.service.SecureRandomService;
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

Add a `SecureRandomControllerTest`:

```java
package com.okta.developer.reactor.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.reactive.AutoConfigureWebTestClient;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.reactive.server.WebTestClient;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureWebTestClient
public class SecureRandomControllerTest {

    @Autowired
    private WebTestClient webTestClient;

    @Test
    public void testGetSecureRandom() {


        webTestClient.get()
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
The test should pass, but how can you make sure the REST call won't freeze up the service's event loop? With [BlockHound](https://github.com/reactor/BlockHound), a Java agent to detect blocking calls from non-blocking threads. Blockhound has built-in integration with Project Reactor, and supports the JUnit platform.

Add the Blockhound dependency to the `pom.xml`:

```xml
<dependency>
    <groupId>io.projectreactor.tools</groupId>
    <artifactId>blockhound-junit-platform</artifactId>
    <version>RELEASE</version>
    <scope>test</scope>
</dependency>
```

Run the test again, and you should the the following error:

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
What is the right way to wrap a blocking call? **Make the work happen on another scheduler.**


## Blocking Encapsulation

Blocking encapsulation needs to happen down into the service, as explained in the [Reactor documentation](https://projectreactor.io/docs/core/release/reference/#faq.wrap-blocking). This means the scheduler assignment must happen inside the implementation.

Create the class `SecureRandomReactiveImpl`.

```java
package com.okta.developer.reactor.service;

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



## Error Handling

_On subsribe or before_

# Learn More

- [Avoiding Reactor Meltdown](https://www.youtube.com/watch?v=xCu73WVg8Ps)
- [A Look at Reactor Execution Model](https://www.youtube.com/watch?v=sNgTTcG-fEU)
- []()
