import { useState, useEffect } from 'react';
import { X, CheckCircle, QrCode, CreditCard, Shield, Clock, Copy, ArrowRight, MessageSquare, ExternalLink } from 'lucide-react';

export default function MayarPaymentModal({ isOpen, onClose, orderData, onPaymentSuccess }) {
  if (!isOpen || !orderData) return null;

  // Payment Scheme: 'dp' (50%) or 'full' (100%)
  const [paymentScheme, setPaymentScheme] = useState('dp');
  // Channel: 'qris', 'va_bca', 'va_mandiri', 'gopay'
  const [channel, setChannel] = useState('qris');
  // Steps: 'select' -> 'processing' -> 'success'
  const [step, setStep] = useState('select');
  const [copied, setCopied] = useState(false);
  const [timeLeft, setTimeLeft] = useState(899); // 15 mins

  const totalPrice = orderData.totalPrice || 0;
  const dpAmount = Math.round(totalPrice * 0.5);
  const amountToPay = paymentScheme === 'dp' ? dpAmount : totalPrice;
  const remainingAmount = paymentScheme === 'dp' ? (totalPrice - dpAmount) : 0;

  // Countdown timer
  useEffect(() => {
    if (step === 'success') return;
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [step]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const copyVA = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleProcessPayment = () => {
    setStep('processing');
    setTimeout(() => {
      setStep('success');
    }, 1500);
  };

  const handleFinish = () => {
    onPaymentSuccess({
      paymentScheme,
      paidAmount: amountToPay,
      remainingAmount,
      channel,
      paymentGateway: 'Mayar',
      paidAt: new Date().toISOString()
    });
    onClose();
  };

  const vaNumber = `8800${orderData.id?.replace(/\D/g, '') || '91234'}`;

  // WhatsApp reminder message
  const waMessage = encodeURIComponent(
    `Halo ${orderData.customerName || 'Customer'},\n\nTerima kasih! Pesanan baju custom Anda di *PAS Production* (ID: *${orderData.id}*) telah berhasil kami terima via *Mayar Payment*.\n\n` +
    `• Produk: ${orderData.productName}\n` +
    `• Bahan: ${orderData.fabric || 'Cotton Combed 30s'}\n` +
    `• Sablon: ${orderData.printType || 'DTF'}\n` +
    `• Jumlah: ${orderData.quantity} pcs\n` +
    `• Skema Bayar: ${paymentScheme === 'dp' ? 'Uang Muka (DP 50%)' : 'Lunas (100%)'}\n` +
    `• Jumlah Dibayar: Rp ${amountToPay.toLocaleString('id-ID')}\n` +
    (paymentScheme === 'dp' ? `• *Sisa Pembayaran (Pelunasan): Rp ${remainingAmount.toLocaleString('id-ID')}* (Dilunasi saat baju selesai diproduksi).\n\n` : `\n`) +
    `Pantau proses pengerjaan pesanan Anda secara berkala di website PAS Production.`
  );

  return (
    <div className="fixed inset-0 z-[250] bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200 border border-gray-100">
        
        {/* Mayar Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center font-black text-sm">
              M
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight">Mayar Pay</span>
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-semibold">Official Gateway</span>
              </div>
              <p className="text-[11px] text-white/80">Pembayaran Aman untuk PAS Production</p>
            </div>
          </div>
          {step !== 'success' && (
            <button onClick={onClose} className="p-1.5 text-white/80 hover:text-white rounded-full hover:bg-white/10 transition-colors">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Step: SELECT PAYMENT SCHEME & METHOD */}
        {step === 'select' && (
          <div className="p-6 overflow-y-auto space-y-5">
            
            {/* Timer and Order Info */}
            <div className="flex justify-between items-center bg-gray-50 p-3 rounded-2xl border border-gray-100 text-xs">
              <div>
                <span className="text-gray-400 block text-[10px]">ID Pesanan</span>
                <span className="font-mono font-bold text-gray-800">{orderData.id}</span>
              </div>
              <div className="text-right">
                <span className="text-gray-400 block text-[10px] flex items-center justify-end gap-1">
                  <Clock className="w-3 h-3 text-orange-500 inline" /> Sisa Waktu
                </span>
                <span className="font-mono font-bold text-orange-600">{formatTime(timeLeft)}</span>
              </div>
            </div>

            {/* Poin 11: Skema Pembayaran (DP vs Lunas) */}
            <div>
              <label className="text-xs font-bold text-gray-800 block mb-2">
                1. Pilih Skema Pembayaran:
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setPaymentScheme('dp')}
                  className={`p-3.5 rounded-2xl border-2 text-left transition-all ${paymentScheme === 'dp' ? 'border-purple-600 bg-purple-50/50 shadow-sm' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-gray-900">Uang Muka (DP 50%)</span>
                    <span className="w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center border-purple-600">
                      {paymentScheme === 'dp' && <div className="w-1.5 h-1.5 bg-purple-600 rounded-full" />}
                    </span>
                  </div>
                  <span className="text-sm font-extrabold text-purple-700 block">
                    Rp {dpAmount.toLocaleString('id-ID')}
                  </span>
                  <span className="text-[10px] text-gray-500 block mt-0.5">
                    Sisa Rp {dpAmount.toLocaleString('id-ID')} saat selesai
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentScheme('full')}
                  className={`p-3.5 rounded-2xl border-2 text-left transition-all ${paymentScheme === 'full' ? 'border-purple-600 bg-purple-50/50 shadow-sm' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-gray-900">Pembayaran Lunas</span>
                    <span className="w-3.5 h-3.5 rounded-full border-2 flex items-center justify-center border-purple-600">
                      {paymentScheme === 'full' && <div className="w-1.5 h-1.5 bg-purple-600 rounded-full" />}
                    </span>
                  </div>
                  <span className="text-sm font-extrabold text-purple-700 block">
                    Rp {totalPrice.toLocaleString('id-ID')}
                  </span>
                  <span className="text-[10px] text-emerald-600 font-semibold block mt-0.5">
                    ✓ Tanpa tagihan sisa
                  </span>
                </button>
              </div>
            </div>

            {/* Poin 10: Metode Pembayaran Digital Mayar */}
            <div>
              <label className="text-xs font-bold text-gray-800 block mb-2">
                2. Pilih Metode Digital Mayar:
              </label>
              <div className="space-y-2">
                
                {/* QRIS */}
                <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${channel === 'qris' ? 'border-purple-600 bg-purple-50/30' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <div className="flex items-center gap-3">
                    <input type="radio" checked={channel === 'qris'} onChange={() => setChannel('qris')} className="accent-purple-600" />
                    <div>
                      <span className="text-xs font-bold text-gray-800 block">QRIS (Semua Bank & E-Wallet)</span>
                      <span className="text-[10px] text-gray-400">BCA, Mandiri, GoPay, OVO, ShopeePay, Dana</span>
                    </div>
                  </div>
                  <QrCode className="w-5 h-5 text-purple-600" />
                </label>

                {/* Virtual Account BCA */}
                <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${channel === 'va_bca' ? 'border-purple-600 bg-purple-50/30' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <div className="flex items-center gap-3">
                    <input type="radio" checked={channel === 'va_bca'} onChange={() => setChannel('va_bca')} className="accent-purple-600" />
                    <div>
                      <span className="text-xs font-bold text-gray-800 block">BCA Virtual Account</span>
                      <span className="text-[10px] text-gray-400">Verifikasi otomatis 24 jam</span>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-blue-800 bg-blue-50 px-2 py-0.5 rounded">BCA</span>
                </label>

                {/* Virtual Account Mandiri */}
                <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${channel === 'va_mandiri' ? 'border-purple-600 bg-purple-50/30' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <div className="flex items-center gap-3">
                    <input type="radio" checked={channel === 'va_mandiri'} onChange={() => setChannel('va_mandiri')} className="accent-purple-600" />
                    <div>
                      <span className="text-xs font-bold text-gray-800 block">Mandiri Virtual Account</span>
                      <span className="text-[10px] text-gray-400">Verifikasi instan</span>
                    </div>
                  </div>
                  <span className="text-xs font-extrabold text-yellow-800 bg-yellow-50 px-2 py-0.5 rounded">MANDIRI</span>
                </label>
              </div>
            </div>

            {/* Total to pay banner */}
            <div className="p-4 bg-gradient-to-r from-gray-900 to-indigo-950 text-white rounded-2xl flex justify-between items-center shadow-lg">
              <div>
                <span className="text-[11px] text-gray-300 block">Total Tagihan Saat Ini:</span>
                <span className="text-xs font-semibold text-purple-300">
                  {paymentScheme === 'dp' ? 'Uang Muka (DP 50%)' : 'Pelunasan Penuh (100%)'}
                </span>
              </div>
              <span className="text-2xl font-black text-white">
                Rp {amountToPay.toLocaleString('id-ID')}
              </span>
            </div>

            {/* Submit button */}
            <button
              type="button"
              onClick={handleProcessPayment}
              className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold rounded-2xl text-sm shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2 transition-all"
            >
              Lanjut Bayar via Mayar <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Step: PROCESSING / SIMULATING */}
        {step === 'processing' && (
          <div className="p-10 flex flex-col items-center justify-center space-y-4 text-center">
            <div className="w-14 h-14 border-4 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
            <div>
              <h4 className="text-base font-bold text-gray-900">Menghubungkan ke Mayar Gateway...</h4>
              <p className="text-xs text-gray-500 mt-1">Memproses pembayaran aman digital Rp {amountToPay.toLocaleString('id-ID')}</p>
            </div>
          </div>
        )}

        {/* Step: SUCCESS + WHATSAPP NOTIFICATION (Poin 12, 13, 14) */}
        {step === 'success' && (
          <div className="p-6 overflow-y-auto space-y-5 animate-in fade-in duration-300">
            
            {/* Success badge */}
            <div className="text-center space-y-2">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-md">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h4 className="text-xl font-extrabold text-gray-900">Pembayaran Berhasil!</h4>
              <p className="text-xs text-gray-500">Transaksi telah diverifikasi otomatis oleh Mayar.</p>
            </div>

            {/* Receipt Summary Card */}
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 text-xs space-y-2">
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">ID Pesanan:</span>
                <span className="font-mono font-bold text-gray-900">{orderData.id}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Skema:</span>
                <span className="font-bold text-purple-700">
                  {paymentScheme === 'dp' ? 'Uang Muka (DP 50%)' : 'Pembayaran Lunas (100%)'}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Nominal Dibayar:</span>
                <span className="font-extrabold text-emerald-600 text-sm">
                  Rp {amountToPay.toLocaleString('id-ID')}
                </span>
              </div>
              {paymentScheme === 'dp' && (
                <div className="flex justify-between pt-1">
                  <span className="text-orange-600 font-bold">Sisa Pembayaran (Pelunasan):</span>
                  <span className="font-bold text-orange-600">
                    Rp {remainingAmount.toLocaleString('id-ID')}
                  </span>
                </div>
              )}
            </div>

            {/* Poin 14: Automated WhatsApp Notification Box */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <span>Notifikasi WhatsApp Otomatis:</span>
              </div>
              <p className="text-[11px] text-emerald-700 leading-relaxed">
                Sistem secara otomatis mengirimkan notifikasi ke nomor WhatsApp Anda 
                {paymentScheme === 'dp' ? (
                  <> terkait konfirmasi DP dan <strong>pengingat sisa pembayaran Rp {remainingAmount.toLocaleString('id-ID')}</strong>.</>
                ) : (
                  <> terkait bukti pelunasan pemesanan custom.</>
                )}
              </p>
              
              <a
                href={`https://wa.me/?text=${waMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-200/80 hover:bg-emerald-300 px-3 py-1.5 rounded-xl transition-colors"
              >
                📱 Buka Pesan WhatsApp <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Finish and go to Status */}
            <button
              type="button"
              onClick={handleFinish}
              className="w-full py-3.5 bg-gray-900 hover:bg-black text-white font-extrabold rounded-2xl text-xs sm:text-sm shadow-xl transition-all"
            >
              Lihat di Halaman Status Pemesanan →
            </button>

          </div>
        )}

      </div>
    </div>
  );
}
