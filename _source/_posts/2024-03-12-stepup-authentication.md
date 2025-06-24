---
layout: blog_post
title: "Add Step-up Authentication Using Angular and NestJS"
author: alisa-duncan
by: advocate
communities: [security,javascript]
description: "Step up your authentication with the Step Up Authentication Challenge. Learn how to implement this in an Angular and NestJS project!"
tags: [oidc, stepup-auth, authentication, angular, nestjs]
tweets:
- ""
image: blog/stepup-authentication/social.jpg
type: conversion
github: https://github.com/oktadev/okta-angular-nestjs-stepup-auth-example
---

The applications you work on expect good authentication as a secure foundation. In the past, we treated authentication as binary. You are either authenticated or not. You had to set the same authentication mechanism for access to your application without a standard way to change authentication mechanisms conditionally. Consider the case where sensitive actions warrant verification, such as making a large financial transaction or modifying top-secret data. Those actions require extra scrutiny!

{% include integrator-org-warning.html %}

## Use Step Up Authentication Challenge to protect resources

Enter the [OAuth 2.0 Step Up Authentication Challenge Protocol](https://datatracker.ietf.org/doc/rfc9470/). This standard, built upon OAuth 2.0, outlines a method to elevate authentication requirements within your application. The standard defines methods to identify authentication rules, including authentication mechanisms and authentication recency. We'll cover more details about this much-needed standard as we go along. If you want to read more about it before jumping into the hands-on coding project, check out [Step-up Authentication in Modern Applications](/blog/2023/03/08/step-up-auth).

In this post, you'll add step-up authentication challenge standard to an Angular frontend and NestJS backend. If you want to jump to the completed project, you can find it in the `completed` branch of [okta-angular-nestjs-stepup-auth-example](https://github.com/oktadev/okta-angular-nestjs-stepup-auth-example/tree/completed) GitHub repository. Warm up your computer; here we go!

> **Note**
>
> This post is best for developers familiar with web development basics and Angular. If you are an Angular newbie, start by building [your first Angular app](https://angular.io/tutorial/first-app) using the tutorial created by the Angular team.

**Prerequisites**

For this tutorial, you need the following tools:
  * [Node.js](https://nodejs.org/en) v18 or greater
  * A web browser with good debugging capabilities
  * Your favorite IDE. Still searching? I like VS Code and WebStorm because they have integrated terminal windows.
  * Terminal window (if you aren't using an IDE with a built-in terminal)
  * [Git](https://git-scm.com/) and an optional [GitHub account](https://github.com/) if you want to track your changes using a source control manager

**Table of Contents**{: .hide }
* Table of Contents
{:toc}

## Prepare the Angular and NestJS web application

You'll start by getting a local copy of the project. I opted to use a starter project instead of building it out within the tutorial because many steps and command line operations detract from the coolness of adding step-up authentication. Open a terminal window and run the following commands to get a local copy of the project in a directory called `okta-stepup-auth-project` and install dependencies. Feel free to fork the repo so you can track your changes.

```shell
git clone https://github.com/oktadev/okta-angular-nestjs-stepup-auth-example.git okta-stepup-auth-project
cd okta-stepup-auth-project
npm ci
```

Open the project up in your favorite IDE. Let's take a quick look at the project organization. The project has an Angular frontend and NestJS API backend housed in a [Lerna](https://lerna.js.org/) monorepo. If you are curious about how to recreate the project, check out the repo's README file. I'll include all the `npx` commands, CLI commands, and the manual steps used to create the project.

You need to set up an authentication configuration to serve the project. Let's do so now.

## Set up the Identity Provider to use OAuth 2.0 and OpenID Connect

You'll use Okta to handle authentication and authorization in this project securely.

{% include setup/cli.md type="spa" framework="Angular" loginRedirectUri="http://localhost:4200/login/callback" logoutRedirectUri="http://localhost:4200" %}

Note the `Issuer` and the `Client ID`. You'll need those values for your authentication configuration, which is coming soon.

There's one manual change to make in the Okta Admin Console. Add the **Refresh Token** grant type to your Okta Application. Open a browser tab to sign in to your [Okta Integrator Free Plan account](https://developer.okta.com/login/). Navigate to **Applications** > **Applications** and find the Okta Application you created. Select the name to edit the application. Find the **General Settings** section and press the **Edit** button to add a Grant type. Activate the **Refresh Token** checkbox and press **Save**.

I already added [Okta Angular](https://www.npmjs.com/package/@okta/okta-angular) and [Okta Auth JS](https://www.npmjs.com/package/@okta/okta-auth-js) libraries to connect our Angular application with Okta authentication. On the API side, I added the [Okta JWT Verifier](https://github.com/okta/okta-jwt-verifier-js) library that you'll use for access token verification later in the post.

In your IDE, open `packages/frontend-angular/src/app/app.config.ts` and find the `OktaAuthModule.forRoot()` configuration. Replace `{yourOktaDomain}` and `{yourClientId}` with the values from the Okta CLI.

Start the app by running:

```shell
npm start
```

The command starts both the frontend app and the API. Navigate to `localhost:4200` in your browser. What a beautiful app!

Sign in and notice the "profile" route shows your profile information with a warm, friendly greeting using your name, and the "messages" route displays messages from an HTTP call the component makes to your API. Sign out of the application.

We now have a web app with basic authentication capabilities. Let's kick up authentication levels by adding step-up authentication!

## Step-up authentication mechanics at a glance

Before we jump into Step Up Authentication, let's take a step back and cover how authentication works in an application. In most circumstances, you'd require authentication before allowing the user to navigate anywhere within the app. You can prevent them from entering a URL:

{% img blog/stepup-authentication/initial-flow.svg alt:"Sequence diagram where you want to view transactions, your app stops you because you aren't authenticated, you're redirected to Okta to sign in with username and password, Okta responds with your access and id tokens so you can view the transactions." width:"800" %}{: .center-image }

{% comment %}
Tweak the diagram on https://mermaid.live/ with the following content
sequenceDiagram
    You->>+Your app: View transactions.
    Your app-->>-You: Stop! You aren't authenticated!
    You->>+Okta: Oops. Sign in with username/password.
    Okta-->>-You: Good job. Here are your access and ID tokens.
    You->>+Your app: View transactions.
    Your app-->>-You: Enjoy!
{% endcomment %}


The Step Up Authentication Challenge idea builds upon the foundation of OAuth 2.0 and OpenID Connect (OIDC). Your app enforces authentication assurances from the user for different actions. Authentication and identity assurance determine the certainty that the user is who they say they are. The specification supports defining authentication strength and recency and responds with a standard error `insufficient_user_authentication`. Let's say the authenticated user now wants to make a new transaction. Creating a new transaction is a sensitive action and requires elevated authentication assurances:

{% img blog/stepup-authentication/elevated-flow.svg alt:"Sequence diagram where you want to make a new transaction, your app stops you because it requires elevated authentication, you're redirected to Okta to sign in with elevated authentication, Okta responds with your access and id tokens so you can make a new transactions." width:"800" %}{: .center-image }

{% comment %}
Tweak the diagram on https://mermaid.live/ with the following content
sequenceDiagram
    You->>+Your app: Make a new transaction.
    Your app-->>-You: Stop! This requires elevated authentication.
    You->>+Okta: Gotcha! Sign in with elevated authentication.
    Okta-->>-You: Good job. Here are your new access and ID tokens.
    You->>+Your app: Make a new transaction.
    Your app-->>-You: You got it!
{% endcomment %}

Your app needs to verify you have the correct authentication assurances for your requested action. Your frontend app's OIDC library evaluates your ID token for authenticated state and the value of a specific claim called Authentication Context Class Reference (ACR). The `acr` claim value contains the client's authentication assurance level. If the ACR claim value doesn't meet the required assurance profile, the client requests the correct level using the `acr_values` parameter when communicating with Okta. Let's take another look at the previous diagram, this time incorporating `acr` and `acr_values` properties:

{% img blog/stepup-authentication/evaluate-acr-flow.svg alt:"Sequence diagram where you want to make a new transaction, your app checks your ID token's acr claim and denies the resource because the action requires a different acr claim value, you're redirected to Okta to sign in with elevated authentication by passing in the required authentication level using the acr_values property, Okta responds with your access and id tokens so you can make a new transactions." width:"800" %}{: .center-image }

{% comment %}
Tweak the diagram on https://mermaid.live/ with the following content
sequenceDiagram
    You->>Your app: Make a new transaction.
    Your app-->Your app: Check ID token: acr = "low"
    Your app-->>You: insufficient_user_authentication! acr_value = "elevated" required
    You->>Okta: Sign me in with acr_values="elevated"
    Okta-->>You: Here are your new tokens with acr = "elevated"
    You->>Your app: Make a new transaction.
    Your app-->Your app: Check ID token: acr = "elevated"
    Your app-->>You: Here you go!
{% endcomment %}

ACR values can be a standard or use a custom registry. You'll see values such as `phr` for phishing-resistant factors, which include FIDO2 + WebAuthn authenticators. You'll also see custom values such as one Okta supports for two-factor authentication, such as `urn:okta:loa:2fa:any`. Read more about supported ACR values in [Okta's Step Up Authentication documentation](https://developer.okta.com/docs/guides/step-up-authentication/-/main/#predefined-parameter-values).

This is a high-level overview of OAuth 2.0, OpenID Connect, and the Step Up Authentication Challenge spec, and it only covers what we need to know for this tutorial. I'll add links to resources at the end of this post so you can dive deeper into this topic.

It's clearer to see authentication strengths rather than calculate the recency of authentication, so we'll walk through the steps required for authentication strengths in the tutorial. Right now, you only have password authentication. You'll need another authenticator for your app!

## Set up authenticators

You'll change the Okta Admin Console to support a different authentication mechanism. We'll change the email authenticator so it's both a recovery and an authentication factor. Sign in to [your Okta Developer Edition Account](https://developer.okta.com/login).

Navigate to **Security** > **Authenticators**. Find **Email**, press on the **Actions** menu, and select **Edit**. Select the **Authentication and recovery** radio button under the **Used for** section. 

Your Okta application should allow you to authenticate with a password or email. Sign out of the Okta Admin Console so we can see the entire step-up authentication flow from end-to-end.

> **Note**
>
> You must use the email OTP verification number when authenticating using email. This post doesn't include the steps required to set up email magic link handling. Let me know in the comments below if you want to see a post about this.

## Guard a route with step-up authentication

Back to coding! The Okta Angular SDK supports step-up authentication and has a built-in feature so that you can define the required `acr_values` for routes right in your route definition. We'll require two-factor authentication for your profile. In your IDE, open `packages/frontend-angular/src/app/app.routes.ts` and find the route for "profile." Add route data to route using the `okta` object and a property named `acrValues`. The property's value is `urn:okta:loa:2fa:any`. Your "profile" route definition should look like this:

```ts
{ 
  path: 'profile',
  component: ProfileComponent,
  canActivate: [OktaAuthGuard], 
  data: {
    okta: { acrValues: 'urn:okta:loa:2fa:any' }
  }
}
```

Test this route out. Start the application by running `npm start` if it isn't still running. Open the application in the browser, and feel free to open network debugging capabilities so you can see the `acr_values` request. Sign in using one factor, such as a password. Then, navigate to the "profile" route. You'll be redirected to Okta to authenticate using your email. Sign in with your email by entering a verification number. Success!

Sign out of the application.

The Okta Angular SDK helps us out, so we don't have to write custom code. Under the covers, the SDK has an Angular guard that:
  1. Gets the `acr` claim value from the ID token
  2. If the value matches the `acrValues` route data definition, it returns true to allow navigation
  3. Otherwise, it redirects the user to authenticate using the value in the `acrValues`, saves the current route, and returns false to prevent navigation

The code would look something like this:

```ts
const stepupGuard: CanActivateFn = async (route, state, oktaAuth = inject(OKTA_AUTH)) => {
  const acrValues = route.data['okta']?.['acrValues'];
  const acrClaim = return decodeToken(oktaAuth.getIdToken()).payload.acr;
  if (acrClaim === acrValues) return true;
  oktaAuth.setOriginalUri(state.url);
  await oktaAuth.signInWithRedirect({acrValues})
  return false;
};
```

This helps protect application routes, but what else can we do?

## Protect API resources with step-up authentication challenge

You can also protect resources by adding step-up authentication handling to the resource server or the API serving resources to your app. You may have API endpoints that require elevated authentication assurances. Also, consider a user making a large financial transaction where some transaction threshold warrants extra scrutiny. Checking the transaction amount requires inspecting the payload before triggering step-up authentication. Both scenarios work with the step-up authentication challenge protocol.

You may wonder why checking the `acr` claim in your API is necessary when you have already done so in the web app. Good web application security practices must enforce authentication, identity, and access control in the SPA client and APIs. Someone can bypass the SPA and make direct API calls – always guard all entries into your application system.

The flow works like this:

{% img blog/stepup-authentication/api-response-flow.svg alt:"Sequence diagram where you make an API call to a resource server, the resource server checks the access token's acr claim and denies the resource because the action requires elevated acr value. The API returns the insufficient_user_authentication error. The app redirects you to Okta to sign in with elevated authentication by passing in the required authentication level using the acr_values property. Okta responds with new access and id tokens. The app re-requests the resource from the resource server using the new access token." width:"800" %}{: .center-image }

{% comment %}
Tweak the diagram on https://mermaid.live/ with the following content
sequenceDiagram
    Your app->>API: GET sensitive resource
    API-->API: Check access token: acr = "low"
    API-->Your app: HTTP status 401 insufficient_user_authentication!
    Your app-->Okta: Sign in with acr_values="elevated"
    Okta-->>Your app: Here are your new tokens with acr = "elevated"
    Your app->>API: GET sensitive resource again
    API-->API: Check access token: acr = "elevated"
    API-->>Your app: HTTP status 200 OK!
{% endcomment %}

If the `acr` claim value doesn't meet the requirements, the API responds with a standard error:

```http
HTTP/1.1 401 Unauthorized
WWW-Authenticate: Bearer error="insufficient_user_authentication",
  error_description="A different authentication level is required",
  acr_values="elevated"
```

We'll use this error structure in the API response in NestJS, and when handling the step-up authentication error in the Angular app.

### Check the access token's ACR claim in a NestJS middleware

You'll make changes to the API first. I added Okta's `jwt-verifier` library to do the heavy lifting on verifying the access token and decoding the payload to get the `acr` claim.

The project contains an empty step-up authentication middleware. Open `packages/api/src/stepup.middleware.ts`.

In this file, you will:
  1. Initialize the JWT Verifier instance
  2. Ensure the `Authorization` header contains the access token
  3. Verify the token
  4. Get the `acr` claim value and compare it to the required value
  5. Respond with the resource or return 401 HTTP response with the standard header 

Let's start by initializing the Okta JWT Verifier instance and changing the `use()` method to `async`. Add the following code and replace `{yourOktaDomain}` with the Okta domain you got from the Okta CLI in a previous step.

```ts
import { HttpStatus, Injectable, NestMiddleware } from '@nestjs/common';
import OktaJwtVerifier from '@okta/jwt-verifier';

@Injectable()
export class StepupMiddleware implements NestMiddleware {
  private jwtVerifier = new OktaJwtVerifier({issuer: 'https://{yourOktaDomain}.okta.com/oauth2/default'});

  async use (req: any, res: any, next: () => void) {
    next();
  }
}
```

Next, you can use the `jwtVerifier` instance to verify the access token... if there is one. 🙀

No need to be dramatic; we can check. Update the `use()` method to get the access token from the `Authorization` header. Verifying the token using the JWT Verifier library returns the decoded token, so let's save the output in a variable. Update your code to look like this:

```ts
async use (req: any, res: any, next: () => void) {
  const authHeader = req.headers.authorization || '';
  const match:string[]|undefined = authHeader.match(/Bearer (.+)/);

  if (!match && match.length >=1 && match[1]) {
    return res.status(HttpStatus.UNAUTHORIZED).send();
  }

  let accessToken:OktaJwtVerifier.Jwt;
  try {
    accessToken = await this.jwtVerifier.verifyAccessToken(match[1], 'api://default');
  } catch (err) { 
    console.error(err)
    return res.status(HttpStatus.UNAUTHORIZED).send(err.message);
  }

  // add the ACR check

  next();
}
```

Now we can get to the step-up authentication specific code where you'll check the `acr` claim and return the standard error. In this example, you'll hardcode the required ACR value in this middleware, but you can define different ACR values per route. After the comment to "add the ACR check" but before the `next();` method call, add the following code: 

```ts
const acr_values = 'urn:okta:loa:2fa:any';
const acr = accessToken.claims['acr'] ?? '';

if (acr === '' || acr !== acr_values) {
  res.setHeader('WWW-Authenticate', `Bearer error="insufficient_user_authentication",error_description="A different authentication level is required",acr_values="${acr_values}"`)
  return res.status(HttpStatus.UNAUTHORIZED).send();
}
```

With the middleware implemented, you need to register it in the module. Open `packages/api/src/app.module.ts`. Edit the `AppModule` to add the `StepupMiddleware` to the "messages" route as shown:

```ts
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(StepupMiddleware).forRoutes('messages');
  }
}
```

> 💡 **Idea** 💡
>
>We hardcoded the required `acr_values` in the middleware and applied the middleware to all calls to the "messages" route for this demonstration, but NestJS does provide better mechanisms for scaling to larger projects and defining granular assurance requirements. One option might be to create a [NestJS guard](https://docs.nestjs.com/guards) to define which HTTP methods of an endpoint require step-up authentication. Furthermore, you can create a custom decorator for step-up authentication and pass in the required `acr_values` for the HTTP method. That way, a generic guard scales across your API, and you can define a GET call that requires two-factor authentication and a POST call requires phishing-resistant authentication assurance, for example.
>
> Let me know in the comments below if you want to see a tutorial about this! 📝

The resource server now handles step-up authentication for the "messages" route. It returns the standard error when user authentication is insufficient, but the Angular frontend needs to respond to this error.

### Use an Angular interceptor to catch step-up HTTP error responses

In Angular, we'll first identify the step-up authentication error response, then manipulate the HTTP error response by extracting the information needed for further handling. It starts in an interceptor.

Open `packages/frontend-angular/src/app/stepup.interceptor.ts`, an unmodified interceptor file scaffolded by Angular CLI.

```ts
import { HttpInterceptorFn } from '@angular/common/http';

export const stepupInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req);
};
```

Intercepting and handling HTTP error responses means we'll catch the error and provide an error handler function. Change your code as shown:

```ts
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

const handleError = (httpError: HttpErrorResponse) => {
  return throwError(() => httpError);
};

export const stepupInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(catchError(handleError));
};
```

The error handler needs first to verify this is an error we want to handle. Is this HTTP error a step-up error from our resource server? We can check for this! In the `handleError` method, add the following code and change the return value:

```ts
const handleError = (httpError: HttpErrorResponse) => {
  const allowedOrigins = ['/api'];
  if (httpError.status !== HttpStatusCode.Unauthorized || !allowedOrigins.find(origin => httpError.url?.includes(origin))) {
    return throwError(() => httpError);
  }

  let returnError: HttpErrorResponse| {error: string, acr_values: string} = httpError;
  const authResponse = httpError.headers.get('WWW-Authenticate') ?? '';
  if (!authResponse) {
    return throwError(() => returnError);
  }

  // add code to extract error details and format new error type

  return throwError(() => returnError)
};
```

Now we're at the stage where we know this is most likely an error we should handle, and we'll know for sure by extracting the `insuffcient_user_authentication` string from the `WWW-Authenticate` header. While parsing the header string, we'll look for the `acr_values`. Add the code to support this by replacing the `// add code to extract error details and format new error type` with:

```ts
const {error, acr_values} = Object.fromEntries((authResponse.replace('Bearer ', '').split(',') ?? []).map(el => el.replaceAll('"', '').split('=')));

if (error === 'insufficient_user_authentication') {
  returnError = {error, acr_values};
}
```

Lastly, add the interceptor to the `ApplicationConfig`. Open `packages/frontend-angular/src/app/app.config.ts`. Add the `stepupInterceptor` to the providers array.

```ts
provideHttpClient(withInterceptors([
  authInterceptor,
  stepupInterceptor
])
```

You can't redirect the user to authentication from an interceptor. You need to handle this new error format elsewhere, where you initiate redirecting the user to authentication with the required `acr_values` before re-requesting the resource.

### Handle step-up errors when making HTTP calls in Angular

You can handle catching the error, redirecting the user to authenticate, and re-request the resource within the call to the API, usually within an Angular service. I cheated a bit and wrote the API call directly in the component in this demonstration. Open `packages/frontend-angular/src/app/messages/messages.component.ts`.

You need the Angular `Router` and `OKTA_AUTH` instances so you can save the existing URL then redirect the user to authenticate. Create properties and inject both types within the class.

```ts
  private oktaAuth = inject(OKTA_AUTH);
  private router = inject(Router);
```

Change `messages$` to add a `catchError` operator. Within the `catchError` function, you'll ensure the error type is `insufficient_user_authentication`, set the redirect URI to navigate the user back to this component which will re-request the resource, and finally redirect the user to authenticate using the `acr_values`:

```ts
public messages$ = this.http.get<Message[]>('/api/messages').pipe(
    map(res => res || []),
    catchError(error => {
      if (error['error'] === 'insufficient_user_authentication') {
        const acrValues = error['acr_values'];
        const redirectTo = this.router.routerState.snapshot.url;

        this.oktaAuth.setOriginalUri(redirectTo);
        this.oktaAuth.signInWithRedirect({acrValues});
      }
      return throwError(() => error);
    })
  );
```

This code sure looks similar to the operations in the step-up auth Angular guard! 

Try out your work. Ensure you sign out of the application first. Sign in with one factor, then navigate to the "messages" route. You'll redirect to sign in with a second factor. Success!

## Ensure authentication recency in step-up authentication

We covered the authentication levels in this post because they are visually visible within the Okta-hosted sign-in page. The step-up authentication challenge protocol also supports authentication recency. The good news is the code and process we covered in the post still apply, but you'll use different claims and properties. In the redirect request, you'll define the required business rules for authentication recency using the `max_age` property instead of `acr_values`. Calculate authentication recency using the `auth_time` claim when evaluating whether a token meets the `max_age` requirement. Cool stuff indeed!

## Step-up authentication in Angular and NestJS applications

In this post, you walked through adding a step-up authentication challenge to protect resources. You added step-up authentication to protect Angular routes using the Okta Angular SDK, then added step-up authentication to protect resources from the NestJS API and within the Angular app.

There's a lot more we can do, and in a demo, we can't get into all the production-level polish we'd like, but I hope this sparks your imagination about how you can protect resources within your application. You can check out the completed application in the `completed` branch of the [okta-angular-nestjs-stepup-auth-example](https://github.com/oktadev/okta-angular-nestjs-stepup-auth-example/tree/completed) GitHub repository. The repository's README also includes instructions on scaffolding the starting project.

Ready to read other interesting posts? Check out the following links.

* [Step-up Authentication in Modern Applications](/blog/2023/03/08/step-up-auth)
* [Step-Up Authentication Examples With Okta](/blog/2023/10/24/stepup-okta)
* [Flexible Authentication Configurations in Angular Applications Using Okta](/blog/2024/02/28/okta-authentication-angular)
* [How to Build Micro Frontends Using Module Federation in Angular](blog/2024/02/28/okta-authentication-angular)

Don't forget to follow us on [Twitter](https://twitter.com/oktadev) and subscribe to our [YouTube channel](https://www.youtube.com/c/OktaDev/) for more exciting content. We also want to hear about the tutorials you want to see. Leave us a comment below!
