import type { DashboardOverview } from "../../schemas";
import { renderTransactionsList } from "../finance/finance.templates";

export const renderDashboardOverview = (overview: DashboardOverview): string => {
  return `
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Recent Transactions -->
      <div class="bg-white p-6 rounded-lg shadow">
        <h2 class="text-lg font-semibold mb-4">Recent Transactions</h2>
        ${renderTransactionsList(overview.recentTransactions)}
        <a href="/app/finance" class="text-blue-600 hover:underline mt-4 inline-block">View all →</a>
      </div>
      
      <!-- Pending Tasks -->
      <div class="bg-white p-6 rounded-lg shadow">
        <h2 class="text-lg font-semibold mb-4">Pending Tasks</h2>
        <div class="space-y-2">
          ${overview.pendingTasks.map(task => `
            <div class="p-2">
              <p class="font-medium">${task.title}</p>
              ${task.dueDate ? `<p class="text-sm text-gray-500">Due: ${new Date(task.dueDate).toLocaleDateString()}</p>` : ''}
            </div>
          `).join('') || '<p class="text-gray-500">No pending tasks</p>'}
        </div>
        <a href="/app/tasks" class="text-blue-600 hover:underline mt-4 inline-block">View all →</a>
      </div>

      <!-- Financial Summary -->
      <div class="bg-white p-6 rounded-lg shadow">
        <h2 class="text-lg font-semibold mb-4">Financial Summary</h2>
        <div class="space-y-3">
          <div class="flex justify-between">
            <span class="text-gray-600">Total Spent:</span>
            <span class="font-semibold">£${overview.financialSummary.totalSpent.toFixed(2)}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Transactions:</span>
            <span class="font-semibold">${overview.financialSummary.transactionCount}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-600">Average:</span>
            <span class="font-semibold">£${overview.financialSummary.averageTransactionAmount.toFixed(2)}</span>
          </div>
        </div>
      </div>

      <!-- Task Summary -->
      <div class="bg-white p-6 rounded-lg shadow">
        <h2 class="text-lg font-semibold mb-4">Task Summary</h2>
        <div class="space-y-3">
          <div class="flex justify-between">
            <span class="text-gray-600">Total Tasks:</span>
            <span class="font-semibold">${overview.taskSummary.total}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-green-600">Completed:</span>
            <span class="font-semibold text-green-600">${overview.taskSummary.completed}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-blue-600">Pending:</span>
            <span class="font-semibold text-blue-600">${overview.taskSummary.pending}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-red-600">Overdue:</span>
            <span class="font-semibold text-red-600">${overview.taskSummary.overdue}</span>
          </div>
        </div>
      </div>
    </div>
  `;
};