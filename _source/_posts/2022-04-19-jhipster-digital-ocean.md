---
layout: blog_post
title: "JHipster Application Deployment to Digital Ocean Kubernetes"
author: jimena-garbarino
by: contractor
communities: [devops,java]
description: "A step-by-step guide for JHipster deployment to Digital Ocean cloud"
tags: []
tweets:
- ""
- ""
- ""
image:
type: conversion
---

introduction. talk about the survey. mention do.

**This tutorial was created with the following frameworks and tools**:
- [JHipster 7.6.0](https://www.jhipster.tech/installation/)
- [Java OpenJDK 11](https://jdk.java.net/java-se-ri/11)
- [Okta CLI 0.9.0](https://cli.okta.com)


**Table of Contents**{: .hide }
* Table of Contents
{:toc}



## Digital Ocean

## Set up a microservices architecture for Kubernetes

Before working on the application, you need to install JHipster. The classical way of working with JHipster is to do a local installation with NPM, follow the instructions at [jhipster.tech](https://www.jhipster.tech/installation/#local-installation-with-npm-recommended-for-normal-users).

For this tutorial, start from the `reactive-jhipster` example in the `java-microservices-examples` repository on [GitHub](https://github.com/oktadeveloper/java-microservices-examples). The example is a JHipster  reactive microservices architecture with Spring Cloud Gateway and Spring WebFlux, Vue as the client framework and Gradle as the build tool.

```shell
git clone https://github.com/oktadeveloper/java-microservices-examples.git
cd java-microservices-examples/reactive-jhipster
```
If you inspect the project folder, you will find sub-folders for the `gateway` service, which will act as the front-end application, and a gateway to the `store` and `blog` microservices, which also have their subfolders. A `docker-compose` sub-folder contains the service definitions for running the application containers.

The next step is to generate the Kubernetes deployment descriptors. In the project root folder, create a `k8s` directory and run the `k8s` JHipster sub-generator:

```shell
mkdir k8s
cd k8s
jhipster k8s
```

Choose the following options when prompted:

- Type of application: **Microservice application**
- Root directory: **../**
- Which applications? (select all)
- Set up monitoring? **No**
- Which applications with clustered databases? select **store**
- Admin password for JHipster Registry: <generate one>
- Kubernetes namespace: **demo**
- Docker repository name: (your docker hub username)
- Command to push Docker image: `docker push`
- Enable Istio? **No**
- Kubernetes service type? **LoadBalancer**
- Use dynamic storage provisioning? **Yes**
- Use a specific storage class? (leave empty)


**NOTE**: You can leave the Docker repository name blank for running Kubernetes locally, but a repository will be required for the cloud deployment, so go ahead and create a Docker personal account, and the image pull configuration will be ready for both local and cloud deployments.


Build the `gateway`, `store` and `blog` services container images with Jib. For example, for the `gateway` service:

```shell
cd gateway
./gradlew bootJar -Pprod jib -Djib.to.image=<docker-repo-name>/gateway
```

## Configure Okta for authentication

One more configuration step before running the architecture locally, let's configure Okta for authentication.

{% include setup/cli.md type="jhipster" %}

The settings from the generated `.okta.env` must be added to the `k8s/registry-k8s/application-configmap.yml`:

```yml
data:
  application.yml: |-
    ...
    spring:
      security:
        oauth2:
          client:
            provider:
              oidc:
                issuer-uri: https://<your-okta-domain>/oauth2/default
            registration:
              oidc:
                client-id: <client-id>
                client-secret: <client-secret>
```

Enable the OIDC authentication in the `jhiipster-registry` service by adding the `oauth2` profile in the `k8s/registry-k8s/jhipster-registry.yml` file:

```yml
- name: SPRING_PROFILES_ACTIVE
  value: prod,k8s,oauth2
```

## Run locally with Minikube

[Install Minikube](https://minikube.sigs.k8s.io/docs/start/) and [`kubectl`](https://kubernetes.io/docs/tasks/tools/).

For Minkube, you will need at least 2 CPUs. Start MiniKube with your number of CPUs:

```shell
minikube --cpus <ncpu> start
```
Then deploy the application to Minikube, in the `k8s` directory, run:

```shell
./kubectl-apply.sh -f
```



## Deploy to Digital Ocean cloud

### Increase CPU
### Increase Storage

## Secure web traffic with HTTPS
