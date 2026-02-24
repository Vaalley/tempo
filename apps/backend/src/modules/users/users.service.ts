import { db } from '../../db';
import { users } from '../../db/schema';

type User = typeof users.$inferSelect;

export const userService = {
	// Create a user
	async create(email: string, password: string): Promise<User> {
		const hashedPassword = await Bun.password.hash(password);

		// .returning() allows to retrieve the created object immediately
		const [user] = await db
			.insert(users)
			.values({
				email,
				password: hashedPassword,
			})
			.returning();

		return user;
	},

	// Retrieve all users
	async getAll(): Promise<Partial<User>[]> {
		// Exclude password from response for security
		return await db.query.users.findMany({
			columns: {
				password: false,
			},
		});
	},
};
