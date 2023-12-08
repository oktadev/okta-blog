---
layout: blog_post
title: "Terraform your Enterprise Ready OIDC Workshop Okta app"
author: edunham
by: advocate
communities: [devops]
description: "In the Enterprise Ready OIDC Workshop, you manually created app in Okta. Here's how to use Terraform instead of the web interface to make that app.  "
tags: [terraform, workshop]
tweets:
- ""
- ""
- ""
image: blog/terraform-workshop/tf-workshop-social-image.jpg
type: awareness
---

## Intro

# TODO FIXME this is not an intro 
You did terraform in the [Terraform Workshop]() and OIDC in the [OIDC Workshop](). When setting up OIDC, you integrated with Okta by clicking in the admin console of your [Okta Developer Accout](). What if less clicking? 

### Manual setup instructions from OIDC Workshop

> In the "Create a new app integration" dialog box, select the OIDC - OpenID Connect sign-in method, specify that the application is a "Web Application" in the "Application Type" options that appear, and use the "Next" button to continue.

> Give this app integration a useful name like "Todo app", and make sure that Authorization Code box is selected under "Client acting on behalf of a user" in the Grant type field.

> Find the ID used for this customer in your app by checking the database. For this workshop, the first customer has ID 1, so the sign-in redirect URI is http://localhost:3333/openid/callback/1.

> Finally, under Assignments, select "Allow everyone in your organization to access". Saving these changes using the Save button at the bottom of the page will take you to the app's General settings tab, which provides a Client ID and Client Secret.

### Translate to Terraform

For convenience, you can place all of the code for managing the OIDC workshop in `oidc_workshop.tf` in your Terraform project directory. 

> In the "Create a new app integration" dialog box, select the OIDC - OpenID Connect sign-in method, specify that the application is a "Web Application" in the "Application Type" options that appear, and use the "Next" button to continue.

