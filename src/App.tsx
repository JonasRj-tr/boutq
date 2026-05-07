/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { ShoppingBag, Menu, X, Instagram, Facebook, Smartphone as TikTok, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Home from './pages/Home';
import Admin from './pages/Admin';
import { VirtualAssistant } from './components/VirtualAssistant';
import { cn } from './lib/utils';
import { auth } from './lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { CartItem } from './types';

export default function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 6000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const adminEmails = ['jessicajonas2208@gmail.com', 'botaniq.oficial@gmail.com', 'dani@x.com'];
      setIsAdmin(!!user && adminEmails.includes(user.email || ''));
    });
    return () => unsubscribe();
  }, []);

  return (
    <Router>
      <div className="min-h-screen flex flex-col font-sans">
        <AnimatePresence>
          {showSplash && (
            <motion.div
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              className="fixed inset-0 z-[100] bg-brand-cream flex flex-col items-center justify-center overflow-hidden"
            >
              {/* Luxury Background Elements */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 0.05, scale: 1 }}
                transition={{ duration: 4, ease: "easeOut" }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                <img src="https://i.postimg.cc/d0pWF3k6/Logo-3.png" alt="" className="w-full h-full object-contain blur-2xl" />
              </motion.div>

              <div className="relative flex flex-col items-center">
                {/* Logo Animation */}
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 2, ease: [0.16, 1, 0.3, 1], delay: 0.5 }}
                >
                  <img src="https://i.postimg.cc/d0pWF3k6/Logo-3.png" alt="Botaniq" className="h-40 w-auto object-contain" />
                </motion.div>

                {/* Handwritten Text Animation */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 2.5, ease: "easeInOut", delay: 2.5 }}
                  className="mt-8"
                >
                  <span className="font-handwriting text-5xl md:text-6xl text-brand-green/80 italic">
                    Feito com amor, para você
                  </span>
                </motion.div>

                {/* Subtle Progress Line */}
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: 5, ease: "linear", delay: 0.5 }}
                  className="absolute -bottom-16 h-[1px] bg-brand-green/10"
                />
              </div>

              {/* Minimalist Accents */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 2 }}
                className="absolute top-12 left-12 w-24 h-[1px] bg-brand-green/5"
              />
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 2 }}
                className="absolute bottom-12 right-12 w-24 h-[1px] bg-brand-green/5"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-brand-green/10 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 h-24 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => setIsMenuOpen(true)} className="p-2 hover:bg-brand-green/5 transition-colors">
                <Menu size={24} />
              </button>
            </div>

            <Link to="/" className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center">
              <img src="https://i.postimg.cc/d0pWF3k6/Logo-3.png" alt="Botaniq Logo" className="h-20 w-auto object-contain" />
            </Link>

            <div className="flex items-center gap-4">
              {isAdmin && (
                <Link to="/admin" className="p-2 hover:bg-brand-green/5 transition-colors" title="Admin">
                  <User size={20} />
                </Link>
              )}
              <button 
                onClick={() => setIsCartOpen(true)}
                className="p-2 hover:bg-brand-green/5 transition-colors relative"
              >
                <ShoppingBag size={20} />
                {cart.length > 0 && (
                  <span className="absolute top-0 right-0 bg-brand-green text-brand-cream text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                    {cart.reduce((acc, item) => acc + item.quantity, 0)}
                  </span>
                )}
              </button>
            </div>
          </div>
        </nav>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-0 z-[60] bg-brand-green text-brand-cream p-8"
            >
              <div className="flex justify-between items-center mb-12 text-brand-cream">
                <span className="font-serif text-2xl tracking-widest uppercase">Menu</span>
                <button onClick={() => setIsMenuOpen(false)} className="p-2 hover:bg-brand-cream/10 rounded-full">
                  <X size={32} />
                </button>
              </div>

              <div className="flex flex-col gap-8 text-4xl font-serif text-brand-cream">
                <Link to="/" onClick={() => setIsMenuOpen(false)} className="hover:italic hover:pl-4 transition-all">Início</Link>
                <Link to="/#produtos" onClick={() => setIsMenuOpen(false)} className="hover:italic hover:pl-4 transition-all">Produtos</Link>
                <Link to="/#sobre" onClick={() => setIsMenuOpen(false)} className="hover:italic hover:pl-4 transition-all">Sobre Nós</Link>
                {isAdmin && <Link to="/admin" onClick={() => setIsMenuOpen(false)} className="hover:italic hover:pl-4 transition-all">Mesa Admin</Link>}
              </div>

              <div className="absolute bottom-12 left-8 right-8 flex justify-between items-end text-brand-cream">
                <div className="flex flex-col gap-2">
                  <span className="text-[10px] uppercase tracking-widest opacity-50">Siga-nos</span>
                  <div className="flex gap-4">
                    <button className="hover:text-brand-terracotta transition-colors"><Instagram size={20} /></button>
                    <button className="hover:text-brand-terracotta transition-colors"><Facebook size={20} /></button>
                    <button className="hover:text-brand-terracotta transition-colors"><TikTok size={20} /></button>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] uppercase tracking-widest opacity-50">Botaniq © 2026</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Content */}
        <main className="flex-grow pt-24">
          <Routes>
            <Route path="/" element={<Home cart={cart} setCart={setCart} isCartOpen={isCartOpen} setIsCartOpen={setIsCartOpen} />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </main>


        {/* Footer */}
        <footer className="bg-brand-green text-brand-cream py-20 mt-auto">
          <div className="max-w-7xl mx-auto px-12">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-16">
              <div className="col-span-1 md:col-span-2">
                <img src="https://i.postimg.cc/d0pWF3k6/Logo-3.png" alt="Botaniq Logo" className="h-28 w-auto object-contain mb-6 -ml-4 brightness-200 contrast-125" />
                <p className="text-sm opacity-60 leading-relaxed max-w-sm font-sans">
                  Saboaria artesanal e óleos de banho em barra. Um ritual de luxo e delicadeza para a sua pele, formulado com ingredientes 100% naturais e amor.
                </p>
              </div>
              <div>
                <h4 className="text-[10px] uppercase tracking-[0.4em] mb-8 opacity-40 font-bold text-white">Navegação</h4>
                <ul className="flex flex-col gap-4 text-xs font-medium uppercase tracking-widest">
                  <li><Link to="/" className="hover:text-brand-terracotta transition-colors">Início</Link></li>
                  <li><Link to="/#produtos" className="hover:text-brand-terracotta transition-colors">Produtos</Link></li>
                  <li><Link to="/#sobre" className="hover:text-brand-terracotta transition-colors">Nossa História</Link></li>
                  <li><Link to="/admin" className="hover:text-brand-terracotta transition-colors opacity-40 hover:opacity-100">Painel Admin</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="text-[10px] uppercase tracking-[0.4em] mb-8 opacity-40 font-bold text-white">Atendimento</h4>
                <div className="space-y-4 text-xs opacity-70 leading-loose">
                  <p>Rua Cambará 1096, Figueira - PR</p>
                  <p>botaniq.oficial@gmail.com</p>
                  <p className="font-sans text-brand-terracotta mt-4">(41) 99585-0003</p>
                </div>
              </div>
            </div>
            
            <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 text-[9px] uppercase tracking-[0.5em] opacity-40">
              <p>© 2026 Botaniq Store. Handcrafted with intention.</p>
              <div className="flex gap-8">
                <a href="https://instagram.com" className="hover:text-white transition-colors">Instagram</a>
                <a href="https://facebook.com" className="hover:text-white transition-colors">Facebook</a>
                <a href="https://tiktok.com" className="hover:text-white transition-colors">TikTok</a>
              </div>
            </div>
          </div>
        </footer>

        <VirtualAssistant />
      </div>
    </Router>
  );
}
