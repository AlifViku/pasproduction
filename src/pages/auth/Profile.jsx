import { useState } from 'react';
import { useStore } from '../../store/useStore';

export default function Profile() {
  const currentUser = useStore(state => state.currentUser);
  const updateProfile = useStore(state => state.updateProfile);
  
  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    phone: currentUser?.phone || '',
    address: currentUser?.address || '',
    password: currentUser?.password || ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    updateProfile(formData);
    alert('Profil berhasil diperbarui!');
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  if (!currentUser) return <div className="p-8">Harap login terlebih dahulu.</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="bg-white rounded-2xl shadow-sm border p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Kelola Profil</h2>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nama Lengkap</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#aa3bff] focus:border-[#aa3bff] sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email (Tidak bisa diubah)</label>
              <input type="email" value={currentUser.email} disabled className="mt-1 block w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-md sm:text-sm text-gray-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">No. HP</label>
              <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#aa3bff] focus:border-[#aa3bff] sm:text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password Baru</label>
              <input type="password" name="password" value={formData.password} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#aa3bff] focus:border-[#aa3bff] sm:text-sm" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700">Alamat Pengiriman</label>
              <textarea name="address" value={formData.address} onChange={handleChange} rows={3} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-[#aa3bff] focus:border-[#aa3bff] sm:text-sm" />
            </div>
          </div>
          <div className="flex justify-end">
            <button type="submit" className="py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#aa3bff] hover:bg-[#9228e6]">
              Simpan Perubahan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
