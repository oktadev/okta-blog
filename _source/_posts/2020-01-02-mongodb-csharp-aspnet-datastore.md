---
disqus_thread_id: 7795069971
discourse_topic_id: 17192
discourse_comment_url: https://devforum.okta.com/t/17192
layout: blog_post
title: "Use MongoDB in Your C# ASP.NET Apps"
author: terje-kolderup
by: contractor
communities: [.net]
description: "Use MongoDB as a document data store for your C# ASP.NET Applications."
tags: [mongodb, c-sharp, csharp, asp-dot-net, aspnet]
tweets:
- "Want to build C# ASP.NET applications with a MongoDB data store? Check this out?"
- "Want to use MongoDB as a data store for your C# ASP.NET Apps, but don't know where to start? Start here!"
- "Get up and running quickly with MongoDB as a data store for your C# ASP.NET Applications!"
image: blog/featured/okta-dotnet-half.jpg
type: conversion
---

MongoDB is a document database. Instead of storing data in tables and rows, you store documents in a structure very similar to objects in the memory of your application. The schema is flexible and dynamic. You don't need to define all fields upfront. Some MongoDB tutorials define model classes in C# and show how to read from and write to the database with them. This post takes a different approach, which also demonstrates how flexible MongoDB is. You can alter it as you wish at any time!

Another major advantage of MongoDB, and most document databases, is that they scale well. You can easily distribute a single database on multiple servers to increase performance.

In this post, you will build an ASP.NET Core MVC application that reads data from and writes data to a MongoDB database in the cloud. You are going to use MongoDB Atlas, which is a cloud database service with a free tier.

## Create a MongoDB Database for Your C# Application

