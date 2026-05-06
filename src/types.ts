export interface Product {
  id?: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  stock: number;
  active: boolean;
}

export interface CartItem extends Product {
  quantity: number;
}

export interface Address {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zip: string;
}

export interface Order {
  id?: string;
  customerName: string;
  customerPhone: string;
  address: Address;
  items: CartItem[];
  total: number;
  shippingCost: number;
  discount: number;
  couponCode?: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'completed';
  createdAt: any;
}

export interface Settings {
  instagram: string;
  facebook: string;
  tiktok: string;
  whatsapp: string;
  storeAddress: string;
  storeCep: string;
}

export interface Coupon {
  id?: string;
  code: string;
  value: number; // Percentage or fixed amount
  isActive: boolean;
  createdAt: string;
}
