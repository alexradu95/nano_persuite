import { runMigrations } from "./shared/database/migrations";
import { IncomeHandlers } from "./features/income/income.handlers";
import { handleError } from "./shared/errors/handlers";

// Initialize database
runMigrations();

// Initialize handlers
const incomeHandlers = new IncomeHandlers();


// HTML Routes Handler
async function handleHTMLRoutes(pathname: string, req: Request): Promise<Response> {
  const userId = "user-1"; // Mock user - in production, get from auth
  
  try {    
    if (pathname === '/app/income' || pathname === '/app') {
      return await incomeHandlers.getIncomePage(req, userId);
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
    // Income API
    if (pathname === '/api/income/contracts') {
      if (req.method === 'GET') {
        return await incomeHandlers.getContracts(req, userId);
      }
      if (req.method === 'POST') {
        return await incomeHandlers.createContract(req, userId);
      }
    }
    
    if (pathname === '/api/income/entries') {
      if (req.method === 'POST') {
        return await incomeHandlers.createIncomeEntry(req, userId);
      }
    }
    
    if (pathname === '/api/income/monthly') {
      return await incomeHandlers.getMonthlyIncome(req, userId);
    }
    
    if (pathname === '/api/income/quick-entry' && req.method === 'POST') {
      return await incomeHandlers.createQuickEntry(req, userId);
    }
    
    if (pathname.startsWith('/api/income/contracts/') && pathname.endsWith('/set-default') && req.method === 'POST') {
      const contractId = pathname.split('/')[4];
      return await incomeHandlers.setDefaultContract(req, contractId, userId);
    }
    
    if (pathname.startsWith('/api/income/entries/') && req.method === 'DELETE') {
      const entryId = pathname.split('/')[4];
      return await incomeHandlers.deleteIncomeEntry(req, entryId, userId);
    }
    
    if (pathname.startsWith('/api/income/entries/') && pathname.endsWith('/delete') && req.method === 'POST') {
      const entryId = pathname.split('/')[4];
      return await incomeHandlers.deleteIncomeEntry(req, entryId, userId);
    }
    
    // MCP Discovery (for AI agent compatibility)
    if (pathname === '/.well-known/mcp') {
      return Response.json({
        name: "Income Tracker API",
        version: "1.0.0",
        endpoints: {
          income: "/api/income/monthly",
          contracts: "/api/income/contracts",
          entries: "/api/income/entries"
        }
      });
    }
    
    return new Response('Not Found', { status: 404 });
  } catch (error) {
    const errorResponse = handleError(error as Error);
    return Response.json(errorResponse.body, { status: errorResponse.status });
  }
}


// Main Server
const server = Bun.serve({
  port: 3000,
  idleTimeout: 255, // Max idle timeout in seconds
  
  async fetch(req) {
    const url = new URL(req.url);
    
    // Redirect root to income page
    if (url.pathname === '/') {
      return Response.redirect('/app/income', 302);
    }
    
    // HTML routes (for HTMX)
    if (url.pathname.startsWith('/app/')) {
      return handleHTMLRoutes(url.pathname, req);
    }
    
    // API routes (for JSON)
    if (url.pathname.startsWith('/api/') || url.pathname === '/.well-known/mcp') {
      return handleAPIRoutes(url.pathname, req);
    }
    
    return new Response('Not Found', { status: 404 });
  }
});

console.log(`🚀 Income Tracker running at http://localhost:${server.port}`);
console.log(`💼 Income: http://localhost:${server.port}/app/income`);

export { server };