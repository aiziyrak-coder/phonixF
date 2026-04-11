
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({ children, className = '', title, onClick }) => {
  return (
    <div 
      className={`bg-white/75 backdrop-blur-2xl border border-slate-200/70 rounded-2xl shadow-[0_12px_48px_-20px_rgba(15,23,42,0.12)] p-6 sm:p-8 transition-all duration-300 hover:shadow-[0_20px_56px_-18px_rgba(15,23,42,0.14)] hover:border-slate-300/90 ${className}`}
      onClick={onClick}
    >
      {title && <h3 className="text-xl font-bold text-slate-900 mb-6 border-b border-slate-200/90 pb-4">{title}</h3>}
      {children}
    </div>
  );
};

export default Card;
