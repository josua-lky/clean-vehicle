import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { BookingState, Car } from '../types';
import api, { getStorageUrl } from '../services/api';
import LocationModal from './LocationModal';


interface BookingViewProps {
  booking: BookingState;
  onUpdateBooking: (updated: Partial<BookingState>) => void;
  onNext: () => void;
  onBack: () => void;
  userAvatar?: string;
  userName?: string;
  outlets: any[];
  technicians: any[];
  onSaveLocation: (locationName: string, pickupLocation: string, lat?: number, lon?: number) => void;
  cars: Car[];
}

export default function BookingView({ booking, onUpdateBooking, onNext, onBack, userAvatar, userName, outlets, technicians, onSaveLocation, cars }: BookingViewProps) {
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [washType, setWashType] = useState<'rumah' | 'tempat'>(
    booking.pickupLocation.toLowerCase().includes('outlet') ? 'tempat' : 'rumah'
  );

  const matchingCars = useMemo(() => {
    return (cars || []).filter(c => c.type === booking.vehicleType);
  }, [cars, booking.vehicleType]);

  const [selectedCar, setSelectedCar] = useState<string>(() => {
    if (booking.selectedCarId) {
      const exists = matchingCars.some(c => c.id === booking.selectedCarId);
      if (exists) return booking.selectedCarId;
    }
    return matchingCars[0]?.id || '';
  });

  useEffect(() => {
    const exists = matchingCars.some(c => c.id === selectedCar);
    if (!exists) {
      setSelectedCar(matchingCars[0]?.id || '');
    }
  }, [matchingCars, selectedCar]);

  const mappedOutlets = useMemo(() => {
    return outlets.map((o: any) => ({
      id: String(o.id),
      name: o.name,
      address: o.address,
      rating: Number(o.rating || 4.5),
      reviewsCount: Math.floor(Math.random() * 50) + 60,
      status: `Buka • ${o.open_time.substring(0, 5)} - ${o.close_time.substring(0, 5)}`,
      distance: `${(Math.random() * 5 + 1).toFixed(1)} km`,
      image: o.photo || (o.name.includes('Pusat') 
        ? 'https://images.unsplash.com/photo-1520340356584-f9917d1eea6f?auto=format&fit=crop&q=80&w=256'
        : o.name.includes('Bekasi')
          ? 'https://images.unsplash.com/photo-1605152276897-4f618f7323a4?auto=format&fit=crop&q=80&w=256'
          : 'https://images.unsplash.com/photo-1552930294-6b595f4c2974?auto=format&fit=crop&q=80&w=256'),
      features: o.name.includes('Pusat') 
        ? ['CUCI EKSPRES', 'COATING', 'RUANG TUNGGU AC'] 
        : ['DETAILING', 'WAX KILAT', 'LIFT HIDROLIK']
    }));
  }, [outlets]);

  const [selectedOutletId, setSelectedOutletId] = useState<string>(() => {
    const matching = mappedOutlets.find(o => o.address === booking.pickupLocation);
    if (matching) return matching.id;
    return washType === 'tempat' ? '' : (mappedOutlets[0]?.id || '');
  });

  const mappedTechs = useMemo(() => {
    return technicians.map((t: any) => ({
      id: String(t.id),
      name: t.name,
      rating: Number(t.rating || 4.5),
      reviewsCount: t.total_orders || 120,
      avatar: getStorageUrl(t.avatar || t.profile_photo) || `https://ui-avatars.com/api/?name=${encodeURIComponent(t.name)}&background=1B2337&color=F0C419`,
      specialties: t.specialization ? [t.specialization === 'motor' ? 'Motor' : 'Mobil', t.area || 'All Rounder'] : ['Pembersihan', 'Detil Luar'],
      specialization: t.specialization,
      outletId: t.outlet_id ? String(t.outlet_id) : null,
      status: t.status === 'active' ? 'Tersedia' : 'Sibuk',
      rawBookings: t.bookings || []
    }));
  }, [technicians]);

  const [selectedTech, setSelectedTech] = useState<string>(booking.selectedTechnicianId || '');

  const filteredTechs = useMemo(() => {
    const vType = (booking.vehicleType || '').toLowerCase().trim();
    return mappedTechs.filter(tech => {
      const spec = (tech.specialization || '').toLowerCase().trim();
      const normalizedSpec = spec === 'roda_2' ? 'motor' : (spec === 'roda_4' ? 'mobil' : spec);
      const normalizedVType = vType === 'roda_2' ? 'motor' : (vType === 'roda_4' ? 'mobil' : vType);
      const matchesSpec = normalizedSpec === normalizedVType;

      if (washType === 'tempat') {
        const matchesOutlet = tech.outletId === selectedOutletId;
        return matchesSpec && matchesOutlet;
      }
      return matchesSpec;
    });
  }, [mappedTechs, booking.vehicleType, washType, selectedOutletId]);



  const [isTechExpanded, setIsTechExpanded] = useState<boolean>(false);
  const displayedTechs = isTechExpanded ? filteredTechs : filteredTechs.slice(0, 3);

  






  // Generate date options dynamically
  const dateOptions = useMemo(() => {
    const daysAbbrIndo = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const monthsIndo = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    
    const allTimesToCheck = ['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'];
    const options = [];
    const nowObj = new Date();
    const curHour = nowObj.getHours();
    const curMin = nowObj.getMinutes();
    
    for (let i = 0; i < 4; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      
      const dayIndex = d.getDay();
      const dateNum = d.getDate();
      const monthIndex = d.getMonth();
      const year = d.getFullYear();
      
      const idStr = `${dateNum} ${monthsIndo[monthIndex]} ${year}`;
      
      let isDisabled = false;
      if (i === 0) {
        // Check if there are any slots left today
        const futureSlots = allTimesToCheck.filter(t => {
          const [sh, sm] = t.split(':').map(Number);
          return sh > curHour || (sh === curHour && sm > curMin);
        });
        if (futureSlots.length === 0) {
          isDisabled = true;
        }
      }
      
      options.push({
        id: idStr,
        dayAbbr: daysAbbrIndo[dayIndex],
        dateNumber: String(dateNum),
        monthYear: `${monthsIndo[monthIndex]} ${year}`,
        monthName: monthsIndo[monthIndex],
        isToday: i === 0,
        isDisabled,
        rawDate: d
      });
    }
    return options;
  }, []);

  const [selectedDate, setSelectedDate] = useState<string>(() => {
    if (booking.selectedDate && booking.selectedDate !== '2026-06-18') {
      const exists = dateOptions.some(o => o.id === booking.selectedDate);
      if (exists) return booking.selectedDate;
    }
    return '';
  });

  const baseTimes = useMemo(() => ['09:00', '11:00', '14:00', '16:00'], []);
  const extraTimes = useMemo(() => ['07:00', '08:00', '10:00', '12:00', '13:00', '15:00', '17:00', '18:00', '19:00', '20:00'], []);
  const allTimes = useMemo(() => [...baseTimes, ...extraTimes].sort((a, b) => a.localeCompare(b)), [baseTimes, extraTimes]);

  const getFilteredTimes = (timesArray: string[], targetDateStr: string) => {
    const isSelectedDateToday = dateOptions.find(o => o.id === targetDateStr)?.isToday;
    if (!isSelectedDateToday) {
      return timesArray;
    }
    
    const nowObj = new Date();
    const curHour = nowObj.getHours();
    const curMin = nowObj.getMinutes();
    
    return timesArray.filter(t => {
      const [sh, sm] = t.split(':').map(Number);
      return sh > curHour || (sh === curHour && sm > curMin);
    });
  };

  const filteredBaseTimes = useMemo(() => getFilteredTimes(baseTimes, selectedDate), [selectedDate, dateOptions, baseTimes]);
  const filteredAllTimes = useMemo(() => getFilteredTimes(allTimes, selectedDate), [selectedDate, dateOptions, allTimes]);

  const [isTimeExpanded, setIsTimeExpanded] = useState<boolean>(false);
  const displayedTimes = isTimeExpanded ? filteredAllTimes : filteredBaseTimes;

  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>(booking.selectedTime || '');

  const isTechBusyAtSelectedTime = (techBookings: any[]) => {
    if (!selectedDate || !selectedTimeSlot) return false;
    try {
      const monthsIndo = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ];
      const parts = selectedDate.split(' ');
      if (parts.length === 3) {
        const day = parseInt(parts[0], 10);
        const monthName = parts[1];
        const year = parseInt(parts[2], 10);
        const monthIndex = monthsIndo.indexOf(monthName);
        if (monthIndex !== -1) {
          const [hour, minute] = selectedTimeSlot.split(':').map(Number);
          const targetDateObj = new Date(year, monthIndex, day, hour, minute, 0, 0);
          const targetTime = targetDateObj.getTime();

          return (techBookings || []).some((b: any) => {
            const bookingDateObj = new Date(b.scheduled_at);
            bookingDateObj.setSeconds(0, 0);
            bookingDateObj.setMilliseconds(0);
            return bookingDateObj.getTime() === targetTime;
          });
        }
      }
    } catch (e) {
      console.error('Error parsing selected date:', e);
    }
    return false;
  };

  useEffect(() => {
    const availableTechs = filteredTechs.filter(tech => !isTechBusyAtSelectedTime(tech.rawBookings));
    if (selectedTech) {
      const isSelectedTechAvailable = availableTechs.some(tech => tech.id === selectedTech);
      if (!isSelectedTechAvailable) {
        setSelectedTech(availableTechs[0]?.id || '');
      }
    } else if (availableTechs.length > 0) {
      setSelectedTech(availableTechs[0]?.id || '');
    }
  }, [filteredTechs, selectedTech, selectedDate, selectedTimeSlot]);

  const [packages, setPackages]
  = useState<any[]>([]);

  const fetchPackages = async () => {

    try {
  
      const response =
        await api.get('/packages');
  
      setPackages(
        response.data
      );
  
    } catch (error) {
  
      console.log(error);
  
    }
  
  };

  const [validationError, setValidationError] = useState<string | null>(null);

  // Auto-reset time slot if the selected slot goes into the past when switching date
  useEffect(() => {
    fetchPackages();
    if (!selectedTimeSlot) return;
    const isSelectedDateToday = dateOptions.find(o => o.id === selectedDate)?.isToday;
    if (isSelectedDateToday) {
      const nowObj = new Date();
      const curHour = nowObj.getHours();
      const curMin = nowObj.getMinutes();
      const [sh, sm] = selectedTimeSlot.split(':').map(Number);
      const isPast = sh < curHour || (sh === curHour && sm <= curMin);
      
      if (isPast) {
        const availableBase = getFilteredTimes(baseTimes, selectedDate);
        if (availableBase.length > 0) {
          setSelectedTimeSlot(availableBase[0]);
        } else {
          const availableAll = getFilteredTimes(allTimes, selectedDate);
          if (availableAll.length > 0) {
            setSelectedTimeSlot(availableAll[0]);
          } else {
            setSelectedTimeSlot('');
          }
        }
      }
    }
  }, [selectedDate, dateOptions, selectedTimeSlot, baseTimes, allTimes]);

  const handleConfirm = () => {
    const isTempat = washType === 'tempat';
    
    if (isTempat && !selectedOutletId) {
      setValidationError('Silakan pilih outlet terdekat terlebih dahulu.');
      return;
    }
    if (matchingCars.length === 0) {
      setValidationError(`Silakan tambahkan kendaraan ${booking.vehicleType === 'motor' ? 'Roda 2 (Motor)' : 'Roda 4 (Mobil)'} pada Profil Anda terlebih dahulu.`);
      return;
    }
    if (!selectedCar) {
      setValidationError('Silakan pilih kendaraan yang akan dicuci.');
      return;
    }
    if (!selectedTech) {
      setValidationError('Silakan pilih teknisi yang Anda inginkan.');
      return;
    }
    if (!selectedDate) {
      setValidationError('Silakan pilih tanggal cuci.');
      return;
    }
    if (!selectedTimeSlot) {
      setValidationError('Silakan pilih jam cuci.');
      return;
    }

    const chosenTech = mappedTechs.find(t => t.id === selectedTech);
    if (chosenTech && isTechBusyAtSelectedTime(chosenTech.rawBookings)) {
      setValidationError(`Teknisi ${chosenTech.name} sudah memiliki jadwal booking di jam tersebut. Silakan pilih teknisi lain atau ubah jam cuci.`);
      return;
    }

    setValidationError(null);
    const chosenOutlet = mappedOutlets.find(o => o.id === selectedOutletId);
    const resolvedOutletId = isTempat ? selectedOutletId : (chosenTech?.outletId || null);

    onUpdateBooking({
      selectedCarId: selectedCar,
      selectedTechnicianId: selectedTech,
      selectedDate: selectedDate,
      selectedTime: selectedTimeSlot,
      locationName: isTempat ? (chosenOutlet?.name || '') : (booking.locationName || 'Jakarta Selatan'),
      pickupLocation: isTempat ? (chosenOutlet?.address || '') : (booking.pickupLocation || 'Sudirman Central Business District, Jakarta'),
      selectedOutletId: resolvedOutletId,
    });
    onNext();
  };

  return (
    <div className="bg-[#faf9fb] min-h-screen text-[#1b1c1e] pb-32">
      {/* Top Navbar */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-[#efedf0] shadow-sm">
        <div className="flex justify-between items-center w-full px-5 py-3 max-w-screen-xl mx-auto">
          <div className="flex items-center gap-3">
            <button 
              onClick={onBack}
              className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-slate-100 transition-colors cursor-pointer text-[#000d1a]"
            >
              <span className="material-symbols-outlined text-[#785900]">arrow_back</span>
            </button>
            <span className="material-symbols-outlined text-[#785900]">location_on</span>
            <span className="font-bold text-lg tracking-tight text-[#0a2540]">Clean Vehicle</span>
          </div>

        </div>
      </header>

      <main className="max-w-screen-md mx-auto px-5 pt-4 flex flex-col gap-5">
        
        {/* Service toggle button */}
        <section className="mb-2">
          <div className="bg-[#f5f3f6] p-1.5 rounded-2xl flex gap-2">
            <button 
              onClick={() => setWashType('rumah')}
              className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm tracking-wide transition-all cursor-pointer ${
                washType === 'rumah' 
                  ? 'bg-[#0a2540] text-white shadow-md' 
                  : 'text-[#43474d] hover:bg-[#e9e8ea]'
              }`}
            >
              Cuci di Rumah
            </button>
            <button 
              onClick={() => setWashType('tempat')}
              className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm tracking-wide transition-all cursor-pointer ${
                washType === 'tempat' 
                  ? 'bg-[#0a2540] text-white shadow-md' 
                  : 'text-[#43474d] hover:bg-[#e9e8ea]'
              }`}
            >
              Cuci di Tempat
            </button>
          </div>
        </section>

        {/* Dynamic selection segment */}
        {washType === 'rumah' ? (
          <section className="space-y-2">
            <label className="text-[10px] font-extrabold text-[#74777e] uppercase tracking-wider ml-1">Lokasi Cuci di Rumah</label>
            <div className="relative h-48 w-full rounded-2xl overflow-hidden shadow-md">
              <img 
                className="w-full h-full object-cover"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuCGhS0lFPwa5Xx-h410A9uUnPuaTQ9nEhDMyC-WSiitGcJEvnIaX7IaXwLnaaE8XYlC44xsVsVHz_qLd_Rcd9hW2WchebJVTv6Jr7e28glki5eCZSPiOsuNcUqtlRdiruAYIXBZ9sIEpXCe2ArW6rjcMoY50Yb_Y9CdH0APUiuCcN2mvZvxjq3Gs__k9TSOfMTEuGUGHMbi6o4y_Kox7xZapNmC0pZuB9EQQGFN4bX0DjO9NBn61FPOtRNJSevN8rYcTTGjoWtZ_CZR"
                alt="Map view"
              />
              <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-md p-4 rounded-xl flex items-center justify-between shadow-lg border border-[#ffdf9e]/50 gap-2">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="bg-[#ffdf9e]/30 p-2 rounded-lg text-[#785900] shrink-0">
                    <span className="material-symbols-outlined">my_location</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold text-[#74777e] uppercase tracking-wider">LOKASI RUMAH ANDA</p>
                    <h3 className="text-sm font-bold text-[#000f22] truncate">
                      {booking.locationName || 'Jakarta Selatan'}
                    </h3>
                    <p className="text-[11px] text-[#74777e] truncate">
                      {booking.pickupLocation || 'Sudirman Central Business District, Jakarta'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowLocationModal(true)}
                  className="text-[#785900] bg-[#ffdf9e]/30 px-3.5 py-2 rounded-xl text-xs font-bold hover:bg-[#ffdf9e]/55 active:scale-95 transition-all cursor-pointer shrink-0"
                >
                  Ubah
                </button>
              </div>
            </div>
          </section>
        ) : (
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-[#000f22]">Pilih Outlet Terdekat</h2>
              <span className="text-xs font-bold text-[#785900]">Buka 24 Jam</span>
            </div>

            <div className="space-y-3 animate-fade-in">
              {mappedOutlets.map((outlet) => (
                <div 
                  key={outlet.id}
                  onClick={() => setSelectedOutletId(outlet.id)}
                  className={`p-4 rounded-2xl bg-white border flex gap-4 cursor-pointer hover:shadow-md active:scale-[0.99] transition-all ${
                    selectedOutletId === outlet.id 
                      ? 'border-[#fdc003] ring-1 ring-[#fdc003]' 
                      : 'border-[#efedf0] shadow-sm'
                  }`}
                >
                  <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-slate-100">
                    <img 
                      alt={outlet.name} 
                      className="w-full h-full object-cover"
                      src={outlet.image}
                    />
                  </div>
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-extrabold text-[#000f22] truncate">{outlet.name}</h4>
                        <p className="text-[11px] text-[#74777e] truncate mt-0.5">{outlet.address}</p>
                        <div className="flex items-center gap-1 text-[#785900] mt-1">
                          <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                          <span className="text-xs font-bold">{outlet.rating}</span>
                          <span className="text-[#74777e] text-[10px] ml-1">({outlet.reviewsCount} Ulasan)</span>
                          <span className="text-emerald-700 text-[10px] font-extrabold ml-2 bg-emerald-50 px-1.5 py-0.5 rounded shrink-0">{outlet.distance}</span>
                        </div>
                      </div>
                      <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded text-[9px] font-bold shrink-0">BUKA</span>
                    </div>
                    <div className="mt-2.5 flex gap-1.5 flex-wrap">
                      {outlet.features.map(feat => (
                        <span key={feat} className="px-2 py-0.5 bg-[#f5f3f6] rounded-full text-[9px] font-bold text-[#74777e] border border-[#e3e2e5]">
                          {feat}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Vehicle Selection Section */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#000f22]">Pilih Kendaraan Anda</h2>
            <span className="text-[10px] font-bold text-[#74777e] uppercase tracking-wider">
              Tipe: {booking.vehicleType === 'motor' ? 'Roda 2 (Motor)' : 'Roda 4 (Mobil)'}
            </span>
          </div>

          {matchingCars.length === 0 ? (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-700">
              <span className="material-symbols-outlined text-red-500 mt-0.5 shrink-0">warning</span>
              <div className="text-xs space-y-1">
                <p className="font-extrabold">Kendaraan Tidak Ditemukan!</p>
                <p className="leading-relaxed">
                  Anda tidak memiliki kendaraan berjenis <strong>{booking.vehicleType === 'motor' ? 'Roda 2 (Motor)' : 'Roda 4 (Mobil)'}</strong> terdaftar di profil Anda.
                </p>
                <p className="font-medium pt-1">
                  Harap tambahkan kendaraan yang sesuai di halaman profil Anda terlebih dahulu sebelum memesan layanan ini.
                </p>
              </div>
            </div>
          ) : (
            <div className="relative">
              <select
                value={selectedCar}
                onChange={(e) => setSelectedCar(e.target.value)}
                className="w-full bg-white border border-[#efedf0] shadow-sm rounded-2xl p-4 text-xs font-bold focus:ring-1 focus:ring-[#fdc003] outline-none text-[#000f22] appearance-none cursor-pointer pr-10"
              >
                <option value="" disabled>-- Pilih Kendaraan Terdaftar --</option>
                {matchingCars.map((car) => (
                  <option key={car.id} value={car.id}>
                    {car.name} ({car.plate})
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                <span className="material-symbols-outlined">keyboard_arrow_down</span>
              </div>
            </div>
          )}
        </section>

        {/* Technician lists cards */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-[#000f22]">Teknisi Tersedia</h2>
            {filteredTechs.length > 3 && (
              <button 
                type="button"
                onClick={() => setIsTechExpanded(!isTechExpanded)}
                className="text-xs font-bold text-[#785900] cursor-pointer hover:underline bg-transparent border-none p-0 focus:outline-none"
              >
                {isTechExpanded ? 'Sembunyikan' : 'Lihat Semua'}
              </button>
            )}
          </div>

          <div className="space-y-3">
            {displayedTechs.length === 0 ? (
              <div className="p-5 bg-[#faf8f5] border border-[#ffdf9e] rounded-2xl flex flex-col items-center text-center gap-3 animate-fade-in">
                <div className="w-12 h-12 rounded-full bg-[#ffdf9e]/30 flex items-center justify-center text-[#785900]">
                  <span className="material-symbols-outlined text-2xl">person_search</span>
                </div>
                <div className="space-y-1">
                  <h4 className="text-xs font-extrabold text-[#0a2540] uppercase tracking-wider">Teknisi Tidak Tersedia</h4>
                  <p className="text-xs text-[#74777e] leading-relaxed max-w-[300px]">
                    Maaf, saat ini belum ada teknisi dengan spesialisasi yang sesuai bertugas di outlet pilihan Anda.
                  </p>
                </div>
                <p className="text-[10px] font-bold text-[#785900] bg-[#ffdf9e]/20 px-3 py-1 rounded-full">
                  Silakan coba pilih outlet lain atau ubah tipe kendaraan Anda.
                </p>
              </div>
            ) : (
              displayedTechs.map((tech) => {
                const isBusy = isTechBusyAtSelectedTime(tech.rawBookings);
                const isSelected = selectedTech === tech.id;
                return (
                  <div 
                    key={tech.id}
                    onClick={() => {
                      if (!isBusy) {
                        setSelectedTech(tech.id);
                      }
                    }}
                    className={`p-4 rounded-2xl bg-white border flex gap-4 transition-all ${
                      isBusy 
                        ? 'opacity-65 cursor-not-allowed border-[#efedf0] bg-slate-50 shadow-none'
                        : isSelected 
                          ? 'border-[#fdc003] ring-1 ring-[#fdc003] cursor-pointer hover:shadow-md' 
                          : 'border-transparent shadow-sm cursor-pointer hover:shadow-md'
                    }`}
                  >
                    <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0">
                      <img 
                        alt={tech.name} 
                        className="w-full h-full object-cover"
                        src={tech.avatar}
                        onError={(e) => {
                          e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(tech.name)}&background=1B2337&color=F0C419`;
                        }}
                      />
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-sm font-extrabold text-[#000f22]">{tech.name}</h4>
                          <div className="flex items-center gap-1 text-[#785900] mt-1">
                            <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                            <span className="text-xs font-bold">{tech.rating}</span>
                            <span className="text-[#74777e] text-[10px] ml-1">({tech.reviewsCount} Review)</span>
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isBusy 
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : tech.status === 'Tersedia' 
                              ? 'bg-green-50 text-emerald-700' 
                              : 'bg-red-50 text-red-700'
                        }`}>
                          {isBusy ? 'Sudah Ada Booking' : tech.status}
                        </span>
                      </div>
                      <div className="mt-2 flex gap-1.5 flex-wrap">
                        {tech.specialties.map((spec: string) => (
                          <span key={spec} className="px-2 py-0.5 bg-[#f5f3f6] rounded-full text-[9px] font-bold text-[#74777e] border border-[#e3e2e5]">
                            {spec}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Date and Calendar Pickers */}
        <section className="space-y-2">
          <h2 className="text-base font-bold text-[#000f22]">Pilih Jadwal</h2>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-[#efedf0]">
            <p className="text-[10px] font-bold text-[#74777e] tracking-wider uppercase mb-3">
              {dateOptions.find(o => o.id === selectedDate)?.monthYear || 'Mei 2026'}
            </p>
            <div className="flex justify-start gap-2 overflow-x-auto pb-1 no-scrollbar">
              {dateOptions.map((opt) => {
                const isSelected = selectedDate === opt.id;
                return (
                  <button 
                    key={opt.id}
                    type="button"
                    disabled={opt.isDisabled}
                    onClick={() => setSelectedDate(opt.id)}
                    className={`flex flex-col items-center p-3 rounded-xl min-w-[65px] border transition-all cursor-pointer ${
                      opt.isDisabled 
                        ? 'opacity-40 bg-[#f5f3f6] border-neutral-200 text-slate-400 cursor-not-allowed'
                        : isSelected 
                          ? 'bg-[#ffdf9e] border-[#fdc003] text-[#6c5000] font-extrabold ring-1 ring-[#fdc003]' 
                          : 'bg-white border-[#efedf0] text-[#1b1c1e] hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-[10px] leading-tight opacity-75 font-semibold">
                      {opt.dayAbbr}
                    </span>
                    <span className="text-base font-black mt-0.5">
                      {opt.dateNumber}
                    </span>
                    {opt.isDisabled ? (
                      <span className="text-[7px] font-bold text-red-500 uppercase mt-0.5 tracking-wider">Tutup</span>
                    ) : opt.isToday ? (
                      <span className="text-[7px] font-bold text-emerald-600 uppercase mt-0.5 tracking-wider">Hari ini</span>
                    ) : null}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Time select slot picker code */}
        <section className="space-y-2">
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-[#efedf0]">
            <div className="flex justify-between items-center mb-3">
              <p className="text-[10px] font-bold text-[#74777e] tracking-wider uppercase">Waktu Tersedia</p>
              <button 
                type="button"
                onClick={() => setIsTimeExpanded(!isTimeExpanded)}
                className="text-[#785900] text-xs font-extrabold flex items-center gap-1 hover:underline cursor-pointer transition-colors"
              >
                {isTimeExpanded ? 'Sembunyikan' : 'Pilihan Lainnya'}
                <span className={`material-symbols-outlined text-[16px] transition-transform duration-300 ${isTimeExpanded ? 'rotate-180' : ''}`}>
                  expand_more
                </span>
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2 transition-all duration-305">
              {displayedTimes.map((time) => (
                <button 
                  key={time}
                  onClick={() => setSelectedTimeSlot(time)}
                  className={`py-2 border rounded-xl text-center text-xs font-bold transition-all cursor-pointer ${
                    selectedTimeSlot === time 
                      ? 'border-[#fdc003] bg-[#ffdf9e]/30 text-[#785900]' 
                      : 'border-[#efedf0] text-[#000f22] hover:bg-slate-50'
                  }`}
                >
                  {time}
                </button>
              ))}
            </div>
          </div>
        </section>

      </main>

      {/* Floating confirm booking stick bottom action bar */}
      <div className="fixed bottom-0 left-0 right-0 px-5 pb-6 pt-3 bg-white/95 backdrop-blur-md shadow-2lg border-t border-[#efedf0] z-40 flex flex-col items-center">
        {validationError && (
          <div className="mb-3 px-4 py-2 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-bold text-center w-full md:max-w-md animate-bounce">
            {validationError}
          </div>
        )}
        <motion.button 
          whileTap={{ scale: 0.98 }}
          onClick={handleConfirm}
          className="w-full md:max-w-md py-4 bg-[#785900] hover:bg-[#5b4300] text-white rounded-full font-bold shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all uppercase tracking-wider text-sm"
        >
          Konfirmasi Pesanan
          <span className="material-symbols-outlined">arrow_forward</span>
        </motion.button>
      </div>

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
