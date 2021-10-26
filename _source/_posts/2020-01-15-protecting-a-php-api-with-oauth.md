---
layout: blog_post
title: "Protecting a PHP API Using OAuth"
author: krasimir-hristozov
by: contractor
communities: [php]
description: "In this tutorial, you'll learn how to build a simple API in PHP from scratch and integrate it with Okta to provide user authentication."
tags: [php, oauth, api]
tweets:
- "Wondering what's the difference between local and remote access token validation? Check out this post!"
- "In this post we build a PHP API protected by OAuth, demonstrating local vs remote access token validation!"
image: blog/featured/okta-php-bottle-headphones-close.jpg
type: conversion
---

REST APIs are a big part of today's Internet. Some of the everyday use cases of REST APIs are:

* driving the backend of single-page Web applications/mobile applications
* integrating different applications to exchange data and automate workflows
* providing the communication channel for the different parts of a complex service-oriented architecture
* connecting IoT devices.

REST API security is essential because an API can expose powerful, mission-critical, and outright dangerous functionality over the Internet. For example, a fintech SaaS application might offer an API that allows you to manipulate your bank accounts, make payments, transfer funds abroad, or download sensitive information like your bank statements, personal address/name/SSN.

Most Web application frameworks provide tools to build secure REST APIs quickly using industry-standard solutions like JSON Web Tokens (JWT) and OAuth 2.0. However, it pays to understand what goes under the hood and how to authenticate and authorize your API users securely. In this tutorial, I'll walk you through building a simple API in PHP from scratch and integrating it with [Okta](https://developer.okta.com/product/user-management/) to provide user authentication. Okta is an API service that allows you to create, edit, and securely store user accounts and user account data, and connect them with one or more applications.

