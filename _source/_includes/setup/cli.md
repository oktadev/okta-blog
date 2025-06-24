{%- if page.path contains '.adoc' -%}{% assign adoc = true %}{%- endif -%}
{%- capture cliLink %}
  {%- if adoc -%}https://github.com/okta/okta-cli-client[Okta CLI Client]
  {%- else -%}[Okta CLI Client](https://github.com/okta/okta-cli-client)
  {%- endif -%}
{%- endcapture -%}

{%- capture integrationLink %}
  {%- if adoc -%}https://help.okta.com/oie/en-us/content/topics/apps/apps_app_integration_wizard.htm[integration setup instructions]
  {%- else -%}[integration setup instructions](https://help.okta.com/oie/en-us/content/topics/apps/apps_app_integration_wizard.htm)
  {%- endif -%}
{%- endcapture -%}

{% if include.install != "false" %}
  {%- if include.signup == "false" -%}Install the {{ cliLink }} and configure your credentials as described in the README.
  {%- else -%}Before you begin, you'll need a free Okta Integrator Free Plan account. Install the {{ cliLink }} and run `okta register` to sign up for a new account. If you already have an account, configure your credentials as described in the {{ CliLink }} README.
  {%- endif -%}
{% endif %}

{%- if include.type == "spa" -%}
  {%- assign parts = include.loginRedirectUri | split: '/callback' -%}
  {%- assign baseUrl = parts[0] -%}
{%- endif -%}

{%- if include.type == "web" -%}
  {%- assign parts = include.loginRedirectUri | split: '/authorization-code/callback' -%}
  {%- assign baseUrl = parts[0] -%}
{%- endif -%}

{% if include.type == "jhipster" %}

Follow the {{ integrationLink }} to create an OIDC App in Okta. Select the default app name, or change it as you see fit.
  {% if include.loginRedirectUri and include.logoutRedirectUri %}Then, change the Redirect URIs to: 
```
{% if adoc %}\{% endif %}{{ include.loginRedirectUri }}
```
Use `{% if adoc %}\{% endif %}{{ include.logoutRedirectUri }}` for the Logout Redirect URIs.
  {% else %}Accept the default Redirect URI values provided for you.
  {% endif %}
{% elsif include.type == "token" %}
Next, create an API token. Log in to your Okta admin console and go to **Security** > **API** > **Tokens**. Create a new token and store the value somewhere safe. Make sure you don't check it into GitHub!
{% else %}
Follow the {{ integrationLink}} to create an application in your Okta admin console. Select the default app name, or change it as you see fit.
{% if include.type != "service" %}Choose 
  {%- if include.type == "spa" -%}Single-Page App
  {%- else -%}{{ include.type | capitalize }}
  {%- endif -%}
{% endif %}
  {% if include.type == "spa" %}
Use `{% if adoc %}\{% endif %}{{ include.loginRedirectUri }}` for the Redirect URI and {% if include.logoutRedirectUri %}set the Logout Redirect URI to `{% if adoc %}\{% endif %}{{ include.logoutRedirectUri }}`{% else %}accept the default Logout Redirect URI of `{% if adoc %}\{% endif %}{{ baseUrl }}`{% endif %}.
  {% elsif include.type == "web" %}
Select **
    {%- if include.framework -%}{{ include.framework }}
    {%- else -%}Other
    {%- endif -%}**. 
    {% if include.loginRedirectUri and include.logoutRedirectUri %}Then, change the Redirect URI to `{% if adoc %}\{% endif %}{{ include.loginRedirectUri }}` and use `{% if adoc %}\{% endif %}{{ include.logoutRedirectUri }}` for the Logout Redirect URI.
    {% elsif include.loginRedirectUri %}Then, change the Redirect URI to `{% if adoc %}\{% endif %}{{ include.loginRedirectUri }}` and accept the default Logout Redirect URI of `{% if adoc %}\{% endif %}{{ baseUrl }}`.
    {% else %}Accept the default Redirect URI values provided for you.{% if include.framework contains "Spring Boot" %} That is, a Login Redirect of `{% if adoc %}\{% endif %}http://localhost:8080/login/oauth2/code/okta` and a Logout Redirect of `{% if adoc %}\{% endif %}http://localhost:8080`.{% endif %}
    {% endif %}
  {% elsif include.type == "native" %}
    {% if include.loginRedirectUri == include.logoutRedirectUri %}
Use `{{ include.loginRedirectUri }}` for the Redirect URI and the Logout Redirect URI 
    {% else %}
Use `{{ include.loginRedirectUri }}` for the Redirect URI and set the Logout Redirect URI to `{{ include.logoutRedirectUri }}` 
    {% endif %}
    {%- if include.loginRedirectUri contains 'com.okta.' -%}
(where `{{ include.loginRedirectUri | remove: 'com.okta.' | remove: ':/callback' | remove: '[http://localhost:8100/callback,' | remove: ']' }}.okta.com` is your Okta domain name). Your domain name is reversed to provide a unique scheme to open your app on a device.
    {% else %}.{% endif %}
  {% endif %}
{% endif %}

{% if include.note %}
{{ note }}
{% endif %}

{% capture details %}
{%- if include.type == "jhipster" -%}
When creating a JHipster App, you will need to do several things: 

1. Create an OIDC app with the correct {% if include.loginRedirectUri %}(see above, below are the default values) {% endif %}redirect URIs: 
  - login: `http://localhost:8080/login/oauth2/code/oidc` and `http://localhost:8761/login/oauth2/code/oidc`
  - logout: `http://localhost:8080` and `http://localhost:8761`
2. Create the `ROLE_ADMIN` and `ROLE_USER` groups that JHipster expects
3. Adds your current user to the `ROLE_ADMIN` and `ROLE_USER` groups
4. Creates a `groups` claim in your default authorization server and adds the user's groups to it

**NOTE**: The `http://localhost:8761*` redirect URIs are for the JHipster Registry, which is often used when creating microservices with JHipster. The Okta CLI adds these by default. 

  {% elsif include.type != "token" %}
You may need to create the file `.okta.env` with appropriate values for your application. The issuer is found in authorization server settings in the Okta Admin Console, and the cliekt ID and secret come from the app integration. {% if include.type == "jhipster" %} It should look like this (except the placeholder values will be populated):{% endif %}

    {% if include.type == "web" or include.type == "service" %}
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
{%- assign tokenDocs = 'https://developer.okta.com/docs/guides/create-an-api-token/create-the-token/' -%}
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
{%- elsif (include.type == "token" -%}API Token
{%- else -%}{{ include.type | capitalize }}
{%- endif -%}
{% if include.type != "token" %} App{% endif %}
{%- endcapture -%}

{%- capture docsLink %}
{%- if include.type == "jhipster" -%}{{ jhipsterDocs }}
{%- elsif include.type == "token" -%}{{ tokenDocs }}
{%- else -%}{{ oktaDocs }}
{%- endif -%}
{%- endcapture -%}

**NOTE**: You will need to use the Okta Admin Console to create your {% if include.type == "token" %}token{% else %}app{% endif %}. See [Create a{% if (include.framework == "Angular" or include.type == "token") %}n{% endif %} {{ oktaAppType }}{% if (include.type == "jhipster") %} on Okta{% endif %}]({{ docsLink }}) for more information.
{% endcapture %}

{% if include.type == "token" %}
{% if adoc %}++++{% endif %}
{{ details | markdownify }}
{% if adoc %}++++{% endif %}
{% endif %}
