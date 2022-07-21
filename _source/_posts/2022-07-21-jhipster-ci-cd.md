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

## Cointinuous integration for JHipster with CircleCI

<!---
CircleCI account
JHipster circleci config fix
DOCKERHUB_PASS
Notes about CircleCI delete project?
Notes about CircleCI cahe?
--->

## Cointinuous delivery for JHipster with Spinnaker

<!--More about Spinnaker-->

### Spinnaker setup on Google Kubernetes Engine
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

### Configure the store microservice continuous delivery

### Avoiding Spinnaker artifact pains

### Management of secrets in application configuration

### Management of secrets in Kubernetes

## Learn more
