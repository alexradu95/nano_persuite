import { runMigrations } from "./shared/database/migrations";
import { FinanceHandlers } from "./features/finance/finance.handlers";
import { TaskHandlers } from "./features/tasks/tasks.handlers";
import { DashboardHandlers } from "./features/dashboard/dashboard.handlers";
import { TransactionService } from "./features/finance/finance.service";
import { TaskService } from "./features/tasks/tasks.service";
import { renderFinanceDashboard } from "./features/finance/finance.templates";
import { renderTasksList } from "./features/tasks/tasks.templates";
import { renderDashboardOverview } from "./features/dashboard/dashboard.templates";
import { layout } from "./shared/templates/layout";
import { handleError } from "./shared/errors/handlers";

// Initialize database
runMigrations();

// Initialize handlers
const financeHandlers = new FinanceHandlers();
const taskHandlers = new TaskHandlers();
const dashboardHandlers = new DashboardHandlers();

// Services for HTML rendering
const transactionService = new TransactionService();
const taskService = new TaskService();

// SSE client management
const sseClients = new Set<ReadableStreamDefaultController>();

function notifyClients(table: string, action: string, data: any) {
  const message = JSON.stringify({ table, action, data });
  const encodedMessage = new TextEncoder().encode(`data: ${message}\n\n`);
  
  for (const client of sseClients) {
    try {
      client.enqueue(encodedMessage);
    } catch (e) {
      console.error('Failed to notify SSE client:', e);
      sseClients.delete(client);
    }
  }
}

