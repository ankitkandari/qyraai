# AI Customer Service Chatbot

> 🚀 **Intelligent customer support powered by Redis AI Stack**

An advanced AI-powered customer service chatbot that leverages Redis's powerful AI and data processing capabilities to deliver real-time, contextual customer support experiences.

## ✨ Features

- 🔍 **Vector Search** - Semantic search through knowledge base using Redis Vector Search
- 📢 **Pub/Sub Messaging** - Real time config updates using Redis Pub/Sub
- 📄 **Document Processing** - PDF upload and processing for knowledge base
- 🎨 **Modern UI** - Clean, responsive dashboard built with Next.js
- 🔧 **Embeddable Widget** - Easy-to-integrate chat widget for any website
- 🔐 **Authentication** - Secure user management and access control

## 🏗️ Architecture

### Components

```
├── 🖥️  client/          # Next.js Dashboard Application
├── ⚙️  server/          # Python Backend API
├── 🧩 widget/          # Embeddable Chat Widget
└── 📋 preview/         # Demo Site
```

### Tech Stack

**Frontend (Client)**
- Next.js 15 with TypeScript
- Tailwind CSS + shadcn/ui + radix-ui components
- React hooks for state management

**Backend (Server)**
- Python with Flask/FastAPI
- Redis Stack (AI, Vector Search, Streams, Pub/Sub, Gemini)
- Authentication & webhook handling

**Widget**
- React with TypeScript
- Vite for bundling
- CSS for styling

**Infrastructure**
- Redis Stack for all data operations
- WebSocket connections for real-time updates

## 🚀 Quick Start

### Prerequisites

- Node.js 22+ and Yarn
- Python 3.13+
- Redis Stack (with AI, Vector Search modules)

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd ai-customer-service-chatbot
```

### 2. Set Up Redis Stack

```bash
# Using Docker
docker run -d -p 6379:6379 -p 8001:8001 redis/redis-stack:latest

# Or use Redis Cloud
```

### 3. Configure Environment Variables

**Server Configuration:**
```bash
cd server
cp .env.example .env
# Edit .env with your configuration
```

**Client Configuration:**
```bash
cd client
cp .env.example .env
# Edit .env.local with your API endpoints
```

**Widget Configuration:**
```bash
cd widget
cp .env.example .env
# Edit .env with your server URL
```

### 4. Install Dependencies & Start

**Backend Server:**
```bash
cd server
pip install -r requirements.txt
uvicorn main:app --port 8000 --reload
```

**Frontend Client:**
```bash
cd client
yarn install
yarn dev
```

**Chat Widget:**
```bash
cd widget
yarn install
yarn dev
```

## 📊 Redis Components

### Vector Search
- **Purpose**: Semantic search through knowledge base documents
- **Index**: Stores document embeddings for similarity matching
- **Usage**: Finding relevant context for AI responses

### Redis Streams
- **Purpose**: For analytics and real-time data processing

### Pub/Sub
- **Purpose**: Real-time updates

### Gemini AI
- **Purpose**: AI model inference and response generation

## 🛠️ Development

### Widget Integration

Add to any website:
```html
<script src="https://your-domain.com/widget.js" data-client-id="client_id_goes_here"></script>
```

## 📈 Analytics & Monitoring

- **Real-time Metrics**: Message volume, response times, and user interactions
- **Knowledge Analytics**: Knowledge Base size, chunks processed, and more
- **User Analytics**: User chat sessions, etc

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License

## 🆘 Support

- 🐛 **Issues**: [GitHub Issues](https://github.com/your-username/your-repo/issues)

## 🙏 Acknowledgments

- Redis for the powerful AI and data processing capabilities
- Next.js team for the excellent React framework
- shadcn/ui for beautiful UI components
- All contributors and the open-source community

---

<div align="center">

**[⭐ Star this repo](https://github.com/your-username/your-repo)** • **[🐛 Report Bug](https://github.com/your-username/your-repo/issues)** • **[✨ Request Feature](https://github.com/your-username/your-repo/issues)**

Made with ❤️ and Redis

</div>