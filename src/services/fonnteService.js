/**
 * WhatsApp Gateway Service for PAS Production
 * Official WhatsApp notification and messaging system
 * Features:
 * - Direct browser-to-gateway requests
 * - Elegant, branded receipt and tracking templates for customers
 * - Admin alert notifications
 * - Live connection testing and custom message dispatcher
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
    console.error('Gagal menyimpan pengaturan WhatsApp:', err);
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
 * Checks WhatsApp device connection status and quota on gateway
 */
export async function checkDeviceStatus(token = getFonnteToken()) {
  if (!token) {
    return { success: false, message: 'API Token WhatsApp Gateway belum dikonfigurasi.' };
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
      message: error?.message || 'Gagal menghubungi server WhatsApp Gateway.',
      error,
    };
  }
}

/**
 * Core method to send a WhatsApp message
 */
export async function sendWhatsappMessage({
  target,
  message,
  url,
  filename,
  token = getFonnteToken(),
}) {
  if (!token) {
    console.warn('[WhatsApp Gateway] Pesan dibatalkan: Token API belum dikonfigurasi.');
    return { success: false, message: 'Token API WhatsApp belum dikonfigurasi.' };
  }

  const formattedTarget = formatWhatsappNumber(target);
  if (!formattedTarget) {
    console.warn('[WhatsApp Gateway] Pesan dibatalkan: Nomor tujuan tidak valid.', target);
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
      console.log(`[WhatsApp Gateway] Pesan berhasil dikirim ke ${formattedTarget}:`, result);
      return { success: true, data: result };
    } else {
      console.warn(`[WhatsApp Gateway] Gagal mengirim pesan ke ${formattedTarget}:`, result);
      return {
        success: false,
        message: result.reason || result.message || 'Gagal mengirim pesan WhatsApp.',
        data: result,
      };
    }
  } catch (error) {
    console.error(`[WhatsApp Gateway] Error jaringan saat kirim ke ${formattedTarget}:`, error);
    return {
      success: false,
      message: error?.message || 'Terjadi kesalahan jaringan saat mengirim pesan WhatsApp.',
      error,
    };
  }
}

