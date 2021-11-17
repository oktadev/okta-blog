module Jekyll
  # A simple tag for YouTube include using an iframe
    class YoutubeTag < Liquid::Tag

      def initialize(name, id, tokens)
        super
        @id = id
      end

      def render(context)
        %(<p>
            <div class="embed-video-container" style="text-align: center;">
                <iframe width="700" height="394" style="max-width: 100%" src="https://www.youtube.com/embed/#{@id}" allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" frameborder="0"></iframe>
            </div>
        </p>)
      end
    end
  end

  Liquid::Template.register_tag('youtube', Jekyll::YoutubeTag)
