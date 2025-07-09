import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { TransactionService } from "./finance.service";
import type { CreateTransactionInput, Transaction, TransactionAnalysis } from "../../schemas";
import { getDatabase, closeDatabase } from "../../shared/database/connection";
import { runMigrations } from "../../shared/database/migrations";

describe("Finance Feature", () => {
  let service: TransactionService;

  beforeEach(() => {
    // Reset database for each test
    runMigrations();
    service = new TransactionService();
  });

  afterEach(() => {
    closeDatabase();
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
        expect(result.error.message).toContain("greater than 0");
      }
    });

    it("should reject transaction with invalid category", async () => {
      const input = {
        userId: "user-1",
        amount: 25.99,
        category: "invalid_category",
        date: "2024-01-15"
      };

      const result = await service.createTransaction(input as CreateTransactionInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain("category");
      }
    });
  });

  describe("Transaction Retrieval", () => {
    it("should retrieve transactions for a user", async () => {
      const transaction1: CreateTransactionInput = {
        userId: "user-1",
        amount: 25.99,
        category: "groceries",
        date: "2024-01-15"
      };

      const transaction2: CreateTransactionInput = {
        userId: "user-1",
        amount: 12.50,
        category: "transport",
        date: "2024-01-16"
      };

      await service.createTransaction(transaction1);
      await service.createTransaction(transaction2);

      const result = await service.getTransactionsByUser("user-1");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
        expect(result.data[0]?.amount).toBe(25.99);
        expect(result.data[1]?.amount).toBe(12.50);
      }
    });

    it("should return empty array for user with no transactions", async () => {
      const result = await service.getTransactionsByUser("user-2");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(0);
      }
    });
  });

  describe("Transaction Analysis", () => {
    it("should analyze spending by category for the last 30 days", async () => {
      const today = new Date();
      const currentDate = today.toISOString().split('T')[0] as string;
      
      const transactions: CreateTransactionInput[] = [
        {
          userId: "user-1",
          amount: 25.99,
          category: "groceries",
          date: currentDate
        },
        {
          userId: "user-1", 
          amount: 15.50,
          category: "groceries",
          date: currentDate
        },
        {
          userId: "user-1",
          amount: 12.50,
          category: "transport",
          date: currentDate
        }
      ];

      for (const transaction of transactions) {
        await service.createTransaction(transaction);
      }

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
    });

    it("should return empty analysis for user with no transactions", async () => {
      const result = await service.analyzeSpendingByCategory("user-2", 30);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(0);
      }
    });
  });
});