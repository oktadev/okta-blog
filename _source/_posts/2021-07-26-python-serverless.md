---
disqus_thread_id: 8672806191
discourse_topic_id: 17398
discourse_comment_url: https://devforum.okta.com/t/17398
layout: blog_post
title: How to Write a Secure Python Serverless App on AWS Lambda
author: phill-edwards
by: contractor
communities: [python]
description: "Tutorial: Build a secure serverless app with Python, Tornado, and AWS Lambda."
tags: [python, serverless, jwt]
tweets:
- "Building serverless functions in Python? Don't forget to secure them! Learn how in this post ☁️"
- "No servers❓ No problem❗ Build a serverless function with Python❗"
image: blog/python-serverless/python-serverless-social.png
type: conversion
---

Modern authentication systems generate JSON Web Tokens (JWT). While there are several types of JWTs, we're concentrating on access tokens. When a user successfully logs in to an application, a JWT is generated. The token is then passed in all requests to the backend. The backend can then validate the token and reject all requests with invalid or missing tokens.

Today, we are going to build a simple web application that uses the Okta authentication widget to log users in. The access token will be generated and sent to an API written in Python and deployed as an AWS Lambda function, which will validate the token. Let's get started!

**Table of Contents**{: .hide }
* Table of Contents
{:toc}

