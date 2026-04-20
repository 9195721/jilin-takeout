import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../supabase/client';
import type { Database } from '../../supabase/types';

type Menu = Database['public']['Tables']['menus']['Row'];
type Category = Database['public']['Tables']['categories']['Row'];

const MenuForm = ({ 
  formData, 
  setFormData, 
  categories, 
  onSubmit, 
  onCancel, 
  isEditing, 
  loading 
}: { 
  formData: Partial<Menu>; 
  setFormData: React.Dispatch<React.SetStateAction<Partial<Menu>>>; 
  categories: Category[]; 
  onSubmit: (e: React.FormEvent) => void; 
  onCancel: () => void; 
  isEditing: boolean;
  loading: boolean;
}) => (
  <motion.form
    initial={{ opacity: 0, height: 0 }}
    animate={{ opacity: 1, height: 'auto' }}
    exit={{ opacity: 0, height: 0 }}
    onSubmit={onSubmit}
    className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-6 overflow-hidden"
  >
    <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
      <i className={`fas ${isEditing ? 'fa-edit' : 'fa-plus-circle'} mr-2 text-green-500`}></i>
      {isEditing ? '编辑菜品' : '添加新菜品'}
    </h3>
    
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">菜品名称 <span className="text-red-500">*</span></label>
          <input
            type="text"
            value={formData.name || ''}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-50 transition-all bg-white text-gray-900 placeholder-gray-400"
            placeholder="例如：招牌红烧肉"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">价格 (元) <span className="text-red-500">*</span></label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">¥</span>
            <input
              type="number"
              step="0.01"
              value={formData.price || ''}
              onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
              required
              className="w-full pl-8 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-50 transition-all bg-white text-gray-900 placeholder-gray-400"
              placeholder="0.00"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">所属分类</label>
          <select
            value={formData.category_id || ''}
            onChange={(e) => setFormData({ ...formData, category_id: e.target.value ? parseInt(e.target.value) : null })}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-50 transition-all bg-white text-gray-900 placeholder-gray-400 appearance-none"
          >
            <option value="">请选择分类</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">菜品图片URL</label>
          <input
            type="url"
            value={formData.image || ''}
            onChange={(e) => setFormData({ ...formData, image: e.target.value })}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-50 transition-all bg-white text-gray-900 placeholder-gray-400"
            placeholder="https://..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">菜品描述</label>
          <textarea
            value={formData.description || ''}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-50 transition-all bg-white text-gray-900 placeholder-gray-400 resize-none"
            placeholder="简要描述菜品特色..."
          />
        </div>

        <div className="flex items-center pt-2">
          <label className="flex items-center cursor-pointer group">
            <div className="relative">
              <input
                type="checkbox"
                checked={formData.is_available || false}
                onChange={(e) => setFormData({ ...formData, is_available: e.target.checked })}
                className="sr-only"
              />
              <div className={`w-12 h-6 rounded-full transition-colors ${formData.is_available ? 'bg-green-500' : 'bg-gray-200'}`}></div>
              <div className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform ${formData.is_available ? 'translate-x-6' : 'translate-x-0'}`}></div>
            </div>
            <span className="ml-3 text-sm font-medium text-gray-700 group-hover:text-gray-900">立即上架销售</span>
          </label>
        </div>
      </div>
    </div>

    <div className="flex space-x-4 mt-8 pt-6 border-t border-gray-100">
      <button
        type="submit"
        disabled={loading}
        className="flex-1 bg-green-500 text-white py-3 rounded-xl hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all font-semibold shadow-lg shadow-green-500/20 flex items-center justify-center"
      >
        {loading ? <i className="fas fa-circle-notch fa-spin mr-2"></i> : <i className="fas fa-save mr-2"></i>}
        {isEditing ? '保存修改' : '确认添加'}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 transition-all font-semibold"
      >
        取消操作
      </button>
    </div>
  </motion.form>
);

const MerchantMenuManage: React.FC = () => {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [merchantId, setMerchantId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null);
  const [formData, setFormData] = useState<Partial<Menu>>({
    name: '',
    price: 0,
    description: '',
    image: '',
    category_id: null,
    is_available: true,
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: merchantData } = await supabase
        .from('merchants')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (merchantData) {
        setMerchantId(merchantData.id);
        const { data: menusData } = await supabase
          .from('menus')
          .select('*')
          .eq('merchant_id', merchantData.id)
          .order('sort_order', { ascending: true });
        setMenus(menusData || []);
      }

      const { data: categoriesData } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true });
      setCategories(categoriesData || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchantId) return;
    setActionLoading(true);

    try {
      if (editingMenu) {
        const { error } = await supabase.from('menus').update(formData).eq('id', editingMenu.id);
        if (error) throw error;
        setMessage({ type: 'success', text: '菜品更新成功' });
      } else {
        const { error } = await supabase.from('menus').insert([{ ...formData, merchant_id: merchantId }]);
        if (error) throw error;
        setMessage({ type: 'success', text: '菜品添加成功' });
      }
      resetForm();
      fetchData();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || '操作失败' });
    } finally {
      setActionLoading(false);
    }
  };

  const resetForm = () => {
    setShowAddForm(false);
    setEditingMenu(null);
    setFormData({ name: '', price: 0, description: '', image: '', category_id: null, is_available: true });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要永久删除这个菜品吗？')) return;
    setActionLoading(true);
    try {
      const { error } = await supabase.from('menus').delete().eq('id', id);
      if (error) throw error;
      setMessage({ type: 'success', text: '菜品已删除' });
      fetchData();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || '删除失败' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleAvailability = async (menu: Menu) => {
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from('menus')
        .update({ is_available: !menu.is_available })
        .eq('id', menu.id);
      if (error) throw error;
      fetchData();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || '操作失败' });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-200 border-t-green-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">菜品管理</h1>
          <p className="text-sm text-gray-500 mt-1">管理您的菜单，保持菜品新鲜度</p>
        </div>
        {!showAddForm && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAddForm(true)}
            className="bg-green-500 text-white px-6 py-3 rounded-xl hover:bg-green-600 transition-all shadow-lg shadow-green-500/30 flex items-center font-medium"
          >
            <i className="fas fa-plus mr-2"></i>
            添加菜品
          </motion.button>
        )}
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
            <i className={`fas ${message.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} mr-3 text-lg`}></i>
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddForm && (
          <MenuForm
            formData={formData}
            setFormData={setFormData}
            categories={categories}
            onSubmit={handleSubmit}
            onCancel={resetForm}
            isEditing={!!editingMenu}
            loading={actionLoading}
          />
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {menus.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16 text-gray-400 bg-white rounded-2xl border border-dashed border-gray-200"
          >
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-utensils text-3xl text-gray-300"></i>
            </div>
            <p className="text-lg font-medium text-gray-500">暂无菜品数据</p>
            <p className="text-sm mt-2">点击右上角按钮添加您的第一个菜品</p>
          </motion.div>
        ) : (
          menus.map((menu, index) => (
            <motion.div
              key={menu.id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-all group"
            >
              <div className="flex flex-col sm:flex-row">
                <div className="w-full sm:w-32 h-48 sm:h-32 bg-gray-100 flex-shrink-0 relative overflow-hidden">
                  {menu.image ? (
                    <img src={menu.image} alt={menu.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gradient-to-br from-gray-50 to-gray-100">
                      <i className="fas fa-image text-3xl"></i>
                    </div>
                  )}
                  <div className={`absolute top-3 left-3 px-2.5 py-1 rounded-lg text-xs font-bold shadow-sm ${menu.is_available ? 'bg-green-500 text-white' : 'bg-gray-500/80 text-white backdrop-blur-sm'}`}>
                    {menu.is_available ? '销售中' : '已停售'}
                  </div>
                </div>
                
                <div className="flex-1 p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-bold text-gray-800 text-lg group-hover:text-green-600 transition-colors">{menu.name}</h3>
                        {menu.category && (
                          <span className="inline-flex items-center mt-1.5 px-2 py-0.5 rounded-md text-xs bg-gray-100 text-gray-600 font-medium">
                            {menu.category.icon} {menu.category.name}
                          </span>
                        )}
                      </div>
                      <span className="text-xl font-bold text-red-500">¥{menu.price.toFixed(2)}</span>
                    </div>
                    {menu.description && (
                      <p className="text-sm text-gray-500 line-clamp-2 mb-4">{menu.description}</p>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-3 pt-4 border-t border-gray-50">
                    <button
                      onClick={() => { setEditingMenu(menu); setFormData(menu); setShowAddForm(true); }}
                      className="flex-1 bg-blue-50 text-blue-600 py-2.5 rounded-xl hover:bg-blue-100 transition-colors text-sm font-medium flex items-center justify-center"
                    >
                      <i className="fas fa-pen mr-2"></i>编辑
                    </button>
                    <button
                      onClick={() => handleToggleAvailability(menu)}
                      className={`flex-1 py-2.5 rounded-xl transition-colors text-sm font-medium flex items-center justify-center ${
                        menu.is_available ? 'bg-orange-50 text-orange-600 hover:bg-orange-100' : 'bg-green-50 text-green-600 hover:bg-green-100'
                      }`}
                    >
                      <i className={`fas ${menu.is_available ? 'fa-pause-circle' : 'fa-play-circle'} mr-2`}></i>
                      {menu.is_available ? '下架' : '上架'}
                    </button>
                    <button
                      onClick={() => handleDelete(menu.id)}
                      className="w-10 h-10 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors flex items-center justify-center"
                    >
                      <i className="fas fa-trash-alt"></i>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default MerchantMenuManage;
