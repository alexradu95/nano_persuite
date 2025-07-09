import { runMigrations } from "./shared/database/migrations";
import { FinanceHandlers } from "./features/finance/finance.handlers";
import { TaskHandlers } from "./features/tasks/tasks.handlers";
import { DashboardHandlers } from "./features/dashboard/dashboard.handlers";
import { handleError } from "./shared/errors/handlers";

// Initialize database
runMigrations();

// Initialize handlers
const financeHandlers = new FinanceHandlers();
const taskHandlers = new TaskHandlers();
const dashboardHandlers = new DashboardHandlers();

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
  
  try {
    if (pathname === '/app/finance') {
      return await financeHandlers.getFinancePage(req, userId);
    }
    
    if (pathname === '/app/tasks') {
      return await taskHandlers.getTasksPage(req, userId);
    }
    
    if (pathname === '/app/dashboard' || pathname === '/app') {
      return await dashboardHandlers.getDashboardPage(req, userId);
    }
    
    return new Response('Not Found', { status: 404 });
  } catch (error) {
    const errorResponse = handleError(error as Error);
    return new Response(errorResponse.body.message, {
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
        return await financeHandlers.getTransactions(req, userId);
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
      return await financeHandlers.getSpendingAnalysis(req, userId);
    }
    
    // Tasks API
    if (pathname === '/api/tasks') {
      if (req.method === 'GET') {
        return await taskHandlers.getTasks(req, userId);
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
      return await taskHandlers.getPendingTasks(req, userId);
    }
    
    if (pathname === '/api/tasks/completed') {
      return await taskHandlers.getCompletedTasks(req, userId);
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
      return await taskHandlers.getTaskSummary(req, userId);
    }
    
    if (pathname === '/api/tasks/refresh') {
      return await taskHandlers.getTasksRefresh(req, userId);
    }
    
    // Dashboard API
    if (pathname === '/api/dashboard/overview') {
      return await dashboardHandlers.getDashboardOverview(req, userId);
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