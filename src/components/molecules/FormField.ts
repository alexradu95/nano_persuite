import { Input, InputProps } from '../atoms/Input';

export interface FormFieldProps extends InputProps {
  error?: string;
  helpText?: string;
}

export const FormField = ({
  error,
  helpText,
  ...inputProps
}: FormFieldProps): string => {
  return `
    <div class="space-y-1">
      ${Input(inputProps)}
      ${helpText ? `
        <p class="text-sm text-gray-600">${helpText}</p>
      ` : ''}
      ${error ? `
        <p class="text-sm text-red-600 font-bold">${error}</p>
      ` : ''}
    </div>
  `;
};
