import type { Transaction, TransactionAnalysis } from "../../schemas";
import type { Result } from "../../shared/types/result";
import { DatabaseError } from "../../shared/errors/handlers";
import type { BaseRepository, FilterOptions, DateRangeFilter } from "../../shared/repositories/types";

// Transaction-specific repository interface
export interface TransactionRepository extends BaseRepository<Transaction> {
  findByUserId(userId: string, options?: FilterOptions): Promise<Result<Transaction[], DatabaseError>>;
  analyzeSpendingByCategory(userId: string, days: number): Promise<Result<TransactionAnalysis[], DatabaseError>>;
  findByDateRange(userId: string, filter: DateRangeFilter): Promise<Result<Transaction[], DatabaseError>>;
  getTotalSpentByUser(userId: string, days?: number): Promise<Result<number, DatabaseError>>;
}

// SQLite implementation
export class SQLiteTransactionRepository implements TransactionRepository {
  constructor(private db: any) {}

  async findById(id: string): Promise<Result<Transaction | null, DatabaseError>> {
    try {
      const query = this.db.prepare(`
        SELECT id, user_id as userId, amount, category, description, date, created_at as createdAt
        FROM transactions 
        WHERE id = ?
      `);
      
      const row = query.get(id) as Transaction | null;
      return { success: true, data: row };
    } catch (error) {
      return {
        success: false,
        error: new DatabaseError(
          `Failed to find transaction: ${error instanceof Error ? error.message : String(error)}`,
          "select"
        )
      };
    }
  }

  async create(transaction: Transaction): Promise<Result<Transaction, DatabaseError>> {
    try {
      const insertQuery = this.db.prepare(`
        INSERT INTO transactions (id, user_id, amount, category, description, date, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      insertQuery.run(
        transaction.id,
        transaction.userId,
        transaction.amount,
        transaction.category,
        transaction.description || null,
        transaction.date,
        transaction.createdAt
      );

      return { success: true, data: transaction };
    } catch (error) {
      return {
        success: false,
        error: new DatabaseError(
          `Failed to create transaction: ${error instanceof Error ? error.message : String(error)}`,
          "insert"
        )
      };
    }
  }

  async update(id: string, updates: Partial<Transaction>): Promise<Result<Transaction, DatabaseError>> {
    try {
      // Build dynamic update query
      const updateFields = Object.keys(updates).filter(key => key !== 'id');
      const setClause = updateFields.map(field => {
        const dbField = field === 'userId' ? 'user_id' : 
                       field === 'createdAt' ? 'created_at' : 
                       field === 'dueDate' ? 'due_date' : field;
        return `${dbField} = ?`;
      }).join(', ');

      const updateQuery = this.db.prepare(`
        UPDATE transactions 
        SET ${setClause}
        WHERE id = ?
      `);

      const values = updateFields.map(field => updates[field as keyof Transaction]);
      updateQuery.run(...values, id);

      // Return updated transaction
      const updatedResult = await this.findById(id);
      if (!updatedResult.success) {
        return updatedResult;
      }
      if (!updatedResult.data) {
        return {
          success: false,
          error: new DatabaseError("Transaction not found after update", "update")
        };
      }
      return updatedResult as Result<Transaction, DatabaseError>;
    } catch (error) {
      return {
        success: false,
        error: new DatabaseError(
          `Failed to update transaction: ${error instanceof Error ? error.message : String(error)}`,
          "update"
        )
      };
    }
  }

  async delete(id: string): Promise<Result<boolean, DatabaseError>> {
    try {
      const deleteQuery = this.db.prepare(`DELETE FROM transactions WHERE id = ?`);
      const result = deleteQuery.run(id);
      
      return { success: true, data: result.changes > 0 };
    } catch (error) {
      return {
        success: false,
        error: new DatabaseError(
          `Failed to delete transaction: ${error instanceof Error ? error.message : String(error)}`,
          "delete"
        )
      };
    }
  }

  async findByUserId(userId: string, options: FilterOptions = {}): Promise<Result<Transaction[], DatabaseError>> {
    try {
      const {
        limit,
        offset = 0,
        orderBy = 'created_at',
        orderDirection = 'ASC'
      } = options;

      let query = `
        SELECT id, user_id as userId, amount, category, description, date, created_at as createdAt
        FROM transactions 
        WHERE user_id = ?
        ORDER BY ${orderBy} ${orderDirection}
      `;

      if (limit) {
        query += ` LIMIT ${limit} OFFSET ${offset}`;
      }

      const preparedQuery = this.db.prepare(query);
      const rows = preparedQuery.all(userId) as Transaction[];
      
      return { success: true, data: rows };
    } catch (error) {
      return {
        success: false,
        error: new DatabaseError(
          `Failed to fetch transactions: ${error instanceof Error ? error.message : String(error)}`,
          "select"
        )
      };
    }
  }

  async analyzeSpendingByCategory(userId: string, days: number): Promise<Result<TransactionAnalysis[], DatabaseError>> {
    try {
      const query = this.db.prepare(`
        SELECT 
          category,
          SUM(amount) as totalAmount,
          COUNT(*) as transactionCount,
          AVG(amount) as averageAmount
        FROM transactions 
        WHERE user_id = ? 
          AND date >= date('now', '-${days} days')
        GROUP BY category
        ORDER BY totalAmount DESC
      `);

      const rows = query.all(userId) as TransactionAnalysis[];
      return { success: true, data: rows };
    } catch (error) {
      return {
        success: false,
        error: new DatabaseError(
          `Failed to analyze spending: ${error instanceof Error ? error.message : String(error)}`,
          "select"
        )
      };
    }
  }

  async findByDateRange(userId: string, filter: DateRangeFilter): Promise<Result<Transaction[], DatabaseError>> {
    try {
      let query = `
        SELECT id, user_id as userId, amount, category, description, date, created_at as createdAt
        FROM transactions 
        WHERE user_id = ?
      `;
      
      const params = [userId];
      
      if (filter.startDate) {
        query += ` AND date >= ?`;
        params.push(filter.startDate);
      }
      
      if (filter.endDate) {
        query += ` AND date <= ?`;
        params.push(filter.endDate);
      }
      
      query += ` ORDER BY date DESC`;
      
      const preparedQuery = this.db.prepare(query);
      const rows = preparedQuery.all(...params) as Transaction[];
      
      return { success: true, data: rows };
    } catch (error) {
      return {
        success: false,
        error: new DatabaseError(
          `Failed to fetch transactions by date range: ${error instanceof Error ? error.message : String(error)}`,
          "select"
        )
      };
    }
  }

  async getTotalSpentByUser(userId: string, days: number = 30): Promise<Result<number, DatabaseError>> {
    try {
      const query = this.db.prepare(`
        SELECT COALESCE(SUM(amount), 0) as total
        FROM transactions 
        WHERE user_id = ? 
          AND date >= date('now', '-${days} days')
      `);

      const result = query.get(userId) as { total: number };
      return { success: true, data: result.total };
    } catch (error) {
      return {
        success: false,
        error: new DatabaseError(
          `Failed to calculate total spending: ${error instanceof Error ? error.message : String(error)}`,
          "select"
        )
      };
    }
  }
}