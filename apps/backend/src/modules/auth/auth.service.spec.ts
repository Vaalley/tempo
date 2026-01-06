import { describe, it, expect, mock, beforeEach } from 'bun:test';
import { authService } from './auth.service';

// Mock de la base de données
const mockFindFirst = mock(() => Promise.resolve(undefined));
const mockReturning = mock(() => Promise.resolve([]));
const mockValues = mock(() => ({ returning: mockReturning }));
const mockInsert = mock(() => ({ values: mockValues }));

mock.module('../../db', () => ({
	db: {
		query: {
			users: {
				findFirst: mockFindFirst,
			},
		},
		insert: mockInsert,
	},
}));

describe('AuthService', () => {
	beforeEach(() => {
		mockFindFirst.mockReset();
		mockReturning.mockReset();
		mockValues.mockReset();
		mockInsert.mockReset();

		// Reconfigure les retours par défaut
		mockValues.mockReturnValue({ returning: mockReturning });
		mockInsert.mockReturnValue({ values: mockValues });
	});

	describe('register', () => {
		it('should throw USER_EXISTS if email already exists', async () => {
			mockFindFirst.mockResolvedValue({
				id: '123',
				email: 'test@test.com',
				password: 'hashedpwd',
				role: 'USER',
				createdAt: new Date(),
			});

			await expect(authService.register('test@test.com', 'password123')).rejects.toThrow(
				'USER_EXISTS',
			);
		});

		it('should create a new user with hashed password', async () => {
			mockFindFirst.mockResolvedValue(undefined);

			const mockUser = {
				id: 'new-uuid',
				email: 'new@test.com',
				role: 'USER',
			};

			mockReturning.mockResolvedValue([mockUser]);

			const result = await authService.register('new@test.com', 'password123');

			expect(result).toEqual(mockUser);
			expect(mockInsert).toHaveBeenCalled();
		});
	});

	describe('login', () => {
		it('should throw INVALID_CREDENTIALS if user not found', async () => {
			mockFindFirst.mockResolvedValue(undefined);

			await expect(authService.login('notfound@test.com', 'password')).rejects.toThrow(
				'INVALID_CREDENTIALS',
			);
		});

		it('should throw INVALID_CREDENTIALS if password is wrong', async () => {
			const hashedPassword = await Bun.password.hash('correctpassword');

			mockFindFirst.mockResolvedValue({
				id: '123',
				email: 'test@test.com',
				password: hashedPassword,
				role: 'USER',
				createdAt: new Date(),
			});

			await expect(authService.login('test@test.com', 'wrongpassword')).rejects.toThrow(
				'INVALID_CREDENTIALS',
			);
		});

		it('should return token and user on successful login', async () => {
			const password = 'correctpassword';
			const hashedPassword = await Bun.password.hash(password);

			mockFindFirst.mockResolvedValue({
				id: '123',
				email: 'test@test.com',
				password: hashedPassword,
				role: 'USER',
				createdAt: new Date(),
			});

			const result = await authService.login('test@test.com', password);

			expect(result).toHaveProperty('token');
			expect(typeof result.token).toBe('string');
			expect(result.user).toEqual({
				id: '123',
				email: 'test@test.com',
				role: 'USER',
			});
		});
	});

	describe('getSecret', () => {
		it('should return the JWT secret', () => {
			const secret = authService.getSecret();
			expect(typeof secret).toBe('string');
			expect(secret.length).toBeGreaterThan(0);
		});
	});
});
