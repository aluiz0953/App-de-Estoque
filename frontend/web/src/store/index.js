import { configureStore, combineReducers } from '@reduxjs/toolkit';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // usa localStorage para web
import authReducer from './slices/authSlice';
import inventoryReducer from './slices/inventorySlice';
import pedidosReducer from './slices/pedidosSlice';

const authPersistConfig = {
  key: 'auth',
  storage,
  // isAuthenticating/error are transient, in-flight UI state - persisting them
  // meant that closing the tab (or refreshing) mid-login left isAuthenticating:
  // true in localStorage, and redux-persist's root-level merge overwrote the
  // slice's own reset on every future rehydrate, permanently stuck showing
  // "Entrando..." from the moment the page loaded.
  blacklist: ['isAuthenticating', 'error'],
};

const rootReducer = combineReducers({
  auth: persistReducer(authPersistConfig, authReducer),
  inventory: inventoryReducer,
  pedidos: pedidosReducer,
});

export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);