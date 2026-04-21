import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../supabase/client';

interface UserStats {
  orderCount: number;
  favoriteCount: number;
  couponCount: number;
}

interface MemberLevel {
  id: number;
  name: string;
  min_views: number;
  color: string;
  icon: string;
}

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<UserStats>({ orderCount: 0, favoriteCount: 0, couponCount: 0 });
  const [loading, setLoading] = useState(true);
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [memberLevels, setMemberLevels] = useState<MemberLevel[]>([]);
  const [currentMerchant, setCurrentMerchant] = useState<any>(null);

  // 编辑资料表单
  const [editForm, setEditForm] = useState({ username: '', avatar_url: '' });
  const [editSaving, setEditSaving] = useState(false);
  const [editMsg, setEditMsg] = useState('');

  // 修改密码表单
  const [pwdForm, setPwdForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdMsg, setPwdMsg] = useState('');

  // 会员转商家表单
  const [merchantForm, setMerchantForm] = useState({ shop_name: '', address: '', phone: '' });
  const [merchantSaving, setMerchantSaving] = useState(false);
  const [merchantMsg, setMerchantMsg] = useState('');

  useEffect(() => {
    fetchUserData();
    fetchMemberLevels();
  }, []);

  const fetchUserData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { setLoading(false); return; }
      setUser(session.user);

      const { data: profileData } = await supabase
        .from('profiles').select('*').eq('id', session.user.id).maybeSingle();
      setProfile(profileData);

      if (profileData?.role === 'merchant') {
        const { data: mData } = await supabase
          .from('merchants').select('*, member_level:member_levels(id,name,color,icon)').eq('user_id', session.user.id).maybeSingle();
        setCurrentMerchant(mData);
      }

      const [{ count: oc }, { count: fc }, { count: cc }] = await Promise.all([
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('user_id', session.user.id),
        supabase.from('favorites').select('*', { count: 'exact', head: true }).eq('user_id', session.user.id),
        supabase.from('user_coupons').select('*', { count: 'exact', head: true }).eq('user_id', session.user.id).eq('is_used', false),
      ]);
      setStats({ orderCount: oc || 0, favoriteCount: fc || 0, couponCount: cc || 0 });
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMemberLevels = async () => {
    const { data } = await supabase.from('member_levels').select('*').order('min_views', { ascending: true });
    if (data) setMemberLevels(data);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  // 编辑资料
  const openEditModal = () => {
    setEditForm({ username: profile?.username || '', avatar_url: profile?.avatar_url || '' });
    setEditMsg('');
    setActiveModal('edit');
  };

  const handleSaveProfile = async () => {
    if (!editForm.username.trim()) { setEditMsg('用户名不能为空'); return; }
    setEditSaving(true);
    setEditMsg('');
    try {
      const { error } = await supabase.from('profiles').update({
        username: editForm.username.trim(),
        avatar_url: editForm.avatar_url.trim(),
      }).eq('id', user.id);
      if (error) throw error;
      setProfile({ ...profile, username: editForm.username.trim(), avatar_url: editForm.avatar_url.trim() });
      setEditMsg('保存成功');
      setTimeout(() => setActiveModal(null), 800);
    } catch (err: any) {
      setEditMsg(err.message || '保存失败');
    } finally {
      setEditSaving(false);
    }
  };

  // 修改密码
  const handleSavePassword = async () => {
    if (!pwdForm.oldPassword) { setPwdMsg('请输入旧密码'); return; }
    if (pwdForm.newPassword.length < 6) { setPwdMsg('新密码至少6位'); return; }
    if (pwdForm.newPassword !== pwdForm.confirmPassword) { setPwdMsg('两次密码不一致'); return; }
    setPwdSaving(true);
    setPwdMsg('');
    try {
      const { error: signInErr } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: pwdForm.oldPassword,
      });
      if (signInErr) { setPwdMsg('旧密码错误'); setPwdSaving(false); return; }

      const { error: updateErr } = await supabase.auth.updateUser({ password: pwdForm.newPassword });
      if (updateErr) throw updateErr;
      setPwdMsg('密码修改成功');
      setPwdForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setActiveModal(null), 800);
    } catch (err: any) {
      setPwdMsg(err.message || '修改失败');
    } finally {
      setPwdSaving(false);
    }
  };

  // 会员转商家
  const openMerchantModal = () => {
    setMerchantForm({ shop_name: '', address: '', phone: profile?.phone || '' });
    setMerchantMsg('');
    setActiveModal('merchant');
  };

  const handleApplyMerchant = async () => {
    if (!merchantForm.shop_name.trim()) { setMerchantMsg('请输入店铺名称'); return; }
    if (!merchantForm.address.trim()) { setMerchantMsg('请输入地址'); return; }
    if (!merchantForm.phone.trim()) { setMerchantMsg('请输入手机号'); return; }
    setMerchantSaving(true);
    setMerchantMsg('');
    try {
      const { error: mErr } = await supabase.from('merchants').insert([{
        user_id: user.id,
        shop_name: merchantForm.shop_name.trim(),
        address: merchantForm.address.trim(),
        phone: merchantForm.phone.trim(),
        status: 'pending',
      }]);
      if (mErr) throw mErr;
      await supabase.from('profiles').update({ role: 'merchant' }).eq('id', user.id);
      setMerchantMsg('申请已提交，等待审核');
      setProfile({ ...profile, role: 'merchant' });
      setTimeout(() => { setActiveModal(null); fetchUserData(); }, 1000);
    } catch (err: any) {
      setMerchantMsg(err.message || '申请失败');
    } finally {
      setMerchantSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900">
        <div className="w-10 h-10 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 px-4">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white/15 backdrop-blur-[40px] backdrop-saturate-[180%] rounded-2xl p-8 border border-white/30 text-center max-w-sm w-full">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4"><i className="fas fa-user-lock text-2xl text-white/70"></i></div>
          <h2 className="text-lg font-bold text-white mb-2">尚未登录</h2>
          <p className="text-white/60 text-sm mb-6">登录后查看个人中心</p>
          <div className="flex space-x-3">
            <Link to="/login" className="flex-1 bg-white/20 text-white py-3 rounded-xl font-medium border border-white/30 hover:bg-white/30 transition-colors">登录</Link>
            <Link to="/register" className="flex-1 bg-white/10 text-white py-3 rounded-xl font-medium border border-white/20 hover:bg-white/20 transition-colors">注册</Link>
          </div>
        </motion.div>
      </div>
    );
  }

  const menuItems = [
    { icon: 'fa-pen', label: '编辑个人资料', color: 'from-blue-400 to-cyan-400', action: 'edit' },
    { icon: 'fa-receipt', label: '我的订单', color: 'from-orange-400 to-amber-400', path: '/orders', count: stats.orderCount },
    { icon: 'fa-heart', label: '我的收藏', color: 'from-pink-400 to-rose-400', path: '/favorites', count: stats.favoriteCount },
    { icon: 'fa-ticket-alt', label: '我的优惠券', color: 'from-green-400 to-emerald-400', path: '/coupons', count: stats.couponCount },
    { icon: 'fa-map-marker-alt', label: '收货地址管理', color: 'from-red-400 to-pink-400', path: '/addresses' },
    { icon: 'fa-key', label: '修改密码', color: 'from-yellow-400 to-orange-400', action: 'password' },
    { icon: 'fa-store', label: '会员转商家', color: 'from-purple-400 to-indigo-400', action: 'merchant', hidden: profile?.role === 'merchant' },
    { icon: 'fa-crown', label: '商家会员等级', color: 'from-amber-400 to-yellow-400', action: 'level' },
  ];

  const filteredMenu = menuItems.filter(item => !item.hidden);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 px-4 pt-6 pb-28">
      {/* 用户信息卡片 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/15 backdrop-blur-[40px] backdrop-saturate-[180%] rounded-2xl p-6 border border-white/30 mb-6 shadow-[0_16px_48px_rgba(0,0,0,0.2)]"
      >
        <div className="flex items-center space-x-4">
          <motion.div whileTap={{ scale: 0.95 }} className="relative" onClick={openEditModal}>
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400/80 to-purple-500/80 flex items-center justify-center border-2 border-white/30 shadow-lg overflow-hidden">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <i className="fas fa-user text-3xl text-white"></i>
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-white/30 backdrop-blur rounded-full flex items-center justify-center border border-white/40">
              <i className="fas fa-camera text-[10px] text-white"></i>
            </div>
          </motion.div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-white truncate">{profile?.username || user?.email?.split('@')[0] || '用户'}</h1>
            <p className="text-white/50 text-sm mt-1">{profile?.phone || user?.email}</p>
            <div className="flex items-center mt-2">
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${profile?.role === 'merchant' ? 'bg-purple-500/30 text-purple-300 border border-purple-400/30' : 'bg-green-500/30 text-green-300 border border-green-400/30'}`}>
                {profile?.role === 'merchant' ? '商家' : '普通用户'}
              </span>
              {currentMerchant?.member_level && (
                <span className="ml-2 px-2.5 py-0.5 rounded-full text-xs font-medium text-white border" style={{ backgroundColor: currentMerchant.member_level.color + '40', borderColor: currentMerchant.member_level.color + '60' }}>
                  {currentMerchant.member_level.icon} {currentMerchant.member_level.name}
                </span>
              )}
            </div>
          </div>
          <button onClick={openEditModal} className="p-2.5 bg-white/10 rounded-xl border border-white/20 hover:bg-white/20 transition-colors">
            <i className="fas fa-pen text-white/70 text-sm"></i>
          </button>
        </div>

        {/* 统计数据 */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-5 border-t border-white/10">
          {[
            { label: '订单', value: stats.orderCount, icon: 'fa-receipt' },
            { label: '收藏', value: stats.favoriteCount, icon: 'fa-heart' },
            { label: '优惠券', value: stats.couponCount, icon: 'fa-ticket-alt' },
          ].map(item => (
            <Link to={item.label === '订单' ? '/orders' : item.label === '收藏' ? '/favorites' : '/coupons'} key={item.label} className="text-center group">
              <div className="text-2xl font-bold text-white group-hover:text-white/80 transition-colors">{item.value}</div>
              <div className="text-white/50 text-xs mt-1">{item.label}</div>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* 功能菜单 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white/10 backdrop-blur-[40px] backdrop-saturate-[180%] rounded-2xl border border-white/30 overflow-hidden mb-6"
      >
        {filteredMenu.map((item, index) => (
          <React.Fragment key={item.label}>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * index }}
            >
              {item.path ? (
                <Link to={item.path} className="flex items-center justify-between px-4 py-3.5 hover:bg-white/10 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg`}>
                      <i className={`fas ${item.icon} text-white text-sm`}></i>
                    </div>
                    <span className="text-white font-medium text-sm">{item.label}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {item.count > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-medium">{item.count}</span>}
                    <i className="fas fa-chevron-right text-white/30 text-xs"></i>
                  </div>
                </Link>
              ) : (
                <button onClick={() => item.action === 'edit' ? openEditModal() : item.action === 'password' ? setActiveModal('password') : item.action === 'merchant' ? openMerchantModal() : setActiveModal('level')} className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-white/10 transition-colors">
                  <div className="flex items-center space-x-3">
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center shadow-lg`}>
                      <i className={`fas ${item.icon} text-white text-sm`}></i>
                    </div>
                    <span className="text-white font-medium text-sm">{item.label}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {item.label === '会员转商家' && <span className="text-white/30 text-xs">升级</span>}
                    {item.label === '商家会员等级' && currentMerchant?.member_level && <span className="text-white/30 text-xs">{currentMerchant.member_level.name}</span>}
                    <i className="fas fa-chevron-right text-white/30 text-xs"></i>
                  </div>
                </button>
              )}
            </motion.div>
            {index < filteredMenu.length - 1 && <div className="border-b border-white/10 mx-4"></div>}
          </React.Fragment>
        ))}
      </motion.div>

      {/* 退出登录 */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={handleLogout}
        className="w-full bg-red-500/15 backdrop-blur border border-red-500/25 text-red-400 py-4 rounded-2xl font-medium hover:bg-red-500/25 transition-colors"
      >
        退出登录
      </motion.button>

      {/* ===== 弹窗区域 ===== */}
      <AnimatePresence>
        {activeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-4"
            onClick={() => setActiveModal(null)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="bg-white/15 backdrop-blur-[40px] backdrop-saturate-[180%] rounded-2xl border border-white/30 p-6 w-full max-w-sm shadow-[0_16px_48px_rgba(0,0,0,0.3)]"
              onClick={e => e.stopPropagation()}
            >
              {/* 弹窗标题 */}
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-white">
                  {activeModal === 'edit' && '编辑个人资料'}
                  {activeModal === 'password' && '修改密码'}
                  {activeModal === 'merchant' && '申请成为商家'}
                  {activeModal === 'level' && '商家会员等级'}
                </h2>
                <button onClick={() => setActiveModal(null)} className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
                  <i className="fas fa-times text-white/60"></i>
                </button>
              </div>

              {/* 编辑资料 */}
              {activeModal === 'edit' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-white/60 mb-1.5">用户名</label>
                    <input value={editForm.username} onChange={e => { setEditForm({ ...editForm, username: e.target.value }); setEditMsg(''); }} className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-white/40 transition-colors" placeholder="输入用户名" />
                  </div>
                  <div>
                    <label className="block text-sm text-white/60 mb-1.5">头像链接</label>
                    <input value={editForm.avatar_url} onChange={e => { setEditForm({ ...editForm, avatar_url: e.target.value }); setEditMsg(''); }} className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-white/40 transition-colors" placeholder="输入头像图片URL" />
                  </div>
                  <div>
                    <label className="block text-sm text-white/60 mb-1.5">手机号</label>
                    <input value={profile?.phone || ''} readOnly className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white/40 cursor-not-allowed" />
                  </div>
                  {editMsg && <p className={`text-sm ${editMsg === '保存成功' ? 'text-green-400' : 'text-red-400'}`}>{editMsg}</p>}
                  <button onClick={handleSaveProfile} disabled={editSaving} className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center space-x-2">
                    {editSaving ? <><i className="fas fa-circle-notch fa-spin"></i><span>保存中</span></> : <span>保存</span>}
                  </button>
                </div>
              )}

              {/* 修改密码 */}
              {activeModal === 'password' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-white/60 mb-1.5">旧密码</label>
                    <input type="password" value={pwdForm.oldPassword} onChange={e => { setPwdForm({ ...pwdForm, oldPassword: e.target.value }); setPwdMsg(''); }} className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-white/40 transition-colors" placeholder="输入旧密码" />
                  </div>
                  <div>
                    <label className="block text-sm text-white/60 mb-1.5">新密码</label>
                    <input type="password" value={pwdForm.newPassword} onChange={e => { setPwdForm({ ...pwdForm, newPassword: e.target.value }); setPwdMsg(''); }} className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-white/40 transition-colors" placeholder="至少6位新密码" />
                  </div>
                  <div>
                    <label className="block text-sm text-white/60 mb-1.5">确认新密码</label>
                    <input type="password" value={pwdForm.confirmPassword} onChange={e => { setPwdForm({ ...pwdForm, confirmPassword: e.target.value }); setPwdMsg(''); }} className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-white/40 transition-colors" placeholder="再次输入新密码" />
                  </div>
                  {pwdMsg && <p className={`text-sm ${pwdMsg === '密码修改成功' ? 'text-green-400' : 'text-red-400'}`}>{pwdMsg}</p>}
                  <button onClick={handleSavePassword} disabled={pwdSaving} className="w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center space-x-2">
                    {pwdSaving ? <><i className="fas fa-circle-notch fa-spin"></i><span>修改中</span></> : <span>确认修改</span>}
                  </button>
                </div>
              )}

              {/* 会员转商家 */}
              {activeModal === 'merchant' && (
                <div className="space-y-4">
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-amber-300 text-xs">
                    <i className="fas fa-info-circle mr-1"></i>提交后将进入审核流程，审核通过即可成为商家
                  </div>
                  <div>
                    <label className="block text-sm text-white/60 mb-1.5">店铺名称</label>
                    <input value={merchantForm.shop_name} onChange={e => { setMerchantForm({ ...merchantForm, shop_name: e.target.value }); setMerchantMsg(''); }} className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-white/40 transition-colors" placeholder="输入店铺名称" />
                  </div>
                  <div>
                    <label className="block text-sm text-white/60 mb-1.5">店铺地址</label>
                    <input value={merchantForm.address} onChange={e => { setMerchantForm({ ...merchantForm, address: e.target.value }); setMerchantMsg(''); }} className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-white/40 transition-colors" placeholder="输入详细地址" />
                  </div>
                  <div>
                    <label className="block text-sm text-white/60 mb-1.5">联系电话</label>
                    <input value={merchantForm.phone} onChange={e => { setMerchantForm({ ...merchantForm, phone: e.target.value }); setMerchantMsg(''); }} className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-white/40 transition-colors" placeholder="输入联系电话" />
                  </div>
                  {merchantMsg && <p className={`text-sm ${merchantMsg.includes('成功') ? 'text-green-400' : 'text-red-400'}`}>{merchantMsg}</p>}
                  <button onClick={handleApplyMerchant} disabled={merchantSaving} className="w-full py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center space-x-2">
                    {merchantSaving ? <><i className="fas fa-circle-notch fa-spin"></i><span>提交中</span></> : <span>提交申请</span>}
                  </button>
                </div>
              )}

              {/* 商家会员等级 */}
              {activeModal === 'level' && (
                <div>
                  {profile?.role !== 'merchant' ? (
                    <div className="text-center py-4">
                      <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3"><i className="fas fa-store-slash text-2xl text-white/30"></i></div>
                      <p className="text-white/60 text-sm mb-4">您还不是商家，入驻后可查看等级</p>
                      <button onClick={() => { setActiveModal(null); setTimeout(() => openMerchantModal(), 300); }} className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-xl text-sm font-medium">申请成为商家</button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {memberLevels.length === 0 ? (
                        <p className="text-white/50 text-sm text-center py-4">暂无等级数据</p>
                      ) : (
                        memberLevels.map((level) => {
                          const isCurrent = currentMerchant?.member_level_id === level.id;
                          return (
                            <motion.div
                              key={level.id}
                              whileHover={{ scale: 1.02 }}
                              className={`flex items-center space-x-3 p-3.5 rounded-xl border transition-all ${isCurrent ? 'bg-white/15 border-white/40 shadow-lg' : 'bg-white/5 border-white/10'}`}
                            >
                              <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl" style={{ backgroundColor: level.color + '30' }}>
                                {level.icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center">
                                  <span className="font-bold text-white text-sm">{level.name}</span>
                                  {isCurrent && <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] bg-white/20 text-white font-medium">当前</span>}
                                </div>
                                <p className="text-white/40 text-xs mt-0.5">浏览量 ≥ {level.min_views}</p>
                              </div>
                              <div className="w-3 h-3 rounded-full border-2" style={{ borderColor: level.color, backgroundColor: isCurrent ? level.color : 'transparent' }}></div>
                            </motion.div>
                          );
                        })
                      )}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Profile;
