---
layout: blog_post
title: "Java microservices on Amazon EKS using Terraform"
author:
by: advocate
communities: [devops,security,java]
description: ""
tags: []
tweets:
- ""
- ""
- ""
image:
type: conversion
---


Prerequisites

- [AWS account](https://portal.aws.amazon.com/billing/signup) with the IAM permissions listed on the EKS module documentation,
- AWS CLI [installed](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html) and [configured](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-quickstart.html)
- [AWS IAM Authenticator](https://docs.aws.amazon.com/eks/latest/userguide/install-aws-iam-authenticator.html)
- kubectl
- docker
- Terraform
- Java 11+
- jHipster (optional)

```
jhipster jdl apps.jdl --fork --skip-git
aws configure // https://console.aws.amazon.com/iam/home?#/security_credentials

terraform init
terraform plan
terraform apply

okta apps create jhipster

./gradlew bootJar -Pprod jib -Djib.to.image=deepu105/store
./gradlew bootJar -Pprod jib -Djib.to.image=deepu105/product
./gradlew bootJar -Pprod jib -Djib.to.image=deepu105/invoice
./gradlew bootJar -Pprod jib -Djib.to.image=deepu105/notification

```
