---
layout: blog_post
title: "Okta Developer Office Hours - September 2019 Edition"
author: mraible
description: "We held developer office hours recently and answered a lot of questions!"
tags: [okta, developer, office hours]
tweets:
- "Did you miss our developer office hours in September? Good news: we recorded it!"
- "We answered quite a few developer questions in our September 2019 office hours. This blog post answers the ones we couldn't answer in real-time."
- "This blog post recaps our @oktadev office hours in September 2019. Thanks to all who attended!"
image: <need cool image>
---

On September 19, 2019, we held our first Okta Developer office hours. Our goal was to host a live Q & A with developers that use Okta. We had over 150 developers attend. 
 
 We [streamed the session live on YouTube](https://youtu.be/nGi8x5XppHI), so you can watch it below if you like.

<div style="text-align: center; margin-bottom: 1.25rem">
<iframe width="700" height="394" style="max-width: 100%" src="https://www.youtube.com/embed/nGi8x5XppHI" frameborder="0" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</div>

We received around 60 questions during our live-stream, and did not get a chance to answer them all. After close examination, we determined that many questions overlapped and ended up with 40 unique questions.

Since we couldn't answer all the questions in real-time, we decided to write up a blog post and answer all the questions we received. Without further ado, here's the list of questions and answers. If we answered it during the session, I added a link to the location in the video.

---- 
How does Okta manage session inactivity timeout on my personal organization dashboard? And how would I do this without logging users out of every custom application (i.e not SLO)? Thanks.

- live answered

OAuth doesn't have any built-in concept of multi-tenancy. For a web app that uses a service like Okta, what's the recommended way to support multiple tenants each with their own directory of users?

- live answered

We use Azure Active Directory, but create our own enterprise applications. We like to use Azure AD for SSO authentication. Does Okta have a product that can help me with this?

- live answered

Search users within a Group (Group Member Operations) is very limited. It only can list all users within a Group paged. There is no ability to filter/search and return sorted results. Any ideas how it can be improved?

- needs answer

What flow would you recommend for a React app, since the e.g.‚Äôs show an implicit flow which does not return a refresh token and the authorization code flow relies on a secure back channel which the browser is not.

- live answered
We added support for auth code flow with PKCE in our React SDK‚Äôs 1.2.2 release. https://github.com/okta/okta-oidc-js/releases/tag/%40okta%2Fokta-react%401.2.1

I am integrating my Okta with my customers for a single sign-on (sso) experience. What Okta details I should share with my customers for IDP and SP initiated integration? Looking for Okta best practices for customer integration.

- needs answer

Any possibility of switching the default security questions within Okta in the future? We have received feedback that our end users aren't too happy with their choices.

- live answered

Does Okta recommend obtaining access token in the appliction based on an Id token vs Okta sending both id token and access token to a custom web application?

- needs answer

What are the options and a best way to secure your public APIs being called by client's websites from Web Browser?

- live answered

Is using Okta with AWS Cognito a common use case?  Any recommendations?

- needs answer

no User will be logged in

- delete question?

Do i need a API Gateway on prem to protect my 3rd party APIs which are also on prem. Do the API gateways maintian the tokens?

- live answered

how to secure an API that an end-user device needs to access in an automated way (programmatically), with no human involved who can actually authenticate to get an access token. think of IoT devices.

- live answered

How do I enable iFrame only for one app rather than the overal org? How do I secure it further?

- needs answer

Does Okta provision, update, and deprovision users to Azure AD?

- live answered

My company is currently signing a contract with Okta to begin in 2020. I have signed up with my own personal developer account in the meantime to get ahead of the game. Is there a big difference between my small developer sandbox and what my company will see?

- needs answer

What would you suggest for us to do? We are experiencing situations where our end users are experiencing expired or invalid activation tokens. Any possibility of self service regeneration of activation links?

- needs answer

Is it a good practice to pass your custom scope claims in Id token vs access token?

- live answered

Have there been any thought around Okta indicating to a user when their password has been changed? I didn't see any templates for that.

- live answered

Possibility of moving Okta Configurations between environments easily? It's been a hassle trying to keep track of our configurations to move up to our higher environments.

- needs answer

How can I use Okta to develop my own Identity providing service that is integrated with blockchain to deploy my own media platform and authenticate users that will be distributing media content on the platform.  We are developing the platform for iOS. This platform would also include streaming.

- live answered

Hi, Pretty new to okta. With IDP initiated service , how do we configure in okta to pass id token/access token to backend app rest api. we have grant type as implicit. Currently, it just passes the issuer.

- live answered

In our environment, when the user receives an email to activate their account via self-registration, it redirects them to our okta url rather than the application they self-registered for (we have multiple applications).  How do we redirect them to the site they registered for?

- live answered

Should I use SCIM or web hooks for user synchromization? Best practices?

- live answered

Can you force all permissions and policies to be inforced based on the permissions set in the Okta Universal Directory? Essentially using Okta Universal Directory for all policy enforcement and management.

- needs answer

When we started adopting Okta, I originally thought we'd go with SAML, since I understood that to be the "standard", and I also understood that proper authentication was a missing part of OAuth. However, with Open ID Connect (OIDC) that problem seems to have largely been addrssed. Should I ever consider SAML if OIDC exists?

- needs answer

I am trying to integrate Jumio Identity Verification with Okta. (Jumio takes a picture of your ID with a selfie and verifies that they are valid.) Should I try to make it another mfa option as part of a server? Sort of write a plugin? Can you point me to the documentation on how to get started?

- live answered (I think)

We are currently using Okta for OAuth/OIDC access for our customers through a mobile app. WE are now building internal tools that will require OAuth access for internal team members. Is it a good practice to mix external customers and internal team members in the same Okta account or should different Okta accounts be used and configured for their specific use cases?

- live answered (I think)

Is there a paid service available for organizations using the API Developer product so we can cofim wit experts and ensure that our Okta configuration and integration is being done properly?

- live answered (I think)

I'm integrating my Okta with my customers for a single sign-on (SSO) experience. What Okta details I should share with my customers for IDP and SP initiated integration? Looking for Okta best practices for customer integration.

- needs answer

Does Okta recommend obtaining access token in the application based on an ID token vs Okta sending both id token and access token to a custom web application?

- live answered (I think)

‚ÄãSWA apps are secure to use?

- not sure what this question is

Good morning! What is the best practice to deal with security for services (APIs) running inside a kubernetes cluster? Ingress controller running an API gateway (e.g. Kong)? Can Okta be used?

- live answered (I think)

What's the difference between using jose/jwt token based authentication vs okta identity management (oauth + oidc)

- live answered (I think)

Getting statistics on usage statistics of applications authenticated by Okta, what are the options? Sufficient details in the Okta access log?

- needs answer

For a REST API secured endpoint, what are the recommended access / refresh token lifespans?

- live answered (I think)

question about required actions... any out of the box solutions in octa? e.g. showing Privacy Policy page for the first login. One more question about user invitation flow.. any capabilities?

- live answered (I think)
