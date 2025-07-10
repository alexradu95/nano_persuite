import { Contract, MonthlyIncomeSummary } from "../../schemas/income";

// Monthly Income Entries Page (Calendar view)
export const renderMonthlyIncomePage = (
  contracts: Contract[],
  monthlyIncome: MonthlyIncomeSummary,
  year: number,
  month: number
): string => {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDay = new Date(year, month - 1, 1).getDay();
  
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  
  return `
    <div class="income-tracker space-y-8">
      <div class="flex justify-between items-center mb-6">
        <div class="flex items-center space-x-4">
          <a href="/app/income/monthly?year=${prevYear}&month=${prevMonth}" class="neo-btn neo-gray-medium px-4 py-2 text-black font-black">← PREV</a>
          <h2 class="neo-title text-xl text-white bg-black px-4 py-2">${monthNames[month - 1]} ${year}</h2>
          <a href="/app/income/monthly?year=${nextYear}&month=${nextMonth}" class="neo-btn neo-gray-medium px-4 py-2 text-black font-black">NEXT →</a>
        </div>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="neo-card neo-gray-light p-6" style="view-transition-name: monthly-summary">
          <h3 class="neo-title text-xl text-black mb-4">💰 MONTHLY SUMMARY</h3>
          <div class="space-y-2">
            <div class="neo-container bg-black text-white p-3">
              <span class="font-black uppercase">Total Hours: ${monthlyIncome.totalHours}</span>
            </div>
            <div class="neo-container bg-black text-white p-3">
              <span class="font-black uppercase">Total Amount: €${monthlyIncome.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>
        
        <div class="neo-card neo-gray-medium p-6" style="view-transition-name: quick-stats">
          <h3 class="neo-title text-xl text-black mb-4">🎯 QUICK STATS</h3>
          <div class="space-y-2">
            <div class="neo-container neo-gray-dark text-white p-3">
              <span class="font-black uppercase">Entries: ${monthlyIncome.entries.length}</span>
            </div>
            <div class="neo-container neo-gray-dark text-white p-3">
              <span class="font-black uppercase">Avg/Day: €${monthlyIncome.totalHours > 0 ? (monthlyIncome.totalAmount / monthlyIncome.entries.length).toFixed(0) : '0'}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="neo-card bg-white p-6" style="view-transition-name: calendar-section">
        <h3 class="neo-title text-2xl text-black mb-6">📅 DAILY INCOME ENTRIES</h3>
        <div class="neo-container bg-black p-1">
          <div class="bg-white">
            <div class="grid grid-cols-7 gap-1 p-2">
              <div class="neo-container neo-gray-dark text-white p-2 text-center"><span class="font-black">SUN</span></div>
              <div class="neo-container neo-gray-dark text-white p-2 text-center"><span class="font-black">MON</span></div>
              <div class="neo-container neo-gray-dark text-white p-2 text-center"><span class="font-black">TUE</span></div>
              <div class="neo-container neo-gray-dark text-white p-2 text-center"><span class="font-black">WED</span></div>
              <div class="neo-container neo-gray-dark text-white p-2 text-center"><span class="font-black">THU</span></div>
              <div class="neo-container neo-gray-dark text-white p-2 text-center"><span class="font-black">FRI</span></div>
              <div class="neo-container neo-gray-dark text-white p-2 text-center"><span class="font-black">SAT</span></div>
            </div>
            <div class="grid grid-cols-7 gap-1 p-2">
              ${renderCalendarDays(monthlyIncome, year, month, daysInMonth, firstDay)}
            </div>
          </div>
        </div>
      </div>
      
      <div id="income-entry-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" style="display: none;">
        <div class="neo-modal bg-white p-8 max-w-md w-full">
          <div class="flex justify-between items-center mb-6">
            <h3 class="neo-title text-2xl text-black">💼 ADD INCOME ENTRY</h3>
            <button onclick="closeIncomeEntryModal()" class="neo-btn neo-danger px-4 py-2 text-black font-black">✕</button>
          </div>
          <div id="income-entry-form">
            ${renderIncomeEntryForm(contracts)}
          </div>
        </div>
      </div>
    </div>
    
    
    <script>
      function showContractForm() {
        document.getElementById('contract-form').style.display = 'block';
      }
      
      function hideContractForm() {
        const form = document.getElementById('contract-form');
        form.style.display = 'none';
        // Reset form if it exists
        const contractForm = form.querySelector('form');
        if (contractForm) {
          contractForm.reset();
        }
      }
      
      function openIncomeEntryModal(date) {
        // Reset form fields
        const form = document.querySelector('#income-entry-form form');
        if (form) {
          form.reset();
        }
        document.getElementById('income-entry-date').value = date;
        document.getElementById('income-entry-modal').style.display = 'block';
      }
      
      function closeIncomeEntryModal() {
        document.getElementById('income-entry-modal').style.display = 'none';
        // Reset form fields
        const form = document.querySelector('#income-entry-form form');
        if (form) {
          form.reset();
        }
      }
      
      
      window.onclick = function(event) {
        const modal = document.getElementById('income-entry-modal');
        if (event.target === modal) {
          closeIncomeEntryModal();
        }
      }
    </script>
  `;
};

