import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { authService } from './auth.service';
import { loginSchema, registerSchema } from './auth.dto';
import type { AuthEnv } from '../../middlewares/auth.guard';
import { clearSessionCookie, readSession, setSessionCookie } from './session';

const app = new Hono<AuthEnv>()
	.get('/session', async (c) => {
		const payload = await readSession(c);
		if (!payload) {
			clearSessionCookie(c);
			return c.json({ user: null });
		}
		return c.json({ user: { id: payload.sub, email: payload.email, role: payload.role } });
	})
	.post('/logout', (c) => {
		clearSessionCookie(c);
		return c.json({ message: 'Déconnexion effectuée' });
	})
	// POST /auth/register
	.post('/register', zValidator('json', registerSchema), async (c) => {
		try {
			const { email, password } = c.req.valid('json');

			const user = await authService.register(email, password);
			return c.json(user, 201);
		} catch (error) {
			if (error instanceof Error && error.message === 'USER_EXISTS') {
				return c.json({ error: 'Cet email est déjà utilisé' }, 409);
			}
			return c.json({ error: 'Erreur serveur' }, 500);
		}
	})
	// POST /auth/login
	.post('/login', zValidator('json', loginSchema), async (c) => {
		try {
			const { email, password } = c.req.valid('json');

			const result = await authService.login(email, password);
			setSessionCookie(c, result.token);
			return c.json({ user: result.user });
		} catch (error) {
			if (error instanceof Error && error.message === 'INVALID_CREDENTIALS') {
				return c.json({ error: 'Email ou mot de passe incorrect' }, 401);
			}
			return c.json({ error: 'Erreur serveur' }, 500);
		}
	});

export default app;
