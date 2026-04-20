import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../supabase/client';

const MerchantLayout: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { path: '/merchant/dashboard', label: '经营概览', icon: 'fa-chart-pie' },
    { path: '/merchant/shop-info', label: '店铺设置', icon: 'fa-store' },
    { path: '/merchant/menu-manage', label: '菜品管理', icon: 'fa-utensils' },
    { path: '/merchant/stats', label: '数据中心', icon: 'fa-chart-line' },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.hash = '#/login';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 顶部导航栏 */}
      <header className="bg-white shadow-sm sticky top-0 z-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/merchant/dashboard" className="flex items-center space-x-2 group">
            <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
              <i className="fas fa-store text-white text-sm"></i>
            </div>
            <span className="text-lg font-bold text-gray-800 group-hover:text-green-600 transition-colors">商家工作台</span>
          </Link>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-red-500 transition-colors font-medium flex items-center px-3 py-1.5 rounded-lg hover:bg-red-50"
          >
            <i className="fas fa-sign-out-alt mr-1.5"></i>
            退出登录
          </button>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="flex-1 pb-20">
        <Outlet />
      </main>

      {/* 底部TabBar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50 safe-area-bottom">
        <div className="max-w-7xl mx-auto flex justify-around items-center h-16">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className="flex-1 flex flex-col items-center justify-center h-full relative group"
              >
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className="flex flex-col items-center relative"
                >
                  <div className={`relative p-1.5 rounded-xl transition-all duration-300 ${isActive ? 'bg-green-50' : ''}`}>
                    <i className={`fas ${item.icon} text-xl transition-colors duration-300 ${isActive ? 'text-green-500' : 'text-gray-400 group-hover:text-gray-600'}`}></i>
                  </div>
                  <span className={`text-[10px] mt-1 font-medium transition-colors duration-300 ${isActive ? 'text-green-500' : 'text-gray-400 group-hover:text-gray-600'}`}>
                    {item.label}
                  </span>
                </motion.div>
                {isActive && (
                  <motion.div
                    layoutId="activeMerchantTabIndicator"
                    className="absolute -top-0.5 w-12 h-1 bg-green-500 rounded-b-full"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

export default MerchantLayout;
