module Jekyll
    # A simple tag for Speakerdeck include using official script
    class SpeakerdeckTag < Liquid::Tag
      def initialize(name, args, tokens)
        super
        @id = parse_id(args)
        @width = parse_width(args)
      end

      def render(context)
        %(<div class="jekyll-speakerdeck-plugin" style="margin: 0 auto 1.25rem auto; max-width: #{@width}">
            <script async class="speakerdeck-embed" data-id="#{@id}" data-ratio="1.77777777777778" src="//speakerdeck.com/assets/embed.js"></script>
            <noscript>
                <a href="//speakerdeck.com/player/#{@id}">
                <img alt="Speakerdeck" class="lozad" src="{{ site.baseurl }}/assets/images/placeholder.jpg" data-src="//speakerd.s3.amazonaws.com/presentations/#{@id}/slide_0.jpg">
                </a>
            </noscript>
          </div>)
      end

      def parse_id(input)
        id = input.split.first
        id = id.strip.tr('"', '')
        id
      end

      def parse_width(input)
        _, width = input.split
        if width.nil? or width.empty?
          "700px"
        else
          width
        end
      end
    end
  end

  Liquid::Template.register_tag('speakerdeck', Jekyll::SpeakerdeckTag)
