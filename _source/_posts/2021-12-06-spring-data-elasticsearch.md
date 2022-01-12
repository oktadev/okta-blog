---
layout: blog_post
title: "A Quick Guide to Elasticsearch with Spring Data and Spring Boot"
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
type: conversion
---

For sure you have heard about Elasticsearch or the Elastic Stack. It seems it started as a search engine based on Lucene (an open-source search engine library) built by Shay Banon to index his wife's cooking recipes. From the early days, Elasticsearch has gone a long way and evolved into the Elastic Stack, a great suite for taking data from any source, search, analyze and visualize it in near real-time. So Elasticsearch is a distributed document store, data is serialized as JSON documents and stored distributed across cluster nodes. The _inverted index_ is a data structure that lists every unique word that appears in any document, and also the documents each word appears in. This gives support to fast full-text searches, a feature not supported or partially supported by database engines. The index is a collection of documents and each document is a collection of fields. In turn, each field can be indexed in an optimal data structure, for example, an inverted index for text fields, but a BKD tree for a numeric field.

How can be Elasticsearch integrated into a Spring Boot Application? What are the options for adding Elasticsearch to a Java application? This post will give you a quick introduction to Elasticsearch integration options.

**Prerequisites**:

- [HTTPie](https://httpie.io/)
- [JHipster 7](https://www.jhipster.tech/installation/)
- [Java 14+](https://openjdk.java.net/install/index.html)
- [Okta CLI](https://cli.okta.com)
- [Docker](https://docs.docker.com/engine/install/)
- [Docker Compose](https://docs.docker.com/compose/install/)

**Table of Contents**{: .hide }
* Table of Contents
{:toc}

## Elasticsearch integration options for Spring Boot

For Java applications including Spring Boot applications, Elasticsearch provides the following [clients](https://www.elastic.co/guide/en/elasticsearch/client/index.html) for integration:

[_Java Transport Client_](https://www.elastic.co/guide/en/elasticsearch/client/java-api/current/index.html)<br>
Deprecated in Elasticsearch 7.0.0. Provides a client object to execute all operations asynchronously, accepting a listener or returning a future.

[_Java REST Client_](https://www.elastic.co/guide/en/elasticsearch/client/java-rest/7.15/index.html)<br>
Composed by the Low Level REST Client and the High Level REST Client. The Low Level Client provides load balancing, failover, persistent connections, and request/response trace logging. The High Level Client works on top of the Low Level Client and is the replacement for the `TransportClient`. It depends on the Elasticsearch core and provides synchronous and asynchronous APIs.

[_Java API Client_](https://www.elastic.co/guide/en/elasticsearch/client/java-api-client/current/index.html)<br>
The new client library, independent from Elasticsearch core, provides strongly typed requests and responses, blocking and asynchronous versions for all APIs, fluent builders and functional patterns, jackson and JSON-b support.

## Hello Spring Data Elasticsearch!

Spring Data Elasticsearch is another integration option that adds the Spring Repository abstraction as the data access layer. Operations are sent through a client connected to the Elasticsearch node. With Spring Data, the High Level REST Client is the default client, although Elasticsearch documentation states that this client is deprecated in favor of the Java API Client since version 7.15. The Java API Client is not listed as a supported client yet. The Java Transport Client is still supported in Spring Data, but the general recommendation is to use the High Level Client. Instead of calling the Elasticsearch APIs directly, the repository and rest template abstractions provide a simplified interface for document operations, encapsulating API request/response processing, and exposing a query interface that has multiple implementations for different levels of query complexity. Through the starter dependency, it can also handle client autoconfiguration and automatic document index mapping for simple use cases.

Besides the High Level REST Client support, Spring Data provides the [_Reactive Client_](https://docs.spring.io/spring-data/elasticsearch/docs/current/reference/html/#elasticsearch.clients.reactive), a non-official driver based on WebClient, with calls operated directly on the reactive stack. The Reactive Client also depends on the Elasticsearch core as it is designed for handling Elasicsearch request/response types.

## Build an application with Spring Data Elasticsearch

JHipster provides the Elasticsearch option to add search capabilities on top of your database. The integration is based on Spring Data Elasticsearch repositories, so let's generate a reactive Blog application to explore what the generator provides. The Blog application built in this tutorial is based on the JHipster sample [reactive-ms.jdl](https://github.com/jhipster/jdl-samples/blob/main/reactive-ms.jdl), but adding Maven, MongoDB (Elasticsearch integration only works with SQL databases and MongoDB), Bootstrap pagination, Okta authentication, and Kibana for index mapping inspection.

Start by creating a `spring-data-elasticsearch` folder for the project, fetch the application JDL from the [GitHub repository](https://github.com/oktadev/okta-spring-data-elasticsearch-example), and generate the application with JHipster:

```shell
mkdir spring-data-elasticsearch
cd spring-data-elasticsearch
https -d https://raw.githubusercontent.com/indiepopart/spring-data-elasticsearch/5380a940a0364176a5d56349d3471f60a0834ed7/blog-reactive-ms.jdl
jhipster jdl blog-reactive-ms.jdl
```

{% include setup/cli.md type="jhipster" %}

Follow the process above for creating 2 applications in Okta, the gateway application, and the blog application.

```shell
cd gateway
okta apps create jhipster
```

Make sure to set up http://localhost:8081/login/oauth2/code/oidc with port 8081 as Redirect URI for blog microservice.

```shell
cd blog
okta apps create jhipster
```

Find the `blog` credentials in the files `blog/.okta.env` and  `gateway/.okta.env`.

The JHipster Registry is also a Spring Cloud Config server, and by default, it is configured with the profiles `dev` and `native`, which means the configuration will be provided from the location `docker-compose/central-server/config`. Let's add some files so it can provide the OAuth2 configuration to the microservices.
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

For the experimentation in this tutorial, configure the Kibana interface for Elasticsearch, which will allow visualizations of the Elasticsearch data.
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

Also add the following additional configuration to the elasticsearch service, to expose the ports to the local host for sending APIs requests:

```yml
services:
  blog-elasticsearch:
    ...
    ports:
      - 9200:9200
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

## Inspecting Elasticsearch index mapping

During start-up, Spring Data Elasticsearch will create the index for the entities annotated with `@Document`, deriving the mappings from the entity's annotations. But for the properties, if the field type is not specified, it defaults to FieldType.Auto. This means, that no mapping entry is written for the property and that Elasticsearch will add a mapping entry dynamically when the first data for this property is stored.

As Kibana interface was configured in Docker Compose, before creating any entities, let's inspect the index mappings that were automatically created for the `blog` microservice. Go to `http://localhost:9200`, the Kibana dashboard. Then go to **Management** > **Stack Management** > **Index Management** > **Indices** tab. Besides the `user` index, an index per entity should be listed.

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

Go back to the application, and in the top-right menu go to Entities > Tag and create some `Tag` entities. Then create some `Blog` and `Post` entities as well. As you can see, a search box is present on the entity list page. Go ahead and test the search functionality. The results page will return the matches with pagination.

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

Now the `id` and `name` properties have been _dynamically mapped_ with _multi-field mapping_. For example, the `name` field is defined with type `text`, for full-text searches, and it defines a `name.keyword` sub-field for aggregations and sorting:

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


Elasticsearch exposes several APIs, and the Index APIs allow managing individual indices, index settings, aliases, mappings, and index templates. Although Kibana is a user-friendly front-end, you can also query the index mappings through the Index APIs, with an HTTPie command like the following:

```shell
http :9200/tag/_mapping
```

The output should look the same as the mapping visualized in Kibana.

## Key components in reactive Spring Data Elasticsearch

As mentioned before, the `blog` application is reactive, and that's because the JDL file had `reactive true` in its `gateway` and `blog` application configurations. 

This config also tels JHipster to include the Elasticsearch dependencies in the `blog` microservice. JHipster generates the web layer with the entity resource class, and it optionally generates the service class too. Two of the key components that enable the Elasticsearch reactive integration are the `ReactiveElasticsearchClient` and the `ReactiveElasticsearchOperations`. A client is required to connect to an Elasticsearch cluster or node, and `*Operations` is the interface for the execution of CRUD and query commands. The third component is the entity `ReactiveElasticsearchRepository`, which can provide domain-specific search methods. Let's briefly describe each of these components.

{% img blog/spring-data-elasticsearch/spring-data-collaboration.png alt:"Spring Data Collaboration" width:"600" %}{: .center-image }

_The reactive client_<br>

The `ReactiveElasticsearchClient` is based on Spring's WebClient and calls are directly operated on the reactive stack. The reactive client sends and receives high-level request and response objects. In this example, the reactive client is initialized from `spring.data.elasticsearch.client.reactive.*` properties. You can verify the Elasticsearch endpoints are set in the `docker-compose.yml` file for the `blog` service.

```yml
blog:
  image: blog
  environment:
    ...
    - SPRING_DATA_ELASTICSEARCH_CLIENT_REACTIVE_ENDPOINTS=blog-elasticsearch:9200
    ...
```

_The operations abstraction_<br>

`ReactiveElasticsearchOperations` is the gateway for executing high-level commands against an Elasticsearch cluster using the `ReactiveElasticsearchClient`.
The `ReactiveElasticsearchTemplate` is the default implementation of `ReactiveElasticsearchOperations`. Some high-level operations are `save`, `get`, `delete` and `search`, which accept the Spring Data Query types as parameters.

_The entity search repository_<br>

The entity search repository enables the document CRUD and search operations in the application. The search repository extends `ReactiveElasticsearchRepository`, the persistence technology-specific abstraction, that builds on the core repository support utilizing operations provided through the `ReactiveElasticsearchTemplate` executed by the `ReactiveElasticsearchClient`. JHipster generates a search repository for the entities specified in the `search` option in the JDL. In the example, all entities are set to be searchable in Elasticsearch:

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

When the entity in the JDL definition requires the Elasticsearch engine, and also pagination, the entity search repository is generated with pagination and sorting options. For example, the generated TagSearchRepository adds a custom `search` method that assembles a native search query and passes it to the `ReactiveElasticsearchTemplate`:

```java
public interface TagSearchRepository extends ReactiveElasticsearchRepository<Tag, String>, TagSearchRepositoryInternal {}

interface TagSearchRepositoryInternal {
    Flux<Tag> search(String query, Pageable pageable);
}

class TagSearchRepositoryInternalImpl implements TagSearchRepositoryInternal {

    private final ReactiveElasticsearchTemplate reactiveElasticsearchTemplate;

    TagSearchRepositoryInternalImpl(ReactiveElasticsearchTemplate reactiveElasticsearchTemplate) {
        this.reactiveElasticsearchTemplate = reactiveElasticsearchTemplate;
    }

    @Override
    public Flux<Tag> search(String query, Pageable pageable) {
        List<FieldSortBuilder> builders = new SortToFieldSortBuilderConverter().convert(pageable.getSort());

        NativeSearchQueryBuilder queryBuilder = new NativeSearchQueryBuilder()
            .withQuery(queryStringQuery(query))
            .withPageable(PageRequest.of(pageable.getPageNumber(), pageable.getPageSize()));

        builders
            .stream()
            .forEach(builder -> {
                queryBuilder.withSort(builder);
            });

        NativeSearchQuery nativeSearchQuery = queryBuilder.build();
        return reactiveElasticsearchTemplate.search(nativeSearchQuery, Tag.class).map(SearchHit::getContent);
    }
}
```

_Autoconfiguration_<br>

`ReactiveElasticsearchRestClientAutoConfiguration` configures the reactive Elasticsearch client from the Spring Data Elasticsearch properties. `ElasticsearchDataAutoConfiguration` is the root configuration class that triggers the reactive search template initialization.

## Learn more about Elastic and JHipster

JHipster helps to simplify the setup of Spring Boot applications or microservices with search capabilities. I hope you enjoyed this quick introduction to Elasticsearh integration options, and could taste the advantages of the Spring Data repository abstraction for encapsulating some basic Elasticsearch operations. Remember to check the [compatiblity matrix](https://docs.spring.io/spring-data/elasticsearch/docs/current/reference/html/#preface.versions) to match the right Spring Data Elasticsearch dependency for your Elasticsearch version. Keep learning, and for more examples and recipes on Elasticsearch and Okta integrations for Spring Boot, check out the following links:

- [Elasticsearch Clients](https://www.elastic.co/guide/en/elasticsearch/client/index.html)
- [Elasticsearch Mapping Multi-Fields](https://www.elastic.co/guide/en/elasticsearch/reference/current/multi-fields.html)
- [Get Started with the ELK Stack](/blog/2019/09/26/get-started-elk-stack)
- [Spring Boot and Okta in 2 Minutes](/blog/2020/11/24/spring-boot-okta)
- [Reactive Java Microservices with Spring Boot and JHipster](/blog/2021/01/20/reactive-java-microservices)
- [Elasticsearch REST APIs](https://www.elastic.co/guide/en/elasticsearch/reference/current/rest-apis.html)

You can find the Blog application code of this tutorial in [GitHub](https://github.com/indiepopart/spring-data-elasticsearch).
