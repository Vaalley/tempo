<script lang="ts">
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { auth } from '$lib/auth.svelte';
	import { getAuthClient } from '$lib/client';
	import { Button } from '$lib/components/ui/button/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import BarChart3 from '@lucide/svelte/icons/bar-chart-3';
	import CalendarDays from '@lucide/svelte/icons/calendar-days';
	import LayoutGrid from '@lucide/svelte/icons/layout-grid';
	import LogOut from '@lucide/svelte/icons/log-out';

	type AuditAction = 'DELETE_WORKSPACE' | 'DELETE_BOOKING' | 'DELETE_USER';

	type AuditLog = {
		action: AuditAction;
		entityType: 'workspace' | 'booking' | 'user';
		entityId: string | number;
		entityData: Record<string, unknown>;
		performedBy: {
			userId: string;
			email: string;
			role: 'ADMIN' | 'USER';
		};
		timestamp: string;
	};

	let logs = $state<AuditLog[]>([]);
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

		await fetchLogs();
		loading = false;
	});

	async function fetchLogs() {
		const client = getAuthClient();
		const res = await (client as any).audit.$get({ query: { limit: '100' } });

		if (res.ok) {
			logs = await res.json();
			return;
		}

		error = "Erreur lors du chargement des journaux d'audit";
	}

	function actionLabel(action: AuditAction): string {
		const labels: Record<AuditAction, string> = {
			DELETE_WORKSPACE: 'Espace supprimé',
			DELETE_BOOKING: 'Réservation annulée',
			DELETE_USER: 'Utilisateur supprimé',
		};
		return labels[action];
	}

	function entitySummary(log: AuditLog): string {
		const { entityData } = log;
		if (typeof entityData.name === 'string') return entityData.name;
		if (typeof entityData.email === 'string') return entityData.email;
		if (typeof entityData.workspaceId === 'number') {
			return `Espace #${entityData.workspaceId}`;
		}
		return `${log.entityType} #${log.entityId}`;
	}

	function formatDate(timestamp: string): string {
		return new Date(timestamp).toLocaleString('fr-FR', {
			dateStyle: 'short',
			timeStyle: 'medium',
		});
	}
</script>

<svelte:head>
	<title>Journal d'audit - Tempo</title>
</svelte:head>

<div class="mx-auto max-w-6xl p-10">
	<div class="flex justify-between items-center mb-6">
		<div>
			<h1 class="text-3xl font-bold">Journal d'audit</h1>
			<p class="text-muted-foreground text-sm mt-1">
				Les 100 suppressions sensibles les plus récentes
			</p>
		</div>
		<div class="flex items-center gap-2">
			<Button variant="ghost" size="sm" href="/">
				<ArrowLeft class="size-4" />
				Accueil
			</Button>
			<Button variant="ghost" size="sm" href="/bookings">
				<CalendarDays class="size-4" />
				Réservations
			</Button>
			<Button variant="ghost" size="sm" href="/admin/workspaces">
				<LayoutGrid class="size-4" />
				Espaces
			</Button>
			<Button variant="ghost" size="sm" href="/admin/analytics">
				<BarChart3 class="size-4" />
				Analytique
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

	<Card.Root>
		<Card.Header>
			<Card.Title>{logs.length} événement{logs.length > 1 ? 's' : ''}</Card.Title>
			<Card.Description>
				Les événements enregistrés dans MongoDB conservent l'identité de leur auteur.
			</Card.Description>
		</Card.Header>
		<Card.Content class="p-0">
			{#if loading}
				<div class="p-8 text-center text-muted-foreground">Chargement des événements...</div>
			{:else if logs.length === 0}
				<div class="p-8 text-center text-muted-foreground">Aucun événement d'audit.</div>
			{:else}
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Date</Table.Head>
							<Table.Head>Action</Table.Head>
							<Table.Head>Élément</Table.Head>
							<Table.Head>Auteur</Table.Head>
							<Table.Head>Rôle</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each logs as log}
							<Table.Row>
								<Table.Cell class="text-muted-foreground text-sm">
									{formatDate(log.timestamp)}
								</Table.Cell>
								<Table.Cell class="font-medium">{actionLabel(log.action)}</Table.Cell>
								<Table.Cell>
									<div>{entitySummary(log)}</div>
									<div class="text-xs text-muted-foreground">ID : {log.entityId}</div>
								</Table.Cell>
								<Table.Cell>{log.performedBy.email}</Table.Cell>
								<Table.Cell>
									<Badge variant={log.performedBy.role === 'ADMIN' ? 'default' : 'secondary'}>
										{log.performedBy.role}
									</Badge>
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			{/if}
		</Card.Content>
	</Card.Root>
</div>
