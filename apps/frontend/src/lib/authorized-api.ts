import { goto } from '$app/navigation';
import type {
	AnalyticsOverview,
	AuditLog,
	Booking,
	CreateBookingInput,
	CreatedBooking,
	CreateUserInput,
	CreateWorkspaceInput,
	UpdateWorkspaceInput,
	User,
	Workspace,
	WorkspaceStat,
} from './api-types';
import { readAuthorizedApiJson } from './api-response';
import { auth } from './auth.svelte';
import { getAuthClient } from './client';

interface AuthorizedApiOptions {
	getClient?: typeof getAuthClient;
	onUnauthorized?: () => void | Promise<void>;
	onForbidden?: () => void | Promise<void>;
}

export function createAuthorizedApi(options: AuthorizedApiOptions = {}) {
	const getClient = options.getClient ?? getAuthClient;
	const handlers = {
		onUnauthorized:
			options.onUnauthorized ??
			(async () => {
				auth.logout();
				await goto('/login', { replaceState: true });
			}),
		onForbidden:
			options.onForbidden ??
			(async () => {
				await goto('/', { replaceState: true });
			}),
	};

	async function read<T>(response: Promise<Response>, fallbackMessage: string): Promise<T> {
		return await readAuthorizedApiJson<T>(await response, fallbackMessage, handlers);
	}

	return {
		users: {
			list(): Promise<User[]> {
				return read(getClient().users.$get(), 'Erreur lors du chargement des utilisateurs');
			},
			create(input: CreateUserInput): Promise<User> {
				return read(
					getClient().users.$post({ json: input }),
					"Erreur lors de la création de l'utilisateur",
				);
			},
		},
		workspaces: {
			list(): Promise<Workspace[]> {
				return read(getClient().workspaces.$get(), 'Erreur lors du chargement des espaces');
			},
			create(input: CreateWorkspaceInput): Promise<Workspace> {
				return read(
					getClient().workspaces.$post({ json: input }),
					"Erreur lors de la création de l'espace",
				);
			},
			update(id: number, input: UpdateWorkspaceInput): Promise<Workspace> {
				return read(
					getClient().workspaces[':id'].$patch({
						param: { id: String(id) },
						json: input,
					}),
					"Erreur lors de la modification de l'espace",
				);
			},
			delete(id: number): Promise<void> {
				return read(
					getClient().workspaces[':id'].$delete({ param: { id: String(id) } }),
					"Erreur lors de la suppression de l'espace",
				);
			},
		},
		bookings: {
			list(): Promise<Booking[]> {
				return read(
					getClient().bookings.$get(),
					'Erreur lors du chargement des réservations',
				);
			},
			create(input: CreateBookingInput): Promise<CreatedBooking> {
				return read(
					getClient().bookings.$post({ json: input }),
					'Erreur lors de la création de la réservation',
				);
			},
			delete(id: string): Promise<void> {
				return read(
					getClient().bookings[':id'].$delete({ param: { id } }),
					"Erreur lors de l'annulation de la réservation",
				);
			},
		},
		analytics: {
			overview(): Promise<AnalyticsOverview> {
				return read(
					getClient().analytics.overview.$get(),
					'Erreur lors du chargement des statistiques',
				);
			},
			workspaces(): Promise<WorkspaceStat[]> {
				return read(
					getClient().analytics.workspaces.$get(),
					'Erreur lors du chargement des statistiques par espace',
				);
			},
		},
		audit: {
			list(limit = 100): Promise<AuditLog[]> {
				return read(
					getClient().audit.$get({ query: { limit: String(limit) } }),
					"Erreur lors du chargement des journaux d'audit",
				);
			},
		},
	};
}

export type AuthorizedApi = ReturnType<typeof createAuthorizedApi>;
export const authorizedApi = createAuthorizedApi();
