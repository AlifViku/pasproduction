import { useStore } from '../../store/useStore';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

export default function AdminOrderStatus() {
  const orders = useStore(state => state.orders);
  const updateOrderStatus = useStore(state => state.updateOrderStatus);

  // Focus only on active production statuses
  const activeOrders = orders.filter(o => 
    !['Menunggu Pembayaran', 'Menunggu Verifikasi', 'Selesai', 'Dibatalkan'].includes(o.status)
  );

  const productionFlow = [
    'Pembayaran Diterima',
    'Diproses',
    'Desain Direview',
    'Sedang Diproduksi',
    'Quality Control',
    'Siap Dikirim',
    'Selesai'
  ];

  const handleAdvanceStatus = (orderId, currentStatus) => {
    const currentIndex = productionFlow.indexOf(currentStatus);
    if (currentIndex >= 0 && currentIndex < productionFlow.length - 1) {
      const nextStatus = productionFlow[currentIndex + 1];
      updateOrderStatus(orderId, nextStatus);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Update Status Pesanan</h2>
        <p className="mt-2 text-gray-500 font-medium">Lacak dan perbarui status produksi pesanan yang sedang berjalan.</p>
      </div>

      <div className="grid gap-4">
        {activeOrders.map(order => {
          const currentIndex = productionFlow.indexOf(order.status);
          const nextStatus = currentIndex >= 0 && currentIndex < productionFlow.length - 1 ? productionFlow[currentIndex + 1] : null;
          const progressPercentage = Math.max(10, (currentIndex / (productionFlow.length - 1)) * 100);

          return (
            <div key={order.id} className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-6 hover-lift transition-all">
              
              {/* Order Info */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="font-mono font-bold text-lg text-gray-900">{order.id}</span>
                  <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-bold rounded-lg border border-blue-100">
                    {order.status}
                  </span>
                </div>
                <div className="text-sm text-gray-600 mb-4 font-medium">
                  {order.customerName} • {order.productName || 'Standar'} • {order.quantity} pcs
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-gray-100 rounded-full h-2.5 mb-1 overflow-hidden">
                  <div 
                    className="bg-gradient-brand h-2.5 rounded-full transition-all duration-500" 
                    style={{ width: `${progressPercentage}%` }}
                  ></div>
                </div>
                <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-2">
                  <span>Mulai</span>
                  <span>Produksi</span>
                  <span>Selesai</span>
                </div>
              </div>

              {/* Action Button */}
              <div className="md:w-64 flex flex-col justify-center border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6">
                {nextStatus ? (
                  <>
                    <p className="text-xs text-gray-500 mb-2 font-medium text-center md:text-left">Langkah Selanjutnya:</p>
                    <button 
                      onClick={() => handleAdvanceStatus(order.id, order.status)}
                      className="w-full flex items-center justify-center gap-2 bg-[#aa3bff] hover:bg-[#9228e6] text-white text-sm font-bold py-3 px-4 rounded-xl shadow-lg shadow-[#aa3bff]/25 transition-all hover:-translate-y-0.5"
                    >
                      {nextStatus} <ArrowRight className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center text-emerald-500 gap-2">
                    <CheckCircle2 className="w-8 h-8" />
                    <span className="font-bold text-sm">Selesai</span>
                  </div>
                )}
              </div>

            </div>
          );
        })}
        
        {activeOrders.length === 0 && (
          <div className="bg-white p-12 rounded-3xl shadow-sm border border-gray-100 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-50 mb-4">
              <CheckCircle2 className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-1">Semua Pesanan Selesai</h3>
            <p className="text-gray-500 font-medium">Tidak ada pesanan aktif yang sedang diproduksi saat ini.</p>
          </div>
        )}
      </div>
    </div>
  );
}
