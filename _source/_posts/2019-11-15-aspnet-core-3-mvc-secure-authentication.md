---
disqus_thread_id: 7719470286
discourse_topic_id: 17169
discourse_comment_url: https://devforum.okta.com/t/17169
layout: blog_post
title: "ASP.NET Core 3.0 MVC Secure Authentication"
author: lee-brandt
by: advocate
communities: [.net]
description: "Secure an ASP.NET Core 3.0 MVC app using OAuth2, OpenID Connect and Okta."
tags: [oauth, oauth2, oidc, openid-connect, aspnet-core, aspnet-core-3, dotnet-core, dotnet-core-3]
tweets:
- "Wanna learn how to secure your ASP.NET Core 3.0 MVC app with OAuth and OpenID Connect? Check this out!"
- "Check out this simple tutorial for setting up OAuth2 and OpenID Connect in your ASP.NET Core 3.0 MVC app!"
- "Set up authentication in ASP.NET Core 3.0 MVC!"
image: blog/featured/okta-dotnet-bottle-headphones.jpg
type: conversion
---

On September 23rd, Microsoft announced the third major release of its .NET Core framework. This new release boasts better performance, support for Windows Desktop apps, improved support for Docker containers, and more. Naturally, I was excited to see this new release and get authentication hooked into it with Okta! I put together this  tutorial to demonstrate how to quickly and securely set up user management with Okta and OIDC (OpenID Connect) in an ASP.NET Core 3.0 application.

To follow along, you will need:

- [DotNet Core 3.0](https://dotnet.microsoft.com/download/dotnet-core/3.0)
- I am using [Visual Studio Code](https://code.visualstudio.com/download) on Linux, but you should be able to follow along with [Visual Studio 2019](https://visualstudio.microsoft.com/downloads/)
- A [free forever Okta developer account](https://developer.okta.com/signup/)

## Scaffold an ASP.NET Core 3.0 MVC Application

To scaffold your new ASP.NET Core 3.0 MVC application, open a terminal window to where you want to store your source code and run:

```sh
dotnet new mvc -n AspNetCore3AuthExample
```

Then, change into the newly created directory and open up Visual Studio Code.

```sh
cd AspNetCore3AuthExample
code .
```

You should be asked to restore missing components (the `.vscode` folder) that will allow you to easily run the app with a quick press of **F5**. Click **Yes** and the folder and files will be added for you. From there, you can run the application and see the base MVC application running.

## Configure an Application in Okta

Once you've [signed up for a free developer account on Okta](https://developer.okta.com/signup/), log in to your dashboard and click the **Applications** menu item, then click the **Add Application** button.

On the first screen, choose **Web** as the platform then click the **Next** button.

{% img blog/aspnet-core-3-secure-authentication/okta-choose-platform.png alt:"Okta Choose Platform" width:"700" %}{: .center-image }

On the **Application Settings** screen, give your application a name (I chose "Sample ASP.NET Core 3 OIDC") and update the **Base URIs** and **Login redirect URIs** values to use `https` and port 5001, then click **Done**.

{% img blog/aspnet-core-3-secure-authentication/okta-app-settings.png alt:"Okta App Settings" width:"700" %}{: .center-image }

Once complete, you will be redirected to the **General** tab of the application settings. Click **Edit** in the top right corner to update a  few values. 

First, change the **Login redirect URIs** value to `https://localhost:5001/signin-oidc` and update the **Logout redirect URIs** value to`https://localhost:5001/signout-callback-oidc`, then click **Save**. These values update the Okta settings to align with what the ASP.NET Core OIDC middleware expects.

When you first created an Okta account, it automatically set up an AS (Authorization Server) for you called `default`.Your next step is to add groups as a claim for authenticated users.  

To view the settings for your default AS, hover over the **API** menu item at the top of the page and click on the **Authorization Servers** menu item in the dropdown. From the list of Authorization Servers, choose **default** to l see the settings page for the default AS. From the settings page, select the **Claims** tab and click on the **Add Claim** button. In the **Add Claim** dialog add and select the values as shown:

{% img blog/aspnet-core-3-secure-authentication/okta-add-claim-dialog.png alt:"Okta Add Claim" width:"700" %}{: .center-image }

This will add the `groups` claim to the ID Token when a user authenticates. Lastly, go to your application's **General Settings** and make note of the **Client ID** and **Client Secret** values. You will be using those to configure your application.

## Configure Your ASP.NET Core 3 MVC App for Authentication

In VS Code, open up the `appsettings.Development.json` file and add a new section below the `Logging` section so that your completed file looks like this:

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Debug",
      "System": "Information",
      "Microsoft": "Information"
    }
  },
  "Okta": {
    "ClientId": "{yourClientId}",
    "ClientSecret": "{yourClientSecret",
    "Domain": "https://{yourOktaDoomain}",
    "PostLogoutRedirectUri": "https://localhost:5001/"
  }
}
```

>CAUTION: It's important that you never commit sensitive information to your repository. This becomes another attack vector for attackers. For production client IDs and secrets consider using a Key Management Service (KMS) such as AWS Key Management Service or Azure Key Vault.

Before setting up the OpenID Connect middleware for ASP.NET Core 3, you'll need to install the NuGet package for it:

```sh
dotnet add package Microsoft.AspNetCore.Authentication.OpenIdConnect --version 3.0.0
```

Then add a few `using` statements to bring in:

```cs
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.IdentityModel.Protocols.OpenIdConnect;
using Microsoft.IdentityModel.Tokens;
```

>TIP: You can always just cut and paste the code below and use the key-chord `CTRL+.` to have VS Code (and Visual Studio) add the `using` statements for you.

Use the **Client ID** and **Client Secret** values from the **General Settings** tab of your application in Okta. Your Okta Domain is listed in the top right corner of your Okta dashboard and looks something like `https://dev-123456.okta.com`.

