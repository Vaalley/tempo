import { describe, expect, it, vi } from 'vitest';
import { createAuthorizedApi } from './authorized-api';
import { createApiClient } from './client';

describe('authorized API', () => {
	it('creates a booking with the typed RPC payload', async () => {
		let method = '';
		let pathname = '';
		let requestBody: unknown;
		const client = createApiClient('http://tempo.test', {
			token: 'signed-token',
			fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
				const request = new Request(input, init);
				method = request.method;
				pathname = new URL(request.url).pathname;
				requestBody = await request.json();
				return Response.json(
					{
						id: 'booking-1',
						userId: 'user-1',
						workspaceId: 2,
						startAt: '2026-09-01T09:00:00.000Z',
						endAt: '2026-09-01T10:00:00.000Z',
						createdAt: '2026-08-31T12:00:00.000Z',
					},
					{ status: 201 },
				);
			},
		});
		const api = createAuthorizedApi({ getClient: () => client });
		const input = {
			workspaceId: 2,
			startAt: '2026-09-01T09:00:00.000Z',
			endAt: '2026-09-01T10:00:00.000Z',
		};

		const booking = await api.bookings.create(input);

		expect(method).toBe('POST');
		expect(pathname).toBe('/bookings');
		expect(requestBody).toEqual(input);
		expect(booking.id).toBe('booking-1');
	});

	it('sends a QR token to the typed check-in endpoint', async () => {
		let method = '';
		let pathname = '';
		let requestBody: unknown;
		const client = createApiClient('http://tempo.test', {
			token: 'signed-token',
			fetch: async (input: RequestInfo | URL, init?: RequestInit) => {
				const request = new Request(input, init);
				method = request.method;
				pathname = new URL(request.url).pathname;
				requestBody = await request.json();
				return Response.json({
					id: 'participant-1',
					bookingId: 'booking-1',
					userId: 'user-1',
					role: 'GUEST',
					invitationStatus: 'ACCEPTED',
					invitedAt: '2026-09-02T09:00:00.000Z',
					respondedAt: '2026-09-02T09:05:00.000Z',
					checkedInAt: '2026-09-02T10:00:00.000Z',
				});
			},
		});
		const api = createAuthorizedApi({ getClient: () => client });
		const token = 'a'.repeat(64);

		await api.bookings.checkIn('booking-1', { token });

		expect(method).toBe('POST');
		expect(pathname).toBe('/bookings/booking-1/check-in');
		expect(requestBody).toEqual({ token });
	});

	it('clears the session and redirects on 401', async () => {
		const onUnauthorized = vi.fn();
		const onForbidden = vi.fn();
		const client = createApiClient('http://tempo.test', {
			fetch: async () => Response.json({ error: 'Token expiré' }, { status: 401 }),
		});
		const api = createAuthorizedApi({
			getClient: () => client,
			onUnauthorized,
			onForbidden,
		});

		await expect(api.bookings.list()).rejects.toEqual(expect.objectContaining({ status: 401 }));
		expect(onUnauthorized).toHaveBeenCalledOnce();
		expect(onForbidden).not.toHaveBeenCalled();
	});

	it('redirects an unauthorized standard user on 403', async () => {
		const onUnauthorized = vi.fn();
		const onForbidden = vi.fn();
		const client = createApiClient('http://tempo.test', {
			fetch: async () => Response.json({ error: 'Admin access required' }, { status: 403 }),
		});
		const api = createAuthorizedApi({
			getClient: () => client,
			onUnauthorized,
			onForbidden,
		});

		await expect(api.users.list()).rejects.toEqual(expect.objectContaining({ status: 403 }));
		expect(onForbidden).toHaveBeenCalledOnce();
		expect(onUnauthorized).not.toHaveBeenCalled();
	});
});
