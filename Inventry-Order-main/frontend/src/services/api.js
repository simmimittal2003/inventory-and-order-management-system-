const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

async function request(path, options = {}) {
  const url = `${API_BASE_URL}${path}`;
  
  // Set default headers
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);
    
    // For 204 No Content, return success/true
    if (response.status === 204) {
      return true;
    }

    const data = await response.json();
    
    if (!response.ok) {
      // Extract FastAPI error details
      const errorMsg = data.detail || 'An unexpected error occurred';
      const error = new Error(errorMsg);
      error.status = response.status;
      error.details = data;
      throw error;
    }

    return data;
  } catch (error) {
    if (error instanceof TypeError) {
      // Network error (API down)
      throw new Error('Network error: Unable to connect to the backend server. Please ensure the backend is running.');
    }
    throw error;
  }
}

export const apiService = {
  // Dashboard
  getDashboardStats: (threshold = 10) => request(`/dashboard/stats?threshold=${threshold}`),

  // Products
  getProducts: () => request('/products/'),
  getProduct: (id) => request(`/products/${id}`),
  createProduct: (product) => request('/products/', {
    method: 'POST',
    body: JSON.stringify(product),
  }),
  updateProduct: (id, product) => request(`/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(product),
  }),
  deleteProduct: (id) => request(`/products/${id}`, {
    method: 'DELETE',
  }),

  // Customers
  getCustomers: () => request('/customers/'),
  getCustomer: (id) => request(`/customers/${id}`),
  createCustomer: (customer) => request('/customers/', {
    method: 'POST',
    body: JSON.stringify(customer),
  }),
  deleteCustomer: (id) => request(`/customers/${id}`, {
    method: 'DELETE',
  }),

  // Orders
  getOrders: () => request('/orders/'),
  getOrder: (id) => request(`/orders/${id}`),
  createOrder: (order) => request('/orders/', {
    method: 'POST',
    body: JSON.stringify(order),
  }),
  deleteOrder: (id) => request(`/orders/${id}`, {
    method: 'DELETE',
  }),
};
