---
disqus_thread_id: 7695578273
discourse_topic_id: 17161
discourse_comment_url: https://devforum.okta.com/t/17161
layout: blog_post
title: "Okta Developer Office Hours Q&A - September 2019 Edition"
author: matt-raible
by: advocate
description: "We held developer office hours recently and answered a lot of questions!"
tags: [okta, developer, office-hours]
tweets:
- "Did you miss our developer office hours in September? Good news: we recorded it!"
- "We answered quite a few developer questions in our September 2019 office hours. This blog post answers the ones we couldn't answer in real-time."
- "This blog post recaps our @oktadev office hours in September 2019. Thanks to all who attended!"
image: blog/okta-developer-office-hours/okta-dev-office-hours.jpg
type: awareness
---

On September 19, 2019, we held our first Okta Developer office hours. Our goal was to host a live Q&A with developers that use Okta. Over 150 developers attended!

We [streamed the session live on YouTube](https://youtu.be/nGi8x5XppHI), so you can watch it below if you like.

<div style="text-align: center; margin-bottom: 1.25rem">
<iframe width="700" height="394" style="max-width: 100%" src="https://www.youtube.com/embed/nGi8x5XppHI" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</div>

We received around 60 questions during our live-stream and did not get a chance to answer them all. After close examination, we determined that many questions overlapped and ended up with 40 unique questions.

Since we couldn't answer all the questions in real-time, we decided to write up a transcript of the questions we _were_ able to answer and add short responses to the ones we didn't get to. Keep in mind that our responses here are succinct; please reach out to developers@okta.com if you need more in-depth information on how to use Okta.

* [**Randall Degges**](https://twitter.com/rdegges): a happy programmer that likes to hack stuff.
* [**Brian Demers**](https://twitter.com/briandemers): Father, Geek, Podcast co-host @CodeMonkeyTalks, and Developer Advocate at https://developer.okta.com.
* [**Heather Downing**](https://twitter.com/quorralyne): Software dev & international speaker. Developer Advocate @Okta
 🥑. Microsoft MVP. Keen on .Net, API, voice & IoT development. Co-host of The Hello World Show.
* [**Matt Raible**](https://twitter.com/mraible): Java Champion and Open Source Developer @oktadev with a passion for skiing, mtn biking, VWs, & good 🍺. Driving a '66 21-window & a '90 Syncro. Made in Montana.

Without further ado, here's the list of questions and answers. If we answered it during the session, I added a link to the location in the video.

## Okta Developer Q&A

Q: I'm thinking about migrating my users from my custom application to Okta. What do I need to know? [Watch Q&A on YouTube](https://youtu.be/nGi8x5XppHI?t=225).

> **Randall:** Matt you are unmuted, so you are going to get the honor of doing this one.
> 
> **Matt:** I think there's a few different techniques. I haven't actually done it myself so I'm not quite sure. I think one of the easiest ones is a CSV import. If you can export your users to a CSV file, then you can import them that way. As far as handling existing passwords and keeping those intact, I believe it's all about whether your current mechanism machines up with the encryption mechanisms we support.
> 
> **Randall:** I will chime in a bit because I have worked on this. There's a couple of different options for migrating users in general. To elaborate on top of what Matt said, you can perform what we like to call a bulk migration. I'll share my screen to make this a little easier to follow. If you search for "okta user API", you can find our [user API docs](https://developer.okta.com/docs/reference/api/users/). 
> 
> Essentially, what you can do is literally send us a post request to our API endpoint and create a user. Now, if you have a bunch of users in your database, you need to fire off a bunch of API calls to make this happen. So let's say you have an application with 100,000 users in there. You could just write a simple loop, go through and just literally query the users out of your database, grab all the data, and create them in Okta. The problem you're probably going to run into is you don't have the user's plain text password, right? So you couldn't just create a user fresh in Okta without a password because they would need to reset their password. 
>
> What you can do is create a user and import their password hash from your existing database. The way this works is we have a format [here](https://developer.okta.com/docs/reference/api/users/#create-user-with-imported-hashed-password) whereas part of the JSON data you can specify what algorithm type you're currently using to hash the user's password. So like bcrypt. The bcrypt algorithm, for example, has a work factor parameter you can specify that as well. You can also put a salt and the actual hash value. 
> 
> What happens in this scenario is you create the user using this endpoint, you specify all the user's data (first name, last name, email, etc) and then specify the password hash. We'll take that in and then based on the password hash data you give us, the next time the user authenticates, if they authenticate to Okta, we will use the current hashing mechanism that we have stored in the database and then if we're using a stronger hashing format on the backend, then we'll just go ahead and upgrade that behind the scenes the next time the user logs in. It's a really nice way to make that happen seamlessly.
>
> The downside to that approach is that if you do this, you need to have some downtime on your application. If you have a live website where people are always registering and logging in and changing their information, then you basically want to shut your website down temporarily or not allow any new users to register or change user data. Then, loop through your database, create all your users in Okta, then move over to start using Okta. Then, turn your website back alive. That way, you're not losing any data and you're not having to deal with complicated changeset or anything like that. That's the bulk migration strategy.
> 
> I want to plug one other thing here from a really awesome Okta employee, Gabriel Sroka. There's a really great tool that Gabriel wrote. It's called [Rockstar](https://gabrielsroka.github.io/rockstar/), so if you haven't heard of it, you can just search for "Okta Rockstar". It's free on GitHub. It's basically a Chrome extension you can install. I've been using it recently and it's pretty neat. What happens is you install a Chrome extension and it allows you in the Okta website UI to go in and export a bunch of data to CSV files. 
> 
> If you want to play around with bulk exporting all of your users and things like that, I would strongly recommend using this because you don't need to write any code to do it. It's super simple. It'll handle those API requests for you and just have your browser download a big CSV file with all your user data in there. It's pretty useful if you want to play around with bulk migration and things like that. 
> 
> If you're not able to shut your website down or freeze user registration, the other mechanism you have is a real-time user migration. Basically, that involves building a shim in your codebase. The way you can think of this is let's say you have this live website and it's got millions of active users. You can't afford any downtime. What you do is basically modify your authentication flow. Imagine that a current user is going to log in to your website. They send you their email and password in plain text. When your website receives the email and password in plain text, what you're gonna do is first make an API request to Okta to see if the user exists with the email address. Yes or no? If the answer is yes, then you know the user has already been migrated to Okta. So then what you do is attempt to authenticate the user into Okta and you should have no problem. If the user doesn't exist in Okta, then you know the user must exist in your current database, or not at all. In that scenario, you query your current database to pull out all the user info and make sure it matches. Then you make sure the password the user gave is the correct password for the current database. If all that's good, then you go ahead and run that post request to Okta to create the user account inside of Okta and you migrate them in real-time to the Okta platform. Then you authenticate them against Okta and keep moving on. Every time a user on your site logs in, they'll be seamlessly migrated behind the scenes over to Okta without any issues. One more thing I'll share real quick. I wrote an article on this at the beginning of this year: [User Migration: The Definitive Guide](/blog/2019/02/15/user-migration-the-definitive-guide). It goes into this in a bunch of depth and covers a lot of gotchas and things you should worry about or look for if you're going to be migrating to Okta or anywhere else. Definitely check this out.

Q: When we started adopting Okta, I originally thought we'd go with SAML, since I understood that to be the "standard", and I also understood that proper authentication was a missing part of OAuth. However, with OpenID Connect (OIDC) that problem seems to have largely been addressed. Should I ever consider SAML if OIDC exists? [Watch Q&A on YouTube](https://youtu.be/nGi8x5XppHI?t=690).

> **Brian:** No. (Laughs) It's a little more complicated than that. I would say anything you can use OIDC for, you should. That's the newer standard, that's where people are going. The support is a bit more flexible depending on the types of applications you're working on. But if you have legacy systems that only speak SAML, and that's what you need to deal with, then Okta does support SAML. If you can, try to use OIDC first. Use SAML as a last resort.
> 
> **Randall:** I'm also gonna elaborate just slightly because this is a question we hear a lot. There's one other reason why you should never use SAML unless you can absolutely not avoid it. SAML, in particular, has a lot of problems because it's based around XML. For those that don't do a lot of work with XML, it's one of the protocols that's caused a tremendous amount of security issues in software because of the way it works and the way the specifications work. There's a specification called [XML D Sig](https://www.w3.org/TR/xmldsig-core1/) which is what you use for generating digital signatures in XML.
> 
> We wrote an article about this last year. There are SAML vulnerabilities that basically allow you to gain root access all over the place. In like every SAML library ever, there's issues with this stuff. If you want to learn more about this, see [A Breakdown of the New SAML Authentication Bypass Vulnerability](/blog/2018/02/27/a-breakdown-of-the-new-saml-authentication-bypass-vulnerability). Just to point out, we are not vulnerable to this, just in case you're wondering. So yeah, don't use SAML unless you cannot avoid it.

Q: I am trying to integrate Jumio Identity Verification with Okta. Jumio takes a picture of your ID with a selfie and verifies that they are valid. Should I try to make it another MFA option as part of a server? Sort of write a plugin? Can you point me to the documentation on how to get started? [Watch Q&A on YouTube](https://youtu.be/nGi8x5XppHI?t=848).

> **Brian:** I was actually talking to someone recently about something very similar. I don't know if it was Jumio, but it was another one of these types of services. The particular service I was dealing with... the guy had his phone and there was some app you used to take a picture, so there was a photo, timestamp, geolocation, and other things that played into this factor. The problem integrating it as an MFA component is trusting applications. 
> 
> In the OIDC sense, or when you log in with Okta, you would want Okta to handle that factor. Once you step outside of that, it isn't your traditional multi-factor since you're dealing with a custom application. There are ways around this. You could write a whole bunch of code. Some of these services expose themselves as an OAuth IdP. So you could have Okta talk to that service. you'd basically go through a couple of extra redirects. That's what I'd recommend looking for. That way you don't have to touch any code and there's less code to write. It establishes trust between the parties and you don't have to worry about it. If Jumio exposes themselves as an OAuth IdP, try to go that route and see what you can do.

Q: What are the options and the best way to secure your public APIs that are being called by client's websites from a web browser? [Watch Q&A on YouTube](https://youtu.be/nGi8x5XppHI?t=1038).

> **Matt:** One of the ways that we typically recommend people do it right now is that they have some sort of authentication mechanism in their front-end browser application. Whether that's Angular, React, or Vue, we have SDKs for all those. Once you've authenticated, you'll get an access token and then you can use that access token to talk to your APIs. Your APIs will have a similar configuration that says it has to come from this issuer and have this audience, and then you know it's a valid authentication token. 

Q: We use Azure Active Directory, but create our own enterprise applications. We like to use Azure AD for SSO authentication. Does Okta have a product that can help me with this? [Watch Q&A on YouTube](https://youtu.be/nGi8x5XppHI?t=1114).

> **Heather:** The answer is yes, but no. Technically speaking, Okta is what Azure AD is, but more. We have authentication built on top of it and that scales a lot more. Where your users live is important. If they live in Azure AD, you would need to move your users from Azure AD into Okta in order to use our authentication mechanism.
> 
> Yes, there is a way to have that be a continuous thing and work in tandem. For example, we have really easy widgets that you don't have to host yourself. Normally, you would have to. For Single Sign-On, that's one of Okta's strengths. It's really one or the other, but yes, technically you could use them both in tandem, but you're going to have to move your users over.

Q: We are currently using Okta for OAuth/OIDC access for our customers through a mobile app. We are now building internal tools that will require OAuth access for internal team members. Is it a good practice to mix external customers and internal team members in the same Okta account or should different Okta accounts be used and configured for their specific use cases? [Watch Q&A on YouTube](https://youtu.be/nGi8x5XppHI?t=1205).

> **Randall:** This is up for debate honestly. There's no rule around this. I'll share my two cents. My two cents is that if you're building things internally, it's a little bit easier to just have a separate Okta account right now. The main reason why is that if you're going to have internal people also be external users, you would basically -- in Okta right now, the multi-tenancy story is a little bit confusing. You essentially need multiple Okta orgs that are linked together and can do all of these things to have your concept of "tenants" there and so if there's a risk that any internal employee will also be an external employee, it's a little bit easier for you logistically to just have a separate Okta account. 
> 
> But, if that's not something you care about or if you're implementing multi-tenancy in a sort of a GitHub-style way (I'm assuming most of you on the call are familiar with GitHub). The way stuff works there, when I sign in to GitHub with my personal account, I have the Randall Degges GitHub account. In my GitHub account, I'm a member of multiple organizations. I'm a member of the Okta organization because I work here and contribute code. I'm a member of other business organizations for other projects and stuff that I work on. Even though I only have one account, I can switch between the organizations I'm in. 
> 
> That model of multi-tenancy -- while not actually "multi-tenant" -- works really well inside of Okta. If you're trying to set something up like that for your internal tools and users and things like that, I would just say stick with the same Okta org. It'll be simple.
> 
> **Brian:** Like Randall said, it really depends on the application and how you really want to store your users. On the application side, you can definitely deal with a lot of this with access control, either using scopes or using a different authorization server or audience or some other mechanism that will help you partition your users. 

Q: Any possibility of switching the default security questions within Okta in the future? We have received feedback that our end users aren't too happy with their choices. [Watch on YouTube](https://youtu.be/nGi8x5XppHI?t=1393).

> **Randall:** The answer to that is just... yes. It's something that is already in progress. Yes, absolutely. 
> 
> **Heather:** I was chatting in the engineering DevEx Slack today and I was asking them about that. They said that security questions are not a best practice as an option for people to use to verify. However, it's an option that a lot of customers still want to that's why we support it. I would encourage you to look for other ways to do verification and password reset.

Q: How should I secure an API that an end-user device needs to access in an automated way (programmatically), with no human involved who can actually authenticate to get an access token. Think of IoT devices. [Watch on YouTube](https://youtu.be/nGi8x5XppHI?t=1458).

> **Heather:** That is a big question, right? I've run into this a little bit because I worked on an Alexa skill for this very reason where if there isn't really truly a front-end to it, it is considered an IoT device like my little Echo Dot or Google Home. What I discovered is that, for that particular thing, we actually went with our web flow because there's an initial authentication that should happen for a user. 
> 
> So whether you create a login screen that somebody goes and does initially on their phone or just like a registration kind of situation, that's usually what's done for smart home devices. It's only done once and you do it inside the Okta portal. I can show you how to do it in a little bit. Not only do you select that you want an access token, you also need a refresh token because access tokens are only gonna work the first time. After that, it's not going to work. It's really important that you do both for IoT, and most IoT devices.
> 
> Right now I'm in the middle of authenticating drones. Sounds a little weird, but there is an API for Parrot drones that I'm trying to secure. Right now, technically, as long as you have the model number of a drone you just see sitting around... technically you could take it over in mid-flight. So I'm trying to be like, how do we secure that from happening? You know, this army of drones going around everywhere.
> 
> The way that I'm doing that is there's an initial registration that you go through. Once you go through that and set up your access token, you can perpetually refresh it and you can also reject it if you see that a drone was stolen. You can reject it directly in our Okta portal. That's the way I would go about that.

> **Randall:** One other thing I'll just add. If you want to handle IoT authentication and you don't want to use web flow like we're doing here, there's another nice way to do it. You're not going to get the same benefits and it's not as easy to maintain in the long term, but another option is to use certificate-based authentication. So if you generate a public/private key pair on your IoT device, and in a fully automatic way, and use asymmetric encryption to basically authentication with the API service in the backend with a known list of pre-configured certificates. You can absolutely do that by self-signing your own certificates. It works really, really well, but you lose a lot of flexibility and stuff by doing that, so that's another option to look into.
> 
> One thing I'll also add to that: if you do wanna do certificate-based authentication, there are two cryptography libraries you should be using for asymmetric crypto. The first is called Libsodium, and specifically, you want to use the Box API. So if you google "libsodium box api" + Python or Java, you will find the right developer library to do this for you. That library will allow you to run a method that generates the key pairs for you to handle authentication and all the other madness for you.
> 
> There's also NACL, which stands for the Networking And Cryptography Library. Both are really popular, well-known frameworks that cryptographers build and audit really well to handle this sort of stuff. If you're not using these, you're doing it the wrong way. Definitely use them if you're going to do it this way.

Q: What is the best practice to deal with security for services (APIs) running inside a Kubernetes cluster? Ingress controller running an API gateway (e.g. Kong)? Can Okta be used? [Watch on YouTube](https://youtu.be/nGi8x5XppHI?t=1806).

> **Brian:** We have a [Kong post](/blog/2017/12/04/use-kong-gateway-to-centralize-authentication) that Micah wrote, another team member of ours. I haven't looked at it in a while but I know there's a Kong-specific post. In general, I would definitely recommend an API gateway for this type of scenario. 
> 
> **Randall:** Yeah, for the Kong stuff I believe -- I haven't used Kong in a few years so I don't know what the latest is -- but I believe there's a really nice OAuth plugin for Kong. And because Okta is a generic OAuth provider, meaning you can use us an OAuth authorization server, you can just basically have your requests come into Kong, perform authorization to Okta's OAuth authorization server, to validate the request and then let it continue going through the typical workflow. So that's how you can do it with Kong.
> 
> Inside of Kubernetes, there's also this thing called Istio, which I'm assuming you've heard about since you're asking this question. Istio is a nice way to handle the authentication concerns there. Istio, as far as I understand, essentially [uses OpenID Connect and OAuth](https://istio.io/docs/concepts/security/#origin-authentication). So you can also use Okta's generic OAuth and OpenID Connect support as well. We're planning to do more articles and presentations and stuff like that around some of these DevOps-y sorts of topics in the future, so be on the lookout for those. If you haven't checked out our blog, you should definitely do it: developer.okta.com/blog. 

Q: What's the difference between using Jose/JWT token-based authentication vs Okta identity management (OAuth + OIDC)? [Watch on YouTube](https://youtu.be/nGi8x5XppHI?t=1930).

> **Brian:** Those are just terms within the JWT spec about how the algorithms work. When you get down to it, access tokens -- per the OAuth spec -- are opaque so it can by any string. Okta uses JWTs (for access tokens) so that's why we talk about JWTs a lot. 
> 
> There are two ways of handling this. You can validate the JWT. We typically say this is client-side validation where you're just saying this string you have me is signed, it looks good, it has the right information in it, and I'm gonna trust it. That's quick. 
>
> It's much faster than going the opaque route which is you send the opaque to Okta -- or whatever your IdP is -- they validate it, they respond and say it's OK. Treating it as a JWT saves you a round trip. The downside to that is if someone revokes that token then you wouldn't know that the token has been revoked. It really depends on what you're doing and if that's OK or not.
> 
> Typically, we recommend just setting the window of access tokens small in these cases so you could do a client-side validation and only have a small window where that token could be potentially revoked. 
> 
> **Randall:** I'm just gonna chime in with one additional thing. It's slightly related to this. A while back, I stumbled upon [this Stack Overflow question](https://stackoverflow.com/questions/34784644/what-is-the-difference-between-oauth-based-and-token-based-authentication). It's sort of an old one, but it wasn't answered. It basically says, what's the difference between OAuth and token-based authentication? I thought this was a really good question because there are a lot of differences between the two even though they're both accomplishing the same thing. So I wrote up this answer [here](https://stackoverflow.com/a/34930402/65681) which goes into a lot of depth about it. So if you want to understand more about this, come check it out.

Q: What if both access tokens and refresh tokens expire (e.g., connectivity issues)? What do you do? [Watch on YouTube](https://youtu.be/nGi8x5XppHI?t=2086).

> **Heather:** You're going to get a 401 from that so you have to decide what you -- I'm assuming this is related to that IoT device, correct? You have to decide what behavior it's going to have based on that response you're gonna get. So, for example, if you have a Roomba -- not a good example -- but if you have some sort of IoT device that has an LED system you could switch it to red or you could have the drones fly home and have a blinking light indicator. You can decide what that kind of behavior -- that's obviously nonverbal with the exception of Alexa or Google. What should you do about this? The user has to re-authenticate. If you get a 401, you gotta re-auth. That's what you gotta do there. It's up to you as to what behavior the IoT devices are gonna do indicate that.
> 
> **Randall:** OK, great. And then Walter -- I'm just finishing off his question -- he has another question for me. He's saying "OK, that's the approach I'm taking." when I talked about the certificate-based authentication for the IoT devices. "There's a new standard coming out named mTLS, an extension of OAuth to use client certificates."
> 
> Yep, that's right. I didn't mention that before because I wasn't sure you were going to be familiar with that, but yeah. If anyone's curious about that, feel free to google it and check it out. Also, the next time we do one of these, I'll try to make sure [Aaron](https://twitter.com/aaronpk) is able to make the call because he's actively working on these OAuth extensions. 

Q: How can I use Okta to develop my own identity providing service that is integrated with blockchain to deploy my own media platform and authenticate users that will be distributing media content on the platform. We are developing the platform for iOS. This platform would also include streaming. [Watch on YouTube](https://youtu.be/nGi8x5XppHI?t=2214).

> **Randall:** It sounds like you're building your own video distribution platform, similar to YouTube or something. And you really want to use blockchain to deploy not only the user authentication component but also the video itself? 
>
> I guess I'll answer this because I have some familiarity with blockchain and stuff like that. In general, you probably don't need to do it that way. Let me take a step back. If your goal is to authenticate users using blockchain, but the rest of the platform does not need to be distributed as a ledger than I would say don't bother trying to find a way to handle blockchain authentication for users because it's just gonna be a big time sink. It's a lot easier to just use OAuth and OpenID Connect with any sort of provider. You can use Okta, or literally anyone else. Amazon has products, Auth0 has products, and there's plenty of open source ways to do this.
> 
>  But, if you have to use blockchain because the application you're building is dependent on being distributed across the blockchain, like for example: if you want to make sure that the videos are never taken down and that everything is immutable and stuff like that, there's some really good blockchain authentication providers that you might want to check out. I forget the names of them off the top of my head, to be honest, but you might want to check some of those out to see if they can help you.
> 
> Or, if you're OK with centralizing the authentication component, you can just use Okta's standard SDKs and OAuth and OpenID Connect support to handle that for you.

Q: What flow would you recommend for a React app, since the implicit flow does not return a refresh token and the authorization code flow relies on a secure back channel which the browser is not.

> **Matt:** We added support for auth code flow with PKCE in our [React SDK's 1.2.2 release](https://github.com/okta/okta-oidc-js/releases/tag/%40okta%2Fokta-react%401.2.1). 

Q: For a REST API secured endpoint, what are the recommended access and refresh token lifespans? [Watch on YouTube](https://youtu.be/nGi8x5XppHI?t=2357).

> **Matt:** What I've heard in general is that access tokens (should be) as short as possible. I believe our shortest one is five minutes that we allow. And refresh tokens are days, weeks, or months. 
> 
> **Heather:** Yeah, I think it depends on what you're doing. During development, I certainly adjusted that time because it was getting annoying to have to re-auth when I was trying to test something. But yeah, I agree with you. I think the first token should definitely be the shortest. And refresh? I set mine at 30 days. It's pretty normal for all the mobile apps I've done.
> 
> **Randall:** I feel like this is a really common question. If you ask five different security professionals what they think about this, you're gonna get give different answers because there's an infinite number of possibilities. It really comes down to use case. If you're building a banking app and you are storing sensitive financial information, you're gonna want your access token duration to be as short as possible. The reason why is that if you really think about what tokens are even for. Tokens are a way to bypass security for the most part. They are anti-security. Tokens are really ways to cache authentication and authorization information for a certain time duration. That is not something you want to do if you're trying to validate credentials in a very important, precise way. 
> 
> If someone's going to do a bank transfer for 10 million dollars, would you want to have an access token that's cached their session that's active for five days? What that basically means is that they logged in five days ago. At any point in those five days, if their browser was compromised, if their computer was compromised, if a man-in-the-middle attacker was able to grab that token, or there was XSS on the website and someone was able to get access to that token -- that means you are trusting them for five full days before forcing them to reauthenticate. That's not a good idea.
> 
> On the other hand, if you're building something like Facebook, or a consumer site like Twitter, you'll notice that if you just play around with their sites, their access tokens have massive durations. I believe Facebook's is like a year. Back in the day, Google+ was set to 10 years. Google+ didn't even exist for 10 years. The very first tokens that Google+ minted are still valid technically if the service was still running.
> 
> So, it's really a preference thing. What it sort of boils down to is you always have this trade-off in the security world. You always have speed versus security. And that's what it really comes down to.
> 
> I'm just gonna do a shameless plug. If you want to know more about this, there's a great talk that I give called JSON Web Tokens Suck, for web auth and basically everything else. It's very opinionated, but it's really fun. It talks about a lot of this stuff. You can look at the slides at https://speakerdeck.com/rdegges/jwts-suck. This goes into a lot of depth on those tradeoffs and how it works. I guess the short thing I'd recommend is to figure out what your use cases and how much risk you're willing to accept and then set the token durations accordingly. 

Q: Do I need an API Gateway on-prem to protect my 3rd party APIs which are also on-prem. Do the API gateways maintain the tokens?

> **Brian:** It depends on what you're trying to do. If you're using your API gateway as an auth code flow, that's what's showing the login screen, or technically that's what gets redirected to an Okta login screen, that could be anywhere. Then you're just redirecting back to your internal network. It really depends on the topography of your application. I don't know if I can answer that truthfully without knowing a little more.
> 
> **Matt:** The other possibility if we do have an [Okta Access Gateway](https://www.okta.com/products/access-gateway/) that does sit on-prem. It can do what Okta does in the cloud for your on-prem applications. If you try to use Okta to secure your internal APIs and there's something that prevents those APIs from talking to Okta in the cloud, then you could use access gateway and have that locally and you wouldn't need to make any outbound connections. 

Q: OAuth doesn't have any built-in concept of multi-tenancy. For a web app that uses a service like Okta, what's the recommended way to support multiple tenants each with their own directory of users? [Watch on YouTube](https://youtu.be/nGi8x5XppHI?t=2680).

> **Randall:** The proper way to do it inside of Okta is with this hub-and-spoke model that Okta has. The gist of it is that when you sign up with Okta, you get what's called an org. You have an organization and all of your users are unique within that organization. Your organization also has its own unique URI for everything, its own APIs, and everything like that. It has its own API keys, etc. Essentially, if you want multi-tenancy -- true multi-tenancy -- where users can sign up for different applications and have completely separate accounts, what you need to do is talk to your Okta rep -- whoever that is -- and they will enable something called this hub-and-spoke model where you can use an API to create sub-orgs. You can create multiple other top-level Okta orgs for each "tenant". That's really the best way to do it today.

Q: Question about required actions... any out of the box solutions in Okta? e.g. Showing Privacy Policy page for the first login. One more question during the user invitation flow... any custom capabilities there? [Watch on YouTube](https://youtu.be/nGi8x5XppHI?t=2772).

> **Brian:** There was a lot going on in that in that one question. This is commonly referred to as consent. If you want to show someone some sort of consent, some OAuth consent, I think there's also a policy option. I know we have some documentation around this so if you search for consent policy you find out what it is.
> 
> I think consent is just a checkbox and the policy is just a URL. But, it's been a while since I've looked at that.

Q: Is there a paid service available for organizations using the API Developer product so we can confirm with experts and ensure that our Okta configuration and integration is being done properly? [Watch on YouTube](https://youtu.be/nGi8x5XppHI?t=2833).

> **Randall:** Yes, there's a couple of options there. The most obvious one is that we actually have professional services you can hire. I don't know what they charge or anything like that. We basically have a bunch of Okta domain experts. You can pay a little bit of money to have them come sit down with you and work on whatever it is you need. If you need help implementing something or if you have general security questions or whatever. 
>
> On the advocacy side, what a lot of us on this call work on, is if you have questions or anything like that, you should be able to send us an email and get some basic help that way.
> 
> We also have a dev support team that's really good about getting back to you on this stuff. If you email developers@okta.com, that will automatically create a ticket in our ticketing system. You can link to GitHub, you can ask very detailed questions, and our support team will get back to you. I think they have an SLA on responses. I think it might be a couple days or something like that, but they'll definitely get back to you.
> 
> I would probably start with email them -- developers@okta.com -- and then just go from there. If you have more detailed questions, maybe use professional services.

Q: In our environment, when the user receives an email to activate their account via self-registration, it redirects them to our Okta URL rather than the application they self-registered for (we have multiple applications). How do we redirect them to the site they registered for? [Watch on YouTube](https://youtu.be/nGi8x5XppHI?t=2930).

> **Heather:** That's a really good question. I actually ran into that the other day for a blog post I'm writing so I thought it'd be cool to talk about that. I'm gonna share my screen real quick so you all can see what I'm talking about.
> 
> When I'm logged into my Okta org, under users, there's a registration link. This is where you enable users to be able to self-register. Down at the bottom, there's a couple of [options] -- I'm gonna go ahead and edit this real quick -- the default right now is the user dashboard within Okta. This is the complaint, right?
> 
> You can do a custom URL, right here. However, what is interesting here is that under your applications -- let's say you've got multiple different kinds of applications. You can assign users to that or you can create a different org for that. For this, I ended up just assigning a group of people per application. Then I went ahead and nightly imported them into a new org.
> 
> That was the way I was able to get that redirect to happen to a specific page on a specific application. Besides what the redirect does within your app.

Q: How does Okta manage session inactivity timeouts on my personal organization dashboard? And how would I do this without logging users out of every custom application (i.e not SLO)? [Watch on YouTube](https://youtu.be/nGi8x5XppHI?t=3034). 

> **Randall:** I'm assuming this is talking more about the workforce product because you're talking about custom applications. If you are talking about building custom applications with Okta and you're worried about the session timeouts there, you can actually configure those TTLs. Before, we talked a bit about the token lifetime stuff. That's configurable as part of your authorization server configuration so when you're building a custom application using Okta and you create a custom authorization server, you can go in there and specify token timeouts. This essentially limits how long the user can remain logged into your custom-built application.
> 
> For the Okta dashboard itself, I don't remember what the default is for the token timeouts and I honestly don't know if that's customizable or not. Brian, do you know?
> 
> **Brian:** Yeah, it's very customizable. I always give the example that I'm remote and we use Okta at Okta. I'm remote and my IP address isn't registered with Okta. There's some geo lookup that happens that says that when I log in -- it's ridiculously short. If I'm in the office, for example, then I get a longer window so it's very configurable across the whole product. 

Q: Should I use SCIM or web hooks for user synchronization? What are the best practices there? [Watch on YouTube](https://youtu.be/nGi8x5XppHI?t=3156).

> **Randall:** I'll set this up with some context. Basically what Alex is asking is if you're using Okta, let's say to store all the users for your application, but you also have your own database in your application, but you want to keep a copy of users that's always up-to-date in your own database as well. Maybe for database relational stuff like doing a foreign key to a user field or something like that. Whatever the reason, that's a very common use case and this is a great question.
> 
> Back in the day, we only supported doing this via SCIM traditionally. You could synchronize users using our SCIM connectors. If you're not familiar with SCIM, it's a sort of a standard protocol for synchronizing users and keeping them up-to-date.
> 
> Just recently, we released [webhook support](https://www.okta.com/blog/2019/08/how-to-use-webhooks-with-okta/), which is pretty cool. There's both asynchronous webhooks that are just like notifications (e.g., user info change) and there's synchronous web hooks as well. If a user's authenticating to your site, we can call out with a web hook so you can customize the authentication procedure and stuff like that.
> 
> The right answer there is it's sort of variable. In my personal experience, I would say use web hooks because it's a lot simpler, at least for me. Usually, if you're using SCIM, you need to have infrastructure set up for that. You need a SCIM server that's configured and managed and maintained versus if you're just using our web hook support it's pretty straightforward. You look at the docs, you plug in the stuff so that your web server receives the hook and it just does an insert or update in your database. An upsert type request and that would be pretty simple.

Q: How would we implement an SSO solution for a client that wants to use their own Active Directory credentials to authenticate into our web and mobile apps? [Watch on YouTube](https://youtu.be/nGi8x5XppHI?t=3272). 

> **Randall:** If you're using Active Directory creds -- and it sounds like you want to implement SSO solutions. I'm assuming you're talking more about our workforce product. Which is what your customers would use to sign in to all their business applications.
> 
> What you're gonna want to do is use our [Active Directory agent](https://help.okta.com/en/prod/Content/Topics/Directory/ad-agent-install.htm). We have an agent you can use. You can download it. You run it within the network that your Active Directory server is on. It will handle synchronizing those users into Okta. It can be the master so that Okta only receives a read-only copy of the user data or you can have Okta be the master and AD is mirroring it. There's different configuration options there. That will allow your users to authenticate using their Active Directory credentials.

Q: I'm pretty new to Okta. With an identity provider-initiated service, how do we configure in Okta the ability to pass and ID token and access token to a backend application's REST API? We have our grant type set as implicit and currently, it only passes the issuer. [Watch on YouTube](https://youtu.be/nGi8x5XppHI?t=3346). 

> **Randall:** I'm just gonna go ahead and say I don't fully understand this question. It sounds like what you want to do is pass all the tokens to the application you're signing in to. I think I need a little more context here. Matt, you're muted. Do you have anything?
> 
> **Matt:** I think the IdP initiated service is the part that's confusing. If it's an app that is able to log into Okta and then you want to use the access tokens or ID tokens to pass into another REST service, then that's obviously supported. It just depends on the client that you're using. Most of our SDKs allow you to get those tokens from the SDK that you would embed into that client. 
> 
> **Brian:** Yep. And if it's a claim limitation with Okta's tokens, you can add custom claims to the tokens themselves if you're just looking to pack more data into your claims. But I don't know if that's what he's asking either.

Q: Do you have any thoughts around Okta indicating to a user when their password has been changed? I didn't see any email templates for that. [Watch on YouTube](https://youtu.be/nGi8x5XppHI?t=3467). 

> **Randall:** There may be a way to do that. If there is, we just haven't looked at it in a while so we apologize. We will look into that and next time we do one of these we'll be prepared and maybe we'll even write a cool article about it. Check out our blog, our Twitter, etc..., you know the drill.

Q: Is it a good practice to pass your custom scope claims in an ID token versus an access token? [Watch on YouTube](https://youtu.be/nGi8x5XppHI?t=3511). 

> **Randall:** You're definitely going to want it in the access token. The reason why is that, if you're using tokens at all, they reason you're using them is you want your application to be really fast. To be able to statelessly authenticate and authorize the user operations, right?
> 
> Whenever you're using OpenID Connect, you have two tokens. You have this ID token thing which is basically only used by your client application. Let's say you have a REST API backend and you have a single page app frontend. Well, the frontend is going to keep the ID token and it's never going to send it to the backend. The only thing the ID token is going to be used for is letting the frontend application quickly retrieve user details. First name, last name, email address, something that might be shown in the template on the page. The access token, however, is going to be sent from that frontend application to the backend application on every single request to authenticate the request. 
> 
> And so, the claims need to be present in the access token if you have to have fast authorization on the backend. Because when the backend receives a token, it's going to validate the legitimacy of it. It's then going to look at the claims and make sure they're good and that the requestor has the permission to execute the request, etc. 

At this point, our live session ended. However, we received numerous other questions. We recruited [Joël Franusic](https://twitter.com/jf) to help answer some of the workforce identity questions. See below for our answers.

Q: Search users within a Group (Group Member Operations) is very limited. It only can list all users within a Group paged. There is no ability to filter/search and return sorted results. Any ideas how it can be improved?

> **Brian:** Take a look at our [Groups API](https://developer.okta.com/docs/reference/api/groups/#list-groups), you can do simple searches or use a more complex filter expression.  Our SDKs support this too!

Q: I am integrating my Okta with my customers for a single sign-on (SSO) experience. What Okta details I should share with my customers for IDP and SP initiated integration? Looking for Okta best practices for customer integration.

> **Joël:** Ideally, all you should need to share with your customers is the Metadata URL for the SAML app you have configured in Okta as (this assumes that Okta is the IdP and your customers are the SP) many SPs can use a metadata URL. Otherwise, you might need to share the individual data the Metadata URL bundles together separately: the x509 cert for Okta, the audience, the issuer, etc.

Q: Does Okta recommend obtaining an access token in the application based on an ID token vs Okta sending both id token and access token to a custom web application?

> **Joël:** This is a pretty common question, though not 100% clear. Generally, access_token is for AuthZ (AuthoriZation) and id_token is for AuthN (AuthorizatioN).

Q: Is using Okta with AWS Cognito a common use case? Any recommendations?

> **Joël:** Yes! Very common. I wrote some sample code to do this 3 years ago. See <https://github.com/okta/okta-oidc-aws>.

Q: How do I enable iframe only for one app rather than the overall org? How do I secure it further?

> **Joël:** If this is on the Okta side, you can't, we only allow iFrame embedding of Okta on a whole org basis, or not.

Q: Does Okta provision, update, and deprovision users to Azure AD?

> **Joël:** Yes, we do.

Q: My company is currently signing a contract with Okta to begin in 2020. I have signed up with my own personal developer account in the meantime to get ahead of the game. Is there a big difference between my small developer sandbox and what my company will see?

> **Randall:** Nope! Most things will be the same -- you'll still be able to create apps, users, etc. You can also do the typical authentication and authorization flows. You won't be able to do things like edit email templates, however (that is a paid feature only), use SMS-based MFA, or use Okta with Active Directory, LDAP, and enterprise Single Sign-On providers.
>
> In most cases, you can build and test whatever you need using the free developer accounts.

Q: What would you suggest for us to do? We are experiencing situations where our end users are experiencing expired or invalid activation tokens. Any possibility of self-service regeneration of activation links?

> **Brian:** This sounds like some sort of config error. Or someone is sending activation emails on behalf of a user, and that user is not expecting them (i.e. not checking email within some expected time frame). The better solution might be to use a registration flow and migrate users into Okta as needed.

Q: Possibility of moving Okta Configurations between environments easily? It's been a hassle trying to keep track of our configurations to move up to our higher environments.

> **Joël:** We don't have a good answer for this yet. Eventually, we hope to be able to export an Okta configuration into a Terraform file, so that people could then apply that configuration to a different Okta org.
>
> The best we can offer right now is for people to define their desired configuration in Terraform once, then apply that to other orgs as needed.

Q: Can you force all permissions and policies to be enforced based on the permissions set in the Okta Universal Directory? Essentially using Okta Universal Directory for all policy enforcement and management.

> **Joël:** In general, yes. You can set policies and permissions in Okta via Group Membership rules, but also via attributes in UD (which can be set via EL). There are many ways to answer this question, so we would need to hear more details to give a more useful answer here.

Q: Are SWA apps secure to use?

> **Randall:** This depends on your definition of *secure*. SWA apps are apps that require a username and password pair to let the user log in. Is there anything wrong with that? No! Absolutely not.
>
> Most of the security concerns around SWA apps are centered around when you have a single sign-on provider logging your users *into* SWA apps automatically (like Okta). The question then becomes: can you trust a service like Okta to store your username/password, because the SSO provider, in this case, won't be able to hash SWA passwords as they need to be retrieved in plain text, to log in.
>
> In general, if you're using Okta, you should be fine using SWA apps. It is definitely less secure than the alternative, but Okta goes to great lengths to encrypt your user passwords in the case of SWA apps using customer-specific private keys, as well as going through numerous audits and code reviews.
>
> If you are going to use SWA apps, you can't really have a better experience than that.

Q: Getting statistics on usage statistics of applications authenticated by Okta, what are the options? Sufficient details in the Okta access log?

> **Joël:** Take a look a the System Log (and its [API](https://developer.okta.com/docs/reference/api/system-log/)).  There is even a preconfigured "Authentication Activity" link in your Okta Admin Console.

## Attend our October Office Hours

We plan to host office hours for developers every month. Our next one will be at 10 am Pacific time on October 29. We plan to make it a Halloween theme, so come and see the Okta Developer Advocates with their costumes on!

<div style="max-width: 500px; margin: 0 auto 1.25rem;">
<blockquote class="twitter-tweet"><p lang="en" dir="ltr">📅SAVE THE DATE📅<br><br>Join us for a special Halloween themed <a href="https://twitter.com/hashtag/OktaDevOfficeHours?src=hash&amp;ref_src=twsrc%5Etfw">#OktaDevOfficeHours</a> on Oct 29th from 10-11 am PST 🎃<br><br>Register here: <a href="https://t.co/I99WqIznYr">https://t.co/I99WqIznYr</a> <a href="https://t.co/KP75jFP994">pic.twitter.com/KP75jFP994</a></p>&mdash; OktaDev (@oktadev) <a href="https://twitter.com/oktadev/status/1186368150087950336?ref_src=twsrc%5Etfw">October 21, 2019</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
</div>

In the meantime, [follow @oktadev on Twitter](https://twitter.com/oktadev) and [subscribe to our YouTube channel](https://youtube.com/c/oktadev).
