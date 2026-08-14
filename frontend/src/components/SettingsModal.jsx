import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { changePassword, updateMe } from '../api/authApi';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import PasswordInput from './PasswordInput';
import { HiX, HiCheck, HiSun, HiMoon } from 'react-icons/hi';
import './SettingsModal.css';

const SettingsModal = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('profile'); // 'profile', 'security', 'appearance'
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({ fullName: '' });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
  });

  useEffect(() => {
    if (isOpen && user) {
      setProfileData({ fullName: user.fullName || '' });
    }
  }, [isOpen, user]);

  if (!isOpen) return null;

  const handleProfileInputChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await updateMe({ fullName: profileData.fullName });
      toast.success('Profile updated successfully!');
    } catch (err) {
      console.error('Error updating profile:', err);
      toast.error(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitPasswordChange = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await changePassword(passwordData);
      toast.success('Password updated successfully!');
      setPasswordData({ currentPassword: '', newPassword: '' });
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
            <button 
              className={`settings-tab-item ${activeTab === 'appearance' ? 'active' : ''}`}
              onClick={() => setActiveTab('appearance')}
            >
              Appearance
            </button>
          </aside>

          <main className="settings-content">
            {activeTab === 'profile' && (
              <div className="settings-tab-content">
                <h3>Profile Information</h3>
                <p className="settings-info-text">Manage your public profile information.</p>
                
                <form className="settings-form" onSubmit={handleProfileSubmit}>
                  <div className="form-group">
                    <label htmlFor="fullName">Full Name</label>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      value={profileData.fullName}
                      onChange={handleProfileInputChange}
                      required
                    />
                  </div>
                  <button 
                    type="submit" 
                    className="submit-button" 
                    disabled={loading}
                  >
                    {loading ? 'Updating...' : 'Update Profile'}
                    {!loading && <HiCheck className="submit-icon" />}
                  </button>
                </form>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="settings-tab-content">
                <h3>Security Settings</h3>
                <p className="settings-info-text">Update your password and security credentials.</p>
                
                <form className="settings-form" onSubmit={handleSubmitPasswordChange}>
                  <PasswordInput
                    id="currentPassword"
                    name="currentPassword"
                    label="Current Password"
                    value={passwordData.currentPassword}
                    onChange={handlePasswordInputChange}
                    placeholder="••••••••"
                    required
                    showStrength={false}
                  />

                  <PasswordInput
                    id="newPassword"
                    name="newPassword"
                    label="New Password"
                    value={passwordData.newPassword}
                    onChange={handlePasswordInputChange}
                    placeholder="••••••••"
                    required
                    showStrength={true}
                  />

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

            {activeTab === 'appearance' && (
              <div className="settings-tab-content">
                <h3>Appearance</h3>
                <p className="settings-info-text">Customize how GikpsMail looks for you.</p>
                
                <div className="appearance-options">
                  <div className="theme-selector">
                    <label className="theme-label">Theme</label>
                    <button 
                      className={`theme-toggle-modal ${theme === 'dark' ? 'active' : ''}`}
                      onClick={toggleTheme}
                      aria-label="Toggle dark mode"
                    >
                      {theme === 'dark' ? (
                        <>
                          <HiMoon size={20} />
                          <span>Dark Mode</span>
                        </>
                      ) : (
                        <>
                          <HiSun size={20} />
                          <span>Light Mode</span>
                        </>
                      )}
                    </button>
                  </div>
                  
                  <div className="theme-preview">
                    <p className="settings-info-text" style={{ fontSize: '0.8125rem' }}>
                      {theme === 'dark' 
                        ? 'Dark mode is active. The interface uses darker colors to reduce eye strain in low-light environments.'
                        : 'Light mode is active. The interface uses bright colors for optimal readability in well-lit environments.'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
