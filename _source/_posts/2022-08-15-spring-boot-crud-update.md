---
layout: blog_post
title: "Spring Boot CRUD app with Vue and Quasar"
author: andrew-hughes
by: contractor
communities: [java,javascript]
description: "Build a Spring Boot Todo app with a Vue client using Okta for security and the Quasar framework for client components"
tags: []
tweets:
- ""
- ""
- ""
image:
type: conversion

---

You're going to use Vue and Spring Boot to build a todo list web application. The application will include CRUD abilities, meaning that you will be able to **c**reate, **r**ead, **u**pdate, and **d**elete the todo items on the Spring Boot API via the client. The Vue front-end client will use the Quasar framework for presentation. Both the Spring Boot API and the Vue client will be secured with OAuth 2.0 and OpenID Connect (OIDC) using Okta as the security provider.

{% img blog/spring-boot-crud-update/spring-and-vue.png alt:"Spring Boot, Vue, and Okta logos" width:"500" %}{: .center-image }

This project has two major parts:

- Spring Boot API
- Vue client

The Spring Boot app will include an H2 in-memory database and will use Spring Data JPA to map our todo data model to a database table for persistence. As you'll see, the server will leverage Spring Boot's ability to quickly expose data via a REST API with a minimum of configuration.

The client will use [Vue 3](https://vuejs.org/) and the Quasar Framework. [The Quasar Framework](https://quasar.dev/) provides components and layout tools to help build Vue applications quickly with a consistent, high-quality user interface.

**Prerequisites:**

- [Java 11](https://adoptium.net/): or use [SDKMAN!](https://sdkman.io/) to manage and install multiple version

- [Okta CLI](https://cli.okta.com/manual/#installation)

- [HTTPie](https://httpie.org/doc#installation)

- [Node 16+](https://nodejs.org)
- [Vue CLI](https://cli.vuejs.org/guide/installation.html)

You will need a free Okta Developer account if you don't already have one. But you can wait until later in the tutorial and use the Okta CLI to login or register for a new account.

## Create Okta OIDC app

Open a Bash shell. Create a parent directory for the project. Eventually, this will include both the resource server and client projects.

```bash
mkdir spring-boot-vue-crud
cd spring-boot-vue-crud
```

{% include setup/cli.md type="spa" loginRedirectUri="http://localhost:8080/login/callback" %}

Your console should finish with something like this:

```bash
...
Configuring a new OIDC Application, almost done:
Created OIDC application, client-id: 0oa5rdbh01J0293u209
|
Okta application configuration: 
Issuer:    https://dev-123567.okta.com/oauth2/default
Client ID: 0oa5rdbh01J0293u209
```

Copy the client ID and issuer URI somewhere. You'll need them for both the client and resource server applications.

## Bootstrap the Spring Boot app using Spring Initializr

You're going to use [the Spring Initializr](start.spring.io/) to create a starter project for the resource server. You can take a look at the project website if you want, but here you're going to use the REST API to download a pre-configured starter.

The following command will download the starter project and un-tar it to a new directory named `resource-server`.

```bash
curl https://start.spring.io/starter.tgz \
  -d bootVersion=2.6.10 \
  -d jvmVersion=11 \
  -d dependencies=web,data-rest,lombok,data-jpa,h2,okta \
  -d type=gradle-project \
  -d baseDir=resource-server \
| tar -xzvf - && cd resource-server
```

The dependencies you're including are:

- `web`: [Spring Web MVC](https://docs.spring.io/spring-framework/docs/3.2.x/spring-framework-reference/html/mvc.html), adds basic HTTP rest functionality
- `data-jpa`: [Spring Data JPA](https://spring.io/projects/spring-data-jpa), makes it easy to create JPA-based repositories
- `data-rest`: [Spring Data Rest](https://spring.io/projects/spring-data-rest), exposes Spring Data repositories as resource servers
- `h2`: the [H2](https://www.h2database.com/html/main.html) in-memory database used for demonstration purposes
- `lombok`: [Project Lombok](https://projectlombok.org/), adds some helpful annotations that eliminate the need to write a lot of getters and setters
- `okta`: [Okta Spring Boot Starter](https://github.com/okta/okta-spring-boot) that helps OAuth 2.0 and OIDC configuration

Project Lombok saves a lot of clutter and ceremony code. However, if you're using an IDE, you'll need to install a plugin for Lombok.

## Update the Secure Spring Boot app

Open the application properties file and update it. You're changing the server port so it doesn't conflict with the default Vue local server (which also defaults `8080`). 

`src/main/resources/application.properties`

```properties
server.port=9000
okta.oauth2.issuer=<your-issuer-uri>
okta.oauth2.clientId=<your-client-id>
```

**You need to replace the two bracketed values** with the values you generated above for the OIDC app using the Okta CLI.

Open the `build.gradle` file and change the `sourceCompatibility` from 17 to 11. I think this should have been done by the `jvmVersion` flag when the project was downloaded via the REST API. However, for me, it wasn't. If you're running Java 17 locally, it won't matter, but if you're running Java 11 this will cause an error when you try and run the project.
```groovy
sourceCompatibility = '11'
```

You can run the bootstrapped project right now and see if it starts. It should start but won't do much.

```bash
./gradlew bootRun
```

Create a `SecurityConfiguration` class to configure Spring Security. The class below configures web security to allow all requests, effectively bypassing security. This is just so you can test the resource server initially. You'll enable security shortly.

`src/main/java/com/example/demo/SecurityConfiguration.java`

```java
package com.example.demo;

import com.okta.spring.boot.oauth.Okta;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configuration.WebSecurityConfigurerAdapter;

@EnableWebSecurity
@Configuration
public class SecurityConfiguration {
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.authorizeRequests()
            .anyRequest().permitAll();
        // Send a 401 message to the browser (w/o this, you'll see a blank page)
        Okta.configureResourceServer401ResponseBody(http);
        return http.build();
    }

}
```

Replace the `DemoApplication.java` file with the following.

`src/main/java/com/example/demo/DemoApplication.java`

```java
package com.example.demo;

import org.springframework.boot.ApplicationRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.core.Ordered;
import org.springframework.data.rest.core.config.RepositoryRestConfiguration;
import org.springframework.data.rest.webmvc.config.RepositoryRestConfigurer;
import org.springframework.stereotype.Component;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;
import org.springframework.web.servlet.config.annotation.CorsRegistry;

import java.util.Collections;
import java.util.Random;
import java.util.stream.Stream;

@SpringBootApplication
public class DemoApplication {

    public static void main(String[] args) {
        SpringApplication.run(DemoApplication.class, args);
    }

    // Bootstrap some test data into the in-memory database
    @Bean
    ApplicationRunner init(TodoRepository repository) {
        return args -> {
            Random rd = new Random();
            Stream.of("Buy milk", "Eat pizza", "Update tutorial", "Study Vue", "Go kayaking").forEach(name -> {
                Todo todo = new Todo();
                todo.setTitle(name);
                todo.setCompleted(rd.nextBoolean());
                repository.save(todo);
            });
            repository.findAll().forEach(System.out::println);
        };
    }

    // Fix the CORS errors
    @Bean
    public FilterRegistrationBean simpleCorsFilter() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowCredentials(true);
        // *** URL below needs to match the Vue client URL and port ***
        config.setAllowedOrigins(Collections.singletonList("http://localhost:8080"));
        config.setAllowedMethods(Collections.singletonList("*"));
        config.setAllowedHeaders(Collections.singletonList("*"));
        source.registerCorsConfiguration("/**", config);
        FilterRegistrationBean bean = new FilterRegistrationBean<>(new CorsFilter(source));
        bean.setOrder(Ordered.HIGHEST_PRECEDENCE);
        return bean;
    }

    // Expose IDs of Todo items
    @Component
    class RestRespositoryConfigurator implements RepositoryRestConfigurer {
        public void configureRepositoryRestConfiguration(RepositoryRestConfiguration config, CorsRegistry cors) {
            config.exposeIdsFor(Todo.class);
        }
    }
    
}

```

This demo application does three things that are helpful for demonstration purposes. First, it loads some test todo items into the repository. 

Second, it configures the rest repository to expose IDs for the todo items. 

Third, it defines a filter to allow cross-origin requests from `http://localhost:8080`. This is necessary so that the Vue application, which is loaded from `http://localhost:9000` via the local test server, can load data from the Spring Boot resource server at `http://localhost:8080`. 

For more info on CORS (cross-origin resource sharing), take a look at [the Mozilla docs](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS).

Now, create the data model for the todo items. 

`src/main/java/com/example/demo/Todo.java`

```java
package com.example.demo;

import lombok.*;

import javax.persistence.Id;
import javax.persistence.GeneratedValue;
import javax.persistence.Entity;

@Entity
@Data
@NoArgsConstructor
public class Todo {

    @Id @GeneratedValue
    private Long id;

    @NonNull
    private String title;

    private Boolean completed = false;

}
```

Notice the use of the Lombok annotations (`@Entity`, `@Data`, and `@NoArgsConstructor`) to keep the code simple and clean.

The todo items have two fields: a title string and a completed boolean. The fields are annotated with Spring Data JPA annotations that allow the Java class to be mapped to a database table for persistence.

Create a repository to persist the data model.

`src/main/java/com/example/demo/TodoRepository.java`

```java
package com.example.demo;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.rest.core.annotation.RepositoryRestResource;

@RepositoryRestResource
interface TodoRepository extends JpaRepository<Todo, Long> {}
```

This is a Spring JpaRepository that can persist the data model you just defined. Because it is annotated with `@RepositoryRestResource` (and because the `data-rest` dependency was included), this repository will be automatically exposed as a web resource.

## Test the unsecured app and secure it

Run the app using the following command from the `resource-server` subdirectory.

```bash
./gradlew bootRun
```

Open a new Bash shell and use HTTPie to test the resource server.

```bash
http :9000/todos
```

```bash
HTTP/1.1 200 
...

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
            {
                "_links": {
                    "self": {
                        "href": "http://localhost:9000/todos/2"
                    },
                    "todo": {
                        "href": "http://localhost:9000/todos/2"
                    }
                },
                "completed": true,
                "id": 2,
                "title": "Eat pizza"
            },
            ...
        ]
    },
...
}
```

Stop the resource server using `control-c`. 

Edit the security configuration file, updating the security configuration bean definition to the following.

`src/main/java/com/example/demo/OAuth2ResourceServerSecurityConfiguration.java`

```java
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http.authorizeRequests()
        .anyRequest().authenticated()
        .and()
        .oauth2ResourceServer().jwt();
    // Send a 401 message to the browser (w/o this, you'll see a blank page)
    Okta.configureResourceServer401ResponseBody(http);
    return http.build();
}
```

This configuration requires JWT auth on all requests.

Re-start the server. Use `control-c` stop it if it's running.

```bash
./gradlew bootRun
```

Use HTTPie again to try and request the todo items.

```bash
http :9000/todos
```

You will get an error.

```bash
HTTP/1.1 401 
...

401 Unauthorized

```

The resource server is finished. The next step is to create the Vue client.

## Create the Vue Javascript client

From the project parent directory, use the Vue CLI to create a new application and navigate into the newly created `client` directory.

```bash
 vue create client && cd client
```

Pick `Default Vue 3`

Wait for it to finish. Add the Quasar Framework.

```bash
vue add quasar
```

You can just accept the defaults. For me they were the following.

- **Allow Quasar to replace App.vue, About.vue, Home.vue and (if available) router.js?** Yes
- **Pick your favorite CSS preprocessor:** Sass
- **Choose Quasar Icon Set:** Material
- **Default Quasar language pack:** en-US
- **Use RTL support?** No

Add our dependencies.

```bash
npm i --save axios vuejs3-logger vue-router@4 @okta/okta-vue
```

- `axios` is an HTTP client request library
- `vuejs3-logger` is a logging library
- `vue-router` is the standard for routing between pages in Vue
- `okta/okta-vue` is the Okta helper for Vue

To learn more about how Okta integrates with Vue, take a look at [the GitHub page](https://github.com/okta/okta-vue) for the `okta/okta-vue` project. There are also more resources and example applications listed on in [the general Okta docs](https://developer.okta.com/code/vue/).

Replace `main.js` with the following. Look at the `OktaAuth` configuration object. Notice the client ID and issuer URI are pulled from a `.env` file.

`src/main.js`

```js
/* eslint-disable */
import {createApp} from 'vue'
import App from './App.vue'
import {Quasar} from 'quasar'
import quasarUserOptions from './quasar-user-options'
import VueLogger from 'vuejs3-logger'
import router from './router'
import createApi from './Api'

import {OktaAuth} from '@okta/okta-auth-js'
import OktaVue from '@okta/okta-vue'

if (process.env.VUE_APP_ISSUER_URI == null || process.env.VUE_APP_CLIENT_ID == null || process.env.VUE_APP_SERVER_URI == null) {
  throw "Please define VUE_APP_ISSUER_URI, VUE_APP_CLIENT_ID, and VUE_APP_SERVER_URI in .env file"
}

const oktaAuth = new OktaAuth({
  issuer: process.env.VUE_APP_ISSUER_URI,
  clientId: process.env.VUE_APP_CLIENT_ID,
  redirectUri: window.location.origin + '/login/callback',
  scopes: ['openid', 'profile', 'email']
})

const options = {
  isEnabled: true,
  logLevel: 'debug',
  stringifyArguments: false,
  showLogLevel: true,
  showMethodName: false,
  separator: '|',
  showConsoleColors: true
};

const app = createApp(App)
  .use(Quasar, quasarUserOptions)
  .use(VueLogger, options)
  .use(OktaVue, {oktaAuth})
  .use(router)

app.config.globalProperties.$api = createApi(app.config.globalProperties.$auth)

app.mount('#app')
```

Stated very briefly, the file above creates the main Vue app and configures it to use our dependencies: Quasar, VueLogger, OktaVue, and the router. It also creates the Api class that handles the requests to the resource server and passes it the `$auth` object it needs to get the JWT.

Create a `.env` file in the client project root directory. The **Client ID** and **Issuer URI** are the values you used above in the Spring Boot `application.properties` file. The **Server URI** is the local URI for the Spring Boot API. You can leave this as it is unless you made a change (this gets used in the `Api.js` module).

`.env`

```env
VUE_APP_CLIENT_ID=<your-client-id>
VUE_APP_ISSUER_URI=<your-issuer-uri>
VUE_APP_SERVER_URI=http://localhost:9000
```

It's important to note that putting values like this in a `.env` file in a client application does not make then secure. It helps by keeping them out of a repository. However, they are still public in the sense that they are necessarily visible in the Javascript code sent to the browser. In this use case, it's more of a configuration and organizational tool than a security tool. 

Replace `App.vue` with the following.

`src/App.vue`

{% raw %}
```vue
<template>
  <q-layout view="hHh lpR fFf">

    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-toolbar-title>
          <q-avatar>
            <q-icon name="kayaking" size="30px"></q-icon>
          </q-avatar>
          Todo App
        </q-toolbar-title>
        {{ this.claims && this.claims.email ? claims.email : '' }}
        <q-btn flat round dense icon="logout" v-if='authState && authState.isAuthenticated' @click="logout"/>
        <q-btn flat round dense icon="account_circle" v-else @click="login"/>
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view></router-view>
    </q-page-container>

  </q-layout>
</template>

<script>
export default {
  name: 'LayoutDefault',
  data: function () {
    return {
      claims: null
    }
  },
  watch: {
    'authState.isAuthenticated'() {
      this.$log.debug(("watch triggered!"))
      this.updateClaims()
    }
  },
  created() {
    this.updateClaims()
  },
  methods: {
    async updateClaims() {
      if (this.authState && this.authState.isAuthenticated) {
        this.claims = await this.$auth.getUser()
      }
    },
    async login() {
      await this.$auth.signInWithRedirect({originalUri: '/todos'})
    },
    async logout() {
      await this.$auth.signOut()
    }
  },
}
</script>
```
{% endraw %}

This is the top-level component that defines the header bar and includes the router component. The header bar has a login or logout button and will show the authenticated user's email address when logged in.

The app gets the authenticated user's email address from the JWT claims (a claim is a piece of information asserted about the subject by the authenticating authority). This happens in the `updateClaims()` method, which is triggered when the component is created and is also triggered by a watch method so that it is updated as the authenticated state changes.

Create a new file to encapsulate the resource server access logic.

`src/Api.js`

```js
import axios from 'axios'

const instance = axios.create({
  baseURL: process.env.VUE_APP_SERVER_URI,
  timeout: 1000
});

const createApi = (auth) => {

  instance.interceptors.request.use(async function (config) {
    let accessToken = await auth.getAccessToken()
    config.headers = {
      Authorization: `Bearer ${accessToken}`
    }
    return config;
  }, function (error) {
    return Promise.reject(error);
  });

  return {

    // (C)reate
    createNew(text, completed) {
      return instance.post('/todos', {title: text, completed: completed})
    },

    // (R)ead
    getAll() {
      return instance.get('/todos', {
        transformResponse: [function (data) {
          return data ? JSON.parse(data)._embedded.todos : data;
        }]
      })
    },

    // (U)pdate
    updateForId(id, text, completed) {
      return instance.put('todos/' + id, {title: text, completed: completed})
    },

    // (D)elete
    removeForId(id) {
      return instance.delete('todos/' + id)
    }
  }
}

export default createApi
```

All of the requests to the server go through this module. Notice that the server URI is hard coded at the top as `SERVER_URL`. In production this would be moved to a config file or an environment variable. Also take a look at how the access token is retrieved from the global `auth` object and injected into every request.

Create the router file.

`src/router/index.js`

```js
import {createRouter, createWebHistory} from 'vue-router'
import {navigationGuard} from '@okta/okta-vue'
import Todos from "@/components/Todos";
import Home from "@/components/Home";
import {LoginCallback} from '@okta/okta-vue'

const routes = [
  {
    path: '/',
    component: Home
  },
  {
    path: '/todos',
    component: Todos,
    meta: {
      requiresAuth: true
    }
  },
  {path: '/login/callback', component: LoginCallback},
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
})

router.beforeEach(navigationGuard)

export default router
```

The router has three paths. The home path and the todos path are straightforward. The last path, `/login/callback`, is provided by the Okta module and it is what handles the login redirect from the Okta servers after authentication.

Create the `Home` component.

`src/components/Home.vue`

{% raw %}
```vue
<template>
  <div class="column justify-center items-center" id="row-container">
    <q-card class="my-card">
      <q-card-section style="text-align: center">
        <div v-if='authState && authState.isAuthenticated' >
          <h6 v-if="claims && claims.email">You are logged in as {{claims.email}}</h6>
          <h6 v-else>You are logged in</h6>
          <q-btn flat color="primary" @click="todo">Go to Todo app</q-btn>
          <q-btn flat @click="logout">Log out</q-btn>
        </div>
        <div v-else>
          <h6>Please <a href="#" @click.prevent="login">log in</a> to access Todo app</h6>
        </div>
      </q-card-section>
    </q-card>
  </div></template>

<script>
export default {
  name: "home-component",
  data: function () {
    return {
      claims: ''
    }
  },
  created () { this.setup() },
  methods: {
    async setup () {
      if (this.authState && this.authState.isAuthenticated) {
        this.claims = await this.$auth.getUser()
      }
    },
    todo() {
      this.$router.push("/todos")
    },
    async login () {
      await this.$auth.signInWithRedirect({ originalUri: '/todos'} )
    },
    async logout () {
      await this.$auth.signOut()
    }
  }
}
</script>
```
{% endraw %}

Create the `TodoItem` component.

`src/components/TodoItem.vue`

{% raw %}
```vue
<template>
  <q-item-section avatar class="check-icon" v-if="this.item.completed">
    <q-icon color="green" name="done" @click="handleClickSetCompleted(false)"/>
  </q-item-section>
  <q-item-section avatar class="check-icon" v-else>
    <q-icon color="gray" name="check_box_outline_blank" @click="handleClickSetCompleted(true)"/>
  </q-item-section>
  <q-item-section v-if="!editing">{{this.item.title}}</q-item-section>
  <q-item-section v-else>
    <input
        class="list-item-input"
        type="text"
        name="textinput"
        ref="input"
        v-model="editingTitle"
        @change="handleDoneEditing"
        @blur="handleCancelEditing"
    />
  </q-item-section>
  <q-item-section avatar class="hide-icon" @click="handleClickEdit">
    <q-icon color="primary" name="edit" />
  </q-item-section>
  <q-item-section avatar class="hide-icon close-icon" @click="handleClickDelete">
    <q-icon color="red" name="close" />
  </q-item-section>
</template>
<script>

import { nextTick } from 'vue'

export default {
  name: "TodoItem",
  props: {
    item: Object,
    deleteMe: Function,
    showError: Function,
    setCompleted: Function,
    setTitle: Function
  },
  data: function () {
    return {
      editing: false,
      editingTitle: this.item.title,
    }
  },
  methods: {
    handleClickEdit () {
      this.editing = true
      this.editingTitle = this.item.title
      nextTick(function () {
        this.$refs.input.focus()
      }.bind(this))
    },
    handleCancelEditing () {
      this.editing = false
    },
    handleDoneEditing () {
      this.editing = false
      this.$api.updateForId(this.item.id, this.editingTitle, this.item.completed).then((response) => {
        this.setTitle(this.item.id, this.editingTitle)
        this.$log.info("Item updated:", response.data);
      }).catch((error) => {
        this.showError("Failed to update todo title")
        this.$log.debug(error)
      });
    },
    handleClickSetCompleted(value) {
      this.$api.updateForId(this.item.id, this.item.title, value).then((response) => {
        this.setCompleted(this.item.id, value)
        this.$log.info("Item updated:", response.data);
      }).catch((error) => {
        this.showError("Failed to update todo completed status")
        this.$log.debug(error)
      });
    },
    handleClickDelete() {
      this.deleteMe(this.item.id)
    }
  }
}
</script>

<style scoped>
.todo-item .close-icon {
  min-width: 0px;
  padding-left: 5px !important;
}
.todo-item .hide-icon {
  opacity: 0.1;
}
.todo-item:hover .hide-icon {
  opacity: 0.8;
}
.check-icon {
  min-width: 0px;
  padding-right: 5px !important;
}
input.list-item-input {
  border: none;
}
</style>
```
{% endraw %}

This component encapsulates a single todo item. It has logic for editing the title, setting the completed status, and deleting items. If you look closely at the code, you'll notice that it both sends changes to the server and also updates the local copy stored in the `todos` array in the parent component. 

Create the `Todos` component.

`src/components/Todos.vue`

{% raw %}
```vue
<template>
  <div class="column justify-center items-center" id="row-container">
    <q-card class="my-card">
      <q-card-section>
        <div class="text-h4">Todos</div>
        <q-list padding>
          <q-item
              v-for="item in filteredTodos" :key="item.id"
              clickable
              v-ripple
              rounded
              class="todo-item"
          >
            <TodoItem
                :item="item"
                :deleteMe="handleClickDelete"
                :showError="handleShowError"
                :setCompleted="handleSetCompleted"
                :setTitle="handleSetTitle"
                v-if="filter === 'all' || (filter === 'incomplete' && !item.completed) || (filter === 'complete' && item.completed)"
            ></TodoItem>
          </q-item>
        </q-list>
      </q-card-section>
      <q-card-section>
        <q-item>
          <q-item-section avatar class="add-item-icon">
            <q-icon color="green" name="add_circle_outline"/>
          </q-item-section>
          <q-item-section>
            <input
                type="text"
                ref="newTodoInput"
                v-model="newTodoTitle"
                @change="handleDoneEditingNewTodo"
                @blur="handleCancelEditingNewTodo"
            />
          </q-item-section>
        </q-item>
      </q-card-section>
      <q-card-section style="text-align: center">
        <q-btn color="amber" text-color="black" label="Remove Completed" style="margin-right: 10px" @click="handleDeleteCompleted"></q-btn>
        <q-btn-group>
          <q-btn glossy :color="filter === 'all' ? 'primary' : 'white'" text-color="black" label="All" @click="handleSetFilter('all')"/>
          <q-btn glossy :color="filter === 'complete' ? 'primary' : 'white'" text-color="black" label="Completed" @click="handleSetFilter('complete')"/>
          <q-btn glossy :color="filter === 'incomplete' ? 'primary' : 'white'" text-color="black" label="Incomplete" @click="handleSetFilter('incomplete')"/>
          <q-tooltip>
            Filter the todos
          </q-tooltip>
        </q-btn-group>
      </q-card-section>
    </q-card>
    <div v-if="error" class="error">
      <q-banner inline-actions class="text-white bg-red" @click="handleErrorClick">
        ERROR: {{this.error}}
      </q-banner>
    </div>
  </div>
</template>

<script>

import TodoItem from "@/components/TodoItem";
import { ref } from 'vue'

export default {
  name: 'LayoutDefault',

  components: {
    TodoItem
  },

  data: function() {
    return {
      todos: [],
      newTodoTitle: '',
      visibility: 'all',
      loading: true,
      error: "",
      filter: "all"
    }
  },

  setup () {
    return {
      alert: ref(false),
    }
  },
  mounted() {
    this.$api.getAll()
        .then(response => {
          this.$log.debug("Data loaded: ", response.data)
          this.todos = response.data
        })
        .catch(error => {
          this.$log.debug(error)
          this.error = "Failed to load todos"
        })
        .finally(() => this.loading = false)
  },

  computed: {
    filteredTodos() {
      if (this.filter === 'all') return this.todos
      else if (this.filter === 'complete') return this.todos.filter(todo => todo.completed)
      else if (this.filter === 'incomplete') return this.todos.filter(todo => !todo.completed)
      else return []
    }
  },

  methods: {

    handleSetFilter(value) {
      this.filter = value
    },

    handleClickDelete(id) {
      const todoToRemove = this.todos.find(todo => todo.id === id)
      this.$api.removeForId(id).then(() => {
        this.$log.debug("Item removed:", todoToRemove);
        this.todos.splice(this.todos.indexOf(todoToRemove), 1)
      }).catch((error) => {
        this.$log.debug(error);
        this.error = "Failed to remove todo"
      });
    },

    handleDeleteCompleted() {
      const completed = this.todos.filter(todo => todo.completed)
      Promise.all(completed.map( todoToRemove => {
        return this.$api.removeForId(todoToRemove.id).then(() => {
          this.$log.debug("Item removed:", todoToRemove);
          this.todos.splice(this.todos.indexOf(todoToRemove), 1)
        }).catch((error) => {
          this.$log.debug(error);
          this.error = "Failed to remove todo"
          return error
        })
      }))
    },

    handleDoneEditingNewTodo() {
      const value = this.newTodoTitle && this.newTodoTitle.trim()
      if (!value) {
        return
      }
      this.$api.createNew(value, false).then( (response) => {
        this.$log.debug("New item created:", response)
        this.newTodoTitle = ""
        this.todos.push({
          id: response.data.id,
          title: value,
          completed: false
        })
        this.$refs.newTodoInput.blur()
      }).catch((error) => {
        this.$log.debug(error);
        this.error = "Failed to add todo"
      });
    },
    handleCancelEditingNewTodo() {
      this.newTodoTitle = ""
    },

    handleSetCompleted(id, value) {
      let todo = this.todos.find(todo => id === todo.id)
      todo.completed = value
    },

    handleSetTitle(id, value) {
      let todo = this.todos.find(todo => id === todo.id)
      todo.title = value
    },

    handleShowError(message) {
      this.error = message
    },

    handleErrorClick () {
      this.error = null;
    },

  },

}
</script>

<style>
#row-container {
  margin-top: 100px;
}
.my-card {
  min-width: 600px;
}
.error {
  color: red;
  text-align: center;
  min-width: 600px;
  margin-top: 10px;
}
</style>
```
{% endraw %}

This component encapsulates the card that holds all of the todos, as well as the todo-associated interface elements. It also handles the rest of the functions related to updating todos on the server as well as in the local cache. 

You're welcome to delete the `HelloWorld.vue` component, if you want. Or you can leave it. It's not needed.

## Test the todo app

Make sure the Spring Boot API is still running. In a separate Bash shell, from the resource server directory, run the following command (if it is not already still running)

```bash
./gradlew bootRun
```

Start the Vue app using the embedded development server. From the client directory:

```bash
npm run serve
```

Open a browser and navigate to [http://localhost:8080](http://localhost:8080). You'll see the "please log in" page.


{% img blog/spring-boot-crud-update/please-log-in.png alt:"Please log in" width:"1000" %}{: .center-image }

Log into the app using Okta SSO.

{% img blog/spring-boot-crud-update/okta-login.png alt:"Okta SSO login" width:"600" %}{: .center-image }

That will redirect you to the Todo app main screen.

{% img blog/spring-boot-crud-update/app-main-screen.png alt:"Todo app main screen" width:"1000" %}{: .center-image }

You should be able to delete items, add new items, rename items, and filter items. All data is stored on the Spring Boot resource server and is presented by the Vue + Quasar frontend. 

## Wrapping up

In this tutorial, you built a Spring Boot resource server backend and a Vue front-end. The Vue client used the latest Vue 3 version with the Quasar framework. The app included full CRUD (create, read, update, and delete) capabilities. It was all secured using Okta.

If you liked this post, there's a good chance you'll like similar ones:

- [Introducing Spring Native for JHipster: Serverless Full-Stack Made Easy](/blog/2022/03/03/spring-native-jhipster)
- [Add Authentication to Your Vanilla JavaScript App in 20 Minutes](/blog/2018/06/05/authentication-vanilla-js)
- [Mobile Development with Ionic, React Native, and JHipster](/blog/2020/04/27/mobile-development-ionic-react-native-jhipster)
- [Fast Java Made Easy with Quarkus and JHipster](/blog/2021/03/08/jhipster-quarkus-oidc)
- [Build a CRUD App with Vue.js, Spring Boot, and Kotlin](/blog/2020/06/26/spring-boot-vue-kotlin)
- [Add OpenID Connect to Angular Apps Quickly](/blog/2022/02/11/angular-auth0-quickly)

If you have questions, please ask them in the comments below! If you're into social media, follow us: [@oktadev on Twitter](https://twitter.com/oktadev), [Okta for Developers on LinkedIn](https://www.linkedin.com/company/oktadev), and [OktaDev](https://www.facebook.com/oktadevelopers) on Facebook. If you like learning via video, subscribe to [our YouTube channel](https://youtube.com/oktadev).
