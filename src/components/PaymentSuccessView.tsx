import React from 'react';
import { motion } from 'motion/react';

interface PaymentSuccessViewProps {
  amountPaid: number;
  paymentMethod: string;
  onLacak: () => void;
  onHome: () => void;
}

export default function PaymentSuccessView({ amountPaid, paymentMethod, onLacak, onHome }: PaymentSuccessViewProps) {
  // Generate random order id
  const orderId = '#CV-982' + Math.floor(1000 + Math.random() * 9000);

  return (
    <div className="bg-[#faf9fb] min-h-screen flex flex-col items-center justify-between p-5 pb-8 overflow-x-hidden">
      
      <main className="w-full max-w-md flex flex-col items-center justify-center pt-8 space-y-6 flex-grow">
        
        {/* Success splash animation block */}
        <div className="flex flex-col items-center text-center animate-fade-up">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-4 animate-scale-in shadow-md">
            <span className="material-symbols-outlined text-green-500 !text-[48px]" style={{ fontVariationSettings: "'FILL' 1, 'wght' 700" }}>
              check_circle
            </span>
          </div>
          <h1 className="text-[34px] leading-tight font-black text-[#0a2540] tracking-tight mb-1">
            Payment Successful
          </h1>
          <p className="text-sm font-semibold text-[#43474d] max-w-[280px] leading-relaxed">
            Your vehicle service has been scheduled successfully.
          </p>
        </div>

        {/* Dynamic transaction receipt details card */}
        <div className="w-full bg-white rounded-2xl shadow-lg p-5 border border-[#efedf0] animate-fade-up">
          <div className="space-y-4">
            
            <div className="flex justify-between items-center pb-2 border-b border-[#efedf0]">
              <span className="text-[10px] font-bold text-[#43474d] uppercase tracking-wider">Order ID</span>
              <span className="text-xs font-bold text-[#0a2540]">{orderId}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-[#43474d] uppercase tracking-wider">Amount Paid</span>
              <span className="text-sm font-black text-[#0a2540]">
                Rp {amountPaid.toLocaleString('id-ID')}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-[#43474d] uppercase tracking-wider">Payment Method</span>
              <div className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[#43474d] !text-base">account_balance_wallet</span>
                <span className="text-xs font-bold text-[#0a2540]">{paymentMethod}</span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-[#43474d] uppercase tracking-wider">Date</span>
              <span className="text-xs font-medium text-[#0a2540]">
                {(() => {
                  const daysAbbrIndo = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
                  const monthsIndo = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
                  const d = new Date();
                  const dayName = daysAbbrIndo[d.getDay()];
                  const monthName = monthsIndo[d.getMonth()];
                  const minutesStr = String(d.getMinutes()).padStart(2, '0');
                  return `${dayName}, ${d.getDate()} ${monthName} ${d.getFullYear()} • ${d.getHours()}:${minutesStr} WIB`;
                })()}
              </span>
            </div>

          </div>
        </div>

        {/* Visual atmospheric banner preview of auto spa */}
        <div className="w-full overflow-hidden rounded-2xl bg-[#efedf0] shadow-sm border border-[#c4c6ce]/30 animate-fade-up">
          <div className="relative h-32 w-full">
            <img 
              className="w-full h-full object-cover grayscale-[0.1]" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCnGAnCzSUDd6j5Y704uhMpHXiV0wPVPPAufsHCkc2XwkKEVEEwuM0fdNKhW8GCCqSfwgjiqXTDgcP1rSdPaL2GUSQBIXhwEpabuSaVQRtKts5O-4JyrqflM9tMdCzYMiLQZqOhhH1Zfa8disP9cz3xizt1FxGuVXtwAld2TzuaSRyp-AdMdEkaf66Q75-CY_n4xsSHVMlVGBabdHuieb6fZXVDMeNh4iHe8D4XltNfxnhmLBnhJE29XYLY1pYuiOxqbCwVlnC-wMUK"
              alt="Professional wash results"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a2540]/80 to-transparent flex items-end p-4">
              <div className="text-white">
                <p className="text-[9px] font-extrabold uppercase tracking-widest opacity-80 mb-0.5">Layanan Anda</p>
                <p className="text-sm font-bold">Premium Complete Exterior Wash</p>
              </div>
            </div>
          </div>
        </div>

      </main>

      {/* Sticky footer buttons area */}
      <footer className="w-full max-w-md px-1 space-y-3 mt-auto">
        <motion.button 
          whileTap={{ scale: 0.98 }}
          onClick={onLacak}
          className="w-full bg-[#fdc003] hover:bg-[#fabd00] text-[#6c5000] font-bold py-4 rounded-xl shadow-lg transition-all duration-200 flex justify-center items-center gap-2 text-sm uppercase tracking-wider cursor-pointer"
        >
          <span>Lacak Pesanan</span>
          <span className="material-symbols-outlined !text-[20px]">near_me</span>
        </motion.button>

        <button 
          onClick={onHome}
          className="w-full bg-[#efedf0] hover:bg-[#e9e8ea] text-[#0a2540] font-bold py-4 rounded-xl transition-all text-xs tracking-wider uppercase cursor-pointer"
        >
          Kembali ke Beranda
        </button>
      </footer>

    </div>
  );
}
