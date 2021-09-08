---
layout: blog_post
title: "What Is Angular Ivy and Why Is It Awesome?"
author: holger-schmitz
by: contractor
communities: [javascript]
description: "This tutorial shows you how to upgrade an Angular 8 app to Angular 9 with Ivy."
tags: [angular, ivy, angular9, angular-upgrade, angular-material]
tweets:
- "Angular Ivy is part of Angular 9 and reduces the size of generated JavaScript. Find out how to use it in this tutorial."
- "Want faster @angular apps? Upgrade to Angular 9 with Ivy!"
- "❤️ Angular? We do too! That's why we wrote this guide on how to upgrade to Angular 9 with Ivy."
image: blog/angular-ivy/angular9-ivy.png
type: conversion
---

Over the last year or so, a new buzzword started floating around Angular forums and blogs. The word was **Ivy**. Ivy promises to make your application faster and smaller. But what exactly does this new technology do? 

Ivy is a complete rewrite of Angular's rendering engine. In fact, it is the fourth rewrite of the engine and the third since Angular 2. But unlike rewrites two and three, which you might not have even noticed, Ivy promises huge improvements to your application. With Ivy, you can compile components more independently of each other. This improves development times since recompiling an application will only involve compiling the components that changed. 

Ivy also has a very big focus on tree-shaking. This is the process in which the TypeScript compiler looks at your code and figures out exactly which libraries are needed and then eliminates any unused code. As a result, the distributed code will be much smaller and the loading times of your application will improve.

With all these improvements Ivy brought in, you should seriously consider upgrading your project to use Angular Ivy.

{% img blog/angular-ivy/angular9-ivy.png alt:"Angular 9 + Ivy FTW!" width:"600" %}{: .center-image }

Ivy has been around in a preview version since Angular 8, but you previously had to manually opt into using the new engine. With Angular 9, Ivy is the standard engine for rendering your content. 

With all these massive changes behind the scenes, you might be scared and wonder how much you would need to refactor your code to be compatible with Ivy. It turns out that the Angular team has made backward compatibility a priority and, in most cases, you should not have to change anything in your application other than updating it to the latest Angular version.

In this tutorial, I'll show you how to upgrade an existing application from Angular 8 to Angular 9. By upgrading, the application will automatically use the new Ivy rendering engine. You'll start with the Angular 8 app from [Build a Beautiful App + Login with Angular Material](/blog/2020/01/21/angular-material-login).

**Table of Contents**{: .hide }
* Table of Contents
{:toc}

## Install the Angular Material Tic-Tac-Toe Game

For this tutorial, I will assume that you have some knowledge of TypeScript and Angular and that you have Git and Node 10.13+ installed on your system. 

To start, clone the Tic-Tac-Toe application from GitHub. Open your terminal in a directory of your choice and type the following command.

```bash
git clone https://github.com/oktadeveloper/okta-angular-material-login-example.git okta-angular-ivy-example
```

This will create a new folder `okta-angular-ivy-example`. Navigate into that folder, check out the starting point, and install all the JavaScript dependencies.

```bash
git checkout ea7e0f1 # Angular 8 version
npm install
```

> **NOTE**: The Angular Material blog post was recently updated to use Angular 11. That's why you need to checkout the commit with the Angular 8 version.

Now that you have installed all the packages, you can build the application. This will give you a *before* snapshot of the build-size for the Angular 8 project. Run the following command in the terminal.

```bash
ng build
```

After the terminal completes the build, take a look at the files in `dist/material-tic-tac-toe`. You will find two types of JavaScript files. Modern browsers will load files ending in `es2015.js` as modules. Modules allow lazy loading and improve page loading times. Files ending in `es5` are intended for older browsers and produce longer loading times. The combined size of the `es2015.js` files is about 7.6 MB and the combined size of the `es5.js` files is around 9.4 MB.

## Upgrading to Angular 9 with Ivy

To start, install Angular CLI v9. In your terminal, run the command below.

```bash
npm install -g @angular/cli@9.0.1
```

_Depending on your system, you may have to run this command using `sudo`._

Before you can upgrade the application to Angular 9, you have to upgrade it to the very latest Angular 8 version. To do this, open the terminal in the base directory of the Tic-Tac-Toe app and run the update command as follows.

```bash
ng update @angular/core@8 @angular/cli@8
```

Before you can continue, you will have to install any modified package dependencies and commit the changes to git. Run the following two commands.

```bash
npm install
git commit -a -m "Upgrade to the latest version of Angular 8"
```

Now you can update to Angular 9 by running `ng update` again with different arguments.

