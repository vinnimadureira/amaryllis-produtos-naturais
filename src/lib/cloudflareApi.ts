// Cloudflare Native API Client - Amaryllis Produtos Naturais

const API_BASE = '/api';

export const cloudflareApi = {
  async getProducts() {
    const res = await fetch(`${API_BASE}/products`);
    return await res.json();
  },

  async getCampaigns() {
    const res = await fetch(`${API_BASE}/campaigns`);
    return await res.json();
  },

  async createOrder(orderData: any) {
    const res = await fetch(`${API_BASE}/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData),
    });
    return await res.json();
  },

  async invokeFunction(functionName: string, payload: any) {
    const res = await fetch(`${API_BASE}/functions/${functionName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await res.json();
  }
};
