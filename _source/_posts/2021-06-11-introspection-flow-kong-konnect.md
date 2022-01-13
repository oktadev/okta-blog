---
disqus_thread_id: 8587074709
discourse_topic_id: 17382
discourse_comment_url: https://devforum.okta.com/t/17382
layout: blog_post
title: "Implement Introspection Flow With Kong Konnect and Okta"
author: claudio-acquaviva
by: external-contributor
communities: [devops,security]
description: "Learn how to set up introspection flow for service authentication with Kong and Okta using Kong's OpenID Connect plugin."
tags: [kong, api-gateway, oidc, introspection]
tweets:
- "Introspection flow made easy with Kong and Okta."
- "Check out our latest tutorial on using introspection flow with Kong and Okta."
- "Using Kong for your API gateway? Learn how to integrate it with @okta!"
image: blog/introspection-flow-kong-konnect/introspection-flow-kong.png
type: conversion
canonical: https://konghq.com/blog/introspection-flow-konnect-okta/
---

In our third Kong and Okta tutorial, we'll go through the introspection flow implementation. This series will show you how to implement service authentication and authorization for [Kong Konnect](https://konghq.com/kong-konnect/) and Okta using the [OpenID Connect](https://konghq.com/blog/openid-connect-api-gateway) ([OIDC](https://docs.konghq.com/hub/kong-inc/openid-connect/)) plugin. Parts 1, 2 and 4 cover:

