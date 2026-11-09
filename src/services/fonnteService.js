/**
 * Fonnte WhatsApp Gateway API Service for PAS Production
 * Official Documentation: https://fonnte.com
 * Supports:
 * - Direct browser-to-Fonnte API requests (CORS enabled)
 * - Automated notifications for order creation, payment verification, and production progress
 * - Admin alert notifications
 * - Live device status checking & test message dispatcher
 */

const FONNTE_STORAGE_KEY = 'pas_fonnte_token';
const FONNTE_ADMIN_PHONE_KEY = 'pas_fonnte_admin_phone';
const FONNTE_SETTINGS_KEY = 'pas_fonnte_settings';

const DEFAULT_SETTINGS = {
  notifyCustomerOnOrder: true,
  notifyAdminOnOrder: true,
  notifyCustomerOnPayment: true,
  notifyCustomerOnStatus: true,
  notifyAdminOnPaymentUpload: true,
};

export function getFonnteToken() {
  return localStorage.getItem(FONNTE_STORAGE_KEY) || import.meta.env.VITE_FONNTE_TOKEN || '';
}

export function setFonnteToken(token) {
  if (token) {
    localStorage.setItem(FONNTE_STORAGE_KEY, token.trim());
  } else {
    localStorage.removeItem(FONNTE_STORAGE_KEY);
  }
}

export function getAdminWhatsappPhone() {
  return localStorage.getItem(FONNTE_ADMIN_PHONE_KEY) || import.meta.env.VITE_ADMIN_WHATSAPP || '081386826653';
}

export function setAdminWhatsappPhone(phone) {
  if (phone) {
    localStorage.setItem(FONNTE_ADMIN_PHONE_KEY, phone.trim());
  } else {
    localStorage.removeItem(FONNTE_ADMIN_PHONE_KEY);
  }
}

export function getFonnteSettings() {
  try {
    const raw = localStorage.getItem(FONNTE_SETTINGS_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function setFonnteSettings(settings) {
  try {
    localStorage.setItem(FONNTE_SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save Fonnte settings:', err);
  }
}

/**
 * Normalizes Indonesian phone numbers into international WhatsApp standard without '+'
 * Examples:
 *   "0812-3456-7890" -> "6281234567890"
 *   "+62 812 3456 7890" -> "6281234567890"
 *   "8123456789" -> "628123456789"
 */
export function formatWhatsappNumber(phone) {
  if (!phone) return '';
  let cleaned = String(phone).replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.slice(1);
  } else if (cleaned.startsWith('8')) {
    cleaned = '62' + cleaned;
  }
  return cleaned;
}

/**
 * Checks WhatsApp device connection status and quota on Fonnte
 */
export async function checkDeviceStatus(token = getFonnteToken()) {
  if (!token) {
    return { success: false, message: 'Fonnte API Token belum dikonfigurasi.' };
  }

  try {
    const response = await fetch('https://api.fonnte.com/device', {
      method: 'POST',
      headers: {
        Authorization: token,
      },
    });

    const data = await response.json();
    return {
      success: !!data.status,
      device: data.device || '-',
      deviceStatus: data.device_status || 'unknown',
      name: data.name || '-',
      package: data.package || 'Free',
      quota: data.quota || 0,
      expired: data.expired || '-',
      raw: data,
    };
  } catch (error) {
    return {
      success: false,
      message: error?.message || 'Gagal menghubungi server Fonnte.',
      error,
    };
  }
}

/**
 * Core method to send a WhatsApp message via Fonnte API
 */
export async function sendWhatsappMessage({
  target,
  message,
  url,
  filename,
  token = getFonnteToken(),
}) {
  if (!token) {
    console.warn('[Fonnte] Pesan dibatalkan: Token API Fonnte belum dikonfigurasi.');
    return { success: false, message: 'Token Fonnte belum dikonfigurasi.' };
  }

  const formattedTarget = formatWhatsappNumber(target);
  if (!formattedTarget) {
    console.warn('[Fonnte] Pesan dibatalkan: Nomor tujuan tidak valid.', target);
    return { success: false, message: 'Nomor telepon tujuan tidak valid.' };
  }

  if (!message || !message.trim()) {
    return { success: false, message: 'Pesan tidak boleh kosong.' };
  }

  try {
    const formData = new FormData();
    formData.append('target', formattedTarget);
    formData.append('message', message.trim());
    formData.append('countryCode', '62');

    if (url) {
      formData.append('url', url);
    }
    if (filename) {
      formData.append('filename', filename);
    }

    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        Authorization: token,
      },
      body: formData,
    });

    const result = await response.json();

    if (result.status) {
      console.log(`[Fonnte] Berhasil mengirim pesan WhatsApp ke ${formattedTarget}:`, result);
      return { success: true, data: result };
    } else {
      console.warn(`[Fonnte] Gagal mengirim pesan ke ${formattedTarget}:`, result);
      return {
        success: false,
        message: result.reason || result.message || 'Gagal mengirim pesan dari Fonnte.',
        data: result,
      };
    }
  } catch (error) {
    console.error(`[Fonnte] Error koneksi saat kirim ke ${formattedTarget}:`, error);
    return {
      success: false,
      message: error?.message || 'Terjadi kesalahan jaringan saat menghubungi Fonnte API.',
      error,
    };
  }
}

