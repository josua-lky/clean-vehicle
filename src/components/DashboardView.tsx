import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookingState, Car, Transaction } from '../types';
import LocationModal from './LocationModal';
import api from '../services/api';

interface DashboardViewProps {
  darkMode: boolean;
  onToggleTheme: () => void;
  userName: string;
  userAvatar: string;
  userPhone?: string;
  booking: BookingState;
  onUpdateBooking: (updated: Partial<BookingState>) => void;
  onBookService: (serviceName: 'rumah' | 'tempat' | 'view_packages') => void;
  onNavigate: (tab: 'home' | 'history' | 'alerts' | 'profile') => void;

  cars: Car[];
  packages: any[];
  onSaveLocation: (locationName: string, pickupLocation: string, lat?: number, lon?: number) => void;
  transactions: Transaction[];
  unreadCount: number;
  promos: any[];
}

export default function DashboardView({ darkMode, onToggleTheme, userName, userAvatar, userPhone, booking, cars, packages = [], onUpdateBooking, onBookService, onNavigate, onSaveLocation, transactions, unreadCount, promos = [] }: DashboardViewProps) {
  const [vehicleType, setVehicleType] = useState<'mobil' | 'motor'>(booking.vehicleType || 'mobil');

  // States for OnoPay
  const [onoBalance, setOnoBalance] = useState<number | null>(null);
  const [onoLoading, setOnoLoading] = useState<boolean>(false);
  const [onoUserExists, setOnoUserExists] = useState<boolean | null>(null);
  const [onoError, setOnoError] = useState<string | null>(null);
  const [showTopUpModal, setShowTopUpModal] = useState<boolean>(false);
  const [topUpAmount, setTopUpAmount] = useState<string>('');
  const [topUpLoading, setTopUpLoading] = useState<boolean>(false);

  const fetchOnoBalance = async () => {
    if (!userPhone) return;
    setOnoLoading(true);
    setOnoError(null);
    try {
      // 1. Check if user exists on OnoPay
      const checkUserRes = await fetch('http://onopay.web.id/api/v1/merchant/check-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ phone_number: userPhone })
      });
      const checkUserData = await checkUserRes.json();
      
      if (!checkUserRes.ok || !checkUserData.success) {
        setOnoUserExists(false);
        setOnoBalance(null);
        setOnoLoading(false);
        return;
      }

      setOnoUserExists(true);

      // 2. Fetch balance
      const checkBalRes = await fetch('http://onopay.web.id/api/v1/merchant/check-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ phone_number: userPhone })
      });
      const checkBalData = await checkBalRes.json();
      if (checkBalRes.ok && checkBalData.success) {
        setOnoBalance(Number(checkBalData.data.balance));
      } else {
        setOnoError('Gagal mengambil saldo OnoPay.');
      }
    } catch (err: any) {
      console.error('Error fetching OnoPay balance:', err);
      setOnoError('Terjadi kesalahan koneksi ke server OnoPay.');
    } finally {
      setOnoLoading(false);
    }
  };

  const handleRegisterOnoPay = async () => {
    if (!userPhone) return;
    setOnoLoading(true);
    setOnoError(null);
    try {
      const regRes = await api.post('/profile/register-onopay', { phone: userPhone });
      if (regRes.data.success) {
        await fetchOnoBalance();
      } else {
        setOnoError(regRes.data.message || 'Gagal mendaftarkan akun OnoPay.');
      }
    } catch (err: any) {
      console.error('OnoPay registration error:', err);
      setOnoError(err?.response?.data?.message || err.message || 'Gagal mendaftarkan akun OnoPay.');
    } finally {
      setOnoLoading(false);
    }
  };

  const handleTopUpSubmit = async (amount: number) => {
    if (!userPhone || isNaN(amount) || amount <= 0) return;
    setTopUpLoading(true);
    try {
      const topupRes = await fetch('http://onopay.web.id/api/v1/payment/topup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ phone_number: userPhone, amount })
      });
      const topupData = await topupRes.json();
      if (topupRes.ok && topupData.success) {
        if (topupData.data && topupData.data.status === 'pending') {
          alert(`Top Up sebesar Rp ${amount.toLocaleString('id-ID')} berhasil diajukan dan sedang menunggu persetujuan admin OnoPay.`);
        } else {
          alert(`Top Up sukses! Saldo Anda bertambah Rp ${amount.toLocaleString('id-ID')}`);
          if (topupData.data && topupData.data.new_balance !== undefined) {
            setOnoBalance(Number(topupData.data.new_balance));
          }
        }
        setShowTopUpModal(false);
        setTopUpAmount('');
      } else {
        alert(topupData.message || 'Gagal melakukan top up.');
      }
    } catch (err: any) {
      console.error('Top up error:', err);
      alert('Terjadi kesalahan koneksi saat top up.');
    } finally {
      setTopUpLoading(false);
    }
  };

  useEffect(() => {
    if (userPhone) {
      fetchOnoBalance();
    }
  }, [userPhone]);
  const hasUsedFirstPromo = React.useMemo(() => {
    return (transactions || []).some(t => t.promoCode === 'FIRST30' && t.status !== 'Dibatalkan');
  }, [transactions]);
  const targetType = vehicleType === 'motor' ? 'roda_2' : 'roda_4';
  const filteredPackages = React.useMemo(() => {
    return packages.filter((p: any) => p.vehicle_type === targetType || p.vehicle_type === 'all');
  }, [packages, targetType]);

  const packagesList = React.useMemo(() => {
    return filteredPackages.map((p: any) => {
      let keyId = 'premium';
      if (p.name.toLowerCase().includes('basic')) keyId = 'basic';
      else if (p.name.toLowerCase().includes('detail')) keyId = 'detailing';
      else if (p.name.toLowerCase().includes('complete')) keyId = 'complete';
      else if (p.name.toLowerCase().includes('engine')) keyId = 'engine';

      let imgUrl = 'https://lh3.googleusercontent.com/aida-public/AB6AXuC0e_VeOBMHAhAtwt5Ie-13saiWe63Udm5V4JJ0dJ6-DTtLEIiDfHidAE1z4bCGTEXlO6DkCOsJS_lyAATs9w6QJDcLEccbT4R8sDymFB0dLorvTby-L7577dB_fS4wQJoLlBBlpt2ZIH-18CVHQxNKOgcAHeBkPb4cQdT58D2ri_Ds3b0O4XZ3FW78exREwrt40CZ1V3hdPsfgIi8t541T9GAiAQ9gKq_JDlxte0uhfM-SNcukDQjF-0saKScYNBAhTGEVIzIErpwK';
      if (keyId === 'detailing') {
        imgUrl = 'https://lh3.googleusercontent.com/aida-public/AB6AXuBVh-SUG1vo_kOfwIEUys8hIq-OOq7R_ZozfZ355GpxzRy8AsOe5WH4i-h9yh4dOmJPKj8OpXrrnR0lbHoECcpzTALZC2yFkn5M2nRbQArTfJHwUtTxi1yHE_tejWzfZX3IPUDiRXOder3ZGu9hwG45sKl98Ism4rkxzN-tLYtlodndzVkIp2I3c8CFrUe4VXfP7ElAovmC4G4cc1xt35Bo-fZVj0Y96bBTp1GQNK9taJnFFY0_Ppt9aObZBkxBq9pYHjUpp4JlWS7P';
      } else if (keyId === 'complete' || p.name.toLowerCase().includes('interior')) {
        imgUrl = 'https://lh3.googleusercontent.com/aida-public/AB6AXuA9wiEgLXLIV7qnqHMDkRRihBOiGZtnpcjzbDrGnP1hObWxZMoEs8ENjwOxXIKhPJ8bG-1GzRp3r1hgQGKBJ6pcRxERFpzfwwdJikJqMSJICmpH-vwiUjEGh8JPDMSEKfyhFwBYetEdT82wTGAMGf7flDPZOjgcVUYCBwpuu95pXiFlHVXRknr3mV7_6pt3U-v8n_BpaUNAEA_NgBiSeCUip0aBk7qq7jn8jBBjJbYAWw-IYFruRSrPNNI4sDSC7cju8fFP4WJJmZAf';
      }

      const rating = p.sort_order === 2 ? '5.0' : p.sort_order === 4 ? '4.8' : '4.9';

      return {
        id: keyId,
        dbId: p.id,
        name: p.name,
        description: p.description || 'Layanan pembersihan bodi',
        price: Number(p.price),
        priceLabel: `Rp ${Number(p.price).toLocaleString('id-ID')}`,
        imgUrl,
        rating
      };
    });
  }, [filteredPackages]);

  const primaryCar =
  cars.find(
    c => c.isPrimary
  ) || cars[0];

  const [showLocationModal, setShowLocationModal] = useState(false);

  return (
    <div className="bg-[#faf9fb] min-h-screen text-[#1b1c1e] font-sans pb-32">
      {/* Top App Bar */}
      <header className="bg-white/80 backdrop-blur-md border-b border-[#efedf0] shadow-sm sticky top-0 z-50 transition-all duration-200">
        <div className="flex justify-between items-center w-full px-5 py-3 max-w-screen-xl mx-auto">
          {/* User Profile Headshot (Moved to Top Left) */}
          <div 
            onClick={() => onNavigate('profile')}
            className="h-10 w-10 rounded-full overflow-hidden border-2 border-[#ffdf9e] cursor-pointer active:opacity-70 transition-all shrink-0"
            title="Profil Saya"
          >
            <img 
              alt="User profile avatar" 
              className="w-full h-full object-cover" 
              src={userAvatar}
            />
          </div>

          <div className="text-[#0a2540] font-black italic tracking-tighter text-xl">
            Clean Vehicle
          </div>

          {/* Top Controls Row */}
          <div className="flex items-center gap-2.5">
            {/* Theme Toggle Button */}
            <button 
              type="button"
              onClick={onToggleTheme}
              className="w-9 h-9 rounded-xl bg-[#f5f3f6] flex items-center justify-center cursor-pointer active:scale-95 hover:bg-[#efedf0] transition-all text-[#74777e]"
              title={darkMode ? 'Aktifkan Mode Terang' : 'Aktifkan Mode Gelap'}
            >
              <span className="material-symbols-outlined text-[19px]">
                {darkMode ? 'light_mode' : 'dark_mode'}
              </span>
            </button>

            {/* Notification Button (Moved to Top Right) */}
            <button 
              type="button"
              onClick={() => onNavigate('alerts')}
              className="w-9 h-9 rounded-xl bg-[#f5f3f6] flex items-center justify-center cursor-pointer active:scale-95 hover:bg-[#efedf0] transition-all text-[#74777e] relative"
              title="Notifikasi"
            >
              <span className="material-symbols-outlined text-[19px]">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-screen-md mx-auto pt-4 px-5">
        
        {/* OnoPay E-Wallet Card */}
        <section className="mb-6">
          <div className="bg-gradient-to-r from-[#0a2540] via-[#103054] to-[#0a2540] rounded-2xl p-5 text-white relative overflow-hidden shadow-md border border-white/5">
            {/* Background decorative circles */}
            <div className="absolute -right-10 -bottom-10 w-36 h-36 bg-[#fdc003]/10 rounded-full blur-2xl"></div>
            <div className="absolute -left-10 -top-10 w-24 h-24 bg-blue-500/15 rounded-full blur-xl"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="h-12 w-12 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md shrink-0 border border-white/10">
                  <span className="material-symbols-outlined text-[#fdc003] text-2xl">account_balance_wallet</span>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[#768dad]">OnoPay E-Wallet</span>
                    {onoUserExists && (
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" title="Terhubung"></span>
                    )}
                  </div>
                  
                  {onoLoading ? (
                    <div className="h-6 w-32 bg-white/10 animate-pulse rounded-md mt-1"></div>
                  ) : onoError ? (
                    <p className="text-xs text-red-400 font-semibold mt-0.5">{onoError}</p>
                  ) : onoUserExists === false ? (
                    <p className="text-xs text-white/60 font-semibold mt-0.5">Akun OnoPay belum terhubung</p>
                  ) : (
                    <h2 className="text-xl font-black text-white mt-0.5 tracking-tight">
                      Rp {(onoBalance ?? 0).toLocaleString('id-ID')}
                    </h2>
                  )}
                </div>
              </div>

              <div className="flex gap-2 shrink-0">
                {onoUserExists === false ? (
                  <button
                    onClick={handleRegisterOnoPay}
                    disabled={onoLoading}
                    className="w-full md:w-auto bg-[#fdc003] hover:bg-[#fabd00] text-[#6c5000] font-black text-xs px-5 py-2.5 rounded-xl active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
                  >
                    <span className="material-symbols-outlined text-sm">link</span>
                    Hubungkan Akun
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => setShowTopUpModal(true)}
                      className="flex-1 md:flex-initial bg-[#fdc003] hover:bg-[#fabd00] text-[#6c5000] font-black text-xs px-5 py-2.5 rounded-xl active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
                    >
                      <span className="material-symbols-outlined text-sm font-bold">add</span>
                      Top Up
                    </button>
                    <button
                      onClick={fetchOnoBalance}
                      disabled={onoLoading}
                      className="p-2.5 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 transition-all cursor-pointer border border-white/10 flex items-center justify-center"
                      title="Segarkan Saldo"
                    >
                      <span className={`material-symbols-outlined text-sm text-white ${onoLoading ? 'animate-spin' : ''}`}>
                        refresh
                      </span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Promotional Carousel Section */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-3 px-1">
            <h3 className="text-base font-bold text-[#000f22]">Promo Spesial</h3>
            <span className="text-[10px] font-extrabold text-[#785900] bg-[#ffdf9e]/30 px-2.5 py-1 rounded-full uppercase tracking-wider">
              {promos.length} Promo Aktif
            </span>
          </div>

          {promos.length === 0 ? (
            <div className="relative w-full aspect-[21/9] rounded-2xl overflow-hidden bg-gradient-to-r from-[#0a2540] to-[#1a3a5f] flex items-center justify-center p-6 text-center border border-white/10 shadow-lg">
              <div>
                <span className="material-symbols-outlined text-[#fdc003] text-3xl animate-pulse mb-2">celebration</span>
                <h4 className="text-white text-sm font-bold">Belum Ada Promo Aktif</h4>
                <p className="text-[#768dad] text-[10px] mt-1">Nantikan penawaran menarik berikutnya dari kami!</p>
              </div>
            </div>
          ) : (
            <div className="flex overflow-x-auto gap-4 pb-2 -mx-5 px-5 no-scrollbar snap-x snap-mandatory">
              {promos.map((promo: any) => {
                const isNewCustomerPromo = promo.code.includes('FIRST') || 
                                           (promo.description && (
                                             promo.description.toLowerCase().includes('baru') || 
                                             promo.description.toLowerCase().includes('pertama')
                                           ));

                const hasPastOrders = (transactions || []).some(t => t.status !== 'Dibatalkan');
                const isEligible = !isNewCustomerPromo || !hasPastOrders;
                const isUsedMax = promo.max_usage && promo.used_count >= promo.max_usage;

                const userUsageCount = (transactions || []).filter(t => t.promoCode === promo.code && t.status !== 'Dibatalkan').length;
                const maxUsagePerUser = promo.max_usage_per_user ?? 1;
                const hasExceededUserLimit = userUsageCount >= maxUsagePerUser;

                let buttonLabel = 'Gunakan Promo';
                let isDisabled = false;
                let reasonBadge = '';

                if (hasExceededUserLimit) {
                  buttonLabel = 'Sudah Diklaim';
                  isDisabled = true;
                  reasonBadge = 'Sudah Diklaim';
                } else if (isNewCustomerPromo && hasPastOrders) {
                  buttonLabel = 'Khusus Pelanggan Baru';
                  isDisabled = true;
                  reasonBadge = 'Pelanggan Baru';
                } else if (isUsedMax) {
                  buttonLabel = 'Kuota Habis';
                  isDisabled = true;
                  reasonBadge = 'Kuota Habis';
                }

                const isCurrentlyApplied = booking.appliedPromoCode === promo.code;
                if (isCurrentlyApplied) {
                  buttonLabel = 'Promo Diterapkan';
                }

                const bgImg = promo.code === 'FIRST30' 
                  ? 'https://lh3.googleusercontent.com/aida-public/AB6AXuCHBFXnfazN8GvKRu0X9OD3Q7XF9gQvsqdx1wmYX4u_U8JTjRaxCtKlgzwAZWnlJpeKSa1SRY6BgfqwAMIE65HxyiT5SJ2jupE-YVAnVE_Kq-mtqpw4CpG-S76ipVRhcYcLkNQsACnglY4fO-bieY3dOjwCDmSxZcm6Bscq9axguST0E1lFkN697SyVeC-ec9WrCDqoUJh0K_0HXYASnjwBwTJhmMdaZPzk22hlV0KYt_VXKw8y7GSxph4Iq8l-C1oNHUXzWIh_GuPp'
                  : 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&q=80&w=600';

                return (
                  <div 
                    key={promo.id} 
                    className="min-w-[85%] md:min-w-[70%] snap-align-start relative aspect-[21/9] rounded-2xl overflow-hidden premium-shadow group shrink-0 border border-white/5 bg-[#0a2540]"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-[#0a2540]/95 via-[#0a2540]/75 to-transparent z-10"></div>
                    <img 
                      alt={promo.name}
                      className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:scale-105 transition-transform duration-700" 
                      src={bgImg}
                    />
                    <div className="relative z-20 h-full flex flex-col justify-center px-5 py-4 max-w-[85%]">
                      <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                        <span className="text-[8px] font-black text-[#0a2540] bg-[#fdc003] px-2 py-0.5 rounded-md tracking-wider uppercase">
                          KODE: {promo.code}
                        </span>
                        {reasonBadge && (
                          <span className="text-[8px] font-black text-white bg-red-600 px-2 py-0.5 rounded-md tracking-wider uppercase">
                            {reasonBadge}
                          </span>
                        )}
                        {promo.min_transaction && (
                          <span className="text-[8px] font-black text-[#768dad] bg-white/10 px-2 py-0.5 rounded-md tracking-wider">
                            Min. Rp {Number(promo.min_transaction).toLocaleString('id-ID')}
                          </span>
                        )}
                      </div>
                      
                      <h4 className="text-[15px] md:text-base font-black text-white leading-tight line-clamp-1">
                        {promo.name}
                      </h4>
                      
                      <p className="text-[10px] text-[#768dad] font-semibold mt-1 mb-2 line-clamp-2 leading-relaxed">
                        {promo.description || 'Diskon spesial untuk pembersihan kendaraan Anda.'}
                      </p>

                      <div className="flex items-center gap-2">
                        {isDisabled ? (
                          <button 
                            disabled
                            className="bg-slate-700/60 text-slate-400 font-extrabold text-[10px] px-3.5 py-1.5 rounded-lg shrink-0 cursor-not-allowed opacity-60"
                          >
                            {buttonLabel}
                          </button>
                        ) : isCurrentlyApplied ? (
                          <button 
                            onClick={() => {
                              onUpdateBooking({ appliedPromoCode: null });
                            }}
                            className="bg-emerald-600 text-white font-extrabold text-[10px] px-3.5 py-1.5 rounded-lg shrink-0 hover:bg-emerald-700 transition-colors cursor-pointer flex items-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[12px] font-bold">check</span>
                            {buttonLabel}
                          </button>
                        ) : (
                          <button 
                            onClick={() => {
                              const updates: Partial<BookingState> = {
                                appliedPromoCode: promo.code
                              };
                              if (promo.code === 'FIRST30') {
                                updates.selectedPackageId = 'detailing';
                              }
                              onUpdateBooking(updates);
                              alert(`Promo ${promo.code} berhasil diterapkan!`);
                            }}
                            className="bg-[#fdc003] hover:bg-[#fabd00] text-[#6c5000] font-extrabold text-[10px] px-3.5 py-1.5 rounded-lg shrink-0 active:scale-95 transition-all cursor-pointer"
                          >
                            {buttonLabel}
                          </button>
                        )}
                        
                        {promo.expires_at && (
                          <span className="text-[8px] text-[#768dad] font-bold">
                            s/d {new Date(promo.expires_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Dynamic Categories - Motor or Mobil */}
        <section className="mb-6">
          <h3 className="text-base font-bold text-[#000f22] mb-3">Tipe Kendaraan</h3>
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => {
                setVehicleType('motor');
                onUpdateBooking({ vehicleType: 'motor' });
              }}
              className={`flex items-center gap-4 p-4 rounded-xl shadow-sm border transition-all cursor-pointer ${
                vehicleType === 'motor' 
                  ? 'bg-white border-[#fdc003] ring-1 ring-[#fdc003]' 
                  : 'bg-white border-transparent hover:bg-slate-50'
              }`}
            >
              <div className="h-10 w-10 bg-[#ffdf9e]/30 rounded-full flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[#785900] text-2xl">motorcycle</span>
              </div>
              <span className="font-extrabold text-sm text-[#000f22]">Motor</span>
            </button>

            <button 
              onClick={() => {
                setVehicleType('mobil');
                onUpdateBooking({ vehicleType: 'mobil' });
              }}
              className={`flex items-center gap-4 p-4 rounded-xl shadow-sm border transition-all cursor-pointer ${
                vehicleType === 'mobil' 
                  ? 'bg-white border-[#fdc003] ring-1 ring-[#fdc003]' 
                  : 'bg-white border-transparent hover:bg-slate-50'
              }`}
            >
              <div className="h-10 w-10 bg-[#ffdf9e]/30 rounded-full flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[#785900] text-2xl">directions_car</span>
              </div>
              <span className="font-extrabold text-sm text-[#000f22]">Mobil</span>
            </button>
          </div>
        </section>

        {/* Main Menu Bento Grid - Services */}
        <section className="mb-6">
          <h3 className="text-base font-bold text-[#000f22] mb-3">Layanan Utama</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Cuci Di Rumah */}
            <div 
              onClick={() => {

                onUpdateBooking({
              
                  selectedCarId:
                    '1'
              
                });
              
                onBookService('rumah');
              
              }}
              className="bg-[#0a2540] rounded-2xl p-5 flex flex-col justify-between h-48 relative overflow-hidden active:scale-[0.98] transition-transform cursor-pointer group"
            >
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
              <div>
                <div className="bg-white/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4 backdrop-blur-md">
                  <span className="material-symbols-outlined text-[#fdc003] text-2xl">house</span>
                </div>
                <h4 className="text-lg font-bold text-white">Cuci di Rumah</h4>
                <p className="text-xs text-[#768dad] mt-1">Kami datang ke lokasi Anda</p>
              </div>
              <div className="flex items-center gap-2 text-[#fdc003] text-xs font-bold mt-2">
                <span>Pesan Sekarang</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </div>
            </div>

            {/* Cuci Di Tempat */}
            <div 
              onClick={() => {

                if (primaryCar) {
              
                  onUpdateBooking({
              
                    selectedCarId:
                      primaryCar.id
              
                  });
              
                }
              
                onBookService('tempat');
              
              }}
              className="bg-white rounded-2xl p-5 flex flex-col justify-between h-48 relative overflow-hidden shadow-sm border border-[#efedf0] active:scale-[0.98] transition-transform cursor-pointer group"
            >
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-[#fdc003]/5 rounded-full blur-2xl"></div>
              <div>
                <div className="bg-[#fdc003]/10 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                  <span className="material-symbols-outlined text-[#785900] text-2xl">storefront</span>
                </div>
                <h4 className="text-lg font-bold text-[#000f22]">Cuci di Tempat</h4>
                <p className="text-xs text-[#74777e] mt-1">Kunjungi outlet terdekat kami</p>
              </div>
              <div className="flex items-center gap-2 text-[#785900] text-xs font-bold mt-2">
                <span>Cari Outlet</span>
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </div>
            </div>

          </div>
        </section>

        {/* Recommended Packages Carousel list */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-[#000f22]">Rekomendasi Paket</h3>
            <button 
              onClick={() => onBookService('view_packages')} 
              className="text-[#785900] text-xs font-bold cursor-pointer hover:underline"
            >
              Lihat Semua
            </button>
          </div>

          <div className="flex overflow-x-auto gap-4 pb-4 -mx-5 px-5 no-scrollbar">
            {packagesList.map((pkg) => (
              <div key={pkg.dbId} className="min-w-[280px] md:min-w-[300px] bg-white rounded-2xl overflow-hidden shadow-sm border border-[#efedf0] flex flex-col justify-between">
                <div className="h-32 relative">
                  <img 
                    className="w-full h-full object-cover" 
                    src={pkg.imgUrl}
                    alt={pkg.name}
                  />
                  <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                    <span className="material-symbols-outlined text-amber-500 text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="text-[10px] font-extrabold text-[#000f22]">{pkg.rating}</span>
                  </div>
                </div>
                <div className="p-4 flex flex-col justify-between flex-grow">
                  <div>
                    <h5 className="text-[15px] font-bold text-[#000f22] line-clamp-1">{pkg.name}</h5>
                    <p className="text-xs text-[#74777e] mt-1 leading-normal line-clamp-2">{pkg.description}</p>
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-base font-extrabold text-[#000f22]">{pkg.priceLabel}</span>
                    <button 
                      onClick={() => {
                        onUpdateBooking({
                          selectedPackageId: pkg.id,
                          vehicleType: vehicleType
                        });
                        onBookService('rumah');
                      }}
                      className="h-8 w-8 bg-[#000f22] hover:bg-black rounded-full flex items-center justify-center text-white active:scale-90 transition-transform cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">add</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

      </main>

      {/* Floating Action Button for quick booking */}
      <button 
        onClick={() => onBookService('rumah')}
        className="fixed bottom-24 right-6 h-14 w-14 bg-[#fdc003] text-[#000f22] rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-transform z-40 hover:brightness-105 cursor-pointer border border-white/25"
      >
        <span className="material-symbols-outlined text-2xl font-bold">calendar_month</span>
      </button>

      {/* Bottom Nav Bar Navigation */}
      <nav className="bg-white/95 backdrop-blur-lg border-t border-[#efedf0] shadow-2lg fixed bottom-0 left-0 w-full z-50">
        <div className="flex justify-around items-center px-4 pb-6 pt-3">
          
          {/* Home Active tab */}
          <button 
            onClick={() => onNavigate('home')} 
            className="flex flex-col items-center justify-center text-[#fdc003] bg-[#ffdf9e]/30 rounded-2xl px-5 py-2 active:scale-95 transition-transform duration-150 cursor-pointer text-xs font-bold gap-1"
          >
            <span className="material-symbols-outlined">home</span>
            <span className="uppercase tracking-wider text-[9px] font-extrabold">Home</span>
          </button>

          {/* History tab */}
          <button 
            onClick={() => onNavigate('history')} 
            className="flex flex-col items-center justify-center text-[#74777e] hover:text-[#000f22] transition-colors cursor-pointer text-xs font-semibold gap-1"
          >
            <span className="material-symbols-outlined">history</span>
            <span className="uppercase tracking-wider text-[9px]">History</span>
          </button>

          {/* Profile tab */}
          <button 
            onClick={() => onNavigate('profile')} 
            className="flex flex-col items-center justify-center text-[#74777e] hover:text-[#000f22] transition-colors cursor-pointer text-xs font-semibold gap-1"
          >
            <span className="material-symbols-outlined">person</span>
            <span className="uppercase tracking-wider text-[9px]">Profile</span>
          </button>

        </div>
      </nav>

      <LocationModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        initialLocationName={booking.locationName}
        initialPickupLocation={booking.pickupLocation}
        onSave={onSaveLocation}
      />

      {/* OnoPay Top Up Modal */}
      <AnimatePresence>
        {showTopUpModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-[#000f22]/60 backdrop-blur-sm"
              onClick={() => !topUpLoading && setShowTopUpModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 15 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="bg-white rounded-3xl p-6 w-full max-w-sm relative z-10 shadow-2xl border border-slate-100"
            >
              <div className="flex justify-between items-center mb-5">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#fdc003] text-2xl font-bold">add_card</span>
                  <h3 className="text-base font-black text-[#0a2540]">Top Up OnoPay</h3>
                </div>
                <button
                  onClick={() => !topUpLoading && setShowTopUpModal(false)}
                  className="text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>

              <div className="space-y-4">
                {/* Nominal presets */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-[#74777e] mb-2 block">Pilih Nominal Cepat</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[50000, 100000, 200000, 500000].map((val) => (
                      <button
                        key={val}
                        onClick={() => setTopUpAmount(String(val))}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          topUpAmount === String(val)
                            ? 'bg-[#0a2540] text-white border-transparent shadow-sm'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        Rp {val.toLocaleString('id-ID')}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom input */}
                <div>
                  <label className="text-[10px] font-black uppercase tracking-wider text-[#74777e] mb-2 block">Nominal Kustom (Min. Rp 1.000)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">Rp</span>
                    <input
                      type="number"
                      placeholder="0"
                      value={topUpAmount}
                      onChange={(e) => setTopUpAmount(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-bold text-[#0a2540] focus:outline-none focus:ring-1 focus:ring-[#fdc003] focus:border-[#fdc003] transition-all"
                      min="1000"
                    />
                  </div>
                </div>

                {/* Action button */}
                <button
                  onClick={() => {
                    const amt = Number(topUpAmount);
                    if (isNaN(amt) || amt < 1000) {
                      alert('Nominal top up minimal Rp 1.000');
                      return;
                    }
                    handleTopUpSubmit(amt);
                  }}
                  disabled={topUpLoading}
                  className="w-full mt-2 bg-[#fdc003] hover:bg-[#fabd00] disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-[#6c5000] font-black text-xs py-3.5 rounded-xl active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
                >
                  {topUpLoading ? (
                    <>
                      <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                      Memproses Top Up...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm font-bold">payments</span>
                      Top Up Sekarang
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
