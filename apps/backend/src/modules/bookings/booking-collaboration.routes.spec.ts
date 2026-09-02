import { afterEach, describe, expect, it, mock, spyOn } from 'bun:test';
import { sign } from 'hono/jwt';
import { bookingParticipantsService } from './booking-participants.service';
import { checkInService } from './check-in.service';

process.env.JWT_SECRET = 'test-jwt-secret';
process.env.FRONTEND_ORIGIN = 'http://localhost:5173';

const { default: bookingsRoute } = await import('./bookings.route');

const bookingId = '11111111-1111-4111-8111-111111111111';
const participantId = '22222222-2222-4222-8222-222222222222';
const userId = '33333333-3333-4333-8333-333333333333';

async function authorizationHeader(role: 'ADMIN' | 'USER' = 'USER'): Promise<string> {
	const token = await sign(
		{
			sub: userId,
			email: 'user@tempo.test',
			role,
			exp: Math.floor(Date.now() / 1000) + 60,
		},
		'test-jwt-secret',
	);

	return `Bearer ${token}`;
}

afterEach(() => {
	mock.restore();
});

describe('booking collaboration HTTP routes', () => {
	it('invites an existing user as the booking owner', async () => {
		const participant = {
			id: participantId,
			bookingId,
			userId: '44444444-4444-4444-8444-444444444444',
			role: 'GUEST' as const,
			invitationStatus: 'PENDING' as const,
			invitedAt: new Date('2026-09-02T08:00:00.000Z'),
			respondedAt: null,
			checkedInAt: null,
			user: {
				id: '44444444-4444-4444-8444-444444444444',
				email: 'guest@tempo.test',
				role: 'USER' as const,
			},
		};
		const invite = spyOn(bookingParticipantsService, 'invite').mockResolvedValue(participant);

		const response = await bookingsRoute.request(`/${bookingId}/invitations`, {
			method: 'POST',
			headers: {
				Authorization: await authorizationHeader(),
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ email: participant.user.email }),
		});

		expect(response.status).toBe(201);
		expect(invite).toHaveBeenCalledWith(bookingId, userId, 'USER', participant.user.email);
	});

	it('refuses joining a private booking', async () => {
		spyOn(bookingParticipantsService, 'joinPublic').mockRejectedValue(
			new Error('BOOKING_PRIVATE'),
		);

		const response = await bookingsRoute.request(`/${bookingId}/join`, {
			method: 'POST',
			headers: { Authorization: await authorizationHeader() },
		});

		expect(response.status).toBe(403);
		expect(await response.json()).toEqual({ error: 'Cette réservation est privée' });
	});

	it('allows the invited user to accept an invitation', async () => {
		const respond = spyOn(bookingParticipantsService, 'respond').mockResolvedValue({
			id: participantId,
			bookingId,
			userId,
			role: 'GUEST',
			invitationStatus: 'ACCEPTED',
			invitedAt: new Date('2026-09-02T08:00:00.000Z'),
			respondedAt: new Date('2026-09-02T08:05:00.000Z'),
			checkedInAt: null,
		});

		const response = await bookingsRoute.request(`/${bookingId}/invitations/${participantId}`, {
			method: 'PATCH',
			headers: {
				Authorization: await authorizationHeader(),
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ status: 'ACCEPTED' }),
		});

		expect(response.status).toBe(200);
		expect(respond).toHaveBeenCalledWith(bookingId, participantId, userId, 'ACCEPTED');
	});

	it('rejects a check-in before the booking starts', async () => {
		spyOn(checkInService, 'checkIn').mockRejectedValue(new Error('CHECK_IN_TOO_EARLY'));

		const response = await bookingsRoute.request(`/${bookingId}/check-in`, {
			method: 'POST',
			headers: {
				Authorization: await authorizationHeader(),
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ token: 'a'.repeat(64) }),
		});

		expect(response.status).toBe(409);
		expect(await response.json()).toEqual({ error: "Le check-in n'est pas encore ouvert" });
	});

	it('prevents a non-owner from generating the QR code', async () => {
		spyOn(checkInService, 'generateQr').mockRejectedValue(new Error('UNAUTHORIZED'));

		const response = await bookingsRoute.request(`/${bookingId}/qr`, {
			method: 'POST',
			headers: { Authorization: await authorizationHeader() },
		});

		expect(response.status).toBe(403);
		expect(await response.json()).toEqual({ error: 'Action non autorisée' });
	});
});
