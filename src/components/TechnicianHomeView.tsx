import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import api from '../services/api';

interface TechnicianHomeViewProps {
  darkMode: boolean;
  onToggleTheme: () => void;
  technician: any;
  onLogout: () => void;
}

export default function TechnicianHomeView({ darkMode, onToggleTheme, technician, onLogout }: TechnicianHomeViewProps) {
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Chat state
  const [selectedBookingForChat, setSelectedBookingForChat] = useState<any | null>(null);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [pollingChat, setPollingChat] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Camera upload state
  const [selectedBookingForPhoto, setSelectedBookingForPhoto] = useState<any | null>(null);
  const [photoType, setPhotoType] = useState<'before' | 'after'>('before');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Simulated GPS state
  const [currentLat, setCurrentLat] = useState(-6.200000);
  const [currentLng, setCurrentLng] = useState(106.816666);
  const [simulating, setSimulating] = useState(false);

  const fetchJobs = async (showLoader = true) => {
    try {
      if (showLoader) setLoading(true);
      const response = await api.get('/technician/bookings');
      setBookings(response.data || []);
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
    // Target location is customer's location or slightly offset if null
    const targetLat = Number(activeBooking.latitude) || -6.210000;
    const targetLng = Number(activeBooking.longitude) || 106.825000;

    const locInterval = setInterval(async () => {
      // Step towards destination coordinates
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

      // Post updated location to server
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
      // Fetch immediately
      const response = await api.get(`/bookings/${selectedBookingForChat.id}/chat`);
      setChatMessages(response.data || []);
    } catch (err) {
      console.log('Chat send error:', err);
    }
  };

  const handleUpdateStatus = async (bookingId: number, nextStatus: 'on_way' | 'in_progress' | 'completed') => {
    if (nextStatus === 'in_progress') {
      // Need before photo
      const booking = bookings.find(b => b.id === bookingId);
      setSelectedBookingForPhoto(booking);
      setPhotoType('before');
      setPhotoFile(null);
      setPhotoPreview(null);
      return;
    }

    if (nextStatus === 'completed') {
      // Need after photo
      const booking = bookings.find(b => b.id === bookingId);
      setSelectedBookingForPhoto(booking);
      setPhotoType('after');
      setPhotoFile(null);
      setPhotoPreview(null);
      return;
    }

    // Otherwise update status directly (for 'on_way')
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

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleUploadPhotoAndSubmit = async () => {
    if (!photoFile || !selectedBookingForPhoto) return;

    try {
      setUploadingPhoto(true);
      const formData = new FormData();
      const statusToUpdate = photoType === 'before' ? 'in_progress' : 'completed';
      formData.append('status', statusToUpdate);
      formData.append(photoType === 'before' ? 'before_photo' : 'after_photo', photoFile);

      await api.post(`/technician/bookings/${selectedBookingForPhoto.id}/status`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setSelectedBookingForPhoto(null);
      setPhotoFile(null);
      setPhotoPreview(null);
      fetchJobs(false);
    } catch (err: any) {
      alert('Gagal mengunggah foto: ' + (err?.response?.data?.message || err.message));
    } finally {
      setUploadingPhoto(false);
    }
  };

  const activeJobs = bookings.filter(b => ['confirmed', 'assigned', 'on_way', 'in_progress'].includes(b.status));
  const historyJobs = bookings.filter(b => ['completed', 'cancelled'].includes(b.status));

  const displayStatus = (status: string) => {
    switch (status) {
      case 'confirmed': return { text: 'Terkonfirmasi', class: 'bg-[#d2e4ff] text-[#0a2540] dark:bg-[#0a2540] dark:text-[#d2e4ff]' };
      case 'on_way': return { text: 'Perjalanan', class: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300' };
      case 'in_progress': return { text: 'Dikerjakan', class: 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300' };
      case 'completed': return { text: 'Selesai', class: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300' };
      case 'cancelled': return { text: 'Batal', class: 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300' };
      default: return { text: status, class: 'bg-gray-100 text-gray-800' };
    }
  };

  return (
    <div className="bg-[#faf9fb] dark:bg-[#0a0f1d] min-h-screen text-[#1b1c1e] dark:text-[#f3f4f6] flex flex-col pb-20 select-none">
      
      {/* Header Profile Dashboard */}
      <header className="bg-white dark:bg-[#111827] border-b border-[#efedf0] dark:border-gray-800/80 p-5 sticky top-0 z-40 shadow-sm transition-all">
        <div className="max-w-screen-xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 border-2 border-[#fdc003] shadow-md relative">
              <img 
                src={technician?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(technician?.name || 'Teknisi')}&background=1B2337&color=F0C419`} 
                alt={technician?.name} 
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="font-extrabold text-sm text-[#000f22] dark:text-white leading-tight">{technician?.name || 'Ahmad Subarkah'}</h2>
                <span className="bg-[#fdc003] text-[#6c5000] text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md leading-none shadow-sm">Teknisi</span>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex items-center gap-0.5 text-[#fdc003]">
                  <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                  <span className="text-[10px] font-black text-[#43474d] dark:text-slate-300">{Number(technician?.rating || 5.0).toFixed(1)}</span>
                </div>
                <span className="text-gray-300 dark:text-gray-700">•</span>
                <span className="text-[10px] text-gray-500 dark:text-slate-400 font-bold">{technician?.total_orders || 0} Selesai</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={onToggleTheme}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#1a2333] dark:hover:bg-[#253046] text-[#000f22] dark:text-white transition-colors cursor-pointer border-none"
            >
              <span className="material-symbols-outlined text-[20px]">{darkMode ? 'light_mode' : 'dark_mode'}</span>
            </button>
            <button 
              onClick={onLogout}
              className="p-2 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 transition-colors cursor-pointer border-none"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* GPS Simulation Active Overlay Info */}
      {simulating && (
        <div className="bg-blue-50 dark:bg-blue-950/20 border-b border-blue-100 dark:border-blue-900/40 p-2.5 text-center text-xs font-semibold text-blue-800 dark:text-blue-300 flex items-center justify-center gap-2">
          <span className="material-symbols-outlined text-sm animate-ping text-blue-500">my_location</span>
          <span>Sinyal GPS Aktif: Mengirimkan kordinat lokasi real-time Anda ke pembooking...</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-grow max-w-md mx-auto w-full p-4 space-y-4">
        
        {/* Navigation Tab Swapper */}
        <div className="flex bg-[#efedf0] dark:bg-[#151f32] p-1 rounded-2xl border border-black/5 dark:border-white/5 shadow-inner">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex-grow py-3 text-xs font-bold rounded-xl transition-all cursor-pointer border-none ${
              activeTab === 'active'
                ? 'bg-white dark:bg-[#1f2d47] text-[#0a2540] dark:text-white shadow-md'
                : 'text-gray-500 dark:text-slate-400'
            }`}
          >
            Tugas Aktif ({activeJobs.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-grow py-3 text-xs font-bold rounded-xl transition-all cursor-pointer border-none ${
              activeTab === 'history'
                ? 'bg-white dark:bg-[#1f2d47] text-[#0a2540] dark:text-white shadow-md'
                : 'text-gray-500 dark:text-slate-400'
            }`}
          >
            Riwayat Selesai ({historyJobs.length})
          </button>
        </div>

        {/* Loading Indicator */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-10 h-10 border-4 border-[#fdc003] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs text-gray-500 font-bold">Memuat tugas...</p>
          </div>
        )}

        {/* Booking list */}
        {!loading && (
          <div className="space-y-4">
            {activeTab === 'active' && activeJobs.length === 0 && (
              <div className="text-center py-16 bg-white dark:bg-[#111827] rounded-3xl p-6 shadow-sm border border-[#efedf0] dark:border-gray-800/40">
                <span className="material-symbols-outlined text-gray-300 dark:text-gray-700 text-6xl block mb-2">assignment_turned_in</span>
                <h3 className="font-extrabold text-base text-[#0a2540] dark:text-white">Tidak ada tugas aktif</h3>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 leading-relaxed">Saat ini Anda tidak memiliki tugas pencucian aktif yang perlu dikerjakan.</p>
              </div>
            )}

            {activeTab === 'history' && historyJobs.length === 0 && (
              <div className="text-center py-16 bg-white dark:bg-[#111827] rounded-3xl p-6 shadow-sm border border-[#efedf0] dark:border-gray-800/40">
                <span className="material-symbols-outlined text-gray-300 dark:text-gray-700 text-6xl block mb-2">history_toggle_off</span>
                <h3 className="font-extrabold text-base text-[#0a2540] dark:text-white">Belum ada riwayat tugas</h3>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Daftar riwayat pengerjaan tugas Anda akan muncul di sini.</p>
              </div>
            )}

            {/* Render Job Cards */}
            {((activeTab === 'active' ? activeJobs : historyJobs)).map((job) => {
              const statusInfo = displayStatus(job.status);
              const isHomeService = job.service_type === 'home';
              const formattedPrice = Number(job.total_amount).toLocaleString('id-ID');
              const customerName = job.customer?.name || job.vehicle_name || 'Pelanggan';
              const customerPhone = job.customer?.phone || '08123456789';

              return (
                <div 
                  key={job.id} 
                  className="bg-white dark:bg-[#111827] rounded-[2rem] p-5 shadow-md border border-[#efedf0] dark:border-gray-800/40 space-y-4 relative overflow-hidden transition-transform duration-200"
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

                  {/* Customer and Package Detail Block */}
                  <div className="space-y-2">
                    <div>
                      <h4 className="font-extrabold text-[#000f22] dark:text-white text-base leading-tight">{customerName}</h4>
                      <p className="text-[11px] text-gray-500 dark:text-slate-400 font-bold mt-0.5">{job.package?.name || 'Paket Layanan Cuci'}</p>
                    </div>

                    <div className="bg-[#f8f7f9] dark:bg-[#151f32]/60 p-3.5 rounded-2xl space-y-2 text-xs font-semibold">
                      <div className="flex items-center gap-2 text-slate-600 dark:text-slate-350">
                        <span className="material-symbols-outlined text-[18px]">calendar_today</span>
                        <span>{new Date(job.scheduled_at).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })} • {new Date(job.scheduled_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</span>
                      </div>
                      
                      {isHomeService && (
                        <div className="flex items-start gap-2 text-slate-650 dark:text-slate-300">
                          <span className="material-symbols-outlined text-[18px] shrink-0">location_on</span>
                          <span className="leading-relaxed">{job.service_address || 'Alamat tidak tertera'}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 pt-1 border-t border-slate-200/50 dark:border-gray-800">
                        <span className="material-symbols-outlined text-[18px] text-[#785900] dark:text-[#fdc003]">payments</span>
                        <span>Biaya: <strong className="text-[#0a2540] dark:text-white font-extrabold">Rp {formattedPrice}</strong> ({job.payment_status === 'paid' ? 'LUNAS' : 'BELUM BAYAR'})</span>
                      </div>
                    </div>
                  </div>

                  {/* Photos Showcase (if uploaded) */}
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

                  {/* Actions buttons */}
                  {activeTab === 'active' && (
                    <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-gray-800">
                      
                      {/* Communications button */}
                      <a 
                        href={`tel:${customerPhone}`}
                        className="w-11 h-11 bg-[#f5f3f6] dark:bg-[#1a2333] rounded-xl flex items-center justify-center text-[#0a2540] dark:text-white border border-slate-200/50 dark:border-none cursor-pointer hover:bg-slate-100"
                      >
                        <span className="material-symbols-outlined text-[18px]">call</span>
                      </a>
                      
                      <button 
                        onClick={() => setSelectedBookingForChat(job)}
                        className="w-11 h-11 bg-[#f5f3f6] dark:bg-[#1a2333] rounded-xl flex items-center justify-center text-[#0a2540] dark:text-white border border-slate-200/50 dark:border-none cursor-pointer hover:bg-slate-100"
                      >
                        <span className="material-symbols-outlined text-[18px]">chat</span>
                      </button>

                      {/* Main Process Button */}
                      {job.status === 'confirmed' && (
                        <button
                          onClick={() => handleUpdateStatus(job.id, 'on_way')}
                          className="flex-grow py-3 bg-[#fdc003] hover:bg-[#fabd00] text-[#6c5000] rounded-xl font-bold text-xs uppercase tracking-wider shadow-md cursor-pointer border-none"
                        >
                          Mulai Perjalanan
                        </button>
                      )}

                      {job.status === 'on_way' && (
                        <button
                          onClick={() => handleUpdateStatus(job.id, 'in_progress')}
                          className="flex-grow py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-md cursor-pointer border-none"
                        >
                          Sampai & Mulai Kerja
                        </button>
                      )}

                      {job.status === 'in_progress' && (
                        <button
                          onClick={() => handleUpdateStatus(job.id, 'completed')}
                          className="flex-grow py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-md cursor-pointer border-none"
                        >
                          Pekerjaan Selesai
                        </button>
                      )}

                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

      </main>

      {/* Modal: Interactive Live Chat Dialog */}
      <AnimatePresence>
        {selectedBookingForChat && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-50"
          >
            <motion.div 
              initial={{ y: 200 }}
              animate={{ y: 0 }}
              exit={{ y: 200 }}
              className="bg-white dark:bg-[#111827] rounded-t-[2rem] w-full max-w-md shadow-2xl flex flex-col h-[75vh] border-t border-[#efedf0] dark:border-gray-800"
            >
              {/* Header Chat */}
              <div className="p-4 border-b border-[#efedf0] dark:border-gray-800 flex justify-between items-center bg-[#f5f3f6] dark:bg-[#1f2937] rounded-t-[2rem]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></span>
                  <p className="font-bold text-sm text-[#0a2540] dark:text-white">
                    Chat dengan {selectedBookingForChat.customer?.name || 'Pelanggan'}
                  </p>
                </div>
                <button 
                  onClick={() => setSelectedBookingForChat(null)}
                  className="w-8 h-8 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center border border-none font-bold text-[#000f22] dark:text-white cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>

              {/* Chat Message Lists */}
              <div className="flex-grow p-4 overflow-y-auto space-y-3 bg-[#faf9fb] dark:bg-[#0a0f1d]">
                {chatMessages.length === 0 && (
                  <div className="text-center py-10 text-xs text-gray-400 font-bold">Belum ada percakapan. Kirim pesan untuk memulai.</div>
                )}
                {chatMessages.map((item, index) => {
                  const isMe = item.sender_type === 'technician';
                  return (
                    <div key={index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`p-3 max-w-[80%] rounded-2xl text-xs leading-normal font-medium shadow-sm ${
                        isMe 
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
            <div className="bg-white dark:bg-[#111827] rounded-3xl p-6 text-center max-w-xs w-full shadow-2xl border border-slate-100 dark:border-gray-800">
              
              <div className="w-14 h-14 bg-amber-50 dark:bg-amber-950/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="material-symbols-outlined text-amber-500 text-3xl">photo_camera</span>
              </div>

              <h4 className="font-extrabold text-base text-[#000f22] dark:text-white mb-1">
                Foto {photoType === 'before' ? 'Sebelum Kerja' : 'Setelah Selesai'}
              </h4>
              <p className="text-xs text-gray-500 dark:text-slate-400 mb-5 leading-normal">
                Silakan ambil gambar kendaraan pelanggan sebagai laporan pekerjaan sebelum/sesudah dicuci.
              </p>

              {/* Image Input Trigger */}
              <div className="space-y-4">
                {photoPreview ? (
                  <div className="relative rounded-2xl overflow-hidden shadow-inner border dark:border-gray-800">
                    <img src={photoPreview} alt="Preview" className="w-full h-40 object-cover" />
                    <button 
                      onClick={() => {
                        setPhotoFile(null);
                        setPhotoPreview(null);
                      }}
                      className="absolute top-2 right-2 bg-red-650 bg-red-100 hover:bg-red-200 text-red-600 w-8 h-8 rounded-full flex items-center justify-center shadow-md cursor-pointer border-none"
                    >
                      <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-550 rounded-2xl p-6 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-all">
                    <span className="material-symbols-outlined text-3xl text-gray-400 mb-1">add_a_photo</span>
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Pilih / Ambil Foto</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handlePhotoSelect} 
                      className="hidden" 
                    />
                  </label>
                )}

                {/* Footer Buttons */}
                <div className="flex gap-3 pt-2">
                  <button 
                    disabled={uploadingPhoto}
                    onClick={() => {
                      setSelectedBookingForPhoto(null);
                      setPhotoFile(null);
                      setPhotoPreview(null);
                    }}
                    className="flex-1 py-3 bg-[#f5f3f6] dark:bg-gray-800 text-[#43474d] dark:text-white rounded-xl font-bold text-xs cursor-pointer border-none hover:bg-slate-100 dark:hover:bg-gray-700"
                  >
                    Batal
                  </button>
                  <button 
                    disabled={!photoFile || uploadingPhoto}
                    onClick={handleUploadPhotoAndSubmit}
                    className="flex-grow py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs cursor-pointer border-none disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {uploadingPhoto ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-sm">upload</span>
                        <span>Unggah & Lanjutkan</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}
      </AnimatePresence>
      
    </div>
  );
}
