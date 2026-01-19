<script lang="ts">
	import { getAuthClient } from '$lib/client';
	import { auth } from '$lib/auth.svelte';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

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
</script>

<div class="mx-auto max-w-5xl p-10 font-sans">
	<div class="flex justify-between items-center mb-6">
		<div>
			<h1 class="text-3xl font-bold text-gray-800">Mes Réservations</h1>
			<p class="text-gray-500 text-sm mt-1">Gérez vos réservations d'espaces</p>
		</div>
		<div class="flex items-center gap-4">
			<a href="/" class="text-sm text-blue-600 hover:text-blue-800">← Accueil</a>
			<a href="/admin/workspaces" class="text-sm text-blue-600 hover:text-blue-800">Espaces</a>
			<span class="text-sm text-gray-600">{auth.user?.email}</span>
			<button
				onclick={() => { auth.logout(); goto('/login'); }}
				class="text-sm text-red-600 hover:text-red-800"
			>
				Déconnexion
			</button>
		</div>
	</div>

	<!-- Formulaire de création -->
	<div class="mb-8 rounded-lg bg-white p-6 shadow-md border border-gray-100">
		<h2 class="mb-4 text-xl font-semibold text-gray-700">Nouvelle Réservation</h2>
		
		{#if error}
			<div class="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
				{error}
			</div>
		{/if}

		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
			<select
				bind:value={selectedWorkspaceId}
				class="rounded border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
			>
				<option value="">Choisir un espace</option>
				{#each workspaces as workspace}
					<option value={workspace.id}>
						{workspace.type === 'DESK' ? '🪑' : '🚪'} {workspace.name}
					</option>
				{/each}
			</select>

			<input
				type="date"
				bind:value={startDate}
				class="rounded border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 outline-none"
			/>
			<input
				type="time"
				bind:value={startTime}
				class="rounded border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 outline-none"
			/>

			<input
				type="date"
				bind:value={endDate}
				class="rounded border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 outline-none"
			/>
			<input
				type="time"
				bind:value={endTime}
				class="rounded border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 outline-none"
			/>
		</div>

		<button
			onclick={createBooking}
			disabled={loading || !selectedWorkspaceId || !startDate || !endDate}
			class="mt-4 rounded bg-blue-600 px-6 py-2 text-white font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
		>
			{loading ? 'Création...' : 'Réserver'}
		</button>
	</div>

	<!-- Liste des réservations -->
	<div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
		<div class="px-4 py-3 border-b border-gray-200 bg-gray-50">
			<h3 class="font-semibold text-gray-700">
				{bookings.length} réservation{bookings.length > 1 ? 's' : ''}
			</h3>
		</div>

		{#if bookings.length === 0}
			<div class="p-8 text-center text-gray-500">Aucune réservation.</div>
		{:else}
			<table class="w-full">
				<thead class="bg-gray-50 text-left text-sm text-gray-600">
					<tr>
						<th class="px-4 py-3 font-medium">Espace</th>
						<th class="px-4 py-3 font-medium">Début</th>
						<th class="px-4 py-3 font-medium">Fin</th>
						<th class="px-4 py-3 font-medium">Statut</th>
						<th class="px-4 py-3 font-medium text-right">Actions</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-100">
					{#each bookings as booking}
						<tr class="hover:bg-gray-50" class:opacity-50={isPast(booking.endAt)}>
							<td class="px-4 py-3">
								<div class="flex items-center gap-2">
									<span class="text-xl">
										{booking.workspace.type === 'DESK' ? '🪑' : '🚪'}
									</span>
									<div>
										<div class="font-medium text-gray-800">{booking.workspace.name}</div>
										<div class="text-xs text-gray-500">
											{booking.workspace.type === 'DESK' ? 'Bureau' : 'Salle'} · {booking.workspace.capacity} pers.
										</div>
									</div>
								</div>
							</td>
							<td class="px-4 py-3 text-gray-700">{formatDate(booking.startAt)}</td>
							<td class="px-4 py-3 text-gray-700">{formatDate(booking.endAt)}</td>
							<td class="px-4 py-3">
								{#if isPast(booking.endAt)}
									<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
										Passée
									</span>
								{:else if new Date(booking.startAt) <= new Date() && new Date() <= new Date(booking.endAt)}
									<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
										En cours
									</span>
								{:else}
									<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
										À venir
									</span>
								{/if}
							</td>
							<td class="px-4 py-3 text-right">
								{#if !isPast(booking.endAt)}
									<button
										onclick={() => deleteBooking(booking.id)}
										disabled={deleting === booking.id}
										class="text-red-600 hover:text-red-800 text-sm disabled:opacity-50"
									>
										{deleting === booking.id ? '...' : 'Annuler'}
									</button>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</div>
</div>
