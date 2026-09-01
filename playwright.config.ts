import { defineConfig, devices } from '@playwright/test';

const baseURL = (process.env.E2E_BASE_URL ?? 'http://localhost:5173').replace(/\/$/, '');
const apiURL = (process.env.E2E_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');

export default defineConfig({
	testDir: './e2e',
	fullyParallel: false,
	forbidOnly: Boolean(process.env.CI),
	retries: process.env.CI ? 2 : 0,
	workers: 1,
	reporter: process.env.CI
		? [['line'], ['html', { open: 'never' }]]
		: [['list'], ['html', { open: 'never' }]],
	use: {
		baseURL,
		locale: 'fr-FR',
		timezoneId: 'Europe/Paris',
		trace: 'retain-on-failure',
		screenshot: 'only-on-failure',
		video: 'retain-on-failure',
	},
	projects: [
		{
			name: 'chromium',
			use: { ...devices['Desktop Chrome'] },
		},
	],
	webServer: [
		{
			command: 'bun run start',
			cwd: './apps/backend',
			env: {
				FRONTEND_ORIGIN: baseURL,
			},
			url: `${apiURL}/health`,
			reuseExistingServer: true,
			timeout: 120_000,
		},
		{
			command: 'bun run dev',
			cwd: './apps/frontend',
			env: {
				PUBLIC_API_URL: apiURL,
			},
			url: baseURL,
			reuseExistingServer: true,
			timeout: 120_000,
		},
	],
});
