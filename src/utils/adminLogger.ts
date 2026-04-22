import { supabase } from '../supabase/client';

type LogTarget = 'merchant' | 'user' | 'category' | 'banner' | 'announcement' | 'system' | 'member_level';
type LogAction = 'create' | 'update' | 'delete' | 'audit' | 'toggle' | 'ban' | 'unban' | 'login' | 'export' | 'setting_change';

interface LogOptions {
  action: LogAction;
  target_type?: LogTarget;
  target_id?: string | number;
  detail?: Record<string, unknown>;
}

/**
 * 记录管理员操作日志
 * 静默失败，不阻塞主流程
 */
export async function logAdminAction(options: LogOptions): Promise<void> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('admin_logs').insert({
      admin_id: user.id,
      action: options.action,
      target_type: options.target_type || null,
      target_id: options.target_id ? String(options.target_id) : null,
      detail: options.detail || {},
    });
  } catch (error) {
    console.error('[adminLogger] Failed to log action:', error);
  }
}

/**
 * 批量便捷方法
 */
export const adminLog = {
  createMerchant: (id: number, detail?: Record<string, unknown>) =>
    logAdminAction({ action: 'create', target_type: 'merchant', target_id: id, detail }),

  updateMerchant: (id: number, detail?: Record<string, unknown>) =>
    logAdminAction({ action: 'update', target_type: 'merchant', target_id: id, detail }),

  deleteMerchant: (id: number) =>
    logAdminAction({ action: 'delete', target_type: 'merchant', target_id: id }),

  auditMerchant: (id: number, status: string) =>
    logAdminAction({ action: 'audit', target_type: 'merchant', target_id: id, detail: { status } }),

  toggleVisibility: (id: number, visible: boolean) =>
    logAdminAction({ action: 'toggle', target_type: 'merchant', target_id: id, detail: { is_visible: visible } }),

  toggleFeatured: (id: number, featured: boolean) =>
    logAdminAction({ action: 'toggle', target_type: 'merchant', target_id: id, detail: { is_featured: featured } }),

  toggleTop: (id: number, top: boolean) =>
    logAdminAction({ action: 'toggle', target_type: 'merchant', target_id: id, detail: { is_top: top } }),

  banUser: (userId: string, reason?: string) =>
    logAdminAction({ action: 'ban', target_type: 'user', target_id: userId, detail: { banned_reason: reason } }),

  unbanUser: (userId: string) =>
    logAdminAction({ action: 'unban', target_type: 'user', target_id: userId }),

  changeRole: (userId: string, newRole: string) =>
    logAdminAction({ action: 'update', target_type: 'user', target_id: userId, detail: { role_changed_to: newRole } }),

  createBanner: (id: number) =>
    logAdminAction({ action: 'create', target_type: 'banner', target_id: id }),

  deleteBanner: (id: number) =>
    logAdminAction({ action: 'delete', target_type: 'banner', target_id: id }),

  createAnnouncement: (id: number) =>
    logAdminAction({ action: 'create', target_type: 'announcement', target_id: id }),

  deleteAnnouncement: (id: number) =>
    logAdminAction({ action: 'delete', target_type: 'announcement', target_id: id }),
};
