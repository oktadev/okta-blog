---
layout: blog_post
title: "How to Secure Your Kubernetes Cluster with OpenID Connect and RBAC"
author: deepu-sasidharan
by: advocate
communities: [kubernetes, devops, security]
description: "Learn how to set up Okta as an OpenID Connect provider using Terraform for access to Kubernetes API server."
tags: [kubernetes, devops, oidc, okta, terraform]
tweets:
  - "Use #OIDC to access #Kubernetes API server securely. Set it up using Terraform."
  - "Access #Kubernetes API server using your favorite #OIDC provider!"
type: conversion
image: blog/k8s-api-server-oidc/kube-login-oidc.jpg
github: https://github.com/oktadev/okta-k8s-oidc-terraform-example
---

A Kubernetes (k8s) cluster comprises worker machines called nodes and a control plane consisting of the API server, scheduler, etcd, controller manager, and in the case of a PaaS (platform as a service), the cloud controller manager. The containers deployed to the cluster run in pods on the worker nodes. At the same time, the control plane takes care of scheduling, responding to requests, and managing the cluster.

{% img blog/k8s-api-server-oidc/kube-architecture.jpg alt:"K8s architecture" width:"800" %}{: .center-image }

When you communicate with a Kubernetes cluster, using kubectl, or a client library, or a tool like [KDash](https://kdash.cli.rs/), you are primarily interacting with the [Kubernetes API server](https://kubernetes.io/docs/reference/command-line-tools-reference/kube-apiserver/). The API server is responsible for managing the cluster and is responsible for handling requests from a client.

{% include toc.md %}

# Why secure the API server?

The API server has multiple layers of security. By default, all communication with the API server uses TLS. Authentication is done using service account tokens, bearer tokens, basic authentication, a proxy, or client certificates, depending on the platform. In the case of PaaS like Amazon EKS, AKS, and GKE, it can also be done using custom authentication mechanisms. Once a request is authenticated, the API server can use one of several authorization mechanisms, like Attribute-based access control (ABAC) or Role-based access control (RBAC), to control access to resources. And finally, there are also admission control modules that can be configured to control resource modifications.

Since the API server is the only part of the Kubernetes cluster that a client can access, it is essential to secure the API server. Unauthorized access to the API server can lead to hijacking of the entire cluster, which also lets an attacker access all secrets and data accessible to the services running on it. Hence, configuring users and roles properly is a must to secure the cluster, especially in organizations where more than one user can access the cluster.

# Why OpenID Connect?

> [OpenID Connect](https://developer.okta.com/docs/concepts/oauth-openid/) is an authentication standard built on top of OAuth 2.0. It adds an additional token called an ID token. OpenID Connect also standardizes areas that OAuth 2.0 leaves open to choice, such as scopes, endpoint discovery, and dynamic registration of clients.

While the default authentication mechanism of the Kubernetes API server might be enough for simple use cases, where only a handful of people manage the cluster, it does not scale for bigger organizations. Also, the default is definitely not the most secure way, because Kubernetes does not handle user management and expects it to be done outside. This is where OpenID Connect (OIDC) comes in. OIDC can manage users and groups, which works very well with the Kubernetes RBAC to provide very granular control of who can access what inside a cluster.

{% img blog/k8s-api-server-oidc/kube-login-oidc.jpg alt:"K8s OIDC flow" width:"800" %}{: .center-image }

With an OIDC integration, you can use the same OIDC provider used for SSO in your existing infrastructure to access your Kubernetes cluster, like Okta or Keycloak.

# Use Okta as an OIDC provider to secure the API server

> Okta provides cloud software that helps companies manage and secure user authentication into applications and enables developers to build identity controls into applications, websites, web services, and devices. Okta is a certified OpenID Connect provider.

Let us see how we can secure the Kubernetes API server using Okta as an OIDC provider and use RBAC to control access from the Okta Admin Console. If you are using Amazon EKS, check out this [tutorial for using Okta OIDC with EKS](/blog/2021/10/08/secure-access-to-aws-eks).

## What you'll need to get started

Before you try this out, make sure you have access to the following.

- An Okta account. You can sign up for a [free Okta account](https://developer.okta.com/signup/). Or, you can use another OIDC provider or [Dex](https://github.com/dexidp/dex), and the steps should be similar.
- A Kubernetes cluster. I'm using [k3d](https://k3d.io/) to run a local [k3s](https://k3s.io/) cluster. You can use any Kubernetes distribution, including managed PaaS like Amazon EKS, AKS, and GKE, and so on.
- [kubectl](https://kubernetes.io/docs/tasks/tools/) installed on your machine.
- [Terraform](https://learn.hashicorp.com/tutorials/terraform/install-cli) installed on your machine. This is not required if you do the Okta configuration via the [Okta Admin Console](https://login.okta.com/) GUI.

## Set up an Okta OIDC application and authorization server

You can achieve OIDC login for the cluster by creating a simple OIDC application with Okta either using the Okta CLI or the Admin Console. But with an OIDC application alone, you would have to use the client secret to authenticate from kubectl or any other client library. Authenticating with the client secret does not scale and is not better than default k8s authentication mechanisms, as you won't have granular controls over users and roles. For a more helpful setup, we need an OIDC application and an authorization server with customized claims and policies for Kubernetes. This way, we can use Okta to manage users and permissions as well.

There are multiple ways to set up an OIDC application and authorization server in Okta. If you prefer to do this via a GUI, then follow the steps in the [**Configure Your Okta Org ** section](/blog/2021/10/08/secure-access-to-aws-eks#configure-your-okta-org) of the article mentioned earlier, to do it via the Okta Admin Console.

In this tutorial, we will use Terraform to configure the Okta part so that you can reuse the code for any automation required. Let's dive into each step needed.

### Set up Terraform

You can find the complete Terraform source code for this article in this [GitHub repo](https://github.com/oktadev/okta-k8s-oidc-terraform-example)

First, we need to configure the [Okta Terraform provider](https://registry.terraform.io/providers/okta/okta/latest/docs). Create a new Terraform file, let's say `okta.main.tf`, and add the following:

```hcl
variable "base_url" {
  description = "The Okta base URL. Example: okta.com, oktapreview.com, etc. This is the domain part of your Okta org URL"
}
variable "org_name" {
  description = "The Okta org name. This is the part before the domain in your Okta org URL"
}
variable "api_token" {
  type        = string
  description = "The Okta API token, this will be read from environment variable (TF_VAR_api_token) for security"
  sensitive   = true
}

# Enable and configure the Okta provider
terraform {
  required_providers {
    okta = {
      source  = "okta/okta"
      version = "~> 3.15"
    }
  }
}

provider "okta" {
  org_name  = var.org_name
  base_url  = var.base_url
  api_token = var.api_token
}
```

You need to provide the input variables `org_name`, `base_url`, and `api_token`. Update these values in a file named `okta.config.auto.tfvars`. The `.auto` in the name is important; otherwise, Terraform will not pick it up automatically. For example, if the address of your Okta instance is `dev-1234.okta.com`, then your `org_name` would be `dev-1234`, and `base_url` would be everything that comes after the org name (e.g., okta.com).

Next, you will need to generate the `api_token` value. Log in to your Okta administrator console as a superuser and select **Security** > **API** > **Tokens (Tab)** from the navigation menu. Next, click the **Create Token** button, give your token a name, click **Create Token**, and copy the newly generated token. Save this in a separate `secret.auto.tfvars` file excluded from Git or in an environment variable named `TF_VAR_api_token`.

The Okta provider is now configured and ready to go.

### Create groups

Now we need some groups to differentiate and map different kinds of users who want to access our clusters. Let's say we have a group of administrators with full access to the cluster and another group of users who have limited access. You can have any number of groups as per your needs. The configuration below will create two groups. The group's privileges will be defined using Kubernetes RBAC policies on the cluster, which we will do later.

```hcl
# Set up OKTA groups
resource "okta_group" "k8s_admin" {
  name        = "k8s-admins"
  description = "Users who can access k8s cluster as admins"
}

resource "okta_group" "k8s_restricted_users" {
  name        = "k8s-restricted-users"
  description = "Users who can only view pods and services in default namespace"
}
```

### Assign users to the groups

The below snippet looks up existing users and adds them to the groups. You can add any number of users at this stage, or you can skip adding users and do it via the Okta Admin Console later. For this exercise, I'm fetching existing users. You could also create new users using the `okta_user` resource.

```hcl
# Assign users to the groups
data "okta_user" "admin" {
  search {
    name  = "profile.email"
    value = "<your_admin_user_email>"
  }
}

resource "okta_group_memberships" "admin_user" {
  group_id = okta_group.k8s_admin.id
  users = [
    data.okta_user.admin.id
  ]
}

data "okta_user" "restricted_user" {
  search {
    name  = "profile.email"
    value = "<another_user_email>"
  }
}

resource "okta_group_memberships" "restricted_user" {
  group_id = okta_group.k8s_restricted_users.id
  users = [
    data.okta_user.restricted_user.id
  ]
}
```

### Create an OIDC application

Now that our groups are in place, let's create an OIDC application. We will set the application type to `native` and use PKCE as client authentication, which is much more secure than using a client secret. We will also set the redirect URIs to `localhost:8000` so that we can work with kubectl locally. We should also assign the groups we created earlier to this application here. Finally, we can capture the client ID of the created app using an output variable.

```hcl
# Create an OIDC application

resource "okta_app_oauth" "k8s_oidc" {
  label                      = "k8s OIDC"
  type                       = "native" # this is important
  token_endpoint_auth_method = "none"   # this sets the client authentication to PKCE
  grant_types = [
    "authorization_code"
  ]
  response_types = ["code"]
  redirect_uris = [
    "http://localhost:8000",
  ]
  post_logout_redirect_uris = [
    "http://localhost:8000",
  ]
  lifecycle {
    ignore_changes = [groups]
  }
}

# Assign groups to the OIDC application
resource "okta_app_group_assignments" "k8s_oidc_group" {
  app_id = okta_app_oauth.k8s_oidc.id
  group {
    id = okta_group.k8s_admin.id
  }
  group {
    id = okta_group.k8s_restricted_users.id
  }
}

output "k8s_oidc_client_id" {
  value = okta_app_oauth.k8s_oidc.client_id
}
```

### Create an authorization server

Next, we need an authorization server so that we can define policies and claims. We will also capture the issuer URL in an output variable.

```hcl
# Create an authorization server

resource "okta_auth_server" "oidc_auth_server" {
  name      = "k8s-auth"
  audiences = ["http:://localhost:8000"]
}

output "k8s_oidc_issuer_url" {
  value = okta_auth_server.oidc_auth_server.issuer
}
```

### Add claims to the authorization server

Let's add a claim to the authorization server to add the user's groups in the `id_token` when they authenticate. We will need this to do RBAC at the Kubernetes side. Also, note that we are only adding groups with the prefix `k8s-` to the claim. This is to avoid adding groups that are not related to Kubernetes.

```hcl
# Add claims to the authorization server

resource "okta_auth_server_claim" "auth_claim" {
  name                    = "groups"
  auth_server_id          = okta_auth_server.oidc_auth_server.id
  always_include_in_token = true
  claim_type              = "IDENTITY"
  group_filter_type       = "STARTS_WITH"
  value                   = "k8s-"
  value_type              = "GROUPS"
}
```

### Add policy and rule to the authorization server

Now we need to create policies and rules for the authorization server. The below policy defines which OIDC applications it will be assigned to. Then we create a rule for the policy that will define the PKCE tokens lifetime and refresh interval. For this, we are leaving the values at default, which is 1 hour lifetime and unlimited refresh interval, but you can change them as per your needs.

```hcl
# Add policy and rules to the authorization server

resource "okta_auth_server_policy" "auth_policy" {
  name             = "k8s_policy"
  auth_server_id   = okta_auth_server.oidc_auth_server.id
  description      = "Policy for allowed clients"
  priority         = 1
  client_whitelist = [okta_app_oauth.k8s_oidc.id]
}

resource "okta_auth_server_policy_rule" "auth_policy_rule" {
  name           = "AuthCode + PKCE"
  auth_server_id = okta_auth_server.oidc_auth_server.id
  policy_id      = okta_auth_server_policy.auth_policy.id
  priority       = 1
  grant_type_whitelist = [
    "authorization_code"
  ]
  scope_whitelist = ["*"]
  group_whitelist = ["EVERYONE"]
}
```

### Create the Okta configurations using Terraform

Now that the Terraform code is ready, let's apply it. First, run `terraform plan` to see the changes that will be made. Verify that the changes proposed by the `plan` make the changes you wanted, on the resources that you intended to modify. Then run `terraform apply` and type `yes` to apply the changes. You should see an output similar to this. You can also log in to the Okta Admin Console to verify the changes.

Copy the output values as we will need them for the next steps.

```bash
okta_group.k8s_admin: Creating...
okta_group.k8s_restricted_users: Creating...
okta_auth_server.oidc_auth_server: Creating...
okta_app_oauth.k8s_oidc: Creating...
okta_group.k8s_admin: Creation complete after 0s [id=00g2b0rmupxo1C1HW5d7]
okta_group.k8s_restricted_users: Creation complete after 0s [id=00g2b0q4zejpq6hbi5d7]
okta_group_memberships.restricted_user: Creating...
okta_group_memberships.admin_user: Creating...
okta_auth_server.oidc_auth_server: Creation complete after 1s [id=aus2b0ql0ihgilIh95d7]
okta_auth_server_claim.auth_claim: Creating...
okta_group_memberships.admin_user: Creation complete after 1s [id=00g2b0rmupxo1C1HW5d7]
okta_group_memberships.restricted_user: Creation complete after 1s [id=00g2b0q4zejpq6hbi5d7]
okta_app_oauth.k8s_oidc: Creation complete after 1s [id=0oa2b0qc0x38Xjxbk5d7]
okta_app_group_assignments.k8s_oidc_group: Creating...
okta_auth_server_policy.auth_policy: Creating...
okta_auth_server_claim.auth_claim: Creation complete after 0s [id=ocl2b0rc6ejmIO4KR5d7]
okta_app_group_assignments.k8s_oidc_group: Creation complete after 1s [id=0oa2b0qc0x38Xjxbk5d7]
okta_auth_server_policy.auth_policy: Creation complete after 1s [id=00p2b0qjjxsSz0Mya5d7]
okta_auth_server_policy_rule.auth_policy_rule: Creating...
okta_auth_server_policy_rule.auth_policy_rule: Creation complete after 1s [id=0pr2b0rgnfxjyu6cy5d7]

Apply complete! Resources: 10 added, 0 changed, 0 destroyed.

Outputs:

k8s_oidc_client_id = "0oa2b0qc0x38Xjxbk5d7"
k8s_oidc_issuer_url = "https://dev-xxxxxx.okta.com/oauth2/aus2b0ql0ihgilIh95d7"
```

You can run `terraform destroy` to revert the changes if required.

> **TIP**: You can use the `terraform import <resource_name.id>` command to import data and configuration from your Okta instance. Refer to [these Okta Terraform provider docs](https://registry.terraform.io/providers/okta/okta/latest/docs) for more information.

# Preparing the cluster for OIDC

Now we need to prepare the cluster to work with OIDC. For this, we need to update the API server flags below:

- `oidc-issuer-url`: This will be your issuer URL from the Okta authorization server
- `oidc-client-id`: This is the client ID from the Okta OIDC application
- `oidc-username-claim`: This is the claim that will be used to identify the user. In this case, it is `email`.
- `oidc-groups-claim`: This is the claim that will be used to identify the groups. In this case, it is `groups`.
- `oidc-ca-file`: This is the CA file that is used to validate the OIDC server. If you are using Okta as an OIDC provider, then you don't need to set this.

**NOTE**: If you encounter an issue where OIDC groups/users collide with Kubernetes groups/users, you can set `oidc-groups-prefix` and `oidc-username-prefix` flags as well.

Flags can be set when creating the cluster or by patching the API server via SSH, as described below.

## Create a cluster with OIDC enabled

Here is how you can create a new k8s cluster with OIDC enabled using different tools. Execute the command for the tool you're using. Make sure to replace `<k8s_oidc_issuer_url>` and `<k8s_oidc_client_id>` with values from the output of the Terraform step. For any other tools, refer to their documentation on how to update API server flags.

### kubeadm

If you are using [kubeadm](https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/create-cluster-kubeadm/), add the following flags to the cluster configuration and pass them to `kubeadm init` command.

```yml
apiVersion: kubeadm.k8s.io/v1beta3
kind: ClusterConfiguration
apiServer:
  extraArgs:
    oidc-issuer-url: <k8s_oidc_issuer_url>
    oidc-client-id: <k8s_oidc_client_id>
    oidc-username-claim: email
    oidc-groups-claim: groups
```

### kOps

For [kOps](https://kops.sigs.k8s.io/), create a cluster with the required config. For example, the code below will create a cluster in AWS.

```bash
kops create cluster \
 --authorization RBAC \
 --name $CLUSTER_NAME \
 --cloud aws \
 --state $S3_STATE_STORE
```

Now edit the cluster config and add OIDC data.

```bash
kops edit cluster $CLUSTER_NAME --state $S3_STATE_STORE
```

Add this YAML to the `kubeAPIServer` spec.

```yaml
kubeAPIServer:
  authorizationRbacSuperUser: admin
  oidcIssuerURL: <k8s_oidc_issuer_url>
  oidcClientID: <k8s_oidc_client_id>
  oidcUsernameClaim: email
  oidcGroupsClaim: groups
```

### k3d

To create a [k3s](https://k3s.io/) cluster using [k3d](https://k3d.io/), run the following command.

```bash
# k3d v5.0.0+
k3d cluster create $CLUSTER_NAME \
--k3s-arg "--kube-apiserver-arg=oidc-issuer-url=<k8s_oidc_issuer_url>@server:0" \
--k3s-arg "--kube-apiserver-arg=oidc-client-id=<k8s_oidc_client_id>@server:0" \
--k3s-arg "--kube-apiserver-arg=oidc-username-claim=email@server:0" \
--k3s-arg "--kube-apiserver-arg=oidc-groups-claim=groups@server:0"
```

## Updating an existing cluster to enable OIDC

If you already have an existing cluster, you can SSH into it using the root user and patch the API server with the following command.

```bash
ssh root@master-node-ip

sudo vi /etc/kubernetes/manifests/kube-apiserver.yaml

...
    command:
    - /hyperkube
    - apiserver
    - --advertise-address=x.x.x.x
...

    - --oidc-issuer-url=<k8s_oidc_issuer_url> # <-- 🔴 update this
    - --oidc-client-id=<k8s_oidc_client_id> # <-- 🔴 update this
    - --oidc-username-claim=email # <-- 🔴 update this
    - --oidc-groups-claim=groups # <-- 🔴 update this
...
```

If you are using a managed service like [EKS](/blog/2021/10/08/secure-access-to-aws-eks#add-okta-as-an-oidc-provider-on-your-eks-cluster) or [GKE](https://cloud.google.com/kubernetes-engine/docs/how-to/oidc#enabling_on_an_existing_cluster), then follow their instructions to update the API server.

# Configure RBAC

[Role-based access control](https://kubernetes.io/docs/reference/access-authn-authz/rbac/) lets you control who can access what is inside a cluster. This is a very powerful feature and can be used to control access to specific resources. The great thing about using OIDC is that we can use it with RBAC to enable very granular control over resources.

Most Kubernetes distributions have RBAC enabled by default. If not, make sure to enable it before proceeding. It can be set using the `--authorization-mode` flag for the API server when creating or patching the cluster. For example, `--authorization-mode=RBAC,anotherMethod`.

For this exercise, we will use both groups we created in Okta. At the cluster level, we restrict admin access to a specific group that will be controlled via the OIDC provider, in this case, Okta.

Let's create a cluster role binding by applying the below YAML via kubectl. This binds to the built-in cluster role called `cluster-admin` and restricts access to users in the `k8s-admins` group in Okta. Now any user added to the group will have access to the cluster, and removing someone from the group will be enough to remove their access.

```bash
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

In real use cases, you may want to restrict further a group's access to specific resource types or namespaces, add multiple groups with different permissions, and so on. See [this](https://kubernetes.io/docs/reference/access-authn-authz/rbac/) for different possibilities.

Now, let's create a k8s role that can only view pods and services in the default namespace.

```bash
kubectl apply -f - <<EOF
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: default
  name: restricted-user
rules:
- apiGroups: [""] # "" indicates the core API group
  resources: ["pods", "services"]
  verbs: ["get", "watch", "list"]
EOF
```

Now we can bind the role to the second group we created in Okta.

```bash
kubectl apply -f - <<EOF
kind: RoleBinding
apiVersion: rbac.authorization.k8s.io/v1
metadata:
  name: oidc-cluster-user
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: restricted-user
subjects:
- kind: Group
  name: k8s-restricted-users
EOF
```

That's it! The cluster is now ready for some OIDC action.

# Connecting to the cluster using kubectl

Before we can go ahead and test this out, we need to do some setup for kubectl so that it knows how to do OIDC authentication. We need to install [kubelogin](https://github.com/int128/kubelogin) plugin for this. Go ahead and install it using any of the following commands.

```bash
# Homebrew (macOS and Linux)
brew install int128/kubelogin/kubelogin

# Krew (macOS, Linux, Windows and ARM)
kubectl krew install oidc-login
```

The plugin enables OIDC login capability for kubectl. Let's test it out first. Run the following command, make sure to replace `k8s_oidc_issuer_url` and `k8s_oidc_client_id` with what you saved earlier during Okta set up.

```bash
kubectl oidc-login setup --oidc-issuer-url=<k8s_oidc_issuer_url> --oidc-client-id=<k8s_oidc_client_id>
```

This should produce an output that looks like this:

```
authentication in progress...
Opening in existing browser session.

## 2. Verify authentication

You got a token with the following claims:

{
  "sub": "00u28lpcoheT48W5A5d7",
  "ver": 1,
  "iss": "<k8s_oidc_issuer_url>",
  "aud": "<k8s_oidc_client_id>",
  "iat": 1634657188,
  "exp": 1634660788,
  "jti": "ID.AmO7M7Z4xh_rSN4IHVuQEfJ4QuoADOWHSrVHuNyn9so",
  "amr": [
    "pwd"
  ],
  "idp": "0oa28lrldhsBglcC35d7",
  "nonce": "2Rsv7E84vo_K14J6qm9IgKjNsCUxb4Hc16qgzx9CKlk",
  "auth_time": 1634649927,
  "at_hash": "veXQkvqTjCl70OkZnKZVyA",
  "groups": [
    "k8s-admins"
  ]
}

```

Now let us update kubectl configuration to add an OIDC user:

```bash
kubectl config set-credentials oidc-user \
--exec-api-version=client.authentication.k8s.io/v1beta1 \
--exec-command=kubectl \
--exec-arg=oidc-login \
--exec-arg=get-token \
--exec-arg=--oidc-issuer-url=<k8s_oidc_issuer_url> \
--exec-arg=--oidc-client-id=<k8s_oidc_client_id> \
--exec-arg=--oidc-extra-scope="email offline_access profile openid"
```

Now we can use this user to authenticate to the cluster via kubectl.

```bash
kubectl get pods --user=oidc-user -n default
```

This should open a browser window to authenticate you. You can use your Okta account credentials to log in.

Test out this RBAC configuration by playing around with different users in different groups. Users who are not in the `k8s-admins` group in Okta should not be able to access any resource. Users who are only in the `restricted-users` group should only be able to see pods and services.

You can use the below command to set this user as default for your current kubectl context.

```
kubectl config set-context --current --user=oidc-user
```

# Learn more about using OIDC with Kubernetes

Using OIDC is a great way to secure your Kubernetes clusters, especially in bigger teams. It is more secure than any of the default Kubernetes authentication mechanisms. On top of that, it will let you manage users and their roles and permissions in your cluster, and even add multi-factor authentication for your cluster.

While this exercise shows you an Okta implementation, the process would be very similar for other OIDC providers. Check out the [Okta Terraform provider docs](https://registry.terraform.io/providers/okta/okta/latest/docs) to see what else can be automated via Terraform. You can also automate the Kubernetes parts via terraform using the [Kubernetes Terraform provider](https://registry.terraform.io/providers/hashicorp/kubernetes/latest/docs).

If you want to learn more about Kubernetes, OIDC, or using OIDC with Kubernetes, check out these additional resources.

- [OAuth 2.0 and OpenID Connect Overview](https://developer.okta.com/docs/concepts/oauth-openid/)
- [Secure Access to AWS EKS Clusters for Admins](/blog/2021/10/08/secure-access-to-aws-eks)
- [Build a Microservice Architecture with Spring Boot and Kubernetes](/blog/2019/04/01/spring-boot-microservices-with-kubernetes)
- [Kubernetes to the Cloud with Spring Boot and JHipster](/blog/2021/06/01/kubernetes-spring-boot-jhipster)
- [Using Okta Advanced Server Access & Terraform to Automate Identity & Infrastructure as Code](/blog/2020/04/24/okta-terraform-automate-identity-and-infrastructure)
- [Managing Multiple Okta Instances with Terraform Cloud](/blog/2020/02/03/managing-multiple-okta-instances-with-terraform-cloud)

You can find the code for this tutorial on GitHub at <https://github.com/oktadev/okta-k8s-oidc-terraform-example>.

If you liked this tutorial, chances are you'll like others we publish. Please follow [@oktadev on Twitter](https://twitter.com/oktadev) and [subscribe to our YouTube channel](https://youtube.com/oktadev) to get notified when we publish new developer tutorials.
