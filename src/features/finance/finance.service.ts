import { 
  type CreateTransactionInput, 
  type Transaction, 
  type TransactionAnalysis, 
  CreateTransactionSchema,
  TransactionSchema 
} from "../../schemas";
import { type Result, createSuccess, createError } from "../../shared/types/result";
import { validateSchema } from "../../shared/validation/middleware";
import { DatabaseError, ValidationError } from "../../shared/errors/handlers";
import { RepositoryFactory } from "../../shared/repositories/factory";
import { type TransactionRepository } from "./transaction.repository";

export class TransactionService {
  private repository: TransactionRepository;

  constructor(repository?: TransactionRepository) {
    this.repository = repository || RepositoryFactory.getTransactionRepository();
  }

  async createTransaction(input: CreateTransactionInput): Promise<Result<Transaction, ValidationError | DatabaseError>> {
    // Validate input
    const validationResult = validateSchema(CreateTransactionSchema, input);
    if (!validationResult.success) {
      return createError(validationResult.error);
    }

    const validatedInput = validationResult.data;

    // Create transaction object
    const id = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const createdAt = new Date().toISOString();

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

    // Save via repository
    return await this.repository.create(transactionValidation.data);
  }

  async getTransactionsByUser(userId: string): Promise<Result<Transaction[], DatabaseError>> {
    return await this.repository.findByUserId(userId, { orderBy: 'created_at', orderDirection: 'ASC' });
  }

  async analyzeSpendingByCategory(userId: string, days: number): Promise<Result<TransactionAnalysis[], DatabaseError>> {
    return await this.repository.analyzeSpendingByCategory(userId, days);
  }
}