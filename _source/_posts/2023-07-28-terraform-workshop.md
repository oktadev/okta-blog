---
layout: blog_post
title: "Okta Terraform Workshop"
author: aaron-parecki
by: advocate
communities: [devops,go]
description: "With enterprise-ready identity added to your SaaS app, you're ready to take your app beyond MVP! Find out how you can make your app stand out, and get a closer look at provisioning and Okta workflows with Aaron Parecki, Security Architect Group Manager at Okta."
tags: [devday23, enterprise-ready]
tweets:
- ""
image: blog/devday23-beyond-mvp/social.jpg
type: awareness
---


In this hands-on workshop, you will use Terraform to manage users and groups in your Okta Developer Organization.-

# Why Terraform? 

Terraform is a general-purpose Infrastructure As Code tool. Okta's Terraform module lets you write code to accomplish tasks that would otherwise require manual work in the Okta Admin Console. Moving administration tasks to Terraform offers several benefits over doing them by hand: 


* Testing and review. Terraform can guarantee that you make the exact same change to production as to your test environment. You can use your existing code review processes to make sure the right people have approved a change when it happens in Terraform, as well. 
* CI/CD Automation. Terraform lets you add Okta tasks to your continuous integration and continuous delivery pipelines. A Terraform integration in your Okta org has limited scopes, just like a human user, so your automation can only make the kinds of changes that you expect it to. 
* Sharing configuration. If you want to help someone else to make a specific change in their Okta organization, you can give them Terraform code which describes that change.Terraform can make the exact same change anywhere it's run, whereas telling a person how to configure their organization through the admin console increases the opportunities for human error. 
* Auditability. If you already have tools which back up and track changes to your codebase, adding Terraform code to those tools lets you apply all their benefits to your Okta organization's configuration. 

