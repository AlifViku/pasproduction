import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Migrasi otomatis: Mengubah nama 'Eni Sumarni' menjadi 'Idhar Raka' pada storage
try {
  const STORAGE_KEY = 'pas-production-storage';
  if (typeof window !== 'undefined' && window.localStorage) {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw && /Eni Sumarni/i.test(raw)) {
      const updated = raw.replace(/Eni Sumarni/gi, 'Idhar Raka');
      window.localStorage.setItem(STORAGE_KEY, updated);
    }
  }
} catch (e) {
  console.warn('Auto-migration notice:', e);
}

const initialState = {
  currentUser: null, // { id, role, name, email, phone, address, status }
  users: [
    { id: 'ADM-001', role: 'admin', name: 'Admin PAS', email: 'admin@pas.com', password: 'admin', status: 'active' },
    { id: 'CST-001', role: 'customer', name: 'Budi Santoso', email: 'budi@mail.com', password: 'password', phone: '08123456789', address: 'Jl. Merdeka No.1', status: 'active' },
    { id: 'CST-002', role: 'customer', name: 'Idhar Raka', email: 'idhar@mail.com', password: 'password', phone: '085721698220', address: 'Jl. Dipati Ukur No. 112, Bandung', status: 'active' }
  ],
  products: [
    { id: 'PRD-001', name: 'Kaos Lengan Pendek Combed 30s', basePrice: 50000, type: 'short' },
    { id: 'PRD-002', name: 'Kaos Lengan Panjang Combed 30s', basePrice: 60000, type: 'long' }
  ],
  orders: [],
  designs: [],
};

export const useStore = create(
  persist(
    (set, get) => ({
      ...initialState,

      // Auth actions
      login: (email, password) => {
        const user = get().users.find(u => u.email === email && u.password === password);
        if (user) {
          if (user.status !== 'active') return { success: false, message: 'Akun dinonaktifkan.' };
          set({ currentUser: user });
          return { success: true, user };
        }
        return { success: false, message: 'Email atau password salah.' };
      },
      logout: () => set({ currentUser: null }),
      register: (userData) => {
        const exists = get().users.find(u => u.email === userData.email);
        if (exists) return { success: false, message: 'Email sudah terdaftar.' };
        
        const newUser = {
          ...userData,
          id: `CST-${Math.floor(Math.random() * 10000)}`,
          role: 'customer',
          status: 'active'
        };
        set(state => ({ users: [...state.users, newUser], currentUser: newUser }));
        return { success: true };
      },
      updateProfile: (updates) => set(state => {
        if (!state.currentUser) return state;
        const updatedUser = { ...state.currentUser, ...updates };
        return {
          currentUser: updatedUser,
          users: state.users.map(u => u.id === updatedUser.id ? updatedUser : u)
        };
      }),

      // Admin actions
      updateUserStatus: (id, status) => set(state => ({
        users: state.users.map(u => u.id === id ? { ...u, status } : u)
      })),
      updateProductPrice: (id, newPrice) => set(state => ({
        products: state.products.map(p => p.id === id ? { ...p, basePrice: newPrice } : p)
      })),

      // Order actions
      addOrder: (order) => set(state => ({ orders: [...state.orders, order] })),
      updateOrderStatus: (id, status) => set(state => ({
        orders: state.orders.map(o => o.id === id ? { ...o, status } : o)
      })),
      verifyPayment: (id, status, notes) => set(state => ({
        orders: state.orders.map(o => o.id === id ? { ...o, status, paymentNotes: notes } : o)
      })),
      updatePaymentProof: (id, proof) => set(state => ({
        orders: state.orders.map(o => o.id === id ? { ...o, paymentProof: proof, status: 'Menunggu Verifikasi' } : o)
      })),
      clearMyOrders: (customerId) => set(state => ({
        orders: state.orders.filter(o => o.customerId !== customerId)
      })),

      // Design actions
      saveDesign: (design) => set(state => ({ designs: [...state.designs, design] })),
      updateDesign: (id, updates) => set(state => ({
        designs: state.designs.map(d => d.id === id ? { ...d, ...updates } : d)
      })),
      
      // Reset logic for testing
      resetStore: () => set(initialState),
    }),
    {
      name: 'pas-production-storage', // name of the item in the storage (must be unique)
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        let needsUpdate = false;
        
        if (state.currentUser?.name && /Eni Sumarni/i.test(state.currentUser.name)) {
          state.currentUser.name = 'Idhar Raka';
          needsUpdate = true;
        }

        if (Array.isArray(state.users)) {
          state.users = state.users.map(u => {
            if (/Eni Sumarni/i.test(u.name)) {
              needsUpdate = true;
              return { ...u, name: 'Idhar Raka' };
            }
            return u;
          });
        }

        if (Array.isArray(state.orders)) {
          state.orders = state.orders.map(o => {
            if (/Eni Sumarni/i.test(o.customerName)) {
              needsUpdate = true;
              return { ...o, customerName: 'Idhar Raka' };
            }
            return o;
          });
        }

        if (needsUpdate) {
          useStore.setState(state);
        }
      },
    }
  )
);
