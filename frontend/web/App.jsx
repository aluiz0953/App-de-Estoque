import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Provider, useSelector } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './src/store';
import { ThemeProvider } from './src/contexts/ThemeContext';
import './src/App.css';

// Components
import Sidebar from './src/components/Sidebar';
import MainContent from './src/components/MainContent';
import LoginPage from './src/pages/LoginPage';
import DashboardPage from './src/pages/DashboardPage';
import InventoryPage from './src/pages/InventoryPage';
import CatalogPage from './src/pages/CatalogPage';
import ProductDetailPage from './src/pages/ProductDetailPage';
import ProductFormPage from './src/pages/ProductFormPage';
import NotificationsPage from './src/pages/NotificationsPage';
import ReportsPage from './src/pages/ReportsPage.jsx';
import UsersPage from './src/pages/UsersPage';
import PedidosPage from './src/pages/PedidosPage';
import PedidoFormPage from './src/pages/PedidoFormPage';
import PedidoDetailPage from './src/pages/PedidoDetailPage';

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
                      </Routes>
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

