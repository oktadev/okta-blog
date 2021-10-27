---
disqus_thread_id: 7640616629
discourse_topic_id: 17140
discourse_comment_url: https://devforum.okta.com/t/17140
layout: blog_post
title: "Build a NodeJS App with TypeScript"
author: ivo-katunaric
by: contractor
communities: [javascript]
description: "Learn to build a simple blog server using Node.js and TypeScript."
tags: [nodejs, typescript, nestjs, secure, oauth, oidc, javascript]
tweets:
- "Learn to build a blog application using Node.js and TypeScript with NestJS! →"
- "Yes, you can use TypeScript with Node.js! Here's an example of building a blog application using Node.js and TypeScript with NestJS! →"
- "Can you use TypeScript with Node.js? Absolutely! Here's one approach to building a blog application with TypeScript and NestJS! →"
image: blog/featured/okta-node-bottle-headphones.jpg
type: conversion
---

As dynamically typed languages became prominent during the last decade, typeless (or should I say lawless?) programming became the norm for the backend as well as the frontend.

Many people believe the simplicity of "just writing" code is efficient for providing a proof of concept or prototyping applications.

However, as those applications grow, the typeless code used to build them often becomes incredibly convoluted and more difficult (some would say impossible) to manage.

In the worst cases, developers end up resorting to testing and prayer in the hopes that simple operations like renaming a function won't break the whole complex system.  However, developers can build their code from day one to make their codebase readable at scale.

## TypeScript to the rescue

The key to making a large (or even small!) codebase readable is to keep track of all the data types flowing through the app.

To help developers with this, TypeScript provided a typed superset of plain old JavaScript.
This means that a regular JavaScript developer's existing knowledge applies to TypeScript.

There are other efficient ways developers can use their knowledge and code in new ways. Developers who use NodeJS can now recycle their frontend code for the backend, and vice versa.

Additionally, the introduction of static typing to JavaScript allows developers to reuse some of that old Java/C# knowledge to help maintain their NodeJS codebases.

## Today's Project: A Simple Blogging Engine

In this tutorial, we need a new backend for a blogging engine. This app will contain a list of blog posts, each with a title, content, and author.

The authors will be able to register and log in using the session-in-cookies approach. Okta will manage the users, and all blog posts will be saved in memory.

Documentation for the backend will be exposed as a Swagger specification generated from TypeScript typings for classes and methods.

## Dependencies for the NodeJS Typescript Sample App

- NestJS to bootstrap the server
- Swagger to define the server docs
- Okta for user management and authentication
- NodeJS
- `validate-class` npm library for input validation
- nodemon to auto-restart the server on every change

## Initialize

Create an empty directory `bloggeur`, `cd` into it, and type `npm init` there. After pressing the `ENTER` key  a few times, a NodeJS project will initiate.

## TypeScript config JSON

As TypeScript is very configurable, most TypeScript projects contain a configuration to select the language features it should use.

Create a `tsconfig.json` in the root of your project:

```json
{
  "compilerOptions": {
    "target": "es2015",
    "lib": ["es2015"],
    "types": ["reflect-metadata", "node"],
    "module": "commonjs",
    "moduleResolution": "node",
    "experimentalDecorators":true,
    "emitDecoratorMetadata": true,
    "sourceMap": true,
    "declaration": false,
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true
  },
  "exclude": [
    "node_modules"
  ]
}
```

## Add all the dependencies

```bash
npm install @nestjs/common@6.5.2 @nestjs/core@6.5.2 @nestjs/platform-express@6.5.2 @nestjs/swagger@3.1.0 @okta/okta-auth-js@2.6.0 @okta/okta-sdk-nodejs@2.0.0 @types/express@4.17.0 @types/node@12.6.2 class-transformer@0.2.3 class-validator@0.9.1 cookie-parser@1.4.4 dotenv@8.0.0 install@0.13.0 reflect-metadata@0.1.13 rxjs@6.5.2 swagger-ui-express@4.0.7 ts-node@8.3.0 typescript@3.5.3 glob@7.1.4 @types/glob@7.1.1
```

Most of these dependencies should be straightforward, but a few of them require a bit of explaining:

