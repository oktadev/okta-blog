---
layout: blog_post
title: "Secure and Deploy Micro Frontends with Angular"
author: alisa-duncan
by: advocate
communities: [javascript]
description: "A tutorial to prepare your micro frontend Angular project for production by using dynamic module loading, with deployment configured using Vercel. "
tags: [angular, typescript]
tweets:
- "Ship it! 🚀  Let's deploy an #Angular micro frontend project using @vercel"
- "Deploy an @angular project using micro frontends! This walkthrough configures an #Angular micro frontend project for multiple environments and deploys to @vercel. 👀"
image: blog/angular-microfrontend-deploy/angular-microfrontend-deploy-social.jpg
type: conversion
github: https://github.com/oktadev/okta-angular-microfrontend-example
---

Micro frontends continue to gain interest and traction in front-end development. The architecture models the same concept as micro services - as a way to decompose monolithic front-end applications. And just like with micro services, micro frontends have complexities to manage.

This post is part two in a series about building an e-commerce site with Angular using micro frontends. We use Webpack 5 with Module Federation to wire the micro frontends together, demonstrate sharing authenticated state between the different front ends, prepare for deployment using dynamic module loading, and deploy it all to [Vercel](https://vercel.com/)'s free hosting plan. 

In this second post, we're building on the site we created in part one, [How to Build Micro Frontends Using Module Federation in Angular](/blog/2022/05/02/angular-microfrontend-auth). Let's add dynamic module loading to our cupcake e-commerce site, secure unprotected routes, and set up the site for deployment in Vercel, a service designed to improve the front-end development workflow. 🎉

In the end, you'll have an app that looks like this publicly available through Vercel:

{% img blog/angular-microfrontend-deploy/final-app.gif alt:"Animated gif showing the final project with micro frontends that handle the cupcake shopping basket, authentication, and profile information" width:"800" %}{: .center-image }

**Prerequisites**

- [Node](https://nodejs.org/) This project was developed using Node v16.14 with npm v8.5 
- [Angular CLI](https://angular.io/cli)
- [GitHub Account](https://github.com/)
- [Vercel Account](https://vercel.com/) connected through your GitHub credentials for automating deployment.

{% include toc.md %}

## Review the Angular micro-frontends project using Webpack and Module Federation

Let's start by refreshing our memories—dust off your project from the [first post](https://developer.okta.com/blog/2022/05/17/angular-microfrontend-auth). Just like last time, we'll need both IDE and the terminal. 

We have the host application, `shell`, and two micro-frontend remotes, `mfe-basket` and `mfe-profile`. We're using `@angular-architects/module-federation` to help facilitate the Module Federation plugin configuration. The cupcake basket functionality code resides in the shared library, and we share authenticated state using Okta's SDKs. 

Serve all of the Angular applications in the project by running:

```shell
npm run run:all
```

When you run the project, you should see all the beautiful cupcakes this store sells. You'll be able to sign in, view your profile, add items to your basket, view your cupcake basket, and sign out. All the basics for handling your sweet treat needs!  

> **Note**: If you want to skip the first post and follow along with this tutorial, you can clone the code sample repo to get going. You will be missing quite a bit of context, though. Use the following commands in this case:
```shell
git clone --branch local https://github.com/oktadev/okta-angular-microfrontend-example.git
npm ci
npm run run:all
```
You'll need to follow the instructions on creating the Okta application and updating the code with your Okta domain and client ID.

## Dynamic loading of micro-frontend remotes

So far, we've been serving the cupcake micro-frontend website using the npm script `run:all`, which serves all three applications at once. Let's see what happens if we only try serving the host application. Stop serving the site, run `ng serve shell` to serve the default application, `shell`, and open the browser.

When you navigate to `http://localhost:4200`, you see a blank screen and a couple of console errors. The console errors happen because `shell` can't find the micro-frontend remotes at ports 4201 and 4202. 👀

These errors mean the host is loading the micro frontends upon initialization of the host, not upon route change like you might think based on configuring a lazy-loaded route in the routing module. Doh!

With the `@angular-architects/module-federation` library's `loadRemoteModule()` method, we can dynamically load the micro-frontend remotes upon route change with a few quick changes.

Open `projects/shell/src/app/app-routing.module.ts`.

The function we pass into the `loadChildren` property for the lazy-loaded routes changes to using `loadRemoteModule()`. Update your routes array to match the code below.

```ts
import { loadRemoteModule } from '@angular-architects/module-federation';

const routes: Routes = [
  { path: '', component: ProductsComponent },
  {
    path: 'basket',
    loadChildren: () => loadRemoteModule({
      type: 'module',
      remoteEntry: `http://localhost:4201/remoteEntry.js`,
      exposedModule: './Module'
    }).then(m => m.BasketModule)
  },
  {
    path: 'profile',
    loadChildren: () => loadRemoteModule({
      type: 'module',
      remoteEntry: `http://localhost:4202/remoteEntry.js`,
      exposedModule: './Module'
    }).then(m => m.ProfileModule)
  },
  { path: 'login/callback', component: OktaCallbackComponent }
];
```

Now that you're loading the remotes within the route definitions, you no longer need to define the remote URI in the `projects/shell/webpack.config.js`. Go ahead and remove or comment out the remotes in the `webpack.config.js` file. Another benefit of dynamic remote loading is that we no longer need to declare the modules to help TypeScript. Feel free to delete the `projects/shell/decl.d.ts` file. 🪄

Double-check everything still works by running `npm run run:all`.

Then stop serving the project and try running only the `shell` application by running the following command:

```shell
ng serve shell
```

You should now see the shell application and only see a console error when navigating to a route served by a micro-frontend remote. Success!

## Deploy your micro-frontend project using Vercel

Now that the cupcakes site is working locally let's deploy this beautiful website using [Vercel](https://vercel.com/). Ensure you've authorized Vercel access to GitHub because we'll take advantage of the built-in integration to deploy changes from the `main` branch automatically.

First, [push your project up to a GitHub repo](https://docs.github.com/en/get-started/quickstart/create-a-repo). If you wish to obscure your Okta configuration, you can make the repo private. The Okta configuration code is not confidential information, as single-page applications are public clients. If you don't like committing the configuration values into code, you can load the configuration values at runtime or use environment variables as part of your build step. I won't get into the details of how to handle that here, but I will include some links at the end. Make sure to leave the checkbox for **Intialize this repository with a README** unchecked.

{% img blog/angular-microfrontend-deploy/github-repo.jpg alt:"GitHub repo creation with private repo selected and 'Add a README file' checkbox unchecked" width:"600" %}{: .center-image }

In the Vercel dashboard, press the **+ New Project** button to import a Git repository. Depending on what permissions you granted to Vercel, you might see your newly created GitHub repo immediately. If not, follow the instructions to adjust GitHub app permissions and allow Vercel access to the repo. Press the **Import** button for the repo to continue. You'll see a form to configure the project within Vercel.

The idea behind micro frontends is to be able to deploy each application independently. We can do this in Vercel by creating a separate project for each application. Vercel limits the number of projects for a single repo to three in the free plan. What an extraordinary coincidence!

First, we'll configure the project for the micro-frontend host, the `shell` application. To keep the projects organized, incorporate the application name into the Vercel project name, such as `okta-angular-mfe-shell`. You'll also need to update the build command and output directory for the `shell` application. Update your configuration to look like the screenshot below.

{% img blog/angular-microfrontend-deploy/vercel-configure-shell.jpg alt:"Vercel configuration for shell application. The build command is set to 'ng build shell' and the output directory is 'dist/shell/'" width:"800" %}{: .center-image }

Press the **Deploy** button to kick off a build and deploy the application.

You'll see a screenshot of the application and a button to return to the dashboard when finished. On the dashboard, you'll see the deployed URI for the application and a screenshot of the cupcakes storefront. If you visit the URI, the routes won't work yet if you try navigating to the remotes. We need to deploy the remote projects and update the URI to the remotes in the route definition. Keep that URI for the `shell` application handy; we'll use it soon.

Return to the Vercel dashboard, create a new project, and select the same repo to import. This time we'll configure the remote application `mfe-basket`. Update your configuration to look like the screenshot below.

{% img blog/angular-microfrontend-deploy/vercel-configure-mfe-basket.jpg alt:"Vercel configuration for mfe-basket application. The build command is set to 'ng build mfe-basket' and the output directory is 'dist/mfe-basket/'" width:"800" %}{: .center-image }

Take note of the deployed URI for the `mfe-basket` application.

Return to the Vercel dashboard to repeat the process for the final remote application, `mfe-profile`. Update your configuration to look like the screenshot below.

{% img blog/angular-microfrontend-deploy/vercel-configure-mfe-profile.jpg alt:"Vercel configuration for mfe-profile application. The build command is set to 'ng build mfe-profile' and the output directory is 'dist/mfe-profile/'" width:"800" %}{: .center-image }

Take note of the deployed URI for the `mfe-profile` application.

## Update the routes to support micro-frontend paths for production

We need to update the route definition to include the URI for the deployed application. Now that you have the URI for the two micro-frontend remotes, you can edit `projects/shell/app/app-routing.module.ts`. The values in the `remoteEntry` configuration option in the `loadRemoteModule()` method are where you'd define the path. But if we update this value to use the deployed URI, then you'll no longer be able to run the application remotely.

We'll use the `environments` configuration built into Angular to support both local and deployed environments and define a configuration for serving locally versus production build.

We'll configure serving locally first. Open `projects/shell/src/environments/environment.ts` and add a new property for the micro-frontend remotes.

```ts
export const environment = {
  production: false,
  mfe: {
    "mfeBasket": "http://localhost:4201",
    "mfeProfile": "http://localhost:4202"
  }
};
```

Next, we'll use the values in the route definition. Open `projects/shell/src/app/app-routing.module.ts` and update the `remoteEntry` properties to use the new properties in the `environment.ts` file below.

```ts
import { environment } from '../environments/environment';

const routes: Routes = [
  { path: '', component: ProductsComponent },
  {
    path: 'basket',
    loadChildren: () => loadRemoteModule({
      type: 'module',
      remoteEntry: `${environment.mfe.mfeBasket}/remoteEntry.js`,
      exposedModule: './Module'
    }).then(m => m.BasketModule)
  },
  {
    path: 'profile',
    loadChildren: () => loadRemoteModule({
      type: 'module',
      remoteEntry: `${environment.mfe.mfeProfile}/remoteEntry.js`,
      exposedModule: './Module'
    }).then(m => m.ProfileModule)
  },
  { path: 'login/callback', component: OktaCallbackComponent }
];
```

Feel free to serve the project using `npm run run:all` to double-check everything still works.

Now we'll add the configuration for the deployed applications. Open `projects/shell/src/environments/environment.prod.ts` and add the same property for the micro-frontend remotes. Replace the URI with the deployed location.

```ts
export const environment = {
  production: true,
  mfe: {
    "mfeBasket": "https://{yourVercelDeployPath}.vercel.app",
    "mfeProfile": "https://{yourVercelDeployPath}.vercel.app"
  }
};
```

Angular automatically replaces the `environment.ts` file to match when you build the project. So if you're serving locally, you'll use the contents from `environment.ts`, and if you run `ng build` to create the release, you'll use the contents from `environment.prod.ts`. 

**Note**: _Vercel has a release promotion mechanism where you first release to a staging environment to conduct release verification, then promote the verified application to prod. With this flow, we'd need to add more complexity to the way we access the URIs. This tutorial will simplify things to only use one environment, but if you need to handle a multi-step release environment configuration, check out the links to blog posts at the end for handling per-environment configuration._

### Add your deployment URL to Okta

You'll need to update the Okta application with the new deploy location so that you can sign in. Open the Okta dashboard. Navigate to **Applications** > **Applications** and select the Okta application you created for this project. On the **General** tab, press the **Edit** button on the **General Settings** section and add the new deploy URI for the `shell` application.

{% img blog/angular-microfrontend-deploy/okta-configure-redirects.jpg alt:"Okta configuration for adding the Vercel deploy URI of shell application as 'Sign-in redirect URIs' and 'Sign-out redirect URIs'. The 'Sign-in redirect URI' should include the '/login/callback' route, while the 'Sign-out redirect URIs' is the deploy URI as is." width:"800" %}{: .center-image }

Next, add the deploy URI as a Trusted Origin in Okta. Navigate to **Security** > **API** and then navigate to the **Trusted Origins** tab. Press **+ Add Origin**. Add the deploy location and select **CORS** for the type.

{% img blog/angular-microfrontend-deploy/okta-configure-trusted-origin.jpg alt:"Okta configuration for adding the Vercel deploy URI of shell application to trusted origin. Type 'CORS' is selected." width:"800" %}{: .center-image }

Commit your changes and push to your main branch. After the build succeeds, you should be able to use the deployed site from end to end!


## Secure your micro frontends

Right now, you can access what should be protected routes by manually typing in the full URI to the profile route. Even though you don't see any profile information, we aren't guarding the route. Let's make the site a little more secure by protecting the route.

Open `projects/shell/src/app/app-routing.module.ts`. We'll add a route guard that comes out of the box with Okta's Angular SDK. Update the route definition for the `profile` route as shown below.

```ts
import { OktaCallbackComponent, OktaAuthGuard} from '@okta/okta-angular';

{
  path: 'profile',
  loadChildren: () => loadRemoteModule({
    type: 'module',
    remoteEntry: `${environment.mfe.mfeProfile}/remoteEntry.js`,
    exposedModule: './Module'
  }).then(m => m.ProfileModule),
  canActivate: [OktaAuthGuard]
},
```

Now if you navigate directly to the profile route, you'll first redirect to Okta's sign-in page, then redirect back to the profile route. 

Route protection works well from within the micro-frontend shell. But what if you navigate directly to the URI where the profile micro frontend resides? You will still be able to navigate to the profile route within the micro frontend because there isn't a guard within the profile application. 

This brings us to an interesting concept. In order to fully secure your micro frontends, you should protect routes defined within your micro frontend as well. To add the Okta route guard, you'll need to import the `OktaAuthModule` into the `mfe-profile` application's `AppModule`, and add the same configuration as you did for the `shell` application. The Module Federation configuration shares the Okta library between the applications when accessed via the host application. In contrast, `mfe-profile` will need its own instance of authenticated state when accessed in isolation from the `shell` application. Having its own instance of authenticated state means you should add sign-in and sign-out capability in the `AppComponent` of the `mfe-profile` application too. This will also allow you to test each micro-frontend application independently.

Security + testing = winning!

![Giphy of man flying with hashtag #winning](https://media.giphy.com/media/3ohryhNgUwwZyxgktq/giphy.gif)

## Build the micro frontend on a relevant change

As mentioned in this post, the value of micro frontends is the ability to deploy each application independently. In production systems, you may need to handle multiple build steps and build out an entire workflow of CI/CD, but for this tutorial, we can cheat a little and still get the benefits of separate deployments. We will add a configuration in Vercel only to kick off a build when there's changes in the relevant application code.

From the Vercel dashboard, open the Vercel project for the `mfe-basket` application. Navigate to the **Settings** tab and select **Git**. In the **Ignored Build Step**, we can add a Git command to ignore all changes except those in the `projects/mfe-basket` directory.

Add the following command:

```shell
git diff --quiet HEAD^ HEAD ./projects/mfe-basket
```

Next, open the Vercel project for the `mfe-profile` application to update the **Ignored Build Step** command. Now add this command:

```shell
git diff --quiet HEAD^ HEAD ./projects/mfe-profile
```

Lastly, open the Vercel project for the `shell` application to update the **Ignored Build Step** command. This command is a little different because we want to pick up any changes to the project excluding this changes to `mfe-basket` and `mfe-profile`. Add the following command:

```shell
git diff --quiet HEAD^ HEAD -- ':!projects/mfe-basket' ':!projects/mfe-profile'
```

Now, if you make a change in a micro-frontend application, only that micro-frontend application will build and deploy. All three projects will notice the change and start building but will immediately cancel the build if the build step should be ignored for the project.

## Beyond this post

I hope you've enjoyed creating and deploying this micro-frontend e-commerce site with beautiful pictures of tasty cupcakes. In this post, we used dynamic module loading to load micro frontends lazily within the host application, deployed the project to Vercel, added in multi-environment route configuration, and leveraged a micro-frontend benefit by enabling deployment upon relevant changes. You can check out the completed code for this project in the [`deploy` branch of the code repo](https://github.com/oktadev/okta-angular-microfrontend-example/tree/deploy) by using the following command:

```shell
git clone --branch deploy https://github.com/oktadev/okta-angular-microfrontend-example.git
```

## Learn about Angular, microservices, OpenIDConnect, managing multiple deployment environments, and more

Want to learn more? If you liked this post, check out the following.

* [Three Ways to Configure Modules in Your Angular App](/blog/2022/02/24/angular-async-config)
* [Managing Multiple .NET Microservices with API Federation](/blog/2022/02/22/manage-dotnet-microservices)
* [How to Build and Deploy a Serverless React App on Azure](/blog/2022/04/13/react-azure-functions)
* [Loading Components Dynamically in an Angular App](/blog/2021/12/08/angular-dynamic-loading)
* [Add OpenID Connect to Angular Apps Quickly](/2022/02/11/angular-auth0-quickly)


Don't forget to follow us on [Twitter](https://twitter.com/oktadev) and subscribe to our [YouTube channel](https://www.youtube.com/c/OktaDev/) for more exciting content. We also want to hear from you about what tutorials you want to see. Leave us a comment below.
