---
disqus_thread_id: 8290855941
discourse_topic_id: 17324
discourse_comment_url: https://devforum.okta.com/t/17324
layout: blog_post
title: Install .NET Core Apps on Linux in 5 Minutes
author: greg-sinka
by: contractor
communities: [.net]
description: "How to install and run your .NET Core apps inside a Linux container."
tags: [linux, dotnet, aspnet, csharp, dotnetcore, aspnetcore, devops]
tweets:
- "Learn how to deploy an Okta #dotnetcore app inside a #Linux #container."
- "Want to discover how to use #Linux with #dotnetcore for containerization? Here is a quick how-to!"
- "Need to install your #dotnetcore on a #Linux instance? Here you go!"
image: blog/featured/okta-dotnet-mouse-down.jpg
type: conversion
---

As a big fan of open source, I'm loving the fact that .NET Core is cross-platform. It opens up endless possibilities, from hobby projects, experiments, and proofs of concept, to massive high-load production applications that run on cost-effective infrastructure with high security and scalability. I usually get the simplest and cheapest $5/month Ubuntu-based virtual private server (VPS) from any cloud platform provider instead of the more complex and expensive container instances or cloud computing services.

I'm going to guide you through the steps on how to set up a .NET Core runtime environment, and how to deploy a .NET Core web application with Okta authentication, once you've got an Ubuntu VPS, all using nothing more than the Terminal.

## The Benefits of Using Okta

Okta is a cloud service that allows developers to create, edit, and securely store user accounts and user account data, and connect them with one or multiple applications. Using Okta, you don't have to worry about implementing sign up, login and logout flows manually. In our sample app, we will set up Okta to handle our user management for OAuth sign-in. There are a few tricks to set up .NET Core to work on Linux (especially when it comes to containerization on a host like AWS or Azure), but don't worry - you will get a good overview in this tutorial.

## Prerequisites

