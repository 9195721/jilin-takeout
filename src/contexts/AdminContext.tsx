import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../supabase/client';

export type AdminRole = 'user' | 'merchant' | 'admin' | 'super_admin';

export interface AdminPermissions {
  can_delete: boolean;        // 删除商家
  can_manage_users: boolean;  // 管理用户角色/等级
  can_manage_roles: boolean;  // 添加子管理员
  can_system_settings: boolean; // 系统设置
}

export interface AdminContextType {
  role: AdminRole;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  permissions: AdminPermissions;
  loading: boolean;
  refresh: () => Promise<void>;
}

const defaultPermissions: AdminPermissions = {
  can_delete: false,
  can_manage_users: false,
  can_manage_roles: false,
  can_system_settings: false,
};

const defaultContext: AdminContextType = {
  role: 'user',
  isAdmin: false,
  isSuperAdmin: false,
  permissions: defaultPermissions,
  loading: true,
  refresh: async () => {},
};

const AdminContext = createContext<AdminContextType>(defaultContext);

export const useAdmin = () => useContext(AdminContext);

const getPermissions = (role: AdminRole): AdminPermissions => ({
  can_delete: role === 'super_admin',
  can_manage_users: role === 'super_admin',
  can_manage_roles: role === 'super_admin',
  can_system_settings: role === 'super_admin',
});

interface AdminProviderProps {
  children: ReactNode;
}

export const AdminProvider: React.FC<AdminProviderProps> = ({ children }) => {
  const [role, setRole] = useState<AdminRole>('user');
  const [loading, setLoading] = useState(true);

  const fetchRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setRole('user');
        return;
      }
      const { data } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();
      setRole((data?.role as AdminRole) || 'user');
    } catch (error) {
      console.error('Failed to fetch admin role:', error);
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    await fetchRole();
  };

  useEffect(() => {
    fetchRole();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchRole();
    });

    return () => subscription.unsubscribe();
  }, []);

  const isAdmin = role === 'admin' || role === 'super_admin';
  const isSuperAdmin = role === 'super_admin';
  const permissions = getPermissions(role);

  return (
    <AdminContext.Provider value={{ role, isAdmin, isSuperAdmin, permissions, loading, refresh }}>
      {children}
    </AdminContext.Provider>
  );
};

export default AdminContext;
