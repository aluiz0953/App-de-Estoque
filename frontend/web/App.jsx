import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './src/store';
import './src/App.css';

// Components
import Sidebar from './src/components/Sidebar';
import MainContent from './src/components/MainContent';
import LoginPage from './src/pages/LoginPage';
import DashboardPage from './src/pages/DashboardPage';
import InventoryPage from './src/pages/InventoryPage';
import ProductDetailPage from './src/pages/ProductDetailPage';
import ProductFormPage from './src/pages/ProductFormPage';
import NotificationsPage from './src/pages/NotificationsPage';
import ReportsPage from './src/pages/ReportsPage.jsx';

function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <Router>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="*"
              element={
                <div className="App min-h-screen bg-brand-bg font-sans text-ink">
                  <Sidebar />
                  <MainContent>
                    <Routes>
                      <Route path="/" element={<DashboardPage />} />
                      <Route path="/dashboard" element={<DashboardPage />} />
                      <Route path="/estoque" element={<InventoryPage />} />
                      <Route path="/produtos" element={<InventoryPage />} />
                      <Route path="/produtos/novo" element={<ProductFormPage />} />
                      <Route path="/produtos/:id" element={<ProductDetailPage />} />
                      <Route path="/produtos/:id/editar" element={<ProductFormPage />} />
                      <Route path="/notificacoes" element={<NotificationsPage />} />
                      <Route path="/relatorios" element={<ReportsPage />} />
                    </Routes>
                  </MainContent>
                </div>
              }
            />
          </Routes>
        </Router>
      </PersistGate>
    </Provider>
  );
}

export default App;

