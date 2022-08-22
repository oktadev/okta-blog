---
disqus_thread_id: 7839312415
discourse_topic_id: 17207
discourse_comment_url: https://devforum.okta.com/t/17207
layout: blog_post
title: "The Best Testing Tools for Node.js"
author: david-neal
by: advocate
communities: [javascript]
description: "The best testing tools available for Node.js"
tags: [node, testing, tdd, bdd, mocha, jest]
tweets:
- "What are the best testing tools available for @nodejs? Let's take a look! #tdd #bdd #testing #qa #node"
- "You *are* writing tests for Node.js, right?? Here are the best testing tools available! #tdd #bdd #testing #qa #node"
- ""
image: blog/best-nodejs-testing-tools/the-best-testing-tools-for-nodejs.jpg
type: awareness
---

Testing is an essential discipline for *any* non-trivial software project. With a dynamic language like JavaScript, testing is an absolute necessity. This post is on the best tools currently available for Node.js, but here's a quick look at some of the many benefits of testing.

* Find bugs!
* Guard against future bug regressions.
* Document the expected functionality or behavior of software.
* Improve the design, quality, and maintainability of software.
* Refactor code with confidence.

In this post, we'll look at the current tools available for Node.js for running automated tests along with a few testing utilities to complement a good testing discipline.

