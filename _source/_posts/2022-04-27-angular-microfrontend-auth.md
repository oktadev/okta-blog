---
layout: blog_post
title: "How to build micro-frontends using Module Federation in Angular"
author: alisa-duncan
by: advocate
communities: [javascript]
description: "How to create an Angular web application with micro-frontends using Webpack 5 and Module Federation. In this first post of the series, you'll set up the project and share authenticated state in the web application."
tags: [angular, typescript]
tweets:
- "Curious about micro-frontends and how to share state? 👀  Here's walkthrough on creating micro-frontends with #angular 🅰️"
- "Build an @angular app using micro-frontends! This walkthrough uses #angular & Module Federation, shares state, and 🧁! 😋"
image: 
type: conversion
---

The demands placed on front-end web applications continue to grow. We expect our web applications to be feature-rich and highly performant as consumers. As developers, we worry about how to provide features and performance while keeping good development practices and architecture in mind.

Enter micro-frontend architecture. Micro-frontends are modeled after the same concept as micro-services as a way to decompose monolithic front-ends. The micro-sized front-ends combine to form a fully-featured web app. Since each micro-frontend can be developed and deployed independently, you have a powerful way of scaling out front-end applications.

So what does the micro-frontend architecture look like? Let's say you have an e-commerce site that looks as stunning as this one:

{% img blog/angular-microfrontend-auth/example-site.jpg alt:"Image of an example e-commerce site selling balloons with a header, links to account & cart, and images of balloons to purchase" width:"800" %}{: .center-image }

You might have a shopping cart, account information for registered users, past orders, payment options, etc. You might be able to further categorize these features into domains, each of which could be a separate micro-frontend, also known as a `remote`. The collection of micro-frontends remotes is housed inside another website, the `host` of the web application. 

So, your e-commerce site using micro-frontends to decompose different functionality might look like this diagram, where the shopping cart and account features are in their separate routes within your Single Page Application (SPA):

{% img blog/angular-microfrontend-auth/example-site-diagram.jpg alt:"Image of the example balloon e-commerce site showing a breakdown of the views. The entire site is wrapped in a host named 'Shell', and micro-frontends for the 'Cart' and 'Account' links" width:"800" %}{: .center-image }

You might be saying, "Micro-frontends sound cool, but managing the different front-ends and orchestrating state across the micro-frontends also sounds complicated," and you're right. The concept of a micro-frontend has been around for a few years and rolling your own micro-frontend implementation, shared state, and tools to support it _was_ quite an undertaking. However, micro-frontends are now well supported with Webpack 5 and [Module Federation](https://webpack.js.org/concepts/module-federation/). Not all web apps require a micro-frontend architecture, but for those large, feature-rich web apps that were starting to get unwieldy, the first-class support of micro-frontends in our web tooling is definitely a plus.

This post is part one of a series where we'll build an e-commerce site using Angular and micro-frontends. We'll use Webpack 5 with Module Federation to support wiring the micro-frontends together, demonstrate sharing authenticated state between the different front-ends, and deploy it all to a free cloud hosting provider. 

In this first post, we'll explore a starter project and understand how the different apps connect, add authentication using Okta, and add the wiring for sharing authenticated state. In the end, you'll have an app that looks like this:

{% img blog/angular-microfrontend-auth/final-app.gif alt:"Animated gif showing the final project with micro-frontends that handle the cupcake shopping basket, authentication, and profile information" width:"800" %}{: .center-image }

**Prerequisites**

