---
layout: blog_post
title: "OAuth SAML 2.0 Assertion Grant Type"
author:
by: advocate|contractor
communities: [devops,security,go]
description: "Learn how to setup the SAML 2.0 Grant Type and manually walk through the flow"
tags: [oauth2, oidc, go, saml2]
tweets:
- ""
- ""
- ""
image:
type: awareness|conversion
---

:toc: macro
:page-liquid:
:experimental:

Security Assertion Markup Language (SAML) is an open standard for exchanging authentication and authorization data between parties, in particular, between an identity provider and a service provider. The relationship between both providers sets up a trust relationship. The https://datatracker.ietf.org/doc/html/draft-ietf-oauth-saml2-bearer[SAML 2.0 Profile for OAuth 2.0 Client Authentication and Authorization Grants], allow an OAuth/OIDC client to use this existing trust. By providing a valid SAML Assertion to the authorization servers `/token` endpoint, the client can exchange an assertion for access/id tokens without requiring the client approval authorization step. This tutorial will demonstrate how to set up the grant type, then manually exchange a SAML Assertion for tokens. Afterward, an optional application can be configured to demonstrate the flow.

toc::[]

== What You'll Need
* Okta tenant
** don't have an Okta tenant, https://www.okta.com/free-trial/[create a new one here]
* https://golang.org/dl/[Golang] (1.16+) **if running the sample application**.

== Reference Okta Org
A preconfigured Okta Org exists so settings can be verified.   
To view the configurations, login to https://dev-96797994-admin.okta.com[https://dev-96797994-admin.okta.com] +
Credentials +
Username: `read.only` +
Password: `Th1sPassword` +

== Configure the SAML Service Provider Application
The same Okta Org will both generate and consume a SAML Assertion. So the OIDC application will consume a SAML Assertion from the same Org it is defined in. To accomplish this a SAML Service Provider application using `\https://httpbin.org/post` will be created. +

[start=1]
. In the Admin Console, navigate to **Applications** > **Applications**, click `Create App Integration`.
. Select **SAML 2.0**.
. Enter a **name** for your app and click `next`.
. For **Single sign on URL** enter `\https://httpbin.org/post`
. Uncheck **Use this for Recipient URL and Destination URL**
. Enter `\http://changeMeLater` for the **Recipient URL**, **Destination URL**, and **Audience URI**. These values will be updated later from the SAML Identity Provider.
. Click `Show advanced settings`.
. For **Response dropdown** select **Unsigned**
. Click `next`.
. Select **I'm an Okta customer adding an internal app**, followed by selecting **This is an internal app that we have created**.
. Click `finish`.
. Open the newly created application and click the `Sign On` tab.
. Click `View Setup Instructions`.
. Click `Download certificate`.
.. this will save the certificate with a `.cert` extension. Change this extension to `.pem`.
. Make note of the **Identity Provider Single Sign-On URL** and **Identity Provider Issuer**. These values will be used later.
. Assign a test user to the application.

NOTE: The SAML Service Provider Application is defined at ***Applications*** > ***Applications*** > ***Manual SAML Assertion Flow*** in the refrence Org.

== Configure the SAML Identity Provider
In Okta, configuring a SAML Identity Provider (IdP) means that Okta becomes the Service Provider (SP) and is capable of consuming a SAML Assertion sent from an external SAML IdP. In this sample, the same Okta Org serves as both IdP and SP.

[start=1]
. In the Admin Console, navigate to **Security** > **Identity Providers**.
. Click `Add Identity Provider` and select **Add SAML 2.0 IdP**.
. Enter a **Name** for your IdP.
. For **IdP Username** select **idpuser.subjectNameId**.
. Under **SAML Protocol Settings** for **Idp Issuer URI**, enter the **Identity Provider Issuer** value copied from the SP application in step 15. For **Idp Single Sign-On URL**, enter the **Identity Provider Single Sign-On URL** value copied from the SP application in step 15.
. For **IdP Signature Certificate** browse to the certificate downloaded from the SAML application and upload it.
. Click `Add Identity Provider`.
. Once the IdP is created click the `drop down arrow` on the left hand side of the IdP.
. Copy down the values of **Assertion Consumer Service URL** and **Audience URI**.

NOTE: The SAML IdP is defined at ***Security*** > ***Identity Providers*** > ***Manual SAML Assertion Flow IdP*** in the reference Org.

=== Finish Setting up the SAML Service Provider Application
Use the values from the SAML IdP to complete the SP configuration.

[start=1]
. In the Admin Console, navigate to **Applications** > **Applications**.
. Edit the SAML SP Application and navigate to the **General tab**.
. Under the **SAML Settings** click `Edit`.
. In the **General Settings** section click `Next`.
. For **Recipient URL** and **Destination URL** enter the value copied down for the **Assertion Consumer Service URL** from the SAML IdP. 
. For **Audience URI** use the value copied down for **Audience URI** from the SAML IdP.
. Click `Next` followed by `Finish` without making any changes.

