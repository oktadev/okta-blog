Before you begin, you'll need a free Okta developer account. Install the [Okta CLI](https://cli.okta.com) and run `okta register` to sign up for a new account. If you already have an account, run `okta login`.

Then, run `okta apps create`. Select the default app name, or change it as you see fit. Select **{% if include.type == "spa" %}Single-Page App{% else %}{{ include.type | capitalize }}{% endif %}** and press **Enter**. {% if include.type == "spa" or include.type == "web" %}Change the Redirect URI to `{{ include.loginRedirectUri }}` and accept the default Logout Redirect URI.
{% elsif include.type == "native" %}

Change the Redirect URI to `[com.okta.dev-133337:/callback,{{ include.loginRedirectUri }}]` and the Logout Redirect URI to `[com.okta.dev-133337:/logout,{{ include.logoutRedirectUri }}]`. The first value is your Okta domain name, reversed so it's a unique scheme to open your app on a device.
{% endif %}

This will result in output like the following:

```shell{% if include.type == "spa" or include.type == "native" %}
Okta application configuration:
Issuer:    https://dev-133337.okta.com/oauth2/default
Client ID: 0oab8eb55Kb9jdMIr5d6{% elsif include.type == "web" %}
Okta application configuration has been written to: /path/to/app/.okta.env{% endif %}
```

<!-- Do we need to add a note about the Everyone group? -->

**NOTE**: You can also use the Okta Admin Console to create your app. See [Create a {% if include.type == "spa" %}Single-Page App{% else %}{{ include.type | capitalize }}{% endif %} App](todo) for more information.
