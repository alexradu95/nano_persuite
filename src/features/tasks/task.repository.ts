import type { Task, TaskSummary } from "../../schemas";
import type { Result } from "../../shared/types/result";
import { DatabaseError } from "../../shared/errors/handlers";
import type { BaseRepository, FilterOptions } from "../../shared/repositories/types";

// Task-specific repository interface
export interface TaskRepository extends BaseRepository<Task> {
  findByUserId(userId: string, options?: FilterOptions): Promise<Result<Task[], DatabaseError>>;
  findPendingByUserId(userId: string, options?: FilterOptions): Promise<Result<Task[], DatabaseError>>;
  findCompletedByUserId(userId: string, options?: FilterOptions): Promise<Result<Task[], DatabaseError>>;
  findOverdueTasks(userId: string): Promise<Result<Task[], DatabaseError>>;
  updateCompletionStatus(id: string, completed: boolean): Promise<Result<Task, DatabaseError>>;
  getTaskSummary(userId: string): Promise<Result<TaskSummary, DatabaseError>>;
}

// SQLite implementation
export class SQLiteTaskRepository implements TaskRepository {
  constructor(private db: any) {}

  async findById(id: string): Promise<Result<Task | null, DatabaseError>> {
    try {
      const query = this.db.prepare(`
        SELECT id, user_id as userId, title, completed, due_date as dueDate, created_at as createdAt
        FROM tasks 
        WHERE id = ?
      `);
      
      const row = query.get(id) as any | null;
      if (!row) {
        return { success: true, data: null };
      }

      // Convert boolean from SQLite format
      const task: Task = {
        ...row,
        completed: Boolean(row.completed)
      };
      
      return { success: true, data: task };
    } catch (error) {
      return {
        success: false,
        error: new DatabaseError(
          `Failed to find task: ${error instanceof Error ? error.message : String(error)}`,
          "select"
        )
      };
    }
  }

  async create(task: Task): Promise<Result<Task, DatabaseError>> {
    try {
      const insertQuery = this.db.prepare(`
        INSERT INTO tasks (id, user_id, title, completed, due_date, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      insertQuery.run(
        task.id,
        task.userId,
        task.title,
        task.completed,
        task.dueDate || null,
        task.createdAt
      );

      return { success: true, data: task };
    } catch (error) {
      return {
        success: false,
        error: new DatabaseError(
          `Failed to create task: ${error instanceof Error ? error.message : String(error)}`,
          "insert"
        )
      };
    }
  }

  async update(id: string, updates: Partial<Task>): Promise<Result<Task, DatabaseError>> {
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
        UPDATE tasks 
        SET ${setClause}
        WHERE id = ?
      `);

      const values = updateFields.map(field => updates[field as keyof Task]);
      updateQuery.run(...values, id);

      // Return updated task
      const updatedResult = await this.findById(id);
      if (!updatedResult.success) {
        return updatedResult;
      }
      if (!updatedResult.data) {
        return {
          success: false,
          error: new DatabaseError("Task not found after update", "update")
        };
      }
      return updatedResult as Result<Task, DatabaseError>;
    } catch (error) {
      return {
        success: false,
        error: new DatabaseError(
          `Failed to update task: ${error instanceof Error ? error.message : String(error)}`,
          "update"
        )
      };
    }
  }

  async delete(id: string): Promise<Result<boolean, DatabaseError>> {
    try {
      const deleteQuery = this.db.prepare(`DELETE FROM tasks WHERE id = ?`);
      const result = deleteQuery.run(id);
      
      return { success: true, data: result.changes > 0 };
    } catch (error) {
      return {
        success: false,
        error: new DatabaseError(
          `Failed to delete task: ${error instanceof Error ? error.message : String(error)}`,
          "delete"
        )
      };
    }
  }

  async findByUserId(userId: string, options: FilterOptions = {}): Promise<Result<Task[], DatabaseError>> {
    try {
      const {
        limit,
        offset = 0,
        orderBy = 'created_at',
        orderDirection = 'ASC'
      } = options;

      let query = `
        SELECT id, user_id as userId, title, completed, due_date as dueDate, created_at as createdAt
        FROM tasks 
        WHERE user_id = ?
        ORDER BY ${orderBy} ${orderDirection}
      `;

      if (limit) {
        query += ` LIMIT ${limit} OFFSET ${offset}`;
      }

      const preparedQuery = this.db.prepare(query);
      const rows = preparedQuery.all(userId) as any[];
      
      // Convert boolean values from SQLite format
      const tasks = rows.map(row => ({
        ...row,
        completed: Boolean(row.completed)
      })) as Task[];
      
      return { success: true, data: tasks };
    } catch (error) {
      return {
        success: false,
        error: new DatabaseError(
          `Failed to fetch tasks: ${error instanceof Error ? error.message : String(error)}`,
          "select"
        )
      };
    }
  }

