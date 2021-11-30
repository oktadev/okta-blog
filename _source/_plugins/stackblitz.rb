module Jekyll
    class StackBlitzTag < Liquid::Tag
        def initialize(name, id, tokens)
            super
            @id = parse_id(id)
            @type = set_type(id)
            @file = parse_file(id)
        end

        def render(context)
            %(<p>
                <iframe src="https://stackblitz.com/#{@type}/#{@id}?embed=1&amp;#{@file}" width="100%" height="500" scrolling="no" frameborder="no" allowfullscreen="" allowtransparency="true" loading="lazy">
                </iframe>
            </p>)
        end

        private

        def parse_id(input)
            id_param = input.split.first
            raise StandardError, "Invalid StackBlitz id" unless id_param.match(/^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){4,38}\/[\w.-]{1,100}(?:\/tree\/[\w.\/-]+)?$|\A[a-zA-Z0-9\-]{0,60}\z/i)
            id_param
        end

        def set_type(input)
            id_param = input.split.first
            type = id_param.match(/\A[a-zA-Z0-9\-]{0,60}\z/) ? 'edit' : 'github'
            type
        end

        def parse_file(input)
            params = input.split
            file_param = params.length() > 1 ? params[1] : ''

            raise StandardError, "Invalid StackBlitz file option" unless file_param.match(/^$|\Afile=(.*)\z/)

            file_param
        end
    end
end

Liquid::Template.register_tag("stackblitz", Jekyll::StackBlitzTag)
