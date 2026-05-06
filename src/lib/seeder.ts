import { collection, getDocs, addDoc, query, limit } from 'firebase/firestore';
import { db } from './firebase';

const PRODUCTS_TO_SEED = [
  {
    name: "Kit Farol Sabonetes Artesanais Botaniq Cesto Crochê Azul",
    price: 504.00,
    image: "https://i.postimg.cc/zvVDmLTH/D-NQ-NP-2X-967843-MLB111276624139-052026-F-kit-farol-sabonetes-artesanais-botaniq-cesto-croch-azul-1.webp",
    category: "Kits Presente",
    description: "Kit luxuoso com sabonetes artesanais e cesto em crochê azul.",
    active: true,
    stock: 10,
    createdAt: new Date().toISOString()
  },
  {
    name: "Óleo De Banho Em Barra Botaniq",
    price: 13.90,
    image: "https://i.postimg.cc/tJKjLBqy/D-NQ-NP-2X-762274-MLB111271103451-052026-F-oleo-de-banho-em-barra-botaniq-1.webp",
    category: "Banho",
    description: "Óleo de banho sólido nutritivo e perfumado.",
    active: true,
    stock: 50,
    createdAt: new Date().toISOString()
  },
  {
    name: "Kit 4 Palito Espátula Mista Manicure Cutelaria",
    price: 19.00,
    image: "https://i.postimg.cc/DZDkXxb7/D-NQ-NP-2X-642950-MLA79744315367-102024-F-1.webp",
    category: "Manicure",
    description: "Kit completo de espátulas para manicure.",
    active: true,
    stock: 30,
    createdAt: new Date().toISOString()
  },
  {
    name: "Escova Gringa Fitagem Raquete Cabelo Cacheado",
    price: 19.90,
    image: "https://i.postimg.cc/T3Gw1PxM/D-NQ-NP-2X-790488-MLA103750762355-012026-F-1.webp",
    category: "Cabelos",
    description: "Escova modeladora para cachos perfeitos.",
    active: true,
    stock: 25,
    createdAt: new Date().toISOString()
  },
  {
    name: "Kit Pincel De Maquiagem 13 Unidades",
    price: 19.39,
    image: "https://i.postimg.cc/JzP1hcKn/D-NQ-NP-2X-672781-MLA92082962837-092025-F-1.webp",
    category: "Maquiagem",
    description: "Conjunto de pincéis profissionais cor marrom.",
    active: true,
    stock: 40,
    createdAt: new Date().toISOString()
  },
  {
    name: "Alicate Unha Profissional E Cuticulas Em Aço Inox Cirúrgico Alta Precisão, Corte Afiado, Durável, Uso Manicure E Pedicure Torvstore",
    price: 45.90,
    image: "https://i.postimg.cc/Qd43DNx6/D-NQ-NP-2X-977462-MLA108167552182-032026-F-1.webp",
    category: "Manicure",
    description: "Alicate de alta precisão em aço cirúrgico para uso profissional.",
    active: true,
    stock: 15,
    createdAt: new Date().toISOString()
  },
  {
    name: "Aparelho Lixa Pés Elétrico Esfoliante Removedor De Calos Usb",
    price: 39.90,
    image: "https://i.postimg.cc/N03ZGKhb/D-NQ-NP-2X-880687-MLB94953153035-102025-F-1.webp",
    category: "Cuidados",
    description: "Removedor de calos elétrico via USB.",
    active: true,
    stock: 20,
    createdAt: new Date().toISOString()
  },
  {
    name: "Gloss Fran By Franciny Ehlke Liphoney Mel",
    price: 42.00,
    image: "https://i.postimg.cc/zX2tXyKX/D-NQ-NP-2X-855365-MLB95050151929-102025-F-1.webp",
    category: "Maquiagem",
    description: "Gloss labial hidratante com aroma de mel.",
    active: true,
    stock: 35,
    createdAt: new Date().toISOString()
  }
];

export async function seedDatabase() {
  try {
    const productsRef = collection(db, 'products');
    const q = query(productsRef, limit(1));
    const snap = await getDocs(q);
    
    // Only seed if empty
    if (snap.empty) {
      console.log("Seeding initial products...");
      for (const product of PRODUCTS_TO_SEED) {
        await addDoc(productsRef, product);
      }
      console.log("Seeding complete!");
    } else {
      console.log("Database already has products, skipping seed.");
    }
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}
