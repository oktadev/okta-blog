---
layout: blog_post
title: "JHipster with Keycloak deployment on GKE"
author:
by: contractor
communities: [devops,security,java]
description: ""
tags: [keycloak, kubernetes, java, jhipster, security, oauth2]
tweets:
- ""
- ""
- ""
image:
type: awareness
---
Keycloak is an open-source identity and access management solution that allows you to secure your applications and services with ease. JHipster, on the other hand, is a powerful development platform that provides developers with the tools they need to create modern, scalable, and robust web applications.

Keycloak is the default OpenID Connect server configured with JHipster. Using Keycloak with JHipster is an excellent way to ensure that your web applications are secure and well-protected from unauthorized access. By integrating Keycloak with JHipster, you can easily implement authentication and authorization in your application, manage user identities, and provide secure access to resources.

The JHipster Kubernetes generator creates all the necessary Kubernetes resources, such as deployments, services, and ingresses, based on the configuration of the JHipster application. This includes setting up the database, configuring security, and setting up any necessary environment variables. Since JHipster 8, the kubernetes sub-generator supports Keycloak for Ingress GKE configurations. In this post I'll walk you through the generation of a demo JHipster microservices application with Keycloak integration, and its deployment to Google Kubernetes Engine (GKE).

{% img blog/keycloak-kubernetes-prod/keycloak-gke.png alt:"Keycloak, JHipster, GKE logos" width:"600" %}{: .center-image }

{% include toc.md %}

## Best practices for Keycloak in production

Keycloak can be started in development mode with the `start-dev` command or production mode with the `start` command. Production mode follows a _secure by default_ principle, and expects _hostname_ and _HTTPS/TLS_ configuration to be set, otherwise Keycloak won't start and will display an error. Also, in production mode HTTP is disabled by default.

Keycloak documentation provides some key guidelines for production deployment that apply to all environments.

- **HTTPS/TLS**: The exchange of credentials and other sensitive data with Keycloak requires all communication to and from Keycloak to be secured, so HTTP over TLS must be enabled.
- **Keycloak hostname**: Keycloak usually runs in a private network but certain public facing endpoints must be exposed to applications. The base URLs determine how tokens are issued and validated, how action links are created and how the OpenID Connect Discovery Document `realms/{realm-name}/.well-known/openid-configuration` is created.
- **Reverse proxy**: A reverse proxy / load balancer component is recommended for a production environment, unifying the access to the network. Keycloak supports multiple proxy modes. The `edge` mode allows HTTP communication between the proxy and Keycloak, and the proxy keeps the secure connection with clients.
- **Production grade database**: The database plays a crucial role in performance and Keycloak supports several production grade databases, including PostgreSQL.
- **High Availability**: Choose multi-mode clustered deployment. In production mode, distributed caching of realm and session data is enabled and all nodes in the network are discovered.

## Deploy microservices and Keycloak to Google

- Describe the architecture and edge services

### Build a microservices architecture

Install JHipster, you can do the classical local installation with npm.

```bash
npm install -g generator-jhipster@7.9.2
```
If you'd rather use Yarn or Docker, follow the instructions at [jhipster.tech](https://www.jhipster.tech/installation/#local-installation-with-npm-recommended-for-normal-users).

