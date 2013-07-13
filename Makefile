TESTS = test/*.test.js
REPORTER = spec
TIMEOUT = 5000
MOCHA_OPTS =

install:
	@npm install

test: install test-unit test-cov

test-unit: install
	@NODE_ENV=test ./node_modules/mocha/bin/mocha \
		--bail \
		--reporter $(REPORTER) \
		--timeout $(TIMEOUT) \
		$(MOCHA_OPTS) \
		$(TESTS)

test-cov:
	@rm -f coverage.html
	@$(MAKE) test-unit MOCHA_OPTS='--require blanket' REPORTER=html-cov > coverage.html
	@$(MAKE) test-unit MOCHA_OPTS='--require blanket' REPORTER=travis-cov

.PHONY: test test-unit test-cov
