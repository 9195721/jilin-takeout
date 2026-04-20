import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../supabase/client';
import type { Database } from '../../supabase/types';

type Merchant = Database['public']['Tables']['merchants']['Row'] & {
  member_level: Database['public']['Tables']['member_levels']['Row'] | null;
};

const SkeletonMerchantCard = () => (
  <div className="bg-white rounded-xl overflow-hidden shadow-sm animate-pulse">
    <div className="flex">
      <div className="w-32 h-32 bg-gray-200 flex-shrink-0"></div>
      <div className="flex-1 p-4 space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="flex space-x-2">
          <div className="h-3 bg-gray-200 rounded w-12"></div>
          <div className="h-3 bg-gray-200 rounded w-12"></div>
        </div>
        <div className="h-3 bg-gray-200 rounded w-full"></div>
      </div>
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
        <div className="h-8 bg-gray-200 rounded w-32 mb-6 animate-pulse"></div>
        <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 bg-gray-200 rounded-full w-24 flex-shrink-0 animate-pulse"></div>
          ))}
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
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
        className="text-2xl font-bold text-gray-800 mb-6"
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
                : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
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
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
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
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <i className={`fas ${option.icon}`}></i>
            <span>{option.label}</span>
          </motion.button>
        ))}
      </motion.div>

      {/* 商家列表 */}
      <AnimatePresence mode="wait">
        <div className="space-y-4">
          {merchants.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="text-center py-16 text-gray-400 bg-white rounded-xl"
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
                    className="bg-white rounded-xl overflow-hidden shadow-sm transition-all group"
                  >
                    <div className="flex">
                      <div className="w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 flex-shrink-0 relative overflow-hidden">
                        {merchant.cover_image ? (
                          <img
                            src={merchant.cover_image}
                            alt={merchant.shop_name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <i className="fas fa-store text-3xl"></i>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 p-4 flex flex-col justify-between">
                        <div>
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-bold text-gray-800 text-lg group-hover:text-blue-500 transition-colors line-clamp-1">
                              {merchant.shop_name}
                            </h3>
                            {merchant.member_level && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="px-2 py-0.5 rounded-full text-xs text-white flex items-center space-x-0.5 flex-shrink-0 ml-2"
                                style={{ backgroundColor: merchant.member_level.color }}
                              >
                                <span>{merchant.member_level.icon}</span>
                              </motion.div>
                            )}
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-500 mb-2">
                            <span className="flex items-center text-orange-500 font-medium">
                              <i className="fas fa-star mr-1"></i>
                              {merchant.rating?.toFixed(1) || '0.0'}
                            </span>
                            <span className="flex items-center">
                              <i className="fas fa-shopping-bag text-blue-400 mr-1"></i>
                              {merchant.sales_count || 0}单
                            </span>
                            <span className="flex items-center text-gray-400">
                              <i className="fas fa-eye mr-1"></i>
                              {merchant.views || 0}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-gray-500 line-clamp-1 flex items-center">
                          <i className="fas fa-map-marker-alt mr-1.5 text-red-400 flex-shrink-0"></i>
                          <span className="truncate">{merchant.address}</span>
                        </p>
                      </div>
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
