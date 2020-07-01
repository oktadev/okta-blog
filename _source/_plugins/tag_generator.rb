Jekyll::Hooks.register :posts, :post_write do |post|

  # Set this to true to rebuild all the files in _source/_tags/*.md
  rebuild_all = false

  if rebuild_all
    all_existing_tags = []
  else
    all_existing_tags = Dir.entries("_source/_tags")
      .map { |t| t.match(/(.*).md/) }
      .compact.map { |m| m[1] }
  end

  tags = post['tags'].reject { |t| t.empty? }
  tags.each do |tag|
    sanitized_tag = sanitize_tag_name(tag)
    if tag == sanitized_tag
      generate_tag_file(tag) if !all_existing_tags.include?(tag)
    else
      raise "Invalid tag: #{tag} in #{File.basename(post.path)}\nTry changing to #{sanitized_tag}"
    end
  end
end

def sanitize_tag_name(tag)
  return tag.downcase.gsub(/[^a-z0-9-]/, '-').gsub(/--+/, '-').strip
end

def generate_tag_file(tag)
  File.open("_source/_tags/#{tag}.md", "wb") do |file|
    file << "---\nlayout: tag\ntag: #{tag}\n---\n"
  end
end
