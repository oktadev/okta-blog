---
disqus_thread_id: 8247637292
discourse_topic_id: 16865
discourse_comment_url: https://devforum.okta.com/t/16865
layout: blog_post
title: "Build a Video Chat Service with JavaScript, WebRTC, and Okta"
author: nickolas-fisher
by: contractor
communities: [javascript]
description: "Learn how to use WebRTC, JavaScript, and Okta to build a video chat service."
tags: [webrtc, videochat, javascript]
tweets:
- "Want to learn how to build your own video chat service with WebRTC and JavaScript? Check this out!"
- "Learn the basics of WebRTC by building a video chat service in JavaScript!"
- "Want to build a video chat service with WebRTC and JavaScript? We've got you covered!"
image: blog/featured/okta-node-skew.jpg
type: conversion
---


If you are familiar with any sort of real-time communications over the internet such as GoToMeeting, Google Meet, or Discord then chances are you have used WebRTC.  WebRTC is an open framework for handling real-time communications.  It supports video, voice, or any data between peers.  WebRTC is supported by Google, Apple, Microsoft, Mozilla, and many others.  

In this tutorial, you will learn how to build a web application that allows a user to broadcast their video and voice in their room.  This room will be available for other users, called viewers, to join.  The viewers will be able to interact with the broadcaster via a chat functionality that will deliver messages to the entire room.

To create this application you will use Node.JS and Express for the server framework.  Web Sockets will handle the communication between peers in each room.  Okta will manage the authentication and identity for each user.  Finally, WebRTC will manage the broadcasting of the video and voice.  

## Create Your Okta Application

First, navigate to your Okta admin dashboard.  If you don't have an Okta account yet you can [sign up here](https://developer.okta.com/signup/).  Once you've logged into the admin dashboard navigate to **Applications** and select **Add Application**.   On the next page select **Web** and click **Next**.  

{% img blog/webrtc-videochat-javascript/okta-app-type.png alt:"Okta Application Type" width:"650" %}{: .center-image }

Next, on the Application Settings page, give your application a meaningful name.  You can leave the URLs as they are since you will configure your application to use port 8080 for development.  Click **Done** and Okta will create your application and bring you to the application page.  On the *General* tab make sure you note the *Client ID* and *Client Secret* as you will need these in your application.  

{% img blog/webrtc-videochat-javascript/okta-app-settings.png alt:"Okta Application Settings" width:"650" %}{: .center-image }

## Build the WebRTC Video Chat Application

You can now begin to build your application.  Open your favorite terminal and run the command `npm init -y` to initialize your node application in a folder where your application will live.  You will need some dependencies for your application.

First, Express will be the backbone of your application.  Express is one of the most popular web application frameworks for Node.js.  Also, you will want to install Express-Session at this time for session management.

```console
npm i express@4.17.1
npm i express-session@1.17.1
```

Next, you will need the Okta OIDC middleware and the Okta Node SDK.  Using these libraries you will be able to easily and quickly implement Okta's sign-on provider.

```console
npm i @okta/okta-sdk-nodejs@4.1.0
npm i @okta/oidc-middleware@4.0.1
```

You will use socket.io to manage the connections between peers.

```console
npm i socket.io@2.3.0
```

Pug will be the template engine for your views.  Pug is simple and easy to use.  Pug was previously known as Jade but has since rebranded so if you are familiar with Jade then you should have no trouble adapting.

```sh
npm i pug@3.0.0
```

Finally, dotenv will store sensitive environment variables to keep out of your repository.

```sh
npm i dotenv@8.2.0
```

## Create Your Node Server