When creating the integration, you made an OIDC Web App. Making the integration by hand from the "create app integration" page is a clue that the corresponding Terraform resource will probably be an `okta_app` of some kind. Of the resource options listed in the provider docs, the [okta_app_oauth](https://registry.terraform.io/providers/okta/okta/latest/docs/resources/app_oauth) looks like the best fit.

The example from the docs shows what values Terraform will need for an `okta_app_oauth`: 

```tf
resource "okta_app_oauth" "example" {
  label                      = "example"
  type                       = "web"
  grant_types                = ["authorization_code"]
  redirect_uris              = ["https://example.com/"]
  response_types             = ["code"]
}
```

> Give this app integration a useful name like "Todo app", and make sure that Authorization Code box is selected under "Client acting on behalf of a user" in the Grant type field.

In Terraform, the integration's name will come from the `label` field. Remember that the nickname in the resource definition is only used within Terraform. Inside Terraform, this resource will be known as `oidc_workshop`, but in the Okta interface, it will be called `Todo app`.

The app type will be "web", just like the example, because the manual setup instructions requested a Web App in the previous step. 

The grant types will be `authorization_code`, again matching the docs, because the manual setup instructions asked their user to check the Authorization Code box. If the manual setup steps had requested a different setting, the [grant_types section](https://registry.terraform.io/providers/okta/okta/latest/docs/resources/app_oauth#grant_types) of the provider docs could be used to identify other possible values in Terraform. 

Here's how the resource will look with those fields populated: 

```tf
resource "okta_app_oauth" "oidc_workshop" {
  label                      = "Todo app"
  type                       = "web"
  grant_types                = ["authorization_code"]
  redirect_uris              = ["https://example.com/"]
  response_types             = ["code"]
}
```

> Find the ID used for this customer in your app by checking the database. For this workshop, the first customer has ID 1, so the sign-in redirect URI is `http://localhost:3333/openid/callback/1`.

The penultimate step of the manual setup instructions provides the link that the Terraform resource refers to as `redirect_uri`. The instructions don't specify any changes to the integration's `response_types`, so keeping the defaults from the example is a safe bet. 

Fully configured, the oauth app resource looks like this: 

```tf
resource "okta_app_oauth" "oidc_workshop" {
  label                      = "Todo app"
  type                       = "web"
  grant_types                = ["authorization_code"]
  redirect_uris              = ["http://localhost:3333/openid/callback/1"]
  response_types             = ["code"]
}
```

> Finally, under Assignments, select "Allow everyone in your organization to access". Saving these changes using the Save button at the bottom of the page will take you to the app's General settings tab, which provides a Client ID and Client Secret.

The final step of manual setup is assigning a group to the app is done with a separate Terraform resource: [okta_app_group_assignment](https://registry.terraform.io/providers/okta/okta/latest/docs/resources/app_group_assignment). 

The `profile` field shown in the provider's example can be omitted, as it's optional and no profile configuration is requested in the manual setup steps. With only the required fields, the example code for group assignment is simple: 

```tf
resource "okta_app_group_assignment" "example" {
  app_id   = "<app id>"
  group_id = "<group id>"
}
```

The `okta_app_group_assignment` needs two fields: an `app_id` and a `group_id`. Providing the `app_id` is easy: It refers to the `okta_app_oauth` resource created in the previous step. Here's how the group assignment looks with the `app_id` specified: 

```tf
resource "okta_app_group_assignment" "oidc_workshop" {
  app_id   = okta_app_oauth.oidc_workshop.id
  group_id = "<group id>"
}
```

Here's the tricky part: What group ID should the group assignment resource use? The manual instructions specified that the assignment should apply to the Everyone group. All Okta organizations have an "Everyone" group by default. What if you don't want to manage that default group with Terraform, but you need to look up its ID? 

Terraform's Data Sources can help. [Data Sources](https://developer.hashicorp.com/terraform/language/data-sources) let Terraform look up attributes of a piece of infrastructure, and expose those attributes for use within your code. Let's look up the Everyone group using the [group data source](https://registry.terraform.io/providers/okta/okta/latest/docs/data-sources/group): 

```tf
data "okta_group" "everyone" {
  name = "Everyone"
}
```

With this data source added, your entire `oidc_workshop.tf` will contain: 

```tf
resource "okta_app_oauth" "oidc_workshop" {
  label                      = "Todo app"
  type                       = "web"
  grant_types                = ["authorization_code"]
  redirect_uris              = ["http://localhost:3333/openid/callback/1"]
  response_types             = ["code"]
}

data "okta_group" "everyone" {
  name = "Everyone"
}

resource "okta_app_group_assignment" "oidc_workshop" {
  app_id   = okta_app_oauth.oidc_workshop.id
  group_id = data.okta_group.everyone.id
}
```

### Grant scopes for Terraform to manage apps

If you try applying this Terraform with the provider configured during the Terraform Workshop, you'll get an error that the access token does not contain the required scopes! To solve this, navigate to the Okta API Scopes tab of your Terraform Workshop application in your developer account admin console, and grant the `okta.apps.manage` scope. 

With the `okta.apps.manage` scope granted, the provider block in your `main.tf` will look something like this: 

```tf
provider "okta" {
  org_name    = "dev-1234567890"
  base_url    = "okta.com"
  client_id   = "00abc123FIXME00"
  scopes      = ["okta.groups.manage", "okta.users.manage", "okta.policies.manage", "okta.apps.manage"]
  private_key = "${path.module}/rsa.pem"
}
```


Apply the Terraform, and you'll now see your "Todo app" in the applications list in the admin console! 

### Get Secrets 

The next step of the OIDC workshop involves using the `client_id` and `cilent_secret` from the newly created OIDC app. Terraform can retrieve these values for you or your automation to use elsewhere, using [outputs](https://developer.hashicorp.com/terraform/tutorials/configuration-language/outputs). 

You could keep your outputs in `oidc_workshop.tf` for now, although maintaining all the outputs from your project in `outputs.tf` is also a recommended pattern. You can tell that the OAuth App resource exposes attributes named `client_id` and `client_secret` from the [Attributes Reference section](https://registry.terraform.io/providers/okta/okta/latest/docs/resources/app_oauth#attributes-reference) of its entry in the provider docs. 

Note that the `client_secret` should be marked as a [sensitive value](https://developer.hashicorp.com/terraform/language/values/outputs#sensitive-suppressing-values-in-cli-output), so that it will be hidden by default and only shown when explicitly requested.

```tf
output "oidc_app_client_id" {
  description = "Client ID for OIDC Workshop Todo app integration"
  value       = okta_app_oauth.oidc_workshop.client_id
}
output "oidc_app_client_secret" {
  description = "Client Secret for OIDC Workshop Todo app integration"
  value       = okta_app_oauth.oidc_workshop.client_secret
  sensitive   = true
}
```

After adding these outputs to `oidc_workshop.tf`, run `terraform apply` to update Terraform's state with the output values. Then you can run `terraform output` to retrieve the all output values, or query an individual value with a command like `terraform output oidc_app_client_secret`. Sensitive values are only displayed when queried individually. 

### Get Endpoint URLs

Another manual task in the OIDC Workshop is finding various links that correspond to attributes of the Okta organization's OIDC server. Terraform can retrieve these values, as well! 


# TODO FIXME everything below this point is wild guesswork and contains some deep misunderstandings about which IdP is "the" IdP in the context of the blog

#### issuer
[docs](https://registry.terraform.io/providers/okta/okta/latest/docs/data-sources/auth_server)

```tf
data "okta_auth_server" "default" {
  name = "default"
}
output "issuer" {
  description = "Issuer URL for org's default auth server"
  value       = data.okta_auth_server.default.issuer
}
```

#### Metadata URI
[docs](https://registry.terraform.io/providers/okta/okta/latest/docs/data-sources/idp_oidc)
```tf
data "okta_idp_oidc" "default" {
  name = ""
}
output "authorization_endpoint" {
  description = "Authorization URL for org's default OIDC IdP"
  value       = data.okta_idp_oidc.default.authorization_url
}
output "issuer_from_idp" {
  description = "issuer from idp"
  value       = data.okta_idp_oidc.default.issuer_url
}
output "token_endpoint" {
  description = "Token endpoint URL for org's default OIDC IdP"
  value       = data.okta_idp_oidc.default.token_url
}
output "userinfo_endpoint" {
  description = "user info endpoint URL for org's default OIDC IdP"
  value       = data.okta_idp_oidc.default.user_info_url
}
```

#### userinfo_endpoint

#### token_endpoint

#### authorization_endpoint