---
layout: blog_post
title: "Build a Secure C# MCP App with Cross-App Access (XAA)"
author: aasawari
by: advocate
communities: [.net]
description: "Learn how to build a secure C# MCP client using Cross-App Access (XAA) and token exchange so AI agents can securely act on behalf of users."
tags: [csharp, mcp, cross-app-access, xaa, token-exchange, oauth, oidc, asp-net-core]
tweets:
  - ""
  - ""
  - ""
  - ""
image: blog/csharp-mcp-cross-app-access/social.jpg
github: https://github.com/oktadev/csharp-mcp-sdk-example
type: conversion
---

A few years ago, getting a user signed in to an application or multiple applications with single sign-on (SSO) was enough; OpenID Connect (OIDC) handled the login, JWTs carried the claims, and Proof Key for Code Exchange (PKCE) made it secure. Today, with evolving AI, agents act on behalf of users and seek multiple accesses across different resources to execute a task. And that is when you will hit the gap.

The user has an identity, but the downstream service—like a Model Context Protocol (MCP) server, an API, or an agent tool—has no way to trust it: the ID Token that proves the user's identity for your app, not for that service. You need a way to take that identity and have it trusted further down the chain, in line with the org's policy, without asking the user to log in again.

Cross-app access (XAA) solves exactly that. The user authenticates once. The Identity Provider (IdP) evaluates the enterprise policy and issues a signed Identity Assertion. The downstream service exchanges that assertion for a scoped Bearer token.

In this post, we'll explore how Cross-App Access (XAA) closes the trust gap, test the flow using xaa.dev, and implement a secure MCP client in just a few lines of C# using our dedicated SDK.

## What is Cross-App Access (XAA)?

Before we start implementing and building the application, it is important to understand the mechanics of Cross-App Access (XAA). At its core, XAA is an open standard that securely enables AI agents to act on behalf of a user and communicate with downstream applications without requiring constant, manual user consent.

While the flow is sophisticated, it relies on two standard interactions:

1. RFC 8693 (Token Exchange): The requesting app exchanges an OIDC ID token for a JWT Authorization Grant (JAG) at the enterprise Identity Provider.
2. RFC 7523 (JWT Bearer Grant): The app presents this JAG to the MCP authorization server to receive a scoped access token for the resource.

The diagram below gives a complete flow for XAA and token exchanges.

{% img blog/csharp-mcp-cross-app-access/xaa-flow-diagram.jpg alt:"XAA flow diagram showing the four steps: OIDC login, token exchange via RFC 8693, JWT bearer grant via RFC 7523, and MCP server access" width:"800" %}{: .center-image }

