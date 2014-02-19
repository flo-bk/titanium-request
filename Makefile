setup:
	@npm install

dist:
	@mkdir -p dist 2>/dev/null
	@./node_modules/.bin/tetanize
	@mv titanium-request.js dist/request.js

tests:
	@./node_modules/.bin/mocha
