import { Hono } from 'hono';
import { userService } from './users.service';

const app = new Hono();

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
