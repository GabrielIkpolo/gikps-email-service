import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getInbox, getSent, getEmail, updateEmailStatus, deleteEmail } from '../api/mailApi';
import { getMe } from '../api/authApi';
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
  HiX
} from 'react-icons/hi';
import ComposeModal from '../components/ComposeModal';
import './Dashboard.css';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [emails, setEmails] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [view, setView] = useState('inbox'); // 'inbox', 'sent'
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isComposeModalOpen, setIsComposeModalOpen] = useState(false);
  const navigate = useNavigate();

  const toggleSidebar = () => {
    setIsSidebarOpen(prev => !prev);
  };

  const handleNavClick = (newView) => {
    setView(newView);
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
    fetchEmails();
  };

  useEffect(() => {
    fetchUserData();
    fetchEmails();
  }, [view]);

  useEffect(() => {
    if (!user) return;

    const SOCKET_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    const socket = io(SOCKET_URL);

    socket.on('connect', () => {
      socket.emit('join', user.id);
    });

    socket.on('new-email', (data) => {
      const { type, email } = data;
      
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

    return () => {
      socket.disconnect();
    };
  }, [user, view]);

  const fetchUserData = async () => {
// ...
    try {
      const userData = await getMe();
      setUser(userData.data.user);
    } catch (err) {
      console.error('Error fetching user:', err);
      navigate('/login');
    }
  };

  const fetchEmails = async () => {
    setLoading(true);
    try {
      let data;
      if (view === 'inbox') {
        data = await getInbox();
      } else {
        data = await getSent();
      }
      setEmails(data.data.emails);
    } catch (err) {
      console.error('Error fetching emails:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('gikpsmail_token');
    navigate('/login');
  };

  const handleSelectEmail = async (email) => {
    setSelectedEmail(email);
    if (!email.isRead) {
      await updateEmailStatus(email.id, { isRead: true });
      fetchEmails();
    }
  };

  const handleDeleteEmail = async (id, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this email?')) {
      await deleteEmail(id);
      if (selectedEmail && selectedEmail.id === id) {
        setSelectedEmail(null);
      }
      fetchEmails();
    }
  };

  const handleToggleStar = async (e, id) => {
    if (e && typeof e.stopPropagation === 'function') {
      e.stopPropagation();
    }
    const currentStatus = emails.find(em => em.id === id)?.isStarred;
    await updateEmailStatus(id, { isStarred: !currentStatus });
    fetchEmails();
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
          <button className="logout-button" onClick={handleLogout}>
            <HiLogout /> Logout
          </button>
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
              <button 
                className="compose-button"
                onClick={handleComposeOpen}
              >
                <HiPlus /> <span className="compose-text">Compose</span>
              </button>
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
                          {email.sender?.fullName || email.sender?.username || (email.senderId === user?.id ? 'Me' : 'Someone')}
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
                    {selectedEmail.sender?.fullName || selectedEmail.sender?.username || (selectedEmail.senderId === user?.id ? 'Me' : 'Someone')}
                    ({selectedEmail.sender?.email || selectedEmail.senderId})
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
      </div>
    );
  };

export default Dashboard;
