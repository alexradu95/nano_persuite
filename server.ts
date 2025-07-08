// ===== COMPLETE IMPLEMENTATION =====
// server.ts - Main Bun server with all features

import { Database } from "bun:sqlite";
import { readFileSync } from "fs";
import { join } from "path";

// ===== DATABASE SETUP =====
const db = new Database("personal.db");

// Initialize schema
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    amount REAL NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    date TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    due_date TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`);

// ===== SSE CLIENTS MANAGEMENT =====
const sseClients = new Set<ReadableStreamDefaultController>();

// Watch for database changes (simplified - in production use triggers)
function notifyClients(table: string, action: string, data: any) {
  const message = JSON.stringify({ table, action, data });
  
  for (const client of sseClients) {
    try {
      client.enqueue(`data: ${message}\n\n`);
    } catch (e) {
      // Client disconnected
      sseClients.delete(client);
    }
  }
}

// ===== TYPES =====
interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  category: string;
  description?: string;
  date: string;
  created_at: string;
}

interface Task {
  id: string;
  user_id: string;
  title: string;
  completed: boolean;
  due_date?: string;
  created_at: string;
}

// ===== REPOSITORY LAYER =====
class TransactionRepository {
  getAll(userId: string): Transaction[] {
    return db.query<Transaction, [string]>(
      "SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC LIMIT 50"
    ).all(userId);
  }

  getByCategory(userId: string, category: string): Transaction[] {
    return db.query<Transaction, [string, string]>(
      "SELECT * FROM transactions WHERE user_id = ? AND category = ? ORDER BY date DESC"
    ).all(userId, category);
  }

  create(transaction: Omit<Transaction, 'id' | 'created_at'>): Transaction {
    const id = crypto.randomUUID();
    
    db.query(
      `INSERT INTO transactions (id, user_id, amount, category, description, date)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      transaction.user_id,
      transaction.amount,
      transaction.category,
      transaction.description || '',
      transaction.date
    );

    const created = db.query<Transaction, [string]>(
      "SELECT * FROM transactions WHERE id = ?"
    ).get(id)!;

    notifyClients('transactions', 'create', created);
    return created;
  }

  getSpendingByCategory(userId: string): Array<{category: string, total: number}> {
    return db.query<{category: string, total: number}, [string]>(`
      SELECT category, SUM(amount) as total
      FROM transactions
      WHERE user_id = ?
        AND date >= date('now', '-30 days')
      GROUP BY category
      ORDER BY total DESC
    `).all(userId);
  }
}

class TaskRepository {
  getAll(userId: string): Task[] {
    return db.query<Task, [string]>(
      "SELECT * FROM tasks WHERE user_id = ? ORDER BY created_at DESC"
    ).all(userId);
  }

  create(task: Omit<Task, 'id' | 'created_at' | 'completed'>): Task {
    const id = crypto.randomUUID();
    
    db.query(
      `INSERT INTO tasks (id, user_id, title, due_date)
       VALUES (?, ?, ?, ?)`
    ).run(
      id,
      task.user_id,
      task.title,
      task.due_date || null
    );

    const created = db.query<Task, [string]>(
      "SELECT * FROM tasks WHERE id = ?"
    ).get(id)!;

    notifyClients('tasks', 'create', created);
    return created;
  }

  toggle(id: string): Task | null {
    const task = db.query<Task, [string]>(
      "SELECT * FROM tasks WHERE id = ?"
    ).get(id);

    if (!task) return null;

    db.query(
      "UPDATE tasks SET completed = ? WHERE id = ?"
    ).run(!task.completed, id);

    const updated = db.query<Task, [string]>(
      "SELECT * FROM tasks WHERE id = ?"
    ).get(id)!;

    notifyClients('tasks', 'update', updated);
    return updated;
  }
}

// Repository instances
const transactionRepo = new TransactionRepository();
const taskRepo = new TaskRepository();

