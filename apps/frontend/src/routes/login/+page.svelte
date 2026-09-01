<script lang="ts">
	import { auth } from '$lib/auth.svelte';
	import { goto } from '$app/navigation';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import CircleAlert from '@lucide/svelte/icons/circle-alert';

	let email = $state('');
	let password = $state('');
	let error = $state('');
	let loading = $state(false);
	let isRegister = $state(false);

	async function handleSubmit(): Promise<void> {
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

<svelte:head>
	<title>Connexion - Tempo</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-muted">
	<Card.Root class="w-full max-w-md">
		<Card.Header class="text-center">
			<Card.Title class="text-2xl">
				{isRegister ? 'Inscription' : 'Connexion'}
			</Card.Title>
			<Card.Description>
				{isRegister ? 'Créez votre compte Tempo' : 'Connectez-vous à Tempo'}
			</Card.Description>
		</Card.Header>
		<Card.Content>
			{#if error}
				<Alert.Root variant="destructive" class="mb-4">
					<CircleAlert class="size-4" />
					<Alert.Title>Erreur</Alert.Title>
					<Alert.Description>{error}</Alert.Description>
				</Alert.Root>
			{/if}

			<form
				onsubmit={(event) => {
					event.preventDefault();
					void handleSubmit();
				}}
				class="space-y-4"
			>
				<div class="space-y-2">
					<Label for="email">Email</Label>
					<Input
						type="email"
						id="email"
						bind:value={email}
						placeholder="exemple@email.com"
					/>
				</div>

				<div class="space-y-2">
					<Label for="password">Mot de passe</Label>
					<Input
						type="password"
						id="password"
						bind:value={password}
						placeholder="••••••••"
					/>
				</div>

				<Button type="submit" disabled={loading} class="w-full">
					{#if loading}
						Chargement...
					{:else}
						{isRegister ? "S'inscrire" : 'Se connecter'}
					{/if}
				</Button>
			</form>
		</Card.Content>
		<Card.Footer class="justify-center">
			<Button
				variant="link"
				onclick={() => (isRegister = !isRegister)}
			>
				{isRegister ? 'Déjà un compte ? Se connecter' : "Pas de compte ? S'inscrire"}
			</Button>
		</Card.Footer>
	</Card.Root>
</div>
