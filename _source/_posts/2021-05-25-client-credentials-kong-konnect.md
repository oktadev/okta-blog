---
disqus_thread_id: 8550181620
discourse_topic_id: 17374
discourse_comment_url: https://devforum.okta.com/t/17374
layout: blog_post
title: "Implement Client Credentials with Kong Konnect and Okta"
author: claudio-acquaviva
by: external-contributor
communities: [devops,security]
description: "Learn how to set up client credentials flow for application authentication with Kong and Okta using Kong's OpenID Connect plugin."
tags: [kong, api-gateway, oidc, client-credentials]
tweets:
- "Client credentials made easy with Kong and Okta."
- "Check out our latest tutorial on using client credentials with Kong and Okta."
- "Using Kong for your API gateway? Learn how to integrate it with @okta!"
image: blog/client-credentials-kong/client-credentials-kong.png
type: conversion
canonical: https://konghq.com/blog/kong-and-okta-client-credentials/
---

Using Kong's [OpenID Connect (OIDC) plugin](https://docs.konghq.com/hub/kong-inc/openid-connect/), Kong and Okta work together to solve three significant application development challenges:

1. Connectivity
2. [Authentication](https://konghq.com/learning-center/api-gateway/api-gateway-authentication/)
3. Authorization

The OIDC plugin enables Kong, as the [API gateway](https://konghq.com/learning-center/api-gateway/), to communicate with Okta via the OAuth/OIDC flows. That way, your app teams don't have to configure and diagnose authentication and authorization for each service individually. With these challenges solved, app teams have more time to build and innovate.

**Table of Contents**{: .hide }
* Table of Contents
{:toc}

This series will show you how to implement service authentication and authorization for [Kong Konnect](https://konghq.com/kong-konnect/) and Okta using the OIDC plugin. In this tutorial, we'll cover client credentials flow for application authentication. Parts 2-4 will cover:

* [Authorization code for user authentication](blog/2021/06/02/auth-code-flow-kong-konnect)
* [Integral introspection for token validation](/blog/2021/06/11/introspection-flow-kong-konnect)
- [Access control based on Okta's groups and planes](blog/2021/06/28/access-control-policies-kong-konnect)

You can also [watch this tutorial as a screencast](https://youtu.be/-zRVWD3aXwE).

<div style="text-align: center; margin-bottom: 1.25rem">
<iframe width="700" height="394" style="max-width: 100%" src="https://www.youtube.com/embed/-zRVWD3aXwE" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</div>

## Kong Konnect and Okta Integration Topology

{% img blog/client-credentials-kong/kong-okta-integration-topology.jpg alt:"Kong Konnect and Okta Integration Topology" width:"800" %}{: .center-image }

In the above diagram, the API gateway splits into two sublayers. The first is the control plane used by admins to create new APIs and policies. The second sublayer is accountable for request processing and API conception and contains the control plane responsible for publishing those APIs and policies to the data plane.

My topology has two data planes: the first running locally, and the second running as a Docker container in an AWS EC2 instance. The integration is possible because Kong provides a specific plugin to implement the OAuth/OIDC flows from the API gateway. The OIDC plugin will submit the consumer to Okta's authentication processes before consuming the API.

## Set Up Konnect Service and Route

Konnect is a cloud native service connectivity platform hosted as a service. It can take care of all connectivity use cases across any environment, including virtual machines (VMs) and [Kubernetes](https://konghq.com/learning-center/kubernetes/what-is-kubernetes).

Start by going to the ServiceHub in the Kong Konnect Enterprise Admin GUI. In my example, I've already set up a service. If you haven't already, follow the Kong Documentation to set up a service before continuing to the next steps.

{% img blog/client-credentials-kong/service-hub.png alt:"Set up a service in ServiceHub" width:"800" %}{: .center-image }

My service has only one version. We could define multiple versions with different definitions and policies if necessary.

{% img blog/client-credentials-kong/konnect-okta-service.png alt:"Service versions" width:"800" %}{: .center-image }

We could click on the service version to see the routes that are already exposing a service.

{% img blog/client-credentials-kong/konnect-versions.png alt:"Konnect versions" width:"800" %}{: .center-image }

In my example, I'm going to consume and protect the `/oidcroute`. With no policy enabled, anyone can start consuming the route without any restriction. That's why it's critical to define and apply policies, like OIDC with Okta, to control this consumption.

## Set Up Okta

My demo environment has two previously created Okta applications. In this example, I will use the Kong client credentials app.

{% img blog/client-credentials-kong/okta-apps.png alt:"Okta apps" width:"800" %}{: .center-image }

## Create Konnect Data Plane

We'll run our Konnect data plane on an AWS EC2 instance in a Docker container. The control plane has a specific component called Runtime Manager. The Runtime Manager handles monitoring the currently installed data planes.

{% img blog/client-credentials-kong/runtime-manager.png alt:"Runtime Manager" width:"800" %}{: .center-image }

Click **Configure Runtime** to see the script we'll run to instantiate a Docker-based data plane. 

{% img blog/client-credentials-kong/configure-new-runtime.png alt:"Configure New Runtime" width:"800" %}{: .center-image }

Run the script in the EC2 terminal to get our first data plane up and running. In my example, I have already updated the script to use my Kong Konnect credentials. It will pull from the Kong Docker image.

Ready to launch, enjoy the flight! I've now deployed the data plane, and all the APIs are already available to consume. 

{% img blog/client-credentials-kong/konnect-runtime-setup.png alt:"Konnect Runtime Setup" width:"800" %}{: .center-image }

## Consume the Route Without a Policy

If we try to consume the route now by sending a request to `http :8000/oidcroute/get`, we'll be able to consume the route as expected.

{% img blog/client-credentials-kong/oidcroute-get.png alt:"HTTPie request to :8000/oidcroute/get" width:"450" %}{: .center-image }

However, since we haven't set any policy to control the route consumption, anyone could send as many requests as they want. To solve this, we'll need to set up the OIDC policy to control the route consumption. 

## Add OpenID Connect Plugin

To add the OIDC plugin, go to the ServiceHub > **Service** > **Versions** > **Service Version** > **Add Plugin**. 

The plugin expects four parameters to integrate with Okta.

1. **Config.ClientId**&mdash;issued from Okta
2. **Config.Client Secret**
3. **Config.Issuer**&mdash;Okta's endpoint
4. **Config.Scopes**

After configuring those four settings, click **Create** to save our settings.

## Test the OpenID Connect Plugin

Let's go back to our terminal and try to consume the route using `http :8000/oidcroute/get`. The API gateway won't allow us because we're not providing the credentials. 

If we try to send the same request, including our credentials (the client ID and client secret), we can consume the route. 

{% img blog/client-credentials-kong/oidcroute-get-with-credentials.png alt:"HTTPie request to :8000/oidcroute/get with credentials" width:"800" %}{: .center-image }

We can also decode the token issued by Okta on [jwt.io](https://jwt.io) and check all the fields inside it.

{% img blog/client-credentials-kong/jwt.io.png alt:"Decoded JWT on jwt.io" width:"800" %}{: .center-image }

## Upstream Header Injection

The OIDC plugin provides upstream header injection. That means we can extend requests with extra headers. Doing so sends the upstream or microservice more information about the authentication process. As an exercise, we can inject a header based on the ISS field, which is Okta's issuer endpoint.

To set extra OIDC plugin parameters, use the Kong Konnect control plane to:

1. Edit the OIDC plugin and enter **iss** into the field: **Config.Upstream Headers Claims**.
2. Enter **Issuer_Header** in the field: **Config.Upstream Headers Names**.
3. Click Update.

Let's consume the route one more time and inject a brand-new header into our request. 

{% img blog/client-credentials-kong/oidcroute-get-with-header.png alt:"HTTPie request to :8000/oidcroute/get with injected header" width:"800" %}{: .center-image }

Kong Konnect and Okta should now be protecting your applications and APIs!

[Start a free Kong Konnect trial](https://konghq.com/kong-konnect/) or [contact Kong support](https://support.konghq.com/support/s/) if you have any questions as you're getting set up.

## Learn More About Kong Konnect and Okta

Once you've set up Konnect and Okta, you may find these other tutorials helpful:

- [Apply Authorization Code Flow With Kong Konnect and Okta](/blog/2021/06/02/auth-code-flow-kong-konnect)
- [3 Ways Kong Helps With API Gateway Governance](https://konghq.com/blog/api-gateway-governance)
- [Getting Started with Kong Mesh and Open Policy Agent](https://konghq.com/blog/kong-service-mesh-and-opa-policy/)
- [Protect Your APIs With Kong Konnect and Fastly (Signal Sciences)](https://konghq.com/blog/kong-konnect-fastly/)
- [Use Kong Gateway to Centralize Authentication](/blog/2021/03/26/use-kong-gateway-to-centralize-authentication)

If you have any questions about this post, please leave a comment below. To be notified when the OktaDev team posts new content, please follow [@oktadev](https://twitter.com/oktadev) on Twitter, like them [on LinkedIn](https://www.linkedin.com/company/oktadev/), or subscribe to [their YouTube channel](https://www.youtube.com/oktadev).
