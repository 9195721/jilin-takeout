import { useState, useEffect } from 'react'
import { supabase } from '../../supabase/client'
import { uploadImage } from '../../utils/cos'
import { motion, AnimatePresence } from 'framer-motion'

interface Banner {
  id: number
  title: string
  image_url: string
  link_type: string | null
  link_value: string | null
  sort_order: number | null
  is_visible: boolean | null
  created_at: string | null
  updated_at: string | null
}

const LINK_TYPES = [
  { value: 'none', label: '不跳转' },
  { value: 'merchant', label: '商家页面' },
  { value: 'category', label: '分类页面' },
  { value: 'url', label: '外部链接' },
]

export default function Banners() {
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Banner | null>(null)
  const [form, setForm] = useState({
    title: '',
    image_url: '',
    link_type: 'none',
    link_value: '',
    sort_order: 0,
    is_visible: true,
  })
  const [previewImage, setPreviewImage] = useState<string>('')
  const [saving, setSaving] = useState(false)

  const fetchBanners = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('banners')
      .select('*')
      .order('sort_order', { ascending: true })
    if (!error && data) setBanners(data)
    setLoading(false)
  }

  useEffect(() => { fetchBanners() }, [])

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadImage(file, 'banners/')
      setForm(f => ({ ...f, image_url: url }))
      setPreviewImage(url)
    } catch {
      alert('图片上传失败，请重试')
    }
    setUploading(false)
  }

  const openAdd = () => {
    setEditing(null)
    setForm({ title: '', image_url: '', link_type: 'none', link_value: '', sort_order: banners.length, is_visible: true })
    setPreviewImage('')
    setShowModal(true)
  }

  const openEdit = (b: Banner) => {
    setEditing(b)
    setForm({
      title: b.title,
      image_url: b.image_url,
      link_type: b.link_type || 'none',
      link_value: b.link_value || '',
      sort_order: b.sort_order || 0,
      is_visible: b.is_visible ?? true,
    })
    setPreviewImage(b.image_url)
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.title.trim() || !form.image_url) {
      alert('请填写标题并上传图片')
      return
    }
    setSaving(true)
    const payload = {
      title: form.title.trim(),
      image_url: form.image_url,
      link_type: form.link_type,
      link_value: form.link_value || null,
      sort_order: form.sort_order,
      is_visible: form.is_visible,
      updated_at: new Date().toISOString(),
    }
    let error
    if (editing) {
      ({ error } = await supabase.from('banners').update(payload).eq('id', editing.id))
    } else {
      ({ error } = await supabase.from('banners').insert(payload))
    }
    setSaving(false)
    if (error) {
      alert('保存失败：' + error.message)
    } else {
      setShowModal(false)
      fetchBanners()
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('确定删除该轮播图？')) return
    await supabase.from('banners').delete().eq('id', id)
    fetchBanners()
  }

  const toggleVisible = async (b: Banner) => {
    await supabase.from('banners').update({ is_visible: !b.is_visible, updated_at: new Date().toISOString() }).eq('id', b.id)
    fetchBanners()
  }

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">轮播图管理</h2>
          <p className="text-sm text-gray-500 mt-1">管理首页轮播图，最多 5 张</p>
        </div>
        <button
          onClick={openAdd}
          disabled={banners.length >= 5}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-40 text-sm font-medium transition-colors"
        >
          + 添加轮播图
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      ) : banners.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-4">🖼️</div>
          <p>暂无轮播图，点击上方添加</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {banners.map(b => (
            <div key={b.id} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
              <div className="aspect-[16/7] bg-gray-100 overflow-hidden">
                <img src={b.image_url} alt={b.title} className="w-full h-full object-cover" />
              </div>
              <div className="p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-800 truncate">{b.title}</span>
                  <button
                    onClick={() => toggleVisible(b)}
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      b.is_visible ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {b.is_visible ? '显示中' : '已隐藏'}
                  </button>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span>排序: {b.sort_order}</span>
                  <span>·</span>
                  <span>{LINK_TYPES.find(t => t.value === b.link_type)?.label || '无跳转'}</span>
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={() => openEdit(b)} className="flex-1 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-600 transition-colors">
                    编辑
                  </button>
                  <button onClick={() => handleDelete(b.id)} className="flex-1 py-1.5 text-sm border border-red-200 rounded-lg hover:bg-red-50 text-red-500 transition-colors">
                    删除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-gray-800">{editing ? '编辑轮播图' : '添加轮播图'}</h3>
                <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">标题</label>
                  <input
                    value={form.title}
                    onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
                    placeholder="轮播图标题"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">图片</label>
                  <div className="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center">
                    {previewImage ? (
                      <div className="space-y-2">
                        <img src={previewImage} alt="预览" className="max-h-32 mx-auto rounded-lg object-cover" />
                        <label className="cursor-pointer text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                          重新上传
                          <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
                        </label>
                      </div>
                    ) : (
                      <label className="cursor-pointer block">
                        <div className="text-3xl mb-1">📷</div>
                        <p className="text-sm text-gray-500">{uploading ? '上传中...' : '点击上传图片'}</p>
                        <p className="text-xs text-gray-400 mt-1">建议尺寸 750×320</p>
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageSelect} disabled={uploading} />
                      </label>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">跳转类型</label>
                    <select
                      value={form.link_type}
                      onChange={e => setForm(f => ({ ...f, link_type: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    >
                      {LINK_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">排序权重</label>
                    <input
                      type="number"
                      value={form.sort_order}
                      onChange={e => setForm(f => ({ ...f, sort_order: parseInt(e.target.value) || 0 }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                  </div>
                </div>
                {form.link_type !== 'none' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {form.link_type === 'merchant' ? '商家ID' : form.link_type === 'category' ? '分类ID' : '链接地址'}
                    </label>
                    <input
                      value={form.link_value}
                      onChange={e => setForm(f => ({ ...f, link_value: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                      placeholder={form.link_type === 'url' ? 'https://...' : '输入ID'}
                    />
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setForm(f => ({ ...f, is_visible: !f.is_visible }))}
                    className={`w-12 h-6 rounded-full transition-colors relative ${form.is_visible ? 'bg-indigo-600' : 'bg-gray-300'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${form.is_visible ? 'translate-x-7' : 'translate-x-1'}`} />
                  </button>
                  <span className="text-sm text-gray-600">{form.is_visible ? '显示' : '隐藏'}</span>
                </div>
              </div>
              <div className="px-6 py-4 border-t border-gray-100 flex gap-3">
                <button onClick={() => setShowModal(false)} className="flex-1 py-2 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50 text-sm">
                  取消
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving || uploading}
                  className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium"
                >
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
