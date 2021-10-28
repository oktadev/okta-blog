---
disqus_thread_id: 7770708270
discourse_topic_id: 17187
discourse_comment_url: https://devforum.okta.com/t/17187
layout: blog_post
title: "Multi-Factor Authentication Sucks"
author: randall-degges
by: advocate
communities: [security]
description: "Multi-factor authentication is slow, annoying, and frustrating. Let's talk about ways we can fix it."
tags: [security, mfa, amfa]
tweets:
- "Does multi-factor authentication really suck? Read @rdegges' thoughts on the subject."
- "Is it time to get rid of multi-factor authentication?"
- "Multi-factor authentication has a lot of problems, let's talk about how we can fix them!"
image: blog/mfa-sucks/mfa-circle-of-life.png
type: awareness
---

{% img blog/mfa-sucks/mfa-circle-of-life.png alt:"multi-factor authentication circle of life" width:"600" %}{: .center-image }

For the last seven years or so I've been building developer tools to help make user authentication and authorization simpler and more secure. When I'm not building tools to help secure web applications, I'm often writing articles, creating videos, and educating developers on web security best practices.

I care a lot about web security.

With that said (and I almost feel guilty admitting this), I think multi-factor authentication (MFA) sucks. It's slow, annoying, frustrating, and 99% of the time: pointless.

I realize that this may be a bit of a polarizing view, so let me tell you why MFA sucks and what you can do about it.

## What is Multi-Factor Authentication?

If you aren't already familiar with it, MFA is a commonly used pattern (particularly on the web) wherein when you log into an application, you are presented with an additional factor (hence the name, multi-factor) that you need to verify before you can gain access to the application.

{% img blog/mfa-sucks/mfa-example.png alt:"multi-factor authentication example" width:"500" %}{: .center-image }

For example, when I log into my Twitter account by supplying an email address and password, they'll send an SMS message to my cell phone with a code in it. I then need to open my cell phone, look at my SMS messages, find the code, and type it into the Twitter website to finish logging in.

By proving to Twitter that I am in control of the SMS factor (my cell phone), they can be more confident that I am actually Randall and not just some impostor who correctly guessed Randall's password.

I'm sure you've experienced something similar to this.

If you're using a particularly well-engineered site, you'll often have the option of enrolling multiple factors with your account. This way, you can choose what type of factors you want to use when logging in.

{% img blog/mfa-sucks/mfa-verification-screen.png alt:"multi-factor authentication screen" width:"500" %}{: .center-image }

