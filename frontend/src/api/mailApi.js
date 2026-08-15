import apiClient from './client';

/**
 * Send email with optional file attachments.
 * Supports cancellation via AbortController for the cancel button feature.
 * @param {Object} emailData - Email data (to, subject, text)
 * @param {File[]} attachments - Array of File objects to attach
 * @param {AbortSignal} [signal] - Optional AbortSignal for cancellation
 * @returns {Promise<Object>} - API response
 */
export const sendEmail = async (emailData, attachments = [], signal) => {
  const formData = new FormData();
  
  // Append simple fields
  formData.append('to', emailData.to);
  formData.append('subject', emailData.subject);
  formData.append('text', emailData.text || '');
  formData.append('html', emailData.html || '');

  // Append attachments with progress tracking
  if (attachments && attachments.length > 0) {
    for (const file of attachments) {
      formData.append('attachments', file);
    }
  }

  const config = {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    timeout: 120000, // 2 minute timeout for file uploads (longer than default)
  };

  // Add abort signal if provided (for cancel button support)
  if (signal) {
    config.signal = signal;
  }

  const response = await apiClient.post('/mail/send', formData, config);
  return response.data;
};

export const getInbox = async (search = '') => {
  const response = await apiClient.get('/mail/inbox', {
    params: { search }
  });
  return response.data;
};

export const getSent = async (search = '') => {
  const response = await apiClient.get('/mail/sent', {
    params: { search }
  });
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
