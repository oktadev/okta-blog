---
layout: blog_post
title: "Using Azure Cognitive Services in a .NET App"
author: [giorgi-dalakishvili, alisa-duncan]
by: advocate
communities: [.net]
description: "This tutorial shows you how to call Azure Cognitive Services to verify faces and store profiles pics in Azure Storage in a .NET MVC app."
tags: [dotnet, dotnetcore, csharp, aspnet, aspnetcore, dotnet5, azure]
tweets:
- "Snap a selfie! 📸  Analyze and detect faces using #azure cognitive services in this #dotnet app!" 
- "Are you who you say you are? Analyze and detect faces using #azure cognitive services in this #dotnet app! 💻"
image: blog/net-azure-cognitive-services/azure-cognitive-services-social.jpg
type: conversion
github: https://github.com/oktadev/okta-dotnet-azure-cognitive-services-example
---

[Azure Cognitive Services](https://azure.microsoft.com/en-us/services/cognitive-services/) is a collection of cloud-based AI products from Microsoft Azure to add cognitive intelligence into your applications quickly. With Azure Cognitive Services, you can add AI capabilities using pre-trained models, so you don't need machine learning or data science experience. Azure Cognitive Services has vision, speech, language, and decision-making services.

In this article, you will learn how to use the Vision [Face API](https://docs.microsoft.com/en-us/azure/cognitive-services/face/) to perform facial analysis in a .NET MVC application and store user profile pictures in [Azure Blob Container Storage](https://azure.microsoft.com/en-us/services/storage/blobs/). You'll also authenticate with Okta and store user data as custom profile attributes.

At the end of this post, you'll be able to upload a profile picture in your app and get information about image error conditions, such as when zero or more than one face is detected or when your facial features don't match a new picture.

{% img blog/net-azure-cognitive-services/final.jpg alt:"Final project with user profile info and a profile picture." width:"800" %}{: .center-image }

{% img blog/net-azure-cognitive-services/errors.jpg alt:"Two error screenclips. One showing three faces detected instead of one, and the other with an unrecognized facial features." width:"800" %}{: .center-image }

{% include toc.md %}

**Prerequisites**
* Basic knowledge of C#
* [.NET 5.0 runtime and SDK](https://dotnet.microsoft.com/en-us/download/dotnet/5.0), which includes the .NET CLI
* Your favorite IDE that supports .NET projects, such as [Visual Studio](https://visualstudio.microsoft.com/downloads/), [Visual Studio for Mac](https://visualstudio.microsoft.com/vs/mac/), [VS Code](https://code.visualstudio.com/), or [JetBrains Rider](https://www.jetbrains.com/rider/)
* [Okta CLI](https://cli.okta.com/)
* A [Microsoft Azure Account](https://azure.microsoft.com/en-us/free/) (Azure free account)

## Create a new ASP.NET project

Let's create a new ASP.NET project. We'll use the [.NET CLI](https://docs.microsoft.com/en-us/dotnet/core/tools/) to scaffold the project.

Run the following commands to create the solution, the project, and add the project to the solution.

```shell
dotnet new sln -n OktaProfilePicture
dotnet new mvc --auth none --framework net5.0 -o OktaProfilePicture
dotnet sln add ./OktaProfilePicture/OktaProfilePicture.csproj
```

Now you can open the project in your favorite IDE and run the app to ensure everything runs correctly. If you are using the command line to build and serve, use the following commands.

```shell
dotnet build
dotnet run --project OktaProfilePicture
```

## Secure your app with Okta

You'll use Okta to secure the application quickly with Okta SDKs, so you don't have to spin up an identity provider and deal with the tricky details of authentication.

{% include setup/cli.md type="web" loginRedirectUri="https://localhost:5001/authorization-code/callback" logoutRedirectUri="https://localhost:5001/signout/callback" %}

Okta CLI will configure a new OIDC application and save some secret properties in the solution folder in a file called `.okta.env`. We'll use the values in the app.

Some of the values in the `.okta.env` are secret, and ideally, they should be in a trusted store or in [Secrets Manager](https://docs.microsoft.com/en-us/aspnet/core/security/app-secrets?view=aspnetcore-6.0&tabs=windows) for local development. Since you'll be making updates to configuration through this post, we'll use App Settings so you can set up your configuration as you go along.

Open `appsettings.Development.json` to add a new section, `Okta`, with authentication details of your app as shown below. The `Domain` is the URL of the `Issuer` value without the path segments.

```json
{
  "Logging": {
    "LogLevel": {
    "Default": "Information",
    "Microsoft": "Warning",
    "Microsoft.Hosting.Lifetime": "Information"
    }
  },
  "Okta": {
    "ClientId": "{clientId}",
    "ClientSecret": "{clientSecret}",
    "Domain": "https://{yourOktaDomain}"
  }
}
```

Let's add authentication to the app. Open a terminal window, then run the following command to add Okta's authentication middleware package.

```shell
dotnet add OktaProfilePicture package Okta.AspNetCore --version 4.0.0
```

To set up authentication services and register Okta's authentication middleware services, open `Startup.cs` and add the following code in the `ConfigureServices` method before the `services.AddControllersWithViews();`.

```csharp
services.AddAuthentication(options =>
  {
    options.DefaultAuthenticateScheme = CookieAuthenticationDefaults.AuthenticationScheme;
    options.DefaultSignInScheme = CookieAuthenticationDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = OktaDefaults.MvcAuthenticationScheme;
  })
  .AddCookie()
  .AddOktaMvc(new OktaMvcOptions
    {
      OktaDomain = Configuration.GetValue<string>("Okta:Domain"),
      ClientId = Configuration.GetValue<string>("Okta:ClientId"),
      ClientSecret = Configuration.GetValue<string>("Okta:ClientSecret")
    });
```

Next, in the `Configure()` method, add a call to use authentication before adding authorization. Your code will look like this:

```csharp
app.UseAuthentication();
app.UseAuthorization();
```

If your IDE is having trouble figuring out references, add the following `using` statements:

```csharp
using Microsoft.AspNetCore.Authentication.Cookies;
using Okta.AspNetCore;
```

Next, you'll add a controller that handles login, logout, and protected data. Let's add the methods for login and logout.

Create a controller named `AccountController` in the `Controllers` folder. Add the two methods to support login and logout. Your `AccountController` code will look like the following.

```csharp
namespace OktaProfilePicture.Controllers
{
  public class AccountController : Controller
  {
    public IActionResult LogIn()
    {
      if (!HttpContext.User.Identity.IsAuthenticated)
      {
        return Challenge(OktaDefaults.MvcAuthenticationScheme);
      }

      return RedirectToAction("Index", "Home");
    }

    public IActionResult LogOut()
    {
      return new SignOutResult(
        new[]
        {
          OktaDefaults.MvcAuthenticationScheme,
          CookieAuthenticationDefaults.AuthenticationScheme,
        },
        new AuthenticationProperties { RedirectUri = "/Home/" });
    }
  }
}
```

We'll create an empty view for the `Account` controller as a placeholder. Create a new folder named `Account` in the `Views` directory. The `Account` folder is where the views to display and edit your profile will go. Add the file `Profile.cshtml` to the new `Account` folder, and paste in the following code.

{% raw %}
```html
@{
    ViewData["Title"] = "User Profile";
}

<h1>Your Profile</h1>
```
{% endraw %}

Next we can update the initial view to add login and logout. Open `Views/Shared/_Layout.cshtml` and add the following markup above the `<ul class="navbar-nav flex-grow-1">` tag:

{% raw %}
```html
@if (User.Identity.IsAuthenticated)
{
  <ul class="nav navbar-nav navbar-right">
    <li><p class="navbar-text">Hello, @User.Identity.Name</p></li>
    @* <li><a class="nav-link" asp-controller="Account" asp-action="Profile" id="profile-button">Profile</a></li> *@
    <li>
      <form class="form-inline" asp-controller="Account" asp-action="LogOut" method="post">
        <button type="submit" class="nav-link btn btn-link text-dark" id="logout-button">Sign Out</button>
      </form>
    </li>
  </ul>
}
else
{
  <a>@Html.ActionLink("Sign In", "LogIn", "Account")</a>
}
```
{% endraw %}

The parent `div` for the element we added needs some updates to the styles. Replace the

`<div class="navbar-collapse collapse d-sm-inline-flex justify-content-between">`

with

`<div class="navbar-collapse collapse d-sm-inline-flex flex-sm-row-reverse">`


If you run the app now, you can log in and log out, but there's nothing to see yet.

## View user details

We'll use the [Okta .NET management SDK](https://github.com/okta/okta-sdk-dotnet) to get and update user data. Add the Nuget package by running the following command.

```shell
dotnet add OktaProfilePicture package Okta.Sdk --version 5.3.1
```

The Okta management SDK requires an API token that we manually generate. Log in to the [Okta admin dashboard](https://developer.okta.com/login/). Then navigate to **Security** > **API** > **Tokens** tab and press the **Create Token** button. Enter a name for the token (I will use "OktaProfilePicture") and press the **Create Token** button to finish creating the token. Make sure you copy the token value because you won't be able to view it again:

{% img blog/net-azure-cognitive-services/token.jpg alt:"Screenshot of Okta dashboard to create a token" width:"800" %}{: .center-image }

Now we can add the token to the settings file. Open `appSettings.Development.json`, and add a new property named `ApiToken` inside the Okta section. Add your token value. Your settings file should look like this.

```json
{
  "Logging": {
    "LogLevel": {
    "Default": "Information",
    "Microsoft": "Warning",
    "Microsoft.Hosting.Lifetime": "Information"
    }
  },
  "Okta": {
    "ClientId": "{clientId}",
    "ClientSecret": "{clientSecret}",
    "Domain": "https://{yourOktaDomain}",
    "ApiToken": "{token}"
  }
}

```

We want to add the Okta management SDK client to the Dependency Injection (DI) system to use it in the controller. Open `Startup.cs` and add the following code to `ConfigureServices` method before the method call `services.AddControllersWithViews();`.

```csharp
services.AddSingleton((serviceProvider) => new OktaClient(new OktaClientConfiguration()
{
  OktaDomain = Configuration.GetValue<string>("Okta:Domain"),
  Token = Configuration.GetValue<string>("Okta:ApiToken")
}));
```

Add the following using statements if your IDE didn't already add them for you.

```csharp
using Okta.Sdk;
using Okta.Sdk.Configuration;
```

Now we can use the service in the controller. Open `Controllers/AccountController.cs` and add a private field of type `OktaClient` and add a constructor to set the field to the `AccountController` class. The DI system injects an instance of `OktaClient` that you will use. Your code will look like this.

```csharp
private readonly OktaClient _oktaClient;

public AccountController(OktaClient oktaClient)
{
  _oktaClient = oktaClient;
}
```

In the `AccountController` class, create a private method to interact with Okta management SDK and retrieve user information.

```csharp
private async Task<IUser> GetOktaUser()
{
  var subject = HttpContext.User.Claims.First(claim => claim.Type == JwtRegisteredClaimNames.Sub).Value;
  return await _oktaClient.Users.GetUserAsync(subject);
}
```

If your IDE is confused about which packages to use, add the following using statements.

```csharp
using Microsoft.IdentityModel.JsonWebTokens;
using Okta.Sdk;
```

Let's get your profile info. Create a new public method in `AccountController` named `Profile` to handle interacting with the Profile view. You'll use the user model from Okta. Your code will look like the following.

```csharp
public async Task<IActionResult> Profile()
{
  var user = await GetOktaUser();

  return View(user);
}
```

We want to protect the `Profile` method against non-authenticated calls. With the Okta middleware configured, you can add guards. Add the `[Authorize]` attribute directly above the `Profile` method.

Let's update the profile view with user information. Open `Views/Account/Profile.cshtml` and replace the existing code displaying your user info and a profile pic. You won't have a profile pic to show yet, but that's coming up soon!

{% raw %}
```html
@model Okta.Sdk.IUser

@{
    ViewData["Title"] = "User Profile";
}

<h1>Your Profile</h1>

<div class="card" style="width: 36rem;">
  <div class="card-header d-flex justify-content-center">
    @if (ViewData["ProfileImageUrl"] != null)
    {
      <img class="rounded-circle border border-info" src="@ViewData["ProfileImageUrl"]" alt="Profile picture" width="300px"/>
    }
  </div>
  <div class="card-body">
    <h2 class="card-title h3">@Model.Profile.FirstName @Model.Profile.LastName</h2>
    <p class="card-subtitle h6 mb-2 text-muted">@Model.Profile.Email</p>
    @if (!string.IsNullOrEmpty(@Model.Profile.City) || !string.IsNullOrEmpty(@Model.Profile.CountryCode))
    {
      <p class="mt-3 card-text">
        <span>📍</span><span class="ml-2">@Model.Profile.City, @Model.Profile.CountryCode</span>
      </p>
    }
    <div class="d-flex justify-content-end">
      @* @if (ViewData["ProfileImageUrl"] != null) *@
      @* { *@
      @*    <a class="btn btn-outline-danger mr-4" asp-action="DeleteProfilePic">Delete Profile Picture</a> *@
      @* } *@
      @* <a class="btn btn-primary" role="button" asp-action="EditProfile">Edit Profile</a> *@
    </div>
  </div>
</div>
```
{% endraw %}

Now that we have a `Profile` method, we can update the main navbar. Open `Views/Shared/_Layout.cshtml` and uncomment the line of code that links to the "Profile" view.

You can view your profile, but the edit button doesn't work yet.

{% img blog/net-azure-cognitive-services/profile-no-image.jpg alt:"Profile view displaying name, email, city, and country. There is no picture." width:"800" %}{: .center-image }

## Edit your Okta profile

We'll add the support to edit your profile info, except for your profile picture. We need a new model that supports the form fields for editing profiles. Add a new file named `UserProfileViewModel.cs` to the `Models` directory. Copy and paste the following code into the file.

```csharp
#nullable enable
using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Http;

namespace OktaProfilePicture.Models
{
  public class UserProfileViewModel
  {
    [Required]
    public string? FirstName { get; set; }

    [Required]
    public string? LastName { get; set; }

    [Required]
    [EmailAddress]
    public string? Email { get; set; }

    public string? City { get; set; }

    [Display(Name = "Country Code")]
    public string? CountryCode { get; set; }

    [Display(Name = "Profile Image")]
    public IFormFile? ProfileImage { get; set; }
  }
}
```

Next open the `AccountController` class. We need to add the methods to support editing your profile. First, we need a method to populate the view for editing, and we need another method to handle the profile update. Because both methods relate to editing the profile, we'll name them the same and create a method overload.

Add a public method `EditProfile` to `AccountController` to populate the view and guard it against unauthenticated users. The method looks like the code below.

```csharp
[Authorize]
public async Task<IActionResult> EditProfile()
{
  var user = await GetOktaUser();

  return View(new UserProfileViewModel()
  {
    City = user.Profile.City,
    Email = user.Profile.Email,
    CountryCode = user.Profile.CountryCode,
    FirstName = user.Profile.FirstName,
    LastName = user.Profile.LastName
  });
}
```

Next, we'll overload the `EditProfile` method with the user profile model. This method calls Okta management SDK to apply updates. Add the following method to `AccountController`.

```csharp
[Authorize]
[HttpPost]
[ValidateAntiForgeryToken]
public async Task<IActionResult> EditProfile(UserProfileViewModel profile)
{
  if (!ModelState.IsValid)
  {
    return View(profile);
  }

  var user = await GetOktaUser();
  user.Profile.FirstName = profile.FirstName;
  user.Profile.LastName = profile.LastName;
  user.Profile.Email = profile.Email;
  user.Profile.City = profile.City;
  user.Profile.CountryCode = profile.CountryCode;

  await _oktaClient.Users.UpdateUserAsync(user, user.Id, null);
  return RedirectToAction("Profile");
}
```

Let's add the view for editing. Create a new view named `EditProfile.cshtml` in `Views/Account` folder. Copy the code below and replace the contents of `EditProfile.cshtml` with it.

{% raw %}
```html
@model UserProfileViewModel

@{
  ViewData["Title"] = "Edit Profile";
}

<h1>Edit Profile</h1>

<div class="row">
  <div class="col-md-4">
    <form asp-action="EditProfile" enctype="multipart/form-data">
      <div asp-validation-summary="ModelOnly" class="text-danger"></div>
      <div class="form-group">
        <label asp-for="FirstName" class="control-label"></label>
        <input asp-for="FirstName" class="form-control" />
        <span asp-validation-for="FirstName" class="text-danger"></span>
      </div>
      <div class="form-group">
        <label asp-for="LastName" class="control-label"></label>
        <input asp-for="LastName" class="form-control" />
        <span asp-validation-for="LastName" class="text-danger"></span>
      </div>
      <div class="form-group">
        <label asp-for="Email" class="control-label"></label>
        <input asp-for="Email" class="form-control" />
        <span asp-validation-for="Email" class="text-danger"></span>
      </div>
      <div class="form-group">
        <label asp-for="City" class="control-label"></label>
        <input asp-for="City" class="form-control" />
        <span asp-validation-for="City" class="text-danger"></span>
      </div>
      <div class="form-group">
        <label asp-for="CountryCode" class="control-label"></label>
        <input asp-for="CountryCode" class="form-control" />
        <span asp-validation-for="CountryCode" class="text-danger"></span>
      </div>
      <div class="form-group">
        <label asp-for="ProfileImage" class="control-label"></label>
        <div class="custom-file">
          <input asp-for="ProfileImage" class="custom-file-input" id="customFile">
          <label class="custom-file-label" for="customFile">Choose file</label>
        </div>
        <span asp-validation-for="ProfileImage" class="text-danger"></span>
      </div>
      <div class="form-group">
        <input type="submit" value="Save" class="btn btn-primary" />
      </div>
    </form>
  </div>
</div>

<div>
    <a asp-action="Profile">Back to Profile</a>
</div>

@section Scripts {
  @{await Html.RenderPartialAsync("_ValidationScriptsPartial");}

  <script type="text/javascript">
    const fileInput = document.querySelector('.custom-file-input');
    fileInput.addEventListener('change', (event) => {
      const fileName = event.target.value.split("\\").pop();
      document.querySelector('.custom-file-label').textContent = fileName;
    });
  </script>
}
```
{% endraw %}

Lastly, open `Views/Account/Profile.cshtml` to uncomment a line of code towards the bottom of the file. Uncomment the line that displays a button to edit profile - the line with `<a class="btn btn-primary" role="button" asp-action="EditProfile">EditProfile</a>`.

Now you should be able to edit your profile information except for your profile picture. Next we'll make it so your app persists your profile picture.

{% img blog/net-azure-cognitive-services/edit-profile.jpg alt:"Edit profile form field." width:"800" %}{: .center-image }

## Add Azure Storage

To make your profile picture viewable, we need to persist the image somewhere. We'll use Azure Storage to do this and use a custom attribute in Okta to store a unique identifier associated with the file in Azure. You'll be able to upload and display a profile picture in the app.

First, we'll create the custom attributes in Okta using the Okta admin dashboard.

Log in to the [Okta admin dashboard](https://developer.okta.com/login/). Then navigate to **Directory** > **Profile Editor**. You should see an item named **User (default)** in the list, which is Okta's default user profile template. Select **User (default)** to open the **Profile Editor**. Press the **+Add Attribute** button.

You'll add two string attributes, `profileImageKey` and `personId`:
1. Use "Profile Image Key" as the display name and `profileImageKey` as the variable name.
2. Use "Person Id" as the display name for the second attribute and `personId` as the variable name.

See the image below for the "Profile Image Key" attribute inputs.

{% img blog/net-azure-cognitive-services/custom-attribute.jpg alt:"Custom attribute settings showing display and variable name for 'Profile Image Key'" width:"800" %}{: .center-image }

Create another attribute named `personId`. If you look at the "User (default)" user type attribute list, you should see your two new attributes listed at the bottom.

{% img blog/net-azure-cognitive-services/all-attributes.jpg alt:"User (default) user type list of attributes with the two new attributes for 'Profile Image Key' and 'Person ID'." width:"800" %}{: .center-image }

Next, we'll create Azure Storage. If you don't already have an Azure subscription, [make a free account](https://azure.microsoft.com/free/?WT.mc_id=A261C142F) before you begin. We'll walk through the steps using the Azure Portal, but if you are an Azure pro, feel free to use the [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli) or [Azure PowerShell](https://docs.microsoft.com/en-us/powershell/azure/?view=azps-7.0.0).

Once you have an Azure subscription, open the [Azure Portal](https://portal.azure.com). Open the menu by pressing the _hamburger menu_ on the left, and select **Storage accounts**. Press **+Create** to create a storage account. In the **Create a storage account** view, create a Resource Group if you don't already have one for test projects. I named my Resource Group "OktaDemo". Enter `oktaprofilepicture` as the storage name, select a region (Azure's default selection is fine here), then select **Standard** performance and **Locally-redundant storage (LRS)** for redundancy. Press the **Review + create** button at the bottom as the default options for the remaining selections are acceptable. Press **Create** to complete creating the storage account.

{% img blog/net-azure-cognitive-services/azure-storage.jpg alt:"Settings to create an Azure storage account." width:"800" %}{: .center-image }

Next, we need to get the access keys for integrating the storage account SDK in the app. In the `oktaprofilepicture` storage account, open **Access keys** below the **Security + networking** section in the nav menu. Then press **Show keys** and copy the first **Connection string** field. Now we can move to the code!

{% img blog/net-azure-cognitive-services/azure-storage-access-keys.jpg alt:"Visual representation of steps to get connection string." width:"800" %}{: .center-image }

We're going to add a new section for Azure resources to the `appsettings.Development.json` file in the solution to connect to the Azure resource. Open `appsettings.Development.json` and add a new key named "Azure" with a property called "BlobStorageConnectionString" like the following code snippet.

```json
{
  ... Logging and Okta sections here,
  
  "Azure": {
    "BlobStorageConnectionString": "DefaultEndpointsProtocol=https;AccountName=oktaprofilepicture;AccountKey=eWlJUj.....A==;EndpointSuffix=core.windows.net"
  }
}
```

Next, we'll need to add the packages and set up the service. Add two Nuget packages — one for Azure Storage and the other for integrating Azure clients into the DI system. Add the packages by running the following commands in the terminal.

```shell
dotnet add OktaProfilePicture package Azure.Storage.Blobs --version 12.9.1
dotnet add OktaProfilePicture package Microsoft.Extensions.Azure --version 1.1.1
```

Open `Startup.cs` and add the following code to the `ConfigureServices` method before `services.AddControllersWithViews();`.

```csharp
services.AddAzureClients(builder =>
{
  builder.AddBlobServiceClient(Configuration.GetValue<string>("Azure:BlobStorageConnectionString"));
});
```

We can inject the blob service client into the `AccountController` and connect to the blob container. We'll create the blob container that we'll use in the constructor. Open `Controllers/AccountController.cs` and add the blob container client as shown below.

```csharp
private readonly OktaClient _oktaClient;
private readonly BlobContainerClient _blobContainerClient;

public AccountController(OktaClient oktaClient, BlobServiceClient blobServiceClient)
{
  _oktaClient = oktaClient;
  _blobContainerClient = blobServiceClient.GetBlobContainerClient("okta-profile-picture-container");
  _blobContainerClient.CreateIfNotExists();
}
```

Update the `Profile()` and `EditProfile(UserProfileViewModel profile)` methods to upload and view the blob container image. First, let's update the `Profile()` method. 

The blob container's access level is private, so we need to generate a [shared access signature](https://docs.microsoft.com/en-us/azure/storage/common/storage-sas-overview) that creates a read-only, temporary URL that we can use in the view. We'll also use the custom attribute `profileImageKey` to retrieve an existing image if one exists.

Replace the existing `Profile()` method with the following code.

```csharp
[Authorize]
public async Task<IActionResult> Profile()
{
  var user = await GetOktaUser();
  var profileImage = (string)user.Profile["profileImageKey"];
  if (string.IsNullOrEmpty(profileImage))
  {
    return View(user);
  }

  var sasBuilder = new BlobSasBuilder
  {
    StartsOn = DateTimeOffset.UtcNow,
    ExpiresOn = DateTimeOffset.UtcNow.AddMinutes(15)
  };

  sasBuilder.SetPermissions(BlobSasPermissions.Read);
  var url = _blobContainerClient.GetBlobClient(profileImage).GenerateSasUri(sasBuilder);
  ViewData["ProfileImageUrl"] = url;

  return View(user);
}
```

The `EditProfile(UserProfileViewModel profile)` changes to

```csharp
[Authorize]
[HttpPost]
[ValidateAntiForgeryToken]
public async Task<IActionResult> EditProfile(UserProfileViewModel profile)
{
  if (!ModelState.IsValid)
  {
    return View(profile);
  }

  var user = await GetOktaUser();
  user.Profile.FirstName = profile.FirstName;
  user.Profile.LastName = profile.LastName;
  user.Profile.Email = profile.Email;
  user.Profile.City = profile.City;
  user.Profile.CountryCode = profile.CountryCode;

  if (profile.ProfileImage != null)
  {
    await UpdateUserImage();
  }

  await _oktaClient.Users.UpdateUserAsync(user, user.Id, null);
  return RedirectToAction("Profile");

  async Task UpdateUserImage()
  {
    var blobName = Guid.NewGuid().ToString();
    if (!string.IsNullOrEmpty((string)user.Profile["profileImageKey"]))
    {
      await _blobContainerClient.DeleteBlobAsync((string)user.Profile["profileImageKey"]);
    }
    await _blobContainerClient.UploadBlobAsync(blobName, profile.ProfileImage?.OpenReadStream());
    user.Profile["profileImageKey"] = blobName;
  }
}
```

If you run the app, you can select a picture from local files to add to your profile and see your profile picture on the "Profile" page.

## Add Azure Cognitive Services

Finally, we get to check out Azure Cognitive Services for facial analysis. We'll use facial analysis in two different ways — for face detection and face verification.

First, we need to create the Azure resource and get the access keys. Open the [Cognitive Services Face](https://portal.azure.com/#create/Microsoft.CognitiveServicesFace) resource page in the Azure portal. Press **+ Create** to open the **Create Face** view. Select "OktaBlog" as the **Resource group** (or a Resource group of your choosing) and name the instance "OktaProfilePicture". Since this is for demo purposes, I used the "Free F0" pricing tier. Press **Review + create** to create the resource. Open "OktaProfilePicture" Face service instance and open **Keys and Endpoint**. You will need both the key and the **Endpoint**.

{% img blog/net-azure-cognitive-services/azure-face-account.jpg alt:"Settings to create an Azure Cognitive Services Face account." width:"800" %}{: .center-image }

Open the `appsettings.Development.json` file and add two new fields in the `Azure` section named `SubscriptionKey` and `FaceClientEndpoint`. Copy and paste the key and endpoint values from the Azure **Keys and Endpoint** view. The `Azure` section of your `appsettings.Development.json` will now look like the following.

```json
{
  ... Logging and Okta sections here,
  
  "Azure": {
    "BlobStorageConnectionString": "DefaultEndpointsProtocol=https;AccountName=oktaprofilepicture;AccountKey=eWlJUj.....A==;EndpointSuffix=core.windows.net",
    "SubscriptionKey": "{FaceResourceKey}",
    "FaceClientEndpoint": "https://{FaceResourceName}.cognitiveservices.azure.com/"
  }
}
```

To add the packages, run the following command in the terminal.

```shell
dotnet add OktaProfilePicture package Microsoft.Azure.CognitiveServices.Vision.Face --version 2.8.0-preview.2
```

Let's add the face service to the DI system to use it in the controller. Open `Startup.cs` and add the following code to the `ConfigureServices` method before the call to `services.AddControllersWithViews();`.

```csharp
services.AddSingleton((serviceProvider) =>
  new FaceClient(
    new ApiKeyServiceClientCredentials(Configuration.GetValue<string>("Azure:SubscriptionKey")))
  {
    Endpoint = Configuration.GetValue<string>("Azure:FaceClientEndpoint")
  }
);
```

Now we can incorporate the service into the controller. Open `Controllers/AccountController.cs`, inject the face service in the constructor, then connect it to a private instance that we'll use throughout the controller class. Your code will look like this:

```csharp
private readonly OktaClient _oktaClient;
private readonly BlobContainerClient _blobContainerClient;
private readonly FaceClient _faceClient;

public AccountController(OktaClient oktaClient, BlobServiceClient blobServiceClient, FaceClient faceClient)
{
  _oktaClient = oktaClient;
  _faceClient = faceClient;

  _blobContainerClient = blobServiceClient.GetBlobContainerClient("okta-profile-picture-container");
  _blobContainerClient.CreateIfNotExists();
}
```

The first thing we want to do with the cognitive service is ensure there's only one face in an image. To do so, we'll use a built-in method to [detect faces](https://docs.microsoft.com/en-us/dotnet/api/microsoft.azure.cognitiveservices.vision.face.faceoperationsextensions.detectwithstreamasync?view=azure-dotnet).

In `EditProfile(UserProfileViewModel profile)` method, we'll add code to open the image file, detect the number of faces, and set an error if there isn't exactly one face in the image. Replace the `if(profile.PageImage != null){await UpdateUserImage();}` statement with the following code.

```csharp
if (profile.ProfileImage == null)
{
  await _oktaClient.Users.UpdateUserAsync(user, user.Id, null);
  return RedirectToAction("Profile");
}

var stream = profile.ProfileImage.OpenReadStream();
var detectedFaces = await _faceClient.Face.DetectWithStreamAsync(stream, recognitionModel: RecognitionModel.Recognition04, detectionModel: DetectionModel.Detection01);

if (detectedFaces.Count != 1 || detectedFaces[0].FaceId == null)
{
  ModelState.AddModelError("", $"Detected {detectedFaces.Count} faces instead of 1 face");
  return View(profile);
}

await UpdateUserImage();
```

The `RecognitionModel.Recognition04` is the most accurate model currently available, and `DetectionModel.Detection01` is a model that avoids detecting small and blurry faces.

Now, if you try running the app and upload an image with you and your friends, you'll see an error.

## Perform facial analysis

Next, let's add the facial analysis. We need to handle two scenarios.
1. You're adding a profile picture for the first time — this sets the baseline for the facial features to use in future comparisons
2. You're updating your profile picture — facial analysis runs against the face in this image and compares it to the baseline

Let's handle the first scenario.

The Face API only stores the extracted facial features for 24 hours by default, so we need to set a baseline that we can refer to beyond the 24-hour window. We can store facial features within the "OktaProfilePicture" Azure Cognitive Services resource, which we'll do for the first upload scenario.

In the `EditProfile(UserProfileViewModel profile)` method, replace the line of code that calls `await UpdateUserImage();` with the code snippet below.

```csharp
var personGroupId = user.Id.ToLower();

if (string.IsNullOrEmpty((string)user.Profile["personId"]))
{
  await _faceClient.PersonGroup.CreateAsync(personGroupId, user.Profile.Login, recognitionModel: RecognitionModel.Recognition04);

  stream = profile.ProfileImage.OpenReadStream();
  var personId = (await _faceClient.PersonGroupPerson.CreateAsync(personGroupId, user.Profile.Login)).PersonId;
  await _faceClient.PersonGroupPerson.AddFaceFromStreamAsync(personGroupId, personId, stream);

  user.Profile["personId"] = personId;
  await UpdateUserImage();
} else {

}
```

The `PersonGroup` is a container object for a group of people. We're using your Okta user ID as the unique identifier for this group, so each group is truly individualized. Other options could be group or department IDs. The `PersonGroupPerson` object is an individual within the group, so there is usually a 1:n relationship between `PersonGroup` and `PersonGroupPerson`. We're also associating one face to a `PersonGroupPerson`, although you can add multiple images of an individual so you can train the service to analyze an individual better. We're using a simple case here to showcase how this service works by a single image of an individual.

Now we want to handle the second scenario — where we want to perform facial analysis compared to the baseline facial features. We want only to allow the image to update when we have some measure of confidence that the new face image matches the baseline. Add the following snippet inside the `else` block from the code above.

```csharp
var faceId = detectedFaces[0].FaceId.Value;

var personId = new Guid((string)user.Profile["personId"]);
var verifyResult = await _faceClient.Face.VerifyFaceToPersonAsync(faceId, personId, personGroupId);

if (verifyResult.IsIdentical && verifyResult.Confidence >= 0.8)
{
  await UpdateUserImage();
}
else
{
  ModelState.AddModelError("", "The uploaded picture doesn't match your current picture");
  return View(profile);
}
```

We used a confidence level of 80% in positive identifications since we only have one facial feature for comparison. With better training, you can increase the confidence level.

Now you can upload a picture of yourself and then upload a photo of a friend to see what happens.

## Resetting profile pictures

Sometimes you need to clear everything out and start over. I uploaded a picture of myself wearing oversized sunglasses and a hat, and the face service no longer recognized me. 😎

Let's add in the delete functionality so you can reset everything.

In `AccountController` we'll add a new method called `DeleteProfilePic()`. This method deletes the image from container storage, removes links to stored facial features, and clears out the custom attributes set in your Okta profile. Copy the code below and add it to the end of the `AccountController` class.

```csharp
[Authorize]
public async Task<IActionResult> DeleteProfilePic()
{
  var user = await GetOktaUser();

  await CleanAzureResources();

  user.Profile["profileImageKey"] = null;
  user.Profile["personId"] = null;
  await _oktaClient.Users.UpdateUserAsync(user, user.Id, null);
  return RedirectToAction("Profile");

  async Task CleanAzureResources()
  {
    // remove image from blob
    await _blobContainerClient.DeleteBlobAsync((string)user.Profile["profileImageKey"]);

    // remove face from Face services
    var personId = Guid.Parse((string)user.Profile["personId"]);
    await _faceClient.PersonGroupPerson.DeleteAsync(user.Id.ToLower(), personId);
    await _faceClient.PersonGroup.DeleteAsync(user.Id.ToLower());
  }
}
```

Next, open `Views/Account/Profile.cshtml` and uncomment the remaining commented out code. Doing so allows the "Delete Profile Picture" button to display.

Now you can reset your profile picture and upload that picture of you wearing a hat and sunglasses to test out the facial comparison ability.

## Learn More About Entity Framework Core, ASP.NET Core, and Okta

I hope the tutorial was interesting and enjoyable for you. You can get the [full source code of the project from GitHub](https://github.com/oktadev/okta-dotnet-azure-cognitive-services-example). For more ASP.NET Core and Okta articles, check out these posts:

- [Rider for C# - The Best Visual Studio Alternative IDE](/blog/2020/11/30/rider-csharp-visual-studio-alternative)
- [How to Secure PII with Entity Framework Core](/blog/2020/09/23/secure-pii-ef-core-dotnet)
- [Okta .NET management SDK](https://github.com/okta/okta-sdk-dotnet)

Be sure to follow us on [Twitter](https://twitter.com/oktadev) and subscribe to our [YouTube Channel](https://youtube.com/c/oktadev) so that you never miss any excellent content!
