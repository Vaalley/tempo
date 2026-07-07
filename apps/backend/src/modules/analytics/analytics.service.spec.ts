import { describe, it, expect, mock, beforeEach } from 'bun:test';
import { analyticsService } from './analytics.service';

const mockUsersFindMany = mock(() => Promise.resolve([]));
const mockWorkspacesFindMany = mock(() => Promise.resolve([]));
const mockBookingsFindMany = mock(() => Promise.resolve([]));

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
			mockUsersFindMany.mockResolvedValue([{ id: 'u1' }, { id: 'u2' }]);
			mockWorkspacesFindMany.mockResolvedValue([{ id: 1 }, { id: 2 }, { id: 3 }]);
			mockBookingsFindMany.mockResolvedValue([
				{ id: 'b1', endAt: new Date('2099-01-01') },
				{ id: 'b2', endAt: new Date('2099-01-01') },
				{ id: 'b3', endAt: new Date('2000-01-01') },
			]);

			const result = await analyticsService.getOverview();

			expect(result.totalUsers).toBe(2);
			expect(result.totalWorkspaces).toBe(3);
			expect(result.totalBookings).toBe(3);
			expect(result.activeBookings).toBe(2);
		});

		it('should compute occupancy rate as activeBookings / totalWorkspaces', async () => {
			mockUsersFindMany.mockResolvedValue([]);
			mockWorkspacesFindMany.mockResolvedValue([{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }]);
			mockBookingsFindMany.mockResolvedValue([
				{ id: 'b1', endAt: new Date('2099-01-01') },
				{ id: 'b2', endAt: new Date('2099-01-01') },
			]);

			const result = await analyticsService.getOverview();

			// 2 active / 4 workspaces = 50%
			expect(result.occupancyRate).toBe(50);
		});

		it('should return 0 occupancy rate when no workspaces exist', async () => {
			mockUsersFindMany.mockResolvedValue([{ id: 'u1' }]);
			mockWorkspacesFindMany.mockResolvedValue([]);
			mockBookingsFindMany.mockResolvedValue([{ id: 'b1', endAt: new Date('2099-01-01') }]);

			const result = await analyticsService.getOverview();

			expect(result.occupancyRate).toBe(0);
		});

		it('should only count bookings with endAt in the future as active', async () => {
			const past = new Date('2000-01-01');
			const future = new Date('2099-01-01');
			mockUsersFindMany.mockResolvedValue([]);
			mockWorkspacesFindMany.mockResolvedValue([{ id: 1 }]);
			mockBookingsFindMany.mockResolvedValue([
				{ id: 'b1', endAt: future },
				{ id: 'b2', endAt: past },
				{ id: 'b3', endAt: past },
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
			const future = new Date('2099-01-01');
			const past = new Date('2000-01-01');
			mockBookingsFindMany.mockResolvedValue([
				{ id: 'b1', workspaceId: 1, endAt: future },
				{ id: 'b2', workspaceId: 1, endAt: past },
				{ id: 'b3', workspaceId: 2, endAt: future },
			]);

			const result = await analyticsService.getWorkspaceStats();

			expect(result).toHaveLength(2);
			const deskA = result.find((w) => w.id === 1);
			expect(deskA?.bookingCount).toBe(2);
			expect(deskA?.activeBookings).toBe(1);
			const roomB = result.find((w) => w.id === 2);
			expect(roomB?.bookingCount).toBe(1);
			expect(roomB?.activeBookings).toBe(1);
		});

		it('should compute utilization rate capped at 100', async () => {
			mockWorkspacesFindMany.mockResolvedValue([
				{ id: 1, name: 'Small Desk', type: 'DESK', capacity: 1 },
			]);
			const future = new Date('2099-01-01');
			mockBookingsFindMany.mockResolvedValue([
				{ id: 'b1', workspaceId: 1, endAt: future },
				{ id: 'b2', workspaceId: 1, endAt: future },
				{ id: 'b3', workspaceId: 1, endAt: future },
			]);

			const result = await analyticsService.getWorkspaceStats();

			// 3 active / capacity 1 = 300% -> capped at 100
			expect(result[0].activeBookings).toBe(3);
			expect(result[0].utilizationRate).toBe(100);
		});

		it('should return 0 utilization when capacity is 0', async () => {
			mockWorkspacesFindMany.mockResolvedValue([
				{ id: 1, name: 'Broken', type: 'DESK', capacity: 0 },
			]);
			mockBookingsFindMany.mockResolvedValue([]);

			const result = await analyticsService.getWorkspaceStats();

			expect(result[0].utilizationRate).toBe(0);
		});
	});
});
