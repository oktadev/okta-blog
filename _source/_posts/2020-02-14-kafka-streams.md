---
layout: blog_post
title: "Kafka Streams"
author: 
description: ""
tags: []
tweets:
- ""
- ""
- ""
image: 
---
## How to Develop a Secure Kafka Streams Application with a Quarkus Front End

In this tutorial you're going to use Apache Kafka and Quarkus to create a secure, scalable web application. The application will use Kafka Streams and a small Kafka cluster to consume data from a server and push it to a client application as a real-time stream. The entire application will be secured. The Kafka cluster will be secured with SSL and SASL/JAAS password protection. The Quarkus client application will be secured using OAuth 2.0 & OIDC using Okta as the OIDC provider.

Both Apache Kafka and Quarkus are designed for use in scalable clusters. Quarkus is a container-first Kubernetes Java framework that you'll use to create a scalable, Java-based REST service and client application. It's extremely performant and designed to be used in serverless and microservice environments. Since I covered Quarkus [in a previous tutorial](http://need.a.link), I'm going to focus more on discussing Kafka in the intro to this tutorial. Just know that you'll be using it to create a simple client application for Kafka Streams that will also serve web template page. If you want to know more, take a look at the links at the end of the tutorial or [the Quarkus docs](https://quarkus.io/get-started/).

Apache Kafka describes itself as a "distributed streaming platform" that has three capabilities: 
 1. publish and subscribe to streams of messages;  
 2. store streams of records; and  
 3. process streams of records.

It is designed to do this in a fault-tolerant and scalable fashion. It's similar to an enterprise message queue or a pub/sub server--functions that it can perform very well--however, it combines elements of both, allowing messages to be broadcast to multiple consumers (a feature of typical pub-sub messaging systems) while also allowing processing to be divided up and distributed across a collection of processes (a property of the typical queue system). Further, it runs in a cluster and enables real-time processing of data. The cluster uses a fast TCP protocol to communicate between nodes (producers, consumers, stream processors, and brokers). 

Typical use cases include ([taken from the Apache Kafka docs](https://kafka.apache.org/uses)):

 - messaging, message broker
 - website activity tracking
 - metrics
 - log aggregation
 - stream processing
 - event sourcing
 - commit logging

Think of it as a distributed stream processing and storage network that allows clients to publish, subscribe, and transform data in real-time. 

The Kafka cluster can consist of one or more servers that store **records** in categories called **topics**. Each record has a key, a value, and a timestamp. The Kafka cluster does a ton of fancy work on the back end to keep records ordered and replicated across the cluster. The length of time that Kafka retains records is configurable.

Kafka makes the following guarantees regarding message delivery ([from the Kafka docs](https://kafka.apache.org/intro)):

> - Messages sent by a producer to a particular topic partition will be appended in the order they are sent. That is, if a record M1 is sent by the same producer as a record M2, and M1 is sent first, then M1 will have a lower offset than M2 and appear earlier in the log.
> - A consumer instance sees records in the order they are stored in the log.
> - For a topic with replication factor N, we will tolerate up to N-1 server failures without losing any records committed to the log. 

A **producer** is a client that publishes **records** to one or more **topics** on the cluster.

A **consumer** is a client that reads **records** from one or more **topics** on the cluster.

In this project, you can think of **consumers** and **producers** as clients of the Kafka cluster. Both of these roles will be contained within the Quarkus project. The Quarkus client project will itself contain a REST API and a simple browser template, which itself will be a client for the Quarkus REST API. This potentially a little confusing, so just realize that the Quarkus REST API is itself a client with respect to the Kafka cluster **but also has a client  that accesses it from the browser.** 

Two more terms you'll see that you need to understand are **zookeeper** and **broker**.

A **zookeeper** is a special process in the Kafka cluster that manages and coordinates the cluster. In this tutorial, you won't need to do anything other than make sure this process is running.

A **broker** is a worker node in the cluster. Typically you'll have many nodes distributed geographically to ensure fail-over and network speed. However, here you'll just configure one broker that runs locally.

Both the **consumers** and **producers** connect to the **broker**, which is the worker that accepts **records** to the **topics** and pushes records to subscribed **consumers**. In larger cluster configuration, which may have dozens or hundreds of brokers, the consumers and producers can connect to any of the brokers.

## Overview of Tutorial Steps

This tutorial has a lot going on, so I'm going to give you an overview of the steps before you dive in.

You're going to create a simple, unsecured Quarkus client application. Next you're going to use a free Okta developer account to secure the Quarkus client using OAuth 2.0 and OIDC. After that you're going to use the Qute templating engine to serve a secure, server-side web template. 

Next you're going to download and test Apache Kafka running locally on your machine. You'll then configure the Quarkus client app to send and receive data to and from the Kafka cluster (unsecured). Once you have the cluster working with Quarkus unsecured, you'll move on to securing the cluster.

The next step is to generate the SSL certificates, keystores, and truststores that you need to secure the Kafka cluster and allow the Quarkus client to securely connect to the cluster. Once that's done, you configure the cluster and the client application to use the keystores and truststores. 

Finally, you test the fully secured Kafka Streams client application and Kafka cluster.

In summary:
 - Create the simple, unsecured Quarkus client application
 - Use Okta to configure an OIDC provider
 - Secure Quarkus using OAuth 2.0 & OIDC
 - Use Qute templating in Quarkus
 - Download and test Apach Kafka
 - Configure Quarkus to use Kakfa Streams and test unsecured
 - Generating SSL certs that you'll need to secure Kafka cluster
 - Secure the Kafa cluster to use SSL and JAAS/SASL
 - Test secured Kafka cluster and Quarkus client app

## Install Requirements

**Java 11**: This project uses Java 11. OpenJDK 11 will work just as well. Instructions are found on the [OpenJDK website](https://openjdk.java.net/install/). OpenJDK can also be installed using [Homebrew](https://brew.sh/). Alternatively, [SDKMAN](https://sdkman.io/) is another great option for installing and managing Java versions.

**Maven**: You need Maven installed to bootstrap the project using the `quarkus-maven-plugin`. Install it according to the instructions on [their website](https://maven.apache.org/install.html). Or use SDKMAN or Homebrew (iOS).

Just a hint, if you run `mvn -v`, you’ll see your Maven version **and** the Java version Maven is running on. You'll need to make sure Maven is using the correct version, not just what `java -version` gets you from the command line, which could be different.

**Okta Developer Account**: You’ll be using Okta as an OAuth/OIDC provider to add JWT authentication and authorization to the application. Go to [our developer site](https://developer.okta.com/signup/) and sign up for a free developer account.

## Create a Simple and Secure Quarkus Java Application

Quarkus has a nice Maven plugin, `quarkus-maven-plugin`, that makes bootstrapping new projects easy. Open a terminal and `cd` to an appropriate parent directory for the project. Since you're going to be creating both a Kafka cluster and a Quarkus Java application, as well as a bunch of SSL certs and keyfiles, you might want to make a parent directory named `kafka-quarkus-java` for the whole project. I'll refer to this as the project root path throughout the tutorial. 

You'll notice that we're using Quarkus version `1.3.0.Alpha1`. We're using the alpha version because there is a bug in the current stable release, `1.2.0`, in the OIDC extension, which is what allows Quarkus to use Okta for OAuth 2.0 authorization and OIDC authentication. Take a look at [my bug report on the Quarkus GitHub page](https://github.com/quarkusio/quarkus/issues/7129) for more info. You can also peruse [the OIDC extension docs](https://quarkus.io/guides/security-openid-connect-web-authentication).

Run the following Maven command. This bootstraps our starter project with dependencies for interacting with Kafka, OIDC authentication, and the Qute templating engine. 

This command creates a new directory for the project: `quarkus-client`.
```bash
mvn io.quarkus:quarkus-maven-plugin:1.3.0.Alpha1:create \
-DplatformVersion=1.3.0.Alpha1 -DplatformArtifactId=quarkus-bom \
-DprojectGroupId=com.okta -DprojectArtifactId=quarkus-client \
-DclassName="com.okta.quarkusclient.SecureResource" \
-Dextensions="quarkus-smallrye-reactive-messaging-kafka,oidc,quarkus-resteasy-qute"
```
Open the `quarkus-client` directory with your favorite IDE or editor.

> Side note: If you ever want to update this install command to a stable release version, you may want to remove the `platformArtifactId` parameter as this was added to allow use of the alpha release (the default value is `quarkus-universe-bom`, which doesn't exist in the alpha releases).

## Test the Bootstrapped Quarkus Application

Quarkus at this point doesn't do much, but the bootstrapped application does include a simple endpoint that you can test. Open a terminal and run the following command to start Quarkus:

```bash
./mvnw clean compile quarkus:dev
```

If all goes well, you'll see terminal output ending with something like the following.

```bash
...
2020-02-13 10:07:47,922 INFO  [io.quarkus] (main) quarkus-client2 1.0-SNAPSHOT (running on Quarkus 1.3.0.Alpha1) started in 3.710s. Listening on: http://0.0.0.0:8080
2020-02-13 10:07:47,924 INFO  [io.quarkus] (main) Profile dev activated. Live Coding activated.
2020-02-13 10:07:47,924 INFO  [io.quarkus] (main) Installed features: [cdi, oidc, resteasy, security, smallrye-context-propagation, smallrye-reactive-messaging, smallrye-reactive-messaging-kafka, smallrye-reactive-streams-operators]
```

You can test your auto-generated `/hello` endpoint by opening a browser to [http://localhost:8080/hello](http://localhost:8080/hello).

It should (cunningly) say "hello."

Now that you've got Quarkus ready, it's time to secure it. 

If you ever need or want to, I'll just point out that you can debug Quarkus remotely using:
```bash
./mvnw clean compile quarkus:dev -Ddebug
```

## Create an OIDC Application

You're going to use Okta as your authentication and authorization provider. This leverages two different protocols: Open Authentication 2.0 (OAuth 2.0) and OpenID Connect (OIDC). OIDC is built on top of OAuth 2.0. OAuth 2.0 provides an **authorization** protocol while OIDC provides and **authentication** protocol. Together they provide a complete protocol for securely determining who a client is and what they are allowed to access or what actions they are allowed to perform. 

You’re going to use Okta’s implementation of these protocols as your OAuth 2.0 & OIDC provider.

If you haven’t already, head over to developer.okta.com to sign up for a free account. Once you have an account, open the developer dashboard and create an OpenID Connect (OIDC) application by clicking on the **Applications** top-menu item, and then on the **Add Application** button.

 - Select **Web App** and click **Next** 
 - Change the **Name** to be `Quarkus Client` 
 - Change the **Login redirect URIs** to `http://localhost:8080/`
 - Scroll down and click **Done**

Leave the page open or take note of the **Client ID** and **Client Secret**. You'll need them below.

## Configure Quarkus Application Properties

In your Quarkus client project, open the `src/main/resources/application.properties` file and copy and paste the following into it.

```properties
quarkus.oidc.auth-server-url=https://{yourOktaDomain}/oauth2/default
quarkus.oidc.client-id={yourClientId}
quarkus.oidc.credentials.secret={yourClientSecret}
quarkus.oidc.authentication.scopes=openid,profile 
quarkus.oidc.application-type=web-app
quarkus.oidc.authentication.redirect-path=/
```

You need to fill in three values: 1) your Okta domain in the `auth-server-url`, your client ID, and your client secret. The client ID and client secret are the values from the OIDC application you just created above.

To find your developer URI, open your Okta developer dashboard and navigate to **API** > **Authorization Servers**. Look at the row for the `default` authorization server where you’ll see the **Issuer URI**.

That domain is your Okta URI that you’ll need to populate in place of `{yourOktaDomain}`.

I want to point out one slightly strange thing about how the Quarkus OIDC extension works. The `redirect-path` value is a relative path that has to be a root path in the context path of the application. This means that if your application uses a path structure like `/a/b/c`, the `redirect-path` has to be `/a` or `/a/b`, for example. It cannot be a totally different static path, such as `/oauth/callback`. If you try to use a different path, the extension will just ignore the parameter value and use the full request path. That's why in the properties above you're setting the `redirect-path` to `/`. You need to redirect to an unsecured path that will be able to process the OAuth redirect to receive the code that gets exchanged for JSON web tokens (JWT).

You can read more about it in the [Quarkus OIDC extension docs](https://quarkus.io/guides/security-openid-connect-web-authentication). Search for `quarkus.oidc.authentication.redirect-path`. Or in [this GitHub ticket.](https://github.com/quarkusio/quarkus/issues/5733)

## Create a Secured Quarkus Endpoint

To secure our very simple web endpoint, copy and paste the code below into the `SecureResource.java` file. 

`src/main/java/com/okta/quarkusclient/SecureResource.java`
```java
package com.okta.quarkusclient;

import javax.annotation.security.RolesAllowed;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;

@Path("/secured")
@RolesAllowed({"Everyone"})
public class SecureResource {

    @GET
    @Produces(MediaType.TEXT_PLAIN)
    public String hello() {
        return "secure hello";
    }
}
```

The resource is secured using the `@RolesAllowed` annotation. 

Because `Everyone` is the default group assigned by the Okta auth server to every authenticated user, specifying `Everyone` as the role means that any authenticated user is allowed to access the resource. This is passed from Okta to Quarkus using the `groups` claim in the JWT.

Now it's time to test out the secured endpoint.

In your shell, **Control-C** to end any open Quarkus sessions and restart it with the same command:
```bash
./mvnw clean compile quarkus:dev
```
In a browser, open [http://localhost/secured](http://localhost/secured). You will need to sign out of the Okta developer panel or use a private browser session. Otherwise you'll bypass the sign-in page since you're already signed into Okta.

This time you'll be redirected to the Okta login page, which, if successful, will redirect you back to the `/secured` endpoint.

{% img blog/kafka-streams/kafka_streams_quarkus_image_1.png alt:"Okta Login Page" width:"500" %}{: .center-image }

If all goes well, you'll get a "secure hello."

## Use Qute Templating to Display a Template Page

The next step is to use the Qute templating engine to display a template page. You can check out [the docs on the Quarkus website](https://quarkus.io/guides/qute-reference) for more info later.

Create a template file in the default template directory `src/main/resources/templates`.

`src/main/resources/templates/secured.html`
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Speech</title>
</head>
<body>
<div class="container">
    <h2>Hello, {name}</h2>
</div>
</body>
```

Update `SecuredResource.java`.

`src/main/java/com/okta/quarkusclient/SecureResource.java`
```java
package com.okta.quarkusclient;

import io.quarkus.qute.Template;
import io.quarkus.qute.TemplateInstance;
import org.jboss.logging.Logger;

import javax.annotation.security.RolesAllowed;
import javax.inject.Inject;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.SecurityContext;
import java.security.Principal;

@Path("/secured")
@RolesAllowed({"Everyone"})
public class SecureResource {

    private static final Logger LOG = Logger.getLogger(SecureResource.class);

    @Inject
    Template secured;

    @GET
    @Produces(MediaType.TEXT_HTML)
    public TemplateInstance get(@Context SecurityContext ctx) {
        Principal caller =  ctx.getUserPrincipal();
        String name = caller == null ? "anonymous" : caller.getName();
        LOG.info("name: " + name);
        return secured.data("name", name);
    }
}
```

This simple file demonstrates a few things:

 1. basic logging ('cause you never know)
 2. how to use a template file
 3. how to access user information from the security context

First, the `LOG` variable creates a logger using the default JBoss logging included with Quarkus.

Second, notice that the method is now returning a `TemplateInstance` and that the template is being injected into the resource class using the `@Inject` annotation. It is also marked with  `@Produces(MediaType.TEXT_HTML)`, which tells Quarkus that it is returning HTML.

Finally, you use dependency injection to get the `SecurityContext` from which you can get the `Principal`. This allows you to get the name, which you pass on to the template. You can also inject JWT claims or the whole JSON web token.

Now, test it out.

In your shell, **Control-C** to end any open Quarkus sessions and restart it with the same command:
```bash
./mvnw clean compile quarkus:dev
```

In a browser, open [http://localhost/secured](http://localhost/secured). Don't forget to use a private browser session if you want to re-authenticate.

You should now see our new, somewhat fancier secured template page that says something like, "Hello, your@email.com".

You've secured a very simple Quarkus client application. Time to move on to setting up a secure Kafka cluster.

## Download Apache Kafka

The Apache Kafka cluster you're going to create will have two processes: one zookeeper and one broker. As I explained above, a zookeeper is a special process that coordinates tasks and data across the cluster. Every zoo (or cluster) needs a one zookeeper. Brokers are the processes that your clients connect to. Clusters can have many brokers.

Download Apache Kakfa 2.4.0 from [their download page](https://www.apache.org/dyn/closer.cgi?path=/kafka/2.4.0/kafka_2.12-2.4.0.tgz) and copy it to your base project directory, `kafka-quarkus-java`.

Or use curl:
```bash
curl http://apache.claz.org/kafka/2.4.0/kafka_2.12-2.4.0.tgz --output kafka_2.12-2.4.0.tgz
```

Open a new shell. (You're going to want to have two shells open for Apache Kafka: one for the zookeeper process and one for the broker process).

Un-tar the downloaded file and `cd` into the directory using the following commands:

```bash
tar -xzf kafka_2.12-2.4.0.tgz
cd kafka_2.12-2.4.0
```

Start a zookeeper:
```bash
bin/zookeeper-server-start.sh config/zookeeper.properties
```

Open a second shell and start the broker:
```bash
bin/kafka-server-start.sh config/server.properties
```

If you want to test the Kafka cluster, you can use the commands below to create a test topic and list the topic. They need to be run from the `kafka_2.12-2.4.0` directory.

```bash
# Create a topic named 'test'
bin/kafka-topics.sh --create --bootstrap-server localhost:9092 --replication-factor 1 --partitions 1 --topic test
# List the topics on the cluster
bin/kafka-topics.sh --list --bootstrap-server localhost:9092
```
You should see the `test` topic listed in the output.

Kakfa includes lots of scripts that can be used to test and manipulate the cluster. See [the Kafka quickstart docs](https://kafka.apache.org/quickstart).

## Configure Quarkus to use Kafka Streams

The Kafka Streams application you're going to create will, just for fun, stream the last few paragraphs from George Washington's farewell address. You'll create a producer that sends a new word every 500 milliseconds and a consumer that listens for new words. You'll also have a web template that uses an `EventSource` to subscribe to the updates to the topic via the Quarkus client and displays them in real time.

To get Quarkus talking to Kafka, you need to update `application.properties` and create a couple new files. The first file is a stream generator that will push data to a Kafka streams topic.

Create the following new Java file.

`src/main/java/com/okta/quarkusclient/SpeechGenerator.java`
```java
package com.okta.quarkusclient;

import io.reactivex.Flowable;
import org.eclipse.microprofile.reactive.messaging.Outgoing;
import org.jboss.logging.Logger;

import javax.enterprise.context.ApplicationScoped;
import java.util.concurrent.TimeUnit;

@ApplicationScoped
public class SpeechGenerator {

    private static final Logger LOG = Logger.getLogger(SpeechGenerator.class);

    private Integer index = 0;

    private String[] speech = {"Interwoven","as","is","the","love","of","liberty","with","every","ligament","of","your","hearts,",
            "no","recommendation","of","mine","is","necessary","to","fortify","or","confirm","the","attachment.","The","unity","of",
            "government","which","constitutes","you","one","people","is","also","now","dear","to","you.","It","is","justly","so,","for",
            "it","is","a","main","pillar","in","the","edifice","of","your","real","independence,","the","support","of","your",
            "tranquillity","at","home,","your","peace","abroad,","of","your","safety,","of","your","prosperity,","of","that","very","liberty",
            "which","you","so","highly","prize.","But","as","it","is","easy","to","foresee","that","from","different","causes","and","from",
            "different","quarters","much","pains","will","be","taken,","many","artifices","employed,","to","weaken","in","your","minds","the",
            "conviction","of","this","truth,","as","this","is","the","point","in","your","political","fortress","against","which","the",
            "batteries","of","internal","and","external","enemies","will","be","most","constantly","and","actively","(though","often","covertly",
            "and","insidiously)","directed,","it","is","of","infinite","moment","that","you","should","properly","estimate","the","immense",
            "value","of","your","national","union","to","your","collective","and","individual","happiness;","that","you","should","cherish","a",
            "cordial,","habitual,","and","immovable","attachment","to","it;","accustoming","yourselves","to","think","and","speak","of","it","as",
            "of","the","palladium","of","your","political","safety","and","prosperity;","watching","for","its","preservation","with","jealous",
            "anxiety;","discountenancing","whatever","may","suggest","even","a","suspicion","that","it","can","in","any","event","be","abandoned,",
            "and","indignantly","frowning","upon","the","first","dawning","of","every","attempt","to","alienate","any","portion","of","our","country",
            "from","the","rest","or","to","enfeeble","the","sacred","ties","which","now","link","together","the","various","parts."
    };

    @Outgoing("generated-word")
    public Flowable<String> generate() {
        return Flowable.interval(500, TimeUnit.MILLISECONDS).map(tick -> {
            String nextWord = speech[index];
            index += 1;
            if (index == speech.length) index = 0;
            LOG.info("Next word = " + nextWord);
            return nextWord;
        });
    }

}
```

The next file is the file that subscribes to the stream and makes the stream available as a REST endpoint. Notice that this resource uses `@RequestScoped` and `@RolesAllowed` to secure the stream endpoint. 

`src/main/java/SpeechResource.java`
```java
package com.okta.quarkusclient;

import io.smallrye.reactive.messaging.annotations.Channel;
import org.jboss.resteasy.annotations.SseElementType;
import org.reactivestreams.Publisher;

import javax.annotation.security.RolesAllowed;
import javax.enterprise.context.RequestScoped;
import javax.inject.Inject;
import javax.ws.rs.GET;
import javax.ws.rs.Path;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;

@Path("/words")
@RequestScoped
public class SpeechResource {

    @Inject
    @Channel("words")
    Publisher<String> words;

    @GET
    @Path("/stream")
    @Produces(MediaType.SERVER_SENT_EVENTS)
    @RolesAllowed({"Everyone"})
    @SseElementType("text/plain")
    public Publisher<String> stream() {
        return words;
    }
}
```

Next you need to add the following to your `application.properties`.

```properties
# Configure the Kafka sink (we write to it)  
mp.messaging.outgoing.generated-word.connector=smallrye-kafka
mp.messaging.outgoing.generated-word.topic=words
mp.messaging.outgoing.generated-word.value.serializer=org.apache.kafka.common.serialization.StringSerializer

# Configure the Kafka source (we read from it)  
mp.messaging.incoming.words.connector=smallrye-kafka
mp.messaging.incoming.words.value.deserializer=org.apache.kafka.common.serialization.StringDeserializer
mp.messaging.incoming.words.group-id=kafka-sandbox
```

Finally, update the Qute template file.

`src/main/resources/templates/secured.html`
```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <style>
        body {
            margin: 50px auto;
            width: 800px;
        }
        .content {
            display: inline-block;
        }
    </style>
</head>
<body>
<div>
    <div>
        <h2>Hello, {name}</h2>
        <div><h3>September 19, 1796: George Washington Farewell Address</h3></div>
        <div><span class="content"></span></div>
    </div>
</div>
</body>
<script src="https://code.jquery.com/jquery-3.3.1.min.js"></script>
<script>
    var source = new EventSource("/words/stream");
    var jQuery = $;
    source.onmessage = function (event) {
        var word = event.data;
       jQuery(".content").last().after('<span class="content">'+word+"&nbsp;"+'</span>');
    };
</script>
```
The most interesting part of this file is this bit `var source = new EventSource("/words/stream")`. Here you're creating an event source from the `/words/stream` endpoint you just created in the `SpeechResource` class. This endpoint is protected. However, because the request for the `EventSource` will come from the same browser session as the authenticated request, there is no need to manually pass in the JWT and add it to the token header here.

With that all in place, re-start the Quarkus client. Make sure both your Kafka zookeeper and broker processes are still running and happy.

```bash
./mvnw clean compile quarkus:dev
```

Open a browser and navigate to [http//localhost:8080/secured](http//localhost:8080/secured).

You'll see a new window with your authenticated identity and a stream of words from George Washington's farewell address.

{% img blog/kafka-streams/kafka_streams_quarkus_image_2.png alt:"Secured Page With Streaming Words" width:"800" %}{: .center-image }


At this point, you've got a working Kafka cluster and a Quarkus client. The Quarkus client is secured using OIDC / OAuth 2.0. However, the Kafka cluster isn't secured yet. All communication between the Quarkus client and the Kafka cluster is vulnerable. 

## Create a Secure Kafka Cluster

Now you're going to create a secure Kakfa cluster. The security relies on two layers: encryption via SSL and a JAAS/SSL authentication mechanism. You are most likely already somewhat familiar with SSL (think HTTPS in your browser, more or less). JAAS is Java Authentication and Authorization Service, which is an implementation of SASL, or Simple Authentication and Security Layer. 

I won't go into detail about JAAS and SASL in this tutorial, but take a look at the Oracle docs on [SASL](https://docs.oracle.com/cd/E23824_01/html/819-2145/sasl.intro.20.html) and [JAAS](https://docs.oracle.com/javase/8/docs/technotes/guides/security/jaas/JAASRefGuide.html) for more info. Just understand that they are underlying protocols that Kafka implements to allow for authentication.

Kakfa implements the following SASL mechanism:
- GSSAPI (Kerberos)
- PLAIN
- SCRAM-SHA-256
- SCRAM-SHA-512
- OAUTHBEARER

`GSSAPI/Kerberos` allows Kafka to authenticate using an enterprise authentication server like Active Directory. The next three are password-based authentication mechanisms. `PLAIN` is a plain text password that is stored in plain text on the broker. `SCRAM-SHA` allows Kakfa to authenticate passwords in a more secure manner using Salted Challenge Response Authentication Mechanism (SCRAM). `OAUTHBEARER` allows Kafka to use JSON Web Tokens to authenticate both clients and brokers. 

You're going to use SSL + `PLAIN` in this tutorial. **All three of the password-based SASL mechanisms should be used along with TLS/SSL in production.** Probably all of these should be used with TSL/SSL if you wan to be secure, really.

It may also be worth referring to the [Apache Kafka security documentation](https://kafka.apache.org/documentation/#security) if you want to look deeper. If you're going to use these technologies in production, you should definitely familiarize yourself with the security documentation. 

Kafka also allows for broker-to-broker and client-to-broker connections to be secured separately and distinctly. In this tutorial, you're going to configure broker-to-broker and broker-to-client security the same: TLS/SSL + `PLAIN` password authentication.

## Enable Kafka Encryption and Authentication Using SSL

In this section you're going to generate the SSL certificates and keys that will be used to enable encryption and will be used to authenticate clients and brokers. This is probably the most complicated and intimidating part of the tutorial (if you're not already pretty familiar with SSL certs and `keytool`). I've made it as painless as possible. The [relevant Apache Kafka docs](https://kafka.apache.org/documentation/#security_ssl) are actually pretty helpful as well.

The basic idea is that each machine in the cluster (brokers and clients) will have a public and private key pair as well as a certificate. The certificate identifies the machine. These certificates are signed with a root certificate, or Certificate Authority, which machines can use to verify the certificate. 

Each machine's keystore will contain the root CA certificate as well as the signed certificate that identifies that machine. Each machine's truststore will contain the root CA certificate. This means that each machine **will trust** certificates that have been signed with the root CA and **will not trust** certificates that have not been signed with the root CA. This makes the root CA the keys to the castle, in essence.

In case you don't know, a **keystore** is a Java file used to store certificates and keys that identify a machine. A **truststore** is a Java file that is used to store certificates and keys that the machine should trust (more or less). Thus putting the root CA in the truststore means that the machines will trust all the certs signed with that CA.

Open a shell. 

Make a directory to hold all of your SSL certificates. In production on a server, these would generally end up somewhere like `/var/private/ssl`, but for this tutorial I suggest you put them under the root project directory, somewhere like `kafka-quarkus-java/ssl`.

**Note**: All of the commands below assume your doing everything locally via `localhost`. If that's not the case, you'll need to update the commands below and/or disable host name verification in the brokers by placing the config value `ssl.endpoint.identification.algorithm=` (the value is blank on purpose) in the `server.properites`, `consumer.properties`, and `producer.properties` Kafka config files.

Navigate into the `kafka-quarkus-java/ssl` using `cd`.

Step 1: Create the root CA, simply a certificate and public/private key pair, that will be used to sign the broker and client certs.

```bash
openssl req -new -x509 -keyout ca-key -out ca-cert -days 365 \
-passout pass:test1234 -batch \
-subj "/C=US/ST=Oregon/L=Portlad/O=Okta/CN=CARoot"
```

Step 2: Add the root CA to the server and client truststores. You'll get a chance to inspect the root CA before agreeing to trust it. For each, you will need to type `Y` and press **Enter**.

```bash
keytool -keystore server.truststore.jks -alias CARoot -import -file ca-cert -storepass test1234
```

```bash
keytool -keystore client.truststore.jks -alias CARoot -import -file ca-cert -storepass test1234
```

At this point you've created two Java truststores that contain the root certificate authority that will be used to sign the certificates on the machines. Next you'll create two certificates and sign them with this root CA: one for the client and one for the broker.

Step 3: Create the server keystore with a private key and unsigned certificate.

```bash
keytool -keystore server.keystore.jks -alias server \
-validity 365 -keyalg RSA -genkey -storepass test1234 -ext SAN=DNS:localhost \
-dname "CN=localhost,OU=Kafka-Spring,O=Okta,L=Portland,S=Oregon,C=US"
```

Step 4: Export certificates from server keystore, sign them with the CA cert, and import the signed cert back into the server keystore with the root certificate.

```bash
# Export server cert
keytool -keystore server.keystore.jks -alias server -certreq -file cert-file-server -storepass test1234
# Sign the server cert with the root CA
openssl x509 -req -CA ca-cert -CAkey ca-key -in cert-file-server -out cert-signed-server -days 365 -CAcreateserial -passin pass:test1234
# Import server cert and root CA into server keystore
keytool -keystore server.keystore.jks -alias CARoot -import -file ca-cert -storepass test1234 -noprompt
keytool -keystore server.keystore.jks -alias server -import -file cert-signed-server -storepass test1234 -noprompt
```

Step 5: Create a client keystore with a private key and unsigned certificate.

```bash
keytool -keystore client.keystore.jks -alias client \
-validity 365 -keyalg RSA -genkey -storepass test1234 -ext SAN=DNS:localhost \
-dname "CN=localhost,OU=Kafka-Spring,O=Okta,L=Portland,S=Oregon,C=US"
```

Step 6: Create a client Export the certificates from client keystore, sign them with the CA cert, and import the signed cert back into the client keystore with the root certificate.

```bash
# Export client cert
keytool -keystore client.keystore.jks -alias client -certreq -file cert-file-client -storepass test1234
# Sign the client cert
openssl x509 -req -CA ca-cert -CAkey ca-key -in cert-file-client -out cert-signed-client -days 365 -CAcreateserial -passin pass:test1234
# Import client cert and CA into client keystore
keytool -keystore client.keystore.jks -alias CARoot -import -file ca-cert -storepass test1234 -noprompt
keytool -keystore client.keystore.jks -alias client -import -file cert-signed-client -storepass test1234 -noprompt
```
Now your keystores contain the certificates signed with the root CA.

If you had multiple broker machines, you'd need to create multiple certificates and sign them, one for each machine (repeating steps 3-4 as they are repeated in 5-6 for the client).

Also notice that the keystores and truststores all have their passwords set to `test1234`. You'd clearly want to change this to something else in production.

What's going to happen (to greatly simplify things), is that when the clients or brokers try to talk to each other, they're going to show each other their signed certificates from their keystores, and they're going to use the root CA from their truststores to try and verify the other machine's certificate. If that's successful, they'll accept the identity of the other machine and accept the SSL connection, establishing a encrypted connection.

In the [project GitHub repository](http://need.a.link), there's a script called `create_ssl_directory.sh` that will generate the contents of the `/ssl` directory, including all of the certs, keystores, truststores, and client and server JAAS config files for you.

## Secure the Kafka Cluster Using SSL and JAAS Password Protection

In the `kafka-quarkus-java/ssl` directory, create a new file name `kafka_server_jaas.conf`.

`kafka-quarkus-java/ssl/kafka_server_jaas.conf`
```conf
KafkaServer {
      org.apache.kafka.common.security.plain.PlainLoginModule required
      username="admin"
      password="admin-secret"
      user_admin="admin-secret"
      user_alice="alice-secret";
};
```
This is the JAAS/SASL configuration file that tells Kafka that we are using the plain login module and defines two different usernames and passwords. This file will be passed to Kafka by defining an environmental variable that defines a JVM parameter. You'll need to set this before you run the server again. I'll remind you again later. Its shown below just so you know what I'm talking about.

```
export KAFKA_OPTS=-Djava.security.auth.login.config={yourSslDirectoryPath}/kafka_server_jaas.conf
```

You also need to add some configuration properties to the Kafka `server.properties` file.

Edit `kafka_2.12-2.4.0/config/server.properties`. Add the following to the bottom   

```properties
listeners=SASL_SSL://localhost:9092
security.inter.broker.protocol=SASL_SSL
sasl.mechanism.inter.broker.protocol=PLAIN
sasl.enabled.mechanisms=PLAIN

ssl.keystore.location={yourSslDirectoryPath}/server.keystore.jks
ssl.keystore.password=test1234
ssl.key.password=test1234
ssl.truststore.location={yourSslDirectoryPath}/server.truststore.jks
ssl.truststore.password=test1234
```
In two places, replace `{yourSslDirectoryPath}` with the absolute path to your `kafka-quarkus-java/ssl` directory (or wherever you put the SSL files).

These properties do a number of things. It defines a listener that uses SASL_SSL on port 9092. It also tells Kafka that we want the brokers to talk to each other using SASL_SSL. SASL_SSL is SASL/JAAS using one of the various authentication mechanisms over a secure SSL connection. In this case, both the broker-to-broker and client-to-broker connections are authenticated using SASL PLAIN passwords. That's the first half of the properties above. The second half tell Kafka where to find the keystore and truststore and what the passwords for each are.

Now you need to configure the Kafka producers.

Add the following to the bottom of `kafka_2.12-2.4.0/config/producers.properties`.
```properties
sasl.jaas.config=org.apache.kafka.common.security.plain.PlainLoginModule required username="admin" password="admin-secret";
security.protocol=SASL_SSL
sasl.mechanism=PLAIN
```
You also need to configure the Kafka consumers.

Add the following to the bottom of `kafka_2.12-2.4.0/config/consumers.properties`.
```properties
sasl.jaas.config=org.apache.kafka.common.security.plain.PlainLoginModule required username="admin" password="admin-secret";
security.protocol=SASL_SSL
sasl.mechanism=PLAIN
```
Notice that the producer and consumer configurations are the same. They both use SASL_SSL PLAIN. They also use the PlainLoginModule and specify the admin credentials. You could specify different users and producers and consumers if you wanted to.

That's all the Kafka configuration. You  need to **Control-C** in the broker shell to stop the process and re-start it. However, before you do that, you need to export the environment var that has the path to the JAAS config file.

Make sure you replace `{yourSslDirectoryPath}` in the command below with the absolute path to your `/ssl` directory. 

```bash
export KAFKA_OPTS=-Djava.security.auth.login.config={yourSslDirectoryPath}/kafka_server_jaas.conf
bin/kafka-server-start.sh config/server.properties
```

## Verify Kafka SSL Configuration

Just for fun, at this point, you can use `openssl` to check the SSL configuration on the broker.

```bash
openssl s_client -debug -connect localhost:9092
```

```bash
CONNECTED(00000003)
Can't use SSL_get_servername
depth=1 C = US, ST = Oregon, L = Portlad, O = Okta, CN = CARoot
verify error:num=19:self signed certificate in certificate chain
verify return:1
depth=1 C = US, ST = Oregon, L = Portlad, O = Okta, CN = CARoot
verify return:1
depth=0 C = US, ST = Oregon, L = Portland, O = Okta, OU = Kafka-Spring, CN = localhost
verify return:1
---
Certificate chain
 0 s:C = US, ST = Oregon, L = Portland, O = Okta, OU = Kafka-Spring, CN = localhost
   i:C = US, ST = Oregon, L = Portlad, O = Okta, CN = CARoot
 1 s:C = US, ST = Oregon, L = Portlad, O = Okta, CN = CARoot
   i:C = US, ST = Oregon, L = Portlad, O = Okta, CN = CARoot
---
Server certificate
-----BEGIN CERTIFICATE-----
MIIDQjCCAioCFEtfWH6wgxAR65xslAru21IefJSMMA0GCSqGSIb3DQEBCwUAMFAx
CzAJBgNVBAYTAlVTMQ8wDQYDVQQIDAZPcmVnb24xEDAOBgNVBAcMB1BvcnRsYWQx
DTALBgNVBAoMBE9rdGExDzANBgNVBAMMBkNBUm9vdDAeFw0yMDAyMDcxNzU0NTZa
Fw0yMTAyMDYxNzU0NTZaMGsxCzAJBgNVBAYTAlVTMQ8wDQYDVQQIEwZPcmVnb24x
...
```

You can even pass `openssl s_client` the path to your root CA. Replace `{pathToRootCa}` with the actual path to your root CA cert in the `/ssl` directory.

```bash
openssl s_client -connect localhost:9092 -CAfile {pathToRootCa}/ca-cert
```
```bash
CONNECTED(00000003)
Can't use SSL_get_servername
depth=1 C = US, ST = Oregon, L = Portlad, O = Okta, CN = CARoot
verify return:1
depth=0 C = US, ST = Oregon, L = Portland, O = Okta, OU = Kafka-Spring, CN = localhost
verify return:1
---
Certificate chain
 0 s:C = US, ST = Oregon, L = Portland, O = Okta, OU = Kafka-Spring, CN = localhost
   i:C = US, ST = Oregon, L = Portlad, O = Okta, CN = CARoot
 1 s:C = US, ST = Oregon, L = Portlad, O = Okta, CN = CARoot
   i:C = US, ST = Oregon, L = Portlad, O = Okta, CN = CARoot
---
Server certificate
-----BEGIN CERTIFICATE-----
MIIDQjCCAioCFEtfWH6wgxAR65xslAru21IefJSMMA0GCSqGSIb3DQEBCwUAMFAx
CzAJBgNVBAYTAlVTMQ8wDQYDVQQIDAZPcmVnb24xEDAOBgNVBAcMB1BvcnRsYWQx
DTALBgNVBAoMBE9rdGExDzANBgNVBAMMBkNBUm9vdDAeFw0yMDAyMDcxNzU0NTZa
Fw0yMTAyMDYxNzU0NTZaMGsxCzAJBgNVBAYTAlVTMQ8wDQYDVQQIEwZPcmVnb24x
ETAPBgNVBAcTCFBvcnRsYW5kMQ0wCwYDVQQKEwRPa3RhMRUwEwYDVQQLEwxLYWZr

```

Notice that in the first instance, without the root CA, you get this error:
```bash
verify error:num=19:self signed certificate in certificate chain
```
But in the second instance you don't get this error. That's because you've given `openssl s_client` the root CA to use to verify certificates (in the exact same way that you're giving all of the Kafka clients and brokers the root CA in their truststores).

## Update the Quarkus Client for SSL

At this point your Kafka cluster is secured using SSL and SASL/JAAS PLAIN passwords. If you had multiple brokers they would communicate with each other using SSL and passwords (however, you only have one broker in this case).

You still need to update the Quarkus client. You can try and start the Quarkus client (or re-start) and you'll see that you get an error.

```bash
... INFO  [com.okt.qua.SpeechGenerator] ... Next word = Interwoven
... ERROR [io.sma.rea.mes.kaf.KafkaSink] ... Unable to dispatch message to Kafka ... 
```

To fix this, you need to configure the Kafka client to use SASL SSL.

First create a `kafka_client_jaas.conf` file. Where this ends up in production is a bit of a design decision since it contains passwords, but for the moment, I'd suggest it go in the `/ssl` folder.

`kafka-quarkus-java/ssl/kafka_client_saaf.conf`
```
KafkaClient {
      org.apache.kafka.common.security.plain.PlainLoginModule required
      username="alice"
      password="alice-secret";
};
```

Add the following lines to your Quarkus client `application.properties`.
```properties
# SASL Configuration for Kafka client
mp.messaging.incoming.words.security.protocol=SASL_SSL
mp.messaging.incoming.words.sasl.mechanism=PLAIN

mp.messaging.outgoing.generated-word.security.protocol=SASL_SSL
mp.messaging.outgoing.generated-word.sasl.mechanism=PLAIN

mp.messaging.outgoing.generated-word.ssl.key-password=test1234
mp.messaging.outgoing.generated-word.ssl.keystore.location=${SSL_DIR_PATH}/client.keystore.jks
mp.messaging.outgoing.generated-word.ssl.keystore.password=test1234
mp.messaging.outgoing.generated-word.ssl.truststore.location=${SSL_DIR_PATH}/client.truststore.jks
mp.messaging.outgoing.generated-word.ssl.truststore.password=test1234

mp.messaging.incoming.words.ssl.key-password=test1234
mp.messaging.incoming.words.ssl.keystore.location=${SSL_DIR_PATH}/client.keystore.jks
mp.messaging.incoming.words.ssl.keystore.password=test1234
mp.messaging.incoming.words.ssl.truststore.location=${SSL_DIR_PATH}/client.truststore.jks
mp.messaging.incoming.words.ssl.truststore.password=test1234
```
Note that you're using an environmental variable to set the path to the SSL directory where the client keystore and truststore are located. You need to export this path into your bash shell using the command below (adding in your correct local path). In a real install, this would probably be an absolute path.

```bash
export SSL_DIR_PATH=/path/to/your/ssl/directory <-- NO TRAILING SLASH
```

You can now run the Quarkus client app configured to connect to Kakfa via SSL using the following command. As you did for the broker, you're providing the path to the JAAS config file using a Java property. Maybe this seems like a lot of hoopla, but that file contains a plain text password, so it's best to keep it somewhere safe and out of version control.

Run the client app:

```bash
./mvnw compile quarkus:dev -Djava.security.auth.login.config=$SSL_DIR_PATH/kafka_client_jaas.conf
```
Open a browser to [http://localhost:8080/secured](http://localhost:8080/secured).

You'll now see the now-familiar speech being streamed. But the cluster and the client application are secured.

## Wrapping Up

Great job! You really accomplished a lot on this one. You created a Quarkus Java client application that used Qute templating and Kafka Streams to deliver a stream of real-time data to a browser. You installed and configured a local Apache Kafka cluster. You also secured the Quarkus application using OAuth 2.0 and OIDC with Okta as the OAuth provider. On top of all that, you also secured the Kakfa cluster using SSL and SASL/JAAS. 

That's a lot of pretty exciting technologies--all of it scalable, fault tolerant, and performant. 
