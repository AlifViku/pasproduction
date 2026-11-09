import { useStore } from '../../store/useStore';
import { MessageSquare } from 'lucide-react';
import { formatWhatsappNumber } from '../../services/fonnteService';

export default function AdminCustomers() {
  const users = useStore(state => state.users.filter(u => u.role === 'customer'));
  const updateUserStatus = useStore(state => state.updateUserStatus);

  const handleStatusToggle = (id, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    if(window.confirm(`Yakin ingin mengubah status akun ini menjadi ${newStatus}?`)) {
      updateUserStatus(id, newStatus);
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 sm:p-8 border-b border-gray-100">
        <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Manajemen Customer</h2>
        <p className="text-sm text-gray-500 mt-1">Daftar pengguna terdaftar dan akses cepat komunikasi WhatsApp.</p>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 font-bold">ID Customer</th>
              <th className="px-6 py-4 font-bold">Informasi Customer</th>
              <th className="px-6 py-4 font-bold">Alamat</th>
              <th className="px-6 py-4 font-bold">Status & Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-6 py-4 font-mono font-bold text-gray-900">{user.id}</td>
                <td className="px-6 py-4">
                  <div className="font-bold text-gray-900">{user.name}</div>
                  <div className="text-xs text-gray-500">{user.email}</div>
                  <div className="text-xs font-mono font-semibold text-emerald-600 mt-0.5">{user.phone}</div>
                </td>
                <td className="px-6 py-4 text-gray-600 max-w-xs truncate" title={user.address}>
                  {user.address || '-'}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${user.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                      {user.status === 'active' ? 'Aktif' : 'Nonaktif'}
                    </span>
                    
                    {user.phone && (
                      <a
                        href={`https://wa.me/${formatWhatsappNumber(user.phone)}?text=${encodeURIComponent(`Halo Kak ${user.name}, salam dari tim PAS Production!`)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-xl transition-colors shadow-sm"
                        title="Chat via WhatsApp"
                      >
                        <MessageSquare className="w-3.5 h-3.5" /> Chat WA
                      </a>
                    )}

                    <button
                      onClick={() => handleStatusToggle(user.id, user.status)}
                      className="text-xs font-semibold text-gray-500 hover:text-gray-900 hover:underline px-2 py-1"
                    >
                      Ubah Status
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan="4" className="px-6 py-12 text-center text-gray-400 font-medium">Belum ada data customer.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
