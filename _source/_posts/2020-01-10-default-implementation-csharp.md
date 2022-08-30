---
disqus_thread_id: 7810198844
discourse_topic_id: 17197
discourse_comment_url: https://devforum.okta.com/t/17197
layout: blog_post
title: "How I Learned to Love Default Implementations in C# 8.0"
author: lee-brandt
by: advocate
communities: [.net]
description: "I originally thought that default implementtions in C# 8.0 were a bad idea, but a little digging and I think I love them."
tags: [csharp, dotnet, default-implementation]
tweets:
- "Doctor C# 8.0, or how I learned to love deault implementations!"
- "Keep your implementations out of my interfaces. Wait, that's cool!"
- "Protecting your future self by using default implementations in C# 8.0!"
image: blog/featured/okta-dotnet-half.jpg
type: awareness
---

If you haven't heard, C# 8.0 ships with a new feature that allows you to add default implementations to interfaces. If you're like me, you may be thinking, "Why? Why would I want to add implementations to interfaces? Isn't that what abstract classes are for? Doesn't that go against everything that interfaces stand for?"

My immediate reaction to this new feature was visceral and negative,, but I decided to investigate closer and... I think I may actually love it. Stay with me here and I'll explain why.

## What Did Abstract Classes Ever Do to You?

The first thing I thought was, "That's what abstract classes are for! They already provide a default implementation!" This is true, and for those of us who've programmed mostly in C#, it can feel a little "dirty" to put implementations into an interface. The problem is that while you can implement multiple interfaces, there is no multiple inheritance model in C#. This can make life difficult in certain situations.

The first challenging situation is called the Diamond Problem. This is where you inherit two objects from a superclass, and then one object from both of those.

{% img blog/default-implementation-csharp/diamond-problem.png alt:"The Diamond Problem" width:"400" %}{: .center-image }

For example, say you have a `Centaur` class that inherits both the `Person` and `Animal` classes. Both `Person` and `Animal` inherit from the `Object` class that has an `Equals()` method.

When you call the `Centaur`'s `Equals()` method, which base implementation gets called? This is the diamond problem. It is left to the programmer to either decide which implementation to use or to override it completely. Less experienced programmers might not even know there is a diamond problem until compile or even run time. Particularly when a large inheritance tree exists, as in the case of objects inheriting from framework classes. This situation might be better solved with cleaner class design, but nonetheless represents a potential pothole.

So how can you have a default implementation as you might in an abstract or parent class without introducing multiple inheritance and all the intricacies that go along with it? You can already implement multiple interfaces, so this seems like the best place.

## What Problems Do Default Implementations Solve?

Beyond my initial negative reaction to "dirtying up" interfaces with implementations, I thought, "What problem is this solving for me?" I think it's a fair question, so here are the two ways I see them helping.

The first problem is when you have an existing interface that may be implemented by multiple classes and you need to change the interface. It is time-consuming to track down all the places an interface is implemented and add implementations for the new interface methods.

An easy example is an `ILogger` interface. The original interface may look like this:

```cs
public interface ILogger
{
  void Log(string message);
}
```

In the beginning, this was good enough because there weren't that many messages. As time went by, the loggers started logging errors and informational messages and it became hard to slog through all the informational messages to find errors. The first step to remedy the problem was to format the message, but the consumers have been passing different formats. Some prepend a message with "Error:", some with "[Error]:", and others with "Failure - ". To make matters more complicated, there are multiple different implementations that log to SQL databases, NoSQL data stores, and to raw text files.

Default implementations could help solve this problem by allowing you to add those default implementations without introducing a breaking change.

For instance, if the `FileLogger` implementation was:

A `FileLogger` class might implement this as:

```cs
public class FileLogger: ILogger
{
  // file logger's constructor create a StreamWriter to write to
  private StreamWriter writer;
  public FileLogger(string fileName)
  {
    var stream = File.Open(fileName, FileMode.Append);
    writer = new StreamWriter(stream);
  }

  public void Log(message)
  {
    writer.WriteLine(message);
  }
}
```

You could change the `ILogger` by adding some default implementations:

```cs
public interface ILogger
{
  void Log(string message);

  void LogInfo(string message)
  {
    Log($"[INFO]: {message}");
  }

  void LogError(string message)
  {
    Log($"[ERROR]: {message}");
  }
}
```

Then when using the `FileLogger` that is injected via dependency injection, you could do this:

```cs
public class SomeController: Controller
{
  private ILogger logger;
  public SomeController(ILogger logger) // FileLogger injected here.
  {
    logger = logger;
  }

  public async Task<ActionResult> Index()
  {
    // Doing stuff
    logger.LogInfo("I am doing stuff.");

    // something goes wrong
    logger.LogError("Something went wrong");
  }
}
```

It doesn't matter that the `FileLogger` class didn't implement the `LogError()` or `LogInfo()` methods. It implemented `Log()` and the default implementations use the `Log()` method, so nothing in the `FileLogger` class needed to change! Same with the `SqlLogger` and `NoSqlLogger` classes. Pretty slick, right?

## Are Default Implementations Dirty?

My final thought was, "Is this a hack? Should I be coming back periodically and fixing the places where I've used it and replacing it with a breaking change?"

This led to the second epiphany I had about this feature: if I design my system with this feature in mind, I can help "future proof" parts of the application by simply knowing that I can add default implementations to interfaces. I _know_ that I'm not  going to foresee every method I'll need in the future, but if I use the interfaces wisely, I can still add additional methods later without the need to introduce breaking changes.

Arguably, there might be times when we _should_ come back and change out a default method for a breaking change or a more sophisticated class structure. That's _ALWAYS_ gonna happen. You're building a system with the knowledge (both about the business and programming in general) that you have right now. A year from now, you'll have gained new knowledge about the system, the business, and programming. Things will change. That is the only thing we can really count on. This feature is just another way to plan for it!

## Learn More About C#, .NET, and Okta

If you liked this content, please check out some of our other posts on similar topics:

- [Build a Simple Microservice with C# Azure Functions](/blog/2019/11/13/build-simple-microservice-csharp-azure-functions)
- [C# WebSockets Tutorial: Build a Multiplayer Game](/blog/2019/11/21/csharp-websockets-tutorial)
- [ASP.NET Core 3.0 MVC Secure Authentication](/blog/2019/11/15/aspnet-core-3-mvc-secure-authentication)

As always, feel free to comment below with any questions, comments, or concerns. If you like this content, make sure to follow us on [Twitter](https://www.twitter.com/oktadev) and subscribe to our channel on [YouTube](https://www.youtube.com/c/oktadev) so you never miss out!
