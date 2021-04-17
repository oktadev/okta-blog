{%- if page.path contains '.adoc' -%}{% assign adoc = true %}{%- endif -%}
{%- capture pluginLink %}
{%- if adoc -%}https://github.com/oktadeveloper/okta-maven-plugin[Okta Maven Plugin]
{%- else -%}[Okta Maven Plugin](https://github.com/oktadeveloper/okta-maven-plugin)
{%- endif -%}
{%- endcapture -%}
{%- capture docsLink %}
{%- if adoc -%}https://developer.okta.com/docs/guides/sign-into-web-app/springboot/create-okta-application/[Create a Spring Boot App]
{%- else -%}[Create a Spring Boot App](https://developer.okta.com/docs/guides/sign-into-web-app/springboot/create-okta-application/)
{%- endif -%}
{%- endcapture -%}

Run the {{ pluginLink }} from your app's folder:

```shell
./mvnw com.okta:okta-maven-plugin:register
```

Answer a few questions (name, email, and company), and it will generate a new Okta developer account for you. If you already have an Okta account registered, use `login` instead of `register`.

Then, configure your Spring Boot application to use Okta for authentication:

```shell
./mvnw com.okta:okta-maven-plugin:spring-boot
```

This will set up a new OIDC application for you and write your Okta settings to your `src/main/resources/application.properties` file.

**NOTE**: You can also use the Okta Admin Console to create your app. See {{ docsLink }} for more information.
