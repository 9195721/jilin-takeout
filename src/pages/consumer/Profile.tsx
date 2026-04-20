import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../../supabase/client';

interface UserStats {
  orderCount: number;
  favoriteCount: number;
  couponCount: number;
  notificationCount: number;
}

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [stats, setStats] = useState<UserStats>({
    orderCount: 0,
    favoriteCount: 0,
    couponCount: 0,
    notificationCount: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/login');
        return;
      }
      setUser(session.user);

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();
      setProfile(profileData);

      const [{ count: orderCount }, { count: favoriteCount }, { count: couponCount }, { count: notificationCount }] = await Promise.all([
        supabase.from('orders').select('*', { count: 'exact', head: true }).eq('user_id', session.user.id),
        supabase.from('favorites').select('*', { count: 'exact', head: true }).eq('user_id', session.user.id),
        supabase.from('user_coupons').select('*', { count: 'exact', head: true }).eq('user_id', session.user.id).eq('is_used', false),
        supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', session.user.id).eq('is_read', false),
      ]);

      setStats({
        orderCount: orderCount || 0,
        favoriteCount: favoriteCount || 0,
        couponCount: couponCount || 0,
        notificationCount: notificationCount || 0,
      });
    } catch (error) {
      console.error('Failed to fetch user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const menuItems = [
    { icon: 'fa-receipt', label: '我的订单', path: '/orders', count: stats.orderCount },
    { icon: 'fa-heart', label: '我的收藏', path: '/favorites', count: stats.favoriteCount },
    { icon: 'fa-ticket-alt', label: '优惠券', path: '/coupons', count: stats.couponCount },
    { icon: 'fa-bell', label: '消息通知', path: '/notifications', count: stats.notificationCount },
    { icon: 'fa-map-marker-alt', label: '收货地址', path: '/addresses' },
    { icon: 'fa-cog', label: '设置', path: '/settings' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white pt-12 pb-8 px-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center space-x-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg"
            >
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="avatar" className="w-full h-full rounded-full object-cover" />
              ) : (
                <i className="fas fa-user text-3xl text-blue-500"></i>
              )}
            </motion.div>
            <div className="flex-1">
              <h1 className="text-xl font-bold">{profile?.username || user?.email?.split('@')[0] || '用户'}</h1>
              <p className="text-blue-100 text-sm mt-1">{user?.email}</p>
            </div>
          </div>

          <div className="flex justify-around mt-8">
            {[
              { label: '订单', value: stats.orderCount },
              { label: '收藏', value: stats.favoriteCount },
              { label: '优惠券', value: stats.couponCount },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <div className="text-2xl font-bold">{item.value}</div>
                <div className="text-blue-100 text-xs">{item.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 -mt-4">
        <div className="bg-white rounded-2xl shadow-sm">
          {menuItems.map((item, index) => (
            <motion.div
              key={item.path}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                to={item.path}
                className="flex items-center justify-between px-4 py-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                    <i className={`fas ${item.icon} text-blue-500`}></i>
                  </div>
                  <span className="text-gray-800 font-medium">{item.label}</span>
                </div>
                <div className="flex items-center space-x-2">
                  {item.count > 0 && (
                    <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">{item.count}</span>
                  )}
                  <i className="fas fa-chevron-right text-gray-300 text-sm"></i>
                </div>
              </Link>
              {index < menuItems.length - 1 && <div className="border-b border-gray-100 mx-4"></div>}
            </motion.div>
          ))}
        </div>

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleLogout}
          className="w-full mt-6 bg-white text-red-500 py-4 rounded-2xl font-medium shadow-sm hover:bg-red-50 transition-colors"
        >
          退出登录
        </motion.button>
      </div>
    </div>
  );
};

export default Profile;
