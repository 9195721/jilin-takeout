import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../supabase/client';
import { uploadImage } from '../../utils/cos';
import type { Database } from '../../supabase/types';

type Merchant = Database['public']['Tables']['merchants']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];

// 区域选项
const DISTRICTS = ['船营', '昌邑', '丰满', '高新'];

const MerchantShopInfo: React.FC = () => {
  const [formData, setFormData] = useState<Partial<Merchant>>({
    shop_name: '', address: '', phone: '',
    description: '', cover_image: '',
    category_id: null, district: '',
  });
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchMerchantInfo();
    loadCategories();
  }, []);

  const loadCategories = async () => {
    const { data } = await supabase.from('categories').select('*').order('sort_order', { ascending: true });
    setCategories(data || []);
  };

  const fetchMerchantInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase.from('merchants').select('*').eq('user_id', user.id).maybeSingle();

      if (data) {
        setMerchant(data);
        setFormData({ ...data });
      }
    } catch (error) {
      console.error('Failed to fetch merchant info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setMessage({ type: 'error', text: '请先登录' }); return; }

      if (merchant) {
        const { error } = await supabase.from('merchants').update(formData).eq('id', merchant.id);
        if (error) throw error;
        setMessage({ type: 'success', text: '店铺信息更新成功' });
      } else {
        const { error } = await supabase.from('merchants').insert([{ ...formData, user_id: user.id }]);
        if (error) throw error;
        setMessage({ type: 'success', text: '店铺创建成功，等待审核' });
        fetchMerchantInfo();
      }
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || '操作失败' });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setMessage({ type: 'error', text: '请选择图片文件' }); return; }
    if (file.size > 5 * 1024 * 1024) { setMessage({ type: 'error', text: '图片大小不能超过5MB' }); return; }

    setUploading(true); setMessage(null);
    try {
      const url = await uploadImage(file);
      setFormData((prev) => ({ ...prev, cover_image: url }));
      setMessage({ type: 'success', text: '图片上传成功' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || '上传失败' });
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div></div>);
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">店铺信息管理</h1>

      {message && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
        >{message.text}</motion.div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-sm space-y-6">
        {/* 店铺名称 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">店铺名称 <span className="text-red-500">*</span></label>
          <input type="text" name="shop_name" value={formData.shop_name || ''} onChange={handleChange} required
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
            placeholder="请输入店铺名称" />
        </div>

        {/* 联系电话 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">联系电话 <span className="text-red-500">*</span></label>
          <input type="tel" name="phone" value={formData.phone || ''} onChange={handleChange} required
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
            placeholder="请输入联系电话" />
        </div>

        {/* 店铺地址 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">店铺地址 <span className="text-red-500">*</span></label>
          <input type="text" name="address" value={formData.address || ''} onChange={handleChange} required
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
            placeholder="请输入详细地址" />
        </div>

        {/* 【新增】服务分类 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">服务分类 <span className="text-red-500">*</span></label>
          <select name="category_id" value={formData.category_id ?? ''} onChange={handleChange}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all bg-white text-gray-900"
          >
            <option value="">请选择分类...</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
            ))}
          </select>
        </div>

        {/* 【新增】所在区域 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">所在区域 <span className="text-red-500">*</span></label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {DISTRICTS.map((d) => (
              <motion.button key={d} type="button" whileTap={{ scale: 0.96 }}
                onClick={() => setFormData((prev) => ({ ...prev, district: d }))}
                className={`py-3 px-4 rounded-xl border-2 font-medium text-sm transition-all ${
                  formData.district === d
                    ? 'border-green-500 bg-green-50 text-green-700 shadow-sm'
                    : 'border-gray-200 text-gray-600 hover:border-green-300 hover:bg-green-50/50'
                }`}
              >
                📍 {d}
              </motion.button>
            ))}
          </div>
        </div>

        {/* 封面图片 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">封面图片</label>
          <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden" />
          <div className="space-y-3">
            {formData.cover_image && (
              <div className="relative w-full h-48 rounded-lg overflow-hidden border border-gray-200">
                <img src={formData.cover_image} alt="封面预览" className="w-full h-full object-cover" />
                <button type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, cover_image: '' }))}
                  className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                ><i className="fas fa-times text-sm"></i></button>
              </div>
            )}
            <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
              className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-all flex items-center justify-center space-x-2 text-gray-600 disabled:opacity-50"
            >
              {uploading ? (<><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-500"></div><span>上传中...</span></>)
                : (<><i className="fas fa-cloud-upload-alt text-xl"></i><span>{formData.cover_image ? '更换图片' : '点击上传图片'}</span></>)}
            </button>
          </div>
        </div>

        {/* 店铺描述 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">店铺描述</label>
          <textarea name="description" value={formData.description || ''} onChange={handleChange} rows={4}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 resize-none"
            placeholder="请输入店铺描述" />
        </div>

        {/* 审核状态 */}
        {merchant && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">审核状态</label>
            <div className={`inline-block px-4 py-2 rounded-lg ${
              merchant.status === 'approved' ? 'bg-green-100 text-green-700'
              : merchant.status === 'rejected' ? 'bg-red-100 text-red-700'
              : 'bg-yellow-100 text-yellow-700'
            }`}>
              {merchant.status === 'approved' ? '已通过' : merchant.status === 'rejected' ? '已拒绝' : '待审核'}
            </div>
          </div>
        )}

        <button type="submit" disabled={saving}
          className="w-full bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-semibold"
        >
          {saving ? '保存中...' : merchant ? '更新信息' : '提交审核'}
        </button>
      </form>
    </div>
  );
};

export default MerchantShopInfo;
