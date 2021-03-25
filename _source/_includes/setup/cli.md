{%- capture cliLink %}
{%- if include.adoc -%}https://cli.okta.com[Okta CLI]
{%- else -%}[Okta CLI](https://cli.okta.com)
{%- endif -%}
{%- endcapture -%}

{% if include.signup == "false" %}
Install the {{ cliLink }} and run `okta login`.
{% else %}
Before you begin, you'll need a free Okta developer account. Install the {{ cliLink }} and run `okta register` to sign up for a new account. If you already have an account, run `okta login`.
{% endif %}

{%- if include.type == "spa" -%}
{%- assign parts = include.loginRedirectUri | split: '/callback' -%}
{%- assign baseUrl = parts[0] -%}
{%- endif -%}

{% if include.type == "jhipster" %}
Then, run `okta apps create jhipster`. Select the default app name, or change it as you see fit. Accept the default Redirect URI values provided for you.
{% else %}
Then, run `okta apps create{% if (include.type == "service") %} service{% endif %}`. Select the default app name, or change it as you see fit. Choose **
{%- if include.type == "spa" -%}
Single-Page App
{%- else -%}
{{ include.type | capitalize }}
{%- endif -%}
** and press **Enter**. 
  {% if include.type == "spa" %}
Change the Redirect URI to `{{ include.loginRedirectUri }}` and accept the default Logout Redirect URI of `{{baseUrl}}`.
  {% elsif include.type == "web" %}
Select **
    {%- if include.framework -%}{{ include.framework }}
    {%- else -%}Other
    {%- endif -%}**. 
    {% if include.loginRedirectUri and include.logoutRedirectUri %}Then, change the Redirect URI to `{{ include.loginRedirectUri }}` and use `{{ include.logoutRedirectUri }}` for the Logout Redirect URI.
    {% else %}Accept the default Redirect URI values provided for you.{% if include.framework contains "Spring Boot" %} That is, a Login Redirect of `{% if include.adoc %}\{% endif %}http://localhost:8080/login/oauth2/code/okta` and a Logout Redirect of `{% if include.adoc %}\{% endif %}http://localhost:8080`.{% endif %}
    {% endif %}
  {% elsif include.type == "native" %}

Change the Redirect URI to `[com.okta.dev-133337:/callback,{{ include.loginRedirectUri }}]` and the Logout Redirect URI to `[com.okta.dev-133337:/logout,{{ include.logoutRedirectUri }}]`. The first value is your Okta domain name, reversed so it's a unique scheme to open your app on a device.
  {% endif %}
{% endif %}

{% if include.note %}
{{ note }}
{% endif %}

{%- if include.type == "jhipster" -%}
The Okta CLI streamlines configuring a JHipster app and does several things for you:

1. Creates an OIDC app with the correct redirect URIs: 
  - login: `{% if include.adoc %}\{% endif %}http://localhost:8080/login/oauth2/code/oidc` and `{% if include.adoc %}\{% endif %}http://localhost:8761/login/oauth2/code/oidc`
  - logout: `{% if include.adoc %}\{% endif %}http://localhost:8080` and `{% if include.adoc %}\{% endif %}http://localhost:8761`
2. Creates `ROLE_ADMIN` and `ROLE_USER` groups that JHipster expects
3. Adds your current user to the `ROLE_ADMIN` and `ROLE_USER` groups
4. Creates a `groups` claim in your default authorization server and adds the user's groups to it

{% if include.adoc %}NOTE{% else %}**NOTE**{% endif %}: The `{% if include.adoc %}\{% endif %}http://localhost:8761*` redirect URIs are for the JHipster Registry, which is often used when creating microservices with JHipster. The Okta CLI adds these by default. 

You will see output like the following when it's finished:
{%- else -%}
The Okta CLI will create an {% if include.type == "service" %}OAuth 2.0{% else %}OIDC{% endif %} {% if include.type == "spa" %}Single-Page App{% else %}{{ include.type | capitalize }} App{% endif %} in your Okta Org.{% if include.type != "service" %} It will add the redirect URIs you specified and grant access to the Everyone group.{% if include.type == "spa" %} It will also add a trusted origin for `{{ baseUrl }}`.{% endif %}{% endif %} You will see output like the following when it's finished:
{%- endif -%}
   
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
```properties
spring.security.oauth2.client.provider.okta.issuer-uri=https://dev-133337.okta.com/oauth2/default
spring.security.oauth2.client.registration.okta.client-id=0oab8eb55Kb9jdMIr5d6
spring.security.oauth2.client.registration.okta.client-secret=NEVER-SHOW-SECRETS
```
  {% elsif include.framework == "Okta Spring Boot Starter" %}
Open `src/main/resources/application.properties` to see the issuer and credentials for your app.
```properties
okta.oauth2.issuer=https://dev-133337.okta.com/oauth2/default
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

{%- assign jhipsterDocs = 'https://www.jhipster.tech/security/#okta' -%}
{%- capture oktaDocs -%}
https://developer.okta.com/docs/guides/sign-into-
{%- if include.type == "native" -%}mobile
{%- else -%}{{ include.type }}
{%- endif -%}
{%- if {include.type != "spa" -%}-app/{% else %}/{%- endif -%}
{%- if (include.framework) -%}
  {%- if (include.framework contains "Spring Boot") -%}springboot
  {%- elsif (include.framework contains "ASP.NET Core") -%}aspnetcore3
  {%- else -%}{{include.framework | downcase | replace:' ','-'}}
  {%- endif -%}
{%- else -%}-
{%- endif -%}
/create-okta-application/
{%- endcapture -%}

{%- if include.type == "service" -%}
{%- assign oktaDocs = 'https://developer.okta.com/docs/guides/implement-oauth-for-okta-serviceapp/overview/' %}
{%- endif -%}

{%- capture oktaAppType -%}
{%- if (include.framework) -%}
  {%- if (include.framework contains "Spring Boot") -%}Spring Boot
  {%- else -%}{{ include.framework }}
  {%- endif -%}
{%- elsif (include.type == "spa" -%}Single-Page
{%- elsif (include.type == "jhipster" -%}JHipster
{%- else -%}{{ include.type | capitalize }}
{%- endif -%}
{%- endcapture -%}

{%- capture docsLink %}
{%- if (include.type == "jhipster") -%}{{ jhipsterDocs }}
{%- else -%}{{ oktaDocs }}
{%- endif -%}
{%- endcapture -%}

{% if include.adoc %}TIP{% else %}**NOTE**{% endif %}: You can also use the Okta Admin Console to create your app. See {% if include.adoc %}{{ docsLink }}{% endif %}[Create a{% if (include.framework == "Angular") %}n{% endif %} {{ oktaAppType }} App{% if (include.type == "jhipster") %} on Okta{% endif %}]{% unless include.adoc %}({{ docsLink }}){% endunless %} for more information.
