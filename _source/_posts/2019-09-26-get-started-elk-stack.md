---
disqus_thread_id: 7651396565
discourse_topic_id: 17141
discourse_comment_url: https://devforum.okta.com/t/17141
layout: blog_post
title: "Get Started with the ELK Stack"
author: jimena-garbarino
by: contractor
communities: [java]
description: "Learn how to monitor your microservices architecture with the Elastic Stack (formerly ELK Stack)."
tags: [security, oauth2, monitoring, microservices, elk]
tweets:
- "Curious about how to monitor your Java microservices architecture? Learn about the Elastic Stack."
- "Monitoring is crucial to a microservices architecture. Learn how with the Elastic Stack."
- "Not actively monitoring your microservices architecture? You should be! Learn how with the Elastic Stack."
image: blog/featured/okta-java-bottle-headphones.jpg
type: conversion
---

Good design principles require that microservices architectures are observable, and provide a centralized monitoring tool. This tool allows development teams to verify the overall system health, inspect logs and errors, and get feedback after deployments. So what is the Elastic (or ELK) Stack and why it is an excellent option to meet this need?

In this tutorial post, you will learn how to ...
* Set up and run the ELK stack in Docker containers
* Set up JHipster Console to monitor microservices infrastructure
* Create a microservices architecture with JHipster
* Enable monitoring with JHipster Console
* Configure OpenID Connect authentication for microservices

**Table of Contents**{: .hide }
* Table of Contents
{:toc}

## The Evolution of the Elastic Stack

The acronym ELK stands for *Elasticsearch, Logstash, and Kibana*, three open-source projects that form a powerful stack for log ingestion and visualization, log search, event analysis, and helpful visual metrics for monitoring applications.

_**E**lasticsearch_ is the heart of the stack: a JSON-based search and analytics engine, distributed and scalable. It was built on top of Apache Lucene and provides a JSON REST API, cluster management, high availability, and fault tolerance.

_**L**ogstash_ is an ETL (extract, transform, load) tool to enrich documents, run data processing pipelines. These pipelines ingest data from multiple sources, transform and send it to Elasticsearch.

_**K**ibana_ provides the visualization front-end, a window into the Elastic Stack. With dashboards and visualization elements, the data stored in Elasticsearch can be explored, aggregated and analyzed.

