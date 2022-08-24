module Okta
  Jekyll::Hooks.register(:posts, :post_render) do |post|
    post.output.gsub!('<img src="', '<img loading="lazy" src="')
  end
end
