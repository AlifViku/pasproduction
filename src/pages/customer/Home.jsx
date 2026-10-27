import { Link } from 'react-router-dom';
import { Shirt, Palette, Truck, CheckCircle2, ArrowRight, Shield, Zap, Sparkles } from 'lucide-react';

export default function Home() {
  const steps = [
    { icon: Palette, title: 'Desain 3D Interaktif', desc: 'Bebaskan kreativitas Anda di kanvas 3D kami. Real-time dan presisi.' },
    { icon: Shirt, title: 'Kustomisasi Ukuran', desc: 'Pilih fitting terbaik atau input ukuran badan Anda secara spesifik.' },
    { icon: CheckCircle2, title: 'Pembayaran Aman', desc: 'Transaksi terenkripsi dengan berbagai metode pembayaran.' },
    { icon: Truck, title: 'Pengiriman Cepat', desc: 'Lacak pesanan secara real-time sampai ke depan pintu Anda.' },
  ];

  const features = [
    { icon: Zap, title: 'Proses Kilat', desc: 'Produksi cepat tanpa mengorbankan kualitas berkat teknologi modern.' },
    { icon: Shield, title: 'Kualitas Premium', desc: 'Bahan baku pilihan dan jahitan rapi berstandar distro.' },
    { icon: Sparkles, title: 'Desain Unik', desc: 'Ribuan aset desain siap pakai atau unggah karya Anda sendiri.' }
  ];

  return (
    <div className="flex flex-col min-h-screen font-sans bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gray-900 text-white min-h-[85vh] flex items-center justify-center py-20">
        {/* Dynamic Background Elements */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-30"></div>
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-purple-600/40 rounded-full blur-[150px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-blue-600/40 rounded-full blur-[150px] animate-pulse" style={{ animationDelay: '2s' }}></div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-purple-300 font-semibold text-sm mb-10 shadow-lg shadow-purple-900/20">
            <Sparkles className="w-4 h-4" /> Platform Konveksi 3D Terbaik & Terpercaya
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight mb-8 leading-[1.1] max-w-5xl">
            Revolusi Pembuatan <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-400 to-blue-400">Kaos Kustom</span> Anda
          </h1>
          
          <p className="text-lg md:text-2xl text-gray-300 max-w-3xl mb-12 leading-relaxed font-light">
            Tinggalkan cara lama. Mulai rancang pakaian impianmu dengan editor 3D interaktif kami. Cepat, mudah, dan dengan kualitas yang terjamin.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 w-full sm:w-auto justify-center">
            <Link to="/login" className="group relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white bg-gradient-to-r from-purple-600 to-blue-600 rounded-full overflow-hidden transition-all hover:scale-105 hover:shadow-[0_0_40px_rgba(168,85,247,0.5)]">
              <span className="absolute inset-0 w-full h-full -mt-1 rounded-lg opacity-30 bg-gradient-to-b from-transparent via-transparent to-black"></span>
              <span className="relative flex items-center gap-3">Mulai Pesan Sekarang <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" /></span>
            </Link>
            
            <Link to="/register" className="inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white bg-white/10 backdrop-blur-md border border-white/20 rounded-full transition-all hover:bg-white/20 hover:scale-105">
              Buat Akun Baru
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-32 bg-white relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">Mengapa Memilih Kami?</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto font-medium">Kami menggabungkan teknologi mutakhir dengan keahlian konveksi profesional.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            {features.map((feat, idx) => (
              <div key={idx} className="flex flex-col items-center text-center group p-8 rounded-3xl hover:bg-gray-50 transition-colors duration-300">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-100 to-blue-100 rounded-3xl flex items-center justify-center mb-8 text-purple-600 group-hover:bg-gradient-to-br group-hover:from-purple-600 group-hover:to-blue-600 group-hover:text-white transition-all duration-500 transform group-hover:-translate-y-3 shadow-xl shadow-purple-900/5">
                  <feat.icon className="w-12 h-12" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{feat.title}</h3>
                <p className="text-lg text-gray-600 leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>



      {/* Steps Section */}
      <section className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">Proses Sederhana</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">Dari ide hingga menjadi pakaian jadi, semuanya ada di ujung jari Anda.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
            {steps.map((step, idx) => (
              <div key={idx} className="relative bg-white p-10 rounded-3xl border border-gray-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group">
                <div className="absolute -top-6 -left-6 w-14 h-14 bg-gradient-to-br from-purple-600 to-blue-600 text-white rounded-2xl flex items-center justify-center font-bold text-2xl shadow-lg shadow-purple-900/30 transform group-hover:rotate-12 transition-transform">
                  {idx + 1}
                </div>
                <div className="w-20 h-20 bg-gray-50 text-purple-600 rounded-2xl flex items-center justify-center mb-8">
                  <step.icon className="w-10 h-10" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{step.title}</h3>
                <p className="text-gray-600 text-lg leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative overflow-hidden bg-gray-900 rounded-t-[3rem] mt-10">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900 to-blue-900 opacity-90"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        
        {/* Glow Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-purple-500/30 blur-[100px] rounded-full"></div>

        <div className="max-w-5xl mx-auto px-4 relative z-10 text-center flex flex-col items-center">
          <h2 className="text-5xl md:text-7xl font-extrabold text-white mb-8 tracking-tight">Siap Membuat <br/>Mahakarya Anda?</h2>
          <p className="text-2xl text-purple-200 mb-12 font-light max-w-3xl leading-relaxed">Bergabunglah dengan ribuan pelanggan yang telah mempercayakan pembuatan pakaian kustom mereka kepada PAS Production.</p>
          <div className="flex flex-col sm:flex-row gap-6">
            <Link to="/register" className="inline-flex items-center justify-center px-10 py-5 text-xl font-bold text-gray-900 bg-white rounded-full transition-all hover:bg-gray-100 hover:scale-105 shadow-[0_0_30px_rgba(255,255,255,0.3)]">
              Daftar Sekarang - Gratis!
            </Link>
            <Link to="/login" className="inline-flex items-center justify-center px-10 py-5 text-xl font-bold text-white bg-transparent border-2 border-white/30 rounded-full transition-all hover:bg-white/10">
              Sudah Punya Akun
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
