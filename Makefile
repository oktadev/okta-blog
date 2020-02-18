build:
	docker build . -t okta-blog

develop:
	docker run -p 4000:4000 -v $(PWD):/app -it okta-blog npm start
