---
layout: blog_post
title: "Develop a XAA-Enabled Resource Application and Test with Okta"
author: aaron-parecki
by: advocate
communities: [javascript,security,python,.net,java,go]
description: "Learn how to validate and test an XAA-enabled resource app with Okta, including ID-JAG verification, audience checks, and end-to-end token exchange."
tags: [xaa, cross-app-access, enterprise-ai, agentic-ai, oauth]
tweets:
image: blog/xaa-resource-app/social-image.jpg
type: awareness
---

From an enterprise resource app owner's perspective, Cross App Access (XAA) is a game-changer because it allows their resources to be "AI-ready" without compromising on security. In the XAA model, resource apps rely on the enterprise's Identity Provider (IdP) to manage access. Instead of building out interactive OAuth flows, they defer to the IdP to check enterprise policies and user groups, assign AI agent permissions, and log and audit AI agent requests as they occur. In return, the app's OAuth server needs only to perform a few checks:

* When the app's OAuth server receives a POST request to its token endpoint from an AI Agent, the app fetches the IdP's public keys (via the JWKS endpoint) to ensure the ID-JAG token attached to the request was actually minted by the trusted company IdP.  
* It confirms the token was intended for this app specifically. If the *`aud`* claim doesn't match the app's own identifier, it rejects the request.  
* Finally, it checks the end user ID in the token's `sub` claim to know *whose* data to look up in your database. It must map to the same IdP identity. It will reject the request if the user isn't recognized.

You can read in depth about XAA to better understand how this works and examine the token exchange flow. 

{% excerpt /blog/2025/06/23/enterprise-ai %}

Or watch the video about Cross App Access:

{% youtube 3VLzeT1EGrg %}

In this tutorial, we'll demonstrate how to test that an XAA-enabled resource app you have created (**TaskFlow**) is correctly using Okta as an **enterprise Identity Provider (IdP)** to sign users in, and we'll demonstrate how a sample AI app (**Agent0**) uses XAA to get access to TaskFlow. To do this, you'll:

* Enable Cross App Access in your Okta org  
* Register and configure the resource app (TaskFlow) in your org  
* Register the requesting app (Agent0) in your org as a known XAA app and connect it to TaskFlow.  
* Test that the XAA flow is working correctly when Agent0 requests access to Taskflow.

> Note that the apps (TaskFlow or Agent0) do not use Okta as their authorization server.

# Enable Cross App Access in your Okta org

To register your resource app with Okta, and set up secure agent-to-app connections, you'll need an Okta Developer org enabled with XAA:

* If you don't already have an account, sign up for a new one here: [Okta Integrator Free Plan](https://developer.okta.com/signup)  
* Once created, sign in to your new Integrator Free Plan org  
* In the Okta Admin Console, select **Settings > Features**  
* Navigate to **Early access**  
* Find **Cross App Access** and select **Turn on** (enable the toggle)  
* Refresh the Admin Console

> Note:  Cross App Access is currently a self-service Early Access (EA) feature. You must enable it through the Admin Console before the apps appear in the catalog. If you don't see the option right away, refresh and confirm you have the necessary admin permissions. Learn more in the [Okta documentation on managing EA and beta features](https://help.okta.com/oie/en-us/content/topics/security/manage-ea-and-beta-features.htm).

{% img blog/xaa-resource-app/image1.jpg alt:" " width:"800" %}{: .center-image }

# Register your requesting app (Agent0)

To test whether your resource app is working correctly, Okta provides a placeholder entry in the Okta Integration Network catalog. It is called ***Agent0 - Cross App Access (XAA) Sample Requesting App***. Add this to your org's integrations.

* Still in Admin Console, go to **Applications > Applications**  
* Select **Browse App Catalog**  
* Search for "Agent0 - Cross App Access (XAA) Sample Requesting App", and select it  
* Select **Add Integration**

Now to configure it correctly. First, assign user access to Agent0.

* Change the **Application** label if required, and select **Done**,  
* Select the Assignments tab  
  * To assign it to a single user, select **Assign > Assign to People** and choose your user  
  * To assign it to a user group, select **Assign > Assign to Groups** and choose your user group  
* Click Done

Finally, configure Agent0 with the redirect URI you will use to test Agent0

