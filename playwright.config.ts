import { defineConfig, devices } from '@playwright/test'

const viteCommand = [
  'VITE_API_BASE_URL=http://localhost:8080',
  'VITE_FIREBASE_API_KEY=demo-api-key',
  'VITE_FIREBASE_AUTH_DOMAIN=demo-moneyhooks.firebaseapp.com',
  'VITE_FIREBASE_PROJECT_ID=demo-moneyhooks',
  'VITE_FIREBASE_APP_ID=1:123456789:web:moneyhooks',
  'VITE_FIREBASE_AUTH_EMULATOR_URL=http://localhost:9099',
  'pnpm dev --host 0.0.0.0',
].join(' ')

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: [
    {
      command:
        'docker compose -f ../moneyHook_api/compose.yaml -f ../moneyHook_api/compose.e2e.yaml up --build --force-recreate psql firebase go',
      url: 'http://localhost:8080',
      reuseExistingServer: false,
      timeout: 180_000,
    },
    {
      command: viteCommand,
      url: 'http://localhost:3000',
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
    },
  ],
})
