import { Hono } from 'hono';
import { userService } from './users.service';
import { authGuard } from '../../middlewares/auth.guard';

const app = new Hono();

// Protège toutes les routes /users avec le JWT
app.use('*', authGuard);

// GET /users
app.get('/', async (c) => {
	const users = await userService.getAll();
	return c.json(users);
});

// POST /users
app.post('/', async (c) => {
	const body = await c.req.json();
	// TODO: Ajouter validation Zod ici plus tard
	const newUser = await userService.create(body.email, body.password);
	return c.json(newUser, 201);
});

export default app;
