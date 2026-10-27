import { useState, Suspense, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows, useGLTF, useTexture, Decal } from '@react-three/drei';
import { ArrowLeft, Box, Save, Edit3, X } from 'lucide-react';
import { HexColorPicker } from "react-colorful";
import { useStore } from '../../store/useStore';
import * as THREE from 'three';

// Icons for tools
import swatchIcon from '../../assets/swatch.png';
import fileIcon from '../../assets/file.png';
import aiIcon from '../../assets/ai.png';
import logoTshirtIcon from '../../assets/logo-tshirt.png';
import stylishTshirtIcon from '../../assets/stylish-tshirt.png';
import textIcon from '../../assets/text.png';

// ----------------------------------------------------------------------
// 3D Components
// ----------------------------------------------------------------------


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

function CameraController({ resetTrigger }) {
  const { controls } = useThree();
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

function ShirtModel({ 
  color, logoImage, patternFrontImage, patternBackImage, viewMode, isEditing, onMeshClick, 
  decalPos, decalRot, logoScale, patternFrontScale, patternBackScale, logoRotation, patternFrontRotation, patternBackRotation, logoFlipX, patternFrontFlipX, patternBackFlipX,
  textValue, textColor, textFont, textPos, textRot, textScale, textRotation, textFlipX
}) {
  const { nodes } = useGLTF('/shirt_baked.glb');
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
          </mesh>
        </group>
      ))}
    </group>

  );
}

useGLTF.preload('/shirt_baked.glb');

// ----------------------------------------------------------------------
// Overlays & UI Components
// ----------------------------------------------------------------------

function MeasurementOverlay({ size }) {
  if (!size) return null;
  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10 transition-opacity duration-300">
      <div className="relative w-[360px] h-[480px] -mt-10">
         <div className="absolute top-[18%] left-[15%] right-[15%] flex items-center justify-center">
            <div className="h-px bg-white/50 w-full border-t-2 border-dashed border-white shadow-sm relative drop-shadow-md">
               <div className="absolute -top-1.5 -left-1 w-3 h-3 border-t-2 border-l-2 border-white transform -rotate-45"></div>
               <div className="absolute -top-1.5 -right-1 w-3 h-3 border-t-2 border-r-2 border-white transform rotate-45"></div>
               <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-white font-bold text-xs bg-purple-600/90 px-3 py-1 rounded-full shadow-lg backdrop-blur-sm whitespace-nowrap">LB: {size.lebarBahu} cm</span>
            </div>
         </div>
         <div className="absolute top-[38%] left-[22%] right-[22%] flex items-center justify-center">
            <div className="h-px bg-white/50 w-full border-t-2 border-dashed border-white shadow-sm relative drop-shadow-md">
               <div className="absolute -top-1.5 -left-1 w-3 h-3 border-t-2 border-l-2 border-white transform -rotate-45"></div>
               <div className="absolute -top-1.5 -right-1 w-3 h-3 border-t-2 border-r-2 border-white transform rotate-45"></div>
               <span className="absolute -top-8 left-1/2 -translate-x-1/2 text-white font-bold text-xs bg-green-600/90 px-3 py-1 rounded-full shadow-lg backdrop-blur-sm whitespace-nowrap">LD: {size.lebarDada} cm</span>
            </div>
         </div>
         <div className="absolute top-[20%] bottom-[10%] left-[35%] flex flex-col items-center justify-center">
            <div className="w-px bg-white/50 h-full border-l-2 border-dashed border-white shadow-sm relative drop-shadow-md">
               <div className="absolute -left-1.5 -top-1 w-3 h-3 border-t-2 border-l-2 border-white transform rotate-45"></div>
               <div className="absolute -left-1.5 -bottom-1 w-3 h-3 border-b-2 border-l-2 border-white transform -rotate-45"></div>
               <span className="absolute top-1/2 -left-20 -translate-y-1/2 text-white font-bold text-xs bg-blue-600/90 px-3 py-1 rounded-full shadow-lg backdrop-blur-sm whitespace-nowrap">PB: {size.panjangBadan} cm</span>
            </div>
         </div>
         <div className="absolute top-[28%] -right-[5%] w-[110px] transform rotate-[35deg]">
            <div className="w-full h-px bg-white/50 border-t-2 border-dashed border-white shadow-sm relative drop-shadow-md">
               <div className="absolute -top-1.5 -left-1 w-3 h-3 border-t-2 border-l-2 border-white transform -rotate-45"></div>
               <div className="absolute -top-1.5 -right-1 w-3 h-3 border-t-2 border-r-2 border-white transform rotate-45"></div>
               <span className="absolute -top-10 left-1/2 -translate-x-1/2 text-white font-bold text-xs bg-orange-600/90 px-3 py-1 rounded-full shadow-lg backdrop-blur-sm whitespace-nowrap transform -rotate-[35deg]">PL: {size.panjangLengan} cm</span>
            </div>
         </div>
      </div>
    </div>
  );
}