If you're new to Terraform, start with Hashicorp's [Terraform tutorials](https://developer.hashicorp.com/terraform/tutorials). This workshop assumes that you already have Terraform installed on your computer, and that you have an Okta Developer Account. 

# Key Terraform Concepts

Terraform code describes a desired state for cloud infrastructure to be in. After writing Terraform code, the `terraform plan` command predicts what changes will be required to make the infrastructure match the code, and the `terraform apply` command changes the infrastructure. 

Terraform code is analogous to a well-written ticket for an ops team. For instance, if the ticket asks the operator to create a new user account on a cloud service, the operator would first log in to the web UI and check whether the user account already exists. Checking the current state of the infrastructure is what Terraform does when a person or automated system runs `terraform plan`. Next, the operator would use their knowledge of the cloud provider to click the buttons which create the requested account. Changing the infrastructure is what Terraform does during `terraform apply`. 

The operator completing a ticket needs to have credentials to the cloud service, and knowledge of how to use that service. Terraform also needs to know how to use the service, and needs to be authorized to make changes. Terraform's knowledge of each service comes from a codebase called a provider, which defines resources for each piece of infrastructure that the provider can manage. Arguments passed to the provider in the Terraform code include the secrets which it uses to authenticate with the cloud service that the provider describes. 

A Terraform project is a directory containing .tf files. These Terraform files contain providers, resources, and perhaps variables and data sources too. After running terraform init in a Terraform project, Terraform downloads all required providers to a .terraform directory in that project. 

Terraform also stores data about the state of the infrastructure by creating the file terraform.tfstate in the Terraform project. Every piece of infrastructure should be represented in only one terraform.tfstate file, so if several collaborators work on the same Terraform codebase together, it's best to use Terraform Cloud or a similar service to share a single terraform.tfstate file. 


# Setting Up the Okta Terraform Provider
## Security Note
Setting up any Terraform provider involves working with some secrets that can grant access to your infrastructure. The Okta terraform provider uses a client ID and private key. Anyone who has these secrets can act on behalf of Terraform in your Okta organization. Secrets are replaced by placeholder values in the code examples that follow. 

When you work with Terraform, you must manage these secrets as carefully as you protect every other means of accessing your infrastructure. If you manage your Terraform code in source control, avoid committing secrets. If you're running Terraform in automation, find an appropriate secrets management solution to handle the sensitive credentials. 
Create Terraform Files

Create a new directory to start your Terraform project in. Pick a name that makes sense:`okta-terraform-workshop` is a safe bet. In the terminal, I'll do this with `mkdir okta-terraform-workshop; cd okta-terraform-workshop`. 

Check that Terraform is installed and up to date with `terraform -v`. If you're on an old version of Terraform, follow the instructions in the upgrade message to get the latest version. 

In your favorite editor or IDE, open the file `main.tf` in your Terraform workshop directory. When playing with Terraform, everything can go in main.tf at first. Later we'll refactor some of our Terraform code into a second file for ease of maintenance. 

First, we'll set up the Okta provider by adding a provider block at the top of `main.tf`: 

```
terraform {
  required_providers {
    okta = {
      source = "okta/okta"
    }
  }
}
```
If you ever need a reminder of how that provider block should look, check the first page of the [Okta provider docs](https://registry.terraform.io/providers/okta/okta/latest/docs) on the Terraform registry. Whenever you see `registry.terraform.io/providers` in the URL of a search result, you know you've found the docs written by the provider authors themselves

Specifying Okta as a required provider ensures that Terraform will download the provider once you run `terraform init`. Can the Terraform code in this project manage resources in your Okta organization yet? 

If you wanted to make changes in an Okta organization through the admin console, you would need to know how to use Okta, but you would also need credentials to log in. Similarly, the Terraform project needs credentials for the Okta organization that you want it to manage. 

The provider configuration which tells Terraform how to access the your Okta organization will go in `main.tf`: 

```
provider "okta" {
  org_name    = ""
  base_url    = "okta.com"
  client_id   = ""
  scopes      = ["okta.groups.manage", "okta.users.manage", "okta.policies.manage"]
  private_key = ""
}

```
All of those fields are mandatory, and we'll find the values for them soon. 

The `org_name` will come from the URL of your Okta Developer Account, and the `client_id` and `private_key` will come from the App Integration. 

Scopes describe categories of changes that Terraform is allowed to make with the Okta Provider. This list of scopes will appear twice: Once here in the provider definition, and again in the Okta App Integration. Later on, you can explore what would happen if the scopes had been set up wrong at this step. 

# Create the Okta App Integration

Now in a web browser I'll log in to my Okta Developer Account at developer.okta.com. If you don't have an account yet, now is a great time to create one. Developer accounts are a safe place to experiment without the risk of accidentally changing your production infrastructure.

After logging in to your Developer Account, note the landing page URL. It looks like `https://dev-1234567890-admin.okta.com/admin/getting-started`. Everything after `https://` and before `-admin` is your `org_name`, and can be copied and pasted into your Terraform provider definition in `main.tf`. 
 
In the sidebar of the admin console, click Applications, and click Applications under that. The Applications page lists which apps you have installed, and lets you create new ones. 

Click the blue "Create App Integration" button, and select "API Services" as the application type. For the application's name, replace "My API Services App" with "Terraform Workshop" or something similarly descriptive. Save the application. 

In the General tab of the application, the Client ID is visible. Copy it to the `client_id` field in your Terraform provider configuration. 

Under the client ID, the "client authentication" radio button defaults to "Client secret". Terraform needs to use "Public key / Private key" authentication, so click the edit button next to the "client credentials" section heading, and switch the authentication to public key / private key. Click "add key", generate a new key, and save the private key as pkcs.pem in your Terraform project directory. 

Save your changes to the general settings of the API Service App, and navigate to the app's Okta API Scopes. Grant okta.groups.manage, okta.policies.manage, and okta.users.manage for this workshop. 

In the terminal, `cd okta-terraform-workshop` and convert the PKCS-1 key to an RSA key: 

```
$ openssl rsa -in pkcs.pem -out rsa.pem
```
# Configure Okta Provider

After setting up the app integration, you know all the values to pass in to the provider configuration! In `main.tf`, fill out that provider block with the `org_name`, `client_id`, and `private_key` file location. 

```
provider "okta" {
  org_name    = "dev-1234567890"
  base_url    = "okta.com"
  client_id   = "00abc123FIXME00"
  scopes      = ["okta.groups.manage", "okta.users.manage", "okta.policies.manage"]
  private_key = "${path.module}/rsa.pem"
}
```
# Manage Users and Groups
Now Terraform is ready to make changes to your Okta org by using the Okta provider. Take one last look at the empty users list in your developer account's admin console, because you're about to create some users with Terraform!

This workshop's examples will create users for some plants and animals, and assign them to a garden group. The exercises will work just as well if you choose a different theme, however, so feel free to customize your users and groups to keep things interesting. 

## Describe the User Resource

Resources in Terraform code describe infrastructure out in the world, in this case in Okta, that Terraform will manage. The first resource will describe a user, and applying the Terraform will create that user in the Okta Developer Account with the app integration credentials that were passed to the provider configuration. 

In the [Okta Provider docs](https://registry.terraform.io/providers/okta/okta/latest/docs) on the Terraform Registry, the `okta_user` resource documentation shows that only the first name, last name, login, and email fields are mandatory. This resource description goes after the provider definition in `main.tf`: 

```
resource "okta_user" "bird" {
  first_name = "Selasphorus"
  last_name  = "rufous"
  login      = "rufous.hummingbird@example.com"
  email      = "rufous.hummingbird@example.com"
}
```

Add that resource after the Terraform provider in main.tf. Notice how the type of the resource is okta_user, and the name of this one particular resource is "bird"? 

Save `main.tf`, then run `terraform plan` in your `terraform-workshop` directory to see what will change once you run `terraform apply`: 

```
Terraform used the selected providers to generate the following execution
plan. Resource actions are indicated with the following symbols:
  + create

Terraform will perform the following actions:

  # okta_user.bird will be created
  + resource "okta_user" "bird" {
      + custom_profile_attributes = (known after apply)
      + email                     = "rufous.hummingbird@example.com"
      + expire_password_on_create = false
      + first_name                = "Selasphorus"
      + id                        = (known after apply)
      + last_name                 = "rufous"
      + login                     = "rufous.hummingbird@example.com"
      + raw_status                = (known after apply)
      + skip_roles                = false
      + status                    = "ACTIVE"
    }

Plan: 1 to add, 0 to change, 0 to destroy.

```
Since there are no surprises in the `terraform plan` output, apply the changes with `terraform apply`:


```
Terraform used the selected providers to generate the following execution
plan. Resource actions are indicated with the following symbols:
  + create

Terraform will perform the following actions:

  # okta_user.bird will be created
  + resource "okta_user" "bird" {
      + custom_profile_attributes = (known after apply)
      + email                     = "rufous.hummingbird@example.com"
      + expire_password_on_create = false
      + first_name                = "Selasphorus"
      + id                        = (known after apply)
      + last_name                 = "rufous"
      + login                     = "rufous.hummingbird@example.com"
      + raw_status                = (known after apply)
      + skip_roles                = false
      + status                    = "ACTIVE"
    }

Plan: 1 to add, 0 to change, 0 to destroy.
okta_user.bird: Creating...
okta_user.bird: Creation complete after 1s [id=00abcdef12345]

Apply complete! Resources: 1 added, 0 changed, 0 destroyed.
```

Enter 'yes' to confirm that the plan is still what you want, and Terraform creates the Okta user. 

In the admin console of your Okta Developer Account, go to Directory in the left column and select People. Do you see the newly created user in the list? Note that the resource name "bird" is only used within Terraform, and doesn't show up to the user or in the admin interface. 

##Make another user

Now you can make a second user with Terraform! Try creating a Terraform resource that Terraform will internally call "butterfly", with the name Papilio zelicaon, and the login and email swallowtail.butterfly@example.com. 

Plan and apply your Terraform, and look at the new user in your admin console. 

In `main.tf`, did your user resource look like this? 

```
resource "okta_user" "butterfly" {
  first_name = "Papilio"
  last_name  = "zelicaon"
  login      = "swallowtail.butterfly@example.com"
  email      = "swallowtail.butterfly@example.com"
}
```

## Create a group

Just like when creating a user, the [Okta Terraform Provider docs](https://registry.terraform.io/providers/okta/okta/latest/docs/resources/group) offer guidance on which fields are available, and which are required, when creating a group. 

Configuring the group resource in `main.tf` will create a group the next time you run `terraform apply`: 

```
resource "okta_group" "garden" {
  name        = "The Garden"
  description = "Terraform created this group"
}
```

Save `main.tf`, and run `terraform plan`. While the plan runs, think about what changes you expect to see, based on what you've changed in your Terraform code since the last time you applied it. Should any resources be added? Should any resources be changed? Should any resources be destroyed? 

```
Terraform used the selected providers to generate the following execution
plan. Resource actions are indicated with the following symbols:
  + create

Terraform will perform the following actions:

  # okta_group.garden will be created
  + resource "okta_group" "garden" {
      + description = "Terraform created this group"
      + id          = (known after apply)
      + name        = "The Garden"
      + skip_users  = false
    }

Plan: 1 to add, 0 to change, 0 to destroy.
```

You added 1 new group resource, and Terraform plans to add 1 new group. The plan looks correct. Run `terraform apply`, and then you can see the new group in the admin console. 

When you inspect the new group, you may notice that it has no users assigned to it. Let's fix that!

## Add users to the group

Group memberships are managed with the `okta_group_memberships` resource. Where would you look for information on what fields an `okta_group_memberships` resource requires? The [provider docs](https://registry.terraform.io/providers/okta/okta/latest/docs/resources/group_memberships) can show you. 

```
resource "okta_group_memberships" "gardenmembers" {
  group_id = okta_group.garden.id
  users = [
    okta_user.bird.id,
    okta_user.butterfly.id,
  ]
}
```

Plan and apply the Terraform, then look at the group in your admin console. Are the garden creatures assigned to the garden group now? 

# Explore Errors

Now that you're getting more comfortable with basic Terraform operations, let's pause and look at some ways that things might have gone wrong in the previous steps. 

## Multiple keys in the application 

To cause this error, avigate to your Terraform application in the Okta Admin Console, and create a second keypair. 

With two keypairs active, try to run `terraform plan`. Every resource will return an invalid JWT key identifier error: "the API returned an error: The client_assertion JWT kid is invalid."

Try setting your first keypair, the one you created the RSA key from, to "inactive" in the admin console. This changes the error to "the API returned an error: The client_assertion signature is invalid.". 

To fix this error, set the older keypair to active, and the newer keypair to inactive. Suddenly, the plan succeeds again! Once the newer keypair is set to inactive, you can delete it.

## Missing scopes 

To see the impact of a missing scope error, try creating a user when the Terraform provider's scopes are set up incorrectly. Let's add a flower to `main.tf`: 

```
resource "okta_user" "flower" {
  first_name = "Digitalis"
  last_name  = "purpurea"
  login      = "foxglove@example.com"
  email      = "foxglove@example.com"
}
```

Before planning and applying, go to the Okta API Scopes tab of your app integration in the admin console, and revoke the `okta.users.manage` scope. When you try to run `terraform plan`, you'll get a 403: `the API returned an error: The access token provided does not contain the required scopes., Status: 403 Forbidden`

Grant that `okta.users.manage` scope again, and the plan will succeed. 

Now in `main.tf`, in the Okta Terraform provider configuration, try taking away the `okta.users.manage` scope, so that the scopes line looks like this: 

```
scopes = ["okta.groups.manage", "okta.policies.manage"] 
```

You'll get the same 403 error as before. 

This 403 is your cue to double check that the required scopes are granted in the app integration and also listed in the provider configuration. 

When the `okta.users.manage` scope is granted in both places, you can successfully apply your Terraform to create the foxglove flower. 

How would you add the flower to the garden group? 

## Clock Confusion

For secure communication between Terraform and Okta, the system where you're running Terraform has to agree with Okta about what time it is. 

Try setting the clock of your system to a few minutes in the future, and running a Terraform command. 

You'll see the error `the API returned an error: The client_assertion token has an expiration too far into the future`.

Fix this error by configuring the system where you're running Terraform to automatically update its clock from a trusted time server. Forcing your system clock to synchronize to its timeserver can also resolve this issue. 


# Remove Resources

Terraform can remove infrastructure as well as create it. 

When you delete the Terraform configuration for a managed resource, your next `terraform apply` will delete that resource.

Hummingbirds can migrate over 2000 miles per year, so let's remove the hummingbird's account when it migrates away from the garden.

Simply removing the resource and trying to run `terraform plan` will yield an error: 


```
Error: Reference to undeclared resource

  on main.tf line 123, in resource "okta_group_memberships" "gardenmembers":
 123:     okta_user.bird.id,

A managed resource "okta_user" "bird" has not been declared in the root
module.
```


What went wrong? The error came from the line where the bird was assigned to the garden group. 

To successfully remove a resource, all uses of it must also be removed. In this example, the `bird` resource is only used in its assignment to the `garden` group. Removing that assignment along with the resource will allow the plan to succeed. Since the resource has the unique name `bird`, another way to find everywhere it's referenced would be to search the Terraform project for that string: `grep bird *.tf`. 

The bird's user account is not removed until you run `terraform apply`. 

# Use Terraform Variables
The simple examples so far have used a lot of hardcoded strings. One in particular is the `example.com` domain that all of the users have their logins and IDs at. What if you expected that to change, and wanted to update everyone at once to a new email domain? 

Terraform's [variables](https://developer.hashicorp.com/terraform/language/values/variables) can help. 

To declare a variable, in this case a string representing the email domain, tell Terraform the variable type and optionally a default value. This variable definition can go in `main.tf` while the project is still small: 

```
variable "domain" {
  type    = string
  default = "example.com"
}


```

Now you can replace all the instances of `example.com` with `var.domain`. Here's how that would look for the butterfly, including the syntax for using the variable within a string: 

```
resource "okta_user" "butterfly" {
  first_name = "Papilio"
  last_name  = "zelicaon"
  login      = "swallowtail.butterfly@${var.domain}"
  email      = "swallowtail.butterfly@${var.domain}"
}
```

Run `terraform plan` with no arguments, and the domain variable will use its default of example.com. 

If you wanted to change everyone's domain at once in a big switch from `example.com` to `test.org` email hosting, you could pass a different value to the domain variable when running Terraform:

```
$ terraform plan -var "domain=test.org"
$ terraform apply -var "domain=test.org"
```

Can you create and use a list variable to replace the hardcoded list in your `okta_group_memberships` resource?

# Terraform Refactoring

As you configure more resources with Terraform, it gets harder to keep track of everything in one big file. Fortunately, Terraform recognizes all `.tf` files in a directory as belonging to the same project.

To see this in action, try moving both of the remaining user resources, the butterfly and the flower, from `main.tf` into a new file called `users.tf`. `terraform plan` will report "No changes. Your infrastructure matches the configuration."

As your Terraform project grows more complex, you'll use more features of the language. You might use [modules](https://developer.hashicorp.com/terraform/language/modules) to reuse similar configurations. You'll probably use more variables to take inputs to Terraform from the environment where it's running. 

# Terraform Formatting

If you're using an editor or IDE that doesn't automatically fix your indentation and other formatting details, run the command `terraform fmt` to clean up the formatting of all `.tf` files.

Try adding some ugly whitespace to one of your Terraform files, and then use `terraform fmt` to clean it up!

# Importing Resources

What if a user existed in Okta before you started working with Terraform, and you wanted to create a Terraform resource to represent them? [Terraform import](https://developer.hashicorp.com/terraform/language/import), an experimental feature, can help. 

First you'll need something to import. Create a user by hand through the Okta admin console. 

Navigate to Directory, People, Add Person. The garden could use a tree in it, so this example will make the tree Acer macrophyllum, `bigleaf.maple@example.com`. 

View that user in the Okta admin console, and its ID appears at the end of the URL: `https://dev-1234567890-admin.okta.com/admin/user/profile/view/abc123`. Use that ID when importing the resource to the Terraform state. 

Create a new Terraform file, `imports.tf`, and add an import block to that file: 

```
import {
  to = okta_user.tree
  id = "abc123"
}
```

Run `terraform plan -generate-config-out=generated.tf` to generate the configuration for everything defined in import blocks. 

After planning, `generated.tf` contains the value of every possible field on the resource!


```
# __generated__ by Terraform
# Please review these resources and move them into your main configuration files. 
# __generated__ by Terraform from "abc123"
resource "okta_user" "tree" { 
	city= null
	cost_center = null
	country_code= null
	custom_profile_attributes = "{}"
	custom_profile_attributes_to_ignore = null
	department= null
	display_name= null
	division= null
	email = "bigleaf.maple@example.com" 
	employee_number = null
	expire_password_on_create = null
	first_name= "Acer"
	honorific_prefix= null
	honorific_suffix= null
	last_name = "macrophyllum"
	locale= null
	login = "bigleaf.maple@example.com" 
	manager = null
	manager_id= null
	middle_name = null
	mobile_phone= null
	nick_name = null
	old_password= null # sensitive
	organization= null
	password= null # sensitive
	password_inline_hook= null
	postal_address= null
	preferred_language= null
	primary_phone = null
	profile_url = null
	recovery_answer = null # sensitive
	recovery_question = null
	second_email= null
	state = null
	status= "STAGED"
	street_address= null
	timezone= null
	title = null
	user_type = null
	zip_code= null
}``` 

Run `terraform apply` to complete the import. 

Copy the relevant fields from `generated.tf` into `users.tf`, and modify them to use any relevant variables:

```
resource "okta_user" "tree" {
  email      = "bigleaf.maple@${var.domain}"
  first_name = "Acer"
  last_name  = "macrophyllum"
  login      = "bigleaf.maple@${var.domain}"
}
```

Once the user is successfully imported, remove `imports.tf` and `generated.tf`. 

After this refactor, a `terraform plan` will only show changes that update the manually created user's settings to the terraform resource defaults. 

# Find and Fix Configuration Drift

Config drift can happen when Okta resources are manually changed through the admin console and no longer match their Terraform configurations. You can introduce configuration drift by manually changing a resource.

Foxgloves are poisonous, so you might not want them in the garden. Remove the foxglove from the garden group in the admin console, and suspend their account in the admin console. 

After taking those actions by hand in the web interface, run `terraform plan`. Terraform detects that the foxglove changed, and wants to put things back to exactly how they're described in `main.tf`! 


```

Terraform will perform the following actions:

  # okta_group_memberships.gardenmembers will be updated in-place
  ~ resource "okta_group_memberships" "gardenmembers" {
        id              = "456lmn"
      ~ users           = [
          + "789xyz",
            # (1 unchanged element hidden)
        ]
        # (2 unchanged attributes hidden)
    }

  # okta_user.flower will be updated in-place
  ~ resource "okta_user" "flower" {
        id                        = "z89xyz"
      ~ status                    = "SUSPENDED" -> "ACTIVE"
        # (8 unchanged attributes hidden)
    }

Plan: 0 to add, 2 to change, 0 to destroy.
```

The best way for your organization to handle this drift will depend on your business needs. 

## Make Terraform match Okta

If manual changes need to be reflected by Terraform changes, import the changed resources as demonstrated above

## Make Okta match Terraform

If manual changes represent errors that should be overwritten by Terraform, simply run `terraform apply`. 

After running `terraform apply`, the admin console will show that the foxglove user is back to being active and in the garden group, just how Terraform describes it. 

# Control API Usage

Every Okta organization has an API rate limit. You can find the current rate limits in [the Okta docs](https://developer.okta.com/docs/reference/rl-additional-limits/#concurrent-rate-limits). 

If you're using Terraform in an organization with other API integrations, you might want to fine-tune how much of the organization's total rate limit you want Terraform to consume. To do this, go to your Terraform application in the admin console, and move the slider on the Application Rate Limits tab there. 


# Next Steps

* Learn more about Terraform in the Hashicorp docs. Could Terraform help you manage cloud infrastructure beyond Okta?
* Explore other resource types in the Okta Terraform Provider docs, and try configuring them in your developer account. 
* If your organization already uses Terraform to manageinfrastructure, learn about how terraform.tfstate files and secrets are managed. 
* Follow Oktadev on Twitter and YouTube to find out about future workshops and tutorials!
