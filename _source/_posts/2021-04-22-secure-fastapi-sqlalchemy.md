---
layout: blog_post
title: "Use Okta + Oso to Secure a FastAPI + SQLAlchemy App"
author: sam-scott
by: external-contributor
communities: [python]
description: ""
tags: []
tweets:
- ""
- ""
- ""
image:
type: conversion
---


[FastAPI][] is really fast, and [SQLAlchemy][] is really... SQL-y, but what
good is a fast and SQL-y application if it isn't 🔒**secure**🔒?

In this post, I'm going to show you how to secure a fast and SQL-y app.

First you will need some _authentication_, which is how to identify
**who** the user is. We'll use Okta for this process, which is a service
for managing the users, checking username and password, enabling two-factor,
things like that.

Next, you'll want to perform _authorization_, which controls **what** the
user can do in our application. We'll be using [Oso][] for that, which is a
batteries-included library for authorization.

**Table of Contents**{: .hide }
* Table of Contents
{:toc}

This post is aimed at people with some familiarity with FastAPI and SQLAlchemy.
By the end, you'll be able to make sure users have access to the things they
need - and only the things they need.

The full example is available in the [fastapi-sqlalchemy-okta-oso-example repo on GitHub][github-repo]. Clone the repo and follow along!

```
https://github.com/osohq/fastapi-sqlalchemy-okta-oso-example.git
cd fastapi-sqlalchemy-okta-oso-example
```

## Bear Management Service Architecture

What, you expected TodoMVC?

Our app allows authenticated users to register their own bears and view the
bear population at large. It consists of two separate services: a front end
through which users authenticate with Okta, and a back end that exposes an
extensive API for creating and retrieving bears.

## Set Up an OIDC App on Okta

{% include setup/cli.md type="spa" loginRedirectUri="http://localhost:8080/login/callback" logoutRedirectUri="http://localhost:8080" %}

Create a file named `.env` in the `okta-hosted-login` directory, and add the following two lines:

```ini
CLIENT_ID={yourClientId}
ISSUER=https://{yourOktaDomain}/oauth2/default
```

## Start the React Front End

Still in the `okta-hosted-login` directory, run `npm install` to install
dependencies and then `npm start` to fire up the React front end.

Once the app is up and running, navigate to `http://localhost:8080` in your browser.
Click the `Login` button and enter your Okta credentials when prompted.
Successfully signing in should redirect you back to your front end, where
you'll be greeted with your name (courtesy of Okta), a 'Create a new bear'
form, and a list of bears.

The list will be empty because our back end service isn't running, so let's
change that.

## Start the FastAPI Backend

While the React app hums happily in the background, `cd` back to the project's
root directory. In the root directory, create a second `.env` file, and add the
following three lines:

```ini
CLIENT_ID={yourClientID}
ISSUER=https://{yourOktaDomain}/oauth2/default
AUDIENCE=api://default
```

Notice that the first two lines are identical to the front end's `.env` file,
and you may copy your Client ID and Okta domain from there.

Once the `.env` file is complete, create and activate a new virtual
environment, and then install dependencies:

```shell
python3 -m venv venv && . venv/bin/activate
pip install -r requirements.txt
```

Finally, start the FastAPI server:

```shell
uvicorn app.main:app --reload --reload-dir=app
```

If you reload `http://localhost:8080`, you should see the list of bears populated
with a number of very good bears owned by various members of Example.com, Inc.

Go ahead and create a few new bears of your own.

Our app is now open for business... _too_ open. Every authenticated user can
see everyone's bears — even users who have been banned for trying to create
koalas. It's time to put a stop to the madness.

## ABAC, as easy as 1-2-3 🕺

**Oso** ("authorization" in Spanish) is an [open source][osohq/oso]
authorization system that you'll use to secure our app. Oso is flexible enough
to support [any access control pattern your heart desires][patterns], but for
this example I'll focus on attribute-based access control (ABAC).

ABAC is all about writing who can do what by comparing the attributes
of the user and the thing they are trying to access.

### The Bear Necessities

First, you'll need to install the `oso` and `sqlalchemy-oso` packages:

```shell
pip install oso==0.10 sqlalchemy-oso==0.4
pip freeze > requirements.txt
```

Once pip finishes pipping, open up `app/main.py`, import Oso, and initialize
it:

```diff
diff --git a/app/main.py b/app/main.py
index 397037e..7dd57d0 100644
--- a/app/main.py
+++ b/app/main.py
@@ -6,4 +6,5 @@ from okta_jwt.jwt import validate_token
 from sqlalchemy.orm import Session, sessionmaker
 from starlette.config import Config
+from oso import Oso

 from app.crud import create_bear, get_or_create_user_by_email, list_bears
@@ -17,4 +18,7 @@ conf = Config(".env")
 issuer, audience, client_id = conf("ISSUER"), conf("AUDIENCE"), conf("CLIENT_ID")

+# Initialize Oso.
+oso = Oso()
+

 def get_db():
```

Next, create an empty Oso policy file in the `app` directory:

```shell
touch app/policy.polar
```

This is where you are going to write all of our authorization logic,
using Oso's declarative policy language called Polar.

Load it into our new Oso instance in `app/main.py`:

```diff
diff --git a/app/main.py b/app/main.py
index 7dd57d0..a1e166f 100644
--- a/app/main.py
+++ b/app/main.py
@@ -20,4 +20,5 @@ issuer, audience, client_id = conf("ISSUER"), conf("AUDIENCE"), conf("CLIENT_ID"
 # Initialize Oso.
 oso = Oso()
+oso.load_file("app/policy.polar")
```

Before you start filling that policy file with authorization rules, you need to
register the application data types that you're going to use in our authorization
policy with Oso.

We're going to use the `register_models()` helper from the `sqlalchemy-oso`
library to register our SQLAlchemy models in bulk. `register_models()`
registers all descendants of a SQLAlchemy base class with Oso, a nice shortcut
to avoid calling `oso.register_class()` on each individual class:

```diff
diff --git a/app/main.py b/app/main.py
index a1e166f..796ab1e 100644
--- a/app/main.py
+++ b/app/main.py
@@ -7,7 +7,8 @@ from sqlalchemy.orm import Session, sessionmaker
 from starlette.config import Config
 from oso import Oso
+from sqlalchemy_oso import register_models

 from app.crud import create_bear, get_or_create_user_by_email, list_bears
-from app.db import engine, setup_db
+from app.db import engine, setup_db, Base
 from app.models import User
 from app.schemas import Bear, BearBase
@@ -20,4 +21,5 @@ issuer, audience, client_id = conf("ISSUER"), conf("AUDIENCE"), conf("CLIENT_ID"
 # Initialize Oso.
 oso = Oso()
+register_models(oso, Base)
 oso.load_file("app/policy.polar")
```

In addition, register the `BearBase` Pydantic model that's used in the
`create()` handler:

```diff
diff --git a/app/main.py b/app/main.py
index adfc2c8..f2a17d0 100644
--- a/app/main.py
+++ b/app/main.py
@@ -23,2 +23,3 @@ oso = Oso()
 register_models(oso, Base)
+oso.register_class(BearBase)
 oso.load_file("app/policy.polar")
```

Finally, enforce authorization in the `create()` handler so that those
fanatics from down under stop trying to sully our ursine heaven with koalas:

```diff
diff --git a/app/main.py b/app/main.py
index 796ab1e..adfc2c8 100644
--- a/app/main.py
+++ b/app/main.py
@@ -74,3 +74,5 @@ def index(db: Session = Depends(get_db)):
 @app.post("/bears", response_model=Bear)
 def create(request: Request, bear: BearBase, db: Session = Depends(get_db)):
+    if not oso.is_allowed(request.state.user, "create", bear):
+        raise HTTPException(403)
     return create_bear(db, bear, request.state.user)
```

If you save `app/main.py` and then try to create a new bear, the `POST` request
will return a `403 Forbidden`. Oso is deny-by-default, and you currently have an
empty policy file. In the next section, you'll write your first authorization
rule to allow real bear lovers to create real bears.

### Your First `allow()` Rule

