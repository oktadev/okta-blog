---
layout: blog_post
title: "Build a Beautiful CRUD App with Spring Boot and Angular"
# I'm not sure Beautiful is the right word here, but it seems better than simple like the React and Vue CRUD posts use. Bootiful might be better. 
author: matt-raible
by: advocate
communities: [java,javascript]
description: "Learn how to build a secure CRUD app with Spring Boot and Angular. You'll use Auth0 for authentication and authorization and Cypress to verify it all works."
tags: [java, spring-boot, angular, angular-material, crud, auth0, cypress]
tweets:
  - "Spring Boot 3.1 + Angular 16 = 😍!"
  - "Spring Boot and Angular: still kicking ass after all these years!"
  - "Two of my favorite frameworks? Spring Boot and Angular! 🍃+ 🅰️= ❤️"
image: blog/spring-boot-angular/bootiful-angular.png
github: https://github.com/oktadev/auth0-spring-boot-angular-crud-example
type: conversion
---

Angular is one of my favorite frameworks for building single-page applications (SPAs). As a Java developer, its separation of components, services, and pipes made a lot of sense to me. It's a web framework that allows you to declaratively describe your UI by creating small, reusable components. I believe it was a huge influencer in TypeScript's popularity. It's also backed by Google, which means it will likely be around for a long time.

I like to build CRUD (create, read, update, and delete) apps to understand frameworks. I think they show a lot of the base functionality you need when creating an app. Once you complete the basics of CRUD, most of the integration work is finished, and you can move on to implementing the necessary business logic.

In this tutorial, you'll learn how to build a secure CRUD app with Spring Boot and Angular. The final will result will use OAuth 2.0 authorization code flow and package the Angular app in the Spring Boot app for distribution as a single artifact. At the same time, I'll show you how to keep Angular's productive workflow when developing locally.

{% include toc.md %}

You'll need to install several tools to follow along with this tutorial.

**Prerequisites**:

