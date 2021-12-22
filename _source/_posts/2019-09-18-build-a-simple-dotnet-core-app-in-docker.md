---
disqus_thread_id: 7640408638
discourse_topic_id: 17139
discourse_comment_url: https://devforum.okta.com/t/17139
layout: blog_post
title: "Build a Simple .NET Core App on Docker"
author: charlie-holland
by: contractor
communities: [.net, devops]
description: "Learn how to containerize your secure .NET Core applications with Docker, the Okta way."
tags: [dotnetcore, docker, dotnet, dot-netcore, csharp, containerization, containers]
tweets:
- "Ever wonder what you can with #Docker + #AspNetCore? Check it out! →"
- "Hey .NET devs, we've got a simple #Docker tutorial for your #AspNetCore apps! →"
- "Docker + .NET Core = <3 →"
image: blog/featured/okta-dotnet-mouse-down.jpg
type: conversion
---

Wouldn't it be great if stuff just worked? Especially in the ever-changing world of software. Chasing dependency issues and debugging arcane operating system errors - not a good use of time.

One important aspect of "stuff just works" -- reliability. Recently, the software community has made strides in test-driven development and continuous integration processes to drive up quality, and of course, that improves reliability. But it can only go so far. Operating systems perform many functions and incorporate many features, so running them reliably is a huge task. The core secret to improving reliability is fewer moving parts. In this post, I'll cover how you can use Docker to run your application in an isolated, minimal environment with fewer moving parts.

## Sample App Dependencies: ASP.Net Core and Docker Packages

To build an app in Docker, first we need an app to Dockerize. This tutorial uses the  ASP.Net Core project from a previous blog post on [Adding Login to Your ASP.NET Core MVC App](/blog/2018/10/29/add-login-to-you-aspnetcore-app).
That blog post shows you how to build a simple .Net Core application that uses Okta for Identity Management. You should work through that blog post, or at very least read it and clone the repo.

You'll also need:

