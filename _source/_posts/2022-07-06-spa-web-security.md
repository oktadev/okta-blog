---
layout: blog_post
title: "Defend Your SPA from Security Woes"
author: alisa-duncan
by: advocate
communities: [security,javascript]
description: "Learn the basics of web security and how to apply web security foundation to protect your Single Page Applications."
tags: [security, react, vue, angular]
tweets:
- "Protect your SPA and web 🍪  by keeping these web security tips in mind!"
- "Confused about web security? 🤔 Read this post to demystify actionable steps you can take to protect your SPA. ✅"
image: blog/spa-web-security/social.jpg
type: awareness
---

There's a lot of information floating out there about web security. But when I read through the material, I noticed some information wasn't up to date, or it was written specifically for traditional server-rendered web applications, or the author recommended anti-patterns. In a series of posts, I will cover web security concerns that all web devs should be aware of, emphasizing client-side applications, namely Single Page Applications (SPAs). Furthermore, I'm not going to get into the nitty-gritty of web security, cryptography, and networking.  Instead, I'll focus on the main takeaways and high-level to-do lists. I'll also provide links to resources where you can dive in deeper.

|Posts in the SPA web security series|
| --- |
| 1. **Defend Your SPA from Security Woes** |
| 2. [Defend Your SPA from Common Web Attacks](/blog/2022/07/08/spa-web-securty-csrf-xss) |

So why do we worry about web security anyway? When we have vulnerabilities in our applications, it's an avenue for exploitation by bad actors. In the wrong hands, exploiting the vulnerabilities can cause risks to your application, data, reputation, and bottom line. In the words of my coworker [Aaron Parecki](https://developer.okta.com/blog/authors/aaron-parecki/), it all boils down to one thing—liability. And we don't want to expose ourselves, our applications, and our companies to liability. If you feel threatened, it's a good time to read on and identify how to harden your application.

{% include toc.md %}

## Use the OWASP Top 10 to identify the most common vulnerabilities
If you're new to thinking about security, you may not have heard of the [**O**pen **W**eb **A**pplication **S**ecurity **P**roject](https://owasp.org/) (OWASP). OWASP is a group that focuses on making the web a safer place. They maintain and publish a list of the most common web vulnerabilities named the "[OWASP Top Ten](https://owasp.org/www-project-top-ten/)" and have a new top ten list for 2021; their infographic shows how the top web vulnerabilities have changed from 2017 to 2021.

