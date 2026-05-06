import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, setDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Product, Settings, Order, Coupon } from '../types';
import { Plus, Trash2, Edit2, Save, X, Smartphone, List, Settings as SettingsIcon, Package, LogIn, Ticket } from 'lucide-react';
import { formatCurrency, cn } from '../lib/utils';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult } from 'firebase/auth';

const ADMIN_EMAILS = [
  'jessicajonas2208@gmail.com',
  'botaniq.oficial@gmail.com',
  'dani@x.com'
];

export default function Admin() {
  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'settings' | 'coupons'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [user, setUser] = useState(auth.currentUser);
  const [notAdminError, setNotAdminError] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Auth Form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Form states ...
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  
  const [productForm, setProductForm] = useState<Partial<Product>>({
    name: '', price: 0, description: '', image: '', category: 'Essências', stock: 10, active: true
  });

  const [couponForm, setCouponForm] = useState<Partial<Coupon>>({
    code: '', value: 0, isActive: true
  });

  useEffect(() => {
    console.log("Admin: Iniciando verificação de segurança...");
    
    // Check for redirect result from Google login
    getRedirectResult(auth).then((result) => {
      if (result) {
        console.log("Admin: Redirect login success", result.user.email);
        verifyAndFetch(result.user);
      }
    }).catch((error) => {
      console.error("Admin: Redirect login error", error);
      setLoginError("Erro no retorno do login: " + error.message);
    });

    const unsubscribe = onAuthStateChanged(auth, u => {
      setUser(u);
      if (u) {
        const lowerEmail = (u.email || '').toLowerCase().trim();
        const isAdmin = ADMIN_EMAILS.some(e => e.toLowerCase().trim() === lowerEmail);
        if (isAdmin) {
          setNotAdminError(false);
          fetchAll();
        } else {
          console.warn("Admin: Usuário logado mas não é administrador", lowerEmail);
          setNotAdminError(true);
          setIsInitializing(false);
          setLoading(false);
        }
      } else {
        setIsInitializing(false);
        setNotAdminError(false);
      }
    }, (error) => {
      console.error("Admin: Auth error", error);
      setIsInitializing(false);
    });
    
    // Safety fallback to hide loader
    const timer = setTimeout(() => setIsInitializing(false), 3000);
    
    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const safeGet = async (coll: string) => {
        try {
          return await getDocs(collection(db, coll));
        } catch (e) {
          console.warn(`Erro ao buscar ${coll}. Pode estar vazio ou sem permissão.`);
          return { docs: [], empty: true };
        }
      };

      const [pSnap, oSnap, sSnap, cSnap] = await Promise.all([
        safeGet('products'),
        safeGet('orders'),
        safeGet('settings'),
        safeGet('coupons')
      ]);

      setProducts((pSnap as any).docs.map((d: any) => ({ id: d.id, ...d.data() } as Product)));
      setOrders((oSnap as any).docs.map((d: any) => ({ id: d.id, ...d.data() } as Order)).sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
      
      if (!(sSnap as any).empty) {
        setSettings((sSnap as any).docs[0].data() as Settings);
      } else {
        setSettings({
          whatsapp: '', instagram: '', tiktok: '', facebook: '',
          storeAddress: '', storeCep: ''
        });
      }

      setCoupons((cSnap as any).docs.map((d: any) => ({ id: d.id, ...d.data() } as Coupon)));
    } catch (e: any) {
      console.error("Admin: Fetch error", e);
    } finally {
      setLoading(false);
      setIsInitializing(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setLoading(true);
    setLoginError('');
    try {
      if (isRegistering) {
        // First check if email is in whitelist
        const lowerEmail = email.toLowerCase().trim();
        if (!ADMIN_EMAILS.some(e => e.toLowerCase().trim() === lowerEmail)) {
          throw new Error("Este email não está autorizado como administrador.");
        }
        
        const { createUserWithEmailAndPassword } = await import('firebase/auth');
        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await verifyAndFetch(userCredential.user);
      } else {
        const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
        await verifyAndFetch(userCredential.user);
      }
    } catch (error: any) {
      console.error("Auth Exception:", error.code);
      if (error.code === 'auth/network-request-failed') {
        const errorMsg = "Erro de Conexão: O Firebase não pôde ser alcançado. Isso pode ocorrer por bloqueio de cookies no navegador ou domínios não autorizados.";
        console.error("Firebase Network Error. Domain:", window.location.hostname);
        setLoginError(errorMsg);
      } else if (error.code === 'auth/email-already-in-use') {
        setLoginError("Este email já possui conta. Tente fazer login.");
      } else if (error.code === 'auth/weak-password') {
        setLoginError("A senha deve ter pelo menos 6 caracteres.");
      } else if (error.code === 'auth/invalid-credential') {
        setLoginError("Email ou Senha incorretos.");
      } else {
        setLoginError(error.message || "Erro desconhecido ao autenticar.");
      }
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    setLoginError('');
    try {
      const provider = new GoogleAuthProvider();
      // Try popup first
      try {
        const result = await signInWithPopup(auth, provider);
        await verifyAndFetch(result.user);
      } catch (popupError: any) {
        console.warn("Admin: Popup closed or blocked, trying redirect...", popupError.code);
        // Fallback to redirect if popup fails or is blocked
        await signInWithRedirect(auth, provider);
      }
    } catch (error: any) {
      if (error.code === 'auth/network-request-failed') {
        setLoginError("Erro de Conexão Google. Tente novamente.");
      } else {
        setLoginError("Erro Google: " + error.message);
      }
      setLoading(false);
    }
  };

  const verifyAndFetch = async (u: any) => {
    const lowerEmail = (u.email || '').toLowerCase().trim();
    const isAdmin = ADMIN_EMAILS.some(e => e.toLowerCase().trim() === lowerEmail);
    if (isAdmin) {
      setNotAdminError(false);
      await fetchAll();
    } else {
      setNotAdminError(true);
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    await signOut(auth);
    setUser(null);
    setProducts([]);
    setOrders([]);
    setCoupons([]);
    setSettings(null);
    setNotAdminError(false);
    setLoading(false);
  };

  const saveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id!), productForm);
      } else {
        await addDoc(collection(db, 'products'), { ...productForm, createdAt: new Date().toISOString() });
      }
      setIsModalOpen(false);
      setEditingProduct(null);
      await fetchAll();
    } catch (e) {
      alert("Erro ao salvar produto");
      setLoading(false);
    }
  };

  const deleteProduct = async (id: string) => {
    if (confirm("Tem certeza que deseja excluir o produto?")) {
      setLoading(true);
      try {
        await deleteDoc(doc(db, 'products', id));
        await fetchAll();
      } catch (e) {
        alert("Erro ao excluir");
        setLoading(false);
      }
    }
  };

  const saveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingCoupon) {
        await updateDoc(doc(db, 'coupons', editingCoupon.id!), couponForm);
      } else {
        await addDoc(collection(db, 'coupons'), { ...couponForm, createdAt: new Date().toISOString() });
      }
      setIsCouponModalOpen(false);
      setEditingCoupon(null);
      await fetchAll();
    } catch (e) {
      alert("Erro ao salvar cupom");
      setLoading(false);
    }
  };

  const deleteCoupon = async (id: string) => {
    if (confirm("Deseja excluir este cupom?")) {
      setLoading(true);
      try {
        await deleteDoc(doc(db, 'coupons', id));
        await fetchAll();
      } catch (e) {
        alert("Erro ao excluir");
        setLoading(false);
      }
    }
  };

  const seed = async () => {
    setLoading(true);
    try {
      const initial = [
        { name: "Mel e Leite de Cabra", price: 15.00, category: "Óleos de Banho", image: "https://images.unsplash.com/photo-1600857062241-98e5dba7f214?w=600", description: "Óleo de banho em barra nutritivo.", active: true, stock: 50 },
        { name: "Açafrão e Calêndula", price: 15.00, category: "Óleos de Banho", image: "https://images.unsplash.com/photo-1544467329-3091df010260?w=600", description: "Propriedades anti-inflamatórias.", active: true, stock: 50 },
        { name: "Alecrim e Melaleuca", price: 15.00, category: "Óleos de Banho", image: "https://images.unsplash.com/photo-1590439474866-b97184282bb9?w=600", description: "Refrescante e revigorante.", active: true, stock: 50 },
        { name: "Kit Lilian", price: 179.00, category: "Kits", image: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?w=600", description: "Cachepô e mix de óleos.", active: true, stock: 10 }
      ];
      for (const p of initial) {
        await addDoc(collection(db, 'products'), { ...p, createdAt: new Date().toISOString() });
      }
      await fetchAll();
    } catch (e) {
      alert("Erro ao gerar dados");
      setLoading(false);
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-brand-cream gap-6">
        <div className="w-12 h-12 border-4 border-brand-green/10 border-t-brand-green rounded-full animate-spin"></div>
        <div className="text-[10px] uppercase tracking-[0.5em] text-brand-green font-bold">Verificando Credenciais...</div>
        <button 
          onClick={() => setIsInitializing(false)} 
          className="text-[8px] uppercase tracking-[0.2em] opacity-40 hover:opacity-100 transition-opacity underline underline-offset-4"
        >
          Clique aqui se demorar muito
        </button>
      </div>
    );
  }

  if (!user || notAdminError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-cream px-4 text-center">
        {loading && (
          <div className="fixed inset-0 z-[200] bg-white/60 backdrop-blur-sm flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-brand-green/10 border-t-brand-green rounded-full animate-spin"></div>
          </div>
        )}
        <div className="max-w-md w-full bg-white p-12 border border-brand-green/10 shadow-2xl">
          <div className="mb-8 font-serif text-4xl tracking-widest uppercase text-brand-terracotta">Painel Admin</div>
          
          {notAdminError ? (
            <div className="mb-12 space-y-6">
              <div className="p-4 bg-red-50 border border-red-100 rounded-sm text-left">
                <p className="text-red-600 text-[10px] font-bold uppercase tracking-wider mb-2">Acesso Restrito</p>
                <p className="opacity-70 text-[11px] leading-relaxed">
                  O email <span className="font-bold underline text-brand-green">{user?.email}</span> não está na lista de administradores autorizados.
                </p>
                <p className="mt-4 text-[9px] opacity-40 italic">
                  Se este for o seu email e você não consegue entrar, verifique se não há espaços em branco ao digitar.
                </p>
              </div>
              <button 
                onClick={logout} 
                className="luxury-button w-full !bg-brand-green !text-white"
              >
                Entrar com outra Conta
              </button>
            </div>
          ) : (
            <div className="space-y-12">
              <p className="opacity-60 text-sm leading-relaxed px-4">
                {isRegistering ? "Crie sua conta administrativa para gerenciar a Botaniq." : "Identifique-se para acessar o ritual de gestão da Botaniq."}
              </p>
              <form onSubmit={handleAuth} className="space-y-8">
                {loginError && (
                  <div className="p-3 bg-red-50 text-red-600 text-[10px] font-bold uppercase tracking-widest border border-red-100">
                    {loginError}
                  </div>
                )}
                <div className="text-left space-y-2">
                  <label className="text-[9px] uppercase tracking-[0.2em] font-bold opacity-40 pl-1">Email</label>
                  <input 
                    type="email" 
                    required 
                    autoComplete="email"
                    className="luxury-input !py-4" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                    placeholder="admin@botaniq.com"
                  />
                </div>
                <div className="text-left space-y-2">
                  <label className="text-[9px] uppercase tracking-[0.2em] font-bold opacity-40 pl-1">Senha</label>
                  <input 
                    type="password" 
                    required 
                    autoComplete={isRegistering ? "new-password" : "current-password"}
                    className="luxury-input !py-4" 
                    value={password} 
                    onChange={e => setPassword(e.target.value)} 
                    placeholder="••••••••"
                  />
                </div>
                <button type="submit" disabled={loading} className="luxury-button w-full flex items-center justify-center gap-4 mt-4 !py-4 disabled:opacity-50">
                  <LogIn size={18} /> {isRegistering ? 'Cadastrar e Acessar' : 'Acessar Painel'}
                </button>
                
                <button 
                  type="button"
                  onClick={() => setIsRegistering(!isRegistering)}
                  className="text-[9px] uppercase tracking-widest opacity-40 hover:opacity-100 underline decoration-brand-terracotta underline-offset-4 font-bold"
                >
                  {isRegistering ? 'Já tenho conta? Entrar' : 'Primeiro acesso? Cadastre-se'}
                </button>
              </form>

              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-brand-green/10"></div></div>
                <div className="relative flex justify-center text-[8px] uppercase tracking-widest"><span className="bg-white px-4 opacity-30 italic">Atalhos</span></div>
              </div>

              <button 
                onClick={loginWithGoogle}
                disabled={loading}
                className="w-full py-4 border border-brand-green/20 text-brand-green text-[10px] uppercase tracking-widest font-bold flex items-center justify-center gap-3 hover:bg-brand-green/5 transition-colors disabled:opacity-50"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4" alt="" />
                Entrar com Google
              </button>
              
              <div className="pt-6 border-t border-brand-green/5">
                <p className="text-[9px] opacity-30 leading-relaxed max-w-[250px] mx-auto italic">
                  Acesso exclusivo para administradores autorizados.
                </p>
              </div>
            </div>
          )}

          {/* Debug Status */}
          <div className="mt-8 p-4 bg-brand-green/5 border border-brand-green/10 rounded text-[8px] text-left">
            <p className="uppercase tracking-widest font-bold mb-1 opacity-40 text-brand-green">Debug Status:</p>
            <p className="opacity-60">Status: {loading ? 'Sincronizando' : 'Pronto'}</p>
            <p className="opacity-60">Auth: {user ? user.email : 'Nenhum usuário logado'}</p>
            <p className="opacity-60 text-brand-terracotta">ID do Banco: gen-lang-client-0794646135</p>
            <p className="opacity-40 italic mt-1 overflow-hidden truncate">Host: {window.location.hostname}</p>
            {user && (
              <button 
                onClick={logout}
                className="mt-2 text-brand-terracotta underline hover:no-underline uppercase tracking-widest font-bold block"
              >
                Limpar Sessão (Logout)
              </button>
            )}
          </div>
          
          <p className="mt-12 text-[9px] uppercase tracking-[0.4em] opacity-20 font-bold">
            Botaniq Management Portal
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-cream pt-32 pb-20 px-8">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-6">
        <div>
          <h1 className="text-5xl font-serif mb-2 text-brand-green italic">Painel de Gestão</h1>
          <p className="text-[10px] uppercase tracking-[0.5em] opacity-40 text-brand-green">Botaniq Administrative Suite</p>
        </div>
        <div className="flex flex-wrap gap-4">
          <button 
            onClick={() => { setLoading(true); fetchAll(); }}
            className="text-[10px] uppercase tracking-widest bg-brand-green text-white px-6 py-2 hover:bg-brand-green/90 transition-colors font-bold rounded-sm shadow-md"
          >
            Sincronizar Banco
          </button>
          <button onClick={seed} className="text-[10px] uppercase tracking-widest border border-brand-green/10 px-4 py-2 hover:bg-brand-green/5 transition-colors">Gerar Produtos Iniciais</button>
          <button onClick={logout} className="text-[10px] uppercase tracking-widest border border-brand-green/10 px-4 py-2 hover:bg-red-50 text-red-600 transition-colors font-bold">Encerrar Sessão</button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto flex gap-6 mb-16 border-b border-brand-green/5 overflow-x-auto no-scrollbar">
        {(['products', 'orders', 'coupons', 'settings'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex items-center gap-2 px-8 py-5 uppercase text-[10px] tracking-[0.3em] font-bold transition-all border-b-2",
              activeTab === tab ? "border-brand-terracotta text-brand-terracotta opacity-100" : "border-transparent opacity-40 hover:opacity-100"
            )}
          >
            {tab === 'products' && <Package size={14} />}
            {tab === 'orders' && <List size={14} />}
            {tab === 'coupons' && <Ticket size={14} />}
            {tab === 'settings' && <SettingsIcon size={14} />}
            {tab === 'products' ? 'Produtos' : tab === 'orders' ? 'Pedidos' : tab === 'coupons' ? 'Cupons' : 'Ajustes'}
          </button>
        ))}
      </div>

      <div className="max-w-7xl mx-auto">
        {activeTab === 'products' && (
          <div>
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-3xl font-serif text-brand-green italic">Catálogo de Produtos</h2>
              <button 
                onClick={() => { setEditingProduct(null); setProductForm({ name: '', price: 0, description: '', image: '', category: 'Essências', stock: 10, active: true }); setIsModalOpen(true); }}
                className="luxury-button !bg-brand-terracotta !text-white !py-3 !px-10 text-[11px] flex items-center gap-3 uppercase tracking-widest font-bold shadow-xl"
              >
                <Plus size={18} /> Novo Produto
              </button>
            </div>

            {products.length === 0 ? (
              <div className="bg-white p-32 text-center border border-brand-green/10 flex flex-col items-center">
                <Package className="opacity-10 mb-8" size={64} />
                <h3 className="text-2xl font-serif text-brand-green mb-4">Sua vitrine está vazia</h3>
                <p className="text-[10px] uppercase tracking-widest opacity-40 mb-10">Comece adicionando seu primeiro produto literário.</p>
                <button 
                  onClick={() => { setEditingProduct(null); setProductForm({ name: '', price: 0, description: '', image: '', category: 'Essências', stock: 10, active: true }); setIsModalOpen(true); }}
                  className="luxury-button !py-4 !px-12 text-[11px] uppercase tracking-[0.3em] font-bold"
                >
                  <Plus size={18} className="inline mr-2" /> Cadastrar Meu Primeiro Produto
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {products.map(p => (
                  <div key={p.id} className="luxury-card bg-white flex flex-col h-full group border border-brand-green/5">
                    <div className="aspect-[4/5] relative flex-shrink-0 overflow-hidden">
                      <img src={p.image} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                      <div className="absolute top-4 right-4 flex gap-2">
                        <button onClick={() => { setEditingProduct(p); setProductForm(p); setIsModalOpen(true); }} className="p-3 bg-white/90 shadow-xl hover:bg-white transition-colors text-brand-green"><Edit2 size={16} /></button>
                        <button onClick={() => deleteProduct(p.id!)} className="p-3 bg-white/90 shadow-xl text-red-600 hover:bg-red-50 transition-colors"><Trash2 size={16} /></button>
                      </div>
                    </div>
                    <div className="p-8 flex-grow flex flex-col justify-between">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.2em] opacity-40 mb-3 italic">{p.category}</p>
                        <h3 className="text-2xl font-serif mb-4 text-brand-green">{p.name}</h3>
                        <p className="text-xl font-medium">{formatCurrency(p.price)}</p>
                      </div>
                      <div className="mt-8 pt-6 border-t border-brand-green/5 flex justify-between items-center text-[10px] uppercase tracking-[0.3em] font-bold opacity-60">
                        <span>Estoque: {p.stock}</span>
                        <span className={p.active ? "text-brand-green" : "text-red-400"}>{p.active ? 'Visível' : 'Oculto'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'coupons' && (
          <div>
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-3xl font-serif text-brand-green italic">Gestão de Cupons</h2>
              <button 
                onClick={() => { setEditingCoupon(null); setCouponForm({ code: '', value: 0, isActive: true }); setIsCouponModalOpen(true); }}
                className="luxury-button !py-2.5 !px-8 text-[10px] flex items-center gap-3 uppercase tracking-widest"
              >
                <Plus size={16} /> Novo Cupom
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {coupons.map(c => (
                <div key={c.id} className="luxury-card bg-white p-8 flex flex-col justify-between border-l-4 border-l-brand-terracotta">
                  <div>
                    <div className="flex justify-between items-start mb-6">
                      <span className="text-2xl font-mono font-bold text-brand-terracotta tracking-tighter bg-brand-terracotta/5 px-3 py-1 uppercase">{c.code}</span>
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingCoupon(c); setCouponForm(c); setIsCouponModalOpen(true); }} className="p-2 hover:bg-brand-green/5 text-brand-green"><Edit2 size={14} /></button>
                        <button onClick={() => deleteCoupon(c.id!)} className="p-2 hover:bg-red-50 text-red-600"><Trash2 size={14} /></button>
                      </div>
                    </div>
                    <p className="text-3xl font-serif mb-2">{c.value > 100 ? formatCurrency(c.value) : `${c.value}% OFF`}</p>
                    <p className="text-[10px] uppercase tracking-widest opacity-40">Valor do Desconto</p>
                  </div>
                  <div className="mt-8 pt-6 border-t border-brand-green/5 flex justify-between items-center">
                    <span className={cn(
                      "text-[9px] uppercase tracking-widest font-bold px-3 py-1 rounded-full",
                      c.isActive ? "bg-brand-green/10 text-brand-green" : "bg-red-50 text-red-600"
                    )}>
                      {c.isActive ? 'Válido' : 'Inativo'}
                    </span>
                    <span className="text-[9px] opacity-30 italic">Criado em {new Date(c.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="space-y-10">
            <h2 className="text-3xl font-serif text-brand-green italic">Histórico de Pedidos</h2>
            <div className="grid grid-cols-1 gap-8">
              {orders.map(order => (
                <div key={order.id} className="luxury-card p-10 bg-white flex flex-col md:flex-row justify-between gap-12">
                  <div className="flex-grow space-y-6">
                    <div className="flex items-center gap-6">
                      <span className="text-[10px] uppercase tracking-widest bg-brand-green/5 px-3 py-1.5 font-bold">#{order.id?.slice(-6)}</span>
                      <span className="text-sm font-medium opacity-60">{new Date(order.createdAt).toLocaleDateString('pt-BR')}</span>
                      <span className={cn(
                        "text-[10px] uppercase tracking-widest font-bold px-3 py-1.5",
                        order.status === 'pending' ? "bg-amber-50 text-amber-700" : "bg-brand-green/10 text-brand-green"
                      )}>
                        {order.status === 'pending' ? 'Pendente' : 'Concluído'}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-2xl font-serif text-brand-green mb-1">{order.customerName}</h4>
                      <p className="text-sm opacity-50 flex items-center gap-2 italic"><Smartphone size={14} /> {order.customerPhone}</p>
                    </div>
                    <div className="text-sm space-y-1 opacity-70 border-l-2 border-brand-green/5 pl-6 py-2">
                       <p className="font-medium">{order.address.street}, {order.address.number}</p>
                      <p>{order.address.neighborhood}, {order.address.city} - {order.address.state}</p>
                      <p className="text-[10px] tracking-widest">CEP: {order.address.zip}</p>
                    </div>
                    
                    <div className="flex gap-4 pt-4 border-t border-brand-green/5">
                      <button 
                        onClick={async () => {
                          const newStatus = order.status === 'pending' ? 'completed' : 'pending';
                          await updateDoc(doc(db, 'orders', order.id!), { status: newStatus });
                          fetchAll();
                        }}
                        className="text-[10px] uppercase tracking-widest font-bold text-brand-terracotta hover:underline"
                      >
                        Mudar para {order.status === 'pending' ? 'Concluído' : 'Pendente'}
                      </button>
                      <button 
                        onClick={async () => {
                          if (confirm("Excluir este pedido permanentemente?")) {
                            await deleteDoc(doc(db, 'orders', order.id!));
                            fetchAll();
                          }
                        }}
                        className="text-[10px] uppercase tracking-widest font-bold text-red-500 hover:underline"
                      >
                        Excluir Pedido
                      </button>
                    </div>
                  </div>
                  <div className="md:w-80 bg-brand-green/5 p-8 flex flex-col justify-between rounded-sm relative">
                    {order.couponCode && (
                       <div className="absolute top-0 right-8 -translate-y-1/2 bg-brand-terracotta text-white text-[8px] font-bold px-3 py-1 uppercase tracking-widest rounded-full shadow-lg">
                        Cupom: {order.couponCode}
                      </div>
                    )}
                    <div className="space-y-4">
                      <h5 className="text-[10px] uppercase tracking-[0.3em] opacity-40 font-bold border-b border-brand-green/10 pb-2">Itens do Pedido</h5>
                      {order.items.map(item => (
                        <div key={item.id} className="flex justify-between text-xs items-center">
                          <span className="font-medium">{item.quantity}x {item.name}</span>
                          <span className="opacity-60 tabular-nums">{formatCurrency(item.price * item.quantity)}</span>
                        </div>
                      ))}
                      {order.discount > 0 && (
                        <div className="flex justify-between text-xs items-center text-brand-terracotta pt-2 border-t border-brand-green/5">
                          <span>Desconto</span>
                          <span className="tabular-nums">-{formatCurrency(order.discount)}</span>
                        </div>
                      )}
                    </div>
                    <div className="pt-8 mt-8 border-t border-brand-green/10 flex justify-between items-center font-bold">
                      <span className="text-[10px] uppercase tracking-widest opacity-40">Total Geral</span>
                      <span className="text-2xl font-serif text-brand-green tabular-nums">{formatCurrency(order.total)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-12 max-w-4xl">
            <h2 className="text-3xl font-serif text-brand-green italic">Configurações da Experiência</h2>
            <form 
              onSubmit={async (e) => {
                e.preventDefault();
                const sRef = doc(db, 'settings', 'main');
                await setDoc(sRef, settings);
                alert("Configurações persistidas com sucesso!");
              }}
              className="bg-white p-12 border border-brand-green/10 shadow-xl space-y-12"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                <div className="space-y-8">
                  <h3 className="text-[10px] uppercase tracking-[0.4em] font-bold opacity-30 border-b border-brand-green/5 pb-2">Identidade Digital</h3>
                  <div className="space-y-6">
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase tracking-widest opacity-40">WhatsApp Business</label>
                      <input placeholder="Ex: 5541999999999" className="luxury-input" value={settings?.whatsapp || ''} onChange={e => setSettings({...settings!, whatsapp: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase tracking-widest opacity-40">Instagram</label>
                      <input placeholder="@botaniq.oficial" className="luxury-input" value={settings?.instagram || ''} onChange={e => setSettings({...settings!, instagram: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase tracking-widest opacity-40">TikTok</label>
                      <input placeholder="@botaniq.oficial" className="luxury-input" value={settings?.tiktok || ''} onChange={e => setSettings({...settings!, tiktok: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase tracking-widest opacity-40">Facebook</label>
                      <input placeholder="Página da Loja" className="luxury-input" value={settings?.facebook || ''} onChange={e => setSettings({...settings!, facebook: e.target.value})} />
                    </div>
                  </div>
                </div>
                <div className="space-y-8">
                  <h3 className="text-[10px] uppercase tracking-[0.4em] font-bold opacity-30 border-b border-brand-green/5 pb-2">Logística</h3>
                  <div className="space-y-6">
                    <div className="space-y-1">
                      <label className="text-[9px] uppercase tracking-widest opacity-40">CEP de Origem (Cálculo de Frete)</label>
                      <input placeholder="83280000" className="luxury-input" value={settings?.storeCep || ''} onChange={e => setSettings({...settings!, storeCep: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[9px] uppercase tracking-widest opacity-40">Endereço de Exibição (Rodapé)</label>
                      <textarea 
                        rows={4}
                        placeholder="Rua Cambará 1096, Figueira - PR" 
                        className="luxury-input resize-none" 
                        value={settings?.storeAddress || ''} 
                        onChange={e => setSettings({...settings!, storeAddress: e.target.value})} 
                      />
                    </div>
                  </div>
                </div>
              </div>
              <button className="luxury-button w-full py-5 text-[11px] uppercase tracking-[0.3em]">Salvar Alterações Globais</button>
            </form>
          </div>
        )}
      </div>

      {/* Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-brand-green/80 backdrop-blur-md p-6">
          <div className="bg-brand-cream w-full max-w-2xl max-h-[90vh] overflow-y-auto p-12 border-8 border-white shadow-2xl relative">
            <div className="flex justify-between items-center mb-12">
              <h2 className="text-4xl italic font-serif text-brand-green">{editingProduct ? 'Editar Obra' : 'Nova Coleção'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-brand-green/5 rounded-full transition-colors"><X size={32} /></button>
            </div>
            <form onSubmit={saveProduct} className="space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest opacity-40">Título do Produto</label>
                  <input required value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} className="luxury-input text-lg" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest opacity-40">Preço Base (R$)</label>
                  <input required type="number" step="0.01" value={productForm.price} onChange={e => setProductForm({...productForm, price: parseFloat(e.target.value)})} className="luxury-input font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest opacity-40">Categoria Literária</label>
                  <input required value={productForm.category} onChange={e => setProductForm({...productForm, category: e.target.value})} className="luxury-input" placeholder="Ex: Óleos de Banho" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest opacity-40">Vínculo de Imagem (URL)</label>
                  <input required value={productForm.image} onChange={e => setProductForm({...productForm, image: e.target.value})} className="luxury-input truncate" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] uppercase tracking-widest opacity-40">Narrativa do Produto</label>
                  <textarea rows={4} value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} className="luxury-input resize-none leading-relaxed" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] uppercase tracking-widest opacity-40">Unidades Disponíveis</label>
                  <input type="number" value={productForm.stock} onChange={e => setProductForm({...productForm, stock: parseInt(e.target.value)})} className="luxury-input" />
                </div>
                <div className="flex items-center gap-4 pt-6">
                  <input type="checkbox" id="active" checked={productForm.active} onChange={e => setProductForm({...productForm, active: e.target.checked})} className="w-5 h-5 accent-brand-green" />
                  <label htmlFor="active" className="text-[10px] uppercase tracking-[0.2em] opacity-60 font-bold">Publicar no Catálogo</label>
                </div>
              </div>
              <button type="submit" className="luxury-button w-full mt-10 py-5 uppercase text-[11px] tracking-[0.4em]">Confirmar Alterações</button>
            </form>
          </div>
        </div>
      )}

      {/* Coupon Modal */}
      {isCouponModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-brand-terracotta/40 backdrop-blur-md p-6">
          <div className="bg-brand-cream w-full max-w-lg p-12 border-4 border-white shadow-2xl relative">
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-3xl italic font-serif text-brand-terracotta">{editingCoupon ? 'Editar Cupom' : 'Novo Cupom'}</h2>
              <button onClick={() => setIsCouponModalOpen(false)}><X size={24} /></button>
            </div>
            <form onSubmit={saveCoupon} className="space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest opacity-40">Código do Cupom</label>
                <input required value={couponForm.code} onChange={e => setCouponForm({...couponForm, code: e.target.value.toUpperCase()})} className="luxury-input text-2xl font-mono text-center tracking-widest" placeholder="EX: BOTANIQ10" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-widest opacity-40">Valor do Desconto (R$ ou %)</label>
                <input required type="number" step="1" value={couponForm.value} onChange={e => setCouponForm({...couponForm, value: parseFloat(e.target.value)})} className="luxury-input" />
                <p className="text-[9px] opacity-40 italic">Note: Valores menores que 100 serão tratados como porcentagem.</p>
              </div>
              <div className="flex items-center gap-4 py-4">
                <input type="checkbox" id="couponActive" checked={couponForm.isActive} onChange={e => setCouponForm({...couponForm, isActive: e.target.checked})} className="w-5 h-5 accent-brand-terracotta" />
                <label htmlFor="couponActive" className="text-[10px] uppercase tracking-widest font-bold">Habilitado para uso</label>
              </div>
              <button type="submit" className="luxury-button w-full py-5 bg-brand-terracotta hover:bg-brand-terracotta/90">Salvar Cupom</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
