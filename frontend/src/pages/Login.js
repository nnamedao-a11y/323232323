import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { toast } from 'sonner';
import { Car, Eye, EyeSlash, ArrowRight } from '@phosphor-icons/react';
import { motion } from 'framer-motion';

const Login = () => {
  const [email, setEmail] = useState('admin@crm.com');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Успішний вхід!');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Помилка входу');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0B0F] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-[#4F46E5]/20 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-[#8B5CF6]/15 rounded-full blur-[100px]"></div>
      </div>

      <motion.div 
        className="w-full max-w-md relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="card-premium p-8 backdrop-blur-xl">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 bg-gradient-to-br from-[#4F46E5] to-[#6366F1] rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Car size={28} weight="bold" className="text-white" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-white font-heading">
              AutoCRM
            </h1>
          </div>

          <form onSubmit={handleSubmit} data-testid="login-form">
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#64748B] mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-premium"
                  placeholder="email@example.com"
                  required
                  data-testid="login-email-input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#64748B] mb-2">
                  Пароль
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="input-premium pr-12"
                    placeholder="••••••••"
                    required
                    data-testid="login-password-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-white transition-colors"
                    data-testid="toggle-password-btn"
                  >
                    {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-3 mt-2 group"
                data-testid="login-submit-btn"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Вхід...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Увійти
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </span>
                )}
              </button>
            </div>
          </form>

          <p className="text-center text-xs text-[#64748B] mt-6">
            Тестовий обліковий запис: <span className="text-[#94A3B8]">admin@crm.com / admin123</span>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
