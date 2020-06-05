---
layout: blog_post
title: "Use Kotlin, Spring Boot, and Vue.js to Build a Simple CRUD App"
author: moksamedia
description: "Create a CRUD (create, read, update, and delete) application using Spring Boot and Vue.js."
tags: [java, spring, spring boot, vue, crud, tutorial]
tweets:
- ""
- ""
- ""
image: 
---

## Use Kotlin, Spring Boot, and Vue.js to Build a Simple CRUD App

You're going to build a fully-functioning client-server CRUD application using Vue.js for the client and Spring Boot for the resource server. The Spring Boot server application will be written using Kotlin. You'll also use Okta and OAuth 2.0 to secure the application.

CRUD, if you don't know, is **C**reate, **R**ead, **U**pdate, and **D**elete. Once you can do these operations, you've got all the basics for a server application.

The example application you're going to build here is a todo app. The client side of the app is based on a project written by [Evan You](http://evanyou.me) and [the original Vue Todo App project](https://vuejs.org/v2/examples/todomvc.html). It's all been modified a fair amount, but to give credit where credit is due.

## Requirements

- **Java 11**: This tutorial uses Java 11. OpenJDK 11 will work just as well. You can find instructions on the [OpenJDK website](https://openjdk.java.net/install/). You can install OpenJDK using [Homebrew](https://brew.sh/). Alternatively, [SDKMAN](https://sdkman.io/) is another great option for installing and managing Java versions.
- **Okta Developer Account**: You’ll be using Okta as an OAuth/OIDC provider to add JWT authentication and authorization to the application. You can go to [our developer site](https://developer.okta.com/signup/) and sign up for a free developer account.
- **HTTPie**: This is a powerful command-line HTTP request utility that you'll use to test the WebFlux server. Install it according to [the docs on their site](https://httpie.org/doc#installation).
- **Yarn**: Yarn is a package manager, like NPM. Install it using Homebrew, `brew install yarn`, or by following [the instructions on their website](https://classic.yarnpkg.com/en/docs/install). 
- **Node**: There are a number of ways to install Node. One option is to [download it from their website](https://nodejs.org/en/download/). Another option is the `n` package manager. Get it from [their GitHub page](https://github.com/tj/n). You can also use Node Version Manager, or NVM. Take a look at [their GitHub page for installation details](https://github.com/nvm-sh/nvm#installing-and-updating). I'm currently on Node 12.14.0.

## Download the Example Application

Go ahead an download the example application from [the project GitHub repository](https://need.a.link).

The example project contains two main sub-directories:

 - `client`: contains the Vue.js client
 - `server`: contains the Spring Boot Kotlin resource server

First you're going to take a look at the resource server and make sure that's all working.

## Kotlin Spring Boot Resource Server

The Kotlin resource server is pretty simple. Spring has done a great job reducing boilerplate code. There are four Kotlin source files in the project, all in the `com.okta.springbootvue` package:

 - `SpingbootvueApplication`: the main entrypoint into the application
 - `RestRepositoryConfigurator`: used to configure the auto-generated REST resource to return resource IDs
 - `Todo`: defines the Todo class data model
 - `TodoRepository`: configures the auto-generated Spring Boot JPA repository

The first file, `SpingbootvueApplication`, is the place where the application starts. It contains the `@SpringBootApplication` annotation that loads the Spring Boot framework. It also contains a function named `init()` that loads some initial test data into the repository. It contains a bean that configures a CORS filter, so that you can make calls from the Vue.js application without getting cross-origin errors. Finally, it contains the good, old-fashioned `main()` function where all the magic begins.

`com/okta/springbootvue/SpingbootvueApplication.kt`
```kotlin
@SpringBootApplication
class SpringBootVueApplication {
    // Bootstrap some test data into the in-memory database
    @Bean
    fun init(repository: TodoRepository): ApplicationRunner {
        return ApplicationRunner { args: ApplicationArguments? ->
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

The `Todo` class is what defines the data model. It defines three properties: 1) a string `title`, 2) a boolean `completed`, and 3) an auto-generated `id` integer value. If you're not familiar with Kotlin you might find it strange, but the `title` and the `completed` properties are declared on the first line of the class definition in the default constructor. 

Other than that, the `@Entity` annotation is what tell Spring that this class is a data model entity. There's also a helper `toString()` override. 

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

Spring is doing a ton of work behind the scenes. Pretty much all of the resource server infrastructure is auto-generated. All you're doing is defining the data model and pointing Spring Boot at it. This is achingly clear in the next class, `TodoRepository`, which is the class that defines and creates the REST interface to your resource server as well as your persistence store. 

The persistence store in this case (the class that is responsible for saving and loading your data resources from a database) uses the default store, which is an in-memory database--great for examples and testing, but would need to be overridden in production so that you can actually persist your data.

The coolest part is the `@RepositoryRestResource` annotation. Adding that to the `JpaRepository` class is all you have to do to get Spring to turn your repository into a REST interface. This annotation requires the `spring-boot-starter-data-rest` dependency. The details of the resource server can be configured extensively. Take a look at [the Spring Data REST Reference documentation](https://docs.spring.io/spring-data/rest/docs/current/reference/html/#reference) for more info.

Now for the code. Yep. That's it.

`com/okta/springbootvue/TodoRepository.kt`
```kotlin
@RepositoryRestResource
interface TodoRepository:JpaRepository<Todo, Long>
```

The last file is `RestRepositoryConfigurator`. This file overrides `RepositoryRestConfigurer` and is used to configure the REST repository. Specifically, it configures it to expose IDs for the Todo class. This tells Spring that when it returns Todo objects, it should return the object ID with it as well. Doing this makes it a lot easier to implement the CRUD methods on the client side.

```kotlin
@Component
class RestRepositoryConfigurator : RepositoryRestConfigurer {
    override fun configureRepositoryRestConfiguration(config: RepositoryRestConfiguration) {
        config.exposeIdsFor(Todo::class.java)
    }
}
```

## Test the Resource Server

That's all you need to have a working REST API.

Now you're going to test it using HTTPie. But first, open a shell, navigate to the `/server` sub-directory, and start the server using `./gradlew bootRun`.

You should see some output that ends like this:
```bash
2020-06-03 19:31:34.033  INFO 25910 --- [  restartedMain] DeferredRepositoryInitializationListener : Spring Data repositories initialized!
2020-06-03 19:31:34.039  INFO 25910 --- [  restartedMain] c.o.s.SpringBootVueApplication$Companion : Started SpringBootVueApplication.Companion in 2.287 seconds (JVM running for 2.532)
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
The `profile` link has to do with the ALPS (Application-Level Profile Semantics). Take a look at [the Spring docs](https://docs.spring.io/spring-data/rest/docs/current/reference/html/#metadata.alps) on it. It’s a way to describe the available resources exposed by the REST API.

The `todos` link is the endpoint generated from the Todo class.

Perform a GET on the `/todos` endpoint: `http :9000/todos`

You'll see some output like below (for brevity I've omitted all but the first of the todo objects).

```bash
HTTP/1.1 200 
Connection: keep-alive
Content-Type: application/hal+json
Date: Thu, 04 Jun 2020 02:35:59 GMT
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

`http POST :9000/todos title="Drink more coffee"`
```bash
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

If you perform another GET on the `/todos` endpoint,  you'll see that there are now 6 todo items and the last item is your newly added todo.

`http :9000/todos`

Again, a lot of the output below has been omitted for brevity, but notice the `page.totalElements` value now equals 6 and that there is a new todo item.

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

I'm not going to go into a ton of detail on the Vue.js client app. A lot of this was covered in [the previous tutorial](https://developer.okta.com/blog/2018/11/20/build-crud-spring-and-vue) and is largely the same. I will explicitly show you how to modify the unsecured client app (and server) to use Okta OAuth.

The Vue module that is the heart of the app is `src/components/Todos.vue`. This is what you see and what controls the application flow. 

Another important file is `src/Api.js`. This module encapsulates the functionality for interacting with the resource server using the `axios` HTTP client module. If you look at the code below you'll see that this module contains clear methods for Create, Read, Update, and Delete. You'll also notice how I'm able to create a base axios instance that is configured with some global settings, such as the server URL and the timeout. Later, this comes in handy when we need to configure the token authentication.

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

Before running the client app, you need to install the dependencies: `yarn install`.

Go ahead and run the client using `yarn serve`. Make sure your resource server is still running as well. If not, run it using `./gradlew bootRun`.

Open a browser and navigate to [http://localhost:8080](http://localhost:8080).

{% img blog/spring-boot-vue-2/image1.png alt:"" width:"800" %}{: .center-image }

Try it out! You can edit existing todos, delete them, and create new ones.

## Create and OIDC Application With Okta

You should have already signed up for a free Okta developer account. The next step is to create an OpenID Connect (OIDC) application. Once you’ve logged in to your Okta developer dashboard, click on the **Application** top-menu item, and then on the **Add Application** button.

Select application type **Single-Page App**.

Click **Next**.

Give the app a name. I named mine `Vue Client`.

The rest of the default values will work.

Click **Done**.

On the next screen, take note of the **Client ID** (near the bottom), as you'll need it in a bit.

## Add Authentication to Vue

To configure Vue.js to use Okta as an OAuth 2.0 and OIDC provider, you're going to use the `okta-vue` module. This greatly simplifies integrating Okta authentication into your client application. You can take a look at [the project GitHub page](https://github.com/okta/okta-oidc-js/tree/master/packages/okta-vue) for more info.

Stop your client Vue.js application. Open a shell and from the `/client` sub-directory of the example project, use Yarn to install `okta-vue`.

```bash
yarn add @okta/okta-vue@2.0.0
```
Now create a `src/router.js` file in the client app project.

```js
import Auth from "@okta/okta-vue";
import Vue from 'vue'
import Router from 'vue-router'
import Todos from './components/Todos'

Vue.use(Auth, {
    issuer: 'https://{yourOktaDomain}/oauth2/default',
    clientId: '{yourClientId}',
    redirectUri: window.location.origin + '/implicit/callback',
    scopes: ['openid', 'profile', 'email'],
    pkce: true
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
            path: '/implicit/callback',
            component: Auth.handleCallback(),
        },
    ]
});

router.beforeEach(Vue.prototype.$auth.authRedirectGuard());

export default router;
```

You need to replace `{yourClientId}` with the Client ID from the OIDC app you just created. You also need to change `{yourOktaDomain}` to your Okta developer domain, something like `dev-123456.okta.com`.

The Okta Vue authentication plugin injects an `authClient` object into your Vue instance which can be accessed by calling `this.$auth` anywhere inside your Vue instance.

There are only two routes. The home route is the todo app itself. The `meta: { requiresAuth: true } }` property turns on authentication for that route.

The other route, `/implicit/callback`, is the OAuth 2.0 callback route that handles a successful authentication from the Okta servers.

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
  
  async created () {  
    await this.refreshActiveUser()  
  },  
  
  watch: {  
    '$route': 'refreshActiveUser'  
  },  
  
  methods: {  
    async refreshActiveUser () {  
      this.activeUser = await this.$auth.getUser()  
      this.$log.debug('activeUser',this.activeUser)  
    },  
  
    async handleLogout () {  
      await this.$auth.logout()  
      await this.refreshActiveUser()  
      this.$router.go('/')  
    }  
  },
}  
  
export default app  
  
</script>  
  
<style>  
  [v-cloak] { display: none; }  
</style>
```

These changes demonstrate a couple things. First, the code creates and updates a property, `activeUser`, that passes information to the Todos module about the current active user (if there is one, or null, if there isn’t). It also adds a logout button to the footer.

The last thing you need to do is update the `src/Api.js` file.

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
      method:method,  
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
    return this.execute('GET','todos', null, {  
      transformResponse: [function (data) {  
        return data? JSON.parse(data)._embedded.todos : data;  
      }]  
    })  
  },  
  // (U)pdate  
  updateForId(id, text, completed) {  
    return this.execute('PUT', 'todos/' + id, { title: text, completed: completed })  
  },  
  
  // (D)elete  
  removeForId(id) {  
    return this.execute('DELETE', 'todos/'+id)  
  }  
}
```

These changes get the access token from the Okta Vue Auth module and inject it into the API request methods.

## Test the Client App OAuth Flow

At this point you can run the client application and it will force you to log in.

Run: `yarn serve`.

Navigate to: [http://localhost:8080](http://localhost:8080)

You may need to use a private or incognito browser window to see the login screen.

{% img blog/spring-boot-vue-2/image3.png alt:"" width:"500" %}{: .center-image }

Once you log in, you'll see the authenticated todo app with your email.

{% img blog/spring-boot-vue-2/image4.png alt:"" width:"800" %}{: .center-image }

You're not done yet, however. The Spring Boot resource server is still unsecured and isn't requiring a valid JSON Web Token yet.


## Configure Spring Boot Server for JWT Auth

To add OAuth 2.0 JSON Web Token (JWT) authentication to your Spring Boot project, Okta has a nice helper project, the Okta Spring Boot Starter ([check out the GitHub project](https://github.com/okta/okta-spring-boot)).

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
okta.oauth2.scope="openid profile email"
```

Start (or re-start) your Spring Boot resource server.

```bash
./gradlew bootRun
```

If you want to verify that this endpoint is now secure, from another shell you can use HTTPie to run a simple GET.

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

You can checkout the `auth` branch of the example project to see the finished, fully authenticated code. 

## Moving Forward with Okta, Vue, and Spring Boot

This tutorial did quite a lot. You built a Vue.js client application and a Spring Boot REST service, using them to demonstrate a fully functioning CRUD application. You also added authentication using Okta and the Okta Vue SDK.

If you’d like to dig a little deeper, take a look at [the Okta Vue SDK project](https://github.com/okta/okta-oidc-js/tree/master/packages/okta-vue).

The Spring Boot REST service used Spring Data’s JPA implementation to persist data based on a Java class. Spring Data and JPA is a super deep area, and [the Spring docs on it](https://docs.spring.io/spring-data/jpa/docs/current/reference/html/) are a great place to learn more.

Okta also has a number of other great related tutorials.

-   [Build a Basic CRUD App with Angular 5.0 and Spring Boot 2.0](https://developer.okta.com/blog/2017/12/04/basic-crud-angular-and-spring-boot)
-   [Build a Basic CRUD App with Vue.js and Node](https://developer.okta.com/blog/2018/02/15/build-crud-app-vuejs-node)
-   [Build a Web App with Spring Boot and Spring Security in 15 Minutes](https://developer.okta.com/blog/2018/09/26/build-a-spring-boot-webapp)
-   [10 Excellent Ways to Secure Your Spring Boot Application](https://developer.okta.com/blog/2018/07/30/10-ways-to-secure-spring-boot)

If you have any questions about this post, please add a comment below. For more awesome content, follow [@oktadev](https://twitter.com/oktadev) on Twitter, like us [on Facebook](https://www.facebook.com/oktadevelopers/), or subscribe to [our YouTube channel](https://www.youtube.com/channel/UC5AMiWqFVFxF1q9Ya1FuZ_Q).
