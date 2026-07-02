import api from './axios';

export const getMenuItems = (params) => api.get('/menu', { params });
export const getMenuItemById = (id) => api.get(`/menu/${id}`);
export const getSearchSuggestions = (q) => api.get('/menu/suggestions', { params: { q } });
export const createMenuItem = (formData) =>
  api.post('/menu', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const updateMenuItem = (id, formData) =>
  api.put(`/menu/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const deleteMenuItem = (id) => api.delete(`/menu/${id}`);
export const toggleItemAvailability = (id) => api.patch(`/menu/${id}/toggle`);
