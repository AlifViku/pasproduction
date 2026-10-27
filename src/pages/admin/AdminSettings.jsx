import { useState } from 'react';
import { useStore } from '../../store/useStore';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function AdminSettings() {
  const products = useStore(state => state.products);
  const updateProductPrice = useStore(state => state.updateProductPrice);
  const orders = useStore(state => state.orders);

  const handlePriceChange = (id, price) => {
    updateProductPrice(id, parseInt(price));
    alert('Harga berhasil diubah!');
  };

  const handleGenerateReport = () => {
    const doc = new jsPDF();
    doc.text('Laporan Pemesanan PAS Production', 14, 15);
        const tableBody = orders.map(o => {
        let sizeInfo = '';
        if (o.items) {
          sizeInfo = o.items.map(item => {
            if (item.type === 'standard') return `${item.quantity}x ${item.size}`;
            return `${item.quantity}x Cust(PB:${item.customSize.panjangBadan})`;
          }).join(', ');
        } else {
          sizeInfo = o.sizeType === 'custom' ? `Custom` : o.size;
        }

        return [
          o.id,
          new Date(o.createdAt).toLocaleDateString('id-ID'),
          o.customerName,
          o.productName || 'Standar',
          sizeInfo,
          `${o.quantity} pcs`,
          `Rp ${o.totalPrice.toLocaleString('id-ID')}`,
          o.status
        ];
      });

    doc.autoTable({
      startY: 25,
      head: [['ID', 'Tanggal', 'Customer', 'Produk', 'Ukuran', 'Jumlah', 'Total', 'Status']],
      body: tableBody,
    });

    doc.save('Laporan_PAS_Production.pdf');
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-6">Pengaturan Harga Produk</h2>
        <div className="space-y-4 max-w-xl">
          {products.map(product => (
            <div key={product.id} className="flex items-center gap-4 border p-4 rounded-lg">
              <div className="flex-1">
                <div className="font-medium text-gray-900">{product.name}</div>
                <div className="text-sm text-gray-500">ID: {product.id}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-500">Rp</span>
                <input
                  type="number"
                  defaultValue={product.basePrice}
                  onBlur={(e) => handlePriceChange(product.id, e.target.value)}
                  className="border rounded px-3 py-1 w-32 focus:ring-[#aa3bff] focus:border-[#aa3bff]"
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Laporan Pemesanan</h2>
        <p className="text-gray-600 mb-6">Unduh data seluruh pemesanan dalam format PDF.</p>
        <button
          onClick={handleGenerateReport}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          Generate Laporan PDF
        </button>
      </div>
    </div>
  );
}
