
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  fullWidth = false, 
  className = '', 
  ...props 
}) => {
  const baseStyles = "px-6 py-3 rounded-full font-semibold transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50";
  const variants = {
    // Ensuring CTA buttons always use #FE6349 and #FFFFFF
    primary: "bg-[#FE6349] text-[#FFFFFF] hover:opacity-90 shadow-md",
    secondary: "bg-white text-gray-800 border border-gray-200 hover:bg-gray-50",
    outline: "border-2 border-[#FE6349] text-[#FE6349] hover:bg-[#FE6349] hover:text-white"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
