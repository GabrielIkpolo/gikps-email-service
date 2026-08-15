import React, { useState, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { HiX, HiPaperClip, HiStop } from 'react-icons/hi';
import { HiPaperAirplane } from 'react-icons/hi2';
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
  const [canceling, setCanceling] = useState(false);
  const abortControllerRef = useRef(null);

  // Clean up abort controller when modal closes
  React.useEffect(() => {
    if (!isOpen && abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setAttachments(prev => [...prev, ...files]);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
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

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();
    setLoading(true);
    setCanceling(false);

    try {
      await sendEmail(formData, attachments, abortControllerRef.current.signal);
      toast.success('Email sent successfully!');
      setFormData({ to: '', subject: '', text: '' });
      setAttachments([]);
      onSendSuccess();
      onClose();
    } catch (err) {
      // Don't show error for intentional cancellation
      if (err.name === 'AbortError') {
        toast.info('Email sending cancelled.');
        return;
      }
      const errorMessage = err.response?.data?.error || 
                           err.message === 'timeout of 120000ms exceeded' ? 
                           'Sending is taking too long. Please try again with smaller attachments.' :
                           'Failed to send email. Please try again.';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
      setCanceling(false);
      abortControllerRef.current = null;
    }
  };

  const handleCancelSend = () => {
    if (abortControllerRef.current) {
      setCanceling(true);
      abortControllerRef.current.abort();
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
                    <span className="attachment-name" title={`${file.name} (${formatFileSize(file.size)})`}>
                      {file.name}
                    </span>
                    <span className="attachment-size">{formatFileSize(file.size)}</span>
                    <button type="button" className="remove-attachment" onClick={() => removeAttachment(index)}>
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="send-actions">
              {loading && (
                <button 
                  type="button" 
                  className="cancel-button"
                  onClick={handleCancelSend}
                  disabled={canceling}
                >
                  {canceling ? 'Cancelling...' : <><HiStop /> Cancel</>}
                </button>
              )}
              <button type="submit" className="send-button" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Sending...
                  </>
                ) : <><HiPaperAirplane /> Send</>}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ComposeModal;
