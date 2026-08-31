<script lang="ts">
	import type { User } from '$lib/api-types';
	import { authorizedApi } from '$lib/authorized-api';
	import { getErrorMessage } from '$lib/api-response';
	import { auth } from '$lib/auth.svelte';
	import { enforceRouteAccess, logoutAndRedirect } from '$lib/route-guard';
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import LogOut from '@lucide/svelte/icons/log-out';
	import CalendarDays from '@lucide/svelte/icons/calendar-days';
	import LayoutGrid from '@lucide/svelte/icons/layout-grid';
	import UserPlus from '@lucide/svelte/icons/user-plus';
	import BarChart3 from '@lucide/svelte/icons/bar-chart-3';
	import ScrollText from '@lucide/svelte/icons/scroll-text';

	let users = $state<User[]>([]);
	let email = $state('');
	let password = $state('');
	let loading = $state(false);
	let error = $state('');

	onMount(async () => {
		if (!(await enforceRouteAccess('AUTHENTICATED'))) return;
		if (auth.user?.role === 'ADMIN') {
			await fetchUsers();
		}
	});

	async function fetchUsers(): Promise<void> {
		try {
			users = await authorizedApi.users.list();
		} catch (caughtError) {
			error = getErrorMessage(caughtError, 'Erreur lors du chargement des utilisateurs');
		}
	}

	async function createUser(): Promise<void> {
		if (!email || !password) return;
		error = '';
		loading = true;

		try {
			await authorizedApi.users.create({ email, password });
			await fetchUsers();
			email = '';
			password = '';
		} catch (caughtError) {
			error = getErrorMessage(caughtError, "Erreur lors de la création de l'utilisateur");
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>Tempo - Gestion des Espaces de Travail</title>
</svelte:head>

<div class="mx-auto max-w-2xl p-10">
	<div class="flex justify-between items-center mb-6">
		<h1 class="text-3xl font-bold">Tempo</h1>
		<div class="flex items-center gap-2">
			<Button variant="ghost" size="sm" href="/bookings">
				<CalendarDays class="size-4" />
				{auth.user?.role === 'ADMIN' ? 'Toutes les réservations' : 'Mes réservations'}
			</Button>
			{#if auth.user?.role === 'ADMIN'}
				<Button variant="ghost" size="sm" href="/admin/workspaces">
					<LayoutGrid class="size-4" />
					Gérer les espaces
				</Button>
			{/if}
			{#if auth.user?.role === 'ADMIN'}
				<Button variant="ghost" size="sm" href="/admin/analytics">
					<BarChart3 class="size-4" />
					Analytique
				</Button>
			{/if}
			{#if auth.user?.role === 'ADMIN'}
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

	{#if auth.user?.role === 'ADMIN'}
		<Card.Root class="mb-8">
			<Card.Header>
				<Card.Title>
					<UserPlus class="size-5 inline-block mr-1" />
					Nouvel Utilisateur
				</Card.Title>
			</Card.Header>
			<Card.Content>
				{#if error}
					<div class="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
						{error}
					</div>
				{/if}
				<div class="flex gap-3">
					<Input
						type="email"
						bind:value={email}
						placeholder="Email pro"
						class="flex-1"
					/>
					<Input
						type="password"
						bind:value={password}
						placeholder="Mot de passe"
						class="flex-1"
					/>
					<Button onclick={createUser} disabled={loading}>
						{loading ? '...' : 'Ajouter'}
					</Button>
				</div>
			</Card.Content>
		</Card.Root>

		<Card.Root>
			<Card.Content class="p-0">
				{#if users.length === 0}
					<div class="p-8 text-center text-muted-foreground">Aucun utilisateur trouvé.</div>
				{:else}
					<ul class="divide-y divide-border">
						{#each users as user}
							<li
								class="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
							>
								<div class="flex flex-col">
									<span class="font-medium">{user.email}</span>
									<span class="text-xs text-muted-foreground">ID: {user.id}</span>
								</div>
								<Badge variant="secondary">
									{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
								</Badge>
							</li>
						{/each}
					</ul>
				{/if}
			</Card.Content>
		</Card.Root>
	{:else}
		<Card.Root>
			<Card.Header>
				<Card.Title>Bienvenue sur Tempo</Card.Title>
				<Card.Description>
					Consultez vos réservations ou réservez un nouvel espace de travail.
				</Card.Description>
			</Card.Header>
			<Card.Content>
				<Button href="/bookings">
					<CalendarDays class="size-4" />
					Accéder à mes réservations
				</Button>
			</Card.Content>
		</Card.Root>
	{/if}
</div>
