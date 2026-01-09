import { describe, it, expect, mock, beforeEach } from 'bun:test';
import { bookingService } from './bookings.service';

// Mock de la base de données
const mockFindFirst = mock(() => Promise.resolve(undefined));
const mockFindMany = mock(() => Promise.resolve([]));
const mockReturning = mock(() => Promise.resolve([]));
const mockValues = mock(() => ({ returning: mockReturning }));
const mockInsert = mock(() => ({ values: mockValues }));
const mockWhere = mock(() => ({ returning: mockReturning }));
const mockDelete = mock(() => ({ where: mockWhere }));

mock.module('../../db', () => ({
	db: {
		query: {
			workspaces: {
				findFirst: mockFindFirst,
			},
			bookings: {
				findFirst: mockFindFirst,
				findMany: mockFindMany,
			},
		},
		insert: mockInsert,
		delete: mockDelete,
	},
}));

describe('BookingService', () => {
	beforeEach(() => {
		mockFindFirst.mockReset();
		mockFindMany.mockReset();
		mockReturning.mockReset();
		mockValues.mockReset();
		mockInsert.mockReset();
		mockWhere.mockReset();
		mockDelete.mockReset();

		mockValues.mockReturnValue({ returning: mockReturning });
		mockInsert.mockReturnValue({ values: mockValues });
		mockWhere.mockReturnValue({ returning: mockReturning });
		mockDelete.mockReturnValue({ where: mockWhere });
	});

	describe('checkOverlap', () => {
		it('should return false when no overlapping bookings exist', async () => {
			mockFindFirst.mockResolvedValue(undefined);

			const hasOverlap = await bookingService.checkOverlap(
				1,
				new Date('2024-01-01T10:00:00Z'),
				new Date('2024-01-01T11:00:00Z'),
			);

			expect(hasOverlap).toBe(false);
		});

		it('should return true when overlapping booking exists', async () => {
			mockFindFirst.mockResolvedValue({
				id: 'booking-1',
				workspaceId: 1,
				startAt: new Date('2024-01-01T10:30:00Z'),
				endAt: new Date('2024-01-01T11:30:00Z'),
			});

			const hasOverlap = await bookingService.checkOverlap(
				1,
				new Date('2024-01-01T10:00:00Z'),
				new Date('2024-01-01T11:00:00Z'),
			);

			expect(hasOverlap).toBe(true);
		});

		it('should detect overlap when new booking starts before and ends during existing', async () => {
			mockFindFirst.mockResolvedValue({
				id: 'booking-1',
				workspaceId: 1,
				startAt: new Date('2024-01-01T10:00:00Z'),
				endAt: new Date('2024-01-01T12:00:00Z'),
			});

			const hasOverlap = await bookingService.checkOverlap(
				1,
				new Date('2024-01-01T09:00:00Z'),
				new Date('2024-01-01T11:00:00Z'),
			);

			expect(hasOverlap).toBe(true);
		});

		it('should detect overlap when new booking starts during and ends after existing', async () => {
			mockFindFirst.mockResolvedValue({
				id: 'booking-1',
				workspaceId: 1,
				startAt: new Date('2024-01-01T10:00:00Z'),
				endAt: new Date('2024-01-01T12:00:00Z'),
			});

			const hasOverlap = await bookingService.checkOverlap(
				1,
				new Date('2024-01-01T11:00:00Z'),
				new Date('2024-01-01T13:00:00Z'),
			);

			expect(hasOverlap).toBe(true);
		});

		it('should detect overlap when new booking is completely inside existing', async () => {
			mockFindFirst.mockResolvedValue({
				id: 'booking-1',
				workspaceId: 1,
				startAt: new Date('2024-01-01T10:00:00Z'),
				endAt: new Date('2024-01-01T14:00:00Z'),
			});

			const hasOverlap = await bookingService.checkOverlap(
				1,
				new Date('2024-01-01T11:00:00Z'),
				new Date('2024-01-01T12:00:00Z'),
			);

			expect(hasOverlap).toBe(true);
		});

		it('should not detect overlap when bookings are back-to-back', async () => {
			mockFindFirst.mockResolvedValue(undefined);

			const hasOverlap = await bookingService.checkOverlap(
				1,
				new Date('2024-01-01T12:00:00Z'),
				new Date('2024-01-01T13:00:00Z'),
			);

			expect(hasOverlap).toBe(false);
		});
	});

	describe('create', () => {
		it('should throw WORKSPACE_NOT_FOUND if workspace does not exist', async () => {
			mockFindFirst.mockResolvedValue(undefined);

			await expect(
				bookingService.create('user-1', {
					workspaceId: 999,
					startAt: '2024-01-01T10:00:00Z',
					endAt: '2024-01-01T11:00:00Z',
				}),
			).rejects.toThrow('WORKSPACE_NOT_FOUND');
		});

		it('should throw BOOKING_OVERLAP if time slot is already booked', async () => {
			mockFindFirst
				.mockResolvedValueOnce({ id: 1, name: 'Workspace 1' })
				.mockResolvedValueOnce({
					id: 'existing-booking',
					workspaceId: 1,
					startAt: new Date('2024-01-01T10:00:00Z'),
					endAt: new Date('2024-01-01T12:00:00Z'),
				});

			await expect(
				bookingService.create('user-1', {
					workspaceId: 1,
					startAt: '2024-01-01T10:30:00Z',
					endAt: '2024-01-01T11:30:00Z',
				}),
			).rejects.toThrow('BOOKING_OVERLAP');
		});

		it('should create booking when workspace exists and no overlap', async () => {
			const mockBooking = {
				id: 'new-booking',
				userId: 'user-1',
				workspaceId: 1,
				startAt: new Date('2024-01-01T10:00:00Z'),
				endAt: new Date('2024-01-01T11:00:00Z'),
				createdAt: new Date(),
			};

			mockFindFirst
				.mockResolvedValueOnce({ id: 1, name: 'Workspace 1' })
				.mockResolvedValueOnce(undefined);
			mockReturning.mockResolvedValue([mockBooking]);

			const result = await bookingService.create('user-1', {
				workspaceId: 1,
				startAt: '2024-01-01T10:00:00Z',
				endAt: '2024-01-01T11:00:00Z',
			});

			expect(result).toEqual(mockBooking);
			expect(mockInsert).toHaveBeenCalled();
		});
	});

	describe('getByUser', () => {
		it('should return user bookings', async () => {
			const mockBookings = [
				{
					id: 'booking-1',
					userId: 'user-1',
					workspaceId: 1,
					startAt: new Date('2024-01-01T10:00:00Z'),
					endAt: new Date('2024-01-01T11:00:00Z'),
				},
			];

			mockFindMany.mockResolvedValue(mockBookings);

			const result = await bookingService.getByUser('user-1');

			expect(result).toEqual(mockBookings);
		});
	});

	describe('delete', () => {
		it('should throw BOOKING_NOT_FOUND if booking does not exist', async () => {
			mockFindFirst.mockResolvedValue(undefined);

			await expect(bookingService.delete('booking-1', 'user-1')).rejects.toThrow(
				'BOOKING_NOT_FOUND',
			);
		});

		it('should throw UNAUTHORIZED if user is not the owner', async () => {
			mockFindFirst.mockResolvedValue({
				id: 'booking-1',
				userId: 'other-user',
				workspaceId: 1,
			});

			await expect(bookingService.delete('booking-1', 'user-1')).rejects.toThrow(
				'UNAUTHORIZED',
			);
		});

		it('should delete booking if user is the owner', async () => {
			const mockBooking = {
				id: 'booking-1',
				userId: 'user-1',
				workspaceId: 1,
				startAt: new Date('2024-01-01T10:00:00Z'),
				endAt: new Date('2024-01-01T11:00:00Z'),
			};

			mockFindFirst.mockResolvedValue(mockBooking);
			mockReturning.mockResolvedValue([mockBooking]);

			const result = await bookingService.delete('booking-1', 'user-1');

			expect(result).toEqual(mockBooking);
			expect(mockDelete).toHaveBeenCalled();
		});
	});
});
