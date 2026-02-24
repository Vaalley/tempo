<script lang="ts">
	import { getAuthClient } from '$lib/client';
	import { auth } from '$lib/auth.svelte';
	import { goto } from '$app/navigation';
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
				await fetchUsers();
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

<div class="mx-auto max-w-2xl p-10">
	<div class="flex justify-between items-center mb-6">
		<h1 class="text-3xl font-bold">Tempo</h1>
		<div class="flex items-center gap-2">
			<Button variant="ghost" size="sm" href="/bookings">
				<CalendarDays class="size-4" />
				Mes réservations
			</Button>
			<Button variant="ghost" size="sm" href="/admin/workspaces">
				<LayoutGrid class="size-4" />
				Gérer les espaces
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

	<Card.Root class="mb-8">
		<Card.Header>
			<Card.Title>
				<UserPlus class="size-5 inline-block mr-1" />
				Nouvel Utilisateur
			</Card.Title>
		</Card.Header>
		<Card.Content>
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
						<li class="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
							<div class="flex flex-col">
								<span class="font-medium">{user.email}</span>
								<span class="text-xs text-muted-foreground">ID: {user.id}</span>
							</div>
							<Badge variant="secondary">
								{new Date(user.createdAt).toLocaleDateString()}
							</Badge>
						</li>
					{/each}
				</ul>
			{/if}
		</Card.Content>
	</Card.Root>
</div>