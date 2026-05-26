import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: true,
    include: ['tests/**/*.test.js'],
    coverage: {
      include: ['core/**/*.js', 'ui/**/*.js', 'utils/**/*.js', 'providers/**/*.js'],
    },
  },
});