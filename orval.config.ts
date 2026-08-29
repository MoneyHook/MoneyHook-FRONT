import { defineConfig } from 'orval'

export default defineConfig({
  moneyhooks: {
    input: './contracts/openapi.yaml',
    output: {
      mode: 'tags-split',
      target: './src/shared/api/generated/moneyhooks.ts',
      schemas: './src/shared/api/generated/model',
      client: 'react-query',
      httpClient: 'fetch',
      clean: true,
      override: {
        mutator: {
          path: './src/shared/api/http-client.ts',
          name: 'apiFetch',
        },
      },
    },
  },
})
