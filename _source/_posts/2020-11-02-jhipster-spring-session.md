---
layout: blog_post
title: "Simple Session Sharing for JHipster with Spring Session"
author:
by: contractor
communities: [devops,java]
description: ""
tags: [spring-session, spring, microservices, jhipster, java, spring-boot, haproxy]
tweets:
- ""
- ""
- ""
image:
type: conversion
---


Prerequisites:
- [Java 11](https://adoptopenjdk.net/)
- [JHipster 6.10.4](https://www.jhipster.tech/installation/)
- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)
- [Okta CLI](https://github.com/okta/okta-cli)


**Table of Contents**{: .hide }
* Table of Contents
{:toc}


## Build a JHipster Microservices Architecture

Let's start by building a microservices architecture. With [JHipster Domain Languange](https://www.jhipster.tech/jdl/getting-started#deployments) you can generate the microservices from a file describing the applications and entities.
For this tutorial, you can use the JDL sample ["microservice-ecommerce-store-4-apps"](https://github.com/jhipster/jdl-samples/blob/main/microservice-ecommerce-store-4-apps.jdl) from the samples repository.

Create a folder for the project:

```shell
mkdir jhipster-session
```

Copy `microservice-ecommerce-store-4-apps.jdl` to the project folder and run the `import` command:

```shell
jhipster import-jdl microservice-ecommerce-store-4-apps.jdl
```
After the generation completes, you will see folders `invoice`,`notification`,`product` and `store`, one for each generated application.
Following, create the Docker Compose configuration for all the applications using the JHipster `docker-compose` sub-generator.
Create a folder `docker-compose` in the project root and run the sub-generator:

```shell
mkdir docker-compose
cd docker-compose
jhipster docker-compose
```

Choose the following options:
- Type of application: Microservice application
- Type of gateway: JHipster gateway
- Root directory for microservices: ../ (default)
- Choose all applications (invoice, notification, product, store) with spacebar
- Don't select any application for clustered databases
- Setup monitoring: no
- Enter admin password for JHipster registry

You will see the following WARNING:

```
WARNING! Docker Compose configuration generated, but no Jib cache found
```

It means the application images have yet to be built.
Go through each application folder and build the images with Maven:

```shell
./mvnw -ntp -Pprod verify jib:dockerBuild
```


Before running the services, configure Okta as authentication provider for the store application, which will act as a gateway to the other services and provices a simple UI to manage the entities.


## Add Okta OpenID Authentication

You can register for a free developer account with the following simple commands using the Okta CLI, in the project root folder:

```shell
okta register
```
Provide the required information. Once you register, create a client application in Okta with the following command:

```shell
okta apps create
```

You will be prompted to select the following options:
- Type of Application: **1: Web**
- Type of Application (again): **3: JHipster**

The application configuration will be generated in the file `.okta.env`.




## Configure Spring Session for Session Sharing

## Load Balancing Test with HAProxy

Load balancing in a JHipster microservices architecture is handled at the client side. The JHipster Registry is an Eureka discovery server, maintaining a dynamic list of available service instances for the service clients to do request routing and load balancing. The store service, which acts as a gateway and also as an Eureka client, requests the available instances to the JHipster registry for service routing.

As we want to test session sharing among multiple store nodes, we need load balancing for the store service as well, so let's run an HAProxy container.

## Lean More About JHipster, Okta and Spring Session