IMPORTANT: The Single Sign On URL should still be `\https://httpbin.org/post`, which is where the SAML Response will be sent. The **Recipient** and **Audience** values will be set to a registered SAML IdP. In order for Okta to accept a SAML Assertion in the SAML Assertion Flow, the **Recipient** and **Audience** values in the Assertion _need_ to match the values of a SAML IdP registered in the Okta Org.

[start=8]
. From the **General tab** scroll down to the **App Embed Link** and copy the URL for later.

== Configure the OIDC Application
An OIDC application needs to be configured for the SAML Assertion Flow. A Native Application will be created for this.

[start=1]
. In the Admin Console, navigate to **Applications** > **Applications**.
. Click **Create App Integration**.
. Select **ODIC - OpenID Connect** as the **Sign-in method**, and **Native Application** as the **Application type**.
. Click `Next`
. Enter a name for your app integration. 
. In the **Grant type** section specify **SAML 2.0 Assertion**.
. In the **Assignments** section, select **Skip group assignment for now**.
. The rest of the default settings can be left, click `Save`.
. From the **General** tab click `Edit`, in the **Client Credentials** section select **Use Client Authentication**.
. Click `Save`.
. Assign the same test user to the application that was assigned to the SAML Service Provider Application.

NOTE: The OIDC Application is defined at ***Applications*** > ***Applications*** > ***SAML Assertion OIDC Flow*** in the reference Org.

== Configure the Authorization Server for the SAML Grant
An authorization server needs to be configured for the SAML Assertion Flow. For this example the **default** authorization server will be used.

[start=1]
. In the Admin Console, navigate to **Security** > **API**.
. On the Authorization Servers tab, select **default** from the Name column in the table.
. Select the **Access Policies** tab.
. For **Default Policy** in the **Assigned to clients** section, verify that either **All Clients** is set, or the OIDC application configured prior is set.
. Click the `pencil` for **Default Policy Rule** to edit.
. In the Edit Rule window, select **SAML 2.0 Assertion** in the **IF Grant type is** section if not currently enabled.
. Click `Update Rule`.

NOTE: The Authorization Server is defined at ***Security*** > ***API*** > ***Authorization Servers*** > ***default*** in the reference Org.

== Execute the SAML Assertion Flow
At this point everything should be setup and ready to run the SAML Assertion Flow.   

.Set up recap:
* A SAML Service Provider Application has been configured to send a SAML Assertion too `\https://httpbin.org/post`.
* A SAML Identity Provider has been configured that is able to validate the SAML Assertion sent to the SAML SP.
* An OIDC Application has been configured capable of of the SAML Assertion Flow.
* An Authorization Server has been configured that allows the SAML Assertion Grant type.

TIP: An OIDC App that is configured for the SAML Assertion Flow relies on a registered SAML Identity provider(s). There is no direct mapping between the app and the registered provider however, so a single app could accept assertions from multiple SAML IdPs.

The flow starts with Okta sending a SAML Response to the SAML Service Provider Application.

[start=1]
. Open a browser and enter the **App Embed Link** copied earlier from the SAML Service Provider Application in the address location.
. After login, if a valid Okta session doesn't exist your browser will redirect to `\https://httpbin.org/post` with a SAML Response.
. As part of the form data sent to `\https://httpbin.org/post` should be a **SAMLResponse**. Copy the contents of the SAMLResponse not including the opening/closing quotes.

image::{% asset_path 'blog/saml-assertion-flow-1/httpbin.png' %}[alt=SAML Response Sent to Service App,width=800,align=center]

[start=4]
. Navigate to `\https://www.base64decode.org`. 
. Keep the default settings and paste the **SAMLResponse** value in the top window.
. Click `DECODE`.
. In the **decoded content** search for the text **saml2:assertion**. There should be an opening and closing XML element. 
. Copy the contents of the assertion including both opening and closing **saml2:assertion** tags.

image::{% asset_path 'blog/saml-assertion-flow-1/resp_decoded.png' %}[alt=SAML Response Decoded,width=800,align=center]

[start=9]
. Navigate to `\https://www.base64encode.org`
. Keep the default settings and paste the **assertion** in the top window.
. Click `ENCODE`.

This produces the needed SAML assertion to make the `/token` call for your OIDC application.

image::{% asset_path 'blog/saml-assertion-flow-1/assertion_encoded.png' %}[alt=SAML Assertion Enecoded,width=800,align=center]

