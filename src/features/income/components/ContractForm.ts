import { FormField } from '../../../components/molecules/FormField';
import { Button } from '../../../components/atoms/Button';

export const ContractForm = (): string => {
  return `
    <form method="POST" action="/api/income/contracts" class="space-y-4">
      ${FormField({
        id: 'contract-title',
        name: 'title',
        label: 'Contract Title',
        required: true
      })}
      
      ${FormField({
        id: 'contract-hourlyRate',
        name: 'hourlyRate',
        type: 'number',
        label: 'Hourly Rate (€)',
        step: 0.01,
        min: 0,
        required: true
      })}
      
      ${FormField({
        id: 'contract-description',
        name: 'description',
        type: 'textarea',
        label: 'Description (optional)'
      })}
      
      <div class="neo-container neo-gray-light p-3">
        <label class="flex items-center space-x-2">
          <input type="checkbox" name="isDefault" value="true" class="neo-input w-6 h-6">
          <span class="font-black text-black uppercase">Set as default contract</span>
        </label>
      </div>
      
      <div class="flex space-x-4">
        ${Button({
          text: 'ADD CONTRACT',
          type: 'submit',
          variant: 'primary',
          className: 'flex-1'
        })}
        ${Button({
          text: 'CANCEL',
          variant: 'danger',
          onClick: 'hideContractForm()'
        })}
      </div>
    </form>
  `;
};
