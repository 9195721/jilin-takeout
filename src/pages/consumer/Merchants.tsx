import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../supabase/client';
import type { Database } from '../../supabase/types';

type Merchant = Database['public']['Tables']['merchants']['Row'] & {
  member_level: Database['public']['Tables']['member_levels']['Row'] | null;
};

const SkeletonMerchantCard = () => (
  <div className="bg-slate-800 rounded-2xl overflow-hidden animate-pulse">
    <div className="w-full h-36 bg-slate-700"></div>
    <div className="p-3 space-y-2">
      <div className="h-4 bg-slate-700 rounded w-3/4"></div>
      <div className="flex space-x-2">
        <div className="h-3 bg-slate-700 rounded w-12"></div>
        <div className="h-3 bg-slate-700 rounded w-16"></div>
      </div>
      <div className="h-3 bg-slate-700 rounded w-full"></div>
    </div>
  </div>
);

const ConsumerMerchants: React.FC = () => {
  const [searchParams] = useSearchParams();
  const categoryId = searchParams.get('category');
  
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [categories, setCategories] = useState<
    Database['public']['Tables']['categories']['Row'][]
  >([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(categoryId);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'views' | 'rating' | 'sales'>('views');

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (categories.length > 0) {
      fetchMerchants();
    }
  }, [categories, selectedCategory, sortBy]);

  const fetchCategories = async () => {
    try {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true });

      setCategories(data || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchMerchants = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('merchants')
        .select(`
          *,
          member_level:member_level_id (
            id,
            name,
            icon,
            color
          )
        `)
        .eq('status', 'approved');

      if (selectedCategory) {
        query = query.eq('category_id', parseInt(selectedCategory));
      }

      const { data } = await query.order(sortBy, { ascending: false });
      setMerchants(data || []);
    } catch (error) {
      console.error('Failed to fetch merchants:', error);
    } finally {
      setLoading(false);
    }
  };

  const sortOptions = [
    { key: 'views', label: '人气', icon: 'fa-fire' },
    { key: 'rating', label: '评分', icon: 'fa-star' },
    { key: 'sales', label: '销量', icon: 'fa-shopping-bag' },
  ];

  if (loading && merchants.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="h-8 bg-slate-700 rounded w-32 mb-6 animate-pulse"></div>
        <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 bg-slate-700 rounded-full w-24 flex-shrink-0 animate-pulse"></div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[...Array(6)].map((_, i) => (
            <SkeletonMerchantCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <motion.h1
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="text-2xl font-bold text-white mb-6"
      >
        商家列表
      </motion.h1>

      {/* 分类筛选 */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 overflow-x-auto scrollbar-thin"
      >
        <div className="flex space-x-2 pb-2">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-full whitespace-nowrap transition-all text-sm font-medium ${
              !selectedCategory
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-slate-700 text-white/70 hover:bg-slate-600'
            }`}
          >
            全部
          </motion.button>
          {categories.map((category) => (
            <motion.button
              key={category.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => setSelectedCategory(category.id.toString())}
              className={`px-4 py-2 rounded-full whitespace-nowrap transition-all text-sm font-medium flex items-center space-x-1 ${
                selectedCategory === category.id.toString()
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-slate-700 text-white/70 hover:bg-slate-600'
              }`}
            >
              <span>{category.icon}</span>
              <span>{category.name}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* 排序选项 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex space-x-2 mb-6"
      >
        {sortOptions.map((option) => (
          <motion.button
            key={option.key}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSortBy(option.key as any)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center space-x-1 ${
              sortBy === option.key
                ? 'bg-blue-100 text-blue-600'
                : 'bg-slate-700 text-white/60 hover:bg-slate-600'
            }`}
          >
            <i className={`fas ${option.icon}`}></i>
            <span>{option.label}</span>
          </motion.button>
        ))}
      </motion.div>

      {/* 商家列表 */}
      <AnimatePresence mode="wait">
        <div className="grid grid-cols-2 gap-3">
          {merchants.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="col-span-2 text-center py-16 text-white/50 bg-slate-800 rounded-2xl"
            >
              <i className="fas fa-store-slash text-6xl mb-4"></i>
              <p className="text-lg font-medium">暂无商家</p>
              <p className="text-sm mt-2">试试其他分类吧</p>
            </motion.div>
          ) : (
            merchants.map((merchant, index) => (
              <motion.div
                key={merchant.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ delay: index * 0.05 }}
                layout
              >
                <Link to={`/merchants/${merchant.id}`}>
                  <motion.div
                    whileHover={{ y: -2, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                    className={`bg-slate-800 rounded-2xl overflow-hidden shadow-lg transition-all group ${(merchant.is_open === false) ? 'opacity-60' : ''}`}
                  >
                    {/* 封面图（全宽纵向） */}
                    <div className="w-full h-36 bg-gradient-to-br from-slate-700 to-slate-800 relative overflow-hidden">
                      {merchant.cover_image ? (
                        <img
                          src={merchant.cover_image}
                          alt={merchant.shop_name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          loading="lazy"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-500">
                          <i className="fas fa-store text-3xl"></i>
                        </div>
                      )}
                      {/* 营业状态 + 送货上门角标 */}
                      <div className="absolute top-1.5 left-1.5 flex flex-col gap-0.5">
                        {(merchant.is_open === false) ? (
                          <span className="px-1.5 py-0.5 rounded-full text-[9px] text-white flex items-center space-x-0.5 bg-gray-600/90 shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-300"></span>
                            <span>休息中</span>
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded-full text-[9px] text-white flex items-center space-x-0.5 bg-green-600/90 shadow-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                            <span>营业中</span>
                          </span>
                        )}
                        {merchant.is_delivery && (
                          <span className="px-1.5 py-0.5 rounded-full text-[9px] text-white flex items-center space-x-0.5 bg-blue-600/90 shadow-sm">
                            <i className="fas fa-truck text-[8px]"></i>
                            <span>送货上门</span>
                          </span>
                        )}
                      </div>
                    </div>
                    {/* 底部信息区 */}
                    <div className="p-3">
                      <div className="flex items-start justify-between mb-1.5">
                        <h3 className="font-bold text-white text-sm group-hover:text-white/80 transition-colors line-clamp-1 flex-1 mr-1">
                          {merchant.shop_name}
                        </h3>
                        {merchant.member_level && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            className="px-1.5 py-0.5 rounded-full text-[10px] text-white flex items-center flex-shrink-0"
                            style={{ backgroundColor: merchant.member_level.color }}
                          >
                            <span>{merchant.member_level.icon}</span>
                          </motion.div>
                        )}
                      </div>
                      <div className="flex items-center space-x-3 text-xs text-white/70 mb-1.5">
                        <span className="flex items-center text-orange-500 font-medium">
                          <i className="fas fa-star mr-0.5"></i>
                          {merchant.rating?.toFixed(1) || '0.0'}
                        </span>
                        <span className="flex items-center">
                          <i className="fas fa-shopping-bag text-blue-400 mr-0.5"></i>
                          {merchant.sales_count || 0}单
                        </span>
                      </div>
                      <p className="text-xs text-white/50 line-clamp-1 flex items-center">
                        <i className="fas fa-map-marker-alt mr-1 text-red-400 flex-shrink-0"></i>
                        <span className="truncate">{merchant.address}</span>
                      </p>
                    </div>
                  </motion.div>
                </Link>
              </motion.div>
            ))
          )}
        </div>
      </AnimatePresence>
    </div>
  );
};

export default ConsumerMerchants;
