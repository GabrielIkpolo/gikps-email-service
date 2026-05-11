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

export const changePassword = async (passwordData) => {
  const response = await apiClient.patch('/auth/change-password', passwordData);
  return response.data;
};
