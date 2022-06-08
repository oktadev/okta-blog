---
disqus_thread_id: 7902866560
discourse_topic_id: 17221
discourse_comment_url: https://devforum.okta.com/t/17221
layout: blog_post
title: "Stop Writing Server-Based Web Apps"
author: david-neal
by: advocate
description: "Stop writing server-based web apps and switch to the JAMstack architecture!"
tags: [jamstack, web, architecture, javascript, api, cms, asp-dot-net, java, php, python]
tweets:
- ""
- ""
- ""
image: blog/stop-writing-server-based-web-apps/stop-writing-server-based-web-apps.jpg
type: awareness
---

The World-Wide Web, as we know it, started around 1993 by serving static HTML files with links to other HTML files. It didn't take long for developers to find ways of making websites more "dynamic" using technologies like Common Gateway Interface (CGI), Perl, and Python.
 
Since the '90s, I have built web applications using a variety of languages, platforms, and frameworks. I've written application frameworks, content management systems, a blog engine, and a social media application, among other things. I'm quite proud of some of those applications. Other applications, not so much.

I've recently come to the conclusion that I've been doing it wrong. I'm going to stop writing server-based web applications, and I believe you should, too.

{% img blog/stop-writing-server-based-web-apps/stop-writing-server-based-web-apps.jpg alt:"Stop writing server-based web apps!" width:"800" %}

## The Web Request Walk of Shame

Let's take a look at a typical web request. A person follows a link. The request goes to the web server. The web server runs some code and figures out what view to render. The server fetches some data from a database and combines the data with a template. Finally, the server renders the response as HTML and sends it back to the browser. Sounds simple enough, right?

As you may know, any application beyond "Hello World" starts getting very complicated very fast. Often, one request creates multiple calls to a database or other internal APIs. More calls to databases and services mean more network latency. There could be frustrating caches at multiple levels attempting to solve performance problems. There could be multiple web servers behind a load balancer, making deployments more difficult.

{% img blog/stop-writing-server-based-web-apps/web-request-walk-of-shame.jpg alt:"Web request walk of shame" width:"800" %}

More often than not, monolithic server apps turn into monsters. Breaking up a monolithic app into microservices comes at a considerable cost of effort and adds even more complexity and latency. What's a web developer to do?

## Pump Up the JAMstack

There's a new term floating around: JAMstack. Maybe you've heard of it? In a very simplified nutshell, JAMstack uses a static site generator to create static HTML, CSS, JavaScript, and other assets, and deploys everything to a content delivery network (CDN).

"Wait... static HTML? Like, serving plain HTML files? Are you kidding?"

Sounds like a step back, doesn't it?

When I first heard about JAMstack, I thought,

> "Well, that may work fine for documentation, a marketing landing site, or a blog. That won't work for _real_ apps. No thanks. I'll stick with my stack."

I dismissed JAMstack.

_Listen. Please don't dismiss JAMstack the way I did._

## The Truth About JAMstack

There is absolutely nothing faster than serving a file. Anything more requires CPU cycles at minimum or a "Web Request Walk of Shame" at worst. The fastest way to serve a file is to leverage a CDN, so files are physically closer. CDN providers are also experts in scaling to meet spikes in traffic and preventing DDoS attacks.

{% img blog/stop-writing-server-based-web-apps/no-code-faster-more-secure.jpg alt:"There's no code faster or more secure than no code" width:"800" %}

The "JAM" in JAMstack stands for JavaScript, APIs, and (pre-rendered) Markup. The idea is relatively simple. Turn _everything_ you possibly can into pre-rendered markup. Then, once it reaches the browser, progressively use JavaScript + APIs to make the application as dynamic and personalized as you need it to be. The JAMstack approach shifts the application "runtime" from the server to the browser.

Static site generators are more advanced than ever. There are lots of great options available to satisfy a wide variety of needs. Plus, for folks who need an easy way to manage content, a new market of "headless" content management systems (CMS) has emerged to perfectly complement the JAMstack approach. During the build process, the static site generator can reach out to APIs, databases, an API-based CMS, or anything else it needs to maximize the amount of pre-built markup.

## The Best of Both Worlds

You can still write code using your favorite language and platforms! Only now you focus on creating the best APIs for your application. Or, you can use your developer skills to automate the generation of static assets and deploy your application.

The more I have learned about JAMstack, the more I've realized there is incredible value in the approach.

* Simplify architecture
* Leverage the best 3rd-party APIs
* Take advantage of CDNs
* Intensely focus on delivering business value

Looking back at some of my previous projects through the lens of JAMstack, I can see how it would have solved so many problems, especially around scalability and deployment. For applications I first thought would be impossible to implement using JAMstack, I now see no better solution than the JAMstack approach.

I believe there is a bright future ahead for front-end and back-end developers alike—a future where we no longer have to write server-based web applications!

## Where to JAMstack From Here

This post only skims the surface of the advantages of JAMstack architecture. If you want to learn more, our OktaDev team has created some fantastic content!

* [Build a Secure Blog with Gatsby, React, and Netlify](/blog/2020/02/18/gatsby-react-netlify)
* [Secure and Scalable: An Introduction to JAMstack](/blog/2019/10/08/secure-and-scalable-an-introduction-to-jamstack)
* [JAMstack: Web Apps at Ludicrous Speed](https://www.youtube.com/watch?v=WkCHNh5zpm0)  (YouTube video)
* [StaticGen](https://www.staticgen.com/) - a curated collection of static site generators

For more great content, follow us on Twitter at [@OktaDev](https://twitter.com/oktadev), subscribe to our [YouTube channel](https://www.youtube.com/c/oktadev), and like our [Facebook page](https://www.facebook.com/oktadevelopers/)!
