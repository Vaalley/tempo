import { db } from '../../db';
import { users } from '../../db/schema';

export const userService = {
	// Créer un utilisateur
	async create(email: string, password: string) {
		const hashedPassword = await Bun.password.hash(password);

		// .returning() permet de récupérer l'objet créé immédiatement
		const [user] = await db
			.insert(users)
			.values({
				email,
				password: hashedPassword,
			})
			.returning();

		return user;
	},

	// Récupérer tous les utilisateurs
	async getAll() {
		// On exclut le mot de passe de la réponse pour la sécurité
		return await db.query.users.findMany({
			columns: {
				password: false,
			},
		});
	},
};
