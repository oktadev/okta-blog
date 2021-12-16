---
disqus_thread_id: 8382902124
discourse_topic_id: 17352
discourse_comment_url: https://devforum.okta.com/t/17352
layout: blog_post
title: API Key Best Practices and Examples
author: phill-edwards
by: contractor
communities: [go]
description: "Learn how to avoid accidentally leaking an API key in your code."
tags: [go]
tweets:
- "Have you ever leaked an API key online by mistake? Learn how to avoid doing that again."
- "We've all leaked an API key online by mistake. Right? .. Right?"
- "Here are some tips for protecting your API keys."
image: blog/api-key-best-practices-and-examples/card.png
type: conversion
---

When you're using a REST API, especially one that incurs costs or has usage limits, you need to use an API key to access the API in question. For example, if you're creating a user account with the Okta API, you'll need to include your API key in that request for it to succeed. Because API keys grant access to API calls which may change important data or incur significant charges. It is therefore important that the keys are not used by unauthorized users. There are a number of common mistakes that developers make that expose API keys to the outside world.

Today, we are going to create an API key for three different APIs. We will show, with examples, the common mistakes that developers make that expose these keys. You'll see specific vulnerabilities and learn the best ways of avoiding these mistakes. Let's get started!

**PS**: The code examples for this project can be found on [GitHub](https://github.com/oktadeveloper/api-key-best-practices-and-examples).

## How to Obtain and Use an Okta API Token

{% include setup/cli.md type="token" %}

When making an API call, the token needs to be added in an Authorization HTTP request header. The token type must be `SSWS`, which is the proprietary authentication scheme used by Okta. Replace `00...3` with the actual token.

```http
Authorization: SSWS 00...3
```

An API call using the API token can be made using `curl`. Replace `${OKTA_API_KEY}` with the API token and replace `${OKTA_DOMAIN}` with your Okta domain.

```bash
curl -s -H "Authorization: SSWS ${OKTA_API_KEY}" https://${OKTA_DOMAIN}/api/v1/meta/types/user
``` 

After running this command, you should see a JSON string containing one or more user details.

## How to Obtain and Use an Open Weather Map API Token

OpenWeather provides an API for obtaining weather data. To use the API, you need to sign up at [Weather API](https://openweathermap.org/api). You can create a free account or pay a subscription to get access to more features. Once you have signed up and validated your email address, you will be sent an API token. You have to wait for up to a few hours for the token to be activated.

The API token needs to be sent with each API request. The token determines which APIs can be accessed and applies limits on the number of API calls that can be made per minute. The API can be tested by visiting this URL with your web browser, replacing `API_KEY` with your API key: `http://api.openweathermap.org/data/2.5/weather?q=London,uk&APPID=API_KEY`

Notice that the request is over HTTP, not HTTPS, and the API key is a query parameter.

## How to Obtain and Use a Google Maps API Token

Google Maps has an API for embedding maps and location-oriented services in web pages and mobile applications. This service is billable, but you get $200 free usage per month, which is enough for most applications.

First, you need a Google Cloud Platform (GCP) account. There is a free trial [Google Cloud Platform](https://cloud.google.com/gcp) which gives new customers $300 of free credit, valid for 12 months. 

Next, you need to create a project. Log into the [Cloud Console](https://console.cloud.google.com). From the hamburger menu in the top left select **APIs & Service** > **Dashboard**. Select **+ ENABLE APIS AND SERVICES**. Next, select **Aps JavaScript API**. Click on **ENABLE** and after a short wait, you will be taken to the Google Maps Platform page. 

From the hamburger menu in the top left select **APIs & Service** > **Credentials**. Next, hit **CREATE CREDENTIALS** > **API Keys**. A dialog will pop up displaying the API key. Copy it and store it safely. You will see a warning: *Restrict your key to prevent unauthorized use in production.* This is important. Hit **RESTRICT KEY**.

Each key can be restricted to one application type. We are going to use the key for a website so, select **HTTP referrers (websites)**. A Website restrictions section will appear. Select **ADD AN ITEM**. Enter your website domain in the form `*.example.com/*`. Hit **DONE**.

Next, select **Restrict key**. Then select **Maps JavaScript API**. Hit **SAVE**.

The API key must be included in every Maps JavaScript API request, replacing `YOUR_API_KEY` with the actual key.

```javascript
  <script async defer src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&callback=initMap"
  type="text/javascript"></script>
```

## Issues with API Keys Compiled into Mobile Applications

Many Android and iOS mobile applications obtain data from API calls. This means that the API keys need to be sent with each API request. Consider the following Swift code which is part of the file `Weather/WeatherModelBad.swift`:

```swift
class WeatherModel : ObservableObject {
    private let apiKey: String
    private let apiUri: String
    @Published var weatherData: WeatherData
    
    init(location: String) {
        apiKey = "a1b2c33d4e5f6g7h8i9jakblc"
        apiUri = "http://api.openweathermap.org/data/2.5/weather?q=" + location + "&appid=" + apiKey
        updateWeather()
    }
}
```

So, what is wrong with this code? There are several things which are bad practice.

First of all, it is bad practice to hard code things that can change such as URLs. They should always be stored in property files.

Much more seriously, the API key is hardcoded (the value given in the example is not an actual key). This means that the key will get compiled into the application. So, what are the consequences of this?

First of all, the code will get checked into a repository such as GitHub. This means that anyone with read access to the repository is able to see and use the API key. This is even worse if the developer wants to share the code and checks it into a public repository.

**PS**: GitHub scans public repositories on commits for secrets such as API keys. If a secret is detected it will raise a security alert and the owner of the repository will receive warning emails.

Next, say that the developer runs into a problem and posts a question on StackOverflow. The question will often include the problem code. If that code contains an API key, then anyone who reads the question can see and use the key!

One solution is to put the key into a property file. An obvious, but very poor choice would be to put it into the `Info.plist` file. This is a poor choice because `Info.plist` will almost certainly get checked into a repository, which may be public.

A better option is to create a separate property file, in our example `Weather/Open-WeatheMap-Info.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>API_KEY</key>
    <string>a1b2c33d4e5f6g7h8i9jakblc</string>
</dict>
</plist>
```

Next, change the code to use the property file:

```swift
class WeatherModel:ObservableObject {
    private let apiKey: String
    private let apiUri: String
    @Published var weatherData: WeatherData
    
    init(location: String) {
        guard let filePath = Bundle.main.path(forResource: "Open-Weather-Map-Info", ofType: "plist") else {
            fatalError("Couldn't find file 'Open-Weather-Map-Info.plist'.")
        }
        let plist = NSDictionary(contentsOfFile: filePath)
        guard let key = plist?.object(forKey: "API_KEY") as? String else {
            fatalError("Couldn't find key 'API_KEY' in 'Open-Weather-Map-Info.plist'.")
        }
        apiKey = key
        apiUri = "http://api.openweathermap.org/data/2.5/weather?q=" + location + "&appid=" + apiKey
        updateWeather()
    }
```

Finally, and most importantly, add the property file to `.gitignore` so that the property file never gets checked in:

```
*.xcodeproj
Open-WeatheMap-Info.plist
```
Although this approach prevents the API key from being checked into GitHub, the key is still present in the compiled application. It can easily be extracted from the application binary. The most secure approach is to use a proxy server so that the key is not required in the application.

## Issues with API Keys in JavaScript

JavaScript is code downloaded from a server and run on a client machine. There are inherent security risks to running arbitrary code which is why web browsers run JavaScript in a tightly controlled sandbox. Many websites need to obtain data by making API calls from JavaScript. This typically requires passing an API key with each request.

Calling an API from JavaScript means that any API key needs to be in the JavaScript code. This makes the key easily visible by viewing the page source. We have already seen that Google requires the API key to be embedded in JavaScript. We have also seen that Google strongly recommends that you restrict the API key. The restrictions mean that the key can be made public without compromising security.

The API key restrictions have two parts. First of all, the key is restricted by domain. Only JavaScript from one of the allowed domains can make a successful API call. Secondly, the key is restricted to specific API endpoints. Each key should only be able to call the API endpoints that are required, for example just the Google Maps API endpoint.

## Issues with API keys in Other Applications

API calls can also be made from applications written in languages such as Go and Python. Again, it is an important security principle not to hard code configuration values, particularly secrets such as API keys. A good way of doing this is to pass configuration values through environment variables. These are read at run time by the application. This also means that different environment variable values can be passed to configure for development, staging, and production environments.

The following example shows the contents of `Okta.go`:

```go
package main

import (
    "encoding/json"
    "fmt"
    "io/ioutil"
    "net/http"
    "os"
)

func main() {
    apiKey := os.Getenv("OKTA_API_KEY")
    domain := os.Getenv("OKTA_DOMAIN")

    uri := "https://" + domain + "/api/v1/users"
    client := &http.Client{}
    request, _ := http.NewRequest("GET", uri, nil)
    request.Header.Add("Authorization", "SSWS "+apiKey)
    response, err := client.Do(request)
    if err != nil {
        fmt.Println("Error " + err.Error())
        os.Exit(1)
    }
    defer response.Body.Close()

    body, _ := ioutil.ReadAll(response.Body)

    var users []map[string]interface{}
    json.Unmarshal(body, &users)

    for _, user := range users {
        profile := user["profile"].(map[string]interface{})
        fmt.Println(profile["firstName"].(string) + " " + profile["lastName"].(string))
    }
}
```

The Go code makes the same API request that was used to test the Okta API key. The API key and the domain are read from environment variables. The code then constructs the URI, sets the Authorization header, and makes the REST call. The response is decoded to extract the users' names. The code can be run by first setting the environment variables to valid values:

```bash
export OKTA_DOMAIN=dev-123456.okta.com
export OKTA_API_KEY=0...3
go run Okta.go
```

You do of course need to set the environment variables. This is often done using a script such as `~/.profile` or `~/.bashrc`. Be careful not to check the script into a repository such as GitHub.

## How to use a Proxy Server for SPAs

Another means of protecting API keys is to use a proxy server. A proxy server implements a subset of the required API. All requests are forwarded to the real API using the API key. As client applications make API calls through a proxy, they do not need to know the API key. Access to the proxy server can be restricted by requiring the client to authenticate.

It is very difficult to build a proxy server for the Google Maps API. The reason for this is that the API is very tightly coupled with the JavaScript embedded in the web page. Google goes to lengths to restrict the API key, so a proxy server adds an unnecessary complication.

We are going to build a single page application (SPA) that accesses the Open Weather API via a proxy server. The SPA consists of an HTML page and JavaScript that makes requests to a proxy server. A simple Go web server will serve this static content. The proxy server is another Go web server that extracts the API key from the environment and forwards the request to the real API. 

First, create the web page `WeatherSPA/index.html` with the following content:

```html
<html>
    <head>
        <meta charset="UTF-8" />
        <title>Weather</title>
        <link href="style.css" rel="stylesheet" type="text/css" />
        <script src="control.js" defer></script>
    </head>
    <body>
        <h1 id="name">Weather</h1>
        <div class="centred">
            <img id="icon" src=""/>
            <p id="weathermain"></p>
            <form id="weatherForm">
                <label for="location">Location</label>
                <select id="location" name="location">
                    <option value="berlin,de">Berlin, Germany</option>
                    <option value="chicago,us">Chicago, USA</option>
                    <option value="paris,fr">Paris, France</option>
                </select>
                <input type="button" value="Get Weather" onclick="onlocation()"/>
            </form>
        </div>
    </body>
</html>
```

The page has a form that allows a location to be selected. It also has placeholder elements where the weather data will be displayed.

Next, create a JavaScript file `WeatherSPA/control.js` with the following content:

```javascript
function onlocation() {
    fetch("http://localhost:8000/api/weather", {
        method : "POST",
        mode: 'cors',
        body: new URLSearchParams(new FormData(document.getElementById("weatherForm"))),
    })
    .then((response) => {
        if (!response.ok) {
            throw new Error(response.error)
        }
        return response.json();
    })
    .then(data => {
        document.getElementById('name').innerHTML = data.name;
        var weather = data.weather[0];
        document.getElementById('weathermain').innerHTML = weather.main;
        seticon(weather.icon);
    })
    .catch(function(error) {
        document.getElementById('weathermain').innerHTML = error;
    });
}

function seticon(icon) {
    document.getElementById("icon").src = "http://openweathermap.org/img/wn/" + icon + "@4x.png";
}

seticon("10d");
```

The function `onlocation()` is called when the form is submitted. It makes a POST request to the proxy server http://localhost:8000/api/weather, passing the form data. The response JSON object is decoded and the placeholder elements are updated with the response data.

The web servers will be written in GO. We, first of all, need to load the dependencies:

```bash
go mod init apikeys
go get github.com/gin-gonic/gin
go get github.com/gin-gonic/static
```

Next, we need a web server to deliver the static content. We will use a simple Go and Gin server. The Go code is in `WeatherServer/main.go`:

```go
package main

import (
    "github.com/gin-contrib/static"
    "github.com/gin-gonic/gin"
)

func main() {
    r := gin.Default()
    r.Use(static.Serve("/", static.LocalFile("./WeatherSPA", false)))
    r.Run(":8080")
}
```

This code creates a Gin server instance and configures it to serve static content from the `WeatherSPA` directory. It then starts the server listening on port 8080.

Next, we create the proxy server in the file `WeatherProxy/main.go`:

```go
package main

import (
    "io/ioutil"
    "net/http"
    "os"

    "github.com/gin-gonic/gin"
)

func Weather(c *gin.Context) {
    location := c.PostForm("location")
    uri := "http://api.openweathermap.org/data/2.5/weather?q=" + location + "&APPID=" + os.Getenv("OPEN_WEATHER_TOKEN")
    response, error := http.Get(uri)
    if error != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": error.Error()})
    }
    defer response.Body.Close()
    body, _ := ioutil.ReadAll(response.Body)
    c.Header("Access-Control-Allow-Origin", "http://localhost:8080")
    c.String(http.StatusOK, string(body))
}

func main() {
    r := gin.Default()
    r.POST("/api/weather", Weather)
    r.Run(":8000")
}
```

This creates a Gin server listening on port 8000. It responds to POST requests to `/api/weather` by calling the `Weather()` function.

The `Weather()` function extracts the location from the form data. It then constructs the URI for the actual API call using the location and the API key which is extracted from the environment variable `OPEN_WEATHER_TOKEN`. Next, it makes a GET request to the API and extracts the JSON string from the response. Finally, it sets the CORS header to allow the client browser to allow the request and returns the JSON string in the response body.

We can now test the application by starting the two servers from two command prompts and point a browser at http://localhost:8080.

```bash
go run WeatherProxy/main.go &
go run WeatherServer/main.go
```

The web page should be displayed. Select a location and hit the `Get Weather` button to see the current weather at the location.

## Conclusion

Secrets such as API keys are potentially dangerous if they get into the wrong hands. They can be used to change and delete data. They can also access expensive services which can incur large costs. Many APIs require an API key to be sent with each request. This means that client applications such as websites and mobile applications need to have access to API keys.

Developers are on the front line when it comes to information security. Simple mistakes, laziness, and worse time-saving hacks can have serious and potentially expensive consequences.

Never hard code API keys into source code. The only exception to this is JavaScript APIs, such as Google Maps, where the key is tightly restricted. It is quite common to store API keys in files. In which case ensure that the file is in the `.gitignore` file and verify that it will not be checked in on the next commit.

When posting questions or answers to websites such as StackOverflow, it is common to post code examples. Make very sure that the code does not contain any secrets.

It is important that developers always follow best practices. Always consider using environment variables, proxy servers, and secret stores when working with secrets such as API keys.


If you enjoyed reading this post, you might also like these posts from our blog:

- [Why OAuth API Keys and Secrets Aren't Safe in Mobile Apps](/blog/2019/01/22/oauth-api-keys-arent-safe-in-mobile-apps)
- [Build and Secure an API in Python with FastAPI](/blog/2020/12/17/build-and-secure-an-api-in-python-with-fastapi)
- [Securing REST APIs](/blog/2019/09/04/securing-rest-apis)

As always, if you have any questions please comment below. Never miss out on any of our awesome content by following us on [Twitter](https://twitter.com/oktadev) and subscribing to our channel on [YouTube](https://www.youtube.com/c/oktadev)!
