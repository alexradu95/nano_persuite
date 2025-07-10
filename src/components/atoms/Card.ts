export interface CardProps {
  children: string;
  variant?: 'white' | 'light' | 'medium' | 'dark';
  className?: string;
}

export const Card = ({
  children,
  variant = 'white',
  className = ''
}: CardProps): string => {
  const variantClasses = {
    white: 'bg-white',
    light: 'neo-gray-light',
    medium: 'neo-gray-medium',
    dark: 'neo-gray-dark text-white'
  };

  return `
    <div class="neo-card ${variantClasses[variant]} p-6 ${className}">
      ${children}
    </div>
  `;
};
