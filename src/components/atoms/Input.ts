export interface InputProps {
  id: string;
  name: string;
  type?: string;
  label?: string;
  value?: string;
  placeholder?: string;
  required?: boolean;
  min?: string | number;
  max?: string | number;
  step?: string | number;
  className?: string;
}

export const Input = ({
  id,
  name,
  type = 'text',
  label,
  value = '',
  placeholder = '',
  required = false,
  min,
  max,
  step,
  className = ''
}: InputProps): string => {
  return `
    ${label ? `
      <label for="${id}" class="block font-black text-black uppercase mb-2">
        ${label}
      </label>
    ` : ''}
    <input 
      type="${type}"
      id="${id}"
      name="${name}"
      value="${value}"
      placeholder="${placeholder}"
      ${required ? 'required' : ''}
      ${min !== undefined ? `min="${min}"` : ''}
      ${max !== undefined ? `max="${max}"` : ''}
      ${step !== undefined ? `step="${step}"` : ''}
      class="neo-input w-full p-3 font-bold text-black ${className}"
    />
  `;
};
