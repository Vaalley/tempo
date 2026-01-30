import { MongoClient, Db } from 'mongodb';

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017';
const MONGO_DB_NAME = process.env.MONGO_DB_NAME || 'tempo_audit';

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectMongo(): Promise<Db> {
	if (db) return db;

	try {
		client = new MongoClient(MONGO_URL);
		await client.connect();
		db = client.db(MONGO_DB_NAME);
		console.log('✅ Connected to MongoDB');
		return db;
	} catch (error) {
		console.error('❌ MongoDB connection error:', error);
		throw error;
	}
}

export async function closeMongo(): Promise<void> {
	if (client) {
		await client.close();
		client = null;
		db = null;
	}
}
