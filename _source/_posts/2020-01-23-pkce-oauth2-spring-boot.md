---
disqus_thread_id: 7829636038
discourse_topic_id: 17205
discourse_comment_url: https://devforum.okta.com/t/17205
layout: blog_post
title: "Use PKCE with OAuth 2.0 and Spring Boot for Better Security"
author: micah-silverman
by: advocate
communities: [java]
description: "PKCE guards against replay attacks with authorization codes, even for confidential clients."
tags: [oauth, oauth2, java, spring-boot, spring-security]
tweets:
- "Familiar with OAuth 2.0? Did you know that it's recommended to always use PKCE? It's easy with Okta's Spring Boot Starter!"
- "Use PKCE for confidential OAuth 2.0 clients with Okta's Spring Boot Starter."
image: blog/featured/okta-java-bottle-headphones.jpg
type: awareness
---

Browser and mobile feature enhancements move fast. Often times, these technologies move faster than security standards designed to protect them can keep up. OAuth 2.0 offers the best and most mature standard for modern applications. However, there hasn't been an official release of this standard since 2012. Eight years is a very long time in Internet technology years! That doesn't mean that its contributors have been sitting idly by. There is active work on the next version and in lieu of an official release, contributors will release "guidance" from time to time to keep up with evolving technology.

Last year, there were two important specification drafts submitted for review. These serve as the "updated guidance" for best practices when using OAuth 2.0. The first is `OAuth 2.0 Security Best Current Practice`. This is general best practices for securing modern applications with OAuth 2.0. The second draft is `OAuth 2.0 for Browser-Based Apps`. This is best practices specifically for web apps. In this post, I focus on the first draft with practical application for Spring Boot with Spring Security apps.

OAuth 2.0 is for delegated authorization and OpenID Connect is for identity and rides on top of OAuth 2.0.

Before we dive into the current best security practices for OAuth 2.0 and OpenID connect, let's first take a look at what these standards are for and why they're important.

## Three Minute Overview of OpenID Connect and OAuth 2.0

In the beginning, there were siloed websites that didn't talk to each other, and everyone was sad.

Sites like Yelp started wanting access to the contact information you had in your Google contacts. So, Yelp naturally collected your Google username and password so that it could access your contacts. You gave Yelp your permission, so this was all good, Yes? No! With your username and password, Yelp could access your email, your docs - everything you had in Google - not just your contacts. And, worse, Yelp had to store your password in a way that it could use it in plaintext and there was no standard way to revoke your consent to Yelp to access your Google account.

We needed an authorization framework that would allow you to grant access to certain information without you giving up your password. Cue OAuth.

### Use OAuth 2.0 for Delegated Authorization

Three revisions later, we're at OAuth 2.0 (there was 1.0 and 1.0a before it) and all's right with the world. Now, an application like Yelp (a Client Application) can request an Access Token from a service like Google (an Authorization Server). You (the Resource Owner) log into Google with your credentials and give your Consent to Yelp to access your contacts (and only your contacts). Access Token in hand, Yelp makes a request of the Google Contacts API (the Resource Server) and gets your contacts. Yelp never sees your password and never has access to anything more than you've consented to. And, you can withdraw your consent at any time.

### Use OpenID Connect for Identity

In this new world of consent and authorization, only one thing was missing: identity. Cue OpenID Connect. OIDC is a thin layer on top of OAuth 2.0 that introduces a new type of token: the Identity Token. Encoded within these cryptographically signed tokens in JWT format, is information about the authenticated user. This opened the door to a new level of interoperability and Single SignOn.

OAuth (and by extension OIDC) use a number of defined Flows to manage the interactions between the Client App, the Authorization Server and the Resource Server. In this post, I focus on the Authorization Code Flow. This flow is meant to be kicked off from your browser and goes like this:

1. Yelp wants access to your contacts. It presents a button to link your Google Contacts.
1. When you click the button, you're redirected to Google where you login with your username and password (if you're not already logged in).
1. Google shows you a screen telling you that Yelp would like read-only access to your contacts.
1. Once you give your consent, Google redirects back to Yelp, via your browser, with a temporary code (called an authorization code)
1. Using this code, Yelp contacts Google to trade it for an Access Token
1. Google validates the code and if all checks out, issues an Access Token with limited capabilities (read-only access to your contacts) to Yelp
1. Yelp then presents the Access Token to the Google Contacts API
1. Google Contacts API validates the token and, if the request matches the capabilities identified by the token, returns your contact list to Yelp

