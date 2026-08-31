import type { Context, MiddlewareHandler } from 'hono';

interface RateLimitEntry {
	count: number;
	resetAt: number;
}

export interface RateLimitOptions {
	limit: number;
	windowMs: number;
	keyGenerator: (context: Context) => string;
	now?: () => number;
}

const errorResponse = {
	error: 'Trop de tentatives. Réessayez plus tard.',
};

export function rateLimit(options: RateLimitOptions): MiddlewareHandler {
	const entries = new Map<string, RateLimitEntry>();
	const now = options.now ?? Date.now;
	let nextCleanupAt = 0;

	return async (context, next) => {
		if (context.req.method === 'OPTIONS') {
			await next();
			return;
		}

		const currentTime = now();

		if (currentTime >= nextCleanupAt) {
			for (const [storedKey, storedEntry] of entries) {
				if (storedEntry.resetAt <= currentTime) {
					entries.delete(storedKey);
				}
			}

			nextCleanupAt = currentTime + options.windowMs;
		}

		const key = options.keyGenerator(context);
		const storedEntry = entries.get(key);
		const entry =
			storedEntry && storedEntry.resetAt > currentTime
				? storedEntry
				: { count: 0, resetAt: currentTime + options.windowMs };

		if (entry.count >= options.limit) {
			const retryAfter = Math.max(1, Math.ceil((entry.resetAt - currentTime) / 1000));

			context.header('RateLimit-Limit', String(options.limit));
			context.header('RateLimit-Remaining', '0');
			context.header('RateLimit-Reset', String(Math.ceil(entry.resetAt / 1000)));
			context.header('Retry-After', String(retryAfter));

			return context.json(errorResponse, 429);
		}

		entry.count += 1;
		entries.set(key, entry);

		await next();

		context.header('RateLimit-Limit', String(options.limit));
		context.header('RateLimit-Remaining', String(options.limit - entry.count));
		context.header('RateLimit-Reset', String(Math.ceil(entry.resetAt / 1000)));
	};
}
