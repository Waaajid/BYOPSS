import { useState, useEffect } from 'react'
import './App.css'

const API_BASE = 'http://localhost:3001/api';

function App() {
  const [activeTab, setActiveTab] = useState('editor');
  const [prompts, setPrompts] = useState([]);
  const [promptTypes, setPromptTypes] = useState([]);
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    type: 'Analysis',
    content: '',
    model: '4o - better overall'
  });
  const [versionDescription, setVersionDescription] = useState('');
  const [testMessage, setTestMessage] = useState('');
  const [testOutput, setTestOutput] = useState('');
  const [isTestLoading, setIsTestLoading] = useState(false);
  const [showNewTypeInput, setShowNewTypeInput] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [analytics, setAnalytics] = useState(null);

  // Load prompts and types on component mount
  useEffect(() => {
    loadPrompts();
    loadPromptTypes();
    loadAnalytics();
  }, []);

  const loadPrompts = async () => {
    try {
      const response = await fetch(`${API_BASE}/prompts`);
      const data = await response.json();
      setPrompts(data);
      if (data.length > 0 && !selectedPrompt) {
        selectPrompt(data[0]);
      }
    } catch (error) {
      console.error('Failed to load prompts:', error);
    }
  };

  const loadPromptTypes = async () => {
    try {
      const response = await fetch(`${API_BASE}/prompt-types`);
      const data = await response.json();
      setPromptTypes(data);
    } catch (error) {
      console.error('Failed to load prompt types:', error);
    }
  };

  const loadAnalytics = async () => {
    try {
      const response = await fetch(`${API_BASE}/analytics`);
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    }
  };

  const selectPrompt = (prompt) => {
    setSelectedPrompt(prompt);
    setFormData({
      name: prompt.name,
      type: prompt.type || 'Analysis',
      content: prompt.content,
      model: prompt.model
    });
    setIsEditing(false);
    setTestOutput('');
    setVersionDescription('');
  };

  const createNewPrompt = () => {
    setSelectedPrompt(null);
    setFormData({
      name: 'New Prompt',
      type: 'Analysis',
      content: '',
      model: '4o - better overall'
    });
    setIsEditing(true);
    setTestOutput('');
  };

  const savePrompt = async () => {
    try {
      const method = selectedPrompt ? 'PUT' : 'POST';
      const url = selectedPrompt 
        ? `${API_BASE}/prompts/${selectedPrompt.id}`
        : `${API_BASE}/prompts`;
      
      const payload = { ...formData };
      if (selectedPrompt && versionDescription) {
        payload.versionDescription = versionDescription;
      }
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      const savedPrompt = await response.json();
      
      if (selectedPrompt) {
        setPrompts(prev => prev.map(p => p.id === selectedPrompt.id ? savedPrompt : p));
      } else {
        setPrompts(prev => [...prev, savedPrompt]);
      }
      
      setSelectedPrompt(savedPrompt);
      setIsEditing(false);
      setVersionDescription('');
      loadAnalytics(); // Refresh analytics
    } catch (error) {
      console.error('Failed to save prompt:', error);
    }
  };

  const createNewType = async () => {
    if (!newTypeName.trim()) return;
    
    try {
      const response = await fetch(`${API_BASE}/prompt-types`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type: newTypeName }),
      });
      
      const updatedTypes = await response.json();
      setPromptTypes(updatedTypes);
      setFormData(prev => ({ ...prev, type: newTypeName }));
      setNewTypeName('');
      setShowNewTypeInput(false);
    } catch (error) {
      console.error('Failed to create new type:', error);
    }
  };

  const deletePrompt = async () => {
    if (!selectedPrompt || !confirm('Are you sure you want to delete this prompt?')) return;
    
    try {
      await fetch(`${API_BASE}/prompts/${selectedPrompt.id}`, {
        method: 'DELETE',
      });
      
      const updatedPrompts = prompts.filter(p => p.id !== selectedPrompt.id);
      setPrompts(updatedPrompts);
      
      if (updatedPrompts.length > 0) {
        selectPrompt(updatedPrompts[0]);
      } else {
        setSelectedPrompt(null);
        createNewPrompt();
      }
    } catch (error) {
      console.error('Failed to delete prompt:', error);
    }
  };

  const testPrompt = async () => {
    if (!testMessage.trim()) {
      alert('Please enter a test message');
      return;
    }

    setIsTestLoading(true);
    setTestOutput('Testing prompt...');

    try {
      const response = await fetch(`${API_BASE}/test-prompt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: formData.content,
          message: testMessage,
          model: formData.model,
          promptId: selectedPrompt?.id
        }),
      });
      
      const result = await response.json();
      setTestOutput(result.response);
      
      // Refresh prompts to update usage stats
      if (selectedPrompt) {
        loadPrompts();
        loadAnalytics();
      }
    } catch (error) {
      setTestOutput('Error testing prompt: ' + error.message);
    } finally {
      setIsTestLoading(false);
    }
  };

  const toggleLiveStatus = async (promptId) => {
    try {
      const response = await fetch(`${API_BASE}/prompts/${promptId}/toggle-live`, {
        method: 'PUT',
      });
      
      const updatedPrompt = await response.json();
      setPrompts(prev => prev.map(p => p.id === promptId ? updatedPrompt : p));
      
      if (selectedPrompt && selectedPrompt.id === promptId) {
        setSelectedPrompt(updatedPrompt);
      }
      
      loadAnalytics();
    } catch (error) {
      console.error('Failed to toggle live status:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (!isEditing && selectedPrompt) {
      setIsEditing(true);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString() + ' ' + new Date(dateString).toLocaleTimeString();
  };

  return (
    <div className="app">
      {/* Left Sidebar */}
      <div className="sidebar">
        <div className="sidebar-header">
          <h2>Prompt Studio</h2>
          
          {/* Tab Navigation */}
          <div className="tab-navigation">
            <button 
              className={`tab-btn ${activeTab === 'editor' ? 'active' : ''}`}
              onClick={() => setActiveTab('editor')}
            >
              Editor
            </button>
            <button 
              className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
              onClick={() => setActiveTab('analytics')}
            >
              Analytics
            </button>
          </div>
          
          {activeTab === 'editor' && (
            <button className="new-prompt-btn" onClick={createNewPrompt}>
              + New Prompt
            </button>
          )}
        </div>
        
        <div className="prompts-list">
          {prompts.map(prompt => (
            <div
              key={prompt.id}
              className={`prompt-item ${selectedPrompt?.id === prompt.id ? 'active' : ''}`}
              onClick={() => selectPrompt(prompt)}
            >
              <div className="prompt-header">
                <div className="prompt-name">{prompt.name}</div>
                <div className="prompt-status">
                  {prompt.isLive && <span className="live-badge">LIVE</span>}
                  <span className="version-badge">v{prompt.version}</span>
                </div>
              </div>
              <div className="prompt-type">{prompt.type || 'Analysis'}</div>
              <div className="prompt-meta">
                <div className="prompt-model">{prompt.model}</div>
                {prompt.lastUsed && (
                  <div className="prompt-usage">
                    Used {prompt.usageCount} times
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="main-content">
        {activeTab === 'editor' ? (
          // Editor Tab Content
          selectedPrompt || isEditing ? (
            <div className="studio-container">
              {/* Middle Panel: Editor */}
              <div className="editor-panel">
                <div className="editor-header">
                  <div>
                    <h3>{isEditing && !selectedPrompt ? 'New Prompt' : formData.name}</h3>
                    {selectedPrompt && (
                      <div className="prompt-info">
                        <span className="version-info">Version {selectedPrompt.version}</span>
                        <button 
                          className={`live-toggle ${selectedPrompt.isLive ? 'live' : 'draft'}`}
                          onClick={() => toggleLiveStatus(selectedPrompt.id)}
                        >
                          {selectedPrompt.isLive ? 'LIVE' : 'DRAFT'}
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="editor-actions">
                    {selectedPrompt && (
                      <button className="btn btn-danger" onClick={deletePrompt}>
                        Delete
                      </button>
                    )}
                    <button className="btn btn-primary" onClick={savePrompt}>
                      {isEditing ? 'Save' : 'Update'}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Prompt Name</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter prompt name..."
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Type</label>
                  <div className="type-selector">
                    <select
                      className="form-select"
                      value={formData.type}
                      onChange={(e) => {
                        if (e.target.value === 'ADD_NEW') {
                          setShowNewTypeInput(true);
                        } else {
                          handleInputChange('type', e.target.value);
                        }
                      }}
                    >
                      {promptTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                      <option value="ADD_NEW">+ Add New Type</option>
                    </select>
                  </div>
                  
                  {showNewTypeInput && (
                    <div className="new-type-input">
                      <input
                        type="text"
                        className="form-input"
                        value={newTypeName}
                        onChange={(e) => setNewTypeName(e.target.value)}
                        placeholder="Enter new type name..."
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            createNewType();
                          }
                        }}
                      />
                      <div className="new-type-actions">
                        <button className="btn btn-primary btn-sm" onClick={createNewType}>
                          Add
                        </button>
                        <button 
                          className="btn btn-secondary btn-sm" 
                          onClick={() => {
                            setShowNewTypeInput(false);
                            setNewTypeName('');
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Model</label>
                  <select
                    className="form-select"
                    value={formData.model}
                    onChange={(e) => handleInputChange('model', e.target.value)}
                  >
                    <option value="4o - better overall">4o - better overall</option>
                    <option value="O3 - reasoning">O3 - reasoning</option>
                  </select>
                </div>

                {isEditing && selectedPrompt && (
                  <div className="form-group">
                    <label className="form-label">Version Description</label>
                    <input
                      type="text"
                      className="form-input"
                      value={versionDescription}
                      onChange={(e) => setVersionDescription(e.target.value)}
                      placeholder="Describe what changed in this version..."
                    />
                  </div>
                )}

                <div className="form-group prompt-textarea-group">
                  <label className="form-label">Prompt</label>
                  <textarea
                    className="form-textarea"
                    value={formData.content}
                    onChange={(e) => handleInputChange('content', e.target.value)}
                    placeholder="Enter your prompt instructions here... Use {message} as a placeholder for user input."
                  />
                </div>
              </div>

              {/* Right Panel: Testing */}
              <div className="testing-panel">
                <div className="testing-header">
                  <h4>Test Prompt</h4>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Message</label>
                  <textarea
                    className="form-textarea test-message-input"
                    value={testMessage}
                    onChange={(e) => setTestMessage(e.target.value)}
                    placeholder="Enter a test message to analyze..."
                    rows={5}
                  />
                </div>
                
                <button 
                  className="btn btn-primary test-btn" 
                  onClick={testPrompt}
                  disabled={isTestLoading}
                >
                  {isTestLoading ? 'Testing...' : 'Test'}
                </button>

                <div className="form-group output-group">
                  <label className="form-label">Output</label>
                  <div className={`output-area ${isTestLoading ? 'loading' : ''}`}>
                    {testOutput || 'Test output will appear here...'}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="empty-state">
              <h3>Welcome to Prompt Studio</h3>
              <p>Create a new prompt or select an existing one to get started.</p>
              <button className="btn btn-primary" onClick={createNewPrompt}>
                Create Your First Prompt
              </button>
            </div>
          )
        ) : (
          // Analytics Tab Content
          <div className="analytics-container">
            <div className="analytics-header">
              <h2>Analytics Dashboard</h2>
            </div>

            {analytics ? (
              <div className="analytics-content">
                {/* Overview Cards */}
                <div className="overview-cards">
                  <div className="stat-card">
                    <h3>{analytics.totalPrompts}</h3>
                    <p>Total Prompts</p>
                  </div>
                  <div className="stat-card">
                    <h3>{analytics.livePrompts}</h3>
                    <p>Live Prompts</p>
                  </div>
                  <div className="stat-card">
                    <h3>{analytics.totalUsage}</h3>
                    <p>Total Usage</p>
                  </div>
                </div>

                {/* Selected Prompt Details */}
                {selectedPrompt && (
                  <div className="prompt-details-card">
                    <h3>Prompt Details: {selectedPrompt.name}</h3>
                    <div className="details-grid">
                      <div className="detail-item">
                        <label>Current Version:</label>
                        <span>v{selectedPrompt.version}</span>
                      </div>
                      <div className="detail-item">
                        <label>Status:</label>
                        <span className={selectedPrompt.isLive ? 'status-live' : 'status-draft'}>
                          {selectedPrompt.isLive ? 'LIVE' : 'DRAFT'}
                        </span>
                      </div>
                      <div className="detail-item">
                        <label>Total Usage:</label>
                        <span>{selectedPrompt.usageCount} times</span>
                      </div>
                      <div className="detail-item">
                        <label>Test Usage:</label>
                        <span>{selectedPrompt.testCount} times</span>
                      </div>
                      <div className="detail-item">
                        <label>Live Usage:</label>
                        <span>{selectedPrompt.liveUsageCount} times</span>
                      </div>
                      <div className="detail-item">
                        <label>Last Used:</label>
                        <span>{formatDate(selectedPrompt.lastUsed)}</span>
                      </div>
                    </div>

                    {/* Version History */}
                    {selectedPrompt.versions && selectedPrompt.versions.length > 0 && (
                      <div className="version-history">
                        <h4>Version History</h4>
                        <div className="versions-list">
                          {selectedPrompt.versions.map((version, index) => (
                            <div key={index} className="version-item">
                              <div className="version-header">
                                <span className="version-number">v{version.version}</span>
                                <span className="version-date">{formatDate(version.createdAt)}</span>
                              </div>
                              <p className="version-description">{version.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Most Used Prompts */}
                <div className="analytics-section">
                  <h3>Most Used Prompts</h3>
                  <div className="prompts-table">
                    {analytics.mostUsedPrompts.map(prompt => (
                      <div key={prompt.id} className="table-row">
                        <div className="prompt-info">
                          <strong>{prompt.name}</strong>
                          <span className="prompt-type-small">{prompt.type}</span>
                        </div>
                        <div className="usage-stats">
                          <span>{prompt.usageCount} uses</span>
                          <span className="last-used">{formatDate(prompt.lastUsed)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="analytics-section">
                  <h3>Recent Activity</h3>
                  <div className="activity-list">
                    {analytics.recentActivity.map(activity => (
                      <div key={activity.id} className="activity-item">
                        <strong>{activity.name}</strong>
                        <span>used {formatDate(activity.lastUsed)}</span>
                        <span className="usage-count">({activity.usageCount} total uses)</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="loading-state">
                <p>Loading analytics...</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default App
