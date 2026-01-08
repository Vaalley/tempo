import { z } from 'zod';

export const createWorkspaceSchema = z.object({
	name: z.string().min(1, 'Le nom est requis'),
	type: z.enum(['DESK', 'MEETING_ROOM'], { message: 'Type invalide (DESK ou MEETING_ROOM)' }),
	capacity: z.number().int().min(1, 'La capacité doit être au moins 1').default(1),
});

export type CreateWorkspaceDto = z.infer<typeof createWorkspaceSchema>;
