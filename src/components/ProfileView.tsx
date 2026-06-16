import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Car } from '../types';
import FAQSubView from './FAQSubView';
import api from '../services/api';
import LocationModal from './LocationModal';
import { BookingState } from '../types';


interface ProfileViewProps {
  darkMode: boolean;
  onToggleTheme: () => void;
  userName: string;
  userAvatar: string;
  userEmail?: string;
  onUpdateProfile: (name: string, avatar: string) => void;
  vehicles: Car[];
  onAddVehicle: (vehicle: Omit<Car, 'id'>) => void;
  onUpdateVehicle?: (id: string, updated: Partial<Car>) => void;
  onDeleteVehicle?: (id: string) => void;
  onLogout: () => void;
  onNavigate: (tab: 'home' | 'history' | 'alerts' | 'profile') => void;
  booking: BookingState;
  onSaveLocation: (locationName: string, pickupLocation: string, lat?: number, lon?: number) => void;
}

export default function ProfileView({ 
  darkMode, 
  onToggleTheme, 
  userName, 
  userAvatar, 
  userEmail,
  onUpdateProfile, 
  vehicles, 
  onAddVehicle, 
  onUpdateVehicle,
  onDeleteVehicle,
  onLogout, 
  onNavigate,
  booking,
  onSaveLocation
}: ProfileViewProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [vehBrand, setVehBrand] = useState('');
  const [vehModel, setVehModel] = useState('');
  const [vehColor, setVehColor] = useState('');
  const [vehYear, setVehYear] = useState('');
  const [vehPlate, setVehPlate] = useState('');
  const [vehType, setVehType] = useState<'mobil' | 'motor'>('mobil');

  // Vehicle Edit state
  const [showEditVehModal, setShowEditVehModal] = useState(false);
  const [selectedVehToEdit, setSelectedVehToEdit] = useState<Car | null>(null);
  const [editVehBrand, setEditVehBrand] = useState('');
  const [editVehModel, setEditVehModel] = useState('');
  const [editVehColor, setEditVehColor] = useState('');
  const [editVehYear, setEditVehYear] = useState('');
  const [editVehPlate, setEditVehPlate] = useState('');
  const [editVehType, setEditVehType] = useState<'mobil' | 'motor'>('mobil');

  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editName, setEditName] = useState(userName);
  const [editAvatar, setEditAvatar] = useState(userAvatar);

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleOpenEditModal = () => {
    setEditName(userName);
    setEditAvatar(userAvatar);
    setShowEditProfileModal(true);
  };

  const handleEditProfileSubmit = async (
    e: React.FormEvent
  ) => {
  
    e.preventDefault();
  
    if (!editName.trim()) return;
  
    try {
  
      const response =
        await api.put(
          '/profile',
          {
            name: editName,
            profile_photo: editAvatar
          }
        );
  
      onUpdateProfile(
  
        response.data.user.name,
  
        response.data.user.profile_photo
  
      );
  
      localStorage.setItem(
  
        'user',
  
        JSON.stringify(
          response.data.user
        )
  
      );
  
      setShowEditProfileModal(false);
  
    } catch (error) {
  
      console.log(error);
  
      alert(
        'Gagal update profile'
      );
  
    }
  
  };

  const [showChangePwModal, setShowChangePwModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwSuccessMsg, setPwSuccessMsg] = useState('');

  const handleChangePasswordSubmit = async (
    e: React.FormEvent
  ) => {
  
    e.preventDefault();
  
    setPwError('');
    setPwSuccessMsg('');
  
    if (newPassword.length < 6) {
  
      setPwError(
        'Kata sandi baru minimal 6 karakter.'
      );
  
      return;
    }
  
    if (newPassword !== confirmNewPassword) {
  
      setPwError(
        'Konfirmasi kata sandi baru tidak cocok.'
      );
  
      return;
    }
  
    try {
  
      await api.post('/change-password', {
        current_password: currentPassword,
        new_password: newPassword
      });
  
      setPwSuccessMsg(
        'Kata sandi berhasil diperbarui!'
      );
  
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
  
      setTimeout(() => {
  
        setShowChangePwModal(false);
        setPwSuccessMsg('');
  
      }, 1500);
  
    } catch (err: any) {
  
      setPwError(
        err?.response?.data?.message ||
        'Gagal mengubah kata sandi.'
      );
  
    }
  
  };

  const [showTermsModal, setShowTermsModal] = useState(false);
  const [activeTermsTab, setActiveTermsTab] = useState<'service' | 'privacy' | 'refund'>('service');
  const [notifToggle, setNotifToggle] = useState(true);
  const [subView, setSubView] = useState<'main' | 'notifications' | 'faq'>('main');



  

  useEffect(() => {

    const handleHashCheck = () => {
  
      const h = window.location.hash;
  
      if (h === '#/faq') {
  
        setSubView('faq');
  
      } else if (
        h === '#/notifications'
      ) {
  
        setSubView('notifications');
  
      } else {
  
        setSubView('main');
  
      }
  
    };
  
    window.addEventListener(
      'hashchange',
      handleHashCheck
    );
  
    handleHashCheck();
  

  
    return () => {
  
      window.removeEventListener(
        'hashchange',
        handleHashCheck
      );
  
    };
  
  }, []);

  const [showSavedToast, setShowSavedToast] = useState(false);
  const [notifEvents, setNotifEvents] = useState(() => {
    const saved = localStorage.getItem('notifEvents');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      techArrived: true,
      serviceFinished: true,
      bookingConfirmed: true,
      techOnWay: true,
      serviceStarted: true,
      paymentSuccess: true,
      promoOffers: true
    };
  });

  const handleAddSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();
    try {
      if (!vehBrand.trim()) {
        alert('Merk kendaraan wajib diisi');
        return;
      }
      if (!vehModel.trim()) {
        alert('Model kendaraan wajib diisi');
        return;
      }
      if (!vehPlate.trim()) {
        alert('Plat kendaraan wajib diisi');
        return;
      }

      await onAddVehicle({
        name: `${vehBrand.trim()} ${vehModel.trim()}`,
        brand: vehBrand.trim(),
        model: vehModel.trim(),
        color: vehColor.trim(),
        year: vehYear.trim(),
        plate: vehPlate.trim(),
        type: vehType
      });

      setVehBrand('');
      setVehModel('');
      setVehColor('');
      setVehYear('');
      setVehPlate('');
      setShowAddModal(false);
    } catch (error: any) {
      console.log(error);
    }
  };

  const handleOpenEditVehicleModal = (veh: Car) => {
    setSelectedVehToEdit(veh);
    setEditVehBrand(veh.brand || '');
    setEditVehModel(veh.model || '');
    setEditVehColor(veh.color || '');
    setEditVehYear(veh.year ? String(veh.year) : '');
    setEditVehPlate(veh.plate);
    setEditVehType(veh.type);
    setShowEditVehModal(true);
  };

  const handleEditVehSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();
    if (
      !selectedVehToEdit ||
      !editVehBrand.trim() ||
      !editVehModel.trim() ||
      !editVehPlate.trim()
    ) return;

    try {
      if (onUpdateVehicle) {
        await onUpdateVehicle(selectedVehToEdit.id, {
          name: `${editVehBrand.trim()} ${editVehModel.trim()}`,
          brand: editVehBrand.trim(),
          model: editVehModel.trim(),
          color: editVehColor.trim(),
          year: editVehYear.trim(),
          plate: editVehPlate.trim(),
          type: editVehType
        });
      }

      setShowEditVehModal(false);
      setSelectedVehToEdit(null);
    } catch (error) {
      console.log(error);
    }
  };

  if (subView === 'faq') {
    return (
      <FAQSubView 
        onBack={() => { window.location.hash = ''; }} 
        onNavigate={onNavigate} 
      />
    );
  }

  const handleLogout = async () => {

    try {
  
      await api.post('/logout');
  
    } catch (error) {
  
      console.log(error);
  
    } finally {
  
      // hapus seluruh local storage
      localStorage.clear();
  
      // kembali ke login
      onLogout();
  
    }
  
  };

  const handleSaveNotifSettings = () => {
    localStorage.setItem('notifEvents', JSON.stringify(notifEvents));
    setShowSavedToast(true);
    setTimeout(() => {
      setShowSavedToast(false);
    }, 3000);
  };

  if (subView === 'notifications') {
    return (
      <div className="bg-[#faf9fb] min-h-screen text-[#1b1c1e] pb-24">
        {/* Top App Bar Header */}
        <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-[#efedf0] shadow-sm">
          <div className="flex justify-between items-center w-full px-5 py-3 max-w-screen-xl mx-auto">
            <button 
              type="button"
              onClick={() => { window.location.hash = ''; }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 text-slate-705 text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer select-none"
            >
              <span className="material-symbols-outlined text-[16px]">arrow_back</span>
              Kembali
            </button>
            <h1 className="font-extrabold text-[#0a2540] text-sm tracking-tight">Atur Notifikasi</h1>
            <div className="w-[84px]"></div>
          </div>
        </header>

        <main className="max-w-md mx-auto px-5 pt-6 space-y-6">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#efedf0] space-y-4">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <span className="material-symbols-outlined text-[#785900] text-2xl">notifications_active</span>
              <div>
                <h2 className="text-sm font-black text-[#000f22]">Notifikasi Event</h2>
                <p className="text-[11px] text-[#74777e] mt-0.5">Atur pemberitahuan secara granular untuk kenyamanan pencucian kendaraan Anda.</p>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {/* Event 1: Pemesanan Dikonfirmasi */}
              <div className="py-4 flex items-start justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0"></span>
                    <span className="text-xs font-bold text-[#000f22]">Pemesanan Dikonfirmasi</span>
                  </div>
                  <p className="text-[10px] text-[#74777e] leading-relaxed">Dapatkan pemberitahuan ketika pesanan Anda telah diverifikasi dan dikonfirmasi oleh sistem.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none mt-1">
                  <input 
                    type="checkbox" 
                    checked={notifEvents.bookingConfirmed} 
                    onChange={(e) => setNotifEvents(prev => ({ ...prev, bookingConfirmed: e.target.checked }))}
                    className="sr-only peer cursor-pointer" 
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#fdc003]"></div>
                </label>
              </div>

              {/* Event 2: Pesanan Selesai */}
              <div className="py-4 flex items-start justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
                    <span className="text-xs font-bold text-[#000f22]">Pesanan Selesai</span>
                  </div>
                  <p className="text-[10px] text-[#74777e] leading-relaxed">Notifikasi ketika proses pencucian bodi kendaraan selesai dan siap digunakan kembali.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none mt-1">
                  <input 
                    type="checkbox" 
                    checked={notifEvents.serviceFinished} 
                    onChange={(e) => setNotifEvents(prev => ({ ...prev, serviceFinished: e.target.checked }))}
                    className="sr-only peer cursor-pointer" 
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#fdc003]"></div>
                </label>
              </div>

              {/* Event 3: Rincian Transaksi & Pembayaran */}
              <div className="py-4 flex items-start justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#fdc003] shrink-0"></span>
                    <span className="text-xs font-bold text-[#000f22]">Rincian Transaksi & Pembayaran</span>
                  </div>
                  <p className="text-[10px] text-[#74777e] leading-relaxed">Pengiriman struk otomatis ke notifikasi gawai Anda setiap pembayaran terverifikasi.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none mt-1">
                  <input 
                    type="checkbox" 
                    checked={notifEvents.paymentSuccess} 
                    onChange={(e) => setNotifEvents(prev => ({ ...prev, paymentSuccess: e.target.checked }))}
                    className="sr-only peer cursor-pointer" 
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#fdc003]"></div>
                </label>
              </div>

              {/* Event 4: Promo */}
              <div className="py-4 flex items-start justify-between gap-4">
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-pink-500 shrink-0"></span>
                    <span className="text-xs font-bold text-[#000f22]">Promo</span>
                  </div>
                  <p className="text-[10px] text-[#74777e] leading-relaxed">Dapatkan informasi bonus potongan harga voucher, promo mingguan, dan diskon berkala.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none mt-1">
                  <input 
                    type="checkbox" 
                    checked={notifEvents.promoOffers} 
                    onChange={(e) => setNotifEvents(prev => ({ ...prev, promoOffers: e.target.checked }))}
                    className="sr-only peer cursor-pointer" 
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#fdc003]"></div>
                </label>
              </div>
            </div>

            <div className="pt-4 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleSaveNotifSettings}
                className="w-full py-3 bg-[#fdc003] hover:bg-[#fabd00] text-[#6c5000] rounded-xl font-bold text-xs cursor-pointer shadow-md active:scale-95 transition-all text-center uppercase tracking-wider"
              >
                Simpan Pengaturan
              </button>
            </div>

            {showSavedToast && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-center text-xs font-bold animate-fade-in">
                🎉 Preferensi Notifikasi Anda Berhasil Disimpan!
              </div>
            )}
          </div>
        </main>

        {/* Bottom Nav Bar */}
        <nav className="bg-white/95 backdrop-blur-lg border-t border-[#efedf0] shadow-2lg fixed bottom-0 left-0 w-full z-50">
          <div className="flex justify-around items-center px-4 pb-6 pt-3">
            <button 
              onClick={() => { window.location.hash = ''; onNavigate('home'); }} 
              className="flex flex-col items-center justify-center text-[#74777e] hover:text-[#000f22] transition-colors cursor-pointer text-xs font-semibold gap-1"
            >
              <span className="material-symbols-outlined">home</span>
              <span className="uppercase tracking-wider text-[9px]">Home</span>
            </button>

            <button 
              onClick={() => { window.location.hash = ''; onNavigate('history'); }} 
              className="flex flex-col items-center justify-center text-[#74777e] hover:text-[#000f22] transition-colors cursor-pointer text-xs font-semibold gap-1"
            >
              <span className="material-symbols-outlined">history</span>
              <span className="uppercase tracking-wider text-[9px]">History</span>
            </button>

            <button 
              onClick={() => { window.location.hash = ''; }} 
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

  return (
    <div className="bg-[#faf9fb] min-h-screen text-[#1b1c1e] pb-24">
      {/* Top App Bar Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-[#efedf0] shadow-sm">
        <div className="flex justify-between items-center w-full px-5 py-3 max-w-screen-xl mx-auto">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-[#785900]">person</span>
            <h1 className="font-extrabold text-[#0a2540] text-lg tracking-tight">Akun Saya</h1>
          </div>
          <div className="flex items-center gap-2">
            <button 
              type="button"
              onClick={() => setShowLogoutConfirm(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-650 text-[10px] font-extrabold uppercase hover:bg-red-100 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[14px]">logout</span>
              Keluar
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-5 pt-6 space-y-6">
        
        {/* Profile Card Hero */}
        <section className="flex items-center gap-4 bg-white rounded-2xl p-4 shadow-sm border border-[#efedf0]">
          <div className="relative cursor-pointer select-none" onClick={handleOpenEditModal}>
            <img className="w-16 h-16 rounded-full object-cover border-2 border-[#fdc003]" src={userAvatar} alt="Avatar profile" />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#0a2540] text-white rounded-full flex items-center justify-center border border-white">
              <span className="material-symbols-outlined text-[10px]">edit</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-black text-[#000f22] truncate">{userName}</h2>
            <p className="text-xs text-[#74777e] mt-0.5">{userEmail || 'alex.sterling@premium.com'}</p>

          </div>
          <button 
            type="button"
            onClick={handleOpenEditModal}
            className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-[#74777e] hover:text-[#785900] active:scale-90 transition-transform cursor-pointer shadow-sm select-none"
            title="Edit Profil"
          >
            <span className="material-symbols-outlined text-[18px]">edit_note</span>
          </button>
        </section>



        {/* Registered Vehicles collection */}
        <section className="space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-[#0a2540]">Garasi Kendaraan</h3>
            <button 
              onClick={() => setShowAddModal(true)}
              className="text-[#785900] text-xs font-bold flex items-center gap-1 hover:underline cursor-pointer"
            >
              <span className="material-symbols-outlined text-[16px]">add_circle</span> Tambah
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {vehicles.map(veh => (
              <div key={veh.id} className="bg-white p-4 rounded-xl border border-[#efedf0] flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="bg-[#ffdf9e]/30 w-10 h-10 rounded-lg flex items-center justify-center text-[#785900] shrink-0">
                    <span className="material-symbols-outlined">
                      {veh.type === 'mobil' ? 'directions_car' : 'motorcycle'}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#000f22]">{veh.name}</h4>
                    <p className="text-[10px] text-[#74777e] font-semibold mt-0.5">{veh.plate}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    type="button"
                    onClick={() => handleOpenEditVehicleModal(veh)}
                    className="text-slate-400 hover:text-[#785900] active:scale-95 transition-all cursor-pointer p-1 rounded-lg hover:bg-slate-50 flex items-center justify-center"
                    title="Edit Kendaraan"
                  >
                    <span className="material-symbols-outlined text-[18px]">edit_square</span>
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      if (onDeleteVehicle) {
                        onDeleteVehicle(veh.id);
                      }
                    }}
                    className="text-slate-400 hover:text-red-500 active:scale-95 transition-all cursor-pointer p-1 rounded-lg hover:bg-red-50 flex items-center justify-center"
                    title="Hapus Kendaraan"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Modals trigger UI additions */}
        {showEditVehModal && selectedVehToEdit && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-5">
            <form onSubmit={handleEditVehSubmit} className="bg-white rounded-3xl p-6 w-full max-w-xs shadow-2xl border border-slate-100 space-y-4 animate-scale-in">
              <h3 className="text-base font-bold text-[#000f22]">Edit Kendaraan</h3>
              
              <div className="space-y-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-[#74777e] uppercase">Merk Kendaraan</label>
                  <input 
                    type="text" 
                    value={editVehBrand}
                    onChange={(e) => setEditVehBrand(e.target.value)}
                    placeholder="Contoh: Honda, Toyota"
                    className="bg-[#f5f3f6] border border-[#c4c6ce] rounded-xl px-3 py-2 text-xs font-medium focus:ring-1 focus:ring-[#fdc003] outline-none"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-[#74777e] uppercase">Model / Seri</label>
                  <input 
                    type="text" 
                    value={editVehModel}
                    onChange={(e) => setEditVehModel(e.target.value)}
                    placeholder="Contoh: Beat, Avanza"
                    className="bg-[#f5f3f6] border border-[#c4c6ce] rounded-xl px-3 py-2 text-xs font-medium focus:ring-1 focus:ring-[#fdc003] outline-none"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-[#74777e] uppercase">Warna</label>
                  <input 
                    type="text" 
                    value={editVehColor}
                    onChange={(e) => setEditVehColor(e.target.value)}
                    placeholder="Contoh: Hitam, Putih"
                    className="bg-[#f5f3f6] border border-[#c4c6ce] rounded-xl px-3 py-2 text-xs font-medium focus:ring-1 focus:ring-[#fdc003] outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-[#74777e] uppercase">Tahun</label>
                  <input 
                    type="text" 
                    value={editVehYear}
                    onChange={(e) => setEditVehYear(e.target.value)}
                    placeholder="Contoh: 2021"
                    className="bg-[#f5f3f6] border border-[#c4c6ce] rounded-xl px-3 py-2 text-xs font-medium focus:ring-1 focus:ring-[#fdc003] outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-[#74777e] uppercase">Nomor Plat Polisi</label>
                  <input 
                    type="text" 
                    value={editVehPlate}
                    onChange={(e) => setEditVehPlate(e.target.value)}
                    placeholder="Contoh: B 1234 SCB"
                    className="bg-[#f5f3f6] border border-[#c4c6ce] rounded-xl px-3 py-2 text-xs font-medium focus:ring-1 focus:ring-[#fdc003] outline-none"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-[#74777e] uppercase">Tipe Kendaraan</label>
                  <select 
                    value={editVehType}
                    onChange={(e) => setEditVehType(e.target.value as 'mobil' | 'motor')}
                    className="bg-[#f5f3f6] border border-[#c4c6ce] rounded-xl px-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-[#fdc003] outline-none"
                  >
                    <option value="mobil">🚗 Mobil</option>
                    <option value="motor">🏍️ Motor</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditVehModal(false);
                  }}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold text-xs cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2.5 bg-[#fdc003] text-[#6c5000] rounded-xl font-bold text-xs cursor-pointer shadow-md"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        )}

        {showAddModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-5">
            <form onSubmit={handleAddSubmit} className="bg-white rounded-3xl p-6 w-full max-w-xs shadow-2xl border border-slate-100 space-y-4 animate-scale-in overflow-y-auto max-h-[90vh]">
              <h3 className="text-base font-bold text-[#000f22]">Daftarkan Kendaraan</h3>
              
              <div className="space-y-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-[#74777e] uppercase">Merk Kendaraan</label>
                  <input 
                    type="text" 
                    value={vehBrand}
                    onChange={(e) => setVehBrand(e.target.value)}
                    placeholder="Contoh: Honda, Toyota"
                    className="bg-[#f5f3f6] border border-[#c4c6ce] rounded-xl px-3 py-2 text-xs font-medium focus:ring-1 focus:ring-[#fdc003] outline-none"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-[#74777e] uppercase">Model / Seri</label>
                  <input 
                    type="text" 
                    value={vehModel}
                    onChange={(e) => setVehModel(e.target.value)}
                    placeholder="Contoh: Beat, Avanza"
                    className="bg-[#f5f3f6] border border-[#c4c6ce] rounded-xl px-3 py-2 text-xs font-medium focus:ring-1 focus:ring-[#fdc003] outline-none"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-[#74777e] uppercase">Warna</label>
                  <input 
                    type="text" 
                    value={vehColor}
                    onChange={(e) => setVehColor(e.target.value)}
                    placeholder="Contoh: Hitam, Putih"
                    className="bg-[#f5f3f6] border border-[#c4c6ce] rounded-xl px-3 py-2 text-xs font-medium focus:ring-1 focus:ring-[#fdc003] outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-[#74777e] uppercase">Tahun</label>
                  <input 
                    type="text" 
                    value={vehYear}
                    onChange={(e) => setVehYear(e.target.value)}
                    placeholder="Contoh: 2021"
                    className="bg-[#f5f3f6] border border-[#c4c6ce] rounded-xl px-3 py-2 text-xs font-medium focus:ring-1 focus:ring-[#fdc003] outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-[#74777e] uppercase">Nomor Plat Polisi</label>
                  <input 
                    type="text" 
                    value={vehPlate}
                    onChange={(e) => setVehPlate(e.target.value)}
                    placeholder="Contoh: B 1234 SCB"
                    className="bg-[#f5f3f6] border border-[#c4c6ce] rounded-xl px-3 py-2 text-xs font-medium focus:ring-1 focus:ring-[#fdc003] outline-none"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-[#74777e] uppercase">Tipe Kendaraan</label>
                  <select 
                    value={vehType}
                    onChange={(e) => setVehType(e.target.value as 'mobil' | 'motor')}
                    className="bg-[#f5f3f6] border border-[#c4c6ce] rounded-xl px-3 py-2 text-xs font-semibold focus:ring-1 focus:ring-[#fdc003] outline-none"
                  >
                    <option value="mobil">🚗 Mobil</option>
                    <option value="motor">🏍️ Motor</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-bold text-xs cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-2.5 bg-[#fdc003] text-[#6c5000] rounded-xl font-bold text-xs cursor-pointer shadow-md"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        )}

        {showEditProfileModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-5">
            <form onSubmit={handleEditProfileSubmit} className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-slate-100 space-y-4 animate-scale-in text-[#1b1c1e]">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-extrabold text-[#000f22]">Edit Profil Pelanggan</h3>
                <button 
                  type="button" 
                  onClick={() => setShowEditProfileModal(false)}
                  className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>
              
              <div className="space-y-4">
                {/* Name Input */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-extrabold text-[#74777e] uppercase tracking-wider">Nama Lengkap</label>
                  <input 
                    type="text" 
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Contoh: Alexander Sterling"
                    className="bg-[#f5f3f6] border border-[#e3e2e5] rounded-xl px-3.5 py-2.5 text-xs font-semibold focus:ring-1 focus:ring-[#fdc003] outline-none w-full"
                    required
                  />
                </div>

                {/* Preset Avatar Picker */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-extrabold text-[#74777e] uppercase tracking-wider">Pilih Foto Profil (Preset)</label>
                  <div className="flex items-center gap-3 py-1">
                    {[
                      { id: '1', url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD90iPn_p56sjSnZ0vwHyoBd07vLcuHPcArqDh3m0ku8XqdOGUw9z_TbF0kT98dV1a53CTJkoeIOLRvq7aGrNfLNNFB-zx15LDNCyiCYN_0Id64yu7zV3LnE0DNHCcnbGzTmpBXjNyLLOfVftyfkZh3rJmcIU-SzCnCriVti9GeG2LKndKXQ49v6J9VZP9MevH_EuxpjkmxOgfXDYAYFZHWmQ--x3CTM_hrjQwmK53ZULDCtkRwPH1sU4e9eGMSaXQYmKPJkzj9q_17' },
                      { id: '2', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256' },
                      { id: '3', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=256' },
                      { id: '4', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=256' },
                      { id: '5', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=256' }
                    ].map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setEditAvatar(preset.url)}
                        className={`w-11 h-11 rounded-full overflow-hidden transition-all relative cursor-pointer ${
                          editAvatar === preset.url ? 'ring-2 ring-[#fdc003] ring-offset-2 scale-105' : 'opacity-70 hover:opacity-100 border border-[#e3e2e5]'
                        }`}
                      >
                        <img src={preset.url} alt="preset avatar" className="w-full h-full object-cover" />
                        {editAvatar === preset.url && (
                          <div className="absolute inset-0 bg-[#fdc003]/15 flex items-center justify-center">
                            <span className="material-symbols-outlined text-white text-[14px] font-bold">check_circle</span>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Avatar URL */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-extrabold text-[#74777e] uppercase tracking-wider">Atau Link Foto Kustom (URL)</label>
                  <input 
                    type="url" 
                    value={editAvatar}
                    onChange={(e) => setEditAvatar(e.target.value)}
                    placeholder="https://example.com/item.jpg"
                    className="bg-[#f5f3f6] border border-[#e3e2e5] rounded-xl px-3.5 py-2.5 text-[11px] font-mono focus:ring-1 focus:ring-[#fdc003] outline-none w-full"
                  />
                  {editAvatar && (
                    <div className="flex items-center gap-2 mt-1 bg-slate-50 p-2 rounded-lg border border-dashed border-[#e3e2e5]">
                      <img src={editAvatar} className="w-8 h-8 rounded-full object-cover shrink-0" alt="Preview" onError={(e)=>{e.currentTarget.src='https://lh3.googleusercontent.com/aida-public/AB6AXuD90iPn_p56sjSnZ0vwHyoBd07vLcuHPcArqDh3m0ku8XqdOGUw9z_TbF0kT98dV1a53CTJkoeIOLRvq7aGrNfLNNFB-zx15LDNCyiCYN_0Id64yu7zV3LnE0DNHCcnbGzTmpBXjNyLLOfVftyfkZh3rJmcIU-SzCnCriVti9GeG2LKndKXQ49v6J9VZP9MevH_EuxpjkmxOgfXDYAYFZHWmQ--x3CTM_hrjQwmK53ZULDCtkRwPH1sU4e9eGMSaXQYmKPJkzj9q_17'}} />
                      <span className="text-[9px] text-[#74777e] font-semibold truncate">Preview Foto Kustom</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2.5 pt-3">
                <button 
                  type="button"
                  onClick={() => setShowEditProfileModal(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-705 rounded-xl font-bold text-xs cursor-pointer active:scale-95 transition-all text-center"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-[#fdc003] hover:bg-[#fabd00] text-[#6c5000] rounded-xl font-bold text-xs cursor-pointer shadow-md active:scale-95 transition-all text-center"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        )}

        {showChangePwModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-5">
            <form onSubmit={handleChangePasswordSubmit} className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl border border-slate-100 space-y-4 animate-scale-in text-[#1b1c1e]">
              <div className="flex justify-between items-center pb-1 border-b border-slate-100">
                <div className="flex items-center gap-2 text-[#0a2540]">
                  <span className="material-symbols-outlined text-amber-500 font-extrabold">lock_reset</span>
                  <h3 className="text-base font-extrabold text-[#000f22]">Ubah Kata Sandi</h3>
                </div>
                <button 
                  type="button" 
                  onClick={() => {
                    setShowChangePwModal(false);
                    setPwError('');
                    setPwSuccessMsg('');
                  }}
                  className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors"
                >
                  <span className="material-symbols-outlined text-[16px]">close</span>
                </button>
              </div>
              
              {pwError && (
                <div className="p-3 bg-red-50 text-red-600 rounded-xl text-xs font-semibold border border-red-200 animate-fade-in">
                  {pwError}
                </div>
              )}

              {pwSuccessMsg && (
                <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-semibold border border-emerald-200 animate-fade-in flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm font-black text-emerald-600">check_circle</span>
                  {pwSuccessMsg}
                </div>
              )}

              <div className="space-y-4">
                {/* Kata Sandi Saat Ini */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-extrabold text-[#74777e] uppercase tracking-wider">Kata Sandi Saat Ini</label>
                  <div className="flex items-center bg-[#f5f3f6] border border-[#e3e2e5] rounded-xl px-3.5 py-2.5 w-full focus-within:ring-1 focus-within:ring-[#fdc003]">
                    <input 
                      type={showCurrentPw ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Masukkan kata sandi lama"
                      className="w-full bg-transparent border-none p-0 focus:ring-0 text-xs font-semibold outline-none text-[#1b1c1e]"
                      required
                    />
                    <button 
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowCurrentPw(!showCurrentPw)}
                      className="text-[#74777e] hover:text-[#000f22] cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {showCurrentPw ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Kata Sandi Baru */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-extrabold text-[#74777e] uppercase tracking-wider">Kata Sandi Baru</label>
                  <div className="flex items-center bg-[#f5f3f6] border border-[#e3e2e5] rounded-xl px-3.5 py-2.5 w-full focus-within:ring-1 focus-within:ring-[#fdc003]">
                    <input 
                      type={showNewPw ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimal 6 karakter"
                      className="w-full bg-transparent border-none p-0 focus:ring-0 text-xs font-semibold outline-none text-[#1b1c1e]"
                      required
                    />
                    <button 
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowNewPw(!showNewPw)}
                      className="text-[#74777e] hover:text-[#000f22] cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {showNewPw ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Konfirmasi Kata Sandi Baru */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-extrabold text-[#74777e] uppercase tracking-wider">Konfirmasi Kata Sandi Baru</label>
                  <div className="flex items-center bg-[#f5f3f6] border border-[#e3e2e5] rounded-xl px-3.5 py-2.5 w-full focus-within:ring-1 focus-within:ring-[#fdc003]">
                    <input 
                      type={showConfirmPw ? 'text' : 'password'}
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="Ulangi kata sandi baru"
                      className="w-full bg-transparent border-none p-0 focus:ring-0 text-xs font-semibold outline-none text-[#1b1c1e]"
                      required
                    />
                    <button 
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowConfirmPw(!showConfirmPw)}
                      className="text-[#74777e] hover:text-[#000f22] cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {showConfirmPw ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-2.5 pt-3 border-t border-slate-50">
                <button 
                  type="button"
                  onClick={() => {
                    setShowChangePwModal(false);
                    setPwError('');
                    setPwSuccessMsg('');
                  }}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-705 rounded-xl font-bold text-xs cursor-pointer active:scale-95 transition-all text-center"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-[#fdc003] hover:bg-[#fabd00] text-[#6c5000] rounded-xl font-bold text-xs cursor-pointer shadow-md active:scale-95 transition-all text-center"
                >
                  Ubah Sandi
                </button>
              </div>
            </form>
          </div>
        )}

        {showTermsModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 flex flex-col max-h-[80vh] overflow-hidden animate-scale-in text-[#1b1c1e]">
              
              {/* Header */}
              <div className="flex justify-between items-center p-5 border-b border-slate-100 flex-shrink-0">
                <div className="flex items-center gap-2.5 text-[#0a2540]">
                  <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center text-[#785900]">
                    <span className="material-symbols-outlined font-extrabold text-lg">gavel</span>
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-[#000f22] leading-tight">Ketentuan & Kebijakan</h3>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Terakhir Diperbarui: Mei 2026</p>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => setShowTermsModal(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-colors cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-slate-100 bg-[#fbfafc] flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveTermsTab('service')}
                  className={`flex-1 py-3.5 text-[10px] font-extrabold uppercase tracking-widest transition-all border-b-2 text-center cursor-pointer ${
                    activeTermsTab === 'service' 
                      ? 'border-[#fdc003] text-[#785900] bg-white font-black' 
                      : 'border-transparent text-slate-400 hover:text-slate-800'
                  }`}
                >
                  Layanan
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTermsTab('privacy')}
                  className={`flex-1 py-3.5 text-[10px] font-extrabold uppercase tracking-widest transition-all border-b-2 text-center cursor-pointer ${
                    activeTermsTab === 'privacy' 
                      ? 'border-[#fdc003] text-[#785900] bg-white font-black' 
                      : 'border-transparent text-slate-400 hover:text-slate-800'
                  }`}
                >
                  Privasi
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTermsTab('refund')}
                  className={`flex-1 py-3.5 text-[10px] font-extrabold uppercase tracking-widest transition-all border-b-2 text-center cursor-pointer ${
                    activeTermsTab === 'refund' 
                      ? 'border-[#fdc003] text-[#785900] bg-white font-black' 
                      : 'border-transparent text-slate-400 hover:text-slate-800'
                  }`}
                >
                  Refund
                </button>
              </div>

              {/* Scrollable Terms Content */}
              <div className="p-5 overflow-y-auto flex-1 space-y-4 text-[11px] text-slate-600 font-semibold leading-relaxed">
                {activeTermsTab === 'service' && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="space-y-1">
                      <h4 className="text-[11px] font-black text-[#000f22] uppercase tracking-wider flex items-center gap-1.5 text-amber-600">
                        <span className="material-symbols-outlined text-[16px]">local_car_wash</span>
                        1. Cakupan Layanan Wash
                      </h4>
                      <p>
                        Clean Vehicle melayani pembersihan, pencucian, pemolesan, dan vacuuming kendaraan (mobil & motor) baik secara ONSITE di outlet-outlet resmi mitra kami atau HOME SERVICE (panggilan langsung ke lokasi rumah atau kantor Anda).
                      </p>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-[11px] font-black text-[#000f22] uppercase tracking-wider flex items-center gap-1.5 text-amber-600">
                        <span className="material-symbols-outlined text-[16px]">schedule</span>
                        2. Penjadwalan & Kedatangan
                      </h4>
                      <p>
                        Waktu penugasan teknisi disesuaikan dengan rentang waktu nyata yang Anda pilih saat melakukan pemesanan. Kami mengoptimalkan pelacakan waktu nyata (ETA) agar kedatangan teknisi presisi. Keterlambatan karena faktor cuaca ekstrem atau kemacetan akan diinfokan via notifikasi langsung.
                      </p>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-[11px] font-black text-[#000f22] uppercase tracking-wider flex items-center gap-1.5 text-amber-600">
                        <span className="material-symbols-outlined text-[16px]">shield_person</span>
                        3. Tanggung Jawab & Jaminan Keamanan
                      </h4>
                      <p>
                        Seluruh teknisi kami telah melewati verifikasi latar belakang ketat, pelatihan profesional bersertifikat, dan dilengkapi peralatan standar industri. Pengguna wajib menyertakan info kondisi fisik awal kendaraan jika terdapat lecet/dent bawaan sebelum pengerjaan dimulai.
                      </p>
                    </div>
                  </div>
                )}

                {activeTermsTab === 'privacy' && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="space-y-1">
                      <h4 className="text-[11px] font-black text-[#000f22] uppercase tracking-wider flex items-center gap-1.5 text-emerald-600">
                        <span className="material-symbols-outlined text-[16px]">location_on</span>
                        1. Penggunaan Data Lokasi & GPS
                      </h4>
                      <p>
                        Aplikasi melacak posisi GPS waktu nyata dari teknisi dan pengguna hanya saat pesanan aktif ("Dipesan"), guna mendelegasikan pesanan ke teknisi terdekat dan memberikan radar perjalanan presisi tinggi pada dasbor Anda.
                      </p>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-[11px] font-black text-[#000f22] uppercase tracking-wider flex items-center gap-1.5 text-emerald-600">
                        <span className="material-symbols-outlined text-[16px]">key</span>
                        2. Enkripsi Keamanan Sandi & Akun
                      </h4>
                      <p>
                        Kata sandi dan data pribadi Anda dienkripsi secara aman dalam penyimpanan sistem lokal dengan standar enkripsi modern. Kami tidak akan pernah membagikan atau menjual basis data pengguna kepada pihak ketiga mana pun tanpa izin eksplisit dari Anda.
                      </p>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-[11px] font-black text-[#000f22] uppercase tracking-wider flex items-center gap-1.5 text-emerald-600">
                        <span className="material-symbols-outlined text-[16px]">notifications_active</span>
                        3. Preferensi Notifikasi Peringatan
                      </h4>
                      <p>
                        Anda dapat menyesuaikan pengaturan notifikasi real-time, suara bel pemesanan, atau peringatan kedatangan teknisi di tab notifikasi profil Anda guna kenyamanan bersosial dan privasi optimal.
                      </p>
                    </div>
                  </div>
                )}

                {activeTermsTab === 'refund' && (
                  <div className="space-y-4 animate-fade-in">
                    <div className="space-y-1">
                      <h4 className="text-[11px] font-black text-[#000f22] uppercase tracking-wider flex items-center gap-1.5 text-amber-700">
                        <span className="material-symbols-outlined text-[16px]">cancel</span>
                        1. Kebijakan Pembatalan Pesanan
                      </h4>
                      <p>
                        Pengguna berhak membatalkan pesanan yang berstatus aktif ("Dipesan") kapan saja langsung dari menu lacak pesanan secara gratis sebelum teknisi ditugaskan atau berangkat ke lokasi Anda.
                      </p>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-[11px] font-black text-[#000f22] uppercase tracking-wider flex items-center gap-1.5 text-amber-700">
                        <span className="material-symbols-outlined text-[16px]">account_balance_wallet</span>
                        2. Syarat Pengembalian Dana (Refund)
                      </h4>
                      <p>
                        Apabila pembatalan sukses disetujui, dana pembayaran Anda (termasuk transfer bank mau pun dompet digital saldo e-wallet) akan dikembalikan secara penuh dan instan ke saldo Dompet digital Clean Vehicle Anda, yang dapat langsung digunakan kembali untuk transaksi berikutnya.
                      </p>
                    </div>

                    <div className="space-y-1">
                      <h4 className="text-[11px] font-black text-[#000f22] uppercase tracking-wider flex items-center gap-1.5 text-amber-700">
                        <span className="material-symbols-outlined text-[16px]">emergency</span>
                        3. Ganti Rugi Khusus
                      </h4>
                      <p>
                        Ganti rugi khusus dapat diajukan apabila terdapat kerusakan kosmetik kendaraan material yang secara nyata terbukti disebabkan oleh kelalaian prosedural pencucian oleh teknisi bersangkutan.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-2 flex-shrink-0">
                <button 
                  type="button"
                  onClick={() => setShowTermsModal(false)}
                  className="w-full py-3 bg-[#0a2540] hover:bg-[#0a2540]/90 text-[#fdc003] rounded-xl font-extrabold text-[11px] cursor-pointer transition-all uppercase tracking-widest active:scale-95 text-center shadow-sm"
                >
                  Saya Mengerti & Setuju
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Settings options menu */}
        <section className="space-y-2">
          <h3 className="text-sm font-bold text-[#0a2540] ml-1">Pengaturan & Keamanan</h3>
          
          <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-[#efedf0] divide-y divide-[#f5f3f6]">
            
            {/* Lokasi Pelayanan */}
            <div 
              onClick={() => setShowLocationModal(true)}
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3 text-[#0a2540]">
                <span className="material-symbols-outlined text-[18px] text-[#fdc003]">location_on</span>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold">Lokasi Pelayanan</span>
                  <span className="text-[10px] text-[#74777e] leading-none mt-0.5">{booking.locationName || 'Jakarta Selatan'}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[#785900] bg-[#ffdf9e]/30 px-2.5 py-0.5 rounded-full">
                <span className="text-[10px] font-extrabold uppercase tracking-wider">Ubah</span>
                <span className="material-symbols-outlined text-xs">chevron_right</span>
              </div>
            </div>

            {/* Keamanan */}
            <div 
              onClick={() => {
                setShowChangePwModal(true);
              }}
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3 text-[#0a2540]">
                <span className="material-symbols-outlined text-[18px]">lock_reset</span>
                <span className="text-xs font-bold">Ubah Kata Sandi</span>
              </div>
              <span className="material-symbols-outlined text-slate-400 text-sm">chevron_right</span>
            </div>

            {/* Notifikasi Toggle */}
            <a 
              href="#/notifications"
              onClick={(e) => {
                e.preventDefault();
                window.location.hash = '#/notifications';
              }}
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors block"
              id="notifications-setting-link"
            >
              <div className="flex items-center gap-3 text-[#0a2540]">
                <span className="material-symbols-outlined text-[18px]">notifications_active</span>
                <span className="text-xs font-bold">Pengaturan Detil Notifikasi</span>
              </div>
              <div className="flex items-center gap-1.5 text-[#785900] bg-[#ffdf9e]/30 px-2.5 py-0.5 rounded-full">
                <span className="text-[10px] font-extrabold uppercase tracking-wider">Atur</span>
                <span className="material-symbols-outlined text-xs">chevron_right</span>
              </div>
            </a>

            {/* Tanya Jawab (FAQ) */}
            <a 
              href="#/faq"
              onClick={(e) => {
                e.preventDefault();
                window.location.hash = '#/faq';
              }}
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors block"
              id="faq-setting-link"
            >
              <div className="flex items-center gap-3 text-[#0a2540]">
                <span className="material-symbols-outlined text-[18px]">quiz</span>
                <span className="text-xs font-bold">Tanya Jawab (FAQ)</span>
              </div>
              <div className="flex items-center gap-1.5 text-[#785900] bg-[#ffdf9e]/30 px-2.5 py-0.5 rounded-full">
                <span className="text-[10px] font-extrabold uppercase tracking-wider">Buka</span>
                <span className="material-symbols-outlined text-xs">chevron_right</span>
              </div>
            </a>

            {/* Dark Mode Toggle */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3 text-[#0a2540]">
                <span className="material-symbols-outlined text-[18px]">
                  {darkMode ? 'light_mode' : 'dark_mode'}
                </span>
                <span className="text-xs font-bold">Mode Gelap (Dark Mode)</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={darkMode} 
                  onChange={onToggleTheme}
                  className="sr-only peer cursor-pointer" 
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#fdc003]"></div>
              </label>
            </div>

            {/* Syarat Layanan */}
            <div 
              onClick={() => setShowTermsModal(true)}
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3 text-[#0a2540]">
                <span className="material-symbols-outlined text-[18px]">gavel</span>
                <span className="text-xs font-bold">Ketentuan & Kebijakan Privasi</span>
              </div>
              <span className="material-symbols-outlined text-slate-400 text-sm">chevron_right</span>
            </div>

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
            className="flex flex-col items-center justify-center text-[#74777e] hover:text-[#000f22] transition-colors cursor-pointer text-xs font-semibold gap-1"
          >
            <span className="material-symbols-outlined">history</span>
            <span className="uppercase tracking-wider text-[9px]">History</span>
          </button>

          <button 
            onClick={() => onNavigate('profile')} 
            className="flex flex-col items-center justify-center text-[#fdc003] bg-[#ffdf9e]/30 rounded-2xl px-5 py-2 active:scale-95 transition-transform duration-150 cursor-pointer text-xs font-bold gap-1"
          >
            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
            <span className="uppercase tracking-wider text-[9px] font-extrabold">Profile</span>
          </button>
        </div>
      </nav>

      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-55 p-5">
          <div className="bg-white rounded-3xl p-6 w-full max-w-xs shadow-2xl border border-slate-100 space-y-4 animate-scale-in text-[#1b1c1e]">
            <div className="flex items-center gap-3 text-red-650">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-[22px]">logout</span>
              </div>
              <h3 className="text-base font-extrabold text-[#000f22]">Konfirmasi Keluar</h3>
            </div>

            <p className="text-xs text-[#74777e] leading-relaxed font-semibold">
              Apakah Anda yakin ingin keluar dari akun Anda? Anda harus masuk kembali untuk membuat atau memantau pemesanan cuci kendaraan Anda.
            </p>

            <div className="flex gap-2.5 pt-2">
              <button 
                type="button"
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-705 rounded-xl font-extrabold text-xs cursor-pointer active:scale-95 transition-all text-center"
              >
                Batal
              </button>
              <button 
                type="button"
                onClick={() => {
                  setShowLogoutConfirm(false);
                  handleLogout();
                }}
                className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-extrabold text-xs cursor-pointer shadow-md shadow-red-200 active:scale-95 transition-all text-center"
              >
                Ya, Keluar
              </button>
            </div>
          </div>
        </div>
      )}

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
