import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product, CartItem, Settings } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, ChevronRight, Star, Truck, ShieldCheck, Heart, X, Plus, Minus, ArrowRight, Smartphone, ExternalLink, Search, Sparkles, Clock, Lock, Shield, Award, Zap, User, Stethoscope, MessageCircle, Ear, Flower2, Droplets, Sun, Moon, Feather, Leaf } from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';

interface HomeProps {
  cart: CartItem[];
  setCart: React.Dispatch<React.SetStateAction<CartItem[]>>;
  isCartOpen: boolean;
  setIsCartOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function Home({ cart, setCart, isCartOpen, setIsCartOpen }: HomeProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'shipping' | 'summary'>('cart');
  const [loading, setLoading] = useState(true);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [shippingInfo, setShippingInfo] = useState({ price: 0, days: 0 });
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; value: number } | null>(null);
  const [couponError, setCouponError] = useState('');

  const [customerData, setCustomerData] = useState({
    name: '',
    phone: '',
    zip: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: ''
  });

  const [storeSettings, setStoreSettings] = useState<Settings>({
    whatsapp: '5541995850003',
    instagram: 'botaniq_oleodebanhoembarra',
    facebook: 'botaniq',
    tiktok: 'botaniq_saboariamed',
    storeAddress: 'Rua Cambará 1096, casa 1, Figueira',
    storeCep: '83280000'
  });

