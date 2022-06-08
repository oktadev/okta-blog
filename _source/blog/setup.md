---
layout: blog_post
title: How to Create an OIDC App on Okta
description: "Use the Okta CLI to manage your Okta apps. It's so easy, it's fun!"
permalink: /blog/setup
image: blog/cli/okta-cli.png
comments: false
---

<style>
.BlogPost-title { margin: 0 }
.logo { float: right; margin: 50px }
@media screen and (max-width: 600px) {
  .logo {
    display: none;
  }
}
.separator { height: 2px; background: #DD2864 }
</style>

This page is designed for authors of the Okta developer blog. However, these snippets of code might be useful for anyone wanting to set up Okta OIDC apps.

{% img blog/cli/okta-cli-animated.svg alt:"Okta CLI" width:"300" %}{: .logo }

**Table of Contents**{: .hide }
* Table of Contents
{:toc}

## Use the Okta CLI to Register Your App

To describe how to set up a new application on Okta, you can use `cli.md`, `maven.md`, and `oidcdebugger.md` includes.

These will render instructions using the [Okta CLI](https://cli.okta.com) (or [Okta Maven Plugin](https://github.com/oktadev/okta-maven-plugin)) and link to instructions for the Admin Console. Screenshots are discouraged because they're hard to keep up-to-date.
  
## Blog Post Syntax

The basic syntax you will need to use the Okta CLI in your post is:

{% raw %}
```
{% include setup/cli.md type="spa" loginRedirectUri="http://localhost:3000/callback" %}
```
{% endraw %}

This will render the following HTML:

<div class="separator"></div>
{% include setup/cli.md type="spa" loginRedirectUri="http://localhost:3000/callback" %}
<div class="separator"></div>

## Configuration Options

Supported values for `type`: spa, web, native, service, token, and jhipster

Other parameters you can pass in:

|Parameter |Possible values  |
--- | --- |
|`framework`|Angular, React, Vue, Okta Spring Boot Starter, Spring Boot, Quarkus, ASP.NET Core|
|`loginRedirectUri`|Prints whatever you set, can be comma-delimited, or use an array for multiple values `[url1, url2]`|
|`logoutRedirectUri`|Prints whatever you set, or defaults if not set|
|`signup`|`false` reduces opening paragraph to one sentence|
|`note`|Prints whatever you set. See .NET example below|
|`install`|`false` removes 'Install the Okta CLI' sentence|

## Examples

This section shows examples for different types of apps and frameworks.

* [Angular](#angular), [React](#react), [Vue](#vue)
* [Node + Express](#node--express)
* [Ionic](#native-with-ionic)
* [React Native](#react-native)
* [Spring Boot](#okta-spring-boot-starter)
* [ASP.NET Core](#aspnet-core)
* [Service](#service)
* [JHipster](#jhipster)

### Angular

{% raw %}
```
{% include setup/cli.md type="spa" framework="Angular" loginRedirectUri="http://localhost:4200/callback" %}
```
{% endraw %}

This will render the following HTML:

<div class="separator"></div>
{% include setup/cli.md type="spa" framework="Angular" loginRedirectUri="http://localhost:4200/callback" %}
<div class="separator"></div>

### React

{% raw %}
```
{% include setup/cli.md type="spa" framework="React" loginRedirectUri="http://localhost:3000/callback" %}
```
{% endraw %}

This will render the following HTML:

<div class="separator"></div>
{% include setup/cli.md type="spa" framework="React" loginRedirectUri="http://localhost:3000/callback" %}
<div class="separator"></div>

### Vue

{% raw %}
```
{% include setup/cli.md type="spa" framework="Vue"
   loginRedirectUri="http://localhost:8080/callback" signup="false" %}
```
{% endraw %}

This will render the following HTML:

<div class="separator"></div>
{% include setup/cli.md type="spa" framework="Vue" 
   loginRedirectUri="http://localhost:8080/callback" signup="false" %}
<div class="separator"></div>

### Node + Express

{% raw %}
```
{% include setup/cli.md type="web" loginRedirectUri="http://localhost:8080/authorization-code/callback" %}
```
{% endraw %}

This will render the following HTML:

<div class="separator"></div>
{% include setup/cli.md type="web" loginRedirectUri="http://localhost:8080/authorization-code/callback" %}
<div class="separator"></div>

### Ionic

{% raw %}
```
{% include setup/cli.md type="native" 
   loginRedirectUri="[http://localhost:8100/callback,com.okta.dev-133337:/callback]" 
   logoutRedirectUri="[http://localhost:8100/logout,com.okta.dev-133337:/logout]" %}
```
{% endraw %}

This will render the following HTML:

<div class="separator"></div>
{% include setup/cli.md type="native" 
   loginRedirectUri="[http://localhost:8100/callback,com.okta.dev-133337:/callback]" 
   logoutRedirectUri="[http://localhost:8100/logout,com.okta.dev-133337:/logout]" %}
<div class="separator"></div>

### React Native 

{% raw %}
```
{% include setup/cli.md type="native" 
   loginRedirectUri="com.okta.dev-133337:/callback" 
   logoutRedirectUri="com.okta.dev-133337:/callback" %}
```
{% endraw %}

This will render the following HTML:

<div class="separator"></div>
{% include setup/cli.md type="native" 
   loginRedirectUri="com.okta.dev-133337:/callback" 
   logoutRedirectUri="com.okta.dev-133337:/callback" %}
<div class="separator"></div>

### Okta Spring Boot Starter

{% raw %}
```
{% include setup/cli.md type="web" framework="Okta Spring Boot Starter" %}
```
{% endraw %}

This will render the following HTML:

<div class="separator"></div>
{% include setup/cli.md type="web" framework="Okta Spring Boot Starter" %}
<div class="separator"></div>

### ASP.NET Core

{% raw %}
```
{% capture note %}
> Note that the TCP port 5001 must be the same used by the application. You can see it in the messages displayed in the terminal when you start the application with **`dotnet run`**.
{% endcapture %}
{% include setup/cli.md type="web" note=note framework="ASP.NET Core"
   loginRedirectUri="http://localhost:5001/authorization-code/callback"
   logoutRedirectUri="http://localhost:5001/signout/callback" %}
```
{% endraw %}

This will render the following HTML:

<div class="separator"></div>
{% capture note %}
> Note that the TCP port 5001 must be the same used by the application. You can see it in the messages displayed in the terminal when you start the application with **`dotnet run`**.
{% endcapture %}
{% include setup/cli.md type="web" note=note framework="ASP.NET Core"
   loginRedirectUri="http://localhost:5001/authorization-code/callback"
   logoutRedirectUri="http://localhost:5001/signout/callback" %}
<div class="separator"></div>

### Service

{% raw %}
```
{% include setup/cli.md type="service" %}
```
{% endraw %}

This will render the following HTML:

<div class="separator"></div>
{% include setup/cli.md type="service" %}
<div class="separator"></div>

### JHipster

{% raw %}
```
{% include setup/cli.md type="jhipster" %}
```
{% endraw %}

This will render the following HTML:

<div class="separator"></div>
{% include setup/cli.md type="jhipster" %}
<div class="separator"></div>

### API Token

{% raw %}
```
{% include setup/cli.md type="token" %}
```
{% endraw %}

This will render the following HTML:

<div class="separator"></div>
{% include setup/cli.md type="token" %}
<div class="separator"></div>

### Maven

{% raw %}
```
{% include setup/maven.md %}
```
{% endraw %}

This will render the following HTML:

<div class="separator"></div>
{% include setup/maven.md %}
<div class="separator"></div>

### OIDC Debugger

{% raw %}
```
{% include setup/oidcdebugger.md %}
```
{% endraw %}

This will render the following HTML:

<div class="separator"></div>
{% include setup/oidcdebugger.md %}
<div class="separator"></div>

## Example Blog Posts

Example code is in the following posts:

- .NET: [10x-development-azure-cli-dotnet](/blog/2020/09/02/10x-development-azure-cli-dotnet)
- JHipster: [spring-session-redis](/blog/2020/12/14/spring-session-redis)
- Native with Ionic: [ionic-apple-google-signin](ionic-apple-google-signin)
- Okta Spring Boot Starter: [spring-cloud-config](http://localhost:4000/blog/2020/12/07/spring-cloud-config)
- Angular: [secure-angular-login](/blog/2019/02/12/secure-angular-login)
- React: [react-login](/blog/2020/12/16/react-login)
- Vue: [vue-login](/blog/2020/05/15/vue-login)
- Service: [simple-rest-api-php](/blog/2019/03/08/simple-rest-api-php)
