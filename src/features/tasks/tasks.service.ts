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
import { DatabaseError, ValidationError, NotFoundError } from "../../shared/errors/handlers";
import { RepositoryFactory } from "../../shared/repositories/factory";
import { type TaskRepository } from "./task.repository";

export class TaskService {
  private repository: TaskRepository;

  constructor(repository?: TaskRepository) {
    this.repository = repository || RepositoryFactory.getTaskRepository();
  }

  async createTask(input: CreateTaskInput): Promise<Result<Task, ValidationError | DatabaseError>> {
    // Validate input
    const validationResult = validateSchema(CreateTaskSchema, input);
    if (!validationResult.success) {
      return createError(validationResult.error);
    }

    const validatedInput = validationResult.data;

    // Create task object
    const id = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const createdAt = new Date().toISOString();

    const task: Task = {
      id,
      userId: validatedInput.userId,
      title: validatedInput.title,
      completed: false,
      dueDate: validatedInput.dueDate,
      createdAt
    };

    // Save via repository
    return await this.repository.create(task);
  }

  async getTasksByUser(userId: string): Promise<Result<Task[], DatabaseError>> {
    return await this.repository.findByUserId(userId, { orderBy: 'created_at', orderDirection: 'ASC' });
  }

  async getPendingTasks(userId: string): Promise<Result<Task[], DatabaseError>> {
    return await this.repository.findPendingByUserId(userId, { orderBy: 'created_at', orderDirection: 'ASC' });
  }

  async getCompletedTasks(userId: string): Promise<Result<Task[], DatabaseError>> {
    return await this.repository.findCompletedByUserId(userId, { orderBy: 'created_at', orderDirection: 'ASC' });
  }

  async toggleTaskCompletion(taskId: string, input: ToggleTaskCompletionInput): Promise<Result<Task, ValidationError | DatabaseError | NotFoundError>> {
    // Validate input
    const validationResult = validateSchema(ToggleTaskCompletionSchema, input);
    if (!validationResult.success) {
      return createError(validationResult.error);
    }

    const validatedInput = validationResult.data;

    // Check if task exists
    const existingTaskResult = await this.repository.findById(taskId);
    if (!existingTaskResult.success) {
      return createError(existingTaskResult.error);
    }

    if (!existingTaskResult.data) {
      return createError(new NotFoundError("Task", taskId));
    }

    // Update completion status via repository
    return await this.repository.updateCompletionStatus(taskId, validatedInput.completed);
  }

  async updateTask(taskId: string, input: UpdateTaskInput): Promise<Result<Task, ValidationError | DatabaseError | NotFoundError>> {
    // Validate input
    const validationResult = validateSchema(UpdateTaskSchema, input);
    if (!validationResult.success) {
      return createError(validationResult.error);
    }

    const validatedInput = validationResult.data;

    // Check if task exists
    const existingTaskResult = await this.repository.findById(taskId);
    if (!existingTaskResult.success) {
      return createError(existingTaskResult.error);
    }

    if (!existingTaskResult.data) {
      return createError(new NotFoundError("Task", taskId));
    }

    // Update task via repository
    return await this.repository.update(taskId, validatedInput);
  }

  async getTaskSummary(userId: string): Promise<Result<TaskSummary, DatabaseError>> {
    return await this.repository.getTaskSummary(userId);
  }
}