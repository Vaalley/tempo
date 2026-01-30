import { describe, it, expect, mock, beforeEach } from 'bun:test';
import { userService } from './users.service';

let capturedInsertValues: any = null;
let mockFindManyResult: any[] = [];

const mockReturning = mock(() => {
	const result = {
		id: 'generated-id',
		email: capturedInsertValues.email,
		password: capturedInsertValues.password,
		role: 'USER' as const,
		createdAt: new Date(),
	};
	return Promise.resolve([result]);
});

const mockValues = mock((data: any) => {
	capturedInsertValues = data;
	return { returning: mockReturning };
});

const mockInsert = mock(() => ({
	values: mockValues,
}));

const mockFindMany = mock(() => Promise.resolve(mockFindManyResult));

mock.module('../../db', () => ({
	db: {
		insert: mockInsert,
		query: {
			users: {
				findMany: mockFindMany,
			},
		},
	},
}));

mock.module('../../db/schema', () => ({
	users: Symbol('users-table'),
}));

describe('UserService', () => {
	beforeEach(() => {
		capturedInsertValues = null;
		mockFindManyResult = [];
		mockInsert.mockClear();
		mockValues.mockClear();
		mockReturning.mockClear();
		mockFindMany.mockClear();
	});

	describe('create', () => {
		it('should create user with hashed password', async () => {
			const email = 'test@example.com';
			const password = 'mySecurePassword123';

			const result = await userService.create(email, password);

			expect(mockInsert).toHaveBeenCalled();
			expect(mockValues).toHaveBeenCalled();
			expect(capturedInsertValues).toBeDefined();
			expect(capturedInsertValues.email).toBe(email);
			expect(capturedInsertValues.password).toBeDefined();
			expect(typeof capturedInsertValues.password).toBe('string');
			expect(capturedInsertValues.password).not.toBe(password);
			expect(result.email).toBe(email);
			expect(result.password).toBeDefined();
			expect(result.role).toBe('USER');
		});

		it('should hash different passwords differently', async () => {
			const email = 'test@example.com';
			const password1 = 'password123';
			const password2 = 'differentPassword456';

			await userService.create(email, password1);
			const hash1 = capturedInsertValues.password;

			await userService.create(email, password2);
			const hash2 = capturedInsertValues.password;

			expect(hash1).not.toBe(hash2);
			expect(hash1).not.toBe(password1);
			expect(hash2).not.toBe(password2);
		});

		it('should verify hashed password can be validated', async () => {
			const email = 'test@example.com';
			const password = 'testPassword123';

			await userService.create(email, password);
			const hashedPassword = capturedInsertValues.password;

			const isValid = await Bun.password.verify(password, hashedPassword);
			expect(isValid).toBe(true);

			const isInvalid = await Bun.password.verify('wrongPassword', hashedPassword);
			expect(isInvalid).toBe(false);
		});

		it('should handle special characters in password', async () => {
			const email = 'test@example.com';
			const password = 'P@ssw0rd!#$%^&*()';

			const result = await userService.create(email, password);

			expect(capturedInsertValues.password).toBeDefined();
			expect(capturedInsertValues.password).not.toBe(password);
			expect(result.email).toBe(email);
			expect(result.password).toBeDefined();
		});

		it('should handle long passwords', async () => {
			const email = 'test@example.com';
			const password = 'a'.repeat(100);

			const result = await userService.create(email, password);

			expect(capturedInsertValues.password).toBeDefined();
			expect(result.email).toBe(email);
			expect(result.password).toBeDefined();
		});
	});

	describe('getAll', () => {
		it('should return all users without passwords', async () => {
			const mockUsers = [
				{
					id: 'user-1',
					email: 'user1@example.com',
					role: 'USER' as const,
					createdAt: new Date('2024-01-01'),
				},
				{
					id: 'user-2',
					email: 'user2@example.com',
					role: 'ADMIN' as const,
					createdAt: new Date('2024-01-02'),
				},
			];

			mockFindManyResult = mockUsers;

			const result = await userService.getAll();

			expect(mockFindMany).toHaveBeenCalledWith({
				columns: {
					password: false,
				},
			});
			expect(result).toEqual(mockUsers);
			result.forEach((user: any) => {
				expect(user).not.toHaveProperty('password');
			});
		});

		it('should return empty array when no users exist', async () => {
			mockFindManyResult = [];

			const result = await userService.getAll();

			expect(result).toEqual([]);
		});

		it('should exclude password field from response', async () => {
			const mockUsers = [
				{
					id: 'user-1',
					email: 'user1@example.com',
					role: 'USER' as const,
					createdAt: new Date(),
				},
			];

			mockFindManyResult = mockUsers;

			await userService.getAll();

			expect(mockFindMany).toHaveBeenCalledWith({
				columns: {
					password: false,
				},
			});
		});
	});
});
