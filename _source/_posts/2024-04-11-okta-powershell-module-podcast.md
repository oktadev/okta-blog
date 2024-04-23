---
layout: blog_post
title: "Introducing Okta's Official PowerShell Module"
author: edunham
by: advocate
communities: [devops,.net]
description: "In this podcast, we discuss the new PowerShell module that enables you to manage your Okta resources with Laura Rodriguez and Bhavik Thakkar"
tags: [powershell-cli]
tweets:
- ""
- ""
- ""
image: blog/identity-developer-podcast/podcast.jpg
type: awareness
---

The Okta Workforce Identity Developer Podcast returns with an exploration of our latest new developer tool, the Okta PowerShell Module! 

## Watch on YouTube

{% youtube ADnxvCYLL9A %}

You can find the source of the Okta PowerShell Module, and documentation in the README, [on GitHub](https://github.com/okta/okta-powershell-cli). 

Below is the example code discussed in the podcast episode.

## Example: Interactively create Okta groups and group rules with PowerShell

### Install PowerShell module via PSGallery

```ps
Install-Module -Name Okta.PowerShell
```

### Set up configuration

Set up an app integration following [this guide](https://developer.okta.com/docs/guides/device-authorization-grant/main/#configure-an-application-to-use-the-device-authorization-grant) to get the Client ID. Then configure PowerShell: 

```ps
$Configuration = Get-OktaConfiguration
$Configuration.BaseUrl = $env:OKTA_PS_ORG_URL
$Configuration.ClientId = $env:OKTA_PS_CLIENT_ID
$Configuration.Scope = "okta.groups.manage okta.apps.manage okta.users.manage"
```


### Get an access token

Running this command in PowerShell opens a browser so you can follow your organization's usual login flow. Logging into Okta in your browser provides a token to the PowerShell session that opened the browser. 

```ps
Invoke-OktaEstablishAccessToken
```

### Group creation

```ps
$GroupProfile = [PSCustomObject]@{
                name = "Sales Team"
                description = "All employees that belong to the Sales team"
            }
$NewGroup = Initialize-OktaGroup -VarProfile $GroupProfile

$CreatedGroup = New-OktaGroup -Group $NewGroup

echo $CreatedGroup
```


### Group rules definition


```ps

# For example, a group rule may specify that users with the job title "Sales Representative" are automatically added to the "Sales Team" group.

# List all users which title is "Sales Representative"
Invoke-OktaListUsers -Search 'profile.title eq "Sales Representative"'

$NewGroupRule = @{
    name = "Assign users to the Sales Team"
    type = "group_rule"
    actions = @{
        assignUserToGroups = @{
            groupIds = @($CreatedGroup.Id)
        }
    }  
    conditions = @{
        expression = @{
            type = "urn:okta:expression:1.0"
            value = "user.title=='Sales Representative'"
        }
    }
}

$CreatedRule = New-OktaGroupRule -GroupRule $NewGroupRule -IncludeNullValues

Echo $CreatedRule

Invoke-OktaActivateGroupRule -RuleId $CreatedRule.Id    

Get-OktaGroupRule -RuleId $CreatedRule.Id

Invoke-OktaListGroupUsers -GroupId $CreatedGroup.Id
```


### Onboarding new employees


```ps
$UserProfile = [PSCustomObject]@{
    firstName     = 'Lionel'
    lastName = 'Messi'
    login = 'lio.messi@mailinator.com'
    email = 'lio.messi@mailinator.com'
    title = 'Sales Representative'
    }

$CreateUserRequest = Initialize-OktaCreateUserRequest -VarProfile $UserProfile

New-OktaUser -Body $CreateUserRequest

Invoke-OktaListGroupUsers -GroupId $CreatedGroup.Id
```

## Example: script to automatically sync employee data from a file to Okta

For this scenario, we imagine a custom tool that lacks [OIDC](https://developer.okta.com/blog/2023/07/28/oidc_workshop) or [SCIM](https://developer.okta.com/blog/2023/07/28/scim-workshop) compatibility has emitted a CSV of users who we'll add to our Okta organization using a PowerShell script. 

The file `~/Documents/hr-export-employees.csv` contains data which looks like this: 

```
employeeNumber, name, email, department, title
1001, John Doe, johndoe@example.com, HR, Human Resources
1002, Jane Smith, janesmith@example.com, IT, Software Engineer
1003, Alex Lee, alexlee@example.com, Sales, Sales Representative
...
``` 

The following PowerShell script creates users in Okta based on the CSV data: 

```ps
$filePath = Resolve-Path ~/Documents/hr-export-employees.csv
if (Test-Path $filePath) {
    # Read the CSV file
    $tableData = Import-Csv $filePath
    # Iterate over each row
    foreach ($row in $tableData) {
        $userProfile = [PSCustomObject]@{}
        # Iterate over each property in the row
        foreach ($property in $row.PSObject.Properties) {
            Add-Member -InputObject $userProfile -MemberType NoteProperty -Name $property.Name -Value $property.Value
            if ($property.Name -eq "email") {
                Add-Member -InputObject $userProfile -MemberType NoteProperty -Name "login" -Value $property.Value
            }
            Write-Host "$($property.Name): $($property.Value)"

        }
        Write-Host  $userProfile
        $createUserRequest = Initialize-OktaCreateUserRequest -VarProfile $userProfile
        $createdUser = New-OktaUser -Body $CreateUserRequest
        Write-Host $createdUser
    }  
 }

    Write-Host "-----------------------------------------"
} else {
    Write-Host "File not found: $filePath"
}
```

What will you automate with Okta's PowerShell module? Let us know in the comments below!

