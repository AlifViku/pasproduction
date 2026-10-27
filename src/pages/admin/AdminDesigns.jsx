import { useStore } from '../../store/useStore';

export default function AdminDesigns() {
  const designs = useStore(state => state.designs);

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
      <div className="p-6 border-b">
        <h2 className="text-xl font-bold text-gray-800">Galeri Desain Customer</h2>
      </div>
      
      <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {designs.map(design => (
          <div key={design.id} className="border rounded-lg overflow-hidden flex flex-col">
            <div className="h-40 flex items-center justify-center p-4" style={{ backgroundColor: design.color }}>
              <span className="font-bold text-xl drop-shadow-md" style={{ color: design.color === '#ffffff' ? '#000000' : '#ffffff' }}>
                {design.text}
              </span>
            </div>
            <div className="p-4 bg-gray-50 flex-1 flex flex-col justify-between">
              <div>
                <p className="text-sm font-bold text-gray-900">{design.id}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-gray-500">Warna Dasar:</span>
                  <div className="w-4 h-4 rounded-full border shadow-sm" style={{ backgroundColor: design.color }}></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">Teks: {design.text}</p>
              </div>
            </div>
          </div>
        ))}

        {designs.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-500">
            Belum ada desain tersimpan.
          </div>
        )}
      </div>
    </div>
  );
}
