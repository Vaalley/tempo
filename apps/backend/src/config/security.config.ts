export interface HttpSecurityConfig {
	frontendOrigin: string;
	authRateLimit: {
		limit: number;
		windowMs: number;
	};
	trustProxy: boolean;
}

type Environment = Record<string, string | undefined>;

function parseFrontendOrigin(value: string | undefined): string {
	if (!value?.trim()) {
		throw new Error('FRONTEND_ORIGIN is required but is not configured');
	}

	let url: URL;

	try {
		url = new URL(value);
	} catch {
		throw new Error('FRONTEND_ORIGIN must be a valid HTTP(S) origin');
	}

	if (
		!['http:', 'https:'].includes(url.protocol) ||
		url.username ||
		url.password ||
		url.pathname !== '/' ||
		url.search ||
		url.hash
	) {
		throw new Error('FRONTEND_ORIGIN must be a valid HTTP(S) origin');
	}

	return url.origin;
}

function parsePositiveInteger(
	environment: Environment,
	name: string,
	defaultValue: number,
): number {
	const value = environment[name];

	if (value === undefined) {
		return defaultValue;
	}

	if (!/^\d+$/.test(value)) {
		throw new Error(`${name} must be a positive integer`);
	}

	const parsedValue = Number(value);

	if (!Number.isSafeInteger(parsedValue) || parsedValue <= 0) {
		throw new Error(`${name} must be a positive integer`);
	}

	return parsedValue;
}

function parseTrustProxy(value: string | undefined): boolean {
	if (value === undefined) {
		return false;
	}

	if (value !== 'true' && value !== 'false') {
		throw new Error('TRUST_PROXY must be either true or false');
	}

	return value === 'true';
}

export function getHttpSecurityConfig(environment: Environment = process.env): HttpSecurityConfig {
	return {
		frontendOrigin: parseFrontendOrigin(environment.FRONTEND_ORIGIN),
		authRateLimit: {
			limit: parsePositiveInteger(environment, 'AUTH_RATE_LIMIT_MAX', 10),
			windowMs: parsePositiveInteger(
				environment,
				'AUTH_RATE_LIMIT_WINDOW_MS',
				15 * 60 * 1000,
			),
		},
		trustProxy: parseTrustProxy(environment.TRUST_PROXY),
	};
}
