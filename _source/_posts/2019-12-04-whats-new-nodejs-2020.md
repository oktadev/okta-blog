---
disqus_thread_id: 7746698118
discourse_topic_id: 17178
discourse_comment_url: https://devforum.okta.com/t/17178
layout: blog_post
title: "What's New for Node.js in 2020"
author: david-neal
by: advocate
communities: [javascript]
description: "Node.js is changing in 2020, here are the updates to be on the lookout for!"
tags: [nodejs, node, javascript, ecmascript, es-modules]
tweets:
- "Want a peek at what's coming to Node.js in 2020? #nodejs #wasm"
- "2020 is almost here! What's in store for Node.js in the new year? #nodejs #wasm"
- "Can you believe it's almost 2020? Here's what to look forward to in Node.js! #nodejs #wasm"
image: blog/whats-new-nodejs-2020/whats-new-nodejs-2020.jpg
type: awareness
---

In 2019, Node.js turned 10 years old, and the number of packages available on `npm` crossed one million. Downloads for Node.js itself continues to rise, growing 40% year over year. Another significant milestone is Node.js recently joined the OpenJS Foundation, which promises to improve project health and sustainability, as well as improve collaboration with the JavaScript community at large.

As you can see, a lot has happened in a relatively short amount of time! Every year the Node.js community has gained momentum, and 2020 shows no signs of slowing down.

There are lots of interesting features being explored for the next major releases of Node.js. In this post I'll explore some of the most significant updates the Node.js community can expect in 2020.

{% img blog/whats-new-nodejs-2020/whats-new-nodejs-2020.jpg alt:"What's New for Node.js in 2020" width:"800" %}{: .center-image }

## What's New in Node.js Version 13?

As of this writing, the most recent release of Node.js is 13. There are already a number of features and updates we can start playing around with leading into 2020. Here's a list of highlights:

* ECMAScript modules
* WebAssembly support
* Diagnostic reports
* Full internationalization support for date, time, number, and currency formats
* QUIC protocol support
* V8 JavaScript engine performance updates

Before I dive into the details of these updates, let's take a look at what we can expect from the Node.js release schedule.

## The Node.js Release Process for 2020

Every six months, a new major version of Node.js is released, one in October and one in April. This major version is referred to as the _Current_ version. As of this writing, the _Current_ version of Node.js is 13, released in October 2019.

Odd-numbered versions (e.g. v9, v11, and v13) are released every October, are short-lived, and are not considered ready for production. You might think of an odd-numbered version as a _beta_ version. They are designed for testing new features and changes leading up to the next even-numbered version of Node.js.

Even-numbered versions (e.g. v8, v10, and v12) are released every April. After its release, the previous odd-numbered version will stop receiving updates. Although more stable than odd-numbered versions, it will continue to be actively developed for the next six months. You could think of this first six months as a _release candidate_ stage.

Once an even-numbered version has had time to bake for six months, it enters a new stage of life called _Long-Term Support_ (LTS). The LTS stage is considered production-ready. For the next 12 months, LTS versions receive bug fixes, security updates, and other improvements with the goal of not breaking any existing applications.

After LTS, there is a final _Maintenance_ stage. While in Maintenance, the Node.js version will only receive _critical_ bug and security fixes. The Maintenance stage lasts for 18 months. After 18 months of Maintenance, it is considered _End-of-Life_ (EOL) and is no longer supported.

{% img blog/whats-new-nodejs-2020/nodejs-version-lifecycle.jpg alt:"Node.js Version Lifecycle" width:"800" %}{: .center-image }

### Expected Release Schedule for 2020

We should expect to see the following release schedule in 2020.

**January - March 2020**

* 13.x is the _Current_ version and actively developed
* 10.x and 12.x are LTS

**April 2020**

* 14.x released and becomes the _Current_ version
* 13.x work stops soon after 14.x release
* 10.x enters Maintenance

**October 2020**

* 15.x released and becomes the _Current_ version
* 14.x enters LTS
* 12.x enters Maintenance

{% img blog/whats-new-nodejs-2020/nodejs-new-feature-release-schedule.jpg alt:"Node.js 2020 New Feature Release Schedule" width:"800" %}{: .center-image }

> Note: Node 8.x End-of-Life (EOL) is scheduled at the end of 2019 due to its dependency on OpenSSL-1.0.2, which is also scheduled for EOL at the end of 2019. If you haven't already, make plans to migrate 8.x applications to 10.x or 12.x.

## Support for ECMAScript Modules

As of v13.2.0, Node.js supports both traditional CommonJS modules and the new standard ECMAScript (ES) modules out of the box. This means you can finally use `import` and `export` syntax you may already be using for client-side JavaScript running in the browser. Also, it's important to note ES modules in Node.js have JavaScript _strict mode_ enabled by default, so you don't have to specify `"use strict";` at the top of every file.

```js
// message file
async function sendMessage { ... }
export { sendMessage };

// index file
import { sendMessage } from "./message";
```

However, you still need to do a little work to let Node.js know you are using ES modules. The two most common ways to do this are using the `.mjs` file extension or specifying `"type": "module"` in the nearest parent `package.json` file.

