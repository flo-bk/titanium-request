setup:
	@npm install

clean:
	@rm -rf dist 2>/dev/null

dist:
	@mkdir -p dist 2>/dev/null
	@./node_modules/.bin/tetanize
	@mv titanium-request.js dist/request.js

tests:
	@./node_modules/.bin/mocha
