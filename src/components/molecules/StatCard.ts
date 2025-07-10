import { Card } from '../atoms/Card';

export interface StatCardProps {
  title: string;
  value: string | number;
  icon?: string;
  variant?: 'light' | 'medium' | 'dark';
}

export const StatCard = ({
  title,
  value,
  icon = '',
  variant = 'light'
}: StatCardProps): string => {
  return Card({
    variant,
    children: `
      <h3 class="neo-title text-lg text-black mb-4">
        ${icon} ${title}
      </h3>
      <div class="neo-container ${variant === 'light' ? 'bg-black text-white' : 'neo-gray-dark text-white'} p-3">
        <span class="font-black uppercase">${value}</span>
      </div>
    `
  });
};
