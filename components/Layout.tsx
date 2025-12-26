

import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import BottomNavBar from './BottomNavBar';
import ScrollingBanner from './ScrollingBanner';

const Layout: React.FC = () => {
  return (
    <div className="flex flex-col h-screen bg-transparent">
      <ScrollingBanner />
      <Header />
      
      <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 md:p-8 pb-24 md:pb-8">
        <Outlet />
      </main>

      <div className="md:hidden">
        <BottomNavBar />
      </div>
    </div>
  );
};

export default Layout;