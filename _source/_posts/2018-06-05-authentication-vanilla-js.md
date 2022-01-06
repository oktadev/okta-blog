---
disqus_thread_id: 6712462476
discourse_topic_id: 16877
discourse_comment_url: https://devforum.okta.com/t/16877
layout: blog_post
title: "Add Authentication to Your Vanilla JavaScript App in 20 Minutes"
author: brandon-parise
by: contractor
communities: [javascript]
description: "This shows how to create an app with plain ol' vanilla JavaScript and add authentication to it to secure its communication with a REST API."
tags: [javascript, es6, vanilla-javascript, vanilla-js, authentication]
tweets:
 - "Having a hard time with JavaScript Framework Fatigue? Check out this tutorial that builds a calorie tracking app with good ol' JavaScript. No frameworks, no problem! 😃"
 - "Want to get your hands dirty with good ol' JavaScript? This tutorial doesn't use any JavaScript frameworks to build an app. The build process is amazing! 🤘"
type: conversion
github: https://github.com/oktadev/okta-vanilla-js-example
changelog:
  - 2020-01-06: Updated dependencies, code, and screenshots. See this post's changes in [okta-blog#1020](https://github.com/oktadev/okta-blog/pull/1020) and the example app changes in [okta-vanilla-js-example#2](https://github.com/oktadev/okta-vanilla-js-example/pull/2). 
---

*"Sometimes nothing is good enough"* is a phrase that software engineers don't speak or hear often. In the fast-changing world of web development, there is no shortage of bleeding-edge JavaScript frameworks promising to make your life easier or inch out its predecessors. You may ask yourself if it is even possible to build a modern web application without one of these frameworks, let alone add secure authentication. Well, it is!

Vanilla JavaScript is frequently used to describe ordinary JavaScript leveraging the browser and DOM APIs. Yes, you read that correctly. No Angular, React, Vue, or even jQuery. And even better, it's not as complicated as you might assume.

There are many reasons you may decide to forgo the framework bloat for vanilla JavaScript. Its raw speed and non-complicated build process are among my top reasons. Regardless of your reasons, this article might serve as a refresher on leveraging the power of JavaScript to create some great user experiences.

Along with a simple build process for your application, I'll demonstrate how simple it is to add secure user authentication with Okta. Before we get started, let me tell you what Okta is and why I think Okta is a no-brainer choice for your next front-end project.

## What is Okta?

Okta is a cloud service that allows developers to create, edit, and securely store user accounts and user account data and connect them with multiple applications. Our API enables you to:

