import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { TaskService } from "./tasks.service";
import type { CreateTaskInput, Task, TaskSummary, UpdateTaskInput } from "../../schemas";
import { getDatabase, closeDatabase } from "../../shared/database/connection";
import { runMigrations } from "../../shared/database/migrations";

describe("Task Management Feature", () => {
  let service: TaskService;

  beforeEach(() => {
    // Reset database for each test
    runMigrations();
    service = new TaskService();
  });

  afterEach(() => {
    closeDatabase();
  });

  describe("Task Creation", () => {
    it("should create a new task with valid data", async () => {
      const input: CreateTaskInput = {
        userId: "user-1",
        title: "Complete project documentation",
        dueDate: "2024-12-31"
      };

      const result = await service.createTask(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toMatchObject({
          userId: "user-1",
          title: "Complete project documentation",
          dueDate: "2024-12-31",
          completed: false
        });
        expect(result.data.id).toBeDefined();
        expect(result.data.createdAt).toBeDefined();
      }
    });

    it("should create task without due date", async () => {
      const input: CreateTaskInput = {
        userId: "user-1",
        title: "Review code changes"
      };

      const result = await service.createTask(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.title).toBe("Review code changes");
        expect(result.data.dueDate).toBeUndefined();
        expect(result.data.completed).toBe(false);
      }
    });

    it("should reject task with empty title", async () => {
      const input: CreateTaskInput = {
        userId: "user-1",
        title: ""
      };

      const result = await service.createTask(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain("title");
      }
    });

    it("should reject task with invalid due date", async () => {
      const input = {
        userId: "user-1",
        title: "Valid title",
        dueDate: "invalid-date"
      };

      const result = await service.createTask(input as CreateTaskInput);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain("date");
      }
    });
  });

  describe("Task Retrieval", () => {
    it("should retrieve tasks for a user", async () => {
      const task1: CreateTaskInput = {
        userId: "user-1",
        title: "First task",
        dueDate: "2024-12-31"
      };

      const task2: CreateTaskInput = {
        userId: "user-1",
        title: "Second task"
      };

      await service.createTask(task1);
      await service.createTask(task2);

      const result = await service.getTasksByUser("user-1");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
        expect(result.data[0]?.title).toBe("First task");
        expect(result.data[1]?.title).toBe("Second task");
      }
    });

    it("should return empty array for user with no tasks", async () => {
      const result = await service.getTasksByUser("user-2");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(0);
      }
    });

    it("should retrieve only pending tasks", async () => {
      const task1: CreateTaskInput = {
        userId: "user-1",
        title: "Pending task"
      };

      const task2: CreateTaskInput = {
        userId: "user-1",
        title: "Another pending task"
      };

      const createdTask1 = await service.createTask(task1);
      await service.createTask(task2);

      // Complete one task
      if (createdTask1.success) {
        await service.toggleTaskCompletion(createdTask1.data.id, { completed: true });
      }

      const result = await service.getPendingTasks("user-1");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
        expect(result.data[0]?.title).toBe("Another pending task");
        expect(result.data[0]?.completed).toBe(false);
      }
    });

    it("should retrieve only completed tasks", async () => {
      const task1: CreateTaskInput = {
        userId: "user-1",
        title: "Completed task"
      };

      const task2: CreateTaskInput = {
        userId: "user-1",
        title: "Pending task"
      };

      const createdTask1 = await service.createTask(task1);
      await service.createTask(task2);

      // Complete one task
      if (createdTask1.success) {
        await service.toggleTaskCompletion(createdTask1.data.id, { completed: true });
      }

      const result = await service.getCompletedTasks("user-1");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
        expect(result.data[0]?.title).toBe("Completed task");
        expect(result.data[0]?.completed).toBe(true);
      }
    });
  });

  describe("Task Updates", () => {
    it("should toggle task completion status", async () => {
      const input: CreateTaskInput = {
        userId: "user-1",
        title: "Task to complete"
      };

      const createdTask = await service.createTask(input);
      expect(createdTask.success).toBe(true);

      if (createdTask.success) {
        const result = await service.toggleTaskCompletion(createdTask.data.id, { completed: true });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.completed).toBe(true);
          expect(result.data.id).toBe(createdTask.data.id);
        }
      }
    });

    it("should update task details", async () => {
      const input: CreateTaskInput = {
        userId: "user-1",
        title: "Original title"
      };

      const createdTask = await service.createTask(input);
      expect(createdTask.success).toBe(true);

      if (createdTask.success) {
        const updateData: UpdateTaskInput = {
          title: "Updated title",
          dueDate: "2024-12-31"
        };

        const result = await service.updateTask(createdTask.data.id, updateData);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.title).toBe("Updated title");
          expect(result.data.dueDate).toBe("2024-12-31");
          expect(result.data.id).toBe(createdTask.data.id);
        }
      }
    });

    it("should fail to update non-existent task", async () => {
      const updateData: UpdateTaskInput = {
        title: "Updated title"
      };

      const result = await service.updateTask("non-existent-id", updateData);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toContain("not found");
      }
    });
  });

  describe("Task Summary", () => {
    it("should generate task summary for user", async () => {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      const tasks: CreateTaskInput[] = [
        {
          userId: "user-1",
          title: "Completed task",
          dueDate: yesterday.toISOString().split('T')[0]
        },
        {
          userId: "user-1",
          title: "Pending task",
          dueDate: tomorrow.toISOString().split('T')[0]
        },
        {
          userId: "user-1",
          title: "Overdue task",
          dueDate: yesterday.toISOString().split('T')[0]
        },
        {
          userId: "user-1",
          title: "No due date task"
        }
      ];

      const createdTasks = [];
      for (const task of tasks) {
        const result = await service.createTask(task);
        if (result.success) {
          createdTasks.push(result.data);
        }
      }

      // Complete the first task
      if (createdTasks[0]) {
        await service.toggleTaskCompletion(createdTasks[0].id, { completed: true });
      }

      const result = await service.getTaskSummary("user-1");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.total).toBe(4);
        expect(result.data.completed).toBe(1);
        expect(result.data.pending).toBe(3);
        expect(result.data.overdue).toBe(1); // One overdue task that's not completed
      }
    });

    it("should return zero summary for user with no tasks", async () => {
      const result = await service.getTaskSummary("user-2");

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.total).toBe(0);
        expect(result.data.completed).toBe(0);
        expect(result.data.pending).toBe(0);
        expect(result.data.overdue).toBe(0);
      }
    });
  });
});