- [Implement Client Credentials with Kong Konnect and Okta](/blog/2021/05/25/client-credentials-kong-konnect)
- [Authorization Code for user authentication](/blog/2021/06/02/auth-code-flow-kong-konnect)
- [Access control based on Okta's groups and planes](/blog/2021/06/28/access-control-policies-kong-konnect)

**Table of Contents**{: .hide }
* Table of Contents
{:toc}

You can also [watch this tutorial as a screencast](https://youtu.be/0Gc33A7F2XE).

<div style="text-align: center; margin-bottom: 1.25rem">
<iframe width="700" height="394" style="max-width: 100%" src="https://www.youtube.com/embed/0Gc33A7F2XE" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</div>

## Konnect and Okta Integration Topology

In this example, I'm using the Konnect control plane to create new APIs and policies and publish them to my data plane running as a Docker container in an AWS EC2 instance.

{% img blog/introspection-flow-kong-konnect/topology.png alt:"Kong Konnect and Okta Integration Topology" width:"800" %}{: .center-image }

### Introspection Flow

The introspection flow is part of the token validation process. [Kong Gateway](https://konghq.com/kong/) evaluates the injected token at the request processing time to see if it's still valid to the upstream services. The evaluation hits a specific Okta endpoint, passing the received token. Based on the response provided by Okta, Kong Gateway accepts or rejects the request.

{% img blog/introspection-flow-kong-konnect/introspection-flow.jpg alt:"Okta and Kong Konnect Introspection Flow" width:"800" %}{: .center-image }

For production environments, the OIDC plugin provides caching capabilities for the Okta responses. However, for this tutorial, I'm going to disable caching to better view the flow.

## Set Up the Okta Application

Regarding Okta's settings, I'm going to use the same client credentials application I created before. With the client ID and client secret. However, my OIDC plugin has to be set with specific parameters to implement introspection.

{% img blog/introspection-flow-kong-konnect/okta-oidc-app-settings.png alt:"Okta and Kong Introspection Flow App Settings" width:"700" %}{: .center-image }

## Apply the OpenID Connect Plugin

In the Konnect ServiceHub, I have an IntrospectionRoute OIDC plugin enabled.

{% img blog/introspection-flow-kong-konnect/introspection-route.png alt:"Kong Konnect Introspection Flow Route" width:"800" %}{: .center-image }

The settings should be:

- **Config.Auth Methods**

    {% img blog/introspection-flow-kong-konnect/config-auth-methods.png alt:"Kong OIDC Configure.Auth Methods" width:"625" %}

- **Config.Issuer**
  
    {% img blog/introspection-flow-kong-konnect/config-issuer.png alt:"OpenID Connect Config Issuer" width:"625" %}

- **Config.Introspect Jwt Tokens**
  
    {% img blog/introspection-flow-kong-konnect/config-introspect-jwt-tokens.png alt:"OpenID Connect Config.Introspect Jwt Tokens" width:"629" %}

- **Config.Introspection Endpoint** with a specific endpoint provided by Okta to implement introspection 
  
    {% img blog/introspection-flow-kong-konnect/config-introspect-endpoint.png alt:"OpenID Connect Config.Introspection Endpoint" width:"629" %}

## Test the Introspection Flow With Insomnia

To better view the flow, I will use [Insomnia](https://insomnia.rest/), Kong's API spec editor, to send requests to both Okta and Konnect. Below are my two requests.

The first one I'm sending to Okta, passing the expected parameters to get it authenticated and receive a token.

{% img blog/introspection-flow-kong-konnect/insomnia-okta-token.png alt:"Insomnia Okta Token" width:"800" %}{: .center-image }

For the second one to consume the route, I'm using a specific Insomnia capability called Request Chaining. With this, I'll be able to extract values from the response of a given request to build new ones. In my case, I'm pulling the access token from Okta's response to make the other request and then send it to Konnect.

{% img blog/introspection-flow-kong-konnect/insomnia-oidc-response.png alt:"Insomnia OpenID Connect Response" width:"800" %}{: .center-image }
{% img blog/introspection-flow-kong-konnect/insomnia-edit-tag-response.png alt:"Insomnia Edit Tag for Okta and Kong Introspection Response" width:"800" %}{: .center-image }

Next, let's send a request to Okta to get our token. There it is.

{% img blog/introspection-flow-kong-konnect/insomnia-okta-introspection-token.png alt:"Insomnia: Okta Introspection Token" width:"800" %}{: .center-image }

This time, we can see that Kong's request is ready to be sent since we got Okta's token injected inside of it.

{% img blog/introspection-flow-kong-konnect/insomnia-bearer-response.png alt:"Insomnia: Get Bearer Response for OIDC" width:"800" %}{: .center-image }
{% img blog/introspection-flow-kong-konnect/insomnia-edit-tag-instrospection-body.png alt:"Insomnia: Edit tag for Okta introspection body" width:"800" %}{: .center-image }

And here's the Konnect response:

{% img blog/introspection-flow-kong-konnect/konnect-response.png alt:"Insomnia: Preview Bearer Token OIDC" width:"800" %}{: .center-image }

It's important to note that Konnect is validating the token behind the scenes. Here's one EC2 terminal where my data plane is running. Since I disabled introspection caching for the OIDC plugin, Konnect hits Okta for each request to validate the token.

{% img blog/introspection-flow-kong-konnect/terminal-introspecting-log.png alt:"Kong Konnect and Okta: Validate OIDC Token" %}{: .center-image }

## Deactivate the Okta Application

Another way to see introspection is by deactivating the Okta application. All tokens related to it will be considered invalid and, as a consequence, will not be accepted by Kong again.

Let's get back to Okta's application and deactivate it. We should get a 401 error code from Kong.

{% img blog/introspection-flow-kong-konnect/terminal-401.png alt:"Okta and Kong Konnect: 401 Error Code" %}{: .center-image }

## Protect Your Applications with Kong Konnect and Okta

[Start a free trial](https://konghq.com/kong-konnect/), or [contact Kong](https://support.konghq.com/support/s/) if you have any questions as you're getting set up.

Once you've set up Konnect and Okta introspection flow, you may find these other tutorials helpful:

- [Automating Your Developer Pipeline With APIOps (DevOps + GitOps)](https://konghq.com/blog/automating-developer-pipeline-apiops/)
- [Service Design Guidelines Part 2: API Versioning](https://konghq.com/blog/service-design-guidelines-api-versioning/)
- ["Gateway Mode" in Kuma and Kong Mesh](https://konghq.com/blog/kuma-service-mesh-gateway-mode/)
- [Use Kong Gateway to Centralize Authentication](/blog/2021/03/26/use-kong-gateway-to-centralize-authentication)

If you have any questions about this post, please leave a comment below. To be notified when the OktaDev team posts new content, please follow [@oktadev](https://twitter.com/oktadev) on Twitter, like them [on LinkedIn](https://www.linkedin.com/company/oktadev/), or subscribe to [their YouTube channel](https://www.youtube.com/oktadev).
