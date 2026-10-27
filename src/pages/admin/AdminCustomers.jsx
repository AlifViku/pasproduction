import { useStore } from '../../store/useStore';

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
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      <div className="p-6 border-b">
        <h2 className="text-xl font-bold text-gray-800">Manajemen Customer</h2>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th className="px-6 py-4">ID Customer</th>
              <th className="px-6 py-4">Informasi Customer</th>
              <th className="px-6 py-4">Alamat</th>
              <th className="px-6 py-4">Status & Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 font-mono font-medium">{user.id}</td>
                <td className="px-6 py-4">
                  <div className="font-medium text-gray-900">{user.name}</div>
                  <div className="text-xs text-gray-500">{user.email}</div>
                  <div className="text-xs text-gray-500">{user.phone}</div>
                </td>
                <td className="px-6 py-4 text-gray-600 max-w-xs truncate" title={user.address}>
                  {user.address || '-'}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-4">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {user.status === 'active' ? 'Aktif' : 'Nonaktif'}
                    </span>
                    <button
                      onClick={() => handleStatusToggle(user.id, user.status)}
                      className="text-sm text-[#aa3bff] hover:underline"
                    >
                      Ubah Status
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan="4" className="px-6 py-8 text-center text-gray-500">Belum ada data customer.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
