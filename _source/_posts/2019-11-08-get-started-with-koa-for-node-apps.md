---
disqus_thread_id: 7710637876
discourse_topic_id: 17165
discourse_comment_url: https://devforum.okta.com/t/17165
layout: blog_post
title: "Get Started with Koa.js for Node Applications"
author: ivo-katunaric
by: contractor
communities: [javascript]
description: "Koa.js is a modern server framework from the creators of Express. Learn how to get started with Koa.js by building a fun facial recognition app!"
tags: [nodejs, node, koa, api, authentication, machine-learning]
tweets:
- "Learn how to build a facial recognition Node.js app with Koa.js! #nodejs #koa"
- "Learn how to build a fun facial recognition web app using Node.js and Koa!"
- "Koa.js is a modern server framework from the creators of Express. Learn how to get started with Koa.js by building a fun facial recognition app!"
image: blog/featured/okta-node-tile-books-mouse.jpg
type: conversion
---

Ever since JavaScript made its giant leap from frontend to backend more than 10 years ago, Express has been the go-to library for writing server-side javascript and  virtually synonymous with Node.js. It was (and in many aspects it still is) a modern and simple approach backend APIs. Declarative tree-like structure of routes, native support for middleware, asynchronous request processing and a miniature memory footprint all make Express very robust for a backend.

As good as it might be, Express does show some signs of old age:

- Absence of native support for promises within middleware
- Strong coupling of the library core with the router logic
- Error-prone (or more like request hanging prone) way of writing middleware
- Inclusion of features such as templating, sending files and JSONP support in the library's core

Even though Express and Koa do almost the same thing and share the same author, they have  different approaches to how middleware and routing are handled.  You can think of Koa.js as a new and improved Express.

## Build a Sample App with Koa.js

To get better acquainted with Koa, you'll make a web app called FamiliarFaces. It will allow users to upload photos of faces and then recognize those faces on other photos. It might seem hard at first glance, but actually, all you need is:

- Node.js version 8+
- TypeScript version 2+
- Okta, a free API service that allows you to create users, handle user authentication, authorization, multi-factor authentication and more
- Passport, an extensible authentication middleware for Node.js
- `face-api.js`, a fascinating library for facial recognition written in JavaScript for both browser and Node.js
- `handlebars`, a rudimentary templating engine for Node.js

## Initiate a Node.js Project

With Node.js installed on your machine, open a terminal and create a new Node.js project:

```sh
mkdir familiar-faces
cd familiar-faces
npm init -y
npm install @koa/multer@^2.0.0 canvas@^2.6.0 dotenv@^8.1.0 face-api.js@^0.21.0 handlebars@^4.4.3 koa@^2.8.2 koa-bodyparser@^4.2.1 koa-passport@^4.1.3 koa-router@^7.4.0 koa-session@^5.12.3 multer@^1.4.2 passport-openidconnect@0.0.2 ts-node@^8.4.1 typescript@^3.6.3 glob@^7.1.4
npx ts-typie
```

These commands will install all the needed project dependencies. The last one adds TypeScript typings for libraries with non-standard typings.

To specify the correct settings for the transpiler, create a file named `tsconfig.json`:

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "target": "es6",
    "moduleResolution": "node",
    "sourceMap": true
  }
}
```

## Create the Koa.js Server

To integrate the server with the TypeScript transpiler, you have to create a `server.js` file. It will act as the entry point into the app:

```javascript
require('ts-node/register');
require('./src/server');
```

As you can see, this file includes `src/server` module. That's the last one needed to run the server. Since we have registered TypeScript, the file `src/server.ts` can be written in TypeScript.

```typescript
import 'dotenv/config';

import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import path from 'path';
import glob from 'glob';

const app = new Koa<any>();
app.use(bodyParser());

const controllersRegistrators =
  glob.sync(path.join(__dirname, '**/*-controller.ts'))
    .map(controllerPath => require(controllerPath))
    .map(controller => controller.default);

for (const registerController of controllersRegistrators) {
  registerController(app);
}

