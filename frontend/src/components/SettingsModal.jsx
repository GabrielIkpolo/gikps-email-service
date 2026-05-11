import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { changePassword } from '../api/authApi';
import { HiX, HiCheck } from 'react-icons/hi';
import './SettingsModal.css';

const SettingsModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'security'
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
  });

  if (!isOpen) return null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmitPasswordChange = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await changePassword(formData);
      toast.success('Password updated successfully!');
      setFormData({ currentPassword: '', newPassword: '' });
      onClose();
    } catch (err) {
      console.error('Error changing password:', err);
      toast.error(err.response?.data?.error || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-modal-overlay">
      <div className="settings-modal-container">
        <header className="settings-modal-header">
          <h2>Settings</h2>
          <button className="close-button" onClick={onClose}>
            <HiX />
          </button>
        </header>

        <div className="settings-modal-body">
          <aside className="settings-sidebar">
            <button 
              className={`settings-tab-item ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              Profile
            </button>
            <button 
              className={`settings-tab-item ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => setActiveTab('security')}
            >
              Security
            </button>
          </aside>

          <main className="settings-content">
            {activeTab === 'profile' && (
              <div className="settings-tab-content">
                <h3>Profile Information</h3>
                <p className="settings-info-text">Manage your public profile information.</p>
                <div className="settings-form-placeholder">
                  <p>Profile management coming soon...</p>
                </div>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="settings-tab-content">
                <h3>Security Settings</h3>
                <p className="settings-info-text">Update your password and security credentials.</p>
                
                <form className="settings-form" onSubmit={handleSubmitPasswordChange}>
                  <div className="form-group">
                    <label htmlFor="currentPassword">Current Password</label>
                    <input
                      type="password"
                      id="currentPassword"
                      name="currentPassword"
                      value={formData.currentPassword}
                      onChange={handleInputChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="newPassword">New Password</label>
                    <input
                      type="password"
                      id="newPassword"
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleInputChange}
                      required
                    />
                    <small>Must be at least 8 characters long.</small>
                  </div>

                  <button 
                    type="submit" 
                    className="submit-button" 
                    disabled={loading}
                  >
                    {loading ? 'Updating...' : 'Update Password'}
                    {!loading && <HiCheck className="submit-icon" />}
                  </button>
                </form>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
