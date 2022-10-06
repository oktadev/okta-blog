---
layout: blog_post
title: "Practical Usages of Dependency Injection in Angular"
author: alisa-duncan
by: advocate
communities: [javascript]
description: "Angular's Dependency Injection is powerful, but complex. In this post, we'll demystify configuring providers in Angular and look at practical examples of using Angular's DI system."
tags: [angular, javascript, typescript]
tweets:
- "Check out this quick overview of Angular's Dependency Injection system for practical examples of how to configure providers! 👀"
image: blog/angular-dependency-injection/social.jpg
type: awareness
---

Angular has an extensive system to add and configure dependencies to the application called providers. When doing this, you use the built-in Dependency Injection (DI) system. This post will cover Angular's powerful DI system at a high level and demonstrate a few practical usages of configuring your dependencies. Let's get practical!

{% include toc.md %}

## Quick overview of Dependency Injection

Dependency Injection decouples the creation of a dependency from using that dependency. This promotes loose coupling within our code, a foundation for creating well-architected software. When we use DI, we follow a design principle called Dependency Inversion. Dependency Inversion is a core tenet of software design principles. It's so integral that it's part of the acronym **SOLID**, used to describe design patterns for good coding practices. Dependency Inversion represents the letter **D** in the acronym. Following [SOLID design practices](https://en.wikipedia.org/wiki/SOLID) yields flexible, maintainable software that allows our applications to grow with new features more quickly. And by using DI, we can change the dependent code without changing the consuming code, which is pretty cool! This is nearly impossible with tightly coupled code, where you might have to touch everything to make a small change.

The cool thing is Angular has DI built-in and helps set us up for success. How handy!

## Angular's Dependency Injection system

When you use the Angular CLI to generate a service, it automatically adds the code to register the service within Angular's DI system for us. Automation sure is sweet! Services contain business logic code that we want to keep separate from view logic.

When Angular CLI generates a service, it adds an `@Injectable()` TypeScript decorator, which is the bit of code that registers a service within Angular DI system:

```ts
@Injectable({
  providedIn: 'root'
})
export class MyService {
}
```

Without doing anything else, we can use our dependency in the application by injecting it into the consuming code as a constructor parameter:

```ts
@Component({
  // standard component metadata here
})
export class MyComponent {
  constructor(private myService: MyService) { }
}
```

> In Angular v14, you have a new option to use the `inject()` function instead of injecting the service into the consumer as a constructor parameter.

Another way to register dependencies is to provide them manually through the `providers` array. Different Angular building blocks accept `providers` in the metadata. So you can register a provider like this:

```ts
@NgModule({
  imports: // stuff here
  declarations: // stuff here
  providers: [
    MyService
  ]
})
export class AppModule {
}
```

There's something else to note, though. Angular's DI system allows you to provide a dependency to different places within the application. We saw an example of this in the first code snippet of the `@Injectable()` TypeScript decorator. Angular CLI automatically generates

```ts
@Injectable({
  providedIn: 'root'
})
export class MyService {
}
```

The configuration option `providedIn: 'root'` specifies where within the application to provide the service. In this case, we're saying provide to "root", which means the root of the app so this service is available across the entirety of the application.

 While having this level of configurability sounds unnecessarily complicated, it allows you to fine-tune which dependency to use in your consuming code. You can configure the `providers` array in other modules and Angular building blocks, such as components and directives. You'll get the provider you configured closest to the consuming code when you do so.

Now that we have a quick overview of how to provide dependencies, let's review an integral piece of Angular's DI system, injection tokens.

## Injection tokens in Angular

Injection tokens allow us to have values and objects as dependencies. This means we can depend on a string, such as "Hello world!", and objects, which include configuration objects and global variables such as Web APIs. But injection tokens are even more remarkable because we can also create dependencies to constructs that don't have a runtime definition, such as interfaces! Let's take a look at an example using an injection token.

Let's say we want to have a dependency on the bread emoji. You can create the bread emoji, register the token to Angular's DI system, and set up a default value like this:

```ts
const export BREAD_TOKEN = new InjectionToken<string>('bread', {
  providedIn: 'root',
  factory: () => '🍞'
});
```

When you want to use the `BREAD_TOKEN`, you'd use the `@Inject` decorator:

```ts
@Component({
  // standard component metadata here
})
export class MyBreadComponent {
  constructor(@Inject(BREAD_TOKEN) private bread: string) { }
}
```

Now we can access the 🍞 emoji from within the component! This might not seem like a big deal, but having injection tokens as a means to represent values and interfaces as dependencies is enormous! And it sets us up to leverage the power of Angular's DI system.

We can use injection tokens along with configuring providers within Angular's DI system for more power and fine-grained control.

## Configuring providers in Angular's Dependency Injection system

You can configure the `providers` array to add fine-grained control to your providers. When combined with injection tokens, we can unleash a lot of power. But first, it's essential to know when it makes sense to do so. Always prefer the most straightforward, default way of registering a dependency and then use fine-grained control as needed.

To configure the `providers` array, you add an object containing the instructions like this:

```ts
@NgModule({
  imports: // stuff here
  declarations: // stuff here
  providers: [
    { provide: MyService, howToProvide: OtherDependency }
  ]
})
export class AppModule {
}
```

The "how to provide" gives Angular-specific instructions on this dependency configuration. Then you can provide the other new dependency. Angular supports the following options for "how to provide":

1. `useClass` - Replace the current dependency with a new instance of something else
2. `useExisting` - Replace the current dependency with an existing dependency
3. `useValue` - Replace the current dependency with a new value
4. `useFactory` - Use a factory method to determine which dependency to use based on a dynamic value

Next, let's walk through examples of each configuration option to understand how to use them.

### Configure providers with `useClass`

The `useClass` option replaces the current dependency with a new instance of another class. This is a great option to use if you're refactoring code and want to substitute a different dependency in your application quickly. Let's say you have a language learning app and an Angular service that wraps the authentication calls you delegate to an auth library and an auth provider. We'll call this service `AuthService`, and to keep things straightforward, the code looks like this:

```ts
@Injectable({
  providedIn: 'root'
})
export class AuthService {
  public login(): void { }
  public logout(): void { }
}
```

In a stroke of luck, a large tech company decides to buy your language learning app, but they require you to authenticate using their social login only. You can create a new authentication service; we'll call it `NewAuthService` (note, you should not name your services with these terrible names), and keep the same member names that wraps the calls to their auth provider. 

```ts
@Injectable({
  providedIn: 'root'
})
export class NewAuthService {
  public login(): void { /* new way to login */ }
  public logout(): void { /* new way to logout */ }
```

Because both classes have the same public members, you can substitute the original `AuthService` with the new `NewAuthService` by configuring the provider:

```ts
@NgModule({
  imports: // imports here
  declarations: //declarations here
  providers: [
    { provide: AuthService, useClass: NewAuthService }
  ]
})
export class AppModule { }
```

The cool thing about having the same public members is that there's no need to change the consuming code. Angular instantiates a new instance of `NewAuthService` and provides that dependency to consuming code, even if they still refer to `AuthService`! 

It might not make sense to keep the original `AuthService` around, so eventually you might want to consider transferring all the code references to use the `NewAuthService` only. However, the `useClass` configuration option is a fast way for us to quickly substitute one instance of a class for another, which means proof-of-concepts and quick checks can be as fast as a drop of a hat!

### Configure providers with `useExisting`

The `useExisting` option replaces the provider with a different provider already existing within the application. This option is a great use case for API narrowing, that is, decreasing the surface area of an API. Let's say your language learning application has an API that's gotten out of hand. We'll call this API `LanguageTranslationService`, and it looks like this:

```ts
@Injectable({
  providedIn: 'root'
})
export const LanguageTranslationService {
  public french(text: string): string { /* translates to French */ }
  public japanese(text: string): string { /* translates to Japanese */ }
  public elvish(text: string): string { /* translates to Elvish */ }
  public klingon(text: string): string { /* translates to Klingon */ }
  // so on and so forth, but you see the problem here
}
```

And you consume the service like this:

```ts
@Component({
  // standard component metadata here
})
export class ElvishTranslationComponent implements OnInit {
  private elvish!: string;
  constructor(private translationService: LanguageTranslationService) { }
  
  public ngOnInit(): void {
    this.elvish = this.translationService.elvish(someText);
  }
}
```

Oops... The `LanguageTranslationService` looks a bit unwieldy. Let's narrow the API surface by creating a new class called `FictitiousLanguageTranslationService` and move the translation methods for the fictitious languages there. We'll use an abstract class for this:

```ts
export abstract class FictitiousLanguageTranslationService {
  abstract elvish: (text: string) => string;
  abstract klingon: (text: string) => string;
}
```

Now we can add `FictitiousLanguageTranslationService` as a real dependency in the application by adding it to the `providers` array, but use the existing `LanguageTranslationService` implementation of the code:

```ts
@NgModule({
  imports: // imports here
  declarations: // declarations here
  providers: [
    { provide: FictitiousLanguageTranslationService, useExisting: LanguageTranslationService }
  ]
})
export class AppModule { }
```

Now we'll update the consumer to use the new dependency:

```ts
@Component({
  // standard component metadata here
})
export class ElvishTranslationComponent implements OnInit {
  private elvish!: string;
  constructor(private fltService: FictitiousLanguageTranslationService) { }
  
  public ngOnInit(): void {
    this.elvish = this.translationService.elvish(someText);
  }
}
```

Only the methods defined in the `FictitiousLanguageTranslationService` are available now. Pretty sweet!

### Configure with `useValue`

The `useValue` option replaces the provider with a value. This option is a great use case for values such as configurations and mocking services in automated tests where you need to control the inputs and outputs. Let's go back to the `BREAD_TOKEN` in this example and override it to show a 🥐 (croissant) instead. 

We can override the token:

```ts
@NgModule({
  imports: // imports here
  declarations: // declarations here
  providers: [
    { provide: BREAD_TOKEN, useValue: '🥐' }
  ]
})
export class AppModule { }
```

Now when we use this in the `MyBreadComponent` we'll get a croissant instead of a loaf of bread!

```ts
@Component({
  // standard component metadata here
})
export class MyBreadComponent {
  constructor(@Inject(BREAD_TOKEN) private bread: string) { }
}
```

### Configure with `useFactory`

The `useFactory` option allows us to use a factory method to create a dependency. This option is a great use case if you have dynamic values to consider when creating the dependency. It's also how we can use a [factory pattern](https://en.wikipedia.org/wiki/Factory_method_pattern) for creating our dependencies.

In this example, let's say in your Language Learning application, if the user is learning French, we want to show a croissant in the `BreadComponent` instead of a loaf of bread. The user's language selection is in the user's config, so the example code looks like this:

```ts
@NgModule({
  imports: // imports here
  declarations: // declarations here
  providers: [
    {
      provide: BREAD_TOKEN,
      useFactory: (config: UserConfig) => config.language === 'fr' ? '🥐' : '🍞',
      deps: [UserConfig]
    }
  ]
})
export class AppModule { }
```

Notice we were able to pass in a dependency to the configuration option. The `useClass` and `useFactory` options support passing in dependencies.

Now when we use this in the `MyBreadComponent` we'll get a croissant instead of a loaf of bread only if the the user's configuration has French as their language!

```ts
@Component({
  // standard component metadata here
})
export class MyBreadComponent {
  constructor(@Inject(BREAD_TOKEN) private bread: string) { 
    // bread is either 🍞 or 🥐 based on the language setting
  }
}
```

## Dependency Injection when configuring external dependencies

Now that we have a better understanding injection tokens and when to use the different configuration options, you may want to check out the post, [Three Ways to Configure Modules in Your Angular App](/blog/2022/02/24/angular-async-config). This post covers configuring modules and Okta configuration demonstrating the different concepts covered within in this post in real-life use cases.

## Learn more about Angular Dependency Injection

This post is a high-level overview of Angular's DI system. As you can already see, this powerful system has many different configuration options and a lot of complexity. As a result, even though Angular has these configuration options, using the most straightforward approach will make troubleshooting and maintenance easier. 

Let us know in the comments below if you want to see more information about Angular's DI system. Since this was a quick overview, I didn't cover providing to different injectors, injector resolutions, resolution modifiers, and new capabilities in Angular v14. I am happy to dive into more detail on these topics!

If you liked this post, you might be interested in these links.
* [Three Ways to Configure Modules in Your Angular App](/blog/2022/02/24/angular-async-config)
* [How to Build Micro Frontends Using Module Federation in Angular](/blog/2022/05/17/angular-microfrontend-auth)
* [Protect Your Angular App from Cross-Site Scripting](/blog/2022/07/21/angular-security-xss)
* [Add OpenID Connect to Angular Apps Quickly](/blog/2022/02/11/angular-auth0-quickly)

Don't forget to follow us on [Twitter](https://twitter.com/oktadev) and subscribe to our [YouTube channel](https://www.youtube.com/c/OktaDev/) for more great tutorials. We'd also love to hear from you! Please comment below if you have any questions or want to share what tutorial you'd like to see next.
