---
disqus_thread_id: 8179204633
discourse_topic_id: 17280
discourse_comment_url: https://devforum.okta.com/t/17280
layout: blog_post
title: "Build a Simple React Application Using Hooks"
author: holger-schmitz
by: contractor
communities: [javascript]
description: "This tutorial shows you how to use React Hooks to build a simple, secure app."
tags: [react, reacthooks, javascript]
tweets:
- "Learn how to use functional components in @reactjs in this quick tutorial."
- "⚛️ React Hooks will let you embrace your inner functional programmer. Learn how to use them today!"
- "Use @reactjs hooks with @okta for authentication! It's sooo simple!"
image: blog/react-hooks/react-hooks.png
type: conversion
---

If you have been developing React applications, then you probably know that there are two ways of creating React components. You can create a component class that extends from `React.Component`. You then have to implement specific methods such as `render()` that renders the component. The alternative is to create a functional component. This type of component is simply a JavaScript function that returns a rendered element. 

Functional components are much shorter, they contain less boilerplate code, and everything is contained in one function. Until recently, there was another big difference between class components and functional components. Functional components could not contain any state. These stateless components are lightweight, and they encourage separating the presentation from the application logic.

Then React introduced Hooks. Hooks allow you to obtain data and a callback function that can modify the data. This allows you to add state to functional components, making them much more powerful. In this way, you can create complete stateful React components using the terse functional style. 

In this tutorial, I will be showing you how to create a simple React application using Hooks to add state to a functional component. The application is a simple search form for books by their title and uses the Open Library API to obtain real book data.

**Table of Contents**{: .hide }
* Table of Contents
{:toc}

## Creating a React Application with Hooks

In the following, I will assume that you have some knowledge of JavaScript and that you have Node installed on your system. You do not need any experience with React, and I will be explaining all the major concepts. A typical Node installation comes together with two command-line tools, `npm` and `npx`. 

