import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiService from '../../services/api';

// Thunks para produtos
export const fetchProducts = createAsyncThunk(
  'inventory/fetchProducts',
  async (params, { rejectWithValue }) => {
    try {
      const response = await apiService.getProducts(params);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Thunk para obter detalhes do produto
export const fetchProductById = createAsyncThunk(
  'inventory/fetchProductById',
  async (productId, { rejectWithValue }) => {
    try {
      const response = await apiService.getProductById(productId);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Thunk para entrada de estoque
export const createStockEntry = createAsyncThunk(
  'inventory/createStockEntry',
  async (stockData, { rejectWithValue }) => {
    try {
      const response = await apiService.createStockEntry(stockData);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Thunk para saída de estoque (FIFO)
export const withdrawStockFIFO = createAsyncThunk(
  'inventory/withdrawStockFIFO',
  async (withdrawData, { rejectWithValue }) => {
    try {
      const response = await apiService.withdrawStockFIFO(withdrawData);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Thunk para saída de estoque (FEFO)
export const withdrawStockFEFO = createAsyncThunk(
  'inventory/withdrawStockFEFO',
  async (withdrawData, { rejectWithValue }) => {
    try {
      const response = await apiService.withdrawStockFEFO(withdrawData);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Thunk para obter disponibilidade do produto
export const fetchProductAvailability = createAsyncThunk(
  'inventory/fetchProductAvailability',
  async (productId, { rejectWithValue }) => {
    try {
      const response = await apiService.getProductAvailability(productId);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Thunk para obter lotes do produto
export const fetchProductLotes = createAsyncThunk(
  'inventory/fetchProductLotes',
  async (productId, { rejectWithValue }) => {
    try {
      const response = await apiService.getProductLotes(productId);
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const inventorySlice = createSlice({
  name: 'inventory',
  initialState: {
    products: [],
    productDetail: null,
    availability: null,
    lotes: [],
    lastStockEntry: null,
    lastWithdrawal: null,
    isLoading: false,
    error: null,
  },
  reducers: {
    // Limpar erro
    clearError: (state) => {
      state.error = null;
    },
    // Limpar detalhes do produto
    clearProductDetail: (state) => {
      state.productDetail = null;
    },
    // Limpar disponibilidade
    clearAvailability: (state) => {
      state.availability = null;
    },
    // Limpar lotes
    clearLotes: (state) => {
      state.lotes = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Products
      .addCase(fetchProducts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.products = action.payload;
        state.error = null;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch Product By ID
      .addCase(fetchProductById.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.productDetail = action.payload;
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Create Stock Entry
      .addCase(createStockEntry.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createStockEntry.fulfilled, (state, action) => {
        state.isLoading = false;
        state.lastStockEntry = action.payload;
      })
      .addCase(createStockEntry.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Withdraw Stock FIFO
      .addCase(withdrawStockFIFO.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(withdrawStockFIFO.fulfilled, (state, action) => {
        state.isLoading = false;
        state.lastWithdrawal = action.payload;
      })
      .addCase(withdrawStockFIFO.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Withdraw Stock FEFO
      .addCase(withdrawStockFEFO.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(withdrawStockFEFO.fulfilled, (state, action) => {
        state.isLoading = false;
        state.lastWithdrawal = action.payload;
      })
      .addCase(withdrawStockFEFO.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch Product Availability
      .addCase(fetchProductAvailability.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchProductAvailability.fulfilled, (state, action) => {
        state.isLoading = false;
        state.availability = action.payload;
      })
      .addCase(fetchProductAvailability.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch Product Lotes
      .addCase(fetchProductLotes.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchProductLotes.fulfilled, (state, action) => {
        state.isLoading = false;
        state.lotes = action.payload;
      })
      .addCase(fetchProductLotes.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearProductDetail, clearAvailability, clearLotes } = inventorySlice.actions;
export default inventorySlice.reducer;