* Select the **Sign On tab**  
* Select **Edit**, and locate the Advanced Sign-on Settings section.  
* Set the **Redirect URI** to the URL that your app will use. For example, [http://localhost:8080/redirect](http://localhost:8080/redirect)  
* Click Save.  
* Locate and copy the Client ID and Client secret in the Sign-On methods section. Your app must use these when signing users in through Okta.

> Note: Only the org authorization server can be used to exchange ID-JAG tokens. Ensure you are using the org authorization server and not an Okta "custom authorization server".

{% img blog/xaa-resource-app/image2.jpg alt:" " width:"800" %}{: .center-image }

## Get a (XAA) Client ID for Agent0 from the Resource app's Auth Server

To allow the exchange of an ID-JAG token between Agent0 and your resource app, Agent0 must be registered as an OAuth client in your resource app's OAuth server. 

* Register your requesting app (**Agent0**) as an OAuth client in your resource app's OAuth server.    
* Make a note of the Client ID for your requesting app (**Agent0**). You'll need this as you set up your resource app.

> Note: The process for registering a client ID from your resource app's OAuth server will vary depending on the product.

# Set up your resource app (Taskflow)

To set up your resource app in your org, you can use the placeholder integration in the OIN catalog called ***Todo0 - Cross App Access (XAA) Sample Resource App*** and configure it as your resource app.

* Still in Admin console, navigate to **Applications > Applications**
* Select **Browse App Catalog**
* Search for **Todo0 - Cross App Access (XAA) Sample Resource App**, and select it  
* Select **Add Integration**

Now give it a helpful name and assign user access to Taskflow.

* Set the Application label to ***Taskflow***, and click Done.  
* Select the **Assignments** tab  
  * To assign it to a single user, select **Assign > Assign to People** and choose your user  
  * To assign it to a user group, select **Assign > Assign to Groups** and choose your user group  
* Click **Done**

## Update the audience value of your Resource app's auth server

By default, Okta will issue an ID-JAG token for Agent0 with the audience (`aud`) value set to that of the sample resource app (Todo0): `http://localhost:5001/`. You must change this so the ID-JAG token includes an audience value that identifies your actual resource app's authorization server.

To do this, contact the Okta XAA team to replace your app's audience value in Okta by sending an email to xaa@okta.com. Provide the following information to the Okta XAA team:

***Okta Integrator Org URL:*** 'https://{yourOktaDomain}'  
***Audience:*** 'http://youresourceapps.authserver.org'
***Client ID from your own OAuth server:*** [Agent0's XAA client ID you created earlier]

Please note that the Client ID you provide must be the client ID from your own OAuth server that was created earlier.

# Establish Connections between Agent0 and your resource app

Now that you have set up both requesting and resource apps, you need to establish that Agent0 can be trusted to make requests to your resource app.

* Still in Admin console, navigate to **Applications > Applications > Agent0**
* Go to the **Manage Connections** tab
* Under **Apps providing consent**, select **Add resource apps**, select **Taskflow**, then **Save**
* Confirm that your resource app appears under **Apps providing consent**

Now Agent0 and Taskflow are connected.

{% img blog/xaa-resource-app/image3.jpg alt:" " width:"800" %}{: .center-image }

# Validate that your Resource App and Auth Server work as intended

Once the Okta XAA team confirms that your app's audience value has been updated in Okta, Agent0 can make a Token Exchange request to Okta and will receive an ID-JAG with the correct audience.

To test the end-to-end XAA flow with Agent0 to your authorization server, create a testing client that completes the following steps:

1. Agent0 signs the user in with OIDC.   
2. Agent0 exchanges the ID token for an ID-JAG at Okta  
3. Agent0 makes a token request with the ID-JAG at your authorization server


If you need support with taking the steps above, contact xaa@okta.com. 

With testing complete, consider publicizing your resource app on the Okta Integration Network (OIN) catalog. Adding it to the catalog makes it easy for Okta's roughly 18000 enterprise customers to learn about and add it to the suite of tools on their Okta dashboards.

# Learn more about Cross App Access, OAuth 2.0, and securing your applications

If this walkthrough helped you understand more about how Cross App Access works in practice, consider learning more about

📘 [xaa.dev](https://xaa.dev/) - a free, open sandbox that lets you explore Cross App Access end-to-end. No local setup. No infrastructure to provision. Just a working environment where you can see the protocol in action.  
📘 [Okta's Cross App Access Documentation](https://help.okta.com/oie/en-us/content/topics/apps/apps-cross-app-access.htm) – official guides and admin docs to configure and manage Cross App Access in production  
🎙️ [Okta Developer Podcast on MCP and Cross App Access](https://www.youtube.com/watch?v=qKs4k5Y1x_s) – hear the backstory, use cases, and why this matters for developers  
📄 [OAuth Identity Assertion Authorization Grant (IETF Draft)](https://datatracker.ietf.org/doc/draft-ietf-oauth-identity-assertion-authz-grant/) – the emerging standard that powers this flow

