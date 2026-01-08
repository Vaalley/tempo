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
		createdAt: string;
	};

	let workspaces = $state<Workspace[]>([]);
	let name = $state('');
	let type = $state<'DESK' | 'MEETING_ROOM'>('DESK');
	let capacity = $state(1);
	let loading = $state(false);
	let deleting = $state<number | null>(null);

	onMount(async () => {
		if (!auth.isLoggedIn) {
			goto('/login');
			return;
		}
		await fetchWorkspaces();
	});

	async function fetchWorkspaces() {
		const client = getAuthClient();
		const res = await (client as any).workspaces.$get();
		if (res.ok) {
			workspaces = await res.json();
		}
	}

	async function createWorkspace() {
		if (!name) return;
		loading = true;

		try {
			const client = getAuthClient();
			const res = await (client as any).workspaces.$post({
				json: { name, type, capacity }
			});

			if (res.ok) {
				await fetchWorkspaces();
				name = '';
				type = 'DESK';
				capacity = 1;
			} else {
				alert('Erreur lors de la création');
			}
		} finally {
			loading = false;
		}
	}

	async function deleteWorkspace(id: number) {
		if (!confirm('Supprimer cet espace ?')) return;
		deleting = id;

		try {
			const client = getAuthClient();
			const res = await (client as any).workspaces[':id'].$delete({
				param: { id: String(id) }
			});

			if (res.ok) {
				await fetchWorkspaces();
			} else {
				alert('Erreur lors de la suppression');
			}
		} finally {
			deleting = null;
		}
	}
</script>

<div class="mx-auto max-w-4xl p-10 font-sans">
	<div class="flex justify-between items-center mb-6">
		<div>
			<h1 class="text-3xl font-bold text-gray-800">Gestion des Espaces</h1>
			<p class="text-gray-500 text-sm mt-1">Bureaux et salles de réunion</p>
		</div>
		<div class="flex items-center gap-4">
			<a href="/" class="text-sm text-blue-600 hover:text-blue-800">← Accueil</a>
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
		<h2 class="mb-4 text-xl font-semibold text-gray-700">Nouvel Espace</h2>
		<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
			<input
				type="text"
				bind:value={name}
				placeholder="Nom de l'espace"
				class="rounded border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 outline-none"
			/>
			<select
				bind:value={type}
				class="rounded border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
			>
				<option value="DESK">Bureau</option>
				<option value="MEETING_ROOM">Salle de réunion</option>
			</select>
			<input
				type="number"
				bind:value={capacity}
				min="1"
				placeholder="Capacité"
				class="rounded border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 outline-none"
			/>
			<button
				onclick={createWorkspace}
				disabled={loading || !name}
				class="rounded bg-blue-600 px-6 py-2 text-white font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
			>
				{loading ? '...' : 'Ajouter'}
			</button>
		</div>
	</div>

	<!-- Liste des espaces -->
	<div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
		<div class="px-4 py-3 border-b border-gray-200 bg-gray-50">
			<h3 class="font-semibold text-gray-700">
				{workspaces.length} espace{workspaces.length > 1 ? 's' : ''}
			</h3>
		</div>

		{#if workspaces.length === 0}
			<div class="p-8 text-center text-gray-500">Aucun espace créé.</div>
		{:else}
			<table class="w-full">
				<thead class="bg-gray-50 text-left text-sm text-gray-600">
					<tr>
						<th class="px-4 py-3 font-medium">Nom</th>
						<th class="px-4 py-3 font-medium">Type</th>
						<th class="px-4 py-3 font-medium">Capacité</th>
						<th class="px-4 py-3 font-medium">Créé le</th>
						<th class="px-4 py-3 font-medium text-right">Actions</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-gray-100">
					{#each workspaces as workspace}
						<tr class="hover:bg-gray-50">
							<td class="px-4 py-3 font-medium text-gray-800">{workspace.name}</td>
							<td class="px-4 py-3">
								<span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {workspace.type === 'DESK' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'}">
									{workspace.type === 'DESK' ? '🪑 Bureau' : '🚪 Salle'}
								</span>
							</td>
							<td class="px-4 py-3 text-gray-600">{workspace.capacity} pers.</td>
							<td class="px-4 py-3 text-gray-500 text-sm">
								{new Date(workspace.createdAt).toLocaleDateString()}
							</td>
							<td class="px-4 py-3 text-right">
								<button
									onclick={() => deleteWorkspace(workspace.id)}
									disabled={deleting === workspace.id}
									class="text-red-600 hover:text-red-800 text-sm disabled:opacity-50"
								>
									{deleting === workspace.id ? '...' : 'Supprimer'}
								</button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{/if}
	</div>
</div>
