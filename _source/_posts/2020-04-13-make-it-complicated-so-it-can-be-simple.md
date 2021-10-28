---
disqus_thread_id: 7967891921
discourse_topic_id: 17233
discourse_comment_url: https://devforum.okta.com/t/17233
layout: blog_post
title: "Make It Complicated, So It Can Be Simple"
author: chris-gustafson
by: internal-contributor
description: "Managing complexity in Agile projects can make simplicity possible."
tags: [agile, lean, process, project-management]
image: blog/featured/okta-angular-headphones.jpg
type: awareness
---

> "If you can't explain it to a six year old, you don't understand it yourself." — Albert Einstein

> "Aren't we overthinking this?" — almost every developer at some point

Like all things that become buzzwords, the Agile methodology has been distorted to represent a number of specious definitions.  One definition in particular suggests that Agile removes all complexity from a project. Agile does remove some  bureaucracy and "red tape", freeing teams to produce deliverables faster. Agile is about removing the unnecessary, and while streamlining the process might make the orchestration of effort feel simpler, it does not necessarily mean that the product of this effort must be simple.

As the Einstein quote earlier suggests, you must first understand a topic deeply, and then you can easily distill your explanation to match the capacity of any audience (including a six year old). This distillation is not the removal of complexity at all. Rather, through managing the complexities,  simplicity is possible.

Stepping away from technology for a moment, consider Lean Manufacturing concepts. To be "lean", manufacturers simplify their processes to remove anything that is unnecessary or inefficient. They acquire raw materials "just in time", and they keep very little excess inventory of finished goods on hand. The process of converting materials into finished goods is light, efficient, safe, and immensely predictable. Imagine a stream of raw materials going in one side of the factory that matches a stream of products going out the other—a perfect lean scenario. No waste, no carrying cost.

Lean manufacturing from a distance appears to be simple. However, achieving this appearance requires countless hours of planning and stalwart attention to the plan.  Leaders hold continuous improvement sessions or "kaizens" to find new ways to do better by doing less. They have to scrutinize individual steps to eliminate areas where people could make mistakes or waste time. They even micro-manage brooms and tools by outlining their silhouettes in white tape so that people always return them to the right place and nobody ever wastes a second fretting over a lost item.

How does lean manufacturing relate to Agile or to software? The answer lies in the last two letters of an Agile acronym: "MVP".

MVP or minimum viable product is a scoping device that constrains teams to design deliverables that live up to only the most basic functionality to satisfy the need at hand. MVPs keep features lightweight and code sprints small. The smaller the deliverable, the more likely the stakeholder can certify its use, the tester can ensure it works properly, and the customer can start using it sooner. With each sprint, teams expand the application's capabilities, and suddenly Gall's Law becomes apparent:

> "A complex system that works is invariably found to have evolved from a simple system that worked. ... You have to start over with a working simple system."-- John Gall

It is the last two letters of MVP (viable product) that often causes teams to lose their way. Instead of focusing on a viable and durable product, they focus on "minimum" instead.  This then leads to the point of this article: for the simple concept of MVP and Gall's law to be successful, each iteration of deliverable has to be fully complete relative to its scope.

For example, a team's sprint for a new application has a feature to support application logging.  The MVP needs to have the standard log levels (trace, debug, info, warn, error) available and needs to write these logs to a local file. A team that focuses on the "minimum" might create a static class with methods for each log level and a constructor that reads a file path from a configuration file. It is also possible that the team might decide to really take a shortcut and just download a prebuilt open-source logger library and implement that throughout the application.

These types of design challenges often create arguments in sprint planning meetings where team members discuss delivery. Undoubtedly, some in the room will argue for the minimum approach I alluded to. After all, it's just logging and "why do we need to overthink this," right?

To create a truly "viable product", you must scrutinize each feature and understand it fully—much like how Einstein warned and how Lean Kaizens practice—in order to properly uncover and manage the complexity. The planning team needs to uncover not just the minimum, but what truly is a viable, usable product outcome.

In the logger example, defining a logger interface that requires any logger component, open source or roll-your-own, to implement it may very well be the design answer. The application can depend upon this simple layer of benign abstraction, and the logger implementation can live up to it. The result is an application that can log anywhere the logger implementation supports, but need not change if the implementation evolves or changes. Thus if my business logic class calls `ILoggerService.LogError(myErrorMessage)` today, it will go to a local file. However, the logger implementation can evolve on its own, and my same line of code can push a log message to a SIEM tool tomorrow.

The logger example here is a simple one, but it is one that teams often encounter, especially early in a project. Here are some examples where taking the time to create complexity at first allows for later projects to be simple:

<table border="1">
  <thead>
    <tr>
      <th width="25%">MVP</th>
      <th width="25%">Minimum</th>
      <th width="25%">Viable</th>
      <th width="25%">Product</th>
    </tr>
  </thead>
  <tbody valign="top">
    <tr>
      <td>Create a web form for profile information</td>
      <td>Create the form, embed form labels and error messages in the HTML</td>
      <td>Create the page, map labels and error messages to a resource library</td>
      <td>You can now dynamically update labels for translation & customization.  The product can standardize labels and messages and use them consistently</td>
    </tr>
    <tr>
      <td>Record update date time</td>
      <td>Capture the system date</td>
      <td>Capture the system date and normalize it to universal time</td>
      <td>Application can now run in multiple time zones and have consistent time recording. You can easily adjust dates and times for the viewer's local time zone</td>
    </tr>
    <tr>
      <td>Write form data to a database table</td>
      <td>Embed SQL statements in the web form business logic</td>
      <td>Create standard entity objects and map them through a data access layer to an abstracted data store</td>
      <td>Application now has common data entities and the ability to re-platform data, perhaps per entity.  This creates a testable (mockable), reusable, extensible, and scalable data management layer.</td>
    </tr>
    <tr>
      <td>Validate Visa card numbers</td>
      <td>Create a "ValidateVisa" method in the webform</td>
      <td>Create a non-concrete base class for "payment method" and create deriving classes for charge cards, bank accounts, etc., each with an implementation of a "Validate" method</td>
      <td>Application can now natively support more than just one payment type as they come online.  You can still validate specifically per method, but you can now test and reuse the code.</td>
    </tr>
  </tbody>
</table>

The temptation to take the quick and easy path can greatly hinder an application's ability to last beyond its initial known purpose. When you write code to the simplest vision of itself, the code will never become more than the team initially conceived it to be. There is a term for code that has a finite value and a limited scope of use without great effort: technical debt.

## Learn more about Approaches, Developer Careers, and Standards

Check out a few more blog articles that deal with working as a developer and navigating modern projects and standards:

- [Why Every Developer Needs to be a Generalist](/blog/2019/11/26/developer-generalist-vs-specialist)
- [Pro Tips for Developer Relations](/blog/2019/01/28/developer-relations-pro-tips)
- [Okta Software Engineering Design Principles](/blog/2015/05/08/software-engineering-design-principles)

Want to be notified when we publish more of these? Follow us on [Twitter](https://twitter.com/oktadev), or subscribe to our [YouTube channel](https://youtube.com/c/oktadev). If you have a question, please leave a comment below!
