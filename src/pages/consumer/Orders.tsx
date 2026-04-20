import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../supabase/client';
import { Link } from 'react-router-dom';

interface OrderItem {
  id: number;
  menu_id: number;
  quantity: number;
  price: number;
  menu?: {
    name: string;
    image: string | null;
  };
}

interface Order {
  id: number;
  merchant_id: number;
  total_amount: number;
  status: string;
  created_at: string;
  address: string;
  phone: string;
  note: string | null;
  merchant?: {
    shop_name: string;
    cover_image: string | null;
  };
  items?: OrderItem[];
}

const statusConfig: Record<string, { label: string; color: string; icon: string; bgColor: string }> = {
  pending: { label: '待支付', color: 'text-orange-500', icon: 'fa-clock', bgColor: 'bg-orange-50' },
  paid: { label: '已支付', color: 'text-blue-500', icon: 'fa-check-circle', bgColor: 'bg-blue-50' },
  delivering: { label: '配送中', color: 'text-purple-500', icon: 'fa-motorcycle', bgColor: 'bg-purple-50' },
  completed: { label: '已完成', color: 'text-green-500', icon: 'fa-check-double', bgColor: 'bg-green-50' },
  cancelled: { label: '已取消', color: 'text-gray-500', icon: 'fa-times-circle', bgColor: 'bg-gray-50' },
};

