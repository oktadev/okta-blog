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
When defining classes for a simple aggregation of values, developers had to write constructors, accessors, `equals()`, `hashCode()` and `toString()`, an error-prone ceremony that has low value and deviates the focus from modelling immutable data. With the motivation if simplifying the writing of data carrier classes, Java Records where introduced as a first preview in JDK 14. Second preview came in JDK 15 and the finalized feature came in JDK 16.In this post let's explore Java Records features and advantages in semantics, and apply them for building a REST Api.


**Prerequisites**:

- [HTTPie](https://httpie.io/)
- [Java 14+](https://openjdk.java.net/install/index.html)
- [Okta CLI](https://cli.okta.com)

**Table of Contents**{: .hide }
* Table of Contents
{:toc}

Is a new keyword
Releases previews 1, 2 and 3


Record is final
Immutability
equals, hashcode and toString
Constructors
Static variables and methods
Local records
Other features

Example EndOfGame and unit tests




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
