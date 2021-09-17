---
layout: blog_post
title: "Full Stack Java with React, Spring Boot, and JHipster"
author: matt-raible
by: advocate
communities: [java,javascript]
description: ""
tags: []
tweets:
- ""
- ""
- ""
image:
type: conversion
---

If you search for "Full Stack Java" on the internet, you'll likely find a lot of recruiting, courses, and jobs. Being a full stack developer can be exciting because you're learning and using a bunch of technologies. It also pays pretty well. Today, I'm going to show you how you can be a full stack Java developer with Spring Boot, React, and JHipster.

If you haven't heard of JHipster, boy do I have a treat for you! JHipster started as a Yeoman application generator back in 2013 and has grown to become a development platform. It allows you to quickly generate, develop, and deploy modern web apps and microservice architectures. Today, I'll show you how to build a Flickr clone with it and lock it down with OAuth and OpenID Connect (OIDC).

**Prerequisites:**

- [Node.js 14+](https://nodejs.org/)
- [Java 11+](https://sdkman.io)

**Table of Contents**{: .hide }
* Table of Contents
{:toc}

## Full Stack Development with React and Spring Boot

One of the easiest ways to get started with React is by using [Create React App](https://create-react-app.dev/) (CRA). You install it locally, then run `create-react-app <project>` to generate a React application with minimal dependencies. It uses webpack under-the-covers to build the project, launch a web server, and run its tests.

Spring Boot has a similar tool, called [Spring Initializr](https://start.spring.io/). Spring Initializer is a bit different than CRA because it's a website (and API) that you can create applications with.

Today, I'll show you how to build a Flickr clone with React and Spring Boot. However, I'm going to cheat. Rather than building everything using the aforementioned tools, I'm going to use JHipster. JHipster is an application generator that initially only supported Angular and Spring Boot. Now it supports Angular, React, and Vue for the frontend. JHipster also has support for [Kotlin, Micronaut, Quarkus, .NET, and Node.js](https://www.jhipster.tech/modules/official-blueprints/) on the backend.

In this tutorial, we'll use React since it seems to be [the most popular](https://trends.google.com/trends/explore?q=angular,react,vuejs). 

## Get Started with JHipster 7

To get started with JHipster, you'll need a fast internet connection and Node.js installed. The project recommends you use the latest LTS (Long Term Support) version, which is 14.7.6 at the time of this writing. To run the app, you'll need to have Java 11 installed. If you have Git installed, JHipster will auto-commit your project after creating it. This will allow you to upgrade between versions.

Run the following command to install JHipster:

```shell
npm i -g generator-jhipster@7
```

To create a full-stack app with JHipster, create a directory, and run `jhipster` in it:

```shell
mkdir full-stack-java
cd full-stack-java
jhipster
```

JHipster will prompt you for the type of application to create and what technologies you'd like to include. For this tutorial, make the following choices:

| Question | Answer |
|---|---|
| Type of application? | `Monolithic application` |
| Name? | `flickr2` |
| Spring WebFlux? | `No` |
| Java package name? | `com.auth0.flickr2`  |
| Type of authentication? | `OAuth 2.0 / OIDC` |
| Type of database? | `SQL` |
| Production database? | `PostgreSQL` |
| Development database? | `H2 with disk-based persistence` |
| Which cache? | `Ehcache` |
| Use Hibernate 2nd level cache? | `Yes` |
| Maven or Gradle? | `Maven` |
| Use the JHipster Registry? | `No` |
| Other technologies? | `<blank>` |
| Client framework? | `React` |
| Admin UI? | `Yes` |
| Bootswatch theme? | `United` > `Dark` |
| Enable i18n? | `Yes` |
| Native language of application? | `English` |
| Additional languages? | `Portuguese (Brazilian)` |
| Additional testing frameworks? | `Cypress` |
| Install other generators? | `No` |

Press `Enter` and JHipster will create your app in the current directory and run `npm install` to install all the dependencies specified in `package.json`.

### Verify Everything Works with Cypress and Keycloak

When you choose OAuth 2.0 and OIDC for authentication, the users are stored outside of the application, rather than in it. You need to configure an identity provider (IdP) to store your users and allow your app to retrieve information about them. By default, JHipster ships with a Keycloak file for Docker Compose. A default set of users and groups is imported at startup, and it has a client registered for your JHipster app.

Here's what the keycloak.yml looks like in your app's src/main/docker directory:

```yaml
# This configuration is intended for development purpose, it's **your** responsibility to harden it for production
version: '3.8'
services:
  keycloak:
    image: jboss/keycloak:14.0.0
    command:
      [
        '-b',
        '0.0.0.0',
        '-Dkeycloak.migration.action=import',
        '-Dkeycloak.migration.provider=dir',
        '-Dkeycloak.migration.dir=/opt/jboss/keycloak/realm-config',
        '-Dkeycloak.migration.strategy=OVERWRITE_EXISTING',
        '-Djboss.socket.binding.port-offset=1000',
        '-Dkeycloak.profile.feature.upload_scripts=enabled',
      ]
    volumes:
      - ./realm-config:/opt/jboss/keycloak/realm-config
    environment:
      - KEYCLOAK_USER=admin
      - KEYCLOAK_PASSWORD=admin
      - DB_VENDOR=h2
    # If you want to expose these ports outside your dev PC,
    # remove the "127.0.0.1:" prefix
    ports:
      - 127.0.0.1:9080:9080
      - 127.0.0.1:9443:9443
      - 127.0.0.1:10990:10990
```

Start Keycloak with the following command in a terminal window.
[Install Docker Compose](https://docs.docker.com/compose/install/) if you don't already have it.

```shell
docker-compose -f src/main/docker/keycloak.yml up
```

You can verify everything works by starting your app with Maven:

```shell
./mvnw
```

Open another terminal to run the Cypress tests:

```shell
npm run e2e
```

You'll should see output like the following:

```shell
  (Run Finished)

       Spec                                              Tests  Passing  Failing  Pending  Skipped
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  administration/administration.spec.      00:08        5        5        -        -        - │
  │    ts                                                                                          │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        00:08        5        5        -        -        -
```

## Change your Identity Provider to Auth0

JHipster uses Spring Security's OAuth 2.0 and OIDC support to configure which IdP it uses. When using Spring Security with Spring Boot, you can configure most settings in a properties files. You can even override properties with environment variables.

To switch from Keycloak to Auth0, you only need to override the default properties (for Spring Security OAuth). You don't even need to write any code!

To see how it works, create a `.auth0.env` file with the following script:

```shell
export SPRING_SECURITY_OAUTH2_CLIENT_PROVIDER_OIDC_ISSUER_URI=https://<your-auth0-domain>/
export SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_OIDC_CLIENT_ID=<your-client-id>
export SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_OIDC_CLIENT_SECRET=<your-client-secret>
export JHIPSTER_SECURITY_OAUTH2_AUDIENCE=https://<your-auth0-domain>/api/v2/
```

**WARNING:** Modify your existing `.gitignore` file to have `*.env` so you don't accidentally check in your secrets!

You'll need to create a new web application in Auth0 and fill in the `<...>` placeholders before this works. Once you've done that, you can run the following command to set these environment variables.

```shell
source ~/.auth0.env
```

**NOTE:** If you're on Windows, you may need to install the [Windows Subsystem for Linux](https://docs.microsoft.com/en-us/windows/wsl/about) for this command to work.

Restart your app and _voilà_ - your app is now using Auth0!

### Create an OpenID Connect App on Auth0

Log in to your Auth0 account (or [sign up](https://auth0.com/signup) if you don't have an account). You should have a unique domain like `dev-xxx.eu.auth0.com`. 

Go to **Applications** > **Create Application**. Use a name like `JHipster Baby!`, select `Regular Web Applications` and click **Create**.

Switch to the **Settings** tab and configure your application settings:

- Allowed Callback URLs: `http://localhost:8080/login/oauth2/code/oidc`
- Allowed Logout URLs: `http://localhost:8080/`

Navigate to **User Management** > **Roles** and create new roles named `ROLE_ADMIN` and `ROLE_USER`.

Go to **User Management** > **Users** and create a new user account. Click on the **Role** tab to assign roles to the new account.

Next, head to **Auth Pipeline** > **Rules** > **Create**. Select the `Empty rule` template. Provide a meaningful name like `Group claims` and replace the Script content with the following.

```js
function(user, context, callback) {
  user.preferred_username = user.email;
  const roles = (context.authorization || {}).roles;

  function prepareCustomClaimKey(claim) {
    return `https://www.jhipster.tech/${claim}`;
  }

  const rolesClaim = prepareCustomClaimKey('roles');

  if (context.idToken) {
    context.idToken[rolesClaim] = roles;
  }

  if (context.accessToken) {
    context.accessToken[rolesClaim] = roles;
  }

  callback(null, user, context);
}
```
Click **Save changes** to continue.

Stop your JHipster app using **Ctrl+C**, set your Auth0 properties, and start your app again.

```shell
source .auth0.env
./mvnw
```

Open your favorite browser to `http://localhost:8080`. 

{% img blog/full-stack-java/jhipster-homepage.png alt:"JHipster default homepage" width:"800" %}{: .center-image }

Click **sign in** and you'll be redirected to Auth0 to log in.

{% img blog/full-stack-java/auth0-login.png alt:"Auth0 Login" width:"800" %}{: .center-image }

After entering your credentials, you'll be redirected back to your app. 

{% img blog/full-stack-java/jhipster-logged-in.png alt:"Authenticated!" width:"800" %}{: .center-image }

## Test Your Full Stack Java App with Cypress

JHipster has Auth0 support built-in, so you can specify your credentials for Cypress tests and automate your UI testing!

To do this, specify the credentials for the Auth0 user you just created and run `npm run e2e`.

```shell
export CYPRESS_E2E_USERNAME=<new-username>
export CYPRESS_E2E_PASSWORD=<new-password>
npm run e2e
```

Everything should pass in around a minute.

```shell
       Spec                                              Tests  Passing  Failing  Pending  Skipped
  ┌────────────────────────────────────────────────────────────────────────────────────────────────┐
  │ ✔  administration/administration.spec.      00:22        5        5        -        -        - │
  │    ts                                                                                          │
  └────────────────────────────────────────────────────────────────────────────────────────────────┘
    ✔  All specs passed!                        00:22        5        5        -        -        -

Execution time: 59 s.
```

## Create Entities to allow CRUD on Photos

I've talked a lot about how to secure your application, but we haven't done anything with photos! JHipster has a JDL (JHipster Domain Language) feature that allows you to model the data in your app, and generate entities from it. You can use its [JDL Studio](https://start.jhipster.tech/jdl-studio/) to do this online and save it locally once you've finished.

My data model for this app has an `Album`, `Photo`, and `Tag` entities and sets up relationships between them. Below is a screenshot of what it looks like in JDL Studio.

{% img blog/full-stack-java/jdl-studio.png alt:"JDL Studio" width:"800" %}{: .center-image }

Copy the JDL below and save it in a `flick2.jdl` file in the root directory of your project.

```
entity Album {
  title String required
  description TextBlob
  created Instant
}

entity Photo {
  title String required
  description TextBlob
  image ImageBlob required
  height Integer
  width Integer
  taken Instant
  uploaded Instant
}

entity Tag {
  name String required minlength(2)
}

relationship ManyToOne {
  Album{user(login)} to User
  Photo{album(title)} to Album
}

relationship ManyToMany {
  Photo{tag(name)} to Tag{photo}
}

paginate Album with pagination
paginate Photo, Tag with infinite-scroll
```

You can generate entities and CRUD code (Java for Spring Boot; TypeScript and JSX for React) using the following command:

```shell
jhipster jdl flick2.jdl
```

When prompted, type `a` to allow overwriting of existing files.

This process will create Liquibase changelog files (to create your database tables), entities, repositories, Spring MVC controllers, and all the React code that's necessary to create, read, update, and delete your entities. It'll even generate JUnit unit tests, Jest unit tests, and Cypress end-to-end tests!

After the process completes, you can restart your app (Ctrl+C the `./mvnw` process and restart it), log in, and browse through the **Entities** menu. Try adding some data to confirm everything works.

By now, you can see that JHipster is pretty powerful. It recognized that you had an image property of `ImageBlob` type and created the logic necessary to upload and store images in your database! _Booyah!_

## Add Image EXIF Processing in Your Spring Boot API
## Add a React Photo Gallery
## Make Your Full Stack Java App into a PWA
## Deploy Your React + Spring Boot App to Heroku
### Configure for Auth0 and Analyze Your PWA Score with Lighthouse
## Learn More About Full Stack Java Apps

<!-- Learn More About React, Spring Boot, JHipster, and OAuth -->
dev.java and spring.io/guides + java as a first language
