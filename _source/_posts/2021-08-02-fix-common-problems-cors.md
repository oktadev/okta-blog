---
disqus_thread_id: 8688571607
discourse_topic_id: 17402
discourse_comment_url: https://devforum.okta.com/t/17402
layout: blog_post
title: Fixing Common Problems with CORS and JavaScript
author: phill-edwards
by: contractor
communities: [go]
description: "Tutorial: This post walks through troubleshooting and fixing common problems associated with calling REST APIs from JavaScript."
tags: [go, cors, security, javascript]
tweets:
- "Is your browser not letting you make requests to your REST API? It could be a CORS issue‼️"
- "Have a REST API on a different domain from your web page. Your browser could block them, and here is why ⬇️"
image: blog/fix-common-problems-cors/social.png
type: awareness
---

Many websites have JavaScript functions that make network requests to a server, such as a REST API. The web pages and APIs are often in different domains. This introduces security issues in that any website can request data from an API. Cross-Origin Resource Sharing (CORS) provides a solution to these issues. It became a W3C recommendation in 2014. It makes it the responsibility of the web browser to prevent unauthorized access to APIs.  All modern web browsers enforce CORS. They prevent JavaScript from obtaining data from a server in a domain different than the domain the website was loaded from, unless the REST API server gives permission.

From a developer's perspective, CORS is often a cause of much grief when it blocks network requests. CORS provides a number of different mechanisms for limiting JavaScript access to APIs. It is often not obvious which mechanism is blocking the request. We are going to build a simple web application that makes REST calls to a server in a different domain. We will deliberately make requests that the browser will block because of CORS policies and then show how to fix the issues. Let's get started!

