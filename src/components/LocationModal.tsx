import React, { useState } from 'react';

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialLocationName: string;
  initialPickupLocation: string;
  onSave: (locationName: string, pickupLocation: string, lat?: number, lon?: number) => void;
}

export default function LocationModal({
  isOpen,
  onClose,
  initialLocationName,
  initialPickupLocation,
  onSave
}: LocationModalProps) {
  const [tempLocationName, setTempLocationName] = useState(initialLocationName || '');
  const [tempPickupLocation, setTempPickupLocation] = useState(initialPickupLocation || '');
  const [isLocating, setIsLocating] = useState(false);
  const [loadingText, setLoadingText] = useState('');

  if (!isOpen) return null;

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Browser Anda tidak mendukung Geolocation.');
      return;
    }

    setIsLocating(true);
    setLoadingText('Mendeteksi koordinat GPS...');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLoadingText('Menerjemahkan koordinat ke alamat...');

        try {
          // Fetch reverse geocoding using Nominatim (OpenStreetMap) with ID language preference
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=id`,
            {
              headers: {
                // Generates standard requests, Nominatim usage policy advises setting a Referer/User-Agent
                'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7'
              }
            }
          );
          
          const data = await response.json();
          if (data && data.address) {
            const addr = data.address;
            const city = addr.city || addr.town || addr.village || addr.city_district || addr.county || addr.state || 'Jakarta';
            const suburb = addr.suburb || addr.neighbourhood || '';
            const shortName = suburb ? `${suburb}, ${city}` : city;
            
            setTempLocationName(shortName);
            setTempPickupLocation(data.display_name || '');
          } else {
            throw new Error('Gagal mendapatkan nama alamat.');
          }
        } catch (err: any) {
          console.error('Reverse geocoding error:', err);
          alert('Gagal mendapatkan alamat detail dari GPS. Koordinat berhasil dideteksi, silakan ketik alamat manual.');
        } finally {
          setIsLocating(false);
          setLoadingText('');
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        let errorMsg = 'Gagal mengakses GPS Anda.';
        if (error.code === error.PERMISSION_DENIED) {
          errorMsg = 'Akses lokasi ditolak. Harap izinkan akses lokasi pada browser Anda.';
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          errorMsg = 'Informasi lokasi tidak tersedia.';
        } else if (error.code === error.TIMEOUT) {
          errorMsg = 'Waktu permintaan deteksi lokasi habis.';
        }
        alert(errorMsg);
        setIsLocating(false);
        setLoadingText('');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const handleSave = () => {
    if (!tempLocationName.trim() || !tempPickupLocation.trim()) {
      alert('Mohon isi kota dan alamat lengkap penjemputan.');
      return;
    }
    onSave(tempLocationName.trim(), tempPickupLocation.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-5">
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-slate-100 space-y-4 animate-scale-in text-[#1b1c1e]">
        {/* Modal Header */}
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#fdc003]">location_on</span>
            <h3 className="text-base font-extrabold text-[#000f22]">Ubah Lokasi Pelayanan</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLocating}
            className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[16px]">close</span>
          </button>
        </div>

        {/* Geolocation Trigger Section */}
        <div className="pt-1">
          {isLocating ? (
            <div className="flex flex-col items-center justify-center py-4 bg-[#f5f3f6] rounded-2xl border border-dashed border-[#fdc003] animate-pulse">
              <div className="w-8 h-8 rounded-full border-4 border-amber-400 border-t-transparent animate-spin mb-2"></div>
              <p className="text-xs font-bold text-[#000f22]">{loadingText}</p>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleGetCurrentLocation}
              className="w-full py-3 px-4 bg-gradient-to-r from-[#0a2540] to-[#154675] hover:brightness-110 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md active:scale-[0.98] transition-all cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px] animate-pulse">my_location</span>
              <span>Gunakan GPS / Lokasi Saat Ini</span>
            </button>
          )}
        </div>

        <div className="space-y-4">
          {/* Location Name Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-extrabold text-[#74777e] uppercase tracking-wider">Kota / Wilayah</label>
            <input
              type="text"
              value={tempLocationName}
              onChange={(e) => setTempLocationName(e.target.value)}
              placeholder="Contoh: Kuningan, Jakarta Selatan"
              className="bg-[#f5f3f6] border border-[#e3e2e5] rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:ring-1 focus:ring-[#fdc003] outline-none w-full"
              required
              disabled={isLocating}
            />
          </div>

          {/* Pickup Location Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-extrabold text-[#74777e] uppercase tracking-wider">Alamat Lengkap Penjemputan</label>
            <textarea
              rows={3}
              value={tempPickupLocation}
              onChange={(e) => setTempPickupLocation(e.target.value)}
              placeholder="Contoh: Jl. Kuningan Mulia No.11, Setiabudi..."
              className="bg-[#f5f3f6] border border-[#e3e2e5] rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:ring-1 focus:ring-[#fdc003] outline-none w-full resize-none"
              required
              disabled={isLocating}
            />
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="flex gap-2.5 pt-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLocating}
            className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs cursor-pointer active:scale-95 transition-all text-center disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isLocating}
            className="flex-1 py-3 bg-[#fdc003] hover:bg-[#fabd00] text-[#6c5000] rounded-xl font-bold text-xs cursor-pointer shadow-md active:scale-95 transition-all text-center disabled:opacity-50"
          >
            Simpan Lokasi
          </button>
        </div>
      </div>
    </div>
  );
}
