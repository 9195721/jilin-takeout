import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../supabase/client';
import type { Database } from '../../supabase/types';

type Merchant = Database['public']['Tables']['merchants']['Row'] & {
  profile: Database['public']['Tables']['profiles']['Row'] | null;
};

const AdminMerchantAudit: React.FC = () => {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchMerchants();
  }, [filter]);

  const fetchMerchants = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('merchants')
        .select(`
          *,
          profile:user_id (
            id,
            username,
            phone
          )
        `);

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data } = await query.order('created_at', { ascending: false });
      setMerchants(data || []);
    } catch (error) {
      console.error('Failed to fetch merchants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: number, newStatus: string) => {
    setActionLoading(id);
    try {
      const { error } = await supabase.from('merchants').update({ status: newStatus }).eq('id', id);
      if (error) throw error;
      setMessage({ type: 'success', text: newStatus === 'approved' ? '审核已通过' : '已拒绝申请' });
      fetchMerchants();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || '操作失败' });
    } finally {
      setActionLoading(null);
    }
  };

  const filters = [
    { key: 'pending', label: '待审核', icon: 'fa-clock', color: 'text-yellow-500' },
    { key: 'approved', label: '已通过', icon: 'fa-check-circle', color: 'text-green-500' },
    { key: 'rejected', label: '已拒绝', icon: 'fa-times-circle', color: 'text-red-500' },
    { key: 'all', label: '全部商家', icon: 'fa-list', color: 'text-blue-500' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">商家入驻审核</h1>
          <p className="text-sm text-gray-500 mt-1">管理商家资质，维护平台质量</p>
        </div>
        <div className="bg-white rounded-xl p-1 shadow-sm border border-gray-100 flex">
          {filters.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center space-x-2 ${
                filter === f.key ? 'bg-gray-100 text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <i className={`fas ${f.icon} ${f.color}`}></i>
              <span>{f.label}</span>
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`mb-6 p-4 rounded-xl flex items-center ${
              message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-red-50 text-red-700 border border-red-100'
            }`}
          >
            <i className={`fas ${message.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} mr-3`}></i>
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          [...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-sm animate-pulse h-48"></div>
          ))
        ) : merchants.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
            <i className="fas fa-inbox text-5xl text-gray-200 mb-4"></i>
            <p className="text-gray-500 font-medium">当前分类下暂无商家数据</p>
          </motion.div>
        ) : (
          merchants.map((merchant, index) => (
            <motion.div
              key={merchant.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    <h3 className="text-xl font-bold text-gray-800">{merchant.shop_name}</h3>
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                      merchant.status === 'approved' ? 'bg-green-50 text-green-600 border-green-100' :
                      merchant.status === 'rejected' ? 'bg-red-50 text-red-600 border-red-100' :
                      'bg-yellow-50 text-yellow-600 border-yellow-100'
                    }`}>
                      {merchant.status === 'approved' ? '已通过' : merchant.status === 'rejected' ? '已拒绝' : '待审核'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 gap-x-6 text-sm text-gray-600 mb-4">
                    <p className="flex items-center"><i className="fas fa-user w-5 text-gray-400"></i> {merchant.profile?.username || '未设置'}</p>
                    <p className="flex items-center"><i className="fas fa-phone w-5 text-gray-400"></i> {merchant.phone}</p>
                    <p className="flex items-center sm:col-span-2"><i className="fas fa-map-marker-alt w-5 text-gray-400"></i> {merchant.address}</p>
                  </div>

                  {merchant.description && (
                    <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-600 leading-relaxed border border-gray-100">
                      <i className="fas fa-quote-left text-gray-300 mr-2"></i>
                      {merchant.description}
                    </div>
                  )}
                </div>

                <div className="flex md:flex-col gap-3 min-w-[140px]">
                  {merchant.status === 'pending' ? (
                    <>
                      <button
                        onClick={() => handleStatusChange(merchant.id, 'approved')}
                        disabled={actionLoading === merchant.id}
                        className="flex-1 bg-green-500 text-white py-2.5 rounded-xl hover:bg-green-600 disabled:bg-gray-300 transition-all font-medium flex items-center justify-center shadow-sm shadow-green-500/20"
                      >
                        {actionLoading === merchant.id ? <i className="fas fa-circle-notch fa-spin"></i> : <><i className="fas fa-check mr-2"></i>通过</>}
                      </button>
                      <button
                        onClick={() => handleStatusChange(merchant.id, 'rejected')}
                        disabled={actionLoading === merchant.id}
                        className="flex-1 bg-white border border-red-200 text-red-600 py-2.5 rounded-xl hover:bg-red-50 disabled:bg-gray-50 transition-all font-medium flex items-center justify-center"
                      >
                        {actionLoading === merchant.id ? <i className="fas fa-circle-notch fa-spin"></i> : <><i className="fas fa-times mr-2"></i>拒绝</>}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleStatusChange(merchant.id, merchant.status === 'approved' ? 'rejected' : 'approved')}
                      disabled={actionLoading === merchant.id}
                      className={`w-full py-2.5 rounded-xl transition-all font-medium flex items-center justify-center border ${
                        merchant.status === 'approved' 
                          ? 'bg-white border-red-200 text-red-600 hover:bg-red-50' 
                          : 'bg-white border-green-200 text-green-600 hover:bg-green-50'
                      }`}
                    >
                      <i className={`fas ${merchant.status === 'approved' ? 'fa-ban' : 'fa-check'} mr-2`}></i>
                      {merchant.status === 'approved' ? '禁用店铺' : '重新启用'}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminMerchantAudit;
