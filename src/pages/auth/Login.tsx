import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../supabase/client';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    phone: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const validatePhone = (phone: string) => /^1[3-9]\d{9}$/.test(phone);

  const validateForm = () => {
    if (!formData.phone) return '请输入手机号码';
    if (!validatePhone(formData.phone)) return '请输入有效的11位手机号码';
    if (!formData.password) return '请输入密码';
    if (formData.password.length < 6) return '密码至少6位字符';
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
      let user = null;
      let loginError = null;

      // 1. 尝试使用手机号对应的内部邮箱登录 (13900002222@jilin-takeout.local)
      const phoneEmail = `${formData.phone}@jilin-takeout.local`;
      const { data: phoneData, error: phoneError } = await supabase.auth.signInWithPassword({
        email: phoneEmail,
        password: formData.password,
      });

      if (phoneData?.user) {
        user = phoneData.user;
      } else {
        // 2. 如果失败，尝试直接使用输入的字符串作为邮箱登录 (merchant_test_02@jilin.com)
        const { data: directData, error: directError } = await supabase.auth.signInWithPassword({
          email: formData.phone,
          password: formData.password,
        });

        if (directData?.user) {
          user = directData.user;
        } else {
          loginError = directError || phoneError;
        }
      }

      if (loginError) throw loginError;
      if (!user) throw new Error('登录失败：未获取到用户信息');

      // 直接使用登录返回的 user 对象，避免再次调用 getUser() 可能导致的会话同步延迟
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.role === 'merchant') {
        navigate('/merchant/dashboard');
      } else if (profile?.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message.includes('Invalid login credentials') ? '手机号或密码错误' : err.message || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md border border-gray-100"
      >
        <div className="text-center mb-8">
          <motion.div 
            className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg"
            whileHover={{ rotate: 5, scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <i className="fas fa-utensils text-white text-3xl"></i>
          </motion.div>
          <h1 className="text-2xl font-bold text-gray-800">欢迎回来</h1>
          <p className="text-gray-500 mt-2 text-sm">登录吉林外卖账号</p>
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

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">手机号码</label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                <i className="fas fa-mobile-alt"></i>
              </div>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => {
                  setFormData({ ...formData, phone: e.target.value.replace(/\D/g, '').slice(0, 11) });
                  setError(null);
                }}
                className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all bg-white text-gray-900 placeholder-gray-400"
                placeholder="请输入11位手机号"
                maxLength={11}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">密码</label>
            <div className="relative group">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                <i className="fas fa-lock"></i>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => {
                  setFormData({ ...formData, password: e.target.value });
                  setError(null);
                }}
                className="w-full pl-12 pr-12 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all bg-white text-gray-900 placeholder-gray-400"
                placeholder="请输入密码"
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

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3.5 rounded-xl hover:from-blue-600 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all font-semibold shadow-lg shadow-blue-500/30 flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <i className="fas fa-circle-notch fa-spin"></i>
                <span>登录中...</span>
              </>
            ) : (
              <span>立即登录</span>
            )}
          </motion.button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-gray-600 text-sm">
            还没有账号？{' '}
            <Link to="/register" className="text-blue-500 hover:text-blue-600 font-semibold hover:underline">
              立即注册
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

export default Login;
