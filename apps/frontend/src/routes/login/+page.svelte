<script lang="ts">
	import { auth } from '$lib/auth.svelte';
	import { goto } from '$app/navigation';

	let email = $state('');
	let password = $state('');
	let error = $state('');
	let loading = $state(false);
	let isRegister = $state(false);

	async function handleSubmit() {
		if (!email || !password) {
			error = 'Email et mot de passe requis';
			return;
		}

		loading = true;
		error = '';

		try {
			if (isRegister) {
				await auth.register(email, password);
				// Après inscription, on connecte l'utilisateur
				await auth.login(email, password);
			} else {
				await auth.login(email, password);
			}
			goto('/');
		} catch (e) {
			error = e instanceof Error ? e.message : 'Une erreur est survenue';
		} finally {
			loading = false;
		}
	}
</script>

<div class="min-h-screen flex items-center justify-center bg-gray-100">
	<div class="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
		<h1 class="text-2xl font-bold text-center mb-6">
			{isRegister ? 'Inscription' : 'Connexion'}
		</h1>

		{#if error}
			<div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
				{error}
			</div>
		{/if}

		<form onsubmit={handleSubmit} class="space-y-4">
			<div>
				<label for="email" class="block text-sm font-medium text-gray-700">Email</label>
				<input
					type="email"
					id="email"
					bind:value={email}
					class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
					placeholder="exemple@email.com"
				/>
			</div>

			<div>
				<label for="password" class="block text-sm font-medium text-gray-700">Mot de passe</label>
				<input
					type="password"
					id="password"
					bind:value={password}
					class="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
					placeholder="••••••••"
				/>
			</div>

			<button
				type="submit"
				disabled={loading}
				class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
			>
				{#if loading}
					Chargement...
				{:else}
					{isRegister ? "S'inscrire" : 'Se connecter'}
				{/if}
			</button>
		</form>

		<div class="mt-4 text-center">
			<button
				type="button"
				onclick={() => (isRegister = !isRegister)}
				class="text-blue-600 hover:text-blue-800 text-sm"
			>
				{isRegister ? 'Déjà un compte ? Se connecter' : "Pas de compte ? S'inscrire"}
			</button>
		</div>
	</div>
</div>
