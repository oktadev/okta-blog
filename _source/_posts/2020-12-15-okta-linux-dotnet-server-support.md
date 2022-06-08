---
disqus_thread_id: 8317132979
discourse_topic_id: 17334
discourse_comment_url: https://devforum.okta.com/t/17334
layout: blog_post
title: How to Support .NET Core SameSite + OAuth Apps on Linux
author: greg-sinka
by: contractor
communities: [.net]
description: "How to install and run your .NET Core apps inside a Linux container."
tags: [linux, dotnet, aspnet, csharp, dotnetcore, aspnetcore, devops]
tweets:
- "Learn how to deploy an Okta #dotnetcore app inside a #Linux #container."
- "Want to discover how to use #Linux with #dotnetcore for containerization? Here is a quick how-to!"
- "Need to install your #dotnetcore on a #Linux instance? Here you go!"
image: blog/featured/okta-dotnet-mouse-down.jpg
type: conversion
---

Google's recent approach to SameSite cookie attributes caused a bit of confusion among developers. Especially in cases where handling redirects is necessary. After doing some research in the topic I'd like this article to be a guide on how to handle SameSite cookie attributes properly in production. This guide can serve as the basis for deploying an application to any Linux based environment—such as [AWS Elastic Beanstalk](https://aws.amazon.com/elasticbeanstalk), [Google Cloud App Engine](https://cloud.google.com/appengine)—or any VPS Linux deployment. Also I created a sample application to demonstrate redirect handling with the Okta login flow. I won't discuss the topic of [containerization](/blog/2019/09/18/build-a-simple-dotnet-core-app-in-docker) as a possible solution, as we have resources available that give a great overview.

## What is Okta?

Okta is a cloud service that allows developers to create, edit, and securely store user accounts and user account data, and connect them with one or multiple applications. Using Okta, you don't have to worry about implementing sign up, login and logout flows manually. [Sign up for a forever-free account](https://developer.okta.com/signup/) if you don't have one already, to handle auth for your users easily.

## Prerequisites

An [Ubuntu 20.04](https://releases.ubuntu.com/20.04/) Linux machine with SSH access. You can use [Multipass](https://multipass.run) to run a virtual machine as a playground.

## SameSite Enforcement and the Decline of the Cookie

In February 2020, Google [implemented an update](https://blog.chromium.org/2019/10/developers-get-ready-for-new.html) in Chrome on how to interpret the [SameSite](https://owasp.org/www-community/SameSite) attribute of cookies. Up until now, it was assumed that all cookie data could be shared across domains— unless told otherwise. However, after February 2020, the default became that cookies could only be used on the site of origin, so no cookie data would be shared across domains. The reason for this, according to Google, is to increase security against CSRF ([Cross Site Request Forgery](https://owasp.org/www-community/attacks/csrf)) attacks. So now, developers have to make sure to set the `sameSite=None` attribute.

## Preparing the .NET Core 3.1 Application

.NET Core 3.0 supports the updated SameSite values and adds an extra enum value, SameSiteMode.Unspecified to the SameSiteMode enum. This new value indicates no SameSite should be sent with the cookie. You can take a look at [this post](/blog/2020/11/25/how-to-install-dotnetcore-on-linux) to see how Okta ties into the app for authentication. The rest of this article will focus on the configuration strategies to deal with SameSite specifically within that application.

### Setting Cookie Authentication

In `Startup.cs`, `ConfigureServices(IServiceCollection services)` method.

```cs
services.AddAuthentication(options =>
{
    options.DefaultScheme = CookieAuthenticationDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = OpenIdConnectDefaults.AuthenticationScheme;
})
.AddCookie(options =>
{
    options.Cookie.SameSite = SameSiteMode.None;
    options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
    options.Cookie.IsEssential = true;
})
```

### Setting Session State Cookies

In `Startup.cs`, `ConfigureServices(IServiceCollection services)` method.

```cs
services.AddSession(options =>
{
    options.Cookie.SameSite = SameSiteMode.None;
    options.Cookie.SecurePolicy = CookieSecurePolicy.Always;
    options.Cookie.IsEssential = true;
});
```

### Intercepting Cookies

In `Startup.cs`, `Configure(IApplicationBuilder app, IWebHostEnvironment env)` method. Use `CookiePolicy` middleware to intercept cookies. It should be placed into the HTTP request pipeline before any components that write cookies.

```cs
public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
{
    if (env.IsDevelopment())
    {
        app.UseDeveloperExceptionPage();
    }
    else
    {
            app.UseExceptionHandler("/Home/Error");
            app.UseHsts();
    }
    app.UseHttpsRedirection();
    app.UseStaticFiles();
    app.UseRouting();
    app.UseAuthorization();
    app.UseCookiePolicy();
    app.UseForwardedHeaders(new ForwardedHeadersOptions
    {
        ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
    });

    app.UseAuthentication();
    app.UseEndpoints(endpoints =>
    {
        endpoints.MapControllerRoute(
            name: "default",
            pattern: "{controller=Home}/{action=Index}/{id?}");
    });
}
```

## Preparing the Linux Server

Now let's get started with configuration.

### Install .NET Core Runtime

```sh
wget https://packages.microsoft.com/config/ubuntu/20.04/packages-microsoft-prod.deb -O packages-microsoft-prod.deb
```

```sh
sudo dpkg -i packages-microsoft-prod.deb
```

```sh
sudo apt-get update; \
  sudo apt-get install -y apt-transport-https && \
  sudo apt-get update && \
  sudo apt-get install -y dotnet-sdk-3.1
```

### Installing Nginx Reverse Proxy

A reverse proxy is responsible for terminating the HTTP/HTTPS request and forwarding it to the ASP.NET Core app.

```sh
sudo apt-get update
```

```sh
sudo apt-get install nginx
```

### Configuring Nginx to use SSL

To make the Okta login work, we need to set up Nginx to handle HTTPS requests. I'll create self-signed certificates, however if you have your own certs for your own domain, you can skip this step.

#### Creating Self-Signed Certificates

```sh
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout /etc/ssl/private/nginx-selfsigned.key -out /etc/ssl/certs/nginx-selfsigned.crt
```

You can answer the questions with your own data. **Common Name** is the important line. You can add your own domain name or the server's IP address. You can get your server's IP address by running `hostname -I` command.

Output:

```sh
Output
Country Name (2 letter code) [AU]:US
State or Province Name (full name) [Some-State]:New York
Locality Name (eg, city) []:New York City
Organization Name (eg, company) [Internet Widgits Pty Ltd]:Bouncy Castles, Inc.
Organizational Unit Name (eg, section) []:Ministry of Water Slides
Common Name (e.g. server FQDN or YOUR name) []:server_IP_address
Email Address []:admin@your_domain.com
```

Creating a Diffie-Hellman group, which is used in negotiating [Perfect Forward Secrecy](https://en.wikipedia.org/wiki/Forward_secrecy) with clients. This may take a few minutes.

```sh
sudo openssl dhparam -out /etc/ssl/certs/dhparam.pem 2048
```

#### Updating Nginx Configuration

I have prepared a configuration file for this example. You can download and update the current Nginx config using:

```sh
sudo curl https://raw.githubusercontent.com/oktadeveloper/okta-netcore3-deploy-samesite-example/main/default > 
default
```

Open Nginx configuration file and change the **server_name** variable to match your server's IP address.

```sh
sudo nano /etc/nginx/sites-available/default
```

Your Nginx config should look like the following.

**Please note the 3 lines related to buffer size. These configurations are necessary to allocate enough buffers to read response headers.**

```sh
server {
    listen 443 ssl;
    listen [::]:443 ssl;

    location / {
        proxy_pass         https://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade $http_upgrade;
        proxy_set_header   Connection keep-alive;
        proxy_set_header   Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header   X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_buffer_size          128k;
        proxy_buffers              4 256k;
        proxy_busy_buffers_size    256k;
     }
    
    ssl_certificate /etc/ssl/certs/nginx-selfsigned.crt;
    ssl_certificate_key /etc/ssl/private/nginx-selfsigned.key;

    server_name 192.168.64.2; #Replace with your server's IP address or domain name

    ssl_protocols TLSv1.2;
    ssl_prefer_server_ciphers on;
    ssl_dhparam /etc/nginx/dhparam.pem;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA384;
    ssl_ecdh_curve secp384r1; # Requires nginx >= 1.1.0
    ssl_session_timeout  10m;
    ssl_session_cache shared:SSL:10m;
    ssl_session_tickets off; # Requires nginx >= 1.5.9
    ssl_stapling on; # Requires nginx >= 1.3.7
    ssl_stapling_verify on; # Requires nginx => 1.3.7
    resolver 8.8.8.8 8.8.4.4 valid=300s;
    resolver_timeout 5s;
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
}

server {
    listen 80;
    listen [::]:80;

    server_name 192.168.64.2;

    return 302 https://$server_name$request_uri;
}
```

### Adjusting the Firewall

You need to adjust the settings of the Firewall to allow SSL traffic.

```sh
sudo ufw allow 'Nginx Full'
```

### Enabling Changes in Nginx

Now that you've made your changes and adjusted the firewall, you can restart Nginx to implement your changes.

First, let's validate the configuration.

```sh
sudo nginx -t
```

Then restart Nginx to implement your changes.

```sh
sudo systemctl restart nginx
```

## Takeaways

To make sure [Okta redirect flows](https://developer.okta.com/docs/concepts/okta-hosted-flows) are working properly in a .NET Core 3.1 application that is running on Linux, we should take into account the following considerations:

- Make sure to set the `sameSite=None`attribute in the .NET Core application.
- The Linux server needs to handle HTTPS requests properly to support Okta redirect flows.
- Setting the  Nginx buffer size is critical to allocate enough buffer size to read response headers.

You can find this project code on [GitHub](https://github.com/oktadeveloper/okta-netcore3-deploy-samesite-example).

## Learn More About SameSite and .NET Core Apps on Linux

- [Install .NET Core Apps on Linux in 5 Minutes](/blog/2020/11/25/how-to-install-dotnetcore-on-linux)
- [How to Deploy Your .NET Core App to Google Cloud, AWS or Azure](/blog/2020/12/09/dotnet-cloud-host-publish)
- [How to Adapt Your .NET App for SameSite](/blog/2020/09/28/adapt-dotnet-app-for-samesite-fix)
- [Host ASP.NET Core on Linux with Nginx](https://docs.microsoft.com/en-us/aspnet/core/host-and-deploy/linux-nginx?view=aspnetcore-3.1)
- [Performance Profiling of .NET Core 3 applications on Linux with dotnet-trace and PerfView](https://michaelscodingspot.com/dotnet-trace)

If you like this topic, be sure to [follow us on Twitter](https://twitter.com/oktadev), subscribe to [our YouTube Channel](https://youtube.com/c/oktadev), and [follow us on Twitch](https://www.twitch.tv/oktadev).
