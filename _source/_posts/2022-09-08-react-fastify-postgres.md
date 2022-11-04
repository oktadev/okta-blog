---
layout: blog_post
title: ""
author: gabi-dombrowski
by: contractor
communities: [javascript]
description: ""
tags: []
tweets:
- ""
- ""
- ""
image:
type: conversion
---

INTRO

**Prerequisites**

{% include toc.md %}

## Setup the Postgresql Docker instance

We'll begin by setting up a Docker instance for our Postgresql database. If you haven't already, make sure to [install Docker](https://docs.docker.com/engine/install/).

1. In your root directory, create a file `docker-compose.yml`:
```text
services:
  postgres:
    container_name: "nasa-facilities"
    image: "postgres:latest"
    ports:
      - "5432:5432"
    environment:
      POSTGRES_USERNAME: "${POSTGRES_USERNAME}"
      POSTGRES_PASSWORD: "${POSTGRES_PASSWORD}"
      POSTGRES_DB: "${POSTGRES_DB}"
```

2. Create a `.env` file with the following:
```text
POSTGRES_USERNAME=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=nasa-facilities
```

3. To use the Docker configuration we created, run `docker compose up`.

4. There is a provided Postgreql data dump `./nasa-facilities_20200910.sql` in the example repo. You can import it by running the following:
```bash
docker exec -i nasa-facilities psql -U postgres nasa-facilities < ./nasa-facilities_20200910.sql
```

Your Docker instance is now created and running a Postgresql database with the restored data.

**NOTE:** The Postgresql dump included in the demo repo uses data from [https://www.kaggle.com/datasets/nasa/nasa-facilities](https://www.kaggle.com/datasets/nasa/nasa-facilities). 

## Setup Lerna for monorepo management 

[Lerna](****LINK***) is a tool used to manage multi-package repositories. In this project, it'll allow us to have a single repository where both our frontend and API packages live.

1. If you don't already have `npx` installed, you can run `npm i npx` to do so.

2. Add Lerna to your project by running the following in your project root directory:
```bash
npx lerna@latest init
```

3. Create the `frontend` and `api` packages:
```bash
cd packages
mkdir frontend api
```

**NOTE:** The team behind [Nx](https://nx.dev/) now manages Lerna, so if you'd like to integrate Nx's additional robust, scalable, and faster tooling for managing monorepos, check out their documentation on [integrating Nx and Lerna](https://nx.dev/recipes/adopting-nx/lerna-and-nx).

## Add needed Fastify backend and React frontend dependencies with Typescript

1. Add the required backend packages:
```bash
npx lerna add @fastify/postgres dotenv @okta/jwt-verifier pg packages/api
```

2. Add Typescript and needed types to the backend repository:
```bash
npx lerna add @types/pg typescript packages/api --dev
```

3. Next, let's create a basic React application using [Create React App](https://github.com/facebook/create-react-app). We'll use the Typescript template with it as well. In the created `packages/frontend` directory, run:
```bash
npx create-react-app okta-fastify-postgres --template typescript
```

**NOTE:** Our demo repository uses React `^18.2.0` and React Scripts `5.0.1`.

4. We'll add our needed frontend project dependencies with the following command:
```bash
npx lerna @okta/okta-auth-js @okta/okta-react packages/frontend
```

5. You can now run `npx lerna bootstrap` to install your package dependencies.

## Create the API backend app using Fastify

1. In `packages/api`, run:
```bash
npm init -y
npm init fastify
```

2. Update `packages/api/package.json` to allow the backend application to compile using Typescript:
```bash
{
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "start": "node index.js"
  }
}
```

3. Initialize a Typescript config file by running:
```bash
npx tsc --init
```

4. Create a `.env` file in `packages/api` with the following:
```text
CONNECTION_STRING=postgresql://postgres:postgres@localhost:5432/nasa-facilities
OKTA_ISSUER=https://{yourOktaDomain}/oauth2/default
OKTA_CLIENT_ID={yourOktaClientId}
OKTA_AUDIENCE="api://default"
```

5. Create an `index.ts` file in `packages/api` and add the backend application Fastify server code:

```bash
import fastifyPostgres from "@fastify/postgres";
import Fastify, { FastifyInstance, FastifyRequest } from "fastify";
import * as dotenv from "dotenv";

dotenv.config();

const fastify: FastifyInstance = Fastify({
  logger: {
    serializers: {
      res(reply) {
        return {
          statusCode: reply.statusCode,
        };
      },
      req(request) {
        return {
          method: request.method,
          url: request.url,
        };
      },
    },
  },
});

fastify.register(fastifyPostgres, {
  connectionString: process.env.CONNECTION_STRING,
});

const start = async () => {
  try {
    await fastify.listen({ port: 3000 });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();

```

6. Next, let's create our Fastify API routes in `packages/api/routes/facilities.ts`:

```bash
import { FastifyInstance } from "fastify";
import { FastifyReply, FastifyRequest } from "fastify";

interface IFacility {
  Center: string;
  Facility: string;
  Status: string;
  City: string;
  State: string;
  Visited: boolean;
  id: bigint;
}

async function facilitiesRoutes(fastify: FastifyInstance) {
  const client = await fastify.pg.connect();

  fastify.get(
    "/facilities",
    async (request: FastifyRequest, reply: FastifyReply) => {
      let facilities: IFacility[] = [];

      try {
        const { rows } = await client.query("SELECT * FROM facilities");
        if (rows.length == 0) throw new Error("No facilities found");

        facilities = rows;
        reply
          .code(200)
          .header("Content-Type", "application/json; charset=utf-8")
          .send([...facilities]);
      } catch (error) {
        const errorMessage = (error as Error).message;
        throw new Error(errorMessage);
      }
    }
  );

  fastify.patch(
    "/facilities/:id",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: bigint };
      const { visited } = request.body as { visited: boolean };

      const query = {
        text: `UPDATE public.facilities SET 
                "Visited" = COALESCE($1, "Visited")
                WHERE id = $2`,
        values: [visited, id],
      };

      try {
        await client.query(query);
        reply.code(204);
      } catch (error) {
        const errorMessage = (error as Error).message;
        throw new Error(errorMessage);
      }
    }
  );

  fastify.delete(
    "/facilities/:id",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id } = request.params as { id: bigint };

      const query = {
        text: `DELETE FROM public.facilities
                  WHERE id = $1 RETURNING *`,
        values: [id],
      };

      try {
        await client.query(query);
        reply.code(204);
      } catch (error) {
        const errorMessage = (error as Error).message;
        throw new Error(errorMessage);
      }
    }
  );
}

export default facilitiesRoutes;

```

7. To register these routes with our Fastify instance, add the following to `packages/api/index.ts`:
```bash
fastify.register(facilitiesRoutes);
```

8. Then we'll create a `packages/api/utils/jwt-verifier.ts` file with an utility that will verify the Okta ID tokens passed with API calls from the frontend:

```bash
import OktaJwtVerifier from "@okta/jwt-verifier";
import dotenv from "dotenv";
import { FastifyReply, FastifyRequest } from "fastify";

dotenv.config();

const oktaJwtVerifier = new OktaJwtVerifier({
  issuer: process.env.OKTA_ISSUER || "",
  clientId: process.env.OKTA_CLIENT_ID,
});

const audience = process.env.OKTA_AUDIENCE;

export const jwtVerifier = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const { authorization } = request.headers;

  request.log.info({ authorization });

  const [token] = authorization?.trim().split(" ") || "";
  request.log.info({ token });

  if (!authorization || !token) {
    reply.code(401).send();
  }

  try {
    const { claims } = await oktaJwtVerifier.verifyAccessToken(
      token,
      audience || ""
    );

    request.log.info({ claims });

    if (!claims) {
      reply.code(401).send();
    }
  } catch (err) {
    console.log(err);
    reply.code(401).send();
  }
};

```

9. We'll then add a [Fastify Prehandler Hook](https://www.fastify.io/docs/latest/Reference/Hooks/#prehandler to `packages/api/index.ts` that will run the `jwtVerifier` logic with each Fastify route:

```bash
fastify.decorate("jwtVerify", (request: FastifyRequest) => {
  fastify.log.info(`The incoming request is: ${JSON.stringify(request)}`);
});

fastify.addHook("preHandler", async (request, reply, done) => {
  return jwtVerifier(request, reply);
});
```

Your final `packages/api/index.ts` file should look like this:

```bash
import fastifyPostgres from "@fastify/postgres";
import Fastify, { FastifyInstance, FastifyRequest } from "fastify";
import * as dotenv from "dotenv";
import facilitiesRoutes from "./routes/facilities";
import { jwtVerifier } from "./utils/jwt-verifier";

dotenv.config();

const fastify: FastifyInstance = Fastify({
  logger: {
    serializers: {
      res(reply) {
        return {
          statusCode: reply.statusCode,
        };
      },
      req(request) {
        return {
          method: request.method,
          url: request.url,
        };
      },
    },
  },
});

fastify.register(fastifyPostgres, {
  connectionString: process.env.CONNECTION_STRING,
});

fastify.decorate("jwtVerify", (request: FastifyRequest) => {
  fastify.log.info(`The incoming request is: ${JSON.stringify(request)}`);
});

fastify.addHook("preHandler", async (request, reply, done) => {
  return jwtVerifier(request, reply);
});

fastify.register(facilitiesRoutes);

const start = async () => {
  try {
    await fastify.listen({ port: 3000 });
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();

```

## Configure the React app

1. Add `"proxy": "http://localhost:3000"` to `packages/frontend/package.json` so that React knows what base URL our API calls will make.

2. In a `.env` file in the `packages/frontend` directory, add the needed environment variables:
```text
PORT=3001
REACT_APP_OKTA_ISSUER=https://{yourOktaDomain}/oauth2/default
REACT_APP_OKTA_CLIENT_ID={yourOktaClientId}
REACT_APP_OKTA_BASE_REDIRECT_URI=http://localhost:3001
```

**NOTE:** We are switching the default port React will run on because the backend API app will use port `3000` by default as well.

### Create React components

Let's create our React components for render on the frontend.

1. In a newly created `src/components` directory, add the following files:
#### login.tsx

```tsx
import { useOktaAuth } from "@okta/okta-react";
import { Navigate, useNavigate } from "react-router-dom";
import "../App.css";

export function Login() {
  const navigate = useNavigate();
  const { authState } = useOktaAuth();

  const handleLoginClick = () => {
    navigate("/facilities");
  };

  return authState?.isAuthenticated ? (
    <Navigate to="/facilities" replace />
  ) : (
    <div className="form-wrapper">
      <form onSubmit={handleLoginClick}>
        <h2>Welcome Back!</h2>
        <input type="submit" value="Login" />
      </form>
    </div>
  );
}

```

**NOTE:** Our app uses [React Router v6](https://reactrouter.com/en/main), which utilizes the new `useNavigate` to replace `useHistory` to programmatically navigate.

#### facilities.tsx

```tsx
import { useOktaAuth } from "@okta/okta-react";
import { useEffect, useState } from "react";
import { getErrorMessage } from "../utils/get-error-message";

interface IFacility {
  Center: string;
  Facility: string;
  Status: string;
  City: string;
  State: string;
  Visited: boolean;
  id: bigint;
}

function Facilities() {
  const [data, setData] = useState<IFacility[]>();
  const [errors, setErrors] = useState<string>();
  const { authState, oktaAuth } = useOktaAuth();

  const logout = async () => {
    try {
      await oktaAuth.signOut();
    } catch (err) {
      throw err;
    }
  };

  useEffect(() => {
    const apiCall = async () => {
      if (authState?.isAuthenticated && authState.accessToken?.accessToken) {
        try {
          const response = await fetch("/facilities", {
            headers: {
              Authorization: authState.accessToken.accessToken,
            },
          });
          const data = await response.json();
          setData(data);
        } catch (error: unknown) {
          setErrors(getErrorMessage(error));
        }
      }
    };
    apiCall();
  }, [authState]);

  const handleVisitedClick = (
    e: React.ChangeEvent<HTMLInputElement>,
    facilityId: bigint
  ) => {
    const url = `/facilities/${facilityId}`;

    const apiCall = async () => {
      if (authState?.isAuthenticated && authState.accessToken?.accessToken) {
        try {
          await fetch(url, {
            method: "PATCH",
            headers: {
              Authorization: authState.accessToken?.accessToken,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ visited: e.target.checked }),
          });
        } catch (error: unknown) {
          setErrors(getErrorMessage(error));
        }
      }
    };
    apiCall();
  };

  const handleDeleteClick = (facilityId: bigint) => {
    const url = `/facilities/${facilityId}`;

    const apiCall = async () => {
      if (authState?.isAuthenticated && authState.accessToken?.accessToken) {
        try {
          await fetch(url, {
            method: "DELETE",
            headers: {
              Authorization: authState.accessToken?.accessToken,
            },
          });

          setData(data?.filter((row) => row.id !== facilityId));
        } catch (error: unknown) {
          setErrors(getErrorMessage(error));
        }
      }
    };
    apiCall();
  };

  if (data && !errors) {
    return (
      <div className="facilities-wrapper">
        <button onClick={logout} className="logout-button">
          Logout
        </button>
        <h1>NASA Facilities</h1>
        {data ? (
          <table className="facilities-table">
            <thead>
              <tr>
                <th>Center</th>
                <th>Facility</th>
                <th>Status</th>
                <th>City</th>
                <th>State</th>
                <th>Visited</th>
              </tr>
            </thead>
            <tbody>
              {data
                .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
                .map((facility) => {
                  return (
                    <tr key={facility.Facility}>
                      <td>{facility.Center}</td>
                      <td>{facility.Facility}</td>
                      <td>{facility.Status}</td>
                      <td>{facility.City}</td>
                      <td>{facility.State}</td>
                      <td>
                        <input
                          type="checkbox"
                          defaultChecked={facility.Visited}
                          onChange={(e) => handleVisitedClick(e, facility.id)}
                        />
                      </td>
                      <td>
                        <button
                          className="button-delete"
                          onClick={() => handleDeleteClick(facility.id)}
                        >
                          DELETE
                        </button>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        ) : (
          <p>No facilities found</p>
        )}
      </div>
    );
  } else if (errors) {
    return <p>An error occurred: {errors}</p>;
  } else return <p className="loading">Loading...</p>;
}

export default Facilities;

```

#### secureRoute.tsx
In this file we'll create a custom `SecureRoute` component to work with React Router v6.

```tsx
import React, { useEffect } from "react";
import { useOktaAuth } from "@okta/okta-react";
import { toRelativeUrl } from "@okta/okta-auth-js";
import { Outlet } from "react-router-dom";

export const RequiredAuth: React.FC = () => {
  const { oktaAuth, authState } = useOktaAuth();

  useEffect(() => {
    if (!authState) {
      return;
    }

    if (!authState?.isAuthenticated) {
      const originalUri = toRelativeUrl(
        window.location.href,
        window.location.origin
      );
      oktaAuth.setOriginalUri(originalUri);
      oktaAuth.signInWithRedirect();
    }
  }, [oktaAuth, authState?.isAuthenticated, authState]);

  if (!authState || !authState?.isAuthenticated) {
    return <p className="loading">Loading...</p>;
  }

  return <Outlet />;
};

```

**NOTE:** The `okta/okta-react` package includes a `SecureRoute` component, but it does not support React Router v6 to stay router version agnostic. For more information, please see the issue comment at [https://github.com/okta/okta-react/issues/178#issuecomment-1150407182](https://github.com/okta/okta-react/issues/178#issuecomment-1150407182).

We'll also need to add the `SecureRoute` component and the following to `App.tsx`.

```tsx
import { useCallback } from "react";
import "./App.css";
import { OktaAuth, toRelativeUrl } from "@okta/okta-auth-js";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { LoginCallback, Security } from "@okta/okta-react";
import { Login } from "./components/login";
import Facilities from "./components/facilities";
import { RequiredAuth } from "./components/secureRoute";

function App() {
  const oktaAuth = new OktaAuth({
    issuer: process.env.REACT_APP_OKTA_ISSUER,
    clientId: process.env.REACT_APP_OKTA_CLIENT_ID,
    redirectUri:
      process.env.REACT_APP_OKTA_BASE_REDIRECT_URI + "/login/callback",
  });

  const restoreOriginalUri = useCallback(
    async (_oktaAuth: OktaAuth, originalUri: string) => {
      window.location.replace(
        toRelativeUrl(originalUri || "/", window.location.origin)
      );
    },
    []
  );

  return (
    <Router>
      <Security oktaAuth={oktaAuth} restoreOriginalUri={restoreOriginalUri}>
        <Routes>
          <Route path="login/callback" element={<LoginCallback />} />
          <Route path="/" element={<Login />} />
          <Route path="/facilities" element={<RequiredAuth />}>
            <Route path="" element={<Facilities />} />
          </Route>
        </Routes>
      </Security>
    </Router>
  );
}

export default App;

```

The following CSS has been added to `App.css` in the demo application with inspiration from [https://codepen.io/anthonymarkreynolds/pen/qJBazW](https://codepen.io/anthonymarkreynolds/pen/qJBazW).

```css
@import url("https://fonts.googleapis.com/css?family=Jura:400");

* {
  font-family: Jura, Arial;
  font-weight: 500;
}

h2 {
  font-weight: 600;
}

.facilities-wrapper {
  display: inline-flex;
  width: 100%;
  justify-content: center;
  flex-direction: column;
  align-items: center;
}

.loading {
  font-size: 40px;
  text-align: center;
  margin-top: 25%;
}

.facilities-table {
  border: 1px solid #ddd;
  border-collapse: collapse;
  margin: 32px;
}

th,
td {
  padding: 8px;
  border-right: 1px solid #ddd;
}

tr {
  border-bottom: 1px solid #ddd;
}

.form-wrapper {
  display: grid;
  grid-template-columns: 1fr minmax(200px, 400px) 1fr;
  grid-template-rows: 1fr minmax(auto, 1fr) 1fr;
  grid-gap: 10px;
  width: 100%;
  height: 100vh;
  background: linear-gradient(-45deg, #ee7752, #e73c7e, #23a6d5, #23d5ab);
  background-size: 400% 400%;
  animation: Gradient 15s ease infinite;
  box-sizing: border-box;
}

form {
  grid-column: 2;
  grid-row: 2;
  display: grid;
  grid-gap: 10px;
  margin: auto 0;
  padding: 16px 32px;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 10px;
  box-shadow: 0 32px 64px rgba(0, 0, 0, 0.2);
  margin-bottom: 33%;
}

form fieldset {
  margin: 0;
  background-color: #fff;
  border: none;
  border-radius: 5px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

legend {
  padding: 4px;
  background-color: #fff;
  border-radius: 5px;
}

form > input,
button {
  padding: 10px;
  border: 1px solid rgba(0, 0, 0, 0);
  border-radius: 5px;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  cursor: pointer;
  margin-bottom: 24px;
  min-width: 100px;
}

form > input:hover,
button:hover {
  background-color: #eef;
}

.logout-button {
  align-self: end;
  margin: 32px 32px 0px;
}

input[type="checkbox"] {
  width: 48px;
  height: 20px;
  cursor: pointer;
}

@keyframes Gradient {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

button.button-delete {
  background-color: #fe2c54;
  color: white;
  font-weight: 700;
  margin-bottom: 0;
  min-width: unset;
}

```

## Running the app

You can start the demo app by running `npx lerna run start`.

{% img blog/react-fastify-postgres/login-screen.jpg alt:"Screenshot of login window" width:"600" %}{: .center-image }

If we're not authenticated, our app will land us at the login page, where we can then click login to go through the Okta login process. Once authenticated, we're redirected to `/facilities`. If we land on the root URL and are already authenticated, our app will automatically navigate us to `/facilities`. Once our table loads, we'll see the following:

{% img blog/react-fastify-postgres/nasa-facilities-table.jpg alt:"Screenshot of table with nasa facilities data" width:"600" %}{: .center-image }

To render the facilities table, our app has made a call which includes the ID token authorization to our API to fetch the data from the backend `/facilities` API endpoint.

In `packages/frontend/facilities.tsx`:
```bash
  useEffect(() => {
    const apiCall = async () => {
      if (authState?.isAuthenticated && authState.accessToken?.accessToken) {
        try {
          const response = await fetch("/facilities", {
            headers: {
              Authorization: authState.accessToken.accessToken,
            },
          });
          const data = await response.json();
          setData(data);
        } catch (error: unknown) {
          setErrors(getErrorMessage(error));
        }
      }
    };
    apiCall();
  }, [authState]);
```

The backend has verified the ID token using the `jwtVerifier` utility we created.

Since the backend connects to our Postgresql instance, it has used the query we specified to fetch the needed data at the `/facilities` route.

In `packages/api/routes/facilities.ts`:
```bash
fastify.get(
    "/facilities",
    async (request: FastifyRequest, reply: FastifyReply) => {
      let facilities: IFacility[] = [];

      try {
        const { rows } = await client.query("SELECT * FROM facilities");
        if (rows.length == 0) throw new Error("No facilities found");

        facilities = rows;
        reply
          .code(200)
          .header("Content-Type", "application/json; charset=utf-8")
          .send([...facilities]);
      } catch (error) {
        const errorMessage = (error as Error).message;
        throw new Error(errorMessage);
      }
    }
  );
```

The same process repeats when a user clicks on the `Visited` checkbox or `Delete` button for the appropriate API endpoints and Postgresql queries.
## OUTRO

## CONTINUED LEARNING