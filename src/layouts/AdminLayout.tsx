import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../supabase/client';

const AdminLayout: React.FC = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navGroups = [
    {
      label: '运营概览',
      items: [
        { path: '/admin/dashboard', label: '数据概览', icon: 'fa-chart-line' },
        { path: '/admin/operation-log', label: '操作日志', icon: 'fa-history' },
      ],
    },
    {
      label: '商家管理',
      items: [
        { path: '/admin/merchants', label: '商家管理', icon: 'fa-store' },
        { path: '/admin/merchant-audit', label: '入驻审核', icon: 'fa-user-check' },
      ],
    },
    {
      label: '用户管理',
      items: [
        { path: '/admin/users', label: '会员管理', icon: 'fa-users' },
        { path: '/admin/member-levels', label: '会员等级', icon: 'fa-crown' },
      ],
    },
    {
      label: '内容管理',
      items: [
        { path: '/admin/category-manage', label: '分类管理', icon: 'fa-tags' },
        { path: '/admin/banners', label: '轮播图', icon: 'fa-images' },
        { path: '/admin/announcements', label: '公告管理', icon: 'fa-bullhorn' },
      ],
    },
    {
      label: '系统',
      items: [
        { path: '/admin/settings', label: '系统设置', icon: 'fa-cog' },
      ],
    },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.hash = '#/login';
  };

  const isActive = (path: string) => location.pathname === path;

  const Sidebar = () => (
    <div className="flex flex-col h-full bg-gradient-to-b from-purple-900 to-purple-800 text-white">
      {/* Logo */}
      <div className="p-5 border-b border-purple-700">
        <Link to="/admin/dashboard" className="flex items-center space-x-3" onClick={() => setSidebarOpen(false)}>
          <div className="w-9 h-9 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
            <i className="fas fa-shield-alt text-white"></i>
          </div>
          <div>
            <div className="font-bold text-base">管理后台</div>
            <div className="text-xs text-purple-300">吉林外卖平台</div>
          </div>
        </Link>
      </div>

      {/* 导航菜单 */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-5">
        {navGroups.map((group) => (
          <div key={group.label}>
            <div className="text-xs text-purple-400 font-medium px-3 mb-2 uppercase tracking-wide">{group.label}</div>
            <div className="space-y-1">
              {group.items.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center space-x-3 px-3 py-2.5 rounded-xl transition-all text-sm font-medium ${
                    isActive(item.path)
                      ? 'bg-white text-purple-900 shadow-lg'
                      : 'text-purple-200 hover:bg-white hover:bg-opacity-10 hover:text-white'
                  }`}
                >
                  <i className={`fas ${item.icon} w-5 text-center`}></i>
                  <span>{item.label}</span>
                  {isActive(item.path) && (
                    <motion.div layoutId="activeNav" className="ml-auto w-1.5 h-1.5 bg-purple-500 rounded-full" />
                  )}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* 底部退出 */}
      <div className="p-4 border-t border-purple-700">
        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-purple-200 hover:bg-white hover:bg-opacity-10 hover:text-white transition-all text-sm"
        >
          <i className="fas fa-sign-out-alt w-5 text-center"></i>
          <span>退出登录</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* 桌面端侧边栏 */}
      <div className="hidden md:flex md:w-60 md:flex-shrink-0 md:flex-col">
        <div className="fixed h-full w-60">
          <Sidebar />
        </div>
      </div>

      {/* 移动端侧边栏抽屉 */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
              onClick={() => setSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: -240 }}
              animate={{ x: 0 }}
              exit={{ x: -240 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed left-0 top-0 h-full w-60 z-50 md:hidden"
            >
              <Sidebar />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col min-w-0 md:ml-60">
        {/* 顶部栏 */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm">
          <div className="px-4 py-3 flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
            >
              <i className="fas fa-bars text-lg"></i>
            </button>
            <div className="hidden md:block text-sm text-gray-500">
              {navGroups.flatMap(g => g.items).find(i => i.path === location.pathname)?.label || '管理后台'}
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <i className="fas fa-user-shield text-purple-600 text-sm"></i>
              </div>
              <span className="text-sm font-medium text-gray-700 hidden sm:block">管理员</span>
            </div>
          </div>
        </header>

        {/* 页面内容 */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
