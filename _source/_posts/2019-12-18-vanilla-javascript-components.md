---
disqus_thread_id: 7770500960
discourse_topic_id: 17186
discourse_comment_url: https://devforum.okta.com/t/17186
layout: blog_post
title: "Build Components in JavaScript Without a Framework"
author: lee-brandt
by: advocate
communities: [javascript]
description: "Build a JavaScript component with plain, vanilla JavaScript."
tags: [javascript, vanilla-javascript, javascript-component, vanilla-javascript-component]
tweets:
- "Wanna learn how to make components without a JavaScript framework? Check this out!"
- "Frameworks? We don't need no stinking frameworks! Build your JavaScript components without them!"
- "Build JavaScript components. Where we're going we don't NEED frameworks!"
image: blog/featured/okta-node-bottle-headphones.jpg
type: awareness
---

Everyone has their favorite framework, and most developers aren't shy about sharing those opinions. I guarantee you right now two developers are arguing about their favorite frameworks. Personally, I've been using JavaScript frameworks since JQuery was introduced. I've written applications for clients using Knockout.js, Angular 1+, React (since before v15), and have made some small learning apps using Stencil and Vue.

One of the great things that all of these frameworks bring to the table is their easy composability. The ability to make components that you can reuse throughout your app helps so much with development time, code reusability, and testability. You don't **have** to use a framework to get these benefits. JavaScript has them built-in, you just have to know where to look. Also, learning how to build components in vanilla JavaScript will help you understand how to make those components in your favorite framework.

