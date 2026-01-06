<script lang="ts">
	import { getAuthClient } from '$lib/client';
	import { auth } from '$lib/auth.svelte';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	// État local avec les "Runes" de Svelte 5 ($state)
	let users = $state<any[]>([]);
	let email = $state('');
	let password = $state('');
	let loading = $state(false);

	onMount(async () => {
		if (!auth.isLoggedIn) {
			goto('/login');
			return;
		}
		await fetchUsers();
	});

	async function fetchUsers() {
		// Appel API typé : .users.$get() est suggéré par VSCode !
		const client = getAuthClient();
		const res = await (client as any).users.$get();
		if (res.ok) {
			users = await res.json();
		}
	}

	async function createUser() {
		if (!email || !password) return;            
		loading = true;

		try {
			const client = getAuthClient();
			const res = await (client as any).users.$post({
				json: { email, password }
			});

			if (res.ok) {
				await fetchUsers(); // Rafraîchir la liste
				email = '';
				password = '';
			} else {
				alert('Erreur création utilisateur');
			}
		} finally {
			loading = false;
		}
	}
</script>

<div class="mx-auto max-w-2xl p-10 font-sans">
	<div class="flex justify-between items-center mb-6">
		<h1 class="text-3xl font-bold text-gray-800">Tempo Users</h1>
		<div class="flex items-center gap-4">
			<span class="text-sm text-gray-600">{auth.user?.email}</span>
			<button
				onclick={() => { auth.logout(); goto('/login'); }}
				class="text-sm text-red-600 hover:text-red-800"
			>
				Déconnexion
			</button>
		</div>
	</div>

	<div class="mb-8 rounded-lg bg-white p-6 shadow-md border border-gray-100">
		<h2 class="mb-4 text-xl font-semibold text-gray-700">Nouvel Utilisateur</h2>
		<div class="flex gap-3">
			<input
				type="email"
				bind:value={email}
				placeholder="Email pro"
				class="flex-1 rounded border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 outline-none"
			/>
			<input
				type="password"
				bind:value={password}
				placeholder="Mot de passe"
				class="flex-1 rounded border border-gray-300 p-2 focus:ring-2 focus:ring-blue-500 outline-none"
			/>
			<button
				onclick={createUser}
				disabled={loading}
				class="rounded bg-blue-600 px-6 py-2 text-white font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
			>
				{loading ? '...' : 'Ajouter'}
			</button>
		</div>
	</div>

	<div class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
		{#if users.length === 0}
			<div class="p-8 text-center text-gray-500">Aucun utilisateur trouvé.</div>
		{:else}
			<ul class="divide-y divide-gray-100">
				{#each users as user}
					<li class="flex items-center justify-between p-4 hover:bg-gray-50">
						<div class="flex flex-col">
							<span class="font-medium text-gray-800">{user.email}</span>
							<span class="text-xs text-gray-400">ID: {user.id}</span>
						</div>
						<span class="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
							{new Date(user.createdAt).toLocaleDateString()}
						</span>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</div>