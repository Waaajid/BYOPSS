import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage for sessions (shared across all users)
let sessions = [];
let activeUsers = [];

// Helper function to generate unique session ID
const generateSessionId = () => {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

// API Routes

// Get all sessions
app.get('/api/sessions', (req, res) => {
  res.json({
    sessions: sessions,
    activeUsers: activeUsers,
    totalSessions: sessions.length,
    activeSessions: activeUsers.length
  });
});

// Login endpoint
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const loginTime = new Date();
  const sessionId = generateSessionId();

  // Create session record
  const sessionRecord = {
    id: sessionId,
    email,
    password, // In production, never store passwords like this!
    loginTime: loginTime.toISOString(),
    isActive: true,
    sessionDuration: 0,
    userAgent: req.headers['user-agent'] || 'Unknown',
    ipAddress: req.ip || req.connection.remoteAddress || 'Unknown'
  };

  // Create active user record
  const activeUser = {
    id: sessionId,
    email,
    password,
    loginTime: loginTime.toISOString(),
    status: 'Active',
    sessionDuration: 0
  };

  // Add to storage
  sessions.push(sessionRecord);
  activeUsers.push(activeUser);

  // Return user data
  const userData = {
    sessionId,
    email,
    password,
    loginTime: loginTime.toISOString(),
    status: 'Active'
  };

  console.log(`New login: ${email} (Total active: ${activeUsers.length})`);
  
  res.json({
    success: true,
    user: userData,
    stats: {
      totalSessions: sessions.length,
      activeSessions: activeUsers.length
    }
  });
});

// Logout endpoint
app.post('/api/logout', (req, res) => {
  const { sessionId } = req.body;
  
  if (!sessionId) {
    return res.status(400).json({ error: 'Session ID required' });
  }

  const logoutTime = new Date();

  // Find and update session
  const sessionIndex = sessions.findIndex(s => s.id === sessionId);
  if (sessionIndex !== -1) {
    const session = sessions[sessionIndex];
    const loginTime = new Date(session.loginTime);
    const duration = Math.round((logoutTime - loginTime) / 1000 / 60);

    sessions[sessionIndex] = {
      ...session,
      isActive: false,
      logoutTime: logoutTime.toISOString(),
      sessionDuration: duration
    };
  }

  // Remove from active users
  activeUsers = activeUsers.filter(user => user.id !== sessionId);

  console.log(`Logout: ${sessionId} (Total active: ${activeUsers.length})`);

  res.json({
    success: true,
    stats: {
      totalSessions: sessions.length,
      activeSessions: activeUsers.length
    }
  });
});

// Update session durations (called periodically)
app.post('/api/update-sessions', (req, res) => {
  const now = new Date();
  
  // Update active sessions duration
  sessions = sessions.map(session => {
    if (session.isActive) {
      const loginTime = new Date(session.loginTime);
      const duration = Math.round((now - loginTime) / 1000 / 60);
      return { ...session, sessionDuration: duration };
    }
    return session;
  });

  // Update active users duration
  activeUsers = activeUsers.map(user => {
    const loginTime = new Date(user.loginTime);
    const duration = Math.round((now - loginTime) / 1000 / 60);
    return { ...user, sessionDuration: duration };
  });

  res.json({
    success: true,
    stats: {
      totalSessions: sessions.length,
      activeSessions: activeUsers.length
    }
  });
});

// Clear all sessions (for testing)
app.post('/api/clear-sessions', (req, res) => {
  sessions = [];
  activeUsers = [];
  
  console.log('All sessions cleared');
  
  res.json({
    success: true,
    message: 'All sessions cleared',
    stats: {
      totalSessions: 0,
      activeSessions: 0
    }
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    stats: {
      totalSessions: sessions.length,
      activeSessions: activeUsers.length
    }
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Load Testing Server running on http://localhost:${PORT}`);
  console.log(`📊 API endpoints:`);
  console.log(`   GET  /api/health - Server status`);
  console.log(`   GET  /api/sessions - Get all sessions`);
  console.log(`   POST /api/login - User login`);
  console.log(`   POST /api/logout - User logout`);
  console.log(`   POST /api/clear-sessions - Clear all data`);
});
