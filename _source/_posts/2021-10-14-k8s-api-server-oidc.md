---
layout: blog_post
title: "How to Secure Your Kubernetes Cluster with OpenID Connect and RBAC"
author: deepu-sasidharan
by: advocate
communities: [kubernetes, devops, security]
description: "Learn how to setup Okta as an OpenID Connect provider using Terraform for access to Kubernetes API Server"
tags: [kubernetes, devops, oidc, okta, terraform]
tweets:
  - "Use #OIDC to access #Kubernetes API Server securely. Set it up using Terraform."
  - "Access #Kubernetes API server using your favorite #OIDC provider!"
type: conversion
image: blog/k8s-api-server-oidc/social??.jpeg
---

A Kubernetes (k8s) cluster is made up of worker machines called nodes and a control plane which consists of the API server, scheduler, controller manager, cloud controller manager in case of a PaaS, and etcd. The containers that are deployed are run in pods on the worker nodes while the control plane takes care of scheduling, responding to requests, and managing the cluster.

{% img blog/k8s-api-server-oidc/arch.jpg alt:"K8s architecture" width:"800" %}{: .center-image }

When you are communicating with a Kubernetes cluster, lets say using kubectl or a client library or a tool like [KDash](https://kdash.cli.rs/), you are mostly interacting with the [Kubernetes API Server](https://kubernetes.io/docs/reference/command-line-tools-reference/kube-apiserver/). The API server is responsible for managing the cluster and is responsible for handling requests from a client.

**Table of Contents**{: .hide }

- Table of Contents
  {:toc}

# Why is it required to secure the API server?

The API Server has multiple layers of security. By default all communication with the API Server uses TLS and authentication is done using service account tokens, bearer tokens, basic authentication, a proxy, or client certificates depending on the platform and in case of PaaS like AWS, Azure, and GCP, it could also be done using custom authentication mechanisms. Once a request is authenticated the API Server can use one of several authorization mechanisms, like Attribute-based access control (ABAC) or Role-based access control (RBAC), to control access to resources. And finally there is also admission control modules which can be configured to control resource modifications.

Since the API Server is the only part of the Kubernetes cluster that can be accessed by a client, it is important to secure the API server. An unauthorized access of the API server can lead to hijack of the entire cluster and may be even your infrastructure, data theft and so on. Configuring users and roles properly is hence a must in order to secure the cluster, especially i9n organizations where more than one user can access the cluster.

# Why OpenID Connect?

> [OpenID Connect](https://developer.okta.com/docs/concepts/oauth-openid/) is an authentication standard built on top of OAuth 2.0. It adds an additional token called an ID token. OpenID Connect also standardizes areas that OAuth 2.0 leaves up to choice, such as scopes, endpoint discovery, and dynamic registration of clients

While the default authentication mechanism of Kubernetes API server might be enough for simple use cases, where the cluster is managed by only a handful of people, it does not scale for bigger organizations and its definitely not the most secure way as well. This is because Kubernetes does not handle user management and expects this to be done outside. This is where OpenID Connect (OIDC) comes in. OIDC can take care of managing users and groups which can work very well with the Kubernetes RBAC to provide very granular control of who can access what inside a cluster.

{% img blog/k8s-api-server-oidc/oidc-flow.jpg alt:"K8s OIDC flow" width:"800" %}{: .center-image }

<!-- Image ref: https://github.com/int128/kubelogin -->

Having an OIDC integration also means, you can use the same OIDC provider used to do SSO in your existing infrastructure to access your Kubernetes cluster as well, like Okta or Keycloak for example.

# Using Okta as a OIDC provider to secure the API Server.

> Okta, Inc. is an identity and access management company, providing cloud software that helps companies manage and secure user authentication into applications, and for developers to build identity controls into applications, websites, web services, and devices. Okta is a certified OpenID Connect provider.

Let us see how we can secure the Kubernetes API server using Okta as a OIDC provider and make use of RBAC to control access right from the Okta admin console. If you are using Amazon EKS, then check [this](https://developer.okta.com/blog/2021/10/08/secure-access-to-aws-eks) specific tutorial for using Okta OIDC with EKS.

## What You’ll Need to Get Started

Before you start trying this out, make sure you have access to the following

- An Okta account. You can sign up for a free account [here](https://www.okta.com/free-trial/). You can use another OIDC provider or [Dex](https://github.com/dexidp/dex) if you like and steps should be similar.
- A Kubernetes cluster. I'm using [k3d](https://k3d.io/) to run a local [k3s](https://k3s.io/) cluster. You can use any Kubernetes distribution including managed PaaS like AWS, Azure, GCP, and so on.
- kubectl installed on your machine.
- Terraform installed on your machine. This is not required if you do the Okta configuration via the [Okta admin console](https://login.okta.com/) GUI.

## Setup an Okta OIDC application and authorization server

You can achieve OIDC login for the cluster by creating a simple OIDC application with Okta either using the Okta CLI or the Admin console. But with an OIDC application alone, you would have to use the client secret to authenticate from kubectl or any other client library. Which does not scale and is not that much better than default k8s authentication mechanisms as you won't have granular controls over users and roles. For a more useful setup we would need an OIDC application and an authorization server with customized claims and policies for kubernetes. This way we can make use of Okta to manage users and permissions as well.

There are multiple ways to setup an OIDC application and authorization server in Okta. If you prefer to do this via a GUI, then follow the **Configure Your Okta Org section** from [this article](https://developer.okta.com/blog/2021/10/08/secure-access-to-aws-eks#configure-your-okta-org) to do it via the [Okta Admin console](https://login.okta.com/).

In this tutorial, we will use Terraform to configure the Okta part so that the code can be reused for automation and so on. Lets dive into each step required.

### Setup Terraform

If you don't have Terraform installed, follow [these instructions](https://learn.hashicorp.com/tutorials/terraform/install-cli) and set it up.

You can find the complete Terraform source code for this article in this [GitHub repo](https://github.com/oktadev/k8s-okta-oidc-terraform)

First we need to configure the Okta Terraform provider. Create a new terraform file, lets say `okta.main.tf` and add the following:

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

You would need to provide the values for the input variables `org_name`, `base_url` and `api_token`. For example, if the address of your Okta instance is `dev-1234.okta.com` then your `org_name` would be `dev-1234` and `base_url` would be everything that comes after the org name (e.g., okta.com). Update these values in a file named `okta.config.auto.tfvars`.

Next, You will need to generate the api-token value. Log into your Okta administrator console as a superuser and select **Security** -> **API** -> **Tokens (Tab)** from the navigation menu. Next, click the **Create Token** button and give your token a name, then click **Create Token** and copy the newly generated token. Save this in a separate `.tfvars` file that is excluded from Git or in an environment variable named `TF_VAR_api_token`.

The Okta provider is now configured and ready to go.

### Create groups

Now we need some groups to differentiate and map different kind of users who would want to access our clusters. Lets say we have a group of users who are administrators with full access to the cluster and another group of users who have limited access. You can have any number of groups as per your needs. Below configuration will create two groups. The privileges that the group has will be defined using Kubernetes RBAC policies on the cluster, which we will do later.

```hcl
# Setup OKTA groups
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

The below snippet looks up existing users and adds them to the groups. You can add any number of users at this stage or you can skip adding users and do it via the Okta admin console later. For this exercise i'm fetching existing users. You could also create new users using the `okta_user` resource.

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

Now that our groups are in place, lets create an OIDC application. We need an application of type `native` so that we can use PKCE as client authentication, which is much more secure tha using a client secret. We will also set teh redirect URIs to `localhost:8000` so that we can work with kubectl locally. We should also assign the groups we created earlier to this application here. Finally we can capture the client id of the created app using an output variable.

```
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

Next we would need a authorization server so that we can define policies and claims. We can also capture the issuer URL in an output variable.

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

Lets add a claim to the authorization sever so that it will add the users groups in the `id_token` when they authenticate. We will need this in order to do RBAC at kubernetes side. Also note that we are only adding groups that has a prefix `k8s-` to the claim. This is to avoid adding groups that are not related to kubernetes.

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

Now we need to create policies and rules for the authorization server. The below policy defines which OIDC applications it will be assigned to. Then we create a rule for the policy that will define the PKCE tokens lifetime and refresh interval. For this we are leaving the values at default, which is 1 hour lifetime and unlimited refresh interval, but you cans change them as per your needs.

```
# Add policy and rule to the authorization server

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

Now that the terraform code is ready lets apply this. First run `terraform plan` to see the changes that will be made. Then run `terraform apply` and type `yes` to apply the changes. You should see an output similar to this. You can also login to the Okta admin console to verify the changes.

Copy the output values as we will need them for next steps.

```
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

## Preparing the cluster

Now we need to prepare the cluster to work with OIDC. For this, we need to update the API Server flags below:

- `oidc-issuer-url`: This will be your issuer URL from the Okta authorization server
- `oidc-client-id`: This is the client ID from the Okta OIDC application
- `oidc-username-claim`: This is the claim that will be used to identify the user. In this case it is `email`.
- `oidc-groups-claim`: This is the claim that will be used to identify the groups. In this case it is `groups`.
- `oidc-ca-file`: This is the CA file that is used to validate the OIDC server. If you are using Okta as a OIDC provider, then you don't need to set this.

**Note**: If you encounter an issue where OIDC groups/users collide with kubernetes groups/users, you can set `oidc-groups-prefix` and `oidc-username-prefix` flags as well.

Flags can be set when creating the cluster or by patching the API Server via SSH.

### Create a cluster with OIDC enabled

Here is how you can create a new k8s cluster with OIDC enabled using different tools. Execute the command for the tool of preference. Make sure to replace `<k8s_oidc_issuer_url>` and `<k8s_oidc_client_id>` with values from the output of the Terraform step. For any other tools refer to their documentation on how to update API Server flags.

#### [kubeadmn](https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/create-cluster-kubeadm/)

Add the following flags to the cluster configuration and pass it to `kubeadm init` command.

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

#### [kOps](https://kops.sigs.k8s.io/)

Create a cluster with required config. For example below will create a cluster in AWS.

```bash
kops create cluster \
 --authorization RBAC \
 --name $CLUSTER_NAME \
 --cloud aws \
 --state $S3_STATE_STORE
```

Now edit the cluster config and add OIDC data

```bash
kops edit cluster $CLUSTER_NAME --state $S3_STATE_STORE
```

Add this yaml to the `kubeAPIServer` spec

```yaml
kubeAPIServer:
  authorizationRbacSuperUser: admin
  oidcIssuerURL: <k8s_oidc_issuer_url>
  oidcClientID: <k8s_oidc_client_id>
  oidcUsernameClaim: email
  oidcGroupsClaim: groups
```

#### [k3d](https://k3d.io/)

To create a [k3s](https://k3s.io/) cluster using k3d run the following command.

```bash
# k3d v5.0.0+
k3d cluster create $CLUSTER_NAME \
--k3s-arg "--kube-apiserver-arg=oidc-issuer-url=<k8s_oidc_issuer_url>@server:0" \
--k3s-arg "--kube-apiserver-arg=oidc-client-id=<k8s_oidc_client_id>@server:0" \
--k3s-arg "--kube-apiserver-arg=oidc-username-claim=email@server:0" \
--k3s-arg "--kube-apiserver-arg=oidc-groups-claim=groups@server:0"
```

### Updating an existing cluster to enable OIDC

If you already have an existing cluster, you can SSH into it using the root user and patch the API Server with the following command.

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

If you are using a managed service like [EKS](https://developer.okta.com/blog/2021/10/08/secure-access-to-aws-eks#add-okta-as-an-oidc-provider-on-your-eks-cluster) or [GKE](https://cloud.google.com/kubernetes-engine/docs/how-to/oidc#enabling_on_an_existing_cluster), then follow their instructions to update the API Server

## Configure RBAC

[Role-based access control](https://kubernetes.io/docs/reference/access-authn-authz/rbac/) lets you control who can access what inside a cluster. This is a very powerful feature and can be used to control access to specific resources. The great thing about using OIDC is that we can use it along with RBAC to enable very granular control over resources.

Most Kubernetes distributions have RBAC enabled by default, if not make sure to enable it before proceeding. It can be set using the `--authorization-mode` flag for API Server when creating or patching the cluster. For example, `--authorization-mode=RBAC,anotherMethod`.

For this exercise we use both groups we created in Okta. At the cluster level we restrict admin access to a specific group that will be controlled via the OIDC provider, in this case Okta.

Let's create a cluster role binding by applying the below YAML via kubectl. This binds to the built-in cluster role called `cluster-admin` and restricts access to users in the `k8s-admins` group in Okta. Now any user added to the group will have access to the cluster and removing someone from the group will be enough to take away their access.

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

In realistic use cases, you may want to further restrict a groups access to specific resource types or namespaces, add multiple groups with different permissions and so on. See [this](https://kubernetes.io/docs/reference/access-authn-authz/rbac/) for different possibilities.

Now, Let's create a k8s role that can only view pods and services in the default namespace.

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

Thats it! The cluster is now ready for some OIDC action.

## Connecting to the cluster using kubectl

Before we can go ahead and test this out, we need to do some setup for kubectl, so that it knows how to do OIDC authentication. We need to install [kubelogin](https://github.com/int128/kubelogin) plugin for this. Go ahead and install it using any of the following command.

```bash
# Homebrew (macOS and Linux)
brew install int128/kubelogin/kubelogin

# Krew (macOS, Linux, Windows and ARM)
kubectl krew install oidc-login
```

The plugin enables OIDC login capability for kubectl. lets test it out first. Run the following command, make sure to replace `k8s_oidc_issuer_url` and `k8s_oidc_client_id` with what you saved earlier during Okta setup.

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

Now let us update kubeconfig to add an oidc user:

```
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

```
kubectl get pods --user=oidc-user -n default
```

This should open a browser window to authenticate you. You can use your Okta account credential to log in.

You can play around with different users in different groups to test out the RBAC configuration we did. Users who are not in the `k8s-admins` group in Okta should not be able to access any resource and users who are only in the `restricted-users` group should only be able to see pods and services.

You can use the below command to set this user as default for your current kubectl context.

```
kubectl config set-context --current --user=oidc-user
```

# Conclusion

Using OIDC is a great way to secure your Kubernetes clusters especially in bigger teams. It is more secure than any of the default Kubernetes authentication mechanism and top of that it will let you manage users roles and permissions in your cluster and even add multi-factor authentication for your cluster. While this exercise shows how to do it with Okta, the process would be very similar for other OIDC providers as well.
