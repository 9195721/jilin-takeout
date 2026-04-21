import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../../supabase/client';
import type { Database } from '../../supabase/types';

type Merchant = Database['public']['Tables']['merchants']['Row'] & {
  member_level: Database['public']['Tables']['member_levels']['Row'] | null;
};

const BusinessToggle = ({ label, activeLabel, inactiveLabel, active, disabled, activeColor, icon, onToggle }: {
  label: string;
  activeLabel: string;
  inactiveLabel: string;
  active: boolean;
  disabled: boolean;
  activeColor: string;
  icon: string;
  onToggle: () => void;
}) => {
  const gradientMap: Record<string, string> = {
    green: 'from-green-400 to-green-500',
    blue: 'from-blue-400 to-blue-500',
  };
  const gradient = gradientMap[activeColor] || gradientMap.green;

  return (
    <div className="flex items-center justify-between bg-white/10 backdrop-blur-md rounded-2xl px-4 py-3 border border-white/20">
      <div className="flex items-center space-x-2">
        <i className={`fas ${icon} text-white/80 text-sm`}></i>
        <span className="text-white text-sm font-medium">{label}</span>
      </div>
      <div
        onClick={disabled ? undefined : onToggle}
        className={`relative w-[140px] h-10 rounded-full cursor-pointer overflow-hidden transition-opacity duration-200 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {/* Background tracks */}
        <div className={`absolute inset-0 flex transition-all duration-300`}>
          <div className={`flex-1 flex items-center justify-center text-[11px] font-medium transition-colors duration-300 ${active ? `bg-gradient-to-r ${gradient} text-white` : 'bg-white/20 text-white/40'}`}>
            {activeLabel}
          </div>
          <div className={`w-px bg-white/30`}></div>
          <div className={`flex-1 flex items-center justify-center text-[11px] font-medium transition-colors duration-300 ${!active ? `bg-gradient-to-r ${gradient} text-white` : 'bg-white/20 text-white/40'}`}>
            {inactiveLabel}
          </div>
        </div>
        {/* Slider knob */}
        <div
          className={`absolute top-1 w-8 h-8 rounded-full bg-white shadow-lg transition-all duration-300 ease-in-out ${active ? 'left-1' : 'left-[calc(100%-36px)]'}`}
          style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}
        ></div>
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color, delay }: { title: string; value: string | number; icon: string; color: string; delay: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    whileHover={{ y: -4, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
    className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100"
  >
    <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center mb-4 shadow-sm`}>
      <i className={`fas ${icon} text-white text-xl`}></i>
    </div>
    <div className="text-3xl font-bold text-gray-800 mb-1">{value}</div>
    <div className="text-sm text-gray-500 font-medium">{title}</div>
  </motion.div>
);

const MerchantDashboard: React.FC = () => {
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    fetchMerchantInfo();
  }, []);

  const fetchMerchantInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('merchants')
        .select(`
          *,
          member_level:member_level_id (
            id,
            name,
            icon,
            color,
            privileges
          )
        `)
        .eq('user_id', user.id)
        .maybeSingle();

      setMerchant(data);
    } catch (error) {
      console.error('Failed to fetch merchant info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (field: 'is_open' | 'is_delivery') => {
    if (!merchant || toggling) return;
    const currentValue = merchant[field] ?? true;
    const newValue = !currentValue;

    // Optimistic update
    setMerchant({ ...merchant, [field]: newValue });
    setToggling(field);

    try {
      const { error } = await supabase
        .from('merchants')
        .update({ [field]: newValue })
        .eq('id', merchant.id);

      if (error) {
        console.error(`Failed to toggle ${field}:`, error);
        setMerchant({ ...merchant, [field]: currentValue });
      }
    } catch (error) {
      console.error(`Failed to toggle ${field}:`, error);
      setMerchant({ ...merchant, [field]: currentValue });
    } finally {
      setToggling(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-200 border-t-green-500"></div>
          <p className="mt-4 text-gray-500 text-sm">加载中...</p>
        </div>
      </div>
    );
  }

  if (!merchant) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 text-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-3xl p-12 shadow-sm border border-gray-100 max-w-md mx-auto"
        >
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="fas fa-store-slash text-4xl text-gray-300"></i>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">暂无店铺信息</h2>
          <p className="text-gray-500 mb-8 text-sm">请先完善店铺资料并提交审核，审核通过后即可开始接单</p>
          <Link
            to="/merchant/shop-info"
            className="inline-flex items-center justify-center bg-green-500 text-white px-8 py-3 rounded-xl hover:bg-green-600 transition-all shadow-lg shadow-green-500/30 font-medium"
          >
            <i className="fas fa-edit mr-2"></i>
            去完善资料
          </Link>
        </motion.div>
      </div>
    );
  }

  const statusConfig = {
    pending: { label: '待审核', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: 'fa-clock' },
    approved: { label: '已通过', color: 'bg-green-100 text-green-700 border-green-200', icon: 'fa-check-circle' },
    rejected: { label: '已拒绝', color: 'bg-red-100 text-red-700 border-red-200', icon: 'fa-times-circle' },
  };

  const status = statusConfig[merchant.status as keyof typeof statusConfig];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* 店铺状态卡片 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full -mr-20 -mt-20"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white opacity-5 rounded-full -ml-10 -mb-10"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-3">
              <h2 className="text-2xl font-bold">{merchant.shop_name}</h2>
              <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1.5 border ${status.color.replace('text-', 'border-').replace('bg-', 'bg-opacity-20 ')}`}>
                <i className={`fas ${status.icon}`}></i>
                <span>{status.label}</span>
              </span>
            </div>
            <p className="text-green-100 text-sm flex items-center">
              <i className="fas fa-map-marker-alt mr-2"></i>
              {merchant.address}
            </p>
          </div>
          
          {merchant.member_level && (
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 min-w-[200px]"
            >
              <div className="flex items-center space-x-3">
                <div className="text-4xl">{merchant.member_level.icon}</div>
                <div>
                  <div className="font-bold text-lg">{merchant.member_level.name}</div>
                  <div className="text-xs text-green-100 mt-0.5">{merchant.member_level.privileges}</div>
                </div>
              </div>
              <div className="mt-3 bg-white/20 rounded-full h-1.5 overflow-hidden">
                <div 
                  className="bg-white h-full rounded-full transition-all duration-1000"
                  style={{ width: `${Math.min(((merchant.views || 0) / (merchant.member_level.min_views || 1)) * 100, 100)}%` }}
                ></div>
              </div>
              <div className="text-xs text-green-100 mt-1.5 flex justify-between">
                <span>浏览量进度</span>
                <span>{merchant.views || 0} / {merchant.member_level.min_views}</span>
              </div>
            </motion.div>
          )}
        </div>

        {/* 营业状态开关 */}
        <div className="relative z-10 mt-5 grid grid-cols-1 md:grid-cols-2 gap-3">
          <BusinessToggle
            label="营业状态"
            activeLabel="营业中"
            inactiveLabel="休业"
            active={merchant.is_open ?? true}
            disabled={merchant.status !== 'approved' || toggling === 'is_open'}
            activeColor="green"
            icon="fa-store"
            onToggle={() => handleToggle('is_open')}
          />
          <BusinessToggle
            label="配送方式"
            activeLabel="送货上门"
            inactiveLabel="到店自取"
            active={merchant.is_delivery ?? true}
            disabled={toggling === 'is_delivery'}
            activeColor="blue"
            icon="fa-truck"
            onToggle={() => handleToggle('is_delivery')}
          />
        </div>
      </motion.div>

      {/* 数据统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="总浏览量"
          value={merchant.views || 0} 
          icon="fa-eye" 
          color="bg-blue-500" 
          delay={0.1} 
        />
        <StatCard 
          title="订单总数" 
          value={merchant.sales_count || 0} 
          icon="fa-shopping-bag" 
          color="bg-green-500" 
          delay={0.2} 
        />
        <StatCard 
          title="平均评分" 
          value={merchant.rating?.toFixed(1) || '0.0'} 
          icon="fa-star" 
          color="bg-yellow-500" 
          delay={0.3} 
        />
        <StatCard 
          title="电话咨询" 
          value={Math.floor((merchant.views || 0) * 0.08)} 
          icon="fa-phone-alt" 
          color="bg-purple-500" 
          delay={0.4} 
        />
      </div>

      {/* 快捷操作 */}
      <section>
        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
          <i className="fas fa-bolt text-yellow-500 mr-2"></i>
          快捷操作
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { to: '/merchant/shop-info', icon: 'fa-store', label: '店铺设置', color: 'text-blue-500', bg: 'bg-blue-50' },
            { to: '/merchant/menu-manage', icon: 'fa-utensils', label: '菜品管理', color: 'text-green-500', bg: 'bg-green-50' },
            { to: '/merchant/stats', icon: 'fa-chart-line', label: '数据分析', color: 'text-purple-500', bg: 'bg-purple-50' },
            { to: '/', icon: 'fa-home', label: '返回首页', color: 'text-gray-500', bg: 'bg-gray-50' },
          ].map((item, index) => (
            <Link key={item.to} to={item.to}>
              <motion.div
                whileHover={{ y: -4, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 text-center group cursor-pointer"
              >
                <div className={`w-14 h-14 ${item.bg} rounded-xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                  <i className={`fas ${item.icon} ${item.color} text-2xl`}></i>
                </div>
                <div className="font-semibold text-gray-700 group-hover:text-gray-900">{item.label}</div>
              </motion.div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
};

export default MerchantDashboard;