app.listen(8080);
console.log('listening on port 8080');
```

You can now type command `npm start` to start the server.

An even better approach would be to force the server to restart on each change. To allow for this, kill the server and run it with `nodemon` command instead:

```sh
npx nodemon server.js --ext ts
```

When started, the server loads all controllers from the projects and connects them with your Koa instance. Because there are currently no controllers in the project, every endpoint will return `404 Not Found`. To confirm this, direct your browser to `http://localhost:8080`.
 
You can change this behavior by adding a controller!

## The First Controller

Start by creating a view to generate HTML for the client. Create a new file named `src/dashboard/dashboard.handlebars`. This handlebars template contains some expressions to render data dynamically.

{% raw %}
```handlebars
<!DOCTYPE html>
<html lang="en">
<head>
  <title>FamiliarFace</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.4.0/css/bootstrap.min.css">
  <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.4.1/jquery.min.js"></script>
  <script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.4.0/js/bootstrap.min.js"></script>
  <style>
    p {
      margin: 0;
    }
    h1 {
      margin: 0 0 20px 0;
    }
    .btn-delete {
      position: absolute;
      top: 8px;
      right: 23px;
    }
    .p-center {
      text-align: center;
    }
    .file-input {
      display: flex !important;
    }
    .people-display {
      padding-top: 7px;
      display: flex;
      flex-wrap: wrap;
    }
    .people-badge {
      border-radius: 13px;
      margin-right: 8px;
      padding: 5px 10px;
      background-color: #5bc0de;
      color: white;
      font-weight: bold;
      border-color: #46b8da;
    }
    .people-icon {
      margin-right: 5px;
      color: white;
    }
  </style>
</head>
<body>
  <nav class="navbar navbar-inverse">
    <div class="container">
      <div class="navbar-header">
        <a class="navbar-brand" href="/">FamiliarFace</a>
      </div>
      <div class="navbar-header">
        <form action="/logout" method="post">
          <button type="submit" class="navbar-brand btn btn-link btn-logout">Logout</button>
        </form>
      </div>
    </div>
  </nav>
  <div class="container">
    {{#if images}}
      <h1>Familiar Faces</h1>
    {{/if}}
    <div class="row">
    {{#each images}}
      <div class="col-sm-3">
        <div class="thumbnail">
          <img src="{{this.url}}" style="width:100%" />
          <div class="caption">
            <p class="p-center">{{this.imageName}}</p>
          </div>
            <form action="/images/actions/delete/{{this.imageName}}" method="post">
              <button type="submit" class="btn btn-danger btn-delete" aria-label="Delete">
              <span class="glyphicon glyphicon-trash" aria-hidden="true" />
            </form>
          </button>
        </div>
      </div>
    {{/each}}
    </div>
    <h1>Add a Person</h1>
    <div class="panel panel-default">
      <div class="panel-body">
        <form class="form-horizontal" action="/images" method="post" enctype="multipart/form-data">
          <div class="form-group">
            <label for="file" class="control-label col-sm-2">Image:</label>
            <div class="col-sm-10">
              <input type="file" class="form-control file-input" id="file" name="file" required>
            </div>
          </div>
          <div class="form-group">
            <label for="name" class="control-label col-sm-2">Full name:</label>
            <div class="col-sm-10">
              <input type="text" class="form-control" id="name" name="name" required>
            </div>
          </div>
          <div class="form-group">
            <div class="col-sm-offset-2 col-sm-10">
              <button type="submit" class="btn btn-primary">Add to FamiliarFace</button>
            </div>
          </div>
        </form>
      </div>
    </div>
    <h1>Recognize People</h1>
    <div class="panel panel-default">
      <div class="panel-body">
        <form class="form-horizontal" action="/recognition" enctype="multipart/form-data" method="post">
          <div class="form-group">
            <label for="recognizeFile" class="control-label col-sm-2">Image:</label>
            <div class="col-sm-10">
              <input type="file" class="form-control file-input" id="recognizeFile" name="file" required>
            </div>
          </div>
            {{#if recognitionComplete}}
              <div class="form-group">
                <label for="recognizeFile" class="control-label col-sm-2">Preview:</label>
                <div class="col-sm-10">
                  <img src="/recognition/last-processed-image" style="max-width: 100%; max-height: 450px" />
                </div>
              </div>
            {{/if}}
          <div class="form-group">
            <label class="control-label col-sm-2">People:</label>
            <div class="col-sm-10 people-display">
              {{#each matchingNames}}
                <div class="people-badge">
                  <span class="glyphicon glyphicon-user people-icon"></span> {{this}}
                </div>
              {{/each}}
              {{#unless matchingNames}}
                {{#if recognitionComplete}}
                  <i>No one was recognized on the picture :(</i>
                {{else}}
                  <i>Upload image to recognize people in it!</i>
                {{/if}}
              {{/unless}}
            </div>
          </div>
          <div class="form-group">
            <div class="col-sm-offset-2 col-sm-10">
              <button type="submit" class="btn btn-primary">Check for Familiar Faces</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>
</body>
</html>
```
{% endraw %}

