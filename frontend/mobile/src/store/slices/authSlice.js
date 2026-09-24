import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiService from '../../services/api';

// Thunk para login
export const login = createAsyncThunk(
  'auth/login',
  async ({ username, password, rememberMe }, { rejectWithValue }) => {
    try {
      const response = await apiService.login({ username, password, rememberMe });
      // Em uma implementação real, você salvaria o token de forma segura
      // Por enquanto, vamos apenas retornar os dados do usuário
      return response;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Thunk para logout
export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await apiService.logout();
      // Limpar token de armazenamento seguro
      return {};
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    isAuthenticating: false,
    isAuthenticated: false,
    error: null,
    // "Manter conectado": when false, the saved session is dropped on the next launch (see store/index.js).
    rememberMe: true,
  },
  reducers: {
    // Limpar erro
    clearError: (state) => {
      state.error = null;
    },
    // Definir usuário diretamente (para desenvolvimento)
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
    // Fazer logout
    logoutUser: (state) => {
      state.user = null;
      state.isAuthenticated = false;
    }
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.isAuthenticating = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isAuthenticating = false;
        state.isAuthenticated = true;
        state.user = action.payload;
        state.error = null;
        state.rememberMe = action.meta.arg.rememberMe !== false;
      })
      .addCase(login.rejected, (state, action) => {
        state.isAuthenticating = false;
        state.error = action.payload;
      })
      // Logout
      .addCase(logout.pending, (state) => {
        state.isAuthenticating = true;
      })
      .addCase(logout.fulfilled, (state) => {
        state.isAuthenticating = false;
        state.isAuthenticated = false;
        state.user = null;
        state.error = null;
      })
      .addCase(logout.rejected, (state, action) => {
        state.isAuthenticating = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, setUser, logoutUser } = authSlice.actions;
export default authSlice.reducer;