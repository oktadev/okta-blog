---
layout: blog_post
title: "Oktane Lab: Scaling Okta App Management by Importing Data from PowerShell into Terraform"
author: E. Dunham
by: advocate
communities: [devops,.net]
description: "Hands-on guide to using Okta Terraform and Powershell."
tags: [terraform, powershell]
tweets:
- ""
- ""
- ""
image: blog/terraform-powershell-lab/image.jpg
type: awareness
---

At Oktane 2024, we offered a lab session to teach the basics of automating Okta administration tasks with Terraform and PowerShell. This post walks you through the lab content so you can follow along at your own pace to get some hands-on experience managing an Okta tenant with both tools. 

This lab includes some Scenario sections to give realistic examples of a situation where you might perform each task. You can ignore these sections if you don't find them helpful. 

## Background
PowerShell is an excellent introductory tool for general automation tasks. It is easier to set up but can require extensive customization to integrate with a more complete infrastructure-as-code solution. In this lab, the focus will be on reading data with PowerShell, but it is a general-purpose tool that can read from and write to Okta when configured with the appropriate scopes.

Terraform is a specialized tool for developing infrastructure as code. Terraform requires more setup steps than PowerShell, but adding Okta management to an existing Terraform deployment is more straightforward than designing a new solution with PowerShell.

## How to create your lab environment

You can follow these steps on any computer where you're able to install the following dependencies: 

