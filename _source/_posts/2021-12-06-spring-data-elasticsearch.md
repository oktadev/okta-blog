---
layout: blog_post
title: ""
author: jimena-garbarino
by: contractor
communities: [devops,security,mobile,.net,java,javascript,go,php,python,ruby]
description: ""
tags: []
tweets:
- ""
- ""
- ""
image:
type: conversion
---

**Prerequisites**:

- [HTTPie](https://httpie.io/)
- [JHipster 7]
- [Java 14+](https://openjdk.java.net/install/index.html)
- [Okta CLI](https://cli.okta.com)
- [Docker](https://docs.docker.com/engine/install/)
- [Docker Compose](https://docs.docker.com/compose/install/)


## A JHipster Spring Boot Application with Elasticsearch

JHipster provides the Elasticsearch option to add search capabilities on top of your database. The integration is based on Spring Data Elasticsearch repositories, so let's generate a Blog application to explore what the generator provides. The sample Blog application built in this tutorial is based on the JHipster sample [reactive-ms.jdl](https://github.com/jhipster/jdl-samples/blob/main/reactive-ms.jdl), with some minor tweaks:

- Maven as buildTool
- MongoDB as blog database, because the Elasticsearch integration only works with SQL databases and MongoDB
- Bootstrap pagination for the Tag and Post entities
- Okta for authentication
- Kibana for index mapping explorations

Create a `blog` folder for the project, get the application JDL from the [Github](https://github.com/indiepopart/spring-data-elasticsearch.git) repository,  and generate the application with JHipster:

```shell
mkdir spring-data-elasticsearch
cd spring-data-elasticsearch
https https://github.com/indiepopart/spring-data-elasticsearch/blob/c8c780d9166bfca5a8f7d0f8672bca22bdc307a7/blog-reactive-ms.jdl
jhipster jdl blog-reactive-ms.jdl
```

{% include setup/cli.md type="jhipster" %}

Follow the process above for creating 2 applications in Okta, the gateway application and the blog application.

```shell
cd gateway
okta apps create jhipster
```

Make sure to setup http://localhost:8081/login/oauth2/code/oidc with port 8081 as Redirect URI for blog microservice.

```shell
cd blog
okta apps create jhipster
```

Modify the Docker Compose file, to configure Okta as the OIDC provider for the `gateway` and `blog` service:

```yml
services:
  gateway:
    image: gateway
    environment:
      ...
      - SPRING_SECURITY_OAUTH2_CLIENT_PROVIDER_OIDC_ISSUER_URI=${OKTA_ISSUER}
      - SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_OIDC_CLIENT_ID=${GATEWAY_CLIENT_ID}
      - SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_OIDC_CLIENT_SECRET=${GATEWAY_CLIENT_SECRET}
      ...
  blog:
    image: blog
    environment:
      ...
      - SPRING_SECURITY_OAUTH2_CLIENT_PROVIDER_OIDC_ISSUER_URI==${OKTA_ISSUER}
      - SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_OIDC_CLIENT_ID=${BLOG_CLIENT_ID}l
      - SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_OIDC_CLIENT_SECRET=${BLOG_CLIENT_SECRET}l
      ...
```
