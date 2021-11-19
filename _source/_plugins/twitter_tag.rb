# frozen_string_literal: true
require "fileutils"
require "net/http"
require "uri"
require "ostruct"
require "json"
require "digest"

##
# A Liquid tag plugin for Jekyll that renders Tweets from Twitter API.
# Adapted from https://github.com/rob-murray/jekyll-twitter-plugin
#
module Jekyll
  PL_VERSION = "2.0.0".freeze
  LIBRARY_VERSION   = "jekyll-twitter-plugin-v#{PL_VERSION}".freeze
  REQUEST_HEADERS   = { "User-Agent" => LIBRARY_VERSION }.freeze

  # Wrapper around an API
  # @api private
  class ApiClient
    # Perform API request; return hash with html content
    def fetch(api_request)
      uri = api_request.to_uri
      response = Net::HTTP.start(uri.host, use_ssl: api_request.ssl?) do |http|
        http.read_timeout = 5
        http.open_timeout = 5
        http.get uri.request_uri, REQUEST_HEADERS
      end

      handle_response(api_request, response)

    rescue Timeout::Error => e
      ErrorResponse.new(api_request, e.class.name).to_h
    end

    private

    def handle_response(api_request, response)
      case response
      when Net::HTTPSuccess
        JSON.parse(response.body)
      else
        ErrorResponse.new(api_request, response.message).to_h
      end
    end
  end

  # @api private
  ErrorResponse = Struct.new(:request, :message) do
    def html
      "<p>There was a '#{message}' error fetching URL: '#{request.entity_url}'</p>"
    end

    def to_h
      { html: html }
    end
  end

  # Holds the URI were going to request with any parameters
  # @api private
  ApiRequest = Struct.new(:entity_url) do
    TWITTER_API_URL = "https://publish.twitter.com/oembed".freeze
    TWITTER_API_FETCH_URL = "https://api.twitter.com/1.1/statuses/show.json".freeze

    # Always;
    def ssl?
      true
    end

    # Return a URI for Twitter API with query params
    def to_uri
      URI.parse(TWITTER_API_URL).tap do |uri|
        uri.query = URI.encode_www_form({"url" => entity_url})
      end
    end
  end

  # Class to respond to Jekyll tag; entry point to library
  # @api public
  class TwitterTag < Liquid::Tag
    ERROR_BODY_TEXT = "<p>Tweet could not be processed</p>".freeze

    attr_writer :cache # for testing

    def initialize(_name, params, _tokens)
      super
      @api_request = parse_params(params)
    end

    # Return html string for Jekyll engine
    # @api public
    def render(context)
      html_output_for(live_response)
    end

    private

    def api_client
      @api_client ||= ApiClient.new
    end

    # Return Twitter response or error html
    # @api private
    def html_output_for(response)
      body = (response.html if response) || ERROR_BODY_TEXT

      "<div class='jekyll-twitter-plugin'>#{body}</div>"

    end

    # Return response from API
    # @api private
    def live_response
      if response = api_client.fetch(@api_request)
        build_response(response)
      end
    end

    # Return an `ApiRequest` with the url and arguments
    # @api private
    def parse_params(params)
      args = params.split(/\s+/).map(&:strip)
      invalid_args!(args) unless args.any?

      id, *api_args = args
      url = get_url(id)
      ApiRequest.new(url)
    end

    def get_url(id)
        # Twiiter automatically redirects and fetches the correct tweet by id
        "https://twitter.com/dummyuser/status/#{id}"
    end

    # Format a response hash
    # @api private
    def build_response(h)
      OpenStruct.new(h)
    end

    # Raise error for invalid arguments
    # @api private
    def invalid_args!(arguments)
      formatted_args = Array(arguments).join(" ")
      raise ArgumentError, "Invalid arguments '#{formatted_args}' passed to 'jekyll-twitter-plugin'."
    end
  end
end

Liquid::Template.register_tag("twitter", Jekyll::TwitterTag)
