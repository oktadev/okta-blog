# Build the blog for production deploys
build:
	docker build . -t okta-blog

# Run the blog locally as a development server
develop:
	docker run -p 4000:4000 -v $(PWD):/app -it okta-blog npm start
