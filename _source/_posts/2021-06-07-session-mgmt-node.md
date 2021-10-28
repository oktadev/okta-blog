---
disqus_thread_id: 8579182045
discourse_topic_id: 17381
discourse_comment_url: https://devforum.okta.com/t/17381
layout: blog_post
title: "Everything You Ever Wanted to Know About Session Management in Node.js"
author: nickolas-fisher
by: contractor
communities: [javascript]
description: "A quick run-down of how to manage sessions in Node.js."
tags: [session, node]
tweets:
- "Need to learn how to manage sessions in Node? We've got you covered!"
- "Learn how to manage sessions in Node!"
- "Managing sessions in Node can be confusing. Check this out!"
image: blog/featured/okta-node-skew.jpg
type: awareness
---

Session Management is a pretty scary term for a lot of developers.  Most of the mechanics of session management are abstracted away from developers, to the point where they don't properly learn about it until it's necessary.  Usually, this means a late night trying to figure out a vulnerability, a bug, or how to work with a new session management library.  Hopefully, I can remove some of the magic behind session management in NodeJs and give you a good fundamental place to start.  In this article, you will learn what sessions are, how to manage them in Node.js, and some details that should help you minimize bugs and vulnerabilities.

## Overview of Sessions

I will start at the beginning.  When a user uses your web application, they make an HTTP request to the webserver.  The server then knows what to do with this request and returns a response.  The user's request must contain all the necessary information for the server to make a decision.  For example, is the user authenticated?  Is he/she authorized to view a specific page?  Does the user have a shopping cart that needs to be displayed?  All this information that makes the user experience feel seamless, as though he/she is  using one continuous application, must be transmitted from the client to the server.  If the application were to transmit all this data back and forth on each request, you would introduce massive security and performance concerns.  There are many ways to streamline this effort, but for the sake of this article, I will focus on cookie-based sessions.  

When a user sends a request to your web application, they will add a session cookie to the request headers.  If this is the first time a user has requested your site, the server will create a new session cookie and return it to the client.  The session is given an ID that both the client and server can reference.  This enables the application to split the session data between that which is stored on the client-side and that which is stored on the server.  For example, the cookie may tell the application the session ID and that the user is authenticated.  The server can use this information to access the user's shopping cart in the server's store.  

Of course, any time an application sends information to the client it could possibly end up in an enemy's hands.  The majority of your users aren't necessarily bad actors, but bad actors are certainly looking for ways to exploit your application.  Most security concerns should be addressed by you, the developer and maintainer of the application and the developer of whatever session management library you're using.  

## Session Management Risks

As an aside, I should note that it's generally better to use a well-established session management library than to roll your own.  You will see a few examples of that later in this article.  For now, let's take a look at some common session security concerns.

### Session Prediction

Each session has an associated session ID with it.  It is very important that this session ID is properly randomized, such that an attacker cannot simply guess a few options and bypass any security associated with the session ID.  Suppose your session IDs were sequential integers.  An attacker could log in, create a new session, and see their session ID is `12345`.  The attacker could then try to pass the session ID `12344` or `12343` to the server in an attempt to hijack a session from another user.

### Session Sniffing

In session sniffing, an attacker can use a sniffing application such as Wireshark or a proxy to capture network traffic between a client and server.  As you've learned, that traffic will ultimately contain a request with a session cookie in it.  This cookie will have the session ID which can then be hijacked.

### Man-in-the-Middle Attacks

In a man-in-the-middle attack, an attacker sits between the web server and the client.  The attacker can then pass requests from the client to the server and respond without detection from either.  But along the way, the attacker has gained access to the session.

### Client Side Attacks

There are many strategies for attacking the client.  Some of the best known are Cross-Site Scripting, Trojans, and malicious javascript codes.  Sometimes it just takes some good old-fashioned social engineering to obtain session information from a client.  The idea here is that the attack will attempt to exploit the client itself to get access from the cookie in the browser's storage.  For example, an attacker that can inject malicious Javascript code could inject the following javascript:

```javascript
alert(document.cookie);
```

With that simple line of code, the attack can now gain access to the cookie along with all the session goodies in it.

## Good Session Management Practices

All of this is probably a little scary,  But many people are working on the other side to help prevent these attacks or minimize their impacts.  Most of these strategies are rolled into session management libraries, and any library that is continuously maintained should be up to date with the latest security enhancements.  But, it's important for you, as a developer who takes security seriously, to understand what security should be in place.

### Session Secret

Any good session management library should come with an option to change the `session secret`.  It may have slightly different names but the idea is always the same.  The secret is used to compute a hash against the session ID.  This helps to prevent session hijacking by ensuring the session cookie hasn't been tampered with.

### Session Expiration

Another good practice is to expire the session after some predetermined time.  There are two ways to expire a session: (1) based on inactivity or (2) absolutely.  When you base your expiration on inactivity, it will keep the session open until the user hasn't made a request for some amount of time.  When you choose to expire it absolutely, then the session will expire after some predetermined time, regardless of activity.  The session will then need to be refreshed.  You should at least set an inactivity session expiration so you don't have stale and vulnerable sessions available for attack.

### Cookie Expiration

Similar to session expiration, you can also expire the cookie that was sent to the browser.  Many times, cookies are set to expire when the session expires.  However, it is possible to allow the cookie to remain available indefinitely.  This is a poor decision for the same reason as session expiration.  Generally, session expiration is a strong tool for minimizing the impacts of attack, but implementing cookie expiration is also helpful.  

### Regeneration of Session After Login

