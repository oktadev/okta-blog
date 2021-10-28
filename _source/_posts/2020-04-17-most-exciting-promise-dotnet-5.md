---
disqus_thread_id: 7975768586
discourse_topic_id: 17236
discourse_comment_url: https://devforum.okta.com/t/17236
layout: blog_post
title: "The Most Exciting Promise of .NET 5"
author: heather-downing
by: advocate
communities: [.net]
description: "Why all C# developers should be paying attention to this upgrade release in November 2020."
tags: [dotnet-5, dot-net-5, c-sharp, csharp, dotnet, dot-net, dot-net-core]
tweets:
- "Let's talk about what's coming for .NET 5, and why it matters ->"
- "Here are a few reasons .NET 5 should interest every C# developer ->"
- "Check out the .NET 5 feature that is a game-changer ->"
image: blog/dotnet-5-promise/onedotnetring.png
type: awareness
---

{% img blog/dotnet-5-promise/onedotnetring.png alt:"The One .NET Ring" width:"600" %}{: .center-image }

It's time to get jazzed about the future of the .NET ecosystem!

It's hard to believe that .NET only came out in 2002. There are so many versions of the framework, rapidly changing the places a C# developer could create and support. The entire ecosystem just turned 18, and it has been confusing at times with versioning. I fell in love with how powerful the platform was, but often, choosing to upgrade to the latest major or minor version proved difficult. How much *actual value* would I get from upgrading?

