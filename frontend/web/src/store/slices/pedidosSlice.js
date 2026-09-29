import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiService from '../../services/api';

export const fetchPedidos = createAsyncThunk(
  'pedidos/fetchPedidos',
  async (params, { rejectWithValue }) => {
    try {
      return await apiService.getPedidos(params);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchPedidoById = createAsyncThunk(
  'pedidos/fetchPedidoById',
  async (pedidoId, { rejectWithValue }) => {
    try {
      return await apiService.getPedidoById(pedidoId);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createPedido = createAsyncThunk(
  'pedidos/createPedido',
  async (pedidoData, { rejectWithValue }) => {
    try {
      return await apiService.createPedido(pedidoData);
    } catch (error) {
      return rejectWithValue(error?.body?.message || error.message);
    }
  }
);

export const confirmPedido = createAsyncThunk(
  'pedidos/confirmPedido',
  async (id, { rejectWithValue }) => {
    try {
      return await apiService.confirmPedido(id);
    } catch (error) {
      return rejectWithValue(error?.body?.message || error.message);
    }
  }
);

export const cancelPedido = createAsyncThunk(
  'pedidos/cancelPedido',
  async (id, { rejectWithValue }) => {
    try {
      return await apiService.cancelPedido(id);
    } catch (error) {
      return rejectWithValue(error?.body?.message || error.message);
    }
  }
);

const pedidosSlice = createSlice({
  name: 'pedidos',
  initialState: {
    pedidos: [],
    pedidosMeta: { totalPages: 1, totalElements: 0, number: 0 },
    pedidoDetail: null,
    isLoading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearPedidoDetail: (state) => {
      state.pedidoDetail = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Pedidos
      .addCase(fetchPedidos.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPedidos.fulfilled, (state, action) => {
        state.isLoading = false;
        state.pedidos = action.payload.content || [];
        state.pedidosMeta = {
          totalPages: action.payload.totalPages ?? 1,
          totalElements: action.payload.totalElements ?? 0,
          number: action.payload.number ?? 0,
        };
      })
      .addCase(fetchPedidos.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch Pedido By ID
      .addCase(fetchPedidoById.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchPedidoById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.pedidoDetail = action.payload;
      })
      .addCase(fetchPedidoById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Create Pedido
      .addCase(createPedido.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createPedido.fulfilled, (state) => {
        state.isLoading = false;
      })
      .addCase(createPedido.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Confirm Pedido
      .addCase(confirmPedido.fulfilled, (state, action) => {
        state.pedidoDetail = action.payload;
      })
      .addCase(confirmPedido.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Cancel Pedido
      .addCase(cancelPedido.fulfilled, (state, action) => {
        state.pedidoDetail = action.payload;
      })
      .addCase(cancelPedido.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { clearError, clearPedidoDetail } = pedidosSlice.actions;
export default pedidosSlice.reducer;
