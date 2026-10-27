import { useState, Suspense, useRef, useEffect } from 'react';
import { HexColorPicker } from "react-colorful";
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, useGLTF, useTexture, Decal } from '@react-three/drei';
import { useStore } from '../../store/useStore';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Key, Check, AlertCircle } from 'lucide-react';
import DesignExtractorModal from '../../components/ui/DesignExtractorModal';
import GeminiKeyModal from '../../components/ui/GeminiKeyModal';
import { generateGraphicWithGemini, getOutfitFashionCritique, getGeminiApiKey } from '../../services/geminiService';
import swatchIcon from '../../assets/swatch.png';
import fileIcon from '../../assets/file.png';
import aiIcon from '../../assets/ai.png';
import logoTshirtIcon from '../../assets/logo-tshirt.png';
import stylishTshirtIcon from '../../assets/stylish-tshirt.png';
import textIcon from '../../assets/text.png';
import * as THREE from 'three';


function PatternDecal({ url, tileScale, rotAngle, flipX, position, rotation, depth }) {
  const texture = useTexture(url);
  useEffect(() => {
    if (texture) {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(flipX ? -tileScale : tileScale, tileScale);
      texture.center.set(0.5, 0.5);
      texture.needsUpdate = true;
    }
  }, [texture, tileScale, flipX]);
  
  const finalRot = [rotation[0], rotation[1], rotation[2] + rotAngle];
  
  return (
    <Decal position={position} rotation={finalRot} scale={[2.5, 2.5, depth]} depthTest={true}>
      <meshStandardMaterial map={texture} transparent polygonOffset polygonOffsetFactor={-1} />
    </Decal>
  );
}

function LogoDecal({ url, pos, rot, scale, angle = 0, flipX = false }) {
  const texture = useTexture(url);
  
  useEffect(() => {
    if (texture) {
      texture.wrapS = THREE.RepeatWrapping;
      texture.repeat.x = flipX ? -1 : 1;
      texture.center.set(0.5, 0.5);
      texture.needsUpdate = true;
    }
  }, [texture, flipX]);

  const finalRot = [rot[0], rot[1], rot[2] + angle];
  return (
    <Decal position={pos} rotation={finalRot} scale={scale} depthTest={true}>
      <meshStandardMaterial map={texture} transparent polygonOffset polygonOffsetFactor={-2} />
    </Decal>
  );
}

function CameraController({ resetTrigger }) {
  const { controls, camera } = useThree();
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    if (resetTrigger > 0) {
      setResetting(true);
    }
  }, [resetTrigger]);

  useFrame((state, delta) => {
    if (resetting && controls) {
      let isDone = true;
      
      const currentAzimuth = controls.getAzimuthalAngle();
      if (Math.abs(currentAzimuth) > 0.005) {
        controls.setAzimuthalAngle(THREE.MathUtils.damp(currentAzimuth, 0, 8, delta));
        isDone = false;
      }
      
      const currentPolar = controls.getPolarAngle();
      if (Math.abs(currentPolar - Math.PI / 2) > 0.005) {
        controls.setPolarAngle(THREE.MathUtils.damp(currentPolar, Math.PI / 2, 8, delta));
        isDone = false;
      }
      
      controls.update();

      if (isDone) {
        setResetting(false);
        controls.setAzimuthalAngle(0);
        controls.setPolarAngle(Math.PI / 2);
        controls.update();
      }
    }
  });

  return null;
}

function useTextTexture(text, color, font = 'sans-serif') {
  const canvasRef = useRef(document.createElement('canvas'));
  const textureRef = useRef(new THREE.CanvasTexture(canvasRef.current));
  
  useEffect(() => {
    const canvas = canvasRef.current;
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, 1024, 1024);
    
    if (text) {
      ctx.font = `bold 180px ${font}`;
      ctx.fillStyle = color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, 512, 512);
    }
    
    const tex = textureRef.current;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 16;
    tex.needsUpdate = true;
    
  }, [text, color, font]);
  
  useEffect(() => {
    return () => {
      textureRef.current.dispose();
    };
  }, []);
  
  return textureRef.current;
}

function TextDecalCanvas({ text, color, font, pos, rot, scale, angle = 0, flipX = false }) {
  const texture = useTextTexture(text, color, font);
  
  useEffect(() => {
    if (texture) {
      texture.wrapS = THREE.RepeatWrapping;
      texture.repeat.x = flipX ? -1 : 1;
      texture.center.set(0.5, 0.5);
      texture.needsUpdate = true;
    }
  }, [texture, flipX]);

  const finalRot = [rot[0], rot[1], rot[2] + angle];
  
  return (
    <Decal position={pos} rotation={finalRot} scale={scale} depthTest={true}>
      <meshStandardMaterial map={texture} transparent polygonOffset polygonOffsetFactor={-2} />
    </Decal>
  );
}

function FullDesignDecal({ url, side = 'front', scale = 0.38, flipX = false }) {
  const texture = useTexture(url);

  useEffect(() => {
    if (texture) {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = 16;
      texture.wrapS = THREE.RepeatWrapping;
      texture.repeat.x = flipX ? -1 : 1;
      texture.center.set(0.5, 0.5);
      texture.needsUpdate = true;
    }
  }, [texture, flipX]);

  const isFront = side === 'front';
  const position = isFront ? [0, 0.02, 0.15] : [0, 0.02, -0.15];
  const rotation = isFront ? [0, 0, 0] : [0, Math.PI, 0];

  return (
    <Decal position={position} rotation={rotation} scale={[scale, scale * 1.1, 0.3]} depthTest={true}>
      <meshStandardMaterial map={texture} transparent polygonOffset polygonOffsetFactor={-1} />
    </Decal>
  );
}

