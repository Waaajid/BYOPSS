import { useState, useEffect } from 'react'
import './App.css'

function App() {
  // Authentication state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [loginSessions, setLoginSessions] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);
  const [currentView, setCurrentView] = useState('dashboard');

  // Check for existing session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    const savedSessions = localStorage.getItem('loginSessions');
    const savedActiveUsers = localStorage.getItem('activeUsers');
    
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
      setIsLoggedIn(true);
    }
    
    if (savedSessions) {
      setLoginSessions(JSON.parse(savedSessions));
    }

    if (savedActiveUsers) {
      setActiveUsers(JSON.parse(savedActiveUsers));
    }

    // Update session durations every minute for active users
    const interval = setInterval(updateActiveSessions, 60000);
    return () => clearInterval(interval);
  }, []);

  // Update active session durations
  const updateActiveSessions = () => {
    const now = new Date();
    const updatedSessions = loginSessions.map(session => {
      if (session.isActive) {
        const loginTime = new Date(session.loginTime);
        const duration = Math.round((now - loginTime) / 1000 / 60);
        return { ...session, sessionDuration: duration };
      }
      return session;
    });
    
    setLoginSessions(updatedSessions);
    localStorage.setItem('loginSessions', JSON.stringify(updatedSessions));
  };

  // Login function
  const handleLogin = (e) => {
    e.preventDefault();
    
    if (!loginData.email || !loginData.password) {
      alert('Please enter both email and password');
      return;
    }

    const loginTime = new Date();
    const sessionId = Date.now();
    
    const user = {
      email: loginData.email,
      password: loginData.password, // Store for load testing visibility
      loginTime: loginTime.toISOString(),
      sessionId: sessionId
    };

    // Create session record
    const sessionRecord = {
      id: sessionId,
      email: loginData.email,
      password: loginData.password, // Store for load testing
      loginTime: loginTime.toISOString(),
      sessionDuration: 0,
      isActive: true,
      userAgent: navigator.userAgent,
      ipAddress: 'Local', // Would be real IP in production
      location: 'Unknown' // Would be geolocation in production
    };

    // Add to active users
    const activeUser = {
      id: sessionId,
      email: loginData.email,
      password: loginData.password,
      loginTime: loginTime.toISOString(),
      status: 'Active',
      sessionDuration: 0
    };

    const updatedSessions = [...loginSessions, sessionRecord];
    const updatedActiveUsers = [...activeUsers, activeUser];
    
    setCurrentUser(user);
    setIsLoggedIn(true);
    setLoginSessions(updatedSessions);
    setActiveUsers(updatedActiveUsers);
    
    // Save to localStorage
    localStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.setItem('loginSessions', JSON.stringify(updatedSessions));
    localStorage.setItem('activeUsers', JSON.stringify(updatedActiveUsers));
    
    setLoginData({ email: '', password: '' });
  };

  // Logout function
  const handleLogout = () => {
    if (currentUser) {
      const logoutTime = new Date();
      const loginTime = new Date(currentUser.loginTime);
      const sessionDuration = Math.round((logoutTime - loginTime) / 1000 / 60);

      // Update session record
      const updatedSessions = loginSessions.map(session => 
        session.id === currentUser.sessionId
          ? { ...session, sessionDuration, isActive: false, logoutTime: logoutTime.toISOString() }
          : session
      );

      // Remove from active users
      const updatedActiveUsers = activeUsers.filter(user => user.id !== currentUser.sessionId);

      setLoginSessions(updatedSessions);
      setActiveUsers(updatedActiveUsers);
      localStorage.setItem('loginSessions', JSON.stringify(updatedSessions));
      localStorage.setItem('activeUsers', JSON.stringify(updatedActiveUsers));
    }

    setCurrentUser(null);
    setIsLoggedIn(false);
    localStorage.removeItem('currentUser');
  };

  // Clear all session data (for testing)
  const clearAllSessions = () => {
    if (confirm('Clear all session data? This will log out all users.')) {
      setLoginSessions([]);
      setActiveUsers([]);
      localStorage.removeItem('loginSessions');
      localStorage.removeItem('activeUsers');
      localStorage.removeItem('currentUser');
      setCurrentUser(null);
      setIsLoggedIn(false);
    }
  };

  // Format date/time
  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString() + ' ' + new Date(dateString).toLocaleTimeString();
  };

  // Format duration
  const formatDuration = (minutes) => {
    if (minutes === 0) return '< 1m';
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Get load testing stats
  const getLoadTestingStats = () => {
    const totalSessions = loginSessions.length;
    const activeSessions = activeUsers.length;
    const uniqueUsers = new Set(loginSessions.map(s => s.email)).size;
    const avgSessionTime = loginSessions
      .filter(s => !s.isActive && s.sessionDuration > 0)
      .reduce((sum, s) => sum + s.sessionDuration, 0) / Math.max(1, loginSessions.filter(s => !s.isActive).length);

    return {
      totalSessions,
      activeSessions,
      uniqueUsers,
      avgSessionTime: Math.round(avgSessionTime) || 0
    };
  };

  // Login Page Component
  if (!isLoggedIn) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <h1>Load Testing Portal</h1>
            <p>User Login Simulation</p>
          </div>
          
          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                type="text"
                className="form-input"
                value={loginData.email}
                onChange={(e) => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter any email address"
                required
              />
            </div>
            
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="text"
                className="form-input"
                value={loginData.password}
                onChange={(e) => setLoginData(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Enter any password"
                required
              />
            </div>
            
            <button type="submit" className="btn btn-primary login-btn">
              Simulate Login
            </button>
          </form>
          
          <div className="login-footer">
            <p>🧪 Load Testing Mode - Any credentials accepted</p>
            <p>Real-time session tracking enabled</p>
          </div>
        </div>
      </div>
    );
  }

  const stats = getLoadTestingStats();

  return (
    <div className="app">
      {currentView === 'dashboard' ? (
        // Load Testing Dashboard
        <div className="dashboard">
          <div className="dashboard-header">
            <div className="dashboard-title">
              <h1>🧪 Load Testing Dashboard</h1>
              <div className="dashboard-stats">
                <span className="stat-card">
                  <strong>{stats.activeSessions}</strong> Active Users
                </span>
                <span className="stat-card">
                  <strong>{stats.totalSessions}</strong> Total Sessions
                </span>
                <span className="stat-card">
                  <strong>{stats.uniqueUsers}</strong> Unique Users
                </span>
                <span className="stat-card">
                  <strong>{stats.avgSessionTime}m</strong> Avg Session
                </span>
              </div>
            </div>
            <div className="header-actions">
              <span className="user-info">Logged in as: {currentUser?.email}</span>
              <button className="btn btn-secondary" onClick={() => setCurrentView('active')}>
                Active Users ({activeUsers.length})
              </button>
              <button className="btn btn-secondary" onClick={() => setCurrentView('sessions')}>
                All Sessions ({loginSessions.length})
              </button>
              <button className="btn btn-warning" onClick={clearAllSessions}>
                Clear Data
              </button>
              <button className="btn btn-danger" onClick={handleLogout}>
                Logout
              </button>
            </div>
          </div>
          
          {/* Real-time Active Users */}
          <div className="active-users-section">
            <h2>🟢 Currently Active Users</h2>
            <div className="users-grid">
              {activeUsers.map(user => (
                <div key={user.id} className="user-card">
                  <div className="user-header">
                    <div className="user-email">{user.email}</div>
                    <div className="user-status active">ACTIVE</div>
                  </div>
                  <div className="user-details">
                    <div className="credential-row">
                      <span className="label">Password:</span>
                      <span className="value password-value">{user.password}</span>
                    </div>
                    <div className="credential-row">
                      <span className="label">Login Time:</span>
                      <span className="value">{formatDate(user.loginTime)}</span>
                    </div>
                    <div className="credential-row">
                      <span className="label">Session Duration:</span>
                      <span className="value">{formatDuration(Math.round((new Date() - new Date(user.loginTime)) / 1000 / 60))}</span>
                    </div>
                  </div>
                </div>
              ))}
              
              {activeUsers.length === 0 && (
                <div className="empty-state">
                  <p>No active users currently logged in</p>
                  <p>Open multiple browser tabs/windows to simulate load testing</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : currentView === 'active' ? (
        // Active Users View
        <div className="sessions-view">
          <div className="sessions-header">
            <button className="back-btn" onClick={() => setCurrentView('dashboard')}>
              ← Back to Dashboard
            </button>
            <h1>🟢 Active Users ({activeUsers.length})</h1>
            <div className="header-actions">
              <button className="btn btn-primary" onClick={() => window.location.reload()}>
                Refresh
              </button>
            </div>
          </div>
          
          <div className="sessions-content">
            <div className="sessions-table">
              <div className="sessions-table-header">
                <div>Email</div>
                <div>Password</div>
                <div>Login Time</div>
                <div>Session Duration</div>
                <div>Status</div>
              </div>
              
              {activeUsers.map(user => (
                <div key={user.id} className="sessions-table-row">
                  <div className="session-email">{user.email}</div>
                  <div className="session-password">{user.password}</div>
                  <div className="session-time">{formatDate(user.loginTime)}</div>
                  <div className="session-duration">{formatDuration(Math.round((new Date() - new Date(user.loginTime)) / 1000 / 60))}</div>
                  <div className="session-status">
                    <span className="status-badge status-live">ACTIVE</span>
                  </div>
                </div>
              ))}
              
              {activeUsers.length === 0 && (
                <div className="empty-sessions">
                  <p>No active users. Open multiple browser tabs to simulate concurrent users.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        // All Sessions View
        <div className="sessions-view">
          <div className="sessions-header">
            <button className="back-btn" onClick={() => setCurrentView('dashboard')}>
              ← Back to Dashboard
            </button>
            <h1>📊 All Sessions ({loginSessions.length})</h1>
            <div className="header-actions">
              <button className="btn btn-primary" onClick={() => window.location.reload()}>
                Refresh
              </button>
            </div>
          </div>
          
          <div className="sessions-content">
            <div className="sessions-table">
              <div className="sessions-table-header">
                <div>Email</div>
                <div>Password</div>
                <div>Login Time</div>
                <div>Logout Time</div>
                <div>Duration</div>
                <div>Status</div>
              </div>
              
              {loginSessions.map((session, index) => (
                <div key={index} className="sessions-table-row">
                  <div className="session-email">{session.email}</div>
                  <div className="session-password">{session.password}</div>
                  <div className="session-time">{formatDate(session.loginTime)}</div>
                  <div className="session-time">{session.logoutTime ? formatDate(session.logoutTime) : '-'}</div>
                  <div className="session-duration">
                    {session.isActive 
                      ? formatDuration(Math.round((new Date() - new Date(session.loginTime)) / 1000 / 60))
                      : formatDuration(session.sessionDuration)
                    }
                  </div>
                  <div className="session-status">
                    <span className={`status-badge ${session.isActive ? 'status-live' : 'status-draft'}`}>
                      {session.isActive ? 'ACTIVE' : 'ENDED'}
                    </span>
                  </div>
                </div>
              ))}
              
              {loginSessions.length === 0 && (
                <div className="empty-sessions">
                  <p>No login sessions recorded yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