// ===== HTML TEMPLATES =====
function layout(content: string, title: string = "Personal Dashboard") {
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- HTMZ -->
    <iframe hidden name=htmz onload="setTimeout(() => { const hash = contentWindow.location.hash; if (hash) { const target = document.querySelector(hash); if (target) { target.innerHTML = contentDocument.body.innerHTML; } } else { const currentMain = document.querySelector('main'); const newMain = contentWindow.document.querySelector('main'); if (currentMain && newMain) { currentMain.innerHTML = newMain.innerHTML; } } })"></iframe>
    <base target="htmz">
</head>
<body class="bg-gray-50">
    <nav class="bg-white shadow mb-8">
        <div class="max-w-6xl mx-auto px-4">
            <div class="flex justify-between h-16">
                <div class="flex space-x-8 items-center">
                    <a href="/app/dashboard" class="font-bold text-xl">Dashboard</a>
                    <a href="/app/finance" class="hover:text-blue-600">Finance</a>
                    <a href="/app/tasks" class="hover:text-blue-600">Tasks</a>
                    <a href="/app/journal" class="hover:text-blue-600">Journal</a>
                    <a href="/app/health" class="hover:text-blue-600">Health</a>
                </div>
            </div>
        </div>
    </nav>
    <main class="max-w-6xl mx-auto px-4">
        ${content}
    </main>
    
    <!-- SSE for real-time updates -->
    <script>
        const evtSource = new EventSource('/events');
        
        evtSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            console.log('Update:', data);
            
            // Auto-reload affected sections
            if (data.table === 'transactions' && document.getElementById('transactions-list')) {
                // Create hidden link and click it to trigger HTMZ
                const link = document.createElement('a');
                link.href = '/app/finance/transactions#transactions-list';
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                link.remove();
            }
            
            if (data.table === 'tasks' && document.getElementById('tasks-list')) {
                const link = document.createElement('a');
                link.href = '/app/tasks/list#tasks-list';
                link.style.display = 'none';
                document.body.appendChild(link);
                link.click();
                link.remove();
            }
        };
    </script>
</body>
</html>`;
}

function financeDashboard(transactions: Transaction[], spending: Array<{category: string, total: number}>) {
  const total = spending.reduce((sum, cat) => sum + cat.total, 0);
  
  return layout(`
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Summary Cards -->
        <div class="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="bg-white p-6 rounded-lg shadow">
                <h3 class="text-sm font-medium text-gray-500">Total Spent (30d)</h3>
                <p class="text-2xl font-bold">$${total.toFixed(2)}</p>
            </div>
            <div class="bg-white p-6 rounded-lg shadow">
                <h3 class="text-sm font-medium text-gray-500">Transactions</h3>
                <p class="text-2xl font-bold">${transactions.length}</p>
            </div>
            <div class="bg-white p-6 rounded-lg shadow">
                <h3 class="text-sm font-medium text-gray-500">Avg Transaction</h3>
                <p class="text-2xl font-bold">$${transactions.length ? (total / transactions.length).toFixed(2) : '0.00'}</p>
            </div>
        </div>
        
        <!-- Add Transaction Form -->
        <div class="lg:col-span-2">
            <div class="bg-white p-6 rounded-lg shadow">
                <h2 class="text-lg font-semibold mb-4">Add Transaction</h2>
                <form action="/app/finance/add#transactions-list" method="POST" class="space-y-4">
                    <div class="grid grid-cols-2 gap-4">
                        <input name="amount" type="number" step="0.01" required 
                               class="px-3 py-2 border rounded-md" placeholder="Amount">
                        <select name="category" required class="px-3 py-2 border rounded-md">
                            <option value="">Select category</option>
                            <option value="groceries">Groceries</option>
                            <option value="transport">Transport</option>
                            <option value="utilities">Utilities</option>
                            <option value="entertainment">Entertainment</option>
                            <option value="health">Health</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <input name="description" class="w-full px-3 py-2 border rounded-md" 
                           placeholder="Description (optional)">
                    <button type="submit" 
                            class="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                        Add Transaction
                    </button>
                </form>
            </div>
            
            <!-- Transactions List -->
            <div class="bg-white p-6 rounded-lg shadow mt-6">
                <h2 class="text-lg font-semibold mb-4">Recent Transactions</h2>
                <div id="transactions-list" class="space-y-2">
                    ${renderTransactionsList(transactions)}
                </div>
            </div>
        </div>
        
        <!-- Spending by Category -->
        <div class="lg:col-span-1">
            <div class="bg-white p-6 rounded-lg shadow">
                <h2 class="text-lg font-semibold mb-4">Spending by Category</h2>
                <div class="space-y-3">
                    ${spending.map(cat => `
                        <div>
                            <div class="flex justify-between text-sm">
                                <span class="font-medium">${cat.category}</span>
                                <span>$${cat.total.toFixed(2)}</span>
                            </div>
                            <div class="mt-1 w-full bg-gray-200 rounded-full h-2">
                                <div class="bg-blue-600 h-2 rounded-full" 
                                     style="width: ${(cat.total / total * 100).toFixed(0)}%"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    </div>
  `, "Finance Dashboard");
}

