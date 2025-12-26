import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link, NavLink } from 'react-router-dom';
import { useAuth, useNotifications } from '../contexts/AuthContext';
import { LogOut, Bell, LayoutDashboard, FileText, Upload, Users, Library, BookMarked, CheckCircle, Sparkles, DollarSign, Archive, Languages } from 'lucide-react';
import { Role, Notification } from '../types';

const roleNames: Record<Role, string> = {
    [Role.Author]: 'Muallif',
    [Role.Reviewer]: 'Taqrizchi',
    [Role.JournalAdmin]: 'Jurnal administratori',
    [Role.SuperAdmin]: 'Bosh administrator',
    [Role.Accountant]: 'Moliyachi',
};

type NavLinkItem = {
    to: string;
    icon: React.ElementType;
    label: string;
};

const mainNavLinks: Record<Role, NavLinkItem[]> = {
    [Role.Author]: [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Boshqaruv paneli' },
        { to: '/articles', icon: FileText, label: 'Maqolalarim' },
        { to: '/submit', icon: Upload, label: 'Maqola yuborish' },
        { to: '/my-collections', icon: Archive, label: 'To\'plamlarim' },
        { to: '/my-translations', icon: Languages, label: 'Tarjimalarim' },
        { to: '/services', icon: Sparkles, label: 'Xizmatlar' },
    ],
    [Role.Reviewer]: [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Boshqaruv paneli' },
        { to: '/articles', icon: FileText, label: 'Taqrizga kelganlar' },
    ],
    [Role.JournalAdmin]: [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Boshqaruv paneli' },
        { to: '/articles', icon: FileText, label: 'Maqolalar' },
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
    ],
};


const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const [isDropdownOpen, setIsDropdownOpen] =
useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const links = user ? mainNavLinks[user.role] || [] : [];
  const linkClass = "flex items-center px-3 py-2 text-sm font-medium text-gray-300 rounded-lg hover:bg-white/10 transition-colors";
  const activeLinkClass = "flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-500/20 rounded-lg";


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
            setIsDropdownOpen(false);
        }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
        document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  if (!user) {
    return null;
  }
  
  const handleNotificationClick = (notification: Notification) => {
      markAsRead(notification.id);
      if(notification.link) {
          navigate(notification.link);
      }
      setIsDropdownOpen(false);
  }

  return (
    <header className="flex-shrink-0 flex items-center justify-between px-4 sm:px-6 h-20 bg-black/20 backdrop-blur-lg border-b border-white/10 sticky top-0 z-30">
        <div className="flex items-center gap-6">
            <Link to="/dashboard" className="text-2xl font-bold text-white tracking-wider flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-xl shadow-md">
                    P
                </div>
                <span className="hidden lg:block">PINM</span>
            </Link>
            <nav className="hidden md:flex items-center gap-2">
                {links.map(link => (
                    <NavLink
                        key={link.to}
                        to={link.to}
                        className={({ isActive }) => isActive ? activeLinkClass : linkClass}
                    >
                        <link.icon className="w-5 h-5 mr-2" />
                        <span>{link.label}</span>
                    </NavLink>
                ))}
            </nav>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
            <div className="relative">
                 <button 
                    onClick={() => setIsDropdownOpen(prev => !prev)}
                    className="text-gray-300 hover:text-white focus:outline-none transition-colors p-2 rounded-full hover:bg-white/10"
                    aria-label="Bildirishnomalar"
                >
                    <Bell size={22} />
                    {unreadCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>
                    )}
                </button>
                {isDropdownOpen && (
                    <div ref={dropdownRef} className="absolute right-0 mt-3 w-80 max-h-96 overflow-y-auto bg-black/50 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl z-50">
                        <div className="p-4 border-b border-white/10 flex justify-between items-center">
                            <h4 className="font-semibold text-white">Bildirishnomalar</h4>
                            {notifications.length > 0 && (
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        markAllAsRead();
                                    }}
                                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                                >
                                    Hammasini o'qilgan deb belgilash
                                </button>
                            )}
                        </div>
                        {notifications.length > 0 ? (
                            <ul className="divide-y divide-white/10">
                                {notifications.map(n => (
                                    <li key={n.id} onClick={() => handleNotificationClick(n)} className={`p-4 text-sm cursor-pointer hover:bg-white/5 transition-colors ${!n.read ? 'bg-blue-500/10' : ''}`}>
                                        <p className="text-gray-200 leading-relaxed">{n.message}</p>
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="p-6 text-center text-sm text-gray-400">Yangi bildirishnomalar yo'q.</p>
                        )}
                    </div>
                )}
            </div>
            <Link to="/profile" className="flex items-center p-1.5 rounded-full hover:bg-white/10 transition-colors">
                {user.avatarUrl ? (
                    <img 
                        className="h-9 w-9 sm:h-10 sm:w-10 rounded-full object-cover border-2 border-white/20" 
                        src={user.avatarUrl} 
                        alt={`${user.firstName} ${user.lastName}`} 
                    />
                ) : (
                    <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-blue-500/20 border-2 border-white/20 flex items-center justify-center text-white font-semibold">
                        {user.firstName?.charAt(0)}{user.lastName?.charAt(0) || 'U'}
                    </div>
                )}
                <div className="mx-2 sm:mx-4 text-right hidden md:block">
                    <p className="text-sm font-semibold text-white">{user.firstName} {user.lastName}</p>
                    <p className="text-xs text-gray-400">{roleNames[user.role]}</p>
                </div>
            </Link>
            <button onClick={logout} className="text-gray-300 hover:text-red-400 focus:outline-none transition-colors p-2.5 rounded-full hover:bg-white/10" aria-label="Chiqish">
                <LogOut size={20} />
            </button>
        </div>
    </header>
  );
};

export default Header;