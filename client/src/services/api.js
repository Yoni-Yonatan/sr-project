import axios from 'axios';

const API_BASE = '/api';

export const api = {
  // Auth
  login: (data) => axios.post(`${API_BASE}/auth/login`, data),
  signup: (formData) => axios.post(`${API_BASE}/auth/signup`, formData),
  
  // Employees
  getEmployees: () => axios.get(`${API_BASE}/employees`),
  addEmployee: (formData) => axios.post(`${API_BASE}/employees`, formData),
  updateEmployee: (id, formData) => axios.put(`${API_BASE}/employees/${id}`, formData),
  toggleEmployeeStatus: (id) => axios.patch(`${API_BASE}/employees/${id}/toggle-status`),
  
  // Categories
  getCategories: () => axios.get(`${API_BASE}/categories`),
  addCategory: (data) => axios.post(`${API_BASE}/categories`, data),
  updateCategory: (id, data) => axios.put(`${API_BASE}/categories/${id}`, data),
  deleteCategory: (id) => axios.delete(`${API_BASE}/categories/${id}`),
  
  // Karats
  getKarats: () => axios.get(`${API_BASE}/karats`),
  getKaratsByType: (type) => axios.get(`${API_BASE}/karats/type/${type}`),
  addKarat: (data) => axios.post(`${API_BASE}/karats`, data),
  updateKarat: (id, data) => axios.put(`${API_BASE}/karats/${id}`, data),
  deleteKarat: (id) => axios.delete(`${API_BASE}/karats/${id}`),
  
  // Pricing
  getCurrentPrice: () => axios.get(`${API_BASE}/pricing`),
  updatePrice: (data) => axios.post(`${API_BASE}/pricing`, data),
  
  // Branches
  getBranches: () => axios.get(`${API_BASE}/branches`),
  addBranch: (data) => axios.post(`${API_BASE}/branches`, data),
  updateBranch: (id, data) => axios.put(`${API_BASE}/branches/${id}`, data),
  deleteBranch: (id) => axios.delete(`${API_BASE}/branches/${id}`),
  
  // Inventory
  getInventory: (params) => axios.get(`${API_BASE}/inventory`, { params }),
  addInventory: (data) => axios.post(`${API_BASE}/inventory`, data),
  updateInventory: (id, data) => axios.put(`${API_BASE}/inventory/${id}`, data),
  deleteInventory: (id) => axios.delete(`${API_BASE}/inventory/${id}`),

  // Dashboard
  getDashboard: () => axios.get(`${API_BASE}/dashboard`),

  // Sales
  getSales: () => axios.get(`${API_BASE}/sales`),
  getSaleById: (id) => axios.get(`${API_BASE}/sales/${id}`),
  addSale: (data) => axios.post(`${API_BASE}/sales`, data),
  updateSale: (id, data) => axios.put(`${API_BASE}/sales/${id}`, data),
  deleteSale: (id) => axios.delete(`${API_BASE}/sales/${id}`),
};