// ---------------------------------------------------------------------------
// Specialized Notification Helpers
// ---------------------------------------------------------------------------

/**
 * 1. Customer Notification: Sent when a new order is placed
 */
export async function sendOrderCreatedCustomerNotification(order) {
  const settings = getFonnteSettings();
  if (!settings.notifyCustomerOnOrder) return { success: false, skipped: true };

  const target = order.customerPhone;
  if (!target) return { success: false, message: 'No HP customer tidak tersedia.' };

  const formattedPrice = order.totalPrice
    ? `Rp ${Number(order.totalPrice).toLocaleString('id-ID')}`
    : '-';

  const orderDate = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('id-ID');

  let itemsSummary = '';
  if (Array.isArray(order.items) && order.items.length > 0) {
    itemsSummary = order.items
      .map(
        (it) =>
          `  • ${it.type === 'standard' ? `Ukuran ${it.size}` : 'Ukuran Custom'}: ${it.quantity} pcs`
      )
      .join('\n');
  }

  const message = `Halo Kak *${order.customerName || 'Pelanggan'}*! 👋

Terima kasih telah memesan produk custom di *PAS Production*. Pesanan Anda telah kami terima dan tercatat dalam sistem kami.

📋 *Rincian Pesanan:*
• No. Pesanan: *#${order.id}*
• Tanggal: ${orderDate}
• Produk: *${order.productName || 'Kaos Kustom'}*
• Bahan: ${order.fabric || 'Cotton Combed 30s'}
• Sablon: ${order.printType || 'DTF'}
• Total Jumlah: *${order.quantity} pcs*
${itemsSummary ? `\n📦 *Rincian Ukuran:*\n${itemsSummary}\n` : ''}
💰 *Total Tagihan:* *${formattedPrice}*
Status: ⏳ *Menunggu Pembayaran*

💳 *Informasi Pembayaran (Transfer Bank):*
• *BCA*: 123-456-7890 a.n. PAS Production
• *Mandiri*: 987-654-3210 a.n. PAS Production

Silakan transfer sesuai nominal di atas, lalu unggah foto bukti transfer Anda melalui menu *Status Pesanan* di website PAS Production agar pesanan dapat segera kami proses ke tahap produksi.

Jika ada pertanyaan atau revisi desain, silakan balas pesan ini. Terima kasih! 🙏✨`;

  return sendWhatsappMessage({ target, message });
}

/**
 * 2. Admin Alert: Sent when a new order arrives
 */
export async function sendOrderCreatedAdminNotification(order) {
  const settings = getFonnteSettings();
  if (!settings.notifyAdminOnOrder) return { success: false, skipped: true };

  const adminPhone = getAdminWhatsappPhone();
  if (!adminPhone) return { success: false, message: 'No HP admin belum disetel.' };

  const formattedPrice = order.totalPrice
    ? `Rp ${Number(order.totalPrice).toLocaleString('id-ID')}`
    : '-';

  const message = `🔔 *NOTIFIKASI PESANAN BARU MASUK!* 🔔

Halo Admin, terdapat pesanan custom baru di PAS Production:

• No. Pesanan: *#${order.id}*
• Customer: *${order.customerName}*
• Kontak WA: wa.me/${formatWhatsappNumber(order.customerPhone)}
• Produk: *${order.productName || 'Kaos'}* (${order.quantity} pcs)
• Bahan / Sablon: ${order.fabric || '-'} / ${order.printType || '-'}
• Total Tagihan: *${formattedPrice}*
• Catatan: ${order.notes || '-'}

Silakan buka Dashboard Admin untuk meninjau desain 3D dan rincian pesanan.`;

  return sendWhatsappMessage({ target: adminPhone, message });
}

/**
 * 3. Admin Alert: Customer uploaded payment proof
 */
export async function sendPaymentUploadedAdminNotification(order) {
  const settings = getFonnteSettings();
  if (!settings.notifyAdminOnPaymentUpload) return { success: false, skipped: true };

  const adminPhone = getAdminWhatsappPhone();
  if (!adminPhone) return { success: false, message: 'No HP admin belum disetel.' };

  const formattedPrice = order.totalPrice
    ? `Rp ${Number(order.totalPrice).toLocaleString('id-ID')}`
    : '-';

  const message = `💳 *BUKTI PEMBAYARAN BARU DIUNGGAH!*

Customer telah mengunggah bukti pembayaran:
• No. Pesanan: *#${order.id}*
• Customer: *${order.customerName}* (${order.customerPhone})
• Nominal: *${formattedPrice}*

Silakan buka menu *Verifikasi Pembayaran* di Dashboard Admin untuk memverifikasi.`;

  return sendWhatsappMessage({ target: adminPhone, message });
}

