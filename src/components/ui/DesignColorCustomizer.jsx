import { useState, useEffect } from 'react';
import { Palette, Sparkles, RefreshCw, Layers, Check, Sliders, ChevronDown, ChevronUp, SunMoon } from 'lucide-react';
import { extractImagePalette, replaceColorInImage, addContourOutline, invertDarkAndLight } from '../../utils/imageUtils';

export default function DesignColorCustomizer({
  currentImage,
  originalImage,
  onUpdateImage,
  shirtColor = '#111827'
}) {
  const [isOpen, setIsOpen] = useState(true);
  const [palette, setPalette] = useState([]);
  const [selectedColor, setSelectedColor] = useState(null);
  const [replacementColor, setReplacementColor] = useState('#ffffff');
  const [isProcessing, setIsProcessing] = useState(false);

  // Contour Outline State
  const [enableOutline, setEnableOutline] = useState(false);
  const [outlineColor, setOutlineColor] = useState('#ffffff');
  const [outlineThickness, setOutlineThickness] = useState(4);

  // Quick preset replacement colors
  const quickColors = [
    '#ffffff', '#000000', '#facc15', '#ef4444', 
    '#38bdf8', '#22c55e', '#a855f7', '#fb923c'
  ];

  // Extract palette whenever currentImage changes; always reset selectedColor
  useEffect(() => {
    if (!currentImage) {
      setPalette([]);
      setSelectedColor(null);
      return;
    }
    let isCancelled = false;

    extractImagePalette(currentImage)
      .then((colors) => {
        if (!isCancelled) {
          setPalette(colors);
          // Always pick the first (most dominant) color after a fresh extract
          setSelectedColor(colors.length > 0 ? colors[0] : null);
        }
      })
      .catch((err) => console.error('Failed to extract palette:', err));

    return () => {
      isCancelled = true;
    };
  }, [currentImage]);

  // Handle color replacement
  const handleApplyColorSwap = async () => {
    if (!selectedColor || !currentImage) return;
    setIsProcessing(true);
    try {
      const updated = await replaceColorInImage(
        currentImage,
        selectedColor.rgb,
        replacementColor,
        45
      );
      onUpdateImage(updated);
    } catch (err) {
      console.error('Color swap error:', err);
      // Show user-visible error (alert as fallback)
      alert(`Gagal mengubah warna: ${err?.message || 'Coba upload ulang gambar.'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle contour outline toggle / change
  const handleToggleOutline = async (checked, color = outlineColor, thickness = outlineThickness) => {
    setEnableOutline(checked);
    if (!currentImage) return;

    setIsProcessing(true);
    try {
      if (checked) {
        const outlined = await addContourOutline(currentImage, {
          strokeColor: color,
          thickness
        });
        onUpdateImage(outlined);
      } else if (originalImage) {
        onUpdateImage(originalImage);
      }
    } catch (err) {
      console.error('Outline error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Quick Invert
  const handleQuickInvert = async () => {
    if (!currentImage) return;
    setIsProcessing(true);
    try {
      const inverted = await invertDarkAndLight(currentImage);
      onUpdateImage(inverted);
    } catch (err) {
      console.error('Invert error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset to original
  const handleReset = () => {
    if (originalImage) {
      setEnableOutline(false);
      onUpdateImage(originalImage);
    }
  };

  if (!currentImage) return null;

  return (
    <div className="bg-gradient-to-br from-purple-50/90 via-indigo-50/50 to-white rounded-2xl border border-purple-200/80 p-3.5 space-y-3 shadow-xs">
      
      {/* Header Accordion */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between cursor-pointer select-none"
      >
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
            <Palette className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="font-extrabold text-xs text-gray-900 flex items-center gap-1.5">
              Kustomisasi Warna Desain
              <span className="text-[9px] bg-purple-100 text-purple-700 px-1.5 py-0.2 rounded-full font-bold">Anti Tenggelam</span>
            </h4>
          </div>
        </div>
        <button type="button" className="text-gray-400 hover:text-gray-600">
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {isOpen && (
        <div className="space-y-3 pt-1 text-xs">
          
          {/* Section 1: Detected Palette Color Swapper */}
          <div className="bg-white/80 rounded-xl p-2.5 border border-purple-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-700 flex items-center gap-1">
                <Sliders className="w-3 h-3 text-purple-600" />
                Pilih Bagian Warna untuk Diganti:
              </span>
              <span className="text-[9px] text-gray-400">Klik warna</span>
            </div>

            {/* Color Swatch Circles */}
            <div className="flex flex-wrap gap-1.5 items-center">
              {palette.map((item, idx) => {
                const isSelected = selectedColor?.hex === item.hex;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSelectedColor(item);
                      setReplacementColor(item.hex);
                    }}
                    title={`${item.name} (${item.hex})`}
                    className={`relative w-7 h-7 rounded-full border-2 transition-transform hover:scale-110 shadow-xs flex items-center justify-center ${
                      isSelected ? 'ring-2 ring-purple-600 scale-110 border-white' : 'border-gray-200'
                    }`}
                    style={{ backgroundColor: item.hex }}
                  >
                    {isSelected && (
                      <Check className={`w-3.5 h-3.5 ${item.rgb[0] + item.rgb[1] + item.rgb[2] > 380 ? 'text-gray-900' : 'text-white'}`} />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Selected Color Replacement Controls */}
            {selectedColor && (
              <div className="pt-2 border-t border-gray-100 space-y-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-gray-600">
                    Ubah <strong>{selectedColor.name}</strong> menjadi:
                  </span>
                  <div className="flex items-center gap-1">
                    <span 
                      className="w-4 h-4 rounded-full border border-gray-300 shadow-xs" 
                      style={{ backgroundColor: replacementColor }} 
                    />
                    <span className="font-mono font-bold text-gray-800 text-[10px]">{replacementColor}</span>
                  </div>
                </div>

                {/* Quick replacement color pills */}
                <div className="flex items-center gap-1.5">
                  {quickColors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setReplacementColor(c)}
                      className={`w-5 h-5 rounded-md border shadow-2xs transition-transform hover:scale-110 ${
                        replacementColor === c ? 'ring-2 ring-purple-500 scale-105 border-white' : 'border-gray-200'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  <input
                    type="color"
                    value={replacementColor}
                    onChange={(e) => setReplacementColor(e.target.value)}
                    className="w-5 h-5 rounded cursor-pointer border-none p-0 bg-transparent"
                    title="Pilih warna custom"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleApplyColorSwap}
                  disabled={isProcessing}
                  className="w-full py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg text-[11px] shadow-xs flex items-center justify-center gap-1 transition-all disabled:opacity-50"
                >
                  {isProcessing ? 'Mengubah warna...' : `Ganti Warna ${selectedColor.name}`}
                </button>
              </div>
            )}
          </div>

          {/* Section 2: Contour Outline (Underbase Stroke) */}
          <div className="bg-white/80 rounded-xl p-2.5 border border-purple-100 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-gray-800 flex items-center gap-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={enableOutline}
                  onChange={(e) => handleToggleOutline(e.target.checked)}
                  className="w-3.5 h-3.5 accent-purple-600 rounded cursor-pointer"
                />
                <Layers className="w-3 h-3 text-indigo-600" />
                Garis Tepi Kontras (Auto-Outline)
              </label>
              <span className="text-[9px] bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.5 rounded">
                Sablon DTF
              </span>
            </div>

            <p className="text-[10px] text-gray-500 leading-tight">
              Memberi garis keliling agar tulisan/gambar gelap tidak tenggelam di kaos hitam, atau sebaliknya.
            </p>

            {enableOutline && (
              <div className="pt-1.5 space-y-2 border-t border-gray-100 animate-in fade-in duration-150">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-gray-600">Warna Garis Tepi:</span>
                  <div className="flex items-center gap-1">
                    {['#ffffff', '#000000', '#facc15', '#38bdf8'].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => {
                          setOutlineColor(c);
                          handleToggleOutline(true, c, outlineThickness);
                        }}
                        className={`w-4 h-4 rounded-full border ${
                          outlineColor === c ? 'ring-2 ring-purple-600 scale-110' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                    <input
                      type="color"
                      value={outlineColor}
                      onChange={(e) => {
                        setOutlineColor(e.target.value);
                        handleToggleOutline(true, e.target.value, outlineThickness);
                      }}
                      className="w-4 h-4 rounded cursor-pointer border-none p-0 bg-transparent"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[10px] text-gray-600 mb-0.5">
                    <span>Ketebalan Garis:</span>
                    <span className="font-bold text-purple-700">{outlineThickness}px</span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="8"
                    step="1"
                    value={outlineThickness}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      setOutlineThickness(val);
                      handleToggleOutline(true, outlineColor, val);
                    }}
                    className="w-full accent-purple-600 h-1.5 cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Quick Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={handleQuickInvert}
              disabled={isProcessing}
              title="Balik elemen hitam menjadi putih, atau elemen putih menjadi hitam"
              className="py-1.5 px-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-bold rounded-lg text-[10px] flex items-center justify-center gap-1 transition-colors"
            >
              <SunMoon className="w-3 h-3 text-amber-500" /> Invert Gelap ⇄ Terang
            </button>
            <button
              type="button"
              onClick={handleReset}
              disabled={isProcessing}
              className="py-1.5 px-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-500 hover:text-gray-700 font-semibold rounded-lg text-[10px] flex items-center justify-center gap-1 transition-colors"
            >
              <RefreshCw className="w-3 h-3 text-gray-400" /> Reset Warna Asli
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
