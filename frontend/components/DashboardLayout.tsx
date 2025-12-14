
import React from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="h-full bg-black text-white font-sans w-full flex">
      <Sidebar />
      <div className="flex-1 flex flex-col h-full ml-64 overflow-hidden">
        <TopBar />
        <main className="flex-1 p-8 overflow-y-auto custom-scrollbar">
          {location.pathname !== '/deploy' && (
            <button
              onClick={() => navigate('/deploy')}
              className="flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors mb-6 group"
            >
              <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
              Home
            </button>
          )}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
