import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { bookingService } from './bookings.service';
import { authGuard, type AuthEnv } from '../../middlewares/auth.guard';
import { createBookingSchema } from './bookings.dto';
import { auditService } from '../audit/audit.service';

const app = new Hono<AuthEnv>();

// Protect all /bookings routes with JWT
app.use('*', authGuard);

// GET /bookings - List all bookings (admin) or user's bookings (user)
app.get('/', async (c) => {
	const payload = c.get('jwtPayload');

	// If admin, return all bookings
	if (payload.role === 'ADMIN') {
		const allBookings = await bookingService.getAll();
		return c.json(allBookings);
	}

	// Otherwise, return only the user's bookings
	const userBookings = await bookingService.getByUser(payload.sub);
	return c.json(userBookings);
});

// POST /bookings - Create a booking
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
				return c.json({ error: 'Workspace not found' }, 404);
			}
			if (error.message === 'BOOKING_OVERLAP') {
				return c.json(
					{ error: 'This workspace is already booked for this time slot' },
					409,
				);
			}
		}
		return c.json({ error: 'Server error' }, 500);
	}
});

// DELETE /bookings/:id - Delete a booking
app.delete('/:id', async (c) => {
	try {
		const payload = c.get('jwtPayload');
		const id = c.req.param('id');

		const deleted = await bookingService.delete(id, payload.sub);

		await auditService.logDeletion('booking', id, deleted as Record<string, unknown>, {
			userId: payload.sub,
			email: payload.email,
			role: payload.role,
		});

		return c.json({ message: 'Booking deleted', booking: deleted });
	} catch (error) {
		if (error instanceof Error) {
			if (error.message === 'BOOKING_NOT_FOUND') {
				return c.json({ error: 'Booking not found' }, 404);
			}
			if (error.message === 'UNAUTHORIZED') {
				return c.json({ error: 'Unauthorized' }, 403);
			}
		}
		return c.json({ error: 'Server error' }, 500);
	}
});

export default app;
