import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import usersRoute from './modules/users/users.route';

const app = new Hono();

// Middlewares
app.use('*', logger());
app.use('*', cors()); // Autorise le Frontend à nous appeler

// Routes
const routes = app.route('/users', usersRoute);

// Health check
app.get('/health', (c) => c.text('OK'));

export default {
	port: 3000,
	fetch: app.fetch,
};

// On exporte le type de l'API pour le frontend
export type AppType = typeof routes;
