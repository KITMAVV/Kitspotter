import { openDatabase } from './db';

export async function clearViolationsTable() {
    console.log('clearViolationsTable: clearing all violations');
    const db = await openDatabase();
    await db.execAsync(`DELETE FROM violations;`);
    console.log('clearViolationsTable: all violations cleared');
}
