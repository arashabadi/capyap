import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'glow';
  isLoading?: boolean;
  icon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading, 
  icon,
  className = '',
  disabled,
  size = 'md',
  ...props 
}) => {
  
  const sizeStyles = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2.5 text-sm",
    lg: "px-6 py-3.5 text-base"
  };

  const baseStyles = `inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-950 disabled:opacity-50 disabled:cursor-not-allowed ${sizeStyles[size]}`;
  
  const variants = {
    primary: "bg-primary-600 hover:bg-primary-500 text-white shadow-lg shadow-primary-900/20 border border-transparent",
    glow: "bg-neutral-900 border border-primary-500/50 text-primary-300 hover:text-primary-100 hover:border-primary-400 hover:shadow-[0_0_15px_rgba(99,102,241,0.3)]",
    secondary: "bg-neutral-800 border border-neutral-700 text-neutral-300 hover:bg-neutral-700 hover:text-white",
    ghost: "bg-transparent hover:bg-neutral-800 text-neutral-400 hover:text-white",
    danger: "bg-red-900/30 border border-red-900/50 text-red-400 hover:bg-red-900/50"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin -ml-1 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {!isLoading && icon}
      {children}
    </button>
  );
};