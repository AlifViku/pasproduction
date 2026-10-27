/**
 * Google Gemini Flash API Service for PAS Production
 * Supports Gemini 3.5 Flash / Gemini 3 Flash / Gemini 3.8 Flash
 * Features:
 * - Smart Artwork Bounding Box & Color Detection for Apparel Mockups
 * - AI Graphic Generator (SVG & Canvas to Decal)
 * - AI Fashion Stylist / Color Harmony Critique
 */

const GEMINI_STORAGE_KEY = 'pas_gemini_api_key';
const GEMINI_MODEL_STORAGE_KEY = 'pas_gemini_model';

// Supported Flash models available on Gemini API
export const SUPPORTED_MODELS = [
  { id: 'gemini-3.5-flash', name: 'Gemini 3.5 Flash (Aktif & Direkomendasikan - Sangat Cepat)' },
  { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash Preview (Cepat & Stabil)' },
  { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash (Model Terbaru)' },
  { id: 'gemini-flash-latest', name: 'Gemini Flash Latest' }
];

export function getGeminiApiKey() {
  return localStorage.getItem(GEMINI_STORAGE_KEY) || import.meta.env.VITE_GEMINI_API_KEY || '';
}

export function setGeminiApiKey(key) {
  if (key) {
    localStorage.setItem(GEMINI_STORAGE_KEY, key.trim());
  } else {
    localStorage.removeItem(GEMINI_STORAGE_KEY);
  }
}

export function getSelectedModel() {
  return localStorage.getItem(GEMINI_MODEL_STORAGE_KEY) || 'gemini-3.5-flash';
}

export function setSelectedModel(modelId) {
  localStorage.setItem(GEMINI_MODEL_STORAGE_KEY, modelId);
}

/**
 * Resilient JSON parser that handles markdown codeblocks and extracted objects
 */
export function safeJsonParse(rawText, fallback = {}) {
  if (!rawText) return fallback;
  const cleaned = rawText
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      try {
        return JSON.parse(cleaned.substring(start, end + 1));
      } catch (e2) {
        console.warn('Fallback JSON extraction failed:', e2);
      }
    }
    return fallback;
  }
}

/**
 * Clean and extract base64 data & mime type
 */
function parseBase64(dataUrl) {
  const matches = dataUrl.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
  if (matches && matches.length === 3) {
    return { mimeType: matches[1], data: matches[2] };
  }
  // Default fallback
  return { mimeType: 'image/jpeg', data: dataUrl.replace(/^data:image\/[a-z]+;base64,/, '') };
}

/**
 * Universal caller to Gemini REST API with auto-fallback to older model if quota/model error occurs
 */
