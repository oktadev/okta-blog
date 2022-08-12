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

Let's compare when to use the useState hook vs. React Context vs. a more global state management solution like one of the most popular ones, [Redux](https://redux.js.org/).

## Create the React app

We'll get started with the built-in React template for [Create React App](https://github.com/facebook/create-react-app) that uses Redux and Typescript. This includes the recommended Redux Toolkit and Redux's integration with React components.

1. First, run:
```bash
npx create-react-app <YOUR_APP_NAME> --template redux-typescript
```

2. Then we'll add the Redux core by running:
```bash
npm add redux
```

3. Redux provides its own types, but we'll want to add our `react-redux` types since we're using Typescript:
```bash
npm add -D @types/react-redux
```

**NOTE:** Redux also recommends you install the [Chrome React DevTools Extension](https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi?hl=en).

4. We'll also need routing (and routing types) for our app:
```bash
npm install react-router-dom@5
npm add -D @types/react-router-dom
```

5. To start your app, run:
```bash
npm start
```

## How Redux works

To update state using Redux, an action is dispatched and the store then uses the root reducer to calculate a new state as compared to the old state, which then notifies the proper subscribers of the update so that the UI can properly be updated.

A typical redux workflow goes like this:

1. xyz
2. abc

### Terms

####[Action](https://redux.js.org/tutorials/essentials/part-1-overview-concepts#reducers)

An Action is an JS object with a type and a payload. It describes an actionable interaction within your application, and typically is named something like `createUser` or `addToDo`.

####[Action Creators](https://redux.js.org/tutorials/essentials/part-1-overview-concepts#reducers)

Action Creators can be used to dynamically create actions. NOT IN APP

####[Reducers](https://redux.js.org/tutorials/essentials/part-1-overview-concepts#reducers)

A Reducer returns the proper current state with applicable changes as compared to the previous state when it's passed a new state. They work similarly to the Array.reduce method.

####[Redux Store](https://redux.js.org/tutorials/fundamentals/part-4-store#redux-store)

The current live state for your app lives in the Redux Store.

####[Selectors](https://redux.js.org/tutorials/essentials/part-1-overview-concepts#selectors)

A selector returns a piece of the live Redux state as stored in the live Redux store.

####[Dispatch](https://redux.js.org/tutorials/essentials/part-1-overview-concepts#dispatch)

A Dispatch is a method with triggers an action that in turn updates the Redux store.

**NOTE:** The built-in Redux template we used includes a great counter example of how Redux works. You can also take a look at [Redux's explanation of the counter example](https://redux.js.org/introduction/examples/).

## Add authentication using OAuth2 and OIDC

For this demo app, we'll be using [Okta's SPA redirect model](https://developer.okta.com/docs/guides/sign-into-spa-redirect/react/main/) to authenticate and fetch user info.

1. First, install the CLI:
```bash
brew install --cask oktadeveloper/tap/okta
```

2. Next, sign up for an account if you don't already have one:
```bash
okta register
```

**NOTE:** Once your account has been activated, take note of your Okta domain. If you already have an account, you can use `okta login` instead using your domain and password to log in.

3. Make sure you're in your project directory and create the app integration by running (you can use default setup values here):
```bash
okta apps create spa
```

**NOTE:** You'll need the Client ID and Issuer printed to the terminal to configure your application later.

4. Add the needed npm packages by running the following command:
```bash
npm install @okta/okta-react@6.4 @okta/okta-auth-js@6.0
```

## Application Setup with State Management

## Further Reading