function ShirtModel({ 
  color, logoImage, patternFrontImage, patternBackImage, viewMode, onMeshClick, 
  decalPos, decalRot, logoScale, patternFrontScale, patternBackScale, logoRotation, patternFrontRotation, patternBackRotation, logoFlipX, patternFrontFlipX, patternBackFlipX,
  textValue, textColor, textFont, textPos, textRot, textScale, textRotation, textFlipX,
  fullDesignFront, fullDesignBack, fullDesignFrontScale, fullDesignBackScale, fullDesignFrontFlipX, fullDesignBackFlipX
}) {
  const { nodes, materials } = useGLTF('/shirt_baked.glb');
  const groupRef = useRef();

  useFrame((state, delta) => {
    if (groupRef.current) {
      const targetRotation = viewMode === 'back' ? Math.PI : 0;
      groupRef.current.rotation.y = THREE.MathUtils.damp(groupRef.current.rotation.y, targetRotation, 4, delta);
    }
  });

  return (
    <group ref={groupRef} position={[0, 0.2, 0]} scale={4}>
      {Object.values(nodes).filter(n => n.type === 'Mesh').map((node, i) => (
        <group key={i}>
          <mesh 
            castShadow 
            receiveShadow 
            geometry={node.geometry} 
            material={node.material} 
            material-color={new THREE.Color(color).convertSRGBToLinear()}
            material-aoMapIntensity={0.25}
            onPointerDown={onMeshClick}
            dispose={null}
          >
             {i === 0 && logoImage && <LogoDecal url={logoImage} pos={decalPos} rot={decalRot} scale={logoScale} angle={logoRotation} flipX={logoFlipX} />}
             {i === 0 && textValue !== '' && <TextDecalCanvas text={textValue} color={textColor} font={textFont} pos={textPos} rot={textRot} scale={textScale} angle={textRotation} flipX={textFlipX} />}
             {i === 0 && patternFrontImage && <PatternDecal url={patternFrontImage} tileScale={patternFrontScale} rotAngle={patternFrontRotation} flipX={patternFrontFlipX} position={[0, 0, 0.15]} rotation={[0, 0, 0]} depth={0.3} />}
             {i === 0 && patternBackImage && <PatternDecal url={patternBackImage} tileScale={patternBackScale} rotAngle={patternBackRotation} flipX={patternBackFlipX} position={[0, 0, -0.15]} rotation={[0, Math.PI, 0]} depth={0.3} />}
             {i === 0 && fullDesignFront && <FullDesignDecal url={fullDesignFront} side="front" scale={fullDesignFrontScale} flipX={fullDesignFrontFlipX} />}
             {i === 0 && fullDesignBack && <FullDesignDecal url={fullDesignBack} side="back" scale={fullDesignBackScale} flipX={fullDesignBackFlipX} />}
          </mesh>
        </group>
      ))}
    </group>
  );
}

// Preload the model
useGLTF.preload('/shirt_baked.glb');

