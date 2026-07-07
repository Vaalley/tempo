import { db } from '../../db';

export type Overview = {
	totalUsers: number;
	totalWorkspaces: number;
	totalBookings: number;
	activeBookings: number;
	occupancyRate: number;
};

export type WorkspaceStat = {
	id: number;
	name: string;
	type: 'DESK' | 'MEETING_ROOM';
	capacity: number;
	bookingCount: number;
	activeBookings: number;
	utilizationRate: number;
};

export type WorkspaceStats = WorkspaceStat[];

export const analyticsService = {
	async getOverview(): Promise<Overview> {
		const [users, workspaces, bookings] = await Promise.all([
			db.query.users.findMany(),
			db.query.workspaces.findMany(),
			db.query.bookings.findMany(),
		]);

		const now = new Date();
		const activeBookings = bookings.filter((b) => b.endAt > now).length;
		const totalWorkspaces = workspaces.length;
		const occupancyRate =
			totalWorkspaces === 0 ? 0 : Math.round((activeBookings / totalWorkspaces) * 100);

		return {
			totalUsers: users.length,
			totalWorkspaces,
			totalBookings: bookings.length,
			activeBookings,
			occupancyRate,
		};
	},

	async getWorkspaceStats(): Promise<WorkspaceStats> {
		const [workspaces, bookings] = await Promise.all([
			db.query.workspaces.findMany({
				orderBy: (workspaceTable, { asc }) => [asc(workspaceTable.name)],
			}),
			db.query.bookings.findMany(),
		]);

		const now = new Date();

		return workspaces.map((w) => {
			const wsBookings = bookings.filter((b) => b.workspaceId === w.id);
			const activeBookings = wsBookings.filter((b) => b.endAt > now).length;
			const utilizationRate =
				w.capacity === 0
					? 0
					: Math.min(100, Math.round((activeBookings / w.capacity) * 100));

			return {
				id: w.id,
				name: w.name,
				type: w.type,
				capacity: w.capacity,
				bookingCount: wsBookings.length,
				activeBookings,
				utilizationRate,
			};
		});
	},
};
