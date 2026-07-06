---
layout: blog_post
title: "How to Build a Secure Flask App with Okta and a Custom Resource Server"
author: akanksha-bhasin
by: advocate
communities: [python,security]
description: "Learn to add secure authentication to a Flask app with Okta and call a protected API using scoped access tokens."
tags: [python, flask, oauth, oidc, pkce, okta, authentication]
type: conversion
image: blog/flask-oauth-web-app/flask-oauth-web-app-social-image.jpg
github: https://github.com/oktadev/flask-web-app-example
---

Python's simplicity and the flexibility of the Flask microframework make it a popular choice for quickly building web applications. While Flask provides the essentials to get you started, you'll need to implement a critical piece yourself: secure user authentication. After all, how do you securely sign users into your application?

This tutorial shows you how to solve that problem. You'll add a secure authentication layer to your Flask application using modern standards like OAuth 2.0 and OpenID Connect (OIDC). You'll also learn how to implement the secure Authorization Code flow with Proof Key for Code Exchange (PKCE) and build a complete sign-in and sign-out workflow. Second, and just as importantly, you'll learn how to use the resulting scoped access tokens to make protected calls to an API.

Check out the complete source code on [GitHub](https://github.com/oktadev/flask-web-app-example) and get started without setting it up from scratch.

**Table of Contents**{: .hide }
* Table of Contents
{% include toc.md %}


## What you'll build

In this tutorial, you'll build a simple dashboard application and learn how to:

* Securely sign users in to view their profile information using Okta as the OpenID Connect (OIDC) identity provider.  
* Implement the Authorization Code flow with [Proof Key for Code Exchange (PKCE)]({% post_url 2025-07-28-express-oauth-pkce %}) to adhere to the latest OAuth 2.0 security best practices.  
* Add a feature for new users to self-register for an account directly from the sign-in page.  
* Enable authenticated users to interact with a protected API using OAuth 2.0 access tokens.

## Prerequisites

* [Python](https://www.python.org/) 3.14 or later and [pip](https://pypi.org/project/pip/) installed  
* An [Okta Integrator Free Plan](https://developer.okta.com/signup/)

## Create an app integration in the Okta Admin Console

Before you begin, you'll need an Okta Integrator Free Plan account. To get one, sign up for an [Integrator account](https://developer.okta.com/login). Once you have an account, sign in to your [Integrator account](https://developer.okta.com/login). Next, in the Admin Console:

1. Go to Applications \> Applications  
2. Click Create App Integration  
3. Select OIDC \- OpenID Connect as the sign-in method  
4. Select Web Application as the application type, then click Next  
5. Enter an app integration name  
6. Configure the redirect URIs:  
   * Sign-in redirect URIs: http://localhost:5000/authorization-code/callback  
   * Sign-out redirect URIs: http://localhost:5000  
7. Click **Save**
8. Open the saved app, go to the **Assignments** tab, click **Assign** \> **Assign to Groups**, search for **Everyone**, click **Assign**, then click **Done**

## Enable self-service user registration

User registration is vital for any application, and Okta makes the process quick and hassle-free. Setting this up involves two main steps:

1. Create a user profile policy \- This policy defines the attributes a user must provide when self-registering. See the [Okta documentation](https://help.okta.com/oie/en-us/content/topics/identity-engine/policies/create-profile-enrollment-policy.htm) for detailed instructions.  
2. Assign your application to the policy \- This step is required; without it, the self-service registration flow will not activate for your app. See the [product documentation](https://help.okta.com/oie/en-us/content/topics/identity-engine/policies/select-profile-enrollment-policy.htm) for more details.

## Add secure user login to a Flask application with Okta

Now that you've configured your app integration in Okta and noted the required Okta application details, it's time to create your Flask application.

### Create a basic Flask web application

First, you'll create a project folder and a Python virtual environment, then install the necessary dependencies.

1. Create a project folder named flask-web-app and a subfolder called venv.  
2. Open a terminal window in the project folder and create a Python virtual environment

   ```bash
   python -m venv venv
   ```

3. Activate the virtual environment. Use the command that corresponds to your operating system.

   ```bash
   # On macOS/Linux
   source venv/bin/activate

   # On Windows
   venv\Scripts\activate.bat
   ```

4. With your environment active, install the required libraries:

   ```bash
   pip install Authlib==1.6.1 Flask[async]==3.1.1 python-dotenv==1.1.1 requests==2.32.4 okta-jwt-verifier==0.3.0
   ```

### Configure Flask environment variables

To keep sensitive credentials secure, you'll store them in a .env file and load them into the application's configuration. This practice prevents hard-coding secrets directly into your source code.

1. Create a file named .env in the project root and add your Okta application's configuration details. Replace the placeholders with your actual values.

   ```bash
   OKTA_CLIENT_ID={yourClientId}
   OKTA_CLIENT_SECRET={yourClientSecret}
   OKTA_BASE_URL=https://{yourOktaDomain}
   ```

2. Create a config.py file in the project root. This file reads the values from .env and constructs the OIDC metadata URL, which the application uses to fetch endpoints from Okta.

   ```python
   import os

   OKTA_CLIENT_ID = os.getenv('OKTA_CLIENT_ID')
   OKTA_CLIENT_SECRET = os.getenv('OKTA_CLIENT_SECRET')
   OKTA_BASE_URL = os.getenv("OKTA_BASE_URL")
   OKTA_METADATA_URL = f"{OKTA_BASE_URL}/.well-known/openid-configuration"
   ```

### Implement the OIDC authentication logic

Next, create the main application file, app.py, in your project's root directory. This file holds the core logic for handling OIDC authentication. Paste the following code into it to configure the basic application.

```python
from flask import Flask, render_template, url_for, redirect, session
from authlib.integrations.flask_client import OAuth
from dotenv import load_dotenv
import os
import requests

load_dotenv()

app = Flask(__name__)
app.secret_key = os.urandom(24)

app.config.from_object('config')

@app.route("/")
def index():
    return render_template('index.html')

if __name__ == "__main__":
    app.run(debug=True)
```

#### Initialize the Okta OIDC client

To set up the connection to Okta, add the following code to the bottom of your app.py file. This code initializes an OAuth object and registers the Okta application as a remote provider.

```python
# Create a registry with an OAuth object
oauth = OAuth(app)

# Register a remote application
oauth.register(
    name='okta',
    client_id=app.config['OKTA_CLIENT_ID'],
    client_secret=app.config['OKTA_CLIENT_SECRET'],
    server_metadata_url=app.config['OKTA_METADATA_URL'],
    client_kwargs={
        'scope': 'openid profile email offline_access',
        'code_challenge_method': 'S256'
    }
)
```

The first parameter in the register() method (in this case, *Okta*) is the name of the remote application. You'll later access the remote application with oauth.okta to handle all the OIDC-related functions.

The client\_kwargs dictionary passes extra parameters to the authorization request. Because the code\_challenge\_method is present, the Authlib library automatically uses the [Proof Key for Code Exchange (PKCE)]({% post_url 2025-07-28-express-oauth-pkce %}#why-use-pkce-in-oauth-20) flow, which enhances security.

#### Build Flask routes for OIDC authentication

The sign-in process begins when the user clicks the Login button, which redirects the browser to the Okta-hosted Sign-In page.

After the user signs in, Okta redirects the browser to the configured sign-in redirect URI, sending user profile information to the application. Similarly, after a user signs out, Okta redirects the browser to the sign-out redirect URI.

Let's start by creating a simple HTML page that allows the user to log in. This page will display a sign-in button for signed-out users and a sign-out button for logged-in users, along with profile information.

1. Add the /login route to your app.py file. This endpoint serves as the entry point for the authentication flow. It constructs the authorization redirect URI and sends the user's browser to the Okta-hosted Sign-In page to begin the OIDC process.

   ```python
   @app.route('/login')
   def login():
       redirect_uri = url_for('authorization_code_callback', _external=True)
       return oauth.okta.authorize_redirect(redirect_uri)
   ```

2. Next, implement the callback handler for the Redirect URI you configured in your Okta application (http://localhost:5000/authorization-code/callback). This handler is crucial as it processes the authorization\_code returned by Okta after a successful sign-in. It performs the code-for-token exchange to get an access token and ID token, then stores the userinfo response alongside the tokens in the session.

   ```python
   @app.route('/authorization-code/callback')
   def authorization_code_callback():
       token = oauth.okta.authorize_access_token()
       session['loggedInUser'] = token['userinfo']
       session['token'] = token

       return redirect('/')
   ```

3. Add the /logout route. This endpoint clears the local user session, signing the user out of the Flask application. It then constructs a redirect URL to Okta's logout\_endpoint, which terminates the user's session with Okta, ensuring a complete and secure sign-out.

   ```python
   @app.route('/logout')
   def logout():
       token = session.get('token')

       id_token_hint = None
       if token:
           id_token_hint = token.get('id_token')

       conf = oauth.okta.server_metadata
       logout_endpoint = conf.get('end_session_endpoint')

       session.pop('loggedInUser', None)
       session.pop('token', None)

       if logout_endpoint:
           logout_url = (
               f'{logout_endpoint}?'
               f'id_token_hint={id_token_hint}&'
               f'post_logout_redirect_uri={url_for("index", _external=True)}'
           )
           return redirect(logout_url)

       return redirect('/')
   ```

4. Finally, update the root route (/). This route now checks the session for a signed-in user and passes that information to the template.

   ```python
   @app.route("/")
   def index():
       loggedInUser = session.get('loggedInUser')
       return render_template('index.html', user=loggedInUser)
   ```

With the back-end routes in place, you can now create the front-end files to provide a user interface for signing in, signing out, and displaying profile data.

Step 1: Create a templates directory in your project root. Inside it, create an index.html file. This page will display a Login button for signed-out users and, for signed-in users, profile information with a Logout button.

{% raw %}
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Home</title>
    <link rel="stylesheet" href="{{ url_for('static', filename='css/index.css') }}" />
  </head>
  <body>
    <div class="wrapper">
      <nav class="main-nav" role="navigation" aria-label="Primary navigation">
        <div class="nav-left">
          <a href="/">Flask Web App</a>
        </div>
        <div class="nav-right">
          {% if user %}
          <a href="/fetch-users">Fetch Users</a>
          <a href="/logout">Logout</a>
          {% else %}
          <a href="/login">Login</a>
          {% endif %}
        </div>
      </nav>

      <main class="container">
        {% if user %}
        <section aria-label="User welcome" class="user-info">
          <h1>Welcome, {{ user.name or user.preferred_username or 'User' }}!</h1>
          <p>You have successfully logged in. You can now fetch and view user details.</p>
          <p>Click the button below to load the list of users.</p>
          <button onclick="location.href='/fetch-users'">Fetch Users</button>
        </section>

        {% else %}
        <section aria-label="Login prompt" class="user-info">
          <h1>Welcome to the Flask Web App</h1>
          <p>If you are seeing this, you are not logged in yet.</p>
          <p>This app uses OpenID Connect (OIDC) for secure login. After logging in, you will be able to access user-specific data.</p>
          <p>Click the login button below to get started.</p>
          <a href="/login" class="button-link">Login / Register</a>
        </section>
        {% endif %}
      </main>
    </div>
  </body>
</html>
```
{% endraw %}

Step 2: For styling, create a static/css directory in your project root. Inside it, create index.css and add the following code.

```css
body,
html {
  height: 100%;
  margin: 0;
  padding: 0;
  font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
  line-height: 1.5;
  overflow-y: hidden;
}

nav.main-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background-color: #2f2f2f;
  color: #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  z-index: 1000;
}

nav.main-nav a {
  color: #f0f0f0;
  text-decoration: none;
  margin-left: 1.5rem;
  font-weight: 600;
}

nav.main-nav a:hover {
  color: #bfbfbf;
  text-decoration: underline;
}

.wrapper {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  max-width: 1000px;
  margin: 0 auto;
  padding: 5rem 2rem 0;
}

main.container {
  flex: 1 1 auto;
  padding: 2rem 0;
  display: flex;
  flex-direction: column;
}

section.user-info {
  background: transparent;
  padding: 1.5rem 0;
  margin-bottom: 2rem;
  color: #222222;
}

button,
a.button-link {
  background-color: #1a73e8;
  color: #fff;
  border: none;
  padding: 0.6rem 1.3rem;
  border-radius: 5px;
  cursor: pointer;
  font-size: 1rem;
  text-decoration: none;
  display: inline-block;
  margin-top: 1rem;
  font-weight: 600;
}

button:hover,
a.button-link:hover {
  background-color: #155ab6;
  color: #fff;
}
```

### Run the Flask OAuth web app

You're ready to test the sign-in and sign-out functionality.

* Start the application with the Flask server.

```bash
flask run
```

* Open a new terminal window and start the resource server.

```bash
flask --app resource-server.py run --port 5001
```

* Open a browser and go to http://localhost:5000.  
* Click Login. The browser redirects you to the Okta Sign-In Widget.  
* After you sign in, Okta redirects you back to your application, and the page displays the signed-in user's details.  

{% img blog/flask-oauth-web-app/flask-app-after-login.png alt:"Flask web app home page showing a welcome message after successful login with a Fetch Users button" width:"800" %}{: .center-image }

* Click Logout. The browser clears your session and returns you to the home page.

You've successfully added a secure authentication flow to your Flask app. Next, you'll extend it to call a protected API using scoped tokens.

## Call a protected API with scoped tokens

Using OAuth 2.0 for API authentication is a modern security best practice. It allows you to use access tokens to interact with APIs to fetch and manage data securely. This section walks you through how to use a scoped access token to fetch data from your own resource server.

Every action on an endpoint that supports OAuth 2.0 requires a specific scope. In this example, your endpoint requires the specific scope `api:read-users` to return a list of sample users.

To include this scope in the tokens minted from Okta, follow these steps:

* In your Okta Admin Console, navigate to Security \> API.  
* Select your Authorization Server and go to the Scopes Tab  
* Click the Add Scope button and enter api:read-users in the name field.  
* Optionally, enter the description and the Display Phrase  
* Click Create. 

Now, when this scope is requested, Okta will include it in the tokens it issues.

Before creating the resource server, add an extra layer of security. You want your endpoint only to consume tokens intended for your server, preventing tokens issued for other services from being replayed or misused.

To do this, restrict the `aud` claim that Okta returns in the access token to your resource server. To achieve this:

* In your Okta Admin Console, navigate to Security \> API.  
* Select your Authorization Server. In the Settings tab, click Edit  
* Change the Audience field to [http://localhost:5001](http://localhost:5001) — this is where your resource server will be hosted

### Build a custom resource server

To keep things simple, you'll create a minimal resource server with a single route called \`fetch-users\` that returns a list of sample users.

1. Start by modifying the \`.env\` file. Add the variable that stores the domain of your resource server (in this case, http://localhost:5001):

   ```bash
   OKTA_CLIENT_ID={yourClientId}
   OKTA_CLIENT_SECRET={yourClientSecret}
   OKTA_BASE_URL=https://{yourOktaDomain}
   RESOURCE_SERVER_BASE_URL=http://localhost:5001
   ```

2. Now, modify the `config.py` file to include the resource server URL and the list of sample users. Replace the existing code with the following:

   ```python
   import os

   OKTA_CLIENT_ID = os.getenv('OKTA_CLIENT_ID')
   OKTA_CLIENT_SECRET = os.getenv('OKTA_CLIENT_SECRET')
   OKTA_BASE_URL = os.getenv("OKTA_BASE_URL")
   OKTA_METADATA_URL = f"{OKTA_BASE_URL}/.well-known/openid-configuration"
   RESOURCE_SERVER_BASE_URL = os.getenv("RESOURCE_SERVER_BASE_URL")

   SAMPLE_USERS = [
       {
           "id": 1,
           "name": "Alice Johnson",
           "firstName": "Alice",
           "lastName": "Johnson",
           "email": "alice.johnson@example.com"
       },
       {
           "id": 2,
           "name": "Bob Smith",
           "firstName": "Bob",
           "lastName": "Smith",
           "email": "bob.smith@example.com"
       },
       {
           "id": 3,
           "name": "Charlie Brown",
           "firstName": "Charlie",
           "lastName": "Brown",
           "email": "charlie.brown@example.com"
       }
   ]
   ```

3. Create a \`resource-server.py\` file in the project directory and add the following code:

   ```python
   from flask import Flask, request, jsonify
   from okta_jwt_verifier import BaseJWTVerifier

   app = Flask(__name__)

   app.config.from_object('config')

   ISSUER = app.config['OKTA_BASE_URL']
   CLIENT_ID = app.config['OKTA_CLIENT_ID']
   AUDIENCE = app.config['RESOURCE_SERVER_BASE_URL']
   REQUIRED_SCOPES = {"api:read-users"}

   async def verify_token():
       pass

   @app.get('/fetch-users')
   async def get_users():
       is_valid, error_response = await verify_token()

       if not is_valid:
           return error_response

       return jsonify(app.config['SAMPLE_USERS'])


   if __name__ == "__main__":
       app.run(port=5001)
   ```

   The endpoint returns sample users if the token is valid. Next, you'll add token validation.

4. Now write the logic for token validation. You'll validate the token's issuer, audience, and client ID against your authorization server URL, resource server domain, and client ID. You'll also verify that the `api:read-users` scope is present in the token's `scp` claim.

   Start with the \`verify\_token\` function. First, check if the Authorization header is of type Bearer:

   ```python
   auth_header = request.headers.get("Authorization")

   if not auth_header:
       return None, (jsonify({"error": "No token provided"}), 401)

   parts = auth_header.split()
   if parts[0].lower() != "bearer" or len(parts) != 2:
       return None, (jsonify({"error": "Authorization header must be Bearer token"}), 401)
   ```

   Next, use Okta's package to verify that the audience, issuer, and client ID in the token match your configuration:

   ```python
   token = parts[1]

   try:
       jwt_verifier = BaseJWTVerifier(issuer=ISSUER, client_id=CLIENT_ID, audience=AUDIENCE)
       await jwt_verifier.verify_access_token(token)

       return True, None
   except Exception as e:
       print(f"Token verification failed: {e}")
       return None, (jsonify({"error": "Invalid or Expired Token"}), 401)
   ```

   Now add scope validation. Extract the claims from the token and check that the custom scope \`api:read-users\` is present in the \`scp\` claim. If the token doesn't contain this scope, reject it and return an error. In the try block, before the return statement, add the following code:

   ```python
   _, claims, _, _ = jwt_verifier.parse_token(token)
   token_scopes = set(claims.get("scp", []))
   if not REQUIRED_SCOPES.issubset(token_scopes):
       return False, (jsonify({"error": "Insufficient Scope"}), 403)

   print("Token is Valid!")
   ```

   Once everything is done, your `verify_token` function should look like this:

   ```python
   async def verify_token():
       auth_header = request.headers.get("Authorization")

       if not auth_header:
           return None, (jsonify({"error": "No token provided"}), 401)

       parts = auth_header.split()
       if parts[0].lower() != "bearer" or len(parts) != 2:
           return None, (jsonify({"error": "Authorization header must be Bearer token"}), 401)

       token = parts[1]

       try:
           jwt_verifier = BaseJWTVerifier(issuer=ISSUER, client_id=CLIENT_ID, audience=AUDIENCE)
           await jwt_verifier.verify_access_token(token)

           _, claims, _, _ = jwt_verifier.parse_token(token)
           token_scopes = set(claims.get("scp", []))
           if not REQUIRED_SCOPES.issubset(token_scopes):
               return False, (jsonify({"error": "Insufficient Scope"}), 403)

           print("Token is Valid!")
           return True, None

       except Exception as e:
           print(f"Token verification failed: {e}")
           return False, (jsonify({"error": "Invalid or Expired Token"}), 401)
   ```

### Extend the Flask app to interact with the resource server

With the configuration in Okta complete, the next step is to update your Flask application to request this scope. This ensures that the access token issued to the user includes the necessary permission to call the protected endpoint.

1. In your app.py file, find the oauth.register block and add api:read-users to the scope string within the client\_kwargs dictionary.

   ```python
    oauth.register(
        # ... other parameters
        client_kwargs={
            'scope': 'openid profile email offline_access api:read-users',
            'code_challenge_method': 'S256'
        }
    )
   ```

2. Add a new route, /fetch-users, to your app.py file. This endpoint uses the stored access token from the user's session to make a secure GET request to the protected endpoint in the resource server. If successful, it passes the returned list of users to the index.html template for display.

   ```python
   @app.route('/fetch-users')
   def fetchUsers():
       token = session.get('token')
       loggedInUser= session.get('loggedInUser')

       if not (token or loggedInUser):
           return redirect(url_for('login'))

       access_token = token.get('access_token')
       
       RESOURCE_SERVER_BASE_URL = app.config['RESOURCE_SERVER_BASE_URL']

       headers = {"Authorization": f"Bearer {access_token}"}
       resp = requests.get(f"{RESOURCE_SERVER_BASE_URL}/fetch-users", headers=headers)

       if resp.ok:
           data = resp.json()
           return render_template('index.html', user=loggedInUser, userList=data)

       else:
           return f"API request failed: {resp.status_code} {resp.text}", resp.status_code
   ```

3. Update the root route (/) to initialize the userList variable in the template. This prevents errors when the page first loads before any data is fetched. Replace the existing index function with the following code.

   ```python
    @app.route("/")
    def index():
        loggedInUser = session.get('loggedInUser')
        return render_template('index.html', user=loggedInUser, userList=None)
   ```

### Update the Flask UI to display protected data

Now, let's modify the front end to add a button that triggers the API call and a table to display the returned user data.

Step 1: Open the templates/index.html file and replace its entire contents with the updated code below. This version adds a Fetch Users button for signed-in users and a table to display the user list when available.

{% raw %}
```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Home</title>
    <link rel="stylesheet" href="{{ url_for('static', filename='css/index.css') }}" />
  </head>
  <body>
    <div class="wrapper">
      <nav class="main-nav" role="navigation" aria-label="Primary navigation">
        <div class="nav-left">
          <a href="/">Flask Web App</a>
        </div>
        <div class="nav-right">
          {% if user %}
          <a href="/fetch-users">Fetch Users</a>
          <a href="/logout">Logout</a>
          {% else %}
          <a href="/login">Login</a>
          {% endif %}
        </div>
      </nav>

      <main class="container">
        {% if user %}
        <section aria-label="User welcome" class="user-info">
          <h1>Welcome, {{ user.name or 'User' }}!</h1>
          <p>You have successfully logged in. You can now fetch and view user details.</p>
          <p>Click the button below to load the list of users.</p>
          <button onclick="location.href='/fetch-users'">Fetch Users</button>
        </section>

        {% if userList %}
        <section aria-label="Users table">
          <h2>Users List</h2>
          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>First Name</th>
                  <th>Last Name</th>
                </tr>
              </thead>
            </table>
            <div class="table-body-scroll">
              <table>
                <tbody>
                  {% for user in userList %}
                  <tr>
                    <td>{{ user.email }}</td>
                    <td>{{ user.firstName }}</td>
                    <td>{{ user.lastName }}</td>
                  </tr>
                  {% endfor %}
                </tbody>
              </table>
            </div>
          </div>
        </section>
        {% endif %} {% else %}
        <section aria-label="Login prompt" class="user-info">
          <h1>Welcome to the Flask Web App</h1>
          <p>If you are seeing this, you are not logged in yet.</p>
          <p>This app uses OpenID Connect (OIDC) for secure login. After logging in, you will be able to access user-specific data.</p>
          <p>Click the login button below to get started.</p>
          <a href="/login" class="button-link">Login / Register</a>
        </section>
        {% endif %}
      </main>
    </div>
  </body>
</html>
```
{% endraw %}

Step 2: To style the new user table, open the static/css/index.css file and add the following CSS to the end of the file.

```css
.table-body-scroll {
    max-height: 300px;
    overflow-y: auto;
    border-radius: 8px;
    border: 1px solid #d1d9e6;
    box-shadow: 0 0 6px rgba(0, 0, 0, 0.05);
  }
 
  table {
    border-collapse: collapse;
    width: 100%;
    background-color: #fff;
    color: #2c3e50;
    border-radius: 8px 8px 0 0;
    table-layout: fixed;
  }
 
  thead th {
    text-align: center;
    background-color: #e9f0fb;
    color: #1a3c72;
    font-weight: 700;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid #d1d9e6;
    position: sticky;
    top: 0;
    z-index: 1;
  }
 
  td {
    text-align: center;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid #e2e8f0;
    font-size: 1rem;
    word-wrap: break-word;
  }
```

### Test the protected API integration

Ready to see it all work? Make sure both servers are running: the Flask app (`flask run`) and the resource server (`flask --app resource-server.py run --port 5001`). Open a browser, go to http://localhost:5000, sign in, and then click Fetch Users. A table should appear with a list of sample users returned from your resource server. If you see the user data, your integration is a success\!

{% img blog/flask-oauth-web-app/flask-app-fetch-users.jpg alt:"Flask web app displaying a users table with email, first name, and last name columns after successfully fetching data from the protected API" width:"800" %}{: .center-image }

Your Flask application now has secure user authentication and can use an access token to interact with a protected API.

## Learn more

If you'd like to learn more about the concepts covered in this tutorial, explore these official Okta resources:

* [Sign users in to your web app](/docs/guides/sign-into-web-app-redirect/python/main/)  
* [Authorization Code flow with PKCE](/docs/guides/implement-grant-type/authcodepkce/main/)  
* [Self-Service Registration](https://help.okta.com/oie/en-us/content/topics/identity-engine/policies/about-ssr.htm)  
* [Validate Access Tokens](/docs/guides/validate-access-tokens/python/main/)  
* [Create an Authorization Server](/docs/guides/customize-authz-server/main/)  
* [Secure a Node Express App with OAuth 2.0 and PKCE]({% post_url 2025-07-28-express-oauth-pkce %})

Remember to follow us on [X](https://x.com/oktadev) and subscribe to our [YouTube channel](https://www.youtube.com/c/OktaDev/) for more exciting content. We also want to hear from you about the topics you'd like to see and any questions you may have. Leave us a comment below!

