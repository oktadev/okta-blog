---
disqus_thread_id: 7863972640
discourse_topic_id: 17212
discourse_comment_url: https://devforum.okta.com/t/17212
layout: blog_post
title: "Tech at the Edge of the World: Offline Applications"
author: heather-downing
by: advocate
description: "Can your code really run everywhere? Even offline? Thoughts from Heather Downing's journey to a tech conference held in Antarctica."
tags: [selfcontainedapps, wifi, internet, connectivity, developer, programming, offlineapps, antarctica]
tweets:
- "Should you be building self-contained application in a cloud-based world? @quorralyne explores the question."
- "Could your code run in Antarctica? Dive into offline capabilities of software with @quorralyne."
image: blog/offline-apps-antarctica/elephantisland.jpg
type: awareness
---

{% img blog/offline-apps-antarctica/antarcticaphoto.jpg alt:"Antarctic Peninsula" width:"800" %}{: .center-image }

In January of 2020, I was fortunate enough to join a 16 day voyage to Antarctica, and speak at a tech mastermind conference called [AntarctiConf](https://antarcticonf.com/). Going to see the seventh continent was one of the coolest experiences of my life, and to top it all off I was joined by other incredible like-minded tech geeks and coders! I highly recommend adding Antartica to your travel bucket list as well, it is such a life-changing place to visit.

While on this cruise, we had ample time to discuss changes in the tech industry and software development in particular. As we sailed into the great unknown waters of no WIFI zones, it made me curious about how many applications are built today that are cloud-based only. Some of the questions included:

*How would cloud-backed software behave here - or in other places - with no internet?*

*Had the engineers who built social and enterprise apps thought about intermittent data packets (or lost data packets) for the poor satellite areas?*

*Are localized desktop applications still being built?*

*Do poor data connections affect queuing and timer jobs?*

*Should we be building offline capabilities for any app?*

So many questions that I didn't really consider until having that experience. The Drake Passage isn't the only place devoid of strong internet connections. Access that is very poor or missing completely from other places in the world, including villages and small cities, is still a huge work in progress. Remote research stations aren't the only outlier here. Ever try to get a signal from inside of a steel building or underground in a basement or bunker? The more we looked into this, the more common it appeared to be that the internet was not as available as it is with my Google Fiber lightning fast wifi back home in Kansas City. Time to explore some modern pitfalls for developers in this cloud-obsessed world, and how to be more mindful going forward. Let's avoid the internet iceberg that stops your software ship!

{% img blog/offline-apps-antarctica/icebergphoto.jpg alt:"Iceberg in Antarctica" width:"500" %}{: .center-image }

## Check software use cases for intermittent connectivity

When I worked at a mobile app startup, offline capabilities were a commonly outlined use case that my development team was used to handling. Once I moved to other companies and began working on web based software and APIs, I noticed the assumption was that connectivity would obviously just be available, and if it wasn't, it was not the engineering team's problem. While it's true that without connectivity we don't get data shuttling back and forth, I'd argue that offline functionality needs to be taken into consideration. This doesn't have to be a long, drawn out ordeal. Take any use case that is given and ask the question:

**What should happen if the internet drops in the middle of this transaction or function?**

Intermittent connectivity can happen anywhere in the world, to anyone, even on cloud platform giants. Up time is never going to be 100%, and as engineers we should plan for that inevitability. This might mean using a try/catch approach, or storing an incomplete transaction in a localized database that can be retrieved at a later time by a manual or automated process.

Whatever way you wish to handle intermittent internet, just make sure you ask the question before you build and have a plan for execution.

## Plan for offline functionality for installable software

Many banking mobile apps come to mind first for not providing any real benefit if you are in airplane mode. Even if my last balance was synched with a timestamp, most won't let you pass the sign-in screen to even see it. Since external auth providers (like Okta, Google, etc) provide you with a token, you can store that locally when your device is offline until the it expires (which is easily configured within your [Okta Developer account](https://developer.okta.com/signup/)) and allow a user access to their previously authenticated and downloaded data while offline. My general opinion regarding installable applications is that for it to be worth the trouble of installation, there should be some local functionality. Otherwise, go with a web site or web hosted application and save a user the trouble and memory allocation of downloading your software. Ask yourself the question:

**Does the user need offline functionality for this project?**

If so, great! Build a mobile app or desktop app. No? Then a website is the best way to go - just make sure it looks good on a mobile device and scales to the screen.

## Test software in the field in known slow internet areas

{% img blog/offline-apps-antarctica/elephantisland.jpg alt:"Antarctic Peninsula" width:"800" %}{: .center-image }

Don't wait until you give your freshly built app to a QA tester to discover the code you wrote is too complex and heavy to handle something below 3G speeds on a mobile data network. Make sure you get out to slow  internet areas early and often. If it is web-based, use a phone and go into nature. An excellent resource for general speeds (not accurate for those spots that are dips in connectivity completely) is the [SpeedTest Global Index](https://www.speedtest.net/global-index) that is updated on a fairly regular basis. Keep in mind that the use of poor wifi routers and overcrowded mobile networks will take those optimistic speeds and grind them to a crawl, which is why many of us complain about how long it takes to even launch the [Google start page](https://www.google.com/).

## Minimize chatter with your back end system

Most times it is not really necessary to send data back and forth with your server constantly for a front end application, particularly one using a web-based tech stack. Unless you are building a chat app or an enterprise app that requires microsecond diffs in communication, you should be frugal with your server communication. Consider using a giant SYNC button on your mobile or web application, and make it clear the last time it communicated. Often that will be enough to empower the user to have visibility into where the data is at any given time, and how updated it is. Alternatively, you can offer a setting to enable constant or on-demand syncing. This approach works particularly well in mobile apps, but should be considered for desktop, intranet or even web-based sites as well. There are many Javascript libraries that can assist with storing data temporarily, so take advantage of that.

## Keep your skillset fresh by building a self-contained application

The ultimate offline app for me to build was a calculator or an alarm clock. Simple, useful, and easy to put together. However, I absolutely love to hike - particularly in the Colorado mountains, known for being devoid of any connection with the world. I found it really easy to use an offline GPS application called AllTrails that downloaded my real time walking map so I wouldn't get lost while exploring without mobile internet. It's elegantly done, and several other offline focused applications for outdoor folks have emerged because of it. Utilize some of the sensors available on a mobile device to make a really fun project. It changes what libraries you can use and requires a different approach for the user experience, which is well worth the exercise.

The space station has internet, which is awesome. More live streaming of astronauts, please! However, as we venture further and further away from the earth's atmosphere and the satellites that connect us, offline software inside of spacecraft will be a necessity. If you built a checklist application that runs on AWS or Azure, what happens when you can't reach the server? Can you do anything with it at all? With thoughtful consideration, you absolutely can. Even with browser-based applications, there can be a basic offline capability built-in from the initial page loading process - or installed on a local computer to host an intranet. The real question is - what can your app do without the internet? It's not black and white, you can plan and build for both scenarios.

## Consider progressive web application design

My coworker [Lee Brandt](https://twitter.com/leebrandt) has a terrific analogy for Progressive Web Apps (PWAs) - they are like an escalator. When you have the electricity to power it, it moves. When it doesn't work, it becomes a set of stairs. Either way, a person can still use it to travel although one way is preferrable. This concept changed the way I approached my software architecture. Many users globally have such poor speeds that a site with heavy graphics or streaming video just won't load. Facebook's answer for Android users with poor network conditions was to create a stripped down version of their social media application called [Facebook Lite](https://www.facebook.com/lite/), and the companion app Messenger Lite. I still use Messenger Lite, featured as a better alternative version of the more bloated app in [Wired](https://www.wired.com/story/ditch-facebook-messenger/). I only miss out on a ping every once in a while (it polls the server for new messages with longer, spaced out intervals). It made such a difference that [Twitter Lite](https://blog.twitter.com/en_us/topics/product/2017/introducing-twitter-lite.html) soon followed suit. For users with limited to how much total internet bandwidth they get to use in rural areas like Australia, app developers should be considerate of how much data they are requiring. I'm not saying you need to build two separate versions of your app like these social media giants did, but you can certainly make the one you have be efficient enough to handle either scenario.

## What have you built without cloud dependency

From console apps and timer jobs to wearable step counters, there are a lot of ways to build useful software that doesn't need the internet to do basic functionality. Our ever-changing world has different needs, especially as we research and explore remote parts of the world. Be mindful of how much connectivity congestion you are contributing to. We'd love to hear about the kinds of things you have built that have offline functionality in the comments below!

Lastly, I have to share the Rockhopper Penguins I visited in the Falkland Islands - who manage to be fantastically productive without any wifi. Simple communication when working together but independant functionality when raising their young. May they inspire you to be up to the challenge!

{% img blog/offline-apps-antarctica/rockhopperpenguins.jpg alt:"Rockhopper Penguins in Falkland Islands" width:"800" %}{: .center-image }

{% img blog/offline-apps-antarctica/heatherwithpenguins.jpg alt:"Heather with Rockhopper Penguins" width:"800" %}{: .center-image }

## Learn More about Software Development with Okta

If you'd like to see similar content from our blog, check out these posts:

* [The Ultimate Guide to Progressive Web Applications](blog/2017/07/20/the-ultimate-guide-to-progressive-web-applications)
* [The Dangers of Self-Signed Certificates](/blog/2019-10-23-dangers-of-self-signed-certs.md)
* [Use Okta Token Hooks to Supercharge OpenID Connect](/blog/2019/12/23/extend-oidc-okta-token-hooks)
* [Multi-Factor Authentication Sucks](/blog/2019/12/19/multi-factor-authentication-sucks)

We'd love to hear from you in the comments below or follow us on [Twitter](https://twitter.com/oktadev) and subscribe to our [YouTube Channel](https://youtube.com/c/oktadev)!
