---
layout: blog_post
title: "Build a Secure Quarkus Native App with JHipster"
author: daniel-petisme
by: contractor
communities: [java]
description: "Learn how to build a Java app with Quarkus and JHipster and secure it with OpenID Connect."
tags: [quarkus, jhipster, java]
tweets:
- "JHipster + Quarkus! 🥳"
- "Did you know that @jhipster now supports @QuarkusIO? 🎉"
- "🚀 Supersonic Subatomic @java with Quarkus and JHipster!"
image: 
type: conversion
---

[Quarkus](https://quarkus.io/) is a Kubernetes native, full-stack Java framework made for JVM-based applications and native compilations.

Built since day one to use on Ahead of Time (AOT) compilation, Quarkus can do aggressive optimizations (like classpath scanning, configuration loading and application bootstrap pre-configuration) during your application build time resulting on an impressing performance gap during the application runtime.

Like Spring and Micronaut, Quarkus takes advantage of GraalVM to transform a JVM-based application into a native executable improving again the overall performances.

Such performance gains allow the Java platform to be competitive in serverless, cloud, and Kubernetes environments by building Supersonic Subatomic Java applications.

Quarkus is designed to uses the Java standards (like [MicroProfile](https://projects.eclipse.org/projects/technology.microprofile), [JAX-RS](https://github.com/jax-rs)) and best of breed libraries (such as [Hibernate](https://hibernate.org/) and [Vert.x](https://vertx.io/)). It even has a Spring integration.

Development history has demonstrated gluing components together can be challenging and developers love when we provide them enlighted opinions, and this is where JHipster comes in.

[JHipster](https://www.jhipster.tech/) is a community-driven, full-stack development platform for generating, developing, and deploying modern web applications and microservice architectures.
Even if the main backend technology is Spring Boot, more and more options are appearing.
One of these is the [JHipster Quarkus blueprint](https://github.com/jhipster/generator-jhipster-quarkus).

Among others, one of the key capability that explains the project success is its extensibility via blueprints. A blueprint act as JHipster plugin, it permits to override the code generator default behavior to produce a new "flavor".

[Kotlin](https://github.com/jhipster/jhipster-kotlin) is for instance a famous JHipster blueprint.

Thanks to blueprints, the possibilities are infinite, this is why JHipster even have non-Java implementation (with [Node.JS](https://github.com/jhipster/generator-jhipster-nodejs) and [.Net Core](https://github.com/jhipster/jhipster-dotnetcore)).

In this post, I will walk you through a step-by-step tutorial on how to use JHipster, the Quarkus blueprint, and Okta to build a native and secure full-stack application.

**Table of Contents**{: .hide }
* Table of Contents
{:toc}
  
## Create a Java Application with Quarkus

// todo: we should create the application with JHipster first. Maybe even show it running with Keycloak.

## Create an Okta OAuth2/OpenId Connect application

In this tutorial, you'll be using Okta as OAuth 2.0 / OIDC provider. Okta has two options for configuring an OpenID Connect (OIDC) application. You can either go though the [developer console](https://developer.okta.com/) or use the [Okta CLI](https://github.com/okta/okta-cli).

When using Spring Boot or classic JHipster, Okta CLI is recommended because it configures everything for your with one command which is very convenient.

Quarkus and JHipster Quarkus do not yet have this level of integration with the Okta CLI.

**NOTE**: The work is in progress, feel free to give a thumbs up to show your interest:

* [Quarkus Integration](https://github.com/okta/okta-cli/issues/70)
* [JHipster Quarkus Integration](https://github.com/okta/okta-cli/issues/72)

Anyway, don't panic, I have your back! The Okta CLI is easy to use, but you might want to use a GUI to configure things. That's why I'll go through each step to configure an OIDC application that works with JHipster Quarkus.

### Create an Okta application

First of, if you don't have an Okta developer account you need to signup. Nothing fancy, firstname, lastname, email, a strong password and you're ready to go.

Once logged in, you arrive in your developer console:

{% img blog/jhipster-quarkus-oidc/1-applications.png alt:"Okta developer console homepage" width:"800" %}{: .center-image }

Click on **Add Application** to start the app creation wizard.

{% img blog/jhipster-quarkus-oidc/2-create-application-platform.png alt:"Select Okta application platform" width:"800" %}{: .center-image }

Choose **Web** and hit **Next**.

{% img blog/jhipster-quarkus-oidc/3-create-application-settings.png alt:"Configure Okta application settings" width:"800" %}{: .center-image }

You now need to provide some application settings.

* **Name**: Whatever you want but JHipster Quarkus sounds cool
* **Base URI**: The root URI is where your application will be accessible.
A common base URI for Java application is `http://localhost:8080`.
* **Login redirect URIs**: Where Okta will redirect the user's browser once authenticated.
Set `http://localhost:8080/login/oauth2/code/oidc`, we'll explain this value later on in this post.
* **Logout redirect URIs**: Same as above but after logout.
Often, after a user logs out, you just want to redirect the browser to the homepage `http://localhost:8080/`.
* **Group assignments**: Which User groups can use this application as authentication provider.

Use the default values for the rest of the settings.

When you're happy with your application click on **Done**. The next screen will show your application details.

{% img blog/jhipster-quarkus-oidc/4-application-details.png alt:"Okta application details" width:"800" %}{: .center-image }

The most important values are:

* The client credentials (client id and client secrets), which will permit to your future application to authenticate against Okta services in order to allow the users authentication's and authorization's flows.
* The Okta domain from which we will derivate the Okta API urls.

**NOTE**: We're not that crazy to exposes credentials publicly, the domain and credentials you can see have been deleted long time before you actually read this article ;-)

If you'd prefer to use the Okta CLI to create an app, you'll first need to [install it](https://cili.okta.com). Then, run `okta register` to create an account. 

TODO: Change values below to Daniel's below.

```shell
$ okta register
First name: Matt
Last name: Raible
Email address: matt.raible@okta.com
Company: Okta
Creating new Okta Organization, this may take a minute:
OrgUrl: https://dev-3998555.okta.com
An email has been sent to you with a verification code.

Check your email
Verification code: 232819
New Okta Account created!
Your Okta Domain: https://dev-3998555.okta.com
To set your password open this link:
https://dev-3998555.okta.com/welcome/drpt2SjbRAPR-gvVHhnm
```

If you already have an Okta developer account, run `okta login`. Then, run `okta apps create jhipster` in your Quarkus app's directory. Accept the defaults when prompted for redirect URIs.

TODO: Validate output is the same when next version of Okta CLI is released. Change email to Daniel's below.

```shell
$ okta apps create jhipster
Application name [jhipster-quarkus-okta]:
Redirect URI
Common defaults:
 Spring Security - http://localhost:8080/login/oauth2/code/okta
 Quarkus OIDC - http://localhost:8080/callback
 JHipster - http://localhost:8080/login/oauth2/code/oidc
Enter your Redirect URI(s) [http://localhost:8080/login/oauth2/code/oidc, http://localhost:8761/login/oauth2/code/oidc]:
Enter your Post Logout Redirect URI(s) [http://localhost:8080/, http://localhost:8761/]:
Configuring a new OIDC Application, almost done:
Created OIDC application, client-id: 0oa5ozjxyNQPPbKc65d6
Creating Authorization Server claim 'groups':
Adding user 'matt.raible@okta.com' to groups: [ROLE_USER, ROLE_ADMIN]
Creating group: ROLE_USER
Creating group: ROLE_ADMIN

Okta application configuration has been written to: /Users/daniel/workspace/jhipster-quarkus-okta/.okta.env
```

The Okta CLI will create an `.okta.env` in the current directory.

```shell
$ cat .okta.env
export QUARKUS_OIDC_AUTH_SERVER_URL="https://dev-3998555.okta.com/oauth2/default"
export QUARKUS_OIDC_CLIENT_ID="0oa5ozjxyNQPPbKc65d6"
export QUARKUS_OIDC_CREDENTIALS_SECRET="KEJ0oNOTFEUEFHP7i1TELLING1xLm1XPRn"
export QUARKUS_OIDC_APPLICATION_TYPE="web-app" # this is currently web-app, should it be hybrid?
export QUARKUS_OIDC_AUTHENTICATION_REDIRECT_PATH="/login/oauth2/code/oidc"
export JHIPSTER_OIDC_LOGOUT_URL="https://dev-3998555.okta.com/oauth2/default/v1/logout"
```

You will use this values later.

### Create user groups

Time to create user groups.

Out of the box JHipster requires 2 groups:

* `ROLE_USER`: for the authenticated users.
* `ROLE_ADMIN`: for the authenticated users with administrator privileges on the application.

Back to the [developer console](https://developer.okta.com/).

{% img blog/jhipster-quarkus-oidc/5-applications.png alt:"Okta developer console homepage" width:"800" %}{: .center-image }

On the upper banner, go to **Users** > **Groups**.

{% img blog/jhipster-quarkus-oidc/6-groups.png alt:"Okta group management" width:"800" %}{: .center-image }

Click on **Add Group**.
First let's create the `ROLE_ADMIN` group.

{% img blog/jhipster-quarkus-oidc/7-create-group-admin.png alt:"Okta create ROLE_ADMIN group" width:"800" %}{: .center-image }

Finally the `ROLE_USER` group.

{% img blog/jhipster-quarkus-oidc/8-create-group-user.png alt:"Okta create ROLE_USER group" width:"800" %}{: .center-image }

We're done with the user groups, let's add users now.

### Create users

Back to the [developer console](https://developer.okta.com/).
On the upper banner, go to **Users** > **People**.

{% img blog/jhipster-quarkus-oidc/9-users.png alt:"Okta user management" width:"800" %}{: .center-image }

Click on **Add Person**.
We'll start by creating the `Administrator` user.

{% img blog/jhipster-quarkus-oidc/10-create-user-admin.png alt:"Okta create Admin user" width:"800" %}{: .center-image }

The key points are to associate the `Administrator` user to the `ROLE_ADMIN` user.
For demo sake, we use the `Set by Admin` password strategy to be able to defined a first password the user will have to change at its first connection.
In a real life context, we would recommend to use the `Set by User` strategy with an activation email.

Now, we can create th `User` user.

{% img blog/jhipster-quarkus-oidc/11-create-user-user.png alt:"Okta create User user" width:"800" %}{: .center-image }

The `User` person will be member of the `ROLE_USER` group.

The okta configuration is now finished we can focus on JHipster now!

## Create a JHipster Quarkus application 

### Install JHipster and Quarkus Blueprint

You'll need to install few things before you get started.

**Prerequisites**:

- [Java 11+](https://adoptopenjdk.net/)
- [Node.js 12+](https://nodejs.org/en/)

```shell
# Install Globally JHipster
$ npm install -g generator-jhipster@6.10.5
$ jhipster --version
INFO! Using JHipster version installed globally
6.10.5

# Install JHipster Quarkus blueprint
$ npm install -g generator-jhipster-quarkus@1.0.0

# The `jhipster-quarkus` command is now available
$ jhipster-quarkus --help
```

### Generate a Jhipster Quarkus application

This is the moment you have been waiting for!
It's time to generate a JHipster quarkus application.

Open a terminal, create a directory for your application.

```shell
$ mkdir jhipster-quarkus-okta-sample && cd jhipster-quarkus-okta-sample
```

You can invoke the `jhipster-quarkus` command to start the application creation wizard.

```shell
$ jhipster-quarkus
```
In our context, the key question will be the one regarding authentication.

{% img blog/jhipster-quarkus-oidc/12-jhipster-quarkus-authentication.png alt:"JHipster Quarkus wizard" width:"800" %}{: .center-image }


JHipster Quarkus permits to use JWT (with a users management into the application database) or **OAuth 2.0 / OIDC Authentication** via providers like Keycloak or Okta.

Here you have a example of wizard answers.

{% img blog/jhipster-quarkus-oidc/13-jhipster-quarkus-answers.png alt:"JHipster Quarkus wizard" width:"800" %}{: .center-image }


The command will generate your application skeleton and run `npm run install`

### Test OAuth2 OIDC with Keycloak works

Among other files, JHipster Quarkus generates a set of Docker Compose files to help you bootstrap a dev environment tailored for your freshly generated application
This is the case for Keycloak.
Keycloak is the default OIDC engine that's used by JHipster, and you can run it in a Docker container.

You can start a Keycloak container configured with the appropriate users and groups via the command:

```
docker-compose -f src/main/docker/keycloak.yml up -d
```
With Keycloak up and running, you should be able to log in. Start your app using Maven:
```
./mvnw
```

{% img blog/jhipster-quarkus-oidc/14-jhipster-quarkus-keycloak.png alt:"JHipster Quarkus with Keycloak" width:"800" %}{: .center-image }

You can notice the app starts in `3.861s` and contains a huge list of Quarkus extensions (including `oidc`).

Go to http://localhost:8080 in your favorite browser and click the sign in link.

{% img blog/jhipster-quarkus-oidc/15-jhipster-quarkus-not-authenticated.png alt:"JHipster Quarkus not authenticated" width:"800" %}{: .center-image }

{% img blog/jhipster-quarkus-oidc/16-keycloak-login.png alt:"Keycloak login" width:"800" %}{: .center-image }

{% img blog/jhipster-quarkus-oidc/17-jhipster-quarkus-authenticated.png alt:"JHipster Quarkus authenticated" width:"800" %}{: .center-image }

### How JHipster Quarkus OAuth2/OIDC works

One of the challenge when developing a JHipster blueprint like the QUarkus one, is to find the sweet spot between reuse of existing mechanism and custom implementation.
Since Day 1, JHipster has been integrating a modern web application (made with Angular, React or even Vue.js) with standard Spring Boot technologies.
JHipster OAuth2 relies on 2 urls (`oauth2/authorization/oidc` and `login/oauth2/code/oidc`) which are generated implicitly by the Spring security framework.
Besides Spring, doing server-side authentication is highly recommended since it's way more secured (the browser does not have to manage any credentials).

In JHipster Quarkus, in order to reuse the front applications as is, and implement a server side OAuth2 flow, the backend had to exposes these 2 HTTP routes.
This is why JHipster Quarkus introduced the `UserOauth2Controller` Web controller and customized Quarkus OIDC properties to make everything work properly.

This is the kind pitfall developers don't want to waste the time on.
The collective intelligence of the JHipster community converge to highly efficient opinions which explains the platform popularity and quality.

## Jhipster Quarkus Native application backed by Okta

### From Keycloak to Okta

At this point, you have a Jhipster Quarkus Application running and configured to use Keycloak as OAuth2/OIDC provider.
Let's change that to use Okta.

First, you need to log out from the JHipster web application to prevent cookie collisions.
Go to **Account** > **Sign Out**

**Note**: you can the application running, Quarkus provides what they call a **Dev Mode** which basically hot reload any source or resource file whenever they are updated.

Go to `src/main/resources/application.properties` and find the following OIDC configuration section
```properties
# OAuth 2.0 and OIDC
quarkus.oidc.enabled=true
quarkus.oidc.auth-server-url=http://localhost:9080/auth/realms/jhipster/
%dev.quarkus.oidc.client-id=web_app
%dev.quarkus.oidc.credentials.secret=web_app
quarkus.oidc.application-type=hybrid
quarkus.oidc.authentication.scopes=profile,address,email,address,phone,offline_access
quarkus.oidc.authentication.cookie-path=/
quarkus.oidc.authentication.redirect-path=/login/oauth2/code/oidc
quarkus.oidc.authentication.restore-path-after-redirect=false

jhipster.oidc.logout-url=http://localhost:9080/auth/realms/jhipster/protocol/openid-connect/logout

%test.quarkus.oidc.client-id=dummy
%test.quarkus.oidc.application-type=service
%test.jhipster.oidc.logout-url=some-dummy-logoutUrl
```

The above values are made for Keycloak. We need to update the following properties to make the application integrated with Okta

* `quarkus.oidc.auth-server-url` The Okta's API root url derived from the OIDC application domain.
* `quarkus.oidc.client-id` The OIDC application client ID
* `quarkus.oidc.credentials.secret` The OIDC application client password.
* `jhipster.oidc.logout-url` In JHipster, the browser will initiate the log out, the backend needs to expose this information (for now, it can't be retrieved from the OIDC discovery).

After updates, your properties should look like:

```properties
# OAuth 2.0 and OIDC
quarkus.oidc.enabled=true
quarkus.oidc.auth-server-url=https://dev-956280.okta.com/oauth2/default
quarkus.oidc.client-id=0oa1mn09woWZZs8pJ4x7
quarkus.oidc.credentials.secret=11dvOx0N3opx8gnpL5UgRaxFFoiTLWEof9jOcSvp
quarkus.oidc.application-type=hybrid
quarkus.oidc.authentication.scopes=profile,address,email,address,phone,offline_access
quarkus.oidc.authentication.cookie-path=/
quarkus.oidc.authentication.redirect-path=/login/oauth2/code/oidc
quarkus.oidc.authentication.restore-path-after-redirect=false

jhipster.oidc.logout-url=https://dev-956280.okta.com/oauth2/default/v1/logout

%test.quarkus.oidc.client-id=dummy
%test.quarkus.oidc.application-type=service
%test.jhipster.oidc.logout-url=some-dummy-logoutUrl
```

Go to `http://localhost:8080` and refresh the page.
You can see on the terminal the Quarkus dev mode will stop the application and restart it immediately (The Hot reload takes 2.497s to restart the app).

{% img blog/jhipster-quarkus-oidc/18-quarkus-hot-reload.png alt:"Quarkus Hot reload" width:"800" %}{: .center-image }

Back to `http://localhost:8080`, click on **sign in** and you'll be redirect to an Okta login page.

{% img blog/jhipster-quarkus-oidc/19-okta-login.png alt:"Okta login" width:"800" %}{: .center-image }

Enter the `admin` username and the password you set (as Okta administrator).
Okta detects it's the first connection of the `admin` users and ask to update the password and defined a secret question.

{% img blog/jhipster-quarkus-oidc/20-okta-admin-password.png alt:"Okta password update" width:"800" %}{: .center-image }

Once done, the browser is redirect as configured to the JHipster application.

{% img blog/jhipster-quarkus-oidc/21-jhipster-quarkus-authenticated.png alt:"Admin user authenticated with Okta" width:"800" %}{: .center-image }

### Going native

The final step of this tutorial is package th Java application as native executable.

The `v0.2.1` of JHipster Quarkus blueprint introduced a minor bug regarding when it comes to native packaging.
Open the `src/main/resources/application.properties` file and spot the following block:

```properties
quarkus.native.additional-build-args=\
    -H:ResourceConfigurationFiles=resources-config.json,\
    --initialize-at-run-time=com.mycompany.myapp.security.RandomUtil
```
You need to remove `-H:ResourceConfigurationFiles=resources-config.json,\` this file isn't generated when the authentication is set to OAuth2/OIDC.
you should obtain

```properties
quarkus.native.additional-build-args=\
    --initialize-at-run-time=com.mycompany.myapp.security.RandomUtil
```

Now you're ready to go native, once again JHipster gets you back and everything is prepared.
Simply run

```shell
./mvnw package -Pnative -DskipTests
```
You know, we know, everybody know, we skipped the tests for demo purpose.
Please to do skip the tests in a production context :-)

The native compilation is long, very very very long.
Take this time to :

* Start the JHipster Quarkus Blueprint project: https://github.com/jhipster/generator-jhipster-quarkus
* Explore the Okta developer console: https://developer.okta.com/
* Go though the amazing Quarkus guides: https://quarkus.io/guides/
* Or simply take a walk

After roughly 5mins, the native executable is ready:

{% img blog/jhipster-quarkus-oidc/22-quarkus-native-compile.png alt:"JHipster Quarkus Native compilation" width:"800" %}{: .center-image }

Start it as standard executable:

{% img blog/jhipster-quarkus-oidc/23-quarkus-native-run.png alt:"JHipster Quarkus Native Run" width:"800" %}{: .center-image }

Boom! Your gold old fashioned Java application starts in less than **2s**.
Remember, we talked also about memory gains, here you have a crafted ps/grep sequence to get the memory consumption in MegaBytes.

```shell
$ ps -o pid,rss,command | grep --color jhipster | awk '{$2=int($2/1024)"M";}{ print;}'
30951 46M ./target/jhipster-1.0.0-SNAPSHOT-runner
31433 0M grep --color=auto --exclude-dir=.bzr --exclude-dir=CVS --exclude-dir=.git --exclude-dir=.hg --exclude-dir=.svn --color jhipster
```

Your application is consuming < 50MB of memory...

You can now get back to `http://localhost:8080` and test your log in/log out and you'll see the Okta login page to authenticate you users.

## Going further with JHipster Quarkus

I hope you enjoyed this tutorial on Quarkus and Jhipster.
You can find the example created in this tutorial on [GitHub](TODO).

If you're interested in learning more about the Quarkus blueprint, see the [generator-jhipster-quarkus](https://github.com/jhipster/generator-jhipster-quarkus) project on GitHub.

I hope you liked this hip tutorial! Here are some other ones that you might enjoy.

* [How to Develop a Quarkus App with Java and OIDC Authentication](https://developer.okta.com/blog/2019/09/30/java-quarkus-oidc)
* [Secure Kafka Streams with Quarkus and Java](https://developer.okta.com/blog/2020/04/08/kafka-streams)