  useEffect(() => {
    async function fetchProductsAndSettings() {
      try {
        const q = query(collection(db, 'products'), where('active', '==', true));
        const querySnapshot = await getDocs(q);
        const productsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        setProducts(productsData);

        const sSnap = await getDocs(collection(db, 'settings'));
        if (!sSnap.empty) {
          setStoreSettings(sSnap.docs[0].data() as Settings);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchProductsAndSettings();
  }, []);

  const handleZipBlur = async () => {
    if (customerData.zip.length >= 8) {
      setShippingLoading(true);
      // Auto-fill address via ViaCEP
      try {
        const res = await fetch(`https://viacep.com.br/ws/${customerData.zip.replace(/\D/g, '')}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setCustomerData(prev => ({
            ...prev,
            street: data.logradouro,
            neighborhood: data.bairro,
            city: data.localidade,
            state: data.uf
          }));
        }
      } catch (e) {
        console.error("ViaCEP error:", e);
      }

      // Calculate shipping
      try {
        const { calculateShipping } = await import('../services/checkout');
        const calc = await calculateShipping(customerData.zip, cart);
        setShippingInfo({ price: calc.price, days: calc.estimatedDays });
      } catch (e) {
        console.error("Shipping error:", e);
      } finally {
        setShippingLoading(false);
      }
    }
  };

  const handleFinish = async () => {
    const { generateWhatsAppMessage } = await import('../services/checkout');
    const order = {
      customerName: customerData.name,
      customerPhone: customerData.phone,
      address: {
        zip: customerData.zip,
        street: customerData.street,
        number: customerData.number,
        complement: customerData.complement,
        neighborhood: customerData.neighborhood,
        city: customerData.city,
        state: customerData.state
      },
      items: cart,
      total: finalTotal,
      cartTotal: cartTotal,
      discount: discountAmount,
      couponCode: appliedCoupon?.code,
      shippingCost: shippingInfo.price
    };

    // Save to Firestore
    try {
      await addDoc(collection(db, 'orders'), {
        ...order,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
    } catch (e) {
      console.error("Error saving order:", e);
    }

    const waLink = generateWhatsAppMessage(order, storeSettings.whatsapp);
    window.open(waLink, '_blank');
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
    setCheckoutStep('cart');
    setIsCartOpen(true);
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const cartTotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  
  const discountAmount = appliedCoupon ? (appliedCoupon.value > 100 ? appliedCoupon.value : (cartTotal * (appliedCoupon.value / 100))) : 0;
  const finalTotal = cartTotal - discountAmount + shippingInfo.price;

  const handleApplyCoupon = async () => {
    setCouponError('');
    if (!couponCode) return;
    
    try {
      const q = query(collection(db, 'coupons'), where('code', '==', couponCode.toUpperCase()), where('isActive', '==', true));
      const snap = await getDocs(q);
      
      if (snap.empty) {
        setCouponError('Cupom inválido ou expirado');
        setAppliedCoupon(null);
      } else {
        const data = snap.docs[0].data();
        setAppliedCoupon({ code: data.code, value: data.value });
        setCouponError('');
      }
    } catch (e) {
      setCouponError('Erro ao validar cupom');
    }
  };

  const categories = ['Todos', ...Array.from(new Set(products.map(p => p.category)))];
  const filteredProducts = activeCategory === 'Todos' 
    ? products 
    : products.filter(p => p.category === activeCategory);

  return (
    <div className="relative bg-brand-cream min-h-screen">
      {/* Hero Section */}
      <section className="relative h-[85vh] flex items-center overflow-hidden bg-brand-cream">
        <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
          <img 
            src="https://i.postimg.cc/d0pWF3k6/Logo-3.png" 
            alt="Watermark" 
            className="w-1/2 opacity-[0.03] select-none pointer-events-none grayscale" 
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-12 w-full grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="text-[10px] uppercase tracking-[0.6em] mb-8 block opacity-40 font-medium">Handcrafted Botanical Goods</span>
            <h1 className="text-7xl md:text-8xl mb-8 leading-[0.9] text-brand-green">
              A Essência <br />
              <span className="italic font-normal pl-12 md:pl-20 uppercase tracking-tighter">BotaniQ</span>
            </h1>
            <p className="text-sm opacity-70 mb-12 max-w-md leading-relaxed font-sans">
              Saboaria artesanal e óleos de banho em barra. Um ritual de luxo e delicadeza para a sua pele, formulado com ingredientes 100% naturais.
            </p>
            <div className="flex gap-8 items-center">
              <a href="#produtos" className="luxury-button uppercase text-[11px] tracking-widest px-10">
                Coleção
              </a>
              <a href="#sobre" className="text-[11px] uppercase tracking-widest border-b border-brand-green pb-1 font-medium hover:text-brand-green/60 transition-colors">
                Sobre Nós
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, delay: 0.2 }}
            className="hidden lg:block relative"
          >
            <div className="w-80 h-[500px] bg-brand-green rounded-t-full flex-shrink-0 flex items-center justify-center p-8 relative ml-auto mr-12 rotate-[-5deg] shadow-2xl">
              <div className="w-full h-full border border-white/20 rounded-t-full flex flex-col items-center justify-center text-white text-center">
                <div className="text-[10px] uppercase tracking-[0.2em] opacity-60 mb-3">Destaque</div>
                <div className="text-3xl leading-tight italic font-serif text-brand-cream">Óleo de Banho <br/> em Barra</div>
              </div>
            </div>
            <div className="absolute top-1/2 -left-12 -translate-y-1/2 w-48 aspect-square luxury-card p-4 rotate-[12deg] shadow-xl">
               <img src="https://images.unsplash.com/photo-1600857062241-98e5dba7f214?w=400" className="w-full h-full object-cover" alt="Detail" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Bar */}
      <section className="bg-white/50 backdrop-blur-sm border-y border-brand-green/5 py-10">
        <div className="max-w-7xl mx-auto px-12 flex flex-wrap justify-center md:justify-between gap-10 opacity-60 text-[10px] uppercase tracking-[0.3em]">
          <div className="flex items-center gap-3"><ShieldCheck size={14} /> 100% Orgânico</div>
          <div className="flex items-center gap-3"><Heart size={14} /> Feito à Mão</div>
          <div className="flex items-center gap-3"><Star size={14} /> Qualidade Superior</div>
        </div>
      </section>

      {/* Products Grid */}
      <section id="produtos" className="py-32 max-w-7xl mx-auto px-12 bg-brand-cream">
        <div className="flex flex-col md:flex-row justify-between items-end mb-24 gap-10">
          <div className="relative">
            <h2 className="text-6xl mb-6 leading-tight">Escolha o <br/><span className="italic">seu ritual</span></h2>
            <div className="w-20 h-[1px] bg-brand-green/20"></div>
          </div>
          <div className="flex gap-10 overflow-x-auto pb-4 no-scrollbar">
            {categories.map(cat => (
              <button 
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "text-[10px] uppercase tracking-[0.2em] whitespace-nowrap transition-all pb-2",
                  activeCategory === cat ? "border-b border-brand-green text-brand-green font-bold" : "opacity-40 hover:opacity-100"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
            {[1,2,3].map(i => (
              <div key={i} className="animate-pulse">
                <div className="bg-brand-green/5 aspect-[3/4] mb-6"></div>
                <div className="h-4 bg-brand-green/5 w-2/3 mb-3"></div>
                <div className="h-4 bg-brand-green/5 w-1/3"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-24">
            {filteredProducts.map((p, idx) => (
              <motion.div 
                key={p.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (idx % 3) * 0.1 }}
                className="group relative"
              >
                <div className="luxury-card aspect-[3/4] mb-8 relative group-hover:shadow-2xl transition-all duration-700 overflow-hidden">
                  <img 
                    src={p.image} 
                    alt={p.name}
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-brand-green/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                </div>
                <div className="flex flex-col items-center pb-4">
                  <h3 className="text-2xl font-serif text-center px-2">{p.name}</h3>
                  <p className="text-[10px] uppercase tracking-[0.2em] opacity-40 mb-2 italic">{p.category}</p>
                  <div className="w-8 h-[1px] bg-brand-green/10 mb-2"></div>
                  <span className="text-lg mb-6">{formatCurrency(p.price)}</span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); addToCart(p); }}
                    className="w-full bg-brand-green text-white py-4 uppercase text-[10px] tracking-[0.3em] hover:bg-brand-green/90 transition-colors shadow-lg"
                  >
                    Compre Já
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Care Guide Section (Inspired by Manual) */}
      <section className="py-24 bg-brand-cream/30 border-y border-brand-green/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-[10px] uppercase tracking-[0.5em] text-brand-green/60 mb-4 block">Cuidado Especializado</span>
            <h2 className="text-4xl md:text-5xl font-serif mb-6">Seu Ritual em 3 Passos</h2>
            <p className="text-brand-green/60 max-w-xl mx-auto text-sm leading-relaxed lowercase">
              Inspirado na ciência botânica e no autocuidado consciente, criamos um caminho simplificado para você atingir seus objetivos de bem-estar.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                step: "01",
                title: "Identifique sua Necessidade",
                desc: "Seja para hidratação profunda, relaxamento ou renovação celular, nossos ativos botânicos são selecionados para sua pele.",
                icon: <Search size={24} />
              },
              {
                step: "02",
                title: "Ritual Personalizado",
                desc: "Receba uma combinação exclusiva de sabonetes e óleos artesanais, formulados com pureza 100% orgânica para você.",
                icon: <Sparkles size={24} />
              },
              {
                step: "03",
                title: "Acompanhamento Real",
                desc: "Nossa comunidade oferece suporte contínuo para ajustar seu ritual conforme as estações e necessidades do seu corpo.",
                icon: <Heart size={24} />
              }
            ].map((item, i) => (
              <div key={i} className="flex flex-col items-center text-center group bg-white/20 p-8 rounded-2xl border border-white/40 shadow-sm hover:shadow-xl transition-all duration-700">
                <div className="w-16 h-16 rounded-full border border-brand-green/10 flex items-center justify-center mb-6 text-brand-green group-hover:bg-brand-green group-hover:text-white transition-all duration-500">
                  {item.icon}
                </div>
                <span className="text-[10px] font-bold tracking-widest text-brand-green/30 mb-2">{item.step}</span>
                <h3 className="text-xl font-serif mb-4 text-brand-green">{item.title}</h3>
                <p className="text-xs leading-relaxed opacity-60 px-4">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <button 
              onClick={() => {
                const el = document.getElementById('ritual-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="bg-brand-green text-white px-10 py-5 uppercase text-[10px] tracking-[0.3em] hover:bg-brand-green/90 transition-all shadow-xl rounded-full"
            >
              Começar meu Ritual agora
            </button>
          </div>
        </div>
      </section>

      {/* Personalized Therapeutic Soaps Section */}
      <section id="sabonetes-terapeuticos" className="py-32 bg-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[40vw] h-[40vw] bg-brand-cream/40 rounded-full -mr-[20vw] -mt-[20vw] blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-[30vw] h-[30vw] bg-brand-green/5 rounded-full -ml-[15vw] -mb-[15vw] blur-3xl"></div>
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-24 items-center">
            <div className="order-2 lg:order-1">
              <div className="relative">
                <div className="aspect-[4/5] overflow-hidden rounded-sm shadow-2xl relative z-10">
                  <img 
                    src="https://i.postimg.cc/RZKZ5SSg/Whats-App-Image-2026-05-06-at-22-21-03.jpg" 
                    className="w-full h-full object-cover grayscale-[20%] hover:grayscale-0 transition-all duration-1000"
                    alt="Sabonete Artesanal Terapêutico"
                  />
                </div>
                <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-brand-cream border border-brand-green/5 rounded-sm p-8 shadow-xl z-20 flex flex-col justify-center">
                   <div className="w-10 h-[1px] bg-brand-green mb-4"></div>
                   <p className="text-[10px] uppercase tracking-[0.3em] font-bold mb-4">Atendimento Humanizado</p>
                   <p className="text-xs italic leading-relaxed opacity-60">"Cada pele possui uma história. Cada fórmula também."</p>
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2">
              <span className="text-[10px] uppercase tracking-[0.6em] text-brand-green/60 mb-6 block font-bold">Exclusividade BotaniQ</span>
              <h2 className="text-5xl md:text-6xl font-serif mb-8 text-brand-green leading-[1.1]">
                Seu cuidado começa com uma <br />
                <span className="italic font-normal">fórmula única.</span>
              </h2>
              
              <div className="space-y-8 mb-12">
                <p className="text-brand-green/70 text-lg leading-relaxed lowercase">
                  Entendemos que cada pessoa possui necessidades únicas. Por isso, desenvolvemos sabonetes terapêuticos artesanais criados individualmente para você, após uma avaliação personalizada.
                </p>
                
                <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                  {[
                    { icon: <Droplets size={16} />, label: "Pele Sensível" },
                    { icon: <ShieldCheck size={16} />, label: "Dermatites" },
                    { icon: <Zap size={16} />, label: "Oleosidade" },
                    { icon: <Sun size={16} />, label: "Ressecamento" },
                    { icon: <Moon size={16} />, label: "Relaxamento" },
                    { icon: <Heart size={16} />, label: "Bem-estar Emocional" },
                    { icon: <Leaf size={16} />, label: "Rotina Terapêutica" },
                    { icon: <Feather size={16} />, label: "Cuidados Específicos" }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 group">
                      <div className="w-8 h-8 rounded-full border border-brand-green/10 flex items-center justify-center text-brand-green/40 group-hover:bg-brand-green group-hover:text-white transition-all duration-300">
                        {item.icon}
                      </div>
                      <span className="text-[10px] uppercase tracking-[0.2em] font-medium">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-8 bg-brand-cream/50 border border-brand-green/5 rounded-sm mb-12">
                <p className="text-[10px] uppercase tracking-[0.1em] opacity-40 italic leading-relaxed">
                  * Nosso objetivo é complementar o seu autocuidado de forma natural e personalizada. Este serviço não substitui orientações ou tratamentos médicos especializados.
                </p>
              </div>

              <a 
                href={`https://wa.me/${storeSettings.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent('Olá! Gostaria de realizar minha avaliação personalizada para um sabonete terapêutico exclusivo.')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-4 bg-brand-green text-white px-12 py-6 uppercase text-[10px] tracking-[0.4em] hover:bg-brand-green/90 transition-all shadow-2xl rounded-full"
              >
                <MessageCircle size={18} /> Iniciar Avaliação via WhatsApp
              </a>
            </div>
          </div>

          <div className="mt-40">
            <div className="text-center mb-24">
              <h3 className="text-3xl font-serif mb-4">O Caminho para a sua Fórmula</h3>
              <div className="w-16 h-[1px] bg-brand-green mx-auto opacity-20"></div>
            </div>

            <div className="grid md:grid-cols-6 gap-8 relative">
              <div className="absolute top-10 left-0 w-full h-[1px] bg-brand-green/10 hidden lg:block -z-0"></div>
              {[
                { icon: <MessageCircle />, title: "Contato", desc: "Primeiro passo via WhatsApp" },
                { icon: <Ear />, title: "Escuta", desc: "Avaliação da sua pele e rotina" },
                { icon: <Search />, title: "Análise", desc: "Identificação das necessidades" },
                { icon: <Sparkles />, title: "Criação", desc: "Desenvolvimento da fórmula" },
                { icon: <Flower2 />, title: "Produção", desc: "Artesanal e 100% natural" },
                { icon: <Truck />, title: "Entrega", desc: "Acompanhamento pós-uso" }
              ].map((step, i) => (
                <div key={i} className="flex flex-col items-center text-center relative z-10">
                  <div className="w-20 h-20 bg-white border border-brand-green/10 rounded-full flex items-center justify-center text-brand-green mb-6 shadow-sm hover:border-brand-green transition-all duration-500">
                    {step.icon}
                  </div>
                  <span className="text-[9px] font-bold tracking-widest text-brand-green/30 mb-2">{i + 1}</span>
                  <h4 className="text-xs uppercase tracking-[0.2em] font-bold mb-2">{step.title}</h4>
                  <p className="text-[10px] opacity-50 leading-relaxed px-2">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-40 grid md:grid-cols-4 gap-12 py-20 border-y border-brand-green/5">
             {[
               { title: "Escuta Individual", desc: "Entendemos seu bem-estar integral." },
               { title: "Pureza Botânica", desc: "Ervas e extratos selecionados." },
               { title: "Arte Manual", desc: "Cada barra é moldada com carinho." },
               { title: "Wellness Circular", desc: "Acompanhamento próximo e real." }
             ].map((val, i) => (
               <div key={i} className="text-center">
                 <h5 className="text-[10px] uppercase tracking-[0.4em] font-bold mb-4">{val.title}</h5>
                 <p className="text-xs italic opacity-50 leading-relaxed font-serif">{val.desc}</p>
               </div>
             ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="sobre" className="bg-white py-40 overflow-hidden relative">
        <div className="absolute top-0 left-0 w-full h-[1px] bg-brand-green/5"></div>
        <div className="max-w-7xl mx-auto px-12 grid grid-cols-1 lg:grid-cols-2 gap-32 items-center">
          <div className="relative order-2 lg:order-1">
            <div className="aspect-[4/5] bg-brand-cream relative z-10 w-full max-w-lg shadow-2xl">
              <img 
                src="https://i.postimg.cc/fyVMHZq2/Whats-App-Image-2026-05-06-at-22-22-49.jpg" 
                className="w-full h-full object-cover"
                alt="Processo Criativo"
              />
            </div>
            <div className="absolute -top-12 -right-12 w-64 h-80 bg-brand-green/5 -z-0"></div>
            <div className="absolute top-24 -left-12 -rotate-90 text-[10px] uppercase tracking-[1em] text-brand-green/20 whitespace-nowrap">
              Handcrafted with Intention
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <span className="text-[10px] uppercase tracking-[0.5em] mb-8 block opacity-40 font-bold">A Alma Botaniq</span>
            <h2 className="text-7xl mb-10 leading-[0.9] text-brand-green">
              Saboaria que <br />
              <span className="italic font-normal pl-12 md:pl-20">conecta você</span> <br />
              à terra.
            </h2>
            <div className="space-y-6 text-brand-green/70 text-sm leading-relaxed mb-12 font-sans max-w-lg">
              <p>A Botaniq nasceu do desejo de trazer os benefícios da botânica para o momento mais íntimo do dia: o banho. Utilizamos apenas ingredientes selecionados, óleos vegetais nobres e manteigas que nutrem a pele profundamente.</p>
              <p className="italic font-serif text-lg text-brand-green border-l-2 border-brand-green/10 pl-6 py-2">"Cada barra é uma celebração da natureza, moldada à mão com paciência e intenção."</p>
            </div>
            <div className="flex gap-16 border-t border-brand-green/5 pt-10">
              <div className="space-y-1">
                <span className="text-4xl font-serif block text-brand-terracotta">100%</span>
                <span className="text-[9px] uppercase tracking-[0.2em] opacity-40 font-bold">Artesanal</span>
              </div>
              <div className="space-y-1">
                <span className="text-4xl font-serif block text-brand-terracotta">Bio</span>
                <span className="text-[9px] uppercase tracking-[0.2em] opacity-40 font-bold">Sustentável</span>
              </div>
              <div className="space-y-1">
                <span className="text-4xl font-serif block text-brand-terracotta">Veg</span>
                <span className="text-[9px] uppercase tracking-[0.2em] opacity-40 font-bold">Botânica</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCartOpen(false)}
              className="fixed inset-0 bg-brand-green/30 backdrop-blur-md z-[70]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 35, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-brand-cream z-[80] shadow-2xl flex flex-col"
            >
              <div className="p-10 flex justify-between items-center border-b border-brand-green/5">
                <div className="flex items-center gap-4">
                  {checkoutStep !== 'cart' && (
                    <button onClick={() => setCheckoutStep(checkoutStep === 'summary' ? 'shipping' : 'cart')} className="p-2 hover:bg-brand-green/5 rounded-full">
                      <ChevronRight size={20} className="rotate-180" />
                    </button>
                  )}
                  <ShoppingBag size={20} className="text-brand-green" />
                  <span className="font-serif text-3xl text-brand-green">
                    {checkoutStep === 'cart' && 'Carrinho'}
                    {checkoutStep === 'shipping' && 'Entrega'}
                    {checkoutStep === 'summary' && 'Revisão'}
                  </span>
                </div>
                <button onClick={() => setIsCartOpen(false)} className="p-2 hover:bg-brand-green/5 rounded-full transition-colors">
                  <X size={28} />
                </button>
              </div>

              <div className="flex-grow overflow-y-auto p-10">
                {checkoutStep === 'cart' && (
                  <div className="space-y-10">
                    {cart.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center py-24 opacity-30 text-center">
                        <ShoppingBag size={64} className="mb-6 stroke-[1px]" />
                        <p className="uppercase text-[10px] tracking-[0.4em]">Seu Carrinho está Vazio</p>
                      </div>
                    ) : (
                      cart.map(item => (
                        <div key={item.id} className="flex gap-8 group">
                          <div className="w-24 h-32 luxury-card">
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-grow flex flex-col justify-center">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-serif text-xl">{item.name}</h4>
                              <button onClick={() => removeFromCart(item.id!)} className="opacity-30 hover:opacity-100 transition-opacity p-1">
                                <X size={16} />
                              </button>
                            </div>
                            <p className="text-xs opacity-50 mb-6 italic">{formatCurrency(item.price)}</p>
                            <div className="flex items-center gap-6">
                              <div className="flex items-center gap-4 bg-brand-green/5 rounded-full px-4 py-1">
                                <button onClick={() => updateQuantity(item.id!, -1)} className="p-1 opacity-60 hover:opacity-100"><Minus size={12} /></button>
                                <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                                <button onClick={() => updateQuantity(item.id!, 1)} className="p-1 opacity-60 hover:opacity-100"><Plus size={12} /></button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {checkoutStep === 'shipping' && (
                  <div className="space-y-10">
                    <div className="space-y-6">
                      <h5 className="text-[10px] uppercase tracking-[0.4em] font-bold opacity-30 pb-2 border-b border-brand-green/5">Dados Pessoais</h5>
                      <div className="space-y-4">
                        <input placeholder="Nome Completo" className="luxury-input text-lg" value={customerData.name} onChange={e => setCustomerData({...customerData, name: e.target.value})} />
                        <input placeholder="WhatsApp / Telefone" className="luxury-input" value={customerData.phone} onChange={e => setCustomerData({...customerData, phone: e.target.value})} />
                      </div>
                    </div>
                    <div className="space-y-6">
                      <h5 className="text-[10px] uppercase tracking-[0.4em] font-bold opacity-30 pb-2 border-b border-brand-green/5">Endereço</h5>
                      <div className="grid grid-cols-2 gap-8">
                        <div className="relative">
                          <input 
                            placeholder="CEP" 
                            className="luxury-input" 
                            value={customerData.zip} 
                            onChange={e => {
                              const val = e.target.value.replace(/\D/g, '');
                              setCustomerData({...customerData, zip: val});
                              if (val.length === 8) {
                                handleZipBlur();
                              }
                            }} 
                            onBlur={handleZipBlur} 
                          />
                        </div>
                        <input placeholder="Cidade" className="luxury-input" value={customerData.city} onChange={e => setCustomerData({...customerData, city: e.target.value})} />
                      </div>
                      <input placeholder="Rua / Logradouro" className="luxury-input" value={customerData.street} onChange={e => setCustomerData({...customerData, street: e.target.value})} />
                      <div className="grid grid-cols-2 gap-8">
                        <input placeholder="Número" className="luxury-input" value={customerData.number} onChange={e => setCustomerData({...customerData, number: e.target.value})} />
                        <input placeholder="Complemento" className="luxury-input" value={customerData.complement} onChange={e => setCustomerData({...customerData, complement: e.target.value})} />
                      </div>
                    </div>
                  </div>
                )}

                {checkoutStep === 'summary' && (
                  <div className="space-y-10">
                    <div className="p-8 bg-brand-green text-brand-cream space-y-6 rounded-sm shadow-xl">
                      <div className="flex justify-between border-b border-white/10 pb-4">
                        <span className="text-[9px] uppercase tracking-[0.3em] opacity-60">Pedido</span>
                        <span className="text-sm italic">{cart.reduce((a,b) => a + b.quantity, 0)} itens</span>
                      </div>
                      <div className="flex justify-between border-b border-white/10 pb-4 text-brand-cream">
                         <span className="text-[9px] uppercase tracking-[0.3em] opacity-60">Destinatário</span>
                         <div className="text-right">
                           <p className="text-xs font-bold">{customerData.name}</p>
                           <p className="text-[10px] opacity-60">{customerData.phone}</p>
                         </div>
                      </div>
                      <div className="flex justify-between border-b border-white/10 pb-4 text-brand-cream">
                         <span className="text-[9px] uppercase tracking-[0.3em] opacity-60">Entrega</span>
                         <div className="text-right">
                           <p className="text-xs">{customerData.street}, {customerData.number}</p>
                           <p className="text-[10px] opacity-60">{customerData.city}, {customerData.state} - {customerData.zip}</p>
                         </div>
                      </div>
                      <div className="flex justify-between text-brand-cream">
                        <span className="text-[9px] uppercase tracking-[0.3em] opacity-60">Frete Correios</span>
                        <div className="text-right">
                          <span className="text-sm font-medium block">{formatCurrency(shippingInfo.price)}</span>
                          <span className="text-[9px] opacity-60">Entrega em {shippingInfo.days} dias</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6">
                      <h5 className="text-[10px] uppercase tracking-[0.4em] font-bold opacity-30 pb-2 border-b border-brand-green/5">Carrinho</h5>
                      <div className="space-y-4">
                        {cart.map(item => (
                          <div key={item.id} className="flex justify-between items-center text-sm">
                            <span className="font-serif text-lg">{item.quantity}x {item.name}</span>
                            <span className="opacity-60 tabular-nums">{formatCurrency(item.price * item.quantity)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-10 bg-white border-t border-brand-green/5 shadow-[0_-20px_40px_rgba(45,71,57,0.03)]">
                <div className="space-y-4 mb-4">
                  <div className="flex gap-4">
                    <input 
                      placeholder="Cupom de Desconto" 
                      className="luxury-input !py-2.5 !text-[11px]" 
                      value={couponCode} 
                      onChange={e => setCouponCode(e.target.value)} 
                    />
                    <button 
                      onClick={handleApplyCoupon}
                      className="px-6 py-2.5 bg-brand-green text-white text-[10px] uppercase tracking-widest font-bold"
                    >
                      Aplicar
                    </button>
                  </div>
                  {couponError && <p className="text-[9px] text-red-500 uppercase tracking-widest pl-2">{couponError}</p>}
                  {appliedCoupon && <p className="text-[9px] text-brand-green uppercase tracking-widest pl-2">Cupom {appliedCoupon.code} aplicado! ✨</p>}
                </div>

                <div className="space-y-4 mb-8">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] uppercase tracking-[0.3em] opacity-40">Subtotal</span>
                    <span className="text-sm font-medium tabular-nums">{formatCurrency(cartTotal)}</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between items-center text-brand-terracotta">
                      <span className="text-[10px] uppercase tracking-[0.3em]">Desconto</span>
                      <span className="text-sm font-medium tabular-nums">- {formatCurrency(discountAmount)}</span>
                    </div>
                  )}
                  {shippingLoading ? (
                    <div className="flex justify-between items-center animate-pulse">
                      <span className="text-[10px] uppercase tracking-[0.3em] opacity-40">Calculando frete...</span>
                      <div className="w-16 h-4 bg-brand-green/10 rounded"></div>
                    </div>
                  ) : shippingInfo.price > 0 && (
                    <div className="flex justify-between items-center text-emerald-600">
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-[0.3em] font-bold">Frete Correios</span>
                        <span className="text-[8px] opacity-60">Entrega em {shippingInfo.days} dias</span>
                      </div>
                      <span className="text-sm font-medium tabular-nums">{formatCurrency(shippingInfo.price)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-4 border-t border-brand-green/10">
                    <span className="font-serif text-xl text-brand-green">Total</span>
                    <span className="text-2xl font-medium text-brand-green tabular-nums">{formatCurrency(finalTotal)}</span>
                  </div>
                </div>

                {checkoutStep === 'cart' && (
                  <button 
                    disabled={cart.length === 0}
                    onClick={() => setCheckoutStep('shipping')}
                    className="w-full luxury-button flex justify-between items-center gap-4 disabled:opacity-30 group"
                  >
                    <span className="text-[11px] uppercase tracking-[0.3em]">Continuar Entrega</span>
                    <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                  </button>
                )}

                {checkoutStep === 'shipping' && (
                  <button 
                    disabled={!customerData.name || !customerData.phone || !customerData.zip}
                    onClick={() => setCheckoutStep('summary')}
                    className="w-full luxury-button flex justify-between items-center gap-4 disabled:opacity-30 group"
                  >
                    <span className="text-[11px] uppercase tracking-[0.3em]">Revisar Pedido</span>
                    <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                  </button>
                )}

                {checkoutStep === 'summary' && (
                  <button 
                    onClick={handleFinish}
                    className="w-full luxury-button bg-brand-green/95 flex justify-center items-center gap-4 group"
                  >
                    <div className="flex items-center gap-3">
                      <Smartphone size={18} />
                      <span className="text-[11px] uppercase tracking-[0.3em]">Finalizar Via WhatsApp</span>
                    </div>
                  </button>
                )}
                
                <p className="text-[9px] text-center mt-6 opacity-30 uppercase tracking-[0.4em]">Confirmação instantânea com a loja</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
