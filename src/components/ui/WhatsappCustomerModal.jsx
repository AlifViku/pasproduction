import { useState, useEffect } from 'react';
import { X, Send, MessageSquare, ExternalLink, Check, AlertCircle, Sparkles } from 'lucide-react';
import { sendWhatsappMessage, formatWhatsappNumber } from '../../services/fonnteService';

export default function WhatsappCustomerModal({ isOpen, onClose, order }) {
  if (!isOpen || !order) return null;

  const customerName = order.customerName || 'Customer';
  const customerPhone = order.customerPhone || '';
  const orderId = order.id || '';

  const [targetPhone, setTargetPhone] = useState(customerPhone);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null); // { type: 'success' | 'error', text: '' }

  // Quick message presets
  const presets = [
    {
      title: 'Konfirmasi Desain & Bahan',
      text: `Halo Kak *${customerName}*! 👋\n\nKami dari *PAS Production* ingin konfirmasi mengenai detail desain dan bahan untuk pesanan *#${orderId}* (${order.productName || 'Kaos Kustom'}). Mohon infokan jika ada permintaan khusus atau penyesuaian posisi sablon ya kak. Terima kasih! 🙏`,
    },
    {
      title: 'Kirim Ulang Info Rekening',
      text: `Halo Kak *${customerName}*,\n\nBerikut informasi rekening pembayaran untuk pesanan *#${orderId}* sebesar *Rp ${order.totalPrice ? Number(order.totalPrice).toLocaleString('id-ID') : '-'}*:\n\n• *BCA*: 123-456-7890 a.n. PAS Production\n• *Mandiri*: 987-654-3210 a.n. PAS Production\n\nSetelah transfer, jangan lupa unggah bukti pembayaran di menu Status Pesanan ya kak. Terima kasih! 🙏`,
    },
    {
      title: 'Pesanan Selesai / Siap Kirim',
      text: `Halo Kak *${customerName}*! 🎉\n\nKabar gembira! Pesanan kaos *#${orderId}* Anda telah selesai diproduksi dengan standar kualitas PAS Production dan telah siap dikirim / diambil. Terima kasih atas kepercayaannya! 👕✨`,
    },
    {
      title: 'Pemberitahuan Khusus',
      text: `Halo Kak *${customerName}*,\n\nTim *PAS Production* ingin menyampaikan informasi penting terkait pesanan Anda *#${orderId}*: \n\n[Tulis pesan Anda di sini]`,
    },
  ];

  useEffect(() => {
    setTargetPhone(customerPhone);
    setMessage(presets[0].text);
    setStatusMsg(null);
  }, [order]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      setStatusMsg({ type: 'error', text: 'Pesan tidak boleh kosong.' });
      return;
    }
    if (!targetPhone.trim()) {
      setStatusMsg({ type: 'error', text: 'Nomor WhatsApp tujuan wajib diisi.' });
      return;
    }

    setSending(true);
    setStatusMsg(null);

    const res = await sendWhatsappMessage({
      target: targetPhone,
      message: message.trim(),
    });

    setSending(false);

    if (res.success) {
      setStatusMsg({
        type: 'success',
        text: `Pesan WhatsApp berhasil dikirim ke ${formatWhatsappNumber(targetPhone)} via Fonnte!`,
      });
      setTimeout(() => {
        onClose();
      }, 1500);
    } else {
      setStatusMsg({
        type: 'error',
        text: res.message || 'Gagal mengirim pesan. Pastikan device Fonnte terhubung.',
      });
    }
  };

  const getWaDirectUrl = () => {
    const num = formatWhatsappNumber(targetPhone);
    const text = encodeURIComponent(message);
    return `https://wa.me/${num}?text=${text}`;
  };

  return (
    <div className="fixed inset-0 z-[250] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-emerald-50 via-teal-50 to-green-50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-gray-900 text-base flex items-center gap-2">
                Kirim WhatsApp ke Customer
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                  Fonnte API
                </span>
              </h3>
              <p className="text-xs text-gray-500">
                Pesanan <span className="font-mono font-bold text-gray-700">#{orderId}</span> • {customerName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSend} className="p-6 overflow-y-auto space-y-4">
          {/* Target Phone */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Nomor WhatsApp Penerima
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={targetPhone}
                onChange={(e) => setTargetPhone(e.target.value)}
                placeholder="Contoh: 08123456789 atau 628123456789"
                className="w-full text-sm font-mono font-semibold px-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none bg-gray-50/50"
              />
              <span className="absolute right-3 top-2.5 text-xs font-bold text-emerald-600">
                +62
              </span>
            </div>
          </div>

          {/* Quick Presets */}
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
              Template Pesan Cepat:
            </label>
            <div className="flex flex-wrap gap-2">
              {presets.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setMessage(preset.text)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-colors"
                >
                  {preset.title}
                </button>
              ))}
            </div>
          </div>

          {/* Message Textarea */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Isi Pesan WhatsApp
            </label>
            <textarea
              required
              rows={7}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ketik pesan yang ingin dikirim ke pelanggan..."
              className="w-full text-sm p-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none bg-gray-50/50 resize-none font-sans leading-relaxed"
            ></textarea>
            <p className="text-[11px] text-gray-400 mt-1">
              Gunakan format WhatsApp: *tebal*, _miring_, ~coret~.
            </p>
          </div>

          {/* Status Message */}
          {statusMsg && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}
            >
              {statusMsg.type === 'success' ? (
                <Check className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              )}
              <span>{statusMsg.text}</span>
            </div>
          )}

          {/* Actions */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            <button
              type="submit"
              disabled={sending}
              className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm py-3 px-4 rounded-xl shadow-lg shadow-emerald-600/25 transition-all disabled:opacity-50"
            >
              {sending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Mengirim via Gateway...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Kirim via Fonnte Gateway</span>
                </>
              )}
            </button>

            <a
              href={getWaDirectUrl()}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 py-3 border border-gray-200 rounded-xl text-gray-700 hover:bg-gray-100 text-sm font-bold transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Buka WA Web</span>
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}

