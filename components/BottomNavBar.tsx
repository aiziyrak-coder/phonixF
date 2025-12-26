

import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Role } from '../types';
import { LayoutDashboard, FileText, Upload, Users, UserCircle, Library, BookMarked, CheckCircle, DollarSign, Archive, Languages } from 'lucide-react';


const BottomNavBar: React.FC = () => {
    const { user } = useAuth();

    if (!user) return null;

    const navLinksConfig = {
      [Role.Author]: [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Asosiy' },
        { to: '/articles', icon: FileText, label: 'Maqolalar' },
        { to: '/submit', icon: Upload, label: 'Yuborish' },
        { to: '/my-translations', icon: Languages, label: 'Tarjimalar' },
        { to: '/profile', icon: UserCircle, label: 'Profilim' },
      ],
      [Role.Reviewer]: [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Asosiy' },
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
      ],
      [Role.Accountant]: [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Asosiy' },
        { to: '/financials', icon: DollarSign, label: 'Moliya' },
        { to: '/profile', icon: UserCircle, label: 'Profilim' },
      ],
    };

    const navLinks = navLinksConfig[user.role] || [];
    
    const linkBaseClass = "flex flex-col items-center justify-center text-center text-gray-400 hover:text-blue-400 transition-colors w-full h-full";
    const activeClass = "text-blue-400";

    return (
        <nav className="fixed bottom-0 left-0 right-0 h-20 bg-black/30 backdrop-blur-xl border-t border-white/10 flex justify-around items-center z-40">
            {navLinks.map(link => (
                 <NavLink
                    key={link.to}
                    to={link.to}
                    className={({ isActive }) => `${linkBaseClass} ${isActive ? activeClass : ''}`}
                >
                    <link.icon className="w-7 h-7 mb-1" />
                    <span className="text-xs font-medium">{link.label}</span>
                </NavLink>
            ))}
        </nav>
    );
};

export default BottomNavBar;