import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { supabase } from './supabase/client';
import type { Session } from '@supabase/supabase-js';
import ErrorBoundary from './components/ErrorBoundary';

// 页面组件
import ConsumerHome from './pages/consumer/Home';
import ConsumerCategories from './pages/consumer/Categories';
import ConsumerMerchants from './pages/consumer/Merchants';
import ConsumerMerchantDetail from './pages/consumer/MerchantDetail';
import ConsumerSearch from './pages/consumer/Search';
import ConsumerProfile from './pages/consumer/Profile';
import ConsumerOrders from './pages/consumer/Orders';
import ConsumerFavorites from './pages/consumer/Favorites';
import ConsumerCoupons from './pages/consumer/Coupons';
import ConsumerNotifications from './pages/consumer/Notifications';
import ConsumerReviews from './pages/consumer/Reviews';
import BrandMerchants from './pages/consumer/BrandMerchants';
import MerchantDashboard from './pages/merchant/Dashboard';
import MerchantShopInfo from './pages/merchant/ShopInfo';
import MerchantMenuManage from './pages/merchant/MenuManage';
import MerchantStats from './pages/merchant/Stats';
import AdminDashboard from './pages/admin/Dashboard';
import AdminMerchantAudit from './pages/admin/MerchantAudit';
import AdminCategoryManage from './pages/admin/CategoryManage';
import AdminMemberLevels from './pages/admin/MemberLevels';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';

// 布局组件
import ConsumerLayout from './layouts/ConsumerLayout';
import MerchantLayout from './layouts/MerchantLayout';
import AdminLayout from './layouts/AdminLayout';

// 受保护路由组件
interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'user' | 'merchant' | 'admin';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRole }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchUserRole(session.user.id);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchUserRole(session.user.id);
      } else {
        setUserRole(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserRole = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle();
      setUserRole(data?.role || null);
    } catch (error) {
      console.error('Failed to fetch user role:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && userRole !== requiredRole) {
    // 如果角色不匹配，直接拦截并提示或重定向
    // 这里我们选择重定向到该角色对应的首页，防止用户误入
    if (userRole === 'merchant') return <Navigate to="/merchant/dashboard" replace />;
    if (userRole === 'admin') return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// 主应用组件
const AppContent: React.FC = () => {
  const location = useLocation();

  return (
    <Routes>
      {/* 认证路由 */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* C端消费者路由：根路径直接展示消费者首页 */}
      <Route path="/" element={<ConsumerLayout />}>
        <Route index element={<ConsumerHome />} />
        <Route path="brand" element={<BrandMerchants />} />
        <Route path="merchants" element={<ConsumerMerchants />} />
        <Route path="merchants/:id" element={<ConsumerMerchantDetail />} />
        <Route path="search" element={<ConsumerSearch />} />
        <Route path="profile" element={<ConsumerProfile />} />
        <Route path="orders" element={<ConsumerOrders />} />
        <Route path="favorites" element={<ConsumerFavorites />} />
        <Route path="coupons" element={<ConsumerCoupons />} />
        <Route path="notifications" element={<ConsumerNotifications />} />
        <Route path="reviews" element={<ConsumerReviews />} />
      </Route>

      {/* 商家端路由 */}
      <Route
        path="/merchant"
        element={
          <ProtectedRoute requiredRole="merchant">
            <MerchantLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/merchant/dashboard" replace />} />
        <Route path="dashboard" element={<MerchantDashboard />} />
        <Route path="shop-info" element={<MerchantShopInfo />} />
        <Route path="menu-manage" element={<MerchantMenuManage />} />
        <Route path="stats" element={<MerchantStats />} />
      </Route>

      {/* 管理端路由 */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="merchant-audit" element={<AdminMerchantAudit />} />
        <Route path="category-manage" element={<AdminCategoryManage />} />
        <Route path="member-levels" element={<AdminMemberLevels />} />
      </Route>

      {/* 404路由 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <HashRouter>
        <div className="relative z-[1]">
          <AppContent />
        </div>
      </HashRouter>
    </ErrorBoundary>
  );
};

export default App;
