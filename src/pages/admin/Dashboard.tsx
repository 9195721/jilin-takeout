import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { supabase } from '../../supabase/client';

interface LogEntry {
  id: number;
  action: string;
  target_type: string | null;
  target_id: string | null;
  created_at: string;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalMerchants: 0,
    pendingMerchants: 0,
    approvedMerchants: 0,
    hiddenMerchants: 0,
    totalCategories: 0,
    totalUsers: 0,
    featuredCount: 0,
    topCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentLogs, setRecentLogs] = useState<LogEntry[]>([]);

  useEffect(() => {
    fetchStats();
    fetchRecentLogs();
  }, []);

  const fetchStats = async () => {
    try {
      const { data: merchantsData } = await supabase.from('merchants').select('id, status, is_visible, is_featured, is_top, category_id');
      const merchants = merchantsData || [];
      setStats({
        totalMerchants: merchants.length,
        pendingMerchants: merchants.filter((m) => m.status === 'pending').length,
        approvedMerchants: merchants.filter((m) => m.status === 'approved').length,
        hiddenMerchants: merchants.filter((m) => m.is_visible === false).length,
        totalCategories: (await supabase.from('categories').select('id')).data?.length || 0,
        totalUsers: (await supabase.from('profiles').select('id')).data?.length || 0,
        featuredCount: merchants.filter((m) => m.is_featured === true).length,
        topCount: merchants.filter((m) => m.is_top === true).length,
      });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecentLogs = async () => {
    try {
      const { data } = await supabase
        .from('admin_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(8);
      setRecentLogs((data || []) as LogEntry[]);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  // 商家分类分布数据
  const categoryDistData = [
    { name: '已通过', value: stats.approvedMerchants, color: '#10B981' },
    { name: '待审核', value: stats.pendingMerchants, color: '#F59E0B' },
    { name: '已下架', value: stats.hiddenMerchants, color: '#EF4444' },
  ].filter(d => d.value > 0);

  // 运营状态数据
  const opsData = [
    { name: '推荐商家', value: stats.featuredCount },
    { name: '置顶商家', value: stats.topCount },
  ];

  const actionLabels: Record<string, string> = {
    create: '创建', update: '更新', delete: '删除',
    audit: '审核', toggle: '切换', ban: '封禁', unban: '解封',
  };

  const statCards = [
    { title: '总商家数', value: stats.totalMerchants, icon: 'fa-store', color: 'from-blue-500 to-blue-600', link: '/admin/merchants' },
    { title: '待审核', value: stats.pendingMerchants, icon: 'fa-clock', color: 'from-yellow-500 to-yellow-600', link: '/admin/merchant-audit', highlight: stats.pendingMerchants > 0 },
    { title: '已通过', value: stats.approvedMerchants, icon: 'fa-check-circle', color: 'from-green-500 to-green-600', link: '/admin/merchants' },
    { title: '推荐商家', value: stats.featuredCount, icon: 'fa-star', color: 'from-amber-500 to-amber-600', link: '/admin/merchants' },
    { title: '用户总数', value: stats.totalUsers, icon: 'fa-users', color: 'from-pink-500 to-pink-600', link: '/admin/users' },
    { title: '分类数量', value: stats.totalCategories, icon: 'fa-tags', color: 'from-purple-500 to-purple-600', link: '/admin/category-manage' },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* 标题 */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-bold text-gray-800">数据概览</h1>
        <p className="text-sm text-gray-500 mt-1">吉林外卖平台运营数据总览</p>
      </motion.div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
        {statCards.map((stat, index) => (
          <motion.div key={stat.title} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.06 }}>
            <Link to={stat.link} className="block bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all relative overflow-hidden group">
              {stat.highlight && (
                <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse"></div>
              )}
              <div className={`w-9 h-9 rounded-lg bg-gradient-to-r ${stat.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                <i className={`fas ${stat.icon} text-white text-sm`}></i>
              </div>
              <div className="text-2xl font-bold text-gray-800">{stat.value}</div>
              <div className="text-xs text-gray-500 mt-0.5">{stat.title}</div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* 图表区域 + 最近日志 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* 左侧：图表 */}
        <div className="lg:col-span-2 space-y-4 md:space-y-6">
          {/* 商家分布饼图 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <i className="fas fa-chart-pie text-purple-500 text-sm"></i>
              商家状态分布
            </h3>
            {categoryDistData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={categoryDistData} cx="50%" cy="50%" innerRadius={50} outerRadius={85}
                    dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {categoryDistData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend verticalAlign="bottom" iconType="circle" formatter={(v) => <span className="text-xs text-gray-600">{v}</span>} />
                  <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[200px] text-gray-400 text-sm">暂无数据</div>
            )}
          </div>

          {/* 运营状态柱状图 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <i className="fas fa-chart-bar text-purple-500 text-sm"></i>
              运营标记统计
            </h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={opsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="value" fill="#7C3AED" radius={[6, 6, 0, 0]} barSize={60} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 右侧：快捷操作 + 最近日志 */}
        <div className="space-y-4 md:space-y-6">
          {/* 快捷操作 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <h3 className="font-semibold text-gray-800 mb-4">快捷操作</h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { to: '/admin/merchant-audit', icon: 'fa-user-check', label: '商家审核', color: 'text-blue-500' },
                { to: '/admin/users', icon: 'fa-users', label: '会员管理', color: 'text-green-500' },
                { to: '/admin/banners', icon: 'fa-images', label: '轮播图', color: 'text-amber-500' },
                { to: '/admin/announcements', icon: 'fa-bullhorn', label: '发布公告', color: 'text-purple-500' },
              ].map((item) => (
                <Link key={item.to} to={item.to}>
                  <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                    className="bg-gray-50 rounded-lg p-3 text-center hover:bg-purple-50 transition-colors">
                    <i className={`fas ${item.icon} text-lg ${item.color}`}></i>
                    <div className="text-xs font-medium text-gray-700 mt-1.5">{item.label}</div>
                  </motion.div>
                </Link>
              ))}
            </div>
          </div>

          {/* 最近操作日志 */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800">最近操作</h3>
              <Link to="/admin/operation-log" className="text-xs text-purple-600 hover:text-purple-700">查看全部</Link>
            </div>
            <div className="space-y-2.5">
              {recentLogs.length === 0 ? (
                <div className="text-center py-6 text-gray-400 text-sm">暂无操作记录</div>
              ) : (
                recentLogs.slice(0, 6).map((log) => (
                  <div key={log.id} className="flex items-start gap-2.5 text-xs">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5 flex-shrink-0"></span>
                    <div className="flex-1 min-w-0">
                      <span className="text-gray-700 font-medium">
                        {actionLabels[log.action] || log.action}
                        {log.target_type && (
                          <span className="text-gray-400 ml-1">
                            ({log.target_type}{log.target_id ? `#${log.target_id}` : ''})
                          </span>
                        )}
                      </span>
                      <div className="text-gray-400 mt-0.5">
                        {new Date(log.created_at).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
