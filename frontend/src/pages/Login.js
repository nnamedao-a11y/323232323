import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { toast } from 'sonner';
import { Car, Eye, EyeSlash } from '@phosphor-icons/react';

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
    <div className="min-h-screen bg-[#F7F7F8] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white border border-[#D4D4D8] p-8">
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-10 h-10 bg-[#0A0A0B] flex items-center justify-center">
              <Car size={24} weight="bold" className="text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ fontFamily: 'Cabinet Grotesk, sans-serif' }}>
              AutoCRM
            </h1>
          </div>

          <form onSubmit={handleSubmit} data-testid="login-form">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-[#71717A] mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-[#D4D4D8] bg-white text-sm focus:outline-none focus:border-[#0055FF] focus:ring-1 focus:ring-[#0055FF]"
                  placeholder="email@example.com"
                  required
                  data-testid="login-email-input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wide text-[#71717A] mb-2">
                  Пароль
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 border border-[#D4D4D8] bg-white text-sm focus:outline-none focus:border-[#0055FF] focus:ring-1 focus:ring-[#0055FF] pr-12"
                    placeholder="••••••••"
                    required
                    data-testid="login-password-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-[#0A0A0B]"
                    data-testid="toggle-password-btn"
                  >
                    {showPassword ? <EyeSlash size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#0A0A0B] text-white py-3 text-sm font-semibold hover:bg-[#27272A] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="login-submit-btn"
              >
                {loading ? 'Вхід...' : 'Увійти'}
              </button>
            </div>
          </form>

          <p className="text-center text-xs text-[#71717A] mt-6">
            Тестовий обліковий запис: admin@crm.com / admin123
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
