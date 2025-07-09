import type { Transaction, TransactionAnalysis } from "../../schemas";

export const renderTransactionsList = (transactions: Transaction[]): string => {
  if (transactions.length === 0) {
    return '<p class="text-gray-500">No transactions yet</p>';
  }

  return `
    <div class="space-y-2">
      ${transactions.map(t => `
        <div class="border-b pb-2">
          <div class="flex justify-between items-start">
            <div>
              <p class="font-medium">£${t.amount.toFixed(2)}</p>
              <p class="text-sm text-gray-600">${t.category}</p>
              ${t.description ? `<p class="text-sm text-gray-500">${t.description}</p>` : ''}
            </div>
            <p class="text-sm text-gray-500">${new Date(t.date).toLocaleDateString()}</p>
          </div>
        </div>
      `).join('')}
    </div>
  `;
};

export const renderFinanceDashboard = (transactions: Transaction[], analysis: TransactionAnalysis[]): string => {
  return `
    <div class="space-y-6">
      <!-- Add Transaction Form -->
      <div class="bg-white p-6 rounded-lg shadow">
        <h2 class="text-lg font-semibold mb-4">Add Transaction</h2>
        <form hx-post="/api/finance/transactions" hx-trigger="submit" hx-target="#transactions-list">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Amount</label>
              <input type="number" step="0.01" name="amount" class="w-full p-2 border rounded" required>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select name="category" class="w-full p-2 border rounded" required>
                <option value="">Select category</option>
                <option value="groceries">Groceries</option>
                <option value="transport">Transport</option>
                <option value="utilities">Utilities</option>
                <option value="entertainment">Entertainment</option>
                <option value="health">Health</option>
                <option value="other">Other</option>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <input type="text" name="description" class="w-full p-2 border rounded">
            </div>
            
            <div class="flex items-end">
              <button type="submit" class="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                Add Transaction
              </button>
            </div>
          </div>
        </form>
      </div>

      <!-- Spending Analysis -->
      <div class="bg-white p-6 rounded-lg shadow">
        <h2 class="text-lg font-semibold mb-4">Spending by Category (Last 30 Days)</h2>
        <div class="space-y-3">
          ${analysis.map(cat => `
            <div class="flex justify-between items-center p-3 bg-gray-50 rounded">
              <div>
                <p class="font-medium capitalize">${cat.category}</p>
                <p class="text-sm text-gray-600">${cat.transactionCount} transactions</p>
              </div>
              <div class="text-right">
                <p class="font-semibold">£${cat.totalAmount.toFixed(2)}</p>
                <p class="text-sm text-gray-600">avg £${cat.averageAmount.toFixed(2)}</p>
              </div>
            </div>
          `).join('') || '<p class="text-gray-500">No spending data</p>'}
        </div>
      </div>

      <!-- Transactions List -->
      <div class="bg-white p-6 rounded-lg shadow" id="transactions-list">
        <h2 class="text-lg font-semibold mb-4">Recent Transactions</h2>
        ${renderTransactionsList(transactions)}
      </div>
    </div>
  `;
};