**NOTE**: The code for this project can be found on [GitHub](https://github.com/oktadev/okta-aws-python-example).

## Install AWS Serverless CLI, Python 3, and Tornado

If you haven't already got an AWS account, create an [AWS Free Tier Account](https://aws.amazon.com/free).

Next, install the [AWS SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html).

Next, if you don't already have Python installed on your computer, you will need to [install a recent version of Python 3](https://www.python.org/downloads/).

Now, create a directory where all of our future code will live.

```bash
mkdir aws-python
cd aws-python
```

To avoid issues running the wrong version of Python and its dependencies, it is recommended to create a virtual environment so that the commands `python` and `pip` run the correct versions:

```bash
python3 -m venv .venv
```

This creates a directory called `.venv` containing the Python binaries and dependencies. This directory should be added to the `.gitignore` file. This needs to be activated to use it:

```bash
source .venv/bin/activate
```

You can run the following command to see which version you are running.

```bash
python --version
```

Finally, you need to install the Tornado Python library to build a web server for the front end.

```bash
pip install tornado
```

## Create an Okta Account and Application

{% include setup/cli.md type="spa" loginRedirectUri="http://localhost:8080" %}

## CORS and Effect on AWS Lambda

As an important aside, we need to make a design decision as to how to pass the access token from the web front end to the Python backend Lambda function. There are several ways this can be done, it can be passed as an authorization header, in a cookie, or as a query or post parameter.

As the backend will be implemented as an AWS Lambda function, this limits our choice due to Cross-Origin Resource Sharing (CORS) restrictions. Web pages are hosted on a web server that has a domain name called the origin domain. When a web page needs to communicate with a backend API, a JavaScript function makes an HTTP request to the backend server. If the domain name, or even the port number, of the backend server, differs from the origin domain, then the browser will refuse the response due to CORS.

In order to overcome CORS restrictions, the backend server needs to set response headers that give the browser permission to accept the response data. The most important header is the one that specifies which origin domain can receive the response:

```http
Access-Control-Allow-Origin: http://www.example.com
```

It is also possible to allow access from any origin domain:

```http
Access-Control-Allow-Origin: *
```

Do be careful about allowing any domain, as it will almost certainly be flagged at a security audit, and may be in violation of an information security regulation.

CORS also adds further restrictions on which request HTTP headers are allowed. In particular, the `Authorization` header is forbidden. The restriction can be overcome by adding a second response header:

```http
Access-Control-Allow-Credentials: true
```

There is however a further complication. The browser doesn't know whether the server will allow the authorization header to be sent. To overcome this, the browser will make a *preflight request* to the server to determine whether the actual request will be allowed. The preflight request is an HTTP OPTIONS request. If the response contains the correct CORS headers then the actual request will be made.

The application we are going to build has a backend API implemented in Python, which will validate the access token on each request. This function is deployed as an AWS Lambda function. Unfortunately, the container in which the Lambda function is deployed will receive the preflight request. It will attempt to validate the token in the authorization header. This will fail as the container doesn't have the public key required to validate the token, resulting in a `403 Forbidden` response.

We can't use the authorization header, and cookies are often blocked, so we will send the token as a POST parameter.

## Build a Simple HTML and JavaScript Client

We will start by building a simple web front end in HTML and JavaScript. It will be served by a web server written in Python.

First of all, create a directory called `client` which will contain static content.

Next, create a file called `client/index.html` with the following content:

```html
<html>
    <head>
        <meta charset="UTF-8" />
        <title>How to write a secure Python Serverless App on AWS Lambda</title>
        <script src="https://global.oktacdn.com/okta-signin-widget/5.7.3/js/okta-sign-in.min.js" type="text/javascript"></script>
        <link href="https://global.oktacdn.com/okta-signin-widget/5.7.3/css/okta-sign-in.min.css" type="text/css" rel="stylesheet"/>
        <link href="style.css" rel="stylesheet" type="text/css" />
        <script src="control.js" defer></script>
    </head>
    <body>
        <h1>How to write a secure Python Serverless App on AWS Lambda</h1>
        <div id="widget-container"></div>
        <div class="centred">
            <form id="messageForm">
                Message: <input id="message" name="message" type="message"/>
                <input type="hidden" id="token" name="token"/>
                <input type="button" value="Send" onclick="onmessage()"/>
            </form>
            <textarea id="messages" name="messages" rows="10" cols="50">Messages</textarea><br/>
        </div>
    </body>
</html>
```

The Okta Sign-In Widget's JavaScript and CSS files are loaded from Okta's global CDN (content delivery network). The `widget-container` will be replaced by the login form when the page loads. The page contains a simple form that has a test box for a message and a hidden input that will hold the access token. The text area at the bottom will display responses from the server.

Now, create a stylesheet called `client/style.css`. Here is an example:

```css
body {
    background-color: #ccccff;
    text-align: left;
}

h1 {
    text-align: center;
    font-size: 50pt;
    font-style: italic;
    color: #0000FF;
    clear: both;
}

h2 {
    text-align: center;
    font-size: 30pt;
    font-style: normal;
    color: #0000FF;
    clear: both;
}

.centred {
    text-align: center;
    display: block;
    margin-left: auto;
    margin-right: auto;
}
```

Next, create a file called `client/control.js` with the following JavaScript:

```javascript
var accessToken = null;

var signIn = new OktaSignIn({
    baseUrl: 'http://{yourOktaDomain}',
    clientId: '{yourClientId}',
    redirectUri: window.location.origin,
    authParams: {
        issuer: 'https://{yourOktaDomain}/oauth2/default',
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
    const url = "http://localhost:3000/api/messages";
    var headers = {}
    if (accessToken != null) {
        document.getElementById('token').value = accessToken;
    }
    fetch(url, {
        method : "POST",
        mode: 'cors',
        body: new URLSearchParams(new FormData(document.getElementById("messageForm"))),
    })
    .then((response) => {
        if (!response.ok) {
            throw new Error(response.error)
        }
        return response.text();
    })
    .then(data => {
        messages = JSON.parse(data)
        document.getElementById('messages').value = messages.join('\n');
    })
    .catch(function(error) {
        document.getElementById('messages').value = error;
    });
}
```

Let's see what this JavaScript does. It declares a variable that will hold the access token. It then creates an `OktaSignIn` object. Replace `{yourOktaDomain}` and `{yourClientId}` with the values from the Okta CLI.

The `renderEl()` function displays the login form and performs the authentication process. On successful login, the access token is extracted from the response and saved. The login form is then hidden.

The `onmessage()` function is called when the user hits the submit button on the form. It stores the access token in the hidden input on the form and then makes a POST request to the backend server. It writes the response from the server into the text area.

## Build a Web Server in Python

Now you are going to build a web server in Python to serve the static content. A web server is required because some of the JavaScript will not work if you simply load the page into a browser.

You will make the server a Python package, which is simply a directory, in this case, called `server`, containing Python code. Python packages require a file called `__init__.py`. This is run when the package is loaded and is often just an empty file.

```bash
mkdir server
touch server/__init__.py
```

Next, create a file called `server/FileHandler.py` containing the following Python code:

```python
from tornado.web import StaticFileHandler

class FileHandler(StaticFileHandler):
    def initialize(self, path):
        self.absolute_path = False
        super(FileHandler, self).initialize(path)
```

It uses the Python Tornado framework and implements a static file handler that serves any files from the directory specified in the `path` constructor parameter.

Next, create a file called `server/__main__.py` containing the following Python code:

```python
import signal
import sys
from tornado.httpserver import HTTPServer
from tornado.ioloop import IOLoop
from tornado.options import define, options
from tornado.web import Application, RequestHandler
from server.FileHandler import FileHandler

define("port", default=8080, help="Listener port")
options.parse_command_line()
application = Application([
    ('/()$', FileHandler, {'path': "client/index.html"}),
    ('/(.*)', FileHandler, {'path': "client"}),
])
http_server = HTTPServer(application)
http_server.listen(options.port)
print("Listening on port", options.port)
try:
    IOLoop.current().start()
except KeyboardInterrupt:
   print("Exiting")
   IOLoop.current().stop()
```

This, first of all, looks for a command line parameter called `--port` to obtain a port number to listen on which defaults to 8080.

An `Application` object is created which implements a Tornado web server. The application is constructed with a list of tuples. Each tuple has two or more values. The first value is a URI. This can be a regular expression. Any URI component in parentheses is captured as a path parameter. The second tuple value is a Python class that handles requests for matching URIs. Any remaining values are path parameters captured from the URI. They become constructor parameters as an instance of the class is created on each request. In this case, the file or directory containing the static content is specified.

Finally, the server is created and started.

Now, the front end can be tested by starting the server and pointing a web browser at `http://localhost:8080`.

```bash
python -m server --port=8080
```

You should be able to log in using your Okta credentials. You will not be able to send a message at this stage as there is currently no backend.

## Create an AWS Lambda Function in Python

You need to create a basic AWS Lambda function. You can use the SAM CLI to build, run, and deploy the application. Lambda functions can be built and run locally in a Docker container which emulates the AWS environment.

First of all, create a directory called `auth-app`, and create a Python package called `messages` inside it:

```bash
mkdir -p auth-app/messages
touch auth-app/messages/__init__.py
```

Next, create a file called `auth-app/messages/requirements.txt` containing a list of packages to be loaded by `pip`:

```
jwt
requests
tornado
```

Next, create a simple Lambda function. Create a file called `auth-app/messages/messages.py` containing the following Python code:

```python
def message(event, context):
    return { 
        'statusCode': 200,
        'body': 'Hello World!'
    }
```

The function has two parameters, which are both dictionaries. You will be using the `event` map later to extract request parameters. The function has to return a dictionary containing the HTTP response code and the response body.

Next, you need to create the deployment template file `auth-app/template.yaml`:

```yaml
AWSTemplateFormatVersion: '2010-09-09'
Transform: AWS::Serverless-2016-10-31
Description: >
  auth-app

  Sample SAM Template for auth-app

# More info about Globals: https://github.com/awslabs/serverless-application-model/blob/master/docs/globals.rst
Globals:
  Function:
    Timeout: 10

Resources:
  OktaKeys:
    Type: String
  MessagesFunction:
    Type: AWS::Serverless::Function # More info about Function Resource: https://github.com/awslabs/serverless-application-model/blob/master/versions/2016-10-31.md#awsserverlessfunction
    Properties:
      Environment:
          Variables:
              OKTA_KEYS: !Ref OktaKeys
      CodeUri: messages/
      Handler: messages.message
      Runtime: python3.7
      Events:
        Messages:
          Type: Api # More info about API Event Source: https://github.com/awslabs/serverless-application-model/blob/master/versions/2016-10-31.md#api
          Properties:
            Path: /api/messages
            Method: post
```

The globals section defines a timeout. This is the maximum time the function is allowed to complete a request.

The resources section defines one or more Lambda functions. It defines any environment variables that will be passed to the function. The `CodeUri` defines the Python package containing the function. The `Handler` defines the Python function to call. The `Runtime` defines the language and version of the executable environment, in this case, Python 3.7. The events define the API, the path is the request URI, and the method is the HTTP request method.

Next, build the application in a Docker container. The first time this command is executed, SAM will pull a Docker image. This can take some time to download.

```bash
cd auth-app
sam build --use-container
```

The build creates a directory called `auth-app/.aws-sam`.  This should be added to your `.gitignore` file.

Now, you can run the application locally:

```bash
sam local start-api
```

Then test it using `curl`:

```bash
curl -i -X POST http://localhost:3000/api/messages
```

## Validate a JWT Offline in a Python Lambda Function

Offline JWT validation requires a public key. Authentication providers, such as Okta, provide a URL that returns a public key set (JWKS). The key set is a JSON array. We are going to base64 encode the JSON array to make it more manageable. Issue the following command to get the base64 encoded keys:

```bash
curl https://${yourOktaDomain}/oauth2/default/v1/keys | base64
```

Next, create a file called `env` in the `auth-app` directory that overrides environment variables in the template file:

```json
{
    "MessagesFunction" : {
        "OKTA_KEYS": "base64 string from key provider"
    }
}
```

Next, you are going to extract the public key from the key set. There can be multiple keys, but I will assume that there is only one, which is often the case. Add the following Python code to `auth-app/messages/messages.py`:

```python
import base64
from jwt import (JWT, jwk_from_dict)
from jwt.exceptions import JWTDecodeError
import os

public_key = None

def get_keys():
    keys = base64.b64decode(os.environ['OKTA_KEYS'])
    jwks = json.loads(keys)
    for jwk in jwks['keys']:
        public_key = jwk_from_dict(jwk)

get_keys()
```

**NOTE**: This post uses local validation of JWTs rather than using the introspect endpoint to validate them remotely. This is done for efficiency.

The function gets called when the file is loaded. It extracts the JWKS from the environment variable and does a base64 decode to get the JSON string. This is then turned into a Python dictionary. It then calls `jwk_from_dict()`, which extracts the public key.

Next, add a verify functions which validates the token using the public key:

```python
def verify(token):
    result = {}
    try:
        decoded = instance.decode(token, public_key, False)
    except JWTDecodeError:
        result = { 'statusCode': 403, 'body': 'Forbidden '}
    return result
```

You also need a helper function to extract the URL encoded POST form data:

```python
def get_post_data(body):
    postdata = {}
    for items in body.split('&'):
        values = items.split('=')
        postdata[values[0]] = values[1]
    return postdata
```

Finally, you need to modify the main `message()` function to do validation and return the messages or an error:

```python
def message(event, context):
    body = get_post_data(event['body'])
    result = verify(body['token'])
    if not bool(result):
        messages.append(body['message'])
        result = { 
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
            },
            'body': json.dumps(messages) 
    }
    return result
```

**NOTE**: Notice that the response includes the CORS headers.

You now have a complete application. Build and start the AWS backend:

```bash
sam build --use-container
sam local start-api --env-vars env
```

Start the frontend webserver:

```bash
python -m server --port=8080
```

Now, point a web browser at `http://localhost:8080`. Type in a message and submit the form. You should get a 401 error message displayed. Log in using your Okta credentials. Now send another message. You should see a list of messages.

**TIP**: When working with complex web applications, always have the developer console open on the browser. It will save a lot of time diagnosing JavaScript and network errors.

## Learn More About Python, JWTs, and AWS

You have now built an application that uses Okta authentication to obtain a JWT access token. A Python API validates the token using a public key before processing any requests.

You only did local deployment as a proof of concept.  To deploy a Lambda function into the cloud use:

```bash
sam deploy --guided
```

This will prompt and guide you through the deployment process and give you the URL to the deployed function.

While writing this post, I experienced first-hand how confusing and overly complicated Amazon documentation can be. As you can see, the actual minimal code to make things work is quite simple.

There are some downsides. The functions have to be started when requests arrive. This can add latency. Also, you have no control over which instance of a function will handle a request. Typically each request will be handled by a different instance of a function. Any data which needs to be available across requests must be stored in cloud storage or a database.

Serverless applications are definitely the way forward. The beauty is that you can simply deploy a function into a cloud, and not have to create any server environment to host the function. The functions can be written in a number of programming languages including Go, Java, and Python.

The cloud replicates the functions depending on demand. They scale to zero, meaning that they use no resources, and hence incur no costs when not being used.

You can find the source code for this article on GitHub in the [okta-aws-python-example repository](https://github.com/oktadev/okta-aws-python-example).

If you enjoyed this post, you might like related ones on this blog.

- [Build and Secure an API in Python with FastAPI](/blog/2020/12/17/build-and-secure-an-api-in-python-with-fastapi)
- [Building a GitHub Secrets Scanner](/blog/2021/02/01/building-a-github-secrets-scanner)
- [The Definitive Guide to WSGI](/blog/2020/11/16/definitive-guide-to-wsgi)
- [Build a CRUD App with Python, Flask, and Angular](/blog/2019/03/25/build-crud-app-with-python-flask-angular)
- [Build a Simple CRUD App with Python, Flask, and React](/blog/2018/12/20/crud-app-with-python-flask-react)

Follow us for more great content and updates from our team! You can find us on [Twitter](https://twitter.com/oktadev), [Facebook](https://www.facebook.com/oktadevelopers), subscribe to our [YouTube Channel](https://youtube.com/c/oktadev) or start the conversation below.
