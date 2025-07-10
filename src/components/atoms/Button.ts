export interface ButtonProps {
  text: string;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  onClick?: string;
  className?: string;
  disabled?: boolean;
}

export const Button = ({
  text,
  type = 'button',
  variant = 'primary',
  size = 'md',
  onClick,
  className = '',
  disabled = false
}: ButtonProps): string => {
  const sizeClasses = {
    sm: 'px-3 py-1 text-xs',
    md: 'px-6 py-3',
    lg: 'px-8 py-4 text-lg'
  };

  const variantClasses = {
    primary: 'neo-gray-dark text-white',
    secondary: 'neo-gray-medium text-black',
    danger: 'neo-danger text-black',
    success: 'neo-success text-black'
  };

  return `
    <button 
      type="${type}"
      class="neo-btn ${variantClasses[variant]} ${sizeClasses[size]} font-black ${className}"
      ${onClick ? `onclick="${onClick}"` : ''}
      ${disabled ? 'disabled' : ''}
    >
      ${text}
    </button>
  `;
};