export const renderCalendarDays = (
  monthlyIncome: MonthlyIncomeSummary,
  year: number,
  month: number,
  daysInMonth: number,
  firstDay: number
): string => {
  let html = '';
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDay; i++) {
    html += '<div class="neo-calendar-day bg-gray-100 h-24"></div>';
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dateString = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    const entriesForDay = monthlyIncome.entries.filter(entry => entry.date === dateString);
    const hasEntries = entriesForDay.length > 0;
    const totalHours = entriesForDay.reduce((sum, entry) => sum + entry.hoursWorked, 0);
    const totalAmount = entriesForDay.reduce((sum, entry) => sum + entry.totalAmount, 0);
    
    html += `
      <div class="neo-calendar-day ${hasEntries ? 'neo-success' : 'bg-white'} h-24 p-2 cursor-pointer" onclick="openIncomeEntryModal('${dateString}')">
        <div class="font-black text-black text-lg mb-1">${day}</div>
        <div class="space-y-1">
          <form method="POST" action="/api/income/quick-entry" style="display: inline;">
            <input type="hidden" name="date" value="${dateString}">
            <input type="hidden" name="hours" value="8">
            <button type="submit" class="neo-btn neo-gray-medium px-2 py-1 text-xs font-black" onclick="event.stopPropagation()" title="Quick add 8h">+8H</button>
          </form>
          ${hasEntries ? `
            <div class="text-xs font-black text-black">
              ${totalHours}H - €${totalAmount.toFixed(0)}
              <div class="flex space-x-1 mt-1">
                ${entriesForDay.map(entry => `
                  <form method="POST" action="/api/income/entries/${entry.id}/delete" style="display: inline;">
                    <button type="submit" class="neo-btn neo-danger px-1 py-0 text-xs font-black" onclick="event.stopPropagation()" title="Delete entry">×</button>
                  </form>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }
  
  return html;
};

export const renderContractsList = (contracts: Contract[]): string => {
  if (contracts.length === 0) {
    return `
      <div class="neo-container bg-gray-100 p-6 text-center">
        <p class="font-black text-black uppercase">No contracts found. Add your first contract to start tracking income!</p>
      </div>
    `;
  }
  
  return contracts.map(contract => `
    <div class="neo-container ${contract.isDefault ? 'neo-success' : 'bg-white'} p-4">
      <div class="flex justify-between items-start mb-2">
        <div>
          <h4 class="font-black text-black text-lg uppercase">${contract.title}</h4>
          ${contract.isDefault ? '<span class="neo-container neo-warning px-2 py-1 text-xs font-black text-black uppercase">⭐ DEFAULT</span>' : ''}
        </div>
        ${!contract.isDefault ? `
          <form method="POST" action="/api/income/contracts/${contract.id}/set-default" style="display: inline;">
            <button type="submit" class="neo-btn neo-gray-medium px-3 py-1 text-xs font-black">SET DEFAULT</button>
          </form>
        ` : ''}
      </div>
      <div class="neo-container bg-black text-white p-2 mb-2">
        <span class="font-black uppercase">Rate: €${contract.hourlyRate}/hour</span>
      </div>
      ${contract.description ? `<p class="font-medium text-black">${contract.description}</p>` : ''}
    </div>
  `).join('');
};

export const renderContractForm = (): string => {
  return `
    <form method="POST" action="/api/income/contracts" class="space-y-4">
      <div>
        <label for="contract-title" class="block font-black text-black uppercase mb-2">Contract Title</label>
        <input type="text" id="contract-title" name="title" required class="neo-input w-full p-3 font-bold text-black">
      </div>
      <div>
        <label for="contract-hourlyRate" class="block font-black text-black uppercase mb-2">Hourly Rate (€)</label>
        <input type="number" id="contract-hourlyRate" name="hourlyRate" step="0.01" min="0" required class="neo-input w-full p-3 font-bold text-black">
      </div>
      <div>
        <label for="contract-description" class="block font-black text-black uppercase mb-2">Description (optional)</label>
        <textarea id="contract-description" name="description" rows="3" class="neo-input w-full p-3 font-bold text-black"></textarea>
      </div>
      <div class="neo-container neo-gray-light p-3">
        <label class="flex items-center space-x-2">
          <input type="checkbox" id="contract-isDefault" name="isDefault" value="true" class="neo-input w-6 h-6">
          <span class="font-black text-black uppercase">Set as default contract</span>
        </label>
      </div>
      <div class="flex space-x-4">
        <button type="submit" class="neo-btn neo-gray-dark text-white px-6 py-3 font-black flex-1">ADD CONTRACT</button>
        <button type="button" onclick="hideContractForm()" class="neo-btn neo-danger px-6 py-3 text-black font-black">CANCEL</button>
      </div>
    </form>
  `;
};

export const renderIncomeEntryForm = (contracts: Contract[]): string => {
  return `
    <form method="POST" action="/api/income/entries" class="space-y-4">
      <div>
        <label for="contract-select" class="block font-black text-black uppercase mb-2">Contract</label>
        <select id="contract-select" name="contractId" required class="neo-input w-full p-3 font-bold text-black">
          <option value="">SELECT A CONTRACT...</option>
          ${contracts.map(contract => `
            <option value="${contract.id}">${contract.title} - €${contract.hourlyRate}/hour</option>
          `).join('')}
        </select>
      </div>
      <div>
        <label for="income-entry-date" class="block font-black text-black uppercase mb-2">Date</label>
        <input type="date" id="income-entry-date" name="date" required class="neo-input w-full p-3 font-bold text-black">
      </div>
      <div>
        <label for="hours-worked" class="block font-black text-black uppercase mb-2">Hours Worked</label>
        <input type="number" id="hours-worked" name="hoursWorked" step="0.25" min="0" required class="neo-input w-full p-3 font-bold text-black">
      </div>
      <div>
        <label for="entry-description" class="block font-black text-black uppercase mb-2">Description (optional)</label>
        <textarea id="entry-description" name="description" rows="3" class="neo-input w-full p-3 font-bold text-black"></textarea>
      </div>
      <div class="flex space-x-4">
        <button type="submit" class="neo-btn neo-gray-dark text-white px-6 py-3 font-black flex-1">ADD ENTRY</button>
        <button type="button" onclick="closeIncomeEntryModal()" class="neo-btn neo-danger px-6 py-3 text-black font-black">CANCEL</button>
      </div>
    </form>
  `;
};

// Contracts Configurator Page
export const renderContractsPage = (contracts: Contract[]): string => {
  return `
    <div class="space-y-6">
      <div class="flex justify-end items-center mb-6">
        <button onclick="showContractForm()" class="neo-btn neo-gray-dark text-white px-6 py-3 font-black">+ ADD CONTRACT</button>
      </div>
      
      <div id="contracts-list" class="space-y-4">
        ${renderContractsList(contracts)}
      </div>
      
      <div id="contract-form" style="display: none;" class="p-6 neo-modal bg-white">
        ${renderContractForm()}
      </div>
    </div>
    
    <script>
      function showContractForm() {
        document.getElementById('contract-form').style.display = 'block';
      }
      
      function hideContractForm() {
        const form = document.getElementById('contract-form');
        form.style.display = 'none';
        const contractForm = form.querySelector('form');
        if (contractForm) {
          contractForm.reset();
        }
      }
    </script>
  `;
};

// Dashboard Page
export const renderDashboardPage = (monthlyIncome: MonthlyIncomeSummary, contracts: Contract[]): string => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  
  return `
    <div class="space-y-6">
      
      <!-- Current Month Overview -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="neo-card neo-gray-light p-6">
          <h3 class="neo-title text-lg text-black mb-4">💰 THIS MONTH</h3>
          <div class="neo-container bg-black text-white p-3">
            <span class="font-black uppercase">€${monthlyIncome.totalAmount.toFixed(2)}</span>
          </div>
        </div>
        
        <div class="neo-card neo-gray-medium p-6">
          <h3 class="neo-title text-lg text-black mb-4">⏰ HOURS WORKED</h3>
          <div class="neo-container neo-gray-dark text-white p-3">
            <span class="font-black uppercase">${monthlyIncome.totalHours}H</span>
          </div>
        </div>
        
        <div class="neo-card neo-gray-light p-6">
          <h3 class="neo-title text-lg text-black mb-4">📊 ENTRIES</h3>
          <div class="neo-container bg-black text-white p-3">
            <span class="font-black uppercase">${monthlyIncome.entries.length}</span>
          </div>
        </div>
      </div>
      
      <!-- Active Contracts Summary -->
      <div class="neo-card bg-white p-6">
        <h3 class="neo-title text-xl text-black mb-4">📋 ACTIVE CONTRACTS</h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          ${contracts.filter(c => c.isActive).map(contract => `
            <div class="neo-container ${contract.isDefault ? 'neo-success' : 'neo-gray-light'} p-4">
              <h4 class="font-black text-black uppercase text-sm">${contract.title}</h4>
              <p class="font-bold text-black">€${contract.hourlyRate}/hour</p>
              ${contract.isDefault ? '<span class="neo-container neo-warning px-2 py-1 text-xs font-black text-black uppercase">⭐ DEFAULT</span>' : ''}
            </div>
          `).join('')}
        </div>
      </div>
      
      <!-- Recent Entries -->
      <div class="neo-card bg-white p-6">
        <h3 class="neo-title text-xl text-black mb-4">📝 RECENT ENTRIES</h3>
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

// Taxes Configurator Page
export const renderTaxesPage = (): string => {
  return `
    <div class="space-y-6">
      
      <div class="neo-card neo-warning p-6">
        <div class="flex items-center space-x-3">
          <span class="text-2xl">🚧</span>
          <div>
            <h3 class="font-black text-black uppercase">COMING SOON</h3>
            <p class="font-medium text-black">Tax configuration and calculation features will be available in a future update.</p>
          </div>
        </div>
      </div>
      
      <div class="neo-card bg-white p-6">
        <h3 class="neo-title text-xl text-black mb-4">📋 PLANNED FEATURES</h3>
        <div class="space-y-3">
          <div class="neo-container neo-gray-light p-3">
            <span class="font-black text-black uppercase">• Tax Rate Configuration</span>
          </div>
          <div class="neo-container neo-gray-light p-3">
            <span class="font-black text-black uppercase">• Automatic Tax Calculations</span>
          </div>
          <div class="neo-container neo-gray-light p-3">
            <span class="font-black text-black uppercase">• Tax Reports Generation</span>
          </div>
          <div class="neo-container neo-gray-light p-3">
            <span class="font-black text-black uppercase">• Quarterly Tax Estimates</span>
          </div>
        </div>
      </div>
    </div>
  `;
};