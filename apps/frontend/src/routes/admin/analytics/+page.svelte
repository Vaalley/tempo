<script lang="ts">
	import type { AnalyticsOverview, WorkspaceStat } from '$lib/api-types';
	import { authorizedApi } from '$lib/authorized-api';
	import { getErrorMessage } from '$lib/api-response';
	import { auth } from '$lib/auth.svelte';
	import { enforceRouteAccess, logoutAndRedirect } from '$lib/route-guard';
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
	import ScrollText from '@lucide/svelte/icons/scroll-text';

	let overview = $state<AnalyticsOverview | null>(null);
	let workspaceStats = $state<WorkspaceStat[]>([]);
	let loading = $state(true);
	let error = $state('');

	onMount(async () => {
		if (!(await enforceRouteAccess('ADMIN'))) return;
		await Promise.all([fetchOverview(), fetchWorkspaceStats()]);
		loading = false;
	});

	async function fetchOverview(): Promise<void> {
		try {
			overview = await authorizedApi.analytics.overview();
		} catch (caughtError) {
			error = getErrorMessage(caughtError, 'Erreur lors du chargement des statistiques');
		}
	}

	async function fetchWorkspaceStats(): Promise<void> {
		try {
			workspaceStats = await authorizedApi.analytics.workspaces();
		} catch (caughtError) {
			error = getErrorMessage(
				caughtError,
				'Erreur lors du chargement des statistiques par espace',
			);
		}
	}

	function utilizationVariant(rate: number): 'default' | 'secondary' {
		return rate > 0 ? 'default' : 'secondary';
	}
</script>

<svelte:head>
	<title>Analytique - Tempo</title>
</svelte:head>

<div class="mx-auto max-w-5xl p-10">
	<div class="flex justify-between items-center mb-6">
		<div>
			<h1 class="text-3xl font-bold">Analytique</h1>
			<p class="text-muted-foreground text-sm mt-1">
				Part des espaces occupés par une réservation en cours
			</p>
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
			<Button variant="ghost" size="sm" href="/admin/audit">
				<ScrollText class="size-4" />
				Audit
			</Button>
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
				<Card.Title>Utilisation actuelle par espace</Card.Title>
				<Card.Description>
					Un espace réservé en ce moment est utilisé à 100 %, quelle que soit sa capacité.
				</Card.Description>
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
