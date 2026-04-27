import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3005/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('API请求:', config.method, config.url, config.params || config.data);
    return config;
  },
  (error) => {
    console.error('API请求错误:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => {
    console.log('API响应:', response.config.url, response.data);
    return response.data;
  },
  (error) => {
    console.error('API响应错误:', error.response || error);
    if (error.response) {
      switch (error.response.status) {
        case 401:
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          break;
        case 403:
          console.error('权限不足');
          break;
        case 404:
          console.error('资源不存在');
          break;
        case 500:
          console.error('服务器错误');
          break;
      }
    }
    return Promise.reject(error);
  }
);

export default {
  // 认证
  login: (credentials) => apiClient.post('/auth/login', credentials),
  logout: () => apiClient.post('/auth/logout'),
  
  // 用户
  getUsers: () => apiClient.get('/auth/users'),
  getSalesUsers: () => apiClient.get('/auth/users/sales'),
  getUser: (id) => apiClient.get(`/auth/users/${id}`),
  getCurrentUser: () => apiClient.get('/auth/users/current'),
  createUser: (userData) => apiClient.post('/auth/users', userData),
  updateUser: (id, userData) => apiClient.put(`/auth/users/${id}`, userData),
  deleteUser: (id) => apiClient.delete(`/auth/users/${id}`),
  
  // 部门
  getDepartments: () => apiClient.get('/auth/departments'),
  getDepartment: (id) => apiClient.get(`/auth/departments/${id}`),
  createDepartment: (deptData) => apiClient.post('/auth/departments', deptData),
  updateDepartment: (id, deptData) => apiClient.put(`/auth/departments/${id}`, deptData),
  deleteDepartment: (id) => apiClient.delete(`/auth/departments/${id}`),
  getDepartmentUsers: (id) => apiClient.get(`/auth/departments/${id}/users`),
  
  // 职位
  getPositions: () => apiClient.get('/auth/positions'),
  getPosition: (id) => apiClient.get(`/auth/positions/${id}`),
  getPositionsByDepartment: (departmentId) => apiClient.get(`/auth/positions/department/${departmentId}`),
  createPosition: (positionData) => apiClient.post('/auth/positions', positionData),
  updatePosition: (id, positionData) => apiClient.put(`/auth/positions/${id}`, positionData),
  deletePosition: (id) => apiClient.delete(`/auth/positions/${id}`),
  syncPositionsFromUsers: () => apiClient.post('/auth/positions/sync-from-users'),
  
  // 项目
  getProjects: () => apiClient.get('/projects'),
  getProject: (id) => apiClient.get(`/projects/${id}`),
  createProject: (projectData) => apiClient.post('/projects', projectData),
  updateProject: (id, projectData) => apiClient.put(`/projects/${id}`, projectData),
  deleteProject: (id) => apiClient.delete(`/projects/${id}`),
  getProjectStats: () => apiClient.get('/projects/stats/summary'),
  
  // 供应商
  getSuppliers: () => apiClient.get('/purchase/suppliers'),
  getSupplier: (id) => apiClient.get(`/purchase/suppliers/${id}`),
  createSupplier: (supplierData) => apiClient.post('/purchase/suppliers', supplierData),
  updateSupplier: (id, supplierData) => apiClient.put(`/purchase/suppliers/${id}`, supplierData),
  deleteSupplier: (id) => apiClient.delete(`/purchase/suppliers/${id}`),
  
  // 物料
  getMaterials: () => apiClient.get('/purchase/materials'),
  getMaterial: (id) => apiClient.get(`/purchase/materials/${id}`),
  createMaterial: (materialData) => apiClient.post('/purchase/materials', materialData),
  updateMaterial: (id, materialData) => apiClient.put(`/purchase/materials/${id}`, materialData),
  deleteMaterial: (id) => apiClient.delete(`/purchase/materials/${id}`),

  // 客户
  getCustomers: (params) => apiClient.get('/customers', { params }),
  getCustomer: (id) => apiClient.get(`/customers/${id}`),
  createCustomer: (customerData) => apiClient.post('/customers', customerData),
  updateCustomer: (id, customerData) => apiClient.put(`/customers/${id}`, customerData),
  deleteCustomer: (id) => apiClient.delete(`/customers/${id}`),
  getCustomerStatistics: () => apiClient.get('/customers/statistics'),
  getCustomerContacts: (customerId) => apiClient.get(`/customers/${customerId}/contacts`),
  addCustomerContact: (customerId, contactData) => apiClient.post(`/customers/${customerId}/contacts`, contactData),
  updateCustomerContact: (customerId, contactId, contactData) => apiClient.put(`/customers/${customerId}/contacts/${contactId}`, contactData),
  deleteCustomerContact: (customerId, contactId) => apiClient.delete(`/customers/${customerId}/contacts/${contactId}`),
  getCustomerActivities: (customerId, params) => apiClient.get(`/customers/${customerId}/activities`, { params }),
  addCustomerActivity: (customerId, activityData) => apiClient.post(`/customers/${customerId}/activities`, activityData),
  getCustomerDetailStatistics: (customerId) => apiClient.get(`/customers/${customerId}/statistics`),
  claimCustomer: (customerId) => apiClient.post(`/customers/${customerId}/claim`),
  releaseCustomer: (customerId) => apiClient.post(`/customers/${customerId}/release`),
  assignCustomer: (customerId, assignData) => apiClient.post(`/customers/${customerId}/assign`, assignData),
  getCustomerPoolLogs: (customerId, params) => apiClient.get(`/customers/${customerId}/pool-logs`, { params }),
  getCustomerPoolStatistics: () => apiClient.get('/customers/pool/statistics'),

  // 竞争对手
  getCompetitors: (params) => apiClient.get('/competitors', { params }),
  getCompetitor: (id) => apiClient.get(`/competitors/${id}`),
  createCompetitor: (competitorData) => apiClient.post('/competitors', competitorData),
  updateCompetitor: (id, competitorData) => apiClient.put(`/competitors/${id}`, competitorData),
  deleteCompetitor: (id) => apiClient.delete(`/competitors/${id}`),

  // 仪表盘统计
  getDashboardStats: () => apiClient.get('/dashboard/stats'),
  
  // 销售管理
  getSalesDashboard: () => apiClient.get('/sales/dashboard'),
  getPriceCalculations: () => apiClient.get('/sales/price-calculations'),
  getQuotations: () => apiClient.get('/sales/quotations'),
  getBiddingProjects: () => apiClient.get('/sales/bidding'),
  getContracts: () => apiClient.get('/sales/contracts'),
  getPaymentRecords: () => apiClient.get('/sales/payments')
};
