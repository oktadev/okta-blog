---
disqus_thread_id: 8136918546
discourse_topic_id: 17269
discourse_comment_url: https://devforum.okta.com/t/17269
layout: blog_post
title: "Identity: A First Class Architectural Citizen?"
author: chris-gustafson
by: internal-contributor
communities: [security]
description: "In today's software architecture landscape, identity should be considered a first-class architectural citizen."
tags: [architecture, identity]
tweets:
- "Architecting a new software system? Make identity a first-class citizen in your architecture!"
- "When architecting software, make sure to make identity a first-class citizen!"
- "Identity is no longer an afterthought or part of something else in software systems. Make it a first-class citizen!"
image: blog/featured/okta-vue-tile-books-mouse.jpg
type: awareness
---

When I decided to transition away from being a Principal Enterprise Architect into a specialized identity engineering role, a number of my colleagues asked me why.   My answer has always been this: 
> Because, for the last five or six years, every project I've done has been an identity project—we just didn't know it when we started.

That response is usually met with a nodding head and a resigned, weary shrug.   Too often, it fails to be recognized as a cornerstone in application or system design,yet it is fundamental and pivotal to a system's success. When a project does finally discover that identity is crucial, it's usually too late to deal with properly.  Scope, budget, project planning-- none of these efforts made allowances for identity concerns. If you've ever wondered how organizations end up with fragmented identity strategies, multiple tools, duplicated user definitions, and commensurate security gaps, I'd propose it comes from this reactionary response to projects that forgot to plan for identity.

Historically, product owners, developers, and infrastructure resources have all seen identity as a byproduct of deployments at best, or a component of an application at worst. If you were to compare an application to an airplane, identity would be neither the wings nor the fuselage.  It would be the air that makes it fly.  Without a solid identity strategy and platform to empower it, your project won't get off the ground, stay safely in the air, or find its way back to the ground in one piece.

## A "First Class Architectural Citizen"

When you draw out a design, be it a simple application or a globally distributed content distribution network, you start with some pretty pronounced and ubiquitous boxes.   Databases, application servers, and web services are all the usual suspects.   Should you map an organization's technology sectors, you'd likely draw big boxes for "ERP", "CRM", "ITSM", "HRIS", and similar monumental acronyms.   These _big boxes_ represent important beachheads in a technology stack.  They are also not just technology systems.  Instead, these are usually large-scale technology partnerships with various business columns using technology to enable business workloads.  These integral, core systems have some things in common:

 - They are owned by an authoritative, cross-functional and influential arm of the organization
 - They receive a recurring annual budget to be enhanced, improved, and maintained 
 - They have dedicated resources to support them 
 - They own (source of truth) significant portions of the organization's *master data* and the business rules surrounding them
 - They receive a level of visibility, support, and attention that makes them universally recognizable across all functional columns of the organization
 
These types of systems are platforms upon which other ancillary systems, products, or applications base their designs.  It is these systems that dictate what a "customer" is, how a "product" is defined or other such fundamental precepts.   Truly, the combination of these core systems makes up the organization's "technology business engine".  Note, these are not "technology engines", but purposefully "technology _business_ engines".  These systems both power and define business functions. 

Thus, in our modern era, identity has become this first-class architectural citizen; an equivalent to the ERP, CRM, and others.  Concepts like data privacy, consent, and data residency should be enough to hammer home the point that how we deal with data about people's identities can no longer be a "feature" of a random application.  However, there are the practical realities of a centralized and elevated identity system to consider, as well.

### User Experience

Centralizing, or standardizing if you prefer, identity concerns enables your organization to improve the ways in which your employees, customers, and partners interact with you.   From the simple benefits of universal profile management to the less flashy, but incredibly important, ability to unify authentication—all these things make your user's experiences better with less friction.   This increases your ability to acquire, keep, and expand the user's relationship with your business.  A happy user, employee, partner, customer, or whomever, is a user that costs you less, makes you more and will tell friends.

### Data Consistency

The relative ease with which applications can be deployed has contributed to an ever-increasing number of them.   These applications can be spun up quickly, in some cases by third parties outside the control of local IT groups, and deployed in the wild literally in days.   If identity—specifically user and user profiles sprawls with it—then the valuable data about a user is lost in the noise.   User duplication, authorization fragmentation, and a host of other data issues are obvious.  What's maybe less obvious is the impacts on things like GDPR or, more generally, consent and data privacy.  How can you *forget* a user if you don't know all the places that user is remembered?  Furthermore, what if each instance of that user is defined differently; perhaps an email address here and a phone number there?   Simply standardizing the core *master data* definition of what a user is and controlling the basics of their profile could be enough to justify identity as a first-class architectural citizen.

### Time 

When I look at the identity sprawl in systems I've helped build or consulted upon, I always think about one thing: Time;lost re-inventing the wheel, time spent fixing bugs in one system that was duplicating logic already implemented bug-free in another, time wasted.

Reuse should not be a new concept at this point.  However, reuse has always been met with the emotional barrier of the dev or product team that was sure they could "do it better" or that did not want to be dependent upon somebody else's code.

This is why identity has to be a first-class citizen.  Think of the argument that would ensue in a sprint planning meeting if someone suggesting duplicating the sales tax calculation that already existed in the core order management system.  Hopefully, nobody would allow this duplication of effort and risk to the core business logic system.   This same sort of allergic reaction needs to exist if a team wants to implement their own user profile store.   Identity has to be seen as a core, cornerstone system, and, once that happens, no longer will time be wasted reinventing that particular wheel.

### Security

Threats, compliance concerns, innovation; all these things and more contribute to the need to be proactive and reactive in your security posture.  There is no greater risk to an application or system than its own users.  Phishing attempts, account takeovers, credential sharing—you name it, users will find a way to help cause a breach.   A central identity platform will not eliminate this risk, however, your only hope in being able to augment and adjust your security tactics is to have one place to implement your strategy.

## Final Thoughts

We have reached a precipice in enterprise design for identity.   For decades, identity was a component that "came with" something else.  Now, with the need to integrate and propagate our data and systems around the world, identity must stand as its own thing.  Identity is no longer able to be considered a part of something--it is, in fact, its **own thing**.

So, that's what I mean when I say that Identity must now be a _first class architectural citizen_.  When building out designs, be it a simple website or a massive business footprint, identity must be thought of as a foundational entity in order to reap the benefits of its incredible impacts.

## Learn More

Read more about Architectural topics: 

-   [Why Every Developer Needs to be a Generalist](/blog/2019/11/26/developer-generalist-vs-specialist)
-   [Tech at the Edge of the World: Offline Applications](/blog/2020/02/10/tech-at-the-edge-of-the-world-antarctica-offline-apps)
-   [Make It Complicated, So It Can Be Simple](/blog/2020/04/13/make-it-complicated-so-it-can-be-simple)

Want to be notified when we publish more of these? Follow us on [Twitter](https://twitter.com/oktadev), subscribe to our [YouTube channel](https://youtube.com/c/oktadev), or follow us on [LinkedIn](https://www.linkedin.com/company/oktadev) If you have a question, please leave a comment below!
