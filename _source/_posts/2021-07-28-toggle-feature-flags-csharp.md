---
disqus_thread_id: 8674865409
discourse_topic_id: 17399
discourse_comment_url: https://devforum.okta.com/t/17399
layout: blog_post
title: How to Toggle Functionality in C# with Feature Flags
author: greg-sinka
by: contractor
communities: [.net]
description: "This tutorial shows you how to use feature flags in C# with ConfigCat and Okta."
tags: [configcat, csharp-9, dotnet, dotnetcore, csharp, aspnet, aspnetcore, dotnet5, feature-flags]
tweets:
- "Learn all you need to know about #featureflags + #dotnet in this new tutorial ->"
- "Get up to speed on using #featureflags and #dotnet in this post"
- "Wondering how #featureflags works with authentication in #dotnet? We've got you covered!"
image: blog/featured/okta-dotnet-books-quarter.jpg
type: conversion
---

Toggling functionality using feature flags in .NET Core apps is quite straightforward, especially with a neat little feature flag management service.

In this post, I'll walk you through how to build a simple web application using [Okta](https://www.okta.com) for user authentication and how to use [ConfigCat](https://www.configcat.com) to manage and access feature flags.

## What Are Feature Flags?

Feature flags (aka. feature toggles) are a relatively new software development technique that enables development teams to turn features on and off on the fly. You can think of them as a remote control for your application, or an actual on/off switch for a feature. You can do many great things with feature flags.  Typically, the primary purpose of feature flags is to decouple feature releases from code deployments so developers can both deploy a new feature that is turned off (or hidden from the user), and they can turn on a new feature as needed (ie. whentesting is complete,  when the marketing team is ready, or whenever you, the developer,  feel confident in the feature).

## Some Cool Things Possible with Feature Flags

### Canary Releases and Phased Roll-outs

After deploying a new feature, you can turn it on for just a handful of your users to gather feedback without risking your reputation on a broader audience. Sometimes, it's a good idea to release a new feature in smaller phases to see how the infrastructure handles the load.

### A/B Testing

Sometimes it's hard to decide if we want to go forward with feature A or feature B, so we need to test first. Testing on live users provides high-quality data. Showing feature A to one group of users, while showing feature B to another group enables developers to measure which feature the user prefers.

### Dogfooding

Tech companies, Okta included, usually use their products internally. So, whenever a new feature is on the horizon, it's a good idea to test it on your organization first, to be sure that you are satisfied with the user experience and quality.

### Emergency Kill Switch

"Never release on Friday!" - often said by experienced developers. Major issues tend to rise over the weekend when it is difficult to get hold of the development team and rollback. This toggle comes in handy when you need to immediately turn the latest feature off.  

## The Anatomy of a Feature Flag

At the end of the day, a feature flag in your code is a Boolean variable. A common practice is to place the new feature in one of the statements of a conditional.

```cs
if(isMyNewFeatureEnabled)
{
    doTheNewThing();
}
else
{
    doTheOldThing();
}
```

### Where Does the Feature Flag Value Come From?

The feature flag value can come from several different places. In some cases, you can determine its value based on **other parameters** in the application. For example, you can decide that you want a feature to be enabled only in the Staging environment, but not in Production. Sometimes, it is a good idea to put your feature flags in a **configuration file**, just beside the application like `appsettings.json`. There are also a growing number of **feature flag management services** (such as ConfigCat), which usually provide a nice UI to manage your flags.

## How to Implement Feature Flags in .NET Core

Now, I will demonstrate how to implement and use feature flags in .NET Core using a sample application created with the Okta CLI. For managing and accessing feature flags from my code, I'm going to use the [ConfigCat SDK for .NET](https://www.configcat.com/docs/sdk-reference/csharp).

In this example, my new feature will be Okta's Twitter feed, embedded to the home page of the application. The feed should only be visible if its feature flag is turned on.

## Before You Get Started

### Set Up a Sample Application with the Okta CLI

Okta is a secure and customizable solution to add authentication to your app. Okta supports any language on any stack and lets you define how you want your users to sign in. Each time a user tries to authenticate, Okta will verify his/her identity and send the required information back to your app.

