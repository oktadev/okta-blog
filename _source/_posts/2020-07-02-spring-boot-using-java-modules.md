---
layout: blog_post
title: "Build a Spring Boot application using Java 9+ modules"
author: bruno-leite
by: contractor
communities: [java]
description: "This tutorial shows how to create a multi-module Spring Boot application using Java 9+ modular system"
tags: [spring-boot, java, modules]
tweets:
- "Learn how to create a @springboot application using Java 9+ modular system"
- "Tutorial: Java 9+ modules with @springboot"
- "Spring Boot + Java Modules? Check it out"
image:
type: conversion
---

**Table of Contents**{: .hide }
* Table of Contents
{:toc}

## Introduction

Java is one of the most mature and persistent development languages that exist. Recently it entered into a 6-month release schedule which enabled to deliver more frequent updates to the language.
One of that changes was the modular system that is available since Java 9.

The Modular system came to address a recurring concern on Java apps: 'how to hide classes from libraries that are not meant to be used outside or just by specific applications?'
We know that we have the visibility modifiers: public, private, protected and default, but those are not enough to provide external visibility. It is common for a class to live inside a package and be used throughout the library but it may be a class not meant for external use. Therefore it has public visibility but on the other side it shouldn't be available for applications depending on that library. This is the situation in which the Modular System can help.

On Java 8 and backwards the JDK was a single unit and it was needed to install it entirely even if you were just using a couple JDK classes. So starting on Java 9 there was a huge change on JDK classes so that the entire JDK was modularized. Various modules were created to organize the contents of the JDK, some examples are `java.base`, `java.sql`, `java.xml` and so on. To have an idea there are a total of 60 modules in Java 14 JDK.

`java.base` has the fundamental classes like `Object`, `String`, `Integer`, `Double`, etc

`java.sql` has classes related to accessing the JDBC API like `ResultSet` , `Connection` and others

`java.xml` has classes related to XML manipulation like `XMLStreamReader`, `XMLStreamWriter` and others 

The modularization also enabled the possibility of reducing the Java runtime to include, let's say, just the `java.base` if your application depends just on this module. By using the `jlink` tool, that is bundled with the JDK, you can create a micro runtime  with just the JDK modules you need.

In this article we'll be covering how to develop a simple application with two modules: the `application` module that contains the web-facing classes and the `persistence` module that contains data access layer.

To go through this article you should have at least some basic understanding of Spring Boot, Maven, REST webservices principles and Docker installed.

## Install a Java 9+ JDK

First you'll need a Java 9+ JDK to use modules. If you have been using Java 8 then you'll probably have to download a separate JDK with version of 9 or later to be used on this tutorial.
Make sure that your JAVA_HOME environment variable is poiting to that JDK.

## Project structure

### How to structure a modular project with Maven?

Let's create this project folder structure manually to better understand how it should be structured. Each module will live inside a separate directory and have it's own `pom.xml` file. There will also be a `pom.xml` on project root that will serve as the parent pom for the modules.  You can create the following folder structure:

```
.
├── application
│   ├── pom.xml
│   └── src
│       ├── main
│       │   ├── java
│       │   └── resources
│       └── test
│           ├── java
│           └── resources
├── persistence
│   ├── pom.xml
│   └── src
│       ├── main
│       │   ├── java
│       │   └── resources
│       └── test
│           ├── java
│           └── resources
├── pom.xml
```

### How to tie up the three pom.xml files on Maven?

First, let's define the root pom.xml. It will contain the common <parent> indication to `spring-boot-started-parent` and also two entries on <module> section, that are the name of the directories for the modules we are developing. Please note that those are specific to Maven and have nothing to do with the Java modules that we'll be working later on.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-parent</artifactId>
        <version>2.3.1.RELEASE</version>
        <relativePath/> <!-- lookup parent from repository -->
    </parent>
    <groupId>com.okta.developer</groupId>
    <artifactId>spring-boot-with-modules</artifactId>
    <version>0.0.1-SNAPSHOT</version>
    <packaging>pom</packaging>

    <properties>
    	<java.version>9</java.version>
    </properties>

    <modules>
        <module>application</module>
        <module>persistence</module>
    </modules>

