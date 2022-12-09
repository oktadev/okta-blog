---
layout: blog_post
title: "Use React and Spring Boot to Build a Simple CRUD App"
author: matt-raible
by: advocate
communities: [java, javascript]
description: "React is one of the most popular JavaScript frameworks, and Spring Boot is wildly popular in the Java ecosystem. This article shows you how to use them in the same app and secure it all with Okta."
tags: [java, spring-boot, react]
tweets:
- "React + Spring Boot makes for a nice development experience. Learn how to make them work together with OIDC authentication."
- "Spring Boot with @java + React with @javascript == 💙. Learn how to build a @springboot + @reactjs CRUD app today!"
image: blog/featured/okta-react-bottle-headphones.jpg
type: conversion
github: https://github.com/oktadev/okta-spring-boot-react-crud-example
changelog:
- 2022-12-09: Updated to use Spring Boot 3 and Spring Security 6. You can find the changes to this post in [okta-blog#1319](https://github.com/oktadev/okta-blog/pull/1319) and the example app's changes in [okta-spring-boot-react-crud-example#54](https://github.com/oktadev/okta-spring-boot-react-crud-example/pull/54).
- 2022-11-04: Updated to use H2 version 2 and Spring Boot 2.7.5. You can find the changes to this post in [okta-blog#1301](https://github.com/oktadev/okta-blog/pull/1301) and the example app's changes in [okta-spring-boot-react-crud-example#50](https://github.com/oktadev/okta-spring-boot-react-crud-example/pull/50).
- 2022-09-16: Updated to Spring Boot 2.7.3, React 18.0.2, and added a section for Auth0. You can find the changes to this article in [okta-blog#1271](https://github.com/oktadev/okta-blog/pull/1271). What's required to switch to Auth0 can be viewed in [the `auth0` branch](https://github.com/oktadev/okta-spring-boot-react-crud-example/compare/auth0).
---

React was designed to make it painless to create interactive UIs. Its state management is efficient and only updates components when your data changes. Component logic is written in JavaScript, meaning you can keep state out of the DOM and create encapsulated components.

Developers like CRUD (create, read, update, and delete) apps because they show a lot of the base functionality you need when creating an app. Once you have the basics of CRUD completed in an app, most of the client-server plumbing is finished, and you can move on to implementing the necessary business logic.

Today, I'll show you how to create a basic CRUD app with Spring Boot and React. In this tutorial, I'll use the OAuth 2.0 Authorization Code flow and package the React app in the Spring Boot app for production. At the same time, I'll show you how to keep React's productive workflow for developing locally.

You will need [Java 17](http://sdkman.io) and [Node 16](https://nodejs.org/) installed to complete this tutorial.

{% include toc.md %}

## Create an API app with Spring Boot

I'm a frequent speaker at conferences and user groups around the world. My favorite user groups to speak at are Java User Groups (JUGs). I've been a Java developer for almost 20 years and love the Java community. One of my good friends, James Ward, said doing a JUG Tour was one of his favorite developer advocate activities back in the day. I recently took his advice and traded overseas conferences for JUG meetups in the US.

Why am I telling you this? Because I thought it'd be fun to create a "JUG Tours" app today that allows you to create/edit/delete JUGs and view upcoming events.

To begin, navigate to [start.spring.io](https://start.spring.io) and make the following selections:

* **Project:** `Maven Project`
* **Group:** `com.okta.developer`
* **Artifact:** `jugtours`
* **Dependencies**: `JPA`, `H2`, `Web`, `Lombok`

{% img blog/spring-boot-react/spring-initializr.png alt:"Spring Initializr" %}{: .center-image }

Click **Generate Project**, expand `jugtours.zip` after downloading, and open the project in your favorite IDE.

**TIP:** If you're using IntelliJ IDEA or Spring Tool Suite, you can also use Spring Initializr when creating a new project.

### Add a JPA domain model

The first thing you'll need to do is to create a domain model that'll hold your data. At a high level, there's a `Group` that represents the JUG, an `Event` that has a many-to-one relationship with `Group`, and a `User` that has a one-to-many relationship with `Group`.

Create a `src/main/java/com/okta/developer/jugtours/model` directory and a `Group.java` class in it.

```java
package com.okta.developer.jugtours.model;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.NonNull;
import lombok.RequiredArgsConstructor;

import jakarta.persistence.*;
import java.util.Set;

@Data
@NoArgsConstructor
@RequiredArgsConstructor
@Entity
@Table(name = "user_group")
public class Group {

    @Id
    @GeneratedValue
    private Long id;
    @NonNull
    private String name;
    private String address;
    private String city;
    private String stateOrProvince;
    private String country;
    private String postalCode;
    @ManyToOne(cascade=CascadeType.PERSIST)
    private User user;

    @OneToMany(fetch = FetchType.EAGER, cascade=CascadeType.ALL)
    private Set<Event> events;
}
```

Create an `Event.java` class in the same package.

```java
package com.okta.developer.jugtours.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToMany;
import java.time.Instant;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
public class Event {

    @Id
    @GeneratedValue
    private Long id;
    private Instant date;
    private String title;
    private String description;
    @ManyToMany
    private Set<User> attendees;
}
```

And a `User.java` class.

```java
package com.okta.developer.jugtours.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "users")
public class User {

    @Id
    private String id;
    private String name;
    private String email;
}
```

Create a `GroupRepository.java` to manage the group entity.

```java
package com.okta.developer.jugtours.model;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GroupRepository extends JpaRepository<Group, Long> {
    Group findByName(String name);
}
```

To load some default data, create an `Initializer.java` class in the `com.okta.developer.jugtours` package.

```java
package com.okta.developer.jugtours;

import com.okta.developer.jugtours.model.Event;
import com.okta.developer.jugtours.model.Group;
import com.okta.developer.jugtours.model.GroupRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Collections;
import java.util.stream.Stream;

@Component
class Initializer implements CommandLineRunner {

    private final GroupRepository repository;

    public Initializer(GroupRepository repository) {
        this.repository = repository;
    }

    @Override
    public void run(String... strings) {
        Stream.of("Seattle JUG", "Denver JUG", "Dublin JUG",
                "London JUG").forEach(name ->
                repository.save(new Group(name))
        );

        Group djug = repository.findByName("Seattle JUG");
        Event e = Event.builder().title("Micro Frontends for Java Developers")
                .description("JHipster now has microfrontend support!")
                .date(Instant.parse("2022-09-13T17:00:00.000Z"))
                .build();
        djug.setEvents(Collections.singleton(e));
        repository.save(djug);

        repository.findAll().forEach(System.out::println);
    }
}
```

**TIP:** If your IDE has issues with `Event.builder()`, you need to turn on annotation processing and/or install the Lombok plugin. I had to uninstall/reinstall the Lombok plugin in IntelliJ IDEA to get things to work.

If you start your app (using `./mvnw spring-boot:run`) it should result in something like:

```
Group(id=1, name=Seattle JUG, address=null, city=null, stateOrProvince=null, country=null, postalCode=null, user=null, 
  events=[Event(id=5, date=2022-09-13T17:00:00Z, title=Micro Frontends for Java Developers, description=JHipster now has microfrontend support!, attendees=[])])
Group(id=2, name=Denver JUG, address=null, city=null, stateOrProvince=null, country=null, postalCode=null, user=null, events=[])
Group(id=3, name=Dublin JUG, address=null, city=null, stateOrProvince=null, country=null, postalCode=null, user=null, events=[])
Group(id=4, name=London JUG, address=null, city=null, stateOrProvince=null, country=null, postalCode=null, user=null, events=[])
```

Add a `GroupController.java` class (in `src/main/java/.../jugtours/web/GroupController.java`) that allows you to CRUD groups.

```java
package com.okta.developer.jugtours.web;

import com.okta.developer.jugtours.model.Group;
import com.okta.developer.jugtours.model.GroupRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.net.URI;
import java.net.URISyntaxException;
import java.util.Collection;
import java.util.Optional;

@RestController
@RequestMapping("/api")
class GroupController {

    private final Logger log = LoggerFactory.getLogger(GroupController.class);
    private GroupRepository groupRepository;

    public GroupController(GroupRepository groupRepository) {
        this.groupRepository = groupRepository;
    }

    @GetMapping("/groups")
    Collection<Group> groups() {
        return groupRepository.findAll();
    }

    @GetMapping("/group/{id}")
    ResponseEntity<?> getGroup(@PathVariable Long id) {
        Optional<Group> group = groupRepository.findById(id);
        return group.map(response -> ResponseEntity.ok().body(response))
                .orElse(new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    @PostMapping("/group")
    ResponseEntity<Group> createGroup(@Valid @RequestBody Group group) throws URISyntaxException {
        log.info("Request to create group: {}", group);
        Group result = groupRepository.save(group);
        return ResponseEntity.created(new URI("/api/group/" + result.getId()))
                .body(result);
    }

    @PutMapping("/group/{id}")
    ResponseEntity<Group> updateGroup(@Valid @RequestBody Group group) {
        log.info("Request to update group: {}", group);
        Group result = groupRepository.save(group);
        return ResponseEntity.ok().body(result);
    }

    @DeleteMapping("/group/{id}")
    public ResponseEntity<?> deleteGroup(@PathVariable Long id) {
        log.info("Request to delete group: {}", id);
        groupRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
```

Add the following dependency to your `pom.xml` to fix compilation errors:

```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-validation</artifactId>
</dependency>
```

If you stop and start your server app and hit `http://localhost:8080/api/groups` with your browser, or a command line client, you should see the list of groups.

You can create, read, update, and delete groups with the following [HTTPie](https://httpie.org) commands.

```bash
http POST :8080/api/group name='Utah JUG' city='Salt Lake City' country=USA
http :8080/api/group/6
http PUT :8080/api/group/6 id=6 name='Utah JUG' address='On the slopes'
http DELETE :8080/api/group/6
```

## Create a React UI with Create React App

Create React App is a command line utility that generates React projects for you. It's a convenient tool because it also offers commands to build and optimize your project for production. It uses webpack under the covers to build everything.

Create a new project in the `jugtours` directory with `npx`.

```bash
npx create-react-app@5 app
```

After the app creation process completes, navigate into the `app` directory and install [Bootstrap](https://getbootstrap.com/), cookie support for React, React Router, and [Reactstrap](https://reactstrap.github.io/).

```bash
cd app
npm i bootstrap@5 react-cookie@4 react-router-dom@6 reactstrap@9
```

You'll use Bootstrap's CSS and Reactstrap's components to make the UI look better, especially on mobile phones. If you'd like to learn more about Reactstrap, see [reactstrap.github.io](https://reactstrap.github.io). It has extensive documentation on Reactstrap's various components and their use.

Add Bootstrap's CSS file as an import in `app/src/index.js`.

```js
import 'bootstrap/dist/css/bootstrap.min.css';
```

## Call your Spring Boot API and display the results

Modify `app/src/App.js` to use the following code that calls `/api/groups` and displays the list in the UI.

```jsx
import React, { useEffect, useState } from 'react';
import logo from './logo.svg';
import './App.css';

const App = () => {

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);

    fetch('api/groups')
      .then(response => response.json())
      .then(data => {
        setGroups(data);
        setLoading(false);
      })
  }, []);

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <div className="App-intro">
          <h2>JUG List</h2>
          {groups.map(group =>
            <div key={group.id}>
              {group.name}
            </div>
          )}
        </div>
      </header>
    </div>
  );
}

export default App;
```

**TIP**: I learned a lot about React Hooks from [Build a CRUD App in React with Hooks](https://www.taniarascia.com/crud-app-in-react-with-hooks/) by [Tania Rascia](https://twitter.com/taniarascia).

To proxy from `/api` to `http://localhost:8080/api`, add a proxy setting to `app/package.json`.

```json
"scripts": {...},
"proxy": "http://localhost:8080",
```

To learn more about proxying API requests, see Create React App's [documentation](https://create-react-app.dev/docs/proxying-api-requests-in-development/#docsNav). 

Make sure Spring Boot is running, then run `npm start` in your `app` directory. You should see the list of default groups. 

{% img blog/spring-boot-react/jug-list.png alt:"JUG List" width:"800" %}{: .center-image }

## Build a React `GroupList` component

React is all about components, and you don't want to render everything in your main `App`, so create `app/src/GroupList.js` and populate it with the following JavaScript.

{% raw %}
```jsx
import React, { useEffect, useState } from 'react';
import { Button, ButtonGroup, Container, Table } from 'reactstrap';
import AppNavbar from './AppNavbar';
import { Link } from 'react-router-dom';

const GroupList = () => {

  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);

    fetch('api/groups')
      .then(response => response.json())
      .then(data => {
        setGroups(data);
        setLoading(false);
      })
  }, []);

  const remove = async (id) => {
    await fetch(`/api/group/${id}`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    }).then(() => {
      let updatedGroups = [...groups].filter(i => i.id !== id);
      setGroups(updatedGroups);
    });
  }

  if (loading) {
    return <p>Loading...</p>;
  }

  const groupList = groups.map(group => {
    const address = `${group.address || ''} ${group.city || ''} ${group.stateOrProvince || ''}`;
    return <tr key={group.id}>
      <td style={{whiteSpace: 'nowrap'}}>{group.name}</td>
      <td>{address}</td>
      <td>{group.events.map(event => {
        return <div key={event.id}>{new Intl.DateTimeFormat('en-US', {
          year: 'numeric',
          month: 'long',
          day: '2-digit'
        }).format(new Date(event.date))}: {event.title}</div>
      })}</td>
      <td>
        <ButtonGroup>
          <Button size="sm" color="primary" tag={Link} to={"/groups/" + group.id}>Edit</Button>
          <Button size="sm" color="danger" onClick={() => remove(group.id)}>Delete</Button>
        </ButtonGroup>
      </td>
    </tr>
  });

  return (
    <div>
      <AppNavbar/>
      <Container fluid>
        <div className="float-end">
          <Button color="success" tag={Link} to="/groups/new">Add Group</Button>
        </div>
        <h3>My JUG Tour</h3>
        <Table className="mt-4">
          <thead>
          <tr>
            <th width="20%">Name</th>
            <th width="20%">Location</th>
            <th>Events</th>
            <th width="10%">Actions</th>
          </tr>
          </thead>
          <tbody>
          {groupList}
          </tbody>
        </Table>
      </Container>
    </div>
  );
};

export default GroupList;
```
{% endraw %}

Create `AppNavbar.js` in the same directory to establish a common UI feature between components.

{% raw %}
```jsx
import React, { useState } from 'react';
import { Collapse, Nav, Navbar, NavbarBrand, NavbarToggler, NavItem, NavLink } from 'reactstrap';
import { Link } from 'react-router-dom';

const AppNavbar = () => {

  const [isOpen, setIsOpen] = useState(false);

  return (
    <Navbar color="dark" dark expand="md">
      <NavbarBrand tag={Link} to="/">Home</NavbarBrand>
      <NavbarToggler onClick={() => { setIsOpen(!isOpen) }}/>
      <Collapse isOpen={isOpen} navbar>
        <Nav className="justify-content-end" style={{width: "100%"}} navbar>
          <NavItem>
            <NavLink href="https://twitter.com/oktadev">@oktadev</NavLink>
          </NavItem>
          <NavItem>
            <NavLink href="https://github.com/oktadev/okta-spring-boot-react-crud-example">GitHub</NavLink>
          </NavItem>
        </Nav>
      </Collapse>
    </Navbar>
  );
};

export default AppNavbar;
```
{% endraw %}

Create `app/src/Home.js` to serve as the landing page for your app.

```jsx
import React from 'react';
import './App.css';
import AppNavbar from './AppNavbar';
import { Link } from 'react-router-dom';
import { Button, Container } from 'reactstrap';

const Home = () => {
  return (
    <div>
      <AppNavbar/>
      <Container fluid>
        <Button color="link"><Link to="/groups">Manage JUG Tour</Link></Button>
      </Container>
    </div>
  );
}

export default Home;
```

Also, change `app/src/App.js` to use React Router to navigate between components.

```jsx
import React from 'react';
import './App.css';
import Home from './Home';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import GroupList from './GroupList';
import GroupEdit from './GroupEdit';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route exact path="/" element={<Home/>}/>
        <Route path='/groups' exact={true} element={<GroupList/>}/>
      </Routes>
    </Router>
  )
}

export default App;
```

To make your UI a bit more spacious, add a top margin to Bootstrap's container classes in `app/src/App.css`.

```css
nav + .container, nav + .container-fluid {
  margin-top: 20px;
} 
```

Your React app should update itself as you make changes, and you should see a screen like the following at `http://localhost:3000`.

{% img blog/spring-boot-react/home-with-link.png alt:"Home screen with Manage JUG Tour link" width:"800" %}{: .center-image }

Click on **Manage JUG Tour** and you should see a list of the default groups.

{% img blog/spring-boot-react/group-list.png alt:"Group List screen" width:"800" %}{: .center-image }

It's great that you can see your Spring Boot API's data in your React app, but it's no fun if you can't edit it!

## Add a React `GroupEdit` component

Create `app/src/GroupEdit.js` and use `useEffect()` to fetch the group resource with the ID from the URL.

```jsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button, Container, Form, FormGroup, Input, Label } from 'reactstrap';
import AppNavbar from './AppNavbar';

const GroupEdit = () => {
  const initialFormState = {
    name: '',
    address: '',
    city: '',
    stateOrProvince: '',
    country: '',
    postalCode: ''
  };
  const [group, setGroup] = useState(initialFormState);
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    if (id !== 'new') {
      fetch(`/api/group/${id}`)
        .then(response => response.json())
        .then(data => setGroup(data));
    }
  }, [id, setGroup]);

  const handleChange = (event) => {
    const { name, value } = event.target

    setGroup({ ...group, [name]: value })
  }

  const handleSubmit = async (event) => {
    event.preventDefault();

    await fetch(`/api/group${group.id ? `/${group.id}` : ''}`, {
      method: (group.id) ? 'PUT' : 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(group)
    });
    setGroup(initialFormState);
    navigate('/groups');
  }

  const title = <h2>{group.id ? 'Edit Group' : 'Add Group'}</h2>;

  return (<div>
      <AppNavbar/>
      <Container>
        {title}
        <Form onSubmit={handleSubmit}>
          <FormGroup>
            <Label for="name">Name</Label>
            <Input type="text" name="name" id="name" value={group.name || ''}
                   onChange={handleChange} autoComplete="name"/>
          </FormGroup>
          <FormGroup>
            <Label for="address">Address</Label>
            <Input type="text" name="address" id="address" value={group.address || ''}
                   onChange={handleChange} autoComplete="address-level1"/>
          </FormGroup>
          <FormGroup>
            <Label for="city">City</Label>
            <Input type="text" name="city" id="city" value={group.city || ''}
                   onChange={handleChange} autoComplete="address-level1"/>
          </FormGroup>
          <div className="row">
            <FormGroup className="col-md-4 mb-3">
              <Label for="stateOrProvince">State/Province</Label>
              <Input type="text" name="stateOrProvince" id="stateOrProvince" value={group.stateOrProvince || ''}
                     onChange={handleChange} autoComplete="address-level1"/>
            </FormGroup>
            <FormGroup className="col-md-5 mb-3">
              <Label for="country">Country</Label>
              <Input type="text" name="country" id="country" value={group.country || ''}
                     onChange={handleChange} autoComplete="address-level1"/>
            </FormGroup>
            <FormGroup className="col-md-3 mb-3">
              <Label for="country">Postal Code</Label>
              <Input type="text" name="postalCode" id="postalCode" value={group.postalCode || ''}
                     onChange={handleChange} autoComplete="address-level1"/>
            </FormGroup>
          </div>
          <FormGroup>
            <Button color="primary" type="submit">Save</Button>{' '}
            <Button color="secondary" tag={Link} to="/groups">Cancel</Button>
          </FormGroup>
        </Form>
      </Container>
    </div>
  )
};

export default GroupEdit;
```

The `useParams()` hook is used to grab the ID from the URL and `useNavigate()` allows you to navigate back to the `GroupList` after adding or saving a group.

Modify `app/src/App.js` to import `GroupEdit` and specify a path to it.

```jsx
import GroupEdit from './GroupEdit';

const App = () => {
  return (
    <Router>
      <Routes>
        ...
        <Route path='/groups/:id' element={<GroupEdit/>}/>
      </Routes>
    </Router>
  )
}
```

Now you should be able to add and edit groups!

{% img blog/spring-boot-react/add-group.png alt:"Add Group screen" width:"800" %}{: .center-image }

{% img blog/spring-boot-react/edit-group.png alt:"Edit Group screen" width:"800" %}{: .center-image }

## Add authentication with Okta

It's pretty cool to build a CRUD app, but it's even cooler to build a _secure_ one. To achieve that, you'll want to add authentication so users have to log in before viewing/modifying groups. To make this simple, you can use Okta's API for OIDC. At Okta, our goal is to make [identity management](https://developer.okta.com/product/user-management/) a lot easier, more secure, and more scalable than what you're used to. Okta is a cloud service that allows developers to create, edit, and securely store user accounts and user account data, and connect them with one or multiple applications. Our API enables you to:

* [Authenticate](https://developer.okta.com/product/authentication/) and [authorize](https://developer.okta.com/product/authorization/) your users
* Store data about your users
* Perform password-based and [social login](https://developer.okta.com/authentication-guide/social-login/)
* Secure your application with [multi-factor authentication](https://developer.okta.com/use_cases/mfa/)
* And much more! Check out our [product documentation](https://developer.okta.com/documentation/)

Are you sold? [Register for a forever-free developer account](https://developer.okta.com/signup/), and when you're done, come on back so you can learn more about building secure apps with Spring Boot!

### Spring Security + OIDC

[Spring Security added OIDC support in its 5.0 release](/blog/2017/12/18/spring-security-5-oidc). Since then, they've made quite a few improvements and simplified its required configuration. Add the Okta Spring Boot starter to do OIDC authentication.

```xml
<dependency>
    <groupId>com.okta.spring</groupId>
    <artifactId>okta-spring-boot-starter</artifactId>
    <version>2.1.6</version>
</dependency>
```

This dependency is a thin wrapper around Spring Security's OAuth and encapsulates the following dependencies:

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-security</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.security</groupId>
    <artifactId>spring-security-config</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.security</groupId>
    <artifactId>spring-security-oauth2-client</artifactId>
</dependency>
<dependency>
    <groupId>org.springframework.security</groupId>
    <artifactId>spring-security-oauth2-jose</artifactId>
</dependency>
```

### Create an OIDC app in Okta

{% include setup/cli.md type="web" framework="Okta Spring Boot Starter" signup="false"
   loginRedirectUri="http://localhost:8080/login/oauth2/code/okta"
   logoutRedirectUri="http://localhost:3000,http://localhost:8080" %}

### Use Auth0 for OIDC

If you'd rather use Auth0, that's possible too! First, you'll need to use the Spring Security dependencies as mentioned above. The Okta Spring Boot starter [currently doesn't work with Auth0](https://github.com/okta/okta-spring-boot/issues/358).

Then, install the [Auth0 CLI](https://github.com/auth0/auth0-cli) and run `auth0 login` in a terminal.

Next, run `auth0 apps create`, provide a memorable name, and select **Regular Web Application**. Specify `http://localhost:8080/login/oauth2/code/auth0` for the **Callback URLs** and `http://localhost:3000,http://localhost:8080` for the **Allowed Logout URLs**. 

Modify your `src/main/resources/application.properties` to include your Auth0 issuer, client ID, and client secret. You will have to run `auth0 apps open` and select the app you created to copy your client secret. 

```properties
# make sure to include the trailing slash for the Auth0 issuer
spring.security.oauth2.client.provider.auth0.issuer-uri=https://<your-auth0-domain>/
spring.security.oauth2.client.registration.auth0.client-id=<your-client-id>
spring.security.oauth2.client.registration.auth0.client-secret=<your-client-secret>
spring.security.oauth2.client.registration.auth0.scope=openid,profile,email
```

Of course, you can also use your [Auth0 dashboard](https://manage.auth0.com) to configure your application. Just make sure to use the same URLs specified above. 

After configuring Spring Security in the section below, update `UserController.java` to use `auth0` in its constructor:

```java
public UserController(ClientRegistrationRepository registrations) {
    this.registration = registrations.findByRegistrationId("auth0");
}
```

And update its `logout()` method to work with Auth0:

```java
@PostMapping("/api/logout")
public ResponseEntity<?> logout(HttpServletRequest request) {
    // send logout URL to client so they can initiate logout
    StringBuilder logoutUrl = new StringBuilder();
    String issuerUri = this.registration.getProviderDetails().getIssuerUri();
    logoutUrl.append(issuerUri.endsWith("/") ? issuerUri + "v2/logout" : issuerUri + "/v2/logout");
    logoutUrl.append("?client_id=").append(this.registration.getClientId());

    Map<String, String> logoutDetails = new HashMap<>();
    logoutDetails.put("logoutUrl", logoutUrl.toString());
    request.getSession(false).invalidate();
    return ResponseEntity.ok().body(logoutDetails);
}
```

You'll also need to update `Home.js` in the React project to use different parameters for the logout redirect:

```js
window.location.href = `${response.logoutUrl}&returnTo=${window.location.origin}`;
```

You can see all the differences between Okta and Auth0 by [comparing their branches on GitHub](https://github.com/oktadev/okta-spring-boot-react-crud-example/compare/auth0).

## Configure Spring Security for React and user identity

To make Spring Security React-friendly, create a `SecurityConfiguration.java` file in `src/main/java/.../jugtours/config`. Create the `config` directory and put this class in it.

```java
package com.okta.developer.jugtours.config;

import com.okta.developer.jugtours.web.CookieCsrfFilter;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.www.BasicAuthenticationFilter;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;
import org.springframework.security.web.savedrequest.HttpSessionRequestCache;
import org.springframework.security.web.savedrequest.RequestCache;
import org.springframework.security.web.savedrequest.SimpleSavedRequest;

@Configuration
public class SecurityConfiguration {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests((authz) -> authz
                .requestMatchers("/", "/index.html", "/static/**",
                    "/*.ico", "/*.json", "/*.png", "/api/user").permitAll()
                .anyRequest().authenticated()
            )
            .csrf((csrf) -> csrf
                .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
                .csrfTokenRequestHandler(new CsrfTokenRequestAttributeHandler())
            )
            .addFilterAfter(new CookieCsrfFilter(), BasicAuthenticationFilter.class)
            .oauth2Login();
        return http.build();
    }

    @Bean
    public RequestCache refererRequestCache() { 
        return new HttpSessionRequestCache() {
            @Override
            public void saveRequest(HttpServletRequest request, HttpServletResponse response) {
                String referrer = request.getHeader("referer");
                if (referrer == null) {
                    referrer = request.getRequestURL().toString();
                }
                request.getSession().setAttribute("SPRING_SECURITY_SAVED_REQUEST",
                    new SimpleSavedRequest(referrer));

            }
        };
    }
}
```

This class has a lot going on, so let me explain a few things. In previous versions of Spring Security, there was an `authorizeRequests()` lambda you could use to secure paths. It still exists, but it's deprecated in Spring Security 6. It's permissive by default, with means any paths you don't specify will be allowed. The recommended way, shown here with `authorizeHttpRequests()` denies by default. This means you have to specify the resources you want to allow Spring Security to serve up, as well as the ones that the React app has. 

The `requestMatchers` lines defines what URLs are allowed for anonymous users. You will soon configure things so your React app is served up by your Spring Boot app, hence the reason for allowing "/", "/index.html", and web files. You might also notice an exposed `/api/user` path.

The `RequestCache` bean overrides the default request cache. It saves the referrer header (misspelled `referer` in real life), so Spring Security can redirect back to it after authentication. The referrer-based request cache comes in handy when you're developing React on `http://localhost:3000` and want to be redirected back there after logging in.

Configuring CSRF (cross-site request forgery) protection with `CookieCsrfTokenRepository.withHttpOnlyFalse()` means that the `XSRF-TOKEN` cookie won't be marked HTTP-only, so React can read it and send it back when it tries to manipulate data. The `CsrfTokenRequestAttributeHandler` is no longer the default, so you have to configure it as the request handler. You can read [this Stack Overflow answer](https://stackoverflow.com/a/74521360/65681) to learn more. Basically, since we're not sending the CSRF token to an HTML page, so we don't have to worry about BREACH attacks. This means we can revert to the previous default from Spring Security 5.

You'll need to create the `CookieCsrfFilter` class that's added because Spring Security 6 no longer sets the cookie for you. Create it in the `web` package.

```java
package com.okta.developer.jugtours.web;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Spring Security 6 doesn't set a XSRF-TOKEN cookie by default.
 * This solution is
 * <a href="https://github.com/spring-projects/spring-security/issues/12141#issuecomment-1321345077">
 * recommended by Spring Security.</a>
 */
public class CookieCsrfFilter extends OncePerRequestFilter {

  /**
   * {@inheritDoc}
   */
  @Override
  protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                  FilterChain filterChain) throws ServletException, IOException {
    CsrfToken csrfToken = (CsrfToken) request.getAttribute(CsrfToken.class.getName());
    response.setHeader(csrfToken.getHeaderName(), csrfToken.getToken());
    filterChain.doFilter(request, response);
  }
}
```

Create `src/main/java/.../jugtours/web/UserController.java` and populate it with the following code. This API will be used by React to 1) find out if a user is authenticated, and 2) perform global logout.

```java
package com.okta.developer.jugtours.web;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.core.oidc.OidcIdToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.Map;

@RestController
public class UserController {
    private ClientRegistration registration;

    public UserController(ClientRegistrationRepository registrations) {
        this.registration = registrations.findByRegistrationId("okta");
    }

    @GetMapping("/api/user")
    public ResponseEntity<?> getUser(@AuthenticationPrincipal OAuth2User user) {
        if (user == null) {
            return new ResponseEntity<>("", HttpStatus.OK);
        } else {
            return ResponseEntity.ok().body(user.getAttributes());
        }
    }

    @PostMapping("/api/logout")
    public ResponseEntity<?> logout(HttpServletRequest request,
                                    @AuthenticationPrincipal(expression = "idToken") OidcIdToken idToken) {
        // send logout URL to client so they can initiate logout
        String logoutUrl = this.registration.getProviderDetails()
                .getConfigurationMetadata().get("end_session_endpoint").toString();

        Map<String, String> logoutDetails = new HashMap<>();
        logoutDetails.put("logoutUrl", logoutUrl);
        logoutDetails.put("idToken", idToken.getTokenValue());
        request.getSession(false).invalidate();
        return ResponseEntity.ok().body(logoutDetails);
    }
}
```

You'll also want to add user information when creating groups so that you can filter by _your_ JUG tour. Add a `UserRepository.java` in the same directory as `GroupRepository.java`. 

```java
package com.okta.developer.jugtours.model;

import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, String> {
}
```

Add a new `findAllByUserId(String id)` method to `GroupRepository.java`. 

```java
List<Group> findAllByUserId(String id);
```

Then inject `UserRepository` into `GroupController.java` and use it to create (or grab an existing user) when adding a new group. While you're there, modify the `groups()` method to filter by user.

```java
package com.okta.developer.jugtours.web;

import com.okta.developer.jugtours.model.Group;
import com.okta.developer.jugtours.model.GroupRepository;
import com.okta.developer.jugtours.model.User;
import com.okta.developer.jugtours.model.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.*;

import jakarta.validation.Valid;
import java.net.URI;
import java.net.URISyntaxException;
import java.security.Principal;
import java.util.Collection;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api")
class GroupController {

    private final Logger log = LoggerFactory.getLogger(GroupController.class);
    private GroupRepository groupRepository;
    private UserRepository userRepository;

    public GroupController(GroupRepository groupRepository, UserRepository userRepository) {
        this.groupRepository = groupRepository;
        this.userRepository = userRepository;
    }

    @GetMapping("/groups")
    Collection<Group> groups(Principal principal) {
        return groupRepository.findAllByUserId(principal.getName());
    }

    @GetMapping("/group/{id}")
    ResponseEntity<?> getGroup(@PathVariable Long id) {
        Optional<Group> group = groupRepository.findById(id);
        return group.map(response -> ResponseEntity.ok().body(response))
                .orElse(new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    @PostMapping("/group")
    ResponseEntity<Group> createGroup(@Valid @RequestBody Group group,
                                      @AuthenticationPrincipal OAuth2User principal) throws URISyntaxException {
        log.info("Request to create group: {}", group);
        Map<String, Object> details = principal.getAttributes();
        String userId = details.get("sub").toString();
 
        // check to see if user already exists
        Optional<User> user = userRepository.findById(userId);
        group.setUser(user.orElse(new User(userId,
                        details.get("name").toString(), details.get("email").toString())));

        Group result = groupRepository.save(group);
        return ResponseEntity.created(new URI("/api/group/" + result.getId()))
                .body(result);
    }

    @PutMapping("/group/{id}")
    ResponseEntity<Group> updateGroup(@Valid @RequestBody Group group) {
        log.info("Request to update group: {}", group);
        Group result = groupRepository.save(group);
        return ResponseEntity.ok().body(result);
    }

    @DeleteMapping("/group/{id}")
    public ResponseEntity<?> deleteGroup(@PathVariable Long id) {
        log.info("Request to delete group: {}", id);
        groupRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
```

To magnify the changes, they're in the `groups()` and `createGroup()` methods. It's pretty slick that Spring JPA will create the `findAllByUserId()` method/query for you and `userRepository.findById()` uses Java 8's [Optional](http://www.baeldung.com/java-optional). 

```java
@GetMapping("/groups")
Collection<Group> groups(Principal principal) {
    return groupRepository.findAllByUserId(principal.getName());
}

@PostMapping("/group")
ResponseEntity<Group> createGroup(@Valid @RequestBody Group group,
                                  @AuthenticationPrincipal OAuth2User principal) throws URISyntaxException {
    log.info("Request to create group: {}", group);
    Map<String, Object> details = principal.getAttributes();
    String userId = details.get("sub").toString();

    // check to see if user already exists
    Optional<User> user = userRepository.findById(userId);
    group.setUser(user.orElse(new User(userId,
                    details.get("name").toString(), details.get("email").toString())));

    Group result = groupRepository.save(group);
    return ResponseEntity.created(new URI("/api/group/" + result.getId()))
            .body(result);
}
```

## Modify React to handle CSRF and be identity-aware

You'll need to make a few changes to your React components to make them identity-aware. The first thing you'll want to do is modify `src/index.js` to wrap everything in a `CookieProvider`. This component allows you to read the CSRF cookie and send it back as a header.

```jsx
import { CookiesProvider } from 'react-cookie';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <CookiesProvider>
      <App/>
    </CookiesProvider>
  </React.StrictMode>
);
```

Modify `app/src/Home.js` to call `/api/user` to see if the user is logged in. If they're not, show a `Login` button.

```jsx
import React, { useEffect, useState } from 'react';
import './App.css';
import AppNavbar from './AppNavbar';
import { Link } from 'react-router-dom';
import { Button, Container } from 'reactstrap';
import { useCookies } from 'react-cookie';

const Home = () => {

  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(undefined);
  const [cookies] = useCookies(['XSRF-TOKEN']);

  useEffect(() => {
    setLoading(true);
    fetch('api/user', { credentials: 'include' })
      .then(response => response.text())
      .then(body => {
        if (body === '') {
          setAuthenticated(false);
        } else {
          setUser(JSON.parse(body));
          setAuthenticated(true);
        }
        setLoading(false);
      });
  }, [setAuthenticated, setLoading, setUser])

  const login = () => {
    let port = (window.location.port ? ':' + window.location.port : '');
    if (port === ':3000') {
      port = ':8080';
    }
    // redirect to a protected URL to trigger authentication
    window.location.href = `//${window.location.hostname}${port}/api/private`;
  }

  const logout = () => {
    fetch('/api/logout', {
      method: 'POST', credentials: 'include',
      headers: { 'X-XSRF-TOKEN': cookies['XSRF-TOKEN'] }
    })
      .then(res => res.json())
      .then(response => {
        window.location.href = `${response.logoutUrl}?id_token_hint=${response.idToken}`
          + `&post_logout_redirect_uri=${window.location.origin}`;
      });
  }

  const message = user ?
    <h2>Welcome, {user.name}!</h2> :
    <p>Please log in to manage your JUG Tour.</p>;

  const button = authenticated ?
    <div>
      <Button color="link"><Link to="/groups">Manage JUG Tour</Link></Button>
      <br/>
      <Button color="link" onClick={logout}>Logout</Button>
    </div> :
    <Button color="primary" onClick={login}>Login</Button>;

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div>
      <AppNavbar/>
      <Container fluid>
        {message}
        {button}
      </Container>
    </div>
  );
}

export default Home;
```

There are some things you should be aware of in this component:

1. `useCookies()` is used for access to cookies. Then you can fetch a cookie with `cookies['XSRF-TOKEN']`. 
2. When using `fetch()`, you need to include `{credentials: 'include'}` to transfer cookies. You will get a 403 Forbidden if you do not include this option.
3. The CSRF cookie from Spring Security has a different name than the header you need to send back. The cookie name is `XSRF-TOKEN`, while the header name is `X-XSRF-TOKEN`. 

Update `app/src/GroupList.js` to have similar changes. The good news is you don't need to make any changes to the `render()` method.

```jsx
import { useCookies } from 'react-cookie';

const GroupList = () => {

  ...
  const [cookies] = useCookies(['XSRF-TOKEN']);

  ...
  const remove = async (id) => {
    await fetch(`/api/group/${id}`, {
      method: 'DELETE',
      headers: {
        'X-XSRF-TOKEN': cookies['XSRF-TOKEN'],
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    }).then(() => {
      let updatedGroups = [...groups].filter(i => i.id !== id);
      setGroups(updatedGroups);
    });
  }
  ...

  return (...)
}

export default GroupList;
```

Update `GroupEdit.js` too.

```jsx
import { useCookies } from 'react-cookie';

const GroupEdit = () => {
  
  ...
  const [cookies] = useCookies(['XSRF-TOKEN']);

  ...
  const handleSubmit = async (event) => {
    event.preventDefault();

    await fetch(`/api/group${group.id ? `/${group.id}` : ''}`, {
      method: group.id ? 'PUT' : 'POST',
      headers: {
        'X-XSRF-TOKEN': cookies['XSRF-TOKEN'],
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(group),
      credentials: 'include'
    });
    setGroup(initialFormState);
    navigate('/groups');
  }

  ...

  return (...)
}

export default GroupEdit;
```

After all these changes, you should be able to restart both Spring Boot and React and witness the glory of planning your very own JUG Tour!

{% img blog/spring-boot-react/react-login.png alt:"React Login" width:"800" %}{: .center-image }

{% img blog/spring-boot-react/my-jug-tour.png alt:"My JUG Tour" width:"800" %}{: .center-image }

## Configure Maven to build and package React with Spring Boot

To build and package your React app with Maven, you can use the [frontend-maven-plugin](https://github.com/eirslett/frontend-maven-plugin) and Maven's profiles to activate it. Add properties for versions and a `<profiles>` section to your `pom.xml`.

```xml
<properties>
    ...
    <frontend-maven-plugin.version>1.12.1</frontend-maven-plugin.version>
    <node.version>v16.18.1</node.version>
    <npm.version>v8.19.2</npm.version>
</properties>

<profiles>
    <profile>
        <id>dev</id>
        <activation>
            <activeByDefault>true</activeByDefault>
        </activation>
        <properties>
            <spring.profiles.active>dev</spring.profiles.active>
        </properties>
    </profile>
    <profile>
        <id>prod</id>
        <build>
            <plugins>
                <plugin>
                    <artifactId>maven-resources-plugin</artifactId>
                    <executions>
                        <execution>
                            <id>copy-resources</id>
                            <phase>process-classes</phase>
                            <goals>
                                <goal>copy-resources</goal>
                            </goals>
                            <configuration>
                                <outputDirectory>${basedir}/target/classes/static</outputDirectory>
                                <resources>
                                    <resource>
                                        <directory>app/build</directory>
                                    </resource>
                                </resources>
                            </configuration>
                        </execution>
                    </executions>
                </plugin>
                <plugin>
                    <groupId>com.github.eirslett</groupId>
                    <artifactId>frontend-maven-plugin</artifactId>
                    <version>${frontend-maven-plugin.version}</version>
                    <configuration>
                        <workingDirectory>app</workingDirectory>
                    </configuration>
                    <executions>
                        <execution>
                            <id>install node</id>
                            <goals>
                                <goal>install-node-and-npm</goal>
                            </goals>
                            <configuration>
                                <nodeVersion>${node.version}</nodeVersion>
                                <npmVersion>${npm.version}</npmVersion>
                            </configuration>
                        </execution>
                        <execution>
                            <id>npm install</id>
                            <goals>
                                <goal>npm</goal>
                            </goals>
                            <phase>generate-resources</phase>
                        </execution>
                        <execution>
                            <id>npm test</id>
                            <goals>
                                <goal>test</goal>
                            </goals>
                            <phase>test</phase>
                            <configuration>
                                <arguments>test</arguments>
                                <environmentVariables>
                                    <CI>true</CI>
                                </environmentVariables>
                            </configuration>
                        </execution>
                        <execution>
                            <id>npm build</id>
                            <goals>
                                <goal>npm</goal>
                            </goals>
                            <phase>compile</phase>
                            <configuration>
                                <arguments>run build</arguments>
                            </configuration>
                        </execution>
                    </executions>
                </plugin>
            </plugins>
        </build>
        <properties>
            <spring.profiles.active>prod</spring.profiles.active>
        </properties>
    </profile>
</profiles>
```

While you're at it, add the active profile setting to `src/main/resources/application.properties`:

```properties
spring.profiles.active=@spring.profiles.active@
```

After adding this, you should be able to run `./mvnw spring-boot:run -Pprod` and see your app running on `http://localhost:8080`. 

{% img blog/spring-boot-react/localhost-8080.png alt:"App Running with Maven" width:"800" %}{: .center-image }

Everything will work just fine if you start at the root, since React will handle routing. However, if you refresh the page when you're at `http://localhost:8080/groups`, you'll get a 404 error since Spring Boot doesn't have a route for `/groups`. To fix this, add a `SpaWebFilter` that conditionally forwards to the React app.

```java
package com.okta.developer.jugtours.web;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.security.Principal;

public class SpaWebFilter extends OncePerRequestFilter {

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        String path = request.getRequestURI();
        Authentication user = SecurityContextHolder.getContext().getAuthentication();
        if (user != null && !path.startsWith("/api") && !path.contains(".") && path.matches("/(.*)")) {
            request.getRequestDispatcher("/").forward(request, response);
            return;
        }

        filterChain.doFilter(request, response);
    }
}
```

And, add it to `SecurityConfiguration.java`:

```java
.addFilterAfter(new SpaWebFilter(), BasicAuthenticationFilter.class)
```

Now, if you restart and reload the page, everything will work as expected. 🤗

## Learn more about Spring Boot and React

I hope you've enjoyed this tutorial on how to do CRUD with React, Spring Boot, and Spring Security. You can see that Spring Security's OIDC support is pretty robust, and doesn't require a whole lot of configuration. Adding CSRF protection and packaging your Spring Boot + React app as a single artifact is pretty cool too!

You can find the example created in this tutorial on GitHub at [https://github.com/oktadev/okta-spring-boot-react-crud-example](https://github.com/oktadev/okta-spring-boot-react-crud-example).

We've written some other cool Spring Boot and React tutorials. Check them out if you're interested.

* [Creating a TypeScript React Application with Vite](/blog/2022/03/14/react-vite-number-converter)
* [How to Create a React App with Storybook](/blog/2022/01/20/react-storybook)
* [How to Build and Deploy a Serverless React App on Azure](/blog/2022/04/13/react-azure-functions)
* [A Quick Guide to Elasticsearch with Spring Data and Spring Boot](/blog/2022/02/16/spring-data-elasticsearch)
* [Full Stack Java with React, Spring Boot, and JHipster](/blog/2021/11/22/full-stack-java)
* [Build a CRUD Application with Kotlin and React](/blog/2020/01/13/kotlin-react-crud)

If you have any questions, please don't hesitate to leave a comment below or ask us on our [Okta Developer Forums](https://devforum.okta.com/). Follow us [on Twitter](https://twitter.com/oktadev) if you want to see more tutorials like this one!
