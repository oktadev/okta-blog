---
layout: blog_post
title: "Three Ways to Configure Modules in Your Angular App"
author: alisa-duncan
by: advocate
communities: [javascript]
description: "Learn how to add configuration to modules in Angular three different ways - from static, changing configs at build time, and to loading configurations at run-time."
tags: [javascript, typescript, angular]
tweets:
- "How do you handle your module configuration in #Angular apps? 🤔 We cover 3 ways to configure modules and when to use each method."
- "Needing to load your Okta config from an API in your #Angular app? Learn when to use run-time loading and how to add it to your Okta integration."
image: blog/angular-async-config/angular-async-config-social.jpg
type: awareness
github: https://github.com/oktadev/okta-angular-async-load-example
---

Configurations are part of a developer's life. Configuration data is information your app needs to run and may include tokens for third-party systems or settings you pass into libraries. There are different ways to load configuration data as part of application initialization in [Angular](https://angular.io/). Your requirements for configuration data might change based on needs. For example, you may have one unchanging configuration for your app, or you may need a different configuration based on the environment where the app is running. We'll cover a few different ways to load configuration values and identify when you should use each method.

> We're covering specific use cases using Angular, so this post assumes you have some experience developing Angular apps. If you're interested in learning more about building your first Angular app, check out the [Angular Getting Started](https://angular.io/guide/what-is-angular) docs or the [links to tutorials](#learn-more) that walk you through integrating Okta into Angular apps.

In this post, we'll cover the following forms of configuration:
* defining configuration directly in code
* defining configuration for different environments
* loading configuration data via an API call

We'll show examples, including how to integrate with Okta, for each method. Also, we'll identify when to use each technique and what to watch out for.

{% include toc.md %}

## Set up Angular and Okta in a sample project

First we'll set up the base project and Okta resources so you can follow along with the post.

To keep things on an even playing field and avoid any new Angular feature funny-business, I'll use an Angular v9 app in the code sample. All the outlined methods apply from Angular v7 to the current version, Angular v13.
### Create the Angular app

You'll need a version of [Node](https://nodejs.org/en/) and [npm](https://www.npmjs.com/) that works for the Angular app version you want to create. 

I'm using Node v14.18.1 and npm v6.14.15 to create an Angular v9 app, but you can create the app for your favorite Angular v7+ version.

Use your globally installed Angular CLI to create an Angular app with routing and standard CSS for styling by running:

```shell
ng new async-load --routing --style=css
```

Or create the Angular v9 app by running the following command:

```shell
npx @angular/cli@9 new async-load --routing --style=css
```

### Create the Okta application

Let's create the Okta resource to have the configuration values we need to integrate. 

{% include setup/cli.md type="spa" framework="Angular" loginRedirectUri="http://localhost:4200/login/callback" logoutRedirectUri="http://localhost:4200" %}

We'll need the Okta Angular and Okta Auth JS libraries. Add them to your application by running the following command.

```shell
npm install @okta/okta-angular@5.1 @okta/okta-auth-js@6.0
```

This post won't walk you through setting up sign-in and sign-out; we're interested only in setting up the configuration. If the Angular app runs without errors, the configuration aspect is correct. To see the types of errors we're trying to avoid, try excluding `issuer` or don't replace the `{yourOktaDomain}` with the values you got back from the Okta CLI. The sample code repo does have sign-in and sign-out integrated so you can see authentication working all the way through.

## Define configuration in code

When your configuration is static the most straightforward way to configure libraries is to define the configuration directly in the code. In this method, you'd define the configuration data in the `AppModule` or in a feature module in this method. Examples of this method might look something like defining the configuration for routes and passing it into the `RouterModule`:

```ts
const routes: Routes = [
  { path: 'profile', component: ProfileComponent }
];

@NgModule({
  declarations: [ AppComponent, ProfileComponent ],
  imports: [
    BrowserModule,
    RouterModule.forRoot(routes)
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

You might be surprised to see routing as an example of defining configuration directly in code.  And yet, when you pass application-wide configuration into a module's [`forRoot()` static method](https://angular.io/guide/ngmodule-faq#what-is-the-forroot-method) that's precisely what you're doing. 

If you've followed many of our code examples and blog posts to integrate Okta into Angular apps, you've followed a similar pattern where configuration is defined directly in the application. 

Your configuration code looks something like this:

```ts
import { OktaAuthModule, OKTA_CONFIG } from '@okta/okta-angular';
import { OktaAuth } from '@okta/okta-auth-js';

const oktaAuth = new OktaAuth({
  issuer: 'https://{yourOktaDomain}/oauth2/default',
  clientId: '{yourClientId', 
  redirectUri: window.location.origin + '/login/callback'
});

@NgModule({
  declarations: [ AppComponent, ProfileComponent ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    OktaAuthModule
  ],
  providers: [
    { provide: OKTA_CONFIG, useValue: { oktaAuth } }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

**Summary of _define configuration in code_:**

The most straightforward way to add configuration to your app is when the configuration does not change based on external factors.

**When to use:**

* Use as often as you can since it's the easiest way to configure things.

**Best use cases:**

* Static app configurations
* Configuring third-party libraries
* Quick tests

**Watch out for:**

* Configuration that involves private keys or tokens

## Configuration that changes by environment

Angular has a built-in way to support per-environment differences using the `environments/environment.*.ts` files. When serving locally, Angular CLI uses the values in `environments/environment.ts`, and when you build for production, Angular CLI substitutes `environment.prod.ts` instead. You can see this file substitution defined in the `angular.json` build configuration. And if you have more environments to support, you can customize the build configuration to suit your needs.

The environment files are helpful when you have different configurations you want to support at build time. Some examples include enabling user analytics only on prod environments or defining the API endpoints your QA environment calls.

`src/main.ts` contains an example of a configuration that changes based on the environment. Here you see the following:

```ts
import { enableProdMode } from '@angular/core';
import { environment } from './environments/environment';

if (environment.production) {
  enableProdMode();
}
```

Angular utilizes the environment files to identify when to call the `enableProdMode()` method. Notice the file imports from `./environments/environment`. That's because the build process handles that file swap.

Now let's look at how we'd use this when integrating with Okta. 

In `src/environments/environment.ts`, add the Okta auth configuration like this.

```ts
export const environment = {
  production: false,
  authConfig: {
    issuer: 'https://{yourOktaDomain}/oauth2/default',
    clientId: '{yourClientId}'
  }
};
```

In `src/environments/environment.prod.ts`, you'll add the same `authConfig` properties with values that match your prod environment.

You'll use the environment file to initialize the `OktaAuthModule` in the `AppModule` like this.

```ts
import { OktaAuthModule, OKTA_CONFIG } from '@okta/okta-angular';
import { OktaAuth } from '@okta/okta-auth-js';
import { environment } from '../environments/environment.ts';

const oktaAuth = new OktaAuth({
  ...environment.authConfig,
  redirectUri: window.location.orgin + '/login/callback'
});

@NgModule({
  declarations: [ AppComponent, ProfileComponent ],
  imports: [ BrowserModule, AppRoutingModule, OktaAuthModule ],
  providers: [
    { provide: OKTA_CONFIG, useValue: { oktaAuth }}
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

**Summary of _configuration that changes by environment_:**

Customizing environment files is the Angular recommended method to inject values during build time.

**When to use:**

* You have different configuration values based on build output

**Best use cases:**

* Devmode - keep apps served locally from doing things only prod apps should do 
* Multiple staging environment systems

**Watch out for:**

* Configuration that involves private keys or tokens
* Run the build for each environment to test changes you make. You don't want to miss adding a property and potentially get a runtime error.

## Loading configurations from external APIs

Sometimes you need to load configuration at runtime. This makes sense if you use release promotion style deployments - creating a build for a staging/pre-production environment and promoting the same build to production after verification. You don't want to create a new build, but what if your staging and production environments require different configurations? Loading configuration from an external API is handy in scenarios like these.

To keep things simple for this *external API* configuration method, I'll focus only on the Okta example. 

In this example, we'll look at `src/main.ts` where we bootstrap the Angular application. When you need configuration before the application loads, we can take advantage of `platformBrowserDynamic()` platform injector's `extraProviders` functionality. The `extraProviders` allows us to [provide platform providers](https://angular.io/guide/hierarchical-dependency-injection#platform-injector), much in the same way we can provide application-wide providers in the `AppModule`.

Since we need to make the server call to get the configuration before we have a full Angular application context, we use Web APIs to call the API. Then we can configure the provider for Okta's `OKTA_CONFIG` injection token.

For a configuration API call response that looks like this: 

```json
{
  "issuer": "https://{yourOktaDomain}/oauth2/default",
  "clientId": "{yourClientId}", 
  "redirectUri": "{correctHostForTheEnvironment}/login/callback"
}
```

...the code in your `src/main.ts` changes to:

```ts
import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';

import { AppModule } from './app/app.module';
import { environment } from './environments/environment';
import { OKTA_CONFIG } from '@okta/okta-angular';
import { OktaAuth } from '@okta/okta-auth-js';

if (environment.production) {
  enableProdMode();
}

fetch('http://{yourApiUri}/config').then(async res => {
  const authConfig = await res.json();

  platformBrowserDynamic([
    { provide: OKTA_CONFIG, useValue: {oktaAuth: new OktaAuth(authConfig)}}
  ]).bootstrapModule(AppModule)
    .catch(err => console.error(err));
});
```

Then your `AppModule` only needs to import `OktaAuthModule` since you've already provided the `OKTA_CONFIG` injection token.

If you need to create the callback URI programmatically or if you need to use the configuration in multiple places, you can store the configuration in the app instead. The minimum we need is a class that holds the config, which we will show in the example. You can wrap the config in a service if your needs are more involved than what we'll show here.

You'll add a new file and create an interface that matches the response, as well as a class to hold the config:

```ts
export interface AuthConfig {
  issuer: string;
  clientId: string;
}

export class OktaAuthConfig {
  constructor(public config: AuthConfig) { }
}
```

Edit the `src/main.ts` to provide the `OktaAuthConfig` class instead

```ts
import { OktaAuthConfig } from './app/auth-config';

fetch('http://{yourApiUri}/config').then(async res => {
  const authConfig = new OktaAuthConfig(await res.json());

  platformBrowserDynamic([
    { provide: OktaAuthConfig, useValue: authConfig }
  ]).bootstrapModule(AppModule)
  .catch(err => console.error(err));
})
```

In the `AppModule` you can provide the `OKTA_CONFIG` needed to integrate with Okta by accessing `OktaAuthConfig`:

```ts
@NgModule({
  declarations: [ AppComponent, ProfileComponent ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    OktaAuthModule
  ],
  providers: [
    {
      provide: OKTA_CONFIG,
      deps: [OktaAuthConfig],
      useFactory: (oktaConfig: OktaAuthConfig) => ({
        oktaAuth: new OktaAuth({
          ...oktaConfig.config,
          redirectUri: window.location.origin + '/login/callback'
        })
      })
    }
  ]
})
export class AppModule { }
```

You can now load a config from an API and use the app's location.

You might be asking yourself, "Isn't there an `APP_INITIALIZER` token or something we can use instead"? Well, yes, there is an [`APP_INITIALIZER` token](https://angular.io/api/core/APP_INITIALIZER) for executing initialization functions that complete before application initialization completes. However, in our case, we need the auth configuration _in order_ to initialize. So, we need to finish loading the configuration before initializing the app, which we can do when bootstrapping.

**Summary of _loading configuration from an external API_:**

Load configuration from an API and provide the config to the application. Depending on your needs, the configuration loading may occur during bootstrapping or via `APP_INITIALIZER`.

**When to use:**

* You want the configuration to load at runtime instead of being baked into the code
* Your configuration properties include private information that you don't want to commit to source control

**Best use cases:**

* You have different configurations for staging and prod and use release-promotion style deployment processes
* Your configuration changes frequently or often enough where building and deploying the app is not feasible

**Watch out for:**

* Configuration errors or network blips - your app **will not run** since it's dependent on the external API.
* Anything that can decrease application load speed such as overly large configuration response, calling too many endpoints, or slow server response.
* Potential challenges with verification and testing, since configuration may change.

## Learn more about Angular

I hope this post is helpful as you consider how to integrate Okta into your Angular app. You can check out the [sample code for loading configurations from an external server](https://github.com/oktadev/okta-angular-async-load-example), along with a minimal Express API to simulate the config loading. 

If you liked this post, check out the following.

* [Loading Components Dynamically in an Angular App](/blog/2021/12/08/angular-dynamic-loading)
* [What Is Angular Ivy and Why Is It Awesome?](/blog/2020/02/12/angular-ivy)
* [Build a Beautiful App + Login with Angular Material](/blog/2020/01/21/angular-material-login)

Don't forget to follow us on [Twitter](https://twitter.com/oktadev) and subscribe to our [YouTube channel](https://www.youtube.com/c/OktaDev/) for more exciting content. We also want to hear from you about what tutorials you want to see. Leave us a comment below.
