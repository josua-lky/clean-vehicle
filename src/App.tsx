import api, { getStorageUrl } from './services/api';
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookingState, Transaction, Car, NotificationItem } from './types';
import WelcomeView from './components/WelcomeView';
import LoginView from './components/LoginView';
import RegisterView from './components/RegisterView';
import DashboardView from './components/DashboardView';
import BookingView from './components/BookingView';
import ServiceDetailsView from './components/ServiceDetailsView';
import ConfirmOrderView from './components/ConfirmOrderView';
import PaymentView from './components/PaymentView';
import PaymentSuccessView from './components/PaymentSuccessView';
import TrackingView from './components/TrackingView';
import HistoryView from './components/HistoryView';
import AlertsView from './components/AlertsView';
import ProfileView from './components/ProfileView';
import TechnicianHomeView from './components/TechnicianHomeView';

export default function App() {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('darkMode');
    return saved === 'true';
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);


  const [dbPackages, setDbPackages] = useState<any[]>([]);
  const [dbOutlets, setDbOutlets] = useState<any[]>([]);
  const [dbTechnicians, setDbTechnicians] = useState<any[]>([]);
  const [dbPromos, setDbPromos] = useState<any[]>([]);

  const fetchDbPromos = async () => {
    try {
      const response = await api.get('/promos');
      const fetchedPromos = response.data || [];
      setDbPromos(fetchedPromos);

      const seenStr = localStorage.getItem('seenPromoIds');
      let seenIds: number[] = seenStr ? JSON.parse(seenStr) : [];

      if (seenIds.length === 0) {
        const initialIds = fetchedPromos.map((p: any) => p.id);
        localStorage.setItem('seenPromoIds', JSON.stringify(initialIds));
      } else {
        const newPromos = fetchedPromos.filter((p: any) => !seenIds.includes(p.id));
        if (newPromos.length > 0) {
          const newlyAddedNotifs: NotificationItem[] = [];
          
          newPromos.forEach((promo: any) => {
            const newNotif: NotificationItem = {
              id: `notif-promo-${promo.id}`,
              category: 'promo',
              title: `Promo Baru: ${promo.name}`,
              time: 'Baru Saja',
              description: promo.description || `Gunakan kode ${promo.code} untuk mendapatkan potongan harga spesial!`,
              idTag: promo.code,
              hasCta: true,
              ctaText: 'GUNAKAN PROMO',
              timestamp: new Date(promo.created_at || Date.now()).getTime()
            };

            newlyAddedNotifs.push(newNotif);
            seenIds.push(promo.id);
            
            setActiveToast({
              title: newNotif.title,
              description: newNotif.description
            });
          });

          setPromoNotifications(prev => {
            const updated = [...newlyAddedNotifs, ...prev];
            localStorage.setItem('promoNotifications', JSON.stringify(updated));
            return updated;
          });

          localStorage.setItem('seenPromoIds', JSON.stringify(seenIds));
        }
      }
    } catch (err) {
      console.log('Error fetching promos:', err);
    }
  };

  const fetchDbPackages = async () => {
    try {
      const response = await api.get('/packages');
      setDbPackages(response.data);
    } catch (err) {
      console.log('Error fetching packages:', err);
    }
  };

  const fetchDbOutlets = async () => {
    try {
      const response = await api.get('/outlets');
      setDbOutlets(response.data);
    } catch (err) {
      console.log('Error fetching outlets:', err);
    }
  };

  const fetchDbTechnicians = async () => {
    try {
      const response = await api.get('/technicians');
      const mapped = response.data.map((t: any) => ({
        ...t,
        avatar: getStorageUrl(t.avatar || t.profile_photo) || 
          `https://ui-avatars.com/api/?name=${encodeURIComponent(t.name)}&background=1B2337&color=F0C419`
      }));
      setDbTechnicians(mapped);
    } catch (err) {
      console.log('Error fetching technicians:', err);
    }
  };

  const fetchVehicles = async () => {
    try {
      const response = await api.get('/vehicles');
      const mapped = response.data.map((v: any) => ({
        id: String(v.id),
        name: `${v.brand} ${v.model}`,
        brand: v.brand,
        model: v.model,
        color: v.color,
        year: v.year,
        plate: v.license_plate,
        type: v.type === 'roda_2' ? 'motor' : 'mobil'
      }));
      setVehicles(mapped);
    } catch (err) {
      console.log('Error fetching vehicles:', err);
    }
  };

  const fetchUserAddress = async () => {
    try {
      const response = await api.get('/profile/address');
      if (response.data.success && response.data.address) {
        const addr = response.data.address;
        const fullAddress = addr.address || '';
        let locName = 'Jakarta Selatan';
        let pickup = fullAddress;

        if (fullAddress.includes(' | ')) {
          const parts = fullAddress.split(' | ');
          locName = parts[0];
          pickup = parts[1];
        } else if (fullAddress) {
          locName = fullAddress.split(',')[0] || 'Jakarta';
        }

        setBooking(prev => ({
          ...prev,
          locationName: locName,
          pickupLocation: pickup
        }));
      }
    } catch (err) {
      console.log('Error fetching user address:', err);
    }
  };

  const handleSaveLocation = async (locationName: string, pickupLocation: string, lat?: number, lon?: number) => {
    setBooking(prev => ({
      ...prev,
      locationName,
      pickupLocation
    }));

    try {
      const token = localStorage.getItem('token');
      if (token) {
        const combinedAddress = `${locationName} | ${pickupLocation}`;
        await api.put('/profile/address', {
          address: combinedAddress,
          latitude: lat,
          longitude: lon
        });
      }
    } catch (err) {
      console.log('Error saving address:', err);
    }
  };

  const fetchProfile = async () => {
    try {
      const response = await api.get('/profile');
      const currentUser = response.data.user;
      setUser(currentUser);
      return currentUser;
    } catch (error) {
      console.log('Error fetching profile:', error);
    }
  };

  useEffect(() => {
    // Add interceptor to catch 403 errors and update user status to 'inactive'
    const interceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 403) {
          const errMsg = error.response.data?.message || '';
          if (errMsg.toLowerCase().includes('nonaktif') || errMsg.toLowerCase().includes('dinonaktifkan')) {
            setUser(prev => prev ? { ...prev, status: 'inactive' } : { status: 'inactive' });
          }
        }
        return Promise.reject(error);
      }
    );

    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        const role = localStorage.getItem('role') || 'customer';
        if (!token) {
          setAuthLoading(false);
          return;
        }

        await fetchProfile();
        setUserRole(role as 'customer' | 'technician');
        setIsLoggedIn(true);

        if (role === 'technician') {
          setCurrentScreen('technician-home');
        } else {
          fetchBookings();
          fetchVehicles();
          fetchDbPackages();
          fetchDbOutlets();
          fetchDbTechnicians();
          fetchDbPromos();
          fetchUserAddress();

          const savedScreen = localStorage.getItem('currentScreen');
          setCurrentScreen((savedScreen as any) || 'dashboard');
        }
      } catch (error: any) {
        console.log(error);
        if (error?.response?.status === 403) {
          const errMsg = error.response.data?.message || '';
          if (errMsg.toLowerCase().includes('nonaktif') || errMsg.toLowerCase().includes('dinonaktifkan')) {
            const role = localStorage.getItem('role') || 'customer';
            setUserRole(role as 'customer' | 'technician');
            setIsLoggedIn(true);
            let name = 'Pengguna';
            try {
              const savedUser = localStorage.getItem('user');
              if (savedUser) name = JSON.parse(savedUser).name || 'Pengguna';
            } catch (_) {}
            setUser({ status: 'inactive', name });
            setAuthLoading(false);
            return;
          }
        }
        localStorage.clear();
        setUser(null);
        setUserRole('customer');
        setIsLoggedIn(false);
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();

    return () => {
      api.interceptors.response.eject(interceptor);
    };
  }, []);

  const handleToggleTheme = () => {
    setDarkMode(prev => !prev);
  };

  // Listen to hash router links on load/change
  useEffect(() => {
    const handleHashCheck = () => {
      const h = window.location.hash;
      if (h === '#/faq' || h === '#/notifications') {
        navigateTo('profile');
      }
    };
    window.addEventListener('hashchange', handleHashCheck);
    handleHashCheck();
    return () => {
      window.removeEventListener('hashchange', handleHashCheck);
    };
  }, []);


  const [currentScreen, setCurrentScreen] = useState<
    'welcome' | 'login' | 'register' | 'dashboard' | 'booking' | 'details' | 'confirm' | 'payment' | 'success' | 'tracking' | 'history' | 'alerts' | 'profile' | 'technician-home'
  >('welcome');

  const navigateTo = (
    screen:
    | 'welcome'
    | 'login'
    | 'register'
    | 'dashboard'
    | 'booking'
    | 'details'
    | 'confirm'
    | 'payment'
    | 'success'
    | 'tracking'
    | 'history'
    | 'alerts'
    | 'profile'
    | 'technician-home'
  ) => {
    localStorage.setItem('currentScreen', screen);
    setCurrentScreen(screen);
    if (screen !== 'history') {
      setInitialExpandedBookingId(undefined);
    }

    // HTML5 History API integration for back button support
    const isEntryScreen = ['welcome', 'login', 'dashboard', 'technician-home'].includes(screen);
    if (isEntryScreen) {
      window.history.replaceState({ screen }, '', `#/${screen}`);
    } else {
      if (!window.history.state || window.history.state.screen !== screen) {
        window.history.pushState({ screen }, '', `#/${screen}`);
      }
    }
  };

  // Authenticated state
  const [user, setUser] = useState<any>(null);

  const getAvatarUrl = () => {
    if (!user) return 'https://lh3.googleusercontent.com/aida-public/AB6AXuD90iPn_p56sjSnZ0vwHyoBd07vLcuHPcArqDh3m0ku8XqdOGUw9z_TbF0kT98dV1a53CTJkoeIOLRvq7aGrNfLNNFB-zx15LDNCyiCYN_0Id64yu7zV3LnE0DNHCcnbGzTmpBXjNyLLOfVftyfkZh3rJmcIU-SzCnCriVti9GeG2LKndKXQ49v6J9VZP9MevH_EuxpjkmxOgfXDYAYFZHWmQ--x3CTM_hrjQwmK53ZULDCtkRwPH1sU4e9eGMSaXQYmKPJkzj9q_17';
    if (user.avatar) return getStorageUrl(user.avatar);
    if (user.profile_photo) {
      return getStorageUrl(user.profile_photo);
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=1B2337&color=F0C419`;
  };
  const avatarUrl = getAvatarUrl();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [userRole, setUserRole] = useState<'customer' | 'technician'>(() => {
    return (localStorage.getItem('role') as any) || 'customer';
  });
  const [viewOnlyPackages, _setViewOnlyPackages] = useState<boolean>(() => {
    return localStorage.getItem('viewOnlyPackages') === 'true';
  });
  const setViewOnlyPackages = (val: boolean) => {
    _setViewOnlyPackages(val);
    localStorage.setItem('viewOnlyPackages', String(val));
  };

  // Listen to popstate for hardware/browser back button support
  useEffect(() => {
    if (!window.history.state) {
      window.history.replaceState({ screen: currentScreen }, '', `#/${currentScreen}`);
    }

    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.screen) {
        setCurrentScreen(event.state.screen);
      } else {
        const fallback = isLoggedIn ? (userRole === 'technician' ? 'technician-home' : 'dashboard') : 'welcome';
        setCurrentScreen(fallback);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isLoggedIn, userRole, currentScreen]);

  // Lists in state to allow dynamic additions/interaction
  const [vehicles, setVehicles]
  = useState<Car[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeTrackedOrderId, setActiveTrackedOrderId] = useState<string | null>(null);
  const [initialExpandedBookingId, setInitialExpandedBookingId] = useState<string | undefined>(undefined);
  const [hasReviewedPendingToday, setHasReviewedPendingToday] = useState<boolean>(() => {
    return localStorage.getItem('hasReviewedPendingToday') === 'true';
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [promoNotifications, setPromoNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem('promoNotifications');
    return saved ? JSON.parse(saved) : [];
  });
  const [activeToast, setActiveToast] = useState<{ title: string; description: string } | null>(null);
  const [customAlert, setCustomAlert] = useState<{ message: string } | null>(null);
  const [readNotifIds, setReadNotifIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('readNotifIds');
    return saved ? JSON.parse(saved) : [];
  });
  const [deletedNotifIds, setDeletedNotifIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('deletedNotifIds');
    return saved ? JSON.parse(saved) : [];
  });

  const deletedNotifIdsRef = useRef<string[]>(deletedNotifIds);
  useEffect(() => {
    deletedNotifIdsRef.current = deletedNotifIds;
  }, [deletedNotifIds]);

  const formatNotifTime = (dateStr: string) => {
    if (!dateStr) return 'Baru Saja';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'Baru Saja';
      
      const now = new Date();
      const isToday = d.getDate() === now.getDate() && 
                      d.getMonth() === now.getMonth() && 
                      d.getFullYear() === now.getFullYear();
      
      if (isToday) {
        const hrs = String(d.getHours()).padStart(2, '0');
        const mins = String(d.getMinutes()).padStart(2, '0');
        return `${hrs}:${mins}`;
      }
      
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const isYesterday = d.getDate() === yesterday.getDate() && 
                          d.getMonth() === yesterday.getMonth() && 
                          d.getFullYear() === yesterday.getFullYear();
      
      if (isYesterday) {
        return 'Kemarin';
      }
      
      const diffTime = Math.abs(now.getTime() - d.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays <= 7) {
        return `${diffDays} hari lalu`;
      }
      
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    } catch (e) {
      return 'Baru Saja';
    }
  };

  const formatPaymentMethod = (method: string, provider: string) => {
    const methodMap: Record<string, string> = {
      va_bank: 'Virtual Account',
      ewallet: 'E-Wallet',
      qris: 'QRIS',
      credit_card: 'Kartu Kredit',
      cod: 'Bayar di Tempat'
    };
    const m = methodMap[method] || method || 'OnoPay';
    const p = provider ? provider.toUpperCase() : '';
    return p ? `${m} (${p})` : m;
  };

  const fetchBookings = async () => {
    try {
      const response = await api.get('/bookings');
      const mapped = response.data.map((b: any) => ({
        id: String(b.id),
        serviceName: b.service_type === 'home' ? 'Cuci di Rumah' : 'Cuci di Outlet',
        date: b.scheduled_at,
        price: Number(b.total_amount),
        status: mapBookingStatus(b.status),
        vehicleName: b.vehicle 
          ? `${b.vehicle.brand} ${b.vehicle.model} (${b.vehicle.license_plate})`
          : b.vehicle_name,
        vehicleType: b.vehicle_type === 'roda_2' ? 'motor' : 'mobil',
        packageName: b.package?.name,
        additionalNotes: b.notes || '',
        promoCode: b.promo?.code,
        serviceAddress: b.service_address || '',
        serviceType: b.service_type || 'home',
        beforePhoto: b.before_photo ? getStorageUrl(b.before_photo) : undefined,
        afterPhoto: b.after_photo ? getStorageUrl(b.after_photo) : undefined,
        rating: b.review ? Number(b.review.rating) : undefined,
        reviewText: b.review ? b.review.comment : undefined,
        cancelledReason: b.cancelled_reason || '',
        payment: b.payment ? {
          status: b.payment.status,
          refundAmount: Number(b.payment.refund_amount || 0),
          refundedAt: b.payment.refunded_at
        } : null,
        technician: b.technician ? {
          id: String(b.technician.id),
          name: b.technician.name,
          rating: Number(b.technician.rating || 4.5),
          avatar: getStorageUrl(b.technician.avatar || b.technician.profile_photo) || 
            `https://ui-avatars.com/api/?name=${encodeURIComponent(b.technician.name)}&background=1B2337&color=F0C419`,
          specialization: b.technician.specialization,
          area: b.technician.area
        } : null
      }));

      setTransactions(Array.isArray(response.data) ? mapped : []);

      // Load settings from localStorage
      const savedSettings = localStorage.getItem('notifEvents');
      const notifSettings = savedSettings ? JSON.parse(savedSettings) : {
        bookingConfirmed: true,
        serviceFinished: true,
        paymentSuccess: true,
        promoOffers: true
      };

      const derivedNotifs: NotificationItem[] = [];

      // Append dynamic promo notifications
      const savedPromoNotifs = localStorage.getItem('promoNotifications');
      const parsedPromoNotifs = savedPromoNotifs ? JSON.parse(savedPromoNotifs) : [];
      derivedNotifs.push(...parsedPromoNotifs);

      // Derive from bookings in response.data
      if (Array.isArray(response.data)) {
        response.data.forEach((b: any) => {
          // 1. Confirmed / Assigned
          if (['confirmed', 'assigned'].includes(b.status)) {
            if (notifSettings.bookingConfirmed) {
              derivedNotifs.push({
                id: `notif-confirmed-${b.id}`,
                category: 'pesanan',
                title: 'Pemesanan Dikonfirmasi',
                time: formatNotifTime(b.updated_at || b.created_at || b.scheduled_at),
                description: `Pesanan cuci kendaraan (${b.vehicle_name || (b.vehicle ? b.vehicle.brand + ' ' + b.vehicle.model : 'Kendaraan')}) Anda dengan kode ${b.booking_code} telah dikonfirmasi. Petugas/teknisi akan segera memproses pencucian sesuai jadwal.`,
                idTag: b.booking_code,
                hasCta: true,
                ctaText: 'LACAK PROSES',
                timestamp: new Date(b.updated_at || b.created_at || b.scheduled_at).getTime()
              });
            }
          }

          // 1b. On Way
          if (b.status === 'on_way') {
            if (notifSettings.bookingConfirmed) {
              derivedNotifs.push({
                id: `notif-onway-${b.id}`,
                category: 'pesanan',
                title: 'Teknisi Menuju Lokasi',
                time: formatNotifTime(b.updated_at || b.created_at || b.scheduled_at),
                description: `Teknisi ${b.technician?.name || 'kami'} sedang dalam perjalanan menuju lokasi Anda untuk mencuci kendaraan ${b.vehicle_name || (b.vehicle ? b.vehicle.brand + ' ' + b.vehicle.model : 'Kendaraan')}.`,
                idTag: b.booking_code,
                hasCta: true,
                ctaText: 'LACAK PROSES',
                timestamp: new Date(b.updated_at || b.created_at || b.scheduled_at).getTime()
              });
            }
          }

          // 1c. In Progress
          if (b.status === 'in_progress') {
            if (notifSettings.bookingConfirmed) {
              derivedNotifs.push({
                id: `notif-inprogress-${b.id}`,
                category: 'pesanan',
                title: 'Pengerjaan Dimulai',
                time: formatNotifTime(b.updated_at || b.created_at || b.scheduled_at),
                description: `Kendaraan ${b.vehicle_name || (b.vehicle ? b.vehicle.brand + ' ' + b.vehicle.model : 'Kendaraan')} Anda sedang dalam proses pencucian oleh teknisi ${b.technician?.name || 'kami'}.`,
                idTag: b.booking_code,
                hasCta: true,
                ctaText: 'LACAK PROSES',
                timestamp: new Date(b.updated_at || b.created_at || b.scheduled_at).getTime()
              });
            }
          }

          // 2. Completed
          if (b.status === 'completed') {
            if (notifSettings.serviceFinished) {
              derivedNotifs.push({
                id: `notif-completed-${b.id}`,
                category: 'pesanan',
                title: 'Pesanan Selesai',
                time: formatNotifTime(b.updated_at || b.created_at || b.scheduled_at),
                description: `Layanan ${b.package?.name || 'Cuci Kendaraan'} untuk kendaraan ${b.vehicle_name || (b.vehicle ? b.vehicle.brand + ' ' + b.vehicle.model : 'Kendaraan')} telah selesai dikerjakan. Terima kasih telah memercayai kami!`,
                idTag: b.booking_code,
                hasCta: true,
                ctaText: 'TULIS ULASAN',
                timestamp: new Date(b.updated_at || b.created_at || b.scheduled_at).getTime()
              });
            }
          }

          // 3. Payment Receipt (Rincian Transaksi & Pembayaran)
          if (b.payment && (b.payment.status === 'paid' || b.payment.status === 'success')) {
            if (notifSettings.paymentSuccess) {
              const dateObj = new Date(b.payment.paid_at || b.payment.updated_at || b.updated_at);
              const formattedDate = isNaN(dateObj.getTime())
                ? 'Baru Saja'
                : dateObj.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) + ' ' + 
                  String(dateObj.getHours()).padStart(2, '0') + ':' + String(dateObj.getMinutes()).padStart(2, '0');

              derivedNotifs.push({
                id: `notif-receipt-${b.id}`,
                category: 'pesanan',
                title: 'Detail Struk Transaksi',
                time: formatNotifTime(b.payment.paid_at || b.payment.updated_at),
                description: `Pembayaran sukses untuk booking ${b.booking_code}. Berikut adalah struk rincian pembayaran Anda.`,
                idTag: b.booking_code,
                receipt: {
                  bookingCode: b.booking_code,
                  packageName: b.package?.name || 'Cuci Kendaraan',
                  vehicleName: b.vehicle_name || (b.vehicle ? `${b.vehicle.brand} ${b.vehicle.model}` : 'Kendaraan'),
                  price: Number(b.subtotal),
                  discount: Number(b.discount_amount),
                  total: Number(b.total_amount),
                  method: formatPaymentMethod(b.payment.payment_method, b.payment.payment_provider),
                  date: formattedDate
                },
                timestamp: new Date(b.payment.paid_at || b.payment.updated_at || b.updated_at).getTime()
              });
            }
          }

          if (b.payment && b.payment.status === 'refunded') {
            derivedNotifs.push({
              id: `notif-refunded-${b.id}`,
              category: 'pesanan',
              title: 'Dana Refund Dikembalikan',
              time: formatNotifTime(b.payment.refunded_at || b.payment.updated_at),
              description: `Dana refund sebesar Rp ${Number(b.payment.refund_amount || b.payment.amount).toLocaleString('id-ID')} untuk pemesanan ${b.booking_code} telah dikembalikan oleh admin ke saldo e-wallet OnoPay Anda.`,
              idTag: b.booking_code,
              hasCta: true,
              ctaText: 'DETAIL PESANAN',
              timestamp: new Date(b.payment.refunded_at || b.payment.updated_at || b.updated_at).getTime()
            });
          }
        });
      }

      // Sort derived notifications descending by timestamp (newest first)
      derivedNotifs.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

      // Filter out deleted notifications
      const activeNotifs = derivedNotifs.filter(n => !deletedNotifIdsRef.current.includes(n.id));

      setNotifications(prev => {
        if (prev.length > 0) {
          const newItems = activeNotifs.filter(n => !prev.some(p => p.id === n.id));
          if (newItems.length > 0) {
            const latestNew = newItems[0];
            setActiveToast({
              title: latestNew.title,
              description: latestNew.description
            });
          }
        }
        return activeNotifs;
      });
    } catch (error) {
      console.log(error);
    }
  };
  
  const mapBookingStatus = (
    status: string
  ) => {
  
    switch (status) {
  
      case 'pending':
        return 'Diproses';
  
      case 'completed':
        return 'Selesai';
  
      case 'cancelled':
        return 'Dibatalkan';
  
      default:
        return 'Diproses';
  
    }
  
  };

  // Active bookings state values
  const [booking, setBooking] = useState<BookingState>({
    vehicleType: 'mobil',
    selectedServiceId: null,
    selectedPackageId: '',
    selectedTechnicianId: '',
    selectedDate: '',
    selectedTime: '',
    locationName: 'Kuningan, Jakarta Selatan',
    pickupLocation: 'Sudirman Central Business District, Jakarta',
    selectedCarId: '',
    paymentMethod: 'bank',
    notes: ''
  });

  const [paymentDetails, setPaymentDetails] = useState({
    amount: 105000,
    method: 'Transfer Bank (BCA)'
  });

  const handleUpdateBooking = (updated: Partial<BookingState>) => {
    setBooking(prev => ({ ...prev, ...updated }));
  };

  const handleLoginSuccess = (
    loggedUser: any,
    role: string = 'customer'
  ) => {
    setUser(loggedUser);
    setUserRole(role as 'customer' | 'technician');
    setIsLoggedIn(true);

    if (role === 'technician') {
      navigateTo('technician-home');
    } else {
      fetchBookings();
      fetchVehicles();
      fetchDbPackages();
      fetchDbOutlets();
      fetchDbTechnicians();
      fetchDbPromos();
      fetchUserAddress();
      navigateTo('dashboard');
    }
  };

  const handleRegisterSuccess = (
    loggedUser: any
  ) => {
    setUser(loggedUser);
    setUserRole('customer');
    setIsLoggedIn(true);

    fetchBookings();
    fetchVehicles();
    fetchDbPackages();
    fetchDbOutlets();
    fetchDbTechnicians();
    fetchDbPromos();
    fetchUserAddress();
    navigateTo('dashboard');
  };

  const handleUpdateProfile = (
    name: string,
    profilePhoto: string,
    avatar?: string
  ) => {
    setUser(prev => {
      const updatedUser = {
        ...prev,
        name,
        profile_photo: profilePhoto,
        avatar: avatar || (prev ? prev.avatar : undefined)
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      return updatedUser;
    });
  };

  const handleAddVehicle = async (newVeh: Omit<Car, 'id'>) => {
    try {
      const payload = {
        brand: newVeh.brand || 'Unknown',
        model: newVeh.model || '-',
        license_plate: newVeh.plate,
        type: newVeh.type === 'motor' ? 'roda_2' : 'roda_4',
        color: newVeh.color || '',
        year: newVeh.year || '',
        notes: ''
      };
      await api.post('/vehicles', payload);
      await fetchVehicles();
    } catch (error: any) {
      console.log('Add vehicle error:', error);
      const errorsObj = error?.response?.data?.errors;
      let errMsg = error?.response?.data?.message || 'Gagal menambahkan kendaraan.';
      if (errorsObj && typeof errorsObj === 'object') {
        const errorMessages = Object.values(errorsObj).flat().join('\n');
        if (errorMessages) errMsg = errorMessages;
      }
      alert(errMsg);
      throw error;
    }
  };

  const handleUpdateVehicle = async (id: string, updated: Partial<Car>) => {
    try {
      const existing = vehicles.find(v => v.id === id);
      if (!existing) return;
      const brand = updated.brand !== undefined ? updated.brand : existing.brand;
      const model = updated.model !== undefined ? updated.model : existing.model;
      const color = updated.color !== undefined ? updated.color : existing.color;
      const year = updated.year !== undefined ? updated.year : existing.year;
      const plate = updated.plate !== undefined ? updated.plate : existing.plate;
      const type = updated.type !== undefined ? updated.type : existing.type;
      
      await api.put(`/vehicles/${id}`, {
        brand,
        model,
        color,
        year,
        license_plate: plate,
        type: type === 'motor' ? 'roda_2' : 'roda_4'
      });
      await fetchVehicles();
    } catch (error: any) {
      console.log('Update vehicle error:', error);
      const errorsObj = error?.response?.data?.errors;
      let errMsg = error?.response?.data?.message || 'Gagal mengubah kendaraan.';
      if (errorsObj && typeof errorsObj === 'object') {
        const errorMessages = Object.values(errorsObj).flat().join('\n');
        if (errorMessages) errMsg = errorMessages;
      }
      alert(errMsg);
      throw error;
    }
  };

  const handleDeleteVehicle = async (id: string) => {
    try {
      await api.delete(`/vehicles/${id}`);
      await fetchVehicles();
    } catch (error: any) {
      console.log('Delete vehicle error:', error);
      alert('Gagal menghapus kendaraan.');
    }
  };

  const parseBookingDate = () => {
    try {
      const monthsIndo = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ];
      const parts = booking.selectedDate.split(' ');
      if (parts.length === 3) {
        const day = parts[0];
        const monthName = parts[1];
        const year = parts[2];
        const monthIndex = monthsIndo.indexOf(monthName);
        if (monthIndex !== -1) {
          const monthStr = String(monthIndex + 1).padStart(2, '0');
          const dayStr = String(day).padStart(2, '0');
          const time = booking.selectedTime || '09:00';
          return `${year}-${monthStr}-${dayStr} ${time}:00`;
        }
      }
    } catch (e) {
      console.log('Date parse failed, using fallback', e);
    }
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];
    const timeStr = booking.selectedTime || '09:00';
    return `${dateStr} ${timeStr}:00`;
  };

  const handlePaymentSuccess = async (amount: number, methodUsed: string) => {
    try {
      let vehicleId = Number(booking.selectedCarId);
      if (isNaN(vehicleId) || !vehicleId) {
        if (vehicles.length > 0) {
          vehicleId = Number(vehicles[0].id);
        } else {
          const response = await api.post('/vehicles', {
            brand: booking.vehicleType === 'motor' ? 'Honda' : 'Toyota',
            model: booking.vehicleType === 'motor' ? 'Beat' : 'Avanza',
            license_plate: booking.vehicleType === 'motor' ? 'B 1234 ABC' : 'B 5678 DEF',
            type: booking.vehicleType === 'motor' ? 'roda_2' : 'roda_4',
            color: 'Hitam',
            year: '2022',
            notes: 'Auto registered'
          });
          vehicleId = response.data.vehicle.id;
          fetchVehicles();
        }
      }

      const targetType = booking.vehicleType === 'motor' ? 'roda_2' : 'roda_4';
      const dbPackage = dbPackages.find(p => String(p.id) === String(booking.selectedPackageId))
                        || dbPackages.find(p => p.vehicle_type === targetType && p.name.toLowerCase().includes(booking.selectedPackageId.toLowerCase()))
                        || dbPackages.find(p => p.name.toLowerCase().includes(booking.selectedPackageId.toLowerCase()))
                        || dbPackages.find(p => p.vehicle_type === targetType && (
                             booking.selectedPackageId === 'basic' ? p.name.toLowerCase().includes('basic') :
                             booking.selectedPackageId === 'detailing' ? p.name.toLowerCase().includes('detail') :
                             booking.selectedPackageId === 'complete' ? p.name.toLowerCase().includes('complete') :
                             booking.selectedPackageId === 'engine' ? p.name.toLowerCase().includes('engine') :
                             p.name.toLowerCase().includes('premium')
                           ))
                        || dbPackages[0];
      const packageId = dbPackage ? dbPackage.id : 1;

      const payload = {
        vehicle_id: vehicleId,
        package_id: packageId,
        service_type: (booking.pickupLocation.toLowerCase().includes('outlet') || booking.locationName.toLowerCase().includes('outlet')) ? 'outlet' : 'home',
        scheduled_at: parseBookingDate(),
        service_address: booking.pickupLocation || 'Alamat customer',
        notes: booking.notes ? booking.notes.trim() : null,
        promo_code: booking.appliedPromoCode || null,
        technician_id: booking.selectedTechnicianId ? Number(booking.selectedTechnicianId) : null,
        outlet_id: booking.selectedOutletId ? Number(booking.selectedOutletId) : null
      };

      console.log('Creating booking with payload:', payload);
      const response = await api.post('/bookings', payload);
      console.log('Booking response:', response.data);

      await fetchBookings();
      
      const newBooking = response.data.booking;
      const generatedId = newBooking ? String(newBooking.id) : `CV-${Date.now().toString().slice(-7)}`;
      
      setActiveTrackedOrderId(generatedId);
      setPaymentDetails({ amount, method: methodUsed });
      setBooking(prev => ({ ...prev, appliedPromoCode: null, notes: '' }));
      navigateTo('success');
    } catch (err: any) {
      console.log('Create booking api error:', err);
      alert('Gagal menyimpan pesanan ke database: ' + (err?.response?.data?.message || err.message));
    }
  };

  const handleCancelActiveOrder = async (id?: string, reason?: string) => {
    const targetId = id || transactions.find(t => t.status === 'Dipesan' || t.status === 'Diproses')?.id;
    if (!targetId) return;

    try {
      console.log('Cancelling booking ID:', targetId);
      await api.put(`/bookings/${targetId}/cancel`, {
        reason: reason || 'Dibatalkan oleh pengguna dari layar lacak pesanan.'
      });
      await fetchBookings();
    } catch (err: any) {
      console.log('Cancel booking error:', err);
      alert('Gagal membatalkan pesanan: ' + (err?.response?.data?.message || err.message));
    }
  };

  const handleReviewSubmission = async (id: string, stars: number, text: string, outletRating?: number) => {
    try {
      await api.post(`/bookings/${id}/review`, {
        rating: stars,
        outlet_rating: outletRating,
        comment: text
      });
      await fetchBookings();
    } catch (err: any) {
      console.log('Error submitting review:', err);
      alert('Gagal mengirim ulasan: ' + (err?.response?.data?.message || err.message));
    }
  };

  const handleRepeatOrder = (srvName: string, pPrice: number) => {
    // Inject service item names, pre-fill booking setup and push user straight into scheduling menu!
    setBooking(prev => ({
      ...prev,
      selectedPackageId: srvName.toLowerCase().includes('interior') ? 'detailing' : 'premium'
    }));
    navigateTo('booking');
  };

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
    setUserRole('customer');
    setIsLoggedIn(false);
    navigateTo('login');
  };

  // Fetch bookings when switching screens to ensure data is always fresh (e.g. going to history view)
  useEffect(() => {
    if (isLoggedIn && userRole === 'customer' && currentScreen !== 'welcome' && currentScreen !== 'login' && currentScreen !== 'register') {
      fetchBookings();
    }
  }, [currentScreen, isLoggedIn, userRole]);

  // Global background polling for real-time bookings & notifications & promos & packages
  useEffect(() => {
    if (!isLoggedIn || userRole !== 'customer') return;

    fetchBookings(); // Fetch immediately
    fetchDbPromos();
    fetchDbPackages();

    const interval = setInterval(() => {
      fetchBookings();
      fetchDbPromos();
      fetchDbPackages();
    }, 4000); // Poll every 4 seconds globally

    return () => clearInterval(interval);
  }, [isLoggedIn, userRole]);

  // Mark all notifications as read when viewing the alerts screen
  useEffect(() => {
    if (currentScreen === 'alerts' && notifications.length > 0) {
      const allIds = notifications.map(n => n.id);
      setReadNotifIds(prev => {
        const union = Array.from(new Set([...prev, ...allIds]));
        localStorage.setItem('readNotifIds', JSON.stringify(union));
        return union;
      });
    }
  }, [currentScreen, notifications]);

  // Auto-dismiss the premium toast popup after 4 seconds
  useEffect(() => {
    if (activeToast) {
      const timer = setTimeout(() => {
        setActiveToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [activeToast]);

  // Intercept window.alert to display beautiful custom modal dialogs instead of native browser popups
  useEffect(() => {
    const nativeAlert = window.alert;
    window.alert = (message: any) => {
      setCustomAlert({ message: String(message) });
    };
    return () => {
      window.alert = nativeAlert;
    };
  }, []);

  const handleClearNotifications = () => {
    if (window.confirm('Apakah Anda yakin ingin menghapus semua notifikasi?')) {
      const allIds = notifications.map(n => n.id);
      const updated = Array.from(new Set([...deletedNotifIds, ...allIds]));
      setDeletedNotifIds(updated);
      localStorage.setItem('deletedNotifIds', JSON.stringify(updated));
      setPromoNotifications([]);
      localStorage.setItem('promoNotifications', JSON.stringify([]));
      setNotifications([]);
    }
  };

  const handleDeleteNotification = (id: string) => {
    const updated = [...deletedNotifIds, id];
    setDeletedNotifIds(updated);
    localStorage.setItem('deletedNotifIds', JSON.stringify(updated));
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const unreadCount = notifications.filter(n => !readNotifIds.includes(n.id)).length;

  if (authLoading) {

    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  
  }

  // Rendering screen router handler switch
  return (
    <>
      <AnimatePresence mode="wait">
        {isLoggedIn && user?.status === 'inactive' ? (
          <motion.div
            key="inactive-account"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center"
          >
            <div className="max-w-md bg-slate-800 rounded-3xl p-8 border border-slate-700/50 shadow-2xl flex flex-col items-center gap-5">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/30 text-red-500 animate-pulse">
                <span className="material-symbols-outlined text-[32px]">block</span>
              </div>
              <h2 className="text-xl font-black text-white">Akun Anda Dinonaktifkan</h2>
              <p className="text-xs text-slate-400 font-semibold leading-relaxed">
                Halo, {user?.name}. Status akun {userRole === 'technician' ? 'teknisi' : 'pelanggan'} Anda saat ini sedang dinonaktifkan oleh administrator. Anda tidak dapat menggunakan fitur aplikasi Clean Vehicle.
              </p>
              <div className="p-3.5 bg-slate-900/60 rounded-xl border border-slate-700/30 w-full text-[11px] font-bold text-slate-400">
                Hubungi administrator untuk mengaktifkan kembali akun Anda.
              </div>
              <button
                onClick={() => {
                  setUser(null);
                  setIsLoggedIn(false);
                  localStorage.clear();
                  navigateTo('welcome');
                }}
                className="w-full py-3 bg-red-600 hover:bg-red-750 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer border-none"
              >
                Keluar Aplikasi
              </button>
            </div>
          </motion.div>
        ) : (
          <>
            {currentScreen === 'welcome' && (
          <motion.div
            key="welcome"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="min-h-screen flex flex-col"
          >
            <WelcomeView 
              darkMode={darkMode}
              onToggleTheme={handleToggleTheme}
              onMulai={() => navigateTo('login')} 
              onMasuk={() => navigateTo('login')} 
            />
          </motion.div>
        )}

        {currentScreen === 'login' && (
          <motion.div
            key="login"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="min-h-screen flex flex-col"
          >
            <LoginView 
              onLoginSuccess={handleLoginSuccess}
              onGoToRegister={() => navigateTo('register')}
              onBack={() => navigateTo('welcome')}
            />
          </motion.div>
        )}

        {currentScreen === 'register' && (
          <motion.div
            key="register"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="min-h-screen flex flex-col"
          >
            <RegisterView 
              onRegisterSuccess={handleRegisterSuccess}
              onGoToLogin={() => navigateTo('login')}
              onBack={() => navigateTo('login')}
            />
          </motion.div>
        )}

        {currentScreen === 'dashboard' && (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="min-h-screen flex flex-col"
          >
            <DashboardView 
              darkMode={darkMode}
              onToggleTheme={handleToggleTheme}
              userName={user?.name || 'Alexander Sterling'}
              userAvatar={avatarUrl}
              userPhone={user?.phone}
              booking={booking}
              onUpdateBooking={handleUpdateBooking}
              onBookService={(type) => {
                if (type === 'view_packages') {
                  setViewOnlyPackages(true);
                  navigateTo('details');
                  return;
                }
                setViewOnlyPackages(false);
                if (type === 'tempat') {
                  handleUpdateBooking({
                    pickupLocation: 'Outlet Sudirman Plaza Lt. G',
                    locationName: 'Sudirman Plaza'
                  });
                } else {
                  handleUpdateBooking({
                    pickupLocation: booking.pickupLocation || 'Sudirman Central Business District, Jakarta',
                    locationName: booking.locationName || 'Jakarta Selatan'
                  });
                }
                navigateTo('booking');
              }}
              onNavigate={(tab) => {
                if (tab === 'home') navigateTo('dashboard');
                else if (tab === 'history') navigateTo('history');
                else if (tab === 'alerts') navigateTo('alerts');
                else if (tab === 'profile') navigateTo('profile');
              }}
              cars={vehicles}
              packages={dbPackages}
              onSaveLocation={handleSaveLocation}
              transactions={transactions}
              unreadCount={unreadCount}
              promos={dbPromos}
            />
          </motion.div>
        )}

        {currentScreen === 'booking' && (
          <motion.div
            key="booking"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="min-h-screen flex flex-col"
          >
            <BookingView 
              booking={booking}
              onUpdateBooking={handleUpdateBooking}
              onNext={() => navigateTo('details')}
              onBack={() => navigateTo('dashboard')}
              userAvatar={avatarUrl}
              userName={user?.name}
              outlets={dbOutlets}
              technicians={dbTechnicians}
              onSaveLocation={handleSaveLocation}
              cars={vehicles}
            />
          </motion.div>
        )}

        {currentScreen === 'details' && (
          <motion.div
            key="details"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="min-h-screen flex flex-col"
          >
            <ServiceDetailsView 
              booking={booking}
              onUpdateBooking={handleUpdateBooking}
              onNext={() => navigateTo('confirm')}
              onBack={() => navigateTo(viewOnlyPackages ? 'dashboard' : 'booking')}
              userAvatar={avatarUrl}
              userName={user?.name}
              packages={dbPackages}
              viewOnly={viewOnlyPackages}
            />
          </motion.div>
        )}

        {currentScreen === 'confirm' && (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="min-h-screen flex flex-col"
          >
            <ConfirmOrderView 
              booking={booking}
              onUpdateBooking={handleUpdateBooking}
              onNext={() => navigateTo('payment')}
              onBack={() => navigateTo('details')}
              userAvatar={avatarUrl}
              userName={user?.name}
              technicians={dbTechnicians}
              packages={dbPackages}
              onSaveLocation={handleSaveLocation}
              cars={vehicles}
              promos={dbPromos}
              transactions={transactions}
            />
          </motion.div>
        )}

        {currentScreen === 'payment' && (
          <motion.div
            key="payment"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="min-h-screen flex flex-col"
          >
            <PaymentView 
              booking={booking}
              onPaymentSuccess={handlePaymentSuccess}
              onBack={() => navigateTo('confirm')}
              userAvatar={avatarUrl}
              userPhone={user?.phone}
              packages={dbPackages}
              promos={dbPromos}
              transactions={transactions}
            />
          </motion.div>
        )}

        {currentScreen === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="min-h-screen flex flex-col"
          >
            <PaymentSuccessView 
              amountPaid={paymentDetails.amount}
              paymentMethod={paymentDetails.method}
              onLacak={() => navigateTo('tracking')}
              onHome={() => navigateTo('dashboard')}
              serviceType={(booking.pickupLocation.toLowerCase().includes('outlet') || booking.locationName.toLowerCase().includes('outlet')) ? 'outlet' : 'home'}
            />
          </motion.div>
        )}

        {currentScreen === 'tracking' && (
          <motion.div
            key="tracking"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="min-h-screen flex flex-col"
          >
            <TrackingView 
              onBackToHome={() => navigateTo('dashboard')}
              userAvatar={avatarUrl}
              userName={user?.name}
              trackedTransaction={transactions.find(t => t.id === activeTrackedOrderId) || transactions.find(t => t.status === 'Dipesan' || t.status === 'Diproses')}
              onCancelActiveOrder={handleCancelActiveOrder}
            />
          </motion.div>
        )}

        {currentScreen === 'history' && (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="min-h-screen flex flex-col"
          >
            <HistoryView 
              transactions={transactions}
              onSubmitReview={handleReviewSubmission}
              onRepeatOrder={handleRepeatOrder}
              onNavigate={(tab) => {
                if (tab === 'home') navigateTo('dashboard');
                else if (tab === 'history') navigateTo('history');
                else if (tab === 'alerts') navigateTo('alerts');
                else if (tab === 'profile') navigateTo('profile');
              }}
              userAvatar={avatarUrl}
              userName={user?.name}
              onTrackActiveOrder={(orderId) => {
                setActiveTrackedOrderId(orderId);
                navigateTo('tracking');
              }}
              hasReviewedPendingToday={hasReviewedPendingToday}
              unreadCount={unreadCount}
              initialExpandedId={initialExpandedBookingId}
            />
          </motion.div>
        )}

        {currentScreen === 'alerts' && (
          <motion.div
            key="alerts"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="min-h-screen flex flex-col"
          >
            <AlertsView 
              notifications={notifications}
              onClearAll={handleClearNotifications}
              onDeleteNotif={handleDeleteNotification}
              onNavigate={(tab) => {
                if (tab === 'home') navigateTo('dashboard');
                else if (tab === 'history') navigateTo('history');
                else if (tab === 'alerts') navigateTo('alerts');
                else if (tab === 'profile') navigateTo('profile');
              }}
              onCtaAction={(notif) => {
                if (notif.id.startsWith('notif-confirmed-')) {
                  const bookingId = notif.id.replace('notif-confirmed-', '');
                  setActiveTrackedOrderId(bookingId);
                  navigateTo('tracking');
                } else if (notif.id.startsWith('notif-onway-')) {
                  const bookingId = notif.id.replace('notif-onway-', '');
                  setActiveTrackedOrderId(bookingId);
                  navigateTo('tracking');
                } else if (notif.id.startsWith('notif-inprogress-')) {
                  const bookingId = notif.id.replace('notif-inprogress-', '');
                  setActiveTrackedOrderId(bookingId);
                  navigateTo('tracking');
                } else if (notif.id.startsWith('notif-completed-') || notif.id.startsWith('notif-receipt-') || notif.id.startsWith('notif-refunded-')) {
                  let bookingId = '';
                  if (notif.id.startsWith('notif-completed-')) bookingId = notif.id.replace('notif-completed-', '');
                  else if (notif.id.startsWith('notif-receipt-')) bookingId = notif.id.replace('notif-receipt-', '');
                  else if (notif.id.startsWith('notif-refunded-')) bookingId = notif.id.replace('notif-refunded-', '');
                  setInitialExpandedBookingId(bookingId);
                  navigateTo('history');
                } else {
                  navigateTo('booking');
                }
              }}
            />
          </motion.div>
        )}

        {currentScreen === 'profile' && (
          <motion.div
            key="profile"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="min-h-screen flex flex-col"
          >
            <ProfileView 
              darkMode={darkMode}
              onToggleTheme={handleToggleTheme}
              userName={user?.name}
              userAvatar={avatarUrl}
              userEmail={user?.email}
              onUpdateProfile={handleUpdateProfile}
              vehicles={vehicles}
              onAddVehicle={handleAddVehicle}
              onUpdateVehicle={handleUpdateVehicle}
              onDeleteVehicle={handleDeleteVehicle}
              onLogout={() => {
                setUser(null);
                navigateTo('welcome');
              }}
              onNavigate={(tab) => {
                if (tab === 'home') navigateTo('dashboard');
                else if (tab === 'history') navigateTo('history');
                else if (tab === 'alerts') navigateTo('alerts');
                else if (tab === 'profile') navigateTo('profile');
              }}
              booking={booking}
              onSaveLocation={handleSaveLocation}
            />
          </motion.div>
        )}

        {currentScreen === 'technician-home' && (
          <motion.div
            key="technician-home"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="min-h-screen flex flex-col"
          >
            <TechnicianHomeView 
              darkMode={darkMode}
              onToggleTheme={handleToggleTheme}
              technician={user}
              onLogout={handleLogout}
              onRefreshProfile={fetchProfile}
            />
          </motion.div>
        )}
          </>
        )}
      </AnimatePresence>

      {/* Premium Notification Toast Pop Up */}
      <AnimatePresence>
        {activeToast && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            onClick={() => {
              setActiveToast(null);
              navigateTo('alerts');
            }}
            className="fixed top-5 left-5 right-5 md:left-auto md:right-5 md:w-96 z-[9999] bg-[#0a2540]/95 backdrop-blur-md text-white rounded-2xl p-4 shadow-2xl border border-white/10 flex gap-3.5 cursor-pointer active:scale-[0.98] transition-transform select-none"
          >
            <div className="w-10 h-10 rounded-xl bg-[#fdc003] text-[#6c5000] flex items-center justify-center shrink-0 shadow-inner">
              <span className="material-symbols-outlined font-extrabold text-xl animate-bounce">notifications_active</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start gap-2">
                <h4 className="text-xs font-black text-[#fdc003] tracking-wide uppercase">Notifikasi Baru</h4>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveToast(null);
                  }}
                  className="text-white/40 hover:text-white transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
              <h5 className="text-[11px] font-extrabold text-white mt-0.5 line-clamp-1">{activeToast.title}</h5>
              <p className="text-[10px] text-[#768dad] font-semibold mt-0.5 leading-normal line-clamp-2">{activeToast.description}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Alert Modal popup */}
      <AnimatePresence>
        {customAlert && (
          <div className="fixed inset-0 z-[10000] flex items-center justify-center p-5 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="bg-white dark:bg-[#111827] rounded-3xl p-6 shadow-2xl border border-[#efedf0] dark:border-gray-800/40 w-full max-w-sm flex flex-col items-center text-center gap-4 relative overflow-hidden"
            >
              {/* Decorative top yellow stripe */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#fdc003]"></div>
              
              {/* Icon */}
              <div className="w-12 h-12 rounded-full bg-[#ffdf9e]/30 flex items-center justify-center text-[#785900] dark:text-[#fdc003] mt-2">
                <span className="material-symbols-outlined text-2xl font-bold">info</span>
              </div>
              
              {/* Message */}
              <div className="space-y-1.5 w-full">
                <h4 className="font-extrabold text-sm text-[#0a2540] dark:text-white uppercase tracking-wider">Pemberitahuan</h4>
                <p className="text-xs font-semibold text-gray-600 dark:text-slate-400 leading-relaxed whitespace-pre-line">
                  {customAlert.message}
                </p>
              </div>
              
              {/* Action Button */}
              <button
                type="button"
                onClick={() => setCustomAlert(null)}
                className="w-full py-3 bg-[#785900] hover:bg-[#5b4300] text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-md transition-all active:scale-[0.98] cursor-pointer border-none"
              >
                OK
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
