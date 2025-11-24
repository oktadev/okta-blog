---
layout: blog_post
title: "Unlock the Secrets of a Custom Sign-in Page with Tailwind and JavaScript"
author: alisa-duncan
by: advocate
communities: [javascript]
description: ""
tags: []
image:
type: conversion
---

We recommend redirecting users to authenticate via the Okta-hosted sign-in page powered by the Okta Identity Engine (OIE) for your custom-built applications. It's the most secure method for authenticating. You don't have to manage credentials in your code and can take advantage of the strongest authentication factors without requiring any code changes. 

The Okta Sign-In Widget (SIW) built into the sign-in page does the heavy lifting of supporting the authentication factors required by your organization. Did I mention policy changes won't need any code changes?

But you may think the sign-in page and the SIW are a little bland. And maybe too Okta for your needs? What if you can have a page like this?

{% img blog/okta-custom-sign-in-page/final-siw-desktop.jpg alt:"A customized Okta-hosted Sign-In Widget with custom elements, colors, and styles" width:"800" %}{: .center-image }

With a bright and colorful responsive design change befitting a modern lifestyle.

{% img blog/okta-custom-sign-in-page/final-siw-responsive.jpg alt:"A customized Okta-hosted Sign-In Widget with custom elements, colors, and styles for smaller form factors" width:"800" %}{: .center-image }

Let's add some color, life, and customization to the sign-in page. 

