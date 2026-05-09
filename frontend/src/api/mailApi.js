import apiClient from './client';

export const sendEmail = async (emailData, attachments = []) => {
  const formData = new FormData();
  
  // Append simple fields
  formData.append('to', emailData.to);
  formData.append('subject', emailData.subject);
  formData.append('text', emailData.text);
  formData.append('html', emailData.html || '');

  // Append attachments
  attachments.forEach((file) => {
    formData.append('attachments', file);
  });

  const response = await apiClient.post('/mail/send', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getInbox = async () => {
  const response = await apiClient.get('/mail/inbox');
  return response.data;
};

export const getSent = async () => {
  const response = await apiClient.get('/mail/sent');
  return response.data;
};

export const getEmail = async (id) => {
  const response = await apiClient.get(`/mail/${id}`);
  return response.data;
};

export const updateEmailStatus = async (id, statusUpdate) => {
  const response = await apiClient.patch(`/mail/${id}`, statusUpdate);
  return response.data;
};

export const deleteEmail = async (id) => {
  const response = await apiClient.delete(`/mail/${id}`);
  return response.data;
};
