import type { MonthlyIncomeSummary, Contract } from '../../../schemas/income';

export interface DashboardPageProps {
  monthlyIncome: MonthlyIncomeSummary;
  contracts: Contract[];
}

export const DashboardPage = ({ monthlyIncome, contracts }: DashboardPageProps): string => {
  return `
    <div class="space-y-6">
      
      <!-- Current Month Overview -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="neo-card neo-gray-light p-6">
          <h3 class="neo-title text-lg text-black mb-4">THIS MONTH</h3>
          <div class="neo-container bg-black text-white p-3">
            <span class="font-black uppercase">€${monthlyIncome.totalAmount.toFixed(2)}</span>
          </div>
        </div>
        
        <div class="neo-card neo-gray-medium p-6">
          <h3 class="neo-title text-lg text-black mb-4">HOURS WORKED</h3>
          <div class="neo-container neo-gray-dark text-white p-3">
            <span class="font-black uppercase">${monthlyIncome.totalHours}H</span>
          </div>
        </div>
        
        <div class="neo-card neo-gray-light p-6">
          <h3 class="neo-title text-lg text-black mb-4">ENTRIES</h3>
          <div class="neo-container bg-black text-white p-3">
            <span class="font-black uppercase">${monthlyIncome.entries.length}</span>
          </div>
        </div>
      </div>
      
      <!-- Active Contracts Summary -->
      <div class="neo-card bg-white p-6">
        <h3 class="neo-title text-xl text-black mb-4">ACTIVE CONTRACTS</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          ${contracts.filter(c => c.isActive).map(contract => `
            <div class="neo-container ${contract.isDefault ? 'neo-success' : 'neo-gray-light'} p-4">
              <h4 class="font-black text-black uppercase text-sm">${contract.title}</h4>
              <p class="font-bold text-black">€${contract.hourlyRate}/hour</p>
              ${contract.isDefault ? '<span class="neo-container neo-warning px-2 py-1 text-xs font-black text-black uppercase">DEFAULT</span>' : ''}
            </div>
          `).join('')}
        </div>
      </div>
      
      <!-- Recent Entries -->
      <div class="neo-card bg-white p-6">
        <h3 class="neo-title text-xl text-black mb-4">RECENT ENTRIES</h3>
        <div class="space-y-2">
          ${monthlyIncome.entries.slice(0, 5).map(entry => `
            <div class="neo-container neo-gray-light p-3 flex justify-between items-center">
              <div>
                <span class="font-black text-black">${entry.date}</span>
                <span class="font-medium text-black ml-2">${entry.contractTitle}</span>
              </div>
              <div class="text-right">
                <span class="font-black text-black">${entry.hoursWorked}h</span>
                <span class="font-bold text-black ml-2">€${entry.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
};