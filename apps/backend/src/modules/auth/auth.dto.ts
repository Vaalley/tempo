import { z } from 'zod';

export const loginSchema = z.object({
	email: z.email('Email invalide'),
	password: z.string().min(1, 'Mot de passe requis'),
});

export const registerSchema = z.object({
	email: z.email('Email invalide'),
	password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
});

export type LoginDto = z.infer<typeof loginSchema>;
export type RegisterDto = z.infer<typeof registerSchema>;
