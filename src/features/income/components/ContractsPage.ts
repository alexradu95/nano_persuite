import type { Contract } from '../../../schemas/income';
import { ContractForm } from './ContractForm';

export interface ContractsPageProps {
  contracts: Contract[];
}

export const ContractsPage = ({ contracts }: ContractsPageProps): string => {
  return `
    <div class="space-y-6">
      <div class="flex justify-end items-center mb-6">
        <button onclick="showContractForm()" class="neo-btn neo-gray-dark text-white px-6 py-3 font-black">+ ADD CONTRACT</button>
      </div>
      
      <div id="contracts-list" class="space-y-4">
        
      </div>
      
      <div id="contract-form" style="display: none;" class="p-6 neo-modal bg-white">
        ${ContractForm()}
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

