---
layout: blog_post
title: "React + Docker with Security in 10 Minutes"
author: matt-raible
by: contractor
communities: [javascript]
description: "This tutorial shows you how to package a React app with Docker and make it secure in 10 minutes."
tags: [docker, react, websecurity]
tweets:
- "Learn how to use Docker to containerize your React app and deploy it to @heroku!"
- "🔥 Tutorial: Learn how to combine @reactjs + @docker and deploy to @heroku!"
- "🚀 @Heroku is awesome for production! Especially with React + Docker. 👇"
image: blog/react-docker/react-docker-security.png
type: conversion
---

You've built a React app, but now you need to deploy it. What do you do? First of all, you should probably consider a cloud provider since they're typically low-cost and easy to deploy to.

Most cloud providers offer a way to deploy a static site. A built React app is just JavaScript, HTML, and CSS. They're static files that can live on pretty much any web server. In fact, with JSX (HTML in JS) and Styled Components, you could even say _it's just JavaScript_!

Docker is the de facto standard to build and share containerized applications. You can use it to package your apps and include many open source web servers to serve up your app. As an added bonus, you can configure the web server to send security headers that make your app more secure.

**Prerequisites:**

* [Node 12](https://nodejs.org/)+
* [Docker](https://docs.docker.com/install/)
* An [Okta Developer Account](https://developer.okta.com/signup/)

**Table of Contents**{: .hide }
* Table of Contents
{:toc}

## Create a React App

Rather than showing you how to build a React app, I'm going to cheat and use one that a colleague of mine already built. Clone the repo to begin.

```shell
git clone https://github.com/oktadeveloper/okta-react-styled-components-example.git react-docker
cd react-docker
npm install
```

This is a React app that uses Styled Components for its CSS and is secured by OpenID Connect (aka OIDC). You can read about how it was created in [Build a React App with Styled Components](https://developer.okta.com/blog/2020/03/16/react-styled-components).

Log in to your Okta developer account (you [created one](https://developer.okta.com/signup/), right?) to register this app and enable OIDC authentication. 

1. Go to **Applications** in the top menu 
2. Select **Add Application** > **Single-Page App** and click **Next**
3. On the settings screen, give your app a name like `React Docker`
4. Make sure the ports are set to `3000` and the **Login redirect URI** is `http://localhost:3000/callback`
5. Click **Done**

The resulting screen will provide you with a client ID.

{% img blog/react-docker/okta-app-settings.png alt:"Okta App Settings" width:"700" %}{: .center-image }

Copy and paste the client ID into your application's `src/App.js`.
The value for `<yourIssuerURI>` can be found in your Okta dashboard, under **API** > **Authorization Servers**. For example, mine is `https://dev-133320.okta.com/oauth2/default`. 

```jsx
function App() {
  return (
    <Router>
      <Security issuer='<yourIssuerURI>'
                clientId='<yourClientId>'
                redirectUri={window.location.origin + '/callback'}
                pkce={true}>
        <SecureRoute path='/' exact={true} component={Calendar}/>
        <Route path='/callback' component={LoginCallback}/>
      </Security>
    </Router>
  );
}
```

_The `<>` brackets are just placeholders, so make sure to remove them!_

Start your app with `npm start`. You'll be redirected to Okta to authenticate, then back to your app. If you're not redirected, it's because you're already logged in. Try again in a private window to see the login process.

You should see a calendar that looks pretty good, with today's date selected. 

{% img blog/react-docker/calendar.png alt:"Calendar" width:"800" %}{: .center-image }

I'll admit, it's a very simple app, but it'll do for demonstrating how to containerize with Docker.

## Why Docker?

You might ask, "Why Docker? Doesn't that complicate things"?

Yes, I agree. Doing it with Docker is more complicating than doing a `firebase deploy` or `git push` for Heroku. However, it also gives you more control in case you _really_ want to complicate things and manage your app with Kubernetes. 😛

## Create a Dockerfile and Nginx Configuration

Create a `Dockerfile` in your root directory.

```dockerfile
FROM node:14.1-alpine AS builder

WORKDIR /opt/web
COPY package.json package-lock.json ./
RUN npm install

ENV PATH="./node_modules/.bin:$PATH"

COPY . ./
RUN npm run build

FROM nginx:1.17-alpine
RUN apk --no-cache add curl
RUN curl -L https://github.com/a8m/envsubst/releases/download/v1.1.0/envsubst-`uname -s`-`uname -m` -o envsubst && \
    chmod +x envsubst && \
    mv envsubst /usr/local/bin
COPY ./nginx.config /etc/nginx/nginx.template
CMD ["/bin/sh", "-c", "envsubst < /etc/nginx/nginx.template > /etc/nginx/conf.d/default.conf && nginx -g 'daemon off;'"]
COPY --from=builder /opt/web/build /usr/share/nginx/html
```

This will build your project and add Nginx as a web server. It'll also install a version of `envsubst` that allows you replace variables with environment variables, and set default values.

Create an `nginx.config` in the same directory:

```config
server {
    listen       ${PORT:-80};
    server_name  _;

    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $$uri /index.html;
    }
}
```

This file configures Nginx to serve your React app as a SPA (where all routes go to `index.html`) and run on port 80, unless `PORT` is defined as an environment variable. There's two `$$` in front of `uri` to prevent `$uri` from getting replaced with a blank value.

## Build a Docker Image with Your React App

Make sure your Docker daemon is running with `docker ps`. Then run the following command to build your Docker image. The `react-docker` value can be whatever you want to name your image.

```shell
docker build -t react-docker .
```

When the process completes, you'll see messages like the following:

```shell
Successfully built 3211a1255527
Successfully tagged react-docker:latest
```

## Run Your Docker + React App

You can now run your React app via Docker on port 3000 using the `docker run` command.

```shell
docker run -p 3000:80 react-docker
```

If you find these `docker` commands hard to remember, you can add a couple scripts to your `package.json` file.

```json
"build-docker": "docker build -t react-docker .",
"docker": "docker run -p 3000:80 react-docker"
```

You'll be likely be logged in automatically.

**TIP:** If you want to see an example that doesn't log you in right away, see our [Okta React + Okta Hosted Login Example](https://github.com/okta/samples-js-react/tree/master/okta-hosted-login).

Pretty slick, eh?! You dockerized your React app in just a few minutes. 🎉

## Deploy Your React App to Heroku

Your app doesn't really exist until it's in production, so let's deploy it to Heroku. First, I'll show you can do it without Docker.

To begin, you'll need [a Heroku account](https://signup.heroku.com/login). Then, install the [Heroku CLI](https://devcenter.heroku.com/articles/heroku-cli). 

Open a terminal, log in to your Heroku account, and create a new app.

```shell
heroku login
heroku create
```

You should now have a new `heroku` Git remote repository. You can confirm this with `git remote -v`.

Create a `static.json` file in your root directory with security headers and redirect all HTTP request to HTTPS.

```json
{
  "headers": {
    "/**": {
      "Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self' https://*.okta.com;",
      "Referrer-Policy": "no-referrer, strict-origin-when-cross-origin",
      "Strict-Transport-Security": "max-age=63072000; includeSubDomains",
      "X-Content-Type-Options": "nosniff",
      "X-Frame-Options": "DENY",
      "X-XSS-Protection": "1; mode=block",
      "Feature-Policy": "accelerometer 'none'; camera 'none'; microphone 'none'"
    }
  },
  "https_only": true,
  "root": "build/",
  "routes": {
    "/**": "index.html"
  }
}
```

For `static.json` to be read, you have to use the [Heroku static buildpack](https://github.com/heroku/heroku-buildpack-static).

Commit your changes to Git, add the Node.js + static buildpacks, and deploy your React app.

```shell
git commit -am "Configure secure headers and static buildpack"
heroku buildpacks:set heroku/nodejs
heroku buildpacks:add https://github.com/heroku/heroku-buildpack-static.git
git push heroku master
```

Once the process completes, open your app in a browser using:

```shell
heroku open
```

You'll be redirected to Okta and likely see the following error:

```
The 'redirect_uri' parameter must be an absolute URI that is whitelisted in the client app settings.
```

To fix this, you need to modify your Okta app to add your Heroku URL as a **Login redirect URI**. For example, `https://gentle-peak-37809.herokuapp.com/callback`.

You should now be able to log in and see your app running on Heroku! You can verify its security headers are A-OK on <https://securityheaders.com>.

{% img blog/react-docker/headers-buildpack.png alt:"Security headers with Node.js and static buildpacks" width:"800" %}{: .center-image }

In this deployment example, buildpacks do all the work for you. However, not every cloud provider has buildpacks. This is where Docker comes in.

## Deploy Your Docker + React App to Heroku

Heroku has a couple slick features when it comes to Docker images. If your project has a `Dockerfile`, you can deploy your app directly using the [Heroku Container Registry](https://devcenter.heroku.com/articles/container-registry-and-runtime).

First, log in to the Container Registry.

```shell
heroku container:login
```

Then, create a new app.

```
heroku create
```

Add the Git URL as a new remote to your app.

```shell
git remote add docker https://git.heroku.com/<your-app-name>.git
```

Then, push your Docker image to Heroku's Container Registry.

```shell
heroku container:push web --remote docker
```

Once the process has completed, release the image of your app:

```shell
heroku container:release web --remote docker
```

And, open the app in your browser:

```
heroku open --remote docker
```

You'll need to add your app's URI in Okta before you can log in.

### Improve Security Headers for Nginx in Docker

If you test your new Nginx in Docker site on [securityheaders.com](https://securityheaders.com/), you'll get an **F**. 

To solve this, modify your `nginx.config` to add security headers.

```config
server {
    listen       ${PORT:-80};
    server_name  _;

    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $$uri /index.html;
    }

    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self' https://*.okta.com;";
    add_header Referrer-Policy "no-referrer, strict-origin-when-cross-origin";
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains";
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header X-XSS-Protection "1; mode=block";
    add_header Feature-Policy "accelerometer 'none'; camera 'none'; microphone 'none'";
}
```

After updating this file, run the following commands:

```shell
heroku container:push web --remote docker
heroku container:release web --remote docker
```

Now you should get an **A**!

{% img blog/react-docker/headers-docker-nginx.png alt:"Security headers with Docker + Nginx" width:"800" %}{: .center-image }

## Use Buildpacks to Build Your Docker Images

You learned two ways to deploy your React app to Heroku. The first is to utilize buildpacks and `git push`. The second is to use Heroku's Container Registry and `heroku container:push` + `heroku push:release`. 

[Cloud Native Buildpacks](https://buildpacks.io/) is an initiative that was started by Pivotal and Heroku in early 2018. It has a [`pack` CLI](https://github.com/buildpacks/pack) that allows you to build Docker images using buildpacks.

To try it out, you'll first need to [install `pack`](https://buildpacks.io/docs/install-pack/). If you're on a Mac or Linux, you can use Homebrew. 

```shell
brew tap buildpack/tap
brew install pack
```

If you're on Windows, you can [install its executable](https://github.com/buildpacks/pack/releases/download/v0.10.0/pack-v0.10.0-windows.zip).

In the previous buildpacks example, I used Heroku's Node.js buildpack and their static buildpack.

The Heroku static buildpack isn't a "Cloud Native" buildpack. It uses the old (pre-cloud-native) API. That means it doesn't work with `pack` out of the box.

Luckly, Heroku does offer a [cnb-shim](https://github.com/heroku/cnb-shim) you can use to make it work.

```shell
# Clone the static buildpack in your home directory
cd ~
git clone https://github.com/heroku/heroku-buildpack-static.git
cd heroku-buildpack-static

# Install cnb-shim
curl -L https://github.com/heroku/cnb-shim/releases/download/v0.2/cnb-shim-v0.2.tgz | tar xz

cat > buildpack.toml << TOML
[buildpack]
id = "heroku.static"
version = "0.1"
name = "Static"

[[stacks]]
id = "heroku-18"
TOML

bin/install buildpack.toml https://github.com/heroku/heroku-buildpack-static/archive/v3.tar.gz
```

Now you can build a Docker image that uses the same buildpacks as you used on Heroku:

```shell
cd ~/react-docker
pack build react-pack --builder heroku/buildpacks \
  --buildpack ~/heroku-buildpack-static
```

Once the process completes, you should be able to run it.

```shell
docker run -p 3000:80 react-pack
```

## Deploy Your Docker Image to Docker Hub

You can easily share your Docker containers by deploying them to a registry, like Docker Hub. If you don't already have a Docker Hub account, you can [create one](https://hub.docker.com/signup).

Once you have an account, log in and push your image.

```shell
docker login
docker image tag react-docker <your-username>/react-docker
docker push <your-username>/react-docker
```

Then someone else could pull and run it using:

```shell
docker run -p 3000:80 <your-username>/react-docker
```

**NOTE:** You can use `react-docker` or `react-pack` in the above command.

## Learn More About React and Docker

In this tutorial, you learned how to use Docker to containerize your React application. You can do this manually with `docker build` or use Heroku's Container Registry to push and release projects with a `Dockerfile`. You can also use the `pack` command to leverage Cloud Native + Heroku buildpacks when building a container.

You can find the source code for this example on GitHub at [oktadeveloper/okta-react-docker-example](https://github.com/oktadeveloper/okta-react-docker-example).

The Okta developer blog and YouTube channel has more information on Docker and React.

* [Build Reusable React Components](https://developer.okta.com/blog/2020/01/20/build-reusable-react-components)
* [How to Move from Consuming Higher-Order Components to React Hooks](https://developer.okta.com/blog/2020/05/01/move-from-higher-order-components-to-react-hooks)
* [Build a CRUD Application with Kotlin and React](https://developer.okta.com/blog/2020/01/13/kotlin-react-crud)
* [📺 A Developer's Guide to Docker](https://youtu.be/t5yqLJfbnqM)

If you liked this tutorial, please follow [@oktadev on Twitter](https://twitter.com/oktadevs) or [subscribe to our YouTube channel](https://youtube.com/c/oktadev). If you have any questions, please leave a comment below or [ping me on Twitter](https://twitter.com/mraible).

_A huge thanks goes to Heroku's [Joe Kutner](https://twitter.com/codefinger) for his review and detailed feedback._