export default function Design3D() {
  const [color, setColor] = useState('#111111');
  const [logoImage, setLogoImage] = useState(null);
  const [patternFrontImage, setPatternFrontImage] = useState(null);
  const [patternBackImage, setPatternBackImage] = useState(null);
  const [activeTab, setActiveTab] = useState('color');
  const [uploadMode, setUploadMode] = useState('logo');
  const [viewMode, setViewMode] = useState('front');
  const [resetTrigger, setResetTrigger] = useState(0);
  const [decalPos, setDecalPos] = useState([-0.08, 0.08, 0.12]);
  const [decalRot, setDecalRot] = useState([0, 0, 0]);
  const [logoScale, setLogoScale] = useState(0.12);
  const [logoRotation, setLogoRotation] = useState(0);
  const [logoFlipX, setLogoFlipX] = useState(false);
  const [patternFrontScale, setPatternFrontScale] = useState(1);
  const [patternBackScale, setPatternBackScale] = useState(1);
  const [patternFrontRotation, setPatternFrontRotation] = useState(0);
  const [patternBackRotation, setPatternBackRotation] = useState(0);
  const [patternFrontFlipX, setPatternFrontFlipX] = useState(false);
  const [patternBackFlipX, setPatternBackFlipX] = useState(false);

  // Full design (artwork only) states
  const [fullDesignFront, setFullDesignFront] = useState(null);
  const [fullDesignBack, setFullDesignBack] = useState(null);
  const [fullDesignFrontScale, setFullDesignFrontScale] = useState(0.38);
  const [fullDesignBackScale, setFullDesignBackScale] = useState(0.38);
  const [fullDesignFrontFlipX, setFullDesignFrontFlipX] = useState(false);
  const [fullDesignBackFlipX, setFullDesignBackFlipX] = useState(false);

  // Extractor Modal (Background Remover & Cropper) State
  const [extractorModal, setExtractorModal] = useState({
    isOpen: false,
    imageSrc: null,
    targetType: 'logo', // 'logo', 'designFront', 'designBack'
  });

  const openExtractor = (imageSrc, targetType) => {
    if (!imageSrc) return;
    setExtractorModal({
      isOpen: true,
      imageSrc,
      targetType,
    });
  };

  const handleApplyExtractedDesign = (extractedDataUrl) => {
    if (extractorModal.targetType === 'logo') {
      setLogoImage(extractedDataUrl);
    } else if (extractorModal.targetType === 'designFront') {
      setFullDesignFront(extractedDataUrl);
    } else if (extractorModal.targetType === 'designBack') {
      setFullDesignBack(extractedDataUrl);
    }
  };

  // Text features
  const [textValue, setTextValue] = useState('');
  const [textColor, setTextColor] = useState('#ffffff');
  const [textFont, setTextFont] = useState('sans-serif');
  const [textPos, setTextPos] = useState([0.08, 0.08, 0.12]);
  const [textRot, setTextRot] = useState([0, 0, 0]);
  const [textScale, setTextScale] = useState(0.2);
  const [textRotation, setTextRotation] = useState(0);
  const [textFlipX, setTextFlipX] = useState(false);

  // Gemini AI Studio States
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiStyle, setAiStyle] = useState('streetwear');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [generatedAIData, setGeneratedAIData] = useState(null);
  const [aiError, setAiError] = useState('');
  const [aiSubTab, setAiSubTab] = useState('generate'); // 'generate' | 'stylist'
  const [aiCritique, setAiCritique] = useState(null);
  const [isCritiquing, setIsCritiquing] = useState(false);
  const [showGeminiKeyModal, setShowGeminiKeyModal] = useState(false);

  const handleGenerateAIDesign = async () => {
    if (!getGeminiApiKey()) {
      setShowGeminiKeyModal(true);
      return;
    }
    if (!aiPrompt.trim()) {
      setAiError('Silakan ketik ide konsep desain terlebih dahulu.');
      return;
    }
    setIsGeneratingAI(true);
    setAiError('');
    try {
      const result = await generateGraphicWithGemini(aiPrompt.trim(), aiStyle);
      setGeneratedAIData(result);
    } catch (err) {
      console.error('AI Generation Error:', err);
      setAiError(err.message || 'Gagal menghasilkan desain dengan Gemini.');
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleApplyAIGeneratedToShirt = () => {
    if (!generatedAIData?.dataUrl) return;
    setFullDesignFront(generatedAIData.dataUrl);
    setUploadMode('designFront');
    if (generatedAIData.suggestedShirtColor) {
      setColor(generatedAIData.suggestedShirtColor);
    }
  };

  const handleRunAICritique = async () => {
    if (!getGeminiApiKey()) {
      setShowGeminiKeyModal(true);
      return;
    }
    setIsCritiquing(true);
    setAiError('');
    try {
      const title = generatedAIData?.title || (logoImage ? 'Custom Graphic' : 'Kaos Distro');
      const critique = await getOutfitFashionCritique(color, title);
      setAiCritique(critique);
    } catch (err) {
      console.error('AI Critique Error:', err);
      setAiError(err.message || 'Gagal menganalisis harmoni warna.');
    } finally {
      setIsCritiquing(false);
    }
  };
  
  const saveDesign = useStore(state => state.saveDesign);
  const navigate = useNavigate();

  const handleMeshClick = (e) => {
    e.stopPropagation();
    const localPoint = e.object.worldToLocal(e.point.clone());
    const n = e.face.normal.clone();
    const target = new THREE.Vector3().copy(localPoint).sub(n);
    const dummy = new THREE.Object3D();
    dummy.position.copy(localPoint);
    dummy.lookAt(target);

    if (activeTab === 'logo' && uploadMode === 'logo' && logoImage) {
      setDecalPos([localPoint.x, localPoint.y, localPoint.z]);
      setDecalRot([dummy.rotation.x, dummy.rotation.y, dummy.rotation.z]);
    } else if (activeTab === 'text' && textValue) {
      setTextPos([localPoint.x, localPoint.y, localPoint.z]);
      setTextRot([dummy.rotation.x, dummy.rotation.y, dummy.rotation.z]);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setLogoImage(url);
      openExtractor(url, 'logo');
    }
  };

  const handlePatternFrontUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPatternFrontImage(URL.createObjectURL(file));
    }
  };
  const handlePatternBackUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPatternBackImage(URL.createObjectURL(file));
    }
  };

  const handleFullDesignFrontUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setFullDesignFront(url);
      openExtractor(url, 'designFront');
    }
  };
  const handleFullDesignBackUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setFullDesignBack(url);
      openExtractor(url, 'designBack');
    }
  };

  const handleSave = () => {
    const designId = `DSN-${Math.floor(Math.random() * 10000)}`;
    saveDesign({
      id: designId,
      color,
      logoImage,
      patternFrontImage, patternBackImage,
      fullDesignFront, fullDesignBack,
      decalPos,
      decalRot,
      logoScale,
      logoRotation,
      logoFlipX,
      patternFrontScale, patternBackScale,
      patternFrontRotation, patternBackRotation,
      patternFrontFlipX, patternBackFlipX,
      fullDesignFrontScale, fullDesignBackScale,
      fullDesignFrontFlipX, fullDesignBackFlipX,
      textValue,
      textColor,
      textPos,
      textRot,
      textScale,
      textRotation,
      textFlipX,
      sleeve: 'short'
    });
    alert(`Desain berhasil disimpan dengan ID: ${designId}. Silakan lanjut ke form pemesanan.`);
    navigate('/order', { state: { designId } });
  };

  const colors = [
    '#e02424', '#f29111', '#fce914', '#d2ef24', '#70c538', '#319f2a',
    '#8c11c5', '#6711f2', '#2a6bdc', '#1cc1bc', '#40d69f', '#000000',
    '#4b5563', '#9ca3af', '#ffffff'
  ];

  return (
    <div className="fixed inset-0 z-[100] bg-[#e5e5e5] overflow-hidden flex items-center justify-center">
      
      {/* 3D Canvas */}
      <div className="absolute inset-0">
        <Canvas shadows camera={{ position: [0, 0, 5.5], fov: 45 }}>
          <ambientLight intensity={0.5} />
          <spotLight position={[5, 5, 5]} angle={0.15} penumbra={1} intensity={1} castShadow />
          <directionalLight position={[-5, 5, -5]} intensity={0.7} />
          <Environment preset="city" />
          <Suspense fallback={null}>
            <CameraController resetTrigger={resetTrigger} />
            <ShirtModel 
              color={color} 
              logoImage={logoImage} 
              patternFrontImage={patternFrontImage}
              patternBackImage={patternBackImage}
              viewMode={viewMode} 
              onMeshClick={handleMeshClick}
              decalPos={decalPos}
              decalRot={decalRot}
              logoScale={logoScale}
              patternFrontScale={patternFrontScale}
              patternBackScale={patternBackScale}
              logoRotation={logoRotation * (Math.PI / 180)}
              patternFrontRotation={patternFrontRotation * (Math.PI / 180)}
              patternBackRotation={patternBackRotation * (Math.PI / 180)}
              logoFlipX={logoFlipX}
              patternFrontFlipX={patternFrontFlipX}
              patternBackFlipX={patternBackFlipX}
              textValue={textValue}
              textColor={textColor}
              textFont={textFont}
              textPos={textPos}
              textRot={textRot}
              textScale={textScale}
              textRotation={textRotation * (Math.PI / 180)}
              textFlipX={textFlipX}
              fullDesignFront={fullDesignFront}
              fullDesignBack={fullDesignBack}
              fullDesignFrontScale={fullDesignFrontScale}
              fullDesignBackScale={fullDesignBackScale}
              fullDesignFrontFlipX={fullDesignFrontFlipX}
              fullDesignBackFlipX={fullDesignBackFlipX}
            />
          </Suspense>
          <ContactShadows position={[0, -1.8, 0]} opacity={0.5} scale={10} blur={2} far={3} />
          <OrbitControls makeDefault enablePan={false} minPolarAngle={Math.PI / 4} maxPolarAngle={Math.PI / 2} />
        </Canvas>
      </div>

      {/* Top Right Controls */}
      <div className="absolute top-6 right-6 flex items-center gap-4 z-10">
        <button onClick={handleSave} className="bg-[#aa3bff] hover:bg-[#9228e6] text-white px-6 py-2.5 rounded-lg font-bold shadow-lg shadow-[#aa3bff]/30 transition-colors">
          Simpan Desain
        </button>
        <button onClick={() => navigate(-1)} className="bg-gray-900 hover:bg-black text-white px-6 py-2.5 rounded-lg font-bold shadow-lg transition-colors flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Kembali
        </button>
      </div>

      {/* Left Toolbar */}
      <div className="absolute left-6 top-1/2 -translate-y-1/2 flex gap-4 z-10">
        {/* Sidebar Tools */}
        <div className="bg-white/80 backdrop-blur-xl p-3 rounded-2xl shadow-xl border border-white/50 flex flex-col gap-4">
          <button onClick={() => setActiveTab('color')} className={`p-3 rounded-xl transition-all ${activeTab === 'color' ? 'bg-gray-100 shadow-inner' : 'hover:bg-white'}`}>
            <img src={swatchIcon} alt="Color" className={`w-8 h-8 ${activeTab === 'color' ? 'opacity-100' : 'opacity-60'}`} />
          </button>
          <button onClick={() => setActiveTab('logo')} className={`p-3 rounded-xl transition-all ${activeTab === 'logo' ? 'bg-gray-100 shadow-inner' : 'hover:bg-white'}`}>
            <img src={fileIcon} alt="Logo" className={`w-8 h-8 ${activeTab === 'logo' ? 'opacity-100' : 'opacity-60'}`} />
          </button>
          <button onClick={() => setActiveTab('text')} className={`p-3 rounded-xl transition-all ${activeTab === 'text' ? 'bg-gray-100 shadow-inner' : 'hover:bg-white'}`}>
            <img src={textIcon} alt="Text" className={`w-8 h-8 ${activeTab === 'text' ? 'opacity-100' : 'opacity-60'}`} />
          </button>
          <button onClick={() => setActiveTab('ai')} className={`p-3 rounded-xl transition-all ${activeTab === 'ai' ? 'bg-gray-100 shadow-inner' : 'hover:bg-white'}`}>
            <img src={aiIcon} alt="AI" className={`w-8 h-8 ${activeTab === 'ai' ? 'opacity-100' : 'opacity-60'}`} />
          </button>
        </div>

        {/* Expanded Panel */}
        <div className={`bg-white/85 backdrop-blur-xl ${activeTab === 'ai' ? 'w-80' : 'w-64'} max-h-[85vh] overflow-y-auto rounded-2xl shadow-xl border border-white/50 p-5 transition-all`}>
          {activeTab === 'color' && (
            <div className="flex flex-col gap-4">
              <div className="w-full">
                <HexColorPicker color={color} onChange={setColor} style={{ width: '100%', height: '180px' }} />
              </div>
              <div className="grid grid-cols-6 gap-2">
                {colors.map((c) => (
                  <button
                    key={c}
                    onClick={() => setColor(c)}
                    className={`w-full aspect-square rounded shadow-sm transition-transform hover:scale-110 border ${color === c ? 'border-gray-900 ring-2 ring-gray-900/20 scale-110' : 'border-black/10'}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          )}
          
          {activeTab === 'logo' && (
            <div className="space-y-4">
              <h3 className="font-bold text-gray-800">Unggah Gambar</h3>

              {/* Mode Selection Tabs */}
              <div className="grid grid-cols-2 gap-1 bg-gray-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setUploadMode('logo')}
                  className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${uploadMode === 'logo' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  Logo Dada
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMode('designFront')}
                  className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${uploadMode === 'designFront' ? 'bg-purple-600 shadow text-white' : 'text-gray-500 hover:text-purple-700'}`}
                >
                  Desain Depan
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMode('designBack')}
                  className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${uploadMode === 'designBack' ? 'bg-purple-600 shadow text-white' : 'text-gray-500 hover:text-purple-700'}`}
                >
                  Desain Belakang
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMode('patternFront')}
                  className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${uploadMode === 'patternFront' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  Pola Full
                </button>
              </div>

              {/* Tips for artwork upload */}
              <div className="bg-purple-50/80 border border-purple-200/80 rounded-xl p-2.5">
                <p className="text-[11px] text-purple-900 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" /> Tips Upload Desain:
                </p>
                <p className="text-[10px] text-purple-700 mt-0.5 leading-tight">
                  Punya foto kaos utuh? Gunakan tombol <strong>"Ekstrak Desain"</strong> setelah upload untuk menghapus kain kaos & mengambil gambarnya saja!
                </p>
              </div>

              {/* Upload: Logo Mode */}
              {uploadMode === 'logo' && (
                <div>
                  <label className="block border-2 border-dashed border-gray-300 rounded-xl p-5 text-center cursor-pointer hover:bg-gray-50 hover:border-gray-400 transition-colors">
                    <img src={fileIcon} alt="Upload" className="w-7 h-7 mx-auto mb-1.5 opacity-60" />
                    <span className="text-xs font-medium text-gray-700 block">Pilih Gambar Logo</span>
                    <span className="text-[10px] text-gray-400">PNG / JPG</span>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                  </label>

                  {logoImage && (
                    <div className="mt-3 space-y-2.5">
                      <div className="rounded-xl border border-gray-200 p-2 overflow-hidden shadow-sm flex items-center justify-center h-28"
                           style={{ background: 'repeating-conic-gradient(#e5e5e5 0% 25%, white 0% 50%) 0 0 / 12px 12px' }}>
                        <img src={logoImage} alt="Logo" className="max-h-full max-w-full object-contain" />
                      </div>

                      {/* Magic Extraction Button */}
                      <button
                        type="button"
                        onClick={() => openExtractor(logoImage, 'logo')}
                        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-2 px-3 rounded-xl text-xs shadow-md shadow-purple-500/20 flex items-center justify-center gap-1.5 transition-all"
                      >
                        <Sparkles className="w-3.5 h-3.5" /> Ekstrak Desain (Hapus Kaos)
                      </button>

                      <p className="text-[11px] text-blue-600 font-medium">
                        💡 Klik baju pada model 3D untuk memindahkan posisi logo
                      </p>

                      <div className="space-y-2 pt-1 border-t border-gray-100">
                        <div>
                          <label className="text-[11px] text-gray-600 font-medium flex justify-between">
                            <span>Ukuran Logo:</span>
                            <span className="font-bold">{Math.round(logoScale * 100)}%</span>
                          </label>
                          <input type="range" min="0.05" max="0.5" step="0.01" value={logoScale} onChange={(e) => setLogoScale(parseFloat(e.target.value))} className="w-full accent-purple-600" />
                        </div>
                        <div>
                          <label className="text-[11px] text-gray-600 font-medium flex justify-between">
                            <span>Putar Logo:</span>
                            <span className="font-bold">{logoRotation}°</span>
                          </label>
                          <input type="range" min="0" max="360" step="1" value={logoRotation} onChange={(e) => setLogoRotation(parseFloat(e.target.value))} className="w-full accent-purple-600" />
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" id="logoFlip" checked={logoFlipX} onChange={(e) => setLogoFlipX(e.target.checked)} className="accent-purple-600 w-4 h-4 rounded cursor-pointer" />
                          <label htmlFor="logoFlip" className="text-xs text-gray-700 font-medium cursor-pointer select-none">Flip Horizontal</label>
                        </div>
                      </div>

                      <button type="button" onClick={() => setLogoImage(null)} className="w-full text-xs text-red-500 hover:underline font-semibold pt-1">
                        Hapus Logo
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Upload: Full Design Front */}
              {uploadMode === 'designFront' && (
                <div>
                  <label className="block border-2 border-dashed border-purple-300 rounded-xl p-5 text-center cursor-pointer hover:bg-purple-50/50 transition-colors">
                    <img src={fileIcon} alt="Upload" className="w-7 h-7 mx-auto mb-1.5 opacity-60" />
                    <span className="text-xs font-semibold text-purple-700 block">Upload Desain Depan</span>
                    <span className="text-[10px] text-gray-400">Artwork dada depan kaos</span>
                    <input type="file" accept="image/*" onChange={handleFullDesignFrontUpload} className="hidden" />
                  </label>

                  {fullDesignFront && (
                    <div className="mt-3 space-y-2.5">
                      <div className="rounded-xl border border-gray-200 p-2 overflow-hidden shadow-sm flex items-center justify-center h-28"
                           style={{ background: 'repeating-conic-gradient(#e5e5e5 0% 25%, white 0% 50%) 0 0 / 12px 12px' }}>
                        <img src={fullDesignFront} alt="Design Front" className="max-h-full max-w-full object-contain" />
                      </div>

                      {/* Magic Extraction Button */}
                      <button
                        type="button"
                        onClick={() => openExtractor(fullDesignFront, 'designFront')}
                        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-2 px-3 rounded-xl text-xs shadow-md shadow-purple-500/20 flex items-center justify-center gap-1.5 transition-all"
                      >
                        <Sparkles className="w-3.5 h-3.5" /> Ekstrak Desain (Hapus Kaos)
                      </button>

                      <div className="space-y-2 pt-1 border-t border-gray-100">
                        <div>
                          <label className="text-[11px] text-gray-600 font-medium flex justify-between">
                            <span>Ukuran Desain Depan:</span>
                            <span className="font-bold">{Math.round(fullDesignFrontScale * 100)}%</span>
                          </label>
                          <input type="range" min="0.1" max="0.55" step="0.01" value={fullDesignFrontScale} onChange={(e) => setFullDesignFrontScale(parseFloat(e.target.value))} className="w-full accent-purple-600" />
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" id="fdFrontFlip" checked={fullDesignFrontFlipX} onChange={(e) => setFullDesignFrontFlipX(e.target.checked)} className="accent-purple-600 w-4 h-4 rounded cursor-pointer" />
                          <label htmlFor="fdFrontFlip" className="text-xs text-gray-700 font-medium cursor-pointer select-none">Flip Horizontal</label>
                        </div>
                      </div>

                      <button type="button" onClick={() => setFullDesignFront(null)} className="w-full text-xs text-red-500 hover:underline font-semibold pt-1">
                        Hapus Desain Depan
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Upload: Full Design Back */}
              {uploadMode === 'designBack' && (
                <div>
                  <label className="block border-2 border-dashed border-purple-300 rounded-xl p-5 text-center cursor-pointer hover:bg-purple-50/50 transition-colors">
                    <img src={fileIcon} alt="Upload" className="w-7 h-7 mx-auto mb-1.5 opacity-60" />
                    <span className="text-xs font-semibold text-purple-700 block">Upload Desain Belakang</span>
                    <span className="text-[10px] text-gray-400">Artwork punggung kaos</span>
                    <input type="file" accept="image/*" onChange={handleFullDesignBackUpload} className="hidden" />
                  </label>

                  {fullDesignBack && (
                    <div className="mt-3 space-y-2.5">
                      <div className="rounded-xl border border-gray-200 p-2 overflow-hidden shadow-sm flex items-center justify-center h-28"
                           style={{ background: 'repeating-conic-gradient(#e5e5e5 0% 25%, white 0% 50%) 0 0 / 12px 12px' }}>
                        <img src={fullDesignBack} alt="Design Back" className="max-h-full max-w-full object-contain" />
                      </div>

                      {/* Magic Extraction Button */}
                      <button
                        type="button"
                        onClick={() => openExtractor(fullDesignBack, 'designBack')}
                        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-2 px-3 rounded-xl text-xs shadow-md shadow-purple-500/20 flex items-center justify-center gap-1.5 transition-all"
                      >
                        <Sparkles className="w-3.5 h-3.5" /> Ekstrak Desain (Hapus Kaos)
                      </button>

                      <div className="space-y-2 pt-1 border-t border-gray-100">
                        <div>
                          <label className="text-[11px] text-gray-600 font-medium flex justify-between">
                            <span>Ukuran Desain Belakang:</span>
                            <span className="font-bold">{Math.round(fullDesignBackScale * 100)}%</span>
                          </label>
                          <input type="range" min="0.1" max="0.55" step="0.01" value={fullDesignBackScale} onChange={(e) => setFullDesignBackScale(parseFloat(e.target.value))} className="w-full accent-purple-600" />
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" id="fdBackFlip" checked={fullDesignBackFlipX} onChange={(e) => setFullDesignBackFlipX(e.target.checked)} className="accent-purple-600 w-4 h-4 rounded cursor-pointer" />
                          <label htmlFor="fdBackFlip" className="text-xs text-gray-700 font-medium cursor-pointer select-none">Flip Horizontal</label>
                        </div>
                      </div>

                      <button type="button" onClick={() => setFullDesignBack(null)} className="w-full text-xs text-red-500 hover:underline font-semibold pt-1">
                        Hapus Desain Belakang
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Upload: Pattern Mode */}
              {uploadMode === 'patternFront' && (
                <div>
                  <label className="block border-2 border-dashed border-gray-300 rounded-xl p-5 text-center cursor-pointer hover:bg-gray-50 transition-colors">
                    <img src={fileIcon} alt="Upload" className="w-7 h-7 mx-auto mb-1.5 opacity-60" />
                    <span className="text-xs font-medium text-gray-700 block">Pilih Pola Penuh</span>
                    <input type="file" accept="image/*" onChange={handlePatternFrontUpload} className="hidden" />
                  </label>

                  {patternFrontImage && (
                    <div className="mt-3 space-y-2.5">
                      <div className="rounded-xl border border-gray-200 p-2 overflow-hidden shadow-sm flex items-center justify-center h-28 bg-gray-50">
                        <img src={patternFrontImage} alt="Pattern Front" className="max-h-full max-w-full object-contain" />
                      </div>
                      <div className="space-y-2">
                        <div>
                          <label className="text-[11px] text-gray-600 font-medium">Skala Pola</label>
                          <input type="range" min="0.5" max="5" step="0.1" value={patternFrontScale} onChange={(e) => setPatternFrontScale(parseFloat(e.target.value))} className="w-full accent-gray-900" />
                        </div>
                        <div>
                          <label className="text-[11px] text-gray-600 font-medium">Putar Pola: {patternFrontRotation}°</label>
                          <input type="range" min="0" max="360" step="1" value={patternFrontRotation} onChange={(e) => setPatternFrontRotation(parseFloat(e.target.value))} className="w-full accent-gray-900" />
                        </div>
                        <div className="flex items-center gap-2">
                          <input type="checkbox" id="patternFrontFlip" checked={patternFrontFlipX} onChange={(e) => setPatternFrontFlipX(e.target.checked)} className="accent-gray-900 w-4 h-4 rounded cursor-pointer" />
                          <label htmlFor="patternFrontFlip" className="text-xs text-gray-700 font-medium cursor-pointer select-none">Flip</label>
                        </div>
                      </div>
                      <button type="button" onClick={() => setPatternFrontImage(null)} className="w-full text-xs text-red-500 hover:underline font-semibold pt-1">
                        Hapus Pola Depan
                      </button>
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

          {activeTab === 'text' && (
            <div className="space-y-4">
              <h3 className="font-bold text-gray-800">Tambahkan Teks</h3>
              
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-gray-600 font-medium">Teks Anda</label>
                  <input type="text" value={textValue} onChange={(e) => setTextValue(e.target.value)} placeholder="Ketik sesuatu..." className="w-full mt-1 p-2 border border-gray-300 rounded-lg text-sm" />
                </div>
                
                {textValue && (
                  <>
                    <p className="text-xs text-blue-600 font-medium flex items-center gap-1">
                      <span className="bg-blue-100 p-1 rounded-full w-4 h-4 inline-flex items-center justify-center text-[10px]">ℹ</span> 
                      Klik pada baju 3D untuk memindahkan posisi teks
                    </p>
                    
                    <div>
                      <label className="text-xs text-gray-600 font-medium mb-1 block">Jenis Font</label>
                      <select 
                        value={textFont} 
                        onChange={(e) => setTextFont(e.target.value)}
                        className="w-full text-sm border-gray-300 rounded-lg p-2 bg-white"
                      >
                        <option value="sans-serif">Sans Serif</option>
                        <option value="serif">Serif</option>
                        <option value="monospace">Monospace</option>
                        <option value="cursive">Cursive</option>
                        <option value="system-ui">System UI</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-gray-600 font-medium">Warna Teks</label>
                      <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="w-full h-8 mt-1 rounded cursor-pointer border-none" />
                    </div>

                    <div>
                      <label className="text-xs text-gray-600 font-medium">Ukuran Teks</label>
                      <input type="range" min="0.05" max="0.5" step="0.01" value={textScale} onChange={(e) => setTextScale(parseFloat(e.target.value))} className="w-full accent-gray-900" />
                    </div>

                    <div>
                      <label className="text-xs text-gray-600 font-medium">Putar Teks (Rotasi): {textRotation}°</label>
                      <input type="range" min="0" max="360" step="1" value={textRotation} onChange={(e) => setTextRotation(parseFloat(e.target.value))} className="w-full accent-gray-900" />
                    </div>

                    <div className="flex items-center gap-2">
                      <input type="checkbox" id="textFlip" checked={textFlipX} onChange={(e) => setTextFlipX(e.target.checked)} className="accent-gray-900 w-4 h-4 rounded cursor-pointer" />
                      <label htmlFor="textFlip" className="text-xs text-gray-600 font-medium cursor-pointer select-none">Flip</label>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="space-y-4">
              {/* AI Studio Header */}
              <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-blue-600 to-purple-600 text-white flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <h3 className="font-extrabold text-xs text-gray-900">Gemini Flash AI</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowGeminiKeyModal(true)}
                  className="text-[10px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-md"
                >
                  <Key className="w-3 h-3" /> {getGeminiApiKey() ? 'API Key OK' : 'Atur Key'}
                </button>
              </div>

              {/* Sub-tab Switcher */}
              <div className="grid grid-cols-2 gap-1 bg-gray-100 p-1 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setAiSubTab('generate')}
                  className={`py-1.5 rounded-lg transition-all ${aiSubTab === 'generate' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
                >
                  Buat Desain
                </button>
                <button
                  type="button"
                  onClick={() => setAiSubTab('stylist')}
                  className={`py-1.5 rounded-lg transition-all ${aiSubTab === 'stylist' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
                >
                  Harmoni Warna
                </button>
              </div>

              {/* Sub-tab 1: AI Design Generator */}
              {aiSubTab === 'generate' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">
                      Deskripsikan Ide Desain:
                    </label>
                    <textarea
                      rows={3}
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                      placeholder="Contoh: Streetwear logo Japanese typography skull neon cyber..."
                      className="w-full text-xs p-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-purple-500 resize-none bg-gray-50/50"
                    />
                  </div>

                  {/* Preset prompt pills */}
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      'Streetwear Cyberpunk',
                      'Vintage Coffee 1980',
                      'Minimalist Mountain',
                      'Bandung City Apparel'
                    ].map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => setAiPrompt(tag)}
                        className="text-[10px] bg-purple-50 hover:bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium transition-colors"
                      >
                        +{tag}
                      </button>
                    ))}
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-700 block mb-1">
                      Gaya Visual:
                    </label>
                    <select
                      value={aiStyle}
                      onChange={(e) => setAiStyle(e.target.value)}
                      className="w-full text-xs p-2 rounded-xl border border-gray-300 bg-white"
                    >
                      <option value="streetwear">Streetwear Distro</option>
                      <option value="vintage">Vintage Retro 90s</option>
                      <option value="minimalist">Minimalist Emblem / Badge</option>
                      <option value="typography">Bold Typography Art</option>
                      <option value="cyberpunk">Cyberpunk Futuristic</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerateAIDesign}
                    disabled={isGeneratingAI}
                    className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-extrabold text-xs shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {isGeneratingAI ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Gemini merancang grafis...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        Generate dengan Gemini Flash
                      </>
                    )}
                  </button>

                  {aiError && (
                    <div className="p-2 bg-red-50 text-red-600 rounded-lg text-[11px] flex items-center gap-1.5 border border-red-200">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{aiError}</span>
                    </div>
                  )}

                  {/* Result Card */}
                  {generatedAIData && (
                    <div className="mt-3 p-3 bg-purple-50/60 rounded-xl border border-purple-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-purple-900 truncate">
                          {generatedAIData.title}
                        </span>
                        <span className="text-[10px] bg-purple-100 text-purple-700 font-bold px-1.5 py-0.5 rounded">
                          Hasil AI
                        </span>
                      </div>

                      <div className="rounded-lg border border-purple-200 p-2 overflow-hidden flex items-center justify-center h-28"
                           style={{ background: 'repeating-conic-gradient(#f1f5f9 0% 25%, #ffffff 0% 50%) 0 0 / 12px 12px' }}>
                        <img src={generatedAIData.dataUrl} alt="AI Design" className="max-h-full max-w-full object-contain drop-shadow" />
                      </div>

                      <p className="text-[10px] text-gray-600 leading-tight">
                        {generatedAIData.story}
                      </p>

                      <div className="pt-1 space-y-1.5">
                        <button
                          type="button"
                          onClick={handleApplyAIGeneratedToShirt}
                          className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-lg shadow-sm flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" /> Pasang ke Kaos 3D
                        </button>
                        
                        {generatedAIData.suggestedShirtColor && (
                          <button
                            type="button"
                            onClick={() => setColor(generatedAIData.suggestedShirtColor)}
                            className="w-full py-1.5 bg-white border border-purple-300 text-purple-800 font-semibold text-[11px] rounded-lg hover:bg-purple-50 flex items-center justify-center gap-1.5 transition-colors"
                          >
                            <span className="w-3 h-3 rounded-full border border-gray-300" style={{ backgroundColor: generatedAIData.suggestedShirtColor }} />
                            Terapkan Warna Kain Rekomendasi
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Sub-tab 2: AI Fashion Stylist */}
              {aiSubTab === 'stylist' && (
                <div className="space-y-3">
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Warna Kaos Saat Ini:</span>
                      <div className="flex items-center gap-1.5">
                        <span className="w-4 h-4 rounded-full border border-gray-300 shadow-xs" style={{ backgroundColor: color }} />
                        <span className="font-mono font-bold text-gray-800">{color}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRunAICritique}
                    disabled={isCritiquing}
                    className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {isCritiquing ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Gemini mengevaluasi harmoni...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        Analisis Harmoni Mode
                      </>
                    )}
                  </button>

                  {aiCritique && (
                    <div className="p-3 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-blue-900">{aiCritique.verdict}</span>
                        <span className="font-extrabold bg-blue-600 text-white px-2 py-0.5 rounded-full text-[11px]">
                          {aiCritique.harmonyScore}/100
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-700 leading-relaxed">
                        {aiCritique.feedback}
                      </p>
                      {aiCritique.recommendedPantColors && (
                        <div className="pt-1">
                          <span className="text-[10px] text-gray-500 font-semibold block mb-1">
                            Rekomendasi Celana / Bawahan:
                          </span>
                          <div className="flex gap-2">
                            {aiCritique.recommendedPantColors.map((hex, i) => (
                              <div key={i} className="flex items-center gap-1 text-[10px] bg-white px-2 py-0.5 rounded-md border border-gray-200">
                                <span className="w-3 h-3 rounded-full border border-gray-300" style={{ backgroundColor: hex }} />
                                <span className="font-mono">{hex}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

            </div>
          )}
        </div>
      </div>

      {/* Bottom Toolbar */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg flex gap-4">
        <button 
          onClick={() => { setViewMode('front'); setResetTrigger(r => r + 1); }}
          className={`p-2 rounded-full transition-all ${viewMode === 'front' ? 'bg-gray-100 ring-2 ring-gray-400' : 'hover:bg-gray-50'}`}
        >
          <img src={stylishTshirtIcon} alt="Front" className="w-8 h-8" />
        </button>
        <button 
          onClick={() => { setViewMode('back'); setResetTrigger(r => r + 1); }}
          className={`p-2 rounded-full transition-all ${viewMode === 'back' ? 'bg-gray-100 ring-2 ring-gray-400' : 'hover:bg-gray-50'}`}
        >
          <img src={logoTshirtIcon} alt="Back" className="w-8 h-8" />
        </button>
      </div>

      {/* Design Extractor & Background Remover Modal */}
      <DesignExtractorModal
        isOpen={extractorModal.isOpen}
        onClose={() => setExtractorModal({ ...extractorModal, isOpen: false })}
        originalImage={extractorModal.imageSrc}
        onApply={handleApplyExtractedDesign}
      />

      {/* Gemini API Key Configuration Modal */}
      <GeminiKeyModal
        isOpen={showGeminiKeyModal}
        onClose={() => setShowGeminiKeyModal(false)}
      />

    </div>
  );
}