- [Node](https://nodejs.org/) This project was developed using Node v16.14 with npm v8.5 
- [Angular CLI](https://angular.io/cli)
- [Okta CLI](https://cli.okta.com)

**Table of Contents**{: .hide }
* Table of Contents
{:toc}


## Angular app with micro-frontend starter using Webpack and Module Federation

There's a lot in this web app! We'll use a starter code to make sure we focus on the micro-frontend-specific code. If you're dismayed that you're using a starter and not starting from scratch, don't worry. I'll provide the Angular CLI commands to recreate the structure of this starter app on the repository's README.md so you have all the instructions.

Clone the [Angular Micro-frontends Example](https://github.com/oktadev/okta-angular-microfrontend-example) GitHub repo, open a terminal to the repo's filesystem location, and install the dependencies by running `npm ci`. Open the repo in your favorite IDE.

Let's dive into the code! 🎉

We have an Angular project with two applications and one library inside the `src/projects` directory. The two applications are named `shell` and `mfe-basket`, and the library is named `shared`. The `shell` application is the micro-frontend host, and the `mfe-basket` is a micro-frontend remote application. The library, `shared`, contains code and application state we want to share across the site. Apply the same sort of diagram shown above for this app looks like this:

{% img blog/angular-microfrontend-auth/sample-app-diagram.jpg alt:"Image of the sample cupcake e-commerce site showing a breakdown of the views. The entire site is wrapped in a host named 'shell' and a micro-frontends for the 'basket' link" width:"800" %}{: .center-image }

In this project, we use the `@angular-architects/module-federation` dependency to help encapsulate some of the intricacies of configuring Webpack and the Module Federation plugin. The `shell` and `mfe-basket` application have their own separate `webpack.config.js`. Open the `projects/shell/webpack.config.js` file for either the `shell` or `mfe-basket` application to see the overall structure. This file is where we add in the wiring for the hosts, remotes, shared code, and shared dependencies in the Module Federation plugin. The structure will be different if you aren't using the `@angular-architects/module-federation` dependency, but the basic idea for configuration remains the same.

Let's explore sections of this config file more. 

```js
// ...imports here

const sharedMappings = new mf.SharedMappings();
sharedMappings.register(
  path.join(__dirname, '../../tsconfig.json'),
  [
    '@shared'
  ]);

module.exports = {
  // ...other very important config properties
  plugins: [
    new ModuleFederationPlugin({
        library: { type: "module" },

        // For remotes (please adjust)
        // name: "shell",
        // filename: "remoteEntry.js",
        // exposes: {
        //     './Component': './projects/shell/src/app/app.component.ts',
        // },        
        
        // For hosts (please adjust)
        remotes: {
          "mfeBasket": "http://localhost:4201/remoteEntry.js",
        },

        shared: share({
          // ...important external libraries to share

          ...sharedMappings.getDescriptors()
        })
        
    }),
    sharedMappings.getPlugin()
  ],
};

```

In the `webpack.config.js` for `mfe-basket`, you'll see the path for `@shared` at the top of the file and the configuration to identify what to expose in the remote application.

The `shell` application serves on port 4200, and the `mfe-basket` application serves on port 4201. We can open up two terminals to run each application, or we can use the following npm script that the schematic to add `@angular-architects/module-federation` created for us:
 
```shell
npm run run:all
``` 

When you do so, you'll see both applications open in your browser and see how they fit together in the `shell` application running on port 4200. Click the **Basket** button to navigate to a new route that displays the `BasketModule` in the `mfe-basket` application. The sign-in button doesn't work quite yet, but we'll get it going here next.

**Note** - _Another option I could have used for the starter is a [Nx workspace](https://nx.dev/). Nx has great tooling and built-in support for building micro-frontends with Webpack and Module Federation. But I wanted to go minimalistic on the project tooling so you'd have a chance to dip your toes into some of the configuration requirements._

You might find the syntax `@shared` to look a little unusual since you may have expected to see a relative path to the library. The `@shared` syntax is an alias for the library's path, which is defined in the project's `tsconfig.json` file. You don't have to do this and can leave libraries using the relative path, but adding aliases makes your code look cleaner and helps ensure best practices for code architecture.

Because the host application doesn't know about the remote applications except in the `webpack.config.js`, we help out the TypeScript compiler by declaring the remote application in `decl.d.ts`. You can see all the configuration changes and source code made for the starter [in this commit](https://github.com/oktadev/okta-angular-microfrontend-example/commit/b851320ca9418b8e28890fab15c7da5313eb8275).

## Add authentication using Okta

One of the most useful features of Module Federation is managing shared code and state. Let's see how this all works by adding authentication to the project and using the authenticated state in the existing application and a new micro-frontend. 

{% include setup/cli.md type="spa" framework="Angular" loginRedirectUri="http://localhost:4200/login/callback" logoutRedirectUri="http://localhost:4200" %}

Make a note of the `Issuer` and the `Client ID`. You'll need those values here soon.

We'll use the [Okta Angular](https://www.npmjs.com/package/@okta/okta-angular) and [Okta Auth JS](https://www.npmjs.com/package/@okta/okta-auth-js) libraries to connect our Angular application with Okta authentication. Add them to your project by running the following command.

```shell
npm install @okta/okta-angular@5.2 @okta/okta-auth-js@6.4
```

Next, we need to import the `OktaAuthModule` into the `AppModule` of the `shell` project and add the Okta configuration. Replace the placeholders in the code below with the `Issuer` and `Client ID` from earlier.

```ts
import { OKTA_CONFIG, OktaAuthModule } from '@okta/okta-angular';
import { OktaAuth } from '@okta/okta-auth-js';

const oktaAuth = new OktaAuth({
  issuer: 'https://{yourOktaDomain}/oauth2/default',
  clientId: '{yourClientID}',
  redirectUri: window.location.origin + '/login/callback',
  scopes: ['openid', 'profile', 'email']
});

@NgModule({
  ...
  imports: [
    ...,
    OktaAuthModule
  ],
  providers: [
    { provide: OKTA_CONFIG, useValue: { oktaAuth } }
  ],
  ...
})
```

After authenticating with Okta, we need to set up the login callback to finalize the sign-in process. Open `app-routing.module.ts` in the `shell` project and update the routes array as shown below.

```ts
import { OktaCallbackComponent } from '@okta/okta-angular';

const routes: Routes = [
  { path: '', component: ProductsComponent },
  { path: 'basket', loadChildren: () => import('mfeBasket/Module').then(m => m.BasketModule) },
  { path: 'login/callback', component: OktaCallbackComponent }
];
```

Now that we've configured Okta in the application, we can add the code to sign in and sign out. Open `app.component.ts` in the `shell` project. We will add the methods to sign in and sign out using the Okta libraries. We're also going to update the two public variables to use the actual authenticated state. Update your code to match the code below.

```ts
import { Component, Inject } from '@angular/core';
import { filter, map, Observable, shareReplay } from 'rxjs';
import { OKTA_AUTH, OktaAuthStateService } from '@okta/okta-angular';
import { OktaAuth } from '@okta/okta-auth-js';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styles: []
})
export class AppComponent {
  public isAuthenticated$: Observable<boolean> = this.oktaStateService.authState$
      .pipe(
          filter(authState => !!authState),
          map(authState => authState.isAuthenticated ?? false),
          shareReplay()
      );
  
  public name$: Observable<string> = this.oktaStateService.authState$
      .pipe(
          filter(authState => !!authState && !!authState.isAuthenticated),
          map(authState => authState.idToken?.claims.name ?? '')
      );

  constructor(private oktaStateService: OktaAuthStateService, @Inject(OKTA_AUTH) private oktaAuth: OktaAuth) { }

  public async signIn(): Promise<void> {
    await this.oktaAuth.signInWithRedirect();
  }

  public async signOut(): Promise<void> {
    await this.oktaAuth.signOut();
  }
}
```

We need to add the click handlers for the sign-in and sign-out buttons. Open `app.component.html` in the `shell` project. Update the code for **Sign In** and **Sign Out** buttons as shown.

```html
<li>
  <button *ngIf="(isAuthenticated$ | async) === false; else logout"
    class="flex items-center transition ease-in delay-150 duration-300 h-10 px-4 rounded-lg hover:border hover:border-sky-400"
    (click)="signIn()"
  >
    <span class="material-icons-outlined text-gray-500">login</span>
    <span>&nbsp;Sign In</span>
  </button>

    <ng-template #logout>
      <button 
        class="flex items-center transition ease-in delay-150 duration-300 h-10 px-4 rounded-lg hover:border hover:border-sky-400"
        (click)="signOut()"
      >
        <span class="material-icons-outlined text-gray-500">logout</span>
        <span>&nbsp;Sign Out</span>
      </button>
  </ng-template>
</li>
```

Try running the project using `npm run run:all`. Now you'll be able to sign in and sign out. And when you sign in, a new button for **Profile** shows up. Nothing happens when you click it, but we're going to create a new remote, connect it to the host, and share the authenticated state here next!

## Create a new Angular application

Now you'll have a chance to dive in a little deeper to see how a micro-frontend remote connects to the host by creating a micro-frontend app to show the authenticated user's profile information. Stop serving the project and create a new Angular application in the project by running the following command in the terminal:

```shell
ng generate application mfe-profile --routing --style css --inline-style --skip-tests
```

With this Angular CLI command you
1. Generated a new application named `mfe-profile` which includes a module and a component
2. Added a separate routing module to the application
3. Defined the CSS styles to be inline in the components
4. Skipped creating associated test files for the initial component

You'll now create a component for the default route, `HomeComponent`, and a module to house the micro-frontend. We could wire up the micro-frontend to only use a component instead of a module, and for a profile view, a component will cover our needs, but we'll use a module so you can see how each micro-frontend can grow as the project evolves. Run the following two commands in the terminal:

```shell
ng generate component home --project mfe-profile
ng generate module profile --project mfe-profile --module app --routing --route profile
```

With these two Angular CLI commands you
1. Created a new component, `HomeComponent`, in the `mfe-profile` application
2. Created a new module, `ProfileModule`, with routing and a default component, `ProfileComponent`. You also added the `ProfileModule` as a lazy-loaded route using the '/profile' path to the `AppModule`.

Let's update the code. First, we'll add the default route. Open `projects/mfe-profile/src/app/app-routing.module.ts` and add a new route for `HomeComponent`. Your route array should match the code below.

```ts
const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'profile', loadChildren: () => import('./profile/profile.module').then(m => m.ProfileModule) }
];
```

Next, we'll update the `AppComponent` and `HomeComponent` templates. Open `projects/mfe-profile/src/app/app.component.html` and delete all the code in there. Replace it with the following:

```html
<h1>Hey there! You're viewing the Profile MFE project! 🎉</h1>

<router-outlet></router-outlet>
```

Open `projects/mfe-profile/src/app/home/home.component.html` and replace all the code in the file with

```html
<p>
  There's nothing to see here. 👀 <br/>
  The MFE is this way ➡️ <a routerLink="/profile">Profile</a>
</p>
```

Finally, we can update the code for the profile. Luckily, Angular CLI took care of a lot of the scaffolding for us. So we just need to update the component's TypeScript file and the template.

Open `projects/mfe-profile/src/app/profile/profile.component.ts` and edit the component to add the two public properties and include the `OktaAuthStateService` in the constructor:

```ts
import { Component, OnInit } from '@angular/core';
import { OktaAuthStateService } from '@okta/okta-angular';
import { filter, map } from 'rxjs';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styles: []
})
export class ProfileComponent {
  public profile$ = this.oktaStateService.authState$.pipe(
    filter(state => !!state && !!state.isAuthenticated),
    map(state => state.idToken?.claims)
  );

  public date$ = this.oktaStateService.authState$.pipe(
    filter(state => !!state && !!state.isAuthenticated),
    map(state => (state.idToken?.claims.auth_time as number) * 1000),
    map(epochTime => new Date(epochTime)),
  );

  constructor(private oktaStateService: OktaAuthStateService) { }
}
```

Next, open the corresponding template file and replace the existing code with the following:

{% raw %}
```html
<h3 class="text-xl mb-6">Your Profile</h3>

<div *ngIf="profile$ | async as profile">
  <p>Name: <span class="font-semibold">{{profile.name}}</span></p>
  <p class="my-3">Email: <span class="font-semibold">{{profile.email}}</span></p>
  <p>Last signed in at <span class="font-semibold">{{date$ | async | date:'full'}}</span></p>
</div>
```
{% endraw %}

Try running the `mfe-profile` app by itself by running `ng serve mfe-profile --open` in the terminal. Notice when we navigate to the `/profile` route, we see a console error. We added Okta into the `shell` application, but now we need to turn the `mfe-profile` application into a micro-frontend and share the authenticated state. Stop serving the application so we're ready for the next step.

## Turn the Angular application into a micro-frontend remote

We want to use the schematic from `@angular-architects/module-federation` to turn the `mfe-profile` application into a micro-frontend and add the necessary configuration. We'll use port 4202 for this application. Add the schematic by running the following command in the terminal:

```shell
ng add @angular-architects/module-federation --project mfe-profile --port 4202
```

This schematic does the following:
1. Updates the project's `angular.json` config file to add the port for the application and updates the builder to use a custom Webpack builder
2. Creates the `webpack.config.js` files and scaffolds out default configuration for Module Federation

First, let's add the new micro-frontend to the `shell` application by updating the configuration in `projects/mfe-profile/webpack.config.js`. In the middle of the file, there's a property for `plugins` with commented-out code. We need to finish configuring that. Since this application is a remote, we'll update the snippet of code under the comment:

```js
// For remotes (please adjust)
```

The defaults are mostly correct, except we have a module, not a component that we want to expose. If you want to expose a component instead, all you'd need to do is update which component to expose. Update the configuration snippet to expose the `ProfileModule` by matching the following code snippet:

```js
// For remotes (please adjust)
name: "mfeProfile",
filename: "remoteEntry.js",
exposes: {
  './Module': './projects/mfe-profile/src/app/profile/profile.module.ts',
},
```

Now we can incorporate the micro-frontend in the `shell` application. Open `projects/shell/webpack.config.js`. Here is where you'll add the new micro-frontend so that the `shell` application knows how to access it. In the middle of the file, inside the `plugins` array, there's a property for `remotes`. The micro-frontend in the starter code, `mfeBasket`, is already added to the `remotes` object. There is where you'll add the remote for `mfeProfile` following the same pattern but replacing the port to 4202. Update your configuration to look like this.

```js
// For hosts (please adjust)
remotes: {
  "mfeBasket": "http://localhost:4201/remoteEntry.js",
  "mfeProfile": "http://localhost:4202/remoteEntry.js"
},
```

We can add update the code to incorporate the profile's micro-frontend. Open `projects/shell/src/app/app-routing.module.ts`. Add a path to the profile micro-frontend to the routes array using the path 'profile'. Your routes array should look like this.

```ts
const routes: Routes = [
  { path: '', component: ProductsComponent },
  { path: 'basket', loadChildren: () => import('mfeBasket/Module').then(m => m.BasketModule) },
  { path: 'profile', loadChildren: () => import('mfeProfile/Module').then(m => m.ProfileModule)},
  { path: 'login/callback', component: OktaCallbackComponent }
];
```

What's this!? The IDE flags the import path as an error! The `shell` application code doesn't know about the Profile module, and TypeScript needs a little help. Open `projects/shell/src/decl.d.ts` and add the following line of code.

```ts
declare module 'mfeProfile/Module';
```

The IDE should be happier now. 😀

Next, update the navigation button for **Profile** in the `shell` application to route to the correct path. Open `projects/shell/src/app/app.component.html` and find the `routerLink` for the **Profile** button. It should be approximately on line 38. Right now the `routerLink` configuration is `routerLink="/"`, but it should now be

```html
<a routerLink="/profile">
```

This is everything we need to do to connect the micro-frontend remote to the host application, but we also want to share authenticated state. Module Federation makes sharing state a piece of (cup) cake.

## Shared authenticated state within micro-frontend applications

To share a library, you need to configure the library in the `webpack.config.js` to share. Let's start with `shell`. Open `projects/shell/src/webpack.config.js`.

There are two places to add shared code. One place is for code implementation within the project, and one is for shared external libraries. In this case, we can share the Okta external libraries as we didn't implement a service that wraps Okta's auth libraries, but I will point out both places.

First, we'll add the Okta libraries. Scroll down towards the bottom of the file to the `shared` property. You'll follow the same pattern as the `@angular` libraries already in the list and add the singleton instances of the two Okta libraries as shown in this snippet:

```js
shared: share({
  // other Angular libraries remain in the config. This is just a snippet
  "@angular/router": { singleton: true, strictVersion: true, requiredVersion: 'auto' },
  "@okta/okta-angular": { singleton: true, strictVersion: true, requiredVersion: 'auto' },
  "@okta/okta-auth-js": { singleton: true, strictVersion: true, requiredVersion: 'auto' },

  ...sharedMappings.getDescriptors()
})
```

If you created a library within this project, like the basket service and project service in the starter code, you'd add the library to the `sharedMappings` array at the top of the `webpack.config.js` file. If you create a new library to wrap Okta's libraries, this is where you'd add it.

Now that you added the Okta libraries to the micro-frontend host, you need to also add them to the remotes that consume the dependencies. In our case, only the `mfe-profile` application uses Okta authenticated state information. Open `projects/mfe-profile/webpack.config.js`. Add the two Okta libraries to the `shared` property as you did for the `shell` application.

Now, you should be able to run the project using `npm run run:all`, and the cupcake storefront should allow you to log in, see your profile, log out, and add items to your cupcake basket!

## Next steps

I hope you enjoyed this first post on creating an Angular micro-frontend site. In this post, we explored the capabilities of micro-frontends and shared state between micro-frontends using Webpack's Module Federation in Angular.  You can check out the completed code for this post in the [`local` branch in the @oktadev/okta-angular-microfrontend-example GitHub repo](https://github.com/oktadev/okta-angular-microfrontend-example/tree/local).

Stay tuned for next time as we prepare for deployment by transitioning to dynamic module loading and deploying the site to a free cloud provider.

## Learn more

Can't wait to learn more? If you liked this post, check out the following.

* [Three Ways to Configure Modules in Your Angular App](/blog/2022/02/24/angular-async-config)
* [Add OpenID Connect to Angular Apps Quickly](/blog/2022/02/11/angular-auth0-quickly)
* [Loading Components Dynamically in an Angular App](/blog/2021/12/08/angular-dynamic-loading)
* [How to Win at UI Development in the World of Microservices](/blog/2019/08/08/micro-frontends-for-microservices)

Don't forget to follow us on [Twitter](https://twitter.com/oktadev) and subscribe to our [YouTube channel](https://www.youtube.com/c/OktaDev/) for more exciting content. We also want to hear from you about what tutorials you want to see. Leave us a comment below.