The [Okta CLI](https://github.com/okta/okta-cli) provides turnkey application templates with configured login flows.

Install the [Okta CLI](https://github.com/okta/okta-cli) by following the steps on the [GitHub page](https://github.com/okta/okta-cli).

If you already have an [Okta Developer](https://developer.okta.com/signup) account, run the following command:

```sh
okta login
```

If you don't, you can register a new account by running:

```sh
okta register
```

The Okta CLI is now set up and ready! Run:

```sh
okta start
```

to launch the CLI.

Select the `ASP.NET Core MVC + Okta` option when prompted.

A ready application will be created with the Okta login flow, enabling you to write secrets with `appsettings.json` or to add the new client to your Applications on the [Okta Developer Console](https://developer.okta.com).

You can test run the application by hitting `F5`or by entering `dotnet run` in your command line.
A browser window will open, and you should be able to log in using your Okta credentials.

I have uploaded my working application to GitHub in case you get stuck: [Okta .NET Core 3 Feature Flag Example](https://github.com/mr-sige/okta-netcore3-feature-flags).

### Set Up a ConfigCat Account

Go to [ConfigCat.com](https://www.configcat.com) and sign up for a free account.

You will see your first feature flag `My awesome feature flag` already created.

{% img blog/toggle-feature-flags-csharp/image1.png alt:"" width:"800" %}{: .center-image }

You can work with this feature flag, but I'm going to add a different one for my Twitter feed feature.

{% img blog/toggle-feature-flags-csharp/image2.png alt:"" width:"800" %}{: .center-image }

## Accessing feature flags from .NET Core

### Installing the ConfigCat SDK

In our application code, we'd like to know if the Twitter feed feature should be turned on or off. For that, we need the [ConfigCat SDK for .NET](https://www.configcat.com/docs/sdk-reference/csharp) to access and download the latest value of our feature flag.

First, install the [Nuget package](https://www.nuget.org/packages/ConfigCat.Client) or type:

```ps
Install-Package ConfigCat.Client
```

### Getting the Feature Flag Value

In the HomeController.cs add the following lines:
Run the ConfigCat client. The client will automatically poll and download the latest feature flag values every 60 seconds. You can [customize this polling interval](https://configcat.com/docs/sdk-reference/csharp#auto-polling-default) if you'd like to.

```cs
var client = new ConfigCatClient("YOUR-SDK-KEY");
```

YOUR-API-KEY is under the SDK Key tab on the ConfigCat Dashboard.

{% img blog/toggle-feature-flags-csharp/image3.png alt:"" width:"800" %}{: .center-image }

The `GetValue()` call will return whether the Twitter feed should be enabled or not.

```cs
var twitterFeedVisible = client.GetValue("twitterFeedVisible", false);
```

Here is how my controller looks in one piece:

```cs
public IActionResult Index()
{
    var client = new ConfigCatClient("tNHYCC8Nm0OPXt2LxXT4zQ/k-5ZmLLd10isguXVF6PrTw");
    var twitterFeedVisible = client.GetValue("twitterFeedVisible", false);
    return View(twitterFeedVisible);
}
```

And my `Index.cshtml`.

```html
@model bool
@{
    ViewData["Title"] = "Home Page";
}

<div class="text-center">
    <h1 class="display-4">Welcome</h1>
    @if (Model)
    {
    <div class="w-50">
        <a class="twitter-timeline" href="https://twitter.com/okta?ref_src=twsrc%5Etfw">Tweets by okta</a>
        <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
    </div>
    }
</div>
```

## Targeting Users with Different Features in .NET Core

Sometimes, our product managers want to be able to set different features for different user groups. In these cases, the feature flag value depends on certain properties of our logged-in users. For example, I'd like to turn on Okta's Twitter feed only for users whose email addresses end with `@okta.com`. Let's see how this will look in the code.

First, we need access to the email address of each logged-in user. Since I'm using Okta authentication, I can access this via `HttpContext`.

```cs
var userEmail = HttpContext.User.Claims.Where(claim => claim.Type == "email").Select(claim => claim.Value).FirstOrDefault();
```

Then, we'll make a user object and add the email address as a property.

```cs
var user = new User(userEmail) {Email = userEmail};
```

*The first parameter is a required identifier. In this example, the email address works perfectly as a unique identifier.*

Finally, let's pass the user object to the `GetValue()` call for an evaluation.

```cs
var twitterFeedVisible = client.GetValue("twitterFeedVisible", false, user);
```

>NOTE: *Don't worry about data privacy; because the feature flag evaluation is on the client-side, sensitive user information will never leave your system.*

On the [ConfigCat Dashboard](https://app.configcat.com), click the `TARGET SPECIFIC USERS` button and add a targeting rule. In this case, the rule is: if the email address of the logged-in user contains `@okta.com`, the Twitter feed feature should be enabled.

{% img blog/toggle-feature-flags-csharp/image4.png alt:"" width:"800" %}{: .center-image }

Run your application and play around with different targeting rules. They are quite fun!

## Takeaway

Feature flags are quite simple to implement and add great value to your application's flexibility. Even if you choose to go with a feature flag service provider or implement your own solution, I'm confident your product team will love the idea of decoupling feature releases from code deployments, as it eliminates a major source of stress from the equation. Also, A/B testing capabilities and percentage-based roll-outs will save your brand reputation and increase confidence when going to production with a new idea.

## Learn More About Feature Flags and Authentication

- [Martin Fowler's blog post from 2017 on the topic, is a must read](https://martinfowler.com/articles/feature-toggles.html)
- [Okta CLI, the simplest way to create secure application templates](/blog/2020/12/10/introducing-okta-cli)
- [Get Started with ASP.NET Core + Okta](/blog/2020/12/15/okta-linux-dotnet-server-support)
- [ConfigCat SDK for .NET manual and docs with advanced use cases](https://www.configcat.com/docs/sdk-reference/csharp)

If you have any questions about this post, please add a comment below. For more awesome content, follow [@oktadev](https://twitter.com/oktadev) on Twitter, like us [on Facebook](https://www.facebook.com/oktadevelopers/), or subscribe to [our YouTube channel](https://www.youtube.com/oktadev).