> Note: Although some of the tools covered in this post support user interface (UI) tests and front-end integration tests, the focus here is on testing pure back-end Node.js code. If you are looking for UI testing, take a peek at [Storybook](https://storybook.js.org/), [Cypress](https://www.cypress.io/), or [Puppeteer](https://pptr.dev/).

## The Best Tools for Running Node.js Automated Tests

The foundation for testing is automation. With every code change and at various stages along the way to production, all available tests should run in an automated fashion. At the heart of automated tests is a good test runner.

For each of the following test runners, I've included a sample set of tests so you can see the basic similarities and differences between these frameworks. The sample test code is a simple calculator module named `calc.js`. Here is the code for `calc.js`.

```js
"use strict";

module.exports = {
  add: ( num1, num2 ) => {
    return num1 + num2;
  },
  badd: () => {
    throw new Error( "it blowed up" );
  }
};
```

### Mocha

[Mocha](https://mochajs.org/) is one of the oldest and most well-known testing frameworks for Node.js. It's evolved with Node.js and the JavaScript language over the years, such as supporting callbacks, promises, and `async`/`await`. It has also picked up a few tricks inspired by other test runners.

Mocha adds several global functions, such as `describe`, `test`, `it`, `specify`, `setup`, `teardown`, which are used to write test-driven-development (TDD) or behavior-driven-development (BDD) style tests. It has hooks such as `before`, `beforeEach`, `after`, and `afterEach` for test setup and teardown. It also comes with many built-in reporters to format output.

> Note: Some argue adding global functions "pollutes" the global space, and other test runners are designed not to add global functions.

```js
"use strict";

const assert = require( "assert" );
const calc = require( "../src/calc" );

describe( "Calculator", () => {
  before( () => {
    console.log( "before executes once before all tests" );
  } );

  after( () => {
    console.log( "after executes once after all tests" );
  } );

  describe( "adding", () => {
    beforeEach( () => {
      console.log( "beforeEach executes before every test" );
    } );
    it( "should return 4 when adding 2 + 2", () => {
      assert.equal( calc.add( 2, 2 ), 4 );
    } );

    it( "should return 0 when adding zeros", () => {
      assert.equal( calc.add( 0, 0 ), 0 );
    } );
  } );

  describe( "error", () => {
    it( "should return an error", () => {
      assert.throws( calc.badd, {
        name: "Error",
        message: "it blowed up"
      } );
    } );
  } );
} );
```

Output:

```sh
  Calculator
before executes once before all tests
    adding
beforeEach executes before every test
      ✓ should return 4 when adding 2 + 2
beforeEach executes before every test
      ✓ should return 0 when adding zeros
    error
      ✓ should return an error
after executes once after all tests


  3 passing (5ms)
```

By itself, Mocha is a solid no-frills test runner. The features it lacks can be supplemented by other proven testing utilities, such as code coverage and mocking (simulated objects/integration). It has a large community following with lots of tools and plugins available to customize it to fit your needs.

### Jest

[Jest](https://jestjs.io/) is a testing framework developed by Facebook. Originally designed to make UI testing easier for React developers, it's now a full standalone suite of tools for any type of JavaScript project (including Node.js) and includes features such as a built-in assertion library, code coverage, and mocking. Jest also runs multiple test suites concurrently, which can speed up the overall testing process. The downside of parallel execution is it can make debugging tests more difficult.

For anyone coming from a BDD-style of Mocha, Jest tests are pretty familiar looking. Jest adds several global functions to help with setting up and running tests, such as `describe`, `it`, `expect`, and the `jest` object (used mostly for mocking).

```js
"use strict";

// jest.mock( "../src/calc" );
const calc = require( "../src/calc" );

describe( "Calculator", () => {
  beforeAll( () => {
    console.log( "beforeAll executes once before all tests" );
    // calc.add.mockImplementation( () => -1 );
  } );

  afterAll( () => {
    console.log( "afterAll executes once after all tests" );
  } );

  describe( "adding", () => {
    beforeEach( () => {
      console.log( "beforeEach executes before every test" );
    } );

    it( "should return 4 when adding 2 + 2", () => {
      expect( calc.add( 2, 2 ) ).toBe( 4 );
    } );

    it( "should return 0 when adding zeros", () => {
      expect( calc.add( 0, 0 ) ).toBe( 0 );
    } );
  } );

  describe( "err", () => {
    it( "should return an error", () => {
      expect( calc.badd ).toThrowError( "it blowed up" );
    } );
  } );
} );
```

Output:

```sh
 PASS  jest/test.js
  Calculator
    adding
      ✓ should return 4 when adding 2 + 2 (3ms)
      ✓ should return 0 when adding zeros (1ms)
    err
      ✓ should return an error (2ms)

  console.log jest/test.js:8
    beforeAll executes once before all tests

  console.log jest/test.js:18
    beforeEach executes before every test

  console.log jest/test.js:18
    beforeEach executes before every test

  console.log jest/test.js:13
    afterAll executes once after all tests

----------|---------|----------|---------|---------|-------------------
File      | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
----------|---------|----------|---------|---------|-------------------
All files |     100 |      100 |     100 |     100 |
 calc.js  |     100 |      100 |     100 |     100 |
----------|---------|----------|---------|---------|-------------------
Test Suites: 1 passed, 1 total
Tests:       3 passed, 3 total
Snapshots:   0 total
Time:        1.036s
```

Jest has become hugely popular in the JavaScript community, and not just for React developers. There are a ton of library extensions, plugins, and other tools to customize Jest however you see fit. Plus, if you're also creating UIs, Jest has the advantage of supporting popular UI frameworks like React, Angular, and Vue.

### Lab and Code

[Lab](https://github.com/hapijs/lab) is part of the hapi developer ecosystem. It was initially designed by Walmart Labs to work seamlessly with the hapi web framework. However, it works well on its own and with other Node.js frameworks. `Lab`, the test runner, typically goes hand-in-hand with [`code`](https://github.com/hapijs/code), the BDD-style assertion library created for it.

In contrast to most other test runners, Lab *does not* add any global functions. As a result, Lab requires more setup for every suite of tests to import the `lab` and `code` dependencies. However, no globals mean there are no surprises when it comes to using the API.

```js
"use strict";

const Code = require( "@hapi/code" );
const Lab = require( "@hapi/lab" );

const { expect } = Code;
const { describe, it, before, after, beforeEach } = exports.lab = Lab.script();

const calc = require( "../src/calc" );

describe( "Calculator", () => {
  before( () => {
    console.log( "beforeAll executes once before all tests" );
  } );

  after( () => {
    console.log( "afterAll executes once after all tests" );
  } );

  describe( "adding", () => {
    beforeEach( () => {
      console.log( "beforeEach executes before every test" );
    } );

    it( "should return 4 when adding 2 + 2", () => {
      expect( calc.add( 2, 2 ) ).to.equal( 4 );
    } );

    it( "should return 0 when adding zeros", () => {
      expect( calc.add( 0, 0 ) ).to.equal( 0 );
    } );
  } );

  describe( "error", () => {
    it( "should throw an error", () => {
      try {
        calc.badd();
      } catch ( err ) {
        expect( err ).to.be.an.error( "it blowed up" );
      }
    } );
  } );
} );
```

Output:

```sh
beforeAll executes once before all tests
beforeEach executes before every test
Calculator
  adding
    ✔ 1) should return 4 when adding 2 + 2 (1 ms)
beforeEach executes before every test
    ✔ 2) should return 0 when adding zeros (0 ms)
  error
    ✔ 3) should throw an error (0 ms)
afterAll executes once after all tests


3 tests complete
Test duration: 6 ms
Leaks: No issues
Coverage: 100.00%
```

In my experience, lab is excellent. It's simple and efficient. Lab includes code coverage, several reporters, the ability to load a custom reporter, and was one of the first JavaScript test runners to detect memory leaks. With code coverage, you can set a percentage threshold and the runner will fail if coverage doesn't meet the minimum threshold. Another cool feature of lab is the ability to randomize the order of test execution. Randomizing may uncover some obscure bugs in your code, such as leaking state or calling a promise or `async` function without awaiting the result.

The only downside to lab is outside of the hapi community, lab is not very popular.

### AVA

[AVA](https://github.com/avajs/ava) is a much more opinionated test runner. Like lab, there are no magic global functions. Like Jest, it executes tests in parallel, which can speed up test performance.

AVA does not have an equivalent syntax of `describe` for grouping tests. Instead, you must use the file system to group tests by folder (or nested folders) and file name.

```js
"use strict";

const test = require( "ava" );
const calc = require( "../src/calc" );

test.before( () => {
  console.log( "before executes once before all tests" );
} );

test.after( () => {
  console.log( "after executes once after all tests" );
} );

test.beforeEach( () => {
  console.log( "beforeEach executes before every test" );
} );

test( "should return 4 when adding 2 + 2", t => {
  t.is( calc.add( 2, 2 ), 4 );
} );

test( "should return 0 when adding zeros", t => {
  t.is( calc.add( 0, 0 ), 0 );
} );

test( "err should return an error", t => {
  const err = t.throws( () => {
    calc.badd();
  } );
  t.is( err.message, "it blowed up" );
} );
```

Output:

```sh
⠹ before executes once before all tests
⠸ beforeEach executes before every test
⠼ beforeEach executes before every test
beforeEach executes before every test
⠇ err should return an error

  3 tests passed
```

I have the least amount of experience with AVA. One of the cool features I discovered while exploring AVA is the ability to create "TODO" tests. The tests don't fail, but they do show up in the reports to remind you there's still more work left. You have some control over which tests run in series instead of parallel using `test.serial()`. There's no built-in code coverage, but you're encouraged to use a separate utility for that.

## The Best Testing Utilities for Node.js

There are a number of tools available to help make tests easier to write or more understandable to read. As mentioned before, Jest has built-in tools for mocking and assertions, and AVA has built-in assertions. Here are some of the best tools to add these features and more to any test runner.

### Chai

[Chai](https://www.chaijs.com/) is an assertion library that adds a more expressive language to tests, making them more readable and easier to understand. For example, instead of using the built-in Node.js `assert`, you can use a fluent `expect` or `should` syntax.

Node.js assert:

```js
assert.equal( someValue, true );
assert.equal( myString, "hello" );
```

Chai:

```js
expect( someValue ).to.be.true;

// chain assertions together
expect( myString ).to.be.a( "string" ).and.equal( "hello" );

// the same assertion using "should" syntax
myString.should.be.a( "string" ).and.equal( "hello" );
```

### TestDouble

[TestDouble](https://www.npmjs.com/package/testdouble) is a mocking library for JavaScript that works with all the most popular test runners. TestDouble enables you to create stand-in replacements for dependencies in your code. When your goal is to isolate the code being tested and simulate certain conditions and responses, TestDouble is your friend. For example, when setting up a test, TestDouble can intercept `require()` or `import` statements and return a mock object, which is great for dependencies that make calls to databases, message queues, APIs, or any other external system.

Tests written with TestDouble are easy to read and understand. The expressions read well, such as, "When calling this function with these arguments, return this value." Or something like, "When calling this function, return this error." You can also use TestDouble to answer questions like, "was this function called with these specific arguments?"

Let's imagine that the previous `calc.add()` function doesn't add numbers itself, but instead makes a call to an API to calculate the value. In your test code, you want to avoid making real API calls so that your code runs faster, and not adversely impact other systems. You would want to intercept that function and return a value or throw an error to test how the software behaves under specific conditions. Given a module named `add2` that takes one number as an argument and uses `calc.add()` to add 2 to that value, here's how a test with Mocha and TestDouble might look.

```js
"use strict";

const assert = require( "assert" );
const td = require( "testdouble" );

describe( "Mocked calculator", () => {
  let calc;
  beforeEach( () => {
    calc = td.replace( "../src/calc" );
  } );

  afterEach( () => {
    td.reset();
  } );

  it( "should return 5 when adding 2 + 2?", () => {
    const add2 = require( "../src/add2" );
    td.when( calc.add( 2, 2 ) ).thenReturn( 5 );
    assert.equal( add2( 2 ), 5 );
  } );

  it( "should return 0 when adding 2 + 2?", () => {
    const add2 = require( "../src/add2" );
    td.when( calc.add( 2, 2 ) ).thenReturn( 0 );
    assert.equal( add2( 2, 2 ), 0 );
  } );
} );
```

### Istanbul

More test coverage is better, right? [Istanbul](https://istanbul.js.org/) is a code analysis tool for test runners that lack built-in coverage reports, such as Mocha or AVA. Code coverage analysis can help you identify areas of your code not tested.

Here is one example of running Istanbul's `nyc` code coverage tool with Mocha.

```sh
npx nyc mocha ./tests

----------------|---------|----------|---------|---------|-------------------
File            | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
----------------|---------|----------|---------|---------|-------------------
All files       |     100 |      100 |     100 |     100 |
 tests          |     100 |      100 |     100 |     100 |
  test.js       |     100 |      100 |     100 |     100 |
 src            |     100 |      100 |     100 |     100 |
  calc.js       |     100 |      100 |     100 |     100 |
----------------|---------|----------|---------|---------|-------------------
```

### Visual Studio Code

Okay, hear me out. Yes, [Visual Studio Code](https://code.visualstudio.com/) is a code editor. It also happens to include one of the best debuggers ever created for Node.js. It's a pleasure to use, it's extensible, and it's _free_.

Here's a sample `launch.json` file for Visual Studio Code you can use to debug Mocha tests. With this, you can set break points in your tests or anywhere in your code that is under test. Debugging in VS Code you can inspect variables, create watch expressions, view the call stack, and step through code.

```js
{
  // Use IntelliSense to learn about possible attributes.
  // Hover to view descriptions of existing attributes.
  // For more information, visit: https://go.microsoft.com/fwlink/?linkid=830387
  "version": "0.2.0",
    "configurations": [
      {
        "type": "node",
        "request": "launch",
        "name": "Debug Mocha Tests",
        "skipFiles": [
          "<node_internals>/**"
        ],
        "program": "${workspaceFolder}/node_modules/.bin/mocha",
        "args": [
          "${workspaceFolder}/mocha"
        ]
      }
    ]
}
```

### TypeScript

TypeScript is a testing tool? Sure! TypeScript isn't a replacement for good tests, but it's yet another way you can catch errors before they reach production. This is especially true on larger projects.

A dynamic language like JavaScript is a two-edged sword. Dynamic types give you incredible flexibility, but can also allow bugs to creep in that would usually be caught by a static type system. By design, TypeScript attempts to balance the power of JavaScript with the benefits of static checking.

## Final Thoughts on Testing Code in Node.js

I don't believe you can go wrong choosing from any of these test runners and tools. If I were starting a new project today, my first choice would be Jest. It has most everything built-in, a large community following, and lots of plugins available. However, if Jest's built-in mocking didn't prove to provide enough control, I would reach for TestDouble.

What are your thoughts? Did I miss your favorite testing tools? Let me know down in the comments below!

If you liked reading this, we have a lot more posts you may be interested in!

* [What's New for Node.js in 2020](/blog/2019/12/04/whats-new-nodejs-2020)
* [Build a Secure Node.js App with SQL Server and hapi](/blog/2019/03/11/node-sql-server)
* [Build Simple Authentication in Express in 15 Minutes](/blog/2019/05/31/simple-auth-express-fifteen-minutes)
* [An Illustrated Guide to OAuth and OpenID Connect](/blog/2019/10/21/illustrated-guide-to-oauth-and-oidc)
* [What's New in JavaScript for 2019](/blog/2019/01/22/whats-new-in-es2019)
* [Learn JavaScript in 2019](/blog/2018/12/19/learn-javascript-in-2019)

If you like this blog post and want to see more like it, follow [@oktadev on Twitter](https://twitter.com/oktadev), subscribe to [our YouTube channel](https://youtube.com/c/oktadev), or follow us [on LinkedIn](https://www.linkedin.com/company/oktadev/).
