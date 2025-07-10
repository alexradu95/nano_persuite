import { getDatabase } from "../../shared/database/connection";
import { DatabaseError } from "../../shared/errors/handlers";
import { Contract, IncomeEntry } from "../../schemas/income";

export interface IncomeRepository {
  createContract(contract: Contract): Promise<void>;
  getContracts(userId: string): Promise<Contract[]>;
  getContractById(contractId: string, userId: string): Promise<Contract | null>;
  getDefaultContract(userId: string): Promise<Contract | null>;
  setDefaultContract(contractId: string, userId: string): Promise<void>;
  createIncomeEntry(entry: IncomeEntry): Promise<void>;
  getIncomeEntriesByMonth(userId: string, year: number, month: number): Promise<Array<IncomeEntry & { contractTitle: string; contractHourlyRate: number }>>;
  deleteIncomeEntry(entryId: string, userId: string): Promise<boolean>;
}

export class DatabaseIncomeRepository implements IncomeRepository {
  private db = getDatabase();

  async createContract(contract: Contract): Promise<void> {
    // If this contract is being set as default, unset all other defaults first
    if (contract.isDefault) {
      const unsetStmt = this.db.prepare(`
        UPDATE contracts SET is_default = FALSE WHERE user_id = ? AND is_default = TRUE
      `);
      unsetStmt.run(contract.userId);
    }

    const stmt = this.db.prepare(`
      INSERT INTO contracts (id, user_id, title, hourly_rate, description, is_active, is_default, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      contract.id,
      contract.userId,
      contract.title,
      contract.hourlyRate,
      contract.description || null,
      contract.isActive,
      contract.isDefault,
      contract.createdAt,
      contract.updatedAt
    );
  }

  async getContracts(userId: string): Promise<Contract[]> {
    const stmt = this.db.prepare(`
      SELECT id, user_id, title, hourly_rate, description, is_active, is_default, created_at, updated_at
      FROM contracts
      WHERE user_id = ? AND is_active = true
      ORDER BY is_default DESC, created_at DESC
    `);

    const rows = stmt.all(userId) as any[];
    return rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      title: row.title,
      hourlyRate: row.hourly_rate,
      description: row.description,
      isActive: Boolean(row.is_active),
      isDefault: Boolean(row.is_default),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  async getContractById(contractId: string, userId: string): Promise<Contract | null> {
    const stmt = this.db.prepare(`
      SELECT id, user_id, title, hourly_rate, description, is_active, is_default, created_at, updated_at
      FROM contracts
      WHERE id = ? AND user_id = ?
    `);

    const row = stmt.get(contractId, userId) as any;
    if (!row) return null;

    return {
      id: row.id,
      userId: row.user_id,
      title: row.title,
      hourlyRate: row.hourly_rate,
      description: row.description,
      isActive: Boolean(row.is_active),
      isDefault: Boolean(row.is_default),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async getDefaultContract(userId: string): Promise<Contract | null> {
    const stmt = this.db.prepare(`
      SELECT id, user_id, title, hourly_rate, description, is_active, is_default, created_at, updated_at
      FROM contracts
      WHERE user_id = ? AND is_default = true AND is_active = true
      LIMIT 1
    `);

    const row = stmt.get(userId) as any;
    if (!row) return null;

    return {
      id: row.id,
      userId: row.user_id,
      title: row.title,
      hourlyRate: row.hourly_rate,
      description: row.description,
      isActive: Boolean(row.is_active),
      isDefault: Boolean(row.is_default),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async setDefaultContract(contractId: string, userId: string): Promise<void> {
    // First, unset all defaults for this user
    const unsetStmt = this.db.prepare(`
      UPDATE contracts SET is_default = FALSE WHERE user_id = ?
    `);
    unsetStmt.run(userId);

    // Then set the specified contract as default
    const setStmt = this.db.prepare(`
      UPDATE contracts SET is_default = TRUE WHERE id = ? AND user_id = ?
    `);
    setStmt.run(contractId, userId);
  }

  async createIncomeEntry(entry: IncomeEntry): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT INTO income_entries (id, user_id, contract_id, date, hours_worked, total_amount, description, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      entry.id,
      entry.userId,
      entry.contractId,
      entry.date,
      entry.hoursWorked,
      entry.totalAmount,
      entry.description || null,
      entry.createdAt,
      entry.updatedAt
    );
  }

  async getIncomeEntriesByMonth(
    userId: string,
    year: number,
    month: number
  ): Promise<Array<IncomeEntry & { contractTitle: string; contractHourlyRate: number }>> {
    const stmt = this.db.prepare(`
      SELECT 
        ie.id,
        ie.user_id,
        ie.contract_id,
        ie.date,
        ie.hours_worked,
        ie.total_amount,
        ie.description,
        ie.created_at,
        ie.updated_at,
        c.title as contract_title,
        c.hourly_rate as contract_hourly_rate
      FROM income_entries ie
      JOIN contracts c ON ie.contract_id = c.id
      WHERE ie.user_id = ? 
        AND strftime('%Y', ie.date) = ? 
        AND strftime('%m', ie.date) = ?
      ORDER BY ie.date ASC
    `);

    const rows = stmt.all(userId, year.toString(), month.toString().padStart(2, '0')) as any[];
    
    return rows.map((row) => ({
      id: row.id,
      userId: row.user_id,
      contractId: row.contract_id,
      date: row.date,
      hoursWorked: row.hours_worked,
      totalAmount: row.total_amount,
      description: row.description,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      contractTitle: row.contract_title,
      contractHourlyRate: row.contract_hourly_rate,
    }));
  }

  async deleteIncomeEntry(entryId: string, userId: string): Promise<boolean> {
    const stmt = this.db.prepare(`
      DELETE FROM income_entries WHERE id = ? AND user_id = ?
    `);
    
    const result = stmt.run(entryId, userId);
    return result.changes > 0;
  }
}