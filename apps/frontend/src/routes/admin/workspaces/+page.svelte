<script lang="ts">
	import type { Workspace } from '$lib/api-types';
	import { authorizedApi } from '$lib/authorized-api';
	import { getErrorMessage } from '$lib/api-response';
	import { auth } from '$lib/auth.svelte';
	import { enforceRouteAccess, logoutAndRedirect } from '$lib/route-guard';
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as Card from '$lib/components/ui/card/index.js';
	import * as Table from '$lib/components/ui/table/index.js';
	import * as Select from '$lib/components/ui/select/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import LogOut from '@lucide/svelte/icons/log-out';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import Plus from '@lucide/svelte/icons/plus';
	import Pencil from '@lucide/svelte/icons/pencil';
	import Trash2 from '@lucide/svelte/icons/trash-2';
	import X from '@lucide/svelte/icons/x';
	import BarChart3 from '@lucide/svelte/icons/bar-chart-3';
	import ScrollText from '@lucide/svelte/icons/scroll-text';

	let workspaces = $state<Workspace[]>([]);
	let name = $state('');
	let type = $state<'DESK' | 'MEETING_ROOM'>('DESK');
	let capacity = $state(1);
	let editingId = $state<number | null>(null);
	let loading = $state(false);
	let deleting = $state<number | null>(null);
	let error = $state('');

	onMount(async () => {
		if (!(await enforceRouteAccess('ADMIN'))) return;
		await fetchWorkspaces();
	});

	async function fetchWorkspaces(): Promise<void> {
		try {
			workspaces = await authorizedApi.workspaces.list();
		} catch (caughtError) {
			error = getErrorMessage(caughtError, 'Erreur lors du chargement des espaces');
		}
	}

	function resetForm() {
		name = '';
		type = 'DESK';
		capacity = 1;
		editingId = null;
	}

	function editWorkspace(workspace: Workspace) {
		name = workspace.name;
		type = workspace.type;
		capacity = workspace.capacity;
		editingId = workspace.id;
	}

	async function saveWorkspace(): Promise<void> {
		if (!name) return;
		error = '';
		loading = true;

		try {
			if (editingId === null) {
				await authorizedApi.workspaces.create({ name, type, capacity });
			} else {
				await authorizedApi.workspaces.update(editingId, { name, type, capacity });
			}
			await fetchWorkspaces();
			resetForm();
		} catch (caughtError) {
			error = getErrorMessage(caughtError, "Erreur lors de l'enregistrement de l'espace");
		} finally {
			loading = false;
		}
	}

	async function deleteWorkspace(id: number): Promise<void> {
		if (!confirm('Supprimer cet espace ?')) return;
		deleting = id;

		try {
			await authorizedApi.workspaces.delete(id);
			await fetchWorkspaces();
			if (editingId === id) resetForm();
		} catch (caughtError) {
			error = getErrorMessage(caughtError, "Erreur lors de la suppression de l'espace");
		} finally {
			deleting = null;
		}
	}
</script>

<svelte:head>
	<title>Gestion des Espaces - Tempo</title>
</svelte:head>

<div class="mx-auto max-w-4xl p-10">
	<div class="flex justify-between items-center mb-6">
		<div>
			<h1 class="text-3xl font-bold">Gestion des Espaces</h1>
			<p class="text-muted-foreground text-sm mt-1">Bureaux et salles de réunion</p>
		</div>
		<div class="flex items-center gap-2">
			<Button variant="ghost" size="sm" href="/">
				<ArrowLeft class="size-4" />
				Accueil
			</Button>
			<Button variant="ghost" size="sm" href="/admin/analytics">
				<BarChart3 class="size-4" />
				Analytique
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
		<div class="mb-6 rounded-md bg-destructive/10 p-4 text-sm text-destructive">{error}</div>
	{/if}

	<!-- Formulaire de création ou de modification -->
	<Card.Root class="mb-8">
		<Card.Header>
			<Card.Title>
				{#if editingId === null}
					<Plus class="size-5 inline-block mr-1" />
					Nouvel Espace
				{:else}
					<Pencil class="size-5 inline-block mr-1" />
					Modifier l'espace
				{/if}
			</Card.Title>
		</Card.Header>
		<Card.Content>
			<div class="grid grid-cols-1 md:grid-cols-4 gap-4">
				<Input
					type="text"
					bind:value={name}
					placeholder="Nom de l'espace"
				/>
				<Select.Root
					type="single"
					value={type}
					onValueChange={(v) => { if (v) type = v as 'DESK' | 'MEETING_ROOM'; }}
				>
					<Select.Trigger class="w-full">
						{type === 'DESK' ? 'Bureau' : 'Salle de réunion'}
					</Select.Trigger>
					<Select.Content>
						<Select.Item value="DESK" label="Bureau" />
						<Select.Item value="MEETING_ROOM" label="Salle de réunion" />
					</Select.Content>
				</Select.Root>
				<Input
					type="number"
					bind:value={capacity}
					min={1}
					placeholder="Capacité"
				/>
				<div class="flex gap-2">
					<Button onclick={saveWorkspace} disabled={loading || !name} class="flex-1">
						{loading ? '...' : editingId === null ? 'Ajouter' : 'Enregistrer'}
					</Button>
					{#if editingId !== null}
						<Button variant="outline" size="icon" onclick={resetForm} aria-label="Annuler la modification">
							<X class="size-4" />
						</Button>
					{/if}
				</div>
			</div>
		</Card.Content>
	</Card.Root>

	<!-- Liste des espaces -->
	<Card.Root>
		<Card.Header>
			<Card.Title>
				{workspaces.length} espace{workspaces.length > 1 ? 's' : ''}
			</Card.Title>
		</Card.Header>
		<Card.Content class="p-0">
			{#if workspaces.length === 0}
				<div class="p-8 text-center text-muted-foreground">Aucun espace créé.</div>
			{:else}
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Nom</Table.Head>
							<Table.Head>Type</Table.Head>
							<Table.Head>Capacité</Table.Head>
							<Table.Head>Créé le</Table.Head>
							<Table.Head class="text-right">Actions</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each workspaces as workspace}
							<Table.Row>
								<Table.Cell class="font-medium">{workspace.name}</Table.Cell>
								<Table.Cell>
									<Badge variant={workspace.type === 'DESK' ? 'default' : 'secondary'}>
										{workspace.type === 'DESK' ? '🪑 Bureau' : '🚪 Salle'}
									</Badge>
								</Table.Cell>
								<Table.Cell>{workspace.capacity} pers.</Table.Cell>
								<Table.Cell class="text-muted-foreground text-sm">
									{workspace.createdAt
										? new Date(workspace.createdAt).toLocaleDateString()
										: '—'}
								</Table.Cell>
								<Table.Cell class="text-right">
									<Button
										variant="ghost"
										size="sm"
										onclick={() => editWorkspace(workspace)}
										disabled={deleting === workspace.id}
									>
										<Pencil class="size-4" />
										Modifier
									</Button>
									<Button
										variant="ghost"
										size="sm"
										onclick={() => deleteWorkspace(workspace.id)}
										disabled={deleting === workspace.id}
										class="text-destructive hover:text-destructive"
									>
										<Trash2 class="size-4" />
										{deleting === workspace.id ? '...' : 'Supprimer'}
									</Button>
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			{/if}
		</Card.Content>
	</Card.Root>
</div>
