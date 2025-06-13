---
layout: blog_post
title: "Flexible Authentication Configurations in Angular Applications Using Okta"
author: alisa-duncan
by: advocate
communities: [javascript]
description: "Use the Okta Angular SDK to add flexible runtime configuration loading. Check out how to do so in a standalone Angular application!"
tags: [angular, oidc, sdk, configuration]
tweets:
- ""
- ""
- ""
image: blog/okta-authentication-angular/social.jpg
type: conversion
github: https://github.com/oktadev/okta-angular-standalone-runtime-config-example
---

Are you ready to hear about the ultimate flexibility in configuring authentication properties in the Okta Angular SDK? You'll want to check out this excellent new feature and walk through the steps of adding authentication using Okta to Angular applications.

{% include integrator-org-warning.html %}

## Configuring authentication properties using Okta in Angular applications

There are three main ways you can add configuration information to Angular applications:
  1. **Define the value within the app** - The easiest, most straightforward route is directly defining the configuration within the `AppModule` or `app.config.ts`. Sure, it's direct, but it can be limiting since the value can always stay the same.
  2. **Add it into `env` files** - You can take the configuration definitions out of the application and pull the values during build time. But this means you'll need to build separate applications for each environment requiring unique configs.
  3. **Populate configuration at runtime** - In this pattern, you'd retrieve the configuration in an HTTP call from an API when the app starts and populate the configuration values upon receiving the HTTP response. Runtime configuration means you can change the config values without building and redeploying the Angular application! It's the ultimate flexibility and the awesome new feature I hinted at in the Okta Angular SDK!

💡 You can read more about these three ways, along with examples, in [Three Ways to Configure Modules in Your Angular App](/blog/2022/02/24/angular-async-config).

