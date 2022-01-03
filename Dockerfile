FROM ruby:2.6.5

ENV LIBVIPS_VERSION=8.12.1

RUN apt-get update

# Handle encoding bugs
#
# The OS isn't setup to handle locales properly. Without this, Jekyll won't
# build correctly and will fail.
RUN apt-get install -y locales
RUN dpkg-reconfigure locales && \
    locale-gen C.UTF-8 && \
    /usr/sbin/update-locale LANG=C.UTF-8
RUN echo 'en_US.UTF-8 UTF-8' >> /etc/locale.gen && \
    locale-gen
ENV LC_ALL C.UTF-8
ENV LANG en_US.UTF-8
ENV LANGUAGE en_US.UTF-8

# Install Node
WORKDIR /node
RUN curl -sL https://deb.nodesource.com/setup_14.x | bash -
RUN apt-get install -y nodejs

# Install libvips for sharp
RUN cd /tmp && \
    wget "https://github.com/libvips/libvips/releases/download/v${LIBVIPS_VERSION}/vips-${LIBVIPS_VERSION}.tar.gz" && \
    tar xf "vips-${LIBVIPS_VERSION}.tar.gz" && \
    cd "vips-${LIBVIPS_VERSION}" && \
    ./configure && \
    make install && \
    ldconfig /usr/local/lib && \
    apt-get -y --purge autoremove && \
    apt-get -y clean && \
    rm -rf /usr/share/doc /usr/share/man /var/lib/apt/lists/* /root/* /tmp/* /var/tmp/*

# Ruby setup
RUN gem install bundler

# App setup
WORKDIR /app

ADD package.json /app/package.json
ADD package-lock.json /app/package-lock.json
RUN npm install

ADD Gemfile /app/Gemfile
ADD Gemfile.lock /app/Gemfile.lock
RUN bundle install
