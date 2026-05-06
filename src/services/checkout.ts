export async function calculateShipping(zip: string, items: any[]) {
  try {
    const response = await fetch('/api/shipping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ zip, items })
    });
    return await response.json();
  } catch (error) {
    console.error("Shipping calc error:", error);
    return { price: 20.00, estimatedDays: 5 }; // Fallback
  }
}

export function formatAddress(address: any) {
  return `${address.street}, ${address.number} ${address.complement ? '- ' + address.complement : ''}, ${address.neighborhood}, ${address.city} - ${address.state}, CEP: ${address.zip}`;
}

export function generateWhatsAppMessage(order: any, storePhone: string) {
  const itemsText = order.items.map((item: any) => 
    `✅ *${item.quantity}x ${item.name}*\n` +
    `   Preço Unitário: ${formatCurrency(item.price)}\n` +
    `   Subtotal Item: ${formatCurrency(item.price * item.quantity)}\n` +
    `   📸 Ver Foto: ${item.image}\n`
  ).join('\n');

  const message = `*🌿 NOVO PEDIDO - BOTANIQ*\n\n` +
    `*DADOS DO CLIENTE*\n` +
    `👤 *Nome:* ${order.customerName}\n` +
    `📱 *WhatsApp:* ${order.customerPhone}\n\n` +
    `*ENDEREÇO DE ENTREGA*\n` +
    `📍 ${formatAddress(order.address)}\n\n` +
    `*ITENS DO PEDIDO*\n` +
    `${itemsText}\n` +
    `--------------------------\n` +
    `💰 *Subtotal Produtos:* ${formatCurrency(order.cartTotal)}\n` +
    (order.discount > 0 ? `✨ *Desconto:* -${formatCurrency(order.discount)}\n` : '') +
    `🚚 *Frete (Correios):* ${formatCurrency(order.shippingCost)}\n` +
    `⭐ *TOTAL DO PEDIDO:* ${formatCurrency(order.total)}\n\n` +
    `_Pedido gerado automaticamente pelo site Botaniq._`;
  
  const finalMessage = encodeURIComponent(message);
  return `https://wa.me/${storePhone.replace(/\D/g, '')}?text=${finalMessage}`;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}