function renderTransactionsList(transactions: Transaction[]) {
  if (transactions.length === 0) {
    return '<p class="text-gray-500">No transactions yet</p>';
  }
  
  return transactions.map(t => `
    <div class="flex justify-between items-center p-3 hover:bg-gray-50 rounded">
        <div>
            <span class="font-medium">${t.category}</span>
            ${t.description ? `<span class="text-gray-600 text-sm ml-2">${t.description}</span>` : ''}
            <span class="text-gray-400 text-xs ml-2">${new Date(t.date).toLocaleDateString()}</span>
        </div>
        <span class="font-semibold ${t.amount < 0 ? 'text-green-600' : 'text-red-600'}">
            ${t.amount < 0 ? '+' : '-'}$${Math.abs(t.amount).toFixed(2)}
        </span>
    </div>
  `).join('');
}

function tasksDashboard(tasks: Task[]) {
  const pending = tasks.filter(t => !t.completed);
  const completed = tasks.filter(t => t.completed);
  
  return layout(`
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Add Task Form -->
        <div class="lg:col-span-3">
            <div class="bg-white p-6 rounded-lg shadow">
                <form action="/app/tasks/add#tasks-list" method="POST" class="flex gap-4">
                    <input name="title" required class="flex-1 px-3 py-2 border rounded-md" 
                           placeholder="What needs to be done?">
                    <input name="due_date" type="date" class="px-3 py-2 border rounded-md">
                    <button type="submit" 
                            class="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                        Add Task
                    </button>
                </form>
            </div>
        </div>
        
        <!-- Tasks Lists -->
        <div class="lg:col-span-3">
            <div id="tasks-list" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                ${renderTasksList(pending, completed)}
            </div>
        </div>
    </div>
  `, "Tasks");
}

function renderTasksList(pending: Task[], completed: Task[]) {
  return `
    <!-- Pending Tasks -->
    <div class="bg-white p-6 rounded-lg shadow">
        <h2 class="text-lg font-semibold mb-4">Pending Tasks (${pending.length})</h2>
        <div class="space-y-2">
            ${pending.map(t => `
                <div class="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
                    <form action="/app/tasks/toggle/${t.id}#tasks-list" method="POST" class="inline">
                        <button type="submit" 
                                class="w-5 h-5 border-2 border-gray-300 rounded hover:border-blue-500"></button>
                    </form>
                    <div class="flex-1">
                        <p class="font-medium">${t.title}</p>
                        ${t.due_date ? `<p class="text-sm text-gray-500">Due: ${new Date(t.due_date).toLocaleDateString()}</p>` : ''}
                    </div>
                </div>
            `).join('') || '<p class="text-gray-500">No pending tasks</p>'}
        </div>
    </div>
    
    <!-- Completed Tasks -->
    <div class="bg-white p-6 rounded-lg shadow">
        <h2 class="text-lg font-semibold mb-4">Completed Tasks (${completed.length})</h2>
        <div class="space-y-2">
            ${completed.map(t => `
                <div class="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
                    <form action="/app/tasks/toggle/${t.id}#tasks-list" method="POST" class="inline">
                        <button type="submit" 
                                class="w-5 h-5 bg-green-500 rounded text-white text-sm">✓</button>
                    </form>
                    <div class="flex-1">
                        <p class="text-gray-500 line-through">${t.title}</p>
                    </div>
                </div>
            `).join('') || '<p class="text-gray-500">No completed tasks</p>'}
        </div>
    </div>
  `;
}

