import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { Check, X, Eye } from 'lucide-react';

export default function AdminPayments() {
  const orders = useStore(state => state.orders);
  const verifyPayment = useStore(state => state.verifyPayment);
  const [verificationNotes, setVerificationNotes] = useState({});

  // Filter only orders waiting for payment verification
  const pendingPayments = orders.filter(o => o.status === 'Menunggu Verifikasi' || o.status === 'Menunggu Pembayaran');

  const handleVerify = (orderId, status) => {
    const notes = verificationNotes[orderId] || '';
    verifyPayment(orderId, status, notes);
    alert(`Pembayaran pesanan ${orderId} telah di-${status === 'Diproses' ? 'Terima' : 'Tolak'}`);
    setVerificationNotes(prev => {
      const newNotes = { ...prev };
      delete newNotes[orderId];
      return newNotes;
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Verifikasi Pembayaran</h2>
        <p className="mt-2 text-gray-500 font-medium">Tinjau bukti transfer dan terima atau tolak pembayaran.</p>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="px-8 py-5 font-extrabold tracking-wider">ID Pesanan & Info</th>
                <th className="px-8 py-5 font-extrabold tracking-wider">Nominal</th>
                <th className="px-8 py-5 font-extrabold tracking-wider">Bukti Transfer</th>
                <th className="px-8 py-5 font-extrabold tracking-wider">Aksi Verifikasi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {pendingPayments.map(order => (
                <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-8 py-5">
                    <div className="font-mono font-bold text-gray-900">{order.id}</div>
                    <div className="font-semibold text-gray-700 mt-1">{order.customerName}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{new Date(order.createdAt).toLocaleDateString('id-ID')}</div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="font-bold text-[#aa3bff] text-base">
                      Rp {order.totalPrice ? order.totalPrice.toLocaleString('id-ID') : '-'}
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    {order.paymentProof ? (
                      <div className="flex flex-col gap-2">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#aa3bff] bg-[#aa3bff]/10 px-3 py-1.5 rounded-lg cursor-pointer hover:bg-[#aa3bff]/20 transition-colors w-max">
                          <Eye className="w-4 h-4" /> Lihat Bukti
                        </span>
                        <span className="text-xs text-gray-500">Sudah diunggah</span>
                      </div>
                    ) : (
                      <span className="text-xs font-medium text-orange-600 bg-orange-50 px-3 py-1.5 rounded-lg">Belum diunggah</span>
                    )}
                  </td>
                  <td className="px-8 py-5">
                    {order.status === 'Menunggu Verifikasi' ? (
                      <div className="space-y-3 min-w-[250px]">
                        <input 
                          type="text" 
                          placeholder="Tambahkan catatan (opsional)..."
                          value={verificationNotes[order.id] || ''}
                          onChange={(e) => setVerificationNotes({...verificationNotes, [order.id]: e.target.value})}
                          className="w-full text-sm px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#aa3bff]/20 focus:border-[#aa3bff] bg-gray-50 focus:bg-white transition-all"
                        />
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleVerify(order.id, 'Diproses')}
                            className="flex-1 flex items-center justify-center gap-2 bg-emerald-500 text-white text-sm font-bold py-2.5 rounded-xl hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-500/20 transition-all"
                          >
                            <Check className="w-4 h-4" /> Terima
                          </button>
                          <button 
                            onClick={() => handleVerify(order.id, 'Menunggu Pembayaran')}
                            className="flex-1 flex items-center justify-center gap-2 bg-red-500 text-white text-sm font-bold py-2.5 rounded-xl hover:bg-red-600 hover:shadow-lg hover:shadow-red-500/20 transition-all"
                          >
                            <X className="w-4 h-4" /> Tolak
                          </button>
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm font-medium text-gray-400">Menunggu pembayaran customer...</span>
                    )}
                  </td>
                </tr>
              ))}
              {pendingPayments.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-8 py-12 text-center">
                     <div className="text-gray-500 font-medium">Tidak ada pembayaran yang perlu diverifikasi.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