- [Java 17](http://sdkman.io)
- [Node 18](https://nodejs.org/)
- [HTTPie](https://httpie.io/cli)
- [Auth0 CLI](https://github.com/auth0/auth0-cli#installation)
- [An Auth0 account](https://auth0.com/signup)

## Configure and run a Spring Boot and Angular app

I'm a frequent speaker at conferences and Java User Groups (JUGs) around the world. I've been a Java developer for 20+ years and ❤️ the Java community. I've found that speaking at JUGs is a great way to interact with the community and get raw feedback on presentations.

{% twitter 1623190784072720386 %}

Why am I telling you this? Because I thought it'd be fun to create a "JUG Tours" app that allows you to create/edit/delete JUGs and view upcoming events.

I realize that taking 20 minutes to build this app can be cumbersome, so I've already built it in [@oktadev/auth0-spring-boot-angular-crud-example](https://github.com/oktadev/auth0-spring-boot-angular-crud-example). The project uses Spring Boot 3.1.0 and Angular 16. I hope this helps you clone, configure, and run! Seeing something running is such a joyful experience. 🤗

```shell
git clone https://github.com/oktadev/auth0-spring-boot-angular-crud-example jugtours
cd jugtours
```

Open a terminal window and run `auth0 login` to configure the Auth0 CLI to get an API key for your tenant. Then, run `auth0 apps create` to register this app with the appropriate URLs:

```shell
auth0 apps create \
  --name "Bootiful Angular" \
  --description "Spring Boot + Angular = ❤️" \
  --type regular \
  --callbacks http://localhost:8080/login/oauth2/code/okta,http://localhost:4200/login/oauth2/code/okta \
  --logout-urls http://localhost:8080,http://localhost:4200 \
  --reveal-secrets
```

Copy the outputted values from this command into a new `.okta.env` file:

```shell
export OKTA_OAUTH2_ISSUER=https://<your-auth0-domain>/
export OKTA_OAUTH2_CLIENT_ID=<your-client-id>
export OKTA_OAUTH2_CLIENT_SECRET=<your-client-secret>
```

If you're on Windows, use `set` instead of `export` to set these environment variables, and name the file `.okta.env.bat`:

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

To view the app, you can then open `http://localhost:8080` in your favorite browser.

{% img blog/spring-boot-angular/home-with-login.png alt:"JUG Tours homepage" width:"800" %}{: .center-image }

Click **Login**, and you'll be prompted to log in with Auth0. You'll also be asked for consent. This is because the app is requesting access to your profile and email address. Click **Accept** to continue.

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

Pretty slick, don't you think? 🤠

Read on if you'd like to see how I created this app!

## Create a Java REST API with Spring Boot

The easiest way to create a new Spring Boot app is to navigate to [start.spring.io](https://start.spring.io) and make the following selections:

* **Project:** `Maven Project`
* **Group:** `com.okta.developer`
* **Artifact:** `jugtours`
* **Dependencies**: `JPA`, `H2`, `Web`, `Validation`

Click **Generate Project**, expand `jugtours.zip` after downloading, and open the project in your favorite IDE.

You can also use [this link](https://start.spring.io/#!type=maven-project&language=java&platformVersion=3.1.0&packaging=jar&jvmVersion=17&groupId=com.okta.developer&artifactId=jugtours&name=jugtours&description=Track%20your%20JUG%20Tours!&packageName=com.okta.developer.jugtours&dependencies=data-jpa,h2,web,validation) or [HTTPie](https://httpie.io/) to create the project from the command line:

```shell
https start.spring.io/starter.zip type==maven-project bootVersion==3.1.0 \
  dependencies==data-jpa,h2,web,validation \
  language==java platformVersion==17 \
  name==jugtours artifactId==jugtours \
  groupId==com.okta.developer packageName==com.okta.developer.jugtours \
  baseDir==jugtours | tar -xzvf -
```

### Add a JPA domain model

Open the jugtours project in your favorite IDE. Create a `src/main/java/com/okta/developer/jugtours/model` directory and a `Group.java` class in it.

```java
package com.okta.developer.jugtours.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;

import java.util.Set;

@Entity
@Table(name = "user_group")
public class Group {

    @Id
    @GeneratedValue
    private Long id;
    @NotNull
    private String name;
    private String address;
    private String city;
    private String stateOrProvince;
    private String country;
    private String postalCode;
    @ManyToOne(cascade = CascadeType.PERSIST)
    private User user;
    @OneToMany(fetch = FetchType.EAGER, cascade = CascadeType.ALL)
    private Set<Event> events;

    // JPA requires a default constructor
    public Group() {}
  
    public Group(String name) {
        this.name = name;
    }

    // getters and setters, equals, hashcode, and toString omitted for brevity
    // Why not Lombok? See https://twitter.com/mariofusco/status/1650439733212766208
    // Want Lombok anyway? See https://bit.ly/3HkaYMm and revert
}
```

Create an `Event.java` class in the same package.

```java
package com.okta.developer.jugtours.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToMany;

import java.time.Instant;
import java.util.Set;

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

    public Event() {}
     
    public Event(Instant date, String title, String description) {
        this.date = date;
        this.title = title;
        this.description = description;
    }

    // you can generate the getters and setters using your IDE!
}
```

And a `User.java` class.

```java
package com.okta.developer.jugtours.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.util.Objects;

@Entity
@Table(name = "users")
public class User {

    @Id
    private String id;
    private String name;
    private String email;

    public User() {}
  
    public User(String id, String name, String email) {
        this.id = id;
        this.name = name;
        this.email = email;
    }

    // getters and setters omitted for brevity
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
        Event e = new Event(Instant.parse("2023-10-18T18:00:00.000Z"),
            "OAuth for Java Developers", "Learn all about OAuth and OIDC + Java!");
        jug.setEvents(Collections.singleton(e));
        repository.save(jug);

        repository.findAll().forEach(System.out::println);
    }
}
```

Start your app with `mvn spring-boot:run`, and you should see groups and events being created.

Add a `GroupController.java` class (in `src/main/java/.../jugtours/web`) that allows you to CRUD groups.

```java
package com.okta.developer.jugtours.web;

import com.okta.developer.jugtours.model.Group;
import com.okta.developer.jugtours.model.GroupRepository;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.net.URISyntaxException;
import java.util.Collection;
import java.util.Optional;

@RestController
@RequestMapping("/api")
class GroupController {

    private final Logger log = LoggerFactory.getLogger(GroupController.class);
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

Restart the app, hit `http://localhost:8080/api/groups` with HTTPie, and you should see the list of groups.

    http :8080/api/groups

You can create, read, update, and delete groups with the following commands.

```shell
http POST :8080/api/group name='SF JUG' city='San Francisco' country=USA
http :8080/api/group/8
http PUT :8080/api/group/8 id=8 name='SF JUG' address='By the Bay'
http DELETE :8080/api/group/8
```

## Create an Angular app with the Angular CLI

The Angular CLI was a revolutionary tool when it was released in 2016. It's now the standard way to create new Angular projects and the easiest way to get started with Angular. Many web frameworks have adopted similar tools to improve their developer experience.

You don't have to install Angular CLI globally. The `npx` command can install and run it for you.

```shell
npx @angular/cli@16 new app --routing --style css
```

Of course, you can use the tried-and-true `npm i -g @angular/cli` and `ng new app --routing --style css` if you prefer. You can even remove the version number if you want to live on the edge.

After the app creation process completes, navigate into the `app` directory and install [Angular Material](https://material.angular.io/) to make the UI look beautiful, particularly on mobile devices.

```shell
cd app
ng add @angular/material
```

You'll be prompted to choose a theme, set up typography styles, and include animations. Select the defaults.

Modify `app/src/app/app.component.html` and move the CSS at the top to `app.component.css`:

```html
<div class="toolbar" role="banner">
  ...
</div>

<div class="content" role="main">
  <router-outlet></router-outlet>
</div>
```

**TIP**: Copy and paste from the [final `app.component.css`](https://github.com/oktadev/auth0-spring-boot-angular-crud-example/blob/main/app/src/app/app.component.css) to yours if you want your app to match the screenshots in this tutorial.

### Call your Spring Boot API and display the results

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

Before this compiles, you'll need to create a `app/src/app/model/group.ts` file with the following contents:

```typescript
export class Group {
  id: number | null;
  name: string;

  constructor(group: Partial<Group> = {}) {
    this.id = group?.id || null;
    this.name = group?.name || '';
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

{% raw %}
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
{% endraw %}

Create a file called `proxy.conf.js` in the `src` folder of your Angular project and use it to define your proxies:

```js
const PROXY_CONFIG = [
  {
    context: ['/api'],
    target: 'http://localhost:8080',
    secure: true,
    logLevel: 'debug'
  }
]

module.exports = PROXY_CONFIG;
```

Update `angular.json` and its `serve` command to use the proxy.

```json
"serve": {
  "builder": "@angular-devkit/build-angular:dev-server",
  "configurations": {
    "production": {
      "browserTarget": "app:build:production"
    },
    "development": {
      "browserTarget": "app:build:development",
      "proxyConfig": "src/proxy.conf.js"
    }
  },
  "defaultConfiguration": "development"
},
```

Stop your app with `Ctrl+C` and restart it with `npm start`. Now you should see a list of groups in your Angular app!

{% img blog/spring-boot-angular/app-group-list.png alt:"JUG Tours list" width:"800" %}{: .center-image }

### Build an Angular `GroupList` component

Angular is a component framework that allows you to separate concerns easily. You don't want to render everything in your main `AppComponent`, so create a new component to display the list of groups.

```shell
ng g c group-list --standalone
```

This command will create a new component in `src/app/group-list` with a TypeScript file, HTML template, CSS file, and a test file. The `--standalone` flag is new in Angular 15 and allows you to isolate components to be self-contained and, therefore, easier to distribute. You don't need to use it if you're following along, but the final code uses it.

Replace the code in `group-list.component.ts` with the following:

```typescript
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Group } from '../model/group';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-group-list',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule, MatTableModule, MatIconModule],
  templateUrl: './group-list.component.html',
  styleUrls: ['./group-list.component.css']
})
export class GroupListComponent {
  title = 'Group List';
  loading = true;
  groups: Group[] = [];
  displayedColumns = ['id','name','events','actions'];
  feedback: any = {};

  constructor(private http: HttpClient) {
  }

  ngOnInit() {
    this.loading = true;
    this.http.get<Group[]>('api/groups').subscribe((data: Group[]) => {
      this.groups = data;
      this.loading = false;
      this.feedback = {};
    });
  }

  delete(group: Group): void {
    if (confirm(`Are you sure you want to delete ${group.name}?`)) {
      this.http.delete(`api/group/${group.id}`).subscribe({
        next: () => {
          this.feedback = {type: 'success', message: 'Delete was successful!'};
          setTimeout(() => {
            this.ngOnInit();
          }, 1000);
        },
        error: () => {
          this.feedback = {type: 'warning', message: 'Error deleting.'};
        }
      });
    }
  }

  protected readonly event = event;
}
```

Update its HTML template to use Angular Material's table component.

{% raw %}
```html
<nav aria-label="breadcrumb">
  <ol class="breadcrumb">
    <li class="breadcrumb-item"><a routerLink="/">Home</a></li>
    <li class="breadcrumb-item active">Groups</li>
  </ol>
</nav>

<a [routerLink]="['/group/new']" mat-raised-button color="primary" style="float: right" id="add">Add Group</a>

<h2>{{title}}</h2>
<div *ngIf="loading; else list">
  <p>Loading...</p>
</div>

<ng-template #list>
  <div *ngIf="feedback.message" class="alert alert-{{feedback.type}}">{{ feedback.message }}</div>
  <table mat-table [dataSource]="groups">
    <ng-container matColumnDef="id">
      <mat-header-cell *matHeaderCellDef> ID </mat-header-cell>
      <mat-cell *matCellDef="let item"> {{ item.id }} </mat-cell>
    </ng-container>
    <ng-container matColumnDef="name">
      <mat-header-cell *matHeaderCellDef> Name </mat-header-cell>
      <mat-cell *matCellDef="let item"> {{ item.name }} </mat-cell>
    </ng-container>
    <ng-container matColumnDef="events">
      <mat-header-cell *matHeaderCellDef> Events </mat-header-cell>
      <mat-cell *matCellDef="let item">
        <ng-container *ngFor="let event of item.events">
          {{event.date | date }}: {{ event.title }}
          <br/>
        </ng-container>
      </mat-cell>
    </ng-container>
    <ng-container matColumnDef="actions">
      <mat-header-cell *matHeaderCellDef> Actions </mat-header-cell>
      <mat-cell *matCellDef="let item">
        <a [routerLink]="['../group', item.id ]" mat-raised-button color="accent">Edit</a>&nbsp;
        <button (click)="delete(item)" mat-button color="warn"><mat-icon>delete</mat-icon></button>
      </mat-cell>
    </ng-container>
    <mat-header-row *matHeaderRowDef="displayedColumns"></mat-header-row>
    <mat-row *matRowDef="let row; columns: displayedColumns;"></mat-row>
  </table>
</ng-template>
```
{% endraw %}

Create a `HomeComponent` to display a welcome message and a link to the groups page. This component will be the default route for the app.

```bash
ng g c home --standalone
```

Update `home.component.html` with the following:

```html
<a mat-button color="primary" href="/groups">Manage JUG Tour</a>
```

Change `app.component.html` to  remove the list of groups above `<router-outlet>`:

```html
<div class="content" role="main">
  <router-outlet></router-outlet>
</div>
```

And remove the groups fetching logic from `app.component.ts`:

```typescript
import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'JUG Tours';
}
```

Add a route for the `HomeComponent` and `GroupListComponent` to `app-routing.module.ts`:

```typescript
import { HomeComponent } from './home/home.component';
import { GroupListComponent } from './group-list/group-list.component';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  {
    path: 'home',
    component: HomeComponent
  },
  {
    path: 'groups',
    component: GroupListComponent
  }
];
```

Update the CSS in `styles.css` to have rules for the `breadcrumb` and `alert` classes:

```css
/* https://careydevelopment.us/blog/angular-how-to-add-breadcrumbs-to-your-ui */
ol.breadcrumb {
  padding: 0;
  list-style-type: none;
}

.breadcrumb-item + .active {
  color: inherit;
  font-weight: 500;
}

.breadcrumb-item {
  color: #3F51B5;
  font-size: 1rem;
  text-decoration: underline;
  cursor: pointer;
}

.breadcrumb-item + .breadcrumb-item {
  padding-left: 0.5rem;
}

.breadcrumb-item + .breadcrumb-item::before {
  display: inline-block;
  padding-right: 0.5rem;
  color: rgb(108, 117, 125);
  content: "/";
}

ol.breadcrumb li {
  list-style-type: none;
}

ol.breadcrumb li {
  list-style-type: none;
  display: inline
}

.alert {
  padding: 0.75rem 1.25rem;
  margin-bottom: 1rem;
  border: 1px solid transparent;
}

.alert-success {
  color: #155724;
  background-color: #d4edda;
  border-color: #c3e6cb;
}

.alert-error {
  color: #721c24;
  background-color: #f8d7da;
  border-color: #f5c6cb;
}
```

Run `npm start` in your `app` directory to see how everything looks. Click on Manage JUG Tour, and you should see a list of the default groups.

{% img blog/spring-boot-angular/group-list.png alt:"JUG Tours list" width:"800" %}{: .center-image }

To squish the **Actions** column to the right, add the following to `group-list.component.css`:

```css
.mat-column-actions {
  flex: 0 0 120px;
}
```

Your Angular app should update itself as you make changes.

{% img blog/spring-boot-angular/group-list-actions.png alt:"Group list with squished actions column" width:"800" %}{: .center-image }

It's great to see your Spring Boot API's data in your Angular app, but it's no fun if you can't modify it!

### Build an Angular `GroupEdit` component

Create a `group-edit` component and use Angular's `HttpClient` to fetch the group resource with the ID from the URL.

```shell
ng g c group-edit --standalone
```

Add a route for this component to `app-routing.module.ts`:

```typescript
import { GroupEditComponent } from './group-edit/group-edit.component';

export const routes: Routes = [
  ...
  {
    path: 'group/:id',
    component: GroupEditComponent
  }
];
````

Replace the code in `group-edit.component.ts` with the following:

```typescript
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map, of, switchMap } from 'rxjs';
import { Group } from '../model/group';
import { Event } from '../model/event';
import { HttpClient } from '@angular/common/http';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatIconModule } from '@angular/material/icon';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-group-edit',
  standalone: true,
  imports: [
    CommonModule, MatInputModule, FormsModule, MatButtonModule, RouterLink, 
    MatDatepickerModule, MatIconModule, MatNativeDateModule, MatTooltipModule
  ],
  templateUrl: './group-edit.component.html',
  styleUrls: ['./group-edit.component.css']
})
export class GroupEditComponent implements OnInit {
  group!: Group;
  feedback: any = {};

  constructor(private route: ActivatedRoute, private router: Router,
              private http: HttpClient) {
  }

  ngOnInit() {
    this.route.params.pipe(
      map(p => p['id']),
      switchMap(id => {
        if (id === 'new') {
          return of(new Group());
        }
        return this.http.get<Group>(`api/group/${id}`);
      })
    ).subscribe({
      next: group => {
        this.group = group;
        this.feedback = {};
      },
      error: () => {
        this.feedback = {type: 'warning', message: 'Error loading'};
      }
    });
  }

  save() {
    const id = this.group.id;
    const method = id ? 'put' : 'post';

    this.http[method]<Group>(`/api/group${id ? '/' + id : ''}`, this.group).subscribe({
      next: () => {
        this.feedback = {type: 'success', message: 'Save was successful!'};
        setTimeout(async () => {
          await this.router.navigate(['/groups']);
        }, 1000);
      },
      error: () => {
        this.feedback = {type: 'error', message: 'Error saving'};
      }
    });
  }

  async cancel() {
    await this.router.navigate(['/groups']);
  }

  addEvent() {
    this.group.events.push(new Event());
  }

  removeEvent(index: number) {
    this.group.events.splice(index, 1);
  }
}
```

Create a `model/event.ts` file so this component will compile.

```typescript
export class Event {
  id: number | null;
  date: Date | null;
  title: string;

  constructor(event: Partial<Event> = {}) {
    this.id = event?.id || null;
    this.date = event?.date || null;
    this.title = event?.title || '';
  }
}
```

Update `model/group.ts` to include the `Event` class.

```typescript
import { Event } from './event';

export class Group {
  id: number | null;
  name: string;
  events: Event[];

  constructor(group: Partial<Group> = {}) {
    this.id = group?.id || null;
    this.name = group?.name || '';
    this.events = group?.events || [];
  }
}
````

The `GroupEditComponent` needs to render a form, so update `group-edit.component.html` with the following:

{% raw %}
```html
<nav aria-label="breadcrumb">
  <ol class="breadcrumb">
    <li class="breadcrumb-item"><a routerLink="/">Home</a></li>
    <li class="breadcrumb-item"><a routerLink="/groups">Groups</a></li>
    <li class="breadcrumb-item active">Edit Group</li>
  </ol>
</nav>

<h2>Group Information</h2>
<div *ngIf="feedback.message" class="alert alert-{{feedback.type}}">{{ feedback.message }}</div>
<form *ngIf="group" #editForm="ngForm" (ngSubmit)="save()">
  <mat-form-field class="full-width" *ngIf="group.id">
    <mat-label>ID</mat-label>
    <input matInput [(ngModel)]="group.id" id="id" name="id" placeholder="ID" readonly>
  </mat-form-field>
  <mat-form-field class="full-width">
    <mat-label>Name</mat-label>
    <input matInput [(ngModel)]="group.name" id="name" name="name" placeholder="Name" required>
  </mat-form-field>
  <h3 *ngIf="group.events?.length">Events</h3>
  <div *ngFor="let event of group.events; index as i" class="full-width">
    <mat-form-field style="width: 35%">
      <mat-label>Date</mat-label>
      <input matInput [matDatepicker]="picker"
             [(ngModel)]="group.events[i].date" name="group.events[{{i}}].date" placeholder="Date">
      <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
      <mat-datepicker #picker></mat-datepicker>
    </mat-form-field>
    <mat-form-field style="width: 65%">
      <mat-label>Title</mat-label>
      <input matInput [(ngModel)]="group.events[i].title" name="group.events[{{i}}].title" placeholder="Title">
    </mat-form-field>
    <button mat-icon-button (click)="removeEvent(i)" aria-label="Remove Event"
            style="float: right; margin: -70px -5px 0 0">
      <mat-icon>delete</mat-icon>
    </button>
  </div>

  <div class="button-row" role="group">
    <button type="button" mat-mini-fab color="accent" (click)="addEvent()"
            aria-label="Add Event" *ngIf="group.id" matTooltip="Add Event"
            style="float: right; margin-top: -4px"><mat-icon>add</mat-icon></button>
    <button type="submit" mat-raised-button color="primary" [disabled]="!editForm.form.valid" id="save">Save</button>
    <button type="button" mat-button color="accent" (click)="cancel()" id="cancel">Cancel</button>
  </div>
</form>
```
{% endraw %}

If you look closely, you'll notice this component allows you to edit events for a group. This component is an excellent example of how to handle nested objects in Angular.

Update `group-edit.component.css` to make things look better on all devices:

```css
form, h2 {
  min-width: 150px;
  max-width: 700px;
  width: 100%;
  margin: 10px auto;
}

.alert {
  max-width: 660px;
  margin: 0 auto;
}

.full-width {
  width: 100%;
}
```

Now, with your Angular app running, you should be able to add and edit groups! Yaasss! 👏👏👏

{% img blog/spring-boot-angular/group-edit.png alt:"Edit a group and add events" width:"800" %}{: .center-image }

To make the navbar at the top use Angular Material colors, update `app.component.html` with the following:

{% raw %}
```html
<mat-toolbar role="banner" color="primary" class="toolbar">
  <img
    width="40"
    alt="Angular Logo"
    src="data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNTAgMjUwIj4KICAgIDxwYXRoIGZpbGw9IiNERDAwMzEiIGQ9Ik0xMjUgMzBMMzEuOSA2My4ybDE0LjIgMTIzLjFMMTI1IDIzMGw3OC45LTQzLjcgMTQuMi0xMjMuMXoiIC8+CiAgICA8cGF0aCBmaWxsPSIjQzMwMDJGIiBkPSJNMTI1IDMwdjIyLjItLjFWMjMwbDc4LjktNDMuNyAxNC4yLTEyMy4xTDEyNSAzMHoiIC8+CiAgICA8cGF0aCAgZmlsbD0iI0ZGRkZGRiIgZD0iTTEyNSA1Mi4xTDY2LjggMTgyLjZoMjEuN2wxMS43LTI5LjJoNDkuNGwxMS43IDI5LjJIMTgzTDEyNSA1Mi4xem0xNyA4My4zaC0zNGwxNy00MC45IDE3IDQwLjl6IiAvPgogIDwvc3ZnPg=="
  />
  <span>{{ title }}</span>
  <div class="spacer"></div>
  <a aria-label="OktaDev on Twitter" target="_blank" rel="noopener" href="https://twitter.com/oktadev" title="Twitter">
    <svg id="twitter-logo" height="24" data-name="Logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
      <rect width="400" height="400" fill="none"/>
      <path
        d="M153.62,301.59c94.34,0,145.94-78.16,145.94-145.94,0-2.22,0-4.43-.15-6.63A104.36,104.36,0,0,0,325,122.47a102.38,102.38,0,0,1-29.46,8.07,51.47,51.47,0,0,0,22.55-28.37,102.79,102.79,0,0,1-32.57,12.45,51.34,51.34,0,0,0-87.41,46.78A145.62,145.62,0,0,1,92.4,107.81a51.33,51.33,0,0,0,15.88,68.47A50.91,50.91,0,0,1,85,169.86c0,.21,0,.43,0,.65a51.31,51.31,0,0,0,41.15,50.28,51.21,51.21,0,0,1-23.16.88,51.35,51.35,0,0,0,47.92,35.62,102.92,102.92,0,0,1-63.7,22A104.41,104.41,0,0,1,75,278.55a145.21,145.21,0,0,0,78.62,23"
        fill="#fff"/>
    </svg>
  </a>
  <a aria-label="OktaDev on YouTube" target="_blank" rel="noopener" href="https://youtube.com/oktadev" title="YouTube">
    <svg id="youtube-logo" height="24" width="24" data-name="Logo" xmlns="http://www.w3.org/2000/svg"
         viewBox="0 0 24 24" fill="#fff">
      <path d="M0 0h24v24H0V0z" fill="none"/>
      <path
        d="M21.58 7.19c-.23-.86-.91-1.54-1.77-1.77C18.25 5 12 5 12 5s-6.25 0-7.81.42c-.86.23-1.54.91-1.77 1.77C2 8.75 2 12 2 12s0 3.25.42 4.81c.23.86.91 1.54 1.77 1.77C5.75 19 12 19 12 19s6.25 0 7.81-.42c.86-.23 1.54-.91 1.77-1.77C22 15.25 22 12 22 12s0-3.25-.42-4.81zM10 15V9l5.2 3-5.2 3z"/>
    </svg>
  </a>
</mat-toolbar>
```
{% endraw %}

Since this is not a standalone component, you must import `MatToolbarModule` in `app.module.ts`.

```typescript
import { MatToolbarModule } from '@angular/material/toolbar';

@NgModule({
  ...
  imports: [
    ...
    MatToolbarModule
  ],
  ...
})
export class AppModule { }
```

Make some adjustments in `app.component.css` to make the toolbar look nicer.

1. In the `.toolbar` rule, remove the `background-color` and `color` properties.
2. Change the margin for `#twitter-logo` and `#youtube-logo` to `10px 16px 0 0`.
3. Change the `.content` rule to have a margin of `65px auto 32px` and `align-items: stretch`.

Now the app fills the screen more, and the toolbar has matching colors.

{% img blog/spring-boot-angular/toolbar-colors.png alt:"Toolbar colors match" width:"800" %}{: .center-image }

## Secure Spring Boot with OpenID Connect and OAuth

I love building simple CRUD apps to learn a new tech stack, but I think it's even cooler to build a _secure_ one. So let's do that!

Spring Security added support for OpenID Connect (OIDC) in version 5.0, circa 2017. This is awesome because it means you can use Spring Security to secure your app with a third-party identity provider (IdP) like Auth0. This is a much better option than trying to build your own authentication system and store user credentials.

Add the Okta Spring Boot starter to do OIDC authentication in your `pom.xml`. This will also add Spring Security to your app.

```xml
<dependency>
    <groupId>com.okta.spring</groupId>
    <artifactId>okta-spring-boot-starter</artifactId>
    <version>3.0.3</version>
</dependency>
```

Install the [Auth0 CLI](https://github.com/auth0/auth0-cli) (if you haven't already) and run `auth0 login` in a shell.

Next, run `auth0 apps create` to register a new OIDC app with appropriate callbacks:

```shell
auth0 apps create \
  --name "Bootiful Angular" \
  --description "Spring Boot + Angular = ❤️" \
  --type regular \
  --callbacks http://localhost:8080/login/oauth2/code/okta,http://localhost:4200/login/oauth2/code/okta \
  --logout-urls http://localhost:8080,http://localhost:4200 \
  --reveal-secrets
```

Copy the returned values from this command into an `.okta.env` file:

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

Add `*.env` to your `.gitignore` file so you don't accidentally expose your client secret.

Then, run `source .okta.env` (or `.okta.env.bat` on Windows) to set these environment variables in your current shell.

Finally, run `./mvnw` (or `mvnw` on Windows) to start the app.

```shell
source .okta.env
./mvnw spring-boot:run
```

**TIP**: You might have to run `chmod +x mvnw` to execute the Maven wrapper script.

You can then open `http://localhost:8080` in your favorite browser. You'll be redirected to authenticate and returned afterward. You'll see a 404 error from Spring Boot since you have nothing mapped to the default `/` route.

{% img blog/spring-boot-angular/404.png alt:"Spring Boot 404" width:"800" %}{: .center-image }

### Configure Spring Security for maximum protection

To make Spring Security Angular-friendly, create a `SecurityConfiguration.java` file in `src/main/java/.../jugtours/config`. Create the `config` directory and put this class in it.

```java
package com.okta.developer.jugtours.config;

import com.okta.developer.jugtours.web.CookieCsrfFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.www.BasicAuthenticationFilter;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;

import static org.springframework.security.config.Customizer.withDefaults;

@Configuration
public class SecurityConfiguration {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.authorizeHttpRequests((authz) -> authz
                .requestMatchers("/", "/index.html", "*.ico", "*.css", "*.js", "/api/user").permitAll()
                .anyRequest().authenticated())
            .oauth2Login(withDefaults())
            .oauth2ResourceServer((oauth2) -> oauth2.jwt(withDefaults()))
            .csrf((csrf) -> csrf
                .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
                .csrfTokenRequestHandler(new CsrfTokenRequestAttributeHandler()))
            .addFilterAfter(new CookieCsrfFilter(), BasicAuthenticationFilter.class);

        return http.build();
    }
}
```

This class has a lot going on, so let me explain a few things. In previous versions of Spring Security, there was an `authorizeRequests()` lambda you could use to secure paths. Since Spring Security 3.1, it's deprecated, and you should use `authorizeHttpRequests()`. The `authorizeRequests()` lambda is permissive by default, which means any paths you don't specify will be allowed. The recommended way, shown here with `authorizeHttpRequests()`, denies by default. This means you have to specify the resources you want to allow Spring Security to serve up, as well as the ones that the Angular app has.

The `requestMatchers` line defines the URLs allowed for anonymous users. You will soon configure things so your Spring Boot app serves up your Angular app, hence the reason for allowing `/`, `/index.html`, and web files. You might also notice an exposed `/api/user` path.

Configuring CSRF (cross-site request forgery) protection with `CookieCsrfTokenRepository.withHttpOnlyFalse()` means that the `XSRF-TOKEN` cookie won't be marked HTTP-only, so Angular can read it and send it back when it tries to manipulate data. The `CsrfTokenRequestAttributeHandler` is no longer the default, so you have to configure it as the request handler. To learn more, you can read [this Stack Overflow answer](https://stackoverflow.com/a/74521360/65681). Basically, since we're not sending the CSRF token to an HTML page, we don't have to worry about BREACH attacks. This means we can revert to the previous default from Spring Security 5.

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
 * Spring Security 6 doesn't set an XSRF-TOKEN cookie by default.
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

Create `src/main/java/.../jugtours/web/UserController.java` and populate it with the following code. Angular will use this API to 1) find out if a user is authenticated and 2) perform global logout.

```java
package com.okta.developer.jugtours.web;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

import java.text.MessageFormat;

import static java.util.Map.of;

@RestController
public class UserController {
    private final ClientRegistration registration;

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
    public ResponseEntity<?> logout(HttpServletRequest request) {
        // send logout URL to client so they can initiate logout
        var issuerUri = registration.getProviderDetails().getIssuerUri();
        var originUrl = request.getHeader(HttpHeaders.ORIGIN);
        Object[] params = {issuerUri, registration.getClientId(), originUrl};
        // Yes! We @ Auth0 should have an end_session_endpoint in our OIDC metadata.
        // It's not included at the time of this writing, but will be coming soon!
        var logoutUrl = MessageFormat.format("{0}v2/logout?client_id={1}&returnTo={2}", params);
        request.getSession().invalidate();
        return ResponseEntity.ok().body(of("logoutUrl", logoutUrl));
    }
}
```

You'll also want to add user information when creating groups so that you can filter by your JUG tour. Add a `UserRepository.java` in the same directory as `GroupRepository.java`.

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
    private final GroupRepository groupRepository;
    private final UserRepository userRepository;

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

To highlight the changes, please review the `groups()` and `createGroup()` methods above. I think it's pretty slick that Spring JPA will create the `findAllByUserId()` method/query for you.

### Update Angular to handle CSRF and be identity-aware

I like Angular because it's a secure-first framework. It has built-in support for CSRF, and it's easy to make it identity-aware. Let's do both!

Angular's `HttpClient` supports the client-side half of the CSRF protection. It'll read the cookie sent by Spring Boot and return it in an `X-XSRF-TOKEN` header. You can read more about this at [Angular's Security docs](https://angular.io/guide/http#security-xsrf-protection).

### Update Your Angular app's authentication mechanism

Create a new `AuthService` class to communicate with your Spring Boot API for authentication information. Add the following code to a new file at `app/src/app/auth.service.ts`.

```typescript
import { Injectable } from '@angular/core';
import { Location } from '@angular/common';
import { BehaviorSubject, lastValueFrom, Observable } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { User } from './model/user';

const headers = new HttpHeaders().set('Accept', 'application/json');

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  $authenticationState = new BehaviorSubject<boolean>(false);

  constructor(private http: HttpClient, private location: Location) {
  }

  getUser(): Observable<User> {
    return this.http.get<User>('/api/user', {headers}, )
      .pipe(map((response: User) => {
          if (response !== null) {
            this.$authenticationState.next(true);
          }
          return response;
        })
      );
  }

  async isAuthenticated(): Promise<boolean> {
    const user = await lastValueFrom(this.getUser());
    return user !== null;
  }

  login(): void {
    location.href = `${location.origin}${this.location.prepareExternalUrl('oauth2/authorization/okta')}`;
  }

  logout(): void {
    this.http.post('/api/logout', {}, { withCredentials: true }).subscribe((response: any) => {
      location.href = response.logoutUrl;
    });
  }
}
```

Add the referenced `User` class to `app/src/app/model/user.ts`.

```typescript
export class User {
  email!: number;
  name!: string;
}
```

Modify `home.component.ts` to use `AuthService` to see if the user is logged in.

```typescript
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../auth.service';
import { User } from '../model/user';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, MatButtonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  isAuthenticated!: boolean;
  user!: User;

  constructor(public auth: AuthService) {
  }

  async ngOnInit() {
    this.isAuthenticated = await this.auth.isAuthenticated();
    await this.auth.getUser().subscribe(data => this.user = data);
  }

}
```

Modify `home.component.html` to show the Login button if the user is not logged in. Otherwise, show a Logout button.

```html
<div *ngIf="user; else login">
  <h2>Welcome, {{ user.name }}!</h2>
  <a mat-button color="primary" routerLink="/groups">Manage JUG Tour</a>
  <br/><br/>
  <button mat-raised-button color="primary" (click)="auth.logout()" id="logout">Logout</button>
</div>
<ng-template #login>
  <p>Please log in to manage your JUG Tour.</p>
  <button mat-raised-button color="primary" (click)="auth.login()" id="login">Login</button>
</ng-template>
```

Update `app/src/proxy.conf.js` to have additional proxy paths for `/oauth2` and `/login`.

```javascript
const PROXY_CONFIG = [
  {
    context: ['/api', '/oauth2', '/login'],
    ...
  }
]
````

After all these changes, you should be able to restart both Spring Boot and Angular and witness the glory of securely planning your very own JUG Tour!

{% img blog/spring-boot-angular/login.png alt:"Angular app with Login" width:"800" %}{: .center-image }
{% img blog/spring-boot-angular/logout.png alt:"Angular app with Logout" width:"800" %}{: .center-image }

## Configure Maven to package Angular with Spring Boot

To build and package your React app with Maven, you can use the [frontend-maven-plugin](https://github.com/eirslett/frontend-maven-plugin) and Maven's profiles to activate it. Add properties for versions and a `<profiles>` section to your `pom.xml`.

```xml
<properties>
    ...
    <frontend-maven-plugin.version>1.12.1</frontend-maven-plugin.version>
    <node.version>v18.16.0</node.version>
    <npm.version>9.6.5</npm.version>
</properties>

... 

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
                                        <directory>app/dist/app</directory>
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
                                <goal>npm</goal>
                            </goals>
                            <phase>test</phase>
                            <configuration>
                                <arguments>test -- --watch=false</arguments>
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

After adding this, you should be able to run `mvn spring-boot:run -Pprod` and see your app running at `http://localhost:8080`.

If you start at the root, everything will work fine since Angular will handle routing. However, if you refresh the page when you're at `http://localhost:8080/groups`, you'll get a 404 error since Spring Boot doesn't have a route for `/groups`. To fix this, add a `SpaWebFilter` that conditionally forwards to the Angular app.

```java
package com.okta.developer.jugtours.web;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

public class SpaWebFilter extends OncePerRequestFilter {

    /**
     * Forwards any unmapped paths (except those containing a period) to the client {@code index.html}.
     */
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, 
                                    FilterChain filterChain) throws ServletException, IOException {
        String path = request.getRequestURI();
        if (!path.startsWith("/api") &&
            !path.startsWith("/login") &&
            !path.startsWith("/oauth2") &&
            !path.contains(".") &&
            path.matches("/(.*)")) {
            request.getRequestDispatcher("/index.html").forward(request, response);
            return;
        }

        filterChain.doFilter(request, response);
    }
}
```

And add to your `SecurityConfiguration.java` class:

```java
.addFilterAfter(new SpaWebFilter(), BasicAuthenticationFilter.class);
```

Now, if you restart and reload the page, everything will work as expected. 🤩

## Verify everything works with Cypress

In this section, I was going to explain how to integrate Cypress into this project to support end-to-end tests. However, I discovered that its [schematic](https://www.npmjs.com/package/@cypress/schematic) doesn't work with Angular 16. That means when I tried to run `ng add @cypress/schematic`, it didn't work. The good news is I figured out a workaround. I downgraded the project to Angular 15, ran the schematic, and then upgraded to Angular 16.

I wouldn't recommend enduring this pain. If you're interested in adding Cypress, look at [this pull request](https://github.com/oktadev/auth0-spring-boot-angular-crud-example/pull/1) to see the changes required (in the **Files changed** tab). Add `.patch` to the end of the URL, download the file, and use it to update your project with Cypress end-to-end tests.

This patch will also update your Angular tests so `npm test` passes. It includes a new [`TestSecurityConfiguration`](https://github.com/oktadev/auth0-spring-boot-angular-crud-example/blob/e98479fc0cb31d59cf52f76e368583dea1545d1d/src/test/java/com/okta/developer/jugtours/TestSecurityConfiguration.java) class that makes it possible to run `mvn verify -Pprod` without having to set environment variables. It even includes a GitHub Actions workflow that runs the tests on every push.

If you added the Cypress tests, add environment variables with your credentials to the `.okta.env` (or `.okta.env.bat`) file you created earlier.

```shell
export CYPRESS_E2E_DOMAIN=<your-auth0-domain> # use the raw value, no https prefix
export CYPRESS_E2E_USERNAME=<your-email>
export CYPRESS_E2E_PASSWORD=<your-password>
```

Then, run `source .okta.env` (or `.okta.env.bat` on Windows) to set these environment variables and start the app.

```shell
mvn spring-boot:run -Pprod
```

In another terminal window, run the Cypress tests with Electron.

```shell
cd app
npx cypress run --browser electron --config baseUrl=http://localhost:8080
```

{% img blog/spring-boot-angular/cypress-run.png alt:"Cypress tests running in Electron" %}{: .center-image }

## Build something fabulous with Spring Boot and Angular!

I hope this tutorial has helped you learn how to build secure Angular and Spring Boot apps. Using OpenID Connect is a recommended practice for authenticating full-stack apps like this one, and Auth0 makes it easy to do. Adding CSRF protection and packaging your Spring Boot + Angular app as a single artifact is super cool too!

We've written some other fun Spring Boot, Angular, and JHipster tutorials. Check them out!

- [Build a Simple CRUD App with Spring Boot and Vue.js](https://auth0.com/blog/build-crud-spring-and-vue/)
- [Use React and Spring Boot to Build a Simple CRUD App](https://auth0.com/blog/simple-crud-react-and-spring-boot/)
- [Add OpenID Connect to Angular Apps Quickly](https://auth0.com/blog/add-oidc-to-angular-apps-quickly/)
- [Full Stack Java with React, Spring Boot, and JHipster](https://auth0.com/blog/full-stack-java-with-react-spring-boot-and-jhipster/)

I've also written a couple of InfoQ mini-books that you might find useful:

- [The JHipster Mini-Book](https://www.infoq.com/minibooks/jhipster-mini-book/): Shows how I built [21-Points Health](https://www.21-points.com) with JHipster (Angular, Spring Boot, Bootstrap, and more).
- [The Angular Mini-Book](https://www.infoq.com/minibooks/angular-mini-book/): A practical guide to Angular, Bootstrap, and Spring Boot with recommended security practices and several cloud deployment guides.

If you have any questions, please leave a comment below. If you want to see the completed code for this tutorial, check out its [GitHub repo](https://github.com/oktadev/auth0-spring-boot-angular-crud-example). Follow us on [Twitter](https://twitter.com/oktadev) and [YouTube](https://youtube.com/oktadev) for more content like this.
