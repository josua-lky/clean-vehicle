import { NotificationItem } from './types';

export const NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'notif-1',
    category: 'pesanan',
    title: 'Pesanan Diterima',
    time: '10:45',
    description: 'Tim kami telah menerima pesanan cuci mobil Anda. Petugas akan segera meluncur ke lokasi.',
    idTag: 'ID #882190'
  },
  {
    id: 'notif-2',
    category: 'pesanan',
    title: 'Pembayaran Berhasil',
    time: '08:20',
    description: 'Terima kasih! Pembayaran untuk \'Diamond Wash\' telah kami verifikasi.'
  },
  {
    id: 'notif-3',
    category: 'promo',
    title: 'Diskon 50% Menunggumu',
    time: 'Kemarin',
    description: 'Dapatkan diskon eksklusif 50% bagi pelanggan setia untuk perawatan detailing penuh akhir bulan ini!'
  },
  {
    id: 'notif-4',
    category: 'promo',
    title: 'Kado Akhir Pekan',
    time: 'Kemarin',
    description: 'Dapatkan free vacuum interior untuk setiap pemesanan layanan exterior wash hari ini!'
  },
  {
    id: 'notif-5',
    category: 'info',
    title: 'Pengingat Cuci Rutin',
    time: '2 hari lalu',
    description: 'Sudah 2 minggu sejak cuci terakhir. Jaga kilau kendaraan Anda dengan rutin berkunjung.',
    hasCta: true,
    ctaText: 'JADWALKAN SEKARANG'
  },
  {
    id: 'notif-6',
    category: 'info',
    title: 'Area Layanan Baru',
    time: '4 hari lalu',
    description: 'Kabar gembira! Kini kami hadir melayani wilayah Jakarta Selatan secara menyeluruh untuk Cuci di Rumah.'
  }
];
