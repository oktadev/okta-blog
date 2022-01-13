---
disqus_thread_id: 7748842946
discourse_topic_id: 17179
discourse_comment_url: https://devforum.okta.com/t/17179
layout: blog_post
title: "A Quick Guide to Integrating React and GraphQL"
author: terje-kolderup
by: contractor
communities: [javascript]
description: "A tutorial about using a QraphQL API from React."
tags: [react, graphql, javascript]
tweets:
  - "Need to get up and running with GraphQL from React? Check this out!"
  - "Get a quick run down of how to get GraphQL and React to work together."
  - "Here's a quick guide to integrating React and GraphQL."
image: blog/featured/okta-react-skew.jpg
type: conversion
---

If your application consumes a ReST API from React, the default setup will give you ALL the data for a resource. But if you want to specify what data you need, GraphQL can help! Specifying exactly the data you want can reduce the amount of data sent over the wire, and the React applications you write can have less code filtering out useless data from data you need.

There are a lot of GraphQL clients to choose from. Two of the most popular are Apollo and Relay, but both are powerful and might be too complex for a beginner. Luckily, eachoffers a preconfigured "light" option: Apollo Boost and Relay Modern.

For this article, you will use Apollo Boost to do GraphQL queries and mutations from a React frontend to a .NET Core backend. Emphasis here is on the frontend and the GraphQL setup, so you will start by simply cloning a functional backend [from GitHub](https://github.com/oktadeveloper/okta-dotnet-react-graphql-example).

```sh
git clone https://github.com/oktadeveloper/okta-dotnet-react-graphql-example.git
```

This backend uses EntityFramework Core and that powers  an in-memory database with books and authors so you can keep a reading list. It is based on another Okta blog post, [Build a GraphQL API with ASP.NET Core](/blog/2019/04/16/graphql-api-with-aspnetcore), so follow that post to understand more of what happens in the backend. One caveat: that backend is made with `dotnet new webapi`, while the close we use in this post is made with `dotnet new react`. This adds a starter React frontend application, and it also sets up hot reloading, which works straight out of the box when running it in Visual Studio or with the `dotnet` command.

## Add Apollo Boost to the React Frontend

Open a terminal and go to the folder `ClientApp`, which contains the React frontend. Run these npm-commands:

```sh
npm install
npm install apollo-boost @apollo/react-hooks graphql
```

The first one downloads all packages already referenced, and then the second adds Apollo Boost, a library that supports using React Hooks to access GraphQL, and the main GraphQL itself.

React Hooks was released with React v16.8 early in 2019, and it enables using state and other features in React in simple function components. So, you don't need to write a class!

Open **Layout.js**, which sets the main layout for the application, and update it to this:

```js
import React, { Component } from 'react';
import { Container } from 'reactstrap';
import { NavMenu } from './NavMenu';
import { ApolloProvider } from '@apollo/react-hooks';
import ApolloClient from 'apollo-boost'

export class Layout extends Component {
  static displayName = Layout.name;

  render() {
    const clientParam = { uri: '/graphql' };
    const client = new ApolloClient(clientParam);

    return (
      <div>
        <NavMenu />
        <Container>
          <ApolloProvider client={client} >
            {this.props.children}
          </ApolloProvider>
        </Container>
      </div>
    );
  }
}
```

The tag `<ApolloProvider client={client}>` must surround all components that will use GraphQL queries. It also must be configured with an `ApolloClient` instantiated with a parameter telling the URL of the GraphQL endpoint in the backend.

## Rewrite React Component to Use GraphQL

In the `components` folder, open the `FetchData` component and clear everything in it. You will use  `FetchData`  to do a simple query and mutation. Start by adding these imports at the top of the file:

```js
import React, { useState, useCallback } from 'react';
import { useQuery, useMutation } from '@apollo/react-hooks';
import { gql } from 'apollo-boost';
```

The first line imports `useState` and `useCallback`, which are hooks that save state and implement event handlers. The second line imports `useQuery` and `useMutation`, which execute  GraphQL queries and mutations. The last line imports `gql`, which converts plain text to GraphQL queries and mutations. Use it straight away to define your first query. Add these lines right below the `import` statements:

```js
const query = gql`{
author(id:1){
    name,
    books {
      name
    }
  }
}`;
```

This is a GraphQL query for the author with an id of 1, and it asks for the name of the author, and a list of books with only the name of each book. Also, add this code:

```js
export function FetchData() {
  const runningQuery = useQuery(query);
  let author = runningQuery.data && runningQuery.data.author;

 return runningQuery.error ? <div>Error in GraphQL query : <pre>{JSON.stringify(runningQuery.error, null, 2)}</pre></div> :
  !author ? <div>loading...</div> :
    <div>Data: {author.name}
      <ul>
        {author.books.map(book => <li>{book.name}</li>)}
      </ul>
    </div>;
}
```

Here, `useQuery` registers the query, using a hook. Once registered, the query starts the first time the component renders. When the query has finished, the component re-renders, and `runningQuery` will either have data in `runningQuery.data` or an error in `runningQuery.error`. So, if the query returns with a data field that exists and an author, the component will show the name of the author and  a list of all the author's books.

Now, you are ready to run the first version of the app. Press `ctrl+F5` in Visual Studio, or run `dotnet run` in the main folder in the terminal. Select **Fetch Data** in the menu to load data from the backend. It should look something like this:

{% img blog/react-graphql-integration-guide/app-first-run.png alt:"App First Run" width:"800" %}{: .center-image }

Now, add the ability to update the data.

## Add a GraphQL Mutation to Your React Component

Updates are called _mutations_ in GraphQL. Add the following code above the function `FetchData()` in the `FetchData.js` file:

```js
const mutation = gql`
mutation ($name: String!, $id: ID!) {
  addBookToAuthor(name: $name, id: $id) {
    id
    name
    books {
      name
    }
  }
}`;
```

The `addBookToAuthor()` mutation adds a book (`name`) to an author (`id`). The expression has two variables, the`$name` of the author with a GraphQL type of `String!` and `$id` of type `ID!`. The values `$name` and `$id` will be passed to the mutation before it runs.

The mutation takes name and id as parameters and returns an author name and id inside the curly braces. Next, the  mutation returns the id, name, and complete list of books for the author who was returned.

To actually run the mutation, update the function `FetchData()` to this:

```js
export function FetchData() {
  const [myMutation] = useMutation(mutation);
  const runningQuery = useQuery(query);
  const [isSending, setIsSending] = useState(false);
  const [newBookName, setNewBookName] = useState('');
  const [authorFromMutation, setAuthorFromMutation] = useState(null);
  const sendRequest = useCallback(async (newBookName) => {
    if (isSending) return;
    setIsSending(true);
    let result = await myMutation({ variables: { name: newBookName, id: 1 } });
    setIsSending(false);
    setAuthorFromMutation(result.data.addBookToAuthor);
  }, [isSending]);
  let author = authorFromMutation || (runningQuery.data && runningQuery.data.author);

  return !author
    ? <div>loading...</div>
    : <div>Data: {author.name}
      <ul>
        {author.books.map(book => <li>{book.name}</li>)}
      </ul>
      Book name: <input type="text" value={newBookName} onChange={e => setNewBookName(e.target.value)} />
      <input type="button" disabled={isSending} onClick={() => sendRequest(newBookName)} value="Add Book" />
    </div>;
}
```

In the first line, `useMutation(mutation)` registers the mutation in much the same way `useQuery(query)` registers the query. These commands do not start the query or the mutation, they only set them up.

Next, to avoid starting multiple mutations at the same time, you need to store mutation state that includes whether it is running and  what the user is writing in the text input field for book. The mutation also returns data, which you will store in the state, in `authorFromMutation`.

Next, the `sendRequest` function runs the mutation, and is triggered by the user clicking the button. The first two lines ensure that only one mutation runs at a time.

The code `myMutation({ variables: { name: newBookName, id: 1 } })` executes the mutation with an author id of 1, and the book name entered by the user. The result is saved in the state with `setAuthorFromMutation()`, and the next line selects `authorFromMutation`, if it exists, and the result of the query if not.

The HTML code is pretty much the same, but adds a text input field for new book names and a button to trigger the update.

Now, run the application again and add a book. You can reload the page, and you should see that the new book is still there. Because the backend uses an in-memory database, the new books you add will be gone after you restart the backend. After you add a new book, the page should look something like this:

{% img blog/react-graphql-integration-guide/app-final-run.png alt:"App Final Run" width:"800" %}{: .center-image }

## Add Authentication to Your React GraphQL Application

It is surprisingly easy to add authentication to both the backend and the frontend without writing it all yourself from scratch. You can integrate Okta to handle the authentication for you easily:

Sign up for a [forever-free developer account](https://developer.okta.com/signup/) (or login if you already have one). Once you have signed up and logged in, you'll be taken to your dashboard. Make note of your Org URL in the top right corner. It looks something like this: `Org URL: https://dev-######.okta.com`.

In the backend project, edit the file `Startup.cs` and replace `{yourOktaDomain}` in the code below with the value from your Okta Developer Dashboard:

```cs
services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
  .AddJwtBearer(options =>
  {
      options.Authority = "https://{yourOktaDomain}/oauth2/default";
      options.Audience = "api://default";
  });
```

You must also register your application in the Okta dashboard. Select **Applications** at the top, and then click the green button, **Add Application**. Select **Single-Page App** and click **Next**.

Enter "GraphQL" for **Name**, and click **Done**. Then click **Edit** to go back to the form.

Examine what port number your application uses in the browser, and in Okta change both **Login redirect URIs** and the **Initiate login URI** to use your port number _and_ to use `https` instead of `http`. Also, add a **Logout redirect URIs** pointing to the root of your site. Make sure to check **Authorization Code**. It should look something like this:

{% img blog/react-graphql-integration-guide/okta-app-settings.png alt:"Okta App Settings" width:"800" %}{: .center-image }

Click **Save**.

The last thing you need to do in the dashboard is adding a trusted origin. Select **API** in the top menu, and then **Trusted Origins**. Click **Add Origin**. Enter `Localhost` for **Name**, and the same base URL as your application for **Origin URL**. Check both **CORS** and **Redirect**. It should now be somewhat similar to this:

{% img blog/react-graphql-integration-guide/okta-add-origin.png alt:"Okta Add Origin" width:"600" %}{: .center-image }

Click **Save**.

Now, add authentication to the front end. Okta has a library for React; install it by running this in a terminal in the `ClientApp` folder:

```sh
npm install @okta/okta-react@1.2.3
```

Next, go to `App.js` in the `ClientApp/src`, and add one more import:

```js
import { Security, SecureRoute, ImplicitCallback } from '@okta/okta-react';
```

Also, surround the existing HTML with a `<Security>` -tag, change `/fetch-data` to a `SecureRoute`, and add a route for `/implicit/callback`, so you have this:

```js
render() {
  return (
    <Security issuer='https://{yourOktaDomain}/oauth2/default'
      clientId='{yourClientId}'
      redirectUri={window.location.origin + '/implicit/callback'}
      pkce={true}>
      <Layout>
        <Route exact path='/' component={Home} />
        <Route path='/counter' component={Counter} />
        <SecureRoute path='/fetch-data' component={FetchData} />
        <Route path='/implicit/callback' component={ImplicitCallback} />
      </Layout>
    </Security>
  );
}
```

Remember to replace `{yourOktaDomain}` with your personal okta domain, which you can find in the Okta Dashboard, and replace `{yourClientId}` with the client id you can find in the applications listing.

If you run the application now, you should not be able to access the Fetch Data page without being logged in. If you are not logged in, you will be redirected to Okta for authentication, and then back to the page.

## Add API Authorization with Okta

One thing remains, to protect the API for unauthorized access. Add an `[Authorize]`-attribute above the `Post()`-method in `GraphQLController` in the backend. It should look like this:

```cs
[Authorize]
public async Task<IActionResult> Post([FromBody] GraphQLQuery query)
```

Now, when logged in, you can access the page, but the call will fail and you won't get any data. (Watch your web browser's developer console to see the error message.) To fix that, edit `Layout.js` to add this import:

```js
import withAuth from '@okta/okta-react/dist/withAuth';
```

Also, add some lines between `const clientParam = ...` and `const client = ...`:

```js
const clientParam = { uri: '/graphql' };
let myAuth = this.props && this.props.auth;
if (myAuth) {
  clientParam.request = async (operation) => {
    let token = await myAuth.getAccessToken();
    operation.setContext({ headers: { authorization: token ? `Bearer ${token}` : '' } });
  }
}
const client = new ApolloClient(clientParam);
```

If you are authenticated, this code will get an access token from Okta, and pass it to the backend, along with all requests sent with the Apollo Client.

To make sure `this.props.auth` is set, wrap this component with the `withAuth()`-function that comes with the Okta React authentication library. Add this line to the end of the `Layout.js` file:

```js
export default Layout = withAuth(Layout);
```

Run, and enjoy your app with easy and secure GraphQL queries to a .NET Core backend!

## Learn More about GraphQL, React, .NET and Okta

Here are some related blog posts to learn more about GraphQL, React, and Okta:

- [Build a GraphQL API with ASP.NET Core](/blog/2019/04/16/graphql-api-with-aspnetcore)
- [Build a Secure API with Spring Boot and GraphQL](/blog/2018/08/16/secure-api-spring-boot-graphql)
- [Build a Simple API Service with Express and GraphQL](/blog/2018/09/27/build-a-simple-api-service-with-express-and-graphql)
- [Build a CRUD App with Node.js and GraphQL](/blog/2019/05/29/build-crud-nodejs-graphql)
- [Build a Simple Web App with Express, React and GraphQL](/blog/2018/10/11/build-simple-web-app-with-express-react-graphql)

If you have any questions about this post, please add a comment below. For more awesome content, follow us on [Twitter](https://twitter.com/oktadev), like us on [Facebook](https://www.facebook.com/oktadevelopers/), or subscribe to our [YouTube channel](https://www.youtube.com/c/oktadev).
