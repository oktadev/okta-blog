---
layout: blog_post
title: "How to Secure the Kubernetes API Server with OpenID Connect"
author: deepu-sasidharan
by: advocate
communities: [kubernetes, devops, security]
description: "Welcome Deepu K Sasidharan to the Okta team!"
tags: [kubernetes, devops, oidc, okta, terraform]
tweets:
  - "Use #OIDC to access #Kubernetes API Server securely"
  - "Access #Kubernetes API server using your favorite #OIDC provider!"
type: conversion
image: blog/k8s-api-server-oidc/social.jpeg
---

A Kubernetes (k8s) cluster is made up of worker machines called nodes and a control plane which consists of the API server, scheduler, controller manager, and etcd. The container that are deployed are run in pods on the nodes while the control plane takes care of scheduling, responding to requests, and managing the cluster.

{% img blog/k8s-api-server-oidc/arch.jpg alt:"K8s architecture" width:"800" %}{: .center-image }

When you are communicating with a Kubernetes cluster, lets say using kubectl or a client library or a tool like [KDash](https://kdash.cli.rs/), you are mostly interacting with the [Kubernetes API Server](https://kubernetes.io/docs/reference/command-line-tools-reference/kube-apiserver/). The API server is responsible for managing the cluster and is responsible for handling requests from a client.

**Table of Contents**{: .hide }

- Table of Contents
  {:toc}

# Why is it required to secure the API server?

The API Server has multiple layers of security. By default all communication with the API Server uses TLS and authentication is done using service account tokens, bearer tokens, basic authentication, a proxy or client certificates depending on the platform and in case of PaaS like AWS, Azure, GCP, it could also be done using custom authentication mechanisms. Once a request is authenticated the API Server can use one of several authorization mechanisms, like Attribute-based access control (ABAC) and Role-based access control (RBAC), to control access to resources. And finally there is also admission control modules which can be configured to control resource modifications.

Since the API Server is the only part of the Kubernetes cluster that can be accessed by a client, it is important to secure the API server. An unauthorized access of the API server can lead to hijack of the entire cluster and may be even your infrastructure, data theft and so on. Configuring users and roles properly is hence a must in order to secure the cluster.

# Why OpenID Connect?

> [OpenID Connect](https://developer.okta.com/docs/concepts/oauth-openid/) is an authentication standard built on top of OAuth 2.0. It adds an additional token called an ID token. OpenID Connect also standardizes areas that OAuth 2.0 leaves up to choice, such as scopes, endpoint discovery, and dynamic registration of clients

While the default authentication mechanism of Kubernetes API server might be enough for simple use cases, where the cluster is managed by only a handful of people, it does not scale for bigger organizations and its definitely not the most secure as well. This is because Kubernetes does not handle user management and role management and expects this to be done outside. This is where OpenID Connect (OIDC) comes in. OIDC can take care of managing users and managing roles which can work very well with the Kubernetes RBAC.

{% img blog/k8s-api-server-oidc/oidc-flow.jpg alt:"K8s OIDC flow" width:"800" %}{: .center-image }

<!-- Image ref: https://github.com/int128/kubelogin -->

Having an OIDC integration also means, you can use the same OIDC provider used to do SSO in your existing infrastructure to access your Kubernetes cluster as well, like Okta or Keycloak for example.

# Using Okta as a OIDC provider to secure the API Server.

> Okta, Inc. is an identity and access management company, providing cloud software that helps companies manage and secure user authentication into applications, and for developers to build identity controls into applications, websites, web services, and devices. Okta is a certified OpenID Connect provider.

Let us see how we can secure the Kubernetes API server using Okta as a OIDC provider. If you are using Amazon EKS, then check [this](https://developer.okta.com/blog/2021/10/08/secure-access-to-aws-eks) specific tutorial for using OIDC with EKS.

## What You’ll Need to Get Started

Before you start trying this out, make sure you have access to the following

- An Okta account. You can sign up for a free account [here](https://www.okta.com/free-trial/).
- A Kubernetes cluster. I'm using [k3d](https://k3d.io/) to run a local [k3s](https://k3s.io/) cluster. You can use any Kubernetes distribution.
- kubectl installed on your machine.
- Terraform installed on your machine. This is not required if you do the Okta configuration via the [Okta admin console](https://login.okta.com/).

## Setup an Okta OIDC application and access control

You can achieve OIDC login for the cluster by creating a simple OIDC application with Okta either using the Okta CLI or the Admin console. But with a OIDC application alone, you would have to use the client secret to authenticate from kubectl or any other client library. Which does not scale and is not that much better than default k8s authentication mechanisms. For a more practical approach we would need an OIDC application and an authorization server with customized claims and policies for kubernetes. this way we can make use of Okta to manage users and groups as well.

There are multiple ways to setup an OIDC application and authorization server required with Okta. If you prefer to do this via a GUI, then follow [these instructions](https://developer.okta.com/blog/2021/10/08/secure-access-to-aws-eks#configure-your-okta-org) to do it via the [Okta Admin console](https://login.okta.com/).

In this tutorial, we will use Terraform to create this so that the code can be reused for automation and so on. Lets dive into each step required.

1. Create a group
2. Assign users to group
3. Create an OIDC application
4. Create an authorization server
5. Add claims
6. Add policy and rule

You can find the terraform source code for this in this GitHub repo

## Preparing the cluster

Now we need to prepare the cluster. In order to prepare a Kubernetes cluster for OIDC authentication, we need to update the API Server flags below:

- `oidc-issuer-url`: https://dev-32651518.okta.com/oauth2/aus29igrg8Bdkdntx5d7
- `oidc-username-claim`: email
- `oidc-client-id`: 0oa29ila5gM8JANSc5d7
- `oidc-ca-file`: ?
- `oidc-groups-claim`: groups
- `oidc-groups-prefix`: oidc:
- `oidc-username-prefix`: oidc:

- `oidc-issuer-url`: This will be your issuer URL from the Okta authorization server
- `oidc-username-claim`: This is the claim that will be used to identify the user. In this case it is `email`.
- `oidc-client-id`: This is the client ID from the Okta OIDC application
- `oidc-ca-file`: This is the CA file that is used to validate the OIDC server. If you are using Okta as a OIDC provider, then you don't need to set this.
- `oidc-groups-claim`: This is the claim that will be used to identify the groups. In this case it is `groups`.

If you encounter an issue where OIDC groups/users collide with kubernetes groups/users, you can set `oidc-groups-prefix` and `oidc-username-prefix` as well.

This can be done when creating the cluster or by patching the API Server vai SSH.

### Create a cluster with OIDC enabled

Here is how you can create a new k8s cluster with OIDC enabled using different tools

#### kubeadmn

#### kops

#### charmed

#### k3d

k3d cluster create oidc-test \
--k3s-server-arg "--kube-apiserver-arg=oidc-issuer-url=https://dev-32651518.okta.com/oauth2/aus29igrg8Bdkdntx5d7" \
--k3s-server-arg "--kube-apiserver-arg=oidc-client-id=0oa29ila5gM8JANSc5d7" \
--k3s-server-arg "--kube-apiserver-arg=oidc-username-claim=email" \
--k3s-server-arg "--kube-apiserver-arg=oidc-groups-claim=groups"

#### microK8s

### Updating an existing cluster to enable OIDC

If you already have an existing cluster, you can SSH into it using the root user and patch the API Server with the following command. If you are using a managed service like [EKS](https://developer.okta.com/blog/2021/10/08/secure-access-to-aws-eks#add-okta-as-an-oidc-provider-on-your-eks-cluster), GKE or AKS, then follow their instructions to update the API Server

https://stackoverflow.com/questions/62907941/how-do-i-update-an-on-premise-kubernetes-api-server-to-enable-oidc-with-dex

## Configure RBAC

```
kind: ClusterRoleBinding
apiVersion: rbac.authorization.k8s.io/v1
metadata:
    name: oidc-cluster-admin
roleRef:
    apiGroup: rbac.authorization.k8s.io
    kind: ClusterRole
    name: cluster-admin
subjects:
- kind: Group
    name: k8s-admins
```

```
kubectl apply -f - <<EOF
kind: ClusterRoleBinding
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: oidc-cluster-admin
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: cluster-admin
subjects:
- kind: Group
  name: k8s-admins
EOF
```

## Connecting to the cluster using kubectl

1. Install [oidc-login](https://github.com/int128/kubelogin)

kubectl oidc-login setup --oidc-issuer-url=https://dev-32651518.okta.com/oauth2/aus29igrg8Bdkdntx5d7 --oidc-client-id=0oa29ila5gM8JANSc5d7

kubectl config set-credentials test-oidc \
--exec-api-version=client.authentication.k8s.io/v1beta1 \
--exec-command=kubectl \
--exec-arg=oidc-login \
--exec-arg=get-token \
--exec-arg=--oidc-issuer-url=https://dev-32651518.okta.com/oauth2/aus29igrg8Bdkdntx5d7 \
--exec-arg=--oidc-client-id=0oa29ila5gM8JANSc5d7 \
--exec-arg=--oidc-extra-scope="email offline_access profile openid"

Issues:

https://stackoverflow.com/questions/67151953/forbidden-resource-in-api-group-at-the-cluster-scope

# Conclusion
