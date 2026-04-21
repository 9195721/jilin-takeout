import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../supabase/client';
import type { Database } from '../../supabase/types';

type Merchant = Database['public']['Tables']['merchants']['Row'] & {
  member_level: Database['public']['Tables']['member_levels']['Row'] | null;
};

// 吉林市区域列表
const DISTRICTS = ['船营', '昌邑', '丰满', '高新'];

const SkeletonSearchResult = () => (
  <div className="bg-slate-800 rounded-xl overflow-hidden animate-pulse">
    <div className="flex">
      <div className="w-24 h-24 bg-slate-700 flex-shrink-0"></div>
      <div className="flex-1 p-4 space-y-3">
        <div className="h-4 bg-slate-700 rounded w-3/4"></div>
        <div className="flex space-x-2">
          <div className="h-3 bg-slate-700 rounded w-12"></div>
          <div className="h-3 bg-slate-700 rounded w-12"></div>
        </div>
        <div className="h-3 bg-slate-700 rounded w-full"></div>
      </div>
    </div>
  </div>
);

const ConsumerSearch: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [results, setResults] = useState<Merchant[]>([]);
  const [categories, setCategories] = useState<Database['public']['Tables']['categories']['Row'][]>([]);
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(!!initialQuery);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [filterDistrict, setFilterDistrict] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem('recentSearches');
    if (saved) setRecentSearches(JSON.parse(saved));
    supabase.from('categories').select('*').order('sort_order', { ascending: true }).then(({ data }) => setCategories(data || []));

    if (initialQuery) handleSearch(initialQuery);
  }, [initialQuery]);

  const saveRecentSearch = (term: string) => {
    const updated = [term, ...recentSearches.filter(s => s !== term)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  };

  const handleSearch = async (query?: string) => {
    const term = query || searchTerm;
    if (!term.trim()) return;

    setSearching(true);
    setHasSearched(true);
    saveRecentSearch(term);
    setSearchParams({ q: term });

    try {
      let q = supabase
        .from('merchants')
        .select(`*, member_level:member_level_id (id, name, icon, color)`)
        .eq('status', 'approved')
        .or(`shop_name.ilike.%${term}%,description.ilike.%${term}%`)
        .order('views', { ascending: false })
        .limit(20);

      if (filterCategory) q = q.eq('category_id', parseInt(filterCategory));
      if (filterDistrict) q = q.eq('district', filterDistrict);

      const { data } = await q;
      setResults(data || []);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('recentSearches');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 min-h-screen">
      {/* 搜索框 - Liquid Glass 风格 */}
      <form onSubmit={handleSubmit} className="mb-4 sticky top-0 z-10 bg-[#0F172A] pt-2 pb-3">
        <div className="relative">
          <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="搜索商家名称、服务描述..." autoFocus
            className="w-full px-4 py-3 pl-12 bg-white/15 text-white placeholder-white/50 border border-white/25 rounded-xl focus:outline-none focus:border-white/50 focus:bg-white/20 transition-all"
          />
          <i className="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-white/40"></i>
          {searchTerm && (
            <button type="button" onClick={() => setSearchTerm('')}
              className="absolute right-14 top-1/2 transform -translate-y-1/2 text-white/40 hover:text-white/70"
            ><i className="fas fa-times-circle"></i></button>
          )}
          <button type="submit" disabled={searching || !searchTerm.trim()}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-500 text-white px-4 py-1.5 rounded-lg hover:bg-blue-600 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors text-sm font-medium"
          >搜索</button>
        </div>
      </form>

      <AnimatePresence mode="wait">
        {/* 最近搜索 */}
        {!hasSearched && recentSearches.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white/70">最近搜索</h3>
              <button onClick={clearRecentSearches} className="text-xs text-white/40 hover:text-red-400 transition-colors">
                <i className="fas fa-trash-alt mr-1"></i>清空
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {recentSearches.map((term, index) => (
                <motion.button key={term} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }} onClick={() => { setSearchTerm(term); handleSearch(term); }}
                  className="px-3 py-1.5 bg-white/10 rounded-full text-sm text-white/70 hover:bg-white/20 hover:text-white transition-colors border border-white/10 flex items-center"
                >
                  <i className="fas fa-history mr-1.5 text-white/30 text-xs"></i>{term}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}

        {/* 搜索结果 */}
        {hasSearched && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* 筛选条件行 */}
            <div className="flex flex-wrap items-center gap-2 mb-4 pb-3 border-b border-white/10">
              <span className="text-xs text-white/40 mr-1">筛选：</span>

              {/* 分类筛选 */}
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => setFilterCategory(null)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  !filterCategory ? 'bg-blue-500 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'
                }`}
              >全部分类</motion.button>
              {categories.map((c) => (
                <motion.button key={c.id} whileTap={{ scale: 0.95 }} onClick={() => setFilterCategory(c.id.toString())}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    filterCategory === c.id.toString() ? 'bg-blue-500 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'
                  }`}
                >{c.icon}{c.name}</motion.button>
              ))}

              <span className="w-px h-4 bg-white/10 mx-1"></span>

              {/* 区域筛选 */}
              <motion.button whileTap={{ scale: 0.95 }} onClick={() => setFilterDistrict(null)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  !filterDistrict ? 'bg-emerald-500/80 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'
                }`}
              >全部区域</motion.button>
              {DISTRICTS.map((d) => (
                <motion.button key={d} whileTap={{ scale: 0.95 }} onClick={() => setFilterDistrict(d)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    filterDistrict === d ? 'bg-emerald-500/80 text-white' : 'bg-white/10 text-white/60 hover:bg-white/20'
                  }`}
                >{d}</motion.button>
              ))}
            </div>

            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">
                搜索结果 <span className="text-sm font-normal text-white/50">({results.length})</span>
              </h2>
            </div>

            {searching ? (
              <div className="space-y-4">{[...Array(3)].map((_, i) => <SkeletonSearchResult key={i} />)}</div>
            ) : results.length === 0 ? (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                className="text-center py-16 text-white/40 bg-slate-800 rounded-2xl"
              >
                <i className="fas fa-search text-6xl mb-4 text-white/10"></i>
                <p className="text-lg font-medium text-white/60">未找到相关商家</p>
                <p className="text-sm mt-2 text-white/40">试试其他关键词或调整筛选条件</p>
              </motion.div>
            ) : (
              <div className="space-y-3">
                {results.map((merchant, index) => (
                  <motion.div key={merchant.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}>
                    <Link to={`/merchants/${merchant.id}`}>
                      <motion.div whileHover={{ y: -2, boxShadow: '0 10px 25px -5px rgba(0,0,0,0.3)' }}
                        className="bg-slate-800 rounded-xl overflow-hidden shadow-lg transition-all group"
                      >
                        <div className="flex">
                          <div className="w-24 h-24 bg-slate-700 flex-shrink-0 relative overflow-hidden">
                            {merchant.cover_image ? (
                              <img src={merchant.cover_image} alt={merchant.shop_name}
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" loading="lazy" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-500"><i className="fas fa-store text-2xl"></i></div>
                            )}
                            {merchant.district && (
                              <span className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded-full text-[8px] text-white/70 bg-black/50">{merchant.district}</span>
                            )}
                          </div>
                          <div className="flex-1 p-4 flex flex-col justify-between">
                            <div>
                              <div className="flex items-start justify-between mb-1">
                                <h3 className="font-bold text-white group-hover:text-blue-400 transition-colors line-clamp-1">{merchant.shop_name}</h3>
                                {merchant.member_level && (
                                  <div className="px-1.5 py-0.5 rounded text-[10px] text-white flex items-center flex-shrink-0 ml-2"
                                    style={{ backgroundColor: merchant.member_level.color }}>{merchant.member_level.icon}</div>
                                )}
                              </div>
                              <div className="flex items-center space-x-3 text-xs text-white/50">
                                <span className="flex items-center text-orange-400 font-medium">
                                  <i className="fas fa-star mr-1 text-[10px]"></i>{merchant.rating?.toFixed(1) || '0.0'}
                                </span>
                                <span className="flex items-center"><i className="fas fa-shopping-bag text-blue-400 mr-1 text-[10px]"></i>{merchant.sales_count || 0}单</span>
                              </div>
                            </div>
                            <p className="text-xs text-white/40 line-clamp-1 flex items-center mt-1">
                              <i className="fas fa-map-marker-alt mr-1 text-red-400/60 text-[10px]"></i>
                              <span className="truncate">{merchant.address}</span>
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* 初始空状态 */}
        {!hasSearched && recentSearches.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 text-white/30">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-search text-3xl text-white/20"></i>
            </div>
            <p className="text-white/50">输入商家名称或服务开始搜索</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ConsumerSearch;