async function callGeminiApi({ prompt, imageBase64 = null, jsonSchema = null, model = null }) {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error('API Key Google Gemini belum diatur. Silakan masukkan API Key Anda di menu Pengaturan AI.');
  }

  const primaryModel = model || getSelectedModel();
  const modelsToTry = [
    primaryModel,
    'gemini-3.5-flash',
    'gemini-3-flash-preview',
    'gemini-3.8-flash',
    'gemini-flash-latest'
  ].filter((v, i, a) => a.indexOf(v) === i);

  let lastError = null;

  for (const m of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${m}:generateContent?key=${apiKey}`;

      const parts = [{ text: prompt }];

      if (imageBase64) {
        const { mimeType, data } = parseBase64(imageBase64);
        parts.push({
          inline_data: {
            mime_type: mimeType,
            data: data
          }
        });
      }

      const body = {
        contents: [{ parts }],
        generationConfig: {
          temperature: 0.25,
          ...(jsonSchema ? { response_mime_type: 'application/json' } : {})
        }
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        const errMsg = errJson?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(`Gemini API (${m}): ${errMsg}`);
      }

      const resData = await response.json();
      const text = resData?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!text) {
        throw new Error('Respons kosong diterima dari Gemini API.');
      }

      return text;
    } catch (err) {
      console.warn(`Attempt with ${m} failed:`, err.message);
      lastError = err;
      if (err.message.includes('API_KEY_INVALID') || err.message.includes('API key not valid')) {
        throw new Error('Google Gemini API Key tidak valid. Mohon periksa kembali API Key Anda dari Google AI Studio.');
      }
    }
  }

  throw lastError || new Error('Gagal menghubungi Gemini API.');
}

/**
 * 1. AI Auto-Extraction for Apparel Mockups
 * Analyzes photo of a t-shirt to detect precise artwork coordinates, fabric color, and recommended tolerance
 */
export async function extractArtworkWithGemini(imageBase64) {
  const prompt = `Anda adalah asisten AI computer vision ahli konveksi & sablon busana (apparel production).
Tugas Anda: Menganalisis foto produk kaos / mockup pakaian berikut untuk mengisolasi artwork atau sablon utama di dada/punggung.

Instruksi:
1. Temukan batas kotak (bounding box) gambar ilustrasi / sablon utama.
   Tentukan nilai crop dalam persentase (0 sampai 50) yang harus dipotong dari masing-masing tepi foto:
   - top: persentase untuk membuang kerah leher, tag label, dan bahu (biasanya 15 - 35%)
   - bottom: persentase untuk membuang kelim jahitan bawah / perut kosong (biasanya 15 - 35%)
   - left: persentase untuk membuang lengan kiri & latar samping (biasanya 10 - 30%)
   - right: persentase untuk membuang lengan kanan & latar samping (biasanya 10 - 30%)
2. Deteksi warna kain kaos latar belakang (dominant fabric color) dalam kode HEX (misal: "#1f2937", "#ffffff", "#e5e7eb").
3. Estimasi toleransi pembersihan warna (angka antara 30 sampai 65).
4. Berikan judul singkat ilustrasi (artworkTitle) dan deskripsi gaya visual (artworkStyle, misal: "Streetwear Cyberpunk", "Vintage Typographic", "Minimalist Logo").
5. Berikan catatan rekomendasi penempatan di kaos 3D (placementAdvice).

KEMBALIKAN HANYA FORMAT JSON VALID BERIKUT:
{
  "crop": {
    "top": 22,
    "bottom": 20,
    "left": 18,
    "right": 18
  },
  "fabricColor": "#1a1a1a",
  "suggestedTolerance": 48,
  "artworkTitle": "Judul Desain",
  "artworkStyle": "Gaya Desain",
  "placementAdvice": "Saran penempatan di kaos 3D"
}`;

  const rawJson = await callGeminiApi({
    prompt,
    imageBase64,
    jsonSchema: true
  });

  const data = safeJsonParse(rawJson, {});

  // Sanitize values with safe fallbacks
  const safeCrop = {
    top: Math.min(45, Math.max(0, parseInt(data?.crop?.top ?? 22))),
    bottom: Math.min(45, Math.max(0, parseInt(data?.crop?.bottom ?? 20))),
    left: Math.min(40, Math.max(0, parseInt(data?.crop?.left ?? 18))),
    right: Math.min(40, Math.max(0, parseInt(data?.crop?.right ?? 18)))
  };

  const safeTolerance = Math.min(80, Math.max(20, parseInt(data?.suggestedTolerance ?? 48)));

  return {
    success: true,
    crop: safeCrop,
    fabricColor: data?.fabricColor || '#ffffff',
    suggestedTolerance: safeTolerance,
    artworkTitle: data?.artworkTitle || 'Artwork Sablon Kaos',
    artworkStyle: data?.artworkStyle || 'Custom Graphic',
    placementAdvice: data?.placementAdvice || 'Cocok untuk sablon dada depan'
  };
}

/**
 * 2. AI Graphic / Decal Generator (Robust SVG & Metadata Parser)
 * Generates an SVG vector graphic based on user prompt that is rendered into a high-res PNG decal
 */
export async function generateGraphicWithGemini(userPrompt, style = 'streetwear') {
  const prompt = `Anda adalah desainer grafis sablon kaos apparel profesional.
Buatlah desain grafis sablon vektor SVG siap cetak berdasarkan ide berikut:
Ide Desain: "${userPrompt}"
Gaya Desain: "${style}"

Aturan Output:
Kembalikan HANYA format terpisah berikut (tanpa salam atau penutup basa-basi):
[TITLE]: (Judul singkat grafis)
[COLOR]: #hex (Rekomendasi warna kain kaos yang cocok)
[STORY]: (1-2 kalimat cerita/konsep desain)
[SVG]:
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800">
  <!-- Elemen visual SVG mandiri lengkap, tipografi indah, path, shapes, warna kontras tinggi, background transparan -->
</svg>

Syarat SVG:
1. Harus diawali <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800"> dan diakhiri </svg>.
2. Background transparan (TANPA rect background penuh warna).
3. Desain harus estetik, berkarakter kuat untuk kaos distro streetwear / vintage / typography.`;

  const rawText = await callGeminiApi({
    prompt,
    jsonSchema: false
  });

  // 1. Extract SVG block directly
  const svgMatch = rawText.match(/<svg[\s\S]*?<\/svg>/i);
  let svg = svgMatch ? svgMatch[0] : null;

  // 2. Extract title
  let title = userPrompt;
  const titleMatch = rawText.match(/\[TITLE\]:\s*([^\n\r]+)/i) || rawText.match(/"title"\s*:\s*"([^"]+)"/i);
  if (titleMatch) title = titleMatch[1].trim();

  // 3. Extract shirt color
  let suggestedShirtColor = '#1e293b';
  const colorMatch = rawText.match(/\[COLOR\]:\s*(#[0-9a-fA-F]{3,8})/i) || rawText.match(/"suggestedShirtColor"\s*:\s*"(#[0-9a-fA-F]{3,8})"/i) || rawText.match(/#(?:[0-9a-fA-F]{3}){1,2}\b/);
  if (colorMatch) suggestedShirtColor = colorMatch[1] || colorMatch[0];

  // 4. Extract story
  let story = 'Didesain oleh Gemini Flash AI';
  const storyMatch = rawText.match(/\[STORY\]:\s*([^\n\r]+)/i) || rawText.match(/"story"\s*:\s*"([^"]+)"/i);
  if (storyMatch) story = storyMatch[1].trim();

  // Fallback if model did not produce an SVG tag
  if (!svg) {
    svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" width="800" height="800">
      <circle cx="400" cy="400" r="300" stroke="#6366f1" stroke-width="12" fill="none"/>
      <text x="400" y="385" font-family="sans-serif" font-weight="900" font-size="56" fill="#ffffff" text-anchor="middle">${title.toUpperCase()}</text>
      <text x="400" y="445" font-family="sans-serif" font-weight="600" font-size="28" fill="#818cf8" text-anchor="middle">PAS PRODUCTION • APPAREL</text>
    </svg>`;
  }

  // Convert SVG to PNG Data URL via Canvas
  const dataUrl = await svgToPngDataUrl(svg, 1024, 1024);

  return {
    title,
    suggestedShirtColor,
    story,
    svg,
    dataUrl
  };
}

