import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookingState } from '../types';

interface BenefitItem {
  title: string;
  description: string;
}

const PACKAGE_BENEFITS: Record<string, BenefitItem[]> = {
  basic: [
    {
      title: 'Exterior Express Wash',
      description: 'Pencucian bodi luar mobil secara merata dengan sampo berkualitas berformula pH seimbang.'
    },
    {
      title: 'Premium Microfiber Dry',
      description: 'Pengeringan bodi menggunakan kain microfiber berdaya serap tinggi untuk meminimalisir risiko goresan halus.'
    },
    {
      title: 'Standard Tire Dressing',
      description: 'Semir ban standar untuk mengembalikan rona hitam alami pada bagian ban kendaraan Anda.'
    },
    {
      title: 'Basic Dashboard Wipe',
      description: 'Penyekatan permukaan dasbor dan konsol tengah untuk membebaskan area mengemudi dari debu ringan.'
    }
  ],
  premium: [
    {
      title: 'Interior Deep Vacuuming',
      description: 'Pembersihan debu dan kotoran mendalam hingga ke sela-sela jok, karpet dasar, dan bagasi.'
    },
    {
      title: 'Premium Tire Wax Gloss',
      description: 'Semir ban premium impor yang menghasilkan efek wet-look kilau cemerlang dan perlindungan karet ban agar tahan lama.'
    },
    {
      title: 'Light Engine Bay Cleaning',
      description: 'Pembersihan debu dan residu kotoran ringan pada bagian permukaan atas ruang mesin agar tampak bersih kembali.'
    },
    {
      title: 'Glass Water Repellent Coating',
      description: 'Lapisan nano hidrofobik pelindung kaca dari efek jamur air (water-spot) agar pandangan tetap jernih saat hujan.'
    },
    {
      title: 'Liquid Soft Wax Polish',
      description: 'Penyemprotan wax cair berkualitas tinggi untuk proteksi ekstra bodi terhadap paparan sinar UV dan debu jalanan.'
    },
    {
      title: 'Under Carriage Quick Wash',
      description: 'Pembersihan kotoran di area bawah fender spakbor dan sasis samping untuk mencegah karat.'
    }
  ],
  detailing: [
    {
      title: 'Full Paint Claying & Decontamination',
      description: 'Proses pembersihan menggunakan clay bar khusus untuk melarutkan noda aspal, getah pohon, dan jamur pada permukaan cat sebelum dipoles.'
    },
    {
      title: 'Koreksi Cat & Single-Stage Buffing',
      description: 'Pemolesan bodi dengan mesin buffer profesional untuk mematikan baret halus (swirl marks) dan memulihkan kembali pancaran warna cat.'
    },
    {
      title: 'Hydrophobic Ceramic Spray Coating',
      description: 'Proteksi silika tingkat lanjut yang menghasilkan efek daun talas ekstrem, kilau murni berkristal, serta perlindungan super tahan lama.'
    },
    {
      title: 'Deep Interior Detailing & Sanitizing',
      description: 'Pembersihan menyeluruh noda (soiling) pada jok kain/kulit, karpet dasar, langit-langit mobil, serta fogging disinfeksi bakteri.'
    },
    {
      title: 'Engine Bay Detailing & Dressing',
      description: 'Pembersihan mendalam area blok mesin dengan cairan pembersih minyak khusus, disusul dressing khusus agar komponen plastik tak mengeras.'
    },
    {
      title: 'Under Carriage Deep Cleaning',
      description: 'Pembersihan kolong mobil secara menyeluruh menggunakan mesin tekanan tinggi untuk meluruhkan kerak semen, tanah, dan residu garam.'
    }
  ]
};

const PACKAGE_MEDIA: Record<string, { image: string; badge: string }> = {
  basic: {
    image: 'https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&q=80&w=800',
    badge: 'BASIC CHOICE'
  },
  premium: {
    image: 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&q=80&w=800',
    badge: 'PREMIUM CHOICE'
  },
  complete: {
    image: 'https://images.unsplash.com/photo-1552930294-6b595f4c2974?auto=format&fit=crop&q=80&w=800',
    badge: 'COMPLETE CHOICE'
  },
  detailing: {
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCzxBGFTa7OYfn3EHp5nuHsQjXZDglkBt-H93I3MZGeQMVOG5UvQ3V_0UMPXV50lJMhYM02nPXbLUmA7Y6gBlS_3UQid8efYvkrLbBc4F_rCOAFUUVWEbX5Qe2xnG19S6x7JAwr-TPQqu7nGmvxUB5Ux8NYguz0D6bJVbyQ9Omhcc_v-lfJ13Zqc6wfqgc_yTsQyjOL0eKWTxwQMtVK3xUy9LUfj44gZ2aUW6WjBHoeGGXL0dWqT-FHFJ9PxvoCR3tZXGGdXgEJjsZm',
    badge: 'ULTIMATE DETAIL'
  },
  engine: {
    image: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=800',
    badge: 'ENGINE SPECIFIC'
  }
};

