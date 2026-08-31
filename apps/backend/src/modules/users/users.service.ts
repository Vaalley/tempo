import { db } from '../../db';
import { users } from '../../db/schema';

type User = typeof users.$inferSelect;
export type PublicUser = Omit<User, 'password'>;

export const userService = {
	// Create a user
	async create(email: string, password: string): Promise<PublicUser> {
		const hashedPassword = await Bun.password.hash(password);

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
				createdAt: users.createdAt,
			});

		return user;
	},

	// Retrieve all users
	async getAll(): Promise<PublicUser[]> {
		// Exclude password from response for security
		return await db.query.users.findMany({
			columns: {
				password: false,
			},
		});
	},
};
