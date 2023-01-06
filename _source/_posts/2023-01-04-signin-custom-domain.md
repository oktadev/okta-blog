---
layout: blog_post
title: "A Secure and Themed Sign-in Page"
author: alisa-duncan
by: advocate
communities: [security,.net,java,javascript,go,php,python,ruby]
description: "Redirecting to the Okta-hosted sign-in page is the most secure way to authenticate users in your application. But the default configuration yield a very neutral sign-in page. This post walks you through customization options and setting up a custom domain so the personality of your site shines all through the user's experience."
tags: [security, theming]
tweets:
- "Add some flair to your sign-in process by following the quick steps in this post!"
image: blog/signin-custom-domain/social.jpg
type: awareness
---

Creating secure applications requires authentication. Delegating all the tedious details of the sign-in process to Okta is the most secure method to authenticate, not to mention speedier for development. So you'll see us advocating for and using the Okta-hosted sign-in page in our blog posts.

But the default sign-in page can look too different from the personality you have in your application. And the login URL redirects to a domain outside your application, which is also different from what we want. Fortunately, you can add some flair to your Okta-hosted sign-in page, allowing your application's character to carry through in the user authentication process while maintaining the highest level of security. In other words, winning with the best of both worlds.

![Giphy of Awkafina holding a trophy with confetti falling around her](https://media.giphy.com/media/26u4cqiYI30juCOGY/giphy.gif){: .center-image }

This post walks you through how to customize your sign-in page using a custom domain and by selecting fun styles using Okta-hosted redirect model. We'll use a pre-existing e-commerce cupcake site built using an Angular Micro frontend application and customize the sign-in page to be full of mouth-watering cupcakes. 😋

> **Note**
The process outlined in this post is not Angular-dependent, so feel free to substitute the web app with your favorite SPA application.

{% img blog/signin-custom-domain/themed-sign-in.gif alt:"Animated gif of sign-in from a cupcake site" width:"800" %}{: .center-image }

**Prerequisites**
- [Node](https://nodejs.org/)
- [Okta CLI](https://cli.okta.com)
- ***Optional** Domain name you own and access to administrate DNS of the domain

{% include toc.md %}

## Prepare your Okta account and Okta application
You'll need an Okta account. If you already have one and an Okta application you want to use for this tutorial, feel free to skip this section. Otherwise, let's continue!

{% include setup/cli.md type="spa" framework="Angular" loginRedirectUri="http://localhost:4200/login/callback" logoutRedirectUri="http://localhost:4200" %}

Note the `Issuer` and the `Client ID`. You'll need those values to configure Okta in the web app.

## Theme the Okta-hosted sign-in page
Let's make the sign-in page more enticing by beautifying it with a cupcake or whatever theme sparks joy.

You can make these customizations in the Admin Console through the Okta Dashboard or API calls. We'll use the Okta Dashboard in this post, but let me know in a comment below if you want to see the API calls' instructions.

To get to the Okta Dashboard, navigate to [developer.okta.com](https://developer.okta.com) and sign in. Notice the sign-in page looks neutral. It will look much more delightful after we apply the customization changes.

Once you've authenticated, you'll see your Okta Dashboard.

Access the Admin Console by pressing the **Admin** button in the toolbar at the top of the page. You'll encounter a sign-in challenge, and once you emerge victorious, you'll be in the Admin Console.

Navigate to **Customizations** > **Branding** on the sidebar. Here you can theme your login page. Select your primary and secondary colors used within the sign-in widget. Add a logo, a favicon, and optionally add a background image. Press the **Edit** button for **Okta-hosted Sign-In Page**, select your background style and save your changes. 

{% img blog/signin-custom-domain/cupcake-theme.jpg alt:"Screenshot of customizations showing color selections, a logo, a favicon, and a background image" width:"800" %}{: .center-image }

My selections are full of colorful, happy cupcakes — a theme that sparks joy for me and matches the personality of my cupcakes e-commerce site.

Sign out of the Okta Dashboard and sign back in to see your new sign-in page in action! My sign-in page makes me smile. 😊

{% img blog/signin-custom-domain/sign-in-page.jpg alt:"Screenshot of themed sign-in page featuring cupcakes" width:"800" %}{: .center-image }

## Customize the sign-in URL with a custom domain

Next, let's tackle the sign-in redirect URL to have a domain name that matches our application. Feel free to skip this section to see the themed sign-in page in a web application if you don't have a custom domain.

In the Admin Console, navigate to **Customization** > **Domain** in the sidebar. Press the **Edit** button to start the customized URL process. Be sure to have access to your Domain Name Registrar so you can make the required modifications. You will also need to allow Okta to manage a TLS certificate or provide your own. In the following steps, we'll have Okta manage the certificate. Press the **Get started** button to continue.

{% img blog/signin-custom-domain/custom-url-domain.jpg alt:"Screenshot of Admin console starting the custom domain configuration" width:"800" %}{: .center-image }

In the next screen, add the domain name you want to use for the sign-in URL and select **Okta-managed** for your certificate. Staying true to my cupcake theme, I have a cupcake-based domain name and added a subdomain for the sign-in URL. Press **Next**.

The next screen has instructions for you to update the DNS records in your Domain Name Registrar. The instructions to do so depend on your registrar, so you'll need to follow the instructions your registrar provides. 😅 You got this! 💪

The final step to customize the URL for your domain is configuring your Okta application. In the Admin Console, navigate to **Applications** > **Applications** and find the Okta application you're using in this tutorial. It might be the one you created earlier in the post or already had. Navigate to the **Sign On** tab. You'll see a section for **OpenID Connect ID Token** where you'll select the URL. Press **Edit** and choose your URL for the **Issuer**.

{% img blog/signin-custom-domain/custom-domain-application.jpg alt:"Screenshot of configuring the Okta application to select the custom domain URL" width:"800" %}{: .center-image }

The DNS changes may take a few minutes to propagate, so prepare a soothing cup of tea to decompress from that DNS work while you wait. Let's see how the sign-in page looks in a web app with a matching theme!

## Set up the Angular Micro-frontend site and add Okta
To reduce the overhead of creating a web app, we'll use an existing sample cupcake e-commerce app. Grab the pre-built [Angular application from the GitHub repo](https://github.com/oktadev/okta-angular-microfrontend-example/tree/deploy) by running the following commands in your terminal:

```shell
git clone --branch deploy https://github.com/oktadev/okta-angular-microfrontend-example.git
npm ci
```

Open the project in your favorite IDE.

The site already includes the libraries required to authenticate using Okta. You'll need to configure the app with the `Issuer` and `Client ID`. 

Open `projects/shell/src/app/app.module.ts`. Find the following code block and replace `{yourDomain}` and `{yourClientID}` with your Okta application values. If you used a custom domain, the `{yourDomain}` domain value is the issuer value from the previous step. If you didn't set up a custom domain, `{yourDomain}` is the issuer value generated in the output of the Okta CLI.

```ts
const oktaAuth = new OktaAuth({
  issuer: 'https://{yourDomain}/oauth2/default',
  clientId: '{yourClientID}',
  redirectUri: window.location.origin + '/login/callback',
  scopes: ['openid', 'profile', 'email']
});
```

Now we can run the site. Start the app by running the following command:

```sh
npm run run:all
```

This command opens three tabs in your browser. Find the one running at port 4200 with beautiful pictures of cupcakes and try signing in. The Okta-hosted sign-in page looks more themed, and better matches the application! If you set up a custom domain, you'll see the domain name matches your application too! 🧁

{% img blog/signin-custom-domain/themed-sign-in.gif alt:"Animated gif of sign-in from a cupcake site" width:"800" %}{: .center-image }

If you want to read about creating an Angular Micro frontend and sharing Okta authentication state across your micro frontend applications, check out the two post series starting with [How to Build Micro Frontends Using Module Federation in Angular](/blog/2022/05/17/angular-microfrontend-auth).

## Learn more about styling the sign-in page and creating web apps quickly

If you liked this post, you might be interested in these links.
* [Style the sign-in page guide](https://developer.okta.com/docs/guides/custom-widget/main/)
* [Customize your Okta experience with the Brands API](https://developer.okta.com/docs/guides/customize-themes/)
* [Customize domain and email address](https://developer.okta.com/docs/guides/custom-url-domain/main/)
* [How to Build Micro Frontends Using Module Federation in Angular](/blog/2022/05/17/angular-microfrontend-auth)
* [Quick JavaScript Authentication with OktaDev Schematics](/blog/2022/10/14/quick-javascript-authentication)

Remember to follow us on [Twitter](https://twitter.com/oktadev) and subscribe to our [YouTube channel](https://www.youtube.com/c/OktaDev/) for more great tutorials. We'd also love to hear from you! Please comment below if you have any questions or want to share what tutorial you'd like to see next.
