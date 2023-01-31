---
layout: blog_post
title: "Keycloak in Production with Kubernetes"
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

- introduction
- announce support

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

Build and publish the each application image to Docker Hub. For example, in the `gateway` folder run:

```shell
./gradlew -Pprod bootJar jib \
-Djib.to.image=<your-dockerhub-username>/gateway \
-Djib.to.auth.username=<your-dockerhub-username> \
-Djib.to.auth.password=<your-dockerhub-secret>
```

**Note**: _your-dockerhub-secret_ can be your Docker Hub password, or a token if you have two-factor authentication enabled.

### Run Kubernetes generator

Now let's generate the Kubernetes Yaml descriptors using JHipster. During the process, the generator will prompt for a FQDN (Fully qualified domain name) for the Ingress services, so let's first create a public IP on Google Cloud. With the help of [nip.io](nip.io), if you set <gc-public-ip>.nip.io as your FQDN, you can test the deployment without having to purchase a real domain.

Google Cloud provides a [free tier](https://cloud.google.com/free) of their services that grants you $300 in free credits if you are a new user.

After you sign up, install [`gcloud` CLI](https://cloud.google.com/sdk/docs/install). When you reach the end of the process, the last step is to run `gcloud init` and set up authorization for the tool. Also install the [Kubectl authentication plugin](https://cloud.google.com/blog/products/containers-kubernetes/kubectl-auth-changes-in-gke).

```shell
gcloud compute addresses create gateway-ip --global
```
**Note**: The name for public IP must the gateway or monolith application base name, you can find it in the JDL.


- Run the generator

### Customize the configuration

- Add the email account for let's encrypt

### Deploy on Google Kubernetes Engine

- Create the cluster
- Apply the configuration
- Wait for the certificate issuance
- Sample logs
- Test

### Using cert-manager with Let's Encrypt Certificates

- Cert-manager
- ACME and Let's Encrypt
- Certificaterequest/Order/Challenges/Certificate
- Annotations
- Gke and ingress class


## Learn More about Keycloak in production
