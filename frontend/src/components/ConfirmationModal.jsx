import React from 'react';
import { HiCheck, HiX } from 'react-icons/hi';
import './ConfirmationModal.css';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', cancelText = 'Cancel', type = 'warning' }) => {
  if (!isOpen) return null;

  const getTypeClass = () => {
    switch (type) {
      case 'danger': return 'modal-type-danger';
      case 'success': return 'modal-type-success';
      default: return 'modal-type-warning';
    }
  };

  return (
    <div className="confirmation-modal-overlay">
      <div className="confirmation-modal-container">
        <div className={`confirmation-modal-icon ${getTypeClass()}`}>
          {type === 'danger' ? '!' : type === 'success' ? '✓' : '?'}
        </div>
        <h3 className="confirmation-modal-title">{title}</h3>
        <p className="confirmation-modal-message">{message}</p>
        <div className="confirmation-modal-actions">
          <button className="confirm-cancel-button" onClick={onClose}>
            {cancelText}
          </button>
          <button className={`confirm-action-button ${getTypeClass()}`} onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
