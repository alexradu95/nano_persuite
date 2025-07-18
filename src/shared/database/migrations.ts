import { Database } from "bun:sqlite";
import { getDatabase } from "./connection";
import { DatabaseError } from "../errors/handlers";

// Database schema migrations
export const runMigrations = (): void => {
  const db = getDatabase();
  
  try {
    // Create users table
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create contracts table
    db.exec(`
      CREATE TABLE IF NOT EXISTS contracts (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        hourly_rate REAL NOT NULL,
        description TEXT,
        is_active BOOLEAN DEFAULT TRUE,
        is_default BOOLEAN DEFAULT FALSE,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Create income_entries table
    db.exec(`
      CREATE TABLE IF NOT EXISTS income_entries (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        contract_id TEXT NOT NULL,
        date TEXT NOT NULL,
        hours_worked REAL NOT NULL,
        total_amount REAL NOT NULL,
        description TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (contract_id) REFERENCES contracts(id),
        UNIQUE(user_id, contract_id, date)
      )
    `);

    // Create default user if not exists
    const userQuery = db.prepare("SELECT id FROM users WHERE id = ?");
    const userExists = userQuery.all("user-1");
    if (!userExists || userExists.length === 0) {
      db.exec(`
        INSERT INTO users (id, name, email) 
        VALUES ('user-1', 'Default User', 'user@example.com')
      `);
    }

    console.log("Database migrations completed successfully");
  } catch (error) {
    throw new DatabaseError(
      `Migration failed: ${error instanceof Error ? error.message : String(error)}`,
      "migration"
    );
  }
};