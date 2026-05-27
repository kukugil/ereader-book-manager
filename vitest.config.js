const { defineConfig } = require('vitest/config');

module.exports = defineConfig({
  test: {
    globals: false,
    include: ['test/**/*.test.{js,mjs}'],
    testTimeout: 15000,
  },
});