[start=12]
. With the encoded SAML Assertion, use https://curl.se/[cURL] or https://www.postman.com/[Postman] to make a call to the `/token` endpoint of the configured authorization server.

[source,sh]
----
curl --location --request POST 'https://{DOMAIN}.okta.com/oauth2/default/v1/token' \
--header 'Accept: application/json' \
--header 'Authorization: Basic MG9hMWJvOTcwMGpHb0J0UnU1ZDc6aXRtQTFtN1VsVjEwMFZmQW9EUjVWRWc5MFU0OHdEUTZpNEM2QmRGbg==' \
--header 'Content-Type: application/x-www-form-urlencoded' \
--data-urlencode 'grant_type=urn:ietf:params:oauth:grant-type:saml2-bearer' \
--data-urlencode 'scope=openid profile email offline_access' \
--data-urlencode 'assertion=PHNhbWwyOkFzc2VydGlvbi...FtbDI6QXNzZXJ0aW9uPg=='
----

TIP: The Authorization header is the base64 encoded value of the OIDC applications **client_id** and **client_secret** separated by a **colon**, Base64(client_id:client_secret)

[start=13]
. The call to `/token` should return the OAuth tokens.

[source,json]
----
{
    "access_token": "eyJraWQiOiJZSEdyS3VGY3JyM1h0...oIwH2tjRQ",
    "expires_in": 300,
    "id_token": "eyJraWQiOiJZSEdyS3VGY3JyM1h0TERZ...BekDjInNg",
    "scope": "profile email openid",
    "token_type": "Bearer"
}
----

== Common Problems
Configuring this flow often takes a bit of troubleshooting to get it dialed in correctly. Often the following error will be received during configuration,

[source,json]
----
{
    "error": "invalid_grant",
    "error_description": "'assertion' is not a valid SAML 2.0 Assertion."
}
----

.Common reasons:
* The audience/recipient in the SAML Assertion does not match what is configured in a registered SAML IdP in Okta.
* The SAML Assertion is not signed, or there is an algorithm mismatch.
* If using an Okta Org with a custom domain URL, the wrong issuer (URL) is useed.
* The full SAML Response was used instead of the Assertion.

== Sample Application

image::{% asset_path 'blog/saml-assertion-flow-1/sample.gif' %}[alt=Sample App,width=800,align=center]

If the above was configured successfully, you may want to try the sample application. It requires https://golang.org/dl/[Golang] (1.16+).

[source,sh]
----
git clone https://github.com/emanor-okta/saml-assertion-flow-samples.git
cd saml-assertion-flow-samples/saml-assertion-flow-with-okta
go mod tidy
go run main.go
----

The app is already configured for an existing Okta Org and can be tested as is.

* With the app running navigate to `\http://localhost:8080`
* Click `Get Tokens`
* This will invoke the embedded URL link for the SAML SP Application.
* When prompted for credentials use `read.only` / `Th1sPassword`
* The application will run through the flow displaying the various requests/responses of the flow.

=== Configure the app for Your Org

* With the app running navigate to `\http://localhost:8080` and click `Config`
* For ***Okta SAML Embed Link*** enter the **App Embed Link** from the SAML Service Application created.
* Click `Save SAML Settings`
* For ***Client ID*** enter the ID from the OIDC Application.
* For ***Client Secret*** enter the Secret from the OIDC Application.
* For ***Token URL*** enter `\https://{OKTA_ORG}/oauth2/default/v1/token`
* Click `Save OIDC Settings`

The final step is to edit the SAML SP Application to send the SAML Response to `\http://localhost:8080/samlresponse` instead of `\https://httpbin.org/post`.

* Navigate to ***Applications*** > ***Applications*** > {SAML_SERVICE_APP} > ***General*** > ***SAML Settings***
* Click `Edit`
* Click `Next` without any changes
* Under ***SAML Settings*** > ***General*** > ***Single sign on URL***, enter `\http://localhost:8080/samlresponse`
* Click `Next` without any other changes
* Click `Finish` without any changes

Click `Get Tokens` again, this time enter your own credentials 😎

== Wrap Up
Hopefully this provided valuable knowledge on how the SAML Assertion Grant type is setup in Okta. The next step is to integrate your own external SAML IdP.

* To learn about this and other Grant Types please visit https://developer.okta.com/docs/guides/implement-grant-type/authcode/main/[here]
* Interested in other potential use-cases for the SAML Assertion Grant flow
** SAML Assertion flow with https://www.keycloak.org/[Keycloak] and Okta https://github.com/emanor-okta/saml-assertion-flow-samples/tree/main/saml-assertion-flow-keycloak[sample application]
** SAML Assertion flow with an application generated assertion https://github.com/emanor-okta/saml-assertion-flow-samples/tree/main/self-generated/saml-assertion-flow-self-generated[sample application]




