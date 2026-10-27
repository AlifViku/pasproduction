import { useState } from 'react';
import { X, Key, Sparkles, ExternalLink, Check, AlertCircle, Cpu } from 'lucide-react';
import { getGeminiApiKey, setGeminiApiKey, getSelectedModel, setSelectedModel, SUPPORTED_MODELS } from '../../services/geminiService';

export default function GeminiKeyModal({ isOpen, onClose, onSuccess }) {
  if (!isOpen) return null;

  const [apiKey, setApiKey] = useState(getGeminiApiKey());
  const [model, setModel] = useState(getSelectedModel());
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSave = (e) => {
    e.preventDefault();
    if (!apiKey.trim()) {
      setErrorMsg('API Key tidak boleh kosong.');
      return;
    }

    setGeminiApiKey(apiKey.trim());
    setSelectedModel(model);
    setSavedSuccess(true);
    setErrorMsg('');

    setTimeout(() => {
      setSavedSuccess(false);
      if (onSuccess) onSuccess();
      onClose();
    }, 600);
  };

  const handleClear = () => {
    setGeminiApiKey('');
    setApiKey('');
    setErrorMsg('');
  };

  return (
    <div className="fixed inset-0 z-[250] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-100">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-gray-900 text-base flex items-center gap-2">
                Google Gemini Flash API
                <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">Gratis</span>
              </h3>
              <p className="text-xs text-gray-500">Konfigurasi AI Vision & Desain Otomatis</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-6 space-y-4">
          
          <div className="bg-blue-50/80 border border-blue-200/80 rounded-2xl p-4 text-xs text-blue-900 space-y-2">
            <p className="font-bold flex items-center gap-1.5">
              <Key className="w-4 h-4 text-blue-600 shrink-0" />
              Dapatkan Google Gemini API Key Gratis:
            </p>
            <p className="text-blue-800 leading-relaxed">
              Google menyediakan kuota gratis hingga <strong>1.500 request/hari</strong> tanpa kartu kredit melalui Google AI Studio.
            </p>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-blue-700 hover:text-blue-900 font-extrabold underline text-xs pt-1"
            >
              Buka Google AI Studio (Get API Key) <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Google Gemini API Key
            </label>
            <div className="relative">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="AIzaSy..."
                className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-mono tracking-wider bg-gray-50/50"
              />
              {apiKey && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-gray-400 hover:text-red-600 font-semibold"
                >
                  Hapus
                </button>
              )}
            </div>
            {errorMsg && (
              <p className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {errorMsg}
              </p>
            )}
            <p className="text-[11px] text-gray-400 mt-1">
              *Tersimpan aman di browser lokal Anda (Local Storage) atau dapat disimpan di file <code className="bg-gray-100 px-1 py-0.5 rounded">.env</code> (<code className="bg-gray-100 px-1 py-0.5 rounded">VITE_GEMINI_API_KEY</code>).
            </p>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-purple-600" />
              Pilihan Model Gemini Flash
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-xs font-medium bg-white focus:ring-2 focus:ring-purple-500"
            >
              {SUPPORTED_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-gray-100 flex gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 text-xs font-bold transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-extrabold py-2.5 px-4 rounded-xl text-xs sm:text-sm shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all"
            >
              {savedSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" /> Berhasil Disimpan!
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" /> Simpan Pengaturan AI
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
