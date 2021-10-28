---
disqus_thread_id: 7889036299
discourse_topic_id: 17218
discourse_comment_url: https://devforum.okta.com/t/17218
layout: blog_post
title: "Build a Secure NestJS API with Postgres"
author: ivo-katunaric
by: contractor
communities: [javascript]
description: "Learn to build a secure Node.js API using NestJS, TypeScript, and Postgres!"
tags: [nestjs, nodejs, typescript, postgres, javascript, typeorm]
tweets:
- "Want to learn how to build a secure API using the NestJS framework? Check out this tutorial on building an Instagram clone! @nestframework #nestjs #nodejs #typescript #postgres"
- "Learn how to build an Instagram clone with the #NestJS framework using #Postgres! #typescript #nodejs"
image: blog/featured/okta-node-skew.jpg
type: conversion
---

NestJS is a modern, progressive framework for building Node.js applications and APIs. NestJS is built on TypeScript, and is designed to use solid programming metaphors such as controllers and modules. Having automatic Swagger API documentation built-in is also a great feature.

Postgres (or PostgreSQL), much like other relational databases, provides a way to persist and query data. It's a powerful, open-source, object-relational database system with over 30 years of active development that has earned it a strong reputation for reliability, feature robustness, and performance.

In this tutorial, you will build a small Instagram clone named **Instamiligram**. Your project will include the following features:

- User Registration
- User Login
- Upload a Photo and View
- Like a Photo
- API Auto-Documentation

## What You Need to Build a NestJS and Postgres API

