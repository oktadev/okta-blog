An easy way to get an access token is to generate one using [OpenID Connect Debugger](https://oidcdebugger.com/). First, you must configure your application on Okta to use OpenID Connect's implicit flow.

Run `okta login` and open the resulting URL in your browser. Go to the **Applications** section and select the application you just created. Edit its General Settings and add `https://oidcdebugger.com/debug` to the **Login redirect URI**. Add **Implicit** as an allowed grant type, with access token enabled. Click **Save** and copy the client ID for the next step.

Now, navigate to the [OpenID Connect debugger](https://oidcdebugger.com/) website. Fill in your client ID, and use `https://{yourOktaDomain}/oauth2/default/v1/authorize` for the Authorize URI. The `state` field must be filled but can contain any characters.