I am so pleased that *[.NET 5 Preview 2](https://devblogs.microsoft.com/dotnet/announcing-net-5-0-preview-2/) is here* just a month after the [first preview](https://devblogs.microsoft.com/dotnet/announcing-net-5-0-preview-1/) - and it gives a hands-on look at why this will be something every C# developer should pay attention to:

*Unity*.

Now, I'm not talking about [Unity the gaming engine](https://unity3d.com/learning-c-sharp-in-unity-for-beginners) or the [Unity container](https://github.com/unitycontainer) project all about inversion of controls (IOC) and dependency injection (DI). I'm talking about the [unity of ALL THINGS .NET](https://devblogs.microsoft.com/dotnet/introducing-net-5/).

Can you see how naming things can be rather difficult?

Understanding what someone is talking about when they say, ".NET" is a matter of context. Since the [initial release](https://en.wikipedia.org/wiki/.NET_Core) of .NET Core in 2016, There has been a clarification required whenever I was speaking about building an application. Many of the projects I worked on had a reliable experience with [.NET Framework 4.5](https://en.wikipedia.org/wiki/.NET_Framework_version_history#.NET_Framework_4.5)+, and reasons to upend everything and switch over to a completely different set of APIs and libraries was a daunting task. To add to the value of change question, the new versions of Framework were still being released alongside new versions of .NET Core.

## The Compelling Reason to Move from .NET Framework to .NET Core

Then, C# 8 came out. We got nullable reference types and a lot more - like [default implementations](/blog/2020/01/10/default-implementation-csharp)! Along with a new version of the language we love, came a caveat: *C# 8.0 is only officially supported on frameworks implementing .NET Standard 2.1* (which the .NET Framework will never do). So while it might work, there might also be problems and only some of the language features were available. The C# 8.0 support came with the release of [.NET Core 3.0](https://www.youtube.com/watch?v=XA7T_pzG6S4).

Moving to the .NET Core environment suddenly required deeper consideration to take advantage of the benefits of C# 8. In the meantime, new versions of .NET Framework were **still** being shipped. In fact, .NET 4.8 was released in 2019. Having a conversation with a client about why they should spend the money to move away from the runtime that was still actively having versions released was a bit challenging, to say the least.

Wouldn't it be nice to have *one* .NET to rule them all? Luckily, Microsoft agrees.

## There is No More .NET Core, it's .NET 5

Here's the umbrella of .NET 5 to the rescue. It's a MAJOR change because of the following reasons:

As the first part of this unification scheme, Microsoft's Xamarin mobile development platform will switch from using the Mono BCL to join other components leveraging the .NET Core BCL. With that move, Xamarin mobile development will be folded into .NET 5. That means that for the first time, one BCL-based framework will handle all app models:

* ASP.NET Core
* Entity Framework Core
* Blazor
* WinForms
* WPF
* Xamarin
* ML.NET

Wait, WPF and WinForms made it into .NET 5? Yes, [it's true](https://dotnet.microsoft.com/download/dotnet/5.0). Hello there, old friends! Nice to see them included in this runtime. The idea of using one SDK to build apps with is pretty exciting stuff, if you ask me.

## One .NET 5 SDK to Rule Them All

**Who's ready for the general availability of .NET 5 in November 2020?** I know I am! Getting started working with the [preview version](https://dotnet.microsoft.com/download/dotnet/5.0) is what we here at Okta are actively playing with, and encourage all C# developers to do the same. According to the [roadmap](https://github.com/dotnet/core/blob/master/roadmap.md), .NET Core has been rebranded as .NET 5 going forward, with one major version number incremented every year. Because .NET Framework was already on version 4.x, jumping to 5 would unify naming of the ecosystem going forward.

**Is this end of life for the existing .NET Framework?** According to [Scott Hunter](https://devblogs.microsoft.com/dotnet/announcing-net-5-0-preview-1/#comment-4987), the traditional platform will still be supported - at least for a while. The [official support policy for .NET](https://dotnet.microsoft.com/platform/support/policy/dotnet-framework) is stated on Microsoft's website along with existing [.NET Core versions](https://dotnet.microsoft.com/platform/support/policy/dotnet-core) if you are curious about a specific version sunsetting.

Current [.NET Framework version 4.8](https://dotnet.microsoft.com/download/dotnet-framework) won't evolve but some security patches will be provided for the foreseeable future.

## Prepare existing apps for the future of .NET

Until general release, the best way to get prepared for .NET 5 and later is to migrate your Framework apps to the currently stable [.NET Core 3.1](https://dotnet.microsoft.com/download/dotnet-core/3.1) - particularly if you want solid GA support for C# 8 and [Blazor](https://docs.microsoft.com/en-us/aspnet/core/blazor/?view=aspnetcore-3.1). Breaking changes are possible with any major release, but the majority of the APIs should remain in place from .NET Core 3.x. Move your class libraries to [.NET Standard 2.1](https://github.com/dotnet/standard/blob/master/docs/versions/netstandard2.1.md) if possible to help future-proof your transition. When it comes to Xamarin, the compiler will move from the Mono BCL (base class library) to .NET Core BCL. More on mobile app migrations in a future blog post.

The .NET 5 ecosystem is still based on all previous versions of .NET Core - it's the next logical iteration, with a dash of WinForms/WPF inclusion, faster algorithms and a bit of a rebranding. I can get behind that!

{% img blog/dotnet-5-promise/dotnet5platform.png alt:"Unification" width:"800" %}{: .center-image }

What do you think of the future of this platform? Leave a comment below and share what platform and version you are currently working with.

Long live .NET!

## Learn More About .NET and .NET Core

If you are interested in learning more about how Okta can work with C# and enhance your app security, check out some of these other helpful articles:

* [Build an Authenticated Web App in C# with Blazor + ASP.NET Core 3.0](/blog/2019/10/16/csharp-blazor-authentication)
* [How I Learned to Love Default Implementations in C# 8.0](/blog/2020/01/10/default-implementation-csharp)
* [Baking in Security with .NET CLI Templates](/blog/2020/04/01/cli-dotnet-templates-dotnet-core-templates)
* [Build Secure Microservices with AWS Lambda and ASP.NET Core](/blog/2019/03/21/build-secure-microservices-with-aspnet-core)
* [Build a CRUD App with ASP.NET MVC and Entity Framework](/blog/2019/03/11/build-a-crud-app-with-aspnet-mvc-and-entity-framework)

Want to be notified when we publish more of these? Follow [@oktadev on Twitter](https://twitter.com/oktadev), subscribe to our [YouTube channel](https://youtube.com/c/oktadev), or follow us on [LinkedIn](https://www.linkedin.com/company/oktadev/). If you have a question, please leave a comment below!
