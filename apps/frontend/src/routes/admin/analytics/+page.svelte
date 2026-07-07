<script lang="ts">
	import { getAuthClient } from '$lib/client';
	import { auth } from '$lib/auth.svelte';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import LogOut from '@lucide/svelte/icons/log-out';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import LayoutGrid from '@lucide/svelte/icons/layout-grid';
	import BarChart3 from '@lucide/svelte/icons/bar-chart-3';
	import Users from '@lucide/svelte/icons/users';
	import CalendarDays from '@lucide/svelte/icons/calendar-days';
	import Activity from '@lucide/svelte/icons/activity';

	type Overview = {
		totalUsers: number;
		totalWorkspaces: number;
		totalBookings: number;
		activeBookings: number;
		occupancyRate: number;
	};

	type WorkspaceStat = {
		id: number;
		name: string;
		type: 'DESK' | 'MEETING_ROOM';
		capacity: number;
		bookingCount: number;
		activeBookings: number;
		utilizationRate: number;
	};

	let overview = $state<Overview | null>(null);
	let workspaceStats = $state<WorkspaceStat[]>([]);
	let loading = $state(true);
	let error = $state('');

	onMount(async () => {
		if (!auth.isLoggedIn) {
			goto('/login');
			return;
		}
		if (auth.user?.role !== 'ADMIN') {
			goto('/');
			return;
		}
		await Promise.all([fetchOverview(), fetchWorkspaceStats()]);
		loading = false;
	});

	async function fetchOverview() {
		const client = getAuthClient();
		const res = await (client as any).analytics.overview.$get();
		if (res.ok) {
			overview = await res.json();
		} else {
			error = 'Erreur lors du chargement des statistiques';
		}
	}

	async function fetchWorkspaceStats() {
		const client = getAuthClient();
		const res = await (client as any).analytics.workspaces.$get();
		if (res.ok) {
			workspaceStats = await res.json();
		}
	}

	function utilizationVariant(rate: number): 'default' | 'secondary' | 'destructive' {
		if (rate >= 80) return 'destructive';
		if (rate >= 50) return 'default';
		return 'secondary';
	}
</script>

<svelte:head>
	<title>Analytique - Tempo</title>
</svelte:head>

<div class="mx-auto max-w-5xl p-10">
	<div class="flex justify-between items-center mb-6">
		<div>
			<h1 class="text-3xl font-bold">Analytique</h1>
			<p class="text-muted-foreground text-sm mt-1">Taux d'occupation et utilisation des espaces</p>
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

	{#if error}
		<div class="p-4 mb-6 rounded-md bg-destructive/10 text-destructive text-sm">{error}</div>
	{/if}

	{#if loading}
		<div class="p-8 text-center text-muted-foreground">Chargement des statistiques...</div>
	{:else if overview}
		<!-- Cartes de synthèse -->
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
			<Card.Root>
				<Card.Content class="pt-6">
					<div class="flex items-center gap-2 text-muted-foreground text-sm mb-1">
						<Users class="size-4" />
						Utilisateurs
					</div>
					<div class="text-3xl font-bold">{overview.totalUsers}</div>
				</Card.Content>
			</Card.Root>

			<Card.Root>
				<Card.Content class="pt-6">
					<div class="flex items-center gap-2 text-muted-foreground text-sm mb-1">
						<LayoutGrid class="size-4" />
						Espaces
					</div>
					<div class="text-3xl font-bold">{overview.totalWorkspaces}</div>
				</Card.Content>
			</Card.Root>

			<Card.Root>
				<Card.Content class="pt-6">
					<div class="flex items-center gap-2 text-muted-foreground text-sm mb-1">
						<CalendarDays class="size-4" />
						Réservations
					</div>
					<div class="text-3xl font-bold">{overview.totalBookings}</div>
				</Card.Content>
			</Card.Root>

			<Card.Root>
				<Card.Content class="pt-6">
					<div class="flex items-center gap-2 text-muted-foreground text-sm mb-1">
						<Activity class="size-4" />
						Actives
					</div>
					<div class="text-3xl font-bold">{overview.activeBookings}</div>
				</Card.Content>
			</Card.Root>

			<Card.Root>
				<Card.Content class="pt-6">
					<div class="flex items-center gap-2 text-muted-foreground text-sm mb-1">
						<BarChart3 class="size-4" />
						Occupation
					</div>
					<div class="text-3xl font-bold">{overview.occupancyRate}%</div>
				</Card.Content>
			</Card.Root>
		</div>

		<!-- Détail par espace -->
		<Card.Root>
			<Card.Header>
				<Card.Title>Utilisation par espace</Card.Title>
			</Card.Header>
			<Card.Content class="p-0">
				{#if workspaceStats.length === 0}
					<div class="p-8 text-center text-muted-foreground">Aucun espace à analyser.</div>
				{:else}
					<Table.Root>
						<Table.Header>
							<Table.Row>
								<Table.Head>Espace</Table.Head>
								<Table.Head>Type</Table.Head>
								<Table.Head>Capacité</Table.Head>
								<Table.Head>Réservations</Table.Head>
								<Table.Head>Actives</Table.Head>
								<Table.Head>Utilisation</Table.Head>
							</Table.Row>
						</Table.Header>
						<Table.Body>
							{#each workspaceStats as stat}
								<Table.Row>
									<Table.Cell class="font-medium">{stat.name}</Table.Cell>
									<Table.Cell>
										<Badge variant={stat.type === 'DESK' ? 'default' : 'secondary'}>
											{stat.type === 'DESK' ? '🪑 Bureau' : '🚪 Salle'}
										</Badge>
									</Table.Cell>
									<Table.Cell>{stat.capacity} pers.</Table.Cell>
									<Table.Cell>{stat.bookingCount}</Table.Cell>
									<Table.Cell>{stat.activeBookings}</Table.Cell>
									<Table.Cell>
										<div class="flex items-center gap-2">
											<div class="w-24 h-2 rounded-full bg-muted overflow-hidden">
												<div
													class="h-full rounded-full bg-primary transition-all"
													style="width: {stat.utilizationRate}%"
												></div>
											</div>
											<Badge variant={utilizationVariant(stat.utilizationRate)}>
												{stat.utilizationRate}%
											</Badge>
										</div>
									</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				{/if}
			</Card.Content>
		</Card.Root>
	{/if}
</div>
