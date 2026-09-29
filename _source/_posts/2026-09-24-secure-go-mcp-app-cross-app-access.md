---
layout: blog_post
title: "Implement Secure Cross App Access (XAA) in Go"
author: vanshika
by: advocate
communities: [go]
description: "Learn how to build a secure Go MCP app that uses Cross App Access (XAA) and token exchange for AI agents without OAuth consent screens."
tags: [go, mcp, cross-app-access, xaa, oauth, oidc]
tweets:
  - ""
  - ""
  - ""
image: blog/secure-go-mcp-app-cross-app-access/social.jpg
github: https://github.com/oktadev/okta-go-mcp-xaa-lab
type: conversion
---

Picture this: you ask a restaurant's AI assistant to book a table and note your seating preference. You're already signed in to the restaurant app, but the booking service still needs proof that the assistant is acting on your behalf. That's where Cross App Access (XAA) comes in: your identity provider checks the organization's rules and issues the assistant a signed identity assertion, which the Model Context Protocol (MCP) server exchanges for a scoped access token, no second sign-in required.

In this post, we'll understand XAA and build a sample Go web app called AI Notes Assistant that uses XAA to fetch a user's to-do items from a protected MCP server and turn them into notes, no OAuth consent screen required. We'll test the flow with the [XAA playground](https://xaa.dev) and walk through the Go implementation.