For example, with my Google account, I have a [YubiKey device](https://www.yubico.com/) registered as a factor, my cell phone (SMS), and the Google Authenticator app. When I log into Google using my email and password, I can pick which one of these factors I'd like to verify. This is convenient because if I lose my YubiKey device I can just verify myself via SMS or the Google Authenticator app.

## Why is Multi-Factor Authentication So Popular?

While I don't have any statistics to back this up, it seems as if over the last several years people have really started caring about web security. Ever since the [Snowden leaks](https://www.businessinsider.com/snowden-leaks-timeline-2016-9) in 2013, it feels like the government, corporations, and individuals have all become far more concerned about cybersecurity issues.

It isn't uncommon to read about data breaches, compromised services, and privacy issues in the mainstream media. Because of this relatively new focus on cybersecurity, the industry has, for the most part, responded by vastly improving their web security postures. For example, many websites now require users to create complex passwords, use MFA, etc.

This increased focus on cybersecurity has made MFA, which is one of the most effective tools in preventing account compromise, commonplace.

Another big reason MFA has become so popular in recent years is cost-related: companies that require their users to use MFA reduce their risk of a data breach, thereby preventing lost revenues. And that savings can be a lot. In 2018, IBM [released a report](https://www.ibm.com/downloads/cas/861MNWN2) saying that the average data breach costs a company **$3.86 million** dollars. Yikes.

Because data breaches can be expensive, it's in a company's best interest to keep their user accounts secure. And what's a simple way to help secure user accounts? MFA.

## Why Do Security Professionals Love Multi-Factor Authentication So Much?

{% img blog/mfa-sucks/i-love-mfa.png alt:"i love multi-factor authentication" width:"500" %}{: .center-image }

The reason the security industry loves MFA so much is that it makes their job easier.

In 2018, Verizon released [a report](https://enterprise.verizon.com/resources/reports/DBIR_2018_Report.pdf) which states that 22% of all data breaches involve stolen user credentials. If these websites had been using MFA, even *if* an attacker was able to steal a user's credentials, they still wouldn't be able to get into a user's account (without also compromising one of their additional factors).

Since stolen credentials account for such a large amount of data breaches, it makes sense that a simple, catch-all way to prevent stolen credentials from being such a problem is to start forcing your users to all use MFA.

## Why I Hate Multi-Factor Authentication So Much

{% img blog/mfa-sucks/mfa-again.png alt:"multi-factor authentication again?" width:"500" %}{: .center-image }

While MFA Is great at ensuring user accounts won't be compromised if account credentials are stolen or guessed, the main reason I hate MFA is that it provides a slow, annoying, frustrating, and mostly pointless experience.

### Multi-Factor Authentication is Slow

{% img blog/mfa-sucks/slow-turtle.gif alt:"slow turtle" width:"500" %}{: .center-image }

MFA is slow. Really slow.

It's not uncommon to wait to receive an MFA token by SMS or email for multiple minutes on end. I can't overstate how insanely unacceptable this is.

When you're a user who's busy trying to get things done and have to wait for an indeterminate amount of time to receive an MFA token, every second counts. The longer it takes for your users to log into an application, the more annoyed they become.

I've timed how long it takes me to access my bank account. In my case, when I use email as a factor, the fastest I've been able to access my account is 72 seconds. That's over a full minute of wasted time! Similarly, the quickest I'm able to log into my bank account using SMS as a factor is 67 seconds. A slight improvement.

Even when I try to access services that use faster factors (such as push-based mobile apps), the quickest I'm able to access my account is 57 seconds -- and that's while being connected to a high-speed, gigabit internet connection.

A majority of the time, logging into applications that use MFA completely disrupts my workflow. It forces me to context-shift what I'm thinking about and ends up requiring me to refocus on whatever task I was working on before needing to log in. The slowness involved in MFA is substantial.

### Multi-Factor Authentication is Annoying

{% img blog/mfa-sucks/annoyed-rage-face.png alt:"annoyed rage face" width:"500" %}{: .center-image }

Throughout a typical day, I log into dozens of websites and applications, many of which require me to use MFA.

Take my bank account, for example. There's rarely a day that goes by where I don't need to log into my bank account to do *something*. Maybe I need to check an account balance before making a purchase, double-check account numbers for a money transfer, or review my account history to see if I received some payment I was supposed to receive.

Every time I visit my bank's website, I have to:

- Navigate from the home page to the login page
- Select "banking" from the dropdown (because apparently, my bank uses separate systems for banking, credit cards, and loans)
- Enter in my username and password
- Select which factor I'd like to use to sign in. In my case, I can only choose between receiving an SMS message or an email (my bank doesn't support any other factors).
- Choose my factor and wait for the message to come in. This often means waiting for a minute or two for the email or SMS message to come in.
- Type the code I get from the message into the website to prove I am who I say I am

Once I've done all of that, I'll finally be able to get into my bank account. And while that process is a little bit annoying, what's far more annoying is the frequency with which I have to do it.

If I only had to perform that MFA step once, it wouldn't be such a big deal. But because I'm logged out of my bank account after only *five* minutes of inactivity, that 60-second login process becomes a nightmare.

If I switch tabs for even a few short minutes to compose an email then I've got to start the process all over again.

This is what makes MFA so annoying to so many users. It's an inconvenience that requires your users to take time out of *their* day (and often interrupts whatever it is they're doing) to satisfy *your* security requirements. And because most MFA implementations aren't *smart* (more on this later), users are constantly being put through MFA verifications hoops all day long across all the services they use.

### Multi-Factor Authentication is Frustrating

{% img blog/mfa-sucks/frustrating-mfa-seagulls.gif alt:"frustrating multi-factor authentication seagulls" width:"500" %}{: .center-image }

MFA is annoying because it requires me to do the same thing over and over again between all the services I use. Why can't I just prove who I am once?!

But *frustration* is another thing entirely. For something to be frustrating, it really has to make your blood boil. Frustration is far worse than annoyance (in my humble opinion).

With that said, the reason I find MFA frustrating (in addition to being annoying) is because of how unforgiving it is. Let me explain.

When viewed through a security-focused lens, MFA seems like the perfect solution to the authentication problem. "If we simply force our users to verify that they have a second factor of verification every time they log in, we'll dramatically reduce the risk of account compromise! All the user needs to do is open their phone, click the SMS message, and type the code into our website! Anyone can do that in just a few seconds!"

Unfortunately, in the real world, things rarely go so smoothe.

The frustrating part of MFA is that between each step of the MFA process, there's a fairly high probability that something will go wrong. Here is just a small list of ways in which MFA failures can occur, frustrating users.

**MFA tokens might be delayed.** If the user requests an MFA token via SMS, for example, that SMS might be delayed. Maybe the user is out of range of a cell tower, maybe they're on a flight (this just happened to me yesterday), or maybe there's simply a problem with one of the mobile carriers. Either way, this can be a frustrating experience for a user who is trying to log into an application and do something.

**MFA tokens might expire.** There's a general best-practice for MFA which states that when you generate one-time use MFA tokens and send them to users, those tokens should expire within a relatively short amount of time. This is why, when I log into my bank website and receive a token via email, the email says "This code will expire in 5 minutes." While this expiration makes sense from a security perspective (you certainly wouldn't want an attacker to be able to use an old token to log into someone's account), it can cause issues in common, everyday use cases.

For example, if I attempt to log into a website and am sent an MFA token by email, I'll often change tabs and do something for a minute or two while I wait for the MFA email to hit my inbox. If I'm distracted for slightly too long then by the time I get the email, copy the MFA token, and finally enter it into the website the token may have already expired, leading me to start the process all over again (and shout curses at MFA under my breath).

**MFA factors may not be easily accessible.** This one happens to me all the time. For example, my cell phone is dead and is charging in the other room. I then attempt to log into a website and am prompted for MFA verification. The only problem? All of the available factors require me to have my cell phone ready and working: SMS, Google Authenticator, etc.

In these scenarios, it's incredibly frustrating because I have to get up, go find my phone, turn it on, then find whatever code I need all before the token expires. Ugh. And this is an ideal scenario. What happens if a user has had their phone stolen? Or if they're on the road and don't have a way to charge their dead device?

I don't think it would be a stretch for me to say that MFA is frustrating and causes lots of poor user experiences.

### Multi-Factor Authentication is Often Times Pointless

{% img blog/mfa-sucks/curious-rage-face.png alt:"curious rage face" width:"300" %}{: .center-image }

Despite MFA's flaws, there's no question that it improves the overall "security" of applications. By forcing users to use an additional factor to verify themselves, you (as the application owner) are able to mitigate a certain amount of risk without a lot of hassle (for you, anyway).

But, let's talk for a minute about how pointless MFA is in many scenarios.

#### MFA Won't Help If Your Factors Are Breached

While MFA certainly decreases the likelihood that your account will be compromised by an attacker, it won't help you at all if the attacker has access to your other factors.

For example, if you use SMS as a second factor for your Gmail account but a thief steals your phone, all the MFA in the world isn't going to help you because the thief will be able to verify that factor.

As a matter of fact, SMS, in particular, is an incredibly [weak factor](https://gizmodo.com/psa-sms-2fa-is-weak-af-1834681656). Even if a thief doesn't steal your phone, the odds are fairly decent that an attacker will be able to hijack your number and get access to your MFA tokens.

In addition to that, SailPoint published [survey results](https://www.sailpoint.com/blog/2018-market-pulse-survey-key-findings/) recently which show that 75% of users are reusing their passwords for multiple accounts. This means that if an attacker gets hold of your username and password for a service and you're using that same password on another service then an attacker will also likely be able to log in as you there. So unless you're using MFA for all your important services (especially those that protect your factors), attackers may be able to breach you regardless of whether or not you have MFA on any one particular service.

#### MFA Won't Help If Your Password Isn't Breached

If you're using MFA to protect account credentials, then MFA is really only useful in the event that your password is breached. If your password hasn't been discovered by a third-party, MFA exists solely to annoy you.

According to that Verizon report cited above, only 22% of data breaches result from stolen credentials. In the other 78% of breach scenarios, even if users had MFA active, it wouldn't have mitigated the breach since no stolen credentials were involved.

#### Even When MFA Protects You, It's Still a Breach

There's a misconception floating around that if you force your users to use MFA, you'll prevent breaches. This is not true.

Let's say an attacker steals all of your user's credentials. When that attacker then tries to log into user accounts, they won't be able to access the account of any users who have MFA enabled. This part is true.

However... If attackers were able to get a hold of any of your user's passwords, you've still been breached. This means you'll still need to responsibly disclose the breach to your users, and those users will still be at risk: if they reused those passwords for any other applications, there's still a good chance that they'll be breached.

Investing lots of time and effort into ensuring that you don't leak any user credentials should always be priority number one. MFA isn't a catch-all solution to preventing data breaches.

#### MFA Won't Help You In Any Number of Other Circumstances

Because MFA is often thought of as the strongest line of defense in many user-facing applications, it has a positive reputation for preventing data breaches.

However, as I mentioned above, data breaches occur because of many different security issues, not just stolen user credentials.

- If there are security vulnerabilities in the applications your website/app relies on, that could lead to breaches.
- If an attacker is able to steal an API token or sensitive infrastructure credential, that could lead to breaches.
- If your ops team accidentally publishes a database backup on a public S3 bucket, that could lead to data breaches.

Overall, there are a million things that can go wrong for which all the MFA in the world won't help.

And while MFA is a great tool, it only helps you improve one very specific area of your overall web security posture.

## How to Fix Multi-Factor Authentication

{% img blog/mfa-sucks/fix-mfa-superhero.png alt:"fix multi-factor authentication superhero" width:"500" %}{: .center-image }

It's insane to me that while we've come so far in terms of web security, we've also regressed so much. The days of quickly logging into applications with a simple username and password are gone, but what have we replaced it with? We've traded convenience and speed for security, and I'm not certain we're much better off for it.

Luckily, however, there's a foolproof way to get the benefits of MFA without needing to annoy and frustrate your users.

Say hello to **aMFA**.

### What is Adaptive Multi-Factor Authentication?

Adaptive multi-factor authentication or aMFA is essentially a "smarter" version of MFA that only prompts users for factor verification if something suspicious happens. It gets you all the benefits of MFA without most of the annoyance.

The idea of aMFA is built on top of the concept of machine learning: using software to detect abnormalities in patterns.

For example, let's say that you get to work in the morning in San Francisco and log into your Gmail account. When you do that first login, you'll be prompted to verify yourself via a second factor.

The next day, you go back to work and log into Gmail again. This time, however, you aren't prompted to verify a second factor to get into your account: you're able to just log in directly. Woo!

A few hours later, however, you board a flight and fly to Russia. When you land in Russia and try to log into Gmail, you'll be prompted again to verify an additional factor. This is because Gmail has detected an anomaly in your login pattern. While you usually log into Gmail from your laptop computer in San Francisco, you're now logging in from your laptop in Russia.

Because this behavior is different than normal, Google is going to prompt you to verify an additional factor to prove it's actually you.

### How Adaptive Multi-Factor Authentication Works

There are lots of different ways to implement aMFA and lots of providers (including [us](/)) that provide solutions to help make using and deploying aMFA easier. At the root of all aMFA solutions, however, is pattern recognition and abnormality detection. 

The way aMFA solutions are built is as follows:

1. When authentication occurs, collect lots of variables: the user-agent of the browser/device being used during authentication, the IP address of the client, the geolocation of the client, the language being used on the client, the types of encoding being used on the client, etc.
2. Detect changes in these variables: did the location of the client change in a significant way? If the user has only previously logged in from the USA but is now logging in from a different country: that should trigger an abnormality event.
3. Assign a risk score to authentication requests based on abnormalities. For example, if a user just logged in and verified a second factor 5 minutes ago and no abnormalities have been detected, this authentication request isn't very risky. If there is a change in geolocation, however, maybe the request is more risky.
4. Based on your risk tolerance, decide during authentication whether or not you need to force factor verification on the user or not.

By relying on a risk score that's determined by analyzing many factors in the authentication request, you can allow users to authenticate without using MFA when there is very little risk and only force users to go through the MFA process when something suspicious happens.

## The Solution to the Multi-Factor Authentication Problem

{% img blog/mfa-sucks/use-amfa-for-all-the-things.png alt:"use adaptive multi-factor authentication for all the things!" width:"500" %}{: .center-image }

The solution to the problem with MFA is simple: use aMFA instead.

aMFA really gives you the best of both worlds: you get all the security benefits of MFA but don't have to annoy users with MFA prompts every time they log into your service. It's a win for you and your users.

It's almost 2020, let's make the next decade both secure and user-friendly. Leave MFA in the 2010s and move on.

If you enjoyed this post, you might want to [follow us](https://twitter.com/oktadev) on Twitter, check out some of your [YouTube videos](https://www.youtube.com/c/oktadev), or even check out some of our other fun posts:

- [Semantic Versioning Sucks! Long Live Semantic Versioning!](/blog/2019/12/16/semantic-versioning)
- [OAuth 2.1: How Many RFCs Does it Take to Change a Lightbulb?](/blog/2019/12/13/oauth-2-1-how-many-rfcs)
- [What's New for Node.js in 2020?](/blog/2019/12/04/whats-new-nodejs-2020)
- [The Dangers of Self-Signed Certificates](/blog/2019/10/23/dangers-of-self-signed-certs)
- Anything from the [Okta Security Site](https://sec.okta.com/)
