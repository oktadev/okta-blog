---
disqus_thread_id: 8612896062
discourse_topic_id: 17387
discourse_comment_url: https://devforum.okta.com/t/17387
layout: blog_post
title: "Set Access Control Policies With Kong Konnect and Okta"
author: claudio-acquaviva
by: external-contributor
communities: [devops,security]
description: "Learn how to set up an access control policy based on Okta's groups and planes."
tags: [kong, api-gateway, oidc, introspection]
tweets:
- "Set up an access control policy with Kong and Okta."
- "Check out our latest tutorial on using access control policies with Kong and Okta."
- "Using Kong for your API gateway? Learn how to integrate it with @okta!"
image: blog/access-control-policies-kong-connect/access-control-policies-kong.png
type: conversion
canonical: https://konghq.com/blog/access-control-policies/
---

In our last Kong and Okta tutorial, we will implement a basic access control policy based on Okta's groups and planes. This series will show you how to implement service authentication and authorization for [Kong Konnect](https://konghq.com/kong-konnect/) and Okta using the [OpenID Connect](https://konghq.com/blog/openid-connect-api-gateway) ([OIDC](https://docs.konghq.com/hub/kong-inc/openid-connect/)) plugin. Parts 1, 2 and 3 covered:

- [Implement client credentials for application authentication](/blog/2021/05/25/client-credentials-kong-konnect)
- [Authorization Code for user authentication](/blog/2021/06/02/auth-code-flow-kong-konnect)
- [Implement introspection flow for token validation](/blog/2021/06/11/access-control-policies-kong-connect-konnect)

**Table of Contents**{: .hide }
* Table of Contents
{:toc}
  
<Embed video>

You can also [watch this tutorial as a screencast](https://youtu.be/5TCRTXbeVLM).

<div style="text-align: center; margin-bottom: 1.25rem">
<iframe width="700" height="394" style="max-width: 100%" src="https://www.youtube.com/embed/5TCRTXbeVLM" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</div>

## How Access Control Works

**OIDC claims** are a piece of information inserted about an entity. Name and picture are claim examples for users.

**OIDC scopes** are a group of claims.

In this tutorial, we'll define a new claim based on an Okta group. The claim will be included in all scopes defined. The OIDC plugin must check if the coming tokens have this specific claim to allow the Kong route consumption. Only users who are part of the Okta group will have the claim included in the token and will be able to consume the route.

{% img blog/access-control-policies-kong-connect/access-control.jpg alt:"Okta and Kong Konnect Access Control Policies Architecture" width:"800" %}{: .center-image }

## Configure Okta

In my example, I already created two users and a group. The group has only one member.

{% img blog/access-control-policies-kong-connect/people.png alt:"Okta People" width:"800" %}{: .center-image }

The new claim will be based on this group, so only its members will have permission to go through the Kong route.

{% img blog/access-control-policies-kong-connect/kong-group.png alt:"Okta Kong Group" width:"700" %}{: .center-image }

The new Kong claim definition is based on the Kong group. It'll be included in any scope for each access token issued.

{% img blog/access-control-policies-kong-connect/edit-claim.png alt:"Okta Edit Claim Access Token" width:"700" %}{: .center-image }

Let's run a token preview to check the tokens and claim out. For the first request, we can try the user who's not a Kong group member. As expected, the access token does not have a Kong claim inside of it.

{% img blog/access-control-policies-kong-connect/preview-token.png alt:"Okta Preview Token Claim" width:"800" %}{: .center-image }

If we try the other user that belongs to the Kong group, the access token will be different. Here's the Kong claim inside our token.

{% img blog/access-control-policies-kong-connect/kong-claim.png alt:"Okta Preview Token with Kong" width:"800" %}{: .center-image }

## Enable OpenID Connect Plugin

Let's check our Kong route with the OIDC plugin enabled. According to the parameters in the screenshot below, the plugin should check if the token has the Kong claim defined by Okta. So in this sense, the route should be consumed only by users who are members of the Kong group.

- **Config.Scope Claim**: `kong_claim`
- **Config.Scopes Required**: `kong_group`

{% img blog/access-control-policies-kong-connect/config-scopes.png alt:"Okta and Kong OpenID Connect Claims and Scopes" width:"600" %}{: .center-image }

## Consume the Kong Route

Let's have both users consume the route. The process will be similar to what we already did in Okta's token preview process. For the first request, let's try the user who isn't in the Kong group. As expected, we shouldn't be able to consume the route.

We are trying to consume the route, but since we don't have any token injected inside our request, the API gateway redirects us to Okta to present our credentials.

{% img blog/access-control-policies-kong-connect/okta-login-claudio.png alt:"Okta Sign In" width:"330" %}{: .center-image }

And after getting authenticated, Okta is redirecting us back to the API gateway. However, since the token doesn't have the claim inside it, the gateway says "forbidden" and won't allow us to consume the route.

Let's try the other user who is a member of the Kong group. Again, we try to consume the route, getting redirected to Okta, but we're going to use the second user this time.

{% img blog/access-control-policies-kong-connect/okta-login-first-last.png alt:"Okta Sign In" width:"360" %}{: .center-image }

After getting authenticated, Okta redirects us back to the API gateway. This time, our token has the Kong claim we defined in Okta previously.

{% img blog/access-control-policies-kong-connect/access-token.png alt:"Okta and Kong Claim" %}{: .center-image }

If we go to [jwt.io](http://jwt.io/), we will decode the JWT token and check the token and the claim inside it.

{% img blog/access-control-policies-kong-connect/jwt.io.png alt:"Okta and Kong Konnect JWT OIDC" width:"800" %}{: .center-image }

## Protect Your Applications With Kong Konnect and Okta

[Start a free trial](https://konghq.com/kong-konnect/), or [contact Kong](https://support.konghq.com/support/s/) if you have any questions as you're getting set up.

Once you've set up Konnect and Okta access control policies, you may find these other tutorials helpful:

- [Automating Your Developer Pipeline With APIOps (DevOps + GitOps)](https://konghq.com/blog/automating-developer-pipeline-apiops/)
- [Service Design Guidelines Part 2: API Versioning](https://konghq.com/blog/service-design-guidelines-api-versioning/)
- ["Gateway Mode" in Kuma and Kong Mesh](https://konghq.com/blog/kuma-service-mesh-gateway-mode/)
- [Use Kong Gateway to Centralize Authentication](/blog/2021/03/26/use-kong-gateway-to-centralize-authentication)

If you have any questions, please leave a comment below. To be notified when the OktaDev team posts new content, please follow [@oktadev](https://twitter.com/oktadev) on Twitter, like them [on LinkedIn](https://www.linkedin.com/company/oktadev/), or subscribe to [their YouTube channel](https://www.youtube.com/oktadev).
