<script lang="ts">
	import type { Booking, Workspace } from '$lib/api-types';
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
	import * as Alert from '$lib/components/ui/alert/index.js';
	import { Badge } from '$lib/components/ui/badge/index.js';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import LogOut from '@lucide/svelte/icons/log-out';
	import ArrowLeft from '@lucide/svelte/icons/arrow-left';
	import LayoutGrid from '@lucide/svelte/icons/layout-grid';
	import CalendarPlus from '@lucide/svelte/icons/calendar-plus';
	import CircleAlert from '@lucide/svelte/icons/circle-alert';
	import QrCode from '@lucide/svelte/icons/qr-code';
	import UserPlus from '@lucide/svelte/icons/user-plus';
	import Users from '@lucide/svelte/icons/users';
	import X from '@lucide/svelte/icons/x';
	import ScrollText from '@lucide/svelte/icons/scroll-text';

	let bookings = $state<Booking[]>([]);
	let workspaces = $state<Workspace[]>([]);
	let selectedWorkspaceId = $state<string>('');
	let startDate = $state('');
	let startTime = $state('09:00');
	let endDate = $state('');
	let endTime = $state('10:00');
	let visibility = $state<'PUBLIC' | 'PRIVATE'>('PRIVATE');
	let loading = $state(false);
	let deleting = $state<string | null>(null);
	let actionLoading = $state(false);
	let managedBookingId = $state<string | null>(null);
	let inviteEmail = $state('');
	let qrCodeDataUrl = $state('');
	let error = $state('');
	let managedBooking = $derived(
		bookings.find((booking) => booking.id === managedBookingId) ?? null,
	);

	onMount(async () => {
		if (!(await enforceRouteAccess('AUTHENTICATED'))) return;
		await Promise.all([fetchBookings(), fetchWorkspaces()]);
	});

	async function fetchBookings(): Promise<void> {
		try {
			bookings = await authorizedApi.bookings.list();
		} catch (caughtError) {
			error = getErrorMessage(caughtError, 'Erreur lors du chargement des réservations');
		}
	}

	async function fetchWorkspaces(): Promise<void> {
		try {
			workspaces = await authorizedApi.workspaces.list();
		} catch (caughtError) {
			error = getErrorMessage(caughtError, 'Erreur lors du chargement des espaces');
		}
	}

	async function createBooking(): Promise<void> {
		if (!selectedWorkspaceId || !startDate || !endDate) {
			error = 'Veuillez remplir tous les champs';
			return;
		}

		error = '';
		loading = true;

		try {
			const startAt = new Date(`${startDate}T${startTime}:00`).toISOString();
			const endAt = new Date(`${endDate}T${endTime}:00`).toISOString();

			const payload = {
				workspaceId: Number(selectedWorkspaceId),
				startAt,
				endAt,
				visibility,
			};

			await authorizedApi.bookings.create(payload);
			await fetchBookings();
			selectedWorkspaceId = '';
			startDate = '';
			endDate = '';
			startTime = '09:00';
			endTime = '10:00';
			visibility = 'PRIVATE';
		} catch (caughtError) {
			error = getErrorMessage(caughtError, 'Erreur lors de la création');
		} finally {
			loading = false;
		}
	}

	async function inviteParticipant(): Promise<void> {
		if (!managedBookingId || !inviteEmail) return;
		actionLoading = true;
		error = '';

		try {
			await authorizedApi.bookings.invite(managedBookingId, { email: inviteEmail });
			inviteEmail = '';
			await fetchBookings();
		} catch (caughtError) {
			error = getErrorMessage(caughtError, "Erreur lors de l'envoi de l'invitation");
		} finally {
			actionLoading = false;
		}
	}

	async function respondToInvitation(
		bookingId: string,
		participantId: string,
		status: 'ACCEPTED' | 'DECLINED',
	): Promise<void> {
		actionLoading = true;
		error = '';

		try {
			await authorizedApi.bookings.respondInvitation(bookingId, participantId, { status });
			await fetchBookings();
		} catch (caughtError) {
			error = getErrorMessage(caughtError, "Erreur lors de la réponse à l'invitation");
		} finally {
			actionLoading = false;
		}
	}

	async function joinBooking(bookingId: string): Promise<void> {
		actionLoading = true;
		error = '';

		try {
			await authorizedApi.bookings.join(bookingId);
			await fetchBookings();
		} catch (caughtError) {
			error = getErrorMessage(caughtError, 'Erreur lors de la participation');
		} finally {
			actionLoading = false;
		}
	}

	async function generateQrCode(): Promise<void> {
		if (!managedBookingId) return;
		actionLoading = true;
		error = '';

		try {
			const qrCode = await authorizedApi.bookings.generateQr(managedBookingId);
			qrCodeDataUrl = qrCode.qrCodeDataUrl;
		} catch (caughtError) {
			error = getErrorMessage(caughtError, 'Erreur lors de la génération du QR code');
		} finally {
			actionLoading = false;
		}
	}

	function manageBooking(id: string): void {
		managedBookingId = managedBookingId === id ? null : id;
		inviteEmail = '';
		qrCodeDataUrl = '';
	}

	async function deleteBooking(id: string): Promise<void> {
		if (!confirm('Supprimer cette réservation ?')) return;
		deleting = id;

		try {
			await authorizedApi.bookings.delete(id);
			await fetchBookings();
		} catch (caughtError) {
			error = getErrorMessage(caughtError, "Erreur lors de l'annulation");
		} finally {
			deleting = null;
		}
	}

	function formatDate(dateStr: string): string {
		return new Date(dateStr).toLocaleString('fr-FR', {
			dateStyle: 'short',
			timeStyle: 'short',
		});
	}

	function isPast(dateStr: string): boolean {
		return new Date(dateStr) < new Date();
	}

	function participantForCurrentUser(booking: Booking) {
		return booking.participants.find((participant) => participant.userId === auth.user?.id);
	}

	function canManageBooking(booking: Booking): boolean {
		return auth.user?.role === 'ADMIN' || booking.userId === auth.user?.id;
	}

	function selectedWorkspaceLabel(): string {
		if (!selectedWorkspaceId) return 'Choisir un espace';
		const ws = workspaces.find((w) => String(w.id) === selectedWorkspaceId);
		if (!ws) return 'Choisir un espace';
		return `${ws.type === 'DESK' ? '🪑' : '🚪'} ${ws.name}`;
	}
