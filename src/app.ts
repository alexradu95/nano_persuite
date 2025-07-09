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
  
  for (const client of sseClients) {
    try {
      client.enqueue(`data: ${message}\n\n`);
    } catch (e) {
      sseClients.delete(client);
    }
  }
}

// HTML Routes Handler
async function handleHTMLRoutes(pathname: string, req: Request): Promise<Response> {
  const userId = "user-1"; // Mock user - in production, get from auth
  
  try {
    if (pathname === '/app/finance') {
      const transactionsResult = await transactionService.getTransactionsByUser(userId);
      const analysisResult = await transactionService.analyzeSpendingByCategory(userId, 30);
      
      if (!transactionsResult.success || !analysisResult.success) {
        throw new Error("Failed to load finance data");
      }
      
      const content = renderFinanceDashboard(transactionsResult.data, analysisResult.data);
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
        return await financeHandlers.getTransactions(userId);
      }
      if (req.method === 'POST') {
        const response = await financeHandlers.createTransaction(req, userId);
        if (response.ok) {
          notifyClients('transactions', 'created', {});
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
  const stream = new ReadableStream({
    start(controller) {
      sseClients.add(controller);
      controller.enqueue('data: {"type":"connected"}\n\n');
      
      // Cleanup on close would go here in production
    }
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    }
  });
}

// Main Server
const server = Bun.serve({
  port: 3000,
  
  async fetch(req) {
    const url = new URL(req.url);
    
    // Redirect root to dashboard
    if (url.pathname === '/') {
      return Response.redirect('/app/dashboard', 302);
    }
    
    // HTML routes (for HTMZ)
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