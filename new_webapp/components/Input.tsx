import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  containerClassName?: string;
}

export const Input: React.FC<InputProps> = ({ 
  label, 
  error, 
  helperText, 
  className = '', 
  containerClassName = '',
  id,
  ...props 
}) => {
  const inputId = id || props.name;

  return (
    <div className={`w-full ${containerClassName}`}>
      {label && (
        <label htmlFor={inputId} className="block text-xs font-medium text-neutral-400 mb-1.5 uppercase tracking-wider">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`
          w-full px-4 py-3 bg-neutral-900 border rounded-lg text-sm text-neutral-100
          placeholder:text-neutral-600 
          focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-all
          ${error ? 'border-red-900 focus:border-red-500' : 'border-neutral-800 hover:border-neutral-700'}
          ${className}
        `}
        {...props}
      />
      {error && <p className="mt-1.5 text-xs text-red-400">{error}</p>}
      {helperText && !error && <p className="mt-1.5 text-xs text-neutral-500">{helperText}</p>}
    </div>
  );
};