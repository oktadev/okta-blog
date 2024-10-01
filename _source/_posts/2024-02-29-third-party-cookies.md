---
layout: blog_post
title: "The End of Third-Party Cookies"
author: edunham
by: advocate
communities: [devops,security,mobile,.net,java,javascript,go,php,python,ruby]
description: "Google Chrome is deprecating all third-party cookies in 2024. How will this affect your Okta application, remember me features, and Okta Sign-In Widget?"
tags: [third-party-cookies, okta-sign-in-widget]
tweets:
- ""
- ""
- ""
image: blog/3pc/social.jpg
type: awareness
---

**NOTE**: In July, Google provided an update on their [third-party cookie deprecation effort](https://privacysandbox.com/news/privacy-sandbox-update/). Okta will work with Google to understand the specific impact on Okta customers. In the meantime, we continue to advise customers to migrate away from using third-party cookies, as outlined below.


## What are third-party cookies?

Cookies are as old as the internet. Historically, cookies were among the only options for personalizing a user's online experience and carrying their preferences from page to page. First-party cookies are issued by the web site where they're used, and third-party cookies come from other domains. 

Third-party cookies allow user behavior to be tracked across different sites. These cookies are now widely abused to collect and share users' data. For the legitimate use cases which used to depend on third-party cookies, like federated logins and multi-brand identity providers, more secure options are actively being developed. 

Today, the drawbacks to users' security and privacy from third-party cookie implementations outweigh their benefits so much that all major browsers are phasing them out. Safari has blocked third-party cookies for years, and Firefox restricts third-party cookies associated with trackers. Chrome is now [phasing out third-party cookies](https://developers.google.com/privacy-sandbox/3pcd) in 2024. 

If a user has a cookie from okta.com in their browser, that cookie will count as first-party when accessed by the okta.com website, and it will count as third-party when accessed from a website on any other domain.

When a user logs into their Okta account in a web browser, a [session cookie](https://developer.okta.com/docs/guides/session-cookie/main/#about-okta-session-cookies) stores state information about their login session. These cookies are usually first-party, but in some situations they can be third-party. If your application uses cookies from domains other than the ones they were issued for, you'll need to make some changes to keep the identity experience working as intended. 


## Does your Okta application use third-party cookies? 

Most of Okta's core auth flows do not rely on third-party cookies. When third-party cookies are used, they normally augment the basic login experience or add convenience features. The following sections outline all the design patterns in which Okta uses third-party cookies. If your application is in one of these categories, please test its behavior with third-party cookie deprecation. 

Okta uses cookies to let applications introspect and extend user sessions. Cookies aren't required for basic login functionality. Without cookies, users can still log in, but some users might have to re-authenticate more often.

### Third-party cookie deprecation affects web applications that rely on the Okta session for user context

If an application hosted on your domain (`mycompanyapp.com`) redirects to your Okta subdomain (`mycompany.okta.com`) for login and then returns users to your own domain, third-party cookie restrictions will limit how your app can introspect or extend the Okta session. 

### Third-party cookie deprecation affects customer-hosted Okta Sign-In Widget and customer-built login applications

If you're hosting your own sign-in experience on a separate top level domain from your main app, you may be using third-party cookies. You might be hosting your own sign-in experience by cloning the Okta Sign-In Widget from GitHub or installing it from NPM to embed in your application, or you might have built your own custom sign-in using Okta's APIs. 

If your sign-in experience is hosted on the same top-level domain as your application, third-party cookie deprecation won't affect its behavior. 

If the sign-in experience and app are on different top-level domains, third-party cookie deprecation will break its ability to introspect and extend sessions, because these features use cookies. Authentication will still be possible, and tokens will still be returned, because these features do not rely on cookies. 

If you're using a custom domain like `login.mycompany.com` in your sign-in widget configuration, cookies will be written to the domain which received the request. If your Sign-In Widget configuration sets `login.mycompany.com` as the `baseUrl` or `issuer`, cookies will be issued for `mycompany.com` when a user logs in, so those cookies are first-party to all `mycompany.com` web pages.

If you have a self-hosted Sign-In Widget with `mycompany.okta.com` configured as the `baseUrl` or `issuer` in its settings, cookies will be issued for `okta.com` and will be first-party to `okta.com` but third-party to `mycompany.com`. 


### Third-party cookie deprecation when using Agentless Desktop Single Sign-on

If you have a Custom Domain or Self-Hosted Sign-in Widget deployment model and use Agentless Desktop Single Sign-on (ADSSO), follow the steps in the [Third Party Cookies Utilized by the Sign-in Widget](https://support.okta.com/help/s/article/third-party-cookies-utilized-by-the-sign-in-widget) Knowledge Base article to enable `CookiesAllowedforURLs` in Chrome browsers. 

### Third-party cookie deprecation affects "remember me" features

"Remember Last Used Factor" (RLUF), for automatically selecting the user's preferred factor, uses third-party cookies. The "keep me signed in" feature of Okta Identity Engine and "Remember me" feature of Okta Classic rely on third-party cookies when the login application is on a different domain from the main app.  

## When will this affect you? 

Google has made an exemption for Okta's third-party cookies until the end of 2024. However, you can set Chrome's flags to simulate how the browser will treat Okta's third-party cookies after that exemption ends. Although Google has changed [their timeline](https://developers.google.com/privacy-sandbox/3pcd), Okta recommends that you take action as soon as possible, to allow time for proper testing and potential unforeseen issues.

### Test your application today!

To simulate how Chrome will treat Okta's third-party cookies in 2025 and beyond, follow [the Okta help center's testing guide](https://support.okta.com/help/s/article/deprecation-of-3rd-party-cookies-in-google-chrome?language=en_US). 

## What's next? 

Here on the Okta Developer Blog, we'll keep you updated about how to mitigate each type of third-party cookie impact.

* Learn more about [how blocking third-party cookies affects Okta environments](https://support.okta.com/help/s/article/FAQ-How-Blocking-Third-Party-Cookies-Can-Potentially-Impact-Your-Okta-Environment?language=en_US).
* See the [Okta session cookies guide](https://developer.okta.com/docs/guides/session-cookie/main/) for more on how cookies are used.
* [Use Chrome's feature flags](https://support.okta.com/help/s/article/deprecation-of-3rd-party-cookies-in-google-chrome?language=en_US) to test your login experience with third-party cookies disabled.
* Read the [Third Party Cookies Utilized by the Sign-in Widget](https://support.okta.com/help/s/article/third-party-cookies-utilized-by-the-sign-in-widget) Knowledge Base article
