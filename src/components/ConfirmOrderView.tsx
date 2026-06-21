import React, { useState } from 'react';
import { motion } from 'motion/react';
import { BookingState, Car } from '../types';
import api, { getStorageUrl } from '../services/api';
import LocationModal from './LocationModal';


interface ConfirmOrderViewProps {
  booking: BookingState;
  onUpdateBooking: (updated: Partial<BookingState>) => void;
  onNext: () => void;
  onBack: () => void;
  userAvatar?: string;
  userName?: string;
  technicians: any[];
  packages: any[];
  onSaveLocation: (locationName: string, pickupLocation: string, lat?: number, lon?: number) => void;
  cars: Car[];
  promos: any[];
  transactions: any[];
}

export default function ConfirmOrderView({ booking, onUpdateBooking, onNext, onBack, userAvatar, userName, technicians, packages, onSaveLocation, cars, promos = [], transactions = [] }: ConfirmOrderViewProps) {
  const [showLocationModal, setShowLocationModal] = useState(false);

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

  const selectedTech = technicians.map((t: any) => ({
    id: String(t.id),
    name: t.name,
    rating: Number(t.rating || 4.5),
    reviewsCount: t.total_orders || 120,
    avatar: getStorageUrl(t.avatar || t.profile_photo) || `https://ui-avatars.com/api/?name=${encodeURIComponent(t.name)}&background=1B2337&color=F0C419`
  })).find(t => String(t.id) === String(booking.selectedTechnicianId))
  || { name: 'Kru Clean Vehicle', rating: 4.8, avatar: 'https://ui-avatars.com/api/?name=Clean+Vehicle' };

  const selectedCar = (cars || []).find(c => String(c.id) === String(booking.selectedCarId));

  const priceVal = Number(selectedPkg.price || 0);

  // Dynamic Promo Validation and Discount Calculation
  const appliedPromo = promos.find(p => p.code.toUpperCase() === (booking.appliedPromoCode || '').toUpperCase());
  
  let promoError = '';
  let discountVal = 0;

  if (booking.appliedPromoCode) {
    if (!appliedPromo) {
      promoError = 'Kode promo tidak terdaftar.';
    } else {
      const now = new Date();
      if (appliedPromo.starts_at && new Date(appliedPromo.starts_at) > now) {
        promoError = 'Promo belum dimulai.';
      } else if (appliedPromo.expires_at && new Date(appliedPromo.expires_at) < now) {
        promoError = 'Promo sudah kedaluwarsa.';
      }
      else if (appliedPromo.min_transaction && priceVal < Number(appliedPromo.min_transaction)) {
        promoError = `Minimal transaksi untuk promo ini adalah Rp ${Number(appliedPromo.min_transaction).toLocaleString('id-ID')}`;
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
          promoError = 'Anda sudah mengklaim promo ini.';
        }
        else if (isNewCustomerPromo && hasPastOrders) {
          promoError = 'Promo ini khusus untuk pemesanan pertama (pelanggan baru).';
        }
        else if (appliedPromo.max_usage && appliedPromo.used_count >= appliedPromo.max_usage) {
          promoError = 'Kuota penggunaan promo ini telah habis.';
        }
        else if (appliedPromo.code === 'FIRST30' && !selectedPkg.name.toLowerCase().includes('detail')) {
          promoError = 'Promo FIRST30 hanya berlaku untuk paket Detailing.';
        }
      }

      if (!promoError) {
        if (appliedPromo.type === 'percentage') {
          discountVal = Math.round(priceVal * Number(appliedPromo.value) / 100);
          if (appliedPromo.max_discount && discountVal > Number(appliedPromo.max_discount)) {
            discountVal = Number(appliedPromo.max_discount);
          }
        } else {
          discountVal = Number(appliedPromo.value);
        }
        discountVal = Math.min(discountVal, priceVal);
      }
    }
  }

  const platformFee = 5000;
  const totalCost = priceVal - discountVal + platformFee;

  return (
    <div className="bg-[#faf9fb] min-h-screen text-[#1b1c1e] pb-32">
      {/* Top Header App Bar */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-[#efedf0] shadow-sm">
        <div className="flex justify-between items-center w-full px-5 py-3 max-w-screen-xl mx-auto">
          <div className="flex items-center gap-3">
            <button 
              onClick={onBack}
              className="flex items-center justify-center p-2 rounded-xl bg-slate-100 text-[#000f22] cursor-pointer hover:bg-slate-200"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <span className="material-symbols-outlined text-[#785900]">location_on</span>
            <span className="font-bold text-lg tracking-tight text-[#0a2540]">Clean Vehicle</span>
          </div>

        </div>
      </header>

      <main className="max-w-md mx-auto px-5 pt-6 flex flex-col gap-6">
        
        {/* Intent Header */}
        <section>
          <h2 className="text-xl font-bold text-[#000f22] mb-1.5">Pemesanan Layanan</h2>
          <p className="text-xs text-[#43474d] leading-normal">
            Atur jadwal pembersihan kendaraan Anda dengan mudah.
          </p>
        </section>

        {/* Pick-up location maps panel */}
        <section className="flex flex-col gap-2">
          <div className="flex justify-between items-center px-1">
            <label className="text-[10px] font-bold text-[#43474d] uppercase tracking-wider">LOKASI PENJEMPUTAN</label>
            <button 
              type="button"
              onClick={() => setShowLocationModal(true)}
              className="text-[#785900] text-xs font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[14px]">edit</span> Ubah Lokasi
            </button>
          </div>
          <div 
            onClick={() => setShowLocationModal(true)}
            className="relative w-full h-48 rounded-2xl overflow-hidden shadow-sm border border-slate-105 cursor-pointer group active:opacity-95 transition-all"
            title="Klik untuk mengubah lokasi"
          >
            <img 
              alt="Custom location map" 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAoT_bi4TGBil9L4lh9pXrca55hxJkhF6TWz1yoWGmPNO80rkvXA4cGaKOc4wKgMpU4jo_9C-bDZUV96ZKfokNHkybGeo92nETzCi2WAQnIzSPRWWPBt4Perokyh5qhUh5nW-bVV_SRmSbC2pi_caOvTTifLidYzmwXDjvwnOIFmeWUw6QDGMiGFbPvTqNczbYsZEOMIkIX5kUMkWUdaflLMk3mZBE4d3O133qttLN0fO7Rqz0H7wsBPTl2zG9QyQqKEKDGxj3jJzOG"
            />
            <div className="absolute inset-x-4 bottom-4 bg-white/95 backdrop-blur-md p-3 rounded-xl shadow-lg flex items-center justify-between gap-2 border border-amber-100">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <span className="material-symbols-outlined text-[#785900] shrink-0 animate-pulse text-[18px]">my_location</span>
                <div className="min-w-0 flex-1">
                  <span className="text-[8px] text-[#74777e] font-extrabold uppercase tracking-wide block">Wilayah: {booking.locationName || 'Jakarta Selatan'}</span>
                  <span className="text-xs font-bold text-[#000f22] block truncate">
                    {booking.pickupLocation || 'Sudirman Central Business District, Jakarta'}
                  </span>
                </div>
              </div>
              <span className="material-symbols-outlined text-[#785900] shrink-0 text-sm font-bold bg-[#ffdf9e]/30 p-1.5 rounded-lg">edit</span>
            </div>
          </div>
        </section>

        {/* Date and Time Selector previewers */}
        <section className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-[#43474d] uppercase tracking-wider ml-1">Tanggal</label>
            <div className="flex items-center bg-white border border-[#c4c6ce] rounded-xl px-4 py-3 shadow-sm">
              <span className="material-symbols-outlined text-[#43474d] mr-3 text-lg">calendar_today</span>
              <span className="text-xs font-bold text-[#000f22]">{booking.selectedDate?.length > 4 ? booking.selectedDate : `${booking.selectedDate || '18'} Sept 2023`}</span>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-[#43474d] uppercase tracking-wider ml-1">Waktu</label>
            <div className="flex items-center bg-white border border-[#c4c6ce] rounded-xl px-4 py-3 shadow-sm">
              <span className="material-symbols-outlined text-[#43474d] mr-3 text-lg">schedule</span>
              <span className="text-xs font-bold text-[#000f22]">{booking.selectedTime || '09:00'} WIB</span>
            </div>
          </div>
        </section>

        {/* Vehicle summary row */}
        <section className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-[#43474d] uppercase tracking-wider ml-1">Kendaraan Terpilih</label>
          <div className="bg-white rounded-xl p-4 border border-[#efedf0] flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#ffdf9e]/30 flex items-center justify-center text-[#785900]">
                <span className="material-symbols-outlined">
                  {booking.vehicleType === 'motor' ? 'motorcycle' : 'directions_car'}
                </span>
              </div>
              <div>
                <p className="text-xs font-bold text-[#000f22]">
                  {selectedCar ? selectedCar.name : (booking.vehicleType === 'motor' ? 'Motor' : 'Mobil')}
                </p>
                <p className="text-[10px] text-[#74777e]">
                  {selectedCar ? selectedCar.plate : '-'} • {booking.vehicleType === 'motor' ? 'Roda 2' : 'Roda 4'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Technician info row */}
        <section className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold text-[#43474d] uppercase tracking-wider ml-1">Kru / Teknisi</label>
          <div className="bg-white rounded-xl p-4 border border-[#efedf0] flex items-center gap-3 shadow-sm">
            <img 
              className="w-10 h-10 rounded-lg object-cover" 
              src={selectedTech.avatar} 
              alt="Tech" 
              onError={(e) => {
                e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(selectedTech.name)}&background=1B2337&color=F0C419`;
              }}
            />
            <div>
              <p className="text-xs font-bold text-[#000f22]">{selectedTech.name}</p>
              <p className="text-[10px] text-[#74777e]">{selectedTech.rating} Rating • Specialist</p>
            </div>
          </div>
        </section>

        {/* Promo Code Selection & Applied Card */}
        <section className="bg-white rounded-2xl p-4 shadow-sm border border-[#efedf0] flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-[#000f22] uppercase tracking-wider">Promo & Voucher</h4>
            <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded">VOUCHER</span>
          </div>

          {booking.appliedPromoCode ? (
            <div className={`p-3 rounded-xl border flex flex-col gap-2 ${promoError ? 'bg-red-50 border-red-200' : 'bg-emerald-50/70 border-emerald-200'}`}>
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${promoError ? 'bg-red-100 text-red-650 animate-pulse' : 'bg-emerald-100 text-emerald-700'}`}>
                    <span className="material-symbols-outlined text-lg">{promoError ? 'warning' : 'confirmation_number'}</span>
                  </div>
                  <div>
                    <span className="text-xs font-black text-[#000f22] uppercase tracking-wide">{booking.appliedPromoCode}</span>
                    <p className="text-[10px] text-slate-500 font-semibold">{appliedPromo?.name || 'Kode promo terpasang'}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onUpdateBooking({ appliedPromoCode: null })}
                  className="text-xs font-extrabold text-red-600 hover:text-red-750 cursor-pointer active:scale-95 transition-all"
                >
                  Batal
                </button>
              </div>

              {promoError ? (
                <p className="text-[10px] text-red-600 font-bold leading-normal">{promoError}</p>
              ) : (
                <p className="text-[10px] text-emerald-750 font-bold leading-normal">
                  Promo berhasil dipasang! Anda hemat Rp {discountVal.toLocaleString('id-ID')}.
                </p>
              )}
            </div>
          ) : (
            <div>
              {promos.length === 0 ? (
                <p className="text-[11px] text-slate-400 font-medium text-center py-2">Tidak ada promo aktif tersedia saat ini.</p>
              ) : (
                <>
                  <p className="text-[11px] text-slate-500 font-semibold mb-2.5">Pilih promo yang tersedia untuk mendapatkan diskon tambahan:</p>
                  <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1 no-scrollbar">
                    {promos.map((promo: any) => {
                      const userUsageCount = (transactions || []).filter(t => t.promoCode === promo.code && t.status !== 'Dibatalkan').length;
                      const maxUsagePerUser = promo.max_usage_per_user ?? 1;
                      const hasExceededUserLimit = userUsageCount >= maxUsagePerUser;

                      const isNewCustomerPromo = promo.code.includes('FIRST') || 
                                                 (promo.description && (
                                                   promo.description.toLowerCase().includes('baru') || 
                                                   promo.description.toLowerCase().includes('pertama')
                                                 ));
                      const hasPastOrders = (transactions || []).some(t => t.status !== 'Dibatalkan');
                      const isUserNewCustomer = !hasPastOrders;
                      const isEligible = !isNewCustomerPromo || isUserNewCustomer;
                      const isUnderMin = promo.min_transaction && priceVal < Number(promo.min_transaction);
                      const isUsedMax = promo.max_usage && promo.used_count >= promo.max_usage;

                      const isSelectable = isEligible && !isUnderMin && !isUsedMax && !hasExceededUserLimit;

                      return (
                        <button
                          key={promo.id}
                          type="button"
                          disabled={!isSelectable}
                          onClick={() => {
                            onUpdateBooking({ appliedPromoCode: promo.code });
                          }}
                          className={`w-full p-3 rounded-xl border text-left flex items-center justify-between gap-3 transition-all ${
                            isSelectable
                              ? 'border-[#efedf0] bg-slate-50 hover:bg-slate-100 hover:shadow-sm cursor-pointer'
                              : 'border-slate-100 bg-slate-50/30 opacity-50 cursor-not-allowed'
                          }`}
                        >
                          <div className="min-w-0 flex-1 flex items-center gap-2">
                            <span className="material-symbols-outlined text-slate-400 text-lg">local_offer</span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[9px] font-black text-slate-700 bg-slate-200 px-1.5 py-0.5 rounded">{promo.code}</span>
                                {!isEligible && <span className="text-[8px] font-black text-red-655 bg-red-50 px-1 py-0.5 rounded">Pelanggan Baru</span>}
                                {hasExceededUserLimit && <span className="text-[8px] font-black text-red-655 bg-red-50 px-1 py-0.5 rounded">Sudah Diklaim</span>}
                                {isUnderMin && <span className="text-[8px] font-black text-amber-700 bg-amber-50 px-1 py-0.5 rounded">Min. Transaksi</span>}
                              </div>
                              <p className="text-[11px] font-bold text-[#000f22] mt-1 truncate">{promo.name}</p>
                              <p className="text-[9px] text-slate-450 font-semibold truncate">{promo.description}</p>
                            </div>
                          </div>
                          <span className="material-symbols-outlined text-slate-400 text-sm font-black shrink-0">chevron_right</span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}
        </section>

        {/* Order Bill Summary */}
        <section className="bg-white rounded-2xl p-5 shadow-lg border border-[#f5f3f6]">
          <h3 className="text-sm font-bold text-[#000f22] mb-4">Ringkasan Pesanan</h3>
          <div className="space-y-3 mb-5 text-xs">
            
            <div className="flex justify-between items-center">
              <span className="text-[#43474d]">Service Type</span>
              <span className="font-extrabold text-[#000f22] px-3 py-1 bg-[#d2e4ff]/50 rounded-full text-[10px] uppercase">
                {selectedPkg.name.toUpperCase()} WASH
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-[#43474d]">Price</span>
              <span className="font-extrabold text-[#000f22]">Rp {priceVal.toLocaleString('id-ID')}</span>
            </div>

            {discountVal > 0 && (
              <div className="flex justify-between items-center text-emerald-650 font-bold">
                <span>Diskon Promo ({booking.appliedPromoCode})</span>
                <span>-Rp {discountVal.toLocaleString('id-ID')}</span>
              </div>
            )}

            <div className="flex justify-between items-center">
              <span className="text-[#43474d]">Platform Fee</span>
              <span className="font-extrabold text-[#000f22]">Rp {platformFee.toLocaleString('id-ID')}</span>
            </div>

          </div>

          <div className="pt-4 border-t border-dashed border-[#c4c6ce] flex justify-between items-center">
            <span className="font-bold text-sm text-[#000f22]">Total Cost</span>
            <span className="text-lg font-black text-[#785900]">Rp {totalCost.toLocaleString('id-ID')}</span>
          </div>
        </section>

        {/* CTA Acceptance trigger */}
        <section className="pt-2">
          <motion.button 
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              if (promoError) {
                alert(`Promo tidak valid: ${promoError}. Silakan batalkan atau ganti promo terlebih dahulu.`);
                return;
              }
              onNext();
            }}
            className="w-full bg-[#fdc003] hover:bg-[#fabd00] text-[#6c5000] py-4 rounded-xl font-bold shadow-md hover:brightness-105 active:scale-95 transition-all text-center flex items-center justify-center gap-2 cursor-pointer"
          >
            Konfirmasi Pesanan
            <span className="material-symbols-outlined">arrow_forward</span>
          </motion.button>
          
          <p className="text-center text-[10px] text-[#74777e] mt-3 px-4 leading-normal">
            Dengan menekan tombol di atas, Anda menyetujui seluruh syarat dan ketentuan jasa kami.
          </p>
        </section>

      </main>

      <LocationModal
        isOpen={showLocationModal}
        onClose={() => setShowLocationModal(false)}
        initialLocationName={booking.locationName}
        initialPickupLocation={booking.pickupLocation}
        onSave={onSaveLocation}
      />
    </div>
  );
}
