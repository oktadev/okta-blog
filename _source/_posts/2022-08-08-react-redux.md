---
layout: blog_post
title: Use Redux to Manage Authenticated State in a React App
author: gabi-dombrowski
by: contractor
communities: [javascript]
description: ""
tags: [javascript, typescript, react, redux, authentication]
tweets:
  - ""
  - ""
  - ""
image:
type: conversion
canonical:
---

There are a myriad of state management options available for React. React provides the option of using the built-in [Context](https://reactjs.org/docs/context.html) for when you have a nested tree of components that share a state. There is also a built-in [useState hook](https://reactjs.org/docs/context.html) that will allow you to set local state for a component.

For more complex scenarios where you might need a single source of truth that shared across large sections of your application and is frequently changing, you might want to consider using a more robust state management library.

Our demo app will utilize all three, needing authentication checks and user profile information.

Let's compare when to use the useState hook vs. React Context vs. a more global state management solution like one of the most popular ones, [Redux](https://redux.js.org/).

## Prerequisites

Add in prereqs.

## Create the React app

We'll get started with the built-in React template for [Create React App](https://github.com/facebook/create-react-app) that uses Redux and Typescript. This includes the recommended Redux Toolkit and Redux's integration with React components.

1. First, run:
```bash
npx create-react-app <YOUR_APP_NAME> --template redux-typescript
```

2. Then we'll add the Redux core by running:
```bash
npm add redux@4.2
```

3. Redux provides its own types, but we'll want to add our `react-redux` types since we're using Typescript:
```bash
npm add -D @types/react-redux@7.1
```

4. We'll also need routing (and routing types) for our app:
```bash
npm install react-router-dom@5
npm add -D @types/react-router-dom@5.3
```

5. To start your app, run:
```bash
npm start
```

## How Redux works

To update state using Redux, an action is dispatched and the store then uses the root reducer to calculate a new state as compared to the old state, which then notifies the proper subscribers of the update so that the UI can properly be updated.

After the UI for your application is initially rendered using an initial global Redux store created using the root reducer, a typical redux workflow goes like this:

1. An event in the UI such as a user button interaction happens in your app which triggers an action.
2. The action is then dispatched to the store and an event handler that handles the needed logic makes the changes to your global state.
3. The store notifies subscribed parts in the UI that there has been an update.
4. Those subscribed parts then check to see if a re-render is needed to update whatever needs updating in the UI.

### Terms

[Action](https://redux.js.org/tutorials/essentials/part-1-overview-concepts#reducers)

An Action is an JS object with a type and a payload. It describes an actionable interaction within your application, and typically is named something like `createUser` or `addToDo`.

[Action Creators](https://redux.js.org/tutorials/essentials/part-1-overview-concepts#reducers)

Action Creators can be used to dynamically create actions. NOT IN APP

[Reducers](https://redux.js.org/tutorials/essentials/part-1-overview-concepts#reducers)

A Reducer returns the proper current state with applicable changes as compared to the previous state when it's passed a new state. They work similarly to the Array.reduce method.

[Redux Store](https://redux.js.org/tutorials/fundamentals/part-4-store#redux-store)

The current live state for your app lives in the Redux Store.

[Selectors](https://redux.js.org/tutorials/essentials/part-1-overview-concepts#selectors)

A selector returns a piece of the live Redux state as stored in the live Redux store.

[Dispatch](https://redux.js.org/tutorials/essentials/part-1-overview-concepts#dispatch)

A Dispatch is a method with triggers an action that in turn updates the Redux store.

**NOTE:** The built-in Redux template we used includes a great counter example of how Redux works. You can take a closer look at [Redux's explanation of the counter example](https://redux.js.org/introduction/examples/).

## Add authentication using OAuth2 and OIDC

For this demo app, we'll be using [Okta's SPA redirect model](https://developer.okta.com/docs/guides/sign-into-spa-redirect/react/main/) to authenticate and fetch user info.

{% include setup/cli.md type="spa" %}

## Application Setup with State Management

## Setup Environment Variables

1. Create a `.env` file to your root directory and add the following:
```bash
REACT_APP_OKTA_ISSUER=https://<YOUR_OKTA_DOMAIN>/oauth2/default
REACT_APP_OKTA_CLIENTID=<YOUR_CLIENT_ID>
REACT_APP_OKTA_BASE_REDIRECT_URI=http://localhost:3000
```

**NOTE:** Remember to not include your `.env` file in any version control for security reasons.

## Add Okta authentication, create routes, and use environment variables

1. Modify the existing `App.tsx` file:
```bash
import "./App.css";
import { OktaAuth, toRelativeUrl } from "@okta/okta-auth-js";
import { BrowserRouter as Router, Route } from "react-router-dom";
import { LoginCallback, Security } from "@okta/okta-react";
import Home from "./components/home";
import { useCallback } from "react";

const oktaAuth = new OktaAuth({
  issuer: process.env.REACT_APP_OKTA_ISSUER,
  clientId: process.env.REACT_APP_OKTA_CLIENTID,
  redirectUri: process.env.REACT_APP_OKTA_BASE_REDIRECT_URI + "/login/callback",
});

function App() {
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
        <Route path="/" exact={true} component={Home} />
        <Route path="/login/callback" component={LoginCallback} />
      </Security>
    </Router>
  );
}

export default App;

```

## Add Initial State, Create Redux Slice, and Create Selector

1. Create a `src/redux-state` directory:
```bash
mkdir src/redux-state
```

2. Add a `dashboardSlice.tsx` file in the created `redux-state` directory with the following:
```bash
import { createSlice } from "@reduxjs/toolkit";
import { RootState } from "../app/store";

export interface IUserProfile {
  email: string;
  given_name: string;
  family_name: string;
}

const initialState: IUserProfile = {
  email: "",
  given_name: "",
  family_name: "",
};

export const userProfileSlice = createSlice({
  name: "userProfile",
  initialState,
  reducers: {
    setUserProfile: (state, action) => {
      return {
        email: action.payload.payload.email,
        given_name: action.payload.payload.given_name,
        family_name: action.payload.payload.family_name,
      };
    },
  },
});

export const selectUserProfile = (state: RootState): IUserProfile =>
  state.userProfile;

export const { setUserProfile } = userProfileSlice.actions;
export default userProfileSlice.reducer;

```

We'll add the `email`, `given_name`, and `family_name` to the global store here. This will be returned from the built-in method in the `oktaAuth` module to fetch user info that we will use later.

3. In the `src/app/store.ts` file, add the created Redux slice to the Redux store:

```bash
import { configureStore, ThunkAction, Action } from "@reduxjs/toolkit";
import counterReducer from "../features/counter/counterSlice";
import userProfileReducer from "../redux-state/dashboardSlice";

export const store = configureStore({
  reducer: {
    counter: counterReducer,
    userProfile: userProfileReducer,
  },
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;

```

## Create Components

1. Create a `src/components` directory:
```bash
mkdir src/components
```

2. In the `src/components` directory, add the following files:

#### home.tsx
```bash
import { useOktaAuth } from "@okta/okta-react";
import { createContext, useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { setUserProfile } from "../redux-state/dashboardSlice";
import "../App.css";
import Dashboard from "./dashboard";
import { UserClaims } from "@okta/okta-auth-js";

type UserProfileExtra = Pick<UserClaims, "locale" | "preferred_username">;

const emptyUserContext = {
  preferred_username: "",
  locale: "",
} as UserProfileExtra;

export const UserContext = createContext(emptyUserContext);

export default function Home() {
  const dispatch = useDispatch();
  const { oktaAuth, authState } = useOktaAuth();
  const [userProfileExtra, setUserProfileExtra] = useState<UserProfileExtra>();

  const login = async () => oktaAuth.signInWithRedirect();

  useEffect(() => {
    if (authState?.isAuthenticated) {
      oktaAuth
        .getUser()
        .then((userInfo: unknown) => {
          const userInfoPayload = userInfo as UserProfileExtra;

          dispatch(
            setUserProfile({
              type: "userProfile/userProfileSet",
              payload: userInfoPayload,
            })
          );

          setUserProfileExtra({
            locale: userInfoPayload.locale || "",
            preferred_username: userInfoPayload.preferred_username || "",
          });
        })
        .catch((err) => {
          console.error(err);
        });
    }
  }, [authState?.isAuthenticated, dispatch, oktaAuth]);

  return (authState?.isAuthenticated && userProfileExtra) ? (
    <UserContext.Provider value={userProfileExtra}>
      <Dashboard />
    </UserContext.Provider>
  ) : (
    <div className="section-wrapper">
      <div className="title">Using React, Redux, and Okta</div>
      <button className="button" onClick={login}>
        Login
      </button>
    </div>
  );
}

```

Here we use React's [useEffect hook](https://reactjs.org/docs/hooks-effect.html) to set the global user state we set up earlier using `setUserProfile` and the local user state we set up in this file with [useState](https://reactjs.org/docs/hooks-state.html).

Once the user is authenticated, we're using the [getUser method](https://github.com/okta/okta-auth-js#getuser) that is built into `oktaAuth` to fetch the user profile information.

#### dashboard.tsx
```bash
import { useOktaAuth } from "@okta/okta-react";
import { useSelector } from "react-redux";
import { selectUserProfile } from "../redux-state/dashboardSlice";
import "../App.css";
import { useState } from "react";
import UserProfile from "./userProfile";
import UserProfileExtra from "./userProfileExtra";

export default function Dashboard() {
  const { oktaAuth } = useOktaAuth();
  const userProfile = useSelector(selectUserProfile);
  const [isExpanded, setIsExpanded] = useState(false);

  const logout = async () => oktaAuth.signOut();

  return (
    <div className="section-wrapper">
      <div className="title">Dashboard</div>
      <div className="profile-greeting">{`Hi ${userProfile.given_name}!`}</div>
      <div className="profile-more-wrapper">
        {isExpanded && (
          <>
            <UserProfile />
            <UserProfileExtra />
          </>
        )}
      </div>
      {
        <div
          className="profile-toggle"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? "Show less" : "Show more"}
        </div>
      }
      <div>
        <button className="button" onClick={logout}>
          Logout
        </button>
      </div>
    </div>
  );
}

```

In this file, we're using a Redux selector to get the current state for `userProfile` to then render it in our component.

We're also setting an `isExpandable` property that toggles whether or not additional user profile information is hidden or shown. This is another example of how to use local state using the `useState` hook. 

#### userProfile.tsx
```bash
import { useSelector } from "react-redux";
import { selectUserProfile } from "../redux-state/dashboardSlice";
import "../App.css";

export default function UserProfile() {
  const userProfile = useSelector(selectUserProfile);

  return (
    <>
      <div>
        <span>Email: </span>
        {userProfile.email}
      </div>
      <div>
        <span>Last name: </span>
        {userProfile.family_name}
      </div>
    </>
  );
}

```

In this file, we are using the Redux selector we created prior to get the current state for the state slice that includes the user profile information we set earlier.

#### userProfileExtra.tsx
``` bash
import "../App.css";
import { useContext } from "react";
import { UserContext } from "./home";

export default function UserProfileExtra() {
  const userProfileExtra = useContext(UserContext);

  return (
    <>
      <div>
        <span>Username: </span>
        {userProfileExtra.preferred_username}
      </div>
      <div>
        <span>Locale: </span>
        {userProfileExtra.locale}
      </div>
    </>
  );
}

```

Here, another way to manage state is demonstrated. This time, React's built-in `useContext` hook is used to get what we set prior in the `UserContext` we created with React's `createContext` method.

**NOTE:** The following custom styling has also been added to `src/App.css`.

```bash
.section-wrapper > div {
  padding: 24px;
  font-family: Roboto, sans-serif;
}

.section-wrapper {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  height: calc(100vh - 100vh * 0.33);
  margin-top: 56px;
}

.button {
  min-width: 64px;
  height: 36px;
  border-color: #6200ee;
  color: #6200ee;
  background-color: transparent;
  border-style: solid;
  padding: 0 15px 0 15px;
  border-width: 1px;
  font-size: 0.875rem;
  font-weight: 700;
  letter-spacing: 0.0892857143em;
  text-transform: uppercase;
  border-radius: 4px;
  border-style: solid;
  padding: 0 15px 0 15px;
  border-width: 1px;
}

.button:hover {
  cursor: pointer;
  background-color: rgb(112, 76, 182, 0.1);
}

.title {
  font-size: 48px;
}

.profile-greeting {
  font-size: 32px;
}

.profile-toggle {
  font-size: 16px;
  text-decoration: underline;
  color: #6200ee;
}

.profile-more-wrapper {
  height: 360px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.profile-more-wrapper > div {
  padding: 16px;
}

.profile-more-wrapper span {
  font-size: 20px;
  font-weight: 500;
}

```

Our app is now complete! Next we'll run it to log a user in and render our applicable states.

### Start the App


## Further Reading

[Custom Sign-In Widget](https://developer.okta.com/docs/guides/custom-widget/main/)

Add custom styled to your sign in widget.

[Custom URL Domain](https://developer.okta.com/docs/guides/custom-url-domain/main/)

Use a custom URL for the Okta sign in widget.

[Open ID Connect](https://developer.okta.com/docs/guides/build-sso-integration/openidconnect/main/)

Set up Single Sign-On for your Okta integrated app.

[Customize Tokens Returned From Okta](https://developer.okta.com/docs/guides/customize-tokens-returned-from-okta/main/)

Add custom claims to your user access tokens that add custom information or attributes stored in a user profile.

[Redux Async Logic](https://redux.js.org/tutorials/essentials/part-5-async-logic)

Use async logic in Redux with [Redux "thunk" middleware](https://github.com/reduxjs/redux-thunk) for handling things like login, data fetching, and handling loading state.

[Redux Learning Resources](https://redux.js.org/introduction/learning-resources)

Further resources to learn Redux.