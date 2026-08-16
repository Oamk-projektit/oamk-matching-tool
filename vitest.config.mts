import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const rootDir = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [tsconfigPaths()],
  resolve: {
    alias: {
      // Next marks this package as server-graph-only; stub it for Node tests.
      'server-only': resolve(rootDir, 'test/stubs/server-only.ts'),
    },
  },
  test: {
    environment: 'node',
    include: [
      'lib/**/*.test.ts',
      'types/**/*.test.ts',
      'app/**/*.test.ts',
      'test/integration/**/*.test.ts',
    ],
  },
})