Use these values to set up the OIDC configuration in `startup.cs`. In the `ConfigureServices()` method, before the `services.AddControllerWithViews();` call, add the following code:

```cs
services.AddAuthentication(options =>
{
  options.DefaultScheme = CookieAuthenticationDefaults.AuthenticationScheme;
  options.DefaultChallengeScheme = OpenIdConnectDefaults.AuthenticationScheme;
})
.AddCookie()
.AddOpenIdConnect(options =>
{
  options.SignInScheme = CookieAuthenticationDefaults.AuthenticationScheme;
  options.Authority = Configuration["Okta:Domain"] + "/oauth2/default";
  options.RequireHttpsMetadata = true;
  options.ClientId = Configuration["Okta:ClientId"];
  options.ClientSecret = Configuration["Okta:ClientSecret"];
  options.ResponseType = OpenIdConnectResponseType.Code;
  options.GetClaimsFromUserInfoEndpoint = true;
  options.Scope.Add("openid");
  options.Scope.Add("profile");
  options.SaveTokens = true;
  options.TokenValidationParameters = new TokenValidationParameters
  {
    NameClaimType = "name",
    RoleClaimType = "groups",
    ValidateIssuer = true
  };
});

services.AddAuthorization();
```

While it may look like there's a lot to unpack here, all you really did was add `AddAuthentication()`, `AddCookie()`, `AddOpenIdConnect()`, and `AddAuthorization()`. The rest of it is configuration options.

Starting from the top, you told ASP.NET's authentication middleware to use cookies as the authorization scheme and to use OpenID Connect to authenticate. The `AddCookie()` method with no options passed to it simply lets the middleware know to use the default setup for cookies.

The `AddOpenIdConnect()` tells the middleware you want to use OpenID Connect and sets the OpenID Connection options. You told OpenID Connect you'll be using "Cookies" as the authentication scheme and  set values in the options pulled from the `appSettings.Development.json` file you just edited. You'll notice I added `oauth2/default` to the `Okta:Domain` value - this is the path to your default authorization server.