`npm` is used for installing packages into a project, and `npx` is used to run Node commands from the command line. The beauty of `npx` is that the commands don't necessarily need to be installed on your system. `npx` will first look in your current project folder to see if a command is installed there. When it can't find it on your computer, it will look in the [npmjs.com](https://npmjs.com) repository, load the latest version of the command script and run it, without installing it locally. This feature can be used to create a skeleton React application in just a few key presses. Open a terminal in a folder of your choice and run the following command.

```bash
npx create-react-app react-books-with-hooks
```

This will create a new folder `react-books-with-hooks` and initialize it with a basic React application. You can now open up the project in your favorite IDE. Inside the project, you will see a `src` folder with the main application component, `App.js`.

When you look inside this file, you can see that it contains a single `function App()`. This function returns an element, and it uses an extended JavaScript syntax, known as JSX, to define the component. JSX allows you to write HTML-style template syntax straight into your JavaScript file. The React toolchain is set up to convert this mix of JavaScript and HTML into pure JavaScript that renders the HTML element.

You can define your own React components simply by writing a function that returns a JSX element. Try it out. Create a new file, `src/Search.js`, and paste the following code into it.

```jsx
import React from 'react';

export function Search() {
  return (
    <div>
      <div className="search-input">
        <input type="text" placeholder="Search"/>
      </div>
      <h1 className="h1">Search Results</h1>
      <div className="books">
        <table>
          <thead>
            <tr>
              <th className="title-col">Title</th>
              <th className="author-col">Author</th>
              <th className="year-col">Pub Year</th>
            </tr>
          </thead>
          <tbody></tbody>
        </table>
      </div>
    </div>
  );
}
```

This is all you need to create a component. Of course, it doesn't yet do anything and only displays an empty table. But you can already use the `Search` component in the application. Open up `src/App.js` again and add the following import to the top of the file.

```js
import { Search } from './Search';
```

Now remove the import of the `logo.svg` and then replace the contents of returned value in the `App()` function with the code below.

```jsx
<div className="App">
  <header>
    Books with Hooks
  </header>
  <Search/>
</div>
```

You will notice the `<Search/>` element has been used as if it was an HTML element. The JSX syntax allows you to include components in this way directly in your JavaScript code. You can already test your application by running the following command in your terminal.

```bash
npm start
```

This will compile the application and open your default browser to `http://localhost:3000`. You can leave this command running while you're developing your code, and it will keep on updating the application and reloading the browser page every time you modify and save the code.

So far, the application works, but it doesn't look nice, and it doesn't react to any user input.

## Adding State with React Hooks

In this section, I will show you how to use Hooks to create state and update the search results depending on that state. First, create a function that loads content from the Open Library web service. Open `src/Search.js` and paste the following code after the import statements.

```js
const baseUrl = 'http://openlibrary.org';

export function searchBooks(query) {
    const url = new URL(baseUrl + '/search.json');
    url.searchParams.append('title', query);

    return fetch(url).then(response => response.json());
}
```

This uses the browser's `fetch()` API to get data from a server and return a JavaScript `Promise` that resolves with the server's response. 

Now, inside the `Search()` function, before the return statement, add the following code.

```jsx
const [results, setResults] = React.useState(0);

const handleSearch = (event) => {
  searchBooks(event.target.value).then(response => {
    setResults(response.docs);
  });
};

const resultList = (results || []).map((book) =>
  <tr key={book.key}>
    <td>{book.title}</td>
    <td>{book.author_name && book.author_name.join(', ')}</td>
    <td>{book.first_publish_year}</td>
  </tr>
);
```

The first line calls `React.useState()` to obtain a stateful variable. `useState()` returns an array with two entries. The first entry is the current value of the state variable. This will be `undefined` until you update the state. The second entry is a function that you can call to update the state. In the example above, I have called the state variable `results` and the callback `setResults()`. 

After obtaining the state, the code above defines an event handler. This simply calls the `searchBooks()` function and, once a response from the server is received, calls the `setResults()` callback to update the state. You do not have to worry about telling React to re-render the component. When you update the state, React will automatically check which parts of the application have changed and re-render them. Finally, a `resultList` is created that represents the search results in an array of HTML table rows.

You can now add the `handleSearch()` event handler to the input element. Modify the `<input>` element that is part of the returned JSX code to match the code below.

```jsx
<input onChange={handleSearch} type="text" placeholder="Search"/>
```

To render the results inside the table, modify the `<tbody>` element to render the `resultList`.

```jsx
<tbody>{resultList}</tbody>
```

In both cases, the curly braces are used to insert the value of variables into the rendered HTML.

## Add Authentication to Your React App

Real-life web applications require access control. Some parts of the application should be restricted to a limited number of users. Creating your own user management and securing your application is difficult and requires a lot of expertise. Okta allows you to set up authentication with just a few lines of code.

{% include setup/cli.md type="spa" framework="React" loginRedirectUri="http://localhost:3000/callback" %}

Take note of the **Client ID**. This needs to be pasted into your JavaScript code.

To make use of Okta in your React app, open the terminal in your project directory, and install the Okta React SDK with the React router by running the following commands.

```bash
npm install -E @okta/okta-react@3.0.4 react-router-dom@5.2.0
```

In `src/App.js`, add the imports for these two packages to the top of the file.

```js
import { BrowserRouter as Router, Route, Link } from 'react-router-dom';
import { LoginCallback, SecureRoute, Security } from '@okta/okta-react';
import { Home } from './Home';
```

The router is responsible for looking at the route part of the URL and selecting the right React component to render. To add the router to your application, replace the component returned in the `render()` function with the code below.

```jsx
<div className="App">
  <Router>
    <header>
      <div>Books with Hooks</div>
      <ul className="menu"><li><Link to="/">Home</Link></li><li><Link to="/search">Search</Link></li></ul>
    </header>
    <Security issuer='https://{YourOktaDomain}/oauth2/default'
              clientId='{ClientId}'
              redirectUri={window.location.origin + '/callback'}
              pkce={true}>
      <Route path='/' exact={true} component={Home}/>
      <SecureRoute path='/search' exact={true} component={Search}/>
      <Route path='/callback' component={LoginCallback}/>
    </Security>
  </Router>
</div>
```

Here `{YourOktaDomain}` is your Okta developer domain. You can find this on the Okta dashboard tab. `{ClientId}` is the client ID that you obtained earlier when you registered the application. I have added a reference to a `Home` component. Implement this by creating a new file `src/Home.js` and pasting the following code into it.

```jsx
import React from 'react';
import { useOktaAuth } from '@okta/okta-react';

export function Home() {
  const { authState, authService } = useOktaAuth();

  const login = () => { authService.login('/'); }
  const logout = () => { authService.logout('/'); }

  const userText = authState.isAuthenticated
    ? <div><p>You are signed in!</p><button onClick={ logout }>Logout</button></div>
    : <div><p>You need to sign in to use the application!</p><button onClick={ login }>Sign In</button></div>;

  return <div className="page-home"><h1>Welcome to Books with Hooks</h1>{ userText }</div>;
}
```

## Add Some Finishing Touches

You have created a functioning application, but it doesn't look very nice yet. Of course, styling web applications is done using Cascading Style Sheets (CSS). You might have noticed the import of `App.css` at the top of the `App.js` file. React configures your application so that CSS files can be directly imported into the component JavaScript files. The styles will then automatically be applied to the component. You can add some styling by opening the `src/App.css` file and replacing its contents with the following code.

```css
.App header {
  background-color: #282c34;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  color: white;
  padding: 0.5rem 1rem;
}

ul.menu {
  list-style: none;
}

ul.menu li {
  display: inline;
  padding: 12px;
}

ul.menu a {
  color: #ffffff;
}

.page-home {
  text-align: center;
}

.content {
  text-align: left;
  display: inline-block;
  background-color: #ffffff;
  width: 100%;
  max-width: 1232px;
  padding: 16px;
  box-sizing: border-box;
}

h1 {
  text-align: center;
}

.books table {
  width: 100%;
}

.title-col {
  max-width: 60%;
}

.search-input {
  padding: 4px;
  text-align: center;
}

.search-input input {
  display: inline-block;
  width: 50%;
}
```

Congratulations! You have successfully created a React app that uses Hooks to manage state inside its components. You can run the following command again if it isn't still running.

```bash
npm start
```

In your browser at `http://localhost:3000`, you will be redirected to the Okta sign-in page. After successfully entering your credentials, you should see something like the following.

{% img blog/react-hooks/search-results.png alt:"The completed application" width:"800" %}{: .center-image }

When you enter a search term and click enter, the results might take a few seconds to render, so give it a few.

## Learn More About React and Single Page Applications

In this tutorial, I have shown you how to create a simple React application using functional components. Using the new Hooks in React allows you to add state to functional components. This was previously reserved for React components that were defined using ES6 classes. Extending the capabilities of functional components opens up new possibilities. But it also undermines the strict separation between the purely stateless view and the stateful model of an application. 

This is in line with the general philosophy of the React framework. While other frameworks impose strict guidelines and force the developer into a predefined architecture, React attempts to be as least opinionated as possible. It is up to the individual developer to apply the right architecture to a project. React simply empowers the developer with the freedom of choice.

The code for this tutorial is available on GitHub in the [@oktadeveloper/okta-react-books-with-hooks-example]( https://github.com/oktadeveloper/okta-react-books-with-hooks-example). 

If you want to learn more about React and other front-end frameworks, please check out the following links.

* [A Quick Guide to React Login Options](/blog/2020/12/16/react-login)
* [Use Sass with React to Build Beautiful Apps](/blog/2019/12/17/react-sass)
* [Build a React App with Styled Components](/blog/2020/03/16/react-styled-components)
* [Build Beautiful Angular Apps with Bootstrap](/blog/2020/03/02/angular-bootstrap)
* [Use Vue and GraphQL to Build a Secure App](/blog/2019/11/11/graphql-vue)

Please leave a comment below if you have any questions! If you liked this tutorial, [follow @oktadev](https://twitter.com/oktadev) on Twitter to be notified when we publish new ones. We also have a [YouTube channel](https://youtube.com/c/oktadev) you might like.
