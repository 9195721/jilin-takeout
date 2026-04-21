import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../supabase/client';
import type { Database } from '../../supabase/types';

type Merchant = Database['public']['Tables']['merchants']['Row'] & {
  member_level: Database['public']['Tables']['member_levels']['Row'] | null;
};

type Menu = Database['public']['Tables']['menus']['Row'] & {
  category: Database['public']['Tables']['categories']['Row'] | null;
};

type Review = Database['public']['Tables']['reviews']['Row'] & {
  user: { username: string | null; avatar_url: string | null } | null;
};

type Category = Database['public']['Tables']['categories']['Row'];

const ConsumerMerchantDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [menus, setMenus] = useState<Menu[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewContent, setReviewContent] = useState('');
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    checkAuth();
    if (id) fetchData(parseInt(id));
    loadCategories();
  }, [id]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUserId(session?.user?.id || null);
  };

  const loadCategories = async () => {
    const { data } = await supabase.from('categories').select('*').order('sort_order', { ascending: true });
    setCategories(data || []);
  };

  const getCategoryName = (categoryId: number | null | undefined): string | undefined => {
    if (!categoryId) return undefined;
    return categories.find(c => c.id === categoryId)?.name;
  };

  const getCategoryIcon = (categoryId: number | null | undefined): string | undefined => {
    if (!categoryId) return undefined;
    return categories.find(c => c.id === categoryId)?.icon;
  };

  const fetchData = async (merchantId: number) => {
    try {
      const { data: merchantData } = await supabase
        .from('merchants')
        .select(`*, member_level:member_level_id (id, name, icon, color)`)
        .eq('id', merchantId)
        .maybeSingle();

      if (merchantData) {
        setMerchant(merchantData);
        await supabase.from('merchants').update({ views: (merchantData.views || 0) + 1 }).eq('id', merchantId);

        const [{ data: menusData }, { data: reviewsData }, { data: likesData }, { data: favoritesData }] = await Promise.all([
          supabase.from('menus').select(`*, category:category_id (id, name, icon)`).eq('merchant_id', merchantId).eq('is_available', true).order('sort_order', { ascending: true }),
          supabase.from('reviews').select('*').eq('merchant_id', merchantId).order('created_at', { ascending: false }),
          supabase.from('likes').select('*').eq('merchant_id', merchantId),
          supabase.from('favorites').select('*').eq('merchant_id', merchantId),
        ]);

        setMenus(menusData || []);
        setReviews(reviewsData || []);
        setLikeCount(likesData?.length || 0);

        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setIsLiked(likesData?.some(l => l.user_id === session.user.id) || false);
          setIsFavorited(favoritesData?.some(f => f.user_id === session.user.id) || false);
        }
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleLike = async () => {
    if (!userId) { navigate('/login'); return; }
    if (!id) return;
    const merchantId = parseInt(id);
    if (isLiked) {
      await supabase.from('likes').delete().eq('merchant_id', merchantId).eq('user_id', userId);
      setLikeCount(prev => prev - 1);
    } else {
      await supabase.from('likes').insert({ merchant_id: merchantId, user_id: userId });
      setLikeCount(prev => prev + 1);
    }
    setIsLiked(!isLiked);
  };

  const toggleFavorite = async () => {
    if (!userId) { navigate('/login'); return; }
    if (!id) return;
    const merchantId = parseInt(id);
    if (isFavorited) {
      await supabase.from('favorites').delete().eq('merchant_id', merchantId).eq('user_id', userId);
    } else {
      await supabase.from('favorites').insert({ merchant_id: merchantId, user_id: userId });
    }
    setIsFavorited(!isFavorited);
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) { navigate('/login'); return; }
    if (!id || !reviewContent.trim()) return;

    setSubmitting(true);
    try {
      const { error } = await supabase.from('reviews').insert({
        merchant_id: parseInt(id), user_id: userId,
        rating: reviewRating, content: reviewContent.trim()
      });
      if (error) { alert('提交失败: ' + error.message); }
      else {
        setReviewContent(''); setReviewRating(5); setShowReviewForm(false);
        await fetchData(parseInt(id));
      }
    } catch (err) { alert('提交出错'); }
    finally { setSubmitting(false); }
  };

  const renderStars = (rating: number, interactive = false, onRate?: (r: number) => void) => (
    <div className="flex space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <motion.button key={star} whileHover={interactive ? { scale: 1.2 } : {}}
          whileTap={interactive ? { scale: 0.9 } : {}}
          onClick={() => interactive && onRate?.(star)} disabled={!interactive}
          className={`text-lg ${interactive ? 'cursor-pointer' : ''} ${star <= rating ? 'text-yellow-400' : 'text-gray-300'}`}
        ><i className="fas fa-star" /></motion.button>
      ))}
    </div>
  );

  if (loading) return (<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" /></div>);

  if (!merchant) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center text-white/50">
        <i className="fas fa-store-slash text-6xl mb-4" /><p className="text-lg">商家不存在</p>
        <Link to="/merchants" className="text-blue-400 mt-4 inline-block">返回商家列表</Link>
      </div>
    </div>
  );

  const categoryName = getCategoryName(merchant.category_id);
  const categoryIcon = getCategoryIcon(merchant.category_id);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 pb-24">
      {/* 封面图 */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="relative h-48 rounded-2xl overflow-hidden mb-6 bg-slate-700"
      >
        {merchant.cover_image ? (
          <img src={merchant.cover_image} alt={merchant.shop_name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-500"><i className="fas fa-store text-6xl" /></div>
        )}
        {merchant.member_level && (
          <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-sm text-white flex items-center space-x-1 shadow-lg"
            style={{ backgroundColor: merchant.member_level.color }}
          ><span>{merchant.member_level.icon}</span><span>{merchant.member_level.name}</span></div>
        )}

        {/* 营业状态角标 */}
        <div className="absolute top-4 left-4 flex flex-col gap-1.5">
          {(merchant.is_open === false) ? (
            <span className="px-2.5 py-1 rounded-full text-xs text-white flex items-center space-x-1 bg-gray-600 shadow-md">
              <span className="w-2 h-2 rounded-full bg-gray-300"></span><span className="font-medium">休息中</span>
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full text-xs text-white flex items-center space-x-1 bg-green-600 shadow-md">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span><span className="font-medium">营业中</span>
            </span>
          )}
          {merchant.is_delivery && (
            <span className="px-2.5 py-1 rounded-full text-xs text-white flex items-center space-x-1 bg-blue-600 shadow-md">
              <i className="fas fa-truck text-[10px]"></i><span className="font-medium">送货上门</span>
            </span>
          )}
        </div>
      </motion.div>

      {/* 店铺信息卡片 */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-slate-800 rounded-2xl p-6 shadow-lg mb-6"
      >
        {/* 店名 + 标签行 */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center flex-wrap gap-2 mb-1">
              <h1 className="text-2xl font-bold text-white">{merchant.shop_name}</h1>
              {/* 分类标签 */}
              {categoryName && (
                <span className="px-2.5 py-0.5 rounded-full text-xs text-white/90 bg-blue-500/70 border border-blue-400/30">
                  {categoryIcon} {categoryName}
                </span>
              )}
              {/* 区域标签 */}
              {merchant.district && (
                <span className="px-2.5 py-0.5 rounded-full text-xs text-white/90 bg-emerald-500/70 border border-emerald-400/30">
                  📍 {merchant.district}
                </span>
              )}
            </div>
          </div>
          <div className="flex space-x-2 ml-3 shrink-0">
            <motion.button whileTap={{ scale: 0.9 }} onClick={toggleLike}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-full transition-colors ${isLiked ? 'bg-red-500/20 text-red-400' : 'bg-slate-600 text-white'}`}
            >
              <i className={`${isLiked ? 'fas' : 'far'} fa-heart`} /><span className="text-sm">{likeCount}</span>
            </motion.button>
            <motion.button whileTap={{ scale: 0.9 }} onClick={toggleFavorite}
              className={`p-2 rounded-full transition-colors ${isFavorited ? 'bg-yellow-500/20 text-yellow-400' : 'bg-slate-600 text-white'}`}
            >
              <i className={`${isFavorited ? 'fas' : 'far'} fa-star`} />
            </motion.button>
          </div>
        </div>

        <div className="flex items-center space-x-6 text-sm text-white/70 mb-4">
          <span className="flex items-center"><i className="fas fa-star text-yellow-400 mr-1" />{merchant.rating?.toFixed(1) || '0.0'}</span>
          <span className="flex items-center"><i className="fas fa-shopping-bag text-blue-400 mr-1" />{merchant.sales_count || 0}单</span>
          <span className="flex items-center"><i className="fas fa-eye text-white/50 mr-1" />{merchant.views || 0}浏览</span>
        </div>

        <p className="text-white/70 mb-4"><i className="fas fa-map-marker-alt mr-2 text-blue-400" />{merchant.address}</p>
        {merchant.description && <p className="text-white/70 mb-4">{merchant.description}</p>}

        <div className="flex space-x-3">
          <button onClick={() => window.location.href = `tel:${merchant.phone}`}
            className="flex-1 bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center space-x-2"
          ><i className="fas fa-phone" /><span>电话咨询</span></button>
          <button onClick={() => window.open(`https://www.baidu.com/s?wd=${encodeURIComponent(merchant.address)}`, '_blank')}
            className="flex-1 bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center space-x-2"
          ><i className="fas fa-map-marked-alt" /><span>地图导航</span></button>
        </div>
      </motion.div>

      {/* 菜品/服务 */}
      <section className="mb-6">
        <h2 className="text-xl font-bold text-white mb-4">菜品/服务</h2>
        {menus.length === 0 ? (
          <div className="text-center py-12 text-white/50 bg-slate-800 rounded-2xl">
            <i className="fas fa-utensils text-6xl mb-4" /><p>暂无菜品</p>
          </div>
        ) : (
          <div className="space-y-4">
            {menus.map((menu, index) => (
              <motion.div key={menu.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }} className="bg-slate-800 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="flex">
                  <div className="w-24 h-24 bg-slate-700 flex-shrink-0">
                    {menu.image ? <img src={menu.image} alt={menu.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-slate-500"><i className="fas fa-utensils text-2xl" /></div>}
                  </div>
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-white">{menu.name}</h3>
                      {menu.category && <span className="text-xs bg-slate-600 text-white/70 px-2 py-1 rounded-full">{menu.category.icon} {menu.category.name}</span>}
                    </div>
                    {menu.description && <p className="text-sm text-white/50 mb-2 line-clamp-2">{menu.description}</p>}
                    <span className="text-lg font-bold text-red-400">¥{menu.price.toFixed(2)}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* 评价区 */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">评价 ({reviews.length})</h2>
          <motion.button whileTap={{ scale: 0.95 }}
            onClick={() => userId ? setShowReviewForm(!showReviewForm) : navigate('/login')}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600 transition-colors"
          ><i className="fas fa-pen mr-1" />写评价</motion.button>
        </div>

        <AnimatePresence>
          {showReviewForm && (
            <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              onSubmit={submitReview} className="bg-slate-800 rounded-2xl p-4 shadow-lg mb-4"
            >
              <div className="mb-3"><label className="text-sm text-white/80 font-medium mb-1 block">评分</label>{renderStars(reviewRating, true, setReviewRating)}</div>
              <div className="mb-3">
                <label className="text-sm text-white/80 font-medium mb-1 block">评价内容</label>
                <textarea value={reviewContent} onChange={(e) => setReviewContent(e.target.value)}
                  placeholder="分享您的体验..." rows={3} required
                  className="w-full px-3 py-2 border border-slate-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-white bg-slate-700 placeholder-white/30"
                />
              </div>
              <div className="flex space-x-2">
                <button type="button" onClick={() => setShowReviewForm(false)}
                  className="flex-1 py-2 border border-slate-500 rounded-lg text-white/70 hover:bg-slate-600 transition-colors"
                >取消</button>
                <button type="submit" disabled={submitting || !reviewContent.trim()}
                  className="flex-1 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >{submitting ? '提交中...' : '提交'}</button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="space-y-4">
          {reviews.length === 0 ? (
            <div className="text-center py-12 text-white/50 bg-slate-800 rounded-2xl">
              <i className="fas fa-comment text-6xl mb-4" /><p>暂无评价</p>
            </div>
          ) : reviews.map((review, index) => (
            <motion.div key={review.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }} className="bg-slate-800 rounded-2xl p-4 shadow-lg border border-slate-600"
            >
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-500 rounded-full flex items-center justify-center text-white font-medium flex-shrink-0">
                  <i className="fas fa-user" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">匿名用户</p>
                  <p className="text-xs text-white/50">{review.created_at ? new Date(review.created_at).toLocaleDateString() : ''}</p>
                </div>
              </div>
              <div className="mb-2">{renderStars(review.rating || 0)}</div>
              {review.content && <p className="text-white/70 text-sm leading-relaxed">{review.content}</p>}
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default ConsumerMerchantDetail;
