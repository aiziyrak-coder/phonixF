

import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Role } from '../types';
// FIX: Import DollarSign icon and add Accountant role to sidebar links.
import { LayoutDashboard, FileText, Upload, Users, Library, UserCircle, BookMarked, CheckCircle, Sparkles, DollarSign, Archive, Languages } from 'lucide-react';

type NavLinkItem = {
    to: string;
    icon: React.ElementType;
    label: string;
};

const sidebarLinks: Record<Role, NavLinkItem[]> = {
    [Role.Author]: [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Boshqaruv paneli' },
        { to: '/articles', icon: FileText, label: 'Maqolalarim' },
        { to: '/submit', icon: Upload, label: 'Maqola yuborish' },
        { to: '/my-collections', icon: Archive, label: 'To\'plamlarim' },
        { to: '/my-translations', icon: Languages, label: 'Tarjimalarim' },
        { to: '/services', icon: Sparkles, label: 'Xizmatlar' },
        { to: '/profile', icon: UserCircle, label: 'Profilim' },
    ],
    [Role.Reviewer]: [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Boshqaruv paneli' },
        { to: '/articles', icon: FileText, label: 'Taqrizga kelganlar' },
        { to: '/profile', icon: UserCircle, label: 'Profilim' },
    ],
    [Role.JournalAdmin]: [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Boshqaruv paneli' },
        { to: '/journal-admin-panel', icon: FileText, label: 'Jurnal maqolalari' },
        { to: '/articles', icon: FileText, label: 'Nashrga tayyorlar' },
        { to: '/published-articles', icon: CheckCircle, label: 'Nashr etilganlar' },
    ],
    [Role.SuperAdmin]: [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Boshqaruv paneli' },
        { to: '/users', icon: Users, label: 'Foydalanuvchilar' },
        { to: '/articles', icon: FileText, label: 'Barcha maqolalar' },
        { to: '/journal-management', icon: BookMarked, label: 'Jurnallar' },
        { to: '/udk-requests', icon: Library, label: 'UDK so\'rovlari' },
    ],
    [Role.Accountant]: [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Boshqaruv paneli' },
        { to: '/financials', icon: DollarSign, label: 'Moliya' },
        { to: '/profile', icon: UserCircle, label: 'Profilim' },
    ],
};


const Sidebar: React.FC = () => {
  const { user } = useAuth();
  
  if (!user) return null;

  const links = sidebarLinks[user.role] || [];

  const linkClass = "flex items-center px-4 py-3 my-1 text-gray-300 rounded-lg hover:bg-white/10 transition-colors duration-200";
  const activeLinkClass = "flex items-center px-4 py-3 my-1 text-white bg-blue-500/20 rounded-lg font-semibold border-l-4 border-blue-400";

  return (
    <aside className="w-64 h-full p-4 bg-black/20 backdrop-blur-lg border-r border-white/10">
      <div className="flex items-center px-2 mb-10 h-16">
         <Link to="/dashboard" className="text-2xl font-bold text-white tracking-wider flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-xl shadow-md">
                P
            </div>
            <span>PINM</span>
        </Link>
      </div>

      <nav>
        {links.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) => isActive ? activeLinkClass : linkClass}
          >
            <link.icon className="w-6 h-6 mr-4" />
            <span className="">{link.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;