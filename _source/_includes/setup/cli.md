{% if include.signup == "false" %}
Install the [Okta CLI](https://cli.okta.com) and run `okta login`.
{% else %}
Before you begin, you'll need a free Okta developer account. Install the [Okta CLI](https://cli.okta.com) and run `okta register` to sign up for a new account. If you already have an account, run `okta login`.
{% endif %}

{% if include.type == "jhipster" %}
Then, run `okta apps create jhipster`. Select the default app name, or change it as you see fit. Accept the default Redirect URI values provided for you.
{% else %}
Then, run `okta apps create`. Select the default app name, or change it as you see fit. Choose **
{%- if include.type == "spa" -%}
Single-Page App
{%- else -%}
{{ include.type | capitalize }}
{%- endif -%}
** and press **Enter**. 
  {% if include.type == "spa" %}
Change the Redirect URI to `{{ include.loginRedirectUri }}` and accept the default Logout Redirect URI.
  {% elsif include.type == "web" %}
Select **
    {%- if include.framework -%}{{ include.framework }}
    {%- else -%}Other
    {%- endif -%}**. 
    {% if include.loginRedirectUri and include.logoutRedirectUri %}Then, change the Redirect URI to `{{ include.loginRedirectUri }}` and use `{{ include.logoutRedirectUri }}` for the Logout Redirect URI.
    {% else %}Accept the default Redirect URI values provided for you.
    {% endif %}
  {% elsif include.type == "native" %}

Change the Redirect URI to `[com.okta.dev-133337:/callback,{{ include.loginRedirectUri }}]` and the Logout Redirect URI to `[com.okta.dev-133337:/logout,{{ include.logoutRedirectUri }}]`. The first value is your Okta domain name, reversed so it's a unique scheme to open your app on a device.
  {% endif %}
{% endif %}

{% if include.note %}
{{ note }}
{% endif %}

This will result in output like the following:

{% if include.type == "spa" or include.type == "native" %}
```shell
Okta application configuration:
Issuer:    https://dev-133337.okta.com/oauth2/default
Client ID: 0oab8eb55Kb9jdMIr5d6
```
{% elsif include.type contains "web" or "jhipster"  %}
  {% if include.framework contains "Spring Boot" %}
```shell
Okta application configuration has been written to: 
  /path/to/app/src/main/resources/application.properties
```
  {% else %}
```shell
Okta application configuration has been written to: /path/to/app/.okta.env
```
  {% endif %}

  {% if include.framework == "Spring Boot" %}
Open `src/main/resources/application.properties` to see the issuer and credentials for your app.
```shell
spring.security.oauth2.client.provider.okta.issuer-uri=https\://dev-133337.okta.com/oauth2/default
spring.security.oauth2.client.registration.okta.client-id=0oab8eb55Kb9jdMIr5d6
spring.security.oauth2.client.registration.okta.client-secret=NEVER-SHOW-SECRETS
```
  {% elsif include.framework == "Okta Spring Boot Starter" %}
Open `src/main/resources/application.properties` to see the issuer and credentials for your app.
```shell
okta.oauth2.issuer=https\://dev-133337.okta.com/oauth2/default
okta.oauth2.client-id=0oab8eb55Kb9jdMIr5d6
okta.oauth2.client-secret=NEVER-SHOW-SECRETS
```
  {% else %}
Run `cat .okta.env` (or `type .okta.env` on Windows) to see the issuer and credentials for your app.{% if include.type == "jhipster" %} It will look like this (except the placeholder values will be populated):{% endif %}

    {% if include.type == "web" %}
```shell
export OKTA_OAUTH2_ISSUER="https://dev-133337.okta.com/oauth2/default"
export OKTA_OAUTH2_CLIENT_ID="0oab8eb55Kb9jdMIr5d6"
export OKTA_OAUTH2_CLIENT_SECRET="NEVER-SHOW-SECRETS"
```

Your Okta domain is the first part of your issuer, before `/oauth2/default`.
    {% elsif include.type == "jhipster" %}
```shell
export SPRING_SECURITY_OAUTH2_CLIENT_PROVIDER_OIDC_ISSUER_URI="https://{yourOktaDomain}/oauth2/default"
export SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_OIDC_CLIENT_ID="{clientId}"
export SPRING_SECURITY_OAUTH2_CLIENT_REGISTRATION_OIDC_CLIENT_SECRET="{clientSecret}"
```
    {% endif %}
  {% endif %}
{% endif %}

<!-- Do we need to add a note about the Everyone group? -->

**NOTE**: You can also use the Okta Admin Console to create your app. See [Create a {% if include.type == "spa" %}Single-Page{% elsif include.type == "jhipster" %}JHipster{% else %}{{ include.type | capitalize }}{% endif %} App](todo) for more information.
