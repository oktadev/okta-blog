Run the [Okta Maven Plugin](https://github.com/oktadeveloper/okta-maven-plugin) to register a new account:

```shell
./mvnw com.okta:okta-maven-plugin:register
```

If you already have an Okta account registered, use `login` instead of `register`.

Then, configure your Spring Boot application to use Okta for authentication:

```shell
./mvnw com.okta:okta-maven-plugin:spring-boot
```

It will set up a new OIDC application for you and write your Okta settings to your `src/main/resources/application.properties` file.
