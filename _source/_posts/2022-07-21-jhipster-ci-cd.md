---
layout: blog_post
title: "Continous Integration and Delivery for JHipster Microservices"
author: jimena-garbarino
by: contractor
communities: [devops,security,java]
description: "How to set up continuous integration with CircleCI and continuous delivery with Spinnaker in a JHipster microservices architecture."
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
What is CircleCI, CI
What is Spinnaker, CD
Workflow
-->
As requested by JHipster users, in this post we cover the basics of how to add continous integration and delivery (CI/CD) for a JHipster microservices architecture and Kubernetes as the target cloud deployment environment.

In a few words, continuous integration is the practice of integrating code into the main branch of a shared repository early and often. Instead of integrating features at the end of a development cycle, code is integrated with the shared repository multiple times throughout the day. Each commit triggers automated tests, so issues are detected and fixed earlier and faster, improving team confidence and productivity. The chosen continuous integration platform is from CircleCI, a company founded in 2011 and headquartered in San Francisco. They offer a free cloud to test their services.

Continuous delivery is the practice of releasing to production often in a fast, safe, and automated way, allowing faster innovation and feedback loops. Its adoption requires the implementation of techniques and tools like Spinnaker, an open-source, multi-cloud, continuous delivery platform that provides application management and deployment features. The intersection between CI and CD is not always clear, but for this example, we assume CI produces and validates the artifacts and CD deploys them. The CI-CD workflow for the exploration of the proposed tools is illustrated below.

{% img blog/jhipster-ci-cd/ci-cd-workflow.png alt:"CI-CD workflow" width:"900" %}{: .center-image }

This tutorial was created with the following frameworks and tools:

