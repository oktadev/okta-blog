---
layout: blog_post
title: "Deploy Secure Spring Boot Microservices on Google GKE Using Terraform and Kubernetes"
author: jimena-garbarino
by: contractor
communities: [devops,security,java]
description: "Deploy a cloud-native Java Spring Boot microservice stack secured with Auth0 on Google GKE using Terraform and Kubernetes."
tags: []
tweets:
- ""
- ""
- ""
image:
type: awareness
---


- introduction


> **This tutorial was created with the following tools and services**:
> - [Java OpenJDK 21](https://jdk.java.net/java-se-ri/21)
> - [Auth0 account](https://auth0.com/signup)
> - [Auth0 CLI 1.4.0](https://github.com/auth0/auth0-cli#installation)
> - [Docker 26.1.2](https://docs.docker.com/desktop/)
> - [Google Cloud account](https://cloud.google.com/free)
> - [gcloud CLI 437.0.1](https://cloud.google.com/sdk/docs/install)
> - [JHipster 8.4.0](https://www.jhipster.tech/)
> - [kubectl 1.30.1](https://kubernetes.io/docs/tasks/tools/#kubectl)
> - [Terraform 1.8.3](https://developer.hashicorp.com/terraform/install)
> - [jq 1.6](https://jqlang.github.io/jq/download/)

{% include toc.md %}


## Build a microservices architecture with JHipster

Create a Java microservices architecture using [JHipster](https://www.jhipster.tech/), Spring Boot, and Consul. JHipster is an excellent tool for generating a microservice stack with Spring Boot, Angular/React/Vue.js, and other modern frameworks. For deploying the application of this demo, then you can either generate it using JHipster JDL or clone the sample repository from GitHub. Here is how you can build your microservices stack using JHipster:

**Option 1**: Generate the architecture with JHipster Domain Language (JDL)

```shell
mkdir jhipster-microservice-stack
cd jhipster-microservice-stack
# download the JDL file.
jhipster download https://raw.githubusercontent.com/indiepopart/jhipster-terraform-gke/main/apps.jdl
# Update the `dockerRepositoryName` property to use your Docker Repository URI/Name.
# scaffold the apps.
jhipster jdl apps.jdl
```
**Option 2**: Clone the sample repository

```shell
git clone https://github.com/indiepopart/jhipster-terraform-gke
```

## Create an GKE cluster using Terraform

Create a folder for the Terraform configuration, and some `*.tf` files:

```shell
mkdir terraform
cd terraform
touch providers.tf
touch cluster.tf
touch outputs.tf
touch variables.tf
touch terraform.tfvars
```

Edit the file `providers.tf` and add the following content:

```terraform
# terraform/providers.tf
terraform {
  required_version = ">=1.8"

  required_providers {
  }
}
```

Edit the file `cluster.tf` and add the Standalone VPC and GKE cluster configuration:

```terraform
# terraform/cluster.tf
resource "google_compute_network" "default" {
  project = var.project_id
  name    = "example-network"

  auto_create_subnetworks  = false
  enable_ula_internal_ipv6 = true
}

resource "google_compute_subnetwork" "default" {
  project = var.project_id
  name    = "example-subnetwork"

  ip_cidr_range = "10.0.0.0/16"
  region        = var.location

  stack_type       = "IPV4_IPV6"
  ipv6_access_type = "EXTERNAL"

  network = google_compute_network.default.id
  secondary_ip_range {
    range_name    = "services-range"
    ip_cidr_range = "10.1.0.0/24"
  }

  secondary_ip_range {
    range_name    = "pod-ranges"
    ip_cidr_range = "10.2.0.0/16"
  }
}

resource "google_container_cluster" "default" {
  project = var.project_id
  name    = "example-cluster"

  location                 = var.location
  enable_l4_ilb_subsetting = true
  initial_node_count       = 2
  datapath_provider        = "ADVANCED_DATAPATH"

  network    = google_compute_network.default.id
  subnetwork = google_compute_subnetwork.default.id

  node_config {
    machine_type = "e2-standard-2"
  }

  ip_allocation_policy {
    stack_type                    = "IPV4_IPV6"
    services_secondary_range_name = google_compute_subnetwork.default.secondary_ip_range[0].range_name
    cluster_secondary_range_name  = google_compute_subnetwork.default.secondary_ip_range[1].range_name
  }

  # Set `deletion_protection` to `true` will ensure that one cannot
  # accidentally delete this instance by use of Terraform.
  deletion_protection = false
}
```

Edit the file `outputs.tf` and add the following content:

```terraform
# terraform/outputs.tf
output "cluster_name" {
  value = google_container_cluster.default.name
}
```

Edit the file `variables.tf` and add the following content:

```terraform
# terraform/variables.tf
variable "project_id" {
  description = "project id"
}

variable "location" {
  description = "value of the location"
  default     = "us-east1"
}
```

Set the default Google project in the file `terraform/terraform.tfvars`:

```terraform
# terraform/terraform.tfvars
project_id = "<google-project-id>"
```

> **NOTE**: About requirements for Shared VPC, and network topology options

## Set up OIDC Authentication using Auth0

Since you are using Terraform, you can set up the Auth0 application using the Auth0 Terraform provider. This will allow you to automate the setup of the Auth0 application and manage the addition of users, customizations, and such.

Find your Auth0 domain with the following Auth0 CLI command:

```shell
auth0 tenants list
```

Create a machine-to-machine Auth0 client for Terraform to identify at Auth0:

```shell
auth0 apps create \
  --name "Auth0 Terraform Provider" \
  --description "Auth0 Terraform Provider M2M" \
  --type m2m \
  --reveal-secrets
```

Set the clientId and clientSecret as environment variables, as required by Terraform Auth0 provider:

```shell
export AUTH0_CLIENT_ID=<client-id>
export AUTH0_CLIENT_SECRET=<client-secret>
```

Find out the Auth0 Management API _id_ and _identifier_:

```shell
auth0 apis list
```
Set the id and identifier as environment variables:

```shell
export AUTH0_MANAGEMENT_API_ID=<auth0-management-api-id>
export AUTH0_MANAGEMENT_API_IDENTIFIER=<auth0-management-api-identifier>
```

Then retrieve all the scopes of the Auth0 Management API:

```shell
export AUTH0_MANAGEMENT_API_SCOPES=$(auth0 apis scopes list $AUTH0_MANAGEMENT_API_ID --json | jq -r '.[].value' | jq -ncR '[inputs]')
```

Finally, grant all the scopes to the newly created clientId:

```shell
auth0 api post "client-grants" --data='{"client_id": "'$AUTH0_CLIENT_ID'", "audience": "'$AUTH0_MANAGEMENT_API_IDENTIFIER'", "scope":'$AUTH0_MANAGEMENT_API_SCOPES'}'
```

Edit `terraform/providers.tf` and add the Auth0 provider:

```terraform
terraform {
  required_version = ">=1.8"

  required_providers {
    auth0 = {
      source  = "auth0/auth0"
      version = "~> 0.49.0"
    }
  }
}
```

Create a configuration file for the Auth0 resources:

```shell
cd terraform
touch auth0.tf
```

Edit `auth0.tf` and add the following content:

```terraform
# terraform/auth0.tf
provider "auth0" {
  domain        = "https://<your-auth0-domain>"
  debug         = false
}

# Create a new Auth0 application for the JHipster app
resource "auth0_client" "java_ms_client" {
  name                = "JavaMicroservices"
  description         = "Java Microservices Client Created Through Terraform"
  app_type            = "regular_web"
  callbacks           = ["http://store.example.com/login/oauth2/code/oidc"]
  allowed_logout_urls = ["http://store.example.com"]
  oidc_conformant     = true

  jwt_configuration {
    alg = "RS256"
  }
}

# Configuring client_secret_post as an authentication method.
resource "auth0_client_credentials" "java_ms_client_creds" {
  client_id = auth0_client.java_ms_client.id

  authentication_method = "client_secret_post"
}

# Create roles for the JHipster app
resource "auth0_role" "admin" {
  name        = "ROLE_ADMIN"
  description = "Administrator"
}

resource "auth0_role" "user" {
  name        = "ROLE_USER"
  description = "User"
}

# Create an action to customize the authentication flow to add the roles and the username to the access token claims expected by JHipster applications.
resource "auth0_action" "jhipster_action" {
  name    = "jhipster_roles_claim"
  runtime = "node18"
  deploy  = true
  code    = <<-EOT
  /**
   * Handler that will be called during the execution of a PostLogin flow.
   *
   * @param {Event} event - Details about the user and the context in which they are logging in.
   * @param {PostLoginAPI} api - Interface whose methods can be used to change the behavior of the login.
   */
   exports.onExecutePostLogin = async (event, api) => {
     const namespace = 'https://www.jhipster.tech';
     if (event.authorization) {
       api.idToken.setCustomClaim('preferred_username', event.user.email);
       api.idToken.setCustomClaim(namespace + '/roles', event.authorization.roles);
       api.accessToken.setCustomClaim(namespace + '/roles', event.authorization.roles);
     }
   };
  EOT

  supported_triggers {
    id      = "post-login"
    version = "v3"
  }
}

# Attach the action to the login flow
resource "auth0_trigger_actions" "login_flow" {
  trigger = "post-login"

  actions {
    id           = auth0_action.jhipster_action.id
    display_name = auth0_action.jhipster_action.name
  }
}

# Create a test user. You can create more users here if needed
resource "auth0_user" "test_user" {
  connection_name = "Username-Password-Authentication"
  name            = "Jane Doe"
  email           = "jhipster@test.com"
  email_verified  = true
  # Don't set passwords like this in production! Use env variables instead.
  password        = "passpass$12$12"
  lifecycle {
    ignore_changes = [roles]
  }
}

resource "auth0_user_roles" "test_user_roles" {
  user_id = auth0_user.test_user.id
  roles   = [auth0_role.admin.id, auth0_role.user.id]
}

output "auth0_webapp_client_id" {
  description = "Auth0 JavaMicroservices Client ID"
  value       = auth0_client.java_ms_client.client_id
}

output "auth0_webapp_client_secret" {
  description = "Auth0 JavaMicroservices Client Secret"
  value       = auth0_client_credentials.java_ms_client_creds.client_secret
  sensitive   = true
}
```

## Provision with Terraform

Now you can run the Terraform script to create the Auth0 application. Run the following commands to initialize the script and apply it.

```shell
terraform init
terraform plan -out main.tfplan
```

Review the plan and make sure everything is correct. Then apply changes:

```shell
terraform apply main.tfplan
```

Once the GKE cluster is ready, you will see the Terraform output:

```
Apply complete! Resources: 35 added, 0 changed, 0 destroyed.

Outputs:

kube_config = <sensitive>
kubernetes_cluster_name = "cluster-helping-terrier"
resource_group_name = "rg-ecommerce-eastus2"
spoke_pip = "4.153.103.124"
```

Note the `auth0_webapp_client_id` from the output and get the `auth0_webapp_client_secret` with:

```shell
terraform output auth0_webapp_client_secret
```

## Deploy the microservices stack

### Build the Docker images

You need to build Docker images for each app. This is specific to the JHipster application used in this tutorial which uses [Jib](https://github.com/GoogleContainerTools/jib) to build the images. Make sure you are logged into Docker using `docker login`. Navigate to each app folder (store, invoice, product) and run the following command:

```shell
./gradlew bootJar -Pprod jib -Djib.to.image=<docker-repo-uri-or-name>/<image-name>
```

### Update the Kubernetes descriptors

Update `kubernetes/registry-k8s/application-configmap.yml` with the Spring Security OIDC configuration returned by Terraform. This configuration is loaded into Consul, and it shares the values with the gateway and microservices.

```yml
apiVersion: v1
kind: ConfigMap
metadata:
  name: application-config
  namespace: jhipster
#common configuration shared between all applications
data:
  application.yml: |-
    configserver:
      name: Consul
      status: Connected to Consul running in Kubernetes
    logging:
      level:
        ROOT: INFO
    jhipster:
      security:
        authentication:
          jwt:
            base64-secret: NTY5NTUyYzUzZDFlNjBkNjMzNDNkZWQzNDk0ZjAwOTQzZTU2ZTMyOTgxYTI3ZTZjYWViNjEzMmM3MGQ5MDNlY2YwYjY2MDc0ZDNlZWM1ZTY3ZDllNDE4NDlhY2M2YmViY2E3Mg==
        oauth2:
          audience:
            - https://<your-auth0-domain>/api/v2/
    spring:
      security:
        oauth2:
          client:
            provider:
              oidc:
                issuer-uri: https://<your-auth0-domain>/
            registration:
              oidc:
                client-id: <client-id>
                client-secret: <client-secret>
```

In the `kubernetes/store-k8s` folder, edit the file `store-service.yml` and set the following content:

```yml
# kubernetes/store-k8s/store-service.yml
apiVersion: v1
kind: Service
metadata:
  name: store
  namespace: jhipster
  labels:
    app: store
spec:
  selector:
    app: store
  ports:
    - name: http
      targetPort: 8080
      port: 80
```

Also, create a file `kubernetes/store-k8s/store-ingress.yml` and set the following content:

```yml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: store-ingress
  namespace: jhipster
  annotations:
    kubernetes.io/ingress.class: "gce"
spec:
  rules:
  - host: store.example.com
    http:
      paths:
      - path: "/"
        pathType: Prefix
        backend:
          service:
            name: store
            port:
              number: 80
```

### Get cluster credentials

For `kubectl` commands, run the following Google Cloud CLI option for retrieving the cluster credentials:

```shell
gcloud container clusters get-credentials <kubernetes-cluster-name> --location us-east1
```

Then check the cluster details with `kdash` or `kubectl get nodes`.

```
AME                                STATUS   ROLES    AGE     VERSION
aks-agentpool-71839675-vmss000000   Ready    <none>   4m58s   v1.29.7
aks-agentpool-71839675-vmss000002   Ready    <none>   4m27s   v1.29.7
aks-agentpool-71839675-vmss000003   Ready    <none>   4m31s   v1.29.7
aks-agentpool-71839675-vmss000004   Ready    <none>   3m43s   v1.29.7
```

### Deploy the microservices to GKE

You can deploy the microservices with the script generated by JHipster:

```shell
cd kubernetes
./kubectl-apply.sh -f
```

With `kdash`, check the pods status in the `jhipster` namespace:

{% img blog/jhipster-terraform-gke/kdash.png alt:"Pod status with kdash" width:"900" %}{: .center-image }

The Ingress configuration requires inbound traffic to be for the host `store.example.com`, you can test the store service by adding an entry in your _hosts_ file that maps to the gateway public IP:

```shell
terraform output spoke_pip
```

Then navigate to `http://store.example.com` and sign in at Atuh0 with the test user/password jhipster@test.com/passpass$12$12. The authentication flow will redirect back to the application home:

{% img blog/jhipster-terraform-gke/jhipster-application.png alt:"Store application home" width:"900" %}{: .center-image }

## Tear down the cluster with Terraform

Once you finish verifying the deployment, don't forget to remove all resources to avoid unwanted costs. You can first delete the deployment with:

```shell
kubectl delete namespace jhipster
```

And then, delete the architecture with:

```shell
terraform destroy -auto-approve
```

## Learn more about Java Microservices, Kubernetes and Jhipster

In this post, you learned about JHipster microservices deployment to Azure Kubernetes Service using Terraform for provisioning a GKE cluster in a Standalone VPC. You can find the code shown in this tutorial on [GitHub](https://github.com/indiepopart/jhipster-terraform-gke). If you'd rather skip the step-by-step Terraform configuration and prefer jumping straight into the deployment, follow the [README](https://github.com/indiepopart/jhipster-terraform-gke) instructions in the same repository.

Also, if you liked this post, you might enjoy these related posts:

- [Deploy Secure Spring Boot Microservices on Amazon EKS Using Terraform and Kubernetes](https://auth0.com/blog/terraform-eks-java-microservices/)
- [Identity in Spring Boot with Kubernetes, Keycloak, and Auth0](https://auth0.com/blog/identity-in-spring-boot-with-kubernetes-keycloak-and-auth0/)
- [Micro Frontends for Java Microservices](https://auth0.com/blog/micro-frontends-for-java-microservices/)
- [Build a Beautiful CRUD App with Spring Boot and Angular](https://auth0.com/blog/spring-boot-angular-crud/)
- [Get Started with the Auth0 Terraform Provider](https://auth0.com/blog/get-started-with-auth0-terraform-provider/)
- [A Passwordless Future: Passkeys for Java Developers](https://auth0.com/blog/webauthn-and-passkeys-for-java-developers/)

Please follow us on Twitter [@oktadev](https://twitter.com/oktadev) and subscribe to our [YouTube channel](https://www.youtube.com/oktadev) for more Spring Boot and microservices knowledge.

You can also sign up for our [developer newsletter](https://a0.to/nl-signup/java) to stay updated on everything Identity and Security.
