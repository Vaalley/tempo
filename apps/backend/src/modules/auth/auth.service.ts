import { sign } from 'hono/jwt';
import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { users } from '../../db/schema';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-in-production';

export const authService = {
	async register(email: string, password: string) {
		// Vérifier si l'utilisateur existe déjà
		const existing = await db.query.users.findFirst({
			where: eq(users.email, email),
		});

		if (existing) {
			throw new Error('USER_EXISTS');
		}

		// Hasher le mot de passe avec Bun
		const hashedPassword = await Bun.password.hash(password);

		// Créer l'utilisateur
		const [user] = await db
			.insert(users)
			.values({
				email,
				password: hashedPassword,
			})
			.returning({
				id: users.id,
				email: users.email,
				role: users.role,
			});

		return user;
	},

	async login(email: string, password: string) {
		// Trouver l'utilisateur
		const user = await db.query.users.findFirst({
			where: eq(users.email, email),
		});

		if (!user) {
			throw new Error('INVALID_CREDENTIALS');
		}

		// Vérifier le mot de passe
		const isValid = await Bun.password.verify(password, user.password);

		if (!isValid) {
			throw new Error('INVALID_CREDENTIALS');
		}

		// Générer le JWT
		const token = await sign(
			{
				sub: user.id,
				email: user.email,
				role: user.role,
				exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24h
			},
			JWT_SECRET
		);

		return {
			token,
			user: {
				id: user.id,
				email: user.email,
				role: user.role,
			},
		};
	},

	getSecret() {
		return JWT_SECRET;
	},
};
