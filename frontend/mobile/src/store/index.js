import { combineReducers, configureStore } from '@reduxjs/toolkit';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import authReducer from './slices/authSlice';
import inventoryReducer from './slices/inventorySlice';

const authPersistConfig = {
  key: 'auth',
  storage: AsyncStorage,
  // isAuthenticating/error are transient, in-flight UI state - persisting them
  // meant that killing the app mid-login left isAuthenticating: true in
  // AsyncStorage, and redux-persist's root-level merge overwrote the slice's
  // own reset on every future rehydrate, permanently stuck on the loading
  // gate in LoginScreen from the moment the app launched.
  blacklist: ['isAuthenticating', 'error'],
  // "Manter conectado" off: don't restore the saved session when the app starts again.
  migrate: (state) => Promise.resolve(state && state.rememberMe === false ? undefined : state),
};

// combineReducers (not a hand-rolled function) so Redux's initial dispatch with
// state === undefined is handled correctly - each slice reducer supplies its own
// default state instead of crashing on `state.auth` before anything exists.
const rootReducer = combineReducers({
  auth: persistReducer(authPersistConfig, authReducer),
  inventory: inventoryReducer,
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