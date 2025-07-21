const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage for prompts (for MVP)
let prompts = [
  {
    id: 1,
    name: "Narrative Analysis",
    type: "Analysis",
    content: `Analyse the following {message} and tell me the narrative archetype and two possible supporting facts and two supporting emotions that would make the text stronger. Give a score 1 to 10 where ten means most persuasive {message}.
{message} = *{message}*

###RULES
Narrative archetypes are:
The Hero's Journey
Overcoming the Monster
The Quest
Rags to Riches
Rebirth
The Journey and Return
Comedy
Tragedy
The Underdog
Transformation

### Example output 
Score:#
Reasoning: ""
---
Narrative Archetype: ""
---
Emotions: Empowerment, Hope
---
Facts: Evident of successful community engagement, Statistical data`,
    model: "4o - better overall",
    version: "1.0",
    isLive: false,
    createdAt: new Date('2025-01-15T10:30:00Z'),
    lastUsed: new Date('2025-01-20T14:22:00Z'),
    usageCount: 15,
    testCount: 8,
    liveUsageCount: 7,
    versions: [
      {
        version: "1.0",
        content: `Original version with basic narrative analysis...`,
        createdAt: new Date('2025-01-15T10:30:00Z'),
        description: "Initial version with basic narrative archetype analysis"
      }
    ]
  }
];

// Predefined prompt types
let promptTypes = [
  "Analysis",
  "Assessment", 
  "Feedback",
  "Score",
  "AAR",
  "METHANE",
  "Flesch Reading Ease",
  "Persuasion",
  "SITEMP",
  "Instruction Assessment"
];

let nextId = 2;

// Routes
app.get('/api/prompts', (req, res) => {
  res.json(prompts);
});

app.get('/api/prompt-types', (req, res) => {
  res.json(promptTypes);
});

app.post('/api/prompt-types', (req, res) => {
  const { type } = req.body;
  if (type && !promptTypes.includes(type)) {
    promptTypes.push(type);
  }
  res.json(promptTypes);
});

app.post('/api/prompts', (req, res) => {
  const { name, type, content, model } = req.body;
  const now = new Date();
  const newPrompt = {
    id: nextId++,
    name,
    type,
    content,
    model,
    version: "1.0",
    isLive: false,
    createdAt: now,
    lastUsed: null,
    usageCount: 0,
    testCount: 0,
    liveUsageCount: 0,
    versions: [
      {
        version: "1.0",
        content,
        createdAt: now,
        description: "Initial version"
      }
    ]
  };
  prompts.push(newPrompt);
  res.json(newPrompt);
});

app.put('/api/prompts/:id', (req, res) => {
  const { id } = req.params;
  const { name, type, content, model, versionDescription } = req.body;
  
  const promptIndex = prompts.findIndex(p => p.id === parseInt(id));
  if (promptIndex === -1) {
    return res.status(404).json({ error: 'Prompt not found' });
  }
  
  const prompt = prompts[promptIndex];
  const now = new Date();
  
  // Check if content changed to create new version
  const contentChanged = prompt.content !== content;
  let newVersion = prompt.version;
  
  if (contentChanged) {
    // Auto-increment version (1.0 -> 1.1, 1.9 -> 2.0)
    const [major, minor] = prompt.version.split('.').map(Number);
    newVersion = minor >= 9 ? `${major + 1}.0` : `${major}.${minor + 1}`;
    
    // Add new version to history
    prompt.versions.push({
      version: newVersion,
      content,
      createdAt: now,
      description: versionDescription || `Updated to version ${newVersion}`
    });
  }
  
  // Update prompt
  prompts[promptIndex] = {
    ...prompt,
    name,
    type,
    content,
    model,
    version: newVersion
  };
  
  res.json(prompts[promptIndex]);
});

app.delete('/api/prompts/:id', (req, res) => {
  const { id } = req.params;
  prompts = prompts.filter(p => p.id !== parseInt(id));
  res.json({ message: 'Prompt deleted' });
});

app.post('/api/test-prompt', (req, res) => {
  const { prompt, message, model, promptId } = req.body;
  
  // Update usage stats if promptId provided
  if (promptId) {
    const promptIndex = prompts.findIndex(p => p.id === parseInt(promptId));
    if (promptIndex !== -1) {
      prompts[promptIndex].lastUsed = new Date();
      prompts[promptIndex].usageCount++;
      prompts[promptIndex].testCount++;
    }
  }
  
  // Mock response based on model
  let mockResponse;
  
  if (model === "O3 - reasoning") {
    mockResponse = `Score: 7
Reasoning: "The message demonstrates strong motivational elements but could benefit from more specific evidence and emotional resonance."
---
Narrative Archetype: "The Hero's Journey"
---
Emotions: Determination, Hope
---
Facts: Clear call to action present, Appeals to shared values`;
  } else {
    mockResponse = `Score: 8
Reasoning: "This message effectively combines logical appeal with emotional resonance, making it highly persuasive."
---
Narrative Archetype: "Overcoming the Monster"
---
Emotions: Empowerment, Unity
---
Facts: Statistical backing implied, Community engagement evident`;
  }
  
  // Simulate processing time
  setTimeout(() => {
    res.json({ response: mockResponse });
  }, 1000);
});

// Toggle live status
app.put('/api/prompts/:id/toggle-live', (req, res) => {
  const { id } = req.params;
  const promptIndex = prompts.findIndex(p => p.id === parseInt(id));
  
  if (promptIndex === -1) {
    return res.status(404).json({ error: 'Prompt not found' });
  }
  
  prompts[promptIndex].isLive = !prompts[promptIndex].isLive;
  res.json(prompts[promptIndex]);
});

// Get analytics data
app.get('/api/analytics', (req, res) => {
  const analytics = {
    totalPrompts: prompts.length,
    livePrompts: prompts.filter(p => p.isLive).length,
    totalUsage: prompts.reduce((sum, p) => sum + p.usageCount, 0),
    mostUsedPrompts: prompts
      .sort((a, b) => b.usageCount - a.usageCount)
      .slice(0, 5)
      .map(p => ({
        id: p.id,
        name: p.name,
        type: p.type,
        usageCount: p.usageCount,
        lastUsed: p.lastUsed
      })),
    recentActivity: prompts
      .filter(p => p.lastUsed)
      .sort((a, b) => new Date(b.lastUsed) - new Date(a.lastUsed))
      .slice(0, 10)
      .map(p => ({
        id: p.id,
        name: p.name,
        lastUsed: p.lastUsed,
        usageCount: p.usageCount
      }))
  };
  
  res.json(analytics);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
