---
layout: blog_post
title: ""
author:
by: advocate|contractor
communities: [devops,security,mobile,.net,java,javascript,go,php,python,ruby]
description: ""
tags: []
tweets:
- ""
- ""
- ""
image:
type: awareness|conversion
---

## Introduction

Supabase is an open-source Firebase alternative. It provides several critical functions for modern web applications such as Postgres databases, authentication, real-time subscriptions, and blob storage. The interface is very easy to use but is very feature-rich. Supabase also provides support for javascript via a client that is available via yarn or npm. Like the web platform, the client is very easy to use and integrate into any modern web application. Best of all it is free to get started with supabase and you can scale into a premium plan on demand.

In this article, you will learn how to build a wellness tracker app that will allow authenticated users to create new entries for specified days. These entries will be marked as public or private. Public entries will be visible to all visitors, however private entries are only available to authenticated users.

The application will be built with Vue.js using Tailwind to style the site. You will use Supabase to store the data used for the site. Finally, you will add Okta to secure the application.

## Prerequisites

- [Visual Studio 2022 v17.1 or later](https://code.visualstudio.com/)
- [A Supabase Account](https://app.supabase.com/)
- [Node.js version 15.0 or higher](https://nodejs.org/en/)
- [Okta CLI](https://cli.okta.com)
> [Okta](https://developer.okta.com/) has Authentication and User Management APIs that reduce development time with instant-on, scalable user infrastructure. Okta's intuitive API and expert support make it easy for developers to authenticate, manage, and secure users and roles in any application.

You can view the [code on github](https://github.com/nickolasfisher/OktaSupabase.git).

## Create your Okta Application

{% include setup/cli.md type="spa" framework="Vue"
   loginRedirectUri="http://localhost:3000/callback" signup="false" %}

Copy the output from the CLI and keep it for later.

## Set up your Supabase project

Go to your [Supabase account](https://app.supabase.com/) and click on **New Project**. Select your default organization (or create a new one). Name your project `OktaSupabase` and give it a strong password. Select the region closest to you and select the pricing plan that suits your needs best. Most likely this will be the `Free` plan but if you find a need to update to pro you can do that as well. Once you're done, click **Create Project**.

{% img blog/supabase-vue/supabase-create-project.png alt:"Create a project in Supabase" width:"600" %}{: .center-image }

Make note of your `Project API Keys` and `Project Configuration` in the `Connecting to your new project` section of the project page. Specifically, you will need the `anon` `public` API key and the `URL`.

### Create your table in Supabase

Now add a new table to your database. In Supabase there are two ways to do this. You can use the SQL editor or you can use the GUI Table editor. I opted to use the Table editor to see how powerful the UI was and how easy it was to use. Once you open the table editor you can click **Create a new table**. Give the table the name `Entries` and a description if you want.

Note that the `id` and `created_at` columns are prepopulated for you so you can skip these. Add the following columns to the table.

> description: text
> isPublic: bool
> date: timestamptz
> title: text

Make each column non-nullable.  By default Supabase, makes all columns nullable. Then click **Save**. After a moment you will see your table in the _Table editor_ section.

{% img blog/supabase-vue/supabase-create-table.png alt:"Create a table in supabase" width:"600" %}{: .center-image }

### Populate some sample data

Click on the table you just created in the table editor and click **Insert Row**. This will bring up an editor where you can add new data. I added 3 entries: two public and one private entry. Give your entries dates that are in your current month. For example, I'm writing this article in September 2022 so I used three dates in that month.

{% img blog/supabase-vue/supabase-add-row.png alt:"Add data to supabase" width:"600" %}{: .center-image }

After each row click save and you should see the data you complete populated in the Table editor.

## Create your Vue Application

It's now time to create your Vue application. Start by running the following command.

```sh
npm init vue@3.3.2 OktaSupabase
```

This will create a new Vue application called `OktaSupabase` in a subfolder on your working directory with the same name. There will be several options in this command such as the project name, TypeScript support, JSX support, and others. See the image below for the options I've chosen. If you want to use some of these options feel free to turn them on.

{% img blog/supabase-vue/vue-init-options.png alt:"Create your vue application" width:"600" %}{: .center-image }

### Install your dependencies

Now you can install the dependencies you need for this project.

> > Tanay : trying something a little different here. If its no good let me know.

#### @okta/okta-vue

```sh
npm i @okta/okta-vue@5.3.0
```

The [Okta Vue SDK](https://github.com/okta/okta-vue) makes authenticating and securing your application with Okta quick and easy.

#### @supabase/supabase-js

```sh
npm i @supabase/supabase-js@1.35.6
```

The [Supabase JavaScript client](https://github.com/supabase/supabase-js) provides all the functionality you will need to connect to your Supabase instance and interact with your database.

#### daisyui

```sh
npm i daisyui@2.24.0
```

[DaisyUI](https://daisyui.com/) is a tailwind component library that will help make your design work a little easier.

#### daisyui

```sh
npm i vue3-datepicker@0.3.4
```

[vue3-datepicker](https://github.com/icehaunter/vue3-datepicker) is a datepicker for Vue3.

### Add .env

Next, add a file called `.env` to your root directory with the following code.

```
VITE_SUPABASE_URL={yourSupabaseUrl}
VITE_SUPABASE_ANON_KEY={yourSupabaseAnonKey}
VITE_OKTA_DOMAIN={yourOktaDomain}
VITE_OKTA_CLIENTID={yourClientID}
```

These values are populated from the Okta CLI and the Supabase web interface.

### Setup Tailwind CSS

Next, you will need to install and initialize tailwinds as well as connect DaisyUI to it. Start by installing tailwinds and initializing it.

```sh
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Next, go to the file `src/tailwind.config.js` and replace the code there with the following.

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{vue,js,ts,jsx,tsx}"],
  theme: {
    extend: {},
  },
  plugins: [require("daisyui")],
};
```

This code will tell tailwinds to look in the file extensions provided to build its final CSS folder. Here you are also telling tailwinds to use `daisyui` as a plugin.

Next, open `src/assets/main.css` and replace the code there with the following.

```CSS
@import "./base.css";

@tailwind base;
@tailwind components;
@tailwind utilities;
```

This will complete the setup of tailwinds.

### Create the supabase client

To access your supabase project you will need to call `createClient` from the supabase client library that you installed earlier. Here you will build a small helper to create the client based on the configuration from your `.env` file.

Create a file in the `src` directory called `supabase.js` and add the following code.

```javascript
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://tfcejjhqlyrlocdrnfsj.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmY2VqamhxbHlybG9jZHJuZnNqIiwicm9sZSI6ImFub24iLCJpYXQiOjE2NjE0MzgwMTYsImV4cCI6MTk3NzAxNDAxNn0.X8FVYSOKlZoSVhm4-Q-d7FUEsMvQeHlvf2TzObvf2Ho";
//import.meta.env.VITE_SUPABASE_URL
//import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

This will make it a bit easier to obtain a supabase client from your views.

### Update boilerplate Vue code

Finally, you need to update the code Vue provided before moving forward.

#### Remove unneeded boilerplate

Delete all the files in the `components` directory. You can also delete the files found in the `views` directory.

#### Update package.json to specify your port

Next, open the `package.json` file and replace the `dev` command with the following code.

```sh
"dev": "vite --port 3000",
```

This will force your application to run on port 3000 which is the same port you set up your Login Callbacks for Okta.

#### Update main.js to set up Okta

You'll need to set up the `okta-vue` client to secure your routes and access auth states. Open `src/main.js` and replace the code there with the following.

```javascript
import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";

import { OktaAuth } from "@okta/okta-auth-js";
import OktaVue from "@okta/okta-vue";

import "./assets/main.css";

const { VITE_OKTA_DOMAIN, VITE_OKTA_CLIENTID } = import.meta.env;

console.log(VITE_OKTA_DOMAIN);

const oktaAuth = new OktaAuth({
  issuer: `${VITE_OKTA_DOMAIN}/oauth2/default`,
  clientId: VITE_OKTA_CLIENTID,
  redirectUri: window.location.origin + "/login/callback",
  scopes: ["openid", "profile", "email"],
});

const app = createApp(App);

app.use(router).use(OktaVue, { oktaAuth });

app.mount("#app");
```

This will initialize the `okta-vue` client for you.

#### Update the router code

Finally, open the `router/index.js` file and replace the code there with the following.

```javascript
import { createRouter, createWebHistory } from "vue-router";

import { LoginCallback, navigationGuard } from "@okta/okta-vue";

import HomeView from "../views/HomeView.vue";
import Overview from "../views/Overview.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: HomeView,
    },
    ,
    {
      path: "/login/callback",
      component: LoginCallback,
    },
    {
      path: "/overview",
      name: "overview",
      component: Overview,
      meta: {
        requiresAuth: true,
      },
    },
  ],
});

router.beforeEach(navigationGuard);

export default router;
```

This file defines the three routes needed for this application. First, using the `HomeView` page, you bind that to the root path. Next, you need to define a route for the `LoginCallback`. This is the route Okta will return the authentication response to. The `okta-vue` library will handle the callback for you. Finally, you have the `Overview` page. This page gets tagged as `requiresAuth` which means the `navigationGuard` from the `okta-vue` library will ensure the user is authenticated before allowing them to navigate to that page. if the user is unauthenticated the user will be presented with the Okta login screen.

### Create your components

You are ready to begin developing your components and pages. You'll start with the components as the pages will depend on them.

#### Create a header component

First, add a new file to the `components` folder called `Header.vue`. Add the following code to it.

```vue
<template>
  <div
    class="
      flex
      justify-between
      items-center
      border-b-2 border-gray-100
      py-6
      md:justify-start md:space-x-10
    "
  >
    <h2
      class="
        text-2xl
        font-bold
        leading-7
        text-gray-900
        sm:text-3xl sm:tracking-tight sm:truncate
      "
    >
      Supabase and Okta
    </h2>

    <div class="hidden md:flex items-center justify-end md:flex-1 lg:w-0">
      <button
        v-if="authState?.isAuthenticated"
        href="/overview"
        class="btn btn-outline"
        @click="this.$auth.signOut"
      >
        Logout
      </button>
      <a v-if="!authState?.isAuthenticated" href="/overview" class="btn">
        Login
      </a>
    </div>
  </div>
</template>
```

This component will present a Login or Logout button to the user depending on the current authentication state. You can determine this by using the Okta vue library to check the `authState`.

#### Create the calendar component and supporting components

Add a file to the `components` folder called `Calendar.vue` with the following code.

{% raw %}
```vue
<script setup>
import Day from './Day.vue'
import AddEntry from './AddEntry.vue'
import EntryDetail from './EntryDetail.vue'
import { supabase } from '../supabase'
</script>

<template>
  <div v-if="entries" class="">
    <div class="text-gray-700">
      <!-- Component Start -->
      <div class="flex flex-grow w-full h-screen overflow-auto">
        <div class="flex flex-col flex-grow">
          <div class="flex items-center mt-4">
            <div class="flex ml-6">
              <button @click="previousMonth()">
                <svg
                  class="w-6 h-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
              </button>
              <button @click="nextMonth()">
                <svg
                  class="w-6 h-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
            <h2 class="ml-2 text-xl font-bold leading-none">
              {{
                new Date(year, month, 1).toLocaleString('default', {
                  month: 'long',
                  year: 'numeric',
                })
              }}
            </h2>
          </div>
          <div class="grid grid-cols-7 mt-4">
            <div class="pl-1 text-sm">Sun</div>
            <div class="pl-1 text-sm">Mon</div>
            <div class="pl-1 text-sm">Tue</div>
            <div class="pl-1 text-sm">Wed</div>
            <div class="pl-1 text-sm">Thu</div>
            <div class="pl-1 text-sm">Fri</div>
            <div class="pl-1 text-sm">Sat</div>
          </div>
          <div
            class="
              grid
              flex-grow
              w-full
              h-auto
              grid-cols-7 grid-rows-5
              gap-px
              pt-px
              mt-1
              bg-gray-200
            "
          >
            <div v-for="n in firstWeekSkipDays" :key="n"></div>
            <Day
              v-for="n in numberOfDaysInMonth"
              :key="n"
              :date="new Date(year, month, n)"
              :onNewEntryClick="addEntry"
              :onEntryClick="showEntryDetail"
              :entries="
                entries.filter((r) => {
                  const d = new Date(r.date.replace(' ', 'T'))
                  return (
                    new Date(
                      d.getFullYear(),
                      d.getMonth(),
                      d.getDate()
                    ).getTime() === new Date(year, month, n).getTime()
                  )
                })
              "
            />
          </div>
        </div>
      </div>
      <!-- Component End  -->

      <div
        v-if="selectedEntry"
        id="entry-detail-modal"
        class="modal"
        :class="{ 'modal-open': showEntryDetailModal }"
      >
        <div class="modal-box w-11/12 max-w-5xl">
          <label
            @click="hideEntryDetail"
            for="entry-detail-modal"
            class="btn btn-sm btn-circle absolute right-2 top-2"
            >✕</label
          >
          <EntryDetail :entry="selectedEntry" />
        </div>
      </div>

      <div
        v-if="authState?.isAuthenticated && entryDate"
        id="add-entry-modal"
        class="modal"
        :class="{ 'modal-open': showModal }"
      >
        <div class="modal-box w-11/12 max-w-5xl">
          <label
            @click="endAddEntry"
            for="add-entry-modal"
            class="btn btn-sm btn-circle absolute right-2 top-2"
            >✕</label
          >
          <AddEntry
            :date="entryDate"
            :onSaved="saveEntry"
            :onCancelled="endAddEntry"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      month: parseInt(this.initialMonth),
      year: parseInt(this.initialYear),
      numberOfDaysInMonth: 0,
      showModal: false,
      entryDate: undefined,
      entries: [],
      showEntryDetailModal: false,
      selectedEntry: undefined,
    }
  },
  computed: {
    numberOfDaysInMonth() {
      return new Date(this.year, this.month + 1, 0).getDate()
    },
    firstWeekSkipDays() {
      return new Date(this.year, this.month, 1).getDay()
    },
  },
  async mounted() {
    await this.getEntries()
  },
  methods: {
    async getEntries() {
      const startdate = new Date(this.year, this.month, 1)
      const endDate = new Date(this.year, this.month + 1, 1)

      const query = supabase
        .from('Entries')
        .select()
        .gte('date', startdate.toLocaleString())
        .lt('date', endDate.toLocaleString())

      if (!this.authState?.isAuthenticated) {
        query.eq('isPublic', true)
      }
      const { data, error } = await query
      this.entries = data
    },
    async previousMonth() {
      this.year = this.month === 0 ? this.year - 1 : this.year
      this.month = (((this.month - 1) % 12) + 12) % 12

      await this.getEntries()
    },
    async nextMonth() {
      this.year = this.month === 11 ? this.year + 1 : this.year
      this.month = (this.month + 1) % 12

      await this.getEntries()
    },
    addEntry(date) {
      this.entryDate = date
      this.showModal = true
    },
    async saveEntry(entry) {
      const { data, error } = await supabase.from('Entries').upsert(entry)

      if (data) {
        this.entries.push(data[0])
      }

      this.endAddEntry()
    },
    endAddEntry() {
      this.entryDate = undefined
      this.showModal = false
    },
    showEntryDetail(entryId) {
      this.selectedEntry = this.entries.filter((r) => r.id === entryId)[0]
      this.showEntryDetailModal = true
    },
    hideEntryDetail() {
      this.showEntryDetailModal = false
      this.selectedEntry = undefined
    },
  },
  props: {
    initialMonth: Number,
    initialYear: Number,
  },
}
</script>
```
{% endraw %}

This component displays a calendar vue for any entries. It defaults to the current month but the user can move back and forth in time to change the month. The calendar also has the responsibility of populating its data. This means you will import the supabase client you created earlier and use it to fetch the data from your supabase project.

The component will check if the user is authenticated before querying the data. If the user is authenticated the component will request all entries, however, if they are not then it will only request public entries.

The `calander` will also contain the component for displaying detail about an entry for a given day.

This component also has the responsibility of displaying a modal for the `AddEntry` component. You can create this component now by adding a new file to the `components` folder called `AddEntry.vue`.

```vue
<template>
  <div>
    <div class="md:grid">
      <div class="mt-5 md:mt-0 md:col-span-2">
        <h4 class="h2">Add a new entry</h4>

        <form method="POST">
          <div class="shadow sm:rounded-md sm:overflow-hidden">
            <div class="px-4 py-5 bg-white space-y-6 sm:p-6">
              <div class="grid grid-cols-3 gap-6">
                <div class="col-span-3">
                  <label for="date" class="label"> Date </label>
                  <datepicker
                    class="w-full input input-md input-bordered"
                    v-model="entry.date"
                    :clearable="false"
                  />
                </div>
                <div class="col-span-1">
                  <label class="label cursor-pointer">
                    <span>Public?</span>
                    <input
                      v-model="entry.isPublic"
                      type="checkbox"
                      checked="checked"
                      class="checkbox"
                    />
                  </label>
                </div>
              </div>

              <div>
                <label for="description" class="label"> Title </label>
                <div class="mt-1">
                  <input
                    type="text"
                    id="title"
                    name="title"
                    v-model="entry.title"
                    class="input input-md input-bordered w-full"
                  />
                </div>
                <p class="mt-2 text-sm text-gray-500">Title of the entry</p>
              </div>

              <div>
                <label for="description" class="label"> Description </label>
                <div class="mt-1">
                  <textarea
                    name="description"
                    rows="8"
                    class="input input-md input-bordered w-full h-full"
                    v-model="entry.description"
                  />
                </div>
                <p class="mt-2 text-sm text-gray-500">
                  Brief description about the entry
                </p>
              </div>
            </div>
            <div class="px-4 py-3 bg-gray-50 text-right sm:px-6">
              <button class="btn" @click="save">Save</button>
            </div>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import Datepicker from 'vue3-datepicker'
</script>

<script>
export default {
  data() {
    return {
      entry: {
        date: undefined,
        isPublic: false,
        description: '',
        title: ''
      },
    }
  },
  mounted() {
    console.log(this.date)
    this.entry.date = this.date
    console.log(this.entry)
  },
  methods: {
    save(e) {
      e.preventDefault()
      this.onSaved(this.entry)
    },
    cancel() {
      this.onCancelled()
    },
  },
  props: {
    date: Date,
    onSaved: Function,
    onCancelled: Function,
  },
}
</script>
```

This component takes the date from the calendar component that was selected and prepopulates a datepicker with that date. Then it allows the user to set the properties of the entry here. The user then can click save and then you can use the supabase client you created earlier to save the entry.

Finally, you'll need to implement the `Day` component. Add a file called `Day.vue` to the components folder and add the following code.

```vue
<template>
  <div class="relative flex flex-col bg-white group">
    <span class="mx-2 my-1 text-xs font-bold"> {{ date.getDate() }} </span>
    <div class="flex flex-col px-1 py-1 overflow-auto">
      <button
        v-for="entry in entries"
        :key="entries.indexOf(entry)"
        class="
          flex
          items-center
          flex-shrink-0
          h-5
          px-1
          text-xs
          hover:bg-gray-200
        "
      >
        <span
          class="flex-shrink-0 w-2 h-2 border border-gray-500 rounded-full"
        ></span>
        <span class="ml-2 font-medium leading-none truncate">{{
          entry.title
        }}</span>
      </button>
    </div>

    <div v-if="authState.isAuthenticated">
      <button
        class="
          absolute
          bottom-0
          right-0
          flex
          items-center
          justify-center
          hidden
          w-6
          h-6
          mb-2
          mr-2
          text-white
          bg-gray-400
          rounded
          group-hover:flex
          hover:bg-gray-500
        "
        @click="add()"
      >
        <svg
          class="w-5 h-5 w-6 h-6 plus"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fill-rule="evenodd"
            d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
            clip-rule="evenodd"
          ></path>
        </svg>
      </button>
    </div>
  </div>
</template>

<script>
export default {
  data() {},
  methods: {
    entryClick(entryId) {
      this.onEntryClick(entryId);
    },
    add() {
      this.onNewEntryClick(this.date);
    },
  },
  props: {
    date: Date,
    entries: Array,
    onNewEntryClick: Function,
  },
};
</script>
```

The `Day` component displays the entries for a given day and allows the user to either add a new entry or view the detail for an entry on that day.

In order to display the detail you'll need an `EntryDetail` component. Add `EntryDetail.vue` to the `components` folder with the following code.

{% raw %}
```vue
<template>
  <div class="bg-white shadow overflow-hidden sm:rounded-lg">
    <div class="px-4 py-5 sm:px-6">
      <h3 class="text-lg leading-6 font-medium text-gray-900">
        {{
          new Date(Date.parse(entry.date)).toLocaleString("default", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })
        }}
      </h3>
      <p class="mt-1 max-w-2xl text-sm text-gray-500">
        {{ entry.title }}
      </p>
    </div>
    <div class="border-t border-gray-200">
      <dl>
        <div
          class="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6"
        >
          <dt class="text-sm font-medium text-gray-500">
            {{ entry.IsPublic ? "Public" : "Private" }}
          </dt>
          <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
            {{ entry.description }}
          </dd>
        </div>
      </dl>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    entry: Object,
  },
};
</script>
```
{% endraw %}

This component just shows the detail of the entry in a clear way. The calendar above will display it in a modal when it's clicked.

### Create your pages

Now that your components are written you can bring them together into pages. These pages will correspond to the routes you defined earlier in the `routes` folder.

#### Home Screen page

Add a file to the `views` folder called `HomeView.vue`. Add the following code to it.

```vue
<script setup>
import Calendar from "../components/Calendar.vue";
</script>

<template>
  <main>
    <div class="hero bg-base-200">
      <div class="hero-content text-center">
        <div class="max-w-xl">
          <h1 class="text-5xl font-bold">Supabase and Okta</h1>
          <p class="pt-6">
            A small wellness application using <a href="#"> Supabase</a> for
            data. Secured by <a href="#">Okta.</a>
          </p>
          <p class="pb-6">
            To view private entries or create a new one please Login below.
          </p>
          <button class="btn btn-primary">Login</button>
        </div>
      </div>
    </div>

    <Calendar
      :initialMonth="new Date().getMonth()"
      :initialYear="new Date().getFullYear()"
    />
  </main>
</template>
```

This page will display the `calendar` component along with some information about the application itself. The page delegates the responsibility of determining the data to be fetched from Supabase to the `calendar` component. That means that if the user is authenticated they will see the public and private entries. You could change this by passing a property to the calendar such as `requestPrivateIfAvailable: false` that would only request public entries for this page if you wish. You would then need to adjust the calendar component to check that variable along with the `authState` when requesting the data.

#### Overview

Next, you can add a new page for `Overview.vue`.

```vue
<script setup>
import Calendar from '../components/Calendar.vue'
</script>


<template>
  <main>
    Hello {{ name }}:

    <Calendar
      :initialMonth="new Date().getMonth()"
      :initialYear="new Date().getFullYear()"
    />
  </main>
</template>


<script>
export default {
  data() {
    return {
      name: '',
    }
  },
  methods: {},
  async mounted() {
    const resp = await this.$auth.token.getUserInfo()
    this.name = resp.name;
  },
}
</script>
```

This page is similar to the Home page but it includes information welcoming the user by name after they've logged in with Okta.

## Test your application

Start your application by running the command `npm run dev` and navigating to `localhost:3000`.  You should be greeted with a calendar view displaying only the public entries you added.

{% img blog/supabase-vue/home-page.png alt:"The home page of the website" width:"600" %}{: .center-image }

Click on the **Login** button and use your Okta account to log in.  After you land on the `Overview` page you should be able to see the private entries along with the ability to add new entries.  Click on the **+** on any day and add a new entry.  Click save and the entry should be added to your calendar.

{% img blog/supabase-vue/add-new-entry.png alt:"add and entry to your database using the web interface" width:"600" %}{: .center-image }

## Conclusions

Supabase is a great way to quickly build applications at scale. In this article you learned how to create a Postgres database with Supabase's free plan and populate some sample data with it. You then learned how to query that data using the Supabase javascript client. Finally, you learned how to secure the application with Okta using Okta's Vue client.

Supabase offers other solutions such as blob storage and edge functions which we did not cover in this article but I encourage you to check those out as well. Supabase also offers client libraries for Python and Dart. The platform is very easy to use and very robust.

Supabase also offers IDP for many leading providers however I would like to see support for Okta or at very least generic OAuth clients.

## Learn more about Vue

[Build a Simple CRUD App with Spring Boot and Vue.js](https://developer.okta.com/blog/2022/08/19/build-crud-spring-and-vue)

[Vue Login and Access Control the Easy Way](https://developer.okta.com/blog/2020/05/15/vue-login)

[Simplify Building Vue Applications with NuxtJS](https://developer.okta.com/blog/2022/01/24/vue-applications-nuxt)