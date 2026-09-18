import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiService from '../../services/api';

// Thunk para login
export const login = createAsyncThunk(
  'auth/login',
  async ({ username, password }, { rejectWithValue }) => {
    try {
      const response = await apiService.login({ username, password });
      // Salvar token em localStorage (em produção, usar secure storage)
      localStorage.setItem('authToken', response.access_token || response.token || '');
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
      localStorage.removeItem('authToken');
      return {};
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Thunk para verificar sessão
export const checkSession = createAsyncThunk(
  'auth/checkSession',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) throw new Error('No token');

      const response = await apiService.getProfile(); // Assumindo que este endpoint existe
      return response;
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
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setUser: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
    },
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
      })
      // Check Session
      .addCase(checkSession.pending, (state) => {
        state.isAuthenticating = true;
      })
      .addCase(checkSession.fulfilled, (state, action) => {
        state.isAuthenticating = false;
        state.isAuthenticated = true;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(checkSession.rejected, (state, action) => {
        state.isAuthenticating = false;
        state.isAuthenticated = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, setUser, logoutUser } = authSlice.actions;
export default authSlice.reducer;