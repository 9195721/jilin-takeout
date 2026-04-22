import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../supabase/client';

type Category = { id: number; name: string };
type District = { id: number; name: string };

type Merchant = {
  id: number;
  shop_name: string;
  phone: string;
  address: string;
  description: string | null;
  district: string | null;
  category_id: number | null;
  cover_image: string | null;
  status: string | null;
  is_visible: boolean | null;
  is_featured: boolean | null;
  is_top: boolean | null;
  sort_weight: number | null;
  tags: string[] | null;
  open_hours: string | null;
  rating: number | null;
  views: number | null;
  created_at: string | null;
};

const EMPTY_FORM = {
  shop_name: '',
  phone: '',
  address: '',
  description: '',
  district: '',
  category_id: '' as any,
  cover_image: '',
  open_hours: '09:00-22:00',
  tags: '',
  sort_weight: 0,
  is_visible: true,
  is_featured: false,
  is_top: false,
};

const AdminMerchants: React.FC = () => {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [mRes, cRes, dRes] = await Promise.all([
      supabase.from('merchants').select('*').order('sort_weight', { ascending: false }).order('created_at', { ascending: false }),
      supabase.from('categories').select('id, name').order('sort_order'),
      supabase.from('districts').select('id, name').order('sort_order'),
    ]);
    setMerchants(mRes.data || []);
    setCategories(cRes.data || []);
    setDistricts(dRes.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filtered = merchants.filter((m) => {
    const matchSearch = !search || m.shop_name.includes(search) || m.phone.includes(search) || m.address.includes(search);
    const matchStatus = filterStatus === 'all' || m.status === filterStatus;
    const matchCat = filterCategory === 'all' || String(m.category_id) === filterCategory;
    return matchSearch && matchStatus && matchCat;
  });

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setModalOpen(true);
  };

  const openEdit = (m: Merchant) => {
    setEditingId(m.id);
    setForm({
      shop_name: m.shop_name,
      phone: m.phone,
      address: m.address,
      description: m.description || '',
      district: m.district || '',
      category_id: m.category_id || '',
      cover_image: m.cover_image || '',
      open_hours: m.open_hours || '09:00-22:00',
      tags: (m.tags || []).join(', '),
      sort_weight: m.sort_weight || 0,
      is_visible: m.is_visible !== false,
      is_featured: !!m.is_featured,
      is_top: !!m.is_top,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.shop_name || !form.phone || !form.address) {
      setMsg({ type: 'error', text: '店名、电话、地址不能为空' });
      return;
    }
    setSaving(true);
    const payload = {
      shop_name: form.shop_name,
      phone: form.phone,
      address: form.address,
      description: form.description || null,
      district: form.district || null,
      category_id: form.category_id ? Number(form.category_id) : null,
      cover_image: form.cover_image || null,
      open_hours: form.open_hours,
      tags: form.tags ? form.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      sort_weight: Number(form.sort_weight),
      is_visible: form.is_visible,
      is_featured: form.is_featured,
      is_top: form.is_top,
      status: editingId ? undefined : 'approved',
      updated_at: new Date().toISOString(),
    };

    const { error } = editingId
      ? await supabase.from('merchants').update(payload).eq('id', editingId)
      : await supabase.from('merchants').insert({ ...payload, status: 'approved' });

    setSaving(false);
    if (error) {
      setMsg({ type: 'error', text: error.message });
    } else {
      setMsg({ type: 'success', text: editingId ? '保存成功' : '新增商家成功' });
      setModalOpen(false);
      fetchAll();
    }
  };

  const handleToggle = async (id: number, field: 'is_visible' | 'is_featured' | 'is_top', val: boolean) => {
    await supabase.from('merchants').update({ [field]: val }).eq('id', id);
    fetchAll();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除这家商家？此操作不可恢复')) return;
    const { error } = await supabase.from('merchants').delete().eq('id', id);
    if (error) setMsg({ type: 'error', text: error.message });
    else { setMsg({ type: 'success', text: '已删除' }); fetchAll(); }
  };

  const statusMap: Record<string, { label: string; color: string }> = {
    approved: { label: '已通过', color: 'bg-green-100 text-green-700' },
    pending: { label: '待审核', color: 'bg-yellow-100 text-yellow-700' },
    rejected: { label: '已拒绝', color: 'bg-red-100 text-red-700' },
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">商家管理</h1>
          <p className="text-sm text-gray-500 mt-0.5">共 {filtered.length} 家商家</p>
        </div>
        <button
          onClick={openAdd}
          className="bg-purple-600 text-white px-4 py-2 rounded-xl hover:bg-purple-700 transition-colors flex items-center space-x-2 shadow-sm"
        >
          <i className="fas fa-plus"></i>
          <span>新增商家</span>
        </button>
      </div>

      {/* 消息提示 */}
      <AnimatePresence>
        {msg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            onAnimationComplete={() => setTimeout(() => setMsg(null), 3000)}
            className={`mb-4 p-3 rounded-xl text-sm flex items-center ${msg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}
          >
            <i className={`fas ${msg.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} mr-2`}></i>
            {msg.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 筛选栏 */}
      <div className="bg-white rounded-2xl p-4 shadow-sm mb-4 flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
          <input
            type="text"
            placeholder="搜索店名、电话、地址..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-2 bg-gray-50 rounded-xl text-sm border-0 focus:ring-2 focus:ring-purple-300 outline-none"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          className="px-3 py-2 bg-gray-50 rounded-xl text-sm border-0 focus:ring-2 focus:ring-purple-300 outline-none"
        >
          <option value="all">全部状态</option>
          <option value="approved">已通过</option>
          <option value="pending">待审核</option>
          <option value="rejected">已拒绝</option>
        </select>
        <select
          value={filterCategory}
          onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }}
          className="px-3 py-2 bg-gray-50 rounded-xl text-sm border-0 focus:ring-2 focus:ring-purple-300 outline-none"
        >
          <option value="all">全部分类</option>
          {categories.map((c) => <option key={c.id} value={String(c.id)}>{c.name}</option>)}
        </select>
      </div>

      {/* 列表 */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">
            <i className="fas fa-circle-notch fa-spin text-3xl mb-3"></i>
            <p className="text-sm">加载中...</p>
          </div>
        ) : paginated.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <i className="fas fa-store text-4xl mb-3 opacity-30"></i>
            <p className="text-sm">暂无数据</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">商家信息</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">分类/区域</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">状态</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600">上架</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">推荐</th>
                  <th className="text-center px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">置顶</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginated.map((m) => {
                  const cat = categories.find((c) => c.id === m.category_id);
                  const s = statusMap[m.status || ''] || { label: m.status || '-', color: 'bg-gray-100 text-gray-600' };
                  return (
                    <tr key={m.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-3">
                          {m.cover_image ? (
                            <img src={m.cover_image} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                              <i className="fas fa-store text-purple-400 text-sm"></i>
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-gray-800">{m.shop_name}</div>
                            <div className="text-xs text-gray-400">{m.phone}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <div className="text-gray-600">{cat?.name || '-'}</div>
                        <div className="text-xs text-gray-400">{m.district || '-'}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${s.color}`}>{s.label}</span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleToggle(m.id, 'is_visible', !m.is_visible)}
                          className={`w-10 h-5 rounded-full transition-colors relative ${m.is_visible !== false ? 'bg-green-400' : 'bg-gray-200'}`}
                        >
                          <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${m.is_visible !== false ? 'translate-x-5' : 'translate-x-0.5'}`} />
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center hidden sm:table-cell">
                        <button
                          onClick={() => handleToggle(m.id, 'is_featured', !m.is_featured)}
                          className={m.is_featured ? 'text-yellow-500' : 'text-gray-300 hover:text-yellow-400'}
                        >
                          <i className="fas fa-star"></i>
                        </button>
                      </td>
                      <td className="px-4 py-3 text-center hidden sm:table-cell">
                        <button
                          onClick={() => handleToggle(m.id, 'is_top', !m.is_top)}
                          className={m.is_top ? 'text-red-500' : 'text-gray-300 hover:text-red-400'}
                        >
                          <i className="fas fa-thumbtack"></i>
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => openEdit(m)}
                            className="text-xs px-2.5 py-1 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                          >
                            编辑
                          </button>
                          <button
                            onClick={() => handleDelete(m.id)}
                            className="text-xs px-2.5 py-1 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                          >
                            删除
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-sm">
            <span className="text-gray-500">第 {page} / {totalPages} 页</span>
            <div className="flex space-x-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
                className="px-3 py-1 rounded-lg border text-gray-600 disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                上一页
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
                className="px-3 py-1 rounded-lg border text-gray-600 disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 新增/编辑弹窗 */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black bg-opacity-40"
              onClick={() => setModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              className="relative bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
            >
              <h3 className="text-lg font-bold text-gray-800 mb-5">
                {editingId ? '编辑商家' : '新增商家'}
              </h3>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">店名 *</label>
                    <input value={form.shop_name} onChange={(e) => setForm({ ...form, shop_name: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-300 outline-none" placeholder="商家名称" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">电话 *</label>
                    <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-300 outline-none" placeholder="联系电话" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">地址 *</label>
                  <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-300 outline-none" placeholder="详细地址" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">分类</label>
                    <select value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-300 outline-none">
                      <option value="">选择分类</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">区域</label>
                    <select value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-300 outline-none">
                      <option value="">选择区域</option>
                      {districts.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                      {!districts.length && ['船营区', '昌邑区', '丰满区', '高新区'].map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">简介</label>
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={2} className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-300 outline-none resize-none" placeholder="商家简介" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">营业时间</label>
                    <input value={form.open_hours} onChange={(e) => setForm({ ...form, open_hours: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-300 outline-none" placeholder="09:00-22:00" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">排序权重</label>
                    <input type="number" value={form.sort_weight} onChange={(e) => setForm({ ...form, sort_weight: Number(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-300 outline-none" placeholder="0" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">标签（逗号分隔）</label>
                  <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-300 outline-none" placeholder="热门, 新店, 口碑好" />
                </div>

                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">封面图 URL</label>
                  <input value={form.cover_image} onChange={(e) => setForm({ ...form, cover_image: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-300 outline-none" placeholder="https://..." />
                </div>

                <div className="flex items-center space-x-6 pt-1">
                  {([
                    { key: 'is_visible', label: '上架显示' },
                    { key: 'is_featured', label: '推荐商家' },
                    { key: 'is_top', label: '置顶商家' },
                  ] as const).map(({ key, label }) => (
                    <label key={key} className="flex items-center space-x-2 cursor-pointer">
                      <input type="checkbox" checked={form[key]}
                        onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
                        className="w-4 h-4 text-purple-600 rounded" />
                      <span className="text-sm text-gray-600">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {msg && (
                <div className={`mt-4 p-3 rounded-xl text-sm ${msg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                  {msg.text}
                </div>
              )}

              <div className="flex space-x-3 mt-6">
                <button onClick={() => setModalOpen(false)}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors text-sm">
                  取消
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:bg-purple-300 transition-colors text-sm font-medium">
                  {saving ? <i className="fas fa-circle-notch fa-spin mr-2"></i> : null}
                  {saving ? '保存中...' : '保存'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminMerchants;
