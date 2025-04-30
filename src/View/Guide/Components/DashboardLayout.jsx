import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import './DashboardLayout.css';

const DashboardLayout = () => {
  return (
    <div className="dashboard-layout">
      <Sidebar />
      <main className="dashboard-main">
        <div className="dashboard-content">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout; 