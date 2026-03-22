

import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Role } from '../types';
import { LayoutDashboard, FileText, Upload, Users, UserCircle, BookMarked, CheckCircle, DollarSign, Languages, Sparkles } from 'lucide-react';


const BottomNavBar: React.FC = () => {
    const { user } = useAuth();

    if (!user) return null;

    const navLinksConfig = {
      [Role.Author]: [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Asosiy' },
        { to: '/articles', icon: FileText, label: 'Maqolalar' },
        { to: '/submit', icon: Upload, label: 'Yuborish' },
        { to: '/services', icon: Sparkles, label: 'Xizmatlar' },
        { to: '/my-translations', icon: Languages, label: 'Tarjimalar' },
        { to: '/profile', icon: UserCircle, label: 'Profilim' },
      ],
      [Role.Reviewer]: [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Ishchi stol' },
        { to: '/articles', icon: FileText, label: 'Taqrizlar' },
        { to: '/profile', icon: UserCircle, label: 'Profilim' },
      ],
      [Role.JournalAdmin]: [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Asosiy' },
        { to: '/articles', icon: FileText, label: 'Kutayotganlar' },
        { to: '/published-articles', icon: CheckCircle, label: 'Nashrlar' },
      ],
      [Role.SuperAdmin]: [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Asosiy' },
        { to: '/articles', icon: FileText, label: 'Maqolalar' },
        { to: '/users', icon: Users, label: 'Foydalanuvchilar' },
        { to: '/journal-management', icon: BookMarked, label: 'Jurnallar' },
        { to: '/prices', icon: DollarSign, label: 'Narxlar' },
      ],
      [Role.Accountant]: [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Asosiy' },
        { to: '/financials', icon: DollarSign, label: 'Moliya' },
        { to: '/profile', icon: UserCircle, label: 'Profilim' },
      ],
    };

    const navLinks = navLinksConfig[user.role] || [];
    
    const linkBaseClass =
        'flex flex-1 min-w-0 flex-col items-center justify-center text-center text-gray-400 hover:text-blue-400 transition-colors h-full px-0.5';
    const activeClass = 'text-blue-400';

    return (
        <nav className="fixed bottom-0 left-0 right-0 min-h-[4.5rem] pb-[max(0.25rem,env(safe-area-inset-bottom))] bg-black/30 backdrop-blur-xl border-t border-white/10 flex justify-between items-center z-40 px-1">
            {navLinks.map((link) => (
                <NavLink
                    key={link.to}
                    to={link.to}
                    className={({ isActive }) => `${linkBaseClass} ${isActive ? activeClass : ''}`}
                >
                    <link.icon className="w-6 h-6 sm:w-7 sm:h-7 mb-0.5 shrink-0" />
                    <span className="text-[10px] sm:text-xs font-medium leading-tight line-clamp-2">{link.label}</span>
                </NavLink>
            ))}
        </nav>
    );
};

export default BottomNavBar;