- [Node.js](https://nodejs.org) version 8+
- [Docker Desktop](https://www.docker.com/get-started)
- A free [Okta developer account](https://developer.okta.com)

During the `npm install` phase, the following dependencies will be installed:

- **TypeScript**, a superset of JavaScript with static typing
- **TypeORM**, an Object Relational Mapper for TypeScript and JavaScript
- **NestJS**, a Node.js framework for building server-side applications

## Initialize the NestJS Project and Add Dependencies

Open a terminal and change to a directory where you want to create your project.

```bash
mkdir instamiligram
cd instamiligram
npm init --yes
npm install @nestjs/common@6.5 @nestjs/core@6.5 @nestjs/platform-express@6.5 @nestjs/swagger@3.1 @okta/okta-auth-js@2.6 @okta/okta-sdk-nodejs@2.0 class-transformer@0.2 class-validator@0.9 cookie-parser@1.4 dotenv@8.0 glob@7.1 pg@7.12 reflect-metadata@0.1 rxjs@6.5 swagger-ui-express@4.0 ts-node@8.3 typeorm@0.2 typescript@3.5
npx ts-typie
```

> Note: If after using `npx ts-typie` you see "no types found for..." error messages, don't worry. Not all dependencies have TypeScript type definition libraries.

## Create a Postgres Database

The standard way to install Postgres is to go through the [official documentation](https://www.postgresql.org/download/) and install it on your computer like any other software. However, if you want to keep your environment consistent across different machines and OS versions, it might be a good idea to pull and run an existing virtual machine image that includes Postgres. [Docker](https://www.docker.com/) is a great choice.

This project is going to use Docker to host a Postgres database. Create a file in your project folder named `docker-compose.yml` and copy the following configuration.

```yaml
version: "3"
services:
  instamiligram_db:
    image: "postgres:11"
    container_name: "instamiligram_db"
    ports:
      - "54321:5432"
    environment:
      POSTGRES_PASSWORD: p@ssw0rd
```

This configuration file will be used by the `docker-compose` command to create a new container named `instamiligram_db` for the Postgres database. The line `image: "postgres:11"` informs Docker of the image on which to base the new container. The configuration file also maps port 54321 to the container's port 5432, which means connections to the Postgres database from the application will use port 54321.

To create and start the new Postgres container, enter the following command in your terminal or command prompt.

```sh
docker-compose up -d
```

The next step is to configure the Node.js application for Postgres. Create a `.env` file in the root of the project and copy the following.

```properties
DB_PORT=54321
DB_USERNAME=postgres
DB_PASSWORD=p@ssw0rd
DB_DATABASE=postgres
DB_HOST=localhost
```

The `dotenv` dependency will read this file and make these settings appear to Node.js as if they were environment variables, which can be accessed from Node's global `process.env` array.

## Configure the Connection to the Postgres Database

Next, set up the Node.js application to use TypeORM. In the root folder, create a new file named `ormconfig.js` and copy the following code.

```javascript
require('dotenv/config'); // load everything from `.env` file into the `process.env` variable

const { DB_PORT, DB_USERNAME, DB_PASSWORD, DB_DATABASE, DB_HOST } = process.env;

module.exports = [{
  name: 'default',
  type: 'postgres',
  host: DB_HOST,
  port: DB_PORT,
  username: DB_USERNAME,
  password: DB_PASSWORD,
  database: DB_DATABASE,
  synchronize: true,
  entities: [
    "src/**.module/*-model.ts"
  ],
  subscribers: [
    "src/**.module/*-subscriber.ts"
  ],
  migrations: [
    "src/migrations/*.ts"
  ]
}];
```

At runtime, TypeORM reads this file for information on what type of database is being used, how to connect the database, and where to look for the application's database models and migrations.

## Setup TypeScript for Your NestJS Application

To configure the Node.js project to use TypeScript, create a `tsconfig.json` file in the root of the project, and copy the following code.

```json
{
  "compilerOptions": {
    "target": "es2015",
    "lib": ["es2015"],
    "types": ["reflect-metadata", "node"],
    "module": "commonjs",
    "moduleResolution": "node",
    "experimentalDecorators": true,
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

TypeScript needs to be transpiled to JavaScript after every change. To avoid having to do this manually, it's a good idea to set up dynamic transpilation using `ts-node`. Create a new file named `server.js` in the root folder of the project, and add the following code.

```javascript
require('dotenv/config');
require('reflect-metadata');
require('ts-node/register');

require('./src/bootstrap.ts')
  .bootstrap()
  .catch(console.error);
```

This code sets up dynamic transpilation for every `require` and then runs the `bootstrap` function from the `src/bootstrap.ts` file.

By convention, this directory contains code that must be transpiled before running. Also, note that `dotenv/config` is also executed from here to make sure that all the environmental variables are loaded before any of the server code is executed.

## Bootstrap Your NestJS Server

You'll now create a root application module that should be able to register all the app's controllers and apply any middleware.

Create a new folder named `src`. In the `src` folder, create a new file named `bootstrap.ts` and copy the following code.

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { createConnection } from 'typeorm';
import cookieParser from 'cookie-parser';
import glob from 'glob';

// requires all the files which conform to the given pattern and returns the list of defaults exports
function requireDefaults(pattern: string) {
  return glob.sync(pattern, { cwd: __dirname, absolute: true })
    .map(require)
    .map(imported => imported.default);
}

// requires all the controllers in the app
const controllers = requireDefaults('*.module/*-controller.ts');

// requires all the global middleware in the app
const middleware = requireDefaults('*.module/*-middleware.ts');

@Module({
  controllers
})
class ApplicationModule implements NestModule {
  configure(consumer: MiddlewareConsumer): MiddlewareConsumer | void {
    consumer.apply(cookieParser(), ...middleware).forRoutes('/');
  }
}

export async function bootstrap() {
  await createConnection();
  const app = await NestFactory.create(ApplicationModule);

  // allows for validation to be used
  app.useGlobalPipes(new ValidationPipe());

  // allows for NestJS's auto documentation feature to be used
  const options = new DocumentBuilder().addBearerAuth().build();
  const document = SwaggerModule.createDocument(app, options);

  SwaggerModule.setup('/', app, document);

  await app.listen(3000);
}
```

The previous code sets up the Nest application server along with the TypeORM database connection. It configures Nest to scan for any custom controllers and middleware in the application. Finally, it starts the application and listens on port 3000.

You can start the server by typing `npm start`. Navigate your browser to `http://localhost:3000` and you should see an empty Swagger docs page. Whenever you make changes to code, you will need to restart the server. You can stop the server by pressing `CTRL+C` and restart using the `npm start` command.

However, it would be better to have the server automatically restart after every change. Instead of `npm start`, you can run the following command instead.

```sh
npx nodemon server.js --ext ts
```

`nodemon` monitors the project folder for changes to `.ts` files and automatically restarts the application.

## Use Okta for User Storage and Authentication

Storing sensitive data can be a burden for any application. Instead of worrying about security, such as how to manage users and the safest way to store credentials, it's much easier to delegate those concerns to an expert like Okta. Sign up for your forever free Okta account by [clicking here](https://developer.okta.com/signup/).

Once you're logged into your Okta dashboard, click on the **Applications** menu item and click **Add Application**. From the wizard, choose **Service** and click **Next**.

On the **Application Settings** screen, name the application "Instamiligram".

You're also going to need to create an API token to communicate with Okta. Click on **API**, **Tokens** and when the new page opens, click on the **Create Token** button. Give the new token the name "Instamiligram" and then click **Create Token**.

Copy the the value of the token and put it in your `.env` file in place of the `{yourApiToken}` placeholder.

```sh
DB_PORT=54321
DB_USERNAME=postgres
DB_PASSWORD=p@ssw0rd
DB_DATABASE=postgres
DB_HOST=localhost

OKTA_APP_TOKEN={yourApiToken}
OKTA_DOMAIN=https://{yourOktaDomain}
```

You will also need to add your Okta account's domain to the `.env` file. It's the hostname of the Okta dashboard you're currently using, but without the `-admin` part. It should look something like `dev-xxxxxx.okta.com`. Replace `{yourOktaDomain}` in the `.env` file with your Okta account domain.

## Integrate Your NestJS App with Okta

To integrate with Okta, you'll utilize `@okta/okta-sdk-nodejs` for user registration and `@okta/okta-auth-js` for session management. This logic belongs in an auth module. Under the `src` folder, create a new folder named `auth.module`. Inside the `auth.module` folder, create a new file named `okta-client.ts` and copy the following code.

```typescript
import { Client as OktaClient } from '@okta/okta-sdk-nodejs';
import OktaAuth from '@okta/okta-auth-js';

const { OKTA_DOMAIN, OKTA_APP_TOKEN } = process.env;

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
```

Three functions exported by this file allow the server to register users, initiate user sessions and connect existing sessions with users.

## Add Postgres Database Entities and Relations

To build a quality backend, there must exist a concise structure of the data persisted by the server. One way to define such a structure is through something called Entities' Relation Model.
Based on that model, you'll create one TypeScript class per database table. Those classes will be consumed by TypeORM and used to create and populate tables in the Postgres database.

One possible model for an app such as `Instamiligram` would look like this:

- __User has many Photos <-> Photo has one User author__
- __Photo has many Users likedBy <-> User has many Photos likedPhotos__

In the `src` folder, create a new folder named `user.module`. In the `src/user.module` folder, create a new file named `user-model.ts` with the following code.

```typescript
import { ApiModelProperty } from '@nestjs/swagger';
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToMany } from 'typeorm';

import { PhotoModel } from '../photo.module/photo-model';

@Entity({ name: 'users' })
export class UserModel {
  @ApiModelProperty()
  @PrimaryGeneratedColumn()
  id: number;

  @ApiModelProperty()
  @Column({ unique: true })
  oktaId: string;

  @OneToMany(() => PhotoModel, photo => photo.owner)
  photos: Promise<Array<PhotoModel>>;

  @ManyToMany(() => UserModel, user => user.likedPhotos)
  likedPhotos: Promise<Array<PhotoModel>>;
}
```

The field `oktaId` stores the Id of the given user within the Okta authentication system. The array `photos` contains all the photos created by the user and an array of `likedPhotos` contains all the photos liked by the user. The decorator `@ApiModelProperty()` is used to document the field for the Swagger documentation. This allows any field decorated by it to be visible from the Swagger console that's currently running on `http://localhost:3000`.

The new UserModel depends on a `PhotoModel`, so create that next. In the `src` folder, create a new folder named `photo.module`. In the `src/photo.module` folder, create a new file named `photo-model.ts` with the following code.

```typescript
import { ApiModelProperty } from '@nestjs/swagger';
import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, ManyToMany, JoinTable } from 'typeorm';

import { UserModel } from '../user.module/user-model';

@Entity({ name: 'photos' })
export class PhotoModel {
  @ApiModelProperty()
  @PrimaryGeneratedColumn()
  id: number;

  @ApiModelProperty()
  @Column()
  name: string;

  @Column({ type: 'text', select: false })
  base64Content: string;

  @ApiModelProperty()
  @Column({ unique: true })
  slug: string;

  @ApiModelProperty()
  url: string;

  @ApiModelProperty()
  @Column()
  ownerId: number;

  @ManyToOne(() => UserModel, user => user.photos)
  owner: Promise<UserModel>;

  @JoinTable()
  @ManyToMany(() => UserModel, user => user.likedPhotos)
  likedBy: Promise<Array<UserModel>>;
}
```

The most important field of the `PhotoModel` is the `base64Content` field.
It's used to persist the entire photograph data into the database table as one long string of characters (hence the type: `string` symbol).

## Synchronize the Postgres Database and Okta system

Some of the user's data (`firstName`, `lastName`, `email`, etc.) are stored in Okta and some of the data is stored in the database (ownership over photos and likes). In order to merge those two sets of data, you have to assert that every user from Okta also exists in your Postgres database. Create a `src/user.module/assert-user.ts` file with the following code.

```typescript
import { getManager } from 'typeorm';
import { UserModel } from './user-model';

export async function assertUser(oktaUserId: string) {
  const manager = getManager();
  const existingUser = await manager.findOne(UserModel, { where: { oktaUserId } });
  if (existingUser) {
    return existingUser;
  }

  const user = new UserModel();
  user.oktaId = oktaUserId;
  return await manager.save(user);
}
```

The function `assertUser` makes sure that a Okta user also exists in the local database; either by creating a new one or simply returning an existing one.

## Add User Registration to the NestJS App

An API endpoint for user registration belongs to `user-controller`. So, create the file `src/user.module/user-controller.ts` for this purpose:

```typescript
import { Body, Controller, Post, Req } from '@nestjs/common';
import { ApiModelProperty, ApiResponse } from '@nestjs/swagger';
import { Request } from 'express';
import { IsEmail, IsNotEmpty } from 'class-validator'

import { register, sessionLogin } from '../auth.module/okta-client';
import { UserModel } from './user-model';
import { assertUser } from './assert-user';

/*
 DTO is short for Data Transfer Object
 DTO is an object that carries data between processes
 In the context of web apps, it's used to document type of data to be transferred between backend and frontend
 */
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
  @ApiResponse({ type: UserModel, status: 201 })
  @Post()
  async create(@Body() userData: UserRegisterDto, @Req() request: Request) {
    const { email, password, firstName, lastName } = userData;
    const { id: oktaUserId } = await register({ email, password, firstName, lastName });
    const user = await assertUser(oktaUserId);
    const { sessionId } = await sessionLogin({ email, password });
    request.res.cookie('sessionId', sessionId);

    return { id: user.id, email, firstName, lastName };
  }
}
```

The previous `UserController` adds a `create()` endpoint that takes a user (email, password, firstName, and lastName) and registers that user with Okta. It then retrieves the user from Okta, adds the user profile to the database, and then creates a user session.

Revisit (or refreshing) the docs page at `http://localhost:3000`. You should see a `POST /users` method has appeared. (Note: You may need to restart the server if the application was started using `npm start` instead of `nodemon`.)

If you want to test the new method, press click on the method and then click the **Try it out** button. Update the `UserRegisterDto` JSON example data, and then press the blue **Execute** button. If you receive an error, it might be due to the default Okta password policy. Read the error message printed to the console, update the JSON, and try submitting the form again.

## Add User Authentication to the NestJS App

After having integrated with Okta's user storage and authentication services, you're now ready to implement the login endpoint. Its purpose is exchanging user's email and password for a session. In the `src/auth.module` folder, create a file name `auth-controller.ts` and add the following code.

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

The `AuthController` class exports a `login` method. This method takes an email and password and attempts to sign in to Okta using the provided credentials. If successful, a user session is created and the session information is returned.

Refresh the Swagger console at `http://localhost:3000` and you should see the new `login` method. Test it the same way as the user creation endpoint. With a successful login, your browser stores the session as a session cookie. Future requests are authenticated and authorized based on this session.

## Consume Cookies in NestJS

The standard way to identify a user with the session stored in a cookie is to create an authentication middleware. In the `src/auth.module` folder, create a new file named `auth-middleware.ts` and add the following code.

```typescript
import { NestMiddleware } from '@nestjs/common';
import { Request, Response } from 'express';

import { getSessionBySessionId } from './okta-client';
import { assertUser } from '../user.module/assert-user';

export default class AuthMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: Function) {
    const { sessionId } = req.cookies;
    if (!sessionId) {
      return next();
    }

    try {
      const session = await getSessionBySessionId(sessionId);
      req['user'] = await assertUser(session.userId);
    } catch (e) {
      console.log('session fetching failed', e);
    }
    next();
  }
}
```

The middleware pulls the current `sessionId` from cookies and then uses the sessionId to retrieve the user from the Postgres database. If the sessionId and user are found, then the request is authenticated.

## Secure Sensitive NestJS Endpoints

After deciding on whether a request is authenticated or not, you will want to accept or reject certain requests based on authentication. These pieces of code are also variants of middleware and are called "guards". In the `src/auth.module` folder, create a new file named `is-authenticated-guard.ts` and add the following code.

```typescript
import { CanActivate, ExecutionContext } from '@nestjs/common';

export class IsAuthenticatedGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest();
    const { user } = request;
    return !!user;
  }
}
```

This guard simply returns `true` if a request is authenticated and `false` otherwise.

## Add a Photo Controller to Your NestJS App

The only thing that remains is creating the controller to allow for photos to be created, fetched, listed and liked. Under the `src/photo.module` folder, create a new file named `photo-controller.ts` and add the following code.

```typescript
import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  UseGuards,
  Req,
  Get, Param, NotFoundException, Res
} from '@nestjs/common';
import { ApiImplicitFile, ApiConsumes, ApiResponse } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import crypto from 'crypto';
import { getManager } from 'typeorm';
import express from 'express';

import { PhotoModel } from './photo-model';
import { IsAuthenticatedGuard } from '../auth.module/is-authenticated-guard';

export interface IFileObject {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  buffer: Buffer;
  size: number;
}

@Controller('photos')
export default class PhotoController {
  @UseInterceptors(FileInterceptor('photo'))
  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, type: PhotoModel })
  @ApiImplicitFile({ name: 'photo', required: true, description: 'A photo to be posted' })
  @UseGuards(IsAuthenticatedGuard)
  async create(@UploadedFile() file: IFileObject, @Req() req) {
    const { buffer, originalname } = file;
    if (!buffer || !originalname) {
      throw new BadRequestException('File must have a name and content');
    }

    const photo = new PhotoModel();
    photo.base64Content = buffer.toString('base64');
    photo.name = originalname;
    photo.slug = crypto.randomBytes(16).toString('hex');
    photo.ownerId = req.user.id;
    const manager = getManager();
    return await manager.save(photo);
  }

  @ApiResponse({ status: 200 })
  @Get('download/:slug')
  async download(@Param('slug') slug: string, @Res() res: express.Response) {
    if (!slug) {
      throw new BadRequestException('Missing `slug` URL parameter');
    }

    const manager = getManager();

    const photo = await manager.findOne(PhotoModel, { where: { slug }, select: ['base64Content'] });
    if (!photo) {
      throw new NotFoundException('No photo with slug ' + slug);
    }

    res.write(Buffer.from(photo.base64Content, 'base64'));
    res.end();
  }

  @ApiResponse({ type: PhotoModel, status: 200, isArray: true })
  @Get()
  async findAll() {
    const manager = getManager();
    const photos = await manager.find(PhotoModel);
    return photos.map(photo => ({ ...photo, url: `http://localhost:3000/photos/download/${photo.slug}` }));
  }

  @ApiResponse({ status: 201 })
  @Post(':photoId/likes')
  @UseGuards(IsAuthenticatedGuard)
  async createLike(@Param('photoId') photoId: string, @Req() req: express.Request) {
    const manager = getManager();
    const photo = await manager.findOne(PhotoModel, { where: { id: photoId } });
    if (!photo) {
      throw new NotFoundException('Photo with id ' + photoId + ' does not exist');
    }
    const likedBy = await photo.likedBy;
    likedBy.push(req['user']);
    await manager.save(photo);

    return { liked: true };
  }

  @ApiResponse({ type: Number, status: 200, isArray: true })
  @Get(':photoId/likes')
  async listLikes(@Param('photoId') photoId: string) {
    const manager = getManager();
    const photo = await manager.findOne(PhotoModel, { where: { id: photoId } });
    if (!photo) {
      throw new NotFoundException('Photo with id ' + photoId + ' does not exist');
    }
    return (await photo.likedBy).map(user => user.id);
  }
}
```

This file provides the bulk of Instamiligram's functions, so it might be prudent to go through it method by method.

### PhotoController.create

"Create" method takes a file stream from the client and serializes it into the Postgres database's Photo table. A slug is generated and used as a reference to allow for image downloads later. Although a photograph's `id` field could be used for this, a slug allows users to download a photograph only if its slug is known.

All the decorators used for this method might seem a bit confusing at first, but if you read them one by one, you should see they provide the behaviour you'd expect from an endpoint for image upload:

- @UseInterceptors(FileInterceptor('photo')) => expect and parse the photo data under the `photo` key of the `form-data`
- @Post() = uses `HTTP POST` method
- @ApiConsumes('multipart/form-data') => endpoint expects body in `multipart/form-data` format
- @ApiResponse({ status: 201, type: PhotoModel }) => documentation feature, the endpoint returns the newly created `PhotoModel`
- @ApiImplicitFile({ name: 'photo', required: true, description: 'A photo to be posted' }) => documentation feature, endpoint accepts a file under the `photo` key
- @UseGuards(IsAuthenticatedGuard) => this endpoint can only be executed if request is authenticated (by session id in cookie in this app's case)

### PhotoController.download

The method locates a photo in the database by its slug and then returns the photo's binary content to the client.

### PhotoController.findAll

Returns info about all the photographs uploaded to `Instamiligram`.

### PhotoController.createLike

Likes a photograph on behalf of the currently authenticated user.

### PhotoController.listLikes

Returns a list of ids of all users who liked a given photo.

Again, refreshing `http://localhost:3000` should cause all these newly created endpoints to appear. You're welcome to try them all by pressing each `Try it out` button.

## Learn More About Node.js, Postgres, and Okta

Thanks for following along with this blog post! If you've made it this far, you have successfully:

- Set up a virtual Postgres environment
- Bootstrapped a TypeScript NestJS application
- Implemented a simplified Instagram-style REST API
- Used Okta for authenticating API requests

The source code for the example project is available on [GitHub](https://github.com/oktadeveloper/okta-nestjs-postgres-example).

If you liked this post, you may be interested in these other posts on Node.js.

- [Build a Node.js API with TypeScript](/blog/2019/05/07/nodejs-typescript-api)
- [Use TypeScript to Build a Node API with Express](/blog/2018/11/15/node-express-typescript)
- [Build a NodeJS App with TypeScript](/blog/2019/09/19/nodejs-typescript)
- [Build a REST API with Node and Postgres](/blog/2019/03/27/build-rest-api-with-node-and-postgres)

If you have any questions about this post, please add a comment below. For more awesome content, follow [@oktadev](https://twitter.com/oktadev) on Twitter, like us [on Facebook](https://www.facebook.com/oktadevelopers/), or subscribe to [our YouTube channel](https://www.youtube.com/c/oktadev).