  async findPendingByUserId(userId: string, options: FilterOptions = {}): Promise<Result<Task[], DatabaseError>> {
    try {
      const {
        limit,
        offset = 0,
        orderBy = 'created_at',
        orderDirection = 'ASC'
      } = options;

      let query = `
        SELECT id, user_id as userId, title, completed, due_date as dueDate, created_at as createdAt
        FROM tasks 
        WHERE user_id = ? AND completed = FALSE
        ORDER BY ${orderBy} ${orderDirection}
      `;

      if (limit) {
        query += ` LIMIT ${limit} OFFSET ${offset}`;
      }

      const preparedQuery = this.db.prepare(query);
      const rows = preparedQuery.all(userId) as any[];
      
      // Convert boolean values from SQLite format
      const tasks = rows.map(row => ({
        ...row,
        completed: Boolean(row.completed)
      })) as Task[];
      
      return { success: true, data: tasks };
    } catch (error) {
      return {
        success: false,
        error: new DatabaseError(
          `Failed to fetch pending tasks: ${error instanceof Error ? error.message : String(error)}`,
          "select"
        )
      };
    }
  }

  async findCompletedByUserId(userId: string, options: FilterOptions = {}): Promise<Result<Task[], DatabaseError>> {
    try {
      const {
        limit,
        offset = 0,
        orderBy = 'created_at',
        orderDirection = 'ASC'
      } = options;

      let query = `
        SELECT id, user_id as userId, title, completed, due_date as dueDate, created_at as createdAt
        FROM tasks 
        WHERE user_id = ? AND completed = TRUE
        ORDER BY ${orderBy} ${orderDirection}
      `;

      if (limit) {
        query += ` LIMIT ${limit} OFFSET ${offset}`;
      }

      const preparedQuery = this.db.prepare(query);
      const rows = preparedQuery.all(userId) as any[];
      
      // Convert boolean values from SQLite format
      const tasks = rows.map(row => ({
        ...row,
        completed: Boolean(row.completed)
      })) as Task[];
      
      return { success: true, data: tasks };
    } catch (error) {
      return {
        success: false,
        error: new DatabaseError(
          `Failed to fetch completed tasks: ${error instanceof Error ? error.message : String(error)}`,
          "select"
        )
      };
    }
  }

  async findOverdueTasks(userId: string): Promise<Result<Task[], DatabaseError>> {
    try {
      const query = this.db.prepare(`
        SELECT id, user_id as userId, title, completed, due_date as dueDate, created_at as createdAt
        FROM tasks 
        WHERE user_id = ? 
          AND completed = FALSE 
          AND due_date IS NOT NULL 
          AND due_date < date('now')
        ORDER BY due_date ASC
      `);

      const rows = query.all(userId) as any[];
      
      // Convert boolean values from SQLite format
      const tasks = rows.map(row => ({
        ...row,
        completed: Boolean(row.completed)
      })) as Task[];
      
      return { success: true, data: tasks };
    } catch (error) {
      return {
        success: false,
        error: new DatabaseError(
          `Failed to fetch overdue tasks: ${error instanceof Error ? error.message : String(error)}`,
          "select"
        )
      };
    }
  }

  async updateCompletionStatus(id: string, completed: boolean): Promise<Result<Task, DatabaseError>> {
    try {
      const updateQuery = this.db.prepare(`
        UPDATE tasks 
        SET completed = ?
        WHERE id = ?
      `);

      updateQuery.run(completed, id);

      // Return updated task
      const updatedResult = await this.findById(id);
      if (!updatedResult.success) {
        return updatedResult;
      }
      if (!updatedResult.data) {
        return {
          success: false,
          error: new DatabaseError("Task not found after completion update", "update")
        };
      }
      return updatedResult as Result<Task, DatabaseError>;
    } catch (error) {
      return {
        success: false,
        error: new DatabaseError(
          `Failed to update task completion: ${error instanceof Error ? error.message : String(error)}`,
          "update"
        )
      };
    }
  }

  async getTaskSummary(userId: string): Promise<Result<TaskSummary, DatabaseError>> {
    try {
      const query = this.db.prepare(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN completed = TRUE THEN 1 ELSE 0 END) as completed,
          SUM(CASE WHEN completed = FALSE THEN 1 ELSE 0 END) as pending,
          SUM(CASE WHEN completed = FALSE AND due_date IS NOT NULL AND due_date < date('now') THEN 1 ELSE 0 END) as overdue
        FROM tasks 
        WHERE user_id = ?
      `);

      const row = query.get(userId) as TaskSummary;
      return { success: true, data: row };
    } catch (error) {
      return {
        success: false,
        error: new DatabaseError(
          `Failed to get task summary: ${error instanceof Error ? error.message : String(error)}`,
          "select"
        )
      };
    }
  }
}