import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../supabase/client';

type MemberLevel = { id: number; name: string; color: string | null };
type UserProfile = {
  id: string;
  username: string | null;
  phone: string | null;
  role: string | null;
  status: string | null;
  member_level_id: number | null;
  banned_reason: string | null;
  avatar_url: string | null;
  created_at: string | null;
};
type FavoriteItem = { id: number; created_at: string | null; merchant: { shop_name: string } | null };

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [levels, setLevels] = useState<MemberLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 15;

  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [drawerLoading, setDrawerLoading] = useState(false);

  const [banReason, setBanReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [uRes, lRes] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('member_levels').select('id, name, color'),
    ]);
    setUsers(uRes.data || []);
    setLevels(lRes.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const filtered = users.filter((u) => {
    const matchSearch = !search || (u.username || '').includes(search) || (u.phone || '').includes(search);
    const matchRole = filterRole === 'all' || u.role === filterRole;
    return matchSearch && matchRole;
  });

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);

  const openDrawer = async (u: UserProfile) => {
    setSelectedUser(u);
    setBanReason(u.banned_reason || '');
    setDrawerOpen(true);
    setDrawerLoading(true);
    const { data } = await supabase
      .from('favorites')
      .select('id, created_at, merchant:merchant_id(shop_name)')
      .eq('user_id', u.id)
      .order('created_at', { ascending: false })
      .limit(20);
    setFavorites((data as any) || []);
    setDrawerLoading(false);
  };

  const handleUpdateLevel = async (userId: string, levelId: number | null) => {
    setSaving(true);
    const { error } = await supabase.from('profiles').update({ member_level_id: levelId }).eq('id', userId);
    setSaving(false);
    if (error) { setMsg({ type: 'error', text: error.message }); return; }
    setMsg({ type: 'success', text: '等级已更新' });
    setSelectedUser(prev => prev ? { ...prev, member_level_id: levelId } : null);
    fetchAll();
  };

  const handleToggleBan = async (u: UserProfile) => {
    const isBanned = u.status === 'banned';
    if (!isBanned && !banReason.trim()) {
      setMsg({ type: 'error', text: '禁用时请填写原因' });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('profiles').update({
      status: isBanned ? 'active' : 'banned',
      banned_reason: isBanned ? null : banReason,
    }).eq('id', u.id);
    setSaving(false);
    if (error) { setMsg({ type: 'error', text: error.message }); return; }
    setMsg({ type: 'success', text: isBanned ? '已解禁' : '已禁用' });
    const updated = { ...u, status: isBanned ? 'active' : 'banned', banned_reason: isBanned ? null : banReason };
    setSelectedUser(updated);
    fetchAll();
  };

  const roleMap: Record<string, { label: string; color: string }> = {
    user: { label: '用户', color: 'bg-blue-100 text-blue-700' },
    merchant: { label: '商家', color: 'bg-green-100 text-green-700' },
    admin: { label: '管理员', color: 'bg-purple-100 text-purple-700' },
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">会员管理</h1>
          <p className="text-sm text-gray-500 mt-0.5">共 {filtered.length} 名用户</p>
        </div>
      </div>

      <AnimatePresence>
        {msg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            onAnimationComplete={() => setTimeout(() => setMsg(null), 2500)}
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
          <input type="text" placeholder="搜索用户名、手机号..." value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-3 py-2 bg-gray-50 rounded-xl text-sm border-0 focus:ring-2 focus:ring-purple-300 outline-none" />
        </div>
        <select value={filterRole} onChange={(e) => { setFilterRole(e.target.value); setPage(1); }}
          className="px-3 py-2 bg-gray-50 rounded-xl text-sm border-0 focus:ring-2 focus:ring-purple-300 outline-none">
          <option value="all">全部角色</option>
          <option value="user">普通用户</option>
          <option value="merchant">商家</option>
          <option value="admin">管理员</option>
        </select>
      </div>

      {/* 用户表格 */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">
            <i className="fas fa-circle-notch fa-spin text-3xl mb-3"></i>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">用户</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">手机号</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">角色</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">会员等级</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">状态</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-600">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginated.map((u) => {
                  const r = roleMap[u.role || ''] || { label: u.role || '-', color: 'bg-gray-100 text-gray-600' };
                  const lv = levels.find(l => l.id === u.member_level_id);
                  const isBanned = u.status === 'banned';
                  return (
                    <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center space-x-3">
                          {u.avatar_url ? (
                            <img src={u.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                              <i className="fas fa-user text-xs"></i>
                            </div>
                          )}
                          <span className="font-medium text-gray-800">{u.username || '未设置'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{u.phone || '-'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${r.color}`}>{r.label}</span>
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        {lv ? <span className="px-2 py-0.5 rounded-full text-xs font-medium text-white" style={{ backgroundColor: lv.color || '#666' }}>{lv.name}</span> : <span className="text-gray-400 text-xs">-</span>}
                      </td>
                      <td className="px-4 py-3">
                        {isBanned
                          ? <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600">已禁用</span>
                          : <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-600">正常</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => openDrawer(u)}
                          className="text-xs px-2.5 py-1 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors">
                          管理
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between text-sm">
            <span className="text-gray-500">第 {page} / {totalPages} 页</span>
            <div className="flex space-x-2">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 rounded-lg border text-gray-600 disabled:opacity-40 hover:bg-gray-50 transition-colors">上一页</button>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 rounded-lg border text-gray-600 disabled:opacity-40 hover:bg-gray-50 transition-colors">下一页</button>
            </div>
          </div>
        )}
      </div>

      {/* 用户详情抽屉 */}
      <AnimatePresence>
        {drawerOpen && selectedUser && (
          <div className="fixed inset-0 z-50 flex justify-end">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black bg-opacity-40" onClick={() => setDrawerOpen(false)} />
            <motion.div initial={{ x: 360 }} animate={{ x: 0 }} exit={{ x: 360 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="relative bg-white w-full max-w-sm h-full overflow-y-auto shadow-2xl">
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-gray-800">用户详情</h3>
                <button onClick={() => setDrawerOpen(false)} className="text-gray-400 hover:text-gray-600">
                  <i className="fas fa-times"></i>
                </button>
              </div>

              <div className="p-5 space-y-5">
                {/* 基本信息 */}
                <div className="flex items-center space-x-4">
                  {selectedUser.avatar_url ? (
                    <img src={selectedUser.avatar_url} alt="" className="w-14 h-14 rounded-full object-cover" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-purple-100 flex items-center justify-center">
                      <i className="fas fa-user text-purple-400 text-xl"></i>
                    </div>
                  )}
                  <div>
                    <div className="font-bold text-gray-800 text-lg">{selectedUser.username || '未设置用户名'}</div>
                    <div className="text-sm text-gray-500">{selectedUser.phone || '未绑定手机'}</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      注册于 {selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString('zh-CN') : '-'}
                    </div>
                  </div>
                </div>

                {/* 会员等级调整 */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="text-sm font-medium text-gray-700 mb-3">会员等级</div>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => handleUpdateLevel(selectedUser.id, null)}
                      className={`px-3 py-1 rounded-full text-xs border transition-colors ${selectedUser.member_level_id === null ? 'bg-gray-200 border-gray-300 text-gray-700 font-medium' : 'border-gray-200 text-gray-500 hover:bg-gray-100'}`}>
                      普通
                    </button>
                    {levels.map(lv => (
                      <button key={lv.id} onClick={() => handleUpdateLevel(selectedUser.id, lv.id)}
                        className={`px-3 py-1 rounded-full text-xs border transition-colors ${selectedUser.member_level_id === lv.id ? 'text-white font-medium' : 'border-gray-200 text-gray-500 hover:bg-gray-100'}`}
                        style={selectedUser.member_level_id === lv.id ? { backgroundColor: lv.color || '#666', borderColor: lv.color || '#666' } : {}}>
                        {lv.name}
                      </button>
                    ))}
                  </div>
                  {saving && <div className="text-xs text-purple-500 mt-2"><i className="fas fa-circle-notch fa-spin mr-1"></i>保存中...</div>}
                </div>

                {/* 禁用/解禁 */}
                <div className="bg-gray-50 rounded-xl p-4">
                  <div className="text-sm font-medium text-gray-700 mb-3">账号状态</div>
                  {selectedUser.status !== 'banned' ? (
                    <>
                      <input value={banReason} onChange={(e) => setBanReason(e.target.value)}
                        placeholder="禁用原因（必填）"
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-red-300 outline-none mb-3" />
                      <button onClick={() => handleToggleBan(selectedUser)}
                        className="w-full py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm hover:bg-red-100 transition-colors">
                        <i className="fas fa-ban mr-2"></i>禁用账号
                      </button>
                    </>
                  ) : (
                    <div>
                      <div className="text-xs text-gray-500 mb-2">禁用原因：{selectedUser.banned_reason || '无'}</div>
                      <button onClick={() => handleToggleBan(selectedUser)}
                        className="w-full py-2 bg-green-50 text-green-600 border border-green-200 rounded-xl text-sm hover:bg-green-100 transition-colors">
                        <i className="fas fa-unlock mr-2"></i>解禁账号
                      </button>
                    </div>
                  )}
                </div>

                {/* 收藏记录 */}
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-3">
                    <i className="fas fa-heart text-red-400 mr-2"></i>收藏记录
                  </div>
                  {drawerLoading ? (
                    <div className="text-center py-4 text-gray-400 text-sm"><i className="fas fa-circle-notch fa-spin mr-2"></i>加载中</div>
                  ) : favorites.length === 0 ? (
                    <div className="text-center py-4 text-gray-400 text-sm">暂无收藏</div>
                  ) : (
                    <div className="space-y-2">
                      {favorites.map(f => (
                        <div key={f.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
                          <span className="text-sm text-gray-700">{(f.merchant as any)?.shop_name || '已删除商家'}</span>
                          <span className="text-xs text-gray-400">{f.created_at ? new Date(f.created_at).toLocaleDateString('zh-CN') : ''}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {msg && (
                  <div className={`p-3 rounded-xl text-sm ${msg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {msg.text}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminUsers;
