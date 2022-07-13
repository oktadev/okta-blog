---
layout: blog_post
title: "Protect Your Angular App from Cross-Site Request Forgery"
author: alisa-duncan
by: advocate
communities: [security,javascript]
description: "Dive into Cross-Site Request Forgery (CSRF) mitigation strategies and how to apply them to your Angular application."
tags: [security, angular]
tweets:
- ""
- ""
- ""
image:
type: awareness
---

Previously, I wrote about web security at a high level and the framework-agnostic ways to increase safety and mitigate vulnerabilities.

|Posts in the SPA web security series|
| --- |
| 1. [Defend Your SPA from Security Woes](/blog/2022/07/06/spa-web-security) |
| 2. [Defend Your SPA from Common Web Attacks](/blog/2022/07/08/spa-web-securty-csrf-xss) |
| 3. **Protect Your Angular App from Cross-Site Request Forgery** |

Now, I want to dive a little deeper into the vulnerabilities. In this short post, we'll dive into **C**ross-**S**ite **R**equest **F**orgery (CSRF) and look at the built-in help you get when using Angular.

{% include toc.md %}

## Cross-Site Request Forgery (CSRF) protection

In the [previous post](/blog/2022/07/08/spa-web-securty-csrf-xss#validate-requests-for-authenticity-to-mitigate-csrf), you learned how an attack for CSRF occurs when an agitator uses your active session for a trusted site to perform unauthorized actions. We also learned there's built-in support from browsers to mitigate attacks with `SameSite` attributes on cookies, validating the authenticity of the request on the backend, and potentially having the frontend send a CSRF token to the backend for every request.

The mitigation strategies primarily require server-side work, except for that game of CSRF token sending, where the client needs to send the token back in a way the backend can validate.

![Giphy of a dog picking up mail from the postal worker](https://media.giphy.com/media/V6XBe0GQZSNO0/giphy.gif)

When using CSRF tokens, it's essential to tie the token to the user's session so that the back-end can validate the request. The most common ways are through the patterns called [Synchronizer Token Pattern](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html#synchronizer-token-pattern) and [Double Submit Cookie](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html#double-submit-cookie).

### Synchronizer Token Pattern

The Synchronizer Token Pattern requires the backend to store the user's session information and match it up with the CSRF token for validity. This pattern can be used with SPAs but is a better match for web apps that use forms with post methods for requests, such as:

```html
<form action="https://myfavekdramas.com/fave-form" method="POST">
  <label for="name">What is your favorite K-Drama?</label>
  <input type="text" id="name" name="name">
  <button>Save my favorite K-Drama</button>
</form> 
```

Submitting this form POSTS to `https://myfavekdramas.com/fave-form` using the `application/x-www-form-urlencoded` content type. CSRF is especially susceptible when using non-JSON data.

### Double Submit Cookie Pattern

Sadly, this pattern doesn't involve double the cookies—it's a dual submission. Sad news indeed for chocolate-chip cookie fans. 🍪🍪 😢 But the good news is the Double Submit Cookie Pattern doesn't require the backend to track the user's session to the CSRF token. 

In this pattern, the CSRF token is a separate cookie from the user's session identifier. The client sends the CSRF token in every request, and the back-end validates that the CSRF token cookie and the token in the request values match. This pattern is more common for SPAs.

## CSRF Support in Angular

Angular has built-in support for a flavor of the Double Submit Cookie Pattern, where the CSRF token is automatically added as an HTTP header for every back-end request once you have a CSRF token in a cookie. Nice!

The `HttpClientXsrfModule` automatically adds an interceptor for your HTTP requests. The interceptor grabs the CSRF token from a session cookie named `XSRF-TOKEN` and adds the token value to outgoing requests in the HTTP header named `X-XSRF-TOKEN`. Then your backend is responsible for verifying the values for the cookie and HTTP header match.

To add this handy helper, add `HttpClientModule` and the [`HttpClientXsrfModule`](https://angular.io/api/common/http/HttpClientXsrfModule) to your module's `imports` array.

If you don't like the default names, you have the option of configuring the names of the cookie and HTTP header like this:

```ts
imports: [
  HttpClientModule,
  HttpClientXsrfModule.withOptions({
    cookieName: 'Pecan-Sandies',
    headerName: 'Top-Of-Page'
  })
]
```

## Learn more about CSRF and creating applications using Angular
Watch for the fourth and final post in this series, as we dive into Cross-Site Scripting (XSS) and learn how Angular's built-in security mechanisms protect us.

|Posts in the SPA web security series|
| --- |
| 1. [Defend Your SPA from Security Woes](/blog/2022/07/06/spa-web-security) |
| 2. [Defend Your SPA from Common Web Attacks](/blog/2022/07/08/spa-web-securty-csrf-xss) |
| 3. **Protect Your Angular App from Cross-Site Request Forgery]** |

If you liked this post, you might be interested in these links.
* [Security: XSRF protection documentation from Angular](https://angular.io/guide/http#security-xsrf-protection)
* [How to Build Micro Frontends Using Module Federation in Angular](/blog/2022/05/17/angular-microfrontend-auth)
* [Three Ways to Configure Modules in Your Angular App](/blog/2022/02/24/angular-async-config)

Don't forget to follow us on [Twitter](https://twitter.com/oktadev) and subscribe to our [YouTube channel](https://www.youtube.com/c/OktaDev/) for more great tutorials. We'd also love to hear from you! Please comment below if you have any questions or want to share what tutorial you'd like to see next.
