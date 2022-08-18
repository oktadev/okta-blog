{%- if page.path contains '.adoc' -%}{% assign adoc = true %}{%- endif -%}
{%- capture debuggerLink %}
{%- if adoc -%}https://oidcdebugger.com/[OpenID Connect Debugger]
{%- else -%}[OpenID Connect Debugger](https://oidcdebugger.com/)
{%- endif -%}
{%- endcapture -%}

An easy way to get an access token is to generate one using {{ debuggerLink }}. Open the site in a new window or tab. Fill in your client ID, and use `{% if adoc %}\{% endif %}https://{yourOktaDomain}/oauth2/default/v1/authorize` for the Authorize URI. Select **{{ include.responseType | default: 'code' }}** for the response type and **Use PKCE**.
