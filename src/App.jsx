import { useState, useEffect } from 'react'
import './App.css'

function App() {
  // Authentication state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loginData, setLoginData] = useState({ email: '', password: '' });
  const [allLogins, setAllLogins] = useState([]);
  const [currentView, setCurrentView] = useState('dashboard');

  // Load all login data on mount and listen for changes
  useEffect(() => {
    loadAllLogins();
    
    // Check if current user exists
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
      setIsLoggedIn(true);
    }

    // Listen for storage changes from other tabs/browsers
    const handleStorageChange = () => {
      loadAllLogins();
    };

    window.addEventListener('storage', handleStorageChange);
    
    // Update durations every 30 seconds
    const interval = setInterval(updateLoginDurations, 30000);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, []);

  // Load all logins from localStorage
  const loadAllLogins = () => {
    const saved = localStorage.getItem('allLogins');
    if (saved) {
      setAllLogins(JSON.parse(saved));
    }
  };

  // Update login durations
  const updateLoginDurations = () => {
    const saved = localStorage.getItem('allLogins');
    if (saved) {
      const logins = JSON.parse(saved);
      const now = new Date();
      
      const updated = logins.map(login => ({
        ...login,
        minutesActive: Math.round((now - new Date(login.loginTime)) / 1000 / 60)
      }));
      
      setAllLogins(updated);
      localStorage.setItem('allLogins', JSON.stringify(updated));
    }
  };

  // Handle login - ADD to existing logins, don't replace
  const handleLogin = (e) => {
    e.preventDefault();
    
    if (!loginData.email || !loginData.password) {
      alert('Please enter both email and password');
      return;
    }

    const loginTime = new Date();
    const sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    // Create new login record
    const newLogin = {
      id: sessionId,
      email: loginData.email,
      password: loginData.password,
      loginTime: loginTime.toISOString(),
      minutesActive: 0,
      isActive: true,
      userAgent: navigator.userAgent,
      browser: getBrowserName()
    };

    // Get existing logins and ADD this new one
    const existingLogins = JSON.parse(localStorage.getItem('allLogins') || '[]');
    const updatedLogins = [...existingLogins, newLogin];
    
    // Save all logins
    setAllLogins(updatedLogins);
    localStorage.setItem('allLogins', JSON.stringify(updatedLogins));

    // Set current user
    const user = {
      sessionId,
      email: loginData.email,
      password: loginData.password,
      loginTime: loginTime.toISOString()
    };
    
    setCurrentUser(user);
    setIsLoggedIn(true);
    localStorage.setItem('currentUser', JSON.stringify(user));
    
    // Trigger storage event for other tabs
    window.dispatchEvent(new Event('storage'));
    
    setLoginData({ email: '', password: '' });
  };

  // Helper function to get browser name
  const getBrowserName = () => {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Other';
  };

  // Logout function - mark as inactive
  const handleLogout = () => {
    if (!currentUser) return;

    const logoutTime = new Date();
    
    // Update the login record to mark as inactive
    const existingLogins = JSON.parse(localStorage.getItem('allLogins') || '[]');
    const updatedLogins = existingLogins.map(login => {
      if (login.id === currentUser.sessionId) {
        const duration = Math.round((logoutTime - new Date(login.loginTime)) / 1000 / 60);
        return {
          ...login,
          isActive: false,
          logoutTime: logoutTime.toISOString(),
          minutesActive: duration
        };
      }
      return login;
    });
    
    setAllLogins(updatedLogins);
    localStorage.setItem('allLogins', JSON.stringify(updatedLogins));
    
    // Clear current user
    setCurrentUser(null);
    setIsLoggedIn(false);
    localStorage.removeItem('currentUser');
    
    // Trigger storage event for other tabs
    window.dispatchEvent(new Event('storage'));
  };

  // Clear old logins (older than 10 minutes)
  const clearOldLogins = () => {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const existingLogins = JSON.parse(localStorage.getItem('allLogins') || '[]');
    const recentLogins = existingLogins.filter(login => 
      new Date(login.loginTime) > tenMinutesAgo
    );
    
    setAllLogins(recentLogins);
    localStorage.setItem('allLogins', JSON.stringify(recentLogins));
    window.dispatchEvent(new Event('storage'));
  };

  // Get recent logins (last 10 minutes)
  const getRecentLogins = () => {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    return allLogins.filter(login => new Date(login.loginTime) > tenMinutesAgo);
  };

  // Get active users
  const getActiveUsers = () => {
    return allLogins.filter(login => login.isActive);
  };

  // Format time ago
  const timeAgo = (dateString) => {
    const now = new Date();
    const loginTime = new Date(dateString);
    const diffMinutes = Math.round((now - loginTime) / 1000 / 60);
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes === 1) return '1 minute ago';
    if (diffMinutes < 60) return `${diffMinutes} minutes ago`;
    
    const diffHours = Math.round(diffMinutes / 60);
    if (diffHours === 1) return '1 hour ago';
    return `${diffHours} hours ago`;
  };

  // Format date/time
  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  // Login Page Component
  if (!isLoggedIn) {
    const recentLogins = getRecentLogins();
    
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <h1>🧪 Load Testing Portal</h1>
            <p>Login to see real-time user tracking</p>
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
            <p><strong>For Load Testing:</strong> Any credentials accepted</p>
            <p><strong>Recent Logins ({recentLogins.length}):</strong></p>
            {recentLogins.length > 0 ? (
              <div className="recent-logins">
                {recentLogins.slice(-5).map(login => (
                  <div key={login.id} className="recent-login">
                    <strong>{login.email}</strong> - {timeAgo(login.loginTime)}
                    {login.isActive && <span className="active-badge">🟢 Active</span>}
                  </div>
                ))}
              </div>
            ) : (
              <p>No recent logins</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Main Dashboard
  const recentLogins = getRecentLogins();
  const activeUsers = getActiveUsers();

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-content">
          <h1>🧪 Load Testing Dashboard</h1>
          <div className="header-stats">
            <span className="stat">👥 {activeUsers.length} Active</span>
            <span className="stat">📊 {recentLogins.length} Recent (10min)</span>
            <span className="stat">📧 {currentUser?.email}</span>
          </div>
          <div className="header-actions">
            <button className="btn btn-warning" onClick={clearOldLogins}>
              Clear Old (10min+)
            </button>
            <button className="btn btn-danger" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>
      </header>

      <nav className="nav-tabs">
        <button 
          className={`nav-tab ${currentView === 'dashboard' ? 'active' : ''}`}
          onClick={() => setCurrentView('dashboard')}
        >
          📊 Dashboard
        </button>
        <button 
          className={`nav-tab ${currentView === 'active' ? 'active' : ''}`}
          onClick={() => setCurrentView('active')}
        >
          🟢 Active Users ({activeUsers.length})
        </button>
        <button 
          className={`nav-tab ${currentView === 'recent' ? 'active' : ''}`}
          onClick={() => setCurrentView('recent')}
        >
          📋 Recent Logins ({recentLogins.length})
        </button>
      </nav>

      <main className="main-content">
        {currentView === 'dashboard' && (
          <div className="dashboard">
            <h2>📈 Real-Time Login Tracking</h2>
            
            <div className="stats-grid">
              <div className="stat-card active">
                <div className="stat-number">{activeUsers.length}</div>
                <div className="stat-label">Currently Active</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{recentLogins.length}</div>
                <div className="stat-label">Last 10 Minutes</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{new Set(recentLogins.map(l => l.email)).size}</div>
                <div className="stat-label">Unique Users</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{new Set(recentLogins.map(l => l.browser)).size}</div>
                <div className="stat-label">Different Browsers</div>
              </div>
            </div>

            <div className="quick-view">
              <h3>🟢 Currently Active Users</h3>
              {activeUsers.length > 0 ? (
                <div className="active-users-list">
                  {activeUsers.map(user => (
                    <div key={user.id} className="active-user-item">
                      <div className="user-info">
                        <strong>{user.email}</strong>
                        <span className="user-time">{timeAgo(user.loginTime)}</span>
                      </div>
                      <div className="user-details">
                        <span className="password">🔑 {user.password}</span>
                        <span className="browser">🌐 {user.browser}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-message">No active users. Open multiple tabs to simulate load testing.</p>
              )}
            </div>
          </div>
        )}

        {currentView === 'active' && (
          <div className="users-view">
            <h2>🟢 Currently Active Users ({activeUsers.length})</h2>
            
            {activeUsers.length > 0 ? (
              <div className="users-table">
                <div className="table-header">
                  <div>Email</div>
                  <div>Password</div>
                  <div>Login Time</div>
                  <div>Duration</div>
                  <div>Browser</div>
                </div>
                {activeUsers.map(user => (
                  <div key={user.id} className="table-row">
                    <div className="cell email">{user.email}</div>
                    <div className="cell password">{user.password}</div>
                    <div className="cell time">{formatDate(user.loginTime)}</div>
                    <div className="cell duration">{user.minutesActive}m</div>
                    <div className="cell browser">{user.browser}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No active users currently.</p>
                <p><strong>To test:</strong> Open multiple browser tabs and login with different credentials.</p>
              </div>
            )}
          </div>
        )}

        {currentView === 'recent' && (
          <div className="sessions-view">
            <h2>📋 Recent Logins - Last 10 Minutes ({recentLogins.length})</h2>
            
            {recentLogins.length > 0 ? (
              <div className="users-table">
                <div className="table-header">
                  <div>Email</div>
                  <div>Password</div>
                  <div>Login Time</div>
                  <div>Status</div>
                  <div>Browser</div>
                </div>
                {recentLogins.map(login => (
                  <div key={login.id} className="table-row">
                    <div className="cell email">{login.email}</div>
                    <div className="cell password">{login.password}</div>
                    <div className="cell time">{formatDate(login.loginTime)}</div>
                    <div className="cell status">
                      <span className={`status-badge ${login.isActive ? 'active' : 'inactive'}`}>
                        {login.isActive ? '🟢 Active' : '🔴 Logged out'}
                      </span>
                    </div>
                    <div className="cell browser">{login.browser}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No recent logins in the last 10 minutes.</p>
                <p><strong>To start testing:</strong> Login with any credentials to begin tracking.</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App