// ---------------------------------------------------------------------------
// Specialized Branded Notification Templates
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
          `  ▫️ ${it.type === 'standard' ? `Ukuran *${it.size}*` : 'Ukuran *Custom*'} : *${it.quantity} pcs*`
      )
      .join('\n');
  }

  const message = `╭────────────────────────────╮
  👕 *PAS PRODUCTION* 👕
  _Official Apparel Custom & Convection_
╰────────────────────────────╯

Halo, Kak *${order.customerName || 'Pelanggan'}*! 👋
Terima kasih telah mempercayakan pembuatan pakaian custom Anda kepada *PAS Production*. Pesanan Anda telah resmi tercatat dalam sistem kami.

📋 *DETAIL INVOICE PEMESANAN:*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• *No. Pesanan*    : *#${order.id}*
• *Tanggal Order*  : ${orderDate}
• *Model Kaos*     : *${order.productName || 'Kaos Kustom'}*
• *Pilihan Bahan*  : ${order.fabric || 'Cotton Combed 30s'}
• *Jenis Sablon*   : ${order.printType || 'DTF'}
• *Total Kuantitas*: *${order.quantity} pcs*
${itemsSummary ? `\n📦 *Rincian Variasi Ukuran:*\n${itemsSummary}\n` : ''}
💰 *TOTAL TAGIHAN:*
👉 *${formattedPrice}*
Status: ⏳ *Menunggu Pembayaran*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💳 *PANDUAN PEMBAYARAN TRANSFER BANK:*
Silakan lakukan pembayaran sesuai nominal di atas ke rekening resmi kami:

🏦 *Bank BCA*
• No. Rekening: *123-456-7890*
• Atas Nama   : *PAS Production*

🏦 *Bank Mandiri*
• No. Rekening: *987-654-3210*
• Atas Nama   : *PAS Production*

📸 *Langkah Selanjutnya:*
Setelah transfer berhasil, mohon simpan bukti transfer dan unggah melalui menu *Status Pesanan* di website PAS Production agar pesanan segera masuk ke antrean produksi.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
💬 *Ada pertanyaan atau revisi desain?*
Silakan langsung balas pesan WhatsApp ini. Tim kami siap membantu!

_Salam hangat, Tim PAS Production_ 🙏✨`;

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

  const message = `╭────────────────────────────╮
  🚨 *PESANAN BARU MASUK!* 🚨
  _PAS Production Management_
╰────────────────────────────╯

Halo Admin, ada pesanan custom baru yang masuk ke sistem:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• *No. Pesanan*   : *#${order.id}*
• *Customer*      : *${order.customerName}*
• *Kontak WA*     : wa.me/${formatWhatsappNumber(order.customerPhone)}
• *Produk*        : *${order.productName || 'Kaos'}* (${order.quantity} pcs)
• *Bahan / Sablon*: ${order.fabric || '-'} / ${order.printType || '-'}
• *Total Tagihan* : *${formattedPrice}*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📝 *Catatan Khusus:*
_${order.notes || 'Tidak ada catatan khusus.'}_

Silakan buka Dashboard Admin untuk memeriksa desain 3D dan detail ukuran pakaian.`;

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

  const message = `╭────────────────────────────╮
  💳 *BUKTI PEMBAYARAN BARU* 💳
  _PAS Production Management_
╰────────────────────────────╯

Customer baru saja mengunggah bukti pembayaran transfer:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• *No. Pesanan* : *#${order.id}*
• *Customer*    : *${order.customerName}* (${order.customerPhone})
• *Nominal*     : *${formattedPrice}*
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Silakan login ke Dashboard Admin lalu buka menu *Verifikasi Pembayaran* untuk melakukan pengecekan.`;

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

  const customerName = order.customerName || 'Pelanggan';
  let message = '';

  if (isApproved) {
    message = `Halo, ${customerName}!\n\nPembayaran untuk pesanan baju custom Anda telah berhasil diverifikasi. Pesanan Anda saat ini resmi masuk ke antrean proses produksi.${notes ? `\n\nCatatan admin: ${notes}` : ''}\n\nTerima kasih atas kepercayaan Anda kepada PAS Production!`;
  } else {
    message = `Halo, ${customerName}!\n\nMohon maaf, pembayaran untuk pesanan baju custom Anda belum dapat kami verifikasi.${notes ? `\n\nCatatan admin: ${notes}` : ''}\n\nSilakan periksa kembali dan konfirmasi ulang melalui aplikasi PAS Production atau balas pesan ini jika membutuhkan bantuan.`;
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

  const customerName = order.customerName || 'Pelanggan';
  let messageBody = '';

  switch (newStatus) {
    case 'Desain Direview':
      messageBody = 'Progress pesanan baju custom Anda saat ini telah memasuki tahap review desain. Desain baju Anda sedang ditinjau oleh tim kami untuk memastikan kesesuaian dan resolusi cetak terbaik.';
      break;

    case 'Pemotongan Kain':
    case 'Pemotongan Bahan':
      messageBody = 'Progress pesanan baju custom Anda saat ini telah memasuki tahap pemotongan bahan. Bahan kain sedang dipotong sesuai ukuran dan spesifikasi pesanan Anda.';
      break;

    case 'Sablon / Bordir':
      messageBody = 'Progress pesanan baju custom Anda saat ini telah memasuki tahap sablon dan bordir. Artwork desain pesanan Anda sedang dalam proses pencetakan pada bahan pakaian.';
      break;

    case 'Penjahitan':
      messageBody = 'Progress pesanan baju custom Anda saat ini telah memasuki tahap penjahitan. Potongan bahan pakaian Anda sedang dirakit dan dijahit rapi oleh tim penjahit kami.';
      break;

    case 'Sedang Diproduksi':
    case 'Diproses':
      messageBody = 'Progress pesanan baju custom Anda saat ini telah memasuki tahap proses produksi. Pakaian Anda sedang dikerjakan di workshop kami sesuai spesifikasi pesanan.';
      break;

    case 'Quality Control':
      messageBody = 'Progress pesanan baju custom Anda saat ini telah memasuki tahap quality control. Pakaian Anda sedang melalui pemeriksaan mutu jahitan dan sablon untuk memastikan hasil terbaik.';
      break;

    case 'Siap Dikirim':
      messageBody = 'Progress pesanan baju custom Anda saat ini telah memasuki tahap siap dikirim. Pakaian Anda telah selesai dipacking rapi dan siap dikirimkan ke alamat Anda atau siap diambil di workshop kami.';
      break;

    case 'Selesai':
      messageBody = 'Pesanan baju custom Anda saat ini telah selesai sepenuhnya. Terima kasih telah mempercayakan pembuatan baju Anda kepada PAS Production!';
      break;

    default:
      messageBody = `Progress pesanan baju custom Anda saat ini telah memasuki tahap ${newStatus.toLowerCase()}. Tim kami sedang memproses pesanan Anda sesuai spesifikasi.`;
  }

  const message = `Halo, ${customerName}!\n\n${messageBody}`;

  return sendWhatsappMessage({ target, message });
}

/**
 * 6. Customer Notification: Payment Reminder (Pengingat Pelunasan)
 * Equivalent to: NotifikasiHelper::kirimPengingatPelunasan($pemesanan)
 */
export async function sendPaymentReminderNotification(order) {
  const target = order.customerPhone;
  if (!target) return { success: false, message: 'No HP customer tidak tersedia.' };

  const customerName = order.customerName || 'Pelanggan';
  const formattedPrice = order.totalPrice
    ? `Rp ${Number(order.totalPrice).toLocaleString('id-ID')}`
    : '-';

  const message = `Halo, ${customerName}!\n\nPesanan baju custom Anda dengan nomor pesanan *#${order.id}* saat ini telah memasuki tahap akhir produksi / siap dikirim. Mohon kesediaannya untuk melakukan pelunasan sisa tagihan sebesar *${formattedPrice}* agar pesanan dapat segera kami kirimkan ke alamat Anda.\n\nTerima kasih atas kerja sama dan kepercayaannya kepada PAS Production! 🙏✨`;

  return sendWhatsappMessage({ target, message });
}

/**
 * 7. Send custom WhatsApp message directly
 */
export async function sendManualWhatsappMessage(phone, message) {
  return sendWhatsappMessage({ target: phone, message });
}

/**
 * Helper object matching Laravel's NotifikasiHelper syntax
 */
export const NotifikasiHelper = {
  kirimUpdateStatus: (order, status) => sendOrderStatusUpdateNotification(order, status || order.status),
  kirimPengingatPelunasan: (order) => sendPaymentReminderNotification(order),
};