Next, you'll add the controller to render the handlebars template. Create a new file named `src/dashboard/dashboard-controller.ts` and add the following code.

```typescript
import Router from 'koa-router';
import path from 'path';
import handlebars from 'handlebars';
import fs from 'fs';

import {getUsersImagesData} from '../images/services';
import {ensureLoggedIn, getUserId} from '../auth/services';

const router = new Router();

router.use(ensureLoggedIn);

/*
  Opens a dashboard.handlebars template file and converts it to HTML string.
  That HTML is eventually sent to the browser as response body.
 */
export function renderDashboardView(context: object) {
  const viewAbsolutePath = path.join(__dirname, 'dashboard.handlebars');
  const renderView = handlebars.compile(fs.readFileSync(viewAbsolutePath, { encoding: 'utf8' }));

  return renderView(context);
}

router.get('/', ctx => {
  const images = getUsersImagesData(getUserId(ctx));
  ctx.body = renderDashboardView({ images });
});

export default app => app.use(router.routes());
```

You might notice that this file includes two not-yet-existing modules: `../images/services` and `../auth/services`. For now, provide just a mock implementation for both of them. This one for `src/images/services.ts`:

```typescript
export function getUsersImagesData(userId: string) {
  return [];
}
```

And this one for `src/auth/services.ts`:

```typescript
export async function ensureLoggedIn(ctx, next) {
  await next();
}

export function getUserId(ctx) {
  return '123321';
}
```

Return to your browser and refresh the URL `http://localhost:8080`. You should see the main dashboard with two forms: one to upload images of faces and the other one to recognize them.

To make those forms functional, you now need to implement those modules.

## Upload a photo

To handle photo uploads, you also need functions to save and load uploaded photos. Now provide a real implementation for the file `src/images/services.ts`:

```typescript
import fs from 'fs';
import path from 'path';

export function getUserUploadsDirectory(userId: string) {
  const userDirectory = path.join(__dirname, 'uploads', userId);
  fs.mkdirSync(userDirectory, { recursive: true });

  return userDirectory;
}

export function getImagePath(userId: string, imageName: string) {
  return path.join(getUserUploadsDirectory(userId), imageName);
}

export function getImageUrl(imageName: string) {
  return `/images/${imageName}`;
}

export function getUsersImagesNames(userId: string) {
  return fs.readdirSync(getUserUploadsDirectory(userId));
}

export function saveImage(userId: string, name: string, imageBuffer: Buffer) {
  fs.writeFileSync(getImagePath(userId, name), imageBuffer);
}

export function getUsersImagesData(userId: string) {
  return getUsersImagesNames(userId).map(imageName => ({
    imageName: imageName,
    url: getImageUrl(imageName),
    path: getImagePath(userId, imageName),
  }))
}

export function deleteImage(userId, imageName) {
  fs.unlinkSync(getImagePath(userId, imageName));
}
```

Nothing too special about these functions. They provide a directory for each user to upload and save photos. These will come in handy during the next step.

