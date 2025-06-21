import { openDatabase } from './db.js';

export async function initViolationsTable() {
    const db = await openDatabase();
    await db.execAsync(`
    CREATE TABLE IF NOT EXISTS violations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      description TEXT NOT NULL,
      category TEXT,
      imageUri TEXT,
      date TEXT,
      userId TEXT,
      latitude REAL,
      longitude REAL,
      synced INTEGER DEFAULT 0
    );
  `);
    console.log('--> violations table initialized');
}
