import { z } from 'zod';

export const createBookingSchema = z
	.object({
		workspaceId: z.number().int().positive('ID de workspace invalide'),
		startAt: z.string().datetime('Format de date invalide pour startAt'),
		endAt: z.string().datetime('Format de date invalide pour endAt'),
		visibility: z.enum(['PUBLIC', 'PRIVATE']).default('PRIVATE'),
	})
	.refine((data) => new Date(data.startAt) < new Date(data.endAt), {
		message: 'La date de fin doit être après la date de début',
		path: ['endAt'],
	});

export type CreateBookingDto = z.infer<typeof createBookingSchema>;

export const bookingIdParamSchema = z.object({
	id: z.string().uuid('ID de réservation invalide'),
});

export const invitationIdParamSchema = bookingIdParamSchema.extend({
	participantId: z.string().uuid('ID de participant invalide'),
});

export const inviteParticipantSchema = z.object({
	email: z.string().email('Email invalide'),
});

export const respondInvitationSchema = z.object({
	status: z.enum(['ACCEPTED', 'DECLINED']),
});

export const checkInSchema = z.object({
	token: z.string().min(32, 'Jeton QR invalide').max(256, 'Jeton QR invalide'),
});

export type InvitationResponseStatus = z.infer<typeof respondInvitationSchema>['status'];
