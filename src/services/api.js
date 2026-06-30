import axios from 'axios';

const API_BASE = '/api';

const apiClient = axios.create({
  baseURL: API_BASE,
});

// Attach token from localStorage to every request
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const api = {
  // Auth
  login: (data) => apiClient.post('/auth/login', data),
  signup: (formData) => apiClient.post('/auth/signup', formData),
  
  // Employees
  getEmployees: () => apiClient.get('/employees'),
  addEmployee: (formData) => apiClient.post('/employees', formData),
  updateEmployee: (id, formData) => apiClient.put(`/employees/${id}`, formData),
  toggleEmployeeStatus: (id) => apiClient.patch(`/employees/${id}/toggle-status`),
  
  // Categories
  getCategories: () => apiClient.get('/categories'),
  addCategory: (data) => apiClient.post('/categories', data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  updateCategory: (id, data) => apiClient.put(`/categories/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  deleteCategory: (id) => apiClient.delete(`/categories/${id}`),
  
  // Karats
  getKarats: () => apiClient.get('/karats'),
  getKaratsByType: (type) => apiClient.get(`/karats/type/${type}`),
  addKarat: (data) => apiClient.post('/karats', data),
  updateKarat: (id, data) => apiClient.put(`/karats/${id}`, data),
  deleteKarat: (id) => apiClient.delete(`/karats/${id}`),
  
  // Pricing
  getCurrentPrice: () => apiClient.get('/pricing'),
  updatePrice: (data) => apiClient.post('/pricing', data),
  
  // Branches
  getBranches: () => apiClient.get('/branches'),
  addBranch: (data) => apiClient.post('/branches', data),
  updateBranch: (id, data) => apiClient.put(`/branches/${id}`, data),
  deleteBranch: (id) => apiClient.delete(`/branches/${id}`),
  
  // Inventory
  getInventory: (params) => apiClient.get('/inventory', { params }),
  addInventory: (data) => apiClient.post('/inventory', data),
  updateInventory: (id, data) => apiClient.put(`/inventory/${id}`, data),
  deleteInventory: (id) => apiClient.delete(`/inventory/${id}`),

  // Dashboard
  getDashboard: () => apiClient.get('/dashboard'),

  // Sales
  getSales: () => apiClient.get('/sales'),
  getSaleById: (id) => apiClient.get(`/sales/${id}`),
  addSale: (data) => apiClient.post('/sales', data),
  updateSale: (id, data) => apiClient.put(`/sales/${id}`, data),
  deleteSale: (id) => apiClient.delete(`/sales/${id}`),
};