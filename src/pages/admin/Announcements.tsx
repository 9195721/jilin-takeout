import { useState, useEffect } from 'react'
import { supabase } from '../../supabase/client'
import { motion, AnimatePresence } from 'framer-motion'

interface Announcement {
  id: number
  title: string
  content: string
  type: string | null
  is_pinned: boolean | null
  is_visible: boolean | null
  created_at: string | null
  updated_at: string | null
}

const TYPE_OPTIONS = [
  { value: 'notice', label: '系统通知', color: 'bg-blue-50 text-blue-700' },
  { value: 'activity', label: '活动公告', color: 'bg-orange-50 text-orange-700' },
  { value: 'update', label: '版本更新', color: 'bg-green-50 text-green-700' },
  { value: 'warning', label: '重要提醒', color: 'bg-red-50 text-red-700' },
]

function formatDate(d: string | null) {
  if (!d) return '-'
  return new Date(d).toLocaleString('zh-CN', { dateStyle: 'short', timeStyle: 'short' })
}

export default function Announcements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Announcement | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ title: '', content: '', type: 'notice', is_pinned: false, is_visible: true })
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  const fetchAnnouncements = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('announcements')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
    if (data) setAnnouncements(data)
    setLoading(false)
  }

  useEffect(() => { fetchAnnouncements() }, [])

  const filtered = announcements.filter(a => {
    const matchSearch = !search || a.title.includes(search) || a.content.includes(search)
    const matchType = !typeFilter || a.type === typeFilter
    return matchSearch && matchType
  })

  const openAdd = () => {
    setEditing(null)
    setForm({ title: '', content: '', type: 'notice', is_pinned: false, is_visible: true })
    setShowModal(true)
  }

  const openEdit = (a: Announcement) => {
    setEditing(a)
    setForm({
      title: a.title,
      content: a.content,
      type: a.type || 'notice',
      is_pinned: a.is_pinned ?? false,
      is_visible: a.is_visible ?? true,
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      alert('请填写标题和内容')
      return
    }
    setSaving(true)
    const payload = {
      title: form.title.trim(),
      content: form.content.trim(),
      type: form.type,
      is_pinned: form.is_pinned,
      is_visible: form.is_visible,
      updated_at: new Date().toISOString(),
    }
    let error
    if (editing) {
      ({ error } = await supabase.from('announcements').update(payload).eq('id', editing.id))
    } else {
      ({ error } = await supabase.from('announcements').insert(payload))
    }
    setSaving(false)
    if (error) {
      alert('保存失败：' + error.message)
    } else {
      setShowModal(false)
      fetchAnnouncements()
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除该公告？')) return
    await supabase.from('announcements').delete().eq('id', id)
    fetchAnnouncements()
  }

  const getTypeInfo = (type: string | null) => TYPE_OPTIONS.find(t => t.value === type) || TYPE_OPTIONS[0]

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">公告管理</h2>
          <p className="text-sm text-gray-500 mt-1">发布平台公告和活动通知</p>
        </div>
        <button onClick={openAdd} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium transition-colors">
          + 发布公告
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="搜索公告标题或内容..."
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="px-3 py-2 border border-gray-200 rounded-lg text-sm">
          <option value="">全部类型</option>
          {TYPE_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-4">📢</div>
          <p>暂无公告</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(a => {
            const typeInfo = getTypeInfo(a.type)
            return (
              <div key={a.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-4 flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      {a.is_pinned && <span className="px-1.5 py-0.5 bg-red-50 text-red-600 text-xs rounded font-medium">置顶</span>}
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeInfo.color}`}>{typeInfo.label}</span>
                      {!a.is_visible && <span className="px-1.5 py-0.5 bg-gray-100 text-gray-400 text-xs rounded">已隐藏</span>}
                    </div>
                    <h3 className="font-semibold text-gray-800 truncate">{a.title}</h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{a.content}</p>
                    <p className="text-xs text-gray-400 mt-2">{formatDate(a.created_at)}</p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <button onClick={() => openEdit(a)} className="px-3 py-1 text-xs border border-gray-200 rounded-lg hover:bg-indigo-50 text-indigo-600 transition-colors">编辑</button>
                    <button onClick={() => handleDelete(a.id)} className="px-3 py-1 text-xs border border-red-200 rounded-lg hover:bg-red-50 text-red-500 transition-colors">删除</button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
              <div className="px-6 py-4 border-b flex items-center justify-between">
                <h3 className="font-semibold">{editing ? '编辑公告' : '发布公告'}</h3>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">标题</label>
                  <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                    placeholder="公告标题" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">类型</label>
                  <div className="flex flex-wrap gap-2">
                    {TYPE_OPTIONS.map(t => (
                      <button key={t.value} onClick={() => setForm(f => ({ ...f, type: t.value }))}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${form.type === t.value ? `${t.color} border-current` : 'bg-gray-50 text-gray-500 border-transparent'}`}>
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">内容</label>
                  <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                    rows={5} className="w-full px-3 py-2 border rounded-lg text-sm resize-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="公告内容，支持多行..." />
                </div>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.is_pinned} onChange={e => setForm(f => ({ ...f, is_pinned: e.target.checked }))}
                      className="w-4 h-4 rounded accent-red-500" />
                    <span className="text-sm">置顶</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <button onClick={() => setForm(f => ({ ...f, is_visible: !f.is_visible }))}
                      className={`w-10 h-5 rounded-full transition-colors relative ${form.is_visible ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                      <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${form.is_visible ? 'translate-x-5' : 'translate-x-0.5'}`} />
                    </button>
                    <span className="text-sm">{form.is_visible ? '显示' : '隐藏'}</span>
                  </label>
                </div>
              </div>
              <div className="px-6 py-4 border-t flex gap-3">
                <button onClick={() => setShowModal(false)} className="flex-1 py-2 border rounded-lg text-gray-600 hover:bg-gray-50 text-sm">取消</button>
                <button onClick={handleSave} disabled={saving} className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium">
                  {saving ? '保存中...' : '保存'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
