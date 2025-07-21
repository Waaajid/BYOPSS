# Prompt Builder MVP

A standalone web application for creating, testing, and managing AI prompts. Built with React frontend and Node.js backend.

## Features

- **Playground-style Interface**: Left sidebar for prompt management, right panel for editing and testing
- **Prompt Editor**: Create and edit prompts with system instructions and variable placeholders
- **Model Selection**: Choose between "4o - better overall" and "O3 - reasoning" models
- **Live Testing**: Test prompts with custom messages and see mock LLM responses
- **Prompt Management**: Save, edit, and delete prompts with persistent storage

## Project Structure

```
BYOPSS/
├── src/                    # React frontend
│   ├── App.jsx            # Main application component
│   ├── App.css            # Application styles
│   └── main.jsx           # Entry point
├── backend/               # Node.js API server
│   ├── server.js          # Express server with API routes
│   └── package.json       # Backend dependencies
├── package.json           # Frontend dependencies
└── README.md
```

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm

### Installation & Setup

1. **Install frontend dependencies:**
   ```bash
   npm install
   ```

2. **Install backend dependencies:**
   ```bash
   cd backend
   npm install
   ```

3. **Start the backend server:**
   ```bash
   cd backend
   npm start
   ```
   Backend will run on http://localhost:3001

4. **Start the frontend development server:**
   ```bash
   npm run dev
   ```
   Frontend will run on http://localhost:5173

### Usage

1. **Creating Prompts:**
   - Click "New Prompt" in the sidebar
   - Enter a name for your prompt
   - Select a model (4o or O3)
   - Write your system instructions using `{message}` as a placeholder
   - Click "Save"

2. **Testing Prompts:**
   - Enter a test message in the "Test Message" field
   - Click "Test" to see the mock LLM response
   - The response varies based on the selected model

3. **Managing Prompts:**
   - View all prompts in the left sidebar
   - Click any prompt to select and edit it
   - Use "Delete" button to remove unwanted prompts

## API Endpoints

- `GET /api/prompts` - Get all prompts
- `POST /api/prompts` - Create new prompt
- `PUT /api/prompts/:id` - Update existing prompt
- `DELETE /api/prompts/:id` - Delete prompt
- `POST /api/test-prompt` - Test prompt with message

## Technology Stack

- **Frontend**: React 18, Vite, CSS3
- **Backend**: Node.js, Express.js
- **Storage**: In-memory (for MVP)
- **Mock LLM**: Simulated responses based on model selection

## Future Enhancements

- Integration with real LLM APIs (OpenAI, Anthropic, etc.)
- Database persistence (PostgreSQL, MongoDB)
- User authentication and workspaces
- Advanced prompt templates and variables
- Prompt performance analytics
- Export/import functionality

## Development Notes

This is an MVP focused on core functionality. The mock LLM responses demonstrate the testing workflow and can be easily replaced with real API calls to language models.+ Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