interface ServiceDetailsViewProps {
  booking: BookingState;
  onUpdateBooking: (updated: Partial<BookingState>) => void;
  onNext: () => void;
  onBack: () => void;
  userAvatar?: string;
  userName?: string;
  packages: any[];
  viewOnly?: boolean;
}

export default function ServiceDetailsView({ booking, onUpdateBooking, onNext, onBack, userAvatar, userName, packages, viewOnly }: ServiceDetailsViewProps) {
  const [vehicleTypeFilter, setVehicleTypeFilter] = useState<'mobil' | 'motor'>(
    booking.vehicleType || 'mobil'
  );
  const targetType = vehicleTypeFilter === 'motor' ? 'roda_2' : 'roda_4';
  const filteredPackages = useMemo(() => {
    return packages.filter(p => p.vehicle_type === targetType || p.vehicle_type === 'all');
  }, [packages, targetType]);

  const packagesList = useMemo(() => {
    return filteredPackages.map((p: any) => {
      let keyId = 'premium';
      if (p.name.toLowerCase().includes('basic')) keyId = 'basic';
      else if (p.name.toLowerCase().includes('detail')) keyId = 'detailing';
      else if (p.name.toLowerCase().includes('complete')) keyId = 'complete';
      else if (p.name.toLowerCase().includes('engine')) keyId = 'engine';

      return {
        id: String(p.id),
        keyId: keyId,
        name: p.name,
        description: p.description || 'Layanan pembersihan bodi',
        price: Number(p.price),
        priceLabel: `Rp ${Number(p.price).toLocaleString('id-ID')}`,
        isBestSeller: p.sort_order === 2,
        durationMinutes: p.duration_minutes || 45
      };
    });
  }, [filteredPackages]);

  const [selectedPkgId, setSelectedPkgId] = useState<string>(() => {
    const initialPkg = packagesList.find(p => p.id === String(booking.selectedPackageId) || p.keyId === booking.selectedPackageId || p.keyId.startsWith(booking.selectedPackageId)) || packagesList[0] || { id: '1', keyId: 'premium' };
    return initialPkg.id;
  });

  useEffect(() => {
    if (packagesList.length > 0 && !packagesList.some(p => p.id === selectedPkgId)) {
      setSelectedPkgId(packagesList[0].id);
    }
  }, [packagesList, selectedPkgId]);

  const [showAllBenefits, setShowAllBenefits] = useState<boolean>(false);

  const selectedPkg = packagesList.find(p => p.id === selectedPkgId) || packagesList[0] || { id: '1', keyId: 'premium', name: 'Premium Wash', price: 120000, description: 'Layanan pembersihan bodi', priceLabel: 'Rp 120.000', durationMinutes: 45 };
  const media = PACKAGE_MEDIA[selectedPkg.keyId] || PACKAGE_MEDIA['premium'];
  const baseBenefitKey = selectedPkg.keyId.includes('basic') ? 'basic' : selectedPkg.keyId.includes('detailing') ? 'detailing' : 'premium';
  const activeBenefits = PACKAGE_BENEFITS[baseBenefitKey] || PACKAGE_BENEFITS['premium'];
  const displayedBenefits = showAllBenefits ? activeBenefits : activeBenefits.slice(0, 4);

  const handleNext = () => {
    const updates: Partial<BookingState> = {
      selectedPackageId: selectedPkgId,
      vehicleType: vehicleTypeFilter
    };
    if (selectedPkg.keyId !== 'detailing') {
      updates.appliedPromoCode = null;
    }
    onUpdateBooking(updates);
    onNext();
  };

  return (
    <div className={`bg-[#faf9fb] min-h-screen text-[#1b1c1e] font-sans ${viewOnly ? 'pb-10' : 'pb-32'}`}>
      {/* Top Navbar */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-[#efedf0] shadow-sm">
        <div className="flex justify-between items-center w-full px-5 py-3 max-w-screen-xl mx-auto">
          <div className="flex items-center gap-3">
            <button 
              onClick={onBack}
              className="flex items-center justify-center p-2 rounded-xl bg-slate-100 text-[#000f22] cursor-pointer hover:bg-slate-200"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <h1 className="font-extrabold text-lg tracking-tight text-[#0a2540]">Clean Vehicle</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[#0a2540] cursor-pointer">share</span>
            <div className="w-8 h-8 rounded-full overflow-hidden border">
              <img 
                alt="User" 
                src={userAvatar || "https://lh3.googleusercontent.com/aida-public/AB6AXuD90iPn_p56sjSnZ0vwHyoBd07vLcuHPcArqDh3m0ku8XqdOGUw9z_TbF0kT98dV1a53CTJkoeIOLRvq7aGrNfLNNFB-zx15LDNCyiCYN_0Id64yu7zV3LnE0DNHCcnbGzTmpBXjNyLLOfVftyfkZh3rJmcIU-SzCnCriVti9GeG2LKndKXQ49v6J9VZP9MevH_EuxpjkmxOgfXDYAYFZHWmQ--x3CTM_hrjQwmK53ZULDCtkRwPH1sU4e9eGMSaXQYmKPJkzj9q_17"} 
                onError={(e) => {
                  e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(userName || 'User')}&background=1B2337&color=F0C419`;
                }}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-screen-md mx-auto">
        {/* Hero Section Container */}
        <section className="relative h-[360px] w-full overflow-hidden shadow-md bg-black">
          <AnimatePresence mode="wait">
            <motion.img 
              key={selectedPkgId}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.35, ease: 'easeInOut' }}
              className="w-full h-full object-cover" 
              src={media.image}
              alt={selectedPkg.name}
            />
          </AnimatePresence>
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-6 z-10">
            <motion.div 
              key={`badge-${selectedPkgId}`}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="flex items-center gap-2 mb-2"
            >
              <span className="bg-[#fdc003] text-[#6c5000] px-3 py-1 rounded-full font-bold text-[10px] uppercase tracking-wider">
                {media.badge}
              </span>
            </motion.div>
            <motion.h2 
              key={`title-${selectedPkgId}`}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.05 }}
              className="text-[28px] font-black leading-tight text-white tracking-tight"
            >
              {selectedPkg.name}
            </motion.h2>
          </div>
        </section>

        {/* Content Layout Inner Section */}
        <div className="px-5 -mt-6 relative z-10">
          
          {/* Quick Stats Panel block */}
          <section className="bg-white rounded-2xl p-4 shadow-lg flex justify-center items-center mb-6 border border-[#efedf0]">
            <div className="flex flex-col items-center">
              <span className="material-symbols-outlined text-[#785900] mb-1">timer</span>
              <span className="text-[10px] uppercase text-[#74777e] font-extrabold tracking-wide">DURATION</span>
              <span className="font-extrabold text-sm text-[#000f22] mt-0.5">{selectedPkg.durationMinutes} Menit</span>
            </div>
          </section>

          {/* Service Location Card removed to keep page focused on package details */}

          {/* Vehicle Type Filter Section */}
          <section className="mb-6">
            <h3 className="text-sm font-black text-[#74777e] uppercase tracking-wider mb-3 ml-1">Kategori Kendaraan</h3>
            <div className="grid grid-cols-2 gap-4">
              <button 
                type="button"
                onClick={() => {
                  setVehicleTypeFilter('mobil');
                  onUpdateBooking({ vehicleType: 'mobil' });
                }}
                className={`flex items-center gap-4 p-4 rounded-2xl shadow-sm border transition-all cursor-pointer ${
                  vehicleTypeFilter === 'mobil' 
                    ? 'bg-white border-[#fdc003] ring-1 ring-[#fdc003]' 
                    : 'bg-white border-transparent hover:bg-slate-50'
                }`}
              >
                <div className="h-10 w-10 bg-[#ffdf9e]/30 rounded-full flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[#785900] text-2xl">directions_car</span>
                </div>
                <span className="font-extrabold text-sm text-[#000f22]">Mobil</span>
              </button>

              <button 
                type="button"
                onClick={() => {
                  setVehicleTypeFilter('motor');
                  onUpdateBooking({ vehicleType: 'motor' });
                }}
                className={`flex items-center gap-4 p-4 rounded-2xl shadow-sm border transition-all cursor-pointer ${
                  vehicleTypeFilter === 'motor' 
                    ? 'bg-white border-[#fdc003] ring-1 ring-[#fdc003]' 
                    : 'bg-white border-transparent hover:bg-slate-50'
                }`}
              >
                <div className="h-10 w-10 bg-[#ffdf9e]/30 rounded-full flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[#785900] text-2xl">motorcycle</span>
                </div>
                <span className="font-extrabold text-sm text-[#000f22]">Motor</span>
              </button>
            </div>
          </section>

          {/* Package Selection Lists */}
          <section className="mb-6">
            <h3 className="text-base font-bold text-[#000f22] mb-3">Pilih Paket Layanan</h3>
            <div className="grid grid-cols-1 gap-3">
              
              {packagesList.map(pkg => {
                const isActive = selectedPkgId === pkg.id;
                return (
                  <label 
                    key={pkg.id} 
                    onClick={() => {
                      setSelectedPkgId(pkg.id);
                      setShowAllBenefits(false);
                    }}
                    className={`relative flex items-center p-4 rounded-xl border-2 transition-all cursor-pointer ${
                      isActive 
                        ? 'border-[#fdc003] bg-white shadow-md' 
                        : 'border-transparent bg-[#f5f3f6] hover:bg-[#e9e8ea]'
                    }`}
                  >
                    <input className="hidden" name="service-package" type="radio" checked={isActive} readOnly />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-[#000f22]">{pkg.name}</span>
                        {pkg.isBestSeller && (
                          <span className="bg-[#0a2540] text-white text-[8px] px-2 py-0.5 rounded-full font-extrabold tracking-widest uppercase">
                            BEST SELLER
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-[#43474d] mt-1 block">{pkg.description}</span>
                    </div>
                    <div className="text-right">
                      <span className={`text-base font-bold ${isActive ? 'text-[#785900]' : 'text-[#000f22]'}`}>
                        {pkg.priceLabel}
                      </span>
                    </div>
                  </label>
                );
              })}

            </div>
          </section>

          {/* What's Included details checklist */}
          <section className="mb-10">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-base font-bold text-[#000f22]">Apa yang didapat?</h3>
              <span className="text-xs font-bold uppercase text-[#785900] tracking-wider">
                {activeBenefits.length} ITEMS
              </span>
            </div>
            
            <div className="bg-white rounded-xl overflow-hidden shadow-md border border-[#efedf0]">
              <div className="divide-y divide-[#efedf0]">
                {displayedBenefits.map((benefit, idx) => (
                  <div key={idx} className="p-4 flex items-start gap-4 animate-fade-in">
                    <span className="material-symbols-outlined text-[#fdc003] mt-0.5 shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
                      check_circle
                    </span>
                    <div>
                      <h4 className="font-bold text-xs text-[#000f22]">{benefit.title}</h4>
                      <p className="text-xs text-[#43474d] mt-1 leading-normal">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {activeBenefits.length > 4 && (
                <button 
                  type="button"
                  onClick={() => setShowAllBenefits(!showAllBenefits)}
                  className="w-full py-4 bg-[#f5f3f6] hover:bg-[#e9e8ea] text-[#000f22] font-bold text-xs uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <span>{showAllBenefits ? 'Sembunyikan' : 'Lihat Selengkapnya'}</span>
                  <span className={`material-symbols-outlined text-[16px] transition-transform duration-300 ${showAllBenefits ? 'rotate-180' : ''}`}>
                    expand_more
                  </span>
                </button>
              )}
            </div>
          </section>

        </div>
      </main>

      {/* Sticky Bottom Action Action Payment Bar */}
      {!viewOnly && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-[#efedf0] p-5 z-50 shadow-lg">
          <div className="max-w-md mx-auto flex gap-4 items-center">
            <div className="flex-1">
              <span className="text-[10px] font-bold text-[#74777e] uppercase tracking-wider">TOTAL PEMBAYARAN</span>
              <p className="text-2xl font-black text-[#000f22] tracking-tight">
                Rp {selectedPkg.price.toLocaleString('id-ID')}
              </p>
            </div>
            <button 
              onClick={handleNext}
              className="bg-[#fdc003] hover:bg-[#fabd00] text-[#6c5000] px-8 py-4 rounded-xl font-bold text-sm shadow-md active:scale-95 transition-transform cursor-pointer uppercase tracking-wider"
            >
              Pesan Sekarang
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