- The authentication and authorization middlewares require the `@okta` packages
- The `@nestjs` packages are a part of NestJS platform, a high-level wrapper around Express.js that powers the TypeScript metadata feature for API documentation
- The `reflect-metadata` package exposes metadata features
- `class-transformer` and `class-validator` validate client input before passing it to the controllers

## Create the server startup

Create a point of entry (`server.js`) to set up the TypeScript context and run the project using a regular `node` command:

```js
require('reflect-metadata'); // used to extract static data types at runtime, needed for automatic API docs generation
require('ts-node/register'); // used to transpile typescript code dynamically at runtime
require('dotenv/config'); // if it exists, loads .env file into process.env
require('./src/server.ts'); // entry into the TypeScript realm
```

Also, create a `src` directory, for the source code.

## Create a NestJS module

Both Node.js and .NET heavily inspired NestJS. So it's not surprising that every NestJS app is just a bunch of modules.

Create an (almost) empty NestJS module `src/application.module.ts`. It only contains a cookie-parser middleware, and will contain all of the application's (currently non-existent) controllers:

```typescript
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import glob from 'glob';

const controllers =
  glob.sync('*.module/*-controller.ts', { cwd: __dirname, absolute: true }) // go through all the modules containing controllers
    .map(require) // require every one of them
    .map(imported => imported.default);
    // and return each one's default export (which is expected to be a NestJS controller class)

@Module({
  controllers
})
export class ApplicationModule implements NestModule {
  configure(consumer: MiddlewareConsumer): MiddlewareConsumer | void {
    consumer.apply(cookieParser()).forRoutes('/');
  }
}
```

## Bootstrap the NestJS server

Create `src/server.ts` to spin up the server:

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ApplicationModule } from './application.module';

async function bootstrap() {
  const app = await NestFactory.create(ApplicationModule); // Application module created in the step before
  app.useGlobalPipes(new ValidationPipe()); // Makes use of class-validate to sanitize data entering the API

  // Creates Swagger documentation and OpenAPI console on the root path (http://localhost:3000)
  const swaggerOptions = new DocumentBuilder().build();
  const document = SwaggerModule.createDocument(app, swaggerOptions);
  SwaggerModule.setup('/', app, document);

  await app.listen(3000);
}

bootstrap().catch(console.error);
```

## Test Run your Application

By running `npm start` or `node server.js`, your server should be started on port 3000.

But be sure to run it using `nodemon` to allow for automatic restarts:

```bash
npx nodemon server.js --ext ts
```

After running the server, direct your browser to `http://localhost:3000`. An API console should open with the message "No operations defined in spec".

Now let's create a few operations!

## Create the `BlogPost` module

Create a directory `src/blog-post.module`. In it, create `src/blog-post.module/blog-post-controller.ts` to contain all the posts:

```typescript
import { Controller, Get } from '@nestjs/common';
import { ApiModelProperty, ApiResponse } from '@nestjs/swagger';

export class BlogPost {
  @ApiModelProperty() // used to generate Swagger documentation that `BlogPost` model contains id of type number
  id: number;

  @ApiModelProperty()
  authorId: string;

  @ApiModelProperty()
  title: string;

  @ApiModelProperty()
  content: string;
}

export const blogPosts = [{
  id: 1,
  authorId: 'xxx',
  title: 'Build a NodeJS App with Typescript',
  content: 'Whats wrong with Javascript?'
}, {
  id: 2,
  authorId: 'yyy',
  title: 'Don\'t build a NodeJS App with Typescript',
  content: 'Whats wrong with Typescript?'
}];

@Controller('blog-posts')
export default class BlogPostController {
  @Get() // registers a `blog-posts` GET method on the API
  @ApiResponse({ type: BlogPost, status: 200, isArray: true }) // for Swagger documentation: API returns an array of BlogPost models
  findAll(): Array<BlogPost> {
    return blogPosts;
  }
}
```

Refresh browser page `http://localhost:3000`, and execute `GET blog-posts` in the API console.

## Create the Authentication module

Create a directory for authentication module: `src/auth.module`.

To help offload the burden of authentication, you will use Okta for authentication, authorization, and user account management.

## Create a forever-free Okta account and application