/**
 * 4. Customer Notification: Payment Verified / Rejected
 */
export async function sendPaymentVerifiedNotification(order, isApproved, notes = '') {
  const settings = getFonnteSettings();
  if (!settings.notifyCustomerOnPayment) return { success: false, skipped: true };

  const target = order.customerPhone;
  if (!target) return { success: false, message: 'No HP customer tidak tersedia.' };

  let message = '';
  if (isApproved) {
    message = `✅ *PEMBAYARAN DIVERIFIKASI*

Halo Kak *${order.customerName}*! 🎉
Kabar baik, pembayaran Anda untuk pesanan *#${order.id}* telah *berhasil diverifikasi* oleh tim PAS Production.

Pesanan Anda kini resmi masuk ke tahap *Produksi*. Tim kami akan segera menyiapkan bahan dan proses sablon sesuai spesifikasi pesanan Anda.
${notes ? `\n📝 *Catatan Admin:* ${notes}\n` : ''}
Anda dapat memantau proses produksi secara realtime melalui menu *Status Pesanan* di aplikasi PAS Production.

Terima kasih atas kepercayaannya! 🙏✨`;
  } else {
    message = `⚠️ *VERIFIKASI PEMBAYARAN BELUM SESUAI*

Halo Kak *${order.customerName}*,
Bukti pembayaran untuk pesanan *#${order.id}* belum dapat kami verifikasi.

${notes ? `📝 *Catatan Admin:* ${notes}\n` : ''}
Mohon periksa kembali transfer Anda dan silakan unggah ulang bukti transfer yang jelas melalui menu *Status Pesanan*.

Jika membutuhkan bantuan, silakan langsung balas pesan WhatsApp ini. Terima kasih! 🙏`;
  }

  return sendWhatsappMessage({ target, message });
}

/**
 * 5. Customer Notification: Production status updated
 */
export async function sendOrderStatusUpdateNotification(order, newStatus) {
  const settings = getFonnteSettings();
  if (!settings.notifyCustomerOnStatus) return { success: false, skipped: true };

  const target = order.customerPhone;
  if (!target) return { success: false, message: 'No HP customer tidak tersedia.' };

  let statusEmoji = '🚀';
  let statusDesc = '';

  switch (newStatus) {
    case 'Desain Direview':
      statusEmoji = '🎨';
      statusDesc = 'Desain 3D Anda sedang ditinjau dan disiapkan untuk resolusi cetak terbaik.';
      break;
    case 'Pemotongan Kain':
      statusEmoji = '✂️';
      statusDesc = 'Bahan kain kaos berkualitas Anda sedang dalam proses pemotongan pola presisi.';
      break;
    case 'Sablon / Bordir':
      statusEmoji = '🖨️';
      statusDesc = 'Artwork desain sedang dicetak dengan teknologi sablon berkualitas tinggi.';
      break;
    case 'Penjahitan':
      statusEmoji = '🧵';
      statusDesc = 'Kaos Anda sedang dalam proses penjahitan rapi oleh penjahit profesional kami.';
      break;
    case 'Quality Control':
      statusEmoji = '🔍';
      statusDesc = 'Pesanan Anda sedang melalui pemeriksaan mutu ketat untuk memastikan hasil sempurna.';
      break;
    case 'Siap Dikirim':
      statusEmoji = '📦';
      statusDesc = 'Pesanan Anda telah selesai dipacking rapi dan siap dikirimkan ke alamat Anda.';
      break;
    case 'Selesai':
      statusEmoji = '🎉';
      statusDesc = 'Pesanan Anda telah selesai. Terima kasih telah mempercayakan produksi kaos kepada PAS Production!';
      break;
    default:
      statusEmoji = '⚡';
      statusDesc = `Status pesanan Anda kini telah diperbarui ke: ${newStatus}.`;
  }

  const message = `${statusEmoji} *UPDATE STATUS PRODUKSI PAS PRODUCTION*

Halo Kak *${order.customerName}*!
Pesanan Anda *#${order.id}* (${order.productName || 'Kaos Kustom'}) telah mencapai tahap:

✨ *${newStatus.toUpperCase()}* ✨

${statusDesc}

Terima kasih atas kesabarannya, kami selalu memastikan kualitas terbaik untuk setiap helai pakaian Anda! 👕🔥`;

  return sendWhatsappMessage({ target, message });
}

/**
 * 6. Send custom WhatsApp message directly
 */
export async function sendManualWhatsappMessage(phone, message) {
  return sendWhatsappMessage({ target: phone, message });
}