Generate the microservices architecture using the [reactive microservices example](https://github.com/jhipster/jdl-samples/blob/main/reactive-ms.jdl) from JHipster. Create folder for the project and run:

```shell
jhipster jdl reactive-ms
```

After the generation, you will find sub-folders were created for the `gateway`, `store`, and `blog` services. The `gateway` will act as the front-end application and as a secure router to the `store` and `blog` microservices.

Create a [Docker Hub](https://hub.docker.com/) personal account, if you don't have one. Then build and publish each application image. For example, in the `gateway` folder run:

```shell
./gradlew -Pprod bootJar jib \
-Djib.to.image=<your-dockerhub-username>/gateway \
-Djib.to.auth.username=<your-dockerhub-username> \
-Djib.to.auth.password=<your-dockerhub-secret>
```

**Note**: _your-dockerhub-secret_ can be your Docker Hub password, or a token if you have two-factor authentication enabled.

### Run Kubernetes generator

Now let's generate the Kubernetes Yaml descriptors using JHipster. During the process, the generator will prompt for a FQDN (Fully qualified domain name) for the Ingress services, so let's first create a public IP on Google Cloud. With the help of [nip.io](nip.io), if you set <public-ip>.nip.io as your FQDN, you can test the deployment without having to purchase a real domain.

Google Cloud provides a [free tier](https://cloud.google.com/free) of their services that grants you $300 in free credits if you are a new user.

After you sign up, install [`gcloud` CLI](https://cloud.google.com/sdk/docs/install). When you reach the end of the process, the last step is to run `gcloud init` and set up authorization for the tool. Also install the [Kubectl authentication plugin](https://cloud.google.com/blog/products/containers-kubernetes/kubectl-auth-changes-in-gke).

```shell
gcloud compute addresses create gateway-ip --global
```
**Note**: The name for public IP must the gateway or monolith application base name, you can find it in the JDL.

```
application {
  config {
    baseName gateway
    applicationType gateway
```

Find out the IP address with the following command:

```shell
gcloud compute addresses describe gateway-ip --global --format='value(address)'
```

Create a `kuberntes` folder at the root of the project, and run the generator:

```shell
jhipster kubernetes
```

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
- Kubernetes service type? **Ingress**
- Kubernetes ingress type? **GKE**
- Root FQDN for ingress services: **<public-ip>.nip.io**
- Use dynamic storage provisioning? **Yes**
- Use a specific storage class? (leave empty)

### Customize the configuration

Let's Encrypt requires an email address to remind you to renew the certificate after 30 days before expiry. You will only receive this email if something goes wrong when renewing the certificate with cert-manager. Set the email address in the issuer yaml descriptor `kubernetes/cert-manager/letsencrypt-staging-issuer.yml`:

```yml
spec:
  acme:
    server: https://acme-staging-v02.api.letsencrypt.org/directory
    email: <your-email>
```

### Deploy on Google Kubernetes Engine

Create a Kubernetes cluster on Google Cloud:

```shell
gcloud container clusters create jhipster-cluster \
--zone southamerica-east1-a \
--machine-type n1-standard-4 \
--enable-autorepair \
--enable-autoupgrade
```

**Note**: you can choose a different zone and machine type.

Install [cert-manager](https://cert-manager.io/docs/tutorials/getting-started-with-cert-manager-on-google-kubernetes-engine-using-lets-encrypt-for-ingress-ssl/) in your cluster:

```shell
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.10.0/cert-manager.yaml
```

Apply the deployment descriptors, from the `kubernetes` folder:

```shell
./kubectl-apply.sh -f
```

**Important note**: Keycloak client applications (registry, microservices) will fail the startup until Let's Encrypt has issued the certificate and it has been synchronized inside the cluster. In the following section the issuance process is explained in more detail.

The certificate might take some minutes to be ready, you can check the status by inspecting the object events:

```shell
kubectl describe certificate keycloak-ssl -n demo
```

The output should be similar to the following text:

```text
Events:
  Type    Reason     Age   From                                       Message
  ----    ------     ----  ----                                       -------
  Normal  Issuing    10m   cert-manager-certificates-trigger          Issuing certificate as Secret does not exist
  Normal  Generated  10m   cert-manager-certificates-key-manager      Stored new private key in temporary Secret resource "keycloak-ssl-rsfkj"
  Normal  Requested  10m   cert-manager-certificates-request-manager  Created new CertificateRequest resource "keycloak-ssl-mp8s7"
  Normal  Issuing    10m   cert-manager-certificates-issuing          Issued temporary certificate
  Normal  Issuing    4m    cert-manager-certificates-issuing          The certificate has been successfully issued
```
Also the ingress service will be updated once the certificate is available. You can check the ingress events with the following command:

```shell
kubectl get ingress gateway -n demo
```

The output should contain the message "certs updated":

```text
Events:
  Type     Reason             Age                   From                       Message
  ----     ------             ----                  ----                       -------
...
  Normal   Sync               5m24s (x9 over 11m)   loadbalancer-controller    Scheduled for sync
  Normal   Sync               5m10s (x2 over 8m4s)  loadbalancer-controller    UrlMap "k8s2-um-syujj5e4-rey-gateway-f99qha5q" updated
  Normal   Sync               4m58s                 loadbalancer-controller    TargetProxy "k8s2-ts-syujj5e4-rey-gateway-f99qha5q" certs updated
```
Once the cluster is healthy, you can test the deployment navigating to **http://gateway.rey.<public-ip>.nip.io** :

{% img blog/keycloak-kubernetes-prod/gateway-home.png alt:"Gateway homepage" width:"800" %}{: .center-image }

If you click on **Sign in** you will be redirected to Keycloak sign-in page. As the certificate for TLS was issued by Let's Encrypt staging environment, the browser won't trust it by default. Accept the certificate and you will be able to sign in. If you inspect the certificate, you will find the certificate hierarchy.



{% img blog/keycloak-kubernetes-prod/firefox-warning.png alt:"Firefox browser warning" width:"800" %}{: .center-image }

{% img blog/keycloak-kubernetes-prod/firefox-advanced.png alt:"Firefox advanced information on warning" width:"800" %}{: .center-image }

{% img blog/keycloak-kubernetes-prod/certificate-info.png alt:"Certificate information" width:"800" %}{: .center-image }

## Using cert-manager with Let's Encrypt Certificates

cert-manager is a X.509 certificate controller for Kubernetes and OpenShift. It automates the issuance of certificates from popular public and private Certificate Authorities, to secure Ingress with TLS. It ensures the certificates are valid and up-to-date, and attempts to renew certificates before expiration.

With cert-manager, a certificate issuer is a resource type in the Kubernetes cluster, and Let's Encrypt is one of the supported sources of certificates than can be configured as issuer. The [ACME](https://www.rfc-editor.org/rfc/rfc8555) (Automated Certificate Management Environment) protocol is a framework for automating the issuance and domain validation procedure, which allows servers to obtain certificates without user interaction. Let's Encrypt is a Certificate Authority that supports ACME protocol, and through cert-manager the cluster can request and install Let's Manager certificates.

### Certificate issuance flow

The process for obtaining a certificate with ACME protocol has two major tasks, __Domain Validation__, where the agent proves it controls the domain, and __Certificate Issuance__, where the agent requests a certificate (or renews or revoke).

At a high level, the following steps are required for obtaining a certificate from an ACME server:

1. The agent registers to the CA with a key pair
2. The agent submits an order for a certificate to be issued
3. The CA issues a DNS01 or HTTP01 challenge
4. The CA provides a nonce the agent must sign with its private key
5. The agent completes the challenge
6. The agent signs the nonce with its private key
7. The agent notifies the CA it is ready for validation
8. The CA verifies the signature on the nonce satisfied
9. The CA verifies the challenge has been satisfied
10. The authorized agent sends a certificate signing request
11. The CA issues the certificate

### About ACME orders and challenges

When a `Certificate` resource is created, cert-manager automatically creates a `CertificateRequest`. An `Order` resource represents a single certificate request, also created automatically, and is used by the ACME issuer to manage the lifecycle of the ACME order for a signed TLS certificate. The `Order` resource manages challenges for the order with the `Challenge` resource.

The `Challenge` resource is queued for scheduled processing. The challenge controller will perform a self check, and once it is passing, the ACME authorization is accepted for the ACME server to perform the validation.

### The HTTP01 Ingress solver

The HTTP-01 challenge is the most common challenge type. Let's Encrypt gives a token to the agent, and the agent must place a file at http://<YOUR_DOMAIN>/.well-known/acme-challenge/<TOKEN> that contains the token and a thumbprint (computation) of the agent. Once the agent tells Let's Encrypt the file is ready, Let's Encrypt validates the file and issues the certificate.

The challenge type is configured in the issuer, along with the ingress class for the solver. cert-manager will create a new Ingress resource to route Let's Encrypt challenge requests to the solver pods, which are also created automatically.

The following annotations are required in the ingress resource, for the challenge solver to work and the TLS certificate to be automatically created by cert-manager:

- `kubernetes.io/ingress.allow-http: "true"`: Required to allow HTTP connections from challenge requests
- `cert-manager.io/issuer: letsencrypt-staging`: The name of the issuer to acquire the certificate, which must be in the same namespace
- `acme.cert-manager.io/http01-edit-in-place: "true"`: The ingress is modified in place, instead of create a new ingress resource for the HTTP01 challenge
- `cert-manager.io/issue-temporary-certificate: "true"`: A temporary certificate will be set on the secret until the final certificate has been returned. used for keeping compatibility with the `ingress-gce` component.


## Learn More about Keycloak in production

I hope you enjoyed this post and learned about some best practices for deploying Keycloak to production when doing JHipster development. Keep learning about Keycloak and JHipster! Check out the following links:

- [Integrate React Native and Spring Boot Securely](/blog/2022/10/12/integrate-react-native-and-spring-boot-securely)
- [Use GitHub Actions to Build GraalVM Native Images](/blog/2022/04/22/github-actions-graalvm)
- [Full Stack Java with React, Spring Boot, and JHipster](https://auth0.com/blog/full-stack-java-with-react-spring-boot-and-jhipster/)
- [Introducing Spring Native for JHipster: Serverless Full-Stack Made Easy](/blog/2022/03/03/spring-native-jhipster)

For more tutorials like this one, follow [@oktadev](https://twitter.com/oktadev) on Twitter. We also have a [YouTube channel](https://youtube.com/c/oktadev) you might like. If you have any questions, please leave a comment below!
