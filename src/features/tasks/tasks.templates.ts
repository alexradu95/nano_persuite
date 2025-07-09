import type { Task } from "../../schemas";

export const renderTasksList = (pending: Task[], completed: Task[]): string => {
  return `
    <div class="space-y-6">
      <!-- Add Task Form -->
      <div class="bg-white p-6 rounded-lg shadow">
        <h2 class="text-lg font-semibold mb-4">Add Task</h2>
        <form hx-post="/api/tasks" 
              hx-trigger="submit" 
              hx-target="#tasks-container" 
              hx-on::after-request="this.reset()"
              hx-indicator="#task-form-loading">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-1">Task Title</label>
              <input type="text" name="title" class="w-full p-2 border rounded" required>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <input type="date" name="dueDate" class="w-full p-2 border rounded">
            </div>
          </div>
          
          <div class="flex items-center space-x-4 mt-4">
            <button type="submit" class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50">
              Add Task
            </button>
            <div id="task-form-loading" class="htmx-indicator flex items-center text-blue-600">
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              Adding task...
            </div>
          </div>
        </form>
      </div>

      <!-- Tasks Container -->
      <div id="tasks-container">
        ${renderTasksContent(pending, completed)}
      </div>
    </div>
  `;
};

export const renderTasksContent = (pending: Task[], completed: Task[]): string => {
  return `
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Pending Tasks -->
      <div class="bg-white p-6 rounded-lg shadow">
        <h2 class="text-lg font-semibold mb-4">Pending Tasks (${pending.length})</h2>
        <div class="space-y-3">
          ${pending.map(task => renderTaskItem(task)).join('') || '<p class="text-gray-500">No pending tasks</p>'}
        </div>
      </div>

      <!-- Completed Tasks -->
      <div class="bg-white p-6 rounded-lg shadow">
        <h2 class="text-lg font-semibold mb-4">Completed Tasks (${completed.length})</h2>
        <div class="space-y-3">
          ${completed.map(task => renderTaskItem(task)).join('') || '<p class="text-gray-500">No completed tasks</p>'}
        </div>
      </div>
    </div>
  `;
};

export const renderPendingTasksList = (tasks: Task[]): string => {
  if (tasks.length === 0) {
    return '<p class="text-gray-500">No pending tasks</p>';
  }
  
  return `
    <div class="space-y-3">
      ${tasks.map(task => renderTaskItem(task)).join('')}
    </div>
  `;
};

export const renderCompletedTasksList = (tasks: Task[]): string => {
  if (tasks.length === 0) {
    return '<p class="text-gray-500">No completed tasks</p>';
  }
  
  return `
    <div class="space-y-3">
      ${tasks.map(task => renderTaskItem(task)).join('')}
    </div>
  `;
};

export const renderTaskSummary = (summary: { total: number; completed: number; pending: number; overdue: number }): string => {
  return `
    <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div class="bg-blue-50 p-4 rounded-lg">
        <p class="text-2xl font-bold text-blue-600">${summary.total}</p>
        <p class="text-sm text-gray-600">Total Tasks</p>
      </div>
      <div class="bg-green-50 p-4 rounded-lg">
        <p class="text-2xl font-bold text-green-600">${summary.completed}</p>
        <p class="text-sm text-gray-600">Completed</p>
      </div>
      <div class="bg-yellow-50 p-4 rounded-lg">
        <p class="text-2xl font-bold text-yellow-600">${summary.pending}</p>
        <p class="text-sm text-gray-600">Pending</p>
      </div>
      <div class="bg-red-50 p-4 rounded-lg">
        <p class="text-2xl font-bold text-red-600">${summary.overdue}</p>
        <p class="text-sm text-gray-600">Overdue</p>
      </div>
    </div>
  `;
};

export const renderTaskItem = (task: Task): string => {
  const isOverdue = task.dueDate && !task.completed && new Date(task.dueDate) < new Date();
  
  return `
    <div class="p-3 border rounded ${task.completed ? 'bg-green-50' : isOverdue ? 'bg-red-50' : 'bg-gray-50'}">
      <div class="flex items-start justify-between">
        <div class="flex-1">
          <div class="flex items-center gap-2">
            <button 
              hx-post="/api/tasks/${task.id}/toggle" 
              hx-trigger="click"
              hx-target="#tasks-container"
              hx-headers='{"Content-Type": "application/json"}'
              hx-vals='{"completed": ${!task.completed}}'
              hx-indicator="#task-${task.id}-loading"
              class="w-5 h-5 rounded border-2 ${task.completed ? 'bg-green-500 border-green-500' : 'border-gray-300'} flex items-center justify-center hover:border-green-400 transition-colors"
              title="${task.completed ? 'Mark as pending' : 'Mark as completed'}"
            >
              ${task.completed ? '✓' : ''}
            </button>
            <div id="task-${task.id}-loading" class="htmx-indicator ml-2">
              <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            </div>
            <p class="font-medium ${task.completed ? 'line-through text-gray-500' : ''}">${task.title}</p>
          </div>
          
          ${task.dueDate ? `
            <p class="text-sm mt-1 ${isOverdue ? 'text-red-600' : 'text-gray-600'}">
              Due: ${new Date(task.dueDate).toLocaleDateString()}
              ${isOverdue ? ' (Overdue)' : ''}
            </p>
          ` : ''}
        </div>
      </div>
    </div>
  `;
};