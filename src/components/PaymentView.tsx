import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { BookingState } from '../types';
import api from '../services/api';

interface PaymentViewProps {
  booking: BookingState;
  onPaymentSuccess: (amount: number, method: string) => void;
  onBack: () => void;
  userAvatar?: string;
  userPhone?: string;
  packages: any[];
  promos: any[];
  transactions: any[];
}

export default function PaymentView({ booking, onPaymentSuccess, onBack, userAvatar, userPhone, packages, promos = [], transactions = [] }: PaymentViewProps) {
  const [phoneInput, setPhoneInput] = useState<string>(userPhone || '081234000001');
  const [step, setStep] = useState<'input' | 'qr'>('input');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // States to hold OnoPay API data
  const [onoUser, setOnoUser] = useState<any | null>(null);
  const [qrData, setQrData] = useState<any | null>(null);

  const [seconds, setSeconds] = useState(899); // 14 mins 59 secs

  const targetType = booking.vehicleType === 'motor' ? 'roda_2' : 'roda_4';
  const selectedPkg = packages.find(p => String(p.id) === String(booking.selectedPackageId))
                    || packages.find(p => p.vehicle_type === targetType && p.name.toLowerCase().includes(booking.selectedPackageId.toLowerCase()))
                    || packages.find(p => p.name.toLowerCase().includes(booking.selectedPackageId.toLowerCase()))
                    || packages.find(p => p.vehicle_type === targetType && (
                         booking.selectedPackageId === 'basic' ? p.name.toLowerCase().includes('basic') :
                         booking.selectedPackageId === 'detailing' ? p.name.toLowerCase().includes('detail') :
                         booking.selectedPackageId === 'complete' ? p.name.toLowerCase().includes('complete') :
                         booking.selectedPackageId === 'engine' ? p.name.toLowerCase().includes('engine') :
                         p.name.toLowerCase().includes('premium')
                       ))
                    || packages[0]
                    || { name: 'Premium Wash', price: 120000 };
  
  const baseServicePrice = Number(selectedPkg.price || 0);

  // Dynamic Promo Validation and Discount Calculation
  const appliedPromo = promos.find(p => p.code.toUpperCase() === (booking.appliedPromoCode || '').toUpperCase());
  
  let discountVal = 0;

  if (booking.appliedPromoCode) {
    if (appliedPromo) {
      const now = new Date();
      let isValid = true;
      if (appliedPromo.starts_at && new Date(appliedPromo.starts_at) > now) {
        isValid = false;
      } else if (appliedPromo.expires_at && new Date(appliedPromo.expires_at) < now) {
        isValid = false;
      }
      else if (appliedPromo.min_transaction && baseServicePrice < Number(appliedPromo.min_transaction)) {
        isValid = false;
      }
      else {
        const userUsageCount = (transactions || []).filter(t => t.promoCode === appliedPromo.code && t.status !== 'Dibatalkan').length;
        const maxUsagePerUser = appliedPromo.max_usage_per_user ?? 1;

        const isNewCustomerPromo = appliedPromo.code.includes('FIRST') || 
                                   (appliedPromo.description && (
                                     appliedPromo.description.toLowerCase().includes('baru') || 
                                     appliedPromo.description.toLowerCase().includes('pertama')
                                   ));
        const hasPastOrders = (transactions || []).some(t => t.status !== 'Dibatalkan');
        
        if (userUsageCount >= maxUsagePerUser) {
          isValid = false;
        }
        else if (isNewCustomerPromo && hasPastOrders) {
          isValid = false;
        }
        else if (appliedPromo.max_usage && appliedPromo.used_count >= appliedPromo.max_usage) {
          isValid = false;
        }
        else if (appliedPromo.code === 'FIRST30' && !selectedPkg.name.toLowerCase().includes('detail')) {
          isValid = false;
        }
      }

      if (isValid) {
        if (appliedPromo.type === 'percentage') {
          discountVal = Math.round(baseServicePrice * Number(appliedPromo.value) / 100);
          if (appliedPromo.max_discount && discountVal > Number(appliedPromo.max_discount)) {
            discountVal = Number(appliedPromo.max_discount);
          }
        } else {
          discountVal = Number(appliedPromo.value);
        }
        discountVal = Math.min(discountVal, baseServicePrice);
      }
    }
  }

  const waxPrice = 5000; // Platform fee
  const totalBill = baseServicePrice - discountVal + waxPrice;

  // Countdown timer logic
  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const normalizePhone = (phone: string) => {
    let clean = phone.replace(/[^0-9+]/g, '');
    if (clean.startsWith('+62')) {
      clean = '0' + clean.slice(3);
    } else if (clean.startsWith('62')) {
      clean = '0' + clean.slice(2);
    } else if (!clean.startsWith('0') && clean.length > 0) {
      clean = '0' + clean;
    }
    return clean;
  };

  // Step 1: Check User, Check Balance, Generate QR
  const handleProceedToQR = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneInput.trim()) {
      setErrorMsg('Masukkan nomor telepon OnoPay Anda.');
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    try {
      const cleanPhone = normalizePhone(phoneInput);
      // 1. Check if user exists on OnoPay
      let checkUserRes = await fetch('https://onopay.web.id/api/v1/merchant/check-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ phone_number: cleanPhone })
      });

      let checkUserData = await checkUserRes.json();

      // Auto-register if user is not found (status 404 or message is 'User tidak ditemukan')
      if (
        !checkUserRes.ok && 
        (checkUserRes.status === 404 || (checkUserData && checkUserData.message === 'User tidak ditemukan'))
      ) {
        try {
          // Call our backend to register this phone number on OnoPay
          const regRes = await api.post('/profile/register-onopay', { phone: cleanPhone });
          if (regRes.data.success) {
            // Re-check user after successful auto-registration
            checkUserRes = await fetch('https://onopay.web.id/api/v1/merchant/check-user', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
              body: JSON.stringify({ phone_number: cleanPhone })
            });
            checkUserData = await checkUserRes.json();
          } else {
            throw new Error(regRes.data.message || 'Gagal mendaftarkan akun ke OnoPay.');
          }
        } catch (regErr: any) {
          throw new Error(regErr?.response?.data?.message || regErr.message || 'Gagal melakukan registrasi OnoPay otomatis.');
        }
      }

      if (!checkUserRes.ok || !checkUserData.success) {
        throw new Error(checkUserData.message || 'Nomor telepon tidak terdaftar di OnoPay. Silakan daftar di https://onopay.web.id/user/register');
      }

      // 2. Check balance
      const checkBalRes = await fetch('https://onopay.web.id/api/v1/merchant/check-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ phone_number: cleanPhone })
      });

      const checkBalData = await checkBalRes.json();
      if (!checkBalRes.ok || !checkBalData.success) {
        throw new Error(checkBalData.message || 'Gagal memeriksa saldo OnoPay.');
      }

      const balance = Number(checkBalData.data.balance);
      setOnoUser({
        name: checkUserData.data.name,
        email: checkUserData.data.email,
        balance: balance
      });

      if (balance < totalBill) {
        throw new Error(`Saldo OnoPay Anda tidak cukup untuk membayar tagihan ini. Sisa Saldo: Rp ${balance.toLocaleString('id-ID')}. Silakan lakukan Top Up di https://onopay.web.id/`);
      }

      // 3. Generate QR Code
      const genQrRes = await fetch('https://onopay.web.id/api/v1/payment/qr/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          phone_number: '081122334455', // Fixed Merchant Phone Number
          amount: totalBill,
          merchant_code: 'CLEAN_VEHICLE',
          description: `Pembayaran Clean Vehicle - ${selectedPkg.name}`,
          qr_mode: 'single_use'
        })
      });

      const genQrData = await genQrRes.json();
      if (!genQrRes.ok || !genQrData.success) {
        throw new Error(genQrData.message || 'Gagal generate QR Code dari OnoPay.');
      }

      setQrData(genQrData.data);
      setStep('qr');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Terjadi kesalahan koneksi ke server OnoPay.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Pay QR Code Transaction
  const handlePayViaOnoPay = async () => {
    if (!qrData) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      const payRes = await fetch('https://onopay.web.id/api/v1/payment/qr/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({
          qr_code: qrData.qr_code,
          payer_phone: phoneInput.trim()
        })
      });

      const payData = await payRes.json();
      if (!payRes.ok || !payData.success) {
        throw new Error(payData.message || 'Pembayaran gagal. Silakan coba kembali.');
      }

      // Payment success! Proceed to parent success screen
      onPaymentSuccess(totalBill, `OnoPay Gateway (No. ${phoneInput})`);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Proses pembayaran gagal.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#faf9fb] min-h-screen text-[#1b1c1e] font-sans pb-32">
      {/* Top Navbar */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-[#efedf0] shadow-sm">
        <div className="flex justify-between items-center w-full px-5 py-3 max-w-screen-xl mx-auto">
          <div className="flex items-center gap-3">
            <button 
              onClick={onBack}
              disabled={loading}
              className="flex items-center justify-center p-2 rounded-xl bg-slate-100 text-[#000f22] cursor-pointer hover:bg-slate-200 disabled:opacity-50"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <h1 className="font-extrabold text-lg tracking-tight text-[#0a2540]">OnoPay Gateway</h1>
          </div>

        </div>
      </header>

      <main className="max-w-md mx-auto px-5 pt-6 space-y-6">
        
        {/* Total Bill Countdown */}
        <section className="text-center space-y-1">
          <p className="text-[10px] font-bold text-[#43474d] uppercase tracking-wider">TOTAL TAGIHAN</p>
          <div className="flex flex-col items-center">
            <h2 className="text-3xl font-black text-[#0a2540] tracking-tight">
              Rp {totalBill.toLocaleString('id-ID')}
            </h2>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#efedf0] rounded-full mt-2 border border-[#e3e2e5]">
              <span className="material-symbols-outlined text-[14px] text-[#785900]">schedule</span>
              <span className="text-[10px] font-bold text-[#785900]">Pay within {formatTime(seconds)}</span>
            </div>
          </div>
        </section>

        {/* Invoice details block card */}
        <section className="space-y-2">
          <h3 className="text-sm font-bold text-[#0a2540]">Detail Pesanan</h3>
          <div className="bg-white rounded-xl p-4 border border-[#efedf0] shadow-sm">
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-bold text-[#43474d] uppercase tracking-wider">Layanan</p>
                  <p className="text-sm font-bold text-[#0a2540]">{selectedPkg.name}</p>
                  <p className="text-xs text-[#43474d]">{booking.vehicleType === 'motor' ? 'Sepeda Motor' : 'Mobil Roda 4'}</p>
                </div>
                <div className="bg-[#fdc003]/10 p-2 rounded-lg text-[#785900]">
                  <span className="material-symbols-outlined shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {booking.vehicleType === 'motor' ? 'motorcycle' : 'directions_car'}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-[#efedf0] space-y-2 text-xs">
                <div className="flex justify-between items-center text-[#43474d]">
                  <span>Cuci & Kebersihan Utama</span>
                  <span className="font-semibold text-[#0a2540]">Rp {baseServicePrice.toLocaleString('id-ID')}</span>
                </div>
                {discountVal > 0 && (
                  <div className="flex justify-between items-center text-emerald-650 font-bold">
                    <span>Diskon Promo ({booking.appliedPromoCode})</span>
                    <span>-Rp {discountVal.toLocaleString('id-ID')}</span>
                  </div>
                )}
                <div className="flex justify-between items-center text-[#43474d]">
                  <span>Biaya Administrasi & Layanan</span>
                  <span className="font-semibold text-[#0a2540]">Rp {waxPrice.toLocaleString('id-ID')}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-dashed border-[#c4c6ce] flex justify-between items-center text-sm font-bold">
                <span className="text-[#0a2540]">Total Pembayaran</span>
                <span className="text-[#785900]">Rp {totalBill.toLocaleString('id-ID')}</span>
              </div>
            </div>
          </div>
        </section>

        {/* OnoPay Form or QR Step */}
        {step === 'input' ? (
          <motion.section 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-[#0a2540]">OnoPay Payment Gateway</h3>
              <span className="text-[9px] font-bold text-white bg-[#0066cc] px-2 py-0.5 rounded tracking-widest uppercase shadow">
                OnoPay API
              </span>
            </div>

            <form onSubmit={handleProceedToQR} className="bg-white rounded-xl p-5 border border-[#efedf0] shadow-sm space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-10 w-10 rounded-xl bg-[#e6f2ff] flex items-center justify-center text-[#0066cc]">
                  <span className="material-symbols-outlined">account_balance_wallet</span>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#0a2540]">Bayar Menggunakan Saldo OnoPay</h4>
                  <p className="text-[10px] text-[#74777e]">Autentikasi instan menggunakan nomor telepon Anda</p>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-extrabold text-[#74777e] uppercase tracking-wider">
                  Nomor Telepon OnoPay Anda
                </label>
                <input 
                  type="text" 
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="Contoh: 081234000001"
                  className="bg-[#f5f3f6] border border-[#e3e2e5] rounded-xl px-3.5 py-3 text-sm font-semibold focus:ring-2 focus:ring-[#0066cc] focus:border-transparent outline-none w-full"
                  disabled={loading}
                  required
                />
              </div>

              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-medium leading-relaxed">
                  <span className="font-bold">Error:</span> {errorMsg}
                </div>
              )}

              <button 
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-[#0066cc] hover:bg-[#003d7a] text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-md active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                    <span>Memproses...</span>
                  </>
                ) : (
                  <>
                    <span>Konfirmasi & Dapatkan QR</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </>
                )}
              </button>
            </form>
          </motion.section>
        ) : (
          <motion.section 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-[#0a2540]">Scan & Konfirmasi Pembayaran</h3>
              <button 
                onClick={() => setStep('input')}
                disabled={loading}
                className="text-xs text-[#0066cc] font-bold hover:underline"
              >
                Ubah Akun
              </button>
            </div>

            <div className="bg-white rounded-xl p-5 border border-[#efedf0] shadow-sm space-y-5 text-center">
              
              {/* OnoPay User Profile Badge */}
              {onoUser && (
                <div className="bg-[#e6f2ff] rounded-xl p-3 flex items-center justify-between text-left border border-[#b3d7ff]">
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[#0066cc]">person</span>
                    <div>
                      <p className="text-xs font-bold text-[#0a2540]">{onoUser.name}</p>
                      <p className="text-[10px] text-[#74777e]">{onoUser.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[8px] font-bold text-[#74777e] uppercase tracking-wider">SALDO ONOPAY</p>
                    <p className="text-xs font-extrabold text-[#0066cc]">Rp {onoUser.balance.toLocaleString('id-ID')}</p>
                  </div>
                </div>
              )}

              {/* QR Image */}
              {qrData && (
                <div className="flex flex-col items-center space-y-2">
                  <div className="p-3 bg-white border border-[#dee2e6] rounded-2xl shadow-inner inline-block">
                    <img 
                      src={qrData.qr_image} 
                      alt="OnoPay QR Code" 
                      className="w-48 h-48 object-contain"
                    />
                  </div>
                  <p className="text-[10px] text-[#74777e] font-semibold uppercase tracking-wider">
                    QR CODE: {qrData.qr_code}
                  </p>
                </div>
              )}

              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs font-medium text-left leading-relaxed">
                  <span className="font-bold">Error:</span> {errorMsg}
                </div>
              )}

              <div className="space-y-2 pt-2">
                <button 
                  onClick={handlePayViaOnoPay}
                  disabled={loading}
                  className="w-full py-4 bg-[#28a745] hover:bg-[#218838] text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-lg active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                      <span>Sedang Memproses Transaksi...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">check_circle</span>
                      <span>Bayar Sekarang (Simulasi Scan)</span>
                    </>
                  )}
                </button>
                <p className="text-[9px] text-[#74777e] leading-relaxed px-4">
                  Dengan mengklik bayar sekarang, Anda menyetujui pemotongan saldo OnoPay secara langsung & real-time.
                </p>
              </div>

            </div>
          </motion.section>
        )}

      </main>
    </div>
  );
}
