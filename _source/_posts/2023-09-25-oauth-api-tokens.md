---
layout: blog_post
title: "Why You Should Migrate to OAuth 2.0 From Static API Tokens"
author: alisa-duncan
by: advocate
communities: [security,.net,java,javascript,go,php,python,ruby]
description: "Improve your security posture and transition from static API tokens to OAuth 2.0. Learn why and how in this post."
tags: ["api", "oauth", "tokens"]
tweets:
- "It's time to transition from static API keys to OAuth to improve your security posture!"
image: blog/oauth-api-tokens/social.jpg
type: awareness
---

Static API tokens have long been used to call external APIs and access the resources of third parties such as software vendors. As API standards have evolved, [OAuth 2.0](https://developer.okta.com/docs/concepts/oauth-openid/) emerged as the option offering more robust security, greater flexibility, and a better developer experience. Let's explore the advantages of moving away from static tokens in favor of OAuth 2.0.

{% include toc.md %}

## Static API token landscape

In a secure software system, all calls that allow read or modify access to resources must be authorized. When you call a protected API, the API needs some way to validate authorization. Static API tokens are a way to provide authorization information to the API using a remembered value without user context. As a result, they provided a straightforward (but limited) approach for developers to grant API access to another app: Generate a token, store it once, and proceed with the task. 

If we look at an example HTTP call to Okta, a request with a static API token may look something like this:

```http
GET /api/products HTTP/1.1
Authorization: SSWS <api_token_value>
Accept: application/json
Host: dev-1234567.okta.com
```

The caller of the API (aka the client) adds the token value to the call. Depending on the vendor system called, the API may add the static token value to an HTTP header, such as `Authorization` (using a standard authorization scheme or a proprietary one such as Okta's SSWS scheme), or in a query parameter.  

## Shift from static API tokens to OAuth 2.0 for better security

As with many technologies, this ease of use comes with a corresponding increase in exposure to risk. Unlike short-lived OAuth 2.0 tokens, static tokens typically have a long life. API tokens set in query parameters are particularly dangerous. Browsers save URLs in history, and logging systems may record the entire URL, exposing the token more readily than when using HTTP headers. 

To better understand the security concerns associated with static API tokens, let's dive into some of their characteristics in detail, and compare and contrast with OAuth 2.0 as an alternative.

**Access risks when using static API tokens**

Static tokens can fall into the wrong hands, leading to unauthorized access. For example, static tokens can inadvertently get checked into source control systems, exposing the token inadvertently to repository viewers and the source control history. Since static tokens are long-lived, the risk of exposing tokens is particularly concerning as the outcome of a stolen token is impactful — a stolen static token remains active until manually inactivated or when it finally expires, allowing unauthorized access.

**Token rotation troubles**

Rotating static tokens can be a challenging task. Because token values persist within the caller's environment or software systems, timing the rotation to quickly release a token, generate a new one, and save the token while keeping production environments running can pose challenges.

**Limiting scope is difficult**

Assigning limited scopes to static tokens isn't straightforward. Static tokens usually grant access to the API called in its entirety—an all-or-nothing access level. Defining access for a limited scope, such as read access only vs. write access, and other fine-grained access control measures may not be available or difficult to manage through static API tokens.

**Inherited permissions in user-generated tokens**

User-generated access tokens usually adopt the user account permissions that generated them. If an admin generates the token, it has full access to all the resources and actions the admin can perform. To alleviate this concern, sometimes organizations set up service accounts with limited scopes to generate the token. However, doing so leads to user management overhead and potentially taking a seat within a license.

**Auditing challenges**

It's tricky to trace static token utilization. A core need for auditing is tracing a user's interaction with an API. However, static API tokens usually don't have user context, and all calls to the API use the same static token, so identifying a specific user's action with an API may be impossible.

**Static tokens are brittle**

Tokens linked to user accounts become invalid when the user exits the organization. Some organizations use service accounts to counteract this measure, which opens up access risks and management overhead.

There's a better, more secure way to access APIs that mitigate the risks associated with static API tokens: using industry-standard OAuth 2.0 flows.

## Embrace OAuth 2.0 to improve security

OAuth 2.0 caters to almost any scenario in place of static tokens like Okta's SSWS tokens. But unlike static tokens, the OAuth specs include definitions and secure practices for necessities such as token rotation, basic authorization decisions, and more for everyday use cases like

  * Automated service-to-service interaction for handling behind-the-scenes API calls without user context
  * Task-based automation through your command line operations
  * Limiting application data and actions to the user's access levels to retain authorization security

OAuth 2.0 supports each of the everyday use cases listed above through configuration properties sent in a request to a centralized authorization server. The general interaction is a multi-step process like this:

1. The caller requests an access token from the authorization server, passing in the required configuration properties for the use case. The authorization server returns a short-lived access token. The length of life for the token depends on the use case. Some use cases are inherently more secure, so the length of life can vary. The HTTP request below shows an example request to retrieve a token but doesn't include the required configuration properties. You'll see the necessary configuration properties in the upcoming examples.

  ```http
POST  /token HTTP/1.1
Host: authorization-server.com

<plus required configuration properties + credentials>
  ```

{:start="2"}
2. The caller uses the token value in the API request as a value in the `Authorization` header of the HTTP request using the `Bearer` scheme. The HTTP request may look something like this:

  ```http
GET /api/products HTTP/1.1
Authorization: Bearer <api_token_value>
Accept: application/json
Host: dev-1234567.okta.com
  ```

There's a lot to OAuth 2.0, so check out the resources at the end of this post for a deeper dive. We won't dive into all the details in this post but will tailor the information specific to the use cases mentioned and provide a high-level summary for each.

Let's look at each use case to see how OAuth 2.0 supports it.

### Service-to-service interaction

You may have backend processes that call other APIs to get data or perform actions. OAuth 2.0 supports service-to-service or machine-to-machine requests without a user context associated with the call with an authorization flow called **Client Credentials**.

**Advantages in using client credentials over API tokens**

Using OAuth 2.0 for service-to-service interaction has huge advantages over static API keys, especially regarding access levels called scopes. In OAuth 2.0, you identify the scopes your access token gets as part of the configuration properties in a call to retrieve your token. You'll want to ensure the API you're calling supports scope-based access and that you've granted access to the scopes you need. For example, Okta APIs have defined multiple scopes for resource APIs, such as `okta.users.read` and `okta.users.write`. You can grant access to one or both of those scopes.

Client credentials flow is not the same as using service accounts for the API authorization. OAuth 2.0 supports machine-to-machine interaction in a standard format without taking up a user seat to emulate an automation user. Notice when you define scopes, you'll do so in the configuration of the service application and within the authorization server, not at a user level. The advantage is you control resource access for the entire service application, not via a user within the application. You no longer have concerns about managing service accounts and can have confidence that the application cannot access more scopes than you've allowed.   

**Retrieve an access token using client credentials**

To retrieve an access token for this flow, you'll send properties specifying the type of authorization flow, the credentials, and the scopes the access token has. The OAuth 2.0 term for defining the authorization flow is called a `grant_type`; for the client credentials flow, you'll pass in the value `client_credentials`. 

The credentials can either be a cryptographically secure JSON Web Token (JWT) signed with the client's private key or a secret value generated from your authorization server.  A private key JWT is more secure, as you won't risk exposing the secret value that accidentally creates similar access concerns as a static API token. You'll generate a public/private key pair and register the public key in a JSON Web Key Set (JWKS) or upload it to the authorization server so that the authorization server has the public key to validate the JWT signature. Read more about this process in [Implement OAuth for Okta with a service app](​​https://developer.okta.com/docs/guides/implement-oauth-for-okta-serviceapp/-/main/#get-an-access-token) documentation.

An example HTTP call to retrieve the access token may look like this:

```http
POST  /token HTTP/1.1
Content-Type: application/x-www-form-urlencoded
Accept: application/json
Host: authorization-server.com

grant_type=client_credentials
&scope=okta.users.read
&client_assertion_type=urn:ietf:params:oauth:client-assertion-type:jwt-bearer
&client_assertion=<generated_jwt>
```

Once you get the access token, you'll add it to the API calls as a header: `Authorization: Bearer access_token`.

Read more about service-to-service API calls using .NET and creating private JWTs in Python in [Secure Your .NET 6 Web API](/blog/2022/04/20/dotnet-6-web-api) and [Set Up the Private Key JWT Flow in Three Python Commands](/blog/2021/11/15/private-key-jwt-python).

### Task-based automation

Command line terminals, like Bash and PowerShell, are browserless processes to run individual commands or scripts within your terminal window. Unlike the previous service-to-service interaction, this flow involves user context. You want to run the command line operations with your authorization context, which means you'll only have access to the API resources you're supposed to have. OAuth 2.0 supports this use case with a flow called **Device Flow**. 

Obtaining access tokens is a multi-step process with this flow. Before requesting the access token directly like the service-to-service use case, you first obtain unique verification codes by sending the client ID to a special endpoint on your authorization server:

```http
POST  /device/authorize HTTP/1.1
Content-Type: application/x-www-form-urlencoded
Host: authorization-server.com 

client_id=<client_ID>
```

The response from the `/device/authorize` call returns two unique codes - a device code and a user code - and a verification URI. Confirm the authorization request by navigating to the verification URI in your browser and entering the user code. 

To retrieve the access token, you add the `grant_type` property to specify the OAuth 2.0 flow for the use case and the device code as configuration properties in the call:

```http
POST  /token HTTP/1.1
Content-Type: application/x-www-form-urlencoded
Host: authorization-server.com

client_id=<client_ID>
&grant_type=urn:ietf:params:oauth:grant-type:device_code
&device_code=device_code
```

Use the access token from the response in the `Authorization: Bearer access_token` header.

You can read more about Device Code flow for command lines in [Authenticate from the Command Line with Java](/blog/2022/04/11/java-cli-device-grant).

### User access through a web application

The last use case ensures the user's authorization applies to API access when using a web application. OAuth 2.0 supports limiting an application's actions to a subset of what the user can do and the data they see. In this flow, you have the user context to apply for resource authorization, plus having the user context makes auditing and tracing calls by individual users more straightforward. The OAuth 2.0 flow for this use case combines a standard flow, **Authorization Code** flow, and an extension for an extra layer of security called **Proof Key for Code Exchange** (PKCE).

Authorization Code flow with PKCE requires multiple steps to retrieve an access token and involves user interaction through consent and verification, which allows multi-factor authentication. In this flow, you'll redirect the user to an authorization server for the authorization code before requesting an access token. 

The redirect URL includes request-specific properties so they can complete signing in, including specifying the type of request using a `response_type` property and the client ID, among other properties.

```
https://<identity_provider_uri>/authorize?response_type=code&client_id=<client_ID>&+remaining props
```

When the user successfully finishes signing in, the identity provider redirects back to the application with an authorization code in the authorization response. To retrieve the access token, you pass in the grant type for this flow, the authorization code, and other request-specific metadata.

```http
POST  /token HTTP/1.1
Host: authorization-server.com

grant_type=code
&code=<code_response>
&client_id=<client_ID>
```

With the access token in hand, the web app adds the access token to outgoing API calls in the `Authorization: Bearer access_token` header.

Read more about the authorization code flow in [How Authentication and Authorization Work for SPAs](/blog/2023/04/04/spa-auth-tokens) and [Use PKCE with OAuth 2.0 and Spring Boot for Better Security](/blog/2020/01/23/pkce-oauth2-spring-boot).

## Phase out static API tokens and use OAuth 2.0

Software migrations take time and planning, and having a good game plan helps. Consider transitioning to OAuth 2.0 in small, incremental steps.

The first step in migrating from static API tokens is ensuring the APIs you use support OAuth 2.0. Check with your vendor if you're calling third-party APIs. If your API is internal, you'll want to add OAuth support. Once you verify the APIs you're calling support OAuth, you'll need the client ID for the OAuth application and enable access measures such as scopes.

By signing in to your Okta Admin Console as an administrator, you can determine whether you use static API tokens in an Okta environment. In the sidebar, navigate to **Security** > **API** and select the **Tokens** tab to see all the tokens created for the Okta organization. This view gives insight into the API token usage, use cases, and access level (for example, a Super Admin-created token has full access). You'll want to assess each and convert them to use OAuth.

Let's focus on the use case of an automated service-to-service call. Incorporating OAuth 2.0 within your APIs all in one shot is daunting, so let's examine how to achieve this incrementally. Before making any code changes, you can try the steps locally by hand and use your favorite HTTP client to request a token and call an API using OAuth 2.0. This case uses Client Credentials flow with a private key JWT. The steps are:

1. Generate the public/private key pair
2. Use the public/private key pair to generate the private key JWT
3. Request the access token
4. Add the access token to your API request
5. Incorporate OAuth into your application system

**1. Generate the public/private key pair**

You can generate a public/private key pair [following these instructions](https://developer.okta.com/docs/guides/implement-oauth-for-okta-serviceapp/-/main/#generate-the-jwk-using-the-api). Okta's Admin Console can [generate a public/private key pair for testing purposes](https://developer.okta.com/docs/guides/implement-oauth-for-okta-serviceapp/-/main/#generate-the-jwk-using-the-api) if you don't want to generate it yourself.

**2. Generate the private key JWT**

Use the public/private key pair to create the private key JWT by following the instructions in the [Implement OAuth for Okta with a service app](​​https://developer.okta.com/docs/guides/implement-oauth-for-okta-serviceapp/-/main/#get-an-access-token) documentation. It's more important at this step to understand how this all works over automating the steps so you can store the public/private key pair locally, use tools installed on your machine, and paste the JWKS containing your public key into [a test JWT generator website](https://www.jsonwebtoken.dev/) for now. 

**3. Request the access token**

Request the access token using your private key JWT without adding any scopes by [making the HTTP request in your favorite HTTP client](https://developer.okta.com/docs/guides/implement-oauth-for-okta-serviceapp/-/main/#create-and-sign-the-jwt). You should get an error when using the access token without the proper scope, but testing for errors and happy paths is good. The access token expires at some point, and you'll see the expiration in the access token response. The access token is part of the response. You'll use the entire string as the access token.

**4. Add the access token to your API request**

Using your HTTP client, call your API using the access token. You'll add an Authorization header and use the Bearer scheme, so your API call has the following header matching the format shown below:

```
Authorization: Bearer <access_token>
```

When you make the API call, you should get back an HTTP status 403 error. Yay! Success? Well, yes, a successful error case test. Now you know what error to expect if there's an error in configuring scopes. Let's add the scopes to the access token request and try this again.

This time, request your access token using the private key JWT and add the scopes for the API call. Use the access token in the API call. The moment of truth! You should see a successful response. You know there's a configuration error if you get a 403 error again. If this happens, double-check the request scopes and that the OAuth 2.0 application has the scopes you're requesting enabled.

**5. Add OAuth 2.0 authorization within your system**

Now that you've successfully stepped through OAuth 2.0 authorization for a server-to-service call manually, you can bring aspects of these steps into your system. In a development or test environment, try using the access token. You'll want to change your APIs to use the Authorization header with Bearer scheme format and replace your existing static API token with the manually generated access token to ensure your API calls work without automating the steps to request the access token.

When you feel confident that your API system handles the access token successfully, it's time to add the steps to request it from within your code. Your tech stack may have SDKs to assist with at least part (or all) of the request steps. [Okta's Management SDKs](https://developer.okta.com/code/#sdks-and-tools) can handle the OAuth 2.0 handshake on your behalf. Java Spring users may want to check out [Spring Security documentation](https://docs.spring.io/spring-security/reference/reactive/oauth2/client/client-authentication.html), and .NET Core users may want to check out [Microsoft.AspNetCore.Authentication](https://learn.microsoft.com/en-us/dotnet/api/microsoft.aspnetcore.authentication?view=aspnetcore-7.0) as examples. Remember to test your work as you go along for both happy path, error cases, and scenarios such as correctly handling access token expiration.

Before deploying changes to your production environment, ensure you're using [production-quality tools for generating the JWKS internally](https://github.com/mitreid-connect/mkjwk.org) and managing your private key securely.

## Best practices during API authorization migrations

Immediately transitioning away from static tokens isn't always feasible, especially in large organizations or if you have a lot of APIs to update. If you're still using SSWS tokens with Okta, you want to mitigate risks until you can transition to OAuth 2.0. Best practices include:
 1. Implement new API calls or code using OAuth 2.0.
 2. Follow the principle of least privilege. For instance:
   * Don't use personal accounts to establish service accounts.
   * Use a custom admin role for service accounts, granting only the essential permissions.
   * Use Groups and Global Session Policies to prevent interactive logins for service accounts.

## Secure API calls with OAuth 2.0

Shifting from static tokens to OAuth 2.0 isn't only about embracing new technology but pivoting towards a more secure, flexible, and developer-friendly ecosystem. While static tokens had their time and place, it's clear that the future lies in dynamic, user-centric, and secure OAuth 2.0 solutions.

Remember, as technology progresses, staying updated and adapting to better practices isn't just beneficial—it's essential. Migrate to OAuth 2.0 and step into a more secure, streamlined, and efficient developer journey. 

## Next steps with OAuth 2.0

If you find this post interesting, you may enjoy these posts.
 * [Selecting the Best Authorization for Your API Integrations](/blog/2023/04/24/api-integrations)
 * [Step-up Authentication in Modern Applications](/blog/2023/03/08/setup-up-auth)
 * [Add Auth to Any App with OAuth2 Proxy](/blog/2022/07/14/add-auth-to-any-app-with-oauth2-proxy)
 * [OAuth for Java Developers](/blog/2022/06/16/oauth-java)

Check out Okta's [API Security](https://developer.okta.com/docs/guides/api-security/) developer guides to get started in your migration to OAuth 2.0: 

[Configure Demonstrating Proof-of-Possession](https://developer.okta.com/docs/guides/dpop/main/)

  * This guide discusses how to create sender-constrained access tokens that are an application-level mechanism for preventing token replays at different endpoints.

[Configure OAuth for Okta](https://developer.okta.com/docs/guides/implement-oauth-for-okta/main/)

  * This guide explains how to interact with Okta APIs using scoped OAuth 2.0 access tokens.
[Configure OAuth for Okta: Service App](https://developer.okta.com/docs/guides/implement-oauth-for-okta-serviceapp/main/)

  * This guide describes interacting with Okta APIs using scoped OAuth 2.0 access tokens for a service app.

[Protect your API endpoints](https://developer.okta.com/docs/guides/protect-your-api/aspnetcore3/main/)
  * Add authorization using Okta to protect your APIs. When you finish, you have a secure REST API application that validates incoming requests.

[Integrate Third-Party Risk](https://developer.okta.com/docs/guides/third-party-risk-integration/main/)

  * This guide explains configuring an Okta org to receive risk events from a third-party provider.
Secure API connection between orgs with OAuth 2.0

  * This guide describes setting up Okta hub and spoke orgs securely to synchronize users and groups using OAuth 2.0 in a [multi-tenant solution](https://developer.okta.com/docs/concepts/multi-tenancy/). Connect Okta org API access to scoped data using the OAuth 2.0 client credential flow for the [Org2Org integration](https://help.okta.com/okta_help.htm?type=oie&id=ext-org2org-intg) app.

[Set up step-up authentication with ACR values](https://developer.okta.com/docs/guides/step-up-authentication/main/)


  * This guide explains how to include the acr_values parameter in your authorization requests to increase end-user assurance.


Please comment below with any questions, and let us know what you want to hear about next. For more exciting content, follow [@oktadev on Twitter](https://twitter.com/oktadev), find [us on LinkedIn](https://www.linkedin.com/company/oktadev/), and subscribe to [our YouTube channel](https://www.youtube.com/oktadev).