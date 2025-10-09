# HypertroQ - Professional Exercise Science Coach

An AI-powered fitness coaching application that specializes in muscle hypertrophy training. The system uses your uploaded research, training protocols, and scientific literature to provide evidence-based guidance with the expertise of a professional exercise scientist.

## 🏋️ Features

### 💬 AI Chat Interface
- Professional exercise scientist persona with expertise in:
  - Exercise Physiology
  - Biomechanics 
  - Hypertrophy Science
  - Training Methodology
  - Recovery Science
- Chat history with delete functionality
- Knowledge base-restricted responses (only uses your uploaded content)
- **🌐 Multi-language Support**: Automatic Arabic language detection and response

### 📚 Knowledge Management System
- **File Upload**: Support for PDFs, Word documents, text files, and Markdown
- **PDF Viewing**: Direct in-browser PDF display with modal viewer
- **Text Content**: Add custom training notes and protocols
- **Search & Filter**: Find specific content quickly
- **File Management**: View, download, and delete knowledge items

### 🔐 Authentication & Security
- Supabase authentication integration
- User-specific data isolation
- Secure file storage and access

### 🌍 Language Support
- **Automatic Language Detection**: Detects Arabic text in user messages
- **Bilingual Responses**: Responds in Arabic when user prompts in Arabic
- **Fitness Terminology**: Uses proper Arabic scientific and fitness terminology
- **Context Awareness**: Maintains language consistency throughout conversations
- **Enhanced Text Formatting**: Proper RTL/LTR support for mixed Arabic/English content
- **Arabic-Aware Interface**: Dynamic input placeholders and text direction handling

See [ARABIC_SUPPORT.md](./ARABIC_SUPPORT.md) for language features and [ARABIC_TEXT_FORMATTING.md](./ARABIC_TEXT_FORMATTING.md) for text formatting details.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- PostgreSQL database (or Supabase account)
- Google Gemini API key

### Installation

1. **Clone and install dependencies:**
```bash
npm install
```

2. **Set up environment variables:**
Create a `.env.local` file with:
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key

# Database
DATABASE_URL=your_database_connection_string
```

3. **Set up the database:**
```bash
npx prisma migrate dev
```

4. **Run the development server:**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the application.

## 📖 How to Use

### 1. Upload Knowledge Base Content
- Navigate to the **Knowledge** page
- Upload research papers, training protocols, or add text content
- Supported formats: PDF, DOC/DOCX, TXT, MD
- The AI will only use this content for responses

### 2. Chat with HypertroQ
- Go to the **Chat** page
- Ask questions about training, exercise science, or protocols
- The AI responds with professional expertise based only on your uploaded content
- Previous chats are saved and can be deleted from the sidebar

### 3. View and Manage Content
- **Knowledge page**: View all your uploaded content
- **PDF Viewer**: Click "View" to see PDFs directly in the browser
- **Download**: Access your files anytime
- **Delete**: Remove content you no longer need

## 🧬 AI Expertise Areas

HypertroQ provides guidance in:
- **Exercise Physiology**: Muscle fiber types, metabolic pathways, adaptation mechanisms
- **Biomechanics**: Movement patterns, force vectors, joint mechanics
- **Hypertrophy Science**: Protein synthesis, mechanical tension, metabolic stress
- **Training Methodology**: Periodization, progressive overload, volume-intensity relationships
- **Recovery Science**: Sleep, nutrition timing, stress management

## 🛠️ Technology Stack

- **Frontend**: Next.js 15, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth
- **AI**: Google Gemini 2.0 Flash
- **File Processing**: Custom file processors for multiple formats
- **UI Components**: Radix UI, shadcn/ui

## 📁 Project Structure

```
hypertrophy-ai-nextjs/
├── src/
│   ├── app/          # Next.js app router
│   │   ├── api/      # API routes for chat, knowledge, conversations
│   │   ├── chat/     # Chat interface
│   │   ├── knowledge/# Knowledge management
│   │   └── auth/     # Authentication pages
│   ├── components/   # Reusable UI components
│   ├── lib/          # Utilities, database, AI integration
│   └── styles/       # Global styles
├── prisma/           # Database schema and Prisma migrations
├── public/           # Static assets
├── docs/             # 📄 Documentation files
├── scripts/          # 🔧 Utility and test scripts
├── migrations/       # 🗄️ SQL migration files
└── backups/          # 💾 Backup and archived data files
```

### Directory Organization

- **`docs/`** - All documentation, feature guides, and implementation notes
- **`scripts/`** - Testing, debugging, and database management scripts
- **`migrations/`** - Manual SQL migrations and Supabase configurations
- **`backups/`** - Database exports and configuration backups

For detailed information about each directory, see:
- [docs/README.md](./docs/README.md) - Documentation guide
- [scripts/README.md](./scripts/README.md) - Scripts usage guide
- [migrations/README.md](./migrations/README.md) - Migration guide
- [backups/README.md](./backups/README.md) - Backup procedures
- [docs/REPOSITORY_ORGANIZATION.md](./docs/REPOSITORY_ORGANIZATION.md) - Complete reorganization details

## 🔧 Configuration

### File Upload Limits
- Maximum file size: 10MB
- Supported types: PDF, DOC, DOCX, TXT, MD

### AI Model Settings
- Model: Gemini 2.0 Flash (Experimental)
- Temperature: 0.7 (Professional yet engaging)
- Max tokens: 3000 (Detailed scientific explanations)

## 🛠️ Development Scripts

Common development and maintenance scripts are located in the `scripts/` directory:

### Testing & Debugging
```bash
# Check AI configuration
node scripts/check-ai-config.js

# Debug RAG system
node scripts/debug-rag-system.js

# Test AI integration
node scripts/test-ai-integration.js
```

### Database Management
```bash
# Create admin user
node scripts/create-admin.js

# Backup database
node scripts/backup-data.js

# Check database status
node scripts/check-database-status.js
```

### Knowledge Base
```bash
# Reprocess knowledge base
node scripts/reprocess-knowledge-base.js

# Analyze knowledge content
node scripts/analyze-knowledge-base.js
```

See [scripts/README.md](./scripts/README.md) for a complete list of available scripts.

## 🚀 Deployment

The application can be deployed on Vercel, Netlify, or any platform supporting Next.js applications. Make sure to configure environment variables in your deployment platform.

## 📋 Requirements

- Professional use: Upload scientific literature, training protocols, or research
- The AI only responds based on your knowledge base content
- No generic responses - everything is grounded in your uploaded materials
