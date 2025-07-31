import { useState, useEffect } from 'react'
import './App.css'

const API_BASE = 'http://localhost:3001/api';

function App() {
  // Authentication state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [loginSessions, setLoginSessions] = useState([]);
  const [activeUsers, setActiveUsers] = useState([]);
  const [currentView, setCurrentView] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ totalSessions: 0, activeSessions: 0 });

  // Fetch sessions from server
  const fetchSessions = async () => {
    try {
      const response = await fetch(`${API_BASE}/sessions`);
      const data = await response.json();
      setLoginSessions(data.sessions);
      setActiveUsers(data.activeUsers);
      setStats({
        totalSessions: data.totalSessions,
        activeSessions: data.activeSessions
      });
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  // Check for existing session on mount and set up intervals
  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
      setIsLoggedIn(true);
    }
    
    // Fetch initial data
    fetchSessions();

    // Update sessions every 30 seconds
    const interval = setInterval(() => {
      fetchSessions();
      updateSessionDurations();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // Update session durations on server
  const updateSessionDurations = async () => {
    try {
      await fetch(`${API_BASE}/update-sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error updating sessions:', error);
    }
  };

  // Login function
  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!loginData.email || !loginData.password) {
      alert('Please enter both email and password');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: loginData.email,
          password: loginData.password
        })
      });

      const data = await response.json();

      if (data.success) {
        setCurrentUser(data.user);
        setIsLoggedIn(true);
        setStats(data.stats);
        
        // Save user to localStorage for persistence across page reloads
        localStorage.setItem('currentUser', JSON.stringify(data.user));
        
        // Refresh session data
        fetchSessions();
        
        setLoginData({ email: '', password: '' });
      } else {
        alert('Login failed: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed: Server not responding');
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const handleLogout = async () => {
    if (!currentUser) return;

    try {
      const response = await fetch(`${API_BASE}/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: currentUser.sessionId
        })
      });

      const data = await response.json();

      if (data.success) {
        setStats(data.stats);
        fetchSessions();
      }
    } catch (error) {
      console.error('Logout error:', error);
    }

    // Clear local state
    setCurrentUser(null);
    setIsLoggedIn(false);
    localStorage.removeItem('currentUser');
  };

    // Clear local state
    setCurrentUser(null);
    setIsLoggedIn(false);
    localStorage.removeItem('currentUser');
  };

  // Clear all session data (for testing)
  const clearAllSessions = async () => {
    if (confirm('Clear all session data? This will log out all users.')) {
      try {
        const response = await fetch(`${API_BASE}/clear-sessions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        });

        const data = await response.json();

        if (data.success) {
          setLoginSessions([]);
          setActiveUsers([]);
          setStats({ totalSessions: 0, activeSessions: 0 });
          localStorage.removeItem('currentUser');
          setCurrentUser(null);
          setIsLoggedIn(false);
        }
      } catch (error) {
        console.error('Error clearing sessions:', error);
        alert('Failed to clear sessions');
      }
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
    const totalSessions = stats.totalSessions;
    const activeSessions = stats.activeSessions;
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
            
            <button type="submit" className="btn btn-primary login-btn" disabled={loading}>
              {loading ? 'Connecting...' : 'Simulate Login'}
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
