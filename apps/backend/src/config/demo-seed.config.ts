import { z } from 'zod';

const demoSeedSchema = z.object({
	DEMO_ADMIN_EMAIL: z.email(),
	DEMO_ADMIN_PASSWORD: z.string().min(8),
	DEMO_USER_EMAIL: z.email(),
	DEMO_USER_PASSWORD: z.string().min(8),
});

export interface DemoSeedConfig {
	admin: { email: string; password: string };
	user: { email: string; password: string };
}

export function getDemoSeedConfig(
	environment: Record<string, string | undefined> = process.env,
): DemoSeedConfig {
	const result = demoSeedSchema.safeParse(environment);

	if (!result.success) {
		const variables = result.error.issues.map((issue) => issue.path.join('.')).join(', ');
		throw new Error(`Invalid demo seed configuration: ${variables}`);
	}

	return {
		admin: {
			email: result.data.DEMO_ADMIN_EMAIL,
			password: result.data.DEMO_ADMIN_PASSWORD,
		},
		user: {
			email: result.data.DEMO_USER_EMAIL,
			password: result.data.DEMO_USER_PASSWORD,
		},
	};
}
