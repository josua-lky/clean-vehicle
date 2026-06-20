import React, { useState } from 'react';

interface FAQItem {
  id: number;
  question: string;
  answer: string;
  category: 'teknisi' | 'layanan' | 'pembayaran_garansi';
}

interface FAQSubViewProps {
  onBack: () => void;
  onNavigate: (tab: string) => void;
}

export default function FAQSubView({ onBack, onNavigate }: FAQSubViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const faqs: FAQItem[] = [
    {
      id: 1,
      question: 'Bagaimana cara teknisi menemukan lokasi saya?',
      answer: 'Teknisi kami menggunakan koordinat GPS dari alamat pengerjaan yang Anda tentukan saat memesan. Anda juga bisa menggunakan fitur Chat real-time di aplikasi untuk mengidentifikasi detail tambahan seperti nomor blok rumah atau warna gerbang.',
      category: 'teknisi'
    },
    {
      id: 2,
      question: 'Apakah saya harus mendampingi kendaraan saat pencucian?',
      answer: 'Tidak perlu. Selama kendaraan berada di area yang mudah diakses (seperti garasi rumah terbuka, area carport, atau parkiran kantor) dan kunci diserahkan jika layanan mencakup pembersihan interior, Anda bebas melanjutkan aktivitas Anda.',
      category: 'teknisi'
    },
    {
      id: 3,
      question: 'Jenis layanan cuci apa yang paling direkomendasikan?',
      answer: 'Untuk proteksi kilap terbaik, kami merekomendasikan layanan "Premium Ceramic Coating" atau "Waxing & Polishing". Namun untuk pembersihan rutin mingguan yang cepat, layanan "Cuci Body Kilap Express" sudah sangat mumpuni.',
      category: 'layanan'
    },
    {
      id: 4,
      question: 'Berapa lama proses pengerjaan rata-rata?',
      answer: 'Layanan Cuci Express standar memakan waktu sekitar 30 - 45 menit. Untuk layanan Detailing komprehensif, multi-stage poles eksterior, atau interior deep cleaning, durasi pengerjaan berkisar antara 1,5 hingga 3 jam tergantung ukuran kendaraan.',
      category: 'layanan'
    },
    {
      id: 5,
      question: 'Apakah air dan listrik disediakan oleh pihak teknisi?',
      answer: 'Teknisi tangguh kami membawa generator listrik portable berisik-rendah dan tangki air bersih sendiri khusus untuk pemesanan "Home Wash / Servis di Rumah". Anda hanya perlu menyediakan ruang/akses parkir yang aman untuk pengerjaan.',
      category: 'layanan'
    },
    {
      id: 6,
      question: 'Metode pembayaran apa saja yang didukung oleh aplikasi?',
      answer: 'Kami mendukung berbagai pilihan pembayaran nontunai instan: Transfer Bank (BCA Mandiri, dll), OVO, GoPay, LinkAja, Kartu Kredit, serta Saldo Garasi (pembelian dari Loyalty Points).',
      category: 'pembayaran_garansi'
    },
    {
      id: 7,
      question: 'Bagaimana jika cuaca hujan tepat setelah pengerjaan selesai?',
      answer: 'Jangan khawatir! Kami menyediakan Garansi Hujan 24 Jam. Jika kendaraan Anda terkena air hujan dalam waktu 24 jam setelah servis selesai, Anda bisa mengajukan klaim foto di menu Alerts untuk mendapatkan gratis cuci eksterior ulang.',
      category: 'pembayaran_garansi'
    },
    {
      id: 8,
      question: 'Dapatkah saya melakukan penjadwalan ulang (Reschedule)?',
      answer: 'Tentu saja. Anda dapat mengubah jadwal pencucian tanpa biaya tambahan hingga maksimal 2 jam sebelum waktu pengerjaan yang dipilih melalui tab History / Riwayat pengerjaan.',
      category: 'layanan'
    }
  ];

  const categories = [
    { value: 'all', label: 'Semua Kategori', icon: 'apps' },
    { value: 'teknisi', label: 'Teknisi & Lokasi', icon: 'handyman' },
    { value: 'layanan', label: 'Layanan & Durasi', icon: 'directions_car' },
    { value: 'pembayaran_garansi', label: 'Bayar & Garansi', icon: 'payments' }
  ];

  const filteredFaqs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const toggleExpand = (id: number) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  return (
    <div className="bg-[#faf9fb] min-h-screen text-[#1b1c1e] pb-24">
      {/* Top Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-[#efedf0] shadow-sm">
        <div className="flex justify-between items-center w-full px-5 py-3 max-w-screen-xl mx-auto">
          <button 
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 text-[#0a2540] text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer select-none border border-slate-200/50"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Kembali
          </button>
          <h1 className="font-extrabold text-[#0a2540] text-sm tracking-tight">Tanya Jawab (FAQ)</h1>
          <div className="w-[84px]"></div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-5 pt-6 space-y-6">
        {/* Banner */}
        <div className="bg-[#ffdf9e]/20 border border-[#ffdf9e]/50 rounded-2xl p-5 flex items-start gap-4">
          <div className="bg-[#fdc003] text-[#6c5000] w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm">
            <span className="material-symbols-outlined text-[22px]">quiz</span>
          </div>
          <div>
            <h2 className="text-xs font-black text-[#000f22] uppercase tracking-wider">Pusat Bantuan Cuci</h2>
            <p className="text-[11px] text-[#74777e] leading-relaxed mt-1">
              Temukan jawaban tercepat seputar metode pencucian premium, garansi hujan, dan penugasan teknisi profesional kami.
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#74777e] text-[18px]">
            search
          </span>
          <input
            type="text"
            placeholder="Cari pertanyaan atau jawaban..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-[#efedf0] rounded-xl pl-10 pr-4 py-3 placeholder:text-[#a0a2ac] text-xs font-medium focus:ring-1 focus:ring-[#fdc003] outline-none shadow-sm transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
            >
              <span className="material-symbols-outlined text-[14px]">close</span>
            </button>
          )}
        </div>

        {/* Categories Carousel */}
        <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none drag-scroll">
          {categories.map((cat) => (
            <button
              key={cat.value}
              onClick={() => setSelectedCategory(cat.value)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-extrabold uppercase shrink-0 transition-all cursor-pointer ${
                selectedCategory === cat.value
                  ? 'bg-[#fdc003] text-[#6c5000] shadow-sm'
                  : 'bg-white border border-[#efedf0] text-[#74777e] hover:bg-slate-50'
              }`}
            >
              <span className="material-symbols-outlined text-xs">{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>

        {/* FAQ List Accordions */}
        <div className="space-y-3 pb-8">
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq) => {
              const isExpanded = expandedId === faq.id;
              return (
                <div 
                  key={faq.id}
                  className="bg-white rounded-2xl border border-[#efedf0] overflow-hidden shadow-sm hover:border-[#ffe9be] transition-colors"
                >
                  <button
                    onClick={() => toggleExpand(faq.id)}
                    className="w-full p-4 flex items-start justify-between text-left gap-4 cursor-pointer select-none"
                  >
                    <div className="flex-1">
                      <span className="text-xs font-black text-[#000f22] leading-snug">
                        {faq.question}
                      </span>
                    </div>
                    <div className={`mt-0.5 shrink-0 w-6 h-6 rounded-full flex items-center justify-center transition-transform duration-200 ${
                      isExpanded ? 'bg-[#ffdf9e]/55 rotate-180 text-[#785900]' : 'bg-slate-50 text-slate-400'
                    }`}>
                      <span className="material-symbols-outlined text-[16px] font-bold">
                        keyboard_arrow_down
                      </span>
                    </div>
                  </button>

                  {/* Transition for Answer */}
                  <div className={`transition-all duration-300 ease-in-out ${
                    isExpanded ? 'max-h-56 opacity-100 border-t border-slate-50' : 'max-h-0 opacity-0 pointer-events-none'
                  } overflow-hidden`}>
                    <div className="p-4 bg-slate-50/50 text-[11px] text-[#5c5e66] leading-relaxed font-medium">
                      {faq.answer}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="bg-white rounded-2xl border border-[#efedf0] p-8 text-center text-[#74777e] space-y-2">
              <span className="material-symbols-outlined text-3xl text-slate-300">search_off</span>
              <p className="text-xs font-bold">Tidak ada tanya jawab yang cocok</p>
              <p className="text-[10px] text-[#a0a2ac]">Coba ganti kata kunci pemfilteran atau kategori Anda.</p>
            </div>
          )}
        </div>

        {/* Support Call-to-Action */}
        <div className="bg-white rounded-2xl border border-[#efedf0] p-5 text-center shadow-sm space-y-3.5 mb-12">
          <div className="w-10 h-10 bg-green-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            <span className="material-symbols-outlined text-xl">support_agent</span>
          </div>
          <div className="space-y-1">
            <h3 className="text-xs font-black text-[#000f22] uppercase tracking-wider">Punya Pertanyaan Lain?</h3>
            <p className="text-[11px] text-[#74777e] leading-relaxed font-semibold max-w-xs mx-auto">
              Customer support kami siap membantu menjawab kendala atau permintaan khusus Anda secara langsung via WhatsApp.
            </p>
          </div>
          <a
            href="https://wa.me/6281234567890?text=Halo%20Clean%20Vehicle%20Support%2C%2520saya%2520memiliki%2520pertanyaan%2520atau%2520kendala%2520mengenai%2520layanan%2520cuci%2520kendaraan%2520yang%2520tidak%2520tertera%2520di%2520FAQ.%2520Mohon%2520bantuannya%2520ya%2520tim!"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] uppercase tracking-wider rounded-xl transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <svg 
              className="w-4 h-4 fill-current" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12.012 2C6.5 2 2.012 6.5 2.012 12c0 2.13.6 4.13 1.63 5.86L2.122 23l5.31-1.39c1.66.9 3.52 1.39 5.58 1.39 5.512 0 10-4.5 10-10S17.524 2 12.012 2zm5.72 13.91c-.24.68-1.2 1.25-1.63 1.32-.44.07-.84.11-2.65-.6-2.31-.91-3.79-3.25-3.9-3.41-.12-.13-.98-1.3-1-2.52-.02-1.22.63-1.82.85-2.06.22-.24.47-.3.63-.3.16 0 .33 0 .47.01.15.01.35-.06.55.41.2.49.69 1.68.75 1.8.06.12.1.26.02.43-.08.17-.12.27-.24.41-.12.14-.26.31-.38.42-.14.13-.29.27-.12.56.17.29.74 1.23 1.6 1.98.71.62 1.32.81 1.63.94.3.13.48.11.66-.09.18-.21.78-.91.99-1.22.21-.31.42-.26.71-.15.29.11 1.86.88 2.18 1.04.32.16.54.24.61.37.07.13.07.75-.17 1.43z"/>
            </svg>
            Tanya Customer Support
          </a>
        </div>
      </main>

      {/* Bottom Nav Bar */}
      <nav className="bg-white/95 backdrop-blur-lg border-t border-[#efedf0] shadow-2lg fixed bottom-0 left-0 w-full z-50">
        <div className="flex justify-around items-center px-4 pb-6 pt-3">
          <button 
            type="button"
            onClick={() => { onBack(); onNavigate('home'); }} 
            className="flex flex-col items-center justify-center text-[#74777e] hover:text-[#000f22] transition-colors cursor-pointer text-xs font-semibold gap-1"
          >
            <span className="material-symbols-outlined">home</span>
            <span className="uppercase tracking-wider text-[9px]">Home</span>
          </button>

          <button 
            type="button"
            onClick={() => { onBack(); onNavigate('history'); }} 
            className="flex flex-col items-center justify-center text-[#74777e] hover:text-[#000f22] transition-colors cursor-pointer text-xs font-semibold gap-1"
          >
            <span className="material-symbols-outlined">history</span>
            <span className="uppercase tracking-wider text-[9px]">History</span>
          </button>

          <button 
            type="button"
            onClick={onBack} 
            className="flex flex-col items-center justify-center text-[#fdc003] bg-[#ffdf9e]/30 rounded-2xl px-5 py-2 active:scale-95 transition-transform duration-150 cursor-pointer text-xs font-bold gap-1"
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
            <span className="uppercase tracking-wider text-[9px] font-extrabold">Profile</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
