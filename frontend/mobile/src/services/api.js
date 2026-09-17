// Base URL - in production, this would come from environment variables
const BASE_URL = __DEV__
  ? 'http://10.0.2.2:8080/api' // Android emulator
  : 'http://localhost:8080/api'; // iOS simulator or production

// The backend authenticates via a server-side session (Spring Security), not a bearer
// token: /api/auth/login sets a session cookie, and React Native's fetch persists cookies
// automatically per app install, the same way a browser does. So there is no token to
// attach here — just send the cookie jar along on every request.
const apiFetch = async (endpoint, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...options.headers,
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle non-2xx responses
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.message ||
      `HTTP ${response.status}: ${response.statusText}`
    );
  }

  // Return parsed JSON if response has content
  if (response.status !== 204) {
    return response.json();
  }

  return null;
};

// API service methods
export const apiService = {
  // Auth
  login: (credentials) => apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  }),

  logout: () => apiFetch('/auth/logout', {
    method: 'POST',
  }),

  // Products
  getProducts: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/produtos${query ? `?${query}` : ''}`);
  },

  getProductById: (id) => apiFetch(`/produtos/${id}`),

  getProductBySku: (sku) => apiFetch(`/produtos/sku/${sku}`),

  createProduct: (productData) => apiFetch('/produtos', {
    method: 'POST',
    body: JSON.stringify(productData),
  }),

  updateProduct: (id, productData) => apiFetch(`/produtos/${id}`, {
    method: 'PUT',
    body: JSON.stringify(productData),
  }),

  deleteProduct: (id) => apiFetch(`/produtos/${id}`, {
    method: 'DELETE',
  }),

  // Inventory
  createStockEntry: (stockData) => {
    const query = new URLSearchParams(stockData).toString();
    return apiFetch(`/estoque/entrada?${query}`, { method: 'POST' });
  },

  withdrawStockFIFO: (params) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/estoque/saida/fifo?${query}`, { method: 'POST' });
  },

  withdrawStockFEFO: (params) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/estoque/saida/fefo?${query}`, { method: 'POST' });
  },

  getProductAvailability: (productId) =>
    apiFetch(`/estoque/disponibilidade/${productId}`),

  getProductLotes: (productId) =>
    apiFetch(`/estoque/lotes/${productId}`),

  processVencimentos: () => apiFetch('/estoque/processar-vencimentos', {
    method: 'POST',
  }),

  getEstoqueResumo: () => apiFetch('/estoque/resumo'),

  // Notifications
  getNotifications: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/notificacoes${query ? `?${query}` : ''}`);
  },

  // Additional helper methods
  getProductMargin: (productId) =>
    apiFetch(`/produtos/${productId}/margem-lucro`),

  isMarginSaudavel: (productId) =>
    apiFetch(`/produtos/${productId}/margem-saudavel`),

  getMarginCategory: (productId) =>
    apiFetch(`/produtos/${productId}/categoria-margem`),
};

export default apiService;
