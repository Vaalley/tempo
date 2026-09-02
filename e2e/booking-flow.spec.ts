import { expect, test } from '@playwright/test';

interface CreatedBookingResponse {
	id: string;
}

interface LoginResponse {
	token: string;
}

interface InvitationResponse {
	id: string;
}

interface QrCodeResponse {
	checkInUrl: string;
}

const apiURL = (process.env.E2E_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');
const userEmail = process.env.E2E_USER_EMAIL ?? 'user@tempo.test';
const userPassword = process.env.E2E_USER_PASSWORD ?? 'change-me-demo-user';
const adminEmail = process.env.E2E_ADMIN_EMAIL ?? 'admin@tempo.test';
const adminPassword = process.env.E2E_ADMIN_PASSWORD ?? 'change-me-demo-admin';
const workspaceName = process.env.E2E_WORKSPACE_NAME ?? 'Bureau Horizon';

function futureDate(): string {
	const date = new Date();
	date.setUTCFullYear(date.getUTCFullYear() + 2);
	date.setUTCDate(date.getUTCDate() + (Date.now() % 180));
	return date.toISOString().slice(0, 10);
}

test('connexion, réservation, consultation puis annulation', async ({ page, request }) => {
	let bookingId: string | undefined;
	let token: string | null = null;
	const browserErrors: string[] = [];

	page.on('pageerror', (error) => browserErrors.push(error.message));
	page.on('console', (message) => {
		if (message.type() === 'error') browserErrors.push(message.text());
	});

	try {
		await page.goto('/login');
		await page.waitForLoadState('networkidle');
		expect(browserErrors).toEqual([]);
		await page.getByRole('button', { name: "Pas de compte ? S'inscrire" }).click();
		await expect(page.getByText('Inscription', { exact: true })).toBeVisible();
		await page.getByRole('button', { name: 'Déjà un compte ? Se connecter' }).click();
		await expect(page.getByText('Connexion', { exact: true })).toBeVisible();
		await page.getByLabel('Email').fill(userEmail);
		await page.getByLabel('Mot de passe').fill(userPassword);
		await page.getByRole('button', { name: 'Se connecter' }).click();

		await expect(page).toHaveURL(/\/$/);
		await page.waitForLoadState('networkidle');
		await expect(page.getByText(userEmail)).toBeVisible();
		token = await page.evaluate(() => localStorage.getItem('token'));
		expect(token).toBeTruthy();

		await page.getByRole('link', { name: 'Accéder à mes réservations' }).click();
		await expect(page).toHaveURL(/\/bookings$/);
		await expect(page.getByRole('heading', { name: 'Mes réservations' })).toBeVisible();

		const date = futureDate();
		await page.getByRole('button', { name: 'Espace' }).click();
		await page.getByRole('option', { name: new RegExp(workspaceName) }).click();
		await page.getByLabel('Date de début').fill(date);
		await page.getByLabel('Heure de début').fill('13:37');
		await page.getByLabel('Date de fin').fill(date);
		await page.getByLabel('Heure de fin').fill('14:37');

		const creationResponsePromise = page.waitForResponse(
			(response) =>
				response.url() === `${apiURL}/bookings` && response.request().method() === 'POST',
		);
		await page.getByRole('button', { name: 'Réserver' }).click();
		const creationResponse = await creationResponsePromise;
		expect(creationResponse.status()).toBe(201);

		const createdBooking = (await creationResponse.json()) as CreatedBookingResponse;
		bookingId = createdBooking.id;
		const bookingRow = page.locator(`[data-booking-id="${bookingId}"]`);

		await expect(bookingRow).toBeVisible();
		await expect(bookingRow).toContainText(workspaceName);
		await expect(bookingRow).toContainText('À venir');

		page.once('dialog', (dialog) => dialog.accept());
		const deletionResponsePromise = page.waitForResponse(
			(response) =>
				response.url() === `${apiURL}/bookings/${bookingId}` &&
				response.request().method() === 'DELETE',
		);
		await bookingRow.getByRole('button', { name: 'Annuler' }).click();
		const deletionResponse = await deletionResponsePromise;
		expect(deletionResponse.status()).toBe(200);
		await expect(bookingRow).toHaveCount(0);
		bookingId = undefined;
	} finally {
		if (bookingId && token) {
			await request.delete(`${apiURL}/bookings/${bookingId}`, {
				headers: { Authorization: `Bearer ${token}` },
			});
		}
	}
});

test('invitation à une réservation publique et check-in par QR code', async ({ page, request }) => {
	let bookingId: string | undefined;
	let adminToken = '';

	try {
		const loginResponse = await request.post(`${apiURL}/auth/login`, {
			data: { email: adminEmail, password: adminPassword },
		});
		expect(loginResponse.status()).toBe(200);
		adminToken = ((await loginResponse.json()) as LoginResponse).token;

		const workspacesResponse = await request.get(`${apiURL}/workspaces`, {
			headers: { Authorization: `Bearer ${adminToken}` },
		});
		expect(workspacesResponse.status()).toBe(200);
		const workspaces = (await workspacesResponse.json()) as Array<{
			id: number;
			capacity: number;
		}>;
		const collaborativeWorkspace = workspaces.find((workspace) => workspace.capacity >= 2);
		expect(collaborativeWorkspace).toBeDefined();
		if (!collaborativeWorkspace) throw new Error('No collaborative workspace available');

		const startAt = new Date(Date.now() - 2 * 60 * 1000);
		const endAt = new Date(Date.now() + 58 * 60 * 1000);
		const creationResponse = await request.post(`${apiURL}/bookings`, {
			headers: { Authorization: `Bearer ${adminToken}` },
			data: {
				workspaceId: collaborativeWorkspace.id,
				startAt: startAt.toISOString(),
				endAt: endAt.toISOString(),
				visibility: 'PUBLIC',
			},
		});
		expect(creationResponse.status()).toBe(201);
		bookingId = ((await creationResponse.json()) as CreatedBookingResponse).id;

		const invitationResponse = await request.post(
			`${apiURL}/bookings/${bookingId}/invitations`,
			{
				headers: { Authorization: `Bearer ${adminToken}` },
				data: { email: userEmail },
			},
		);
		expect(invitationResponse.status()).toBe(201);
		const invitation = (await invitationResponse.json()) as InvitationResponse;

		await page.goto('/login');
		await page.waitForLoadState('networkidle');
		await page.getByLabel('Email').fill(userEmail);
		await page.getByLabel('Mot de passe').fill(userPassword);
		await page.getByRole('button', { name: 'Se connecter' }).click();
		await expect(page).toHaveURL(/\/$/);
		await page.waitForLoadState('networkidle');
		await page.getByRole('link', { name: 'Accéder à mes réservations' }).click();

		const bookingRow = page.locator(`[data-booking-id="${bookingId}"]`);
		await expect(bookingRow).toBeVisible();
		await expect(bookingRow).toContainText('Publique');
		const acceptanceResponsePromise = page.waitForResponse(
			(response) =>
				response.url() === `${apiURL}/bookings/${bookingId}/invitations/${invitation.id}` &&
				response.request().method() === 'PATCH',
		);
		await bookingRow.getByRole('button', { name: 'Accepter' }).click();
		expect((await acceptanceResponsePromise).status()).toBe(200);

		const qrResponse = await request.post(`${apiURL}/bookings/${bookingId}/qr`, {
			headers: { Authorization: `Bearer ${adminToken}` },
		});
		expect(qrResponse.status()).toBe(200);
		const qrCode = (await qrResponse.json()) as QrCodeResponse;
		await page.goto(qrCode.checkInUrl);
		await expect(page.getByRole('heading', { name: 'Présence confirmée' })).toBeVisible();
	} finally {
		if (bookingId && adminToken) {
			await request.delete(`${apiURL}/bookings/${bookingId}`, {
				headers: { Authorization: `Bearer ${adminToken}` },
			});
		}
	}
});
