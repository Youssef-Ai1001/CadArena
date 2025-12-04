# CAD ARENA - Full-Stack Conversational CAD Demo

A production-ready full-stack monorepo for CAD ARENA, featuring conversational CAD design through natural language. The backend is structured to seamlessly accommodate local LLM integration (Ollama/Gemini).

## Architecture

- **Backend**: FastAPI (Python) with SQLAlchemy ORM
- **Frontend**: Next.js 14 with TypeScript and Tailwind CSS
- **Database**: SQLite (for prototyping, structured for PostgreSQL)
- **Real-time**: WebSockets for live chat and DXF generation
- **Authentication**: JWT-based auth with password hashing

## Project Structure

```
CadArena/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── core/           # Configuration and security
│   │   ├── db/             # Database models and setup
│   │   ├── api/            # API routes
│   │   │   └── v1/
│   │   │       ├── auth.py
│   │   │       ├── projects.py
│   │   │       └── websocket.py
│   │   ├── services/       # Business logic (AI service)
│   │   └── main.py
│   └── requirements.txt
│
├── frontend/               # Next.js frontend
│   ├── app/               # Next.js app directory
│   ├── components/        # React components
│   ├── hooks/            # Custom hooks (WebSocket)
│   └── lib/              # API utilities
│
└── README.md
```

## Quick Start

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run the server:
```bash
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`
- API Docs: `http://localhost:8000/docs`
- Health Check: `http://localhost:8000/health`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file (optional):
```bash
echo "NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1" > .env.local
echo "NEXT_PUBLIC_WS_URL=ws://localhost:8000" >> .env.local
```

4. Run the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:3000`

## Features

### Backend

- ✅ User authentication (signup/login) with JWT tokens
- ✅ Project management (create, list, get projects)
- ✅ Real-time WebSocket endpoint for chat/DXF generation
- ✅ AI Service integrated with Ollama for real DXF generation
- ✅ Fallback to mock DXF if Ollama is unavailable
- ✅ Database models: User, Project, Conversation
- ✅ Password hashing with bcrypt
- ✅ CORS configuration for frontend integration

### Frontend

- ✅ Landing page with marketing content
- ✅ Authentication pages (login/signup)
- ✅ Dashboard to view and create projects
- ✅ Three-panel chat interface:
  - Sidebar: List of projects
  - Chat Panel: Conversation history and prompt input
  - Viewer Panel: DXF visualization and download
- ✅ Real-time WebSocket connection
- ✅ Professional DXF viewer with zoom, pan, and multi-entity support

## API Endpoints

### Authentication
- `POST /api/v1/auth/signup` - Register new user
- `POST /api/v1/auth/login` - Login and get JWT token

### Projects
- `GET /api/v1/projects` - List user's projects
- `POST /api/v1/projects` - Create new project
- `GET /api/v1/projects/{id}` - Get specific project

### WebSocket
- `WS /api/v1/ws/chat/{project_id}?token={jwt}` - Real-time chat endpoint

## Ollama Integration

The application uses **Ollama** for AI-powered CAD generation. The AI service is located at `backend/app/services/ai_service.py`.

### Setting Up Ollama

1. **Install Ollama**: Visit [ollama.ai](https://ollama.ai) and install Ollama on your system.

2. **Pull a Model**: Download a model (recommended: llama3.2 or llama3.1)
   ```bash
   ollama pull llama3.2
   ```

3. **Start Ollama**: Ollama runs as a service. Make sure it's running:
   ```bash
   ollama serve
   ```
   By default, Ollama runs on `http://localhost:11434`.

4. **Configure Backend** (optional): Create a `.env` file in the `backend/` directory:
   ```env
   OLLAMA_BASE_URL=http://localhost:11434
   OLLAMA_MODEL=llama3.2
   ```

### How It Works

The `CADArenaAIService` class:
- Sends prompts to Ollama with a specialized system prompt for DXF generation
- Extracts clean DXF code from Ollama's response
- Falls back to mock DXF if Ollama is unavailable

The service automatically handles:
- Prompt formatting and system instructions
- Response parsing and DXF extraction
- Error handling and timeouts
- Fallback to mock data if needed

## Database

The application uses SQLite by default. The database file (`cadarena.db`) will be created automatically on first run. To use PostgreSQL, update the `DATABASE_URL` in `backend/app/core/config.py`.

## Environment Variables

### Backend

Create a `.env` file in the `backend/` directory (optional):

```env
DATABASE_URL=sqlite:///./cadarena.db
SECRET_KEY=your-secret-key-change-in-production
CORS_ORIGINS=["http://localhost:3000"]
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
```

### Frontend

Create a `.env.local` file in the `frontend/` directory (optional):

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

## Development

### Running Both Services

Terminal 1 (Backend):
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000
```

Terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```

### Testing the Application

1. Open `http://localhost:3000`
2. Sign up for a new account
3. Create a project
4. Enter a prompt like "Draw a line from point 10,10 to 50,50"
5. Watch the DXF generate in real-time
6. Download the DXF file

## Software Engineering Best Practices

- ✅ **Type Safety**: Pydantic models for backend validation, TypeScript throughout frontend
- ✅ **Modularity**: Separated models, schemas, services, and API routers
- ✅ **Error Handling**: Exception handling in WebSocket and API endpoints
- ✅ **Security**: Password hashing with bcrypt, JWT authentication
- ✅ **Scalability**: Structured for easy LLM integration and database migration

## Features Highlights

- 🎨 **Professional Design**: Modern UI with custom branding, logos, and color scheme
- 🤖 **Ollama Integration**: Real AI-powered CAD generation using local LLM
- 📐 **Advanced DXF Viewer**: Interactive viewer with zoom, pan, and multi-entity support
- ⚡ **Real-Time Updates**: WebSocket-based live generation and updates
- 🔐 **Secure Authentication**: JWT-based auth with password hashing
- 📱 **Responsive Design**: Works seamlessly on all device sizes

## Next Steps

1. **Enhanced DXF Parser**: Add support for more entity types (POLYLINE, SPLINE, etc.)
2. **PostgreSQL Migration**: Switch from SQLite to PostgreSQL for production
3. **Error Recovery**: Implement retry logic and better error messages
4. **Testing**: Add unit and integration tests
5. **Model Fine-tuning**: Fine-tune Ollama models specifically for CAD generation

## License

This project is built as a demonstration application.

