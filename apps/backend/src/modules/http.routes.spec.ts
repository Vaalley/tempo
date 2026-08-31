import { afterEach, describe, expect, it, mock, spyOn } from 'bun:test';
import { sign } from 'hono/jwt';
import { authService } from './auth/auth.service';
import { workspaceService } from './workspaces/workspaces.service';

process.env.JWT_SECRET = 'test-jwt-secret';

const [{ default: authRoute }, { default: workspacesRoute }] = await Promise.all([
	import('./auth/auth.route'),
	import('./workspaces/workspaces.route'),
]);

const user = {
	id: 'user-id',
	email: 'user@example.com',
	role: 'USER' as const,
};

const workspace = {
	id: 1,
	name: 'Bureau 1',
	type: 'DESK' as const,
	capacity: 1,
	createdAt: new Date('2026-01-01T00:00:00.000Z'),
};

async function authorizationHeader(role: 'ADMIN' | 'USER'): Promise<string> {
	const token = await sign(
		{
			sub: `${role.toLowerCase()}-id`,
			email: `${role.toLowerCase()}@example.com`,
			role,
			exp: Math.floor(Date.now() / 1000) + 60,
		},
		'test-jwt-secret',
	);

	return `Bearer ${token}`;
}

afterEach(() => {
	mock.restore();
});

describe('authentication HTTP routes', () => {
	it('returns 201 after a valid registration', async () => {
		const register = spyOn(authService, 'register').mockResolvedValue(user);

		const response = await authRoute.request('/register', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email: user.email, password: 'password123' }),
		});

		expect(response.status).toBe(201);
		expect(await response.json()).toEqual(user);
		expect(register).toHaveBeenCalledWith(user.email, 'password123');
	});

	it('returns 400 when the registration payload is invalid', async () => {
		const register = spyOn(authService, 'register');

		const response = await authRoute.request('/register', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email: 'invalid', password: 'short' }),
		});

		expect(response.status).toBe(400);
		expect(register).not.toHaveBeenCalled();
	});

	it('returns 401 when the credentials are invalid', async () => {
		spyOn(authService, 'login').mockRejectedValue(new Error('INVALID_CREDENTIALS'));

		const response = await authRoute.request('/login', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email: user.email, password: 'wrong-password' }),
		});

		expect(response.status).toBe(401);
		expect(await response.json()).toEqual({ error: 'Email ou mot de passe incorrect' });
	});

	it('returns 409 when the email is already registered', async () => {
		spyOn(authService, 'register').mockRejectedValue(new Error('USER_EXISTS'));

		const response = await authRoute.request('/register', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email: user.email, password: 'password123' }),
		});

		expect(response.status).toBe(409);
		expect(await response.json()).toEqual({ error: 'Cet email est déjà utilisé' });
	});
});

describe('workspace HTTP routes', () => {
	it('returns 200 with the workspace list for an authenticated user', async () => {
		spyOn(workspaceService, 'getAll').mockResolvedValue([workspace]);

		const response = await workspacesRoute.request('/', {
			headers: { Authorization: await authorizationHeader('USER') },
		});

		expect(response.status).toBe(200);
		expect(await response.json()).toEqual([
			{ ...workspace, createdAt: workspace.createdAt.toISOString() },
		]);
	});

	it('returns 201 when an administrator creates a workspace', async () => {
		const create = spyOn(workspaceService, 'create').mockResolvedValue(workspace);

		const response = await workspacesRoute.request('/', {
			method: 'POST',
			headers: {
				Authorization: await authorizationHeader('ADMIN'),
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ name: workspace.name, type: workspace.type, capacity: 1 }),
		});

		expect(response.status).toBe(201);
		expect(create).toHaveBeenCalledWith({
			name: workspace.name,
			type: workspace.type,
			capacity: 1,
		});
	});

	it('returns 403 when a standard user creates a workspace', async () => {
		const create = spyOn(workspaceService, 'create');

		const response = await workspacesRoute.request('/', {
			method: 'POST',
			headers: {
				Authorization: await authorizationHeader('USER'),
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({ name: workspace.name, type: workspace.type, capacity: 1 }),
		});

		expect(response.status).toBe(403);
		expect(create).not.toHaveBeenCalled();
	});

	it('returns 404 when a workspace does not exist', async () => {
		spyOn(workspaceService, 'getById').mockResolvedValue(undefined);

		const response = await workspacesRoute.request('/999', {
			headers: { Authorization: await authorizationHeader('USER') },
		});

		expect(response.status).toBe(404);
		expect(await response.json()).toEqual({ error: 'Workspace not found' });
	});
});