To follow along, install Go 1.25 or newer and create a free account at [xaa.dev](https://xaa.dev), where you'll register AI Notes Assistant as a requester app before running it.

**Table of Contents**{: .hide }
* Table of Contents
{:toc}

## What is Cross App Access (XAA)?

Before we start building, it's important to understand Cross App Access (XAA). XAA is a standard that helps apps and AI agents securely access other apps on a signed-in user's behalf. Instead of relying on secret codes stored in setup files, it lets an organization's identity provider (IdP), such as Okta, help manage that access.

For example, an employee might ask an AI assistant to summarize a project document. XAA helps the assistant request access to the project app, while the identity provider's policies and the app's permissions determine what it can see.

You can think of XAA like an agreed process for using a partner company's building. Your employee badge won't open the partner's doors by itself; the partner needs a trusted way to verify who you are and grant the right level of access. XAA provides a similar way for apps to verify an agent's access on a user's behalf.

While the flow is sophisticated, it relies on two standard interactions:

1. RFC 8693 (Token Exchange): the requesting app hands its OpenID Connect (OIDC) ID token to the enterprise IdP and asks for an Identity Assertion Authorization Grant (ID-JAG).
2. RFC 7523 (JSON Web Token (JWT) Bearer Grant): the app hands that ID-JAG to the resource's own authorization server and gets back a scoped access token, ready to use against the real API.

{% img blog/secure-go-mcp-app-cross-app-access/xaa-sequence-diagram.svg alt:"Sequence diagram showing an AI agent sending an ID token and requesting an ID-JAG from the IdP, the IdP returning the ID-JAG, the agent exchanging it for an access token, the IdP returning the access token, and the agent calling the resource server" width:"800" %}{: .center-image }

Look at the above flow diagram for a second before moving on: you can see zero manual consent prompts anywhere. Everything from here is Go code making those five arrows real. Read the full breakdown in ["Integrate Your Enterprise AI Tools with Cross App Access"](/blog/2025/06/23/enterprise-ai) if you want the policy side of the story; this post picks up where that one leaves off and builds the client side in Go.

## Building the XAA flow in Go

With the overview out of the way, it's time to build. This post's sample app, AI Notes Assistant, runs through that exact chain in four steps. Every snippet below comes from its source in the [okta-go-mcp-xaa-lab repository](https://github.com/oktadev/okta-go-mcp-xaa-lab).

### Signing the user in with OIDC and PKCE

This is Step 1. A user clicks sign in, and the app redirects them to the IdP using OpenID Connect (OIDC). `HandleLogin` does one thing most frameworks handle for you automatically: it builds its own Proof Key for Code Exchange (PKCE) challenge.

```go
// internal/oidcauth/oidc.go
func (a *Auth) HandleLogin(w http.ResponseWriter, r *http.Request) {
    // ...
    verifier := oauth2.GenerateVerifier() // a random PKCE verifier, unique to this login attempt
    state := randString()                 // guards the redirect back against CSRF
    nonce := randString()                 // ties whatever ID token comes back to this exact attempt

    authURL := a.oauth2Cfg.AuthCodeURL(state, oauth2.S256ChallengeOption(verifier), oidc.Nonce(nonce))
    http.Redirect(w, r, authURL, http.StatusFound) // send the browser to the IdP
}
```

The IdP authenticates the user and redirects back with a code. `HandleCallback` exchanges that code for tokens, verifies the ID token it gets back against the nonce above, and drops it into the session. Nothing downstream trusts this token yet, though; it only proves identity to this one app.

Checkpoint: run `go run .`, open `http://localhost:8080/login`, and confirm the browser lands on the IdP's authorize page with a `code_challenge` parameter in the URL. That's the PKCE challenge from the code above, so seeing it there confirms this step works before you move on.

### Exchanging the ID token for an ID-JAG with RFC 8693

This is Step 2, the actual hand-off. The app takes the ID token from Step 1 and sends it to the IdP, asking to trade it for an ID-JAG, a short-lived, signed statement that this exact user is who they claim to be.

```go
// internal/xaa/tokenexchange.go
func exchangeForJAG(ctx context.Context, cfg config.XaaConfig, idToken string) (string, error) {
    fields := url.Values{
        "grant_type":           {"urn:ietf:params:oauth:grant-type:token-exchange"}, // this is a token exchange, per RFC 8693
        "requested_token_type": {"urn:ietf:params:oauth:token-type:id-jag"},          // ask specifically for an ID-JAG
        "subject_token":        {idToken},                                            // the ID token proving who signed in
        "subject_token_type":   {"urn:ietf:params:oauth:token-type:id_token"},
        "audience":             {strings.TrimRight(cfg.AuthServerURL, "/")},          // who must trust the ID-JAG
        "resource":             {strings.TrimRight(cfg.McpServerURL, "/")},           // the server the app ultimately wants to reach
        "client_id":            {cfg.ClientID},                                       // same client ID used for the OIDC login above
    }
    return postForm(ctx, strings.TrimRight(cfg.IdpBaseURL, "/")+"/token", fields)
}
```
If the IdP's policy allows it, it signs the ID-JAG and sends it back. That JWT is the app's ticket to the next server.

Checkpoint: once you run the full flow later in this post, watch the dashboard's **Step 2 — Token Exchange (RFC 8693)** entry – it streams back the raw ID-JAG your app just received, confirming the IdP handed one over.

### Exchanging the ID-JAG for an access token with RFC 7523

This is Step 3. An ID-JAG is useless against the MCP server directly. The resource's own authorization server, a different server than the one that just issued it, has to redeem the ID-JAG again.

```go
// internal/xaa/tokenexchange.go
func requestAccessToken(ctx context.Context, cfg config.XaaConfig, jag string) (string, error) {
    fields := url.Values{
        "grant_type": {"urn:ietf:params:oauth:grant-type:jwt-bearer"}, // RFC 7523's JWT bearer grant
        "assertion":  {jag},                                           // the ID-JAG from Step 2
        "client_id":  {cfg.McpClientID},                                // a different client ID than Step 2 used
    }
    endpoint := strings.TrimRight(cfg.AuthServerURL, "/") + "/token"
    return postForm(ctx, endpoint, fields)
}
```
Both trades chain into one function the rest of the app calls:

```go
func GetAccessToken(ctx context.Context, cfg config.XaaConfig, idToken string) (string, error) {
    jag, err := exchangeForJAG(ctx, cfg, idToken)
    if err != nil {
        return "", err
    }
    return requestAccessToken(ctx, cfg, jag)
}
```

Call `GetAccessToken` once, and an ID token walks out the other side as an access token good for one specific MCP server. The user never sees a second login or consent screen for any of it.

Checkpoint: the dashboard's **Step 3 — Access Token Request (RFC 7523)** entry shows the resulting access token and its decoded claims, proof the resource server's authorization server accepted the ID-JAG.

### Calling the MCP server

This is Step 4, the final one. With that access token in hand, the app finally talks to the MCP server, using the official [MCP Go SDK](https://github.com/modelcontextprotocol/go-sdk). The SDK's `StreamableClientTransport` has no built-in field for a bearer token, so AI Notes Assistant wraps the underlying `http.Client` in a small custom transport:

```go
// internal/mcpnotes/client.go
type bearerTransport struct {
    token string
    base  http.RoundTripper
}

func (t *bearerTransport) RoundTrip(req *http.Request) (*http.Response, error) {
    req = req.Clone(req.Context())
    req.Header.Set("Authorization", "Bearer "+t.token) // attach the access token from Step 3
    base := t.base
    if base == nil {
        base = http.DefaultTransport
    }
    return base.RoundTrip(req)
}
```

With that transport in place, connecting and reading the data takes four lines:

```go
// internal/mcpnotes/client.go
func Fetch(ctx context.Context, cfg config.XaaConfig, accessToken string) (*FetchResult, error) {
    httpClient := &http.Client{Transport: &bearerTransport{token: accessToken}} // accessToken is the Fetch parameter, from Step 3
    transport := &mcp.StreamableClientTransport{Endpoint: cfg.McpServerURL, HTTPClient: httpClient}

    client := mcp.NewClient(&mcp.Implementation{Name: "okta-go-mcp-xaa-lab", Version: "1.0.0"}, nil)
    session, err := client.Connect(ctx, transport, nil)                                     // MCP handshake: protocol version + capabilities
    result, err := session.ReadResource(ctx, &mcp.ReadResourceParams{URI: cfg.ResourceURI}) // fetch the actual to-do data
    // ...
}
```

The XAA playground's resource server only speaks to-dos, not notes, so AI Notes Assistant reshapes each item into a note before it ever reaches the screen.

Checkpoint: the dashboard's **Step 4 — MCP Server (Streamable HTTP)** entry lists the resources it read and the notes it built from them – the live MCP round trip, not mocked data.

All four steps run inside one handler, `FlowHandler`, fired the instant a user finishes logging in. From the browser, it looks like two clicks: **Sign in**, then **Analyze My Notes**. Everything above happens in between, invisible to whoever is actually using the app.

## Testing your Go MCP app with xaa.dev

Now that you've seen how the four steps fit together in code, here's how to watch them actually run. Register AI Notes Assistant as a requester app on xaa.dev before you run anything locally:

1. Register your requesting application at [xaa.dev](https://xaa.dev/?have=requesting&want=register&via=oidc)
2. Set the redirect URI to `<app-url>/callback` and the post-logout redirect URI to `<app-url>/logged-out`
3. Under **Add Resource**, pick **ToDo MCP Server** and add the connection
4. Copy the client ID and secrets xaa.dev generates into `config.json`


{% img blog/secure-go-mcp-app-cross-app-access/xaa-dev-register-app.jpg alt:"xaa.dev Edit App screen showing the requesting app's name, redirect URIs, and post-logout redirect URI configured for AI Notes Assistant" width:"800" %}{: .center-image }

Here's the whole run, end to end: signing in at the identity provider, verifying with a demo verification code, landing on the AI Notes Assistant home screen, and the finished dashboard with all four steps checked off, the access token, its claims, and the notes pulled from the resource server.

{% img blog/secure-go-mcp-app-cross-app-access/running-go-mcp-app-with-xaa-dev.jpg alt:"Four panel walkthrough of running the Go MCP app with xaa.dev: signing in at the identity provider, verifying identity with a demo six digit code, the AI Notes Assistant home screen, and the dashboard showing the completed XAA auth flow steps, access token, token claims, and notes" width:"800" %}{: .center-image }

## Running your Go MCP app locally

Clone the repository and pull down its dependencies:

```shell
git clone https://github.com/oktadev/okta-go-mcp-xaa-lab
cd okta-go-mcp-xaa-lab
go mod tidy
```

Fill `config.json` with the values from your xaa.dev registration. `clientId` and `clientSecret` come from the app you just registered; `mcpClientId` and `mcpClientSecret` are a separate pair xaa.dev issues for the MCP resource connection, the same two client IDs the code uses in Steps 2 and 3. `sessionSecret` isn't issued by xaa.dev at all, it's any long random string you generate yourself:

{% img blog/secure-go-mcp-app-cross-app-access/xaaflow.jpg alt:"xaa.dev app registration card and a sample token request annotated with clientId, clientSecret, mcpClientId, and mcpClientSecret, showing where each config.json value comes from" width:"800" %}{: .center-image }

```json
{
  "xaa": {
    "clientId":        "<your-client-id>",
    "clientSecret":    "<your-client-secret>",
    "idpBaseUrl":      "https://idp.xaa.dev",

    "mcpClientId":     "<your-mcp-client-id>",
    "mcpClientSecret": "<your-mcp-client-secret>",

    "authServerUrl":   "https://auth.resource.xaa.dev",
    "mcpServerUrl":    "https://mcp.xaa.dev/mcp",
    "resourceUri":     "todo0://todos",
    "scope":           "todos.read mcp.access",

    "redirectUri":     "http://localhost:8080/callback",
    "sessionSecret":   "<any-long-random-string>"
  },
  "saml": { "enabled": false },
  "port": 8080
}
```

Then start the server:

```shell
go run .
```

Go to `http://localhost:8080`. You'll see the AI Notes Assistant home screen with a **Sign in** button.

Click **Sign in**. The xaa.dev playground handles the login itself, so you can confirm this by checking the URL in your browser: it redirects to `idp.xaa.dev` before bouncing you back to `localhost:8080/callback`. Sign in with a test email, then enter the verification code the playground asks for. xaa.dev runs in demo mode, so any 6-digit code works.

Once you're signed in, click **Analyze My Notes**. Watch the page stream every step live: the login, the token exchange, the bearer token landing, and the MCP resource fetch, alongside the decoded token claims and the notes pulled straight from the resource server. That's the real token exchange from Steps 1 through 4 running against your local Go MCP app, not a simulation.

## Learn more about secure AI agent development with Go and MCP

One login, two token trades most users never notice, and a working connection to a server that had no reason to trust this app a second earlier. That's the experience more organizations are adopting XAA to deliver.

A few places to keep exploring:

- Read through the full source in the [okta-go-mcp-xaa-lab repository](https://github.com/oktadev/okta-go-mcp-xaa-lab)
- Register your own app and poke at the flow yourself at [xaa.dev](https://xaa.dev)
- Read the policy and architecture side of this story in [Integrate Your Enterprise AI Tools with Cross App Access](/blog/2025/06/23/enterprise-ai)

XAA is still a young standard, but the parts that matter here, the token exchange and the policy check, are solid enough to build on today. If you're wiring an AI agent to reach past your own app's boundary, this is worth trying before you fall back to a shared API key.

Remember to follow us on [X](https://x.com/oktadev) and subscribe to our [YouTube channel](https://www.youtube.com/c/OktaDev/) for more exciting content. We also want to hear from you about the topics you'd like to see and any questions you may have. Leave us a comment below!