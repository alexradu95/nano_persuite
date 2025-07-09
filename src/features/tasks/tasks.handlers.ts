import { TaskService } from "./tasks.service";
import { CreateTaskSchema, UpdateTaskSchema, ToggleTaskCompletionSchema } from "../../schemas";
import { validateRequestBody } from "../../shared/validation/middleware";
import { handleError } from "../../shared/errors/handlers";
import { renderTasksList, renderTasksContent, renderTaskSummary, renderPendingTasksList, renderCompletedTasksList } from "./tasks.templates";
import { layout } from "../../shared/templates/layout";
import { renderErrorMessage } from "../../shared/templates/error";

type ResponseFormat = 'json' | 'html' | 'htmx';

interface RequestContext {
  isHTMXRequest: boolean;
  format: ResponseFormat;
}

export class TaskHandlers {
  private service = new TaskService();

  private getRequestContext(req: Request): RequestContext {
    const isHTMXRequest = req.headers.get('HX-Request') === 'true';
    const acceptHeader = req.headers.get('Accept') || '';
    
    let format: ResponseFormat = 'json';
    if (isHTMXRequest) {
      format = 'htmx';
    } else if (acceptHeader.includes('text/html')) {
      format = 'html';
    }
    
    return { isHTMXRequest, format };
  }

  async getTasks(req: Request, userId: string): Promise<Response> {
    const context = this.getRequestContext(req);
    const result = await this.service.getTasksByUser(userId);
    
    if (!result.success) {
      const errorResponse = handleError(result.error);
      if (context.format === 'json') {
        return Response.json(errorResponse.body, { status: errorResponse.status });
      } else {
        const errorContent = renderErrorMessage(errorResponse.body.message);
        return new Response(errorContent, {
          headers: { 'Content-Type': 'text/html' },
          status: errorResponse.status
        });
      }
    }

    if (context.format === 'json') {
      return Response.json({ tasks: result.data });
    } else {
      // For HTML responses, we need both pending and completed tasks
      const pendingResult = await this.service.getPendingTasks(userId);
      const completedResult = await this.service.getCompletedTasks(userId);
      
      if (pendingResult.success && completedResult.success) {
        const html = renderTasksContent(pendingResult.data, completedResult.data);
        return new Response(html, {
          headers: { 'Content-Type': 'text/html' }
        });
      }
      
      return new Response('Error loading tasks', {
        headers: { 'Content-Type': 'text/html' },
        status: 500
      });
    }
  }

  async getTasksPage(req: Request, userId: string): Promise<Response> {
    const context = this.getRequestContext(req);
    
    try {
      const pendingResult = await this.service.getPendingTasks(userId);
      const completedResult = await this.service.getCompletedTasks(userId);
      
      if (!pendingResult.success || !completedResult.success) {
        throw new Error("Failed to load tasks data");
      }
      
      const content = renderTasksList(pendingResult.data, completedResult.data);
      
      if (context.format === 'htmx') {
        return new Response(`
          <div class="mb-6">
            <h1 class="text-2xl font-bold text-gray-900">Tasks</h1>
          </div>
          ${content}
        `, {
          headers: { 'Content-Type': 'text/html' }
        });
      }
      
      return new Response(layout(content, "Tasks"), {
        headers: { 'Content-Type': 'text/html' }
      });
    } catch (error) {
      const errorResponse = handleError(error as Error);
      const errorContent = `
        <div class="bg-red-50 p-6 rounded-lg">
          <h2 class="text-red-800 font-semibold">Error</h2>
          <p class="text-red-600">${errorResponse.body.message}</p>
        </div>
      `;
      return new Response(layout(errorContent, "Error"), {
        headers: { 'Content-Type': 'text/html' },
        status: errorResponse.status
      });
    }
  }

  async getPendingTasks(req: Request, userId: string): Promise<Response> {
    const context = this.getRequestContext(req);
    const result = await this.service.getPendingTasks(userId);
    
    if (!result.success) {
      const errorResponse = handleError(result.error);
      if (context.format === 'json') {
        return Response.json(errorResponse.body, { status: errorResponse.status });
      } else {
        const errorContent = renderErrorMessage(errorResponse.body.message);
        return new Response(errorContent, {
          headers: { 'Content-Type': 'text/html' },
          status: errorResponse.status
        });
      }
    }

    if (context.format === 'json') {
      return Response.json({ tasks: result.data });
    } else {
      // For HTML responses, return just the pending tasks section using template function
      const html = renderPendingTasksList(result.data);
      return new Response(html, {
        headers: { 'Content-Type': 'text/html' }
      });
    }
  }

