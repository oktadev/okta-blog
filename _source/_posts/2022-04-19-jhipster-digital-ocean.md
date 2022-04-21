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
Now it is a good time to install [k9s](https://k9scli.io/topics/install/), a terminal based UI to interact with Kubernetes clusters. Then run k9s with:

```shell
k9s -n demo
```

{% img blog/jhipster-digital-ocean/k9s-UI.png alt:"k9s UI" width:"800" %}{: .center-image }

Checkout the [commands list](https://k9scli.io/topics/commands/), some useful ones are:
- `:namespace`: show all available namespaces
- `:pods`: show all available pods
You can navigate the pods with `ENTER` and go back with `ESC` keys.

Set up port-forwarding for the the JHipster Registry.

```shell
kubectl port-forward svc/jhipster-registry -n demo 8761
```

Navigate to http://localhost:8761 and sign in with your Okta credentials. When the registry shows all services in green, Set up port-forwarding for the gateway as well.

```shell
kubectl port-forward svc/gateway -n demo 8080
```

Navigate to http://localhost:8080, sign in, and create some entities to verify everything is working fine.

After looking around, stop minikube before the cloud deployment:

```shell
minikube stop
```


## Deploy to Digital Ocean cloud

Now that the architecture works locally, let's proceed to the cloud deployment. First, create a [Digital Ocean](https://cloud.digitalocean.com/registrations/new) account, you can try their services with $100 credit that is available for 60 days.

Most of the cluster tasks, if not all, can be accomplished using [doctl](https://github.com/digitalocean/doctl#installing-doctl), the command-line interface (CLI) for the Digital Ocean API.

Install the tool, and perform the authentication with Digital Ocean:

```shell
doctl auth init
```
You will be prompted to enter the DigitalOcean access token that you can generate in the DigitalOcean control panel.

{% img blog/jhipster-digital-ocean/do-control-panel-token.png alt:"Digital Ocean Control Panel for Token Create" width:"800" %}{: .center-image }

You can find a detailed list of pricing for cluster resources at [Digital Ocean](https://docs.digitalocean.com/products/kubernetes/),  and with `doctl` you can quickly retrieve a list of node size options available for your account:

```shell
 doctl k options sizes
 ```

 **NOTE**: I tested the cluster with the higher size Intel nodes available for my account, `s-2vcpu-4gb-intel`, in an attempt to run the application in the default cluster configuration, a three-node cluster with a single node pool in the nyc1 region, using the latest Kubernetes version. As I started to see pods not starting due to "insufficient CPU", I increased the number of nodes.

 Create the cluster with the following command line:

 ```shell
 doctl k cluster create do1 -v --size s-2vcpu-4gb-intel
 ```
 After creating a cluster, `doctl` adds a configuration context to kubectl and makes it active, so start monitoring your cluster right away with k9s. But fist, some tweaks to the Kubernetes descriptors are required.

Digital Ocean latest and default Kubernetes version at the moment of writing this tutorial is 1.22.8. For the `store-mongodb` deployment to work in Digital Ocean, the property `Service.spec.publishNotReadyAddresses `, instead of the annotation `service.alpha.kubernetes.io/tolerate-unready-endpoints`, as it was deprecated in [release 1.11](https://github.com/kubernetes/kubernetes/blob/master/CHANGELOG/CHANGELOG-1.11.md#kubernetes-111-release-notes). For some reason, the generated spec worked in the local minikube deployment with a newer Kubernetes version, but not in Digital Ocean.

In the k8s folder, edit `store-mongodb.yml` and add the `publishNotReadyAddresses: true` property to the `spec`:

```yml
# Headless service for DNS record
apiVersion: v1
kind: Service
metadata:
  name: store-mongodb
  namespace: demo
spec:
  type: ClusterIP
  clusterIP: None
  publishNotReadyAddresses: true
  ports:
    - name: peer
      port: 27017
  selector:
    app: store-mongodb
```

Apply the resources configuration to the Digital Ocean cluster:

```shell
./kubectl-apply.sh -f
```

Monitor the deployment with k9s again:

 ```shell
 k9s -n demo
 ```

{% img blog/jhipster-digital-ocean/k9s-do-cluster.png alt:"k9s user interface monitoring digital ocean Kubernetes" width:"800" %}{: .center-image }

Once you see the jhipster-registry pods are up, set up port forwarding again if you want to monitor the services status there.


### Increase CPU

The three-node cluster might not provide enough CPU for this microservices architecture, so you might see `insufficient CPU` logs for some pods. You can get the pod events with `kubectl describe`:

```shell
kubectl describe pod jhipster-registry-0 -n demo
```
```text
Events:
  Type    Reason     Age   From               Message
  ----    ------     ----  ----               -------
  Normal  Scheduled  39m   default-scheduler  Successfully assigned demo/jhipster-registry-0 to do3-default-pool-cq7c1
  Normal  Pulled     39m   kubelet            Container image "jhipster/jhipster-registry:v7.2.0" already present on machine
  Normal  Created    39m   kubelet            Created container jhipster-registry
  Normal  Started    39m   kubelet            Started container jhipster-registry
```
Increase the number of nodes with `doctl`:

```shell
doctl k cluster node-pool update do1 do1-default-pool --count 5
```

### Increase Storage

For the `store-mongodb` stateful set with 3 replicas, some of the pods did not run due to _unbound immediate PersistentVolumeClaims_. When inspecting the pod events, I found out there was a failure in volume provisioning:

```text
Events:
  Type     Reason                Age                  From                                                                       Message
  ----     ------                ----                 ----                                                                       -------
  Normal   Provisioning          3m6s (x10 over 11m)  dobs.csi.digitalocean.com_master-do3_cebb3451-5eba-4805-956c-753ec148e2ea  External provisioner is provisioning volume for claim "demo/datadir-store-mongodb-2"
  Warning  ProvisioningFailed    3m5s (x10 over 11m)  dobs.csi.digitalocean.com_master-do3_cebb3451-5eba-4805-956c-753ec148e2ea  failed to provision volume with StorageClass "do-block-storage": rpc error: code = ResourceExhausted desc = volume limit (10) has been reached. Current number of volumes: 10. Please contact support.
  Normal   ExternalProvisioning  103s (x43 over 11m)  persistentvolume-controller                                                waiting for a volume to be created, either by external provisioner "dobs.csi.digitalocean.com" or manually created by system administrator
```

As instructed by the message, I contacted Digital Ocean support and they fixed it.


## Secure web traffic with HTTPS
