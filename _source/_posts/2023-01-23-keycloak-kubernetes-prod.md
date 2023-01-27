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

introduction


{% include toc.md %}

## Best practices for Keycloak in production

Keycloak can be started in development mode with the `start-dev` command or production mode with the `start` command. Production mode follows a _secure by default_ principle, and expects _hostname_ and _HTTPS/TLS_ configuration to be set, otherwise Keycloak won't start and will display an error. Also, in production mode HTTP is disabled by default.

Keycloak documentation provides some key guidelines for production deployment that apply to all environments.

- **HTTPS/TLS**: The exchange of credentials and other sensitive data with Keycloak requires that all communication to and from Keycloak must be secured, enabling HTTP over TLS.
- **Keycloak hostname**: Keycloak usually runs in a private network but certain public facing endpoints must be exposed to applications. The base URLs determine how tokens are issued and validated, how action links are created and how the OpenID Connect Discovery Document `realms/{realm-name}/.well-known/openid-configuration` is created.
- **Reverse proxy**: A reverse proxy / load balancer component is recommended for a production environment, unifying the access to the network. Keycloak supports multiple proxy modes. The `edge` mode allows HTTP communication between the proxy and Keycloak, and the proxy keeps the secure connection with clients.
- **Production grade database**: The database plays a crucial role in performance and Keycloak supports several production grade databases, including PostgreSQL. 
- **High Availability**: Choose multi-mode clustered deployment. In production mode, distributed caching of realm and session data is enabled and all nodes in the network are discovered.


## Run Kubernetes generator

- Create the public ip
- Run the generator

## Customize the configuration

- Add the email account for let's encrypt

## Deploy on Google Kubernetes Engine

- Create the cluster
- Apply the configuration
- Wait for the certificate issuance
- Sample logs
- Test

## Using cert-manager with Let's Encrypt Certificates

- Cert-manager
- ACME and Let's Encrypt
- Certificaterequest/Order/Challenges/Certificate
- Annotations
- Gke and ingress class


## Learn More about Keycloak in production
