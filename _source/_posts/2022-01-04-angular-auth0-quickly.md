---
layout: blog_post
title: "Add OpenID Connect to Angular Apps Quickly"
author: matt-raible
by: advocate
communities: [javascript]
description: "This tutorial shows you how to add OpenID Connect authentication with Auth0 in just a few minutes."
tags: [javascript, angular, typescript, auth0]
tweets:
- ""
- ""
- ""
image:
type: conversion
github: https://github.com/oktadev/auth0-angular-example
---

AngularJS 1.0 was released in October 2020. At the time, it was one of the most popular web frameworks to ever see the light of day. Developers loved it and many apps were created with it. It's next major release, Angular 2.0, was released in September 2016. Six years is a long time between major releases. Angular 2 took over two years to develop and many folks jumped to other frameworks rather than waiting for the rewrite. 

Today, five years after Angular 2 was released, we just call it "Angular" and its version numbers have far less meaning. Five years is a long time for a modern JS web framework to live and thrive. If you look at the number of Stack Overflow questions, you'll see that users struggle with React far more than Angular.

<script src="https://www.gstatic.com/charts/loader.js"></script>
<div id="stack-overflow-tags"></div>
<script>
google.charts.load('current', {packages: ['corechart', 'bar']});
google.charts.setOnLoadCallback(drawChart);
function drawChart() {
  var data = google.visualization.arrayToDataTable([
    ['Framework', 'Stack Overflow tags', { role: 'style' }],
    ['Angular', 266938, 'red'],
    ['React', 348946, '#61dafb'],
    ['Vue', 87085, '#4fc08d']
  ]);
  var options = {
    title: 'Stack Overflow Tagged Questions',
    chartArea: {width: '50%'},
    hAxis: {
      title: 'Tags',
      minValue: 0
    },
    vAxis: {
      title: 'Web Framework'
    }
  };
  var chart = new google.visualization.BarChart(document.getElementById('stack-overflow-tags'));
  chart.draw(data, options);
}
</script>

I kid, I kid. 😅

I don't think Stack Overflow tags indicate that developers have a hard time with the framework, I think they indicate a thriving community. The more questions, the more people are using it. 

