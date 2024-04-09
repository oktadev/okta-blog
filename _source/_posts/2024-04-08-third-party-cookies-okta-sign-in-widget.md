---
layout: blog_post
title: "How to Prepare Your Self-Hosted Okta Sign-in Widget to Work without Third-Party Cookies"
author: edunham
by: advocate
communities: [devops,security,mobile,.net,java,javascript,go,php,python,ruby]
description: "If you have a self-hosted Okta Sign-In Widget, there are several options to mitigate Chrome's third-party cookies deprecation."
tags: [third-party-cookies, okta-sign-in-widget, auth-js-sdk]
tweets:
- ""
- ""
- ""
image: blog/3pc/3pcd-siw.jpg
type: awareness
---

If you use Okta's embedded Sign-In Widget, users logging in via Chrome may encounter problems starting January 1st 2025. That's when Okta's extension to Google disabling the use of third-party cookies ends.

You can test if your setup is impacted, and if so, implement one of the recommended fixes. To test your setup, see Test your login experience below. There's also a temporary solution, though that stops working at the end of 2024.

## Update your Application
There are four different ways you can update your flow to remove third-party cookies:

* Use first-party cookies
* Use an authorization code flow
* Configure AuthJS to use offline access
* Transition to supported endpoints (sessions/me is deprecated)

Think about your current needs and any future development plans when you choose a solution. Once you've implemented a solution, test it using the information in Test your login experience.

### Use first-party cookies by configuring a custom domain

You may be able to use this solution if your apps are hosted on your domain. Usually the URL for those apps starts with something like app.yourdomain.com.

Usually the session cookie is issued from your Okta domain host, from yourdomain.okta.com. Because of that it looks like a third-party cookie to your own domain. To make it a first party cookie, you can configure a custom domain in the Okta admin console so that it's issued from `okta.yourdomain.com`.

The custom domain for your Okta organization should be a subdomain of your own domain. If you don't use network zones, you can use an Okta-managed [TLS](https://en.wikipedia.org/wiki/Transport_Layer_Security) certificate for a custom domain. If you do use network zones, you'll need to provide your own TLS cert by following [Okta's instructions](https://developer.okta.com/docs/guides/custom-url-domain/main/#use-your-own-tls-certificate).

#### To configure your custom domain:

1. Open the Admin console for your Okta org.
2. In the Admin Console, select **Customizations**.
3. Select **Domain** in the customization list.
4. In the **Custom URL Domain** section, click **Edit** and follow the instructions on the page that appears.

If you have customized the look and feel of the Okta sign-in page using resources like images that are hosted on other domains, you will need to configure the Content Security Policy (CSP) to allow those resources. Learn more about customizing your CSP in [this Okta help center guide](https://help.okta.com/oie/en-us/content/topics/settings/customizations-configure-csp.htm). 

### Use the authorization code flow

Changing your application to use [the authorization code flow](https://developer.okta.com/docs/guides/implement-grant-type/authcode/main/) ensures that your sign-in widget functions in browsers with third-party cookies disabled. 

#### To change an Okta application to use the authorization code flow:

1. Open the Admin console for your Okta org.
2. In the Admin Console, select Applications > Applications.
3. Open the desired app integration.
4. Select General.
5. In the General Settings section, select the Refresh Token grant type and configure the desired token rotation policy. "Rotate token after every use" is the most secure option and is suitable for most cases.

For more information on the authorization code flow, see [Get a refresh token with the code flow in Refresh access tokens](https://developer.okta.com/docs/guides/refresh-tokens/main/#get-a-refresh-token-with-the-code-flow).


### Configure AuthJS to use offline access

If you use AuthJS and your testing reveals problems with your applications when third-party cookies are disabled, a single setting change may solve them.

AuthJS defaults to using `getWithoutPrompt` when performing token renewal. The `getWithoutPrompt` setting uses a hidden iframe and third-party cookies for the login experience. Setting the `offline_access` scope causes your AuthJS application to use session tokens instead of cookies.

Just like other scopes, the `offline_access` scope must be enabled in both the Okta admin console and in your application code. Once you set the `offline_access` scope on your Authorization Server and in your AuthJS code, AuthJS uses refresh tokens instead of cookies. 

To set the `offline_access` scope on the Authorization Server: 

1) Open the Admin console for your Okta org.
2) In the side menu of the Admin Console, navigate to **Security** and select **API**.
3) In the **Authorization Servers** tab, click the pencil-shaped Edit icon to the right of the authorization server that your application uses.
4) Navigate to the **Scopes** tab of the authorization server's page
5) Use the **Add Scope** button to add the `offline_access` scope.

