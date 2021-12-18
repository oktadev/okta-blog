---
layout: blog_post
title: "A Quick Guide to Elastic Search for Spring Data and Spring Boot"
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




## Integration Options for Spring Data Elasticsarch

Options for integration, clients
The search repository



## A JHipster Spring Boot Application with Spring Data Elasticsearch

JHipster provides the Elasticsearch option to add search capabilities on top of your database. The integration is based on Spring Data Elasticsearch repositories, so let's generate a reactive Blog application to explore what the generator provides. The sample Blog application built in this tutorial is based on the JHipster sample [reactive-ms.jdl](https://github.com/jhipster/jdl-samples/blob/main/reactive-ms.jdl), with some minor tweaks:

- Maven as buildTool
- MongoDB as blog database, because the Elasticsearch integration only works with SQL databases and MongoDB
- Bootstrap pagination for the Tag and Post entities
- Okta for authentication
- Kibana for index mapping inspection

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
 Access the JHipster Registry at http://localhost:8761 and sign in with user=admin, password=admin. When you see all services up and green, go to http://localhost:8080 and sign in with your Okta account.

 {% img blog/spring-data-elasticsearch/okta-signin.png alt:"Okta Sign In Form" width:"400" %}{: .center-image }


## Inspecting Elasticsearch Index Mapping

During start up, Spring Data Elasticsarch will create the index for the entities annotated with `@Document`, deriving the mappings from the entity's annotations. But for the properties, if the field type is not specified, it defaults to FieldType.Auto. This means, that no mapping entry is written for the property and that Elasticsearch will add a mapping entry dynamically when the first data for this property is stored.

As Kibana interface was configured in Docker Compose, before creating any entities, let's inspect the index mappings that were automatically created for the `blog` microservice. Go to http://localhost:9200, the Kibana home. Then go to **Management** > **Stack Management** > **Index Management** > **Indices** tab. Besides the `user` index, an index per entity should be listed.

{% img blog/spring-data-elasticsearch/kibana-indices.png alt:"Kibana Indices" width:"800" %}{: .center-image }

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



## Key Components in JHipster with Spring Data Elasticsearch

As mentioned before, the Blog application is a reactive application, and that was defined in the JDL file with `reactive true` in the `gateway` and `blog` application config.
That also signals JHipster generators to include the reactive Elasticsearch dependencies in  the `blog` microservice.
Two of key components that enable the Elasticsearch reactive integration are the `ReactiveElasticsearchClient` and the `ReactiveElasticsearchOperations`. A client es required to connect to an Elasticsarch cluster or node, and an operations abstracts the execution of CRUD and query commands. The third component is the entity `ReactiveElasticsearchRepository`, which provide domain specific search methods. Let's briefly describe each of these components.

{% img blog/spring-data-elasticsearch/spring-data-collaboration.png alt:"Spring Data Collaboration" width:"600" %}{: .center-image }



### ReactiveElasticsearchClient

The `ReactiveElasticsearchClient` is a non official driver based on WebClient. It uses the request/response objects provided by the Elasticsearch core project. Calls are directly operated on the reactive stack, not wrapping async (thread pool bound) responses into reactive types.
In this example, the reactive client is initialized from  the `ReactiveElasticsearchRestClientProperties`, populated from `spring.data.elasticsearch.client.reactive.*` properties. You can verify the property `spring.data.elasticsearch.client.reactive.endpoints` is set for the `blog` service in the `docker-compose.yml` file.

```yml
blog:
  image: blog
  environment:
    ...
    - SPRING_DATA_ELASTICSEARCH_CLIENT_REACTIVE_ENDPOINTS=blog-elasticsearch:9200
    ...
```

### ReactiveElasticsearchOperations

`ReactiveElasticsearchOperations` is the gateway to executing high level commands against an Elasticsearch cluster using the ReactiveElasticsearchClient.
The `ReactiveElasticsearchTemplate` is the default implementation of `ReactiveElasticsearchOperations`.


The entity search repository enables the document CRUD and search operations in the application. JHipster generates a search repository for the entities specified in the `search` option in the JDL. In the example, all entities must be searchable in Elasticsarch:

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


### ReactiveElasticsearchRepository

The search repository sends commands through the `ReactiveElasticsearchTemplate` dependency.


Tracing the autoconfiguration:

`ReactiveElasticsearchRestClientAutoConfiguration` configures the `ReactiveElasticsearchClient` from the `ReactiveElasticsearchRestClientProperties`.
`ElasticsearchDataAutoConfiguration` imports the `ReactiveRestClientConfiguration`, which configures `ReactiveElasticsearchTemplate`.











The elasticsearch integration type, how the elasticsearch client looks like.

The repository and the search repository.

## Learn More about Spring Data Elasticsearch

-[Elasticsearch Mapping Multi-Fields ](https://www.elastic.co/guide/en/elasticsearch/reference/current/multi-fields.html)
