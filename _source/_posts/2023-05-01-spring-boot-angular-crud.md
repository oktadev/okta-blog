---
layout: blog_post
title: "Build a CRUD App with Spring Boot and Angular"
author: matt-raible
by: advocate
communities: [java,javascript]
description: "Learn how to build a secure CRUD app with Spring Boot and Angular. You'll use Auth0 for authentication and authorization, and Cypress to verify it all works."
tags: [java, spring-boot, angular, crud, auth0, cypress]
tweets:
- ""
- ""
- ""
image: blog/spring-boot-angular/bootiful-angular.png
github: https://github.com/oktadev/auth0-spring-boot-angular-crud-example
type: conversion
---



Angular is one of the most popular frameworks for building single-page applications (SPAs). It's a TypeScript-based framework that allows you to declaratively describe your UI by creating small, reusable components. It's also backed by Google, which means it's likely to be around for a long time.

I like to build tutorials with CRUD (create, read, update, and delete) apps because they show a lot of the base functionality you need when creating an app. Once you have the basics of CRUD completed, most of the integration work is finished, and you can move on to implementing the necessary business logic.

In this tutorial, you'll learn how to build a secure CRUD app with Spring Boot and Angular. I'll use the OAuth 2.0 Authorization Code flow and package the Angular app in the Spring Boot app for distribution as a single artifact. At the same time, I'll show you how to keep Angular's productive workflow for developing locally. 

<!-- You'll use Auth0 for authentication and authorization, and Cypress to verify it all works.-->

{% include toc.md %}

**Prerequisites**:

