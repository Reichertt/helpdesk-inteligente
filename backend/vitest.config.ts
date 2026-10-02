import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts'],
    setupFiles: ['tests/setup-env.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/services/**', 'src/ai/**'],
      reporter: ['text', 'html'],
    },
  },
});
