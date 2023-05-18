---
layout: blog_post
title: "Streamline Your Okta Configuration in Angular Apps"
author: alisa-duncan
by: advocate
communities: [javascript]
description: "Introducing a new method to configure Okta authentication in your Angular apps using the forRoot pattern! Read on to learn how this pattern works and why you'd want to use it."
tags: [angular]
tweets:
- "Follow best patterns to quickly add your Okta configuration to #Angular apps by using the forRoot pattern!"
image: blog/angular-forroot/social.jpg
type: awareness
---

The Okta Angular SDK supports a new and improved configuration method to pass in the required properties for incorporating Okta in your Angular applications. Now, you can add Okta to your Angular application using the `forRoot` pattern!

## The `forRoot` pattern in Angular

The `forRoot` pattern helps ensure services defined in `NgModules` aren't duplicated across the application. This is especially noteworthy if you have a module that both provides services and also has component and directive declarations. The intention for the `forRoot` static method is for importing and configuration to happen at the root module. This is good practice and recommended patterns for an authentication module! It can make configuring the `NgModule` more straightforward too!

Let's take a look at an example case, such as a cupcake e-commerce application with a module containing a service and view for supporting denoting your favorite treats with a heart. 😋🧁💜

Your service code might look like this with the `@Injectable()` decorator:

```ts
@Injectable()
export class FavoriteCupcakeService {
    addCupcakeToFavorites(cupcake: Cupcake): Observable<Cupcake> {
        // make HTTP call to add a cupcake to favorite for this user
    }

    getFavoriteCupcakes(): Observable<Cupcake[]> {
        // make HTTP call to get all the favorite cupcakes for this user
    }
}
```

Additionally, you have a component that supports the favorite cupcakes feature in the favorite cupcake module:

```ts
@NgModule {
    declarations: [FavoriteCupcakeComponent],
    exports: [FavoriteCupcakeComponent],
    providers: [FavoriteCupcakeService]
}
export class FavoriteCupcakeModule {}
```

In your application module, you might import the `FavoriteCupcakeModule`, making the declared `FavoriteCupcakeComponent` and provided `FavoriteCupcakeService` available throughout your application.

But what if you don't import the `FavoriteCupcakeModule` in the `AppModule` or if you want to use the `FavoriteCupcakeComponent` in a lazy-loaded feature module in your app? You'll have to reimport the `FavoriteCupcakeModule` in that lazy-loaded module. Each lazy-loaded module has an injector instance, so you may have multiple instances of the `FavoriteCupcakeService` in your application, which we don't want.

One option is to amend the `@Injectable()` decorator to add the metadata that determines where in the application the service is provided using the `providedIn` property:

```ts
@Injectable({
    providedIn: 'root'
})
```

This declaration within the decorator is preferable over providing the service within a module's `providers` array because it supports tree-shaking.

Another option is adding the `forRoot()` static method to the `FavoriteCupcakeModule` and providing the `FavoriteCupcakeService`instead of through the `providers` array. The `FavoriteCupcakeService` can and should be a singleton instance for the application, and the `forRoot()` static method sets the module up to do so.

Following in the steps of this best practice, the Okta Angular SDK now has more streamlined configuration options and helps promote good practices of importing the `OktaAuthModule` at the application root. Authentication applies to the entire application and should not depend on where you imported the `OktaAuthModule` in the application.

Let's look at this configuration change.

## Configuring the Okta Angular SDK using OAuth 2.0 and OpenID Connect (OIDC)

Previously, to incorporate Okta in your Angular applications, you had to import the `OktaAuthModule` and pass in your configuration in the `providers` array as a replacement for the `OKTA_CONFIG` injection token like this:

```ts
const oktaAuth = new OktaAuth({
    clientId: '{yourOktaClientId}',
    issuer: 'https://{yourOktaDomain}/oauth2/default'
});

@NgModule({
    imports: [ 
        OktaAuthModule 
    ],
    providers: [
        { provide: OKTA_CONFIG, useValue: {oktaAuth} }
    ]
})
export class AppModule { }
```

This method will continue to work, and you can continue using the module as you have it now without any changes.

However, you can now change your configuration to pass in your Okta config directly into the `forRoot()` method of the `OktaAuthModule`. Not only is this more straightforward, it sets your application up to practice better architecture:

```ts
const oktaAuth = new OktaAuth({
    clientId: '{yourOktaClientId}',
    issuer: 'https://{yourOktaDomain}/oauth2/default'
});

@NgModule({
    imports: [ 
        OktaAuthModule.forRoot({oktaAuth})
    ]
})
export class AppModule { }
```

The `OktaAuthModule` handles setting the `OKTA_CONFIG` injection token for you, so you won't have to make that extra hop when adding Okta to your application! 🎉

## Configuring Okta Angular application going forward

Since authentication-related services should be application-wide, we recommend using the `OktaAuthModule.forRoot()` static method when configuring Okta in new Angular applications. You're still covered with backward-compatibility support if you have more complex needs, such as requiring a factory method to provide the `OKTA_CONFIG` injection token.

The Okta Angular SDK team plans to improve this in the future. They recognize the current `OktaAuthModule` can improve, and to truly support `forRoot()`, they will have to remove auth services from the `providers` array of the module, which breaks backward compatibility. The Okta Angular SDK team also is preparing to support the latest Angular features, which will become the Angular recommended patterns going forward, such as stand-alone components, module-less architecture, and functional route guards. If you have thoughts or input, or want to share how you use the Okta Angular SDK so the team can make sure they consider it, feel free to drop a note in the comment below.

## Learn more about Angular, Dependency Injection, and OpenID Connect

If you liked this post, you might want to check out the following:
* [Practical Uses of Dependency Injection in Angular](/blog/2022/10/11/angular-dependency-injection)
* [Three Ways to Configure Modules in Your Angular App](/blog/2022/02/24/angular-async-config)
* [Add OpenID Connect to Angular Apps Quickly](/blog/2022/02/11/angular-auth0-quickly)

Remember to follow us on [Twitter](https://twitter.com/oktadev) and subscribe to our [YouTube channel](https://www.youtube.com/c/OktaDev/) for more exciting content. We also want to hear about what tutorials you want to see. Leave us a comment below.
