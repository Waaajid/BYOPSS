<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

This is a Prompt Builder application for creating and testing AI prompts. The application consists of:

1. **Frontend (React + Vite)**: A playground-style interface with left sidebar for prompt management and right panel for editing/testing
2. **Backend (Node.js + Express)**: API server for prompt CRUD operations and mock LLM testing

## Key Features:
- Create, edit, save, and delete prompts
- Test prompts with custom messages using mock LLM responses
- Support for two model types: "4o - better overall" and "O3 - reasoning"
- Variable substitution using {message} placeholder
- Clean, responsive UI similar to OpenAI Playground

## Architecture:
- Frontend runs on port 3000 (Vite dev server)
- Backend API runs on port 3001 (Express server)
- In-memory prompt storage for MVP (no database required)
- CORS enabled for local development

## Development workflow:
- Use React hooks for state management
- Fetch API for backend communication
- CSS modules for styling
- Mock responses for LLM testing (can be replaced with real LLM later)
