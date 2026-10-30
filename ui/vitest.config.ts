import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['packages/*/src/**/*.test.ts'],
    environment: 'node',
    server: {
      deps: {
        // Workspace packages ship TS source (main: src/index.ts) — inline them
        // so Vite transforms them instead of externalizing to Node.
        inline: [/@exia\//],
      },
    },
  },
});