The tutorial will not rely on any external libraries to implement the Okta integration or to work with the JWT access tokens. The only prerequisites are PHP, Composer, and a [free Okta developer account](https://developer.okta.com/signup/).

## Create the REST API Skeleton

Start by creating a blank project with a `/src` directory and a `composer.json` file on the top level:

```
/src
composer.json
```

In the `composer.json` file, define one dependency (the DotEnv library so you can keep the Okta authentication details in a `.env` file that's ignored by Git). In addition to the dependency, define a PSR-4 autoloader to automatically look for PHP classes in the `/src` directory of the project:

`composer.json`

```
{
    "require": {
        "vlucas/phpdotenv": "^2.4"
    },
    "autoload": {
        "psr-4": {
            "Src\\": "src/"
        }
    }
}
```

Install the dependencies:

```bash
composer install
```

This will create a `/vendor` directory and install DotEnv inside it.

Create a `.gitignore` file on the top level so the `/vendor` directory and the local `.env` file will be ignored:

`.gitgignore`

```
vendor/
.env
```

Create a `.env.example` file for the Okta authentication variables:

```
OKTA_CLIENT_ID=
OKTA_CLIENT_SECRET=
OKTA_AUDIENCE=api://default
OKTA_ISSUER=
OKTA_SCOPE=
OKTA_SERVICE_APP_ID=
OKTA_SERVICE_APP_SECRET=
```

There are two sets of credentials - one for the Service application (the REST API), and one for the Client application which will make use of the API. Some of the variables will be shared between the two applications (the Issuer, Scope, and Audience).

Create a `bootstrap.php` file which loads the environment variables (later it will also do some additional bootstrapping for our project):

```php
<?php
require 'vendor/autoload.php';
use Dotenv\Dotenv;

$dotenv = new DotEnv(__DIR__);
$dotenv->load();

// test that the variables are loaded:
echo getenv('OKTA_AUDIENCE');
```

Copy the `.env.example` file to `.env` and test the bootstrap code to confirm it outputs 'api://default':

```bash
cp .env.example .env
php bootstrap.php
```
## Implement the Initial REST API Version
The REST API will have 3 public endpoints:

```
// return all customers
GET /customers

// create a new customer
POST /customers

// charge a customer
POST /customers/{id}/charges
```

The initial version will not require any authentication/authorization.

Create a `public` directory and a `public/index.php` file to serve as a front controller and process the incoming HTTP requests:

```php
<?php
require "../bootstrap.php";

// send some CORS headers so the API can be called from anywhere
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: OPTIONS,GET,POST,PUT,DELETE");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$requestMethod = $_SERVER["REQUEST_METHOD"];
$uriParts = explode( '/', $uri );

// define all valid endpoints - this will act as a simple router
$routes = [
    'customers' => [
        'method' => 'GET',
        'expression' => '/^\/customers\/?$/',
        'controller_method' => 'index'
    ],
    'customers.create' => [
        'method' => 'POST',
        'expression' => '/^\/customers\/?$/',
        'controller_method' => 'store'
    ],
    'customers.charge' => [
        'method' => 'POST',
        'expression' => '/^\/customers\/(\d+)\/charges\/?$/',
        'controller_method' => 'charge'
    ]
];

$routeFound = null;
foreach ($routes as $route) {
    if ($route['method'] == $requestMethod &&
        preg_match($route['expression'], $uri))
    {
        $routeFound = $route;
        break;
    }
}

if (! $routeFound) {
    header("HTTP/1.1 404 Not Found");
    exit();
}

var_dump($routeFound);
```

Modify the `bootstrap.php` file so it doesn't output anything:

```php
<?php
require 'vendor/autoload.php';
use Dotenv\Dotenv;

$dotenv = new DotEnv(__DIR__);
$dotenv->load();
```

Start the built-in PHP server and test the front controller:

```bash
php -S 127.0.0.1:8000 -t public
```

Load `http://127.0.0.1:8000` and you should see a 404 Not Found response. However, if you load the valid GET route: `http://127.0.0.1:8000/customers`, you will see the found route data:

```
array(3) {
  ["method"]=>
  string(3) "GET"
  ["expression"]=>
  string(18) "/^\/customers\/?$/"
  ["controller_method"]=>
  string(5) "index"
}
```

You will need a tool like Postman to test the full API including the POST requests. Note: when making POST requests, make sure to set the content type to JSON (`application/json`), the Body type to raw, and paste the payload in JSON format.

Use Postman to confirm that the three correct routes are displayed and all other URLs result in a 404 Not Found response before proceeding further.

Create a `src/Controllers/CustomerController.php` file to serve as a controller for the API endpoints. Since the actual API implementation is not the topic of this article, the controller methods won't do anything useful - certainly, there will be no data validation or any database models to manipulate.

```php
<?php
namespace Src\Controllers;

class CustomerController
{
    // list all customers - fake data
    public function index($uri)
    {
        $customers = [
            [
                'name'    => 'Tester',
                'balance' => 120.00
            ],
            [
                'name'    => 'Another Tester',
                'balance' => 100.00
            ]
        ];

        $this->respondOK($customers);
    }

    // create a new customer - fake data
    public function store($uri)
    {
        $customer = [
            'name'    => 'Still A Tester',
            'balance' => 0.00
        ];

        $this->respondCreated($customer);
    }

    // charge a customer - fake data
    public function charge($uri)
    {
        $customerId = $uri[2];

        $data = [
            'customer_id' => (int) $customerId,
            'charge'      => 1.99
        ];

        $this->respondCreated($data);
    }

    private function respondOK($data)
    {
        header('HTTP/1.1 200 OK');
        echo json_encode($data);
    }

    private function respondCreated($data)
    {
        header('HTTP/1.1 201 Created');
        echo json_encode($data);
    }
}
```

Modify `public/index.php` to delegate to the controller methods to handle the endpoint routes:

```php

// add at the top, after the require('bootstrap.php' call):
use Src\Controllers\CustomerController;

// ...

// replace var_dump($routeFound) at the end of the file with this:
$methodName = $route['controller_method'];

$controller = new CustomerController();
$controller->$methodName($uriParts);
```

Test the route endpoints in Postman again and confirm they generate the expected JSON responses.

## Using Okta and OAuth 2.0 to Secure the API

The API will use Okta as the authorization server. You'll implement the Client Credentials Flow in this exercise. This flow is recommended for machine-to-machine authentication when the client is private and can hold a secret. 

For simplicity in this article, both the client and server applications will be stored in the same repository and will share parts of the Okta configuration.

The authorization process works like this:

- The client application holds a Client ID and a Secret.
- The client sends these credentials to Okta and receives back an access token.
- The client provides the access token to the REST API server with each request.
- The server verifies and validates the Okta token.
- If the token is valid, the server provides the API resource.
- If the token is missing, invalid or expired, the server responds with a 401 Unauthorized response.

There are two ways to verify the token: 

- Locally using a JSON Web Key (JWK) provided by Okta. The application can cache the Web key to speed up the validation process and perform it without any external HTTP requests.
- Remotely by Okta. This is slower (as it requires an additional HTTP request) but more secure, as it provides a real-time response if the token is still active or not.

The API will use the local method to authorize the `index()` and `store()` methods, but it will use the more secure remote method to authorize the `charge()` method because this method requires the highest level of security, even at the expense of some small performance loss. 

When using the local verification, it's possible that the user could be suspended at Okta but the token would still be considered valid by the API server because it does not check the user status in real-time - it only verifies the validity of the provided token.

## Setting Up Okta

Log into your Okta account or [create a new one for free](https://developer.okta.com/signup/), create your authorization server and set up your client application.

Log in to your developer console, navigate to **API**, then to the **Authorization Servers** tab:
  
{% img blog/php-api-oauth/authorization-servers.png alt:"List of authorization servers" width:"100%" %}{: .center-image }

Click on the link to your default server. Copy the `Issuer URI` field from this Settings tab and add it to the `.env` file (replace the URL with your own):

```bash
OKTA_ISSUER=https://{yourOktaDomain}/oauth2/default
```

Click the **Edit icon**, go to the **Scopes** tab and click **Add Scope** to add a scope for the REST API:
  
{% img blog/php-api-oauth/edit-scope.png alt:"Edit scope dialog" width:"100%" %}{: .center-image }

Name it `customer_api` and leave the rest of the settings as they are.

Add the scope to the `.env` file as well:

```bash
OKTA_SCOPE=customer_api
```

Create a Client Application next. Go to **Applications**, click **Add Application**, select **Service**, then click **Next**:
  
{% img blog/php-api-oauth/app-client-id-secret.png alt:"Customer manager application with client ID and secret" width:"100%" %}{: .center-image }

Title the service **Customer Manager** and click **Done**. Copy the **Client ID** and **Client Secret** from the screen, and put them in the `.env` file as well:

{%raw%}
```bash
OKTA_CLIENT_ID={{YOUR CLIENT ID}}
OKTA_CLIENT_SECRET={{YOUR CLIENT SECRET}}
```
{%endraw%}

Finally, create another client application (Service Application) to represent the API, because the API doesn't have access to the client app credentials, but it would need client credentials to authorize itself when accessing some of the Okta endpoints.

Go to **Applications**, click **Add Application**, select **Service**, then click **Next**. Title the service **Customer Manager API** and click **Done**:

{% img blog/php-api-oauth/api-client-id-secret.png alt:"Customer manager API application with client ID and secret" width:"100%" %}{: .center-image }

Copy the **Client ID** and **Client Secret** from the screen and put them in the `.env` file as well:

{%raw%}
```bash
OKTA_SERVICE_APP_ID={{YOUR CLIENT ID}}
OKTA_SERVICE_APP_SECRET={{YOUR CLIENT SECRET}}
```
{%endraw%}

## Obtain an Access Token from Okta

Create a new `client` directory in the project to store the client application files. Create a `client\get-token.php` file:

```php
<?php
require __DIR__."/../bootstrap.php";

$clientId     = getenv('OKTA_CLIENT_ID');
$clientSecret = getenv('OKTA_CLIENT_SECRET');
$scope        = getenv('OKTA_SCOPE');
$issuer       = getenv('OKTA_ISSUER');

// obtain an access token
$token = obtainToken($issuer, $clientId, $clientSecret, $scope);

echo $token;

function obtainToken($issuer, $clientId, $clientSecret, $scope)
{
    // prepare the request
    $uri = $issuer . '/v1/token';
    $token = base64_encode("$clientId:$clientSecret");
    $payload = http_build_query([
        'grant_type' => 'client_credentials',
        'scope'      => $scope
    ]);

    // build the curl request
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $uri);
    curl_setopt( $ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/x-www-form-urlencoded',
        "Authorization: Basic $token"
    ]);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

    // process and return the response
    $response = curl_exec($ch);
    $response = json_decode($response, true);
    if (! isset($response['access_token'])
        || ! isset($response['token_type'])) {
        exit('failed, exiting.');
    }

    // here's your token to use in API requests
    return $response['access_token'];
}
```

Call the file from the command line and copy the token:

```bash
php client/get-token.php
```

The token should look something like this:

```
eyJraWQiOiI0M0tQRUpGaWQtSHNyc1hXZjRab01TOHFKcmM5VEZSWmdoc3VxVGJkQ3pnIiwiYWxnIjoiUlMyNTYifQ.eyJ2ZXIiOjEsImp0aSI6IkFULmI4WlZFdE1LV2JOWGE1VUxHWlc3cm5TN0lpVHFLdWE1bThtRi1sR3dYUjAiLCJpc3MiOiJodHRwczovL2Rldi0zNTQ2ODUub2t0YXByZXZpZXcuY29tL29hdXRoMi9kZWZhdWx0IiwiYXVkIjoiYXBpOi8vZGVmYXVsdCIsImlhdCI6MTU3NTg0NTU2NywiZXhwIjoxNTc1ODQ5MTY3LCJjaWQiOiIwb2FvdGM5ZHZpWlN3S3ZBTjBoNyIsInNjcCI6WyJjdXN0b21lcl9hcGkiXSwic3ViIjoiMG9hb3RjOWR2aVpTd0t2QU4waDcifQ.XjHffXU4nOc29v_8Tb8SApAfUR_UFhWwVc0lNq6S6UEREXA0myjsftmqAQdxLyBrcYcola4X0Tc7cp-BkgPRYgJUs4yJbJxydDboLuLdYnydE6L3d1crZ0-MlK4g30SHwFZuhf71IHMWUtya9tES0o6vtDfSfkjHPcGu4NoQJXSAWCkinxHFUOYmmianb2fx4QMo9fp0g72ogeUeZ0WmRfhBJfdQm0dc5ZkekZ9x_qzgEcaVPR9Ls37e2LdRzUHng3sSLFPnidc4hRDfG7tq2G7GlDvMpzHMJhV145UceSQJWb9ZioN6kd_LBql0CW2h5B-WW-O4piBKDF08RDsxXw
```
## Add Token Authorization to the API

Update the front controller so it requires authorization for all API endpoints (using local validation for the index and store methods, and remote validation for the charge method). Here's the full code of `public/index.php` for clarity:

```php
<?php
require __DIR__"/../bootstrap.php";

use Src\Controllers\CustomerController;

// send some CORS headers so the API can be called from anywhere
header("Access-Control-Allow-Origin: *");
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: OPTIONS,GET,POST,PUT,DELETE");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$requestMethod = $_SERVER["REQUEST_METHOD"];
$uriParts = explode( '/', $uri );

// define all valid endpoints - this will act as a simple router
$routes = [
    'customers' => [
        'method' => 'GET',
        'expression' => '/^\/customers\/?$/',
        'controller_method' => 'index'
    ],
    'customers.create' => [
        'method' => 'POST',
        'expression' => '/^\/customers\/?$/',
        'controller_method' => 'store'
    ],
    'customers.charge' => [
        'method' => 'POST',
        'expression' => '/^\/customers\/(\d+)\/charges\/?$/',
        'controller_method' => 'charge'
    ]
];

$routeFound = null;
foreach ($routes as $route) {
    if ($route['method'] == $requestMethod &&
        preg_match($route['expression'], $uri))
    {
        $routeFound = $route;
        break;
    }
}

if (! $routeFound) {
    header("HTTP/1.1 404 Not Found");
    exit();
}

$methodName = $route['controller_method'];

// authenticate the request:
if (! authenticate($methodName)) {
    header("HTTP/1.1 401 Unauthorized");
    exit('Unauthorized');
}

$controller = new CustomerController();
$controller->$methodName($uriParts);

// END OF FRONT CONTROLLER
// OAuth authentication functions follow

function authenticate($methodName)
{
    // extract the token from the headers
    if (! isset($_SERVER['HTTP_AUTHORIZATION'])) {
        return false;
    }

    $authHeader = $_SERVER['HTTP_AUTHORIZATION'];
    preg_match('/Bearer\s(\S+)/', $authHeader, $matches);

    if(! isset($matches[1])) {
        return false;
    }

    $token = $matches[1];

    // validate the token
    if ($methodName == 'charge') {
        return authenticateRemotely($token);
    } else {
        return authenticateLocally($token, $tokenParts);
    }
}

function authenticateRemotely($token)
{
    $metadataUrl = getenv('OKTA_ISSUER') . '/.well-known/oauth-authorization-server';
    $metadata = http($metadataUrl);
    $introspectionUrl = $metadata['introspection_endpoint'];

    $params = [
        'token' => $token,
        'client_id' => getenv('OKTA_SERVICE_APP_ID'),
        'client_secret' => getenv('OKTA_SERVICE_APP_SECRET')
    ];

    $result = http($introspectionUrl, $params);

    if (! $result['active']) {
        return false;
    }

    return true;
}

function authenticateLocally($token, $tokenParts)
{
    $tokenParts = explode('.', $token);
    $decodedToken['header'] = json_decode(base64UrlDecode($tokenParts[0]), true);
    $decodedToken['payload'] = json_decode(base64UrlDecode($tokenParts[1]), true);
    $decodedToken['signatureProvided'] = base64UrlDecode($tokenParts[2]);

    // Get the JSON Web Keys from the server that signed the token
    // (ideally they should be cached to avoid
    // calls to Okta on each API request)...
    $metadataUrl = getenv('OKTA_ISSUER') . '/.well-known/oauth-authorization-server';
    $metadata = http($metadataUrl);
    $jwksUri = $metadata['jwks_uri'];
    $keys = http($jwksUri);

    // Find the public key matching the kid from the input token
    $publicKey = false;
    foreach($keys['keys'] as $key) {
        if($key['kid'] == $decodedToken['header']['kid']) {
            $publicKey = JWK::parseKey($key);
            break;
        }
    }    
    if (!$publicKey) {
        echo "Couldn't find public key\n";
        return false;
    }

    // Check the signing algorithm
    if ($decodedToken['header']['alg'] != 'RS256') {
        echo "Bad algorithm\n";
        return false;
    }

    $result = JWT::decode($token, $publicKey, array('RS256'));

    if (! $result) {
        echo "Error decoding JWT\n";
        return false;
    }

    // Basic JWT validation passed, now check the claims

    // Verify the Issuer matches Okta's issuer
    if ($decodedToken['payload']['iss'] != getenv('OKTA_ISSUER')) {
        echo "Issuer did not match\n";
        return false;
    }

    // Verify the audience matches the expected audience for this API
    if ($decodedToken['payload']['aud'] != getenv('OKTA_AUDIENCE')) {
        echo "Audience did not match\n";
        return false;
    }

    // Verify this token was issued to the expected client_id
    if ($decodedToken['payload']['cid'] != getenv('OKTA_CLIENT_ID')) {
        echo "Client ID did not match\n";
        return false;
    }

    return true;
}

function http($url, $params = null)
{
    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    if ($params) {
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($params));
    }
    return json_decode(curl_exec($ch), true);
}

function base64UrlDecode($input)
{
    $remainder = strlen($input) % 4;
    if ($remainder) {
        $padlen = 4 - $remainder;
        $input .= str_repeat('=', $padlen);
    }
    return base64_decode(strtr($input, '-_', '+/'));
}

function encodeLength($length)
{
    if ($length <= 0x7F) {
        return chr($length);
    }
    $temp = ltrim(pack('N', $length), chr(0));
    return pack('Ca*', 0x80 | strlen($temp), $temp);
}

function base64UrlEncode($text)
{
    return str_replace(
        ['+', '/', '='],
        ['-', '_', ''],
        base64_encode($text)
    );
}

```

There's a lot going on here but the most important parts are:

* The `authenticateRemotely()` method provides remote verification of the Token using a call to Okta's introspection endpoint. It can tell that the token is valid or invalid/expired, and it can also confirm that the Okta user is still active.
* The `authenticateLocally()` method provides local authentication of the token. You'll notice that in this example it also starts with a call to Okta to get the JSON Web Keys for verification, so it's not always faster than the remote authentication. However, in a real application, these keys would be cached locally for months, and the call to Okta to refresh them would happen quite rarely.

The local authentication verifies the following attributes of the token:

* Signature Verification
* Expiration Time (must be in the future)
* Issuer, Audience, Client ID (must match the local Okta configuration)
* Key ID
* Signing Algorithm

On the next step, you'll test the authentication using Postman.

Provide the access token as an `Authorization` header with a value `Bearer {token}` with each HTTP request to the API you make. Example value of the header:

```
Bearer eyJraWQiOiI0M0tQRUpGaWQtSHNyc1hXZjRab01TOHFKcmM5VEZSWmdoc3VxVGJkQ3pnIiwiYWxnIjoiUlMyNTYifQ.eyJ2ZXIiOjEsImp0aSI6IkFULmI4WlZFdE1LV2JOWGE1VUxHWlc3cm5TN0lpVHFLdWE1bThtRi1sR3dYUjAiLCJpc3MiOiJodHRwczovL2Rldi0zNTQ2ODUub2t0YXByZXZpZXcuY29tL29hdXRoMi9kZWZhdWx0IiwiYXVkIjoiYXBpOi8vZGVmYXVsdCIsImlhdCI6MTU3NTg0NTU2NywiZXhwIjoxNTc1ODQ5MTY3LCJjaWQiOiIwb2FvdGM5ZHZpWlN3S3ZBTjBoNyIsInNjcCI6WyJjdXN0b21lcl9hcGkiXSwic3ViIjoiMG9hb3RjOWR2aVpTd0t2QU4waDcifQ.XjHffXU4nOc29v_8Tb8SApAfUR_UFhWwVc0lNq6S6UEREXA0myjsftmqAQdxLyBrcYcola4X0Tc7cp-BkgPRYgJUs4yJbJxydDboLuLdYnydE6L3d1crZ0-MlK4g30SHwFZuhf71IHMWUtya9tES0o6vtDfSfkjHPcGu4NoQJXSAWCkinxHFUOYmmianb2fx4QMo9fp0g72ogeUeZ0WmRfhBJfdQm0dc5ZkekZ9x_qzgEcaVPR9Ls37e2LdRzUHng3sSLFPnidc4hRDfG7tq2G7GlDvMpzHMJhV145UceSQJWb9ZioN6kd_LBql0CW2h5B-WW-O4piBKDF08RDsxXw
```

Test the endpoints again in Postman. If you don't provide a valid token, you should get a `401 Unauthorized` response. If you provide a valid token, you should get the normal JSON responses.

## Revoking the Access Token

Create a new file `client/revoke-token.php`:

```php
<?php
require __DIR__."/../bootstrap.php";

$clientId     = getenv('OKTA_CLIENT_ID');
$clientSecret = getenv('OKTA_CLIENT_SECRET');

if (! isset($argv[1])) {
    exit('Please provide a token to revoke');
}

$jwt = $argv[1];

$result = revokeToken($jwt, $clientId, $clientSecret);
echo $result;
exit();

function revokeToken($jwt, $clientId, $clientSecret)
{
    $payload = http_build_query([
        'token' => $jwt,
        'client_id' => $clientId,
        'client_secret' => $clientSecret
    ]);

    $url = getenv('OKTA_ISSUER') . '/v1/revoke';

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, $payload);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

    return curl_exec($ch);
}
```

Call the tool like this (replace `<token>` with the token you want to revoke):

```bash
php client/revoke-token.php <token>
```

Example:

```bash
php client/revoke-token.php eyJraWQiOiI0M0tQRUpGaWQtSHNyc1hXZjRab01TOHFKcmM5VEZSWmdoc3VxVGJkQ3pnIiwiYWxnIjoiUlMyNTYifQ.eyJ2ZXIiOjEsImp0aSI6IkFULkxJUHQybGdIUTNFaURHQ0xCYjE4UHUxVkpnSEVpXzJvcjlyc2xuRWdHNzgiLCJpc3MiOiJodHRwczovL2Rldi0zNTQ2ODUub2t0YXByZXZpZXcuY29tL29hdXRoMi9kZWZhdWx0IiwiYXVkIjoiYXBpOi8vZGVmYXVsdCIsImlhdCI6MTU3NTg1MjYzMiwiZXhwIjoxNTc1ODU2MjMyLCJjaWQiOiIwb2FvdGM5ZHZpWlN3S3ZBTjBoNyIsInNjcCI6WyJjdXN0b21lcl9hcGkiXSwic3ViIjoiMG9hb3RjOWR2aVpTd0t2QU4waDcifQ.Nmiarr279HKhOLHnhGgMp5YTBQjPI7U6IMW3YDAem4JlN-CwgnV_eNHN2rmqPvbQ95WnmldZbQqQVOK4Uo6dcz9PxY_pInFEvxqZSm40sVBKsaAywu-tAkc02e-xMJH0P2TTVujv1CG5W7tR5tg1Re9ARavuept9IqGyK4Fqf-CXjoZryJgxX2-xxu6_-QpuPwa_ji8FmJkLTg_c3oDoXKcS9qzVdo3BiOQgCTnV9rC4ERT-0klpnJI4-xMkIqwocfmOQ0cq59IrZ1YNx-o98-lxNp2ygqfiXUgeDDcaYIkUkoNnJjkb-qeelW8MNDmpahVQTqI9m8rYtXU6gtkUSQ
```

After revoking the token, try all API calls with that token again. You will see that `GET /customers` and `POST /customers` still work (since they only do local validation), but `POST /customers/{id}/charges` returns a `401 Unauthorized` response (because the remote validation fails as the token is no longer active).

## Learn More About OAuth 2.0 Authorization in PHP

You can find the whole code example 
[on GitHub](https://github.com/oktadeveloper/php-api-oauth-sample).

If you would like to dig deeper into the topics covered in this article, the following resources are a great starting point:

* [PHP Authorization with OAuth 2.0 and Okta](/blog/2019/08/30/php-authorization-oauth-2-okta)
* [Create and Verify JWTs in PHP with OAuth 2.0](/blog/2019/02/04/create-and-verify-jwts-in-php)
* [Token Authentication in PHP](/blog/2019/05/07/php-token-authentication-jwt-oauth2-openid-connect)

Like what you learned today? Follow us on [Twitter](https://twitter.com/oktadev), like us on [Facebook](https://www.facebook.com/oktadevelopers), check us out on [LinkedIn](https://www.linkedin.com/company/oktadev/), and subscribe to our [YouTube channel](https://www.youtube.com/c/oktadev) for more awesome content!

