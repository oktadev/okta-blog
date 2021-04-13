---
layout: blog_post
title: "Build a CRUD App with Vue.js, Spring Boot, and Kotlin"
author: andrew-hughes
by: contractor
communities: [java,javascript]
description: "Create a CRUD (create, read, update, and delete) application using Spring Boot and Vue.js."
tags: [java, spring, spring-boot, vue, crud, tutorial]
tweets:
- "Learn how to build a secure CRUD application using Vue.js and Spring Boot."
- "This tutorial shows you how to build a To-Do app @vuejs and @springboot. We hope you learn something from it!"
- "Build an app with Vue + @springboot and @kotlin. We think you'll 💚 the experience!"
image: blog/spring-boot-vue/kotlin-spring-boot-vue.png
type: conversion
changelog: 
- 2020-08-31: Updated GitHub repo to have proper starter files and fixed logout in Vue. You can see the changes in the [example app on GitHub](https://github.com/oktadeveloper/okta-kotlin-spring-boot-vue-example/pull/4). Changes to this article can be viewed in [oktadeveloper/okta-blog#392](https://github.com/oktadeveloper/okta-blog/pull/392).
---

Much like React or Angular, Vue.js is a JavaScript view library. When coupled with a state management library like MobX, Vue.js becomes a full-featured application framework. Vue.js is designed to be incrementally adoptable, so you can use as much or as little of it as you like. Like React, Vue.js utilizes a virtual DOM to streamline processing so that it renders as little as possible on each state update. 

In my experience, Vue is far simpler to use and learn than React and Angular and is particularly great on small projects where you don't need a full web application framework (or don't want to write a bunch of sagas, actions, and action creators just to manage a few state variables). That said, Vue.js is also increasingly being used for larger projects. 

Spring Boot is Spring's streamlined Java application framework. It makes constructing server-side code with Java or Kotlin super easy. It's an opinionated library where a lot of magic happens behind the scenes with relatively few lines of code. In the past with Spring, I found that this tended to obfuscate what was happening, making it hard to customize or understand, but with Spring Boot they seem to have found a real balance between customizability and ease of use. As you'll see, you can use Spring Boot to create a fully functioning resource server from a plain Java object (or Kotlin, in our case) from shockingly few lines of code.

Today I'll show you how to build a fully-functioning client-server CRUD application using Vue.js for the client and Spring Boot for the resource server. The Spring Boot server application will be written using Kotlin. You'll also use Okta and OAuth 2.0 to secure the application.

CRUD—if you don't know—stands for **C**reate, **R**ead, **U**pdate, and **D**elete. Once you can do these operations, you've got all the basics for a server application.

The example application you're going to build here is a todo app. The client-side of the app is based on a project written by [Evan You](http://evanyou.me) and [the original Vue Todo App project](https://vuejs.org/v2/examples/todomvc.html). It's all been modified a fair amount, but I wanted to give credit where credit is due.

**Prerequisites:**