```bash
ng update @angular/core @angular/cli --next
```

This can take a couple of minutes to complete.  Then you need to install any modified package dependencies again and commit everything to git.

```bash
npm install
git commit -a  -m "Upgrade to Angular 9"
```

Now, upgrade the Angular Material libraries to their latest version.

```bash
ng update @angular/material --next
```

You might receive an error about Angular Flex-Layout:

```
Package "@angular/flex-layout" has an incompatible peer dependency to "@angular/cdk" (requires "^8.0.0-rc.0", would install "9.0.0").
Incompatible peer dependencies found.
```

Add `--force` to the above command to work around this.

```bash
ng update @angular/material --next --force
```

Update Angular Flex-Layout to its latest version:

```bash
npm i @angular/flex-layout@9.0.0-beta.29
```

## Setting Up Okta Authentication

The application uses Okta for authentication. In order to sign in to the Tic-Tac-Toe game, you will need to sign up for an account with Okta and register the application. Don't worry, registering is free and easy.

{% include setup/cli.md type="spa" framework="Angular" 
   loginRedirectUri="http://localhost:4200/login"
   loginRedirectUri="http://localhost:4200" %}

In your application, open `src/app/auth.service.ts`. At the top of the `AuthService` class, you should see the following code.

```ts
private authClient = new OktaAuth({
  issuer: 'https://{YourOktaDomain}/oauth2/default',
  clientId: '{ClientId}'
});
```

Replace `{YourOktaDomain}` with the domain that you can see at the top right of your Okta Dashboard. Replace `{ClientId}` with the client ID that you saw in the previous step.

Congratulations, you successfully upgraded an existing Angular 8 application to Angular 9! Pretty easy, don't you think?!

The application now uses Ivy with all its advantages. To see how the build size has improved, build the application again by running the following command.

```bash
ng build
```

Now, take a look again at the files in `dist/material-tic-tac-toe`. In my build, the combined size of the `es2015.js` files is now just over 5.6 MB and the combined size of the `es5.js` files is just 7.1 MB. This is a 26% improvement for modern browsers and a 24% improvement for the compatibility files!

<script src="https://www.gstatic.com/charts/loader.js"></script>
<div id="angular8vs9"></div>
<script>
google.charts.load('current', {packages: ['corechart', 'bar']});
google.charts.setOnLoadCallback(angular8vs9);

function angular8vs9() {
  var data = google.visualization.arrayToDataTable([
    ['Apps', 'Angular 8', 'Angular 9 + Ivy'],
    ['Legacy Browsers (ES5)', 9.4, 7.1],
    ['Modern Browsers (ES2015)', 7.6, 5.6]
  ]);

  var options = {
    title: 'Angular Application Size',
    chartArea: {width: '50%'},
    hAxis: {
      title: 'Size in Megabytes',
      minValue: 0
    },
    vAxis: {
      title: 'Generated Bundles'
    }
  };

  var chart = new google.visualization.BarChart(document.getElementById('angular8vs9'));
  chart.draw(data, options);
}
</script>
<noscript>
{% img blog/angular-ivy/angular-app-size-graph.png alt:"Angular App Size Comparison" width:"800" %}{: .center-image }
</noscript>

## Compile Your Angular App with AOT

You can reduce your file size even more if you use Angular's ahead-of-time (AOT) compiling. The Angular AOT compiler converts your Angular HTML and TypeScript code into efficient JavaScript code during the build phase _before_ the browser downloads and runs that code. Compiling your application during the build process provides a faster rendering in the browser. This process also removes unused code, which shrinks the file volume.

Build your app with AOT using the following command.

```bash
ng build --prod
```

If you look at the generated files in your `dist/dist/material-tic-tac-toe`, you'll see that they're **much** smaller!

* ES5 size: 897 KB 
* ES2015 size: 693 KB

<div id="angular9Aot"></div>
<script>
google.charts.setOnLoadCallback(angular9Aot);

function angular9Aot() {
  var data = google.visualization.arrayToDataTable([
    ['Apps', 'Angular 8', 'Angular 9 + Ivy', 'Angular 9 + AOT'],
    ['Legacy Browsers (ES5)', 9.4, 7.1, 0.897],
    ['Modern Browsers (ES2015)', 7.6, 5.6, 0.693]
  ]);

  var options = {
    title: 'Angular Application Size',
    chartArea: {width: '50%'},
    hAxis: {
      title: 'Size in Megabytes',
      minValue: 0
    },
    vAxis: {
      title: 'Generated Bundles'
    }
  };

  var chart = new google.visualization.BarChart(document.getElementById('angular9Aot'));
  chart.draw(data, options);
}
</script>
<noscript>
{% img blog/angular-ivy/ng-comparison-with-ng9-aot.png alt:"Angular Size Comparison with AOT" width:"800" %}{: .center-image }
</noscript>

