import { useState, useEffect } from 'react'
import './App.css'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Mock data for demo purposes when no backend is available
const MOCK_PROMPTS = [
  {
    id: 1,
    name: "Enemy SITEMP",
    type: "Assessment",
    content: "Analyze the enemy situation...",
    model: "4o - better overall",
    isLive: false,
    version: 1,
    lastUsed: "2025-07-20T10:30:00Z"
  },
  {
    id: 2,
    name: "EXEM",
    type: "Assessment", 
    content: "Execute examination protocol...",
    model: "O3 - reasoning",
    isLive: true,
    version: 2,
    lastUsed: "2025-07-21T09:15:00Z"
  },
  {
    id: 3,
    name: "ABCD",
    type: "Analysis",
    content: "Perform comprehensive analysis...",
    model: "4o - better overall", 
    isLive: false,
    version: 1,
    lastUsed: "2025-07-19T14:45:00Z"
  }
];

function App() {
  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard', 'editor', or 'versions'
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

  // Load prompts and types on component mount
  useEffect(() => {
    loadPrompts();
    loadPromptTypes();
  }, []);

  const loadPrompts = async () => {
    try {
      const response = await fetch(`${API_BASE}/prompts`);
      const data = await response.json();
      setPrompts(data);
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
    setCurrentView('editor');
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
    setCurrentView('editor');
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
      loadPrompts(); // Refresh the list
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
      setCurrentView('dashboard');
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
      
      loadPrompts();
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

  const backToDashboard = () => {
    setCurrentView('dashboard');
    setSelectedPrompt(null);
  };

  const showVersions = () => {
    setCurrentView('versions');
  };

  const deletePromptFromDashboard = async (promptId, e) => {
    e.stopPropagation(); // Prevent row click
    if (!confirm('Are you sure you want to delete this prompt?')) return;
    
    try {
      await fetch(`${API_BASE}/prompts/${promptId}`, {
        method: 'DELETE',
      });
      
      loadPrompts(); // Refresh the list
    } catch (error) {
      console.error('Failed to delete prompt:', error);
    }
  };

  const getLivePromptsCount = () => {
    return prompts.filter(p => p.isLive).length;
  };

  const viewVersion = (version) => {
    alert(`Viewing version ${version.version}`);
    // TODO: Implement version viewing functionality
  };

  const restoreVersion = (version) => {
    if (confirm(`Restore to version ${version.version}?`)) {
      alert(`Restored to version ${version.version}`);
      // TODO: Implement version restoration functionality
    }
  };

  const copyVersion = (version) => {
    alert(`Copied version ${version.version}`);
    // TODO: Implement version copying functionality
  };

  return (
    <div className="app">
      {currentView === 'dashboard' ? (
        // Dashboard View
        <div className="dashboard">
          <div className="dashboard-header">
            <div className="dashboard-title">
              <h1>Prompt Studio</h1>
              <div className="dashboard-stats">
                <span className="live-counter">{getLivePromptsCount()} Live Prompts</span>
              </div>
            </div>
            <button className="btn btn-primary" onClick={createNewPrompt}>
              + New Prompt
            </button>
          </div>
          
          <div className="prompts-table">
            <div className="table-header">
              <div className="col-name">Prompt Name</div>
              <div className="col-type">Type</div>
              <div className="col-status">Status</div>
              <div className="col-last-used">Last Used</div>
              <div className="col-version">Version</div>
              <div className="col-actions">Actions</div>
            </div>
            
            {prompts.map(prompt => (
              <div key={prompt.id} className="table-row" onClick={() => selectPrompt(prompt)}>
                <div className="col-name">
                  <strong>{prompt.name}</strong>
                </div>
                <div className="col-type">{prompt.type || 'Analysis'}</div>
                <div className="col-status">
                  <span className={`status-badge ${prompt.isLive ? 'status-live' : 'status-draft'}`}>
                    {prompt.isLive ? 'Live' : 'Draft'}
                  </span>
                </div>
                <div className="col-last-used">{formatDate(prompt.lastUsed)}</div>
                <div className="col-version">v{prompt.version}</div>
                <div className="col-actions">
                  {!prompt.isLive && (
                    <button 
                      className="btn btn-sm btn-success"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleLiveStatus(prompt.id);
                      }}
                    >
                      Push to Live
                    </button>
                  )}
                  <button 
                    className="btn btn-sm btn-danger"
                    onClick={(e) => deletePromptFromDashboard(prompt.id, e)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
            
            {prompts.length === 0 && (
              <div className="empty-table">
                <p>No prompts yet. Create your first prompt to get started!</p>
              </div>
            )}
          </div>
        </div>
      ) : currentView === 'editor' ? (
        // Editor View - Exact layout from image
        <div className="app-layout">
          {/* Left Sidebar */}
          <div className="sidebar">
            <div className="sidebar-header">
              <button className="back-btn" onClick={backToDashboard}>
                ← Back to Dashboard
              </button>
              <h2>Prompt Studio</h2>
              <button className="btn btn-primary new-prompt-btn" onClick={createNewPrompt}>
                + New Prompt
              </button>
            </div>
            
            <div className="prompts-list">
              {prompts.map(prompt => (
                <div
                  key={prompt.id}
                  className={`prompt-item ${selectedPrompt?.id === prompt.id ? 'active' : ''}`}
                  onClick={() => selectPrompt(prompt)}
                >
                  <div className="prompt-name">{prompt.name}</div>
                  <div className="prompt-type">{prompt.type || 'Analysis'}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Panel - Editor */}
          <div className="main-content">
            <div className="editor-actions-bar">
              <div className="editor-actions-left">
                {selectedPrompt && (
                  <button 
                    className="btn btn-secondary"
                    onClick={showVersions}
                  >
                    Versions
                  </button>
                )}
              </div>
              <div className="editor-actions-right">
                {selectedPrompt && !selectedPrompt.isLive && (
                  <button 
                    className="btn btn-success"
                    onClick={() => toggleLiveStatus(selectedPrompt.id)}
                  >
                    Push to Live
                  </button>
                )}
              </div>
            </div>

            <div className="editor-content">
              <div className="editor-left">
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
                    <option value="Claude - creative">Claude - creative</option>
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

                <div className="editor-bottom-actions">
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

              <div className="editor-right">
                <h3>Test Prompt</h3>
                
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
          </div>
        </div>
      ) : (
        // Versions View - Table format matching the reference image
        <div className="versions-view">
          <div className="versions-header">
            <button className="back-btn" onClick={() => setCurrentView('editor')}>
              ← Prompts List
            </button>
            <h1>Prompt Versions</h1>
          </div>
          
          <div className="versions-content">
            <div className="versions-table">
              <div className="versions-table-header">
                <div>Name</div>
                <div>Ver.</div>
                <div>Created On</div>
                <div>Updated On</div>
                <div>Pushed to Live</div>
                <div>Pushed to Live at</div>
                <div>Actions</div>
              </div>
              
              {selectedPrompt?.versions && selectedPrompt.versions.length > 0 ? (
                selectedPrompt.versions.map((version, index) => (
                  <div key={index} className="versions-table-row">
                    <div className="version-name">{selectedPrompt.name}</div>
                    <div className="version-number">{version.version}</div>
                    <div className="version-date">{formatDate(version.createdAt)}</div>
                    <div className="version-date">{formatDate(version.updatedAt || version.createdAt)}</div>
                    <div className="version-status">
                      <span className={version.isLive ? "status-yes" : "status-no"}>
                        {version.isLive ? "Yes" : "No"}
                      </span>
                    </div>
                    <div className="version-date">
                      {version.isLive && version.pushedToLiveAt ? formatDate(version.pushedToLiveAt) : "-"}
                    </div>
                    <div className="version-actions">
                      <button className="btn-view" onClick={() => viewVersion(version)}>
                        View
                      </button>
                      <button className="btn-restore" onClick={() => restoreVersion(version)}>
                        Restore
                      </button>
                      <button className="btn-copy" onClick={() => copyVersion(version)}>
                        Copy
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                // Sample data to match the reference image
                <>
                  <div className="versions-table-row">
                    <div className="version-name">Persuasion AAR (Statement)</div>
                    <div className="version-number">7</div>
                    <div className="version-date">04/08/2025 15:33:47</div>
                    <div className="version-date">04/15/2025 20:40:38</div>
                    <div className="version-status"><span className="status-no">No</span></div>
                    <div className="version-date">-</div>
                    <div className="version-actions">
                      <button className="btn-view">View</button>
                      <button className="btn-restore">Restore</button>
                      <button className="btn-copy">Copy</button>
                    </div>
                  </div>
                  
                  <div className="versions-table-row">
                    <div className="version-name">Persuasion AAR (Statement)</div>
                    <div className="version-number">6</div>
                    <div className="version-date">04/08/2025 15:19:51</div>
                    <div className="version-date">04/08/2025 15:33:47</div>
                    <div className="version-status"><span className="status-yes">Yes</span></div>
                    <div className="version-date">2025-04-08 15:33:47</div>
                    <div className="version-actions">
                      <button className="btn-view">View</button>
                      <button className="btn-restore">Restore</button>
                      <button className="btn-copy">Copy</button>
                    </div>
                  </div>
                  
                  <div className="versions-table-row">
                    <div className="version-name">Persuasion AAR (Statement)</div>
                    <div className="version-number">5</div>
                    <div className="version-date">04/08/2025 15:19:32</div>
                    <div className="version-date">04/08/2025 15:19:51</div>
                    <div className="version-status"><span className="status-yes">Yes</span></div>
                    <div className="version-date">2025-04-08 15:19:51</div>
                    <div className="version-actions">
                      <button className="btn-view">View</button>
                      <button className="btn-restore">Restore</button>
                      <button className="btn-copy">Copy</button>
                    </div>
                  </div>
                  
                  <div className="versions-table-row">
                    <div className="version-name">Persuasion AAR (Statement)</div>
                    <div className="version-number">4</div>
                    <div className="version-date">03/09/2024 08:50:18</div>
                    <div className="version-date">04/08/2025 15:19:32</div>
                    <div className="version-status"><span className="status-yes">Yes</span></div>
                    <div className="version-date">2025-04-08 15:19:32</div>
                    <div className="version-actions">
                      <button className="btn-view">View</button>
                      <button className="btn-restore">Restore</button>
                      <button className="btn-copy">Copy</button>
                    </div>
                  </div>
                  
                  <div className="versions-table-row">
                    <div className="version-name">Persuasion AAR</div>
                    <div className="version-number">3</div>
                    <div className="version-date">03/09/2024 08:43:12</div>
                    <div className="version-date">03/09/2024 08:50:18</div>
                    <div className="version-status"><span className="status-yes">Yes</span></div>
                    <div className="version-date">2024-03-09 08:50:18</div>
                    <div className="version-actions">
                      <button className="btn-view">View</button>
                      <button className="btn-restore">Restore</button>
                      <button className="btn-copy">Copy</button>
                    </div>
                  </div>
                  
                  <div className="versions-table-row">
                    <div className="version-name">Persuasion AAR</div>
                    <div className="version-number">2</div>
                    <div className="version-date">03/01/2024 11:08:29</div>
                    <div className="version-date">03/09/2024 08:43:12</div>
                    <div className="version-status"><span className="status-yes">Yes</span></div>
                    <div className="version-date">2024-03-09 08:43:12</div>
                    <div className="version-actions">
                      <button className="btn-view">View</button>
                      <button className="btn-restore">Restore</button>
                      <button className="btn-copy">Copy</button>
                    </div>
                  </div>
                  
                  <div className="versions-table-row">
                    <div className="version-name">Persuasion AAR</div>
                    <div className="version-number">1</div>
                    <div className="version-date">03/01/2024 09:55:06</div>
                    <div className="version-date">03/01/2024 11:08:29</div>
                    <div className="version-status"><span className="status-yes">Yes</span></div>
                    <div className="version-date">2024-03-01 11:08:29</div>
                    <div className="version-actions">
                      <button className="btn-view">View</button>
                      <button className="btn-restore">Restore</button>
                      <button className="btn-copy">Copy</button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