### Add a Controller for Image Handling

To make the server accept a photograph and then be able to return to the browser later, you need to make a new controller for image handling and save it to `src/images/image-controller.ts` file:

```typescript
import fs from 'fs';
import Router from 'koa-router';
import multer from '@koa/multer';
import {deleteImage, getImagePath, saveImage} from './services';
import {ensureLoggedIn, getUserId} from '../auth/services';

const router = new Router<any, any>();

router.use(ensureLoggedIn);

router.get('/images/:imageName', ctx => {
  const { imageName } = ctx.params;
  const userId = getUserId(ctx);

  ctx.set('Content-type', 'image/jpeg');
  ctx.body = fs.createReadStream(getImagePath(userId, imageName));
});

const uploadMiddleware = multer().fields([{ name: 'file', maxCount: 1 }]);

router.post('/images', uploadMiddleware, ctx => {
    const id = getUserId(ctx);
    const { name } = ctx.request.body;
    if (!name) {
      ctx.body = 'Missing name';
      return;
    }

    saveImage(id, name, ctx.files.file[0].buffer);
    ctx.redirect('/');
  }
);

router.post('/images/actions/delete/:imageName', ctx => {
  const { imageName } = ctx.params;
  const userId = getUserId(ctx);

  deleteImage(userId, imageName);
  ctx.redirect('/');
});

export default app => app.use(router.routes());
```

The image controller uses `multer` to process uploaded images and save them to the `images/uploads/` directory. It also provides endpoints for sending images to the browser and deleting them from the server.

You can now take a selfie and upload it to the server. Don't forget to input `Full Name` - this is how your face will be labeled when your face is recognized on other photos.

## Add a Facial Recognition with Face API

For facial recognition, you'll use the library `face-api.js`.  It compares an uploading photo with all the photos in the user's album. After comparison, the names of all the people found on the photo are returned from the function.  This functionality is implemented in `src/recognition/find-matches.ts` file:

```typescript
import canvas from 'canvas';
import * as faceapi from 'face-api.js';
import path from 'path';

const { Canvas, Image, ImageData } = canvas as any;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

const faceDetectionOptions = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 });
const weightsPath = path.join(__dirname, 'weights');

let configured = false;

async function configure() {
  if (configured) {
    return;
  }

  await Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromDisk(weightsPath),
    faceapi.nets.faceLandmark68Net.loadFromDisk(weightsPath),
    faceapi.nets.faceRecognitionNet.loadFromDisk(weightsPath)
  ]);

  configured = true;
}

async function loadFaceDescriptorsFromFile(imagePath: string) {
  await configure();
  const image = await canvas.loadImage(imagePath) as any;

  return faceapi
    .detectAllFaces(image, faceDetectionOptions)
    .withFaceLandmarks()
    .withFaceDescriptors();
}

export async function findMatches(knownFacesPaths: string[], unknownFacePath: string) {
  const unknownDescriptors = await loadFaceDescriptorsFromFile(unknownFacePath);

  if (unknownDescriptors.length === 0) {
    return [];
  }

  const facesMatchers = unknownDescriptors.map(descriptor => new faceapi.FaceMatcher(descriptor.descriptor));

  const matchesIndices = new Array<number>();

  for (const [index, knownFacePath] of knownFacesPaths.entries()) {
    const knownDescriptors = await loadFaceDescriptorsFromFile(knownFacePath);
    if (knownDescriptors.length === 0) {
      continue;
    }
    for (const faceMatcher of facesMatchers) {
      const bestMatch = faceMatcher.findBestMatch(knownDescriptors[0].descriptor);
      if (bestMatch.label !== 'unknown') {
        matchesIndices.push(index)
      }
    }
  }

  return matchesIndices;
}
```

The most important part of the file is the `findMatches()` function, which returns a person's full name for each face recognized on the picture.

One important thing to note here is that the neural network used in this function must be trained on a huge number of faces to work correctly. To avoid that complex procedure, just download a `.tar.gz` file containing all the pre-trained data needed for facial recognition with this command:

```sh
curl -L https://github.com/ivo-katunaric/koa-okta-node/raw/master/weights.tar.gz | tar -xz
```

...or download the file and extract it manually into the root of the project.

## Expose the Facial Recognizer Through the Koa Server

Once implemented, the recognition logic needs an endpoint to be shown to the world. Do that by creating a new controller file: `src/recognition/recognition-controller.ts`:

```typescript
import Router from 'koa-router';
import multer from '@koa/multer';
import fs from 'fs';
import path from 'path';

import {getUsersImagesData} from '../images/services';
import {findMatches} from './find-matches';
import {ensureLoggedIn, getUserId} from '../auth/services';
import {renderDashboardView} from '../dashboard/dashboard-controller';

const uploadMiddleware = multer().fields([{ name: 'file', maxCount: 1 }]);

const router = new Router<any, any>();
router.use(ensureLoggedIn);

function uploadedImagePath(userId: string) {
  fs.mkdirSync(path.join(__dirname, 'last-uploaded'), { recursive: true });
  return path.join(__dirname, 'last-uploaded', userId);
}

router.post('/recognition', uploadMiddleware, async ctx => {
  const id = getUserId(ctx);

  fs.writeFileSync(uploadedImagePath(id), ctx.files.file[0].buffer);

  const images = getUsersImagesData(id);

  const matchIndices = await findMatches(images.map(image => image.path), uploadedImagePath(id));
  const matchingNames = matchIndices.map(matchIndex => images[matchIndex].imageName);

  ctx.body = renderDashboardView({ images, matchingNames, recognitionComplete: true });
});

router.get('/recognition/last-processed-image', ctx => {
  const id = getUserId(ctx);

  ctx.set('Content-type', 'image/jpeg');
  ctx.body = fs.createReadStream(uploadedImagePath(id));
});

export default app => app.use(router.routes());
```

The most important thing in this file is the `/recognition` URL that accepts the image on the server-side and processes it using facial recognition logic. At the end of the controller function, the same dashboard view as `dashboard-controller.ts` is returned with slightly modified data. It now provides the list of people recognized on the uploaded picture to the `dashboard.handlebars`.

Try out this logic by adding a photo with the "Recognize People" form. Make sure that at least one person in the photo is also present in the "Familiar Faces" list of marked faces. Upon clicking the "Check for Familiar Faces" button, the app will display a list of people in the uploaded photo.

> **Note:** this might take anywhere from 10 to 30 seconds depending on the number of pictures and your computer's speed. This process can be drastically optimized by installing some native libraries, but that's beyond the scope of this article.

## Add OpenID Connect Authentication with Okta

Rolling your implementation of authentication can be frustrating, and it is much easier, faster and safer to delegate the authentication implementation to a 3rd party service such as Okta.  Okta is an API service that allows you to create users, handle user authentication and authorization, etc. By using Okta, you avoid writing most of the authentication/authorization/user management logic.

To implement Okta, you'll need to create a [forever-free developer account](https://developer.okta.com/signup/).

- Click Applications in the menu
- Click **Add Application**
- Click **Web** and then click **Next**

On the Application Settings screen, name your application "familiar-faces" and copy in the following app settings:

- **Base URIs**: http://localhost:8080
- **Login redirect URIs**: http://localhost:8080/authorization-code/callback

Click **Done** to create the application. Then, click the **Edit** button and add in the following additional application settings:

- **Logout redirect URIs**: http://localhost:8080/logout/callback

You can add users to your app by logging into Okta and clicking on `Users -> People -> Add Person`.

### Add Okta Credentials to the Server

Now your Okta app has been created, scroll down and take a look at the Client Credentials listed below. You need this information to integrate your web app with Okta. These settings (your Client ID and Client secret) are your application's OpenID Connect credentials.

Create a file named `.env` in the root directory of your project and copy in the following (be sure to substitute in the proper values where appropriate).