- [JHipster 7.8.1](https://www.jhipster.tech/installation/)
- [Java OpenJDK 11](https://jdk.java.net/java-se-ri/11)
- [Okta CLI 0.10.0](https://cli.okta.com)
- [Halyard 1.44.1](https://spinnaker.io/docs/setup/install/halyard/#install-on-debianubuntu-and-macos)
- [kubectl 1.23](https://kubernetes.io/docs/tasks/tools/#kubectl)
- [gcloud CLI 391.0.0](https://cloud.google.com/sdk/docs/install)
- [k9s v0.25.18](https://k9scli.io/topics/install/)
- [Docker 20.10.12](https://docs.docker.com/engine/install/)

**Table of Contents**{: .hide }
* Table of Contents
{:toc}

## Create a JHipster microservices architecture

If you haven't tried JHipster yet, you can do the classical local installation with npm.

```bash
npm install -g generator-jhipster@7.8.1
```

If you'd rather use Yarn or Docker, follow the instructions at [jhipster.tech](https://www.jhipster.tech/installation/#local-installation-with-npm-recommended-for-normal-users).

You can also use the example [reactive-jhipster](https://github.com/oktadev/java-microservices-examples/tree/main/reactive-jhipster) from GitHub, a reactive microservices architecture with Spring Cloud Gateway and Spring WebFlux, Vue as the client framework, and Gradle as the build tool. You can find the complete instructions for building the architecture in the previous post [Reactive Java Microservices with Spring Boot and JHipster](/blog/2021/01/20/reactive-java-microservices).
Create a project folder `jhipster-ci-cd`.

```bash
cd jhipster-ci-cd
http -d https://raw.githubusercontent.com/oktadev/java-microservices-examples/bc7cbeeb1296bd0fcc6a09f4e39f4e6e472a076a/reactive-jhipster/reactive-ms.jdl
jhipster jdl reactive-ms.jdl
```

After the generation, you will find sub-folders were created for the `gateway`, `store`, and `blog` services. The `gateway` will act as the front-end application and a secure router to the `store` and `blog` microservices.

The next step is to generate the Kubernetes deployment descriptors. In the project root folder, create a `kubernetes` directory and run the `k8s` JHipster sub-generator:

```bash
mkdir kubernetes
cd kubernetes
jhipster k8s
```

**NOTE**: You must set up the Docker repository name for the cloud deployment, so go ahead and create a [DockerHub](https://hub.docker.com/) personal account, if you don't have one, before running the k8s sub-generator.

Choose the following options when prompted:

- Type of application: **Microservice application**
- Root directory: **../**
- Which applications? (select all)
- Set up monitoring? **No**
- Which applications with clustered databases? select **store**
- Admin password for JHipster Registry: (generate one)
- Kubernetes namespace: **demo**
- Docker repository name: **your-dockerhub-username**
- Command to push Docker image: `docker push`
- Enable Istio? **No**
- Kubernetes service type? **LoadBalancer**
- Use dynamic storage provisioning? **Yes**
- Use a specific storage class? (leave empty)

### Configure Okta for OIDC authentication

One more configuration step before building the applications, let's configure Okta for authentication. You must run the commands at the root folder of the project.

{% include setup/cli.md type="jhipster" %}

Add the settings from the generated `.okta.env` to `kubernetes/registry-k8s/application-configmap.yml`:

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

Enable the OIDC authentication in the `jhipster-registry` service by adding the `oauth2` profile in the `kubernetes/registry-k8s/jhipster-registry.yml` file:

```yml
- name: SPRING_PROFILES_ACTIVE
  value: prod,k8s,oauth2
```

We are going to build the `gateway` and `store` in a continuous integration workflow with CircleCI.

## Set up CI for JHipster with CircleCI

First, create the CircleCI configuration for the `store` microservice and the `gateway`.

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

You must tweak the generated configuration at `store/.circleci/config.yml`, as the following changes are required for successful execution:
- Change the execution environment of the workflow, to a dedicated VM, as that is required by the [TestContainers](https://www.testcontainers.org/supported_docker_environment/continuous_integration/circle_ci) dependency in tests.
- As the dedicated VM includes docker, the docker installation step in the configuration must be removed
- Add a step for building the docker container image
- Add a step for pushing the image to DockerHub

The final `config.yml` must look like this:

```yml
version: 2.1
jobs:
  build:
    environment:
      IMAGE_NAME: your-dockerhub-username/store
    machine:
      image: ubuntu-2004:current
    resource_class: large
    steps:
      - checkout
      - restore_cache:
          keys:
            {%raw%}- v1-dependencies-{{ checksum "build.gradle" }}-{{ checksum "package-lock.json" }}{%endraw%}
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
            key: {%raw%}v1-dependencies-{{ checksum "build.gradle" }}-{{ checksum "package-lock.json" }}{%endraw%}
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
            docker login -u your-dockerhub-username -p $DOCKERHUB_PASS
            docker push $IMAGE_NAME
```

Do the same updates to the `gateway/.circleci/config.yml` file. Be sure to replace `your-dockerhub-username` and set the correct `IMAGE_NAME`.

To take advantage of the one-step GitHub integration of CircleCI, you need a [GitHub](https://github.com/signup) account. After signing in to GitHub, create a new public repository `store`. Follow the instructions to push the existing repository from your local machine to GitHub using the command line. Do the same with the `gateway` project.

[Sign up](https://circleci.com/integrations/github) at CircleCI with your GitHub account, and on the left menu choose **Projects**. Find the `store` project and click **Set Up Project**. Configure the project to use the **Fastest** option (Use the `.circleci/config.yml` in my repo) and type `main` for the branch. Click **Set Up Project** to continue.

{% img blog/jhipster-ci-cd/circleci-project.png alt:"CircleCI project setup form" width:"450" %}{: .center-image }

Do the same for the `gateway` project. The configuration triggers an initial pipeline execution that will fail, because you still must set up DockerHub credentials for both projects, allowing CircleCI to push the container images. At the `store` project page, on the top right, choose **Project Settings**. Then choose **Environment Variables**. Click **Add Environment Variable**. and set the following values:

- Name: DOCKERHUB_PASS
- Value: your DockerHub password, or better, a DockerHub access token if you have 2FA enabled.

**Note**: For creating a DockerHub access token, sign in to [DockerHub](https://hub.docker.com/), and choose **Account Settings** in the top right user menu. Then, on the left menu, choose **Security**. Click **New Access Token** and set a description for the token, for example, _circleci_. Then click **Generate** and copy the new token. You can use the same token for both projects `store` and `gateway`.

Once a project is set up in CircleCI, a pipeline is triggered each time a commit is pushed to the configured branch. The pipeline in execution appears on the **Dashboard** page. You can also manually trigger the pipeline from the **Dashboard** if you choose the project and branch from the pipeline filters, and then click **Trigger Pipeline**. Before moving on to the next section, manually execute the store pipeline and the gateway pipeline once, to push the first image of each to DockerHub.

{% img blog/jhipster-ci-cd/circleci-job-success.png alt:"CircleCI job success" width:"800" %}{: .center-image }

## Install Spinnaker on Google Kubernetes Engine

Spinnaker supports the following installation environments:
- Distributed installation on Kubernetes
- Local installation of Debian packages
- Local git installation from GitHub

For this example, the distributed alternative was selected. But before the installation, learn about some key concepts in Spinnaker configuration.

### Understand Spinnaker artifacts and accounts

A _Spinnaker artifact_ is a named JSON object that refers to an external resource, for example, a docker image or a file stored in GitHub. In a pipeline trigger, you can specify an _expected artifact_, and Spinnaker will compare the incoming artifact from the trigger and bind it to be used by the trigger or another stage in the pipeline.
Also in Kubernetes, the deployed manifests can be provided statically or as an artifact. In this example, manifests are provided as artifacts stored in GitHub.

For Spinnaker to access and act on resources, like Docker registries, cloud providers, and code repositories, different types of accounts must be enabled in the Spinnaker configuration, along with the credentials. In addition, the configuration has the optional step of associating Spinnaker with a Kubernetes service account, allowing you to restrict permissions over the cluster resources granted to Spinnaker.

### Install Halyard

As described in Spinnaker [docs](https://spinnaker.io/docs/setup/install/), the first step is to install [Halyard](https://spinnaker.io/docs/setup/install/halyard/). For a local install in MacOS:

```shell
curl -O https://raw.githubusercontent.com/spinnaker/halyard/master/install/macos/InstallHalyard.sh
sudo bash InstallHalyard.sh
```
Verify the installation with:

```shell
hal -v
```

You must also install [`kubectl`](https://kubernetes.io/docs/tasks/tools/), the Kubernetes command line tool, to run commands against the clusters.

### Choose GKE for Spinnaker deployment

The second step is to choose a cloud provider for the environment in which you will install Spinnaker. For Kubernetes, Spinnaker needs a `kubeconfig` file, to access and manage the cluster. For creating a `kubeconfig` for a GKE cluster, you must first create the cluster. Google Cloud provides a [free tier](https://cloud.google.com/free) of their services that grants you $300 in free credits if you are a new user.

After you sign up, install [`gcloud` CLI](https://cloud.google.com/sdk/docs/install). When you reach the end of the process, the last step is to run `gcloud init` and set up authorization for the tool.

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

`get-credentials` will update a `kubeconfig` file with appropriate credentials and endpoint information to point `kubectl` at a specific cluster in Google Kubernetes Engine.

Create a namespace for the Spinnaker cluster:

```shell
kubectl create namespace spinnaker
```

The Spinnaker [documentation](https://spinnaker.io/docs/setup/install/providers/kubernetes-v2/#optional-create-a-kubernetes-service-account) recommends creating a Kubernetes service account, using Kubernetes role definitions that restrict the permissions granted to the Spinnaker account. Create a `spinnaker` directory, and add the file `spinnaker-service-account.yml` with the following content:

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
  # These permissions are necessary for Halyard to operate. We use this role also to deploy Spinnaker itself.
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
Enable the Kubernetes provider in Halyard:

```shell
hal config provider kubernetes enable
```
Note: You will see warnings related to missing configuration. Be patient, in the following steps all will be solved.

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

Spinnaker requires an external storage provider for persisting application settings and configured pipelines. To avoid losing this data, using a hosted storage solution is recommended. For this example, we use Google Cloud Storage. Hosting the data externally allows us to delete clusters in between sessions, and keep the pipelines once the clusters have been recreated.

In the `spinnaker` folder, run the following code:

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

BUCKET_LOCATION=us

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

List the available Spinnaker versions:

```shell
hal version list
```

Set the version for the deployment with:

```shell
hal config version edit --version 1.27.0
```

Deploy Spinnaker to GKE:

```shell
hal deploy apply
```

Even if `hal deploy apply` returns successfully, the installation may not be complete yet. Check if the pods are ready with `k9s`:

```shell
k9s -n spinnaker
```

A healthy Spinnaker deployment will look like this:

{% img blog/jhipster-ci-cd/spinnaker-k9s.png alt:"Spinnaker k9s view" width:"800" %}{: .center-image }

You can connect to the Spinnaker UI using the following command:

```shell
hal deploy connect
```
Navigate to `http://localhost:9000` and the UI should load. The **Projects** tab should look like the screenshot below.

{% img blog/jhipster-ci-cd/spinnaker-ui.png alt:"Spinnaker DeckUI" width:"800" %}{: .center-image }

## Set up CD for a JHipster microservices application

Spinnaker is multi-cloud because it can manage delivery to multiple cloud providers. Some companies use different platforms for production and test environments. In this example, the same cloud provider (GKE) was chosen both for Spinnaker deployment and for the application test deployment.

### Choose GKE for applications deployment

Now I'll show you how to add a new Kubernetes account for a different cluster, which will be used for application deployment.

Create a cluster for the JHipster microservices architecture:

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

Create the namespace `demo` for your microservices:

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
  # These permissions are necessary for Halyard to operate. We use this role also to deploy Spinnaker itself.
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

Notice there are some differences with the Spinnaker service account. The k8s manifests generated by JHipster include the creation of `secrets`, `configmaps`, and `persistentvolumeclaims`, and the management of those Kubernetes resources must be granted to the service account used for deploying the JHipster k8s manifests.

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

### Add a Docker registry account

As the goal is to trigger the pipeline execution when a new image is pushed to DockerHub, you need to configure a docker-registry provider with Halyard.

First, enable the docker-registry provider:

```shell
hal config provider docker-registry enable
```

The following `hal config` line will prompt for your password or access token if you have 2FA enabled. Make sure to replace `your-dockerhub-username`.

```shell
ADDRESS=index.docker.io
USERNAME=your-dockerhub-username

hal config provider docker-registry account add docker-account \
    --address $ADDRESS \
    --repositories $USERNAME/store $USERNAME/gateway \
    --username $USERNAME \
    --password
```

### Add a GitHub artifact account

The pipeline will deploy k8s manifests from a GitHub repository, so you must also configure a GitHub artifact account. First, enable the feature:

```shell
hal config artifact github enable
```
Generate an access token on GitHub. Sign in, and in the user menu choose **Settings**. Then on the left menu choose **Developer settings**. On the left menu choose **Personal access tokens**. Click **Generate new token** and copy the token.

Then add your GitHub username and set the new token when prompted:

```shell
ARTIFACT_ACCOUNT_NAME=your-github-username

hal config artifact github account add $ARTIFACT_ACCOUNT_NAME \
    --token
```

The new GKE, Docker, and GitHub account configurations must be applied to the deployment before starting the pipeline design:

```shell
hal deploy apply
```

### Create the store microservice pipeline

The _pipeline_ is the central concept in deployment management with Spinnaker. It is compounded by a sequence of actions, named _stages_. A pipeline can be triggered manually or automatically, and have an execution history. Connect to the Spinnaker UI again to create the first pipeline.

```shell
hal deploy connect
```

Navigate to `https://localhost:9000` > **Applications**. In the steps below, you'll create a store application and choose Kubernetes as the cloud provider. Click **Create Application** and set the following values:

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

Click **Save Artifact**.

{% img blog/jhipster-ci-cd/sp-trigger-artifact.png alt:"Spinnaker pipeline trigger" width:"700" %}{: .center-image }

**IMPORTANT NOTE**: Spinnaker provides a mechanism to [override](https://spinnaker.io/docs/guides/user/kubernetes-v2/deploy-manifest/#override-artifacts) the version of Docker images, Kubernetes ConfigMaps, and Secrets in manifests, injecting new versions when one of these objects exists in the pipeline context. However, Spinnaker documentation does not have a clear example of the trigger configuration for the Docker image to be available in the pipeline context. To make it happen, you must _set it as an artifact constraint in the trigger_. If the artifact constraint is not defined, the original image version in the manifests will be deployed, instead of the new image that triggered the pipeline. If no version is in the manifests, `latest` will be the default.

Add a second Docker registry trigger for the gateway image pushes and click **Save Changes**.  

### Configure the deployment stages

The store pipeline will execute the following stages:

- Deploy the application ConfigMap
- Deploy the JHipster Registry
- Deploy the gateway database PostgreSQL
- Deploy the store clustered database MongoDB
- Deploy the gateway microservice
- Deploy the store microservice
- Enable the gateway service
- Enable the store service

The Kubernetes configuration created in the folder `jhipster-ci-cd/kubernetes` must be pushed to a GitHub repository, so Spinnaker can access it using the GitHub artifact account created earlier. But before you push, edit `kubernetes/store-k8s/store-deployment.yml` and set the image name with the fully qualified address:

```yml
- name: store-app
  image: index.docker.io/indiepopart/store
```
Do the same for `kubernetes/gateway-k8s/gateway-deployment.yml`. This is also required for the artifact substitution to work.

Sign in to GitHub and create a public repository `jhipster-k8s`. Follow the instructions to push the existing `kubernetes` folder from your local using the command line.

**IMPORTANT NOTE**: At this point, you will be pushing plain secrets contained in the application and Kubernetes configuration. To avoid this insecure anti-pattern, you can run the JHipster registry locally to encrypt application configuration, and also set up `kubeseal` for Kubernetes secrets encryption. The process is described in a previous post: [Kubernetes to the Cloud with Spring Boot and JHipster](/blog/2021/06/01/kubernetes-spring-boot-jhipster).

Go back to Spinnaker UI, and in the pipeline configuration choose **Add Stage** and set the following values:

- Type: **Deploy (Manifest)**
- Stage Name: **deploy application-configmap**
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
 Repeat the process for adding stages to deploy `jhipster-registry.yml`, which must depend on the previous manifest. Also repeat for `gateway-postgresql.yml`, `store-mongodb.yml` manifests, which both should depend on the `jhipster-registry` stage.

Add a stage for the `store-deployment.yml` manifest. For this manifest, you must bind the Docker image from the context. In the deploy manifest configuration, in **Required Artifacts to Bind**, choose **store-image**. The option must be available, as the image was set as an artifact constraint in the trigger configuration, making the artifact available in the pipeline context.

{% img blog/jhipster-ci-cd/sp-bind-artifact.png alt:"Spinnaker deploy manifest configuration binding artifact" width:"700" %}{: .center-image }

Also add a stage for the `gateway-deployment.yml`, binding the `gateway` Docker image. Finally, add stages for `store-service.yml` and `gateway-service.yml`. Notice Docker images have to be bound only for the deployment manifests, where the images are referenced.
The complete pipeline must look like this:

{% img blog/jhipster-ci-cd/sp-jhipster-pipeline.png alt:"Spinnaker pipeline for jhipster microservices" width:"800" %}{: .center-image }

Test the pipeline manually once. Go to **Pipelines** and select **Start Manual Execution** for the _store-cd_ pipeline. Set the following options:

- Trigger: leave **docker-account: your-dockerhub-username/store**
- Type: **Tag**
- Tag: **latest**

Successful execution will show all stages in a green state:

{% img blog/jhipster-ci-cd/sp-pipeline-success.png alt:"Spinnaker pipeline successful execution" width:"800" %}{: .center-image }


Get the external IP of the gateway:

```shell
kubectl get svc gateway -n demo
```

Update the redirect URIs in Okta to allow the gateway address as a valid redirect. Run `okta login`, open the returned URL in your browser, and sign in to the Okta Admin Console. Go to the **Applications** section, find your application, edit, and add:
- Sign-in redirect URIs: `http://<external-ip>:8080/login/oauth2/code/oidc`
- Sign-out redirect URIs: `http://<external-ip>:8080`

Navigate to `http://<external-ip>:8080` and sign in to the application with your Okta credentials. Then try creating a `Product`:

{% img blog/jhipster-ci-cd/app-create-product.png alt:"Create a product in the store application" width:"800" %}{: .center-image }

### Trigger the CI-CD pipeline with a GitHub push

For testing the workflow, make a code change in the gateway. Edit `src/main/webapp/content/scss/_bootstrap-variables.scss` and update the following variable:

```scss
$body-bg: steelblue;
```
Also, the pipeline under test will only trigger if a new image tag is detected. So edit `.circleci/confg.yml` and update the image name:

```yml
IMAGE_NAME: indiepopart/gateway:v1
```

Commit and push the change to the `main` branch, and watch the CircleCI CI pipeline triggers. After the new gateway image is pushed to DockerHub, watch the Spinnaker CD pipeline trigger and deploy the updated gateway. On the left menu choose **Clusters**, and verify the active gateway deployment now has a _V002_. If you click over the **V002** box, you can also verify the image tag that was deployed.

{% img blog/jhipster-ci-cd/sp-version-2.png alt:"Spinnaker deployment version 2" width:"800" %}{: .center-image }

### Inspect Spinnaker logs

For pipeline and trigger debugging, the Spinnaker services `spin-echo` and `spin-igor` inform Docker monitoring events and indicate the reasons why an execution was skipped.

```shell
kubectl get pods -n spinnaker
kubectl logs spin-igor-7c8bdd94f5-lx5dl -n spinnaker | grep v1
```
```text
2022-08-05 03:20:27.285  INFO 1 --- [   scheduling-1] c.n.spinnaker.igor.docker.DockerMonitor  : Found 1 new images for docker-account. Images: [{imageId=igor:dockerRegistry:v2:docker-account:indiepopart/gateway:v1, sendEvent=true}]
2022-08-05 03:20:27.286  INFO 1 --- [   scheduling-1] c.n.spinnaker.igor.docker.DockerMonitor  : New tagged image: account=docker-account, image=igor:dockerRegistry:v2:docker-account:indiepopart/gateway:v1. Digest is now [null].
2022-08-05 03:20:27.288  INFO 1 --- [   scheduling-1] c.n.spinnaker.igor.docker.DockerMonitor  : Sending tagged image info to echo: account=docker-account: image=igor:dockerRegistry:v2:docker-account:indiepopart/gateway:v1
```

## Spinnaker features and best practices  

When implementing continuous delivery, here are some best practices and key features to be aware of:

- **Deploy Docker images by digest**: Spinnaker documentation recommends deploying images by digest instead of tag, because the tag might reference different content each time. The digest is a content-based hash of the image and it uniquely identifies it. Spinnaker's artifact substitution allows deploying the same manifest, with the image digest supplied by the pipeline trigger. Using the proposed trigger and a free DockerHub account as the registry, the digest data seems not to be available. It is also recommended to trigger a CD pipeline off of a push to a Docker registry instead of a GitHub push or Jenkins job, allowing development teams to choose their delivery process without more constraints.
- **Rollbacks**: Just as there is a stage for deploying manifests, there are also stages for deleting, scaling, and rollbacking manifests. Spinnaker also supports automated rollbacks, as it exposes the _Undo Rollout_ functionality as a stage, which can be configured to run when other stages fail, and to roll back by a number of revisions of the deployed object. ConfigMaps and Secrets must be versioned for the automated rollback to actually roll back code or configuration.
- **Manual judgments** The pipeline can include a manual judgment stage, that will make the execution interrupt, asking for user input to continue or cancel. This can be used to ask for confirmation before promoting a staging deployment to production.
- **Pipeline management**: Spinnaker represents pipelines as JSON behind the scenes, and maintains a revision history of the changes made to the pipeline. It also supports pipeline templates, that can be managed through the `spin CLI`, and help with pipeline sharing and distribution.
- **Canary**: You can automate Canary analysis by creating canary stages for your pipeline. Canary must be enabled in the Spinnaker installation using `hal` commands. The Canary analysis consists of the evaluation of metrics chosen during configuration, comparing a partial rollout with the current deployment. The stage will fail based on the deviation criteria configured for the metric.
- **Secrets management** Spinnaker does not directly support secrets management. Secrets should be encrypted at rest and in transit. Credentials encryption for application secrets and Kubernetes secrets was covered in a recent post [Kubernetes to the Cloud with Spring Boot and JHipster](/blog/2021/06/01/kubernetes-spring-boot-jhipster).
- **Rollout strategies**: The Spinnaker Kubernetes provider supports running dark, highlander, and red/black rollouts. In the Deploy Manifest stage, there is a strategy option that allows associating workload to a service, sending traffic to it, and choosing how to handle any previous versions of the workload in the same cluster and namespace.

## Learn more

By popular demand, this article looks at the nuts and bolts of JHipster deployments. CI and CD propose several organizational and technical practices aimed at improving team confidence, efficiency, and productivity. Spinnaker is a powerful tool for continuous deployment, with more than 200 [companies](https://spinnaker.io/docs/community/stay-informed/captains-log/#contributions-per-company) around the world contributing to its growth. As each architecture and organization is different, your pipeline design must be customized to your particular use case. I hope this brief introduction will help you get the most out of these wonderful tools. To learn more about JHipster check out the following links:

- [JHipster Microservices on AWS with Amazon Elastic Kubernetes Service](/blog/2022/07/11/kubernetes-jhipster-aws)
- [Run Microservices on DigitalOcean with Kubernetes](/blog/2022/06/06/microservices-digitalocean-kubernetes)
- [Kubernetes Microservices on Azure with Cosmos DB](/blog/2022/05/05/kubernetes-microservices-azure)
- [Kubernetes to the Cloud with Spring Boot and JHipster](/blog/2021/06/01/kubernetes-spring-boot-jhipster)

Be sure to follow us on [Twitter](https://twitter.com/oktadev) and subscribe to our [YouTube Channel](https://youtube.com/c/oktadev) so that you never miss any of our excellent content!
