---
layout: blog_post
title: "JHipster Application Deployment to DigitalOcean Kubernetes"
author: jimena-garbarino
by: contractor
communities: [devops,java]
description: "A step-by-step guide for JHipster deployment to DigitalOcean cloud"
tags: []
tweets:
- ""
- ""
- ""
image:
type: conversion
---

Cloud adoption continues to increase rapidly and worldwide, and not only in the software industry. Every year more and more companies move their applications to the cloud. In the last JHipster community survey, in December 2021, users who participated expressed they value getting to production fast, thanks to JHipster, and requested more tutorials on deployment to cloud platforms. DigitalOcean is among the most popular "other" cloud vendors, according to some surveys. This post is a quick walk-through of the deployment of a JHipster microservices architecture to a Kubernetes cluster in DigitalOcean's cloud.

**This tutorial was created with the following frameworks and tools**:
- [JHipster 7.6.0](https://www.jhipster.tech/installation/)
- [Java OpenJDK 11](https://jdk.java.net/java-se-ri/11)
- [Okta CLI 0.9.0](https://cli.okta.com)
- [doctl 1.72.0-release](https://docs.digitalocean.com/reference/doctl/)
- [kubectl 1.23](https://kubernetes.io/docs/tasks/tools/#kubectl)
- [minikube v1.25.2](https://minikube.sigs.k8s.io/docs/start/)
- [k9s v0.25.18](https://k9scli.io/topics/install/)
- [Docker 20.10.12](https://docs.docker.com/engine/install/)

**Table of Contents**{: .hide }
* Table of Contents
{:toc}

## About DigitalOcean

DigitalOcean is a cloud services company founded in 2011 by brothers Ben and Moisey Uretsky. The headquarters are in New York City in the United States, and they also have offices in Massachusetts and Bangalore. Last March 2022, it reached its IPO (Initial Public Offering) and some press articles describe it as the cloud services provider for small businesses: "Cloud services for the Little Guy".

{% img blog/jhipster-digital-ocean/do-logo.png alt:"DigitalOcean Logo" width:"200" %}{: .center-image }

DigitalOcean Kubernetes (DOKS) is a managed Kubernetes service that lets you deploy Kubernetes clusters without the complexities of handling the control pane and containerized infrastructure. Clusters are compatible with standard Kubernetes toolchains and integrate natively with DigitalOcean load balancers and block storage volumes. DOKS offers fast provisioning and deployment, and provides a free high-availability control pane, for reliability management. It can also provide a Cluster Autoscaler that automatically adjusts the size of the cluster by adding or removing nodes based on the cluster's capacity to schedule pods. Pricing for Kubernetes workloads is based on resources required by the cluster, droplets, block storage, and load balancers.

The company publishes its data center [certification reports](https://www.digitalocean.com/trust/certification-reports) on its web, and all the data centers have approved two or more of the following certifications: SOC (System and Organization Controls) 1 Type II, SOC 2 Type II, SOC 3 Type II, ISO/IEC 27001:2013 (Security techniques - Information security management systems). PCI-DSS (Payment Card Industry - Data Security Standard) has been certified in all data centers.

## Set up a microservices architecture for Kubernetes

Before working on the application, you need to install JHipster. The classical way of working with JHipster is to do a local installation with NPM, follow the instructions at [jhipster.tech](https://www.jhipster.tech/installation/#local-installation-with-npm-recommended-for-normal-users).

For this test, start from the `reactive-jhipster` example in the `java-microservices-examples` repository on [GitHub](https://github.com/oktadev/java-microservices-examples). The example is a JHipster reactive microservices architecture with Spring Cloud Gateway and Spring WebFlux, Vue as the client framework, and Gradle as the build tool. You can read about how it was built in [Reactive Java Microservices with Spring Boot and JHipster](/blog/2021/01/20/reactive-java-microservices).

```shell
git clone https://github.com/oktadev/java-microservices-examples.git
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
- Admin password for JHipster Registry: (generate one)
- Kubernetes namespace: **demo**
- Docker repository name: (your docker hub username)
- Command to push Docker image: `docker push`
- Enable Istio? **No**
- Kubernetes service type? **LoadBalancer**
- Use dynamic storage provisioning? **Yes**
- Use a specific storage class? (leave empty)

**NOTE**: You can leave the Docker repository name blank for running Kubernetes locally, but a repository will be required for the cloud deployment, so go ahead and create a [Docker Hub](https://hub.docker.com/) personal account, and the image pull configuration will be ready for both local and cloud deployments.

Build the `gateway`, `store` and `blog` services container images with Jib. For example, for the `gateway` service:

```shell
cd ../gateway
./gradlew bootJar -Pprod jib -Djib.to.image=<docker-repo-name>/gateway
```

Check the images were uploaded to [DockerHub](https://hub.docker.com), and navigate to the project root folder in the terminal for the next step.

## Configure authentication with OpenID Connect and Okta

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

Enable the OIDC authentication in the `jhipster-registry` service by adding the `oauth2` profile in the `k8s/registry-k8s/jhipster-registry.yml` file:

```yml
- name: SPRING_PROFILES_ACTIVE
  value: prod,k8s,oauth2
```

## Run locally with Minikube

Install [Minikube](https://minikube.sigs.k8s.io/docs/start/) and [`kubectl`](https://kubernetes.io/docs/tasks/tools/).

For Minkube, you will need at least 2 CPUs. Start MiniKube with your number of CPUs:

```shell
cd k8s
minikube --cpus <ncpu> start
```
Minikube will log the Kubernetes and Docker versions on start:

```
Preparing Kubernetes v1.23.3 on Docker 20.10.12 ...
```

For the `store-mongodb` deployment to work, the property `Service.spec.publishNotReadyAddresses` was required, instead of the annotation `service.alpha.kubernetes.io/tolerate-unready-endpoints`, as the latter was deprecated in [Kubernetes release 1.11](https://github.com/kubernetes/kubernetes/blob/master/CHANGELOG/CHANGELOG-1.11.md#kubernetes-111-release-notes).

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

Then deploy the application to Minikube, in the `k8s` directory, run:

```shell
./kubectl-apply.sh -f
```
Now is a good time to install [k9s](https://k9scli.io/topics/install/), a terminal-based UI to interact with Kubernetes clusters. Then run k9s with:

```shell
k9s -n demo
```

{% img blog/jhipster-digital-ocean/k9s-pods.png alt:"k9s UI" width:"800" %}{: .center-image }

Check out the [commands list](https://k9scli.io/topics/commands/), some useful ones are:
- `:namespace`: show all available namespaces
- `:pods`: show all available pods
You can navigate the pods with `ENTER` and go back with `ESC` keys.

Set up port-forwarding for the JHipster Registry.

```shell
kubectl port-forward svc/jhipster-registry -n demo 8761
```

Navigate to `http://localhost:8761` and sign in with your Okta credentials. When the registry shows all services in green, Set up port-forwarding for the gateway as well.

```shell
kubectl port-forward svc/gateway -n demo 8080
```

Navigate to `http://localhost:8080`, sign in, and create some entities to verify everything is working fine.

After looking around, stop minikube before the cloud deployment:

```shell
minikube stop
```

## Deploy to DigitalOcean Kubernetes

Now that the architecture works locally, let's proceed to the cloud deployment. First, create a [DigitalOcean](https://cloud.digitalocean.com/registrations/new) account, you can try their services with a free $100 credit that is available for 60 days.

Most of the cluster tasks, if not all, can be accomplished using [doctl](https://github.com/digitalocean/doctl#installing-doctl), the command-line interface (CLI) for the DigitalOcean API. Install the tool, and perform the authentication with DigitalOcean:

```shell
doctl auth init
```
You will be prompted to enter the DigitalOcean access token that you can generate in the DigitalOcean control panel. Sign in, and then in the left menu go to **API**, click **Generate New Token**. Enter a token name, and click **Generate Token**. Copy the new token from the **Tokens/Keys** table.

{% img blog/jhipster-digital-ocean/do-control-panel-token.png alt:"DigitalOcean Control Panel for Token Create" width:"500" %}{: .center-image }

You can find a detailed list of pricing for cluster resources at [DigitalOcean](https://docs.digitalocean.com/products/kubernetes/),  and with `doctl` you can quickly retrieve a list of node size options available for your account:

```shell
 doctl k options sizes
 ```

 **NOTE**: I tested the cluster with the higher size Intel nodes available for my account, `s-2vcpu-4gb-intel`, in an attempt to run the application in the default cluster configuration, a three-node cluster with a single node pool in the nyc1 region, using the latest Kubernetes version. As I started to see pods not running due to "insufficient CPU", I increased the number of nodes later. DigitalOcean's latest and default Kubernetes version at the moment of writing this post is 1.22.8.

 Create the cluster with the following command line:

 ```shell
 doctl k cluster create do1 -v --size s-2vcpu-4gb-intel
 ```
After creating a cluster, `doctl` adds a configuration context to kubectl and makes it active, so you can start monitoring your cluster right away with k9s. First, apply the resources configuration to the DigitalOcean cluster:

```shell
./kubectl-apply.sh -f
```

Monitor the deployment with k9s:

 ```shell
 k9s -n demo
 ```

{% img blog/jhipster-digital-ocean/k9s-do-cluster.png alt:"k9s user interface monitoring DigitalOcean Kubernetes" width:"800" %}{: .center-image }

Once you see the `jhipster-registry` pods are up, set up port forwarding again so you can also monitor the status of the services in the registry UI.

### Increase CPU

The three-node cluster might not provide enough CPU for this microservices architecture, so you might see `insufficient CPU` logs for some pods. You can get the pod events with `kubectl describe`:

```shell
kubectl describe pod jhipster-registry-0 -n demo
```
```text
Events:
  Type     Reason                  Age                   From                     Message
  ----     ------                  ----                  ----                     -------
  Normal   NotTriggerScaleUp       4m30s                 cluster-autoscaler       pod didn't trigger scale-up:
  Warning  FailedScheduling        69s (x3 over 95s)     default-scheduler        0/3 nodes are available: 3 Insufficient cpu.
```
Increase the number of nodes with `doctl`:

```shell
doctl k cluster node-pool update do1 do1-default-pool --count 4
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

As instructed by the event message, I contacted DigitalOcean support and they fixed it.

### Find your gateway's external IP and update redirect URIs

Once all the pods are running, find the gateway external IP with the `kubectl describe` command:

```shell
kubectl describe service gateway -n demo
```

```text
Name:                     gateway
Namespace:                demo
Labels:                   app=gateway
Annotations:              kubernetes.digitalocean.com/load-balancer-id: e81d2b8c-6c28-430d-8ba8-6dab29a1ba76
                          service.beta.kubernetes.io/do-loadbalancer-certificate-id: bd0b1d03-0f90-449d-abbe-ac6a4026c133
Selector:                 app=gateway
Type:                     LoadBalancer
IP Family Policy:         SingleStack
IP Families:              IPv4
IP:                       10.245.47.51
IPs:                      10.245.47.51
LoadBalancer Ingress:     157.230.200.181
Port:                     http  8080/TCP
TargetPort:               8080/TCP
NodePort:                 http  31048/TCP
Endpoints:                10.244.1.42:8080
Session Affinity:         None
External Traffic Policy:  Cluster
```

Update the redirect URIs in Okta to allow the gateway address as a valid redirect. Run `okta login`, open the returned URL in your browser, and sign in to the Okta Admin Console. Go to the **Applications** section, find your application, and edit it.

Navigate to `http://<load-balancer-ingress-ip>:8080`.

## Secure web traffic with HTTPS

As the gateway service acts as the application front-end, in the k8s descriptors it is defined as a `LoadBalancer` service type. This exposes the service externally using the cloud provider's load balancer. DigitalOcean load balancers are a fully-managed, highly available network load balancing service. Load balancers distribute traffic to groups of droplets, which decouples the overall health of a backend service from the health of a single server to ensure that your services stay online.

The standard practice is to secure web traffic to your application with HTTPs. For traffic encryption, you need a TLS (SSL) certificate. DigitalOcean also provides automatic certificate creation and renewal if you manage your domain with DigitalOcean's DNS, which is free. But domain registration is not provided.  To use DigitalOcean's DNS, you need to register a domain name with a registrar and update your domain's NS records to point to DigitalOcean's name servers.

Then, for using DigitalOcean's managed domain and certificate, you must [delegate the domain](https://docs.digitalocean.com/tutorials/dns-registrars/), updating NS records in the registrar.

**IMPORTANT NOTE**: Before changing the registrar NS records (the nameservers), add your domain to DigitalOcean, to minimize service disruptions.

You can create the certificate and the domain at the same time, in the DigitalOcean control panel, when you set up the load balancer HTTPs forwarding.

DigitalOcean load balancers support two main configurations for encrypted web traffic:

- SSL termination: decrypts SSL requests at the load balancer and sends them unencrypted to the backend at the Droplets' private IP address. The slower and CPU-intensive work of decryption is performed at the load balancer, and certificate management is simplified. The traffic between the load balancer and the backend is secured by routing over the VPC network, but data is readable inside the private network.
- SSL passthrough: sends the encrypted SSL requests directly to the backend at the Droplets' private IP address, traffic between the load balancer and the backend is secured. Every backend server must have the certificate, and client information contained in `X-forwarded-*` headers might be lost.

Taking advantage of the simplified certificate management, in the following steps SSL termination will be configured, through the DigitalOcean control panel.

Login to your DigitalOcean account, and in the left menu choose **Kubernetes**. Then choose your cluster, and on the cluster page, choose **Resources**. In the _LOAD BALANCERS_ list, choose the single load balancer that must have been created. On the load balancer page, choose the **Settings** tab. Click **Edit** in the _Forwarding Rules_. Add a forwarding rule for HTTPS in port 443, and in the certificate drop-down, choose **New certificate**.

{% img blog/jhipster-digital-ocean/do-new-certificate.png alt:"DigitalOcean new certificate form" width:"500" %}{: .center-image }

In the **New Certificate** form, choose the **Use Let's Encrypt** tab, and then in the domain box, choose **Add new domain**. Then enter your domain name, and list other subdomains to include. Add a name for the certificate and click **Generate Certificate**.

{% img blog/jhipster-digital-ocean/do-new-domain.png alt:"DigitalOcean new domain form" width:"500" %}{: .center-image }

Back in the _Forwarding rules_ page, check the generated certificate is selected, and forward the traffic to the droplet HTTP port where the gateway is running. Tick the checkbox **Create DNS records for all the new Let's Encrypt certificates** and then **Save** the forwarding settings.

{% img blog/jhipster-digital-ocean/do-forwarding.png alt:"DigitalOcean load balancer forwarding settings" width:"800" %}{: .center-image }

Finally, in the SSL section of the settings, tick the checkbox **Redirect HTTP to HTTPS**.

{% img blog/jhipster-digital-ocean/do-ssl-redirect.png alt:"DigitalOcean load balancer ssl redirect settings" width:"800" %}{: .center-image }

Once again, update the redirect URIs in Okta to allow the newly configured domain. Set up the URIs with `https://yourDomain` prefix.

Test the configuration by navigating to `http://yourDomain`. First, the load balancer should redirect to HTTPs, and then the gateway should redirect to the Okta sign-in page.

## Learn more about JHipster and cloud deployment

And this was a brief walk-through for deploying JHipster to a DigitalOcean's managed Kubernetes cluster. Some important topics for production deployment were not covered in this post, to focus on DigitalOcean resource requirements in particular. Among them, external configuration storage with Spring Cloud Config and Git was not covered, secrets encryption both for the cloud configuration and Kubernetes configuration also was not covered. You can learn about these good practices in the first post of this cloud deployment series: [Kubernetes to the Cloud with Spring Boot and JHipster](/blog/2021/06/01/kubernetes-spring-boot-jhipster). Keep learning, and for more content on JHipster, check out the following links:

- [Introducing Spring Native for JHipster: Serverless Full-Stack Made Easy](/blog/2022/03/03/spring-native-jhipster)
- [Full Stack Java with React, Spring Boot, and JHipster](/blog/2021/11/22/full-stack-java)
- [Fast Java Made Easy with Quarkus and JHipster](/blog/2021/03/08/jhipster-quarkus-oidc)

Be sure to follow us on [Twitter](https://twitter.com/oktadev) and subscribe to our [YouTube Channel](https://youtube.com/c/oktadev) so that you never miss any of our excellent content!
