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

Tweak the generated configuration at `store/.circleci/config.yml`, as the following changes are required for a successful execution:
- Change the execution environment of the workflow, to a dedicated VM, as that is required by the [TestContainers](https://www.testcontainers.org/supported_docker_environment/continuous_integration/circle_ci) dependency in tests.
- As the dedicated VM includes docker, the docker installation step in the configuration must be removed
- Add a step for building the docker container image
- Add a step for pushing the image to DockerHub

The final `config.yml` must look like:

```yml
version: 2.1
jobs:
  build:
    environment:
      IMAGE_NAME: your-dockerhub-username/store
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
            echo "$DOCKERHUB_PASS" | docker login -u your-dockerhub-username --password-stdin
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
Once a project is set up in CircleCI, a pipeline is triggered each time a commit is pushed on the branch that has a .circleci/config.yml file included. Once the commit is pushed the running pipeline appears on the **Dashboard**. You can also manually trigger the pipeline from the **Dashboard**, if you choose the project and branch from the pipeline filters, and then click **Trigger Pipeline**.Before moving on to the next section, manually execute the store pipeline and the gateway pipeline once, to push a first image of each to DockerHub.

{% img blog/jhipster-ci-cd/circleci-job-success.png alt:"CircleCI job success" width:"800" %}{: .center-image }

## Install Spinnaker on Google Kubernetes Engine

<!--More about Spinnaker-->

As an overview, Spinnaker installation options:

### Install Halyard
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
As described on Spinnaker [docs](https://spinnaker.io/docs/setup/install/), the first step is to install [Halyard](https://spinnaker.io/docs/setup/install/halyard/). For MacOS:

```shell
curl -O https://raw.githubusercontent.com/spinnaker/halyard/master/install/macos/InstallHalyard.sh
sudo bash InstallHalyard.sh
```
Verify the installation with:

```shell
hal -v
```

You must also install [`kubectl`](https://kubernetes.io/docs/tasks/tools/), the Kubernetes command line too, to run commands against the clusters.

### Choose GKE for Spinnaker deployment

The second step is to choose a cloud provider for the environment in which you will install Spinnaker. For Kubernetes, Spinnaker needs a `kubeconfig` file, to access and manage the cluster. For creating a `kubeconfig` for a GKE cluster, you must first create your GoogleCloud account. There is a [free tier](https://cloud.google.com/free) that grants you $300 in free credits if you are new to GoogleCloud.

After you signed up, install `gcloud` [CLI](https://cloud.google.com/sdk/docs/install). Follow the process to the end, the last step is to run `gcloud init` and set up the authorization for the tool.

Create the cluster for the Spinnaker deployment with the following line:
```shell
gcloud container clusters create spinnaker-cluster \
--zone southamerica-east1-a \
--machine-type n1-standard-4 \
--enable-autorepair \
--enable-autoupgrade
```
Then fetch the cluster credentials with:

```shell
gcloud container clusters get-credentials spinnaker-cluster --zone southamerica-east1-a
```

`get-credentials` will update a kubeconfig file with appropriate credentials and endpoint information to point kubectl at a specific cluster in Google Kubernetes Engine.

Create a namespace for the Spinnaker cluster:

```shell
kubectl create namespace spinnaker
```

The Spinnaker documentation recommends creating a Kubernetes service account, using Kubernetes role definitions that restrict the permissions granted to the Spinnaker account. Create a `spinnaker` directory, and add the file `spinnaker-service-account.yml` with the following content:

```yml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: spinnaker-role
rules:
  - apiGroups: ['']
    resources:
      [
        'namespaces',
        'configmaps',
        'events',
        'replicationcontrollers',
        'serviceaccounts',
        'pods/log',
      ]
    verbs: ['get', 'list']
  - apiGroups: ['']
    resources: ['pods', 'services', 'secrets']
    verbs:
      [
        'create',
        'delete',
        'deletecollection',
        'get',
        'list',
        'patch',
        'update',
        'watch',
      ]
  - apiGroups: ['autoscaling']
    resources: ['horizontalpodautoscalers']
    verbs: ['list', 'get']
  - apiGroups: ['apps']
    resources: ['controllerrevisions']
    verbs: ['list']
  - apiGroups: ['extensions', 'apps']
    resources: ['daemonsets', 'deployments', 'deployments/scale', 'ingresses', 'replicasets', 'statefulsets']
    verbs:
      [
        'create',
        'delete',
        'deletecollection',
        'get',
        'list',
        'patch',
        'update',
        'watch',
      ]
  # These permissions are necessary for halyard to operate. We use this role also to deploy Spinnaker itself.
  - apiGroups: ['']
    resources: ['services/proxy', 'pods/portforward']
    verbs:
      [
        'create',
        'delete',
        'deletecollection',
        'get',
        'list',
        'patch',
        'update',
        'watch',
      ]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: spinnaker-role-binding
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: spinnaker-role
subjects:
  - namespace: spinnaker
    kind: ServiceAccount
    name: spinnaker-service-account
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: spinnaker-service-account
  namespace: spinnaker
```

Then execute the following commands to create the service account in the current context:

```shell
CONTEXT=$(kubectl config current-context)

kubectl apply --context $CONTEXT \
    -f ./spinnaker-service-account.yml


TOKEN=$(kubectl get secret --context $CONTEXT \
   $(kubectl get serviceaccount spinnaker-service-account \
       --context $CONTEXT \
       -n spinnaker \
       -o jsonpath='{.secrets[0].name}') \
   -n spinnaker \
   -o jsonpath='{.data.token}' | base64 --decode)

kubectl config set-credentials ${CONTEXT}-token-user --token $TOKEN

kubectl config set-context $CONTEXT --user ${CONTEXT}-token-user
```
Enable the kubernetes provider in Halyard:

```shell
hal config provider kubernetes enable
```

Add the service account to the Halyard configuration:

```shell
CONTEXT=$(kubectl config current-context)

hal config provider kubernetes account add spinnaker-gke-account \
    --context $CONTEXT
```

### Choose the installation environment

The __Distributed installation__ on Kubernetes deploys each Spinnaker's microservice separately to a remote cloud, and it is the recommended environment for zero-downtime updates of Spinnaker.

Select the distributed deployment with:

```shell
hal config deploy edit --type distributed --account-name spinnaker-gke-account
```

### Choose a storage service

Spinnaker requires an external storage provider for persisting application settings and configured pipelines. To avoid loosing this data, using a hosted storage solution is recommended. For this example, use Google Cloud Storage. Hosting the data externally allows to delete clusters in between sessions, and keep the pipelines once the clusters have been recreated.

In the `spinnaker` folder, run the following lines:

```shell
SERVICE_ACCOUNT_NAME=spinnaker-gcs-account
SERVICE_ACCOUNT_DEST=~/.gcp/gcs-account.json

gcloud iam service-accounts create \
    $SERVICE_ACCOUNT_NAME \
    --display-name $SERVICE_ACCOUNT_NAME

SA_EMAIL=$(gcloud iam service-accounts list \
    --filter="displayName:$SERVICE_ACCOUNT_NAME" \
    --format='value(email)')

PROJECT=$(gcloud config get-value project)

gcloud projects add-iam-policy-binding $PROJECT \
    --role roles/storage.admin --member serviceAccount:$SA_EMAIL

mkdir -p $(dirname $SERVICE_ACCOUNT_DEST)

gcloud iam service-accounts keys create $SERVICE_ACCOUNT_DEST \
    --iam-account $SA_EMAIL

hal config storage gcs edit --project $PROJECT \
    --bucket-location $BUCKET_LOCATION \
    --json-path $SERVICE_ACCOUNT_DEST

hal config storage edit --type gcs    
```

The last `hal` commands edit the storage settings and set the storage source to GCS.

### Deploy Spinnaker

You can verify the deployment configuration with:

```shell
hal config deploy
```

And the storage configuration with:
```shell
hal config storage
```

For deploying the latest Spinnaker version, execute:

```shell
hal deploy apply
```

Even if the hal deploy apply command returns successfully, the installation may not be complete yet. Check if the pods are ready with `k9s`:

```shell
k9s -n spinnaker
```

Then connect to the Spinnaker UI with:

```shell
hal deploy connect
```
Navigate to [localhost:9000](localhost:9000), the UI will look like:

{% img blog/jhipster-ci-cd/spinnaker-ui.png alt:"Spinnaker DeckUI" width:"800" %}{: .center-image }


## Set up CD for a JHipster microservices application

### Choose GKE for applications deployment

In this example, the same cloud provider (GKE) was chosen both for Spinnaker deployment and for application deployment. The following lines are for adding a new Kubernetes account for a different cluster, which will be used for application deployment.

Create a cluster for the JHipster microservices arhitecture:

```shell
gcloud container clusters create jhipster-cluster \
--zone southamerica-east1-a \
--machine-type n1-standard-4 \
--enable-autorepair \
--enable-autoupgrade
```

Fetch the cluster credentials:

```shell
gcloud container clusters get-credentials jhipster-cluster --zone southamerica-east1-a
```

Create the namespace `demo` for the microservices:

```shell
kubectl create namespace demo
```

In the `spinnaker` directory, create the file `jhipster-service-account.yml`:

```yml
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: jhipster-role
rules:
  - apiGroups: ['']
    resources:
      [
        'namespaces',
        'events',
        'replicationcontrollers',
        'serviceaccounts',
        'pods/log',
      ]
    verbs: ['get', 'list']
  - apiGroups: ['']
    resources: ['pods', 'services', 'secrets', 'configmaps', 'persistentvolumeclaims']
    verbs:
      [
        'create',
        'delete',
        'deletecollection',
        'get',
        'list',
        'patch',
        'update',
        'watch',
      ]
  - apiGroups: ['autoscaling']
    resources: ['horizontalpodautoscalers']
    verbs: ['list', 'get']
  - apiGroups: ['apps']
    resources: ['controllerrevisions']
    verbs: ['list']
  - apiGroups: ['extensions', 'apps']
    resources: ['daemonsets', 'deployments', 'deployments/scale', 'ingresses', 'replicasets', 'statefulsets']
    verbs:
      [
        'create',
        'delete',
        'deletecollection',
        'get',
        'list',
        'patch',
        'update',
        'watch',
      ]
  # These permissions are necessary for halyard to operate. We use this role also to deploy Spinnaker itself.
  - apiGroups: ['']
    resources: ['services/proxy', 'pods/portforward']
    verbs:
      [
        'create',
        'delete',
        'deletecollection',
        'get',
        'list',
        'patch',
        'update',
        'watch',
      ]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: jhipster-role-binding
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: jhipster-role
subjects:
  - namespace: demo
    kind: ServiceAccount
    name: jhipster-service-account
---
apiVersion: v1
kind: ServiceAccount
metadata:
  name: jhipster-service-account
  namespace: demo
```

Notice there are some differences with the Spinnaker service account. The k8s manifests generated by JHipster include the creation of `secrets`, `configmaps` and `persistentvolumeclaims`, and the management of those Kubernetes resources must be granted to the service account used by Spinnaker.

Create the Kubernetes `jhipster-service-account`:

```shell
CONTEXT=$(kubectl config current-context)

kubectl apply --context $CONTEXT \
    -f ./jhipster-service-account.yml


TOKEN=$(kubectl get secret --context $CONTEXT \
   $(kubectl get serviceaccount jhipster-service-account \
       --context $CONTEXT \
       -n demo \
       -o jsonpath='{.secrets[0].name}') \
   -n demo \
   -o jsonpath='{.data.token}' | base64 --decode)

kubectl config set-credentials ${CONTEXT}-token-user --token $TOKEN

kubectl config set-context $CONTEXT --user ${CONTEXT}-token-user
```

Add the account to the Halyard configuration:

```shell
CONTEXT=$(kubectl config current-context)

hal config provider kubernetes account add jhipster-gke-account \
    --context $CONTEXT
```

### Add a docker registry account

As the goal is to trigger the pipeline execution when a new image is pushed to DockerHub, you need to configure a docker-registry provider with Halyard. The following `hal config` line will prompt for your password or access token if you have 2FA enabled.

```shell
ADDRESS=index.docker.io
REPOSITORIES="your-dockerhub-username/store your-dockerhub-username/gateway"
USERNAME=your-dockerhub-username

hal config provider docker-registry account add docker-account \
    --address $ADDRESS \
    --repositories $REPOSITORIES \
    --username $USERNAME \
    --password
```

### Add a Github artifact account

The pipeline will deploy k8s manifests from a Github repository, so you must also configure a Github artifact account. First enable Github artifact accounts:

```shell
hal config artifact github enable
```
Generate an access token on Github. Sign in and in the user menu choose **Settings**. Then on the left menu choose **<> Developer settings**. On the left menu choose **Personal access tokens**. Click **Generate new token** and copy the token.

Then add your Github username and set the new token when prompted:

```shell
ARTIFACT_ACCOUNT_NAME=your-github-username

hal config artifact github account add $ARTIFACT_ACCOUNT_NAME \
    --token
```

### Create the store microservice pipeline

The new GKE, Docker and Github accounts configuration created with Halyard in the previous sections must be applied to the deployment before starting the pipeline design:

```shell
hal deploy apply
```

Connect to the Spinnaker UI again:
```shell
hal deploy connect
```
Navigate to [localhost:9000](localhost:9000), and create the store application, choosing Kubernetes as the cloud provider:

{% img blog/jhipster-ci-cd/sp-store-app.png alt:"Spinnaker create application" width:"550" %}{: .center-image }

Then, on the left menu, choose **Pipelines** and click **Configure a new pipeline**. Set a name for the pipeline, for example, _store-cd_.

### Configure the Docker image triggers

In the pipeline configuration, click **Add Trigger**. Set the following configuration for the trigger:

- Type: **Docker Registry**
- Registry Name: **docker-account**
- Organization: **your-dockerhub-username**
- Image: **your-dockerhub-username/store**
- Artifact Constraints: Choose **Define new artifact**

In the _Expected Artifact_ form, set the following values:

- Display Name: **store-image**
- Account: **docker-registry**
- Docker image: Fully qualified **index.docker.io/your-dockerhub-username/store**
- Use prior execution: **yes**
- Use default artifact: **yes** (set the same account and object path as before)

Click **Save Changes**.

{% img blog/jhipster-ci-cd/sp-trigger-artifact.png alt:"Spinnaker pipeline trigger" width:"700" %}{: .center-image }

**IMPORTANT NOTE**: Spinnaker provides a mechanism to [override](https://spinnaker.io/docs/guides/user/kubernetes-v2/deploy-manifest/#override-artifacts) the version of Docker images, Kubernetes ConfigMaps and Secrets in manifests, injecting new versions when one of these objects exist in the pipeline context. However Spinnaker documentation does not have a clear example on the trigger configuration for the artifact to be available in the pipeline context. At this moment, the way to make the artifact available in the context, is to _set it as an artifact constraint in the trigger_. If the artifact constraint is not defined, the original image version in the manifests will be deployed, instead of the newly image that triggered the pipeline. If no version is in the manifests, `latest` will the default.

Add a second Docker registry trigger for the gateway image pushes.


### Configure the deployment stages

The store pipeline will execute the following stages:

- Deploy the application ConfigMap
- Deploy the JHipster Registry
- Deploy the gateway database PostgreSQL
- Deploy the store clustered database MongoDB
- Deploy the gateway microservice
- Deploy the store microservice
- Enable the gateway Service
- Enable the store Service

In the pipeline configuration choose **Add Stage** and set the following values:

- Account: **jhipster-gke-account**
- Override Namespace: **yes**
- Namespace: **demo**
- Manifest Source: **Artifact**
- Manifest Artifact: **Define a new artifact**

 In the artifact fields, set the following values:

 - Account: **your-github-username**
 - Content URL: https://api.github.com/repos/your-github-username/jhipster-k8s/contents/registry-k8s/application-configmap.yml
 - Commit/Branch: **main**

 Click **Save Changes**.
 Repeat the process for adding stages to deploy `jhipster-registry.yml`, `gateway-postgresql.yml`, `store-mongodb.yml` manifests.

Add a stage for the `store-deployment.yml` manifest. For this manifest, you must bind the docker image from the context. In the deploy manifest configuration, in **Required Artifacts to Bind**, choose **store-image**. The option must be available as the image was set as artifact constraint in the trigger configuration, making the artifact available in the pipeline context.

{% img blog/jhipster-ci-cd/sp-bind-artifact.png alt:"Spinnaker deploy manifest configuration binding artifact" width:"700" %}{: .center-image }

Add also a stage for the `gateway-deployment.yml`, binding the `gateway` docker image. Finally add stages for `sstore-service.yml` and `gateway-service.yml`. Notice docker images have to be bound only for the deployment manifests, where the images are referenced.
The complete pipeline must look like:

{% img blog/jhipster-ci-cd/sp-jhipster-pipeline.png alt:"Spinnaker pipeline for jhipster microservices" width:"800" %}{: .center-image }

Test the pipeline manually once. In the pipelines view, click **Start Manual Execution** for the _store-cd_ pipeline. Set the following options:

- Trigger: leave **docker-account: your-dockerhub-username/store**
- Type: **Tag**
- Tag: **latest**

A successful execution will show all stages in green state:

{% img blog/jhipster-ci-cd/sp-pipeline-success.png alt:"Spinnaker pipeline successful execution" width:"800" %}{: .center-image }

With `kubectl` start port-forwarding to the gateway:

```shell
```

Navigate to http://localhost:8080 and sign in to the application with your Okta credentials. Then try creating a `Product`:







### Continuous integration and delivery

Test complete workflow making a small change in the gateway code.



### Notes on pipeline design in Spinnaker

- Rollbacks
- Secrets management
- Manifest versions
- Pipeline as code
- Best practices
- Canary
- E2E testing
- Manual judgements



## Manage Secrets

### Manage application secrets

### Manage Kubernetes secrets

## Learn more

As requested by JHipster users, this is another delivery on JHipster deployments.
