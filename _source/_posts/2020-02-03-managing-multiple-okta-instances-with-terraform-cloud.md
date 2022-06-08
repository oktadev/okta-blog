---
disqus_thread_id: 7851169652
discourse_topic_id: 17210
discourse_comment_url: https://devforum.okta.com/t/17210
layout: blog_post
title: "Managing Multiple Okta Instances with Terraform Cloud"
author: andy-march
by: internal-contributor
communities: [devops]
description: "Learn how to utilize Terraform and Terraform Cloud to make managing Okta simpler."
tags: [okta, terraform]
tweets:
  - "Check out our new guide, which shows you how to use #Terraform to manage @okta."
  - "Our very own @andymarch just published an excellent new guide showing you how to use #Terraform and Terraform Cloud!"
  - "Use #Terraform and Terraform Cloud to manage @okta: it's simple!"
image: blog/okta-terraform-cloud/terraform-plan.png
type: conversion
changelog:
  - 2021-11-08: Updated the post to align with the latest Terraform version, latest Okta Terraform provider, and Okta Admin Console. Changes to this article can be viewed in [oktadev/okta-blog#958](https://github.com/oktadev/okta-blog/pull/958).
---

Congratulations, you've chosen to use [Okta](/) to solve your identity problems. Welcome to the happy sunny utopia of a managed identity solution! But wait! How do you manage your environments? Your applications all have separate production, staging, and development environments. How do you manage that in Okta without writing a ton of custom scripts?

In this post, you'll learn how to manage multiple Okta instances using [Terraform](https://www.terraform.io/) and our [Okta Terraform Provider](https://www.terraform.io/docs/providers/okta/index.html). I'll walk you through everything you need to know to keep all your Okta environments in sync and manageable.

**PS**: The rest of this post assumes you already have _at least_ one Okta account. If you don't, you can create a free-forever developer account by visiting <https://developer.okta.com/signup/>.

{% include toc.md %}

## Use Terraform to Manage Okta State

You have many options when it comes to picking a solution in the configuration management space: Chef, Puppet, Ansible, Salt, etc. Throughout this post, you'll be working with Terraform as it sits in the [sweet spot between orchestration and automation](https://www.okta.com/blog/2019/08/better-together-using-the-okta-integration-with-hashicorp-terraform/).

Instead of using the Okta Admin UI to configure all of your Okta settings and resources, you'll define your Okta configuration in Terraform configuration files using the declarative HashiCorp Configuration Language (HCL). Terraform will then make the necessary API calls to Okta to configure things in the way you've defined, enabling you to automate the provisioning, deployment, and configuration of your Okta org.

Suppose another administrator modifies your resources from the administrative console. In that case, you'll be able to see the changes at a glance and revert them to your defined state if you so choose.

To follow this guide, make sure that Terraform is installed and available on your machine. If you don't have Terraform installed and set up already, read through the official [Hashicorp installation guide](https://learn.hashicorp.com/terraform/getting-started/install.html) and set it up before continuing.

## Get Started with Terraform and Okta

To get started, let's create a simple Terraform script to update Okta's user schema and define some custom attributes.

Before continuing, you'll need to know your Okta organization name. Your Okta org will have a name like `dev-1234.okta.com`. Make a note of this org name (`dev-1234`), as you'll need it through this tutorial.

First, create a new local directory to hold your Terraform configuration files, then initialize Terraform. To do this, run the following commands:

```bash
mkdir okta-user-schema
cd okta-user-schema
```

Next, create a file named `okta.auto.tfvars` and insert the code below. This file will hold your Okta configuration values that Terraform will use to talk to the Okta APIs.

```
org_name  = "<your-org>"
base_url  = "okta.com"
```

Replace each of the placeholder values above with those from your Okta org. For example, you should use the subdomain of your Okta org to fill in the `org_name` value. If the address of your Okta instance is `dev-1234.okta.com`, then your `org_name` would be `dev-1234`. The value for `base_url` should be everything that comes after the org name (e.g., `okta.com`) so be sure to update this value if you are using an `okta-emea` or `oktapreview` org.

Next, you will need to generate the `api_token` value. To generate a new Okta API token, log into your Okta administrator console as a superuser and select **Security** > **API** > **Tokens (tab)** from the navigation menu. Next, click the **Create Token** button, give your token a name, click **Create Token**, and copy the newly generated token. Save this in a separate `secret.auto.tfvars` file excluded from Git or in an environment variable named `TF_VAR_api_token`.

Next, create a new file named `identity.tf` and add the following:

```hcl
variable "org_name" {}
variable "api_token" {}
variable "base_url" {}

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
    org_name = var.org_name
    base_url = var.base_url
    api_token = var.api_token
}
```

This enables the latest version of Okta provider for Terraform and configures it using the three variables from our `okta.auto.tfvars`.

Now, run `terraform init` to initialize the Terraform state file in your directory that tracks the configuration Terraform has applied to your resources.

Now, add the following to `identity.tf`:

```hcl
resource "okta_user_schema_property" "dob_extension" {
  index  = "date_of_birth"
  title  = "Date of Birth"
  type   = "string"
  master = "PROFILE_MASTER"
}
```

This will extend the Okta user schema by adding a field to store users' date of birth.

To test this script, run `terraform plan` from the command line. This should print a list of the changes the Terraform will make to your Okta org:

{% img blog/okta-terraform-cloud/terraform-plan.png alt:"Terraform plan" width:"800" %}{: .center-image }

Before you change anything, you'll want to version control your new configuration. From the command line, run:

```console
git init
git add identity.tf okta.auto.tfvars
git commit -m "Initial commit. Adding the date of birth extension"
```

> **NOTE**: Don't push your `secret.auto.tfvars` file that contains the `api_token` to source control. Add it into your `.gitignore` file, so you don't accidentally include it. You can also ignore `.tfstate` and `.hcl` files and the `.terraform` folder.

Now that you've defined your Terraform rules, you can apply these changes by running `terraform apply` on the command line. If you do this, Terraform will actually modify your user schema as defined above by talking to the Okta APIs. It will also update the state file on your local machine and keep track of the resources it creates.

## Get Started with Terraform Cloud

Although working on your local machine is fine if you're building a simple project solo, in many cases, you'll want to use [Terraform Cloud](https://www.terraform.io/docs/cloud/index.html), which allows you to have a nice Terraform workflow without needing to track state files locally. It's incredibly convenient to use for any _real_ project.

Now let's set up Terraform Cloud so you can configure your infrastructure without needing to worry about storing and managing local files.

If you don't already have a Terraform Cloud account, you can sign up for a (free account)[https://app.terraform.io/signup/account], which you can use with a team of up to five people.

Once you create an account and sign in, you must choose the **Start from scratch** option on the welcome screen. On the next screen, create an organization and proceed. Now, you are going to create a "Workspace". Workspaces describe your environments (production, staging, development, etc.). The environment you'll create below will be a "production" environment (we'll create others later).

{% img blog/okta-terraform-cloud/terraform-cloud-create-workspace.png alt:"Create workspace using Terraform Cloud" width:"800" %}{: .center-image }

On the first page of the Workspace creation flow, select **Version control flow**, as we will be saving our configuration in a Git repository. Next, you need to select your source control provider. In my case, I'm using GitHub to store my code, so I'll select GitHub and grant permission for Terraform Cloud to access my project. When GitHub prompts to select repositories to install Terraform cloud, choose one or more repositories where you intend to store Terraform configurations.

{% img blog/okta-terraform-cloud/terraform-cloud-select-repository.png alt:"Terraform Cloud select provider" width:"800" %}{: .center-image }

After authorizing with GitHub, click the GitHub button again to choose the repository that holds the project we created. If you haven't already, push the `okta-user-schema` project to this repository.

{% img blog/okta-terraform-cloud/terraform-cloud-select-repository-2.png alt:"Terraform Cloud select repository" width:"800" %}{: .center-image }

Give your new workspace a descriptive name. We're defining our production environment in this example, so use the repository's name with `-production` added to the end for clarity. For example, `my-project-production`.

{% img blog/okta-terraform-cloud/terraform-cloud-name-workspace.png alt:"Terraform Cloud name workspace" width:"800" %}{: .center-image }

Locally you defined variables in the `okta.auto.tfvars` file. But we didn't add the api_token variable to that file for obvious security reasons; hence the variable is not stored in source control. Therefore, you have to define the variable explicitly in the Terraform workspace. Click the **Variables** tab in the top navbar of the workspace, then define the `api_token` variable.

{% img blog/okta-terraform-cloud/terraform-cloud-set-variables.png alt:"Terraform Cloud set variables" width:"800" %}{: .center-image }

For your API token, instead of using the same Okta SSWS token you used locally, you may want to create a separate token or even create a service account to issue a token so you can distinguish Terraform Cloud's API usage from your own in your Okta logs. Whatever you do, make sure you mark the API token value as **Sensitive** when you define it, so it isn't exposed to anyone with access to your Terraform console.

Now that you've configured your workspace, select **Start new plan** from the top right **Actions** menu, enter a reason, and then press **Start plan**.

{% img blog/okta-terraform-cloud/terraform-cloud-variables.png alt:"Terraform Cloud variables" width:"500" %}{: .center-image }

Your Terraform plan will now run as it did in your local environment.

{% img blog/okta-terraform-cloud/terraform-cloud-analyze-changes.png alt:"Terraform Cloud analyze changes" width:"800" %}{: .center-image }

To apply the changes, click **Confirm & Apply** at the bottom of the plan result and add a comment when prompted.

{% img blog/okta-terraform-cloud/terraform-cloud-confirm-changes.png alt:"Terraform Cloud confirm changes" width:"600" %}{: .center-image }
{% img blog/okta-terraform-cloud/terraform-cloud-leave-comment.png alt:"Terraform Cloud leave comment" width:"600" %}{: .center-image }

Once you click **Confirm Plan**, Terraform will run and apply your changes.

{% img blog/okta-terraform-cloud/terraform-cloud-apply-running.png alt:"Terraform Cloud apply running" width:"800" %}{: .center-image }

If you now look at your Okta user schema by clicking **Directory** > **Profile Editor** > **Okta** > **Profile** in your Okta Admin Console, you'll be able to see that Terraform has added the date of birth attribute at the end of the list.

{% img blog/okta-terraform-cloud/okta-date-of-birth.png alt:"Okta date of birth" width:"800" %}{: .center-image }

Click **Reports** > **System Log** in your Okta Admin Console and scroll down to look at the latest log entry. You'll now see that the configurations changes are logged as the user who minted the API token. Nice, right?

{% img blog/okta-terraform-cloud/okta-logs.png alt:"Okta logs" width:"800" %}{: .center-image }

Another nice collaboration feature of Terraform Cloud is that you can leave comments on completed runs. This can be useful for discussing configuration changes with your team.

{% img blog/okta-terraform-cloud/terraform-cloud-view-comments.png alt:"Terraform Cloud view comments" width:"800" %}{: .center-image }

## Manage Multiple Okta Environments with Terraform

Now that you're using Terraform Cloud to manage a single environment (production), let's add a second environment (development). Doing so will make it easy for your developers to run tests against this new Okta environment without impacting production.

If you don't have a second Okta org yet, [go create one](https://developer.okta.com/signup/), and then go through the steps to create an API token once more.

Next, create a new Git branch in your project called `dev`. This is where you'll work on your product before releasing it to production (the `main` branch).

```console
git checkout -b dev
git push origin dev
```

In Terraform Cloud, create a new workspace to represent this new environment. Target the same repository as before but set the branch specifier to `dev`.

{% img blog/okta-terraform-cloud/terraform-cloud-create-workspace.jpg alt:"Terraform Cloud create workspace" width:"800" %}{: .center-image }

For this environment, set the apply method in Terraform Cloud to `auto` so changes will be applied to the environment immediately if the planning stage is successful without you needing to confirm anything manually.

{% img blog/okta-terraform-cloud/terraform-cloud-create-workspace-2.jpg alt:"Terraform Cloud workspace settings" width:"800" %}{: .center-image }

Update the `okta.auto.tfvar` file using your _new_ Okta org's `org_name` and `base_url`. Create a new Terraform Cloud workspace variable for `api_token` and make sure to use the API Token from the new Okta org. Click **Start new plan** and just like that, Terraform replicates your production Okta configuration from your first Okta org into the second Okta org!

## Promoting Changes Using Terraform

Now that you've set up Terraform to manage your development and production environments, let's imagine your development team wants to change how Okta is configured. You'd like them to be able to do this, but you'd also still like to control and review these changes before they make their way into production. What do you do?

To control this, you can use GitHub's [branch protection rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/defining-the-mergeability-of-pull-requests/about-protected-branches) feature to ensure that you review any changes going onto our main branch that controls production before they are applied. This feature is only available on pro or public repos, so you will need to make your repository public to follow along.

In your GitHub repository, click **Settings** > **Branches** > **Add Rule** and enter `main` as the branch name pattern to protect. You can then combine the rules you wish to use to protect the production configuration. Here we're going to apply the `Require a pull request before merging` > `Require approvals` and `Require status checks to pass before merging` rules. With these two flags, you can ensure that one of the repository owners reviews changes before a merge into the main branch is performed and that the dev environment is in a good state.

{% img blog/okta-terraform-cloud/github-branch-protection.png alt:"GitHub branch protection" width:"800" %}{: .center-image }

Let's try the new change control process. On your `dev` branch, add the following change to the `identity.tf` file:

```hcl
resource "okta_user_schema_property" "crn_extension" {
  index  = "customer_reference_number"
  title  = "Customer Reference Number"
  required = true
  type   = "string"
  master = "PROFILE_MASTER"
  depends_on = [okta_user_schema_property.dob_extension]
}
```

Now save and push these changes to your remote repository.

Terraform will trigger and run your plan (and apply it if successful) to the dev environment.

If you go to **Directory** > **Profile Editor** > **Okta** > **Profile** in your Okta Admin Console of the development org, you should see that Terraform applied both your schema extensions.

Once you're happy with the changes you have made to the development environment, you'll want to promote them to the production environment. To do this, you'll need to create a pull request from your `dev` branch to the `main` branch that controls production. As you have branch protection enabled, this provides an opportunity for others to review the changes and for any discussion to take place before you change the production configuration.

{% img blog/okta-terraform-cloud/github-open-pull-request.png alt:"GitHub open pull request" width:"800" %}{: .center-image }

Once you create the pull request, GitHub provides a nice UI experience that shows the branch protection in action.

{% img blog/okta-terraform-cloud/github-review-required.png alt:"GitHub review required" width:"800" %}{: .center-image }

The status checks run plans against your two Okta instances so the reviewer can verify what the change will do. Clicking **details** on either of these will open Terraform Cloud and show the output of the plan.

In this case, the change proposed to the schema may have an unintended side effect, so the reviewer asked for a modification before applying.

{% img blog/okta-terraform-cloud/github-comment.png alt:"GitHub comment" width:"800" %}{: .center-image }

Once you have made corrections and pushed the changes to the dev branch, Terraform will run the plan again to validate the change. Once you are satisfied, the reviewer can approve the pull request and merge the change to `main`.

> **NOTE**: If you are an administrator of the repository, you can force the merge through without needing someone else to review it.

Now that the pull request is merged to the `main` branch, the production workspace will automatically rerun the Terraform plan, and you will be given one last chance to confirm the changes.

{% img blog/okta-terraform-cloud/terraform-cloud-apply-finished.png alt:"Terraform Cloud apply finished" width:"800" %}{: .center-image }

And that's all!

## Learn more about Terraform and Okta

You now have a simple multi-stage build pipeline that allows you to review and deploy changes to each of your Okta environments simply and reliably. This enables you to manage your identity service just like you would any other infrastructure component.

To continue learning about Terraform, Okta security, and DevOps, check out the links below:

- [How to Secure Your Kubernetes Cluster with OpenID Connect and RBAC](/blog/2021/11/08/k8s-api-server-oidc)
- [The Things to Keep in Mind about Auth](/blog/2021/10/29/things-to-keep-in-mind-about-auth)
- [A Developer's Guide to Docker](/blog/2017/05/10/developers-guide-to-docker-part-1)
- [Container Security: A Developer Guide](/blog/2019/07/18/container-security-a-developer-guide)
- [Kubernetes to the Cloud with Spring Boot and JHipster](/blog/2021/06/01/kubernetes-spring-boot-jhipster)

If you liked this tutorial, chances are you will like the others we publish. Please follow [@oktadev on Twitter](https://twitter.com/oktadev) and [subscribe to our YouTube channel](https://youtube.com/oktadev) to get notified when we publish new developer tutorials.
