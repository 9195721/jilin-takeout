import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../supabase/client';

const AdminLayout: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { path: '/admin/dashboard', label: '概览', icon: 'fa-chart-line' },
    { path: '/admin/merchant-audit', label: '商家审核', icon: 'fa-user-check' },
    { path: '/admin/category-manage', label: '分类管理', icon: 'fa-tags' },
    { path: '/admin/member-levels', label: '会员等级', icon: 'fa-crown' },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.hash = '#/login';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 顶部导航栏 */}
      <header className="bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/admin/dashboard" className="flex items-center space-x-2">
            <i className="fas fa-shield-alt text-xl"></i>
            <span className="text-lg font-bold">管理平台</span>
          </Link>
          <button
            onClick={handleLogout}
            className="text-sm bg-white bg-opacity-20 px-3 py-1 rounded-full hover:bg-opacity-30 transition-colors"
          >
            退出登录
          </button>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="flex-1 pb-16">
        <Outlet />
      </main>

      {/* 底部TabBar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
        <div className="max-w-7xl mx-auto flex justify-around">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center py-2 px-4 transition-colors ${
                  isActive ? 'text-purple-500' : 'text-gray-500 hover:text-purple-400'
                }`}
              >
                <motion.div
                  whileTap={{ scale: 0.9 }}
                  className="flex flex-col items-center"
                >
                  <i className={`fas ${item.icon} text-xl mb-1`}></i>
                  <span className="text-xs">{item.label}</span>
                </motion.div>
                {isActive && (
                  <motion.div
                    layoutId="activeAdminTab"
                    className="w-8 h-1 bg-purple-500 rounded-full mt-1"
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

export default AdminLayout;
