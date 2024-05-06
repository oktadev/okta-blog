---
layout: blog_post
title: "How to Use Okta's PowerShell Module to Manage Your Okta Org"
author: louie-campagna
by: contractor
communities: [devops,.net]
description: "Automate your Okta org management by using the powerful new Okta PowerShell module!"
tags: [dotnet, powershell, cli]
tweets:
- ""
- ""
- ""
image: blog/okta-powershell-module/social.jpg
type: conversion
---

PowerShell is a powerful command-line interface for automating tasks, scripting, and managing systems. Okta offers an official PowerShell module, an extremely powerful tool for administering your Okta org. In this blog post, we'll explore how to utilize this.

You'll need a PowerShell terminal for your OS and the Okta PowerShell module. Install it through the PS Gallery, Chocolatey Package Manager, or the GitHub repository. Follow the instructions in the [GitHub repository's ReadMe](https://github.com/okta/okta-powershell-cli?tab=readme-ov-file#installation) to install the Okta PowerShell Module using your favorite method. 

**Table of Contents**{: .hide }
* Table of Contents
{:toc}

## Add authorization and authentication to Okta PowerShell module using OAuth 2.0 and OpenID Connect

Before you begin, you'll need a free Okta Developer Edition account. If you don't have an account, [sign up at Okta Developer](https://developer.okta.com/signup/) site. If you already have an account or once you create one, sign in and press the **Admin** button to navigate to the Admin Console.

The PowerShell module uses the device authorization flow, so we must create a new OpenID Connect (OIDC) Native application with the proper scopes configured. 

In the Okta Admin Console, navigate to **Applications** > **Applications**. Click on the **Create App Integration** button, choose **OIDC - OpenID Connect**, and press **Next**. Select **Native Application** as the application type and press **Next**. Name the application, such as "Okta PowerShell," and select the **Device Authorization** checkbox in the **Grant type** options.  In the **Assignments** section, choose **Allow everyone in your organization to access** and press **Save**.

Note the **Client ID** in the **General** tab here. You'll need this value to set up your configuration soon. 

Once you finish creating the application, click the **Okta API Scopes** tab. Here, we grant the application scopes for the tasks we perform. You can find a full list of the scopes and their functions in the [OAuth 2.0 API Scopes API reference](https://developer.okta.com/docs/api/oauth2/) documentation.

In this tutorial, we'll perform user and group management operations, so you'll grant the `okta.users.manage` and `okta.groups.manage` scopes. We'll include these scopes in our configuration when we establish our connection to Okta.


## Set up OAuth 2.0 and OIDC configuration in PowerShell
Next, we will need to set our configuration. Open PowerShell in your terminal. We will start by creating a configuration object by running the PowerShell command

```powershell
$Configuration = Get-OktaConfiguration
```

Now that we have our configuration object, we can set the values that we need to be able to use the OIDC Native application we created. You'll need the Client ID from the application and your Okta domain. When you expand the dropdown that displays your username, you'll see the Okta domain at the top of the Okta Admin Console. It might match the the format `dev-123.okta.com`. In your terminal window, run

```powershell
$Configuration.BaseUrl = "https://{yourOktaDomain}"
$Configuration.ClientId = "{yourClientID}"
$Configuration.Scope = "okta.users.manage okta.groups.manage"
```

The commands set the values to inform PowerShell about our Okta org, the OIDC Native app, and the scopes we wish to use. With this done, run 

```powershell
Invoke-OktaEstablishAccessToken
```
to authorize your device, in this case, the PowerShell terminal.

You'll see a prompt similar to the following:

```console
Open your browser and navigate to the following URL to begin the Okta device authorization for the Powershell CLI:  https://{{yourOktaDomain}}/activate?user_code=KWJDBHSC
```

Navigate to the URL provided and submit the code. You must log in to your Okta org to complete the device authorization. Once completed, Okta returns the access token to your PowerShell session, and you will have access to perform actions in your org via PowerShell based on the requested scopes.

You'll see a message indicating success in PowerShell that looks something like

```console
Your token has been successfully retrieved and set to your configuration
```

## Manage users using the Okta PowerShell module

We've successfully established a connection to our Okta org via PowerShell, so let's see what we can do with it. First, search for users with specific criteria and see the results. For this example, we will search for all users with the last name "Test," but feel free to replace "Test" with the last name listed on your user account so you can see the output.

```powershell
$users = Invoke-OktaListUsers -Search 'profile.lastName eq "Test"'
$users.count
```

In my org, I return a count of 5 users. Let's go ahead and view these users' profile information, piping it to PowerShell's `Format-Table` cmdlet to make it easier to read

```powershell
$users.profile | format-table
```

The output looks something like

```console
firstName lastName mobilePhone  secondEmail login                      email
--------- -------- -----------  ----------- -----                      -----
User1     Test                              user1.test@atko.com        user1.test@atko.com
User2     Test                              user2.test@atko.com        user2.test@atko.com
User3     test                              user3.test@atko.com        user3.test@atko.com
User4     Test                              user4.test@atko.com        user4.test@atko.com
User5     Test                              user5.test@atko.com        user5.test@atko.com
```

We displayed all 5 users matching our search criteria and piped data to other cmdlets. Next, let's demonstrate retrieving the profile of a single user. Replace the user ID parameter with your email.

```powershell
$user = Get-OktaUser -UserId "user4.test@atko.com"
$user.profile
```

We see the appropriate profile output for the user

```console
firstName   : User4
lastName    : Test
mobilePhone :
displayName : User4 Test
timezone    : America/Los_Angeles
secondEmail :
memberOf    : {Everyone}
login       : user4.test@atko.com
email       : user4.test@atko.com
```

Now that we can retrieve user information from our Okta org, how about creating users? Let's build a custom object for the user profile and make our request.

```powershell
$UserProfile = [PSCustomObject]@{
  firstName = 'User6'
  lastName = 'Test'
  email = 'user6.test@atko.com'
  login = 'user6.test@atko.com'
}

$newUser = Initialize-OktaCreateUserRequest -VarProfile $UserProfile

New-OktaUser -Body $newUser
```

The commands provision a new user, and we see the results in the terminal

```console
id              : 00ucrpy3ithJOkHvk697
status          : PROVISIONED
created         : 3/28/2024 4:07:51 PM
activated       : 3/28/2024 4:07:54 PM
statusChanged   : 3/28/2024 4:07:54 PM
lastLogin       : 
lastUpdated     : 3/28/2024 4:07:54 PM
passwordChanged : 
type            : @{id=otyaylbu0RfEiMmpn696}
profile         : @{firstName=User6; lastName=Test; mobilePhone=; secondEmail=; login=user6.test@atko.com; email=user6.test@atko.com}
credentials     : @{emails=System.Object[]; provider=}
_links          : @{suspend=; schema=; resetPassword=; reactivate=; self=; resetFactors=; type=; deactivate=}
```

Let's now retrieve a user and perform an update operation on their profile, for example, changing their last name.

```powershell
$user = Get-OktaUser -UserId "user6.test@atko.com"
$user.profile.lastName = "Smith"

$UpdatedUser = Initialize-OktaUpdateUserRequest -VarProfile $user.profile

Update-OktaUser -UserId $user.id -User $UpdatedUser
```

This updates the user with the updated profile information. Note the modified last name in the console output.

```console
id              : 00ucrpy3ithJOkHvk697
status          : PROVISIONED
created         : 3/28/2024 4:07:51 PM
activated       : 3/28/2024 4:07:54 PM
statusChanged   : 3/28/2024 4:07:54 PM
lastLogin       : 
lastUpdated     : 3/28/2024 4:32:12 PM
passwordChanged : 
type            : @{id=otyaylbu0RfEiMmpn696}
profile         : @{firstName=User6; lastName=Smith; mobilePhone=; secondEmail=; login=user6.test@atko.com; email=user6.test@atko.com}
credentials     : @{emails=System.Object[]; provider=}
_links          : @{suspend=; schema=; resetPassword=; reactivate=; self=; resetFactors=; type=; deactivate=}
```

Let's take a look at a bulk user creation operation. Perhaps we have a CSV of users to provision. For ease of provisioning, let's format our CSV to have its column names match the profile attribute names of the Okta user profile; for this example, we will use the following attributes: `firstName,lastName,email,login`.

Feel free to create your own CSV or copy and paste the following into a file named `userimport.csv` to follow along.

```console
firstName,lastName,email,login
Test,CSV1,testcsv1@atko.com,testcsv1@atko.com
Test,CSV2,testcsv2@atko.com,testcsv2@atko.com
Test,CSV3,testcsv3@atko.com,testcsv3@atko.com
```

We can import the CSV to a variable and step through it with a `foreach` loop and trigger the user provisioning.

```powershell
$provisionUsers = Import-CSV ./userimport.csv

foreach ($provisionUser in $provisionUsers) {
    $newUser = Initialize-OktaCreateUserRequest -VarProfile $provisionUser
    
    try {
        $provisionedUser = New-OktaUser -Body $newUser
        Write-Host "Successfully provisioned $($provisionedUser.profile.login)"
    } catch {
        $errorDetail = $_.ErrorDetails.message | ConvertFrom-Json
        Write-Host $errorDetail.errorCauses.errorSummary -ForegroundColor Red
    }
}
```

The commands step through our CSV and creates each user in the file. We've incorporated some error handling with a `try-catch` statement. Successful output may look like something like this.

```console
Successfully provisioned testcsv1@atko.com                                                                              
Successfully provisioned testcsv2@atko.com                                                                              
Successfully provisioned testcsv3@atko.com   
```

## Manage groups using the Okta PowerShell module

Let's now explore what we can do with a different endpoint. Perhaps we want to do some group management. Let's start by creating a group

```powershell
$newGroup = Initialize-OktaGroup

$newGroup.profile = [PSCustomObject]@{
    name = "Test Group"
    description = "Test"
}

$createdGroup = New-OktaGroup -Group $newGroup

$createdGroup
```

Successful output may look like
                                                                                                                          
```console
id                    : 00gdvk35ksHBnYb0E697
created               : 5/2/2024 1:38:46 PM
lastUpdated           : 5/2/2024 1:38:46 PM
lastMembershipUpdated : 5/2/2024 1:38:46 PM
objectClass           : {okta:user_group}
type                  : OKTA_GROUP
profile               : @{name=Test Group; description=Test}
_links                : @{logo=System.Object[]; owners=; users=; apps=}
```

Let's take the user we created in the previous section and add them to our newly created group

```powershell
Add-OktaUserToGroup -GroupId $createdGroup.id -User $user.id
```

and verify the work by retrieving the group membership

```powershell
$groupMembers = Invoke-OktaListGroupUsers -GroupId $createdGroup.id
$groupMembers.profile | Select-Object -Property firstName, lastName,login | Format-Table
```

We are piping the results to `Select-Object` to retrieve only certain desired attributes, then cleaning up the results with `Format-Table`. The result would look like this

```console
firstName lastName login
--------- -------- -----
User6     Smith    user6.test@atko.com
```

Suppose we have several groups and want to output the group membership of all groups that start with the word "Test." We can do so by running the following commands.

```powershell
$groups = Invoke-OktaListGroups -Search 'profile.name sw "Test"'

foreach ($group in $groups) {
    write-host "Group membership for $($group.profile.name)"
    $groupMembers = Invoke-OktaListGroupUsers -GroupId $group.id
    $groupMembers.profile | Select-Object -Property firstName, lastName,login | Format-Table
}
```

This set of commands uses the same methods as before but demonstrates how to search based on the criteria you define, retrieve multiple groups, and parse through them with a `foreach` loop. If you only have the one sample group we created as part of this tutorial, please feel free to repeat the instructions to create a few more groups to test this out in your Okta org. 

The resulting output would look something like

```console
Group membership for Test Group


firstName lastName login
--------- -------- -----
User1     Test     user1.test@atko.com
User2     Test     user2.test@atko.com
User3     Test     user3.test@atko.com
User5     Test     user5.test@atko.com


Group membership for Test Group 2


firstName lastName login
--------- -------- -----
User2     Test     user2.test@atko.com
```

## Script Okta org management using the new Okta PowerShell module

You can apply the same techniques to any other Okta API endpoint. For example, you can use the Okta PowerShell module with the Apps API to retrieve information about apps in your org, create a new app, and assign users to an app; you can use it with the Authorization Servers API to create and manage your custom authorization servers and their policies—there are functions within the Okta PowerShell module for all aspects of managing your org.

To summarize, you connected to your Okta org using PowerShell and managed your environment. You retrieved existing users and groups, created new users, and assigned users to groups. This post only demonstrates a fraction of what's possible using the Okta PowerShell module. You can expand upon everything you did in this tutorial to utilize the full functionality of the Okta APIs via PowerShell.

## Learn more about Okta, the PowerShell module, and automating Okta

You might find these posts, workshops, podcasts, and resources helpful if you enjoyed this post.
 * [Introducing Okta's Official PowerShell Module](/blog/2024/04/11/okta-powershell-module-podcast)
 * [Okta PowerShell Module GitHub repo](https://github.com/okta/okta-powershell-cli)
 * [Enterprise Maturity Workshop: Terraform](/blog/2023/07/28/terraform-workshop)

Follow us on [Twitter](https://twitter.com/oktadev), connect with us [on LinkedIn](https://www.linkedin.com/company/oktadev), and subscribe to the [OktaDev YouTube channel](https://www.youtube.com/c/OktaDev/) for exciting content. In the comments below, let us know if you have any questions or want more examples of Okta PowerShell!
