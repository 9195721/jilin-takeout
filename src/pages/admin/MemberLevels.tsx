import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../supabase/client';
import type { Database } from '../../supabase/types';

type MemberLevel = Database['public']['Tables']['member_levels']['Row'];

const AdminMemberLevels: React.FC = () => {
  const [levels, setLevels] = useState<MemberLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingLevel, setEditingLevel] = useState<MemberLevel | null>(null);
  const [formData, setFormData] = useState<Partial<MemberLevel>>({
    name: '',
    icon: '',
    color: '#3b82f6',
    min_views: 0,
    privileges: '',
  });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchLevels();
  }, []);

  const fetchLevels = async () => {
    try {
      const { data } = await supabase
        .from('member_levels')
        .select('*')
        .order('min_views', { ascending: true });

      setLevels(data || []);
    } catch (error) {
      console.error('Failed to fetch member levels:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);

    try {
      if (editingLevel) {
        const { error } = await supabase
          .from('member_levels')
          .update(formData)
          .eq('id', editingLevel.id);

        if (error) throw error;
        setMessage({ type: 'success', text: '等级配置更新成功' });
      } else {
        const { error } = await supabase.from('member_levels').insert([formData]);

        if (error) throw error;
        setMessage({ type: 'success', text: '新等级添加成功' });
      }

      resetForm();
      fetchLevels();
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || '操作失败' });
    } finally {
      setActionLoading(false);
    }
  };

  const resetForm = () => {
    setShowAddForm(false);
    setEditingLevel(null);
    setFormData({ name: '', icon: '', color: '#3b82f6', min_views: 0, privileges: '' });
  };

  const handleEdit = (level: MemberLevel) => {
    setEditingLevel(level);
    setFormData(level);
    setShowAddForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个会员等级吗？')) return;
    setActionLoading(true);
    try {
      const { error } = await supabase.from('member_levels').delete().eq('id', id);
      if (error) throw error;
      setMessage({ type: 'success', text: '等级删除成功' });
      fetchLevels();
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
          <h1 className="text-2xl font-bold text-gray-800">会员等级体系</h1>
          <p className="text-sm text-gray-500 mt-1">配置商家成长路径与权益规则</p>
        </div>
        {!showAddForm && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowAddForm(true)}
            className="bg-purple-500 text-white px-6 py-3 rounded-xl hover:bg-purple-600 transition-all shadow-lg shadow-purple-500/30 flex items-center font-medium"
          >
            <i className="fas fa-crown mr-2"></i>
            新增等级
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
              <i className={`fas ${editingLevel ? 'fa-edit' : 'fa-plus-circle'} mr-2 text-purple-500`}></i>
              {editingLevel ? '编辑等级配置' : '创建新等级'}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">等级名称 <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-50 transition-all bg-gray-50 focus:bg-white"
                    placeholder="例如：钻石商家"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">主题色 <span className="text-red-500">*</span></label>
                  <div className="flex space-x-3">
                    <input
                      type="color"
                      value={formData.color || '#3b82f6'}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      required
                      className="h-12 w-16 rounded-lg border border-gray-200 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.color || '#3b82f6'}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-50 transition-all bg-gray-50 focus:bg-white font-mono text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">升级门槛 (浏览量)</label>
                  <input
                    type="number"
                    value={formData.min_views || 0}
                    onChange={(e) => setFormData({ ...formData, min_views: parseInt(e.target.value) })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-50 transition-all bg-gray-50 focus:bg-white"
                  />
                </div>
              </div>

              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">等级图标 (Emoji)</label>
                  <input
                    type="text"
                    value={formData.icon || ''}
                    onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-50 transition-all bg-gray-50 focus:bg-white text-center text-2xl"
                    placeholder="💎"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">专属权益说明</label>
                  <textarea
                    value={formData.privileges || ''}
                    onChange={(e) => setFormData({ ...formData, privileges: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-50 transition-all bg-gray-50 focus:bg-white resize-none"
                    placeholder="描述该等级享有的特权..."
                  />
                </div>
              </div>
            </div>

            <div className="flex space-x-4 mt-8 pt-6 border-t border-gray-100">
              <button
                type="submit"
                disabled={actionLoading}
                className="flex-1 bg-purple-500 text-white py-3 rounded-xl hover:bg-purple-600 disabled:bg-gray-300 transition-all font-semibold shadow-lg shadow-purple-500/20 flex items-center justify-center"
              >
                {actionLoading ? <i className="fas fa-circle-notch fa-spin mr-2"></i> : <i className="fas fa-save mr-2"></i>}
                {editingLevel ? '保存配置' : '确认添加'}
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {levels.map((level, index) => (
          <motion.div
            key={level.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all group"
          >
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-inner"
                  style={{ backgroundColor: level.color + '20' }}
                >
                  {level.icon}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800">{level.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    门槛: <span className="font-mono font-bold text-purple-600">{level.min_views}</span> 浏览量
                  </p>
                </div>
              </div>
              <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleEdit(level)}
                  className="w-9 h-9 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center"
                >
                  <i className="fas fa-pen text-xs"></i>
                </button>
                <button
                  onClick={() => handleDelete(level.id)}
                  className="w-9 h-9 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center"
                >
                  <i className="fas fa-trash-alt text-xs"></i>
                </button>
              </div>
            </div>

            {level.privileges && (
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">权益详情</h4>
                <p className="text-sm text-gray-700 leading-relaxed">{level.privileges}</p>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default AdminMemberLevels;
