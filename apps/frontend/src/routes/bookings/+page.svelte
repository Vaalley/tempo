<script lang="ts">
	import { getAuthClient } from '$lib/client';
	import { auth } from '$lib/auth.svelte';
	import { goto } from '$app/navigation';
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

	type Workspace = {
		id: number;
		name: string;
		type: 'DESK' | 'MEETING_ROOM';
		capacity: number;
	};

	type Booking = {
		id: string;
		workspaceId: number;
		startAt: string;
		endAt: string;
		createdAt: string;
		workspace: Workspace;
	};

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
		if (!auth.isLoggedIn) {
			goto('/login');
			return;
		}
		await Promise.all([fetchBookings(), fetchWorkspaces()]);
	});

	async function fetchBookings() {
		const client = getAuthClient();
		const res = await (client as any).bookings.$get();
		if (res.ok) {
			bookings = await res.json();
		}
	}

	async function fetchWorkspaces() {
		const client = getAuthClient();
		const res = await (client as any).workspaces.$get();
		if (res.ok) {
			workspaces = await res.json();
		}
	}

	async function createBooking() {
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

			console.log('Sending booking payload:', payload);

			const client = getAuthClient();
			const res = await (client as any).bookings.$post({
				json: payload,
			});

			if (res.ok) {
				await fetchBookings();
				selectedWorkspaceId = '';
				startDate = '';
				endDate = '';
				startTime = '09:00';
				endTime = '10:00';
			} else {
				const data = await res.json();
				console.error('Booking creation error:', data);
				error = data.error || 'Erreur lors de la création';
			}
		} finally {
			loading = false;
		}
	}

	async function deleteBooking(id: string) {
		if (!confirm('Supprimer cette réservation ?')) return;
		deleting = id;

		try {
			const client = getAuthClient();
			const res = await (client as any).bookings[':id'].$delete({
				param: { id },
			});

			if (res.ok) {
				await fetchBookings();
			} else {
				alert('Erreur lors de la suppression');
			}
		} finally {
			deleting = null;
		}
	}

	function formatDate(dateStr: string) {
		return new Date(dateStr).toLocaleString('fr-FR', {
			dateStyle: 'short',
			timeStyle: 'short',
		});
	}

	function isPast(dateStr: string) {
		return new Date(dateStr) < new Date();
	}

	function selectedWorkspaceLabel(): string {
		if (!selectedWorkspaceId) return 'Choisir un espace';
		const ws = workspaces.find((w) => String(w.id) === selectedWorkspaceId);
		if (!ws) return 'Choisir un espace';
		return `${ws.type === 'DESK' ? '🪑' : '🚪'} ${ws.name}`;
	}
</script>

<div class="mx-auto max-w-5xl p-10">
	<div class="flex justify-between items-center mb-6">
		<div>
			<h1 class="text-3xl font-bold">Mes Réservations</h1>
			<p class="text-muted-foreground text-sm mt-1">Gérez vos réservations d'espaces</p>
		</div>
		<div class="flex items-center gap-2">
			<Button variant="ghost" size="sm" href="/">
				<ArrowLeft class="size-4" />
				Accueil
			</Button>
			<Button variant="ghost" size="sm" href="/admin/workspaces">
				<LayoutGrid class="size-4" />
				Espaces
			</Button>
			<Separator orientation="vertical" class="h-6" />
			<span class="text-sm text-muted-foreground">{auth.user?.email}</span>
			<Button
				variant="ghost"
				size="sm"
				onclick={() => { auth.logout(); goto('/login'); }}
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
