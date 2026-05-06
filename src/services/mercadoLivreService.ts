import { MLProduct } from '../types';

export async function fetchMLProducts(): Promise<MLProduct[]> {
  try {
    const response = await fetch('/api/mercado-livre/products');
    if (!response.ok) {
      console.warn('Mercado Livre fetch failed, using empty list');
      return [];
    }
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('Error in fetchMLProducts:', error);
    return [];
  }
}
