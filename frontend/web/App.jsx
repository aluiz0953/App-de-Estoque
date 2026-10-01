import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider, useSelector } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './src/store';
import { logoutUser } from './src/store/slices/authSlice';
import { onUnauthorized } from './src/services/request';
import { ThemeProvider } from './src/contexts/ThemeContext';
import './src/App.css';

onUnauthorized(() => store.dispatch(logoutUser()));

// Components
import Sidebar from './src/components/Sidebar';
import MainContent from './src/components/MainContent';
import LoginPage from './src/pages/LoginPage';

// Pages load on demand: the first screen no longer downloads every page (and its
// libraries, e.g. charts) up front.
const DashboardPage = lazy(() => import('./src/pages/DashboardPage'));
const InventoryPage = lazy(() => import('./src/pages/InventoryPage'));
const CatalogPage = lazy(() => import('./src/pages/CatalogPage'));
const ProductDetailPage = lazy(() => import('./src/pages/ProductDetailPage'));
const ProductFormPage = lazy(() => import('./src/pages/ProductFormPage'));
const NotificationsPage = lazy(() => import('./src/pages/NotificationsPage'));
const UsersPage = lazy(() => import('./src/pages/UsersPage'));
const PedidosPage = lazy(() => import('./src/pages/PedidosPage'));
const PedidoFormPage = lazy(() => import('./src/pages/PedidoFormPage'));
const PedidoDetailPage = lazy(() => import('./src/pages/PedidoDetailPage'));
const RevistasPage = lazy(() => import('./src/pages/RevistasPage'));
const RevistaViewerPage = lazy(() => import('./src/pages/RevistaViewerPage'));
const ReportsPage = lazy(() => import('./src/pages/ReportsPage.jsx'));
const NotFoundPage = lazy(() => import('./src/pages/NotFoundPage'));

const PageFallback = () => (
  <div className="animate-pulse space-y-4 p-6" aria-busy="true" aria-label="Carregando">
    <div className="h-8 w-1/3 rounded bg-black/10" />
    <div className="h-24 rounded bg-black/5" />
    <div className="h-24 rounded bg-black/5" />
    <div className="h-24 rounded bg-black/5" />
  </div>
);

// Unauthenticated visitors must land on /login, not a dashboard shell that just
// fails every request with 401 - the routes below never even check auth state.
const RequireAuth = ({ children }) => {
  const isAuthenticated = useSelector((state) => !!state.auth.user);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
};

function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <ThemeProvider>
          <Router>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="*"
                element={
                  <RequireAuth>
                  <div className="App min-h-screen bg-brand-bg font-sans text-ink">
                    <Sidebar />
                    <MainContent>
                      <Suspense fallback={<PageFallback />}>
                      <Routes>
                        <Route path="/" element={<DashboardPage />} />
                        <Route path="/dashboard" element={<DashboardPage />} />
                        <Route path="/estoque" element={<InventoryPage />} />
                        <Route path="/produtos" element={<CatalogPage />} />
                        <Route path="/produtos/novo" element={<ProductFormPage />} />
                        <Route path="/produtos/:id" element={<ProductDetailPage />} />
                        <Route path="/produtos/:id/editar" element={<ProductFormPage />} />
                        <Route path="/notificacoes" element={<NotificationsPage />} />
                        <Route path="/relatorios" element={<ReportsPage />} />
                        <Route path="/usuarios" element={<UsersPage />} />
                        <Route path="/pedidos" element={<PedidosPage />} />
                        <Route path="/pedidos/novo" element={<PedidoFormPage />} />
                        <Route path="/pedidos/:id" element={<PedidoDetailPage />} />
                        <Route path="/revistas" element={<RevistasPage />} />
                        <Route path="/revistas/:id" element={<RevistaViewerPage />} />
                        <Route path="*" element={<NotFoundPage />} />
                      </Routes>
                      </Suspense>
                    </MainContent>
                  </div>
                  </RequireAuth>
                }
              />
            </Routes>
          </Router>
        </ThemeProvider>
      </PersistGate>
    </Provider>
  );
}

export default App;

