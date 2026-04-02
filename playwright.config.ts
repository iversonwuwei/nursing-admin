import { defineConfig, devices } from '@playwright/test'

const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000'
const parsedBaseURL = new URL(baseURL)
const devPort = parsedBaseURL.port || '3000'
const nextAuthUrl = process.env.NEXTAUTH_URL ?? baseURL
const webServerCommand = process.env.PLAYWRIGHT_WEB_SERVER_COMMAND
  ?? `AUTH_SECRET=playwright-smoke-secret AUTH_TRUST_HOST=true NEXTAUTH_URL=${nextAuthUrl} npm run dev -- --port ${devPort}`

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],
  webServer: {
    command: webServerCommand,
    url: baseURL,
    reuseExistingServer: true,
    timeout: 120000,
  },
})