You can find a complete flow diagram and explanation of XAA in the ["Integrate Your Enterprise AI Tools with Cross-App Access"](https://developer.okta.com/blog/2025/06/23/enterprise-ai) blog.

In the next steps, let us understand how to implement the 4 steps of XAA using the MCP software development kit (SDK).

## Implementing XAA with the C# MCP SDK

If you were to build this manually, you would need to manage complex cryptographic handshakes. Instead, we'll use the C# MCP SDK; more details are available in the [official GitHub repository](https://github.com/oktadev/csharp-mcp-sdk-example). The C# MCP SDK's `IdentityAssertionGrantProvider` handles all the heavy lifting, abstracting these RFCs into a clean, developer-friendly interface that lets you focus on your agent logic rather than the authentication plumbing. Let us implement that step by step.

### Step 1: Building the OIDC flow

[ASP.NET](https://asp.net) Core has a built-in OIDC middleware that handles the full authentication flow, including PKCE. The implementation of this is simple.

```csharp
builder.Services
    .AddAuthentication()
    .AddCookie(o => { o.Cookie.Name = "xaa.auth"; })
    .AddOpenIdConnect(o =>
    {
        o.Authority    = config["Xaa:IdpBaseUrl"];
        o.ClientId     = config["Xaa:ClientId"];
        o.ResponseType = "code";
        o.UsePkce      = true;
        o.SaveTokens   = true; // ID Token persisted into the auth cookie
        o.MapInboundClaims = false;
        o.Scope.Add("openid");
        o.Scope.Add("email");
    });
```

An important thing to note here is that `MapInboundClaims = false`, which stops ASP.NET Core from remapping standard OIDC claim names to legacy WS-Federation names, keeping the token payload clean and predictable downstream.

### Steps 2 and 3: Automate XAA token exchange with C# SDK

This step marks the start of the XAA flow. With the SDK, instead of the user directly authorizing the MCP client, the app performs a two-hop token upgrade on the user's behalf, and the MCP C# SDK's `IdentityAssertionGrantProvider` encapsulates both exchanges.

The application presents the user's ID token to the IdP and represents the user's identity to the MCP server. The IdP responds with an ID-JAG, a short-lived token that grants access to the resource server. You then exchange this ID-JAG for an access token to access the server.

```csharp
var provider = new IdentityAssertionGrantProvider(
    new IdentityAssertionGrantProviderOptions
    {
        ClientId         = config["Xaa:McpClientId"]!,
        ClientSecret     = config["Xaa:McpClientSecret"],
        IdpTokenEndpoint = $"{config["Xaa:IdpBaseUrl"]}/token",
        IdpClientId      = config["Xaa:ClientId"]!,
        IdpClientSecret  = config["Xaa:ClientSecret"],
        Scope            = "todos.read mcp.access",

        // Called by the SDK when it needs the current user's ID Token
        IdTokenCallback = (_, _) => Task.FromResult(idToken)
    },
    httpClient);

var result = await provider.GetAccessTokenAsync(
    resourceUrl:           new Uri(config["Xaa:McpServerUrl"]!),
    authorizationServerUrl: new Uri(config["Xaa:AuthServerUrl"]!));

var accessToken = result.AccessToken;
```

With the `IdTokenCallback`, the provider retrieves the user's ID Token from the session.

### Step 4: Connect the MCP client to the server

After the exchanges, this is the final part, where the client can now access the MCP server and use the resource data. The HTTP-based servers handle session negotiation and message framing.

```csharp
// Setup the transport with the exchanged access token
var transport = new HttpClientTransport(new HttpClientTransportOptions
{
    Endpoint          = new Uri(config["Xaa:McpServerUrl"]!),
    TransportMode     = HttpTransportMode.StreamableHttp,
    AdditionalHeaders = new Dictionary<string, string>
    {
        ["Authorization"] = $"Bearer {accessToken}"
    }
});

// Initialize the MCP client
await using var client = await McpClient.CreateAsync(transport);
```

`McpClient.CreateAsync` performs the MCP initialization handshake, exchanging the protocol version and capabilities with the server before making any resource request. From here on, interacting with the server is straightforward.

```csharp
var resources = await client.ListResourcesAsync(); //lists all the available URIs
var result    = await client.ReadResourceAsync("todo0://todos");

var raw = string.Join("",
    result.Contents
          .OfType<TextResourceContents>()
          .Select(c => c.Text ?? ""));
```

This app uses `todo0://todos` to fetch from the xaa.dev resource server. The complete sample code for the app is available in the linked [GitHub repository](https://github.com/oktadev/csharp-mcp-sdk-example).

## Testing with xaa.dev

Now that we understand the XAA flow, it is time to test it. [xaa.dev](https://xaa.dev) is a testing playground. It provides a standardized, functional environment that lets you verify your end-to-end flow immediately, acting as the bridge between your app and the downstream resource.

To test out the application using the xaa.dev platform, follow the steps below to get the app registered as the requester app:

1. Go to [xaa.dev](https://xaa.dev) and select the **Register, test, and manage your requesting app** tab, then select **Continue with your app**.
2. Enter your email and click on **Continue** and **Register New App**.
3. Enter the Redirect URI and Post-logout URI as below.
4. Click on the **Add Resource** section and select **ToDo MCP Server**.
5. Click on **Register App**, and your app is now registered as a requester app in the XAA flow.

You should have your connections set up like in the screenshot below.

{% img blog/csharp-mcp-cross-app-access/xaa-dev-register-app.jpg alt:"xaa.dev Register New App screen showing redirect URIs, resource connections, and todos.read and mcp.access scopes" width:"800" %}{: .center-image }

In this example, the C# app is a requester app that fetches the To-Do list from the ToDo app and analyzes the tasks fetched.

## Executing with xaa.dev

At this point, you should have your application ready, running on port 5000, and connected to the xaa sample resource app. If not, you can clone the repo from the [GitHub repository](https://github.com/oktadev/csharp-mcp-sdk-example) and add the following environment variables to the `appsettings.json` file:

```shell
git clone https://github.com/oktadev/csharp-mcp-sdk-example.git
cd xaa-csharp-mcp-sdk-example
```

```json
{
  "Xaa": {
    "ClientId":        "<your-client-id>",
    "ClientSecret":    "<your-client-secret>",
    "IdpBaseUrl":      "https://idp.xaa.dev",

    "McpClientId":     "<your-mcp-client-id>",
    "McpClientSecret": "<your-mcp-client-secret>",

    "AuthServerUrl":   "https://auth.resource.xaa.dev",
    "McpServerUrl":    "https://mcp.xaa.dev/mcp",

    "RedirectUri":     "http://localhost:5000/callback"
  },
  "Logging": {
    "LogLevel": { "Default": "Information", "Microsoft.AspNetCore": "Warning" }
  },
  "AllowedHosts": "*"
}
```

Make sure to copy the correct client ID and secrets from xaa.dev. Once done, run the app.

```shell
dotnet run
```

Go to `http://localhost:5000/`, and you should see the app.

{% img blog/csharp-mcp-cross-app-access/app-login-screen.jpg alt:"AI Productivity Assistant app home screen with a Continue with Enterprise SSO button" width:"800" %}{: .center-image }

Sign in to the app using a test email and provide a random verification code as below. Once you sign in, the XAA playground handles the login request; you can verify this by checking the URL on your screen.

{% img blog/csharp-mcp-cross-app-access/verify-identity-screen.jpg alt:"Verify Your Identity screen showing a 6-digit code entry field with a demo mode notice to enter any 6 digits" width:"800" %}{: .center-image }

Once done, you should see the analyzer app running the XAA flow, displaying all details and analyzing all To-Do tasks.

{% img blog/csharp-mcp-cross-app-access/app-dashboard.jpg alt:"AI Productivity Assistant dashboard showing completed XAA auth flow steps, the access token, token claims, and a to-do task list" width:"800" %}{: .center-image }

The MCP SDK and XAA simplify building and testing cross-app access.

## What's next

What you've seen here is the full XAA flow, starting from a user signing in with SSO to an AI agent securely fetching data from an MCP server running end-to-end in under 50 lines of C#.

xaa.dev makes this tangible without any infrastructure overhead. The IdP, the Auth Server, the MCP resource server — it's all there, ready for you to register your app, drop in the credentials, and watch the token exchanges happen in real time. That's the fastest path from concept to a working implementation.

If you wish to read further:

- Browse the full source for this demo in the [GitHub repository](https://github.com/oktadev/csharp-mcp-sdk-example)
- Register your own app and explore the platform at [xaa.dev](https://xaa.dev)
- Read the deeper dive on how XAA closes the enterprise trust gap in [Integrate Your Enterprise AI Tools with Cross-App Access](https://developer.okta.com/blog/2025/06/23/enterprise-ai)

As AI agents take on more complex, multi-step tasks across organizational boundaries, XAA is the pattern that enables this without compromising security or user experience. Now you have the tools to build it.

Remember to follow us on [X](https://x.com/oktadev) and subscribe to our [YouTube channel](https://www.youtube.com/c/OktaDev/) for more exciting content. We also want to hear from you about the topics you'd like to see and any questions you may have. Leave us a comment below!
