// Mock implementation of Bun SQLite for Jest testing
export class Database {
  private data: Map<string, any[]> = new Map();

  constructor(filename: string) {
    // Initialize mock tables
    this.data.set('users', []);
    this.data.set('transactions', []);
    this.data.set('tasks', []);
  }

  exec(sql: string): void {
    // Mock implementation for table creation and basic operations
    if (sql.includes('CREATE TABLE')) {
      // Table creation is mocked - do nothing
      return;
    }
    
    if (sql.includes('INSERT INTO users')) {
      // Mock default user insertion
      const users = this.data.get('users') || [];
      users.push({
        id: 'user-1',
        name: 'Default User',
        email: 'user@example.com',
        created_at: new Date().toISOString()
      });
      this.data.set('users', users);
    }
  }

  prepare(sql: string) {
    return {
      run: (...params: any[]) => {
        if (sql.includes('INSERT INTO transactions')) {
          const transactions = this.data.get('transactions') || [];
          const [id, userId, amount, category, description, date, createdAt] = params;
          transactions.push({
            id,
            user_id: userId,
            userId,
            amount,
            category,
            description,
            date,
            created_at: createdAt,
            createdAt
          });
          this.data.set('transactions', transactions);
        }
        
        if (sql.includes('INSERT INTO tasks')) {
          const tasks = this.data.get('tasks') || [];
          const [id, userId, title, completed, dueDate, createdAt] = params;
          tasks.push({
            id,
            user_id: userId,
            userId,
            title,
            completed: completed || false,
            due_date: dueDate,
            dueDate,
            created_at: createdAt,
            createdAt
          });
          this.data.set('tasks', tasks);
        }
        
        if (sql.includes('UPDATE tasks')) {
          const tasks = this.data.get('tasks') || [];
          const [completed, id] = params;
          const taskIndex = tasks.findIndex((t: any) => t.id === id);
          if (taskIndex !== -1) {
            tasks[taskIndex].completed = completed;
          }
          this.data.set('tasks', tasks);
        }
        
        if (sql.includes('UPDATE tasks') && sql.includes('title')) {
          const tasks = this.data.get('tasks') || [];
          // This is a more complex update - we'll handle it based on parameter count
          if (params.length === 3) {
            const [title, dueDate, id] = params;
            const taskIndex = tasks.findIndex((t: any) => t.id === id);
            if (taskIndex !== -1) {
              tasks[taskIndex].title = title;
              tasks[taskIndex].due_date = dueDate;
              tasks[taskIndex].dueDate = dueDate;
            }
          }
          this.data.set('tasks', tasks);
        }
      },
      
      all: (...params: any[]) => {
        if (sql.includes('SELECT') && sql.includes('transactions')) {
          const transactions = this.data.get('transactions') || [];
          
          if (sql.includes('GROUP BY category')) {
            // Analysis query
            const [userId, cutoffDate] = params;
            const filtered = transactions.filter((t: any) => 
              t.user_id === userId && t.date >= cutoffDate
            );
            
            const grouped = filtered.reduce((acc: any, transaction: any) => {
              if (!acc[transaction.category]) {
                acc[transaction.category] = {
                  category: transaction.category,
                  totalAmount: 0,
                  transactionCount: 0,
                  averageAmount: 0
                };
              }
              acc[transaction.category].totalAmount += transaction.amount;
              acc[transaction.category].transactionCount += 1;
              acc[transaction.category].averageAmount = 
                acc[transaction.category].totalAmount / acc[transaction.category].transactionCount;
              return acc;
            }, {});
            
            return Object.values(grouped);
          } else {
            // Regular transactions query
            const [userId] = params;
            return transactions.filter((t: any) => t.user_id === userId);
          }
        }
        
        if (sql.includes('SELECT') && sql.includes('tasks')) {
          const tasks = this.data.get('tasks') || [];
          const [userId] = params;
          
          let filtered = tasks.filter((t: any) => t.user_id === userId);
          
          if (sql.includes('completed = 0') || sql.includes('completed = FALSE')) {
            filtered = filtered.filter((t: any) => !t.completed);
          }
          
          if (sql.includes('completed = 1') || sql.includes('completed = TRUE')) {
            filtered = filtered.filter((t: any) => t.completed);
          }
          
          return filtered;
        }
        
        if (sql.includes('SELECT') && sql.includes('users')) {
          const users = this.data.get('users') || [];
          const [userId] = params;
          return users.filter((u: any) => u.id === userId);
        }
        
        return [];
      },
      
      get: (...params: any[]) => {
        if (sql.includes('SELECT') && sql.includes('tasks')) {
          const tasks = this.data.get('tasks') || [];
          const [id] = params;
          return tasks.find((t: any) => t.id === id);
        }
        
        return null;
      }
    };
  }

  close(): void {
    // Mock close
  }
}