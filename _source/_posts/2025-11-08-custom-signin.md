---
layout: blog_post
title: "Stretch Your Imagination and Build a Delightful Sign-In Experience"
author: [emmanuel-folaranmi, alisa-duncan]
by: advocate
communities: [devops,mobile,.net,java,javascript,go,php,python,ruby]
description: ""
tags: []
tweets:
- ""
- ""
- ""
image:
type: conversion
---

When you choose Okta as your IAM provider, one of the features you get access to is customizing your Okta-hosted Sign-In Widget (SIW), which is our recommended method for the highest levels of identity security. It's a customizable JavaScript component that provides a ready-made login interface you can use immediately as part of your web application. 

The Okta Identity Engine (OIE) utilizes authentication policies to drive authentication challenges, and the SIW supports various authentication factors, ranging from basic username and password login to more advanced scenarios, such as multi-factor authentication, biometrics, passkeys, social login, account registration, account recovery, and more. Under the hood, it interacts with Okta's APIs, so you don't have to build or manage complex auth logic yourself. It's all handled for you!

One of the perks of using the Okta SIW, especially with the 3rd Generation Standard (Gen3), is that customization is a configuration thanks to [design tokens](https://m3.material.io/foundations/design-tokens/overview), so you don't have to write CSS to style the widget elements.

## Style the Okta Sign-In Widget to match your brand

In this tutorial, we will customize the Sign In Widget for a fictional to-do app. Without any changes, when you try to sign in to your Okta account, you see something like this:

{% img blog/custom-signin/default-siw.jpeg alt:"Default Okta-hosted Sign-In Widget" width:"800" %}{: .center-image }

At the end of the tutorial, your login screen will look something like this 🎉

{% img blog/custom-signin/final-siw.jpeg alt:"A customized Okta-hosted Sign-In Widget with custom elements, colors, and styles" width:"800" %}{: .center-image }

We'll use the SIW gen3 along with new recommendations to customize form elements and style using design tokens.

**Table of Contents**{: .hide }
* Table of Contents
{% include toc.md %}

**Prerequisites**
To follow this tutorial, you need:
* An Okta account with the Identity Engine, such as the [Integrator Free account](https://developer.okta.com/signup/)
* Your own domain name
* A basic understanding of HTML, CSS, and JavaScript
* A brand design in mind. Feel free to tap into your creativity!

Let's get started!

## Customize your Okta-hosted sign-in page

Before we begin, you must configure your Okta org to use your custom domain. Custom domains enable code customizations, allowing us to style more than just the default logo, background, favicon, and two colors. Sign in as an admin and open the Okta Admin Console, navigate to **Customizations** > **Brands** and select **Create Brand +**.

Follow the [Customize domain and email](https://developer.okta.com/docs/guides/custom-url-domain/main/) developer docs to set up your custom domain on the new brand.

You can also follow this post if you prefer.

{% excerpt /blog/2023/01/12/signin-custom-domain %}

Once you have a working brand with a custom domain, select your brand to configure it.
First, navigate to **Settings** and select **Use third generation** to enable the SIW Gen3. **Save** your selection.

> Note
> The code in this post relies on using SIW Gen3. It will not work on SIW Gen2.

Navigate to **Theme**. You'll see a default brand page that looks something like this:

{% img blog/custom-signin/default-siw-styles.jpeg alt:"Default styles for the Okta-hosted SIW" width:"800" %}{: .center-image }

Let's start making it more aligned with the theme we have in mind. Change the primary and secondary colors, then the logo and favicon images with your preferred options

To change either color, click on the text field and enter the hex code for each. We're going for a bold and colorful approach, so we'll use `#ea3eda` as the primary color and `#ffa738` as the secondary color, and upload the logo and favicon images for the brand. Select **Save**..

Take a look at your sign-in page now by navigating to the sign-in URL for the brand. With your configuration, the sign-in widget looks more interesting than the default view, but we can make things even more exciting. 

Let's dive into the main task, customizing the signup page. On the **Theme** tab:
1. Select **Sign-in Page** in the dropdown menu
2. Select the **Customize** button
3. On the **Page Design** tab, select the **Code editor**  toggle to see a HTML page

> Note: You can only enable the code editor if you configure a [custom domain](https://developer.okta.com/docs/guides/custom-url-domain/).

## Understanding the Okta-hosted Sign-In Widget default code

If you're familiar with basic HTML, CSS, and JavaScript, the sign-in code appears standard, although it's somewhat unusual in certain areas. There are two major blocks of code we should examine: the top of the `body` tag on the page and the sign-in configuration in the `script` tag.

The first one looks something like this:

```html
<div id="okta-login-container"></div>
```

The second looks like this:

```js
var config = OktaUtil.getSignInWidgetConfig();

// Render the Okta Sign-In Widget
var oktaSignIn = new OktaSignIn(config);
oktaSignIn.renderEl({ el: '#okta-login-container' },
  OktaUtil.completeLogin,
  function(error) {
    // Logs errors that occur when configuring the widget.
    // Remove or replace this with your own custom error handler.
    console.log(error.message, error);
  }
);
```

Let's take a closer look at how this code works. In the HTML, there's a designated parent element that the `OktaSignIn` instance uses to render the SIW as a child node. This means that when the page loads, you'll see the `<div id="okta-login-container"></div>` in the DOM with the HTML elements for SIW functionality as its child within the `div`. The SIW handles all authentication and user registration processes as defined by policies, allowing us to focus entirely on customization.

To create the SIW, we need to pass in the configuration. The configuration includes properties like the theme elements and messages for labels. The method `renderEl()` identifies the HTML element to use for rendering the SIW. We're passing in `#okta-login-container` as the identifier.

Note: "#okta-login-container" is a [CSS selector](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_selectors). While any correct CSS selector works, we recommend you use the ID of the element. Element IDs must be unique within the HTML document, so this is the safest and easiest method.

## Customize the UI elements within the Okta Sign-in Widget

Now that we have a basic understanding of how the Okta Sign-In Widget works, let's start customizing the code. We'll start by customizing the elements within the SIW. To manipulate the Okta SIW DOM elements in Gen3, we use the `afterTransform` method. The `afterTransform` method allows us to remove or update elements for individual or all forms.

Find the button **Edit** on the **Code editor** view, which makes the code editor editable and behaves like a lightweight IDE.

Below the `oktaSignIn.renderEl()` method within the `<script>` tag, add

```js
oktaSignIn.afterTransform('identify', ({ formBag }) => {
  const title = formBag.uischema.elements.find(ele => ele.type === 'Title');
  if (title) {
    title.options.content = "Log in and create a task";
  }

  const help = formBag.uischema.elements.find(ele => ele.type === 'Link' && ele.options.dataSe === 'help');
  const unlock = formBag.uischema.elements.find(ele => ele.type === 'Link' && ele.options.dataSe === 'unlock');
  const divider = formBag.uischema.elements.find(ele => ele.type === 'Divider');
  formBag.uischema.elements = formBag.uischema.elements.filter(ele => ![help, unlock, divider].includes(ele));
});
```

This `afterTransform` hook only runs before the 'identify' form. We can find and target UI elements using the `FormBag`. The `afterTransform` hook is a more streamlined way to manipulate DOM elements within the SIW before rendering the widget. For example, we can search elements by type to filter them out of the view before rendering, which is more performant than manipulating DOM elements after SIW renders. We filtered out elements such as the `unlock` account element and dividers in this snippet.

Let's take a look at what this looks like. Press **Save to draft** and **Publish**.

Navigate to your sign-in URL for your brand to view your changes. When we compare to the default state, we no longer see the horizontal rule below the logo or the "Help" link. The account unlock element is no longer available.

We explored how we can customize the widget elements. Now, let's add some flair.

## Organize your Sign-In Widget customizations with CSS Custom properties

At its core, we're styling an HTML document. This means we operate on the SIW customization in the same way as we would any HTML page, and code organization principles still apply. We can define customization values as [CSS Custom properties](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_cascading_variables/Using_CSS_custom_properties) (also known as CSS variables). Before jumping into code edits, identify the fonts you want for your customization. We found a header and body font to use.

Open the SIW code editor for your brand and select **Edit** to make changes. 

Import the fonts into the HTML. You can `<link>` or `@import` the fonts based on your preference. We added the `<link>` instructions to the `<head>` of the HTML.

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter+Tight:ital,wght@0,100..900;1,100..900&family=Manrope:wght@200..800&display=swap" rel="stylesheet">
```

Find the `<style nonce="{{nonceValue}}">` tag. Immediately within the tag, define your properties using the `:root` selector:

```css
:root {
    --color-gray: #4f4f4f;
    --color-fuchsia: #ff3fed;
    --color-orange: #ffac2f;
    --color-azul: #016fb9;
    --color-cherry: #ea3e84;
    --color-purple: #b13fff;
    --color-black: #191919;
    --color-white: #fefefe;
    --color-bright-white: #fff;
    --border-radius: 4px;
    --font-header: 'Inter Tight', sans-serif;
    --font-body: 'Manrope', sans-serif;
 }
```

Feel free to add new properties or replace the property value for your brand. This is a good opportunity to add your own brand colors and customizations!

Defining properties within variables keeps our code [DRY](https://en.wikipedia.org/wiki/Don%27t_repeat_yourself). Let's configure the SIW with our variables using design tokens.

Find `var config = OktaUtil.getSignInWidgetConfig();`. Immediately after this line of code, set the values of the design tokens using your CSS Custom properties. You'll use the `var()` function to access your variables:


```js
config.theme = {
  tokens: {
    BorderColorDisplay: 'var(--color-bright-white)',
    PalettePrimaryMain: 'var(--color-fuchsia)',
    PalettePrimaryDark: 'var(--color-purple)',
    PalettePrimaryDarker: 'var(--color-purple)',
    BorderRadiusTight: 'var(--border-radius)',
    BorderRadiusMain: 'var(--border-radius)',
    PalettePrimaryDark: 'var(--color-orange)',
    FocusOutlineColorPrimary: 'var(--color-azul)',
    TypographyFamilyBody: 'var(--font-body)',
    TypographyFamilyHeading: 'var(--font-header)',
    TypographyFamilyButton: 'var(--font-header)',
    BorderColorDangerControl: 'var(--color-cherry)'
  }
}
```

Save your changes, publish the page, and view your brand's sign-in URI site. Yay! You see, there's no border outline, the border radius of the widget and HTML elements changed, a different focus color, and a different color for element outlines when there's a form error. You can inspect the HTML elements and view the computed styles. Or if you prefer, feel free to update the CSS variables to something more visible. 

When you inspect your brand's sign-in URL site, you'll notice that the fonts aren't loading properly and that there are errors in your browser's debugging console. This is because you need to configure Content Security Policies (CSP) to allow resources loaded from external sites. CSPs are a security measure to mitigate cross-site scripting (XSS) attacks. You can read [An Overview of Best Practices for Security Headers](/blog/2021/10/18/security-headers-best-practices)  to learn more about CSPs.

Navigate to the **Settings** tab for your brand's **Sign-in page**. Find the **Content Security Policy** and press **Edit**. Add the domains for external resources. In our example, we only load resources from Google Fonts, so we added the following two domains:

```
*.googleapis.com
*.gstatic.com
```

Press **Save to draft** and press **Publish** to view your changes. The SIW now displays the fonts you selected!

## Extending the SIW theme with a custom color palette

In our example, we selectively added colors. The SIW design system adheres to WCAG accessibility standards and relies on [Material Design](https://m2.material.io/) color palettes.

Okta generates colors based on your primary color that conform to accessibility standards and contrast requirements. Check out [Understand Sign-In Widget color customization](https://help.okta.com/oie/en-us/content/topics/settings/branding-siw-color-contrast.htm) to learn more about color contrast and how Okta color generation works. You need to supply accessible colors to the configuration.

Material Design supports themes by customizing color palettes. The [list of all configurable design tokens](https://developer.okta.com/docs/guides/custom-widget-gen3/main/#use-design-tokens) displays all available options, including `Hue*` properties for precise color control. Consider exploring color palette customization options tailored to your brand's specific needs. You can use Material palette generators such as [this color picker](https://m2.material.io/inline-tools/color/) from the Google team or an open source [Material Design Palette Generator](https://materialpalettes.com/) that allows you to enter a HEX color value. 

Don't forget to keep accessibility in mind. You can run an accessibility audit using [Lighthouse](https://developer.chrome.com/docs/lighthouse/overview) in the Chrome browser. Our selected primary color doesn't quite meet contrast requirements. 😅

## Add custom HTML elements to the Sign-In Widget

Previously, we filtered HTML elements out of the SIW. We can also add new custom HTML elements to SIW. We'll experiment by adding a link to the Okta Developer blog. Find the `afterTransform()` method. Update the `afterTransform()` method to look like this:

```js
oktaSignIn.afterTransform('identify', ({formBag}) => {
  const title = formBag.uischema.elements.find(ele => ele.type === 'Title');
  if (title) {
    title.options.content = "Log in and create a task";
  }

  const help = formBag.uischema.elements.find(ele => ele.type === 'Link' && ele.options.dataSe === 'help');
  const unlock = formBag.uischema.elements.find(ele => ele.type === 'Link' && ele.options.dataSe === 'unlock');
  const divider = formBag.uischema.elements.find(ele => ele.type === 'Divider');
  formBag.uischema.elements = formBag.uischema.elements.filter(ele => ![help, unlock, divider].includes(ele));

  const blogLink = {
    type: 'Link',
    contentType: 'footer', 
    options: {
      href: 'https://developer.okta.com/blog',
      label: 'Read our blog',
      dataSe: 'blogCustomLink'
    }
  };
  formBag.uischema.elements.push(blogLink);
});
```

We created a new element named `blogLink` and set properties such as the type, where the content resides, and options related to the `type`. We also added a `dataSe` property that adds the value `blogCustomLink` to an [HTML data attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/How_to/Use_data_attributes). Doing so makes it easier for us to select the element for customization or for testing purposes.

## Overriding Okta Sign-In Widget element styles

We should utilize design tokens for customizations wherever possible. In cases where a design token isn't available for your styling needs, you can fall back to defining style manually.

Let's start with the element we added, the blog link. Let's say we want to display the text in capital casing. It's not good practice to define the label value using capital casing for accessibility. We should use CSS to transform the text.

In the styles definition, find the `#login-bg-image-id`. After the styles for the background image, add the style to target the `blogCustomLink` data attribute and define the text transform like this:

```css
a[data-se="blogCustomLink"] {
    text-transform: uppercase;
}
```

Save and publish the page to check out your changes.

Now, let's say you want to style an Okta-provided HTML element. Once again, if you can use design tokens, you should, but in select cases, we can do this carefully. 

Here's a terrible example of styling an Okta-provided HTML element that you should never emulate, lest you get in trouble with your branding team. Let's say you want something to change when the user hovers over the logo, such as adding a party face emoji after the logo. 

Inspect the SIW element you want to style. We want to style the `h2` element within the `div` with the data attribute `okta-sign-in-header`.

Always use the data attribute in cases like this. Fortunately, the Gen3 SIW supports the SCSS format (Sassy CSS), making the CSS cleaner to read. After the `blogCustomLink` style, add the following:

```scss
div[data-se*="okta-sign-in-header"] {
  & > h1:hover::after {
    content: "\1F973";
  }
}
```

Save and publish the site. When you hover over the logo, you'll see 🥳 emoji. Such a party!

The danger with this approach is that there are no guarantees that the data attribute remains unchanged. If you do style an Okta-hosted widget element, always pin the SIW version so your customizations don't break from under you. Navigate to the **Settings** tab and find the **Sign-In Widget version** section. Select **Edit** and select the most recent version of the widget, as this one should be compatible with your code. We are using widget version 7.36 in this post.

> Note!
> When you pin the widget, you won't get the latest and greatest updates from the SIW without manually updating the version. For the most secure option, allow SIW to update automatically and avoid overly customizing the SIW with CSS. Use the design tokens wherever possible.

Your final code might look something like this:

{% raw %}
```html
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<html>

<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="robots" content="noindex,nofollow" />
    <!-- Styles generated from theme -->
    <link href="{{themedStylesUrl}}" rel="stylesheet" type="text/css">
    <!-- Favicon from theme -->
    <link rel="shortcut icon" href="{{faviconUrl}}" type="image/x-icon">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link
        href="https://fonts.googleapis.com/css2?family=Inter+Tight:ital,wght@0,100..900;1,100..900&family=Manrope:wght@200..800&display=swap"
        rel="stylesheet">
    <title>{{pageTitle}}</title>
    {{{SignInWidgetResources}}}

    <style nonce="{{nonceValue}}">
        :root {
            --font-header: 'Inter Tight', sans-serif;
            --font-body: 'Manrope', sans-serif;
            --color-gray: #4f4f4f;
            --color-fuchsia: #ff3fed;
            --color-orange: #ffac2f;
            --color-azul: #016fb9;
            --color-cherry: #ea3e84;
            --color-purple: #b13fff;
            --color-black: #191919;
            --color-white: #fefefe;
            --color-bright-white: #fff;
            --border-radius: 4px;
        }

        {{ #useSiwGen3 }}

        html {
            font-size: 87.5%;
        }

        {{ /useSiwGen3 }}

        #login-bg-image-id {
            background-image: {{bgImageUrl}};
        }

        div[data-se*="okta-sign-in-header"] {
            &>h1:hover::after {
                content: "\1F973";
            }
        }

        a[data-se="blogCustomLink"] {
            text-transform: uppercase;
        }
    </style>
</head>

<body>
    <div id="login-bg-image-id" class="login-bg-image tb--background"></div>
    <div id="okta-login-container"></div>



    <!--
   "OktaUtil" defines a global OktaUtil object
   that contains methods used to complete the Okta login flow.
-->
    {{{OktaUtil}}}


    <script type="text/javascript" nonce="{{nonceValue}}">
        // "config" object contains default widget configuration
        // with any custom overrides defined in your admin settings.

        const loginContainer = document.querySelector("#okta-login-container");

        const config = OktaUtil.getSignInWidgetConfig();
        config.theme = {
            tokens: {
                BorderColorDisplay: 'var(--color-bright-white)',
                PalettePrimaryMain: 'var(--color-fuchsia)',
                PalettePrimaryDark: 'var(--color-purple)',
                PalettePrimaryDarker: 'var(--color-purple)',
                BorderRadiusTight: 'var(--border-radius)',
                BorderRadiusMain: 'var(--border-radius)',
                PalettePrimaryDark: 'var(--color-orange)',
                FocusOutlineColorPrimary: 'var(--color-azul)',
                TypographyFamilyBody: 'var(--font-body)',
                TypographyFamilyHeading: 'var(--font-header)',
                TypographyFamilyButton: 'var(--font-header)',
                BorderColorDangerControl: 'var(--color-cherry)'
            }
        }

        // Render the Okta Sign-In Widget
        const oktaSignIn = new OktaSignIn(config);
        oktaSignIn.renderEl({ el: '#okta-login-container' },
            OktaUtil.completeLogin,
            function (error) {
                // Logs errors that occur when configuring the widget.
                // Remove or replace this with your own custom error handler.
                console.log(error.message, error);
            }
        );

        oktaSignIn.afterTransform('identify', ({ formBag }) => {
            const title = formBag.uischema.elements.find(ele => ele.type === 'Title');
            if (title) {
                title.options.content = "Log in and create a task";
            }

            const help = formBag.uischema.elements.find(ele => ele.type === 'Link' && ele.options.dataSe === 'help');
            const unlock = formBag.uischema.elements.find(ele => ele.type === 'Link' && ele.options.dataSe === 'unlock');
            const divider = formBag.uischema.elements.find(ele => ele.type === 'Divider');
            formBag.uischema.elements = formBag.uischema.elements.filter(ele => ![help, unlock, divider].includes(ele));

            const blogLink = {
                type: 'Link',
                contentType: 'footer',
                options: {
                    href: 'https://developer.okta.com/blog',
                    label: 'Read our blog',
                    dataSe: 'blogCustomLink'
                }
            };
            formBag.uischema.elements.push(blogLink);
        });

    </script>


</body>

</html>
```
{% endraw %}

You can also find the code in the GitHub repository for this blog post. With these code changes, you can connect this with an app to see how it works end-to-end. You'll need to update your Okta OpenID Connect (OIDC) application to work with the domain. In the Okta Admin Console, navigate to **Applications** > **Applications** and find the Okta application for your custom app. Navigate to the **Sign On** tab. You'll see a section for **OpenID Connect ID Token**. Select **Edit** and select **Custom URL** for your brand's sign-in URL as the **Issuer** value. 

You'll use the issuer value, which matches your brand's custom URL, and the Okta application's client ID in your custom app's OIDC configuration. If you want to try this and don't have a pre-built app, you can use one of our samples, such as the [Okta React sample](https://github.com/okta-samples/okta-react-sample).

## Customize your Gen3 Okta-hosted Sign-In Widget

I hope you enjoyed customizing the sign-in experience for your brand. Using the Okta-hosted Sign-In widget is the best, most secure way to add identity security to your sites. With all the configuration options available, you can have a highly customized sign-in experience with a custom domain without anyone knowing you're using Okta. 

If you like this post, there's a good chance you'll find these links helpful:
 * [Create a React PWA with Social Login Authentication](/blog/2025/07/22/react-pwa)
 * [Secure your first web app](https://developer.okta.com/docs/journeys/OCI-secure-your-first-web-app/main/)
 * [How to Build a Secure iOS App with MFA](/blog/2025/08/20/ios-mfa)


Remember to follow us on [Twitter](https://twitter.com/oktadev) and subscribe to our [YouTube](https://www.youtube.com/c/OktaDev/) channel for fun and educational content. We also want to hear from you about topics you want to see and questions you may have. Leave us a comment below! Until next time!
