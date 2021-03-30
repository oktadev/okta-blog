---
layout: blog_post
title: "Build Your First PWA with Vue and TypeScript"
author: holger-schmitz
by: contractor
communities: [javascript]
description: "This tutorial shows you how to build a PWA with Vue and TypeScript."
tags: [vue, pwa, typescript]
tweets:
- "PWA FTW with @vuejs and @typescript!"
- "Vue CI makes it straightforward to create a @vuejs + @typescript app and make it into a PWA. Learn how today!"
- "I like TypeScript. You like TypeScript. Use your @typescript knowledge to create a PWA in this @vuejs tutorial."
image: blog/featured/okta-vue-bottle-headphones.jpg
type: conversion
changelog:
  - 2020-05-01: Updated versions of all dependencies, including Okta libraries. This enables the use of the Authorization Code + PKCE flow, rather than the deprecated Implicit Flow. See the code changes in the [example app on Github](https://github.com/oktadeveloper/okta-vue-books-pwa-example/pull/5). Changes to this article can be viewed in [oktadeveloper/okta-blog/#275](https://github.com/oktadeveloper/okta-blog/pull/275)
---

With the ever-increasing use of mobile devices over the last few years it has become more and more important for web developers to anticipate the need for users on these devices. The first step was the ability to cater for different screen sizes, thus creating the need for responsive user interface design. Over time the demands of the users increase and it is now becoming even more important to provide a high-quality user experience, independent of the network connectivity. Users have become accustomed to using native installable applications when they are offline. They are increasingly expecting the same from browser-based web applications.

This expectation is met by Progressive Web Applications (or PWAs). A PWA is a normal web application that leverages a number of modern browser technologies to improve the overall experience. The core component of a PWA is a service worker. The service worker is a piece of JavaScript code that runs in a separate thread from the main JavaScript application and intercepts any browser requests for resources from the server. If the service worker finds that it has an up-to-date version of that resource in the cache it will provide the cached resource instead. In addition, an application manifest allows the application to be installed in the browser. This makes it possible to start up the PWA on a mobile device, even if the device is offline.

In this tutorial, I will show you how to develop a small PWA using the Vue framework. Vue is a framework that has been around for some time. It has recently gained in popularity as developers have come to realize that Vue strikes a good balance between a low-level hackability and high-level over-design. The application will allow the user to browse through a catalog of books. It will be making use of the OpenLibrary API to provide the data.

## Create Your Vue Application

To start you will need to install the Vue command line tool. I will assume that you have some knowledge of JavaScript and the Node Package Manager (npm). I will also assume you have `npm` installed on your system. Open a shell and type the command:

```bash
npm install -g @vue/cli@4.3.1
```

This installs the global `vue` command. Depending on your system, you might have to run this command using `sudo`. Once the Vue command line tool has been installed you can create your first Vue application. Navigate into a directory of your choice and run the command

```bash
vue create vue-books-pwa
```

You will be prompted for a number of choices. In the first question, select **Manually select features**. This is important because you want to include the PWA features that Vue can install into a new application. 

On the following prompt, you are presented with a number of choices. Make sure you select the **Progressive Web App (PWA) Support** and **Router** choices. You will be implementing the client using TypeScript, so you will also need to select the **TypeScript** option. Keep the **Babel** option selected. You may also want to deselect the **Linter** choice for this tutorial. In larger applications, I would suggest keeping the linter switched on to ensure a consistent code style across your application. Altogether the choices should look as follows.

```
? Check the features needed for your project:
 ◉ Babel
 ◉ TypeScript
❯◉ Progressive Web App (PWA) Support
 ◉ Router
 ◯ Vuex
 ◯ CSS Pre-processors
 ◯ Linter / Formatter
 ◯ Unit Testing
 ◯ E2E Testing
```

Once you have made your choices, press **Enter** to continue. When the wizard asks you **Use history mode for router?** you must answer **no**. For all other questions, simply accept the default options.

The `vue create` command will create a directory and fill it with a skeleton application. This application consists of an `App` base component and two routed components `Home` and `About`. All components are stored in `.vue` files. 

A `.vue` file can contain three sections identified by XML tags: `<template>`, `<style>`, and `<script>`. 

* `<template>` - contains the HTML template that is used to render the component
* `<style>` - contains any CSS that will be applied specifically to that component
* `<script lang="ts">` - contains the component's logic implemented in TypeScript code

Before you start, implementing the components for the Book application, you will need to install some additional libraries that will be using throughout this tutorial. Navigate into the newly created `vuew-books-pwa` directory and run the following command.

```bash
cd vue-books-pwa
npm i vue-material@1.0.0-beta-13 axios@0.19.2 vue-axios@2.1.5
```

This will install the Material Design packages for Vue as well as the axios package that you will be using to create HTTP requests to the OpenLibrary API. Because you are using TypeScript, you will also need to install the type definitions for the Vue Material library. These have to be pulled from their GitHub repository. Run the command:

```bash
npm i git+https://github.com/calebsander/vue-material-types.git
```

To make use of the Material Design CSS styles and icons, open `/public/index.html` and add the following line to the `<head>` section.

```html
<link href="https://fonts.googleapis.com/icon?family=Ubuntu|Material+Icons" rel="stylesheet">
```

The `public/index.html` file contains the application's base HTML container into which Vue will render its output. The contents of the `/public` directory are served as static assets. The directory also contains `favicon.ico` which you might want to change for production.

The remainder of the application is contained in the `/src` directory. This is where all the code of your Vue components, their templates, and styles should be stored. In this directory, `src/main.ts` serves as the main entry point to the Vue application. Open this file and paste the following content into it after the import statements, keeping any default contents.

```ts
import axios from 'axios'
import VueAxios from 'vue-axios'
import VueMaterial from 'vue-material'
import 'vue-material/dist/vue-material.min.css'
import 'vue-material/dist/theme/default-dark.css'

Vue.use(VueMaterial);
Vue.use(VueAxios, axios);
```

The main component of the application is defined in `src/App.vue`. This file acts as the container for the routed components. Replace the contents of the file with the content below.

{% raw %}
```html
<template>
  <div id="app">
    <md-toolbar color="primary" class="expanded-toolbar">
      <span class="branding">
        <md-button><router-link to="/">{{title}}</router-link></md-button>
        <md-button><router-link to="/"><md-icon>home</md-icon></router-link></md-button>
      </span>
      <md-menu md-direction="bottom-start">
        <md-button md-menu-trigger><md-icon>menu</md-icon></md-button>
        <md-menu-content>
          <md-menu-item><router-link to="/">Home</router-link></md-menu-item>
          <md-menu-item><router-link to="/search">Search</router-link></md-menu-item>
        </md-menu-content>
      </md-menu>
    </md-toolbar>
    <router-view/>
  </div>
</template>

<script lang="ts">
import Vue from 'vue'

export default class App extends Vue {
  title = "Vue Books";
}
</script>

<style>
#app {
  font-family: 'Ubuntu', sans-serif;
}

.branding {
  flex: 1;
  text-align: left;
}

h1 {
  text-align: center;
}
</style>
```
{% endraw %}

The `<md-topbar>` element in the template defines the application's top bar. It contains a menu with some links to the different sub-components. The splash screen is contained in `src/views/Home.vue`. Open it, and replace it with the following:

```html
<template>
  <div class="home">
    <h1>Vue Books PWA</h1>
    <h2>A simple progressive web application</h2>
  </div>
</template>

<script>
import { Component, Vue } from 'vue-property-decorator';

@Component
export default class Home extends Vue {}
</script>
```

The default application created by `vue-cli` contains the `About.vue` component. You will not be using this component. Instead, the central component that provides the main functionality will be a component in which the user can search for books and view the search results in a table. Rename `src/views/About.vue` to `src/views/Search.vue`. Replace the contents with the following.

{% raw %}
```html
<template>
  <div class="search">
    <form v-on:submit.prevent="search">
      <div class="input-group">
        <md-field class="input-group-field">
          <label>Search</label>
          <md-input v-model="query"></md-input>
        </md-field>
        <div class="input-group-button"><md-button class="md-raised" v-on:click="search"><md-icon>search</md-icon></md-button></div>
      </div>
    </form>
    <h2>Search Results</h2>
    <md-table>
      <md-table-row>
        <md-table-head>Title</md-table-head>
        <md-table-head>Author</md-table-head>
        <md-table-head>Pub. Year</md-table-head>
        <md-table-head>View</md-table-head>
      </md-table-row>
      <md-table-row v-for="book in books" v-bind:key="book.key">
        <md-table-cell>{{book.title}}</md-table-cell>
        <md-table-cell>{{book.author_name && book.author_name.join(', ')}}</md-table-cell>
        <md-table-cell md-numeric>{{book.first_publish_year}}</md-table-cell>
        <md-table-cell><md-button v-on:click="viewDetails(book)"><md-icon>visibility</md-icon></md-button></md-table-cell>
      </md-table-row>
    </md-table>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';
import axios from 'axios';

@Component
export default class Search extends Vue {
  baseUrl = 'http://openlibrary.org';
  books = [];
  query = '';

  async search() {
    const response = await axios.get(this.baseUrl + `/search.json?title=${this.query}`);
    this.books = await response.data.docs;
  }

  viewDetails(book: any) {
    this.$router.push({ path: 'details', query: {
      title: book.title,
      authors: book.author_name && book.author_name.join(', '),
      year: book.first_publish_year,
      cover_id: book.cover_edition_key
    }});
  }
}
</script>

<style>
.input-group {
  margin-top: 1rem;
  display: flex;
  justify-content: center;
}

.input-group-field {
  margin-right: 0;
}

.input-group .input-group-button {
  margin-left: 0;
  border: none;
}

.input-group .md-raised {
  margin-top: 0;
  margin-bottom: 0;
  border-radius: 0;
}
</style>
```
{% endraw %}

This file contains quite a lot, so let's discuss each section one by one. The top part contains the HTML template. This consists of a search form followed by a table that will display the results of a search. 

The `<script>` segment of the search component contains the logic. It contains the search query and the results of the search in the `books` array. The component contains two methods. The `search()` method takes the search terms and performs a `GET` request to the OpenLibrary API. 

When the result comes back, the `books` array is filled with the search results. The `viewDetails` method will cause the router to navigate to the `Details` component (which you will implement shortly). Each entry in the table contains a button linked to this method, allowing the user to view the book's details. Finally, the third section in `Search.vue` contains some CSS styling.

The last component that needs implementing shows the book's details. Create a new file `src/views/Details.vue` and fill it with the code below.

{% raw %}
```html
<template>
  <div class="details">
    <h1>Book Details</h1>
    <div class="content">
      <md-card class="details-card">
        <h3>{{book.title}}</h3>
        <img v-bind:src="getImageSrc()" />
        <h4>Authors</h4>
        <p> {{book.authors}} </p>
        <h4>Published</h4>
        <p>{{book.year}}</p>
      </md-card>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue } from 'vue-property-decorator';

@Component
export default class Details extends Vue {
  book: any;

  created() {
    this.book = {
      title: this.$route.query.title,
      cover_id: this.$route.query.cover_id,
      authors: this.$route.query.authors,
      year: this.$route.query.year
    };
  }

  getImageSrc() {
    return "http://covers.openlibrary.org/b/OLID/" + this.book.cover_id + "-M.jpg";
  }
}
</script>

<style>
.content {
  display: flex;
  justify-content: center;
}

.details-card {
  max-width: 800px;
  padding: 1rem 2rem;
}

.details-card p {
  padding-left: 2rem;
}
</style>
```
{% endraw %}

This component simply shows the book's details obtained from the route's query parameters. The only method, `getImageSrc()`, returns the URL of the cover image.

When the application was generated by the `vue` command line tool, it also created a `HelloWorld` component at `src/components/HelloWorld.vue`. This is not needed in the application, so you can delete it. If you delete this file, you'll need to delete references to it in `src/views/Home.vue` as well.

In order for a sub-component to be shown, it must be registered with the router. Open `src/router/index.ts` and replace it with the code below.

```ts
import Vue from 'vue'
import Router from 'vue-router'
import Home from './views/Home.vue'

Vue.use(Router)

const router = new Router({
  mode: 'history',
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import(/* webpackChunkName: "search" */ '../views/Home.vue')
    },
    {
      path: '/search',
      name: 'search',
      component: () => import(/* webpackChunkName: "search" */ '../views/Search.vue')
    },
    {
      path: '/details',
      name: 'details',
      component: () => import(/* webpackChunkName: "details" */ '../views/Details.vue')
    }
  ]
})

export default router;
```

This completes the basic application. To try it out, you can run the command:

```bash
npm run serve
```

Open a browser and navigate to `http://localhost:8080`. You can search for a book and click on the eye icon to look at the book's details.

{% img blog/vue-pwa/book-details.png alt:"Book Details" width:"600" %}{: .center-image }

## Add Secure Authentication to Your Vue PWA

In many situations, you will want to restrict access to parts of your application to users that are registered. You could start implementing your own user registration and sign-in mechanism. This is not only cumbersome but can leave you with security risks if the user registration is not tested properly. Fortunately, Okta provides a single sign-on service that lets you add safe user authentication with little effort. In this section, I will be showing you how to restrict access to the `/search` and `/details` routes to registered users.

To start, you need to create an account with Okta. Visit [developer.okta.com](https://developer.okta.com/) and click the **Sign Up** button. On the next screen, enter your details and click on **Get Started**. 

Once you have finished the registration process, you will be taken to the developer dashboard. Each application that you want to use with Okta authentication must be registered and will receive its own client ID. Click on **Add Application** and, on the next screen, select **Single Page Application**. When you click on **Next** you will see a screen with settings. Change the default value for **Login redirect URIs** to `http://localhost:8080/callback`. You can leave all the other defaults. After clicking **Done**, scroll down and make note of the **client_id** value. You'll need it shortly.

{% img blog/vue-pwa/create-new-app.png alt:"Create New Okta Application" width:"800" %}{: .center-image }

In your application directory now run the following command.

```bash
npm i @okta/okta-vue@2.0.0 @types/okta__okta-vue@1.2.0
```

This will install the Okta SDK for Vue. To set up Okta with your application, open `src/router/index.ts`. Add the following lines after the import statements.

```ts
import Auth from '@okta/okta-vue';

Vue.use(Auth, {
  issuer: 'https://{yourOktaDomain}/oauth2/default',
  client_id: '{yourClientId}',
  redirect_uri: window.location.origin + '/callback',
});
```

The `Vue.use(Auth, ...)` statement sets up Okta. Replace the value of **{yourOktaDomain}** with the domain name of your Okta org and **{yourClientId}** with the **client_id** you saved earlier.

In the `routes` array, add the following entry.

```ts
{
  path: '/callback',
  component: Auth.handleCallback()
}
```

This route will handle the callback from Okta, after the user has logged in. 

Add a `beforeEach()` condition to the router at the bottom that sets up a redirect if authentication is required.

```ts
router.beforeEach(Vue.prototype.$auth.authRedirectGuard());
```

Finally, you have to add the authentication guards. In the router entries for the `/search` and `/details`, add the following property.

```ts
meta: {
  requiresAuth: true,
},
```

With this, your application is protected. If you now try to navigate to the `/search` route, you will be redirected to the Okta login page. In addition to protecting certain routes, the application should also let the user know if the user is logged in and provide a direct link to the Okta login page. Open `src/App.vue`. In the template section add the following into the `<md-toolbar>`, just after `<span class="branding">`.

```html
<md-button v-if="authenticated" v-on:click="logout" id="logout-button"> Logout </md-button>
<md-button v-else v-on:click="$auth.loginRedirect()" id="login-button"> Login </md-button>
```

Replace the contents of the script section with the following.

```ts
import { Component, Vue, Watch } from 'vue-property-decorator';

@Component
export default class App extends Vue {
  title = "Vue Books";
  public authenticated: boolean = false;

  private created() {
    this.isAuthenticated();
  }
  
  @Watch('$route')
  private async isAuthenticated() {
    this.authenticated = await this.$auth.isAuthenticated();
  }

  private async logout() {
    await this.$auth.logout();
    await this.isAuthenticated();

    // Navigate back to home
    this.$router.push({path: '/'});
  }
}
```

The flag `authenticated` keeps track of the login status. This controls the visibility of the **Login** and **Logout** buttons. This completes the implementation of the Vue Books application.

## Create Your PWA in Vue

Until now, I have guided you through creating a standard web application. The only step towards creating a PWA was the choice to support PWAs during the initial set-up of the application. It turns out that this is almost everything that needs to be done. You can check the performance of the application using Google Chrome's Lighthouse extension. 

To test your application properly, you need to serve it in production mode. First, build the application by running the command:

```bash
npm run build
```

This will compile the application into the `dist/` subdirectory. Next, you need to install the `http-server-spa` package by running the following command.

```bash
npm install -g http-server-spa@1.3.0
```

Then start the server by running:

```bash
http-server-spa dist index.html 8080
```

Open the Chrome browser and navigate to `http://localhost:8080`. You can install the [Lighthouse extension](https://chrome.google.com/webstore/detail/lighthouse/blipmdconlkpinefehnmjammfjpmpbjk?hl=en) or use the **Audits** tab in Chrome Developer Tools to run Lighthouse.

If you have the extension installed, you will notice a little Lighthouse icon in the navigation bar. If you click on it a little panel will open. Select **Generate Report** and Lighthouse will start analyzing your application. There are a number of checks and you should get a score of 92 on the Progressive Web Application score. If you served the application using a secure server through HTTPS protocol you would likely score 100.

{% img blog/vue-pwa/lighthouse-report.png alt:"Lighthouse Report" width:"800" %}{: .center-image }

You could stop here and say that you have created a perfectly scoring PWA. But you can do a little better. If the application is modified to cache past search requests, a user can re-issue past searches and still get results, even if the device is offline. The `axios-extensions` library includes a caching layer that can be used out of the box. Install the extensions.

```bash
npm i axios-extensions
```

Open `src/main.ts` and add the following import.

```ts
import { cacheAdapterEnhancer } from 'axios-extensions';
```

Then replace `Vue.use(VueAxios, axios)` with the following.

```ts
Vue.use(VueAxios, axios.create({
  adapter: cacheAdapterEnhancer(axios.defaults.adapter as any)
}));
```

That's it! You have created a PWA with Vue. A service worker caches access to the server resources. Requests to the external API are cached allowing the user to use the application without a network connection. The `vue` command line tool also created a manifest in `public/manifest.json` and a set of icons in `public/img/icons`. This allows the browser to install the application locally. For a production application, you should edit the manifest and update the icons.

## Learn More about Vue and PWAs

This tutorial showed you how to create a PWA with Vue. PWAs are becoming increasingly popular in a world with more and more mobile devices with flaky internet connections. Vue is an excellent framework for developing web applications and makes it simple to add PWA features. As you have seen, adding authentication with Okta is pretty easy too.

You can find the source code for this tutorial on GitHub at [oktadeveloper/okta-vue-books-pwa-example](https://github.com/oktadeveloper/okta-vue-books-pwa-example).

If you want to learn more about Vue, PWAs, or secure authentication, check out the following links:

* [Build a Single-Page App with Go and Vue](/blog/2018/10/23/build-a-single-page-app-with-go-and-vue)
* [The Ultimate Guide to Progressive Web Applications](/blog/2017/07/20/the-ultimate-guide-to-progressive-web-applications)
* [Add Authentication to Your Angular PWA](/blog/2017/06/13/add-authentication-angular-pwa)
* [Build Your First Progressive Web Application with Angular and Spring Boot](/blog/2017/05/09/progressive-web-applications-with-angular-and-spring-boot)

To be notified when we publish future blog posts, [follow @oktadev on Twitter](https://twitter.com/oktadev). If you prefer videos, subscribe to [our YouTube channel](https://www.youtube.com/c/oktadev).
