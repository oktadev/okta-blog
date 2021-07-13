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


The **flatMap** method transforms the emitted items **asynchronously** into **Publishers**, then flatten these inner publishers into a single **Flux** through merging, which allow them to interleave. This operator does not necessarily preserve original ordering. The mapper function passed to flatMap transforms the input sequence into N sequences. This operator is suitable for running an asynchronous task for each item. For example:

```java
```



## Nothing Happens Until You Subscribe

In general.
When you instantiate a Flux you are describing a processing pipeline.
When you subscribe you are triggering the data flow through that pipeline.

Hot publisher, generates data for each subscription. If you subscribe twice, it will generate the data twice.

# Reactor schedulers and Work Stealing
Notion of execution context.
Notion of a clock.
Intermediate operators.


# Spring WebFlux Application

-- Call a blocking service



# Error Handling

-- On subsribe or before

# Wrapping the Blocking Call

-- Detect the blocking call with BlockHound
-- Fix it 1
-- Fix it 2
-- Fix it 3

# Learn More

- [Avoiding Reactor Meltdown](https://www.youtube.com/watch?v=xCu73WVg8Ps)
- [A Look at Reactor Execution Model](https://www.youtube.com/watch?v=sNgTTcG-fEU)
- []()
