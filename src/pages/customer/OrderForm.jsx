import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Plus, Trash2, ShieldCheck, CheckCircle } from 'lucide-react';

export default function OrderForm() {
  const { state } = useLocation();
  const currentUser = useStore(s => s.currentUser);
  const products = useStore(s => s.products);
  const addOrder = useStore(s => s.addOrder);
  const designs = useStore(s => s.designs);
  const navigate = useNavigate();

  const [designId, setDesignId] = useState(state?.designId || '');
  const [productId, setProductId] = useState(products[0]?.id || '');
  const [fabric, setFabric] = useState('Cotton Combed 30s');
  const [printType, setPrintType] = useState('DTF (Direct to Film)');
  const [notes, setNotes] = useState('');

  // Items State
  const [items, setItems] = useState([]);
  
  // Form State for Adding an Item
  const [sizeType, setSizeType] = useState('standard');
  const [size, setSize] = useState('L');
  const [customSize, setCustomSize] = useState({ panjangBadan: '', lebarDada: '', panjangLengan: '', lebarBahu: '' });
  const [itemQuantity, setItemQuantity] = useState(1);

  const selectedProduct = products.find(p => p.id === productId);

  // Calculations
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  // Dynamic Tiered Pricing
  const getUnitPrice = (type, qty) => {
    if (qty > 100) {
      return type === 'long' ? 70000 : 60000;
    } else if (qty >= 24) { // 2 lusin
      return type === 'long' ? 75000 : 65000;
    } else { // 1 lusin (12-23)
      return type === 'long' ? 80000 : 70000;
    }
  };

  const currentUnitPrice = selectedProduct ? getUnitPrice(selectedProduct.type, Math.max(12, totalQuantity)) : 0;
  const totalPrice = currentUnitPrice * totalQuantity;

  const handleAddItem = () => {
    if (sizeType === 'custom' && (!customSize.panjangBadan || !customSize.lebarDada || !customSize.panjangLengan || !customSize.lebarBahu)) {
      alert('Harap lengkapi semua ukuran custom.');
      return;
    }
    if (itemQuantity < 1) {
      alert('Jumlah tidak boleh kurang dari 1.');
      return;
    }

    const newItem = {
      id: Date.now().toString(),
      type: sizeType,
      size: sizeType === 'standard' ? size : 'Custom',
      customSize: sizeType === 'custom' ? { ...customSize } : null,
      quantity: parseInt(itemQuantity)
    };

    setItems([...items, newItem]);
    
    // Reset temporary states
    setItemQuantity(1);
    if (sizeType === 'custom') {
       setCustomSize({ panjangBadan: '', lebarDada: '', panjangLengan: '', lebarBahu: '' });
    }
  };

  const handleRemoveItem = (itemId) => {
    setItems(items.filter(item => item.id !== itemId));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!currentUser) {
      alert('Harap login terlebih dahulu untuk memesan.');
      navigate('/login');
      return;
    }
    if (!designId) {
      alert('Silakan pilih atau buat desain terlebih dahulu.');
      return;
    }
    if (items.length === 0) {
      alert('Anda belum menambahkan satupun ukuran ke daftar pesanan.');
      return;
    }
    if (totalQuantity < 12) {
      alert('Total minimal jumlah pemesanan adalah 12 pcs.');
      return;
    }

    const orderId = `ORD-${Math.floor(Math.random() * 100000)}`;
    const newOrder = {
      id: orderId,
      customerName: currentUser.name,
      customerId: currentUser.id,
      customerPhone: currentUser.phone || '08123456789',
      designId,
      productId,
      productName: selectedProduct?.name,
      fabric,
      printType,
      items: items, // Array of size requests
      quantity: totalQuantity, // Aggregate
      notes,
      totalPrice,
      status: 'Menunggu Pembayaran',
      createdAt: new Date().toISOString(),
    };

    addOrder(newOrder);
    navigate('/status');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
        <h2 className="text-3xl font-extrabold text-gray-900 mb-2">Formulir Pemesanan Custom</h2>
        <p className="text-gray-500 mb-8">Lengkapi detail produk, spesifikasi bahan & sablon, dan masukkan variasi ukuran baju yang Anda butuhkan.</p>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Section 1: Desain & Spesifikasi Bahan */}
          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 space-y-4">
             <h3 className="text-lg font-bold text-gray-800">1. Desain & Spesifikasi Produk</h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Pilih Model Kaos</label>
                  <select value={productId} onChange={(e) => setProductId(e.target.value)} className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#aa3bff] focus:border-[#aa3bff] transition-all bg-white font-medium text-sm">
                    {products.map(p => (
                       <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">ID Desain Anda</label>
                  <div className="flex gap-2">
                    <input type="text" required value={designId} onChange={(e) => setDesignId(e.target.value)} className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#aa3bff] bg-white font-mono font-bold" placeholder="DSN-XXXX" />
                    <Link to="/design" className="px-4 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 whitespace-nowrap text-sm font-bold shadow-sm transition-colors">Buat Desain</Link>
                  </div>
                  {designId && designs.find(d => d.id === designId) && (
                    <p className="mt-2 text-xs text-green-600 font-bold bg-green-50 inline-block px-2 py-1 rounded">✓ Desain ditemukan di sistem</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Pilihan Bahan Kain</label>
                  <select value={fabric} onChange={(e) => setFabric(e.target.value)} className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#aa3bff] focus:border-[#aa3bff] transition-all bg-white font-medium text-sm">
                    <option value="Cotton Combed 30s">Cotton Combed 30s (Lembut & Adem - Standar Distro)</option>
                    <option value="Cotton Combed 24s">Cotton Combed 24s (Lebih Tebal & Kokoh)</option>
                    <option value="Cotton Bamboo">Cotton Bamboo (Anti Bakteri & Super Sejuk)</option>
                    <option value="Heavyweight Cotton 20s">Heavyweight Cotton 20s (Sangat Tebal & Premium)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Pilihan Jenis Sablon / Bordir</label>
                  <select value={printType} onChange={(e) => setPrintType(e.target.value)} className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#aa3bff] focus:border-[#aa3bff] transition-all bg-white font-medium text-sm">
                    <option value="DTF (Direct to Film)">DTF (Direct to Film - Full Color Presisi)</option>
                    <option value="Sablon Plastisol">Sablon Plastisol (Karet Premium & Tahan Lama)</option>
                    <option value="Sablon Rubber">Sablon Rubber (Elastis & Halus)</option>
                    <option value="Bordir Komputer">Bordir Komputer (Timbul & Jahitan Rapi)</option>
                  </select>
                </div>
             </div>
          </div>

          {/* Section 2: Items Array */}
          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200 space-y-6">
             <div className="flex justify-between items-center">
               <h3 className="text-lg font-bold text-gray-800">2. Rincian Ukuran & Jumlah</h3>
               <span className="text-sm font-medium bg-purple-100 text-purple-700 px-3 py-1 rounded-full border border-purple-200">
                 Min. Order: 12 pcs
               </span>
             </div>
             
             {/* Add Item Form */}
             <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
               <div className="flex gap-6 mb-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={sizeType === 'standard'} onChange={() => setSizeType('standard')} className="w-4 h-4 text-[#aa3bff] focus:ring-[#aa3bff]" />
                    <span className="text-sm font-semibold text-gray-700">Ukuran Standar</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" checked={sizeType === 'custom'} onChange={() => setSizeType('custom')} className="w-4 h-4 text-[#aa3bff] focus:ring-[#aa3bff]" />
                    <span className="text-sm font-semibold text-gray-700">Ukuran Kustom</span>
                  </label>
               </div>

               <div className="flex flex-col md:flex-row gap-4 items-end">
                 {sizeType === 'standard' ? (
                    <div className="w-full md:w-1/3">
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Ukuran Standar</label>
                      <select value={size} onChange={(e) => setSize(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-[#aa3bff]">
                        <option value="S">S</option><option value="M">M</option><option value="L">L</option><option value="XL">XL</option><option value="XXL">XXL</option>
                      </select>
                    </div>
                 ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full md:w-3/4">
                       <div>
                         <label className="block text-xs font-semibold text-gray-500 mb-1">P. Badan (cm)</label>
                         <input type="number" value={customSize.panjangBadan} onChange={e => setCustomSize({...customSize, panjangBadan: e.target.value})} className="w-full p-2.5 border rounded-lg text-sm" />
                       </div>
                       <div>
                         <label className="block text-xs font-semibold text-gray-500 mb-1">L. Dada (cm)</label>
                         <input type="number" value={customSize.lebarDada} onChange={e => setCustomSize({...customSize, lebarDada: e.target.value})} className="w-full p-2.5 border rounded-lg text-sm" />
                       </div>
                       <div>
                         <label className="block text-xs font-semibold text-gray-500 mb-1">P. Lengan (cm)</label>
                         <input type="number" value={customSize.panjangLengan} onChange={e => setCustomSize({...customSize, panjangLengan: e.target.value})} className="w-full p-2.5 border rounded-lg text-sm" />
                       </div>
                       <div>
                         <label className="block text-xs font-semibold text-gray-500 mb-1">L. Bahu (cm)</label>
                         <input type="number" value={customSize.lebarBahu} onChange={e => setCustomSize({...customSize, lebarBahu: e.target.value})} className="w-full p-2.5 border rounded-lg text-sm" />
                       </div>
                    </div>
                 )}
                 
                 <div className="w-full md:w-32">
                   <label className="block text-xs font-semibold text-gray-500 mb-1">Jumlah</label>
                   <input type="number" min="1" value={itemQuantity} onChange={(e) => setItemQuantity(parseInt(e.target.value))} className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-[#aa3bff]" />
                 </div>
                 
                 <button type="button" onClick={handleAddItem} className="w-full md:w-auto px-4 py-2.5 bg-[#111] hover:bg-gray-800 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-colors">
                   <Plus className="w-4 h-4" /> Tambah
                 </button>
               </div>
             </div>

             {/* Items List */}
             {items.length > 0 && (
               <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                 <table className="w-full text-sm text-left">
                   <thead className="bg-gray-50 border-b text-xs uppercase text-gray-500">
                     <tr>
                       <th className="px-4 py-3">Tipe</th>
                       <th className="px-4 py-3">Detail Ukuran</th>
                       <th className="px-4 py-3 text-center">Jumlah</th>
                       <th className="px-4 py-3 text-center">Aksi</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-gray-100">
                     {items.map((item) => (
                       <tr key={item.id} className="hover:bg-gray-50">
                         <td className="px-4 py-3 font-medium text-gray-900">
                           {item.type === 'standard' ? <span className="text-blue-600 bg-blue-50 px-2 py-1 rounded">Standar</span> : <span className="text-purple-600 bg-purple-50 px-2 py-1 rounded">Custom</span>}
                         </td>
                         <td className="px-4 py-3">
                           {item.type === 'standard' ? (
                             <span className="font-bold text-lg">{item.size}</span>
                           ) : (
                             <span className="text-xs text-gray-600">PB: {item.customSize.panjangBadan} | LD: {item.customSize.lebarDada} | PL: {item.customSize.panjangLengan} | LB: {item.customSize.lebarBahu}</span>
                           )}
                         </td>
                         <td className="px-4 py-3 text-center font-bold text-gray-900">{item.quantity} pcs</td>
                         <td className="px-4 py-3 text-center">
                           <button type="button" onClick={() => handleRemoveItem(item.id)} className="text-red-500 hover:text-red-700 p-1 rounded-lg hover:bg-red-50 transition-colors">
                             <Trash2 className="w-5 h-5 mx-auto" />
                           </button>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
                 <div className="bg-gray-50 px-4 py-3 border-t text-right flex justify-between items-center">
                    <span className="text-gray-500 font-medium text-sm">Total Kaos Terkumpul:</span>
                    <span className={`text-xl font-extrabold ${totalQuantity >= 12 ? 'text-green-600' : 'text-red-500'}`}>{totalQuantity} pcs</span>
                 </div>
               </div>
             )}
          </div>

          <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
            <h3 className="text-lg font-bold text-gray-800 mb-4">3. Catatan & Ringkasan Akhir</h3>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Tuliskan catatan tambahan jika ada permintaan khusus untuk produksi..." className="w-full p-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#aa3bff] mb-6 resize-none shadow-sm" rows="3"></textarea>
            
            <div className="bg-gradient-brand p-6 rounded-2xl shadow-lg flex justify-between items-center text-white">
               <div>
                 <span className="text-white/80 font-medium block text-sm">Estimasi Total Harga Pembayaran</span>
                 <span className="text-sm font-semibold">({totalQuantity} pcs x Rp {currentUnitPrice.toLocaleString('id-ID')})</span>
               </div>
               <span className="text-3xl font-extrabold">Rp {totalPrice.toLocaleString('id-ID')}</span>
            </div>
          </div>

          <div className="pt-4">
            <button 
              type="submit" 
              disabled={totalQuantity < 12} 
              className={`w-full flex items-center justify-center gap-2 py-4 px-4 border border-transparent rounded-xl shadow-xl text-lg font-extrabold text-white transition-all ${
                totalQuantity >= 12 
                  ? 'bg-gradient-brand hover-lift cursor-pointer shadow-[#aa3bff]/25' 
                  : 'bg-gray-400 cursor-not-allowed opacity-70'
              }`}
            >
              <CheckCircle className="w-5 h-5" /> Konfirmasi & Buat Pesanan
            </button>
            {totalQuantity < 12 && (
              <p className="text-center text-red-500 font-medium mt-3 text-sm">Anda harus memesan minimal 12 pcs. (Kurang {12 - totalQuantity} pcs lagi)</p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
