import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { Edit2, Save, X } from 'lucide-react';

export default function AdminProducts() {
  const products = useStore(state => state.products);
  const updateProductPrice = useStore(state => state.updateProductPrice);
  
  const [editingId, setEditingId] = useState(null);
  const [editPrice, setEditPrice] = useState('');

  const startEdit = (product) => {
    setEditingId(product.id);
    setEditPrice(product.basePrice);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditPrice('');
  };

  const saveEdit = (id) => {
    const price = parseInt(editPrice, 10);
    if (!isNaN(price)) {
      updateProductPrice(id, price);
      setEditingId(null);
    } else {
      alert("Harga tidak valid");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">Kelola Produk</h2>
        <p className="mt-2 text-gray-500 font-medium">Atur daftar produk dan harga dasar (base price).</p>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-500 uppercase bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="px-8 py-5 font-extrabold tracking-wider">ID Produk</th>
                <th className="px-8 py-5 font-extrabold tracking-wider">Nama Produk</th>
                <th className="px-8 py-5 font-extrabold tracking-wider">Tipe</th>
                <th className="px-8 py-5 font-extrabold tracking-wider">Harga Dasar (Rp)</th>
                <th className="px-8 py-5 font-extrabold tracking-wider text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {products.map(product => (
                <tr key={product.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-8 py-5 font-mono font-bold text-gray-900">{product.id}</td>
                  <td className="px-8 py-5 font-semibold text-gray-700">{product.name}</td>
                  <td className="px-8 py-5 font-medium text-gray-500 uppercase text-xs">{product.type}</td>
                  <td className="px-8 py-5">
                    {editingId === product.id ? (
                      <input
                        type="number"
                        value={editPrice}
                        onChange={(e) => setEditPrice(e.target.value)}
                        className="w-32 px-3 py-2 border border-[#aa3bff] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#aa3bff]/20 text-gray-900 font-bold"
                        autoFocus
                      />
                    ) : (
                      <span className="font-bold text-gray-900">
                        {product.basePrice.toLocaleString('id-ID')}
                      </span>
                    )}
                  </td>
                  <td className="px-8 py-5 text-right">
                    {editingId === product.id ? (
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => saveEdit(product.id)} className="p-2 text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors">
                          <Save className="h-4 w-4" />
                        </button>
                        <button onClick={cancelEdit} className="p-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => startEdit(product)} className="p-2 text-[#aa3bff] bg-[#aa3bff]/10 rounded-lg hover:bg-[#aa3bff]/20 transition-colors opacity-0 group-hover:opacity-100">
                        <Edit2 className="h-4 w-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-8 py-12 text-center text-gray-500 font-medium">Belum ada data produk.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