```sh
OKTA_DOMAIN={{ OKTA_DOMAIN }} # this is the hostname part of the URL of the Okta's dashboard but without the "-admin" part
CLIENT_ID={{ CLIENT_ID }}
CLIENT_SECRET={{ CLIENT_SECRET }}
APP_SECRET=alongrandomstring # this is not copied from Okta, you can put a random string here
```

## Integrate Koa with Okta through Passport

Remember those dummy functions in the `auth` directory? Now it's time to implement them properly.

We will delegate all the authentication logic to Passport, which will interface with Okta's authentication service through OIDC. All that remains for you is to initialize Passport with your credentials from the previous step and start the server.

Implement a function to interface Passport with Koa to guard protected routes and extract user id from the request context by updating the `src/auth/services.ts` file:

```typescript
import Koa from 'koa';
import passport from 'koa-passport';
import session from 'koa-session';

const { APP_SECRET } = process.env;

export function initiateAuth(app: Koa) {
  app.keys = [APP_SECRET];
  app.use(session({}, app));

  app.use(passport.initialize());
  app.use(passport.session());
}

export async function ensureLoggedIn(ctx, next) {
  if (ctx.isAuthenticated()) {
    await next();
  } else {
    ctx.redirect('/login');
  }
}

export function getUserId(ctx) {
  return ctx.state.user.id;
}
```

Finally, initialize Passport itself and add a few endpoints to allow it to accept an authentication session from Okta. This can be done in file `src/auth/auth-controller.ts`:

```typescript
import Router from 'koa-router';
import passport from 'koa-passport';
import { Strategy as OidcStrategy } from 'passport-openidconnect';
import {initiateAuth} from "./services";

const { OKTA_DOMAIN, CLIENT_ID, CLIENT_SECRET } = process.env;

passport.use('oidc', new OidcStrategy({
  issuer: `https://${OKTA_DOMAIN}/oauth2/default`,
  authorizationURL: `https://${OKTA_DOMAIN}/oauth2/default/v1/authorize`,
  tokenURL: `https://${OKTA_DOMAIN}/oauth2/default/v1/token`,
  userInfoURL: `https://${OKTA_DOMAIN}/oauth2/default/v1/userinfo`,
  clientID: CLIENT_ID,
  clientSecret: CLIENT_SECRET,
  callbackURL: 'http://localhost:8080/authorization-code/callback',
  scope: 'openid profile'
}, (issuer, sub, profile, accessToken, refreshToken, done) => {
  return done(null, profile);
}));

passport.serializeUser((user, next) => {
  next(null, user);
});

passport.deserializeUser((obj, next) => {
  next(null, obj);
});

const router = new Router<any, any>();

router.get('/login', passport.authenticate('oidc'));

router.get('/authorization-code/callback',
  passport.authenticate('oidc', { failureRedirect: '/error' }),
  ctx => {
    ctx.redirect('/');
  }
);

router.post('/logout', async ctx => {
  await ctx.logout();
  ctx.redirect('/');
});

export default app => {
  initiateAuth(app);
  app.use(router.routes());
}
```

## All done

Nicely done, you've just implemented quite a sophisticated piece of software today. You have utilized:

- Koa for setting up server and handling requests
- Handlebars for rendering the HTML page
- Okta and Passport for authentication
- `face-api.js` for facial recognition

## Learn more About Node Authentication with OIDC and OAuth

If you want to know how to use Passport + Express in combination with Okta, you can read about it [here](/blog/2018/05/18/node-authentication-with-passport-and-oidc).

Here are a few more posts you may be interested in exploring.

- [Painless Node.js Authentication](/blog/2019/10/03/painless-node-authentication)
- [Modern Token Authentication in Node Express](/blog/2019/02/14/modern-token-authentication-in-node-with-express)
- [Build a Secure Node.js App with SQL Server](/blog/2019/03/11/node-sql-server)

Like what you learned today? Follow us on [Twitter](https://twitter.com/oktadev), and subscribe to our [YouTube channel](https://www.youtube.com/channel/UC5AMiWqFVFxF1q9Ya1FuZ_Q) for more awesome content! 
