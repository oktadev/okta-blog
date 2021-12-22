---
disqus_thread_id: 8569176684
discourse_topic_id: 17380
discourse_comment_url: https://devforum.okta.com/t/17380
layout: blog_post
title: "Apply Authorization Code Flow With Kong Konnect and Okta"
author: claudio-acquaviva
by: external-contributor
communities: [devops,security]
description: "Learn how to set up authorization code flow for application authentication with Kong and Okta using Kong's OpenID Connect plugin."
tags: [kong, api-gateway, oidc, client-credentials]
tweets:
- "Auth code flow made easy with Kong and Okta."
- "Check out our latest tutorial on using auth code flow with Kong and Okta."
- "Using Kong for your API gateway? Learn how to integrate it with @okta!"
image: blog/auth-code-flow-kong/auth-code-flow-kong.png
type: conversion
canonical: https://konghq.com/blog/konnect-okta-authorization-code-flow/
---

We'll go through the authorization code flow applied to user authentication processes in our second Kong and Okta tutorial. This series will show you how to implement service authentication and authorization for [Kong Konnect](https://konghq.com/kong-konnect/) and Okta using the [OpenID Connect (OIDC) plugin](https://konghq.com/blog/openid-connect-api-gateway). Parts 1, 3, and 4 cover:

- [Implement Client Credentials with Kong Konnect and Okta](/blog/2021/05/25/client-credentials-kong-konnect)
- [Implement Introspection Flow With Kong Konnect and Okta](/blog/2021/06/11/introspection-flow-kong-konnect)
- [Access control based on Okta's groups and planes](blog/2021/06/28/access-control-policies-kong-konnect)

**Table of Contents**{: .hide }
* Table of Contents
{:toc}

You can also [watch this tutorial as a screencast](https://youtu.be/WyjSvekzoNk).

<div style="text-align: center; margin-bottom: 1.25rem">
<iframe width="700" height="394" style="max-width: 100%" src="https://www.youtube.com/embed/WyjSvekzoNk" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</div>

## Kong Konnect and Okta Integration Topology

The Konnect control plane creates new APIs and policies and publishes them to the data plane running as a Docker container in an AWS EC2 instance.

{% img blog/auth-code-flow-kong/konnect-okta-integration.png alt:"Kong Konnect and Okta Integration Topology" width:"800" %}{: .center-image }

### Authorization Code Flow

The authorization code flow goes through the following steps: 

1. First, a user tries to consume the API. 
2. If the user doesn't have a token injected, Kong redirects the user to Okta, the identity provider. 
3. The user authenticates on Okta and is sent back to Kong with an authorization code token. 
4. Kong validates the parameters and exchanges the authorization code token by calling Okta's token endpoint.

{% img blog/auth-code-flow-kong/auth-code-flow.png alt:"Auth Code Flow" width:"800" %}{: .center-image }

## Add Your Services and Routes to Konnect

In Konnect's ServiceHub, I have a service created already. Follow along in our [Getting Started with Konnect tutorial](https://konghq.com/blog/getting-started-konnect) to learn how to create a service and routes.

My service has two routes defined already. I used the first service in the previous Kong and Okta tutorial to show the client credentials flow. In this tutorial, I'll use the second service to apply the OIDC plugin utilizing the authorization code flow. 

{% img blog/auth-code-flow-kong/routes.png alt:"Routes" width:"800" %}{: .center-image }

## Set Up the Okta Application

In Okta, I prepared an application to implement the authorization flow already. In the Kong authorization code application, we're going to use the configured OIDC plugin in addition to the client ID and client secret. 

{% img blog/auth-code-flow-kong/okta-apps.png alt:"Okta Apps" width:"800" %}{: .center-image }

The app has the authorization code option turned on and the signing redirect URI set with the route available in my data plane. That means the authorization code is accepted for this URI only. 

{% img blog/auth-code-flow-kong/oidc-app-settings.png alt:"OIDC App Settings" width:"600" %}{: .center-image }

## Consume the Route Without a Policy

Any user is free to consume the route right now since there's no policy to control it. 

{% img blog/auth-code-flow-kong/no-oidc-policy.png alt:"Kong Konnect route with no OIDC policy" width:"800" %}{: .center-image }

## Apply the OpenID Connect Plugin

Just like we did for the client credentials flow tutorial, let's go back to the Konnect control plane to apply the OIDC plugin and then implement the authorization code flow. 

1. Set the **Config.Client ID**. 

    {% img blog/auth-code-flow-kong/client-id.png alt:"Kong OIDC Client ID Setup" width:"730" %}{: .center-image }

2. Enter the **Config.Client Secret**.

    {% img blog/auth-code-flow-kong/client-secret.png alt:"Kong OIDC client secret setup" width:"720" %}{: .center-image }

3. Add Okta's **Config.Issuer** endpoint. 
   
    {% img blog/auth-code-flow-kong/issuer.png alt:"Kong OIDC issuer setup" width:"756" %}{: .center-image }

Click **Create** to enable the OIDC plugin to the route.

## Test the OpenID Connect Plugin

If we try to consume the route again, Kong redirects us to Okta's user interface to present our credentials.

{% img blog/auth-code-flow-kong/okta-sign-in.png alt:"Okta user credential sign on" width:"424" %}{: .center-image }

Once we have presented our correct credentials, Okta authenticates and redirects us back to the API gateway. At this time, we'll consume the API because we got the identity token injected inside our request.

{% img blog/auth-code-flow-kong/access-token.png alt:"Kong and Okta Access Token" width:"800" %}{: .center-image }

Then we go to [jwt.io](http://jwt.io/) to check the token.

## Protect Your Applications with Kong Konnect and Okta

[Start a free trial](https://konghq.com/kong-konnect/), or [contact Kong](https://support.konghq.com/support/s/) if you have any questions as you're getting set up.

Once you've set up Konnect and Okta authorization code flow for user authentication, you may find these other tutorials helpful:

- [3 Ways Kong Helps With API Gateway Governance](https://konghq.com/blog/api-gateway-governance)
- [Getting Started with Kong Mesh and Open Policy Agent](https://konghq.com/blog/kong-service-mesh-and-opa-policy/)
- [Protect Your APIs With Kong Konnect and Fastly (Signal Sciences)](https://konghq.com/blog/kong-konnect-fastly/)
- [Use Kong Gateway to Centralize Authentication](/blog/2021/03/26/use-kong-gateway-to-centralize-authentication)

If you have any questions about this post, please leave a comment below. To be notified when the OktaDev team posts new content, please follow [@oktadev](https://twitter.com/oktadev) on Twitter, like them [on LinkedIn](https://www.linkedin.com/company/oktadev/), or subscribe to [their YouTube channel](https://www.youtube.com/oktadev).
