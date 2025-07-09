import { TaskService } from "./tasks.service";
import { CreateTaskSchema, UpdateTaskSchema, ToggleTaskCompletionSchema } from "../../schemas";
import { validateRequestBody } from "../../shared/validation/middleware";
import { handleError } from "../../shared/errors/handlers";
import { renderTasksList, renderTasksContent } from "./tasks.templates";
import { layout } from "../../shared/templates/layout";

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
      return Response.json({ tasks: result.data });
    } else {
      // For HTML responses, return just the pending tasks section
      const html = `
        <div class="space-y-3">
          ${result.data.map(task => `
            <div class="p-3 border rounded bg-gray-50">
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="flex items-center gap-2">
                    <button 
                      hx-post="/api/tasks/${task.id}/toggle" 
                      hx-trigger="click"
                      hx-target="#tasks-container"
                      hx-headers='{"Content-Type": "application/json"}'
                      hx-vals='{"completed": true}'
                      hx-indicator="#task-${task.id}-loading"
                      class="w-5 h-5 rounded border-2 border-gray-300 flex items-center justify-center hover:border-green-400 transition-colors"
                      title="Mark as completed"
                    >
                    </button>
                    <div id="task-${task.id}-loading" class="htmx-indicator ml-2">
                      <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    </div>
                    <p class="font-medium">${task.title}</p>
                  </div>
                  ${task.dueDate ? `
                    <p class="text-sm mt-1 text-gray-600">
                      Due: ${new Date(task.dueDate).toLocaleDateString()}
                    </p>
                  ` : ''}
                </div>
              </div>
            </div>
          `).join('') || '<p class="text-gray-500">No pending tasks</p>'}
        </div>
      `;
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
      return Response.json({ tasks: result.data });
    } else {
      // For HTML responses, return just the completed tasks section
      const html = `
        <div class="space-y-3">
          ${result.data.map(task => `
            <div class="p-3 border rounded bg-green-50">
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="flex items-center gap-2">
                    <button 
                      hx-post="/api/tasks/${task.id}/toggle" 
                      hx-trigger="click"
                      hx-target="#tasks-container"
                      hx-headers='{"Content-Type": "application/json"}'
                      hx-vals='{"completed": false}'
                      hx-indicator="#task-${task.id}-loading"
                      class="w-5 h-5 rounded border-2 bg-green-500 border-green-500 flex items-center justify-center hover:border-green-400 transition-colors"
                      title="Mark as pending"
                    >
                      ✓
                    </button>
                    <div id="task-${task.id}-loading" class="htmx-indicator ml-2">
                      <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    </div>
                    <p class="font-medium line-through text-gray-500">${task.title}</p>
                  </div>
                  ${task.dueDate ? `
                    <p class="text-sm mt-1 text-gray-600">
                      Due: ${new Date(task.dueDate).toLocaleDateString()}
                    </p>
                  ` : ''}
                </div>
              </div>
            </div>
          `).join('') || '<p class="text-gray-500">No completed tasks</p>'}
        </div>
      `;
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
  }

  async getTaskSummary(req: Request, userId: string): Promise<Response> {
    const context = this.getRequestContext(req);
    const result = await this.service.getTaskSummary(userId);
    
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
      return Response.json({ summary: result.data });
    } else {
      // For HTML responses, return summary component
      const html = `
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="bg-blue-50 p-4 rounded-lg">
            <p class="text-2xl font-bold text-blue-600">${result.data.total}</p>
            <p class="text-sm text-gray-600">Total Tasks</p>
          </div>
          <div class="bg-green-50 p-4 rounded-lg">
            <p class="text-2xl font-bold text-green-600">${result.data.completed}</p>
            <p class="text-sm text-gray-600">Completed</p>
          </div>
          <div class="bg-yellow-50 p-4 rounded-lg">
            <p class="text-2xl font-bold text-yellow-600">${result.data.pending}</p>
            <p class="text-sm text-gray-600">Pending</p>
          </div>
          <div class="bg-red-50 p-4 rounded-lg">
            <p class="text-2xl font-bold text-red-600">${result.data.overdue}</p>
            <p class="text-sm text-gray-600">Overdue</p>
          </div>
        </div>
      `;
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