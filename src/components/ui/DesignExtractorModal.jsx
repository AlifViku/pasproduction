import { useState, useRef, useEffect } from 'react';
import { X, Wand2, Crop, RotateCcw, Check, Sparkles, Eye, ShieldCheck, Scissors } from 'lucide-react';
import { extractArtwork, detectDominantColor } from '../../utils/imageUtils';

export default function DesignExtractorModal({ isOpen, onClose, originalImage, onApply }) {
  if (!isOpen || !originalImage) return null;

  // Active view tab: 'preview' (clean transparent) or 'crop' (adjust boundary)
  const [activeView, setActiveView] = useState('preview');

  // Crop percentage trims (Default to 22% top, 20% bottom, 18% sides to instantly cut collar, tag, sleeves, hem)
  const [cropTrim, setCropTrim] = useState({ top: 22, bottom: 20, left: 18, right: 18 });

  // Background removal options
  const [tolerance, setTolerance] = useState(48);
  const [mode, setMode] = useState('flood'); // 'flood' or 'global'
  const [removeWhiteOuter, setRemoveWhiteOuter] = useState(true);
  const [autoTrim, setAutoTrim] = useState(true);

  const [processedImage, setProcessedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Process image whenever parameters change
  useEffect(() => {
    let isCancelled = false;

    const runExtraction = async () => {
      setIsProcessing(true);
      try {
        const result = await extractArtwork(originalImage, {
          crop: cropTrim,
          tolerance,
          mode,
          removeWhiteOuter,
          autoTrim
        });
        if (!isCancelled) {
          setProcessedImage(result);
        }
      } catch (err) {
        console.error('Extraction error:', err);
      } finally {
        if (!isCancelled) setIsProcessing(false);
      }
    };

    const timer = setTimeout(runExtraction, 60);
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [originalImage, cropTrim, tolerance, mode, removeWhiteOuter, autoTrim]);

  // Presets
  const applyPresetChestOnly = () => {
    setCropTrim({ top: 22, bottom: 20, left: 18, right: 18 });
    setTolerance(48);
  };

  const applyPresetTight = () => {
    setCropTrim({ top: 28, bottom: 25, left: 24, right: 24 });
    setTolerance(52);
  };

  const applyPresetFull = () => {
    setCropTrim({ top: 0, bottom: 0, left: 0, right: 0 });
  };

  const handleApply = () => {
    if (processedImage) {
      onApply(processedImage);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200 border border-gray-100">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-purple-50 via-indigo-50 to-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-gray-900 text-base sm:text-lg flex items-center gap-2">
                Pembersih Desain Otomatis
                <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold">Anti Corak Kaos</span>
              </h3>
              <p className="text-xs text-gray-500">Memotong kerah, lengan & jahitan kaos bawaan foto agar hanya tersisa gambar ilustrasi bersih</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-5 p-5 overflow-y-auto">
          
          {/* Left Column: Visual Preview */}
          <div className="md:col-span-7 flex flex-col items-center justify-center">
            
            {/* View Switcher Tabs */}
            <div className="flex bg-gray-100 p-1 rounded-xl mb-3 w-full max-w-xs text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveView('preview')}
                className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${activeView === 'preview' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500'}`}
              >
                <Eye className="w-3.5 h-3.5" /> Hasil Bersih 3D
              </button>
              <button
                type="button"
                onClick={() => setActiveView('crop')}
                className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${activeView === 'crop' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
              >
                <Scissors className="w-3.5 h-3.5" /> Area Potong Kaos
              </button>
            </div>

            {/* Display Area */}
            <div className="relative w-full aspect-square max-h-[380px] rounded-2xl border-2 border-gray-200 overflow-hidden flex items-center justify-center shadow-inner"
                 style={{ background: 'repeating-conic-gradient(#e2e8f0 0% 25%, #ffffff 0% 50%) 0 0 / 16px 16px' }}>
              
              {isProcessing && (
                <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex items-center justify-center z-20 text-xs font-bold text-purple-700 gap-2">
                  <div className="w-4 h-4 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
                  Memotong & membersihkan corak...
                </div>
              )}

              {activeView === 'preview' ? (
                // Clean transparent preview
                processedImage ? (
                  <img 
                    src={processedImage} 
                    alt="Clean Graphic Preview" 
                    className="max-w-full max-h-full object-contain p-4 select-none drop-shadow-md"
                  />
                ) : null
              ) : (
                // Original photo with interactive visual crop overlay
                <div className="relative max-w-full max-h-full flex items-center justify-center overflow-hidden">
                  <img 
                    src={originalImage} 
                    alt="Original Upload" 
                    className="max-w-full max-h-[360px] object-contain select-none opacity-90"
                  />
                  {/* Visual Crop Frame Overlay */}
                  <div 
                    className="absolute border-2 border-dashed border-purple-500 bg-purple-500/10 pointer-events-none transition-all shadow-2xl"
                    style={{
                      top: `${cropTrim.top}%`,
                      bottom: `${cropTrim.bottom}%`,
                      left: `${cropTrim.left}%`,
                      right: `${cropTrim.right}%`
                    }}
                  >
                    <span className="absolute top-1.5 left-1.5 bg-purple-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
                      Area Desain Diambil
                    </span>
                  </div>

                  {/* Cutout overlays */}
                  <div className="absolute top-0 left-0 right-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center text-[10px] text-white/90 font-bold" style={{ height: `${cropTrim.top}%` }}>
                    Kerah & Label Dihapus
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center text-[10px] text-white/90 font-bold" style={{ height: `${cropTrim.bottom}%` }}>
                    Jahitan Bawah Dihapus
                  </div>
                  <div className="absolute top-0 bottom-0 left-0 bg-black/40 backdrop-blur-[1px]" style={{ width: `${cropTrim.left}%` }}></div>
                  <div className="absolute top-0 bottom-0 right-0 bg-black/40 backdrop-blur-[1px]" style={{ width: `${cropTrim.right}%` }}></div>
                </div>
              )}
            </div>

            <p className="text-[11px] text-gray-500 mt-2 text-center flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 inline" />
              Semua corak jahitan kerah, lengan, dan lipatan kain telah dibuang 100%.
            </p>
          </div>

          {/* Right Column: Controls */}
          <div className="md:col-span-5 flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              
              {/* Presets Card */}
              <div className="bg-purple-50/70 border border-purple-200/80 rounded-2xl p-3.5">
                <span className="text-xs font-bold text-purple-900 block mb-2">⚡ Pilihan Cepat Potong Foto Kaos:</span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={applyPresetChestOnly}
                    className="py-2 px-2.5 rounded-xl bg-purple-600 text-white font-bold shadow-md shadow-purple-600/20 hover:bg-purple-700 transition-all text-center leading-tight"
                  >
                    🎯 Dada Saja (Rekomendasi)
                  </button>
                  <button
                    type="button"
                    onClick={applyPresetTight}
                    className="py-2 px-2.5 rounded-xl bg-white border border-purple-300 text-purple-800 font-semibold hover:bg-purple-50 transition-all text-center leading-tight"
                  >
                    ✂️ Potong Ketat (Desain Kecil)
                  </button>
                </div>
              </div>

              {/* 4-Way Crop Sliders */}
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                    <Crop className="w-3.5 h-3.5 text-gray-700" />
                    Sesuaikan Batas Potongan:
                  </label>
                  <button
                    type="button"
                    onClick={() => setActiveView('crop')}
                    className="text-[11px] text-purple-600 font-semibold hover:underline"
                  >
                    Lihat Garis Potong
                  </button>
                </div>

                <div className="space-y-2 pt-1 text-xs">
                  <div>
                    <div className="flex justify-between text-[11px] text-gray-600 mb-0.5">
                      <span>Potong Atas (Kerah & Leher):</span>
                      <span className="font-bold text-purple-700">{cropTrim.top}%</span>
                    </div>
                    <input 
                      type="range" min="0" max="45" value={cropTrim.top} 
                      onChange={(e) => setCropTrim({ ...cropTrim, top: parseInt(e.target.value) })}
                      className="w-full accent-purple-600 h-1.5 cursor-pointer" 
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-gray-600 mb-0.5">
                      <span>Potong Bawah (Lipatan / Kelim):</span>
                      <span className="font-bold text-purple-700">{cropTrim.bottom}%</span>
                    </div>
                    <input 
                      type="range" min="0" max="45" value={cropTrim.bottom} 
                      onChange={(e) => setCropTrim({ ...cropTrim, bottom: parseInt(e.target.value) })}
                      className="w-full accent-purple-600 h-1.5 cursor-pointer" 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <div className="flex justify-between text-[10px] text-gray-600 mb-0.5">
                        <span>Kiri (Lengan):</span>
                        <span className="font-bold text-purple-700">{cropTrim.left}%</span>
                      </div>
                      <input 
                        type="range" min="0" max="40" value={cropTrim.left} 
                        onChange={(e) => setCropTrim({ ...cropTrim, left: parseInt(e.target.value) })}
                        className="w-full accent-purple-600 h-1.5 cursor-pointer" 
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] text-gray-600 mb-0.5">
                        <span>Kanan (Lengan):</span>
                        <span className="font-bold text-purple-700">{cropTrim.right}%</span>
                      </div>
                      <input 
                        type="range" min="0" max="40" value={cropTrim.right} 
                        onChange={(e) => setCropTrim({ ...cropTrim, right: parseInt(e.target.value) })}
                        className="w-full accent-purple-600 h-1.5 cursor-pointer" 
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Background Fabric Removal Slider */}
              <div className="bg-purple-50/50 border border-purple-100 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                    <Wand2 className="w-3.5 h-3.5 text-purple-600" />
                    Kebersihan Warna Kain (Toleransi):
                  </label>
                  <span className="text-xs font-bold text-purple-700">{tolerance}%</span>
                </div>
                <input 
                  type="range" min="15" max="85" value={tolerance} 
                  onChange={(e) => setTolerance(parseInt(e.target.value))}
                  className="w-full accent-purple-600 h-1.5 cursor-pointer" 
                />
                <div className="flex justify-between text-[10px] text-gray-400">
                  <span>Lembut (Artwork Halus)</span>
                  <span>Kuat (Hapus Kain Bersih)</span>
                </div>
              </div>

            </div>

            {/* Bottom Action Buttons */}
            <div className="pt-3 border-t border-gray-100 flex gap-2.5">
              <button 
                type="button"
                onClick={applyPresetFull}
                className="px-3.5 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 text-xs font-bold flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset
              </button>
              <button 
                type="button"
                onClick={handleApply}
                disabled={!processedImage}
                className="flex-1 bg-gradient-to-r from-purple-600 via-indigo-600 to-purple-700 hover:from-purple-700 hover:to-indigo-700 text-white font-extrabold py-3 px-4 rounded-xl text-xs sm:text-sm shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
              >
                <Check className="w-4 h-4" /> Terapkan ke Kaos 3D
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
