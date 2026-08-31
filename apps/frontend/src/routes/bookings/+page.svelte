<script lang="ts">
	import type { Booking, Workspace } from '$lib/api-types';
	import { authorizedApi } from '$lib/authorized-api';
	import { getErrorMessage } from '$lib/api-response';
	import { auth } from '$lib/auth.svelte';
	import { enforceRouteAccess, logoutAndRedirect } from '$lib/route-guard';
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import LogOut from '@lucide/svelte/icons/log-out';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import LayoutGrid from '@lucide/svelte/icons/layout-grid';
	import CalendarPlus from '@lucide/svelte/icons/calendar-plus';
	import CircleAlert from '@lucide/svelte/icons/circle-alert';
	import X from '@lucide/svelte/icons/x';
	import ScrollText from '@lucide/svelte/icons/scroll-text';

	let bookings = $state<Booking[]>([]);
	let workspaces = $state<Workspace[]>([]);
	let selectedWorkspaceId = $state<string>('');
	let startDate = $state('');
	let startTime = $state('09:00');
	let endDate = $state('');
	let endTime = $state('10:00');
	let loading = $state(false);
	let deleting = $state<string | null>(null);
	let error = $state('');

	onMount(async () => {
		if (!(await enforceRouteAccess('AUTHENTICATED'))) return;
		await Promise.all([fetchBookings(), fetchWorkspaces()]);
	});

	async function fetchBookings(): Promise<void> {
		try {
			bookings = await authorizedApi.bookings.list();
		} catch (caughtError) {
			error = getErrorMessage(caughtError, 'Erreur lors du chargement des réservations');
		}
	}

	async function fetchWorkspaces(): Promise<void> {
		try {
			workspaces = await authorizedApi.workspaces.list();
		} catch (caughtError) {
			error = getErrorMessage(caughtError, 'Erreur lors du chargement des espaces');
		}
	}

	async function createBooking(): Promise<void> {
		if (!selectedWorkspaceId || !startDate || !endDate) {
			error = 'Veuillez remplir tous les champs';
			return;
		}

		error = '';
		loading = true;

		try {
			const startAt = new Date(`${startDate}T${startTime}:00`).toISOString();
			const endAt = new Date(`${endDate}T${endTime}:00`).toISOString();

			const payload = {
				workspaceId: Number(selectedWorkspaceId),
				startAt,
				endAt,
			};

			await authorizedApi.bookings.create(payload);
			await fetchBookings();
			selectedWorkspaceId = '';
			startDate = '';
			endDate = '';
			startTime = '09:00';
			endTime = '10:00';
		} catch (caughtError) {
			error = getErrorMessage(caughtError, 'Erreur lors de la création');
		} finally {
			loading = false;
		}
	}

	async function deleteBooking(id: string): Promise<void> {
		if (!confirm('Supprimer cette réservation ?')) return;
		deleting = id;

		try {
			await authorizedApi.bookings.delete(id);
			await fetchBookings();
		} catch (caughtError) {
			error = getErrorMessage(caughtError, "Erreur lors de l'annulation");
		} finally {
			deleting = null;
		}
	}

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleString('fr-FR', {
			dateStyle: 'short',
			timeStyle: 'short',
		});
	}

	function isPast(dateStr: string): boolean {
		return new Date(dateStr) < new Date();
	}

	function selectedWorkspaceLabel(): string {
		if (!selectedWorkspaceId) return 'Choisir un espace';
		const ws = workspaces.find((w) => String(w.id) === selectedWorkspaceId);
		if (!ws) return 'Choisir un espace';
		return `${ws.type === 'DESK' ? '🪑' : '🚪'} ${ws.name}`;
	}
</script>

<svelte:head>
	<title>{auth.user?.role === 'ADMIN' ? 'Toutes les réservations' : 'Mes réservations'} - Tempo</title>
</svelte:head>