To set the `offline_access` scope in your AuthJS code, add `offline_access` to the `scopes` array in your `OktaAuth` configuration. This configuration is found in the file where you [initialize the SDK](https://developer.okta.com/docs/guides/auth-js/main/#initialize-the-sdk).

> **Note**
>
> This to edit a [custom authorization server](https://developer.okta.com/docs/concepts/auth-servers/#custom-authorization-server) requires the feature [API Access Management](https://www.okta.com/products/api-access-management/?adgroupid=&campaignid=&utm_source=google&utm_campaign=amer_mult_usa_all_wf-all_dg-ao_a-wf_search_google_text_kw_dsa_utm2&utm_medium=cpc&utm_id=aNK4z000000UAzJGAW&gad_source=1&gclid=Cj0KCQjwztOwBhD7ARIsAPDKnkD3WQMla4xEM7GwHXqaQt-O2IF6mH1x5dadKgpUp4rH12IYyZQgjP4aApevEALw_wcB) enabled.

## Transition to supported endpoints

If your code is using the deprecated `sessions/me` endpoint, read the data from other endpoints.

Replace calls to `api/v1/sessions/me/lifecycle/refresh` by using the [refresh tokens](https://developer.okta.com/docs/guides/refresh-tokens/main/).

If you were using the HTTP Header Prefer with the `sessions/me` API, extend the application session by [using your refresh token](https://developer.okta.com/docs/guides/refresh-tokens/main/#use-a-refresh-token) instead.

Instead of calling `api/v1/sessions/me` for user information, use the OAuth introspect endpoint (https://developer.okta.com/docs/reference/api/oidc/#introspect). If the introspect endpoint's response is missing a piece of information that you want to use, add that information using [custom claims](https://developer.okta.com/docs/guides/customize-tokens-returned-from-okta/main/#add-a-custom-claim-to-a-token).

If you ended sessions with `<ApiOperation method="delete" url="/api/v1/sessions/me" />`, follow [this updated guidance](https://d28m3l9ryqsunl.cloudfront.net/docs/guides/sign-users-out/react-native/main/#sign-users-out-of-your-app) instead. Select your language or SDK from the "Instructions For" dropdown in that guide to see sample code for the revocation process.

## Test your Login Experience

Use a Chrome feature flag to disable third-party cookies to test how your app behaves when they're not supported. When testing, you should configure Chrome's feature flags as shown below and then use the parts of your application that might rely on Okta's cookies. 

### Setting Flags
See [Okta's help article](https://support.okta.com/help/s/article/deprecation-of-3rd-party-cookies-in-google-chrome) for more detail on testing. The short version is that you test in Chrome by visiting `chrome://flags/` and setting the following flags: 

* `chrome://flags#third-party-cookie-deprecation-trial` -> `enabled`
* `chrome://flags/#tracking-protection-3pcd` -> `enabled`
* `chrome://flags/#tpcd-metadata-grants` -> `disabled`

With these flags set, sign into Okta with your self-hosted sign-in widget. Check the Chrome developer console to see if your code is raising any errors, and verify that you're not prompted to log in again more often than you expect. 

### Application behaviors to look for

Cookies are used to introspect and extend the Okta session. If a third-party cookie was previously being used to introspect the session and gets blocked, you'll probably see errors in the developer console. If a third-party cookie was used to extend the session, when it's blocked you'll be logged out at session extension time. Note that this may occur some time after the login.

## Temporary fix in 2024

Google granted Okta an exemption to the third-party cookie deprecation rollout until the end of 2024. To opt in to this exemption, you embed an Okta-provided script into your sign-in widget following [these instructions](https://support.okta.com/help/s/article/third-party-cookies-utilized-by-the-sign-in-widget?language=en_US). The script sets a Trial token, which tells Google to continue allowing third-party cookies for your login experience until the end of 2024. 
