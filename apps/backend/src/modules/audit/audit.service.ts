import { getMongoDb } from '../../db/mongo';

export type AuditAction = 'DELETE_WORKSPACE' | 'DELETE_BOOKING' | 'DELETE_USER';

export interface AuditLog {
	action: AuditAction;
	entityType: 'workspace' | 'booking' | 'user';
	entityId: string | number;
	entityData: Record<string, unknown>;
	performedBy: {
		userId: string;
		email: string;
		role: string;
	};
	timestamp: Date;
	metadata?: Record<string, unknown>;
}

export const auditService = {
	async log(auditLog: Omit<AuditLog, 'timestamp'>): Promise<void> {
		try {
			const db = await getMongoDb();
			const collection = db.collection<AuditLog>('audit_logs');

			await collection.insertOne({
				...auditLog,
				timestamp: new Date(),
			});

			console.log(
				`📝 Audit: ${auditLog.action} on ${auditLog.entityType}:${auditLog.entityId}`,
			);
		} catch (error) {
			console.error('Audit log error:', error);
		}
	},

	async logDeletion(
		entityType: AuditLog['entityType'],
		entityId: string | number,
		entityData: Record<string, unknown>,
		performedBy: AuditLog['performedBy'],
	): Promise<void> {
		const actionMap: Record<AuditLog['entityType'], AuditAction> = {
			workspace: 'DELETE_WORKSPACE',
			booking: 'DELETE_BOOKING',
			user: 'DELETE_USER',
		};

		await this.log({
			action: actionMap[entityType],
			entityType,
			entityId,
			entityData,
			performedBy,
		});
	},

	async getAll(limit = 100): Promise<AuditLog[]> {
		const db = await getMongoDb();
		const collection = db.collection<AuditLog>('audit_logs');

		return await collection.find().sort({ timestamp: -1 }).limit(limit).toArray();
	},

	async getByEntity(
		entityType: AuditLog['entityType'],
		entityId: string | number,
	): Promise<AuditLog[]> {
		const db = await getMongoDb();
		const collection = db.collection<AuditLog>('audit_logs');

		return await collection.find({ entityType, entityId }).sort({ timestamp: -1 }).toArray();
	},
};