[hotframeworks.com](https://hotframeworks.com/) lists a score that combines GitHub stars with Stack Overflow tags and says the top six web frameworks are as follows (at the time of this writing):

1. React
2. ASP.NET MVC
3. Angular
4. Ruby on Rails
5. AngularJS
6. Vue.js

Angular is still very popular among developers. If you're developing an Angular app today, you probably need a way to authenticate your users. That's where OpenID Connect (OIDC) can help you. OIDC is a layer on top of OAuth 2.0 that provides identity. 

In this tutorial, I'll how you to add OIDC authentication with Auth0 to a new Angular app in just a few steps. 

**Prerequisites:**

* A favorite text editor or IDE. I recommend [IntelliJ IDEA](https://www.jetbrains.com/idea/), but I know many JavaScript developers prefer [Visual Studio Code](https://code.visualstudio.com/).
* [Node.js](http://nodejs.org/) v14+ and npm installed.

{% include toc.md %}

## Create an Angular app

First, you'll need to create a new Angular app with routing enabled.

```shell
npx @angular/cli@13 new auth0-demo --routing
```

Select your favorite stylesheet format. The selection you make doesn't matter for this example.

## Add Auth with OpenID Connect

To add authentication with Auth0, you'll first need a [free Auth0 account](https://auth0.com/signup). Install the [Auth0 CLI](https://github.com/auth0/auth0-cli#installation) and run `auth0 login` to register your account. Then, run `auth0 apps create`. Specify a name and description of your choosing. Select **Single Page Web Application** and use `http://localhost:4200/home` for the Callback URL. Specify `http://localhost:4200` for the rest of the URLs.

{% img blog/angular-auth0/auth0-apps-create.png alt:"auth0 apps create" width:"800" %}{: .center-image }

Once you have a new Angular app and Auth0 OIDC set up, you can use [OktaDev Schematics](https://github.com/oktadev/schematics#angular--auth0) to add OAuth 2.0 and OIDC support to your Angular app.

```shell
ng add @oktadev/schematics --auth0
```

You'll be prompted for an issuer and client ID. You should have these from the OIDC app you just created. The issuer will be displayed right above your client ID.

```shell
=== dev-0ua1y-go.us.auth0.com application created

  CLIENT ID            TJgZxGnlSkqUe6JfMFSipZcFsbpl6LS2
```

This process will perform the following steps for you:

1. Install the [Auth0 Angular SDK](https://github.com/auth0/auth0-angular).
2. Add `src/app/auth-routing.module.ts` with your OIDC configuration and initialization logic.
3. Configure an `AuthHttpInterceptor` that adds an `Authorization` header with an access token to outbound requests.
4. Create a `HomeComponent` and configure it with authentication logic.
5. Update unit tests for `AppComponent` and `HomeComponent` to mock Auth0.

To see all the changes it makes to your files, see [this pull request on GitHub](https://github.com/oktadev/auth0-angular-example/pull/1/files). 

### Use the Auth0 Console instead of the CLI

You can also use the Auth0 Console to create an OIDC app:

* [Log in](https://auth0.com/auth/login) to Auth0 or [create an account](https://auth0.com/signup) if you don't have one. Go to **Applications** > **Create Application**.
* Choose **Single Page Web Applications** as the application type and click **Create**.
* Click **Angular**, then the **Settings** tab.
* Add `http://localhost:4200/home` as an Allowed Callback URL and `http://localhost:4200` as a Logout URL.
* Specify `http://localhost:4200` as an Allowed Origin and click **Save Changes** at the bottom.

### Test your Angular authentication flow

Run `ng serve` in your app, and you should see a login button at `http://localhost:4200/home`.

{% img blog/angular-auth0/auth0-login-button.png alt:"Auth0 Login button" width:"800" %}{: .center-image }

Click the **Login** button and sign in with one of the users that's configured in your Auth0 application, or sign up as a new user.

{% img blog/angular-auth0/auth0-login-form.png alt:"Auth0 Login form" width:"800" %}{: .center-image }

You'll be redirected back to your app and a **Logout** button will be displayed in the bottom left corner.

{% img blog/angular-auth0/auth0-logout-button.png alt:"Auth0 Logout button" width:"800" %}{: .center-image }

### Display the authenticated user's name

To display the authenticated user's name, you can use the `user$` observable on the `AuthService` instance.

Modify `src/app/home/home.component.html` to display a welcome message to the user.

{% raw %}
```html
<div>
  <button *ngIf="(auth.isAuthenticated$ | async) === false" (click)="login()" id="login">Login</button>
  <div *ngIf="auth.user$ | async as user">
    <h2>Welcome, {{user?.name}}!</h2>
  </div>
  <button *ngIf="auth.isAuthenticated$ | async" (click)="logout()" id="logout">Logout</button>
</div>
```
{% endraw %}

Refresh your app, and you should see your name displayed.

{% img blog/angular-auth0/display-user-name.png alt:"Display user's name" width:"800" %}{: .center-image }

If everything works—congrats!

## Learn more about Angular and OpenID Connect

I hope you enjoyed this quick tutorial on using Auth0 for authentication in your Angular apps. If you're looking for a more detailed step-by-step tutorial, please read [The Complete Guide to Angular User Authentication with Auth0](https://auth0.com/blog/complete-guide-to-angular-user-authentication/).

You can find the source code for the example on GitHub in the [@oktadev/auth0-angular-example](https://github.com/oktadev/auth0-angular-example) repository.

To learn more about Angular and OIDC, check out the following blog posts:

- [What You Need to Know about Angular v13](/blog/2021/11/10/angular-v13)
- [The Things to Keep in Mind about Auth](/blog/2021/10/29/things-to-keep-in-mind-about-auth)
- [A Quick Guide to Angular and GraphQL](/blog/2021/10/22/angular-graphql)

[{% img blog/angular-auth0/angular-mini-book.jpg alt:"The Angular Mini-Book" width:"100" %}{: .pull-right }](https://www.infoq.com/minibooks/angular-mini-book/)
I [just published a mini-book book on Angular](https://raibledesigns.com/rd/entry/the_angular_mini_book_1) that might interest you too. It's called [The Angular Mini-Book](https://www.infoq.com/minibooks/angular-mini-book/) and is available as a free download from InfoQ. It's a tutorial-style book that shows you how to develop a bare-bones application, test it, and deploy it. Then you'll move on to adding Bootstrap, Angular Material, continuous integration, and authentication. Spring Boot is a popular framework for building REST APIs. You'll learn how to integrate Angular with Spring Boot and use security best practices like HTTPS and a content security policy.

If you liked this tutorial, chances are you like others we publish. Please follow [Auth0](https://twitter.com/auth0) and [OktaDev](https://twitter.com/oktadev) on Twitter to get notified when we publish new developer tutorials.