## Using Confidential Clients vs. Public Clients

Confidential clients run on a server and are under the complete control of the company that created the application. Spring Boot, .NET and Node.js are examples of confidential client type applications. Because they are run on servers and are usually behind a firewall with other safeguards, it is safe to configure a confidential client with a secret. In OAuth 2.0, this is referred to as the `Client Secret`. The Authorization server issues both a `Client Id` and a `Client Secret` for use in the application and this is how said application authenticates itself to the Authorization Server.

Public clients run in environments that cannot be controlled by entities like a company. Thesre are applications such as Single-Page applications (SPAs) or mobile or native applications. If a company has many users, it's likely that some percentage of those users have compromised machines or browsers. There's no way for the company to control this. It is not safe to store secrets in these types of applications, since they can be inspected and decompiled. In order to take advantage of the Authorization Code flow in a public client, an extension called Proof Key for Code Exchange (PKCE) is used.

PKCE was originally developed to make mobile and native applications using OAuth 2.0 more secure. Recently its use was extended to browser-based Singe-Page Apps. Now, PKCE is recommended even for confidential clients.

Examining the [Authorization Code Grant](https://tools.ietf.org/html/draft-ietf-oauth-security-topics-13#section-3.1.1) section of the security best practice guidance document, it states:

> Clients utilizing the authorization grant type MUST use PKCE [RFC7636] in order to (with the help of the authorization server) detect and prevent attempts to inject (replay) authorization codes into the authorization response.

That is, there's a security advantage to using PKCE even with confidential clients that are already authenticating themselves with a client secret.

While not complete, it is looking like the next revision of OAuth will simplify the standard to require that PKCE be used in all flows that involve an end-user (outside of the [Device Flow](https://tools.ietf.org/html/rfc8628)).

The latest version of [Spring Security](https://spring.io/projects/spring-security#learn) (5.2.1 as of this writing) supports OAuth 2.0 and OpenID Connect natively. It supports PKCE for public clients. It does not yet support PKCE for confidential clients. There is a pull request (written by my colleague, Brian Demers) that is expected to be incorporated into the next release. However, Spring Security is so well written and modular, that it is easy to hook into PKCE with a confidential client today to take advantage of the recommended best security practices.

Okta's own [Spring Boot Starter](https://github.com/okta/okta-spring-boot) makes it very easy to get started.

## Get Started with Okta's Spring Boot Starter

You can find the full source code this post [here](https://github.com/oktadeveloper/okta-spring-boot-oauth2-pkce-example) or head on over to [start.spring.io](https://start.spring.io) to quickly create a Spring Boot app with everything you need for a confidential client. The only starters you need are: Spring Web, Okta and [Thymeleaf](https://www.thymeleaf.org/). Okta automatically brings in Spring Security. Thymeleaf is used for html templates. The core of your `pom.xml` should look something like this:

```xml
<dependencies>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-thymeleaf</artifactId>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>
    <dependency>
        <groupId>com.okta.spring</groupId>
        <artifactId>okta-spring-boot-starter</artifactId>
        <version>1.3.0</version>
    </dependency>
</dependencies>
```

**NOTE:** The example code uses Java 11.

### Run the Application on Heroku with the Okta Add-On

The Okta Spring Boot starter requires only three properties:

* `okta.oauth2.issuer`
* `okta.oauth2.client-id`
* `okta.oauth2.client-secret`

There's an additional property used in this app for controlling whether or not PKCE will be used:

* `okta.oauth2.pkce-always`

For the purposes of demonstrating the app, you can also set the logging level for the web client to `DEBUG` so that you can see what the POST looks like when it exchanges the authorization code for tokens. That looks like this:

* `logging.level.org.springframework.web.client=DEBUG`

Using your free [Heroku](https://heroku.com) account, you can easily deploy the application by clicking this button: [![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/oktadeveloper/okta-spring-boot-oauth2-pkce-example)

**NOTE:** Clicking the deploy to heroku button will allocate an Okta org for you, create an Okta OpenID Connect web application, deploy the example application and set all the environment variables for the application to run. Watch this video to learn more about the [Okta Heroku Add-On](https://www.youtube.com/watch?v=ZRBXgLTMvuY).

**NOTE:** It's also be useful to have the [heroku command line](https://devcenter.heroku.com/articles/heroku-cli) tool installed, if you don't already have it.

By default, the application is set to run without using PKCE. Let's see that in action first. A user was created as part of the Okta org creation process. To see the username and password that was automatically generated for you, use the following command:

```bash
heroku config --app peaceful-citadel-41978
```

(Replace `peaceful-citadel-41978` with whatever you named the app)

You'll see output like this:

```bash
=== peaceful-citadel-41978 Config Vars
LOGGING_LEVEL_ORG_SPRINGFRAMEWORK_WEB_CLIENT: DEBUG
OKTA_ADMIN_EMAIL:                             109cd922-ab20-468e-a41d-01f986553087@heroku.okta.com
OKTA_ADMIN_PASSWORD:                          A$1169b533-cfe9-466c-9355-07d7a922981a
OKTA_CLIENT_ORGURL:                           https://dev-155005.okta.com
OKTA_CLIENT_TOKEN:                            007pm-Knwql_WrDDJIEFa74tt5WuuXh564kdPZsgni
OKTA_OAUTH2_CLIENT_ID_SPA:                    0oaztv4iSIaEcJRxS4x5
OKTA_OAUTH2_CLIENT_ID_WEB:                    0oazsmh9j6TegkxYD4x5
OKTA_OAUTH2_CLIENT_SECRET_WEB:                70nx3iG-mxzufsjYeb1-Gn5CUeo_n3slTpzBuliI
OKTA_OAUTH2_ISSUER:                           https://dev-155005.okta.com/oauth2/default
OKTA_OAUTH2_PKCE_ALWAYS:                      true
```

### See PKCE in Action

Now, you can navigate to the application (incognito window recommended): `https://peaceful-citadel-41978.herokuapp.com`. When you click the **Profile** button, you'll be redirected to your newly created Okta org. Enter the username and password using the `OKTA_ADMIN_EMAIL` and `OKTA_ADMIN_PASSWORD` values you saw from the config output above to login. At this point you need to set a security question for the user account as this is the first login. This is a one-time operation.

After you login, you're then redirected back to the app and you'll see your profile information.

To see some of what was happening internally, take a look at the application logs with this command:

```bash
heroku logs --app peaceful-citadel-41978
```

Close to the bottom of the output, you should see logging information about the `POST` request to the token endpoint:

```bash
o.s.web.client.RestTemplate              : HTTP POST https://dev-155005.okta.com/oauth2/default/v1/token
o.s.web.client.RestTemplate              : Accept=[application/json, application/*+json]
o.s.web.client.RestTemplate              : Writing [{grant_type=[authorization_code], code=[qNkdyHI1spPxPjDicBUE], redirect_uri=[https://peaceful-citadel-41978.herokuapp.com/login/oauth2/code/okta]}] as "application/x-www-form-urlencoded;charset=UTF-8"
o.s.web.client.RestTemplate              : Response 200 OK
```

Notice that it has `grant_type`, `code` and `redirect_uri` parameters. This is part of the regular authorization code flow.

Once you've gotten this far, the application is basically working as expected. Next, you'll update an environment variable to make the application use PKCE. Run the following:

```bash
heroku config:set OKTA_OAUTH2_PKCE_ALWAYS=true --app peaceful-citadel-41978
```

The application will restart. You can revisit the logs and keep the log output running by issuing the following command:

```bash
heroku logs -t --app peaceful-citadel-41978
```

In a new incognito window, navigate back to the application and login as before. This time, the log output for the token exchange looks like this:

```bash
o.s.web.client.RestTemplate              : HTTP POST https://dev-155005.okta.com/oauth2/default/v1/token
o.s.web.client.RestTemplate              : Accept=[application/json, application/*+json]
o.s.web.client.RestTemplate              : Writing [{grant_type=[authorization_code], code=[8z1EyS94F0WxWzI8Fx5h], redirect_uri=[https://peaceful-citadel-41978.herokuapp.com/login/oauth2/code/okta], code_verifier=[ugQLbLiF-IzJctR6TZkJBpgC6P38HrOpsr8vmYTYD7NAQLVIeMjQshst43S1NQtpaxL69pBRqEx-tpxixi1D4z7FOHiOctV6Gjn6DBN3CFmeMv-lvf_xMH4qzsvDZFmJ]}] as "application/x-www-form-urlencoded;charset=UTF-8"
o.s.web.client.RestTemplate              : Response 200 OK
```

Notice that this time, the output includes a `code_verifier` parameter. This indicates that PKCE was used in the initial authorization step and is being used in the token step as well.

Next, we'll examine the code that makes this all work.

## Making PKCE Work for Confidential Clients in Spring Security

The good news for us is that most of what we need to support PKCE is already built into Spring Security. The only issue is that Spring Security doesn't currently support PKCE for confidential clients. We can remedy this by using the existing architecture to change the default behavior. First, we need a custom authorization request resolver.

```java
public class CustomAuthorizationRequestResolver implements OAuth2AuthorizationRequestResolver {

    private OAuth2AuthorizationRequestResolver defaultResolver;
    private final StringKeyGenerator secureKeyGenerator =
        new Base64StringKeyGenerator(Base64.getUrlEncoder().withoutPadding(), 96);

    public CustomAuthorizationRequestResolver(ClientRegistrationRepository repo, String authorizationRequestBaseUri) {
        defaultResolver = new DefaultOAuth2AuthorizationRequestResolver(repo, authorizationRequestBaseUri);
    }

    @Override
    public OAuth2AuthorizationRequest resolve(HttpServletRequest servletRequest) {
        OAuth2AuthorizationRequest req = defaultResolver.resolve(servletRequest);
        return customizeAuthorizationRequest(req);
    }

    @Override
    public OAuth2AuthorizationRequest resolve(HttpServletRequest servletRequest, String clientRegistrationId) {
        OAuth2AuthorizationRequest req = defaultResolver.resolve(servletRequest, clientRegistrationId);
        return customizeAuthorizationRequest(req);
    }

    private OAuth2AuthorizationRequest customizeAuthorizationRequest(OAuth2AuthorizationRequest req) {
        if (req == null) { return null; }

        Map<String, Object> attributes = new HashMap<>(req.getAttributes());
        Map<String, Object> additionalParameters = new HashMap<>(req.getAdditionalParameters());
        addPkceParameters(attributes, additionalParameters);
        return OAuth2AuthorizationRequest.from(req)
            .attributes(attributes)
            .additionalParameters(additionalParameters)
            .build();
    }

    private void addPkceParameters(Map<String, Object> attributes, Map<String, Object> additionalParameters) {
        String codeVerifier = this.secureKeyGenerator.generateKey();
        attributes.put(PkceParameterNames.CODE_VERIFIER, codeVerifier);
        try {
            String codeChallenge = createHash(codeVerifier);
            additionalParameters.put(PkceParameterNames.CODE_CHALLENGE, codeChallenge);
            additionalParameters.put(PkceParameterNames.CODE_CHALLENGE_METHOD, "S256");
        } catch (NoSuchAlgorithmException e) {
            additionalParameters.put(PkceParameterNames.CODE_CHALLENGE, codeVerifier);
        }
    }

    private static String createHash(String value) throws NoSuchAlgorithmException {
        MessageDigest md = MessageDigest.getInstance("SHA-256");
        byte[] digest = md.digest(value.getBytes(StandardCharsets.US_ASCII));
        return Base64.getUrlEncoder().withoutPadding().encodeToString(digest);
    }
}
```

**NOTE**: The `addPkceParameters` and `createHash` methods are borrowed from the existing `org.springframework.security.oauth2.client.web.DefaultOAuth2AuthorizationRequestResolver` found in the current version of the Spring Security source code.

The `customAuthorizationRequest` method is where the action is. Assuming the `OAuth2AuthorizationRequest` parameter is not null, the code:

1. grabs any existing attributes and additional parameters maps from the request
1. adds the required pkce attributes and additional parameters to the existing maps for each
1. builds and returns a new `OAuth2AuthorizationRequest` that includes the pkce attributes and additional parameters maps.

In essentially four lines of code, we alter the original authorization request to include PKCE paramters.

You can monitor the authorization request in your browser developer tools. The request will looks something like this (newlines added for readability):

```bash
https://dev-155005.okta.com/oauth2/default/v1/authorize?
response_type=code&
client_id=0oazsmh9j6TegkxYD4x5&
scope=openid%20profile%20email%20address%20phone%20offline_access&
state=ZQaSXDRv-GBuBPkB4DMkbmgthkMGmkImT49iCV5Wvyg%3D&
redirect_uri=https://peaceful-citadel-41978.herokuapp.com/login/oauth2/code/okta&
nonce=cJMgCAlCt_RpVuxb-p1dZ3TEOem1m7JR_NIXot_WM9s&
code_challenge=Hu9YyH7gPbfpK650J7H_cYHIrPNad6UE_DupSUV2mGE&
code_challenge_method=S256
```

The `code_challenge` and `code_challenge_method` parameters are the query string parameters added by our `addPkceParameters` method above. The ordinary authorization code flow does not include these additional parameters.

The nice thing here is that once you've added the PKCE paramters on the authorization step, Spring Security automatically includes the `code_verifier` on the token step without any additional code required.

There's one bit of housekeeping that needs to be done to tie this all together. We need to tell Spring Security to use the `CustomAuthorizationRequestResolver`. We do this with a security configuration.

### Tell Spring Security to Use the Custom Authorization Request Resolver

Take a look at `SecurityConfig.java`:

```java
@Configuration
public class SecurityConfig extends WebSecurityConfigurerAdapter {

    private ClientRegistrationRepository clientRegistrationRepository;
    private Environment env;

    public SecurityConfig(ClientRegistrationRepository clientRegistrationRepository, Environment env) {
        this.clientRegistrationRepository = clientRegistrationRepository;
        this.env = env;
    }

    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http
            .authorizeRequests()
            .antMatchers("/", "/img/**")
            .permitAll()
            .anyRequest()
            .fullyAuthenticated();

        if (Boolean.valueOf(env.getProperty("okta.oauth2.pkce-always"))) {
            http
                .oauth2Login()
                .authorizationEndpoint()
                .authorizationRequestResolver(new CustomAuthorizationRequestResolver(
                    clientRegistrationRepository, DEFAULT_AUTHORIZATION_REQUEST_BASE_URI
                ));
        }
    }
}
```

The first part of the `configure` method is standard Spring Security configuration. Here, we express that the home page (`/`) and anything under the static `img` folder does not require authentication. Any other path will require authentication.

The second part of the `configure` method checks for the `okta.oauth2.pkce-always` environment variable and if set, configures Spring Security's `authorizationRequestResolver` with our `CustomAuthorizationRequestResolver`.

With the security configuration in place, we can now ensure that the application uses PKCE for OAuth 2.0, thus enhancing the overall security of the application.

## Good News Everyone!

In the very near future, once the [spring-security#7804](https://github.com/spring-projects/spring-security/pull/7804) pull request is merged and a new version of Spring Security is released (as well as the new version of the Spring Boot Spring Security Starter), you won't need to use the custom authorization request resolver and the security configuration as shown above. PKCE with confidential clients will be the default behavior.

This is aligned with the current security best practices as outlined in the [Authorization Code Grant](https://tools.ietf.org/html/draft-ietf-oauth-security-topics-13#section-3.1.1) section.

To see the two OAuth 2.0 best practices guidance specifications referenced in this post, use these links:

* [OAuth 2.0 Security Best Current Practice](https://tools.ietf.org/html/draft-ietf-oauth-security-topics-13)
* [OAuth 2.0 for Browser-Based Apps](https://tools.ietf.org/html/draft-parecki-oauth-browser-based-apps-00)

For more on OAuth 2.0 and OpenID Connect, I recommend these blog posts and videos:

* [OAuth 2.0 Java Guide: Secure Your App in 5 Minutes](/blog/2019/10/30/java-oauth2)
* [Use Okta Token Hooks to Supercharge OpenID Connect](/blog/2019/12/23/extend-oidc-okta-token-hooks)
* [An Illustrated Guide to OAuth and OpenID Connect](/blog/2019/10/21/illustrated-guide-to-oauth-and-oidc)
* [What's going on with the OAuth 2.0 Implicit Flow?](https://www.youtube.com/watch?v=CHzERullHe8)
* [OAuth 2.0 Access Tokens explained](https://www.youtube.com/watch?v=BNEoKexlmA4)
* [OAuth 2.0 and OpenID Connect (in plain English)](https://www.youtube.com/watch?v=996OiexHze0&t=5s)

For more on PKCE, I recommend a previous PKCE post I wrote and our documentation:

* [Implement the OAuth 2.0 Authorization Code with PKCE Flow](/blog/2019/08/22/okta-authjs-pkce)
* [Use the Authorization Code Flow with PKCE](/docs/guides/implement-auth-code-pkce/-/use-flow/)

If you like this blog post and want to see more like it, follow [@oktadev on Twitter](https://twitter.com/oktadev), subscribe to [our YouTube channel](https://youtube.com/c/oktadev), or follow us [on LinkedIn](https://www.linkedin.com/company/oktadev/). As always, please leave a comment below if you have any questions.
