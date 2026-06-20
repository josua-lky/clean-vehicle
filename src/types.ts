export interface Car {
  id: string;
  name: string;
  brand?: string;
  model?: string;
  color?: string;
  year?: string | number;
  plate: string;
  type: 'motor' | 'mobil';
  isPrimary?: boolean;
}

export interface Technician {
  id: string;
  name: string;
  rating: number;
  reviewsCount: number;
  avatar: string;
  specialties: string[];
  status: 'Tersedia' | 'Sibuk';
}

export interface ServicePackage {
  id: string;
  name: string;
  description: string;
  price: number;
  priceLabel: string;
  isBestSeller?: boolean;
}

export interface Transaction {
  id: string;
  serviceName: string;
  date: string;
  price: number;
  status: 'Selesai' | 'Dibatalkan' | 'Diproses' | 'Dipesan';
  rating?: number;
  reviewText?: string;
  isRefunded?: boolean;
  canRepeat?: boolean;
  vehicleName?: string;
  vehicleType?: 'mobil' | 'motor';
  packageName?: string;
  additionalNotes?: string;
  promoCode?: string;
  serviceAddress?: string;
  serviceType?: 'home' | 'outlet';
  beforePhoto?: string;
  afterPhoto?: string;
  cancelledReason?: string;
  payment?: {
    status: string;
    refundAmount: number;
    refundedAt?: string;
  } | null;
  technician?: {
    id: string;
    name: string;
    rating: number;
    avatar: string;
    profile_photo?: string;
    specialization?: string;
    area?: string;
  } | null;
}

export interface ReceiptItem {
  bookingCode: string;
  packageName: string;
  vehicleName: string;
  price: number;
  discount: number;
  total: number;
  method: string;
  date: string;
}

export interface NotificationItem {
  id: string;
  category: 'pesanan' | 'promo' | 'info';
  title: string;
  time: string;
  description: string;
  idTag?: string;
  hasCta?: boolean;
  ctaText?: string;
  receipt?: ReceiptItem;
  timestamp?: number;
}

export interface BookingState {
  vehicleType: 'motor' | 'mobil';
  selectedServiceId: string | null;
  selectedPackageId: string; // 'basic' | 'premium' | 'detailing'
  selectedTechnicianId: string | null;
  selectedDate: string; // '18' | '19' | '20' | '21'
  selectedTime: string; // '09:00' | '11:00' | '14:00' | '16:00'
  locationName: string;
  pickupLocation: string;
  selectedCarId: string;
  paymentMethod: 'bank' | 'wallet' | 'card';
  appliedPromoCode?: string | null;
  selectedOutletId?: string | null;
}
