import { z } from 'zod';

export const createBookingSchema = z
	.object({
		workspaceId: z.number().int().positive('ID de workspace invalide'),
		startAt: z.string().datetime('Format de date invalide pour startAt'),
		endAt: z.string().datetime('Format de date invalide pour endAt'),
	})
	.refine((data) => new Date(data.startAt) < new Date(data.endAt), {
		message: 'La date de fin doit être après la date de début',
		path: ['endAt'],
	});

export type CreateBookingDto = z.infer<typeof createBookingSchema>;
