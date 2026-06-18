import React, { useState } from 'react';

export default function OrderList({ orders, customers, products, onAddOrder, onDeleteOrder, addToast }) {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  
  // Order Form States
  const [customerId, setCustomerId] = useState('');
  const [orderItems, setOrderItems] = useState([{ product_id: '', quantity: 1 }]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openCreateModal = () => {
    if (customers.length === 0) {
      addToast('You must create a customer before placing an order.', 'error');
      return;
    }
    if (products.length === 0) {
      addToast('You must create a product before placing an order.', 'error');
      return;
    }
    setCustomerId(customers[0]?.id.toString() || '');
    setOrderItems([{ product_id: products[0]?.id.toString() || '', quantity: 1 }]);
    setIsCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
  };

  const handleAddItem = () => {
    setOrderItems([...orderItems, { product_id: products[0]?.id.toString() || '', quantity: 1 }]);
  };

  const handleRemoveItem = (index) => {
    const newItems = [...orderItems];
    newItems.splice(index, 1);
    setOrderItems(newItems);
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...orderItems];
    if (field === 'quantity') {
      newItems[index][field] = parseInt(value, 10) || 1;
    } else {
      newItems[index][field] = value;
    }
    setOrderItems(newItems);
  };

  // Estimate total amount dynamically in frontend
  const calculateEstimate = () => {
    let estimate = 0;
    for (const item of orderItems) {
      const p = products.find((prod) => prod.id.toString() === item.product_id);
      if (p) {
        estimate += Number(p.price) * (item.quantity || 0);
      }
    }
    return estimate;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerId) {
      addToast('Please select a customer.', 'error');
      return;
    }

    // Verify order items are valid
    if (orderItems.length === 0) {
      addToast('Please add at least one item to the order.', 'error');
      return;
    }

    for (const item of orderItems) {
      if (!item.product_id) {
        addToast('Please select a product for all items.', 'error');
        return;
      }
      if (item.quantity <= 0) {
        addToast('Quantity must be greater than zero.', 'error');
        return;
      }
      
      // Check stock locally before sending to API
      const p = products.find((prod) => prod.id.toString() === item.product_id);
      if (!p) {
        addToast('Invalid product selected.', 'error');
        return;
      }
      if (p.quantity < item.quantity) {
        addToast(`Insufficient inventory for product "${p.name}". Requested: ${item.quantity}, In Stock: ${p.quantity}`, 'error');
        return;
      }
    }

    const payload = {
      customer_id: parseInt(customerId, 10),
      items: orderItems.map((item) => ({
        product_id: parseInt(item.product_id, 10),
        quantity: item.quantity,
      })),
    };

    setIsSubmitting(true);
    try {
      await onAddOrder(payload);
      addToast('Order created successfully and stock adjusted!', 'success');
      closeCreateModal();
    } catch (err) {
      addToast(err.message || 'Failed to place order.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to cancel/delete this order? Doing so will return the items back into inventory.')) {
      try {
        await onDeleteOrder(id);
        addToast('Order canceled and inventory stock restored successfully!', 'success');
      } catch (err) {
        addToast(err.message || 'Failed to delete order.', 'error');
      }
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Orders</h2>
          <div className="page-subtitle">Track receipts, total invoice amounts, and cancel/delete orders</div>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          <span>+</span> Create Order
        </button>
      </div>

      <div className="section-card">
        {orders.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🛒</div>
            <div className="empty-text">No orders recorded yet.</div>
            <button className="btn btn-secondary" onClick={openCreateModal}>Place your first order</button>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer Name</th>
                  <th>Total Amount</th>
                  <th>Items Ordered</th>
                  <th>Placed Date</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const itemsCount = order.items.reduce((acc, item) => acc + item.quantity, 0);
                  return (
                    <tr key={order.id}>
                      <td style={{ fontWeight: '600' }}>#{order.id}</td>
                      <td>
                        <div style={{ fontWeight: '500' }}>{order.customer_name}</div>
                        <small style={{ color: 'var(--text-muted)' }}>{order.customer_email}</small>
                      </td>
                      <td style={{ fontWeight: '600', color: 'var(--color-success)' }}>
                        ${Number(order.total_amount).toFixed(2)}
                      </td>
                      <td>{itemsCount} {itemsCount === 1 ? 'item' : 'items'}</td>
                      <td>{formatDate(order.created_at)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="flex-gap" style={{ justifyContent: 'flex-end' }}>
                          <button className="btn btn-secondary btn-icon" onClick={() => setSelectedOrderDetails(order)} title="View Receipt">
                            📄 View
                          </button>
                          <button className="btn btn-danger btn-icon" onClick={() => handleDelete(order.id)} title="Cancel Order">
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE ORDER MODAL */}
      {isCreateModalOpen && (
        <div className="modal-overlay" onClick={closeCreateModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Place New Order</h3>
              <button className="toast-close" onClick={closeCreateModal}>&times;</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  
                  {/* Customer Selector */}
                  <div className="form-group">
                    <label htmlFor="o_customer">Select Customer</label>
                    <select
                      id="o_customer"
                      className="form-control"
                      value={customerId}
                      onChange={(e) => setCustomerId(e.target.value)}
                      required
                    >
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name} ({c.email})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Order Items Section */}
                  <div>
                    <div className="flex-space" style={{ marginBottom: '10px' }}>
                      <label style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-secondary)' }}>
                        Items to Order
                      </label>
                      <button type="button" className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={handleAddItem}>
                        + Add Item
                      </button>
                    </div>

                    {orderItems.map((item, index) => {
                      const selectedProd = products.find((p) => p.id.toString() === item.product_id);
                      return (
                        <div key={index} className="order-builder-item">
                          <div className="form-group" style={{ flexGrow: 1 }}>
                            <label style={{ fontSize: '12px' }}>Product</label>
                            <select
                              className="form-control"
                              value={item.product_id}
                              onChange={(e) => handleItemChange(index, 'product_id', e.target.value)}
                              required
                            >
                              {products.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name} - ${Number(p.price).toFixed(2)} [Stock: {p.quantity}]
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="form-group" style={{ width: '90px' }}>
                            <label style={{ fontSize: '12px' }}>Qty</label>
                            <input
                              type="number"
                              className="form-control"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                              required
                            />
                          </div>

                          {orderItems.length > 1 && (
                            <button
                              type="button"
                              className="btn btn-danger btn-icon"
                              style={{ height: '40px', width: '40px', padding: '0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              onClick={() => handleRemoveItem(index)}
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Live Estimate */}
                  <div className="flex-space" style={{ padding: '16px', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', backgroundColor: 'rgba(255,255,255,0.01)' }}>
                    <span style={{ fontWeight: '500', color: 'var(--text-secondary)' }}>Estimated Invoice Total</span>
                    <span style={{ fontSize: '20px', fontWeight: '700', color: 'var(--color-success)' }}>
                      ${calculateEstimate().toFixed(2)}
                    </span>
                  </div>

                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeCreateModal} disabled={isSubmitting}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Processing...' : 'Place Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW ORDER DETAILS MODAL */}
      {selectedOrderDetails && (
        <div className="modal-overlay" onClick={() => setSelectedOrderDetails(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Order Invoice Details</h3>
              <button className="toast-close" onClick={() => setSelectedOrderDetails(null)}>&times;</button>
            </div>
            
            <div className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                
                {/* Meta details */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
                  <div>
                    <small style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '10px', fontWeight: 'bold' }}>Order Reference</small>
                    <div style={{ fontSize: '16px', fontWeight: '600' }}>#{selectedOrderDetails.id}</div>
                  </div>
                  <div>
                    <small style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '10px', fontWeight: 'bold' }}>Invoice Date</small>
                    <div style={{ fontSize: '14px' }}>{formatDate(selectedOrderDetails.created_at)}</div>
                  </div>
                  <div>
                    <small style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '10px', fontWeight: 'bold' }}>Customer Contact</small>
                    <div style={{ fontSize: '14px', fontWeight: '500' }}>{selectedOrderDetails.customer_name}</div>
                    <small style={{ color: 'var(--text-secondary)' }}>{selectedOrderDetails.customer_email}</small>
                  </div>
                  <div>
                    <small style={{ color: 'var(--text-muted)', textTransform: 'uppercase', fontSize: '10px', fontWeight: 'bold' }}>Invoice Total</small>
                    <div style={{ fontSize: '18px', fontWeight: '700', color: 'var(--color-success)' }}>
                      ${Number(selectedOrderDetails.total_amount).toFixed(2)}
                    </div>
                  </div>
                </div>

                {/* Items details table */}
                <div>
                  <h4 style={{ marginBottom: '12px', fontSize: '14px' }}>Line Items</h4>
                  <div className="table-wrapper">
                    <table className="data-table" style={{ fontSize: '13px' }}>
                      <thead>
                        <tr>
                          <th>Item</th>
                          <th>SKU</th>
                          <th>Price</th>
                          <th>Qty</th>
                          <th style={{ textAlign: 'right' }}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedOrderDetails.items.map((item) => (
                          <tr key={item.id}>
                            <td style={{ fontWeight: '500' }}>{item.product_name}</td>
                            <td><code style={{ color: 'var(--color-info)' }}>{item.product_sku}</code></td>
                            <td>${Number(item.price_at_order).toFixed(2)}</td>
                            <td>{item.quantity}</td>
                            <td style={{ textAlign: 'right', fontWeight: '600' }}>
                              ${(Number(item.price_at_order) * item.quantity).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            </div>
            
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setSelectedOrderDetails(null)}>
                Close Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