</script>

<svelte:head>
	<title>{auth.user?.role === 'ADMIN' ? 'Toutes les réservations' : 'Mes réservations'} - Tempo</title>
</svelte:head>

<div class="mx-auto max-w-5xl p-10">
	<div class="flex justify-between items-center mb-6">
		<div>
			<h1 class="text-3xl font-bold">
				{auth.user?.role === 'ADMIN' ? 'Toutes les réservations' : 'Mes réservations'}
			</h1>
			<p class="text-muted-foreground text-sm mt-1">
				{auth.user?.role === 'ADMIN'
					? "Supervisez les réservations de l'ensemble des utilisateurs"
					: "Gérez vos réservations d'espaces"}
			</p>
		</div>
		<div class="flex items-center gap-2">
			<Button variant="ghost" size="sm" href="/">
				<ArrowLeft class="size-4" />
				Accueil
			</Button>
			{#if auth.user?.role === 'ADMIN'}
				<Button variant="ghost" size="sm" href="/admin/workspaces">
					<LayoutGrid class="size-4" />
					Espaces
				</Button>
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

	<!-- Formulaire de création -->
	<Card.Root class="mb-8">
		<Card.Header>
			<Card.Title>
				<CalendarPlus class="size-5 inline-block mr-1" />
				Nouvelle Réservation
			</Card.Title>
		</Card.Header>
		<Card.Content>
			{#if error}
				<Alert.Root variant="destructive" class="mb-4">
					<CircleAlert class="size-4" />
					<Alert.Title>Erreur</Alert.Title>
					<Alert.Description>{error}</Alert.Description>
				</Alert.Root>
			{/if}

			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
				<Select.Root
					type="single"
					value={selectedWorkspaceId}
					onValueChange={(v) => { if (v !== undefined) selectedWorkspaceId = v; }}
				>
					<Select.Trigger class="w-full" aria-label="Espace">
						{selectedWorkspaceLabel()}
					</Select.Trigger>
					<Select.Content>
						{#each workspaces as workspace}
							<Select.Item value={String(workspace.id)} label="{workspace.type === 'DESK' ? '🪑' : '🚪'} {workspace.name}">
								{workspace.type === 'DESK' ? '🪑' : '🚪'} {workspace.name}
							</Select.Item>
						{/each}
					</Select.Content>
				</Select.Root>

				<Select.Root
					type="single"
					value={visibility}
					onValueChange={(value) => {
						if (value === 'PUBLIC' || value === 'PRIVATE') visibility = value;
					}}
				>
					<Select.Trigger class="w-full" aria-label="Visibilité">
						{visibility === 'PUBLIC' ? 'Publique' : 'Privée'}
					</Select.Trigger>
					<Select.Content>
						<Select.Item value="PRIVATE" label="Privée">Privée</Select.Item>
						<Select.Item value="PUBLIC" label="Publique">Publique</Select.Item>
					</Select.Content>
				</Select.Root>

				<Input
					type="date"
					aria-label="Date de début"
					bind:value={startDate}
				/>
				<Input
					type="time"
					aria-label="Heure de début"
					bind:value={startTime}
				/>
				<Input
					type="date"
					aria-label="Date de fin"
					bind:value={endDate}
				/>
				<Input
					type="time"
					aria-label="Heure de fin"
					bind:value={endTime}
				/>
			</div>

			<Button
				onclick={createBooking}
				disabled={loading || !selectedWorkspaceId || !startDate || !endDate}
				class="mt-4"
			>
				{loading ? 'Création...' : 'Réserver'}
			</Button>
		</Card.Content>
	</Card.Root>

	<!-- Liste des réservations -->
	<Card.Root>
		<Card.Header>
			<Card.Title>
				{bookings.length} réservation{bookings.length > 1 ? 's' : ''}
			</Card.Title>
		</Card.Header>
		<Card.Content class="p-0">
			{#if bookings.length === 0}
				<div class="p-8 text-center text-muted-foreground">Aucune réservation.</div>
			{:else}
				<Table.Root>
					<Table.Header>
						<Table.Row>
							<Table.Head>Espace</Table.Head>
							{#if auth.user?.role === 'ADMIN'}
								<Table.Head>Propriétaire</Table.Head>
							{/if}
							<Table.Head>Début</Table.Head>
							<Table.Head>Fin</Table.Head>
							<Table.Head>Visibilité</Table.Head>
							<Table.Head>Participants</Table.Head>
							<Table.Head>Statut</Table.Head>
							<Table.Head class="text-right">Actions</Table.Head>
						</Table.Row>
					</Table.Header>
					<Table.Body>
						{#each bookings as booking}
							{@const currentParticipant = participantForCurrentUser(booking)}
							<Table.Row
								data-booking-id={booking.id}
								class={isPast(booking.endAt) ? 'opacity-50' : ''}
							>
								<Table.Cell>
									<div class="flex items-center gap-2">
										<span class="text-xl">
											{booking.workspace.type === 'DESK' ? '🪑' : '🚪'}
										</span>
										<div>
											<div class="font-medium">{booking.workspace.name}</div>
											<div class="text-xs text-muted-foreground">
												{booking.workspace.type === 'DESK' ? 'Bureau' : 'Salle'} · {booking.workspace.capacity} pers.
											</div>
										</div>
									</div>
								</Table.Cell>
								{#if auth.user?.role === 'ADMIN'}
									<Table.Cell>
										<div class="font-medium">{booking.user?.email ?? 'Utilisateur inconnu'}</div>
										<div class="text-xs text-muted-foreground">{booking.user?.role ?? '—'}</div>
									</Table.Cell>
								{/if}
								<Table.Cell>{formatDate(booking.startAt)}</Table.Cell>
								<Table.Cell>{formatDate(booking.endAt)}</Table.Cell>
								<Table.Cell>
									<Badge variant={booking.visibility === 'PUBLIC' ? 'default' : 'outline'}>
										{booking.visibility === 'PUBLIC' ? 'Publique' : 'Privée'}
									</Badge>
								</Table.Cell>
								<Table.Cell>
									<div class="flex items-center gap-1">
										<Users class="size-4" />
										{booking.participants.filter((participant) => participant.invitationStatus !== 'DECLINED').length}/{booking.workspace.capacity}
									</div>
								</Table.Cell>
								<Table.Cell>
									{#if isPast(booking.endAt)}
										<Badge variant="outline">Passée</Badge>
									{:else if new Date(booking.startAt) <= new Date() && new Date() <= new Date(booking.endAt)}
										<Badge variant="default">En cours</Badge>
									{:else}
										<Badge variant="secondary">À venir</Badge>
									{/if}
								</Table.Cell>
								<Table.Cell class="text-right">
									<div class="flex justify-end gap-1 flex-wrap">
										{#if currentParticipant?.invitationStatus === 'PENDING'}
											<Button
												size="sm"
												onclick={() => respondToInvitation(booking.id, currentParticipant.id, 'ACCEPTED')}
												disabled={actionLoading}
											>
												Accepter
											</Button>
											<Button
												variant="outline"
												size="sm"
												onclick={() => respondToInvitation(booking.id, currentParticipant.id, 'DECLINED')}
												disabled={actionLoading}
											>
												Refuser
											</Button>
										{:else if booking.visibility === 'PUBLIC' && !currentParticipant && !isPast(booking.endAt)}
											<Button
												variant="outline"
												size="sm"
												onclick={() => joinBooking(booking.id)}
												disabled={actionLoading}
											>
												Rejoindre
											</Button>
										{/if}
										{#if canManageBooking(booking) && !isPast(booking.endAt)}
											<Button
												variant="outline"
												size="sm"
												onclick={() => manageBooking(booking.id)}
											>
												<UserPlus class="size-4" />
												Gérer
											</Button>
										{/if}
										{#if canManageBooking(booking) && !isPast(booking.endAt)}
										<Button
											variant="ghost"
											size="sm"
											onclick={() => deleteBooking(booking.id)}
											disabled={deleting === booking.id}
											class="text-destructive hover:text-destructive"
										>
											<X class="size-4" />
											{deleting === booking.id ? '...' : 'Annuler'}
										</Button>
									{/if}
									</div>
								</Table.Cell>
							</Table.Row>
						{/each}
					</Table.Body>
				</Table.Root>
			{/if}
		</Card.Content>
	</Card.Root>

	{#if managedBooking}
		<Card.Root class="mt-8">
			<Card.Header>
				<Card.Title>Participants et QR code</Card.Title>
				<Card.Description>
					{managedBooking.workspace.name} · {formatDate(managedBooking.startAt)}
				</Card.Description>
			</Card.Header>
			<Card.Content class="space-y-6">
				<div>
					<h2 class="font-semibold mb-2">Participants</h2>
					<ul class="space-y-2">
						{#each managedBooking.participants as participant}
							<li class="flex items-center justify-between rounded-md border p-3">
								<div>
									<div class="font-medium">{participant.user.email}</div>
									<div class="text-xs text-muted-foreground">
										{participant.role === 'OWNER' ? 'Organisateur' : 'Invité'}
										{participant.checkedInAt ? ` · Présent depuis ${formatDate(participant.checkedInAt)}` : ''}
									</div>
								</div>
								<Badge variant={participant.invitationStatus === 'ACCEPTED' ? 'default' : 'outline'}>
									{participant.invitationStatus === 'ACCEPTED'
										? 'Accepté'
										: participant.invitationStatus === 'PENDING'
											? 'En attente'
											: 'Refusé'}
								</Badge>
							</li>
						{/each}
					</ul>
				</div>

				<div class="flex gap-2">
					<Input
						type="email"
						aria-label="Email du participant"
						placeholder="participant@entreprise.fr"
						bind:value={inviteEmail}
					/>
					<Button onclick={inviteParticipant} disabled={actionLoading || !inviteEmail}>
						<UserPlus class="size-4" />
						Inviter
					</Button>
				</div>

				<div class="border-t pt-6">
					<Button onclick={generateQrCode} disabled={actionLoading}>
						<QrCode class="size-4" />
						{qrCodeDataUrl ? 'Renouveler le QR code' : 'Générer le QR code'}
					</Button>
					{#if qrCodeDataUrl}
						<div class="mt-4 rounded-md border p-4 inline-block bg-white">
							<img src={qrCodeDataUrl} alt="QR code de check-in" class="size-64" />
						</div>
						<p class="text-sm text-muted-foreground mt-2">
							Chaque participant accepté peut scanner ce code pendant le créneau.
						</p>
					{/if}
				</div>
			</Card.Content>
		</Card.Root>
	{/if}
</div>
