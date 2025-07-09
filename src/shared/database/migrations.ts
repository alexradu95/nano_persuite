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

    // Create transactions table
    db.exec(`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        amount REAL NOT NULL,
        category TEXT NOT NULL,
        description TEXT,
        date TEXT NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `);

    // Create tasks table
    db.exec(`
      CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        title TEXT NOT NULL,
        completed BOOLEAN DEFAULT FALSE,
        due_date TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
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