When a user first accesses your site, he/she can use an anonymous session.  This is a fairly common practice where you want to track a user's movements in your application but don't want to require them to log in.  For example, consider a shopping site where an anonymous user can have a shopping cart but can't check out until he/she logs in.  In this case, there is still a session ID provided to the user.  When the user does log in, you should regenerate the session ID to prevent session fixation attacks against your web application.

## Session Management in Node.js

Node.js has become wildly popular over the last 10 years.  With it, several frameworks and session management libraries have cropped up to support it.  Most frameworks use their own session management middleware.  For example, `express`, the most popular server framework for Node.js, has the accompanying `express-session` for session management.  Similarly, `koa` uses `koajs/session` for its session management.  

For this article, I want to focus on `express-session`, as it is one of the most mature and widely used session management libraries available for Node.js.  For a full rundown of the `express-session` package, you can view the [readme here](https://github.com/expressjs/session#readme).  Below are some of the highlights:

Registering the middleware for `express-session` is very simple.

```javascript
var session = require('express-session')
var app = express()

app.use(
  session({
    secret: 'SomeSuperLongHardToGuessSecretString',
    resave: true,
    saveUninitialized: false,
  })
);
```

This is the minimum you need to do to get `express-session` working in a development environment.  As discussed, the secret is used in hashing the session ID, to ensure it isn't tampered with between the client and the server.  This should be some very long, complex string that is hard to guess.  This string should be rotated periodically to ensure that if it was compromised, it doesn't stay that way long. The `secret` can also take an array of secrets to make it even harder to guess.

The `resave` option enforces that the session is resaved against the server store on each request, even if the session wasn't modified.  The `saveUninitialized` property forces a new session to be saved. Both the `resave` and `saveUninitialized` options are left to your discretion on how best to implement.  Generally, `saveUninitialized: false` is used to reduce the session storage on the server for unauthenticated requests.  `resave` is defaulted to true, but to reduce overhead you can set it to false if your store allows.

Speaking of the store, you notice in this example you haven't implemented one.  The default server-side session storage is `MemoryStore`.  According to the documentation, *this is purposely not designed for production*.  This means it's fine to leave the above code this way in development, but you should implement a different store in production.  Not doing so can result in memory leaks and does not scale past a single process.  A list of compatible session stores [can be found here](https://github.com/expressjs/session#compatible-session-stores).  

The following example uses `express-sessions` (note *sessions* instead of *session*) as a server-side store using MongoDB:

```javascript
app.use(
  express.session({
    secret: 'SomeSuperLongHardToGuessSecretString',
    resave: true,
    saveUninitialized: false,
    store: new (require('express-sessions'))({
      storage: 'mongodb',
      instance: mongoose,
      host: 'localhost',
      port: 27017,
      db: 'test',
      collection: 'sessions',
      expire: 86400
    })
}));
```

Now your application will use your MongoDB instance to store the server session data.  `Express-sessions` also supports a Redis implementation.  Furthermore, there are many libraries for supporting other databases and in-memory solutions.  Your stack will likely dictate what package you need to use.  

Coming back to the security aspect of sessions, you learned that you should expire the session and the cookie.  The example below builds on our working example to do just that.

```javascript
app.use(
  express.session({
    secret: 'SomeSuperLongHardToGuessSecretString',
    resave: true,
    saveUninitialized: false,
    store: new (require('express-sessions'))({
      storage: 'mongodb',
      instance: mongoose,
      host: 'localhost',
      port: 27017,
      db: 'test',
      collection: 'sessions',
      expire: 86400
    }),
  cookie: { maxAge: 2628000000 },
}));
```

In the above expression, only the session ID is stored in the cookie, so you can set the `cookie.maxAge` value to expire the session and the cookie in one shot.  There is also an option for `cookie.expires`, however it is recommended that you set the `maxAge` option instead.  

Now from your routes, you should be able to access the `session` object from your request object.  Earlier you learned that you should regenerate your session after the user logs in.  Let's take a look at that using express and the `ExpressOIDC` from Okta.

```javascript
const oidc = new ExpressOIDC({
  issuer: {yourOktaDomain} + "/oauth2/default",
  client_id: {yourClientId},
  client_secret: {yourClientSecret},
  appBaseUrl: process.env.APP_BASE_URL,
  scope: "openid profile",
  routes: {
    login: {
      path: "/users/login",
    },
    callback: {
      path: "/authorization-code/callback",
    },
    loginCallback: {
      afterCallback: "/users/afterLogin",
    },
  },
});

app.use(oidc.router);

app.get("/users/afterLogin", ensureAuthenticated, (request, response, next) => {
  request.session.regenerate(function(err) {
    // will have a new session here
  })
});
```

In the above example, you are registering the `ExpressOIDC` middleware provided by Okta to handle the login.  After the successful login, you redirect the users to the `users/afterLogin` router, which then has access to the `request` object.  `Express-session` has attached the `session` object to the request for you and you can use the `session` API to call `regenerate`.  This will create a new session for the logged-in users.  

## Learn More

Session management is a topic that you could spend days researching and understanding.  As I noted, the session management package you will use in Node.js will largely depend on your stack and your server framework.  However, by becoming familiar with implementing safe and optimized session management in one framework, you can carry that knowledge to all other Node.js frameworks.  

- [Why JWTs Suck as Session Tokens ](/blog/2017/08/17/why-jwts-suck-as-session-tokens)
- [Build a Simple CRUD Application with Node and MySQL ](/blog/2019/09/09/build-crud-app-node-mysql)
- [Build A Simple Web App with Node and Postgres ](/blog/2019/11/22/node-postgres-simple-webapp)


Make sure you follow us on [Twitter](https://twitter.com/oktadev) and subscribe to our [YouTube](https://www.youtube.com/c/oktadev) channel. If you have any questions, or you want to share what tutorial you'd like to see next, please comment below.
