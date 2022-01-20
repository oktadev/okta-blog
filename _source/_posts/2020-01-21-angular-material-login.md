---
disqus_thread_id: 7828881496
discourse_topic_id: 17203
discourse_comment_url: https://devforum.okta.com/t/17203
layout: blog_post
title: "Build a Beautiful App + Login with Angular Material"
author: holger-schmitz
by: contractor
communities: [javascript]
description: "This tutorial shows you how to build a beautiful login form with Angular Material."
tags: [angular, angularmaterial, login, websecurity]
tweets:
- "Angular Material offers a convenient way to make your @angular apps beautiful. Learn more in this quick tutorial."
- "Want Login? This guide shows you how to create a secure login form with Angular Material."
- "❤️ Angular? We do too! That's why we wrote this guide on how to build a login screen with Angular Material."
image: blog/angular-material-login/angular-material-login.png
type: conversion
github: https://github.com/oktadev/okta-angular-material-login-example
changelog:
- 2022-01-11: Updated to use Angular 13 and the Okta Auth JS 5.9.1, and to handle interactions with OktaAuth library. You can see the changes in the [example app on GitHub](https://github.com/oktadev/okta-angular-material-login-example/pull/4). Changes to this article can be viewed in [oktadeveloper/okta-blog#1022](https://github.com/oktadev/okta-blog/pull/1022).
- 2020-03-30: Updated to use Angular 11 and the Okta Auth JS 4.8.0. You can see the changes in the [example app on GitHub](https://github.com/oktadeveloper/okta-angular-material-login-example/pull/3). Changes to this article can be viewed in [oktadeveloper/okta-blog#637](https://github.com/oktadeveloper/okta-blog/pull/637).
---

Usability is a key aspect to consider when creating a web application, and that means designing a clean, easy-to-understand user interface. Leveraging common design languages can help make that goal a reality with their recognizable components that many users will understand right away. However, unlike desktop apps where the operating system provides a set of uniform widgets, there has historically been no common design language to lean on for web app developers. 

That was until Google released its Material Design in 2014. Material Design was born from the desire to create a common user experience across Android devices and web applications and consists of a number of components that are available for both Android and JavaScript applications.

Since its original publication, Material Design has become extremely popular. Many libraries have been developed that incorporate the components into existing frameworks. Within Angular applications, you can use the `@angular/material` library. This makes the complete set of Material components available for your Angular templates. Of course, once you have decided to use Material Design in your application you will want to make sure that every part of the app uses it. After all, it is supposed to be a common design language.

Many modern applications make use of single-sign-on services such as Okta. In its default configuration, Okta will redirect the user to a hosted login page and, after a successful sign-in redirect them back to the application. If you're using material design in your application, you might want to create your own login form, so it looks similar to the rest of your app. Luckily, Okta makes this easy to do.

{% img blog/angular-material-login/login-form.png alt:"Angular Material Login" width:"450" %}{: .center-image }

In this tutorial, I'll show you how to create a login form like the one above. You'll create an Angular app, use Material Design, and make it require user login. Okta provides a library specifically for Angular applications, but I will be using the more low-level `okta-auth-js` library. This library allows you to have full control over your HTML and just handles communication with Okta's API. All of Okta's JavaScript libraries are built on top of `okta-auth-js`. To make the application a bit more interesting, I will be creating a small tic-tac-toe game that will be protected using Okta for authentication.

**Table of Contents**{: .hide }
* Table of Contents
{:toc}

## Build an Angular Material App with Secure Login

To get started, you will need the Angular command-line tool. I will assume that you have some familiarity with JavaScript and that you have Node installed on your system together with the Node Package Manager `npm`.

Open a terminal and run the following command to verify if you have Angular CLI installed.

```bash
ng version
```

If you see output with Angular CLI version installed, you're good to move on to the next step. Otherwise, you don't already have Angular CLI installed, so install it by running.

```bash
npm install -g @angular/cli
```

Depending on your operating system, you might have to run this using the `sudo` command. This will install the Angular command-line tool on your system. It lets you use the `ng` command to set up and manipulate Angular applications. In order to create an Angular app for the version we want, we'll use `npx` to create a new app. To create a new application navigate to a directory of your choice and run the following.

```bash
npx @angular/cli@13 new material-tic-tac-toe
```

You will be asked two questions. Answer **Yes** to the first question. This will set up the router in your application. The router is responsible for letting the user navigate between different parts of the app and updating the browser's URL without actually reloading the page. For the second question, accept the default choice **CSS**. This application will use simple CSS stylesheets, but you can see how easy it is to switch to a different stylesheet technology with Angular.

{% img blog/angular-material-login/angular-style-options.png alt:"Angular stylesheet options" width:"700" %}{: .center-image }

Once the wizard has completed you should see a new folder called `material-tic-tac-toe`. Navigate into the folder and install some packages you will need for the application by running the command below.

```bash
npm install -E @angular/flex-layout@13.0.0-beta.36 tic-tac-toe-minimax@1.0.8
```

`@angular/flex-layout` provides a CSS layout system supporting both FlexBox and CSS Grid using Angular directives. It is independent of the Material components but is often used together with it. And, `tic-tac-toe-minimax` is a ready-to-go tic-tac-toe game with a computer player.

Now you'll add Angular Material library using their schematic that automatically adds the dependencies, sets the theme, imports Material icons and a font, and adds some basic styles. Run the command below.

```bash
ng add @angular/material@13
```

You'll be asked some questions. First, affirm you want to install the library, select "Deep Purple/Amber" to apply the purple amber theme, then select "No" for typography, and finally select "Yes" to add animations.

The `@angular/material` package provides the components of the Material Design and it installs the `@angular/cdk` library, which is a component development kit needed for the Material components to work. 

## Add Default Application Styles

The Angular Material schematic sets up quite a bit for us but we have some default application styles to set. Open `src/styles.css` and add the style for the `h1` element below the styles Angular Material added.

```css
h1 {
  text-align: center;
}
```

Next, you need to import all the modules you will be needing into the application. 

## Import Angular Material Components

Open `src/app/app.module.ts` and add the imports below to the top of the file.

```ts
import { FlexLayoutModule } from '@angular/flex-layout';
import { FormsModule } from '@angular/forms';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
```

Now scroll down in the same file and find the `imports` declaration. Change it to match the following.

```ts
imports: [
  BrowserModule,
  AppRoutingModule,
  BrowserAnimationsModule,
  FlexLayoutModule,
  FormsModule,
  MatToolbarModule,
  MatInputModule,
  MatCardModule,
  MatMenuModule,
  MatIconModule,
  MatButtonModule,
  MatTableModule,
  MatSlideToggleModule,
  MatSelectModule,
  MatOptionModule,
],
```

Now that you're done with all the preliminaries, it's time to start implementing the game application. 

## Build a Gameboard with Angular Material 

Start with the main application component. Open `src/app/app.component.html` and replace the default contents with the following code.

{% raw %}
```html
<mat-toolbar color="primary" fxLayout="row" fxLayoutAlign="space-between center">
  <span>
    <button mat-button routerLink="/">{{title}}</button>
    <button mat-button routerLink="/"><mat-icon>home</mat-icon></button>
  </span>
  <div fxLayout="row" fxShow="false" fxShow.gt-sm>
    <button mat-button routerLink="/login" *ngIf="!isAuthenticated">
      <mat-icon>power_settings_new</mat-icon>
      Login
    </button>
    <button mat-button *ngIf="isAuthenticated" (click)="logout()">
      <mat-icon>exit_to_app</mat-icon>
      Logout
    </button>
    <button mat-button routerLink="/game">
      <mat-icon>gamepad</mat-icon>
      Play
    </button>
  </div>
  <button mat-button [mat-menu-trigger-for]="menu" fxHide="false" fxHide.gt-sm>
    <mat-icon>menu</mat-icon>
  </button>
</mat-toolbar>
<mat-menu x-position="before" #menu="matMenu">
  <button mat-menu-item routerLink="/">
    <mat-icon>home</mat-icon>
    Home
  </button>
  <button mat-menu-item routerLink="/game">
    <mat-icon>gamepad</mat-icon>
    Play
  </button>
  <button mat-menu-item routerLink="/login" *ngIf="!isAuthenticated">
    <mat-icon>power_settings_new</mat-icon>
    Login
  </button>
  <button mat-menu-item *ngIf="isAuthenticated" (click)="logout()">
    <mat-icon>exit_to_app</mat-icon>
    Logout
  </button>
</mat-menu>
<router-outlet></router-outlet>
```
{% endraw %}

This code contains the main toolbar and menu of the application. Because we used the Flex-Layout directives to set the layout for the elements, no extra styles are needed.

Now, open `src/app/app.component.ts`, modify the component title, and add a public `isAuthenticated` property. The contents of the file should look like this.

```ts
import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Tic Tac Toe';
  public isAuthenticated = false;
  
  public logout(): void {
    // todo
  }
}
```

Open your terminal again and create two components `home`, and `game` by running the commands below.

```bash
ng generate component home
ng generate component game
```

The `home` component simply contains a splash screen with the game title. Replace the contents of `src/app/home/home.component.html` with the following line.

```html
<h1>Tic Tac Toe</h1>
```

The `game` component will need a bit more editing. Start with the template and open `src/app/game/game.component.html`. Replace the contents of the file with the following code.

{% raw %}
```html
<mat-card>
  <mat-card-content fxLayout="column" fxLayoutAlign="center center">
    <div gdColumns="repeat(3, 48px)" gdGap="1rem">
      <div class="game-field" *ngFor="let field of gameState; let i = index" (click)="makeHumanMove(i)">
        {{field === 'X' || field === 'O' ? field : ''}}
      </div>
    </div>
  </mat-card-content>
</mat-card>
<mat-card>
  <mat-card-content fxLayout="column" fxLayoutAlign="center center">
    <div *ngIf="playing">
      <h3>Your Move</h3>
    </div>
    <div *ngIf="!playing">
      <h3>{{winner || "Start a new game"}}</h3>
    </div>
    <button mat-raised-button color="primary" *ngIf="!playing" (click)="toggleGame(true)">Start</button>
    <button mat-raised-button color="primary" *ngIf="playing" (click)="toggleGame(false)">Reset</button>

    <mat-slide-toggle [(ngModel)]="computerFirst">Computer Moves First</mat-slide-toggle>

    <mat-form-field>
      <mat-label>Difficulty</mat-label>
      <mat-select [(ngModel)]="difficulty">
        <mat-option value="Easy">Easy</mat-option>
        <mat-option value="Normal">Normal</mat-option>
        <mat-option value="Hard">Hard</mat-option>
      </mat-select>
    </mat-form-field>
  </mat-card-content>
</mat-card>

```
{% endraw %}

The code above defined two cards. The top card contains the current game state. It also lets the user click on any of the fields to make a move. The bottom card contains the game controls. Add some styling by pasting the following code into `src/app/game/game.component.css`.

```css
mat-card {
  max-width: 400px;
  margin: 2em auto;
  text-align: center;
}

.game-field {
  width: 48px;
  height: 48px;
  background-color: #f0f0f0;
  line-height: 48px;
  font-size: 32px;
  font-weight: bold;
}

.playing .game-field {
  cursor: pointer;
}

button, mat-slide-toggle {
  margin-bottom: 2rem;
}
```

## Implement Your Game Logic With Angular Components

The actual game logic lives in `src/app/game/game.component.ts`. It is using the `tic-tac-toe-minimax` library to calculate computer moves and determine the winner. Replace the contents of the file with the code below.

```ts
import { Component } from '@angular/core';
import Minimax from 'tic-tac-toe-minimax';
const { GameStep } = Minimax;

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.css']
})
export class GameComponent {

  public gameState: Array<number | string> = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  public winner: string | undefined;
  public playing = false;
  public computerFirst = false;
  public difficulty: 'Easy'|'Normal'|'Hard' = 'Normal';

  public toggleGame(toggle: boolean): void {
    if (toggle === this.playing) {
      return;
    }

    this.gameState = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    this.winner = undefined;

    if (toggle && this.computerFirst) {
      this.makeComputerMove();
    }

    this.playing = toggle;
  }

  public makeHumanMove(field: number): void {
    if (!this.playing || typeof this.gameState[field] !== 'number') {
      return;
    }

    this.gameState[field] = 'X';
    this.makeComputerMove();
  }

  private makeComputerMove(): void {
    const symbols = {
      huPlayer: 'X',
      aiPlayer: 'O'
    };

    const winnerMapping: {[index: string]: any} = {
      huPlayer: 'Human Wins!',
      aiPlayer: 'Computer Wins!',
      draw: 'It\'s a Draw!'
    };

    const result = GameStep(this.gameState, symbols, this.difficulty);
    this.gameState = result.board;

    if (result.winner) {
      this.winner = winnerMapping[result.winner];
      this.playing = false;
    }
  }
}
```

**NOTE**: You will get an error about `import Minimax`. To fix it, create a `src/tic-tac-toe.d.ts` with the following code.

```ts
declare module 'tic-tac-toe-minimax';
```

To complete the game, you will need to define the routes to the two components. 

## Add Routes to Your Angular Components

Open `src/app/app-routing.module.ts` and add the following imports to the top of the file.

```ts
import { HomeComponent } from './home/home.component';
import { GameComponent } from './game/game.component';
```

Next, change the `routes` array to match the following.

```ts
const routes: Routes = [
    {
    path: 'game',
    component: GameComponent,
  },
  {
    path: '',
    component: HomeComponent
  }
];
```

This completes the implementation of the game. You should now be able to open a terminal and run the following command:

```bash
ng serve
```

Open your browser and navigate to `http://localhost:4200`. Click on the **Play** link in the top menu, and you should see a fully functional tic-tac-toe game. Note that the **Login** link is not yet wired up. If you click on it, nothing will happen, and you can see an error message in the browser's console.

{% img blog/angular-material-login/tic-tac-toe-game.png alt:"Tic Tac Toe Game" width:"800" %}{: .center-image }

## Add Secure Sign In to Your Angular App

{% include setup/cli.md type="spa" framework="Angular" loginRedirectUri="http://localhost:4200/login" logoutRedirectUri="http://localhost:4200" %}

You will be implementing a login form as part of your application. Before continuing, a few warnings. If you decide to run a production environment in which you host your own login form, make sure you use the secure HTTPS protocol and host your site with a valid SSL certificate. Also, make sure to never store the login data in a session variable or the browser's storage. If you fail to take the necessary security precautions, your site may be vulnerable to attacks. As mentioned above, you will not be using any of the Angular-specific Okta libraries. Instead, install the `okta-auth-js` package by opening the terminal in the project's root folder and typing the following command.

```bash
npm install -E @okta/okta-auth-js@5.9.1
```

We'll add the configured `OktaAuth` library as a provider in Angular Dependency Injection system. Open `src/app/app.module.ts`. Add `import { OktaAuth } from '@okta/okta-auth-js';` to the file imports list at the top of the file.

Next you'll add it to the `providers` array in the `@NgModule` configuration like the following code snippet.

```ts
@NgModule({
  declarations: [
    // ... component declarations. Leave as is
  ],
  imports: [
    // ... imports array. Leave as is
  ],
  providers: [
    {
      provide: OktaAuth,
      useValue: new OktaAuth({
        issuer: 'https://{yourOktaDomain}/oauth2/default',
        clientId: '{clientId}',
      })
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
```

The `OktaAuth` object encapsulates the authentication, session management, and communication with the Okta servers. The `OktaAuth` constructor takes several options. The options provided here are the `issuer` and the `clientId`. In these options, you will have to replace `{yourOktaDomain}` with your Okta domain. The `{clientId}` needs to be replaced with the client ID you obtained when you registered your application with Okta.

With this, you are ready to create the authentication service. In the terminal, type the following command.

```bash
ng generate service auth
```

Now open the newly created file `src/app/auth.service.ts`. This file is where all the magic happens. Paste the following contents into the file. I will walk you through the code step-by-step below.

```ts
import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, catchError, from, map, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { AuthTransaction, OktaAuth } from '@okta/okta-auth-js';

@Injectable({
  providedIn: 'root'
})
export class AuthService implements OnDestroy {

  private _authSub$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public get isAuthenticated$(): Observable<boolean> {
    return this._authSub$.asObservable();
  }

  constructor(private _router: Router, private _authClient: OktaAuth) {
    this._authClient.session.exists().then(exists => this._authSub$.next(exists));
  }

  public ngOnDestroy(): void {
    this._authSub$.next(false);
    this._authSub$.complete();
  }

  public login(username: string, password: string): Observable<void> {
    return from(this._authClient.signInWithCredentials({username, password})).pipe(
      map((t: AuthTransaction) => this.handleSignInResponse(t))
    );
  }

  public logout(redirect: string): Observable<void> {
    return from(this._authClient.signOut()).pipe(
      tap( _ => (this._authSub$.next(false), this._router.navigate([redirect]))),
      catchError(err => {
        console.error(err);
        throw new Error('Unable to sign out');
      })
    )
  }

  private handleSignInResponse(transaction: AuthTransaction): void {
    if (transaction.status !== 'SUCCESS') {
      throw new Error(`We cannot handle the ${transaction.status} status`);
    }

    this._authSub$.next(true)
    this._authClient.session.setCookieAndRedirect(transaction.sessionToken);
  }
}
```

The `AuthService` has a reference to the injected `OktaAuth` object, which we use to interact with the Okta libraries. 

The `isAuthenticated$` property is the observable stream of a behavior subject that reflects whether the user is logged in or not. The pattern of keeping the behavior subject private, exposing only the observable, is a best practice to keep other code paths from manipulating the emissions. The `AuthService` also defines two public methods. The `login()` method sends a sign-in request to the Okta server. On success, the user is authenticated and a session is established. The `logout()` method will sign out the user and redirect them to a specified route. 

Now that the service is in place, you can use it in the application component. Open `src/app/app.component.ts` and modify the contents to match the code below.

```ts
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subject, take, takeUntil } from 'rxjs';
import { AuthService } from './auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  public title = 'Tic Tac Toe';
  public isAuthenticated = false;
  private _destroySub$ = new Subject<void>();

  constructor(private _authService: AuthService) { }

  public ngOnInit(): void {
    this._authService.isAuthenticated$.pipe(
      takeUntil(this._destroySub$)
    ).subscribe((isAuthenticated: boolean) => this.isAuthenticated = isAuthenticated);
  }

  public ngOnDestroy(): void {
    this._destroySub$.next();
  }

  public logout(): void {
    this._authService.logout('/').pipe(take(1));
  }
}
```

The `isAuthenticated` variable is now initialized and updated by the authentication service. And the `logout()` method will sign the user out and redirect them to the home page.

Now create the login component. In the terminal, run the command below.

```bash
ng generate component login
```

Open `src/app/login/login.component.html` and add the following login form.

```html
<mat-card>
  <mat-card-content>
    <form #loginForm="ngForm" (ngSubmit)="onSubmit()">
      <h2>Log In</h2>
      <mat-error *ngIf="!loginValid">
        The username and password were not recognized
      </mat-error>
      <mat-form-field>
        <input matInput placeholder="Email" [(ngModel)]="username" name="username" required>
        <mat-error>
          Please provide a valid email address
        </mat-error>
      </mat-form-field>
      <mat-form-field>
        <input matInput type="password" placeholder="Password" [(ngModel)]="password" name="password" required>
        <mat-error>
          Please provide a valid password
        </mat-error>
      </mat-form-field>
      <button mat-raised-button color="primary" [disabled]="!loginForm.form.valid">Login</button>
    </form>
  </mat-card-content>
</mat-card>
```

Everything is contained in a `<mat-card>` element again. Note how the `<mat-form-field>` elements each contain an `<input>` as well as a `<mat-error>` element. The `<mat-error>` works seamlessly with Angular's form validation to provide useful feedback. As you might have guessed by now, `src/app/login/login.component.css` contains some styling. Paste the code below into the file.

```css
mat-card {
  max-width: 400px;
  margin: 2em auto;
  text-align: center;
}

mat-form-field {
  display: block;
}
```

Now open `src/app/login/login.component.ts` and paste in the implementation of the login component.

```ts
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { filter, Subject, take, takeUntil } from 'rxjs';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit, OnDestroy {
  public loginValid = true;
  public username = '';
  public password = '';

  private _destroySub$ = new Subject<void>();
  private readonly returnUrl: string;

  constructor(
    private _route: ActivatedRoute,
    private _router: Router,
    private _authService: AuthService
  ) {
    this.returnUrl = this._route.snapshot.queryParams['returnUrl'] || '/game';
  }

  public ngOnInit(): void {
    this._authService.isAuthenticated$.pipe(
      filter((isAuthenticated: boolean) => isAuthenticated),
      takeUntil(this._destroySub$)
    ).subscribe( _ => this._router.navigateByUrl(this.returnUrl));
  }

  public ngOnDestroy(): void {
    this._destroySub$.next();
  }

  public onSubmit(): void {
    this.loginValid = true;

    this._authService.login(this.username, this.password).pipe(
      take(1)
    ).subscribe({
      next: _ => {
        this.loginValid = true;
        this._router.navigateByUrl('/game');
      },
      error: _ => this.loginValid = false
    });
  }
}
```

There is not much happening here. `ngOnInit()` sets up the form. If the user is already authenticated, it requests the router to navigate to a different URL. The `onSubmit()` function handles the form submission. It uses the form element values and attempts to log in using `AuthService`.

The application is almost done. You have the authentication service and the login form in place. But, you also want to prevent the user from navigating to a part of the application that they are not authorized to see. Angular uses route guards for this. Create a guard by running the following command in the terminal.

```bash
ng generate guard auth
```

You'll be asked which interface to implement. Select `CanActivate`.

The guard implements the `CanActivate` interface and must implement the `canActivate()` function. Replace the contents of `src/app/auth.guard.ts` with the following.

```ts
import { Injectable } from '@angular/core';
import { Router, CanActivate, UrlTree } from '@angular/router';
import { AuthService } from './auth.service';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private _authService: AuthService, private _router: Router) {}

  public canActivate(): Observable<boolean | UrlTree> {
    return this._authService.isAuthenticated$
      .pipe(
        map((s: boolean) => s ? true: this._router.parseUrl('/login'))
      );
  }
}
```

Finally, add the `login` route and the route guard to the router setup. Open `src/app/app-routing.module.ts` again and add the two imports below.

```ts
import { LoginComponent } from './login/login.component';
import { AuthGuard } from './auth.guard';
```

Now, change the `routes` array to look like the following.

```ts
const routes: Routes = [
  {
    path: 'game',
    component: GameComponent,
    canActivate: [ AuthGuard ]
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: '',
    component: HomeComponent
  }
];
```

Well done, that's it. The application is complete!

When you run the `ng serve` command and navigate to `http://localhost:4200` you should now be able to log in and out of the application. The login form uses Material Design and should look something like the image below.

{% img blog/angular-material-login/finished-product.png alt:"Finished product" width:"800" %}{: .center-image }

### Make Your App More Secure

Notice that we only watch for sign-in and sign-out actions to update the authenticated state. This works for our case, but you might not want to allow users whose sessions have timed out to continue playing tic-tac-toe. To make your app more secure, you need to watch for sessions timing out. There are several ways to do this, but some popular ones include subscribing to `Router` events and checking. Or, if your app makes calls to a back-end, redirect the user to the login page when the HTTP call returns a 401 response code. 

### Make Angular Tests Pass With Angular Material

You generated a lot of code in this tutorial. When you created components, tests were created for those components as well. The tests merely verify that the components render. If you run `ng test`, most of them will fail because the tests have neither the imports for the components you added nor a provider for the `OktaAuth` object. If you'd like to see what it takes to make all the tests pass, look at [this commit to add the Angular Material library imports](https://github.com/oktadeveloper/okta-angular-material-login-example/commit/20e899d0ba4f8074681548e268337bd13153f140), and [this commit to provide a fake OktaAuth object](https://github.com/oktadev/okta-angular-material-login-example/commit/e06c1cc20e381b3a72f3c5597dc38dcd7095b82b).

## Learn More About Angular Material and Secure Login

In this tutorial, I showed you how to implement your own login form in an Angular application using Material Design and the Angular Material library. Coding up your own form may be a viable option if you want to present a uniform user experience. Much of this tutorial can be used for other design libraries and is not limited to Material Design but Google's Material Design standard is probably one of the most recognized user interface standards nowadays. Using it will improve the usability of your web application.

You can download the code for this tutorial from [oktadeveloper/okta-angular-material-login-example](https://github.com/oktadeveloper/okta-angular-material-login-example).

If you want to learn more about Angular, Material Design, or ways to use Okta with Angular, feel free to check out the links below.

* [Build a CRUD App with Angular 9 and Spring Boot 2.2](/blog/2020/01/06/crud-angular-9-spring-boot-2)
* [How to Customize Your Angular Build With Webpack](/blog/2019/12/09/angular-webpack)
* [Build Secure Login for Your Angular App](/blog/2019/02/12/secure-angular-login)
* [Build a Simple Web App with Express, Angular, and GraphQL](/blog/2018/11/30/web-app-with-express-angular-graphql)

As usual, follow us [@oktadev on Twitter](https://twitter.com/oktadev) and subscribe to [our YouTube channel](http://youtube.com/c/oktadev) for more excellent content!
