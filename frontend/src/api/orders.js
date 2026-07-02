import api from './axios';

export const placeOrder = (data) => api.post('/orders', data);
export const getUserOrders = () => api.get('/orders/my');
export const getOrderById = (id) => api.get(`/orders/${id}`);
export const cancelOrder = (id) => api.patch(`/orders/${id}/cancel`);
export const getAllOrders = (params) => api.get('/orders/all', { params });
export const updateOrderStatus = (id, status, message) => api.patch(`/orders/${id}/status`, { status, message });
export const getAnalytics = () => api.get('/admin/analytics');