> * [Docker](https://docs.docker.com/v18.09/install/)
> * [Docker Compose](https://docs.docker.com/compose/install/)
> * [OpenSSL](https://www.openssl.org/)

## Build the ASP.NET Core Application

Docker allows you to build an application in pretty much the same way you would create an application to run on your local machine. To get started quickly, clone this git repo:

```bash
git clone https://github.com/oktadeveloper/okta-aspnet-mvc-core-sqlite-example.git
```

### Configure Identity Management for Your ASP.NET Core App

First things first, set up an application that will provide us with identity management using the Okta developer console:

1. Log into The Okta Developer Console
2. Select **Applications** from the top menu
3. Click the **Add Application** button
4. Select **Web** as the platform and click **Next**
5. On the **Settings** page:
    * Name: MyOktaApp
    * Base URIs: `https://localhost:5001`
    * Login Redirect URIs: `https://localhost:5001/authorization-code/callback`
6. Click **Done** to create the application

Once you've created the app, click **Edit** to change a few settings:

* Logout redirect URIs: `https://localhost:5001/signout-callback-oidc`
* Initiate login URI: `https://localhost:5001/authorization-code/callback`

At the bottom of the page, you'll see Client Credentials, including a ClientID and a Client secret. Take note of these for later use.

## Update the Settings in the ASP.NET Core App

The sample application you created has identity management configuration stored in `appsettings.json`, unless you cloned the repo above rather than working through the complete post. In real life, you shouldn't store this configuration in your source code for security reasons. In this post, we will demonstrate how to reliably pass dynamic configuration to your application, and close this security gap. Start by removing the settings.

Edit `appsettings.json` to remove:

```json
"Okta": {
    "ClientId": "{OktaClientId}",
    "ClientSecret": "{OktaClientSecret}",
    "Domain": "https://{yourOktaDomain}.okta.com"
},
```

To test this change:

```bash
dotnet run
```

Should return:

```bash
An exception of type 'System.ArgumentNullException' occurred in Okta.AspNet.Abstractions.dll but was not handled in user code: 'Your Okta URL is missing. Okta URLs should look like: https://{yourOktaDomain}. You can copy your domain from the Okta Developer Console.'
```

Nice work!

## Use Docker to Containerize the ASP.NET Core App

Docker is a collection of virtualization technologies wrapped up in an easy to use package. Don't let "virtualization" trip you up, though. Docker doesn't deal with virtual machines; instead, it works by sharing a kernel between multiple isolated containers. Each one of these containers operates utterly unaware of other containers that may be sharing the same kernel. Virtual machines, in contrast, run multiple discrete operating systems on top of a virtualized hardware platform that, itself, runs atop the host operating system. Docker is much more lightweight, and many Docker containers can run on a single host machine.

## Build the ASP.NET Core App Using Docker

Let's put Docker to work. The key to Dockerizing an application is the `Dockerfile`. Add one to the root of your project with the following contents to get started:

```bash
FROM mcr.microsoft.com/dotnet/core/sdk:2.2 AS build
WORKDIR /src
COPY ["OktaMvcLogin.csproj", "./"]
RUN dotnet restore "./OktaMvcLogin.csproj"
COPY . .
RUN dotnet build "OktaMvcLogin.csproj" -c Release -o /app
```

The uppercase words are Docker commands. There aren't many of them, and you can find the details of them all at [Docker's website](http://docker.io).

`FROM` tells Docker which image you want to use for your container. An image is a compressed file system snapshot. Also, the result of building a `Dockerfile` is a new image. So, one way to look at a `Dockerfile` is as a series of transformations that convert one image into another image that includes your application.

* `WORKDIR` tells Docker which directory to use for performing subsequent commands.
* `COPY` tells Docker to copy a file from your local filesystem into the container image.
* `RUN` executes commands within the container image.

So, in plain English - this `Dockerfile` is based on the `dotnet/core/sdk` image hosted at `mcr.microsoft.com`. Docker copies the `.csproj` file from your local working directory to create your image and `dotnet restore` restores all the referenced packages. Once that's done, Docker copies the remaining files from your working directory, then `dotnet build` creates a **Release** build at `/app`.

## Manage Dependencies Efficiently with Docker

Reading this, you may be thinking, why bother to copy the project file and run `restore` before copying the source code and running `build`? Why not copy everything then build and restore in one step? The answer is caching. Every time a `Dockerfile` modifies the docker image, Docker creates a snapshot.  If you copy a file or run a command to install a package, Docker captures the differences in a new snapshot. Docker then caches and reuses the snapshots if the image hasn't changed. So, by restoring dependencies as a separate step, the image snapshot can be reused for every build, as long as the dependencies haven't changed. This process speeds up the build considerably since downloading dependencies can take some time.

## Run the ASP.NET Core App in a Docker Container

As mentioned above, a `Dockerfile` can be considered a series of filesystem transformations. Your current file transforms the Microsoft-provided SDK container into a new container with both the Microsoft SDK and a release build of your application stored at `/app`.

Try this out::

```bash
# Build an image using the Dockerfile in the current directory
docker build --target build -t oktamvclogin .
# Run the image, executing the command 'ls /app'
docker run -it oktamvclogin ls /app
```

You'll see that the `app` folder in your container image contains the Release build output for your project.

## Remove ASP.NET Core Development Tools from Your Docker Image

So far, you've built your application within a Docker container. Nice work!

However, remember Docker, as a tool, reduces the number of moving parts in your application. To improve reliability by eliminating unnecessary dependencies, we also need to remove development tools, which can cause conflicts and open security risks. The Microsoft-provided SDK image includes development tools, so let's look at how to get rid of them.

Add the following lines to your `Dockerfile`:

```bash
FROM build AS publish
RUN dotnet publish "OktaMvcLogin.csproj" -c Release -o /app

FROM mcr.microsoft.com/dotnet/core/aspnet:2.2 AS base
WORKDIR /app
EXPOSE 5001

FROM base AS final
WORKDIR /app
COPY --from=publish /app .
ENTRYPOINT ["dotnet", "OktaMvcLogin.dll"]
```

You will see a few `FROM` commands, each with an `AS` clause. This syntax provides multi-stage builds, the key to getting rid of unnecessary dependencies. In plain English, your build process is now:

1. Use the SDK image to create a release build of the application. Call this stage 'build'
2. Use the 'build' stage image to publish the application to the 'app' folder. Call this stage 'publish'
3. Download the Microsoft-provided ASP.NET core image, which has only runtime components. Call this stage 'base'
4. Using the 'base' stage image, copy the contents of the 'app' directory from the 'publish' stage. Call this stage 'final'

So, your `Dockerfile` now uses the SDK image to build your application, then discards that image and uses a runtime image to run the application.

## Run the ASP.NET Core Application in Docker

The `ENTRYPOINT` command merits special attention. So far you've seen how Dockerfiles define a series of filesystem transformations, but more often than not, a Docker container is executable. By that, I mean that you run the container in Docker, and the result is a fully configured, running application. `ENTRYPOINT` is one of the mechanisms that make that work. When you run a container, Docker executes the command specified by the `ENTRYPOINT`. In the case of your application, that command is `dotnet OktaMVCLogin.dll`.

So now...

```bash
docker build -t oktamvclogin .
docker run oktamvclogin
```

... throws the same exception as before:

```bash
Unhandled Exception: System.ArgumentNullException: Your Okta URL is missing. Okta URLs should look like: https://{yourOktaDomain}. You can copy your domain from the Okta Developer Console.
```

Only this time, it's Dockerized. How's that for progress?

The application doesn't work because you removed the sensitive configuration from `appsettings.json`.

## Pass Configuration to Docker

To fix this problem, we need to pass configuration to the Docker container as environment variables. ASP.NET Core picks up all environment variables prefixed with `ASPNETCORE_` and converts `__` into `:`. To pass the configuration values for `Okta:ClientId`, `Okta:ClientSecret` and `Okta:Domain` modify your command like this:

```bash
docker run -e ASPNETCORE_Okta__ClientId="{yourClientId}" \
-e ASPNETCORE_Okta__ClientSecret="{yourClientSecret}" \
-e ASPNETCORE_Okta__Domain="https://{yourOktaDomain}" \
oktamvclogin
```

This time the result will be a bit healthier:

```bash
Hosting environment: Production
Content root path: /app
Now listening on: 'http://[::]:80'
Application started. Press Ctrl+C to shut down.
```

**NOTE**: you may also see a 'No XML Encryptor' warning. You can ignore that for this walkthrough.

## Configure Docker Networking

From this message, you might think you could go to `http://localhost` and see your app in all its glory. However, your app runs in a container and listens on port 80 but, by default, your local machine cannot access port 80 on your container. Remember, your container runs in its own little world. That world has its own virtual network, and it's locked down by default.

Thankfully, you can quickly get access to your container's virtual network by mapping a port on your local machine to a port on your container.

```bash
docker run -e ASPNETCORE_Okta__ClientId="{yourClientId}-" \
-e ASPNETCORE_Okta__ClientSecret="{yourClientSecret}" \
-e ASPNETCORE_Okta__Domain="{yourOktaDomain}" \
-p 5001:80 \
oktamvclogin
```

Now, if you open a browser and go to `http://localhost:5001` (because you mapped port 5001 to port 80 in your container), Et voila!

**NOTE**: this approach is suitable for development. However, for production workloads, Docker offers a comprehensive set of options designed for managing virtual networks. For more information see [the networking overview in Docker's documentation](https://docs.docker.com/network/).

## Configure SSL/TLS for Your Docker Image

If you click on the **Login** link in your application, chances are you'll get an error from Okta with a message:

```bash
Description: The 'redirect_uri' parameter must be an absolute URI that is whitelisted in the client app settings.
```

This problem happens because when you configured the application in the Okta dashboard, you specified that the redirect URL was HTTPS. Now, since you accessed the site using HTTP, the redirect URL doesn't match, and you get this error. One solution is to update the redirect URL in the Okta application. While that will work, it's a bad idea. The redirect contains sensitive information and to prevent it from being read while in transit, it should be protected using a TLS channel.

### Create a self-signed certificate

To set up TLS, you'll need a certificate. In real life, you'd buy one from a reputable provider, but for this walkthrough, a self-signed certificate will do the job.

Generate a certificate:

```bash
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365
```

To use the certificate with Kestrel (the ASP.NET Core webserver), we need to create a `pfx` file that has both the public and private keys. You can do that using:

```bash
openssl pkcs12 -export -out webserver.pfx -inkey key.pem -in cert.pem
```

As part of the certificate creation process, you'll be prompted to create an Export password. Be sure to take note of this as you'll need it later to use the certificate. You'll also be walked through the configuration process (_Country Name_, _State or Province_, etc.).

### Add the certificate to the Docker image

You've created a certificate in your local filesystem. To use it in your Docker container, modify the Dockerfile to copy it into the final image.

Change the `final' stage to:

```bash
FROM base AS final
ENV ASPNETCORE_URLS="https://+"
ENV ASPNETCORE_Kestrel__Certificates__Default__Path="./webserver.pfx"

WORKDIR /app
COPY --from=publish /app .
COPY webserver.pfx .
ENTRYPOINT ["dotnet", "OktaMvcLogin.dll"]
```

Setting the ASPNETCORE_URLS environment variable to `https://+` ensures that the webserver only listens for https requests.

Since you've changed the Dockerfile, you can rebuild the image and run it:

```bash
docker build -t oktamvclogin .
docker run -e ASPNETCORE_Okta__ClientId="{yourClientId}" \
-e ASPNETCORE_Okta__ClientSecret="{yourClientSecret}" \
-e ASPNETCORE_Okta__Domain="{yourOktaDomain}" \
-e ASPNETCORE_Kestrel__Certificates__Default__Password="{yourExportPassword}" \
-p 5001:443 \
oktamvclogin
```

Notice the additional environment variable with the certificate export password and also, that the port mapping has changed from port 80 to port 443.

You can now navigate to `https://localhost:5001`, and this time, you'll be able to log in and use the sample application correctly.

NOTE: Since you're using a self-signed certificate, your browser may display a warning page. You can safely ignore this warning.

## Not the Best Way to Start Your Docker Container

Converting an application to run in Docker is relatively straightforward and offers significant benefits. However, passing a whole load of configuration to `docker run` isn't particularly user-friendly and is error-prone. Thankfully, the good folks at Docker have already come up with a solution to this problem - `docker-compose`.

Using Docker Compose is pretty straightforward. Create a file named `docker-compose.yml` in the same folder as your `Dockerfile` and source code and add the following:

```yaml
version: "3"
services:
  web:
    build: .
    image: oktamvclogin
    ports:
      - "5001:443"
    environment:
      - ASPNETCORE_Okta__ClientId: "{yourClientId}"
      - ASPNETCORE_Okta__ClientSecret: "{yourClientSecret}"
      - ASPNETCORE_Okta__Domain: "{yourOktaDomain}"
      - ASPNETCORE_Kestrel__Certificates__Default__Password: "{yourExportPassword}"
```

The `docker-compose` file contains all values you previously passed to the `docker run` command.

Now, to run the application:

```bash
docker-compose up
```

And it all just works. Happy days.

Of course, this is barely scratching the surface of what you can do with Docker Compose. To find out more, check out [the official overview of Docker Compose](https://docs.docker.com/compose/)

## Containerize and configure an ASP.NET Core app with Docker

By working through this post, you've learned how to:

* Containerize an ASP.NET Core application with Docker
* Pass configuration to a Docker container
* Configure SSL/TLS for a containerized ASP.NET Core application
* Use `docker-compose` to efficiently run a Docker container with a particular configuration

Now, by including a `Dockerfile` along with your source code, any developer can build your app -- reliably. They can build it in any environment, as long as they have Docker installed, and it will work in precisely the same way. Every time, without exception. No dependency issues, no operating system hassles. It will just work. Not only that, but you can deploy the same container directly to production without any further modification.

## Learn More About Docker and ASP.NET Core

If you want to learn more about ASP.NET Core, Okta, or Docker, check out these other posts!

* [A Developer's Guide to Docker - A Gentle Introduction](/blog/2017/05/10/developers-guide-to-docker-part-1)
* [A Developer's Guide to Docker - The Dockerfile](/blog/2017/08/28/developers-guide-to-docker-part-2)
* [A Developer's Guide to Docker - Docker Compose](/blog/2017/10/11/developers-guide-to-docker-part-3)
* [Add Login to Your ASP.NET Core MVC App](/blog/2018/10/29/add-login-to-you-aspnetcore-app)

As usual, if you have any questions about this post, leave them in the comments below. To get Okta's developer content, follow us on [Twitter](https://www.twitter.com/oktadev) and subscribe to our [YouTube channel](https://www.youtube.com/c/oktadev)!
