import { 
  CreateTransactionInput, 
  Transaction, 
  TransactionAnalysis, 
  CreateTransactionSchema,
  TransactionSchema 
} from "../../schemas";
import { Result, createSuccess, createError } from "../../shared/types/result";
import { validateSchema } from "../../shared/validation/middleware";
import { getDatabase } from "../../shared/database/connection";
import { DatabaseError, ValidationError } from "../../shared/errors/handlers";

export class TransactionService {
  private db = getDatabase();

  async createTransaction(input: CreateTransactionInput): Promise<Result<Transaction, ValidationError | DatabaseError>> {
    // Validate input
    const validationResult = validateSchema(CreateTransactionSchema, input);
    if (!validationResult.success) {
      return createError(validationResult.error);
    }

    const validatedInput = validationResult.data;

    try {
      const id = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const createdAt = new Date().toISOString();

      const insertQuery = this.db.prepare(`
        INSERT INTO transactions (id, user_id, amount, category, description, date, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);

      insertQuery.run(
        id,
        validatedInput.userId,
        validatedInput.amount,
        validatedInput.category,
        validatedInput.description || null,
        validatedInput.date,
        createdAt
      );

      const transaction: Transaction = {
        id,
        userId: validatedInput.userId,
        amount: validatedInput.amount,
        category: validatedInput.category,
        description: validatedInput.description,
        date: validatedInput.date,
        createdAt
      };

      // Validate the created transaction
      const transactionValidation = validateSchema(TransactionSchema, transaction);
      if (!transactionValidation.success) {
        return createError(transactionValidation.error);
      }

      return createSuccess(transactionValidation.data);
    } catch (error) {
      return createError(new DatabaseError(
        `Failed to create transaction: ${error instanceof Error ? error.message : String(error)}`,
        "insert"
      ));
    }
  }

  async getTransactionsByUser(userId: string): Promise<Result<Transaction[], DatabaseError>> {
    try {
      const query = this.db.prepare(`
        SELECT id, user_id as userId, amount, category, description, date, created_at as createdAt
        FROM transactions 
        WHERE user_id = ? 
        ORDER BY created_at DESC
      `);

      const rows = query.all(userId) as Transaction[];
      return createSuccess(rows);
    } catch (error) {
      return createError(new DatabaseError(
        `Failed to fetch transactions: ${error instanceof Error ? error.message : String(error)}`,
        "select"
      ));
    }
  }

  async analyzeSpendingByCategory(userId: string, days: number): Promise<Result<TransactionAnalysis[], DatabaseError>> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      const cutoffDateStr = cutoffDate.toISOString().split('T')[0] as string;

      const query = this.db.prepare(`
        SELECT 
          category,
          SUM(amount) as totalAmount,
          COUNT(*) as transactionCount,
          AVG(amount) as averageAmount
        FROM transactions 
        WHERE user_id = ? AND date >= ?
        GROUP BY category
        ORDER BY totalAmount DESC
      `);

      const rows = query.all(userId, cutoffDateStr) as TransactionAnalysis[];
      return createSuccess(rows);
    } catch (error) {
      return createError(new DatabaseError(
        `Failed to analyze spending: ${error instanceof Error ? error.message : String(error)}`,
        "select"
      ));
    }
  }
}