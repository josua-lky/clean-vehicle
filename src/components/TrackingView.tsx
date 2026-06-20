import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Transaction } from '../types';
import api from '../services/api';

interface TrackingViewProps {
  onBackToHome: () => void;
  userAvatar?: string;
  trackedTransaction?: Transaction;
  onCancelActiveOrder?: (id?: string, reason?: string) => void;
}

export default function TrackingView({ onBackToHome, userAvatar, trackedTransaction, onCancelActiveOrder }: TrackingViewProps) {
  const [showCallAlert, setShowCallAlert] = useState(false);
  const [showChatBox, setShowChatBox] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelSuccessToast, setShowCancelSuccessToast] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  
  // Real database booking details
  const [bookingInfo, setBookingInfo] = useState<any>(null);
  // Chat history state
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatLoaded, setChatLoaded] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const [lastReadTechMsgCount, setLastReadTechMsgCount] = useState(0);
  const [showMapModal, setShowMapModal] = useState(false);

  const isOutlet = (bookingInfo?.service_type || trackedTransaction?.serviceType) === 'outlet';

  const getOutletName = (address?: string) => {
    if (!address) return 'Outlet Clean Vehicle';
    const addr = address.toLowerCase();
    if (addr.includes('sudirman')) return 'Outlet Pusat — Jakarta Selatan';
    if (addr.includes('ahmad yani')) return 'Outlet Bekasi Barat';
    if (addr.includes('merdeka')) return 'Outlet Tangerang City';
    if (addr.includes('sawangan')) return 'Outlet Depok Sawangan';
    if (addr.includes('raya bogor')) return 'Outlet Jakarta Timur';
    return 'Outlet Clean Vehicle';
  };

  const getOutletPhone = (name: string) => {
    if (name.includes('Pusat')) return '021-1234-5678';
    if (name.includes('Bekasi')) return '021-8765-4321';
    if (name.includes('Tangerang')) return '021-5555-7890';
    if (name.includes('Depok')) return '021-7777-1234';
    if (name.includes('Timur')) return '021-9876-5432';
    return '021-1234-5678';
  };

  // Poll booking status and technician coordinates
  useEffect(() => {
    if (!trackedTransaction?.id) return;

    const fetchBookingDetails = async () => {
      try {
        const response = await api.get(`/bookings/${trackedTransaction.id}`);
        setBookingInfo(response.data);
      } catch (err) {
        console.log('Error polling booking status:', err);
      }
    };

    fetchBookingDetails();
    const interval = setInterval(fetchBookingDetails, 3000);
    return () => clearInterval(interval);
  }, [trackedTransaction]);

  // Poll chat messages constantly
  useEffect(() => {
    if (!trackedTransaction?.id) return;

    const fetchChat = async () => {
      try {
        const response = await api.get(`/bookings/${trackedTransaction.id}/chat`);
        setChatMessages(response.data || []);
        setChatLoaded(true);
      } catch (err) {
        console.log('Error fetching chat messages:', err);
      }
    };

    fetchChat();
    const interval = setInterval(fetchChat, 2000);
    return () => clearInterval(interval);
  }, [trackedTransaction]);

  // Clear unread badge when chat box is open
  useEffect(() => {
    if (showChatBox && chatMessages.length > 0) {
      const techMsgsCount = chatMessages.filter(m => m.sender_type === 'technician').length;
      setLastReadTechMsgCount(techMsgsCount);
    }
  }, [showChatBox, chatMessages]);

  const techMsgs = chatMessages.filter(m => m.sender_type === 'technician');
  const unreadCount = showChatBox ? 0 : Math.max(0, techMsgs.length - lastReadTechMsgCount);

  // Scroll chat to bottom
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatMessage.trim() || !trackedTransaction?.id) return;

    const msgText = chatMessage;
    setChatMessage('');

    try {
      await api.post(`/bookings/${trackedTransaction.id}/chat`, {
        sender_type: 'customer',
        message: msgText
      });
      // Fetch immediately
      const response = await api.get(`/bookings/${trackedTransaction.id}/chat`);
      setChatMessages(response.data || []);
    } catch (err) {
      console.log('Error sending message:', err);
    }
  };

  // Status mapping
  const mapStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Diproses';
      case 'confirmed': return 'Dikonfirmasi';
      case 'on_way': return 'Teknisi di Jalan';
      case 'in_progress': return 'Sedang Dicuci';
      case 'completed': return 'Selesai';
      case 'cancelled': return 'Dibatalkan';
      default: return 'Diproses';
    }
  };

  const txStatus = bookingInfo?.status || trackedTransaction?.status || 'pending';
  const displayStatus = mapStatusText(txStatus);
  const isCancelled = txStatus === 'cancelled' || showCancelSuccessToast;

  const techName = bookingInfo?.technician?.name || trackedTransaction?.technician?.name || 'Ahmad Subarkah';
  const techShortName = techName.split(' ')[0];
  const techPhone = bookingInfo?.technician?.phone || '08123456789';

  // Coordinate-to-Screen mapping calculations
  const techLat = Number(bookingInfo?.technician?.latitude);
  const techLng = Number(bookingInfo?.technician?.longitude);

  const getCoordinatesPct = () => {
    if (!techLat || !techLng) return { top: '50%', left: '50%' };
    
    // We assume center is -6.200000, 106.816666
    // Delta latitude from -6.195 to -6.205 (height bounds)
    const deltaLat = techLat - (-6.195000);
    const topPct = Math.min(Math.max(100 - (deltaLat / 0.01) * 100, 10), 90);

    // Delta longitude from 106.810 to 106.820 (width bounds)
    const deltaLng = techLng - 106.810000;
    const leftPct = Math.min(Math.max((deltaLng / 0.01) * 100, 10), 90);

    return { top: `${topPct}%`, left: `${leftPct}%` };
  };

  const techPinStyle = getCoordinatesPct();

  return (
    <div className="bg-[#faf9fb] dark:bg-[#0a0f1d] min-h-screen flex flex-col justify-between overflow-x-hidden relative text-[#1b1c1e] dark:text-[#f3f4f6]">
      
      {/* Top Navbar */}
      <header className="bg-white/80 dark:bg-[#111827]/80 backdrop-blur-md sticky top-0 z-50 border-b border-[#efedf0] dark:border-gray-800 shadow-sm transition-all duration-200">
        <div className="flex justify-between items-center w-full px-5 py-3 max-w-screen-xl mx-auto">
          <div className="flex items-center gap-3">
            <button 
              onClick={onBackToHome}
              className="flex items-center justify-center p-2 rounded-xl bg-slate-100 dark:bg-[#1a2333] text-[#000f22] dark:text-white cursor-pointer hover:bg-slate-200 dark:hover:bg-[#253046] border-none"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <span className="material-symbols-outlined text-[#785900] dark:text-[#fdc003]">location_on</span>
            <h1 className="font-bold text-lg tracking-tight text-[#0a2540] dark:text-white">Clean Vehicle</h1>
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
            className="w-full h-full grayscale-[0.1] brightness-[1.01] dark:brightness-[0.85] dark:contrast-[1.1] transition-all" 
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
                <div className="bg-[#0a2540] dark:bg-[#fdc003] text-white dark:text-[#0a2540] p-2.5 rounded-full shadow-lg mb-1 ring-4 ring-white/40">
                  <span className="material-symbols-outlined block text-[18px]">person_pin_circle</span>
                </div>
                <div className="bg-white dark:bg-[#1f2937] px-2 py-0.5 rounded-full shadow-sm border border-slate-200 dark:border-gray-800">
                  <p className="text-[8px] font-bold text-slate-600 dark:text-slate-300 tracking-wider">Lokasi Anda</p>
                </div>
              </div>

              {/* Route representation (dashed SVG line) */}
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
                <div className="bg-white dark:bg-[#1f2937] px-3 py-1 rounded-full shadow-md border border-[#fdc003]">
                  <p className="text-[10px] font-extrabold text-[#0a2540] dark:text-white tracking-wider uppercase">
                    {getOutletName(bookingInfo?.service_address || trackedTransaction?.serviceAddress)}
                  </p>
                </div>
              </div>
            </>
          ) : (
            // Dynamic Technician Live Pin
            <div 
              className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center transition-all duration-1000 ease-out"
              style={{ top: techPinStyle.top, left: techPinStyle.left }}
            >
              <div className="bg-[#0a2540] dark:bg-[#fdc003] text-white dark:text-[#0a2540] p-3 rounded-full shadow-2xl mb-1 ring-4 ring-white/50 animate-bounce">
                <span className="material-symbols-outlined block text-[24px]">electric_car</span>
              </div>
              <div className="bg-white dark:bg-[#1f2937] px-3 py-1 rounded-full shadow-md border border-[#c4c6ce] dark:border-gray-800">
                <p className="text-[10px] font-extrabold text-[#0a2540] dark:text-white tracking-wider uppercase">
                  {techShortName} {['on_way', 'in_progress'].includes(txStatus) ? '• Live' : ''}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Floating overlays controls */}
        <div className="absolute top-4 right-5 flex flex-col gap-3 z-10">
          <button className="w-12 h-12 bg-white dark:bg-[#111827] rounded-xl shadow-lg flex items-center justify-center text-[#0a2540] dark:text-white active:scale-95 transition-transform border border-slate-150 dark:border-gray-800 cursor-pointer">
            <span className="material-symbols-outlined">my_location</span>
          </button>
          <button className="w-12 h-12 bg-white dark:bg-[#111827] rounded-xl shadow-lg flex items-center justify-center text-[#0a2540] dark:text-white active:scale-95 transition-transform border border-slate-150 dark:border-gray-800 cursor-pointer">
            <span className="material-symbols-outlined">layers</span>
          </button>
        </div>

        {/* Modal: Interactive Live Call Alert */}
        {showCallAlert && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-5">
            <div className="bg-white dark:bg-[#111827] rounded-3xl p-6 text-center max-w-xs w-full shadow-2xl border border-slate-100 dark:border-gray-800 animate-scale-in">
              <div className="w-16 h-16 bg-green-50 dark:bg-green-950/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                <span className="material-symbols-outlined text-green-500 text-3xl">call</span>
              </div>
              <h4 className="font-extrabold text-base text-[#000f22] dark:text-white mb-1">Hubungi {techShortName}</h4>
              <p className="text-xs text-[#74777e] dark:text-slate-400 mb-5">Menghubungi nomor telepon {techPhone}...</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowCallAlert(false)}
                  className="flex-1 py-3 bg-red-100 dark:bg-red-950/30 text-red-650 text-red-600 dark:text-red-400 rounded-xl font-bold text-xs cursor-pointer hover:bg-red-200 transition-colors border-none"
                >
                  Tutup
                </button>
                <a 
                  href={`tel:${techPhone}`}
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
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-[100]">
            <div className="bg-white dark:bg-[#111827] rounded-t-[2rem] w-full max-w-md shadow-2xl flex flex-col h-[70vh] border-t border-[#efedf0] dark:border-gray-800 animate-fade-up">
              {/* Chat Title bar */}
              <div className="p-4 border-b border-[#efedf0] dark:border-gray-800 flex justify-between items-center bg-[#f5f3f6] dark:bg-[#1f2937] rounded-t-[2rem]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-ping"></span>
                  <p className="font-bold text-sm text-[#0a2540] dark:text-white">Chat dengan {techName}</p>
                </div>
                <button 
                  onClick={() => setShowChatBox(false)}
                  className="w-8 h-8 rounded-full bg-white dark:bg-gray-850 flex items-center justify-center border border-none font-bold text-[#000f22] dark:text-white cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>

              {/* Message history */}
              <div className="flex-grow p-4 overflow-y-auto space-y-3 bg-[#faf9fb] dark:bg-[#0a0f1d]">
                {!chatLoaded && chatMessages.length === 0 && (
                  <div className="text-center py-10 text-xs text-gray-400 font-semibold animate-pulse">Memuat pesan...</div>
                )}
                {chatLoaded && chatMessages.length === 0 && (
                  <div className="text-center py-10 text-xs text-slate-400 dark:text-slate-500 font-bold">Belum ada percakapan. Kirim pesan untuk memulai.</div>
                )}
                {chatMessages.map((item, index) => {
                  const isUser = item.sender_type === 'customer';
                  return (
                    <div key={index} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                      <div className={`p-3 max-w-[80%] rounded-2xl text-xs leading-normal font-medium shadow-sm ${
                        isUser 
                          ? 'bg-[#0a2540] text-white rounded-tr-none' 
                          : 'bg-[#efedf0] dark:bg-[#1f2d47] text-[#1b1c1e] dark:text-white rounded-tl-none border border-none'
                      }`}>
                        {item.message}
                      </div>
                    </div>
                  );
                })}
                <div ref={chatBottomRef} />
              </div>

              {/* Send box */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-[#efedf0] dark:border-gray-800 flex gap-2">
                <input 
                  type="text" 
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  placeholder="Ketik pesan..."
                  className="w-full bg-[#f5f3f6] dark:bg-[#151f32] border border-[#c4c6ce] dark:border-gray-800 rounded-xl px-4 py-2 text-xs font-semibold focus:ring-1 focus:ring-[#fdc003] outline-none text-[#1b1c1e] dark:text-white"
                />
                <button 
                  type="submit"
                  className="px-4 py-2 bg-[#fdc003] text-[#6c5000] rounded-xl font-bold text-xs border-none cursor-pointer"
                >
                  Kirim
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Status card block on bottom */}
        <div className="mt-auto relative z-20 px-5 pb-[100px] w-full max-w-md mx-auto">
          <div className="bg-white dark:bg-[#111827] rounded-[2rem] shadow-2lg p-5 flex flex-col gap-4 border border-[#efedf0] dark:border-gray-850">
            
            {isCancelled ? (
              <>
                {/* Cancelled Progress Stepper */}
                <div className="flex items-center justify-between px-2">
                  <div className="flex flex-col items-center gap-1.5 relative">
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500 shadow-sm z-10 font-bold">
                      <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check</span>
                    </div>
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400">Dipesan</span>
                    <div className="absolute top-4 left-8 w-[120px] h-[2px] bg-red-200 dark:bg-red-950"></div>
                  </div>
                  <div className="flex flex-col items-center gap-1.5 relative">
                    <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white shadow-md z-10 ring-4 ring-red-100 dark:ring-red-950">
                      <span className="material-symbols-outlined text-sm">close</span>
                    </div>
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-red-650 text-red-500">Batal / Refunded</span>
                  </div>
                  <div className="flex flex-col items-center gap-1.5">
                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-slate-350 z-10">
                      <span className="material-symbols-outlined text-sm">verified</span>
                    </div>
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-300">Selesai</span>
                  </div>
                </div>

                {/* Cancelled Status Text */}
                <div className="space-y-1 bg-red-50/50 dark:bg-red-950/20 p-4 rounded-2xl border border-red-100 dark:border-red-950/50">
                  <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
                    <span className="material-symbols-outlined text-lg font-bold">cancel</span>
                    <h2 className="text-sm font-black uppercase tracking-wider">Layanan Telah Dibatalkan</h2>
                  </div>
                  <p className="text-[11px] text-[#43474d] dark:text-slate-300 font-semibold leading-relaxed">
                    Pesanan cuci kendaraan ini telah dibatalkan. Pengembalian dana 100% sebesar <strong>Rp {(bookingInfo?.total_amount || trackedTransaction?.price || 120000).toLocaleString('id-ID')}</strong> telah berhasil dikembalikan ke dompet Garasi Anda.
                  </p>
                </div>

                {/* Simplified cancelled technician / outlet block */}
                {isOutlet ? (
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-2xl border border-[#efedf0] dark:border-gray-800 opacity-50 flex items-center gap-3">
                    <span className="material-symbols-outlined text-[#74777e] text-2xl p-2 bg-slate-100 dark:bg-slate-800 rounded-xl">storefront</span>
                    <div>
                      <p className="font-bold text-xs text-slate-500">Kunjungan Outlet Dibatalkan</p>
                      <p className="text-[10px] text-slate-450 font-semibold">Jadwal kedatangan telah dibatalkan.</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-2xl border border-[#efedf0] dark:border-gray-800 opacity-50 flex items-center gap-3">
                    <span className="material-symbols-outlined text-[#74777e] text-2xl p-2 bg-slate-100 dark:bg-slate-800 rounded-xl">person_off</span>
                    <div>
                      <p className="font-bold text-xs text-slate-500">Sinyal Teknisi Terputus</p>
                      <p className="text-[10px] text-slate-450 font-semibold">Tugas dibatalkan dari sistem.</p>
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
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-[#0a2540] dark:text-slate-300">Dipesan</span>
                    <div className="absolute top-4 left-8 w-16 h-[2px] bg-[#fdc003]"></div>
                  </div>
                  
                  <div className="flex flex-col items-center gap-1.5 relative">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 font-bold ${
                      txStatus === 'completed' 
                        ? 'bg-[#fdc003] text-[#0a2540] shadow-sm' 
                        : 'bg-[#0a2540] dark:bg-[#fdc003] text-white dark:text-[#0a2540] shadow-md ring-4 ring-[#ffdf9e] dark:ring-[#fdc003]/20'
                    }`}>
                      <span className={`material-symbols-outlined text-sm ${txStatus !== 'completed' ? 'animate-spin' : ''}`}>
                        {txStatus === 'completed' ? 'check' : 'sync'}
                      </span>
                    </div>
                    <span className="text-[9px] uppercase tracking-wider font-extrabold text-[#0a2540] dark:text-slate-350">{txStatus === 'completed' ? 'Selesai' : displayStatus}</span>
                    <div className={`absolute top-4 left-8 w-16 h-[2px] ${txStatus === 'completed' ? 'bg-[#fdc003]' : 'bg-[#efedf0] dark:bg-gray-800'}`}></div>
                  </div>
                  
                  <div className="flex flex-col items-center gap-1.5">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center z-10 font-bold ${
                      txStatus === 'completed' 
                        ? 'bg-[#fdc003] text-[#0a2540] shadow-sm ring-4 ring-[#ffdf9e] dark:ring-amber-500/20' 
                        : 'bg-[#efedf0] dark:bg-slate-800 text-slate-400'
                    }`}>
                      <span className="material-symbols-outlined text-sm">verified</span>
                    </div>
                    <span className={`text-[9px] uppercase tracking-wider font-extrabold ${txStatus === 'completed' ? 'text-[#0a2540] dark:text-emerald-400' : 'text-[#74777e]'}`}>Selesai</span>
                  </div>
                </div>

                {/* Order Meta Details */}
                <div className="bg-slate-50/80 dark:bg-slate-900/60 p-3 rounded-2xl border border-slate-100 dark:border-gray-800/80 text-[11px] text-[#43474d] dark:text-slate-300 space-y-1 font-semibold">
                  <div className="flex justify-between">
                    <span className="text-[#74777e] dark:text-slate-400">Tipe Order:</span>
                    <span className="font-extrabold text-[#0a2540] dark:text-white">
                      {(bookingInfo?.service_type || trackedTransaction?.serviceType) === 'home' ? 'Home Concierge Service' : 'Cuci di Outlet'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#74777e] dark:text-slate-400">Kendaraan:</span>
                    <span className="font-extrabold text-[#0a2540] dark:text-white truncate max-w-[180px]">
                      {bookingInfo?.vehicle_name || trackedTransaction?.vehicleName || 'Tesla Model S (ABC-1234)'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#74777e] dark:text-slate-400">Paket Layanan:</span>
                    <span className="font-extrabold text-[#785900] dark:text-[#fdc003]">
                      {bookingInfo?.package?.name || trackedTransaction?.packageName || 'Premium Wash & Wax'}
                    </span>
                  </div>
                </div>

                {/* Photo Showcase from Technician before/after work */}
                {(bookingInfo?.before_photo || bookingInfo?.after_photo) && (
                  <div className="bg-amber-50/40 dark:bg-amber-950/10 p-3 rounded-2xl border border-amber-100/40 dark:border-amber-950/20 space-y-2">
                    <p className="text-[10px] font-black text-amber-800 dark:text-amber-400 uppercase tracking-wider">Foto Hasil Kerja</p>
                    <div className="grid grid-cols-2 gap-2">
                      {bookingInfo.before_photo && (
                        <div className="rounded-xl overflow-hidden border border-black/5 dark:border-white/5 shadow-sm">
                          <p className="text-[9px] font-bold text-center bg-gray-100 dark:bg-gray-800 text-gray-500 py-0.5">Sebelum</p>
                          <img 
                            src={`http://127.0.0.1:8000/storage/${bookingInfo.before_photo}`} 
                            alt="Sebelum Cuci" 
                            className="w-full h-20 object-cover"
                          />
                        </div>
                      )}
                      {bookingInfo.after_photo && (
                        <div className="rounded-xl overflow-hidden border border-black/5 dark:border-white/5 shadow-sm">
                          <p className="text-[9px] font-bold text-center bg-gray-100 dark:bg-gray-800 text-gray-500 py-0.5">Sesudah</p>
                          <img 
                            src={`http://127.0.0.1:8000/storage/${bookingInfo.after_photo}`} 
                            alt="Setelah Cuci" 
                            className="w-full h-20 object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Tracking Status Text */}
                <div className="space-y-0.5">
                  <h2 className={`text-lg font-black ${txStatus === 'completed' ? 'text-emerald-600' : 'text-[#0a2540] dark:text-white'}`}>
                    {txStatus === 'completed' 
                      ? 'Pencucian Selesai & Berhasil!' 
                      : isOutlet 
                        ? 'Menuju Outlet Pilihan Anda' 
                        : txStatus === 'on_way'
                          ? 'Teknisi Sedang Menuju Rumah Anda'
                          : txStatus === 'in_progress'
                            ? 'Teknisi Sedang Mencuci Kendaraan'
                            : 'Menunggu Konfirmasi Teknisi'}
                  </h2>
                  <p className="text-xs text-[#43474d] dark:text-slate-400 font-semibold">
                    {txStatus === 'completed' 
                      ? 'Kendaraan Anda kini bersih cemerlang!' 
                      : isOutlet 
                        ? 'Silakan ikuti rute navigasi untuk menuju ke outlet.' 
                        : txStatus === 'on_way'
                          ? 'Silakan pantau pergerakan teknisi di peta.'
                          : txStatus === 'in_progress'
                            ? 'Pekerjaan sedang berlangsung. Silakan cek foto laporan sebelum di atas.'
                            : 'Admin sedang menugaskan teknisi ke lokasi.'}
                  </p>
                </div>

                {/* Technician contact / Outlet route widget */}
                {isOutlet && (
                  <div className="bg-[#f5f3f6] dark:bg-[#151f32] p-3 rounded-2xl flex items-center justify-between border border-[#e3e2e5] dark:border-gray-800">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-xl bg-[#0a2540] dark:bg-[#fdc003] text-white dark:text-[#0a2540] flex items-center justify-center">
                          <span className="material-symbols-outlined text-2xl">storefront</span>
                        </div>
                        <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
                      </div>
                      <div className="max-w-[170px]">
                        <p className="font-bold text-xs text-[#0a2540] dark:text-white truncate">{getOutletName(bookingInfo?.service_address || trackedTransaction?.serviceAddress)}</p>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold truncate">{bookingInfo?.service_address || trackedTransaction?.serviceAddress || 'Jl. Sudirman No.45, Jakarta'}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(bookingInfo?.service_address || trackedTransaction?.serviceAddress || 'Clean Vehicle Outlet')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="h-10 px-3 rounded-xl bg-[#fdc003] text-[#6c5000] flex items-center justify-center gap-1 hover:bg-[#e6ae02] active:scale-95 transition-all shadow-md cursor-pointer text-xs font-bold decoration-none"
                      >
                        <span className="material-symbols-outlined text-[16px]">navigation</span>
                        <span>Rute</span>
                      </a>
                    </div>
                  </div>
                )}

                {/* Technician block */}
                {(bookingInfo?.technician || trackedTransaction?.technician) && (
                  <div className="bg-[#f5f3f6] dark:bg-[#151f32] p-3 rounded-2xl flex items-center justify-between border border-[#e3e2e5] dark:border-gray-800">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <img 
                          alt={techName} 
                          className="w-12 h-12 rounded-xl object-cover"
                          src={bookingInfo?.technician?.avatar || trackedTransaction?.technician?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(techName)}&background=1B2337&color=F0C419`}
                        />
                        <div className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
                      </div>
                      <div>
                        <p className="font-bold text-xs text-[#0a2540] dark:text-white">{techName}</p>
                        <div className="flex items-center gap-0.5">
                          <span className="material-symbols-outlined text-[#fdc003] text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                          <span className="text-[10px] font-bold text-[#43474d] dark:text-slate-350">
                            {bookingInfo?.technician?.rating || trackedTransaction?.technician?.rating || '4.9'} • {bookingInfo?.technician?.specialization || trackedTransaction?.technician?.specialization || 'Cuci Specialist'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setShowCallAlert(true)}
                        className="w-10 h-10 rounded-full bg-white dark:bg-gray-850 border border-[#c4c6ce] dark:border-gray-750 flex items-center justify-center text-[#0a2540] dark:text-white active:bg-slate-100 dark:active:bg-gray-700 transition-colors shadow-sm cursor-pointer border-none"
                      >
                        <span className="material-symbols-outlined text-[18px]">call</span>
                      </button>
                      <button 
                        onClick={() => setShowChatBox(true)}
                        className="w-10 h-10 rounded-full bg-[#fdc003] flex items-center justify-center text-[#6c5000] active:scale-95 transition-transform shadow-md cursor-pointer border-none relative"
                      >
                        <span className="material-symbols-outlined text-[18px]">chat</span>
                        {unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-pulse">
                            {unreadCount}
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Vehicle tracking progress bar */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-bold text-[#0a2540] dark:text-white uppercase tracking-wider">Status Pencucian</span>
                    <span className="text-xs font-bold text-[#0a2540] dark:text-white">
                      {txStatus === 'completed' ? 'Selesai' : 'Sedang Diproses'}
                    </span>
                  </div>
                  <div className="h-2 w-full bg-[#efedf0] dark:bg-gray-800 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[#0a2540] dark:bg-[#fdc003] rounded-full relative transition-all duration-500" 
                      style={{ 
                        width: txStatus === 'completed' ? '100%' : 
                               txStatus === 'in_progress' ? '75%' : 
                               txStatus === 'on_way' ? '45%' : '15%' 
                      }}
                    >
                      <div className="absolute right-0 top-0 h-full w-2 bg-[#fdc003] dark:bg-[#0a2540]"></div>
                    </div>
                  </div>
                </div>

                {/* Lacak Posisi Teknisi Button */}
                {!isOutlet && ['on_way', 'in_progress'].includes(txStatus) && (
                  <button
                    type="button"
                    onClick={() => setShowMapModal(true)}
                    className="w-full mt-1.5 py-3 bg-[#fdc003] hover:bg-[#fabd00] text-[#6c5000] rounded-2xl font-bold text-[11px] cursor-pointer active:scale-95 transition-all text-center flex items-center justify-center gap-1.5 uppercase tracking-wider shadow-sm border-none"
                  >
                    <span className="material-symbols-outlined text-[15px]">directions_car</span>
                    Lacak Posisi Teknisi
                  </button>
                )}

                {/* Batalkan Pesanan Button */}
                {!['completed', 'cancelled'].includes(txStatus) && (
                  <button
                    type="button"
                    onClick={() => setShowCancelModal(true)}
                    className="w-full mt-1.5 py-3 border border-red-200 dark:border-red-950/30 hover:bg-neutral-50 dark:hover:bg-red-950/10 text-red-650 dark:text-red-400 rounded-2xl font-bold text-[11px] cursor-pointer active:scale-95 transition-all text-center flex items-center justify-center gap-1.5 uppercase tracking-wider shadow-sm bg-transparent"
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
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-5">
            <div className="bg-white dark:bg-[#111827] rounded-3xl p-6 text-center max-w-xs w-full shadow-2xl border border-slate-100 dark:border-gray-850 animate-scale-in">
              <div className="w-16 h-16 bg-red-50 dark:bg-red-950/30 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                <span className="material-symbols-outlined text-3xl">warning</span>
              </div>
              <h4 className="font-extrabold text-base text-[#000f22] dark:text-white mb-1">Batalkan Pesanan?</h4>
              <p className="text-[11px] text-[#74777e] dark:text-slate-400 mb-3 leading-normal font-medium">Apakah Anda yakin ingin membatalkan pesanan cuci ini? Seluruh biaya yang dibayarkan akan dikembalikan ke OnoPay Anda.</p>
              
              <div className="flex flex-col text-left gap-1 mb-4">
                <label className="text-[9px] font-extrabold text-[#74777e] dark:text-slate-400 uppercase tracking-wider">Alasan Pembatalan</label>
                <textarea 
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Tulis alasan Anda di sini..."
                  rows={2}
                  className="w-full bg-[#f5f3f6] dark:bg-[#1a2333] border border-[#e3e2e5] dark:border-gray-800 rounded-xl p-2.5 text-xs font-semibold focus:ring-1 focus:ring-[#fdc003] outline-none text-[#1b1c1e] dark:text-white placeholder-[#74777e] resize-none"
                  required
                />
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 py-3 bg-[#f5f3f6] dark:bg-gray-800 text-[#43474d] dark:text-white rounded-xl font-bold text-xs cursor-pointer hover:bg-slate-200 border-none"
                >
                  Kembali
                </button>
                <button 
                  onClick={() => {
                    if (!cancelReason.trim()) {
                      alert('Harap isi alasan pembatalan');
                      return;
                    }
                    setShowCancelModal(false);
                    if (onCancelActiveOrder) {
                      onCancelActiveOrder(trackedTransaction?.id, cancelReason);
                    }
                    setShowCancelSuccessToast(true);
                  }}
                  className="flex-grow py-3 bg-red-600 text-white rounded-xl font-bold text-xs cursor-pointer hover:bg-red-700 transition-colors border-none"
                >
                  Ya, Batalkan
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Live Map for Technician Location */}
        <AnimatePresence>
          {showMapModal && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[100] p-5">
              <div className="bg-white dark:bg-[#111827] rounded-[2rem] p-6 max-w-sm w-full shadow-2xl border border-slate-100 dark:border-gray-800 space-y-4">
                
                <div className="flex justify-between items-center pb-2 border-b border-slate-105 dark:border-gray-850">
                  <h4 className="font-extrabold text-base text-[#0a2540] dark:text-white flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[#fdc003]">location_on</span>
                    Posisi Real-time Teknisi
                  </h4>
                  <button 
                    onClick={() => setShowMapModal(false)}
                    className="text-gray-400 hover:text-gray-655 dark:hover:text-white bg-transparent border-none cursor-pointer p-1"
                  >
                    <span className="material-symbols-outlined text-[20px]">close</span>
                  </button>
                </div>

                {/* Simulated Map */}
                <div className="relative w-full h-64 rounded-2xl overflow-hidden border border-slate-200 dark:border-gray-800 bg-slate-105">
                  <div 
                    className="w-full h-full grayscale-[0.1] brightness-[1.01] dark:brightness-[0.85] transition-all" 
                    style={{ 
                      backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuD90iPn_p56sjSnZ0vwHyoBd07vLcuHPcArqDh3m0ku8XqdOGUw9z_TbF0kT98dV1a53CTJkoeIOLRvq7aGrNfLNNFB-zx15LDNCyiCYN_0Id64yu7zV3LnE0DNHCcnbGzTmpBXjNyLLOfVftyfkZh3rJmcIU-SzCnCriVti9GeG2LKndKXQ49v6J9VZP9MevH_EuxpjkmxOgfXDYAYFZHWmQ--x3CTM_hrjQwmK53ZULDCtkRwPH1sU4e9eGMSaXQYmKPJkzj9q_17')",
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  />
                  
                  {/* Pin Destination - Lokasi Customer */}
                  <div className="absolute top-[35%] left-[30%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                    <div className="bg-[#0a2540] dark:bg-slate-900 text-white p-2 rounded-full shadow-lg mb-1 ring-4 ring-white/50">
                      <span className="material-symbols-outlined block text-[14px]">home</span>
                    </div>
                    <div className="bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded-full shadow-sm">
                      <p className="text-[7px] font-bold text-slate-650 dark:text-slate-300 uppercase">Lokasi Anda</p>
                    </div>
                  </div>

                  {/* Live Pin - Lokasi Teknisi */}
                  {(!techLat || !techLng || (techLat === 0 && techLng === 0)) ? (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-center p-4">
                      <div className="bg-white dark:bg-slate-900 p-3 rounded-xl shadow-md space-y-1">
                        <span className="material-symbols-outlined text-red-500 animate-pulse">gps_off</span>
                        <p className="text-[10px] font-bold text-slate-700 dark:text-slate-200">GPS Teknisi Tidak Aktif</p>
                      </div>
                    </div>
                  ) : (
                    <div 
                      className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center transition-all duration-1000 ease-out"
                      style={{ top: techPinStyle.top, left: techPinStyle.left }}
                    >
                      <div className="bg-[#fdc003] text-[#6c5000] p-2.5 rounded-full shadow-lg mb-1 ring-4 ring-white/50 animate-bounce">
                        <span className="material-symbols-outlined block text-[18px]">electric_car</span>
                      </div>
                      <div className="bg-white dark:bg-slate-800 px-2 py-0.5 rounded-full shadow-sm">
                        <p className="text-[8px] font-bold text-[#0a2540] dark:text-white uppercase tracking-wider font-extrabold">Teknisi (Live)</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Technician Info */}
                <div className="bg-[#f8f7f9] dark:bg-[#151f32]/60 p-4 rounded-2xl space-y-2 text-xs font-semibold">
                  <div className="flex justify-between items-center text-slate-650 dark:text-slate-355">
                    <span className="text-gray-500">Nama Teknisi</span>
                    <span className="text-[#0a2540] dark:text-white font-extrabold">{techName}</span>
                  </div>
                  {techLat && techLng && (
                    <div className="flex justify-between items-center text-slate-655 dark:text-slate-355">
                      <span className="text-gray-500">Koordinat</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">
                        {techLat.toFixed(6)}, {techLng.toFixed(6)}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-slate-655 dark:text-slate-355">
                    <span className="text-gray-500">Status</span>
                    <span className="text-[#fdc003] font-bold uppercase tracking-wider">{txStatus === 'on_way' ? 'Menuju Lokasi' : 'Sedang Bekerja'}</span>
                  </div>
                </div>

                <button 
                  onClick={() => setShowMapModal(false)}
                  className="w-full py-3 bg-[#f5f3f6] dark:bg-gray-800 text-[#43474d] dark:text-white rounded-xl font-bold text-xs cursor-pointer border-none hover:bg-slate-100 dark:hover:bg-gray-700"
                >
                  Tutup
                </button>

              </div>
            </div>
          )}
        </AnimatePresence>

      </main>

      {/* Persistent Stick Bottom home action layout navbar drawer */}
      <div className="fixed bottom-0 left-0 w-full bg-white/95 dark:bg-[#111827]/95 backdrop-blur-md border-t border-[#efedf0] dark:border-gray-800 p-4 pb-6 z-50 shadow-lg text-center transition-all">
        <button 
          onClick={onBackToHome}
          className="w-full bg-[#fdc003] hover:bg-[#fabd00] text-[#6c5000] font-extrabold py-4 rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all text-xs uppercase tracking-wider border-none"
        >
          Kembali ke Beranda
        </button>
      </div>

    </div>
  );
}
