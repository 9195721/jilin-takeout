import { useState, useEffect } from 'react'
import { supabase } from '../../supabase/client'

interface Log {
  id: number
  admin_id: string
  admin_name: string | null
  action: string
  target: string | null
  detail: string | null
  ip: string | null
  created_at: string | null
}

const ACTION_COLORS: Record<string, string> = {
  create: 'bg-green-50 text-green-700 border-green-200',
  update: 'bg-blue-50 text-blue-700 border-blue-200',
  delete: 'bg-red-50 text-red-700 border-red-200',
  approve: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  reject: 'bg-orange-50 text-orange-700 border-orange-200',
  visible: 'bg-purple-50 text-purple-700 border-purple-200',
  hidden: 'bg-gray-50 text-gray-600 border-gray-200',
  upload: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  login: 'bg-indigo-50 text-indigo-700 border-indigo-200',
}

const ACTION_LABELS: Record<string, string> = {
  create: '新增',
  update: '更新',
  delete: '删除',
  approve: '审核通过',
  reject: '审核拒绝',
  visible: '启用',
  hidden: '禁用',
  upload: '上传',
  login: '登录',
}

function formatDate(d: string | null) {
  if (!d) return '-'
  return new Date(d).toLocaleString('zh-CN', { dateStyle: 'medium', timeStyle: 'short' })
}

export default function Operations() {
  const [logs, setLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [actionFilter, setActionFilter] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 20

  const fetchLogs = async () => {
    setLoading(true)
    let q = supabase
      .from('admin_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .range((page - 1) * pageSize, page * pageSize - 1)

    if (actionFilter) q = q.eq('action', actionFilter)
    const { data } = await q
    if (data) setLogs(data)
    setLoading(false)
  }

  useEffect(() => { fetchLogs() }, [page, actionFilter])

  const filtered = logs.filter(l =>
    !search ||
    (l.admin_name || '').includes(search) ||
    (l.target || '').includes(search) ||
    (l.detail || '').includes(search)
  )

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div>
        <h2 className="text-xl font-bold text-gray-800">操作日志</h2>
        <p className="text-sm text-gray-500 mt-1">记录所有管理员关键操作，便于审计追溯</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="搜索操作人/对象/详情..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500" />
        </div>
        <select value={actionFilter} onChange={e => { setActionFilter(e.target.value); setPage(1) }}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
          <option value="">全部操作</option>
          {Object.entries(ACTION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-2">
          {filtered.map(log => {
            const color = ACTION_COLORS[log.action] || 'bg-gray-50 text-gray-600 border-gray-200'
            const label = ACTION_LABELS[log.action] || log.action
            return (
              <div key={log.id} className="bg-white rounded-xl border border-gray-100 p-4 flex items-start gap-4 hover:shadow-sm transition-shadow">
                <div className={`shrink-0 px-2.5 py-1 rounded-lg text-xs font-semibold border ${color}`}>{label}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-gray-800">{log.admin_name || '未知管理员'}</span>
                    {log.target && <><span className="text-gray-300">·</span><span className="text-gray-600 text-sm truncate">{log.target}</span></>}
                  </div>
                  {log.detail && <p className="text-sm text-gray-500 mt-0.5 truncate">{log.detail}</p>}
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                    <span>{formatDate(log.created_at)}</span>
                    {log.ip && <><span>·</span><span>IP: {log.ip}</span></>}
                  </div>
                </div>
              </div>
            )
          })}
          {filtered.length === 0 && (
            <div className="text-center py-16 text-gray-400">
              <div className="text-5xl mb-4">📋</div>
              <p>暂无操作记录</p>
            </div>
          )}
        </div>
      )}

      {logs.length >= pageSize && (
        <div className="flex justify-center gap-3 pt-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
            className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50 disabled:opacity-40">上一页</button>
          <span className="px-4 py-2 text-sm text-gray-500">第 {page} 页</span>
          <button onClick={() => setPage(p => p + 1)} disabled={filtered.length < pageSize}
            className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-50 disabled:opacity-40">下一页</button>
        </div>
      )}
    </div>
  )
}
