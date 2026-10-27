import { useStore } from '../../store/useStore';
import { Package, Clock, CheckCircle, CreditCard, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const orders = useStore(state => state.orders);

  const stats = [
    { name: 'Total Pesanan', value: orders.length, icon: Package, color: 'text-[#aa3bff]', bg: 'bg-[#aa3bff]/10' },
    { name: 'Menunggu Verifikasi', value: orders.filter(o => o.status === 'Menunggu Verifikasi').length, icon: CreditCard, color: 'text-orange-500', bg: 'bg-orange-50' },
    { name: 'Sedang Diproses', value: orders.filter(o => o.status === 'Diproses').length, icon: Clock, color: 'text-blue-500', bg: 'bg-blue-50' },
    { name: 'Selesai', value: orders.filter(o => o.status === 'Selesai').length, icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Ringkasan Aktivitas</h2>
        <p className="mt-2 text-gray-500 font-medium">Pantau performa bisnis dan pesanan terbaru hari ini.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 flex items-center gap-5 hover-lift transition-all">
            <div className={`p-4 rounded-2xl ${stat.bg}`}>
              <stat.icon className={`h-8 w-8 ${stat.color}`} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-500 mb-1">{stat.name}</p>
              <p className="text-4xl font-black text-gray-900 tracking-tight">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
          <h3 className="text-xl font-extrabold text-gray-900">Pesanan Terbaru</h3>
          <Link to="/admin/orders" className="text-sm font-bold text-[#aa3bff] flex items-center gap-1 hover:text-[#9228e6] transition-colors">
            Lihat Semua <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-white border-b border-gray-100">
              <tr>
                <th className="px-8 py-4 font-extrabold tracking-wider">ID Pesanan</th>
                <th className="px-8 py-4 font-extrabold tracking-wider">Customer</th>
                <th className="px-8 py-4 font-extrabold tracking-wider">Tanggal</th>
                <th className="px-8 py-4 font-extrabold tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders.slice().reverse().slice(0, 5).map(order => (
                <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-8 py-5 font-mono font-bold text-gray-900">{order.id}</td>
                  <td className="px-8 py-5 font-semibold text-gray-700">{order.customerName}</td>
                  <td className="px-8 py-5 font-medium text-gray-500">{new Date(order.createdAt).toLocaleDateString('id-ID')}</td>
                  <td className="px-8 py-5">
                    <span className={`px-3 py-1.5 rounded-lg text-xs font-bold ${
                      order.status === 'Selesai' ? 'bg-emerald-100 text-emerald-700' :
                      order.status === 'Menunggu Verifikasi' ? 'bg-orange-100 text-orange-700' :
                      order.status === 'Diproses' ? 'bg-blue-100 text-blue-700' :
                      order.status === 'Dibatalkan' ? 'bg-red-100 text-red-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-8 py-12 text-center text-gray-500 font-medium">
                    Belum ada pesanan masuk.
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
