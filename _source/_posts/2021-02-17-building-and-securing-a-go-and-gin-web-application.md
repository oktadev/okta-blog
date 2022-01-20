---
disqus_thread_id: 8402167638
discourse_topic_id: 17355
discourse_comment_url: https://devforum.okta.com/t/17355
layout: blog_post
title: Building and Securing a Go and Gin Web Application
author: phill-edwards
by: contractor
communities: [go, javascript]
description: "How to build a simple REST API with Go and secure it with Okta"
tags: [go, gin, vue, javascript]
tweets:
- "Go programmers: Have you tried using the Gin framework yet? Learn how with this post!"
- "Learn to use Go and Gin to make a single page application!"
- "Combine the power of Go with the security of Okta"
image: blog/building-and-securing-a-go-and-gin-web-application/card.png
type: conversion
---

Today, we are going to build a simple web application that implements a *to-do* list. The backend will be written in Go. It will use the Go Gin Web Framework which implements a high-performance HTTP server. The front end will use the Vue.js JavaScript framework to implement a single page application (SPA). We will secure it using Okta OAuth 2.0 authentication. Let's get started!

**PS**: The code for this project can be found on [GitHub](https://github.com/oktadeveloper/okta-go-gin-vue-example) if you'd like to check it out.

## Prerequisites to Building a Go, Gin, and Vue Application

First things first, if you don't already have Go installed on your computer you will need to [Download and install - The Go Programming Language](https://golang.org/doc/install).

Finally, create a project directory where all of our future code will live:

```bash
mkdir ~/okta-go-gin-vue-example
cd ~/okta-go-gin-vue-example
```

A Go workspace is required. This is a directory in which all Go libraries live. It is usually `~/go`, but can be any directory as long as the environment variable `GOPATH` points to it.

Next, install the Gin package into the Go workspace using this command:

```bash
go get -u github.com/gin-gonic/gin
```

If you haven't already got Node.js and npm installed, you'll need them to use Vue.js. To install Node.js and npm, go to [Downloading and installing Node.js and npm](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) and install them.

Once you have Node.js and npm installed, you can now install Vue.js with this command:

```bash
npm install --global @vue/cli
```

# How to Build a Simple Go/Gin Application

We will start by creating a simple Gin application. Create a file called `simple.go` containing the following Go code:

```go
package main

import "github.com/gin-gonic/gin"

func main() {
    r := gin.Default()
    r.GET("/", func(c *gin.Context) {
        c.String(200, "Welcome to Go and Gin!")
    })
    r.Run()
}
```

Let's explain what this code does. The `import` statement loads the Gin package from the Go workspace. The `main()` function is the program entry point. First, a default Gin server is created with the `r := gin.Default()` statement. The `r.GET()` function is used to register code with Gin that will be called when a matching HTTP GET request is called. It takes two parameters: the URI to match (`/`), and a callback function that takes a Gin context struct as a parameter. The `String` function is called on the context (`c`), passing it the response status and the response body. Finally, the `Run` function is called to start the server listening on port 8080 by default.

Next, run the server.

```bash
go run simple.go
```

You will get some warnings when you run the command above, which you can ignore for now.

Now, we can test the server using `curl`.

```bash
curl http://localhost:8080
```

You should see the `Welcome to Go and Gin!` welcome message.

## How to Build a RESTful Application

First of all, we will build the RESTful backend server. We will later add a Vue.js frontend and add Okta authentication.

We are going to make a Go module called `golang-gin-vue` which is the same name as the working directory. This will create a file called `go.mod` which defines the module and the version of Go.

```bash
go mod init okta-go-gin-vue-example
```

Next, create a file called `main.go` containing the following Go code.

```go
package main

import (
    "net/http"

    "github.com/gin-gonic/gin"
)

var todos []string

func Lists(c *gin.Context) {
    c.JSON(http.StatusOK, gin.H{"list": todos})
}

func main() {
    todos = append(todos, "Write the application")
    r := gin.Default()
    r.GET("/api/lists", Lists)
    r.Run()
}
```

This contains some enhancements from the previous program. 

A slice called `todos` has been created to contain the todo items. 

The function `Lists` processes GET requests and returns a JSON object containing the items. 

The `net/http` package has been imported so that we can use the more readable `http.StatusOK` as a status code rather than the opaque number `200`. 

The function `c.JSON()` serializes the structure into a JSON string in the response body. It also sets the `Content-Type` header to `application/json`.  

The function `gin.H` is used to create JSON objects.  

The `GET` function now calls the `Lists` function when the request URI is `/api/lists`.

Now we can run the server. The first time it is run Go will have to resolve the Gin library and add it to `go.mod`.

```bash
go run main.go
```

We can test that it's working using this curl command in another terminal window

```bash
curl http://localhost:8080/api/lists
```

You should get a response that looks like this:

```
{"list":["Write the application"]}
```

## What Is a Path Parameter and How Do I Implement It in Gin?

A path parameter is a URI with a variable part. Any part of a URI can be a path parameter. In our example, we can get individual entries using URIs such as `/api/lists/0`, `/api/lists/1` etc.

The implementation is quite simple. The variable part of the URI is prefixed with a colon when the URI to function mapping is defined.

```go
r.GET("/api/lists/:index", ListItem)
```

The implementation of this is shown in the `ListItem()` function below:

```go
func ListItem(c *gin.Context) {
    errormessage := "Index out of range"
    indexstring := c.Param("index")
    if index, err := strconv.Atoi(indexstring); err == nil && index < len(todos) {
        c.JSON(http.StatusOK, gin.H{"item": todos[index]})
    } else {
        if err != nil {
            errormessage = "Number expected: " + indexstring
        }
        c.JSON(http.StatusBadRequest, gin.H{"error": errormessage})
    }
}
```

The name specified in the URI after the colon can be extracted using the `Params` function in the Gin context.

Update your code in `main.go` to add `strconv` to the imports, include the `ListItem` function, and add the `r.GET("/api/lists/:index", ListItem)` statement to the `main()` function so that `main.go` looks like this:

```go
package main

import (
    "github.com/gin-gonic/gin"
    "net/http"
    "strconv"
)

var todos []string

func Lists(c *gin.Context) {
    c.JSON(http.StatusOK, gin.H{"list": todos})
}

func ListItem(c *gin.Context) {
    errormessage := "Index out of range"
    indexstring := c.Param("index")
    if index, err := strconv.Atoi(indexstring); err == nil && index < len(todos) {
        c.JSON(http.StatusOK, gin.H{"item": todos[index]})
    } else {
        if err != nil {
            errormessage = "Number expected: " + indexstring
        }
        c.JSON(http.StatusBadRequest, gin.H{"error": errormessage})
    }
}

func main() {
    todos = append(todos, "Write the application")
    r := gin.Default()
    r.GET("/api/lists", Lists)
    r.GET("/api/lists/:index", ListItem)
    r.Run()
}
```

The server can be tested running the `go run main.go` command and then using `curl`. Verify that the error handling works using invalid URIs.

```bash
curl -i http://localhost:8080/api/lists/0
curl -i http://localhost:8080/api/lists/1
curl -i http://localhost:8080/api/lists/foo
```

Notice that the last two commands will display different error messages.

## How Do I Handle a POST Request Using Gin?

A POST request simply requires using `POST` in place of `GET`.

Add the following statement to the `main()` function in `main.go`

```go
r.POST("/api/lists", AddListItem)
```

The POST handler uses a `PostForm` method to extract the parameters, add the code below to `main.go`:

```go
func AddListItem(c *gin.Context) {
    item := c.PostForm("item")
    todos = append(todos, item)
    c.String(http.StatusCreated, c.FullPath()+"/"+strconv.Itoa(len(todos)-1))
}
```

`main.go` should look like this now:

```go
package main

import (
    "github.com/gin-gonic/gin"
    "net/http"
    "strconv"
)

var todos []string

func Lists(c *gin.Context) {
    c.JSON(http.StatusOK, gin.H{"list": todos})
}

func ListItem(c *gin.Context) {
    errormessage := "Index out of range"
    indexstring := c.Param("index")
    if index, err := strconv.Atoi(indexstring); err == nil && index < len(todos) {
        c.JSON(http.StatusOK, gin.H{"item": todos[index]})
    } else {
        if err != nil {
            errormessage = "Number expected: " + indexstring
        }
        c.JSON(http.StatusBadRequest, gin.H{"error": errormessage})
    }
}

func AddListItem(c *gin.Context) {
    item := c.PostForm("item")
    todos = append(todos, item)
    c.String(http.StatusCreated, c.FullPath()+"/"+strconv.Itoa(len(todos)-1))
}

func main() {
    todos = append(todos, "Write the application")
    r := gin.Default()
    r.GET("/api/lists", Lists)
    r.GET("/api/lists/:index", ListItem)
    r.POST("/api/lists", AddListItem)
    r.Run()
}
```

It is important to note that a REST POST request creates a resource on the server and assigns it a URI. The proper response to a POST is a status of **201 Created** and the response body should contain the URI of the new resource.

The server can be tested using `curl`. Restart the server using `go run main.go` and then use the `curl` commands below to test it out:

```bash
curl -i -X POST -d "item=Build Vue frontend" http://localhost:8080/api/lists
curl -i http://localhost:8080/api/lists
```

## How to Build a Simple Vue Application

A number of files need to be created to build a Vue application. The Vue client (Vue CLI) can create the necessary files for us. Let's use the Vue CLI to create an application called `todo-vue`.

```bash
vue create todo-vue
```

The creation process will ask a number of questions. Use the arrow keys to select the option required then hit the enter key.

- It may ask if you want to use a faster registry: answer Y.
- Please pick a preset: use the arrow keys to select **Manually select features**.
- Check the features needed for your project: **Babel**, which is a JavaScript compiler, and **Linter / Formatter** should be selected.
- Choose a version of Vue.js that you want to start the project with (Use arrow keys): select **2.x**.
- Pick a linter / formatter config: select **ESLint with error prevention only**. This will check for and catch common errors but will not enforce strict rules.
- Pick additional lint features: select **Lint on save**. This will check for errors when files are saved in the project.
- Where do you prefer placing config for Babel, ESLint, etc.? Select **In dedicated config files**. Several small files are better than one big file.
- Save this as a preset for future projects? select type **N**.
- Pick the package manager to use when installing dependencies: select **Use NPM**

The Vue CLI will then create the project. This includes downloading components which can take some time.

Let's see what got created in the new directory `todo-vue`. We will explain the content of the files in more detail as we build the application: 

The directory `node_modules` contains the Node.js modules which are needed by Vue.

The file `README.md` contains instructions on building and running the Vue application.

The file `package.json` describes the Vue package and its dependencies.

The template for the application is `public/index.html` it contains `<div id="app"></div>` which gets replaced by the Vue content.

The `src` directory contains the core Vue application. The entry point for the application is in `src/main.js` which replaces the `<div>` in the HTML page with the content.  The file `src/App.vue` contains the top-level Vue component. There is one component `src/components/HelloWorld.vue` which can be deleted as it is not required.

We will now simplify the file `src/App.vue`to have the following content:

```html
<template>
  <div id="app">
    <h1>To-Do List</h1>
  </div>
</template>

<script>
export default {
  name: 'App',
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
```

Let's talk about what this does. The template element contains the HTML which will replace the `<div>` in the HTML file. The script element exports the application and gives it a name. The style element is self-explanatory and can be modified any way you want to.
We can now run a built-in development server to test the application.

```bash
cd todo-vue
npm run serve
```

This will build the application and start listening on port 8080 by default. You can access the page by pointing a web browser at http://localhost:8080. If you are curious, the port number can be changed by setting the environment variable `PORT` to another value.

## How to Add the To-Do List to the Application

First, we are going to add a placeholder for the actual to-do list. We need to modify `App.vue`. The style element will be omitted in the example as it doesn't change.

```html
<template>
  <div id="app">
    <h1>To-Do List</h1>
    <div>{{todolist}}</div>
  </div>
</template>

<script>
const appData = {
  todolist: "More to do"
}
export default {
  name: 'App',
  data() {
    return appData;
  }
}
</script>
```

So, what has changed? The template has been modified to add the list. The `{{todolist}}` gets replaced with the contents of a variable called `todolist`. 

There have been two changes to the script element. An object called `appData` has been added which defines the variable `todolist` used in the template and gives it a default value. The default application now has a function called `data()` which returns the `appData` object. 

Now, run the application and point a web browser at it. You should see the text "more to do" on the page.

## How to Combine the Web Servers

When a Vue application is ready to use it can be converted into a static website. Run the command below to do that:

```bash
cd todo-vue
npm run build
```

This creates a directory called `dist` containing the static content.

Then, we change the Go server to deliver the static content. We will serve the `todo-vue/dist` directory as the root URI `/`. Modify `main.go` and add `"github.com/gin-contrib/static"` to the imports and add the following line to the `main()` function, after the `r := gin.Default()` line:

```go
r.Use(static.Serve("/", static.LocalFile("./todo-vue/dist", false)))
```

Run the Go server with `go run main.go` and point a browser at http://localhost:8080 to see the Vue generated web page.

## How to Make the Vue App Call the Server

The Axios JavaScript package is required to call the server. Make sure it is installed locally.

```bash
cd todo-vue
npm install --save axios
```

Next, we need to modify `src/App.vue` to make the Ajax call and render it.

```html
<template>
  <div id="app">
    <h1>To-Do List</h1>
    <ul>
      <li v-for="item in todolist" v-bind:key="item">{{item}}</li>
    </ul>
  </div>
</template>

<script>
import axios from "axios";
const appData = {
  todolist: ["More to do"]
}
export default {
  name: 'App',
  data() {
    return appData;
  },
  mounted: function() {
    this.getList();
  },
  methods: {
    getList: getList
  }
}
function getList() {
  axios.get("/api/lists").then( res => {
    appData.todolist = res.data.list
  });
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
```

Let's go through the changes. At the start of the `<script>` tag, the Axios package is imported. At the end of the script the function `getList()` is defined. It makes an Axios `get()` call to the API. The response is a JSON object which gets transformed into a JavaScript object. The JSON object contains an object called `list` which is an array of item strings. The response is in `res.data` and `res.data.list` extracts the array of item strings that are assigned to the `todolist` variable.

In the `export` the `methods` object exports the `getList()` function as a JavaScript function with the same name which is visible to the application. The `mounted` entry defines a function that is called when the page has loaded. It calls `getList()` to get the list of items.

In the template, there is now an unordered list. The `v-for` attribute iterates over the array of strings contained in `todolist` creating a `<li>` element for each entry. The `v-bind:key` attribute makes the `item` variable from the `v-for` attribute a template variable.

Rebuild the Vue project, then start the server using these commands:
```bash
cd todo-vue
npm run build
cd ..
go run main.go
```

Then, load the web page. A single item from the API should be displayed.

## How to Make a POST Request from Form Data

We are going to add a form that enables a new item to be added to the list.

First, add a form inside the  `<template>` tag, just above the `<ul>` line in `App.vue`.

```html
    <form method="POST" @submit.prevent="sendItem()">
      <input type="text" size="50" v-model="todoitem" placeholder="Enter new item"/>
      <input type="submit" value="Submit"/>
    </form>
```

The form contains a text input box and a submit button. The `v-model` attribute associates the text input with a variable called `todoitem`. The function `sendItem()` is called when the submit button is clicked. The `@submit.prevent` attribute prevents the page from being reloaded when the form is submitted.

Next, create the `sendItem()` function at the bottom of the `<script>` tag in the `App.vue` file:

```javascript
async function sendItem() {
  const params = new URLSearchParams();
  params.append('item', this.todoitem);
  await axios.post("/api/lists", params);
  getList()
}
```

The function is made asynchronous so that it is non-blocking. The POST parameters are set using a `URLSearchParams` object. There is a single parameter called `item` and its value is the value of the text input passed into the variable `this.todoitem` which was defined by the `v-model` attribute on the text input. The POST request is made by calling `axios.post()`. The `await` makes the function wait until the POST response arrives. Finally, the `getList()` function is called to get the updated list.```

You will also need to add the `sendItem` function to the list of methods that are exposed to Vue. Update the `methods` section of the `export default` part of the `<script>` tag so that it looks like this:

```javascript
  methods: {
    getList: getList,
    sendItem: sendItem,
  }
```


Here is how your `Vue.app` file should look:

```html
<template>
  <div id="app">
    <h1>To-Do List</h1>
    <form method="POST" @submit.prevent="sendItem()">
      <input type="text" size="50" v-model="todoitem" placeholder="Enter new item"/>
      <input type="submit" value="Submit"/>
    </form>
    <ul>
      <li v-for="item in todolist" v-bind:key="item">{{item}}</li>
    </ul>
  </div>
</template>

<script>
import axios from "axios";
const appData = {
  todolist: []
}
export default {
  name: 'App',
  data() {
    return appData;
  },
  mounted: function() {
    this.getList();
  },
  methods: {
    getList: getList,
    sendItem: sendItem,
  }
}
function getList() {
  axios.get("/api/lists").then( res => {
    appData.todolist = res.data.list
  });
}

async function sendItem() {
  const params = new URLSearchParams();
  params.append('item', this.todoitem);
  await axios.post("/api/lists", params);
  getList()
}

</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
```

To test the changes: Build the Vue application and start the server using these commands:

```bash
cd todo-vue
npm run build
cd ..
go run main.go
```

Then load the web page. Enter a new item and submit the form. The updated list should be displayed.

## How to Add Okta Authentication to the Application

To add authentication to the Vue application, we first need to install two packages.

```bash
cd todo-vue
npm install @okta/okta-auth-js
npm install @okta/okta-signin-widget
```

To use Okta authentication you need to have a free [Okta Developer account] (https://developer.okta.com). Once you've done this, sign in to the developer console and select **Applications** > **Add Application**. Then select **Single-Page App** and hit **Next**. The next page is filled in with default values, most of which are sufficient for this application and don't need to be changed. Add the URL `http://localhost:8080` to the allowed Login Redirect URLs. Hit **Done**. 

There are two pieces of information that you need to obtain from the Okta Developer Console. These are your Okta domain name and your client id. These values need to be passed into the Vue application. As these values are effectively secrets, they must not be hardcoded in the application. The way around this is to create environment variables in a file called `.env` in the `todo-vue` directory containing these values. Also add `.env` to the `.gitignore` file.

```
VUE_APP_OKTA_CLIENT_ID=my-client-id
VUE_APP_OKTA_DOMAIN=my-okta-domain.okta.com
```

**PS**: The environment variable names must start with `VUE_APP_` otherwise they will not be visible in the application.

## How to Add Okta Authentication to the Vue Client

We are going to use the Okta authentication widget to log the user in. A successful login will create an access token that can be used to verify that the user is logged in.

First of all we will add a container for the login form to the template in `src/App.vue`, add the code below just above the `<form>` tag:

```html
<div id="widget-container"></div>
```

Next, we need to add the login code to the script section of `src/App.vue`, starting with importing the `OktaSignIn` object inside the `<script>` tag.

```javascript
import OktaSignIn from "@okta/okta-signin-widget";
import "@okta/okta-signin-widget/dist/css/okta-sign-in.min.css";
```

Next, just below the import lines, modify the `appData` constant so that it can hold a token:

```javascript
const appData = {
    todolist: ["More to do"],
    token: ''
}
```

Next, update the contents of the `mounted: function()` with the code below. This code creates the widget and extracts the token.

```javascript
    mounted: function () {
        var signIn = new OktaSignIn({
            el: "#widget-container",
            baseUrl: "https://" + process.env.VUE_APP_OKTA_DOMAIN,
            clientId: process.env.VUE_APP_OKTA_CLIENT_ID,
            redirectUri: window.location.origin,
            authParams: {
                issuer:
                    "https://" + process.env.VUE_APP_OKTA_DOMAIN + "/oauth2/default",
                responseType: ["token", "id_token"],
                display: "page",
            },
        });
        signIn.showSignInToGetTokens({
            scopes: ['openid', 'profile']
        }).then(function(tokens){
            appData.token = tokens.accessToken.accessToken;
            axios.defaults.headers.common["Authorization"] =
                "Bearer " + appData.token;
            signIn.hide();
        });
        getList();
    },
```

Let's go through the code to understand what is happening. First of all, we construct an `OktaSignIn` object. It takes a dictionary as a parameter. The `el` defines the ID of the template element in which the login form will be displayed. The `baseUrl` and `clientId` are extracted from the secrets in the `.env` file. The `redirectUri` is set to the current page. This will cause the current page to be reloaded on a successful login with the required access token passed in the URL.

The `renderEl` method causes the login widget to be displayed.

The `.then()` function is called  on  a successful login. The access token is extracted and then set as an Authorization header in the Axios default headers. This means that the header will be sent on subsequent Axios requests. The sign-in widget is hidden once the token has been obtained. 

We are going to validate the token on the server and return an error response if it fails. We need to modify the `sendItem()` function in `App.vue` to handle the error.

```javascript
async function sendItem() {
    const params = new URLSearchParams();
    params.append('item', this.todoitem);
    await axios.post("/api/lists", params)
    .then(function() {
        getList();
    })
    .catch(function (error) {
        appData.todolist = [ error.message ];
    })
}
```

Build the Vue application, start the server and load the web page:

```bash
cd todo-vue
npm run build
cd ..
go run main.go
```

 The login form should be displayed. Log in using your Okta Developer Console credentials.

## How to Validate an Access Token in Go

The access token which the client obtained is what is known as a JSON Web Token (JWT). To verify the token we will use an Okta JWT verifier. The Go package needs to be installed.

```bash
go get -u github.com/okta/okta-jwt-verifier-golang
```

First, add an import to `main.go` to load the Okta JWT verifier package.

```go
jwtverifier "github.com/okta/okta-jwt-verifier-golang"
```

Next, add a `verify()` function to `main.go`.

```go
var toValidate = map[string]string{
        "aud": "api://default",
        "cid": os.Getenv("OKTA_CLIENT_ID"),
}

func verify(c *gin.Context) bool {
    status := true
    token := c.Request.Header.Get("Authorization")
    if strings.HasPrefix(token, "Bearer ") {
        token = strings.TrimPrefix(token, "Bearer ")
        verifierSetup := jwtverifier.JwtVerifier{
            Issuer:           "https://" + os.Getenv("OKTA_DOMAIN") + "/oauth2/default",
            ClaimsToValidate: toValidate,
        }
        verifier := verifierSetup.New()
        _, err := verifier.VerifyAccessToken(token)
        if err != nil {
            c.String(http.StatusForbidden, err.Error())
            print(err.Error())
            status = false
        }
    } else {
        c.String(http.StatusUnauthorized, "Unauthorized")
        status = false
    }
    return status
}
```

The `toValidate` map defines the values of the audience and client ID claims for the verifier. The `verify()` function looks for an Authorization header containing a bearer token. If the token is found then the verifier is called to verify the token. If the token is verified successfully the function returns true. If the token is not found then a 401 Unauthorized response is sent and the function returns false. If the token is found but does not verify, then a 403 Forbidden response is sent and the function returns false. 

Finally modify the `AddListItem` function to call `verify()`.

```go
func AddListItem(c *gin.Context) {
    if verify(c) {
        item := c.PostForm("item")
        todos = append(todos, item)
        c.String(http.StatusCreated, c.FullPath()+"/"+strconv.Itoa(len(todos)-1))
    }
}
```

Build the Vue application—start the server and load the web page. Add a To-Do item and submit the form. You should get an error response. Login and resubmit the To-Do item to verify that token verification works.


## Conclusion

The Gin package for Golang makes it very easy to create a web server. It is particularly easy to build a RESTful web server as there is a function for each of the request methods. A user-defined function is called whenever a request is received. Gin can also serve static content from a specified directory.

The Vue.js JavaScript framework makes it easy to build web front ends that generate dynamic content. The Vue client can create the basic directory structure and the files required for a Vue application. The files are validated for correct syntax which helps avoid hard to diagnose JavaScript errors. Vue provides a server that can be used to test development code. Building the code in production mode creates static content that can be delivered by any web server.

The Okta authentication widget makes the verification process very easy to implement. The OAuth 2.0 authentication process is quite complex. The widget hides the complexity securely. Once the access token has been obtained it can be sent to the API server in a header. The JWT verification process is very simple using the Okta Go JWT verifier.

If you enjoyed reading this post, you might also like these posts from our blog:

- [Offline JWT Validation with Go](/blog/2021/01/04/offline-jwt-validation-with-go)
- [Build a Single-Page App with Go and Vue](/blog/2018/10/23/build-a-single-page-app-with-go-and-vue)
- [The Lazy Developer's Guide to Authentication with Vue.js](/blog/2017/09/14/lazy-developers-guide-to-auth-with-vue)

As always, if you have any questions please comment below. Never miss out on any of our awesome content by following us on [Twitter](https://twitter.com/oktadev) and subscribing to our channel on [YouTube](https://www.youtube.com/c/oktadev)!
