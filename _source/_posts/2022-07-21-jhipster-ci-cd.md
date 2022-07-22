---
layout: blog_post
title: "Continous integration and delivery for JHipster microservices"
author: jimena-garbarino
by: contractor
communities: [devops,security,mobile,.net,java,javascript,go,php,python,ruby]
description: "How to set up continous integration with CircleCI and continuous delivery with Spinnaker in a JHipster microservices architecture"
tags: [java, ci, cd, jhipster]
tweets:
- ""
- ""
- ""
image:
type: awareness
---

<!--
Intro
Logos
Workflow
-->



This tutorial was created with the following frameworks and tools:

- [JHipster 7.8.1](https://www.jhipster.tech/installation/)
- [Java OpenJDK 11](https://jdk.java.net/java-se-ri/11)
- [Okta CLI 0.10.0](https://cli.okta.com)
- [kubectl 1.23](https://kubernetes.io/docs/tasks/tools/#kubectl)
- [k9s v0.25.18](https://k9scli.io/topics/install/)
- [Docker 20.10.12](https://docs.docker.com/engine/install/)

**Table of Contents**{: .hide }
* Table of Contents
{:toc}

## Create a JHipster microservices architecture

If you don't have tried JHipster yet, you can do the classical local installation  with NPM.

```bash
npm install -g generator-jhipster@7
```

If you'd rather use Yarn or Docker, follow the instructions at [jhipster.tech](https://www.jhipster.tech/installation/#local-installation-with-npm-recommended-for-normal-users).

You can also use the example [reactive-jhipster](https://github.com/oktadev/java-microservices-examples/tree/main/reactive-jhipster) from Github, a reactive microservices architecture with Spring Cloud Gateway and Spring WebFlux, Vue as the client framework, and Gradle as the build tool. You can find the complete instructions for building the architecture in the previous post [Reactive Java Microservices with Spring Boot and JHipster](/blog/2021/01/20/reactive-java-microservices).
Create a project folder `jhipster-ci-cd`.

```bash
cd jhipster-ci-cd
http -d https://raw.githubusercontent.com/oktadev/java-microservices-examples/bc7cbeeb1296bd0fcc6a09f4e39f4e6e472a076a/reactive-jhipster/reactive-ms.jdl
jhipster jdl reactive-ms.jdl
```

After the generation, you will find sub-folders were created for the `gateway`, `store` and `blog` services. The `gateway` will act as the front-end application, and a secure router to the `store` and `blog` microservices.

The next step is to generate the Kubernetes deployment descriptors. In the project root folder, create a `kubernetes` directory and run the `k8s` JHipster sub-generator:

```bash
mkdir kubernetes
cd kubernetes
jhipster k8s
```

Choose the following options when prompted:

- Type of application: **Microservice application**
- Root directory: **../**
- Which applications? (select all)
- Set up monitoring? **No**
- Which applications with clustered databases? select **store**
- Admin password for JHipster Registry: (generate one)
- Kubernetes namespace: **demo**
- Docker repository name: (your docker hub username)
- Command to push Docker image: `docker push`
- Enable Istio? **No**
- Kubernetes service type? **LoadBalancer**
- Use dynamic storage provisioning? **Yes**
- Use a specific storage class? (leave empty)

**NOTE**: You must set up the Docker repository name for the cloud deployment, so go ahead and create a [DockerHub](https://hub.docker.com/) personal account, if you don't have one, before running the k8s sub-generator.

We are going to build the `gateway` and `store` in a continuous integration workflow with CircleCI.

## Set up CI for JHipster with CircleCI

<!---
Create a microservices project
CircleCI account
JHipster circleci config fix
DOCKERHUB_PASS
Notes about CircleCI delete project?
Notes about CircleCI cahe?
--->





## Set up CD for JHipster with Spinnaker

<!--More about Spinnaker-->

### Set up Spinnaker on Google Kubernetes Engine
<!---
. install hal
. install gcloud
. install kubectl
. run gcloud info
. create service account for spinnaker deployment
. create the service account for apps deployment
- configure storage
. create docker account
. create github account

--->

### Notes on pipeline design in Spinnaker

### Set up the store microservice pipeline

### Notes on Spinnaker artifact pains

### Manage application secrets

### Manage Kubernetes secrets

## Learn more

As requested by JHipster users, this is another delivery on JHipster deployments.
