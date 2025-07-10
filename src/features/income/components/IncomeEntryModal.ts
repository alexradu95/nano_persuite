import type { Contract } from '../../../schemas/income';

export interface IncomeEntryModalProps {
  contracts: Contract[];
}

export const IncomeEntryModal = ({ contracts }: IncomeEntryModalProps): string => {
  return `
    <div id="income-entry-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" style="display: none;">
      <div class="neo-modal bg-white p-8 max-w-md w-full">
        <div class="flex justify-between items-center mb-6">
          <h3 class="neo-title text-2xl text-black">ADD INCOME ENTRY</h3>
          <button onclick="closeIncomeEntryModal()" class="neo-btn neo-danger px-4 py-2 text-black font-black">X</button>
        </div>
        <div id="income-entry-form">
          ${renderIncomeEntryForm(contracts)}
        </div>
      </div>
    </div>
  `;
};

const renderIncomeEntryForm = (contracts: Contract[]): string => {
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