- [Ubuntu 20.04+](https://releases.ubuntu.com/20.04/)
- A physical or virtual machine with [Ubuntu Desktop](https://ubuntu.com/download/desktop) 20.04+
- For virtualization I recommend [VirtualBox](https://www.virtualbox.org/)

## Install .NET Core SDK/Runtime on Linux

### .NET Core SDK or Runtime: Which One Is Best

The .NET Core runtime allows you to run applications on Linux that were made with .NET Core but didn't include the runtime. With the SDK you can run but also develop and build .NET Core applications. Normally you would need only the runtime in a production environment and the SDK in a development environment.

Today we are going to build and run our sample application on the same machine. So let's install the .NET Core SDK.

### Adding the Package Repository

We need to add Microsoft's package signing key to make the package repository trusted by the system.

Open Terminal and run the following commands:

```sh
wget https://packages.microsoft.com/config/ubuntu/20.04/packages-microsoft-prod.deb -O packages-microsoft-prod.deb
```

```sh
sudo dpkg -i packages-microsoft-prod.deb
```

### Installing the SDK

```sh
sudo apt-get update; \
  sudo apt-get install -y apt-transport-https && \
  sudo apt-get update && \
  sudo apt-get install -y dotnet-sdk-3.1
```

To make sure the installation was successful, run:

```sh
dotnet --version
```

The output should be the installed .NET Core version.

## Building and Running a .NET Core application on Linux

We are going to use the [.NET Core CLI](https://docs.microsoft.com/en-us/dotnet/core/tools) to build and run the sample application.

### Copying the source code

I have prepared a sample application for the sake of this example. Let's use `git` to copy it to our machine from GitHub.

```sh
git clone https://github.com/oktadeveloper/okta-netcore3-deploy-linux-example okta
```

### Building the .NET Core Application

Enter the folder where we just copied the source code:

```sh
cd okta
```

Run the build:

```sh
dotnet build
```

The first build might take a while. Then the output should be something like:

```cli
Build succeeded.
    0 Warning(s)
    0 Error(s)
```

### Running the .NET Core Application

To run the application in Development mode, type:

```sh
dotnet run
```

Running the sample application will fail because we need to set up Okta login first.

Output:

```cli
Unhandled exception. System.ArgumentNullException: Replace {clientId} with the client ID of your Application. You can copy it from the Okta Developer Console in the details for the Application you created. Follow these instructions to find it: https://bit.ly/finding-okta-app-credentials (Parameter 'ClientId')
```

### Quickly Set Up Okta Login

Log in to your [Okta Developer account](https://login.okta.com)

Navigate to `Applications`, then select `Add Application`.
{% img blog/dotnetcore-linux/image1.png alt:"" width:"500" %}{: .center-image }

Select Web as a platform:
{% img blog/dotnetcore-linux/image2.png alt:"" width:"700" %}{: .center-image }

On the next screen add the following:
**Login redirect URIs**: `https://localhost:5001/authorization-code/callback`

**Logout redirect URIs**: `https://localhost:5001/signout/callback`
{% img blog/dotnetcore-linux/image3.png alt:"" width:"800" %}{: .center-image }

When finished, click **Done**.
{% img blog/dotnetcore-linux/image4.png alt:"" width:"200" %}{: .center-image }

Take note of your client credentials ( **Client ID** and **Client secret**).
{% img blog/dotnetcore-linux/image5.png alt:"" width:"600" %}{: .center-image }

Open `appsettings.json` in your favorite code editor and add your credentials.
{% img blog/dotnetcore-linux/image6.png alt:"" width:"500" %}{: .center-image }

You can find your **Org URL** in the top right corner of the Dashboard:
{% img blog/dotnetcore-linux/image7.png alt:"" width:"800" %}{: .center-image }

Now the sample app is ready to run:

```sh
dotnet run
```

Output:

```cli
info: Microsoft.Hosting.Lifetime[0]
      Now listening on: https://localhost:5001
info: Microsoft.Hosting.Lifetime[0]
      Now listening on: http://localhost:5000
info: Microsoft.Hosting.Lifetime[0]
      Application started. Press Ctrl+C to shut down.
info: Microsoft.Hosting.Lifetime[0]
      Hosting environment: Development
info: Microsoft.Hosting.Lifetime[0]
      Content root path: /home/ubuntu/okta
```

You can now open a browser window at `http://localhost:5000` to see the application running. Also you can try logging with Okta in the top right corner.

### Troubleshooting

In case you run into a Correlation Error after logging in with Okta, you need to manually set the `SameSite` cookie attribute to `None`, and enable SSL (HTTPS) on your server. Check out more about how SameSite affects your apps in [this article](/blog/2020/09/28/adapt-dotnet-app-for-samesite-fix).

## Takeaways

Developing .NET Core applications on Linux is not the stuff of science fiction any more. Since Microsoft started moving away from closed-source and platform-dependent solutions, a Linux-based development environment has its advantages. I believe tools like [VSCode](https://code.visualstudio.com) and [Rider](https://www.jetbrains.com/rider)—also available on every platform—are mature enough to make them reasonable competitors of the classic Visual Studio IDE for Windows. I've successfully used Linux as my primary development environment for .NET Core for a few years now. Give it a try yourself and let us know what your experience has been in the comments below!

## Learn More About .NET and Okta

If you are interested in learning more about security and .NET check out these other great articles:

- [Deploy a .NET Container with Azure DevOps](/blog/2020/10/07/dotnet-container-azure-devops)
- [Okta ASP.NET Core MVC Quickstart](/quickstart-fragments/dotnet/aspnetcore-auth-code/)
- [Deploy a .NET Container with AWS Fargate](/blog/2020/06/22/deploy-dotnet-container-aws-fargate)
- [The Most Exciting Promise of .NET 5](/blog/2020/04/17/most-exciting-promise-dotnet-5)
- [Goodbye Javascript! Build an Authenticated Web App in C# with Blazor + ASP.NET Core 3.0](/blog/2019/10/16/csharp-blazor-authentication)

Don't forget to [follow us on Twitter](https://twitter.com/oktadev) and subscribe to our [YouTube channel](https://youtube.com/c/oktadev) for more great tutorials.