/**
 * Helper: Converts SVG string to PNG Data URL
 */
function svgToPngDataUrl(svgString, width = 1024, height = 1024) {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');

    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();

    img.onload = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/png'));
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 54px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('PAS PRODUCTION', width / 2, height / 2);
      resolve(canvas.toDataURL('image/png'));
    };

    img.src = url;
  });
}

/**
 * 3. AI Fashion Stylist: Color & Harmony Critique
 */
export async function getOutfitFashionCritique(shirtColorHex, designTitle) {
  const prompt = `Anda adalah kurator mode fashion distro dan apparel merchandiser.
Kaos custom memiliki warna kain: ${shirtColorHex}
Dengan sablon ilustrasi: "${designTitle || 'Custom Graphic'}"

Berikan penilaian estetika singkat dalam format JSON:
{
  "harmonyScore": 88,
  "verdict": "Sangat Cocok / Kontras Elegan / dll",
  "feedback": "Penjelasan mengapa kombinasi ini menarik atau saran perbaikan warna.",
  "recommendedPantColors": ["#hex1", "#hex2"]
}`;

  const rawJson = await callGeminiApi({
    prompt,
    jsonSchema: true
  });

  return safeJsonParse(rawJson, {
    harmonyScore: 88,
    verdict: "Kombinasi Kontras Serasi",
    feedback: "Warna kaos dan desain memiliki kontras yang baik untuk gaya kasual modern.",
    recommendedPantColors: ["#1e293b", "#475569"]
  });
}