In this tutorial, we will customize the sign-in page for a fictional to-do app. We'll make the following changes:
  * Use [Tailwind](https://tailwindcss.com/) CSS framework to create a responsive sign-in page layout
  * Add a footer for custom brand links
  * Display a terms and conditions modal using [Alpine.js](https://alpinejs.dev) that the user must accept before authenticating

Take a moment to read this post on customizing the Sign-In Widget if you aren't familiar with the process, as we will be expanding from customizing the widget to enhancing the entire sign-in page experience.

{% excerpt /blog/2025/11/12/custom-signin %}

In the post, we covered how to style the Gen3 SIW using design tokens and customize the widget elements using the `afterTransform()` method. You'll want to combine elements of both posts for the most customized experience.

**Table of Contents**{: .hide }
* Table of Contents
{% include toc.md %}

**Prerequisites**

To follow this tutorial, you need:
* An Okta account with the Identity Engine, such as the [Integrator Free account](https://developer.okta.com/signup/).
* Your own domain name
* A basic understanding of HTML, CSS, and JavaScript
* A brand design in mind. Feel free to tap into your creativity!
* An understanding of customizing the sign-in page by following the previous blog post

Let's get started!

Before we begin, you must configure your Okta org to use your custom domain. Custom domains enable code customizations, allowing us to style more than just the default logo, background, favicon, and two colors. Sign in as an admin and open the Okta Admin Console, navigate to **Customizations** > **Brands** and select **Create Brand +**.

Follow the [Customize domain and email](https://developer.okta.com/docs/guides/custom-url-domain/main/) developer docs to set up your custom domain on the new brand.

## Customize your Okta-hosted sign-in page

We'll first apply the base configuration using the built-in configuration options in the UI. Add your favorite primary and secondary colors, then upload your favorite logo, favicon, and background image for the page. Select **Save** when done. Everyone has a favorite favicon, right? 

I'll use `#ea3eda` and `#ffa738` as the primary and secondary colors, respectively. 

On to the code. In the **Theme** tab:
1. Select **Sign-in Page** in the dropdown menu
2. Select the **Customize** button
3. On the **Page Design** tab, select the **Code editor**  toggle to see a HTML page

> Note: You can only enable the code editor if you configure a [custom domain](https://developer.okta.com/docs/guides/custom-url-domain/).

You'll see the lightweight IDE already has code scaffolded. Press **Edit** and replace the existing code with the following.

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
      --color-fuchsia: #ea3eda;
      --color-orange: #ffa738;
      --color-azul: #016fb9;
      --color-cherry: #ea3e84;
      --color-purple: #b13fff;
      --color-black: #191919;
      --color-white: #fefefe;
      --color-bright-white: #fff;
      --border-radius: 4px;
      --color-gradient: linear-gradient(12deg, var(--color-fuchsia) 0%, var(--color-orange) 100%);
    }

    {{#useSiwGen3}}
      html {
        font-size: 87.5%;
      }
    {{/useSiwGen3}}

    #okta-auth-container {
      display: flex;
      background-image: {{bgImageUrl}};
    }

    #okta-login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      width: 50vw;
      background: var(--color-white);
    }
  </style>
</head>

<body>  
  <div id="okta-auth-container">
    <div id="okta-login-container"></div>      
  </div>
    
  <!--
   "OktaUtil" defines a global OktaUtil object
   that contains methods used to complete the Okta login flow.
  -->
  {{{OktaUtil}}}

  <script type="text/javascript" nonce="{{nonceValue}}">
    // "config" object contains default widget configuration
    // with any custom overrides defined in your admin settings.

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

    config.i18n = {
      'en': {
        'primaryauth.title': 'Log in to create tasks',
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
  </script>
</body>
</html>
```
{% endraw %}

This code adds style configuration to the SIW elements and configures the text for the title when signing in. Press **Save to draft**.

We must allow Okta to load font resources from an external source, Google, by adding the domains to the allowlist in the Content Security Policy (CSP).

Navigate to the **Settings** tab for your brand's **Sign-in page**. Find the **Content Security Policy** and press **Edit**. Add the domains for external resources. In our example, we only load resources from Google Fonts, so we added the following two domains:

```
*.googleapis.com
*.gstatic.com
```

Select **Save to draft**, then **Publish** to view your changes. 

The sign-in page looks more stylized than before. Let's use Tailwind CSS to add a responsive layout.

## Use Tailwind CSS to build a responsive layout

Tailwind makes delivering cool-looking websites much faster than writing our CSS manually. We'll load Tailwind via CDN for our demonstration purposes.  

Add the CDN to your CSP allowlist:

```
https://cdn.jsdelivr.net
```

Navigate to **Page Design**, then **Edit** the page. Add the script to load the Tailwind resources in the `<head>`. I added it after the `<style></style>` definitions before the `</head>`.

```html
<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4" nonce="{{nonceValue}}"></script>
```

Loading external resources, like styles and scripts, requires a CSP nonce to mitigate cross-site scripting (XSS). You can read more about the CSP nonce on the [CSP Quick Reference Guide](https://content-security-policy.com/nonce/).

> **Note** 
>
> Don't use Tailwind from NPM CDN for production use cases. The Tailwind documentation notes this is for experimentation and prototyping only, as the CDN has rate limits. If your brand uses Tailwind for other production sites, you've most likely defined custom mixins and themes in Tailwind. Therefore, reference your production Tailwind resources in place of the CDN we're using in this post.

Remove the styles for `#okta-login-container` from the `<style></style>` section. We can use Tailwind to handle it. The `<style></style>` section should only contain the CSS custom properties defined in `:root`.

Add the styles for Tailwind. We'll add the classes to show the login container without the hero image in smaller form factors, then display the hero image with different widths depending on the breakpoints.

The two `div` containers look like this:

```html
<div id="okta-auth-container" class="h-screen flex bg-(--color-gray) bg-[{{bgImageUrl}}]">
  <div id="okta-login-container" class="w-full min-w-sm lg:w-2/3 xl:w-1/2 bg-(image:--color-gradient) lg:bg-none bg-(--color-white) flex justify-center items-center"></div>
</div>
```

Save the file and publish the changes. Feel free to test it out!

## Use Tailwind for custom HTML elements on your Okta-hosted sign-in page

Tailwind excels at adding styled HTML elements to websites. We can also take advantage of this. Let's say you want to maintain continuity of the webpage from your site through the sign-in page by adding a footer with links to your brand's sites. Adding this new section involves changing the HTML node structure and styling the elements.

We want a footer pinned to the bottom of the view, so we'll need a new parent container with vertical stacking and ensure the height of the footer stays consistent. Replace the HTML node structure to look like this:

```html
<div class="flex flex-col min-h-screen">        
  <div id="okta-auth-container" class="flex grow bg-(--color-gray) bg-[{{bgImageUrl}}]">
    <div class="w-full min-w-sm lg:w-2/3 xl:w-1/2 bg-(image:--color-gradient) lg:bg-none bg-(--color-white) flex justify-center items-center">
        <div id="okta-login-container"></div>
    </div>
  </div>
  <footer class="font-(family-name:--font-body)">
    <ul class="h-12 flex justify-evenly items-center text-(--color-azul)">
      <li><a class="hover:text-(--color-orange) hover:underline" href="https://developer.okta.com">Terms</a></li>
      <li><a class="hover:text-(--color-orange) hover:underline" href="https://developer.okta.com">Docs</a></li>
      <li><a class="hover:text-(--color-orange) hover:underline" href="https://developer.okta.com/blog">Blog</a></li>
      <li><a class="hover:text-(--color-orange) hover:underline" href="https://devforum.okta.com">Community</a></li>
    </ul>
  </footer>
</div>
```

Everything redirects to the Okta Developer sites. 😊 I also maintained the style of font, text colors, and text decoration styles to match the SIW elements. CSS custom properties make consistency manageable.

Feel free to save and publish to check it out! 

## Add custom interactivity on the Okta-hosted sign-in page using an external library

Tailwind is great at styling HTML elements, but it's not a JavaScript library. If we want interactive elements on the sign-in page, we must rely on Web APIs or libraries to assist us. Let's say we want to ensure that users who sign in to the to-do app agree to the terms and conditions. We want a modal that blocks interaction with the SIW until the user agrees. 

We'll use Alpine for the heavy lifting because it's a lightweight JavaScript library that suits this need. We add the library via the NPM CDN, as we have already allowed the domain in our CSP. Add the following to the `<head></head>` section of the HTML. I added mine directly after the Tailwind script.

```html
<script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js" nonce="{{nonceValue}}"></script>
```

Next, we add the HTML tags to support the modal. Replace the HTML node structure to look like this:

```html
<div class="flex flex-col min-h-screen">
  <div id="modal"
    x-data
    x-cloak
    x-show="$store.modal.open" 
    x-transition:enter="transition ease-out duration-300"
    x-transition:enter-start="opacity-0"
    x-transition:enter-end="opacity-100"
    x-transition:leave="transition ease-in duration-200"
    x-transition:leave-start="opacity-100"
    x-transition:leave-end="opacity-0 hidden"
    class="fixed inset-0 z-50 flex items-center justify-center bg-(--color-black)/80 bg-opacity-50">
    <div x-transition:enter="transition ease-out duration-300"
         x-transition:enter-start="opacity-0 scale-90"
         x-transition:enter-end="opacity-100 scale-100"
         x-transition:leave="transition ease-in duration-200"
         x-transition:leave-start="opacity-100 scale-100"
         x-transition:leave-end="opacity-0 scale-90"
         class="bg-(--color-white) rounded-(--border-radius) shadow-lg p-8 max-w-md w-full mx-4">
      <h2 class="text-2xl font-(family-name:--font-header) text-(--color-black) mb-4 text-center">Welcome to to-do app</h2>
      <p class="text-(--color-black) mb-6">This app is in beta. Thank you for agreeing to our terms and conditions.</p>
      <button @click="$store.modal.hide()" 
              class="w-full bg-(--color-fuchsia) hover:bg-(--color-orange) text-(--color-bright-white) font-medium py-2 px-4 rounded-(--border-radius) transition duration-200">
          Agree
      </button>
    </div>
  </div>        
  <div id="okta-auth-container" class="flex grow bg-(--color-gray) bg-[{{bgImageUrl}}]">
    <div class="w-full min-w-sm lg:w-2/3 xl:w-1/2 bg-(image:--color-gradient) lg:bg-none bg-(--color-white) flex justify-center items-center">
      <div id="okta-login-container"></div>
    </div>
  </div>
  <footer class="font-(family-name:--font-body)">
    <ul class="h-12 flex justify-evenly items-center text-(--color-azul)">
      <li><a class="hover:text-(--color-orange) hover:underline" href="https://developer.okta.com">Terms</a></li>
      <li><a class="hover:text-(--color-orange) hover:underline" href="https://developer.okta.com">Docs</a></li>
      <li><a class="hover:text-(--color-orange) hover:underline" href="https://developer.okta.com/blog">Blog</a></li>
      <li><a class="hover:text-(--color-orange) hover:underline" href="https://devforum.okta.com">Community</a></li>
    </ul>
  </footer>
</div>
```

It's a lot to add, but I want the smooth transition animations. 😅 The built-in enter and leave states make adding the transition animation so much easier than doing it manually.

Notice we're using a state value to determine whether to show the modal. We're using global state management, and setting it up is the next step. We'll add initializing the state when Alpine initializes. Find the comment `// Render the Okta Sign-In Widget` within the `<script></script>` section, and add the following code that runs after Alpine initializes: 

```js
document.addEventListener('alpine:init', () => {
  Alpine.store('modal', {
    open: true,
    show() {
      this.open = true;
    },
    hide() {
      this.open = false;
    }
  });
});
```

The event listener watches for the `alpine:init` event and runs a function that defines an element in Alpine's store, `modal`. The `modal` store contains a property to track whether it's open and some helper methods for showing and hiding.

When you save and publish, you'll see the modal upon site reload! 

{% img blog/okta-custom-sign-in-page/modal-siw.jpg alt:"A modal which displays on top of the sign-in page where the user must accept terms before continuing" width:"800" %}{: .center-image }

We made the modal fixed even if the user presses <kbd>Esc</kbd> or selects the scrim. Users must agree to the terms to continue.

## Customize Okta-hosted sign-in page behavior using Web APIs

We display the modal as soon as the webpage loads. It works, but we can also display the modal after the Sign-In Widget renders. Doing so allows us to use the nice enter and leave CSS transitions Alpine supports. We want to watch for changes to the DOM within the `<div id="okta-login-container"></div>`. This is the parent container that renders the SIW. We can use the [`MutationObserver` Web API](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver) and watch for DOM mutations within the `div`.

In the `<script></script>` section, after the event listener for `alpine:init`, add the following code:

```js
const loginContainer = document.querySelector("#okta-login-container");

// Use MutationObserver to watch for auth container element
const mutationObserver = new MutationObserver(() => {
  const element = loginContainer.querySelector('[data-se*="auth-container"]');
  if (element) {
    document.getElementById('modal').classList.remove('hidden');
    // Open modal using Alpine store
    Alpine.store('modal').show();
    // Clean up the observer
    mutationObserver.disconnect();
  }
});

mutationObserver.observe(loginContainer, {
  childList: true,
  subtree: true
});
```

Let's walk through what the code does. First, we're creating a variable to reference the parent container for the SIW, as we'll use it as the root element to target our work. Mutation observers can negatively impact performance, so it is essential to limit the scope of the observer as much as possible.

**Create the observer**

We create the observer and define the behavior for observation. The observer first looks for the element with the data attribute named `se`, which includes the value `auth-container`. Okta adds a node with the data attribute for internal operations. We'll do the same for our internal operations. 😎

**Define the behavior upon observation**

Once we have an element matching the `auth-container` data attribute, we show the modal, which triggers the enter transition animation. Then we clean up the observer.

**Identify what to observe**

We begin by observing the DOM and pass in the element to use as the root, along with a configuration specifying what to watch for. We want to look for changes in child elements and the subtree from the root to find the SIW elements.

Lastly, let's enable the modal to trigger based on the observer. I intentionally provided you with code snippets that force the modal to display before the SIW renders, so you could take sneak peeks at your work as we went along.

In the HTML node structure, find the `<div id="modal">`. It's missing a class that hides the modal initially. Add the class `hidden` to the class list. The class list for the `<div>` should look like


```html
<div id="modal"
    x-data
    x-cloak
    x-show="$store.modal.open" 
    x-transition:enter="transition ease-out duration-300"
    x-transition:enter-start="opacity-0"
    x-transition:enter-end="opacity-100"
    x-transition:leave="transition ease-in duration-200"
    x-transition:leave-start="opacity-100"
    x-transition:leave-end="opacity-0 hidden"
    class="hidden fixed inset-0 z-50 flex items-center justify-center bg-(--color-black)/80 bg-opacity-50">

<!-- Remaining modal structure here. Compare your work to the class list above -->

</div>
```

Then, in the `alpine:init` event listener, change the modal's `open` property to default to `false`:

```js
document.addEventListener('alpine:init', () => {
  Alpine.store('modal', {
    open: false,
    show() {
      this.open = true;
    },
    hide() {
      this.open = false;
    }
  });
});
```

Save and publish your changes. You'll now notice a slight delay before the modal eases into view. So smooth!

{% img blog/okta-custom-sign-in-page/final-siw-desktop.jpg alt:"A customized Okta-hosted Sign-In Widget with custom elements, colors, and styles" width:"800" %}{: .center-image }

It's worth noting that our solution isn't foolproof; a savvy user can hide the modal and continue interacting with the sign-in widget by manipulating elements in the browser's debugger. You'll need to add extra checks and more robust code for foolproof methods. Still, this example provides a general idea of capabilities and how one might approach adding interactive components to the sign-in experience.

Don't forget to test any implementation changes to the sign-in page for accessibility. The default site and the sign-in widget are accessible. Any changes or customizations we make may alter the accessibility of the site. 

You can connect your brand to one of our sample apps to see it work end-to-end. Follow the instructions in the README of our [Okta React Sample](https://github.com/okta-samples/okta-react-sample) to run the app locally. You'll need to update your Okta OpenID Connect (OIDC) application to work with the domain. In the Okta Admin Console, navigate to **Applications** > **Applications** and find the Okta application for your custom app. Navigate to the **Sign On** tab. You'll see a section for **OpenID Connect ID Token**. Select **Edit** and select **Custom URL** for your brand's sign-in URL as the **Issuer** value. 

You'll use the issuer value, which matches your brand's custom URL, and the Okta application's client ID in your custom app's OIDC configuration.

## Add Tailwind, Web APIs, and JavaScript libraries to customize your Okta-hosted sign-in page

I hope you found this post interesting and unlocked the potential of how much you can customize the Okta-hosted Sign-In Widget experience. 

You can find the final code for this project in the [GitHub repo](https://github.com/oktadev/okta-js-siw-customization-example/tree/main/custom-signin-blog-post).

If you liked this post, check out these resources.

* [Stretch Your Imagination and Build a Delightful Sign-In Experience](/blog/2025-11-12-custom-signin)
* [The Okta Sign-In Widget](https://developer.okta.com/docs/concepts/sign-in-widget/)


Remember to follow us on [LinkedIn](https://www.linkedin.com/company/oktadev) and subscribe to our [YouTube](https://www.youtube.com/c/oktadev) for more exciting content. Let us know how you customized the Okta-hosted sign-in page. We'd love to see what you came up with.

We also want to hear from you about topics you want to see and questions you may have. Leave us a comment below!

