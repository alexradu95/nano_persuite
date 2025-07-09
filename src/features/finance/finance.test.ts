import { describe, it, expect, beforeEach } from "@jest/globals";
import { TransactionService } from "./finance.service";
import type { CreateTransactionInput, Transaction, TransactionAnalysis } from "../../schemas";
import type { TransactionRepository } from "./transaction.repository";
import { createSuccess, createError } from "../../shared/types/result";
import { DatabaseError, ValidationError } from "../../shared/errors/handlers";

describe("Finance Feature", () => {
  let service: TransactionService;
  let mockRepository: jest.Mocked<TransactionRepository>;

  beforeEach(() => {
    // Create mock repository
    mockRepository = {
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findByUserId: jest.fn(),
      analyzeSpendingByCategory: jest.fn(),
      findByDateRange: jest.fn(),
      getTotalSpentByUser: jest.fn(),
    };

    // Inject mock repository into service
    service = new TransactionService(mockRepository);
  });

  describe("Transaction Creation", () => {
    it("should create a new transaction with valid data", async () => {
      const input: CreateTransactionInput = {
        userId: "user-1",
        amount: 25.99,
        category: "groceries",
        description: "Weekly shopping",
        date: "2024-01-15"
      };

      const expectedTransaction: Transaction = {
        id: "txn_123",
        userId: "user-1",
        amount: 25.99,
        category: "groceries",
        description: "Weekly shopping",
        date: "2024-01-15",
        createdAt: "2024-01-15T10:00:00.000Z"
      };

      mockRepository.create.mockResolvedValue(createSuccess(expectedTransaction));

      const result = await service.createTransaction(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toMatchObject({
          userId: "user-1",
          amount: 25.99,
          category: "groceries",
          description: "Weekly shopping",
          date: "2024-01-15"
        });
        expect(result.data.id).toBeDefined();
        expect(result.data.createdAt).toBeDefined();
      }

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "user-1",
          amount: 25.99,
          category: "groceries",
          description: "Weekly shopping",
          date: "2024-01-15"
        })
      );
    });

    it("should reject transaction with negative amount", async () => {
      const input: CreateTransactionInput = {
        userId: "user-1",
        amount: -10.00,
        category: "groceries",
        date: "2024-01-15"
      };

      const result = await service.createTransaction(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ValidationError);
      }

      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it("should reject transaction with invalid category", async () => {
      const input: CreateTransactionInput = {
        userId: "user-1",
        amount: 25.99,
        category: "invalid-category" as any,
        date: "2024-01-15"
      };

      const result = await service.createTransaction(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ValidationError);
      }

      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it("should handle repository errors during creation", async () => {
      const input: CreateTransactionInput = {
        userId: "user-1",
        amount: 25.99,
        category: "groceries",
        date: "2024-01-15"
      };

      const repositoryError = new DatabaseError("Database connection failed", "insert");
      mockRepository.create.mockResolvedValue(createError(repositoryError));

      const result = await service.createTransaction(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(DatabaseError);
        expect(result.error.message).toBe("Database connection failed");
      }
    });
  });

  describe("Transaction Retrieval", () => {
    it("should retrieve transactions for a user", async () => {
      const expectedTransactions: Transaction[] = [
        {
          id: "txn_1",
          userId: "user-1",
          amount: 25.99,
          category: "groceries",
          description: "Weekly shopping",
          date: "2024-01-15",
          createdAt: "2024-01-15T10:00:00.000Z"
        },
        {
          id: "txn_2",
          userId: "user-1",
          amount: 12.50,
          category: "transport",
          description: "Bus fare",
          date: "2024-01-16",
          createdAt: "2024-01-16T10:00:00.000Z"
        }
      ];

      mockRepository.findByUserId.mockResolvedValue(createSuccess(expectedTransactions));

      const result = await service.getTransactionsByUser("user-1");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
        expect(result.data[0]?.amount).toBe(25.99);
        expect(result.data[1]?.amount).toBe(12.50);
      }

      expect(mockRepository.findByUserId).toHaveBeenCalledWith("user-1", {
        orderBy: 'created_at',
        orderDirection: 'ASC'
      });
    });

    it("should return empty array for user with no transactions", async () => {
      mockRepository.findByUserId.mockResolvedValue(createSuccess([]));

      const result = await service.getTransactionsByUser("user-2");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(0);
      }

      expect(mockRepository.findByUserId).toHaveBeenCalledWith("user-2", {
        orderBy: 'created_at',
        orderDirection: 'ASC'
      });
    });

    it("should handle repository errors during retrieval", async () => {
      const repositoryError = new DatabaseError("Database connection failed", "select");
      mockRepository.findByUserId.mockResolvedValue(createError(repositoryError));

      const result = await service.getTransactionsByUser("user-1");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(DatabaseError);
        expect(result.error.message).toBe("Database connection failed");
      }
    });
  });

  describe("Transaction Analysis", () => {
    it("should analyze spending by category for the last 30 days", async () => {
      const expectedAnalysis: TransactionAnalysis[] = [
        {
          category: "groceries",
          totalAmount: 41.49,
          transactionCount: 2,
          averageAmount: 20.745
        },
        {
          category: "transport",
          totalAmount: 12.50,
          transactionCount: 1,
          averageAmount: 12.50
        }
      ];

      mockRepository.analyzeSpendingByCategory.mockResolvedValue(createSuccess(expectedAnalysis));

      const result = await service.analyzeSpendingByCategory("user-1", 30);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
        
        const groceries = result.data.find((a: TransactionAnalysis) => a.category === "groceries");
        expect(groceries?.totalAmount).toBeCloseTo(41.49, 2);
        expect(groceries?.transactionCount).toBe(2);
        expect(groceries?.averageAmount).toBeCloseTo(20.745, 3);

        const transport = result.data.find((a: TransactionAnalysis) => a.category === "transport");
        expect(transport?.totalAmount).toBe(12.50);
        expect(transport?.transactionCount).toBe(1);
        expect(transport?.averageAmount).toBe(12.50);
      }

      expect(mockRepository.analyzeSpendingByCategory).toHaveBeenCalledWith("user-1", 30);
    });

    it("should return empty analysis for user with no transactions", async () => {
      mockRepository.analyzeSpendingByCategory.mockResolvedValue(createSuccess([]));

      const result = await service.analyzeSpendingByCategory("user-2", 30);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(0);
      }

      expect(mockRepository.analyzeSpendingByCategory).toHaveBeenCalledWith("user-2", 30);
    });

    it("should handle repository errors during analysis", async () => {
      const repositoryError = new DatabaseError("Database connection failed", "select");
      mockRepository.analyzeSpendingByCategory.mockResolvedValue(createError(repositoryError));

      const result = await service.analyzeSpendingByCategory("user-1", 30);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(DatabaseError);
        expect(result.error.message).toBe("Database connection failed");
      }
    });
  });
});