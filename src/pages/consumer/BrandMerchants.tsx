import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../../supabase/client';

type Merchant = {
  id: number;
  shop_name: string;
  cover_image: string | null;
  rating: number | null;
  sales_count: number | null;
  views: number | null;
  address: string;
  member_level_id: number | null;
  member_level: { id: number; name: string; icon: string | null; color: string | null } | null;
};

const BrandMerchants: React.FC = () => {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDiamondMerchants();
  }, []);

  const fetchDiamondMerchants = async () => {
    try {
      // 先查钻石会员等级的 ID
      const { data: diamondLevel } = await supabase
        .from('member_levels')
        .select('id')
        .eq('name', '钻石')
        .maybeSingle();

      if (!diamondLevel) {
        setMerchants([]);
        setLoading(false);
        return;
      }

      // 查该等级下的已审核商家
      const { data } = await supabase
        .from('merchants')
        .select(`*, member_level:member_level_id (id, name, icon, color)`)
        .eq('member_level_id', diamondLevel.id)
        .eq('status', 'approved')
        .order('views', { ascending: false });

      setMerchants((data as Merchant[]) || []);
    } catch (error) {
      console.error('Failed to fetch diamond merchants:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-2 gap-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white/10 rounded-2xl overflow-hidden animate-pulse">
              <div className="h-28 bg-white/5"></div>
              <div className="p-3 space-y-2">
                <div className="h-3 bg-white/10 rounded w-3/4"></div>
                <div className="h-2 bg-white/10 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* 页面标题 */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center space-x-3 mb-6"
      >
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-lg border border-white/30">
          <i className="fas fa-crown text-white text-lg"></i>
        </div>
        <div>
          <h1 className="text-xl font-bold text-white">品牌商家</h1>
          <p className="text-xs text-white/50">钻石会员 · 品质保障</p>
        </div>
      </motion.div>

      {/* 商家列表 */}
      {merchants.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16 text-white/40"
        >
          <i className="fas fa-gem text-5xl mb-4"></i>
          <p>暂无钻石品牌商家入驻</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {merchants.map((merchant, index) => (
            <motion.div
              key={merchant.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06 }}
              whileHover={{ y: -2 }}
            >
              <Link to={`/merchants/${merchant.id}`}>
                <div className="bg-white/15 backdrop-blur-[40px] backdrop-saturate-[180%] rounded-2xl overflow-hidden border border-white/30 hover:border-white/50 transition-all group">
                  <div className="relative h-28 bg-white/10">
                    {merchant.cover_image ? (
                      <img
                        src={merchant.cover_image}
                        alt={merchant.shop_name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/30">
                        <i className="fas fa-store text-4xl"></i>
                      </div>
                    )}
                    {/* 钻石标识 */}
                    {merchant.member_level && (
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] text-white flex items-center space-x-1 shadow-lg backdrop-blur-sm border border-white/30 bg-gradient-to-r from-yellow-500 to-amber-400">
                        <span>{merchant.member_level.icon || '💎'}</span>
                        <span className="font-medium">{merchant.member_level.name}</span>
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-black/60 to-transparent"></div>
                  </div>
                  <div className="p-3">
                    <h3 className="font-bold text-white mb-1 text-sm truncate">{merchant.shop_name}</h3>
                    <div className="flex items-center justify-between text-xs text-white/70 mb-1">
                      <span className="flex items-center text-yellow-400 font-medium">
                        <i className="fas fa-star mr-0.5"></i>{merchant.rating?.toFixed(1) || '0.0'}
                      </span>
                      <span className="flex items-center">
                        <i className="fas fa-shopping-bag text-blue-400 mr-0.5"></i>{merchant.sales_count || 0}单
                      </span>
                    </div>
                    <p className="text-[11px] text-white/50 line-clamp-1 flex items-center">
                      <i className="fas fa-map-marker-alt mr-1 text-red-400"></i>{merchant.address}
                    </p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BrandMerchants;
