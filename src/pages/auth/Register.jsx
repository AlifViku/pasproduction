import { useState } from 'react';
import { useStore } from '../../store/useStore';
import { useNavigate, Link } from 'react-router-dom';
import { Shirt } from 'lucide-react';

export default function Register() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '', address: '' });
  const [error, setError] = useState('');
  const register = useStore(state => state.register);
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    const res = register(formData);
    if (res.success) {
      alert('Registrasi berhasil!');
      navigate('/');
    } else {
      setError(res.message);
    }
  };

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  return (
    <div className="min-h-screen flex">
      {/* Left side - Image/Branding */}
      <div className="hidden lg:flex w-1/2 bg-gradient-brand text-white p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
        <div className="relative z-10">
          <Link to="/" className="flex items-center gap-3 font-extrabold text-3xl tracking-tight">
             <Shirt className="h-8 w-8" />
             <span>PAS<span className="opacity-80">Production</span></span>
          </Link>
        </div>
        <div className="relative z-10 max-w-lg">
          <h1 className="text-5xl font-extrabold mb-6 leading-tight">Bergabunglah Bersama Kami.</h1>
          <p className="text-xl opacity-90">Mulai wujudkan desain pakaian impian Anda dengan platform konveksi modern kami.</p>
        </div>
        <div className="relative z-10 text-sm opacity-60">© 2026 PAS Production. All rights reserved.</div>
      </div>

      {/* Right side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 h-full overflow-y-auto max-h-screen my-auto">
          <div>
            <h2 className="mt-2 text-3xl font-extrabold text-gray-900 tracking-tight">Buat Akun Baru</h2>
            <p className="mt-2 text-sm text-gray-500">Lengkapi data di bawah ini untuk mendaftar.</p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && <div className="text-red-600 text-sm font-medium bg-red-50 border border-red-100 p-3 rounded-lg flex items-center gap-2"><span>⚠️</span> {error}</div>}
            
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Nama Lengkap</label>
                <input
                  type="text" name="name" required onChange={handleChange}
                  className="appearance-none block w-full px-4 py-3 border border-gray-200 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#aa3bff]/20 focus:border-[#aa3bff] transition-all bg-gray-50 focus:bg-white sm:text-sm"
                  placeholder="Nama Lengkap Anda"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                <input
                  type="email" name="email" required onChange={handleChange}
                  className="appearance-none block w-full px-4 py-3 border border-gray-200 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#aa3bff]/20 focus:border-[#aa3bff] transition-all bg-gray-50 focus:bg-white sm:text-sm"
                  placeholder="anda@email.com"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
                <input
                  type="password" name="password" required onChange={handleChange}
                  className="appearance-none block w-full px-4 py-3 border border-gray-200 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#aa3bff]/20 focus:border-[#aa3bff] transition-all bg-gray-50 focus:bg-white sm:text-sm"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">No. HP</label>
                <input
                  type="tel" name="phone" required onChange={handleChange}
                  className="appearance-none block w-full px-4 py-3 border border-gray-200 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#aa3bff]/20 focus:border-[#aa3bff] transition-all bg-gray-50 focus:bg-white sm:text-sm"
                  placeholder="08123456789"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Alamat</label>
                <textarea
                  name="address" required onChange={handleChange} rows="3"
                  className="appearance-none block w-full px-4 py-3 border border-gray-200 placeholder-gray-400 text-gray-900 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#aa3bff]/20 focus:border-[#aa3bff] transition-all bg-gray-50 focus:bg-white sm:text-sm resize-none"
                  placeholder="Masukkan alamat Anda"
                />
              </div>
            </div>

            <div>
              <button type="submit" className="w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white bg-gradient-brand hover-lift shadow-lg shadow-[#aa3bff]/20 focus:outline-none">
                Daftar Sekarang
              </button>
            </div>
            <div className="text-center text-sm font-medium text-gray-600">
              Sudah punya akun? <Link to="/login" className="font-bold text-[#aa3bff] hover:text-[#9228e6] ml-1">Masuk</Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
