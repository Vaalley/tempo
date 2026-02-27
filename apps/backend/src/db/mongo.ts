import { MongoClient, Db } from 'mongodb';

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017';
const MONGO_DB_NAME = process.env.MONGO_DB_NAME || 'tempo_audit';

let clientPromise: Promise<MongoClient> | null = null;
let db: Db | null = null;

export async function connectMongo(): Promise<Db> {
	if (db) return db;

	if (!clientPromise) {
		clientPromise = MongoClient.connect(MONGO_URL).catch((error) => {
			clientPromise = null;
			console.error('❌ MongoDB connection error:', error);
			throw error;
		});
	}

	const client = await clientPromise;
	db = client.db(MONGO_DB_NAME);
	console.log('✅ Connected to MongoDB');
	return db;
}

export async function closeMongo(): Promise<void> {
	if (clientPromise) {
		const client = await clientPromise;
		await client.close();
		clientPromise = null;
		db = null;
	}
}
