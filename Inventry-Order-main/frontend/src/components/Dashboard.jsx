import React from 'react';

export default function Dashboard({ stats, onViewChange }) {
  const { total_products = 0, total_customers = 0, total_orders = 0, low_stock_products = [] } = stats;

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => onViewChange('products')}>
          <div className="stat-header">
            <span>Total Products</span>
            <span className="stat-icon">📦</span>
          </div>
          <div className="stat-value">{total_products}</div>
        </div>

        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => onViewChange('customers')}>
          <div className="stat-header">
            <span>Total Customers</span>
            <span className="stat-icon">👥</span>
          </div>
          <div className="stat-value">{total_customers}</div>
        </div>

        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={() => onViewChange('orders')}>
          <div className="stat-header">
            <span>Total Orders</span>
            <span className="stat-icon">🛒</span>
          </div>
          <div className="stat-value">{total_orders}</div>
        </div>

        <div className="stat-card">
          <div className="stat-header">
            <span>Low Stock Alert</span>
            <span className="stat-icon" style={{ backgroundColor: low_stock_products.length > 0 ? 'var(--color-warning-bg)' : 'var(--bg-surface-hover)' }}>
              ⚠️
            </span>
          </div>
          <div className="stat-value" style={{ color: low_stock_products.length > 0 ? 'var(--color-warning)' : 'inherit' }}>
            {low_stock_products.length}
          </div>
        </div>
      </div>

      <div className="section-card">
        <h3 className="section-title">
          <span>⚠️</span> Low Stock Alert Products (Stock &lt; 10)
        </h3>
        
        {low_stock_products.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">✅</div>
            <div className="empty-text">All products are sufficiently stocked!</div>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>SKU</th>
                  <th>Price</th>
                  <th>In Stock</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {low_stock_products.map((product) => (
                  <tr key={product.id}>
                    <td style={{ fontWeight: '500' }}>{product.name}</td>
                    <td><code style={{ color: 'var(--color-info)' }}>{product.sku}</code></td>
                    <td>${Number(product.price).toFixed(2)}</td>
                    <td style={{ color: product.quantity === 0 ? 'var(--color-danger)' : 'var(--color-warning)', fontWeight: 'bold' }}>
                      {product.quantity}
                    </td>
                    <td>
                      <span className={`badge ${product.quantity === 0 ? 'badge-danger' : 'badge-warning'}`}>
                        {product.quantity === 0 ? 'Out of Stock' : 'Low Stock'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
