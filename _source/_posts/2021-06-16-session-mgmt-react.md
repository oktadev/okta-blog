---
layout: blog_post
title: "A Developer's Guide to Session Management in React"
author: nickolas-fisher
by: contractor
communities: [javascript]
description: "A quick run-down of how to manage sessions in React."
tags: [session, react]
tweets:
- "Need to learn how to manage sessions in React? We've got you covered!"
- "Learn how to manage sessions in React!"
- "Managing sessions in React can be chellenging. Check this out!"
image: blog/featured/okta-react-skew.jpg
type: awareness
---

Sessions can be a challenging topic for developers of all skill levels.  Many React developers never consider the internals of session management because so much of the work is abstracted away.  But, it is important to understand  what sessions are, how they work, and how best to manage and manipulate them.  

There are several different strategies for session management in React.  In this article, you will learn the basics about sessions, how to manage them in React, and see some examples using common packages.  

## Session Management Overview

The first thing you should know is what exactly a “session” is.  In its simplest terms, a session is some data that is stored on the server.  The server then provides an ID to the client, which the client can use to make requests back to the server.  For example, if you needed access to a user's email address, you could store it against the session, then return an `ID` to the client.  The client could then request an email be sent using the `ID`, rather than passing his/her  email back to the server.  The  `ID` field is opaque, meaning that the client knows nothing about what is saved against the ‘ID’ field.  The `ID` can also contain validation and encryption.  And, the server can return client data, which would typically be encrypted, to the client that  he/she would frequently need.  
In this article, I consider a range of server scenarios, as many times when working in React, developers don't have control over what the server does.  For example, when passing session data, the server will include the data in a cookie.  The server may also expect a cookie to be present when making a request.  Therefore, as a react developer, you will be required to include this cookie in your requests.  You may also choose to store the data in `localStorage`, however  then the server doesn't have access to it.  Local storage allows for more storage and can persist over browsing sessions, making it ideal for situations where you want to remember user actions across multiple browsing sessions.  

Another situation where you may receive a cookie from the server,  is when it is marked `HttpOnly`.  When a cookie is marked `HttpOnly`, it cannot be read by the client in javascript.  This helps minimize the risk of attack against the cookie.  For example, if your site has a cross-site scripting vulnerability, marking the cookie `HttpOnly` will protect the cookie's contents.  Of course, you still need the data that the cookie represents, so you should make a request to the server for the resource you need and present the cookie to the server.  

Along these same lines, you should also understand cookie validation.  The server you are attempting to access should validate the cookie before processing any request on it.  There are many validation tools to help server-side developers, such as signing and expiring cookies.  Many times, the server will provide a way for you to check the state of a cookie without requesting a resource.  

## Manage Sessions in React

There are many packages for helping manage sessions in React.  If you are using Redux, `redux-react-session` is a popular choice.  If you are not, `react-session-api` is another helpful package found on npm.  

Focusing on `redux-react-session`, the first thing you need to do is add your session reducer.

```javascript
import { combineReducers } from 'redux';
import { sessionReducer } from 'redux-react-session';
 
const reducers = {
  // ... your other reducers here ...
  session: sessionReducer
};

const reducer = combineReducers(reducers);
```

Next, you need to initialize your session service.

```javascript
import { createStore } from 'redux';
import { sessionService } from 'redux-react-session';
const store = createStore(reducer)

sessionService.initSessionService(store);
```

Once you are set up, you have access to the full API by the session service. There are several key benefits to this. 

First, you have `initSessionService`.  As the name implies, this call will initiate  the session service. Below you can see an example of a call:  

```javascript
import { createStore } from 'redux';
import { sessionService } from 'redux-react-session';
 
const store = createStore(reducer)

const validateSession = (session) => {
  // check if your session is still valid
  return true;
}

const options = { refreshOnCheckAuth: true, redirectPath: '/home', driver: 'COOKIES', validateSession };
 
sessionService.initSessionService(store, options)
  .then(() => console.log('Redux React Session is ready and a session was refreshed from your storage'))
  .catch(() => console.log('Redux React Session is ready and there is no session in your storage'));
```

To understand this call, you should understand the options that are passed in.  First is `refreshOnCheckAuth`.  This option defaults to `false`, but if set to `true`, will refresh the Redux store in the `checkAuth()` function.  The `checkAuth()` function is provided by the `sessionService` object from the `redux-react-session`.  

`redirectPath` defaults to `login`.  This is the path used when the session is rejected or doesn't exist.  Suppose a new user attempts to access a secured page by browsing to the URL directly.  Because there is no session, the user will be re-routed to `login` by default, or `\home` in the example above.

Next is the `driver` option.  The two you have already learned about are `COOKIES` and `LOCALSTORAGE`, however `redux-react-session` also accepts `INDEXEDDB` or `WEBSQL`.  `IndexedDB` is a database that is built into the browser.  Applications that require a lot of client-side data storage should consider this option.  `Web SQL` is also a browser based database, however it is not supported in HTML5 and is deprecated.  `IndexedDB` is considered the default alternative to `Web SQL`.  

Finally, there is the `validateSession()` function.  This will pass the logic for session validation to the `sessionService`.  As discussed before, this is largely dependent on your server functionality.  If you can validate the session from the client-side, you can implement the logic here.  Otherwise, you can use `axios` or `fetch` to make a call to the server to request session validation.

Two other useful functions are `saveSession()` and `deleteSession()`.  It is a best practice to enforce some rules for deleting the session, though these rules will vary based on your use cases.  These functions return promises, as does the entire API.  To save the session, you need to pass your custom session object.  Setting the session also changes the `authenticated` flag to `true` in the Redux store.

## Learn More About Sessions and React

Managing sessions in React is an immense topic. In this article, you learned the basics of session management and how to apply them to React.  You also learned how to use one of the most common react session management packages available.  But this is just a start.  I encourage you to look into more react session packages and continue to learn and understand how to properly manage the session.  Doing so will make your applications more secure and performant.  

- [Why JWTs Suck as Session Tokens ](/blog/2017/08/17/why-jwts-suck-as-session-tokens)
- [Build a Secure CRUD App with ASP.NET Core and React ](/blog/2018/07/02/build-a-secure-crud-app-with-aspnetcore-and-react)
- [Build a Secure React Application with JWTs and Redux](/blog/2019/08/12/build-secure-react-application-redux-jwt)

Make sure you follow us on [Twitter](https://twitter.com/oktadev) and subscribe to our [YouTube](https://www.youtube.com/c/oktadev) channel. If you have any questions, or you want to share what tutorial you’d like to see next, please comment below.

