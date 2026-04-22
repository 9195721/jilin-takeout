import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdmin } from '../../contexts/AdminContext';
import { adminLog } from '../../utils/adminLogger';

const SystemSettings: React.FC = () => {
  const { isSuperAdmin } = useAdmin();
  const [message, setMessage] = useState<{ type: string; text: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const [settings, setSettings] = useState({
    platformName: '吉林外卖',
    platformContact: '',
    defaultDeliveryFee: '4',
    freeDeliveryMinOrder: '20',
    autoAuditMerchants: false,
    enableReviews: true,
    enableFavorites: true,
    maxUploadSize: '5',
  });

  if (!isSuperAdmin) {
    return (
      <div className="p-6 text-center">
        <div className="text-6xl mb-4">🔒</div>
        <h2 className="text-lg font-semibold text-gray-700">需要超级管理员权限</h2>
        <p className="text-gray-500 mt-2">系统设置仅限超级管理员访问</p>
      </div>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminLog.setting_change(0, settings);
      setMessage({ type: 'success', text: '设置已保存（当前为前端演示模式，实际需后端支持）' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: '保存失败，请重试' });
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    'w-full px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white focus:border-purple-400 focus:ring-1 focus:ring-purple-400 outline-none transition-colors';

  return (
    <div className="p-4 md:p-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-bold text-gray-800">系统设置</h1>
        <p className="text-sm text-gray-500 mt-1">配置平台全局参数（仅超级管理员）</p>
      </motion.div>

      {/* 消息提示 */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`px-4 py-3 rounded-xl text-sm font-medium ${
              message.type === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}
          >
            {message.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 基本设置 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2">
          <i className="fas fa-info-circle text-purple-500"></i>
          基本信息
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">平台名称</label>
            <input
              type="text"
              value={settings.platformName}
              onChange={(e) => setSettings((s) => ({ ...s, platformName: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">联系方式</label>
            <input
              type="text"
              value={settings.platformContact}
              onChange={(e) => setSettings((s) => ({ ...s, platformContact: e.target.value }))}
              className={inputClass}
              placeholder="客服电话 / 邮箱"
            />
          </div>
        </div>
      </div>

      {/* 配送设置 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2">
          <i className="fas fa-truck text-purple-500"></i>
          配送设置
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">默认配送费 (¥)</label>
            <input
              type="number"
              value={settings.defaultDeliveryFee}
              onChange={(e) => setSettings((s) => ({ ...s, defaultDeliveryFee: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">免配送费门槛 (¥)</label>
            <input
              type="number"
              value={settings.freeDeliveryMinOrder}
              onChange={(e) => setSettings((s) => ({ ...s, freeDeliveryMinOrder: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">最大上传大小 (MB)</label>
            <input
              type="number"
              value={settings.maxUploadSize}
              onChange={(e) => setSettings((s) => ({ ...s, maxUploadSize: e.target.value }))}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* 功能开关 */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 space-y-4">
        <h2 className="font-semibold text-gray-800 flex items-center gap-2">
          <i className="fas fa-toggle-on text-purple-500"></i>
          功能开关
        </h2>

        <div className="space-y-3">
          {[
            { key: 'autoAuditMerchants', label: '自动审核商家入驻', desc: '开启后新注册商家无需人工审核直接上架' },
            { key: 'enableReviews', label: '启用评价功能', desc: '用户可以对商家进行评分和文字评价' },
            { key: 'enableFavorites', label: '启用收藏功能', desc: '用户可以收藏喜欢的商家' },
          ].map(({ key, label, desc }) => (
            <label
              key={key}
              className="flex items-center justify-between p-3 rounded-lg bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
            >
              <div>
                <div className="text-sm font-medium text-gray-700">{label}</div>
                <div className="text-xs text-gray-500 mt-0.5">{desc}</div>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={settings[key as keyof typeof settings] as boolean}
                  onChange={(e) =>
                    setSettings((s) => ({ ...s, [key]: e.target.checked }))
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 rounded-full peer-checked:bg-purple-600 transition-colors"></div>
                <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5"></div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* 保存按钮 */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-medium text-sm hover:from-purple-700 hover:to-purple-800 transition-all shadow-md hover:shadow-lg disabled:opacity-60"
        >
          {saving ? '保存中...' : '保存设置'}
        </button>
      </div>
    </div>
  );
};

export default SystemSettings;