// HTML Routes Handler
async function handleHTMLRoutes(pathname: string, req: Request): Promise<Response> {
  const userId = "user-1"; // Mock user - in production, get from auth
  const isHTMXRequest = req.headers.get('HX-Request') === 'true';
  
  try {
    if (pathname === '/app/finance') {
      const transactionsResult = await transactionService.getTransactionsByUser(userId);
      const analysisResult = await transactionService.analyzeSpendingByCategory(userId, 30);
      
      if (!transactionsResult.success || !analysisResult.success) {
        throw new Error("Failed to load finance data");
      }
      
      const content = renderFinanceDashboard(transactionsResult.data, analysisResult.data);
      
      if (isHTMXRequest) {
        // Return just the content for HTMX requests
        return new Response(`
          <div class="mb-6">
            <h1 class="text-2xl font-bold text-gray-900">Finance</h1>
          </div>
          ${content}
        `, {
          headers: { 'Content-Type': 'text/html' }
        });
      }
      
      return new Response(layout(content, "Finance"), {
        headers: { 'Content-Type': 'text/html' }
      });
    }
    
    if (pathname === '/app/tasks') {
      const pendingResult = await taskService.getPendingTasks(userId);
      const completedResult = await taskService.getCompletedTasks(userId);
      
      if (!pendingResult.success || !completedResult.success) {
        throw new Error("Failed to load tasks data");
      }
      
      const content = renderTasksList(pendingResult.data, completedResult.data);
      
      if (isHTMXRequest) {
        // Return just the content for HTMX requests
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
    }
    
    if (pathname === '/app/dashboard' || pathname === '/app') {
      const overviewResponse = await dashboardHandlers.getDashboardOverview(userId);
      const overviewData = await overviewResponse.json();
      
      if (!overviewData.overview) {
        throw new Error("Failed to load dashboard data");
      }
      
      const content = renderDashboardOverview(overviewData.overview);
      
      if (isHTMXRequest) {
        // Return just the content for HTMX requests
        return new Response(`
          <div class="mb-6">
            <h1 class="text-2xl font-bold text-gray-900">Dashboard</h1>
          </div>
          ${content}
        `, {
          headers: { 'Content-Type': 'text/html' }
        });
      }
      
      return new Response(layout(content, "Dashboard"), {
        headers: { 'Content-Type': 'text/html' }
      });
    }
    
    return new Response('Not Found', { status: 404 });
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

// API Routes Handler
async function handleAPIRoutes(pathname: string, req: Request): Promise<Response> {
  const userId = "user-1"; // Mock user - in production, get from auth
  
  try {
    // Finance API
    if (pathname === '/api/finance/transactions') {
      if (req.method === 'GET') {
        // Check if this is an HTMX request for HTML
        const acceptHeader = req.headers.get('Accept') || '';
        const isHTMXRequest = req.headers.get('HX-Request') === 'true';
        
        if (isHTMXRequest || acceptHeader.includes('text/html')) {
          // Return HTML for HTMX requests
          const transactionsResult = await transactionService.getTransactionsByUser(userId);
          if (transactionsResult.success) {
            const { renderTransactionsList } = await import('./features/finance/finance.templates');
            const html = renderTransactionsList(transactionsResult.data);
            return new Response(html, {
              headers: { 'Content-Type': 'text/html' }
            });
          }
        }
        
        return await financeHandlers.getTransactions(userId);
      }
      if (req.method === 'POST') {
        const response = await financeHandlers.createTransaction(req, userId);
        if (response.ok) {
          notifyClients('transactions', 'created', {});
          
          // Return updated HTML instead of JSON for HTMX
          const transactionsResult = await transactionService.getTransactionsByUser(userId);
          
          if (transactionsResult.success) {
            const { renderTransactionsList } = await import('./features/finance/finance.templates');
            const updatedHTML = renderTransactionsList(transactionsResult.data);
            return new Response(updatedHTML, {
              headers: { 'Content-Type': 'text/html' }
            });
          }
        }
        return response;
      }
    }
    
    if (pathname === '/api/finance/spending') {
      return await financeHandlers.getSpendingAnalysis(userId);
    }
    
    // Tasks API
    if (pathname === '/api/tasks') {
      if (req.method === 'GET') {
        return await taskHandlers.getTasks(userId);
      }
      if (req.method === 'POST') {
        const response = await taskHandlers.createTask(req, userId);
        if (response.ok) {
          notifyClients('tasks', 'created', {});
          
          // Return updated HTML instead of JSON for HTMX
          const pendingResult = await taskService.getPendingTasks(userId);
          const completedResult = await taskService.getCompletedTasks(userId);
          
          if (pendingResult.success && completedResult.success) {
            const { renderTasksContent } = await import('./features/tasks/tasks.templates');
            const updatedHTML = renderTasksContent(pendingResult.data, completedResult.data);
            return new Response(updatedHTML, {
              headers: { 'Content-Type': 'text/html' }
            });
          }
        }
        return response;
      }
    }
    
    if (pathname === '/api/tasks/pending') {
      return await taskHandlers.getPendingTasks(userId);
    }
    
    if (pathname === '/api/tasks/completed') {
      return await taskHandlers.getCompletedTasks(userId);
    }
    
    if (pathname.startsWith('/api/tasks/') && pathname.endsWith('/toggle') && req.method === 'POST') {
      const taskId = pathname.split('/')[3];
      const response = await taskHandlers.toggleTaskCompletion(req, taskId);
      if (response.ok) {
        notifyClients('tasks', 'updated', { taskId });
        
        // Return updated HTML instead of JSON for HTMX
        const pendingResult = await taskService.getPendingTasks(userId);
        const completedResult = await taskService.getCompletedTasks(userId);
        
        if (pendingResult.success && completedResult.success) {
          const { renderTasksContent } = await import('./features/tasks/tasks.templates');
          const updatedHTML = renderTasksContent(pendingResult.data, completedResult.data);
          return new Response(updatedHTML, {
            headers: { 'Content-Type': 'text/html' }
          });
        }
      }
      return response;
    }
    
    if (pathname.startsWith('/api/tasks/') && req.method === 'PUT') {
      const taskId = pathname.split('/')[3];
      const response = await taskHandlers.updateTask(req, taskId);
      if (response.ok) {
        notifyClients('tasks', 'updated', { taskId });
      }
      return response;
    }
    
    if (pathname === '/api/tasks/summary') {
      return await taskHandlers.getTaskSummary(userId);
    }
    
    if (pathname === '/api/tasks/refresh') {
      // Return HTML for tasks container refresh
      const pendingResult = await taskService.getPendingTasks(userId);
      const completedResult = await taskService.getCompletedTasks(userId);
      
      if (pendingResult.success && completedResult.success) {
        const { renderTasksContent } = await import('./features/tasks/tasks.templates');
        const html = renderTasksContent(pendingResult.data, completedResult.data);
        return new Response(html, {
          headers: { 'Content-Type': 'text/html' }
        });
      }
      
      return new Response('Error refreshing tasks', { status: 500 });
    }
    
    // Dashboard API
    if (pathname === '/api/dashboard/overview') {
      return await dashboardHandlers.getDashboardOverview(userId);
    }
    
    // MCP Discovery (for AI agent compatibility)
    if (pathname === '/.well-known/mcp') {
      return Response.json({
        name: "Personal Dashboard API",
        version: "1.0.0",
        endpoints: {
          transactions: "/api/finance/transactions",
          tasks: "/api/tasks",
          dashboard: "/api/dashboard/overview"
        }
      });
    }
    
    return new Response('Not Found', { status: 404 });
  } catch (error) {
    const errorResponse = handleError(error as Error);
    return Response.json(errorResponse.body, { status: errorResponse.status });
  }
}

// SSE Handler
function handleSSE(): Response {
  let heartbeatInterval: Timer | null = null;
  
  const stream = new ReadableStream({
    start(controller) {
      sseClients.add(controller);
      
      // Send initial connection message
      try {
        controller.enqueue(new TextEncoder().encode('data: {"type":"connected"}\n\n'));
      } catch (error) {
        console.error('SSE connection error:', error);
        sseClients.delete(controller);
        return;
      }
      
      // Set up periodic heartbeat to keep connection alive
      heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode('data: {"type":"heartbeat"}\n\n'));
        } catch (error) {
          console.error('SSE heartbeat error:', error);
          if (heartbeatInterval) clearInterval(heartbeatInterval);
          sseClients.delete(controller);
        }
      }, 30000); // Every 30 seconds
    },
    
    cancel() {
      // Client disconnected, clean up
      console.log('SSE client disconnected');
      if (heartbeatInterval) clearInterval(heartbeatInterval);
    }
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
      'X-Accel-Buffering': 'no'
    }
  });
}

// Main Server
const server = Bun.serve({
  port: 3000,
  idleTimeout: 255, // Max idle timeout in seconds
  
  async fetch(req) {
    const url = new URL(req.url);
    
    // Redirect root to dashboard
    if (url.pathname === '/') {
      return Response.redirect('/app/dashboard', 302);
    }
    
    // HTML routes (for HTMX)
    if (url.pathname.startsWith('/app/')) {
      return handleHTMLRoutes(url.pathname, req);
    }
    
    // API routes (for JSON)
    if (url.pathname.startsWith('/api/') || url.pathname === '/.well-known/mcp') {
      return handleAPIRoutes(url.pathname, req);
    }
    
    // Server-Sent Events
    if (url.pathname === '/events') {
      return handleSSE();
    }
    
    return new Response('Not Found', { status: 404 });
  }
});

console.log(`🚀 Personal Dashboard running at http://localhost:${server.port}`);
console.log(`📊 Dashboard: http://localhost:${server.port}/app/dashboard`);
console.log(`💰 Finance: http://localhost:${server.port}/app/finance`);
console.log(`✅ Tasks: http://localhost:${server.port}/app/tasks`);

export { server };