// ===== ROUTE HANDLERS =====
async function handleHTMLRoutes(pathname: string, req: Request): Promise<Response> {
  // Mock user for now - in production, get from session
  const userId = "user-1";
  
  // Finance routes
  if (pathname === '/app/finance') {
    const transactions = transactionRepo.getAll(userId);
    const spending = transactionRepo.getSpendingByCategory(userId);
    return new Response(financeDashboard(transactions, spending), {
      headers: { 'Content-Type': 'text/html' }
    });
  }
  
  if (pathname === '/app/finance/add' && req.method === 'POST') {
    const formData = await req.formData();
    
    const transaction = transactionRepo.create({
      user_id: userId,
      amount: parseFloat(formData.get('amount') as string),
      category: formData.get('category') as string,
      description: formData.get('description') as string,
      date: new Date().toISOString()
    });
    
    // Return updated transactions list for HTMZ
    const transactions = transactionRepo.getAll(userId);
    return new Response(renderTransactionsList(transactions), {
      headers: { 'Content-Type': 'text/html' }
    });
  }
  
  if (pathname === '/app/finance/transactions') {
    const transactions = transactionRepo.getAll(userId);
    return new Response(renderTransactionsList(transactions), {
      headers: { 'Content-Type': 'text/html' }
    });
  }
  
  // Tasks routes
  if (pathname === '/app/tasks') {
    const tasks = taskRepo.getAll(userId);
    return new Response(tasksDashboard(tasks), {
      headers: { 'Content-Type': 'text/html' }
    });
  }
  
  if (pathname === '/app/tasks/add' && req.method === 'POST') {
    const formData = await req.formData();
    
    taskRepo.create({
      user_id: userId,
      title: formData.get('title') as string,
      due_date: formData.get('due_date') as string
    });
    
    // Return updated tasks lists
    const tasks = taskRepo.getAll(userId);
    const pending = tasks.filter(t => !t.completed);
    const completed = tasks.filter(t => t.completed);
    return new Response(renderTasksList(pending, completed), {
      headers: { 'Content-Type': 'text/html' }
    });
  }
  
  if (pathname === '/app/tasks/list') {
    const tasks = taskRepo.getAll(userId);
    const pending = tasks.filter(t => !t.completed);
    const completed = tasks.filter(t => t.completed);
    return new Response(renderTasksList(pending, completed), {
      headers: { 'Content-Type': 'text/html' }
    });
  }
  
  if (pathname.startsWith('/app/tasks/toggle/') && req.method === 'POST') {
    const taskId = pathname.split('/').pop()!;
    taskRepo.toggle(taskId);
    
    // Return updated tasks lists
    const tasks = taskRepo.getAll(userId);
    const pending = tasks.filter(t => !t.completed);
    const completed = tasks.filter(t => t.completed);
    return new Response(renderTasksList(pending, completed), {
      headers: { 'Content-Type': 'text/html' }
    });
  }
  
  // Dashboard
  if (pathname === '/app/dashboard' || pathname === '/app') {
    const transactions = transactionRepo.getAll(userId).slice(0, 5);
    const tasks = taskRepo.getAll(userId).filter(t => !t.completed).slice(0, 5);
    
    return new Response(layout(`
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white p-6 rounded-lg shadow">
          <h2 class="text-lg font-semibold mb-4">Recent Transactions</h2>
          ${renderTransactionsList(transactions)}
          <a href="/app/finance" class="text-blue-600 hover:underline mt-4 inline-block">View all →</a>
        </div>
        
        <div class="bg-white p-6 rounded-lg shadow">
          <h2 class="text-lg font-semibold mb-4">Pending Tasks</h2>
          <div class="space-y-2">
            ${tasks.map(t => `
              <div class="p-2">
                <p class="font-medium">${t.title}</p>
                ${t.due_date ? `<p class="text-sm text-gray-500">Due: ${new Date(t.due_date).toLocaleDateString()}</p>` : ''}
              </div>
            `).join('') || '<p class="text-gray-500">No pending tasks</p>'}
          </div>
          <a href="/app/tasks" class="text-blue-600 hover:underline mt-4 inline-block">View all →</a>
        </div>
      </div>
    `, "Dashboard"), {
      headers: { 'Content-Type': 'text/html' }
    });
  }
  
  return new Response('Not Found', { status: 404 });
}

