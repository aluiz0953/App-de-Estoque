// Always hits the real deployed backend (Railway) so the app works from any
// network, not just the dev machine's Wi-Fi. For local-only testing against a
// backend running on your own machine, temporarily swap this for
// `http://<your-LAN-IP>:8080/api` (find the IP via `ipconfig`; 10.0.2.2
// instead of the LAN IP if using the Android emulator).
const BASE_URL = 'https://app-de-estoque-production.up.railway.app/api';

// The backend authenticates via a server-side session (Spring Security), not a bearer
// token: /api/auth/login sets a session cookie, and React Native's fetch persists cookies
// automatically per app install, the same way a browser does. So there is no token to
// attach here — just send the cookie jar along on every request.
const REQUEST_TIMEOUT_MS = 15000;

// Backend sessions are in-memory (see application.properties) and get wiped on
// every redeploy - the app can be holding a persisted isAuthenticated: true
// (redux-persist) for a session the server no longer has. Rather than every
// screen guessing at what a stale-session error looks like, apiFetch notifies
// here once, centrally, whenever the server says 401; App.js subscribes and
// clears auth state, which flips AppNavigator back to the Login screen.
const unauthorizedListeners = new Set();
export function onUnauthorized(fn) {
  unauthorizedListeners.add(fn);
  return () => unauthorizedListeners.delete(fn);
}

const apiFetch = async (endpoint, options = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...options.headers,
  };

  // Without this, a request that never gets a response (seen on-device as a
  // fetch that neither resolves nor rejects) left login.pending forever,
  // stuck showing a full-screen spinner with no way out but force-closing.
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response;
  try {
    response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new Error('Tempo de conexão esgotado. Verifique sua internet e tente novamente.');
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }

  // Handle non-2xx responses
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const err = new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    err.status = response.status;
    if (response.status === 401) {
      unauthorizedListeners.forEach((fn) => fn());
    }
    throw err;
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

  // Public self-registration; the account stays pending until an admin activates it.
  register: (data) => apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  getProfile: () => apiFetch('/auth/profile'),

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

  archiveProduct: (id) => apiFetch(`/produtos/${id}/archive`, { method: 'PUT' }),

  restoreProduct: (id) => apiFetch(`/produtos/${id}/restore`, { method: 'PUT' }),

  // Marcas e Linhas
  getMarcas: () => apiFetch('/marcas'),

  getLinhas: (marcaId) => apiFetch(`/linhas${marcaId ? `?marcaId=${marcaId}` : ''}`),

  // Clientes
  getClientes: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/clientes${query ? `?${query}` : ''}`);
  },

  createCliente: (data) => apiFetch('/clientes', { method: 'POST', body: JSON.stringify(data) }),

  // Pedidos
  getPedidos: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiFetch(`/pedidos${query ? `?${query}` : ''}`);
  },

  getPedidoById: (id) => apiFetch(`/pedidos/${id}`),

  createPedido: (data) => apiFetch('/pedidos', { method: 'POST', body: JSON.stringify(data) }),

  confirmPedido: (id) => apiFetch(`/pedidos/${id}/confirmar`, { method: 'PUT' }),

  cancelPedido: (id) => apiFetch(`/pedidos/${id}/cancelar`, { method: 'PUT' }),

  updatePedidoStatus: (id, status) =>
    apiFetch(`/pedidos/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),

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

  getMovimentacoesHistorico: (params = {}) => {
    const query = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''))
    ).toString();
    return apiFetch(`/estoque/movimentacoes/historico${query ? `?${query}` : ''}`);
  },

  getUsuarios: () => apiFetch('/usuarios'),

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
