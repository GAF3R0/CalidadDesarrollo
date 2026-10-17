import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import '../styles/Layout.css';

const Layout = ({ user, onLogout }) => {
  const [sidebarVisible, setSidebarVisible] = useState(true);

  const toggleSidebar = () => {
    setSidebarVisible(!sidebarVisible);
  };

  return (
    <div className="layout">
      <Header user={user} onLogout={onLogout} />
      <div className="layout-body">
        {sidebarVisible && (
          <Sidebar user={user} onLogout={onLogout} onToggle={toggleSidebar} />
        )}
        <main className={`layout-content ${!sidebarVisible ? 'expanded' : ''}`}>
          {/* Botón para mostrar sidebar cuando está oculto */}
          {!sidebarVisible && (
            <button 
              className="show-sidebar-btn"
              onClick={toggleSidebar}
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