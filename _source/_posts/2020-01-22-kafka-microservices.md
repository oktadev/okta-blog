---
layout: blog_post
title: "Communicate Between Microservices with Apache Kafka"
author: jimena-garbarino
by: contractor
communities: [java]
description: "This tutorial shows you how to add asynchronous messaging between Java microservices using Apache Kafka."
tags: [java, kafka, microservices, jhipster]
tweets:
- "Want to see how to use @apachekafka to communicate between microservices? This tutorial shows you how!"
- "Did you know @jhipster supports #Kafka as a communications mechanism between microservices?"
- "Microservice architectures ❤️ asynchronous messaging! Learn how to use @apachekafka to implement it. →"
image: blog/kafka-microservices/kafka-microservices.png
type: conversion
---

One of the traditional approaches for communicating between [microservices](https://www.okta.com/blog/2021/02/microservices/) is through their REST APIs. However, as your system evolves and the number of microservices grows, communication becomes more complex, and the architecture might start resembling our old friend the spaghetti anti-pattern, with services depending on each other or tightly coupled, slowing down development teams. This model can exhibit low latency but only works if services are made highly available.

To overcome this design disadvantage, new architectures aim to decouple senders from receivers, with asynchronous messaging. In a Kafka-centric architecture, low latency is preserved, with additional advantages like message balancing among available consumers and centralized management.

When dealing with a brownfield platform (legacy), a recommended way to de-couple a monolith and ready it for a move to microservices is to implement asynchronous messaging.

In this tutorial you will learn how to:

- Create a microservices architecture with JHipster
- Enable Kafka integration for communicating microservices
- Set up Okta as the authentication provider

**Table of Contents**{: .hide }
* Table of Contents
{:toc}

## What is Kafka?

**Apache Kafka** is a distributed streaming platform. It was initially conceived as a message queue and open-sourced by LinkedIn in 2011. Its community evolved Kafka to provide key capabilities:

- **Publish and Subscribe** to streams of records, like a message queue.
- **Storage system** so messages can be consumed asynchronously. Kafka writes data to a scalable disk structure and replicates for fault-tolerance. Producers can wait for write acknowledgments.
- **Stream processing** with Kafka Streams API, enables complex aggregations or joins of input streams onto an output stream of processed data.

Traditional messaging models are queue and publish-subscribe. In a queue, each record goes to one consumer. In publish-subscribe, the record is received by all consumers.

The **Consumer Group** in Kafka is an abstraction that combines both models. Record processing can be load balanced among the members of a consumer group and Kafka allows to broadcast messages to multiple consumer groups. It is the same publish-subscribe semantic where the subscriber is a cluster of consumers instead of a single process.

Popular use cases of Kafka include:
- The traditional messaging, to decouple data producers from processors with better latency and scalability.
- Site activity tracking with real-time publish-subscribe feeds
- As a replacement for file-based log aggregation, where event data becomes a stream of messages
- Data Pipelines where data consumed from topics is transformed and fed to new topics
- As an external commit log for a distributed system
- As a backend log storage for event sourcing applications, where each state change is logged in time order.

## Microservices Communication With Kafka

Let's build a microservices architecture with JHipster and Kafka support. In this tutorial, you'll create a `store` and an `alert` microservices. The store microservices will create and update store records. The `alert` microservice will receive update events from `store` and send an email alert.

> **Prerequisites:** 
> - [Java 8+](https://adoptopenjdk.net/)
> - [Docker](https://docs.docker.com/install)
> - [Docker Compose](https://docs.docker.com/compose/install)
> - [Node.js](https://nodejs.org/en/)

Install JHipster.

```bash
npm install -g generator-jhipster@6.6.0
```

The `--version` command should output something like this:

```bash
$ jhipster --version
INFO! Using JHipster version installed globally
6.6.0
```

Create a directory for the project.

```bash
mkdir jhipster-kafka
cd jhipster-kafka
```

Create an `apps.jh` file that defines the store, alert, and gateway applications in JHipster Domain Language (JDL). Kafka integration is enabled by adding `messageBroker kafka` to the store and alert app definitions.

```text
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
  entities Store, StoreAlert
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
    messageBroker kafka
  }
  entities Store
}

application {
  config {
    baseName alert,
    packageName com.okta.developer.alert,
    applicationType microservice,
    authenticationType oauth2,
    serverPort 8082,
    serviceDiscoveryType eureka
    messageBroker kafka
  }
  entities StoreAlert
}

enum StoreStatus {
  OPEN,
  CLOSED
}

entity Store {
  name String required,
  address String required,
  status StoreStatus,
  createTimestamp Instant required,
  updateTimestamp Instant
}

entity StoreAlert {
  storeName String required,
  storeStatus String required,
  timestamp Instant required
}

microservice Store with store
microservice StoreAlert with alert
```

Now, in your `jhipster-kafka` folder, import this file using `import-jdl`.

```bash
jhipster import-jdl apps.jh
```

## Configure Microservices Deployment with Docker Compose

In the project folder, create a sub-folder for Docker Compose and run JHipster's `docker-compose` sub-generator.

```bash
mkdir docker-compose
cd docker-compose
jhipster docker-compose
```

The generator will ask you to define the following things:

1. Type of application: **Microservice application**
2. Type of gateway: **JHipster gateway based on Netflix Zuul**
3. Leave the root directory for services as default: **../**
4. Which applications to include: **gateway**, **store**, **alert**
4. If the database is clustered: **No**
5. If monitoring should be enabled: **No**
6. Password for JHipster Registry: `<default>`

Almost when the generator completes, a warning shows in the output:

```bash
WARNING! Docker Compose configuration generated, but no Jib cache found
If you forgot to generate the Docker image for this application, please run:
To generate the missing Docker image(s), please run:
 ./mvnw -ntp -Pprod verify jib:dockerBuild in /home/indiepopart/jhipster-kafka/alert
 ./mvnw -ntp -Pprod verify jib:dockerBuild in /home/indiepopart/jhipster-kafka/gateway
 ./mvnw -ntp -Pprod verify jib:dockerBuild in /home/indiepopart/jhipster-kafka/store
```

You will generate the images later, but first, let's add some security and Kafka integration to your microservices.

## Add OpenID Connect (OIDC) Authentication

This microservices architecture is set up to authenticate against Keycloak. Let's update the settings to use Okta as the authentication provider.

{% include setup/cli.md type="jhipster" %}

In the project, create a `docker-compose/.env` file and add the following variables. For the values, use the settings from the Okta web application you created:

```bash
OIDC_CLIENT_ID={yourClientId}
OIDC_CLIENT_SECRET={yourClientSecret}
OIDC_ISSUER_URI={yourIssuer}
```

Edit `docker-compose/docker-compose.yml` and update the `SPRING_SECURITY_*` settings for the services `store-app`, `alert-app` and `gateway-app`:

```yaml
- SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_OIDC_CLIENT_ID=${OIDC_CLIENT_ID}
- SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_OIDC_CLIENT_SECRET=${OIDC_CLIENT_SECRET}
- SPRING_SECURITY_OAUTH2_CLIENT_PROVIDER_OIDC_ISSUER_URI=${OIDC_ISSUER_URI}
```
The same authentication must be set up for the JHipster Registry. Edit `docker-compose/jhipster-registry.yml` and set the same values.

### Use Spring Cloud Config to Override OpenID Connect Settings

An alternative to setting environment variables for each application in `docker-compose.yml` is to use Spring Cloud Config. JHipster Registry includes Spring Cloud Config, so it's pretty easy to do.

Open `docker-compose/central-server-config/application.yml` and add your Okta settings there.

```yaml
spring:
  security:
    oauth2:
      client:
        provider:
          oidc:
            issuer-uri: https://{yourOktaDomain}/oauth2/default
        registration:
          oidc:
            client-id: {yourClientId}
            client-secret: {yourClientSecret}
```

The registry, gateway, store, and alert applications are all configured to read this configuration on startup.

## Communicate Between Store and Alert Microservices

The JHipster generator adds a `kafka-clients` dependency to applications that declare `messageBroker kafka` (in JDL), enabling the [Kafka Consumer and Producer Core APIs](https://kafka.apache.org/documentation/#api).

For the sake of this example, update the `store` microservice to send a message to the `alert` microservice through Kafka, whenever a store entity is updated.

In the `store` project, create an `AlertService` for sending the event details. This service will build the payload and serialize it into a JSON `String`, and use the default Kafka `StringSerializer` and `StringDeserializer` already defined in `application.yml`.

```java
package com.okta.developer.store.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.okta.developer.store.config.KafkaProperties;
import com.okta.developer.store.domain.Store;
import com.okta.developer.store.service.dto.StoreAlertDTO;
import org.apache.kafka.clients.producer.KafkaProducer;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;

@Service
public class AlertService {

    private final Logger log = LoggerFactory.getLogger(AlertService.class);

    private static final String TOPIC = "topic_alert";

    private final KafkaProperties kafkaProperties;

    private final static Logger logger = LoggerFactory.getLogger(AlertService.class);
    private KafkaProducer<String, String> producer;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public AlertService(KafkaProperties kafkaProperties) {
        this.kafkaProperties = kafkaProperties;
    }

    @PostConstruct
    public void initialize(){
        log.info("Kafka producer initializing...");
        this.producer = new KafkaProducer<>(kafkaProperties.getProducerProps());
        Runtime.getRuntime().addShutdownHook(new Thread(this::shutdown));
        log.info("Kafka producer initialized");
    }

    public void alertStoreStatus(Store store) {
        try {
            StoreAlertDTO storeAlertDTO = new StoreAlertDTO(store);
            String message = objectMapper.writeValueAsString(storeAlertDTO);
            ProducerRecord<String, String> record = new ProducerRecord<>(TOPIC, message);
            producer.send(record);
        } catch (JsonProcessingException e) {
            logger.error("Could not send store alert", e);
            throw new AlertServiceException(e);
        }
    }

    @PreDestroy
    public void shutdown() {
        log.info("Shutdown Kafka producer");
        producer.close();
    }
}
```

Create the referenced `AlertServiceException` class.

```java
package com.okta.developer.store.service;

public class AlertServiceException extends RuntimeException {

    public AlertServiceException(Throwable e) {
        super(e);
    }
}
```

And add a `StoreAlertDTO` class in the `...service.dto` package.

```java
package com.okta.developer.store.service.dto;

import com.okta.developer.store.domain.Store;

public class StoreAlertDTO {

    private String storeName;
    private String storeStatus;

    public StoreAlertDTO(Store store){
        this.storeName = store.getName();
        this.storeStatus = store.getStatus().name();
    }

    public String getStoreName() {
        return storeName;
    }

    public void setStoreName(String storeName) {
        this.storeName = storeName;
    }

    public String getStoreStatus() {
        return storeStatus;
    }

    public void setStoreStatus(String storeStatus) {
        this.storeStatus = storeStatus;
    }

}
```

Inject the `AlertService` into the `StoreResource` API implementation, modifying its constructor. Also modify the `updateStore` call to publish a `StoreAlertDTO` for the `alert` service:

```java
@RestController
@RequestMapping("/api")
public class StoreResource {

    ...
    private final StoreRepository storeRepository;
    private final AlertService alertService;

    public StoreResource(StoreRepository storeRepository, AlertService alertService) {
        this.storeRepository = storeRepository;
        this.alertService = alertService;
    }

    ...

    @PutMapping("/stores")
    public ResponseEntity<Store> updateStore(@Valid @RequestBody Store store) throws URISyntaxException {
        log.debug("REST request to update Store : {}", store);
        if (store.getId() == null) {
            throw new BadRequestAlertException("Invalid id", ENTITY_NAME, "idnull");
        }
        Store result = storeRepository.save(store);

        log.debug("SEND store alert for Store: {}", store);
        alertService.alertStoreStatus(result);

        return ResponseEntity.ok()
            .headers(HeaderUtil.createEntityUpdateAlert(applicationName, true, ENTITY_NAME, store.getId().toString()))
            .body(result);
    }

   ...
}
```

### Fix Integration Tests  

Update the `StoreResourceIT` integration test to initialize the `StoreResource` correctly:

```java
@SpringBootTest(classes = {StoreApp.class, TestSecurityConfiguration.class})
public class StoreResourceIT {

    ...
    @Autowired
    private StoreRepository storeRepository;

    @Autowired
    private AlertService alertService;

    ...

    @BeforeEach
    public void setup() {
        MockitoAnnotations.initMocks(this);
        final StoreResource storeResource = new StoreResource(storeRepository, alertService);
        ...
    }
    ...
}
```  

### Enable Debug Logging in Production

Since you are going to deploy the `prod` profile, let's enable logging in production. Modify the `store/src/main/java/com/okta/.../config/LoggingAspectConfiguration` class:

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

Edit `store/src/main/resources/config/application-prod.yml` and change the log level to `DEBUG` for the store application:

```yml
logging:
  level:
    ROOT: INFO
    io.github.jhipster: INFO
    com.okta.developer.store: DEBUG
```

### Add Email Service to Alert Microservice

Now let's customize the `alert` microservice. First, create an `EmailService` to send the store update notification, using the Spring Framework's `JavaMailSender`.

```java
package com.okta.developer.alert.service;

import com.okta.developer.alert.service.dto.StoreAlertDTO;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private JavaMailSender emailSender;

    @Value("${alert.distribution-list}")
    private String distributionList;

    public EmailService(JavaMailSender emailSender){
        this.emailSender = emailSender;
    }

    public void sendSimpleMessage(StoreAlertDTO alertDTO){
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setTo(distributionList);
            message.setSubject("Store Alert: " + alertDTO.getStoreName());
            message.setText(alertDTO.getStoreStatus());
            message.setFrom("StoreAlert");
            emailSender.send(message);
        } catch (Exception exception) {
            throw new EmailServiceException(exception);
        }
    }
}
```

Create the referenced `EmailServiceException`.

```java
package com.okta.developer.alert.service;

public class EmailServiceException extends RuntimeException {

    public EmailServiceException(Exception exception) {
        super(exception);
    }
}
```

Add a `StoreAlertDTO` class in the `...service.dto` package.

```java
package com.okta.developer.alert.service.dto;

public class StoreAlertDTO {

    private String storeName;
    private String storeStatus;

    public String getStoreName() {
        return storeName;
    }

    public void setStoreName(String storeName) {
        this.storeName = storeName;
    }

    public String getStoreStatus() {
        return storeStatus;
    }

    public void setStoreStatus(String storeStatus) {
        this.storeStatus = storeStatus;
    }

}
```

Add a new property to `alert/src/main/resources/config/application.yml` **and** to `alert/src/test/resources/config/application.yml` for the destination email of the store alert.

```yaml
alert:
  distribution-list: {distributionListAddress}
```

**NOTE:** You'll need to set a value for the email (e.g., `list@email.com` will work) in `src/test/.../application.yml` for tests to pass. For Docker, you'll override the `{distributionListAddress}` and `{username}` + `{password}` placeholder values with environment variables below.

Update `spring.mail.*` properties in `application-prod.yml` to set Gmail as the email service:

```yaml
spring:
  ...
  mail:
    host: smtp.gmail.com
    port: 587
    username: {username}
    password: {password}
    protocol: smtp
    tls: true
    properties.mail.smtp:
      auth: true
      starttls.enable: true
      ssl.trust: smtp.gmail.com
```

### Add a Kafka Consumer to Persist Alert and Send Email

Create an `AlertConsumer` service to persist a `StoreAlert` and send the email notification when receiving an alert message through Kafka. Add `KafkaProperties`, `StoreAlertRepository` and `EmailService` as constructor arguments. Then add a `start()` method to initialize the consumer and enter the processing loop.

```java
package com.okta.developer.alert.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.okta.developer.alert.config.KafkaProperties;
import com.okta.developer.alert.domain.StoreAlert;
import com.okta.developer.alert.repository.StoreAlertRepository;
import com.okta.developer.alert.service.dto.StoreAlertDTO;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.apache.kafka.clients.consumer.ConsumerRecords;
import org.apache.kafka.clients.consumer.KafkaConsumer;
import org.apache.kafka.common.errors.WakeupException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import javax.annotation.PostConstruct;
import javax.annotation.PreDestroy;
import java.time.Duration;
import java.time.Instant;
import java.util.Collections;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;

@Service
public class AlertConsumer {

    private final Logger log = LoggerFactory.getLogger(AlertConsumer.class);

    private final AtomicBoolean closed = new AtomicBoolean(false);

    public static final String TOPIC = "topic_alert";

    private final KafkaProperties kafkaProperties;

    private KafkaConsumer<String, String> kafkaConsumer;

    private StoreAlertRepository storeAlertRepository;

    private EmailService emailService;

    private ExecutorService executorService = Executors.newCachedThreadPool();

    public AlertConsumer(KafkaProperties kafkaProperties, StoreAlertRepository storeAlertRepository, EmailService emailService) {
        this.kafkaProperties = kafkaProperties;
        this.storeAlertRepository = storeAlertRepository;
        this.emailService = emailService;
    }

    @PostConstruct
    public void start() {

        log.info("Kafka consumer starting...");
        this.kafkaConsumer = new KafkaConsumer<>(kafkaProperties.getConsumerProps());
        Runtime.getRuntime().addShutdownHook(new Thread(this::shutdown));
        kafkaConsumer.subscribe(Collections.singletonList(TOPIC));
        log.info("Kafka consumer started");

        executorService.execute(() -> {
            try {
                while (!closed.get()) {
                    ConsumerRecords<String, String> records = kafkaConsumer.poll(Duration.ofSeconds(3));
                    for (ConsumerRecord<String, String> record : records) {
                        log.info("Consumed message in {} : {}", TOPIC, record.value());

                        ObjectMapper objectMapper = new ObjectMapper();
                        StoreAlertDTO storeAlertDTO = objectMapper.readValue(record.value(), StoreAlertDTO.class);
                        StoreAlert storeAlert = new StoreAlert();
                        storeAlert.setStoreName(storeAlertDTO.getStoreName());
                        storeAlert.setStoreStatus(storeAlertDTO.getStoreStatus());
                        storeAlert.setTimestamp(Instant.now());
                        storeAlertRepository.save(storeAlert);

                        emailService.sendSimpleMessage(storeAlertDTO);
                    }
                }
                kafkaConsumer.commitSync();
            } catch (WakeupException e) {
                // Ignore exception if closing
                if (!closed.get()) throw e;
            } catch (Exception e) {
                log.error(e.getMessage(), e);
            } finally {
                log.info("Kafka consumer close");
                kafkaConsumer.close();
            }
        });
    }

    public KafkaConsumer<String, String> getKafkaConsumer() {
        return kafkaConsumer;
    }

    public void shutdown() {
        log.info("Shutdown Kafka consumer");
        closed.set(true);
        kafkaConsumer.wakeup();
    }
}
```

**NOTE**: Any unhandled exception during message processing will make the service leave the consumer group. That's why there's code above that catches `Exception`.

As a last customization step, update the logging configuration the same way you did for the `store` microservice.

## Microservices + Kafka Container Deployment

Modify `docker-compose/docker-compose.yml` and add the following environment variables for the `alert-app` application:

```yaml
- SPRING_MAIL_USERNAME=${MAIL_USERNAME}
- SPRING_MAIL_PASSWORD=${MAIL_PASSWORD}
- ALERT_DISTRIBUTION_LIST=${DISTRIBUTION_LIST}
```

Edit `docker-compose/.env` and add values for the new environment variables:

```bash
MAIL_USERNAME={yourGmailAccount}
MAIL_PASSWORD={yourPassword}
DISTRIBUTION_LIST={anotherEmailAccount}
```

Make sure Docker Desktop is running, then generate the Docker image for the `store` microservice. Run the following command from the `store` directory.

```bash
./mvnw -ntp -Pprod verify jib:dockerBuild
```

Repeat for the `alert` and `gateway` apps.

> Before you run your microservices architecture, make sure you have enough RAM allocated. Docker Desktop's default is 2GB, I recommend 8GB. This setting is under Docker > Resources > Advanced. 

Then, run everything using Docker Compose:

```bash
cd docker-compose
docker-compose up
```

You will see a huge amount of logging while each service starts. Wait a minute or two, then open `http://localhost:8761` and log in with your Okta account. This is the JHipster Registry which you can use to monitor your apps' statuses. Wait for all the services to be up.

{% img blog/kafka-microservices/jhipster-registry.png alt:"JHipster Registry" width:"800" %}{: .center-image }



Open a new terminal window and tail the `alert` microservice logs to verify it's processing `StoreAlert` records:

```bash
docker exec -it docker-compose_alert-app_1 /bin/bash
tail -f /tmp/spring.log
```

You should see log entries indicating the consumer group to which the `alert` microservice joined on startup:

```bash
2020-01-22 03:12:08.186  INFO 1 --- [Thread-7] o.a.k.c.c.internals.AbstractCoordinator  : [Consumer clientId=consumer-1, groupId=alert] (Re-)joining group
2020-01-22 03:12:08.215  INFO 1 --- [Thread-7] o.a.k.c.c.internals.AbstractCoordinator  : [Consumer clientId=consumer-1, groupId=alert] (Re-)joining group
2020-01-22 03:12:11.237  INFO 1 --- [Thread-7] o.a.k.c.c.internals.AbstractCoordinator  : [Consumer clientId=consumer-1, groupId=alert] Successfully joined group with generation 1
```

Once everything is up, go to the gateway at `http://localhost:8080` and log in. Create a store entity and then update it. The `alert` microservice should log entries when processing the received message from the `store` service.

```bash
2020-01-22 03:18:26.528  INFO 1 --- [Thread-7] c.o.d.alert.service.AlertConsumer   : Consumed message in topic_alert : {"storeName":"Zara","storeStatus":"CLOSED"}
2020-01-22 03:18:26.664 DEBUG 1 --- [Thread-7] c.o.d.alert.aop.logging.LoggingAspect    : Enter: com.okta.developer.alert.service.EmailService.sendSimpleMessage() with argument[s] = [com.okta.developer.alert.service.dto.StoreAlertDTO@13038372]
```

If you see a `MailAuthenticationException` in the `alert` microservices log, when attempting to send the notification, it might be your Gmail security configuration.

```text
alert-app_1           | org.springframework.mail.MailAuthenticationException: Authentication failed; nested exception is javax.mail.AuthenticationFailedException: 535-5.7.8 Username and Password not accepted. Learn more at
alert-app_1           | 535 5.7.8  https://support.google.com/mail/?p=BadCredentials *** - gsmtp
alert-app_1           |
alert-app_1           | 	at org.springframework.mail.javamail.JavaMailSenderImpl.doSend(JavaMailSenderImpl.java:440)
```

To enable the login from the `alert` application, go to <https://myaccount.google.com/lesssecureapps> and allow less secure applications. This is required because the `alert` application is unknown to Google and sign-on is [blocked for third-party applications](https://support.google.com/accounts/answer/6010255?p=less-secure-apps&hl=en&visit_id=637123668729530601-366764189&rd=1) that don't meet Google security standards.

 **IMPORTANT**: Don't forget to turn off _Less secure app access_ once you finish the test.

Restart the `alert` microservice:

```bash
docker restart docker-compose_alert-app_1
```

Update a store again and you should receive an email with the store's status this time.

In this tutorial, authentication (of producers and consumers), authorization (of read/write operations), and encryption (of data) were not covered, as security in Kafka is optional. See [Kafka's documentation on security](https://kafka.apache.org/documentation/#security) to learn how to enable these features.

## Learn More About Kafka and Microservices

This tutorial showed how a Kafka-centric architecture allows decoupling microservices to simplify the design and development of distributed systems. To continue learning about these topics check out the following links:

- [JHipster: Using Kafka](https://www.jhipster.tech/using-kafka/)
- [JHipster: OAuth2 and OpenID Connect](https://www.jhipster.tech/security/#-oauth2-and-openid-connect)
- [Apache Kafka Introduction](https://kafka.apache.org/intro)

There are also a few tutorials Kafka, microservices, and JHipster that you might enjoy on this blog:

- [Kafka with Java: Build a Secure, Scalable Messaging App](/blog/2019/11/19/java-kafka)
- [Java Microservices with Spring Cloud Config and JHipster](/blog/2019/05/23/java-microservices-spring-cloud-config)
- [Secure Reactive Microservices with Spring Cloud Gateway](/blog/2019/08/28/reactive-microservices-spring-cloud-gateway)
- [Reactive Java Microservices with Spring Boot and JHipster](/blog/2021/01/20/reactive-java-microservices)

You can find all the code for this tutorial [on GitHub](https://github.com/oktadeveloper/okta-kafka-microservices-example).

Please follow us [@oktadev on Twitter](https://twitter.com/oktadev) for more tutorials like this one. We also have a [YouTube channel](https://www.youtube.com/c/oktadev) where we frequently publish videos.
