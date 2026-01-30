import { describe, it, expect, mock, beforeEach, spyOn } from 'bun:test';
import { auditService } from './audit.service';
import type { AuditLog } from './audit.service';

let capturedInsertData: any = null;
let mockToArrayResult: any[] = [];

mock.module('../../db/mongo', () => ({
	connectMongo: mock(() => {
		return Promise.resolve({
			collection: mock(() => ({
				insertOne: mock((data: any) => {
					capturedInsertData = data;
					return Promise.resolve({ insertedId: 'mock-id' });
				}),
				find: mock(() => ({
					sort: mock(() => ({
						limit: mock(() => ({
							toArray: mock(() => Promise.resolve(mockToArrayResult)),
						})),
						toArray: mock(() => Promise.resolve(mockToArrayResult)),
					})),
				})),
			})),
		});
	}),
}));

describe('AuditService', () => {
	let consoleLogSpy: any;

	beforeEach(() => {
		capturedInsertData = null;
		mockToArrayResult = [];

		consoleLogSpy = spyOn(console, 'log').mockImplementation(() => {});
	});

	describe('log', () => {
		it('should insert audit log with timestamp', async () => {
			const auditLog = {
				action: 'DELETE_WORKSPACE' as const,
				entityType: 'workspace' as const,
				entityId: 1,
				entityData: { name: 'Test Workspace' },
				performedBy: {
					userId: 'user-123',
					email: 'admin@test.com',
					role: 'ADMIN',
				},
			};

			await auditService.log(auditLog);

			expect(capturedInsertData).toMatchObject(auditLog);
			expect(capturedInsertData.timestamp).toBeInstanceOf(Date);
			expect(consoleLogSpy).toHaveBeenCalledWith('📝 Audit: DELETE_WORKSPACE on workspace:1');
		});

		it('should handle metadata in audit log', async () => {
			const auditLog = {
				action: 'DELETE_BOOKING' as const,
				entityType: 'booking' as const,
				entityId: 'booking-123',
				entityData: { workspaceId: 1 },
				performedBy: {
					userId: 'user-456',
					email: 'user@test.com',
					role: 'USER',
				},
				metadata: {
					reason: 'User requested cancellation',
					ipAddress: '192.168.1.1',
				},
			};

			await auditService.log(auditLog);

			expect(capturedInsertData.metadata).toEqual({
				reason: 'User requested cancellation',
				ipAddress: '192.168.1.1',
			});
		});

		it('should not throw errors when logging', async () => {
			const auditLog = {
				action: 'DELETE_USER' as const,
				entityType: 'user' as const,
				entityId: 'user-789',
				entityData: { email: 'deleted@test.com' },
				performedBy: {
					userId: 'admin-1',
					email: 'admin@test.com',
					role: 'ADMIN',
				},
			};

			await expect(auditService.log(auditLog)).resolves.toBeUndefined();
		});
	});

	describe('logDeletion', () => {
		it('should log workspace deletion with correct action', async () => {
			await auditService.logDeletion(
				'workspace',
				5,
				{ name: 'Deleted Workspace', capacity: 10 },
				{
					userId: 'admin-1',
					email: 'admin@test.com',
					role: 'ADMIN',
				},
			);

			expect(capturedInsertData.action).toBe('DELETE_WORKSPACE');
			expect(capturedInsertData.entityType).toBe('workspace');
			expect(capturedInsertData.entityId).toBe(5);
			expect(capturedInsertData.entityData).toEqual({
				name: 'Deleted Workspace',
				capacity: 10,
			});
		});

		it('should log booking deletion with correct action', async () => {
			await auditService.logDeletion(
				'booking',
				'booking-xyz',
				{ workspaceId: 2, userId: 'user-1' },
				{
					userId: 'user-1',
					email: 'user@test.com',
					role: 'USER',
				},
			);

			expect(capturedInsertData.action).toBe('DELETE_BOOKING');
			expect(capturedInsertData.entityType).toBe('booking');
			expect(capturedInsertData.entityId).toBe('booking-xyz');
		});

		it('should log user deletion with correct action', async () => {
			await auditService.logDeletion(
				'user',
				'user-999',
				{ email: 'removed@test.com', role: 'USER' },
				{
					userId: 'admin-2',
					email: 'admin@test.com',
					role: 'ADMIN',
				},
			);

			expect(capturedInsertData.action).toBe('DELETE_USER');
			expect(capturedInsertData.entityType).toBe('user');
			expect(capturedInsertData.entityId).toBe('user-999');
		});
	});

	describe('getAll', () => {
		it('should return all audit logs with default limit', async () => {
			const mockLogs: AuditLog[] = [
				{
					action: 'DELETE_WORKSPACE',
					entityType: 'workspace',
					entityId: 1,
					entityData: { name: 'Workspace 1' },
					performedBy: { userId: 'admin-1', email: 'admin@test.com', role: 'ADMIN' },
					timestamp: new Date('2024-01-01T10:00:00Z'),
				},
				{
					action: 'DELETE_BOOKING',
					entityType: 'booking',
					entityId: 'booking-1',
					entityData: { workspaceId: 2 },
					performedBy: { userId: 'user-1', email: 'user@test.com', role: 'USER' },
					timestamp: new Date('2024-01-01T09:00:00Z'),
				},
			];

			mockToArrayResult = mockLogs;

			const result = await auditService.getAll();

			expect(result).toEqual(mockLogs);
		});

		it('should respect custom limit parameter', async () => {
			mockToArrayResult = [];

			const result = await auditService.getAll(50);

			expect(result).toEqual([]);
		});
	});

	describe('getByEntity', () => {
		it('should return audit logs for specific workspace', async () => {
			const mockLogs: AuditLog[] = [
				{
					action: 'DELETE_WORKSPACE',
					entityType: 'workspace',
					entityId: 3,
					entityData: { name: 'Workspace 3' },
					performedBy: { userId: 'admin-1', email: 'admin@test.com', role: 'ADMIN' },
					timestamp: new Date('2024-01-01T10:00:00Z'),
				},
			];

			mockToArrayResult = mockLogs;

			const result = await auditService.getByEntity('workspace', 3);

			expect(result).toEqual(mockLogs);
		});

		it('should return audit logs for specific booking', async () => {
			const mockLogs: AuditLog[] = [
				{
					action: 'DELETE_BOOKING',
					entityType: 'booking',
					entityId: 'booking-abc',
					entityData: { workspaceId: 1 },
					performedBy: { userId: 'user-1', email: 'user@test.com', role: 'USER' },
					timestamp: new Date('2024-01-01T11:00:00Z'),
				},
			];

			mockToArrayResult = mockLogs;

			const result = await auditService.getByEntity('booking', 'booking-abc');

			expect(result).toEqual(mockLogs);
		});

		it('should return empty array when no logs found', async () => {
			mockToArrayResult = [];

			const result = await auditService.getByEntity('user', 'nonexistent-user');

			expect(result).toEqual([]);
		});
	});
});
