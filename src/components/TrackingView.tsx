import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Transaction } from '../types';

interface TrackingViewProps {
  onBackToHome: () => void;
  userAvatar?: string;
  trackedTransaction?: Transaction;
  onCancelActiveOrder?: (id?: string) => void;
}

export default function TrackingView({ onBackToHome, userAvatar, trackedTransaction, onCancelActiveOrder }: TrackingViewProps) {
  const [showCallAlert, setShowCallAlert] = useState(false);
  const [showChatBox, setShowChatBox] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [showCancelSuccessToast, setShowCancelSuccessToast] = useState(false);
  const [chatMessage, setChatMessage] = useState('');

  const isOutlet = trackedTransaction?.serviceType === 'outlet' || 
                   trackedTransaction?.serviceName?.toLowerCase().includes('outlet');

  const getOutletName = (address?: string) => {
    if (!address) return 'Outlet Clean Vehicle';
    const addr = address.toLowerCase();
    if (addr.includes('sudirman')) return 'Outlet Pusat — Jakarta Selatan';
    if (addr.includes('ahmad yani')) return 'Outlet Bekasi Barat';
    if (addr.includes('merdeka')) return 'Outlet Tangerang City';
    if (addr.includes('sawangan')) return 'Outlet Depok Sawangan';
    if (addr.includes('pajajaran')) return 'Outlet Bogor Tengah';
    if (addr.includes('raya bogor')) return 'Outlet Jakarta Timur';
    return 'Outlet Clean Vehicle';
  };

  const getOutletPhone = (name: string) => {
    if (name.includes('Pusat')) return '021-1234-5678';
    if (name.includes('Bekasi')) return '021-8765-4321';
    if (name.includes('Tangerang')) return '021-5555-7890';
    if (name.includes('Depok')) return '021-7777-1234';
    if (name.includes('Bogor')) return '0251-333-444';
    if (name.includes('Timur')) return '021-9876-5432';
    return '021-1234-5678';
  };

  const techName = trackedTransaction?.technician?.name || 'Ahmad Subarkah';
  const techShortName = techName.split(' ')[0];

  const [chatHistory, setChatHistory] = useState<string[]>([]);

  React.useEffect(() => {
    if (isOutlet) {
      setChatHistory([
        `Halo! Layanan Anda dijadwalkan di ${getOutletName(trackedTransaction?.serviceAddress)}.`,
        'Jika ada kendala arah rute, silakan hubungi tim CS kami.'
      ]);
    } else {
      setChatHistory([
        `Halo! Saya ${techShortName}, teknisi Clean Vehicle Anda. Saya sedang menuju ke lokasi Anda.`,
        'Estimasi waktu kedatangan sekitar 15 menit lagi.'
      ]);
    }
  }, [techShortName, isOutlet, trackedTransaction]);

  const txStatus = trackedTransaction ? trackedTransaction.status : 'Dipesan';
  const isCancelled = txStatus === 'Dibatalkan' || showCancelSuccessToast;

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim()) return;
    setChatHistory([...chatHistory, chatMessage]);
    setChatMessage('');
    
    // Auto reply
    setTimeout(() => {
      setChatHistory(prev => [...prev, 'Baik kak, mohon tunggu sebentar ya. Saya segera sampai.']);
    }, 1500);
  };

  return (
    <div className="bg-[#faf9fb] min-h-screen flex flex-col justify-between overflow-x-hidden relative">
      
      {/* Top Navbar */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-[#efedf0] shadow-sm transition-all duration-200">
        <div className="flex justify-between items-center w-full px-5 py-3 max-w-screen-xl mx-auto">
          <div className="flex items-center gap-3">
            <button 
              onClick={onBackToHome}
              className="flex items-center justify-center p-2 rounded-xl bg-slate-100 text-[#000f22] cursor-pointer hover:bg-slate-200"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <span className="material-symbols-outlined text-[#785900]">location_on</span>
            <h1 className="font-bold text-lg tracking-tight text-[#0a2540]">Clean Vehicle</h1>
          </div>
          <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-200">
            <img 
              alt="User profile" 
              src={userAvatar || "https://lh3.googleusercontent.com/aida-public/AB6AXuD90iPn_p56sjSnZ0vwHyoBd07vLcuHPcArqDh3m0ku8XqdOGUw9z_TbF0kT98dV1a53CTJkoeIOLRvq7aGrNfLNNFB-zx15LDNCyiCYN_0Id64yu7zV3LnE0DNHCcnbGzTmpBXjNyLLOfVftyfkZh3rJmcIU-SzCnCriVti9GeG2LKndKXQ49v6J9VZP9MevH_EuxpjkmxOgfXDYAYFZHWmQ--x3CTM_hrjQwmK53ZULDCtkRwPH1sU4e9eGMSaXQYmKPJkzj9q_17"}
            />
          </div>
        </div>
      </header>

      {/* Main Map Background Area */}
      <main className="flex-grow relative flex flex-col justify-between">
        
        {/* Full screen Map Simulation */}
        <div className="absolute inset-0 z-0">
          <div 
            className="w-full h-full grayscale-[0.1] brightness-[1.01]" 
            style={{ 
              backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuD90iPn_p56sjSnZ0vwHyoBd07vLcuHPcArqDh3m0ku8XqdOGUw9z_TbF0kT98dV1a53CTJkoeIOLRvq7aGrNfLNNFB-zx15LDNCyiCYN_0Id64yu7zV3LnE0DNHCcnbGzTmpBXjNyLLOfVftyfkZh3rJmcIU-SzCnCriVti9GeG2LKndKXQ49v6J9VZP9MevH_EuxpjkmxOgfXDYAYFZHWmQ--x3CTM_hrjQwmK53ZULDCtkRwPH1sU4e9eGMSaXQYmKPJkzj9q_17')",
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          />
          
          {/* Active moving vehicle or route overlay */}
          {isOutlet ? (
            <>
              {/* Start Pin - Lokasi Anda */}
              <div className="absolute top-[60%] left-[25%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                <div className="bg-[#0a2540] text-white p-2.5 rounded-full shadow-lg mb-1 ring-4 ring-white/40">
                  <span className="material-symbols-outlined block text-[18px]">person_pin_circle</span>
                </div>
                <div className="bg-white px-2 py-0.5 rounded-full shadow-sm border border-slate-200">
                  <p className="text-[8px] font-bold text-slate-600 tracking-wider">Lokasi Anda</p>
                </div>
              </div>

              {/* Route representation (dashed SVG line with animate motion) */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path
                  id="route-path"
                  d="M 25 60 Q 45 45 70 35"
                  fill="none"
                  stroke="#0a2540"
                  strokeWidth="0.8"
                  strokeDasharray="2 1.5"
                  className="opacity-70"
                />
                <circle r="2.5" fill="#fdc003" className="shadow-lg">
                  <animateMotion
                    dur="5s"
                    repeatCount="indefinite"
                    path="M 25 60 Q 45 45 70 35"
                  />
                </circle>
              </svg>

              {/* Destination Pin - Outlet */}
              <div className="absolute top-[35%] left-[70%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                <div className="bg-[#fdc003] text-[#0a2540] p-3 rounded-full shadow-2xl mb-1 ring-4 ring-white/50 animate-pulse">
                  <span className="material-symbols-outlined block text-[22px]">storefront</span>
                </div>
                <div className="bg-white px-3 py-1 rounded-full shadow-md border border-[#fdc003]">
                  <p className="text-[10px] font-extrabold text-[#0a2540] tracking-wider uppercase">
                    {getOutletName(trackedTransaction?.serviceAddress)}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
              <div className="bg-[#0a2540] text-white p-3 rounded-full shadow-2xl mb-1 ring-4 ring-white/50 animate-bounce">
                <span className="material-symbols-outlined block text-[24px]">electric_car</span>
              </div>
              <div className="bg-white px-3 py-1 rounded-full shadow-md border border-[#c4c6ce]">
                <p className="text-[10px] font-bold text-[#0a2540] tracking-wider uppercase">{techShortName} (2 menit lagi)</p>
              </div>
            </div>
          )}
        </div>

        {/* Floating overlays controls */}
        <div className="absolute top-4 right-5 flex flex-col gap-3 z-10">
          <button className="w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center text-[#0a2540] active:scale-95 transition-transform border border-slate-150 cursor-pointer">
            <span className="material-symbols-outlined">my_location</span>
          </button>
          <button className="w-12 h-12 bg-white rounded-xl shadow-lg flex items-center justify-center text-[#0a2540] active:scale-95 transition-transform border border-slate-150 cursor-pointer">
            <span className="material-symbols-outlined">layers</span>
          </button>
        </div>

        {/* Modal: Interactive Live Call Alert */}
        {showCallAlert && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-5">
            <div className="bg-white rounded-3xl p-6 text-center max-w-xs w-full shadow-2xl border border-slate-100 animate-scale-in">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <span className="material-symbols-outlined text-green-500 text-3xl">call</span>
              </div>
              <h4 className="font-extrabold text-base text-[#000f22] mb-1">Hubungi {techShortName}</h4>
              <p className="text-xs text-[#74777e] mb-5">Menyambungkan panggilan suara via WhatsApp...</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowCallAlert(false)}
                  className="flex-1 py-3 bg-red-550 bg-red-100 text-red-600 rounded-xl font-bold text-xs cursor-pointer hover:bg-red-200 transition-colors"
                >
                  Tutup
                </button>
                <a 
                  href="tel:+628123456789"
                  className="flex-grow py-3 bg-green-500 text-white rounded-xl font-bold text-xs cursor-pointer text-center block"
                >
                  Panggil Biasa
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Live Chat messaging dialog system */}
        {showChatBox && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-50">
            <div className="bg-white rounded-t-[2rem] w-full max-w-md shadow-2xl flex flex-col h-[70vh] border-t border-[#efedf0] animate-fade-up">
              {/* Chat Title bar */}
              <div className="p-4 border-b border-[#efedf0] flex justify-between items-center bg-[#f5f3f6] rounded-t-[2rem]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-ping"></span>
                  <p className="font-bold text-sm text-[#0a2540]">Chat dengan {techName}</p>
                </div>
                <button 
                  onClick={() => setShowChatBox(false)}
                  className="w-8 h-8 rounded-full bg-white flex items-center justify-center border font-bold text-[#000f22]"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>

              {/* Message history */}
              <div className="flex-grow p-4 overflow-y-auto space-y-3 bg-[#faf9fb]">
                {chatHistory.map((item, index) => {
                  const isUser = index % 2 === 0 && index !== 0 && index !== 1 && index !== 3; // Mocking alternate chat bubbles
                  return (
                    <div key={index} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                      <div className={`p-3 max-w-[80%] rounded-2xl text-xs leading-normal font-medium ${
                        isUser 
                          ? 'bg-[#0a2540] text-white rounded-tr-none' 
                          : 'bg-[#efedf0] text-[#1b1c1e] rounded-tl-none border shadow-sm'
                      }`}>
                        {item}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Send box */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-[#efedf0] flex gap-2">
                <input 
                  type="text" 
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Ketik pesan..."
                  className="w-full bg-[#f5f3f6] border border-[#c4c6ce] rounded-xl px-4 py-2 text-xs font-semibold focus:ring-1 focus:ring-[#fdc003] outline-none"
                />
                <button 
                  type="submit"
                  className="px-4 py-2 bg-[#fdc003] text-[#6c5000] rounded-xl font-bold text-xs"
                >
                  Kirim
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Status card block on bottom */}
        <div className="mt-auto relative z-20 px-5 pb-[100px] w-full max-w-md mx-auto">
          <div className="bg-white rounded-[2rem] shadow-2lg p-5 flex flex-col gap-4 border border-[#efedf0]">
            
            {isCancelled ? (
              <>
                {/* Cancelled Progress Stepper */}
                <div className="flex items-center justify-between px-2">
                  <div className="flex flex-col items-center gap-1.5 relative">
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 shadow-sm z-10 font-bold">
                      <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                    </div>
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400">Dipesan</span>
                    <div className="absolute top-4 left-8 w-[120px] h-[2px] bg-red-200"></div>
                  </div>
                  <div className="flex flex-col items-center gap-1.5 relative">
                    <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white shadow-md z-10 ring-4 ring-red-100">
                      <span className="material-symbols-outlined text-sm">close</span>
                    </div>
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-red-600">Batal / Refunded</span>
                  </div>
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-350 z-10">
                      <span className="material-symbols-outlined text-sm">verified</span>
                    </div>
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-300">Selesai</span>
                  </div>
                </div>

                {/* Cancelled Status Text */}
                <div className="space-y-1 bg-red-50/50 p-4 rounded-2xl border border-red-100">
                  <div className="flex items-center gap-1.5 text-red-600">
                    <span className="material-symbols-outlined text-lg font-bold">cancel</span>
                    <h2 className="text-sm font-black uppercase tracking-wider">Layanan Telah Dibatalkan</h2>
                  </div>
                  <p className="text-[11px] text-[#43474d] font-semibold leading-relaxed">
                    Pesanan cuci kendaraan ini telah dibatalkan. Pengembalian dana 100% sebesar <strong>Rp {(trackedTransaction?.price || 120000).toLocaleString('id-ID')}</strong> telah berhasil didepositkan kembali ke Saldo Dompet Garasi Anda.
                  </p>
                </div>

                {/* Simplified cancelled technician / outlet block */}
                {isOutlet ? (
                  <div className="bg-slate-50 p-3 rounded-2xl border border-[#efedf0] opacity-50 flex items-center gap-3">
                    <span className="material-symbols-outlined text-[#74777e] text-2xl p-2 bg-slate-100 rounded-xl">storefront</span>
                    <div>
                      <p className="font-bold text-xs text-slate-500">Kunjungan Outlet Dibatalkan</p>
                      <p className="text-[10px] text-slate-400 font-semibold">Jadwal kedatangan telah dibatalkan.</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 p-3 rounded-2xl border border-[#efedf0] opacity-50 flex items-center gap-3">
                    <span className="material-symbols-outlined text-[#74777e] text-2xl p-2 bg-slate-100 rounded-xl">person_off</span>
                    <div>
                      <p className="font-bold text-xs text-slate-500">Sinyal Teknisi Terputus</p>
                      <p className="text-[10px] text-slate-400 font-semibold">Tugas dibatalkan dari sistem.</p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Progress Stepper indicators */}
                <div className="flex items-center justify-between px-2">
                  <div className="flex flex-col items-center gap-1.5 relative">
                    <div className="w-8 h-8 rounded-full bg-[#fdc003] flex items-center justify-center text-[#0a2540] shadow-sm z-10 font-bold">
                      <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                    </div>
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-[#0a2540]">Dipesan</span>
                    <div className="absolute top-4 left-8 w-16 h-[2px] bg-[#fdc003]"></div>
                  </div>
                  
                  <div className="flex flex-col items-center gap-1.5 relative">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 font-bold ${
                      txStatus === 'Selesai' 
                        ? 'bg-[#fdc003] text-[#0a2540] shadow-sm' 
                        : 'bg-[#0a2540] text-white shadow-md ring-4 ring-[#ffdf9e]'
                    }`}>
                      <span className={`material-symbols-outlined text-sm ${txStatus !== 'Selesai' ? 'animate-spin' : ''}`}>
                        {txStatus === 'Selesai' ? 'check' : 'sync'}
                      </span>
                    </div>
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-[#0a2540]">Diproses</span>
                    <div className={`absolute top-4 left-8 w-16 h-[2px] ${txStatus === 'Selesai' ? 'bg-[#fdc003]' : 'bg-[#efedf0]'}`}></div>
                  </div>
                  
                  <div className="flex flex-col items-center gap-1.5">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 font-bold ${
                      txStatus === 'Selesai' 
                        ? 'bg-[#fdc003] text-[#0a2540] shadow-sm ring-4 ring-[#ffdf9e]' 
                        : 'bg-[#efedf0] text-slate-400'
                    }`}>
                      <span className="material-symbols-outlined text-sm">verified</span>
                    </div>
                    <span className={`text-[9px] uppercase tracking-wider font-extrabold ${txStatus === 'Selesai' ? 'text-[#0a2540]' : 'text-[#74777e]'}`}>Selesai</span>
                  </div>
                </div>

                {/* Order Meta Details */}
                <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-100 text-[11px] text-[#43474d] space-y-1 font-semibold">
                  <div className="flex justify-between">
                    <span className="text-[#74777e]">Tipe Order:</span>
                    <span className="font-extrabold text-[#0a2540]">
                      {trackedTransaction?.serviceName.includes('Rumah') ? 'Home Concierge Service' : 'Cuci di Outlet'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#74777e]">Nama &amp; Plat:</span>
                    <span className="font-extrabold text-[#0a2540] truncate max-w-[180px]">
                      {trackedTransaction?.vehicleName || 'Tesla Model S (ABC-1234)'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#74777e]">Paket Layanan:</span>
                    <span className="font-extrabold text-[#785900]">
                      {trackedTransaction?.packageName || 'Premium Wash & Wax Roda 4'}
                    </span>
                  </div>
                </div>

                {/* Tracking Status Text */}
                <div className="space-y-0.5">
                  <h2 className={`text-lg font-black ${txStatus === 'Selesai' ? 'text-emerald-600' : 'text-[#0a2540]'}`}>
                    {txStatus === 'Selesai' 
                      ? 'Pencucian Selesai & Berhasil!' 
                      : isOutlet 
                        ? 'Menuju Outlet Pilihan Anda' 
                        : 'Teknisi Sedang Menuju Lokasi Anda'}
                  </h2>
                  <p className="text-xs text-[#43474d] font-semibold">
                    {txStatus === 'Selesai' 
                      ? 'Kendaraan Anda kini bersih cemerlang!' 
                      : isOutlet 
                        ? 'Silakan ikuti rute navigasi untuk menuju ke outlet.' 
                        : 'Estimasi kedatangan pukul 14:25 WIB'}
                  </p>
                </div>

                {/* Technician contact / Outlet route widget */}
                {isOutlet ? (
                  <div className="bg-[#f5f3f6] p-3 rounded-2xl flex items-center justify-between border border-[#e3e2e5]">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-xl bg-[#0a2540] text-white flex items-center justify-center">
                          <span className="material-symbols-outlined text-2xl">storefront</span>
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
                      </div>
                      <div className="max-w-[170px]">
                        <p className="font-bold text-xs text-[#0a2540] truncate">{getOutletName(trackedTransaction?.serviceAddress)}</p>
                        <p className="text-[10px] text-slate-500 font-semibold truncate">{trackedTransaction?.serviceAddress || 'Jl. Sudirman No.45, Jakarta'}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(trackedTransaction?.serviceAddress || 'Clean Vehicle Outlet')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-10 px-3 rounded-xl bg-[#fdc003] text-[#6c5000] flex items-center justify-center gap-1 hover:bg-[#e6ae02] active:scale-95 transition-all shadow-md cursor-pointer text-xs font-bold"
                      >
                        <span className="material-symbols-outlined text-[16px]">navigation</span>
                        <span>Rute</span>
                      </a>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#f5f3f6] p-3 rounded-2xl flex items-center justify-between border border-[#e3e2e5]">
                    <div className="flex items-center gap-3">
                       <div className="relative">
                        <img 
                          alt={techName} 
                          className="w-12 h-12 rounded-xl object-cover"
                          src={trackedTransaction?.technician?.avatar || "https://lh3.googleusercontent.com/aida-public/AB6AXuCwTjaN2xNe6AlYOswQcauMMPGMWtRiQmyFQIUqW314q7MjjzABXeJ6pXVDzPULuzn7HLaM05YZlQIhk5JCuaWTL_N-L8_7gn4JnYIQ_ZxCd9F8boXESKnxdGZ_uE-UFI_tQLKt7n4n4vpdm_vNR7fCLDtpxvtDUzDi1OWqRwioz0DUe2-koHqCm60iieJpXnR3ZJ0Bt2pyzcpuLoPkNF_82UsR7SXhmfcuVhYW1S0AHeIt8jgMB-W3HLS5_W5q-oaX4WN6T-GXf1M_"}
                        />
                        <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
                      </div>
                      <div>
                        <p className="font-bold text-xs text-[#0a2540]">{techName}</p>
                        <div className="flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-[#fdc003] text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                          <span className="text-[10px] font-bold text-[#43474d]">
                            {trackedTransaction?.technician?.rating || '4.9'} • {trackedTransaction?.technician?.area || 'Super Specialist'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setShowCallAlert(true)}
                        className="w-10 h-10 rounded-full bg-white border border-[#c4c6ce] flex items-center justify-center text-[#0a2540] active:bg-slate-100 transition-colors shadow-sm cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">call</span>
                      </button>
                      <button 
                        onClick={() => setShowChatBox(true)}
                        className="w-10 h-10 rounded-full bg-[#fdc003] flex items-center justify-center text-[#6c5000] active:scale-95 transition-transform shadow-md cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-[18px]">chat</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Vehicle tracking progress bar */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-bold text-[#0a2540] uppercase tracking-wider">Status Pencucian</span>
                    <span className="text-xs font-bold text-[#0a2540]">
                      {txStatus === 'Selesai' ? 'Selesai' : 'On Track'}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-[#efedf0] rounded-full overflow-hidden">
                    <div className="h-full bg-[#0a2540] rounded-full relative transition-all duration-500" style={{ width: txStatus === 'Selesai' ? '100%' : '65%' }}>
                      <div className="absolute right-0 top-0 h-full w-2 bg-[#fdc003]"></div>
                    </div>
                  </div>
                </div>

                {/* Batalkan Pesanan Button */}
                {txStatus !== 'Selesai' && (
                  <button
                    type="button"
                    onClick={() => setShowCancelModal(true)}
                    className="w-full mt-1.5 py-3 border border-red-200 hover:bg-neutral-50 text-red-600 rounded-2xl font-bold text-[11px] cursor-pointer active:scale-95 transition-all text-center flex items-center justify-center gap-1.5 uppercase tracking-wider shadow-sm"
                  >
                    <span className="material-symbols-outlined text-[15px]">cancel</span>
                    Batalkan Pesanan Cuci
                  </button>
                )}
              </>
            )}

          </div>
        </div>

        {/* Modal: Confirmation to Cancel Order */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-5">
            <div className="bg-white rounded-3xl p-6 text-center max-w-xs w-full shadow-2xl border border-slate-100 animate-scale-in">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                <span className="material-symbols-outlined text-3xl">warning</span>
              </div>
              <h4 className="font-extrabold text-base text-[#000f22] mb-1">Batalkan Pesanan?</h4>
              <p className="text-xs text-[#74777e] mb-5 leading-normal font-medium">Apakah Anda yakin ingin mematalkan pesanan cuci ini? Seluruh biaya yang dibayarkan akan di-refund secara instan ke Dompet Garasi.</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 py-3 bg-[#f5f3f6] text-[#43474d] rounded-xl font-bold text-xs cursor-pointer hover:bg-slate-200"
                >
                  Kembali
                </button>
                <button 
                  onClick={() => {
                    setShowCancelModal(false);
                    if (onCancelActiveOrder) {
                      onCancelActiveOrder(trackedTransaction?.id);
                    }
                    setShowCancelSuccessToast(true);
                  }}
                  className="flex-grow py-3 bg-red-600 text-white rounded-xl font-bold text-xs cursor-pointer hover:bg-red-700 transition-colors"
                >
                  Ya, Batalkan
                </button>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* Persistent Stick Bottom home action layout navbar drawer */}
      <div className="fixed bottom-0 left-0 w-full bg-white/95 backdrop-blur-md border-t border-[#efedf0] p-4 pb-6 z-50 shadow-lg text-center">
        <button 
          onClick={onBackToHome}
          className="w-full bg-[#fdc003] hover:bg-[#fabd00] text-[#6c5000] font-extrabold py-4 rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all text-xs uppercase tracking-wider"
        >
          Kembali ke Beranda
        </button>
      </div>

    </div>
  );
}
