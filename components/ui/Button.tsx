import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'accent' | 'cyan';
  isLoading?: boolean;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses =
    'px-6 py-3 font-semibold rounded-full focus:outline-none focus:ring-4 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center transform active:scale-95 shadow-md hover:shadow-lg';

  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-500 focus:ring-blue-500/50 border border-blue-500/30',
    secondary: 'bg-white/10 text-white hover:bg-white/20 focus:ring-white/30 backdrop-blur-md border border-white/10',
    danger: 'bg-red-600 text-white hover:bg-red-500 focus:ring-red-500/50',
    /** Qorong‘i fon ustida yaxshi ko‘rinadigan asosiy harakat tugmasi */
    accent:
      'bg-gradient-to-r from-amber-500 to-orange-500 text-gray-950 hover:from-amber-400 hover:to-orange-400 focus:ring-amber-400/60 border border-amber-300/80 shadow-lg shadow-amber-500/25',
    /** DOI / xizmatlar: narx va sarlavha bilan mos cyan-teal */
    cyan:
      'bg-gradient-to-r from-cyan-600 to-teal-500 text-white hover:from-cyan-500 hover:to-teal-400 focus:ring-cyan-500/50 border border-cyan-400/40 shadow-lg shadow-cyan-500/25',
  };

  const mergedClassName = [baseClasses, variantClasses[variant], className].filter(Boolean).join(' ');

  return (
    <button className={mergedClassName} disabled={isLoading || disabled} {...props}>
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  );
};

export default Button;
