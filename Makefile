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
	@cp dist/request.js ./test/integration/app/Resources/request.js
	@ti build --project-dir ./test/integration/app -p android > ./test/integration/integration.test.log 2>&1 &
	@./node_modules/.bin/mocha -t 120000 test/integration/suite/*

test: test-unit test-integ

.PHONY: test dist
