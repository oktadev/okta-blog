---
layout: blog_post
title: "How to build an API with Spring for GraphQL"
author: jimena-garbarino
by: contractor
communities: [security,java,javascript]
description: "A step by step guide for building a secured GraphQL API with Spring Boot and Auth0 authentication on React"
tags: [java, javascript]
tweets:
- ""
- ""
- ""
image:
type: awareness
---

- introduction

Following this step by step guide you can build a GraphQL API for querying a sample dataset of related companies, persons and properties, seeded to a Neo4j database.

> **This tutorial was created with the following frameworks and tools**:
> - [Node.js v18.16.1](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)
> - [npm 9.5.1](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)
> - [Java OpenJDK 17](https://jdk.java.net/java-se-ri/17)
> - [Docker 24.0.2](https://docs.docker.com/desktop/)
> - [Auth0 account](https://auth0.com/signup)
> - [Auth0 CLI 1.0.0](https://github.com/auth0/auth0-cli#installation)

{% include toc.md %}


## Build a GraphQL API with Spring for GraphQL

Create the application with Spring Initializr and HTTPie:

```shell
https start.spring.io/starter.zip \
  bootVersion==3.1.2 \
  language==java \
  packaging==jar \
  javaVersion==17 \
  type==gradle-project \
  dependencies==okta,data-neo4j,graphql,web \
  groupId==com.okta.developer \
  artifactId==spring-graphql  \
  name=="Spring Boot GraphQL API Application" \
  description=="Demo project of a Spring Boot GraphQL API" \
  packageName==com.okta.developer.demo > spring-graphql-api.zip
```

Unzip the file and start editing the project. Let's first add Neo4j migrations dependency for the seed data insertion. Edit the file `build.gradle` and add:

```text
dependencies {
  ...
  implementation 'eu.michael-simons.neo4j:neo4j-migrations-spring-boot-starter:2.4.0'
}
```


Download the seed files from the following locations:
- [CompanyDataAmericans](https://guides.neo4j.com/ukcompanies/data/CompanyDataAmericans.csv)
- [LandOwnershipAmericans](https://guides.neo4j.com/ukcompanies/data/LandOwnershipAmericans.csv)
- [PSCAmericans.csv](https://guides.neo4j.com/ukcompanies/data/PSCAmericans.csv)


Add the folder `src/main/docker` and create a file `neo4j.yml` with the following content:

```yml
# This configuration is intended for development purpose, it's **your** responsibility to harden it for production
name: companies
services:
  neo4j:
    image: neo4j:5
    volumes:
      - <csv-folder>:/var/lib/neo4j/import
    environment:
      - NEO4J_AUTH=neo4j/verysecret
      - NEO4JLABS_PLUGINS=["apoc"]
    # If you want to expose these ports outside your dev PC,
    # remove the "127.0.0.1:" prefix
    ports:
      - '127.0.0.1:7474:7474'
      - '127.0.0.1:7687:7687'
    healthcheck:
      test: ['CMD', 'wget', 'http://localhost:7474/', '-O', '-']
      interval: 5s
      timeout: 5s
      retries: 10
```
As you can see the compose file will mount `<csv-folder>` to `/var/lib/neo4j/import`, making the content accessible from the running ne44j container.
Replace `<csv-folder>` with the path to the downloaded CSVs.


- create the database yaml
- create the model
- create the controller
- unit testing
- create the migration
- graphiql


### Add resource server security

## Build a React client


### Add Auth0 Login

## Learn More
