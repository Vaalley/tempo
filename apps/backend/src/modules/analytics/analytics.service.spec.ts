import { describe, it, expect, mock, beforeEach } from 'bun:test';
import { analyticsService } from './analytics.service';

type MockRow = Record<string, unknown>;

const mockUsersFindMany = mock((): Promise<MockRow[]> => Promise.resolve([]));
const mockWorkspacesFindMany = mock((): Promise<MockRow[]> => Promise.resolve([]));
const mockBookingsFindMany = mock((): Promise<MockRow[]> => Promise.resolve([]));

mock.module('../../db', () => ({
	db: {
		query: {
			users: { findMany: mockUsersFindMany },
			workspaces: { findMany: mockWorkspacesFindMany },
			bookings: { findMany: mockBookingsFindMany },
		},
	},
}));

describe('AnalyticsService', () => {
	beforeEach(() => {
		mockUsersFindMany.mockReset();
		mockWorkspacesFindMany.mockReset();
		mockBookingsFindMany.mockReset();
	});

	describe('getOverview', () => {
		it('should return zeroed stats when database is empty', async () => {
			mockUsersFindMany.mockResolvedValue([]);
			mockWorkspacesFindMany.mockResolvedValue([]);
			mockBookingsFindMany.mockResolvedValue([]);

			const result = await analyticsService.getOverview();

			expect(result).toEqual({
				totalUsers: 0,
				totalWorkspaces: 0,
				totalBookings: 0,
				activeBookings: 0,
				occupancyRate: 0,
			});
		});

		it('should count totals across users, workspaces and bookings', async () => {
			const past = new Date(Date.now() - 60_000);
			const future = new Date(Date.now() + 60_000);
			const later = new Date(Date.now() + 120_000);
			mockUsersFindMany.mockResolvedValue([{ id: 'u1' }, { id: 'u2' }]);
			mockWorkspacesFindMany.mockResolvedValue([{ id: 1 }, { id: 2 }, { id: 3 }]);
			mockBookingsFindMany.mockResolvedValue([
				{ id: 'b1', workspaceId: 1, startAt: past, endAt: future },
				{ id: 'b2', workspaceId: 2, startAt: future, endAt: later },
				{ id: 'b3', workspaceId: 3, startAt: past, endAt: past },
			]);

			const result = await analyticsService.getOverview();

			expect(result.totalUsers).toBe(2);
			expect(result.totalWorkspaces).toBe(3);
			expect(result.totalBookings).toBe(3);
			expect(result.activeBookings).toBe(1);
		});

		it('should compute occupancy from distinct occupied workspaces', async () => {
			const past = new Date(Date.now() - 60_000);
			const future = new Date(Date.now() + 60_000);
			mockUsersFindMany.mockResolvedValue([]);
			mockWorkspacesFindMany.mockResolvedValue([{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }]);
			mockBookingsFindMany.mockResolvedValue([
				{ id: 'b1', workspaceId: 1, startAt: past, endAt: future },
				{ id: 'b2', workspaceId: 2, startAt: past, endAt: future },
				{ id: 'b3', workspaceId: 2, startAt: past, endAt: future },
			]);

			const result = await analyticsService.getOverview();

			// 2 distinct occupied workspaces / 4 workspaces = 50%.
			expect(result.activeBookings).toBe(3);
			expect(result.occupancyRate).toBe(50);
		});

		it('should cap occupancy rate at 100 when data is inconsistent', async () => {
			const past = new Date(Date.now() - 60_000);
			const future = new Date(Date.now() + 60_000);
			mockUsersFindMany.mockResolvedValue([]);
			mockWorkspacesFindMany.mockResolvedValue([{ id: 1 }]);
			mockBookingsFindMany.mockResolvedValue([
				{ id: 'b1', workspaceId: 1, startAt: past, endAt: future },
				{ id: 'b2', workspaceId: 2, startAt: past, endAt: future },
			]);

			const result = await analyticsService.getOverview();

			expect(result.occupancyRate).toBe(100);
		});

		it('should return 0 occupancy rate when no workspaces exist', async () => {
			const past = new Date(Date.now() - 60_000);
			const future = new Date(Date.now() + 60_000);
			mockUsersFindMany.mockResolvedValue([{ id: 'u1' }]);
			mockWorkspacesFindMany.mockResolvedValue([]);
			mockBookingsFindMany.mockResolvedValue([
				{ id: 'b1', workspaceId: 1, startAt: past, endAt: future },
			]);

			const result = await analyticsService.getOverview();

			expect(result.occupancyRate).toBe(0);
		});

		it('should only count bookings whose time range currently contains now', async () => {
			const past = new Date(Date.now() - 60_000);
			const future = new Date(Date.now() + 60_000);
			const later = new Date(Date.now() + 120_000);
			mockUsersFindMany.mockResolvedValue([]);
			mockWorkspacesFindMany.mockResolvedValue([{ id: 1 }]);
			mockBookingsFindMany.mockResolvedValue([
				{ id: 'active', workspaceId: 1, startAt: past, endAt: future },
				{ id: 'scheduled', workspaceId: 1, startAt: future, endAt: later },
				{ id: 'ended', workspaceId: 1, startAt: past, endAt: past },
			]);

			const result = await analyticsService.getOverview();

			expect(result.activeBookings).toBe(1);
			expect(result.totalBookings).toBe(3);
		});
	});

	describe('getWorkspaceStats', () => {
		it('should return empty array when no workspaces exist', async () => {
			mockWorkspacesFindMany.mockResolvedValue([]);
			mockBookingsFindMany.mockResolvedValue([]);

			const result = await analyticsService.getWorkspaceStats();

			expect(result).toEqual([]);
		});

		it('should aggregate bookings per workspace', async () => {
			mockWorkspacesFindMany.mockResolvedValue([
				{ id: 1, name: 'Desk A', type: 'DESK', capacity: 1 },
				{ id: 2, name: 'Room B', type: 'MEETING_ROOM', capacity: 8 },
			]);
			const past = new Date(Date.now() - 60_000);
			const future = new Date(Date.now() + 60_000);
			const later = new Date(Date.now() + 120_000);
			mockBookingsFindMany.mockResolvedValue([
				{ id: 'b1', workspaceId: 1, startAt: past, endAt: future },
				{ id: 'b2', workspaceId: 1, startAt: past, endAt: past },
				{ id: 'b3', workspaceId: 2, startAt: future, endAt: later },
			]);

			const result = await analyticsService.getWorkspaceStats();

			expect(result).toHaveLength(2);
			const deskA = result.find((w) => w.id === 1);
			expect(deskA?.bookingCount).toBe(2);
			expect(deskA?.activeBookings).toBe(1);
			const roomB = result.find((w) => w.id === 2);
			expect(roomB?.bookingCount).toBe(1);
			expect(roomB?.activeBookings).toBe(0);
		});

		it('should report an occupied workspace as fully utilized regardless of capacity', async () => {
			mockWorkspacesFindMany.mockResolvedValue([
				{ id: 1, name: 'Meeting Room', type: 'MEETING_ROOM', capacity: 8 },
			]);
			const past = new Date(Date.now() - 60_000);
			const future = new Date(Date.now() + 60_000);
			mockBookingsFindMany.mockResolvedValue([
				{ id: 'b1', workspaceId: 1, startAt: past, endAt: future },
			]);

			const result = await analyticsService.getWorkspaceStats();

			expect(result[0].activeBookings).toBe(1);
			expect(result[0].utilizationRate).toBe(100);
		});

		it('should report a scheduled workspace as not currently utilized', async () => {
			mockWorkspacesFindMany.mockResolvedValue([
				{ id: 1, name: 'Desk', type: 'DESK', capacity: 1 },
			]);
			const future = new Date(Date.now() + 60_000);
			const later = new Date(Date.now() + 120_000);
			mockBookingsFindMany.mockResolvedValue([
				{ id: 'b1', workspaceId: 1, startAt: future, endAt: later },
			]);

			const result = await analyticsService.getWorkspaceStats();

			expect(result[0].activeBookings).toBe(0);
			expect(result[0].utilizationRate).toBe(0);
		});
	});
});
