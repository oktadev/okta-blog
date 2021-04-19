{%- if page.path contains '.adoc' -%}{% assign adoc = true %}{%- endif -%}
{%- capture debuggerLink %}
{%- if adoc -%}https://oidcdebugger.com/[OpenID Connect Debugger]
{%- else -%}[OpenID Connect Debugger](https://oidcdebugger.com/)
{%- endif -%}
{%- endcapture -%}

An easy way to get an access token is to generate one using {{ debuggerLink }}. {% if include.responseType != "code" %}First, you must configure your application on Okta to use OpenID Connect's implicit flow.

Run `okta login` and open the resulting URL in your browser. Go to the **Applications** section and select the application you just created. Edit its General Settings and add **Implicit (Hybrid)** as an allowed grant type, with access token enabled. Then, make sure it has `{% if adoc %}\{% endif %}https://oidcdebugger.com/debug` in its **Login redirect URIs**. Click **Save** and copy the client ID for the next step.

Now, navigate to the {{ debuggerLink }} website.{% else %}Open the site in a new window or tab.{% endif %} Fill in your client ID, and use `{% if adoc %}\{% endif %}https://{yourOktaDomain}/oauth2/default/v1/authorize` for the Authorize URI. The `state` field must be filled but can contain any characters. Select **{{ include.responseType | default: 'token' }}** for the response type.
