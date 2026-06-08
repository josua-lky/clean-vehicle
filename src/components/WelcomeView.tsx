import React from 'react';
import { motion } from 'motion/react';

interface WelcomeViewProps {
  darkMode: boolean;
  onToggleTheme: () => void;
  onMulai: () => void;
  onMasuk: () => void;
}

export default function WelcomeView({ darkMode, onToggleTheme, onMulai, onMasuk }: WelcomeViewProps) {
  return (
    <div className="min-h-screen bg-[#faf9fb] text-[#1b1c1e] flex flex-col justify-between overflow-x-hidden p-5">
      {/* Top Header */}
      <header className="flex justify-between items-center w-full max-w-screen-xl mx-auto py-3">
        <div className="flex items-center gap-2">
          <span className="text-[#0a2540] font-black italic tracking-tighter text-2xl">Clean Vehicle</span>
        </div>
        <div className="flex items-center gap-2">
          {/* Theme Toggle */}
          <button 
            type="button"
            onClick={onToggleTheme}
            className="w-10 h-10 rounded-full bg-[#efedf0] flex items-center justify-center cursor-pointer hover:bg-[#e9e8ea] transition-all text-[#43474d]"
            title={darkMode ? 'Aktifkan Mode Terang' : 'Aktifkan Mode Gelap'}
          >
            <span className="material-symbols-outlined text-lg">
              {darkMode ? 'light_mode' : 'dark_mode'}
            </span>
          </button>


        </div>
      </header>

      {/* Main Container */}
      <main className="flex-grow flex flex-col pt-4 max-w-md mx-auto w-full justify-center">
        {/* Hero Illustration Layout */}
        <div className="relative w-full aspect-[4/5] rounded-3xl overflow-hidden shadow-xl mb-6">
          <img 
            alt="Luxury Vehicle Premium Care" 
            className="w-full h-full object-cover" 
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAj_L4aT5qCPOVDz1-LD-wYgiULvE-sw-uzm0cPsCWDwVpZP42mjhcR1xtF5VCilpt-c55Fn8xe1FujK6htzYsm1cLNdlhInViYv7abuofm0PMI4iYFmrpWiYLACmU80Sp8aKkeGr31DJ5piBsLo-63xHzEDQnUoZU1if4orq_07y8QMqHaMQ_tTKb-FOoSbiT6FQb94A1VfKV-w5vUKn9OwhCy-nkQO_3uUwzgnkHywjMSApCVwI1vAR9cE8eFRB7LTSwMEZDl00sm"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#000f22]/90 via-transparent to-transparent"></div>
          
          {/* Floating Badge */}
          <div className="absolute top-6 left-6 glass-panel px-4 py-2 rounded-full border border-white/20 shadow-lg flex items-center gap-2">
            <span className="material-symbols-outlined text-[#785900]" style={{ fontVariationSettings: "'FILL' 1" }}>cleaning</span>
            <span className="font-bold text-xs uppercase tracking-wider text-[#000f22]">PREMIUM CARE</span>
          </div>
        </div>

        {/* Brand Tag, Title and Description */}
        <div className="flex flex-col gap-3 text-center md:text-left">
          <div className="inline-flex items-center gap-2 bg-[#ffdf9e]/40 self-center md:self-start px-4 py-1.5 rounded-full border border-[#ffdf9e]">
            <span className="material-symbols-outlined text-[#785900] text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
            <span className="text-[12px] font-bold text-[#785900] uppercase tracking-wider">Concierge Clarity</span>
          </div>
          
          <h1 className="text-[34px] leading-tight font-extrabold text-[#000f22] tracking-tight">
            Perawatan Kendaraan Premium di Ujung Jari
          </h1>
          
          <p className="text-sm md:text-base text-[#43474d] leading-relaxed">
            Hadirkan kemilau sempurna untuk kendaraan Anda dengan layanan eksklusif yang dirancang untuk kenyamanan dan ketepatan waktu.
          </p>
        </div>

        {/* Bento Style Feature Highlights */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="bg-[#f5f3f6] p-4 rounded-xl border border-[#e3e2e5] flex flex-col gap-2 items-center text-center">
            <span className="material-symbols-outlined text-[#785900] text-3xl">schedule</span>
            <span className="text-xs font-bold text-[#000f22] uppercase tracking-wider">Tepat Waktu</span>
          </div>
          <div className="bg-[#f5f3f6] p-4 rounded-xl border border-[#e3e2e5] flex flex-col gap-2 items-center text-center">
            <span className="material-symbols-outlined text-[#785900] text-3xl">workspace_premium</span>
            <span className="text-xs font-bold text-[#000f22] uppercase tracking-wider">Kualitas Tinggi</span>
          </div>
        </div>

        {/* Sticky Actions */}
        <div className="mt-8 flex flex-col gap-4">
          <motion.button 
            whileTap={{ scale: 0.95 }}
            onClick={onMulai}
            className="w-full bg-[#fdc003] hover:bg-[#fabd00] text-[#6c5000] font-bold py-4 rounded-2xl shadow-lg transition-all duration-200 flex items-center justify-center gap-2 text-base cursor-pointer"
          >
            Mulai Sekarang
            <span className="material-symbols-outlined">arrow_forward</span>
          </motion.button>
          
          <p className="text-center text-sm text-[#74777e]">
            Sudah memiliki akun?{' '}
            <button onClick={onMasuk} className="text-[#000f22] font-extrabold underline underline-offset-4 cursor-pointer">
              Masuk
            </button>
          </p>
        </div>
      </main>

      {/* Decorative Atmosphere Vectors */}
      <div className="fixed -bottom-20 -right-20 w-64 h-64 bg-[#ffdf9e]/10 rounded-full blur-[80px] pointer-events-none"></div>
      <div className="fixed top-1/2 -left-20 w-48 h-48 bg-[#d2e4ff]/10 rounded-full blur-[60px] pointer-events-none"></div>
    </div>
  );
}
