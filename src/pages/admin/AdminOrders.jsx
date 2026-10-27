import { useStore } from '../../store/useStore';
import { Eye, Box } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminOrders() {
  const orders = useStore(state => state.orders);
  const updateOrderStatus = useStore(state => state.updateOrderStatus);
  const navigate = useNavigate();

  const statusOptions = [
    'Menunggu Pembayaran',
    'Menunggu Verifikasi',
    'Pembayaran Diterima',
    'Desain Direview',
    'Pemotongan Kain',
    'Sablon / Bordir',
    'Penjahitan',
    'Quality Control',
    'Siap Dikirim',
    'Selesai',
    'Dibatalkan'
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Kelola Pesanan</h2>
        <p className="mt-2 text-gray-500 font-medium">Daftar riwayat seluruh pesanan dari customer.</p>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="px-8 py-5 font-extrabold tracking-wider">ID Pesanan</th>
                <th className="px-8 py-5 font-extrabold tracking-wider">Customer</th>
                <th className="px-8 py-5 font-extrabold tracking-wider">Detail</th>
                <th className="px-8 py-5 font-extrabold tracking-wider text-center">Status</th>
                <th className="px-8 py-5 font-extrabold tracking-wider text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders.slice().reverse().map(order => (
                <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-8 py-6 align-top">
                    <div className="font-mono font-bold text-gray-900">{order.id}</div>
                    <div className="text-xs font-semibold text-gray-500 mt-1">
                      {new Date(order.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                  </td>
                  <td className="px-8 py-6 align-top">
                    <div className="font-bold text-gray-900">{order.customerName}</div>
                    {order.totalPrice && <div className="text-sm font-black text-[#aa3bff] mt-1">Rp {order.totalPrice.toLocaleString('id-ID')}</div>}
                  </td>
                  <td className="px-8 py-6 align-top text-gray-600">
                    <div className="font-medium">
                      Model: <span className="text-gray-900">{order.productName || 'Standar'}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5 mb-3">
                      ID Desain: <span className="font-mono">{order.designId}</span>
                    </div>
                    
                    {/* Spesifikasi Bahan & Sablon */}
                    <div className="flex flex-wrap gap-1.5 mb-2.5">
                      <span className="text-[11px] font-bold bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md border border-purple-100">
                        Bahan: {order.fabric || 'Cotton Combed 30s'}
                      </span>
                      <span className="text-[11px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md border border-indigo-100">
                        Sablon: {order.printType || 'DTF'}
                      </span>
                    </div>



                    {order.items ? (
                      <div className="space-y-1.5 bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <div className="font-bold text-xs text-gray-900 border-b border-gray-200 pb-1 mb-2">Detail Ukuran ({order.quantity} pcs):</div>
                        {order.items.map((item, idx) => (
                          <div key={idx} className="text-xs flex justify-between items-center gap-4">
                             <span className="font-medium text-gray-600 truncate">
                               {item.type === 'standard' 
                                 ? `Standar (${item.size})` 
                                 : `Custom (PB:${item.customSize.panjangBadan}, LD:${item.customSize.lebarDada}, PL:${item.customSize.panjangLengan}, LB:${item.customSize.lebarBahu})`}
                             </span>
                             <span className="font-bold text-gray-900 bg-white px-2 py-0.5 rounded shadow-sm border border-gray-100">{item.quantity}x</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="mt-1 bg-gray-50 p-2 rounded-xl text-xs font-medium border border-gray-100">
                        {order.sizeType === 'custom' ? (
                           <span>Custom: PB {order.customSize.panjangBadan}, LD {order.customSize.lebarDada}, PL {order.customSize.panjangLengan}, LB {order.customSize.lebarBahu}</span>
                        ) : (
                          <span>Ukuran: {order.size}</span>
                        )}
                        <span className="ml-2 px-2 py-0.5 bg-white rounded shadow-sm border border-gray-100">{order.quantity} pcs</span>
                      </div>
                    )}

                    {order.notes && <div className="italic text-xs mt-3 text-orange-600 bg-orange-50 p-2 rounded-lg border border-orange-100">📝 Catatan: {order.notes}</div>}
                  </td>
                  <td className="px-8 py-6 align-top text-center">
                    <select
                      value={order.status}
                      onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                      className={`inline-flex px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm outline-none cursor-pointer appearance-none text-center ${
                        order.status === 'Selesai' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                        order.status === 'Menunggu Verifikasi' ? 'bg-orange-100 text-orange-700 border border-orange-200' :
                        order.status === 'Dibatalkan' ? 'bg-red-100 text-red-700 border border-red-200' :
                        order.status === 'Menunggu Pembayaran' ? 'bg-gray-100 text-gray-700 border border-gray-200' :
                        'bg-blue-100 text-blue-700 border border-blue-200' // active production states
                      }`}
                    >
                      {statusOptions.map(opt => (
                        <option key={opt} value={opt} className="bg-white text-gray-900">{opt}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-8 py-6 align-top text-center space-y-2">
                    <button 
                      onClick={() => navigate(`/admin/orders/preview/${order.id}`)}
                      className="w-full justify-center inline-flex items-center gap-1.5 text-xs font-bold text-white bg-gray-900 px-3 py-2 rounded-lg cursor-pointer hover:bg-gray-800 transition-colors"
                    >
                      <Box className="w-3.5 h-3.5" /> Lihat Desain 3D
                    </button>
                    
                    {order.paymentProof && (
                      <button className="w-full justify-center inline-flex items-center gap-1.5 text-xs font-bold text-[#aa3bff] bg-[#aa3bff]/10 px-3 py-2 rounded-lg cursor-pointer hover:bg-[#aa3bff]/20 transition-colors">
                        <Eye className="w-3.5 h-3.5" /> Bukti Transfer
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-8 py-16 text-center">
                    <div className="text-gray-500 font-medium">Belum ada pesanan yang masuk.</div>
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