Your server will consist of 4 files.  First, add a new file (if one hasn't been created yet) called `index.js`.  Add the following code to it.

```javascript
'use strict'

require('dotenv').config();

const server = require('./server')

const port = process.env.APP_BASE_PORT;

server.start({
    port: port
}).then(app => {
    console.log('Application is now running on port ' + port);
})
```

The index file serves as an entry point for your entire application.  Dotenv recommends you call require on the package as early in the app as possible.  The only other job of the index file is to start the server, which you will build shortly.

Next, add a file called `routes.js`.  This file will contain the route definition for your application.

```javascript
module.exports = function (app, opts) {
  function ensureAuthenticated (request, response, next) {
    if (!request.userContext) {
      return response.status(401).redirect("/account/login");
    }

    next();
  }

  app.get("", (request, response, next) => {
    return response.render("home");
  });

  app.get("/dashboard", ensureAuthenticated, (request, response, next) => {
    return response.render("dashboard", {
      user: request.userContext.userinfo,
      rooms: opts.rooms
    });
  });

  app.get("/broadcast", ensureAuthenticated, (request, response, next) => {

    return response.render("broadcaster", {
      user: request.userContext.userinfo,
    });
  });

  app.get("/view/:room", ensureAuthenticated, (request, response, next) => {
    return response.render("viewer", {
      user: request.userContext.userinfo,
      room: request.params.room
    });
  });

  app.get("/account/logout", ensureAuthenticated, (request, response, next) => {
    request.logout();
    response.redirect("/");
  });

  app.get("/account/login", (request, response, next) => {
    return response.render("home");
  });
};
```

The routing information contained here includes handlers for logging in and out as well as providing routes for the views that you will display to users.  For routes that are under authentication, you are using the `ensureAuthenticated` middleware function at the top.  If the user isn't authenticated they will be redirected to the login page.  The view route will take a parameter for the `room` that the user is joining.  The room will be named after the broadcaster.

Next, add a file called `socket.js`.  This file will contain the bulk of your logic for managing the connection between the broadcaster and the viewers.

```javascript
module.exports = function (io, rooms) {
  io.sockets.on("connection", (socket) => {
    socket.on("broadcaster", (room, user) => {
      rooms.push({
        broadcaster: socket.id,
        room: room,
        user: user,
      });

      socket.join(room);
      socket.broadcast.emit("broadcaster");
    });

    socket.on("watcher", (room) => {
      var broadcast = rooms.filter((r) => r.room === room)[0];

      socket.join(room);
      socket.to(broadcast.broadcaster).emit("watcher", socket.id);
    });

    socket.on("disconnect", () => {
      var room = rooms.filter((r) => r.room === room)[0];

      if (room) {
        socket.to(room.broadcaster).emit("disconnectPeer", socket.id);
      }
    });

    socket.on("offer", (id, message) => {
      socket.to(id).emit("offer", socket.id, message);
    });

    socket.on("answer", (id, message) => {
      socket.to(id).emit("answer", socket.id, message);
    });

    socket.on("candidate", (id, message) => {
      socket.to(id).emit("candidate", socket.id, message);
    });

    socket.on("message-sent", (room, message, user) => {
      var broadcast = rooms.filter((r) => r.room === room)[0];
      io.to(broadcast.room).emit("message-received", user, message);
    });

    socket.on("end", (room) => {
      var broadcast = rooms.filter((r) => r.room === room)[0];
      rooms.splice(broadcast, 1);

      io.to(room).emit("end-broadcast");
    });
  });
};
```

There are three primary roles for the sockets.  First is managing the lifecycle of peer connections.  The broadcaster will create the room and admit viewers to the room.  When a viewer enters they should receive an SDP offer for the RTC connection.  An SDP offer contains information about the tracks already attached to the WebRTC session.  The broadcaster should also be informed if the user is leaving or entering.  Finally, the sockets will manage the chat functionality.  When a viewer wishes to communicate with the broadcaster they can type a message in their browser and it will appear on all clients.  

Tying it all together you will need the server file.  This is the file that `index.js` runs when you first start the application.  The role of `server.js` is to register middleware, start the server, and delegate responsibility to the `socket.js` and `routes.js` files.  Add a new file called `server.js` and put in the following code.  

```javascript
'use strict';

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');

const ExpressOIDC = require('@okta/oidc-middleware').ExpressOIDC;
const session = require('express-session');

const routes = require('./routes');
const sockets = require('./socket');

const start = function (options) {
  return new Promise(function (resolve, reject) {
    process.on('unhandledRejection', (reason, p) => {
      console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
    });

    if (!options.port) {
      reject(new Error('no port specified'));
    }

    const app = express();
    const http = require('http').createServer(app);
    const io = require('socket.io')(http);

    var rooms = [];

    app.use(express.static('public'));
    app.set('views', path.join(__dirname, '/public/views'));
    app.set('view engine', 'pug');

    app.use(bodyParser.urlencoded({ extended: false }));

    app.use(function (error, request, response, next) {
      console.log(error);
      reject(new Error('something went wrong' + error));
      response.status(500).send('something went wrong');
    });

    const oidc = new ExpressOIDC({
      issuer: process.env.OKTA_BASE_URL + '/oauth2/default',
      client_id: process.env.OKTA_CLIENT_ID,
      client_secret: process.env.OKTA_CLIENT_SECRET,
      appBaseUrl: process.env.APP_BASE_URL,
      scope: 'openid profile',
      routes: {
        login: {
          path: '/users/login',
        },
        callback: {
          path: '/authorization-code/callback',
        },
        loginCallback: {
          afterCallback: '/dashboard',
        },
      },
    });

    app.use(
      session({
        secret:
          'asd;skdvmfebvoswmvlkmes";lvmsdlfbvmsbvoibvms"dplvmdmaspviresmpvmrae";vm"psdemr',
        resave: true,
        saveUninitialized: false,
      })
    );

    app.use(oidc.router);

    routes(app, { rooms: rooms });
    sockets(io, rooms);

    const server = http.listen(options.port, function () {
      resolve(server);
    });
  });
};

module.exports = Object.assign({}, { start });
```

The `server.js` file does most of the work for the server-side of the application.  First, it creates a new instance of Express.  It also creates a new instance of socket.io for web sockets.  This file will also register the sockets class you wrote earlier.  To manage the rooms you are passing an array from this file into your sockets and routes.  You will set the view engine to pug and register any routes you may need.  Finally, you will need to register the Okta middleware for authentication and authorization.  

One last thing you want to do is add a file called `.env` and add the following code.

```sh
OKTA_BASE_URL={yourOktaDomain}
OKTA_CLIENT_ID={yourClientId}
OKTA_CLIENT_SECRET={yourClientSecret}
APP_BASE_PORT=8080
APP_BASE_URL=http://localhost:8080
```

Remember to add this file to your `.gitignore` file so you don't push sensitive data into your source control.  

## Add Client Code to the Video Chat Application

Now it's time to add the client-side code.  Create a new folder called `public`.  In that folder add two more folders, `views` and `js`.  First, start with the views.

The first file you want to add is called `layout.pug`.  Add this file to the `views` folder and insert the following code.

```html
block variables

doctype html
html(lang='en')
  head
    meta(charset='utf-8')
    meta(name='viewport' content='width=device-width, initial-scale=1, shrink-to-fit=no')
    script(src="https://code.jquery.com/jquery-3.4.1.min.js" integrity="sha256-CSXorXvZcTkaix6Yvo6HppcZGetbYMGWSFlBw8HfCJo=" crossorigin="anonymous")
    script(src="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/js/bootstrap.min.js", integrity="sha384-JjSmVgyd0p3pXB1rRibZUAYoIIy6OrQ6VrjIEaFf/nJGzIxFDsf4x0xIM+B07jRM", crossorigin="anonymous")
    script(src="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/js/bootstrap.bundle.min.js", integrity="sha384-xrRywqdh3PHs8keKZN+8zzc5TX0GRTLCcmivcbNJWm2rs5C8PRhcEn3czEjhAO9o", crossorigin="anonymous")
    link(href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css", rel="stylesheet", integrity="sha384-ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T", crossorigin="anonymous")
    title #{title}
  body
    div.d-flex.flex-column.flex-md-row.align-items-center.p-3.px-md-4.mb-3.bg-white.border-bottom.box-shadow
      h5.my-0.mr-md-auto Broadcast Yourself
      nav.my-2.my-md-0.mr-md-3
        if user == undefined
          a.p-2.text-dark(href="/users/login") Log In
        else
          a.p-2.text-dark(href="/Dashboard") Home
          a.p-2.text-dark(href="/Broadcast") Broadcast!
          a.p-2.text-dark(href="/users/logout") Logout
    .container
      block content

    footer.pt-4.my-md-5.pt-md-5.border-top
      div.row.text-center
        div.col-8.col-md A #[a(href='https://webrtc.org/') WebRTC] Demo using Web Sockets
      div.row.text-center
        div.col-8.col-md Built with #[a(href='https://expressjs.com/') Express.js], login powered by #[a(href='https://developer.okta.com/') Okta].
      div.row.text-center
        div.col-8.col-md Written by #[a(href='https://profile.fishbowlllc.com') Nik Fisher]
```

The layout file is pretty simple. First, you are including any of your required javascript or style.  For this project, you are using bootstrap because it is nice and simple.  The layout also provides a header and footer for common elements that the entire site will use.  The header checks if the user is populated from the server and displays a login button if there is no user and a logout button if there is.  

Next, add a view for `home.pug` in the `views` folder.

```html
extends layout

block variables
  - var title = 'Home'

block content

    p Hey there, in order to access this page, please
      a(href="/users/login") Login here.
```

The home view extends the layout page you just created and delivers a message to the user that they must log in.

Add another view called `dashboard.pug`.  This view will simply give the user a list of available rooms to join and allow the user to start their broadcast.

```html
extends layout

block variables
  - var title = 'Welcome to Broadcaster'

block content
  .row
    .col-lg-3
      h3 Broadcasters
      if rooms.length == 0
        span there are no broadcasters online
      else
        ul
          each room, i in rooms
            li
              a(href="view/"+room.room ) #{room.user}
    .col-lg-9
      .jumbotron
        h1 Broadcast yourself
        p.lead You can broadcast your own videos here.
        hr.my-4
        p.lead Give it a try
        a(href="Broadcast")
          button.btn.btn-primary Start Broadcasting
```

Finally, you can add the `broadcaster.pug` and `viewer.pug` views.  First, add the following code to `broadcaster.pug`.

```html
extends layout

block variables
  - var title = 'Broadcast yourself'

block content
  div#message
  div#broadcast
    .row
      .col-lg-12.align-self-center.text-center
        video#localVideo(playsinline autoplay muted)
    .row.mb-2
      .col-lg-12
        table#chat-table.table.table-striped
          tr

  script(src="https://cdnjs.cloudflare.com/ajax/libs/socket.io/2.3.0/socket.io.js")
  script(src="https://webrtc.github.io/adapter/adapter-latest.js")
  script(src="..\\js\\broadcaster.js")
  script.
      broadcaster('!{JSON.stringify(user)}')
  ```

The view has a local video that the user can see themselves on.  There is also a table that will display the chat messages as they appear from the viewers.  You will be including scripts for socket.io's client library as well as webRTC's adapter.  You will also include a file called `broadcaster.js` that you will add later.

The `viewer.pug` view looks similar.

```html
extends layout

block variables
  - var title = 'Chat'

block content
  div#message
  div#broadcast
    video#remoteVideo(playsinline autoplay)
    .row.mb-2
      .col-lg-12
        table#chat-table.table.table-striped
          tr
    .row
      .col-lg-10
        input#chat-message(type=text placeholder="enter a message").form-control
      .col-lg-2
        button#chat-button.btn.btn-primary Send

  script(src="https://cdnjs.cloudflare.com/ajax/libs/socket.io/2.3.0/socket.io.js")
  script(src="https://webrtc.github.io/adapter/adapter-latest.js")
  script(src="..\\js\\viewer.js")
  script.
      viewer('!{room}', '!{JSON.stringify(user)}')
```

Of course on this file, you are including `viewer.js` instead of `broadcaster.js`.  This view also includes a form for inputting the chat message and a button for sending it.  

To bring these two views to life, you need to create the JavaScript files for each.  First, you can start by adding `broadcaster.js` to the `public/js` folder.  The code there follows.

```javascript
function broadcaster(data) {
  var socket = io();

  var user = JSON.parse(data);

  const peerConnections = {};
  const localVideo = document.getElementById("localVideo");

  const config = {
    iceServers: [
      {
        urls: ["stun:stun.l.google.com:19302"],
      },
    ],
  };

  navigator.getUserMedia(
    { video: true, audio: true },
    (stream) => {
      if (localVideo) {
        localVideo.srcObject = stream;
        socket.emit("broadcaster", user.sub, user.name);
      }
    },
    (error) => {
      $('#broadcast').remove();
      $('#message').append('<h3>We were unable to detect a webcam</h3>');
      console.warn(error.message);
    }
  );

  socket.on("watcher", (id) => {
    const peerConnection = new RTCPeerConnection(config);
    peerConnections[id] = peerConnection;

    let stream = localVideo.srcObject;
    stream
      .getTracks()
      .forEach((track) => peerConnection.addTrack(track, stream));

    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("candidate", id, event.candidate);
      }
    };

    peerConnection
      .createOffer()
      .then((sdp) => peerConnection.setLocalDescription(sdp))
      .then(() => {
        socket.emit("offer", id, peerConnection.localDescription);
      });
  });

  socket.on("answer", (id, description) => {
    peerConnections[id].setRemoteDescription(description);
  });

  socket.on("candidate", (id, candidate) => {
    peerConnections[id].addIceCandidate(new RTCIceCandidate(candidate));
  });

  socket.on("message-received", (name, message) => {
    console.log(name, message);
    $("#chat-table tr:last").after(
      '<tr><td style="width:20%">' + name + "</td><td>" + message + "</td></tr>"
    );
  });

  socket.on("disconnectPeer", (id) => {
    peerConnections[id].close();
    delete peerConnections[id];
  });

  window.onunload = window.onbeforeunload = () => {
    socket.emit('end', user.sub)
    socket.close();
  };
}
```

This file does all the heavy lifting for the broadcaster.  First, it captures the stream from the client's machine.  This will require the user grant permissions to your site.  It sends a message using the socket connection back to the server which initiates the room creation and lets the dashboard know that there is a new room available.  It also handles the incoming requests as viewers enter the room.  When a viewer enters the room, this sends a message to the server which then sends it back to the broadcaster letting the broadcaster know a new user is there.  The broadcaster page then handles the event by sending an offer to the viewer with the broadcaster's streaming tracks.  

The broadcaster file also handles the messages that are displayed in the chatbox.  When a viewer enters a new message this goes again, to the server then back to the broadcaster.  The broadcaster page then takes the name of the viewer and the message and adds a row to the table so the broadcaster can see the message.

Finally, this page handles what happens when the broadcaster leaves the page.  The `window.onunload` event is handled by sending a message to the server than the broadcaster has ended the stream.  The server will relay that message to the server.  

Finally, you can add the `viewer.js` file.  

```javascript
function viewer(room, data) {

  var user = JSON.parse(data);
  const socket = io.connect(window.location.origin);

  let peerConnection;
  const config = {
    iceServers: [
      {
        urls: ["stun:stun.l.google.com:19302"],
      },
    ],
  };

  const video = document.getElementById("remoteVideo");

  socket.on("offer", (id, description) => {
    peerConnection = new RTCPeerConnection(config);
    peerConnection
      .setRemoteDescription(description)
      .then(() => peerConnection.createAnswer())
      .then((sdp) => peerConnection.setLocalDescription(sdp))
      .then(() => {
        socket.emit("answer", id, peerConnection.localDescription);
      });
    peerConnection.ontrack = (event) => {
      video.srcObject = event.streams[0];
    };
    peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit("candidate", id, event.candidate);
      }
    };
  });

  socket.on("candidate", (id, candidate) => {
    peerConnection
      .addIceCandidate(new RTCIceCandidate(candidate))
      .catch((e) => console.error(e));
  });

  socket.on("broadcaster", () => {
    socket.emit("watcher", room);
  });

  socket.on("disconnectPeer", () => {
    peerConnection.close();
  });

  socket.on("end-broadcast", () => {
    $("#broadcast").remove();
    $('#message').append('<h2>This stream has ended</h2>')
  });

  socket.on("message-received", (name, message) => {
    $("#chat-table tr:last").after(
      '<tr><td style="width:20%">' + name + "</td><td>" + message + "</td></tr>"
    );
  });

  $("#chat-button").on("click", function () {
    var message = $("#chat-message").val();
    socket.emit("message-sent", room, message, user.name);
    $("#chat-message").val("");
  });

  window.onunload = window.onbeforeunload = () => {
    socket.close();
  };

  socket.emit("watcher", room);
}
```

Like `broadcaster.js`, this file will manage the connections between the server and this page.  It includes some logic for sending chat messages as well.  

## Run Your WebRTC Video Chat Application

To start your application you can run `node index.js`.  You should see a message in your console that the application is running on port 8080.  You can then navigate to *localhost:8080* and see the home page.  Use the login button to log in with Okta.  From your dashboard you can click **Start New Broadcast** which will bring you into the *Broadcast* room.  To test the viewer I used chrome and opened a new incognito window.  Again login and, from the dashboard, select the room with your username.  Once you enter the `view` page you should see yourself, but that video is being streamed from your original browser window.  Send a message through the chatbox and switch back to see it.  

{% img blog/webrtc-videochat-javascript/app-running.png alt:"Application Running" width:"700" %}{: .center-image }

## Learn More About Node and Express

If you liked this post, you might also like these other posts on Node and Express:

- [Build A Simple Web App with Node and Postgres](/blog/2019/11/22/node-postgres-simple-webapp)
- [Build and Understand Express Middleware through Examples](/blog/2018/09/13/build-and-understand-express-middleware-through-examples)
- [Use TypeScript to Build a Node API with Express](/blog/2018/11/15/node-express-typescript)

Follow us for more great content and updates from our team! You can find us on [Twitter](https://twitter.com/oktadev), [Facebook](https://www.facebook.com/oktadevelopers), and subscribe to our [YouTube Channel](https://youtube.com/c/oktadev). Questions? Hit us up in the comments below.
