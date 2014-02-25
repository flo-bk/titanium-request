setup:
	@npm install

clean:
	@rm -rf dist 2>/dev/null

dist:
	@mkdir -p dist 2>/dev/null
	@./node_modules/.bin/tetanize
	@mv titanium-request.js dist/request.js

test-unit:
	@./node_modules/.bin/mocha

test-integ: dist
	@cp dist/request.js ./test/integration/Resources/request.js
	@ti build --project-dir ./test/integration -p android

test: test-unit test-integ

.PHONY: test dist
