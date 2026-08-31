import { z } from 'zod';

const workspaceNameSchema = z.string().min(1, 'Le nom est requis');
const workspaceTypeSchema = z.enum(['DESK', 'MEETING_ROOM'], {
	message: 'Type invalide (DESK ou MEETING_ROOM)',
});
const workspaceCapacitySchema = z.number().int().min(1, 'La capacité doit être au moins 1');

export const createWorkspaceSchema = z.object({
	name: workspaceNameSchema,
	type: workspaceTypeSchema,
	capacity: workspaceCapacitySchema.default(1),
});

export type CreateWorkspaceDto = z.infer<typeof createWorkspaceSchema>;

export const updateWorkspaceSchema = z
	.object({
		name: workspaceNameSchema.optional(),
		type: workspaceTypeSchema.optional(),
		capacity: workspaceCapacitySchema.optional(),
	})
	.refine((data) => Object.keys(data).length > 0, {
		message: 'Au moins un champ doit être fourni',
	});

export type UpdateWorkspaceDto = z.infer<typeof updateWorkspaceSchema>;
