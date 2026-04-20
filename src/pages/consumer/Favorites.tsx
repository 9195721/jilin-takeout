import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../supabase/client';

type Category = {
  id: number;
  name: string;
  icon: string | null;
};

interface FavoriteItem {
  id: number;
  merchant_id: number;
  created_at: string;
  merchant: {
    id: number;
    shop_name: string;
    cover_image: string | null;
    rating: number | null;
    sales_count: number | null;
    address: string;
    category_id: number | null;
    category?: Category | null;
  };
}

const Favorites: React.FC = () => {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [filteredFavorites, setFilteredFavorites] = useState<FavoriteItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [isBatchMode, setIsBatchMode] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
        fetchData(session.user.id);
      } else {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (selectedCategory === 'all') {
      setFilteredFavorites(favorites);
    } else {
      setFilteredFavorites(favorites.filter(f => f.merchant.category_id === selectedCategory));
    }
  }, [selectedCategory, favorites]);

  const fetchData = async (uid: string) => {
    const [{ data: favData }, { data: catData }] = await Promise.all([
      supabase
        .from('favorites')
        .select('*, merchant:merchants(*, category:category_id(*))')
        .eq('user_id', uid)
        .order('created_at', { ascending: false }),
      supabase.from('categories').select('*')
    ]);
    setFavorites(favData || []);
    setFilteredFavorites(favData || []);
    setCategories(catData || []);
    setLoading(false);
  };

  const removeFavorite = async (favoriteId: number) => {
    await supabase.from('favorites').delete().eq('id', favoriteId);
    setFavorites(prev => prev.filter(f => f.id !== favoriteId));
    setSelectedItems(prev => {
      const next = new Set(prev);
      next.delete(favoriteId);
      return next;
    });
  };

  const toggleSelection = (id: number) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const batchRemove = async () => {
    if (selectedItems.size === 0) return;
    await supabase.from('favorites').delete().in('id', Array.from(selectedItems));
    setFavorites(prev => prev.filter(f => !selectedItems.has(f.id)));
    setSelectedItems(new Set());
    setIsBatchMode(false);
  };

  const selectAll = () => {
    if (selectedItems.size === filteredFavorites.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(filteredFavorites.map(f => f.id)));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 border-4 border-blue-200 border-t-blue-500 rounded-full"
        />
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 200 }}
        >
          <i className="fas fa-heart text-gray-300 text-6xl mb-4"></i>
        </motion.div>
        <p className="text-gray-500 mb-4">请先登录查看收藏</p>
        <Link to="/login" className="bg-blue-500 text-white px-6 py-2 rounded-full hover:bg-blue-600 transition-colors">
          去登录
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-800">我的收藏</h1>
            {favorites.length > 0 && (
              <button
                onClick={() => {
                  setIsBatchMode(!isBatchMode);
                  setSelectedItems(new Set());
                }}
                className="text-sm text-blue-500 hover:text-blue-600 font-medium"
              >
                {isBatchMode ? '完成' : '批量管理'}
              </button>
            )}
          </div>

          {categories.length > 0 && (
            <div className="flex space-x-2 mt-4 overflow-x-auto pb-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                  selectedCategory === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
                }`}
              >
                全部
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${
                    selectedCategory === cat.id ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {cat.icon} {cat.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {isBatchMode && (
        <motion.div
          initial={{ y: -50 }}
          animate={{ y: 0 }}
          className="bg-white border-b px-4 py-3 flex items-center justify-between"
        >
          <button onClick={selectAll} className="text-sm text-gray-600">
            {selectedItems.size === filteredFavorites.length ? '取消全选' : '全选'}
            <span className="text-gray-400 ml-1">({selectedItems.size})</span>
          </button>
          {selectedItems.size > 0 && (
            <button
              onClick={batchRemove}
              className="text-sm text-red-500 font-medium"
            >
              删除选中
            </button>
          )}
        </motion.div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-4">
        {filteredFavorites.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <i className="fas fa-heart-broken text-gray-200 text-6xl mb-4"></i>
            </motion.div>
            <p className="text-gray-400">暂无收藏商家</p>
            <Link to="/merchants" className="mt-4 inline-block text-blue-500 hover:text-blue-600">
              去发现商家 <i className="fas fa-arrow-right ml-1"></i>
            </Link>
          </motion.div>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {filteredFavorites.map((item) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  layout
                  className="bg-white rounded-xl shadow-sm overflow-hidden"
                >
                  <div className="flex">
                    {isBatchMode && (
                      <button
                        onClick={() => toggleSelection(item.id)}
                        className="w-12 flex items-center justify-center bg-gray-50"
                      >
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                          selectedItems.has(item.id) ? 'bg-blue-500 border-blue-500' : 'border-gray-300'
                        }`}>
                          {selectedItems.has(item.id) && <i className="fas fa-check text-white text-xs"></i>}
                        </div>
                      </button>
                    )}
                    <Link to={`/merchants/${item.merchant_id}`} className="flex-1">
                      <div className="h-32 bg-gray-200 relative">
                        {item.merchant.cover_image ? (
                          <img src={item.merchant.cover_image} alt={item.merchant.shop_name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-200">
                            <i className="fas fa-store text-blue-300 text-3xl"></i>
                          </div>
                        )}
                      </div>
                    </Link>
                  </div>
                  <div className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-800">{item.merchant.shop_name}</h3>
                        <div className="flex items-center mt-1 text-sm text-gray-500">
                          <i className="fas fa-star text-yellow-400 mr-1"></i>
                          <span>{item.merchant.rating || 4.5}</span>
                          <span className="mx-2">|</span>
                          <span>月售 {item.merchant.sales_count || 0}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{item.merchant.address}</p>
                      </div>
                      <div className="flex flex-col space-y-2">
                        <button
                          onClick={() => navigate(`/merchants/${item.merchant_id}`)}
                          className="px-3 py-1.5 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600 transition-colors"
                        >
                          去下单
                        </button>
                        {!isBatchMode && (
                          <button
                            onClick={() => removeFavorite(item.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"
                          >
                            <i className="fas fa-heart"></i>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default Favorites;
