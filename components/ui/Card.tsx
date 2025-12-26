
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '', title }) => {
  return (
    <div className={`bg-black/20 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-lg p-6 sm:p-8 transition-all duration-300 hover:shadow-2xl hover:border-white/20 ${className}`}>
      {title && <h3 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-4">{title}</h3>}
      {children}
    </div>
  );
};

export default Card;
