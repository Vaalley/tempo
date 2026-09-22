<script lang="ts">
	// oxlint-disable-next-line no-unassigned-import
	import './layout.css';
	import favicon from '$lib/assets/favicon.svg';
	import { onMount } from 'svelte';
	import { auth } from '$lib/auth.svelte';
	let ready = $state(false);
	let sessionError = $state(false);
	async function restoreSession(): Promise<void> {
		sessionError = false;
		try { await auth.restore(); ready = true; }
		catch { sessionError = true; }
	}
	onMount(() => { void restoreSession(); });

	let { children } = $props();
</script>

<svelte:head><link rel="icon" href={favicon} /></svelte:head>
{#if ready}
	{@render children()}
{:else if sessionError}
	<div class="p-8" role="alert">
		<p>Impossible de vérifier votre session.</p>
		<button type="button" class="mt-4 underline" onclick={restoreSession}>Réessayer</button>
	</div>
{:else}
	<p class="p-8" role="status">Chargement de la session…</p>
{/if}
