import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabase/client';
import type { Tables } from '../../supabase/types';

type Notification = Tables<'notifications'>;

interface GroupedNotifications {
  today: Notification[];
  yesterday: Notification[];
  earlier: Notification[];
}

const Notifications: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;

      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      setNotifications(data || []);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: number) => {
    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', id);

    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, is_read: true } : n)
    );
  };

  const markAllAsRead = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', session.user.id)
      .eq('is_read', false);

    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const deleteNotification = async (id: number) => {
    await supabase.from('notifications').delete().eq('id', id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;

    await supabase
      .from('notifications')
      .delete()
      .eq('user_id', session.user.id);

    setNotifications([]);
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }

    switch (notification.type) {
      case 'order':
        navigate('/orders');
        break;
      case 'review':
        navigate('/reviews');
        break;
      case 'coupon':
        navigate('/coupons');
        break;
      default:
        break;
    }
  };

  const getNotificationIcon = (type: string | null) => {
    switch (type) {
      case 'order': return 'fa-shopping-bag';
      case 'review': return 'fa-comment';
      case 'coupon': return 'fa-ticket-alt';
      default: return 'fa-bell';
    }
  };

  const getNotificationColor = (type: string | null) => {
    switch (type) {
      case 'order': return 'bg-blue-100 text-blue-600';
      case 'review': return 'bg-green-100 text-green-600';
      case 'coupon': return 'bg-orange-100 text-orange-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const groupNotifications = (): GroupedNotifications => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    return {
      today: notifications.filter(n => new Date(n.created_at || '') >= today),
      yesterday: notifications.filter(n => {
        const date = new Date(n.created_at || '');
        return date >= yesterday && date < today;
      }),
      earlier: notifications.filter(n => new Date(n.created_at || '') < yesterday)
    };
  };

  const formatTime = (dateStr: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  const filteredNotifications = filter === 'unread'
    ? notifications.filter(n => !n.is_read)
    : notifications;

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const grouped = groupNotifications();

  const renderGroup = (title: string, items: Notification[]) => {
    if (items.length === 0) return null;
    return (
      <div key={title} className="mb-4">
        <h3 className="text-xs font-medium text-gray-400 px-4 py-2">{title}</h3>
        <div className="space-y-2 px-4">
          {items.map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              onClick={() => handleNotificationClick(notification)}
              className={`bg-white rounded-xl p-4 shadow-sm cursor-pointer transition-all ${
                notification.is_read ? 'opacity-60' : 'border-l-4 border-blue-500'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getNotificationColor(notification.type)}`}>
                  <i className={`fas ${getNotificationIcon(notification.type)}`}></i>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-800 truncate">{notification.title}</h3>
                    {!notification.is_read && (
                      <span className="w-2 h-2 bg-red-500 rounded-full ml-2"></span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">{notification.content}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-400">{formatTime(notification.created_at)}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteNotification(notification.id);
                      }}
                      className="text-xs text-gray-400 hover:text-red-500 px-2 py-1"
                    >
                      删除
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-800">消息通知</h1>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-500 hover:text-blue-600 font-medium px-3 py-1"
                >
                  全部已读
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="text-sm text-red-500 hover:text-red-600 font-medium px-3 py-1"
                >
                  清空
                </button>
              )}
            </div>
          </div>
          <div className="flex space-x-4 mt-4">
            <button
              onClick={() => setFilter('all')}
              className={`text-sm font-medium pb-2 border-b-2 transition-colors ${
                filter === 'all' ? 'border-blue-500 text-blue-500' : 'border-transparent text-gray-500'
              }`}
            >
              全部
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`text-sm font-medium pb-2 border-b-2 transition-colors ${
                filter === 'unread' ? 'border-blue-500 text-blue-500' : 'border-transparent text-gray-500'
              }`}
            >
              未读 {unreadCount > 0 && `(${unreadCount})`}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto py-4">
        <AnimatePresence>
          {filteredNotifications.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <i className="fas fa-bell-slash text-6xl text-gray-200 mb-4"></i>
              <p className="text-gray-400">暂无通知</p>
            </motion.div>
          ) : (
            <>
              {renderGroup('今天', grouped.today)}
              {renderGroup('昨天', grouped.yesterday)}
              {renderGroup('更早', grouped.earlier)}
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Notifications;