</project>
```

The `application` module will have a pom.xml like below, pointing to the parent pom.xml that was described above. It will also have a dependency on `spring-boot-starter-web` because we'll be creating some REST endpoints on it and also a dependency on our 'persistence' module that will be described next.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>com.okta.developer</groupId>
        <artifactId>spring-boot-with-modules</artifactId>
        <version>0.0.1-SNAPSHOT</version>
        <relativePath/> <!-- lookup parent from repository -->
    </parent>
    <artifactId>spring-boot-with-modules-app</artifactId>
    <version>0.0.1-SNAPSHOT</version>

    <dependencies>
    	<dependency>
    		<groupId>org.springframework.boot</groupId>
    		<artifactId>spring-boot-starter-web</artifactId>
    	</dependency>
    	<dependency>
    		<groupId>com.okta</groupId>
    		<artifactId>spring-boot-with-modules-persistence</artifactId>
    	</dependency>
    </dependencies>

</project>
```

At last we have the `persistence` module which will have a pom.xml like the one below, also pointing to the parent pom.xml that was first defined. This one will have a dependency on `spring-data-mongo` as we'll be saving our data to a Mongo DB.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <parent>
        <groupId>ocom.okta.developer</groupId>
        <artifactId>spring-boot-with-modules</artifactId>
        <version>0.0.1-SNAPSHOT</version>
        <relativePath/> <!-- lookup parent from repository -->
    </parent>
    <artifactId>spring-boot-with-modules-persistence</artifactId>
    <version>0.0.1-SNAPSHOT</version>

    <dependencies>
    	<dependency>
    		<groupId>org.springframework.boot</groupId>
    		<artifactId>spring-boot-data-mongo</artifactId>
    	</dependency>
    </dependencies>

</project>
```

This project structure should be compiling fine if you go to the project root and execute `mvn verify`. Please note that Maven uses the JDK defined by the environment variable JAVA_HOME. So please use JAVA_HOME poiting to a Java 9+ JDK.

Please don't confuse Maven modules with Java Modules. Maven modules are just a separation into sub-projects. 

## Writing initial application without Java modules

Let's write some classes without using the Java modules so we can afterwards include the module definitions and see the differences. 
What defines that an application is using Java modules is the presence of `module-info.java` on its source root. We'll be creating this later on.

### Persistence module

Create a class `Bird` on the Persistence module for representing the entity that we'll be saving to DB. 
This class will be stored on `persistence/src/main/java/com/okta/developer/animals/bird/Bird.java`

```java
package com.okta.developer.animals.bird;

import org.springframework.data.annotation.Id;

public class Bird {

    @Id
    private String id;

    private String specie;
    private String size;

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getSpecie() {
        return specie;
    }

    public void setSpecie(String specie) {
        this.specie = specie;
    }

    public String getSize() {
        return size;
    }

    public void setSize(String size) {
        this.size = size;
    }
}

```

Now we need to create a repository to save this entity to DB. `Spring Data MongoDB` does that for us automatically creating the CRUD operations so we just have to create an interface extending MongoRepository.
This class will be stored on `persistence/src/main/java/com/okta/developer/animals/bird/BirdRepository.java`
```java
package com.okta.developer.animals.bird;

import org.springframework.data.mongodb.repository.MongoRepository;

public interface BirdRepository extends MongoRepository<Bird, String> {
}
```

At last for the persistence module we need to create a class in a separate package to externalize entity operations (this will be needed later when we add Java modules)
This class will be stored on `persistence/src/main/java/com/okta/developer/animals/service/BirdPersistence.java`

```java
package com.okta.developer.animals.service;

import com.okta.developer.animals.bird.Bird;
import com.okta.developer.animals.bird.BirdRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class BirdPersistence {

    private BirdRepository birdRepository;

    @Autowired
    public BirdPersistence(BirdRepository birdRepository) {
        this.birdRepository = birdRepository;
    }

    public void save(Bird bird) {
        birdRepository.save(bird);
    }

    public List<Bird> get() {
        return birdRepository.findAll();
    }

}

```


### Application module

Now on the application module create the main application class annotated with @SpringBootApplication.
This class will be stored on `application/src/main/java/com/okta/developer/SpringBootModulesApplication.java`

```java
package com.okta.developer;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class SpringBootModulesApplication {

    public static void main(String[] args) {
        SpringApplication.run(SpringBootModulesApplication.class, args);
    }
}

```

And now a controller to expose REST operations on the Bird classes
This class will be stored on `application/src/main/java/com/okta/developer/BirdController.java`

```java
package com.okta.developer;

import com.okta.developer.animals.bird.Bird;
import com.okta.developer.animals.service.BirdPersistence;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class BirdController {

    private BirdPersistence birdPersistence;

    public BirdController(BirdPersistence birdPersistence) {
        this.birdPersistence = birdPersistence;
    }

    @GetMapping("bird")
    public List<Bird> getBird() {
        return birdPersistence.get();
    }

    @PostMapping("bird")
    public void saveBird(@RequestBody Bird bird) {
        birdPersistence.save(bird);
    }

}

```




