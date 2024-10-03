---
layout: blog_post
title: "OpenFGA for an Express + Typescript Node.js API"
author: jimena-garbarino
by: contractor
communities: [security,javascript,]
description: "How to add Fine-Grained Authorization (FGA) to an Express + Typescript API using the OpenFGA Javascript and Node.js SDK."
tags: [javascript, nodejs, expressjs, openfga]
tweets:
- ""
- ""
- ""
image:
type: awareness
---

OpenFGA is an open-source Relationship Based Access Control (ReBAC) system designed by Okta for developers, and adopted by the Cloud Native Computing Foundation (CNCF). It offers scalability and flexibility, and it also supports the implementation of RBAC and ABAC authorization models, moving authorization logic outside application code, making it simpler to evolve authorization policies as complexity grows. In this guide, you will learn how to secure a Node.js API with Auth0 and integrate Fine-Grained Authorization (FGA) into document operations with OpenFGA.

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
cd start
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

Add error handling to `error.middleware.ts`:

```typescript
import { Request, Response, NextFunction } from "express";
import {
  InvalidTokenError,
  UnauthorizedError,
  InsufficientScopeError,
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
AUTH0_AUDIENCE=<your-auth0-domain>
AUTH0_DOMAIN=dev-avup2laz.us.auth0.com
```

Run the API with:

```shell
npm install && npm run dev
```

Obtain a test access token with Auth0 CLI:

```shell
auth0 test token -a https://document-api.okta.com -s openid
```

Set the access token in an environment var:

```shell
ACCESS_TOKEN=<access-token>
```

Create a document with cURL:

```shell
curl -i -X POST \
  -H "Authorization:Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "planning.doc"}' \
  http://localhost:8080/api/documents
```

The output should look like:

```json
```

Retrieve all documents:

```shell
curl -i -H "Authorization: Bearer $ACCESS_TOKEN" localhost:8080/api/documents
```

The output should look like:

```json
```

Verify access is denied if the access token is not present:

```shell
curl -i localhost:8080/api/documents
```

## Add Fine-Grained Authorization (FGA) with OpenFGA




## Learn more about Node.js and Fine-Grained Authorization

In this post you learned about OpenFGA integration to a Node.js API using the [OpenFGA Javascript and Node.js SDK](https://github.com/openfga/js-sdk). I hope you enjoyed this quick tutorial, and if you'd rather skip the step-by-step and prefer running a sample application, follow the [README](https://github.com/oktadev/express-javascript-fga) instructions in the same repository.

Also, if you liked this post, you might enjoy these related posts:

- [Secure Node.js Applications from Supply Chain Attacks](https://auth0.com/blog/secure-nodejs-applications-from-supply-chain-attacks/)
- [Authorization in your Next.js application using Okta FGA](https://auth0.com/blog/fine-grained-access-control-with-okta-fga-nextjs/)

Check out the Javascript resources in our Developer Center:

- [Express.js Code Samples: API Security in Action](https://developer.auth0.com/resources/code-samples/api/express)
- [Express.js Code Sample: API Role-Based Access Control](https://developer.auth0.com/resources/code-samples/api/express/basic-role-based-access-control)
- [Node (Express) API: Authorization](https://auth0.com/docs/quickstart/backend/nodejs)

Please follow us on Twitter [@oktadev](https://twitter.com/oktadev) and subscribe to our [YouTube channel](https://www.youtube.com/oktadev) for more Spring Boot and microservices knowledge.

You can also sign up for our [developer newsletter](https://a0.to/nl-signup/java) to stay updated on everything Identity and Security.
