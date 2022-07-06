---
layout: blog_post
title: "Defend Your SPA from the Common Web Attacks"
author: alisa-duncan
by: advocate
communities: [security,javascript]
description: "Learn the basics of the two most common web security attacks and the ways to mitigate those attacks to your Single Page Applications."
tags: [security, react, vue, angular]
tweets:
- "Don't let bad actors cause security problems! Learn the basics of XSS and CSRF web attacks, and how to keep your SPA safe!"
- "Concerned about web vulnerabilities? Learn how to better protect your SPA from injection attacks and cookie theft! 💉🍪"
image: blog/spa-web-security-csrf-xss/social.jpg
type: awareness
---

This is the second post in a series about web security for SPAs. In the last post, we laid the groundwork for thinking about web security and applying security mechanisms to our application stack. We covered the [OWASP Top Ten](https://owasp.org/Top10/), using secure data communication with SSL/TLS, using security headers to help enhance built-in browser mechanisms, keeping dependencies updated, and safeguarding cookies.

|Posts in the SPA web security series|
| --- |
| 1. [Defend Your SPA from Security Woes](/blog/2022/07/06/spa-web-security) |
| 2. [Defend Your SPA from the Common Web Attacks](/blog/2022/07/xx/spa-web-securty-csrf-xss) |

 Ready to continue and make your SPA safer? This post will use the concepts we introduced to banish some well-known web vulnerabilities.

 {% include toc.md %}

## Practice data cleanliness
Cross-Site Scripting (XSS) is a vulnterability that continues to plague web developers. This vulnerability is a type of injection attack and is so common that it's [number 3 on the OWASP Top Ten list](https://owasp.org/Top10/A03_2021-Injection/). 

How does this vulnerability work? In short, XSS happens when code pollutes data, and you don't implement safeguards. 

Ok, fine, but what does that mean? A classic example is a website that allows user input, like adding comments or reviews. Suppose the input takes anything the user types in and doesn't appropriately safeguard that user input before storing the input and displaying it to other users. In that case, it's at risk for XSS. 

Imagine an overly dramatic but otherwise innocent scenario like this
>1. A website allows you to add comments about your favorite K-Drama.
>2. An agitator adds the comment `<script>alert('Crash Landing On You stinks!');</script>`.
>3. That terrible comment saves as is to the database.
>4. A K-Drama fan opens the website.
>5. The terrible comment is added to the website, appending the `<script></script>` tag to the DOM.
>6. The K-Drama fan is outraged by the JavaScript alert saying their favorite K-Drama stinks.

So, this is obviously awful. Least of all because we all know "[Crash Landing On You](https://www.imdb.com/title/tt10850932/)" is, in fact, wonderful, but also, this scenario exposes a colossal breach in what injection attacks can do. With JavaScript, the attack could grab cookies, dig around your browser's local storage for authentication information, access your file system, make calls to other sites, and do even more harm.

In this case, we show an example very clearly using a `<script></script>` tag just to make it easier for us to talk about, but the attack can use anything that runs JavaScript, such as adding an HTML element with JS embedded in the attribute, adding JS to resource URLs, embedding JS into CSS, and so forth. This is the true stuff of nightmares!

How do we avoid this sort of shenanigans? There are a few different things to do, but the main one is to ensure you practice good data hygiene through **escaping** and **sanitizing**.

Escaping (where you replace certain characters in HTML so it's as text, such as replacing `<b>` with `&lt;b&gt;`). When you escape, the browser no longer treats the value as part of the code. It's simply text or data. While we're talking XSS here, escaping is a good practice in general as it will protect you against SQL injection.

![A cartoon showing a person on the phone. The conversation goes like this "Hi, this is your son's school. We're having some computer trouble." The person responds "Oh dear - did he break something?" School- "In a way... Did you really name your soon Robert'); DROP TABLE Students; -- ?" Person - "Oh. Yes. Little Bobby Tables, we call him." School- "Well, we've lost this year's student records. I hope you're happy." Person-"And I hope you've learned to sanitize your database inputs."](https://imgs.xkcd.com/comics/exploits_of_a_mom.png)

-- <cite>[xkcd](https://xkcd.com/327/)</cite>

Sanitizing removes code that might be malicious but still preserves some safe HTML tags. The primary use case for preferring sanitizing over escaping is when you want to allow markup to display, like if you have a rich text editor on your website.

There's a lot more to discuss regarding XSS, including types of XSS and mitigation technique specifics, so keep an eye out for a follow-up post with more details, including the built-in XSS security mechanisms in some SPA frameworks.

## Dive into XSS
Can't wait to read more about XSS? Check out these resources that cover how XSS works
* [API Security book chapter on Sanitizing Data by Okta](https://developer.okta.com/books/api-security/sanitizing/)
* [Cross-site scripting resource from Port Swigger Web Security Academy](https://portswigger.net/web-security/cross-site-scripting)

## Validate requests for authenticity
Cross-Site Request Forgery (CSRF) is another well-known vulnerability in the [top spot of the OWASP Top Ten, Broken Access Control](https://owasp.org/Top10/A01_2021-Broken_Access_Control/). CSRF allows attackers to exploit your identity to perform unauthorized actions. Sounds pretty bad, right? Well, yup, you're correct.

The exploit works like this.

>1. You log in to the K-Drama site to upvote some recent shows you watched.
>2. Then, in a loss of judgment, you open some spam emails and click the link to transfer money to an agitator claiming to be a Nigerian prince.
>3. The link takes you to a malicious site with a hidden form embedded within it.
>4. The hidden form sends an HTTP POST request with terrible comments to the K-Drama site along with the active session cookie. 
>5. Since you have an active authenticated session on the K-Drama site, the POST completes as if you were the one adding terrible comments about "Hospital Playlist"!

Luckily in this example, the unauthorized action isn't irreversible or devastating. You can delete the terrible comments, and you can explain how it wasn't really you who posted such comments to horrified "[Hospital Playlist](https://www.imdb.com/title/tt11769304/)" fans. However, you can see how frightful this exploit can be if the target was something more malicious like a bank!

The only way to mitigate against CSRF is to ensure the request is legitimate.

Fortunately, we already have some tools at our disposal that we covered previously, such as
1. Prefer tokens in HTTP headers for authenticated HTTP calls and ideally store those tokens in-memory
2. Configuring tight CORS controls
3. Protect your cookies!

These mechanisms are so good that [some say there's nothing more you need to do for SPAs](https://scotthelme.co.uk/csrf-is-dead/)! 

However, CSRF relies on your back-end not doing due diligence to verify the authenticity of the requests and allowing non-JSON payloads. Hackers are very clever, and you may need to allow `<form>` payloads in your backend, so you may need extra guards. When you do need extra guards, you can add a unique CSRF token for communication between your front-end and back-end. The back-end needs to verify standard authentication and authorization safeguards and verify the CSRF token's legitimacy. 

The token is generated by the back-end and sent to the front end. The front-end then uses the token in subsequent calls to the back-end by adding it as a custom HTTP header.

For SPAs, getting that CSRF token from the server is the difficult part. In traditional web apps, it's not a problem. But for SPAs, you don't call your back-end API until after you load the application. You also want CSRF protection before logging in if you're not delegating authentication to a third-party authentication provider. 😎

The recommendation is to have your client call an endpoint on your back-end to get the CSRF token. The endpoint **must** be super vigilant about confirming the caller's origin and keeping that CORS allowlist very strict.

### Dive deeper into CSRF
Luckily, there are a lot of browser protections that help us mitigate CSRF. Check out these links if you want to learn more about CSRF.
* [Prevent Cross-Site Request Forgery (CSRF) Attacks by Auth0](https://auth0.com/blog/cross-site-request-forgery-csrf/)
* [Cross-Site Request Forgery Prevention Cheat Sheet by OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
* [Understanding CSRF from the Express team](https://github.com/pillarjs/understanding-csrf)

## Learn more about the common web attacks
Stay tuned for the next post in this series as we dive deeper into CSRF and learn how Angular helps protect against it.

|Posts in the SPA web security series|
| --- |
| 1. [Defend Your SPA from Security Woes](/blog/2022/07/06/spa-web-security) |
| 2. [Defend Your SPA from the Common Web Attacks](/blog/2022/07/xx/spa-web-securty-csrf-xss) |

Ready to learn more? Check out out the following resources.
* [A Comparison of Cookies and Tokens for Secure Authentication](/blog/2022/02/08/cookies-vs-tokens)
* [Defend Your Web Apps from Cross-Site Scripting (XSS)](https://auth0.com/blog/cross-site-scripting-xss/)
* [OWASP Top Ten 2021: Related Cheat Sheets](https://cheatsheetseries.owasp.org/IndexTopTen.html)


Don't forget to follow us on [Twitter](https://twitter.com/oktadev) and subscribe to our [YouTube channel](https://www.youtube.com/c/OktaDev/) for more great tutorials. We'd also love to hear from you! If you have any questions or want to share what tutorial you'd like to see next, please comment below.