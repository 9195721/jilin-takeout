import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../supabase/client';
import type { Database } from '../../supabase/types';

type Category = Database['public']['Tables']['categories']['Row'];

const AdminCategoryManage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<Partial<Category>>({
    name: '',
    icon: '',
    sort_order: 0,
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .order('sort_order', { ascending: true });

      setCategories(data || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);

    try {
      if (editingCategory) {
        const { error } = await supabase
          .from('categories')
          .update(formData)
          .eq('id', editingCategory.id);

        if (error) throw error;
        setMessage({ type: 'success', text: '分类更新成功' });
      } else {
        const { error } = await supabase.from('categories').insert([formData]);

        if (error) throw error;
        setMessage({ type: 'success', text: '分类添加成功' });
      }

      resetForm();
      fetchCategories();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || '操作失败' });
    } finally {
      setActionLoading(false);
    }
  };

  const resetForm = () => {
    setShowAddForm(false);
    setEditingCategory(null);
    setFormData({ name: '', icon: '', sort_order: 0 });
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData(category);
    setShowAddForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个分类吗？关联的菜品将失去分类。')) return;
    setActionLoading(true);
    try {
      const { error } = await supabase.from('categories').delete().eq('id', id);
      if (error) throw error;
      setMessage({ type: 'success', text: '分类删除成功' });
      fetchCategories();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || '删除失败' });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">分类管理</h1>
          <p className="text-sm text-gray-500 mt-1">配置平台服务类目，优化用户浏览体验</p>
        </div>
        {!showAddForm && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAddForm(true)}
            className="bg-purple-500 text-white px-6 py-3 rounded-xl hover:bg-purple-600 transition-all shadow-lg shadow-purple-500/30 flex items-center font-medium"
          >
            <i className="fas fa-plus mr-2"></i>
            添加分类
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
            <i className={`fas ${message.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} mr-3`}></i>
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddForm && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSubmit}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 mb-8 overflow-hidden"
          >
            <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
              <i className={`fas ${editingCategory ? 'fa-edit' : 'fa-plus-circle'} mr-2 text-purple-500`}></i>
              {editingCategory ? '编辑分类信息' : '创建新分类'}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">分类名称 <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-50 transition-all bg-gray-50 focus:bg-white"
                  placeholder="例如：餐饮美食"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">图标 (Emoji) <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={formData.icon || ''}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-50 transition-all bg-gray-50 focus:bg-white text-center text-2xl"
                  placeholder="🍜"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">显示排序</label>
                <input
                  type="number"
                  value={formData.sort_order || 0}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-50 transition-all bg-gray-50 focus:bg-white"
                />
              </div>
            </div>

            <div className="flex space-x-4 mt-8 pt-6 border-t border-gray-100">
              <button
                type="submit"
                disabled={actionLoading}
                className="flex-1 bg-purple-500 text-white py-3 rounded-xl hover:bg-purple-600 disabled:bg-gray-300 transition-all font-semibold shadow-lg shadow-purple-500/20 flex items-center justify-center"
              >
                {actionLoading ? <i className="fas fa-circle-notch fa-spin mr-2"></i> : <i className="fas fa-save mr-2"></i>}
                {editingCategory ? '保存修改' : '确认添加'}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-xl hover:bg-gray-200 transition-all font-semibold"
              >
                取消操作
              </button>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category, index) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ y: -4, boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 group relative"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center text-4xl group-hover:scale-110 transition-transform duration-300">
                {category.icon}
              </div>
              <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleEdit(category)}
                  className="w-9 h-9 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center"
                >
                  <i className="fas fa-pen text-xs"></i>
                </button>
                <button
                  onClick={() => handleDelete(category.id)}
                  className="w-9 h-9 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center"
                >
                  <i className="fas fa-trash-alt text-xs"></i>
                </button>
              </div>
            </div>
            <h3 className="font-bold text-gray-800 text-lg mb-1">{category.name}</h3>
            <p className="text-xs text-gray-400 font-mono">排序权重: {category.sort_order}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default AdminCategoryManage;
