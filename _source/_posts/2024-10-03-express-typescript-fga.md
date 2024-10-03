---
layout: blog_post
title: "OpenFGA for an Express + Typescript Node.js API"
author: jimena-garbarino
by: contractor
communities: [security,javascript]
description: "How to add Fine-Grained Authorization (FGA) to an Express + Typescript API using the OpenFGA Javascript and Node.js SDK."
tags: [javascript, nodejs, expressjs, openfga]
tweets:
- ""
- ""
- ""
image:
type: awareness
---

OpenFGA is an open-source Relationship-Based Access Control (ReBAC) system designed by Okta for developers, and adopted by the Cloud Native Computing Foundation (CNCF). It offers scalability and flexibility, and it also supports the implementation of RBAC and ABAC authorization models, moving authorization logic outside application code, making it simpler to evolve authorization policies as complexity grows. In this guide, you will learn how to secure a Node.js API with Auth0 and integrate Fine-Grained Authorization (FGA) into document operations with OpenFGA.

> **This tutorial was created with the following tools and services**:
> - [Node 20.10.0](https://jdk.java.net/java-se-ri/21)
> - [Auth0 account](https://auth0.com/signup)
> - [Auth0 CLI 1.4.0](https://github.com/auth0/auth0-cli#installation)
> - [Docker 24.0.7](https://docs.docker.com/desktop/)
> - [FGA CLI v0.2.7](https://openfga.dev/docs/getting-started/install-sdk)


## Add API Authorization

Auth0 is an easy to implement, adaptable authentication and authorization platform, and you can implement authentication for any application in just minutes. With Auth0 CLI you can create access tokens and use them for identifying the user when making requests to the document API. Sign up at [Auth0](https://auth0.com/signup) and install the [Auth0 CLI](https://github.com/auth0/auth0-cli). Then in the command line run:

```shell
auth0 login
```

The command output will display a device confirmation code and open a browser session to activate the device.

You don't need to create a client application at Auth0 for your API if not using opaque tokens. But you must register the API within your tenant, you can do it using Auth0 CLI:

```shell
auth0 apis create \
  --name "Document API" \
  --identifier https://document-api.okta.com \
  --offline-access=false
```

Leave scopes empty and default values when prompted.

Checkout the document API repository, which already implements basic request handling:

```shell
git clone https://github.com/indiepopart/express-typescript-fga.git
```

The repository contains two project folders, `start` and `final`. The bare bones document API is a Node.js project in the `start` folder, open it with your favorite IDE. Add the `express-oauth2-jwt-bearer` dependency:

```shell
cd express-typescript-fga/start
npm install express-oauth2-jwt-bearer
```

Create the middleware for token validation in the file `src/middleware/auth0.middleware.ts`, with the following content:

```typescript
// src/middleware/auth0.middleware.ts
import * as dotenv from "dotenv";
import { auth } from "express-oauth2-jwt-bearer";

dotenv.config();

export const validateAccessToken = auth({
  issuerBaseURL: `https://${process.env.AUTH0_DOMAIN}`,
  audience: process.env.AUTH0_AUDIENCE,
});
```

Call `validateAccessToken` from the router, for example:

```typescript
// src/documents/document.router.ts
...
documentRouter.get("/", validateAccessToken, async (req, res, next) => {
  try {
    const documents = await getAllDocuments();
    res.status(200).json(documents);
  } catch (error) {
    next(error);
  }
});
...
```

Add error handling to `error.middleware.ts`, the final code should look like this:

```typescript
import { Request, Response, NextFunction } from "express";
import {
  InvalidTokenError,
  UnauthorizedError,
} from "express-oauth2-jwt-bearer";

import mongoose from "mongoose";

export const errorHandler = (
  error: any,
  request: Request,
  response: Response,
  next: NextFunction
) => {
  console.log(error);

  if (error instanceof InvalidTokenError) {
    const message = "Bad credentials";

    response.status(error.status).json({ message });

    return;
  }

  if (error instanceof UnauthorizedError) {
    const message = "Requires authentication";

    response.status(error.status).json({ message });

    return;
  }

  if (error instanceof mongoose.Error.ValidationError) {
    const message = "Bad Request";

    response.status(400).json({ message });

    return;
  }

  if (error instanceof mongoose.Error.CastError) {
    console.log("handle ValidationError");
    const message = "Bad Request";

    response.status(400).json({ message });

    return;
  }

  const status = 500;
  const message = "Internal Server Error";

  response.status(status).json({ message });
};
```

Copy `.env.example` to `.env` and add the properties:

```shell
AUTH0_AUDIENCE=https://document-api.okta.com
AUTH0_DOMAIN=<your-auth0-domain>
```

Run the MongoDB database with:

```shell
docker compose up mongodb mongo-express
```

Run the API with:

```shell
npm install && npm run dev
```

Obtain a test access token with Auth0 CLI:

```shell
auth0 test token -a https://document-api.okta.com -s openid
```
Choose an available `[Generic]` client when prompted. Set the access token in an environment var:

```shell
ACCESS_TOKEN=<access-token>
```

Create a document with cURL:

```shell
curl -i -X POST \
  -H "Authorization:Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "planning.doc"}' \
  http://localhost:6060/api/documents
```

The output should look like:

```json
{
  "name": "planning.doc",
  "_id": "66feb9c1f106b84c28644d3e",
  "__v": 0
}
```

Retrieve all documents:

```shell
curl -i -H "Authorization: Bearer $ACCESS_TOKEN" localhost:6060/api/documents
```

The output should look like:

```json
[
  {
    "_id": "66feb9c1f106b84c28644d3e",
    "name": "planning.doc",
    "__v": 0
  }
]
```

Verify access is denied if the access token is not present:

```shell
curl -i localhost:6060/api/documents
```

The response code should be `401 Unauthorized`.

## Initialize an authorization model in OpenFGA

At a high level, an authorization model is defined by indicating user types, object types, and relationships between them. As we are not going to deep-dive on [ReBAC](https://openfga.dev/docs/authorization-concepts#what-is-relationship-based-access-control) in this guide, you can refer to OpenFGA documentation for learning about modeling concepts. Under the [Advanced use-cases](https://openfga.dev/docs/modeling/advanced) section in the doc, there is a simplified authorization model for a [Google Drive](https://openfga.dev/docs/modeling/advanced/gdrive) application ready to test. Prepare the model for import to the OpenFGA service, creating the file `auth-model.fga` in the directory `start/openfga`:

```fga
model
  schema 1.1

type user

type document
  relations
    define owner: [user, domain#member] or owner from parent
    define writer: [user, domain#member] or owner or writer from parent
    define commenter: [user, domain#member] or writer or commenter from parent
    define viewer: [user, user:*, domain#member] or commenter or viewer from parent
    define parent: [document]

type domain
  relations
    define member: [user]
```

For saving the authorization model in an OpenFGA store, it must be transformed to JSON format with FGA CLI:

```shell
fga model transform --file=auth-model.fga > auth-model.json
```

Run the OpenFGA service with:

```shell
docker compose up openfga
```

Create a store:

 ```shell
 export FGA_API_URL=http://localhost:8090
 fga store create --name "documents-fga"
 ```

 Set the store id in the output as an env var, and write the model:

 ```shell
 export FGA_STORE_ID=<store-id>
 fga model write --store-id=${FGA_STORE_ID} --file auth-model.json
 ```

 Set the model ID in the output as an env var:

 ```shell
 export FGA_MODEL_ID=<model-id>
 ```

## Add Fine-Grained Authorization (FGA) with OpenFGA

First, add the following vars to the `.env` file:

```shell
FGA_API_URL=http://localhost:8090
FGA_STORE_ID=<store-id>
FGA_MODEL_ID=<model-id>
```

Create a middleware for permission checks using OpenFGA Node.js SDK. Install the dependency:

```shell
npm install @openfga/sdk
```

Add the file `src/middleware/openfga.middleware.ts`:

```typescript
// src/middleware/openfga.middleware.ts
import * as dotenv from "dotenv";
import { NextFunction, Request, Response } from "express";
import { ClientCheckRequest, OpenFgaClient } from "@openfga/sdk";

dotenv.config();

export class PermissionDenied extends Error {
  constructor(message: string) {
    super(message);
  }
}

const fgaClient = new OpenFgaClient({
  apiUrl: process.env.FGA_API_URL, // required
  storeId: process.env.FGA_STORE_ID, // not needed when calling `CreateStore` or `ListStores`
  authorizationModelId: process.env.FGA_MODEL_ID, // Optional, can be overridden per request
});

export const forView = (req: Request): ClientCheckRequest => {
  const userId = req.auth?.payload.sub;
  const tuple = {
    user: `user:${userId}`,
    object: `document:${req.params.id}`,
    relation: "viewer",
  };
  return tuple;
};

export const forUpdate = (req: Request): ClientCheckRequest => {
  const userId = req.auth?.payload.sub;
  const tuple = {
    user: `user:${userId}`,
    object: `document:${req.params.id}`,
    relation: "writer",
  };
  return tuple;
};

export const forDelete = (req: Request): ClientCheckRequest => {
  const userId = req.auth?.payload.sub;
  const tuple = {
    user: `user:${userId}`,
    object: `document:${req.params.id}`,
    relation: "owner",
  };
  return tuple;
};

export const forCreate = (req: Request): ClientCheckRequest | null => {
  const userId = req.auth?.payload.sub;
  const parentId = req.body.parentId;
  const tuple = parentId
    ? {
        user: `user:${userId}`,
        object: `document:${parentId}`,
        relation: "writer",
      }
    : null;
  return tuple;
};

export const checkPermissions = (
  createTuple: (req: Request) => ClientCheckRequest | null
) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tuple = createTuple(req);

      console.log("tuple", tuple);

      if (!tuple) {
        next();
        return;
      }
      const result = await fgaClient.check(tuple);

      if (!result.allowed) {
        next(new PermissionDenied("Permission denied"));
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
```

Call the middleware from the document router:

```typescript
// src/documents/document.router.ts

documentRouter.post(
  "/",
  validateAccessToken,
  checkPermissions(forCreate),
  async (req, res, next) => {
    try {
      const document = await saveDocument(req.body);
      res.status(200).json(document);
    } catch (error) {
      next(error);
    }
  }
);

documentRouter.put(
  "/:id",
  validateAccessToken,
  checkPermissions(forUpdate),
  async (req, res, next) => {
    try {
      const document = await updateDocument(req.params.id, req.body);
      if (!document) {
        res.status(404).json({ message: "Document not found" });
        return;
      }
      res.status(200).json(document);
    } catch (error) {
      next(error);
    }
  }
);

documentRouter.delete(
  "/:id",
  validateAccessToken,
  checkPermissions(forDelete),
  async (req, res, next) => {
    try {
      const document = await deleteDocumentById(req.params.id);
      if (!document) {
        res.status(404).json({ message: "Document not found" });
        return;
      }
      res.status(200).send();
    } catch (error) {
      next(error);
    }
  }
);

documentRouter.get(
  "/:id",
  validateAccessToken,
  checkPermissions(forView),
  async (req, res, next) => {
    try {
      const document = await findDocumentById(req.params.id);
      if (!document) {
        res.status(404).json({ message: "Document not found" });
        return;
      }
      res.status(200).json(document);
    } catch (error) {
      next(error);
    }
  }
```

Update the error handling middleware:

```typescript
// src/middleware/error.middleware.ts
if (error instanceof PermissionDenied) {
  const message = "Permission denied";

  response.status(403).json({ message });

  return;
}
```

## Send requests to the Express API

Run the API and try a read operation:

```shell
curl -i -H "Authorization: Bearer $ACCESS_TOKEN" localhost:6060/api/documents
```

```shell
curl -i -H "Authorization: Bearer $ACCESS_TOKEN" localhost:6060/api/documents/<document-id>
```

It should fail with the following `403 Forbidden` response:

```json
{
  "message": "Permission denied"
}
```

Go to https://jwt.io/ and decode the Auth0 access token, and copy the `sub` claim value to use it as UserIDº.

Then grant read access to the document with FGA CLI:

```shell
fga tuple write --store-id=${FGA_STORE_ID} --model-id=$FGA_MODEL_ID 'user:<sub-claim>' viewer document:<document-id>
```

You can add other relationships for the user and document like `owner`, `writer`. Retry the read operation and it should succeed with `200 OK`.

## Learn more about Node.js and Fine-Grained Authorization

In this post, you learned about OpenFGA integration to a Node.js API using the [OpenFGA Javascript and Node.js SDK](https://github.com/openfga/js-sdk). I hope you enjoyed this quick tutorial, and if you'd rather skip the step-by-step and prefer running a sample application, follow the [README](https://github.com/indiepopart/express-typescript-fga) instructions in the same repository.

Also, if you liked this post, you might enjoy these related posts:

- [Secure Node.js Applications from Supply Chain Attacks](https://auth0.com/blog/secure-nodejs-applications-from-supply-chain-attacks/)
- [Authorization in your Next.js application using Okta FGA](https://auth0.com/blog/fine-grained-access-control-with-okta-fga-nextjs/)

Check out the Javascript resources in our Developer Center:

- [Express.js Code Samples: API Security in Action](https://developer.auth0.com/resources/code-samples/api/express)
- [Express.js Code Sample: API Role-Based Access Control](https://developer.auth0.com/resources/code-samples/api/express/basic-role-based-access-control)
- [Node (Express) API: Authorization](https://auth0.com/docs/quickstart/backend/nodejs)

Please follow us on Twitter [@oktadev](https://twitter.com/oktadev) and subscribe to our [YouTube channel](https://www.youtube.com/oktadev) for more Node.js and microservices knowledge.

You can also sign up for our [developer newsletter](https://a0.to/nl-signup/java) to stay updated on everything Identity and Security.
