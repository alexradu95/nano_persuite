import { getDatabase } from "../database/connection";
import { SQLiteTransactionRepository, type TransactionRepository } from "../../features/finance/transaction.repository";
import { SQLiteTaskRepository, type TaskRepository } from "../../features/tasks/task.repository";

// Repository factory for dependency injection
export class RepositoryFactory {
  private static transactionRepository: TransactionRepository | null = null;
  private static taskRepository: TaskRepository | null = null;

  static getTransactionRepository(): TransactionRepository {
    if (!RepositoryFactory.transactionRepository) {
      const db = getDatabase();
      RepositoryFactory.transactionRepository = new SQLiteTransactionRepository(db);
    }
    return RepositoryFactory.transactionRepository;
  }

  static getTaskRepository(): TaskRepository {
    if (!RepositoryFactory.taskRepository) {
      const db = getDatabase();
      RepositoryFactory.taskRepository = new SQLiteTaskRepository(db);
    }
    return RepositoryFactory.taskRepository;
  }

  // For testing - allows injecting mock repositories
  static setTransactionRepository(repository: TransactionRepository): void {
    RepositoryFactory.transactionRepository = repository;
  }

  static setTaskRepository(repository: TaskRepository): void {
    RepositoryFactory.taskRepository = repository;
  }

  // Reset repositories (useful for testing)
  static reset(): void {
    RepositoryFactory.transactionRepository = null;
    RepositoryFactory.taskRepository = null;
  }
}