{% img blog/spa-web-security/owasp-top-ten.jpg alt:"OWASP Top 10 for 2021 shows the following vulnerabilities in order: Broken Access Control, Cryptographic Failures, Injection, Insecure Design, Security Misconfiguration, Vulnerable and Outdated Components, Identification and Authentication Failures, Software and Data Integrity Failures, Security Logging and Monitoring Failures, and Server-Side Request Forgery" width:"800" %}{: .center-image }
<cite>[CC-by Open Web Application Security Project](https://owasp.org/Top10/)</cite>

As this is a list of web vulnerabilities, the entire list is pertinent to our work as web developers. However, a few critical vulnerabilities call for extra attention, and some vulnerabilities are less susceptible when the front-end is a SPA with a JSON-based backend API.

We will cover some of these vulnerabilities specifically, but I'll also list general things to keep in mind that feed into the vulnerabilities listed here.

## Leverage your browser and security headers
First, we need to set the stage for part of our vulnerability mitigation strategy by bringing up security headers. Modern browsers (buh-bye Internet Explorer!!) have a lot of security mechanisms already built in. We have to leverage the built-in security mechanisms and can enhance them with additional security headers. Security headers are HTTP response headers that provide instructions on how the browser should behave. They are defined on your web server.

There are quite a few security headers that we can apply. Something to note, SPAs are unique, so not all security headers apply in the same way as they would for a traditional server-rendered web application. I'll call out the security headers that you'll want to use when we discuss how to mitigate a specific vulnerability. 

### Dive deeper into security headers
Here are some great resources to learn more about security headers. Figuring out how to configure the security headers can be esoteric. I like these posts that are short and offer actionable steps to configure security headers. 
* [An Overview of Best Practices for Security Headers](/blog/2021/10/18/security-headers-best-practices)
* [OWASP's HTTP Security Response Headers Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/HTTP_Headers_Cheat_Sheet.html)
* [Web.dev's Security headers quick reference](https://web.dev/security-headers/)

## Securely transport data using TLS/SSL
Using HTTPS should be the undisputed standard, but there are legacy systems where applications don't use HTTPS. It's essential to use the _secure_ hypertext transfer protocol; after all, the HTTPS acronym is appropriately derived from **H**ypertext **T**ransfer **P**rotocol **S**ecure. And it's essential to be secure across your _entire_ stack, not just when serving the front-end site (don't ask me how I know this can be a thing). 

When you don't use an up-to-date **T**ransport **L**ayer **S**ecurity within your application system, you expose yourself to [meddler-in-the-middle attacks (MITM)](https://en.wikipedia.org/wiki/Man-in-the-middle_attack). In this type of attack, agitators intercept communication between unsecured systems to siphon data or impersonate communicating parties. 

You might think this callout to use HTTPS is unnecessary because it's such a standard for hosting web apps, but [cryptographic failures that cause insecure communication are the second most common vulnerability in the OWASP Top Ten](https://owasp.org/Top10/A02_2021-Cryptographic_Failures/)! Note that it's not enough to slap any old mechanism for HTTPS on your web server. You want a _recent_ version of TLS. Your cloud providers might even force you to upgrade if your TLS version is old, which is good!

![Cartoon with one character saying "What does the red line through HTTPS mean?" The other character replies "Oh, just that the site hasn't been updated since 2015 or so. And since it's been around that long it means it's probably legit."](https://imgs.xkcd.com/comics/red_line_through_https.png)

-- <cite>[xkcd](https://xkcd.com/2634/)</cite>

What's the takeaway here? Specifically, you'll want to make sure you have functioning certificates, ensure you're using the latest version of TLS, and make sure you use SSL/TLS over your _entire stack_. All of these steps might already be covered by your cloud hosting provider. You should also verify you've added the **HTTP Strict Transport Security (HSTS)** security header to the web server, which adds an extra layer of security beyond HTTPS redirection.

### Dive deeper into transport layer security 
Check out these resources if you want to read more about Transport Layer Security and how to set up HTTPS redirection and HTST.
* [Okta's API Security book chapter on Transport Layer Security](https://developer.okta.com/books/api-security/tls/)
* [OWASP's Transport Layer Protection Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Transport_Layer_Protection_Cheat_Sheet.html)
* [TLS Guidelines from MDN](https://infosec.mozilla.org/guidelines/web_security#transport-layer-security-tlsssl) 
* [Getting started with HTTPS and certificates with Let's Encrypt](https://letsencrypt.org/getting-started/)

## Keep your framework and external dependencies up to date
You knew this was coming, even though we might lament the work involved to stay up to date. The advice to update your dependencies sounds like "Don't forget to floss," but it's essential (just like flossing). [Vulnerable and outdated components take the sixth spot in the OWASP Top Ten list](https://owasp.org/Top10/A06_2021-Vulnerable_and_Outdated_Components/). And there were some significant vulnerabilities from dependencies in the news recently. So you know deep down that burying your head in the sand is not a good action plan.

It's important to note that we should update outdated components **and** ensure we don't accidentally depend on a vulnerable dependency. We should pin dependency versions in our `package.json` and then generate and enforce the use of a lock file. That means running `npm ci` instead of `npm i` to force the exact versions defined in the `package-lock.json`. If you use Yarn, you will use `yarn install --frozen-lockfile`. This way, updating versions is an intentional act.

That's it. Just do it. It's important. Outdated components are a source of _liability_.

### Dive deeper into keeping your components up to date
Check out a step-by-step guide on dependency management for JavaScript developers by the OWASP team - [NPM Security best practices](https://cheatsheetseries.owasp.org/cheatsheets/NPM_Security_Cheat_Sheet.html).

## Load resources securely
Cross-origin resources are a particular concern for SPAs; this refers to resources your web app uses that are not hosted on the same origin as your web application. When all the resources the front-end needs are available through the same origin, we have confidence that the resources are secure. Hopefully, we're not pwning ourselves! At least not intentionally, right?!

A typical pattern for setting up URLs for SPA communicating to back-end APIs might look like the following, where your front-end is

```
https://myfavekdramas.com
```

and the back-end API URL is

```
https://apis.myfavekdramas.com
```

But the API URL is a subdomain, so the request is cross-origin. Most browsers (once again BUH-BYE Internet Explorer!) protect us by allowing only specific cross-origin requests. We can configure resource access by enabling **C**ross-**o**rigin **R**esource **S**haring (CORS).

Between your production environment setup resembling the above URLs, and local development using different ports for your front-end and back-end, you might be tempted to enable CORS to allow all sorts of requests. Unlike other security measures covered in this post, your browser already protects you in the strictest way possible. Enabling CORS _loosens_ that restriction.

So the advice is to enable CORS appropriately with considered use of allowlists. Use proxies as appropriate (such as for local development). The concept of least privilege applies here too, and keeping a tight lid on things helps mitigate security vulnerabilities.

### Dive into cross-origin resource sharing
Want to understand better when CORS rules apply or how to set up the allowlist rules? Read these resources for a deep dive.
* [Fixing Common Problems with CORS and JavaScript](/blog/2021/08/02/fix-common-problems-cors)
* [MDN CORS Reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)
* [Auth0's CORS Tutorial](https://auth0.com/blog/cors-tutorial-a-guide-to-cross-origin-resource-sharing/)

## Protect your cookies from theft
Really, this advice is applicable outside of web development too. But since we're talking about web development in this post, we'll skip mitigation strategies about protecting your physical cookies from marauders and focus again on security headers.

Cookies can contain all sorts of goodies, such as chocolate chips and the tidbits of data that agitators love to have! Current authentication best practices favor using in-browser memory or web workers for authentication tokens over cookies, and cookies should never be used for secrets, but there might still be sensitive information stored in cookies. To help protect cookies, we can use attributes.

Cookies should be temporary. In particular, cookies with sensitive information should be as short-lived as possible. When you or your back-end bakes up a cookie, adding the attribute `Max-Age` defines the longevity of the cookie. 

There are some more attributes you can bake in! Adding the `httpOnly` attribute means the browser only sends a cookie for HTTP requests, and JavaScript won't be able to access cookies. Setting the `httpOnly` attribute is an excellent first step to guarding your cookies against a malicious script that can read your cookies.

Having the `httpOnly` attribute means that JavaScript can't access the cookie, but it doesn't mean your browser carefully curates **which** cookies to send to each HTTP request! It just sends them all, resulting in the possibility of a vulnerability!

This is where the `SameSite` attribute comes into play. You can control when cookies should be sent by using the `SameSite` attribute and setting one of 3 values:
1. `Strict` - only send cookies if they are going to the same site that requested them.
2. `Lax` - only send cookies when the user is navigating to the origin site. (This is the default behavior now for Chromium-based browsers.)
3. `None` - send the cookies to everyone, everywhere. As a safeguard for your generous behavior, which is concerning to the browser, you're also required to add the `Secure` attribute.

With the `SameSite` attribute set, you can no longer have a scenario like this
![Giphy of multiple hands holding out cookies to Cookie Monster. Cookie Monster grabs and eats them all.](https://media.giphy.com/media/xT0xeMA62E1XIlup68/giphy.gif)

Be thoughtful about cookies and apply principles of least privilege. Safeguarding cookies is a big step in mitigating other vulnerabilities.

### Dive deeper into cookie guarding
Learn more about protecting your cookies by checking out these fantastic resources.

* [web.dev's SameSite cookies explained](https://web.dev/samesite-cookies-explained/)
* [MDN's SameSite cookies web docs](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie/SameSite)

## Learn more about web security
Stay tuned for the next post in this series as we learn about two well-known web security attacks, along with mitigation techniques using what we covered here.

|Posts in the SPA web security series|
| --- |
| 1. **Defend Your SPA from Security Woes** |
| 2. [Defend Your SPA from Common Web Attacks](/blog/2022/07/08/spa-web-securty-csrf-xss) |

Can't wait to learn more? Check out out the following resources.
* [A Beginner's Guide to Application Security](/blog/2022/05/09/beginners-app-sec)
* [How to Configure Better Web Site Security with Cloudflare and Netlify](/blog/2019/04/11/site-security-cloudflare-netlify)
* [Security Patterns for Microservice Architectures](/blog/2020/03/23/microservice-security-patterns)
* [Security and Web Development](https://auth0.com/blog/security-and-web-development/)
* [OWASP Top Ten 2021: Related Cheat Sheets](https://cheatsheetseries.owasp.org/IndexTopTen.html)

Don't forget to follow us on [Twitter](https://twitter.com/oktadev) and subscribe to our [YouTube channel](https://www.youtube.com/c/OktaDev/) for more great tutorials. We'd also love to hear from you! If you have any questions or want to share what tutorial you'd like to see next, please comment below.