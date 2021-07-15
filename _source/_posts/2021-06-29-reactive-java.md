---
layout: blog_post
title: "Reactor Schedulers for Better Reactive Java Applications"
author: jimena-garbarino
by: contractor
communities: [java]
description: ""
tags: []
tweets:
- ""
- ""
- ""
image:
type: awareness
---


--- introduction to Reactor
# Quick Look at Reactor Execution Model

## map and flatMap

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



_No execution context_:

_Single reusable thread_:

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

_Bounded elastic thread pool_:

A better choice for I/O blocking work, for example, reading a file, or making a blocking network call, is a bounded elastic thread pool.

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

What might be confusing is that each subscription is assigned one bounded elastic thread for the whole execution. So in this case,_ subscription1_ executed in `boundedElastic-1` and subscription2 executed in `boundedElastic-2`. In this example, if there was only one subscription, you would see that all operators execute in the same bounded elastic thread.

The way the `Flux` was instantiated above produced a **Cold Publisher**, a publisher that generates data anew for each subscription. That's why both subscriptions above process all the values.

_Fixed pool of workers_:





# Reactive Spring Web Flux Applications

--- Call a blocking service



## Error Handling

--- On subsribe or before

## Wrapping a Blocking Call

--- Detect the blocking call with BlockHound
--- Fix it 1
--- Fix it 2
--- Fix it 3

# Learn More

- [Avoiding Reactor Meltdown](https://www.youtube.com/watch?v=xCu73WVg8Ps)
- [A Look at Reactor Execution Model](https://www.youtube.com/watch?v=sNgTTcG-fEU)
- []()
