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

const persistConfig = {
  key: 'root',
  version: 1,
  storage,
  whitelist: ['auth'], // apenas auth será persistido
};

const rootReducer = combineReducers({
  auth: authReducer,
  inventory: inventoryReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);