import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../supabase/client';
import type { Database } from '../../supabase/types';

type Category = Database['public']['Tables']['categories']['Row'];
type Merchant = Database['public']['Tables']['merchants']['Row'] & {
  member_level: Database['public']['Tables']['member_levels']['Row'] | null;
};

const SkeletonCard = () => (
  <div className="bg-slate-800 rounded-2xl overflow-hidden animate-pulse">
    <div className="h-40 bg-slate-700"></div>
    <div className="p-4 space-y-3">
      <div className="h-4 bg-slate-700 rounded w-3/4"></div>
      <div className="flex space-x-2">
        <div className="h-3 bg-slate-700 rounded w-16"></div>
        <div className="h-3 bg-slate-700 rounded w-16"></div>
      </div>
      <div className="h-3 bg-slate-700 rounded w-full"></div>
    </div>
  </div>
);

interface MerchantCardProps {
  merchant: Merchant;
  index: number;
  isLiked: boolean;
  isFavorited: boolean;
  onLike: (id: number, e: React.MouseEvent) => void;
  onFavorite: (id: number, e: React.MouseEvent) => void;
}

const MerchantCard: React.FC<MerchantCardProps> = ({ merchant, index, isLiked, isFavorited, onLike, onFavorite }) => {
  const [glowPos, setGlowPos] = useState({ x: 0, y: 0 });
  const [glowVisible, setGlowVisible] = useState(false);
  const cardRef = React.useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setGlowPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    setGlowVisible(true);
  };

  const handleMouseLeave = () => {
    setGlowVisible(false);
  };

  return (
    <motion.div
      ref={cardRef}
      key={merchant.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ delay: index * 0.06 }}
      whileHover={{ y: -2 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative"
      style={{ overflow: 'hidden' }}
    >
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl transition-opacity duration-300"
        style={{
          opacity: glowVisible ? 1 : 0,
          background: `radial-gradient(200px circle at ${glowPos.x}px ${glowPos.y}px, rgba(100, 180, 255, 0.35), transparent 70%)`,
          zIndex: 2,
        }}
      />
      <Link to={`/merchants/${merchant.id}`} className="relative z-[1]">
        <div className={`bg-slate-800 rounded-2xl overflow-hidden shadow-lg transition-all group ${(merchant.is_open === false) ? 'opacity-60' : ''}`}>
          <div className="relative h-32 bg-slate-700">
            {merchant.cover_image ? (
              <img src={merchant.cover_image} alt={merchant.shop_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-500"><i className="fas fa-store text-4xl"></i></div>
            )}
            {merchant.member_level && (
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] text-white flex items-center space-x-1 shadow-lg" style={{ backgroundColor: merchant.member_level.color + 'cc' }}>
                <span>{merchant.member_level.icon}</span>
                <span className="font-medium">{merchant.member_level.name}</span>
              </motion.div>
            )}
            <div className="absolute top-2 right-2 flex space-x-1">
              <button onClick={(e) => onLike(merchant.id, e)} className={`w-6 h-6 rounded-full flex items-center justify-center transition-all border border-slate-500 ${isLiked ? 'bg-red-500/80 text-white' : 'bg-slate-600 text-white hover:bg-slate-500'}`}>
                <i className={`${isLiked ? 'fas' : 'far'} fa-heart text-[10px]`}></i>
              </button>
              <button onClick={(e) => onFavorite(merchant.id, e)} className={`w-6 h-6 rounded-full flex items-center justify-center transition-all border border-slate-500 ${isFavorited ? 'bg-yellow-500/80 text-white' : 'bg-slate-600 text-white hover:bg-slate-500'}`}>
                <i className={`${isFavorited ? 'fas' : 'far'} fa-star text-[10px]`}></i>
              </button>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-black/80 flex items-center justify-between px-2.5">
              <span className={`flex items-center space-x-1 text-[11px] text-white ${merchant.is_open === false ? 'opacity-70' : ''}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${merchant.is_open === false ? 'bg-gray-400' : 'bg-green-400 animate-pulse'}`}></span>
                <span className={merchant.is_open === false ? '' : 'neon-glow'}>{merchant.is_open === false ? '休息中' : '营业中'}</span>
              </span>
              {merchant.is_delivery && (
                <span className="flex items-center space-x-1 text-[11px] text-blue-300">
                  <i className="fas fa-truck text-[10px]"></i>
                  <span>送货上门</span>
                </span>
              )}
            </div>
          </div>
          <div className="p-5 bg-slate-700">
            <h3 className="font-bold text-white mb-1 text-sm group-hover:text-white/80 transition-colors truncate">{merchant.shop_name}</h3>
            <div className="flex items-center justify-between text-xs text-white/70 mb-1">
              <span className="flex items-center text-yellow-400 font-medium"><i className="fas fa-star mr-0.5"></i>{merchant.rating?.toFixed(1) || '0.0'}</span>
              <span className="flex items-center"><i className="fas fa-shopping-bag text-blue-400 mr-0.5"></i>{merchant.sales_count || 0}单</span>
            </div>
            <p className="text-[11px] text-white/50 line-clamp-1 flex items-center"><i className="fas fa-map-marker-alt mr-1 text-red-400"></i>{merchant.address}</p>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

const ConsumerHome: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredMerchants, setFeaturedMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [likedMerchants, setLikedMerchants] = useState<Set<number>>(new Set());
  const [favoritedMerchants, setFavoritedMerchants] = useState<Set<number>>(new Set());
  const [unreadCount, setUnreadCount] = useState(0);
  const [showCouponBanner, setShowCouponBanner] = useState(true);

  useEffect(() => {
    fetchData();
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUserId(session.user.id);
      fetchUserData(session.user.id);
    }
  };

  const fetchUserData = async (uid: string) => {
    const [{ data: likes }, { data: favorites }, { data: notifications }] = await Promise.all([
      supabase.from('likes').select('merchant_id').eq('user_id', uid),
      supabase.from('favorites').select('merchant_id').eq('user_id', uid),
      supabase.from('notifications').select('id').eq('user_id', uid).eq('is_read', false)
    ]);
    setLikedMerchants(new Set(likes?.map(l => l.merchant_id) || []));
    setFavoritedMerchants(new Set(favorites?.map(f => f.merchant_id) || []));
    setUnreadCount(notifications?.length || 0);
  };

  const fetchData = async () => {
    try {
      const [{ data: categoriesData }, { data: merchantsData }] = await Promise.all([
        supabase.from('categories').select('*').order('sort_order', { ascending: true }),
        supabase
          .from('merchants')
          .select(`*, member_level:member_level_id (id, name, icon, color)`)
          .eq('status', 'approved')
          .order('views', { ascending: false })
          .limit(6),
      ]);
      setCategories(categoriesData || []);
      setFeaturedMerchants(merchantsData || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleLike = async (merchantId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!userId) {
      window.location.hash = '#/login';
      return;
    }
    if (likedMerchants.has(merchantId)) {
      await supabase.from('likes').delete().eq('user_id', userId).eq('merchant_id', merchantId);
      setLikedMerchants(prev => { const next = new Set(prev); next.delete(merchantId); return next; });
    } else {
      await supabase.from('likes').insert({ user_id: userId, merchant_id: merchantId });
      setLikedMerchants(prev => new Set(prev).add(merchantId));
    }
  };

  const toggleFavorite = async (merchantId: number, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!userId) {
      window.location.hash = '#/login';
      return;
    }
    if (favoritedMerchants.has(merchantId)) {
      await supabase.from('favorites').delete().eq('user_id', userId).eq('merchant_id', merchantId);
      setFavoritedMerchants(prev => { const next = new Set(prev); next.delete(merchantId); return next; });
    } else {
      await supabase.from('favorites').insert({ user_id: userId, merchant_id: merchantId });
      setFavoritedMerchants(prev => new Set(prev).add(merchantId));
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchKeyword.trim()) {
      window.location.hash = `#/search?q=${encodeURIComponent(searchKeyword)}`;
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="h-32 bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl mb-6 animate-pulse"></div>
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-slate-800 rounded-2xl p-4 animate-pulse">
              <div className="w-12 h-12 bg-slate-700 rounded-full mx-auto mb-2"></div>
              <div className="h-3 bg-slate-700 rounded w-16 mx-auto"></div>
            </div>
          ))}
        </div>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => <SkeletonCard key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 text-[1.2em]">
      {/* 搜索框 - Liquid Glass */}
      <motion.form initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleSearch} className="mb-6">
        <div className="relative">
          <input type="text" value={searchKeyword} onChange={(e) => setSearchKeyword(e.target.value)} placeholder="搜索商家、菜品..."
            className="w-full px-4 py-3 pl-12 bg-white/15 backdrop-blur-[40px] backdrop-saturate-[180%] text-white placeholder-white/50 border border-white/30 rounded-2xl focus:outline-none focus:border-white/50 transition-all" />
          <i className="fas fa-search absolute left-4 top-1/2 transform -translate-y-1/2 text-white/50"></i>
          <button type="submit" className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white/20 text-white px-4 py-1.5 rounded-xl hover:bg-white/30 transition-colors text-sm border border-white/30">搜索</button>
        </div>
      </motion.form>

      {/* 欢迎横幅 - Liquid Glass */}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white/15 backdrop-blur-[40px] backdrop-saturate-[180%] rounded-2xl p-6 mb-6 text-white shadow-[0_16px_48px_rgba(0,0,0,0.2),0_0_0_1px_rgba(255,255,255,0.1),inset_0_1px_0_rgba(255,255,255,0.35)] relative overflow-hidden border border-white/30">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-10 -mt-10"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-10 -mb-10"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black tracking-tight mb-2">欢迎来到吉林外卖</h1>
            <p className="text-white/70 text-base">发现本地优质商家，享受便捷生活服务</p>
          </div>
          <Link to="/notifications" className="relative p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors border border-white/30">
            <i className="fas fa-bell text-xl"></i>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center font-bold">{unreadCount > 99 ? '99+' : unreadCount}</span>
            )}
          </Link>
        </div>
      </motion.div>

      {/* 优惠券横幅 - Liquid Glass */}
      {showCouponBanner && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-r from-orange-400/80 to-red-500/80 rounded-2xl p-4 mb-6 text-white relative border border-white/30">
          <button onClick={() => setShowCouponBanner(false)} className="absolute top-2 right-2 text-white/70 hover:text-white"><i className="fas fa-times"></i></button>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center border border-white/30"><i className="fas fa-ticket-alt text-2xl"></i></div>
              <div><p className="font-bold">新人专享优惠券</p><p className="text-sm opacity-80">满30减10，立即领取</p></div>
            </div>
            <Link to="/coupons" className="bg-white/20 text-white px-4 py-2 rounded-full font-medium text-sm hover:bg-white/30 transition-colors border border-white/30">去领取</Link>
          </div>
        </motion.div>
      )}

      {/* 服务分类 - Liquid Glass */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">服务分类</h2>
          <Link to="/categories" className="text-sm text-white/70 hover:text-white flex items-center">查看全部 <i className="fas fa-chevron-right text-xs ml-1"></i></Link>
        </div>
        <div className="grid grid-cols-4 gap-4">
          {categories.map((category, index) => (
            <motion.div key={category.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link to={`/merchants?category=${category.id}`} className="flex flex-col items-center bg-slate-700 rounded-2xl p-4 hover:bg-slate-600 transition-all duration-300 group">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400/80 to-purple-500/80 flex items-center justify-center mb-3 shadow-lg border border-white/30">
                  <span className="text-2xl text-white">{category.icon}</span>
                </div>
                <span className="text-sm text-white text-center font-semibold group-hover:text-white/80 transition-colors">{category.name}</span>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 热门商家 - Liquid Glass */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">热门商家</h2>
          <Link to="/merchants" className="text-sm text-white/70 hover:text-white flex items-center">查看全部 <i className="fas fa-chevron-right text-xs ml-1"></i></Link>
        </div>
        <AnimatePresence>
          {featuredMerchants.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-12 text-white/50 bg-white/10 backdrop-blur-[40px] backdrop-saturate-[180%] rounded-2xl border border-white/20 col-span-2">
              <i className="fas fa-store-slash text-5xl mb-3"></i>
              <p>暂无推荐商家</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {featuredMerchants.map((merchant, index) => (
                <MerchantCard
                  key={merchant.id}
                  merchant={merchant}
                  index={index}
                  isLiked={likedMerchants.has(merchant.id)}
                  isFavorited={favoritedMerchants.has(merchant.id)}
                  onLike={toggleLike}
                  onFavorite={toggleFavorite}
                />
              ))}
            </div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
};

export default ConsumerHome;