The `ResponseType` options lets the middleware know to use the [authorization code flow](https://developer.okta.com/docs/guides/implement-auth-code/overview/) for authentication. Setting `GetClaimsFromUserInfoEndpoint` to true tells the middleware that it will need to make a call to the authorization server's `userinfo` endpoint to populate the user claims.

The `Scope`s added here are the `openid` and `profile` scopes. This tells the middleware that you want all the claims contained in those two scopes. `SaveTokens` determines whether the access and refresh tokens should be stored in the ASP.NET authentication properties.

`TokenValidationParameters` set a few more options for the OIDC set up. The `NameClaimType = "name"` lets the middleware know the `Name` property for `User` will be in the `name` claim in the token. The same goes for the `RoleClaimType`. 

Since you set the "groups" claim in Okta, you can map it to the roles list of the `User` object in your application. Finally, you told OpenID Connect to check that the issuer was valid by making sure it matches the `Authority` value from above.

`AddAuthorization()` turns on the authorization services for the ASP.NET middleware.

We have one last change to make in `Startup.cs`: add authentication to the `Configure()` method. Directly  before `app.UseAuthorization();`, add:

```cs
app.UseAuthentication();
```

Your app is now configured and ready to use OAuth2 and OpenID Connect for authentication and authorization!

## Add Authentication to Your ASP.NET Core 3 MVC App

Now that your app is configured to use Okta as the OpenID Connect Identity Provider, you can add the necessary plumbing to the app to actually utilize OpenID Connect for authentication.

Add a controller called `AccountController.cs` with the following content:

```cs
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.OpenIdConnect;
using Microsoft.AspNetCore.Mvc;

namespace DockerPipelineExample.Controllers
{
  public class AccountController : Controller
  {
    public IActionResult Login()
    {
      if(!HttpContext.User.Identity.IsAuthenticated)
      {
        return Challenge(OpenIdConnectDefaults.AuthenticationScheme);
      }
      return RedirectToAction("Index", "Home");
    }

    public IActionResult Logout()
    {
      return new SignOutResult(new[]
      {
        OpenIdConnectDefaults.AuthenticationScheme,
        CookieAuthenticationDefaults.AuthenticationScheme
      });
    }
  }
}
```

The two actions here simply kick off an OpenID Connect challenge on `Login()` and get the `SignOutResult()` in the `Logout()` action. You've already seen the `AuthenticationScheme` string literals in the configuration. 

Now you need to add the user interface elements to kick off login and logout. In the `/Views/Shared` folder, add a file called `_LoginPartial.cshtml` and add the following code to it.

```html
@if (User.Identity.IsAuthenticated)
{
  <ul class="navbar-nav">
    <li>
      <span class="navbar-text">Hello, @User.Identity.Name</span> &nbsp;
      <a onclick="document.getElementById('logout_form').submit();" style="cursor: pointer;">Log out</a>
    </li>
  </ul>
  <form asp-controller="Account" asp-action="Logout" method="post" id="logout_form"></form>
}
else
{
  <ul class="navbar-nav">
    <li><a asp-controller="Account" asp-action="Login">Log in</a></li>
  </ul>
}
```

This will give you a little "chunk" of UI that you can inject into your main page layout. So in the `_Layout.cshtml` file, add the login partial right before the close of the `div` with a `navbar-collapse` class, like:

```html
<div class="navbar-collapse collapse justify-content-between">
  <ul class="navbar-nav mr-auto">
    <li class="nav-item">
      <a class="nav-link text-dark" asp-area="" asp-controller="Home" asp-action="Index">Home</a>
    </li>
    <li class="nav-item">
      <a class="nav-link text-dark" asp-area="" asp-controller="Home" asp-action="Privacy">Privacy</a>
    </li>
  </ul>
  <partial name="_LoginPartial" />
</div>
```

You'll also notice I replaced the `d-sm-inline-flex flex-sm-row-reverse` classes on the main `div` with `justify-content-between`. This pushes the login partial to the right of the main menu bar while keeping the menu items on the left and justifying the content between them.

Now you can fire up the app and log in with your username and password you use for signing in to Okta!

## Add Authorization to your ASP.NET Core 3 MVC App

Because you mapped the authenticated user's roles from the groups claim you set up in Okta, adding authorization becomes drop-dead simple. Add a new action to your `HomeController.cs` file:

```cs
[Authorize(Roles="Everyone")]
public IActionResult Everyone()
{
  return View();
}
```

Make sure to add the using statement for the `Authorize` decorator.

```cs
using Microsoft.AspNetCore.Authorization;
```

Add a view to the `/Views/Home` folder called `Everyone.cshtml` with one simple text line:

```html
This page is for people in the "Everyone" group.
```

Make sure to add a menu item. I just copied the existing privacy link in `_Layout.cshtml` and changed the values like this:

```html
<li class="nav-item">
    <a class="nav-link text-dark" asp-area="" asp-controller="Home" asp-action="Everyone">Everyone</a>
</li>
```

You can check this isn't a false positive by changing the `Roles` value passed into the `Authorize` decorator to something else. I always use `Roles="Dancers"` because I _know_ I'm not in _that_ group.

Then when you log in and try to go to the Everyone page, you should be redirected to an `/Account/AccessDenied` page. To handle this more gracefully, you can add an action handler to the `AccountController` and a view to display a more user friendly message.

If you want the final code for this post, you can get it [on GitHub](https://github.com/oktadeveloper/okta-aspnet-core-3-oidc-example).

## Learn More About OpenID Connect and ASP.NET

If you want to learn more about OAuth2, OpenID Connect, or ASP.NET in general, check out these other great pieces of content!

- [User Authorization in ASP.NET Core with Okta](/blog/2017/10/04/aspnet-authorization)
- [An Illustrated Guide to OAuth and OpenID Connect](https://www.youtube.com/watch?v=t18YB3xDfXI)
- [Build a CRUD App with ASP.NET Core 2.2 and Entity Framework Core](/blog/2019/04/03/build-a-crud-app-with-aspnet-22-and-entity-framework)

As always, feel free to hit us up in the comments below. Also, don't forget to follow us on [Twitter](https://twitter.com/oktadev) and check out our [YouTube Channel](https://youtube.com/c/oktadev)!
