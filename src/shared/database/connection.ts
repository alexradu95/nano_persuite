import { Database } from "bun:sqlite";
import { DatabaseError } from "../errors/handlers";

// Database connection singleton
class DatabaseConnection {
  private static instance: Database | null = null;

  public static getInstance(): Database {
    if (!DatabaseConnection.instance) {
      try {
        DatabaseConnection.instance = new Database("personal.db");
        DatabaseConnection.instance.exec("PRAGMA foreign_keys = ON");
      } catch (error) {
        throw new DatabaseError(
          `Failed to connect to database: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
    return DatabaseConnection.instance;
  }

  public static close(): void {
    if (DatabaseConnection.instance) {
      DatabaseConnection.instance.close();
      DatabaseConnection.instance = null;
    }
  }
}

export const getDatabase = (): Database => {
  return DatabaseConnection.getInstance();
};

export const closeDatabase = (): void => {
  DatabaseConnection.close();
};