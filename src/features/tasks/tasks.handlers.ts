import { TaskService } from "./tasks.service";
import { CreateTaskSchema, UpdateTaskSchema, ToggleTaskCompletionSchema } from "../../schemas";
import { validateRequestBody } from "../../shared/validation/middleware";
import { handleError } from "../../shared/errors/handlers";

export class TaskHandlers {
  private service = new TaskService();

  async getTasks(userId: string): Promise<Response> {
    const result = await this.service.getTasksByUser(userId);
    
    if (!result.success) {
      const errorResponse = handleError(result.error);
      return Response.json(errorResponse.body, { status: errorResponse.status });
    }

    return Response.json({ tasks: result.data });
  }

  async getPendingTasks(userId: string): Promise<Response> {
    const result = await this.service.getPendingTasks(userId);
    
    if (!result.success) {
      const errorResponse = handleError(result.error);
      return Response.json(errorResponse.body, { status: errorResponse.status });
    }

    return Response.json({ tasks: result.data });
  }

  async getCompletedTasks(userId: string): Promise<Response> {
    const result = await this.service.getCompletedTasks(userId);
    
    if (!result.success) {
      const errorResponse = handleError(result.error);
      return Response.json(errorResponse.body, { status: errorResponse.status });
    }

    return Response.json({ tasks: result.data });
  }

  async createTask(req: Request, userId: string): Promise<Response> {
    try {
      const body = await req.json();
      const validatedData = validateRequestBody(CreateTaskSchema, {
        ...body,
        userId
      });

      const result = await this.service.createTask(validatedData);
      
      if (!result.success) {
        const errorResponse = handleError(result.error);
        return Response.json(errorResponse.body, { status: errorResponse.status });
      }

      return Response.json({ task: result.data }, { status: 201 });
    } catch (error) {
      const errorResponse = handleError(error as Error);
      return Response.json(errorResponse.body, { status: errorResponse.status });
    }
  }

  async updateTask(req: Request, taskId: string): Promise<Response> {
    try {
      const body = await req.json();
      const validatedData = validateRequestBody(UpdateTaskSchema, body);

      const result = await this.service.updateTask(taskId, validatedData);
      
      if (!result.success) {
        const errorResponse = handleError(result.error);
        return Response.json(errorResponse.body, { status: errorResponse.status });
      }

      return Response.json({ task: result.data });
    } catch (error) {
      const errorResponse = handleError(error as Error);
      return Response.json(errorResponse.body, { status: errorResponse.status });
    }
  }

  async toggleTaskCompletion(req: Request, taskId: string): Promise<Response> {
    try {
      const body = await req.json();
      const validatedData = validateRequestBody(ToggleTaskCompletionSchema, body);

      const result = await this.service.toggleTaskCompletion(taskId, validatedData);
      
      if (!result.success) {
        const errorResponse = handleError(result.error);
        return Response.json(errorResponse.body, { status: errorResponse.status });
      }

      return Response.json({ task: result.data });
    } catch (error) {
      const errorResponse = handleError(error as Error);
      return Response.json(errorResponse.body, { status: errorResponse.status });
    }
  }

  async getTaskSummary(userId: string): Promise<Response> {
    const result = await this.service.getTaskSummary(userId);
    
    if (!result.success) {
      const errorResponse = handleError(result.error);
      return Response.json(errorResponse.body, { status: errorResponse.status });
    }

    return Response.json({ summary: result.data });
  }
}