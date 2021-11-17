module Jekyll
    # A simple tag for Speakerdeck include using official script
    class SpeakerdeckTag < Liquid::Tag
      @@width = 640
      @@height = 510

      def initialize(name, id, tokens)
        super
        @id = id
      end

      def render(context)
        @id_stripped = @id.strip.tr('"', '')
        %(<p>
            <script async class="speakerdeck-embed" data-id="#{@id_stripped}" data-ratio="1.77777777777778" src="//speakerdeck.com/assets/embed.js"></script>
            <noscript>
                <a href="//speakerdeck.com/player/#{@id_stripped}">
                <img alt="Speakerdeck" class="lozad" src="{{ site.baseurl }}/assets/images/placeholder.jpg" data-src="//speakerd.s3.amazonaws.com/presentations/#{@id_stripped}/slide_0.jpg">
                </a>
            </noscript>
          </p>)
      end
    end
  end

  Liquid::Template.register_tag('speakerdeck', Jekyll::SpeakerdeckTag)
