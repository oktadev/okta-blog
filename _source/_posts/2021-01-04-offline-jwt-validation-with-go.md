---
layout: blog_post
title: Offline JWT Validation with Go
author: phill-edwards
by: contractor
communities: [go]
description: "How to validate a JSON Web Token with Go"
tags: [go]
tweets:
- "Did you know you can use Go to validate a JWT? This post will show you how."
- "Learn how to validate JSON Web Tokens with Go"
image: blog/offline-jwt-validation-with-go/social.png
type: conversion

---

Modern authentication systems use and generate JSON Web Tokens (JWT). There are many different ways that JWTs are used but, in this post, we will concentrate on JWTs that are used as OIDC access tokens. When a user successfully logs in to an application using a service like Okta, an OIDC access token is generated in the form of a JWT. That token can be passed in requests to the backend. The backend can then validate that token and reject all requests with invalid or missing tokens.

A common way to validate OIDC access tokens is to simply make an API request to the issuer with the access token. While this is the simplest method to use, it is far faster to validate tokens "offline".

Today, we are going to build a simple web application that uses the Okta authentication widget to log users in. An access token will be generated and sent to an API written in Go which will validate the token. Let's get started! 

**PS**: The code for this project can be found on [GitHub](https://github.com/oktadeveloper/okta-offline-jwt-validation-example).

## Prerequisites to Building a Go Application

First things first, if you haven't already got Go installed on your computer you will need to [Download and install - The Go Programming Language](https://golang.org/doc/install).

Next, create a directory where all of your future code will live.

```bash
mkdir jwt-go
cd jwt-go
```

Next, we will make our directory a Go module and install the Gin web server package, and the JWT verifier package.

```bash
go mod init jwt-go
go get github.com/gin-gonic/gin
go get github.com/dgrijalva/jwt-go
```

A file called `go.mod` containing these dependencies will be created by the `go get` command.

{% include setup/cli.md type="spa" loginRedirectUri="http://localhost:8080" %}

Next, create environment variables for the domain, issuer URI, and client ID, replacing the placeholders with your actual values:

```bash
export OKTA_DOMAIN=https://dev-123456.okta.com
export OKTA_ISSUER_URI=https://dev-123456.okta.com/oauth2/default
export OKTA_CLIENT_ID=0...5d
```

**PS:** The redirect and logout URIs are for local testing. In a production environment a new application needs to be created using the actual domain names.

## How to Build a Web Client in Go with Okta Authentication

First, we need to create a directory for the static web pages.

```bash
mkdir client
```

Next, create a file called `client/index.html` which loads the Okta JavaScript, and has a `<div>` with an id of `widget-container` for use by the Okta authentication widget, and a form to send messages to a backend API.

```html
<html>
    <head>
        <meta charset="UTF-8" />
        <title>Offline JWT Validation with Go</title>
        <script src="https://global.oktacdn.com/okta-signin-widget/4.3.2/js/okta-sign-in.min.js" type="text/javascript"></script>
        <link href="https://global.oktacdn.com/okta-signin-widget/4.3.2/css/okta-sign-in.min.css" type="text/css" rel="stylesheet"/>
        <link href="style.css" rel="stylesheet" type="text/css" />
        <script src="control.js" defer></script>
    </head>
    <body>
        <h1>Offline JWT Validation with Go</h1>
        <div id="widget-container"></div>
        <div class="centred">
            <form id="messageForm">
                Message: <input id="message" name="message" type="message"/>
                <input type="button" value="Send" onclick="onmessage()"/>
            </form>
            <textarea id="messages" name="messages" rows="10" cols="50">Messages</textarea><br/>
        </div>
    </body>
</html>
```

Next, create a file called `client/control.js` containing the following JavaScript code:

```javascript
var accessToken = null;

var signIn = new OktaSignIn({
    baseUrl: 'http://${yourOktaDomain}',
    clientId: '${yourClientId}',
    redirectUri: window.location.origin,
    authParams: {
        issuer: 'https://${yourOktaDomain}/oauth2/default',
        responseType: ['token', 'id_token']
    }
});

signIn.renderEl({
    el: '#widget-container'
}, function success(res) {
    if (res.status === 'SUCCESS') {
        accessToken = res.tokens.accessToken.accessToken;
        signIn.hide();
    } else {
        alert('fail);')
    }
}, function(error) {
    alert('error ' + error);
});

function onmessage() {
    const url = "/api/messages";
    var headers = {}
    if (accessToken != null) {
        headers = { 'Authorization': 'Bearer ' + accessToken }
    }
    fetch(url, {
        method : "POST",
        mode: 'cors',
        headers: headers,
        body: new URLSearchParams(new FormData(document.getElementById("messageForm"))),
    })
    .then((response) => {
        if (!response.ok) {
            throw new Error(response.error)
        }
        return response.text();
    })
    .then(data => {
        var msgs = JSON.parse(data) 
        document.getElementById('messages').value = msgs.messages.join('\n');
    })
    .catch(function(error) {
        document.getElementById('messages').value = "Permission denied";
    });
}
```

So, what is this code doing? First, a variable named `accessToken` is created to store the JWT access token.

Next, we have created an `OktaSignIn` object named `signIn`. *Note* You need to replace both occurrences of `${yourOktaDomain}` with the Okta domain name from the console. Also, replace `${yourClientId}` with the client ID from the application we previously created in the console.

The `renderEl()` function displays the authentication UI and performs the authentication. If successful, a JWT access token is returned and saved. The UI is then hidden.

The `onmessage()` function is called when the "Send" button is clicked to submit the message form. This function makes a POST request to an `/api/messages` endpoint that we will be creating later on. The `onmessage()` function also passes in the message text to `/api/messages/`. The request to the `/api/messages` endpoint will also include the access token in an HTTP `Authorization` header. As it is a token the header needs to specify its type as `Bearer`. When the response comes back, the messages are all displayed in the text area.

## How to Build a Simple Go Web Server

We are going to implement a web server using the Go Gin library. Create a file called `main.go` containing the following Go code in the `jwt-go` directory that you created at the beginning of this post:

```go
package main

import (
    "net/http"

    "github.com/gin-contrib/static"
    "github.com/gin-gonic/gin"
)

var messages []string

func Messages(c *gin.Context) {
    message := c.PostForm("message")
    messages = append(messages, message)
    c.JSON(http.StatusOK, gin.H{"messages": messages})
}

func main() {
    r := gin.Default()
    r.Use(static.Serve("/", static.LocalFile("./client", false)))
    r.POST("/api/messages", Messages)
    r.Run()
}
```

So, what does this code do? The messages are stored in a slice of strings called `messages`. The `main()` function creates a default instance of a Gin HTTP web framework engine. It serves the static content, which we have already created, from the `client` directory. It calls the function `Messages()` on receipt of POST requests to `/api/Messages`.

The `Messages()` function extracts the message from the POST form data and appends it to the list of messages. It then returns the list of messages back to the requester as a JSON object.

Now, we can test the application by running the server and pointing a web browser at `http://localhost:8080`.

```bash
go run main.go
```
## Introduction to  Complex Data Structures in Go

For those new to Go, some of the more complex code which we will see later will make more sense if we understand how Go handles lists and maps (also known as dictionaries or hash tables). Here is a short introduction to lists and maps in Go:

Consider an application which reads a JSON object from a file or a network resource. For example:

```json
[{ "name":"John", "age":30, "car":null },
 { "name":"Jane", "age":27, "car":"Mini" }]
```

We want to use the Go JSON decoder to turn the JSON string into a list of maps.
* Map and list values can be of type nil, int, float, string, list, and map.
* Go is a compiled language and it is also strongly typed. 
* Map keys are always strings. 
* The values of any map or list can be a mixture of types, so the values of a map or list can't be given an explicit type in the code.

For example, In the code above, we declared a list of type `string` with this code:

```go
var messages []string
```

In order to overcome the typing issues, Go allows maps and lists to have values of any type by declaring the type as an interface, for example:

```go
var persons []interface{}
var person map[string]interface{}
```



This leads to another issue. When writing the code, it is impossible to know for certain what the actual type of the value is. For example, the JSON structure could change. The type can only be determined at runtime. This makes it important to know what the data structure actually is. If you know the type, you can use a type assertion that tells the compiler what the actual type is. In our example above, `persons` is a list of maps and `person` is a map containing a number of attributes. 

The type assertions become:

```go
person, err := persons[0].(map[string]interface{})
name, err := person["name"].(string)
```

If the type assertion agrees with the actual type the `err` will be `nil`. You can omit the `err` return value, but if the type assertion fails then an exception will be thrown. Multiple type assertions can be used in the same expression:

```go
name := persons[0].(map[string]interface[])["name"].(string)
```

Finally, if you don't know the actual type of an interface value, then you can use `reflect` to find it out:

```go
print(reflect.TypeOf(persons[0]))
```

## How to Validate a JWT Token in Go

Now that we have the application working, it is time to validate the access token which is the focus of this article.

First of all, what is a JWT? It is three base64 encoded components separated by a `.` character.

The first component is the header. This is a map. The most important fields of the map are `alg` which specifies the cryptographic algorithm used, and the `kid` or key identifier which identifies which public key to use to verify the JWT.

The second component is the payload, which is a set of claims. A claim is a map. Important claims are `aud` which is the audience, and `iss` which is the issuer of the token.

The final component is the signature, which is a digital signature of the header and payload.

In order to validate the token, we first need the public key so that we can validate the signature. Start by modifying the `import` section of `main.go` to look like this:

```go
import (
    "net/http"
    "crypto/rsa"
    "encoding/json"
    "encoding/base64"
    "math/big"
    "os"

     "github.com/gin-contrib/static"
     "github.com/gin-gonic/gin"
)
```

Next, add the following Go code to `main.go`:

```go
var rsakeys map[string]*rsa.PublicKey

func GetPublicKeys() {
    rsakeys = make(map[string]*rsa.PublicKey)
    var body map[string]interface{}
    uri := "https://" + os.Getenv("OKTA_DOMAIN") + "/oauth2/default/v1/keys"
    resp, _ := http.Get(uri)
    json.NewDecoder(resp.Body).Decode(&body)
    for _, bodykey := range body["keys"].([]interface{}) {
        key := bodykey.(map[string]interface{})
        kid := key["kid"].(string)
        rsakey := new(rsa.PublicKey)
        number, _ := base64.RawURLEncoding.DecodeString(key["n"].(string))
        rsakey.N = new(big.Int).SetBytes(number)
        rsakey.E = 65537
        rsakeys[kid] = rsakey
    }
}
```

Then and add a call to the `Keys()` function to the `main()` function, like this:

```go
func main() {
    GetPublicKeys()
    r := gin.Default()
    r.Use(static.Serve("/", static.LocalFile("./client", false)))
    r.POST("/api/messages", Messages)
    r.Run()
}
```


What do these changes do? First of all, in `GetPublicKeys()` a GET request is made to the Okta API to get the signing public keys for the Okta domain stored in the $OKTA_DOMAIN environment variable. The response is a JSON object containing a list of keys. 

Next, we parse the JSON object to extract one or more of the  RSA public keys that we will use to verify access tokens from Okta. The key has two components, a number (called "N"), and an exponent (called "E"). The number is base64 encoded and the exponent is usually 65537 so we just hard-code it.

Now we need to add some code to do the actual verification. Update your `import` section so it looks like this:

```go
import (
    "crypto/rsa"
    "encoding/base64"
    "encoding/json"
    "math/big"
    "os"
    "strings"
    "net/http"

    "github.com/dgrijalva/jwt-go"
    "github.com/gin-contrib/static"
    "github.com/gin-gonic/gin"
)
```

Then, add the following code to `main.go`.

```go
func Verify(c *gin.Context) bool {
    isValid := false
    errorMessage := ""
    tokenString := c.Request.Header.Get("Authorization")
    if strings.HasPrefix(tokenString, "Bearer ") {
        tokenString = strings.TrimPrefix(tokenString, "Bearer ")
        token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
            return rsakeys[token.Header["kid"].(string)], nil
        })
        if err != nil {
            errorMessage = err.Error()
        } else if !token.Valid {
            errorMessage = "Invalid token"
        } else if token.Header["alg"] == nil {
            errorMessage = "alg must be defined"
        } else if token.Claims.(jwt.MapClaims)["aud"] != "api://default" {
            errorMessage = "Invalid aud"
        } else if !strings.Contains(token.Claims.(jwt.MapClaims)["iss"].(string), os.Getenv("OKTA_DOMAIN")) {
            errorMessage = "Invalid iss"
        } else {
            isValid = true
        }
        if !isValid {
            c.String(http.StatusForbidden, errorMessage)
        }
    } else {
        c.String(http.StatusUnauthorized, "Unauthorized")
    }
    return isValid
}
```

The function extracts an `Authorization` request header and looks for a `Bearer` token. If it does not exist, then a 401 `Unauthorized` response is sent.

The token string is then passed to the `jwt.Parse()` function, the second parameter being a function that returns the public key.

Now, we can validate the token. It must be rejected if any of the following are true:
* The parse function returns an error which means that the token can't be decoded, or more likely that the public key can't decrypt the signature.
* The token is invalid.
* The cryptographic algorithm must be RSA256.
* The audience does not match the expected audience.
* The issuer is not the expected issuer.
* The token has no key identifier.

Finally, modify the API functions to call `Verify()`.

```go
func Messages(c *gin.Context) {
    if Verify(c) {
        message := c.PostForm("message")
        messages = append(messages, message)
        c.JSON(http.StatusOK, gin.H{"messages": messages})
    }
}
```

## Testing it all out

We can now test end to end. Start by  running the server:

```bash
go run main.go
```

Next, point a web browser at `http://localhost:8080`.

Enter a message and hit the submit button. You should get an authorization error.

Now, login and try sending another message. This should send a token that gets validated correctly. Your message should be displayed.

## Conclusion

In this post, we have learned how to authenticate with Okta to get a JWT, how to use that JWT in the `Authentication` header of an HTTP GET request, and how to perform "offline" validation of that JWT in Go.

If you like this topic, be sure to [follow us on Twitter](https://twitter.com/oktadev), subscribe to [our YouTube Channel](https://youtube.com/c/oktadev), and [follow us on Twitch](https://www.twitch.tv/oktadev).

