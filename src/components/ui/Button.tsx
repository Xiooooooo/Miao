import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'fab';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading, 
  className = '', 
  disabled,
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center font-medium transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100";
  
  const variants = {
    primary: "px-5 py-2.5 rounded-full text-white bg-yellow-400 hover:bg-yellow-500 text-slate-900 shadow-sm shadow-yellow-200",
    secondary: "px-5 py-2.5 rounded-full border-2 border-slate-100 text-slate-600 bg-white hover:bg-slate-50",
    danger: "px-5 py-2.5 rounded-full text-white bg-rose-400 hover:bg-rose-500 shadow-sm shadow-rose-200",
    ghost: "px-3 py-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800",
    fab: "w-12 h-12 rounded-full bg-yellow-400 text-slate-900 shadow-lg shadow-yellow-200 hover:bg-yellow-500 flex items-center justify-center",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          ...
        </>
      ) : children}
    </button>
  );
};