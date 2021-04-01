---
layout: blog_post
title: Developer Blog Create App Instructions
permalink: /blog/cli
---

<style>
hr { border: unset; margin: 0 }
.separator { height: 2px; background: silver }
</style>

**Table of Contents**{: .hide }
* Table of Contents
{:toc}

## Use the Okta CLI to Register Your App

To describe how to setup a new application on Okta, you can use `cli.md`, `maven.md`, and `oidcdebugger.md` includes.

These will render instructions using the [Okta CLI](https://cli.okta.com) (or [Okta Maven Plugin](https://github.com/oktadeveloper/okta-maven-plugin)) and link to instructions for the Admin Console. Screenshots are discouraged because they're hard to keep up-to-date.
  
## Basic Syntax

The basic syntax using the Okta CLI to setup an app is:

{% raw %}
```markdown
{% include setup/cli.md type="spa" loginRedirectUri="http://localhost:3000/callback" %}
```
{% endraw %}

This will render the following HTML:

<div class="separator"></div>
{% include setup/cli.md type="spa" loginRedirectUri="http://localhost:3000/callback" %}
<div class="separator"></div>

## Configuration Options

Supported values for `type`: spa, web, native, service, and jhipster

Other parameters you can pass in:

|Parameter |Possible values  |
--- | --- |
|`framework`|Angular, React, Vue, Okta Spring Boot Starter, Spring Boot, Quarkus, ASP.NET Core|
|`loginRedirectUri`|Prints whatever you set, can be comma-delimited, or use an array for multiple values `[url1, url2]`|
|`logoutRedirectUri`|Prints whatever you set, or defaults if not set|
|`signup`|`false` reduces opening paragraph to one sentence|
|`note`|Prints whatever you set. See .NET example below|
|`adoc`|`true` required for posts written in `AsciiDoc`|

## Examples

This section shows you examples for different types of apps and frameworks.

### Angular

{% raw %}
```md
{% include setup/cli.md type="spa" framework="Angular" loginRedirectUri="http://localhost:4200/callback" %}
```
{% endraw %}

This will render the following HTML:

<div class="separator"></div>
{% include setup/cli.md type="spa" framework="Angular" loginRedirectUri="http://localhost:4200/callback" %}
<div class="separator"></div>

### React

{% raw %}
```md
{% include setup/cli.md type="spa" framework="React" loginRedirectUri="http://localhost:3000/callback" %}
```
{% endraw %}

This will render the following HTML:

<div class="separator"></div>
{% include setup/cli.md type="spa" framework="React" loginRedirectUri="http://localhost:3000/callback" %}
<div class="separator"></div>

### Vue

{% raw %}
```md
{% include setup/cli.md type="spa" loginRedirectUri="http://localhost:8080/callback" %}
```
{% endraw %}

This will render the following HTML:

<div class="separator"></div>
{% include setup/cli.md type="spa" loginRedirectUri="http://localhost:8080/callback" %}
<div class="separator"></div>

### Native with Ionic

{% raw %}
```md
{% include setup/cli.md type="native" 
   loginRedirectUri="http://localhost:8100/callback" 
   logoutRedirectUri="http://localhost:8100/logout" %}
```
{% endraw %}

This will render the following HTML:

<div class="separator"></div>
{% include setup/cli.md type="native" 
   loginRedirectUri="http://localhost:8100/callback"
   logoutRedirectUri="http://localhost:8100/logout" %}
<div class="separator"></div>

### Okta Spring Boot Starter

{% raw %}
```md
{% include setup/cli.md type="web" framework="Okta Spring Boot Starter"
loginRedirectUri="[http://localhost:8001/login/oauth2/code/okta,http://localhost:8002/login/oauth2/code/okta]"
logoutRedirectUri="[http://localhost:8001,http://localhost:8002]" %}
```
{% endraw %}

This will render the following HTML:

<div class="separator"></div>
{% include setup/cli.md type="web" framework="Okta Spring Boot Starter"
loginRedirectUri="[http://localhost:8001/login/oauth2/code/okta,http://localhost:8002/login/oauth2/code/okta]"
logoutRedirectUri="[http://localhost:8001,http://localhost:8002]" %}
<div class="separator"></div>

### ASP.NET Core

{% raw %}
```md
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
```md
{% include setup/cli.md type="service" %}
```
{% endraw %}

This will render the following HTML:

<div class="separator"></div>
{% include setup/cli.md type="service" %}
<div class="separator"></div>

### JHipster

{% raw %}
```md
{% include setup/cli.md type="jhipster" %}
```
{% endraw %}

This will render the following HTML:

<div class="separator"></div>
{% include setup/cli.md type="jhipster" %}
<div class="separator"></div>

### Maven

{% raw %}
```md
{% include setup/maven.md %}
```
{% endraw %}

This will render the following HTML:

<div class="separator"></div>
{% include setup/maven.md %}
<div class="separator"></div>

### OIDC Debugger

{% raw %}
```md
{% include setup/oidcdebugger.md %}
```
{% endraw %}

This will render the following HTML:

<div class="separator"></div>
{% include setup/oidcdebugger.md %}
<div class="separator"></div>

Example code is in the following posts:

- .NET: [10x-development-azure-cli-dotnet](/blog/2020/09/02/10x-development-azure-cli-dotnet)
- JHipster: [spring-session-redis](/blog/2020/12/14/spring-session-redis)
- Native with Ionic: [ionic-apple-google-signin](ionic-apple-google-signin)
- Okta Spring Boot Starter: [spring-cloud-config](http://localhost:4000/blog/2020/12/07/spring-cloud-config)
- Angular: [secure-angular-login](/blog/2019/02/12/secure-angular-login)
- React: [react-login](/blog/2020/12/16/react-login)
- Vue: [vue-login](/blog/2020/05/15/vue-login)
- Service: [simple-rest-api-php](/blog/2019/03/08/simple-rest-api-php)



