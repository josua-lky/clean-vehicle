import React, { useState } from 'react';
import { NotificationItem } from '../types';

interface AlertsViewProps {
  onNavigate: (tab: 'home' | 'history' | 'alerts' | 'profile') => void;
  onCtaAction: (notif: NotificationItem) => void;
  notifications: NotificationItem[];
  onClearAll?: () => void;
  onDeleteNotif?: (id: string) => void;
}

export default function AlertsView({ onNavigate, onCtaAction, notifications, onClearAll, onDeleteNotif }: AlertsViewProps) {
  const [activeTab, setActiveTab] = useState<'semua' | 'pesanan' | 'promo' | 'info'>('semua');

  // Filter alerts from notifications
  const filteredNotifs = notifications.filter(notif => {
    if (activeTab === 'semua') return true;
    return notif.category === activeTab;
  });

  return (
    <div className="bg-[#faf9fb] min-h-screen text-[#1b1c1e] pb-24">
      {/* Top Header App Bar */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-[#efedf0] shadow-sm">
        <div className="flex justify-between items-center w-full px-5 py-3 max-w-screen-xl mx-auto">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[#785900]">notifications</span>
            <h1 className="font-extrabold text-[#0a2540] text-lg tracking-tight">Notifikasi</h1>
          </div>
          {notifications.length > 0 && onClearAll && (
            <button 
              onClick={onClearAll}
              title="Hapus Semua Riwayat Notifikasi"
              className="flex items-center justify-center p-2 rounded-xl hover:bg-red-50 text-red-600 transition-colors"
            >
              <span className="material-symbols-outlined">delete_sweep</span>
            </button>
          )}
        </div>
      </header>

      <main className="max-w-md mx-auto px-5 pt-4 space-y-6">
        
        {/* Real-time category selector tabs */}
        <section className="flex gap-2 border-b border-[#efedf0] pb-2 overflow-x-auto no-scrollbar">
          {(['semua', 'pesanan', 'promo', 'info'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-4 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer select-none shrink-0 border ${
                activeTab === tab 
                  ? 'bg-[#0a2540] text-white border-[#0a2540] shadow-sm' 
                  : 'bg-white text-[#74777e] border-[#efedf0] hover:bg-[#efedf0]'
              }`}
            >
              {tab === 'semua' ? 'Semua' : tab === 'pesanan' ? 'Pesanan' : tab === 'promo' ? 'Promo' : 'Info'}
            </button>
          ))}
        </section>

        {/* Dynamic Alerts items render list */}
        <section className="space-y-4">
          {filteredNotifs.length > 0 ? (
            filteredNotifs.map(notif => (
              <div 
                key={notif.id}
                onClick={() => onCtaAction && onCtaAction(notif)}
                className="bg-white rounded-xl p-4 border border-[#efedf0] shadow-sm relative overflow-hidden flex gap-4 transition-transform duration-300 active:scale-[0.99] cursor-pointer hover:bg-slate-50/50"
              >
                {/* Decorative category stripe */}
                <div className={`absolute top-0 left-0 w-1.5 h-full ${
                  notif.category === 'pesanan' ? 'bg-emerald-500' : notif.category === 'promo' ? 'bg-amber-500' : 'bg-blue-500'
                }`}></div>

                {/* Icon box selector */}
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  notif.category === 'pesanan' ? 'bg-emerald-50 text-emerald-700' : notif.category === 'promo' ? 'bg-[#ffdf9e]/30 text-[#785900]' : 'bg-[#d2e4ff]/50 text-blue-700'
                }`}>
                  <span className="material-symbols-outlined font-semibold">
                    {notif.receipt ? 'receipt_long' : (notif.category === 'pesanan' ? 'shopping_bag' : notif.category === 'promo' ? 'sell' : 'info')}
                  </span>
                </div>

                {/* Notif Body */}
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="text-xs font-extrabold text-[#000f22]">{notif.title}</h4>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] text-[#74777e] font-semibold tracking-tight uppercase">{notif.time}</span>
                      {onDeleteNotif && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteNotif(notif.id);
                          }}
                          title="Hapus"
                          className="text-[#74777e] hover:text-red-550 hover:bg-slate-100 p-0.5 rounded transition-colors"
                        >
                          <span className="material-symbols-outlined text-xs">close</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-[#43474d] leading-normal font-medium">{notif.description}</p>

                  {notif.receipt && (
                    <div className="mt-3 p-3 bg-slate-50 rounded-xl border border-[#efedf0] text-[11px] space-y-2 font-medium text-[#43474d]">
                      <div className="flex justify-between border-b border-dashed border-slate-200 pb-1.5 font-bold text-[#000f22]">
                        <span>Struk Pembayaran</span>
                        <span className="text-emerald-600 font-extrabold">LUNAS</span>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Kode Transaksi</span>
                          <span className="font-bold text-[#0a2540]">{notif.receipt.bookingCode}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Layanan</span>
                          <span>{notif.receipt.packageName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Kendaraan</span>
                          <span>{notif.receipt.vehicleName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Waktu Pembayaran</span>
                          <span>{notif.receipt.date}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Metode</span>
                          <span className="uppercase">{notif.receipt.method}</span>
                        </div>
                      </div>
                      <div className="border-t border-dashed border-slate-200 pt-1.5 space-y-1">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Harga Paket</span>
                          <span>Rp {notif.receipt.price.toLocaleString('id-ID')}</span>
                        </div>
                        {notif.receipt.discount > 0 && (
                          <div className="flex justify-between text-red-500">
                            <span>Diskon Promo</span>
                            <span>-Rp {notif.receipt.discount.toLocaleString('id-ID')}</span>
                          </div>
                        )}
                        <div className="flex justify-between font-bold text-xs text-[#0a2540] pt-1 border-t border-slate-100">
                          <span>Total Pembayaran</span>
                          <span>Rp {notif.receipt.total.toLocaleString('id-ID')}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {notif.idTag && !notif.receipt && (
                    <span className="inline-block mt-2 px-2.5 py-0.5 bg-[#f5f3f6] rounded text-[10px] font-extrabold text-[#0a2540] border border-[#e3e2e5]">
                      {notif.idTag}
                    </span>
                  )}

                  {notif.hasCta && (
                    <div className="pt-3">
                      <button 
                        onClick={() => onCtaAction(notif)}
                        className="bg-[#fdc003] text-[#6c5000] text-[10px] font-extrabold py-2 px-4 rounded-lg tracking-wider uppercase hover:brightness-105 active:scale-95 transition-all text-center"
                      >
                        {notif.ctaText || 'LIHAT SEKARANG'}
                      </button>
                    </div>
                  )}
                </div>

              </div>
            ))
          ) : (
            <div className="py-20 text-center space-y-3">
              <span className="material-symbols-outlined text-[#74777e] text-5xl">notifications_off</span>
              <p className="text-sm font-semibold text-[#74777e]">Tidak ada notifikasi dalam kategori ini.</p>
            </div>
          )}
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
            className="flex flex-col items-center justify-center text-[#74777e] hover:text-[#000f22] transition-colors cursor-pointer text-xs font-semibold gap-1"
          >
            <span className="material-symbols-outlined">history</span>
            <span className="uppercase tracking-wider text-[9px]">History</span>
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
