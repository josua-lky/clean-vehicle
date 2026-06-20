import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Transaction } from '../types';

interface HistoryViewProps {
  transactions: Transaction[];
  onSubmitReview: (id: string, stars: number, text: string) => void;
  onRepeatOrder: (serviceName: string, price: number) => void;
  onNavigate: (tab: 'home' | 'history' | 'alerts' | 'profile') => void;
  userAvatar?: string;
  onTrackActiveOrder?: (orderId: string) => void;
  hasReviewedPendingToday?: boolean;
  unreadCount: number;
  initialExpandedId?: string;
}

export default function HistoryView({ transactions, onSubmitReview, onRepeatOrder, onNavigate, userAvatar, onTrackActiveOrder, hasReviewedPendingToday, unreadCount, initialExpandedId }: HistoryViewProps) {
  const [itemRatings, setItemRatings] = useState<Record<string, number>>({});
  const [itemComments, setItemComments] = useState<Record<string, string>>({});
  const [showConfirmationAlert, setShowConfirmationAlert] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'Semua' | 'Selesai' | 'Dibatalkan'>('Semua');
  const [expandedTxIds, setExpandedTxIds] = useState<Record<string, boolean>>({});

  React.useEffect(() => {
    if (initialExpandedId) {
      setExpandedTxIds(prev => ({ ...prev, [initialExpandedId]: true }));
      setTimeout(() => {
        const el = document.getElementById(`tx-card-${initialExpandedId}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('ring-2', 'ring-[#fdc003]', 'scale-[1.01]');
          setTimeout(() => {
            el.classList.remove('ring-2', 'ring-[#fdc003]', 'scale-[1.01]');
          }, 2000);
        }
      }, 300);
    }
  }, [initialExpandedId]);

  const toggleTxExpand = (id: string) => {
    setExpandedTxIds(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const handleItemReviewSubmit = (itemId: string) => {
    const starRating = itemRatings[itemId] !== undefined ? itemRatings[itemId] : 5;
    const commentText = itemComments[itemId] || '';
    onSubmitReview(itemId, starRating, commentText);
    setShowConfirmationAlert(true);
    setTimeout(() => {
      setShowConfirmationAlert(false);
    }, 3000);
  };

  return (
    <div className="bg-[#faf9fb] min-h-screen text-[#1b1c1e] pb-24">
      {/* Top Navbar Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-[#efedf0] shadow-sm">
        <div className="flex justify-between items-center w-full px-5 py-3 max-w-screen-xl mx-auto">
          {/* User Profile Headshot (Moved to Top Left) */}
          <div 
            onClick={() => onNavigate('profile')}
            className="h-10 w-10 rounded-full overflow-hidden border-2 border-[#ffdf9e] cursor-pointer active:opacity-70 transition-all shrink-0"
            title="Profil Saya"
          >
            <img 
              alt="User Headshot" 
              className="w-full h-full object-cover" 
              src={userAvatar || "https://lh3.googleusercontent.com/aida-public/AB6AXuD90iPn_p56sjSnZ0vwHyoBd07vLcuHPcArqDh3m0ku8XqdOGUw9z_TbF0kT98dV1a53CTJkoeIOLRvq7aGrNfLNNFB-zx15LDNCyiCYN_0Id64yu7zV3LnE0DNHCcnbGzTmpBXjNyLLOfVftyfkZh3rJmcIU-SzCnCriVti9GeG2LKndKXQ49v6J9VZP9MevH_EuxpjkmxOgfXDYAYFZHWmQ--x3CTM_hrjQwmK53ZULDCtkRwPH1sU4e9eGMSaXQYmKPJkzj9q_17"}
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[#785900] text-lg">history</span>
            <h1 className="font-extrabold text-[#0a2540] text-sm tracking-tight">History &amp; Reviews</h1>
          </div>

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
      </header>

      <main className="max-w-md mx-auto px-5 pt-4 space-y-6">
        
        {/* Dynamic visual review feedback confirmation overlay banner */}
        {showConfirmationAlert && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold animate-fade-up">
            Ulasan berhasil dikirim! Terima kasih atas masukan Anda.
          </div>
        )}

        {/* Total Summary Statistics Section */}
        <section className="grid grid-cols-1 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-[#efedf0]">
            <p className="text-[10px] font-bold text-[#43474d] mb-1 tracking-wider uppercase">TOTAL LAYANAN</p>
            <p className="text-2xl font-black text-[#000f22]">{transactions.length}</p>
          </div>
        </section>

        {/* Past Transactions list */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <h2 className="text-sm font-extrabold text-[#000f22]">Riwayat Transaksi</h2>
              <p className="text-[10px] text-[#74777e] font-semibold">Saring riwayat pemesanan Anda</p>
            </div>
            <div className="flex items-center gap-1.5 bg-[#f5f3f6] rounded-xl px-2.5 py-1.5 text-[10px] font-bold text-[#74777e]">
              <span className="material-symbols-outlined text-[14px]">filter_alt</span>
              <span>Status</span>
            </div>
          </div>

          {/* Status Filter Chips */}
          <div className="flex items-center gap-2 pb-1 overflow-x-auto no-scrollbar scroll-smooth">
            {(['Semua', 'Selesai', 'Dibatalkan'] as const).map((filterValue) => {
              const count = filterValue === 'Semua' 
                ? transactions.length 
                : transactions.filter(t => t.status === filterValue).length;
              const isActive = selectedFilter === filterValue;
              return (
                <button
                  key={filterValue}
                  type="button"
                  onClick={() => setSelectedFilter(filterValue)}
                  className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all duration-150 cursor-pointer select-none border whitespace-nowrap flex items-center gap-2 ${
                    isActive
                      ? 'bg-[#0a2540] text-[#fdc003] border-[#0a2540] shadow-sm scale-[1.02]'
                      : 'bg-white text-[#43474d] border-[#efedf0] hover:bg-slate-50'
                  }`}
                >
                  <span>{filterValue}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-md font-black shrink-0 ${
                    isActive 
                      ? 'bg-[#fdc003] text-[#0a2540]' 
                      : filterValue === 'Dibatalkan'
                        ? 'bg-red-50 text-red-600'
                        : filterValue === 'Selesai'
                          ? 'bg-green-50 text-emerald-700'
                          : 'bg-slate-100 text-[#74777e]'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="space-y-3">
            {transactions.filter(item => selectedFilter === 'Semua' || item.status === selectedFilter).length === 0 ? (
              <div className="bg-white rounded-2xl p-8 border border-[#efedf0] text-center space-y-3 shadow-sm py-10">
                <div className="w-14 h-14 bg-[#f5f3f6] rounded-full flex items-center justify-center mx-auto text-[#74777e]">
                  <span className="material-symbols-outlined text-[28px]">search_off</span>
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-extrabold text-[#000f22]">Tidak Ada Riwayat</h4>
                  <p className="text-xs text-[#74777e] leading-relaxed max-w-[210px] mx-auto font-medium">
                    Belum ada riwayat pesanan dengan status <strong className="text-[#0a2540] font-black">{selectedFilter}</strong> saat ini.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedFilter('Semua')}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#785900] bg-[#ffdf9e]/30 px-4 py-2 rounded-xl hover:bg-[#ffdf9e]/55 active:scale-95 transition-all cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[14px]">refresh</span> Atur Ulang Saringan
                </button>
              </div>
            ) : (
              transactions
                .filter(item => selectedFilter === 'Semua' || item.status === selectedFilter)
                .map(item => {
                  const isExpanded = !!expandedTxIds[item.id];
                  return (
                    <div key={item.id} id={`tx-card-${item.id}`} className="bg-white p-4 rounded-xl shadow-sm border border-[#efedf0] transition-all">
                      <div className="flex gap-4">
                        {/* Visual Category symbol */}
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${
                          item.status === 'Dibatalkan' ? 'bg-red-50 text-red-500' : 'bg-[#0a2540]/10 text-[#0a2540]'
                        }`}>
                          <span className="material-symbols-outlined text-xl">
                            {item.vehicleType === 'motor' ? 'motorcycle' : (item.serviceName.includes('Oil') ? 'oil_barrel' : item.serviceName.includes('Tire') ? 'car_repair' : 'directions_car')}
                          </span>
                        </div>

                        {/* Body metadata */}
                        <div className="flex-grow min-w-0">
                          <div className="flex justify-between items-start gap-2">
                            <h4 className="text-xs font-extrabold text-[#000f22] truncate">{item.serviceName}</h4>
                            <div className="flex items-center gap-1 shrink-0">
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                                item.status === 'Selesai' ? 'bg-green-50 text-emerald-700' : 'bg-[#e9e8ea] text-[#43474d]'
                              }`}>
                                {item.status}
                              </span>
                              <button
                                type="button"
                                onClick={() => toggleTxExpand(item.id)}
                                className="w-6 h-6 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors"
                              >
                                <span className={`material-symbols-outlined text-[18px] transition-transform duration-200 ${isExpanded ? 'rotate-180 text-[#785900]' : ''}`}>
                                  keyboard_arrow_down
                                </span>
                              </button>
                            </div>
                          </div>
                          
                          <p className="text-[10px] text-[#74777e] font-semibold mt-0.5">{item.date}</p>
                          
                          {/* Reviews rating or repeat order trigger actions block */}
                          <div className="flex justify-between items-center mt-3 pt-3 border-t border-[#f5f3f6]">
                            <p className="text-xs font-bold text-[#000f22]">Rp {item.price.toLocaleString('id-ID')}</p>
                            
                            <div className="flex items-center gap-2">
                              {/* Open Expand button */}
                              <button
                                type="button"
                                onClick={() => toggleTxExpand(item.id)}
                                className={`text-[9px] font-extrabold px-2.5 py-1 rounded-full transition-colors flex items-center gap-0.5 ${
                                  isExpanded 
                                    ? 'bg-[#0a2540] text-[#fdc003]' 
                                    : 'bg-[#ffdf9e]/30 text-[#785900] hover:bg-[#ffdf9e]/55'
                                }`}
                              >
                                <span>{isExpanded ? 'Tutup' : 'Detail'}</span>
                              </button>

                              {item.status === 'Dibatalkan' && (
                                <span className="text-[9px] font-bold text-red-500 tracking-wider">BATAL</span>
                              )}

                              {item.status === 'Selesai' && item.rating && (
                                <div className="flex gap-0.5">
                                  {[1, 2, 3, 4, 5].map((s) => {
                                    const active = s <= (item.rating || 5);
                                    return (
                                      <span 
                                        key={s} 
                                        className={`material-symbols-outlined text-[13px] text-[#fdc003] ${active ? 'opacity-100' : 'opacity-30'}`}
                                        style={{ fontVariationSettings: active ? "'FILL' 1" : "'FILL' 0" }}
                                      >
                                        star
                                      </span>
                                    );
                                  })}
                                </div>
                              )}

                              {item.status === 'Selesai' && !item.rating && item.canRepeat && (
                                <button 
                                  onClick={() => onRepeatOrder(item.serviceName, item.price)}
                                  className="text-[9px] font-extrabold text-[#fdc003] bg-[#0a2540] px-3 py-1 rounded-full active:opacity-75 transition-opacity cursor-pointer"
                                >
                                  Pesan Lagi
                                </button>
                              )}

                              {(item.status === 'Dipesan' || item.status === 'Diproses') && (
                                <button 
                                  type="button"
                                  onClick={() => onTrackActiveOrder && onTrackActiveOrder(item.id)}
                                  className="text-[9px] font-extrabold text-[#785900] bg-[#ffdf9e] hover:bg-[#ffdf9e]/85 px-3 py-1 rounded-full active:scale-95 transition-all cursor-pointer flex items-center gap-0.5"
                                >
                                  <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: "'FILL' 1" }}>location_on</span>
                                  <span>{item.serviceType === 'outlet' ? 'Rute' : 'Lacak'}</span>
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Expandable Details Block */}
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-dashed border-[#efedf0] text-[11px] text-[#43474d] space-y-2.5 animate-fade-down duration-200">
                          <div className="grid grid-cols-2 gap-2 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                            <div>
                              <span className="text-[9px] text-[#74777e] block font-bold uppercase tracking-wider">Tipe Kendaraan</span>
                              <span className="font-extrabold text-[#000f22] flex items-center gap-1 mt-0.5">
                                <span className="material-symbols-outlined text-xs text-[#785900]">
                                  {item.vehicleType === 'motor' ? 'motorcycle' : 'directions_car'}
                                </span>
                                {item.vehicleType === 'motor' ? 'Roda 2 (Motor)' : 'Roda 4 (Mobil)'}
                              </span>
                            </div>
                            <div>
                              <span className="text-[9px] text-[#74777e] block font-bold uppercase tracking-wider">Nama &amp; Plat</span>
                              <span className="font-extrabold text-[#000f22] truncate block mt-0.5">
                                {item.vehicleName || (item.vehicleType === 'motor' ? 'Honda CBR 250RR (B-4567-XYZ)' : 'Tesla Model S (ABC-1234)')}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 px-1">
                            <div>
                              <span className="text-[9px] text-[#74777e] block font-bold uppercase tracking-wider">Paket Dipilih</span>
                              <span className="font-black text-[#000f22] block mt-0.5 leading-snug">
                                {item.packageName || (item.serviceName.includes('Detail') ? 'Ultimate Detailing' : 'Premium Wash')}
                              </span>
                            </div>
                            <div>
                              <span className="text-[9px] text-[#74777e] block font-bold uppercase tracking-wider">Total Pembayaran</span>
                              <span className="font-black text-[#785900] block mt-0.5">
                                Rp {item.price.toLocaleString('id-ID')}
                              </span>
                            </div>
                          </div>

                           <div className="bg-[#ffdf9e]/15 p-2.5 rounded-xl border border-[#ffdf9e]/30 mt-1">
                            <span className="text-[9px] text-[#785900] block font-bold uppercase tracking-wider mb-0.5">Keterangan Layanan</span>
                            <p className="text-slate-600 font-semibold leading-relaxed text-[10px]">
                              {item.additionalNotes || 'Penyemprotan bodi merata dengan foam berbusa tebal pH seimbang, pengeringan halus vacuum, plus pelat pelindung kilat.'}
                            </p>
                          </div>

                          {item.status === 'Dibatalkan' && (
                            <div className="bg-red-50 p-2.5 rounded-xl border border-red-100 mt-1">
                              <span className="text-[9px] text-red-650 block font-bold uppercase tracking-wider mb-0.5">Alasan Pembatalan</span>
                              <p className="text-red-700 font-semibold leading-relaxed text-[10px]">
                                {item.cancelledReason || 'Tidak ada alasan khusus yang diisi.'}
                              </p>
                            </div>
                          )}

                          {item.payment && item.payment.status === 'refunded' && (
                            <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-100 mt-1">
                              <span className="text-[9px] text-emerald-750 block font-bold uppercase tracking-wider mb-0.5">Pengembalian Dana (Refund)</span>
                              <p className="text-emerald-800 font-semibold leading-relaxed text-[10px]">
                                Dana sebesar <strong className="font-extrabold text-emerald-900">Rp {item.payment.refundAmount.toLocaleString('id-ID')}</strong> telah berhasil dikembalikan ke saldo e-wallet OnoPay Anda{item.payment.refundedAt ? ` pada ${new Date(item.payment.refundedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} pukul ${new Date(item.payment.refundedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}` : ''}.
                              </p>
                            </div>
                          )}

                          {(item.beforePhoto || item.afterPhoto) && (
                            <div className="bg-amber-50/40 dark:bg-amber-955/10 p-3 rounded-2xl border border-amber-100/40 dark:border-amber-950/20 space-y-2 mt-1">
                              <p className="text-[9px] font-black text-amber-800 dark:text-amber-400 uppercase tracking-wider">Foto Hasil Kerja</p>
                              <div className="grid grid-cols-2 gap-2">
                                {item.beforePhoto && (
                                  <div className="rounded-xl overflow-hidden border border-black/5 dark:border-white/5 shadow-sm">
                                    <p className="text-[8px] font-bold text-center bg-gray-100 dark:bg-gray-800 text-gray-500 py-0.5">Sebelum</p>
                                    <img 
                                      src={`http://127.0.0.1:8000/storage/${item.beforePhoto}`} 
                                      alt="Sebelum Cuci" 
                                      className="w-full h-20 object-cover"
                                    />
                                  </div>
                                )}
                                {item.afterPhoto && (
                                  <div className="rounded-xl overflow-hidden border border-black/5 dark:border-white/5 shadow-sm">
                                    <p className="text-[8px] font-bold text-center bg-gray-100 dark:bg-gray-800 text-gray-500 py-0.5">Sesudah</p>
                                    <img 
                                      src={`http://127.0.0.1:8000/storage/${item.afterPhoto}`} 
                                      alt="Setelah Cuci" 
                                      className="w-full h-20 object-cover"
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {(item.status === 'Dipesan' || item.status === 'Diproses') && (
                            <button
                              type="button"
                              onClick={() => {
                                if (onTrackActiveOrder) {
                                  onTrackActiveOrder(item.id);
                                }
                              }}
                              className="w-full mt-2 py-3 bg-[#0a2540] hover:bg-[#0a2540]/90 text-[#fdc003] rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer transition-all text-xs uppercase tracking-wider shadow-sm"
                            >
                              <span className="material-symbols-outlined text-sm">location_on</span>
                              {item.serviceType === 'outlet' ? 'Rute ke Outlet' : 'Lacak Posisi Teknisi (Aktif)'}
                            </button>
                          )}
                          
                          <div className="flex justify-between items-center px-1 text-[9px] text-slate-400 font-bold">
                            <span>ID TRANSPAC: {item.id}</span>
                            <span>STATUS: {item.status === 'Selesai' ? 'SUCCESS & PAID' : item.status === 'Dibatalkan' ? 'CANCELLED / REFUNDED' : 'PENDING'}</span>
                          </div>
                        </div>
                      )}

                      {/* Review Form for Completed & Unrated Transactions */}
                      {item.status === 'Selesai' && !item.rating && (
                        <div className="mt-4 pt-4 border-t border-dashed border-[#efedf0] space-y-4">
                          <div className="bg-[#fdc003]/5 p-4 rounded-xl border border-[#fdc003]/20 space-y-4">
                            <div className="flex justify-between items-center">
                              <p className="text-[10px] font-bold text-[#785900] tracking-wider uppercase">Tinjauan Menunggu</p>
                              <span className="bg-[#fdc003]/20 text-[#785900] px-2 py-0.5 rounded text-[8px] font-bold tracking-wider uppercase">
                                1 ACTION NEEDED
                              </span>
                            </div>
                            
                            {/* Rating Selector star system */}
                            <div className="flex justify-center gap-2">
                              {[1, 2, 3, 4, 5].map((star) => {
                                const currentRating = itemRatings[item.id] !== undefined ? itemRatings[item.id] : 5;
                                const filled = star <= currentRating;
                                return (
                                  <button 
                                    key={star}
                                    type="button"
                                    onClick={() => setItemRatings(prev => ({ ...prev, [item.id]: star }))}
                                    className={`text-4xl select-none cursor-pointer transform hover:scale-110 active:scale-95 transition-all text-[#fdc003] ${
                                      filled ? 'opacity-100' : 'opacity-30'
                                    }`}
                                  >
                                    <span className="material-symbols-outlined !text-[36px]" style={{ fontVariationSettings: filled ? "'FILL' 1" : "'FILL' 0" }}>
                                      star
                                    </span>
                                  </button>
                                );
                              })}
                            </div>

                            {/* Feedback comment box */}
                            <textarea 
                              value={itemComments[item.id] || ''}
                              onChange={(e) => setItemComments(prev => ({ ...prev, [item.id]: e.target.value }))}
                              placeholder="Ceritakan pengalaman Anda dengan layanan concierge kami..."
                              rows={3}
                              className="w-full bg-white border border-[#c4c6ce] rounded-xl p-3 text-xs leading-normal font-semibold focus:ring-1 focus:ring-[#fdc003] outline-none placeholder-[#74777e]"
                            />

                            <button 
                              type="button"
                              onClick={() => handleItemReviewSubmit(item.id)}
                              className="w-full bg-[#fdc003] text-[#6c5000] py-3.5 rounded-xl font-bold hover:brightness-105 active:scale-[0.98] transition-transform shadow-md text-xs uppercase tracking-wider cursor-pointer"
                            >
                              Kirim Ulasan Jasa
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
            )}
          </div>
        </section>


      </main>

      {/* Bottom Nav Bar */}
      <nav className="bg-white/95 backdrop-blur-lg border-t border-[#efedf0] shadow-2lg fixed bottom-0 left-0 w-full z-50">
        <div className="flex justify-around items-center px-4 pb-6 pt-3">
          <button 
            onClick={() => onNavigate('home')} 
            className="flex flex-col items-center justify-center text-[#74777e] hover:text-[#000f22] transition-colors cursor-pointer text-xs font-semibold gap-1"
          >
            <span className="material-symbols-outlined">home</span>
            <span className="uppercase tracking-wider text-[9px]">Home</span>
          </button>

          <button 
            onClick={() => onNavigate('history')} 
            className="flex flex-col items-center justify-center text-[#fdc003] bg-[#ffdf9e]/30 rounded-2xl px-5 py-2 active:scale-95 transition-transform duration-150 cursor-pointer text-xs font-bold gap-1"
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>history</span>
            <span className="uppercase tracking-wider text-[9px] font-extrabold">History</span>
          </button>

          <button 
            onClick={() => onNavigate('profile')} 
            className="flex flex-col items-center justify-center text-[#74777e] hover:text-[#000f22] transition-colors cursor-pointer text-xs font-semibold gap-1"
          >
            <span className="material-symbols-outlined">person</span>
            <span className="uppercase tracking-wider text-[9px]">Profile</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
