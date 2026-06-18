import React, { useState } from 'react';

export default function ProductList({ products, onAddProduct, onUpdateProduct, onDeleteProduct, addToast }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  
  // Form states
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openAddModal = () => {
    setEditingProduct(null);
    setName('');
    setSku('');
    setPrice('');
    setQuantity('0');
    setIsModalOpen(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setName(product.name);
    setSku(product.sku);
    setPrice(product.price.toString());
    setQuantity(product.quantity.toString());
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.strip || !sku.strip || name.trim() === '' || sku.trim() === '') {
      addToast('Product Name and SKU are required fields.', 'error');
      return;
    }

    const priceNum = parseFloat(price);
    const qtyNum = parseInt(quantity, 10);

    if (isNaN(priceNum) || priceNum < 0) {
      addToast('Price must be a valid, non-negative number.', 'error');
      return;
    }

    if (isNaN(qtyNum) || qtyNum < 0) {
      addToast('Quantity must be a valid, non-negative integer.', 'error');
      return;
    }

    const payload = {
      name: name.trim(),
      sku: sku.trim().toUpperCase(),
      price: priceNum,
      quantity: qtyNum,
    };

    setIsSubmitting(true);
    try {
      if (editingProduct) {
        await onUpdateProduct(editingProduct.id, payload);
        addToast(`Product "${payload.name}" updated successfully!`, 'success');
      } else {
        await onAddProduct(payload);
        addToast(`Product "${payload.name}" created successfully!`, 'success');
      }
      closeModal();
    } catch (err) {
      addToast(err.message || 'Failed to save product.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id, productName) => {
    if (window.confirm(`Are you sure you want to delete product "${productName}"?`)) {
      try {
        await onDeleteProduct(id);
        addToast(`Product "${productName}" deleted successfully!`, 'success');
      } catch (err) {
        addToast(err.message || 'Failed to delete product.', 'error');
      }
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Product Catalog</h2>
          <div className="page-subtitle">Manage products, pricing, and current stock levels</div>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          <span>+</span> Add Product
        </button>
      </div>

      <div className="section-card">
        {products.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <div className="empty-text">No products in catalog yet.</div>
            <button className="btn btn-secondary" onClick={openAddModal}>Add your first product</button>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>SKU</th>
                  <th>Price</th>
                  <th>Quantity in Stock</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td style={{ fontWeight: '500' }}>{product.name}</td>
                    <td><code style={{ color: 'var(--color-info)' }}>{product.sku}</code></td>
                    <td>${Number(product.price).toFixed(2)}</td>
                    <td style={{ fontWeight: '600' }}>{product.quantity}</td>
                    <td>
                      {product.quantity === 0 ? (
                        <span className="badge badge-danger">Out of Stock</span>
                      ) : product.quantity < 10 ? (
                        <span className="badge badge-warning">Low Stock</span>
                      ) : (
                        <span className="badge badge-success">In Stock</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="flex-gap" style={{ justifyContent: 'flex-end' }}>
                        <button className="btn btn-secondary btn-icon" onClick={() => openEditModal(product)} title="Edit Product">
                          ✏️
                        </button>
                        <button className="btn btn-danger btn-icon" onClick={() => handleDelete(product.id, product.name)} title="Delete Product">
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingProduct ? 'Edit Product Details' : 'Add New Product'}</h3>
              <button className="toast-close" onClick={closeModal}>&times;</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="form-group">
                    <label htmlFor="p_name">Product Name</label>
                    <input 
                      type="text" 
                      id="p_name"
                      className="form-control" 
                      placeholder="e.g. Premium Mechanical Keyboard" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="p_sku">SKU / Code</label>
                    <input 
                      type="text" 
                      id="p_sku"
                      className="form-control" 
                      placeholder="e.g. KB-MECH-87" 
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      required
                      disabled={!!editingProduct} // SKU cannot be edited traditionally or just let it remain simple
                    />
                    {editingProduct && <small style={{ color: 'var(--text-muted)' }}>SKU code is read-only.</small>}
                  </div>

                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="p_price">Price ($)</label>
                      <input 
                        type="number" 
                        id="p_price"
                        className="form-control" 
                        placeholder="0.00" 
                        step="0.01"
                        min="0"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="p_qty">Initial Quantity</label>
                      <input 
                        type="number" 
                        id="p_qty"
                        className="form-control" 
                        placeholder="0" 
                        min="0"
                        step="1"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal} disabled={isSubmitting}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : editingProduct ? 'Save Changes' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
