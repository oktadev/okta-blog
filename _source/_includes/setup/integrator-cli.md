{%- if page.path contains '.adoc' -%}{% assign adoc = true %}{%- endif -%}
{%- capture adminLink %}
  {%- if adoc -%}https://developer.okta.com/login[Okta org]
  {%- else -%}[Okta org](https://developer.okta.com/login)
  {%- endif -%}
{%- endcapture -%}

{% if include.install != "false" %}
  {%- if include.signup == "false" -%}Sign in to your {{ adminLink }}.
  {%- else -%}Before you begin, you'll need a free Okta Integrator Free Plan account. Sign up at {{ adminLink }} to create a new account. If you already have an account, sign in to your {{ adminLink }}.
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


{% if include.type == "token" %}
Create an API token in the Admin Console:

1. Go to **Security** > **API** > **Tokens**
2. Click **Create Token**
3. Give your token a name
4. Click **Create Token**
5. Copy the token value and store it somewhere safe. Make sure you don't check it into GitHub!
{% else %}
{% if include.install == "false" %}In the Admin Console:{% else %}Then, in the Admin Console:{% endif %}

1. Go to **Applications** > **Applications**
2. Click **Create App Integration**
3. Select **OIDC - OpenID Connect** as the sign-in method
4. Select **
  {%- if include.type == "spa" -%}Single-Page Application
  {%- elsif include.type == "web" -%}Web Application
  {%- elsif include.type == "native" -%}Native Application
  {%- elsif include.type == "service" -%}API Services
  {%- else -%}{{ include.type | capitalize }} Application
  {%- endif -%}
** as the application type, then click **Next**
5. Enter an app integration name
  {% if include.type == "spa" %}
6. In the **Grant type** section, ensure both **Authorization Code** and **Refresh Token** are selected
7. Configure the redirect URIs:
   - **Sign-in redirect URIs**: `{% if adoc %}\{% endif %}{{ include.loginRedirectUri }}`
   {% if include.logoutRedirectUri %}- **Sign-out redirect URIs**: `{% if adoc %}\{% endif %}{{ include.logoutRedirectUri }}`{% else %}- **Sign-out redirect URIs**: `{% if adoc %}\{% endif %}{{ baseUrl }}`{% endif %}
8. In the **Controlled access** section, select the appropriate access level
9. Click **Save**
  {% elsif include.type == "web" %}
6. Configure the redirect URIs:
    {% if include.loginRedirectUri and include.logoutRedirectUri %}- **Sign-in redirect URIs**: `{% if adoc %}\{% endif %}{{ include.loginRedirectUri }}`
   - **Sign-out redirect URIs**: `{% if adoc %}\{% endif %}{{ include.logoutRedirectUri }}`
    {% elsif include.loginRedirectUri %}- **Sign-in redirect URIs**: `{% if adoc %}\{% endif %}{{ include.loginRedirectUri }}`
   - **Sign-out redirect URIs**: `{% if adoc %}\{% endif %}{{ baseUrl }}`
    {% else %}- Accept the default redirect URI values{% if include.framework contains "Spring Boot" %}:
     - **Sign-in redirect URIs**: `{% if adoc %}\{% endif %}http://localhost:8080/login/oauth2/code/okta`
     - **Sign-out redirect URIs**: `{% if adoc %}\{% endif %}http://localhost:8080`{% endif %}
    {% endif %}
7. In the **Controlled access** section, select the appropriate access level
8. Click **Save**
  {% elsif include.type == "native" %}
6. Configure the redirect URIs:
    {% if include.loginRedirectUri == include.logoutRedirectUri %}- Use `{{ include.loginRedirectUri }}` for both the **Redirect URI** and **Post Logout Redirect URI**
    {% else %}- **Redirect URI**: `{{ include.loginRedirectUri }}`
   - **Post Logout Redirect URI**: `{{ include.logoutRedirectUri }}`
    {% endif %}
    {%- if include.loginRedirectUri contains 'com.okta.' -%}
   (where `{{ include.loginRedirectUri | remove: 'com.okta.' | remove: ':/callback' | remove: '[http://localhost:8100/callback,' | remove: ']' }}.okta.com` is your Okta domain name). Your domain name is reversed to provide a unique scheme to open your app on a device.
    {% else %}{% endif %}
7. In the **Controlled access** section, select the appropriate access level
8. Click **Save**
  {% elsif include.type == "service" %}
6. In the **Controlled access** section, select the appropriate access level
7. Click **Save**
  {% endif %}
{% endif %}

{% if include.note %}
{{ note }}
{% endif %}

{% capture details %}
{%- if include.type != "token" -%}
Creating an {% if include.type == "service" %}OAuth 2.0{% else %}OIDC{% endif %} {% if include.type == "spa" %}Single-Page App{% else %}{{ include.type | capitalize }} App{% endif %} manually in the Admin Console configures your Okta Org with the application settings.{% if include.type != "service" %} It adds the redirect URIs you specified and grants access to the selected users or groups.{% if include.type == "spa" %} You may also need to configure trusted origins for `{% if include.logoutRedirectUri %}{{ include.logoutRedirectUri }}{% else %}{{ baseUrl }}{% endif %}` in **Security** > **API** > **Trusted Origins**.{% endif %}{% endif %} You will see the configuration details when the app is created:
{%- endif -%}
   
{% if include.type == "spa" or include.type == "native" %}
After creating the app, you can find the configuration details on the app's **General** tab:

- **Client ID**: Found in the **Client Credentials** section
- **Issuer**: Found at **Security** > **API** > **Authorization Servers** > **default**

```
Issuer:    https://dev-133337.okta.com/oauth2/default
Client ID: 0oab8eb55Kb9jdMIr5d6
```
{% elsif include.type contains "web" or include.type == "service"  %}
After creating the app, you can find the configuration details on the app's **General** tab:

- **Client ID**: Found in the **Client Credentials** section
- **Client Secret**: Click **Show** in the **Client Credentials** section to reveal
- **Issuer**: Found at **Security** > **API** > **Authorization Servers** > **default**

  {% if include.framework == "Spring Boot" %}
You'll need these values for your `src/main/resources/application.properties` file:
```properties
spring.security.oauth2.client.provider.okta.issuer-uri=https://dev-133337.okta.com/oauth2/default
spring.security.oauth2.client.registration.okta.client-id=0oab8eb55Kb9jdMIr5d6
spring.security.oauth2.client.registration.okta.client-secret=NEVER-SHOW-SECRETS
```
  {% elsif include.framework == "Okta Spring Boot Starter" %}
You'll need these values for your `src/main/resources/application.properties` file:
```properties
okta.oauth2.issuer=https://dev-133337.okta.com/oauth2/default
okta.oauth2.client-id=0oab8eb55Kb9jdMIr5d6
okta.oauth2.client-secret=NEVER-SHOW-SECRETS
```
  {% elsif include.type != "token" %}
You'll need these values for your application configuration:

    {% if include.type == "web" or include.type == "service" %}
```shell
OKTA_OAUTH2_ISSUER="https://dev-133337.okta.com/oauth2/default"
OKTA_OAUTH2_CLIENT_ID="0oab8eb55Kb9jdMIr5d6"
OKTA_OAUTH2_CLIENT_SECRET="NEVER-SHOW-SECRETS"
```

Your Okta domain is the first part of your issuer, before `/oauth2/default`.
    {% endif %}
  {% endif %}
{% endif %}

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
{%- elsif (include.type == "token" -%}API Token
{%- else -%}{{ include.type | capitalize }}
{%- endif -%}
{% if include.type != "token" %} App{% endif %}
{%- endcapture -%}

{%- capture docsLink %}
{%- if include.type == "token" -%}{{ tokenDocs }}
{%- else -%}{{ oktaDocs }}
{%- endif -%}
{%- endcapture -%}

**NOTE**: You can also use the [Okta CLI Client](https://github.com/okta/okta-cli-client) or [Okta PowerShell Module](https://github.com/okta/okta-powershell-cli) to automate this process. See [this guide]({{ docsLink }}) for more information about setting up your app.
{% endcapture %}

{% if include.type == "token" %}
{% if adoc %}++++{% endif %}
{{ details | markdownify }}
{% if adoc %}++++{% endif %}
{% else %}
{% if adoc %}++++{% endif %}
<details>
  <summary>Where are my new app's credentials?</summary>
{{ details | markdownify }}
</details>
{% if adoc %}++++{% endif %}
{% endif %}
