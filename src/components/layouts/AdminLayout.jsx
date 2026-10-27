import { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, ShoppingBag, LogOut, User, Shirt, Package, CheckSquare, ListOrdered, Menu } from 'lucide-react';
import { useStore } from '../../store/useStore';

export default function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const currentUser = useStore(state => state.currentUser);
  
  const navItems = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Kelola Produk', href: '/admin/products', icon: Package },
    { name: 'Kelola Pesanan', href: '/admin/orders', icon: ShoppingBag },
    { name: 'Verifikasi Pembayaran', href: '/admin/payments', icon: CheckSquare },
    { name: 'Update Status Pesanan', href: '/admin/status', icon: ListOrdered },
  ];

  const handleLogout = () => {
    useStore.getState().logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex font-sans">
      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'w-72' : 'w-24'} bg-white border-r border-gray-100 shadow-xl shadow-gray-200/40 flex flex-col z-20 relative transition-all duration-300 ease-in-out`}>
        <div className={`h-20 flex items-center ${isSidebarOpen ? 'px-8' : 'px-0 justify-center'} border-b border-gray-100 transition-all duration-300 overflow-hidden`}>
          <Link to="/admin" className="flex items-center gap-3 font-extrabold text-2xl tracking-tight text-gray-900 whitespace-nowrap">
             <div className="bg-gradient-brand text-white p-1.5 rounded-lg shadow-md shadow-[#aa3bff]/30 shrink-0 mx-auto">
               <Shirt className="h-6 w-6" />
             </div>
             <div className={`transition-all duration-300 ${isSidebarOpen ? 'opacity-100 w-auto' : 'opacity-0 w-0 hidden'}`}>
               <span>PAS<span className="text-gray-400 font-medium">Production</span></span>
             </div>
          </Link>
        </div>
        
        <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => {
            const isReallyActive = item.href === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.href}
                title={!isSidebarOpen ? item.name : ''}
                className={`flex items-center ${isSidebarOpen ? 'gap-4 px-4 py-3.5 rounded-2xl' : 'justify-center p-3.5 rounded-xl mx-auto w-12 h-12'} transition-all font-semibold ${
                  isReallyActive 
                    ? 'bg-gradient-brand text-white shadow-lg shadow-[#aa3bff]/25' 
                    : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className={`h-5 w-5 shrink-0 ${isReallyActive ? 'text-white' : 'text-gray-400'}`} />
                {isSidebarOpen && <span className="whitespace-nowrap">{item.name}</span>}
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 border-t border-gray-100 mt-auto flex justify-center">
          <button 
            onClick={handleLogout} 
            title={!isSidebarOpen ? 'Keluar' : ''}
            className={`flex items-center justify-center gap-3 ${isSidebarOpen ? 'w-full px-4 py-3' : 'w-12 h-12 p-0'} text-red-600 hover:bg-red-50 rounded-xl transition-all duration-300 font-bold overflow-hidden`}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {isSidebarOpen && <span className="whitespace-nowrap">Keluar</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md h-20 flex justify-between items-center px-8 shadow-sm z-10 border-b border-gray-100 transition-all">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 bg-gray-50 text-gray-600 rounded-xl hover:bg-gray-100 hover:text-gray-900 transition-colors"
              title="Toggle Sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h2 className="text-2xl font-extrabold text-gray-800 tracking-tight whitespace-nowrap hidden sm:block">
              {navItems.find(item => item.href === '/admin' ? location.pathname === '/admin' : location.pathname.startsWith(item.href))?.name || 'Admin'}
            </h2>
          </div>
          
          <div className="flex items-center gap-6 bg-white py-2 px-4 rounded-full shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="bg-[#aa3bff]/10 p-2 rounded-full">
                <User className="h-5 w-5 text-[#aa3bff]" /> 
              </div>
              <div className="hidden md:block text-right pr-2">
                <p className="text-sm font-bold text-gray-900 leading-tight">{currentUser?.name || 'Administrator'}</p>
              </div>
            </div>
          </div>
        </header>
        
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