Open up `app/policy.polar` and add the following rule:

```polar
allow(user: User, "create", _bear: BearBase) if
    not user.is_banned;
```

This rule allows a user to create a bear if the user is not banned.

The rule works by matching against the inputs provided from the application:

- `user` - an instance of the `User` class
- The action is the string literal "create"
- `_bear` - an instance of the `BearBase` class

And you are checking that the `is_banned` field is false on the `user`.
You don't yet need to check anything further about the `bear` resource,
so prefix it with an underscore to tell Oso this input is not used.

**NOTE:** To learn more about the syntax of Oso rules, head on over to [the Writing
Policies guide][learn/policies] in [the Oso documentation][docs.osohq.com].

Save the file, flip back to `http://localhost:8080`, and you should once again be
able to create new bears (assuming you haven't set your own user's `is_banned`
property to `True`). All law-abiding bear enthusiasts have had their access
restored, and the koala lovers are left out in the cold. (Does it get cold in
Australia? We'll investigate in a future blog.)

### Deal with List Endpoints

`oso.is_allowed()` worked perfectly for securing the `create()` endpoint, but
it's not the best tool for the job when it comes to securing `index()`. The
difference is that `create()` operates over a single record while `index()`
operates over a potentially very large collection. If performance weren't an
issue, you could load the collection from the database and iterate over it,
calling `oso.is_allowed()` on every record to filter out unauthorized entries.
However, we all know that Zoomers lose interest and click away from your
website if it takes longer than a few Planck time units to load, so you need a
better solution.

And now, presenting... a better solution. Data filtering! The cure to all of
life's performance issues.

The `sqlalchemy-oso` library is built on top of Oso's data filtering feature.
In a nutshell, the logic engine at the core of the Oso library can turn your
authorization policy into a set of constraints similar to the `WHERE` clauses
used to filter records when querying a relational database. The
`sqlalchemy-oso` library then applies those constraints directly to your app's
SQLAlchemy queries. In this way, only authorized records are loaded from the
database in an efficient database operation instead of loading all records and
then iterating over the collection to determine the authorized subset.

Without further ado, wire up our app so that you can efficiently filter
some bears.

First, you need to import `authorized_sessionmaker()` from the `sqlalchemy-oso`
library:

```diff
diff --git a/app/main.py b/app/main.py
index f2a17d0..1fa9573 100644
--- a/app/main.py
+++ b/app/main.py
@@ -9 +9 @@ from oso import Oso
-from sqlalchemy_oso import register_models
+from sqlalchemy_oso import register_models, authorized_sessionmaker
```

Next, you'll create a new [FastAPI dependable][] that mirrors our existing
`get_db()` function but yields an Oso [AuthorizedSession][] instead of a
regular SQLAlchemy [Session][]:

```diff
diff --git a/app/main.py b/app/main.py
index f2a17d0..1fa9573 100644
--- a/app/main.py
+++ b/app/main.py
@@ -54,0 +55,11 @@ def current_user(
+def get_authorized_db(request: Request):
+    get_oso = lambda: oso
+    get_user = lambda: request.state.user
+    get_action = lambda: request.scope["endpoint"].__name__
+    db = authorized_sessionmaker(get_oso, get_user, get_action, bind=engine)()
+    try:
+        yield db
+    finally:
+        db.close()
+
+
```

And finally, update the `index()` handler so that it depends on our new
`get_authorized_db()` dependable:

```diff
diff --git a/app/main.py b/app/main.py
index f2a17d0..1fa9573 100644
--- a/app/main.py
+++ b/app/main.py
@@ -71 +82 @@ app.add_middleware(
-def index(db: Session = Depends(get_db)):
+def index(db: Session = Depends(get_authorized_db)):
```

Save the file, reload `http://localhost:8080`, and... no bears. They're still happily
growling away in the database, but you haven't added any Oso rules permitting
access. Let's change that.

### Flesh Out Your Authorization Policy

To start off, add a rule to `app/policy.polar` that permits all users to
list all bears:

```polar
allow(_: User, "index", _: Bear);
```

Save the file, reload `http://localhost:8080`, and you should see every bear again.
But something else is missing... the `Owner` column is empty! When you serialize
bear records in the back end, you include each bear's owner's email — a piece of
data that comes from our SQLAlchemy-backed `User` model. Since `User` is a
subclass of the `Base` SQLAlchemy class you registered via `sqlalchemy-oso`'s
`register_models()` method, access to `User` data is now protected by Oso.
Let's add one more blanket `allow()` rule, this time permitting users to view
user data at the `index()` endpoint:

```polar
allow(_: User, "index", _: User);
```

Do the save-and-reload dance, and the `Owner` column should once again be
populated.

Next, add some constraints to our `"index"` rule for bears so you can see
*Data Filtering in Action* (coming soon from Manning, probably).

Perhaps users should only be allowed to see their own bears:

```diff
diff --git a/app/policy.polar b/app/policy.polar
index ff90780..0a1a77d 100644
--- a/app/policy.polar
+++ b/app/policy.polar
@@ -6 +6,2 @@ allow(_: User, "index", _: User);
-allow(_: User, "index", _: Bear);
+allow(user: User, "index", bear: Bear) if
+    bear.owner = user;
```

Save, reload, and confirm you now cannot see anyone else's bears. You'll
need to create some for yourself if you want to see some.

The index view is now nice and private, but it feels _wrong_ to prevent our
fellow bear enthusiasts from viewing polar bears, the sweetest and most
mild-mannered of all bears. To right that wrong, you can register the `Species`
enum as a constant so that you can reference it in our policy...

```diff
diff --git a/app/main.py b/app/main.py
index 1fa9573..6abb06d 100644
--- a/app/main.py
+++ b/app/main.py
@@ -13 +13 @@ from app.db import engine, setup_db, Base
-from app.models import User
+from app.models import User, Species
@@ -24,0 +25 @@ oso.register_class(BearBase)
+oso.register_constant(Species, "Species")
```

...and then update said policy:

```diff
diff --git a/app/policy.polar b/app/policy.polar
index f5bc0a5..2883949 100644
--- a/app/policy.polar
+++ b/app/policy.polar
@@ -6,2 +6,3 @@ allow(_: User, "index", _: User);
 allow(user: User, "index", bear: Bear) if
-    bear.owner = user;
+    bear.owner = user or
+    bear.species = Species.polar;
```

Shucks, who doesn't like pandas or bears named "Smokey":

```diff
diff --git a/app/policy.polar b/app/policy.polar
index 2883949..b458ddc 100644
--- a/app/policy.polar
+++ b/app/policy.polar
@@ -6,3 +6,4 @@ allow(_: User, "index", _: User);
 allow(user: User, "index", bear: Bear) if
     bear.owner = user or
-    bear.species = Species.polar;
+    bear.species in [Species.panda, Species.polar] or
+    bear.name = "Smokey";
```

Well, that's about enough 'ursine around for one blog. Let's take stock and
wrap up.

## Final Diff After Securing the App with Oso

```diff
diff --git a/app/main.py b/app/main.py
index 397037e..6abb06d 100644
--- a/app/main.py
+++ b/app/main.py
@@ -7,13 +7,22 @@ from sqlalchemy.orm import Session, sessionmaker
 from starlette.config import Config
+from oso import Oso
+from sqlalchemy_oso import register_models, authorized_sessionmaker

 from app.crud import create_bear, get_or_create_user_by_email, list_bears
-from app.db import engine, setup_db
-from app.models import User
+from app.db import engine, setup_db, Base
+from app.models import User, Species
 from app.schemas import Bear, BearBase
 from app.seed import seed_db

 # Load environment variables.
 conf = Config(".env")
 issuer, audience, client_id = conf("ISSUER"), conf("AUDIENCE"), conf("CLIENT_ID")

+# Initialize Oso.
+oso = Oso()
+register_models(oso, Base)
+oso.register_class(BearBase)
+oso.register_constant(Species, "Species")
+oso.load_file("app/policy.polar")
+

@@ -46,2 +55,13 @@ def current_user(

+def get_authorized_db(request: Request):
+    get_oso = lambda: oso
+    get_user = lambda: request.state.user
+    get_action = lambda: request.scope["endpoint"].__name__
+    db = authorized_sessionmaker(get_oso, get_user, get_action, bind=engine)()
+    try:
+        yield db
+    finally:
+        db.close()
+
+
 # Reset and seed database.
@@ -62,8 +82,10 @@ app.add_middleware(
 @app.get("/bears", response_model=List[Bear])
-def index(db: Session = Depends(get_db)):
+def index(db: Session = Depends(get_authorized_db)):
     return list_bears(db)


 @app.post("/bears", response_model=Bear)
 def create(request: Request, bear: BearBase, db: Session = Depends(get_db)):
+    if not oso.is_allowed(request.state.user, "create", bear):
+        raise HTTPException(403)
     return create_bear(db, bear, request.state.user)
diff --git a/app/policy.polar b/app/policy.polar
new file mode 100644
index 0000000..b458ddc
--- /dev/null
+++ b/app/policy.polar
@@ -0,0 +1,9 @@
+allow(user: User, "create", _: BearBase) if
+    not user.is_banned;
+
+allow(_: User, "index", _: User);
+
+allow(user: User, "index", bear: Bear) if
+    bear.owner = user or
+    bear.species in [Species.panda, Species.polar] or
+    bear.name = "Smokey";
```

## Learn More about FastAPI and Python

You started out with a very fast and SQL-y application built on FastAPI and
SQLAlchemy. You created and configured a new Okta application to handle identity
management and authentication for our app. Then you used Oso to add efficient,
fine-grained authorization to your back end API.

The full example is available on [GitHub][github-repo].

If you're up for it, here are a couple exercises for you, dear reader:

- Add roles to the app using `sqlalchemy-oso`'s [built-in roles][] feature.
  Perhaps every bear lives in a sanctuary, and a user can have a particular
  role in each sanctuary, e.g., "Visitor", "Friend", or "Shepherd".
- Add a "Delete" button next to every bear in the list and, wire it up to send
  a DELETE request to the back end. Secure your new `delete()` handler with
  Oso, and add a rule to the policy that only allows users to delete their own
  bears.
- Join [the Oso Slack][slack] and let us know what your favorite bear is and why
  it's the polar bear.
- Learn more about other use cases of Oso, other languages that it supports
  and more in [the Oso documentation][docs.osohq.com].
  
If you liked this post, chances are you'll like these others:

- [Build and Secure an API in Python with FastAPI](/blog/2020/12/17/build-and-secure-an-api-in-python-with-fastapi)
- [The Definitive Guide to WSGI](/blog/2020/11/16/definitive-guide-to-wsgi)
- [Build a Simple CRUD App with Python, Flask, and React](/blog/2018/12/20/crud-app-with-python-flask-react)
- [Build a CRUD App with Python, Flask, and Angular](/blog/2019/03/25/build-crud-app-with-python-flask-angular)

Don't forget to [follow @oktadev on Twitter](https://twitter.com/oktadev) and subscribe to our [YouTube channel](https://youtube.com/c/oktadev) for more excellent tutorials.

[FastAPI]: https://fastapi.tiangolo.com/
[SQLAlchemy]: https://www.sqlalchemy.org/
[Oso]: https://www.osohq.com/
[osohq/oso]: https://github.com/osohq/oso
[patterns]: https://docs.osohq.com/python/learn/examples.html
[learn/policies]: https://docs.osohq.com/learn/policies.html
[docs.osohq.com]: https://docs.osohq.com/
[FastAPI dependable]: https://fastapi.tiangolo.com/tutorial/dependencies/
[AuthorizedSession]: https://docs.osohq.com/python/reference/api/sqlalchemy.html#sqlalchemy_oso.session.AuthorizedSession
[Session]: https://docs.sqlalchemy.org/en/13/orm/session_api.html#sqlalchemy.orm.session.Session
[github-repo]: https://github.com/osohq/fastapi-sqlalchemy-okta-oso-example
[built-in roles]: https://docs.osohq.com/python/getting-started/roles/builtin_roles.html
[slack]: https://join-slack.osohq.com
