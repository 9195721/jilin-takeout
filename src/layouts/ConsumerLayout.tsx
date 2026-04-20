import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../supabase/client';

const ConsumerLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 检查登录状态
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);
      setLoading(false);
    };

    checkAuth();

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    navigate('/');
  };

  const navItems = [
    { path: '/', label: '首页', icon: 'fa-home' },
    { path: '/categories', label: '分类', icon: 'fa-th-large' },
    { path: '/merchants', label: '商家', icon: 'fa-store' },
    { path: '/search', label: '搜索', icon: 'fa-search' },
  ];

  if (loading) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* 顶部导航栏 - Liquid Glass */}
      <header className="bg-white/10 backdrop-blur-[40px] backdrop-saturate-[180%] sticky top-0 z-50 border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2 group">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-400/80 to-purple-500/80 rounded-lg flex items-center justify-center shadow-lg border border-white/30">
              <i className="fas fa-utensils text-white text-sm"></i>
            </div>
            <span className="text-lg font-bold text-white group-hover:text-white/80 transition-colors">吉林外卖</span>
          </Link>
          <div className="flex items-center space-x-3">
            {isLoggedIn ? (
              <>
                <button
                  onClick={handleLogout}
                  className="text-sm text-white/70 hover:text-red-400 transition-colors font-medium flex items-center"
                >
                  <i className="fas fa-sign-out-alt mr-1"></i>
                  退出
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm text-white/70 hover:text-white transition-colors font-medium">
                  登录
                </Link>
                <Link to="/register" className="text-sm bg-white/20 text-white px-4 py-1.5 rounded-full hover:bg-white/30 transition-all border border-white/30">
                  注册
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 主内容区 */}
      <main className="flex-1 pb-24">
        <Outlet />
      </main>

      {/* 底部TabBar - Liquid Glass */}
      <nav className="fixed bottom-4 left-4 right-4 bg-white/15 backdrop-blur-[40px] backdrop-saturate-[180%] rounded-3xl border border-white/30 shadow-[0_16px_48px_rgba(0,0,0,0.2),0_0_0_1px_rgba(255,255,255,0.1),inset_0_1px_0_rgba(255,255,255,0.35)] z-50 safe-area-bottom">
        <div className="max-w-7xl mx-auto flex justify-around items-center h-16">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
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
                  <div className={`relative p-1.5 rounded-xl transition-all duration-300 ${isActive ? 'bg-white/25' : ''}`}>
                    <i className={`fas ${item.icon} text-xl transition-colors duration-300 ${isActive ? 'text-white' : 'text-white/60 group-hover:text-white/80'}`}></i>
                  </div>
                  <span className={`text-[10px] mt-1 font-medium transition-colors duration-300 ${isActive ? 'text-white' : 'text-white/60 group-hover:text-white/80'}`}>
                    {item.label}
                  </span>
                </motion.div>
                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute -top-0.5 w-12 h-1 bg-white rounded-b-full"
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

export default ConsumerLayout;
