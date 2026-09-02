import { and, eq } from 'drizzle-orm';
import QRCode from 'qrcode';
import { db } from '../../db';
import { bookingParticipants, bookingQrTokens, bookings } from '../../db/schema';

type UserRole = 'ADMIN' | 'USER';

function hashToken(token: string): string {
	return new Bun.CryptoHasher('sha256').update(token).digest('hex');
}

function createToken(): string {
	const bytes = crypto.getRandomValues(new Uint8Array(32));
	return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function getFrontendOrigin(): string {
	const origin = process.env.FRONTEND_ORIGIN?.trim();

	if (!origin) throw new Error('FRONTEND_ORIGIN_NOT_CONFIGURED');

	return origin.replace(/\/$/, '');
}

export const checkInService = {
	async generateQr(bookingId: string, actorId: string, actorRole: UserRole) {
		const booking = await db.query.bookings.findFirst({
			where: eq(bookings.id, bookingId),
		});

		if (!booking) throw new Error('BOOKING_NOT_FOUND');
		if (actorRole !== 'ADMIN' && booking.userId !== actorId) {
			throw new Error('UNAUTHORIZED');
		}
		if (booking.endAt <= new Date()) throw new Error('BOOKING_ENDED');

		const token = createToken();
		const tokenHash = hashToken(token);
		const checkInUrl = `${getFrontendOrigin()}/check-in#bookingId=${encodeURIComponent(
			bookingId,
		)}&token=${encodeURIComponent(token)}`;
		const qrCodeDataUrl = await QRCode.toDataURL(checkInUrl, {
			errorCorrectionLevel: 'M',
			margin: 2,
			width: 320,
		});

		await db
			.insert(bookingQrTokens)
			.values({
				bookingId,
				tokenHash,
				expiresAt: booking.endAt,
			})
			.onConflictDoUpdate({
				target: bookingQrTokens.bookingId,
				set: {
					tokenHash,
					createdAt: new Date(),
					expiresAt: booking.endAt,
				},
			});

		return {
			bookingId,
			checkInUrl,
			qrCodeDataUrl,
			expiresAt: booking.endAt,
		};
	},

	async checkIn(bookingId: string, userId: string, token: string) {
		const participant = await db.query.bookingParticipants.findFirst({
			where: and(
				eq(bookingParticipants.bookingId, bookingId),
				eq(bookingParticipants.userId, userId),
			),
			with: { booking: true },
		});

		if (!participant) throw new Error('PARTICIPANT_NOT_FOUND');
		if (participant.invitationStatus !== 'ACCEPTED') {
			throw new Error('INVITATION_NOT_ACCEPTED');
		}

		const now = new Date();
		if (now < participant.booking.startAt) throw new Error('CHECK_IN_TOO_EARLY');
		if (now >= participant.booking.endAt) throw new Error('BOOKING_ENDED');

		const qrToken = await db.query.bookingQrTokens.findFirst({
			where: eq(bookingQrTokens.bookingId, bookingId),
		});

		if (!qrToken || qrToken.expiresAt <= now || qrToken.tokenHash !== hashToken(token)) {
			throw new Error('INVALID_QR_TOKEN');
		}

		const [checkedInParticipant] = await db
			.update(bookingParticipants)
			.set({ checkedInAt: now })
			.where(eq(bookingParticipants.id, participant.id))
			.returning();

		return checkedInParticipant;
	},
};
