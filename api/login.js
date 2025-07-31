// Simple API endpoint for JMeter testing
// This will be served by Vercel as a serverless function

export default function handler(req, res) {
  // Enable CORS for all origins
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'POST') {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email and password required' 
      });
    }

    // Simulate login success (accept any credentials for load testing)
    const loginTime = new Date().toISOString();
    const sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        sessionId,
        email,
        password, // Include for testing visibility
        loginTime,
        status: 'active'
      },
      timestamp: loginTime
    });
  }

  // Handle GET request for health check
  if (req.method === 'GET') {
    return res.status(200).json({
      success: true,
      message: 'Load Testing API is running',
      endpoint: '/api/login',
      methods: ['POST'],
      timestamp: new Date().toISOString()
    });
  }

  // Method not allowed
  res.status(405).json({ 
    success: false, 
    error: 'Method not allowed' 
  });
}