<div class="mx-auto max-w-5xl p-10">
	<div class="flex justify-between items-center mb-6">
		<div>
			<h1 class="text-3xl font-bold">
				{auth.user?.role === 'ADMIN' ? 'Toutes les réservations' : 'Mes réservations'}
			</h1>
			<p class="text-muted-foreground text-sm mt-1">
				{auth.user?.role === 'ADMIN'
					? "Supervisez les réservations de l'ensemble des utilisateurs"
					: "Gérez vos réservations d'espaces"}
			</p>
		</div>
		<div class="flex items-center gap-2">
			<Button variant="ghost" size="sm" href="/">
				<ArrowLeft class="size-4" />
				Accueil
			</Button>
			{#if auth.user?.role === 'ADMIN'}
				<Button variant="ghost" size="sm" href="/admin/workspaces">
					<LayoutGrid class="size-4" />
					Espaces
				</Button>
				<Button variant="ghost" size="sm" href="/admin/audit">
					<ScrollText class="size-4" />
					Audit
				</Button>
			{/if}
			<Separator orientation="vertical" class="h-6" />
			<span class="text-sm text-muted-foreground">{auth.user?.email}</span>
			<Button
				variant="ghost"
				size="sm"
				onclick={logoutAndRedirect}
			>
				<LogOut class="size-4" />
			</Button>
		</div>
	</div>

	<!-- Formulaire de création -->
	<Card.Root class="mb-8">
		<Card.Header>
			<Card.Title>
				<CalendarPlus class="size-5 inline-block mr-1" />
				Nouvelle Réservation
			</Card.Title>
		</Card.Header>
		<Card.Content>
			{#if error}
				<Alert.Root variant="destructive" class="mb-4">
					<CircleAlert class="size-4" />
					<Alert.Title>Erreur</Alert.Title>
					<Alert.Description>{error}</Alert.Description>
				</Alert.Root>
			{/if}

			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
				<Select.Root
					type="single"
					value={selectedWorkspaceId}
					onValueChange={(v) => { if (v !== undefined) selectedWorkspaceId = v; }}
				>
					<Select.Trigger class="w-full">
						{selectedWorkspaceLabel()}
					</Select.Trigger>
					<Select.Content>
						{#each workspaces as workspace}
							<Select.Item value={String(workspace.id)} label="{workspace.type === 'DESK' ? '🪑' : '🚪'} {workspace.name}">
								{workspace.type === 'DESK' ? '🪑' : '🚪'} {workspace.name}
							</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>

				<Input
					type="date"
					bind:value={startDate}
				/>
				<Input
					type="time"
					bind:value={startTime}
				/>
				<Input
					type="date"
					bind:value={endDate}
				/>
				<Input
					type="time"
					bind:value={endTime}
				/>
			</div>

			<Button
				onclick={createBooking}
				disabled={loading || !selectedWorkspaceId || !startDate || !endDate}
				class="mt-4"
			>
				{loading ? 'Création...' : 'Réserver'}
			</Button>
		</Card.Content>
	</Card.Root>

	<!-- Liste des réservations -->
	<Card.Root>
		<Card.Header>
			<Card.Title>
				{bookings.length} réservation{bookings.length > 1 ? 's' : ''}
			</Card.Title>
		</Card.Header>
		<Card.Content class="p-0">
			{#if bookings.length === 0}
				<div class="p-8 text-center text-muted-foreground">Aucune réservation.</div>
			{:else}
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Espace</Table.Head>
							{#if auth.user?.role === 'ADMIN'}
								<Table.Head>Propriétaire</Table.Head>
							{/if}
							<Table.Head>Début</Table.Head>
							<Table.Head>Fin</Table.Head>
							<Table.Head>Statut</Table.Head>
							<Table.Head class="text-right">Actions</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each bookings as booking}
							<Table.Row class={isPast(booking.endAt) ? 'opacity-50' : ''}>
								<Table.Cell>
									<div class="flex items-center gap-2">
										<span class="text-xl">
											{booking.workspace.type === 'DESK' ? '🪑' : '🚪'}
										</span>
										<div>
											<div class="font-medium">{booking.workspace.name}</div>
											<div class="text-xs text-muted-foreground">
												{booking.workspace.type === 'DESK' ? 'Bureau' : 'Salle'} · {booking.workspace.capacity} pers.
											</div>
										</div>
									</div>
								</Table.Cell>
								{#if auth.user?.role === 'ADMIN'}
									<Table.Cell>
										<div class="font-medium">{booking.user?.email ?? 'Utilisateur inconnu'}</div>
										<div class="text-xs text-muted-foreground">{booking.user?.role ?? '—'}</div>
									</Table.Cell>
								{/if}
								<Table.Cell>{formatDate(booking.startAt)}</Table.Cell>
								<Table.Cell>{formatDate(booking.endAt)}</Table.Cell>
								<Table.Cell>
									{#if isPast(booking.endAt)}
										<Badge variant="outline">Passée</Badge>
									{:else if new Date(booking.startAt) <= new Date() && new Date() <= new Date(booking.endAt)}
										<Badge variant="default">En cours</Badge>
									{:else}
										<Badge variant="secondary">À venir</Badge>
									{/if}
								</Table.Cell>
								<Table.Cell class="text-right">
									{#if !isPast(booking.endAt)}
										<Button
											variant="ghost"
											size="sm"
											onclick={() => deleteBooking(booking.id)}
											disabled={deleting === booking.id}
											class="text-destructive hover:text-destructive"
										>
											<X class="size-4" />
											{deleting === booking.id ? '...' : 'Annuler'}
										</Button>
									{/if}
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			{/if}
		</Card.Content>
	</Card.Root>
</div>
