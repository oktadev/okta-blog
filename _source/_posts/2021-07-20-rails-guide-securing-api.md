---
disqus_thread_id: 8661651286
discourse_topic_id: 17394
discourse_comment_url: https://devforum.okta.com/t/17394
layout: blog_post
title: The Rails Guide to Securing an API
author: andrew-van-beek
by: internal-contributor
communities: [ruby]
description: "Learn how to easily secure your Ruby On Rails API with Okta."
tags: [ruby, rails, auth, api, security]
tweets:
- "Easily add authentication to your @rails APIs using @oktadev <3"
- "Need a simpler way secure your @rails APIs? Try @oktadev! We just published an article on this very topic"
- "Wire your @rails APIs more securely by using @oktadev. Check out this guide!"
image: blog/rubyonrails6/railstrain.png
type: conversion
---

In this tutorial we are going down a different track then our last [Ruby Post](/blog/2020/09/25/easy-auth-ruby-on-rails-6-login) (bad pun intended). Instead diving into building a very simple API that, of course, we will secure with access tokens minted by our very own Okta OAuth server. We'll make requests to this API via Postman to keep things nice and simple. Now let's get chugging along. (OK, that's the last pun for a bit.)

Prerequisites for this blog post include:

- [Postman](https://www.postman.com/) or [PostmanCanary](https://www.postman.com/downloads/canary/)
- A text editor (I am using [VS Code](https://code.visualstudio.com/) in my examples)
- [Rails 6](https://github.com/rails/rails)
- An [Okta Developer Account](https://developer.okta.com/) (free forever, to handle your OAuth needs)

Now let's get started!

## Build the API

Open up the terminal and create a brand new Rails application:

```sh
rails new okta_protected_api
cd okta_okta_protected_api
```

{% img blog/rails-securing-api/image1.png alt:"" width:"800" %}{: .center-image }

Now let's install the JWT gem. Open your gemfile and add this one line:

```ruby
gem 'jwt'
```

Like so:

{% img blog/rails-securing-api/image2.png alt:"" width:"800" %}{: .center-image }

Now let's run bundle install in the terminal:

```sh
bundle install
```

Now let's create a route. For this post, I'll have an API that returns anime I am watching or I am excited about, so I will call it animes. Add this line to the `config/routes.rb.`

```ruby
resources :animes, only: [:index]
```

{% img blog/rails-securing-api/image3.png alt:"" width:"800" %}{: .center-image }

And now let's create a controller.

```sh
cd app/controllers
touch anime_controller.rb
```

Now provide the code for the controller.

 ```ruby
class AnimesController < ApplicationController
    def index
      animes = ["Haikyu", "The Great Pretender", "Jujutsu kaisen", "Dr. Stone", "Attack on Titan"]
      render json: { animes: animes }.to_json, status: :ok
    end
  end
```

Now let's do an arbitrary test to make sure our API works. Run the Rails app and navigate to `http://localhost:3000/animes`

```sh
rails s
```

You should see:

{% img blog/rails-securing-api/image4.png alt:"" width:"600" %}{: .center-image }

## Add Security methods

This looks nice! A great list of stuff to watch. Anime aside, let's secure this API. To do this, we will add some security methods to our application controller. We are going to add a private method that will use the JWT library.

```ruby
  private
    def valid_token(token)
      unless token
        return false
      end
  
      token.gsub!('Bearer ','')
      begin
            keys = []

        JWT.decode(token, nil, true, { algorithms: ['RS256'], jwks: { keys: keys } })
        return true
      rescue JWT::DecodeError
        render json: { errors: ['Not Authenticated'] }, status: :unauthorized
      end
      false
    end
```

>**Note:** The above is a function that will expect an OAuth token from an Okta OAuth server. Our code should look something like this in the application controller:

{% img blog/rails-securing-api/image5.png alt:"" width:"800" %}{: .center-image }

But wait a second. We are still missing a couple of pieces of key logic! For one, when do we call this valid token method? So let us fix that first. We are going to create a public method that will check HTTP headers for a valid JWT. It should look like so:

 ```ruby
    def require_jwt
      token = request.headers["HTTP_AUTHORIZATION"]
      if !token
        head :forbidden
      end
      if !valid_token(token)
        head :forbidden
      end
    end
```

Now let's add that code to our application controller. It should now look like this:

{% img blog/rails-securing-api/image6.png alt:"" width:"800" %}{: .center-image }

Now let's add a before_action to our controller with our new method. Add this code right under ApplicationController:

```ruby
before_action :require_jwt
```

Now the finished result of the application controller should look like this as pure code:

```ruby
class ApplicationController < ActionController::Base
    before_action :require_jwt
    
    def require_jwt
        token = request.headers["HTTP_AUTHORIZATION"]
        if !token
          head :forbidden
        end
        if !valid_token(token)
          head :forbidden
        end
    end
  
    private
    def valid_token(token)
      unless token
        return false
      end
  
      token.gsub!('Bearer ','')
      begin
            keys = []

        JWT.decode(token, nil, true, { algorithms: ['RS256'], jwks: { keys: keys } })
        return true
      rescue JWT::DecodeError
        render json: { errors: ['Not Authenticated'] }, status: :unauthorized
      end
      false
    end
end 
```

## Find and Add Your Keys Endpoint

However, one thing is still missing. The `keys` value is an empty array when it should reflect our public keys from an Okta OAuth server. We can find our JWKS endpoint if we go `https://{yourdomain}.okta.com/oauth2/default/v1/keys`.

When you go there you should see something like this:

{% img blog/rails-securing-api/image7.png alt:"" width:"800" %}{: .center-image }

Copy the JSON key-value for "keys" and paste it into the `keys` array variable in your code.

>**Note:** In a production application, you would want to fetch the keys from the URL in your code and cache them in your application. The copy and paste method here is only for demonstration purposes and to avoid needing to create a caching solution in this sample app.

For example, my end result looks like this:

{% img blog/rails-securing-api/image8.png alt:"" width:"800" %}{: .center-image }

## Test your API

Now it is time to test if your API is protected. Start up the server.

```sh
rails s
```

Now let's open `http://localhost:3000/animes`.

You should now see:

{% img blog/rails-securing-api/image9.png alt:"" width:"800" %}{: .center-image }

Sweet! We have secured our API, but to be sure let's test with Postman! We are going to create a new request for our anime API:

{% img blog/rails-securing-api/image10.png alt:"" width:"900" %}{: .center-image }

Click on **Send**. You should still get the unauthorized access denied screen.

To fix this, we will need to get an access token from Okta and send it to our API. Create a new request and point at `http://localhost:3000/animes` as a GET request. Then select **Auth**, and select **Authorization code** from the dropdown for Grant Type, and select **Send client credentials** in the body for Client Authentication. For the header prefix, write Bearer. Replace the authorization URL with the authorization URL and token URL from your Okta Developer Account.

The format of the URLs should be something like below:

{% raw %}
- Authorization URL: `https://{{yourdomain}}.okta.com/oauth2/default/v1/authorize`
- Token URL: `https://{{yourdomain}}.okta.com/oauth2/default/v1/token`
{% endraw %}

In Postman, it should all look like the following. (If yours looks different, try to make it look like below with your own values.)

{% img blog/rails-securing-api/image11.png alt:"" width:"700" %}{: .center-image }

Now let's get our **Client ID** and **Secret** from Okta. Go to Okta Applications and create a new web app. Feel free to name it whatever you want. Make sure you add the Postman URL to the Base URI and the redirect URI. The Base URL should be `https://oauth.pstmn.io` and the redirect URI should be `https://oauth.pstmn.io/v1/callback`. It should look something like this:

{% img blog/rails-securing-api/image12.png alt:"" width:"800" %}{: .center-image }

Click **Done**.

On the next page, you should see the Client information like so:

{% img blog/rails-securing-api/image13.png alt:"" width:"500" %}{: .center-image }

Now take your **Client ID** and **Client secret** and copy it into Postman. In Postman, click **Get New Access Token**:

{% img blog/rails-securing-api/image14.png alt:"" width:"700" %}{: .center-image }

It should redirect you to an Okta login page:

{% img blog/rails-securing-api/image15.png alt:"" width:"900" %}{: .center-image }

Just sign in as a user and you should see something like this:

{% img blog/rails-securing-api/image16.png alt:"" width:"900" %}{: .center-image }

>**Note**: Make sure you allow popups from Postman. Otherwise, you might get stuck on a loading screen in Postman.

If everything works according to plan, you should see this dialog:

{% img blog/rails-securing-api/image17.png alt:"" width:"800" %}{: .center-image }

All that's left is to send our token to our API:

{% img blog/rails-securing-api/image18.png alt:"" width:"700" %}{: .center-image }

Try clicking **Send**, and you should see our data come back:

{% img blog/rails-securing-api/image19.png alt:"" width:"900" %}{: .center-image }

Oh yeah, it's working! Now, what if we want to add some extra validation, like only tokens with a certain scope can hit our API?  Let's modify our code on the application controller. We are going to replace some code with this snippet that checks for the profile scope in the token and returns a boolean if it is present in the token or not.

```ruby
 token_payload = JWT.decode(token, nil, true, { algorithms: ['RS256'], jwks: { keys: keys } })
        scopes = token_payload[0]["scp"]
        return scopes.include? 'profile'
```

The application controller will now look like this:

{% raw %}
```ruby
class ApplicationController < ActionController::Base
    before_action :require_jwt

    def require_jwt
        token = request.headers["HTTP_AUTHORIZATION"]
        if !token
          head :forbidden
        end
        if !valid_token(token)
          head :forbidden
        end
    end
  
    private
    def valid_token(token)
      unless token
        return false
      end
  
      token.gsub!('Bearer ','')
      begin
        keys = [{{your keys}}]

        token_payload = JWT.decode(token, nil, true, { algorithms: ['RS256'], jwks: { keys: keys } })
        scopes = token_payload[0]["scp"]
        return scopes.include? 'profile'
      rescue JWT::DecodeError
        render json: { errors: ['Not Authenticated'] }, status: :unauthorized
      end
      false
    end

end
```
{% endraw %}

For reference here is also a screenshot of my code:

{% img blog/rails-securing-api/image20.png alt:"" width:"800" %}{: .center-image }

Now restart your server.

Get a new token with just OpenID and email. Postman reference request below:

{% img blog/rails-securing-api/image21.png alt:"" width:"600" %}{: .center-image }

You should now get an unauthorized message when you hit **Send** again:

{% img blog/rails-securing-api/image22.png alt:"" width:"900" %}{: .center-image }

Now let's get a new access token with the profile scope again:

{% img blog/rails-securing-api/image23.png alt:"" width:"600" %}{: .center-image }

Your request should now be successful:

{% img blog/rails-securing-api/image24.png alt:"" width:"900" %}{: .center-image }

If you just want want to clone and try it, just use the [GitHub repo](https://github.com/oktadev/Simple-Rails-Api).

Happy coding!

## Learn More About Ruby on Rails and OAuth

For more Ruby on Rails and Okta articles, check out these posts:

- [Easy Authentication for Ruby On Rails Login](/blog/2020/09/25/easy-auth-ruby-on-rails-6-login)
- [An Illustrated Guide to OAuth and OpenID Connect](/blog/2019/10/21/illustrated-guide-to-oauth-and-oidc)
- [Simple Authentication with Rails and OmniAuth](/blog/2018/09/18/simple-authentication-with-rails-and-omniauth)
- [Is the OAuth 2.0 Implicit Flow Dead?](/blog/2019/05/01/is-the-oauth-implicit-flow-dead)

Make sure to follow us on [Twitter](https://twitter.com/oktadev), subscribe to our [YouTube Channel](https://youtube.com/c/oktadev) and check out our [Twitch](https://www.twitch.tv/oktadev) channel so that you never miss any awesome content!
