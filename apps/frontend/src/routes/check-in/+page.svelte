<script lang="ts">
	import { goto } from '$app/navigation';
	import { getErrorMessage } from '$lib/api-response';
	import { auth } from '$lib/auth.svelte';
	import { authorizedApi } from '$lib/authorized-api';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Alert from '$lib/components/ui/alert/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import CircleAlert from '@lucide/svelte/icons/circle-alert';
	import CircleCheck from '@lucide/svelte/icons/circle-check';
	import QrCode from '@lucide/svelte/icons/qr-code';
	import { onMount } from 'svelte';

	let loading = $state(true);
	let checkedInAt = $state<string | null>(null);
	let error = $state('');

	onMount(async () => {
		const returnTo = `${window.location.pathname}${window.location.hash}`;

		if (!auth.isLoggedIn) {
			sessionStorage.setItem('tempo:returnTo', returnTo);
			await goto('/login', {
				replaceState: true,
			});
			return;
		}

		const parameters = new URLSearchParams(window.location.hash.slice(1));
		const bookingId = parameters.get('bookingId');
		const token = parameters.get('token');
		window.history.replaceState(null, '', window.location.pathname);

		if (!bookingId || !token) {
			error = 'Ce QR code est incomplet.';
			loading = false;
			return;
		}

		try {
			const result = await authorizedApi.bookings.checkIn(bookingId, { token });
			checkedInAt = result.checkedInAt ? new Date(result.checkedInAt).toLocaleString('fr-FR') : null;
		} catch (caughtError) {
			error = getErrorMessage(caughtError, 'Le check-in a échoué');
		} finally {
			loading = false;
		}
	});
</script>

<svelte:head>
	<title>Check-in - Tempo</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-muted p-6">
	<Card.Root class="w-full max-w-lg">
		<Card.Header class="text-center">
			<Card.Title class="flex items-center justify-center gap-2">
				<QrCode class="size-6" />
				Check-in Tempo
			</Card.Title>
		</Card.Header>
		<Card.Content class="space-y-5 text-center">
			{#if loading}
				<p class="text-muted-foreground">Validation du QR code...</p>
			{:else if error}
				<Alert.Root variant="destructive" class="text-left">
					<CircleAlert class="size-4" />
					<Alert.Title>Check-in refusé</Alert.Title>
					<Alert.Description>{error}</Alert.Description>
				</Alert.Root>
			{:else}
				<div class="flex flex-col items-center gap-3">
					<CircleCheck class="size-14 text-green-600" />
					<h1 class="text-2xl font-semibold">Présence confirmée</h1>
					{#if checkedInAt}
						<p class="text-muted-foreground">Check-in enregistré le {checkedInAt}.</p>
					{/if}
				</div>
			{/if}

			<Button href="/bookings" variant="outline">Retour aux réservations</Button>
		</Card.Content>
	</Card.Root>
</div>
