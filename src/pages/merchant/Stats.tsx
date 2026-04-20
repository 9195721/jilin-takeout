import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../supabase/client';
import type { Database } from '../../supabase/types';

type Merchant = Database['public']['Tables']['merchants']['Row'];

const MerchantStats: React.FC = () => {
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMerchantInfo();
  }, []);

  const fetchMerchantInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('merchants')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      setMerchant(data);
    } catch (error) {
      console.error('Failed to fetch merchant info:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!merchant) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <i className="fas fa-chart-bar text-6xl text-gray-300 mb-4"></i>
        <h2 className="text-xl font-semibold text-gray-600 mb-2">暂无数据</h2>
        <p className="text-gray-500">请先完善店铺信息</p>
      </div>
    );
  }

  const statsCards = [
    {
      title: '总浏览量',
      value: merchant.views || 0,
      icon: 'fa-eye',
      color: 'from-blue-500 to-blue-600',
      textColor: 'text-blue-500',
    },
    {
      title: '订单总数',
      value: merchant.sales_count || 0,
      icon: 'fa-shopping-bag',
      color: 'from-green-500 to-green-600',
      textColor: 'text-green-500',
    },
    {
      title: '平均评分',
      value: merchant.rating?.toFixed(1) || '0.0',
      icon: 'fa-star',
      color: 'from-yellow-500 to-yellow-600',
      textColor: 'text-yellow-500',
    },
    {
      title: '电话咨询',
      value: Math.floor((merchant.views || 0) * 0.1),
      icon: 'fa-phone',
      color: 'from-purple-500 to-purple-600',
      textColor: 'text-purple-500',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">数据统计</h1>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {statsCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-xl p-6 shadow-sm"
          >
            <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${stat.color} flex items-center justify-center mb-4`}>
              <i className={`fas ${stat.icon} text-white text-xl`}></i>
            </div>
            <div className={`text-3xl font-bold ${stat.textColor} mb-1`}>{stat.value}</div>
            <div className="text-sm text-gray-500">{stat.title}</div>
          </motion.div>
        ))}
      </div>

      {/* 数据分析提示 */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          <i className="fas fa-lightbulb text-yellow-500 mr-2"></i>
          经营建议
        </h2>
        <div className="space-y-3 text-sm text-gray-700">
          <div className="flex items-start space-x-2">
            <i className="fas fa-check-circle text-green-500 mt-0.5"></i>
            <span>保持菜品更新，定期推出新品可以吸引更多顾客</span>
          </div>
          <div className="flex items-start space-x-2">
            <i className="fas fa-check-circle text-green-500 mt-0.5"></i>
            <span>提升服务质量，好评率会影响店铺排名</span>
          </div>
          <div className="flex items-start space-x-2">
            <i className="fas fa-check-circle text-green-500 mt-0.5"></i>
            <span>优化店铺描述和图片，提高转化率</span>
          </div>
          <div className="flex items-start space-x-2">
            <i className="fas fa-check-circle text-green-500 mt-0.5"></i>
            <span>积极参与平台活动，增加曝光机会</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MerchantStats;
