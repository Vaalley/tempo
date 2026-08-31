import { describe, expect, it } from 'bun:test';
import { updateWorkspaceSchema } from './workspaces.dto';

describe('updateWorkspaceSchema', () => {
	it('should accept a partial workspace update', () => {
		const result = updateWorkspaceSchema.safeParse({ name: 'Nouvelle salle' });

		expect(result.success).toBe(true);
	});

	it('should reject an empty update', () => {
		const result = updateWorkspaceSchema.safeParse({});

		expect(result.success).toBe(false);
	});

	it('should reject an invalid capacity', () => {
		const result = updateWorkspaceSchema.safeParse({ capacity: 0 });

		expect(result.success).toBe(false);
	});
});
