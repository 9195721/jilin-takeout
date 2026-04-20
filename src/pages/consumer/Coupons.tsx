import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../supabase/client';
import type { Database } from '../../supabase/types';

type Coupon = Database['public']['Tables']['coupons']['Row'];
type UserCoupon = Database['public']['Tables']['user_coupons']['Row'];

interface CouponWithStatus extends Coupon {
  user_coupon_id?: number;
  is_used?: boolean;
  is_claimed?: boolean;
}

const Coupons: React.FC = () => {
  const [availableCoupons, setAvailableCoupons] = useState<CouponWithStatus[]>([]);
  const [myCoupons, setMyCoupons] = useState<CouponWithStatus[]>([]);
  const [expiredCoupons, setExpiredCoupons] = useState<CouponWithStatus[]>([]);
  const [activeTab, setActiveTab] = useState<'available' | 'mine' | 'expired'>('available');
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedCoupon, setSelectedCoupon] = useState<CouponWithStatus | null>(null);
  const [showUseModal, setShowUseModal] = useState(false);
  const [claimingId, setClaimingId] = useState<number | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchCoupons();
    }
  }, [userId, activeTab]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUserId(session?.user?.id || null);
  };

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const now = new Date().toISOString();
      const { data: allCoupons } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });

      const validCoupons = allCoupons?.filter(c => c.valid_until && c.valid_until > now) || [];
      const expired = allCoupons?.filter(c => c.valid_until && c.valid_until <= now) || [];

      if (userId) {
        const { data: userCoupons } = await supabase
          .from('user_coupons')
          .select('*, coupon:coupon_id(*)')
          .eq('user_id', userId);

        const claimedIds = new Set(userCoupons?.map(uc => uc.coupon_id) || []);
        
        const available = validCoupons.filter(c => !claimedIds.has(c.id)).map(c => ({
          ...c,
          is_claimed: false
        }));
        
        const mine = userCoupons?.map(uc => ({
          ...uc.coupon,
          user_coupon_id: uc.id,
          is_used: uc.is_used,
          is_claimed: true
        })).filter(c => c.valid_until && c.valid_until > now) || [];

        const myExpired = userCoupons?.map(uc => ({
          ...uc.coupon,
          user_coupon_id: uc.id,
          is_used: uc.is_used,
          is_claimed: true
        })).filter(c => c.valid_until && c.valid_until <= now) || [];

        setAvailableCoupons(available);
        setMyCoupons(mine);
        setExpiredCoupons(myExpired);
      } else {
        setAvailableCoupons(validCoupons.map(c => ({ ...c, is_claimed: false })));
      }
    } catch (error) {
      console.error('Failed to fetch coupons:', error);
    } finally {
      setLoading(false);
    }
  };

  const claimCoupon = async (couponId: number) => {
    if (!userId) {
      alert('请先登录');
      return;
    }
    setClaimingId(couponId);
    try {
      const { error } = await supabase
        .from('user_coupons')
        .insert({ coupon_id: couponId, user_id: userId });
      
      if (error) throw error;
      setTimeout(() => {
        fetchCoupons();
        setClaimingId(null);
      }, 800);
    } catch (error) {
      console.error('Failed to claim coupon:', error);
      alert('领取失败');
      setClaimingId(null);
    }
  };

  const useCoupon = async (userCouponId: number) => {
    try {
      await supabase
        .from('user_coupons')
        .update({ is_used: true, used_at: new Date().toISOString() })
        .eq('id', userCouponId);
      
      setShowUseModal(false);
      setSelectedCoupon(null);
      fetchCoupons();
    } catch (error) {
      console.error('Failed to use coupon:', error);
    }
  };

  const formatDate = (date: string | null) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('zh-CN');
  };

  const CouponCard: React.FC<{ coupon: CouponWithStatus; showClaim?: boolean; isExpired?: boolean }> = ({ 
    coupon, showClaim, isExpired 
  }) => (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => !showClaim && setSelectedCoupon(coupon)}
      className={`bg-white rounded-xl shadow-sm border overflow-hidden cursor-pointer transition-all ${
        isExpired ? 'border-gray-200 opacity-70' : 'border-gray-100'
      }`}
    >
      <div className="flex">
        <div className={`w-24 flex flex-col items-center justify-center p-3 text-white ${
          isExpired ? 'bg-gray-400' : 'bg-gradient-to-br from-orange-400 to-red-500'
        }`}>
          <span className="text-2xl font-bold">¥{coupon.discount_amount}</span>
          <span className="text-xs opacity-80">满{coupon.min_amount}可用</span>
        </div>
        <div className="flex-1 p-4">
          <h3 className="font-semibold text-gray-800">{coupon.title}</h3>
          <p className="text-xs text-gray-500 mt-1 line-clamp-1">{coupon.description}</p>
          <p className="text-xs text-gray-400 mt-2">有效期至 {formatDate(coupon.valid_until)}</p>
          {showClaim && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={(e) => { e.stopPropagation(); claimCoupon(coupon.id); }}
              disabled={claimingId === coupon.id}
              className="mt-3 w-full bg-orange-500 text-white text-sm py-1.5 rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
            >
              {claimingId === coupon.id ? (
                <motion.span
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ repeat: Infinity, duration: 0.8 }}
                >
                  领取中...
                </motion.span>
              ) : '立即领取'}
            </motion.button>
          )}
          {coupon.is_claimed && !isExpired && (
            <span className={`mt-3 inline-block text-xs px-3 py-1 rounded-full ${
              coupon.is_used ? 'bg-gray-100 text-gray-500' : 'bg-green-100 text-green-600'
            }`}>
              {coupon.is_used ? '已使用' : '未使用'}
            </span>
          )}
          {isExpired && <span className="mt-3 inline-block text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-500">已过期</span>}
        </div>
      </div>
    </motion.div>
  );

  const getCoupons = () => {
    switch (activeTab) {
      case 'available': return availableCoupons;
      case 'mine': return myCoupons;
      case 'expired': return expiredCoupons;
      default: return [];
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  const coupons = getCoupons();

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-gradient-to-r from-orange-400 to-red-500 text-white p-6">
        <h1 className="text-xl font-bold">优惠券中心</h1>
        <p className="text-sm opacity-80 mt-1">领券下单更优惠</p>
      </div>

      <div className="flex border-b border-gray-200 bg-white">
        {[
          { key: 'available', label: '可领取' },
          { key: 'mine', label: '我的优惠券' },
          { key: 'expired', label: '已过期' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === tab.key ? 'text-orange-500 border-b-2 border-orange-500' : 'text-gray-600'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-4 space-y-3">
        <AnimatePresence mode="wait">
          {coupons.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center py-12 text-gray-400"
            >
              <i className="fas fa-ticket-alt text-4xl mb-3"></i>
              <p>
                {activeTab === 'available' ? '暂无可领取的优惠券' : 
                 activeTab === 'mine' ? '暂无优惠券' : '暂无过期优惠券'}
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {coupons.map(coupon => (
                <CouponCard 
                  key={coupon.id} 
                  coupon={coupon} 
                  showClaim={activeTab === 'available'}
                  isExpired={activeTab === 'expired'}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 优惠券详情弹窗 */}
      <AnimatePresence>
        {selectedCoupon && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedCoupon(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-sm overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="bg-gradient-to-br from-orange-400 to-red-500 p-6 text-white text-center">
                <div className="text-4xl font-bold mb-1">¥{selectedCoupon.discount_amount}</div>
                <div className="text-sm opacity-80">满{selectedCoupon.min_amount}元可用</div>
              </div>
              <div className="p-6">
                <h3 className="font-bold text-lg text-gray-800 mb-2">{selectedCoupon.title}</h3>
                <p className="text-gray-600 text-sm mb-4">{selectedCoupon.description}</p>
                <div className="space-y-2 text-sm text-gray-500 mb-6">
                  <div className="flex justify-between">
                    <span>有效期至</span>
                    <span className="text-gray-800">{formatDate(selectedCoupon.valid_until)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>状态</span>
                    <span className={selectedCoupon.is_used ? 'text-gray-500' : 'text-green-600'}>
                      {selectedCoupon.is_used ? '已使用' : '未使用'}
                    </span>
                  </div>
                </div>
                {!selectedCoupon.is_used && activeTab === 'mine' && (
                  <button
                    onClick={() => setShowUseModal(true)}
                    className="w-full bg-orange-500 text-white py-3 rounded-xl font-medium hover:bg-orange-600 transition-colors"
                  >
                    立即使用
                  </button>
                )}
                <button
                  onClick={() => setSelectedCoupon(null)}
                  className="w-full mt-3 text-gray-500 py-2 hover:text-gray-700"
                >
                  关闭
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 使用确认弹窗 */}
      <AnimatePresence>
        {showUseModal && selectedCoupon && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4"
            onClick={() => setShowUseModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-2xl w-full max-w-sm p-6 text-center"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-ticket-alt text-orange-500 text-2xl"></i>
              </div>
              <h3 className="font-bold text-lg text-gray-800 mb-2">确认使用优惠券?</h3>
              <p className="text-gray-500 text-sm mb-6">
                {selectedCoupon.title} - ¥{selectedCoupon.discount_amount}优惠券
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowUseModal(false)}
                  className="flex-1 py-3 border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={() => selectedCoupon.user_coupon_id && useCoupon(selectedCoupon.user_coupon_id)}
                  className="flex-1 py-3 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors"
                >
                  确认使用
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Coupons;
