import { describe, it, expect, beforeEach } from "@jest/globals";
import { TaskService } from "./tasks.service";
import type { CreateTaskInput, Task, TaskSummary, UpdateTaskInput } from "../../schemas";
import type { TaskRepository } from "./task.repository";
import { createSuccess, createError } from "../../shared/types/result";
import { DatabaseError, ValidationError, NotFoundError } from "../../shared/errors/handlers";

describe("Task Management Feature", () => {
  let service: TaskService;
  let mockRepository: jest.Mocked<TaskRepository>;

  beforeEach(() => {
    // Create mock repository
    mockRepository = {
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findByUserId: jest.fn(),
      findPendingByUserId: jest.fn(),
      findCompletedByUserId: jest.fn(),
      findOverdueTasks: jest.fn(),
      updateCompletionStatus: jest.fn(),
      getTaskSummary: jest.fn(),
    };

    // Inject mock repository into service
    service = new TaskService(mockRepository);
  });

  describe("Task Creation", () => {
    it("should create a new task with valid data", async () => {
      const input: CreateTaskInput = {
        userId: "user-1",
        title: "Buy groceries",
        dueDate: "2024-07-15"
      };

      const expectedTask: Task = {
        id: "task_123",
        userId: "user-1",
        title: "Buy groceries",
        completed: false,
        dueDate: "2024-07-15",
        createdAt: "2024-07-09T10:00:00.000Z"
      };

      mockRepository.create.mockResolvedValue(createSuccess(expectedTask));

      const result = await service.createTask(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toMatchObject({
          userId: "user-1",
          title: "Buy groceries",
          completed: false,
          dueDate: "2024-07-15"
        });
        expect(result.data.id).toBeDefined();
        expect(result.data.createdAt).toBeDefined();
      }

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "user-1",
          title: "Buy groceries",
          completed: false,
          dueDate: "2024-07-15"
        })
      );
    });

    it("should create task without due date", async () => {
      const input: CreateTaskInput = {
        userId: "user-1",
        title: "Review code"
      };

      const expectedTask: Task = {
        id: "task_124",
        userId: "user-1",
        title: "Review code",
        completed: false,
        dueDate: undefined,
        createdAt: "2024-07-09T10:00:00.000Z"
      };

      mockRepository.create.mockResolvedValue(createSuccess(expectedTask));

      const result = await service.createTask(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe("Review code");
        expect(result.data.dueDate).toBeUndefined();
        expect(result.data.completed).toBe(false);
      }

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "user-1",
          title: "Review code",
          completed: false,
          dueDate: undefined
        })
      );
    });

    it("should reject task with empty title", async () => {
      const input: CreateTaskInput = {
        userId: "user-1",
        title: "",
        dueDate: "2024-07-15"
      };

      const result = await service.createTask(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ValidationError);
      }

      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it("should reject task with invalid due date", async () => {
      const input: CreateTaskInput = {
        userId: "user-1",
        title: "Valid task",
        dueDate: "invalid-date"
      };

      const result = await service.createTask(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(ValidationError);
      }

      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it("should handle repository errors during creation", async () => {
      const input: CreateTaskInput = {
        userId: "user-1",
        title: "Buy groceries",
        dueDate: "2024-07-15"
      };

      const repositoryError = new DatabaseError("Database connection failed", "insert");
      mockRepository.create.mockResolvedValue(createError(repositoryError));

      const result = await service.createTask(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(DatabaseError);
        expect(result.error.message).toBe("Database connection failed");
      }
    });
  });

  describe("Task Retrieval", () => {
    it("should retrieve tasks for a user", async () => {
      const expectedTasks: Task[] = [
        {
          id: "task_1",
          userId: "user-1",
          title: "First task",
          completed: false,
          dueDate: "2024-07-15",
          createdAt: "2024-07-09T10:00:00.000Z"
        },
        {
          id: "task_2",
          userId: "user-1",
          title: "Second task",
          completed: true,
          dueDate: undefined,
          createdAt: "2024-07-09T11:00:00.000Z"
        }
      ];

      mockRepository.findByUserId.mockResolvedValue(createSuccess(expectedTasks));

      const result = await service.getTasksByUser("user-1");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
        expect(result.data[0]?.title).toBe("First task");
        expect(result.data[1]?.title).toBe("Second task");
      }

      expect(mockRepository.findByUserId).toHaveBeenCalledWith("user-1", {
        orderBy: 'created_at',
        orderDirection: 'ASC'
      });
    });

    it("should return empty array for user with no tasks", async () => {
      mockRepository.findByUserId.mockResolvedValue(createSuccess([]));

      const result = await service.getTasksByUser("user-2");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(0);
      }

      expect(mockRepository.findByUserId).toHaveBeenCalledWith("user-2", {
        orderBy: 'created_at',
        orderDirection: 'ASC'
      });
    });

    it("should retrieve only pending tasks", async () => {
      const expectedTasks: Task[] = [
        {
          id: "task_1",
          userId: "user-1",
          title: "Another pending task",
          completed: false,
          dueDate: undefined,
          createdAt: "2024-07-09T10:00:00.000Z"
        }
      ];

      mockRepository.findPendingByUserId.mockResolvedValue(createSuccess(expectedTasks));

      const result = await service.getPendingTasks("user-1");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
        expect(result.data[0]?.title).toBe("Another pending task");
        expect(result.data[0]?.completed).toBe(false);
      }

      expect(mockRepository.findPendingByUserId).toHaveBeenCalledWith("user-1", {
        orderBy: 'created_at',
        orderDirection: 'ASC'
      });
    });

    it("should retrieve only completed tasks", async () => {
      const expectedTasks: Task[] = [
        {
          id: "task_1",
          userId: "user-1",
          title: "Completed task",
          completed: true,
          dueDate: undefined,
          createdAt: "2024-07-09T10:00:00.000Z"
        }
      ];

      mockRepository.findCompletedByUserId.mockResolvedValue(createSuccess(expectedTasks));

      const result = await service.getCompletedTasks("user-1");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
        expect(result.data[0]?.title).toBe("Completed task");
        expect(result.data[0]?.completed).toBe(true);
      }

      expect(mockRepository.findCompletedByUserId).toHaveBeenCalledWith("user-1", {
        orderBy: 'created_at',
        orderDirection: 'ASC'
      });
    });

    it("should handle repository errors during retrieval", async () => {
      const repositoryError = new DatabaseError("Database connection failed", "select");
      mockRepository.findByUserId.mockResolvedValue(createError(repositoryError));

      const result = await service.getTasksByUser("user-1");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(DatabaseError);
        expect(result.error.message).toBe("Database connection failed");
      }
    });
  });

  describe("Task Updates", () => {
    it("should toggle task completion status", async () => {
      const existingTask: Task = {
        id: "task_1",
        userId: "user-1",
        title: "Test task",
        completed: false,
        dueDate: undefined,
        createdAt: "2024-07-09T10:00:00.000Z"
      };

      const updatedTask: Task = {
        ...existingTask,
        completed: true
      };

      mockRepository.findById.mockResolvedValue(createSuccess(existingTask));
      mockRepository.updateCompletionStatus.mockResolvedValue(createSuccess(updatedTask));

      const result = await service.toggleTaskCompletion("task_1", { completed: true });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.completed).toBe(true);
        expect(result.data.title).toBe("Test task");
      }

      expect(mockRepository.findById).toHaveBeenCalledWith("task_1");
      expect(mockRepository.updateCompletionStatus).toHaveBeenCalledWith("task_1", true);
    });

    it("should update task details", async () => {
      const existingTask: Task = {
        id: "task_1",
        userId: "user-1",
        title: "Old title",
        completed: false,
        dueDate: undefined,
        createdAt: "2024-07-09T10:00:00.000Z"
      };

      const updatedTask: Task = {
        ...existingTask,
        title: "New title",
        dueDate: "2024-07-15"
      };

      const updateInput: UpdateTaskInput = {
        title: "New title",
        dueDate: "2024-07-15"
      };

      mockRepository.findById.mockResolvedValue(createSuccess(existingTask));
      mockRepository.update.mockResolvedValue(createSuccess(updatedTask));

      const result = await service.updateTask("task_1", updateInput);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe("New title");
        expect(result.data.dueDate).toBe("2024-07-15");
      }

      expect(mockRepository.findById).toHaveBeenCalledWith("task_1");
      expect(mockRepository.update).toHaveBeenCalledWith("task_1", updateInput);
    });

    it("should fail to update non-existent task", async () => {
      mockRepository.findById.mockResolvedValue(createSuccess(null));

      const updateInput: UpdateTaskInput = {
        title: "New title"
      };

      const result = await service.updateTask("non-existent", updateInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(NotFoundError);
      }

      expect(mockRepository.findById).toHaveBeenCalledWith("non-existent");
      expect(mockRepository.update).not.toHaveBeenCalled();
    });

    it("should handle repository errors during updates", async () => {
      const repositoryError = new DatabaseError("Database connection failed", "update");
      mockRepository.findById.mockResolvedValue(createError(repositoryError));

      const result = await service.toggleTaskCompletion("task_1", { completed: true });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(DatabaseError);
        expect(result.error.message).toBe("Database connection failed");
      }
    });
  });

  describe("Task Summary", () => {
    it("should generate task summary for user", async () => {
      const expectedSummary: TaskSummary = {
        total: 4,
        completed: 2,
        pending: 2,
        overdue: 1
      };

      mockRepository.getTaskSummary.mockResolvedValue(createSuccess(expectedSummary));

      const result = await service.getTaskSummary("user-1");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.total).toBe(4);
        expect(result.data.completed).toBe(2);
        expect(result.data.pending).toBe(2);
        expect(result.data.overdue).toBe(1);
      }

      expect(mockRepository.getTaskSummary).toHaveBeenCalledWith("user-1");
    });

    it("should return zero summary for user with no tasks", async () => {
      const expectedSummary: TaskSummary = {
        total: 0,
        completed: 0,
        pending: 0,
        overdue: 0
      };

      mockRepository.getTaskSummary.mockResolvedValue(createSuccess(expectedSummary));

      const result = await service.getTaskSummary("user-2");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.total).toBe(0);
        expect(result.data.completed).toBe(0);
        expect(result.data.pending).toBe(0);
        expect(result.data.overdue).toBe(0);
      }

      expect(mockRepository.getTaskSummary).toHaveBeenCalledWith("user-2");
    });

    it("should handle repository errors during summary generation", async () => {
      const repositoryError = new DatabaseError("Database connection failed", "select");
      mockRepository.getTaskSummary.mockResolvedValue(createError(repositoryError));

      const result = await service.getTaskSummary("user-1");

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBeInstanceOf(DatabaseError);
        expect(result.error.message).toBe("Database connection failed");
      }
    });
  });
});