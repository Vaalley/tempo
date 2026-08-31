import { afterAll, beforeAll, describe, expect, it, spyOn } from 'bun:test';
import type { Collection, Db } from 'mongodb';
import { closeMongo, connectMongo } from '../db/mongo';
import { auditService } from '../modules/audit/audit.service';
import type { AuditLog } from '../modules/audit/audit.service';

const integrationEnabled = process.env.RUN_MONGO_INTEGRATION === 'true';

describe.skipIf(!integrationEnabled)('MongoDB audit integration', () => {
	const runId = crypto.randomUUID();
	const entityIds: string[] = [];
	let mongoDb: Db;
	let auditLogs: Collection<AuditLog>;

	beforeAll(async () => {
		if (!process.env.MONGO_URL) {
			throw new Error('MONGO_URL is required for MongoDB integration tests');
		}

		if (process.env.MONGO_DB_NAME !== 'tempo_audit_integration') {
			throw new Error('MongoDB integration tests require the dedicated integration database');
		}

		spyOn(console, 'log').mockImplementation(() => {});
		mongoDb = await connectMongo();
		auditLogs = mongoDb.collection<AuditLog>('audit_logs');
	});

	afterAll(async () => {
		try {
			if (auditLogs && entityIds.length > 0) {
				await auditLogs.deleteMany({ entityId: { $in: entityIds } });
			}
		} finally {
			await closeMongo();
		}
	});

	it('persists a deletion log with its author, entity and timestamp', async () => {
		const entityId = `integration-booking-${runId}`;
		const performedBy = {
			userId: `integration-admin-${runId}`,
			email: 'integration-admin@tempo.test',
			role: 'ADMIN',
		};
		const startedAt = new Date();
		entityIds.push(entityId);

		await auditService.logDeletion(
			'booking',
			entityId,
			{ workspaceId: 42, reason: 'integration-test' },
			performedBy,
		);

		const logs = await auditService.getByEntity('booking', entityId);

		expect(logs).toHaveLength(1);
		expect(logs[0]).toMatchObject({
			action: 'DELETE_BOOKING',
			entityType: 'booking',
			entityId,
			entityData: { workspaceId: 42, reason: 'integration-test' },
			performedBy,
		});
		expect(logs[0].timestamp).toBeInstanceOf(Date);
		expect(logs[0].timestamp.getTime()).toBeGreaterThanOrEqual(startedAt.getTime());
	});

	it('returns logs newest first and filters them by entity', async () => {
		const firstEntityId = `integration-workspace-a-${runId}`;
		const secondEntityId = `integration-workspace-b-${runId}`;
		const performedBy = {
			userId: `integration-admin-${runId}`,
			email: 'integration-admin@tempo.test',
			role: 'ADMIN',
		};
		entityIds.push(firstEntityId, secondEntityId);

		await logWorkspaceDeletion(firstEntityId, 1, performedBy);
		await Bun.sleep(10);
		await logWorkspaceDeletion(secondEntityId, 2, performedBy);
		await Bun.sleep(10);
		await logWorkspaceDeletion(firstEntityId, 3, performedBy);

		const allTestLogs = (await auditService.getAll(100)).filter((log) =>
			entityIds.includes(String(log.entityId)),
		);
		const firstEntityLogs = await auditService.getByEntity('workspace', firstEntityId);
		const secondEntityLogs = await auditService.getByEntity('workspace', secondEntityId);

		expect(allTestLogs.map((log) => log.entityData.version)).toEqual([3, 2, 1]);
		expect(firstEntityLogs.map((log) => log.entityData.version)).toEqual([3, 1]);
		expect(secondEntityLogs.map((log) => log.entityData.version)).toEqual([2]);
	});

	async function logWorkspaceDeletion(
		entityId: string,
		version: number,
		performedBy: AuditLog['performedBy'],
	): Promise<void> {
		await auditService.log({
			action: 'DELETE_WORKSPACE',
			entityType: 'workspace',
			entityId,
			entityData: { version },
			performedBy,
			metadata: { integrationRunId: runId },
		});
	}
});
