---
layout: blog_post
title: "Streamline Your Okta Configuration in Angular Apps"
author: alisa-duncan
by: advocate
communities: [javascript]
description: ""
tags: [angular]
tweets:
- "Straightforward is best! Add your Okta configuration to Angular apps quickly!"
image: blog/angular-forroot/social.jpg
type: awareness
---

The Okta Angular SDK library supports a new configuration method. This improved way to pass in the required Okta configuration properties in Angular applications follows a common approach for adding modules.

The Okta Angular SDK supports a new and improved configuration method to pass in the required properties for incorporating Okta in your Angular applications. Now, you can add Okta to your Angular application using the `forRoot` pattern!

## The `forRoot` pattern in Angular

The `forRoot` pattern helps ensure services defined in `NgModules` aren't duplicated across the application. This is especially noteworthy if you have a module that both provides services and also has component and directive declarations. The intention for the `forRoot` static method is for importing and configuration to happen at the root module. This is good practice and recommended patterns for an authentication module! It can make configuring the `NgModule` more straightforward too!

The Okta Angular SDK now has more streamlined configuration options and helps promote good practices of importing the `OktaAuthModule` at the application root. Let's look at this configuration change.

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

This method will continue to work. However, you can now change your configuration to look like this instead:

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

Since it is the most straightforward, we recommend using the `OktaAuthModule.forRoot()` static method when configuring Okta in new Angular applications. You're still covered with backward-compatibility support if you have more complex needs, such as requiring a factory method to provide the `OKTA_CONFIG` injection token.

## Learn more about Angular, Dependency Injection, and OpenID Connect

If you liked this post, you might want to check out the following.
* [Practical Uses of Dependency Injection in Angular](/blog/2022/10/11/angular-dependency-injection)
* [Three Ways to Configure Modules in Your Angular App](/blog/2022/02/24/angular-async-config)
* [Add OpenID Connect to Angular Apps Quickly](/blog/2022/02/11/angular-auth0-quickly)

Remember to follow us on [Twitter](https://twitter.com/oktadev) and subscribe to our [YouTube channel](https://www.youtube.com/c/OktaDev/) for more exciting content. We also want to hear from you about what tutorials you want to see. Leave us a comment below.
