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

In a previous [post](https://developer.okta.com/blog/2020/10/02/spring-session-mysql), concepts like _session persistence_ and _session sharing_ were explored with a simple multi-node Spring Boot application. In today's tutorial, you will learn a similar approach for session sharing in a JHipster microservice architecture. With the help of Spring Session, Redis as the session store, and HAProxy as load balancer for the gateway, the session can be shared among mulple gateway nodes, ands is preserved when a node failure happens.

**Prerequisites**:
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

You can register for a free developer account with the following simple commands using the [Okta CLI](https://github.com/okta/okta-cli), in the project root folder:

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

The application configuration will be generated in the file `.okta.env` and it will look like this:
```shell
export SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_OIDC_CLIENT_SECRET="{clientSecret}"
export SPRING_SECURITY_OAUTH2_CLIENT_PROVIDER_OIDC_ISSUER_URI="{yourOrgUrl}/oauth2/default"
export SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_OIDC_CLIENT_ID="{clientId}"
```

Edit the file `docker-compose\docker-compose.yml` and update oauth2 client properties for the services `invoice`, `notification`, `product` and `store` with the following values:

```yaml
- SPRING_SECURITY_OAUTH2_CLIENT_PROVIDER_OIDC_ISSUER_URI=${OKTA_OAUTH2_ISSUER}
- SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_OIDC_CLIENT_ID=${OKTA_OAUTH2_CLIENT_ID}
- SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_OIDC_CLIENT_SECRET=${OKTA_OAUTH2_CLIENT_SECRET}
```

Create a file `docker-compose\.env` and set the value of the `OKTA_OAUTH_*` environment variables for Docker Compose, copy the values from `.okta.env`:

```shell
OKTA_OAUTH2_ISSUER={yourOrgUrl}/oauth2/default
OKTA_OAUTH2_CLIENT_ID={clientId}
OKTA_OAUTH2_CLIENT_SECRET={clientSecret}
```
Before running the services, the JHipster services require to assign roles to the Okta user, to be able to create and modify entities.

Sin in to Okta at https://www.okta.com/login/ with your user account. Then, in the top menu, go to **Users**/**Groups** and create groups `ROLE_USER` and `ROLE_ADMIN`. The assign a user to those groups.

Now, in the top menu, choose **API**/**Authorization Servers**. Edit the **default** authorization server. Go to **Claims** and **Add Claim**. Assign the following configuration:

- Name: groups
- Include in token type: ID Token, Always
- Value type: Groups
- Filter: Matches regex, .*
- Include in: Any scope


Run the services with Docker Compose:

```shell
cd docker-compose
docker-compose up
```

The JHipster registry will log the following message once it is ready:
```
jhipster-registry_1     | 2020-11-09 16:03:47.233  INFO 6 --- [           main] i.g.j.registry.JHipsterRegistryApp       :
jhipster-registry_1     | ----------------------------------------------------------
jhipster-registry_1     | 	Application 'jhipster-registry' is running! Access URLs:
jhipster-registry_1     | 	Local: 		http://localhost:8761/
jhipster-registry_1     | 	External: 	http://172.18.0.2:8761/
jhipster-registry_1     | 	Profile(s): 	[composite, dev, swagger, oauth2]
jhipster-registry_1     | ----------------------------------------------------------
jhipster-registry_1     | 2020-11-09 16:03:47.234  INFO 6 --- [           main] i.g.j.registry.JHipsterRegistryApp       :
jhipster-registry_1     | ----------------------------------------------------------
jhipster-registry_1     | 	Config Server: 	Connected to the JHipster Registry running in Docker
jhipster-registry_1     | ----------------------------------------------------------
```

You can sing in to http://localhost:8761/ with the JHipster admin user and password, to check if all services are up:

{% img blog/jhipster-spring-session/jhipster-up.png alt:"JHipster dashboard" width:"600" %}{: .center-image }

Once all services are up, access the store at http://localhost:8080 and sing in with the Okta user:

{% img blog/spring-session/okta-login.png alt:"Okta sign in form" width:"300" %}{: .center-image }


## Configure Spring Session for Session Sharing

The `store` application maintains a user session in memory, identified with a sessionId that is sent in a cookie to the client. If the store instance crashes, the session is lost. One way to avoid losing the session, is adding Spring Session with Redis for the session storage and sharing among `store` nodes.

Before making the modifications to the `store` application, stop all services with CTRL+C and remove the containers:

```shell
cd docker-compose
docker-compose down
```

Delete the store image:
```
docker rmi store
```

Edit the `store/pom.xml` and add the spring-session dependency:
```xml
<dependency>
    <groupId>org.springframework.session</groupId>
    <artifactId>spring-session-data-redis</artifactId>
</dependency>
<dependency>
    <groupId>io.lettuce</groupId>
    <artifactId>lettuce-core</artifactId>
    <version>6.0.0.RELEASE</version>
</dependency>
```

Enable the `session.store-type=redis` for the `dev` and `prod` profiles, adding the following configuration to `store/src/main/resources/config/application-dev.yml` and `store/src/main/resources/config/application-prod.yml`:

```yml
spring:
  session:
    store-type: redis
```

For this example, disable the redis store in the test configuration, so the existing tests don't require a redis instance. Edit `src/test/resources/config/application.yml` and add the following:

```yml
spring:
  session:
    store-type: none
  autoconfigure:
    exclude:
      - org.springframework.boot.autoconfigure.data.redis.RedisAutoConfiguration
```
Rebuild the `store` application image:

```shell
cd store
./mvnw -ntp -Pprod verify jib:dockerBuild
```

Edit `docker-compose/docker-compose.yml` to set the redis configuration. Under the `store` service entry, add the following variables to the environment:
```yml
- LOGGING_LEVEL_COM_JHIPSTER_DEMO_STORE=TRACE
- SPRING_REDIS_HOST=store-redis
- SPRING_REDIS_PASSWORD=password
- SPRING_REDIS_PORT=6379      
```

Add the `redis` instance as a new service:
```yml
store-redis:
  image: 'redis:6.0.8'
  command: redis-server --requirepass password
  ports:
    - '6379:6379'
```

Run the service again with docker-compose:
```shell
cd docker-compose
docker-compose up
```

Once all services are up, sing in to the `store` application with your Okta user. Then, check Redis has stored new session keys:

```shell
docker exec docker-compose_store-redis_1 redis-cli -a password KEYS \*
```

The output should look like this:
```
spring:session:sessions:21eb225f-f92e-4a9b-937b-28162fd14c20
spring:session:index:org.springframework.session.FindByIndexNameSessionRepository.PRINCIPAL_NAME_INDEX_NAME:00u1h70sf0trRsbLS357
spring:session:sessions:expires:21eb225f-f92e-4a9b-937b-28162fd14c20
spring:session:expirations:1604972940000
```

## Spring Session Test with HAProxy Loadbalancing

Load balancing in a JHipster microservices architecture is handled at the client side. The JHipster Registry is an Eureka discovery server, maintaining a dynamic list of available service instances, for the service clients to do request routing and load balancing. The store service, which acts as a gateway and also as an Eureka client, requests the available instances to the JHipster registry for service routing.

As we want to test session sharing among multiple `store` nodes, we need load balancing for the `store` service as well. Let's run an HAProxy container and two instances of the `store` service for the test.

Stop all services and remove the containers before starting the modifications below.

First, extract the docker-compose `store` base configuration to its own `docker-compose/store.yml` file:

```yml
version: '2'
services:
  store:
    image: store
    environment:
      - _JAVA_OPTIONS=-Xmx512m -Xms256m
      - 'SPRING_PROFILES_ACTIVE=prod,swagger'
      - MANAGEMENT_METRICS_EXPORT_PROMETHEUS_ENABLED=true
      - 'EUREKA_CLIENT_SERVICE_URL_DEFAULTZONE=http://admin:$${jhipster.registry.password}@jhipster-registry:8761/eureka'
      - 'SPRING_CLOUD_CONFIG_URI=http://admin:$${jhipster.registry.password}@jhipster-registry:8761/config'
      - 'SPRING_DATASOURCE_URL=jdbc:mysql://store-mysql:3306/store?useUnicode=true&characterEncoding=utf8&useSSL=false&useLegacyDatetimeCode=false&serverTimezone=UTC&createDatabaseIfNotExist=true'
      - SPRING_SECURITY_OAUTH2_CLIENT_PROVIDER_OIDC_ISSUER_URI=${OKTA_OAUTH2_ISSUER}
      - SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_OIDC_CLIENT_ID=${OKTA_OAUTH2_CLIENT_ID}
      - SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_OIDC_CLIENT_SECRET=${OKTA_OAUTH2_CLIENT_SECRET}
      - JHIPSTER_SLEEP=30
      - JHIPSTER_REGISTRY_PASSWORD=admin
      - LOGGING_LEVEL_COM_JHIPSTER_DEMO_STORE=TRACE
      - SPRING_REDIS_HOST=store-redis
      - SPRING_REDIS_PASSWORD=password
      - SPRING_REDIS_PORT=6379
```
Then, edit `docker-compose\docker-compose.yml` and remove the `store` service. Instead create `store1` and `store2` services, extending the base configuration. Add the HAProxy service as well.

```yml
services:
  store1:
    extends:
      file: store.yml
      service: store
    hostname: store1
    ports:
      - '8080:8080'
  store2:
    extends:
      file: store.yml
      service: store
    hostname: store2
    ports:
      - '8081:8080'  
  haproxy:
    extends:
      file: haproxy.yml
      service: haproxy      
```

Create the HAProxy base configuration at `docker-compose\haproxy.yml` with the following content:

```yml
version: '2'
services:
  haproxy:
    build:
      context: .
      dockerfile: Dockerfile-haproxy
    image: haproxy
    ports:
      - 80:80
```

Create the file `docker-compose/Dockerfile-haproxy` to specify how docker must build the HAProxy image:

```shell
FROM haproxy:2.2
COPY haproxy.cfg /usr/local/etc/haproxy/haproxy.cfg
```

Create the file `docker-compose/haprox.cfg` with the HAProxy service configuration:
```
global
    debug
    daemon
    maxconn 2000

defaults
    mode http
    timeout connect 5000ms
    timeout client 50000ms
    timeout server 50000ms

frontend http-in
    bind *:80
    default_backend servers

backend servers
    balance roundrobin
    cookie SERVERUSED insert indirect nocache
    option httpchk /
    option redispatch
    default-server check
    server store1 store1:8080 cookie store1
    server store2 store2:8080 cookie store2
```

In the configuration above, store1 and store2 are the backend servers to load balance with roundrobin strategy. With **option redispatch**, HAProxy will redispatch the request to another server if the selected server fails.

HAProxy listens in port 80, then, sign in to Okta and update the client application. Add http://localhost/login/oauth2/code/oidc as **Login redirect URI**, and http://localhost as **Logout redirect URI**.


Run all services again:
```shell
cd docker-compose
docker-compose up
```
Once all services are up, sign in to http://localhost with the Okta user and list some entity. In your browser check the **SERVERUSED** cookie:
```
SERVERUSED=store2
```

Stop the container of that `store` instance:
```shell
docker stop docker-compose_store2
```
Create a new entity and inspect the POST request to verify that a different server responds, without losing the session:
```
SERVERUSED=store1
```

## Lean More About JHipster, Okta and Spring Session

I hope you enjoyed this tutorial and made you understand one possible approach to session sharing in JHipster with Spring Session, which can be useful when the gateway is a stateful service. Keep learning and check the following links for more:

- [JHipster Registry](https://www.jhipster.tech/jhipster-registry/)
- [Spring Session](https://spring.io/projects/spring-session)
- [JHipster OAuth2](https://www.jhipster.tech/security/#oauth2)

You can find all the code for this tutorial in [Gitub](https://github.com/indiepopart/jhipster-spring-session).