Go to [the MongoDB Atlas website](https://www.mongodb.com/cloud/atlas), and click **Start Free**. Enter your email address, first name, last name, and a password you want to use for this service. Check **I agree to the terms of service and privacy policy** and click **Get started free**.

Click **Create a cluster** in the panel **Starter Clusters**, the one that is **"Starting at FREE"**. In the next screen you don't have to change anything but you may choose between cloud hosting by Amazon (AWS), Google, and Microsoft (Azure) - and the region in the world where it will be hosted. Click **Create Cluster** when you are ready.

After the cluster is ready, click **CONNECT**, and you will see the screen below:

{% img blog/mongodb-csharp-aspnet-datastore/connect_to_cluster_step_one.png alt:"Connect to Cluster Step One" width:"800" %}{: .center-image }

Click **Add Your Current IP Address**, and then *Add IP Address*. It will whitelist your IP address, thus allowing access to your MongoDB database. If you want to access the database from another IP address, you must whitelist that too.

Enter a username and password, and click **Create MongoDB User**. The code later in this post assumes the username is admin and the password abcd1234. Of course, that's an easy password to guess, so not something you'd want to use in a production environment, but for this demo it will be fine.

Next, click **Choose a connection method**, and then select **Connect your application**. Select C#/.NET for **Driver** and 2.5 or later for **Version**.

{% img blog/mongodb-csharp-aspnet-datastore/connect_to_cluster_step_two.png alt:"Connect to Cluster Step Two" width:"800" %}{: .center-image }

Copy the connection string and save it for later. It should look something like this:

```sh
mongodb+srv://admin:<password>@cluster0-lmasz.mongodb.net/test?retryWrites=true&w=majority
```

Remember to replace `<password>` with the actual password you created.

Click **Close**, and from the main screen, click *...*, and then **Load Sample Dataset**. It will fill your database with a lot of data to play with. If that option is not enabled, it means that the MongoDB database has not completed set up. You'll just need to wait until it is.

{% img blog/mongodb-csharp-aspnet-datastore/load_sample_data.png alt:"Load Sample Data" width:"800" %}{: .center-image }

## Create the C# Web Application

Now, you are ready to create a web application. The first command below downloads and installs the template you need. You can skip it if you already have the template. In your terminal, run these commands:

```sh
dotnet new -i Microsoft.DotNet.Web.ProjectTemplates.2.2::2.2.8
dotnet new mvc -o MongoDbTest -f netcoreapp2.2
cd MongoDbTest
dotnet add package MongoDB.Driver --version 2.9.2
```

The second one creates an application based on the template, so the easiest way to check if you have the template is to run the second command. The last command adds the NuGet package for accessing your MongoDB database from C#.

Make a setting `MyDatabaseSettings` in `appsettings.json`, and add the connection string you copied earlier. Remember to replace `<password>` with the correct password. The configuration file should now look similar to this:

```js
{
  "MyDatabaseSettings": {
    "ConnectionString": "mongodb+srv://admin:abcd1234@cluster0-knxsz.mongodb.net/test?retryWrites=true&w=majority&connect=replicaSet",
  },
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft": "Warning",
      "Microsoft.Hosting.Lifetime": "Information"
    }
  },
  "AllowedHosts": "*"
}
```

In the **Models** folder, add a class `MyDatabaseSettings`with the following content:

```cs
namespace MongoDbTest.Models
{
  public class MyDatabaseSettings
  {
    public string ConnectionString { get; set; }
  }
}
```

In `Startup.cs`, add these lines to the beginning of `ConfigureServices`:

```cs
services.Configure<MyDatabaseSettings>(
  Configuration.GetSection(nameof(MyDatabaseSettings)));

services.AddSingleton<MyDatabaseSettings>(sp =>
  sp.GetRequiredService<IOptions<MyDatabaseSettings>>().Value);
```

After this, you can get an instance of `MyDatabaseSettings` with the values from `appsettings.json` through the dependency injection service.

Also, add these *using* statements to the top of the file:

```cs
using Microsoft.Extensions.Options;
using MongoDbTest.Models;
```

Next, make a folder `Services` at the root of the application, and add a class `DocumentService` in it. This class will interact with the MongoDB database. Add these instance variables and this constructor:

```cs
private readonly MongoClient _client;
private Dictionary<string, List<string>> _databasesAndCollections;

public DocumentService(MyDatabaseSettings settings)
{
  _client = new MongoClient(settings.ConnectionString);
}
```

And add these using statements at the top of the file:

```cs
using MongoDB.Bson;
using MongoDB.Driver;
using MongoDbTest.Models;
using System.Collections.Generic;
using System.Threading.Tasks;
```

`MongoClient` is a class from the NuGet MongoDB.Driver that represents a connection to the database. `_databasesAndCollections` will store the list of all the databases and all their collections. The changes made in `Startup.cs` makes sure the constructor gets an instance of the configuration class `MyDatabaseSettings` as an argument.

Add the method `GetDatabasesAndCollections()` to the `DocumentService` class, which gets fetches the list of databases and collection:

```cs
public async Task<Dictionary<string, List<string>>> GetDatabasesAndCollections()
{
  if (_databasesAndCollections != null) return _databasesAndCollections;

  _databasesAndCollections = new Dictionary<string, List<string>>();
  var databasesResult = _client.ListDatabaseNames();

  await databasesResult.ForEachAsync(async databaseName =>
  {
    var collectionNames = new List<string>();
    var database = _client.GetDatabase(databaseName);
    var collectionNamesResult = database.ListCollectionNames();
    await collectionNamesResult.ForEachAsync(
        collectionName => { collectionNames.Add(collectionName); });
    _databasesAndCollections.Add(databaseName, collectionNames);
  });

  return _databasesAndCollections;
}
```

The `_client.ListDatabaseNames()` function gets all database names as an `IAsyncCursor`. The way to access it is through a `ForEachAsync()` function. Then the code gets a list of all collections for each database. Everything is stored in the `Dictionary` so that the database names are keys, and the lists of collections are the values.

In the `DocumentService` class, add `GetDocument()`, `GetCollectionCount()`, and `GetCollectionCount`:

```cs
public async Task<BsonDocument> GetDocument(string databaseName, string collectionName, int index)
{
  var collection = GetCollection(databaseName, collectionName);
  BsonDocument document = null;
  await collection.Find(doc => true)
    .Skip(index)
    .Limit(1)
    .ForEachAsync(doc => document = doc);
  return document;
}

public async Task<long> GetCollectionCount(string databaseName, string collectionName)
{
  var collection = GetCollection(databaseName, collectionName);
  return await collection.EstimatedDocumentCountAsync();
}

private IMongoCollection<BsonDocument> GetCollection(string databaseName, string collectionName)
{
  var db = _client.GetDatabase(databaseName);
  return db.GetCollection<BsonDocument>(collectionName);
}
```

`GetDocument()` fetches one document from a collection. The argument `index` is the sequence number of the document to get. You will use this to show documents one by one, and offering the user to go to the next and previous document. `GetCollectionCount()` simply gets the number of documents in a collection, and `GetCollection()` is a helper method that gets a collection in a database.

In addition to reading a document, you will implement functionality to achieve the following:

Set a field to a string value
Delete a document
Create a new blank document

For this to happen, add these methods in the `DocumentService` class:

```cs
public async Task<UpdateResult> CreateOrUpdateField(string databaseName, string collectionName, string id, string fieldName, string value)
{
  var collection = GetCollection(databaseName, collectionName);
  var update = Builders<BsonDocument>.Update.Set(fieldName, new BsonString(value));
  return await collection.UpdateOneAsync(CreateIdFilter(id), update);
}

public async Task<DeleteResult> DeleteDocument(string databaseName, string collectionName, string id)
{
  var collection = GetCollection(databaseName, collectionName);
  return await collection.DeleteOneAsync(CreateIdFilter(id));
}

private static BsonDocument CreateIdFilter(string id)
{
  return new BsonDocument("_id", new BsonObjectId(new ObjectId(id)));
}

public async Task CreateDocument(string databaseName, string collectionName)
{
  var collection = GetCollection(databaseName, collectionName);
  await collection.InsertOneAsync(new BsonDocument());
}
```

`CreateOrUpdateField()` sets the value of a field in a document, but only string values. If the field already exists, the value will be changed. Even if the old value is of a different data type, it will be overwritten by the new string value. If the field didn't exist, it will be created. The method `UpdateOneAsync()` takes a document as an argument, and it uses the values set in this document as a filter, to find the documents to change. In this case, the helper method, `CreateIdFilter()` simply creates a document with the `_id` fieldset, and then the filter will only find and change one document. The same mechanism may be used to update many documents at the same time.

`DeleteDocument()` deletes a document in much the same way as `CreateOrUpdateField()` changes a document. `CreateDocument()` creates a new blank document. It will only have the `_id` field, which the database sets.

Make sure an instance of `DocumentService` will be available by dependency injection, by adding the following line to `ConfigureServices()` in `Startup.cs` right before `services.AddMvc().SetCompatibilityVersion(CompatibilityVersion.Version_2_2);`:

```cs
services.AddSingleton<DocumentService>();
```

Also, add this using statement to the top of the file:

```cs
using MongoDbTest.Services;
```

## Add a Custom View Model to Your C# MongoDB Application

In the view, you are going to display a lot of different information:

- A list of all databases and all of their collections
- Which database and collection are selected by the user if any
- The current document with all of its values
- The index of the current document in the selected collection
- The number of documents in the selected collection

The controller will collect everything and pass it on to the view in a single view model object. Add view model class for this. In the **Models** folder, add a class `ExplorerDbViewModel` with the following content:

```cs
using System.Collections.Generic;
using MongoDB.Bson;

namespace MongoDbTest.Models
{
  public class ExplorerDbViewModel
  {
    public string Database { get; set; }
    public string Collection{ get; set; }
    public BsonDocument Document { get; set; }
    public Dictionary<string, List<string>> DatabasesAndCollections { get; set; }
    public int Index { get; set; }
    public long CollectionCount { get; set; }
  }
}
```

## Add a Controller and a View to Your C# Application

Now that you have a service for getting data from the document store, you just need a controller in the application. Add a new controller `ExploreDbController`:

```cs
using System.Diagnostics;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using MongoDbTest.Models;
using MongoDbTest.Services;

namespace MongoDbTest.Controllers
{
  public class ExploreDbController : Controller
  {
    private readonly DocumentService _documentService;

    public ExploreDbController(DocumentService documentService)
    {
      _documentService = documentService;
    }

    public async Task<IActionResult> Index(string selectedDatabase, string selectedCollection, int index = 0)
    {
      var databasesAndCollections = await _documentService.GetDatabasesAndCollections();
      var viewModel = new ExplorerDbViewModel()
      {
        DatabasesAndCollections = databasesAndCollections,
        Database = selectedDatabase,
        Collection = selectedCollection,
        Index = index
      };
      if (selectedCollection != null && selectedDatabase != null)
      {
        viewModel.Document = await _documentService.GetDocument(selectedDatabase, selectedCollection, index);
        viewModel.CollectionCount = await _documentService.GetCollectionCount(selectedDatabase, selectedCollection);
      }
      return View(viewModel);
    }

    public async Task<IActionResult> CreateOrUpdate(
      string database,
      string collection,
      string id,
      int index,
      string fieldName,
      string value
    )
    {
      await _documentService.CreateOrUpdateField(database, collection, id, fieldName, value);
      return RedirectToAction("Index", GetRouteValues(database, collection, index));
    }

    public async Task<IActionResult> DeleteDoc(
      string database,
      string collection,
      string id,
      int index
    )
    {
      var delete = await _documentService.DeleteDocument(database, collection, id);
      return RedirectToAction("Index", GetRouteValues(database, collection, index));
    }

    public async Task<IActionResult> CreateDoc(
      string database,
      string collection
    )
    {
      await _documentService.CreateDocument(database, collection);
      var count = await _documentService.GetCollectionCount(database, collection);
      return RedirectToAction("Index", GetRouteValues(database, collection, count - 1));
    }

    private static object GetRouteValues(string database, string collection, long index)
    {
      return new { selectedDatabase = database, selectedCollection = collection, index = index };
    }
  }
}
```

The constructor receives an instance of `DocumentService`, which is used for interacting with the database.

The controller has four actions:

1. `Index` for displaying data
2. `CreateOrUpdate` for setting field values
3. `DeleteDoc` for deleting a document
4. `CreateDoc` for creating a new blank document

`Index` will fetch the databases and collections, and if the user has selected a collection in a database, it will get a row from that collection and also the document count. The other actions are simple, they are only a facade for the corresponding methods in `DocumentService`.

Create a new folder `ExploreDb` inside the top level folder `Views`. Create a View, `_Document.cshtml` inside of it. It will render the HTML for one document and is extracted in a partial view to avoid repeating the code. The main view will show subdocuments, and that is solved with recursion. This partial view also refers to itself:

```html
@using MongoDB.Bson
@model MongoDB.Bson.BsonDocument

<table>
  @foreach (var fieldName in Model.Names)
  {
    var item = Model[fieldName];
    <tr>
      <th>@fieldName</th>
      <td>
        @if (item is BsonDocument)
        {
          <partial name="_Document" model="item" />
        }
        else if (item is BsonArray)
        {
          foreach (var row in (BsonArray)item)
          {
            <div>
              @if (row is BsonDocument)
              {
                <partial name="_Document" model="row" />
              }
              else
              {
                @row
              }
            </div>
          }
        }
        else
        {
          @item
        }
      </td>
      <td>@item.GetType().Name</td>
    </tr>
  }
</table>
```

The `foreach (var fieldName in Model.Names)` loops through all fields. If the field value is a `BsonDocument`, a recursive call to the partial view renders that document. If the field value is an array, it is handled by a for loop. And inside it, if the value on an individual array element is a `BsonDocument`, again the partial view is called. Else, the value is shown.

In the same folder,, add the view `Index.cshtml` with the following content:

```html
@using MongoDB.Bson
@model ExplorerDbViewModel
<style>
  tr:nth-child(even) {
    background: rgba(64, 32, 0, 0.1);
  }

  span {
    white-space: nowrap;
  }

  div {
    margin-right: 10px;
  }
</style>
<div style="display: flex">
  <div>
    @foreach (var databaseName in Model.DatabasesAndCollections.Keys)
    {
      <span>Collections in <b>Db @databaseName</b>:</span><br />
      <ul>
        @foreach (var collectionName in Model.DatabasesAndCollections[databaseName])
        {
          <li>
            <a asp-route-selectedDatabase="@databaseName"
              asp-route-selectedCollection="@collectionName">@collectionName</a>
          </li>
        }
      </ul>
    }
  </div>
  <div>
    @if (@Model.Collection == null)
    {
      <span style="color: green; font-style: italic">Select a collectionName in one of the databaseNames to the left.</span>
    }
    else
    {
      var id = Model.Document["_id"];
      <h3>You selected <i>@Model.Collection</i> in <i>@Model.Database</i></h3>
      <span>Showing row @Model.Index of @Model.CollectionCount</span>
      @if (Model.Index > 0)
      {
        <a asp-route-selectedDatabase="@Model.Database"
            asp-route-selectedCollection="@Model.Collection"
            asp-route-index="@(Model.Index-1)">Previous</a>
      }
      @if (Model.Index < Model.CollectionCount - 1)
      {
        <a asp-route-selectedDatabase="@Model.Database"
            asp-route-selectedCollection="@Model.Collection"
            asp-route-index="@(Model.Index + 1)">Next</a>
      }
      <hr />
      <div style="display: flex; justify-content: space-between">
        <div>
            <form asp-action="CreateOrUpdate"
                  asp-route-id="@id"
                  asp-route-index="@Model.Index"
                  asp-route-database="@Model.Database"
                  asp-route-collection="@Model.Collection">
                Field:<br />
                <input type="text" name="fieldName" style="width: 200px" /><br />
                Value:<br />
                <input type="text" name="value" style="width: 200px" /><br />
                <input type="submit" value="Change field value" style="width: 200px; margin-top: 4px" />
            </form>
        </div>
        <div>
          <form asp-action="DeleteDoc"
                asp-route-id="@id"
                asp-route-index="@Model.Index"
                asp-route-database="@Model.Database"
                asp-route-collection="@Model.Collection">
              <input type="submit" value="Delete Document" style="width: 200px" />
          </form>
          <form asp-action="CreateDoc"
                asp-route-id="@id"
                asp-route-index="@Model.Index"
                asp-route-database="@Model.Database"
                asp-route-collection="@Model.Collection">
              <input type="submit" value="Create New Document" style="width: 200px;  margin-top: 4px" />
          </form>
        </div>
      </div>
      <hr />
      <h4>Document</h4>
      <partial name="_Document" model="Model.Document" />
    }
  </div>
</div>
```

The code lists all databases and collections on the left. On the right, it shows the current document, including the position in the collection, the length of the collection, and buttons to go to the next or previous document. 

Add a menu option for your new page. Open `_Layout.cshtml` in the folder `Views/Shared`, and add another option below the menu options for Home and Privacy:

```html
<li class="nav-item">
  <a class="nav-link text-dark" asp-area="" asp-controller="ExploreDb" asp-action="Index">Explore Db</a>
</li>
```

Now, build and run your application. Select **Explore db** in the menu, and explore all the data in your MongoDB database. Select a collection in a database in the left pane, and it should look something like this:

{% img blog/mongodb-csharp-aspnet-datastore/running_app.png alt:"Running Application" width:"800" %}{: .center-image }

## Add Authentication to Your C# MongoDB Application

There is no reason to write authentication or authorization yourself. You can easily integrate Okta to handle many user management functions for you:

- [Authenticate](https://developer.okta.com/product/authentication/) and [authorize](https://developer.okta.com/product/authorization/) your users
- Store data about your users
- Perform password-based, passwordless and [social login](https://developer.okta.com/authentication-guide/social-login/)
- Secure your application with [multi-factor authentication](https://developer.okta.com/use_cases/mfa/)
And much more! Check out our [product documentation](https://developer.okta.com/documentation/)

Sign up for a [forever-free developer account](https://developer.okta.com/signup/) (or log in if you already have one). Once you have signed up and logged in, you'll be taken to your dashboard. Make note of your Org URL in the top right corner. It looks something like this: `Org URL: https://dev-######.okta.com`.

You must also register your application in the Okta dashboard.

- Select **Applications** at the top
- Click the green button, **Add Application**
- Select **Web** and click **Next**.

Enter "MongoDbTest" for **Name**, and click **Done**. Then click **Edit**, so you can enter the appropriate port number and a few other things. To find the port number, look at the URL of the application when you ran it. It is usually around 44300.

In the Okta Dashboard, change **Login redirect URIs** to use `https` and the same port number as above. Do the same for **Initiate login URI**, and add a **Logout redirect URIs** with a value like `https://localhost:443XX/signout/callback`, but with the port number you have already used. Click **Save**.

## Configure Your C# MongoDB Application for Authentication

To use Okta for authentication, use the easy Okta ASP.NET SDK. Run the following command:

```sh
dotnet add package Okta.AspNetCore --version 1.2.0
```

Add the following configuration values to the top level of your appsettings.json file:

```js
  "Okta": {
    "ClientId": "{yourClientId}",
    "ClientSecret": "{yourClientSecret}",
    "OktaDomain": "{yourOktaDomain}",
    "PostLogoutRedirectUri": "https://localhost:443XX/"
  }
```

Replace 443XX with the port number you are using. Remember to use your client ID, your client secret, and you Okta domain, all of which you will find in the Okta dashboard. The Okta domain is at the top right of your Okta dashboard. To find the others, go to **Applications** in the top menu, then select **MongoDbTest**, and then select **General**.

Back in the `Startup.cs` file, add the following using statements:

```cs
using Okta.AspNetCore;
using Microsoft.AspNetCore.Authentication.Cookies;
using System.Collections.Generic;
```

Then at the very beginning of the ConfigureServices() method add:

```cs
var oktaMvcOptions = new OktaMvcOptions();
Configuration.GetSection("Okta").Bind(oktaMvcOptions);
oktaMvcOptions.Scope = new List<string> { "openid", "profile", "email" };
oktaMvcOptions.GetClaimsFromUserInfoEndpoint = true;

services.AddAuthentication(options =>
{
  options.DefaultAuthenticateScheme = CookieAuthenticationDefaults.AuthenticationScheme;
  options.DefaultSignInScheme = CookieAuthenticationDefaults.AuthenticationScheme;
  options.DefaultChallengeScheme = OktaDefaults.MvcAuthenticationScheme;
})
.AddCookie()
.AddOktaMvc(oktaMvcOptions);
```

This sets up the authentication scheme and gets all the values you just added to `application.json` so that the application can use those values when making the calls to your Okta authorization server.

Also, you need to tell the Configure() method to use the service you just configured. Right before the `app.UseMvc(...)` line, add:

```cs
app.UseAuthentication();
```

Okta is now configured in your application! You still need to set up your application to challenge the user (send them to Okta to authenticate).

Create a new empty controller in the `Controllers` folder called `AccountController`:

```cs
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Mvc;
using Okta.AspNetCore;

namespace MongoDbTest.Controllers
{
  public class AccountController : Controller
  {
    public IActionResult Login()
    {
      if (!HttpContext.User.Identity.IsAuthenticated)
      {
        return Challenge(OktaDefaults.MvcAuthenticationScheme);
      }
      return RedirectToAction("Index", "Home");
    }

    public IActionResult Logout()
    {
      return new SignOutResult(new[]
      {
        OktaDefaults.MvcAuthenticationScheme,
        CookieAuthenticationDefaults.AuthenticationScheme
      });
    }
  }
}
```

To restrict all views with URLs starting with `/ExploreDb`, go to `ExploreDbController`, and add the attribute `[Authorize]` just before the line that defines the class, and also add the using statement at the top:

```cs
using Microsoft.AspNetCore.Authorization;

namespace MongoDbTest.Controllers
{
  [Authorize]
  public class ExploreDbController : Controller
```

The only thing missing is menu options for login and logout. Go to `_Layout.cshtml` and add the code below after the other menu options:

```html
@if (User.Identity.IsAuthenticated)
{
  <a class="nav-link text-dark" asp-controller="Account" asp-action="Logout">Log out  @User.Identity.Name </a>
}
else
{
  <a class="nav-link text-dark" asp-controller="Account" asp-action="Login">Log in</a>
}
```

Now, run the application to see you have to authenticate to access the pages that access you MongoDB!

You've now built a .NET application that reads data from a MongoDB document data store, displays it in an MVC view, and secured it with Okta.

## Learn More About C#, ASP.NET Core, and MongoDB

To learn more about ASP.NET Core or MongoDB, check out any of these great resources:

- [ASP.NET Core 3.0 MVC Secure Authentication](/blog/2019/11/15/aspnet-core-3-mvc-secure-authentication)
- [How to Connect Angular and MongoDB to Build a Secure App](/blog/2019/09/11/angular-mongodb)
- [Build a CRUD App with ASP.NET Core and SQL Server](/blog/2019/04/24/crud-app-aspnet-core-sql-server)
- [Build a CRUD App with ASP.NET Core 2.2 and Entity Framework](/blog/2019/04/03/build-a-crud-app-with-aspnet-22-and-entity-framework)
- [Use the Built-In ASP.NET Core 3.0 OIDC Middleware with Okta](https://www.youtube.com/watch?v=1zjz-aWdZHk)

As always, if you have any questions please comment below. Never miss out on any of our awesome content by following us on [Twitter](https://twitter.com/oktadev) and subscribing to our channel on [YouTube](https://www.youtube.com/c/oktadev)!
