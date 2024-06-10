module Jekyll
  # A simple tag for YouTube include using an iframe
    class ExcerptTag < Liquid::Tag
      def initialize(_tag_name, url, _tokens)
        super
        @article_id = url.strip
      end

      def render(context)
        posts = context.registers[:site].posts
        post = posts.docs.find {|doc| doc.id == @article_id}

        if !post.nil?
          title = post['title']
          # one day figure out how to add author
          author_id = post['author']
          author = context.registers[:site].data['authors'][author_id]
          avatar = author['avatar']
          display_name = author['full_name']
          description = post['description']

          if (description.nil?)
            # Use excerpt in cases description doesn't exist. One day truncate text...
            description = post['excerpt']
          end

          img=Liquid::Template.parse("{% img '#{avatar}' alt:'avatar-#{avatar}' class:BlogPost-avatar %}").render(context)

          %(<article class="link-container" style="border: 1px solid silver; border-radius: 3px; padding: 12px 15px">
              <a href='#{@article_id}' style="font-size: 1.375em; margin-bottom: 20px;">
                <span>#{title}</span>
              </a>
              <p>#{description}</p>
              <div class="BlogPost-attribution">
                <a href='/blog/authors/#{author_id}/'>
                  #{img}
                </a>
                <span class="BlogPost-author">
                    <a href='/blog/authors/#{author_id}/'>#{display_name}</a>
                </span>
            </div>
          </article>)
        else
          %(<div class="link-container">
              <a href='#{@article_id}'>Article not found!</a>
          </div>)
        end
      end
    end
  end

  Liquid::Template.register_tag('excerpt', Jekyll::ExcerptTag)
