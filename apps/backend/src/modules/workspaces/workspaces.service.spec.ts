import { describe, it, expect, mock, beforeEach } from 'bun:test';
import { workspaceService } from './workspaces.service';

// Mock de la base de données
const mockFindMany = mock(() => Promise.resolve([]));
const mockFindFirst = mock(() => Promise.resolve(undefined));
const mockReturning = mock(() => Promise.resolve([]));
const mockValues = mock(() => ({ returning: mockReturning }));
const mockInsert = mock(() => ({ values: mockValues }));
const mockWhere = mock(() => ({ returning: mockReturning }));
const mockDelete = mock(() => ({ where: mockWhere }));

mock.module('../../db', () => ({
	db: {
		query: {
			workspaces: {
				findMany: mockFindMany,
				findFirst: mockFindFirst,
			},
		},
		insert: mockInsert,
		delete: mockDelete,
	},
}));

describe('WorkspaceService', () => {
	beforeEach(() => {
		mockFindMany.mockReset();
		mockFindFirst.mockReset();
		mockReturning.mockReset();
		mockValues.mockReset();
		mockInsert.mockReset();
		mockWhere.mockReset();
		mockDelete.mockReset();

		// Reconfigure les retours par défaut
		mockValues.mockReturnValue({ returning: mockReturning });
		mockInsert.mockReturnValue({ values: mockValues });
		mockWhere.mockReturnValue({ returning: mockReturning });
		mockDelete.mockReturnValue({ where: mockWhere });
	});

	describe('create', () => {
		it('should create a workspace and return it', async () => {
			const mockWorkspace = {
				id: 1,
				name: 'Salle A',
				type: 'MEETING_ROOM',
				capacity: 10,
				createdAt: new Date(),
			};

			mockReturning.mockResolvedValue([mockWorkspace]);

			const result = await workspaceService.create({
				name: 'Salle A',
				type: 'MEETING_ROOM',
				capacity: 10,
			});

			expect(result).toEqual(mockWorkspace);
			expect(mockInsert).toHaveBeenCalled();
		});

		it('should create a desk with default capacity', async () => {
			const mockWorkspace = {
				id: 2,
				name: 'Bureau 1',
				type: 'DESK',
				capacity: 1,
				createdAt: new Date(),
			};

			mockReturning.mockResolvedValue([mockWorkspace]);

			const result = await workspaceService.create({
				name: 'Bureau 1',
				type: 'DESK',
				capacity: 1,
			});

			expect(result.type).toBe('DESK');
			expect(result.capacity).toBe(1);
		});
	});

	describe('getAll', () => {
		it('should return all workspaces', async () => {
			const mockWorkspaces = [
				{ id: 1, name: 'Salle A', type: 'MEETING_ROOM', capacity: 10 },
				{ id: 2, name: 'Bureau 1', type: 'DESK', capacity: 1 },
			];

			mockFindMany.mockResolvedValue(mockWorkspaces);

			const result = await workspaceService.getAll();

			expect(result).toEqual(mockWorkspaces);
			expect(result).toHaveLength(2);
		});

		it('should return empty array when no workspaces', async () => {
			mockFindMany.mockResolvedValue([]);

			const result = await workspaceService.getAll();

			expect(result).toEqual([]);
			expect(result).toHaveLength(0);
		});
	});

	describe('getById', () => {
		it('should return workspace by id', async () => {
			const mockWorkspace = {
				id: 1,
				name: 'Salle A',
				type: 'MEETING_ROOM',
				capacity: 10,
			};

			mockFindFirst.mockResolvedValue(mockWorkspace);

			const result = await workspaceService.getById(1);

			expect(result).toEqual(mockWorkspace);
		});

		it('should return undefined if workspace not found', async () => {
			mockFindFirst.mockResolvedValue(undefined);

			const result = await workspaceService.getById(999);

			expect(result).toBeUndefined();
		});
	});

	describe('delete', () => {
		it('should delete workspace and return deleted item', async () => {
			const mockWorkspace = {
				id: 1,
				name: 'Salle A',
				type: 'MEETING_ROOM',
				capacity: 10,
			};

			mockReturning.mockResolvedValue([mockWorkspace]);

			const result = await workspaceService.delete(1);

			expect(result).toEqual(mockWorkspace);
			expect(mockDelete).toHaveBeenCalled();
		});

		it('should return undefined if workspace to delete not found', async () => {
			mockReturning.mockResolvedValue([]);

			const result = await workspaceService.delete(999);

			expect(result).toBeUndefined();
		});
	});
});
