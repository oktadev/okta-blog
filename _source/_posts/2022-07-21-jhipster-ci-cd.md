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

First, create the CircleCI cofniguration for the `store` microservice and the `gateway`.

```shell
cd store
jhipster ci-cd
```
```shell
cd gateway
jhipster ci-cd
```

For both applications, choose the following options:
- What CI/CD pipeline do you want to generate? **CircleCI**
- What tasks/integrations do you want to include? (none)

Tweak the generated configuration at `store/.circleci/config.yml` to change the execution environment of the workflow, to a dedicated VM, as that is required by the [TestContainers](https://www.testcontainers.org/supported_docker_environment/continuous_integration/circle_ci) dependency in tests. Also add two more steps, for building the docker container image and pushing the image to DockerHub. As the dedicated VM includes docker, the docker installation step in the configuration can also be removed. The final `config.yml` must look like:

```yml
version: 2.1
jobs:
  build:
    environment:
      IMAGE_NAME: your-dockerhub-user/store
    machine:
      image: ubuntu-2004:current
    resource_class: 2xlarge
    steps:
      - checkout
      - restore_cache:
          keys:
            - v1-dependencies-{{ checksum "build.gradle" }}-{{ checksum "package-lock.json" }}
            # Perform a Partial Cache Restore (https://circleci.com/docs/2.0/caching/#restoring-cache)
            - v1-dependencies-
      - run:
          name: Print Java Version
          command: 'java -version'
      - run:
          name: Print Node Version
          command: 'node -v'
      - run:
          name: Print NPM Version
          command: 'npm -v'
      - run:
          name: Install Node Modules
          command: 'npm install'
      - save_cache:
          paths:
            - node
            - node_modules
            - ~/.gradle
            key: v1-dependencies-{{ checksum "build.gradle" }}-{{ checksum "package-lock.json" }}
      - run:
          name: Give Executable Power
          command: 'chmod +x gradlew'
      - run:
          name: Backend tests
          command: npm run ci:backend:test
      - run:
          name: Build Spring Boot Docker Image
          command: ./gradlew bootBuildImage --imageName=$IMAGE_NAME
      - run:
          name: Publish Docker Image
          command: |
            echo "$DOCKERHUB_PASS" | docker login -u your-dockerhub-user --password-stdin
            docker push $IMAGE_NAME
```

Do the same updates to the `gateway/.circleci/config.yml` file.

To take advantage of the one-step Github integration of CircleCI, you need a [Github](https://github.com/signup) account. After signing in, create a new public repository `store`. Follow the instructions to push the existing repository from your local using the command line. Do the same with the `gateway` project.

[Sign up](https://circleci.com/integrations/github) at CircleCI with your Github account, and on the left menu choose **Projects**. Find the `store` project and click **Set Up Project**. Configure the project to **Use the `.circleci/config.yml` in my repo**.

{% img blog/jhipster-ci-cd/circleci-project.png alt:"CircleCI project setup form" width:"500" %}{: .center-image }

Do the same for the `gateway` project. Before running the pipeline, you must set up DockerHub credentials for both projects, allowing CircleCI to push the container images. At the `store` project page, on the top right, choose **Project Settings**. Then choose **Environment Variables**. Click **Add Environment Variable**. and set the following values:

- Name: DOCKERHUB_PASS
- Value: your DockerHub password, or better, a DockerHub access token if you have 2FA enabled


<!---
CircleCI account
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