* **Option 1:** Rename `.js` files to `.mjs` files.
* **Option 2:** Update the root `package.json` file, or add a `package.json` to the folder that contains ES modules and specify the `type` as `module`.

```js
{
   "type": "module"
}
```

Another possibility is enabling ES module in the root `package.json` file, and then renaming all CommonJS module files to use the `.cjs` extension.

Personally, I find the `.mjs` and `.cjs` extensions a little gross, so I'm glad to see there are ways of specifying ES and CommonJS module usage with a `package.json` file.

## Node.js can Import WebAssembly Modules

Along with ES module support comes the ability to import WebAssembly (Wasm) modules! A WebAssembly module is a portable compiled binary format that can be parsed faster than JavaScript and executed at native speeds. WebAssembly modules can be created using a language such as C/C++, Go, C#, Java, Python, Elixir, Rust, and many others.

WebAssembly module support is still in the experimental stage as of this writing. To enable the feature, you must pass a command-line flag when executing a Node.js application. For example:

```sh
node --experimental-wasm-modules index.js
```

As an example, imagine you have an image processing library implemented as a WebAssembly module. The syntax for using this Wasm module might look like the following.

```js
import * as imageUtils from "./imageUtils.wasm";
import * as fs from "fs";
( async () => {
   const image = await fs.promises.readFile( "./image.png" );
   const updatedImage = await imageUtils.rotate90degrees( image );
} )();
```

It's also possible to import a WebAssembly module using the new dynamic `import()` statement in Node.js.

```js
"use strict";
const fs = require("fs");
( async () => {
   const imageUtils = await import( "./imageUtils.wasm" );
   const image = await fs.promises.readFile( "./image.png" );
   const updatedImage = await imageUtils.rotate90degrees( image );
} )();
```

### WebAssembly System Interface (WASI)

Similar to JavaScript, WebAssembly is designed with security in mind to prevent access to any of the underlying operating system, sometimes referred to as "sandboxed." However, there are times when a WebAssembly module in your control in Node.js may benefit from being able to make system-level calls.

This is where the new WebAssembly System Interface (WASI) comes in. WASI is designed to be a standard interface for making calls to the underlying system, such as the host application, native operating system, and so forth.

Initial WASI support was [recently committed](https://github.com/nodejs/node/commit/09b1228c3a2723c6ecb768b40a507688015a478f) to the Node.js project. WASI is another exciting feature we may see come to Node.js in 2020!

## Diagnostic Reports Launch in 2020

Diagnostic reports are human-readable JSON-formatted summaries of process information, including call stacks, operating system information, loaded modules, and other useful data designed to assist in supporting applications. These reports can be triggered on unhandled exceptions, fatal errors, a process signal, or using the new `process.report` API. Node.js can be configured to save diagnostic reports to a specified folder and file name.

As of this writing, diagnostic reports are in the experimental. To enable this feature, you must pass a command-line flag when executing a Node.js application. For example:

```sh
node --experimental-report --report-uncaught-exception --report-filename=./diagnostics.json index.js
```

## Internationalization Support Expands in 2020

As of v13.x, Node.js comes compiled with full ICU ([International Components for Unicode](http://site.icu-project.org/home)). ICU is a mature and popular globalization library. Among many features, ICU includes support for formatting numbers, dates, times and currencies, performing time calculations and string comparisons, and converting text between Unicode and other character sets.

## Other Node.js Updates for 2020

* **QUIC protocol support:** a modern transport for connected applications with increased performance and reliability.
* **Better Python 3 build support:** in 2020 it should be possible to build Node.js and native modules using Python 3.
* **An Updated V8 JavaScript engine:** V8 v7.8 and 7.9 increase performance and Wasm support.
* **Stable Workers Threads API:** Worker threads in Node.js enable parallel, CPU-intensive JavaScript operations.

## Learn More about Node.js, JavaScript, and Security

This post only begins to scratch the surface of all the hard work going into improving Node.js in 2020! If you're interested in staying informed of the latest changes or getting involved in some way, there is a list of [ways to contribute to Node.js](https://nodejs.org/en/get-involved/) on the Node.js web site.

If you liked reading this, we have a lot more posts you may be interested in!

* [An Illustrated Guide to OAuth and OpenID Connect](/blog/2019/10/21/illustrated-guide-to-oauth-and-oidc)
* [Learn JavaScript in 2019](/blog/2018/12/19/learn-javascript-in-2019)
* [Build a Secure Node.js App with SQL Server and hapi](/blog/2019/03/11/node-sql-server)
* [Build Simple Authentication in Express in 15 Minutes](/blog/2019/05/31/simple-auth-express-fifteen-minutes)
* [What's New in JavaScript for 2019](/blog/2019/01/22/whats-new-in-es2019)

As always, you can ask questions in the comments section below. Don't forget to follow us on [Twitter](https://twitter.com/oktadev), [Facebook](https://www.facebook.com/oktadevelopers), and subscribe to our [YouTube](https://www.youtube.com/c/oktadev) channel so you never miss any killer content!