* [Authenticate](https://developer.okta.com/docs/concepts/authentication/) and [authorize](https://developer.okta.com/books/api-security/authz/) your users
* Store data about your users
* Perform password-based and [social login](https://developer.okta.com/docs/guides/social-login/)
* Secure your application with [multi-factor authentication](https://developer.okta.com/docs/guides/mfa/ga/main/)
* And much more! Check out our [product documentation](https://developer.okta.com)

In short: we make [authentication and user management](https://developer.okta.com/product/user-management/) a lot easier, more secure, and more scalable than what you're probably used to.

Sound amazing? [Register for a free developer account](https://developer.okta.com/signup/), and when you're done, come on back so we can learn more about building applications with secure authentication in Vanilla JavaScript.

Now, let's dive in!

## Your Project: Secure Authentication for Vanilla JavaScript

You will create a calorie counter app using just JavaScript DOM APIs and a simple REST server. The goal is to create a web interface to track meals and display a running total of calories. For the backend, you will use Express to serve your static files and expose a few REST methods to manage meals.

You will inevitably have to integrate an external library or dependency in an app at some point. And since every app needs authentication, I'll show you how to integrate [Okta's Sign-In Widget](https://developer.okta.com/code/javascript/okta_sign-in_widget) to authenticate a user and verify REST API requests coming from an authenticated user.

Here's a quick preview of what you will build.

{% img blog/vanilla-js/calorie-tracker.png alt:"Calorie Tracker" width:"600" %}{: .center-image }

### ES6 FTW!

With roughly [90% browser support worldwide](https://caniuse.com/#search=es6) and numerous language improvements, ES6 is a clear choice over ES5. ES6 provides many enhancements like classes, template strings, let/const, arrow functions, default parameters, and destructuring assignment. Or, in another words, it makes JavaScript even more awesome.

If you require more comprehensive browser support, you can use [babel](https://babeljs.io/) to transpile ES6 to ES5 to support nearly 100% of browsers.

## Create a Static File Server in Vanilla JS

Perhaps the best part of using vanilla JavaScript is not having a lengthy bootstrap process or complicated build scripts. All you need is a static file server and a few files to get started.

Create a new directory for your app (I used `vanilla-js`). Open your favorite terminal and `cd` into the directory. Initialize your app and install a single dependency:

```bash
npm init -y
npm install express@4
```

Create an `index.js` file in your project root and paste the following code into it.

```js
const express = require('express')

const app = express()

app.use(express.static('public'))

app.listen(8080, () => {
  console.log('App listening on port 8080!')
})
```

This code will start an Express server on port 8080 and serve static files from`public/` directory in your project root.

To complete the setup, create a `public` directory in your project root and create the following two files in it:

First, `public/index.html`:

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Calorie Tracker</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css">
  </head>
  <body>
    <div id="app" class="container pt-4">
      <h1>Hello, World!</h1>
    </div>
    <script type="text/javascript" src="/main.js"></script>
  </body>
</html>
```

And second, `public/main.js`:

```js
class App {
  init () {
    this.render ()
  }
  render () {
  }
}

let app = new App()
app.init()
```

### Launch the Express App

While in your terminal, run `node .` and your Express server should startup. Open a browser and navigate to `http://localhost:8080`.

{% img blog/vanilla-js/hello-world.png alt:"Hello World" width:"600" %}{: .center-image }

## Get Familiar with the DOM

You are going to work directly with the [DOM](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Introduction) (Document Object Model). The DOM is an interface to change an HTML page's structure, style, and content. Using the DOM, you can render meals, listen to form events, and update the total calories with JavaScript.

To illustrate this quickly, let's use the DOM to change an element's text color. In `main.js`, add the following code to the `render()` method:

```js
render () {
  let el = document.getElementById('app')
  el.style.color = '#F00'
}
```

{% img blog/vanilla-js/hello-world-red.png alt:"Hello World" width:"600" %}{: .center-image }

Go back to your browser and refresh. Voila, red text! **Mind blown**! Okay, it's not the most impressive example ever, but it is a basic example of how you can interact with HTML elements with JavaScript.

### Create Nodes

You can build and render complex, dynamic objects by leveraging the DOM. Now that you are a ninja at changing colors try something more advanced: creating nodes. A "node" in this context is an HTML element ("nodes" and "elements" are frequently used to represent the same thing).

You can use the DOM to append a `<div>Oh my!</div>` to the `<app />` element.  Modify `main.js` to the following.

```js
render () {
  let el = document.getElementById('app')
  let div = document.createElement('div')
  div.textContent = 'Oh my!'
  el.appendChild(div)
}
```

Refresh the web page. A `<div/>` node was not-so-magically appended to your webpage. The `render()` method builds a new `<div />`, sets the text, and appends it to the app.

{% img blog/vanilla-js/hello-world-ohmy.png alt:"Hello World - Oh my!" width:"600" %}{: .center-image }

### Remove Nodes

You can remove nodes just as easily by calling `node.remove()`. Add the following `setTimeout` call to the end of your `render()` method to see this in action. The newly created div should disappear after two seconds.

```js
render () {
  let el = document.getElementById('app')
  let div = document.createElement('div')
  div.textContent = 'Oh my!'
  el.appendChild(div)
  setTimeout(() => div.remove(), 2000)
}
```

There are other ways you can remove nodes with the DOM like `parent.removeChild(node)`, but for the sake of simplicity, `node.remove()` tends to be the easiest to understand.

### Render Lists

It's common for web apps to render items inside a loop. Since you will be doing this in your app for rendering individual meals, I wanted to step you through a few ways you can accomplish this and showcase some hidden drawbacks to each approach.

**Example 1:** Concat each list element to the parent's `innerHTML` property:

```js
render () {
  let meals = [
    { id: 1, title: 'Breakfast Burrito', calories: 150 },
    { id: 2, title: 'Turkey Sandwich', calories: 600 },
    { id: 3, title: 'Roasted Chicken', calories: 725 }
  ]
  let el = document.getElementById('app')
  for (let meal of meals) {
    el.innerHTML += `<div><span>${meal.title}</span></div>`
  }
}
```

Although this is the easiest, it's also pretty bad. For every loop iteration, you delete the entire parent element from the DOM and re-insert it. This might not be an issue with ten elements, but it will cause the browser to slow down to a crawl trying to render longer lists.

A better way would be to append new elements to the parent element so the browser doesn't have to reprocess the entire parent element on each iteration.

**Example 2:** Use DOM API to create a new element and append it to the parent:

```js
render () {
  /* ... */
  for (let meal of meals) {
    let elMeal = document.createElement('div')
    elMeal.innerHTML = `<span>${meal.title}</span>`
    el.appendChild(elMeal)
  }
}
```

Using `appendChild()` cuts down significantly on the processing. But, there is one minor drawback to this approach when rendering larger lists: reflows. Reflow is the technical term of the web browser process that computes the page's layout. For every loop iteration, the browser has to recalculate the position of each appended element.

A better way would be to batch all the new items into one operation, so the reflow only occurs once.

**Example 3:** Batch insert nodes using [`DocumentFragment`](https://developer.mozilla.org/en-US/docs/Web/API/DocumentFragment):

```js
render () {
  /* ... */
  let fragment = document.createDocumentFragment()
  for (let meal of meals) {
    let elMeal = document.createElement('div')
    elMeal.innerHTML = `<span>${meal.title}</span>`
    fragment.appendChild(elMeal)
  }
  el.appendChild(fragment)
}
```

We can batch our appends by creating a [`DocumentFragment`](https://developer.mozilla.org/en-US/docs/Web/API/DocumentFragment) which is calculated and tracked outside the current DOM. Since `DocumentFragment` works outside the current DOM, we can build the list of items then insert them into the DOM using one operation. This simple design change can significantly impact the speed at which the browser can render lists.

Using this optimal approach, your `public/main.js` file should now look like this.

```js
class App {
  init () {
    this.render ()
  }
  render () {
    let meals = [
      { id: 1, title: 'Breakfast Burrito', calories: 150 },
      { id: 2, title: 'Turkey Sandwich', calories: 600 },
      { id: 3, title: 'Roasted Chicken', calories: 725 }
    ]
    let el = document.getElementById('app')
    let fragment = document.createDocumentFragment()
    for (let meal of meals) {
      let elMeal = document.createElement('div')
      elMeal.innerHTML = `<span>${meal.title}</span>`
      fragment.appendChild(elMeal)
    }
    el.appendChild(fragment)
  }
}

let app = new App()
app.init()
```

Refresh your browser, and you should see a list of meals.

{% img blog/vanilla-js/hello-world-meals.png alt:"Hello World - Meals List" width:"600" %}{: .center-image }

## Build your App Frontend in Vanilla JavaScript

Now that you have a core understanding of the necessary DOM APIs, you can move on to building the app. Copy and paste the following code into `public/index.html`. This code will get your app to look like the screenshot at the beginning of the article.

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Calorie Tracker</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css">
  </head>
  <body>
    <div class="container pt-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h2>Calorie Tracker</h2>
        <div>Total Calories: <strong id="total">-</strong></div>
      </div>
      <div id="meals-container">
        <div class="row">
          <div class="col-3">
            <div class="card">
              <div class="card-body">
                <form id="form-entry" class="mb-0">
                  <div class="form-group">
                    <label for="title">Title</label>
                    <input type="text" class="form-control" id="title">
                  </div>
                  <div class="form-group">
                    <label for="calories">Calories</label>
                    <input type="number" class="form-control" id="calories">
                  </div>
                  <button type="submit" class="btn btn-primary">Submit</button>
                </form>
              </div>
            </div>
          </div>
          <div class="col-9">
            <ul class="list-group" id="meals"></ul>
          </div>
        </div>
      </div>
    </div>
    <script type="text/javascript" src="/main.js"></script>
  </body>
</html>
```

### Manage Meals

You will create several methods to manage meals within the app.  Copy and paste the following code into `public/main.js` to get started.  I will step through each code chunk below in detail.

```js
class App {
  constructor () {
    this.meals = []
    document.getElementById('form-entry').addEventListener('submit', (event) => {
      event.preventDefault()
      this.addMeal({
        id: Date.now(), // faux id
        title: document.getElementById('title').value,
        calories: parseInt(document.getElementById('calories').value)
      })
    })
  }
  init () {
    this.meals = [
      { id: 1, title: 'Breakfast Burrito', calories: 150 },
      { id: 2, title: 'Turkey Sandwich', calories: 600 },
      { id: 3, title: 'Roasted Chicken', calories: 725 }
    ]
    this.render()
  }
  addMeal (meal) {
    document.getElementById('meals').appendChild(this.createMealElement(meal))
    this.meals.push(meal)
    this.updateTotalCalories()
  }
  deleteMeal (id) {
    let index = this.meals.map(o => o.id).indexOf(id)
    this.meals.splice(index, 1)
    this.updateTotalCalories()
  }
  updateTotalCalories () {
    let elTotal = document.getElementById('total')
    elTotal.textContent = this.meals.reduce((acc, o) => acc + o.calories, 0).toLocaleString()
  }
  createMealElement ({ id, title, calories }) {
    let el = document.createElement('li')
    el.className = 'list-group-item d-flex justify-content-between align-items-center'
    el.innerHTML = `
      <div>
        <a href="#" class="remove">&times;</a>
        <span class="title">${title}</span>
      </div>
      <span class="calories badge badge-primary badge-pill">${calories}</span>
    `
    // when the 'x' delete link is clicked
    el.querySelector('a').addEventListener('click', (event) => {
      event.preventDefault()
      this.deleteMeal(id)
      el.remove()
    })
    return el
  }
  render () {
    let fragment = document.createDocumentFragment()
    for (let meal of this.meals) {
      fragment.appendChild(this.createMealElement(meal))
    }
    let el = document.getElementById('meals')
    while (el.firstChild) {
      el.removeChild(el.firstChild) // empty the <div id="meals" />
    }
    el.appendChild(fragment)
    this.updateTotalCalories()
  }
}

let app = new App()
app.init()
```

### Render Stored Meals

When the app first loads, it should initially render all stored meals.  As I discussed above, using `DocumentFragments` to batch add DOM elements is the way to go.

```js
render () {
  let fragment = document.createDocumentFragment()
  for (let meal of this.meals) {
    fragment.appendChild(this.createMealElement(meal))
  }
  let el = document.getElementById('meals')
  while (el.firstChild) {
    el.removeChild(el.firstChild) // empty the <div id="meals" />
  }
  el.appendChild(fragment)
  this.updateTotalCalories()
}
```

### Update Total Meal Calories

Since the `<span id="total" />` element existed when we rendered the page, we can just update its content with a call to `node.textContent()`.  The following snippet uses `Array.reduce` to "reduce" the array to a single value: the total calories of all meals.

```js
updateTotalCalories () {
  let calories = this.meals.reduce((acc, o) => acc + o.calories, 0)
  document.getElementById('total').textContent = calories
}
```

### Add a New Meal

To add new meals you need to bind an event listener to the form so you can grab the form values without the form submitting.  When the form is submitted, you should always call `event.preventDefault()` which will prevent the default behavior of the form submitting.

```js
document.getElementById('form-entry').addEventListener('submit', (event) => {
  event.preventDefault()
  this.addMeal({
    id: Date.now(), // faux id
    title: document.getElementById('title').value,
    calories: parseInt(document.getElementById('calories').value)
  })
})
```

Since users are only likely to add one meal at a time, you can use `appendChild` on the parent element to insert the new meal into the DOM.  You could use a `DocumentFragment` here, but the difference in time/processing would be insignificant since both operations will result in a single reflow.

```js
addMeal (meal) {
  document.getElementById('meals').appendChild(this.createMealElement(meal))
  this.meals.push(meal)
  this.updateTotalCalories()
}
```

### Remove a Meal

As you can see in the markup for each meal, there is a small "x" on the left of the name.  You will bind an event listener to this element to remove the meal when it's clicked.  You can attach a click event listener when creating the meal element to achieve this.

```js
createMealElement ({ id, title, calories }) {
  /* .. */
  // when the 'x' delete link is clicked
  el.querySelector('a').addEventListener('click', (event) => {
    event.preventDefault()
    this.deleteMeal(id)
    el.remove()
  })
  return el
}
```

The `deleteMeal()` method will remove the meal from the local array and update the total calories.

```js
deleteMeal (id) {
  let index = this.meals.map(o => o.id).indexOf(id)
  this.meals.splice(index, 1)
  this.updateTotalCalories()
}
```

### Take Your New Vanilla JavaScript App for a Test Drive

Tab back to your browser and hit refresh. You should be able to add and delete meals!

{% img blog/vanilla-js/calorie-tracker-ice-cream.png alt:"Calorie Tracker with Ice Cream" width:"600" %}{: .center-image }

## Add REST Routes to the Express Server

Now that your frontend can add and remove meals from a local array, it's time for you to wire up the backend to store meal data on the server.  In my previous tutorial [Build a Basic CRUD App with Vue.js and Node](/blog/2018/02/15/build-crud-app-vuejs-node), I showed how to persist data to SQLite using Sequelize and Epilogue.

But, to keep things simple and focused on the front end, you will use a local in-memory store (an array) on the server.  Storing data in memory is not for production, as every time you restart the server, the array resets.

Stop the server by pressing `CTRL+C` and install the following dependency:

```
npm install body-parser@1
```

Copy the following code and paste it into `index.js`:

```js
const express = require('express')
const bodyParser = require('body-parser')

const app = express()
app.use(bodyParser.json())
app.use(express.static('public'))

// store in memory
let meals = []

app.get('/meals', (req, res) => {
  return res.send(meals)
})

app.post('/meals', (req, res) => {
  let meal = req.body
  meal.id = Date.now()
  meals.push(meal)
  return res.send(meal)
})

app.delete('/meals/:id', (req, res) => {
  let id = parseInt(req.params.id)
  const index = meals.map(o => o.id).indexOf(id)
  if (index !== -1) {
    meals.splice(index, 1)
  }
  return res.send()
})

app.listen(8080, () => {
  console.log('App listening on port 8080!')
})
```

This will expose the following endpoints:

- `GET /meals` - Returns all meals
- `POST /meals` - Add a new meal
- `DELETE /meals/:id` - Removes a meal

Restart your server by running `node .`.  Next up, you'll connect the frontend using Vanilla JS + AJAX.

## Make an AJAX Request Without a Library

Now that you have set up the required REST endpoints, it's time to call them from the browser.  AJAX (via `XMLHttpRequest`) has been around for a while now but not surprisingly most developers have never written (or even seen) an `XMLHttpRequest` request.

I'll admit: I grew up on jQuery.  It abstracted many browsers and DOM-specific quirks.  Later in my career, I found it enlightening to challenge myself to not rely on jQuery.  The site [http://youmightnotneedjquery.com/](http://youmightnotneedjquery.com/) has been an excellent resource that shows you side-by-side, standard jQuery calls to vanilla JS.

A `GET` AJAX request is as simple as:

```js
let xhr = new XMLHttpRequest()
xhr.open('GET', '/the/url', true)
xhr.onload = () => {
  if (xhr.status === 200) {
    alert(`Got a response: ${xhr.responseText}`)
  } else {
    alert(`Request failed with status ${xhr.status}`)
  }
}
xhr.send()
```

To make your code a bit more reusable, you can wrap an `XMLHttpRequest` call within a `Promise` that will allow it to be called via async/await.  This method can handle all methods like `GET`, `POST`, and `DELETE`.

In `public/main.js`, add the following class method:

```js
request (method, url, data = null) {
  return new Promise((resolve, reject) => {
    let xhr = new XMLHttpRequest()
    xhr.open(method, url, true)
    xhr.setRequestHeader('Content-Type', 'application/json')
    xhr.onload = () => {
      if (xhr.status === 200) {
        return resolve(JSON.parse(xhr.responseText || '{}'))
      } else {
        return reject(new Error(`Request failed with status ${xhr.status}`))
      }
    }
    if (data) {
      xhr.send(JSON.stringify(data))
    } else {
      xhr.send()
    }
  })
}
```

### Use Async and Await

With ES6, `async/await` brings you added control over asynchronous programming by leveraging promises but in a synchronous way. You can use `async/await` to make your code cleaner while maintaining non-blocking operations.

To illustrate this, I'll briefly show you the evolution of asynchronous programming.

To start, I call two asynchronous methods: `getUser` and `getPostsByUserId`.  Then I display the number of posts to the console.

```js
getUser((err, user) => {
  if (err) {
    return console.log(err)
  }
  getPostsByUserId(user.id, (err, posts) => {
    if (err) {
      return console.log(err)
    }
    console.log('found %s posts', posts.length)
  })
)
```

Promises came along, removing the need for individual callbacks by allowing you to chain together multiple promises. Additionally, you can handle errors with a single `catch` method.

```js
getUser()
  .then(user => {
    return getPostsByUserId(user.id)
  })
  .then(posts => {
    console.log('found %s posts', posts.length)
  })
  .catch(err => {
    console.log(err)
  })
```

Now with `async/await`, you can combine the best of promises with a synchronous coding style.  Using this approach, you can make your code much easier to understand and bring back your sanity when orchestrating a long chain of asynchronous calls.

```js
async getPosts () => {
  try {
    let user = await getUser()
    let posts = await getPostsByUserId(user.id)
    console.log('found %s posts', posts.length)
  } catch (err) {
    console.log(err)
  }
}
getPosts()
```

**Note:** As you can see above, any call using the `await` keyword must be called from within an `async` method.  Also, `async` methods return `Promise` implicitly.

### Add API Integration to Your Vanilla JS App

When your app initializes, you want to fetch all stored meals from the server and render them.  Using the `request()` method above, it's a breeze.  Replace `init()` method in `public/main.js` with the following code:

```js
async init () {
  try {
    this.meals = await this.request('GET', '/meals')
    this.render()
  } catch (err) {
    alert(`Error: ${err.message}`)
  }
}
```

Adding a meal introduces a `POST /meals` call to store the data on the server.  If this method succeeds, the code should push the new meal onto the local array and recalculate the total calories.  Replace the `addMeal` method in `public/main.js` with the following code:

```js
async addMeal (data) {
  try {
    const meal = await this.request('POST', '/meals', data)
    document.getElementById('meals').appendChild(this.createMealElement(meal))
    this.meals.push(meal)
    this.updateTotalCalories()
  } catch (err) {
    alert(`Error: ${err.message}`)
  }
}
```

And finally, deleting a meal is done by calling `DELETE /meals/:id` on the server. The meal is removed from the local array and total calories recalculated.

```js
async deleteMeal (id) {
  try {
    await this.request('DELETE', `/meals/${id}`)
    let index = this.meals.map(o => o.id).indexOf(id)
    this.meals.splice(index, 1)
    this.updateTotalCalories()
  } catch (err) {
    alert(`Error: ${err.message}`)
  }
}
```

### Test Out Your New Vanilla JS App

Congrats! You have successfully built a dynamic SPA in around 100 lines of code. Not bad! Go back to your browser and hit refresh. You should initially see no meals as the server starts with an empty array. You should add meals, remove meals, and refresh the page to see the app in action.

## Add Authentication with Okta's Sign-In Widget

[Okta's Sign-in Widget](https://developer.okta.com/code/javascript/okta_sign-in_widget) is a JavaScript library that gives you a full-featured and customizable login widget that can be added to any website.  With just a few lines of code, you can implement a login flow to your app.

### Configure a New Okta application

To use the Okta Sign-in Widget, you must first have an Okta developer account. If you don't have one you can [create a free account](https://developer.okta.com/signup/). After you are logged in, click on the **Applications** tab and then **Create App Integration** button. 

Select **OIDC - OpenID Connect** -> **Single-Page Application** and click on the **Next** button. Select **Implicit (hybrid)** as the **Grant type** and un-check **Authorization Code**. Now, Enter `http://localhost:8080/` as your **Sign-in redirect URIs**. Finally, select **Allow everyone in your organization to access** as the **Controlled access** and click on the **Save** button. 

Your Application settings should look similar to this:

{% img blog/vanilla-js/app-settings.png alt:"SPA App Settings" width:"600" %}{: .center-image }

### Enable CORS

Now, [enable CORS](https://developer.okta.com/docs/guides/enable-cors/main/) for `http://localhost:8080/` in your Okta Admin Dashboard.

### Install the Widget for Secure Authentication

To get started, replace `public/index.html` with the following code.  This code adds the required `okta-sign-in.min.js` and `okta-sign-in.min.css` to correctly display the widget.

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Calorie Tracker</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.0.0/css/bootstrap.min.css">
    <script src="https://global.oktacdn.com/okta-signin-widget/5.16.0/js/okta-sign-in.min.js" type="text/javascript"></script>
    <link href="https://global.oktacdn.com/okta-signin-widget/5.16.0/css/okta-sign-in.min.css" type="text/css" rel="stylesheet"/>
  </head>
  <body>
    <div class="container pt-4">
      <div class="d-flex justify-content-between align-items-center mb-4">
        <h2>Calorie Tracker</h2>
        <div>Total Calories: <strong id="total">-</strong></div>
      </div>
      <a href="#" id="sign-out" class="btn btn-light btn-sm mb-4" style="display: none;">Sign out</a>
      <div id="widget-container"></div>
      <div id="meals-container" style="display: none;">
        <div class="row">
          <div class="col-3">
            <div class="card">
              <div class="card-body">
                <form id="form-entry" class="mb-0">
                  <div class="form-group">
                    <label for="title">Title</label>
                    <input type="text" class="form-control" id="title">
                  </div>
                  <div class="form-group">
                    <label for="calories">Calories</label>
                    <input type="number" class="form-control" id="calories">
                  </div>
                  <button type="submit" class="btn btn-primary">Submit</button>
                </form>
              </div>
            </div>
          </div>
          <div class="col-9">
            <ul class="list-group" id="meals"></ul>
          </div>
        </div>
      </div>
    </div>
    <script type="text/javascript" src="/main.js"></script>
  </body>
</html>
```

Copy and paste the following code to `public/main.js`.

```js
class App {
  constructor () {
    this.meals = []
    document.getElementById('form-entry').addEventListener('submit', (event) => {
      event.preventDefault()
      this.addMeal({
        title: document.getElementById('title').value,
        calories: parseInt(document.getElementById('calories').value)
      })
    })
    document.getElementById('sign-out').addEventListener('click', (event) => {
      event.preventDefault()
      this.signIn.authClient.signOut(err => {
        if (err) {
          return alert(`Error: ${err}`)
        }
        this.showSignIn()
      })
    })
    this.signIn = new OktaSignIn({
      baseUrl: 'https://{yourOktaDomain}',
      clientId: '{clientId}',
      redirectUri: 'http://localhost:8080',
      authParams: {
        issuer: 'https://{yourOktaDomain}/oauth2/default',
        pkce: false,
        responseType: ['id_token','token']
      },
      logo: '//placehold.it/200x40?text=Your+Logo',
      i18n: {
        en: {
          'primaryauth.title': 'Sign in to Calorie Tracker'
        }
      }
    })
  }
  async init () {
    this.signIn.authClient.token.getUserInfo()
    .then(user => {
      this.showMeals()
    })
    .catch(() => {
      this.showSignIn()
    })
  }
  async showMeals () {
    this.meals = await this.request('GET', '/meals')
    this.render()
    document.getElementById('sign-out').style.display = 'inline-block'
    document.getElementById('meals-container').style.display = 'block'
    this.signIn.remove()
  }
  showSignIn () {
    document.getElementById('sign-out').style.display = 'none'
    document.getElementById('meals-container').style.display = 'none'
    this.signIn.showSignInToGetTokens({
      el: '#widget-container'
    }).then(tokens => {
      this.signIn.authClient.tokenManager.setTokens(tokens)
      this.showMeals()
    })
  }
  request (method, url, data = null) {
    return new Promise((resolve, reject) => {
      let xhr = new XMLHttpRequest()
      xhr.open(method, url, true)
      xhr.setRequestHeader('Content-Type', 'application/json')
      const accessToken = this.signIn.authClient.getAccessToken()
      if (accessToken) {
        xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`)
      }
      xhr.onload = () => {
        if (xhr.status === 200) {
          return resolve(JSON.parse(xhr.responseText || '{}'))
        } else {
          return reject(new Error(`Request failed with status ${xhr.status}`))
        }
      }
      if (data) {
        xhr.send(JSON.stringify(data))
      } else {
        xhr.send()
      }
    })
  }
  async addMeal (data) {
    try {
      const meal = await this.request('POST', '/meals', data)
      document.getElementById('meals').appendChild(this.createMealElement(meal))
      this.meals.push(meal)
      this.updateTotalCalories()
    } catch (err) {
      alert(`Error: ${err.message}`)
    }
  }
  async deleteMeal (id) {
    try {
      await this.request('DELETE', `/meals/${id}`)
      let index = this.meals.map(o => o.id).indexOf(id)
      this.meals.splice(index, 1)
      this.updateTotalCalories()
    } catch (err) {
      alert(`Error: ${err.message}`)
    }
  }
  updateTotalCalories () {
    let elTotal = document.getElementById('total')
    elTotal.textContent = this.meals.reduce((acc, o) => acc + o.calories, 0).toLocaleString()
  }
  createMealElement ({ id, title, calories }) {
    let el = document.createElement('li')
    el.className = 'list-group-item d-flex justify-content-between align-items-center'
    el.innerHTML = `
      <div>
        <a href="#" class="remove">&times;</a>
        <span class="title">${title}</span>
      </div>
      <span class="calories badge badge-primary badge-pill">${calories}</span>
    `
    // when the 'x' delete link is clicked
    el.querySelector('a').addEventListener('click', (event) => {
      event.preventDefault()
      this.deleteMeal(id)
      el.remove()
    })
    return el
  }
  render () {
    let fragment = document.createDocumentFragment()
    for (let meal of this.meals) {
      fragment.appendChild(this.createMealElement(meal))
    }
    let el = document.getElementById('meals')
    while (el.firstChild) {
      el.removeChild(el.firstChild) // empty the <div id="meals" />
    }
    el.appendChild(fragment)
    this.updateTotalCalories()
  }
}

let app = new App()
app.init()
```

### Initialize the Okta Sign-in Widget

To initialize the widget, you instantiate a new `OktaSignIn` object.  Remember to change the `{yourOktaDomain}` (twice) and `{clientId}` to yours.

```js
this.signIn = new OktaSignIn({
  baseUrl: 'https://{yourOktaDomain}',
  clientId: '{clientId}',
  redirectUri: 'http://localhost:8080',
  authParams: {
    issuer: 'https://{yourOktaDomain}/oauth2/default',
    pkce: false,
    responseType: ['id_token','token']
  },
  logo: '//placehold.it/200x40?text=Your+Logo',
  i18n: {
    en: {
      'primaryauth.title': 'Sign in to Calorie Tracker'
    }
  }
})
```

### Authorize API Requests with a Token

After you authenticate with the Sign-in Widget, an access token is stored using the widget's `tokenManager`. In the `request()` method, you can add the access token to the request, so each AJAX request contains the token. This token is verified by the server (in the following section).

```js
const accessToken = this.signIn.authClient.getAccessToken()
if (accessToken) {
  xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`)
}
```

## Lock Down REST Routes for Secure User Management

Finally, you only want to allow authenticated users to manage meals. Using Okta's JWT Verifier and Express middleware, you can create a reusable way to lock down specific routes.

First, install Okta's JWT Verifier:

```bash
npm install @okta/jwt-verifier@2
```

Replace `index.js` with the following code.

```js
const express = require('express')
const bodyParser = require('body-parser')
const OktaJwtVerifier = require('@okta/jwt-verifier')

const oktaJwtVerifier = new OktaJwtVerifier({
  issuer: 'https://{yourOktaDomain}/oauth2/default'
})

const authenticationRequired = (req, res, next) => {
  if (!req.headers.authorization) {
    return next(new Error('Authorization header is required'))
  }
  let parts = req.headers.authorization.trim().split(' ')
  let accessToken = parts.pop()
  oktaJwtVerifier.verifyAccessToken(accessToken, 'api://default')
    .then(jwt => {
      req.user = {
        uid: jwt.claims.uid,
        email: jwt.claims.sub
      }
      next()
    })
    .catch(err => {
      res.status(401).send(err.message)
    })
}

const app = express()
app.use(bodyParser.json())
app.use(express.static('public'))

// store in memory
let meals = []

app.get('/meals', authenticationRequired, (req, res) => {
  return res.send(meals)
})

app.post('/meals', authenticationRequired, (req, res) => {
  let meal = req.body
  meal.id = Date.now()
  meals.push(meal)
  return res.send(meal)
})

app.delete('/meals/:id', authenticationRequired, (req, res) => {
  let id = parseInt(req.params.id)
  const index = meals.map(o => o.id).indexOf(id)
  if (index !== -1) {
    meals.splice(index, 1)
  }
  return res.send()
})

app.listen(8080, () => {
  console.log('App listening on port 8080!')
})
```

### Add Authentication Middleware

The `authenticationRequired` middleware will pull the token from the Authorization header and verify it. If it's a valid token, then the request will continue to the route handlers. We add this middleware to each of our routes to secure them.

## Customize Authentication with the Sign-in Widget

Okta's Sign-in Widget is fully customizable via CSS and JavaScript.  Here are just a few ways that you can customize the widget. (For a full list of configuration options see [https://github.com/okta/okta-signin-widget#configuration](https://github.com/okta/okta-signin-widget#configuration)).

Change the widget logo:

```js
this.signIn = new OktaSignIn({
  /*...*/
  logo: '//placehold.it/200x40?text=Your+Logo'
})
```

Change the widget title:

```js
this.signIn = new OktaSignIn({
  /*...*/
  i18n: {
    en: {
      'primaryauth.title': 'Sign in to Calorie Tracker'
    }
  }
})

```

You can also overwrite CSS to inject your own styles:

```css
#okta-sign-in.auth-container.main-container {
  background-color: red;
}

#okta-sign-in.auth-container.main-container {
  border-color: red;
}

#okta-sign-in.auth-container .okta-sign-in-header {
  border-bottom-color: red;
}
```

You can check out [https://ok1static.oktacdn.com/assets/js/sdk/okta-signin-widget/2.6.0/css/okta-theme.css](https://ok1static.oktacdn.com/assets/js/sdk/okta-signin-widget/2.6.0/css/okta-theme.css) for a complete list of CSS classes you can inject your styles.

## Learn More About JavaScript, Authentication, and Okta

In this tutorial, you built a dynamic SPA using JavaScript DOM APIs and added authentication using Okta's Sign-in Widget in ~200 lines of code (including HTML). That's pretty awesome! While I don't suggest vanilla JavaScript for all SPAs, I hope this tutorial reignites your desire to understand more about the underlying JavaScript powering today's large frameworks.

You can find the full source code for this tutorial at: [https://github.com/oktadeveloper/okta-vanilla-js-example](https://github.com/oktadeveloper/okta-vanilla-js-example).

Here are a few other articles I'd recommend to learn more about user authentication and SPAs.

- [Build a Basic CRUD App with Vue.js and Node](/blog/2018/02/15/build-crud-app-vuejs-node)
- [Build a React Application with User Authentication in 15 Minutes](/blog/2017/03/30/react-okta-sign-in-widget)
- [Build an Angular App with Okta's Sign-in Widget in 15 Minutes](/blog/2017/03/27/angular-okta-sign-in-widget)