**NOTE**: The code for this project can be found on [GitHub](https://github.com/oktadev/okta-go-cors-example).

**Table of Contents**{: .hide }
* Table of Contents
{:toc}

## Prerequisites to Building a Go Application

First things first, if you don't already have Go installed on your computer you will need to [download and install the Go Programming Language](https://golang.org/doc/install).

Now, create a directory where all of our future code will live.

```bash
mkdir cors
cd cors
```

Finally, we will make our directory a Go module and install the Gin package (a Go web framework) to implement a web server.

```bash
go mod init cors
go get github.com/gin-gonic/gin
go get github.com/gin-contrib/static
```

A file called `go.mod` will get created containing the dependencies.

## How to Build a Simple Web Front End

We are going to build a simple HTML and JavaScript front end and serve it from a web server written using Gin.

First of all, create a directory called `frontend` and create a file called `frontend/index.html` with the following content:

```html
<html>
    <head>
        <meta charset="UTF-8" />
        <title>Fixing Common Issues with CORS</title>
    </head>
    <body>
        <h1>Fixing Common Issues with CORS</h1>
        <div>
            <textarea id="messages" name="messages" rows="10" cols="50">Messages</textarea><br/>
            <form id="form1">
                <input type="button" value="Get v1" onclick="onGet('v1')"/>
                <input type="button" value="Get v2" onclick="onGet('v2')"/>
            </form>
        </div>
    </body>
</html>
```

The web page has a text area to display messages and a simple form with two buttons. When a button is clicked it calls the JavaScript function `onGet()` passing it a version number. The idea being that `v1` requests will always fail due to CORS issues, and `v2` will fix the issue.

Next, create a file called `frontend/control.js` containing the following JavaScript:

```javascript
function onGet(version) {
    const url = "http://localhost:8000/api/" + version + "/messages";
    var headers = {}
    
    fetch(url, {
        method : "GET",
        mode: 'cors',
        headers: headers
    })
    .then((response) => {
        if (!response.ok) {
            throw new Error(response.error)
        }
        return response.json();
    })
    .then(data => {
        document.getElementById('messages').value = data.messages;
    })
    .catch(function(error) {
        document.getElementById('messages').value = error;
    });
}
```

The `onGet()` function inserts the version number into the URL and then makes a fetch request to the API server. A successful request will return a list of messages. The messages are displayed in the text area.

Finally, create a file called `frontend/.go` containing the following Go code:

```go
package main

import (
	"github.com/gin-contrib/static"
	"github.com/gin-gonic/gin"
)

func main() {
	r := gin.Default()
	r.Use(static.Serve("/", static.LocalFile("./frontend", false)))
	r.Run(":8080")
}
```

This code simply serves the contents of the `frontend` directory on requests on port 8080. Note that JavaScript makes a call to port `http://localhost:8000` which is a separate service.

Start the server and point a web browser at `http://localhost:8080` to see the static content.

```bash
go run frontend.go
```
## How to Build a Simple REST API in Go

Create a directory called `rest` to contain the code for a basic REST API.

**NOTE:** A separate directory is required as Go doesn't allow two program entry points in the same directory.

Create a file called `rest/server.go` containing the following Go code:

```go
package main

import (
	"fmt"
	"strconv"
	"net/http"

	"github.com/gin-gonic/gin"
)

var messages []string

func GetMessages(c *gin.Context) {
	version := c.Param("version")
	fmt.Println("Version", version)
	c.JSON(http.StatusOK, gin.H{"messages": messages})
}

func main() {
	messages = append(messages, "Hello CORS!")
	r := gin.Default()
	r.GET("/api/:version/messages", GetMessages)
	r.Run(":8000")
}
```

A list called `messages` is created to hold message objects.

The function `GetMessages()` is called whenever a GET request is made to the specified URL. It returns a JSON string containing the messages. The URL contains a path parameter which will be `v1` or `v2`. The server listens on port 8000.

The server can be run using:

```bash
go run rest/server.go
```

## How to Solve a Simple CORS Issue

We now have two servers—the front-end one on `http://localhost:8080`, and the REST API server on `http://localhost:8000`. Even though the two servers have the same hostname, the fact that they are listening on different port numbers puts them in different domains from the CORS perspective. The domain of the web content is referred to as the origin. If the JavaScript `fetch` request specifies `cors` a request header will be added identifying the origin.

```http
Origin: http://localhost:8080
```

Make sure both the frontend and REST servers are running.

Next, point a web browser at `http://localhost:8080` to display the web page. We are going to get JavaScript errors, so open your browser's developer console so that we can see what is going on. In Chrome it is *View** > **Developer** > **Developer Tools**.

Next, click on the **Send v1** button. You will get a JavaScript error displayed in the console:

> Access to fetch at 'http://localhost:8000/api/v1/messages' from origin 'http://localhost:8080' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource. If an opaque response serves your needs, set the request's mode to 'no-cors' to fetch the resource with CORS disabled.

The message says that the browser has blocked the request because of a CORS policy. It suggests two solutions. The second suggestion is to change the `mode` from `cors` to `no-cors` in the JavaScript fetch request. This is not an option as the browser always deletes the response data when in `no-cors` mode to prevent data from being read by an unauthorized client.

The solution to the issue is for the server to set a response header that allows the browser to make cross-domain requests to it.

```http
Access-Control-Allow-Origin: http://localhost:8080
```

This tells the web browser that the cross-origin requests are to be allowed for the specified domain. If the domain specified in the response header matches the domain of the web page, specified in the `Origin` request header, then the browser will not block the response being received by JavaScript.

We are going to set the header when the URL contains `v2`. Change the `GetMessages()` function in `cors/server.go` to the following:

```go
func GetMessages(c *gin.Context) {
	version := c.Param("version")
	fmt.Println("Version", version)
	if version == "v2" {
		c.Header("Access-Control-Allow-Origin", "http://localhost:8080")
	}
	c.JSON(http.StatusOK, gin.H{"messages": messages})
}
```

This sets a header to allow cross-origin requests for the `v2` URI.

Restart the server and go to the web page. If you click on `Get v1` you will get blocked by CORS. If you click on `Get v2`, the request will be allowed.

A response can only have at most one `Access-Control-Allow-Origin` header. The header can only specify only one domain. If the server needs to allow requests from multiple origin domains, it needs to generate an `Access-Control-Allow-Origin` response header with the same value as the `Origin` request header.

## Allowing Access from Any Origin Domain

There is an option to prevent CORS from blocking any domain. This is very popular with developers!

```
Access-Control-Allow-Origin: *
```

Be careful when using this option. It will get flagged in a security audit. It may also be in violation of an information security policy, which could have serious consequences!

## CORS in Flight

Although we have fixed the main CORS issue, there are some limitations. One of the limitations is that only the HTTP GET, and OPTIONS methods are allowed. The GET and OPTIONS methods are read-only and are considered *safe* as they don't modify existing content. The POST, PUT, and DELETE methods can add or change existing content. These are considered unsafe. Let's see what happens when we make a PUT request.

First of all, add a new form to `client/index.html`:

```html
<form id="form2">
    <input type="text" id="puttext" name="puttext"/>
    <input type="button" value="Put v1" onclick="onPut('v1')"/>
    <input type="button" value="Put v2" onclick="onPut('v2')"/>
</form>
```

This form has a text input and the two send buttons as before that call a new JavaScript function.

Next, add the JavaScript funtion to `client/control.js`:

```javascript
function onPut(version) {
    const url = "http://localhost:8000/api/" + version + "/messages/0";
    var headers = {}

    fetch(url, {
        method : "PUT",
        mode: 'cors',
        headers: headers,
        body: new URLSearchParams(new FormData(document.getElementById("form2"))),
    })
    .then((response) => {
        if (!response.ok) {
            throw new Error(response.error)
        }
        return response.json();
    })
    .then(data => {
        document.getElementById('messages').value = data.messages;
    })
    .catch(function(error) {
        document.getElementById('messages').value = error;
    });
}
```

This makes a PUT request sending the form parameters in the request body. Note that the URI ends in `/0`. This means that the request is to create or change the message with the identifier `0`.

Next, define a PUT handler in the `main()` function of `rest/server.go`:

```go
r.PUT("/api/:version/messages/:id", PutMessage)
```

The message identifier is extracted as a path parameter.

Finally, add the request handler function to `rest/server.go`:

```go
func PutMessage(c *gin.Context) {
	version := c.Param("version")
	id, _ := strconv.Atoi(c.Param("id"))
	text := c.PostForm("puttext")
	messages[id] = text
	if version == "v2" {
	    c.Header("Access-Control-Allow-Origin", "http://localhost:8080")
	}
	c.JSON(http.StatusOK, gin.H{"messages": messages})
}
```

This updates the message from the form data and sends the new list of messages. The function also always sets the allow origin header, as we know that it is required.

Now, restart the servers and load the web page. Make sure that the developer console is open. Add some text to the text input and hit the `Send v1` button.

You will see a slightly different CORS error in the console:

> Access to fetch at 'http://localhost:8000/api/v1/messages/0' from origin 'http://localhost:8080' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource. If an opaque response serves your needs, set the request's mode to 'no-cors' to fetch the resource with CORS disabled.

This is saying that a preflight check was made, and that it didn't set the `Access-Control-Allow-Origin` header.

Now, look at the console output from the API server:

```txt
[GIN] 2020/12/01 - 11:10:09 | 404 |  447ns |  ::1 | OPTIONS  "/api/v1/messages/0"
```

So, what is happening here? JavaScript is trying to make a PUT request. This is not allowed by CORS policy. In the GET example, the browser made the request and blocked the response. In this case, the browser refuses to make the PUT request. Instead, it sent an OPTIONS request to the same URI. It will only send the PUT if the OPTIONS request returns the correct CORS header. This is called a preflight request. As the server doesn't know what method the OPTIONS preflight request is for, it specifies the method in a request header:

```http
Access-Control-Request-Method: PUT
```

Let's fix this by adding a handler for the OPTIONS request that sets the allow origin header in `cors/server.go`:

```go
func OptionMessage(c *gin.Context) {
	c.Header("Access-Control-Allow-Origin", "http://localhost:8080")
}

func main() {
	messages = append(messages, "Hello CORS!")
	r := gin.Default()
	r.GET("/api/:version/messages", GetMessages)
	r.PUT("/api/:version/messages/:id", PutMessage)
	r.OPTIONS("/api/v2/messages/:id", OptionMessage)
	r.Run(":8000")
}
```

Notice that the OPTIONS handler is only set for the `v2` URI as we don't want to fix `v1`.

Now, restart the server and send a message using the `Put v2` button. We get yet another CORS error!

> Access to fetch at 'http://localhost:8000/api/v2/messages/0' from origin 'http://localhost:8080' has been blocked by CORS policy: Method PUT is not allowed by Access-Control-Allow-Methods in preflight response.

This is saying that the preflight check needs another header to stop the PUT request from being blocked.

Add the response header to `cors/server.go`:

```go
func OptionMessage(c *gin.Context) {
	c.Header("Access-Control-Allow-Origin", "http://localhost:8080")
	c.Header("Access-Control-Allow-Methods", "GET, OPTIONS, POST, PUT")
}
```

Restart the server and resend the message. The CORS issues are resolved.

## What Else Does CORS Block?

CORS has a very restrictive policy regarding which HTTP request headers are allowed. It only allows safe listed request headers. These are `Accept`, `Accept-Language`, `Content-Language`, and `Content-Type`. They can only contain printable characters and some punctuation characters are not allowed. Header values can't have more than 128 characters.

There are further restrictions on the `Content-Type` header. It can only be one of `application/x-www-form-urlencoded`, `multipart/form-data`, and `text/plain`. It is interesting to note that `application/json` is not allowed.

Let's see what happens if we send a custom request header. Modify the `onPut()` function in `frontend/control.js`to set a header:

```javascript
var headers = { "X-Token": "abcd1234" }
```

Now, make sure that the servers are running and load or reload the web page. Type in a message and click the `Put v1` button. You will see a CORS error in the developer console.

> Access to fetch at 'http://localhost:8000/api/v2/messages/0' from origin 'http://localhost:8080' has been blocked by CORS policy: Request header field x-token is not allowed by Access-Control-Allow-Headers in preflight response.

Any header which is not CORS safe-listed causes a preflight request. This also contains a request header that specifies the header that needs to be allowed:

```http
Access-Control-Request-Headers: x-token
```

Note that the header name `x-token` is specified in lowercase.

The preflight response can allow non-safe-listed headers and can remove restrictions on safe listed headers:

```http
Access-Control-Allow-Headers: X_Token, Content-Type
```

Next, change the function in `cors/server.go` to allow the custom header:

```go
func OptionMessage(c *gin.Context) {
	c.Header("Access-Control-Allow-Origin", "http://localhost:8080")
	c.Header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT")
	c.Header("Access-Control-Allow-Headers", "X-Token")
}
```

Restart the server and resend the message by clicking the `Put v2` button. The request should now be successful.

## Restrictions on Response Headers

CORS also places restrictions on response headers. There are seven whitelisted response headers: `Cache-Control`, `Content-Language`, `Content-Length`, `Content-Type`, `Expires`, `Last-Modified`, and `Pragma`. These are the only response headers that can be accessed from JavaScript. Let's see this in action.

First of all, add a text area to `frontend/index.html` to display the headers:

```html
<textarea id="headers" name="headers" rows="10" cols="50">Headers</textarea><br/>
```

Next, replace the first `then` block in the `onPut`  function in `frontend/control.js` to display the response headers:

```javascript
.then((response) => {
    if (!response.ok) {
        throw new Error(response.error)
    }
    response.headers.forEach(function(val, key) {
        document.getElementById('headers').value += '\n' + key + ': ' + val; 
    });
    return response.json();
})
```

Finally, set a custom header in `rest/server.go`:

```go
func PutMessage(c *gin.Context) {
	version := c.Param("version")
	id, _ := strconv.Atoi(c.Param("id"))
	text := c.PostForm("puttext")
	messages[id] = text
	if version == "v2" {
	    c.Header("Access-Control-Allow-Origin", "http://localhost:8080")
	}
	c.Header("X-Custom", "123456789")
	c.JSON(http.StatusOK, gin.H{"messages": messages})
}
```

Now, restart the server and reload the web page. Type in a message and hit `Put v2`. You should see some headers displayed, but not the custom header. CORS has blocked it.

This can be fixed by setting another response header to expose the custom header in `server/server.go`:

```go
func PutMessage(c *gin.Context) {
	version := c.Param("version")
	id, _ := strconv.Atoi(c.Param("id"))
	text := c.PostForm("puttext")
	messages[id] = text
	if version == "v2" {
        c.Header("Access-Control-Expose-Headers", "X-Custom")
	    c.Header("Access-Control-Allow-Origin", "http://localhost:8080")
	}
	c.Header("X-Custom", "123456789")
	c.JSON(http.StatusOK, gin.H{"messages": messages})
}
```

Restart the server and reload the web page. Type in a message and hit `Put v2`. You should see some headers displayed, including the custom header. CORS has now allowed it.

## Credentials Are a Special Case

There is yet another CORS blocking scenario. JavaScript has a `credentials` request mode. This determines how user credentials, such as cookies are handled. The options are:
* `omit`: Never send or receive cookies.
* `same-origin`: This is the default, that allows user credentials to be sent to the same origin.
* `include`: Send user credentials even if cross-origin.

Let's see what happens.

Modify the fetch call in the `onPut()` function in `frontend/Control.js`:

```javascript
fetch(url, {
    method : "PUT",
    mode: 'cors',
    credentials: 'include',
    headers: headers,
    body: new URLSearchParams(new FormData(document.getElementById("form2"))),
})
```

Now, make sure that the client and server are running and reload the web page. Send a message as before. You will get another CORS error in the developer console:

> Access to fetch at 'http://localhost:8000/api/v2/messages/0' from origin 'http://localhost:8080' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: The value of the 'Access-Control-Allow-Credentials' header in the response is '' which must be 'true' when the request's credentials mode is 'include'.

The fix for this is to add another header to both the `OptionMessage()`, and `PutMessage()` functions in `cors/server.go` as the header needs to be present in both the preflight request and the actual request:

```go
c.Header("Access-Control-Allow-Credentials", "true")
```

The request should now work correctly.

The credentials issue can also be resolved on the client by setting the credentials mode to `omit` and sending credentials as request parameters, instead of using cookies.

## Control CORS Cache Configuration

The is one more CORS header that hasn't yet been discussed. The browser can cache the preflight request results. The `Access-Control-Max-Age` header specifies the maximum time, in seconds, the results can be cached. It should be added to the preflight response headers as it controls how long the `Access-Control-Allow-Methods` and `Access-Control-Allow-Headers` results can be cached.

```http
Access-Control-Max-Age: 600
```

Browsers typically have a cap on the maximum time. Setting the time to `-1` prevents caching and forces a preflight check on all calls that require it.

## How to Prevent CORS Issues with Okta

Authentication providers, such as Okta, need to handle cross-domain requests to their authentication servers and API servers. This is done by providing a list of trusted origins. See [Okta Enable CORS](https://developer.okta.com/docs/guides/enable-cors/overview/) for more information.

## How CORS Prevents Security Issues

CORS is an important security feature that is designed to prevent JavaScript clients from accessing data from other domains without authorization.

Modern web browsers implement CORS to block cross-domain JavaScript requests by default. The server needs to authorize cross-domain requests by setting the correct response headers.

CORS has several layers. Simply allowing an origin domain only works for a subset of request methods and request headers. Some request methods and headers force a preflight request as a further means of protecting data. The actual request is only allowed if the preflight response headers permit it.

CORS is a major pain point for developers. If a request is blocked, it is not easy to understand why, and how to fix it. An understanding of the nature of the blocked request, and of the CORS mechanisms, can easily overcome such issues.

If you enjoyed this post, you might like related ones on this blog:

- [What is the OAuth 2.0 Implicit Grant Type?](/blog/2018/05/24/what-is-the-oauth2-implicit-grant-type)
- [Combat Side-Channel Attacks with Cross-Origin Read Blocking](/blog/2019/08/26/combat-side-channel-attacks-with-corb)

Follow us for more great content and updates from our team! You can find us on [Twitter](https://twitter.com/oktadev), [Facebook](https://www.facebook.com/oktadevelopers), subscribe to our [YouTube Channel](https://youtube.com/c/oktadev) or start the conversation below.

