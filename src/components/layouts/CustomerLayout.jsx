import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { ShoppingCart, Shirt, User, Settings, LogOut, ChevronDown } from 'lucide-react';
import { useStore } from '../../store/useStore';

export default function CustomerLayout() {
  const { currentUser, logout } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = currentUser ? [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Desain 3D', path: '/design' },
    { name: 'Pesan', path: '/order' },
    { name: 'Status', path: '/status' },
  ] : [
    { name: 'Home', path: '/' },

  ];

  return (
    <div className="min-h-screen flex flex-col bg-[#fcfcfd]">
      {location.pathname !== '/design' && (
        <nav className="glass-card sticky top-0 z-50 border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-20 items-center">
              <div className="flex items-center">
                <Link to={currentUser ? '/dashboard' : '/'} className="flex items-center gap-3 font-extrabold text-2xl tracking-tight text-gray-900 group">
                  <div className="bg-gradient-brand p-2 rounded-xl text-white group-hover:rotate-12 transition-transform duration-300">
                    <Shirt className="h-6 w-6" />
                  </div>
                  <span>PAS<span className="text-gradient">Production</span></span>
                </Link>
              </div>
            <div className="flex items-center space-x-2 text-sm font-semibold">
              {navLinks.map(link => (
                <Link 
                  key={link.path} 
                  to={link.path} 
                  className={`px-4 py-2 rounded-lg transition-all duration-200 ${location.pathname === link.path ? 'bg-indigo-50 text-[#aa3bff]' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
                >
                  {link.name}
                </Link>
              ))}
              
              <div className="h-6 w-px bg-gray-200 mx-2"></div>
              
              {currentUser ? (
                <div className="relative flex items-center pl-2" ref={dropdownRef}>
                  <button 
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="flex items-center gap-2 text-gray-700 hover:text-[#aa3bff] transition-colors bg-white border shadow-sm px-4 py-2 rounded-full hover-lift"
                  >
                    <User className="w-4 h-4" /> 
                    <span>{currentUser.name.split(' ')[0]}</span>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute top-full right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border py-2 z-50 flex flex-col">
                      <Link 
                        to="/profile" 
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 hover:text-[#aa3bff] transition-colors"
                      >
                        <Settings className="w-4 h-4" /> Kelola Profil
                      </Link>
                      <div className="h-px bg-gray-100 my-1"></div>
                      <button 
                        onClick={handleLogout} 
                        className="flex items-center gap-3 w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="w-4 h-4" /> Keluar
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link to="/login" className="ml-2 bg-gradient-brand text-white px-6 py-2.5 rounded-full font-bold hover-lift shadow-lg shadow-[#aa3bff]/30">
                  Masuk
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>
      )}
      <main className="flex-1">
        <Outlet />
      </main>
      
      <footer className="bg-white border-t py-8 text-center text-gray-500">
        <p>&copy; 2026 PAS Production. All rights reserved.</p>
      </footer>
    </div>
  );
}