- [Java 11+](https://adaptopenjdk.net)
- An [Okta Developer Account](https://developer.okta.com/signup)
- [HTTPie](https://httpie.org/doc#installation)
- [Node 12+](https://nodejs.org)
- [Yarn](https://yarnpkg.com/)

**Table of Contents**{: .hide }
* Table of Contents
{:toc}

## Create a Vue + Spring Boot Application

Rather than creating an app from scratch, go ahead and download the example application from [this tutorial's GitHub repository](https://github.com/oktadeveloper/okta-kotlin-spring-boot-vue-example).

```bash
git clone https://github.com/oktadeveloper/okta-kotlin-spring-boot-vue-example.git
```

The example project contains two main sub-directories:

- `client`: contains the Vue.js client
- `server`: contains the Spring Boot Kotlin resource server

First, you're going to take a look at the resource server and make sure that it's all working.

## Build a Spring Boot Resource Server with Kotlin

The Kotlin resource server is pretty simple. Spring has done a great job reducing boilerplate code. There are four Kotlin source files in the project, all in the `com.okta.springbootvue` package:

- `SpringBootVueApplication`: the main entry point into the application
- `RestRepositoryConfigurator`: used to configure the auto-generated REST resource to return resource IDs
- `Todo`: defines the Todo class data model
- `TodoRepository`: configures the auto-generated Spring Boot JPA repository

The first file, `SpringBootVueApplication`, is the place where the application starts. It contains the `@SpringBootApplication` annotation that loads the Spring Boot framework. It also contains a function named `init()` that loads some initial test data into the repository. It contains a bean that configures a CORS filter so that you can make calls from the Vue.js application without getting cross-origin errors. Finally, it contains the good, old-fashioned `main()` function where the magic begins.

`com/okta/springbootvue/SpringBootVueApplication.kt`
```kotlin
@SpringBootApplication
class SpringBootVueApplication {
   // Bootstrap some test data into the in-memory database
   @Bean
   fun init(repository: TodoRepository): ApplicationRunner {
       return ApplicationRunner { _: ApplicationArguments? ->
           arrayOf("Buy milk", "Eat pizza", "Write tutorial", "Study Vue.js", "Go kayaking").forEach {
               val todo = Todo(it, false)
               repository.save(todo)
           }
           repository.findAll().forEach(Consumer { x: Todo? -> println(x) })
       }
   }

   // Fix the CORS errors
   @Bean
   fun simpleCorsFilter(): FilterRegistrationBean<*> {
       val source = UrlBasedCorsConfigurationSource()
       val config = CorsConfiguration()
       config.allowCredentials = true
       // *** URL below needs to match the Vue client URL and port ***
       config.allowedOrigins = listOf("http://localhost:8080")
       config.allowedMethods = listOf("*")
       config.allowedHeaders = listOf("*")
       source.registerCorsConfiguration("/**", config)
       val bean: FilterRegistrationBean<*> = FilterRegistrationBean(CorsFilter(source))
       bean.order = Ordered.HIGHEST_PRECEDENCE
       return bean
   }

   companion object {
       @JvmStatic
       fun main(args: Array<String>) {
           SpringApplication.run(SpringBootVueApplication::class.java, *args)
       }
   }
}
```

The `Todo` class is what defines the data model. Specifically, it defines three properties: 1) a string `title`, 2) a boolean `completed`, and 3) an auto-generated `id` integer value. If you're not familiar with Kotlin you might find this strange, but the `title` and the `completed` properties are declared on the first line of the class definition in the default constructor.

Other than that, the `@Entity` annotation is what tells Spring that this class is a data model entity. There's also a helper `toString()` override.

```kotlin
@Entity
class Todo(var title: String, var completed: Boolean) {
   @Id
   @GeneratedValue
   var id: Long? = null
   override fun toString() : String {
       return "Title='$title', Completed=$completed";
   }
}
```

Spring is doing a lot of work behind the scenes. Pretty much all of the resource server's infrastructure is auto-generated. You're simply defining the data model and pointing Spring Boot to it. This is achingly clear in the next class, `TodoRepository`, which is the class that defines and creates the REST interface for your resource server as well as your persistence store.

The persistence store in this case (the class that is responsible for saving and loading your data resources from a database) uses the default store, which is an in-memory database. It is great for examples and testing but needs to be overridden in production so that you can actually persist your data.

The coolest part is the `@RepositoryRestResource` annotation. All you have to do is add it to the `JpaRepository` class and Spring will turn your repository into a REST interface. This annotation requires the `spring-boot-starter-data-rest` dependency. The details of the resource server can be configured extensively. Take a look at [the Spring Data REST Reference documentation](https://docs.spring.io/spring-data/rest/docs/current/reference/html/#reference) for more info.

Now for the code: 

`com/okta/springbootvue/TodoRepository.kt`
```kotlin
@RepositoryRestResource
interface TodoRepository:JpaRepository<Todo, Long>
```

Yep, that's it!

The last file is `RestRepositoryConfigurator`. This file overrides `RepositoryRestConfigurer` and is used to configure the REST repository. Specifically, it configures it to expose IDs for the `Todo` class. This tells Spring that when it returns Todo objects, it should return the object ID with it as well. Doing this makes it a lot easier to implement the CRUD methods on the client-side.

```kotlin
@Component
class RestRepositoryConfigurator : RepositoryRestConfigurer {
   override fun configureRepositoryRestConfiguration(config: RepositoryRestConfiguration) {
       config.exposeIdsFor(Todo::class.java)
   }
}
```

## Test the Spring Boot Resource Server

That's all you need to create a working REST API.

Now you're going to test it using HTTPie. But first, open a shell, navigate to the `/server` subdirectory, and start the server using `./gradlew bootRun`.

You should see some output that ends like this:

```bash
2020-06-24 19:31:34.033  INFO 25910 --- [  restartedMain] DeferredRepositoryInitializationListener : Spring Data repositories initialized!
2020-06-24 19:31:34.039  INFO 25910 --- [  restartedMain] c.o.s.SpringBootVueApplication$Companion : Started SpringBootVueApplication.Companion in 2.287 seconds (JVM running for 2.532)
Title='Buy milk', Completed=false
Title='Eat pizza', Completed=false
Title='Write tutorial', Completed=false
Title='Study Vue.js', Completed=false
Title='Go kayaking', Completed=false
<==========---> 80% EXECUTING [13s]
> :bootRun
```

Now, open a separate terminal window and perform a basic GET request on the server endpoint using the following command: `http :9000`, which is short for `http GET http://localhost:9000`.

```bash
HTTP/1.1 200
Connection: keep-alive
...

{
   "_links": {
       "profile": {
           "href": "http://localhost:9000/profile"
       },
       "todos": {
           "href": "http://localhost:9000/todos{?page,size,sort}",
           "templated": true
       }
   }
}
```

The `profile` link refers to the ALPS (Application-Level Profile Semantics). Take a look at [the Spring docs](https://docs.spring.io/spring-data/rest/docs/current/reference/html/#metadata.alps) on it. It's a way to describe the available resources exposed by the REST API.

The `todos` link is the endpoint generated from the Todo class.

Perform a GET on the `/todos` endpoint: 

```bash
http :9000/todos
```

You'll see an output like below (for brevity I've omitted all but the first of the todo objects).

```bash
HTTP/1.1 200
Connection: keep-alive
Content-Type: application/hal+json
Date: Wed, 24 Jun 2020 02:35:59 GMT
Keep-Alive: timeout=60
Transfer-Encoding: chunked
Vary: Origin
Vary: Access-Control-Request-Method
Vary: Access-Control-Request-Headers

{
   "_embedded": {
       "todos": [
           {
               "_links": {
                   "self": {
                       "href": "http://localhost:9000/todos/1"
                   },
                   "todo": {
                       "href": "http://localhost:9000/todos/1"
                   }
               },
               "completed": false,
               "id": 1,
               "title": "Buy milk"
           },
           ...
       ]
   },
   "_links": {
       "profile": {
           "href": "http://localhost:9000/profile/todos"
       },
       "self": {
           "href": "http://localhost:9000/todos"
       }
   },
   "page": {
       "number": 0,
       "size": 20,
       "totalElements": 5,
       "totalPages": 1
   }
}
```

You can try adding a todo using a POST.

```
http POST :9000/todos title="Drink more coffee"

HTTP/1.1 201
Connection: keep-alive
Content-Type: application/json
...

{
   "_links": {
       "self": {
           "href": "http://localhost:9000/todos/6"
       },
       "todo": {
           "href": "http://localhost:9000/todos/6"
       }
   },
   "completed": false,
   "id": 6,
   "title": "Drink more coffee"
}
```

If you perform another GET on the `/todos` endpoint,  you'll see that there are now six todo items and the last item is your newly added todo.

```bash
http :9000/todos
```

Again, a lot of the output below has been omitted for brevity, but notice the `page.totalElements` value now equals six and that there is a new todo item.

```bash
HTTP/1.1 200
Connection: keep-alive
Content-Type: application/hal+json
...

{
   "_embedded": {
       "todos": [
           ...
           {
               "_links": {
                   "self": {
                       "href": "http://localhost:9000/todos/6"
                   },
                   "todo": {
                       "href": "http://localhost:9000/todos/6"
                   }
               },
               "completed": false,
               "id": 6,
               "title": "Drink more coffee"
           }
       ]
   },
   ...
   "page": {
       "number": 0,
       "size": 20,
       "totalElements": 6,
       "totalPages": 1
   }
}
```

## Test the Vue.js Client App

I'm not going to go into a ton of detail on the Vue.js client app. A lot of this was covered in [the previous tutorial](/blog/2018/11/20/build-crud-spring-and-vue) and is largely the same. I will explicitly show you how to modify the unsecured client app (and server) to use Okta OAuth.

The Vue module that is the heart of the app is `src/components/Todos.vue`. This is what you see and what controls the application flow.

Another important file is `src/Api.js`. This module encapsulates the functionality for interacting with the resource server using the `axios` HTTP client module. If you look at the code below you'll see that this module contains clear methods for Create, Read, Update, and Delete. You'll also notice how I'm able to create a base `axios` instance that is configured with some global settings, such as the server URL and timeout. Later, this comes in handy when we need to configure the token authentication.

```js
import axios from 'axios'

const SERVER_URL = 'http://localhost:9000';

const instance = axios.create({
   baseURL: SERVER_URL,
   timeout: 1000
});

export default {
   // (C)reate
   createNew: (text, completed) => instance.post('todos', {title: text, completed: completed}),
   // (R)ead
   getAll: () => instance.get('todos', {
       transformResponse: [function (data) {
           return data? JSON.parse(data)._embedded.todos : data;
       }]
   }),
   // (U)pdate
   updateForId: (id, text, completed) => instance.put('todos/'+id, {title: text, completed: completed}),
   // (D)elete
   removeForId: (id) => instance.delete('todos/'+id)
}
```

Open a shell in the `/client` sub-directory.

Before running the client app, install the dependencies: `yarn install`.

Go ahead and run the client using `yarn serve`. Make sure your resource server is still running, as well. If it's not, run it using `./gradlew bootRun`.

Open a browser and navigate to `http://localhost:8080`.

{% img blog/spring-boot-vue/todo-app.png alt:"Todos app screen" width:"800" %}{: .center-image }

Try it out! You can edit existing todos, delete them, and create new ones.

## Create an OIDC Application for Vue Authentication

{% include setup/cli.md type="spa" framework="Vue" loginRedirectUri="http://localhost:8080/callback" %}

## Add Authentication to Vue

To configure Vue.js to use Okta as an OAuth 2.0 and OIDC provider, you're going to use the `okta-vue` module. This greatly simplifies integrating Okta authentication into your client application. You can take a look at [the project GitHub page](https://github.com/okta/okta-vue) for more info.

Stop your client Vue.js application. Open a shell and, from the `client` sub-directory of the example project, use Yarn to install `okta-vue`.

```bash
yarn add @okta/okta-vue@2.0.0
```

Now create a `src/router.js` file in the client app project.

```js
import Auth from '@okta/okta-vue';
import Vue from 'vue'
import Router from 'vue-router'
import Todos from './components/Todos'

Vue.use(Auth, {
  issuer: 'https://{yourOktaDomain}/oauth2/default',
  clientId: '{yourClientId}',
  redirectUri: window.location.origin + '/callback'
});

Vue.use(Router);

let router = new Router({
  mode: 'history',
  routes: [
    {
      path: '/',
      name: 'Todos',
      component: Todos,
      meta: {
        requiresAuth: true
      }
    },
    {
      path: '/callback',
      component: Auth.handleCallback(),
    },
  ]
});

router.beforeEach(Vue.prototype.$auth.authRedirectGuard());

export default router;
```

Next, replace `{yourClientId}` with the Client ID from the OIDC app you just created. You'll also need to change `{yourOktaDomain}` to your Okta developer domain—something like `dev-123456.okta.com`. Make sure to remove the `{...}` placeholders and just use the raw values.

The Okta Vue authentication plugin injects an `authClient` object into your Vue instance which can be accessed by calling `this.$auth` anywhere inside this instance.

There are only two routes. The home route is the todo app itself. The `meta: { requiresAuth: true }` property turns on authentication for that route.

The other route, `/callback`, is the OAuth 2.0 callback route that handles a successful authentication from the Okta servers.

Now you need to update the `src/main.js` to use the router.

Add the following import statement near the top of the file:

```js
import router from './router'
```

And update the Vue app instance to use the imported router, replacing the old Vue instance declaration:

```js
new Vue({ 
 el: '#app', 
 router,  // <-- add this line
 template: '<App/>', 
 components: { App } 
})
```

Next, update the `src/App.vue` module to match the following:

```js
<template>
  <div id="app">
    <router-view :activeUser="activeUser"/>
    <footer class="info">
      <p v-if="activeUser" class="logout-link"><a @click="handleLogout" href="#">Logout</a></p>
      <p>Based on a project written by <a href="http://evanyou.me">Evan You</a></p>
      <p>Original Vue TodoApp project is <a href="https://vuejs.org/v2/examples/todomvc.html">here</a></p>
      <p>Modified for this tutorial by Andrew Hughes</p>
    </footer>
  </div>
</template>

<script>
  // app Vue instance 
  const app = {
    name: 'app',
    // app initial state 
    data: () => {
      return {
        activeUser: null
      }
    },

    async created() {
      await this.refreshActiveUser()
    },

    watch: {
      '$route': 'refreshActiveUser'
    },

    methods: {
      async refreshActiveUser() {
        this.activeUser = await this.$auth.getUser()
        this.$log.debug('activeUser', this.activeUser)
      },

      async handleLogout() {
        await this.$auth.logout()
        await this.refreshActiveUser()
        this.$router.push({ path: '/' })
      }
    },
  }

  export default app
</script>

<style>
  [v-cloak] {
    display: none;
  }
</style>

```

These changes demonstrate a couple of things. First, the code creates and updates a property, `activeUser`, that passes information to the Todos module about the currently active user (if there is one, or null if there isn't). It also adds a logout link to the footer.

The last thing you need to do is update the `src/Api.js` file to add the access token to each request.

```js
import axios from 'axios'
import Vue from 'vue'

const SERVER_URL = 'http://localhost:9000';

const instance = axios.create({
  baseURL: SERVER_URL,
  timeout: 1000
});

export default {

  async execute(method, resource, data, config) {
    let accessToken = await Vue.prototype.$auth.getAccessToken()
    return instance({
      method: method,
      url: resource,
      data,
      headers: {
        Authorization: `Bearer ${accessToken}`
      },
      ...config
    })
  },

  // (C)reate 
  createNew(text, completed) {
    return this.execute('POST', 'todos', {title: text, completed: completed})
  },
  
  // (R)ead 
  getAll() {
    return this.execute('GET', 'todos', null, {
      transformResponse: [function (data) {
        return data ? JSON.parse(data)._embedded.todos : data;
      }]
    })
  },
  
  // (U)pdate 
  updateForId(id, text, completed) {
    return this.execute('PUT', 'todos/' + id, {title: text, completed: completed})
  },

  // (D)elete 
  removeForId(id) {
    return this.execute('DELETE', 'todos/' + id)
  }
}
```

These changes take the access token from the Okta Vue Auth module and inject it into the API request methods.

## Test Your Vue App's OAuth Flow

At this point, you can run the client application and it will force you to log in.

Run: `yarn serve` and navigate to: `http://localhost:8080`.

You may need to use a private or incognito browser window to see the login screen.

{% img blog/spring-boot-vue/okta-sign-in.png alt:"Okta sign-in screen" width:"500" %}{: .center-image }

Once you log in, you'll see the authenticated todo app with your email.

{% img blog/spring-boot-vue/todos-with-security.png alt:"Todos app authenticated" width:"800" %}{: .center-image }

You're not done yet, however. The Spring Boot resource server is still unsecured and isn't requiring a valid JSON Web Token yet.

## Configure Spring Boot Server for JWT Auth

To add OAuth 2.0 JSON Web Token (JWT) authentication to your Spring Boot project, Okta provides a helper project, the Okta Spring Boot Starter ([check out the GitHub project](https://github.com/okta/okta-spring-boot)).

You need to add this as a dependency in the `build.gradle` file. Add the following dependency to the `dependency` block.

```groovy
dependencies {
    implementation("com.okta.spring:okta-spring-boot-starter:1.4.0")
    ...
}
```

Next, create a new Kotlin file `com/okta/springbootvue/SecurityConfiguration.kt`. This file configures the Spring Boot project to authorize all requests and to use JWT authentication.

```kotlin
package com.okta.springbootvue 

import org.springframework.security.config.annotation.web.builders.HttpSecurity 
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity 
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter 

@EnableWebSecurity 
class SecurityConfiguration : WebSecurityConfigurerAdapter() { 
   override fun configure(http: HttpSecurity?) { 
       http!!.authorizeRequests() 
               .anyRequest().authenticated() 
               .and().oauth2ResourceServer().jwt() 
   } 
}
```

Finally, add some properties to your `src/main/resources/application.properties` file. Don't forget to substitute in the correct values for your Okta domain and your OIDC Client ID (these are the same values you used above).

```properties
server.port=9000
okta.oauth2.issuer=https://{yourOktaDomain}/oauth2/default
okta.oauth2.clientId={yourClientId}
```

Start (or re-start) your Spring Boot resource server.

```bash
./gradlew bootRun
```

If you want to verify that this endpoint is now secure, use HTTPie to run a simple GET from another shell.

```bash
http :9000/todos
```

You'll see that the previously public endpoint is now protected.

```bash
HTTP/1.1 401
Cache-Control: no-cache, no-store, max-age=0, must-revalidate
Connection: keep-alive
...
```

That's pretty much it. If you go back to the todo app, you'll see that it's still working with the protected resource server.

You can check out the `auth` branch of the [example project](https://github.com/oktadeveloper/okta-kotlin-spring-boot-vue-example) to see the finished, fully authenticated code.

```bash
git clone -b auth https://github.com/oktadeveloper/okta-kotlin-spring-boot-vue-example.git
```

## Moving Forward with Okta, Vue, and Spring Boot

This tutorial covered quite a lot. You built a Vue.js client application and a Spring Boot REST service, using them to demonstrate a fully functioning CRUD application. You also added authentication using Okta and the Okta Vue SDK.

If you'd like to dig a little deeper, take a look at [the Okta Vue SDK project](https://github.com/okta/okta-vue).

The Spring Boot REST service used Spring Data's JPA implementation to persist data based on a Java class. Spring Data and JPA is a very complex area, and [the Spring docs on it](https://docs.spring.io/spring-data/jpa/docs/current/reference/html/) are a great place to learn more.

Okta also has a number of other great related tutorials.

-   [Build a CRUD App with Angular 9 and Spring Boot 2.2](/blog/2020/01/06/crud-angular-9-spring-boot-2)
-   [Build a Basic CRUD App with Vue.js and Node](/blog/2018/02/15/build-crud-app-vuejs-node)
- [Build a CRUD Application with Kotlin and React](/blog/2020/01/13/kotlin-react-crud)
-   [Build a Web App with Spring Boot and Spring Security in 15 Minutes](/blog/2018/09/26/build-a-spring-boot-webapp)
-   [10 Excellent Ways to Secure Your Spring Boot Application](/blog/2018/07/30/10-ways-to-secure-spring-boot)

If you have any questions about this post, please add a comment below. For more awesome content, follow [@oktadev](https://twitter.com/oktadev) on Twitter, like us [on Facebook](https://www.facebook.com/oktadevelopers/), or subscribe to [our YouTube channel](https://www.youtube.com/oktadev).
