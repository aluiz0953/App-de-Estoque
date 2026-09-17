import { get, post, put, del } from './request';

// URL base da API - em produção, isso viria de variáveis de ambiente
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const apiService = {
  // Métodos auxiliares para requisições
  request: {
    get: (endpoint, params = {}) => {
      const query = new URLSearchParams(params).toString();
      return get(`${API_BASE_URL}${endpoint}${query ? `?${query}` : ''}`);
    },
    post: (endpoint, data) => post(`${API_BASE_URL}${endpoint}`, data),
    put: (endpoint, data) => put(`${API_BASE_URL}${endpoint}`, data),
    delete: (endpoint) => del(`${API_BASE_URL}${endpoint}`),
  },

  // Autenticação
  login: (credentials) =>
    apiService.request.post('/auth/login', credentials),

  logout: () =>
    apiService.request.post('/auth/logout'),

  getProfile: () =>
    apiService.request.get('/auth/profile'),

  register: (data) =>
    apiService.request.post('/auth/register', data),

  getUsuarios: () =>
    apiService.request.get('/usuarios'),

  activateUsuario: (id) =>
    apiService.request.put(`/usuarios/${id}/activate`),

  deactivateUsuario: (id) =>
    apiService.request.put(`/usuarios/${id}/deactivate`),

  rejectUsuario: (id) =>
    apiService.request.delete(`/usuarios/${id}`),

  updateUsuarioRole: (id, role) =>
    apiService.request.put(`/usuarios/${id}/role`, { role }),

  // Produtos
  getProducts: (params = {}) =>
    apiService.request.get('/produtos', params),

  getProductById: (id) =>
    apiService.request.get(`/produtos/${id}`),

  getProductBySku: (sku) =>
    apiService.request.get(`/produtos/sku/${sku}`),

  createProduct: (productData) =>
    apiService.request.post('/produtos', productData),

  updateProduct: (id, productData) =>
    apiService.request.put(`/produtos/${id}`, productData),

  deleteProduct: (id) =>
    apiService.request.delete(`/produtos/${id}`),

  getProductMargin: (id) =>
    apiService.request.get(`/produtos/${id}/margem-lucro`),

  isMarginSaudavel: (id) =>
    apiService.request.get(`/produtos/${id}/margem-saudavel`),

  getMarginCategory: (id) =>
    apiService.request.get(`/produtos/${id}/categoria-margem`),

  // Marcas e Linhas
  getMarcas: () =>
    apiService.request.get('/marcas'),

  createMarca: (marcaData) =>
    apiService.request.post('/marcas', marcaData),

  getLinhas: (marcaId) =>
    apiService.request.get('/linhas', marcaId ? { marcaId } : {}),

  createLinha: (linhaData) =>
    apiService.request.post('/linhas', linhaData),

  // Clientes
  getClientes: (params = {}) =>
    apiService.request.get('/clientes', params),

  getClienteById: (id) =>
    apiService.request.get(`/clientes/${id}`),

  createCliente: (data) =>
    apiService.request.post('/clientes', data),

  updateCliente: (id, data) =>
    apiService.request.put(`/clientes/${id}`, data),

  // Pedidos
  getPedidos: (params = {}) =>
    apiService.request.get('/pedidos', params),

  getPedidoById: (id) =>
    apiService.request.get(`/pedidos/${id}`),

  createPedido: (data) =>
    apiService.request.post('/pedidos', data),

  confirmPedido: (id) =>
    apiService.request.put(`/pedidos/${id}/confirmar`),

  cancelPedido: (id) =>
    apiService.request.put(`/pedidos/${id}/cancelar`),

  updatePedidoStatus: (id, status) =>
    apiService.request.put(`/pedidos/${id}/status`, { status }),

  // Estoque
  createStockEntry: (stockData) =>
    apiService.request.post('/estoque/entrada', stockData),

  withdrawStockFIFO: (withdrawData) =>
    apiService.request.post('/estoque/saida/fifo', withdrawData),

  withdrawStockFEFO: (withdrawData) =>
    apiService.request.post('/estoque/saida/fefo', withdrawData),

  getProductAvailability: (productId) =>
    apiService.request.get(`/estoque/disponibilidade/${productId}`),

  getProductLotes: (productId) =>
    apiService.request.get(`/estoque/lotes/${productId}`),

  processVencimentos: () =>
    apiService.request.post('/estoque/processar-vencimentos'),

  getEstoqueResumo: () =>
    apiService.request.get('/estoque/resumo'),

  getMovimentacoes: (params = {}) =>
    apiService.request.get('/estoque/movimentacoes', params),

  getMovimentacoesHistorico: (params = {}) =>
    apiService.request.get('/estoque/movimentacoes/historico', params),

  // Notificações
  getNotifications: (params = {}) =>
    apiService.request.get('/notificacoes', params),

  markNotificationAsRead: (notificationId) =>
    apiService.request.put(`/notificacoes/${notificationId}/read`),

  deleteNotification: (notificationId) =>
    apiService.request.delete(`/notificacoes/${notificationId}`),
};

export default apiService;