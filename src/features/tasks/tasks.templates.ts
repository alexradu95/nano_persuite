import type { Task } from "../../schemas";

export const renderTasksList = (pending: Task[], completed: Task[]): string => {
  return `
    <div class="space-y-6">
      <!-- Add Task Form -->
      <div class="bg-white p-6 rounded-lg shadow">
        <h2 class="text-lg font-semibold mb-4">Add Task</h2>
        <form hx-post="/api/tasks" hx-trigger="submit" hx-target="#tasks-container">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-700 mb-1">Task Title</label>
              <input type="text" name="title" class="w-full p-2 border rounded" required>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
              <input type="date" name="due_date" class="w-full p-2 border rounded">
            </div>
          </div>
          
          <button type="submit" class="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Add Task
          </button>
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
              class="w-4 h-4 rounded border-2 ${task.completed ? 'bg-green-500 border-green-500' : 'border-gray-300'} flex items-center justify-center"
            >
              ${task.completed ? '✓' : ''}
            </button>
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