From version 7 on, the ELK Stack was renamed to [Elastic Stack](https://www.elastic.co/elk-stack) and added Beats to the stack. Beats is a family of lightweight data shippers that work with Elasticsearch and Logstash. 

## Set up the Elastic Stack

Elastic has published [a Docker Compose configuration](https://github.com/elastic/stack-docker), to demonstrate the stack components on a single machine.
Install [Docker](https://docs.docker.com/install/) and [Docker Compose](https://docs.docker.com/compose/install/) and follow these steps to start up the stack:

> Windows users must configure 2 environment variables, check out the instructions on the [**stack-docker** github repository](https://github.com/elastic/stack-docker)
> 
> Allow at least 4GB of RAM for the containers, also check out instructions for your environment

1. Clone the `stack-docker` repository

    ```
    git clone https://github.com/elastic/stack-docker.git
    ```

2. Setup the stack with Docker Compose

    ```
    cd stack-docker
    docker-compose -f setup.yml up
    ```

    When the setup completes, it will output the **password** for the **elastic** user. On a slow connection, this can take up to 20 minutes. When it completes, you will see the following logs:

    ```
    setup_1  | Setup completed successfully. To start the stack please run:
    setup_1  | 	 docker-compose up -d
    setup_1  |
    setup_1  | If you wish to remove the setup containers please run:
    setup_1  | 	docker-compose -f docker-compose.yml -f docker-compose.setup.yml down --remove-orphans
    setup_1  |
    setup_1  | You will have to re-start the stack after removing setup containers.
    setup_1  |
    setup_1  | Your 'elastic' user password is: Z8GFVXu9UVsBrM6nup5fHw==
    stack-docker_setup_1 exited with code 0
    ```

3. Launch the stack

    Start the stack in the foreground to watch the containers logs:
    ```
    docker-compose up
    ```
    When you see Kibana log the response to health check requests sent by the Beats family and you see at least one heartbeat entry in the logs, you can try the login (step 4 below):
    ```
    kibana           | {"type":"response","@timestamp":"2019-09-23T20:38:47Z","tags":[],"pid":1,"method":"get","statusCode":200,"req":{"url":"/login?next=%2F","method":"get","headers":{"host":"kibana:5601","user-agent":"Go-http-client/1.1","referer":"http://kibana:5601"},"remoteAddress":"172.25.0.9","userAgent":"172.25.0.9","referer":"http://kibana:5601"},"res":{"statusCode":200,"responseTime":30,"contentLength":9},"message":"GET /login?next=%2F 200 30ms - 9.0B"}
    ...
    heartbeat        | 2019-09-23T20:38:52.213Z	INFO	[monitoring]	log/log.go:144	Non-zero metrics in the last 30s	{"monitoring": {"metrics": {"beat":{"cpu":{"system":{"ticks":160,"time":{"ms":50}},"total":{"ticks":430,"time":{"ms":120},"value":430},"user":{"ticks":270,"time":{"ms":70}}},"handles":{"limit":{"hard":1048576,"soft":1048576},"open":9},"info":{"ephemeral_id":"d8d4f6a2-39fa-41cb-9e9c-520438d49a9e","uptime":{"ms":93132}},"memstats":{"gc_next":4194304,"memory_alloc":3365792,"memory_total":12191384,"rss":327680}},"libbeat":{"config":{"module":{"running":0}},"output":{"events":{"acked":24,"batches":6,"total":24},"read":{"bytes":5970},"write":{"bytes":16878}},"pipeline":{"clients":4,"events":{"active":0,"published":24,"total":24},"queue":{"acked":24}}},"system":{"load":{"1":4.83,"15":2.43,"5":3.44,"norm":{"1":1.2075,"15":0.6075,"5":0.86}}}}}}
    ```
    > You may notice exceptions in the log output. For this demonstration, they can be safely ignored. If you run into any issues with docker, you can start fresh with:
    ```
    docker container ls -a | cut -c1-12 | xargs docker container rm --force
    docker images | cut -c69-80 | xargs docker rmi
    docker system prune -a
    ```
    **NOTE:** This will destroy all docker containers, images and networks, so use at your own risk.

4. Go to [http://localhost:5601](http://localhost:5601/) to log into Kibana.

    Once you log in (using the **elastic** user and the password you captured above), explore the installed dashboards from the Dashboards section via the menu on the left. Heartbeat is one of the Beat services that monitors your services uptime from a provided list of URLs. Open the dashboard *Heartbeat HTTP monitoring* and see the power of the stack for data visualization.

    {% img blog/getting-started-with-elk/http-heartbeat.png alt:"Heartbeat HTTP Monitoring" width:"800" %}{: .center-image }

## The JHipster Console

The Jhipster Console, an awesome monitoring solution based on the Elastic Stack, allows the visualization and analysis of JHipster applications metrics over time. The Console provides pre-configured dashboards to monitor microservices infrastructure. You can review the complete list of features in [JHipster Console's documentation](https://www.jhipster.tech/monitoring/#jhipster-console).

One of the easier ways to start with the JHipster Console is to deploy the applications and enable monitoring with the [docker-compose sub-generator](https://www.jhipster.tech/docker-compose/). You'll use this to:
- Create a microservices architecture with JHipster
- Enable monitoring with JHipster Console
- Configure OpenID Connect for authentication to microservices

## Create a Java Microservices Architecture with JHipster

> To install a version of JHipster that will work here, you need to install [Node.js](https://nodejs.org/).

### Install JHipster

```shell
npm install -g generator-jhipster@6.3.1
jhipster --version
```

The version command should output something like this:

```
INFO! Using JHipster version installed globally
6.3.1
```

Create a directory for the project:

```shell
mkdir jhipster
cd jhipster
```

Create `apps.jh` to define  store, blog, and gateway microservices in JHipster Domain Language (JDL). We are going to recreate [a Java-based example of microservices architecture we have built before](/blog/2019/05/23/java-microservices-spring-cloud-config) for this tutorial.

```json
application {
  config {
    baseName gateway,
    packageName com.okta.developer.gateway,
    applicationType gateway,
    authenticationType oauth2,
    prodDatabaseType postgresql,
    serviceDiscoveryType eureka,
    testFrameworks [protractor]
  }
  entities Blog, Post, Tag, Product
}

application {
  config {
    baseName blog,
    packageName com.okta.developer.blog,
    applicationType microservice,
    authenticationType oauth2,
    prodDatabaseType postgresql,
    serverPort 8081,
    serviceDiscoveryType eureka
  }
  entities Blog, Post, Tag
}

application {
  config {
    baseName store,
    packageName com.okta.developer.store,
    applicationType microservice,
    authenticationType oauth2,
    databaseType mongodb,
    devDatabaseType mongodb,
    prodDatabaseType mongodb,
    enableHibernateCache false,
    serverPort 8082,
    serviceDiscoveryType eureka
  }
  entities Product
}

entity Blog {
  name String required minlength(3),
  handle String required minlength(2)
}

entity Post {
  title String required,
  content TextBlob required,
  date Instant required
}

entity Tag {
  name String required minlength(2)
}

entity Product {
  title String required,
  price BigDecimal required min(0),
  image ImageBlob
}

relationship ManyToOne {
  Blog{user(login)} to User,
  Post{blog(name)} to Blog
}

relationship ManyToMany {
  Post{tag(name)} to Tag{post}
}

paginate Post, Tag with infinite-scroll
paginate Product with pagination

microservice Product with store
microservice Blog, Post, Tag with blog
```

Now, in your `jhipster` folder, run the [**import-jdl** generator](https://www.jhipster.tech/jdl/#importingjdl).

```shell
jhipster import-jdl apps.jh
```

### Deploy Monitoring using `docker-compose`

In the project folder, create a subfolder for the `docker-compose` configuration and run the subgenerator.

```shell
mkdir docker-compose
cd docker-compose
jhipster docker-compose
```
The generator will ask you to define the following configurations:

1. Type of application: **Microservices application**
2. Type of gateway: **JHipster based on Zuul**
3. Which applications to include: **blog**, **gateway**, **store**
4. If the database is clustered: **no**
5. if monitoring must be enabled: **yes, with JHipster console**
6. Additional technologies for monitoring: **Zipkin**
7. Password for JHipster Registry: **default**

You can see how this works in the recording below.

<div style="text-align: center">
<script id="asciicast-261254" src="https://asciinema.org/a/261254.js" async></script>
</div>

When the generator has almost finished, a warning shows in the output:

```
WARNING! Docker Compose configuration generated, but no Jib cache found
If you forgot to generate the Docker image for this application, please run:
To generate the missing Docker image(s), please run:
  ./mvnw package -Pprod verify jib:dockerBuild in /home/indiepopart/jhipster/blog
  ./mvnw package -Pprod verify jib:dockerBuild in /home/indiepopart/jhipster/gateway
  ./mvnw package -Pprod verify jib:dockerBuild in /home/indiepopart/jhipster/store
```

You can follow the instructions above for creating the microservices images, or create an aggregator `pom.xml` and use just one command for building all the images, as described in [our post on Java microservices](/blog/2019/05/23/java-microservices-spring-cloud-config).

### Setup Okta OpenID Connect (OIDC) Authentication for Your Microservices

By default, the microservices architecture authenticates against Keycloak. However, you can easily change it to use Okta.

{% include setup/cli.md type="jhipster" %}

> For simplicity, this tutorial only creates a Web App, and its credentials will be used for all the services. In a real environment, each service must identify itself with its own credentials, and you should create one Web App or Service for each one of them in the Okta console.

Create a `docker-compose/.env` file with the following content:

```
OIDC_CLIENT_ID=<client_id>
OIDC_CLIENT_SECRET=<client_secret>
RESOURCE_ISSUER_URI=<org_url>/oauth2/default
```

The values should come from the `.okta.env` file the Okta CLI created. 

Edit `docker-compose/docker-compose.yml` and update the `SECURITY_*` settings for the services `blog-app`, `gateway-app`, and `store-app`:

```shell
SPRING_SECURITY_OAUTH2_CLIENT_PROVIDER_OIDC_ISSUER_URI=${RESOURCE_ISSUER_URI}
SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_OIDC_CLIENT_ID=${OIDC_CLIENT_ID}
SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_OIDC_CLIENT_SECRET=${OIDC_CLIENT_SECRET}
```

The same authentication must be set up for the JHipster Registry. Edit `docker-compose/jhipster-registry.yml` and set the same values as the environment section of the `gateway-app`.

### Enable Debug Logs and Zipkin

To send debug logs to the JHipster Console, let's update the log level in the prod profile. Edit `src/main/resources/config/application-prod.yml` to set the level for each service (`blog-app`, `store-app`, and `gateway-app`) to  **DEBUG** for the `com.okta.developer.*` logger. For example, in the blog's `application-prod.yml`:

```yaml
logging:
    level:
        com.okta.developer.blog: DEBUG
```

Also, for each service, update the `LoggingAspectConfiguration` to load when the prod profile is active. Change the `@Profile` annotation:

```java
@Configuration
@EnableAspectJAutoProxy
public class LoggingAspectConfiguration {

    @Bean
    @Profile({JHipsterConstants.SPRING_PROFILE_DEVELOPMENT, JHipsterConstants.SPRING_PROFILE_PRODUCTION})
    public LoggingAspect loggingAspect(Environment env) {
        return new LoggingAspect(env);
    }
}
```
[Zipkin](https://zipkin.io/) is a distributed tracing system that helps to troubleshoot latency issues in microservices architectures. With a traceId propagated from service to service, calls to different services can be correlated and analyzed as a part of the same flow. The Zipkin server and UI are provided with the JHipster Console, and JHipster apps can integrate with Zipkin through [Spring Cloud Sleuth](https://cloud.spring.io/spring-cloud-sleuth/reference/html/#sleuth-with-zipkin-via-http). 
To enable Zipkin tracing, add the `zipkin` profile to `blog-app`, `gateway-app`, and `store-app` in `docker-compose/docker-compose.yml`.

```yaml
- SPRING_PROFILES_ACTIVE=prod,swagger,zipkin
```
You also need to rebuild the Docker images with the `zipkin` profile, for `blog-app`, `store-app`, and `gateway-app` with the following Maven command:

```shell
./mvnw package -Pprod -Pzipkin verify jib:dockerBuild -DskipTests
```

>ProTip:  If you're on a system with bash shell, like Linux or MacOs, you can do this from the `jhipster` folder to build each project at once:
```
for i in blog gateway store
do 
cd $i 
./mvnw package -Pprod -Pzipkin verify jib:dockerBuild -DskipTests
cd ..
done
```

### Run the Monitored Microservices Architecture

Are you ready for the best? Go to the `docker-compose` folder and start the services with the following command:

```shell
docker-compose up
```

You will see a huge amount of logging while each service starts.

```
jhipster-registry_1           | ----------------------------------------------------------
jhipster-registry_1           | 	Application 'jhipster-registry' is running! Access URLs:
jhipster-registry_1           | 	Local: 		http://localhost:8761
jhipster-registry_1           | 	External: 	http://172.20.0.2:8761
jhipster-registry_1           | 	Profile(s): 	[composite, dev, swagger, oauth2]
jhipster-registry_1           | ----------------------------------------------------------
```

Log into the JHipster Registry at `http://localhost:8761` with Okta user credentials and check the service's health.

{% img blog/getting-started-with-elk/registry.png alt:"JHipster Registry" width:"800" %}{: .center-image }

Once all the services are up, log in to the gateway application and create some blogs and posts to generate traffic. To do this, use the **Entities** menu at the top left of the application. The gateway home is at `http://localhost:8080`.

The fun part! Access the JHipster Console at `http://localhost:5601`. Go to the Dashboards section, and open the **requests-dashboard**. You should see some nice curves:

{% img blog/getting-started-with-elk/requests-dashboard.png alt:"Requests Dashboard" width:"800" %}{: .center-image }

Since you integrated the JHipster Console with Zipkin UI, in the traces-dashboard, you can find the longest traces duration on the left. If you click on a traceId on the right, it will open the trace in the UI and you will be able to examine the flow.

{% img blog/getting-started-with-elk/zipkin-ui.png alt:"zipkin ui" width:"800" %}{: .center-image }

## Learn More About JHipster and Elastic Stack

I hope you enjoyed this tutorial and the power of the **Elastic Stack** and the **JHipster Console** for monitoring a microservices architecture.
To continue expanding your knowledge on JHipster monitoring and Okta integration with the Elastic Stack, check out the following links:

- [JHipster Console on GitHub](https://github.com/jhipster/jhipster-console)
- [JHipster Monitoring Documentation](https://www.jhipster.tech/monitoring/)
- [SAML Authentication and the Elastic Stack](https://www.elastic.co/blog/how-to-enable-saml-authentication-in-kibana-and-elasticsearch)
- [Authentication in Kibana](https://www.elastic.co/guide/en/kibana/current/kibana-authentication.html)

If you liked this post, chances are you'll like our other posts on JHipster and microservices:

- [Better, Faster, Lighter Java with Java 12 and JHipster 6](/blog/2019/04/04/java-11-java-12-jhipster-oidc)
- [Upgrading Spring Security OAuth and JUnit Tests through the 👀 of a Java Hipster](/blog/2019/04/15/testing-spring-security-oauth-with-junit)
- [Java Microservices with Spring Boot and Spring Cloud](/blog/2019/05/22/java-microservices-spring-boot-spring-cloud)
- [Java Microservices with Spring Cloud Config and JHipster](/blog/2019/05/23/java-microservices-spring-cloud-config)
- [Secure Reactive Microservices with Spring Cloud Gateway](/blog/2019/08/28/reactive-microservices-spring-cloud-gateway)

To be notified when we published new posts, [follow @oktadev on Twitter](https://twitter.com/oktadev). We also publish screencasts to [our YouTube channel](https://www.youtube.com/c/oktadev) on a regular basis.
