import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { Upload, CheckCircle, Clock, Package, Shirt, Eye, Truck, MessageSquare, ExternalLink, CreditCard, ShieldCheck } from 'lucide-react';

export default function OrderStatus() {
  const navigate = useNavigate();
  const currentUser = useStore(state => state.currentUser);
  const orders = useStore(state => state.orders).filter(o => o.customerId === currentUser?.id);
  const updatePaymentProof = useStore(state => state.updatePaymentProof);
  const clearMyOrders = useStore(state => state.clearMyOrders);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const handleUpload = (e, orderId) => {
    e.preventDefault();
    // Simulate upload
    setTimeout(() => {
      updatePaymentProof(orderId, 'uploaded_proof.jpg');
      setSelectedOrder(null);
      alert('Bukti pembayaran berhasil diunggah. Menunggu verifikasi admin.');
    }, 500);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Menunggu Pembayaran': return <Clock className="text-yellow-500" />;
      case 'Menunggu Verifikasi': return <Clock className="text-blue-500" />;
      case 'Pembayaran Diterima': return <CheckCircle className="text-emerald-500" />;
      case 'Desain Direview': return <Eye className="text-indigo-500" />;
      case 'Pemotongan Kain': return <Package className="text-orange-500" />;
      case 'Sablon / Bordir': return <Package className="text-pink-500" />;
      case 'Penjahitan': return <Package className="text-purple-500" />;
      case 'Quality Control': return <CheckCircle className="text-blue-500" />;
      case 'Siap Dikirim': return <Truck className="text-emerald-500" />;
      case 'Selesai': return <CheckCircle className="text-green-500" />;
      default: return <Clock className="text-gray-500" />;
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Status Pesanan Saya</h2>
        {orders.length > 0 && (
          <button 
            onClick={() => {
              if(window.confirm('Apakah Anda yakin ingin menghapus semua riwayat pesanan Anda? (Aksi ini tidak dapat dibatalkan)')) {
                clearMyOrders(currentUser?.id);
              }
            }} 
            className="text-red-500 hover:text-red-700 font-semibold text-sm border border-red-200 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors"
          >
            Bersihkan Riwayat Pesanan
          </button>
        )}
      </div>
      
      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center text-gray-500 border">
          Belum ada pesanan.
        </div>
      ) : (
        <div className="grid gap-6">
          {orders.map((order) => {
            const design = useStore.getState().designs.find(d => d.id === order.designId);
            
            return (
            <div key={order.id} className="bg-white rounded-2xl shadow-sm border p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              
              <div className="flex gap-4">
                {/* Design Preview Thumbnail */}
                <div className="flex flex-col items-center gap-2 shrink-0">
                  <div 
                    className="w-16 h-16 rounded-xl border flex items-center justify-center relative overflow-hidden shadow-inner"
                    style={{ backgroundColor: design?.color || '#f3f4f6' }}
                  >
                    <Shirt className="w-10 h-10 text-white/30 absolute" />
                    {design?.logoImage && (
                       <img src={design.logoImage} alt="Logo" className="w-8 h-8 object-contain relative z-10" />
                    )}
                  </div>
                  <button 
                    onClick={() => navigate(`/preview/${order.id}`)}
                    className="mt-1 text-xs text-[#aa3bff] font-bold hover:underline flex items-center justify-center gap-1 w-full border border-[#aa3bff]/30 bg-[#aa3bff]/10 py-1 rounded"
                  >
                     <Eye className="w-3 h-3" /> Lihat 3D
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-mono text-sm font-semibold bg-gray-100 px-2 py-1 rounded text-gray-700">{order.designId}</span>
                    <span className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString('id-ID')}</span>
                    {design?.isEditedByAdmin && (
                      <span className="text-[10px] font-bold bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full border border-yellow-200">
                        Direvisi Admin
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">{order.productName || 'Kaos Kustom'}</h3>
                  
                  {/* Spesifikasi Bahan & Sablon (Poin 9) */}
                  <div className="flex flex-wrap gap-2 text-xs font-semibold">
                    <span className="bg-purple-50 text-purple-700 px-2.5 py-1 rounded-lg border border-purple-100">
                      Bahan: {order.fabric || 'Cotton Combed 30s'}
                    </span>
                    <span className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg border border-indigo-100">
                      Sablon: {order.printType || 'DTF'}
                    </span>
                  </div>

                  {/* Rincian Ukuran & Harga */}
                  <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-xl border space-y-1.5">
                    <div className="flex justify-between items-center border-b pb-1.5 mb-1">
                      <p className="font-semibold text-gray-700">Total: {order.quantity} pcs</p>
                      <p className="font-extrabold text-[#aa3bff] text-base">Rp {order.totalPrice?.toLocaleString('id-ID')}</p>
                    </div>
                    {order.items?.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-xs">
                         <span>
                           {item.type === 'standard' ? `Standar (${item.size})` : `Custom (PB:${item.customSize.panjangBadan}, LD:${item.customSize.lebarDada}, PL:${item.customSize.panjangLengan}, LB:${item.customSize.lebarBahu})`}
                         </span>
                         <span className="font-bold">{item.quantity}x</span>
                      </div>
                    ))}
                    {!order.items && (
                      <p>Ukuran: {order.size} ({order.quantity} pcs)</p>
                    )}
                  </div>



                </div>
              </div>

              <div className="flex flex-col items-end gap-3">
                <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-xl border">
                  {getStatusIcon(order.status)}
                  <span className="font-semibold text-gray-800 text-sm">{order.status}</span>
                </div>

                {order.status === 'Menunggu Pembayaran' && (
                  <button 
                    onClick={() => setSelectedOrder(selectedOrder === order.id ? null : order.id)}
                    className="flex items-center gap-2 bg-[#aa3bff] text-white px-4 py-2 rounded-xl hover:bg-[#9228e6] transition-colors font-bold text-xs shadow-md shadow-purple-500/20"
                  >
                    <Upload className="w-4 h-4" /> Bayar Sekarang
                  </button>
                )}
              </div>
            </div>
          )})}
        </div>
      )}

      {/* Payment Modal/Section */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-xl">
            <h3 className="text-xl font-bold mb-4">Upload Bukti Pembayaran</h3>
            <p className="text-sm text-gray-600 mb-6">Silakan transfer sesuai total tagihan untuk pesanan <span className="font-mono font-bold">{selectedOrder}</span> dan unggah bukti transfer di sini.</p>
            
            <form onSubmit={(e) => handleUpload(e, selectedOrder)}>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-[#aa3bff] transition-colors cursor-pointer mb-6">
                <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-500">Klik untuk memilih file gambar</span>
              </div>
              
              <div className="flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setSelectedOrder(null)}
                  className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg font-medium"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 bg-[#aa3bff] text-white rounded-lg hover:bg-[#9228e6] font-medium"
                >
                  Kirim Bukti
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
