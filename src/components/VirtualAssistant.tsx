import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageCircle, X, Instagram, Facebook, Smartphone, ArrowRight } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const VirtualAssistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'main'), (doc) => {
      if (doc.exists()) setSettings(doc.data());
    });

    // Show a small notification bubble after 3 seconds
    const timer = setTimeout(() => {
      if (!isOpen) setShowNotification(true);
    }, 3000);

    return () => {
      unsub();
      clearTimeout(timer);
    };
  }, []);

  const socialLinks = {
    whatsapp: settings?.whatsapp ? `https://wa.me/${settings.whatsapp}` : '#',
    instagram: settings?.instagram ? `https://instagram.com/${settings.instagram.replace('@', '')}` : '#',
    tiktok: settings?.tiktok ? `https://tiktok.com/@${settings.tiktok.replace('@', '')}` : '#',
  };

  return (
    <div className="fixed bottom-8 right-8 z-[100] flex flex-col items-end gap-4">
      <AnimatePresence>
        {showNotification && !isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="bg-white p-4 shadow-2xl border border-brand-green/10 rounded-2xl max-w-[200px] relative mb-2"
          >
            <button 
              onClick={() => setShowNotification(false)}
              className="absolute -top-2 -right-2 bg-brand-green text-white rounded-full p-1 shadow-lg"
            >
              <X size={10} />
            </button>
            <p className="text-[10px] uppercase tracking-widest font-bold text-brand-green leading-tight">
              Olá! Precisa de ajuda com seu ritual? ✨
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20, transformOrigin: 'bottom right' }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-brand-cream w-80 shadow-2xl border-4 border-white overflow-hidden rounded-sm flex flex-col"
          >
            {/* Header */}
            <div className="bg-brand-green p-6 text-brand-cream relative">
              <button 
                onClick={() => setIsOpen(false)}
                className="absolute top-4 right-4 opacity-60 hover:opacity-100 transition-opacity"
              >
                <X size={20} />
              </button>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-brand-cream/10 flex items-center justify-center border border-white/20">
                  <span className="font-serif italic text-xl">B</span>
                </div>
                <div>
                  <h4 className="font-serif text-lg leading-tight uppercase tracking-widest">Botaniq</h4>
                  <p className="text-[9px] uppercase tracking-[0.2em] opacity-60">Assistente de Bem-estar</p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-8 space-y-6">
              <div className="bg-white p-4 rounded-sm border border-brand-green/5">
                <p className="text-xs text-brand-green/80 leading-relaxed">
                  Bem-vinda ao nosso jardim digital! Siga nossas redes para dicas de autocuidado e lançamentos exclusivos.
                </p>
              </div>

              <div className="space-y-3">
                <a 
                  href={socialLinks.whatsapp} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 bg-brand-green/5 hover:bg-brand-green/10 transition-colors rounded-sm group"
                >
                  <div className="flex items-center gap-3">
                    <Smartphone size={16} className="text-brand-terracotta" />
                    <span className="text-[10px] uppercase tracking-widest font-bold">WhatsApp</span>
                  </div>
                  <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </a>

                <a 
                  href={socialLinks.instagram} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 bg-brand-green/5 hover:bg-brand-green/10 transition-colors rounded-sm group"
                >
                  <div className="flex items-center gap-3">
                    <Instagram size={16} className="text-brand-terracotta" />
                    <span className="text-[10px] uppercase tracking-widest font-bold">Instagram</span>
                  </div>
                  <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </a>

                <a 
                  href={socialLinks.tiktok} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 bg-brand-green/5 hover:bg-brand-green/10 transition-colors rounded-sm group"
                >
                  <div className="flex items-center gap-3">
                    <Smartphone size={16} className="text-brand-terracotta" />
                    <span className="text-[10px] uppercase tracking-widest font-bold">TikTok</span>
                  </div>
                  <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </a>
              </div>
              
              <p className="text-[8px] text-center uppercase tracking-[0.3em] opacity-30 pt-4">
                Feito à mão com intenção
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          setIsOpen(!isOpen);
          setShowNotification(false);
        }}
        className="w-16 h-16 bg-brand-green text-brand-cream rounded-full shadow-2xl flex items-center justify-center group relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-brand-terracotta translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out opacity-20"></div>
        {isOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </motion.button>
    </div>
  );
};
