import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { HiX, HiPaperClip, HiSend } from 'react-icons/hi';
import { sendEmail } from '../api/mailApi';
import './ComposeModal.css';

const ComposeModal = ({ isOpen, onClose, onSendSuccess }) => {
  const [formData, setFormData] = useState({
    to: '',
    subject: '',
    text: '',
  });
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setAttachments(prev => [...prev, ...files]);
  };

  const removeAttachment = (index) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.to || !formData.subject) {
      toast.error('Recipient and Subject are required');
      return;
    }

    setLoading(true);
    try {
      await sendEmail(formData, attachments);
      toast.success('Email sent successfully!');
      setFormData({ to: '', subject: '', text: '' });
      setAttachments([]);
      onSendSuccess();
      onClose();
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Failed to send email. Please try again.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="compose-modal-overlay">
      <div className="compose-modal-container">
        <div className="compose-modal-header">
          <h2>New Message</h2>
          <button className="close-modal-button" onClick={onClose}>
            <HiX />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="compose-modal-form">
          <div className="compose-form-group">
            <label htmlFor="to">To</label>
            <input
              type="text"
              id="to"
              name="to"
              placeholder="recipient@example.com"
              value={formData.to}
              onChange={handleChange}
              required
            />
          </div>

          <div className="compose-form-group">
            <label htmlFor="subject">Subject</label>
            <input
              type="text"
              id="subject"
              name="subject"
              placeholder="Subject"
              value={formData.subject}
              onChange={handleChange}
              required
            />
          </div>

          <div className="compose-form-group message-area">
            <textarea
              name="text"
              placeholder="Write your message here..."
              value={formData.text}
              onChange={handleChange}
              required
            />
          </div>

          <div className="compose-modal-footer">
            <div className="compose-attachments">
              <label className="attachment-label">
                <HiPaperClip /> Attach Files
                <input
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
              </label>
              <div className="attachments-list">
                {attachments.map((file, index) => (
                  <div key={index} className="attachment-item">
                    <span className="attachment-name">{file.name}</span>
                    <button type="button" className="remove-attachment" onClick={() => removeAttachment(index)}>
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button type="submit" className="send-button" disabled={loading}>
              {loading ? 'Sending...' : <><HiSend /> Send</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ComposeModal;