- [Java 17](http://sdkman.io)
- [Node 18](https://nodejs.org/)
- [Auth0 CLI](https://github.com/auth0/auth0-cli#installation)
- [An Auth0 account](https://auth0.com/signup)

## Configure and run a Spring Boot and Angular CRUD app

I'm a frequent speaker at conferences and Java User Groups (JUGs) around the world. I've been a Java developer for 20+ years and love the Java community. I've found that speaking at JUGs is a great way to interact with the community and get raw feedback on presentations. 

Why am I telling you this? Because I thought it'd be fun to create a "JUG Tours" app today that allows you to create/edit/delete JUGs and view upcoming events.

I realize that taking 20 minutes to build this app can be cumbersome, so I've already built it. It uses Spring Boot 3.1.0 and Angular 16. You can just clone, configure, and run!

```shell
git clone https://github.com/oktadev/auth0-spring-boot-angular-crud-example jugtours
cd jugtours
```

Open a terminal window and run `auth0 login` to configure the Auth0 CLI to securely communicate with your tenant. Then, run `auth0 apps create` to register this app with appropriate URLs:

```shell
auth0 apps create \
  --name "Bootiful Angular" \
  --description "Spring Boot + Angular = ❤️" \
  --type regular \
  --callbacks http://localhost:8080/login/oauth2/code/okta,http://localhost:4200/login/oauth2/code/okta \
  --logout-urls http://localhost:8080,http://localhost:4200 \
  --reveal-secrets
```

Copy the outputted values from this command into an `.okta.env` file:

```shell
export OKTA_OAUTH2_ISSUER=https://<your-auth0-domain>/
export OKTA_OAUTH2_CLIENT_ID=<your-client-id>
export OKTA_OAUTH2_CLIENT_SECRET=<your-client-secret>
```

If you're on Windows, use `set` instead of `export` to set these environment variables and name the file `.okta.env.bat`:

```shell
set OKTA_OAUTH2_ISSUER=https://<your-auth0-domain>/
set OKTA_OAUTH2_CLIENT_ID=<your-client-id>
set OKTA_OAUTH2_CLIENT_SECRET=<your-client-secret>
```

Then, run `source .okta.env` (or `.okta.env.bat` on Windows) to set these environment variables in your current shell.

Finally, run `./mvnw` (or `mvnw` on Windows) to start the app. 

```shell
source .okta.env # run .okta.env.bat on Windows
./mvnw -Pprod # use mvnw -Pprod on Windows
```

You can then open `http://localhost:8080` in your favorite browser to view the app.

{% img blog/spring-boot-angular/home-with-login.png alt:"JUG Tours homepage" width:"800" %}{: .center-image }

Click **Login** and you'll be prompted to log in with Auth0. You'll also be asked for consent. This is because the app is requesting access to your profile and email address. Click **Accept** to continue.

{% img blog/spring-boot-angular/auth0-consent.png alt:"Auth0 consent" width:"800" %}{: .center-image }

Once you're authenticated, you'll see a link to manage your JUG Tours. 

{% img blog/spring-boot-angular/manage-jugtours.png alt:"Manage JUG Tours" width:"800" %}{: .center-image }

You should be able to add new groups and events, as well as edit and delete them. 

{% img blog/spring-boot-angular/jug-tours-list.png alt:"List of JUG Tours" width:"800" %}{: .center-image }

### Verify Cypress end-to-end tests pass

You can verify everything works by executing the Cypress tests that are included in the project. First, add environment variables for your credentials to the `.okta.env` (or `.okta.env.bat`) file you created earlier.

```shell
export CYPRESS_E2E_DOMAIN=<your-auth0-domain> # use the raw value, no https prefix
export CYPRESS_E2E_USERNAME=<your-email>
export CYPRESS_E2E_PASSWORD=<your-password>
```

Then, run `source .okta.env` (or `.okta.env.bat` on Windows) to set these environment variables. 

Finally, run `npm run e2e` to start the app and run the Cypress tests.

```shell
cd app
npm run e2e
```

{% img blog/spring-boot-angular/cypress-chrome.png alt:"Cypress tests running in Chrome" %}{: .center-image }

If you'd like to see how this app was built, read on!

## Create a Java REST API with Spring Boot

To begin, navigate to [start.spring.io](https://start.spring.io) and make the following selections:

* **Project:** `Maven Project`
* **Group:** `com.okta.developer`
* **Artifact:** `jugtours`
* **Dependencies**: `JPA`, `H2`, `Web`, `Lombok`, `Validation`, `Okta`

Click **Generate Project**, expand `jugtours.zip` after downloading, and open the project in your favorite IDE.

// todo: httpie command and link

### Add a JPA domain model

todo: https://vladmihalcea.com/java-records-jpa-hibernate/

Create a `src/main/java/com/okta/developer/jugtours/model` directory and a `Group.java` class in it.

Why Lombok? Because 90 lines of code required and it simply doesn't look good in a tutorial. Without, it's only 33. Don't like it, remove it and generate getters/setters, toString, hashCode, and equals.

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

. Create an `Event.java` class in the same package.

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
        Stream.of("Omaha JUG", "Kansas City JUG", "Chicago JUG",
            "Dallas JUG", "Philly JUG", "Garden State JUG", "NY Java SIG")
            .forEach(name -> repository.save(new Group(name)));

        Group jug = repository.findByName("Garden State JUG");
        Event e = Event.builder().title("OAuth for Java Developers")
            .description("Learn all about OAuth and OIDC + Java!")
            .date(Instant.parse("2023-10-18T18:00:00.000Z"))
            .build();
        jug.setEvents(Collections.singleton(e));
        repository.save(jug);

        repository.findAll().forEach(System.out::println);
    }
}
```

**TIP**: If your IDE has issues with `Event.builder()`, you need to turn on annotation processing and/or install the Lombok plugin. See the [official docs](https://projectlombok.org/setup) for more info.

Start your app with `mvn spring-boot:run` and you should see groups and events being created.

Add a `GroupController.java` class (in `src/main/java/.../jugtours/web`) that allows you to CRUD groups. 

```java
package com.okta.developer.jugtours.web;

import com.okta.developer.jugtours.model.Group;
import com.okta.developer.jugtours.model.GroupRepository;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.Collection;
import java.util.Optional;

@RestController
@RequestMapping("/api")
@Slf4j
class GroupController {

    private final GroupRepository groupRepository;

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
        return group.map(response -> ResponseEntity.ok().body(response)).orElse(new ResponseEntity<>(HttpStatus.NOT_FOUND));
    }

    @PostMapping("/group")
    ResponseEntity<Group> createGroup(@Valid @RequestBody Group group) throws URISyntaxException {
        log.info("Request to create group: {}", group);
        Group result = groupRepository.save(group);
        return ResponseEntity.created(new URI("/api/group/" + result.getId())).body(result);
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

Restart the app, hit `http://localhost:8080/api/groups` with [HTTPie](https://httpie.org), and you should see the list of groups.

    http :8080/api/groups

You can create, read, update, and delete groups with the following commands.

```shell
http POST :8080/api/group name='SF JUG' city='San Francisco' country=USA
http :8080/api/group/8
http PUT :8080/api/group/8 id=8 name='SF JUG' address='By the Bay'
http DELETE :8080/api/group/8
```

todo: git init now or `rm -rf app/.git` below?

## Create an Angular UI with Angular CLI

Create a new project:

```shell
npx @angular/cli@16.0.0-rc.1 new app --routing --style css
```

todo: mention --standalone flag

After the app creation process completes, navigate into the `app` directory and install [Angular Material](https://material.angular.io/).

```shell
cd app
ng add @angular/material
```

? Choose a prebuilt theme name, or "custom" for a custom theme: Indigo/Pink        [ Preview:
https://material.angular.io?theme=indigo-pink ]
? Set up global Angular Material typography styles? No
? Include the Angular animations module? Include and enable animations

```shell
npm start
```

Modify `app.component.html` and move CSS at the top to `app.component.css`:

```html
<div class="toolbar" role="banner">
  ...
</div>

<div class="content" role="main">
  <router-outlet></router-outlet>
</div>
```

todo: Show screenshot of collapsed code in IntelliJ

## Call your Spring Boot API and display the results

Update `app.component.ts` to fetch the list of groups when it loads.

```typescript
import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Group } from './model/group';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'JUG Tours';
  loading = true;
  groups: Group[] = [];

  constructor(private http: HttpClient) {
  }

  ngOnInit() {
    this.loading = true;
    this.http.get<Group[]>('api/groups').subscribe((data: Group[]) => {
      this.groups = data;
      this.loading = false;
    });
  }
}
```

Before this will compile, you'll need to create `model/group.ts`:

```typescript
export class Group {
  id: number;
  name: string;
  constructor(obj?: any) {
    this.id = obj?.id || null;
    this.name = obj?.name || null;
  }
}
```

And add `HttpClientModule` to `app.module.ts`:

```typescript
import { HttpClientModule } from '@angular/common/http';

@NgModule({
  ...
  imports: [
    ...
    HttpClientModule
  ],
  ...
})
export class AppModule { }
```

Then, modify the `app.component.html` file to display the list of groups.

```html
<div class="content" role="main">

  <h2>{{title}}</h2>
  <div *ngIf="loading">
    <p>Loading...</p>
  </div>
  <div *ngFor="let group of groups">
    <div>{{group.name}}</div>
  </div>
  <router-outlet></router-outlet>
</div>
```   

Create a file called `proxy.conf.json` in the `src` folder of your project and use it to define your proxies:

```json
{
  "/api": {
    "target": "http://localhost:8080",
    "secure": false
  }
}
```

Update `angular.json` to use the proxy.

```json
"serve": {
  "builder": "@angular-devkit/build-angular:dev-server",
  "configurations": {
    "production": {
      "browserTarget": "app:build:production"
    },
    "development": {
      "browserTarget": "app:build:development",
      "proxyConfig": "src/proxy.conf.json"
    }
  },
  "defaultConfiguration": "development"
},
```

Cancel with Ctrl+C and restart with `npm start`.

## Build an Angular list component

## Build an Angular detail component

## Secure Spring Boot with OpenID Connect

## Configure Spring Security for maximum protection

## Update Angular to handle CSRF and be identity-aware

## Configure Maven to build and package Angular with Spring Boot

## Verify everything works with Cypress

## Build something fabulous with Angular and Spring Boot!

https://stackoverflow.com/questions/70601508/can-i-use-java-16-record-with-jpa-entity
