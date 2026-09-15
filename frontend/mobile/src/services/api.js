import { Platform } from 'react-native';

// Base URL - in production, this would come from environment variables
const BASE_URL = __DEV__
  ? 'http://10.0.2.2:8080/api' // Android emulator
  : 'http://localhost:8080/api'; // iOS simulator or production

// Helper to get auth token from storage (would be implemented with secure store)
const getAuthToken = async () => {
  // In a real app, this would retrieve token from secure storage
  // For now, returning placeholder
  return localStorage.getItem('authToken') || null;
};

// Generic fetch function with auth handling
const apiFetch = async (endpoint, options = {}) => {
  const token = await getAuthToken();

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
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
  createStockEntry: (stockData) => apiFetch('/estoque/entrada', {
    method: 'POST',
    body: JSON.stringify(stockData),
  }),

  withdrawStockFIFO: (params) => apiFetch('/estoque/saida/fifo', {
    method: 'POST',
    body: JSON.stringify(params),
  }),

  withdrawStockFEFO: (params) => apiFetch('/estoque/saida/fefo', {
    method: 'POST',
    body: JSON.stringify(params),
  }),

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