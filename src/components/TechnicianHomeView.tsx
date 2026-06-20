import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import api from '../services/api';

interface TechnicianHomeViewProps {
  darkMode: boolean;
  onToggleTheme: () => void;
  technician: any;
  onLogout: () => void;
  onRefreshProfile?: () => void;
}

export default function TechnicianHomeView({ darkMode, onToggleTheme, technician, onLogout, onRefreshProfile }: TechnicianHomeViewProps) {
  const [activeTab, setActiveTab] = useState<'tugas' | 'riwayat' | 'notifikasi' | 'profil'>('tugas');
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Chat state
  const [selectedBookingForChat, setSelectedBookingForChat] = useState<any | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [pollingChat, setPollingChat] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Camera upload state for completion (both before/after photos)
  const [selectedBookingForPhoto, setSelectedBookingForPhoto] = useState<any | null>(null);
  const [photoUploadMode, setPhotoUploadMode] = useState<'before' | 'after' | null>(null);
  const [beforePhotoFile, setBeforePhotoFile] = useState<File | null>(null);
  const [beforePhotoPreview, setBeforePhotoPreview] = useState<string | null>(null);
  const [afterPhotoFile, setAfterPhotoFile] = useState<File | null>(null);
  const [afterPhotoPreview, setAfterPhotoPreview] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [selectedBookingForTracking, setSelectedBookingForTracking] = useState<any | null>(null);

  // Simulated GPS state
  const [currentLat, setCurrentLat] = useState(-6.200000);
  const [currentLng, setCurrentLng] = useState(106.816666);
  const [simulating, setSimulating] = useState(false);

  // Alerts state
  const [alerts, setAlerts] = useState<any[]>(() => {
    const saved = localStorage.getItem(`tech_alerts_${technician?.id || 'default'}`);
    return saved ? JSON.parse(saved) : [];
  });
  const [activeToast, setActiveToast] = useState<{ title: string; description: string } | null>(null);
  const prevBookingsRef = useRef<any[]>([]);

  // Edit Profile States
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editName, setEditName] = useState(technician?.name || '');
  const [editAvatar, setEditAvatar] = useState(technician?.avatar || technician?.profile_photo || '');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const handleOpenEditModal = () => {
    setEditName(technician?.name || '');
    setEditAvatar(technician?.avatar || technician?.profile_photo || '');
    setShowEditProfileModal(true);
  };

  const handleProfileFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditAvatar(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;
    try {
      setIsSavingProfile(true);
      await api.put('/technician/profile', {
        name: editName,
        profile_photo: editAvatar
      });
      if (onRefreshProfile) {
        onRefreshProfile();
      }
      setShowEditProfileModal(false);
    } catch (error) {
      console.log('Error saving technician profile:', error);
      alert('Gagal menyimpan profil');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Auto-dismiss toast
  useEffect(() => {
    if (activeToast) {
      const timer = setTimeout(() => setActiveToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [activeToast]);

  const addTechnicianNotification = (id: string, title: string, description: string, bookingCode: string) => {
    setAlerts(prev => {
      if (prev.some(a => a.id === id)) return prev;
      const newAlert = {
        id,
        title,
        description,
        bookingCode,
        time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
        read: false
      };
      const updated = [newAlert, ...prev];
      localStorage.setItem(`tech_alerts_${technician?.id || 'default'}`, JSON.stringify(updated));
      setActiveToast({ title, description });
      return updated;
    });
  };

  const handleAlertClick = (alertItem: any) => {
    // Mark alert as read
    const updated = alerts.map(a => a.id === alertItem.id ? { ...a, read: true } : a);
    setAlerts(updated);
    localStorage.setItem(`tech_alerts_${technician?.id || 'default'}`, JSON.stringify(updated));

    // Find the booking
    const bookingId = alertItem.id.split('-').pop(); // e.g. "5" from "VW-NEW-5"
    const job = bookings.find(b => String(b.id) === String(bookingId) || b.booking_code === alertItem.bookingCode);
    if (job) {
      if (['completed', 'cancelled'].includes(job.status)) {
        setActiveTab('riwayat');
      } else {
        setActiveTab('tugas');
      }
      // Scroll to the card after a short timeout to let the tab render
      setTimeout(() => {
        const el = document.getElementById(`job-card-${job.id}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          el.classList.add('ring-2', 'ring-[#fdc003]', 'scale-[1.01]');
          setTimeout(() => {
            el.classList.remove('ring-2', 'ring-[#fdc003]', 'scale-[1.01]');
          }, 2000);
        }
      }, 300);
    }
  };

  const fetchJobs = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      const response = await api.get('/technician/bookings');
      const newBookings = response.data || [];
      
      // Compare with previous bookings to trigger notifications
      if (prevBookingsRef.current.length > 0) {
        const prev = prevBookingsRef.current;
        newBookings.forEach((b: any) => {
          const exists = prev.some((p: any) => p.id === b.id);
          if (!exists) {
            addTechnicianNotification(
              `VW-NEW-${b.id}`,
              'Pesanan Baru Masuk',
              `Ada pesanan baru dengan kode ${b.booking_code} untuk paket ${b.package?.name || 'Cuci Kendaraan'} pada ${new Date(b.scheduled_at).toLocaleDateString('id-ID')} pukul ${new Date(b.scheduled_at).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})} WIB.`,
              b.booking_code
            );
          } else {
            const oldB = prev.find((p: any) => p.id === b.id);
            if (oldB) {
              if (oldB.status !== 'cancelled' && b.status === 'cancelled') {
                addTechnicianNotification(
                  `VW-CANCEL-${b.id}`,
                  'Pesanan Dibatalkan',
                  `Pesanan dengan kode ${b.booking_code} telah dibatalkan oleh pelanggan/admin.`,
                  b.booking_code
                );
              }
              // Check if customer submitted a review
              if (!oldB.review && b.review) {
                addTechnicianNotification(
                  `VW-REVIEW-${b.id}`,
                  'Ulasan & Rating Diterima',
                  `Pelanggan memberikan rating ${b.review.rating} bintang untuk pesanan ${b.booking_code}. "${b.review.comment || 'Tanpa komentar.'}"`,
                  b.booking_code
                );
              }
            }
          }
        });
      }

      prevBookingsRef.current = newBookings;
      setBookings(newBookings);
      if (onRefreshProfile) {
        onRefreshProfile();
      }
    } catch (err) {
      console.log('Error fetching jobs:', err);
    } finally {
      if (showLoader) setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(() => {
      fetchJobs(false);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  // Location simulation effect
  useEffect(() => {
    const activeBooking = bookings.find(b => b.status === 'on_way' || b.status === 'in_progress');
    if (!activeBooking) {
      setSimulating(false);
      return;
    }

    setSimulating(true);
    const targetLat = Number(activeBooking.latitude) || -6.210000;
    const targetLng = Number(activeBooking.longitude) || 106.825000;

    const locInterval = setInterval(async () => {
      setCurrentLat(prev => {
        const diff = targetLat - prev;
        if (Math.abs(diff) < 0.0002) return targetLat;
        return prev + (diff > 0 ? 0.0003 : -0.0003);
      });

      setCurrentLng(prev => {
        const diff = targetLng - prev;
        if (Math.abs(diff) < 0.0002) return targetLng;
        return prev + (diff > 0 ? 0.0003 : -0.0003);
      });

      try {
        await api.post('/technician/location', {
          latitude: currentLat,
          longitude: currentLng
        });
      } catch (err) {
        console.log('Error updating location:', err);
      }
    }, 5000);

    return () => clearInterval(locInterval);
  }, [bookings, currentLat, currentLng]);

  // Polling chat messages
  useEffect(() => {
    if (!selectedBookingForChat) {
      setPollingChat(false);
      return;
    }

    setPollingChat(true);
    const fetchChat = async () => {
      try {
        const response = await api.get(`/bookings/${selectedBookingForChat.id}/chat`);
        setChatMessages(response.data || []);
      } catch (err) {
        console.log('Chat load error:', err);
      }
    };

    fetchChat();
    const chatInterval = setInterval(fetchChat, 2000);
    return () => clearInterval(chatInterval);
  }, [selectedBookingForChat]);

  // Scroll chat to bottom
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages]);

  const handleSendChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMsg.trim() || !selectedBookingForChat) return;

    const msgText = newMsg;
    setNewMsg('');

    try {
      await api.post(`/bookings/${selectedBookingForChat.id}/chat`, {
        sender_type: 'technician',
        message: msgText
      });
      const response = await api.get(`/bookings/${selectedBookingForChat.id}/chat`);
      setChatMessages(response.data || []);
    } catch (err) {
      console.log('Chat send error:', err);
    }
  };

  const handleUpdateStatus = async (bookingId: number, nextStatus: 'confirmed' | 'on_way' | 'in_progress' | 'completed') => {
    const booking = bookings.find(b => b.id === bookingId);

    if (nextStatus === 'in_progress') {
      setSelectedBookingForPhoto(booking);
      setPhotoUploadMode('before');
      setBeforePhotoFile(null);
      setBeforePhotoPreview(null);
      return;
    }

    if (nextStatus === 'completed') {
      setSelectedBookingForPhoto(booking);
      setPhotoUploadMode('after');
      setAfterPhotoFile(null);
      setAfterPhotoPreview(null);
      return;
    }

    try {
      setLoading(true);
      await api.post(`/technician/bookings/${bookingId}/status`, {
        status: nextStatus
      });
      fetchJobs(false);
    } catch (err) {
      alert('Gagal memperbarui status');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoSelectBefore = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setBeforePhotoFile(file);
      setBeforePhotoPreview(URL.createObjectURL(file));
    }
  };

  const handlePhotoSelectAfter = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAfterPhotoFile(file);
      setAfterPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleUploadPhotoAndSubmit = async () => {
    if (!selectedBookingForPhoto || !photoUploadMode) return;

    try {
      setUploadingPhoto(true);
      const formData = new FormData();

      if (photoUploadMode === 'before') {
        if (!beforePhotoFile) {
          alert('Silakan ambil/pilih foto sebelum pengerjaan terlebih dahulu.');
          return;
        }
        formData.append('status', 'in_progress');
        formData.append('before_photo', beforePhotoFile);
      } else {
        if (!afterPhotoFile) {
          alert('Silakan ambil/pilih foto sesudah pengerjaan terlebih dahulu.');
          return;
        }
        formData.append('status', 'completed');
        formData.append('after_photo', afterPhotoFile);
      }

      await api.post(`/technician/bookings/${selectedBookingForPhoto.id}/status`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setSelectedBookingForPhoto(null);
      setPhotoUploadMode(null);
      setBeforePhotoFile(null);
      setBeforePhotoPreview(null);
      setAfterPhotoFile(null);
      setAfterPhotoPreview(null);
      fetchJobs(false);
    } catch (err: any) {
      alert('Gagal mengunggah foto: ' + (err?.response?.data?.message || err.message));
    } finally {
      setUploadingPhoto(false);
    }
  };

  const activeJobs = bookings.filter(b => ['pending', 'confirmed', 'assigned', 'on_way', 'in_progress'].includes(b.status));
  const historyJobs = bookings.filter(b => ['completed', 'cancelled'].includes(b.status));

  const displayStatus = (status: string) => {
    switch (status) {
      case 'pending': return { text: 'Menunggu', class: 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200' };
      case 'confirmed': return { text: 'Diterima', class: 'bg-blue-50 text-blue-850 dark:bg-blue-950/40 dark:text-blue-300' };
      case 'on_way': return { text: 'Perjalanan', class: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300' };
      case 'in_progress': return { text: 'Dikerjakan', class: 'bg-[#ffdf9e] text-[#6c5000] dark:bg-amber-950 dark:text-amber-200' };
      case 'completed': return { text: 'Selesai', class: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' };
      case 'cancelled': return { text: 'Batal', class: 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300' };
      default: return { text: status, class: 'bg-gray-100 text-gray-800' };
    }
  };

  const renderJobCard = (job: any) => {
    const statusInfo = displayStatus(job.status);
    const isHomeService = job.service_type === 'home';
    const formattedPrice = Number(job.total_amount).toLocaleString('id-ID');
    
    // Customer Details
    const customerName = job.customer?.name || job.vehicle_name || 'Pelanggan';
    const customerPhone = job.customer?.phone || '08123456789';

    // Vehicle Details
    const vehicleBrand = job.vehicle?.brand || '';
    const vehicleModel = job.vehicle?.model || '';
    const vehicleColor = job.vehicle?.color || '';
    const vehiclePlate = job.vehicle?.license_plate || '';
    const vehicleTypeName = job.vehicle_type === 'roda_2' ? 'Motor (Roda 2)' : 'Mobil (Roda 4)';
    const vehicleInfoText = vehicleBrand 
      ? `${vehicleBrand} ${vehicleModel} (${vehiclePlate}) - ${vehicleColor}`
      : job.vehicle_name || 'Detail Kendaraan Tidak Tersedia';

    return (
      <div 
        key={job.id} 
        id={`job-card-${job.id}`}
        className="bg-white dark:bg-[#111827] rounded-[2rem] p-5 shadow-md border border-[#efedf0] dark:border-gray-800/40 space-y-4 relative overflow-hidden transition-transform duration-205"
      >
        {/* Top Badge Row */}
        <div className="flex justify-between items-center">
          <span className="text-[11px] font-black text-slate-450 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-xl uppercase tracking-wider">
            {job.booking_code}
          </span>
          <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-xl tracking-wider leading-none ${statusInfo.class}`}>
            {statusInfo.text}
          </span>
        </div>

        {/* Customer Detail Block */}
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-gray-800/40 pb-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200/50 shrink-0">
                <img 
                  src={
                    job.customer?.avatar ||
                    job.customer?.profile_photo ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(customerName)}&background=1B2337&color=F0C419`
                  } 
                  alt={customerName} 
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const photo = job.customer?.profile_photo;
                    if (photo && !photo.startsWith('http')) {
                      e.currentTarget.src = `https://vclean.web.id/storage/${photo}`;
                    } else {
                      e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(customerName)}&background=1B2337&color=F0C419`;
                    }
                  }}
                />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-slate-500">Nama Customer</p>
                <h4 className="font-extrabold text-[#000f22] dark:text-white text-sm mt-0.5">{customerName}</h4>
                <p className="text-[11px] text-gray-550 dark:text-slate-400 font-bold">{customerPhone}</p>
              </div>
            </div>
            
            {/* Quick Actions (Call / Chat) */}
            <div className="flex gap-1.5">
              <a 
                href={`tel:${customerPhone}`}
                className="w-9 h-9 bg-[#f5f3f6] dark:bg-[#1a2333] rounded-xl flex items-center justify-center text-[#0a2540] dark:text-white border-none cursor-pointer hover:bg-slate-150"
                title="Telepon Customer"
              >
                <span className="material-symbols-outlined text-[16px]">call</span>
              </a>
              <button 
                onClick={() => setSelectedBookingForChat(job)}
                className="w-9 h-9 bg-[#f5f3f6] dark:bg-[#1a2333] rounded-xl flex items-center justify-center text-[#0a2540] dark:text-white border-none cursor-pointer hover:bg-slate-150"
                title="Kirim Pesan"
              >
                <span className="material-symbols-outlined text-[16px]">chat</span>
              </button>
            </div>
          </div>

          {/* Vehicle Detail Block */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-slate-500">Detail Kendaraan</p>
            <h5 className="font-extrabold text-slate-800 dark:text-slate-200 text-xs mt-0.5">{vehicleInfoText}</h5>
            <p className="text-[10px] text-gray-400 dark:text-slate-500 font-bold uppercase mt-0.5">{vehicleTypeName}</p>
          </div>

          {/* Package and Schedule Info */}
          <div className="bg-[#f8f7f9] dark:bg-[#151f32]/60 p-3.5 rounded-2xl space-y-2 text-xs font-semibold">
            <div>
              <p className="text-[9px] font-black uppercase tracking-wider text-gray-400 dark:text-slate-500">Layanan & Harga</p>
              <p className="text-[#0a2540] dark:text-white font-extrabold text-xs mt-0.5">{job.package?.name || 'Paket Layanan Cuci'}</p>
            </div>

            <div className="flex items-center gap-2 text-slate-650 dark:text-slate-300 pt-1.5 border-t border-slate-200/50 dark:border-gray-800/50">
              <span className="material-symbols-outlined text-[17px]">calendar_today</span>
              <span>{new Date(job.scheduled_at).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })} • {new Date(job.scheduled_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</span>
            </div>
            
            <div className="flex items-start gap-2 text-slate-650 dark:text-slate-350">
              <span className="material-symbols-outlined text-[17px] shrink-0">{isHomeService ? 'home' : 'store'}</span>
              <span className="leading-relaxed">
                {isHomeService 
                  ? `Cuci di Rumah: ${job.service_address || 'Alamat tidak tertera'}`
                  : `Cuci di Outlet: ${job.outlet?.name || 'Outlet Utama'}`
                }
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 pt-1.5 border-t border-slate-200/50 dark:border-gray-800/50">
              <span className="material-symbols-outlined text-[17px] text-[#785900] dark:text-[#fdc003]">payments</span>
              <span>Biaya: <strong className="text-[#0a2540] dark:text-white font-extrabold">Rp {formattedPrice}</strong></span>
            </div>
          </div>

          {/* Notes (if any) */}
          {job.notes && (
            <div className="p-3 bg-slate-50 dark:bg-[#151f32]/40 rounded-xl text-[11px] font-semibold text-gray-600 dark:text-slate-400">
              <p className="text-[9px] font-black uppercase tracking-wider text-gray-400 mb-0.5">Catatan Customer</p>
              "{job.notes}"
            </div>
          )}

          {/* Cancellation Reason (if cancelled) */}
          {job.status === 'cancelled' && (
            <div className="p-3 bg-red-50 dark:bg-red-955/20 border border-red-100 dark:border-red-950/30 rounded-xl text-[11px] font-semibold text-red-650 dark:text-red-400">
              <p className="text-[9px] font-black uppercase tracking-wider text-red-450 mb-0.5">Alasan Pembatalan</p>
              "{job.cancelled_reason || 'Tidak ada alasan khusus yang diisi.'}"
            </div>
          )}
        </div>

        {/* Photos Showcase (if completed and has photos) */}
        {(job.before_photo || job.after_photo) && (
          <div className="grid grid-cols-2 gap-2 pt-1">
            {job.before_photo && (
              <div className="bg-[#f8f7f9] dark:bg-[#151f32]/60 rounded-xl p-1.5 border dark:border-gray-800">
                <p className="text-[9px] font-bold text-gray-500 uppercase text-center mb-1">Sebelum</p>
                <img 
                  src={`http://127.0.0.1:8000/storage/${job.before_photo}`} 
                  alt="Sebelum" 
                  className="w-full h-24 object-cover rounded-lg shadow-sm"
                />
              </div>
            )}
            {job.after_photo && (
              <div className="bg-[#f8f7f9] dark:bg-[#151f32]/60 rounded-xl p-1.5 border dark:border-gray-800">
                <p className="text-[9px] font-bold text-gray-500 uppercase text-center mb-1">Sesudah</p>
                <img 
                  src={`http://127.0.0.1:8000/storage/${job.after_photo}`} 
                  alt="Sesudah" 
                  className="w-full h-24 object-cover rounded-lg shadow-sm"
                />
              </div>
            )}
          </div>
        )}

        {/* Customer Review (if available) */}
        {job.review && (
          <div className="bg-[#fffbeb] dark:bg-amber-950/20 p-3.5 rounded-2xl border border-amber-100 dark:border-amber-900/30 space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 text-slate-700 dark:text-slate-350 font-bold">
                <span className="material-symbols-outlined text-[16px] text-amber-500">star</span>
                <span>Ulasan Pelanggan</span>
              </div>
              <div className="flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <span 
                    key={i} 
                    className={`material-symbols-outlined text-[14px] ${
                      i < job.review.rating ? 'text-amber-500 fill-amber-500' : 'text-gray-300 dark:text-gray-700'
                    }`}
                    style={{ fontVariationSettings: i < job.review.rating ? "'FILL' 1" : "none" }}
                  >
                    star
                  </span>
                ))}
              </div>
            </div>
            {job.review.comment && (
              <p className="text-gray-655 dark:text-slate-350 italic leading-relaxed font-semibold">
                "{job.review.comment}"
              </p>
            )}
          </div>
        )}

        {/* Actions buttons */}
        {activeTab === 'tugas' && (
          <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-gray-800">
            {/* Main Process Button */}
            {job.status === 'pending' && (
              <button
                onClick={() => handleUpdateStatus(job.id, 'confirmed')}
                className="flex-grow py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-md cursor-pointer border-none"
              >
                Terima Tugas
              </button>
            )}

            {job.status === 'confirmed' && (
              isHomeService ? (
                <button
                  onClick={() => handleUpdateStatus(job.id, 'on_way')}
                  className="flex-grow py-3 bg-[#fdc003] hover:bg-[#fabd00] text-[#6c5000] rounded-xl font-bold text-xs uppercase tracking-wider shadow-md cursor-pointer border-none"
                >
                  Mulai Perjalanan
                </button>
              ) : (
                <div className="flex gap-2 w-full">
                  <button
                    onClick={() => setSelectedBookingForTracking(job)}
                    className="flex-1 py-3 bg-[#fdc003] hover:bg-[#fabd00] text-[#6c5000] rounded-xl font-bold text-xs uppercase tracking-wider shadow-md cursor-pointer border-none flex items-center justify-center gap-1"
                  >
                    <span className="material-symbols-outlined text-[15px]">my_location</span>
                    Lacak Customer
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(job.id, 'in_progress')}
                    className="flex-grow py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-md cursor-pointer border-none"
                  >
                    Mulai Pengerjaan
                  </button>
                </div>
              )
            )}

            {job.status === 'on_way' && (
              <button
                onClick={() => handleUpdateStatus(job.id, 'in_progress')}
                className="flex-grow py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-md cursor-pointer border-none"
              >
                Mulai Pengerjaan
              </button>
            )}

            {job.status === 'in_progress' && (
              <button
                onClick={() => handleUpdateStatus(job.id, 'completed')}
                className="flex-grow py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-md cursor-pointer border-none"
              >
                Selesai
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-[#faf9fb] dark:bg-[#0a0f1d] min-h-screen text-[#1b1c1e] dark:text-[#f3f4f6] flex flex-col pb-24 select-none transition-colors duration-200">
      
      {/* Header Profile Dashboard */}
      <header className="bg-white/80 dark:bg-[#111827]/80 backdrop-blur-md border-b border-[#efedf0] dark:border-gray-800/80 p-4 sticky top-0 z-40 shadow-sm transition-all duration-200">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div 
              onClick={() => setActiveTab('profil')}
              className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border-2 border-[#ffdf9e] shadow-sm relative cursor-pointer active:scale-95 transition-all"
            >
              <img 
                src={technician?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(technician?.name || 'Teknisi')}&background=1B2337&color=F0C419`} 
                alt={technician?.name} 
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="text-[#0a2540] dark:text-white font-black italic tracking-tighter text-base">
            Clean Vehicle
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => setActiveTab('notifikasi')}
              className="w-9 h-9 rounded-xl bg-[#f5f3f6] dark:bg-[#1a2333] flex items-center justify-center cursor-pointer active:scale-95 hover:bg-[#efedf0] dark:hover:bg-[#253046] transition-all text-[#74777e] dark:text-slate-400 relative border-none"
              title="Notifikasi"
            >
              <span className="material-symbols-outlined text-[19px]">notifications</span>
              {alerts.some(a => !a.read) && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
              )}
            </button>
            <button 
              onClick={onToggleTheme}
              className="w-9 h-9 rounded-xl bg-[#f5f3f6] dark:bg-[#1a2333] flex items-center justify-center cursor-pointer active:scale-95 hover:bg-[#efedf0] dark:hover:bg-[#253046] transition-all text-[#74777e] dark:text-slate-400 border-none"
            >
              <span className="material-symbols-outlined text-[19px]">{darkMode ? 'light_mode' : 'dark_mode'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* GPS Simulation Active Overlay Info */}
      {simulating && (
        <div className="bg-blue-50 dark:bg-blue-950/20 border-b border-blue-100 dark:border-blue-900/40 p-2 text-center text-[10px] font-semibold text-blue-800 dark:text-blue-300 flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-xs animate-ping text-blue-500">my_location</span>
          <span>Sinyal GPS Aktif: Mengirimkan kordinat lokasi real-time Anda ke pembooking...</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-grow max-w-md mx-auto w-full p-4 space-y-4">
        {activeTab === 'tugas' && (
          <div className="space-y-4">
            {/* Quick Profile Summary Card */}
            <div className="bg-white dark:bg-[#111827] rounded-[2rem] p-4 border border-[#efedf0] dark:border-gray-800/40 shadow-sm flex items-center gap-3">
              <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800 border-2 border-[#ffdf9e] shadow-sm">
                <img 
                  src={technician?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(technician?.name || 'Teknisi')}&background=1B2337&color=F0C419`} 
                  alt={technician?.name} 
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h2 className="font-extrabold text-sm text-[#000f22] dark:text-white leading-tight">
                  {technician?.name || 'Teknisi'}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center gap-0.5 text-[#fdc003]">
                    <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="text-[10px] font-black text-[#43474d] dark:text-slate-350">{Number(technician?.rating || 5.0).toFixed(1)}</span>
                  </div>
                  <span className="text-gray-300 dark:text-gray-700 text-[10px]">•</span>
                  <span className="text-[10px] text-gray-500 dark:text-slate-400 font-bold">{technician?.total_orders || 0} Selesai</span>
                </div>
              </div>
            </div>

            <h3 className="font-extrabold text-xs text-[#0a2540] dark:text-white uppercase tracking-wider mb-2">Tugas Aktif Anda</h3>
            {loading && (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="w-10 h-10 border-4 border-[#fdc003] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs text-gray-500 font-bold">Memuat tugas...</p>
              </div>
            )}
            {!loading && activeJobs.length === 0 && (
              <div className="text-center py-16 bg-white dark:bg-[#111827] rounded-3xl p-6 shadow-sm border border-[#efedf0] dark:border-gray-800/40">
                <span className="material-symbols-outlined text-gray-300 dark:text-gray-700 text-6xl block mb-2">assignment_turned_in</span>
                <h3 className="font-extrabold text-base text-[#0a2540] dark:text-white">Tidak ada tugas aktif</h3>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 leading-relaxed">Saat ini Anda tidak memiliki tugas pencucian aktif yang perlu dikerjakan.</p>
              </div>
            )}
            {!loading && activeJobs.map(job => renderJobCard(job))}
          </div>
        )}

        {activeTab === 'riwayat' && (
          <div className="space-y-4">
            <h3 className="font-extrabold text-xs text-[#0a2540] dark:text-white uppercase tracking-wider mb-2">Riwayat Pekerjaan</h3>
            {loading && (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                <div className="w-10 h-10 border-4 border-[#fdc003] border-t-transparent rounded-full animate-spin"></div>
                <p className="text-xs text-gray-500 font-bold">Memuat riwayat...</p>
              </div>
            )}
            {!loading && historyJobs.length === 0 && (
              <div className="text-center py-16 bg-white dark:bg-[#111827] rounded-3xl p-6 shadow-sm border border-[#efedf0] dark:border-gray-800/40">
                <span className="material-symbols-outlined text-gray-300 dark:text-gray-700 text-6xl block mb-2">history_toggle_off</span>
                <h3 className="font-extrabold text-base text-[#0a2540] dark:text-white">Belum ada riwayat tugas</h3>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Daftar riwayat pengerjaan tugas Anda akan muncul di sini.</p>
              </div>
            )}
            {!loading && historyJobs.map(job => renderJobCard(job))}
          </div>
        )}

        {activeTab === 'notifikasi' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-extrabold text-xs text-[#0a2540] dark:text-white uppercase tracking-wider">Pemberitahuan</h3>
              {alerts.length > 0 && (
                <button 
                  onClick={() => {
                    const updated = alerts.map(a => ({ ...a, read: true }));
                    setAlerts(updated);
                    localStorage.setItem(`tech_alerts_${technician?.id || 'default'}`, JSON.stringify(updated));
                  }}
                  className="text-xs text-[#785900] dark:text-[#fdc003] font-bold bg-transparent border-none cursor-pointer hover:underline"
                >
                  Tandai Semua Dibaca
                </button>
              )}
            </div>
            {alerts.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-[#111827] rounded-3xl p-6 shadow-sm border border-[#efedf0] dark:border-gray-800/40">
                <span className="material-symbols-outlined text-gray-300 dark:text-gray-700 text-6xl block mb-2">notifications_off</span>
                <h3 className="font-extrabold text-base text-[#0a2540] dark:text-white">Tidak ada notifikasi</h3>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Pemberitahuan mengenai tugas baru atau pembatalan akan muncul di sini.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.map((item) => (
                  <div 
                    key={item.id}
                    onClick={() => handleAlertClick(item)}
                    className={`p-4 rounded-2xl border transition-all flex gap-3 relative cursor-pointer hover:bg-slate-55/40 dark:hover:bg-slate-900/30 ${
                      item.read 
                        ? 'bg-white dark:bg-[#111827] border-slate-105 dark:border-gray-800/40 opacity-75' 
                        : 'bg-[#ffdf9e]/10 dark:bg-amber-950/20 border-[#ffdf9e]/30 dark:border-amber-900/40'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      item.title.includes('Batal') 
                        ? 'bg-red-50 dark:bg-red-950/20 text-red-550' 
                        : 'bg-[#ffdf9e]/40 dark:bg-amber-950 text-[#785900] dark:text-amber-300'
                    }`}>
                      <span className="material-symbols-outlined text-[19px]">
                        {item.title.includes('Batal') ? 'cancel' : 'assignment'}
                      </span>
                    </div>
                    <div className="space-y-0.5 pr-8">
                      <div className="flex items-center gap-2">
                        <h4 className="font-extrabold text-xs text-[#000f22] dark:text-white">{item.title}</h4>
                        <span className="text-[9px] text-gray-400 dark:text-slate-500 font-medium">{item.date} • {item.time}</span>
                      </div>
                      <p className="text-[11px] text-gray-600 dark:text-slate-400 font-medium leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'profil' && (
          <div className="space-y-6">
            <h3 className="font-extrabold text-xs text-[#0a2540] dark:text-white uppercase tracking-wider mb-2">Profil Teknisi</h3>
            
            {/* Main Profile Info Card */}
            <div className="bg-white dark:bg-[#111827] rounded-[2rem] p-6 shadow-md border border-[#efedf0] dark:border-gray-800/40 flex flex-col items-center text-center space-y-4">
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-[#ffdf9e] shadow-md relative">
                <img 
                  src={technician?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(technician?.name || 'Teknisi')}&background=1B2337&color=F0C419`} 
                  alt={technician?.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h4 className="font-extrabold text-[#000f22] dark:text-white text-lg leading-tight">{technician?.name}</h4>
                <p className="text-xs text-[#785900] dark:text-[#fdc003] font-bold mt-1 uppercase tracking-wider">{technician?.specialization || 'Spesialis Cuci'}</p>
                <button 
                  onClick={handleOpenEditModal}
                  className="mt-2.5 px-4 py-1.5 bg-[#f5f3f6] dark:bg-[#1a2333] hover:bg-[#efedf0] dark:hover:bg-[#253046] text-[#0a2540] dark:text-white rounded-lg text-[10px] font-bold uppercase border-none cursor-pointer active:scale-95 transition-all flex items-center justify-center gap-1 mx-auto"
                >
                  <span className="material-symbols-outlined text-[12px]">edit</span>
                  Edit Profil
                </button>
              </div>
            </div>

            {/* Profile Fields section */}
            <div className="bg-white dark:bg-[#111827] rounded-[2rem] p-5 shadow-md border border-[#efedf0] dark:border-gray-800/40 space-y-4">
              <div className="flex items-center justify-between py-2 border-b border-slate-105 dark:border-gray-800/40">
                <span className="text-xs text-gray-500 font-bold">Nomor Telepon</span>
                <span className="text-xs text-[#000f22] dark:text-white font-extrabold">{technician?.phone || '-'}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-105 dark:border-gray-800/40">
                <span className="text-xs text-gray-500 font-bold">Email</span>
                <span className="text-xs text-[#000f22] dark:text-white font-extrabold">{technician?.email || '-'}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-105 dark:border-gray-800/40">
                <span className="text-xs text-gray-500 font-bold">Spesialisasi</span>
                <span className="text-xs text-[#000f22] dark:text-white font-extrabold">{technician?.specialization || '-'}</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b border-slate-105 dark:border-gray-800/40">
                <span className="text-xs text-gray-500 font-bold">Area Tugas</span>
                <span className="text-xs text-[#000f22] dark:text-white font-extrabold">{technician?.area || '-'}</span>
              </div>
              {technician?.outlet && (
                <div className="py-2 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500 font-bold">Outlet Cabang</span>
                    <span className="text-xs text-[#000f22] dark:text-white font-extrabold">{technician.outlet.name}</span>
                  </div>
                  <p className="text-[10px] text-gray-400 dark:text-slate-500 font-medium text-right">{technician.outlet.address}</p>
                </div>
              )}
            </div>

            {/* Logout button */}
            <button 
              onClick={onLogout}
              className="w-full py-4 bg-red-50 hover:bg-red-100 text-red-650 dark:bg-red-950/20 dark:hover:bg-red-950/40 dark:text-red-400 rounded-xl font-bold text-xs uppercase tracking-wider shadow-sm cursor-pointer border-none flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">logout</span>
              Keluar Akun
            </button>
          </div>
        )}
      </main>

      {/* Bottom Nav Bar Navigation */}
      <nav className="bg-white/95 dark:bg-[#111827]/95 backdrop-blur-lg border-t border-[#efedf0] dark:border-gray-800/80 shadow-2lg fixed bottom-0 left-0 w-full z-50">
        <div className="flex justify-around items-center px-4 pb-6 pt-3">
          
          {/* Tugas Tab */}
          <button 
            onClick={() => setActiveTab('tugas')} 
            className={`flex flex-col items-center justify-center px-4 py-2 rounded-2xl transition-all duration-150 cursor-pointer text-xs gap-1 border-none bg-transparent ${
              activeTab === 'tugas'
                ? 'text-[#fdc003] bg-[#ffdf9e]/30 font-bold'
                : 'text-[#74777e] hover:text-[#000f22] dark:hover:text-white font-semibold'
            }`}
          >
            <span className="material-symbols-outlined">assignment</span>
            <span className="uppercase tracking-wider text-[9px]">Tugas</span>
          </button>

          {/* Riwayat Tab */}
          <button 
            onClick={() => setActiveTab('riwayat')} 
            className={`flex flex-col items-center justify-center px-4 py-2 rounded-2xl transition-all duration-150 cursor-pointer text-xs gap-1 border-none bg-transparent ${
              activeTab === 'riwayat'
                ? 'text-[#fdc003] bg-[#ffdf9e]/30 font-bold'
                : 'text-[#74777e] hover:text-[#000f22] dark:hover:text-white font-semibold'
            }`}
          >
            <span className="material-symbols-outlined">history</span>
            <span className="uppercase tracking-wider text-[9px]">Riwayat</span>
          </button>

          {/* Notifikasi Tab */}
          <button 
            onClick={() => {
              setActiveTab('notifikasi');
              // Mark all read when tab is selected
              const updated = alerts.map(a => ({ ...a, read: true }));
              setAlerts(updated);
              localStorage.setItem(`tech_alerts_${technician?.id || 'default'}`, JSON.stringify(updated));
            }} 
            className={`flex flex-col items-center justify-center px-4 py-2 rounded-2xl transition-all duration-150 cursor-pointer text-xs gap-1 border-none bg-transparent relative ${
              activeTab === 'notifikasi'
                ? 'text-[#fdc003] bg-[#ffdf9e]/30 font-bold'
                : 'text-[#74777e] hover:text-[#000f22] dark:hover:text-white font-semibold'
            }`}
          >
            <span className="material-symbols-outlined">notifications</span>
            <span className="uppercase tracking-wider text-[9px]">Pemberitahuan</span>
            {alerts.some(a => !a.read) && (
              <span className="absolute top-2 right-6 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
            )}
          </button>

          {/* Profil Tab */}
          <button 
            onClick={() => setActiveTab('profil')} 
            className={`flex flex-col items-center justify-center px-4 py-2 rounded-2xl transition-all duration-150 cursor-pointer text-xs gap-1 border-none bg-transparent ${
              activeTab === 'profil'
                ? 'text-[#fdc003] bg-[#ffdf9e]/30 font-bold'
                : 'text-[#74777e] hover:text-[#000f22] dark:hover:text-white font-semibold'
            }`}
          >
            <span className="material-symbols-outlined">person</span>
            <span className="uppercase tracking-wider text-[9px]">Profil</span>
          </button>

        </div>
      </nav>

      {/* Chat popup Modal */}
      <AnimatePresence>
        {selectedBookingForChat && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-end justify-center z-50"
            onClick={() => setSelectedBookingForChat(null)}
          >
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-white dark:bg-[#111827] w-full max-w-md rounded-t-[2.5rem] flex flex-col h-[80vh] overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-5 border-b border-[#efedf0] dark:border-gray-800 flex justify-between items-center bg-[#faf9fb] dark:bg-[#151f32]">
                <div>
                  <p className="text-[9px] font-black uppercase text-[#fdc003]">Percakapan Aktif</p>
                  <h4 className="font-extrabold text-sm text-[#000f22] dark:text-white mt-0.5">
                    Chat dengan {selectedBookingForChat.customer?.name || 'Pelanggan'}
                  </h4>
                  <p className="text-[10px] text-gray-500 dark:text-slate-400 font-bold mt-0.5">Kode: {selectedBookingForChat.booking_code}</p>
                </div>
                <button 
                  onClick={() => setSelectedBookingForChat(null)}
                  className="w-10 h-10 bg-white dark:bg-[#1f2d47] border-none rounded-xl flex items-center justify-center text-gray-500 cursor-pointer shadow-sm"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              {/* Message history */}
              <div className="flex-grow p-5 overflow-y-auto space-y-4">
                {chatMessages.length === 0 ? (
                  <div className="text-center py-10 text-xs text-gray-400 font-bold">Belum ada percakapan. Kirim pesan untuk memulai.</div>
                ) : (
                  chatMessages.map((item, index) => {
                    const isMe = item.sender_type === 'technician';
                    return (
                      <div key={index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                        <div className={`p-3 max-w-[80%] rounded-2xl text-xs leading-normal font-medium shadow-sm ${
                          isMe 
                            ? 'bg-[#0a2540] text-white rounded-tr-none' 
                            : 'bg-[#efedf0] dark:bg-[#1f2d47] text-[#1b1c1e] dark:text-white rounded-tl-none'
                        }`}>
                          {item.message}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatBottomRef} />
              </div>

              {/* Input row */}
              <form onSubmit={handleSendChat} className="p-4 border-t border-[#efedf0] dark:border-gray-800 bg-white dark:bg-[#111827] flex gap-2">
                <input 
                  type="text" 
                  value={newMsg}
                  onChange={(e) => setNewMsg(e.target.value)}
                  placeholder="Ketik pesan..."
                  className="w-full bg-[#f5f3f6] dark:bg-[#151f32] border border-[#c4c6ce] dark:border-gray-800 rounded-xl px-4 py-2 text-xs font-semibold focus:ring-1 focus:ring-[#fdc003] outline-none text-[#1b1c1e] dark:text-white"
                />
                <button 
                  type="submit"
                  className="px-4 py-2 bg-[#fdc003] text-[#6c5000] rounded-xl font-bold text-xs cursor-pointer border-none"
                >
                  Kirim
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Camera Simulation and File Upload */}
      <AnimatePresence>
        {selectedBookingForPhoto && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-5">
            <div className="bg-white dark:bg-[#111827] rounded-3xl p-6 text-center max-w-md w-full shadow-2xl border border-slate-100 dark:border-gray-800 space-y-4">
              
              <div className="w-12 h-12 bg-amber-50 dark:bg-amber-950/20 rounded-full flex items-center justify-center mx-auto mb-1">
                <span className="material-symbols-outlined text-amber-500 text-2xl">photo_camera</span>
              </div>

              <h4 className="font-extrabold text-base text-[#000f22] dark:text-white">
                {photoUploadMode === 'before' ? 'Unggah Foto Sebelum Pengerjaan' : 'Unggah Foto Sesudah Pengerjaan'}
              </h4>
              <p className="text-xs text-gray-500 dark:text-slate-400 leading-normal">
                {photoUploadMode === 'before' 
                  ? 'Silakan ambil atau pilih foto kondisi kendaraan SEBELUM dilakukan pengerjaan.' 
                  : 'Silakan ambil atau pilih foto kondisi kendaraan SESUDAH selesai dilakukan pengerjaan.'}
              </p>

              <div className="flex justify-center">
                {photoUploadMode === 'before' ? (
                  /* Before Photo */
                  <div className="space-y-2 w-full max-w-[200px]">
                    <p className="text-[10px] font-black uppercase text-gray-450 dark:text-slate-500">Foto Sebelum</p>
                    {beforePhotoPreview ? (
                      <div className="relative rounded-2xl overflow-hidden shadow-inner border dark:border-gray-800 h-32">
                        <img src={beforePhotoPreview} alt="Sebelum" className="w-full h-full object-cover" />
                        <button 
                          onClick={() => {
                            setBeforePhotoFile(null);
                            setBeforePhotoPreview(null);
                          }}
                          className="absolute top-1 right-1 bg-red-100 hover:bg-red-200 text-red-650 w-6 h-6 rounded-full flex items-center justify-center shadow-md cursor-pointer border-none"
                        >
                          <span className="material-symbols-outlined text-xs">close</span>
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-gray-400 rounded-2xl p-4 cursor-pointer h-32 hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-all">
                        <span className="material-symbols-outlined text-xl text-gray-400 mb-1">add_a_photo</span>
                        <span className="text-[8px] text-gray-500 font-bold uppercase tracking-wider text-center">Foto Sebelum</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handlePhotoSelectBefore} 
                          className="hidden" 
                        />
                      </label>
                    )}
                  </div>
                ) : (
                  /* After Photo */
                  <div className="space-y-2 w-full max-w-[200px]">
                    <p className="text-[10px] font-black uppercase text-gray-450 dark:text-slate-500">Foto Sesudah</p>
                    {afterPhotoPreview ? (
                      <div className="relative rounded-2xl overflow-hidden shadow-inner border dark:border-gray-800 h-32">
                        <img src={afterPhotoPreview} alt="Sesudah" className="w-full h-full object-cover" />
                        <button 
                          onClick={() => {
                            setAfterPhotoFile(null);
                            setAfterPhotoPreview(null);
                          }}
                          className="absolute top-1 right-1 bg-red-100 hover:bg-red-200 text-red-650 w-6 h-6 rounded-full flex items-center justify-center shadow-md cursor-pointer border-none"
                        >
                          <span className="material-symbols-outlined text-xs">close</span>
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-gray-400 rounded-2xl p-4 cursor-pointer h-32 hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-all">
                        <span className="material-symbols-outlined text-xl text-gray-400 mb-1">add_a_photo</span>
                        <span className="text-[8px] text-gray-500 font-bold uppercase tracking-wider text-center">Foto Sesudah</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handlePhotoSelectAfter} 
                          className="hidden" 
                        />
                      </label>
                    )}
                  </div>
                )}
              </div>

              {/* Footer Buttons */}
              <div className="flex gap-3 pt-2">
                <button 
                  disabled={uploadingPhoto}
                  onClick={() => {
                    setSelectedBookingForPhoto(null);
                    setPhotoUploadMode(null);
                    setBeforePhotoFile(null);
                    setBeforePhotoPreview(null);
                    setAfterPhotoFile(null);
                    setAfterPhotoPreview(null);
                  }}
                  className="flex-1 py-3 bg-[#f5f3f6] dark:bg-gray-800 text-[#43474d] dark:text-white rounded-xl font-bold text-xs cursor-pointer border-none hover:bg-slate-100 dark:hover:bg-gray-700"
                >
                  Batal
                </button>
                <button 
                  disabled={uploadingPhoto || (photoUploadMode === 'before' ? !beforePhotoFile : !afterPhotoFile)}
                  onClick={handleUploadPhotoAndSubmit}
                  className="flex-grow py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs cursor-pointer border-none disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {uploadingPhoto ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-sm">upload</span>
                      <span>{photoUploadMode === 'before' ? 'Mulai Pengerjaan' : 'Selesaikan Tugas'}</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Customer Real-time Location Tracking */}
      <AnimatePresence>
        {selectedBookingForTracking && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-5">
            <div className="bg-white dark:bg-[#111827] rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 dark:border-gray-800 space-y-4">
              
              <div className="flex justify-between items-center pb-2 border-b border-slate-105 dark:border-gray-800">
                <h4 className="font-extrabold text-base text-[#000f22] dark:text-white">
                  Lacak Lokasi Pelanggan
                </h4>
                <button 
                  onClick={() => setSelectedBookingForTracking(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-white bg-transparent border-none cursor-pointer p-1"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              {(!selectedBookingForTracking.latitude || !selectedBookingForTracking.longitude || (Number(selectedBookingForTracking.latitude) === 0 && Number(selectedBookingForTracking.longitude) === 0)) ? (
                <div className="text-center py-6 space-y-3">
                  <div className="w-14 h-14 bg-red-50 dark:bg-red-950/20 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="material-symbols-outlined text-red-500 text-3xl">gps_off</span>
                  </div>
                  <h5 className="font-extrabold text-sm text-[#000f22] dark:text-white">Pelanggan Tidak Dapat Dilacak</h5>
                  <p className="text-xs text-gray-505 dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
                    Customer tidak dapat dilacak karena GPS mati atau di luar jaringan.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Simulated Map Background */}
                  <div className="relative w-full h-48 rounded-2xl overflow-hidden border border-slate-200 dark:border-gray-800 bg-slate-100">
                    <div 
                      className="w-full h-full grayscale-[0.1] brightness-[1.01] dark:brightness-[0.85] transition-all" 
                      style={{ 
                        backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuD90iPn_p56sjSnZ0vwHyoBd07vLcuHPcArqDh3m0ku8XqdOGUw9z_TbF0kT98dV1a53CTJkoeIOLRvq7aGrNfLNNFB-zx15LDNCyiCYN_0Id64yu7zV3LnE0DNHCcnbGzTmpBXjNyLLOfVftyfkZh3rJmcIU-SzCnCriVti9GeG2LKndKXQ49v6J9VZP9MevH_EuxpjkmxOgfXDYAYFZHWmQ--x3CTM_hrjQwmK53ZULDCtkRwPH1sU4e9eGMSaXQYmKPJkzj9q_17')",
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}
                    />
                    
                    {/* Pin Customer */}
                    <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center">
                      <div className="bg-[#fdc003] text-[#6c5000] p-2 rounded-full shadow-lg mb-1 ring-4 ring-white/50 animate-bounce">
                        <span className="material-symbols-outlined block text-[18px]">person_pin_circle</span>
                      </div>
                      <div className="bg-[#0a2540] dark:bg-slate-900 text-white px-2 py-0.5 rounded-full shadow-sm">
                        <p className="text-[8px] font-bold tracking-wider uppercase font-extrabold">Pelanggan</p>
                      </div>
                    </div>
                  </div>

                  {/* Customer Location Info */}
                  <div className="bg-[#f8f7f9] dark:bg-[#151f32]/60 p-4 rounded-2xl space-y-2.5 text-xs font-semibold">
                    <div className="flex justify-between items-center text-slate-650 dark:text-slate-350">
                      <span className="text-gray-500">Nama Pelanggan</span>
                      <span className="text-[#0a2540] dark:text-white font-extrabold">{selectedBookingForTracking.customer?.name || 'Pelanggan'}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-655 dark:text-slate-350">
                      <span className="text-gray-500">Koordinat GPS</span>
                      <span className="font-mono text-slate-700 dark:text-slate-300">
                        {Number(selectedBookingForTracking.latitude).toFixed(6)}, {Number(selectedBookingForTracking.longitude).toFixed(6)}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1 pt-1.5 border-t border-slate-200/50 dark:border-gray-800 text-slate-650 dark:text-slate-350">
                      <span className="text-gray-500">Alamat Layanan</span>
                      <span className="leading-relaxed font-bold text-slate-700 dark:text-slate-200">
                        {selectedBookingForTracking.service_address || 'Alamat tidak tertera'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <button 
                onClick={() => setSelectedBookingForTracking(null)}
                className="w-full py-3 bg-[#f5f3f6] dark:bg-gray-800 text-[#43474d] dark:text-white rounded-xl font-bold text-xs cursor-pointer border-none hover:bg-slate-100 dark:hover:bg-gray-700"
              >
                Tutup
              </button>

            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Profile Modal for Technician */}
      {showEditProfileModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-5">
          <form onSubmit={handleEditProfileSubmit} className="bg-white dark:bg-[#111827] rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-slate-100 dark:border-gray-800 space-y-4 animate-scale-in text-[#1b1c1e] dark:text-[#f3f4f6]">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-extrabold text-[#000f22] dark:text-white">Edit Profil Teknisi</h3>
              <button 
                type="button" 
                onClick={() => setShowEditProfileModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 dark:bg-gray-800 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors border-none"
              >
                <span className="material-symbols-outlined text-[16px]">close</span>
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Name Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-extrabold text-[#74777e] dark:text-slate-450 uppercase tracking-wider">Nama Lengkap</label>
                <input 
                  type="text" 
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Contoh: Alex Sterling"
                  className="bg-[#f5f3f6] dark:bg-[#1a2333] border border-[#e3e2e5] dark:border-gray-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:ring-1 focus:ring-[#fdc003] outline-none w-full text-[#1b1c1e] dark:text-white"
                  required
                />
              </div>

              {/* Custom File Upload (Gallery / Camera) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-extrabold text-[#74777e] dark:text-slate-450 uppercase tracking-wider">Unggah Foto (Kamera / Galeri)</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={handleProfileFileChange}
                  className="bg-[#f5f3f6] dark:bg-[#1a2333] border border-[#e3e2e5] dark:border-gray-800 rounded-xl px-3.5 py-2 text-[11px] outline-none w-full cursor-pointer file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-[#fdc003] file:text-[#6c5000]"
                />
              </div>

              {/* Preview */}
              {editAvatar && (
                <div className="flex items-center gap-2 mt-1 bg-slate-50 dark:bg-[#1a2333]/50 p-2 rounded-lg border border-dashed border-[#e3e2e5] dark:border-gray-800">
                  <img 
                    src={editAvatar} 
                    className="w-8 h-8 rounded-full object-cover shrink-0" 
                    alt="Preview" 
                    onError={(e)=>{
                      e.currentTarget.src='https://ui-avatars.com/api/?name=Teknisi&background=1B2337&color=F0C419';
                    }} 
                  />
                  <span className="text-[9px] text-[#74777e] dark:text-slate-400 font-semibold truncate">Preview Foto Profil</span>
                </div>
              )}
            </div>

            <div className="flex gap-2.5 pt-3">
              <button 
                type="button"
                onClick={() => setShowEditProfileModal(false)}
                className="flex-1 py-3 bg-slate-100 dark:bg-gray-800 hover:bg-slate-200 text-slate-705 dark:text-slate-300 rounded-xl font-bold text-xs cursor-pointer active:scale-95 transition-all text-center border-none"
              >
                Batal
              </button>
              <button 
                type="submit"
                disabled={isSavingProfile}
                className="flex-1 py-3 bg-[#fdc003] hover:bg-[#fabd00] text-[#6c5000] rounded-xl font-bold text-xs cursor-pointer shadow-md active:scale-95 transition-all text-center border-none"
              >
                {isSavingProfile ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Toast Alert Pop Up */}
      <AnimatePresence>
        {activeToast && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            onClick={() => {
              setActiveToast(null);
              setActiveTab('notifikasi');
            }}
            className="fixed top-6 left-1/2 -translate-x-1/2 w-80 bg-[#0a2540] text-white p-4 rounded-2xl shadow-2xl z-50 flex items-center gap-3 cursor-pointer border border-white/10"
          >
            <div className="w-8 h-8 rounded-lg bg-[#fdc003] text-[#000f22] flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-lg animate-bounce">notifications_active</span>
            </div>
            <div>
              <h5 className="font-extrabold text-xs">{activeToast.title}</h5>
              <p className="text-[10px] text-slate-300 font-medium leading-relaxed mt-0.5">{activeToast.description}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
    </div>
  );
}
