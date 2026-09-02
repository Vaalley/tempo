import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { bookingService } from './bookings.service';
import { authGuard, type AuthEnv } from '../../middlewares/auth.guard';
import {
	bookingIdParamSchema,
	checkInSchema,
	createBookingSchema,
	invitationIdParamSchema,
	inviteParticipantSchema,
	respondInvitationSchema,
} from './bookings.dto';
import { auditService } from '../audit/audit.service';
import { bookingParticipantsService } from './booking-participants.service';
import { checkInService } from './check-in.service';

const app = new Hono<AuthEnv>()
	// Protect all /bookings routes with JWT.
	.use('*', authGuard)
	// GET /bookings - List all bookings (admin) or user's bookings (user)
	.get('/', async (c) => {
		const payload = c.get('jwtPayload');

		if (payload.role === 'ADMIN') {
			const allBookings = await bookingService.getAll();
			return c.json(allBookings);
		}

		const userBookings = await bookingService.getByUser(payload.sub);
		return c.json(userBookings);
	})
	// POST /bookings - Create a booking
	.post('/', zValidator('json', createBookingSchema), async (c) => {
		try {
			const payload = c.get('jwtPayload');
			const data = c.req.valid('json');

			const booking = await bookingService.create(payload.sub, data);
			return c.json(booking, 201);
		} catch (error) {
			console.error('Booking creation error:', error);
			if (error instanceof Error) {
				if (error.message === 'WORKSPACE_NOT_FOUND') {
					return c.json({ error: 'Workspace not found' }, 404);
				}
				if (error.message === 'BOOKING_OVERLAP') {
					return c.json(
						{ error: 'This workspace is already booked for this time slot' },
						409,
					);
				}
			}
			return c.json({ error: 'Server error' }, 500);
		}
	})
	// POST /bookings/:id/invitations - Invite an existing user
	.post(
		'/:id/invitations',
		zValidator('param', bookingIdParamSchema),
		zValidator('json', inviteParticipantSchema),
		async (c) => {
			try {
				const payload = c.get('jwtPayload');
				const { id } = c.req.valid('param');
				const { email } = c.req.valid('json');
				const participant = await bookingParticipantsService.invite(
					id,
					payload.sub,
					payload.role,
					email,
				);

				return c.json(participant, 201);
			} catch (error) {
				if (error instanceof Error) {
					if (
						error.message === 'BOOKING_NOT_FOUND' ||
						error.message === 'USER_NOT_FOUND'
					) {
						return c.json({ error: 'Réservation ou utilisateur introuvable' }, 404);
					}
					if (error.message === 'UNAUTHORIZED') {
						return c.json({ error: 'Action non autorisée' }, 403);
					}
					if (
						error.message === 'OWNER_ALREADY_PARTICIPANT' ||
						error.message === 'PARTICIPANT_EXISTS'
					) {
						return c.json(
							{ error: 'Cet utilisateur participe déjà à la réservation' },
							409,
						);
					}
					if (error.message === 'BOOKING_FULL') {
						return c.json({ error: 'La capacité de la réservation est atteinte' }, 409);
					}
					if (error.message === 'BOOKING_ENDED') {
						return c.json({ error: 'Cette réservation est terminée' }, 409);
					}
				}

				return c.json({ error: 'Server error' }, 500);
			}
		},
	)
	// PATCH /bookings/:id/invitations/:participantId - Accept or decline an invitation
	.patch(
		'/:id/invitations/:participantId',
		zValidator('param', invitationIdParamSchema),
		zValidator('json', respondInvitationSchema),
		async (c) => {
			try {
				const payload = c.get('jwtPayload');
				const { id, participantId } = c.req.valid('param');
				const { status } = c.req.valid('json');
				const participant = await bookingParticipantsService.respond(
					id,
					participantId,
					payload.sub,
					status,
				);

				return c.json(participant);
			} catch (error) {
				if (error instanceof Error) {
					if (error.message === 'PARTICIPANT_NOT_FOUND') {
						return c.json({ error: 'Invitation introuvable' }, 404);
					}
					if (error.message === 'UNAUTHORIZED') {
						return c.json({ error: 'Action non autorisée' }, 403);
					}
					if (error.message === 'BOOKING_ENDED') {
						return c.json({ error: 'Cette réservation est terminée' }, 409);
					}
				}

				return c.json({ error: 'Server error' }, 500);
			}
		},
	)
	// POST /bookings/:id/join - Join a public booking
	.post('/:id/join', zValidator('param', bookingIdParamSchema), async (c) => {
		try {
			const payload = c.get('jwtPayload');
			const { id } = c.req.valid('param');
			const participant = await bookingParticipantsService.joinPublic(id, payload.sub);
			return c.json(participant, 201);
		} catch (error) {
			if (error instanceof Error) {
				if (error.message === 'BOOKING_NOT_FOUND') {
					return c.json({ error: 'Réservation introuvable' }, 404);
				}
				if (error.message === 'BOOKING_PRIVATE') {
					return c.json({ error: 'Cette réservation est privée' }, 403);
				}
				if (error.message === 'PARTICIPANT_EXISTS') {
					return c.json({ error: 'Vous participez déjà à cette réservation' }, 409);
				}
				if (error.message === 'BOOKING_FULL') {
					return c.json({ error: 'La capacité de la réservation est atteinte' }, 409);
				}
				if (error.message === 'BOOKING_ENDED') {
					return c.json({ error: 'Cette réservation est terminée' }, 409);
				}
			}

			return c.json({ error: 'Server error' }, 500);
		}
	})
	// POST /bookings/:id/qr - Rotate and display the booking QR code
	.post('/:id/qr', zValidator('param', bookingIdParamSchema), async (c) => {
		try {
			const payload = c.get('jwtPayload');
			const { id } = c.req.valid('param');
			const qrCode = await checkInService.generateQr(id, payload.sub, payload.role);
			return c.json(qrCode);
		} catch (error) {
			if (error instanceof Error) {
				if (error.message === 'BOOKING_NOT_FOUND') {
					return c.json({ error: 'Réservation introuvable' }, 404);
				}
				if (error.message === 'UNAUTHORIZED') {
					return c.json({ error: 'Action non autorisée' }, 403);
				}
				if (error.message === 'BOOKING_ENDED') {
					return c.json({ error: 'Cette réservation est terminée' }, 409);
				}
			}

			return c.json({ error: 'Server error' }, 500);
		}
	})
	// POST /bookings/:id/check-in - Validate attendance from a QR token
	.post(
		'/:id/check-in',
		zValidator('param', bookingIdParamSchema),
		zValidator('json', checkInSchema),
		async (c) => {
			try {
				const payload = c.get('jwtPayload');
				const { id } = c.req.valid('param');
				const { token } = c.req.valid('json');
				const participant = await checkInService.checkIn(id, payload.sub, token);
				return c.json(participant);
			} catch (error) {
				if (error instanceof Error) {
					if (error.message === 'PARTICIPANT_NOT_FOUND') {
						return c.json({ error: 'Vous ne participez pas à cette réservation' }, 403);
					}
					if (error.message === 'INVITATION_NOT_ACCEPTED') {
						return c.json(
							{ error: "L'invitation doit être acceptée avant le check-in" },
							409,
						);
					}
					if (error.message === 'CHECK_IN_TOO_EARLY') {
						return c.json({ error: "Le check-in n'est pas encore ouvert" }, 409);
					}
					if (error.message === 'BOOKING_ENDED') {
						return c.json({ error: 'Cette réservation est terminée' }, 409);
					}
					if (error.message === 'INVALID_QR_TOKEN') {
						return c.json({ error: 'QR code invalide ou expiré' }, 403);
					}
				}

				return c.json({ error: 'Server error' }, 500);
			}
		},
	)
	// DELETE /bookings/:id - Delete a booking
	.delete('/:id', zValidator('param', bookingIdParamSchema), async (c) => {
		try {
			const payload = c.get('jwtPayload');
			const { id } = c.req.valid('param');

			const deleted = await bookingService.delete(id, payload.sub, payload.role);

			await auditService.logDeletion('booking', id, deleted as Record<string, unknown>, {
				userId: payload.sub,
				email: payload.email,
				role: payload.role,
			});

			return c.json({ message: 'Booking deleted', booking: deleted });
		} catch (error) {
			if (error instanceof Error) {
				if (error.message === 'BOOKING_NOT_FOUND') {
					return c.json({ error: 'Booking not found' }, 404);
				}
				if (error.message === 'UNAUTHORIZED') {
					return c.json({ error: 'Unauthorized' }, 403);
				}
			}
			return c.json({ error: 'Server error' }, 500);
		}
	});

export default app;
