import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3005",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "pnpm build && node .next/standalone/server.js",
    url: "http://localhost:3005",
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
    env: {
      HOSTNAME: "127.0.0.1",
      PORT: "3005",
      BACKEND_URL: "http://127.0.0.1:3000",
      PUBLIC_SUPPORT_INTEGRATION_KEY: "public-support-local",
      PUBLIC_BFF_CSRF_SECRET: "playwright-only-csrf-secret-with-32-characters",
      PUBLIC_COOKIE_SECURE: "false",
    },
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
  ],
});
