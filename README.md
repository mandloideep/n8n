# 🔄 Workflow Builder

A visual workflow automation tool, inspired by n8n. Built with React and FastAPI — create powerful automations by connecting your favorite apps and services without writing code.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Python](https://img.shields.io/badge/python-3.11+-green.svg)
![React](https://img.shields.io/badge/react-18+-blue.svg)

## ✨ Features

- **Visual Workflow Builder** - Drag-and-drop interface using ReactFlow
- **Multiple Integrations** - Telegram, Email (Gmail), Slack support
- **Webhook Triggers** - Unique webhook URLs for each workflow
- **Secure Credentials** - Store API keys and tokens securely
- **Real-time Execution** - Test and execute workflows instantly
- **Modern UI** - Dark theme with glassmorphism effects

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development
- **ReactFlow** for visual workflow canvas
- **Zustand** for state management
- **Tailwind CSS** + shadcn/ui components
- **Axios** for API communication

### Backend
- **FastAPI** (Python)
- **SQLAlchemy** + SQLite
- **JWT Authentication**
- **Pydantic** for validation

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Python 3.11+
- [uv](https://github.com/astral-sh/uv) (Python package manager)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/mandloideep/n8n.git
   cd n8n
   ```

2. **Start the Backend**
   ```bash
   cd backend
   uv sync
   uv run uvicorn main:app --reload --port 8001
   ```

3. **Start the Frontend** (new terminal)
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Open the app**
   - Frontend: http://localhost:8080
   - API Docs: http://localhost:8001/docs

## 📁 Project Structure

```
n8n/
├── backend/
│   ├── core/           # Configuration
│   ├── db/             # Database setup
│   ├── executor/       # Workflow execution engine
│   ├── models/         # SQLAlchemy models
│   ├── routers/        # API endpoints
│   │   ├── auth.py     # Authentication
│   │   ├── credential.py
│   │   ├── webhook.py
│   │   └── workflow.py
│   ├── schemas/        # Pydantic schemas
│   └── main.py         # FastAPI app
│
├── frontend/
│   ├── src/
│   │   ├── components/ # React components
│   │   │   ├── credentials/
│   │   │   ├── layout/
│   │   │   ├── ui/     # shadcn components
│   │   │   └── workflow/
│   │   ├── contexts/   # React contexts
│   │   ├── pages/      # Page components
│   │   ├── services/   # API services
│   │   ├── store/      # Zustand stores
│   │   └── types/      # TypeScript types
│   └── package.json
│
└── README.md
```

## 🔌 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/signup` | Create new user |
| POST | `/auth/signin` | Login, returns JWT |

### Workflows
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/workf/workflow` | List all workflows |
| POST | `/workf/workflow` | Create workflow |
| PUT | `/workf/workflow/{id}` | Update workflow |
| DELETE | `/workf/workflow/{id}` | Delete workflow |

### Credentials
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/credential/credential` | List credentials |
| POST | `/credential/credential` | Create credential |
| DELETE | `/credential/credential/{id}` | Delete credential |

### Webhooks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/webh/webhook/{path}` | Execute via webhook |
| POST | `/webh/webhook/test/{id}` | Test execution |

## 🔐 Environment Variables

### Backend (.env)
```env
SECRET_KEY=your-jwt-secret-key
DATABASE_URL=sqlite:///./test.db
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:8001
```

## 🎨 Screenshots

The application features a modern dark theme with:
- Gradient hero section on landing page
- Glassmorphism effects on cards
- Interactive workflow canvas with node visualization
- Platform-specific icons and colors

## 📝 Creating a Workflow

1. **Sign up/Login** at `/auth`
2. **Create Workflow** - Click "Create Workflow" button
3. **Add Nodes** - Use the panel to add Trigger, Telegram, Email, or Slack nodes
4. **Connect Nodes** - Drag from one node's handle to another
5. **Configure** - Click a node to configure its settings
6. **Add Credentials** - Select or create credentials for integrations
7. **Save & Execute** - Save your workflow and test it!

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Inspired by [n8n.io](https://n8n.io)
- Built with [ReactFlow](https://reactflow.dev)
- UI components from [shadcn/ui](https://ui.shadcn.com)

---

**Made with ❤️ for automation enthusiasts**
