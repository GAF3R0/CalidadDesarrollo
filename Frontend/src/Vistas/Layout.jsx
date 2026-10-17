import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';
import '../styles/Layout.css';

const Layout = () => {
  const { user, logout, refreshUser } = useAuth();
  const [sidebarVisible, setSidebarVisible] = useState(true);

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  return (
    <div className="layout">
      <Header user={user} onLogout={logout} />
      <div className="layout-body">
        {sidebarVisible && (
          <Sidebar user={user} onProfileUpdate={refreshUser} onToggle={toggleSidebar} />
        )}
        <main className={`layout-content ${!sidebarVisible ? 'expanded' : ''}`}>
          {!sidebarVisible && (
            <button 
              className="show-sidebar-btn"
              onClick={toggleSidebar}
              title="Mostrar menú lateral"
            >
              ☰
            </button>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;