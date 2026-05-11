import apiClient from './client';

export const login = async (credentials) => {
  const response = await apiClient.post('/auth/login', credentials);
  return response.data;
};

export const register = async (userData) => {
  const response = await apiClient.post('/auth/register', userData);
  return response.data;
};

export const checkUsername = async (username) => {
  const response = await apiClient.get(`/auth/check-username/${username}`);
  return response.data;
};

export const getMe = async () => {
  const response = await apiClient.get('/auth/me');
  return response.data;
};

export const updateMe = async (userData) => {
  const response = await apiClient.patch('/auth/me', userData);
  return response.data;
};

export const changePassword = async (passwordData) => {
  const response = await apiClient.patch('/auth/change-password', passwordData);
  return response.data;
};

export const forgotPassword = async (email) => {
  const response = await apiClient.post('/auth/forgot-password', { email });
  return response.data;
};

export const resetPassword = async (token, newPassword) => {
  const response = await apiClient.post('/auth/reset-password', { token, newPassword });
  return response.data;
};
