import { sign } from 'hono/jwt';
import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { users } from '../../db/schema';

function getJwtSecret(): string {
	const secret = process.env.JWT_SECRET?.trim();

	if (!secret) {
		throw new Error('JWT_SECRET is required but is not configured');
	}

	return secret;
}

type UserPayload = Pick<typeof users.$inferSelect, 'id' | 'email' | 'role'>;

export const authService = {
	async register(email: string, password: string): Promise<UserPayload> {
		// Check if user already exists
		const existing = await db.query.users.findFirst({
			where: eq(users.email, email),
		});

		if (existing) {
			throw new Error('USER_EXISTS');
		}

		// Hash the password with Bun
		const hashedPassword = await Bun.password.hash(password);

		// Create the user
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

	async login(email: string, password: string): Promise<{ token: string; user: UserPayload }> {
		// Find the user
		const user = await db.query.users.findFirst({
			where: eq(users.email, email),
		});

		if (!user) {
			throw new Error('INVALID_CREDENTIALS');
		}

		// Verify the password
		const isValid = await Bun.password.verify(password, user.password);

		if (!isValid) {
			throw new Error('INVALID_CREDENTIALS');
		}

		// Generate the JWT
		const token = await sign(
			{
				sub: user.id,
				email: user.email,
				role: user.role,
				exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24h
			},
			getJwtSecret(),
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

	getSecret(): string {
		return getJwtSecret();
	},
};
