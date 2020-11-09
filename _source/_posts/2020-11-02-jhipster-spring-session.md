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

{% img blog/spring-session/okta-login.png alt:"Okta sign in form" width:"500" %}{: .center-image }


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

Enable the `session.store-type=redis` for the `dev` and `prod` profiles, adding the following configuration to `src/main/resources/config/application-dev.yml` and `src/main/resources/config/application-prod.yml`:

```yml
spring:
  session:
    store-type: redis
```

For this example, disable the redis store in the default configuration, so the existing tests don't require a redis instance:

```yml
spring:
  session:
    store-type: none
  autoconfigure:
    exclude:
      - org.springframework.boot.autoconfigure.data.redis.RedisAutoConfiguration
```



## Load Balancing Test with HAProxy

Load balancing in a JHipster microservices architecture is handled at the client side. The JHipster Registry is an Eureka discovery server, maintaining a dynamic list of available service instances for the service clients to do request routing and load balancing. The store service, which acts as a gateway and also as an Eureka client, requests the available instances to the JHipster registry for service routing.

As we want to test session sharing among multiple store nodes, we need load balancing for the store service as well, so let's run an HAProxy container.

## Lean More About JHipster, Okta and Spring Session