In this post, I'll show you how to build a simple star rating component using nothing but vanilla JavaScript, CSS, and HTML. I'll be using [VS Code](https://code.visualstudio.com/) and [http-server](https://www.npmjs.com/package/http-server) to build and serve a static set of files. You'll need [Node.js](https://nodejs.org/en/) and [npm](https://www.npmjs.com/) installed to run `http-server`.

## Define the Desired Behavior for the JavaScript Component

When I build components in any framework (or without one), I like to first figure out all the things I need the component to handle internally. In this case, I'm building a star rating component, so it definitely needs to display stars.

* The star component will have a default color for all the stars.
* If the component has a rating value when it renders, it should change the color of all the stars up to and including the star that denotes the rating.
* When a user hovers over the component every star in the component, up to and including the one they are hovering over, should change colors.
* If the user clicks on a star, the current rating for the component should be updated to reflect the star rating they clicked on.
* If they move their mouse away without selecting a rating, the component should set the colors of the stars back to reflect the last selected rating.

With those requirements in mind for your JavaScript component, let's dig in!

## Build the Shell of the JavaScript Component App

Start by creating a folder somewhere you want to serve the application from. When you run `http-server` in a directory it serves that folder as a web server. Once you have the directory created, open it in VS Code and add a file called `index.html`. This will be your web application. Inside the `index.html`. This file will have two star rating HTML elements on it along with some basic style and a script tag. The complete contents:

```html
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <style>
    .star-rater .star {
      font-size: 5rem;
      color: gray;
    }
  </style>
  <title>Rater</title>
</head>

<body>
  <h2>Star Rating</h2>
  <div id="rater-1" class="star-rater" data-rating="3" role="rater">
    <span class="star" data-value="1">&#9733;</span>
    <span class="star" data-value="2">&#9733;</span>
    <span class="star" data-value="3">&#9733;</span>
    <span class="star" data-value="4">&#9733;</span>
    <span class="star" data-value="5">&#9733;</span>
  </div>

  <div id="rater-2" class="star-rater" data-rating="2" role="rater">
    <span class="star" data-value="1">&#9733;</span>
    <span class="star" data-value="2">&#9733;</span>
    <span class="star" data-value="3">&#9733;</span>
    <span class="star" data-value="4">&#9733;</span>
    <span class="star" data-value="5">&#9733;</span>
  </div>

  <script type="module" src="js/main.js"></script>
</body>

</html>
```

You'll notice I've added the `role="rater"` to each element. That will be the way you tell the main JavaScript file to attach the functionality of your `Rater` component to this element.

Now create a folder called `js` to house your vanilla JavaScript component code, and then create two files called `rater.js` and `main.js` inside that new folder. That `script` tag above brings in the `main.js` file as a `module` type. For [browsers that support module syntax for JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import#Browser_compatibility), this will allow you to use the `import` and `export` statements introduced in ES2015.

In the `rater.js` file add the code to export the rater's functionality:

```js
export function Rater(ratingElement) {
  const stars = ratingElement.querySelectorAll('.star');
}
```

The first bit of functionality is here as well. The `Rater` takes in an HTML element and queries it for all of its elements with a class of `star` and puts them into the `stars` array.

To finish out the shell, add the code to the `main.js` file that finds all the HTML elements with a role of `rater` and pass them to the `Rater` component.

```js
import { Rater } from './rater.js';

document.addEventListener('DOMContentLoaded', function() {
  const raters = document.querySelectorAll('[role=rater]');
  raters.forEach(rater => {
    new Rater(rater);
  });
});
```

Now you should be able to fire up the application by serving the folder. From the folder where your `index.html` file lives in a console run:

```sh
http-server .
```

It will tell you it's running on <http://localhost:8080>, and you will see the two rating components with gray stars, but they don't do anything yet.

## Build the Functionality of the JavaScript Component

Start with add the ability to highlight based on a rating number. In the `rater.js` file, add a function to highlight each star up to and including a certain rating:

```js
const highlightRating = (rating) => {
  stars.forEach(star => {
    star.style.color =
      rating >= star.getAttribute('data-value') ? 'yellow' : 'gray';
  });
}
```

Now you'll want to set the initial highlighting for the component when it renders. Each rater HTML element has a `data-value` attribute. That will be used to hold the current rating for the component. Since you'll use this when the component loads and after the user moves their mouse away from the component, call the function `resetRating()`. Add the following function right above the `highlightRating()` function:

```js
const resetRating = ev => {
  const currentRating = ratingElement.getAttribute('data-rating');
  highlightRating(currentRating);
};
```

Then below the `highlightRating()` function call it so that you can set the highlighting for the initial load.

```js
resetRating();
```

Now when you reload your browser you should see each rater highlighted to its appropriate default rating. In this case, three and two.

The next step is to handle the hovering action so that the rating component highlights as the user hovers over it. You'll first need to wire up an even to each star. Since you already have all the stars in the component in an array, just loop over them and hang the event listener on them. Add the following code to the bottom of the component function:

```js
stars.forEach(star => {
  star.addEventListener('mouseover', ratingHover);
});
```

Now, you need the event handler for the listener. This even will just get the star the user's mouse is hovering on and call the `highlightRating()` function. Right above the `resetRating()` function add:

```js
const ratingHover = ev => {
  const currentHover = ev.currentTarget.getAttribute('data-value');
  highlightRating(currentHover);
};
```

You'll also want the component to reset back to the last selected rating (in this case the default rating) when the user moves their mouse away from the rating component. Add the following line of code to the bottom of the component function:

```js
ratingElement.addEventListener('mouseout', resetRating);
```

Now if you refresh your page you should see the hovering happening and when you move the mouse away, it should reset the highlighting.

Now there is only one thing left to do, and that is wire up a click event to the stars and update the `data-rating` for the component when a user clicks on a star.

To wire up the click event, update the `stars.forEach()` line so that it looks like:

```js
stars.forEach(star => {
  star.addEventListener('click', setRating);
  star.addEventListener('mouseover', ratingHover);
});
```

Now that you have a listener for the click and the hover, add the `setRating()` event handler to set the rating when a user clicks on a star below the first line of the component function:

```js
const setRating = ev => {
  ratingElement.setAttribute(
    'data-rating',
    ev.currentTarget.getAttribute('data-value')
  );
};
```

Now, when you refresh your browser, you should be able to hover over the rating component and see the highlighting happening. Then, when you click on a star, it should update the `data-rating` value of the rating component element. You can view this in the developer tools of your browser.

## Take the JavaScript Component to the Next Level

I've kept this component simple to illustrate just how to make the component and make it reusable by the `import` statement. Now that you know **how** to build and use a component in vanilla JavaScript, you could make this component do so much more!

You could have the component "draw" the stars and set a `max-stars` attribute on the element to tell the component how many stars to draw. You could use something like [Font Awesome](https://fontawesome.com/) to display other things besides stars. You could even make the Rater component call another component that sends the rating that the user selects back to an API to be saved to a database. But the skeleton is there.

## Learn More About JavaScript, Components, and Secure User Management

If you liked this tutorial, check out other great content on the Okta Developer blog:

* [The History (and Future) of Asynchronous JavaScript](/blog/2019/01/16/history-and-future-of-async-javascript)
* [Learn JavaScript in 2019](/blog/2018/12/19/learn-javascript-in-2019)
* [Build a Video Chat Service with JavaScript, WebRTC, and Okta](/blog/2018/05/08/build-video-chat-app-with-javascript-webrtc-and-okta)

As always, if you have any questions about this post you can leave them in the comments below. Make sure you don't miss any of our awesome content by following us on [Twitter](https://twitter.com/oktadev) and check out our great videos on [YouTube](https://www.youtube.com/c/oktadev).
