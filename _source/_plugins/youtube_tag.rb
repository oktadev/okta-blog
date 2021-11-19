module Jekyll
  # A simple tag for YouTube include using an iframe
    class YoutubeTag < Liquid::Tag

      def initialize(name, args, tokens)
        super
        @id = parse_id(args)
        @width = parse_width(args)
        @height = parse_height(args)
      end

      def render(context)
        %(<div class="jekyll-youtube-plugin" style="text-align: center; margin-bottom: 1.25rem">
            <iframe width="#{@width}" height="#{@height}" style="max-width: 100%" src="https://www.youtube.com/embed/#{@id}" allowfullscreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" frameborder="0"></iframe>
        </div>)
      end

      def parse_id(input)
        id = input.split.first
        id
      end

      def parse_width(input)
        _, width = input.split
        if width.nil? or width.empty?
          "700"
        else
          width
        end
      end

      def parse_height(input)
        _, width, height = input.split
        if height.nil? or height.empty?
          if width.nil? or width.empty?
            "394"
          else
            height = width.to_i * 0.56
            height.round()
          end
        else
          height
        end
      end
    end
  end

  Liquid::Template.register_tag('youtube', Jekyll::YoutubeTag)
