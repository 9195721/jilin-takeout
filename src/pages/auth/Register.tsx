import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../supabase/client';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'user' as 'user' | 'merchant',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validatePhone = (phone: string) => /^1[3-9]\d{9}$/.test(phone);

  const validateForm = () => {
    if (!formData.username) return '请输入用户名';
    if (formData.username.length < 2) return '用户名至少2个字符';
    if (!formData.phone) return '请输入手机号码';
    if (!validatePhone(formData.phone)) return '请输入有效的11位手机号码';
    if (!formData.password) return '请输入密码';
    if (formData.password.length < 6) return '密码至少6位字符';
    if (formData.password !== formData.confirmPassword) return '两次输入的密码不一致';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 使用手机号作为邮箱注册（Supabase要求邮箱格式）
      const fakeEmail = `${formData.phone}@jilin-takeout.local`;
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: fakeEmail,
        password: formData.password,
        options: {
          data: {
            username: formData.username,
            phone: formData.phone,
            role: formData.role,
          },
        },
      });

      if (authError) throw authError;

      if (authData.user) {
        // profile 由数据库 trigger 自动创建，无需手动插入

        // 如果是商家注册，等待 trigger 完成后再插入商家申请
        if (formData.role === 'merchant') {
          // 等待 trigger 创建 profile
          await new Promise(resolve => setTimeout(resolve, 1000));

          const { error: merchantError } = await supabase.from('merchants').insert([
            {
              user_id: authData.user.id,
              shop_name: formData.username + '的店铺',
              address: '请填写详细地址',
              phone: formData.phone,
              status: 'pending',
            },
          ]);

          if (merchantError) throw merchantError;
        }

        navigate('/login');
      }
    } catch (err: any) {
      setError(err.message || '注册失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md border border-gray-100"
      >
        <div className="text-center mb-8">
          <motion.div 
            className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
            whileHover={{ rotate: 5, scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <i className="fas fa-user-plus text-white text-3xl"></i>
          </motion.div>
          <h1 className="text-2xl font-bold text-gray-800">创建账号</h1>
          <p className="text-gray-500 mt-2 text-sm">加入吉林外卖平台</p>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm flex items-start"
            >
              <i className="fas fa-exclamation-circle mt-0.5 mr-2"></i>
              <span>{error}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">用户名</label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors">
                <i className="fas fa-user"></i>
              </div>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => {
                  setFormData({ ...formData, username: e.target.value });
                  setError(null);
                }}
                className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-50 transition-all bg-white text-gray-900 placeholder-gray-400"
                placeholder="请输入用户名"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">手机号码</label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors">
                <i className="fas fa-mobile-alt"></i>
              </div>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => {
                  setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 11) });
                  setError(null);
                }}
                className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-50 transition-all bg-white text-gray-900 placeholder-gray-400"
                placeholder="请输入11位手机号"
                maxLength={11}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">设置密码</label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors">
                <i className="fas fa-lock"></i>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => {
                  setFormData({ ...formData, password: e.target.value });
                  setError(null);
                }}
                className="w-full pl-12 pr-12 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-50 transition-all bg-white text-gray-900 placeholder-gray-400"
                placeholder="至少6位字符"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">确认密码</label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-green-500 transition-colors">
                <i className="fas fa-lock"></i>
              </div>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                value={formData.confirmPassword}
                onChange={(e) => {
                  setFormData({ ...formData, confirmPassword: e.target.value });
                  setError(null);
                }}
                className="w-full pl-12 pr-12 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-50 transition-all bg-white text-gray-900 placeholder-gray-400"
                placeholder="请再次输入密码"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">注册类型</label>
            <div className="grid grid-cols-2 gap-3">
              <motion.button
                type="button"
                whileTap={{ scale: 0.98 }}
                onClick={() => setFormData({ ...formData, role: 'user' })}
                className={`py-3.5 rounded-xl border-2 transition-all flex items-center justify-center space-x-2 ${
                  formData.role === 'user'
                    ? 'border-green-500 bg-green-50 text-green-700 shadow-sm'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <i className="fas fa-user"></i>
                <span className="font-medium">普通用户</span>
              </motion.button>
              <motion.button
                type="button"
                whileTap={{ scale: 0.98 }}
                onClick={() => setFormData({ ...formData, role: 'merchant' })}
                className={`py-3.5 rounded-xl border-2 transition-all flex items-center justify-center space-x-2 ${
                  formData.role === 'merchant'
                    ? 'border-green-500 bg-green-50 text-green-700 shadow-sm'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <i className="fas fa-store"></i>
                <span className="font-medium">商家入驻</span>
              </motion.button>
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3.5 rounded-xl hover:from-green-600 hover:to-green-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all font-semibold shadow-lg shadow-green-500/30 flex items-center justify-center space-x-2 mt-2"
          >
            {loading ? (
              <>
                <i className="fas fa-circle-notch fa-spin"></i>
                <span>注册中...</span>
              </>
            ) : (
              <span>立即注册</span>
            )}
          </motion.button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-gray-600 text-sm">
            已有账号？{' '}
            <Link to="/login" className="text-green-500 hover:text-green-600 font-semibold hover:underline">
              立即登录
            </Link>
          </p>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-100">
          <Link to="/" className="flex items-center justify-center text-gray-500 hover:text-gray-700 transition-colors text-sm group">
            <i className="fas fa-arrow-left mr-2 group-hover:-translate-x-1 transition-transform"></i>
            返回首页
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default Register;
