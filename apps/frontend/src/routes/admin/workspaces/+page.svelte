<script lang="ts">
	import { getAuthClient } from '$lib/client';
	import { auth } from '$lib/auth.svelte';
	import { goto } from '$app/navigation';
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

	type Workspace = {
		id: number;
		name: string;
		type: 'DESK' | 'MEETING_ROOM';
		capacity: number;
		createdAt: string;
	};

	let workspaces = $state<Workspace[]>([]);
	let name = $state('');
	let type = $state<'DESK' | 'MEETING_ROOM'>('DESK');
	let capacity = $state(1);
	let editingId = $state<number | null>(null);
	let loading = $state(false);
	let deleting = $state<number | null>(null);

	onMount(async () => {
		if (!auth.isLoggedIn) {
			goto('/login');
			return;
		}
		if (auth.user?.role !== 'ADMIN') {
			goto('/');
			return;
		}
		await fetchWorkspaces();
	});

	async function fetchWorkspaces() {
		const client = getAuthClient();
		const res = await (client as any).workspaces.$get();
		if (res.ok) {
			workspaces = await res.json();
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

	async function saveWorkspace() {
		if (!name) return;
		loading = true;

		try {
			const client = getAuthClient();
			const res = editingId === null
				? await (client as any).workspaces.$post({
					json: { name, type, capacity },
				})
				: await (client as any).workspaces[':id'].$patch({
					param: { id: String(editingId) },
					json: { name, type, capacity },
				});

			if (res.ok) {
				await fetchWorkspaces();
				resetForm();
			} else {
				alert(editingId === null ? 'Erreur lors de la création' : 'Erreur lors de la modification');
			}
		} finally {
			loading = false;
		}
	}

	async function deleteWorkspace(id: number) {
		if (!confirm('Supprimer cet espace ?')) return;
		deleting = id;

		try {
			const client = getAuthClient();
			const res = await (client as any).workspaces[':id'].$delete({
				param: { id: String(id) }
			});

			if (res.ok) {
				await fetchWorkspaces();
				if (editingId === id) resetForm();
			} else {
				alert('Erreur lors de la suppression');
			}
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
				onclick={() => { auth.logout(); goto('/login'); }}
			>
				<LogOut class="size-4" />
			</Button>
		</div>
	</div>

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
									{new Date(workspace.createdAt).toLocaleDateString()}
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
