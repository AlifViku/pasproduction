import { useState, useEffect } from 'react';
import { X, Wand2, Crop, RotateCcw, Check, Sparkles, Eye, ShieldCheck, Scissors, Key, AlertCircle } from 'lucide-react';
import { extractArtwork } from '../../utils/imageUtils';
import { extractArtworkWithGemini, getGeminiApiKey } from '../../services/geminiService';
import GeminiKeyModal from './GeminiKeyModal';

export default function DesignExtractorModal({ isOpen, onClose, originalImage, onApply }) {
  if (!isOpen || !originalImage) return null;

  // Active view tab: 'preview' (clean transparent) or 'crop' (adjust boundary)
  const [activeView, setActiveView] = useState('preview');

  // Crop percentage trims (Default to 22% top, 20% bottom, 18% sides to cut collar, tag, sleeves, hem)
  const [cropTrim, setCropTrim] = useState({ top: 22, bottom: 20, left: 18, right: 18 });

  // Background removal options
  const [tolerance, setTolerance] = useState(48);
  const [mode, setMode] = useState('flood'); // 'flood' or 'global'
  const [removeWhiteOuter, setRemoveWhiteOuter] = useState(true);
  const [autoTrim, setAutoTrim] = useState(true);

  const [processedImage, setProcessedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Gemini AI States
  const [isGeminiAnalyzing, setIsGeminiAnalyzing] = useState(false);
  const [geminiInsight, setGeminiInsight] = useState(null);
  const [geminiError, setGeminiError] = useState('');
  const [showKeyModal, setShowKeyModal] = useState(false);

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

  // Google Gemini AI Auto-Extraction
  const handleGeminiAutoExtract = async () => {
    const key = getGeminiApiKey();
    if (!key) {
      setShowKeyModal(true);
      return;
    }

    setIsGeminiAnalyzing(true);
    setGeminiError('');

    try {
      const aiResult = await extractArtworkWithGemini(originalImage);
      if (aiResult && aiResult.crop) {
        setCropTrim(aiResult.crop);
        setTolerance(aiResult.suggestedTolerance);
        setGeminiInsight(aiResult);
        setActiveView('preview');
      }
    } catch (err) {
      console.error('Gemini extraction error:', err);
      setGeminiError(err.message || 'Gagal menganalisis dengan Gemini AI');
    } finally {
      setIsGeminiAnalyzing(false);
    }
  };

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
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-gray-900 text-base sm:text-lg flex items-center gap-2">
                Pembersih Desain Kaos
                <span className="text-[10px] bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-2 py-0.5 rounded-full font-bold shadow-xs">
                  Gemini Flash AI
                </span>
              </h3>
              <p className="text-xs text-gray-500">Isolasi & hapus kain kaos secara otomatis dengan bantuan Computer Vision Gemini</p>
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
                className={`flex-1 py-1.5 rounded-lg flex items-center justify-center gap-1.5 transition-all ${activeView === 'preview' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500'}`}
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
                <div className="absolute inset-0 bg-white/70 backdrop-blur-xs flex items-center justify-center z-20 text-xs font-bold text-indigo-700 gap-2">
                  <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  Memproses & membersihkan corak...
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
                    className="absolute border-2 border-dashed border-indigo-500 bg-indigo-500/10 pointer-events-none transition-all shadow-2xl"
                    style={{
                      top: `${cropTrim.top}%`,
                      bottom: `${cropTrim.bottom}%`,
                      left: `${cropTrim.left}%`,
                      right: `${cropTrim.right}%`
                    }}
                  >
                    <span className="absolute top-1.5 left-1.5 bg-indigo-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
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
              Kerah, jahitan lengan, dan pinggir kain terpotong rapi untuk ditempel ke model 3D.
            </p>
          </div>

          {/* Right Column: Controls */}
          <div className="md:col-span-5 flex flex-col justify-between space-y-4">
            <div className="space-y-3.5">
              
              {/* Gemini AI Auto-Extractor Card */}
              <div className="bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 border border-indigo-200/80 rounded-2xl p-3.5 space-y-2.5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
                    Gemini Flash AI Detection:
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowKeyModal(true)}
                    className="text-[10px] text-indigo-600 hover:text-indigo-900 font-bold flex items-center gap-1"
                  >
                    <Key className="w-3 h-3" /> {getGeminiApiKey() ? 'API Key OK' : 'Atur API Key'}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleGeminiAutoExtract}
                  disabled={isGeminiAnalyzing}
                  className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-extrabold text-xs shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
                >
                  {isGeminiAnalyzing ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Gemini menganalisis letak artwork...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      Ekstraksi Otomatis dengan Gemini AI
                    </>
                  )}
                </button>

                {geminiInsight && (
                  <div className="bg-white/90 backdrop-blur-xs rounded-xl p-2.5 border border-indigo-100 text-[11px] space-y-1.5 shadow-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-indigo-950 truncate max-w-[170px]">{geminiInsight.artworkTitle}</span>
                      <span className="text-[9px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full font-bold">
                        {geminiInsight.artworkStyle}
                      </span>
                    </div>
                    <p className="text-gray-500 text-[10px] leading-tight">{geminiInsight.placementAdvice}</p>
                    <div className="flex items-center gap-2 pt-0.5 text-[10px] text-gray-600 font-medium">
                      <span>Warna Kain Kaos:</span>
                      <span className="w-3.5 h-3.5 rounded-full border border-gray-300 shadow-xs inline-block" style={{ backgroundColor: geminiInsight.fabricColor }} />
                      <span className="font-mono text-gray-700 font-semibold">{geminiInsight.fabricColor}</span>
                    </div>
                  </div>
                )}

                {geminiError && (
                  <div className="text-[11px] text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200 flex items-start gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                    <div className="flex-1">
                      <p className="leading-tight">{geminiError}</p>
                      <button
                        type="button"
                        onClick={() => setShowKeyModal(true)}
                        className="text-xs font-bold text-red-700 underline mt-1 block"
                      >
                        Buka Pengaturan API Key
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Presets Card */}
              <div className="bg-gray-50/80 border border-gray-200 rounded-2xl p-3">
                <span className="text-xs font-bold text-gray-800 block mb-2">⚡ Pilihan Cepat Potong Manual:</span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={applyPresetChestOnly}
                    className="py-1.5 px-2 rounded-xl bg-white border border-gray-300 text-gray-800 font-semibold hover:bg-gray-100 transition-all text-center leading-tight shadow-xs"
                  >
                    🎯 Sablon Dada
                  </button>
                  <button
                    type="button"
                    onClick={applyPresetTight}
                    className="py-1.5 px-2 rounded-xl bg-white border border-gray-300 text-gray-800 font-semibold hover:bg-gray-100 transition-all text-center leading-tight shadow-xs"
                  >
                    ✂️ Potong Ketat
                  </button>
                </div>
              </div>

              {/* 4-Way Crop Sliders */}
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                    <Crop className="w-3.5 h-3.5 text-gray-700" />
                    Sesuaikan Batas Potongan:
                  </label>
                  <button
                    type="button"
                    onClick={() => setActiveView('crop')}
                    className="text-[11px] text-indigo-600 font-semibold hover:underline"
                  >
                    Lihat Garis Potong
                  </button>
                </div>

                <div className="space-y-2 pt-1 text-xs">
                  <div>
                    <div className="flex justify-between text-[11px] text-gray-600 mb-0.5">
                      <span>Potong Atas (Kerah & Leher):</span>
                      <span className="font-bold text-indigo-700">{cropTrim.top}%</span>
                    </div>
                    <input 
                      type="range" min="0" max="45" value={cropTrim.top} 
                      onChange={(e) => setCropTrim({ ...cropTrim, top: parseInt(e.target.value) })}
                      className="w-full accent-indigo-600 h-1.5 cursor-pointer" 
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-gray-600 mb-0.5">
                      <span>Potong Bawah (Lipatan Kelim):</span>
                      <span className="font-bold text-indigo-700">{cropTrim.bottom}%</span>
                    </div>
                    <input 
                      type="range" min="0" max="45" value={cropTrim.bottom} 
                      onChange={(e) => setCropTrim({ ...cropTrim, bottom: parseInt(e.target.value) })}
                      className="w-full accent-indigo-600 h-1.5 cursor-pointer" 
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-0.5">
                    <div>
                      <div className="flex justify-between text-[10px] text-gray-600 mb-0.5">
                        <span>Kiri (Lengan):</span>
                        <span className="font-bold text-indigo-700">{cropTrim.left}%</span>
                      </div>
                      <input 
                        type="range" min="0" max="40" value={cropTrim.left} 
                        onChange={(e) => setCropTrim({ ...cropTrim, left: parseInt(e.target.value) })}
                        className="w-full accent-indigo-600 h-1.5 cursor-pointer" 
                      />
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] text-gray-600 mb-0.5">
                        <span>Kanan (Lengan):</span>
                        <span className="font-bold text-indigo-700">{cropTrim.right}%</span>
                      </div>
                      <input 
                        type="range" min="0" max="40" value={cropTrim.right} 
                        onChange={(e) => setCropTrim({ ...cropTrim, right: parseInt(e.target.value) })}
                        className="w-full accent-indigo-600 h-1.5 cursor-pointer" 
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Background Fabric Removal Slider */}
              <div className="bg-indigo-50/50 border border-indigo-100 rounded-2xl p-3 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                    <Wand2 className="w-3.5 h-3.5 text-indigo-600" />
                    Toleransi Bersih Kain Kaos:
                  </label>
                  <span className="text-xs font-bold text-indigo-700">{tolerance}%</span>
                </div>
                <input 
                  type="range" min="15" max="85" value={tolerance} 
                  onChange={(e) => setTolerance(parseInt(e.target.value))}
                  className="w-full accent-indigo-600 h-1.5 cursor-pointer" 
                />
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
                className="flex-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-extrabold py-3 px-4 rounded-xl text-xs sm:text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
              >
                <Check className="w-4 h-4" /> Terapkan ke Kaos 3D
              </button>
            </div>

          </div>

        </div>

      </div>

      {/* Gemini API Key Configuration Modal */}
      <GeminiKeyModal
        isOpen={showKeyModal}
        onClose={() => setShowKeyModal(false)}
        onSuccess={() => handleGeminiAutoExtract()}
      />
    </div>
  );
}