  async getCompletedTasks(req: Request, userId: string): Promise<Response> {
    const context = this.getRequestContext(req);
    const result = await this.service.getCompletedTasks(userId);
    
    if (!result.success) {
      const errorResponse = handleError(result.error);
      if (context.format === 'json') {
        return Response.json(errorResponse.body, { status: errorResponse.status });
      } else {
        const errorContent = renderErrorMessage(errorResponse.body.message);
        return new Response(errorContent, {
          headers: { 'Content-Type': 'text/html' },
          status: errorResponse.status
        });
      }
    }

    if (context.format === 'json') {
      return Response.json({ tasks: result.data });
    } else {
      // For HTML responses, return just the completed tasks section using template function
      const html = renderCompletedTasksList(result.data);
      return new Response(html, {
        headers: { 'Content-Type': 'text/html' }
      });
    }
  }

  async createTask(req: Request, userId: string): Promise<Response> {
    const context = this.getRequestContext(req);
    
    try {
      let body: any;
      
      // Try to parse JSON first, fallback to form data
      const contentType = req.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        body = await req.json();
      } else {
        const formData = await req.formData();
        body = Object.fromEntries(formData.entries());
        // Clean up empty date field
        if (body.dueDate === '') {
          delete body.dueDate;
        }
      }

      const validatedData = validateRequestBody(CreateTaskSchema, {
        ...body,
        userId
      });

      const result = await this.service.createTask(validatedData);
      
      if (!result.success) {
        const errorResponse = handleError(result.error);
        if (context.format === 'json') {
          return Response.json(errorResponse.body, { status: errorResponse.status });
        } else {
          const errorContent = `
            <div class="bg-red-50 p-6 rounded-lg">
              <h2 class="text-red-800 font-semibold">Error</h2>
              <p class="text-red-600">${errorResponse.body.message}</p>
            </div>
          `;
          return new Response(errorContent, {
            headers: { 'Content-Type': 'text/html' },
            status: errorResponse.status
          });
        }
      }

      if (context.format === 'json') {
        return Response.json({ task: result.data }, { status: 201 });
      } else {
        // For HTML responses, return updated tasks list
        const pendingResult = await this.service.getPendingTasks(userId);
        const completedResult = await this.service.getCompletedTasks(userId);
        
        if (pendingResult.success && completedResult.success) {
          const html = renderTasksContent(pendingResult.data, completedResult.data);
          return new Response(html, {
            headers: { 'Content-Type': 'text/html' }
          });
        }
        
        return new Response('Task created successfully', {
          headers: { 'Content-Type': 'text/html' }
        });
      }
    } catch (error) {
      const errorResponse = handleError(error as Error);
      if (context.format === 'json') {
        return Response.json(errorResponse.body, { status: errorResponse.status });
      } else {
        const errorContent = renderErrorMessage(errorResponse.body.message);
        return new Response(errorContent, {
          headers: { 'Content-Type': 'text/html' },
          status: errorResponse.status
        });
      }
    }
  }

  async updateTask(req: Request, taskId: string): Promise<Response> {
    const context = this.getRequestContext(req);
    
    try {
      const body = await req.json();
      const validatedData = validateRequestBody(UpdateTaskSchema, body);

      const result = await this.service.updateTask(taskId, validatedData);
      
      if (!result.success) {
        const errorResponse = handleError(result.error);
        if (context.format === 'json') {
          return Response.json(errorResponse.body, { status: errorResponse.status });
        } else {
          const errorContent = `
            <div class="bg-red-50 p-6 rounded-lg">
              <h2 class="text-red-800 font-semibold">Error</h2>
              <p class="text-red-600">${errorResponse.body.message}</p>
            </div>
          `;
          return new Response(errorContent, {
            headers: { 'Content-Type': 'text/html' },
            status: errorResponse.status
          });
        }
      }

      if (context.format === 'json') {
        return Response.json({ task: result.data });
      } else {
        // For HTML responses, return updated tasks list
        const userId = result.data.userId; // Get userId from the updated task
        const pendingResult = await this.service.getPendingTasks(userId);
        const completedResult = await this.service.getCompletedTasks(userId);
        
        if (pendingResult.success && completedResult.success) {
          const html = renderTasksContent(pendingResult.data, completedResult.data);
          return new Response(html, {
            headers: { 'Content-Type': 'text/html' }
          });
        }
        
        return new Response('Task updated successfully', {
          headers: { 'Content-Type': 'text/html' }
        });
      }
    } catch (error) {
      const errorResponse = handleError(error as Error);
      if (context.format === 'json') {
        return Response.json(errorResponse.body, { status: errorResponse.status });
      } else {
        const errorContent = renderErrorMessage(errorResponse.body.message);
        return new Response(errorContent, {
          headers: { 'Content-Type': 'text/html' },
          status: errorResponse.status
        });
      }
    }
  }

  async toggleTaskCompletion(req: Request, taskId: string): Promise<Response> {
    const context = this.getRequestContext(req);
    
    try {
      let body: any;
      
      // Try to parse JSON first, fallback to form data
      const contentType = req.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        body = await req.json();
      } else {
        const formData = await req.formData();
        body = Object.fromEntries(formData.entries());
        // Convert string boolean to actual boolean
        if (body.completed !== undefined) {
          body.completed = body.completed === 'true';
        }
      }

      const validatedData = validateRequestBody(ToggleTaskCompletionSchema, body);

      const result = await this.service.toggleTaskCompletion(taskId, validatedData);
      
      if (!result.success) {
        const errorResponse = handleError(result.error);
        if (context.format === 'json') {
          return Response.json(errorResponse.body, { status: errorResponse.status });
        } else {
          const errorContent = `
            <div class="bg-red-50 p-6 rounded-lg">
              <h2 class="text-red-800 font-semibold">Error</h2>
              <p class="text-red-600">${errorResponse.body.message}</p>
            </div>
          `;
          return new Response(errorContent, {
            headers: { 'Content-Type': 'text/html' },
            status: errorResponse.status
          });
        }
      }

      if (context.format === 'json') {
        return Response.json({ task: result.data });
      } else {
        // For HTML responses, return updated tasks list
        const userId = result.data.userId; // Get userId from the updated task
        const pendingResult = await this.service.getPendingTasks(userId);
        const completedResult = await this.service.getCompletedTasks(userId);
        
        if (pendingResult.success && completedResult.success) {
          const html = renderTasksContent(pendingResult.data, completedResult.data);
          return new Response(html, {
            headers: { 'Content-Type': 'text/html' }
          });
        }
        
        return new Response('Task updated successfully', {
          headers: { 'Content-Type': 'text/html' }
        });
      }
    } catch (error) {
      const errorResponse = handleError(error as Error);
      if (context.format === 'json') {
        return Response.json(errorResponse.body, { status: errorResponse.status });
      } else {
        const errorContent = renderErrorMessage(errorResponse.body.message);
        return new Response(errorContent, {
          headers: { 'Content-Type': 'text/html' },
          status: errorResponse.status
        });
      }
    }
  }

  async getTaskSummary(req: Request, userId: string): Promise<Response> {
    const context = this.getRequestContext(req);
    const result = await this.service.getTaskSummary(userId);
    
    if (!result.success) {
      const errorResponse = handleError(result.error);
      if (context.format === 'json') {
        return Response.json(errorResponse.body, { status: errorResponse.status });
      } else {
        const errorContent = renderErrorMessage(errorResponse.body.message);
        return new Response(errorContent, {
          headers: { 'Content-Type': 'text/html' },
          status: errorResponse.status
        });
      }
    }

    if (context.format === 'json') {
      return Response.json({ summary: result.data });
    } else {
      // For HTML responses, return summary component using template function
      const html = renderTaskSummary(result.data);
      return new Response(html, {
        headers: { 'Content-Type': 'text/html' }
      });
    }
  }

  async getTasksRefresh(req: Request, userId: string): Promise<Response> {
    const pendingResult = await this.service.getPendingTasks(userId);
    const completedResult = await this.service.getCompletedTasks(userId);
    
    if (pendingResult.success && completedResult.success) {
      const html = renderTasksContent(pendingResult.data, completedResult.data);
      return new Response(html, {
        headers: { 'Content-Type': 'text/html' }
      });
    }
    
    return new Response('Error refreshing tasks', { status: 500 });
  }
}