- Install [PowerShell](https://learn.microsoft.com/en-us/powershell/scripting/install/installing-powershell?view=powershell-7.4).
- Install the [official Okta PowerShell module](https://github.com/okta/okta-powershell-cli) from your preferred PowerShell module location.
- Install [Terraform](https://developer.hashicorp.com/terraform/tutorials/aws-get-started/install-cli).
- Create an Okta org by [signing up](/signup/) for Workforce Identity Cloud.

**Note:** Free trial accounts expire after 30 days, but developer accounts do not expire. 

To use Terraform, you'll run commands in a terminal. You can even use a PowerShell window if you don't have a favorite terminal! 

If this is your first time writing code, you might want to install an IDE like [Visual Studio](https://code.visualstudio.com/docs/introvideos/basics) so that you can navigate the files you're writing, detect errors using plugins, and execute commands using the built-in terminal. 

## How to set up Terraform to manage your Okta org's configuration

When an identity administrator gives a person the ability to make changes in Okta, they provision the person with credentials to authenticate and scopes to indicate what they're authorized to do. When you set up an automation tool in your Okta organization, it's similar to onboarding any other colleague: Your tool will need credentials to authenticate and scopes to indicate what it's authorized to do.

## Scenario
You are on the DevOps team at Okta Ice. As the company has grown, it's gotten more challenging to manage and audit the changes that various teams make in Okta. Adding Okta to the infrastructure you are already managing with Terraform allows you to apply existing code review processes to your identity configuration.


### Accessing Terraform

In a production setting, you would collaborate on your Terraform files with colleagues using version control. If anyone at your organization uses Terraform, you should set it up according to their advice on best practices. 

Note that Terraform creates a `.tfstate` file. Each real-world resource should only be represented in one `.tfstate` file. If you're collaborating on a Terraform codebase, products like [Terraform Cloud](https://www.hashicorp.com/resources/what-is-terraform-cloud) are available to help you manage shared access to `.tfstate` files. 

You'll save a private key alongside your code to simplify the lab. In production, you should store keys in your organization's secrets management solution. Because private keys are secrets, follow your organization's best practices for secrets management when dealing with them.


## Set up your Terraform Application

1. Go to Applications > Applications in the Okta admin console.

2. Create an app integration for the Terraform lab.

    a. Select Create App Integration.
    
    b. Select API Services.
    
    c. Select Next.
    
    d. Enter the application name "Terraform lab."
    
    e. Select Save.
    
3. Generate the client credentials.
    
    a. In the Client Credentials box, select Edit.
    
    b. Under Client authentication, select "Public key / Private key."
    
    c. Select Add Key.
    
    d. Select Generate new key.
    
    e. Under "Private Key - Copy this!" select PEM. 
    **Note**: the PEM key begins with the line `-----BEGIN PRIVATE KEY-----`. Make sure you're looking at the PEM, not the JSON. 
    
    f. Select Copy to clipboard.

4. On your computer, paste the key into a file and save it as `key.pem`

   **Important:** The key is saved locally to simplify the lab. You should save the key to an appropriate secrets management solution when working with production environments. If you do not have secrets management, [this blog post](/blog/2024/10/11/terraform-ci-cd) shares one way to set it up.

5. Complete the configuration steps.
    
    a. From the Okta Admin console, select Done.
    
    b. Select Save.
    
    c. In the "Existing client secrets will no longer be used" popup, select Save.

6. From the Okta API Scopes tab, grant the following scopes:
    - `okta.appGrants.manage`
    - `okta.apps.manage`
    - `okta.oauthIntegrations.manage`
    - `okta.policies.read`
    - `okta.users.manage`

7. Modify the admin roles for the Terraform lab app.
    
    a. Go to the Admin Roles tab.
    
    b. Select Edit Assignments.
    
    c. Select the role of Super Adminstrator from the dropdown menu.
    
    d. Select Save Changes.

8. In your VM, create the file `main.tf`:

   ```hcl
   terraform {
     required_providers {
       okta = {
         source = "okta/okta"
       }
     }
   }

   variable "org_id" {
     default = "ORGID"
   }

   provider "okta" {
     org_name  = var.org_id
     base_url  = "oktapreview.com"
     client_id = "CLIENTID"
     scopes = ["okta.apps.manage", "okta.appGrants.manage",
       "okta.oauthIntegrations.manage", "okta.users.manage",
     "okta.policies.read"]
     private_key = file("key.pem")
   }

   ```
9. In your `main.tf` file, replace `ORGID` with the subdomain for your Okta org.

   **Note:** The subdomain is between `https://` and `.oktapreview.com`. In the example below, the subdomain is `oktaice0000000`.

10. In your `main.tf` file, replace `CLIENTID` with the client ID of your Terraform lab app.

    **Note:** Go to Applications > Applications to find the client ID of your Terraform lab app.

11. Save the `main.tf` file.
12. Initiate and run the terraform plan.
    
    a. In your terminal, run the following commands:
      
      ```
      terraform init
      terraform plan
      ```
    b. Wait for the terraform plan command to return "No changes. Your infrastructure matches the configuration."


## Set up and use Okta's PowerShell Module

In this lab, we'll use Terraform to create an application that PowerShell can use to read Okta data safely. If you want to use Okta's PowerShell module without managing it in Terraform, follow [the usage guide](https://github.com/okta/okta-powershell-cli?tab=readme-ov-file#usage-guide) instead. 

## Scenario
An Okta Ice intern uses PowerShell to generate a newsletter with statistics about the company. They have asked you to help them access data about how the company uses Okta.  You want to give their script read access to various data from Okta by setting up an application for PowerShell and testing it out. Since they are already using PowerShell, the Okta PowerShell Module is a perfect choice for the task!

### Accessing PowerShell
You can access PowerShell 7 by launching it from the shortcut generated during its installation or with the Visual Studio Code built-in terminal. 

## Configure a PowerShell Application using Terraform
1. Add the following to your `main.tf` file:

   ```hcl
   resource "okta_app_oauth" "ps" {
 
     grant_types = ["authorization_code",
     "urn:ietf:params:oauth:grant-type:device_code"]
     label                      = "PowerShell"
     response_types             = ["code"]
     type                       = "native"
     redirect_uris              = ["com.oktapreview.${var.org_id}:/callback"]
     token_endpoint_auth_method = "none"
     implicit_assignment        = true
     issuer_mode                = "DYNAMIC"
   }

   resource "okta_app_oauth_api_scope" "ps-scopes" {
     app_id = okta_app_oauth.ps.id
     issuer = "https://${var.org_id}.oktapreview.com"
     scopes = ["okta.apps.read", "okta.domains.read",
       "okta.groups.read", "okta.logs.read",
       "okta.oauthIntegrations.read", "okta.orgs.read",
     "okta.userTypes.read", "okta.users.read"]
   }
   ```
2. In your terminal, run the command `terraform apply`
3. Type `yes` when prompted.
4. Wait for the `terraform apply` to complete.
5. From the `Creation complete after` output, copy the value of the `okta_app_oauth` id.

   **Note:** PowerShell and Terraform now have separate applications in your Okta organization. The PowerShell application's ID can also be found in the Okta admin console under Applications -> Applications. 

6. In PowerShell, run these commands:

   **Note:** Replace the {yourOktaDomain} with the entire domain for your Okta org. For example, `oktaice0000000.oktapreview.com`. Replace the ID with the value you copied above.

   ```powershell
   $Configuration = Get-OktaConfiguration
   $Configuration.BaseUrl = "https://{yourOktaDomain}"
   $Configuration.ClientId = "id"
   $Configuration.Scope = "okta.apps.read okta.domains.read okta.groups.read okta.logs.read okta.oauthIntegrations.read okta.orgs.read okta.userTypes.read okta.users.read"
   Invoke-OktaEstablishAccessToken
   ```
 
 7. The `Invoke-OktaEstablishAccessToken` command displays a URL. Open the link in a web browser.
 8. Authenticate to your Okta Training Org when prompted.
 9. In your PowerShell session, run the command `Invoke-OktaListApplications`

## Extra Credit
You have set up the PowerShell application with various scopes. What interesting information about your organization can you retrieve using these scopes? Will these scopes allow you to make any changes to the Okta organization? Try some PowerShell commands to create or destroy resources and see what happens!

## Manage Terraform using Terraform

Now, we'll use data gathered by Powershell to improve your Terraform configuration.

If you aren't using PowerShell, you can get the Terraform integration ID from the Okta admin console instead. 

## Scenario

Your manager at Okta Ice assigns you a ticket to update the configuration of the Okta Terraform integration. When you try to follow the usual Terraform process of making configuration changes, you discover that the Terraform application isn't managed by Terraform yet! You can fix this without leaving your terminal, thanks to your prior automation efforts with PowerShell. 

## Manage Terraform in Terraform

1) 	In your PowerShell session from the previous section, run the command `powershell Invoke-OktaListApplications`

2) 	In the resulting list, find the ID of your Terraform app. Note that the name you chose, such as "Terraform lab," will be shown in the label field. 

3) 	Add the following code to your `main.tf`, substituting the application ID you got from PowerShell: 

  ``` hcl
  import {
    to = okta_app_oauth.tf
    id="FIXME"
  }
  ```
4) 	Save `main.tf`

5)	In your terminal, run the command `terraform plan --generate-config-out tf-app-config.tf` 

