import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { getInbox, getSent, updateEmailStatus, deleteEmail } from '../api/mailApi';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { io } from 'socket.io-client';
import { 
  HiInbox, 
  HiOutlineMail, 
  HiOutlinePaperAirplane, 
  HiOutlineStar, 
  HiOutlineTrash, 
  HiLogout,
  HiPlus,
  HiPaperClip,
  HiMenu,
  HiSearch,
  HiX,
  HiCog
} from 'react-icons/hi';
import ComposeModal from '../components/ComposeModal';
import SettingsModal from '../components/SettingsModal';
import ConfirmationModal from '../components/ConfirmationModal';
import './Dashboard.css';

const Dashboard = () => {
  const { user, logout, updateUser } = useAuth();
  const { theme } = useTheme();
  const [emails, setEmails] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [view, setView] = useState('inbox'); // 'inbox', 'sent'
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isComposeModalOpen, setIsComposeModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [emailToDelete, setEmailToDelete] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const navigate = useNavigate();

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  const handleNavClick = (newView) => {
    setView(newView);
    setSearchQuery('');
    setDebouncedSearchQuery('');
    if (window.innerWidth <= 768) {
      setIsSidebarOpen(false);
    }
  };

  const handleComposeOpen = () => {
    setIsComposeModalOpen(true);
    if (window.innerWidth <= 768) {
      setIsSidebarOpen(false);
    }
  };

  const handleComposeSuccess = () => {
    fetchEmails(searchQuery);
  };

  useEffect(() => {
    if (user) {
      fetchEmails(debouncedSearchQuery);
    }
  }, [view, debouncedSearchQuery, user]);

  useEffect(() => {
    if (!user) return;

    const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    const socket = io(SOCKET_URL);

    socket.on('connect', () => {
      socket.emit('join', user.id);
    });

    socket.on('new-email', (data) => {
      const { type, email } = data;
      
      if (type === 'received') {
        toast.success(`New email from ${email.sender?.fullName || email.sender?.username || 'Someone'}`);
      }

      setEmails(prevEmails => {
        // Prevent duplicates
        if (prevEmails.find(em => em.id === email.id)) {
          return prevEmails;
        }

        if (type === 'received' && view === 'inbox') {
          return [email, ...prevEmails];
        } else if (type === 'sent' && view === 'sent') {
          return [email, ...prevEmails];
        }
        return prevEmails;
      });
    });

    socket.on('profile-updated', (data) => {
      if (data.user && data.user.id === user.id) {
        updateUser(data.user);
        toast.success('Profile updated successfully!');
      }
    });
    
    return () => {
      socket.disconnect();
    };
  }, [user, view, updateUser]);

  const fetchEmails = async (search = '') => {
    if (!user) return;
    setLoading(true);
    try {
      let data;
      if (view === 'inbox') {
        data = await getInbox(search);
      } else {
        data = await getSent(search);
      }
      setEmails(data.data.emails);
    } catch (err) {
      if (err.response?.status === 401) {
        return;
      }
      console.error('Error fetching emails:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const handleSelectEmail = async (email) => {
    setSelectedEmail(email);
    if (!email.isRead) {
      await updateEmailStatus(email.id, { isRead: true });
      fetchEmails(searchQuery);
    }
  };

  const handleDeleteEmail = (id, e) => {
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    setEmailToDelete(id);
    setIsConfirmDeleteOpen(true);
  };

  const confirmDeleteEmail = async () => {
    if (!emailToDelete) return;

    try {
      await deleteEmail(emailToDelete);
      if (selectedEmail && selectedEmail.id === emailToDelete) {
        setSelectedEmail(null);
      }
      fetchEmails(searchQuery);
      toast.success('Email deleted successfully');
    } catch (err) {
      console.error('Error deleting email:', err);
      toast.error(err.response?.data?.error || 'Failed to delete email');
    } finally {
      setIsConfirmDeleteOpen(false);
      setEmailToDelete(null);
    }
  };

  const handleToggleStar = async (e, id) => {
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    const currentStatus = emails.find(em => em.id === id)?.isStarred;
    await updateEmailStatus(id, { isStarred: !currentStatus });
    fetchEmails(searchQuery);
  };

  return (
    <div className={`dashboard-layout ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      {/* Mobile Overlay */}
      <div 
        className={`sidebar-overlay ${isSidebarOpen ? 'visible' : ''}`} 
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`sidebar ${isSidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <h1 className="logo">GikpsMail</h1>
          <button className="close-sidebar-button" onClick={toggleSidebar}>
            <HiX />
          </button>
        </div>

        <nav className="sidebar-nav">
          <button 
            className={`nav-item ${view === 'inbox' ? 'active' : ''}`}
            onClick={() => handleNavClick('inbox')}
          >
            <HiInbox className="nav-icon" /> Inbox
          </button>
          <button 
            className={`nav-item ${view === 'sent' ? 'active' : ''}`}
            onClick={() => handleNavClick('sent')}
          >
            <HiOutlinePaperAirplane className="nav-icon" /> Sent
          </button>
          <button className="nav-item">
            <HiOutlineStar className="nav-icon" /> Starred
          </button>
          <button className="nav-item">
            <HiOutlineTrash className="nav-icon" /> Trash
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">{user?.fullName?.[0] || 'U'}</div>
            <div className="user-details">
              <span className="user-name">{user?.fullName || 'User'}</span>
              <span className="user-email">{user?.email}</span>
            </div>
          </div>
          <div className="sidebar-footer-actions">
            <button 
              className="settings-button" 
              title="Settings"
              onClick={() => setIsSettingsModalOpen(true)}
            >
              <HiCog />
            </button>
            <button className="logout-button" onClick={handleLogout}>
              <HiLogout /> Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {!selectedEmail ? (
          <div className="email-list-view">
            <header className="list-header">
              <div className="list-header-left">
                <button className="menu-toggle-button" onClick={toggleSidebar}>
                  <HiMenu />
                </button>
                <h2 className="list-title">{view === 'inbox' ? 'Inbox' : 'Sent'}</h2>
              </div>
              <div className="list-header-right">
                <div className="search-container">
                  <HiSearch className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search emails..."
                    className="search-input"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <button 
                  className="compose-button"
                  onClick={handleComposeOpen}
                >
                  <HiPlus /> <span className="compose-text">Compose</span>
                </button>
              </div>
            </header>

            {loading ? (
              <LoadingSpinner message="Fetching emails..." />
            ) : (
              <div className="email-list">
                {emails.length === 0 ? (
                  <div className="empty-state">No emails found.</div>
                ) : (
                  emails.map((email) => (
                    <div 
                      key={email.id} 
                      className={`email-item ${email.isRead ? 'unread' : ''}`}
                      onClick={() => handleSelectEmail(email)}
                    >
                      <div className="email-item-actions">
                        <button 
                          className="star-button"
                          onClick={(e) => handleToggleStar(e, email.id)}
                        >
                          {email.isStarred ? '★' : '☆'}
                        </button>
                        <button 
                          className="delete-button"
                          onClick={(e) => handleDeleteEmail(email.id, e)}
                        >
                          🗑
                        </button>
                      </div>
                      <div className="email-item-main">
                        <div className="email-sender">
                          {email.isMine ? 'Me' : (email.sender?.fullName || email.sender?.username || 'Someone')}
                        </div>
                        <div className="email-subject">{email.subject}</div>
                        <div className="email-preview">{email.text?.substring(0, 80)}...</div>
                      </div>
                      <div className="email-item-meta">
                        {new Date(email.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="email-detail-view">
            <header className="detail-header">
              <button className="back-button" onClick={() => setSelectedEmail(null)}>
                ← Back to List
              </button>
              <div className="detail-actions">
                <button onClick={() => handleDeleteEmail(selectedEmail.id, (e) => {})}>Delete</button>
                <button onClick={() => handleToggleStar(null, selectedEmail.id)}>Star</button>
              </div>
            </header>

            <div className="email-content">
              <div className="email-meta">
                <h1 className="email-subject">{selectedEmail.subject}</h1>
                <div className="email-author">
                  <span className="author-name">From: </span>
                  <span className="author-email">
                    {selectedEmail.isMine ? 'Me' : (selectedEmail.sender?.fullName || selectedEmail.sender?.username || 'Someone')}
                    ({selectedEmail.sender?.email})
                  </span>
                </div>
                <div className="email-date">
                  {new Date(selectedEmail.createdAt).toLocaleString()}
                </div>
              </div>

              <div className="email-body">
                {selectedEmail.html ? (
                  <div dangerouslySetInnerHTML={{ __html: selectedEmail.html }} />
                ) : (
                  <p style={{ whiteSpace: 'pre-wrap' }}>{selectedEmail.text}</p>
                )}
              </div>

              {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                <div className="attachments-section">
                  <h3>Attachments</h3>
                  <div className="attachments-grid">
                    {selectedEmail.attachments.map((attachment) => (
                      <a 
                        key={attachment.id} 
                        href={attachment.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="attachment-item"
                      >
                        <HiPaperClip />
                        <span className="attachment-name">{attachment.filename}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        </main>
        <ComposeModal 
          isOpen={isComposeModalOpen} 
          onClose={() => setIsComposeModalOpen(false)} 
          onSendSuccess={handleComposeSuccess}
        />
        <SettingsModal 
          isOpen={isSettingsModalOpen} 
          onClose={() => setIsSettingsModalOpen(false)} 
        />
        <ConfirmationModal
          isOpen={isConfirmDeleteOpen}
          onClose={() => setIsConfirmDeleteOpen(false)}
          onConfirm={confirmDeleteEmail}
          title="Delete Email?"
          message="Are you sure you want to delete this email? This action cannot be undone."
          confirmText="Delete"
          type="danger"
        />
      </div>
    );
  };

export default Dashboard;
