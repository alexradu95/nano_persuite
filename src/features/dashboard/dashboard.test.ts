import { describe, it, expect, beforeEach } from "@jest/globals";
import { DashboardService } from "./dashboard.service";
import { TransactionService } from "../finance/finance.service";
import { TaskService } from "../tasks/tasks.service";
import type { DashboardOverview, Transaction, Task, TaskSummary } from "../../schemas";
import { createSuccess, createError } from "../../shared/types/result";
import { DatabaseError } from "../../shared/errors/handlers";

describe("Dashboard Feature", () => {
  let dashboardService: DashboardService;
  let mockTransactionService: jest.Mocked<TransactionService>;
  let mockTaskService: jest.Mocked<TaskService>;

  beforeEach(() => {
    // Create mock services
    mockTransactionService = {
      createTransaction: jest.fn(),
      getTransactionsByUser: jest.fn(),
      analyzeSpendingByCategory: jest.fn(),
    } as any;

    mockTaskService = {
      createTask: jest.fn(),
      getTasksByUser: jest.fn(),
      getPendingTasks: jest.fn(),
      getCompletedTasks: jest.fn(),
      toggleTaskCompletion: jest.fn(),
      updateTask: jest.fn(),
      getTaskSummary: jest.fn(),
    } as any;

    // Inject mock services into dashboard service
    dashboardService = new DashboardService(mockTransactionService, mockTaskService);
  });

  describe("Dashboard Overview", () => {
    it("should return dashboard overview with no data", async () => {
      // Mock empty responses
      mockTransactionService.getTransactionsByUser.mockResolvedValue(createSuccess([]));
      mockTaskService.getPendingTasks.mockResolvedValue(createSuccess([]));
      mockTaskService.getTaskSummary.mockResolvedValue(createSuccess({
        total: 0,
        completed: 0,
        pending: 0,
        overdue: 0
      }));

      const result = await dashboardService.getDashboardOverview("user-1");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.recentTransactions).toHaveLength(0);
        expect(result.data.pendingTasks).toHaveLength(0);
        expect(result.data.financialSummary.totalSpent).toBe(0);
        expect(result.data.financialSummary.transactionCount).toBe(0);
        expect(result.data.taskSummary.total).toBe(0);
      }

      expect(mockTransactionService.getTransactionsByUser).toHaveBeenCalledWith("user-1");
      expect(mockTaskService.getPendingTasks).toHaveBeenCalledWith("user-1");
      expect(mockTaskService.getTaskSummary).toHaveBeenCalledWith("user-1");
    });

    it("should return dashboard overview with sample data", async () => {
      const mockTransactions: Transaction[] = [
        {
          id: "txn_1",
          userId: "user-1",
          amount: 25.99,
          category: "groceries",
          description: "Weekly shopping",
          date: "2024-07-09",
          createdAt: "2024-07-09T10:00:00.000Z"
        },
        {
          id: "txn_2",
          userId: "user-1",
          amount: 12.50,
          category: "transport",
          description: "Bus fare",
          date: "2024-07-09",
          createdAt: "2024-07-09T11:00:00.000Z"
        },
        {
          id: "txn_3",
          userId: "user-1",
          amount: 5.00,
          category: "other",
          description: "Coffee",
          date: "2024-07-09",
          createdAt: "2024-07-09T12:00:00.000Z"
        }
      ];

      const mockTasks: Task[] = [
        {
          id: "task_1",
          userId: "user-1",
          title: "Buy groceries",
          completed: false,
          dueDate: "2024-07-15",
          createdAt: "2024-07-09T10:00:00.000Z"
        },
        {
          id: "task_2",
          userId: "user-1",
          title: "Call dentist",
          completed: false,
          dueDate: undefined,
          createdAt: "2024-07-09T11:00:00.000Z"
        }
      ];

      const mockTaskSummary: TaskSummary = {
        total: 4,
        completed: 2,
        pending: 2,
        overdue: 1
      };

      mockTransactionService.getTransactionsByUser.mockResolvedValue(createSuccess(mockTransactions));
      mockTaskService.getPendingTasks.mockResolvedValue(createSuccess(mockTasks));
      mockTaskService.getTaskSummary.mockResolvedValue(createSuccess(mockTaskSummary));

      const result = await dashboardService.getDashboardOverview("user-1");

      expect(result.success).toBe(true);
      if (result.success) {
        // Check recent transactions (should be limited to 5)
        expect(result.data.recentTransactions).toHaveLength(3);
        expect(result.data.recentTransactions[0]?.amount).toBe(25.99);
        expect(result.data.recentTransactions[1]?.amount).toBe(12.50);
        expect(result.data.recentTransactions[2]?.amount).toBe(5.00);

        // Check pending tasks (should be limited to 5)
        expect(result.data.pendingTasks).toHaveLength(2);
        expect(result.data.pendingTasks[0]?.title).toBe("Buy groceries");
        expect(result.data.pendingTasks[1]?.title).toBe("Call dentist");

        // Check financial summary
        expect(result.data.financialSummary.totalSpent).toBeCloseTo(43.49, 2);
        expect(result.data.financialSummary.transactionCount).toBe(3);
        expect(result.data.financialSummary.averageTransactionAmount).toBeCloseTo(14.497, 2);

        // Check task summary
        expect(result.data.taskSummary.total).toBe(4);
        expect(result.data.taskSummary.completed).toBe(2);
        expect(result.data.taskSummary.pending).toBe(2);
        expect(result.data.taskSummary.overdue).toBe(1);
      }

      expect(mockTransactionService.getTransactionsByUser).toHaveBeenCalledWith("user-1");
      expect(mockTaskService.getPendingTasks).toHaveBeenCalledWith("user-1");
      expect(mockTaskService.getTaskSummary).toHaveBeenCalledWith("user-1");
    });

    it("should limit recent transactions to 5 items", async () => {
      const mockTransactions: Transaction[] = Array.from({ length: 7 }, (_, i) => ({
        id: `txn_${i + 1}`,
        userId: "user-1",
        amount: (i + 1) * 10,
        category: "groceries",
        description: `Transaction ${i + 1}`,
        date: "2024-07-09",
        createdAt: `2024-07-09T${10 + i}:00:00.000Z`
      }));

      const mockTasks: Task[] = [{
        id: "task_1",
        userId: "user-1",
        title: "Test task",
        completed: false,
        dueDate: undefined,
        createdAt: "2024-07-09T10:00:00.000Z"
      }];

      const mockTaskSummary: TaskSummary = {
        total: 1,
        completed: 0,
        pending: 1,
        overdue: 0
      };

      mockTransactionService.getTransactionsByUser.mockResolvedValue(createSuccess(mockTransactions));
      mockTaskService.getPendingTasks.mockResolvedValue(createSuccess(mockTasks));
      mockTaskService.getTaskSummary.mockResolvedValue(createSuccess(mockTaskSummary));

      const result = await dashboardService.getDashboardOverview("user-1");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.recentTransactions).toHaveLength(5);
        // Should be first 5 transactions
        expect(result.data.recentTransactions[0]?.amount).toBe(10);
        expect(result.data.recentTransactions[4]?.amount).toBe(50);
      }
    });

    it("should limit pending tasks to 5 items", async () => {
      const mockTransactions: Transaction[] = [{
        id: "txn_1",
        userId: "user-1",
        amount: 25.99,
        category: "groceries",
        description: "Shopping",
        date: "2024-07-09",
        createdAt: "2024-07-09T10:00:00.000Z"
      }];

      const mockTasks: Task[] = Array.from({ length: 7 }, (_, i) => ({
        id: `task_${i + 1}`,
        userId: "user-1",
        title: `Task ${i + 1}`,
        completed: false,
        dueDate: undefined,
        createdAt: `2024-07-09T${10 + i}:00:00.000Z`
      }));

      const mockTaskSummary: TaskSummary = {
        total: 7,
        completed: 0,
        pending: 7,
        overdue: 0
      };

      mockTransactionService.getTransactionsByUser.mockResolvedValue(createSuccess(mockTransactions));
      mockTaskService.getPendingTasks.mockResolvedValue(createSuccess(mockTasks));
      mockTaskService.getTaskSummary.mockResolvedValue(createSuccess(mockTaskSummary));

      const result = await dashboardService.getDashboardOverview("user-1");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.pendingTasks).toHaveLength(5);
        // Should be first 5 tasks
        expect(result.data.pendingTasks[0]?.title).toBe("Task 1");
        expect(result.data.pendingTasks[4]?.title).toBe("Task 5");
      }
    });

    it("should handle database errors gracefully", async () => {
      const transactionError = new DatabaseError("Transaction database error", "select");
      mockTransactionService.getTransactionsByUser.mockResolvedValue(createError(transactionError));

      const result = await dashboardService.getDashboardOverview("user-1");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(DatabaseError);
        expect(result.error.message).toContain("Failed to get dashboard overview");
      }

      expect(mockTransactionService.getTransactionsByUser).toHaveBeenCalledWith("user-1");
    });

    it("should handle task service errors gracefully", async () => {
      const mockTransactions: Transaction[] = [{
        id: "txn_1",
        userId: "user-1",
        amount: 25.99,
        category: "groceries",
        description: "Shopping",
        date: "2024-07-09",
        createdAt: "2024-07-09T10:00:00.000Z"
      }];

      const taskError = new DatabaseError("Task database error", "select");
      mockTransactionService.getTransactionsByUser.mockResolvedValue(createSuccess(mockTransactions));
      mockTaskService.getPendingTasks.mockResolvedValue(createError(taskError));

      const result = await dashboardService.getDashboardOverview("user-1");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(DatabaseError);
        expect(result.error.message).toContain("Failed to get dashboard overview");
      }

      expect(mockTransactionService.getTransactionsByUser).toHaveBeenCalledWith("user-1");
      expect(mockTaskService.getPendingTasks).toHaveBeenCalledWith("user-1");
    });

    it("should handle task summary errors gracefully", async () => {
      const mockTransactions: Transaction[] = [{
        id: "txn_1",
        userId: "user-1",
        amount: 25.99,
        category: "groceries",
        description: "Shopping",
        date: "2024-07-09",
        createdAt: "2024-07-09T10:00:00.000Z"
      }];

      const mockTasks: Task[] = [{
        id: "task_1",
        userId: "user-1",
        title: "Test task",
        completed: false,
        dueDate: undefined,
        createdAt: "2024-07-09T10:00:00.000Z"
      }];

      const taskSummaryError = new DatabaseError("Task summary database error", "select");
      mockTransactionService.getTransactionsByUser.mockResolvedValue(createSuccess(mockTransactions));
      mockTaskService.getPendingTasks.mockResolvedValue(createSuccess(mockTasks));
      mockTaskService.getTaskSummary.mockResolvedValue(createError(taskSummaryError));

      const result = await dashboardService.getDashboardOverview("user-1");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(DatabaseError);
        expect(result.error.message).toContain("Failed to get dashboard overview");
      }

      expect(mockTransactionService.getTransactionsByUser).toHaveBeenCalledWith("user-1");
      expect(mockTaskService.getPendingTasks).toHaveBeenCalledWith("user-1");
      expect(mockTaskService.getTaskSummary).toHaveBeenCalledWith("user-1");
    });
  });
});