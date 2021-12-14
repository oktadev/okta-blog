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


## A JHipster Spring Boot Application with Spring Data Elasticsearch

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


Find the `blog` credentials in the files `blog/.okta.env` and  `gateway/.okta.env`. Their content should look like the following example:

```shell
export SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_OIDC_CLIENT_SECRET={clientSecret}
export SPRING_SECURITY_OAUTH2_CLIENT_PROVIDER_OIDC_ISSUER_URI="https://{yourOktaDomain}/oauth2/default"
export SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_OIDC_CLIENT_ID={clientId}
```

The JHipster Registry is a also a Spring Cloud Config server, and by default it is configured with the profiles `dev` and `native`, which means the configuration will be provided from the location `docker-compose/central-server/config`. Let's add some files so it can provide the OAuth2 configuration to the microservices.
Add the file `docker-compose/central-server-config/blog-prod.yml` with the following content:

```yml
spring:
  security:
    oauth2:
      client:
        provider:
          oidc:
            issuer-uri: https://{yourOktaDomain}/oauth2/default
        registration:
          oidc:
            client-id: {blogClientId}
            client-secret: {blogClientSecret}
```

Add also the file `docker-compose/central-server-config/gateway-prod.yml` with the following content:

```yml
spring:
  security:
    oauth2:
      client:
        provider:
          oidc:
            issuer-uri: https://{yourOktaDomain}/oauth2/default
        registration:
          oidc:
            client-id: {gatewayClientId}
            client-secret: {gatewayClientSecret}
```


For the experimentation in this tutorial, it will be very useful to configure the Kibana interface for Elasticsearch, which will allow visualizations of the Elasticsearch data.
Edit `docker-compose/docker-compose.yml` and add the Kibana service like this:

```yml
services:
  blog-kibana:
     image: docker.elastic.co/kibana/kibana:7.13.3
     ports:
       - 5601:5601
     environment:
       ELASTICSEARCH_URL: http://blog-elasticsearch:9200
       ELASTICSEARCH_HOSTS: '["http://blog-elasticsearch:9200"]'
```

Create the applications container image:

```shell
cd blog
./mvnw -DskipTests -ntp -Pprod verify jib:dockerBuild
```

```shell
cd gateway
./mvnw -DskipTests -ntp -Pprod verify jib:dockerBuild
```

Run the architecture with Docker Compose:

```shell
cd docker-compose
docker compose up
```
 Access the JHipster Registry at http://localhost:8761 and sign in with user=admin, password=admin.

{% img blog/spring-data-elasticsearch/jhipster-registry.png alt:"JHipster Registry" width:"600" %}{: .center-image }

 When you see all services up and green, go to http://localhost:8080 and sign in with your Okta account.

 {% img blog/spring-data-elasticsearch/okta-signin.png alt:"Okta Sign In Form" width:"300" %}{: .center-image }


 ## Inspecting Elasticsearch Index Mapping

During sart up, Spring Data Elasticsarch will create the index for the entities annotated with `@Document`, deriving the mappings from the entity's annotation. As Kibana interface was configured in Docker Compose, before creating any entities, let's inspect the index mapping that were automatically created for the `blog` microservice.






Go back to the application, and in the top right menu go to Entities > Tag and create some `Tag` entities. Then create some `Blog` and `Post` entities as well. As you can see, a saerch box is present in the entity list page. Go ahead and test the search functionality. The results page will return the matches with pagination.

{% img blog/spring-data-elasticsearch/entity-search-box.png alt:"Entity Search Box" width:"800" %}{: .center-image }



## Key Components in JHipster with Spring Data Elasticsarch

The repository and the search repository.