// ===== API ROUTES =====
async function handleAPIRoutes(pathname: string, req: Request): Promise<Response> {
  const userId = "user-1"; // Mock user
  
  // Transactions API
  if (pathname === '/api/finance/transactions') {
    if (req.method === 'GET') {
      const transactions = transactionRepo.getAll(userId);
      return Response.json({ transactions });
    }
    
    if (req.method === 'POST') {
      const data = await req.json();
      const transaction = transactionRepo.create({
        user_id: userId,
        amount: data.amount,
        category: data.category,
        description: data.description,
        date: data.date || new Date().toISOString()
      });
      return Response.json({ transaction }, { status: 201 });
    }
  }
  
  if (pathname === '/api/finance/spending') {
    const spending = transactionRepo.getSpendingByCategory(userId);
    return Response.json({ spending });
  }
  
  // Tasks API
  if (pathname === '/api/tasks') {
    if (req.method === 'GET') {
      const tasks = taskRepo.getAll(userId);
      return Response.json({ tasks });
    }
    
    if (req.method === 'POST') {
      const data = await req.json();
      const task = taskRepo.create({
        user_id: userId,
        title: data.title,
        due_date: data.due_date
      });
      return Response.json({ task }, { status: 201 });
    }
  }
  
  if (pathname.startsWith('/api/tasks/') && pathname.endsWith('/toggle') && req.method === 'POST') {
    const taskId = pathname.split('/')[3];
    const task = taskRepo.toggle(taskId);
    if (!task) {
      return Response.json({ error: 'Task not found' }, { status: 404 });
    }
    return Response.json({ task });
  }
  
  // MCP Discovery
  if (pathname === '/.well-known/mcp') {
    return Response.json({
      version: '1.0',
      name: 'Personal Dashboard',
      description: 'Personal finance, tasks, journal, and health tracking',
      tools: [
        {
          name: 'addTransaction',
          description: 'Add a financial transaction',
          inputSchema: {
            type: 'object',
            properties: {
              amount: { type: 'number', description: 'Transaction amount' },
              category: { type: 'string', description: 'Transaction category' },
              description: { type: 'string', description: 'Optional description' }
            },
            required: ['amount', 'category']
          }
        },
        {
          name: 'getTransactions',
          description: 'Get all transactions',
          inputSchema: {
            type: 'object',
            properties: {
              category: { type: 'string', description: 'Filter by category' }
            }
          }
        },
        {
          name: 'addTask',
          description: 'Add a new task',
          inputSchema: {
            type: 'object',
            properties: {
              title: { type: 'string', description: 'Task title' },
              due_date: { type: 'string', description: 'Due date (ISO format)' }
            },
            required: ['title']
          }
        },
        {
          name: 'getTasks',
          description: 'Get all tasks',
          inputSchema: {
            type: 'object',
            properties: {
              completed: { type: 'boolean', description: 'Filter by completion status' }
            }
          }
        }
      ]
    });
  }
  
  // MCP Tool Execution
  if (pathname === '/api/mcp/execute' && req.method === 'POST') {
    const { tool, params } = await req.json();
    
    switch (tool) {
      case 'addTransaction':
        const transaction = transactionRepo.create({
          user_id: userId,
          amount: params.amount,
          category: params.category,
          description: params.description || '',
          date: new Date().toISOString()
        });
        return Response.json({ result: transaction });
        
      case 'getTransactions':
        const transactions = params.category 
          ? transactionRepo.getByCategory(userId, params.category)
          : transactionRepo.getAll(userId);
        return Response.json({ result: transactions });
        
      case 'addTask':
        const task = taskRepo.create({
          user_id: userId,
          title: params.title,
          due_date: params.due_date
        });
        return Response.json({ result: task });
        
      case 'getTasks':
        const allTasks = taskRepo.getAll(userId);
        const tasks = params.completed !== undefined
          ? allTasks.filter(t => t.completed === params.completed)
          : allTasks;
        return Response.json({ result: tasks });
        
      default:
        return Response.json({ error: 'Unknown tool' }, { status: 400 });
    }
  }
  
  return Response.json({ error: 'Not Found' }, { status: 404 });
}

// ===== SSE HANDLER =====
function handleSSE(): Response {
  const stream = new ReadableStream({
    start(controller) {
      // Add this client to the set
      sseClients.add(controller);
      
      // Send initial connection message
      controller.enqueue('data: {"type":"connected"}\n\n');
      
      // Clean up on close
      const cleanup = () => {
        sseClients.delete(controller);
      };
      
      // Note: Bun doesn't support cancel callback yet
      // In production, implement proper cleanup
    }
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no' // Disable Nginx buffering
    }
  });
}

// ===== MAIN SERVER =====
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
    
    // Static files (in production, use a proper static server)
    if (url.pathname === '/htmz.js') {
      return new Response(
        `// HTMZ - 166 bytes of magic
        // Already included inline in the HTML`,
        { headers: { 'Content-Type': 'application/javascript' } }
      );
    }
    
    return new Response('Not Found', { status: 404 });
  }
});

console.log(`Server running at http://localhost:${server.port}`);