[Click here](https://developer.okta.com/signup/) to create an account.

Once you're logged into your Okta dashboard, click **Applications** in the menu and click **Add Application**. From the wizard, choose **Service** and click **Next**.

On the Application Settings screen, name the application (I've named mine "the-blog-backend").

After an application has been successfully created, copy the client ID and client secret into the `.env` file in the root of the project.

The dotenv (.env) file stores your development environment variables. They switch your application's code from development to production or reference accounts on 3rd-party providers.

This file is consumed by the `require('dotenv/config')` statement in your `server.js` file. It copies the values from `.env` file into the `process.env` global variable. Create an empty `.env` file in the root directory of the project.

The application needs an API token to communicate with Okta. In the Okta dashboard, click on **API**, then **Tokens**, and on the new page click **Create Token**. Copy its value to the `.env` file as well.

You'll also put your Okta account's domain in the `.env` file. It's the hostname of the Okta dashboard you're currently using, but without the `-admin` part. It should look something like `dev-xxxxxx.okta.com`.

After writing all those values, your `.env` file should look something like this:

```dotenv
OKTA_CLIENT_ID={yourClientId}
OKTA_CLIENT_SECRET={yourClientSecret}
OKTA_APP_TOKEN={yourAppToken}
OKTA_DOMAIN=https://{yourOktaDomain}
```

All these values are needed for the next section.

## Integrate Authentication with Okta APIs

The Okta APIs you need for this project are the authentication API and the user management API.

Both are nicely exposed through npm packages `@okta/okta-auth-js` and `@okta/okta-sdk-nodejs`.

Create `src/auth-module/okta-client.ts` file to integrate with those services:

```typescript
import { Client as OktaClient } from '@okta/okta-sdk-nodejs';
import OktaAuth from '@okta/okta-auth-js';

const { OKTA_DOMAIN, OKTA_APP_TOKEN } = process.env; // provided by .env file

const oktaClient = new OktaClient({
  orgUrl: OKTA_DOMAIN,
  token: OKTA_APP_TOKEN,
});

const oktaAuthClient = new OktaAuth({
  issuer: `${OKTA_DOMAIN}/oauth2/default`,
});

export interface IRegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface IRegistrationResponse {
  id: string;
}

export async function register(registerData: IRegisterData): Promise<IRegistrationResponse> {
  const { email, firstName, lastName, password } = registerData;
  const createdUser = await oktaClient.createUser({
    profile: { email, login: email, firstName, lastName },
    credentials: { password : { value: password } }
  });

  return createdUser;
}

export interface ILoginData {
  email: string;
  password: string;
}

export interface ISession {
  sessionId: string;
  userId: string;
  userEmail: string;
}

export async function sessionLogin(loginData: ILoginData): Promise<ISession> {
  const { email: username, password } = loginData;
  const { sessionToken } = await oktaAuthClient.signIn({ username, password });

  const session = await oktaClient.createSession({ sessionToken });
  const { login, id, userId } = session;

  return { sessionId: id, userEmail: login, userId };
}

export async function getSessionBySessionId(sessionId: string): Promise<ISession> {
  const session = await oktaClient.getSession(sessionId);
  const { login, id, userId } = session;

  return { sessionId: id, userEmail: login, userId };
}

export async function getUserById(id: string) {
  const { profile: { firstName, lastName, email } } = await oktaClient.getUser(id);
  return { id, firstName, lastName, email };
}
```

You have now exposed the functions to register a user with Okta, generate a session ID using email and password, and fetch a user by their ID.

That's all you need for user management and authentication for this project.

## Create a Login Endpoint

To allow for authentication, you need a login endpoint. Create a `src/auth.module/auth-controller.ts` file:

```typescript
import { Body, Controller, Post, Req, UnauthorizedException } from '@nestjs/common';
import { ApiModelProperty, ApiResponse } from '@nestjs/swagger';
import { sessionLogin } from './okta-client';
import { Request } from 'express';

/*
 DTO is short for Data Transfer Object
 DTO is an object that carries data between processes
 In the context of web apps, it's used to document type of data to be transferred between backend and frontend
 */
export class LoginDto {
  @ApiModelProperty()
  email: string;

  @ApiModelProperty()
  password: string;
}

export class LoginResponseDto {
  @ApiModelProperty()
  sessionId: string;

  @ApiModelProperty()
  userEmail: string;

  @ApiModelProperty()
  userId: string
}

@Controller('login')
export default class AuthController {
  @Post()
  @ApiResponse({ type: LoginResponseDto, status: 201 })
  async login(@Body() data: LoginDto, @Req() request: Request): Promise<LoginResponseDto> {
    const { email, password } = data;
    try {
      const session = await sessionLogin({ email, password });
      request.res.cookie('sessionId', session.sessionId);
      return session;
    } catch (e) {
      console.log('login error', e);
      throw new UnauthorizedException('Invalid email or password');
    }
  }
}
```

You can now refresh the Swagger page at `http://localhost:3000` to try out the new `login` endpoint.

We currently have no way to register a user through the server, so you can use Okta's dashboard to create one and then execute a `login` endpoint with the corresponding email and password.

## Create endpoints to create and fetch users

Having said that, let's create endpoints for user creation and fetching.

Create `src/user.module` file and in it, create a `src/user.module/user-controller.ts` file:

```typescript
import { Body, Controller, Get, NotFoundException, Param, Post, Req } from '@nestjs/common';
import { ApiModelProperty, ApiResponse } from '@nestjs/swagger';

import { getUserById, register, sessionLogin } from '../auth.module/okta-client';
import { IsEmail, IsNotEmpty } from 'class-validator';
import { Request } from 'express';

export class User {
  @ApiModelProperty()
  id: string;

  @ApiModelProperty()
  email: string;

  @ApiModelProperty()
  firstName: string;

  @ApiModelProperty()
  lastName: string;
}

export class UserRegisterDto {
  @ApiModelProperty()
  @IsEmail()
  email: string;

  @ApiModelProperty()
  @IsNotEmpty()
  password: string;

  @ApiModelProperty()
  @IsNotEmpty()
  firstName: string;

  @ApiModelProperty()
  @IsNotEmpty()
  lastName: string;
}

@Controller('users')
export default class UserController {
  @ApiResponse({ type: User, status: 201 })
  @Post()
  async create(@Body() userData: UserRegisterDto, @Req() request: Request): Promise<User> {
    const { email, password, firstName, lastName } = userData;
    const { id } = await register({ email, password, firstName, lastName });
    const { sessionId } = await sessionLogin({ email, password });
    request.res.cookie('sessionId', sessionId);

    return { id, email, firstName, lastName };
  }

  @ApiResponse({ type: User, status: 200 })
  @Get(':id')
  async find(@Param('id') id: string): Promise<User> {
    try {
      const user = await getUserById(id);
      return user;
    } catch (e) {
      console.error('could not find user', id, e);
      throw new NotFoundException('No such user');
    }
  }
}
```

Everything is pretty much the same here except for the `@IsEmail()` and `@IsNotEmpty()` validators.

Those prevent a request from being executed if data sent to the server does not contain a valid email and non-empty first and last name and password.

You can try out those validators by refreshing `http://localhost:3000` page and executing `register` endpoint with some faulty data.

## Secure the API

We need two more things for a secure API: authentication middleware to identify a logged-in user and an `is-authenticated` guard to protect non-public endpoints from anonymous access.

Create a `src/auth.module/auth-middleware.ts` file:

```typescript
import { NestMiddleware } from '@nestjs/common';
import { Request, Response } from 'express';
import { getSessionBySessionId } from './okta-client';

export class AuthMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: Function) {
    const { sessionId } = req.cookies;
    if (!sessionId) {
      return next();
    }

    try {
      req['auth'] = await getSessionBySessionId(sessionId);
    } catch (e) {
      console.log('session fetching failed', e);
    }
    next();
  }
}
```

This middleware extracts `sessionId` from cookies and attaches session info to the `auth` key of the request object.

To use the created middleware, apply it to the Application module. `src/application.module.ts` should look like this after the change:

```typescript
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import glob from 'glob';

import { AuthMiddleware } from './auth.module/auth-middleware';

const controllers =
  glob.sync('*.module/*-controller.ts', { cwd: __dirname, absolute: true })
    .map(require)
    .map(imported => imported.default);

@Module({
  controllers
})
export class ApplicationModule implements NestModule {
  configure(consumer: MiddlewareConsumer): MiddlewareConsumer | void {
    consumer.apply(cookieParser(), AuthMiddleware).forRoutes('/');
  }
}
```

Next is the authentication guard. Create a `src/auth.module/is-authenticated-guard.ts` file:

```typescript
import { CanActivate, ExecutionContext } from '@nestjs/common';

export class IsAuthenticatedGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const { auth } = request;
    return !!auth;
  }
}
```

Now we're finally ready to create a blog post!

## Create a blog post

To allow blog post creation, let's expand our `BlogPost` controller to add a `create()` method. The method should be secured against unauthenticated usage and also modified to use `userId` extracted from the user's session.

This is what the `src/blog-post.module/blog-post-controller.ts`  file looks like after adding the `create()` method:

```typescript
import { Body, Controller, Get, NotFoundException, Param, Post, Req, UseGuards } from '@nestjs/common';
import { ApiModelProperty, ApiResponse } from '@nestjs/swagger';
import { IsAuthenticatedGuard } from '../auth.module/is-authenticated-guard';
import { IsNotEmpty } from 'class-validator';
import { getUserById } from '../auth.module/okta-client';
import { User } from '../user.module/user-controller';

export class BlogPost {
  @ApiModelProperty()
  id: number;

  @ApiModelProperty()
  authorId: string;

  @ApiModelProperty()
  title: string;

  @ApiModelProperty()
  content: string;
}

export class BlogPostDto {
  @ApiModelProperty()
  @IsNotEmpty()
  title: string;

  @ApiModelProperty()
  @IsNotEmpty()
  content: string;
}

// you also don't need those dummy blog posts because they can be created through API now
export const blogPosts = new Array<BlogPost>();

@Controller('blog-posts')
export default class BlogPostController {
  @Get()
  @ApiResponse({ type: BlogPost, status: 200, isArray: true })
  findAll(): Array<BlogPost> {
    return blogPosts;
  }

  @Post()
  @ApiResponse({ type: BlogPost, status: 201 })
  @UseGuards(IsAuthenticatedGuard)
  create(@Body() blogPostDto: BlogPostDto, @Req() req): BlogPost {
    const { content, title } = blogPostDto;
    const id = blogPosts.length + 1;
    const { userId } = req['auth'];

    const newBlogPost: BlogPost = { id, title, content, authorId: userId };
    blogPosts.push(newBlogPost);

    return newBlogPost;
  }

  @Get(':id/author')
  async findAuthor(@Param('id') blogPostId: string): Promise<User> {
    const blogPost = blogPosts.filter(post => post.id.toString() === blogPostId)[0];
    if (!blogPost) {
      throw new NotFoundException('No such blog post');
    }
    return await getUserById(blogPost.authorId);
  }
}
```

After refreshing that `http://localhost:3000` page again, you should finally be able to create blog posts (but only after a successful login).

## Good job!

Congratulations. You have finished a small blogging engine using NodeJS and TypeScript.

You leveraged TypeScript's typing system to both implement and document a simple REST API.

Notice how API documentation and implementation are held together rather than being written apart? That helps keep the docs and implementation in sync as the API evolves.

## Learn more about NodeJS and TypeScript

If you liked this post, you may also like these great posts from the Okta Developer blog.

- [If It Ain't TypeScript It Ain't Sexy](/blog/2019/02/11/if-it-aint-typescript)
- [Build a Node.js API with TypeScript](/blog/2019/05/07/nodejs-typescript-api)
- [Use TypeScript to Build a Node API with Express](/blog/2018/11/15/node-express-typescript)

The source code for this project can be found on [GitHub](https://github.com/oktadeveloper/okta-nodejs-typescript-example).

If you want to explore the more advanced authentication, authorization, and user management functionality Okta provides, take a look at our [developer documentation](/docs/reference/)

If you liked this tutorial, follow us [@oktadev](https://twitter.com/oktadev) on Twitter and check out tutorial screencasts and other videos on our [YouTube channel](https://youtube.com/c/oktadev).
