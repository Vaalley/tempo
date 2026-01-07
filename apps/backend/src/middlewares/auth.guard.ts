import { jwt } from 'hono/jwt';
import { authService } from '../modules/auth/auth.service';

// Middleware JWT pour protéger les routes
export const authGuard = jwt({
	secret: authService.getSecret(),
});

// Type pour le payload JWT décodé
export interface JWTPayload {
	sub: string; // User ID
	email: string;
	role: 'ADMIN' | 'USER';
	exp: number;
}
