---
layout: blog_post
title: "Java Records: A Practical Example"
author: jimena-garbarino
by: contractor
communities: [java]
description: "Java Records for Spring Microservices and Database Access"
tags: [java-records, java, api, mongodb, rest, microservices]
tweets:
- ""
- ""
- ""
image:
type: conversion
---
When defining classes for a simple aggregation of values, developers had to write constructors, accessors, `equals()`, `hashCode()` and `toString()`, an error-prone ceremony that has low value and deviates the focus from modelling immutable data. With the motivation if simplifying the writing of data carrier classes, Java Records where introduced as a first preview in JDK 14. Second preview came in JDK 15 and the finalized feature came in JDK 16. In this post let's explore Java Records features and advantages in semantics, and apply them for building a REST Api and access a Database.


**Prerequisites**:

- [HTTPie](https://httpie.io/)
- [Java 14+](https://openjdk.java.net/install/index.html)
- [Okta CLI](https://cli.okta.com)

**Table of Contents**{: .hide }
* Table of Contents
{:toc}

# The Record Keyword

The `record` is a new type of declaration, a restricted for of class.

Releases previews 1, 2 and 3

In searching for a random dataset for this tutorial, I came across a collection of 88 end game statistics of a single player, for a popular game. As the author included the mental state in the data, I decided to use Java Records for building a basic query and find out if the performance was very different when sober than when high.

So let's start by defining a simple data carrier class `EndOfGame` as a `record`:

```java
package com.okta.developer.records;

import java.time.LocalDate;
import java.time.LocalTime;

public record EndOfGame(String id, LocalDate date,  LocalTime timeOfDay, Integer placed,
                        String mentalState, String accuracy, Integer hits, Integer headShots,
                        Integer damageTaken, Integer damageToPlayers, Integer damageToStructures) {
}
```
As you can see in the example above, the `record` has a name, I chose `EndOfGame`. What looks like a constructor signature is the _state description_ or _header_ declaring the _components_ of the `record`.

The following members are acquired automatically in the declaration:

- A private final field and a public read accessor for each component of the state description
- A public _canonical_ constructor with the same signature as the state description, which initializes each field from each argument
- Implementations of `equals()`, `hashCode()` and `toString()`

See the code fragments from `EndOfGameTest` class below to verify the automatic members are indeed available:

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

In the test above, `eog1` has the same state than `eog2`, so `eog1.equals(eog2)` is `true`. This also implies both instances must have the same `hashCode`.


```java
@Test
public void toStringTest(){
    EndOfGame eog = getTestEndOfGame();
    logger.info(eog.toString());

    assertEquals("EndOfGame[id=1, date=2018-12-12, timeOfDay=15:15, mentalState=sober, " +
                    "damageTaken=10, damageToPlayers=10, damageToStructures=10]",
            eog.toString());

}
```

A `toString()` test was also included to illustrate what the string representation looks like.

Automatic read accessors have the same name and return type than the component:

```java
assertEquals("sober", eog.mentalState());
```
Note there is no `get*` prefix in the read accessor name, same name as the component.


# Record Restrictions

- Inheritance and Extensibility
- Immutability

A `record` is implicitly final, and cannot be abstract. You cannot enhance it later by extension.

```
Cannot inherit from final 'com.okta.developer.records.EndOfGame'
```

A `record` cannot extend any class, not even its implicit superclass `Record`. It can implement interfaces.

```
No extends clause allowed for record
```

A `record` will not have write accessors and the implicitly declared fields are final, and not modifiable via reflection. Moreover, a `record` cannot declare instance fields outside the `record` _header_. Records embody an _immutable by default_ policy, usually applied to data carrier classes. Read accessors can be declared explicitly, but should never silently alter the Record state. **Review Record semantics before making explicit declarations of automatic members.**

```
Instance field is not allowed in record
Cannot assign a value to final variable 'id'
```

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

In the compact form, the parameters are implicit, the private fields cannot be assigned inside the body and are automatically assigned **at the end**. Its purpose is to allow focusing on validation or some other value processing.



Local records



Other features
Static variables and methods






# Using Java Records for API responses

# Using Java Records in Database

Domain model

## Record Mapping

# On Java Records Serialization

# Java Records Pros and Cons

## Java Records vs POJOs

Records are immutable, POJOs are mutable in nature.


## Java Records vs Lombok

Records carry its own semantics. Immutable and final. Lombok generates code, no semantics.

# Learn More
