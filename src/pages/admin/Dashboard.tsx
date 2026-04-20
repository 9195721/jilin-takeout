import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../../supabase/client';

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalMerchants: 0,
    pendingMerchants: 0,
    approvedMerchants: 0,
    totalCategories: 0,
    totalUsers: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // 获取商家统计
      const { data: merchantsData } = await supabase.from('merchants').select('id, status');
      const totalMerchants = merchantsData?.length || 0;
      const pendingMerchants = merchantsData?.filter((m) => m.status === 'pending').length || 0;
      const approvedMerchants = merchantsData?.filter((m) => m.status === 'approved').length || 0;

      // 获取分类数量
      const { data: categoriesData } = await supabase.from('categories').select('id');
      const totalCategories = categoriesData?.length || 0;

      // 获取用户数量
      const { data: profilesData } = await supabase.from('profiles').select('id');
      const totalUsers = profilesData?.length || 0;

      setStats({
        totalMerchants,
        pendingMerchants,
        approvedMerchants,
        totalCategories,
        totalUsers,
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: '总商家数',
      value: stats.totalMerchants,
      icon: 'fa-store',
      color: 'from-blue-500 to-blue-600',
      link: '/admin/merchant-audit',
    },
    {
      title: '待审核',
      value: stats.pendingMerchants,
      icon: 'fa-clock',
      color: 'from-yellow-500 to-yellow-600',
      link: '/admin/merchant-audit',
      highlight: stats.pendingMerchants > 0,
    },
    {
      title: '已通过',
      value: stats.approvedMerchants,
      icon: 'fa-check-circle',
      color: 'from-green-500 to-green-600',
      link: '/admin/merchant-audit',
    },
    {
      title: '分类数量',
      value: stats.totalCategories,
      icon: 'fa-tags',
      color: 'from-purple-500 to-purple-600',
      link: '/admin/category-manage',
    },
    {
      title: '用户总数',
      value: stats.totalUsers,
      icon: 'fa-users',
      color: 'from-pink-500 to-pink-600',
      link: '#',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">管理概览</h1>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Link to={stat.link}>
              <div className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                {stat.highlight && (
                  <div className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                )}
                <div
                  className={`w-12 h-12 rounded-lg bg-gradient-to-r ${stat.color} flex items-center justify-center mb-4`}
                >
                  <i className={`fas ${stat.icon} text-white text-xl`}></i>
                </div>
                <div className="text-3xl font-bold text-gray-800 mb-1">{stat.value}</div>
                <div className="text-sm text-gray-500">{stat.title}</div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* 快捷操作 */}
      <section>
        <h2 className="text-lg font-semibold text-gray-800 mb-4">快捷操作</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link to="/admin/merchant-audit">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow text-center"
            >
              <i className="fas fa-user-check text-3xl text-blue-500 mb-3"></i>
              <div className="font-semibold text-gray-800">商家审核</div>
            </motion.div>
          </Link>
          <Link to="/admin/category-manage">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow text-center"
            >
              <i className="fas fa-tags text-3xl text-green-500 mb-3"></i>
              <div className="font-semibold text-gray-800">分类管理</div>
            </motion.div>
          </Link>
          <Link to="/admin/member-levels">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow text-center"
            >
              <i className="fas fa-crown text-3xl text-yellow-500 mb-3"></i>
              <div className="font-semibold text-gray-800">会员等级</div>
            </motion.div>
          </Link>
          <Link to="/admin/dashboard">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow text-center"
            >
              <i className="fas fa-sync-alt text-3xl text-purple-500 mb-3"></i>
              <div className="font-semibold text-gray-800">刷新数据</div>
            </motion.div>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default AdminDashboard;
