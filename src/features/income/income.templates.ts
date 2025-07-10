import { Contract, MonthlyIncomeSummary } from "../../schemas/income";

export const renderIncomeCalendar = (
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
    <div class="income-tracker">
      <div class="income-header">
        <h1>Income Tracking</h1>
        <div class="month-navigation">
          <a href="/app/income?year=${prevYear}&month=${prevMonth}" class="nav-button">← Previous</a>
          <h2>${monthNames[month - 1]} ${year}</h2>
          <a href="/app/income?year=${nextYear}&month=${nextMonth}" class="nav-button">Next →</a>
        </div>
      </div>
      
      <div class="income-overview">
        <div class="overview-card">
          <h3>Monthly Summary</h3>
          <p><strong>Total Hours:</strong> ${monthlyIncome.totalHours}</p>
          <p><strong>Total Amount:</strong> €${monthlyIncome.totalAmount.toFixed(2)}</p>
        </div>
      </div>
      
      <div class="contracts-section">
        <h3>Active Contracts</h3>
        <div id="contracts-list">
          ${renderContractsList(contracts)}
        </div>
        <button onclick="showContractForm()" class="add-button">Add New Contract</button>
        <div id="contract-form" style="display: none;">
          ${renderContractForm()}
        </div>
      </div>
      
      <div class="calendar-section">
        <h3>Daily Income Entries</h3>
        <div class="calendar">
          <div class="calendar-header">
            <div class="day-header">Sun</div>
            <div class="day-header">Mon</div>
            <div class="day-header">Tue</div>
            <div class="day-header">Wed</div>
            <div class="day-header">Thu</div>
            <div class="day-header">Fri</div>
            <div class="day-header">Sat</div>
          </div>
          <div class="calendar-grid">
            ${renderCalendarDays(monthlyIncome, year, month, daysInMonth, firstDay)}
          </div>
        </div>
      </div>
      
      <div id="income-entry-modal" class="modal" style="display: none;">
        <div class="modal-content">
          <span class="close" onclick="closeIncomeEntryModal()">&times;</span>
          <h3>Add Income Entry</h3>
          <div id="income-entry-form">
            ${renderIncomeEntryForm(contracts)}
          </div>
        </div>
      </div>
    </div>
    
    <style>
      .income-tracker { max-width: 1200px; margin: 0 auto; padding: 20px; }
      .income-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
      .month-navigation { display: flex; align-items: center; gap: 20px; }
      .nav-button { padding: 8px 16px; background: #007bff; color: white; text-decoration: none; border-radius: 4px; }
      .nav-button:hover { background: #0056b3; }
      .income-overview { margin-bottom: 30px; }
      .overview-card { background: #f8f9fa; padding: 20px; border-radius: 8px; border: 1px solid #dee2e6; }
      .contracts-section { margin-bottom: 30px; }
      .contract-item { background: #f8f9fa; padding: 15px; margin: 10px 0; border-radius: 6px; border: 1px solid #dee2e6; }
      .calendar { border: 1px solid #dee2e6; border-radius: 8px; overflow: hidden; }
      .calendar-header { display: grid; grid-template-columns: repeat(7, 1fr); background: #f8f9fa; }
      .day-header { padding: 10px; text-align: center; font-weight: bold; border-right: 1px solid #dee2e6; }
      .day-header:last-child { border-right: none; }
      .calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); }
      .calendar-day { min-height: 80px; border-right: 1px solid #dee2e6; border-bottom: 1px solid #dee2e6; padding: 5px; cursor: pointer; }
      .calendar-day:hover { background: #f8f9fa; }
      .calendar-day.other-month { color: #6c757d; background: #f8f9fa; }
      .calendar-day.has-entry { background: #e7f3ff; }
      .day-number { font-weight: bold; margin-bottom: 5px; }
      .day-entries { font-size: 12px; }
      .add-button { padding: 10px 20px; background: #28a745; color: white; border: none; border-radius: 4px; cursor: pointer; }
      .add-button:hover { background: #218838; }
      .modal { position: fixed; z-index: 1000; left: 0; top: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.4); }
      .modal-content { background: white; margin: 15% auto; padding: 20px; border-radius: 8px; width: 500px; max-width: 90%; }
      .close { color: #aaa; float: right; font-size: 28px; font-weight: bold; cursor: pointer; }
      .close:hover { color: black; }
      .form-group { margin-bottom: 15px; }
      .form-group label { display: block; margin-bottom: 5px; font-weight: bold; }
      .form-group input, .form-group select, .form-group textarea { width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; }
      .submit-button { padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; margin-right: 10px; }
      .submit-button:hover { background: #0056b3; }
      .cancel-button { padding: 10px 20px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer; }
      .cancel-button:hover { background: #5a6268; }
      .success { background: #d4edda; color: #155724; padding: 10px; border-radius: 4px; margin: 10px 0; border: 1px solid #c3e6cb; }
      .contract-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
      .default-contract { border-left: 4px solid #28a745; }
      .default-badge { background: #28a745; color: white; padding: 2px 6px; border-radius: 4px; font-size: 12px; font-weight: bold; }
      .set-default-btn { padding: 4px 8px; background: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 12px; }
      .set-default-btn:hover { background: #5a6268; }
      .day-actions { margin: 2px 0; }
      .quick-add-btn { background: #28a745; color: white; border: none; border-radius: 3px; padding: 2px 4px; font-size: 10px; cursor: pointer; }
      .quick-add-btn:hover { background: #218838; }
      .entry-actions { margin-top: 2px; }
      .delete-entry-btn { background: #dc3545; color: white; border: none; border-radius: 3px; padding: 2px 4px; font-size: 10px; cursor: pointer; margin-left: 2px; }
      .delete-entry-btn:hover { background: #c82333; }
    </style>
    
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
    html += '<div class="calendar-day other-month"></div>';
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const dateString = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
    const entriesForDay = monthlyIncome.entries.filter(entry => entry.date === dateString);
    const hasEntries = entriesForDay.length > 0;
    const totalHours = entriesForDay.reduce((sum, entry) => sum + entry.hoursWorked, 0);
    const totalAmount = entriesForDay.reduce((sum, entry) => sum + entry.totalAmount, 0);
    
    html += `
      <div class="calendar-day ${hasEntries ? 'has-entry' : ''}" onclick="openIncomeEntryModal('${dateString}')">
        <div class="day-number">${day}</div>
        <div class="day-actions">
          <form method="POST" action="/api/income/quick-entry" style="display: inline;">
            <input type="hidden" name="date" value="${dateString}">
            <input type="hidden" name="hours" value="8">
            <button type="submit" class="quick-add-btn" onclick="event.stopPropagation()" title="Quick add 8h">+8h</button>
          </form>
        </div>
        ${hasEntries ? `
          <div class="day-entries">
            ${totalHours}h - €${totalAmount.toFixed(0)}
            <div class="entry-actions">
              ${entriesForDay.map(entry => `
                <form method="POST" action="/api/income/entries/${entry.id}/delete" style="display: inline;">
                  <button type="submit" class="delete-entry-btn" onclick="event.stopPropagation()" title="Delete entry">×</button>
                </form>
              `).join('')}
            </div>
          </div>
        ` : ''}
      </div>
    `;
  }
  
  return html;
};

export const renderContractsList = (contracts: Contract[]): string => {
  if (contracts.length === 0) {
    return '<p>No contracts found. Add your first contract to start tracking income.</p>';
  }
  
  return contracts.map(contract => `
    <div class="contract-item ${contract.isDefault ? 'default-contract' : ''}">
      <div class="contract-header">
        <h4>${contract.title} ${contract.isDefault ? '<span class="default-badge">DEFAULT</span>' : ''}</h4>
        ${!contract.isDefault ? `
          <form method="POST" action="/api/income/contracts/${contract.id}/set-default" style="display: inline;">
            <button type="submit" class="set-default-btn">Set as Default</button>
          </form>
        ` : ''}
      </div>
      <p><strong>Rate:</strong> €${contract.hourlyRate}/hour</p>
      ${contract.description ? `<p>${contract.description}</p>` : ''}
    </div>
  `).join('');
};

export const renderContractForm = (): string => {
  return `
    <form method="POST" action="/api/income/contracts">
      <div class="form-group">
        <label for="contract-title">Contract Title</label>
        <input type="text" id="contract-title" name="title" required>
      </div>
      <div class="form-group">
        <label for="contract-hourlyRate">Hourly Rate (€)</label>
        <input type="number" id="contract-hourlyRate" name="hourlyRate" step="0.01" min="0" required>
      </div>
      <div class="form-group">
        <label for="contract-description">Description (optional)</label>
        <textarea id="contract-description" name="description" rows="3"></textarea>
      </div>
      <div class="form-group">
        <label>
          <input type="checkbox" id="contract-isDefault" name="isDefault" value="true">
          Set as default contract
        </label>
      </div>
      <button type="submit" class="submit-button">Add Contract</button>
      <button type="button" onclick="hideContractForm()" class="cancel-button">Cancel</button>
    </form>
  `;
};

export const renderIncomeEntryForm = (contracts: Contract[]): string => {
  return `
    <form method="POST" action="/api/income/entries">
      <div class="form-group">
        <label for="contract-select">Contract</label>
        <select id="contract-select" name="contractId" required>
          <option value="">Select a contract...</option>
          ${contracts.map(contract => `
            <option value="${contract.id}">${contract.title} - €${contract.hourlyRate}/hour</option>
          `).join('')}
        </select>
      </div>
      <div class="form-group">
        <label for="income-entry-date">Date</label>
        <input type="date" id="income-entry-date" name="date" required>
      </div>
      <div class="form-group">
        <label for="hours-worked">Hours Worked</label>
        <input type="number" id="hours-worked" name="hoursWorked" step="0.25" min="0" required>
      </div>
      <div class="form-group">
        <label for="entry-description">Description (optional)</label>
        <textarea id="entry-description" name="description" rows="3"></textarea>
      </div>
      <button type="submit" class="submit-button">Add Entry</button>
      <button type="button" onclick="closeIncomeEntryModal()" class="cancel-button">Cancel</button>
    </form>
  `;
};

export const renderIncomeOverview = (monthlyIncome: MonthlyIncomeSummary): string => {
  return `
    <div class="income-overview">
      <h3>${monthlyIncome.month}/${monthlyIncome.year} Summary</h3>
      <div class="overview-stats">
        <div class="stat">
          <strong>Total Hours:</strong> ${monthlyIncome.totalHours}
        </div>
        <div class="stat">
          <strong>Total Amount:</strong> €${monthlyIncome.totalAmount.toFixed(2)}
        </div>
        <div class="stat">
          <strong>Entries:</strong> ${monthlyIncome.entries.length}
        </div>
      </div>
      <div class="entries-list">
        ${monthlyIncome.entries.map(entry => `
          <div class="entry-item">
            <span class="entry-date">${entry.date}</span>
            <span class="entry-contract">${entry.contractTitle}</span>
            <span class="entry-hours">${entry.hoursWorked}h</span>
            <span class="entry-amount">€${entry.totalAmount.toFixed(2)}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
};