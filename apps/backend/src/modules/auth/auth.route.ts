import { Hono } from 'hono';
import { authService } from './auth.service';

const app = new Hono();

// POST /auth/register
app.post('/register', async (c) => {
	try {
		const { email, password } = await c.req.json();

		if (!email || !password) {
			return c.json({ error: 'Email et mot de passe requis' }, 400);
		}

		const user = await authService.register(email, password);
		return c.json(user, 201);
	} catch (error) {
		if (error instanceof Error && error.message === 'USER_EXISTS') {
			return c.json({ error: 'Cet email est déjà utilisé' }, 409);
		}
		return c.json({ error: 'Erreur serveur' }, 500);
	}
});

// POST /auth/login
app.post('/login', async (c) => {
	try {
		const { email, password } = await c.req.json();

		if (!email || !password) {
			return c.json({ error: 'Email et mot de passe requis' }, 400);
		}

		const result = await authService.login(email, password);
		return c.json(result);
	} catch (error) {
		if (error instanceof Error && error.message === 'INVALID_CREDENTIALS') {
			return c.json({ error: 'Email ou mot de passe incorrect' }, 401);
		}
		return c.json({ error: 'Erreur serveur' }, 500);
	}
});

export default app;
