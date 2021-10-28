---
disqus_thread_id: 8279564553
discourse_topic_id: 17319
discourse_comment_url: https://devforum.okta.com/t/17319
layout: blog_post
title: The Definitive Guide to WSGI
author: phill-edwards
by: contractor
communities: [python]
description: "Unlocking the mysteries of Python's WSGI web framework."
tags: [python]
tweets:
- "Learn more about the technology that powers most Python frameworks with this post"
- "Are you a Flask or Django developer? Have you and wondered what WSGI is? Get up to speed with this post"
image: blog/definitive-guide-to-wsgi/festisite-wsgi-card.jpg
type: awareness
---

Python has a number of different frameworks for building web applications. The choice of framework limits the choice of available web servers. Java also has a number of web frameworks but they are all based on the common servlet API which means that any framework can run on any web server which supports the servlet API.

You've probably seen WSGI mentioned before, but you might not be exactly sure what it meant or did. In this post, you will learn to write your own WSGI application and a basic WSGI server, too! Let's get started!

(The dry technical details of WSGI are defined in [PEP 333](https://www.python.org/dev/peps/pep-0333/) and extended with [PEP 3333](https://www.python.org/dev/peps/pep-3333/) to improve string handling in Python 3.)

**PS**: The code for this project can be found on [GitHub](https://github.com/Dr-Phill-Edwards/wsgi) if you'd like to check it out

## Prerequisites to Building a WSGI Application

First things first, if you don't already have Python installed on your computer, you will need to [install a recent version of Python 3](https://www.python.org/downloads/).

Next, you need to install the [Tornado library](https://www.tornadoweb.org/en/stable/) (which will be used to run the WSGI application):

```bash
pip install tornado
```

Finally, create a project directory where all of our future code will live:

```bash
mkdir ~/wsgi
cd ~/wsgi
```

## How to Build a Simple WSGI Application

We will start by creating the simplest WSGI application running in a Tornado server. Create a file called `simple.py` containing the following Python code:

```python
from tornado.httpserver import HTTPServer
from tornado.ioloop import IOLoop
from tornado.wsgi import WSGIContainer

def application(environ, start_response):
    status = '200 OK'
    response_headers = [('Content-type', 'text/plain')]
    start_response(status, response_headers)
    return [b"Welcome to WSGI!\n"]

container = WSGIContainer(application)
server = HTTPServer(container)
server.listen(8080)
print("Listening")
IOLoop.current().start()
```

Let's explain what this code does. It is necessary to import any external packages so that Python can find the code. We could have simply used `import tornado.ioloop` but then later would have had to use `tornado.web.IOLoop` in the code. Using the `from` form of `import` means that we can just use `IOLoop`.

The function `application` implements WSGI.  PEP 3333 refers to it as the *application object*. It has two parameters that are required by the WSGI server interface. These parameters are passed by the WGSI server implementation—in this case, the `WSGIContainer`.

The first parameter `environ` is a dictionary that contains environment variables that must be present. They must include environment variables defined by the Common Gateway Interface (CGI) specification. It may contain environment variables from the operating system. It must also contain WSGI-defined variables.  These environment variables are listed in the [PEP 3333](https://www.python.org/dev/peps/pep-3333/#environ-variables) document.

The second parameter `start_response` is a function that must be called by the `application` function on each request. `start_response` takes two parameters, the response status code and a list of response headers. Each list element represents a header and is a tuple containing the header name and the header value. In the example above, the list contains one element that represents the `Content-Type` header: `[('Content-type', 'text/plain')]`

The application object needs to define the HTTP response. It defines the status code which is a string containing a three-digit number and a message. It also needs to define any response headers in the form of a list of tuples. It then calls the `start_response` function passing it the status and headers. It then returns the response body. It must be of the Python type `bytes`, hence the `b` in front of the string.

Finally, we need to create a server—a Tornado `WSGIContainer` object which takes the WSGI function as a parameter. We then construct the `HTTPServer` object passing it to the WSGI container. We then need to tell the application which port to listen on, in this case, port 8080. The last line starts an `IOLoop` which will start listening on port 8080 and pass requests to the handler class instances.

The server can now be run using:

```bash
python simple.py
```

The server can be tested by pointing a web browser at `http://localhost:8080` or using the `curl` command. The welcome message should be displayed.

```bash
curl http://localhost:8080
```

The server can be stopped by typing **Control-C**.  Python will complain about being interrupted but this can be ignored.

## How to Create a Python Package Containing a WSGI Application

A Python package is simply a directory containing Python files. We are going to create a package called `server` which needs to be in a directory of the same name.

```bash
mkdir server
```

The Python package plumbing requires a file called `__init__.py` which is executed whenever the package is imported. It can be an empty file.

```bash
touch server/__init__.py
```

A WSGI application can also be implemented as a class. Create the file `server/Application.py` containing the following Python code:

```python
class Application:
    def __init__(self, environ, start_response):
        self.environ = environ
        self.start = start_response

    def __iter__(self):
        status = "200 OK"
        headers = [("Content-type", "text/plain")]
        self.start(status, headers)
        for chunk in [b"Welcome" b" " b"to" b" " b"WSGI!\n"]:
            yield chunk
```

Like the `application` function we wrote above, the constructor `__init__` must have the two parameters that are required by the WSGI server interface. In our example, these are saved as class attributes.

The class also needs to have an *iterator* method called `__iter__`, which at some point must call the "start_response" function that was passed to the constructor. The `__iter__` method must also  `yield` responses—as the "bytes" type and not the "str" type you might expect . Note that `__iter__` is a *generator*. This is why the keyword `yield` is used in place of `return`. Tersely put, `__iter__` is a generator that yields bytes. The generator is used because the response body could be a large object such as a video. This allows the server to start sending content immediately, instead of waiting until everything is loaded.

If a package contains a file called `__main__.py` it becomes the entry point for the module and allows the package to be run without specifying any Python files. Create a file called `server/__main__.py` with the following content:

```python
from tornado.httpserver import HTTPServer
from tornado.ioloop import IOLoop
from tornado.options import define, options
from tornado.wsgi import WSGIContainer
from .Application import Application

define("port", default=8080, help="Listener port")
options.parse_command_line()
container = WSGIContainer(Application)
server = HTTPServer(container)
server.listen(options.port)
print("Listening on port", options.port)
IOLoop.current().start()
```

This is similar to the earlier code, except that the class is passed to the WSGI container in place of the function.

It is bad practice to hard code the port number. Tornado provides an `options` package that allows command-line options to be defined and processed. A `port` option is defined which has a default value of 8080. It can be changed to port 80 on the command line using the `--port=80` option. 

The server can be run specifying the port number to use.

```bash
python -m server --port=8080
```

The program can be tested using `curl`, the `-i` option prints out the response headers.

```bash
curl -i http://localhost:8080
```

## Understanding the WSGI Environment 

The WSGI environment dictionary contains the information required to process requests. We will copy `server/Application.py` to `server/Environment.py` while also renaming the "Application" class to "Environment"

```bash
cat server/Application.py | sed 's/Application/Environment/' > server/Environment.py
```

Next we will modify the iterator method in `server/Environment.py` to return the contents of the dictionary: 

```python
def __iter__(self):
     status = "200 OK"
    headers = [("Content-type", "text/plain")]
    self.start(status, headers)
    for key, value in sorted(self.environ.items()):
        yield f"{key}: {value}\n".encode()
```

We also need to change `Application` to `Environment` in `server/__main__.py` so that it looks like this: 


```python
from tornado.httpserver import HTTPServer
from tornado.ioloop import IOLoop
from tornado.options import define, options
from tornado.wsgi import WSGIContainer
from .Environment import Environment

define("port", default=8080, help="Listener port")
options.parse_command_line()
container = WSGIContainer(Environment)
server = HTTPServer(container)
server.listen(options.port)
print("Listening on port", options.port)
IOLoop.current().start()
```

Run the server and then use `curl` to send a GET request.

```bash
curl http://localhost:8080/example?user=Joe
```

The contents of the dictionary are:

```
HTTP_ACCEPT: */*
HTTP_HOST: localhost:8080
HTTP_USER_AGENT: curl/7.64.1
PATH_INFO: /example
QUERY_STRING: user=Joe
REMOTE_ADDR: ::1
REQUEST_METHOD: GET
SCRIPT_NAME:
SERVER_NAME: localhost
SERVER_PORT: 8080
SERVER_PROTOCOL: HTTP/1.1
wsgi.errors: <_io.TextIOWrapper name='<stderr>' mode='w' encoding='utf-8'>
wsgi.input: <_io.BytesIO object at 0x1077d36d0>
wsgi.multiprocess: True
wsgi.multithread: False
wsgi.run_once: False
wsgi.url_scheme: http
wsgi.version: (1, 0)
```

The request method is in the environment variable `REQUEST_METHOD`. You can find the components of the URL `http://localhost:8080/example?user=Joe` in the environment variables `wsgi.url_scheme`, `HTTP_HOST`, `PATH_INFO`, and `QUERY_STRING`.

Now use `curl` to send a POST request.

```bash
curl -i -X POST -d "email=michelle@example.com&password=abcd1234" http://localhost:8080/login
```

The contents of the dictionary are:

```
CONTENT_LENGTH: 44
CONTENT_TYPE: application/x-www-form-urlencoded
HTTP_ACCEPT: */*
HTTP_HOST: localhost:8080
HTTP_USER_AGENT: curl/7.64.1
PATH_INFO: /login
QUERY_STRING:
REMOTE_ADDR: ::1
REQUEST_METHOD: POST
SCRIPT_NAME:
SERVER_NAME: localhost
SERVER_PORT: 8080
SERVER_PROTOCOL: HTTP/1.1
wsgi.errors: <_io.TextIOWrapper name='<stderr>' mode='w' encoding='utf-8'>
wsgi.input: <_io.BytesIO object at 0x1042f5450>
wsgi.multiprocess: True
wsgi.multithread: False
wsgi.run_once: False
wsgi.url_scheme: http
wsgi.version: (1, 0)
```

The POST request sent parameters in the HTTP request body. This added the environment variables `CONTENT_LENGTH` and `CONTENT_TYPE`. The request body is contained in the environment variable `wsgi.input` which is a byte stream. This can be displayed by decoding the byte stream.

```python
    def __iter__(self):
        status = "200 OK"
        headers = [("Content-type", "text/plain")]
        self.start(status, headers)
        for key, value in sorted(self.environ.items()):
            yield f"{key}: {value}\n".encode()
        yield self.environ['wsgi.input'].getvalue()
        yield "\n".encode()
```

The output from the `curl` request now has the following line:

```
email=michelle@example.com&password=abcd1234
```

## What are WSGI Server Considerations?

The Tornado WSGI container runs a single application. It also requires Python code to create the container and the server. A consequence of this is that the application needs to use the request method and the path to decide what content to serve.

There is another popular Python webserver called [Green Unicorn](https://gunicorn.org/). It can run Python web applications, including WSGI applications, without any additional code. If the WSGI application is not a function called `application` then the function or class needs to be specified on the command line after a colon character. Again, it runs a single application.

```bash
pip install gunicorn
gunicorn -b :8080 server.Application:Application
```

A more flexible solution is to use an Apache web server which has the `mod_wsgi` module installed. This allows URIs to be mapped to WSGI applications. A single server can run multiple applications each one handling a different URI.

# How to Implement a WSGI Server

It may sometimes be necessary to implement the WSGI server side of the interface. A typical use case is writing a middleware layer that needs to perform transformation or forward requests to other servers.

In this example, we will implement a server that can redirect requests to different WSGI applications based on the HTTP request method and the URI.

Create a file called `server/WSGIRunner.py` containing the following Python code:

```python
import sys
from tornado.web import RequestHandler
from .Application import Application
from .Environment import Environment

class WSGIRunner(RequestHandler):
    headers = []
    url_map = {
        '/': Application,
        '/env': Environment
    }

    def get(self, path):
        self._set_environment('GET', path)
        if path in WSGIRunner.url_map:
            self.run(WSGIRunner.url_map[path])
        else:
            self.send_error(404)

    def _set_environment(self, method, path):
        self.environ = {
            'wsgi.errors': sys.stderr,
            'wsgi.input': sys.stdin.buffer,
            'wsgi.multiprocess': True,
            'wsgi.multithread': False,
            'wsgi.run_once': False,
            'wsgi.url_scheme': 'http',
            'wsgi.version': (1, 0),
            'HTTP_ACCEPT': self.request.headers['Accept'],
            'HTTP_HOST': self.request.headers['Host'],
            'HTTP_HTTP_USER_AGENT': self.request.headers['User-Agent'],
            'REQUEST_METHOD': method,
            'PATH_INFO': path
        }
        query = ''
        for k, v in self.request.arguments.items():
            if len(query) > 0:
                query += '&'
            query += k + '=' + v[0].decode()
        self.environ['QUERY_STRING'] = query

    @staticmethod
    def start_response(status, response_headers):
        headers = response_headers

    def run(self, application):
        result = application(self.environ, WSGIRunner.start_response)
        for header in WSGIRunner.headers:
            self.set_header(header[0], header[1])
        for data in result:
            self.write(data)
```

The class `WSGIRunner` is a Tornado request handler which implements a `get` method that has a `path` parameter containing the request URI. 

The `_set_environment()` method is called to create the environment map required by WSGI. The parameters are the request method—in this case, GET and the path.

The `get` method looks up the path in a static dictionary. If the entry exists, the dictionary returns the class containing the WSGI application to run. The `run` method is called to run the application. If the path is not in the map a 404 not found response is sent using the `RequestHandler` `send_error()` method.

The `start_response()` method is the response callback required by the WSGI interface. It *has to be* a static method. The `@staticmethod` annotation allows the class to define a static method that does not require a `self` parameter. The method simply stores the response headers in the static list `headers`.

The `run` method calls the WSGI application, passing the environment dictionary and the response callback. It then sets the response headers and writes the data returned by the application as the response.

Tornado will decode any query string, so it needs to be reconstructed from the request arguments.

The file `___main__.py` now must be changed to run the `WSGIRunner` as a Tornado application.

```python
from tornado.httpserver import HTTPServer
from tornado.ioloop import IOLoop
from tornado.options import define, options
from tornado.web import Application
from .WSGIRunner import WSGIRunner

define("port", default=8080, help="Listener port")
options.parse_command_line()
application = Application([("(/.*)", WSGIRunner)])
server = HTTPServer(application)
server.listen(options.port)
print("Listening on port", options.port)
IOLoop.current().start()
```

The Tornado `Application` gets passed an array of tuples, in this case just one. The tuple contains a URI and a class that handles it. In this case, the URI is a regular expression in parentheses that matches everything. The parentheses cause the URI to be captured and passed as a parameter to the `get` method.

## Summing Up WSGI

WSGI is an interface specification for Python web applications. It is a low-level interface. Many Python developers build web applications using popular frameworks, such as Flask, Tornado, or Django. 

If it is unlikely that the web application framework will be changed, the benefits of using the framework APIs outweigh the limitations of WSGI. If, however, the web application is designed to be deployed in different server environments, then WSGI is the only choice as it is a Python standard.

The biggest limitation of WSGI is that it needs to implement code conditionally based on the request method and the request URI. It also needs to extract and decode any request parameters from the environment dictionary.

These limitations can be overcome by using a standalone server implementation, which can invoke different WSGI applications, depending on the request method and URI. A utility class can decode request parameters and return a dictionary in a more consumable form.

To sum it up, while WSGI is a low-level protocol for building web applications in Python, it is often helpful to understand how these things work behind the scenes.  While you probably won't be building any raw WSGI applications, I hope this information will be helpful to you in your web development journey.

If you liked this post, be sure to check out some of our other great posts:
- [Build a Simple CRUD App with Python, Flask, and React](/blog/2018/12/20/crud-app-with-python-flask-react/)
- [An Illustrated Guide to OAuth and OpenID Connect](/blog/2019/10/21/illustrated-guide-to-oauth-and-oidc/)
- [What the Heck is OAuth?](/blog/2017/06/21/what-the-heck-is-oauth/)

We are always posting new content. If you liked this post, be sure to [follow us on Twitter](https://twitter.com/oktadev), subscribe to our [YouTube channel](https://youtube.com/c/oktadev), and [follow us on Twitch](https://www.twitch.tv/oktadev).
