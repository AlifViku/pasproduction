import { useState, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import {
  MessageSquare,
  RefreshCw,
  Key,
  Smartphone,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  Send,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Tag,
  Settings2,
  Clock,
  Radio,
} from 'lucide-react';
import {
  getFonnteToken,
  setFonnteToken,
  getAdminWhatsappPhone,
  setAdminWhatsappPhone,
  getFonnteSettings,
  setFonnteSettings,
  checkDeviceStatus,
  sendWhatsappMessage,
  formatWhatsappNumber,
} from '../../services/fonnteService';

export default function AdminSettings() {
  const products = useStore((state) => state.products);
  const updateProductPrice = useStore((state) => state.updateProductPrice);
  const orders = useStore((state) => state.orders);

  // Fonnte State
  const [token, setToken] = useState(getFonnteToken());
  const [adminPhone, setAdminPhone] = useState(getAdminWhatsappPhone());
  const [showToken, setShowToken] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [fonnteSettings, setLocalSettings] = useState(getFonnteSettings());

  // Device status state
  const [deviceInfo, setDeviceInfo] = useState(null);
  const [checkingDevice, setCheckingDevice] = useState(false);
  const [deviceError, setDeviceError] = useState(null);

  // Test message state
  const [testTarget, setTestTarget] = useState(adminPhone || '');
  const [testMessage, setTestMessage] = useState(
    `╭────────────────────────────╮\n  ✨ *PAS PRODUCTION* ✨\n  _Uji Coba WhatsApp Gateway_\n╰────────────────────────────╯\n\nHalo! Pesan ini merupakan konfirmasi bahwa sistem notifikasi WhatsApp resmi *PAS Production* telah berhasil terhubung dan siap beroperasi dengan sempurna. 👕🎉`
  );
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState(null);

  // Load device status on mount
  useEffect(() => {
    handleCheckDevice();
  }, []);

  const handleSaveFonnte = (e) => {
    e.preventDefault();
    setFonnteToken(token);
    setAdminWhatsappPhone(adminPhone);
    setFonnteSettings(fonnteSettings);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
    handleCheckDevice();
  };

  const handleToggleSetting = (key) => {
    const updated = { ...fonnteSettings, [key]: !fonnteSettings[key] };
    setLocalSettings(updated);
    setFonnteSettings(updated);
  };

  const handleCheckDevice = async () => {
    setCheckingDevice(true);
    setDeviceError(null);
    try {
      const res = await checkDeviceStatus(token);
      if (res.success) {
        setDeviceInfo(res);
      } else {
        setDeviceInfo(res.raw || null);
        setDeviceError(res.message);
      }
    } catch (err) {
      setDeviceError(err?.message || 'Gagal memeriksa status Fonnte.');
    } finally {
      setCheckingDevice(false);
    }
  };

  const handleSendTestMessage = async (e) => {
    e.preventDefault();
    if (!testTarget.trim()) {
      setTestResult({ type: 'error', text: 'Nomor tujuan wajib diisi.' });
      return;
    }
    if (!testMessage.trim()) {
      setTestResult({ type: 'error', text: 'Isi pesan tidak boleh kosong.' });
      return;
    }

    setSendingTest(true);
    setTestResult(null);

    const res = await sendWhatsappMessage({
      target: testTarget,
      message: testMessage,
      token,
    });

    setSendingTest(false);
    if (res.success) {
      setTestResult({
        type: 'success',
        text: `Berhasil terkirim ke WhatsApp ${formatWhatsappNumber(testTarget)}!`,
      });
    } else {
      setTestResult({
        type: 'error',
        text: res.message || 'Gagal mengirim. Pastikan status WhatsApp "connect" di dashboard gateway.',
      });
    }
  };

  const handlePriceChange = (id, price) => {
    updateProductPrice(id, parseInt(price));
    alert('Harga berhasil diubah!');
  };

  const handleGenerateReport = () => {
    const doc = new jsPDF();
    doc.text('Laporan Pemesanan PAS Production', 14, 15);
    const tableBody = orders.map((o) => {
      let sizeInfo = '';
      if (o.items) {
        sizeInfo = o.items
          .map((item) => {
            if (item.type === 'standard') return `${item.quantity}x ${item.size}`;
            return `${item.quantity}x Cust(PB:${item.customSize.panjangBadan})`;
          })
          .join(', ');
      } else {
        sizeInfo = o.sizeType === 'custom' ? `Custom` : o.size;
      }

      return [
        o.id,
        new Date(o.createdAt).toLocaleDateString('id-ID'),
        o.customerName,
        o.productName || 'Standar',
        sizeInfo,
        `${o.quantity} pcs`,
        `Rp ${o.totalPrice ? o.totalPrice.toLocaleString('id-ID') : '-'}`,
        o.status,
      ];
    });

    doc.autoTable({
      startY: 25,
      head: [['ID', 'Tanggal', 'Customer', 'Produk', 'Ukuran', 'Jumlah', 'Total', 'Status']],
      body: tableBody,
    });

    doc.save('Laporan_PAS_Production.pdf');
  };

  const isConnected = deviceInfo?.deviceStatus === 'connect';

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl">
      <div>
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-3">
          <Settings2 className="w-8 h-8 text-[#aa3bff]" />
          Pengaturan Sistem & Integrasi
        </h2>
        <p className="mt-1 text-gray-500 font-medium">
          Kelola konfigurasi WhatsApp Gateway Fonnte, tarif produk, dan unduh laporan pemesanan.
        </p>
      </div>

      {/* SECTION 1: FONNTE WHATSAPP GATEWAY */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Card Header */}
        <div className="p-6 sm:p-8 bg-gradient-to-r from-emerald-50 via-teal-50 to-green-50/50 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25 shrink-0">
              <MessageSquare className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-extrabold text-gray-900">
                  Integrasi WhatsApp Gateway (Fonnte API)
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Aktif
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-0.5">
                Kirim notifikasi otomatis secara realtime ke WhatsApp pelanggan & tim admin.
              </p>
            </div>
          </div>

          <a
            href="https://fonnte.com"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-white px-3.5 py-2 rounded-xl border border-emerald-200 shadow-sm hover:bg-emerald-50 transition-colors"
          >
            Dashboard Fonnte <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="p-6 sm:p-8 space-y-8">
          {/* Device Live Status Banner */}
          <div className="p-5 rounded-2xl border bg-gray-50/80 border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Status Perangkat WhatsApp:
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold ${
                    isConnected
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                      : 'bg-amber-100 text-amber-800 border border-amber-300'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                    }`}
                  ></span>
                  {isConnected
                    ? 'TERHUBUNG (CONNECT)'
                    : deviceInfo?.deviceStatus === 'disconnect'
                    ? 'DISCONNECT (BELUM SCAN QR)'
                    : 'MEMERIKSA...'}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-gray-600 pt-1">
                <span>
                  No. WhatsApp:{' '}
                  <strong className="text-gray-900 font-mono">
                    {deviceInfo?.device || '6281386826653'}
                  </strong>
                </span>
                <span>
                  Paket:{' '}
                  <strong className="text-gray-900">{deviceInfo?.package || 'Free'}</strong>
                </span>
                <span>
                  Sisa Kuota:{' '}
                  <strong className="text-emerald-600 font-bold">
                    {deviceInfo?.quota ?? '1000'} pesan
                  </strong>
                </span>
                <span>
                  Masa Berlaku:{' '}
                  <strong className="text-gray-900">{deviceInfo?.expired || '-'}</strong>
                </span>
              </div>

              {!isConnected && (
                <p className="text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 mt-2 font-medium">
                  💡 <strong>Catatan:</strong> Status saat ini <em>disconnect</em>. Silakan buka{' '}
                  <a
                    href="https://fonnte.com"
                    target="_blank"
                    rel="noreferrer"
                    className="underline font-bold"
                  >
                    fonnte.com
                  </a>{' '}
                  lalu scan QR Code WhatsApp di menu Device agar pesan dapat langsung terkirim ke
                  nomor tujuan.
                </p>
              )}
            </div>

            <button
              onClick={handleCheckDevice}
              disabled={checkingDevice}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-100 text-xs font-bold transition-all shadow-sm shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${checkingDevice ? 'animate-spin' : ''}`} />
              Periksa Status Koneksi
            </button>
          </div>

          {/* Form Credentials */}
          <form onSubmit={handleSaveFonnte} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Token */}
              <div>
                <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-emerald-600" /> Fonnte API Token
                </label>
                <div className="relative">
                  <input
                    type={showToken ? 'text' : 'password'}
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    placeholder="Masukkan token dari Fonnte..."
                    className="w-full text-sm font-mono px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none bg-white pr-12 transition-all font-semibold"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-700"
                  >
                    {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-gray-500 mt-1.5">
                  Token otomatis tersimpan di browser & terbaca dari <code>.env</code>{' '}
                  (<code>VITE_FONNTE_TOKEN</code>).
                </p>
              </div>

              {/* Admin Phone */}
              <div>
                <label className="block text-xs font-extrabold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-emerald-600" /> Nomor WhatsApp Admin (Notifikasi)
                </label>
                <input
                  type="text"
                  value={adminPhone}
                  onChange={(e) => setAdminPhone(e.target.value)}
                  placeholder="Contoh: 081386826653"
                  className="w-full text-sm font-mono px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none bg-white transition-all font-semibold"
                />
                <p className="text-[11px] text-gray-500 mt-1.5">
                  Nomor admin yang akan menerima notifikasi otomatis saat pesanan baru masuk atau bukti bayar diunggah.
                </p>
              </div>
            </div>

            {/* Notification Automation Toggles */}
            <div className="border border-gray-200 rounded-2xl p-5 bg-gray-50/50 space-y-4">
              <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-600" />
                Otomatisasi Notifikasi WhatsApp:
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-medium text-gray-700">
                <label className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 cursor-pointer hover:border-emerald-300 transition-colors">
                  <input
                    type="checkbox"
                    checked={fonnteSettings.notifyCustomerOnOrder}
                    onChange={() => handleToggleSetting('notifyCustomerOnOrder')}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <span>Kirim rincian invoice ke <strong>Customer</strong> saat pesanan baru dibuat</span>
                </label>

                <label className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 cursor-pointer hover:border-emerald-300 transition-colors">
                  <input
                    type="checkbox"
                    checked={fonnteSettings.notifyAdminOnOrder}
                    onChange={() => handleToggleSetting('notifyAdminOnOrder')}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <span>Kirim alert ke <strong>Admin</strong> saat pesanan baru masuk</span>
                </label>

                <label className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 cursor-pointer hover:border-emerald-300 transition-colors">
                  <input
                    type="checkbox"
                    checked={fonnteSettings.notifyCustomerOnPayment}
                    onChange={() => handleToggleSetting('notifyCustomerOnPayment')}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <span>Kirim notifikasi ke <strong>Customer</strong> saat pembayaran diverifikasi/ditolak</span>
                </label>

                <label className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 cursor-pointer hover:border-emerald-300 transition-colors">
                  <input
                    type="checkbox"
                    checked={fonnteSettings.notifyCustomerOnStatus}
                    onChange={() => handleToggleSetting('notifyCustomerOnStatus')}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <span>Kirim notifikasi ke <strong>Customer</strong> saat status produksi di-update</span>
                </label>

                <label className="flex items-center gap-3 p-3 bg-white rounded-xl border border-gray-200 cursor-pointer hover:border-emerald-300 transition-colors sm:col-span-2">
                  <input
                    type="checkbox"
                    checked={fonnteSettings.notifyAdminOnPaymentUpload}
                    onChange={() => handleToggleSetting('notifyAdminOnPaymentUpload')}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <span>Kirim alert ke <strong>Admin</strong> saat customer mengunggah bukti pembayaran</span>
                </label>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex items-center gap-4">
              <button
                type="submit"
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-6 py-3 rounded-xl shadow-lg shadow-emerald-600/25 transition-all cursor-pointer hover:-translate-y-0.5"
              >
                <Check className="w-4 h-4" /> Simpan Konfigurasi WhatsApp
              </button>

              {saveSuccess && (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 animate-in fade-in flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4" /> Konfigurasi berhasil disimpan!
                </span>
              )}
            </div>
          </form>

          {/* Test WhatsApp Dispatcher */}
          <div className="border-t border-gray-100 pt-6">
            <h4 className="text-sm font-extrabold text-gray-900 mb-1 flex items-center gap-2">
              <Send className="w-4 h-4 text-emerald-600" />
              Uji Coba Pengiriman Pesan WhatsApp
            </h4>
            <p className="text-xs text-gray-500 mb-4">
              Uji apakah API Token dan koneksi Fonnte berjalan dengan mengirim pesan percobaan ke nomor WhatsApp Anda.
            </p>

            <form onSubmit={handleSendTestMessage} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Nomor WhatsApp Tujuan
                </label>
                <input
                  type="text"
                  required
                  value={testTarget}
                  onChange={(e) => setTestTarget(e.target.value)}
                  placeholder="081386826653"
                  className="w-full text-xs font-mono px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none bg-white font-bold"
                />
              </div>

              <div className="md:col-span-2 flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    Isi Pesan Uji Coba
                  </label>
                  <input
                    type="text"
                    required
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none bg-white"
                  />
                </div>
                <div className="sm:self-end">
                  <button
                    type="submit"
                    disabled={sendingTest}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gray-900 hover:bg-black text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all disabled:opacity-50 h-[38px] cursor-pointer"
                  >
                    {sendingTest ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Mengirim...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Kirim Uji Coba</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>

            {testResult && (
              <div
                className={`mt-4 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                  testResult.type === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                {testResult.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                )}
                <span>{testResult.text}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 2: PRODUCT PRICING */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-purple-50 text-[#aa3bff] rounded-xl">
            <Tag className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Pengaturan Harga Dasar Produk</h3>
            <p className="text-sm text-gray-500">Atur harga satuan dasar pakaian yang digunakan pada sistem kalkulator harga.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
          {products.map((product) => (
            <div
              key={product.id}
              className="flex items-center justify-between p-4 rounded-2xl border border-gray-200 bg-gray-50/50 hover:bg-white hover:shadow-sm transition-all"
            >
              <div>
                <div className="font-bold text-gray-900 text-sm">{product.name}</div>
                <div className="text-xs text-gray-500 font-mono">ID: {product.id}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-gray-500">Rp</span>
                <input
                  type="number"
                  defaultValue={product.basePrice}
                  onBlur={(e) => handlePriceChange(product.id, e.target.value)}
                  className="border border-gray-300 rounded-xl px-3 py-1.5 w-32 font-bold text-sm text-gray-900 focus:ring-2 focus:ring-[#aa3bff]/20 focus:border-[#aa3bff] bg-white outline-none"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 3: REPORT GENERATION */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Laporan Pemesanan (PDF)</h3>
            <p className="text-sm text-gray-500">Unduh data rekapitulasi seluruh pesanan produksi ke dalam dokumen PDF resmi.</p>
          </div>
        </div>

        <button
          onClick={handleGenerateReport}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-3 rounded-xl font-bold text-sm shadow-md shadow-emerald-600/20 transition-all cursor-pointer hover:-translate-y-0.5 shrink-0"
        >
          <FileText className="w-4 h-4" />
          Unduh Laporan PDF
        </button>
      </div>
    </div>
  );
}
