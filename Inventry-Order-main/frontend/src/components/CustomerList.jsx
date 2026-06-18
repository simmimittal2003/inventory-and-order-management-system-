import React, { useState } from 'react';

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export default function CustomerList({ customers, onAddCustomer, onDeleteCustomer, addToast }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openModal = () => {
    setName('');
    setEmail('');
    setPhone('');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      addToast('Customer Name and Email are required.', 'error');
      return;
    }

    if (!EMAIL_REGEX.test(email.trim())) {
      addToast('Please enter a valid email address.', 'error');
      return;
    }

    const payload = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim() || null,
    };

    setIsSubmitting(true);
    try {
      await onAddCustomer(payload);
      addToast(`Customer "${payload.name}" created successfully!`, 'success');
      closeModal();
    } catch (err) {
      addToast(err.message || 'Failed to save customer.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id, customerName) => {
    if (window.confirm(`Are you sure you want to delete customer "${customerName}"? All their associated orders will also be deleted.`)) {
      try {
        await onDeleteCustomer(id);
        addToast(`Customer "${customerName}" deleted successfully!`, 'success');
      } catch (err) {
        addToast(err.message || 'Failed to delete customer.', 'error');
      }
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h2 className="page-title">Customers</h2>
          <div className="page-subtitle">Manage client accounts and trace contact information</div>
        </div>
        <button className="btn btn-primary" onClick={openModal}>
          <span>+</span> Add Customer
        </button>
      </div>

      <div className="section-card">
        {customers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">👥</div>
            <div className="empty-text">No customers registered yet.</div>
            <button className="btn btn-secondary" onClick={openModal}>Register your first customer</button>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Customer Name</th>
                  <th>Email Address</th>
                  <th>Phone Number</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id}>
                    <td style={{ fontWeight: '500' }}>{customer.name}</td>
                    <td><a href={`mailto:${customer.email}`} style={{ color: 'var(--color-primary)', textDecoration: 'none' }}>{customer.email}</a></td>
                    <td>{customer.phone || <em style={{ color: 'var(--text-muted)' }}>None</em>}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div className="flex-gap" style={{ justifyContent: 'flex-end' }}>
                        <button className="btn btn-danger btn-icon" onClick={() => handleDelete(customer.id, customer.name)} title="Delete Customer">
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
              <h3>Create Customer Account</h3>
              <button className="toast-close" onClick={closeModal}>&times;</button>
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="form-group">
                    <label htmlFor="c_name">Full Name</label>
                    <input 
                      type="text" 
                      id="c_name"
                      className="form-control" 
                      placeholder="e.g. John Doe" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="c_email">Email Address</label>
                    <input 
                      type="email" 
                      id="c_email"
                      className="form-control" 
                      placeholder="e.g. john.doe@example.com" 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="c_phone">Phone Number (Optional)</label>
                    <input 
                      type="text" 
                      id="c_phone"
                      className="form-control" 
                      placeholder="e.g. +1 (555) 019-2834" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>
              </div>
              
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={closeModal} disabled={isSubmitting}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Register Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