6)	Remove the `import{...}` block from `main.tf` and save `main.tf`

7)	In your terminal, run the command: `terraform apply` 

8)	Open the file `tf-app-config.tf` 

9)	Remove the comments from the top of the file (single-line comments in Terraform start with `#` or `//`)

10)	Remove the lines from the resource block that do not represent properties you plan to manage. You can safely remove any null field. 

11) Copy the remaining contents of `tf-app-config.tf` into `main.tf`

12)	Remove the file `tf-app-config.tf`

13)	To complete the import, run `terraform apply`

### Extra Credit 1

Consult the Okta Terraform Provider documentation at https://registry.terraform.io/providers/okta/okta/latest/docs. 
Find an interesting resource and use Terraform to create that resource in your Okta training organization. 
After creating a resource in your Okta organization, you can view it in the admin console. 
 
For more examples of things you can do in Terraform, see the [Terraform Enterprise Maturity Workshop](/blog/2023/07/28/terraform-workshop). 

### Extra Credit 2: 

Now that you are managing Terraform's Okta application in Terraform, you can modify it with your code. Add the scope `okta.groups.manage` to your Terraform provider. 

Remember that the scopes configured in the provider block and those configured in the Okta application must match before Terraform can use them!

## Appendix: All the Terraform Code in one place
After completing the lab, your `main.tf` will contain the following. To clean up the whitespace in your files, run the command `terraform fmt`.  
```
terraform {
  required_providers {
    okta = {
      source = "okta/okta"
    }
  }
}
variable "org_id" {
  default = "..."
}

provider "okta" {
  org_name    = var.org_id
  base_url    = "oktapreview.com"
  client_id   = "..."
  scopes      = ["okta.apps.manage", "okta.appGrants.manage", "okta.oauthIntegrations.manage", "okta.users.manage", "okta.policies.read"]
  private_key = file("key.pem")
}

resource "okta_app_oauth" "ps" {

  grant_types                = ["authorization_code", "urn:ietf:params:oauth:grant-type:device_code"]
  label                      = "PowerShell"
  response_types             = ["code"]
  type                       = "native"
  redirect_uris              = ["com.oktapreview.${var.org_id}:/callback"]
  token_endpoint_auth_method = "none"
  implicit_assignment        = true
  issuer_mode                = "DYNAMIC"
}

resource "okta_app_oauth_api_scope" "ps-scopes" {
  app_id = okta_app_oauth.ps.id
  issuer = "https://${var.org_id}.oktapreview.com"
  scopes = ["okta.apps.read", "okta.domains.read", "okta.groups.read", "okta.logs.read", "okta.oauthIntegrations.read", "okta.orgs.read", "okta.userTypes.read", "okta.users.read"]
}


resource "okta_app_oauth" "tf" {

  app_links_json = jsonencode({
    oidc_client_link = true
  })
  app_settings_json              = jsonencode({})
  authentication_policy          = "abc123"
  client_id                      = "abc123"
  consent_method                 = "REQUIRED"
  grant_types                    = ["client_credentials"]
  implicit_assignment            = false
  issuer_mode                    = "DYNAMIC"
   label                          = "Terraform lab"
  login_mode                     = "DISABLED"
   pkce_required                  = false
  policy_uri                     = null
    response_types                 = ["token"]
  token_endpoint_auth_method     = "private_key_jwt"
  type                           = "service"
  user_name_template             = "$${source.login}"
    user_name_template_type        = "BUILT_IN"
  wildcard_redirect              = "DISABLED"
  jwks {
   ...
  }
}
```

## Conclusion

If you want to explore your Okta org more with PowerShell, these resources may help:
- Okta Developer [PowerShell blog post](/blog/2024/05/07/okta-powershell-module)
- Okta Developer Podcast [PowerShell Episode](/blog/2024/04/11/okta-powershell-module-podcast)
- The Okta PowerShell module [test suite](https://github.com/okta/okta-powershell-cli/blob/main/tests/Api/OktaGroupApi.Tests.ps1)

Remember to follow us on [Twitter](https://twitter.com/oktadev) and subscribe to our [YouTube channel](https://www.youtube.com/c/OktaDev/) for more exciting content. We also want to hear from you about topics you want to see and questions you may have. Leave us a comment below!


