---
layout: blog_post
title: "A Quick Guide to Elasticsearch for Spring Data and Spring Boot"
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


Elasticsearch concepts.

Introduction to Spring Data Elasticsearch.

Elasticsearch, Kibana amd JHipster logos.


**Prerequisites**:

- [HTTPie](https://httpie.io/)
- [JHipster 7]
- [Java 14+](https://openjdk.java.net/install/index.html)
- [Okta CLI](https://cli.okta.com)
- [Docker](https://docs.docker.com/engine/install/)
- [Docker Compose](https://docs.docker.com/compose/install/)

**Table of Contents**{: .hide }
* Table of Contents
{:toc}




## Elasticsearch integration options for Spring Boot


### Elasticsearch Java clients

Non spring data integrations?

Elasticsearch provides the following [clients](https://www.elastic.co/guide/en/elasticsearch/client/index.html) for Java integration:

[_Java Transport Client_](https://www.elastic.co/guide/en/elasticsearch/client/java-api/current/index.html)<br>
Deprecated in Elasticsearch 7.0.0. Provides a client object to execute all operations asynchronously, accepting a listener or returning a future.

[_Java REST Client_](https://www.elastic.co/guide/en/elasticsearch/client/java-rest/7.15/index.html)<br>
Composed by the Low Level REST Client and the High Level REST Client. The Low Level Client provides load balancing, failover, persistent connections and request/response trace logging. The High Level Client works on top of the Low Level Client and is the replacement for the `TransportClient`. It dependes on the Elasticsearch core, and provides synchronous and asynchronous APIs.

[_Java API Client_](https://www.elastic.co/guide/en/elasticsearch/client/java-api-client/current/index.html)<br>
The new client library, independent from Elasticsearch core, provides strongly typed requests and responses, blocking and asynchronous versions for all APIs, fluent builders and functional patterns, jackson and json-b support.

### Spring Data Elasticsearch


Spring Data Elasticsearch is another integration option that adds the Spring Repository abstraction as the data access layer. Operations are sent through a client connected to the Elasticsearch node. The High Level REST Client is the default client, although Elasticsearch documentation states that this client is deprecated in favor of the Java API Client since version 7.15. The Java API Client is not listed as a supported clients yet. The Java Transport Client is still supported in Spring Data, but the general recommendation is to use the High Level Client instead.

The [_Reactive Client_](https://docs.spring.io/spring-data/elasticsearch/docs/current/reference/html/#elasticsearch.clients.reactive) is a Spring Data non official driver, based on WebClient with calls operated directly on the reactive stack.

[Compatiblity matrix](https://docs.spring.io/spring-data/elasticsearch/docs/current/reference/html/#preface.versions)



## A JHipster Spring Boot Application with Spring Data Elasticsearch

JHipster provides the Elasticsearch option to add search capabilities on top of your database. The integration is based on Spring Data Elasticsearch repositories, so let's generate a reactive Blog application to explore what the generator provides. The sample Blog application built in this tutorial is based on the JHipster sample [reactive-ms.jdl](https://github.com/jhipster/jdl-samples/blob/main/reactive-ms.jdl), but adding Maven, MongoDB (Elasticsearch integration only works with SQL databases and MongoDB), - Bootstrap pagination, Okta authentication and Kibana for index mapping inspection.

Start by creating a `spring-data-elasticsearch` folder for the project, get the application JDL from the [Github](https://github.com/indiepopart/spring-data-elasticsearch.git) repository, and generate the application with JHipster:

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
 Access the JHipster Registry at http://localhost:8761 and sign in with user=admin, password=admin. When you see all services up and green, go to http://localhost:8080 and sign in with your Okta account.

 {% img blog/spring-data-elasticsearch/okta-signin.png alt:"Okta Sign In Form" width:"400" %}{: .center-image }


## Inspecting Elasticsearch Index Mapping

During start up, Spring Data Elasticsearch will create the index for the entities annotated with `@Document`, deriving the mappings from the entity's annotations. But for the properties, if the field type is not specified, it defaults to FieldType.Auto. This means, that no mapping entry is written for the property and that Elasticsearch will add a mapping entry dynamically when the first data for this property is stored.

As Kibana interface was configured in Docker Compose, before creating any entities, let's inspect the index mappings that were automatically created for the `blog` microservice. Go to http://localhost:9200, the Kibana home. Then go to **Management** > **Stack Management** > **Index Management** > **Indices** tab. Besides the `user` index, an index per entity should be listed.

{% img blog/spring-data-elasticsearch/kibana-indexes.png alt:"Kibana Indexes" width:"800" %}{: .center-image }

Choose for example the `tag` index. The **Mappings** tab before persisting any instance will look like the following:

```json
{
  "mappings": {
    "_doc": {
      "properties": {
        "_class": {
          "type": "keyword",
          "index": false,
          "doc_values": false
        }
      }
    }
  }
}
```

As you can see, properties are not mapped yet.

Go back to the application, and in the top right menu go to Entities > Tag and create some `Tag` entities. Then create some `Blog` and `Post` entities as well. As you can see, a search box is present in the entity list page. Go ahead and test the search functionality. The results page will return the matches with pagination.

{% img blog/spring-data-elasticsearch/entity-search-box.png alt:"Entity Search Box" width:"800" %}{: .center-image }


Go back to Kibana, and display the `Tag` mappings after persistence:

```json
{
  "mappings": {
    "_doc": {
      "properties": {
        "_class": {
          "type": "keyword",
          "index": false,
          "doc_values": false
        },
        "id": {
          "type": "text",
          "fields": {
            "keyword": {
              "type": "keyword",
              "ignore_above": 256
            }
          }
        },
        "name": {
          "type": "text",
          "fields": {
            "keyword": {
              "type": "keyword",
              "ignore_above": 256
            }
          }
        }
      }
    }
  }
}
```

As you can see, the `id` and `name` properties have been _dynamically mapped_ with _multi-field mapping_. For example, the `name` field is defined with type `text`, for full text searches, and it defines a `name.keyword` sub-field for aggregations and sorting:

```json
"name": {
  "type": "text",
  "fields": {
    "keyword": {
      "type": "keyword",
      "ignore_above": 256
    }
  }
}
```

It is often useful to index the same field in different ways for different purposes. Text fields are searchable by default, but by default are not available for aggregations, sorting, unless multi-field mapping is in place. There is another option for enabling sorting for text fields, which is the [`fielddata` mapping parameter](https://www.elastic.co/guide/en/elasticsearch/reference/current/text.html#fielddata-mapping-param), which will not be covered in this tutorial, as it is discouraged in the Elasticsearch documentation, because of high memory consumption.


Elasticsearch command line index API


## Key components in the Reactive Spring Data Elasticsearch

As mentioned before, the Blog application is a reactive application, and that was defined in the JDL file with `reactive true` in the `gateway` and `blog` application config.
That also signals JHipster generators to include the reactive Elasticsearch dependencies in  the `blog` microservice.
Two of key components that enable the Elasticsearch reactive integration are the `ReactiveElasticsearchClient` and the `ReactiveElasticsearchOperations`. A client es required to connect to an Elasticsearch cluster or node, and an operations abstracts the execution of CRUD and query commands. The third component is the entity `ReactiveElasticsearchRepository`, which provide domain specific search methods. Let's briefly describe each of these components.

{% img blog/spring-data-elasticsearch/spring-data-collaboration.png alt:"Spring Data Collaboration" width:"600" %}{: .center-image }



_The reactive client_<br>

The `ReactiveElasticsearchClient` is based on WebClient and calls are directly operated on the reactive stack. In this example, the reactive client is initialized from `spring.data.elasticsearch.client.reactive.*` properties. You can verify the Elasticsearch endpoints are set in the `docker-compose.yml` file for the `blog` service.

```yml
blog:
  image: blog
  environment:
    ...
    - SPRING_DATA_ELASTICSEARCH_CLIENT_REACTIVE_ENDPOINTS=blog-elasticsearch:9200
    ...
```

_The operations abstraction_<br>

`ReactiveElasticsearchOperations` is the gateway to executing high level commands against an Elasticsearch cluster using the ReactiveElasticsearchClient.
The `ReactiveElasticsearchTemplate` is the default implementation of `ReactiveElasticsearchOperations`.


The entity search repository enables the document CRUD and search operations in the application. JHipster generates a search repository for the entities specified in the `search` option in the JDL. In the example, all entities must be searchable in Elasticsearch:

```
application {
  config {
    baseName blog
    reactive true
    ...
    searchEngine elasticsearch
  }
  ...
  search * with elasticsearch
}

```


_The entity search repository_<br>

The search repository is the persistence technology-specific abstraction that exposes Elasticsearch capabilities like . Commands are sent through the `ReactiveElasticsearchTemplate`.


_Autoconfiguration_<br>

`ReactiveElasticsearchRestClientAutoConfiguration` configures the `ReactiveElasticsearchClient` from the `ReactiveElasticsearchRestClientProperties`.
`ElasticsearchDataAutoConfiguration` imports the `ReactiveRestClientConfiguration`, which configures `ReactiveElasticsearchTemplate`.














The elasticsearch integration type, how the elasticsearch client looks like.

The repository and the search repository.

## Learn more about Spring Data Elasticsearch

- [Elasticsearch Mapping Multi-Fields ](https://www.elastic.co/guide/en/elasticsearch/reference/current/multi-fields.html)
