---
layout: blog_post
title: "Introducing the Okta CLI"
author: micah-silverman
by: advocate
communities: [
    ".net",
    "go",
    "java",
    "javascript",
    "mobile",
    "php",
    "python",
    "ruby",
    "security",
    "devops"
]
description: "Use the Okt CLI to get started in under 5 minutes!"
tags: [security, oauth, oauth2, oidc, "openid connect"]
tweets:
- ""
- ""
- ""
image: "blog/"
type: conversion
---

Okta is an Identity Management Platform that takes all the hassle out of authentication and authorization. It's feature packed with everything from workforce integrations for G-Suite to the latest version of OAuth 2.0 as-a-service for developers writing their own APIs.

It can sometimes be a daunting task for developers to get started with Okta because of how feature rich it is.

Introducing the Okta CLI - made by developers for developers. Using the CLI tool, you can go from zero to running application complete with auth (in the language and framework of your choice) in about 5 minutes. And, you don't have to wade through any web based admin consoles to do it.

## Set up the Okta CLI

The [Okta CLI](https://cli.okta.com) is a native command-line application that runs on MacOS, Linux, and Windows. Installation on any of these OS's is a snap, but there are some prerequisites:

| OS      | Prerequisites                         |
|---------|---------------------------------------|
| macOS   | [Homebrew](https://brew.sh/)          |
| Linux   | [Flatpack](https://flatpak.org/)      |
| Windows | [Chocolatey](https://chocolatey.org/) |

There are simple install directions at [https://cli.okta.com](https://cli.okta.com) for your platform.

Here, I show you the command to install on macOS:

```bash
brew cask install oktadeveloper/tap/okta
```

Pretty easy, right?

## Get Started in Under 5 Minutes

As a developer, in order to make use of Okta, you need an Okta Organization (fondly referred to as an **org**).

In order to integrate your appliction with Okta so that your users can authenticate, you need to provision an application within Okta.

In order to configure your application to work with the privisioned Okta application, you need drop in a library for the language and framework) you're using.

Finally, you need to configure the library to work with Okta.

In the past, that's meant bouncing back and forth between the Okta Admin Console and your application as well as finding the right library and configuring it.

Now, it looks like this:

```bash
okta start
```

I want to make this a little more challenging for myself, so I am going to use a .NET sample application, since I am a Java developer. Here's the output of the above command:

```bash
Registering for a new Okta account, if you would like to use an existing account, use 'okta login' instead.

First name: Micah
Last name: Silverman
Email address: micah@afitnerd.com
Company: Okta
Creating new Okta Organization, this may take a minute:
OrgUrl: https://dev-159750.okta.com
An email has been sent to you with a verification code.

Check your email
Verification code: 189919
New Okta Account created!
Your Okta Domain: https://dev-159750.okta.com
To set your password open this link:
https://dev-159750.okta.com/reset_password/drpdRFTmBi8yQ-uIzbpx?fromURI=/

Select a sample
> 1: Spring Boot + Okta
> 2: Vue + Okta
> 3: ASP.net Core 3  MVC
> 4: Angular + Okta
Enter your choice [Spring Boot + Okta]: 3
Configuring a new OIDC Application, almost done:
Created OIDC application, client-id: 0oa6kobyoZO41crqQ5d5

Change the directory:
    cd okta-aspnet-core3-sample

Okta configuration written to: okta-aspnetcore-mvc-example/appsettings.json
Don't EVER commit okta-aspnetcore-mvc-example/appsettings.json into source control
Run this application with:
    dotnet run --project okta-aspnetcore-mvc-example
```

There's a lot going on here from the humble `okta start` command, so let's break it down.

First I see a one-time requirement in order to provision the Okta org.

I put in some minimal information: name, email and company. In about 20 seconds, a shiny new Okta org is allocated for me and the Okta CLI shows me my Org URL (https://dev-159750.okta.com).

Next, I need to prove that I own the email address I entered. an One-Time Passcode (OTP) is sent to my email address and the Okta CLI waits for me to paste that in.

{% img blog/introducing-okta-cli/okta-email.png alt:"okta email" width:"600" %}{: .center-image }

Once my email address is verified, the Okta CLI displays a unique link to set my password.

> **NOTE:** The order-of-operations here is not important. You can set your password before you choose a sample or afterwards. But, you should set your password in a timely fashion as that unique URL expires after 24 hours.

Next, I see a list of available samples. As of this writing, there are four samples, but we are expanding that list. And, the Okta CLI automatically makes any new samples available in the list. You can create as many sample as you like with your Okta Org. I chose option 3: `ASP.net Core 4 MVC`

Finally, I see information about the Application that was provisioned in my Okta Org along with instructions to run the sample app.

I'm going to follow those instructions and run this sample:

```bash
cd okta-aspnet-core3-sample
dotnet run --project okta-aspnetcore-mvc-example
```

Here's the output (abbreviated):

```bash
dotnet run --project okta-aspnetcore-mvc-example

Welcome to .NET Core 3.1!
---------------------
SDK Version: 3.1.402

...

info: Microsoft.Hosting.Lifetime[0]
      Now listening on: https://localhost:5001
info: Microsoft.Hosting.Lifetime[0]
      Application started. Press Ctrl+C to shut down.
...
```

> Did you know you could run dotnet on macOS? What a world! Simply run: `brew cask install dotnet-sdk`

You can browse over to: `https://localhost:5001` to see this basic app in action. **NOTE:** You'll see an SSL warning from the browser as it's likely you don't have an SSL cert installed for `localhost`. You can bypass this warning to view the app.

{% img blog/introducing-okta-cli/dotnet-welcome.png alt:"okta email" width:"600" %}{: .center-image }

Click **Sign In** and you're redirected over to Okta to authenticate. After authenticating, you're redirected back to the app and it knows who you are!

{% img blog/introducing-okta-cli/dotnet-authenticated.png alt:"dotnet authenticated" width:"600" %}{: .center-image }

> **NOTE:** If you didn't set your password earlier, you'll need to now. Follow the unique link shown in the Okta CLI output. In my case, it was: `https://dev-159750.okta.com/reset_password/drpdRFTmBi8yQ-uIzbpx?fromURI=/`

## Looking Under the Hood of the Okta CLI

I don't know much at all about .NET programming. I couldn't tell you the difference between .NET Core and ASP.NET or the differences between 3 and 4 (I think there's a 5 coming?) But, in less than 5 minutes, I had a running app that I could authenticate to using Okta.

The samples architecture is the secret sauce behind this capability. If you check out where the .NET sample lives, you can see the [appsettings.json](https://github.com/okta-samples/okta-aspnet-core3-sample/blob/master/okta-aspnetcore-mvc-example/appsettings.json) template file:

```json
{
  ...
  "Okta": {
    "OktaDomain": "${CLI_OKTA_ORG_URL}",
    "ClientId": "${CLI_OKTA_CLIENT_ID}",
    "ClientSecret": "${CLI_OKTA_CLIENT_SECRET}"
  }
}
```

Part of the work that the Okta CLI does is to replace these values with the actual settings from your okta org when the sample is set up and the Okta application is provisioned.

We wanted to keep the Okta CLI as flexible as possible, so it grabs the sample you choose from GitHub and walks all of the plain text files in the project looking for replacement parameters. The Okta CLI has no specific knowledge of a particular language or framework, which makes it easy to work with any language and framework.

Each sample also has some meta-information contained in [.okta/sample-config.yaml](https://github.com/okta-samples/okta-aspnet-core3-sample/blob/master/.okta/sample-config.yaml):

```yaml
oauthClient:
  redirectUris:
    - https://localhost:5001/authorization-code/callback
    - http://localhost:8080/authorization-code/callback
  applicationType: web

directions: |+2
  Okta configuration written to: okta-aspnetcore-mvc-example/appsettings.json
  Don't EVER commit okta-aspnetcore-mvc-example/appsettings.json into source control
  Run this application with:
      dotnet run --project okta-aspnetcore-mvc-example
```

For the .NET Core app, it describes the type of Okta Client needed, which in this case is an OAuth 2.0 Web application. It also lists the `redirectUris` Okta needs in order to integrate with the application.

The `directions` section is what's output to the command-line once the application is provisioned in Okta and configured locally.

Ordinarily, you won't have to deal with the sample code on GitHub directly, but it's useful to understand what's happening under the hood.

> New to OAuth 2.0? check out this post to get started: [An Illustrated Guide to OAuth and OpenID Connect](https://developer.okta.com/blog/2019/10/21/illustrated-guide-to-oauth-and-oidc)

**Note:** When you run `okta start`, your Okta Org URL and API Token are stored in: `~/.okta/okta.yaml`. It's the information in this file that the Okta CLI uses to perform operations on your Okta Org, like provisioning new OAuth 2.0 Clients.

## More Stuff You can Do with the Okta CLI

So far, this post has shown you how to get started with the Okta CLI. What if you already have an Okta Org? What if you already have code you're working on and want to integrate it with Okta?

### Running with an Existing Org

Want to hook up the Okta CLI to your existing Okta Org? No problem! Run:

```
okta login
```

You're asked to enter your Org URL and an API token. This information is then stored in `~/.okta/okta.yaml` and is used with other `okta` commands.

> You can create an API Token by following the instructions [here](https://developer.okta.com/docs/guides/create-an-api-token/overview/).

### Configuring Your Existing Application

_need to fill this in_

## Adding Samples for Okta CLI

It's [Hacktoberfest]() and we'd love your contributions! If you want to setup a new sample, create a new repo that has the naming convention: `okta-<language and or framework name>-sample`. Ideally, it'd be a language and framework that we don't already have. But, if you want to submit a variation on an existing sample, we'd accept that too - just give it a unique name.

Since Hacktoberfest runs off merged pull requests, we'll create the sample in the [okta-samples](https://github.com/okta-samples) GitHub org. You can then put up a pull request to it.

## Wrapping Up

I hope you enjoyed this little tour of the Okta CLI. Watch for new developer blog posts that make use of it. We welcome issues and PRs at the [okta-cli](https://github.com/oktadeveloper/okta-cli) GitHub repo.

If you want to learn more about Okta, OAuth 2.0 and/or OpenID Connect, check out these posts:

*
*
*

Follow us on [Twitter](https://twitter.com/oktadev) and subscribe to our [YouTube Channel](https://youtube.com/c/oktadev) so you never miss any of our awesome content!
