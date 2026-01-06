import { z } from 'zod';

export const createUserSchema = z.object({
	email: z.email('Email invalide'),
	password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
});

export type CreateUserDto = z.infer<typeof createUserSchema>;
