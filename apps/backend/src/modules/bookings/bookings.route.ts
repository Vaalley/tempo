import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { bookingService } from './bookings.service';
import { authGuard } from '../../middlewares/auth.guard';
import { createBookingSchema } from './bookings.dto';

const app = new Hono();

// Protège toutes les routes /bookings avec le JWT
app.use('*', authGuard);

// GET /bookings - Lister toutes les réservations (admin) ou les siennes (user)
app.get('/', async (c) => {
	const payload = c.get('jwtPayload');

	// Si admin, retourner toutes les réservations
	if (payload.role === 'ADMIN') {
		const allBookings = await bookingService.getAll();
		return c.json(allBookings);
	}

	// Sinon, retourner uniquement les réservations de l'utilisateur
	const userBookings = await bookingService.getByUser(payload.sub);
	return c.json(userBookings);
});

// POST /bookings - Créer une réservation
app.post('/', zValidator('json', createBookingSchema), async (c) => {
	try {
		const payload = c.get('jwtPayload');
		const data = c.req.valid('json');

		const booking = await bookingService.create(payload.sub, data);
		return c.json(booking, 201);
	} catch (error) {
		console.error('Booking creation error:', error);
		if (error instanceof Error) {
			if (error.message === 'WORKSPACE_NOT_FOUND') {
				return c.json({ error: 'Espace de travail non trouvé' }, 404);
			}
			if (error.message === 'BOOKING_OVERLAP') {
				return c.json({ error: 'Cet espace est déjà réservé sur ce créneau' }, 409);
			}
		}
		return c.json({ error: 'Erreur serveur' }, 500);
	}
});

// DELETE /bookings/:id - Supprimer une réservation
app.delete('/:id', async (c) => {
	try {
		const payload = c.get('jwtPayload');
		const id = c.req.param('id');

		const deleted = await bookingService.delete(id, payload.sub);
		return c.json({ message: 'Réservation supprimée', booking: deleted });
	} catch (error) {
		if (error instanceof Error) {
			if (error.message === 'BOOKING_NOT_FOUND') {
				return c.json({ error: 'Réservation non trouvée' }, 404);
			}
			if (error.message === 'UNAUTHORIZED') {
				return c.json({ error: 'Non autorisé' }, 403);
			}
		}
		return c.json({ error: 'Erreur serveur' }, 500);
	}
});

export default app;
