/**
 * Barcha frontend modullari uchun yagona API bazaviy URL.
 * apiService, UdkVerify, errorHandler va boshqa joylar shu moduldan foydalanishi kerak.
 */
export const isProductionHost =
  import.meta.env.PROD ||
  (typeof window !== 'undefined' &&
    (window.location.hostname === 'ilmiyfaoliyat.uz' ||
      window.location.hostname === 'www.ilmiyfaoliyat.uz'));

export const API_V1_BASE_URL = isProductionHost
  ? 'https://api.ilmiyfaoliyat.uz/api/v1'
  : (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1');

export const API_MEDIA_BASE_URL = isProductionHost
  ? 'https://api.ilmiyfaoliyat.uz/media/'
  : (import.meta.env.VITE_MEDIA_URL || 'http://127.0.0.1:8000/media/');
