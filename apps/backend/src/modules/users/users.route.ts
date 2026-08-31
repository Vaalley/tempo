import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { userService } from './users.service';
import { adminGuard, authGuard, type AuthEnv } from '../../middlewares/auth.guard';
import { createUserSchema } from './users.dto';

const app = new Hono<AuthEnv>();

// Only administrators can manage users.
app.use('*', authGuard);
app.use('*', adminGuard);

// GET /users
app.get('/', async (c) => {
	const users = await userService.getAll();
	return c.json(users);
});

// POST /users
app.post('/', zValidator('json', createUserSchema), async (c) => {
	const { email, password } = c.req.valid('json');
	const newUser = await userService.create(email, password);
	return c.json(newUser, 201);
});

export default app;
