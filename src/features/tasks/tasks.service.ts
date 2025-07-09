import { 
  CreateTaskInput, 
  Task, 
  TaskSummary, 
  UpdateTaskInput,
  ToggleTaskCompletionInput,
  CreateTaskSchema,
  TaskSchema,
  UpdateTaskSchema,
  ToggleTaskCompletionSchema
} from "../../schemas";
import { Result, createSuccess, createError } from "../../shared/types/result";
import { validateSchema } from "../../shared/validation/middleware";
import { getDatabase } from "../../shared/database/connection";
import { DatabaseError, ValidationError, NotFoundError } from "../../shared/errors/handlers";

export class TaskService {
  private db = getDatabase();

  async createTask(input: CreateTaskInput): Promise<Result<Task, ValidationError | DatabaseError>> {
    // Validate input
    const validationResult = validateSchema(CreateTaskSchema, input);
    if (!validationResult.success) {
      return createError(validationResult.error);
    }

    const validatedInput = validationResult.data;

    try {
      const id = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const createdAt = new Date().toISOString();

      const insertQuery = this.db.prepare(`
        INSERT INTO tasks (id, user_id, title, completed, due_date, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      insertQuery.run(
        id,
        validatedInput.userId,
        validatedInput.title,
        false,
        validatedInput.dueDate || null,
        createdAt
      );

      const task: Task = {
        id,
        userId: validatedInput.userId,
        title: validatedInput.title,
        completed: false,
        dueDate: validatedInput.dueDate,
        createdAt
      };

      return createSuccess(task);
    } catch (error) {
      return createError(new DatabaseError(
        `Failed to create task: ${error instanceof Error ? error.message : String(error)}`,
        "insert"
      ));
    }
  }

  async getTasksByUser(userId: string): Promise<Result<Task[], DatabaseError>> {
    try {
      const query = this.db.prepare(`
        SELECT id, user_id as userId, title, completed, due_date as dueDate, created_at as createdAt
        FROM tasks 
        WHERE user_id = ? 
        ORDER BY created_at DESC
      `);

      const rows = query.all(userId) as Task[];
      return createSuccess(rows);
    } catch (error) {
      return createError(new DatabaseError(
        `Failed to fetch tasks: ${error instanceof Error ? error.message : String(error)}`,
        "select"
      ));
    }
  }

  async getPendingTasks(userId: string): Promise<Result<Task[], DatabaseError>> {
    try {
      const query = this.db.prepare(`
        SELECT id, user_id as userId, title, completed, due_date as dueDate, created_at as createdAt
        FROM tasks 
        WHERE user_id = ? AND completed = FALSE
        ORDER BY created_at DESC
      `);

      const rows = query.all(userId) as Task[];
      return createSuccess(rows);
    } catch (error) {
      return createError(new DatabaseError(
        `Failed to fetch pending tasks: ${error instanceof Error ? error.message : String(error)}`,
        "select"
      ));
    }
  }

  async getCompletedTasks(userId: string): Promise<Result<Task[], DatabaseError>> {
    try {
      const query = this.db.prepare(`
        SELECT id, user_id as userId, title, completed, due_date as dueDate, created_at as createdAt
        FROM tasks 
        WHERE user_id = ? AND completed = TRUE
        ORDER BY created_at DESC
      `);

      const rows = query.all(userId) as Task[];
      return createSuccess(rows);
    } catch (error) {
      return createError(new DatabaseError(
        `Failed to fetch completed tasks: ${error instanceof Error ? error.message : String(error)}`,
        "select"
      ));
    }
  }

  async toggleTaskCompletion(taskId: string, input: ToggleTaskCompletionInput): Promise<Result<Task, ValidationError | DatabaseError | NotFoundError>> {
    // Validate input
    const validationResult = validateSchema(ToggleTaskCompletionSchema, input);
    if (!validationResult.success) {
      return createError(validationResult.error);
    }

    const validatedInput = validationResult.data;

    try {
      // Check if task exists
      const existingTaskQuery = this.db.prepare(`
        SELECT id, user_id as userId, title, completed, due_date as dueDate, created_at as createdAt
        FROM tasks 
        WHERE id = ?
      `);

      const existingTask = existingTaskQuery.get(taskId) as Task | null;
      if (!existingTask) {
        return createError(new NotFoundError("Task", taskId));
      }

      // Update task completion status
      const updateQuery = this.db.prepare(`
        UPDATE tasks 
        SET completed = ?
        WHERE id = ?
      `);

      updateQuery.run(validatedInput.completed, taskId);

      // Return updated task
      const updatedTask: Task = {
        ...existingTask,
        completed: validatedInput.completed
      };

      return createSuccess(updatedTask);
    } catch (error) {
      return createError(new DatabaseError(
        `Failed to toggle task completion: ${error instanceof Error ? error.message : String(error)}`,
        "update"
      ));
    }
  }

  async updateTask(taskId: string, input: UpdateTaskInput): Promise<Result<Task, ValidationError | DatabaseError | NotFoundError>> {
    // Validate input
    const validationResult = validateSchema(UpdateTaskSchema, input);
    if (!validationResult.success) {
      return createError(validationResult.error);
    }

    const validatedInput = validationResult.data;

    try {
      // Check if task exists
      const existingTaskQuery = this.db.prepare(`
        SELECT id, user_id as userId, title, completed, due_date as dueDate, created_at as createdAt
        FROM tasks 
        WHERE id = ?
      `);

      const existingTask = existingTaskQuery.get(taskId) as Task | null;
      if (!existingTask) {
        return createError(new NotFoundError("Task", taskId));
      }

      // Update task
      const updateQuery = this.db.prepare(`
        UPDATE tasks 
        SET title = ?, due_date = ?
        WHERE id = ?
      `);

      updateQuery.run(
        validatedInput.title || existingTask.title,
        validatedInput.dueDate || existingTask.dueDate || null,
        taskId
      );

      // Return updated task
      const updatedTask: Task = {
        ...existingTask,
        title: validatedInput.title || existingTask.title,
        dueDate: validatedInput.dueDate || existingTask.dueDate
      };

      return createSuccess(updatedTask);
    } catch (error) {
      return createError(new DatabaseError(
        `Failed to update task: ${error instanceof Error ? error.message : String(error)}`,
        "update"
      ));
    }
  }

  async getTaskSummary(userId: string): Promise<Result<TaskSummary, DatabaseError>> {
    try {
      const allTasksQuery = this.db.prepare(`
        SELECT id, user_id as userId, title, completed, due_date as dueDate, created_at as createdAt
        FROM tasks 
        WHERE user_id = ?
      `);

      const allTasks = allTasksQuery.all(userId) as Task[];
      const today = new Date().toISOString().split('T')[0] as string;

      const total = allTasks.length;
      const completed = allTasks.filter(task => task.completed).length;
      const pending = allTasks.filter(task => !task.completed).length;
      const overdue = allTasks.filter(task => 
        !task.completed && 
        task.dueDate && 
        task.dueDate < today
      ).length;

      const summary: TaskSummary = {
        total,
        completed,
        pending,
        overdue
      };

      return createSuccess(summary);
    } catch (error) {
      return createError(new DatabaseError(
        `Failed to get task summary: ${error instanceof Error ? error.message : String(error)}`,
        "select"
      ));
    }
  }
}