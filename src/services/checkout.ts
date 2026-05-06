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
    `• ${item.quantity}x ${item.name} (${formatCurrency(item.price)})`
  ).join('\n');

  const message = `*NOVO PEDIDO - BOTANIQ*\n\n` +
    `*Cliente:* ${order.customerName}\n` +
    `*Telefone:* ${order.customerPhone}\n\n` +
    `*Itens:* \n${itemsText}\n\n` +
    `*Endereço:* \n${formatAddress(order.address)}\n\n` +
    `*Subtotal:* ${formatCurrency(order.cartTotal)}\n` +
    (order.discount > 0 ? `*Desconto (${order.couponCode}):* -${formatCurrency(order.discount)}\n` : '') +
    `*Frete:* ${formatCurrency(order.shippingCost)}\n` +
    `*TOTAL:* ${formatCurrency(order.total)}\n\n` +
    `_Pedido gerado via site Botaniq._`;

  // Note: Standard WA links don't support direct image attachments, 
  // but we can provide links to the images in the text or rely on the store to check the site.
  // However, I will add the image URL for reference as requested.
  const itemImages = order.items.map((item: any) => `📸 ${item.name}: ${item.image}`).join('\n');
  
  const finalMessage = encodeURIComponent(`${message}\n\n*Fotos dos Itens:*\n${itemImages}`);
  return `https://wa.me/${storePhone.replace(/\D/g, '')}?text=${finalMessage}`;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}
