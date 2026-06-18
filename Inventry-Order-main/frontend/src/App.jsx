import React, { useState, useEffect } from 'react';
import { apiService } from './services/api';
import Dashboard from './components/Dashboard';
import ProductList from './components/ProductList';
import CustomerList from './components/CustomerList';
import OrderList from './components/OrderList';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState({ total_products: 0, total_customers: 0, total_orders: 0, low_stock_products: [] });
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [orders, setOrders] = useState([]);
  
  // Toast notifications state
  const [toasts, setToasts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [apiError, setApiError] = useState(null);

  const addToast = (message, type = 'success') => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    
    // Automatically remove after 5 seconds
    setTimeout(() => {
      removeToast(id);
    }, 5000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  // Sync data from backend
  const refreshData = async () => {
    try {
      setApiError(null);
      const [statsData, productsData, customersData, ordersData] = await Promise.all([
        apiService.getDashboardStats(),
        apiService.getProducts(),
        apiService.getCustomers(),
        apiService.getOrders()
      ]);
      
      setStats(statsData);
      setProducts(productsData);
      setCustomers(customersData);
      setOrders(ordersData);
    } catch (err) {
      console.error(err);
      setApiError(err.message || 'Could not connect to the backend server.');
      addToast(err.message || 'Failed to refresh data from server.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
    // Poll stats every 30 seconds to keep dashboard alive
    const interval = setInterval(refreshData, 30000);
    return () => clearInterval(interval);
  }, []);

  // API wrappers
  const handleAddProduct = async (product) => {
    await apiService.createProduct(product);
    await refreshData();
  };

  const handleUpdateProduct = async (id, product) => {
    await apiService.updateProduct(id, product);
    await refreshData();
  };

  const handleDeleteProduct = async (id) => {
    await apiService.deleteProduct(id);
    await refreshData();
  };

  const handleAddCustomer = async (customer) => {
    await apiService.createCustomer(customer);
    await refreshData();
  };

  const handleDeleteCustomer = async (id) => {
    await apiService.deleteCustomer(id);
    await refreshData();
  };

  const handleAddOrder = async (order) => {
    await apiService.createOrder(order);
    await refreshData();
  };

  const handleDeleteOrder = async (id) => {
    await apiService.deleteOrder(id);
    await refreshData();
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="empty-state" style={{ marginTop: '80px' }}>
          <div className="empty-icon">⏳</div>
          <div className="empty-text">Loading application data...</div>
        </div>
      );
    }

    if (apiError && products.length === 0 && customers.length === 0) {
      return (
        <div className="empty-state" style={{ marginTop: '80px' }}>
          <div className="empty-icon">🔌</div>
          <div className="empty-text text-danger" style={{ fontWeight: '600' }}>Backend Disconnected</div>
          <div className="empty-text" style={{ maxWidth: '450px', margin: '8px auto 20px' }}>
            {apiError}
          </div>
          <button className="btn btn-primary" onClick={() => { setIsLoading(true); refreshData(); }}>
            🔄 Retry Connection
          </button>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return <Dashboard stats={stats} onViewChange={setActiveTab} />;
      case 'products':
        return (
          <ProductList 
            products={products} 
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            addToast={addToast}
          />
        );
      case 'customers':
        return (
          <CustomerList 
            customers={customers} 
            onAddCustomer={handleAddCustomer}
            onDeleteCustomer={handleDeleteCustomer}
            addToast={addToast}
          />
        );
      case 'orders':
        return (
          <OrderList 
            orders={orders}
            customers={customers}
            products={products}
            onAddOrder={handleAddOrder}
            onDeleteOrder={handleDeleteOrder}
            addToast={addToast}
          />
        );
      default:
        return <Dashboard stats={stats} onViewChange={setActiveTab} />;
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-logo">📦</span>
          <span className="brand-name">StockFlow</span>
        </div>

        <nav>
          <ul className="nav-links">
            <li className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}>
              <button onClick={() => setActiveTab('dashboard')}>
                <span>📊</span> Dashboard
              </button>
            </li>
            <li className={`nav-item ${activeTab === 'products' ? 'active' : ''}`}>
              <button onClick={() => setActiveTab('products')}>
                <span>📦</span> Products
              </button>
            </li>
            <li className={`nav-item ${activeTab === 'customers' ? 'active' : ''}`}>
              <button onClick={() => setActiveTab('customers')}>
                <span>👥</span> Customers
              </button>
            </li>
            <li className={`nav-item ${activeTab === 'orders' ? 'active' : ''}`}>
              <button onClick={() => setActiveTab('orders')}>
                <span>🛒</span> Orders
              </button>
            </li>
          </ul>
        </nav>

        <div className="sidebar-footer">
          <p>StockFlow Admin v1.0</p>
          <p style={{ marginTop: '4px' }}>Status: {apiError ? '🔴 Offline' : '🟢 Online'}</p>
        </div>
      </aside>

      {/* Main Page Area */}
      <main className="main-content">
        {apiError && (
          <div style={{ backgroundColor: 'var(--color-danger-bg)', color: 'var(--color-danger)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '12px 18px', marginBottom: '24px', fontSize: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>⚠️ API Connection Error: Failed to sync with the backend. Please check network.</span>
            <button className="btn btn-secondary btn-icon" style={{ padding: '2px 8px', fontSize: '11px', color: 'var(--color-danger)' }} onClick={refreshData}>
              Sync Now
            </button>
          </div>
        )}
        {renderContent()}
      </main>

      {/* Toast Notification Container */}
      <div className="toast-container">
        {toasts.map((toast) => (
          <div key={toast.id} className={`toast ${toast.type === 'error' ? 'toast-error' : 'toast-success'}`}>
            <span style={{ fontSize: '18px' }}>{toast.type === 'error' ? '❌' : '✅'}</span>
            <div className="toast-message">{toast.message}</div>
            <button className="toast-close" onClick={() => removeToast(toast.id)}>&times;</button>
          </div>
        ))}
      </div>
    </div>
  );
}