const Orders: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('orders')
        .select('*, merchant:merchants(shop_name, cover_image)')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrderDetail = async (orderId: number) => {
    setDetailLoading(true);
    try {
      const { data, error } = await supabase
        .from('order_items')
        .select('*, menu:menus(name, image)')
        .eq('order_id', orderId);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Failed to fetch order items:', error);
      return [];
    } finally {
      setDetailLoading(false);
    }
  };

  const handleOrderClick = async (order: Order) => {
    const items = await fetchOrderDetail(order.id);
    setSelectedOrder({ ...order, items });
  };

  const handlePay = async (orderId: number) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'paid', updated_at: new Date().toISOString() })
        .eq('id', orderId);
      
      if (error) throw error;
      
      setOrders(prev => prev.map(o => 
        o.id === orderId ? { ...o, status: 'paid' } : o
      ));
      
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status: 'paid' } : null);
      }
    } catch (error) {
      console.error('Payment failed:', error);
      alert('支付失败');
    }
  };

  const handleCancel = async (orderId: number) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', orderId);
      
      if (error) throw error;
      
      setOrders(prev => prev.map(o => 
        o.id === orderId ? { ...o, status: 'cancelled' } : o
      ));
      
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status: 'cancelled' } : null);
      }
    } catch (error) {
      console.error('Cancel failed:', error);
      alert('取消失败');
    }
  };

  const handleReorder = async (order: Order) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        alert('请先登录');
        return;
      }

      const newOrder = {
        user_id: session.user.id,
        merchant_id: order.merchant_id,
        total_amount: order.total_amount,
        status: 'pending',
        address: order.address,
        phone: order.phone,
        note: order.note,
      };

      const { data: createdOrder, error } = await supabase
        .from('orders')
        .insert(newOrder)
        .select()
        .single();

      if (error) throw error;

      if (order.items && order.items.length > 0) {
        const newItems = order.items.map(item => ({
          order_id: createdOrder.id,
          menu_id: item.menu_id,
          quantity: item.quantity,
          price: item.price,
        }));

        await supabase.from('order_items').insert(newItems);
      }

      fetchOrders();
      alert('已重新下单');
    } catch (error) {
      console.error('Reorder failed:', error);
      alert('重新下单失败');
    }
  };

  const filteredOrders = activeTab === 'all' 
    ? orders 
    : orders.filter(order => order.status === activeTab);

  const tabs = [
    { key: 'all', label: '全部' },
    { key: 'pending', label: '待支付' },
    { key: 'paid', label: '待配送' },
    { key: 'delivering', label: '配送中' },
    { key: 'completed', label: '已完成' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white sticky top-0 z-10 shadow-sm">
        <div className="flex items-center px-4 py-3 border-b">
          <Link to="/" className="text-gray-600 hover:text-gray-800">
            <i className="fas fa-arrow-left"></i>
          </Link>
          <h1 className="flex-1 text-center font-semibold text-lg">我的订单</h1>
          <div className="w-6"></div>
        </div>
        <div className="flex border-b">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.key ? 'text-blue-500 border-b-2 border-blue-500' : 'text-gray-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-3">
        <AnimatePresence>
          {filteredOrders.map(order => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-xl shadow-sm overflow-hidden cursor-pointer"
              onClick={() => handleOrderClick(order)}
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                      {order.merchant?.cover_image ? (
                        <img src={order.merchant.cover_image} className="w-full h-full object-cover" />
                      ) : (
                        <i className="fas fa-store text-gray-400"></i>
                      )}
                    </div>
                    <span className="font-medium text-gray-800">{order.merchant?.shop_name || '商家'}</span>
                  </div>
                  <span className={`text-sm ${statusConfig[order.status]?.color || 'text-gray-500'}`}>
                    <i className={`fas ${statusConfig[order.status]?.icon || 'fa-circle'} mr-1`}></i>
                    {statusConfig[order.status]?.label || order.status}
                  </span>
                </div>
                <div className="text-sm text-gray-500 mb-2">{order.address}</div>
                <div className="flex items-center justify-between pt-3 border-t">
                  <span className="text-xs text-gray-400">
                    {new Date(order.created_at).toLocaleDateString()}
                  </span>
                  <span className="font-semibold text-lg">¥{order.total_amount.toFixed(2)}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12">
            <i className="fas fa-inbox text-6xl text-gray-200 mb-4"></i>
            <p className="text-gray-500">暂无订单</p>
          </div>
        )}
      </div>

      {selectedOrder && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center"
          onClick={() => setSelectedOrder(null)}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">订单详情</h2>
                <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600">
                  <i className="fas fa-times"></i>
                </button>
              </div>

              <div className={`p-4 rounded-xl mb-4 ${statusConfig[selectedOrder.status]?.bgColor || 'bg-gray-50'}`}>
                <div className="flex items-center space-x-3">
                  <i className={`fas ${statusConfig[selectedOrder.status]?.icon || 'fa-circle'} text-2xl ${statusConfig[selectedOrder.status]?.color || 'text-gray-500'}`}></i>
                  <div>
                    <p className={`font-medium ${statusConfig[selectedOrder.status]?.color || 'text-gray-700'}`}>
                      {statusConfig[selectedOrder.status]?.label || selectedOrder.status}
                    </p>
                    <p className="text-sm text-gray-500">订单号: #{selectedOrder.id}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 mb-4">
                <p className="text-sm text-gray-600 mb-1">商家</p>
                <p className="font-medium">{selectedOrder.merchant?.shop_name || '商家'}</p>
              </div>

              <div className="border-t pt-4 mb-4">
                <p className="text-sm text-gray-600 mb-2">商品列表</p>
                {detailLoading ? (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                  </div>
                ) : selectedOrder.items && selectedOrder.items.length > 0 ? (
                  <div className="space-y-2">
                    {selectedOrder.items.map(item => (
                      <div key={item.id} className="flex items-center justify-between py-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
                            {item.menu?.image ? (
                              <img src={item.menu.image} className="w-full h-full object-cover" />
                            ) : (
                              <i className="fas fa-utensils text-gray-400 text-xs"></i>
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{item.menu?.name || '商品'}</p>
                            <p className="text-xs text-gray-500">x{item.quantity}</p>
                          </div>
                        </div>
                        <span className="text-sm font-medium">¥{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-sm">暂无商品信息</p>
                )}
              </div>

              <div className="border-t pt-4 mb-4">
                <p className="text-sm text-gray-600 mb-1">配送地址</p>
                <p className="font-medium">{selectedOrder.address}</p>
                <p className="text-sm text-gray-500">{selectedOrder.phone}</p>
              </div>

              {selectedOrder.note && (
                <div className="border-t pt-4 mb-4">
                  <p className="text-sm text-gray-600 mb-1">备注</p>
                  <p className="text-sm">{selectedOrder.note}</p>
                </div>
              )}

              <div className="border-t pt-4 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">订单金额</span>
                  <span className="text-xl font-bold text-blue-500">¥{selectedOrder.total_amount.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex space-x-3 pt-4 border-t">
                {selectedOrder.status === 'pending' && (
                  <>
                    <button
                      onClick={() => handlePay(selectedOrder.id)}
                      className="flex-1 bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      立即支付
                    </button>
                    <button
                      onClick={() => handleCancel(selectedOrder.id)}
                      className="flex-1 bg-gray-100 text-gray-700 py-3 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      取消订单
                    </button>
                  </>
                )}
                {(selectedOrder.status === 'completed' || selectedOrder.status === 'cancelled') && (
                  <button
                    onClick={() => handleReorder(selectedOrder)}
                    className="flex-1 bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    再次购买
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};

export default Orders;