You might be wondering what the build-size of the Angular 8 AOT-compiled version is. For your convenience, I calculated them.

* ES5 size: 906 KB 
* ES2015 size: 702 KB

These numbers show that Angular 9 shaved off 9 KB from each production build. 

<div id="angular8vs9Aot"></div>
<script>
google.charts.setOnLoadCallback(angular8vs9Aot);

function angular8vs9Aot() {
  var data = google.visualization.arrayToDataTable([
    ['Apps', 'Angular 8', 'Angular 8 + AOT', 'Angular 9 + Ivy', 'Angular 9 + AOT'],
    ['Legacy Browsers (ES5)', 9.4, 0.906, 7.1, 0.897],
    ['Modern Browsers (ES2015)', 7.6, 0.702, 5.6, 0.693]
  ]);

  var options = {
    title: 'Angular Application Size',
    chartArea: {width: '50%'},
    hAxis: {
      title: 'Size in Megabytes',
      minValue: 0
    },
    vAxis: {
      title: 'Generated Bundles'
    }
  };

  var chart = new google.visualization.BarChart(document.getElementById('angular8vs9Aot'));
  chart.draw(data, options);
}
</script>
<noscript>
{% img blog/angular-ivy/ng-comparison-with-aot.png alt:"Angular Size Comparison with AOT" width:"800" %}{: .center-image }
</noscript>

_**NOTE:** You can find the calculations for these comparison numbers in [this Gist](https://gist.github.com/mraible/49207e1264fa46bfa76d767021c2fde9)._

My conclusion? Make sure you build your production apps with AOT enabled!

## Test Your Angular 9 App

To prove your application works, you can run the following command.

```bash
ng serve
```

Now open your browser `http://localhost:4200`. When you click on the **Play** menu item, the program will ask for your Okta login. After that, it should redirect you to the Tic-Tac-Toe game. Play a game or two and enjoy your success!

{% img blog/angular-ivy/tic-tac-toe-game.png alt:"Tic Tac Toe using Angular Ivy" width:"800" %}{: .center-image }

## Test Your Angular App's Performance with Lighthouse

If you run a Lighthouse audit (Chrome Developer Tools > Audits > Generate report), you'll see that the version `ng serve` produces is far from performant.

{% img blog/angular-ivy/lighthouse-ng-serve.png alt:"Lighthouse Audit of ng serve" width:"800" %}{: .center-image }

Earlier, you created the AOT-optimized version by running `ng build --prod`. To see how much better the optimized version is, install `serve` and run it on port 4200.

```bash
npm i -g serve
serve dist/material-tic-tac-toe -p 4200 -s
```

Generate the report again, and you'll see much better results.

{% img blog/angular-ivy/lighthouse-aot.png alt:"Lighthouse Audit of AOT build" width:"800" %}{: .center-image }

## Learn More About Angular

In this tutorial, I showed you how you can use the new Angular Ivy rendering engine to improve the loading performance and development speed of your Angular application. By simply upgrading an Angular 8 application to Angular 9, the new rendering pipeline will be used by default. In the example I have shown you, the resulting bundle size was decreased by over 25%.

You can find the source code for this example on GitHub at [oktadeveloper/okta-angular-ivy-example](https://github.com/oktadeveloper/okta-angular-ivy-example).

If you want to learn more about Angular, using Angular with Okta authentication, or Material Design, check out the links below.

* [Build a Beautiful App + Login with Angular Material](/blog/2020/01/21/angular-material-login)
* [Angular MVC - A Primer](/blog/2019/04/26/angular-mvc-primer)
* [Build an Angular App with Okta's Sign-In Widget in 15 Minutes](/blog/2017/03/27/angular-okta-sign-in-widget)
* [Build a CRUD App with Angular 9 and Spring Boot 2.2](/blog/2020/01/06/crud-angular-9-spring-boot-2)
* [Build a Basic CRUD App with Angular and Node](/blog/2018/10/30/basic-crud-angular-and-node)

If you liked this tutorial and want to be notified when we publish more, follow [@oktadev on Twitter](https://twitter.com/oktadev), subscribe to [our YouTube channel](https://youtube.com/c/oktadev), or [follow us on LinkedIn](https://www.linkedin.com/company/oktadev/). If you have a question, please leave a comment below.
