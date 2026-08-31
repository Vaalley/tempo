export interface ApiResponse {
	ok: boolean;
	status: number;
	json(): Promise<unknown>;
}

export interface AuthorizationFailureHandlers {
	onUnauthorized(): void | Promise<void>;
	onForbidden(): void | Promise<void>;
}

export class ApiError extends Error {
	constructor(
		message: string,
		public readonly status: number,
	) {
		super(message);
		this.name = 'ApiError';
	}
}

function errorMessage(payload: unknown, fallbackMessage: string): string {
	if (
		typeof payload === 'object' &&
		payload !== null &&
		'error' in payload &&
		typeof payload.error === 'string'
	) {
		return payload.error;
	}

	return fallbackMessage;
}

async function readPayload(response: ApiResponse): Promise<unknown> {
	try {
		return await response.json();
	} catch {
		return null;
	}
}

export async function readApiJson<T>(response: ApiResponse, fallbackMessage: string): Promise<T> {
	const payload = await readPayload(response);

	if (!response.ok) {
		throw new ApiError(errorMessage(payload, fallbackMessage), response.status);
	}

	return payload as T;
}

export async function readAuthorizedApiJson<T>(
	response: ApiResponse,
	fallbackMessage: string,
	handlers: AuthorizationFailureHandlers,
): Promise<T> {
	try {
		return await readApiJson<T>(response, fallbackMessage);
	} catch (error) {
		if (error instanceof ApiError && error.status === 401) {
			await handlers.onUnauthorized();
		}

		if (error instanceof ApiError && error.status === 403) {
			await handlers.onForbidden();
		}

		throw error;
	}
}

export function getErrorMessage(error: unknown, fallbackMessage: string): string {
	return error instanceof Error ? error.message : fallbackMessage;
}
