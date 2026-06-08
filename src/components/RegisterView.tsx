import React, { useState } from 'react';
import { motion } from 'motion/react';
import api from '../services/api';

interface RegisterViewProps {
  onRegisterSuccess: (user: any) => void;
  onGoToLogin: () => void;
  onBack: () => void;
}

export default function RegisterView({ onRegisterSuccess, onGoToLogin, onBack }: RegisterViewProps) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [activeTermsTab, setActiveTermsTab] = useState<'service' | 'privacy' | 'refund'>('service');

  const handleSubmit = async (e: React.FormEvent) => {

    e.preventDefault();
  
    if (!fullName || !phone || !email || !password || !address) {
      setError('Semua kolom wajib diisi.');
      return;
    }
  
    if (!agree) {
      setError(
        'Anda harus menyetujui syarat dan ketentuan.'
      );
      return;
    }
  
    try {
  
      setLoading(true);
      setError('');
  
      const response = await api.post(
        '/register',
        {
          name: fullName,
          email,
          password,
          phone,
          address
        }
      );
  
      // simpan token
      localStorage.setItem(
        'token',
        response.data.token
      );
  
      // simpan user
      localStorage.setItem(
        'user',
        JSON.stringify(
          response.data.user
        )
      );
  
      // redirect ke dashboard
      onRegisterSuccess(
        response.data.user
      );
  
    } catch (err: any) {
  
      console.log(err);
  
      if (err.response?.data?.errors) {
  
        const validationErrors =
          Object.values(
            err.response.data.errors
          ).flat();
  
        setError(
          validationErrors.join(', ')
        );
  
      } else {
  
        setError(
          err.response?.data?.message ||
          'Registrasi gagal'
        );
  
      }
  
    } finally {
  
      setLoading(false);
  
    }
  
  };

  return (
    <div className="min-h-screen bg-[#faf9fb] text-[#1b1c1e] pb-12">
      {/* Top Navbar */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#e9e8ea] px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            type="button"
            onClick={onBack}
            className="flex items-center justify-center p-2 rounded-xl bg-[#efedf0] text-[#000d1a] cursor-pointer hover:bg-[#e9e8ea]"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
          <h1 className="text-xl font-bold text-[#000d1a]">Daftar Akun Baru</h1>
        </div>
        <div className="w-10"></div>
      </nav>

      <main className="max-w-md mx-auto px-5 pt-8">
        <header className="mb-6">
          <h2 className="text-[34px] leading-tight font-extrabold text-[#000f22] mb-2">Mulai Bersama Kami</h2>
          <p className="text-sm text-[#74777e] leading-relaxed">
            Lengkapi data diri Anda untuk mendapatkan layanan premium kendaraan Anda.
          </p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Section: Personal Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-1 border-b border-[#efedf0]">
              <span className="material-symbols-outlined text-[#000f22] text-[20px]">person_outline</span>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#000f22]">Informasi Pribadi</h3>
            </div>

            {/* Nama Lengkap */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-[#74777e] uppercase ml-1">Nama Lengkap</label>
              <div className="premium-input-focus flex items-center bg-white border border-[#e3e2e5] rounded-xl px-4 py-3 shadow-inner">
                <input 
                  type="text" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Contoh: Budi Santoso"
                  className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm text-[#000f22] placeholder-[#dbd9dc]"
                />
              </div>
            </div>

            {/* Nomor Whatsapp */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-[#74777e] uppercase ml-1">Nomor Whatsapp</label>
              <div className="premium-input-focus flex items-center bg-white border border-[#e3e2e5] rounded-xl px-4 py-3 shadow-inner">
                <span className="text-sm font-semibold text-[#000f22] mr-2">+62</span>
                <input 
                  type="tel" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="812 3456 7890"
                  className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm text-[#000f22] placeholder-[#dbd9dc]"
                />
              </div>
            </div>

            {/* Alamat Lengkap */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-[#74777e] uppercase ml-1">Alamat Lengkap</label>
              <div className="premium-input-focus flex items-start bg-white border border-[#e3e2e5] rounded-xl px-4 py-3 shadow-inner">
                <textarea 
                  rows={3}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Jl. Kemang Raya No. 123, Jakarta Selatan..."
                  className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm text-[#000f22] placeholder-[#dbd9dc] resize-none"
                />
              </div>
            </div>
          </div>

          {/* Section: Account Credentials */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-1 border-b border-[#efedf0]">
              <span className="material-symbols-outlined text-[#000f22] text-[20px]">lock_outline</span>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#000f22]">Kredensial Akun</h3>
            </div>

            {/* Email Address */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-[#74777e] uppercase ml-1">Email Address</label>
              <div className="premium-input-focus flex items-center bg-white border border-[#e3e2e5] rounded-xl px-4 py-3 shadow-inner">
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="budi.santoso@email.com"
                  className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm text-[#000f22] placeholder-[#dbd9dc]"
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-bold text-[#74777e] uppercase ml-1">Password</label>
              <div className="premium-input-focus flex items-center bg-white border border-[#e3e2e5] rounded-xl px-4 py-3 shadow-inner">
                <input 
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-transparent border-none p-0 focus:ring-0 text-sm text-[#000f22] placeholder-[#dbd9dc]"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[#74777e] hover:text-[#000f22]"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              <p className="text-[10px] text-[#74777e] mt-1 ml-1 leading-tight">Minimal 8 karakter dengan kombinasi angka dan huruf.</p>
            </div>
          </div>

          {/* Terms checkbox */}
          <div className="flex items-start gap-3 py-2">
            <input 
              id="agree-checkbox"
              type="checkbox" 
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              className="mt-1 rounded border-[#74777e] text-[#fdc003] focus:ring-[#fdc003] w-4 h-4 cursor-pointer"
            />
            <label htmlFor="agree-checkbox" className="text-xs leading-relaxed text-[#74777e] select-none">
              Saya menyetujui{' '}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveTermsTab('service');
                  setShowTermsModal(true);
                }}
                className="text-[#000f22] font-semibold underline hover:text-[#fdc003] transition-colors cursor-pointer"
              >
                Syarat & Ketentuan
              </button>{' '}
              serta{' '}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveTermsTab('privacy');
                  setShowTermsModal(true);
                }}
                className="text-[#000f22] font-semibold underline hover:text-[#fdc003] transition-colors cursor-pointer"
              >
                Kebijakan Privasi
              </button>{' '}
              yang berlaku di Clean Vehicle.
            </label>
          </div>

          {/* Create submit CTA button */}
          <div className="pt-4">
            <motion.button 
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full bg-[#fdc003] text-[#6c5000] py-4 rounded-xl shadow-[0_4px_16px_rgba(253,192,3,0.3)] hover:brightness-105 active:scale-[0.98] transition-all font-bold text-center tracking-wider text-sm uppercase cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-[#6c5000] border-t-transparent rounded-full animate-spin mx-auto"></div>
              ) : (
                'Daftar Sekarang'
              )}
            </motion.button>
          </div>
        </form>

        {/* Footer info link */}
        <div className="mt-8 text-center">
          <p className="text-sm text-[#74777e]">Sudah memiliki akun?</p>
          <button 
            onClick={onGoToLogin} 
            className="mt-2 text-base font-bold text-[#0a2540] hover:text-[#000f22] cursor-pointer hover:underline"
          >
            Masuk
          </button>
        </div>
      </main>

      {/* Decorative Atmosphere Vectors */}
      <div className="fixed -bottom-20 -right-20 w-64 h-64 bg-[#fdc003]/10 rounded-full blur-[100px] pointer-events-none -z-10"></div>
      <div className="fixed -top-20 -left-20 w-64 h-64 bg-[#0a2540]/5 rounded-full blur-[100px] pointer-events-none -z-10"></div>

      {showTermsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 flex flex-col max-h-[80vh] overflow-hidden animate-scale-in text-[#1b1c1e]">
            
            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b border-slate-100 flex-shrink-0">
              <div className="flex items-center gap-2.5 text-[#0a2540]">
                <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-[#785900]">
                  <span className="material-symbols-outlined font-extrabold text-lg">gavel</span>
                </div>
                <div>
                  <h3 className="text-sm font-black text-[#000f22] leading-tight">Ketentuan & Kebijakan</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Terakhir Diperbarui: Mei 2026</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setShowTermsModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">close</span>
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-slate-100 bg-[#fbfafc] flex-shrink-0">
              <button
                type="button"
                onClick={() => setActiveTermsTab('service')}
                className={`flex-1 py-3.5 text-[10px] font-extrabold uppercase tracking-widest transition-all border-b-2 text-center cursor-pointer ${
                  activeTermsTab === 'service' 
                    ? 'border-[#fdc003] text-[#785900] bg-white font-black' 
                    : 'border-transparent text-slate-400 hover:text-slate-800'
                }`}
              >
                Layanan
              </button>
              <button
                type="button"
                onClick={() => setActiveTermsTab('privacy')}
                className={`flex-1 py-3.5 text-[10px] font-extrabold uppercase tracking-widest transition-all border-b-2 text-center cursor-pointer ${
                  activeTermsTab === 'privacy' 
                    ? 'border-[#fdc003] text-[#785900] bg-white font-black' 
                    : 'border-transparent text-slate-400 hover:text-slate-800'
                }`}
              >
                Privasi
              </button>
              <button
                type="button"
                onClick={() => setActiveTermsTab('refund')}
                className={`flex-1 py-3.5 text-[10px] font-extrabold uppercase tracking-widest transition-all border-b-2 text-center cursor-pointer ${
                  activeTermsTab === 'refund' 
                    ? 'border-[#fdc003] text-[#785900] bg-white font-black' 
                    : 'border-transparent text-slate-400 hover:text-slate-800'
                }`}
              >
                Refund
              </button>
            </div>

            {/* Scrollable Terms Content */}
            <div className="p-5 overflow-y-auto flex-1 space-y-4 text-[11px] text-slate-600 font-semibold leading-relaxed">
              {activeTermsTab === 'service' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="space-y-1">
                    <h4 className="text-[11px] font-black text-[#000f22] uppercase tracking-wider flex items-center gap-1.5 text-amber-600">
                      <span className="material-symbols-outlined text-[16px]">local_car_wash</span>
                      1. Cakupan Layanan Wash
                    </h4>
                    <p>
                      Clean Vehicle melayani pembersihan, pencucian, pemolesan, dan vacuuming kendaraan (mobil & motor) baik secara ONSITE di outlet-outlet resmi mitra kami atau HOME SERVICE (panggilan langsung ke lokasi rumah atau kantor Anda).
                    </p>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-[11px] font-black text-[#000f22] uppercase tracking-wider flex items-center gap-1.5 text-amber-600">
                      <span className="material-symbols-outlined text-[16px]">schedule</span>
                      2. Penjadwalan & Kedatangan
                    </h4>
                    <p>
                      Waktu penugasan teknisi disesuaikan dengan rentang waktu nyata yang Anda pilih saat melakukan pemesanan. Kami mengoptimalkan pelacakan waktu nyata (ETA) agar kedatangan teknisi presisi. Keterlambatan karena faktor cuaca ekstrem atau kemacetan akan diinfokan via notifikasi langsung.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-[11px] font-black text-[#000f22] uppercase tracking-wider flex items-center gap-1.5 text-amber-600">
                      <span className="material-symbols-outlined text-[16px]">shield_person</span>
                      3. Tanggung Jawab & Jaminan Keamanan
                    </h4>
                    <p>
                      Seluruh teknisi kami telah melewati verifikasi latar belakang ketat, pelatihan profesional bersertifikat, dan dilengkapi peralatan standar industri. Pengguna wajib menyertakan info kondisi fisik awal kendaraan jika terdapat lecet/dent bawaan sebelum pengerjaan dimulai.
                    </p>
                  </div>
                </div>
              )}

              {activeTermsTab === 'privacy' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="space-y-1">
                    <h4 className="text-[11px] font-black text-[#000f22] uppercase tracking-wider flex items-center gap-1.5 text-emerald-600">
                      <span className="material-symbols-outlined text-[16px]">location_on</span>
                      1. Penggunaan Data Lokasi & GPS
                    </h4>
                    <p>
                      Aplikasi melacak posisi GPS waktu nyata dari teknisi dan pengguna hanya saat pesanan aktif ("Dipesan"), guna mendelegasikan pesanan ke teknisi terdekat dan memberikan radar perjalanan presisi tinggi pada dasbor Anda.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-[11px] font-black text-[#000f22] uppercase tracking-wider flex items-center gap-1.5 text-emerald-600">
                      <span className="material-symbols-outlined text-[16px]">key</span>
                      2. Enkripsi Keamanan Sandi & Akun
                    </h4>
                    <p>
                      Kata sandi dan data pribadi Anda dienkripsi secara aman dalam penyimpanan sistem lokal dengan standar enkripsi modern. Kami tidak akan pernah membagikan atau menjual basis data pengguna kepada pihak ketiga mana pun tanpa izin eksplisit dari Anda.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-[11px] font-black text-[#000f22] uppercase tracking-wider flex items-center gap-1.5 text-emerald-600">
                      <span className="material-symbols-outlined text-[16px]">notifications_active</span>
                      3. Preferensi Notifikasi Peringatan
                    </h4>
                    <p>
                      Anda dapat menyesuaikan pengaturan notifikasi real-time, suara bel pemesanan, atau peringatan kedatangan teknisi di tab notifikasi profil Anda guna kenyamanan bersosial dan privasi optimal.
                    </p>
                  </div>
                </div>
              )}

              {activeTermsTab === 'refund' && (
                <div className="space-y-4 animate-fade-in">
                  <div className="space-y-1">
                    <h4 className="text-[11px] font-black text-[#000f22] uppercase tracking-wider flex items-center gap-1.5 text-amber-700">
                      <span className="material-symbols-outlined text-[16px]">cancel</span>
                      1. Kebijakan Pembatalan Pesanan
                    </h4>
                    <p>
                      Pengguna berhak membatalkan pesanan yang berstatus aktif ("Dipesan") kapan saja langsung dari menu lacak pesanan secara gratis sebelum teknisi ditugaskan atau berangkat ke lokasi Anda.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-[11px] font-black text-[#000f22] uppercase tracking-wider flex items-center gap-1.5 text-amber-700">
                      <span className="material-symbols-outlined text-[16px]">account_balance_wallet</span>
                      2. Syarat Pengembalian Dana (Refund)
                    </h4>
                    <p>
                      Apabila pembatalan sukses disetujui, dana pembayaran Anda (termasuk transfer bank mau pun dompet digital saldo e-wallet) akan dikembalikan secara penuh dan instan ke saldo Dompet digital Clean Vehicle Anda, yang dapat langsung digunakan kembali untuk transaksi berikutnya.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <h4 className="text-[11px] font-black text-[#000f22] uppercase tracking-wider flex items-center gap-1.5 text-amber-700">
                      <span className="material-symbols-outlined text-[16px]">emergency</span>
                      3. Ganti Rugi Khusus
                    </h4>
                    <p>
                      Ganti rugi khusus dapat diajukan apabila terdapat kerusakan kosmetik kendaraan material yang secara nyata terbukti disebabkan oleh kelalaian prosedural pencucian oleh teknisi bersangkutan.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-2 flex-shrink-0">
              <button 
                type="button"
                onClick={() => {
                  setAgree(true);
                  setShowTermsModal(false);
                }}
                className="w-full py-3 bg-[#0a2540] hover:bg-[#0a2540]/90 text-[#fdc003] rounded-xl font-extrabold text-[11px] cursor-pointer transition-all uppercase tracking-widest active:scale-95 text-center shadow-sm"
              >
                Setujui & Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