function CustomSizeDisplay({ size }) {
  if (!size) return null;
  return (
    <div className="space-y-2 text-sm">
      <div className="flex justify-between items-center bg-white px-2 py-1.5 rounded border border-gray-200">
        <div className="flex items-center gap-2 font-medium text-gray-600">
          <span className="bg-blue-100 text-blue-800 text-[10px] px-1.5 py-0.5 rounded font-bold">PB</span> Panjang Badan
        </div>
        <span className="font-bold text-gray-900">{size.panjangBadan} cm</span>
      </div>
      <div className="flex justify-between items-center bg-white px-2 py-1.5 rounded border border-gray-200">
        <div className="flex items-center gap-2 font-medium text-gray-600">
          <span className="bg-green-100 text-green-800 text-[10px] px-1.5 py-0.5 rounded font-bold">LD</span> Lebar Dada
        </div>
        <span className="font-bold text-gray-900">{size.lebarDada} cm</span>
      </div>
      <div className="flex justify-between items-center bg-white px-2 py-1.5 rounded border border-gray-200">
        <div className="flex items-center gap-2 font-medium text-gray-600">
          <span className="bg-orange-100 text-orange-800 text-[10px] px-1.5 py-0.5 rounded font-bold">PL</span> Panjang Lengan
        </div>
        <span className="font-bold text-gray-900">{size.panjangLengan} cm</span>
      </div>
      <div className="flex justify-between items-center bg-white px-2 py-1.5 rounded border border-gray-200">
        <div className="flex items-center gap-2 font-medium text-gray-600">
          <span className="bg-purple-100 text-purple-800 text-[10px] px-1.5 py-0.5 rounded font-bold">LB</span> Lebar Bahu
        </div>
        <span className="font-bold text-gray-900">{size.lebarBahu} cm</span>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// Main Page Component
// ----------------------------------------------------------------------

export default function AdminDesignPreview() {
  const { id } = useParams(); // Order ID
  const navigate = useNavigate();
  
  const orders = useStore(state => state.orders);
  const designs = useStore(state => state.designs);
  const updateDesign = useStore(state => state.updateDesign);
  const currentUser = useStore(state => state.currentUser);
  const isAdmin = currentUser?.role === 'admin';
  
  const order = orders.find(o => o.id === id);
  const originalDesign = designs.find(d => d.id === order?.designId);

  // -- View Mode States --
  const [showMeasurements, setShowMeasurements] = useState(true);
  const [selectedItemIdx, setSelectedItemIdx] = useState(0);
  const [isEditing, setIsEditing] = useState(false);

  // -- Edit Mode States (initialized from originalDesign) --
  const [color, setColor] = useState('#111111');
  const [logoImage, setLogoImage] = useState(null);
  const [patternFrontImage, setPatternFrontImage] = useState(null);
  const [patternBackImage, setPatternBackImage] = useState(null);
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
  const [textValue, setTextValue] = useState('');
  const [textColor, setTextColor] = useState('#ffffff');
  const [textFont, setTextFont] = useState('sans-serif');
  const [textPos, setTextPos] = useState([0.08, 0.08, 0.12]);
  const [textRot, setTextRot] = useState([0, 0, 0]);
  const [textScale, setTextScale] = useState(0.2);
  const [textRotation, setTextRotation] = useState(0);
  const [textFlipX, setTextFlipX] = useState(false);
  
  // Editor UI states
  const [activeTab, setActiveTab] = useState('color');
  const [uploadMode, setUploadMode] = useState('logo');
  const [viewMode, setViewMode] = useState('front');
  const [resetTrigger, setResetTrigger] = useState(0);

  // Initialize edit states when design is found
  useEffect(() => {
    if (originalDesign && !isEditing) {
      setColor(originalDesign.color || '#111111');
      setLogoImage(originalDesign.logoImage || null);
      setPatternFrontImage(originalDesign.patternFrontImage || null);
      setPatternBackImage(originalDesign.patternBackImage || null);
      setPatternFrontScale(originalDesign.patternFrontScale || 1);
      setPatternBackScale(originalDesign.patternBackScale || 1);
      setPatternFrontRotation(originalDesign.patternFrontRotation || 0);
      setPatternBackRotation(originalDesign.patternBackRotation || 0);
      setPatternFrontFlipX(originalDesign.patternFrontFlipX || false);
      setPatternBackFlipX(originalDesign.patternBackFlipX || false);
      setTextValue(originalDesign.textValue || '');
      setTextColor(originalDesign.textColor || '#ffffff');
      setTextFont(originalDesign.textFont || 'sans-serif');
      setTextPos(originalDesign.textPos || [0.08, 0.08, 0.12]);
      setTextRot(originalDesign.textRot || [0, 0, 0]);
      setTextScale(originalDesign.textScale || 0.2);
      setTextRotation(originalDesign.textRotation || 0);
      setTextFlipX(originalDesign.textFlipX || false);
    }
  }, [originalDesign, isEditing]);

  if (!order || !originalDesign) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <Box className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-700">Desain Tidak Ditemukan</h2>
        <p className="text-gray-500 mb-6">Data pesanan atau desain 3D tidak tersedia.</p>
        <button onClick={() => navigate(isAdmin ? '/admin/orders' : '/status')} className="text-blue-600 font-bold hover:underline">
          Kembali
        </button>
      </div>
    );
  }

  const handleMeshClick = (e) => {
    if (!isEditing) return;
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

  const handleSaveEdit = () => {
    updateDesign(originalDesign.id, {
      color,
      logoImage,
      patternFrontImage, patternBackImage,
      decalPos,
      decalRot,
      logoScale,
      logoRotation,
      logoFlipX,
      patternFrontScale, patternBackScale,
      patternFrontRotation, patternBackRotation,
      patternFrontFlipX, patternBackFlipX,
      textValue,
      textColor,
      textFont,
      textPos,
      textRot,
      textScale,
      textRotation,
      textFlipX,
      isEditedByAdmin: true,
      lastEditedAt: new Date().toISOString(),
    });
    alert('Perubahan desain berhasil disimpan!');
    setIsEditing(false);
  };

  const colors = [
    '#e02424', '#f29111', '#fce914', '#d2ef24', '#70c538', '#319f2a',
    '#8c11c5', '#6711f2', '#2a6bdc', '#1cc1bc', '#40d69f', '#000000',
    '#4b5563', '#9ca3af', '#ffffff'
  ];

  let currentSize = null;
  if (order.items && order.items[selectedItemIdx]) {
    if (order.items[selectedItemIdx].type === 'custom') {
      currentSize = order.items[selectedItemIdx].customSize;
    }
  } else if (order.sizeType === 'custom') {
    currentSize = order.customSize;
  }

  return (
    <div className="fixed inset-0 z-[100] bg-gray-900 overflow-hidden flex flex-col">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-md border-b border-white/20 p-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-4 text-white">
          <button 
            onClick={() => {
              if (isEditing) {
                if (window.confirm("Batal mengedit? Perubahan tidak akan disimpan.")) {
                  setIsEditing(false);
                }
              } else {
                navigate(isAdmin ? '/admin/orders' : '/status');
              }
            }} 
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
            title="Kembali"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-bold text-lg leading-tight">Preview Desain 3D</h1>
            <p className="text-xs text-gray-300">Pesanan: {order.id} {isAdmin && `• Customer: ${order.customerName}`}</p>
          </div>
        </div>
        
        {/* Edit Mode Toggle / Save Button */}
        <div className="flex items-center gap-3">
          {!isEditing && !isAdmin && (
             <div className="text-white text-sm bg-white/10 px-4 py-2 rounded-full border border-white/20 font-medium">
               Mode: Preview Customer
             </div>
          )}
          {isAdmin && (
            isEditing ? (
              <>
                <button 
                  onClick={() => setIsEditing(false)}
                  className="text-white text-sm bg-red-500/20 hover:bg-red-500/40 px-4 py-2 rounded-full border border-red-500/50 transition-colors flex items-center gap-2 font-medium"
                >
                  <X className="w-4 h-4" /> Batal
                </button>
                <button 
                  onClick={handleSaveEdit}
                  className="text-white text-sm bg-[#aa3bff] hover:bg-[#9228e6] px-5 py-2 rounded-full shadow-lg shadow-[#aa3bff]/30 transition-colors flex items-center gap-2 font-bold"
                >
                  <Save className="w-4 h-4" /> Simpan Perubahan
                </button>
              </>
            ) : (
              <button 
                onClick={() => {
                  setShowMeasurements(false); // Hide measurements while editing
                  setIsEditing(true);
                }}
                className="text-white text-sm bg-white/10 hover:bg-white/20 px-5 py-2 rounded-full border border-white/30 transition-colors flex items-center gap-2 font-bold"
              >
                <Edit3 className="w-4 h-4" /> Edit Desain
              </button>
            )
          )}
        </div>
      </div>

      {/* 3D Canvas */}
      <div className="flex-1 relative">
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
              isEditing={isEditing}
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
            />
          </Suspense>
          <ContactShadows position={[0, -1.8, 0]} opacity={0.5} scale={10} blur={2} far={3} />
          <OrbitControls makeDefault enablePan={false} minPolarAngle={Math.PI / 4} maxPolarAngle={Math.PI / 2} />
        </Canvas>
        
        {/* Overlay Instructions */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md text-white px-6 py-2 rounded-full text-sm font-medium shadow-xl pointer-events-none z-20">
          {isEditing ? "Klik pada baju untuk memindahkan logo/teks" : "Gunakan mouse (klik & geser) untuk memutar baju"}
        </div>

        {/* View Mode Controls (Bottom) */}
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md px-6 py-3 rounded-full shadow-lg flex gap-4 z-20 border border-white/20">
          <button 
            onClick={() => { setViewMode('front'); setResetTrigger(r => r + 1); }}
            className={`p-2 rounded-full transition-all ${viewMode === 'front' ? 'bg-white/30 ring-2 ring-white/50' : 'hover:bg-white/20'}`}
          >
            <img src={stylishTshirtIcon} alt="Front" className="w-8 h-8 invert" />
          </button>
          <button 
            onClick={() => { setViewMode('back'); setResetTrigger(r => r + 1); }}
            className={`p-2 rounded-full transition-all ${viewMode === 'back' ? 'bg-white/30 ring-2 ring-white/50' : 'hover:bg-white/20'}`}
          >
            <img src={logoTshirtIcon} alt="Back" className="w-8 h-8 invert" />
          </button>
        </div>

        {/* Measurement Arrows Overlay (Only in Preview Mode) */}
        {!isEditing && showMeasurements && currentSize && (
          <MeasurementOverlay size={currentSize} />
        )}

        {/* Edit Toolbar (Left Panel) */}
        {isEditing && (
          <div className="absolute left-6 top-1/2 -translate-y-1/2 flex gap-4 z-20">
            {/* Sidebar Tools */}
            <div className="bg-white/90 backdrop-blur-xl p-3 rounded-2xl shadow-xl border border-gray-200 flex flex-col gap-4">
              <button onClick={() => setActiveTab('color')} className={`p-3 rounded-xl transition-all ${activeTab === 'color' ? 'bg-gray-100 shadow-inner' : 'hover:bg-gray-50'}`}>
                <img src={swatchIcon} alt="Color" className={`w-8 h-8 ${activeTab === 'color' ? 'opacity-100' : 'opacity-60'}`} />
              </button>
              <button onClick={() => setActiveTab('logo')} className={`p-3 rounded-xl transition-all ${activeTab === 'logo' ? 'bg-gray-100 shadow-inner' : 'hover:bg-gray-50'}`}>
                <img src={fileIcon} alt="Logo" className={`w-8 h-8 ${activeTab === 'logo' ? 'opacity-100' : 'opacity-60'}`} />
              </button>
              <button onClick={() => setActiveTab('text')} className={`p-3 rounded-xl transition-all ${activeTab === 'text' ? 'bg-gray-100 shadow-inner' : 'hover:bg-gray-50'}`}>
                <img src={textIcon} alt="Text" className={`w-8 h-8 ${activeTab === 'text' ? 'opacity-100' : 'opacity-60'}`} />
              </button>
            </div>

            {/* Expanded Panel */}
            <div className="bg-white/95 backdrop-blur-xl w-64 rounded-2xl shadow-xl border border-gray-200 p-5 max-h-[80vh] overflow-y-auto">
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
                  
                  <div className="flex bg-gray-100 p-1 rounded-xl">
                    <button 
                      onClick={() => setUploadMode('logo')} 
                      className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-all ${uploadMode === 'logo' ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}
                    >
                      Logo
                    </button>
                    <button 
                      onClick={() => setUploadMode('patternFront')} 
                      className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-all ${uploadMode === 'patternFront' ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}
                    >
                      Pola Depan
                    </button>
                    <button 
                      onClick={() => setUploadMode('patternBack')} 
                      className={`flex-1 py-1.5 text-sm font-medium rounded-lg transition-all ${uploadMode === 'patternBack' ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}
                    >
                      Pola Belakang
                    </button>
                  </div>

                  {uploadMode === 'logo' ? (
                    <>
                      <label className="block border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors">
                        <img src={fileIcon} alt="Upload" className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <span className="text-sm font-medium text-gray-600">Pilih Gambar Logo</span>
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                      </label>
                      {logoImage && (
                        <div className="mt-4">
                          <p className="text-xs text-blue-600 mb-2 font-medium flex items-center gap-1">
                            <span className="bg-blue-100 p-1 rounded-full w-4 h-4 inline-flex items-center justify-center text-[10px]">ℹ</span> 
                            Klik baju untuk menggeser logo
                          </p>
                          <img src={logoImage} alt="Logo" className="w-full rounded-lg border bg-gray-50 object-contain h-24 p-2" />
                          <div className="mt-3 space-y-3">
                            <div>
                              <label className="text-xs text-gray-600 font-medium">Ukuran Logo</label>
                              <input type="range" min="0.05" max="0.5" step="0.01" value={logoScale} onChange={(e) => setLogoScale(parseFloat(e.target.value))} className="w-full accent-gray-900" />
                            </div>
                            <div>
                              <label className="text-xs text-gray-600 font-medium">Putar Logo (Rotasi): {logoRotation}°</label>
                              <input type="range" min="0" max="360" step="1" value={logoRotation} onChange={(e) => setLogoRotation(parseFloat(e.target.value))} className="w-full accent-gray-900" />
                            </div>
                            <div className="flex items-center gap-2">
                              <input type="checkbox" id="logoFlip" checked={logoFlipX} onChange={(e) => setLogoFlipX(e.target.checked)} className="accent-gray-900 w-4 h-4 rounded cursor-pointer" />
                              <label htmlFor="logoFlip" className="text-xs text-gray-600 font-medium cursor-pointer select-none">Flip</label>
                            </div>
                          </div>
                          <button onClick={() => setLogoImage(null)} className="w-full mt-2 text-xs text-red-500 hover:underline font-bold">Hapus Logo</button>
                        </div>
                      )}
                    </>
                  ) : uploadMode === 'patternFront' ? (
                    <>
                      <label className="block border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors">
                        <img src={fileIcon} alt="Upload" className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <span className="text-sm font-medium text-gray-600">Pilih Pola Depan</span>
                        <input type="file" accept="image/*" onChange={handlePatternFrontUpload} className="hidden" />
                      </label>
                      {patternFrontImage && (
                        <div className="mt-4">
                          <img src={patternFrontImage} alt="Pattern Front" className="w-full rounded-lg border bg-gray-50 object-contain h-24 p-2" />
                          <div className="mt-3 space-y-3">
                            <div>
                              <label className="text-xs text-gray-600 font-medium">Skala Pola Depan</label>
                              <input type="range" min="0.5" max="5" step="0.1" value={patternFrontScale} onChange={(e) => setPatternFrontScale(parseFloat(e.target.value))} className="w-full accent-gray-900" />
                            </div>
                            <div>
                              <label className="text-xs text-gray-600 font-medium">Putar Pola: {patternFrontRotation}°</label>
                              <input type="range" min="0" max="360" step="1" value={patternFrontRotation} onChange={(e) => setPatternFrontRotation(parseFloat(e.target.value))} className="w-full accent-gray-900" />
                            </div>
                            <div className="flex items-center gap-2">
                              <input type="checkbox" id="patternFrontFlip" checked={patternFrontFlipX} onChange={(e) => setPatternFrontFlipX(e.target.checked)} className="accent-gray-900 w-4 h-4 rounded cursor-pointer" />
                              <label htmlFor="patternFrontFlip" className="text-xs text-gray-600 font-medium cursor-pointer select-none">Flip</label>
                            </div>
                          </div>
                          <button onClick={() => setPatternFrontImage(null)} className="w-full mt-2 text-xs text-red-500 hover:underline font-bold">Hapus Pola Depan</button>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <label className="block border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors">
                        <img src={fileIcon} alt="Upload" className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <span className="text-sm font-medium text-gray-600">Pilih Pola Belakang</span>
                        <input type="file" accept="image/*" onChange={handlePatternBackUpload} className="hidden" />
                      </label>
                      {patternBackImage && (
                        <div className="mt-4">
                          <img src={patternBackImage} alt="Pattern Back" className="w-full rounded-lg border bg-gray-50 object-contain h-24 p-2" />
                          <div className="mt-3 space-y-3">
                            <div>
                              <label className="text-xs text-gray-600 font-medium">Skala Pola Belakang</label>
                              <input type="range" min="0.5" max="5" step="0.1" value={patternBackScale} onChange={(e) => setPatternBackScale(parseFloat(e.target.value))} className="w-full accent-gray-900" />
                            </div>
                            <div>
                              <label className="text-xs text-gray-600 font-medium">Putar Pola: {patternBackRotation}°</label>
                              <input type="range" min="0" max="360" step="1" value={patternBackRotation} onChange={(e) => setPatternBackRotation(parseFloat(e.target.value))} className="w-full accent-gray-900" />
                            </div>
                            <div className="flex items-center gap-2">
                              <input type="checkbox" id="patternBackFlip" checked={patternBackFlipX} onChange={(e) => setPatternBackFlipX(e.target.checked)} className="accent-gray-900 w-4 h-4 rounded cursor-pointer" />
                              <label htmlFor="patternBackFlip" className="text-xs text-gray-600 font-medium cursor-pointer select-none">Flip</label>
                            </div>
                          </div>
                          <button onClick={() => setPatternBackImage(null)} className="w-full mt-2 text-xs text-red-500 hover:underline font-bold">Hapus Pola Belakang</button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {activeTab === 'text' && (
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-800">Edit Teks</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-600 font-medium">Teks Anda</label>
                      <input type="text" value={textValue} onChange={(e) => setTextValue(e.target.value)} placeholder="Ketik sesuatu..." className="w-full mt-1 p-2 border border-gray-300 rounded-lg text-sm" />
                    </div>
                    
                    {textValue && (
                      <>
                        <p className="text-xs text-blue-600 font-medium flex items-center gap-1">
                          <span className="bg-blue-100 p-1 rounded-full w-4 h-4 inline-flex items-center justify-center text-[10px]">ℹ</span> 
                          Klik baju untuk menggeser teks
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
                          <label className="text-xs text-gray-600 font-medium">Putar Teks: {textRotation}°</label>
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
            </div>
          </div>
        )}

        {/* Detail Ukuran Panel (Only in Preview Mode) */}
        {!isEditing && (
          <div className="absolute top-6 right-6 w-80 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-5 border border-white/50 z-20 flex flex-col max-h-[calc(100vh-120px)] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-3">
              <h3 className="font-extrabold text-gray-900">Detail Ukuran</h3>
              <div className="flex items-center gap-2">
                <label htmlFor="toggle-measure" className="text-xs font-bold text-gray-500 cursor-pointer">Garis Ukur</label>
                <input 
                  type="checkbox" 
                  id="toggle-measure"
                  checked={showMeasurements}
                  onChange={(e) => setShowMeasurements(e.target.checked)}
                  className="accent-[#aa3bff] w-4 h-4 cursor-pointer"
                />
              </div>
            </div>
            
            {order.items ? (
              <div className="space-y-4">
                {order.items.map((item, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => setSelectedItemIdx(idx)}
                    className={`rounded-xl p-3 border transition-all cursor-pointer ${
                      selectedItemIdx === idx 
                        ? 'bg-blue-50/80 border-[#aa3bff] shadow-md ring-1 ring-[#aa3bff]' 
                        : 'bg-gray-50 border-gray-100 hover:bg-gray-100'
                    }`}
                  >
                    <div className="font-bold text-gray-800 mb-3 flex justify-between items-center">
                      <span className={selectedItemIdx === idx ? 'text-[#aa3bff]' : ''}>Pakaian {idx + 1}</span>
                      <span className="text-white bg-[#aa3bff] px-2 py-0.5 rounded-full text-xs">{item.quantity} pcs</span>
                    </div>
                    {item.type === 'custom' ? (
                      <CustomSizeDisplay size={item.customSize} />
                    ) : (
                      <div className={`text-sm font-medium p-2 rounded border ${selectedItemIdx === idx ? 'bg-white/60 border-blue-200' : 'bg-white border-gray-200 text-gray-600'}`}>
                        Ukuran Standar: <span className="font-bold text-gray-900 text-base">{item.size}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                <div className="font-bold text-gray-800 mb-3 flex justify-between items-center">
                    <span>Total Pesanan</span>
                    <span className="text-white bg-[#aa3bff] px-2 py-0.5 rounded-full text-xs">{order.quantity} pcs</span>
                </div>
                {order.sizeType === 'custom' ? (
                    <CustomSizeDisplay size={order.customSize} />
                ) : (
                    <div className="text-sm font-medium text-gray-600 bg-white p-2 rounded border border-gray-200">
                      Ukuran Standar: <span className="font-bold text-gray-900 text-base">{order.size}</span>
                    </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
