import { useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { Link, useNavigate } from 'react-router-dom';
import { Shirt, ShoppingBag, Clock, ArrowRight, Palette } from 'lucide-react';

export default function CustomerDashboard() {
  const currentUser = useStore(state => state.currentUser);
  const allOrders = useStore(state => state.orders);
  
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  if (!currentUser) return null;

  const orders = allOrders.filter(o => o.customerId === currentUser?.id);
  const activeOrders = orders.filter(o => !['Selesai', 'Ditolak'].includes(o.status));
  const recentOrders = [...orders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 3);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900">Halo, {currentUser.name.split(' ')[0]}! 👋</h1>
        <p className="text-gray-500 mt-2">Selamat datang di dasbor Anda. Mari wujudkan desain baju kustom impian Anda hari ini.</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="bg-gradient-brand text-white rounded-2xl p-6 shadow-lg shadow-[#aa3bff]/20 flex flex-col justify-between hover-lift">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-bold">Mulai Desain Baru</h3>
            <div className="bg-white/20 p-2 rounded-xl"><Palette className="w-6 h-6 text-white" /></div>
          </div>
          <p className="text-white/80 text-sm mb-6">Gunakan editor 3D interaktif kami untuk mendesain secara instan.</p>
          <Link to="/design" className="inline-flex items-center gap-2 bg-white text-[#aa3bff] font-bold py-2 px-4 rounded-xl w-max hover:bg-gray-50 transition-colors">
            Buka Editor <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border flex flex-col justify-between hover-lift">
          <div className="flex justify-between items-start mb-4">
             <div>
               <p className="text-sm text-gray-500 font-medium">Pesanan Aktif</p>
               <h3 className="text-3xl font-extrabold text-gray-900 mt-1">{activeOrders.length}</h3>
             </div>
             <div className="bg-blue-50 p-2 rounded-xl"><Clock className="w-6 h-6 text-blue-500" /></div>
          </div>
          <Link to="/status" className="text-sm text-blue-600 font-bold hover:underline flex items-center gap-1">
            Lihat Status <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border flex flex-col justify-between hover-lift">
          <div className="flex justify-between items-start mb-4">
             <div>
               <p className="text-sm text-gray-500 font-medium">Total Pesanan</p>
               <h3 className="text-3xl font-extrabold text-gray-900 mt-1">{orders.length}</h3>
             </div>
             <div className="bg-green-50 p-2 rounded-xl"><ShoppingBag className="w-6 h-6 text-green-500" /></div>
          </div>
          <Link to="/status" className="text-sm text-green-600 font-bold hover:underline flex items-center gap-1">
            Riwayat Pembelian <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Recent Orders List */}
      <div className="bg-white rounded-2xl shadow-sm border p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Aktivitas Terakhir</h2>
          <Link to="/status" className="text-[#aa3bff] text-sm font-semibold hover:underline">Lihat Semua</Link>
        </div>
        
        {recentOrders.length > 0 ? (
          <div className="space-y-4">
            {recentOrders.map(order => (
              <div key={order.id} className="flex items-center justify-between p-4 rounded-xl border hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="bg-gray-100 p-3 rounded-lg"><Shirt className="w-6 h-6 text-gray-500" /></div>
                  <div>
                    <h4 className="font-bold text-gray-900">{order.productName || 'Kaos Kustom'} <span className="text-xs font-normal text-gray-500">({order.quantity} pcs)</span></h4>
                    <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString('id-ID')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                    order.status === 'Selesai' ? 'bg-green-100 text-green-700' :
                    order.status === 'Menunggu Pembayaran' ? 'bg-red-100 text-red-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-gray-50 rounded-xl border border-dashed">
            <ShoppingBag className="w-10 h-10 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">Anda belum memiliki pesanan.</p>
            <Link to="/design" className="mt-4 inline-block text-[#aa3bff] font-semibold hover:underline">Mulai pesanan pertama Anda</Link>
          </div>
        )}
      </div>
    </div>
  );
}
