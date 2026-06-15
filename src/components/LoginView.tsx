import React, { useState } from 'react';
import { motion } from 'motion/react';
import api from '../services/api';

interface LoginViewProps {
  onLoginSuccess: (user: any, role: string) => void;
  onGoToRegister: () => void;
  onBack: () => void;
}

export default function LoginView({ onLoginSuccess, onGoToRegister, onBack }: LoginViewProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginType, setLoginType] = useState<'customer' | 'technician'>('customer');

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      setError('Email dan Password wajib diisi.');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const loginUrl = loginType === 'customer' ? '/login' : '/technician/login';
      const response = await api.post(loginUrl, {
        email,
        password
      });

      // simpan token sanctum
      localStorage.setItem('token', response.data.token);

      // simpan data user
      localStorage.setItem('user', JSON.stringify(response.data.user));

      // simpan role
      localStorage.setItem('role', response.data.role || loginType);

      // redirect dashboard
      onLoginSuccess(response.data.user, response.data.role || loginType);
    } catch (err: any) {
      console.log(err);
      setError(
        err?.response?.data?.message || 'Login gagal. Email atau password salah.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9fb] text-[#1b1c1e] flex flex-col justify-between p-5 dark:bg-[#0a0f1d] dark:text-[#f3f4f6]">
      {/* Top Header */}
      <header className="flex justify-between items-center w-full max-w-screen-xl mx-auto py-3">
        <button 
          onClick={onBack}
          className="flex items-center justify-center p-2 rounded-xl bg-[#efedf0] text-[#000d1a] cursor-pointer hover:bg-[#e9e8ea] dark:bg-[#1a2333] dark:text-white dark:hover:bg-[#253046]"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <span className="text-[#0a2540] font-black italic tracking-tighter text-xl dark:text-white">Clean Vehicle</span>
        <div className="w-10"></div>
      </header>

      <main className="flex-grow flex flex-col pt-4 max-w-md mx-auto w-full justify-center">
        {/* Header Label */}
        <div className="mb-6 text-center">
          <div className="w-16 h-16 bg-[#0a2540] dark:bg-[#fdc003] rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="material-symbols-outlined text-[#fdc003] dark:text-[#0a2540] text-3xl">directions_car</span>
          </div>
          <h1 className="text-3xl font-extrabold text-[#000f22] dark:text-white tracking-tight">Clean Vehicle</h1>
          <p className="text-[#74777e] dark:text-[#a0a5b5] text-sm mt-1">Concierge vehicle care, delivered with precision and luxury.</p>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-[#efedf0] dark:bg-[#151f32] p-1.5 rounded-2xl mb-5 max-w-xs mx-auto w-full border border-black/5 dark:border-white/5 shadow-inner">
          <button
            onClick={() => {
              setLoginType('customer');
              setError('');
            }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              loginType === 'customer'
                ? 'bg-white dark:bg-[#1f2d47] text-[#0a2540] dark:text-white shadow-md'
                : 'text-[#74777e] dark:text-[#a0a5b5]'
            }`}
          >
            Pelanggan
          </button>
          <button
            onClick={() => {
              setLoginType('technician');
              setError('');
            }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              loginType === 'technician'
                ? 'bg-[#fdc003] text-[#6c5000] shadow-md font-extrabold'
                : 'text-[#74777e] dark:text-[#a0a5b5]'
            }`}
          >
            Teknisi
          </button>
        </div>

        {/* Login Box */}
        <div className="bg-white dark:bg-[#111827] rounded-3xl p-6 shadow-xl border border-[#efedf0] dark:border-gray-800/60 ambient-shadow-l2">
          
          {/* Technician Registration Info */}
          {loginType === 'technician' && (
            <div className="mb-5 p-4 bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 rounded-2xl text-xs font-semibold leading-relaxed border border-amber-100 dark:border-amber-900/40 flex gap-2.5">
              <span className="material-symbols-outlined text-amber-500 shrink-0 text-lg">info</span>
              <div>
                <p className="font-bold mb-0.5 text-amber-900 dark:text-amber-200">Informasi Penting</p>
                Untuk masuk ke aplikasi, Anda harus terdaftar terlebih dahulu sebagai teknisi di outlet utama. Hak akses berupa email dan password diberikan secara langsung oleh admin setelah Anda didaftarkan.
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-xl text-xs font-semibold border border-red-100 dark:border-red-950/50">
                {error}
              </div>
            )}

            {/* Email Field */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-[#74777e] dark:text-[#a0a5b5] tracking-wider uppercase ml-1">Email Address</label>
              <div className="premium-input-focus flex items-center bg-white dark:bg-[#151f32] border border-[#e3e2e5] dark:border-gray-800 rounded-xl px-4 py-3 shadow-inner transition-all">
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm font-semibold text-[#000f22] dark:text-white placeholder-[#dbd9dc] dark:placeholder-[#4b5563]" 
                  placeholder={loginType === 'customer' ? "name@luxury-cars.com" : "budi.teknisi@clean.com"}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-1">
              <div className="flex justify-between items-center px-1">
                <label className="text-[10px] font-bold text-[#74777e] dark:text-[#a0a5b5] tracking-wider uppercase">Password</label>
                {loginType === 'customer' && (
                  <button type="button" className="text-xs text-[#785900] dark:text-[#fdc003] font-bold hover:underline bg-transparent border-none cursor-pointer">Lupa?</button>
                )}
              </div>
              <div className="premium-input-focus flex items-center bg-white dark:bg-[#151f32] border border-[#e3e2e5] dark:border-gray-800 rounded-xl px-4 py-3 shadow-inner transition-all">
                <input 
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm font-semibold text-[#000f22] dark:text-white placeholder-[#dbd9dc] dark:placeholder-[#4b5563]" 
                  placeholder="Password"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[#74777e] dark:text-[#a0a5b5] hover:text-[#000f22] dark:hover:text-white bg-transparent border-none cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <motion.button 
              whileTap={{ scale: 0.98 }}
              type="submit" 
              disabled={loading}
              className={`w-full font-bold py-4 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-sm uppercase tracking-wider cursor-pointer border-none ${
                loginType === 'technician'
                  ? 'bg-[#fdc003] hover:bg-[#fabd00] text-[#6c5000]'
                  : 'bg-[#0a2540] hover:bg-[#113254] text-white'
              }`}
            >
              {loading ? (
                <div className={`w-5 h-5 border-2 rounded-full animate-spin ${loginType === 'technician' ? 'border-[#6c5000] border-t-transparent' : 'border-white border-t-transparent'}`}></div>
              ) : (
                'Masuk'
              )}
            </motion.button>
          </form>
        </div>

        {/* Footer info link */}
        {loginType === 'customer' && (
          <div className="mt-8 text-center text-sm text-[#74777e] dark:text-[#a0a5b5]">
            Belum punya akun?{' '}
            <button onClick={onGoToRegister} className="text-[#785900] dark:text-[#fdc003] font-extrabold hover:underline bg-transparent border-none cursor-pointer">
              Daftar Baru
            </button>
          </div>
        )}
      </main>

      {/* Decorative Atmosphere Vectors */}
      <div className="fixed -bottom-20 -right-20 w-64 h-64 bg-[#ffdf9e]/10 rounded-full blur-[80px] pointer-events-none"></div>
      <div className="fixed top-1/2 -left-20 w-48 h-48 bg-[#d2e4ff]/10 rounded-full blur-[60px] pointer-events-none"></div>
    </div>
  );
}
