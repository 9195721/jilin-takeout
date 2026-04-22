import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../supabase/client';
import { useAdmin } from '../../contexts/AdminContext';

interface LogEntry {
  id: number;
  admin_id: string | null;
  action: string;
  target_type: string | null;
  target_id: string | null;
  detail: Record<string, unknown>;
  ip_address: string | null;
  created_at: string;
}

const OperationLog: React.FC = () => {
  const { isSuperAdmin } = useAdmin();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const [totalCount, setTotalCount] = useState(0);
  const [filterAction, setFilterAction] = useState('');
  const [filterTarget, setFilterTarget] = useState('');

  useEffect(() => {
    fetchLogs();
  }, [page, filterAction, filterTarget]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('admin_logs')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * pageSize, page * pageSize - 1);

      if (filterAction) query = query.eq('action', filterAction);
      if (filterTarget) query = query.eq('target_type', filterTarget);

      const { data, count, error } = await query;
      if (error) throw error;
      setLogs((data || []) as LogEntry[]);
      setTotalCount(count || 0);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  const actionLabels: Record<string, string> = {
    create: '创建',
    update: '更新',
    delete: '删除',
    audit: '审核',
    toggle: '状态切换',
    ban: '封禁',
    unban: '解封',
    login: '登录',
    export: '导出',
    setting_change: '设置变更',
  };

  const targetLabels: Record<string, string> = {
    merchant: '商家',
    user: '用户',
    category: '分类',
    banner: '轮播图',
    announcement: '公告',
    system: '系统',
    member_level: '会员等级',
  };

  return (
    <div className="p-4 md:p-6 space-y-4">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-bold text-gray-800">操作日志</h1>
        <p className="text-sm text-gray-500 mt-1">记录所有管理员操作行为</p>
      </motion.div>

      {/* 筛选栏 */}
      <div className="flex flex-wrap gap-3 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
        <select
          value={filterAction}
          onChange={(e) => { setFilterAction(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:border-purple-400 focus:ring-1 focus:ring-purple-400 outline-none"
        >
          <option value="">全部操作</option>
          {Object.entries(actionLabels).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>

        <select
          value={filterTarget}
          onChange={(e) => { setFilterTarget(e.target.value); setPage(1); }}
          className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:border-purple-400 focus:ring-1 focus:ring-purple-400 outline-none"
        >
          <option value="">全部目标</option>
          {Object.entries(targetLabels).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>

        <div className="text-sm text-gray-500 self-center ml-auto">
          共 {totalCount} 条记录
        </div>
      </div>

      {/* 日志表格 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-4 py-3 font-medium text-gray-600">时间</th>
                <th className="px-4 py-3 font-medium text-gray-600">操作类型</th>
                <th className="px-4 py-3 font-medium text-gray-600">目标</th>
                <th className="px-4 py-3 font-medium text-gray-600">详情</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">加载中...</td></tr>
              ) : logs.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">暂无日志记录</td></tr>
              ) : (
                logs.map((log) => (
                  <motion.tr
                    key={log.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-purple-50 transition-colors"
                  >
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('zh-CN')}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        log.action === 'delete' || log.action === 'ban'
                          ? 'bg-red-100 text-red-700'
                          : log.action === 'create'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {actionLabels[log.action] || log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">
                      {log.target_type ? (
                        <span>{targetLabels[log.target_type] || log.target_type}{log.target_id ? ` #${log.target_id}` : ''}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-500 max-w-xs truncate">
                      {Object.keys(log.detail).length > 0 ? JSON.stringify(log.detail) : '-'}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
            >
              上一页
            </button>
            <span className="text-sm text-gray-500">{page} / {totalPages}</span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 text-sm rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
            >
              下一页
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OperationLog;