The best way to experiment with loading authentication configuration at runtime is to try it out yourself. Pull out your machine and warm up your fingers! If you want to jump to the completed project, you can find it in the [okta-angular-standalone-config-example](https://github.com/oktadev/okta-angular-standalone-runtime-config-example) GitHub repository. Otherwise, let's get coding! 

> **Note**
>
> This post is best for developers familiar with Angular. If you are an Angular newbie, start by building [your first Angular app](https://angular.io/tutorial/first-app) using the tutorial created by the Angular team.

**Prerequisites**

For this tutorial, you will need the following tools:
  * [Node.js](https://nodejs.org/en) v18 or greater
  * [Angular CLI](https://angular.io/cli)
  * A web browser with good debugging capabilities
  * Your favorite IDE. Still on the hunt? I like VS Code and WebStorm because they have integrated terminal windows.
  * Terminal window (if you aren't using an IDE with a built-in terminal)


**Table of Contents**{: .hide }
* Table of Contents
{:toc}


## Scaffold an Angular standalone application

Angular introduced standalone components as a developer preview in v14. Since then, the Angular team continued building support for the architecture. It's now the default when using the Angular CLI in v17, so we'll use standalone components, functional interceptors, and control flow in this sample. 

In the terminal, run the following commands to generate the app and add the components:

```console
npx @angular/cli@17 new okta-angular-example --routing --style scss --defaults
cd okta-angular-example
ng generate component profile --inline-template --inline-style
ng generate component protected --inline-template --inline-style
```

Open the `okta-angular-example` project in your IDE. You'll first define all the routes for the project. Open the `protected` folder and add `routes.ts`. We will treat this component as an entrance to a lazy-loaded route. Add the following code to the `routes.ts`:

```ts
import { Route } from '@angular/router';
import { ProtectedComponent } from './protected.component';

export const PROTECTED_FEATURE_ROUTES: Route[] = [
    { path: '', component: ProtectedComponent }
];
```

Open `app.routes.ts`. Add the following routes:

```ts
import { Routes } from '@angular/router';
import { ProfileComponent } from './profile/profile.component';

export const routes: Routes = [
  { path: 'profile', component: ProfileComponent },
  { path: 'protected', loadChildren: () => import('./protected/routes').then(m => m.PROTECTED_FEATURE_ROUTES)},
];
```

There's more to do here, but we'll add it after you add Okta to the project.

## Create an Okta OAuth 2.0 and OpenID Connect SPA client

You'll use Okta to securely handle authentication and authorization for your Angular application.

{% include setup/cli.md type="spa" framework="Angular" loginRedirectUri="http://localhost:4200/login/callback" logoutRedirectUri="http://localhost:4200" %}

Note the `Issuer` and the `Client ID`. You'll need those values for your authentication configuration coming up soon.

There's one manual change to make in the Okta Admin Console. Add the **Refresh Token** grant type to your Okta Application. Open a browser tab to sign in to your [Okta Integrator Free Plan account](https://developer.okta.com/login/). Navigate to **Applications** > **Applications** and find the Okta Application you created. For Okta Applications using the default name, find the Application named "My SPA." Otherwise find the Application with your custom name. Select the name to edit the application. Find **General Settings** section and press the **Edit** button to add a Grant type. Activate the **Refresh Token** checkbox and press **Save**.

We'll use the [Okta Angular](https://www.npmjs.com/package/@okta/okta-angular) and [Okta Auth JS](https://www.npmjs.com/package/@okta/okta-auth-js) libraries to connect our Angular application with Okta authentication. Add them to your project by running the following command:

```shell
npm install @okta/okta-angular@6.3 @okta/okta-auth-js@7.5
```

## Use the Okta Angular SDK for authentication 

You'll start by directly adding the Okta configuration to the application, which is the first and most straightforward method of adding configuration to Angular applications. Open `app.config.ts`, and make the following modifications to import the `OktaAuthModule` and define the configuration:

```ts
import { OktaAuthModule } from '@okta/okta-angular';
import { OktaAuth } from '@okta/okta-auth-js';

export const appConfig: ApplicationConfig = {
  providers: [
    importProvidersFrom(
      OktaAuthModule.forRoot({
        oktaAuth: new OktaAuth({
          issuer: 'https://{yourOktaDomain}/oauth2/default',
          clientId: '{yourClientId}',
          redirectUri: `${window.location.origin}/login/callback`,
          scopes: ['openid', 'offline_access', 'profile']
        })
      })
    ),
    provideRouter(routes)
  ]
};
```

Don't forget to replace `{yourOktaDomain}` and `{yourClientId}` with the values you got from the Okta CLI!

With Okta added to the project, let's return to the route definitions. You can define the sign-in redirect route and add guards to those routes. Open `app.routes.ts` and make the changes so that your route definitions look like this:

```ts
import { Routes } from '@angular/router';
import { OktaAuthGuard, OktaCallbackComponent } from '@okta/okta-angular';
import { ProfileComponent } from './profile/profile.component';

export const routes: Routes = [
  { path: 'profile', component: ProfileComponent, canActivate: [OktaAuthGuard] },
  { path: 'protected', loadChildren: () => import('./protected/routes').then(m => m.PROTECTED_FEATURE_ROUTES), canActivate: [OktaAuthGuard] },
  { path: 'login/callback', component: OktaCallbackComponent }
];
```

You'll add the code for the components using the Okta SDK to sign in, sign out, and display user claims. We'll keep the components and their styles minimal so we can focus on the authentication pieces.

Open `app.component.html`. Copy the following code into the file.

```html
<div class="toolbar">
  @if (isAuthenticated$ | async) {
  <div>
    <nav class="routes">
      <a routerLink="/">Home</a>
      <a routerLink="/profile">Profile</a>
      <a routerLink="/protected">Protected</a>
    </nav>
  </div>
  <a class="auth" (click)="signOut()">Sign out</a>
  } @else {
  <a class="auth" (click)="signIn()">Sign in</a>
  }
</div>

<p>Learn more about Okta at <a href="https://developer.okta.com">developer.okta.com</a></p>

<router-outlet></router-outlet>
```

In the `app.component.scss`, copy the following code and paste it into the file. No frills here! We are keeping this focused on function, not form. 😅

```scss
:host {
  font-family: sans-serif;
}

a,
a:visited,
a:hover {
  color: #095661;
}

.toolbar {
  display: flex;
  justify-content: flex-end;
  align-items: baseline;
}

.routes,
.routes > a + a {
  margin-left: 1rem;
}

.auth {
  border: 1px solid #999;
  border-radius: 4px;
  padding: 4px 8px;

  &:hover {
  background-color: #2d8c9e;
  color: #fff;
  }
}

p {
  margin: 6rem;
  text-align: center;
  font-size: large;
}
```

Finally, we can get to the interesting authentication components. Open `app.component.ts`. Since this is a standalone component, you must import the classes it relies on, `AsyncPipe`, `RouterOutlet`, and `RouterLink`.

You'll use two classes and libraries from Okta, so inject the `OktaAuthStateService` and `OKTA_AUTH` injection tokens. The `OktaAuthStateService.authState$` observable stream emits an authenticated state. You can use this to watch for whether you show the sign-in or sign-out buttons and add the functionality to sign in and sign out using Okta:

```ts
import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { OktaAuthStateService, OKTA_AUTH } from '@okta/okta-angular';
import { AuthState } from '@okta/okta-auth-js';
import { filter, map } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [AsyncPipe, RouterOutlet, RouterLink],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  private oktaStateService = inject(OktaAuthStateService);
  private oktaAuth = inject(OKTA_AUTH);

  public isAuthenticated$ = this.oktaStateService.authState$.pipe(
    filter((s: AuthState) => !!s),
    map((s: AuthState) => s.isAuthenticated ?? false)
  );

  public async signIn(): Promise<void> {
    await this.oktaAuth.signInWithRedirect();
  }

  public async signOut(): Promise<void> {
    await this.oktaAuth.signOut();
  }
}
```

This code gets you authenticated using Okta. Feel free to start the application and verify you can sign in and out. Serve the application by running the following command in your terminal:

```console
npm start
```

> **Note**
> 
> If you have app initialization errors, double-check your Okta configuration and replace the placeholders.

You should see something like this when you start the application:

<div style="border: 1px silver solid; display: flex; justify-content: center">
{% img blog/okta-authentication-angular/app-start.jpg alt:"Screenshot of application start showing a sign in button and a link to the Okta Developer site" width:"800" %}
</div>


The links for the profile and protected routes display after you sign in.

<div style="border: 1px silver solid; display: flex; justify-content: center">
{% img blog/okta-authentication-angular/app-authenticated.jpg alt:"Screenshot of application after authenticating showing a sign out button, links to profile and protected routes, and a link to the Okta Developer site" width:"800" %}
</div>

I made no claims about building a _beautiful_ app. 

The profile and protected routes display the default text from Angular CLI. It's time to add something a little more interesting!

## Display OpenID Connect claims

The profile should display something about the profile! So, let's add the code to read one of your standard ID claims and display a warm, friendly greeting to the signed-in user. Open `profile.component.ts`. This component uses an inline template and styles.

You'll add the `AsyncPipe` to the imports array and the following template code, replacing the existing template:

{% raw %}
```html
<p>You're logged in!
  @if(name$ | async; as name) {
    <span>Welcome, {{name}} </span>
  }
</p>
```
{% endraw %}

Time to pretty up the template. Check out the styles, and add this stylistic marvel into the component declaration for the inline styles. Feel free to add some extra flair if you'd like and make this project your own. 🎉

```scss
p {
  text-align: center;
}
```

To display the claim value, you'll use the `OktaAuthStateService`, which holds your ID token and already decodes the payload for you. That's pretty handy! You'll pipe the `authState$` observable stream to filter out unauthenticated state and then use the `name` claim property. Your component code will look like this:

```ts
export class ProfileComponent {
  private oktaAuthStateService = inject(OktaAuthStateService);
  public name$ = this.oktaAuthStateService.authState$.pipe(
    filter((authState: AuthState) => !!authState && !!authState.isAuthenticated),
    map((authState: AuthState) => authState.idToken?.claims.name ?? '')
  );
}
```

When you sign in and navigate to the profile route, you'll see something like this.

<div style="border: 1px silver solid; display: flex; justify-content: center">
{% img blog/okta-authentication-angular/app-profile.jpg alt:"Screenshot of profile route displaying a welcome message with the user's name" width:"800" %}
</div>

With this, you should now have a working app that allows you to sign in, navigate to protected to see there's nothing there, navigate to profile and feel welcomed, and lastly sign out. Most applications with authentication need an interceptor to add the `Authorization` header. Even though we aren't calling an API, let's put it in to walk through the steps.

## Intercept HTTP requests to add the Authorization header with a functional interceptor

Interceptors manipulate outgoing and incoming HTTP requests, and it's a fantastic way to automatically add the `Authorization` header along with the access token to outgoing calls!

In a new terminal, use Angular CLI to scaffold an interceptor using the following command:

```console
ng generate interceptor auth
```

Open the `auth.interceptor.ts` file to make the required changes. You'll see Angular CLI created the interceptor function. The `Authorization` header contains highly sensitive information, the access token! 

<table>
<tr>
    <td style="font-size: 3rem;">⚠️</td>
    <td markdown="span">
      **Heads up!** <br/>
      The access token grants the caller permission to access resources, perform actions, and potentially make devastating changes in the name of the user to whom the access token belongs. You don't want the token to fall into the wrong hands!
    </td>
</tr>
</table>

 In other words, we must protect the token by sending the token to allowed origins. Change the interceptor code to look like this:

```ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { OKTA_AUTH } from '@okta/okta-angular';

export const authInterceptor: HttpInterceptorFn = (req, next, oktaAuth = inject(OKTA_AUTH)) => {
  let request = req;
  const allowedOrigins = ['/api'];
  const accessToken = oktaAuth.getAccessToken();
  if(accessToken && !!allowedOrigins.find(origin => req.url.includes(origin))) {
    request = req.clone({ setHeaders: { 'Authorization': `Bearer ${accessToken}` } });
  }

  return next(request);
};
```

You've completed the interceptor code, but you have to register the interceptor in the application and bring in the HTTP libraries. Open `app.config.ts` and add the following code to the `providers` array after the `provideRouter(routes)` line:

```ts
provideHttpClient(withInterceptors([
  authInterceptor
]))
```

When you make HTTP calls to allowed origins, you'll now see the access token in the header. Feel free to try this out on your own by calling an API such as this [sample Express API from Okta](https://github.com/okta/samples-nodejs-express-4/tree/master/resource-server), which verifies the access token, too. 

We've done a lot, but the application still contains the hard-coded Okta configuration. What if you want to load the configuration at runtime from an external source? We can emulate this process!

## Add runtime authentication configuration to an Okta Angular app

Stop the application by typing `ctrl+c` in the command line. You'll change the `angular.json` file, which requires a restart of the application. 

Emulate the response from calling an external API by creating a folder called `api` inside the existing `src` folder. Then, create a file called `config.json` within the `api` folder. Your project file structure will look like this:

``` markup
okta-angular-example
├── src
│   ├── api
│   │   └── config.json
│   ├── app
│   │   └── all the components
│   └── assets, remaining files
└── remaining files
```

Open `config.json` and add the following JSON properties. We'll use this format for the configuration response you get from calling an external API:

```json
{
    "issuer": "https://{yourOktaDomain}.okta.com/oauth2/default",
    "clientId": "{yourClientId}"
}
```

Hey! Those properties and variables look familiar, right? Replace the variables to match what you got from the Okta CLI and what you have in the `app.config.ts` file.

The Angular project doesn't recognize this API path and config file, so if you try serving the application right now, the `ng serve` process won't serve the `config.json` file with the app. We must also configure the serve process to include the `api` folder. Open `angular.json` and find the `projects.okta-angular-example.architect.build` section. Add `src/api` to the list of assets in the build option:

```json
{
  "assets": [
    "src/favicon.ico",
    "src/assets",
    "src/api"
  ]
}
```

You can now access the `config.json` file at runtime. Feel free to start the application again using `npm start` in the terminal. In the browser, navigate to `http://localhost:4200/api/config.json`. This route is accessible by your application, and we'll mimic an HTTP call to read the configuration at runtime.

Open `app.config.ts`. Add a function before the `export const appConfig` to call the config endpoint for the configuration as shown:

```ts
function configInitializer(httpBackend: HttpBackend, configService: OktaAuthConfigService): () => void {
  return () =>
  new HttpClient(httpBackend)
  .get('api/config.json')
  .pipe(
    tap((authConfig: any) => configService.setConfig({
      oktaAuth: new OktaAuth({
        ...authConfig,
        redirectUri: `${window.location.origin}/login/callback`,
        scopes: ['openid', 'offline_access', 'profile']
      })
    })),
    take(1)
  );
}
```

Let's talk through the code. The function takes two parameters - the `HttpBackend` class and the `OktaAuthConfigService` classes. You first create a new `HttpClient`. Notice we're not using the `HttpClient` we can get from Angular dependency injection. We want our auth interceptor to skip *this* HTTP call. Once you get the `config.json` response, you set the `OktaAuthConfigService` with those properties.

Next, you can change the `ApplicationConfig`, by removing the configuration from the `OktaAuthModule` by deleting the `.forRoot` method call. You also need this function to run when the application starts. The `APP_INITIALIZER` injection token exists precisely for this need. Provide the `APP_INITIALIZER` injection token with the `configInitializer` function and the necessary dependencies, and add it to the providers array. The `appConfig` now looks like this:

```ts
export const appConfig: ApplicationConfig = {
  providers: [
    importProvidersFrom(
      OktaAuthModule
    ),
    provideRouter(routes),
    provideHttpClient(withInterceptors([
      authInterceptor
    ])),
    { provide: APP_INITIALIZER, useFactory: configInitializer, deps: [HttpBackend, OktaAuthConfigService], multi: true },
  ]
};
```

Check it out to verify you can sign in, greet yourself at the profile route, and sign out. Success!

> **What if you use NgModules architecture?**
>
> While this sample demonstrates how to add runtime configuration loading in a standalone application, you can use the same steps in an Angular application with NgModule architecture. Instead, you'll provide the `APP_INITIALIZER` in the `AppModule` providers array.

## Use OAuth 2.0, OpenID Connect, and the Okta Angular SDK for secure authentication

In this post, you added runtime Okta configuration in an Angular app using standalone components. Whew! That was a lot of work, but I hope you found it fun and exciting. You can check out the completed application in the [okta-angular-standalone-runtime-config-example](https://github.com/oktadev/okta-angular-standalone-runtime-config-example) GitHub repository.

Complete code projects include testing. I didn't walk through the steps of adding unit tests in this post, but you can inspect the completed code project to view and run the tests, too.

Ready to read other interesting posts? Check out the following links.

* [Practical Uses of Dependency Injection in Angular](/blog/2022/10/11/angular-dependency-injection)
* [Loading Components Dynamically in an Angular App](/blog/2021/12/08/angular-dynamic-loading)
* [How to Build Micro Frontends Using Module Federation in Angular](/blog/2022/05/17/angular-microfrontend-auth)
* [Defend Your SPA from Security Woes](/blog/2022/07/06/spa-web-security)
* [Streamline Your Okta Configuration in Angular Apps](/blog/2023/03/07/angular-forroot)

Don't forget to follow us on [Twitter](https://twitter.com/oktadev) and subscribe to our [YouTube channel](https://www.youtube.com/c/OktaDev/) for more exciting content. We also want to hear about what tutorials you want to see. Leave us a comment below!
