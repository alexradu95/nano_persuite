import type { Contract } from '../../../schemas/income';

export const ContractsList = ({ contracts }: { contracts: Contract[] }): string => {
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
